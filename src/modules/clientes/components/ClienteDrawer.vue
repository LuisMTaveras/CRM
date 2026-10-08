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
  Loader2,
  Edit3
} from 'lucide-vue-next';
import { formatCurrency, formatDate, formatPhoneNumber } from '@/core/formatters/formatters';
import Can from '@/shared/components/Can.vue';
import type { Cliente, EstadoCliente, Oportunidad, Actividad } from '../types/cliente.types';
import { clienteService } from '../services/cliente.service';
import EditarClienteModal from './EditarClienteModal.vue';
import { toastService } from '@/core/notifications/toast.service';
import { dialogService } from '@/core/dialog/dialog.service';

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
  (e: 'update:cliente', cliente: Cliente): void;
}>();

// Nunca mutar la prop: emitir una copia con los cambios aplicados
const actualizarCliente = (cambios: Partial<Cliente>) => {
  if (!props.cliente) return;
  emit('update:cliente', { ...props.cliente, ...cambios });
};

const sumarMontos = (oportunidades: Oportunidad[]) =>
  oportunidades.reduce((acc, o) => acc + (o.monto || 0), 0);

const pestanaActiva = ref<'general' | 'contactos' | 'oportunidades' | 'actividades'>('general');
const modalEditarClienteAbierto = ref(false);

// --- ESTADO PARA CONTACTOS ---
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

    const previos = (props.cliente.contactos ?? []).map((c) =>
      formularioContacto.es_principal ? { ...c, es_principal: false } : c
    );
    actualizarCliente({ contactos: [...previos, nuevo] });
    mostrarFormContacto.value = false;
    toastService.exito(`Contacto "${nuevo.nombre}" agregado con éxito.`);
    emit('actualizar');
  } catch (err: unknown) {
    errorContacto.value = err instanceof Error ? err.message : 'Error al guardar contacto';
  } finally {
    guardandoContacto.value = false;
  }
};

const eliminarContacto = async (contactoId: string) => {
  if (!props.cliente) return;
  const contacto = (props.cliente.contactos ?? []).find((c) => c.id === contactoId);
  const nombre = contacto ? contacto.nombre : 'este contacto';

  const confirmado = await dialogService.confirmar({
    titulo: 'ELIMINAR CONTACTO',
    subtitulo: 'REMOVER CONTACTO DEL CLIENTE',
    mensaje: `¿Confirma que desea eliminar el contacto de "${nombre}"?`,
    detalle: 'Se removerá de la ficha de la empresa.',
    textoConfirmar: 'ELIMINAR CONTACTO',
    textoCancelar: 'CANCELAR',
    tipo: 'peligro',
  });

  if (!confirmado) return;

  try {
    await clienteService.eliminarContacto(props.cliente.id, contactoId);
    actualizarCliente({
      contactos: (props.cliente.contactos ?? []).filter((c) => c.id !== contactoId),
    });
    toastService.exito('Contacto eliminado.');
    emit('actualizar');
  } catch (err: unknown) {
    toastService.error(err instanceof Error ? err.message : 'Error al eliminar contacto');
  }
};

const marcarPrincipal = async (contactoId: string) => {
  if (!props.cliente) return;
  try {
    await clienteService.marcarContactoPrincipal(props.cliente.id, contactoId);
    actualizarCliente({
      contactos: (props.cliente.contactos ?? []).map((c) => ({ ...c, es_principal: c.id === contactoId })),
    });
    toastService.exito('Contacto principal actualizado.');
    emit('actualizar');
  } catch (err: unknown) {
    toastService.error(err instanceof Error ? err.message : 'Error al actualizar contacto principal');
  }
};

// --- ESTADO PARA OPORTUNIDADES ---
const guardandoOportunidad = ref(false);
const mostrarFormOportunidad = ref(false);
const errorOportunidad = ref('');

const formularioOportunidad = reactive({
  titulo: '',
  monto: 150000,
  etapa: 'calificacion' as Oportunidad['etapa'],
  probabilidad: 40,
  fecha_cierre_estimada: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
});

const abrirFormularioOportunidad = () => {
  formularioOportunidad.titulo = '';
  formularioOportunidad.monto = 150000;
  formularioOportunidad.etapa = 'calificacion';
  formularioOportunidad.probabilidad = 40;
  formularioOportunidad.fecha_cierre_estimada = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  errorOportunidad.value = '';
  mostrarFormOportunidad.value = true;
};

const guardarOportunidad = async () => {
  if (!props.cliente) return;
  if (!formularioOportunidad.titulo.trim()) {
    errorOportunidad.value = 'El título de la oportunidad es requerido.';
    return;
  }
  if (formularioOportunidad.monto <= 0) {
    errorOportunidad.value = 'El monto debe ser superior a cero.';
    return;
  }

  guardandoOportunidad.value = true;
  errorOportunidad.value = '';
  try {
    const nuevaOp = await clienteService.agregarOportunidad(props.cliente.id, {
      titulo: formularioOportunidad.titulo.trim(),
      monto: Number(formularioOportunidad.monto),
      etapa: formularioOportunidad.etapa,
      probabilidad: Number(formularioOportunidad.probabilidad),
      fecha_cierre_estimada: formularioOportunidad.fecha_cierre_estimada,
    });

    const oportunidades = [nuevaOp, ...(props.cliente.oportunidades ?? [])];
    actualizarCliente({ oportunidades, valor_estimado: sumarMontos(oportunidades) });
    mostrarFormOportunidad.value = false;
    toastService.exito(`Oportunidad "${nuevaOp.titulo}" registrada exitosamente.`);
    emit('actualizar');
  } catch (err: unknown) {
    errorOportunidad.value = err instanceof Error ? err.message : 'Error al registrar oportunidad';
  } finally {
    guardandoOportunidad.value = false;
  }
};

const cambiarEtapaDeal = async (deal: Oportunidad, nuevaEtapa: Oportunidad['etapa']) => {
  if (!props.cliente) return;
  try {
    await clienteService.moverEtapaOportunidad(deal.id, nuevaEtapa);
    actualizarCliente({
      oportunidades: (props.cliente.oportunidades ?? []).map((o) =>
        o.id === deal.id ? { ...o, etapa: nuevaEtapa } : o
      ),
    });
    toastService.exito(`Oportunidad movida a ${nuevaEtapa}`);
    emit('actualizar');
  } catch {
    toastService.error('Error al actualizar etapa del trato.');
  }
};

const eliminarOportunidad = async (dealId: string) => {
  if (!props.cliente) return;
  const op = (props.cliente.oportunidades ?? []).find((o) => o.id === dealId);
  const titulo = op ? op.titulo : 'esta oportunidad';

  const confirmado = await dialogService.confirmar({
    titulo: 'ELIMINAR OPORTUNIDAD',
    subtitulo: 'REMOVER TRATO COMERCIAL DEL PIPELINE',
    mensaje: `¿Confirma que desea eliminar la oportunidad "${titulo}"?`,
    detalle: 'El valor estimado asociado se restará del total de la cuenta.',
    textoConfirmar: 'ELIMINAR OPORTUNIDAD',
    textoCancelar: 'CANCELAR',
    tipo: 'peligro',
  });

  if (!confirmado) return;

  try {
    await clienteService.eliminarOportunidad(props.cliente.id, dealId);
    const oportunidades = (props.cliente.oportunidades ?? []).filter((o) => o.id !== dealId);
    actualizarCliente({ oportunidades, valor_estimado: sumarMontos(oportunidades) });
    toastService.exito('Oportunidad eliminada.');
    emit('actualizar');
  } catch {
    toastService.error('Error al eliminar oportunidad.');
  }
};

// --- ESTADO PARA ACTIVIDADES (BITÁCORA) ---
const guardandoActividad = ref(false);
const mostrarFormActividad = ref(false);
const errorActividad = ref('');

const formularioActividad = reactive({
  tipo: 'llamada' as Actividad['tipo'],
  descripcion: '',
  realizado_por: '',
});

const abrirFormularioActividad = () => {
  formularioActividad.tipo = 'llamada';
  formularioActividad.descripcion = '';
  formularioActividad.realizado_por = props.cliente?.responsable || 'Equipo Comercial';
  errorActividad.value = '';
  mostrarFormActividad.value = true;
};

const guardarActividad = async () => {
  if (!props.cliente) return;
  if (!formularioActividad.descripcion.trim()) {
    errorActividad.value = 'Debe ingresar una descripción de la actividad realizada.';
    return;
  }

  guardandoActividad.value = true;
  errorActividad.value = '';
  try {
    const nuevaAct = await clienteService.agregarActividad(props.cliente.id, {
      tipo: formularioActividad.tipo,
      descripcion: formularioActividad.descripcion.trim(),
      realizado_por: formularioActividad.realizado_por.trim() || props.cliente.responsable,
    });

    actualizarCliente({
      actividades: [nuevaAct, ...(props.cliente.actividades ?? [])],
      ultimo_contacto: nuevaAct.fecha,
    });
    mostrarFormActividad.value = false;
    toastService.exito('Actividad registrada en la bitácora comercial.');
    emit('actualizar');
  } catch (err: unknown) {
    errorActividad.value = err instanceof Error ? err.message : 'Error al registrar actividad';
  } finally {
    guardandoActividad.value = false;
  }
};

const eliminarActividad = async (actividadId: string) => {
  if (!props.cliente) return;
  const confirmado = await dialogService.confirmar({
    titulo: 'ELIMINAR ANOTACIÓN',
    subtitulo: 'REMOVER REGISTRO DE BITÁCORA',
    mensaje: '¿Confirma que desea eliminar esta anotación de la bitácora comercial?',
    detalle: 'Este apunte del historial se borrará de forma permanente.',
    textoConfirmar: 'ELIMINAR ANOTACIÓN',
    textoCancelar: 'CANCELAR',
    tipo: 'peligro',
  });

  if (!confirmado) return;

  try {
    await clienteService.eliminarActividad(props.cliente.id, actividadId);
    actualizarCliente({
      actividades: (props.cliente.actividades ?? []).filter((a) => a.id !== actividadId),
    });
    toastService.exito('Anotación eliminada.');
    emit('actualizar');
  } catch {
    toastService.error('Error al eliminar anotación.');
  }
};

const cambiarEstado = (evento: Event) => {
  const nuevo = (evento.target as HTMLSelectElement).value as EstadoCliente;
  if (props.cliente) {
    emit('cambiarEstado', props.cliente.id, nuevo);
  }
};

const onClienteActualizado = (clienteActualizado: Cliente) => {
  actualizarCliente(clienteActualizado);
  emit('actualizar');
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
        'fixed top-0 right-0 h-full w-full max-w-xl bg-[#0e0e11] border-l border-white/[0.08] shadow-2xl z-50 transform transition-transform duration-200 ease-in-out flex flex-col',
        abierto ? 'translate-x-0' : 'translate-x-full'
      ]"
    >
      <template v-if="cliente">
        <!-- Cabecera del Drawer -->
        <div class="p-5 border-b border-white/[0.07] bg-[#0a0a0c]">
          <div class="flex items-center justify-between gap-3 mb-3">
            <div class="flex items-center gap-2">
              <span class="font-mono text-xs px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-white/[0.06]">
                {{ cliente?.codigo }}
              </span>
              <span v-if="cliente?.prioridad === 'alta'" class="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                <Sparkles class="w-3 h-3" />
                Cuenta Estratégica
              </span>
            </div>

            <!-- Botones de Acción Rápida y Cerrar -->
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                @click="modalEditarClienteAbierto = true"
                title="Editar Datos de la Empresa"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs rounded-lg transition border border-white/[0.08]"
              >
                <Edit3 class="w-3.5 h-3.5 text-zinc-400" />
                <span>Editar</span>
              </button>

              <button
                type="button"
                @click="cliente && emit('enviarDocumento', cliente)"
                title="Generar y Enviar Documento PDF Oficial por Correo"
                class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg transition shadow-sm shadow-emerald-950/40 border border-emerald-500/30 active:scale-95"
              >
                <Mail class="w-3.5 h-3.5" />
                <span>Enviar PDF</span>
              </button>

              <Can I="delete" an="Cliente">
                <button
                  @click="emit('eliminar', cliente?.id || '')"
                  title="Eliminar cliente (Solo Administrador)"
                  class="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/80 rounded-lg transition"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </Can>
              <button
                @click="emit('cerrar')"
                title="Cerrar panel"
                class="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 rounded-lg transition"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Razón Social y Nombre Comercial -->
          <h2 class="text-lg font-semibold text-white tracking-tight leading-snug">
            {{ cliente?.razon_social }}
          </h2>
          <p v-if="cliente?.nombre_comercial" class="text-xs text-zinc-400 mt-0.5">
            Nombre comercial: {{ cliente?.nombre_comercial }}
          </p>

          <!-- Selector de Estado Rápido -->
          <div class="mt-4 flex items-center gap-3 pt-3 border-t border-white/[0.06]">
            <span class="text-xs text-zinc-400 font-medium">Estado Comercial:</span>
            <Can I="update" an="Cliente">
              <select
                :value="cliente?.estado"
                @change="cambiarEstado"
                class="bg-zinc-950 border border-white/[0.08] text-xs font-medium rounded-lg px-2.5 py-1 text-zinc-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
              >
                <option value="prospecto">Prospecto</option>
                <option value="en_negociacion">En Negociación</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="cerrado_perdido">Cerrado Perdido</option>
              </select>
              <template #fallback>
                <span class="capitalize px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-medium text-xs">
                  {{ cliente?.estado }}
                </span>
              </template>
            </Can>
          </div>
        </div>

        <!-- Pestañas de Navegación del Drawer -->
        <div class="flex border-b border-white/[0.07] bg-[#0c0c0e]/80 text-xs">
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
            <div class="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div>
                <span class="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block mb-1">
                  Valor Estimado de Cartera
                </span>
                <div class="text-xl font-bold font-mono text-zinc-100 tabular-nums">
                  {{ formatCurrency(cliente?.valor_estimado) }}
                </div>
              </div>
              <button
                @click="modalEditarClienteAbierto = true"
                class="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-medium transition flex items-center gap-1.5"
              >
                <Edit3 class="w-3.5 h-3.5 text-emerald-400" />
                <span>Editar Datos</span>
              </button>
            </div>

            <!-- Fila de Datos Principales -->
            <div class="grid grid-cols-2 gap-3.5">
              <div class="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80">
                <span class="text-zinc-500 block mb-0.5">Identificación Fiscal (RNC)</span>
                <span class="font-mono font-medium text-zinc-200">{{ cliente?.identificacion_fiscal || 'Sin RNC' }}</span>
              </div>
              <div class="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80">
                <span class="text-zinc-500 block mb-0.5">Sector Económico</span>
                <span class="font-medium text-zinc-200">{{ cliente?.sector }}</span>
              </div>
              <div class="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80">
                <span class="text-zinc-500 block mb-0.5">Responsable Comercial</span>
                <span class="font-medium text-zinc-200 flex items-center gap-1.5">
                  <User class="w-3 h-3 text-zinc-400" />
                  {{ cliente?.responsable }}
                </span>
              </div>
              <div class="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80">
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
                <span class="font-mono">{{ formatPhoneNumber(cliente?.telefono) }}</span>
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
              <span>Registrado: {{ formatDate(cliente?.creado_en) }}</span>
              <span>Actualizado: {{ formatDate(cliente?.actualizado_en || cliente?.creado_en) }}</span>
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
                      <span class="font-mono">{{ formatPhoneNumber(contacto.telefono) }}</span>
                    </span>
                  </div>
                </div>
              </div>
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
                Esta empresa aún no cuenta con interlocutores asociados.
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
            <div class="flex items-center justify-between pb-1">
              <div class="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Briefcase class="w-3.5 h-3.5 text-emerald-400" />
                <span>Oportunidades Comerciales</span>
                <span class="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                  {{ cliente?.oportunidades?.length || 0 }}
                </span>
              </div>
              <button
                v-if="!mostrarFormOportunidad"
                type="button"
                @click="abrirFormularioOportunidad"
                class="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-medium transition shadow-sm"
              >
                <Plus class="w-3 h-3" />
                <span>+ Nueva Oportunidad</span>
              </button>
            </div>

            <!-- Formulario de Creación de Oportunidad -->
            <div v-if="mostrarFormOportunidad" class="bg-zinc-950 p-3.5 rounded-lg border border-emerald-500/40 space-y-3">
              <div class="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                <span class="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                  <Briefcase class="w-3.5 h-3.5 text-emerald-400" />
                  Nueva Oportunidad Comercial
                </span>
                <button
                  type="button"
                  @click="mostrarFormOportunidad = false"
                  class="text-zinc-500 hover:text-zinc-300"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>

              <div v-if="errorOportunidad" class="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                {{ errorOportunidad }}
              </div>

              <div>
                <label class="block text-zinc-400 text-[10px] mb-1 font-medium">Título del Trato *</label>
                <input
                  v-model="formularioOportunidad.titulo"
                  type="text"
                  placeholder="Ej: Licenciamiento Corporativo 2026"
                  class="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 text-xs focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div class="grid grid-cols-2 gap-2.5">
                <div>
                  <label class="block text-zinc-400 text-[10px] mb-1 font-medium">Monto Estimado (RD$) *</label>
                  <input
                    v-model.number="formularioOportunidad.monto"
                    type="number"
                    min="1"
                    class="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 text-xs font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label class="block text-zinc-400 text-[10px] mb-1 font-medium">Etapa Inicial</label>
                  <select
                    v-model="formularioOportunidad.etapa"
                    class="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 text-xs focus:outline-none focus:border-zinc-500 capitalize"
                  >
                    <option value="calificacion">Calificación</option>
                    <option value="propuesta">Propuesta Enviada</option>
                    <option value="negociacion">En Negociación</option>
                    <option value="ganada">Cerrada Ganada</option>
                    <option value="perdida">Cerrada Perdida</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2.5">
                <div>
                  <div class="flex justify-between text-[10px] text-zinc-400 mb-1">
                    <span>Probabilidad</span>
                    <span class="font-mono text-emerald-400 font-semibold">{{ formularioOportunidad.probabilidad }}%</span>
                  </div>
                  <input
                    v-model.number="formularioOportunidad.probabilidad"
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    class="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label class="block text-zinc-400 text-[10px] mb-1 font-medium">Cierre Estimado</label>
                  <input
                    v-model="formularioOportunidad.fecha_cierre_estimada"
                    type="date"
                    class="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 text-xs font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div class="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  @click="mostrarFormOportunidad = false"
                  class="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  @click="guardarOportunidad"
                  :disabled="guardandoOportunidad"
                  class="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-medium transition disabled:opacity-50"
                >
                  <Loader2 v-if="guardandoOportunidad" class="w-3 h-3 animate-spin" />
                  <Check v-else class="w-3 h-3" />
                  <span>{{ guardandoOportunidad ? 'Guardando...' : 'Guardar Oportunidad' }}</span>
                </button>
              </div>
            </div>

            <!-- Listado de Oportunidades Existentes -->
            <template v-if="cliente?.oportunidades && cliente?.oportunidades?.length > 0">
              <div class="space-y-3">
                <div
                  v-for="deal in cliente.oportunidades"
                  :key="deal.id"
                  class="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 flex flex-col gap-2 hover:border-zinc-700 transition"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="font-medium text-zinc-200 text-xs leading-snug">{{ deal.titulo }}</div>
                    <div class="flex items-center gap-1.5 shrink-0">
                      <span class="font-mono font-bold text-zinc-100 tabular-nums text-xs">
                        {{ formatCurrency(deal.monto) }}
                      </span>
                      <button
                        @click="eliminarOportunidad(deal.id)"
                        class="p-1 text-zinc-500 hover:text-rose-400 rounded transition"
                        title="Eliminar oportunidad"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div class="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-900">
                    <div class="flex items-center gap-1.5">
                      <span>Etapa:</span>
                      <select
                        :value="deal.etapa"
                        @change="(e) => cambiarEtapaDeal(deal, (e.target as HTMLSelectElement).value as any)"
                        class="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-[10px] text-zinc-200 capitalize cursor-pointer"
                      >
                        <option value="calificacion">Calificación</option>
                        <option value="propuesta">Propuesta Enviada</option>
                        <option value="negociacion">En Negociación</option>
                        <option value="ganada">Cerrada Ganada</option>
                        <option value="perdida">Cerrada Perdida</option>
                      </select>
                    </div>

                    <div class="flex items-center gap-1 text-zinc-500 font-mono text-[10px]">
                      <Calendar class="w-3 h-3" />
                      <span>Cierre: {{ formatDate(deal.fecha_cierre_estimada) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <div v-else-if="!mostrarFormOportunidad" class="text-center py-8 text-zinc-500">
              No existen oportunidades comerciales abiertas actualmente.
            </div>
          </div>

          <!-- Pestaña 4: Bitácora de Actividades -->
          <div v-else-if="pestanaActiva === 'actividades'" class="space-y-3">
            <div class="flex items-center justify-between pb-1">
              <div class="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <MessageSquare class="w-3.5 h-3.5 text-emerald-400" />
                <span>Historial de Interacciones & Notas</span>
                <span class="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                  {{ cliente?.actividades?.length || 0 }}
                </span>
              </div>
              <button
                v-if="!mostrarFormActividad"
                type="button"
                @click="abrirFormularioActividad"
                class="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-medium transition shadow-sm"
              >
                <Plus class="w-3 h-3" />
                <span>+ Registrar Actividad</span>
              </button>
            </div>

            <!-- Formulario de Registro de Actividad -->
            <div v-if="mostrarFormActividad" class="bg-zinc-950 p-3.5 rounded-lg border border-emerald-500/40 space-y-3">
              <div class="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                <span class="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                  <MessageSquare class="w-3.5 h-3.5 text-emerald-400" />
                  Registrar Nueva Actividad
                </span>
                <button
                  type="button"
                  @click="mostrarFormActividad = false"
                  class="text-zinc-500 hover:text-zinc-300"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>

              <div v-if="errorActividad" class="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                {{ errorActividad }}
              </div>

              <div class="grid grid-cols-2 gap-2.5">
                <div>
                  <label class="block text-zinc-400 text-[10px] mb-1 font-medium">Tipo de Actividad</label>
                  <select
                    v-model="formularioActividad.tipo"
                    class="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 text-xs focus:outline-none focus:border-zinc-500 capitalize"
                  >
                    <option value="llamada">Llamada Telefónica</option>
                    <option value="reunion">Reunión / Demostración</option>
                    <option value="correo">Correo Electrónico</option>
                    <option value="nota">Nota Interna</option>
                  </select>
                </div>

                <div>
                  <label class="block text-zinc-400 text-[10px] mb-1 font-medium">Realizado Por</label>
                  <input
                    v-model="formularioActividad.realizado_por"
                    type="text"
                    placeholder="Nombre del ejecutivo"
                    class="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 text-xs focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label class="block text-zinc-400 text-[10px] mb-1 font-medium">Detalle o Minuta de la Interacción *</label>
                <textarea
                  v-model="formularioActividad.descripcion"
                  rows="3"
                  placeholder="Ej: Se acordó enviar cotización actualizada y coordinar demo para el jueves..."
                  class="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 text-xs focus:outline-none focus:border-zinc-500 resize-none"
                ></textarea>
              </div>

              <div class="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  @click="mostrarFormActividad = false"
                  class="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  @click="guardarActividad"
                  :disabled="guardandoActividad"
                  class="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-medium transition disabled:opacity-50"
                >
                  <Loader2 v-if="guardandoActividad" class="w-3 h-3 animate-spin" />
                  <Check v-else class="w-3 h-3" />
                  <span>{{ guardandoActividad ? 'Guardando...' : 'Guardar en Bitácora' }}</span>
                </button>
              </div>
            </div>

            <!-- Listado de Actividades -->
            <template v-if="cliente?.actividades && cliente?.actividades?.length > 0">
              <div class="space-y-3">
                <div
                  v-for="actividad in cliente.actividades"
                  :key="actividad.id"
                  class="bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex flex-col gap-1.5 group hover:border-zinc-700 transition"
                >
                  <div class="flex items-center justify-between text-[11px]">
                    <div class="flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span class="uppercase font-semibold text-emerald-400 tracking-wider">
                        {{ actividad.tipo }}
                      </span>
                    </div>

                    <div class="flex items-center gap-2">
                      <span class="text-zinc-500 font-mono text-[10px]">
                        {{ formatDate(actividad.fecha, 'datetime') }}
                      </span>
                      <button
                        @click="eliminarActividad(actividad.id)"
                        class="p-0.5 text-zinc-500 hover:text-rose-400 rounded transition"
                        title="Eliminar anotación"
                      >
                        <Trash2 class="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <p class="text-zinc-300 leading-relaxed text-xs">
                    {{ actividad.descripcion }}
                  </p>

                  <div class="text-[10px] text-zinc-500 text-right">
                    Por: {{ actividad.realizado_por }}
                  </div>
                </div>
              </div>
            </template>
            <div v-else-if="!mostrarFormActividad" class="text-center py-8 text-zinc-500">
              Sin registros en la bitácora de actividad comercial.
            </div>
          </div>
        </div>

        <!-- Pie del Drawer -->
        <div class="p-3 border-t border-zinc-800 bg-zinc-950/80 flex justify-between items-center">
          <span class="text-[11px] text-zinc-500 font-mono">
            ID: {{ cliente.id }}
          </span>
          <button
            @click="emit('cerrar')"
            class="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-md transition text-xs"
          >
            Cerrar
          </button>
        </div>
      </template>
    </aside>

    <!-- Modal para Editar Datos Completos del Cliente -->
    <EditarClienteModal
      v-if="modalEditarClienteAbierto"
      :abierto="modalEditarClienteAbierto"
      :cliente="cliente"
      @cerrar="modalEditarClienteAbierto = false"
      @actualizado="onClienteActualizado"
    />
  </div>
</template>
