<script setup lang="ts">
import { ref } from 'vue';
import type { ActividadSeguimiento, EstadoActividad, TipoActividad, PrioridadActividad } from '../types/actividad.types';
import { formatDate, formatRelativeTime } from '@/core/formatters/formatters';
import { 
  Phone, 
  Users, 
  Video, 
  Mail, 
  FileText, 
  CheckSquare, 
  Clock, 
  Building2, 
  Check, 
  Edit2, 
  Trash2
} from 'lucide-vue-next';

const props = defineProps<{
  actividades: ActividadSeguimiento[];
}>();

const emit = defineEmits<{
  (e: 'editar', actividad: ActividadSeguimiento): void;
  (e: 'completar', actividad: ActividadSeguimiento): void;
  (e: 'eliminar', actividad: ActividadSeguimiento): void;
  (e: 'cambiar-estado', payload: { actividadId: string; nuevoEstado: EstadoActividad }): void;
  (e: 'crear'): void;
}>();

interface ColumnaKanbanAgenda {
  id: EstadoActividad;
  titulo: string;
  dotColor: string;
  badgeColor: string;
  borderColor: string;
}

const columnas: ColumnaKanbanAgenda[] = [
  {
    id: 'pendiente',
    titulo: 'Pendiente / Por Hacer',
    dotColor: 'bg-amber-400',
    badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    borderColor: 'border-l-amber-500',
  },
  {
    id: 'en_curso',
    titulo: 'En Curso / En Gestión',
    dotColor: 'bg-indigo-400',
    badgeColor: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
    borderColor: 'border-l-indigo-500',
  },
  {
    id: 'completada',
    titulo: 'Completada',
    dotColor: 'bg-emerald-400',
    badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    borderColor: 'border-l-emerald-500',
  },
  {
    id: 'cancelada',
    titulo: 'Cancelada',
    dotColor: 'bg-zinc-400',
    badgeColor: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
    borderColor: 'border-l-zinc-400',
  },
];

const actividadesPorEstado = (estado: EstadoActividad) => {
  return props.actividades.filter((a) => a.estado === estado);
};

const actividadesHoyPorEstado = (estado: EstadoActividad) => {
  return actividadesPorEstado(estado).filter((a) => esDeHoy(a));
};

// Drag & Drop
const actividadArrastrada = ref<ActividadSeguimiento | null>(null);
const columnaHover = ref<EstadoActividad | null>(null);

const onDragStart = (act: ActividadSeguimiento, event: DragEvent) => {
  actividadArrastrada.value = act;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', act.id);
  }
};

const onDragOver = (colId: EstadoActividad, event: DragEvent) => {
  event.preventDefault();
  columnaHover.value = colId;
};

const onDragLeave = (colId: EstadoActividad) => {
  if (columnaHover.value === colId) {
    columnaHover.value = null;
  }
};

const onDrop = (nuevoEstado: EstadoActividad, event: DragEvent) => {
  event.preventDefault();
  columnaHover.value = null;
  if (!actividadArrastrada.value) return;

  if (actividadArrastrada.value.estado !== nuevoEstado) {
    if (nuevoEstado === 'completada') {
      emit('completar', actividadArrastrada.value);
    } else {
      emit('cambiar-estado', {
        actividadId: actividadArrastrada.value.id,
        nuevoEstado,
      });
    }
  }
  actividadArrastrada.value = null;
};

// Mapeos visuales
const resolverIconoTipo = (tipo: TipoActividad) => {
  switch (tipo) {
    case 'llamada': return Phone;
    case 'reunion': return Users;
    case 'videollamada': return Video;
    case 'correo': return Mail;
    case 'propuesta': return FileText;
    case 'tarea':
    default: return CheckSquare;
  }
};

const resolverColorTipo = (tipo: TipoActividad) => {
  switch (tipo) {
    case 'llamada': return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
    case 'reunion': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    case 'videollamada': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    case 'correo': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    case 'propuesta': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'tarea':
    default: return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  }
};

const resolverClasePrioridad = (prioridad: PrioridadActividad) => {
  switch (prioridad) {
    case 'alta': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    case 'media': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'baja':
    default: return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20';
  }
};

const estaVencida = (act: ActividadSeguimiento) => {
  if (act.estado === 'completada' || act.estado === 'cancelada') return false;
  const hoyInicio = new Date().setHours(0, 0, 0, 0);
  return new Date(act.fechaLimite).getTime() < hoyInicio;
};

const esDeHoy = (act: ActividadSeguimiento) => {
  if (act.estado === 'completada' || act.estado === 'cancelada') return false;
  const hoyInicio = new Date().setHours(0, 0, 0, 0);
  const hoyFin = hoyInicio + 86400000;
  const t = new Date(act.fechaLimite).getTime();
  return t >= hoyInicio && t < hoyFin;
};
</script>

<template>
  <div class="w-full">
    <div class="flex gap-4 items-stretch overflow-x-auto pb-3.5 min-h-[550px] kanban-scroll xl:grid xl:grid-cols-4 xl:overflow-x-visible">
      <div
        v-for="col in columnas"
        :key="col.id"
        class="w-72 sm:w-80 shrink-0 xl:w-full xl:shrink bg-zinc-50/70 dark:bg-zinc-900/40 rounded-2xl border border-zinc-200 dark:border-white/[0.08] flex flex-col h-full min-h-[500px] transition-colors overflow-hidden"
        :class="[columnaHover === col.id ? 'ring-2 ring-indigo-500/40 bg-indigo-50/20 dark:bg-zinc-900/80' : '']"
        @dragover="onDragOver(col.id, $event)"
        @dragleave="onDragLeave(col.id)"
        @drop="onDrop(col.id, $event)"
      >
      <!-- Cabecera de Columna -->
      <div class="p-3.5 border-b border-zinc-200 dark:border-white/[0.07] bg-white dark:bg-zinc-900/80 flex items-center justify-between shadow-xs">
        <div class="flex items-center gap-2">
          <span :class="['w-2 h-2 rounded-full', col.dotColor]"></span>
          <span class="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            {{ col.titulo }}
          </span>
        </div>

        <div class="flex items-center gap-1.5">
          <span
            v-if="actividadesHoyPorEstado(col.id).length > 0"
            class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25 inline-flex items-center gap-1 shadow-xs"
            :title="actividadesHoyPorEstado(col.id).length + ' actividad(es) para hoy en este estado'"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>{{ actividadesHoyPorEstado(col.id).length }} hoy</span>
          </span>

          <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold font-mono" :class="col.badgeColor">
            {{ actividadesPorEstado(col.id).length }}
          </span>
        </div>
      </div>

      <!-- Lista de Tarjetas de la Columna -->
      <div class="p-2.5 space-y-2.5 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] kanban-scroll">
        <div
          v-for="act in actividadesPorEstado(col.id)"
          :key="act.id"
          draggable="true"
          @dragstart="onDragStart(act, $event)"
          @click="emit('editar', act)"
          class="bg-white dark:bg-zinc-900/90 p-3 rounded-xl border border-zinc-200/90 dark:border-white/[0.08] hover:border-indigo-500/40 shadow-xs hover:shadow-sm transition-all cursor-pointer text-left border-l-4 group select-none relative"
          :class="[
            col.borderColor,
            esDeHoy(act) ? 'ring-1 ring-amber-500/30 dark:ring-amber-500/30' : ''
          ]"
        >
          <!-- Fila Superior: Tipo & Prioridad -->
          <div class="flex items-center justify-between gap-1.5 mb-2">
            <span
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border capitalize"
              :class="resolverColorTipo(act.tipo)"
            >
              <component :is="resolverIconoTipo(act.tipo)" class="w-3 h-3" />
              <span>{{ act.tipo }}</span>
            </span>

            <div class="flex items-center gap-1">
              <!-- Badge "Para hoy" con punto pulsante -->
              <span
                v-if="esDeHoy(act)"
                class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 inline-flex items-center gap-1 shadow-xs"
                title="Esta actividad está programada para HOY"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Para hoy</span>
              </span>

              <span
                class="px-1.5 py-0.2 rounded text-[10px] font-medium border capitalize"
                :class="resolverClasePrioridad(act.prioridad)"
              >
                {{ act.prioridad }}
              </span>
            </div>
          </div>

          <!-- Título de la Tarea/Actividad -->
          <h4
            class="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2"
            :class="act.estado === 'completada' ? 'line-through text-zinc-400 dark:text-zinc-500' : ''"
          >
            {{ act.titulo }}
          </h4>

          <!-- Cliente Asociado -->
          <div class="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 mb-2 truncate">
            <Building2 class="w-3 h-3 text-zinc-400 shrink-0" />
            <span class="font-medium truncate">{{ act.clienteNombre }}</span>
          </div>

          <!-- Pie de Tarjeta: Fecha Límite & Acciones Rápidas -->
          <div class="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-white/[0.05] text-[10px]">
            <!-- Indicador de Fecha / Vencimiento -->
            <div class="flex items-center gap-1 truncate">
              <Clock class="w-3 h-3 text-zinc-400 shrink-0" />
              <span
                v-if="estaVencida(act)"
                class="text-rose-600 dark:text-rose-400 font-semibold"
                title="Actividad vencida"
              >
                Vencida ({{ formatRelativeTime(act.fechaLimite) }})
              </span>
              <span
                v-else-if="esDeHoy(act)"
                class="text-amber-700 dark:text-amber-400 font-bold inline-flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Hoy ({{ formatDate(act.fechaLimite) }})</span>
              </span>
              <span
                v-else
                class="text-zinc-500 dark:text-zinc-400"
              >
                {{ formatDate(act.fechaLimite) }}
              </span>
            </div>

            <!-- Acciones Rápidas -->
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                v-if="act.estado !== 'completada'"
                type="button"
                @click.stop="emit('completar', act)"
                title="Marcar como completada"
                class="p-1 rounded text-zinc-400 hover:text-emerald-600 hover:bg-emerald-500/10 transition"
              >
                <Check class="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                @click.stop="emit('editar', act)"
                title="Editar actividad"
                class="p-1 rounded text-zinc-400 hover:text-indigo-600 hover:bg-indigo-500/10 transition"
              >
                <Edit2 class="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                @click.stop="emit('eliminar', act)"
                title="Eliminar actividad"
                class="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-500/10 transition"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Estado Vacío en Columna -->
        <div
          v-if="actividadesPorEstado(col.id).length === 0"
          class="p-6 rounded-xl border border-dashed border-zinc-200 dark:border-white/[0.06] text-center text-xs text-zinc-400 flex flex-col items-center justify-center gap-1.5"
        >
          <span class="text-[11px]">Sin actividades</span>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>
