<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ActividadSeguimiento, TipoActividad, PrioridadActividad } from '../types/actividad.types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  Phone, 
  Users, 
  Video, 
  Mail, 
  FileText, 
  CheckSquare 
} from 'lucide-vue-next';

const props = defineProps<{
  actividades: ActividadSeguimiento[];
}>();

const emit = defineEmits<{
  (e: 'editar', actividad: ActividadSeguimiento): void;
  (e: 'completar', actividad: ActividadSeguimiento): void;
  (e: 'crear', fecha: string): void;
  (e: 'mover-fecha', payload: { actividadId: string; nuevaFecha: string }): void;
}>();

// Fecha de referencia mensual (hoy por defecto)
const fechaReferencia = ref(new Date());

const mesesNombres = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// Navegación
const irMesAnterior = () => {
  const d = new Date(fechaReferencia.value);
  d.setMonth(d.getMonth() - 1);
  fechaReferencia.value = d;
};

const irMesSiguiente = () => {
  const d = new Date(fechaReferencia.value);
  d.setMonth(d.getMonth() + 1);
  fechaReferencia.value = d;
};

const irHoy = () => {
  fechaReferencia.value = new Date();
};

const añoActual = computed(() => fechaReferencia.value.getFullYear());
const mesActual = computed(() => fechaReferencia.value.getMonth());
const tituloMesActual = computed(() => `${mesesNombres[mesActual.value]} ${añoActual.value}`);

// Formato local YYYY-MM-DD
const formatearFechaStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const hoyStr = formatearFechaStr(new Date());

// Actividades indexadas por fecha YYYY-MM-DD
const actividadesPorFecha = computed(() => {
  const map = new Map<string, ActividadSeguimiento[]>();
  for (const act of props.actividades) {
    if (!act.fechaLimite) continue;
    const fStr = act.fechaLimite.slice(0, 10);
    if (!map.has(fStr)) {
      map.set(fStr, []);
    }
    map.get(fStr)!.push(act);
  }
  return map;
});

// Métricas del mes en curso
const actividadesDelMes = computed(() => {
  const prefix = `${añoActual.value}-${String(mesActual.value + 1).padStart(2, '0')}`;
  return props.actividades.filter((a) => a.fechaLimite && a.fechaLimite.startsWith(prefix));
});

const completadasDelMes = computed(() => {
  return actividadesDelMes.value.filter((a) => a.estado === 'completada').length;
});

const pendientesDelMes = computed(() => {
  return actividadesDelMes.value.filter((a) => a.estado === 'pendiente' || a.estado === 'en_curso').length;
});

const totalActividadesHoy = computed(() => {
  return props.actividades.filter((a) => {
    if (a.estado === 'completada' || a.estado === 'cancelada') return false;
    return a.fechaLimite && a.fechaLimite.slice(0, 10) === hoyStr;
  }).length;
});

// Estructura de celda del día
interface DiaCalendarioAgenda {
  fechaStr: string;
  numeroDia: number;
  esMesActual: boolean;
  esHoy: boolean;
  actividades: ActividadSeguimiento[];
}

const diasGrilla = computed<DiaCalendarioAgenda[]>(() => {
  const año = añoActual.value;
  const mes = mesActual.value;

  const primerDiaMes = new Date(año, mes, 1);
  const diaSemanaInicio = (primerDiaMes.getDay() + 6) % 7; // Lun=0, Dom=6
  const totalDiasMes = new Date(año, mes + 1, 0).getDate();
  const totalDiasMesAnterior = new Date(año, mes, 0).getDate();

  const celdas: DiaCalendarioAgenda[] = [];

  // Padding mes anterior
  for (let i = diaSemanaInicio - 1; i >= 0; i--) {
    const numDia = totalDiasMesAnterior - i;
    const fecha = new Date(año, mes - 1, numDia);
    const fStr = formatearFechaStr(fecha);
    celdas.push({
      fechaStr: fStr,
      numeroDia: numDia,
      esMesActual: false,
      esHoy: fStr === hoyStr,
      actividades: actividadesPorFecha.value.get(fStr) || [],
    });
  }

  // Días mes actual
  for (let dia = 1; dia <= totalDiasMes; dia++) {
    const fecha = new Date(año, mes, dia);
    const fStr = formatearFechaStr(fecha);
    celdas.push({
      fechaStr: fStr,
      numeroDia: dia,
      esMesActual: true,
      esHoy: fStr === hoyStr,
      actividades: actividadesPorFecha.value.get(fStr) || [],
    });
  }

  // Días mes siguiente
  const celdasRestantes = (7 - (celdas.length % 7)) % 7;
  for (let dia = 1; dia <= celdasRestantes; dia++) {
    const fecha = new Date(año, mes + 1, dia);
    const fStr = formatearFechaStr(fecha);
    celdas.push({
      fechaStr: fStr,
      numeroDia: dia,
      esMesActual: false,
      esHoy: fStr === hoyStr,
      actividades: actividadesPorFecha.value.get(fStr) || [],
    });
  }

  return celdas;
});

// Drag & Drop
const actividadArrastrada = ref<ActividadSeguimiento | null>(null);
const diaDestinoHover = ref<string | null>(null);

const onDragStart = (act: ActividadSeguimiento, event: DragEvent) => {
  actividadArrastrada.value = act;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', act.id);
  }
};

const onDragOverDia = (fechaStr: string, event: DragEvent) => {
  event.preventDefault();
  diaDestinoHover.value = fechaStr;
};

const onDragLeaveDia = (fechaStr: string) => {
  if (diaDestinoHover.value === fechaStr) {
    diaDestinoHover.value = null;
  }
};

const onDropDia = (fechaStr: string, event: DragEvent) => {
  event.preventDefault();
  diaDestinoHover.value = null;
  if (!actividadArrastrada.value) return;

  if (actividadArrastrada.value.fechaLimite?.slice(0, 10) !== fechaStr) {
    // Preservar la hora original si existe, sustituyendo solo la fecha
    const horaOriginal = actividadArrastrada.value.fechaLimite.includes('T')
      ? actividadArrastrada.value.fechaLimite.slice(11, 16)
      : '10:00';
    const nuevaFechaIso = new Date(`${fechaStr}T${horaOriginal}:00`).toISOString();

    emit('mover-fecha', {
      actividadId: actividadArrastrada.value.id,
      nuevaFecha: nuevaFechaIso,
    });
  }
  actividadArrastrada.value = null;
};

// Formatear hora de la actividad (e.g. 15:30)
const extraerHora = (fechaIso: string) => {
  if (!fechaIso) return '';
  const d = new Date(fechaIso);
  const horas = String(d.getHours()).padStart(2, '0');
  const minutos = String(d.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos}`;
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

const resolverColorBordeTipo = (tipo: TipoActividad) => {
  switch (tipo) {
    case 'llamada': return 'border-l-sky-500';
    case 'reunion': return 'border-l-indigo-500';
    case 'videollamada': return 'border-l-purple-500';
    case 'correo': return 'border-l-blue-500';
    case 'propuesta': return 'border-l-emerald-500';
    case 'tarea':
    default: return 'border-l-amber-500';
  }
};

const resolverClasePrioridadDot = (prioridad: PrioridadActividad) => {
  switch (prioridad) {
    case 'alta': return 'bg-rose-500';
    case 'media': return 'bg-amber-500';
    case 'baja':
    default: return 'bg-zinc-400';
  }
};

// Expansión de día
const diaExpandido = ref<string | null>(null);
const alternarExpansionDia = (fechaStr: string) => {
  diaExpandido.value = diaExpandido.value === fechaStr ? null : fechaStr;
};
</script>

<template>
  <div class="w-full space-y-4">
    <!-- Barra Superior de Navegación del Calendario -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-sm">
      <!-- Navegación de Mes y Año -->
      <div class="flex items-center gap-2">
        <div class="inline-flex items-center rounded-xl border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-zinc-950 p-0.5 shadow-xs">
          <button
            type="button"
            @click="irMesAnterior"
            class="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition"
            title="Mes anterior"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          
          <button
            type="button"
            @click="irHoy"
            class="px-2.5 py-1 text-xs font-semibold rounded-lg text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 transition inline-flex items-center gap-1.5"
          >
            <span v-if="totalActividadesHoy > 0" class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Hoy</span>
          </button>

          <button
            type="button"
            @click="irMesSiguiente"
            class="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition"
            title="Mes siguiente"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>

        <h2 class="text-base font-bold text-zinc-900 dark:text-zinc-100 capitalize tracking-tight ml-1">
          {{ tituloMesActual }}
        </h2>
      </div>

      <!-- Métricas del Mes -->
      <div class="flex flex-wrap items-center gap-2.5 text-xs">
        <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-white/[0.06] text-zinc-700 dark:text-zinc-300">
          <CalendarIcon class="w-3.5 h-3.5 text-indigo-500" />
          <span class="font-bold text-zinc-900 dark:text-zinc-100 font-mono">{{ actividadesDelMes.length }}</span>
          <span>programadas en el mes</span>
        </div>

        <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
          <Clock class="w-3.5 h-3.5" />
          <span class="font-bold font-mono">{{ pendientesDelMes }}</span>
          <span>pendientes</span>
        </div>

        <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 class="w-3.5 h-3.5" />
          <span class="font-bold font-mono">{{ completadasDelMes }}</span>
          <span>completadas</span>
        </div>
      </div>
    </div>

    <!-- Rejilla del Calendario Mensual -->
    <div class="rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
      <!-- Días de la Semana -->
      <div class="grid grid-cols-7 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-zinc-900/90 text-center">
        <div
          v-for="dia in diasSemana"
          :key="dia"
          class="py-2.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 select-none"
        >
          <span class="hidden sm:inline">{{ dia }}</span>
          <span class="sm:hidden">{{ dia.slice(0, 3) }}</span>
        </div>
      </div>

      <!-- Celdas de los Días -->
      <div class="grid grid-cols-7 divide-x divide-y divide-zinc-200 dark:divide-white/[0.06] auto-rows-fr">
        <div
          v-for="dia in diasGrilla"
          :key="dia.fechaStr"
          class="min-h-[125px] sm:min-h-[145px] p-1.5 sm:p-2 flex flex-col transition-colors relative group"
          :class="[
            dia.esMesActual ? 'bg-white dark:bg-zinc-900/40' : 'bg-zinc-50/70 dark:bg-zinc-950/60 opacity-60',
            dia.esHoy ? 'ring-2 ring-indigo-500/50 bg-indigo-50/20 dark:bg-indigo-950/20' : '',
            diaDestinoHover === dia.fechaStr ? 'ring-2 ring-indigo-500 bg-indigo-500/10' : ''
          ]"
          @dragover="onDragOverDia(dia.fechaStr, $event)"
          @dragleave="onDragLeaveDia(dia.fechaStr)"
          @drop="onDropDia(dia.fechaStr, $event)"
        >
          <!-- Cabecera del Día -->
          <div class="flex items-center justify-between mb-1.5 select-none">
            <div class="flex items-center gap-1">
              <span
                class="w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold tabular-nums"
                :class="[
                  dia.esHoy
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : dia.esMesActual
                    ? 'text-zinc-800 dark:text-zinc-200'
                    : 'text-zinc-400 dark:text-zinc-600'
                ]"
              >
                {{ dia.numeroDia }}
              </span>

              <span
                v-if="dia.esHoy"
                class="hidden md:inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-600/20 shadow-xs"
              >
                <span v-if="dia.actividades.length > 0" class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Hoy</span>
              </span>
            </div>

            <div class="flex items-center gap-1">
              <!-- Contador de actividades del día -->
              <span
                v-if="dia.actividades.length > 0"
                class="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              >
                {{ dia.actividades.length }}
              </span>

              <!-- Botón rápido para programar en este día -->
              <button
                type="button"
                @click="emit('crear', dia.fechaStr)"
                title="Programar actividad en este día"
                class="opacity-0 group-hover:opacity-100 p-1 rounded-md text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <Plus class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Lista de Actividades del Día -->
          <div class="space-y-1.5 flex-1 overflow-y-auto max-h-[140px] pr-0.5 kanban-scroll">
            <template v-if="dia.actividades.length > 0">
              <div
                v-for="act in (diaExpandido === dia.fechaStr ? dia.actividades : dia.actividades.slice(0, 3))"
                :key="act.id"
                draggable="true"
                @dragstart="onDragStart(act, $event)"
                @click="emit('editar', act)"
                class="p-1.5 rounded-lg border border-zinc-200/90 dark:border-white/[0.08] bg-white dark:bg-zinc-900 hover:border-indigo-500/50 dark:hover:border-indigo-400/50 shadow-xs hover:shadow-sm transition-all cursor-pointer text-left border-l-[3px] select-none"
                :class="[resolverColorBordeTipo(act.tipo)]"
              >
                <!-- Tipo & Hora -->
                <div class="flex items-center justify-between gap-1 mb-0.5 text-[10px]">
                  <span class="inline-flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                    <component :is="resolverIconoTipo(act.tipo)" class="w-3 h-3 text-indigo-500 shrink-0" />
                    <span>{{ extraerHora(act.fechaLimite) }}</span>
                  </span>

                  <span
                    class="w-1.5 h-1.5 rounded-full shrink-0"
                    :class="resolverClasePrioridadDot(act.prioridad)"
                    :title="'Prioridad ' + act.prioridad"
                  ></span>
                </div>

                <!-- Título -->
                <p
                  class="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate leading-tight"
                  :class="act.estado === 'completada' ? 'line-through text-zinc-400 dark:text-zinc-500' : ''"
                  :title="act.titulo"
                >
                  {{ act.titulo }}
                </p>

                <!-- Cliente -->
                <p class="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                  {{ act.clienteNombre }}
                </p>
              </div>

              <!-- Expansor si hay más -->
              <button
                v-if="dia.actividades.length > 3"
                type="button"
                @click.stop="alternarExpansionDia(dia.fechaStr)"
                class="w-full text-center py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline transition"
              >
                {{ diaExpandido === dia.fechaStr ? 'Ver menos ▲' : `+${dia.actividades.length - 3} más ▼` }}
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
