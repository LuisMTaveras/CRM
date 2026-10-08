<script setup lang="ts">
import { ref, computed } from 'vue';
import type { MesTendencia } from '../types/metricas.types';
import { formatCurrency } from '@/core/formatters/formatters';
import { TrendingUp } from 'lucide-vue-next';

const props = defineProps<{
  tendencia: MesTendencia[];
}>();

const filtroSerie = ref<'ambos' | 'ganado' | 'pipeline'>('ambos');
const mesHover = ref<MesTendencia | null>(null);

// Dimensiones SVG con escala precisa
const svgWidth = 800;
const svgHeight = 260;
const padLeft = 75;
const padRight = 30;
const padTop = 25;
const padBottom = 35;
const chartW = svgWidth - padLeft - padRight;
const chartH = svgHeight - padTop - padBottom;

// Cálculo del valor máximo redondeado para la escala del eje Y
const valorMaximo = computed(() => {
  const montos = props.tendencia.map((m) => Math.max(m.montoGanado, m.montoPipeline));
  const max = Math.max(...montos, 100_000_000);
  return Math.ceil(max / 50_000_000) * 50_000_000 * 1.1;
});

// Pasos del eje Y (5 niveles)
const lineasGuiaY = computed(() => {
  const pasos = 4;
  return Array.from({ length: pasos + 1 }, (_, i) => {
    const val = (valorMaximo.value / pasos) * (pasos - i);
    const y = padTop + (chartH / pasos) * i;
    return {
      valor: val,
      etiqueta: val >= 1_000_000_000 
        ? `RD$ ${(val / 1_000_000_000).toFixed(1)}B` 
        : `RD$ ${Math.round(val / 1_000_000)}M`,
      y,
    };
  });
});

const colWidth = computed(() => chartW / (props.tendencia.length || 1));
const barW = 18;

const columnas = computed(() => {
  return props.tendencia.map((item, idx) => {
    const xCenter = padLeft + idx * colWidth.value + colWidth.value / 2;

    const hGanado = (item.montoGanado / valorMaximo.value) * chartH;
    const yGanado = padTop + chartH - hGanado;

    const hPipeline = (item.montoPipeline / valorMaximo.value) * chartH;
    const yPipeline = padTop + chartH - hPipeline;

    return {
      item,
      xCenter,
      xGanado: xCenter - barW - 3,
      yGanado,
      hGanado: Math.max(4, hGanado),
      xPipeline: xCenter + 3,
      yPipeline,
      hPipeline: Math.max(4, hPipeline),
    };
  });
});

// Métricas de resumen global para el encabezado del gráfico
const totalGanadoPeriodo = computed(() => props.tendencia.reduce((acc, m) => acc + m.montoGanado, 0));
const totalPipelinePeriodo = computed(() => props.tendencia.reduce((acc, m) => acc + m.montoPipeline, 0));
</script>

<template>
  <div class="saas-card rounded-2xl p-5 border border-zinc-200 dark:border-white/[0.08] flex flex-col justify-between bg-white dark:bg-zinc-900/90 shadow-sm transition-all duration-200">
    <!-- Cabecera Superior: Título + KPI Resumen + Filtros -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-white/[0.06] pb-4 mb-4">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <TrendingUp class="w-4 h-4" />
        </div>
        <div>
          <h3 class="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Evolución Mensual & Cierre de Negocios
          </h3>
          <p class="text-[11px] text-zinc-500 font-mono">
            Histórico semestral comparativo de ventas cerradas vs pipeline en negociación
          </p>
        </div>
      </div>

      <!-- Resumen de Totales y Filtro de Serie -->
      <div class="flex flex-wrap items-center gap-3">
        <!-- Píldoras de métricas rápidas -->
        <div class="hidden lg:flex items-center gap-3 text-xs font-mono pr-2">
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Ganado: {{ formatCurrency(totalGanadoPeriodo) }}</span>
          </div>
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 font-semibold">
            <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>Pipeline: {{ formatCurrency(totalPipelinePeriodo) }}</span>
          </div>
        </div>

        <!-- Botones de Alternancia de Serie -->
        <div class="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900/80 p-1 rounded-xl border border-zinc-200 dark:border-white/[0.08] text-[11px]">
          <button
            type="button"
            @click="filtroSerie = 'ambos'"
            :class="[
              'px-2.5 py-1 rounded-lg font-medium transition',
              filtroSerie === 'ambos'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-white/[0.08]'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            ]"
          >
            Combinado
          </button>
          <button
            type="button"
            @click="filtroSerie = 'ganado'"
            :class="[
              'px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1',
              filtroSerie === 'ganado'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            ]"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Ganados</span>
          </button>
          <button
            type="button"
            @click="filtroSerie = 'pipeline'"
            :class="[
              'px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1',
              filtroSerie === 'pipeline'
                ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/20'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            ]"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <span>Pipeline</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Gráfico SVG con Escala Y, Columnas Estilizadas y Tooltip Flotante -->
    <div class="relative w-full overflow-hidden select-none py-1">
      <svg
        :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
        class="w-full h-[250px] overflow-visible"
      >
        <defs>
          <!-- Gradientes suaves para las barras -->
          <linearGradient id="grad-bar-ganado" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#10b981" />
            <stop offset="100%" stop-color="#059669" />
          </linearGradient>

          <linearGradient id="grad-bar-pipeline" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#6366f1" />
            <stop offset="100%" stop-color="#4f46e5" />
          </linearGradient>
        </defs>

        <!-- Eje Y: Líneas de Guía Horizontales y Etiquetas Monetarias -->
        <g v-for="linea in lineasGuiaY" :key="linea.y">
          <line
            :x1="padLeft"
            :y1="linea.y"
            :x2="svgWidth - padRight"
            :y2="linea.y"
            stroke="currentColor"
            class="text-zinc-200/80 dark:text-zinc-800/60"
            stroke-dasharray="4 4"
            stroke-width="1"
          />
          <text
            :x="padLeft - 10"
            :y="linea.y + 4"
            text-anchor="end"
            class="text-[10px] font-mono fill-zinc-400 dark:fill-zinc-500"
          >
            {{ linea.etiqueta }}
          </text>
        </g>

        <!-- Columnas Mensuales y Barras -->
        <g v-for="col in columnas" :key="col.item.mes">
          <!-- Zona de interacción -->
          <rect
            :x="col.xCenter - colWidth / 2"
            :y="padTop"
            :width="colWidth"
            :height="chartH"
            fill="transparent"
            class="cursor-pointer"
            @mouseenter="mesHover = col.item"
            @mouseleave="mesHover = null"
          />

          <!-- Fondo de Columna al Pasar el Cursor -->
          <rect
            v-if="mesHover?.mes === col.item.mes"
            :x="col.xCenter - colWidth / 2 + 6"
            :y="padTop"
            :width="colWidth - 12"
            :height="chartH"
            class="fill-zinc-100/80 dark:fill-zinc-800/40 rounded-xl pointer-events-none transition-all"
            rx="8"
          />

          <!-- Barra Ganado (Emerald) -->
          <rect
            v-if="filtroSerie === 'ambos' || filtroSerie === 'ganado'"
            :x="filtroSerie === 'ambos' ? col.xGanado : col.xCenter - barW"
            :y="col.yGanado"
            :width="filtroSerie === 'ambos' ? barW : barW * 2"
            :height="col.hGanado"
            rx="5"
            fill="url(#grad-bar-ganado)"
            class="transition-all duration-300 pointer-events-none filter drop-shadow-sm"
          />

          <!-- Barra Pipeline (Indigo) -->
          <rect
            v-if="filtroSerie === 'ambos' || filtroSerie === 'pipeline'"
            :x="filtroSerie === 'ambos' ? col.xPipeline : col.xCenter - barW"
            :y="col.yPipeline"
            :width="filtroSerie === 'ambos' ? barW : barW * 2"
            :height="col.hPipeline"
            rx="5"
            fill="url(#grad-bar-pipeline)"
            class="transition-all duration-300 pointer-events-none filter drop-shadow-sm"
          />

          <!-- Etiqueta X del Mes -->
          <text
            :x="col.xCenter"
            :y="svgHeight - 10"
            text-anchor="middle"
            class="text-[11px] font-bold font-mono transition-colors pointer-events-none"
            :class="mesHover?.mes === col.item.mes ? 'fill-zinc-900 dark:fill-zinc-100' : 'fill-zinc-500 dark:fill-zinc-400'"
          >
            {{ col.item.mesCorto }}
          </text>
        </g>
      </svg>

      <!-- Tooltip Flotante de Datos en Tiempo Real -->
      <div
        v-if="mesHover"
        class="absolute top-4 right-8 bg-white/95 dark:bg-zinc-950/95 border border-zinc-200 dark:border-white/[0.12] rounded-2xl p-3.5 shadow-2xl backdrop-blur-md text-xs pointer-events-none transition-all duration-150 z-20 min-w-[220px]"
      >
        <div class="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-2.5">
          <span class="font-bold text-zinc-900 dark:text-zinc-100">{{ mesHover.mes }}</span>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
            {{ mesHover.dealsTotales }} tratos
          </span>
        </div>

        <div class="space-y-2 font-mono text-[11px]">
          <div class="flex items-center justify-between gap-3 text-emerald-600 dark:text-emerald-400">
            <span class="flex items-center gap-1.5 font-sans">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              Cerrado Ganado:
            </span>
            <span class="font-bold">{{ formatCurrency(mesHover.montoGanado) }}</span>
          </div>

          <div class="flex items-center justify-between gap-3 text-indigo-600 dark:text-indigo-400">
            <span class="flex items-center gap-1.5 font-sans">
              <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
              En Maduración:
            </span>
            <span class="font-bold">{{ formatCurrency(mesHover.montoPipeline) }}</span>
          </div>

          <div class="flex items-center justify-between gap-3 text-zinc-500 pt-1.5 border-t border-zinc-100 dark:border-zinc-800 text-[10px]">
            <span class="font-sans">Efectividad de deals:</span>
            <span class="font-bold text-zinc-800 dark:text-zinc-200">
              {{ mesHover.dealsGanados }} ganados ({{ Math.round((mesHover.dealsGanados / mesHover.dealsTotales) * 100) }}%)
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Leyenda Inferior -->
    <div class="flex items-center justify-center gap-8 pt-3 border-t border-zinc-100 dark:border-white/[0.05] text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-md bg-emerald-500 shadow-sm"></span>
        <span class="font-medium text-zinc-700 dark:text-zinc-300">Volumen Cerrado Ganado</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-md bg-indigo-500 shadow-sm"></span>
        <span class="font-medium text-zinc-700 dark:text-zinc-300">Volumen Activo en Maduración</span>
      </div>
    </div>
  </div>
</template>
