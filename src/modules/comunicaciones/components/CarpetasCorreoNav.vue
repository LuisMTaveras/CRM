<script setup lang="ts">
import { Archive, FileEdit, FolderPlus, Inbox, Send, SlidersHorizontal, Trash2 } from 'lucide-vue-next';
import type { CarpetaCorreo, CarpetaCorreoId } from '../types/webmail.types';
import type { CarpetaPersonalizada } from '../types/reglas-correo.types';

defineProps<{
  carpetas: CarpetaCorreo[];
  carpetaActiva: CarpetaCorreoId;
  carpetasPersonalizadas: CarpetaPersonalizada[];
  totalNoLeidos: number;
  totalReglasActivas: number;
  cuentaConfigurada: string;
  protocoloImap: string;
  imapActivo: boolean;
}>();

const emit = defineEmits<{
  seleccionar: [id: CarpetaCorreoId];
  'administrar-reglas': [];
}>();

const obtenerColorPuntoCarpeta = (color?: string) => {
  switch (color) {
    case 'emerald': return 'bg-emerald-500';
    case 'amber': return 'bg-amber-500';
    case 'rose': return 'bg-rose-500';
    case 'purple': return 'bg-purple-500';
    case 'sky':
    case 'teal': return 'bg-sky-500';
    default: return 'bg-indigo-500';
  }
};
</script>

<template>
  <div class="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 flex flex-col justify-between shadow-sm">
    <div class="space-y-1">
      <div class="px-3 py-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono flex items-center justify-between">
        <span>Carpetas</span>
        <span
          v-if="totalNoLeidos > 0"
          class="px-2 py-0.5 bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 text-[9px] rounded-full font-bold"
        >
          {{ totalNoLeidos }} {{ totalNoLeidos === 1 ? 'nuevo' : 'nuevos' }}
        </span>
      </div>

      <!-- Bandeja de Entrada -->
      <button
        type="button"
        @click="emit('seleccionar', 'inbox')"
        class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition"
        :class="carpetaActiva === 'inbox'
          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 font-semibold'
          : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'"
      >
        <span class="flex items-center gap-2.5">
          <Inbox class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Bandeja</span>
        </span>
        <span
          v-if="(carpetas.find(c => c.id === 'inbox')?.noLeidos || 0) > 0"
          class="px-2 py-0.5 rounded-full text-[10px] bg-indigo-600 text-white font-bold tracking-tight shadow-xs"
        >
          {{ carpetas.find(c => c.id === 'inbox')?.noLeidos }} {{ carpetas.find(c => c.id === 'inbox')?.noLeidos === 1 ? 'nuevo' : 'nuevos' }}
        </span>
        <span v-else class="text-[10px] text-zinc-400 font-mono">
          {{ carpetas.find(c => c.id === 'inbox')?.total || 0 }}
        </span>
      </button>

      <!-- Enviados -->
      <button
        type="button"
        @click="emit('seleccionar', 'enviados')"
        class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition"
        :class="carpetaActiva === 'enviados'
          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 font-semibold'
          : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'"
      >
        <span class="flex items-center gap-2.5">
          <Send class="w-4 h-4 text-sky-500" />
          <span>Enviados</span>
        </span>
        <span class="text-[10px] text-zinc-400 font-mono">
          {{ carpetas.find(c => c.id === 'enviados')?.total || 0 }}
        </span>
      </button>

      <!-- Borradores -->
      <button
        type="button"
        @click="emit('seleccionar', 'borradores')"
        class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition"
        :class="carpetaActiva === 'borradores'
          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 font-semibold'
          : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'"
      >
        <span class="flex items-center gap-2.5">
          <FileEdit class="w-4 h-4 text-amber-500" />
          <span>Borradores</span>
        </span>
        <span class="text-[10px] text-zinc-400 font-mono">
          {{ carpetas.find(c => c.id === 'borradores')?.total || 0 }}
        </span>
      </button>

      <!-- Archivados -->
      <button
        type="button"
        @click="emit('seleccionar', 'archivados')"
        class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition"
        :class="carpetaActiva === 'archivados'
          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 font-semibold'
          : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'"
      >
        <span class="flex items-center gap-2.5">
          <Archive class="w-4 h-4 text-purple-500" />
          <span>Archivados</span>
        </span>
        <span class="text-[10px] text-zinc-400 font-mono">
          {{ carpetas.find(c => c.id === 'archivados')?.total || 0 }}
        </span>
      </button>

      <!-- Papelera -->
      <button
        type="button"
        @click="emit('seleccionar', 'papelera')"
        class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition"
        :class="carpetaActiva === 'papelera'
          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 font-semibold'
          : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'"
      >
        <span class="flex items-center gap-2.5">
          <Trash2 class="w-4 h-4 text-rose-500" />
          <span>Papelera</span>
        </span>
        <span class="text-[10px] text-zinc-400 font-mono">
          {{ carpetas.find(c => c.id === 'papelera')?.total || 0 }}
        </span>
      </button>

      <!-- Sección: Carpetas Inteligentes / Personalizadas por Reglas -->
      <div class="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
        <div class="px-3 py-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono flex items-center justify-between">
          <span>Carpetas Reglas</span>
          <button
            type="button"
            @click="emit('administrar-reglas')"
            title="Crear regla o carpeta automática"
            class="p-1 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            <FolderPlus class="w-3.5 h-3.5" />
          </button>
        </div>

        <div v-if="carpetasPersonalizadas.length === 0" class="px-3 py-1 text-[11px] text-zinc-400 italic">
          Sin carpetas personalizadas
        </div>

        <button
          v-for="carp in carpetasPersonalizadas"
          :key="carp.id"
          type="button"
          @click="emit('seleccionar', carp.id)"
          class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition"
          :class="carpetaActiva === carp.id
            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 font-semibold'
            : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'"
        >
          <span class="flex items-center gap-2.5 min-w-0">
            <span
              class="w-2.5 h-2.5 rounded-full shrink-0"
              :class="obtenerColorPuntoCarpeta(carp.color)"
            />
            <span class="truncate">{{ carp.nombre }}</span>
          </span>
          <span class="text-[10px] text-zinc-400 font-mono shrink-0 ml-1">
            {{ carpetas.find(c => c.id === carp.id)?.total || 0 }}
          </span>
        </button>

        <!-- Botón Configurar Reglas Automáticas y Gestión de Carpetas -->
        <button
          type="button"
          @click="emit('administrar-reglas')"
          class="w-full mt-2 flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200/60 dark:border-indigo-500/20 transition"
        >
          <span class="flex items-center gap-2 min-w-0">
            <SlidersHorizontal class="w-3.5 h-3.5 shrink-0" />
            <span class="truncate">Administrar Reglas & Carpetas</span>
          </span>
          <span
            v-if="totalReglasActivas > 0"
            class="px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[9px] font-bold"
          >
            {{ totalReglasActivas }}
          </span>
        </button>
      </div>
    </div>

    <!-- Tarjeta de Cuenta Activa & Protocolo IMAP -->
    <div class="mt-6 pt-3.5 border-t border-zinc-200 dark:border-zinc-800 p-2 space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-[9px] uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-500 font-mono">
          Cuenta Vinculada
        </span>
        <span
          class="inline-flex items-center gap-1 text-[10px] font-medium"
          :class="imapActivo ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'"
        >
          <span
            class="w-1.5 h-1.5 rounded-full"
            :class="imapActivo ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'"
          ></span>
          <span>{{ protocoloImap }}</span>
        </span>
      </div>

      <div class="flex items-center gap-2 min-w-0">
        <div class="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-indigo-500/20">
          {{ (cuentaConfigurada || 'CRM').substring(0, 2).toUpperCase() }}
        </div>
        <div class="min-w-0">
          <div class="font-mono truncate text-[11px] text-zinc-800 dark:text-zinc-200 font-medium" :title="cuentaConfigurada || 'Sin cuenta configurada'">
            {{ cuentaConfigurada || 'Sin configurar' }}
          </div>
          <router-link
            to="/configuracion?tab=correo"
            class="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline block"
          >
            Cambiar en Ajustes
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
