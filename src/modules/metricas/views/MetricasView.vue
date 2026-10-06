<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  BarChart3, 
  DollarSign, 
  Award, 
  Target, 
  RefreshCw, 
  Briefcase, 
  Users, 
  Layers,
  ArrowUpRight,
  TrendingUp
} from 'lucide-vue-next';
import { formatearMoneda } from '@/core/lib/utils';
import { FlickerlessSurface } from '@flickerless/vue';
import { metricasService } from '../services/metricas.service';
import type { MetricasComerciales } from '../types/metricas.types';

const periodoSeleccionado = ref<'mes' | 'trimestre' | 'anual'>('mes');
const cargando = ref(true);

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

const cambiarPeriodo = async (p: 'mes' | 'trimestre' | 'anual') => {
  periodoSeleccionado.value = p;
  await cargarMetricas();
};

onMounted(() => {
  cargarMetricas();
});
</script>

<template>
  <div class="space-y-5 max-w-6xl pb-10">
    <!-- Encabezado de la Sección -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
      <div>
        <div class="flex items-center gap-2.5 flex-wrap">
          <h1 class="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
            <BarChart3 class="w-5 h-5 text-emerald-400" />
            Métricas de Rendimiento y Conversión Comercial
          </h1>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Cálculo Dinámico en Tiempo Real
          </span>
        </div>
        <p class="text-xs text-zinc-400 mt-1">
          Analítica viva calculada a partir de los {{ metricas.totalCuentas }} clientes y {{ metricas.totalOportunidades }} oportunidades del CRM
        </p>
      </div>

      <div class="flex items-center gap-2">
        <!-- Selector de Períodos -->
        <div class="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-lg border border-white/[0.08]">
          <button
            @click="cambiarPeriodo('mes')"
            :disabled="cargando"
            :class="[
              'px-2.5 py-1 text-xs font-medium rounded-md transition',
              periodoSeleccionado === 'mes'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-950/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            ]"
          >
            Este Mes
          </button>
          <button
            @click="cambiarPeriodo('trimestre')"
            :disabled="cargando"
            :class="[
              'px-2.5 py-1 text-xs font-medium rounded-md transition',
              periodoSeleccionado === 'trimestre'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-950/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            ]"
          >
            Trimestre Q4
          </button>
          <button
            @click="cambiarPeriodo('anual')"
            :disabled="cargando"
            :class="[
              'px-2.5 py-1 text-xs font-medium rounded-md transition',
              periodoSeleccionado === 'anual'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-950/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            ]"
          >
            Año 2026
          </button>
        </div>

        <button
          @click="cargarMetricas"
          :disabled="cargando"
          title="Actualizar analítica"
          class="p-2 rounded-lg border border-white/[0.08] bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 transition"
        >
          <RefreshCw :class="['w-3.5 h-3.5', cargando ? 'animate-spin text-emerald-400' : '']" />
        </button>
      </div>
    </div>

    <!-- Contenido Analítico con Flickerless -->
    <FlickerlessSurface
      :loading="cargando"
      :delay-ms="180"
      :preserve-height="true"
      stream-color="#10b981"
      announce-text="Actualizando datos analíticos de cartera..."
      class="space-y-5 rounded-xl overflow-hidden"
    >
      <!-- Indicadores Generales (4 Tarjetas KPI) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div class="saas-card saas-card-hover rounded-xl p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 mb-2 text-xs">
            <span class="font-medium text-zinc-400">Tasa de Conversión B2B</span>
            <div class="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Target class="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div class="text-2xl font-semibold tracking-tight text-white font-mono tabular-nums mb-1.5">
              {{ metricas.tasaConversion }}%
            </div>
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              Ratio deals ganados / total
            </span>
          </div>
        </div>

        <div class="saas-card saas-card-hover rounded-xl p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 mb-2 text-xs">
            <span class="font-medium text-zinc-400">Ticket Promedio Cerrado</span>
            <div class="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <DollarSign class="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div class="text-2xl font-semibold tracking-tight text-white font-mono tabular-nums mb-1.5">
              {{ formatearMoneda(metricas.ticketPromedio) }}
            </div>
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800/80 border border-zinc-700/50 text-zinc-400">
              Monto medio por contrato
            </span>
          </div>
        </div>

        <div class="saas-card saas-card-hover rounded-xl p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 mb-2 text-xs">
            <span class="font-medium text-zinc-400">Volumen Total Pipeline</span>
            <div class="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <TrendingUp class="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div class="text-2xl font-semibold tracking-tight text-white font-mono tabular-nums mb-1.5">
              {{ formatearMoneda(metricas.totalPipelineActivo) }}
            </div>
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              {{ metricas.totalOportunidades }} oportunidades activas
            </span>
          </div>
        </div>

        <div class="saas-card saas-card-hover rounded-xl p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 mb-2 text-xs">
            <span class="font-medium text-zinc-400">Tiempo de Cierre Estimado</span>
            <div class="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Award class="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div class="text-2xl font-semibold tracking-tight text-white font-mono tabular-nums mb-1.5">
              {{ metricas.tiempoPromedioCierreDias }} días
            </div>
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
              Ciclo comercial de ventas
            </span>
          </div>
        </div>
      </div>

      <!-- Sección 2: Embudo de Conversión & Distribución por Sectores -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Embudo de Etapas Comerciales -->
        <div class="saas-card rounded-xl p-5 space-y-4 border border-white/[0.08]">
          <div class="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div class="flex items-center gap-2">
              <Layers class="w-4 h-4 text-emerald-400" />
              <h3 class="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                Embudo de Conversión por Fases
              </h3>
            </div>
            <span class="text-[11px] text-zinc-400 font-mono">{{ metricas.totalOportunidades }} Deals Totales</span>
          </div>

          <div class="space-y-3.5 pt-1 text-xs">
            <div
              v-for="etapa in metricas.distribucionEtapas"
              :key="etapa.etapa"
              class="space-y-1.5"
            >
              <div class="flex justify-between items-center text-zinc-300 font-medium">
                <span class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                  {{ etapa.nombre }}
                </span>
                <div class="flex items-center gap-3 font-mono text-[11px]">
                  <span class="text-zinc-400">{{ etapa.cantidad }} tratos</span>
                  <span class="text-zinc-200 font-semibold">{{ formatearMoneda(etapa.monto) }}</span>
                </div>
              </div>
              <div class="w-full bg-zinc-950/80 h-2 rounded-full overflow-hidden border border-white/[0.06]">
                <div
                  class="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  :style="{ width: `${etapa.porcentaje}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Distribución Real por Sectores Económicos -->
        <div class="saas-card rounded-xl p-5 space-y-4 border border-white/[0.08]">
          <div class="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div class="flex items-center gap-2">
              <Briefcase class="w-4 h-4 text-sky-400" />
              <h3 class="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                Distribución de Cartera por Sector
              </h3>
            </div>
            <span class="text-[11px] text-zinc-400 font-mono">{{ metricas.distribucionSectores.length }} Sectores Activos</span>
          </div>

          <div class="space-y-3.5 pt-1 text-xs">
            <div
              v-for="sec in metricas.distribucionSectores.slice(0, 5)"
              :key="sec.sector"
              class="space-y-1.5"
            >
              <div class="flex justify-between items-center text-zinc-300 font-medium">
                <span>{{ sec.sector }} ({{ sec.cantidad }} empresas)</span>
                <span class="font-mono text-zinc-400">
                  {{ sec.porcentaje }}% • {{ formatearMoneda(sec.montoTotal) }}
                </span>
              </div>
              <div class="w-full bg-zinc-950/80 h-2 rounded-full overflow-hidden border border-white/[0.06]">
                <div
                  :class="[sec.colorClase, 'h-full rounded-full transition-all duration-300']"
                  :style="{ width: `${sec.porcentaje}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sección 3: Rendimiento por Responsable Comercial -->
      <div class="saas-card rounded-xl overflow-hidden border border-white/[0.08] text-xs">
        <div class="p-3.5 border-b border-white/[0.07] bg-[#0c0c0e]/80 flex items-center justify-between">
          <div class="flex items-center gap-2 font-semibold text-zinc-200">
            <Users class="w-4 h-4 text-emerald-400" />
            <span>Rendimiento por Ejecutivo Comercial</span>
          </div>
          <span class="text-[11px] text-zinc-400 font-mono">Volumen negociado y contratos ganados</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-white/[0.07] bg-[#09090b]/60 text-zinc-400 text-[11px] font-medium uppercase tracking-wider">
                <th class="py-2.5 px-4">Ejecutivo Comercial</th>
                <th class="py-2.5 px-4">Oportunidades Asignadas</th>
                <th class="py-2.5 px-4">Deals Ganados</th>
                <th class="py-2.5 px-4 text-right">Volumen Total en Cartera</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/[0.04] font-mono text-[11px]">
              <tr
                v-for="resp in metricas.topResponsables"
                :key="resp.responsable"
                class="hover:bg-zinc-800/20 transition"
              >
                <td class="py-3 px-4 font-sans font-medium text-zinc-200 flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-[10px] text-emerald-400">
                    {{ resp.responsable.slice(0, 2).toUpperCase() }}
                  </div>
                  <span>{{ resp.responsable }}</span>
                </td>
                <td class="py-3 px-4 text-zinc-300">
                  {{ resp.deals }} negociaciones
                </td>
                <td class="py-3 px-4">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ArrowUpRight class="w-3 h-3" />
                    {{ resp.ganadas }} ganados
                  </span>
                </td>
                <td class="py-3 px-4 text-right font-semibold text-zinc-100">
                  {{ formatearMoneda(resp.monto) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </FlickerlessSurface>
  </div>
</template>
