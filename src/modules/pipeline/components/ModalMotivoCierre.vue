<script setup lang="ts">
import { ref } from 'vue';
import { X, AlertOctagon, Check } from 'lucide-vue-next';
import type { TarjetaPipeline } from '../types/pipeline.types';

defineProps<{
  abierto: boolean;
  tarjeta: TarjetaPipeline | null;
  tipoCierre?: 'perdida' | 'bloqueo' | 'ganada';
}>();

const emit = defineEmits<{
  (e: 'cerrar'): void;
  (e: 'confirmar', payload: { motivo: string; notas: string }): void;
}>();

const OPCIONES_MOTIVOS_PERDIDA = [
  'Presupuesto congelado / Sin fondos',
  'Prefirió propuesta de la competencia',
  'Precio elevado / Desacuerdo comercial',
  'Proyecto o requerimiento cancelado',
  'Sin respuesta del cliente / Lead frío',
  'Plazos de entrega no compatibles',
  'Otro motivo particular',
];

const motivoSeleccionado = ref(OPCIONES_MOTIVOS_PERDIDA[0]);
const notas = ref('');

const confirmar = () => {
  emit('confirmar', {
    motivo: motivoSeleccionado.value,
    notas: notas.value.trim(),
  });
};
</script>

<template>
  <div
    v-if="abierto && tarjeta"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
  >
    <div
      class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.1] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
    >
      <!-- Cabecera -->
      <div class="px-5 py-4 border-b border-zinc-200 dark:border-white/[0.08] flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertOctagon class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Registrar Motivo de Pérdida / Pausa
            </h3>
            <p class="text-[11px] text-zinc-500 truncate max-w-[280px]">
              {{ tarjeta.titulo }}
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="emit('cerrar')"
          class="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Contenido -->
      <div class="p-5 space-y-4 text-xs">
        <div>
          <label class="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2 font-mono">
            Causa Principal del Descarte
          </label>
          <div class="space-y-1.5">
            <label
              v-for="opcion in OPCIONES_MOTIVOS_PERDIDA"
              :key="opcion"
              class="flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition text-xs"
              :class="[
                motivoSeleccionado === opcion
                  ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 text-zinc-900 dark:text-zinc-100 font-semibold'
                  : 'border-zinc-200 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
              ]"
            >
              <input
                type="radio"
                name="motivo-cierre"
                :value="opcion"
                v-model="motivoSeleccionado"
                class="hidden"
              />
              <span
                class="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition"
                :class="[
                  motivoSeleccionado === opcion
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-zinc-300 dark:border-zinc-700'
                ]"
              >
                <Check v-if="motivoSeleccionado === opcion" class="w-2.5 h-2.5 stroke-[3]" />
              </span>
              <span>{{ opcion }}</span>
            </label>
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5 font-mono">
            Observaciones & Lecciones Aprendidas (Opcional)
          </label>
          <textarea
            v-model="notas"
            rows="3"
            placeholder="Detalles sobre feedback del cliente o condiciones de recontacto..."
            class="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 text-xs focus:outline-none focus:border-indigo-500 transition resize-none"
          ></textarea>
        </div>
      </div>

      <!-- Pie de Modal -->
      <div class="px-5 py-3.5 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-200 dark:border-white/[0.08] flex items-center justify-end gap-2">
        <button
          type="button"
          @click="emit('cerrar')"
          class="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          Cancelar
        </button>

        <button
          type="button"
          @click="confirmar"
          class="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition active:scale-95"
        >
          Confirmar Motivo
        </button>
      </div>
    </div>
  </div>
</template>
