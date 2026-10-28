<script setup lang="ts">
import { Globe, Loader2, RefreshCw, Search, Send, SlidersHorizontal, X } from 'lucide-vue-next';

defineProps<{
  buscandoEnServidor: boolean;
  coincidenciasServidorContador: number;
  nombreCarpetaActiva: string;
  sincronizando: boolean;
  cargando: boolean;
  totalReglasActivas: number;
  puedeEnviar: boolean;
  puedeConfigurar: boolean;
}>();

const emit = defineEmits<{
  sincronizar: [];
  'administrar-reglas': [];
  redactar: [];
}>();

const busqueda = defineModel<string>('busqueda', { required: true });
const busquedaGlobal = defineModel<boolean>('busquedaGlobal', { required: true });
</script>

<template>
  <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-colors">
    <!-- Búsqueda rápida con botón de limpiar y selector global -->
    <div class="flex items-center gap-2 flex-1 max-w-xl">
      <div class="relative flex-1">
        <Search class="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          v-model="busqueda"
          :placeholder="busquedaGlobal ? 'Buscar en TODAS las carpetas por asunto, cuerpo, remitente...' : `Buscar en ${nombreCarpetaActiva}...`"
          class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-9 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
        />
        <button
          v-if="busqueda"
          type="button"
          @click="busqueda = ''"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Botón Toggle de Búsqueda Global -->
      <button
        type="button"
        @click="busquedaGlobal = !busquedaGlobal"
        class="px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border shrink-0 cursor-pointer"
        :class="busquedaGlobal
          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-200 dark:hover:bg-zinc-700'"
        :title="busquedaGlobal ? 'Búsqueda global activa: busca en todas las carpetas del servidor' : 'Hacer clic para buscar en todas las carpetas'"
      >
        <Globe class="w-3.5 h-3.5" :class="busquedaGlobal ? 'text-white' : 'text-zinc-500'" />
        <span class="hidden md:inline">{{ busquedaGlobal ? 'Todas las carpetas' : 'Esta carpeta' }}</span>
      </button>

      <!-- Indicador de Búsqueda Remota en Servidor IMAP -->
      <div
        v-if="buscandoEnServidor"
        class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20 shrink-0 animate-pulse"
      >
        <Loader2 class="w-3.5 h-3.5 animate-spin text-sky-600 dark:text-sky-400" />
        <span class="hidden lg:inline">Buscando en servidor IMAP...</span>
      </div>
      <div
        v-else-if="coincidenciasServidorContador > 0 && busqueda"
        class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20 shrink-0"
      >
        <Globe class="w-3.5 h-3.5 text-sky-500" />
        <span>{{ coincidenciasServidorContador }} en servidor</span>
      </div>
    </div>

    <!-- Acciones de Cabecera (Sincronizar y Redactar) -->
    <div class="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0 justify-end">
      <!-- Indicador de Escucha en Segundo Plano -->
      <div
        class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
        title="Servicio de escucha continua activo en segundo plano (Monitorea el servidor IMAP cada 15s)"
      >
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Escucha automática activa</span>
      </div>

      <!-- Botón de Sincronización IMAP en Vivo -->
      <button
        type="button"
        @click="emit('sincronizar')"
        :disabled="sincronizando || cargando"
        title="Sincronizar correos desde el servidor IMAP configurado"
        class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 rounded-xl text-xs font-semibold transition disabled:opacity-50"
      >
        <RefreshCw :class="['w-3.5 h-3.5', sincronizando ? 'animate-spin text-indigo-600 dark:text-indigo-400' : '']" />
        <span>{{ sincronizando ? 'Sincronizando...' : 'Sincronizar' }}</span>
      </button>

      <!-- Botón de Reglas de Enrutamiento y Carpetas Automáticas -->
      <button
        v-if="puedeConfigurar"
        type="button"
        @click="emit('administrar-reglas')"
        title="Configurar reglas automáticas por dominio de cliente o asunto"
        class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs font-semibold transition"
      >
        <SlidersHorizontal class="w-3.5 h-3.5 text-indigo-500" />
        <span class="hidden sm:inline">Reglas de Correo</span>
        <span
          v-if="totalReglasActivas > 0"
          class="px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[9px] font-bold"
        >
          {{ totalReglasActivas }}
        </span>
      </button>

      <!-- Botón Redactar Nuevo Correo -->
      <button
        v-if="puedeEnviar"
        type="button"
        @click="emit('redactar')"
        class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition shadow-md shadow-indigo-950/20 active:scale-95"
      >
        <Send class="w-3.5 h-3.5" />
        <span>+ Redactar</span>
      </button>
    </div>
  </div>
</template>
