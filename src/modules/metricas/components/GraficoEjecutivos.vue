<script setup lang="ts">
import { computed } from 'vue';
import type { ResponsableMetrica } from '../types/metricas.types';
import { formatCurrency } from '@/core/formatters/formatters';
import { Trophy, ArrowUpRight, Crown, Medal } from 'lucide-vue-next';

const props = defineProps<{
  responsables: ResponsableMetrica[];
}>();

const topTres = computed(() => props.responsables.slice(0, 3));
</script>

<template>
  <div class="saas-card rounded-2xl p-5 border border-zinc-200 dark:border-white/[0.08] flex flex-col justify-between bg-white dark:bg-zinc-900/90 shadow-sm transition-all duration-200 space-y-5">
    <!-- Cabecera -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-white/[0.06] pb-3">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
          <Trophy class="w-4 h-4" />
        </div>
        <div>
          <h3 class="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Rendimiento & Eficiencia por Ejecutivo Comercial
          </h3>
          <p class="text-[11px] text-zinc-500 font-mono">
            Podio de líderes de ventas y ranking de efectividad de cierre
          </p>
        </div>
      </div>
      <span class="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.06]">
        {{ responsables.length }} Ejecutivos Activos
      </span>
    </div>

    <!-- SECCIÓN 1: PODIO DE LOS TOP 3 EJECUTIVOS (Tarjetas Destacadas) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
      <div
        v-for="(rep, idx) in topTres"
        :key="rep.responsable"
        :class="[
          'rounded-xl p-4 border transition-all duration-200 relative overflow-hidden flex flex-col justify-between',
          idx === 0
            ? 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30 shadow-md ring-1 ring-amber-500/20'
            : idx === 1
            ? 'bg-gradient-to-br from-zinc-200/50 via-zinc-100/30 to-transparent dark:from-zinc-800/40 border-zinc-300 dark:border-white/[0.1]'
            : 'bg-gradient-to-br from-amber-700/10 via-amber-700/5 to-transparent border-amber-700/30 dark:border-amber-700/20'
        ]"
      >
        <!-- Medalla en la esquina superior -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 border-2 border-white dark:border-zinc-700 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0">
              {{ rep.responsable.slice(0, 2).toUpperCase() }}
            </div>
            <div class="min-w-0">
              <div class="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-1.5">
                <span>{{ rep.responsable }}</span>
                <Crown v-if="idx === 0" class="w-3.5 h-3.5 text-amber-500 shrink-0" />
              </div>
              <div class="text-[10px] text-zinc-500 font-mono">
                {{ rep.deals }} negociaciones
              </div>
            </div>
          </div>

          <!-- Insignia de Rango -->
          <div
            class="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border flex items-center gap-1 shrink-0"
            :class="[
              idx === 0
                ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-sm'
                : idx === 1
                ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border-zinc-300'
                : 'bg-amber-700/20 text-amber-700 dark:text-amber-400 border-amber-700/30'
            ]"
          >
            <Medal class="w-3 h-3" />
            <span>{{ idx + 1 }}º Lugar</span>
          </div>
        </div>

        <!-- Métricas del Ejecutivo -->
        <div class="space-y-2 pt-1 border-t border-zinc-200/60 dark:border-white/[0.06]">
          <div class="flex items-baseline justify-between font-mono">
            <span class="text-[10px] text-zinc-500 uppercase tracking-wider font-sans font-medium">Volumen Cartera</span>
            <span class="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {{ formatCurrency(rep.monto) }}
            </span>
          </div>

          <!-- Barra de conversión proporcionada -->
          <div class="space-y-1">
            <div class="w-full bg-zinc-200/70 dark:bg-zinc-950 h-2 rounded-full overflow-hidden flex">
              <div
                class="bg-emerald-500 h-full rounded-full transition-all duration-500"
                :style="{ width: `${rep.tasaExito}%` }"
              ></div>
            </div>
            <div class="flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span class="text-emerald-600 dark:text-emerald-400 font-semibold">{{ rep.ganadas }} deals ganados</span>
              <span class="font-bold">{{ rep.tasaExito }}% efectividad</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SECCIÓN 2: TABLA COMPLETA DE EJECUTIVOS (Diseño Compacto de Alta Densidad) -->
    <div class="rounded-xl border border-zinc-200/80 dark:border-white/[0.07] overflow-hidden text-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-zinc-200 dark:border-white/[0.07] bg-zinc-50 dark:bg-[#0c0c0e]/80 text-zinc-500 dark:text-zinc-400 text-[10px] font-mono uppercase tracking-wider">
              <th class="py-2.5 px-4 w-12 text-center">Rango</th>
              <th class="py-2.5 px-4">Ejecutivo Comercial</th>
              <th class="py-2.5 px-4 text-center">Negociaciones</th>
              <th class="py-2.5 px-4 text-center">Deals Ganados</th>
              <th class="py-2.5 px-4">Efectividad de Cierre</th>
              <th class="py-2.5 px-4 text-right">Volumen en Cartera</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-200/70 dark:divide-white/[0.04] font-mono text-[11px]">
            <tr
              v-for="(rep, index) in responsables"
              :key="rep.responsable"
              class="hover:bg-zinc-50 dark:hover:bg-zinc-800/25 transition"
            >
              <!-- Rango -->
              <td class="py-3 px-4 text-center">
                <span
                  class="inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-[10px]"
                  :class="[
                    index === 0
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      : index === 1
                      ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      : index === 2
                      ? 'bg-amber-700/15 text-amber-700 dark:text-amber-500 border border-amber-700/30'
                      : 'text-zinc-400'
                  ]"
                >
                  {{ index + 1 }}º
                </span>
              </td>

              <!-- Colaborador -->
              <td class="py-3 px-4 font-sans font-medium text-zinc-800 dark:text-zinc-200">
                <div class="flex items-center gap-2.5">
                  <div class="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center font-bold text-[10px] text-indigo-600 dark:text-indigo-400 shrink-0">
                    {{ rep.responsable.slice(0, 2).toUpperCase() }}
                  </div>
                  <span class="font-semibold">{{ rep.responsable }}</span>
                </div>
              </td>

              <!-- Tratos Asignados -->
              <td class="py-3 px-4 text-center text-zinc-600 dark:text-zinc-400">
                {{ rep.deals }}
              </td>

              <!-- Ganados -->
              <td class="py-3 px-4 text-center">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ArrowUpRight class="w-3 h-3" />
                  {{ rep.ganadas }}
                </span>
              </td>

              <!-- Efectividad con mini barra compacta -->
              <td class="py-3 px-4">
                <div class="flex items-center gap-2 max-w-[160px]">
                  <div class="flex-1 bg-zinc-200/70 dark:bg-zinc-950 h-2 rounded-full overflow-hidden">
                    <div
                      class="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      :style="{ width: `${rep.tasaExito}%` }"
                    ></div>
                  </div>
                  <span class="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 shrink-0">
                    {{ rep.tasaExito }}%
                  </span>
                </div>
              </td>

              <!-- Volumen -->
              <td class="py-3 px-4 text-right font-bold text-zinc-900 dark:text-zinc-100">
                {{ formatCurrency(rep.monto) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
