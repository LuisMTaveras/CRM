<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { 
  Kanban, 
  MapPin, 
  Calendar, 
  RefreshCw, 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown,
  Trash2, 
  Edit3, 
  MoreHorizontal, 
  Settings2,
  Tag,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Clock,
  UserCheck,
  Briefcase
} from 'lucide-vue-next';
import { useRoute, useRouter } from 'vue-router';
import { formatCurrency, formatDate } from '@/core/formatters/formatters';
import { FlickerlessSurface } from '@flickerless/vue';
import { pipelineService } from '../services/pipeline.service';
import { actividadesService, ModalActividadSeguimiento } from '@/modules/agenda';
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
import DetalleTarjetaModal from '../components/DetalleTarjetaModal.vue';
import KanbanTarjetaItem from '../components/KanbanTarjetaItem.vue';
import PipelineResumenEjecutivo from '../components/PipelineResumenEjecutivo.vue';
import PipelineFiltrosBar from '../components/PipelineFiltrosBar.vue';
import ModalMotivoCierre from '../components/ModalMotivoCierre.vue';
import PipelineCalendarioView from '../components/PipelineCalendarioView.vue';
import { toastService } from '@/core/notifications/toast.service';
import { dialogService } from '@/core/dialog/dialog.service';
import AppSelect, { type SelectOption } from '@/shared/components/AppSelect.vue';
import { useAuthStore } from '@/modules/auth/stores/auth.store';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const cargando = ref(true);
const pipelines = ref<Pipeline[]>([]);
const pipelineActivoId = ref<string>((route.params.id as string) || 'pipeline-comercial');
const tarjetas = ref<TarjetaPipeline[]>([]);
const responsablesDisponibles = ref<string[]>([]);

// Vista activa: Tablero Kanban o Calendario
const vistaActiva = ref<'tablero' | 'calendario'>('tablero');
const fechaSeleccionadaParaTarjeta = ref<string>('');

// Modales
const modalNuevoPipelineAbierto = ref(false);
const modalColumnaAbierto = ref(false);
const columnaEnEdicion = ref<ColumnaPipeline | null>(null);
const modalTarjetaAbierto = ref(false);
const columnaSeleccionadaParaTarjeta = ref<string>('');
const modalDetalleTarjetaAbierto = ref(false);
const tarjetaSeleccionadaDetalle = ref<TarjetaPipeline | null>(null);

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
    colorClass: 'text-zinc-900 dark:text-zinc-100 font-semibold',
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
  { value: 'alta', label: 'Prioridad Alta', dotColor: 'bg-rose-400', colorClass: 'text-rose-600 dark:text-rose-300 font-medium' },
  { value: 'media', label: 'Prioridad Media', dotColor: 'bg-amber-400', colorClass: 'text-amber-600 dark:text-amber-300 font-medium' },
  { value: 'baja', label: 'Prioridad Baja', dotColor: 'bg-sky-400', colorClass: 'text-sky-600 dark:text-sky-300 font-medium' },
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

  const montoTotal = montoCompletado + montoEnProceso + montoBloqueado + montoPendiente;
  const montoPonderadoTotal = tarjetas.value.reduce((acc, t) => {
    const prob = t.probabilidad !== undefined ? t.probabilidad : 50;
    return acc + (t.monto || 0) * (prob / 100);
  }, 0);
  const tasaConversion = total > 0 ? Math.round((completadas / total) * 100) : 0;

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
    montoTotal,
    montoPonderadoTotal,
    tasaConversion,
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

// Detector de Clientes Estancados (> 10 días sin interacción)
const filtroSoloEstancados = ref(false);
const modalActividadAbierto = ref(false);
const tarjetaSeleccionadaSeguimiento = ref<TarjetaPipeline | null>(null);

const diagnosticoEstancado = (tarjeta: TarjetaPipeline, col?: ColumnaPipeline) => {
  if (col?.es_completado || col?.estado === 'completado') {
    return { estancado: false, diasSinContacto: 0, fechaReferencia: '', motivo: 'Etapa completada' };
  }
  return actividadesService.esClienteEstancado(
    { id: tarjeta.id, creado_en: tarjeta.creado_en },
    { id: tarjeta.cliente_id }
  );
};

const totalTarjetasEstancadas = computed(() => {
  if (!pipelineActivo.value) return 0;
  const colCompletadaId = columnaCompletada.value?.id;
  return tarjetas.value.filter((t) => {
    if (t.columna_id === colCompletadaId) return false;
    const col = pipelineActivo.value?.columnas.find((c) => c.id === t.columna_id);
    return diagnosticoEstancado(t, col).estancado;
  }).length;
});

const abrirModalSeguimiento = (tarjeta: TarjetaPipeline) => {
  tarjetaSeleccionadaSeguimiento.value = tarjeta;
  modalActividadAbierto.value = true;
};

const filtroSoloHoy = ref(false);

// Detección de Tarjetas / Tratos / Visitas programadas para HOY
const esFechaDeHoy = (fechaStr?: string | null): boolean => {
  if (!fechaStr) return false;
  const hoyStr = new Date().toISOString().slice(0, 10);
  if (fechaStr.length >= 10 && fechaStr.slice(0, 10) === hoyStr) {
    return true;
  }
  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return false;
  const hoy = new Date();
  return (
    d.getFullYear() === hoy.getFullYear() &&
    d.getMonth() === hoy.getMonth() &&
    d.getDate() === hoy.getDate()
  );
};

const tarjetasDeHoy = computed(() => {
  return tarjetas.value.filter((t) => esFechaDeHoy(t.fecha_objetivo));
});

const totalTarjetasHoy = computed(() => tarjetasDeHoy.value.length);

const tarjetasFiltradas = computed(() => {
  let list = tarjetas.value;
  if (filtroSoloEstancados.value) {
    list = list.filter((t) => {
      const col = pipelineActivo.value?.columnas.find((c) => c.id === t.columna_id);
      return diagnosticoEstancado(t, col).estancado;
    });
  }
  if (filtroSoloHoy.value) {
    list = list.filter((t) => esFechaDeHoy(t.fecha_objetivo));
  }
  return list;
});

const tarjetasPorColumna = (columnaId: string) => {
  const list = tarjetasFiltradas.value.filter((t) => t.columna_id === columnaId);
  return list.sort((a, b) => (a.orden || 0) - (b.orden || 0));
};

const tarjetasHoyPorColumna = (columnaId: string) => {
  return tarjetasPorColumna(columnaId).filter((t) => esFechaDeHoy(t.fecha_objetivo));
};

const totalMontoColumna = (columnaId: string) => {
  return tarjetasPorColumna(columnaId).reduce((acc, t) => acc + (t.monto || 0), 0);
};

const totalMontoPonderadoColumna = (columnaId: string) => {
  return tarjetasPorColumna(columnaId).reduce((acc, t) => {
    const prob = t.probabilidad !== undefined ? t.probabilidad : 50;
    return acc + (t.monto || 0) * (prob / 100);
  }, 0);
};

// Apertura y gestión del Inspector de Tarjeta / Trato
const abrirDetalleTarjeta = (tarjeta: TarjetaPipeline) => {
  tarjetaSeleccionadaDetalle.value = tarjeta;
  modalDetalleTarjetaAbierto.value = true;
};

const onTarjetaActualizada = async (actualizada: TarjetaPipeline) => {
  const idx = tarjetas.value.findIndex((t) => t.id === actualizada.id);
  if (idx !== -1) {
    tarjetas.value[idx] = actualizada;
  }
  await sincronizarTarjetasSilencioso();
};

const calcularDiasActivo = (tarjeta: TarjetaPipeline) => {
  if (!tarjeta.creado_en) return 0;
  const creado = new Date(tarjeta.creado_en).getTime();
  const diff = Date.now() - creado;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};


// Agrupación por Carriles (Swimlanes)
const tipoAgrupacion = ref<'ninguna' | 'responsable' | 'sector'>('ninguna');
const carrilesColapsados = ref<Record<string, boolean>>({});

const alternarCarril = (carrilKey: string) => {
  carrilesColapsados.value[carrilKey] = !carrilesColapsados.value[carrilKey];
};

const carrilesDisponibles = computed(() => {
  if (tipoAgrupacion.value === 'responsable') {
    const list = Array.from(new Set(tarjetasFiltradas.value.map((t) => t.responsable || 'Sin asignar'))).sort();
    return list;
  }
  if (tipoAgrupacion.value === 'sector') {
    const list = Array.from(new Set(tarjetasFiltradas.value.map((t) => t.cliente_sector || 'General'))).sort();
    return list;
  }
  return [];
});

const tarjetasPorColumnaYCarril = (columnaId: string, carrilKey: string) => {
  return tarjetasPorColumna(columnaId).filter((t) => {
    if (tipoAgrupacion.value === 'responsable') {
      return (t.responsable || 'Sin asignar') === carrilKey;
    }
    if (tipoAgrupacion.value === 'sector') {
      return (t.cliente_sector || 'General') === carrilKey;
    }
    return true;
  });
};

const totalMontoCarril = (carrilKey: string) => {
  return tarjetasFiltradas.value
    .filter((t) => {
      if (tipoAgrupacion.value === 'responsable') return (t.responsable || 'Sin asignar') === carrilKey;
      if (tipoAgrupacion.value === 'sector') return (t.cliente_sector || 'General') === carrilKey;
      return true;
    })
    .reduce((acc, t) => acc + (t.monto || 0), 0);
};

const totalTarjetasCarril = (carrilKey: string) => {
  return tarjetasFiltradas.value.filter((t) => {
    if (tipoAgrupacion.value === 'responsable') return (t.responsable || 'Sin asignar') === carrilKey;
    if (tipoAgrupacion.value === 'sector') return (t.cliente_sector || 'General') === carrilKey;
    return true;
  }).length;
};

// Pipeline Velocity (promedio de días en etapa y cuellos de botella)
const promedioDiasColumna = (columnaId: string): number => {
  const cards = tarjetasPorColumna(columnaId);
  if (cards.length === 0) return 0;
  const sumaDias = cards.reduce((acc, t) => acc + calcularDiasActivo(t), 0);
  return Math.round(sumaDias / cards.length);
};

const esCuelloDeBotella = (col: ColumnaPipeline): boolean => {
  if (col.es_completado || col.estado === 'completado') return false;
  const cards = tarjetasPorColumna(col.id);
  if (cards.length < 2) return false;
  return promedioDiasColumna(col.id) >= 12;
};

// Acciones Rápidas Directas
const redactarCorreoCliente = (tarjeta: TarjetaPipeline) => {
  router.push({
    path: '/comunicaciones',
    query: {
      accion: 'redactar',
      cliente: tarjeta.cliente_nombre,
    },
  });
};

// Modal Motivo de Cierre / Descarte
const modalMotivoCierreAbierto = ref(false);
const tarjetaParaMotivoCierre = ref<TarjetaPipeline | null>(null);

const abrirModalMotivoCierre = (tarjeta: TarjetaPipeline) => {
  tarjetaParaMotivoCierre.value = tarjeta;
  modalMotivoCierreAbierto.value = true;
};

const confirmarMotivoCierre = async (payload: { motivo: string; notas: string }) => {
  if (!tarjetaParaMotivoCierre.value) return;
  try {
    await pipelineService.actualizarTarjeta(pipelineActivoId.value, tarjetaParaMotivoCierre.value.id, {
      motivo_cierre: payload.motivo,
      notas_cierre: payload.notas,
    });
    const t = tarjetas.value.find((item) => item.id === tarjetaParaMotivoCierre.value?.id);
    if (t) {
      t.motivo_cierre = payload.motivo;
      t.notas_cierre = payload.notas;
    }
    toastService.exito(`Motivo registrado: "${payload.motivo}"`);
  } catch (err: unknown) {
    toastService.error(err instanceof Error ? err.message : 'Error al guardar motivo de cierre.');
  } finally {
    modalMotivoCierreAbierto.value = false;
    tarjetaParaMotivoCierre.value = null;
  }
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

    // Si se movió a etapa bloqueada/descarte y no tiene motivo registrado, solicitarlo
    if (colDestino?.estado === 'bloqueado' && !tarjeta.motivo_cierre) {
      abrirModalMotivoCierre(tarjeta);
    }
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
  fechaSeleccionadaParaTarjeta.value = '';
  modalTarjetaAbierto.value = true;
};

const abrirModalNuevaTarjetaConFecha = (fecha: string) => {
  fechaSeleccionadaParaTarjeta.value = fecha;
  columnaSeleccionadaParaTarjeta.value = pipelineActivo.value?.columnas[0]?.id ?? '';
  modalTarjetaAbierto.value = true;
};

const onReprogramarTarjeta = async (payload: { tarjetaId: string; nuevaFecha: string }) => {
  try {
    const tarjeta = tarjetas.value.find((t) => t.id === payload.tarjetaId);
    if (tarjeta) {
      tarjeta.fecha_objetivo = payload.nuevaFecha;
    }
    await pipelineService.actualizarTarjeta(pipelineActivoId.value, payload.tarjetaId, {
      fecha_objetivo: payload.nuevaFecha,
    });
    toastService.exito(`Fecha reprogramada al ${formatDate(payload.nuevaFecha)}`);
    await sincronizarTarjetasSilencioso();
  } catch {
    toastService.error('No se pudo reprogramar la fecha.');
    await sincronizarTarjetasSilencioso();
  }
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

        <!-- Selector de Tablero Activo -->
        <div class="flex items-center min-w-0">
          <AppSelect
            :model-value="pipelineActivoId"
            @update:model-value="(nuevoId) => cambiarPipeline(nuevoId as string)"
            :options="opcionesPipelines"
            min-width-class="min-w-[190px]"
            trigger-class="text-xs font-semibold bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/[0.1] hover:border-zinc-300 dark:hover:border-white/[0.2] px-2.5 py-1 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <!-- Conmutador de Vistas: Tablero Kanban / Calendario -->
        <div class="inline-flex items-center p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-white/[0.08] shadow-xs shrink-0">
          <button
            type="button"
            @click="vistaActiva = 'tablero'"
            :class="[
              vistaActiva === 'tablero'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium'
            ]"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition"
            title="Vista Tablero Kanban"
          >
            <Kanban class="w-3.5 h-3.5" />
            <span class="hidden md:inline">Tablero</span>
          </button>

          <button
            type="button"
            @click="vistaActiva = 'calendario'"
            :class="[
              vistaActiva === 'calendario'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium'
            ]"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition"
            title="Vista Calendario de Visitas y Tratos"
          >
            <Calendar class="w-3.5 h-3.5" />
            <span class="hidden md:inline">Calendario</span>
          </button>
        </div>

        <!-- Badge de Conteo Activo -->
        <span class="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.08] shrink-0">
          <span class="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
          {{ tarjetas.length }} {{ pipelineActivo?.tipo === 'visitas' ? 'Visitas' : 'Tarjetas' }}
        </span>

        <!-- Badge Destacado de Elementos para Hoy -->
        <span
          v-if="totalTarjetasHoy > 0"
          class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30 shrink-0 shadow-xs"
          title="Tratos o visitas programadas para el día de hoy"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse"></span>
          <span>{{ totalTarjetasHoy }} {{ totalTarjetasHoy === 1 ? 'para hoy' : 'para hoy' }}</span>
        </span>

        <!-- Menú de Opciones del Tablero Activo -->
        <div class="relative shrink-0">
                <button
                  v-if="authStore.tienePermiso('pipeline:configurar')"
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
              <span>Agregar Columna</span>
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
                  v-if="authStore.tienePermiso('pipeline:crear')"
                  @click="abrirModalNuevaTarjeta()"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition active:scale-95 shadow-indigo-950/20"
        >
          <Plus class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">{{ pipelineActivo?.tipo === 'visitas' ? 'Programar Visitas' : 'Nueva Tarjeta' }}</span>
        </button>

        <!-- Botón Añadir Columna Directo (exclusivo para vista Tablero) -->
                <button
                  v-if="vistaActiva === 'tablero' && authStore.tienePermiso('pipeline:configurar')"
                  @click="abrirModalNuevaColumna"
          :disabled="(pipelineActivo?.columnas?.length || 0) >= LIMITE_MAXIMO_COLUMNAS"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-xs font-medium transition shadow-sm disabled:opacity-40"
        >
          <Plus class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span class="hidden sm:inline">Columna</span>
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
    <!-- Resumen Ejecutivo del Pipeline (Métricas Clave & Forecast Ponderado) -->
    <PipelineResumenEjecutivo
      :tipo-pipeline="pipelineActivo?.tipo"
      :metricas="metricasProgreso"
    />

    <!-- Barra de Filtros en Tiempo Real -->
    <PipelineFiltrosBar
      v-model:vista-activa="vistaActiva"
      v-model:busqueda="filtros.busqueda"
      v-model:responsable="filtros.responsable"
      v-model:prioridad="filtros.prioridad"
      v-model:solo-estancados="filtroSoloEstancados"
      v-model:solo-hoy="filtroSoloHoy"
      v-model:tipo-agrupacion="tipoAgrupacion"
      :tipo-pipeline="pipelineActivo?.tipo"
      :opciones-responsables="opcionesResponsables"
      :opciones-prioridades="opcionesPrioridades"
      :total-tarjetas-estancadas="totalTarjetasEstancadas"
      :total-tarjetas-hoy="totalTarjetasHoy"
      :volumen-economico="metricasProgreso.montoCompletado + metricasProgreso.montoPendiente"
      @recargar="cargarDatos"
    />

    <!-- Tablero Kanban Dinámico protegido con FlickerlessSurface -->
    <FlickerlessSurface
      v-if="vistaActiva === 'tablero'"
      :loading="cargando"
      :delay-ms="180"
      :preserve-height="true"
      stream-color="#4f46e5"
      announce-text="Actualizando tablero..."
      class="rounded-xl overflow-hidden"
    >
      <div
        v-if="tipoAgrupacion === 'ninguna'"
        class="flex gap-4 items-stretch overflow-x-auto pb-3.5 h-[calc(100vh-140px)] min-h-[580px] kanban-scroll"
      >
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
              <!-- Indicador de elementos de hoy en esta etapa -->
              <span
                v-if="tarjetasHoyPorColumna(col.id).length > 0"
                class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/25 shrink-0 shadow-xs"
                :title="tarjetasHoyPorColumna(col.id).length + ' elemento(s) para hoy en esta etapa'"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse"></span>
                <span>{{ tarjetasHoyPorColumna(col.id).length }} hoy</span>
              </span>

              <span class="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-200/70 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-300 dark:border-white/[0.06]">
                {{ tarjetasPorColumna(col.id).length }}
              </span>

              <!-- Botón rápido para agregar tarjeta a esta columna -->
                  <button
                    v-if="authStore.tienePermiso('pipeline:crear')"
                    @click="abrirModalNuevaTarjeta(col.id)"
                title="Agregar elemento en esta etapa"
                class="w-5 h-5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                <Plus class="w-3.5 h-3.5" />
              </button>

              <!-- Menú de opciones de la columna -->
              <div class="relative">
                  <button
                    v-if="authStore.tienePermiso('pipeline:configurar')"
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

          <!-- Total Acumulado por Etapa con desglose nominal, métricas de permanencia y cuello de botella -->
          <div class="px-3.5 py-1.5 bg-zinc-100/70 dark:bg-[#09090b]/40 border-b border-zinc-200 dark:border-white/[0.05] text-[11px] font-mono text-zinc-500 dark:text-zinc-400 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-1.5 truncate">
              <span>Total:</span>
              <span class="text-zinc-800 dark:text-zinc-200 font-semibold">{{ formatCurrency(totalMontoColumna(col.id)) }}</span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <!-- Permanencia promedio en etapa -->
              <span
                v-if="promedioDiasColumna(col.id) > 0"
                class="inline-flex items-center gap-0.5 text-[10px] text-zinc-500 dark:text-zinc-400"
                :title="'Tiempo promedio en esta etapa: ' + promedioDiasColumna(col.id) + ' días'"
              >
                <Clock class="w-2.5 h-2.5 text-zinc-400" />
                <span>{{ promedioDiasColumna(col.id) }}d</span>
              </span>

              <!-- Alerta de cuello de botella si promedio >= 12 días -->
              <span
                v-if="esCuelloDeBotella(col)"
                class="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25 animate-pulse"
                title="Posible cuello de botella: permanencia promedio superior a 12 días"
              >
                <AlertTriangle class="w-2.5 h-2.5 text-amber-500" />
                <span>Lento</span>
              </span>

              <span
                v-if="totalMontoPonderadoColumna(col.id) > 0"
                class="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium shrink-0"
                :title="'Forecast ponderado de esta etapa: ' + formatCurrency(totalMontoPonderadoColumna(col.id))"
              >
                ~{{ formatCurrency(totalMontoPonderadoColumna(col.id)) }}
              </span>
            </div>
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

            <!-- Tarjeta Arrastrable con Acciones Rápidas Directas -->
            <KanbanTarjetaItem
              v-for="(tarjeta, cardIndex) in tarjetasPorColumna(col.id)"
              :key="tarjeta.id"
              :tarjeta="tarjeta"
              :columna="col"
              :col-index="colIndex"
              :card-index="cardIndex"
              :total-cards-in-col="tarjetasPorColumna(col.id).length"
              :total-columnas="pipelineActivo?.columnas?.length || 0"
              :tarjeta-destino-id="tarjetaDestinoId"
              :posicion-insercion="posicionInsercion"
              @click="abrirDetalleTarjeta(tarjeta)"
              @dragstart="onDragStart(tarjeta, $event)"
              @dragover="onDragOverTarjeta(tarjeta, $event)"
              @drop="onDropColumna(col.id, $event)"
              @mover-vertical="(dir) => moverTarjetaVertical(tarjeta, dir)"
              @avanzar="avanzarColumna(tarjeta)"
              @retroceder="retrocederColumna(tarjeta)"
              @abrir-detalle="abrirDetalleTarjeta(tarjeta)"
              @programar-actividad="abrirModalSeguimiento(tarjeta)"
              @redactar-correo="redactarCorreoCliente(tarjeta)"
              @motivo-cierre="abrirModalMotivoCierre(tarjeta)"
              @eliminar="eliminarTarjeta(tarjeta)"
            />
          </div>
        </div>

        <!-- Tarjeta Especial: + Añadir Nueva Columna (Limitada a 10) -->
        <div class="w-72 shrink-0 self-start">
                <button
                  v-if="authStore.tienePermiso('pipeline:configurar') && (pipelineActivo?.columnas?.length || 0) < LIMITE_MAXIMO_COLUMNAS"
                  @click="abrirModalNuevaColumna"
            class="w-full py-8 border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-indigo-500/50 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/40 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex flex-col items-center justify-center gap-2 transition group"
          >
            <div class="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 group-hover:bg-indigo-500/10 flex items-center justify-center text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition shadow-sm">
              <Plus class="w-4 h-4" />
            </div>
            <span class="text-xs font-medium">Agregar Nueva Columna</span>
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
      <div
        v-else
        class="space-y-4 pb-6 overflow-y-auto max-h-[calc(100vh-140px)] min-h-[580px] kanban-scroll"
      >
        <!-- Modo 2: Carriles Horizontales (Swimlanes por Responsable o Sector) -->
        <div
          v-for="carrilKey in carrilesDisponibles"
          :key="carrilKey"
          class="border border-zinc-200 dark:border-white/[0.08] rounded-xl overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/40 shadow-xs"
        >
          <!-- Barra de Cabecera del Carril -->
          <div
            @click="alternarCarril(carrilKey)"
            class="px-4 py-2.5 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-white/[0.07] flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition select-none"
          >
            <div class="flex items-center gap-2">
              <button class="p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                <ChevronDown v-if="!carrilesColapsados[carrilKey]" class="w-4 h-4" />
                <ChevronRight v-else class="w-4 h-4" />
              </button>
              <div class="flex items-center gap-1.5 font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                <UserCheck v-if="tipoAgrupacion === 'responsable'" class="w-3.5 h-3.5 text-indigo-500" />
                <Briefcase v-else class="w-3.5 h-3.5 text-indigo-500" />
                <span>{{ carrilKey }}</span>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono font-medium">
                {{ totalTarjetasCarril(carrilKey) }} {{ totalTarjetasCarril(carrilKey) === 1 ? 'elemento' : 'elementos' }}
              </span>
            </div>
            <div class="flex items-center gap-2 text-xs font-mono">
              <span class="text-zinc-500 font-sans">Volumen:</span>
              <span class="font-semibold text-indigo-600 dark:text-indigo-400">{{ formatCurrency(totalMontoCarril(carrilKey)) }}</span>
            </div>
          </div>

          <!-- Contenido del Carril: Columnas con Tarjetas filtradas por este carril -->
          <div v-show="!carrilesColapsados[carrilKey]" class="p-3">
            <div class="flex gap-3 overflow-x-auto pb-2 kanban-scroll items-start">
              <div
                v-for="(col, colIndex) in pipelineActivo?.columnas || []"
                :key="col.id + '-' + carrilKey"
                class="w-64 shrink-0 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900/60 p-2.5 min-h-[160px] flex flex-col"
                :class="columnaDestinoId === col.id ? 'ring-2 ring-indigo-500/40 bg-indigo-50/20 dark:bg-zinc-900/90' : ''"
                @dragover="onDragOverColumna(col.id, $event)"
                @dragleave="onDragLeave(col.id)"
                @drop="onDropColumna(col.id, $event)"
              >
                <!-- Mini cabecera de columna en carril -->
                <div class="flex items-center justify-between text-[11px] pb-1.5 mb-2 border-b border-zinc-100 dark:border-white/[0.04]">
                  <div class="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300 truncate">
                    <span :class="['w-1.5 h-1.5 rounded-full shrink-0', col.color]"></span>
                    <span class="truncate">{{ col.titulo }}</span>
                  </div>
                  <span class="font-mono text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.2 rounded">
                    {{ tarjetasPorColumnaYCarril(col.id, carrilKey).length }}
                  </span>
                </div>

                <!-- Tarjetas en este carril y columna -->
                <div class="space-y-2 flex-1">
                  <div
                    v-if="tarjetasPorColumnaYCarril(col.id, carrilKey).length === 0"
                    class="py-6 text-center text-zinc-400 dark:text-zinc-600 text-[10px] border border-dashed border-zinc-200 dark:border-zinc-800/60 rounded-lg"
                  >
                    Sin elementos
                  </div>

                  <KanbanTarjetaItem
                    v-for="(tarjeta, cardIndex) in tarjetasPorColumnaYCarril(col.id, carrilKey)"
                    :key="tarjeta.id"
                    :tarjeta="tarjeta"
                    :columna="col"
                    :col-index="colIndex"
                    :card-index="cardIndex"
                    :total-cards-in-col="tarjetasPorColumnaYCarril(col.id, carrilKey).length"
                    :total-columnas="pipelineActivo?.columnas?.length || 0"
                    :tarjeta-destino-id="tarjetaDestinoId"
                    :posicion-insercion="posicionInsercion"
                    @click="abrirDetalleTarjeta(tarjeta)"
                    @dragstart="onDragStart(tarjeta, $event)"
                    @dragover="onDragOverTarjeta(tarjeta, $event)"
                    @drop="onDropColumna(col.id, $event)"
                    @mover-vertical="(dir) => moverTarjetaVertical(tarjeta, dir)"
                    @avanzar="avanzarColumna(tarjeta)"
                    @retroceder="retrocederColumna(tarjeta)"
                    @abrir-detalle="abrirDetalleTarjeta(tarjeta)"
                    @programar-actividad="abrirModalSeguimiento(tarjeta)"
                    @redactar-correo="redactarCorreoCliente(tarjeta)"
                    @motivo-cierre="abrirModalMotivoCierre(tarjeta)"
                    @eliminar="eliminarTarjeta(tarjeta)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Estado vacío si no hay carriles -->
        <div
          v-if="carrilesDisponibles.length === 0"
          class="text-center py-16 text-zinc-500 text-xs border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl"
        >
          No hay elementos agrupables en esta vista.
        </div>
      </div>
    </FlickerlessSurface>

    <!-- Vista de Calendario Mensual de Visitas y Tratos -->
    <PipelineCalendarioView
      v-else-if="vistaActiva === 'calendario' && pipelineActivo"
      :tarjetas="tarjetasFiltradas"
      :columnas="pipelineActivo.columnas || []"
      :pipeline-tipo="pipelineActivo.tipo || 'ventas'"
      :cargando="cargando"
      @seleccionar-tarjeta="abrirDetalleTarjeta"
      @crear-tarjeta="abrirModalNuevaTarjetaConFecha"
      @mover-fecha="onReprogramarTarjeta"
    />

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
      :fecha-inicial="fechaSeleccionadaParaTarjeta"
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

    <!-- Modal para Programar Actividad / Seguimiento desde Tarjeta del Kanban -->
    <ModalActividadSeguimiento
      v-if="modalActividadAbierto"
      v-model:abierto="modalActividadAbierto"
      :cliente-preseleccionado-id="tarjetaSeleccionadaSeguimiento?.cliente_id"
      :tarjeta-preseleccionada-id="tarjetaSeleccionadaSeguimiento?.id"
      :pipeline-id="pipelineActivoId"
      @guardada="sincronizarTarjetasSilencioso"
      @cerrar="tarjetaSeleccionadaSeguimiento = null"
    />

    <!-- Inspector y Editor de Detalle de Tarjeta / Trato -->
    <DetalleTarjetaModal
      v-if="modalDetalleTarjetaAbierto && tarjetaSeleccionadaDetalle && pipelineActivo"
      :abierto="modalDetalleTarjetaAbierto"
      :tarjeta="tarjetaSeleccionadaDetalle"
      :pipeline="pipelineActivo"
      :columnas="pipelineActivo.columnas"
      @cerrar="modalDetalleTarjetaAbierto = false; tarjetaSeleccionadaDetalle = null;"
      @actualizado="onTarjetaActualizada"
      @eliminar="(t) => { modalDetalleTarjetaAbierto = false; eliminarTarjeta(t); }"
      @programar-actividad="(t) => { modalDetalleTarjetaAbierto = false; abrirModalSeguimiento(t); }"
    />

    <!-- Modal para Registrar Motivo de Cierre / Pérdida / Pausa -->
    <ModalMotivoCierre
      v-if="modalMotivoCierreAbierto && tarjetaParaMotivoCierre"
      :abierto="modalMotivoCierreAbierto"
      :tarjeta="tarjetaParaMotivoCierre"
      @cerrar="modalMotivoCierreAbierto = false; tarjetaParaMotivoCierre = null;"
      @confirmar="confirmarMotivoCierre"
    />
  </div>
</template>
