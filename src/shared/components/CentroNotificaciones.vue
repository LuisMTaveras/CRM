<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { centroNotificacionesService } from '@/core/notifications/centro-notificaciones.service';
import type { Notificacion } from '@/core/notifications/notificaciones.types';
import { formatRelativeTime } from '@/core/formatters/formatters';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  X, 
  Mail, 
  FileText, 
  Kanban, 
  Building2, 
  Server, 
  Sparkles,
  ExternalLink,
  RotateCcw,
  Clock
} from 'lucide-vue-next';

const router = useRouter();
const panelAbierto = ref(false);
const contenedorRef = ref<HTMLElement | null>(null);
const filtro = ref<'todas' | 'no-leidas' | 'urgentes'>('todas');

const notificaciones = computed(() => centroNotificacionesService.notificaciones.value);
const totalNoLeidas = computed(() => centroNotificacionesService.totalNoLeidas.value);

const notificacionesFiltradas = computed(() => {
  if (filtro.value === 'no-leidas') {
    return notificaciones.value.filter((n) => !n.leida);
  }
  if (filtro.value === 'urgentes') {
    return notificaciones.value.filter((n) => n.prioridad === 'alta');
  }
  return notificaciones.value;
});

const resolverIcono = (tipo: string) => {
  switch (tipo) {
    case 'correo':
      return Mail;
    case 'propuesta':
      return FileText;
    case 'pipeline':
      return Kanban;
    case 'cliente':
      return Building2;
    case 'tarea':
    case 'seguimiento':
      return Clock;
    case 'sistema':
      return Server;
    default:
      return Sparkles;
  }
};

const resolverColorIcono = (tipo: string, prioridad: string) => {
  if (prioridad === 'alta') {
    return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
  }
  switch (tipo) {
    case 'correo':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    case 'propuesta':
      return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    case 'pipeline':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'cliente':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    case 'tarea':
    case 'seguimiento':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    default:
      return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20';
  }
};

const clickNotificacion = (notif: Notificacion) => {
  centroNotificacionesService.marcarComoLeida(notif.id);
  if (notif.ruta) {
    panelAbierto.value = false;
    router.push(notif.ruta);
  }
};

const eliminarNotif = (e: Event, id: string) => {
  e.stopPropagation();
  centroNotificacionesService.eliminarNotificacion(id);
};

const marcarTodasLeidas = () => {
  centroNotificacionesService.marcarTodasComoLeidas();
};

const limpiarTodas = () => {
  centroNotificacionesService.limpiarTodas();
};

const restablecer = () => {
  centroNotificacionesService.restablecerSemillas();
};

// Cerrar al hacer clic fuera del panel
const manejarClickAfuera = (e: MouseEvent) => {
  if (contenedorRef.value && !contenedorRef.value.contains(e.target as Node)) {
    panelAbierto.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', manejarClickAfuera);
});

onUnmounted(() => {
  document.removeEventListener('click', manejarClickAfuera);
});
</script>

<template>
  <div ref="contenedorRef" class="relative">
    <!-- Botón Campana en la barra superior -->
    <button
      type="button"
      @click="panelAbierto = !panelAbierto"
      class="relative flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.08] transition shadow-sm"
      :title="totalNoLeidas > 0 ? `${totalNoLeidas} notificaciones pendientes` : 'Centro de Notificaciones'"
    >
      <Bell class="w-4 h-4" />

      <!-- Badge contador y animación ping -->
      <span
        v-if="totalNoLeidas > 0"
        class="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm font-mono"
      >
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60"></span>
        <span class="relative">{{ totalNoLeidas > 9 ? '9+' : totalNoLeidas }}</span>
      </span>
    </button>

    <!-- Popover / Panel de Notificaciones -->
    <div
      v-if="panelAbierto"
      class="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col text-xs transition-colors"
    >
      <!-- Cabecera del Centro de Notificaciones -->
      <div class="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-950/40">
        <div class="flex items-center gap-2">
          <span class="font-bold text-zinc-900 dark:text-zinc-100">Notificaciones</span>
          <span
            v-if="totalNoLeidas > 0"
            class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-semibold"
          >
            {{ totalNoLeidas }} pendientes
          </span>
        </div>

        <div class="flex items-center gap-1">
          <button
            v-if="totalNoLeidas > 0"
            type="button"
            @click="marcarTodasLeidas"
            class="px-2 py-1 text-[11px] text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition flex items-center gap-1 font-medium"
            title="Marcar todas como leídas"
          >
            <CheckCheck class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Leer todas</span>
          </button>
        </div>
      </div>

      <!-- Filtros de Pestaña -->
      <div class="px-4 pt-2 pb-1 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2 bg-white dark:bg-zinc-900">
        <button
          type="button"
          @click="filtro = 'todas'"
          :class="[
            'px-2.5 py-1 rounded-md text-[11px] font-medium transition',
            filtro === 'todas'
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
          ]"
        >
          Todas ({{ notificaciones.length }})
        </button>

        <button
          type="button"
          @click="filtro = 'no-leidas'"
          :class="[
            'px-2.5 py-1 rounded-md text-[11px] font-medium transition',
            filtro === 'no-leidas'
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
          ]"
        >
          No leídas ({{ totalNoLeidas }})
        </button>

        <button
          type="button"
          @click="filtro = 'urgentes'"
          :class="[
            'px-2.5 py-1 rounded-md text-[11px] font-medium transition',
            filtro === 'urgentes'
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
          ]"
        >
          Urgentes
        </button>
      </div>

      <!-- Lista de Notificaciones -->
      <div class="max-h-[380px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
        <!-- Estado Vacío -->
        <div v-if="notificacionesFiltradas.length === 0" class="py-10 text-center text-zinc-400 space-y-2">
          <Bell class="w-7 h-7 mx-auto stroke-1 text-zinc-300 dark:text-zinc-600" />
          <p class="font-medium text-xs text-zinc-600 dark:text-zinc-300">
            Sin notificaciones en esta sección
          </p>
          <p class="text-[11px] text-zinc-400">
            Todas las alertas comerciales y del sistema están al día
          </p>
        </div>

        <!-- Elementos -->
        <div
          v-for="notif in notificacionesFiltradas"
          :key="notif.id"
          @click="clickNotificacion(notif)"
          :class="[
            'p-3.5 flex items-start gap-3 transition-colors cursor-pointer group relative',
            !notif.leida
              ? 'bg-indigo-50/40 dark:bg-indigo-500/5 hover:bg-indigo-50/80 dark:hover:bg-indigo-500/10'
              : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
          ]"
        >
          <!-- Indicador Punto No Leído -->
          <span
            v-if="!notif.leida"
            class="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 absolute left-1.5 top-5 shrink-0 shadow-xs"
          ></span>

          <!-- Icono de Categoría -->
          <div
            :class="[
              'p-2 rounded-xl border shrink-0',
              resolverColorIcono(notif.tipo, notif.prioridad)
            ]"
          >
            <component :is="resolverIcono(notif.tipo)" class="w-4 h-4 stroke-[1.8]" />
          </div>

          <!-- Contenido de la Notificación -->
          <div class="flex-1 min-w-0 pr-4">
            <div class="flex items-baseline justify-between gap-2">
              <h4
                :class="[
                  'text-xs truncate leading-snug',
                  !notif.leida
                    ? 'font-bold text-zinc-900 dark:text-zinc-100'
                    : 'font-semibold text-zinc-700 dark:text-zinc-300'
                ]"
              >
                {{ notif.titulo }}
              </h4>
            </div>

            <p class="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
              {{ notif.mensaje }}
            </p>

            <div class="flex items-center gap-3 mt-1.5">
              <span class="text-[10px] text-zinc-400 font-mono">
                {{ formatRelativeTime(notif.fecha) }}
              </span>

              <span
                v-if="notif.etiquetaAccion"
                class="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 hover:underline"
              >
                <span>{{ notif.etiquetaAccion }}</span>
                <ExternalLink class="w-2.5 h-2.5" />
              </span>
            </div>
          </div>

          <!-- Botón Eliminar Notificación -->
          <button
            type="button"
            @click="(e) => eliminarNotif(e, notif.id)"
            class="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-500 rounded transition absolute right-2 top-3"
            title="Eliminar notificación"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Pie del Panel -->
      <div class="px-4 py-2.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
        <button
          v-if="notificaciones.length > 0"
          type="button"
          @click="limpiarTodas"
          class="hover:text-rose-500 transition flex items-center gap-1 font-medium"
        >
          <Trash2 class="w-3 h-3" />
          <span>Limpiar historial</span>
        </button>
        <span v-else class="text-[10px] font-mono text-zinc-400">Sin notificaciones activas</span>

        <button
          type="button"
          @click="restablecer"
          class="hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-1 font-medium"
          title="Restablecer notificaciones de prueba"
        >
          <RotateCcw class="w-3 h-3" />
          <span>Restablecer</span>
        </button>
      </div>

    </div>
  </div>
</template>
