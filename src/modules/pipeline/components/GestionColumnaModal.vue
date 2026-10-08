<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { 
  X, 
  Columns3, 
  CheckCircle2, 
  Clock, 
  PlayCircle, 
  Loader2, 
  AlertCircle,
  AlertOctagon 
} from 'lucide-vue-next';
import { FlickerlessSurface } from '@flickerless/vue';
import { pipelineService } from '../services/pipeline.service';
import type { ColumnaPipeline, CategoriaEstadoEtapa } from '../types/pipeline.types';
import { LIMITE_MAXIMO_COLUMNAS } from '../types/pipeline.types';
import { toastService } from '@/core/notifications/toast.service';

const props = defineProps<{
  abierto: boolean;
  pipelineId: string;
  columnaAEditar?: ColumnaPipeline | null;
  totalColumnasActuales?: number;
}>();

const emit = defineEmits<{
  (e: 'cerrar'): void;
  (e: 'guardada'): void;
}>();

const guardando = ref(false);
const errorMensaje = ref('');

const opcionesColor = [
  { nombre: 'Esmeralda', color: 'border-emerald-500/40 text-emerald-400', bgBadge: 'bg-emerald-500/10 border-emerald-500/20', dotClass: 'bg-emerald-400' },
  { nombre: 'Cielo', color: 'border-sky-500/40 text-sky-400', bgBadge: 'bg-sky-500/10 border-sky-500/20', dotClass: 'bg-sky-400' },
  { nombre: 'Índigo', color: 'border-indigo-500/40 text-indigo-400', bgBadge: 'bg-indigo-500/10 border-indigo-500/20', dotClass: 'bg-indigo-400' },
  { nombre: 'Ámbar', color: 'border-amber-500/40 text-amber-400', bgBadge: 'bg-amber-500/10 border-amber-500/20', dotClass: 'bg-amber-400' },
  { nombre: 'Púrpura', color: 'border-purple-500/40 text-purple-400', bgBadge: 'bg-purple-500/10 border-purple-500/20', dotClass: 'bg-purple-400' },
  { nombre: 'Rosa', color: 'border-rose-500/40 text-rose-400', bgBadge: 'bg-rose-500/10 border-rose-500/20', dotClass: 'bg-rose-400' },
  { nombre: 'Zinc', color: 'border-zinc-500/40 text-zinc-300', bgBadge: 'bg-zinc-500/10 border-zinc-500/20', dotClass: 'bg-zinc-400' },
];

const formulario = reactive({
  titulo: '',
  color: opcionesColor[1].color,
  bgBadge: opcionesColor[1].bgBadge,
  estado: 'en_proceso' as CategoriaEstadoEtapa,
});

watch(
  () => props.columnaAEditar,
  (col) => {
    if (col) {
      formulario.titulo = col.titulo;
      formulario.color = col.color;
      formulario.bgBadge = col.bgBadge;
      formulario.estado = col.estado || (col.es_completado ? 'completado' : 'en_proceso');
    } else {
      formulario.titulo = '';
      formulario.color = opcionesColor[1].color;
      formulario.bgBadge = opcionesColor[1].bgBadge;
      formulario.estado = 'en_proceso';
    }
  },
  { immediate: true }
);

const limiteAlcanzado = () => {
  return !props.columnaAEditar && (props.totalColumnasActuales || 0) >= LIMITE_MAXIMO_COLUMNAS;
};

const guardar = async () => {
  if (limiteAlcanzado()) {
    errorMensaje.value = `Se ha alcanzado el límite máximo de ${LIMITE_MAXIMO_COLUMNAS} etapas por tablero.`;
    return;
  }
  if (!formulario.titulo.trim()) {
    errorMensaje.value = 'El título de la etapa o columna es obligatorio.';
    return;
  }

  errorMensaje.value = '';
  guardando.value = true;
  try {
    const esCompletado = formulario.estado === 'completado';

    if (props.columnaAEditar) {
      await pipelineService.actualizarColumna(props.pipelineId, props.columnaAEditar.id, {
        titulo: formulario.titulo.trim(),
        color: formulario.color,
        bgBadge: formulario.bgBadge,
        estado: formulario.estado,
        es_completado: esCompletado,
      });
      toastService.exito(`Columna "${formulario.titulo}" actualizada.`);
    } else {
      await pipelineService.agregarColumna(props.pipelineId, {
        titulo: formulario.titulo.trim(),
        color: formulario.color,
        bgBadge: formulario.bgBadge,
        estado: formulario.estado,
        es_completado: esCompletado,
      });
      toastService.exito(`Columna "${formulario.titulo}" agregada al tablero.`);
    }
    emit('guardada');
    emit('cerrar');
  } catch (err: unknown) {
    errorMensaje.value = err instanceof Error ? err.message : 'Error al guardar la columna.';
  } finally {
    guardando.value = false;
  }
};
</script>

<template>
  <div v-if="abierto" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
    <div
      class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo-columna"
    >
      <!-- Cabecera -->
      <div class="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-white/[0.07] bg-zinc-50 dark:bg-zinc-950/60">
        <div class="flex items-center gap-2">
          <Columns3 class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h2 id="modal-titulo-columna" class="text-xs font-semibold text-zinc-900 dark:text-white tracking-tight">
            {{ columnaAEditar ? 'Configuración de Etapa' : 'Nueva Etapa del Tablero' }}
          </h2>
        </div>
        <button
          @click="emit('cerrar')"
          class="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          aria-label="Cerrar modal"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Contenido protegido por FlickerlessSurface -->
      <FlickerlessSurface
        :loading="false"
        :delay-ms="80"
        :preserve-height="true"
        stream-color="#4f46e5"
        class="p-5 space-y-4 text-xs overflow-y-auto flex-1 bg-white dark:bg-zinc-900"
      >
        <div v-if="errorMensaje" class="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs">
          {{ errorMensaje }}
        </div>

        <div v-if="limiteAlcanzado()" class="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>Límite de {{ LIMITE_MAXIMO_COLUMNAS }} etapas alcanzado para este tablero. Para añadir una nueva, elimine o edite una existente.</span>
        </div>

        <!-- Nombre de la Columna -->
        <div>
          <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Nombre de la Columna / Etapa <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="formulario.titulo"
            type="text"
            placeholder="Ejemplo: Visita Agendada, Documentación Enviada..."
            class="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500/50 transition"
          />
        </div>

        <!-- DEFINICIÓN EXPLÍCITA DEL ESTADO AL QUE PERTENECE -->
        <div>
          <!-- Si es la etapa completada final existente -->
          <div v-if="columnaAEditar?.es_completado" class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <span class="font-semibold block text-emerald-800 dark:text-emerald-200">Etapa Meta Final (100% Completado)</span>
              <span class="text-zinc-500 dark:text-zinc-400 text-[11px]">Su estado es fijo e inalterable al ser el cierre del flujo. Puedes personalizar libremente su título y color.</span>
            </div>
          </div>

          <!-- Si es una etapa editable o nueva columna -->
          <div v-else>
            <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              ¿A cuál Estado Macro pertenece esta etapa? <span class="text-rose-500">*</span>
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <!-- PENDIENTE -->
              <button
                type="button"
                @click="formulario.estado = 'pendiente'"
                :class="[
                  'p-2.5 rounded-xl border text-left transition flex flex-col gap-1',
                  formulario.estado === 'pendiente'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300'
                    : 'bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
                ]"
              >
                <div class="flex items-center gap-1.5 font-semibold text-xs">
                  <Clock class="w-3.5 h-3.5 text-amber-500" />
                  <span>Pendiente</span>
                </div>
                <span class="text-[10px] text-zinc-400 leading-tight">
                  Por iniciar o por agendar
                </span>
              </button>

              <!-- EN PROCESO -->
              <button
                type="button"
                @click="formulario.estado = 'en_proceso'"
                :class="[
                  'p-2.5 rounded-xl border text-left transition flex flex-col gap-1',
                  formulario.estado === 'en_proceso'
                    ? 'bg-sky-500/10 border-sky-500/40 text-sky-700 dark:text-sky-300'
                    : 'bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
                ]"
              >
                <div class="flex items-center gap-1.5 font-semibold text-xs">
                  <PlayCircle class="w-3.5 h-3.5 text-sky-500" />
                  <span>En Proceso</span>
                </div>
                <span class="text-[10px] text-zinc-400 leading-tight">
                  En curso o en ruta
                </span>
              </button>

              <!-- BLOQUEADO -->
              <button
                type="button"
                @click="formulario.estado = 'bloqueado'"
                :class="[
                  'p-2.5 rounded-xl border text-left transition flex flex-col gap-1',
                  formulario.estado === 'bloqueado'
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-300'
                    : 'bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
                ]"
              >
                <div class="flex items-center gap-1.5 font-semibold text-xs">
                  <AlertOctagon class="w-3.5 h-3.5 text-rose-500" />
                  <span>Bloqueado</span>
                </div>
                <span class="text-[10px] text-zinc-400 leading-tight">
                  Detenido o con impedimento
                </span>
              </button>
            </div>

            <p class="text-[11px] text-zinc-500 mt-2">
              <span class="text-zinc-600 dark:text-zinc-400 font-medium">Nota:</span> La etapa <strong>Completado</strong> siempre permanece al final como la meta del tablero. Las nuevas etapas se agregan automáticamente arriba de ella.
            </p>
          </div>
        </div>

        <!-- Color Identificador -->
        <div>
          <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Color Identificador de la Etapa
          </label>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="(opt, idx) in opcionesColor"
              :key="idx"
              type="button"
              @click="formulario.color = opt.color; formulario.bgBadge = opt.bgBadge"
              :class="[
                'p-2 rounded-lg border text-xs flex items-center gap-2 transition text-left',
                formulario.color === opt.color
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-zinc-800/80 text-indigo-900 dark:text-white ring-1 ring-indigo-500'
                  : 'border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-zinc-950/40 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-white/[0.12]'
              ]"
            >
              <span :class="['w-2.5 h-2.5 rounded-full shrink-0', opt.dotClass]"></span>
              <span class="truncate">{{ opt.nombre }}</span>
            </button>
          </div>
        </div>
      </FlickerlessSurface>

      <!-- Pie -->
      <div class="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-zinc-200 dark:border-white/[0.07] bg-zinc-50 dark:bg-zinc-950/60 text-xs">
        <button
          type="button"
          @click="emit('cerrar')"
          class="px-3.5 py-1.5 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium transition"
        >
          Cancelar
        </button>
        <button
          type="button"
          @click="guardar"
          :disabled="guardando || limiteAlcanzado()"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm transition active:scale-95 disabled:opacity-50"
        >
          <Loader2 v-if="guardando" class="w-3.5 h-3.5 animate-spin" />
          <span>{{ guardando ? 'Guardando...' : (columnaAEditar ? 'Guardar Cambios' : 'Crear Columna') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
