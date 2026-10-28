<script setup lang="ts">
import { CheckCircle2, DollarSign, Kanban, TrendingUp } from 'lucide-vue-next';
import { formatCurrency } from '@/core/formatters/formatters';
import type { TipoPipeline } from '../types/pipeline.types';

defineProps<{
  tipoPipeline?: TipoPipeline;
  metricas: {
    total: number;
    completadas: number;
    montoTotal: number;
    montoPonderadoTotal: number;
    porcentaje: number;
  };
}>();
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
    <!-- 1. Tratos en Tablero -->
    <div class="saas-card rounded-xl p-3 border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900/60 shadow-sm flex items-center justify-between">
      <div>
        <span class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-0.5">
          {{ tipoPipeline === 'visitas' ? 'Visitas Registradas' : 'Tratos Activos' }}
        </span>
        <div class="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
          {{ metricas.total }}
        </div>
        <span class="text-[10px] text-zinc-500 dark:text-zinc-400">
          {{ metricas.completadas }} ganados / realizados
        </span>
      </div>
      <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
        <Kanban class="w-4 h-4" />
      </div>
    </div>

    <!-- 2. Volumen Nominal Total -->
    <div class="saas-card rounded-xl p-3 border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900/60 shadow-sm flex items-center justify-between">
      <div class="min-w-0">
        <span class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-0.5 truncate">
          Volumen Proyectado Bruto
        </span>
        <div class="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums truncate" :title="formatCurrency(metricas.montoTotal)">
          {{ formatCurrency(metricas.montoTotal) }}
        </div>
        <span class="text-[10px] text-zinc-500 dark:text-zinc-400">
          100% valor de cartera
        </span>
      </div>
      <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
        <DollarSign class="w-4 h-4" />
      </div>
    </div>

    <!-- 3. Forecast Ponderado (Monto Realista por Probabilidad) -->
    <div class="saas-card rounded-xl p-3 border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900/60 shadow-sm flex items-center justify-between">
      <div class="min-w-0">
        <span class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-0.5 truncate">
          Forecast Ponderado Realista
        </span>
        <div class="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums truncate" :title="formatCurrency(metricas.montoPonderadoTotal)">
          {{ formatCurrency(metricas.montoPonderadoTotal) }}
        </div>
        <span class="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 font-medium">
          Ajustado por probabilidad
        </span>
      </div>
      <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
        <TrendingUp class="w-4 h-4" />
      </div>
    </div>

    <!-- 4. Tasa de Éxito / Progreso -->
    <div class="saas-card rounded-xl p-3 border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900/60 shadow-sm flex items-center justify-between">
      <div>
        <span class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-0.5">
          Tasa de Cierre / Progreso
        </span>
        <div class="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
          {{ metricas.porcentaje }}%
        </div>
        <div class="flex items-center gap-1.5 mt-0.5">
          <div class="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div class="h-full bg-emerald-500 rounded-full" :style="{ width: metricas.porcentaje + '%' }"></div>
          </div>
        </div>
      </div>
      <div class="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
        <CheckCircle2 class="w-4 h-4" />
      </div>
    </div>
  </div>
</template>
