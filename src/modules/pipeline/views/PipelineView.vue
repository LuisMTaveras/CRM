<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { 
  Kanban, 
  MapPin, 
  Building2, 
  Calendar, 
  RefreshCw, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  ChevronLeft, 
  ChevronUp,
  ChevronDown,
  Trash2, 
  Edit3, 
  MoreHorizontal, 
  Settings2,
  Tag,
  AlertCircle,
  AlertOctagon,
  GripVertical,
  ArrowLeft
} from 'lucide-vue-next';
import { useRoute, useRouter } from 'vue-router';
import { formatCurrency, formatDate } from '@/core/formatters/formatters';
import { FlickerlessSurface } from '@flickerless/vue';
import { pipelineService } from '../services/pipeline.service';
import type { 
  Pipeline, 
  ColumnaPipeline, 
  TarjetaPipeline, 
  FiltrosPipeline
} from '../types/pipeline.types';
import { LIMITE_MAXIMO_COLUMNAS } from '../types/pipeline.types';
import NuevoPipelineModal from '../components/NuevoPipelineModal.vue';
import GestionColumnaModal from '../components/GestionColumnaModal.vue';
import NuevaTarjetaModal from '../components/NuevaTarjetaModal.vue';
import { toastService } from '@/core/notifications/toast.service';
import { dialogService } from '@/core/dialog/dialog.service';
import AppSelect, { type SelectOption } from '@/shared/components/AppSelect.vue';
import SectorIcon from '@/shared/components/SectorIcon.vue';

const route = useRoute();
const router = useRouter();

const cargando = ref(true);
const pipelines = ref<Pipeline[]>([]);
const pipelineActivoId = ref<string>((route.params.id as string) || 'pipeline-comercial');
const tarjetas = ref<TarjetaPipeline[]>([]);
const responsablesDisponibles = ref<string[]>([]);

// Modales
const modalNuevoPipelineAbierto = ref(false);
const modalColumnaAbierto = ref(false);
const columnaEnEdicion = ref<ColumnaPipeline | null>(null);
const modalTarjetaAbierto = ref(false);
const columnaSeleccionadaParaTarjeta = ref<string>('');

// Drag & Drop
const tarjetaArrastrada = ref<TarjetaPipeline | null>(null);
const columnaDestinoId = ref<string | null>(null);
const tarjetaDestinoId = ref<string | null>(null);
const posicionInsercion = ref<'antes' | 'despues'>('despues');

// Menús desplegables
const menuOpcionesPipelineAbierto = ref(false);
const columnaMenuAbiertoId = ref<string | null>(null);

// Modal para editar nombre de pipeline
const modalEditarNombrePipeline = ref(false);
const nombrePipelineEditado = ref('');
const descripcionPipelineEditada = ref('');

const filtros = reactive<FiltrosPipeline>({
  busqueda: '',
  responsable: '',
  prioridad: '',
});

const opcionesPipelines = computed<Array<SelectOption<string>>>(() => {
  return pipelines.value.map((p) => ({
    value: p.id,
    label: p.nombre,
    icon: p.tipo === 'visitas' ? MapPin : Kanban,
    colorClass: 'text-zinc-100 font-semibold',
  }));
});

const opcionesResponsables = computed<Array<SelectOption<string>>>(() => {
  return [
    { value: '', label: 'Todos los Responsables' },
    ...responsablesDisponibles.value.map((r) => ({
      value: r,
      label: r,
    })),
  ];
});

const opcionesPrioridades: Array<SelectOption<string>> = [
  { value: '', label: 'Todas las Prioridades' },
  { value: 'alta', label: 'Prioridad Alta', dotColor: 'bg-rose-400', colorClass: 'text-rose-300 font-medium' },
  { value: 'media', label: 'Prioridad Media', dotColor: 'bg-amber-400', colorClass: 'text-amber-300 font-medium' },
  { value: 'baja', label: 'Prioridad Baja', dotColor: 'bg-sky-400', colorClass: 'text-sky-300 font-medium' },
];

const pipelineActivo = computed<Pipeline | null>(() => {
  return pipelines.value.find((p) => p.id === pipelineActivoId.value) || pipelines.value[0] || null;
});

// Columna marcada como Completado (exactamente una por tablero)
const columnaCompletada = computed<ColumnaPipeline | null>(() => {
  if (!pipelineActivo.value || !pipelineActivo.value.columnas) return null;
  return (
    pipelineActivo.value.columnas.find((c) => c.es_completado) ||
    pipelineActivo.value.columnas[pipelineActivo.value.columnas.length - 1] ||
    null
  );
});

// MÉTRICAS DE PROGRESO Y COMPLETITUD SEGÚN ESTADOS MACRO
const metricasProgreso = computed(() => {
  const total = tarjetas.value.length;
  const colCompId = columnaCompletada.value?.id;

  const colsPendientesIds = new Set(
    pipelineActivo.value?.columnas.filter((c) => c.estado === 'pendiente').map((c) => c.id) || []
  );
  const colsEnProcesoIds = new Set(
    pipelineActivo.value?.columnas.filter((c) => c.estado === 'en_proceso').map((c) => c.id) || []
  );
  const colsBloqueadasIds = new Set(
    pipelineActivo.value?.columnas.filter((c) => c.estado === 'bloqueado').map((c) => c.id) || []
  );

  const completadas = colCompId ? tarjetas.value.filter((t) => t.columna_id === colCompId).length : 0;
  const enProceso = tarjetas.value.filter((t) => colsEnProcesoIds.has(t.columna_id)).length;
  const bloqueadas = tarjetas.value.filter((t) => colsBloqueadasIds.has(t.columna_id)).length;
  const pendientes = tarjetas.value.filter(
    (t) =>
      colsPendientesIds.has(t.columna_id) ||
      (t.columna_id !== colCompId &&
        !colsEnProcesoIds.has(t.columna_id) &&
        !colsBloqueadasIds.has(t.columna_id))
  ).length;
  const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;

  const montoCompletado = colCompId
    ? tarjetas.value
        .filter((t) => t.columna_id === colCompId)
        .reduce((acc, t) => acc + (t.monto || 0), 0)
    : 0;

  const montoEnProceso = tarjetas.value
    .filter((t) => colsEnProcesoIds.has(t.columna_id))
    .reduce((acc, t) => acc + (t.monto || 0), 0);

  const montoBloqueado = tarjetas.value
    .filter((t) => colsBloqueadasIds.has(t.columna_id))
    .reduce((acc, t) => acc + (t.monto || 0), 0);

  const montoPendiente = tarjetas.value
    .filter(
      (t) =>
        colsPendientesIds.has(t.columna_id) ||
        (t.columna_id !== colCompId &&
          !colsEnProcesoIds.has(t.columna_id) &&
          !colsBloqueadasIds.has(t.columna_id))
    )
    .reduce((acc, t) => acc + (t.monto || 0), 0);

  return {
    total,
    completadas,
    enProceso,
    bloqueadas,
    pendientes,
    porcentaje,
    montoCompletado,
    montoEnProceso,
    montoBloqueado,
    montoPendiente,
  };
});

const cargarPipelines = async () => {
  try {
    pipelines.value = await pipelineService.obtenerPipelines();
    const idEnRuta = route.params.id as string;
    if (idEnRuta && pipelines.value.some((p) => p.id === idEnRuta)) {
      pipelineActivoId.value = idEnRuta;
    } else if (pipelines.value.length > 0 && !pipelines.value.some((p) => p.id === pipelineActivoId.value)) {
      pipelineActivoId.value = pipelines.value[0].id;
    }
  } catch (err) {
    console.error('Error cargando catálogo de pipelines:', err);
    toastService.error('No se pudo cargar la lista de tableros.');
  }
};

const cargarDatos = async () => {
  if (!pipelineActivoId.value) return;
  cargando.value = true;
  try {
    await cargarPipelines();
    tarjetas.value = await pipelineService.obtenerTarjetas(pipelineActivoId.value, filtros);
    responsablesDisponibles.value = await pipelineService.obtenerResponsables();
  } catch (err) {
    console.error('Error cargando tarjetas del pipeline:', err);
    toastService.error('Error al cargar datos del tablero activo.');
  } finally {
    cargando.value = false;
  }
};

const cambiarPipeline = (id: string) => {
  pipelineActivoId.value = id;
  menuOpcionesPipelineAbierto.value = false;
  columnaMenuAbiertoId.value = null;
  router.push(`/pipeline/${id}`);
};

const tarjetasPorColumna = (columnaId: string) => {
  return tarjetas.value
    .filter((t) => t.columna_id === columnaId)
    .sort((a, b) => (a.orden || 0) - (b.orden || 0));
};

const totalMontoColumna = (columnaId: string) => {
  return tarjetasPorColumna(columnaId).reduce((acc, t) => acc + (t.monto || 0), 0);
};

// Sincronización silenciosa en segundo plano (sin activar spinner ni Flickerless)
const sincronizarTarjetasSilencioso = async () => {
  if (!pipelineActivoId.value) return;
  try {
    tarjetas.value = await pipelineService.obtenerTarjetas(pipelineActivoId.value, filtros);
  } catch (err) {
    console.error('Error sincronizando tarjetas en segundo plano:', err);
  }
};

// Movimiento de tarjetas entre columnas con actualización optimista inmediata
const moverTarjetaAColumna = async (tarjeta: TarjetaPipeline, nuevaColumnaId: string, nuevoIndice?: number) => {
  const columnaAnteriorId = tarjeta.columna_id;
  // 1. Reflejo visual inmediato en la interfaz (0ms de latencia percibida)
  tarjeta.columna_id = nuevaColumnaId;
  const colDestino = pipelineActivo.value?.columnas?.find((c) => c.id === nuevaColumnaId);

  try {
    // 2. Persistencia automática en el servicio
    await pipelineService.moverTarjetaColumna(pipelineActivoId.value, tarjeta.id, nuevaColumnaId, nuevoIndice);
    toastService.exito(`Elemento movido a "${colDestino?.titulo || 'nueva etapa'}"`);
    // 3. Sincronización silenciosa en segundo plano sin parpadeos
    await sincronizarTarjetasSilencioso();
  } catch {
    tarjeta.columna_id = columnaAnteriorId;
    toastService.error('No se pudo mover el elemento.');
    await sincronizarTarjetasSilencioso();
  }
};

const avanzarColumna = (tarjeta: TarjetaPipeline) => {
  if (!pipelineActivo.value) return;
  const cols = pipelineActivo.value.columnas;
  const currentIdx = cols.findIndex((c) => c.id === tarjeta.columna_id);
  if (currentIdx !== -1 && currentIdx < cols.length - 1) {
    moverTarjetaAColumna(tarjeta, cols[currentIdx + 1].id);
  }
};

const retrocederColumna = (tarjeta: TarjetaPipeline) => {
  if (!pipelineActivo.value) return;
  const cols = pipelineActivo.value.columnas;
  const currentIdx = cols.findIndex((c) => c.id === tarjeta.columna_id);
  if (currentIdx > 0) {
    moverTarjetaAColumna(tarjeta, cols[currentIdx - 1].id);
  }
};

// REORDENAMIENTO VERTICAL (ARRIBA / ABAJO)
const moverTarjetaVertical = async (tarjeta: TarjetaPipeline, direccion: 'arriba' | 'abajo') => {
  try {
    await pipelineService.moverTarjetaPosicionVertical(pipelineActivoId.value, tarjeta.id, direccion);
    await sincronizarTarjetasSilencioso();
  } catch {
    toastService.error('No se pudo cambiar el orden.');
  }
};

const eliminarTarjeta = async (tarjeta: TarjetaPipeline) => {
  const esVisita = pipelineActivo.value?.tipo === 'visitas';
  const confirmado = await dialogService.confirmar({
    titulo: esVisita ? 'ELIMINAR VISITA TÉCNICA' : 'ELIMINAR TARJETA',
    subtitulo: esVisita ? 'CONFIRMA LA CANCELACIÓN DE LA VISITA' : 'CONFIRMA LA ELIMINACIÓN DEL ELEMENTO',
    mensaje: esVisita
      ? `¿Confirma que desea eliminar la visita programada para "${tarjeta.cliente_nombre}"?`
      : `¿Confirma que desea eliminar la tarjeta "${tarjeta.titulo}" de "${tarjeta.cliente_nombre}"?`,
    detalle: 'Esta tarjeta se removerá permanentemente de esta etapa del tablero.',
    textoConfirmar: esVisita ? 'ELIMINAR VISITA' : 'ELIMINAR ELEMENTO',
    textoCancelar: 'CANCELAR',
    tipo: 'peligro',
  });

  if (!confirmado) return;

  try {
    await pipelineService.eliminarTarjeta(pipelineActivoId.value, tarjeta.cliente_id, tarjeta.id);
    tarjetas.value = tarjetas.value.filter((t) => t.id !== tarjeta.id);
    toastService.exito('Elemento eliminado del tablero.');
  } catch {
    toastService.error('Error al eliminar el elemento.');
  }
};

// Drag & Drop Nativo Mejorado (soporta orden vertical e inserción exacta)
const onDragStart = (tarjeta: TarjetaPipeline, event: DragEvent) => {
  tarjetaArrastrada.value = tarjeta;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', tarjeta.id);
  }
};

const onDragOverColumna = (columnaId: string, event: DragEvent) => {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  columnaDestinoId.value = columnaId;
  // Si el destino previo pertenecía a otra columna, resetearlo
  if (tarjetaDestinoId.value) {
    const cardDest = tarjetas.value.find((t) => t.id === tarjetaDestinoId.value);
    if (cardDest && cardDest.columna_id !== columnaId) {
      tarjetaDestinoId.value = null;
    }
  }
};

const onDragOverTarjeta = (tarjeta: TarjetaPipeline, event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  tarjetaDestinoId.value = tarjeta.id;
  columnaDestinoId.value = tarjeta.columna_id;

  const targetEl = event.currentTarget as HTMLElement;
  const rect = targetEl.getBoundingClientRect();
  const relY = event.clientY - rect.top;
  posicionInsercion.value = relY < rect.height / 2 ? 'antes' : 'despues';
};

const onDragLeave = (_columnaId: string) => {
  // Mantener destino suave
};

const onDropColumna = (columnaId: string, event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  const arrastrada = tarjetaArrastrada.value;
  if (!arrastrada) return;

  const targetColId = columnaId;

  if (tarjetaDestinoId.value) {
    const cardsColumna = tarjetasPorColumna(targetColId);
    let targetIdx = cardsColumna.findIndex((c) => c.id === tarjetaDestinoId.value);
    if (targetIdx !== -1) {
      if (posicionInsercion.value === 'despues') targetIdx += 1;
      moverTarjetaAColumna(arrastrada, targetColId, targetIdx);
    } else {
      moverTarjetaAColumna(arrastrada, targetColId);
    }
  } else {
    // Soltado al fondo de la columna
    moverTarjetaAColumna(arrastrada, targetColId);
  }

  columnaDestinoId.value = null;
  tarjetaDestinoId.value = null;
  tarjetaArrastrada.value = null;
};

// Gestión de Columnas
const abrirModalNuevaColumna = () => {
  if ((pipelineActivo.value?.columnas?.length || 0) >= LIMITE_MAXIMO_COLUMNAS) {
    toastService.error(`Límite máximo de ${LIMITE_MAXIMO_COLUMNAS} etapas alcanzado para este tablero.`);
    return;
  }
  columnaEnEdicion.value = null;
  modalColumnaAbierto.value = true;
  menuOpcionesPipelineAbierto.value = false;
};

const abrirModalEditarColumna = (col: ColumnaPipeline) => {
  columnaEnEdicion.value = col;
  modalColumnaAbierto.value = true;
  columnaMenuAbiertoId.value = null;
};

const moverColumna = async (columnaId: string, direccion: 'izquierda' | 'derecha') => {
  columnaMenuAbiertoId.value = null;
  try {
    await pipelineService.moverColumnaPosicion(pipelineActivoId.value, columnaId, direccion);
    await cargarPipelines();
    toastService.exito('Columna reordenada.');
  } catch {
    toastService.error('No se pudo reordenar la columna.');
  }
};

const eliminarColumna = async (col: ColumnaPipeline) => {
  columnaMenuAbiertoId.value = null;
  const confirmado = await dialogService.confirmar({
    titulo: `ELIMINAR ETAPA "${col.titulo.toUpperCase()}"`,
    subtitulo: 'REORGANIZACIÓN DE COLUMNAS DEL TABLERO',
    mensaje: `¿Confirma que desea eliminar la columna "${col.titulo}"?`,
    detalle: 'Las tarjetas existentes se moverán automáticamente a la primera columna para garantizar la integridad de los datos.',
    textoConfirmar: 'ELIMINAR ETAPA',
    textoCancelar: 'CANCELAR',
    tipo: 'peligro',
  });

  if (!confirmado) return;

  try {
    await pipelineService.eliminarColumna(pipelineActivoId.value, col.id);
    await cargarDatos();
    toastService.exito(`Columna "${col.titulo}" eliminada.`);
  } catch (err: unknown) {
    toastService.error(err instanceof Error ? err.message : 'Error al eliminar columna.');
  }
};

// Acciones de Pipeline
const abrirModalNuevaTarjeta = (columnaId?: string) => {
  columnaSeleccionadaParaTarjeta.value = columnaId || (pipelineActivo.value?.columnas[0]?.id ?? '');
  modalTarjetaAbierto.value = true;
};

const abrirEditarPipeline = () => {
  if (!pipelineActivo.value) return;
  nombrePipelineEditado.value = pipelineActivo.value.nombre;
  descripcionPipelineEditada.value = pipelineActivo.value.descripcion || '';
  modalEditarNombrePipeline.value = true;
  menuOpcionesPipelineAbierto.value = false;
};

const guardarEdicionPipeline = async () => {
  if (!nombrePipelineEditado.value.trim()) {
    toastService.error('El nombre del tablero no puede estar vacío.');
    return;
  }
  try {
    await pipelineService.actualizarPipeline(pipelineActivoId.value, {
      nombre: nombrePipelineEditado.value.trim(),
      descripcion: descripcionPipelineEditada.value.trim(),
    });
    modalEditarNombrePipeline.value = false;
    await cargarPipelines();
    toastService.exito('Tablero actualizado.');
  } catch {
    toastService.error('Error al actualizar el tablero.');
  }
};

const eliminarPipelineActivo = async () => {
  menuOpcionesPipelineAbierto.value = false;
  if (!pipelineActivo.value) return;
  if (pipelineActivo.value.es_predeterminado) {
    toastService.error('No es posible eliminar el tablero principal predeterminado.');
    return;
  }

  const nombrePipeline = pipelineActivo.value.nombre;
  const confirmado = await dialogService.confirmar({
    titulo: `ELIMINAR TABLERO "${nombrePipeline.toUpperCase()}"`,
    subtitulo: 'ACCIÓN PERMANENTE E IRREVERSIBLE',
    mensaje: `¿Confirma que desea eliminar el tablero "${nombrePipeline}" y todas sus tarjetas asociadas?`,
    detalle: 'Esta acción borrará todas las etapas y elementos activos de este tablero de forma definitiva.',
    textoConfirmar: 'ELIMINAR TABLERO',
    textoCancelar: 'CANCELAR',
    tipo: 'peligro',
  });

  if (!confirmado) return;

  try {
    await pipelineService.eliminarPipeline(pipelineActivoId.value);
    toastService.exito('Tablero eliminado.');
    router.push('/pipeline');
  } catch (err: unknown) {
    toastService.error(err instanceof Error ? err.message : 'Error al eliminar el pipeline.');
  }
};

const onPipelineCreado = (nuevoId: string) => {
  modalNuevoPipelineAbierto.value = false;
  router.push(`/pipeline/${nuevoId}`);
};

const badgePrioridad = (prioridad?: string) => {
  switch (prioridad) {
    case 'alta':
      return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    case 'media':
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    case 'baja':
      return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
    default:
      return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
  }
};

onMounted(() => {
  cargarDatos();
});

watch(
  () => route.params.id,
  (nuevoId) => {
    if (nuevoId && nuevoId !== pipelineActivoId.value) {
      pipelineActivoId.value = nuevoId as string;
      cargarDatos();
    }
  }
);
</script>

<template>
  <!-- Teleport del Encabezado hacia la Barra Superior Principal (HeaderBar) -->
    <Teleport to="#header-portal-left">
      <div class="flex items-center gap-2.5 min-w-0 flex-wrap sm:flex-nowrap">
        <!-- Retorno al Catálogo General de Pipelines -->
        <router-link
          to="/pipeline"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900/90 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-xs font-semibold transition shadow-sm group shrink-0"
        >
          <ArrowLeft class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:-translate-x-0.5 transition-transform" />
          <span class="hidden sm:inline">Todos los Tableros</span>
        </router-link>

        <span class="text-zinc-400 dark:text-zinc-700 hidden sm:inline">/</span>

        <!-- Icono y Selector de Tablero Activo -->
        <div class="flex items-center gap-2 min-w-0">
          <span
            class="p-1.5 rounded-lg border shrink-0"
            :class="pipelineActivo?.tipo === 'visitas' ? 'bg-sky-500/10 border-sky-500/20 text-sky-500 dark:text-sky-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'"
          >
            <MapPin v-if="pipelineActivo?.tipo === 'visitas'" class="w-3.5 h-3.5" />
            <Kanban v-else class="w-3.5 h-3.5" />
          </span>

          <AppSelect
            :model-value="pipelineActivoId"
            @update:model-value="(nuevoId) => cambiarPipeline(nuevoId as string)"
            :options="opcionesPipelines"
            min-width-class="min-w-[190px]"
            trigger-class="text-xs font-semibold bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/[0.1] hover:border-zinc-300 dark:hover:border-white/[0.2] px-2.5 py-1"
          />
        </div>

        <!-- Badge de Conteo Activo -->
        <span class="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse"></span>
          {{ tarjetas.length }} {{ pipelineActivo?.tipo === 'visitas' ? 'Visitas' : 'Tarjetas' }}
        </span>

        <!-- Menú de Opciones del Tablero Activo -->
        <div class="relative shrink-0">
          <button
            @click="menuOpcionesPipelineAbierto = !menuOpcionesPipelineAbierto"
            title="Ajustes de este tablero"
            class="p-1.5 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition"
          >
            <Settings2 class="w-3.5 h-3.5" />
          </button>

          <div
            v-if="menuOpcionesPipelineAbierto"
            class="absolute left-0 mt-1.5 w-52 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/[0.1] rounded-xl shadow-xl z-50 p-1 text-xs"
          >
            <button
              @click="abrirModalNuevaColumna"
              :disabled="(pipelineActivo?.columnas?.length || 0) >= LIMITE_MAXIMO_COLUMNAS"
              class="w-full text-left px-3 py-2 rounded-lg text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 transition disabled:opacity-40"
            >
              <Plus class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>+ Agregar Columna</span>
            </button>
            <button
              @click="abrirEditarPipeline"
              class="w-full text-left px-3 py-2 rounded-lg text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 transition"
            >
              <Edit3 class="w-3.5 h-3.5 text-zinc-400" />
              <span>Editar Nombre / Descripción</span>
            </button>
            <button
              v-if="!pipelineActivo?.es_predeterminado"
              @click="eliminarPipelineActivo"
              class="w-full text-left px-3 py-2 rounded-lg text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition"
            >
              <Trash2 class="w-3.5 h-3.5" />
              <span>Eliminar Tablero</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Teleport de Acciones del Tablero hacia la Barra Superior -->
    <Teleport to="#header-portal-right">
      <div class="flex items-center gap-2">
        <!-- Botón Programar Visitas / Nueva Tarjeta -->
        <button
          @click="abrirModalNuevaTarjeta()"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition active:scale-95 shadow-indigo-950/20"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>{{ pipelineActivo?.tipo === 'visitas' ? '+ Programar Visitas' : '+ Nueva Tarjeta' }}</span>
        </button>

        <!-- Botón Añadir Columna Directo -->
        <button
          @click="abrirModalNuevaColumna"
          :disabled="(pipelineActivo?.columnas?.length || 0) >= LIMITE_MAXIMO_COLUMNAS"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-xs font-medium transition shadow-sm disabled:opacity-40"
        >
          <Plus class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>+ Columna</span>
        </button>

        <!-- Actualizar -->
        <button
          @click="cargarDatos"
          :disabled="cargando"
          title="Actualizar datos"
          class="inline-flex items-center gap-1.5 p-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-medium transition shadow-sm hover:border-zinc-300 dark:hover:border-white/[0.16] disabled:opacity-50"
        >
          <RefreshCw :class="['w-3.5 h-3.5 text-zinc-400', cargando ? 'animate-spin text-indigo-600 dark:text-indigo-400' : '']" />
        </button>
      </div>
    </Teleport>

  <div class="w-full space-y-4">
    <!-- Barra de Filtros en Tiempo Real -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900/60 p-3 rounded-xl border border-zinc-200 dark:border-white/[0.06] text-xs shadow-sm">
      <div class="flex flex-wrap items-center gap-2.5 flex-1">
        <!-- Búsqueda -->
        <div class="relative min-w-[220px] flex-1 sm:flex-initial">
          <Search class="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3 top-2.5" />
          <input
            v-model="filtros.busqueda"
            @input="cargarDatos"
            type="text"
            :placeholder="pipelineActivo?.tipo === 'visitas' ? 'Buscar cliente o motivo de visita...' : 'Buscar cliente o trato...'"
            class="w-full pl-9 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <!-- Filtro por Responsable -->
        <div class="flex items-center gap-1.5">
          <Filter class="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 hidden sm:block" />
          <AppSelect
            :model-value="filtros.responsable || ''"
            @update:model-value="(nuevo) => { filtros.responsable = nuevo as string; cargarDatos(); }"
            :options="opcionesResponsables"
            size="sm"
            min-width-class="min-w-[210px]"
          />
        </div>

        <!-- Filtro por Prioridad -->
        <div class="flex items-center gap-1.5">
          <AppSelect
            :model-value="filtros.prioridad || ''"
            @update:model-value="(nuevo) => { filtros.prioridad = nuevo as string; cargarDatos(); }"
            :options="opcionesPrioridades"
            size="sm"
            min-width-class="min-w-[190px]"
          />
        </div>
      </div>

      <div class="flex items-center justify-between sm:justify-end gap-3 text-xs pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200 dark:border-white/[0.05]">
        <span class="text-zinc-500 font-medium">Volumen Económico:</span>
        <span class="font-mono font-semibold text-indigo-600 dark:text-indigo-400 text-sm">
          {{ formatCurrency(metricasProgreso.montoCompletado + metricasProgreso.montoPendiente) }}
        </span>
      </div>
    </div>

    <!-- Tablero Kanban Dinámico protegido con FlickerlessSurface -->
    <FlickerlessSurface
      :loading="cargando"
      :delay-ms="180"
      :preserve-height="true"
      stream-color="#4f46e5"
      announce-text="Actualizando tablero..."
      class="rounded-xl overflow-hidden"
    >
      <div class="flex gap-4 items-stretch overflow-x-auto pb-3.5 h-[calc(100vh-140px)] min-h-[580px] kanban-scroll">
        <!-- Columnas Dinámicas del Pipeline Activo -->
        <div
          v-for="(col, colIndex) in pipelineActivo?.columnas || []"
          :key="col.id"
          class="w-72 shrink-0 saas-card rounded-xl overflow-hidden flex flex-col border border-zinc-200 dark:border-white/[0.08] transition-colors h-full max-h-full bg-zinc-50/50 dark:bg-transparent"
          :class="[
            columnaDestinoId === col.id ? 'ring-2 ring-indigo-500/40 bg-indigo-50/20 dark:bg-zinc-900/90' : ''
          ]"
          @dragover="onDragOverColumna(col.id, $event)"
          @dragleave="onDragLeave(col.id)"
          @drop="onDropColumna(col.id, $event)"
        >
          <!-- Cabecera de Columna -->
          <div class="p-3 border-b border-zinc-200 dark:border-white/[0.07] bg-white dark:bg-[#0c0c0e]/80 flex items-center justify-between shrink-0 shadow-sm">
            <div class="flex items-center gap-1.5 truncate">
              <span :class="['w-2 h-2 rounded-full border shrink-0', col.color]"></span>
              <span class="text-xs font-semibold text-zinc-900 dark:text-zinc-200 truncate" :title="col.titulo">
                {{ col.titulo }}
              </span>
              <!-- Indicador de Estado Macro de la Etapa -->
              <span
                v-if="col.estado === 'completado' || col.es_completado"
                class="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0"
                title="Estado Meta: Las tarjetas aquí suman al 100% completado"
              >
                ✓ Completado
              </span>
              <span
                v-else-if="col.estado === 'en_proceso'"
                class="px-1.5 py-0.5 rounded text-[9px] font-medium bg-sky-500/10 text-sky-500 dark:text-sky-400 border border-sky-500/20 shrink-0"
                title="Estado En Proceso: Actividades o visitas en curso"
              >
                En Proceso
              </span>
              <span
                v-else-if="col.estado === 'bloqueado'"
                class="px-1.5 py-0.5 rounded text-[9px] font-medium bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 shrink-0"
                title="Estado Bloqueado: Tarea o visita detenida temporalmente"
              >
                Bloqueado
              </span>
              <span
                v-else
                class="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 shrink-0"
                title="Estado Pendiente: Tareas o visitas por iniciar"
              >
                Pendiente
              </span>
            </div>
            
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-200/70 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-300 dark:border-white/[0.06]">
                {{ tarjetasPorColumna(col.id).length }}
              </span>

              <!-- Botón rápido para agregar tarjeta a esta columna -->
              <button
                @click="abrirModalNuevaTarjeta(col.id)"
                title="Agregar elemento en esta etapa"
                class="w-5 h-5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                <Plus class="w-3.5 h-3.5" />
              </button>

              <!-- Menú de opciones de la columna -->
              <div class="relative">
                <button
                  @click="columnaMenuAbiertoId = columnaMenuAbiertoId === col.id ? null : col.id"
                  class="w-5 h-5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition"
                  title="Opciones de columna"
                >
                  <MoreHorizontal class="w-3.5 h-3.5" />
                </button>

                <div
                  v-if="columnaMenuAbiertoId === col.id"
                  class="absolute right-0 mt-1 w-52 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.1] rounded-xl shadow-xl z-20 p-1 text-xs"
                >
                  <button
                    @click="abrirModalEditarColumna(col)"
                    class="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 transition"
                  >
                    <Edit3 class="w-3 h-3 text-zinc-400" />
                    <span>Editar Etapa / Estado Macro</span>
                  </button>

                  <button
                    v-if="colIndex > 0"
                    @click="moverColumna(col.id, 'izquierda')"
                    class="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 transition"
                  >
                    <ChevronLeft class="w-3 h-3 text-zinc-400" />
                    <span>Mover a la izquierda</span>
                  </button>

                  <button
                    v-if="pipelineActivo && colIndex < pipelineActivo.columnas.length - 1"
                    @click="moverColumna(col.id, 'derecha')"
                    class="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 transition"
                  >
                    <ChevronRight class="w-3 h-3 text-zinc-400" />
                    <span>Mover a la derecha</span>
                  </button>

                  <div class="my-1 border-t border-zinc-200 dark:border-white/[0.06]"></div>

                  <button
                    @click="eliminarColumna(col)"
                    :disabled="pipelineActivo?.columnas?.length === 1"
                    class="w-full text-left px-2.5 py-1.5 rounded hover:bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-center gap-1.5 transition disabled:opacity-40"
                  >
                    <Trash2 class="w-3 h-3" />
                    <span>Eliminar Columna</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Total Acumulado por Etapa -->
          <div class="px-3.5 py-1.5 bg-zinc-100/70 dark:bg-[#09090b]/40 border-b border-zinc-200 dark:border-white/[0.05] text-[11px] font-mono text-zinc-500 dark:text-zinc-400 flex justify-between shrink-0">
            <span>Subtotal:</span>
            <span class="text-zinc-800 dark:text-zinc-200 font-semibold">{{ formatCurrency(totalMontoColumna(col.id)) }}</span>
          </div>

          <!-- Lista de Tarjetas con Soporte de Reordenamiento Vertical (Arriba/Abajo) -->
          <div
            class="p-2.5 space-y-2.5 flex-1 min-h-0 overflow-y-auto overscroll-contain kanban-column-scroll"
            @dragover="onDragOverColumna(col.id, $event)"
            @drop="onDropColumna(col.id, $event)"
          >
            <!-- Estado vacío por columna -->
            <div
              v-if="tarjetasPorColumna(col.id).length === 0"
              class="text-center py-10 px-2 text-zinc-400 dark:text-zinc-600 text-xs border border-dashed border-zinc-300 dark:border-zinc-800/60 rounded-lg flex flex-col items-center justify-center pointer-events-none"
            >
              <Tag class="w-4 h-4 text-zinc-300 dark:text-zinc-700 mb-1" />
              <span>Sin elementos en esta etapa</span>
            </div>

            <!-- Tarjeta Arrastrable y Ordenable Verticalmente -->
            <div
              v-for="(tarjeta, cardIndex) in tarjetasPorColumna(col.id)"
              :key="tarjeta.id"
              draggable="true"
              @dragstart="onDragStart(tarjeta, $event)"
              @dragover="onDragOverTarjeta(tarjeta, $event)"
              @drop.stop="onDropColumna(col.id, $event)"
              class="bg-white dark:bg-zinc-900/70 p-3 rounded-xl border border-zinc-200 dark:border-white/[0.07] hover:border-zinc-300 dark:hover:border-white/[0.18] hover:bg-zinc-50/70 dark:hover:bg-zinc-900 transition-all duration-150 shadow-sm group cursor-grab active:cursor-grabbing relative"
              :class="[
                tarjetaDestinoId === tarjeta.id
                  ? posicionInsercion === 'antes'
                    ? 'border-t-2 border-t-indigo-500'
                    : 'border-b-2 border-b-indigo-500'
                  : ''
              ]"
            >
              <!-- Cabecera de la tarjeta con Grip y Controles Arriba/Abajo -->
              <div class="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1.5">
                <span class="font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 truncate max-w-[150px]" :title="tarjeta.cliente_nombre">
                  <GripVertical class="w-3 h-3 text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 shrink-0" />
                  <Building2 class="w-3.5 h-3.5 shrink-0" />
                  <span class="truncate">{{ tarjeta.cliente_nombre }}</span>
                </span>

                <!-- Controles para reordenar ARRIBA / ABAJO dentro de la columna -->
                <div class="flex items-center gap-1">
                  <div class="flex items-center bg-zinc-100 dark:bg-zinc-950/80 rounded border border-zinc-200 dark:border-white/[0.05] p-0.5 opacity-60 group-hover:opacity-100 transition">
                    <button
                      :disabled="cardIndex === 0"
                      @click.stop="moverTarjetaVertical(tarjeta, 'arriba')"
                      title="Subir tarjeta"
                      class="p-0.5 hover:text-zinc-900 dark:hover:text-white disabled:opacity-20 transition"
                    >
                      <ChevronUp class="w-3 h-3" />
                    </button>
                    <button
                      :disabled="cardIndex === tarjetasPorColumna(col.id).length - 1"
                      @click.stop="moverTarjetaVertical(tarjeta, 'abajo')"
                      title="Bajar tarjeta"
                      class="p-0.5 hover:text-zinc-900 dark:hover:text-white disabled:opacity-20 transition"
                    >
                      <ChevronDown class="w-3 h-3" />
                    </button>
                  </div>

                  <span
                    v-if="col.estado === 'bloqueado'"
                    class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-500/15 text-rose-500 dark:text-rose-300 border border-rose-500/25 flex items-center gap-1 shrink-0"
                    title="Esta tarjeta o visita se encuentra bloqueada"
                  >
                    <AlertOctagon class="w-2.5 h-2.5" />
                    <span>Bloqueada</span>
                  </span>

                  <span :class="['px-1.5 py-0.5 rounded text-[10px] font-medium capitalize', badgePrioridad(tarjeta.prioridad)]">
                    {{ tarjeta.prioridad || 'media' }}
                  </span>
                </div>
              </div>

              <!-- Título de la Tarjeta / Visita -->
              <div class="text-xs font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors mb-2 leading-snug">
                {{ tarjeta.titulo }}
              </div>

              <!-- Notas u Objetivo (si tiene) -->
              <p v-if="tarjeta.notas" class="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-2 bg-zinc-50 dark:bg-zinc-950/40 p-1.5 rounded border border-zinc-200 dark:border-white/[0.04]">
                {{ tarjeta.notas }}
              </p>

              <!-- Responsable y Sector -->
              <div class="flex items-center justify-between text-[10px] text-zinc-500 mb-2">
                <span class="truncate max-w-[110px]">{{ tarjeta.responsable }}</span>
                <span class="truncate max-w-[110px] inline-flex items-center gap-1">
                  <SectorIcon :sector="tarjeta.cliente_sector" class="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                  <span>{{ tarjeta.cliente_sector }}</span>
                </span>
              </div>

              <!-- Monto y Fecha -->
              <div class="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-white/[0.05] text-xs">
                <span class="font-mono font-semibold text-zinc-900 dark:text-zinc-200 tabular-nums">
                  {{ tarjeta.monto ? formatCurrency(tarjeta.monto) : '—' }}
                </span>
                <span class="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 font-mono">
                  <Calendar class="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                  {{ formatDate(tarjeta.fecha_objetivo) }}
                </span>
              </div>

              <!-- Botones de Transición Rápida entre Columnas -->
              <div class="mt-2.5 pt-2 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between text-[10px]">
                <div class="flex items-center gap-1">
                  <button
                    v-if="colIndex > 0"
                    @click.stop="retrocederColumna(tarjeta)"
                    title="Mover a etapa previa"
                    class="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  >
                    <ChevronLeft class="w-3.5 h-3.5" />
                  </button>

                  <button
                    v-if="pipelineActivo && colIndex < pipelineActivo.columnas.length - 1"
                    @click.stop="avanzarColumna(tarjeta)"
                    title="Avanzar a siguiente etapa"
                    class="p-1 text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center gap-0.5 font-medium"
                  >
                    <span>Mover</span>
                    <ChevronRight class="w-3.5 h-3.5" />
                  </button>
                </div>

                <div class="flex items-center gap-1">
                  <button
                    @click.stop="eliminarTarjeta(tarjeta)"
                    title="Eliminar elemento"
                    class="p-1 text-zinc-400 hover:text-rose-500 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tarjeta Especial: + Añadir Nueva Columna (Limitada a 10) -->
        <div class="w-72 shrink-0 self-start">
          <button
            v-if="(pipelineActivo?.columnas?.length || 0) < LIMITE_MAXIMO_COLUMNAS"
            @click="abrirModalNuevaColumna"
            class="w-full py-8 border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-indigo-500/50 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/40 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex flex-col items-center justify-center gap-2 transition group"
          >
            <div class="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 group-hover:bg-indigo-500/10 flex items-center justify-center text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition shadow-sm">
              <Plus class="w-4 h-4" />
            </div>
            <span class="text-xs font-medium">+ Agregar Nueva Columna</span>
            <span class="text-[10px] text-zinc-400 dark:text-zinc-600">({{ pipelineActivo?.columnas?.length || 0 }}/{{ LIMITE_MAXIMO_COLUMNAS }} etapas)</span>
          </button>
          <div
            v-else
            class="w-full py-6 px-4 border border-zinc-200 dark:border-zinc-800/80 rounded-xl bg-white dark:bg-zinc-950/30 text-zinc-500 flex flex-col items-center justify-center text-center gap-1.5"
          >
            <AlertCircle class="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <span class="text-xs font-medium text-zinc-700 dark:text-zinc-400">Límite de {{ LIMITE_MAXIMO_COLUMNAS }} etapas</span>
            <span class="text-[10px] text-zinc-400 dark:text-zinc-500">Mantiene el tablero enfocado con métricas claras</span>
          </div>
        </div>
      </div>
    </FlickerlessSurface>

    <!-- Modal para Crear Nuevo Tablero -->
    <NuevoPipelineModal
      v-if="modalNuevoPipelineAbierto"
      :abierto="modalNuevoPipelineAbierto"
      @cerrar="modalNuevoPipelineAbierto = false"
      @creado="onPipelineCreado"
    />

    <!-- Modal para Agregar o Editar Columna -->
    <GestionColumnaModal
      v-if="modalColumnaAbierto"
      :abierto="modalColumnaAbierto"
      :pipeline-id="pipelineActivoId"
      :columna-a-editar="columnaEnEdicion"
      :total-columnas-actuales="pipelineActivo?.columnas?.length || 0"
      @cerrar="modalColumnaAbierto = false"
      @guardada="cargarDatos"
    />

    <!-- Modal para Nueva Tarjeta o Visitas (Multi-cliente) -->
    <NuevaTarjetaModal
      v-if="modalTarjetaAbierto && pipelineActivo"
      :abierto="modalTarjetaAbierto"
      :pipeline="pipelineActivo"
      :columna-inicial-id="columnaSeleccionadaParaTarjeta"
      @cerrar="modalTarjetaAbierto = false"
      @creada="cargarDatos"
    />

    <!-- Modal para Editar Nombre / Descripción del Pipeline -->
    <div
      v-if="modalEditarNombrePipeline"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
    >
      <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-xl shadow-2xl w-full max-w-md overflow-hidden p-5 space-y-4 text-xs">
        <h3 class="text-sm font-semibold text-zinc-900 dark:text-white">Editar Tablero</h3>
        <div>
          <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Nombre del Tablero</label>
          <input
            v-model="nombrePipelineEditado"
            type="text"
            class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-200 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Descripción</label>
          <input
            v-model="descripcionPipelineEditada"
            type="text"
            class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-200 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div class="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-white/[0.06]">
          <button
            @click="modalEditarNombrePipeline = false"
            class="px-3.5 py-1.5 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Cancelar
          </button>
          <button
            @click="guardarEdicionPipeline"
            class="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
