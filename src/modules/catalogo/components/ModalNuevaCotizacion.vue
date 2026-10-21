<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { cotizacionesService } from '../services/cotizaciones.service';
import { catalogoService } from '@/modules/comunicaciones/services/catalogo.service';
import { clienteService } from '@/modules/clientes/services/cliente.service';
import type { Cliente } from '@/modules/clientes/types/cliente.types';
import type { ItemCatalogo } from '@/modules/comunicaciones/types/catalogo.types';
import type { ItemCotizacion } from '../types/catalogo.types';
import { formatCurrency } from '@/core/formatters/formatters';
import { 
  X, 
  Trash2, 
  Calculator, 
  Check, 
  Loader2
} from 'lucide-vue-next';
import { toastService } from '@/core/notifications/toast.service';

const props = defineProps<{
  abierto: boolean;
  clientePreseleccionado?: Cliente | null;
}>();

const emit = defineEmits<{
  (e: 'cerrar'): void;
  (e: 'creada', id: string): void;
}>();

const clientes = ref<Cliente[]>([]);
const cargandoClientes = ref(false);
const clienteSeleccionadoId = ref(props.clientePreseleccionado?.id || '');

const catalogoItems = computed<ItemCatalogo[]>(() => catalogoService.obtenerCatalogo());

const lineas = ref<ItemCotizacion[]>([]);
const notas = ref('Incluye soporte técnico prioritario y garantía de servicio durante el período de contratación.');
const terminos = ref('Forma de pago: 50% al ordenar y 50% contra entrega. Cotización válida por 30 días.');

const hoy = new Date().toISOString().slice(0, 10);
const fechaVencimiento = ref(
  new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10)
);

const guardando = ref(false);

onMounted(async () => {
  cargandoClientes.value = true;
  try {
    const res = await clienteService.obtenerClientes({
      pagina: 1,
      tamanoPagina: 100,
      busqueda: '',
      ordenCampo: 'creado_en',
      ordenDireccion: 'desc',
      estado: '',
      sector: '',
    });
    clientes.value = res.datos;
    if (!clienteSeleccionadoId.value && clientes.value.length > 0) {
      clienteSeleccionadoId.value = clientes.value[0].id;
    }
  } finally {
    cargandoClientes.value = false;
  }

  // Agregar 1 línea por defecto desde el catálogo
  if (catalogoItems.value.length > 0) {
    agregarLineaDesdeCatalogo(catalogoItems.value[0].id);
  }
});

const clienteActual = computed<Cliente | undefined>(() => {
  return clientes.value.find((c) => c.id === clienteSeleccionadoId.value);
});

const agregarLineaDesdeCatalogo = (itemId: string) => {
  const item = catalogoItems.value.find((i) => i.id === itemId);
  if (!item) return;

  const precio = item.precioBase;
  const cant = 1;
  const desc = 0;
  const itbis = item.aplicaItbis ? precio * 0.18 : 0;
  const total = precio + itbis;

  lineas.value.push({
    id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    producto_id: item.id,
    sku: item.codigo,
    descripcion: item.nombre,
    cantidad: cant,
    precio_unitario: precio,
    descuento_porcentaje: desc,
    itbis_aplica: item.aplicaItbis,
    monto_itbis: itbis,
    total_linea: total,
  });
};

const recalcularLinea = (linea: ItemCotizacion) => {
  const cant = Math.max(1, isNaN(linea.cantidad) ? 1 : Number(linea.cantidad));
  const precio = Math.max(0, isNaN(linea.precio_unitario) ? 0 : Number(linea.precio_unitario));
  const desc = Math.min(100, Math.max(0, isNaN(linea.descuento_porcentaje) ? 0 : Number(linea.descuento_porcentaje)));

  const subtotal = cant * precio;
  const montoDesc = subtotal * (desc / 100);
  const baseImponible = subtotal - montoDesc;
  const itbis = linea.itbis_aplica ? baseImponible * 0.18 : 0;
  const total = baseImponible + itbis;

  linea.cantidad = cant;
  linea.precio_unitario = precio;
  linea.descuento_porcentaje = desc;
  linea.monto_itbis = Math.round(itbis * 100) / 100;
  linea.total_linea = Math.round(total * 100) / 100;
};

const eliminarLinea = (index: number) => {
  lineas.value.splice(index, 1);
};

const subtotalGeneral = computed(() => {
  return lineas.value.reduce((acc, l) => acc + (l.cantidad * l.precio_unitario), 0);
});

const descuentoGeneral = computed(() => {
  return lineas.value.reduce((acc, l) => {
    const sub = l.cantidad * l.precio_unitario;
    return acc + (sub * (l.descuento_porcentaje / 100));
  }, 0);
});

const itbisGeneral = computed(() => {
  return lineas.value.reduce((acc, l) => acc + l.monto_itbis, 0);
});

const totalGeneral = computed(() => {
  return lineas.value.reduce((acc, l) => acc + l.total_linea, 0);
});

const guardarCotizacion = () => {
  if (!clienteActual.value) {
    toastService.advertencia('Debe seleccionar un cliente destinatario.');
    return;
  }
  if (lineas.value.length === 0) {
    toastService.advertencia('Debe incluir al menos un ítem o servicio en la cotización.');
    return;
  }

  guardando.value = true;
  try {
    const nueva = cotizacionesService.guardar({
      cliente_id: clienteActual.value.id,
      cliente_nombre: clienteActual.value.nombre_comercial || clienteActual.value.razon_social,
      cliente_rnc: clienteActual.value.identificacion_fiscal,
      cliente_telefono: clienteActual.value.telefono,
      cliente_email: clienteActual.value.email,
      contacto_nombre: clienteActual.value.contactos?.[0]?.nombre,
      fecha_emision: hoy,
      fecha_vencimiento: fechaVencimiento.value,
      estado: 'enviada',
      items: lineas.value,
      subtotal: subtotalGeneral.value,
      descuento_porcentaje: subtotalGeneral.value > 0 ? (descuentoGeneral.value / subtotalGeneral.value) * 100 : 0,
      descuento_monto: descuentoGeneral.value,
      itbis_total: itbisGeneral.value,
      total: totalGeneral.value,
      moneda: 'DOP',
      notas: notas.value,
      terminos_condiciones: terminos.value,
    });

    toastService.exito(`Cotización ${nueva.numero_cotizacion} generada con éxito.`);
    emit('creada', nueva.id);
    emit('cerrar');
  } catch (err: unknown) {
    toastService.error(err instanceof Error ? err.message : 'Error al guardar cotización');
  } finally {
    guardando.value = false;
  }
};
</script>

<template>
  <div
    v-if="abierto"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-sm animate-in fade-in"
  >
    <div class="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-xs">
      <!-- Cabecera -->
      <div class="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-950/60 shrink-0">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Calculator class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Generador de Cotización Comercial (CPQ)
            </h3>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
              Desglose de servicios, cálculo automático de ITBIS 18% y enlace de aprobación
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="emit('cerrar')"
          class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Cuerpo con Scroll -->
      <div class="p-6 overflow-y-auto space-y-5 flex-1">
        <!-- Selección de Cliente y Fechas -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80">
          <div>
            <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Cliente Destinatario *
            </label>
            <select
              v-model="clienteSeleccionadoId"
              class="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option v-for="c in clientes" :key="c.id" :value="c.id">
                {{ c.nombre_comercial || c.razon_social }} (RNC: {{ c.identificacion_fiscal || 'N/A' }})
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Fecha Emisión
              </label>
              <input
                :value="hoy"
                disabled
                class="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-500 text-xs font-mono"
              />
            </div>
            <div>
              <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Vence el *
              </label>
              <input
                v-model="fechaVencimiento"
                type="date"
                class="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        <!-- Selector Rápido de Ítems del Catálogo -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-semibold text-zinc-900 dark:text-zinc-100">
              Partidas y Servicios Incluidos ({{ lineas.length }})
            </span>
            <div class="flex items-center gap-2">
              <select
                @change="(e: any) => e.target.value && agregarLineaDesdeCatalogo(e.target.value)"
                class="px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-200 text-xs"
              >
                <option value="">+ Agregar ítem desde Catálogo...</option>
                <option v-for="item in catalogoItems" :key="item.id" :value="item.id">
                  {{ item.codigo }} - {{ item.nombre }} (RD$ {{ item.precioBase.toLocaleString() }})
                </option>
              </select>
            </div>
          </div>

          <!-- Tabla de Ítems Dinámicos -->
          <div class="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <table class="w-full text-left text-xs">
              <thead class="bg-zinc-100 dark:bg-zinc-950/80 text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th class="py-2.5 px-3">SKU / Concepto</th>
                  <th class="py-2.5 px-3 w-20 text-center">Cant.</th>
                  <th class="py-2.5 px-3 w-28 text-right">Precio (RD$)</th>
                  <th class="py-2.5 px-3 w-20 text-center">Desc %</th>
                  <th class="py-2.5 px-3 w-20 text-center">ITBIS</th>
                  <th class="py-2.5 px-3 w-28 text-right">Total</th>
                  <th class="py-2.5 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800">
                <tr v-for="(l, idx) in lineas" :key="l.id" class="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                  <td class="py-2 px-3">
                    <input
                      v-model="l.descripcion"
                      type="text"
                      class="w-full px-2 py-1 bg-transparent border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 rounded text-zinc-900 dark:text-zinc-100 font-medium"
                    />
                    <span class="text-[10px] text-zinc-400 font-mono block pl-2">{{ l.sku }}</span>
                  </td>
                  <td class="py-2 px-3 text-center">
                    <input
                      v-model.number="l.cantidad"
                      @input="recalcularLinea(l)"
                      type="number"
                      min="1"
                      class="w-16 px-2 py-1 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded font-mono"
                    />
                  </td>
                  <td class="py-2 px-3 text-right">
                    <input
                      v-model.number="l.precio_unitario"
                      @input="recalcularLinea(l)"
                      type="number"
                      min="0"
                      class="w-24 px-2 py-1 text-right bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded font-mono"
                    />
                  </td>
                  <td class="py-2 px-3 text-center">
                    <input
                      v-model.number="l.descuento_porcentaje"
                      @input="recalcularLinea(l)"
                      type="number"
                      min="0"
                      max="100"
                      class="w-14 px-1.5 py-1 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded font-mono"
                    />
                  </td>
                  <td class="py-2 px-3 text-center">
                    <input
                      v-model="l.itbis_aplica"
                      @change="recalcularLinea(l)"
                      type="checkbox"
                      class="rounded bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-0 cursor-pointer"
                      title="Aplica 18% ITBIS"
                    />
                  </td>
                  <td class="py-2 px-3 text-right font-mono font-bold text-zinc-900 dark:text-white">
                    {{ formatCurrency(l.total_linea) }}
                  </td>
                  <td class="py-2 px-2 text-center">
                    <button
                      type="button"
                      @click="eliminarLinea(idx)"
                      class="p-1 text-zinc-400 hover:text-rose-500 rounded transition"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Notas y Resumen Financiero -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-3">
            <div>
              <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Notas y Alcance Comercial
              </label>
              <textarea
                v-model="notas"
                rows="2"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500"
              ></textarea>
            </div>
            <div>
              <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Términos & Condiciones
              </label>
              <textarea
                v-model="terminos"
                rows="2"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500"
              ></textarea>
            </div>
          </div>

          <!-- Cuadro de Totales -->
          <div class="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs self-start">
            <div class="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>Subtotal Bruto:</span>
              <span class="font-mono">{{ formatCurrency(subtotalGeneral) }}</span>
            </div>
            <div v-if="descuentoGeneral > 0" class="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Descuento Comercial:</span>
              <span class="font-mono">-{{ formatCurrency(descuentoGeneral) }}</span>
            </div>
            <div class="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>ITBIS Fiscal (18%):</span>
              <span class="font-mono">{{ formatCurrency(itbisGeneral) }}</span>
            </div>
            <div class="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-sm font-bold text-zinc-900 dark:text-white">
              <span>Total Cotizado:</span>
              <span class="font-mono text-base text-indigo-600 dark:text-indigo-400">
                {{ formatCurrency(totalGeneral) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pie de Acciones -->
      <div class="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 flex justify-end gap-2 shrink-0">
        <button
          type="button"
          @click="emit('cerrar')"
          class="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition"
        >
          Cancelar
        </button>

        <button
          type="button"
          @click="guardarCotizacion"
          :disabled="guardando"
          class="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50"
        >
          <Loader2 v-if="guardando" class="w-4 h-4 animate-spin" />
          <Check v-else class="w-4 h-4" />
          <span>{{ guardando ? 'Guardando...' : 'Generar Cotización & Activar Portal' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
