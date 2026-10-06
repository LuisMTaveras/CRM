<script setup lang="ts">
import { ref, reactive } from 'vue';
import { 
  X, 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Calendar, 
  User, 
  Trash2,
  Briefcase,
  Users,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Plus,
  Check,
  Star,
  Loader2
} from 'lucide-vue-next';
import { formatearMoneda, formatearFecha, formatearFechaHora, formatearTelefonoRD } from '@/core/lib/utils';
import { FlickerlessSurface } from '@flickerless/vue';
import Can from '@/shared/components/Can.vue';
import type { Cliente, EstadoCliente } from '../types/cliente.types';
import { clienteService } from '../services/cliente.service';

const props = defineProps<{
  abierto: boolean;
  cliente: Cliente | null;
}>();

const emit = defineEmits<{
  (e: 'cerrar'): void;
  (e: 'cambiarEstado', id: string, nuevoEstado: EstadoCliente): void;
  (e: 'eliminar', id: string): void;
  (e: 'enviarDocumento', cliente: Cliente): void;
  (e: 'actualizar'): void;
}>();

const pestanaActiva = ref<'general' | 'contactos' | 'oportunidades' | 'actividades'>('general');
const guardandoContacto = ref(false);
const mostrarFormContacto = ref(false);
const errorContacto = ref('');

const formularioContacto = reactive({
  nombre: '',
  cargo: '',
  email: '',
  telefono: '+1 (809) ',
  es_principal: false,
});

const abrirFormularioContacto = () => {
  formularioContacto.nombre = '';
  formularioContacto.cargo = '';
  formularioContacto.email = '';
  formularioContacto.telefono = '+1 (809) ';
  formularioContacto.es_principal = !props.cliente?.contactos || props.cliente.contactos.length === 0;
  errorContacto.value = '';
  mostrarFormContacto.value = true;
};

const guardarContacto = async () => {
  if (!props.cliente) return;
  if (!formularioContacto.nombre.trim()) {
    errorContacto.value = 'El nombre del contacto es obligatorio';
    return;
  }
  if (!formularioContacto.email.trim() || !formularioContacto.email.includes('@')) {
    errorContacto.value = 'Ingrese un correo electrónico válido';
    return;
  }

  guardandoContacto.value = true;
  errorContacto.value = '';
  try {
    const nuevo = await clienteService.agregarContacto(props.cliente.id, {
      nombre: formularioContacto.nombre,
      cargo: formularioContacto.cargo || 'Contacto Comercial',
      email: formularioContacto.email,
      telefono: formularioContacto.telefono,
      es_principal: formularioContacto.es_principal,
    });

    if (!props.cliente.contactos) {
      props.cliente.contactos = [];
    }
    if (formularioContacto.es_principal) {
      props.cliente.contactos.forEach((c) => (c.es_principal = false));
    }
    props.cliente.contactos.push(nuevo);
    mostrarFormContacto.value = false;
    emit('actualizar');
  } catch (err: unknown) {
    errorContacto.value = err instanceof Error ? err.message : 'Error al guardar contacto';
  } finally {
    guardandoContacto.value = false;
  }
};

const eliminarContacto = async (contactoId: string) => {
  if (!props.cliente) return;
  if (!confirm('¿Confirma que desea eliminar este contacto?')) return;

  try {
    await clienteService.eliminarContacto(props.cliente.id, contactoId);
    if (props.cliente.contactos) {
      const idx = props.cliente.contactos.findIndex((c) => c.id === contactoId);
      if (idx >= 0) props.cliente.contactos.splice(idx, 1);
    }
    emit('actualizar');
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : 'Error al eliminar contacto');
  }
};

const marcarPrincipal = async (contactoId: string) => {
  if (!props.cliente) return;
  try {
    await clienteService.marcarContactoPrincipal(props.cliente.id, contactoId);
    if (props.cliente.contactos) {
      props.cliente.contactos.forEach((c) => {
        c.es_principal = c.id === contactoId;
      });
    }
    emit('actualizar');
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : 'Error al actualizar contacto principal');
  }
};

const cambiarEstado = (evento: Event) => {
  const nuevo = (evento.target as HTMLSelectElement).value as EstadoCliente;
  if (props.cliente) {
    emit('cambiarEstado', props.cliente.id, nuevo);
  }
};
</script>

<template>
  <div>
    <!-- Backdrop oscuro con blur sutil -->
    <div
      v-if="abierto"
      @click="emit('cerrar')"
      class="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40 transition-opacity"
    ></div>

    <!-- Panel Lateral Deslizante (Drawer) -->
    <aside
      :class="[
        'fixed top-0 right-0 h-full w-full max-w-xl bg-zinc-900 border-l border-zinc-800 shadow-2xl z-50 transform transition-transform duration-200 ease-in-out flex flex-col',
        abierto ? 'translate-x-0' : 'translate-x-full'
      ]"
    >
      <template v-if="cliente">
        <!-- Cabecera del Drawer -->
        <div class="p-5 border-b border-zinc-800 bg-zinc-950/80">
          <div class="flex items-center justify-between gap-3 mb-3">
            <div class="flex items-center gap-2">
              <span class="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                {{ cliente?.codigo }}
              </span>
              <span v-if="cliente?.prioridad === 'alta'" class="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                <Sparkles class="w-3 h-3" />
                Cuenta Estratégica
              </span>
            </div>

            <!-- Botones de Acción Rápida y Cerrar -->
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                @click="cliente && emit('enviarDocumento', cliente)"
                title="Generar y Enviar Documento PDF Oficial por Correo"
                class="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs rounded transition shadow-sm active:scale-95"
              >
                <Mail class="w-3.5 h-3.5" />
                <span>Enviar Documento PDF</span>
              </button>

              <Can I="delete" an="Cliente">
                <button
                  @click="emit('eliminar', cliente?.id || '')"
                  title="Eliminar cliente (Solo Administrador)"
                  class="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded transition"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </Can>
              <button
                @click="emit('cerrar')"
                title="Cerrar panel"
                class="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Razón Social y Nombre Comercial -->
          <h2 class="text-lg font-bold text-zinc-100 leading-tight">
            {{ cliente?.razon_social }}
          </h2>
          <p v-if="cliente?.nombre_comercial" class="text-xs text-zinc-400 mt-0.5">
            Nombre comercial: {{ cliente?.nombre_comercial }}
          </p>

          <!-- Selector de Estado Rápido -->
          <div class="mt-4 flex items-center gap-3 pt-3 border-t border-zinc-800/80">
            <span class="text-xs text-zinc-400 font-medium">Estado Comercial:</span>
            <Can I="update" an="Cliente">
              <select
                :value="cliente?.estado"
                @change="cambiarEstado"
                class="bg-zinc-900 border border-zinc-700 text-xs font-medium rounded-md px-2.5 py-1 text-zinc-200 focus:outline-none focus:border-zinc-500"
              >
                <option value="prospecto">Prospecto</option>
                <option value="en_negociacion">En Negociación</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="cerrado_perdido">Cerrado Perdido</option>
              </select>
              <template #fallback>
                <span class="capitalize px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium text-xs">
                  {{ cliente?.estado }}
                </span>
              </template>
            </Can>
          </div>
        </div>

        <!-- Pestañas de Navegación del Drawer -->
        <div class="flex border-b border-zinc-800 bg-zinc-950/40 text-xs">
          <button
            @click="pestanaActiva = 'general'"
            :class="[
              'flex-1 py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5',
              pestanaActiva === 'general'
                ? 'border-emerald-500 text-emerald-400 bg-zinc-900/40'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            ]"
          >
            <Building2 class="w-3.5 h-3.5" />
            General
          </button>
          <button
            @click="pestanaActiva = 'contactos'"
            :class="[
              'flex-1 py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5',
              pestanaActiva === 'contactos'
                ? 'border-emerald-500 text-emerald-400 bg-zinc-900/40'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            ]"
          >
            <Users class="w-3.5 h-3.5" />
            Contactos ({{ cliente?.contactos?.length || 0 }})
          </button>
          <button
            @click="pestanaActiva = 'oportunidades'"
            :class="[
              'flex-1 py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5',
              pestanaActiva === 'oportunidades'
                ? 'border-emerald-500 text-emerald-400 bg-zinc-900/40'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            ]"
          >
            <Briefcase class="w-3.5 h-3.5" />
            Deals ({{ cliente?.oportunidades?.length || 0 }})
          </button>
          <button
            @click="pestanaActiva = 'actividades'"
            :class="[
              'flex-1 py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5',
              pestanaActiva === 'actividades'
                ? 'border-emerald-500 text-emerald-400 bg-zinc-900/40'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            ]"
          >
            <MessageSquare class="w-3.5 h-3.5" />
            Bitácora ({{ cliente?.actividades?.length || 0 }})
          </button>
        </div>

        <!-- Cuerpo del Drawer con Scroll Interno -->
        <div class="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          <!-- Pestaña 1: Información General -->
          <div v-if="pestanaActiva === 'general'" class="space-y-4">
            <!-- Tarjeta de Resumen Financiero -->
            <div class="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
              <span class="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block mb-1">
                Valor Estimado de Cartera
              </span>
              <div class="text-xl font-bold font-mono text-zinc-100 tabular-nums">
                {{ formatearMoneda(cliente?.valor_estimado || 0) }}
              </div>
            </div>

            <!-- Fila de Datos Principales -->
            <div class="grid grid-cols-2 gap-3.5">
              <div class="bg-zinc-950/60 p-3 rounded border border-zinc-800/80">
                <span class="text-zinc-500 block mb-0.5">Identificación Fiscal (RNC)</span>
                <span class="font-mono font-medium text-zinc-200">{{ cliente?.identificacion_fiscal || 'Sin RNC' }}</span>
              </div>
              <div class="bg-zinc-950/60 p-3 rounded border border-zinc-800/80">
                <span class="text-zinc-500 block mb-0.5">Sector Económico</span>
                <span class="font-medium text-zinc-200">{{ cliente?.sector }}</span>
              </div>
              <div class="bg-zinc-950/60 p-3 rounded border border-zinc-800/80">
                <span class="text-zinc-500 block mb-0.5">Responsable Comercial</span>
                <span class="font-medium text-zinc-200 flex items-center gap-1.5">
                  <User class="w-3 h-3 text-zinc-400" />
                  {{ cliente?.responsable }}
                </span>
              </div>
              <div class="bg-zinc-950/60 p-3 rounded border border-zinc-800/80">
                <span class="text-zinc-500 block mb-0.5">Prioridad</span>
                <span class="uppercase font-semibold text-zinc-200">{{ cliente?.prioridad }}</span>
              </div>
            </div>

            <!-- Datos de Contacto y Ubicación -->
            <div class="space-y-2.5 pt-2">
              <h3 class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Datos de Comunicación
              </h3>

              <div class="flex items-center gap-2.5 text-zinc-300">
                <Mail class="w-4 h-4 text-zinc-500 shrink-0" />
                <a :href="`mailto:${cliente?.email}`" class="hover:text-emerald-400 hover:underline">
                  {{ cliente?.email || 'Sin correo registrado' }}
                </a>
              </div>

              <div class="flex items-center gap-2.5 text-zinc-300">
                <Phone class="w-4 h-4 text-zinc-500 shrink-0" />
                <span class="font-mono">{{ formatearTelefonoRD(cliente?.telefono) }}</span>
              </div>

              <div v-if="cliente?.sitio_web" class="flex items-center gap-2.5 text-zinc-300">
                <Globe class="w-4 h-4 text-zinc-500 shrink-0" />
                <a :href="cliente?.sitio_web" target="_blank" rel="noopener noreferrer" class="hover:text-emerald-400 hover:underline flex items-center gap-1">
                  {{ cliente?.sitio_web }}
                  <ExternalLink class="w-3 h-3" />
                </a>
              </div>

              <div class="flex items-start gap-2.5 text-zinc-300">
                <MapPin class="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <div>{{ cliente?.direccion || 'Sin dirección fija' }}</div>
                  <div class="text-zinc-500 text-[11px]">{{ cliente?.ciudad }}, {{ cliente?.pais }}</div>
                </div>
              </div>
            </div>

            <!-- Fechas de Auditoría -->
            <div class="pt-4 border-t border-zinc-800 text-[11px] text-zinc-500 flex justify-between">
              <span>Registrado: {{ formatearFecha(cliente?.creado_en) }}</span>
              <span>Actualizado: {{ formatearFecha(cliente?.actualizado_en || cliente?.creado_en) }}</span>
            </div>
          </div>

          <!-- Pestaña 2: Contactos Clave -->
          <div v-else-if="pestanaActiva === 'contactos'" class="space-y-3">
            <div class="flex items-center justify-between pb-1">
              <div class="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Users class="w-3.5 h-3.5 text-emerald-400" />
                <span>Contactos de la Empresa</span>
                <span class="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                  {{ cliente?.contactos?.length || 0 }}
                </span>
              </div>
              <button
                v-if="!mostrarFormContacto"
                type="button"
                @click="abrirFormularioContacto"
                class="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-medium transition shadow-sm"
              >
                <Plus class="w-3 h-3" />
                <span>+ Agregar Contacto</span>
              </button>
            </div>

            <!-- Formulario de Creación de Nuevo Contacto -->
            <div v-if="mostrarFormContacto" class="bg-zinc-950 p-3.5 rounded-lg border border-emerald-500/40 space-y-3">
              <div class="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                <span class="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                  <User class="w-3.5 h-3.5 text-emerald-400" />
                  Nuevo Contacto Comercial
                </span>
                <button
                  type="button"
                  @click="mostrarFormContacto = false"
                  class="text-zinc-500 hover:text-zinc-300"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>

              <div v-if="errorContacto" class="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                {{ errorContacto }}
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label class="block text-zinc-400 text-[10px] mb-1 font-medium">Nombre Completo *</label>
                  <input
                    v-model="formularioContacto.nombre"
                    type="text"
                    placeholder="Ej: Lic. Carlos Gómez"
                    class="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 text-xs focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label class="block text-zinc-400 text-[10px] mb-1 font-medium">Cargo / Posición</label>
                  <input
                    v-model="formularioContacto.cargo"
                    type="text"
                    placeholder="Ej: Gerente de Finanzas"
                    class="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 text-xs focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label class="block text-zinc-400 text-[10px] mb-1 font-medium">Correo Electrónico *</label>
                  <input
                    v-model="formularioContacto.email"
                    type="email"
                    placeholder="cgomez@empresa.com.do"
                    class="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 text-xs focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label class="block text-zinc-400 text-[10px] mb-1 font-medium">Teléfono Directo</label>
                  <input
                    v-model="formularioContacto.telefono"
                    type="text"
                    placeholder="+1 (809) 555-0123"
                    class="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 text-xs focus:outline-none focus:border-zinc-500 font-mono"
                  />
                </div>
              </div>

              <div class="flex items-center gap-2 pt-1">
                <input
                  v-model="formularioContacto.es_principal"
                  type="checkbox"
                  id="chk-principal"
                  class="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-0 cursor-pointer"
                />
                <label for="chk-principal" class="text-[11px] text-zinc-300 cursor-pointer">
                  Establecer como contacto principal de la cuenta
                </label>
              </div>

              <div class="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  @click="mostrarFormContacto = false"
                  class="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  @click="guardarContacto"
                  :disabled="guardandoContacto"
                  class="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-medium transition disabled:opacity-50"
                >
                  <Loader2 v-if="guardandoContacto" class="w-3 h-3 animate-spin" />
                  <Check v-else class="w-3 h-3" />
                  <span>{{ guardandoContacto ? 'Guardando...' : 'Guardar Contacto' }}</span>
                </button>
              </div>
            </div>

            <!-- Listado de Contactos Existentes -->
            <template v-if="cliente?.contactos && cliente?.contactos?.length > 0">
              <FlickerlessSurface :loading="guardandoContacto" :delay-ms="180">
                <div class="space-y-3">
                  <div
                    v-for="contacto in cliente.contactos"
                    :key="contacto.id"
                    class="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition flex flex-col gap-2 relative group"
                  >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 min-w-0">
                    <div class="font-semibold text-zinc-200 text-sm truncate">{{ contacto.nombre }}</div>
                    <span
                      v-if="contacto.es_principal"
                      class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-medium shrink-0"
                    >
                      <Star class="w-2.5 h-2.5 fill-emerald-400" />
                      Principal
                    </span>
                  </div>

                  <div class="flex items-center gap-1">
                    <button
                      v-if="!contacto.es_principal"
                      type="button"
                      @click="marcarPrincipal(contacto.id)"
                      title="Establecer como contacto principal"
                      class="text-[10px] text-zinc-400 hover:text-emerald-400 px-1.5 py-0.5 rounded hover:bg-zinc-900 transition"
                    >
                      Hacer Principal
                    </button>
                    <button
                      type="button"
                      @click="eliminarContacto(contacto.id)"
                      title="Eliminar este contacto"
                      class="p-1 text-zinc-500 hover:text-rose-400 transition"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div class="text-zinc-400 text-xs">{{ contacto.cargo }}</div>

                <div class="flex flex-wrap items-center gap-4 text-zinc-400 text-[11px] pt-1.5 border-t border-zinc-900">
                  <a
                    :href="`mailto:${contacto.email}`"
                    class="flex items-center gap-1.5 hover:text-emerald-400 transition"
                  >
                    <Mail class="w-3 h-3 text-zinc-500" />
                    <span>{{ contacto.email }}</span>
                  </a>
                  <span v-if="contacto.telefono" class="flex items-center gap-1.5">
                    <Phone class="w-3 h-3 text-zinc-500" />
                    <span class="font-mono">{{ formatearTelefonoRD(contacto.telefono) }}</span>
                  </span>
                </div>
              </div>
            </div>
          </FlickerlessSurface>
        </template>

            <!-- Estado Vacío cuando no hay contactos -->
            <div
              v-else-if="!mostrarFormContacto"
              class="text-center py-8 px-4 bg-zinc-950/60 border border-zinc-800/80 rounded-lg flex flex-col items-center justify-center"
            >
              <div class="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-2">
                <Users class="w-4 h-4 text-zinc-400" />
              </div>
              <h4 class="text-xs font-semibold text-zinc-200 mb-0.5">Sin contactos registrados</h4>
              <p class="text-[11px] text-zinc-500 mb-3 max-w-xs text-center">
                Esta empresa aún no cuenta con interlocutores o directivos asociados.
              </p>
              <button
                type="button"
                @click="abrirFormularioContacto"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition shadow-sm"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>+ Agregar Primer Contacto</span>
              </button>
            </div>
          </div>

          <!-- Pestaña 3: Oportunidades y Deals -->
          <div v-else-if="pestanaActiva === 'oportunidades'" class="space-y-3">
            <template v-if="cliente?.oportunidades && cliente?.oportunidades?.length > 0">
              <div
                v-for="deal in cliente.oportunidades"
                :key="deal.id"
                class="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 flex flex-col gap-2"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="font-medium text-zinc-200">{{ deal.titulo }}</div>
                  <span class="font-mono font-bold text-zinc-100 tabular-nums">
                    {{ formatearMoneda(deal.monto) }}
                  </span>
                </div>
                <div class="flex items-center justify-between text-[11px] text-zinc-400">
                  <span class="capitalize">Etapa: <strong class="text-zinc-300">{{ deal.etapa }}</strong></span>
                  <span>Probabilidad: <strong class="text-emerald-400 font-mono">{{ deal.probabilidad }}%</strong></span>
                </div>
                <div class="flex items-center gap-1 text-[11px] text-zinc-500">
                  <Calendar class="w-3 h-3" />
                  Cierre estimado: {{ formatearFecha(deal.fecha_cierre_estimada) }}
                </div>
              </div>
            </template>
            <div v-else class="text-center py-8 text-zinc-500">
              No existen oportunidades comerciales abiertas actualmente.
            </div>
          </div>

          <!-- Pestaña 4: Bitácora de Actividades -->
          <div v-else-if="pestanaActiva === 'actividades'" class="space-y-3">
            <template v-if="cliente?.actividades && cliente?.actividades?.length > 0">
              <div
                v-for="actividad in cliente.actividades"
                :key="actividad.id"
                class="bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex flex-col gap-1.5"
              >
                <div class="flex items-center justify-between text-[11px]">
                  <span class="uppercase font-semibold text-emerald-400 tracking-wider">
                    {{ actividad.tipo }}
                  </span>
                  <span class="text-zinc-500 font-mono">
                    {{ formatearFechaHora(actividad.fecha) }}
                  </span>
                </div>
                <p class="text-zinc-300 leading-relaxed">
                  {{ actividad.descripcion }}
                </p>
                <div class="text-[11px] text-zinc-500 text-right">
                  Por: {{ actividad.realizado_por }}
                </div>
              </div>
            </template>
            <div v-else class="text-center py-8 text-zinc-500">
              Sin registros en la bitácora de actividad.
            </div>
          </div>
        </div>

        <!-- Pie del Drawer -->
        <div class="p-3 border-t border-zinc-800 bg-zinc-950/80 flex justify-end">
          <button
            @click="emit('cerrar')"
            class="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-md transition text-xs"
          >
            Cerrar
          </button>
        </div>
      </template>
    </aside>
  </div>
</template>
