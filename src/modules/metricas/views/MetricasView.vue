<script setup lang="ts">
import { ref } from 'vue';
import { BarChart3, DollarSign, Award, Target, RefreshCw } from 'lucide-vue-next';
import { formatearMoneda } from '@/core/lib/utils';
import { FlickerlessSurface } from '@flickerless/vue';

const periodoSeleccionado = ref<'mes' | 'trimestre' | 'anual'>('mes');
const cargando = ref(false);

const cambiarPeriodo = async (p: 'mes' | 'trimestre' | 'anual') => {
  periodoSeleccionado.value = p;
  cargando.value = true;
  await new Promise((r) => setTimeout(r, 400));
  cargando.value = false;
};

const refrescarMetricas = async () => {
  cargando.value = true;
  await new Promise((r) => setTimeout(r, 450));
  cargando.value = false;
};
</script>

<template>
  <div class="space-y-5 max-w-5xl">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
      <div>
        <h1 class="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
          <BarChart3 class="w-5 h-5 text-emerald-400" />
          Métricas de Rendimiento y Conversión Comercial
        </h1>
        <p class="text-xs text-zinc-400 mt-1">
          Analítica de cartera, ticket promedio por sector y efectividad de cierre
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
            Trimestre Q3
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
          @click="refrescarMetricas"
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
      <!-- Indicadores Generales -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div class="saas-card saas-card-hover rounded-xl p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 mb-2 text-xs">
            <span class="font-medium text-zinc-400">Tasa de Conversión B2B</span>
            <div class="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Target class="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div class="text-2xl font-semibold tracking-tight text-white font-mono tabular-nums mb-1.5">42.8%</div>
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              +4.2% frente al periodo anterior
            </span>
          </div>
        </div>

        <div class="saas-card saas-card-hover rounded-xl p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 mb-2 text-xs">
            <span class="font-medium text-zinc-400">Ticket Promedio por Cuenta</span>
            <div class="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <DollarSign class="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div class="text-2xl font-semibold tracking-tight text-white font-mono tabular-nums mb-1.5">{{ formatearMoneda(74000000) }}</div>
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800/80 border border-zinc-700/50 text-zinc-400">
              Contratos anuales cerrados
            </span>
          </div>
        </div>

        <div class="saas-card saas-card-hover rounded-xl p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 mb-2 text-xs">
            <span class="font-medium text-zinc-400">Tiempo Promedio de Cierre</span>
            <div class="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Award class="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div class="text-2xl font-semibold tracking-tight text-white font-mono tabular-nums mb-1.5">28 días</div>
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
              Ciclo comercial ágil
            </span>
          </div>
        </div>
      </div>

      <!-- Distribución por Sectores -->
      <div class="saas-card rounded-xl p-5 space-y-4 border border-white/[0.08]">
        <div class="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h3 class="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
            Distribución de Cartera por Sector Económico
          </h3>
          <span class="text-[11px] text-zinc-400 font-mono">Consolidado Total</span>
        </div>

        <div class="space-y-4 pt-1 text-xs">
          <div>
            <div class="flex justify-between text-zinc-300 mb-1.5 font-medium">
              <span>Retail & Comercio Mayorista</span>
              <span class="font-mono text-zinc-400">38% • {{ formatearMoneda(195000000) }}</span>
            </div>
            <div class="w-full bg-zinc-950/80 h-2 rounded-full overflow-hidden border border-white/[0.06]">
              <div class="bg-emerald-500 h-full rounded-full transition-all" style="width: 38%"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-zinc-300 mb-1.5 font-medium">
              <span>Finanzas & Inversiones</span>
              <span class="font-mono text-zinc-400">35% • {{ formatearMoneda(192000000) }}</span>
            </div>
            <div class="w-full bg-zinc-950/80 h-2 rounded-full overflow-hidden border border-white/[0.06]">
              <div class="bg-sky-500 h-full rounded-full transition-all" style="width: 35%"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-zinc-300 mb-1.5 font-medium">
              <span>Salud & Redes Médicas</span>
              <span class="font-mono text-zinc-400">16% • {{ formatearMoneda(85000000) }}</span>
            </div>
            <div class="w-full bg-zinc-950/80 h-2 rounded-full overflow-hidden border border-white/[0.06]">
              <div class="bg-indigo-500 h-full rounded-full transition-all" style="width: 16%"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-zinc-300 mb-1.5 font-medium">
              <span>Tecnología & Cloud</span>
              <span class="font-mono text-zinc-400">11% • {{ formatearMoneda(45000000) }}</span>
            </div>
            <div class="w-full bg-zinc-950/80 h-2 rounded-full overflow-hidden border border-white/[0.06]">
              <div class="bg-amber-500 h-full rounded-full transition-all" style="width: 11%"></div>
            </div>
          </div>
        </div>
      </div>
    </FlickerlessSurface>
  </div>
</template>
