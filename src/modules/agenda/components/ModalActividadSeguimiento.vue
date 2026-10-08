<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { clienteService } from '@/modules/clientes/services/cliente.service';
import { actividadesService } from '../services/actividades.service';
import type { 
  TipoActividad, 
  PrioridadActividad, 
  ActividadSeguimiento,
  NuevaActividadInput 
} from '../types/actividad.types';
import type { Cliente } from '@/modules/clientes/types/cliente.types';
import { 
  X, 
  CalendarClock, 
  Phone, 
  Users, 
  Video, 
  Mail, 
  CheckSquare, 
  FileText, 
  AlertCircle,
  Building2,
  Calendar,
  Sparkles
} from 'lucide-vue-next';

const props = defineProps<{
  abierto: boolean;
  clientePreseleccionadoId?: string;
  tarjetaPreseleccionadaId?: string;
  pipelineId?: string;
  actividadId?: string;
}>();

const emit = defineEmits<{
  (e: 'update:abierto', valor: boolean): void;
  (e: 'guardada', actividad: ActividadSeguimiento): void;
  (e: 'cerrar'): void;
}>();

const clientes = ref<Cliente[]>([]);
const cargandoClientes = ref(false);

// Formulario reactivo
const clienteId = ref('');
const clienteNombre = ref('');
const clienteSector = ref('');
const titulo = ref('');
const descripcion = ref('');
const tipo = ref<TipoActividad>('llamada');
const prioridad = ref<PrioridadActividad>('alta');
const fechaLimite = ref('');
const responsable = ref('Camila Morales');
const errorValidacion = ref('');

// Cargar catálogo de clientes
const cargarCatalogo = async () => {
  cargandoClientes.value = true;
  try {
    clientes.value = await clienteService.obtenerTodosLosClientes();
  } catch (err) {
    console.error('Error al cargar lista de clientes:', err);
  } finally {
    cargandoClientes.value = false;
  }
};

onMounted(() => {
  cargarCatalogo();
});

// Sincronizar estado inicial al abrir
watch(
  () => props.abierto,
  async (abierto) => {
    if (!abierto) return;

    errorValidacion.value = '';

    // Si viene para edición
    if (props.actividadId) {
      const act = actividadesService.obtenerActividadPorId(props.actividadId);
      if (act) {
        clienteId.value = act.clienteId;
        clienteNombre.value = act.clienteNombre;
        clienteSector.value = act.clienteSector || '';
        titulo.value = act.titulo;
        descripcion.value = act.descripcion || '';
        tipo.value = act.tipo;
        prioridad.value = act.prioridad;
        fechaLimite.value = act.fechaLimite.slice(0, 16);
        responsable.value = act.responsable;
        return;
      }
    }

    // Si viene con cliente preseleccionado
    if (props.clientePreseleccionadoId) {
      if (clientes.value.length === 0) {
        await cargarCatalogo();
      }
      const cli = clientes.value.find((c) => c.id === props.clientePreseleccionadoId);
      if (cli) {
        clienteId.value = cli.id;
        clienteNombre.value = cli.nombre_comercial || cli.razon_social;
        clienteSector.value = cli.sector;
      } else {
        clienteId.value = props.clientePreseleccionadoId;
        clienteNombre.value = 'Cliente Seleccionado';
      }
    } else {
      clienteId.value = '';
      clienteNombre.value = '';
      clienteSector.value = '';
    }

    // Valores predeterminados para nueva actividad
    titulo.value = '';
    descripcion.value = '';
    tipo.value = 'llamada';
    prioridad.value = 'alta';
    responsable.value = 'Camila Morales';

    // Fecha límite predeterminada: Mañana a las 10:00 AM
    const manana = new Date(Date.now() + 86400000);
    manana.setHours(10, 0, 0, 0);
    const tzOffset = manana.getTimezoneOffset() * 60000;
    const localIso = new Date(manana.getTime() - tzOffset).toISOString().slice(0, 16);
    fechaLimite.value = localIso;
  },
  { immediate: true }
);

// Manejar selección de cliente
const alCambiarCliente = () => {
  const cli = clientes.value.find((c) => c.id === clienteId.value);
  if (cli) {
    clienteNombre.value = cli.nombre_comercial || cli.razon_social;
    clienteSector.value = cli.sector;
  }
};

// Plantillas de título rápido
const aplicarPlantilla = (plantillaTitulo: string, tipoPlantilla: TipoActividad) => {
  titulo.value = plantillaTitulo;
  tipo.value = tipoPlantilla;
};

// Opciones de tipos de actividad
const tiposDisponibles = [
  { valor: 'llamada', etiqueta: 'Llamada Telefónica', icono: Phone },
  { valor: 'reunion', etiqueta: 'Reunión Presencial', icono: Users },
  { valor: 'videollamada', etiqueta: 'Videollamada Online', icono: Video },
  { valor: 'correo', etiqueta: 'Envío de Correo', icono: Mail },
  { valor: 'propuesta', etiqueta: 'Presentación Propuesta', icono: FileText },
  { valor: 'tarea', etiqueta: 'Tarea Operativa', icono: CheckSquare },
];

const prioridades = [
  { valor: 'alta', etiqueta: 'Alta', clase: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  { valor: 'media', etiqueta: 'Media', clase: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  { valor: 'baja', etiqueta: 'Baja', clase: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20' },
];

const cerrarModal = () => {
  emit('update:abierto', false);
  emit('cerrar');
};

const guardar = () => {
  if (!clienteId.value) {
    errorValidacion.value = 'Debe seleccionar un cliente destinatario.';
    return;
  }
  if (!titulo.value.trim()) {
    errorValidacion.value = 'El título de la actividad es obligatorio.';
    return;
  }
  if (!fechaLimite.value) {
    errorValidacion.value = 'Debe establecer la fecha y hora límite de cumplimiento.';
    return;
  }

  errorValidacion.value = '';

  const fechaIso = new Date(fechaLimite.value).toISOString();

  let actividadGuardada: ActividadSeguimiento;

  if (props.actividadId) {
    actividadGuardada = actividadesService.actualizarActividad(props.actividadId, {
      titulo: titulo.value.trim(),
      descripcion: descripcion.value.trim(),
      tipo: tipo.value,
      prioridad: prioridad.value,
      fechaLimite: fechaIso,
      responsable: responsable.value.trim(),
    });
  } else {
    const input: NuevaActividadInput = {
      clienteId: clienteId.value,
      clienteNombre: clienteNombre.value,
      clienteSector: clienteSector.value,
      tarjetaId: props.tarjetaPreseleccionadaId,
      pipelineId: props.pipelineId,
      titulo: titulo.value.trim(),
      descripcion: descripcion.value.trim(),
      tipo: tipo.value,
      prioridad: prioridad.value,
      fechaLimite: fechaIso,
      responsable: responsable.value.trim(),
    };
    actividadGuardada = actividadesService.crearActividad(input);
  }

  emit('guardada', actividadGuardada);
  cerrarModal();
};
</script>

<template>
  <div
    v-if="abierto"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    @click.self="cerrarModal"
  >
    <div
      class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all"
    >
      <!-- Cabecera -->
      <div class="px-6 py-4 border-b border-zinc-200 dark:border-white/[0.06] flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <CalendarClock class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {{ actividadId ? 'Editar Actividad Comercial' : 'Programar Próxima Acción (Next Step)' }}
            </h3>
            <p class="text-xs text-zinc-500 dark:text-zinc-400">
              Establece recordatorios y compromisos para dinamizar la relación comercial
            </p>
          </div>
        </div>

        <button
          @click="cerrarModal"
          class="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Cuerpo del Formulario -->
      <div class="p-6 overflow-y-auto space-y-4 text-xs">
        <!-- Alerta de validación si existe -->
        <div
          v-if="errorValidacion"
          class="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-center gap-2"
        >
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ errorValidacion }}</span>
        </div>

        <!-- Selección de Cliente -->
        <div>
          <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
            <span class="flex items-center gap-1.5">
              <Building2 class="w-3.5 h-3.5 text-indigo-500" />
              Empresa / Cliente B2B *
            </span>
            <span v-if="clienteSector" class="text-[11px] text-zinc-400">
              Sector: {{ clienteSector }}
            </span>
          </label>

          <div v-if="clientePreseleccionadoId" class="p-2.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-white/[0.06] flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="font-medium text-zinc-900 dark:text-zinc-100">{{ clienteNombre }}</span>
              <span v-if="clienteSector" class="px-1.5 py-0.5 rounded text-[10px] bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                {{ clienteSector }}
              </span>
            </div>
            <span class="text-[10px] text-zinc-400">Preseleccionado</span>
          </div>

          <select
            v-else
            v-model="clienteId"
            @change="alCambiarCliente"
            class="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/[0.08] rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          >
            <option value="" disabled>Seleccione un cliente corporativo...</option>
            <option v-for="c in clientes" :key="c.id" :value="c.id">
              {{ c.nombre_comercial || c.razon_social }} ({{ c.sector }})
            </option>
          </select>
        </div>

        <!-- Plantillas Rápidas de Título -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
              <Sparkles class="w-3.5 h-3.5 text-amber-500" />
              Plantillas Rápidas
            </label>
            <span class="text-[10px] text-zinc-400">Clic para rellenar</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button
              type="button"
              @click="aplicarPlantilla('Llamar para verificar recepción de propuesta', 'llamada')"
              class="px-2 py-1 bg-zinc-100 dark:bg-zinc-800/70 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-white/[0.05] rounded-lg text-[11px] text-zinc-700 dark:text-zinc-300 transition"
            >
              📞 Verificar propuesta
            </button>
            <button
              type="button"
              @click="aplicarPlantilla('Reunión presencial de negociación y cierre', 'reunion')"
              class="px-2 py-1 bg-zinc-100 dark:bg-zinc-800/70 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-white/[0.05] rounded-lg text-[11px] text-zinc-700 dark:text-zinc-300 transition"
            >
              🤝 Reunión de cierre
            </button>
            <button
              type="button"
              @click="aplicarPlantilla('Videollamada de demostración técnica de plataforma', 'videollamada')"
              class="px-2 py-1 bg-zinc-100 dark:bg-zinc-800/70 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-white/[0.05] rounded-lg text-[11px] text-zinc-700 dark:text-zinc-300 transition"
            >
              💻 Demo técnica
            </button>
            <button
              type="button"
              @click="aplicarPlantilla('Enviar cotización formal con RNC y NCF', 'propuesta')"
              class="px-2 py-1 bg-zinc-100 dark:bg-zinc-800/70 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-white/[0.05] rounded-lg text-[11px] text-zinc-700 dark:text-zinc-300 transition"
            >
              📄 Enviar cotización
            </button>
          </div>
        </div>

        <!-- Título de la Actividad -->
        <div>
          <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Título de la Actividad o Tarea *
          </label>
          <input
            v-model="titulo"
            type="text"
            placeholder="Ej: Llamada de seguimiento al Gerente de TI"
            class="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/[0.08] rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
        </div>

        <!-- Tipo de Actividad y Prioridad en 2 Columnas -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Tipo de Compromiso
            </label>
            <select
              v-model="tipo"
              class="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/[0.08] rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 capitalize"
            >
              <option v-for="t in tiposDisponibles" :key="t.valor" :value="t.valor">
                {{ t.etiqueta }}
              </option>
            </select>
          </div>

          <div>
            <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Nivel de Prioridad
            </label>
            <div class="flex items-center gap-1.5">
              <button
                v-for="p in prioridades"
                :key="p.valor"
                type="button"
                @click="prioridad = p.valor as PrioridadActividad"
                class="flex-1 py-2 px-2 text-center rounded-xl border text-[11px] font-medium transition"
                :class="[
                  prioridad === p.valor
                    ? p.clase + ' ring-2 ring-indigo-500/20 font-semibold'
                    : 'bg-zinc-100 dark:bg-zinc-950 border-zinc-200 dark:border-white/[0.06] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                ]"
              >
                {{ p.etiqueta }}
              </button>
            </div>
          </div>
        </div>

        <!-- Fecha y Hora Límite y Responsable -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Calendar class="w-3.5 h-3.5 text-zinc-400" />
              Fecha y Hora Límite *
            </label>
            <input
              v-model="fechaLimite"
              type="datetime-local"
              class="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/[0.08] rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>

          <div>
            <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Ejecutivo Responsable
            </label>
            <select
              v-model="responsable"
              class="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/[0.08] rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            >
              <option value="Camila Morales">Camila Morales</option>
              <option value="Jean Carlos Peña">Jean Carlos Peña</option>
              <option value="Lic. Luis Taveras">Lic. Luis Taveras</option>
            </select>
          </div>
        </div>

        <!-- Notas / Objetivo esperado -->
        <div>
          <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Notas u Objetivo Esperado
          </label>
          <textarea
            v-model="descripcion"
            rows="3"
            placeholder="Especifica los puntos clave a tratar o el resultado esperado tras el contacto..."
            class="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/[0.08] rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 resize-none"
          ></textarea>
        </div>
      </div>

      <!-- Pie de acciones -->
      <div class="px-6 py-3 border-t border-zinc-200 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-end gap-2.5">
        <button
          type="button"
          @click="cerrarModal"
          class="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          Cerrar
        </button>
        <button
          type="button"
          @click="guardar"
          class="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition flex items-center gap-1.5"
        >
          <CalendarClock class="w-4 h-4" />
          <span>{{ actividadId ? 'Guardar Cambios' : 'Programar Actividad' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
