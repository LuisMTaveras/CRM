<script setup lang="ts">
import { Users, TrendingUp, Briefcase, CheckCircle2, DollarSign } from 'lucide-vue-next';
import { formatearMoneda } from '@/core/lib/utils';

defineProps<{
  estadisticas: {
    totalClientes: number;
    prospectos: number;
    enNegociacion: number;
    activos: number;
    valorTotalPipeline: number;
  };
  cargando: boolean;
}>();
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-5">
    <!-- Total Clientes -->
    <div class="bg-zinc-900/90 border border-zinc-800/80 rounded-lg p-3.5 shadow-sm hover:border-zinc-700 transition-colors">
      <div class="flex items-center justify-between text-zinc-400 mb-1.5">
        <span class="text-xs font-medium uppercase tracking-wider">Cartera Total</span>
        <Users class="w-4 h-4 text-zinc-400" />
      </div>
      <div class="flex items-baseline justify-between">
        <div class="text-2xl font-bold font-mono text-zinc-100 tabular-nums">
          {{ cargando ? '—' : estadisticas.totalClientes }}
        </div>
        <span class="text-[11px] text-zinc-500 font-medium">Empresas B2B</span>
      </div>
    </div>

    <!-- Prospectos -->
    <div class="bg-zinc-900/90 border border-zinc-800/80 rounded-lg p-3.5 shadow-sm hover:border-zinc-700 transition-colors">
      <div class="flex items-center justify-between text-zinc-400 mb-1.5">
        <span class="text-xs font-medium uppercase tracking-wider">Prospectos</span>
        <TrendingUp class="w-4 h-4 text-sky-400" />
      </div>
      <div class="flex items-baseline justify-between">
        <div class="text-2xl font-bold font-mono text-sky-400 tabular-nums">
          {{ cargando ? '—' : estadisticas.prospectos }}
        </div>
        <span class="text-[11px] text-sky-500/80 font-medium">En calificación</span>
      </div>
    </div>

    <!-- En Negociación -->
    <div class="bg-zinc-900/90 border border-zinc-800/80 rounded-lg p-3.5 shadow-sm hover:border-zinc-700 transition-colors">
      <div class="flex items-center justify-between text-zinc-400 mb-1.5">
        <span class="text-xs font-medium uppercase tracking-wider">En Negociación</span>
        <Briefcase class="w-4 h-4 text-amber-400" />
      </div>
      <div class="flex items-baseline justify-between">
        <div class="text-2xl font-bold font-mono text-amber-400 tabular-nums">
          {{ cargando ? '—' : estadisticas.enNegociacion }}
        </div>
        <span class="text-[11px] text-amber-500/80 font-medium">Propuestas activas</span>
      </div>
    </div>

    <!-- Clientes Activos -->
    <div class="bg-zinc-900/90 border border-zinc-800/80 rounded-lg p-3.5 shadow-sm hover:border-zinc-700 transition-colors">
      <div class="flex items-center justify-between text-zinc-400 mb-1.5">
        <span class="text-xs font-medium uppercase tracking-wider">Clientes Activos</span>
        <CheckCircle2 class="w-4 h-4 text-emerald-400" />
      </div>
      <div class="flex items-baseline justify-between">
        <div class="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
          {{ cargando ? '—' : estadisticas.activos }}
        </div>
        <span class="text-[11px] text-emerald-500/80 font-medium">Con contrato vigente</span>
      </div>
    </div>

    <!-- Valor Pipeline -->
    <div class="bg-zinc-900/90 border border-zinc-800/80 rounded-lg p-3.5 shadow-sm hover:border-zinc-700 transition-colors">
      <div class="flex items-center justify-between text-zinc-400 mb-1.5">
        <span class="text-xs font-medium uppercase tracking-wider">Pipeline Ponderado</span>
        <DollarSign class="w-4 h-4 text-zinc-300" />
      </div>
      <div class="flex items-baseline justify-between">
        <div class="text-lg font-bold font-mono text-zinc-100 tabular-nums truncate">
          {{ cargando ? '—' : formatearMoneda(estadisticas.valorTotalPipeline) }}
        </div>
        <span class="text-[11px] text-zinc-500 font-medium">Volumen estimado</span>
      </div>
    </div>
  </div>
</template>
