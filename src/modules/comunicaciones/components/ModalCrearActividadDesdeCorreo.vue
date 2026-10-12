<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { X, CalendarClock, Clock, Sparkles, Building2 } from 'lucide-vue-next';
import { actividadesService } from '@/modules/agenda/services/actividades.service';
import type { TipoActividad, PrioridadActividad, ActividadSeguimiento } from '@/modules/agenda/types/actividad.types';
import type { Cliente } from '@/modules/clientes/types/cliente.types';
import type { MensajeCorreo } from '../types/webmail.types';
import { toastService } from '@/core/notifications/toast.service';
import AppSelect, { type SelectOption } from '@/shared/components/AppSelect.vue';

const props = defineProps<{
  abierto: boolean;
  mensaje: MensajeCorreo | null;
  cliente: Cliente | null;
  todosLosClientes: Cliente[];
}>();

const emit = defineEmits<{
  (e: 'cerrar'): void;
  (e: 'creado', actividad: ActividadSeguimiento): void;
}>();

const clienteSeleccionadoId = ref<string>('');
const titulo = ref('');
const tipo = ref<TipoActividad>('llamada');
const prioridad = ref<PrioridadActividad>('alta');
const fecha = ref('');
const hora = ref('10:00');
const responsable = ref('Jean Carlos Peña');
const descripcion = ref('');
const guardando = ref(false);

const opcionesTipo: SelectOption<TipoActividad>[] = [
  { value: 'llamada', label: 'Llamada telefónica' },
  { value: 'reunion', label: 'Reunión presencial' },
  { value: 'videollamada', label: 'Videollamada (Meet / Zoom)' },
  { value: 'correo', label: 'Envío de correo' },
  { value: 'tarea', label: 'Tarea general' },
];

const opcionesPrioridad: SelectOption<PrioridadActividad>[] = [
  { value: 'alta', label: 'Alta Prioridad' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
];

const opcionesClientes = computed<SelectOption<string>[]>(() => {
  return props.todosLosClientes.map((c) => ({
    value: c.id,
    label: `${c.nombre_comercial || c.razon_social} · ${c.sector || 'B2B'}`,
  }));
});

const inicializar = () => {
  if (props.cliente) {
    clienteSeleccionadoId.value = props.cliente.id;
  } else if (props.todosLosClientes.length > 0) {
    clienteSeleccionadoId.value = props.todosLosClientes[0].id;
  }

  if (props.mensaje) {
    titulo.value = `Seguimiento: ${props.mensaje.asunto || 'Correo recibido'}`;
    descripcion.value = `Acordado vía correo con ${props.mensaje.de.nombre || props.mensaje.de.correo}.\n\nReferencia del mensaje:\n"${props.mensaje.extracto || ''}"`;
  }

  // Programar para mañana a las 10:00 AM
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  fecha.value = manana.toISOString().split('T')[0];
  hora.value = '10:00';
};

watch(
  () => props.abierto,
  (val) => {
    if (val) inicializar();
  }
);

const guardarActividad = () => {
  if (!titulo.value.trim()) {
    toastService.advertencia('Ingresa el título del recordatorio o actividad.');
    return;
  }
  if (!clienteSeleccionadoId.value) {
    toastService.advertencia('Selecciona el cliente del CRM asociado.');
    return;
  }

  const clienteObj = props.todosLosClientes.find((c) => c.id === clienteSeleccionadoId.value);
  const clienteNombre = clienteObj?.nombre_comercial || clienteObj?.razon_social || props.mensaje?.de.nombre || 'Cliente B2B';

  guardando.value = true;
  try {
    const fechaHoraIso = new Date(`${fecha.value}T${hora.value}:00`).toISOString();

    const act = actividadesService.crearActividad({
      clienteId: clienteSeleccionadoId.value,
      clienteNombre,
      clienteSector: clienteObj?.sector,
      titulo: titulo.value.trim(),
      descripcion: descripcion.value.trim(),
      tipo: tipo.value,
      prioridad: prioridad.value,
      fechaLimite: fechaHoraIso,
      responsable: responsable.value,
    });

    toastService.exito(`¡Actividad programada en Agenda para el ${fecha.value} a las ${hora.value}!`);
    emit('creado', act);
    emit('cerrar');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al agendar actividad';
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
          <div class="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <CalendarClock class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Crear Tarea / Recordatorio en Agenda
            </h3>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
              Programa un seguimiento o reunión directamente desde este correo.
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
            Título de la actividad:
          </label>
          <input
            type="text"
            v-model="titulo"
            placeholder="ej. Llamada para confirmar orden de compra"
            class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 font-medium"
          />
        </div>

        <!-- Cliente Asociado -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Building2 class="w-3.5 h-3.5 text-indigo-500" />
            <span>Cliente del CRM:</span>
          </label>
          <AppSelect
            v-model="clienteSeleccionadoId"
            :options="opcionesClientes"
            full-width
            size="md"
          />
        </div>

        <!-- Tipo y Prioridad -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Canal de actividad:
            </label>
            <AppSelect
              v-model="tipo"
              :options="opcionesTipo"
              full-width
              size="md"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Prioridad:
            </label>
            <AppSelect
              v-model="prioridad"
              :options="opcionesPrioridad"
              full-width
              size="md"
            />
          </div>
        </div>

        <!-- Fecha y Hora -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <CalendarClock class="w-3.5 h-3.5 text-sky-500" />
              <span>Fecha programada:</span>
            </label>
            <input
              type="date"
              v-model="fecha"
              class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Clock class="w-3.5 h-3.5 text-amber-500" />
              <span>Hora:</span>
            </label>
            <input
              type="time"
              v-model="hora"
              class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

        <!-- Responsable -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Ejecutivo comercial responsable:
          </label>
          <input
            type="text"
            v-model="responsable"
            class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <!-- Descripción -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Detalle del compromiso / notas:
          </label>
          <textarea
            v-model="descripcion"
            rows="3"
            class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
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
          @click="guardarActividad"
          :disabled="guardando"
          class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-indigo-950/20 flex items-center gap-2 disabled:opacity-50"
        >
          <Sparkles class="w-3.5 h-3.5" />
          <span>{{ guardando ? 'Guardando...' : 'Agendar en Calendario' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
