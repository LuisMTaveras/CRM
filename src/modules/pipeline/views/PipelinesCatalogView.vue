<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Kanban,
  MapPin,
  Layers,
  Plus,
  Search,
  ArrowRight,
  CheckCircle2,
  Tag,
  Edit3,
  Trash2,
  RefreshCw,
  TrendingUp,
  CreditCard,
  Settings2,
  FolderKanban,
  X,
} from 'lucide-vue-next';
import { pipelineService } from '../services/pipeline.service';
import type { ResumenPipelineItem } from '../types/pipeline.types';
import { formatCurrency } from '@/core/formatters/formatters';
import { dialogService } from '@/core/dialog/dialog.service';
import { toastService } from '@/core/notifications/toast.service';
import { FlickerlessSurface } from '@flickerless/vue';
import NuevoPipelineModal from '../components/NuevoPipelineModal.vue';

const router = useRouter();

const cargando = ref(true);
const resumenPipelines = ref<ResumenPipelineItem[]>([]);
const busqueda = ref('');
const filtroTipo = ref<string>('todos');

// Modales
const modalNuevoPipelineAbierto = ref(false);
const modalEditarPipelineAbierto = ref(false);
const pipelineEnEdicionId = ref('');
const nombreEditado = ref('');
const descripcionEditada = ref('');
const menuOpcionesId = ref<string | null>(null);

const cargarDatos = async () => {
  cargando.value = true;
  try {
    resumenPipelines.value = await pipelineService.obtenerResumenPipelines();
  } catch (err) {
    console.error('Error cargando catálogo de pipelines:', err);
    toastService.error('No se pudo cargar la lista de tableros.');
  } finally {
    cargando.value = false;
  }
};

const pipelinesFiltrados = computed(() => {
  return resumenPipelines.value.filter((pipe) => {
    const coincideTipo =
      filtroTipo.value === 'todos' || pipe.tipo === filtroTipo.value;
    const coincideBusqueda =
      !busqueda.value.trim() ||
      pipe.nombre.toLowerCase().includes(busqueda.value.toLowerCase()) ||
      (pipe.descripcion &&
        pipe.descripcion.toLowerCase().includes(busqueda.value.toLowerCase()));
    return coincideTipo && coincideBusqueda;
  });
});

// Métricas Globales para el Banner Superior
const metricasGlobales = computed(() => {
  const totalTableros = resumenPipelines.value.length;
  const totalTarjetas = resumenPipelines.value.reduce((acc, p) => acc + p.totalTarjetas, 0);
  const totalCompletadas = resumenPipelines.value.reduce((acc, p) => acc + p.completadas, 0);
  const totalBloqueadas = resumenPipelines.value.reduce((acc, p) => acc + p.bloqueadas, 0);
  const totalVolumen = resumenPipelines.value.reduce((acc, p) => acc + p.montoTotal, 0);
  const porcentajeGlobal = totalTarjetas > 0 ? Math.round((totalCompletadas / totalTarjetas) * 100) : 0;

  return {
    totalTableros,
    totalTarjetas,
    totalCompletadas,
    totalBloqueadas,
    totalVolumen,
    porcentajeGlobal,
  };
});

const navegarATablero = (pipelineId: string) => {
  router.push(`/pipeline/${pipelineId}`);
};

const abrirEditar = (pipe: ResumenPipelineItem, event: Event) => {
  event.stopPropagation();
  menuOpcionesId.value = null;
  pipelineEnEdicionId.value = pipe.id;
  nombreEditado.value = pipe.nombre;
  descripcionEditada.value = pipe.descripcion || '';
  modalEditarPipelineAbierto.value = true;
};

const guardarEdicion = async () => {
  if (!nombreEditado.value.trim()) {
    toastService.error('El nombre del tablero no puede estar vacío.');
    return;
  }
  try {
    await pipelineService.actualizarPipeline(pipelineEnEdicionId.value, {
      nombre: nombreEditado.value.trim(),
      descripcion: descripcionEditada.value.trim(),
    });
    modalEditarPipelineAbierto.value = false;
    toastService.exito('Tablero actualizado exitosamente.');
    await cargarDatos();
  } catch {
    toastService.error('Error al actualizar el tablero.');
  }
};

const eliminarTablero = async (pipe: ResumenPipelineItem, event: Event) => {
  event.stopPropagation();
  menuOpcionesId.value = null;

  if (pipe.es_predeterminado) {
    toastService.error('No es posible eliminar un tablero predeterminado del sistema.');
    return;
  }

  const confirmado = await dialogService.confirmar({
    titulo: `ELIMINAR TABLERO "${pipe.nombre.toUpperCase()}"`,
    subtitulo: 'ACCIÓN PERMANENTE E IRREVERSIBLE',
    mensaje: `¿Confirma que desea eliminar el tablero "${pipe.nombre}" y todas sus ${pipe.totalTarjetas} tarjetas asociadas?`,
    detalle: 'Esta acción borrará todas las etapas configuradas y elementos activos de forma definitiva.',
    textoConfirmar: 'ELIMINAR TABLERO',
    textoCancelar: 'CANCELAR',
    tipo: 'peligro',
  });

  if (!confirmado) return;

  try {
    await pipelineService.eliminarPipeline(pipe.id);
    toastService.exito(`Tablero "${pipe.nombre}" eliminado.`);
    await cargarDatos();
  } catch (err: unknown) {
    toastService.error(err instanceof Error ? err.message : 'Error al eliminar tablero.');
  }
};

const onPipelineCreado = (nuevoId: string) => {
  modalNuevoPipelineAbierto.value = false;
  router.push(`/pipeline/${nuevoId}`);
};

const toggleMenu = (id: string, event: Event) => {
  event.stopPropagation();
  menuOpcionesId.value = menuOpcionesId.value === id ? null : id;
};

onMounted(() => {
  cargarDatos();
  window.addEventListener('click', () => {
    menuOpcionesId.value = null;
  });
});
</script>

<template>
  <!-- Teleport del Encabezado hacia la Barra Superior Principal (HeaderBar) -->
  <Teleport to="#header-portal-left">
    <div class="flex items-center gap-3 min-w-0">
      <span class="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
        <FolderKanban class="w-5 h-5" />
      </span>
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h1 class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
            Consulta de Pipelines y Tableros
          </h1>
          <span class="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
            {{ metricasGlobales.totalTableros }} Disponibles
          </span>
        </div>
        <p class="text-[11px] text-zinc-500 dark:text-zinc-400 truncate hidden md:block">
          Supervisa el avance de cada proceso operativo o comercial y haz clic en cualquier tablero para entrar al tablero de tarjetas.
        </p>
      </div>
    </div>
  </Teleport>

  <!-- Teleport de Acciones Globales a la Barra Superior -->
  <Teleport to="#header-portal-right">
    <div class="flex items-center gap-2">
      <button
        @click="modalNuevoPipelineAbierto = true"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition active:scale-95 shadow-indigo-950/20"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>+ Nuevo Tablero</span>
      </button>

      <button
        @click="cargarDatos"
        :disabled="cargando"
        title="Actualizar datos"
        class="p-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition shadow-sm disabled:opacity-50"
      >
        <RefreshCw :class="['w-3.5 h-3.5', cargando ? 'animate-spin text-indigo-600 dark:text-indigo-400' : '']" />
      </button>
    </div>
  </Teleport>

  <div class="w-full space-y-4 pb-8">
    <!-- Banner Resumen de Métricas Globales (KPIs de Alto Impacto) -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="saas-card p-3.5 rounded-xl border border-zinc-200 dark:border-white/[0.07] bg-white dark:bg-zinc-900/50 flex items-center gap-3 shadow-sm">
        <span class="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
          <TrendingUp class="w-4 h-4" />
        </span>
        <div class="min-w-0">
          <span class="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider block">Progreso Global CRM</span>
          <div class="flex items-center gap-2">
            <span class="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">{{ metricasGlobales.porcentajeGlobal }}%</span>
            <span class="text-[11px] text-zinc-500 truncate">completado</span>
          </div>
        </div>
      </div>

      <div class="saas-card p-3.5 rounded-xl border border-zinc-200 dark:border-white/[0.07] bg-white dark:bg-zinc-900/50 flex items-center gap-3 shadow-sm">
        <span class="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-500 dark:text-sky-400 shrink-0">
          <Kanban class="w-4 h-4" />
        </span>
        <div class="min-w-0">
          <span class="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider block">Elementos Activos</span>
          <div class="flex items-center gap-2">
            <span class="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">{{ metricasGlobales.totalTarjetas }}</span>
            <span class="text-[11px] text-zinc-500 truncate">en {{ metricasGlobales.totalTableros }} tableros</span>
          </div>
        </div>
      </div>

      <div class="saas-card p-3.5 rounded-xl border border-zinc-200 dark:border-white/[0.07] bg-white dark:bg-zinc-900/50 flex items-center gap-3 shadow-sm">
        <span class="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
          <CheckCircle2 class="w-4 h-4" />
        </span>
        <div class="min-w-0">
          <span class="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider block">Metas Alcanzadas</span>
          <div class="flex items-center gap-2">
            <span class="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-300">{{ metricasGlobales.totalCompletadas }}</span>
            <span class="text-[11px] text-zinc-500 truncate">tarjetas cerradas</span>
          </div>
        </div>
      </div>

      <div class="saas-card p-3.5 rounded-xl border border-zinc-200 dark:border-white/[0.07] bg-white dark:bg-zinc-900/50 flex items-center gap-3 shadow-sm">
        <span class="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
          <CreditCard class="w-4 h-4" />
        </span>
        <div class="min-w-0">
          <span class="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider block">Volumen Económico</span>
          <div class="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400 truncate">
            {{ formatCurrency(metricasGlobales.totalVolumen) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Barra de Filtros y Búsqueda -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900/60 p-3 rounded-xl border border-zinc-200 dark:border-white/[0.06] text-xs shadow-sm">
      <!-- Filtros por Categoría -->
      <div class="flex items-center gap-1.5 flex-wrap">
        <button
          @click="filtroTipo = 'todos'"
          :class="[
            'px-3 py-1.5 rounded-lg font-medium transition text-xs',
            filtroTipo === 'todos'
              ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-white/[0.12] shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
          ]"
        >
          Todos ({{ resumenPipelines.length }})
        </button>
        <button
          @click="filtroTipo = 'ventas'"
          :class="[
            'px-3 py-1.5 rounded-lg font-medium transition text-xs flex items-center gap-1.5',
            filtroTipo === 'ventas'
              ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
          ]"
        >
          <Kanban class="w-3.5 h-3.5" />
          <span>Ventas & Comercial</span>
        </button>
        <button
          @click="filtroTipo = 'visitas'"
          :class="[
            'px-3 py-1.5 rounded-lg font-medium transition text-xs flex items-center gap-1.5',
            filtroTipo === 'visitas'
              ? 'bg-sky-500/20 text-sky-500 dark:text-sky-400 border border-sky-500/30'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
          ]"
        >
          <MapPin class="w-3.5 h-3.5" />
          <span>Visitas Técnicas</span>
        </button>
        <button
          @click="filtroTipo = 'operaciones'"
          :class="[
            'px-3 py-1.5 rounded-lg font-medium transition text-xs flex items-center gap-1.5',
            filtroTipo === 'operaciones'
              ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
          ]"
        >
          <Layers class="w-3.5 h-3.5" />
          <span>Operaciones</span>
        </button>
      </div>

      <!-- Buscador -->
      <div class="relative min-w-[240px]">
        <Search class="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3 top-2.5" />
        <input
          v-model="busqueda"
          type="text"
          placeholder="Buscar tablero por nombre..."
          class="w-full pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 transition"
        />
      </div>
    </div>

    <!-- CUADRÍCULA DE CARDS POR CADA PIPELINE (Flickerless) -->
    <FlickerlessSurface
      :loading="cargando"
      :delay-ms="120"
      :preserve-height="true"
      stream-color="#4f46e5"
      class="rounded-xl overflow-hidden"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <!-- Card de Pipeline Creado -->
        <div
          v-for="pipe in pipelinesFiltrados"
          :key="pipe.id"
          @click="navegarATablero(pipe.id)"
          class="saas-card rounded-2xl border border-zinc-200 dark:border-white/[0.08] hover:border-indigo-500/40 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/90 p-5 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-xl hover:shadow-indigo-950/10 cursor-pointer group relative overflow-hidden"
        >
          <!-- Efecto de resplandor sutil en hover -->
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.04] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>

          <div>
            <!-- Cabecera de la Card -->
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="flex items-center gap-3 min-w-0">
                <span
                  :class="[
                    'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-inner',
                    pipe.tipo === 'visitas'
                      ? 'bg-sky-500/10 border-sky-500/25 text-sky-500 dark:text-sky-400'
                      : pipe.tipo === 'operaciones'
                      ? 'bg-amber-500/10 border-amber-500/25 text-amber-500 dark:text-amber-400'
                      : 'bg-indigo-500/10 border-indigo-500/25 text-indigo-600 dark:text-indigo-400'
                  ]"
                >
                  <MapPin v-if="pipe.tipo === 'visitas'" class="w-5 h-5" />
                  <Layers v-else-if="pipe.tipo === 'operaciones'" class="w-5 h-5" />
                  <Kanban v-else class="w-5 h-5" />
                </span>

                <div class="min-w-0">
                  <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition" :title="pipe.nombre">
                    {{ pipe.nombre }}
                  </h3>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {{ pipe.tipo === 'visitas' ? 'Rutas de Visitas' : pipe.tipo === 'ventas' ? 'Embudo de Ventas' : 'Flujo Operativo' }}
                    </span>
                    <span v-if="pipe.es_predeterminado" class="px-1.5 py-0.5 rounded text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/[0.06]">
                      Predeterminado
                    </span>
                  </div>
                </div>
              </div>

              <!-- Menú de opciones (3 puntos) -->
              <div class="relative shrink-0">
                <button
                  type="button"
                  @click="toggleMenu(pipe.id, $event)"
                  class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  title="Opciones del tablero"
                >
                  <Settings2 class="w-4 h-4" />
                </button>

                <div
                  v-if="menuOpcionesId === pipe.id"
                  class="absolute right-0 mt-1.5 w-44 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/[0.1] rounded-xl shadow-xl z-20 p-1 text-xs"
                >
                  <button
                    type="button"
                    @click="abrirEditar(pipe, $event)"
                    class="w-full text-left px-3 py-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 transition"
                  >
                    <Edit3 class="w-3.5 h-3.5 text-zinc-400" />
                    <span>Editar Detalles</span>
                  </button>
                  <button
                    v-if="!pipe.es_predeterminado"
                    type="button"
                    @click="eliminarTablero(pipe, $event)"
                    class="w-full text-left px-3 py-2 rounded-lg text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                    <span>Eliminar Tablero</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Descripción del Tablero -->
            <p class="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 min-h-[32px] mb-4">
              {{ pipe.descripcion || 'Tablero dinámico con columnas personalizadas para gestión de tarjetas.' }}
            </p>

            <!-- SECCIÓN DE PROGRESO CON BARRA Y PORCENTAJE -->
            <div class="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-white/[0.05] space-y-2 mb-4">
              <div class="flex items-center justify-between text-xs">
                <div class="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-medium">
                  <TrendingUp class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Progreso de Cumplimiento:</span>
                </div>
                <div class="flex items-baseline gap-1">
                  <span class="text-base font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                    {{ pipe.porcentaje }}%
                  </span>
                  <span class="text-[10px] text-zinc-500">completado</span>
                </div>
              </div>

              <!-- Barra de Progreso Lineal con Degradado -->
              <div class="w-full bg-zinc-200 dark:bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-300 dark:border-white/[0.04]">
                <div
                  class="h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 rounded-full transition-all duration-500 ease-out"
                  :style="{ width: `${pipe.porcentaje}%` }"
                ></div>
              </div>

              <!-- Micro-desglose por estado -->
              <div class="grid grid-cols-4 gap-1 pt-1.5 text-center text-[10px] font-mono border-t border-zinc-200 dark:border-white/[0.04]">
                <div class="p-1 rounded bg-indigo-500/[0.1] text-indigo-600 dark:text-indigo-400">
                  <span class="block font-bold">{{ pipe.completadas }}</span>
                  <span class="text-[9px] text-zinc-500">Meta</span>
                </div>
                <div class="p-1 rounded bg-sky-500/[0.1] text-sky-600 dark:text-sky-400">
                  <span class="block font-bold">{{ pipe.enProceso }}</span>
                  <span class="text-[9px] text-zinc-500">En ruta</span>
                </div>
                <div :class="['p-1 rounded', pipe.bloqueadas > 0 ? 'bg-rose-500/15 text-rose-500 dark:text-rose-300 font-semibold' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500']">
                  <span class="block font-bold">{{ pipe.bloqueadas }}</span>
                  <span class="text-[9px]">Bloq.</span>
                </div>
                <div class="p-1 rounded bg-amber-500/[0.1] text-amber-600 dark:text-amber-400">
                  <span class="block font-bold">{{ pipe.pendientes }}</span>
                  <span class="text-[9px] text-zinc-500">Pend.</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Pie de la Card: Metadatos y Botón de Acceso al Tablero -->
          <div class="pt-2 border-t border-zinc-200 dark:border-white/[0.06] space-y-3">
            <div class="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              <span class="flex items-center gap-1.5">
                <Tag class="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                <strong class="text-zinc-800 dark:text-zinc-200">{{ pipe.totalTarjetas }}</strong> tarjetas en
                <span class="text-zinc-500 dark:text-zinc-400">{{ pipe.columnasCount }} etapas</span>
              </span>

              <span class="text-indigo-600 dark:text-indigo-400 font-semibold font-mono text-xs">
                {{ formatCurrency(pipe.montoTotal) }}
              </span>
            </div>

            <div
              class="w-full py-2.5 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 group-hover:bg-indigo-600 group-hover:text-white text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center justify-between border border-zinc-200 dark:border-white/[0.06] group-hover:border-indigo-500/30 transition-all duration-150"
            >
              <span>Abrir Tablero Kanban</span>
              <ArrowRight class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        <!-- Tarjeta Especial: + Crear Nuevo Tablero -->
        <div
          @click="modalNuevoPipelineAbierto = true"
          class="rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-indigo-500/50 bg-zinc-50/50 dark:bg-zinc-950/40 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 p-8 flex flex-col items-center justify-center text-center gap-3 transition cursor-pointer group min-h-[360px]"
        >
          <div class="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 group-hover:bg-indigo-500/10 border border-zinc-200 dark:border-white/[0.06] group-hover:border-indigo-500/30 flex items-center justify-center text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all shadow-inner">
            <Plus class="w-7 h-7" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
              + Crear Nuevo Tablero
            </h3>
            <p class="text-xs text-zinc-500 max-w-xs mt-1 leading-relaxed">
              Diseña un nuevo flujo con plantillas prediseñadas para visitas técnicas, licitaciones o post-venta.
            </p>
          </div>
          <span class="mt-2 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium border border-zinc-200 dark:border-white/[0.06] transition">
            Configurar Flujo
          </span>
        </div>
      </div>
    </FlickerlessSurface>

    <!-- Modal para Crear Nuevo Pipeline -->
    <NuevoPipelineModal
      v-if="modalNuevoPipelineAbierto"
      :abierto="modalNuevoPipelineAbierto"
      @cerrar="modalNuevoPipelineAbierto = false"
      @creado="onPipelineCreado"
    />

    <!-- Modal para Editar Nombre / Descripción del Pipeline -->
    <teleport to="body">
      <div
        v-if="modalEditarPipelineAbierto"
        class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none"
        @click.self="modalEditarPipelineAbierto = false"
      >
        <div class="relative w-full max-w-md bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/[0.09] rounded-2xl shadow-2xl p-6 space-y-4">
          <div class="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.07] pb-3">
            <div class="flex items-center gap-2.5">
              <span class="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-200">
                <Edit3 class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </span>
              <div>
                <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">Editar Tablero</h3>
                <p class="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase">Modificar título o propósito</p>
              </div>
            </div>
            <button
              @click="modalEditarPipelineAbierto = false"
              class="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block text-zinc-700 dark:text-zinc-400 font-medium mb-1">Nombre del Tablero *</label>
              <input
                v-model="nombreEditado"
                type="text"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label class="block text-zinc-700 dark:text-zinc-400 font-medium mb-1">Descripción</label>
              <textarea
                v-model="descripcionEditada"
                rows="3"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 resize-none"
              ></textarea>
            </div>
          </div>

          <div class="flex justify-end gap-2.5 pt-2 border-t border-zinc-200 dark:border-white/[0.06]">
            <button
              @click="modalEditarPipelineAbierto = false"
              class="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/[0.06] text-xs font-semibold uppercase"
            >
              Cancelar
            </button>
            <button
              @click="guardarEdicion"
              class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase shadow-lg shadow-indigo-950/30"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>
