<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { 
  X, 
  Building2, 
  Plus, 
  Calendar, 
  DollarSign, 
  FileText, 
  Loader2,
  Users,
  User,
  Search,
  Check
} from 'lucide-vue-next';
import { FlickerlessSurface } from '@flickerless/vue';
import { pipelineService } from '../services/pipeline.service';
import type { Pipeline } from '../types/pipeline.types';
import { toastService } from '@/core/notifications/toast.service';
import AppSelect, { type SelectOption } from '@/shared/components/AppSelect.vue';

const props = defineProps<{
  abierto: boolean;
  pipeline: Pipeline;
  columnaInicialId?: string;
}>();

const emit = defineEmits<{
  (e: 'cerrar'): void;
  (e: 'creada'): void;
}>();

const clientesDisponibles = ref<Array<{ id: string; razon_social: string; nombre_comercial?: string }>>([]);
const cargandoClientes = ref(false);
const guardando = ref(false);
const errorMensaje = ref('');

// Modo de selección: individual o múltiple
const modoMultiplesClientes = ref(true);
const busquedaCliente = ref('');
const clientesSeleccionadosIds = ref<string[]>([]);

const esPipelineVisitas = computed(() => props.pipeline.tipo === 'visitas');

const formulario = reactive({
  cliente_id_individual: '',
  titulo: '',
  columna_id: props.columnaInicialId || (props.pipeline.columnas[0]?.id ?? ''),
  prioridad: 'media' as 'alta' | 'media' | 'baja',
  fecha_objetivo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  monto: esPipelineVisitas.value ? 0 : 250000,
  probabilidad: 50,
  notas: '',
});

const opcionesColumnas = computed<Array<SelectOption<string>>>(() => {
  if (!props.pipeline?.columnas) return [];
  return props.pipeline.columnas.map((col) => ({
    value: col.id,
    label: col.titulo,
    dotColor:
      col.estado === 'completado'
        ? 'bg-emerald-400'
        : col.estado === 'bloqueado'
        ? 'bg-rose-400'
        : col.estado === 'en_proceso'
        ? 'bg-sky-400'
        : 'bg-amber-400',
    colorClass:
      col.estado === 'completado'
        ? 'text-emerald-300 font-semibold'
        : col.estado === 'bloqueado'
        ? 'text-rose-300 font-medium'
        : col.estado === 'en_proceso'
        ? 'text-sky-300 font-medium'
        : 'text-amber-300 font-medium',
  }));
});

const opcionesPrioridad: Array<SelectOption<'alta' | 'media' | 'baja'>> = [
  { value: 'alta', label: 'Prioridad Alta', dotColor: 'bg-rose-400', colorClass: 'text-rose-300 font-medium' },
  { value: 'media', label: 'Prioridad Media', dotColor: 'bg-amber-400', colorClass: 'text-amber-300 font-medium' },
  { value: 'baja', label: 'Prioridad Baja', dotColor: 'bg-sky-400', colorClass: 'text-sky-300 font-medium' },
];

const clientesFiltrados = computed(() => {
  if (!busquedaCliente.value.trim()) return clientesDisponibles.value;
  const q = busquedaCliente.value.toLowerCase().trim();
  return clientesDisponibles.value.filter(
    (c) =>
      c.razon_social.toLowerCase().includes(q) ||
      (c.nombre_comercial && c.nombre_comercial.toLowerCase().includes(q))
  );
});

const alternarSeleccionCliente = (id: string) => {
  const idx = clientesSeleccionadosIds.value.indexOf(id);
  if (idx > -1) {
    clientesSeleccionadosIds.value.splice(idx, 1);
  } else {
    clientesSeleccionadosIds.value.push(id);
  }
};

const estaSeleccionado = (id: string) => {
  return clientesSeleccionadosIds.value.includes(id);
};

const seleccionarTodosVisibles = () => {
  const visiblesIds = clientesFiltrados.value.map((c) => c.id);
  const nuevoSet = new Set([...clientesSeleccionadosIds.value, ...visiblesIds]);
  clientesSeleccionadosIds.value = Array.from(nuevoSet);
};

const desmarcarTodos = () => {
  clientesSeleccionadosIds.value = [];
};

const cargarClientes = async () => {
  cargandoClientes.value = true;
  try {
    clientesDisponibles.value = await pipelineService.obtenerClientesParaSelector();
    if (clientesDisponibles.value.length > 0) {
      formulario.cliente_id_individual = clientesDisponibles.value[0].id;
    }
  } catch (err) {
    console.error('Error cargando clientes:', err);
  } finally {
    cargandoClientes.value = false;
  }
};

watch(
  () => props.columnaInicialId,
  (val) => {
    if (val) formulario.columna_id = val;
  }
);

watch(
  () => props.pipeline,
  (pipe) => {
    if (pipe?.columnas?.length > 0 && !pipe.columnas.some((c) => c.id === formulario.columna_id)) {
      formulario.columna_id = pipe.columnas[0].id;
    }
  }
);

const guardar = async () => {
  if (modoMultiplesClientes.value) {
    if (clientesSeleccionadosIds.value.length === 0) {
      errorMensaje.value = 'Debe seleccionar al menos un cliente de la lista.';
      return;
    }
  } else {
    if (!formulario.cliente_id_individual) {
      errorMensaje.value = 'Debe seleccionar un cliente de la lista.';
      return;
    }
  }

  if (!formulario.columna_id) {
    errorMensaje.value = 'Debe seleccionar una columna o etapa.';
    return;
  }

  errorMensaje.value = '';
  guardando.value = true;
  try {
    if (modoMultiplesClientes.value) {
      // Creación en lote de múltiples clientes
      await pipelineService.crearMultiplesTarjetas({
        pipeline_id: props.pipeline.id,
        columna_id: formulario.columna_id,
        cliente_ids: clientesSeleccionadosIds.value,
        titulo: formulario.titulo.trim() || undefined,
        monto: Number(formulario.monto) || 0,
        fecha_objetivo: formulario.fecha_objetivo,
        probabilidad: Number(formulario.probabilidad) || 50,
        prioridad: formulario.prioridad,
        notas: formulario.notas.trim() || undefined,
      });

      toastService.exito(
        `Se han programado ${clientesSeleccionadosIds.value.length} tarjetas en "${props.pipeline.nombre}".`
      );
    } else {
      // Creación individual
      await pipelineService.crearTarjeta({
        pipeline_id: props.pipeline.id,
        columna_id: formulario.columna_id,
        cliente_id: formulario.cliente_id_individual,
        titulo: formulario.titulo.trim() || (esPipelineVisitas.value ? 'Visita comercial a cliente' : 'Oportunidad de negocio'),
        monto: Number(formulario.monto) || 0,
        fecha_objetivo: formulario.fecha_objetivo,
        probabilidad: Number(formulario.probabilidad) || 50,
        prioridad: formulario.prioridad,
        notas: formulario.notas.trim(),
      });

      toastService.exito('Tarjeta creada exitosamente.');
    }

    emit('creada');
    emit('cerrar');
  } catch (err: unknown) {
    errorMensaje.value = err instanceof Error ? err.message : 'Error al guardar tarjetas.';
  } finally {
    guardando.value = false;
  }
};

onMounted(() => {
  cargarClientes();
});
</script>

<template>
  <div v-if="abierto" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
    <div
      class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo-tarjeta"
    >
      <!-- Cabecera -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-white/[0.07] bg-zinc-50 dark:bg-zinc-950/60">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Plus class="w-4 h-4" />
          </div>
          <div>
            <h2 id="modal-titulo-tarjeta" class="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
              {{ pipeline.tipo === 'visitas' ? 'Programar Visitas a Clientes' : 'Crear Tarjetas en ' + pipeline.nombre }}
            </h2>
            <p class="text-xs text-zinc-500 dark:text-zinc-400">
              Tablero activo: {{ pipeline.nombre }}
            </p>
          </div>
        </div>
        <button
          @click="emit('cerrar')"
          class="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          aria-label="Cerrar modal"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- FlickerlessSurface que protege el formulario contra parpadeos -->
      <FlickerlessSurface
        :loading="cargandoClientes"
        :delay-ms="120"
        :preserve-height="true"
        stream-color="#4f46e5"
        announce-text="Cargando catálogo de clientes..."
        class="overflow-y-auto flex-1 p-6 space-y-4 text-xs bg-white dark:bg-zinc-900"
      >
        <div v-if="errorMensaje" class="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs">
          {{ errorMensaje }}
        </div>

        <!-- Selector de Modo: Múltiples Clientes vs Individual -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Building2 class="w-3.5 h-3.5 text-zinc-400" />
              <span>Modalidad de Selección de Clientes</span>
            </label>
            <div class="inline-flex p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[11px]">
              <button
                type="button"
                @click="modoMultiplesClientes = true"
                :class="[
                  'px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1',
                  modoMultiplesClientes
                    ? 'bg-white dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-zinc-200 dark:border-indigo-500/20 shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                ]"
              >
                <Users class="w-3 h-3" />
                <span>Múltiples Clientes</span>
              </button>
              <button
                type="button"
                @click="modoMultiplesClientes = false"
                :class="[
                  'px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1',
                  !modoMultiplesClientes
                    ? 'bg-white dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-zinc-200 dark:border-indigo-500/20 shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                ]"
              >
                <User class="w-3 h-3" />
                <span>Cliente Individual</span>
              </button>
            </div>
          </div>

          <!-- MODO MÚLTIPLES CLIENTES -->
          <div v-if="modoMultiplesClientes" class="space-y-2 bg-zinc-50 dark:bg-zinc-950/60 p-3 rounded-xl border border-zinc-200 dark:border-white/[0.06]">
            <div class="flex items-center justify-between gap-2">
              <div class="relative flex-1">
                <Search class="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3 top-2.5" />
                <input
                  v-model="busquedaCliente"
                  type="text"
                  placeholder="Filtrar clientes por razón social o nombre..."
                  class="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div class="flex items-center gap-1.5 shrink-0 text-[11px]">
                <button
                  type="button"
                  @click="seleccionarTodosVisibles"
                  class="px-2 py-1 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded transition"
                >
                  Marcar todos
                </button>
                <button
                  type="button"
                  @click="desmarcarTodos"
                  class="px-2 py-1 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition"
                >
                  Limpiar
                </button>
              </div>
            </div>

            <!-- Contador de Selección -->
            <div class="flex items-center justify-between text-[11px] px-1 text-zinc-500 dark:text-zinc-400">
              <span>Seleccionados para programar:</span>
              <span class="font-semibold text-indigo-600 dark:text-indigo-400">
                {{ clientesSeleccionadosIds.length }} {{ clientesSeleccionadosIds.length === 1 ? 'cliente' : 'clientes' }}
              </span>
            </div>

            <!-- Lista de Selección con Checkbox -->
            <div class="max-h-40 overflow-y-auto space-y-1 pr-1 border border-zinc-200 dark:border-white/[0.04] rounded-lg p-1 bg-white dark:bg-zinc-900/50">
              <div
                v-for="cli in clientesFiltrados"
                :key="cli.id"
                @click="alternarSeleccionCliente(cli.id)"
                :class="[
                  'px-2.5 py-1.5 rounded-md flex items-center justify-between cursor-pointer transition select-none text-xs',
                  estaSeleccionado(cli.id)
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border border-transparent'
                ]"
              >
                <div class="truncate pr-2">
                  <span class="font-medium">{{ cli.nombre_comercial || cli.razon_social }}</span>
                  <span v-if="cli.nombre_comercial" class="text-[10px] text-zinc-400 dark:text-zinc-500 ml-1.5 font-normal">
                    ({{ cli.razon_social }})
                  </span>
                </div>
                <div
                  :class="[
                    'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition',
                    estaSeleccionado(cli.id)
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950'
                  ]"
                >
                  <Check v-if="estaSeleccionado(cli.id)" class="w-3 h-3 stroke-[3]" />
                </div>
              </div>

              <div v-if="clientesFiltrados.length === 0" class="text-center py-4 text-zinc-400 dark:text-zinc-500 text-xs">
                No se encontraron clientes con ese nombre
              </div>
            </div>
          </div>

          <!-- MODO CLIENTE INDIVIDUAL -->
          <div v-else class="space-y-1">
            <select
              v-model="formulario.cliente_id_individual"
              class="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-200 text-xs focus:outline-none focus:border-indigo-500/50 transition"
            >
              <option value="" disabled>Seleccione un cliente...</option>
              <option
                v-for="cli in clientesDisponibles"
                :key="cli.id"
                :value="cli.id"
              >
                {{ cli.nombre_comercial ? `${cli.nombre_comercial} (${cli.razon_social})` : cli.razon_social }}
              </option>
            </select>
          </div>
        </div>

        <!-- Asunto / Título -->
        <div>
          <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            {{ pipeline.tipo === 'visitas' ? 'Motivo o Asunto General de la Visita' : 'Título de la Tarjeta / Oportunidad' }}
            <span v-if="modoMultiplesClientes" class="text-zinc-400 dark:text-zinc-500 font-normal">(Opcional: se nombrará con el cliente si se deja vacío)</span>
            <span v-else class="text-rose-500">*</span>
          </label>
          <input
            v-model="formulario.titulo"
            type="text"
            :placeholder="pipeline.tipo === 'visitas' ? 'Ej: Visita de prospección técnica y diagnóstico' : 'Ej: Propuesta de renovación anual'"
            class="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500/50 transition"
          />
        </div>

        <!-- Columna Inicial y Prioridad con AppSelect idéntico a la referencia -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Columna / Estado Inicial <span class="text-rose-500">*</span>
            </label>
            <AppSelect
              :model-value="formulario.columna_id"
              @update:model-value="(nuevo) => formulario.columna_id = nuevo as string"
              :options="opcionesColumnas"
              trigger-class="w-full justify-between"
              min-width-class="w-full"
            />
          </div>

          <div>
            <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Prioridad
            </label>
            <AppSelect
              :model-value="formulario.prioridad"
              @update:model-value="(nuevo) => formulario.prioridad = nuevo as 'alta' | 'media' | 'baja'"
              :options="opcionesPrioridad"
              trigger-class="w-full justify-between"
              min-width-class="w-full"
            />
          </div>
        </div>

        <!-- Fecha Objetivo y Monto -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Calendar class="w-3.5 h-3.5 text-zinc-400" />
              <span>{{ pipeline.tipo === 'visitas' ? 'Fecha Programada' : 'Fecha Estimada Cierre' }}</span>
            </label>
            <input
              v-model="formulario.fecha_objetivo"
              type="date"
              class="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-200 text-xs focus:outline-none focus:border-indigo-500/50 transition"
            />
          </div>

          <div>
            <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <DollarSign class="w-3.5 h-3.5 text-zinc-400" />
              <span>{{ pipeline.tipo === 'visitas' ? 'Presupuesto / Valor Proyectado ($)' : 'Monto del Trato ($)' }}</span>
            </label>
            <input
              v-model.number="formulario.monto"
              type="number"
              min="0"
              step="5000"
              class="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-200 text-xs focus:outline-none focus:border-indigo-500/50 transition font-mono"
            />
          </div>
        </div>

        <!-- Notas / Observaciones -->
        <div>
          <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <FileText class="w-3.5 h-3.5 text-zinc-400" />
            <span>{{ pipeline.tipo === 'visitas' ? 'Dirección / Objetivos / Instrucciones de Ruta' : 'Notas y Observaciones' }}</span>
          </label>
          <textarea
            v-model="formulario.notas"
            rows="2"
            :placeholder="pipeline.tipo === 'visitas' ? 'Indica dirección, persona de contacto en sede, objetivos a revisar...' : 'Detalles clave de la oportunidad comercial...'"
            class="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500/50 transition resize-none"
          ></textarea>
        </div>
      </FlickerlessSurface>

      <!-- Pie del Modal -->
      <div class="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-white/[0.07] bg-zinc-50 dark:bg-zinc-950/60">
        <div class="text-zinc-500 text-[11px]">
          <span v-if="modoMultiplesClientes">
            Creará {{ clientesSeleccionadosIds.length }} {{ clientesSeleccionadosIds.length === 1 ? 'tarjeta' : 'tarjetas' }}
          </span>
          <span v-else>
            Creará 1 tarjeta
          </span>
        </div>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            @click="emit('cerrar')"
            class="px-4 py-2 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            @click="guardar"
            :disabled="guardando || (modoMultiplesClientes && clientesSeleccionadosIds.length === 0)"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition active:scale-95 disabled:opacity-50"
          >
            <Loader2 v-if="guardando" class="w-3.5 h-3.5 animate-spin" />
            <span>
              {{
                guardando
                  ? 'Guardando...'
                  : modoMultiplesClientes
                  ? `Crear ${clientesSeleccionadosIds.length} ${clientesSeleccionadosIds.length === 1 ? 'Tarjeta' : 'Tarjetas'}`
                  : 'Crear Tarjeta'
              }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
