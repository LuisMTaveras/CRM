<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { X, Kanban, DollarSign, Calendar, Sparkles, Building2, Layers } from 'lucide-vue-next';
import { pipelineService } from '@/modules/pipeline/services/pipeline.service';
import type { Pipeline, ColumnaPipeline } from '@/modules/pipeline/types/pipeline.types';
import type { Cliente } from '@/modules/clientes/types/cliente.types';
import type { MensajeCorreo } from '../types/webmail.types';
import { toastService } from '@/core/notifications/toast.service';
import AppSelect, { type SelectOption } from '@/shared/components/AppSelect.vue';
import { getCurrencySymbol } from '@/core/formatters/formatters';

const props = defineProps<{
  abierto: boolean;
  mensaje: MensajeCorreo | null;
  cliente: Cliente | null;
  todosLosClientes: Cliente[];
}>();

const emit = defineEmits<{
  (e: 'cerrar'): void;
  (e: 'creado', tarjetaId: string): void;
}>();

const pipelines = ref<Pipeline[]>([]);
const pipelineSeleccionadoId = ref<string>('');
const columnaSeleccionadaId = ref<string>('');
const clienteSeleccionadoId = ref<string>('');
const titulo = ref('');
const monto = ref<number | undefined>(undefined);
const fechaObjetivo = ref('');
const prioridad = ref<'alta' | 'media' | 'baja'>('media');
const notas = ref('');
const guardando = ref(false);

const columnasDisponibles = computed<ColumnaPipeline[]>(() => {
  const p = pipelines.value.find((item) => item.id === pipelineSeleccionadoId.value);
  return p?.columnas || [];
});

const opcionesPipelines = computed<SelectOption<string>[]>(() => {
  return pipelines.value.map((p) => ({
    value: p.id,
    label: `${p.nombre} (${p.tipo === 'ventas' ? 'Ventas' : 'Procesos'})`,
  }));
});

const opcionesColumnas = computed<SelectOption<string>[]>(() => {
  return columnasDisponibles.value.map((c) => ({
    value: c.id,
    label: c.titulo,
  }));
});

const opcionesClientes = computed<SelectOption<string>[]>(() => {
  return props.todosLosClientes.map((c) => ({
    value: c.id,
    label: `${c.nombre_comercial || c.razon_social} · ${c.sector || 'B2B'}`,
  }));
});

const opcionesPrioridad: SelectOption<'alta' | 'media' | 'baja'>[] = [
  { value: 'alta', label: 'Alta Prioridad' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
];

const inicializar = async () => {
  try {
    pipelines.value = await pipelineService.obtenerPipelines();
    const defaultPipeline = pipelines.value.find((p) => p.es_predeterminado) || pipelines.value[0];
    if (defaultPipeline) {
      pipelineSeleccionadoId.value = defaultPipeline.id;
      const primeraCol = defaultPipeline.columnas[0];
      columnaSeleccionadaId.value = primeraCol?.id || '';
    }
  } catch (err) {
    console.error('Error al cargar pipelines:', err);
  }

  if (props.cliente) {
    clienteSeleccionadoId.value = props.cliente.id;
  } else if (props.todosLosClientes.length > 0) {
    clienteSeleccionadoId.value = props.todosLosClientes[0].id;
  }

  if (props.mensaje) {
    titulo.value = props.mensaje.asunto || 'Oportunidad comercial desde correo';
    notas.value = `Origen: Correo recibido de ${props.mensaje.de.nombre || props.mensaje.de.correo} el ${props.mensaje.fecha}.\n\nExtracto:\n${props.mensaje.extracto || ''}`;
  }

  // Fecha estimada a 15 días
  const d = new Date();
  d.setDate(d.getDate() + 15);
  fechaObjetivo.value = d.toISOString().split('T')[0];
};

watch(
  () => props.abierto,
  (val) => {
    if (val) inicializar();
  }
);

watch(pipelineSeleccionadoId, (nuevoId) => {
  const p = pipelines.value.find((item) => item.id === nuevoId);
  if (p && p.columnas.length > 0) {
    columnaSeleccionadaId.value = p.columnas[0].id;
  }
});

const guardarOportunidad = async () => {
  if (!titulo.value.trim()) {
    toastService.advertencia('Ingresa el título de la oportunidad.');
    return;
  }
  if (!clienteSeleccionadoId.value) {
    toastService.advertencia('Selecciona el cliente del CRM asociado.');
    return;
  }
  if (!pipelineSeleccionadoId.value || !columnaSeleccionadaId.value) {
    toastService.advertencia('Selecciona el pipeline y la etapa inicial.');
    return;
  }

  guardando.value = true;
  try {
    const tarjeta = await pipelineService.crearTarjeta({
      pipeline_id: pipelineSeleccionadoId.value,
      columna_id: columnaSeleccionadaId.value,
      cliente_id: clienteSeleccionadoId.value,
      titulo: titulo.value.trim(),
      monto: monto.value && monto.value > 0 ? Number(monto.value) : undefined,
      fecha_objetivo: fechaObjetivo.value || new Date().toISOString().split('T')[0],
      prioridad: prioridad.value,
      notas: notas.value.trim(),
    });

    toastService.exito(`¡Oportunidad "${tarjeta.titulo}" agregada con éxito al Pipeline!`);
    emit('creado', tarjeta.id);
    emit('cerrar');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al crear la oportunidad';
    toastService.error(msg);
  } finally {
    guardando.value = false;
  }
};
</script>

<template>
  <div
    v-if="abierto"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm"
  >
    <div
      class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-zinc-900 dark:text-zinc-100"
    >
      <!-- Cabecera -->
      <div class="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/50">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Kanban class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Convertir en Oportunidad de Venta
            </h3>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
              Crea una tarjeta en el Pipeline Kanban vinculada a este correo.
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="emit('cerrar')"
          class="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Formulario -->
      <div class="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
        <!-- Título -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Título de la oportunidad:
          </label>
          <input
            type="text"
            v-model="titulo"
            placeholder="ej. Suministro Equipamiento Tiendas Q4"
            class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 font-medium"
          />
        </div>

        <!-- Cliente Asociado -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Building2 class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Cliente del CRM:</span>
          </label>
          <AppSelect
            v-model="clienteSeleccionadoId"
            :options="opcionesClientes"
            full-width
            size="md"
          />
        </div>

        <!-- Pipeline y Etapa -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Layers class="w-3.5 h-3.5 text-indigo-500" />
              <span>Pipeline:</span>
            </label>
            <AppSelect
              v-model="pipelineSeleccionadoId"
              :options="opcionesPipelines"
              full-width
              size="md"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Etapa inicial:
            </label>
            <AppSelect
              v-model="columnaSeleccionadaId"
              :options="opcionesColumnas"
              full-width
              size="md"
            />
          </div>
        </div>

        <!-- Monto Proyectado y Fecha Objetivo -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <DollarSign class="w-3.5 h-3.5 text-emerald-500" />
              <span>Valor estimado ({{ getCurrencySymbol() }}):</span>
            </label>
            <input
              type="number"
              v-model.number="monto"
              placeholder="0.00"
              min="0"
              step="500"
              class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Calendar class="w-3.5 h-3.5 text-sky-500" />
              <span>Fecha de cierre estimada:</span>
            </label>
            <input
              type="date"
              v-model="fechaObjetivo"
              class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>

        <!-- Prioridad -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Nivel de Prioridad:
          </label>
          <AppSelect
            v-model="prioridad"
            :options="opcionesPrioridad"
            full-width
            size="md"
          />
        </div>

        <!-- Notas / Contexto -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Notas de contexto:
          </label>
          <textarea
            v-model="notas"
            rows="3"
            class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
          ></textarea>
        </div>
      </div>

      <!-- Pie -->
      <div class="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-end gap-2.5">
        <button
          type="button"
          @click="emit('cerrar')"
          class="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          Cancelar
        </button>
        <button
          type="button"
          @click="guardarOportunidad"
          :disabled="guardando"
          class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-emerald-950/20 flex items-center gap-2 disabled:opacity-50"
        >
          <Sparkles class="w-3.5 h-3.5" />
          <span>{{ guardando ? 'Guardando...' : 'Crear en Pipeline' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
