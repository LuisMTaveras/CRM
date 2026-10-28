<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { X, Kanban, Check, User, DollarSign, Calendar, TrendingUp } from 'lucide-vue-next';
import type { ChatWhatsApp } from '../types/whatsapp-chat.types';
import type { Cliente } from '@/modules/clientes/types/cliente.types';
import { clienteService } from '@/modules/clientes/services/cliente.service';
import { pipelineService } from '@/modules/pipeline/services/pipeline.service';
import { toastService } from '@/core/notifications/toast.service';
import { getCurrencySymbol } from '@/core/formatters/formatters';

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

const titulo = ref('');
const monto = ref<number>(150000);
const etapa = ref<string>('calificacion');
const probabilidad = ref<number>(50);
const fechaObjetivo = ref<string>('');
const prioridad = ref<'alta' | 'media' | 'baja'>('media');
const notas = ref('');

// Cargar catálogo de clientes para asociación
onMounted(async () => {
  try {
    const res = clienteService.obtenerClientesSincrono({ pagina: 1, tamanoPagina: 100, busqueda: '' });
    listaClientes.value = res.datos || [];
  } catch {
    listaClientes.value = [];
  }
});

function calcularFechaDefecto(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

watch(
  () => props.modelValue,
  (abierto) => {
    if (abierto && props.chat) {
      titulo.value = `Trato comercial - ${props.chat.nombre}`;
      monto.value = 150000;
      etapa.value = 'calificacion';
      probabilidad.value = 50;
      prioridad.value = 'media';
      fechaObjetivo.value = calcularFechaDefecto();
      notas.value = `Oportunidad originada desde canal de WhatsApp (${props.chat.telefono}).`;

      // Intentar asociar con un cliente existente por nombre o teléfono
      if (props.chat.clienteId) {
        clienteSeleccionadoId.value = props.chat.clienteId;
      } else {
        const telefonoLimpio = props.chat.telefono.replace(/\D/g, '');
        const encontrado = listaClientes.value.find(
          (c) =>
            (c.telefono && c.telefono.replace(/\D/g, '').includes(telefonoLimpio)) ||
            c.razon_social.toLowerCase().includes(props.chat?.nombre?.toLowerCase() || '') ||
            (c.nombre_comercial && c.nombre_comercial.toLowerCase().includes(props.chat?.nombre?.toLowerCase() || ''))
        );
        clienteSeleccionadoId.value = encontrado ? encontrado.id : listaClientes.value[0]?.id || '';
      }
    }
  },
  { immediate: true }
);

function cerrar() {
  emit('update:modelValue', false);
}

async function guardarTrato() {
  if (!titulo.value.trim()) {
    toastService.advertencia('Por favor ingresa un título para el trato.');
    return;
  }

  if (!clienteSeleccionadoId.value && listaClientes.value.length > 0) {
    clienteSeleccionadoId.value = listaClientes.value[0].id;
  }

  if (!clienteSeleccionadoId.value) {
    toastService.advertencia('No se encontró ningún cliente registrado para vincular la oportunidad.');
    return;
  }

  guardando.value = true;
  try {
    await pipelineService.crearTarjeta({
      pipeline_id: 'pipeline-comercial',
      columna_id: etapa.value,
      cliente_id: clienteSeleccionadoId.value,
      titulo: titulo.value.trim(),
      monto: Number(monto.value) || 0,
      probabilidad: Number(probabilidad.value) || 50,
      fecha_objetivo: fechaObjetivo.value || calcularFechaDefecto(),
      prioridad: prioridad.value,
      notas: notas.value.trim(),
    });

    toastService.exito('Oportunidad registrada exitosamente en el Pipeline Comercial');
    emit('creado');
    cerrar();
  } catch (err: unknown) {
    console.error('Error creando trato desde WhatsApp:', err);
    toastService.error('Ocurrió un error al registrar el trato comercial.');
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
      <!-- Cabecera del Modal -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-elevated/50">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Kanban class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-foreground">Crear Oportunidad en Pipeline</h3>
            <p class="text-xs text-muted-foreground">Convertir conversación de WhatsApp en un trato activo</p>
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

      <!-- Formulario -->
      <div class="p-6 space-y-4 overflow-y-auto">
        <!-- Cliente Asociado -->
        <div>
          <label class="block text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
            <User class="w-3.5 h-3.5 text-muted-foreground" />
            <span>Cliente Corporativo Asociado</span>
          </label>
          <select
            v-model="clienteSeleccionadoId"
            class="w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
          >
            <option
              v-for="cli in listaClientes"
              :key="cli.id"
              :value="cli.id"
            >
              {{ cli.nombre_comercial || cli.razon_social }} ({{ cli.codigo }})
            </option>
          </select>
          <p class="text-[11px] text-muted-foreground mt-1">
            Contacto WhatsApp: {{ chat?.nombre }} • {{ chat?.telefono }}
          </p>
        </div>

        <!-- Título del Trato -->
        <div>
          <label class="block text-xs font-medium text-foreground mb-1.5">Título del Trato u Oportunidad</label>
          <input
            v-model="titulo"
            type="text"
            placeholder="Ej: Licenciamiento Anual y Mantenimiento"
            class="w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        <!-- Fila de Monto y Probabilidad -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
              <DollarSign class="w-3.5 h-3.5 text-muted-foreground" />
              <span>Monto Proyectado ({{ getCurrencySymbol() }})</span>
            </label>
            <input
              v-model.number="monto"
              type="number"
              min="0"
              step="5000"
              class="w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
              <TrendingUp class="w-3.5 h-3.5 text-muted-foreground" />
              <span>Probabilidad (%)</span>
            </label>
            <select
              v-model.number="probabilidad"
              class="w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
            >
              <option :value="20">20% — Inicial / Exploratorio</option>
              <option :value="40">40% — Calificación Confirmada</option>
              <option :value="60">60% — Propuesta Formal Presentada</option>
              <option :value="80">80% — Negociación Final / Aprobación</option>
              <option :value="100">100% — Acuerdo Cerrado</option>
            </select>
          </div>
        </div>

        <!-- Fila de Etapa y Prioridad -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-foreground mb-1.5">Etapa Inicial del Embudo</label>
            <select
              v-model="etapa"
              class="w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="calificacion">Calificación</option>
              <option value="propuesta">Propuesta Enviada</option>
              <option value="negociacion">En Negociación</option>
              <option value="ganada">Cerrada Ganada</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
              <Calendar class="w-3.5 h-3.5 text-muted-foreground" />
              <span>Fecha Estimada Cierre</span>
            </label>
            <input
              v-model="fechaObjetivo"
              type="date"
              class="w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
        </div>

        <!-- Prioridad -->
        <div>
          <label class="block text-xs font-medium text-foreground mb-1.5">Nivel de Prioridad</label>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
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

        <!-- Observaciones / Notas -->
        <div>
          <label class="block text-xs font-medium text-foreground mb-1.5">Notas Comerciales</label>
          <textarea
            v-model="notas"
            rows="3"
            placeholder="Anotaciones relevantes de la conversación..."
            class="w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 resize-none"
          ></textarea>
        </div>
      </div>

      <!-- Pie del Modal -->
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
          class="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors disabled:opacity-50"
          @click="guardarTrato"
        >
          <Check class="w-4 h-4" />
          <span>{{ guardando ? 'Guardando en Pipeline...' : 'Crear Oportunidad' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
