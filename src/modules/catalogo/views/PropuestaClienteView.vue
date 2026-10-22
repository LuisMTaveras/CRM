<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { cotizacionesService } from '../services/cotizaciones.service';
import { empresaService } from '@/modules/configuracion/services/empresa.service';
import type { Cotizacion } from '../types/catalogo.types';
import { formatCurrency, formatDate } from '@/core/formatters/formatters';
import { 
  Building2, 
  Clock, 
  FileCheck2, 
  ShieldCheck, 
  Download, 
  AlertCircle,
  Calendar,
  UserCheck,
  Check,
  Loader2
} from 'lucide-vue-next';
import { toastService } from '@/core/notifications/toast.service';

const route = useRoute();
const token = computed(() => route.params.token as string);

const cotizacion = ref<Cotizacion | null>(null);
const perfilEmpresa = computed(() => empresaService.datos.value);
const cargando = ref(true);
const error = ref('');

const nombreFirmante = ref('');
const cargoFirmante = ref('');
const aceptoTerminos = ref(false);
const procesandoAprobacion = ref(false);
const aprobacionExitosa = ref(false);

onMounted(() => {
  cargarCotizacion();
});

const cargarCotizacion = () => {
  cargando.value = true;
  error.value = '';
  try {
    const data = cotizacionesService.obtenerPorToken(token.value);
    if (!data) {
      error.value = 'La propuesta comercial solicitada no existe o el enlace ha caducado.';
    } else {
      cotizacion.value = data;
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Error al cargar la propuesta';
  } finally {
    cargando.value = false;
  }
};

const confirmarAprobacion = async () => {
  if (!cotizacion.value) return;
  if (!nombreFirmante.value.trim()) {
    toastService.advertencia('Por favor ingrese su nombre y apellido completo.');
    return;
  }
  if (!cargoFirmante.value.trim()) {
    toastService.advertencia('Por favor indique su cargo o posición directiva.');
    return;
  }
  if (!aceptoTerminos.value) {
    toastService.advertencia('Debe confirmar la aceptación de los términos comerciales.');
    return;
  }

  procesandoAprobacion.value = true;
  try {
    // Simular firma digital y actualizar estado en CRM
    await new Promise((resolve) => setTimeout(resolve, 800));
    const actualizada = cotizacionesService.aprobarPropuestaPorCliente(token.value, {
      nombre: nombreFirmante.value,
      cargo: cargoFirmante.value,
    });
    cotizacion.value = actualizada;
    aprobacionExitosa.value = true;
    toastService.exito('¡Propuesta aprobada y confirmada con éxito!');
  } catch (err: unknown) {
    toastService.error(err instanceof Error ? err.message : 'Error al procesar la aprobación');
  } finally {
    procesandoAprobacion.value = false;
  }
};

const imprimirPropuesta = () => {
  window.print();
};
</script>

<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans antialiased selection:bg-indigo-500/20">
    <!-- Barra Superior Corporativa -->
    <header class="border-b border-zinc-200 dark:border-white/[0.08] bg-white/80 dark:bg-zinc-950/80 backdrop-blur sticky top-0 z-30 print:hidden">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm shadow-indigo-600/30">
            <Building2 class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-sm font-bold text-zinc-900 dark:text-white leading-tight">
              {{ perfilEmpresa.nombreComercial || perfilEmpresa.razonSocial || 'Alliance' }}
            </h1>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
              Portal Oficial de Aprobación de Propuestas
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="imprimirPropuesta"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-200 transition shadow-sm"
          >
            <Download class="w-3.5 h-3.5" />
            <span>Descargar / Imprimir</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Contenedor Principal -->
    <main class="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
      <!-- Estado de Carga -->
      <div v-if="cargando" class="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 class="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mb-3" />
        <p class="text-sm text-zinc-500 dark:text-zinc-400">Cargando propuesta comercial...</p>
      </div>

      <!-- Alerta de Error -->
      <div v-else-if="error" class="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center max-w-md mx-auto my-12">
        <AlertCircle class="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 class="font-bold text-sm text-rose-600 dark:text-rose-400 mb-1">Enlace no válido</h3>
        <p class="text-xs text-zinc-600 dark:text-zinc-400 mb-4">{{ error }}</p>
      </div>

      <!-- Detalle de la Cotización -->
      <div v-else-if="cotizacion" class="space-y-6">
        <!-- Banner de Estado de Aprobación -->
        <div 
          v-if="cotizacion.estado === 'aprobada'"
          class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck class="w-6 h-6" />
            </div>
            <div>
              <div class="font-bold text-sm text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                <span>Propuesta Aprobada Formalmente</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono">
                  CONFIRMADA
                </span>
              </div>
              <p class="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                Aprobada por <strong>{{ cotizacion.aprobado_por_nombre }}</strong> ({{ cotizacion.aprobado_por_cargo }}) el {{ formatDate(cotizacion.aprobado_en) }}.
              </p>
            </div>
          </div>
          <span class="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-white/60 dark:bg-black/30 px-3 py-1 rounded-lg border border-emerald-500/20">
            ID: {{ cotizacion.token_aprobacion.slice(0, 16) }}
          </span>
        </div>

        <div 
          v-else
          class="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-3"
        >
          <Clock class="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div class="text-xs text-indigo-950 dark:text-indigo-200">
            Esta propuesta comercial está vigente hasta el <strong>{{ formatDate(cotizacion.fecha_vencimiento) }}</strong>. Puede revisarla y aceptarla digitalmente al final del documento.
          </div>
        </div>

        <!-- Tarjeta Principal del Documento -->
        <div class="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
          <!-- Cabecera de la Cotización -->
          <div class="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <span class="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Cotización Comercial Oficial
              </span>
              <h2 class="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mt-1">
                {{ cotizacion.numero_cotizacion }}
              </h2>
              <div class="flex flex-wrap items-center gap-4 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span class="flex items-center gap-1.5">
                  <Calendar class="w-3.5 h-3.5 text-zinc-400" />
                  Emisión: {{ formatDate(cotizacion.fecha_emision) }}
                </span>
                <span class="flex items-center gap-1.5">
                  <Clock class="w-3.5 h-3.5 text-zinc-400" />
                  Vencimiento: {{ formatDate(cotizacion.fecha_vencimiento) }}
                </span>
              </div>
            </div>

            <!-- Datos del Emisor -->
            <div class="sm:text-right text-xs text-zinc-600 dark:text-zinc-400 space-y-0.5">
              <p class="font-bold text-zinc-900 dark:text-white text-sm">{{ perfilEmpresa.nombreComercial || perfilEmpresa.razonSocial }}</p>
              <p v-if="perfilEmpresa.identificacionFiscal">RNC: {{ perfilEmpresa.identificacionFiscal }}</p>
              <p v-if="perfilEmpresa.telefono">{{ perfilEmpresa.telefono }}</p>
              <p v-if="perfilEmpresa.correo">{{ perfilEmpresa.correo }}</p>
              <p v-if="perfilEmpresa.direccion">{{ perfilEmpresa.direccion }}{{ perfilEmpresa.ciudad ? ', ' + perfilEmpresa.ciudad : '' }}</p>
            </div>
          </div>

          <!-- Datos del Cliente Destinatario -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 text-xs">
            <div>
              <span class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                Presentada Para:
              </span>
              <p class="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                {{ cotizacion.cliente_nombre }}
              </p>
              <p v-if="cotizacion.cliente_rnc" class="text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                RNC: {{ cotizacion.cliente_rnc }}
              </p>
              <p v-if="cotizacion.contacto_nombre" class="text-zinc-600 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
                <UserCheck class="w-3.5 h-3.5 text-zinc-400" />
                Atención: {{ cotizacion.contacto_nombre }}
              </p>
            </div>

            <div class="space-y-1 sm:text-right sm:self-center">
              <span class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                Moneda & Términos:
              </span>
              <p class="font-medium text-zinc-800 dark:text-zinc-200">
                Moneda de Transacción: <strong>Pesos Dominicanos (DOP)</strong>
              </p>
              <p class="text-zinc-500 dark:text-zinc-400">
                Impuestos: <strong>ITBIS 18% Incluido / Desglosado</strong>
              </p>
            </div>
          </div>

          <!-- Tabla de Servicios y Productos -->
          <div class="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table class="w-full text-left text-xs">
              <thead class="bg-zinc-100 dark:bg-zinc-950/80 text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th class="py-3 px-4 font-semibold">SKU / Ítem</th>
                  <th class="py-3 px-4 font-semibold">Descripción del Servicio</th>
                  <th class="py-3 px-4 font-semibold text-center">Cant.</th>
                  <th class="py-3 px-4 font-semibold text-right">Precio Unit.</th>
                  <th class="py-3 px-4 font-semibold text-right">ITBIS (18%)</th>
                  <th class="py-3 px-4 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800">
                <tr v-for="item in cotizacion.items" :key="item.id" class="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                  <td class="py-3 px-4 font-mono font-medium text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                    {{ item.sku }}
                  </td>
                  <td class="py-3 px-4 text-zinc-800 dark:text-zinc-200">
                    {{ item.descripcion }}
                  </td>
                  <td class="py-3 px-4 text-center font-mono text-zinc-700 dark:text-zinc-300">
                    {{ item.cantidad }}
                  </td>
                  <td class="py-3 px-4 text-right font-mono text-zinc-700 dark:text-zinc-300">
                    {{ formatCurrency(item.precio_unitario) }}
                  </td>
                  <td class="py-3 px-4 text-right font-mono text-zinc-500 dark:text-zinc-400">
                    {{ formatCurrency(item.monto_itbis) }}
                  </td>
                  <td class="py-3 px-4 text-right font-mono font-bold text-zinc-900 dark:text-white">
                    {{ formatCurrency(item.total_linea) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Totales Financieros -->
          <div class="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
            <div class="sm:max-w-md text-xs space-y-2">
              <h4 class="font-semibold text-zinc-900 dark:text-zinc-100">Notas & Observaciones</h4>
              <p class="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {{ cotizacion.notas || 'No aplican observaciones adicionales.' }}
              </p>
              <h4 class="font-semibold text-zinc-900 dark:text-zinc-100 pt-2">Términos Comerciales</h4>
              <p class="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {{ cotizacion.terminos_condiciones || 'Pago 50% al ordenar y 50% contra entrega. Precios no incluyen retenciones aplicables.' }}
              </p>
            </div>

            <!-- Cuadro de Totales -->
            <div class="w-full sm:w-72 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 space-y-2.5 text-xs">
              <div class="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Subtotal Bruto:</span>
                <span class="font-mono">{{ formatCurrency(cotizacion.subtotal) }}</span>
              </div>
              <div v-if="cotizacion.descuento_monto > 0" class="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Descuento Comercial:</span>
                <span class="font-mono">-{{ formatCurrency(cotizacion.descuento_monto) }}</span>
              </div>
              <div class="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>ITBIS (18%):</span>
                <span class="font-mono">{{ formatCurrency(cotizacion.itbis_total) }}</span>
              </div>
              <div class="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-sm font-bold text-zinc-900 dark:text-white">
                <span>Total a Pagar:</span>
                <span class="font-mono text-base text-indigo-600 dark:text-indigo-400">
                  {{ formatCurrency(cotizacion.total) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Módulo de Aprobación Digital -->
          <div class="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800 print:hidden">
            <!-- Si está aprobada -->
            <div v-if="cotizacion.estado === 'aprobada'" class="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
              <FileCheck2 class="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <h3 class="font-bold text-base text-emerald-900 dark:text-emerald-200">
                Aprobación Formal Registrada
              </h3>
              <p class="text-xs text-emerald-800 dark:text-emerald-300 max-w-md mx-auto">
                Este documento ha sido confirmado formalmente. Se ha notificado al equipo comercial para iniciar la fase operativa.
              </p>
              <div class="pt-2 text-[11px] font-mono text-zinc-500">
                Código de verificación: {{ cotizacion.token_aprobacion }}
              </div>
            </div>

            <!-- Si está pendiente de aprobación -->
            <div v-else class="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <UserCheck class="w-5 h-5" />
                </div>
                <div>
                  <h3 class="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    Aceptación y Confirmación Digital
                  </h3>
                  <p class="text-xs text-zinc-500 dark:text-zinc-400">
                    Al confirmar esta propuesta, usted autoriza el inicio de los trabajos según las condiciones descritas.
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Nombre del Firmante Autorizado *
                  </label>
                  <input
                    v-model="nombreFirmante"
                    type="text"
                    placeholder="Ej: Lic. Carlos Gómez"
                    class="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Cargo / Posición en la Empresa *
                  </label>
                  <input
                    v-model="cargoFirmante"
                    type="text"
                    placeholder="Ej: Gerente de Operaciones"
                    class="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div class="flex items-start gap-2 pt-1 text-xs">
                <input
                  v-model="aceptoTerminos"
                  id="chk-terminos"
                  type="checkbox"
                  class="mt-0.5 rounded bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <label for="chk-terminos" class="text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                  Confirmo que tengo autoridad para aceptar esta propuesta en representación de <strong>{{ cotizacion.cliente_nombre }}</strong> y acepto los términos estipulados.
                </label>
              </div>

              <div class="pt-2 flex justify-end">
                <button
                  type="button"
                  @click="confirmarAprobacion"
                  :disabled="procesandoAprobacion"
                  class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-950/30 active:scale-95 disabled:opacity-50"
                >
                  <Loader2 v-if="procesandoAprobacion" class="w-4 h-4 animate-spin" />
                  <Check v-else class="w-4 h-4 stroke-[2.5]" />
                  <span>{{ procesandoAprobacion ? 'Procesando Confirmación...' : 'Aceptar y Confirmar Propuesta' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Pie de Página -->
    <footer class="border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-xs text-zinc-500 print:hidden">
      {{ perfilEmpresa.nombreComercial || perfilEmpresa.razonSocial }} · Soluciones B2B · República Dominicana
    </footer>
  </div>
</template>
