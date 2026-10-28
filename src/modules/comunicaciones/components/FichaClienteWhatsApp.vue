<script setup lang="ts">
import { Building2, Calendar, ChevronRight, Kanban } from 'lucide-vue-next';
import type { Cliente } from '@/modules/clientes/types/cliente.types';

defineProps<{
  cliente: Cliente;
}>();

const emit = defineEmits<{
  'crear-trato': [];
  'agendar-reunion': [];
}>();
</script>

<template>
  <aside class="w-72 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col text-xs shrink-0 hidden lg:flex">
    <div class="flex items-center gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-4">
      <Building2 class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
      <span class="font-bold text-zinc-900 dark:text-zinc-100">Ficha del Cliente</span>
    </div>

    <div class="space-y-4 flex-1 overflow-y-auto">
      <div>
        <div class="font-bold text-sm text-zinc-900 dark:text-zinc-100">
          {{ cliente.nombre_comercial || cliente.razon_social }}
        </div>
        <div class="text-[11px] text-zinc-500 font-mono">{{ cliente.razon_social }}</div>
      </div>

      <div class="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
        <div>
          <span class="text-[10px] text-zinc-400 block">RNC / Identificación</span>
          <span class="font-mono font-medium">{{ cliente.identificacion_fiscal || '—' }}</span>
        </div>
        <div>
          <span class="text-[10px] text-zinc-400 block">Sector Económico</span>
          <span class="font-medium capitalize">{{ cliente.sector || '—' }}</span>
        </div>
        <div>
          <span class="text-[10px] text-zinc-400 block">Contacto Registrado</span>
          <span class="font-medium">{{ cliente.contactos?.[0]?.nombre || '—' }}</span>
        </div>
        <div>
          <span class="text-[10px] text-zinc-400 block">Ejecutivo Asignado</span>
          <span class="font-medium">{{ cliente.responsable || '—' }}</span>
        </div>
      </div>

      <!-- Acciones directas con el cliente -->
      <div class="space-y-2 pt-2">
        <button
          type="button"
          @click="emit('crear-trato')"
          class="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 transition font-medium text-xs"
        >
          <div class="flex items-center gap-2">
            <Kanban class="w-4 h-4" />
            <span>Crear Oportunidad Kanban</span>
          </div>
          <ChevronRight class="w-4 h-4 opacity-75" />
        </button>

        <button
          type="button"
          @click="emit('agendar-reunion')"
          class="w-full flex items-center justify-between p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 hover:bg-sky-500/20 text-sky-700 dark:text-sky-400 transition font-medium text-xs"
        >
          <div class="flex items-center gap-2">
            <Calendar class="w-4 h-4" />
            <span>Agendar Reunión o Tarea</span>
          </div>
          <ChevronRight class="w-4 h-4 opacity-75" />
        </button>

        <router-link
          :to="{ path: '/pipeline' }"
          class="w-full flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition font-medium text-zinc-700 dark:text-zinc-300 text-xs"
        >
          <span>Ver Tablero Kanban</span>
          <ChevronRight class="w-4 h-4 text-zinc-400" />
        </router-link>
      </div>
    </div>
  </aside>
</template>
