<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { actividadesService } from '../services/actividades.service';
import ModalActividadSeguimiento from '../components/ModalActividadSeguimiento.vue';
import AgendaKanbanView from '../components/AgendaKanbanView.vue';
import AgendaCalendarioView from '../components/AgendaCalendarioView.vue';
import { formatDate, formatRelativeTime } from '@/core/formatters/formatters';
import { toastService } from '@/core/notifications/toast.service';
import { dialogService } from '@/core/dialog/dialog.service';
import type { 
  ActividadSeguimiento, 
  RangoFiltroFecha, 
  TipoActividad, 
  PrioridadActividad,
  EstadoActividad
} from '../types/actividad.types';
import {
  CalendarClock,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Building2,
  Phone,
  Users,
  Video,
  Mail,
  FileText,
  CheckSquare,
  Trash2,
  Edit2,
  BellRing,
  Check,
  List,
  Kanban,
  X
} from 'lucide-vue-next';
import AppSelect, { type SelectOption } from '@/shared/components/AppSelect.vue';
import { useAuthStore } from '@/modules/auth/stores/auth.store';

const authStore = useAuthStore();

const opcionesTipo: SelectOption<TipoActividad | ''>[] = [
  { value: '', label: 'Todos los tipos' },
  { value: 'llamada', label: '📞 Llamadas' },
  { value: 'reunion', label: '🤝 Reuniones' },
  { value: 'videollamada', label: '💻 Videollamadas' },
  { value: 'correo', label: '✉️ Correos' },
  { value: 'propuesta', label: '📄 Propuestas' },
  { value: 'tarea', label: '✅ Tareas' },
];

const opcionesPrioridad: SelectOption<PrioridadActividad | ''>[] = [
  { value: '', label: 'Todas las prioridades' },
  { value: 'alta', label: '🔴 Alta' },
  { value: 'media', label: '🟡 Media' },
  { value: 'baja', label: '🟢 Baja' },
];

const route = useRoute();

// Estado reactivo
const vistaActiva = ref<'lista' | 'tablero' | 'calendario'>('lista');
const fechaSeleccionadaParaNueva = ref<string>('');
const rangoSeleccionado = ref<RangoFiltroFecha>('todas');
const tipoSeleccionado = ref<TipoActividad | ''>('');
const prioridadSeleccionada = ref<PrioridadActividad | ''>('');
const busquedaTexto = ref('');

// Modales
const modalNuevoAbierto = ref(false);
const actividadEnEdicionId = ref<string | undefined>(undefined);
const modalCompletarAbierto = ref(false);
const actividadACompletar = ref<ActividadSeguimiento | null>(null);
const notasResultado = ref('');

// Cargar métricas reactivas
const metricas = computed(() => actividadesService.obtenerMetricas());

// Lista de actividades filtradas
const actividades = computed(() => {
  return actividadesService.obtenerActividades({
    rango: rangoSeleccionado.value,
    tipo: tipoSeleccionado.value,
    prioridad: prioridadSeleccionada.value,
    busqueda: busquedaTexto.value,
  });
});

// Comprobar si la ruta trae accion=nueva
onMounted(() => {
  if (route.query.accion === 'nueva' && authStore.tienePermiso('clientes:crear')) {
    modalNuevoAbierto.value = true;
  }
  // Sincronizar alertas con el centro de notificaciones
  actividadesService.sincronizarConCentroNotificaciones();
  void actividadesService.recargar();
});

// Mapeo de iconos y etiquetas por tipo
const resolverIconoTipo = (tipo: TipoActividad) => {
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
    case 'tarea':
    default:
      return CheckSquare;
  }
};

const resolverColorTipo = (tipo: TipoActividad) => {
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
    case 'tarea':
    default:
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  }
};

const resolverClasePrioridad = (prioridad: PrioridadActividad) => {
  switch (prioridad) {
    case 'alta':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    case 'media':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'baja':
    default:
      return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20';
  }
};

// Acciones de gestión
const abrirModalNueva = () => {
  if (!authStore.tienePermiso('clientes:crear')) return;
  actividadEnEdicionId.value = undefined;
  fechaSeleccionadaParaNueva.value = '';
  modalNuevoAbierto.value = true;
};

const abrirModalNuevaConFecha = (fecha: string) => {
  if (!authStore.tienePermiso('clientes:crear')) return;
  actividadEnEdicionId.value = undefined;
  fechaSeleccionadaParaNueva.value = fecha;
  modalNuevoAbierto.value = true;
};

const onCambiarEstado = (payload: { actividadId: string; nuevoEstado: EstadoActividad }) => {
  if (!authStore.tienePermiso('clientes:editar')) return;
  actividadesService.actualizarActividad(payload.actividadId, { estado: payload.nuevoEstado });
};

const onMoverFecha = (payload: { actividadId: string; nuevaFecha: string }) => {
  if (!authStore.tienePermiso('clientes:editar')) return;
  actividadesService.actualizarActividad(payload.actividadId, { fechaLimite: payload.nuevaFecha });
};

const editarActividad = (act: ActividadSeguimiento) => {
  if (!authStore.tienePermiso('clientes:editar')) return;
  actividadEnEdicionId.value = act.id;
  modalNuevoAbierto.value = true;
};

const confirmarCompletar = (act: ActividadSeguimiento) => {
  if (!authStore.tienePermiso('clientes:editar')) return;
  actividadACompletar.value = act;
  notasResultado.value = '';
  modalCompletarAbierto.value = true;
};

const guardarCompletada = () => {
  if (!authStore.tienePermiso('clientes:editar')) return;
  if (actividadACompletar.value) {
    actividadesService.marcarCompletada(actividadACompletar.value.id, notasResultado.value);
    toastService.exito('Actividad marcada como completada.');
  }
  modalCompletarAbierto.value = false;
  actividadACompletar.value = null;
};

const eliminarActividad = async (act: ActividadSeguimiento) => {
  if (!authStore.tienePermiso('clientes:eliminar')) return;
  const confirmado = await dialogService.confirmar({
    titulo: '¿Eliminar actividad?',
    mensaje: `¿Confirma que desea eliminar la actividad "${act.titulo}"?`,
    textoConfirmar: 'Sí, eliminar',
    tipo: 'peligro',
  });
  if (confirmado) {
    actividadesService.eliminarActividad(act.id);
    toastService.exito('Actividad eliminada.');
  }
};

const sincronizarAlertasManual = () => {
  const res = actividadesService.sincronizarConCentroNotificaciones();
  toastService.info(`Sincronización completada. Alertas enviadas: ${res.vencidas} vencidas, ${res.hoy} para hoy.`);
};

// Verifica si una actividad está vencida
const estaVencida = (act: ActividadSeguimiento) => {
  if (act.estado === 'completada' || act.estado === 'cancelada') return false;
  const hoyInicio = new Date().setHours(0, 0, 0, 0);
  return new Date(act.fechaLimite).getTime() < hoyInicio;
};

// Verifica si una actividad es para hoy
const esDeHoy = (act: ActividadSeguimiento) => {
  if (act.estado === 'completada' || act.estado === 'cancelada') return false;
  const hoyInicio = new Date().setHours(0, 0, 0, 0);
  const hoyFin = hoyInicio + 86400000;
  const t = new Date(act.fechaLimite).getTime();
  return t >= hoyInicio && t < hoyFin;
};
</script>

<template>
  <!-- Teleport del Encabezado hacia la Barra Superior (HeaderBar) -->
  <Teleport to="#header-portal-left">
    <div class="flex items-center gap-3 min-w-0">
      <span class="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
        <CalendarClock class="w-5 h-5" />
      </span>
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h1 class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
            Agenda Comercial & Next Steps
          </h1>
          <span
            v-if="metricas.pendientesHoy > 0"
            class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shrink-0 shadow-xs"
            title="Tareas y compromisos comerciales programados para hoy"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            {{ metricas.pendientesHoy }} para hoy
          </span>
        </div>
        <p class="text-[11px] text-zinc-500 dark:text-zinc-400 truncate hidden md:block">
          Gestión de llamadas, reuniones presenciales, visitas técnicas y tareas con clientes
        </p>
      </div>
    </div>
  </Teleport>

  <div class="w-full space-y-4">

    <!-- KPIs de la Agenda -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <!-- Tareas para Hoy -->
      <div
        @click="rangoSeleccionado = 'hoy'"
        class="bg-white dark:bg-zinc-900/70 p-4 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md"
        :class="rangoSeleccionado === 'hoy' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-zinc-200 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/[0.15]'"
      >
        <div class="flex items-center justify-between text-xs text-zinc-500 mb-2">
          <div class="flex items-center gap-1.5">
            <span v-if="metricas.pendientesHoy > 0" class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span class="font-medium text-zinc-700 dark:text-zinc-300">Para Hoy</span>
          </div>
          <Clock class="w-4 h-4 text-amber-500" />
        </div>
        <div class="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
          {{ metricas.pendientesHoy }}
        </div>
        <p class="text-[11px] text-zinc-400 mt-1">Compromisos de la jornada</p>
      </div>

      <!-- Vencidas / En Riesgo -->
      <div
        @click="rangoSeleccionado = 'vencidas'"
        class="bg-white dark:bg-zinc-900/70 p-4 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md"
        :class="rangoSeleccionado === 'vencidas' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-zinc-200 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/[0.15]'"
      >
        <div class="flex items-center justify-between text-xs text-zinc-500 mb-2">
          <span>Vencidas / En Riesgo</span>
          <AlertTriangle class="w-4 h-4 text-rose-500" />
        </div>
        <div class="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
          {{ metricas.vencidas }}
        </div>
        <p class="text-[11px] text-zinc-400 mt-1">Superaron la fecha límite</p>
      </div>

      <!-- Esta Semana -->
      <div
        @click="rangoSeleccionado = 'esta_semana'"
        class="bg-white dark:bg-zinc-900/70 p-4 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md"
        :class="rangoSeleccionado === 'esta_semana' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-zinc-200 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/[0.15]'"
      >
        <div class="flex items-center justify-between text-xs text-zinc-500 mb-2">
          <span>Esta Semana</span>
          <Calendar class="w-4 h-4 text-amber-500" />
        </div>
        <div class="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
          {{ metricas.estaSemana }}
        </div>
        <p class="text-[11px] text-zinc-400 mt-1">Plan en los próximos 7 días</p>
      </div>

      <!-- Completadas -->
      <div
        @click="rangoSeleccionado = 'completadas'"
        class="bg-white dark:bg-zinc-900/70 p-4 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md"
        :class="rangoSeleccionado === 'completadas' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-zinc-200 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/[0.15]'"
      >
        <div class="flex items-center justify-between text-xs text-zinc-500 mb-2">
          <span>Completadas</span>
          <CheckCircle2 class="w-4 h-4 text-emerald-500" />
        </div>
        <div class="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-baseline gap-2">
          <span>{{ metricas.completadas }}</span>
          <span class="text-xs font-normal text-zinc-400 font-sans">({{ metricas.porcentajeCumplimiento }}%)</span>
        </div>
        <p class="text-[11px] text-zinc-400 mt-1">Actividades ejecutadas</p>
      </div>
    </div>

    <!-- Barra de Herramientas, Búsqueda, Filtros y Vistas -->
    <div class="bg-white dark:bg-zinc-900/70 p-3 rounded-2xl border border-zinc-200 dark:border-white/[0.06] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 text-xs shadow-sm">
      <!-- LADO IZQUIERDO: Búsqueda PRIMERO + Filtros de Selección + Pestañas de Fecha -->
      <div class="flex flex-wrap items-center gap-2 flex-1 min-w-0">
        <!-- 1. BUSCADOR PRIMERO -->
        <div class="relative w-full sm:w-64 md:w-72 shrink-0">
          <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            v-model="busquedaTexto"
            type="text"
            placeholder="Buscar por cliente, título o notas..."
            class="w-full pl-8 pr-7 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/[0.08] rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            v-if="busquedaTexto"
            @click="busquedaTexto = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            title="Limpiar búsqueda"
          >
            <X class="w-3 h-3" />
          </button>
        </div>

        <!-- 2. Filtro por Tipo -->
        <AppSelect
          v-model="tipoSeleccionado"
          :options="opcionesTipo"
          label-prefix="Tipo:"
          size="sm"
          min-width-class="min-w-[150px]"
        />

        <!-- 3. Filtro por Prioridad -->
        <AppSelect
          v-model="prioridadSeleccionada"
          :options="opcionesPrioridad"
          label-prefix="Prioridad:"
          size="sm"
          min-width-class="min-w-[160px]"
        />

        <!-- 4. Pestañas de Rango de Fecha -->
        <div class="flex items-center gap-1 overflow-x-auto p-0.5 bg-zinc-100 dark:bg-zinc-950/80 rounded-xl border border-zinc-200 dark:border-white/[0.04]">
          <button
            v-for="r in [
              { id: 'todas', label: 'Todas' },
              { id: 'hoy', label: 'Hoy' },
              { id: 'vencidas', label: 'Vencidas' },
              { id: 'esta_semana', label: 'Esta Semana' },
              { id: 'completadas', label: 'Completadas' }
            ]"
            :key="r.id"
            @click="rangoSeleccionado = r.id as RangoFiltroFecha"
            class="px-2.5 py-1 rounded-lg font-medium transition inline-flex items-center gap-1 text-xs"
            :class="rangoSeleccionado === r.id ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'"
          >
            <span v-if="r.id === 'hoy' && metricas.pendientesHoy > 0" class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>{{ r.label }}</span>
            <span
              v-if="r.id === 'hoy' && metricas.pendientesHoy > 0"
              class="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono"
            >
              {{ metricas.pendientesHoy }}
            </span>
          </button>
        </div>
      </div>

      <!-- LADO DERECHO: Conmutador de Vistas + Badge Contador + Acciones Principales -->
      <div class="flex flex-wrap items-center gap-2 shrink-0 pt-2 xl:pt-0 border-t xl:border-t-0 border-zinc-200 dark:border-white/[0.05]">
        <!-- Conmutador de Vistas: Lista | Tablero | Calendario -->
        <div class="inline-flex items-center p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-950/80 border border-zinc-200 dark:border-white/[0.08] shadow-xs">
          <button
            type="button"
            @click="vistaActiva = 'lista'"
            :class="[
              vistaActiva === 'lista'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium'
            ]"
            class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition"
            title="Vista Lista"
          >
            <List class="w-3.5 h-3.5" />
            <span>Lista</span>
          </button>

          <button
            type="button"
            @click="vistaActiva = 'tablero'"
            :class="[
              vistaActiva === 'tablero'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium'
            ]"
            class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition"
            title="Vista Tablero Kanban"
          >
            <Kanban class="w-3.5 h-3.5" />
            <span>Tablero</span>
          </button>

          <button
            type="button"
            @click="vistaActiva = 'calendario'"
            :class="[
              vistaActiva === 'calendario'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium'
            ]"
            class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition"
            title="Vista Calendario"
          >
            <Calendar class="w-3.5 h-3.5" />
            <span>Calendario</span>
          </button>
        </div>

        <!-- Badge de Total Actividades -->
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.08] shrink-0">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          {{ actividades.length }} Actividades
        </span>

        <!-- Botón Sincronizar Alertas -->
        <button
          @click="sincronizarAlertasManual"
          title="Verificar y sincronizar recordatorios en el Centro de Notificaciones"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition shadow-sm"
        >
          <BellRing class="w-3.5 h-3.5 text-zinc-500" />
          <span class="hidden sm:inline">Sincronizar Alertas</span>
        </button>

        <!-- Botón Nueva Actividad -->
        <button
          v-if="authStore.tienePermiso('clientes:crear')"
          @click="abrirModalNueva"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition active:scale-95 shadow-indigo-950/20"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Nueva Actividad</span>
        </button>
      </div>
    </div>

    <!-- 1. Listado de Actividades -->
    <div v-if="vistaActiva === 'lista'" class="space-y-3">
      <!-- Estado Vacío -->
      <div
        v-if="actividades.length === 0"
        class="bg-white dark:bg-zinc-900/50 p-12 rounded-2xl border border-zinc-200 dark:border-white/[0.06] text-center flex flex-col items-center justify-center gap-3"
      >
        <div class="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
          <CalendarClock class="w-6 h-6" />
        </div>
        <div class="max-w-md">
          <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            No hay actividades en esta vista
          </h3>
          <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            No se encontraron compromisos que coincidan con los filtros aplicados. Puedes programar una nueva acción comercial en cualquier momento.
          </p>
        </div>
        <button
          v-if="authStore.tienePermiso('clientes:crear')"
          @click="abrirModalNueva"
          class="mt-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition flex items-center gap-1.5"
        >
          <Plus class="w-4 h-4" />
          <span>Programar Actividad</span>
        </button>
      </div>

      <!-- Tarjeta de Actividad Individual -->
      <div
        v-for="act in actividades"
        :key="act.id"
        class="bg-white dark:bg-zinc-900/70 p-4 rounded-2xl border transition-all shadow-sm hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 group"
        :class="[
          act.estado === 'completada'
            ? 'opacity-60 bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/[0.04]'
            : estaVencida(act)
            ? 'border-rose-500/30 bg-rose-500/[0.02]'
            : esDeHoy(act)
            ? 'border-indigo-500/30 bg-indigo-500/[0.02]'
            : 'border-zinc-200 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/[0.14]'
        ]"
      >
        <!-- Lado Izquierdo: Checkbox, Icono, Información -->
        <div class="flex items-start gap-3.5 flex-1 min-w-0">
          <!-- Botón de Completar Rápido -->
          <button
            v-if="authStore.tienePermiso('clientes:editar')"
            @click="act.estado === 'completada' ? null : confirmarCompletar(act)"
            :disabled="act.estado === 'completada'"
            class="mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition shrink-0"
            :class="[
              act.estado === 'completada'
                ? 'bg-emerald-500 text-white border-emerald-600'
                : 'border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-transparent hover:text-emerald-600'
            ]"
            :title="act.estado === 'completada' ? 'Actividad completada' : 'Marcar como completada'"
          >
            <Check class="w-3.5 h-3.5 stroke-[3]" />
          </button>

          <!-- Icono de Tipo -->
          <div
            class="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0"
            :class="resolverColorTipo(act.tipo)"
          >
            <component :is="resolverIconoTipo(act.tipo)" class="w-4 h-4" />
          </div>

          <!-- Detalles Textuales -->
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <span class="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight" :class="act.estado === 'completada' ? 'line-through text-zinc-500' : ''">
                {{ act.titulo }}
              </span>

              <!-- Badge de Tipo -->
              <span class="px-2 py-0.5 rounded text-[10px] font-medium border capitalize" :class="resolverColorTipo(act.tipo)">
                {{ act.tipo }}
              </span>

              <!-- Badge de Prioridad -->
              <span class="px-2 py-0.5 rounded text-[10px] font-medium border capitalize" :class="resolverClasePrioridad(act.prioridad)">
                {{ act.prioridad }}
              </span>

              <!-- Badge de Estado -->
              <span
                v-if="act.estado === 'completada'"
                class="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              >
                Completada
              </span>
              <span
                v-else-if="estaVencida(act)"
                class="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1"
              >
                <AlertTriangle class="w-2.5 h-2.5" />
                Vencida
              </span>
              <span
                v-else-if="esDeHoy(act)"
                class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 inline-flex items-center gap-1 shadow-xs"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Para Hoy</span>
              </span>
            </div>

            <!-- Cliente y Descripción -->
            <div class="flex items-center gap-2 text-xs text-zinc-500 mb-1">
              <span class="font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1 truncate">
                <Building2 class="w-3 h-3 shrink-0" />
                {{ act.clienteNombre }}
              </span>
              <span v-if="act.clienteSector" class="text-zinc-400">• {{ act.clienteSector }}</span>
              <span class="text-zinc-400">• Asignado a: {{ act.responsable }}</span>
            </div>

            <p v-if="act.descripcion" class="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
              {{ act.descripcion }}
            </p>

            <!-- Notas de Resultado si está completada -->
            <div
              v-if="act.resultadoNotas"
              class="mt-2 p-2 bg-emerald-500/[0.07] border border-emerald-500/20 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-1.5"
            >
              <CheckCircle2 class="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
              <div>
                <span class="font-medium">Resultado: </span>
                <span>{{ act.resultadoNotas }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Lado Derecho: Fecha y Botones de Acción -->
        <div class="flex items-center justify-between md:justify-end gap-3 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-zinc-100 dark:border-white/[0.05]">
          <!-- Fecha y Tiempo Relativo -->
          <div class="text-right">
            <div class="text-xs font-mono font-medium text-zinc-800 dark:text-zinc-200">
              {{ formatDate(act.fechaLimite, 'datetime') }}
            </div>
            <div class="text-[11px] text-zinc-400 font-sans">
              {{ formatRelativeTime(act.fechaLimite) }}
            </div>
          </div>

          <!-- Botones de Acción -->
          <div class="flex items-center gap-1">
            <button
              v-if="act.estado !== 'completada' && authStore.tienePermiso('clientes:editar')"
              @click="confirmarCompletar(act)"
              title="Marcar como realizada"
              class="p-1.5 text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition"
            >
              <CheckCircle2 class="w-4 h-4" />
            </button>

            <button
              v-if="authStore.tienePermiso('clientes:editar')"
              @click="editarActividad(act)"
              title="Editar actividad"
              class="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <Edit2 class="w-4 h-4" />
            </button>

            <button
              v-if="authStore.tienePermiso('clientes:eliminar')"
              @click="eliminarActividad(act)"
              title="Eliminar actividad"
              class="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Vista Tablero Kanban de Actividades y Tareas -->
    <AgendaKanbanView
      v-else-if="vistaActiva === 'tablero'"
      :actividades="actividades"
      @editar="editarActividad"
      @completar="confirmarCompletar"
      @eliminar="eliminarActividad"
      @cambiar-estado="onCambiarEstado"
      @crear="abrirModalNueva"
    />

    <!-- 3. Vista Calendario Mensual de Actividades y Tareas -->
    <AgendaCalendarioView
      v-else-if="vistaActiva === 'calendario'"
      :actividades="actividades"
      @editar="editarActividad"
      @completar="confirmarCompletar"
      @crear="abrirModalNuevaConFecha"
      @mover-fecha="onMoverFecha"
    />

    <!-- Modal para Registrar o Editar Actividad -->
    <ModalActividadSeguimiento
      v-model:abierto="modalNuevoAbierto"
      :actividad-id="actividadEnEdicionId"
      :fecha-inicial="fechaSeleccionadaParaNueva"
      @cerrar="actividadEnEdicionId = undefined; fechaSeleccionadaParaNueva = '';"
    />

    <!-- Modal para Ingresar Resultado al Completar Actividad -->
    <div
      v-if="modalCompletarAbierto"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Concluir Actividad Comercial
            </h3>
            <p class="text-zinc-400">
              {{ actividadACompletar?.titulo }}
            </p>
          </div>
        </div>

        <div>
          <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Notas de Resultado o Conclusiones (Opcional)
          </label>
          <textarea
            v-model="notasResultado"
            rows="3"
            placeholder="Ej: El cliente confirmó la cita presencial y solicitó incluir soporte 24/7 en la cotización..."
            class="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/[0.08] rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
          ></textarea>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            @click="modalCompletarAbierto = false"
            class="px-3 py-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            Cancelar
          </button>
          <button
            @click="guardarCompletada"
            class="px-4 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <Check class="w-3.5 h-3.5" />
            <span>Confirmar Realización</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
