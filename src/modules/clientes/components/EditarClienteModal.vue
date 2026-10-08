<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { X, Building2, Save, Loader2 } from 'lucide-vue-next';
import type { Cliente, EstadoCliente, PrioridadCliente } from '../types/cliente.types';
import { clienteService } from '../services/cliente.service';
import { toastService } from '@/core/notifications/toast.service';

const props = defineProps<{
  abierto: boolean;
  cliente: Cliente | null;
}>();

const emit = defineEmits<{
  (e: 'cerrar'): void;
  (e: 'actualizado', clienteActualizado: Cliente): void;
}>();

const guardando = ref(false);
const errorMensaje = ref('');

const formulario = reactive({
  razon_social: '',
  nombre_comercial: '',
  identificacion_fiscal: '',
  sector: 'Tecnología',
  estado: 'prospecto' as EstadoCliente,
  prioridad: 'media' as PrioridadCliente,
  email: '',
  telefono: '',
  sitio_web: '',
  direccion: '',
  ciudad: 'Santo Domingo',
  valor_estimado: 0,
  responsable: 'Camila Morales',
});

watch(
  () => props.cliente,
  (c) => {
    if (c) {
      formulario.razon_social = c.razon_social || '';
      formulario.nombre_comercial = c.nombre_comercial || '';
      formulario.identificacion_fiscal = c.identificacion_fiscal || '';
      formulario.sector = c.sector || 'Tecnología';
      formulario.estado = c.estado || 'prospecto';
      formulario.prioridad = c.prioridad || 'media';
      formulario.email = c.email || '';
      formulario.telefono = c.telefono || '';
      formulario.sitio_web = c.sitio_web || '';
      formulario.direccion = c.direccion || '';
      formulario.ciudad = c.ciudad || 'Santo Domingo';
      formulario.valor_estimado = c.valor_estimado || 0;
      formulario.responsable = c.responsable || 'Camila Morales';
    }
  },
  { immediate: true }
);

const guardar = async () => {
  if (!props.cliente) return;
  if (!formulario.razon_social.trim()) {
    errorMensaje.value = 'La razón social es obligatoria.';
    return;
  }
  if (!formulario.identificacion_fiscal.trim()) {
    errorMensaje.value = 'La identificación fiscal (RNC) es obligatoria.';
    return;
  }

  errorMensaje.value = '';
  guardando.value = true;
  try {
    const actualizado = await clienteService.actualizarCliente(props.cliente.id, {
      razon_social: formulario.razon_social.trim(),
      nombre_comercial: formulario.nombre_comercial.trim() || undefined,
      identificacion_fiscal: formulario.identificacion_fiscal.trim(),
      sector: formulario.sector,
      estado: formulario.estado,
      prioridad: formulario.prioridad,
      email: formulario.email.trim() || undefined,
      telefono: formulario.telefono.trim() || undefined,
      sitio_web: formulario.sitio_web.trim() || undefined,
      direccion: formulario.direccion.trim() || undefined,
      ciudad: formulario.ciudad.trim() || undefined,
      valor_estimado: Number(formulario.valor_estimado),
      responsable: formulario.responsable.trim(),
    });

    toastService.exito(`Cliente "${actualizado.razon_social}" actualizado correctamente.`);
    emit('actualizado', actualizado);
    emit('cerrar');
  } catch (err: unknown) {
    errorMensaje.value = err instanceof Error ? err.message : 'Error al actualizar el cliente.';
  } finally {
    guardando.value = false;
  }
};
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
      class="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
    >
      <!-- Cabecera -->
      <div class="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Building2 class="w-4 h-4" />
          </div>
          <div>
            <h2 class="text-sm font-bold text-zinc-100">Editar Datos del Cliente B2B</h2>
            <p class="text-[11px] text-zinc-400">Actualizar información corporativa y parámetros comerciales</p>
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
      <form @submit.prevent="guardar" class="p-5 space-y-4 text-xs overflow-y-auto">
        <div
          v-if="errorMensaje"
          class="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs"
        >
          {{ errorMensaje }}
        </div>

        <!-- Identidad Legal -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label class="block text-zinc-400 font-medium mb-1">
              Razón Social <span class="text-rose-400">*</span>
            </label>
            <input
              v-model="formulario.razon_social"
              type="text"
              required
              class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-700 transition"
            />
          </div>

          <div>
            <label class="block text-zinc-400 font-medium mb-1">
              Nombre Comercial
            </label>
            <input
              v-model="formulario.nombre_comercial"
              type="text"
              class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-700 transition"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label class="block text-zinc-400 font-medium mb-1">
              Identificación Fiscal (RNC) <span class="text-rose-400">*</span>
            </label>
            <input
              v-model="formulario.identificacion_fiscal"
              type="text"
              required
              class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 font-mono focus:outline-none focus:border-zinc-700 transition"
            />
          </div>

          <div>
            <label class="block text-zinc-400 font-medium mb-1">Sector Económico</label>
            <select
              v-model="formulario.sector"
              class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-700 transition"
            >
              <option value="Tecnología">Tecnología & Cloud</option>
              <option value="Finanzas">Finanzas & Inversiones</option>
              <option value="Salud">Salud & Redes Médicas</option>
              <option value="Retail">Retail & Comercio</option>
              <option value="Manufactura">Manufactura & Industria</option>
              <option value="Logística">Logística & Aduanas</option>
              <option value="Servicios">Servicios Profesionales</option>
            </select>
          </div>

          <div>
            <label class="block text-zinc-400 font-medium mb-1">Prioridad de Cuenta</label>
            <select
              v-model="formulario.prioridad"
              class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-700 transition uppercase"
            >
              <option value="alta">Alta (Estratégica)</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        </div>

        <!-- Contacto y Ubicación -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label class="block text-zinc-400 font-medium mb-1">Correo Electrónico</label>
            <input
              v-model="formulario.email"
              type="email"
              class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-700 transition"
            />
          </div>

          <div>
            <label class="block text-zinc-400 font-medium mb-1">Teléfono Principal</label>
            <input
              v-model="formulario.telefono"
              type="text"
              class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 font-mono focus:outline-none focus:border-zinc-700 transition"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label class="block text-zinc-400 font-medium mb-1">Dirección Física</label>
            <input
              v-model="formulario.direccion"
              type="text"
              class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-700 transition"
            />
          </div>

          <div>
            <label class="block text-zinc-400 font-medium mb-1">Ciudad</label>
            <input
              v-model="formulario.ciudad"
              type="text"
              class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-700 transition"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label class="block text-zinc-400 font-medium mb-1">Sitio Web</label>
            <input
              v-model="formulario.sitio_web"
              type="text"
              class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-700 transition"
            />
          </div>

          <div>
            <label class="block text-zinc-400 font-medium mb-1">Valor Estimado Cartera (RD$)</label>
            <input
              v-model.number="formulario.valor_estimado"
              type="number"
              min="0"
              class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 font-mono focus:outline-none focus:border-zinc-700 transition"
            />
          </div>

          <div>
            <label class="block text-zinc-400 font-medium mb-1">Responsable Comercial</label>
            <input
              v-model="formulario.responsable"
              type="text"
              required
              class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-700 transition"
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
            <Save v-else class="w-4 h-4" />
            <span>{{ guardando ? 'Guardando...' : 'Guardar Cambios' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
