<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { pipelineService } from '../services/pipeline.service';
import type { EtapaOportunidad } from '../types/pipeline.types';
import { toastService } from '@/core/notifications/toast.service';
import { X, Briefcase, Plus, Loader2 } from 'lucide-vue-next';

const props = defineProps<{
  abierto: boolean;
  clienteIdFijo?: string;
  etapaInicial?: EtapaOportunidad;
}>();

const emit = defineEmits<{
  (e: 'cerrar'): void;
  (e: 'creada'): void;
}>();

const clientesDisponibles = ref<Array<{ id: string; razon_social: string; nombre_comercial?: string }>>([]);
const cargandoClientes = ref(false);
const guardando = ref(false);
const errorMensaje = ref('');

const formulario = reactive({
  cliente_id: props.clienteIdFijo || '',
  titulo: '',
  monto: 150000,
  etapa: (props.etapaInicial || 'calificacion') as EtapaOportunidad,
  probabilidad: 40,
  fecha_cierre_estimada: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
});

const cargarClientes = async () => {
  if (props.clienteIdFijo) {
    formulario.cliente_id = props.clienteIdFijo;
    return;
  }
  cargandoClientes.value = true;
  try {
    clientesDisponibles.value = await pipelineService.obtenerClientesParaSelector();
    if (clientesDisponibles.value.length > 0 && !formulario.cliente_id) {
      formulario.cliente_id = clientesDisponibles.value[0].id;
    }
  } catch (err) {
    console.error('Error cargando lista de clientes para selector:', err);
  } finally {
    cargandoClientes.value = false;
  }
};

const ajustarProbabilidad = () => {
  switch (formulario.etapa) {
    case 'calificacion':
      formulario.probabilidad = 40;
      break;
    case 'propuesta':
      formulario.probabilidad = 65;
      break;
    case 'negociacion':
      formulario.probabilidad = 80;
      break;
    case 'ganada':
      formulario.probabilidad = 100;
      break;
    case 'perdida':
      formulario.probabilidad = 0;
      break;
  }
};

const guardarOportunidad = async () => {
  if (!formulario.cliente_id) {
    errorMensaje.value = 'Debe seleccionar una cuenta o empresa cliente.';
    return;
  }
  if (!formulario.titulo.trim()) {
    errorMensaje.value = 'El título de la oportunidad es obligatorio.';
    return;
  }
  if (formulario.monto <= 0) {
    errorMensaje.value = 'El monto del deal debe ser mayor a cero.';
    return;
  }

  errorMensaje.value = '';
  guardando.value = true;
  try {
    await pipelineService.crearOportunidad({
      cliente_id: formulario.cliente_id,
      titulo: formulario.titulo.trim(),
      monto: Number(formulario.monto),
      etapa: formulario.etapa,
      probabilidad: Number(formulario.probabilidad),
      fecha_cierre_estimada: formulario.fecha_cierre_estimada,
    });

    toastService.exito(`Oportunidad "${formulario.titulo}" registrada exitosamente en el Pipeline.`);
    emit('creada');
    emit('cerrar');
  } catch (err: unknown) {
    errorMensaje.value = err instanceof Error ? err.message : 'Error al registrar la oportunidad.';
  } finally {
    guardando.value = false;
  }
};

onMounted(() => {
  cargarClientes();
});
</script>

<template>
  <div v-if="abierto" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop oscuro -->
    <div
      class="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      @click="emit('cerrar')"
    ></div>

    <!-- Modal Card -->
    <div
      class="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col"
    >
      <!-- Cabecera -->
      <div class="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Briefcase class="w-4 h-4" />
          </div>
          <div>
            <h2 class="text-sm font-bold text-zinc-100">Nueva Oportunidad Comercial (Deal)</h2>
            <p class="text-[11px] text-zinc-400">Vincular una negociación a la cartera de clientes</p>
          </div>
        </div>

        <button
          type="button"
          @click="emit('cerrar')"
          class="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg transition"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="guardarOportunidad" class="p-5 space-y-4 text-xs">
        <div
          v-if="errorMensaje"
          class="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs"
        >
          {{ errorMensaje }}
        </div>

        <!-- Selector de Cliente (si no está fijo) -->
        <div v-if="!props.clienteIdFijo">
          <label class="block text-zinc-400 font-medium mb-1">
            Empresa / Cuenta Cliente <span class="text-rose-400">*</span>
          </label>
          <select
            v-model="formulario.cliente_id"
            required
            :disabled="cargandoClientes"
            class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-700 transition"
          >
            <option value="" disabled>Seleccione una empresa de la cartera</option>
            <option
              v-for="c in clientesDisponibles"
              :key="c.id"
              :value="c.id"
            >
              {{ c.nombre_comercial || c.razon_social }}
            </option>
          </select>
        </div>

        <!-- Título del Deal -->
        <div>
          <label class="block text-zinc-400 font-medium mb-1">
            Nombre / Título de la Oportunidad <span class="text-rose-400">*</span>
          </label>
          <input
            v-model="formulario.titulo"
            type="text"
            required
            placeholder="Ej: Contrato Marco de Suministro B2B 2026"
            class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-700 transition"
          />
        </div>

        <!-- Monto Estimado y Etapa -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label class="block text-zinc-400 font-medium mb-1">
              Valor / Monto Estimado (RD$) <span class="text-rose-400">*</span>
            </label>
            <input
              v-model.number="formulario.monto"
              type="number"
              min="1"
              required
              class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 font-mono focus:outline-none focus:border-zinc-700 transition"
            />
          </div>

          <div>
            <label class="block text-zinc-400 font-medium mb-1">
              Etapa Inicial <span class="text-rose-400">*</span>
            </label>
            <select
              v-model="formulario.etapa"
              @change="ajustarProbabilidad"
              class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-700 transition capitalize"
            >
              <option value="calificacion">Calificación</option>
              <option value="propuesta">Propuesta Enviada</option>
              <option value="negociacion">En Negociación</option>
              <option value="ganada">Cerrada Ganada</option>
              <option value="perdida">Cerrada Perdida</option>
            </select>
          </div>
        </div>

        <!-- Probabilidad y Fecha Cierre -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="text-zinc-400 font-medium">Probabilidad de Cierre</label>
              <span class="font-mono text-emerald-400 font-semibold">{{ formulario.probabilidad }}%</span>
            </div>
            <input
              v-model.number="formulario.probabilidad"
              type="range"
              min="0"
              max="100"
              step="5"
              class="w-full accent-emerald-500 bg-zinc-950 cursor-pointer"
            />
          </div>

          <div>
            <label class="block text-zinc-400 font-medium mb-1">
              Fecha Estimada de Cierre <span class="text-rose-400">*</span>
            </label>
            <input
              v-model="formulario.fecha_cierre_estimada"
              type="date"
              required
              class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 font-mono focus:outline-none focus:border-zinc-700 transition"
            />
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-800">
          <button
            type="button"
            @click="emit('cerrar')"
            class="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="guardando"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm transition disabled:opacity-50"
          >
            <Loader2 v-if="guardando" class="w-4 h-4 animate-spin" />
            <Plus v-else class="w-4 h-4" />
            <span>{{ guardando ? 'Registrando...' : 'Registrar Oportunidad' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
