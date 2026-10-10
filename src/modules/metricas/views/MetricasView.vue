<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  BarChart3, 
  DollarSign, 
  Award, 
  Target, 
  RefreshCw, 
  TrendingUp,
  FileDown
} from 'lucide-vue-next';
import { formatCurrency } from '@/core/formatters/formatters';
import { FlickerlessSurface } from '@flickerless/vue';
import { metricasService } from '../services/metricas.service';
import { reporteEjecutivoService } from '../services/reporte-ejecutivo.service';
import type { MetricasComerciales } from '../types/metricas.types';
import GraficoDonutSectores from '../components/GraficoDonutSectores.vue';
import GraficoEmbudoVentas from '../components/GraficoEmbudoVentas.vue';
import GraficoTendenciaMensual from '../components/GraficoTendenciaMensual.vue';
import GraficoEjecutivos from '../components/GraficoEjecutivos.vue';
import DateRangeFilter from '@/shared/components/DateRangeFilter.vue';
import { defaultRange, type DateRange } from '@/core/dates/date-range';

const periodoSeleccionado = ref<'mes' | 'trimestre' | 'anual'>('mes');
const rangoFecha = ref<DateRange>(defaultRange('month'));
const cargando = ref(true);
const exportandoPdf = ref(false);

const metricas = ref<MetricasComerciales>({
  tasaConversion: 0,
  ticketPromedio: 0,
  totalCuentas: 0,
  totalOportunidades: 0,
  totalGanado: 0,
  totalEnNegociacion: 0,
  totalPipelineActivo: 0,
  tiempoPromedioCierreDias: 28,
  distribucionSectores: [],
  distribucionEtapas: [],
  topResponsables: [],
  tendenciaMensual: [],
});

const cargarMetricas = async () => {
  cargando.value = true;
  try {
    metricas.value = await metricasService.obtenerMetricas(periodoSeleccionado.value);
  } catch (err) {
    console.error('Error cargando métricas:', err);
  } finally {
    cargando.value = false;
  }
};

const alCambiarRangoFecha = async () => {
  if (['today', 'yesterday', 'week', 'month'].includes(rangoFecha.value.preset)) {
    periodoSeleccionado.value = 'mes';
  } else if (rangoFecha.value.preset === 'quarter') {
    periodoSeleccionado.value = 'trimestre';
  } else if (rangoFecha.value.preset === 'year') {
    periodoSeleccionado.value = 'anual';
  }
  await cargarMetricas();
};

const descargarReportePdf = () => {
  exportandoPdf.value = true;
  try {
    const textoPeriodo =
      periodoSeleccionado.value === 'mes'
        ? 'Mes en Curso'
        : periodoSeleccionado.value === 'trimestre'
          ? 'Último Trimestre'
          : 'Año Fiscal Consolidado';
    reporteEjecutivoService.descargarInformeEjecutivo(metricas.value, textoPeriodo);
  } finally {
    exportandoPdf.value = false;
  }
};

onMounted(() => {
  cargarMetricas();
});
</script>

<template>
  <!-- Teleport del Encabezado hacia la Barra Superior Principal (HeaderBar) -->
  <Teleport to="#header-portal-left">
    <div class="flex items-center gap-3 min-w-0">
      <div class="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
        <BarChart3 class="w-5 h-5" />
      </div>
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h1 class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
            Métricas de Rendimiento & Conversión B2B
          </h1>
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            Cálculo Dinámico
          </span>
        </div>
        <p class="text-[11px] text-zinc-500 dark:text-zinc-400 truncate hidden md:block">
          Analítica viva calculada a partir de {{ metricas.totalCuentas }} clientes y {{ metricas.totalOportunidades }} oportunidades
        </p>
      </div>
    </div>
  </Teleport>

  <!-- Teleport de Controles hacia la Barra Superior -->
  <Teleport to="#header-portal-right">
    <div class="flex items-center gap-2 flex-wrap">
      <!-- Selector de Rango de Fechas Devforge -->
      <DateRangeFilter
        v-model="rangoFecha"
        @change="alCambiarRangoFecha"
      />

      <!-- Botón Descargar Informe Ejecutivo PDF -->
      <button
        type="button"
        @click="descargarReportePdf"
        :disabled="cargando || exportandoPdf"
        title="Descargar Informe Gerencial Ejecutivo en PDF A4 con firmas oficiales"
        class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition active:scale-95 shadow-indigo-950/40 disabled:opacity-50"
      >
        <FileDown class="w-3.5 h-3.5" />
        <span class="hidden sm:inline">{{ exportandoPdf ? 'Generando...' : 'Informe PDF' }}</span>
      </button>

      <button
        @click="cargarMetricas"
        :disabled="cargando"
        title="Actualizar analítica"
        class="p-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white hover:bg-zinc-100 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition hover:text-zinc-900 dark:hover:text-white disabled:opacity-50"
      >
        <RefreshCw :class="['w-3.5 h-3.5', cargando ? 'animate-spin text-indigo-600 dark:text-indigo-400' : '']" />
      </button>
    </div>
  </Teleport>

  <!-- Contenido Analítico con Flickerless -->
  <div class="w-full pb-6">
    <FlickerlessSurface
      :loading="cargando"
      :delay-ms="180"
      :preserve-height="true"
      stream-color="#4f46e5"
      announce-text="Actualizando datos analíticos de cartera..."
      class="w-full rounded-xl overflow-hidden"
    >
      <div class="space-y-4">
        <!-- Indicadores Generales (4 Tarjetas KPI) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="saas-card saas-card-hover rounded-xl p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2 text-xs">
            <span class="font-medium text-zinc-500 dark:text-zinc-400">Tasa de Conversión B2B</span>
            <div class="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
              <Target class="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white font-mono tabular-nums mb-1.5">
              {{ metricas.tasaConversion }}%
            </div>
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              Ratio deals ganados / total
            </span>
          </div>
        </div>

        <div class="saas-card saas-card-hover rounded-xl p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2 text-xs">
            <span class="font-medium text-zinc-500 dark:text-zinc-400">Ticket Promedio Cerrado</span>
            <div class="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 dark:text-sky-400">
              <DollarSign class="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white font-mono tabular-nums mb-1.5">
              {{ formatCurrency(metricas.ticketPromedio) }}
            </div>
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-400">
              Monto medio por contrato
            </span>
          </div>
        </div>

        <div class="saas-card saas-card-hover rounded-xl p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2 text-xs">
            <span class="font-medium text-zinc-500 dark:text-zinc-400">Volumen Total Pipeline</span>
            <div class="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <TrendingUp class="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white font-mono tabular-nums mb-1.5">
              {{ formatCurrency(metricas.totalPipelineActivo) }}
            </div>
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              {{ metricas.totalOportunidades }} oportunidades activas
            </span>
          </div>
        </div>

        <div class="saas-card saas-card-hover rounded-xl p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2 text-xs">
            <span class="font-medium text-zinc-500 dark:text-zinc-400">Tiempo de Cierre Estimado</span>
            <div class="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400">
              <Award class="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white font-mono tabular-nums mb-1.5">
              {{ metricas.tiempoPromedioCierreDias }} días
            </div>
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              Ciclo comercial de ventas
            </span>
          </div>
        </div>
      </div>

      <!-- Sección 2: Gráficos de Embudo & Donut de Sectores -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Gráfico 1: Embudo de Conversión -->
        <GraficoEmbudoVentas
          :etapas="metricas.distribucionEtapas"
          :total-oportunidades="metricas.totalOportunidades"
        />

        <!-- Gráfico 2: Distribución por Sectores (Donut SVG Interactivo) -->
        <GraficoDonutSectores
          :sectores="metricas.distribucionSectores"
          :total-monto="metricas.totalPipelineActivo"
        />
      </div>

      <!-- Sección 3: Gráfico de Evolución Mensual & Proyección (Barras SVG Interactivas) -->
      <GraficoTendenciaMensual
        :tendencia="metricas.tendenciaMensual"
      />

      <!-- Sección 4: Gráfico Comparativo de Rendimiento & Leaderboard por Ejecutivo -->
      <GraficoEjecutivos
        :responsables="metricas.topResponsables"
      />
      </div>
    </FlickerlessSurface>
  </div>
</template>
