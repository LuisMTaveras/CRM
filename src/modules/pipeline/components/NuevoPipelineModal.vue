<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { 
  X, 
  Kanban, 
  MapPin, 
  Layers, 
  Plus, 
  Trash2, 
  Sparkles,
  CheckCircle2,
  Loader2 
} from 'lucide-vue-next';
import { FlickerlessSurface } from '@flickerless/vue';
import { pipelineService } from '../services/pipeline.service';
import type { TipoPipeline } from '../types/pipeline.types';
import { LIMITE_MAXIMO_COLUMNAS } from '../types/pipeline.types';
import { toastService } from '@/core/notifications/toast.service';

const props = defineProps<{
  abierto: boolean;
}>();

const emit = defineEmits<{
  (e: 'cerrar'): void;
  (e: 'creado', pipelineId: string): void;
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
  nombre: '',
  descripcion: '',
  tipo: 'visitas' as TipoPipeline,
  plantillaSeleccionada: 'visitas' as 'visitas' | 'ventas' | 'en_blanco',
  indiceCompletado: 3,
  columnas: [
    { titulo: 'Por Agendar', color: opcionesColor[3].color, bgBadge: opcionesColor[3].bgBadge },
    { titulo: 'Visita Programada', color: opcionesColor[1].color, bgBadge: opcionesColor[1].bgBadge },
    { titulo: 'En Visita / Ruta', color: opcionesColor[2].color, bgBadge: opcionesColor[2].bgBadge },
    { titulo: 'Visita Realizada', color: opcionesColor[0].color, bgBadge: opcionesColor[0].bgBadge },
  ],
});

const nuevaColumnaTitulo = ref('');
const nuevoColorIndex = ref(1);

const aplicarPlantilla = (tipo: 'visitas' | 'ventas' | 'en_blanco') => {
  formulario.plantillaSeleccionada = tipo;
  if (tipo === 'visitas') {
    formulario.tipo = 'visitas';
    if (!formulario.nombre || formulario.nombre === 'Pipeline Comercial B2B') {
      formulario.nombre = 'Clientes A Visitar';
    }
    formulario.descripcion = 'Planificación y control de visitas comerciales, auditorías y demostraciones en terreno.';
    formulario.columnas = [
      { titulo: 'Por Agendar', color: opcionesColor[3].color, bgBadge: opcionesColor[3].bgBadge },
      { titulo: 'Visita Programada', color: opcionesColor[1].color, bgBadge: opcionesColor[1].bgBadge },
      { titulo: 'En Visita / Ruta', color: opcionesColor[2].color, bgBadge: opcionesColor[2].bgBadge },
      { titulo: 'Visita Realizada', color: opcionesColor[0].color, bgBadge: opcionesColor[0].bgBadge },
    ];
    formulario.indiceCompletado = 3;
  } else if (tipo === 'ventas') {
    formulario.tipo = 'ventas';
    if (!formulario.nombre || formulario.nombre === 'Clientes A Visitar') {
      formulario.nombre = 'Embudo de Oportunidades';
    }
    formulario.descripcion = 'Seguimiento de propuestas, tratos y cierres de venta.';
    formulario.columnas = [
      { titulo: 'Calificación', color: opcionesColor[1].color, bgBadge: opcionesColor[1].bgBadge },
      { titulo: 'Propuesta Enviada', color: opcionesColor[2].color, bgBadge: opcionesColor[2].bgBadge },
      { titulo: 'En Negociación', color: opcionesColor[3].color, bgBadge: opcionesColor[3].bgBadge },
      { titulo: 'Cerrada Ganada', color: opcionesColor[0].color, bgBadge: opcionesColor[0].bgBadge },
    ];
    formulario.indiceCompletado = 3;
  } else {
    formulario.tipo = 'personalizado';
    formulario.columnas = [
      { titulo: 'Por Iniciar', color: opcionesColor[3].color, bgBadge: opcionesColor[3].bgBadge },
      { titulo: 'En Proceso', color: opcionesColor[1].color, bgBadge: opcionesColor[1].bgBadge },
      { titulo: 'Finalizado', color: opcionesColor[0].color, bgBadge: opcionesColor[0].bgBadge },
    ];
    formulario.indiceCompletado = 2;
  }
};

const agregarColumna = () => {
  if (formulario.columnas.length >= LIMITE_MAXIMO_COLUMNAS) {
    errorMensaje.value = `Se permite un máximo de ${LIMITE_MAXIMO_COLUMNAS} etapas para garantizar métricas claras de progreso.`;
    return;
  }
  if (!nuevaColumnaTitulo.value.trim()) return;
  const colOpt = opcionesColor[nuevoColorIndex.value % opcionesColor.length];
  formulario.columnas.push({
    titulo: nuevaColumnaTitulo.value.trim(),
    color: colOpt.color,
    bgBadge: colOpt.bgBadge,
  });
  nuevaColumnaTitulo.value = '';
  nuevoColorIndex.value = (nuevoColorIndex.value + 1) % opcionesColor.length;
};

const eliminarColumna = (indice: number) => {
  if (formulario.columnas.length <= 1) {
    errorMensaje.value = 'Debe mantener al menos una columna para el tablero.';
    return;
  }
  formulario.columnas.splice(indice, 1);
  if (formulario.indiceCompletado >= formulario.columnas.length) {
    formulario.indiceCompletado = formulario.columnas.length - 1;
  }
};

const guardar = async () => {
  if (!formulario.nombre.trim()) {
    errorMensaje.value = 'Debe indicar un nombre para el nuevo pipeline o tablero.';
    return;
  }
  if (formulario.columnas.length === 0) {
    errorMensaje.value = 'Debe agregar al menos una columna o etapa.';
    return;
  }

  errorMensaje.value = '';
  guardando.value = true;
  try {
    const columnasConCompletado = formulario.columnas.map((col, idx) => ({
      ...col,
      es_completado: idx === formulario.indiceCompletado,
    }));

    const nuevo = await pipelineService.crearPipeline({
      nombre: formulario.nombre.trim(),
      descripcion: formulario.descripcion.trim(),
      tipo: formulario.tipo,
      columnas: columnasConCompletado,
    });

    toastService.exito(`Tablero "${nuevo.nombre}" creado exitosamente.`);
    emit('creado', nuevo.id);
    emit('cerrar');
  } catch (err: unknown) {
    errorMensaje.value = err instanceof Error ? err.message : 'Error inesperado al crear el pipeline.';
  } finally {
    guardando.value = false;
  }
};

watch(() => props.abierto, (val) => {
  if (val) {
    aplicarPlantilla('visitas');
  }
});
</script>

<template>
  <div v-if="abierto" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
    <div
      class="bg-zinc-900 border border-white/[0.08] rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo-pipeline"
    >
      <!-- Cabecera -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] bg-zinc-950/60">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Layers class="w-4 h-4" />
          </div>
          <div>
            <h2 id="modal-titulo-pipeline" class="text-sm font-semibold text-white tracking-tight">
              Crear Nuevo Pipeline / Tablero Kanban
            </h2>
            <p class="text-xs text-zinc-400">
              Personaliza el flujo y define cuál etapa representa el 100% de avance
            </p>
          </div>
        </div>
        <button
          @click="emit('cerrar')"
          class="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
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
        stream-color="#10b981"
        class="p-6 overflow-y-auto space-y-5 text-xs flex-1"
      >
        <div v-if="errorMensaje" class="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          {{ errorMensaje }}
        </div>

        <!-- Plantillas Rápidas -->
        <div>
          <label class="block font-medium text-zinc-300 mb-2 flex items-center gap-1.5">
            <Sparkles class="w-3.5 h-3.5 text-emerald-400" />
            <span>Plantilla Sugerida</span>
          </label>
          <div class="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              @click="aplicarPlantilla('visitas')"
              :class="[
                'p-3 rounded-lg border text-left transition flex flex-col gap-1',
                formulario.plantillaSeleccionada === 'visitas'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              ]"
            >
              <div class="flex items-center gap-1.5 font-medium text-xs">
                <MapPin class="w-3.5 h-3.5 text-sky-400" />
                <span>Visitas en Terreno</span>
              </div>
              <span class="text-[11px] text-zinc-400">Para agendar y controlar visitas</span>
            </button>

            <button
              type="button"
              @click="aplicarPlantilla('ventas')"
              :class="[
                'p-3 rounded-lg border text-left transition flex flex-col gap-1',
                formulario.plantillaSeleccionada === 'ventas'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              ]"
            >
              <div class="flex items-center gap-1.5 font-medium text-xs">
                <Kanban class="w-3.5 h-3.5 text-emerald-400" />
                <span>Ventas Comerciales</span>
              </div>
              <span class="text-[11px] text-zinc-400">Embudo de propuestas y cierre</span>
            </button>

            <button
              type="button"
              @click="aplicarPlantilla('en_blanco')"
              :class="[
                'p-3 rounded-lg border text-left transition flex flex-col gap-1',
                formulario.plantillaSeleccionada === 'en_blanco'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              ]"
            >
              <div class="flex items-center gap-1.5 font-medium text-xs">
                <Layers class="w-3.5 h-3.5 text-amber-400" />
                <span>En Blanco</span>
              </div>
              <span class="text-[11px] text-zinc-400">Define etapas personalizadas</span>
            </button>
          </div>
        </div>

        <!-- Nombre del Pipeline -->
        <div>
          <label class="block font-medium text-zinc-300 mb-1.5">
            Nombre del Pipeline / Tablero <span class="text-rose-400">*</span>
          </label>
          <input
            v-model="formulario.nombre"
            type="text"
            placeholder="Ejemplo: Clientes A Visitar, Rutas de Demostración..."
            class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 text-xs focus:outline-none focus:border-emerald-500/50 transition"
          />
        </div>

        <!-- Descripción -->
        <div>
          <label class="block font-medium text-zinc-300 mb-1.5">
            Descripción u Objetivo <span class="text-zinc-500 font-normal">(Opcional)</span>
          </label>
          <input
            v-model="formulario.descripcion"
            type="text"
            placeholder="Breve propósito de este tablero para el equipo comercial"
            class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 text-xs focus:outline-none focus:border-emerald-500/50 transition"
          />
        </div>

        <!-- Columnas / Etapas Configuradas (Máx 6) -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="font-medium text-zinc-300">
              Etapas del Tablero ({{ formulario.columnas.length }}/{{ LIMITE_MAXIMO_COLUMNAS }})
            </label>
            <span class="text-[11px] text-zinc-400 flex items-center gap-1">
              <CheckCircle2 class="w-3 h-3 text-emerald-400" />
              <span>Selecciona la etapa de estado completado</span>
            </span>
          </div>

          <div class="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
            <div
              v-for="(col, idx) in formulario.columnas"
              :key="idx"
              :class="[
                'flex items-center gap-2 p-2.5 rounded-lg border transition',
                formulario.indiceCompletado === idx
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : 'bg-zinc-950/70 border-white/[0.06]'
              ]"
            >
              <!-- Selector de estado completado (radio único) -->
              <input
                type="radio"
                name="etapa_completada_radio"
                :checked="formulario.indiceCompletado === idx"
                @change="formulario.indiceCompletado = idx"
                title="Marcar como etapa completada (100% de avance)"
                class="text-emerald-500 focus:ring-0 focus:outline-none bg-zinc-900 border-zinc-700 cursor-pointer"
              />

              <span class="w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center font-mono text-[10px] shrink-0">
                {{ idx + 1 }}
              </span>

              <input
                v-model="col.titulo"
                type="text"
                class="flex-1 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-200 text-xs focus:outline-none focus:border-emerald-500/40"
              />

              <!-- Selector de Color para la Columna -->
              <div class="flex items-center gap-1 shrink-0">
                <button
                  v-for="(opt, optIdx) in opcionesColor"
                  :key="optIdx"
                  type="button"
                  @click="col.color = opt.color; col.bgBadge = opt.bgBadge"
                  :title="opt.nombre"
                  :class="[
                    'w-4 h-4 rounded-full transition-transform',
                    opt.dotClass,
                    col.color === opt.color ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                  ]"
                ></button>
              </div>

              <button
                type="button"
                @click="eliminarColumna(idx)"
                :disabled="formulario.columnas.length <= 1"
                class="text-zinc-500 hover:text-rose-400 p-1 rounded hover:bg-zinc-800 transition disabled:opacity-30 disabled:pointer-events-none"
                title="Eliminar columna"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Agregar otra columna rápidamente hasta el límite -->
          <div v-if="formulario.columnas.length < LIMITE_MAXIMO_COLUMNAS" class="flex items-center gap-2">
            <input
              v-model="nuevaColumnaTitulo"
              @keydown.enter.prevent="agregarColumna"
              type="text"
              placeholder="+ Nombre de otra columna..."
              class="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 text-xs focus:outline-none focus:border-emerald-500/40"
            />
            <button
              type="button"
              @click="agregarColumna"
              class="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium flex items-center gap-1 transition"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Añadir</span>
            </button>
          </div>
          <div v-else class="text-[11px] text-zinc-500 italic">
            Límite de {{ LIMITE_MAXIMO_COLUMNAS }} etapas alcanzado.
          </div>
        </div>
      </FlickerlessSurface>

      <!-- Pie del Modal -->
      <div class="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-white/[0.07] bg-zinc-950/60">
        <button
          type="button"
          @click="emit('cerrar')"
          class="px-4 py-2 rounded-lg border border-white/[0.08] bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition"
        >
          Cancelar
        </button>

        <button
          type="button"
          @click="guardar"
          :disabled="guardando"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm transition active:scale-95 disabled:opacity-50"
        >
          <Loader2 v-if="guardando" class="w-3.5 h-3.5 animate-spin" />
          <span>{{ guardando ? 'Creando Tablero...' : 'Crear Tablero' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
