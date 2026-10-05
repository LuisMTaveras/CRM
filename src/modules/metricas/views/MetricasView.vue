<script setup lang="ts">
import { BarChart3, DollarSign, Award, Target } from 'lucide-vue-next';
import { formatearMoneda } from '@/core/lib/utils';
</script>

<template>
  <div class="space-y-5 max-w-5xl">
    <div class="pb-3 border-b border-zinc-800">
      <h1 class="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
        <BarChart3 class="w-5 h-5 text-emerald-400" />
        Métricas de Rendimiento y Conversión Comercial
      </h1>
      <p class="text-xs text-zinc-400 mt-0.5">
        Analítica de cartera, ticket promedio por sector y efectividad de cierre
      </p>
    </div>

    <!-- Indicadores Generales -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div class="flex items-center justify-between text-zinc-400 mb-1 text-xs">
          <span>Tasa de Conversión B2B</span>
          <Target class="w-4 h-4 text-emerald-400" />
        </div>
        <div class="text-2xl font-bold font-mono text-zinc-100 tabular-nums">42.8%</div>
        <span class="text-[11px] text-emerald-400 font-medium">+4.2% frente al mes anterior</span>
      </div>

      <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div class="flex items-center justify-between text-zinc-400 mb-1 text-xs">
          <span>Ticket Promedio por Cuenta</span>
          <DollarSign class="w-4 h-4 text-sky-400" />
        </div>
        <div class="text-2xl font-bold font-mono text-zinc-100 tabular-nums">{{ formatearMoneda(74000000) }}</div>
        <span class="text-[11px] text-zinc-400">Contratos anuales cerrados</span>
      </div>

      <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div class="flex items-center justify-between text-zinc-400 mb-1 text-xs">
          <span>Tiempo Promedio de Cierre</span>
          <Award class="w-4 h-4 text-amber-400" />
        </div>
        <div class="text-2xl font-bold font-mono text-zinc-100 tabular-nums">28 días</div>
        <span class="text-[11px] text-amber-400 font-medium">Ciclo comercial ágil</span>
      </div>
    </div>

    <!-- Distribución por Sectores -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
      <h3 class="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
        Distribución de Cartera por Sector Económico
      </h3>

      <div class="space-y-3 pt-2 text-xs">
        <div>
          <div class="flex justify-between text-zinc-300 mb-1">
            <span>Retail & Comercio Mayorista</span>
            <span class="font-mono text-zinc-400">38% ({{ formatearMoneda(195000000) }})</span>
          </div>
          <div class="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
            <div class="bg-emerald-500 h-full rounded-full" style="width: 38%"></div>
          </div>
        </div>

        <div>
          <div class="flex justify-between text-zinc-300 mb-1">
            <span>Finanzas & Inversiones</span>
            <span class="font-mono text-zinc-400">35% ({{ formatearMoneda(192000000) }})</span>
          </div>
          <div class="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
            <div class="bg-sky-500 h-full rounded-full" style="width: 35%"></div>
          </div>
        </div>

        <div>
          <div class="flex justify-between text-zinc-300 mb-1">
            <span>Salud & Redes Médicas</span>
            <span class="font-mono text-zinc-400">16% ({{ formatearMoneda(85000000) }})</span>
          </div>
          <div class="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
            <div class="bg-indigo-500 h-full rounded-full" style="width: 16%"></div>
          </div>
        </div>

        <div>
          <div class="flex justify-between text-zinc-300 mb-1">
            <span>Tecnología & Cloud</span>
            <span class="font-mono text-zinc-400">11% ({{ formatearMoneda(45000000) }})</span>
          </div>
          <div class="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
            <div class="bg-amber-500 h-full rounded-full" style="width: 11%"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
