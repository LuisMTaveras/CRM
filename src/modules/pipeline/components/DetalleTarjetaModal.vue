<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { 
  X, 
  Building2, 
  Calendar, 
  DollarSign, 
  Percent, 
  User, 
  Trash2, 
  CheckCircle2, 
  AlertOctagon, 
  CalendarClock, 
  Save, 
  Clock, 
  FileText
} from 'lucide-vue-next';
import { formatCurrency } from '@/core/formatters/formatters';
import type { 
  TarjetaPipeline, 
  Pipeline, 
  ColumnaPipeline, 
  ActualizarTarjetaInput 
} from '../types/pipeline.types';
import { pipelineService } from '../services/pipeline.service';
import { toastService } from '@/core/notifications/toast.service';
import AppSelect, { type SelectOption } from '@/shared/components/AppSelect.vue';
import SectorIcon from '@/shared/components/SectorIcon.vue';

const props = defineProps<{
  abierto: boolean;
  tarjeta: TarjetaPipeline | null;
  pipeline: Pipeline | null;
  columnas: ColumnaPipeline[];
}>();

const emit = defineEmits<{
  (e: 'cerrar'): void;
  (e: 'actualizado', tarjeta: TarjetaPipeline): void;
  (e: 'eliminar', tarjeta: TarjetaPipeline): void;
  (e: 'programar-actividad', tarjeta: TarjetaPipeline): void;
}>();

const guardando = ref(false);
const errorMensaje = ref('');
const responsablesDisponibles = ref<string[]>([]);

const formulario = reactive({
  titulo: '',
  columna_id: '',
  monto: 0,
  probabilidad: 50,
  prioridad: 'media' as 'alta' | 'media' | 'baja',
  fecha_objetivo: '',
  responsable: '',
  notas: '',
});

const opcionesColumnas = computed<Array<SelectOption<string>>>(() => {
  return props.columnas.map((col) => ({
    value: col.id,
    label: col.titulo,
    colorClass: col.estado === 'completado' ? 'text-emerald-500 font-semibold' : 'text-zinc-200',
  }));
});

const opcionesPrioridad: Array<SelectOption<'alta' | 'media' | 'baja'>> = [
  { value: 'alta', label: 'Prioridad Alta', dotColor: 'bg-rose-400', colorClass: 'text-rose-300 font-medium' },
  { value: 'media', label: 'Prioridad Media', dotColor: 'bg-amber-400', colorClass: 'text-amber-300 font-medium' },
  { value: 'baja', label: 'Prioridad Baja', dotColor: 'bg-sky-400', colorClass: 'text-sky-300 font-medium' },
];

const opcionesResponsables = computed<Array<SelectOption<string>>>(() => {
  return responsablesDisponibles.value.map((r) => ({
    value: r,
    label: r,
  }));
});

// Cargar responsables
const cargarResponsables = async () => {
  try {
    responsablesDisponibles.value = await pipelineService.obtenerResponsables();
  } catch {
    // fallback
  }
};

watch(
  () => props.tarjeta,
  (t) => {
    if (t) {
      formulario.titulo = t.titulo || '';
      formulario.columna_id = t.columna_id || '';
      formulario.monto = t.monto || 0;
      formulario.probabilidad = t.probabilidad !== undefined ? t.probabilidad : 50;
      formulario.prioridad = t.prioridad || 'media';
      formulario.fecha_objetivo = t.fecha_objetivo || new Date().toISOString().slice(0, 10);
      formulario.responsable = t.responsable || '';
      formulario.notas = t.notas || '';
      errorMensaje.value = '';
    }
  },
  { immediate: true }
);

watch(
  () => props.abierto,
  (abierto) => {
    if (abierto) {
      cargarResponsables();
    }
  }
);

// Cálculos financieros
const montoPonderado = computed(() => {
  return (formulario.monto || 0) * (formulario.probabilidad / 100);
});

const ajustarMonto = (delta: number) => {
  formulario.monto = Math.max(0, (formulario.monto || 0) + delta);
};

const establecerProbabilidad = (valor: number) => {
  formulario.probabilidad = valor;
};

// Días activo / antigüedad de la tarjeta
const diasActivo = computed(() => {
  if (!props.tarjeta?.creado_en) return 0;
  const creado = new Date(props.tarjeta.creado_en).getTime();
  const ahora = Date.now();
  const diff = ahora - creado;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
});

// Columna marcada como completada
const columnaCompletada = computed(() => {
  return props.columnas.find((c) => c.es_completado || c.estado === 'completado') || props.columnas[props.columnas.length - 1];
});

// Columna bloqueada si existe
const columnaBloqueada = computed(() => {
  return props.columnas.find((c) => c.estado === 'bloqueado');
});

const guardarCambios = async () => {
  if (!props.tarjeta || !props.pipeline) return;
  if (!formulario.titulo.trim()) {
    errorMensaje.value = 'El título de la tarjeta u oportunidad es obligatorio.';
    return;
  }

  guardando.value = true;
  errorMensaje.value = '';

  try {
    const input: ActualizarTarjetaInput = {
      titulo: formulario.titulo.trim(),
      columna_id: formulario.columna_id,
      monto: Number(formulario.monto),
      probabilidad: Number(formulario.probabilidad),
      prioridad: formulario.prioridad,
      fecha_objetivo: formulario.fecha_objetivo,
      responsable: formulario.responsable,
      notas: formulario.notas.trim(),
    };

    const actualizada = await pipelineService.actualizarTarjeta(
      props.pipeline.id,
      props.tarjeta.id,
      input
    );

    toastService.exito('Tarjeta actualizada exitosamente.');
    emit('actualizado', actualizada);
    emit('cerrar');
  } catch (err: unknown) {
    errorMensaje.value = err instanceof Error ? err.message : 'Error al guardar cambios de la tarjeta.';
  } finally {
    guardando.value = false;
  }
};

const marcarComoGanada = async () => {
  if (!columnaCompletada.value) return;
  formulario.columna_id = columnaCompletada.value.id;
  formulario.probabilidad = 100;
  await guardarCambios();
};

const marcarComoBloqueada = async () => {
  if (!columnaBloqueada.value) {
    toastService.info('No hay columna configurada con estado bloqueado en este tablero.');
    return;
  }
  formulario.columna_id = columnaBloqueada.value.id;
  await guardarCambios();
};
</script>

<template>
  <div
    v-if="abierto && tarjeta"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    @click.self="emit('cerrar')"
  >
    <div
      class="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/[0.1] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
    >
      <!-- Cabecera del Inspector -->
      <div class="px-5 py-4 border-b border-zinc-200 dark:border-white/[0.08] flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-900/40 shrink-0">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Building2 class="w-5 h-5" />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {{ tarjeta?.cliente_nombre }}
              </h3>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-white/[0.06] shrink-0">
                <SectorIcon :sector="tarjeta?.cliente_sector || ''" class="w-3 h-3 text-zinc-400" />
                <span>{{ tarjeta?.cliente_sector }}</span>
              </span>
            </div>
            <div class="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              <span>Etapa actual:</span>
              <span class="font-medium text-indigo-600 dark:text-indigo-400">
                {{ columnas.find((c) => c.id === tarjeta?.columna_id)?.titulo || 'En Proceso' }}
              </span>
              <span>•</span>
              <span class="flex items-center gap-1 font-mono">
                <Clock class="w-3 h-3" />
                {{ diasActivo }} días activo
              </span>
            </div>
          </div>
        </div>

        <button
          @click="emit('cerrar')"
          class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          title="Cerrar modal"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Alerta de Error -->
      <div v-if="errorMensaje" class="px-5 py-2.5 bg-rose-500/10 border-b border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
        {{ errorMensaje }}
      </div>

      <!-- Cuerpo del Formulario -->
      <div class="p-5 overflow-y-auto space-y-4.5 text-xs flex-1">
        <!-- Título del Trato o Visita -->
        <div>
          <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
            Título del Trato / Asunto Comercial <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="formulario.titulo"
            type="text"
            placeholder="Ej: Licenciamiento Enterprise B2B 2026..."
            class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <!-- Fila de Etapa y Prioridad -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
              Etapa del Embudo (Columna)
            </label>
            <AppSelect
              v-model="formulario.columna_id"
              :options="opcionesColumnas"
              :full-width="true"
            />
          </div>

          <div>
            <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
              Prioridad Estratégica
            </label>
            <AppSelect
              v-model="formulario.prioridad"
              :options="opcionesPrioridad"
              :full-width="true"
            />
          </div>
        </div>

        <!-- Módulo de Monto y Probabilidad (Cálculo Ponderado) -->
        <div class="p-4 bg-zinc-50 dark:bg-zinc-950/70 rounded-xl border border-zinc-200 dark:border-white/[0.06] space-y-3.5">
          <div class="flex items-center justify-between">
            <label class="text-zinc-800 dark:text-zinc-200 font-semibold flex items-center gap-1.5">
              <DollarSign class="w-3.5 h-3.5 text-indigo-500" />
              <span>Monto Comercial Estimado (RD$)</span>
            </label>
            <span class="font-mono text-indigo-600 dark:text-indigo-400 font-bold text-xs bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 tabular-nums">
              {{ formatCurrency(formulario.monto) }}
            </span>
          </div>

          <!-- Input numérico y botones de incremento rápido -->
          <div class="space-y-2">
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-xs font-semibold">
                RD$
              </span>
              <input
                v-model.number="formulario.monto"
                type="number"
                min="0"
                step="50000"
                class="w-full pl-12 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div class="flex items-center gap-2">
              <span class="text-[11px] text-zinc-500">Ajuste rápido:</span>
              <button
                type="button"
                @click="ajustarMonto(100000)"
                class="px-2 py-0.8 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-[11px] font-mono border border-zinc-200 dark:border-zinc-800 transition"
              >
                + 100K
              </button>
              <button
                type="button"
                @click="ajustarMonto(500000)"
                class="px-2 py-0.8 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-[11px] font-mono border border-zinc-200 dark:border-zinc-800 transition"
              >
                + 500K
              </button>
              <button
                type="button"
                @click="ajustarMonto(1000000)"
                class="px-2 py-0.8 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-[11px] font-mono border border-zinc-200 dark:border-zinc-800 transition"
              >
                + 1M
              </button>
            </div>
          </div>

          <!-- Slider de Probabilidad de Éxito -->
          <div class="pt-2 border-t border-zinc-200 dark:border-white/[0.05] space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-zinc-700 dark:text-zinc-300 font-medium flex items-center gap-1.5">
                <Percent class="w-3 h-3 text-indigo-500" />
                <span>Probabilidad de Cierre:</span>
              </label>
              <span class="font-mono font-bold text-xs" :class="formulario.probabilidad >= 70 ? 'text-emerald-500 dark:text-emerald-400' : formulario.probabilidad >= 40 ? 'text-amber-500 dark:text-amber-400' : 'text-zinc-500 dark:text-zinc-400'">
                {{ formulario.probabilidad }}%
              </span>
            </div>

            <input
              v-model.number="formulario.probabilidad"
              type="range"
              min="0"
              max="100"
              step="5"
              class="w-full accent-indigo-600 cursor-pointer"
            />

            <!-- Presets de Probabilidad y Valor Ponderado Resultante -->
            <div class="flex items-center justify-between gap-2 pt-1">
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  @click="establecerProbabilidad(25)"
                  :class="['px-2 py-0.5 rounded text-[10px] font-mono border transition', formulario.probabilidad === 25 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800']"
                >
                  25%
                </button>
                <button
                  type="button"
                  @click="establecerProbabilidad(50)"
                  :class="['px-2 py-0.5 rounded text-[10px] font-mono border transition', formulario.probabilidad === 50 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800']"
                >
                  50%
                </button>
                <button
                  type="button"
                  @click="establecerProbabilidad(75)"
                  :class="['px-2 py-0.5 rounded text-[10px] font-mono border transition', formulario.probabilidad === 75 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800']"
                >
                  75%
                </button>
                <button
                  type="button"
                  @click="establecerProbabilidad(100)"
                  :class="['px-2 py-0.5 rounded text-[10px] font-mono border transition', formulario.probabilidad === 100 ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800']"
                >
                  100%
                </button>
              </div>

              <!-- Indicador de Valor Ponderado Realista -->
              <div class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                <span>Forecast Ponderado: </span>
                <strong class="font-mono text-zinc-800 dark:text-zinc-200">{{ formatCurrency(montoPonderado) }}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Fila de Fecha Objetivo y Responsable -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1 flex items-center gap-1.5">
              <Calendar class="w-3.5 h-3.5 text-zinc-400" />
              <span>Fecha Objetivo / Cierre Estimado</span>
            </label>
            <input
              v-model="formulario.fecha_objetivo"
              type="date"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1 flex items-center gap-1.5">
              <User class="w-3.5 h-3.5 text-zinc-400" />
              <span>Responsable Comercial</span>
            </label>
            <AppSelect
              v-model="formulario.responsable"
              :options="opcionesResponsables"
              :full-width="true"
            />
          </div>
        </div>

        <!-- Notas / Requerimientos Comerciales -->
        <div>
          <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1 flex items-center gap-1.5">
            <FileText class="w-3.5 h-3.5 text-zinc-400" />
            <span>Notas & Próximos Pasos</span>
          </label>
          <textarea
            v-model="formulario.notas"
            rows="3"
            placeholder="Anotaciones clave, condiciones comerciales, objeciones del cliente o requerimientos técnicos..."
            class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition resize-none"
          ></textarea>
        </div>

        <!-- Información de Motivo de Pérdida / Descarte si existe -->
        <div v-if="tarjeta?.motivo_cierre" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 space-y-1">
          <div class="flex items-center gap-1.5 font-bold text-xs">
            <AlertOctagon class="w-4 h-4 text-rose-500" />
            <span>Motivo de Pérdida / Pausa Registrado:</span>
          </div>
          <p class="text-xs font-semibold pl-5 text-zinc-900 dark:text-zinc-100">{{ tarjeta.motivo_cierre }}</p>
          <p v-if="tarjeta.notas_cierre" class="text-[11px] text-zinc-600 dark:text-zinc-400 pl-5 italic">
            "{{ tarjeta.notas_cierre }}"
          </p>
        </div>
      </div>

      <!-- Pie con Acciones Rápidas y Guardado -->
      <div class="px-5 py-3.5 border-t border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-zinc-900/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <!-- Acciones directas de etapa -->
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            @click="marcarComoGanada"
            :disabled="guardando"
            class="px-2.5 py-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-40"
            title="Mover directamente a la etapa ganada con 100% de éxito"
          >
            <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" />
            <span>Ganar Trato</span>
          </button>

          <button
            v-if="columnaBloqueada"
            type="button"
            @click="marcarComoBloqueada"
            :disabled="guardando"
            class="px-2.5 py-1.5 rounded-xl border border-rose-500/25 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-40"
            title="Mover a etapa bloqueada / pospuesta"
          >
            <AlertOctagon class="w-3.5 h-3.5 text-rose-500" />
            <span>Pausar</span>
          </button>

          <button
            type="button"
            @click="emit('programar-actividad', tarjeta)"
            class="px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
            title="Crear llamada, reunión o tarea en agenda"
          >
            <CalendarClock class="w-3.5 h-3.5 text-amber-500" />
            <span>Seguimiento</span>
          </button>
        </div>

        <!-- Botones Principales -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="emit('eliminar', tarjeta)"
            :disabled="guardando"
            class="px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-medium transition flex items-center gap-1 disabled:opacity-40"
          >
            <Trash2 class="w-3.5 h-3.5" />
            <span>Eliminar</span>
          </button>

          <button
            type="button"
            @click="guardarCambios"
            :disabled="guardando"
            class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-40 flex items-center gap-1.5"
          >
            <Save class="w-3.5 h-3.5" />
            <span>{{ guardando ? 'Guardando...' : 'Guardar Cambios' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
