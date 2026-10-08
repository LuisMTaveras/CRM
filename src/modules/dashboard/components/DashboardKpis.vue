<script setup lang="ts">
import { Users, TrendingUp, Briefcase, CheckCircle2, DollarSign } from 'lucide-vue-next';
import { formatCurrency } from '@/core/formatters/formatters';
import { FlickerlessSurface } from '@flickerless/vue';

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
  <FlickerlessSurface 
    :loading="cargando" 
    :delay-ms="180" 
    :preserve-height="true"
    stream-color="#10b981"
    announce-text="Actualizando métricas de cartera..."
    class="mb-5 rounded-xl overflow-hidden"
  >
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
      <!-- 1. Total Clientes -->
      <div class="saas-card saas-card-hover rounded-xl p-4 flex flex-col justify-between relative group">
        <div class="flex items-center justify-between text-zinc-400 mb-2">
          <span class="text-xs font-medium text-zinc-400">Cartera Total</span>
          <div class="w-7 h-7 rounded-lg bg-zinc-800/60 border border-zinc-700/40 flex items-center justify-center text-zinc-400 group-hover:text-zinc-200 transition-colors">
            <Users class="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div class="text-2xl font-semibold tracking-tight text-zinc-100 tabular-nums font-mono mb-1.5">
            {{ estadisticas.totalClientes }}
          </div>
          <div class="flex items-center gap-1.5">
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800/80 border border-zinc-700/50 text-zinc-400">
              Empresas B2B
            </span>
          </div>
        </div>
      </div>

      <!-- 2. Prospectos -->
      <div class="saas-card saas-card-hover rounded-xl p-4 flex flex-col justify-between relative group">
        <div class="flex items-center justify-between text-zinc-400 mb-2">
          <span class="text-xs font-medium text-zinc-400">Prospectos</span>
          <div class="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:bg-sky-500/15 transition-colors">
            <TrendingUp class="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div class="text-2xl font-semibold tracking-tight text-zinc-100 tabular-nums font-mono mb-1.5">
            {{ estadisticas.prospectos }}
          </div>
          <div class="flex items-center gap-1.5">
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-500/10 border border-sky-500/20 text-sky-400">
              En calificación
            </span>
          </div>
        </div>
      </div>

      <!-- 3. En Negociación -->
      <div class="saas-card saas-card-hover rounded-xl p-4 flex flex-col justify-between relative group">
        <div class="flex items-center justify-between text-zinc-400 mb-2">
          <span class="text-xs font-medium text-zinc-400">En Negociación</span>
          <div class="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/15 transition-colors">
            <Briefcase class="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div class="text-2xl font-semibold tracking-tight text-zinc-100 tabular-nums font-mono mb-1.5">
            {{ estadisticas.enNegociacion }}
          </div>
          <div class="flex items-center gap-1.5">
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
              Propuestas activas
            </span>
          </div>
        </div>
      </div>

      <!-- 4. Clientes Activos -->
      <div class="saas-card saas-card-hover rounded-xl p-4 flex flex-col justify-between relative group">
        <div class="flex items-center justify-between text-zinc-400 mb-2">
          <span class="text-xs font-medium text-zinc-400">Clientes Activos</span>
          <div class="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/15 transition-colors">
            <CheckCircle2 class="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div class="text-2xl font-semibold tracking-tight text-zinc-100 tabular-nums font-mono mb-1.5">
            {{ estadisticas.activos }}
          </div>
          <div class="flex items-center gap-1.5">
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              Contratos vigentes
            </span>
          </div>
        </div>
      </div>

      <!-- 5. Pipeline Ponderado -->
      <div class="saas-card saas-card-hover rounded-xl p-4 flex flex-col justify-between relative group sm:col-span-2">
        <div class="flex items-center justify-between text-zinc-400 mb-2">
          <span class="text-xs font-medium text-zinc-400">Pipeline Estimado</span>
          <div class="w-7 h-7 rounded-lg bg-zinc-800/60 border border-zinc-700/40 flex items-center justify-center text-zinc-300 group-hover:text-emerald-400 transition-colors">
            <DollarSign class="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div class="text-base xl:text-xl font-semibold tracking-tight text-zinc-100 tabular-nums font-mono mb-1.5 truncate" :title="formatCurrency(estadisticas.valorTotalPipeline)">
            {{ formatCurrency(estadisticas.valorTotalPipeline) }}
          </div>
          <div class="flex items-center gap-1.5">
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              Volumen ponderado
            </span>
          </div>
        </div>
      </div>
    </div>
  </FlickerlessSurface>
</template>
