<script setup lang="ts">
import { ref, computed } from 'vue';
import { cotizacionesService } from '../services/cotizaciones.service';
import { catalogoService } from '@/modules/comunicaciones/services/catalogo.service';
import type { Cotizacion, EstadoCotizacion } from '../types/catalogo.types';
import type { Cliente } from '@/modules/clientes/types/cliente.types';
import ModalNuevaCotizacion from '../components/ModalNuevaCotizacion.vue';
import ModalNuevoItemCatalogo from '../components/ModalNuevoItemCatalogo.vue';
import ModalEnviarWhatsApp from '@/modules/comunicaciones/components/ModalEnviarWhatsApp.vue';
import { formatCurrency, formatDate } from '@/core/formatters/formatters';
import { 
  Package, 
  FileText, 
  Plus, 
  Search, 
  ExternalLink, 
  MessageCircle, 
  Copy, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Calculator,
  TrendingUp
} from 'lucide-vue-next';
import { toastService } from '@/core/notifications/toast.service';

const pestanaActiva = ref<'cotizaciones' | 'catalogo'>('cotizaciones');

const cotizaciones = computed(() => cotizacionesService.obtenerTodas());
const catalogoItems = computed(() => catalogoService.obtenerCatalogo());

const busquedaCotizaciones = ref('');
const filtroEstadoCotizacion = ref<string>('');

const busquedaCatalogo = ref('');
const filtroCategoria = ref<string>('');

const modalNuevaCotizacionAbierto = ref(false);
const modalNuevoItemAbierto = ref(false);

const modalWhatsAppAbierto = ref(false);
const clienteParaWhatsApp = ref<Cliente | null>(null);

const cotizacionesFiltradas = computed(() => {
  return cotizaciones.value.filter((c) => {
    if (filtroEstadoCotizacion.value && c.estado !== filtroEstadoCotizacion.value) return false;
    if (busquedaCotizaciones.value.trim() !== '') {
      const q = busquedaCotizaciones.value.toLowerCase().trim();
      return (
        c.numero_cotizacion.toLowerCase().includes(q) ||
        c.cliente_nombre.toLowerCase().includes(q) ||
        (c.contacto_nombre && c.contacto_nombre.toLowerCase().includes(q))
      );
    }
    return true;
  });
});

const itemsCatalogoFiltrados = computed(() => {
  return catalogoItems.value.filter((item) => {
    if (filtroCategoria.value && item.categoria !== filtroCategoria.value) return false;
    if (busquedaCatalogo.value.trim() !== '') {
      const q = busquedaCatalogo.value.toLowerCase().trim();
      return (
        item.codigo.toLowerCase().includes(q) ||
        item.nombre.toLowerCase().includes(q) ||
        item.descripcion.toLowerCase().includes(q)
      );
    }
    return true;
  });
});

// KPIs
const totalCotizadoMonto = computed(() => {
  return cotizaciones.value.reduce((acc, c) => acc + c.total, 0);
});

const totalAprobadas = computed(() => {
  return cotizaciones.value.filter((c) => c.estado === 'aprobada').length;
});

const tasaAprobacion = computed(() => {
  if (cotizaciones.value.length === 0) return 0;
  return Math.round((totalAprobadas.value / cotizaciones.value.length) * 100);
});

const copiarEnlacePortal = (token: string) => {
  const url = `${window.location.origin}/propuesta/${token}`;
  navigator.clipboard.writeText(url);
  toastService.exito('Enlace copiado al portapapeles. Listo para enviar al cliente.');
};

const abrirPortal = (token: string) => {
  window.open(`/propuesta/${token}`, '_blank');
};

const abrirWhatsAppCotizacion = (cot: Cotizacion) => {
  clienteParaWhatsApp.value = {
    id: cot.cliente_id,
    codigo: '',
    razon_social: cot.cliente_nombre,
    telefono: cot.cliente_telefono,
    email: cot.cliente_email,
    sector: 'Comercial',
    estado: 'en_negociacion',
    prioridad: 'alta',
    valor_estimado: cot.total,
    responsable: 'Equipo Comercial',
    creado_en: cot.creado_en,
  };
  modalWhatsAppAbierto.value = true;
};

const badgeEstado = (estado: EstadoCotizacion) => {
  switch (estado) {
    case 'aprobada':
      return {
        clase: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        texto: 'Aprobada Formalmente',
        icono: CheckCircle2,
      };
    case 'enviada':
      return {
        clase: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        texto: 'Enviada al Cliente',
        icono: Clock,
      };
    case 'borrador':
      return {
        clase: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
        texto: 'Borrador',
        icono: Clock,
      };
    case 'rechazada':
      return {
        clase: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        texto: 'Rechazada',
        icono: XCircle,
      };
    case 'vencida':
      return {
        clase: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        texto: 'Vencida',
        icono: Clock,
      };
  }
};
</script>

<template>
  <!-- Teleport Encabezado Principal -->
  <Teleport to="#header-portal-left">
    <div class="flex items-center gap-3 min-w-0">
      <span class="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
        <Calculator class="w-5 h-5" />
      </span>
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h1 class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
            Catálogo Comercial & CPQ
          </h1>
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            ITBIS 18% Integrado
          </span>
        </div>
        <p class="text-[11px] text-zinc-500 dark:text-zinc-400 truncate hidden md:block">
          Precios, servicios profesionales, emisión de cotizaciones y portal de aprobación web
        </p>
      </div>
    </div>
  </Teleport>

  <!-- Teleport Acciones Superiores -->
  <Teleport to="#header-portal-right">
    <div class="flex items-center gap-2">
      <button
        v-if="pestanaActiva === 'cotizaciones'"
        @click="modalNuevaCotizacionAbierto = true"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition active:scale-95 shadow-indigo-950/40"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>+ Nueva Cotización</span>
      </button>

      <button
        v-else
        @click="modalNuevoItemAbierto = true"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition active:scale-95 shadow-indigo-950/40"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>+ Nuevo Ítem de Catálogo</span>
      </button>
    </div>
  </Teleport>

  <div class="w-full space-y-4">
    <!-- Métricas CPQ -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div class="p-4 rounded-xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-white/[0.08] shadow-sm">
        <div class="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs mb-1">
          <span>Total Cotizado en Cartera</span>
          <Calculator class="w-4 h-4 text-indigo-500" />
        </div>
        <div class="text-xl font-bold text-zinc-900 dark:text-white font-mono">
          {{ formatCurrency(totalCotizadoMonto) }}
        </div>
        <div class="text-[11px] text-zinc-500 mt-0.5">
          {{ cotizaciones.length }} propuestas registradas
        </div>
      </div>

      <div class="p-4 rounded-xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-white/[0.08] shadow-sm">
        <div class="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs mb-1">
          <span>Tasa de Aprobación</span>
          <TrendingUp class="w-4 h-4 text-emerald-500" />
        </div>
        <div class="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
          {{ tasaAprobacion }}%
        </div>
        <div class="text-[11px] text-zinc-500 mt-0.5">
          {{ totalAprobadas }} de {{ cotizaciones.length }} aprobadas formalmente
        </div>
      </div>

      <div class="p-4 rounded-xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-white/[0.08] shadow-sm">
        <div class="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs mb-1">
          <span>Servicios en Catálogo</span>
          <Package class="w-4 h-4 text-indigo-500" />
        </div>
        <div class="text-xl font-bold text-zinc-900 dark:text-white font-mono">
          {{ catalogoItems.length }}
        </div>
        <div class="text-[11px] text-zinc-500 mt-0.5">
          Ítems estandarizados con ITBIS
        </div>
      </div>
    </div>

    <!-- Pestañas de Navegación -->
    <div class="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 text-xs">
      <button
        type="button"
        @click="pestanaActiva = 'cotizaciones'"
        :class="[
          'px-4 py-2 rounded-lg font-medium transition flex items-center gap-2',
          pestanaActiva === 'cotizaciones'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
        ]"
      >
        <FileText class="w-4 h-4" />
        <span>Cotizaciones & Propuestas ({{ cotizaciones.length }})</span>
      </button>

      <button
        type="button"
        @click="pestanaActiva = 'catalogo'"
        :class="[
          'px-4 py-2 rounded-lg font-medium transition flex items-center gap-2',
          pestanaActiva === 'catalogo'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
        ]"
      >
        <Package class="w-4 h-4" />
        <span>Catálogo de Servicios & Precios ({{ catalogoItems.length }})</span>
      </button>
    </div>

    <!-- Pestaña 1: Cotizaciones -->
    <div v-if="pestanaActiva === 'cotizaciones'" class="space-y-3">
      <!-- Filtros -->
      <div class="flex flex-col sm:flex-row gap-2 justify-between items-center text-xs">
        <div class="relative w-full sm:w-72">
          <Search class="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
          <input
            v-model="busquedaCotizaciones"
            type="text"
            placeholder="Buscar por cliente o folio..."
            class="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          <select
            v-model="filtroEstadoCotizacion"
            class="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300"
          >
            <option value="">Todos los Estados</option>
            <option value="enviada">Enviadas</option>
            <option value="aprobada">Aprobadas</option>
            <option value="borrador">Borradores</option>
            <option value="rechazada">Rechazadas</option>
          </select>
        </div>
      </div>

      <!-- Tabla de Cotizaciones -->
      <div class="border border-zinc-200 dark:border-white/[0.08] rounded-xl overflow-hidden bg-white dark:bg-zinc-900/90 shadow-sm">
        <table class="w-full text-left text-xs">
          <thead class="bg-zinc-100/80 dark:bg-zinc-950/80 text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th class="py-3 px-4 font-semibold">Folio</th>
              <th class="py-3 px-4 font-semibold">Cliente Destinatario</th>
              <th class="py-3 px-4 font-semibold">Emisión / Vencimiento</th>
              <th class="py-3 px-4 font-semibold text-right">Subtotal</th>
              <th class="py-3 px-4 font-semibold text-right">ITBIS 18%</th>
              <th class="py-3 px-4 font-semibold text-right">Total (RD$)</th>
              <th class="py-3 px-4 font-semibold text-center">Estado</th>
              <th class="py-3 px-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800">
            <tr
              v-for="cot in cotizacionesFiltradas"
              :key="cot.id"
              class="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition"
            >
              <td class="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                {{ cot.numero_cotizacion }}
              </td>
              <td class="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                <div>{{ cot.cliente_nombre }}</div>
                <div v-if="cot.contacto_nombre" class="text-[11px] text-zinc-500 font-normal">
                  {{ cot.contacto_nombre }}
                </div>
              </td>
              <td class="py-3 px-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                <div>{{ formatDate(cot.fecha_emision) }}</div>
                <div class="text-[10px] text-zinc-400">Vence: {{ formatDate(cot.fecha_vencimiento) }}</div>
              </td>
              <td class="py-3 px-4 text-right font-mono text-zinc-600 dark:text-zinc-400">
                {{ formatCurrency(cot.subtotal) }}
              </td>
              <td class="py-3 px-4 text-right font-mono text-zinc-500">
                {{ formatCurrency(cot.itbis_total) }}
              </td>
              <td class="py-3 px-4 text-right font-mono font-bold text-zinc-900 dark:text-white">
                {{ formatCurrency(cot.total) }}
              </td>
              <td class="py-3 px-4 text-center">
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border',
                    badgeEstado(cot.estado).clase
                  ]"
                >
                  <component :is="badgeEstado(cot.estado).icono" class="w-3 h-3" />
                  {{ badgeEstado(cot.estado).texto }}
                </span>
              </td>
              <td class="py-3 px-4 text-right whitespace-nowrap">
                <div class="inline-flex items-center gap-1 justify-end">
                  <button
                    type="button"
                    @click="abrirPortal(cot.token_aprobacion)"
                    title="Ver Portal de Aprobación Web del Cliente"
                    class="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition"
                  >
                    <ExternalLink class="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    @click="copiarEnlacePortal(cot.token_aprobacion)"
                    title="Copiar Enlace de Propuesta"
                    class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  >
                    <Copy class="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    @click="abrirWhatsAppCotizacion(cot)"
                    title="Enviar por WhatsApp al Cliente"
                    class="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition"
                  >
                    <MessageCircle class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pestaña 2: Catálogo de Servicios y Productos -->
    <div v-else class="space-y-3">
      <!-- Filtros -->
      <div class="flex flex-col sm:flex-row gap-2 justify-between items-center text-xs">
        <div class="relative w-full sm:w-72">
          <Search class="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
          <input
            v-model="busquedaCatalogo"
            type="text"
            placeholder="Buscar por SKU o nombre..."
            class="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <!-- Tabla de Ítems del Catálogo -->
      <div class="border border-zinc-200 dark:border-white/[0.08] rounded-xl overflow-hidden bg-white dark:bg-zinc-900/90 shadow-sm">
        <table class="w-full text-left text-xs">
          <thead class="bg-zinc-100/80 dark:bg-zinc-950/80 text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th class="py-3 px-4 font-semibold">SKU</th>
              <th class="py-3 px-4 font-semibold">Servicio / Producto</th>
              <th class="py-3 px-4 font-semibold">Categoría</th>
              <th class="py-3 px-4 font-semibold text-right">Precio Base (RD$)</th>
              <th class="py-3 px-4 font-semibold text-center">ITBIS Fiscal</th>
              <th class="py-3 px-4 font-semibold text-center">Unidad</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800">
            <tr
              v-for="item in itemsCatalogoFiltrados"
              :key="item.id"
              class="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition"
            >
              <td class="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                {{ item.codigo }}
              </td>
              <td class="py-3 px-4">
                <div class="font-bold text-zinc-900 dark:text-zinc-100">{{ item.nombre }}</div>
                <div class="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">{{ item.descripcion }}</div>
              </td>
              <td class="py-3 px-4 capitalize">
                <span class="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-medium border border-zinc-200 dark:border-zinc-700">
                  {{ item.categoria }}
                </span>
              </td>
              <td class="py-3 px-4 text-right font-mono font-bold text-zinc-900 dark:text-white">
                {{ formatCurrency(item.precioBase) }}
              </td>
              <td class="py-3 px-4 text-center">
                <span
                  :class="[
                    'px-2 py-0.5 rounded-full text-[10px] font-medium border',
                    item.aplicaItbis
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                  ]"
                >
                  {{ item.aplicaItbis ? '18% ITBIS' : 'Exento' }}
                </span>
              </td>
              <td class="py-3 px-4 text-center font-medium text-zinc-600 dark:text-zinc-400">
                {{ item.unidadMedida }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de Creación de Cotizaciones -->
    <ModalNuevaCotizacion
      v-if="modalNuevaCotizacionAbierto"
      :abierto="modalNuevaCotizacionAbierto"
      @cerrar="modalNuevaCotizacionAbierto = false"
      @creada="modalNuevaCotizacionAbierto = false"
    />

    <!-- Modal de Creación de Ítem de Catálogo -->
    <ModalNuevoItemCatalogo
      v-if="modalNuevoItemAbierto"
      :abierto="modalNuevoItemAbierto"
      @cerrar="modalNuevoItemAbierto = false"
    />

    <!-- Modal de Envío por WhatsApp -->
    <ModalEnviarWhatsApp
      v-if="modalWhatsAppAbierto"
      :abierto="modalWhatsAppAbierto"
      :cliente="clienteParaWhatsApp"
      @cerrar="modalWhatsAppAbierto = false"
    />
  </div>
</template>
