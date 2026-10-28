<script setup lang="ts">
import { Building2, FileText, Folder, GitMerge, Globe, Star } from 'lucide-vue-next';
import { formatRelativeTime } from '@/core/formatters/formatters';
import type { MensajeCorreo } from '../types/webmail.types';

defineProps<{
  msg: MensajeCorreo;
  seleccionado: boolean;
  busquedaGlobal: boolean;
  nombreCarpeta: string;
}>();

const emit = defineEmits<{
  seleccionar: [];
  'toggle-destacado': [event: MouseEvent];
}>();
</script>

<template>
  <div
    @click="emit('seleccionar')"
    class="p-4 cursor-pointer transition-all relative border-l-4"
    :class="[
      seleccionado
        ? 'bg-indigo-50/70 dark:bg-zinc-800/90 border-indigo-600 dark:border-indigo-500 shadow-sm'
        : 'border-transparent hover:bg-zinc-50/90 dark:hover:bg-zinc-800/40',
      !msg.leido ? 'bg-zinc-50/60 dark:bg-zinc-950/40' : ''
    ]"
  >
    <!-- Fila superior: Remitente y Fecha -->
    <div class="flex items-center justify-between gap-2 mb-1.5">
      <div class="flex items-center gap-2 min-w-0">
        <!-- Indicador visual de no leído -->
        <span
          v-if="!msg.leido"
          class="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 ring-2 ring-indigo-500/20"
          title="Mensaje no leído"
        ></span>
        <span
          class="text-xs truncate"
          :class="!msg.leido ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-700 dark:text-zinc-300 font-medium'"
        >
          {{ msg.de.nombre || msg.de.correo }}
        </span>
        <span
          v-if="!msg.leido"
          class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/25 shrink-0"
        >
          Nuevo
        </span>
      </div>

      <div class="flex items-center gap-1.5 shrink-0">
        <span class="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
          {{ formatRelativeTime(msg.fecha) }}
        </span>
        <button
          type="button"
          @click.stop="emit('toggle-destacado', $event)"
          class="p-1 text-zinc-400 hover:text-amber-500 transition rounded"
          :class="msg.destacado ? 'text-amber-500' : ''"
        >
          <Star class="w-3.5 h-3.5" :class="msg.destacado ? 'fill-amber-500' : ''" />
        </button>
      </div>
    </div>

    <!-- Asunto -->
    <div
      class="text-xs truncate mb-1"
      :class="!msg.leido ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-800 dark:text-zinc-200 font-medium'"
    >
      {{ msg.asunto }}
    </div>

    <!-- Extracto -->
    <p class="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
      {{ msg.extracto }}
    </p>

    <!-- Badges inferiores (Cliente CRM / Hilo / Carpeta / Adjuntos / Servidor) -->
    <div class="flex items-center gap-2 mt-2.5 flex-wrap">
      <span
        v-if="msg.clienteNombreRelacionado"
        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20"
      >
        <Building2 class="w-3 h-3" />
        <span class="truncate max-w-[150px]">{{ msg.clienteNombreRelacionado }}</span>
      </span>

      <span
        v-if="msg.totalEnHilo && msg.totalEnHilo > 1"
        class="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20"
        title="Respuestas en esta conversación"
      >
        <GitMerge class="w-3 h-3 text-indigo-500" />
        <span>{{ msg.totalEnHilo }}</span>
      </span>

      <span
        v-if="busquedaGlobal && msg.carpeta"
        class="inline-flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 font-mono"
      >
        <Folder class="w-2.5 h-2.5" />
        <span>{{ nombreCarpeta }}</span>
      </span>

      <span
        v-if="msg.esCoincidenciaServidor"
        class="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-500/10 border border-sky-500/20"
        title="Mensaje sincronizado desde el servidor remoto IMAP"
      >
        <Globe class="w-3 h-3 text-sky-500" />
        <span>Servidor IMAP</span>
      </span>

      <span
        v-if="msg.tieneAdjuntos || (msg.adjuntos && msg.adjuntos.length > 0)"
        class="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md font-mono transition-colors"
        :class="!msg.leido
          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold shadow-xs'
          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60'"
      >
        <FileText class="w-3 h-3" :class="!msg.leido ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'" />
        <span>
          {{ !msg.leido
            ? (msg.adjuntos?.length ? `${msg.adjuntos.length} doc. nuevo(s)` : 'Doc. nuevo')
            : (msg.adjuntos?.length ? `${msg.adjuntos.length} adjuntos` : 'Con adjuntos')
          }}
        </span>
      </span>
    </div>
  </div>
</template>
