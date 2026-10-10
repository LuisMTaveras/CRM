<script setup lang="ts">
import { ref, computed } from 'vue';
import { timelineService } from '../services/timeline.service';
import type { TipoEventoTimeline, EventoTimeline } from '../types/timeline.types';
import { formatDate, formatRelativeTime } from '@/core/formatters/formatters';
import {
  History,
  Phone,
  Users,
  Video,
  Mail,
  FileText,
  FileEdit,
  ArrowRightLeft,
  CheckCircle2,
  Trash2,
  Plus,
  Send,
  Search,
  Sparkles
} from 'lucide-vue-next';

const props = defineProps<{
  clienteId: string;
  clienteNombre: string;
}>();

// Formulario de nueva nota rápida
const formularioAbierto = ref(false);
const tipoSeleccionado = ref<TipoEventoTimeline>('llamada');
const tituloInteraccion = ref('');
const descripcionInteraccion = ref('');
const autorSeleccionado = ref('Camila Morales');
const errorFormulario = ref('');

// Filtros
const filtroTipo = ref<TipoEventoTimeline | 'todos'>('todos');
const busqueda = ref('');

// Listado reactivo de eventos
const eventos = computed(() => {
  return timelineService.obtenerTimelinePorCliente(props.clienteId, {
    tipo: filtroTipo.value,
    busqueda: busqueda.value,
  });
});

const resolverIcono = (tipo: TipoEventoTimeline) => {
  switch (tipo) {
    case 'llamada':
      return Phone;
    case 'reunion':
      return Users;
    case 'videollamada':
      return Video;
    case 'correo':
      return Mail;
    case 'propuesta':
      return FileText;
    case 'cambio_etapa':
      return ArrowRightLeft;
    case 'tarea':
      return CheckCircle2;
    case 'nota':
    default:
      return FileEdit;
  }
};

const resolverColorTipo = (tipo: TipoEventoTimeline) => {
  switch (tipo) {
    case 'llamada':
      return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
    case 'reunion':
      return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    case 'videollamada':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    case 'correo':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    case 'propuesta':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'cambio_etapa':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'tarea':
      return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
    case 'nota':
    default:
      return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20';
  }
};

const tiposInteraccion = [
  { valor: 'llamada', etiqueta: 'Llamada Telefónica', icono: Phone },
  { valor: 'reunion', etiqueta: 'Reunión Presencial', icono: Users },
  { valor: 'videollamada', etiqueta: 'Videollamada Online', icono: Video },
  { valor: 'nota', etiqueta: 'Nota Interna', icono: FileEdit },
  { valor: 'correo', etiqueta: 'Correo Enviado', icono: Mail },
];

const registrarInteraccion = () => {
  if (!descripcionInteraccion.value.trim()) {
    errorFormulario.value = 'Debe ingresar una descripción de la interacción.';
    return;
  }

  errorFormulario.value = '';

  const tituloPorDefecto =
    tituloInteraccion.value.trim() ||
    `Registro de ${tipoSeleccionado.value === 'llamada' ? 'llamada' : tipoSeleccionado.value === 'reunion' ? 'reunión' : tipoSeleccionado.value === 'videollamada' ? 'videollamada' : 'interacción comercial'}`;

  timelineService.registrarEvento({
    clienteId: props.clienteId,
    tipo: tipoSeleccionado.value,
    titulo: tituloPorDefecto,
    descripcion: descripcionInteraccion.value.trim(),
    autor: autorSeleccionado.value,
  });

  // Limpiar campos
  tituloInteraccion.value = '';
  descripcionInteraccion.value = '';
  formularioAbierto.value = false;
};

const eliminar = (ev: EventoTimeline) => {
  if (confirm(`¿Eliminar el registro "${ev.titulo}" del historial?`)) {
    timelineService.eliminarEvento(ev.id);
  }
};
</script>

<template>
  <div class="space-y-4 text-xs">
    <!-- Cabecera de la Bitácora con botón para nueva nota -->
    <div class="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-white/[0.06]">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <History class="w-3.5 h-3.5" />
        </div>
        <div>
          <h4 class="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
            Bitácora Cronológica & Historial
          </h4>
          <p class="text-[11px] text-zinc-400">
            Registro secuencial de reuniones, llamadas, propuestas y notas con {{ clienteNombre }}
          </p>
        </div>
      </div>

      <button
        type="button"
        @click="formularioAbierto = !formularioAbierto"
        class="px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 shadow-sm text-xs"
        :class="formularioAbierto ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300' : 'bg-indigo-600 hover:bg-indigo-500 text-white'"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>{{ formularioAbierto ? 'Cancelar' : 'Registrar Interacción' }}</span>
      </button>
    </div>

    <!-- Formulario para Registrar Nueva Interacción / Nota -->
    <div
      v-if="formularioAbierto"
      class="p-4 bg-zinc-50 dark:bg-zinc-950/60 rounded-2xl border border-zinc-200 dark:border-white/[0.08] space-y-3 animate-in fade-in duration-150"
    >
      <div class="flex items-center justify-between">
        <span class="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
          <Sparkles class="w-3.5 h-3.5 text-amber-500" />
          Nueva Entrada en la Bitácora
        </span>
        <span class="text-[10px] text-zinc-400">Actualiza automáticamente el último contacto</span>
      </div>

      <!-- Selector de Tipo de Interacción -->
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="t in tiposInteraccion"
          :key="t.valor"
          type="button"
          @click="tipoSeleccionado = t.valor as TipoEventoTimeline"
          class="px-2.5 py-1 rounded-xl border text-[11px] font-medium transition flex items-center gap-1"
          :class="tipoSeleccionado === t.valor ? resolverColorTipo(t.valor as TipoEventoTimeline) + ' ring-2 ring-indigo-500/20' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/[0.06] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
        >
          <component :is="t.icono" class="w-3 h-3" />
          <span>{{ t.etiqueta }}</span>
        </button>
      </div>

      <!-- Título Opcional -->
      <div>
        <input
          v-model="tituloInteraccion"
          type="text"
          placeholder="Título del asunto (ej: Llamada de revisión de requerimientos técnicos)..."
          class="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <!-- Descripción / Notas -->
      <div>
        <textarea
          v-model="descripcionInteraccion"
          rows="3"
          placeholder="Describe los puntos acordados, conclusiones de la llamada o próximos pasos acordados con el cliente..."
          class="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
        ></textarea>
        <span v-if="errorFormulario" class="text-rose-500 text-[11px] block mt-1">{{ errorFormulario }}</span>
      </div>

      <div class="flex items-center justify-between pt-1">
        <div class="flex items-center gap-2">
          <span class="text-[11px] text-zinc-500">Registrado por:</span>
          <select
            v-model="autorSeleccionado"
            class="px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-800 dark:text-zinc-200"
          >
            <option value="Camila Morales">Camila Morales</option>
            <option value="Jean Carlos Peña">Jean Carlos Peña</option>
            <option value="Lic. Luis Taveras">Lic. Luis Taveras</option>
          </select>
        </div>

        <button
          type="button"
          @click="registrarInteraccion"
          class="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5 shadow-sm transition"
        >
          <Send class="w-3.5 h-3.5" />
          <span>Guardar en Bitácora</span>
        </button>
      </div>
    </div>

    <!-- Barra de Filtros y Búsqueda -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-2.5">
      <div class="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1 bg-zinc-100 dark:bg-zinc-950/80 rounded-xl border border-zinc-200 dark:border-white/[0.04]">
        <button
          v-for="f in [
            { id: 'todos', label: 'Todos' },
            { id: 'llamada', label: 'Llamadas' },
            { id: 'reunion', label: 'Reuniones' },
            { id: 'correo', label: 'Correos' },
            { id: 'propuesta', label: 'Propuestas' },
            { id: 'nota', label: 'Notas' }
          ]"
          :key="f.id"
          @click="filtroTipo = f.id as TipoEventoTimeline | 'todos'"
          class="px-2.5 py-1 rounded-lg text-[11px] font-medium transition"
          :class="filtroTipo === f.id ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'"
        >
          {{ f.label }}
        </button>
      </div>

      <div class="relative w-full sm:w-56">
        <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          v-model="busqueda"
          type="text"
          placeholder="Buscar en el historial..."
          class="w-full pl-8 pr-2.5 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/[0.08] rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
        />
      </div>
    </div>

    <!-- Hilo Cronológico Vertical (Timeline Feed) -->
    <div class="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-200 dark:before:bg-white/[0.06]">
      <!-- Estado Vacío -->
      <div
        v-if="eventos.length === 0"
        class="py-8 text-center text-zinc-400 dark:text-zinc-500 space-y-1"
      >
        <p class="font-medium text-xs">No hay eventos registrados en este período</p>
        <p class="text-[11px]">Utiliza el botón superior para registrar la primera interacción.</p>
      </div>

      <!-- Tarjetas de Eventos del Timeline -->
      <div
        v-for="ev in eventos"
        :key="ev.id"
        class="relative group"
      >
        <!-- Punto indicador en la línea vertical -->
        <div
          class="absolute -left-6 top-2.5 w-5 h-5 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center shrink-0 shadow-sm"
          :class="resolverColorTipo(ev.tipo)"
        >
          <component :is="resolverIcono(ev.tipo)" class="w-2.5 h-2.5" />
        </div>

        <!-- Caja de contenido del evento -->
        <div
          class="bg-white dark:bg-zinc-900/70 p-3.5 rounded-2xl border border-zinc-200 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/[0.14] transition-all shadow-sm space-y-1.5"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                {{ ev.titulo }}
              </span>
              <span
                class="px-2 py-0.5 rounded text-[10px] font-medium border capitalize"
                :class="resolverColorTipo(ev.tipo)"
              >
                {{ ev.tipo.replace('_', ' ') }}
              </span>
            </div>

            <!-- Botón de eliminar -->
            <button
              @click="eliminar(ev)"
              title="Eliminar evento"
              class="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-500 rounded transition"
            >
              <Trash2 class="w-3 h-3" />
            </button>
          </div>

          <!-- Descripción del Evento -->
          <p class="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed whitespace-pre-line">
            {{ ev.descripcion }}
          </p>

          <!-- Pie: Autor y Fecha Relativa -->
          <div class="flex items-center justify-between pt-1.5 border-t border-zinc-100 dark:border-white/[0.04] text-[11px] text-zinc-400">
            <span class="font-medium text-zinc-500 dark:text-zinc-400">
              Registrado por: {{ ev.autor }}
            </span>
            <span class="font-mono" :title="formatDate(ev.fecha, 'datetime')">
              {{ formatRelativeTime(ev.fecha) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
