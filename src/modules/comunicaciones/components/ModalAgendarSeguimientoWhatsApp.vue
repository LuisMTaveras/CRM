<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { X, Calendar, Check, Phone, Video, Users, FileText, MapPin, Clock } from 'lucide-vue-next';
import type { ChatWhatsApp } from '../types/whatsapp-chat.types';
import type { TipoActividad, PrioridadActividad } from '@/modules/agenda/types/actividad.types';
import type { Cliente } from '@/modules/clientes/types/cliente.types';
import { clienteService } from '@/modules/clientes/services/cliente.service';
import { actividadesService } from '@/modules/agenda/services/actividades.service';
import { toastService } from '@/core/notifications/toast.service';

const props = defineProps<{
  modelValue: boolean;
  chat: ChatWhatsApp | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'creado'): void;
}>();

const guardando = ref(false);
const listaClientes = ref<Cliente[]>([]);
const clienteSeleccionadoId = ref<string>('');
const clienteSeleccionadoNombre = ref<string>('');

const titulo = ref('');
const tipo = ref<TipoActividad>('llamada');
const prioridad = ref<PrioridadActividad>('media');
const fecha = ref('');
const hora = ref('10:00');
const responsable = ref('Camila Morales');
const descripcion = ref('');

onMounted(() => {
  try {
    const res = clienteService.obtenerClientesSincrono({ pagina: 1, tamanoPagina: 100, busqueda: '' });
    listaClientes.value = res.datos || [];
  } catch {
    listaClientes.value = [];
  }
});

function calcularFechaDefecto(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

watch(
  () => props.modelValue,
  (abierto) => {
    if (abierto && props.chat) {
      titulo.value = `Seguimiento comercial — ${props.chat.nombre}`;
      tipo.value = 'llamada';
      prioridad.value = 'media';
      fecha.value = calcularFechaDefecto();
      hora.value = '10:00';
      responsable.value = 'Camila Morales';
      descripcion.value = `Seguimiento acordado a través de WhatsApp (${props.chat.telefono}).`;

      // Intentar asociar con un cliente existente
      const telefonoLimpio = props.chat.telefono.replace(/\D/g, '');
      const encontrado = listaClientes.value.find(
        (c) =>
          (c.telefono && c.telefono.replace(/\D/g, '').includes(telefonoLimpio)) ||
          c.razon_social.toLowerCase().includes(props.chat?.nombre?.toLowerCase() || '') ||
          (c.nombre_comercial && c.nombre_comercial.toLowerCase().includes(props.chat?.nombre?.toLowerCase() || ''))
      );

      if (encontrado) {
        clienteSeleccionadoId.value = encontrado.id;
        clienteSeleccionadoNombre.value = encontrado.nombre_comercial || encontrado.razon_social;
      } else {
        clienteSeleccionadoId.value = listaClientes.value[0]?.id || 'cliente-wa';
        clienteSeleccionadoNombre.value = props.chat.nombre || 'Contacto WhatsApp';
      }
    }
  },
  { immediate: true }
);

function cerrar() {
  emit('update:modelValue', false);
}

function guardarActividad() {
  if (!titulo.value.trim()) {
    toastService.advertencia('Ingresa un título para la actividad de seguimiento.');
    return;
  }

  if (!fecha.value) {
    toastService.advertencia('Selecciona una fecha de compromiso.');
    return;
  }

  guardando.value = true;
  try {
    const [horas, minutos] = (hora.value || '10:00').split(':');
    const fechaObj = new Date(fecha.value);
    fechaObj.setHours(Number(horas) || 10, Number(minutos) || 0, 0, 0);

    actividadesService.crearActividad({
      clienteId: clienteSeleccionadoId.value,
      clienteNombre: clienteSeleccionadoNombre.value,
      titulo: titulo.value.trim(),
      tipo: tipo.value,
      prioridad: prioridad.value,
      fechaLimite: fechaObj.toISOString(),
      responsable: responsable.value.trim() || 'Equipo Comercial',
      descripcion: descripcion.value.trim(),
    });

    toastService.exito('Actividad de seguimiento programada en la agenda');
    emit('creado');
    cerrar();
  } catch (err: unknown) {
    console.error('Error guardando actividad de seguimiento:', err);
    toastService.error('Ocurrió un error al agendar la actividad.');
  } finally {
    guardando.value = false;
  }
}
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
  >
    <div
      class="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Cabecera -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-elevated/50">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Calendar class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-foreground">Agendar Seguimiento en Calendario</h3>
            <p class="text-xs text-muted-foreground">Programar tarea para el equipo comercial desde WhatsApp</p>
          </div>
        </div>
        <button
          type="button"
          class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors"
          @click="cerrar"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Contenido del formulario -->
      <div class="p-6 space-y-4 overflow-y-auto">
        <!-- Título -->
        <div>
          <label class="block text-xs font-medium text-foreground mb-1.5">Título del Seguimiento</label>
          <input
            v-model="titulo"
            type="text"
            class="w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-sky-500/30"
          />
        </div>

        <!-- Tipo de Actividad -->
        <div>
          <label class="block text-xs font-medium text-foreground mb-1.5">Canal o Tipo de Actividad</label>
          <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
            <button
              type="button"
              class="flex flex-col items-center gap-1.5 p-2 rounded-xl border text-xs transition-colors"
              :class="
                tipo === 'llamada'
                  ? 'bg-sky-500/10 border-sky-500/40 text-sky-600 dark:text-sky-400 font-medium'
                  : 'border-border text-muted-foreground hover:bg-surface-elevated'
              "
              @click="tipo = 'llamada'"
            >
              <Phone class="w-4 h-4" />
              <span>Llamada</span>
            </button>
            <button
              type="button"
              class="flex flex-col items-center gap-1.5 p-2 rounded-xl border text-xs transition-colors"
              :class="
                tipo === 'videollamada'
                  ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-600 dark:text-indigo-400 font-medium'
                  : 'border-border text-muted-foreground hover:bg-surface-elevated'
              "
              @click="tipo = 'videollamada'"
            >
              <Video class="w-4 h-4" />
              <span>Video</span>
            </button>
            <button
              type="button"
              class="flex flex-col items-center gap-1.5 p-2 rounded-xl border text-xs transition-colors"
              :class="
                tipo === 'reunion'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-medium'
                  : 'border-border text-muted-foreground hover:bg-surface-elevated'
              "
              @click="tipo = 'reunion'"
            >
              <Users class="w-4 h-4" />
              <span>Reunión</span>
            </button>
            <button
              type="button"
              class="flex flex-col items-center gap-1.5 p-2 rounded-xl border text-xs transition-colors"
              :class="
                tipo === 'propuesta'
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 font-medium'
                  : 'border-border text-muted-foreground hover:bg-surface-elevated'
              "
              @click="tipo = 'propuesta'"
            >
              <FileText class="w-4 h-4" />
              <span>Propuesta</span>
            </button>
            <button
              type="button"
              class="flex flex-col items-center gap-1.5 p-2 rounded-xl border text-xs transition-colors"
              :class="
                tipo === 'seguimiento'
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400 font-medium'
                  : 'border-border text-muted-foreground hover:bg-surface-elevated'
              "
              @click="tipo = 'seguimiento'"
            >
              <MapPin class="w-4 h-4" />
              <span>Seguimiento</span>
            </button>
          </div>
        </div>

        <!-- Fecha y Hora -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
              <Calendar class="w-3.5 h-3.5 text-muted-foreground" />
              <span>Fecha Límite</span>
            </label>
            <input
              v-model="fecha"
              type="date"
              class="w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-sky-500/30"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
              <Clock class="w-3.5 h-3.5 text-muted-foreground" />
              <span>Hora Prevista</span>
            </label>
            <input
              v-model="hora"
              type="time"
              class="w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-sky-500/30"
            />
          </div>
        </div>

        <!-- Prioridad -->
        <div>
          <label class="block text-xs font-medium text-foreground mb-1.5">Nivel de Prioridad</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              type="button"
              class="py-2 text-xs rounded-xl font-medium border text-center transition-colors"
              :class="
                prioridad === 'baja'
                  ? 'bg-zinc-500/10 border-zinc-500/40 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-surface-elevated'
              "
              @click="prioridad = 'baja'"
            >
              Baja
            </button>
            <button
              type="button"
              class="py-2 text-xs rounded-xl font-medium border text-center transition-colors"
              :class="
                prioridad === 'media'
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-400'
                  : 'border-border text-muted-foreground hover:bg-surface-elevated'
              "
              @click="prioridad = 'media'"
            >
              Media
            </button>
            <button
              type="button"
              class="py-2 text-xs rounded-xl font-medium border text-center transition-colors"
              :class="
                prioridad === 'alta'
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-400'
                  : 'border-border text-muted-foreground hover:bg-surface-elevated'
              "
              @click="prioridad = 'alta'"
            >
              Alta
            </button>
          </div>
        </div>

        <!-- Descripción / Instrucciones -->
        <div>
          <label class="block text-xs font-medium text-foreground mb-1.5">Objetivo o Instrucciones</label>
          <textarea
            v-model="descripcion"
            rows="3"
            placeholder="Detalles sobre lo acordado con el cliente..."
            class="w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-sky-500/30 resize-none"
          ></textarea>
        </div>
      </div>

      <!-- Pie -->
      <div class="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-surface-elevated/30">
        <button
          type="button"
          class="px-4 py-2 text-xs font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors"
          @click="cerrar"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="guardando"
          class="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-colors disabled:opacity-50"
          @click="guardarActividad"
        >
          <Check class="w-4 h-4" />
          <span>{{ guardando ? 'Agendando...' : 'Programar Actividad' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
