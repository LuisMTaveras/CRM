<script setup lang="ts">
import { computed, ref } from 'vue';
import { RefreshCw, Search } from 'lucide-vue-next';
import { resolverUrlServidor } from '@/core/api/api-config';
import { formatPhoneNumber, formatRelativeTime } from '@/core/formatters/formatters';
import type { ChatWhatsApp, DefinicionEtiqueta } from '../types/whatsapp-chat.types';

const props = defineProps<{
  chats: ChatWhatsApp[];
  chatActivo: ChatWhatsApp | null;
  cargando: boolean;
  totalNoLeidos: number;
  etiquetas: DefinicionEtiqueta[];
}>();

const emit = defineEmits<{
  seleccionar: [chat: ChatWhatsApp];
}>();

const busqueda = ref('');
const filtroNoLeidos = ref(false);
const etiquetaFiltroActiva = ref('todas');

const chatsFiltrados = computed(() => {
  let resultado = props.chats;
  if (filtroNoLeidos.value) {
    resultado = resultado.filter((c) => (c.noLeidos || 0) > 0);
  }
  if (etiquetaFiltroActiva.value !== 'todas') {
    resultado = resultado.filter((c) => c.etiquetas?.includes(etiquetaFiltroActiva.value));
  }
  if (busqueda.value.trim()) {
    const q = busqueda.value.toLowerCase().trim();
    resultado = resultado.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.telefono.includes(q) ||
        (c.contacto && c.contacto.toLowerCase().includes(q)) ||
        (c.ultimoMensaje && c.ultimoMensaje.toLowerCase().includes(q))
    );
  }
  return resultado;
});

const obtenerEtiquetaDefinicion = (tagId: string): DefinicionEtiqueta | undefined => {
  return props.etiquetas.find((t) => t.id === tagId);
};

const obtenerUrlMedia = (url?: string): string => resolverUrlServidor(url);
</script>

<template>
  <aside class="w-full md:w-80 lg:w-88 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col shrink-0">
    <!-- Buscador y Filtros -->
    <div class="p-3 border-b border-zinc-200 dark:border-zinc-800 space-y-2">
      <div class="relative">
        <Search class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          v-model="busqueda"
          type="text"
          placeholder="Buscar por cliente o teléfono..."
          class="w-full pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition"
        />
      </div>

      <div class="flex items-center gap-1.5 text-[11px]">
        <button
          type="button"
          @click="filtroNoLeidos = false"
          :class="[
            'px-2.5 py-1 rounded-md font-medium transition',
            !filtroNoLeidos
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          ]"
        >
          Todos ({{ chats.length }})
        </button>
        <button
          type="button"
          @click="filtroNoLeidos = true"
          :class="[
            'px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1',
            filtroNoLeidos
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          ]"
        >
          <span>No leídos</span>
          <span
            v-if="totalNoLeidos > 0"
            class="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white font-bold"
          >
            {{ totalNoLeidos }}
          </span>
        </button>
      </div>

      <!-- Chips de Filtro por Etiqueta Comercial -->
      <div class="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] scrollbar-none">
        <button
          type="button"
          @click="etiquetaFiltroActiva = 'todas'"
          :class="[
            'px-2 py-0.5 rounded-full shrink-0 font-medium transition',
            etiquetaFiltroActiva === 'todas'
              ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          ]"
        >
          Todas
        </button>
        <button
          v-for="tag in etiquetas"
          :key="tag.id"
          type="button"
          @click="etiquetaFiltroActiva = tag.id"
          :class="[
            'px-2 py-0.5 rounded-full shrink-0 font-medium transition border',
            etiquetaFiltroActiva === tag.id
              ? tag.bgClase + ' ' + tag.colorClase + ' font-bold'
              : 'border-transparent bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          ]"
        >
          {{ tag.nombre }}
        </button>
      </div>
    </div>

    <!-- Lista de Conversaciones -->
    <div class="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
      <div
        v-if="cargando && chats.length === 0"
        class="p-8 text-center text-xs text-zinc-400"
      >
        <RefreshCw class="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
        Cargando conversaciones...
      </div>

      <div
        v-else-if="chatsFiltrados.length === 0"
        class="p-8 text-center text-xs text-zinc-500"
      >
        No se encontraron conversaciones.
      </div>

      <button
        v-for="c in chatsFiltrados"
        :key="c.jid"
        type="button"
        @click="emit('seleccionar', c)"
        :class="[
          'w-full text-left p-3.5 flex items-start gap-3 transition relative border-l-2',
          chatActivo?.jid === c.jid
            ? 'bg-zinc-100 dark:bg-zinc-800/70 border-emerald-500'
            : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
        ]"
      >
        <!-- Avatar: Foto real de perfil de WhatsApp o iniciales como fallback -->
        <div class="w-10 h-10 rounded-xl overflow-hidden shrink-0 relative bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 shadow-2xs">
          <img
            v-if="c.fotoUrl"
            :src="obtenerUrlMedia(c.fotoUrl)"
            :alt="c.nombre"
            class="w-full h-full object-cover"
            loading="lazy"
            @error="(e) => ((e.target as HTMLElement).style.display = 'none')"
          />
          <div
            v-else
            class="w-full h-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-xs text-emerald-700 dark:text-emerald-300"
          >
            {{ c.avatar || 'WA' }}
          </div>
        </div>

        <!-- Detalles del chat -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-1 mb-0.5">
            <span class="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">
              {{ c.nombre }}
            </span>
            <span class="text-[10px] text-zinc-400 font-mono shrink-0">
              {{ formatRelativeTime(c.ultimoTimestamp) }}
            </span>
          </div>

          <div class="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mb-1">
            {{ c.ultimoMensaje }}
          </div>

          <!-- Etiquetas del chat en miniatura -->
          <div v-if="c.etiquetas && c.etiquetas.length > 0" class="flex flex-wrap gap-1 mb-1.5">
            <span
              v-for="tid in c.etiquetas"
              :key="tid"
              class="px-1.5 py-0.2 rounded-full text-[9px] font-medium border"
              :class="obtenerEtiquetaDefinicion(tid)?.bgClase + ' ' + obtenerEtiquetaDefinicion(tid)?.colorClase"
            >
              {{ obtenerEtiquetaDefinicion(tid)?.nombre || tid }}
            </span>
          </div>

          <div class="flex items-center justify-between text-[10px]">
            <span class="text-zinc-400 font-mono">
              {{ formatPhoneNumber(c.telefono) }}
            </span>
            <span
              v-if="(c.noLeidos || 0) > 0"
              class="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500 text-white font-bold shrink-0"
            >
              {{ c.noLeidos }}
            </span>
          </div>
        </div>
      </button>
    </div>
  </aside>
</template>
