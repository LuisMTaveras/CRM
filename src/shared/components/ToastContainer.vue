<script setup lang="ts">
import { toastService } from '@/core/notifications/toast.service';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-vue-next';

const notificaciones = toastService.notificaciones;

const iconoPorTipo = (tipo: string) => {
  switch (tipo) {
    case 'exito':
      return CheckCircle2;
    case 'error':
      return AlertCircle;
    case 'advertencia':
      return AlertTriangle;
    default:
      return Info;
  }
};

const estiloPorTipo = (tipo: string) => {
  switch (tipo) {
    case 'exito':
      return 'border-emerald-500/30 text-emerald-300 bg-zinc-950/95';
    case 'error':
      return 'border-rose-500/30 text-rose-300 bg-zinc-950/95';
    case 'advertencia':
      return 'border-amber-500/30 text-amber-300 bg-zinc-950/95';
    default:
      return 'border-sky-500/30 text-sky-300 bg-zinc-950/95';
  }
};

const colorIcono = (tipo: string) => {
  switch (tipo) {
    case 'exito':
      return 'text-emerald-400';
    case 'error':
      return 'text-rose-400';
    case 'advertencia':
      return 'text-amber-400';
    default:
      return 'text-sky-400';
  }
};
</script>

<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
    <transition-group
      enter-active-class="transform ease-out duration-200 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-for="toast in notificaciones"
        :key="toast.id"
        :class="[
          'pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md text-xs leading-relaxed',
          estiloPorTipo(toast.tipo)
        ]"
      >
        <component
          :is="iconoPorTipo(toast.tipo)"
          :class="['w-4 h-4 shrink-0 mt-0.5', colorIcono(toast.tipo)]"
        />
        <div class="flex-1 text-zinc-200 font-medium select-none">
          {{ toast.mensaje }}
        </div>
        <button
          @click="toastService.remover(toast.id)"
          class="text-zinc-500 hover:text-zinc-300 transition shrink-0 p-0.5 rounded"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>
    </transition-group>
  </div>
</template>
