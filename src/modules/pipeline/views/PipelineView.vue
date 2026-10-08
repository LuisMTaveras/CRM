<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { 
  Kanban, 
  Building2, 
  Calendar, 
  RefreshCw, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  Trash2,
  Tag
} from 'lucide-vue-next';
import { formatCurrency, formatDate } from '@/core/formatters/formatters';
import { FlickerlessSurface } from '@flickerless/vue';
import { pipelineService } from '../services/pipeline.service';
import type { OportunidadConCliente, EtapaOportunidad } from '../types/pipeline.types';
import NuevaOportunidadModal from '../components/NuevaOportunidadModal.vue';
import { toastService } from '@/core/notifications/toast.service';

const cargando = ref(true);
const oportunidades = ref<OportunidadConCliente[]>([]);
const modalNuevaOportunidadAbierto = ref(false);
const etapaSeleccionadaModal = ref<EtapaOportunidad>('calificacion');
const responsablesDisponibles = ref<string[]>([]);

const filtros = reactive({
  busqueda: '',
  responsable: '',
  sector: '',
});

const columnas: { clave: EtapaOportunidad; titulo: string; color: string; bgBadge: string }[] = [
  { clave: 'calificacion', titulo: 'Calificación', color: 'border-sky-500/40 text-sky-400', bgBadge: 'bg-sky-500/10 border-sky-500/20' },
  { clave: 'propuesta', titulo: 'Propuesta Enviada', color: 'border-indigo-500/40 text-indigo-400', bgBadge: 'bg-indigo-500/10 border-indigo-500/20' },
  { clave: 'negociacion', titulo: 'En Negociación', color: 'border-amber-500/40 text-amber-400', bgBadge: 'bg-amber-500/10 border-amber-500/20' },
  { clave: 'ganada', titulo: 'Cerrada Ganada', color: 'border-emerald-500/40 text-emerald-400', bgBadge: 'bg-emerald-500/10 border-emerald-500/20' },
];

const etapasOrdenadas: EtapaOportunidad[] = ['calificacion', 'propuesta', 'negociacion', 'ganada', 'perdida'];

const cargarDatos = async () => {
  cargando.value = true;
  try {
    oportunidades.value = await pipelineService.obtenerOportunidades(filtros);
    responsablesDisponibles.value = await pipelineService.obtenerResponsables();
  } catch (err) {
    console.error('Error cargando oportunidades del pipeline:', err);
    toastService.error('Error al cargar datos del pipeline comercial.');
  } finally {
    cargando.value = false;
  }
};

const totalPorColumna = (clave: EtapaOportunidad) => {
  return oportunidades.value
    .filter((t) => t.etapa === clave)
    .reduce((acc, t) => acc + (t.monto || 0), 0);
};

const totalGeneralPipeline = computed(() => {
  return oportunidades.value.reduce((acc, t) => acc + (t.monto || 0), 0);
});

const cambiarEtapa = async (trato: OportunidadConCliente, nuevaEtapa: EtapaOportunidad) => {
  try {
    await pipelineService.moverEtapa(trato.id, nuevaEtapa);
    trato.etapa = nuevaEtapa;
    toastService.exito(`Oportunidad "${trato.titulo}" movida a ${obtenerTituloEtapa(nuevaEtapa)}`);
    // Recargar para sincronizar probabilidades y estados
    cargarDatos();
  } catch {
    toastService.error('No se pudo mover la etapa de la oportunidad.');
  }
};

const avanzarEtapa = (trato: OportunidadConCliente) => {
  const currentIndex = etapasOrdenadas.indexOf(trato.etapa);
  if (currentIndex < 3) {
    cambiarEtapa(trato, etapasOrdenadas[currentIndex + 1]);
  }
};

const retrocederEtapa = (trato: OportunidadConCliente) => {
  const currentIndex = etapasOrdenadas.indexOf(trato.etapa);
  if (currentIndex > 0) {
    cambiarEtapa(trato, etapasOrdenadas[currentIndex - 1]);
  }
};

const eliminarTrato = async (trato: OportunidadConCliente) => {
  if (!confirm(`¿Confirma que desea eliminar la oportunidad "${trato.titulo}"?`)) return;
  try {
    await pipelineService.eliminarOportunidad(trato.cliente_id, trato.id);
    oportunidades.value = oportunidades.value.filter((o) => o.id !== trato.id);
    toastService.exito('Oportunidad eliminada del pipeline.');
  } catch {
    toastService.error('Error al eliminar la oportunidad.');
  }
};

const abrirModalNueva = (etapa: EtapaOportunidad = 'calificacion') => {
  etapaSeleccionadaModal.value = etapa;
  modalNuevaOportunidadAbierto.value = true;
};

const obtenerTituloEtapa = (etapa: EtapaOportunidad) => {
  switch (etapa) {
    case 'calificacion': return 'Calificación';
    case 'propuesta': return 'Propuesta Enviada';
    case 'negociacion': return 'En Negociación';
    case 'ganada': return 'Cerrada Ganada';
    case 'perdida': return 'Cerrada Perdida';
  }
};

onMounted(() => {
  cargarDatos();
});
</script>

<template>
  <div class="space-y-4">
    <!-- Encabezado de la Sección y Acciones Principales -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
      <div>
        <div class="flex items-center gap-2.5 flex-wrap">
          <h1 class="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
            <Kanban class="w-5 h-5 text-emerald-400" />
            Pipeline Comercial & Deals B2B
          </h1>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            {{ oportunidades.length }} Oportunidades Activas
          </span>
        </div>
        <p class="text-xs text-zinc-400 mt-1">
          Seguimiento ágil de negociaciones comerciales, valores proyectados y probabilidades de conversión
        </p>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button
          @click="abrirModalNueva('calificacion')"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm transition active:scale-95 shadow-emerald-950/40"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>+ Nueva Oportunidad</span>
        </button>

        <button
          @click="cargarDatos"
          :disabled="cargando"
          title="Actualizar Pipeline"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 text-xs font-medium transition shadow-sm hover:border-white/[0.16] disabled:opacity-50"
        >
          <RefreshCw :class="['w-3.5 h-3.5 text-zinc-400', cargando ? 'animate-spin text-emerald-400' : '']" />
          <span class="hidden sm:inline">Actualizar</span>
        </button>
      </div>
    </div>

    <!-- Barra de Filtros en Tiempo Real -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-xl border border-white/[0.06] text-xs">
      <div class="flex flex-wrap items-center gap-2.5 flex-1">
        <!-- Búsqueda -->
        <div class="relative min-w-[220px] flex-1 sm:flex-initial">
          <Search class="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
          <input
            v-model="filtros.busqueda"
            @input="cargarDatos"
            type="text"
            placeholder="Buscar por cliente o trato..."
            class="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-700 transition"
          />
        </div>

        <!-- Filtro por Responsable -->
        <div class="flex items-center gap-1.5">
          <Filter class="w-3.5 h-3.5 text-zinc-500 hidden sm:block" />
          <select
            v-model="filtros.responsable"
            @change="cargarDatos"
            class="px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 text-xs focus:outline-none focus:border-zinc-700 transition"
          >
            <option value="">Todos los Responsables</option>
            <option v-for="r in responsablesDisponibles" :key="r" :value="r">
              {{ r }}
            </option>
          </select>
        </div>
      </div>

      <!-- Resumen Total Cartera -->
      <div class="flex items-center justify-between sm:justify-end gap-3 text-xs pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.05]">
        <span class="text-zinc-500 font-medium">Volumen Total en Embudo:</span>
        <span class="font-mono font-semibold text-emerald-400 text-sm">
          {{ formatCurrency(totalGeneralPipeline) }}
        </span>
      </div>
    </div>

    <!-- Tablero Kanban de 4 Columnas protegido con Flickerless -->
    <FlickerlessSurface
      :loading="cargando"
      :delay-ms="180"
      :preserve-height="true"
      stream-color="#10b981"
      announce-text="Actualizando estado de oportunidades en el pipeline..."
      class="rounded-xl overflow-hidden"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        <div
          v-for="col in columnas"
          :key="col.clave"
          class="saas-card rounded-xl overflow-hidden flex flex-col border border-white/[0.08]"
        >
          <!-- Cabecera de Columna -->
          <div class="p-3.5 border-b border-white/[0.07] bg-[#0c0c0e]/80 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span :class="['w-2 h-2 rounded-full border', col.color]"></span>
              <span class="text-xs font-semibold text-zinc-200">{{ col.titulo }}</span>
            </div>
            
            <div class="flex items-center gap-1.5">
              <span class="text-[11px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-md border border-white/[0.06]">
                {{ oportunidades.filter((t) => t.etapa === col.clave).length }}
              </span>
              <button
                @click="abrirModalNueva(col.clave)"
                title="Agregar oportunidad en esta etapa"
                class="w-5 h-5 rounded hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-emerald-400 transition"
              >
                <Plus class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Total Acumulado por Etapa -->
          <div class="px-3.5 py-2 bg-[#09090b]/40 border-b border-white/[0.05] text-[11px] font-mono text-zinc-400 flex justify-between">
            <span>Subtotal:</span>
            <span class="text-zinc-200 font-semibold">{{ formatCurrency(totalPorColumna(col.clave)) }}</span>
          </div>

          <!-- Lista de Tarjetas del Deal -->
          <div class="p-3 space-y-2.5 min-h-[350px]">
            <!-- Estado vacío por columna -->
            <div
              v-if="oportunidades.filter((t) => t.etapa === col.clave).length === 0"
              class="text-center py-10 px-2 text-zinc-600 text-xs border border-dashed border-zinc-800/60 rounded-lg flex flex-col items-center justify-center"
            >
              <Tag class="w-4 h-4 text-zinc-700 mb-1" />
              <span>Sin tratos en esta etapa</span>
            </div>

            <!-- Tarjetas de Oportunidades -->
            <div
              v-for="trato in oportunidades.filter((t) => t.etapa === col.clave)"
              :key="trato.id"
              class="bg-zinc-900/60 p-3.5 rounded-xl border border-white/[0.07] hover:border-white/[0.16] hover:bg-zinc-900 transition-all duration-200 shadow-sm group"
            >
              <!-- Cliente y Probabilidad -->
              <div class="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5">
                <span class="font-medium text-emerald-400 flex items-center gap-1.5 truncate max-w-[170px]" :title="trato.cliente_nombre">
                  <Building2 class="w-3.5 h-3.5 shrink-0" />
                  <span class="truncate">{{ trato.cliente_nombre }}</span>
                </span>
                <span class="font-mono text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded text-[10px] border border-white/[0.05]">
                  {{ trato.probabilidad }}%
                </span>
              </div>

              <!-- Título del Trato -->
              <div class="text-xs font-medium text-zinc-100 group-hover:text-emerald-300 transition-colors mb-2.5 leading-snug">
                {{ trato.titulo }}
              </div>

              <!-- Responsable y Sector -->
              <div class="flex items-center justify-between text-[10px] text-zinc-500 mb-2">
                <span>{{ trato.responsable }}</span>
                <span class="truncate max-w-[100px]">{{ trato.cliente_sector }}</span>
              </div>

              <!-- Monto y Fecha Cierre -->
              <div class="flex items-center justify-between pt-2 border-t border-white/[0.05] text-xs">
                <span class="font-mono font-semibold text-zinc-100 tabular-nums">
                  {{ formatCurrency(trato.monto) }}
                </span>
                <span class="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                  <Calendar class="w-3 h-3" />
                  {{ formatDate(trato.fecha_cierre_estimada) }}
                </span>
              </div>

              <!-- Botones de Transición Rápida de Etapa -->
              <div class="mt-2.5 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px]">
                <div class="flex items-center gap-1">
                  <button
                    v-if="col.clave !== 'calificacion'"
                    @click="retrocederEtapa(trato)"
                    title="Retroceder a etapa previa"
                    class="p-1 text-zinc-500 hover:text-zinc-200 rounded hover:bg-zinc-800 transition"
                  >
                    <ChevronLeft class="w-3.5 h-3.5" />
                  </button>

                  <button
                    v-if="col.clave !== 'ganada'"
                    @click="avanzarEtapa(trato)"
                    title="Avanzar a siguiente etapa"
                    class="p-1 text-zinc-400 hover:text-emerald-400 rounded hover:bg-zinc-800 transition flex items-center gap-0.5 font-medium"
                  >
                    <span>Mover</span>
                    <ChevronRight class="w-3.5 h-3.5" />
                  </button>
                </div>

                <div class="flex items-center gap-1">
                  <button
                    v-if="col.clave !== 'ganada'"
                    @click="cambiarEtapa(trato, 'ganada')"
                    title="Marcar como Ganada"
                    class="p-1 text-zinc-500 hover:text-emerald-400 rounded hover:bg-zinc-800 transition"
                  >
                    <CheckCircle2 class="w-3.5 h-3.5" />
                  </button>

                  <button
                    @click="eliminarTrato(trato)"
                    title="Eliminar oportunidad"
                    class="p-1 text-zinc-600 hover:text-rose-400 rounded hover:bg-zinc-800 transition"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FlickerlessSurface>

    <!-- Modal de Creación de Oportunidades -->
    <NuevaOportunidadModal
      v-if="modalNuevaOportunidadAbierto"
      :abierto="modalNuevaOportunidadAbierto"
      :etapa-inicial="etapaSeleccionadaModal"
      @cerrar="modalNuevaOportunidadAbierto = false"
      @creada="cargarDatos"
    />
  </div>
</template>
