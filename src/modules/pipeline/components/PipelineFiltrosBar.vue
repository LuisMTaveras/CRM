<script setup lang="ts">
import { AlertTriangle, Briefcase, Calendar, Filter, Kanban, Search, UserCheck } from 'lucide-vue-next';
import AppSelect, { type SelectOption } from '@/shared/components/AppSelect.vue';
import { formatCurrency } from '@/core/formatters/formatters';
import type { TipoPipeline } from '../types/pipeline.types';

defineProps<{
  tipoPipeline?: TipoPipeline;
  opcionesResponsables: Array<SelectOption<string>>;
  opcionesPrioridades: Array<SelectOption<string>>;
  totalTarjetasEstancadas: number;
  totalTarjetasHoy: number;
  volumenEconomico: number;
}>();

const emit = defineEmits<{
  recargar: [];
}>();

const vistaActiva = defineModel<'tablero' | 'calendario'>('vistaActiva', { required: true });
const busqueda = defineModel<string | undefined>('busqueda', { required: true });
const responsable = defineModel<string | undefined>('responsable', { required: true });
const prioridad = defineModel<string | undefined>('prioridad', { required: true });
const soloEstancados = defineModel<boolean>('soloEstancados', { required: true });
const soloHoy = defineModel<boolean>('soloHoy', { required: true });
const tipoAgrupacion = defineModel<'ninguna' | 'responsable' | 'sector'>('tipoAgrupacion', {
  required: true,
});
</script>

<template>
  <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900/60 p-3 rounded-xl border border-zinc-200 dark:border-white/[0.06] text-xs shadow-sm">
    <div class="flex flex-wrap items-center gap-2.5 flex-1">
      <!-- Conmutador de Vistas dentro de la barra -->
      <div class="inline-flex items-center p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-white/[0.08] shadow-xs shrink-0">
        <button
          type="button"
          @click="vistaActiva = 'tablero'"
          :class="[
            vistaActiva === 'tablero'
              ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium'
          ]"
          class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition"
          title="Vista Tablero Kanban"
        >
          <Kanban class="w-3.5 h-3.5" />
          <span>Tablero</span>
        </button>

        <button
          type="button"
          @click="vistaActiva = 'calendario'"
          :class="[
            vistaActiva === 'calendario'
              ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium'
          ]"
          class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition"
          title="Vista Calendario"
        >
          <Calendar class="w-3.5 h-3.5" />
          <span>Calendario</span>
        </button>
      </div>

      <!-- Búsqueda -->
      <div class="relative min-w-[200px] flex-1 sm:flex-initial">
        <Search class="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3 top-2.5" />
        <input
          :value="busqueda ?? ''"
          @input="(evento) => { busqueda = (evento.target as HTMLInputElement).value; emit('recargar'); }"
          type="text"
          :placeholder="tipoPipeline === 'visitas' ? 'Buscar cliente o motivo de visita...' : 'Buscar cliente o trato...'"
          class="w-full pl-9 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      <!-- Filtro por Responsable -->
      <div class="flex items-center gap-1.5">
        <Filter class="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 hidden sm:block" />
        <AppSelect
          :model-value="responsable ?? ''"
          @update:model-value="(valor) => { responsable = String(valor); emit('recargar'); }"
          :options="opcionesResponsables"
          size="sm"
          min-width-class="min-w-[200px]"
        />
      </div>

      <!-- Filtro por Prioridad -->
      <div class="flex items-center gap-1.5">
        <AppSelect
          :model-value="prioridad ?? ''"
          @update:model-value="(valor) => { prioridad = String(valor); emit('recargar'); }"
          :options="opcionesPrioridades"
          size="sm"
          min-width-class="min-w-[180px]"
        />
      </div>

      <!-- Filtro Rápido: Clientes Estancados (> 10 días sin interacción) -->
      <button
        type="button"
        @click="soloEstancados = !soloEstancados"
        class="px-2.5 py-1.5 rounded-xl border text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
        :class="[
          soloEstancados
            ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
        ]"
        :title="soloEstancados ? 'Mostrar todas las tarjetas' : 'Filtrar para ver solo oportunidades estancadas (> 10 días)'"
      >
        <AlertTriangle class="w-3.5 h-3.5 text-amber-500" />
        <span>Estancados (> 10d)</span>
        <span
          v-if="totalTarjetasEstancadas > 0"
          class="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono font-semibold"
        >
          {{ totalTarjetasEstancadas }}
        </span>
      </button>

      <!-- Filtro Rápido: Elementos para HOY -->
      <button
        type="button"
        @click="soloHoy = !soloHoy"
        class="px-2.5 py-1.5 rounded-xl border text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
        :class="[
          soloHoy
            ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20 font-semibold'
            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
        ]"
        :title="soloHoy ? 'Mostrar todas las tarjetas' : 'Filtrar para ver solo elementos con fecha para hoy'"
      >
        <span
          class="w-1.5 h-1.5 rounded-full shrink-0"
          :class="[
            soloHoy
              ? 'bg-indigo-600 dark:bg-indigo-400 animate-pulse'
              : totalTarjetasHoy > 0
              ? 'bg-indigo-600 dark:bg-indigo-400 animate-pulse'
              : 'bg-zinc-400'
          ]"
        ></span>
        <span>Para Hoy</span>
        <span
          v-if="totalTarjetasHoy > 0"
          class="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 font-mono font-semibold"
        >
          {{ totalTarjetasHoy }}
        </span>
      </button>

      <!-- Agrupación por Carriles (Swimlanes) -->
      <div class="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-200 dark:border-white/[0.08] text-xs">
        <span class="text-[10px] text-zinc-500 font-medium px-1.5 hidden md:inline">Carriles:</span>
        <button
          @click="tipoAgrupacion = 'ninguna'"
          class="px-2 py-1 rounded-md transition font-medium text-xs"
          :class="tipoAgrupacion === 'ninguna' ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-300 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
          title="Vista estándar tradicional"
        >
          Estándar
        </button>
        <button
          @click="tipoAgrupacion = 'responsable'"
          class="px-2 py-1 rounded-md transition font-medium text-xs flex items-center gap-1"
          :class="tipoAgrupacion === 'responsable' ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-300 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
          title="Agrupar filas por responsable"
        >
          <UserCheck class="w-3 h-3" />
          <span>Por Responsable</span>
        </button>
        <button
          @click="tipoAgrupacion = 'sector'"
          class="px-2 py-1 rounded-md transition font-medium text-xs flex items-center gap-1"
          :class="tipoAgrupacion === 'sector' ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-300 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
          title="Agrupar filas por sector económico"
        >
          <Briefcase class="w-3 h-3" />
          <span>Por Sector</span>
        </button>
      </div>
    </div>

    <div class="flex items-center justify-between sm:justify-end gap-3 text-xs pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200 dark:border-white/[0.05]">
      <span class="text-zinc-500 font-medium">Volumen Económico:</span>
      <span class="font-mono font-semibold text-indigo-600 dark:text-indigo-400 text-sm">
        {{ formatCurrency(volumenEconomico) }}
      </span>
    </div>
  </div>
</template>
