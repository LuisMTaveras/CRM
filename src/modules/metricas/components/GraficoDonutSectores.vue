<script setup lang="ts">
import { ref, computed } from 'vue';
import type { SectorMetrica } from '../types/metricas.types';
import { formatCurrency } from '@/core/formatters/formatters';
import { PieChart } from 'lucide-vue-next';

const props = defineProps<{
  sectores: SectorMetrica[];
  totalMonto: number;
}>();

const sectorActivo = ref<SectorMetrica | null>(null);

// Geometría del SVG Donut optimizada para alta resolución
const size = 240;
const center = size / 2;
const radius = 82;
const circumference = 2 * Math.PI * radius;

// Función de formato compacto para números de miles de millones en el centro del donut
const formatearCompacto = (monto: number): string => {
  if (monto >= 1_000_000_000) {
    return `RD$ ${(monto / 1_000_000_000).toFixed(2)}B`;
  }
  if (monto >= 1_000_000) {
    return `RD$ ${(monto / 1_000_000).toFixed(1)}M`;
  }
  return formatCurrency(monto);
};

// Segmentos calculados con ángulos exactos
const segmentos = computed(() => {
  let acumulado = 0;
  return props.sectores.map((sec) => {
    const longitud = (sec.porcentaje / 100) * circumference;
    const offset = -acumulado;
    acumulado += longitud;
    return {
      ...sec,
      longitud,
      offset,
    };
  });
});

const totalEmpresas = computed(() => props.sectores.reduce((acc, s) => acc + s.cantidad, 0));
</script>

<template>
  <div class="saas-card rounded-2xl p-5 border border-zinc-200 dark:border-white/[0.08] flex flex-col justify-between bg-white dark:bg-zinc-900/90 shadow-sm transition-all duration-200">
    <!-- Cabecera -->
    <div class="flex items-center justify-between border-b border-zinc-100 dark:border-white/[0.06] pb-3 mb-4">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
          <PieChart class="w-4 h-4" />
        </div>
        <div>
          <h3 class="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Distribución de Cartera por Sector
          </h3>
          <p class="text-[11px] text-zinc-500 font-mono">
            Participación por industria y capital en negociación
          </p>
        </div>
      </div>
      <span class="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.06]">
        {{ sectores.length }} Industrias
      </span>
    </div>

    <!-- Contenido del Gráfico -->
    <div class="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
      <!-- Donut SVG -->
      <div class="sm:col-span-5 flex items-center justify-center relative select-none py-2">
        <div class="relative w-[210px] h-[210px]">
          <svg
            :viewBox="`0 0 ${size} ${size}`"
            class="w-full h-full transform -rotate-90 filter drop-shadow-sm"
          >
            <!-- Pista base -->
            <circle
              :cx="center"
              :cy="center"
              :r="radius"
              fill="transparent"
              stroke="currentColor"
              stroke-width="18"
              class="text-zinc-100 dark:text-zinc-800/50"
            />

            <!-- Arcos de cada sector -->
            <circle
              v-for="seg in segmentos"
              :key="seg.sector"
              :cx="center"
              :cy="center"
              :r="radius"
              fill="transparent"
              :stroke="seg.colorHex"
              :stroke-width="sectorActivo?.sector === seg.sector ? 26 : 20"
              :stroke-dasharray="`${seg.longitud} ${circumference - seg.longitud}`"
              :stroke-dashoffset="seg.offset"
              stroke-linecap="butt"
              class="transition-all duration-300 cursor-pointer"
              :style="{
                filter: sectorActivo?.sector === seg.sector ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))' : 'none',
                opacity: sectorActivo && sectorActivo.sector !== seg.sector ? 0.45 : 1
              }"
              @mouseenter="sectorActivo = seg"
              @mouseleave="sectorActivo = null"
            />
          </svg>

          <!-- Centro con datos interactivos -->
          <div class="absolute inset-0 flex flex-col items-center justify-center text-center p-3 pointer-events-none">
            <span class="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono truncate max-w-[120px]">
              {{ sectorActivo ? sectorActivo.sector : 'Cartera Total' }}
            </span>
            <span class="text-base sm:text-lg font-black font-mono text-zinc-900 dark:text-white tracking-tight leading-none mt-1">
              {{ sectorActivo ? formatearCompacto(sectorActivo.montoTotal) : formatearCompacto(totalMonto) }}
            </span>
            <span class="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-1">
              {{ sectorActivo ? `${sectorActivo.cantidad} clientes • ${sectorActivo.porcentaje}%` : `${totalEmpresas} clientes` }}
            </span>
          </div>
        </div>
      </div>

      <!-- Leyenda interactiva ordenada con barras mini -->
      <div class="sm:col-span-7 space-y-2 max-h-[260px] overflow-y-auto pr-1">
        <div
          v-for="sec in sectores"
          :key="sec.sector"
          @mouseenter="sectorActivo = sec"
          @mouseleave="sectorActivo = null"
          :class="[
            'p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 text-xs',
            sectorActivo?.sector === sec.sector
              ? 'bg-zinc-100 dark:bg-zinc-800/90 border-zinc-300 dark:border-white/[0.18] shadow-sm scale-[1.01]'
              : 'bg-zinc-50/60 dark:bg-zinc-900/50 border-zinc-200/70 dark:border-white/[0.05] hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40'
          ]"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 min-w-0">
              <span
                class="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm transition-transform"
                :style="{ backgroundColor: sec.colorHex }"
                :class="sectorActivo?.sector === sec.sector ? 'scale-125' : ''"
              ></span>
              <span class="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                {{ sec.sector }}
              </span>
              <span class="text-[10px] text-zinc-400 font-mono shrink-0">
                ({{ sec.cantidad }})
              </span>
            </div>

            <div class="flex items-center gap-2 font-mono text-[11px] shrink-0">
              <span class="font-bold text-zinc-900 dark:text-zinc-100">
                {{ formatCurrency(sec.montoTotal) }}
              </span>
              <span class="px-1.5 py-0.5 rounded text-[10px] bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold">
                {{ sec.porcentaje }}%
              </span>
            </div>
          </div>

          <!-- Mini barra proporcional -->
          <div class="w-full bg-zinc-200/60 dark:bg-zinc-950 h-1.5 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-300"
              :style="{
                width: `${sec.porcentaje}%`,
                backgroundColor: sec.colorHex
              }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
