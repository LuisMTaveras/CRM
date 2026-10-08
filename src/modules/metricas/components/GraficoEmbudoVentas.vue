<script setup lang="ts">
import { ref, computed } from 'vue';
import type { EtapaMetrica } from '../types/metricas.types';
import { formatCurrency } from '@/core/formatters/formatters';
import { Filter, CheckCircle2, XCircle, ArrowRight } from 'lucide-vue-next';

const props = defineProps<{
  etapas: EtapaMetrica[];
  totalOportunidades: number;
}>();

const etapaHover = ref<string | null>(null);

const etapasEmbudo = computed(() => props.etapas.filter((e) => e.etapa !== 'perdida'));
const etapaPerdida = computed(() => props.etapas.find((e) => e.etapa === 'perdida'));

// Monto máximo para calcular anchos de embudo proporcionales
const maxMonto = computed(() => Math.max(...etapasEmbudo.value.map((e) => e.monto), 1));

const estilosEtapa: Record<string, {
  color: string;
  gradiente: string;
  borde: string;
  pill: string;
  badge: string;
}> = {
  calificacion: {
    color: '#6366f1',
    gradiente: 'from-indigo-600/20 via-indigo-600/10 to-transparent',
    borde: 'border-indigo-500/30',
    pill: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    badge: 'bg-indigo-600 text-white',
  },
  propuesta: {
    color: '#0ea5e9',
    gradiente: 'from-sky-600/20 via-sky-600/10 to-transparent',
    borde: 'border-sky-500/30',
    pill: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    badge: 'bg-sky-600 text-white',
  },
  negociacion: {
    color: '#f59e0b',
    gradiente: 'from-amber-600/20 via-amber-600/10 to-transparent',
    borde: 'border-amber-500/30',
    pill: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    badge: 'bg-amber-600 text-white',
  },
  ganada: {
    color: '#10b981',
    gradiente: 'from-emerald-600/20 via-emerald-600/10 to-transparent',
    borde: 'border-emerald-500/30',
    pill: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    badge: 'bg-emerald-600 text-white',
  },
};
</script>

<template>
  <div class="saas-card rounded-2xl p-5 border border-zinc-200 dark:border-white/[0.08] flex flex-col justify-between bg-white dark:bg-zinc-900/90 shadow-sm transition-all duration-200">
    <!-- Cabecera -->
    <div class="flex items-center justify-between border-b border-zinc-100 dark:border-white/[0.06] pb-3 mb-4">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Filter class="w-4 h-4" />
        </div>
        <div>
          <h3 class="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Embudo de Conversión & Progresión de Deals
          </h3>
          <p class="text-[11px] text-zinc-500 font-mono">
            Rendimiento de pase entre etapas y volumen monetario
          </p>
        </div>
      </div>
      <span class="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.06]">
        {{ totalOportunidades }} Deals Totales
      </span>
    </div>

    <!-- Representación de Embudo Continuo / Pipeline Interactivo -->
    <div class="space-y-3">
      <div
        v-for="(etapa, index) in etapasEmbudo"
        :key="etapa.etapa"
        @mouseenter="etapaHover = etapa.etapa"
        @mouseleave="etapaHover = null"
        :class="[
          'relative rounded-xl border p-3 transition-all duration-200 cursor-pointer overflow-hidden',
          estilosEtapa[etapa.etapa]?.borde || 'border-zinc-200',
          etapaHover === etapa.etapa
            ? 'bg-zinc-100/90 dark:bg-zinc-800/90 shadow-md scale-[1.01]'
            : 'bg-zinc-50/70 dark:bg-zinc-900/50 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40'
        ]"
      >
        <!-- Barra de progreso de fondo con gradiente de embudo -->
        <div
          class="absolute inset-y-0 left-0 bg-gradient-to-r opacity-30 dark:opacity-20 pointer-events-none transition-all duration-500"
          :class="estilosEtapa[etapa.etapa]?.gradiente"
          :style="{ width: `${Math.max(10, (etapa.monto / maxMonto) * 100)}%` }"
        ></div>

        <div class="relative z-10 flex flex-col gap-2">
          <!-- Fila de Encabezado -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span
                class="w-5 h-5 rounded-lg flex items-center justify-center font-bold font-mono text-[10px] shadow-sm"
                :class="estilosEtapa[etapa.etapa]?.badge"
              >
                {{ index + 1 }}
              </span>
              <span class="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                {{ etapa.nombre }}
              </span>
              <span
                class="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border"
                :class="estilosEtapa[etapa.etapa]?.pill"
              >
                {{ etapa.cantidad }} tratos
              </span>
            </div>

            <!-- Importe total de la etapa -->
            <div class="text-right font-mono text-xs">
              <span class="font-bold text-zinc-900 dark:text-zinc-100">
                {{ formatCurrency(etapa.monto) }}
              </span>
            </div>
          </div>

          <!-- Barra visual proporcional estilizada -->
          <div class="w-full bg-zinc-200/60 dark:bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-200/50 dark:border-white/[0.04]">
            <div
              class="h-full rounded-full transition-all duration-500 ease-out"
              :style="{
                width: `${Math.max(6, (etapa.monto / maxMonto) * 100)}%`,
                backgroundColor: estilosEtapa[etapa.etapa]?.color
              }"
            ></div>
          </div>

          <!-- Métricas de conversión y retención -->
          <div class="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 font-mono pt-0.5">
            <span>{{ etapa.porcentaje }}% del portafolio total</span>
            <div class="flex items-center gap-1.5 font-medium">
              <span v-if="index === 0" class="text-indigo-600 dark:text-indigo-400">
                Fase de Entrada (100%)
              </span>
              <span v-else-if="etapa.etapa === 'ganada'" class="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 class="w-3 h-3" />
                <span>{{ etapa.tasaConversionEtapa }}% cierre exitoso</span>
              </span>
              <span v-else class="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
                <ArrowRight class="w-3 h-3 text-zinc-400" />
                <span>{{ etapa.tasaConversionEtapa }}% retención</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tarjeta Breakout: Cerrada Perdida -->
      <div
        v-if="etapaPerdida"
        class="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 dark:bg-rose-500/10 flex items-center justify-between text-xs font-mono"
      >
        <div class="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-medium">
          <XCircle class="w-3.5 h-3.5" />
          <span>{{ etapaPerdida.nombre }}</span>
          <span class="text-[10px] opacity-75">({{ etapaPerdida.cantidad }} tratos descartados)</span>
        </div>
        <div class="font-bold text-rose-700 dark:text-rose-400">
          {{ formatCurrency(etapaPerdida.monto) }}
        </div>
      </div>
    </div>
  </div>
</template>
