<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { dialogService } from '@/core/dialog/dialog.service';
import {
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  Send,
  AlertOctagon,
} from 'lucide-vue-next';

const estado = dialogService.estado;

const iconoCabecera = computed(() => {
  switch (estado.value.tipo) {
    case 'peligro':
      return Trash2;
    case 'advertencia':
      return AlertTriangle;
    case 'exito':
      return CheckCircle2;
    case 'primario':
      return Send;
    default:
      return Info;
  }
});

const estiloIconoBox = computed(() => {
  switch (estado.value.tipo) {
    case 'peligro':
      return 'bg-rose-500/10 border-rose-500/25 text-rose-500 dark:text-rose-400';
    case 'advertencia':
      return 'bg-amber-500/10 border-amber-500/25 text-amber-500 dark:text-amber-400';
    case 'exito':
      return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500 dark:text-emerald-400';
    case 'primario':
      return 'bg-indigo-500/10 border-indigo-500/25 text-indigo-600 dark:text-indigo-400';
    default:
      return 'bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300';
  }
});

const estiloBotonConfirmar = computed(() => {
  switch (estado.value.tipo) {
    case 'peligro':
      return 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500/40 shadow-rose-950/50';
    case 'advertencia':
      return 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500/40 shadow-amber-950/50';
    case 'exito':
      return 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/40 shadow-emerald-950/50';
    case 'primario':
      return 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/40 shadow-indigo-950/30';
    default:
      return 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-white/[0.1] shadow-black/40';
  }
});

const onKeydown = (e: KeyboardEvent) => {
  if (!estado.value.abierto) return;
  if (e.key === 'Escape') {
    dialogService.cancelar();
  } else if (e.key === 'Enter') {
    dialogService.aceptar();
  }
};

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <teleport to="body">
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="estado.abierto"
        class="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none"
        @click.self="dialogService.cancelar()"
      >
        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="estado.abierto"
            class="relative w-full max-w-lg bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/[0.09] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            role="dialog"
            aria-modal="true"
          >
            <!-- Cabecera de Alto Impacto con Icono, Título y Subtítulo en Mayúsculas -->
            <div class="p-5 border-b border-zinc-200 dark:border-white/[0.07] bg-zinc-50 dark:bg-[#0c0c0e] flex items-center justify-between gap-4">
              <div class="flex items-center gap-3.5 min-w-0">
                <div
                  :class="[
                    'w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-inner',
                    estiloIconoBox
                  ]"
                >
                  <component :is="iconoCabecera" class="w-5 h-5" />
                </div>
                <div class="min-w-0">
                  <h3 class="text-sm sm:text-base font-extrabold uppercase tracking-wide text-zinc-900 dark:text-zinc-100 truncate">
                    {{ estado.titulo }}
                  </h3>
                  <p class="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                    {{ estado.subtitulo || 'CONFIRMACIÓN DEL SISTEMA' }}
                  </p>
                </div>
              </div>

              <!-- Botón de Cerrar (X) -->
              <button
                type="button"
                @click="dialogService.cancelar()"
                class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shrink-0"
                title="Cerrar modal"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <!-- Cuerpo del Mensaje -->
            <div class="p-6 space-y-4">
              <p class="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {{ estado.mensaje }}
              </p>

              <!-- Detalle o Advertencia Adicional si existe -->
              <div
                v-if="estado.detalle"
                class="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/[0.06] text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-2.5"
              >
                <AlertOctagon class="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                <span class="leading-relaxed">{{ estado.detalle }}</span>
              </div>
            </div>

            <!-- Pie de Botones con Estilo Idéntico a la Referencia -->
            <div class="p-4 border-t border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-zinc-950/60 flex items-center justify-end gap-3">
              <!-- Botón Cancelar -->
              <button
                v-if="!estado.soloConfirmar"
                type="button"
                @click="dialogService.cancelar()"
                class="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-300 dark:border-white/[0.08] text-xs font-bold uppercase tracking-wider transition active:scale-[0.98]"
              >
                {{ estado.textoCancelar || 'CANCELAR' }}
              </button>

              <!-- Botón Acción Principal -->
              <button
                type="button"
                @click="dialogService.aceptar()"
                :class="[
                  'px-6 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 active:scale-[0.98]',
                  estiloBotonConfirmar
                ]"
              >
                <component :is="iconoCabecera" class="w-3.5 h-3.5 shrink-0" />
                <span>{{ estado.textoConfirmar }}</span>
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>
