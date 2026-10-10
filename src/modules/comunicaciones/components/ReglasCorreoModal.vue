<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  X,
  Plus,
  Trash2,
  SlidersHorizontal,
  Play,
  CheckCircle2,
  Folder,
  Star,
  Building2,
  Sparkles
} from 'lucide-vue-next';
import { reglasCorreoService } from '../services/reglas-correo.service';
import type {
  ReglaCorreo,
  CampoCondicionRegla,
  OperadorCondicionRegla,
  CarpetaPersonalizada,
  ResumenEjecucionReglas
} from '../types/reglas-correo.types';
import type { MensajeCorreo } from '../types/webmail.types';
import { toastService } from '@/core/notifications/toast.service';
import AppSelect, { type SelectOption } from '@/shared/components/AppSelect.vue';

const opcionesOperadorLogico: SelectOption<'AND' | 'OR'>[] = [
  { value: 'OR', label: 'Cualquier condición (OR)' },
  { value: 'AND', label: 'Todas las condiciones (AND)' },
];

const props = defineProps<{
  abierto: boolean;
  mensajesActuales?: MensajeCorreo[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'reglas-actualizadas'): void;
  (e: 'ejecutar-reglas', resumen: ResumenEjecucionReglas): void;
}>();

// Estado
const reglas = ref<ReglaCorreo[]>([]);
const carpetasPersonalizadas = ref<CarpetaPersonalizada[]>([]);
const vistaFormulario = ref(false);
const ejecutando = ref(false);
const resumenEjecucion = ref<ResumenEjecucionReglas | null>(null);

// Formulario de edición / creación
const reglaEditandoId = ref<string | null>(null);
const formNombre = ref('');
const formOperadorLogico = ref<'AND' | 'OR'>('OR');
const formCondiciones = ref<
  { id: string; campo: CampoCondicionRegla; operador: OperadorCondicionRegla; valor: string }[]
>([]);
const formCarpetaDestino = ref('inbox');
const formCrearNuevaCarpeta = ref(false);
const formNuevoNombreCarpeta = ref('');
const formNuevoColorCarpeta = ref<CarpetaPersonalizada['color']>('indigo');
const formMarcarDestacado = ref(false);
const formMarcarLeido = ref(false);
const formVincularCliente = ref(false);
const formNombreCliente = ref('');

const opcionesCampos: { valor: CampoCondicionRegla; etiqueta: string; ejemplo: string }[] = [
  { valor: 'dominio_remitente', etiqueta: 'Dominio del remitente', ejemplo: 'ej. @verafeca.com o empresa.com' },
  { valor: 'correo_remitente', etiqueta: 'Correo exacto del remitente', ejemplo: 'ej. facturas@empresa.com' },
  { valor: 'nombre_remitente', etiqueta: 'Nombre del remitente', ejemplo: 'ej. Juan Pérez o Banco BHD' },
  { valor: 'asunto_contiene', etiqueta: 'Asunto contiene palabra', ejemplo: 'ej. Factura, Cotización, Urgente' },
  { valor: 'cuerpo_contiene', etiqueta: 'Cuerpo del correo contiene', ejemplo: 'ej. Comprobante, Orden de compra' },
  { valor: 'tiene_adjuntos', etiqueta: 'Tiene archivos adjuntos', ejemplo: 'Sin valor necesario' },
];

const opcionesOperadores: { valor: OperadorCondicionRegla; etiqueta: string }[] = [
  { valor: 'contiene', etiqueta: 'Contiene' },
  { valor: 'termina_en', etiqueta: 'Termina en (ej: dominio)' },
  { valor: 'es_igual_a', etiqueta: 'Es exactamente igual a' },
  { valor: 'no_contiene', etiqueta: 'No contiene' },
];

const coloresCarpeta: { valor: CarpetaPersonalizada['color']; etiqueta: string; bg: string }[] = [
  { valor: 'indigo', etiqueta: 'Índigo', bg: 'bg-indigo-500' },
  { valor: 'emerald', etiqueta: 'Esmeralda', bg: 'bg-emerald-500' },
  { valor: 'amber', etiqueta: 'Ámbar', bg: 'bg-amber-500' },
  { valor: 'rose', etiqueta: 'Rosa', bg: 'bg-rose-500' },
  { valor: 'purple', etiqueta: 'Púrpura', bg: 'bg-purple-500' },
  { valor: 'sky', etiqueta: 'Cielo', bg: 'bg-sky-500' },
];

const cargarDatos = () => {
  reglas.value = reglasCorreoService.obtenerReglas();
  carpetasPersonalizadas.value = reglasCorreoService.obtenerCarpetasPersonalizadas();
};

onMounted(() => {
  cargarDatos();
});

const todasLasCarpetas = computed(() => {
  const estandar = [
    { id: 'inbox', nombre: 'Bandeja de entrada (Inbox)', color: 'indigo' },
    { id: 'archivados', nombre: 'Archivados', color: 'purple' },
    { id: 'papelera', nombre: 'Papelera', color: 'rose' },
  ];
  const personalizadas = carpetasPersonalizadas.value.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    color: c.color,
  }));
  return [...estandar, ...personalizadas];
});

const abrirCrearRegla = () => {
  reglaEditandoId.value = null;
  formNombre.value = '';
  formOperadorLogico.value = 'OR';
  formCondiciones.value = [
    {
      id: `cond-${Date.now()}`,
      campo: 'dominio_remitente',
      operador: 'contiene',
      valor: '',
    },
  ];
  formCarpetaDestino.value = carpetasPersonalizadas.value[0]?.id || 'inbox';
  formCrearNuevaCarpeta.value = false;
  formNuevoNombreCarpeta.value = '';
  formNuevoColorCarpeta.value = 'indigo';
  formMarcarDestacado.value = false;
  formMarcarLeido.value = false;
  formVincularCliente.value = false;
  formNombreCliente.value = '';
  resumenEjecucion.value = null;
  vistaFormulario.value = true;
};

const editarRegla = (r: ReglaCorreo) => {
  reglaEditandoId.value = r.id;
  formNombre.value = r.nombre;
  formOperadorLogico.value = r.operadorLogico;
  formCondiciones.value = r.condiciones.map((c) => ({ ...c }));
  formCarpetaDestino.value = r.acciones.moverACarpeta || 'inbox';
  formCrearNuevaCarpeta.value = false;
  formNuevoNombreCarpeta.value = '';
  formMarcarDestacado.value = Boolean(r.acciones.marcarDestacado);
  formMarcarLeido.value = Boolean(r.acciones.marcarLeido);
  formVincularCliente.value = Boolean(r.acciones.vincularClienteNombre);
  formNombreCliente.value = r.acciones.vincularClienteNombre || '';
  resumenEjecucion.value = null;
  vistaFormulario.value = true;
};

const agregarCondicion = () => {
  formCondiciones.value.push({
    id: `cond-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    campo: 'asunto_contiene',
    operador: 'contiene',
    valor: '',
  });
};

const eliminarCondicion = (index: number) => {
  if (formCondiciones.value.length > 1) {
    formCondiciones.value.splice(index, 1);
  }
};

const toggleRegla = (id: string, activa: boolean) => {
  reglasCorreoService.toggleRegla(id, activa);
  cargarDatos();
  emit('reglas-actualizadas');
  toastService.info(activa ? 'Regla activada.' : 'Regla pausada.');
};

const eliminarRegla = (id: string) => {
  reglasCorreoService.eliminarRegla(id);
  cargarDatos();
  emit('reglas-actualizadas');
  toastService.exito('Regla eliminada exitosamente.');
};

const guardarRegla = () => {
  if (!formNombre.value.trim()) {
    toastService.advertencia('Por favor ingresa un nombre para la regla.');
    return;
  }

  // Validar condiciones
  const condicionesValidas = formCondiciones.value.filter(
    (c) => c.campo === 'tiene_adjuntos' || c.valor.trim().length > 0
  );

  if (condicionesValidas.length === 0) {
    toastService.advertencia('Debes configurar al menos una condición con valor.');
    return;
  }

  let destinoFinal = formCarpetaDestino.value;
  let nombreDestino = todasLasCarpetas.value.find((c) => c.id === destinoFinal)?.nombre;

  // Si se eligió crear nueva carpeta
  if (formCrearNuevaCarpeta.value && formNuevoNombreCarpeta.value.trim()) {
    const nueva = reglasCorreoService.crearCarpetaPersonalizada(
      formNuevoNombreCarpeta.value.trim(),
      formNuevoColorCarpeta.value
    );
    destinoFinal = nueva.id;
    nombreDestino = nueva.nombre;
  }

  reglasCorreoService.guardarRegla({
    id: reglaEditandoId.value || undefined,
    nombre: formNombre.value.trim(),
    activa: true,
    operadorLogico: formOperadorLogico.value,
    condiciones: condicionesValidas,
    acciones: {
      moverACarpeta: destinoFinal,
      nombreCarpetaDestino: nombreDestino,
      marcarDestacado: formMarcarDestacado.value,
      marcarLeido: formMarcarLeido.value,
      vincularClienteNombre: formVincularCliente.value && formNombreCliente.value.trim() 
        ? formNombreCliente.value.trim() 
        : undefined,
    },
  });

  cargarDatos();
  vistaFormulario.value = false;
  emit('reglas-actualizadas');
  toastService.exito(reglaEditandoId.value ? 'Regla actualizada exitosamente.' : 'Nueva regla creada exitosamente.');
};

const ejecutarReglasAhora = async () => {
  if (!props.mensajesActuales || props.mensajesActuales.length === 0) {
    toastService.advertencia('No hay correos cargados para evaluar en este momento.');
    return;
  }

  try {
    ejecutando.value = true;
    const resumen = await reglasCorreoService.ejecutarReglasLote(props.mensajesActuales);
    resumenEjecucion.value = resumen;
    cargarDatos();
    emit('ejecutar-reglas', resumen);

    if (resumen.totalModificados > 0) {
      toastService.exito(
        `Se organizaron ${resumen.totalModificados} correo(s) automáticamente.`
      );
    } else {
      toastService.info('Se evaluaron los correos. Ninguno requirió reorganización.');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    toastService.error(`Error al ejecutar reglas: ${msg}`);
  } finally {
    ejecutando.value = false;
  }
};
</script>

<template>
  <div
    v-if="abierto"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm transition-opacity"
    @click.self="emit('close')"
  >
    <div
      class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-all text-zinc-900 dark:text-zinc-100"
    >
      <!-- Cabecera del Modal -->
      <div class="px-6 py-4.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-950/50">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <SlidersHorizontal class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-bold text-base tracking-tight flex items-center gap-2">
              <span>Reglas de Organización Automática</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                Filtros Inteligentes
              </span>
            </h3>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Enruta automáticamente correos por dominio de cliente, palabras clave o remitente a carpetas dedicadas.
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="emit('close')"
          class="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          aria-label="Cerrar modal"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Resumen de ejecución retroactiva si ocurrió -->
      <div
        v-if="resumenEjecucion && resumenEjecucion.totalModificados > 0"
        class="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl flex items-start gap-3"
      >
        <CheckCircle2 class="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div class="text-xs space-y-1">
          <div class="font-semibold text-emerald-800 dark:text-emerald-300">
            ¡Reglas ejecutadas! Se organizaron {{ resumenEjecucion.totalModificados }} de {{ resumenEjecucion.totalEvaluados }} correos evaluados:
          </div>
          <div class="flex flex-wrap gap-2 pt-1">
            <span
              v-for="det in resumenEjecucion.detallesPorRegla"
              :key="det.reglaId"
              class="px-2 py-0.5 rounded-md bg-emerald-100/70 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-medium text-[11px]"
            >
              {{ det.reglaNombre }}: {{ det.mensajesAfectados }} correo(s) → {{ det.carpetaDestino }}
            </span>
          </div>
        </div>
      </div>

      <!-- Cuerpo Principal: Lista vs Formulario -->
      <div class="p-6 overflow-y-auto flex-1 space-y-5">
        <!-- ==================== VISTA: LISTA DE REGLAS ==================== -->
        <div v-if="!vistaFormulario" class="space-y-4">
          <!-- Barra de Acciones de la Lista -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div class="text-xs text-zinc-500 dark:text-zinc-400">
              <span class="font-bold text-zinc-900 dark:text-zinc-100">{{ reglas.length }}</span> regla(s) configurada(s).
              Se evalúan automáticamente al recibir o sincronizar correos.
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="ejecutarReglasAhora"
                :disabled="ejecutando || !mensajesActuales || mensajesActuales.length === 0"
                class="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-semibold transition disabled:opacity-50"
                title="Aplica todas las reglas activas a los correos cargados en la bandeja"
              >
                <Play :class="['w-3.5 h-3.5 text-indigo-500', ejecutando ? 'animate-spin' : '']" />
                <span>{{ ejecutando ? 'Procesando...' : 'Ejecutar ahora' }}</span>
              </button>

              <button
                type="button"
                @click="abrirCrearRegla"
                class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-sm"
              >
                <Plus class="w-4 h-4" />
                <span>Nueva Regla</span>
              </button>
            </div>
          </div>

          <!-- Listado de tarjetas de reglas -->
          <div v-if="reglas.length === 0" class="text-center py-12 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl p-8">
            <SlidersHorizontal class="w-10 h-10 text-zinc-400 mx-auto mb-3 opacity-60" />
            <h4 class="font-semibold text-sm text-zinc-800 dark:text-zinc-200">No tienes reglas configuradas</h4>
            <p class="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
              Crea tu primera regla para mover automáticamente correos de clientes como @verafeca.com a su propia carpeta.
            </p>
            <button
              type="button"
              @click="abrirCrearRegla"
              class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow"
            >
              <Plus class="w-4 h-4" />
              <span>Crear Regla Ahora</span>
            </button>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="regla in reglas"
              :key="regla.id"
              class="p-4 rounded-xl border transition-all"
              :class="regla.activa 
                ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-500/40 shadow-sm' 
                : 'bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800/80 opacity-60'"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-2 flex-1">
                  <!-- Título y Switches -->
                  <div class="flex items-center gap-2.5 flex-wrap">
                    <span class="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {{ regla.nombre }}
                    </span>
                    <span
                      class="text-[10px] px-2 py-0.5 rounded-full font-semibold border"
                      :class="regla.activa 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' 
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'"
                    >
                      {{ regla.activa ? 'Activa' : 'Pausada' }}
                    </span>
                    <span v-if="regla.totalAplicados > 0" class="text-[10px] text-zinc-400 font-mono">
                      Aplicada {{ regla.totalAplicados }} vez/veces
                    </span>
                  </div>

                  <!-- Condiciones resumen -->
                  <div class="text-xs flex flex-wrap items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                    <span class="text-zinc-400 text-[11px]">Si</span>
                    <span
                      v-for="(c, idx) in regla.condiciones"
                      :key="c.id"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono"
                    >
                      <span class="text-zinc-500">{{ c.campo.replace('_', ' ') }}:</span>
                      <strong class="text-indigo-600 dark:text-indigo-400">{{ c.valor || 'sí' }}</strong>
                      <span v-if="idx < regla.condiciones.length - 1" class="text-zinc-400 font-bold ml-1">
                        {{ regla.operadorLogico }}
                      </span>
                    </span>
                  </div>

                  <!-- Acciones resumen -->
                  <div class="text-xs flex flex-wrap items-center gap-2 pt-1 text-zinc-500 dark:text-zinc-400">
                    <span class="text-zinc-400 text-[11px]">Entonces:</span>
                    <span
                      v-if="regla.acciones.moverACarpeta"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium border border-indigo-200/60 dark:border-indigo-500/20"
                    >
                      <Folder class="w-3 h-3 text-indigo-500" />
                      <span>Mover a {{ regla.acciones.nombreCarpetaDestino || regla.acciones.moverACarpeta }}</span>
                    </span>

                    <span
                      v-if="regla.acciones.marcarDestacado"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-medium border border-amber-200/60 dark:border-amber-500/20"
                    >
                      <Star class="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>Marcar destacado</span>
                    </span>

                    <span
                      v-if="regla.acciones.vincularClienteNombre"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium border border-emerald-200/60 dark:border-emerald-500/20"
                    >
                      <Building2 class="w-3 h-3 text-emerald-500" />
                      <span>Vincular con {{ regla.acciones.vincularClienteNombre }}</span>
                    </span>
                  </div>
                </div>

                <!-- Botones de Acción sobre la regla -->
                <div class="flex items-center gap-1 shrink-0">
                  <!-- Toggle Activa -->
                  <button
                    type="button"
                    @click="toggleRegla(regla.id, !regla.activa)"
                    class="p-2 rounded-xl border text-xs font-semibold transition"
                    :class="regla.activa 
                      ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700' 
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20'"
                    :title="regla.activa ? 'Pausar regla' : 'Activar regla'"
                  >
                    {{ regla.activa ? 'Pausar' : 'Activar' }}
                  </button>

                  <button
                    type="button"
                    @click="editarRegla(regla)"
                    class="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
                    title="Editar regla"
                  >
                    <SlidersHorizontal class="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    @click="eliminarRegla(regla.id)"
                    class="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                    title="Eliminar regla"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== VISTA: FORMULARIO CREAR / EDITAR ==================== -->
        <div v-else class="space-y-6">
          <div class="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <h4 class="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              {{ reglaEditandoId ? 'Editar Regla de Correo' : 'Nueva Regla de Organización' }}
            </h4>
            <button
              type="button"
              @click="vistaFormulario = false"
              class="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Volver al listado
            </button>
          </div>

          <!-- Nombre de la regla -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Nombre de la regla *
            </label>
            <input
              type="text"
              v-model="formNombre"
              placeholder="ej. Organizar correos de @verafeca.com"
              class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <!-- Condiciones -->
          <div class="space-y-3 p-4 bg-zinc-50/70 dark:bg-zinc-950/60 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Condiciones de coincidencia
              </span>
              <div class="flex items-center gap-2">
                <span class="text-[11px] text-zinc-500">Evaluar:</span>
              <AppSelect
                v-model="formOperadorLogico"
                :options="opcionesOperadorLogico"
                size="sm"
              />
              </div>
            </div>

            <!-- Filas de condiciones -->
            <div class="space-y-2.5">
              <div
                v-for="(cond, idx) in formCondiciones"
                :key="cond.id"
                class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800"
              >
                <!-- Campo -->
                <AppSelect
                  v-model="cond.campo"
                  :options="opcionesCampos.map(o => ({ value: o.valor, label: o.etiqueta }))"
                  size="sm"
                  minWidthClass="min-w-[190px]"
                />

                <!-- Operador -->
                <AppSelect
                  v-model="cond.operador"
                  :options="opcionesOperadores.map(o => ({ value: o.valor, label: o.etiqueta }))"
                  :disabled="cond.campo === 'tiene_adjuntos'"
                  size="sm"
                  minWidthClass="min-w-[170px]"
                />

                <!-- Valor -->
                <input
                  v-if="cond.campo !== 'tiene_adjuntos'"
                  type="text"
                  v-model="cond.valor"
                  :placeholder="opcionesCampos.find(c => c.valor === cond.campo)?.ejemplo || 'Valor a comparar'"
                  class="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <div v-else class="flex-1 text-xs text-zinc-400 italic px-2">
                  Aplica si el correo trae al menos un archivo adjunto
                </div>

                <!-- Eliminar condición -->
                <button
                  type="button"
                  @click="eliminarCondicion(idx)"
                  :disabled="formCondiciones.length <= 1"
                  class="p-2 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition disabled:opacity-30 self-end sm:self-center"
                  title="Eliminar condición"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              type="button"
              @click="agregarCondicion"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold transition"
            >
              <Plus class="w-3.5 h-3.5 text-indigo-500" />
              <span>Agregar otra condición</span>
            </button>
          </div>

          <!-- Acciones de la regla -->
          <div class="space-y-4 p-4 bg-zinc-50/70 dark:bg-zinc-950/60 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <span class="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
              Acciones automáticas al cumplirse la regla
            </span>

            <!-- Mover a carpeta -->
            <div class="space-y-2">
              <label class="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span class="flex items-center gap-1.5">
                  <Folder class="w-4 h-4 text-indigo-500" />
                  <span>Mover a la carpeta:</span>
                </span>
                <button
                  type="button"
                  @click="formCrearNuevaCarpeta = !formCrearNuevaCarpeta"
                  class="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                >
                  {{ formCrearNuevaCarpeta ? 'Elegir carpeta existente' : '+ Crear nueva carpeta' }}
                </button>
              </label>

              <div v-if="!formCrearNuevaCarpeta">
                <AppSelect
                  v-model="formCarpetaDestino"
                  :options="todasLasCarpetas.map(c => ({ value: c.id, label: '📁 ' + c.nombre }))"
                  full-width
                  size="md"
                />
              </div>

              <!-- Si crea nueva carpeta inline -->
              <div v-else class="space-y-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-indigo-200 dark:border-indigo-500/30">
                <div class="space-y-1">
                  <span class="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    Nombre de la nueva carpeta:
                  </span>
                  <input
                    type="text"
                    v-model="formNuevoNombreCarpeta"
                    placeholder="ej. Verafeca SRL, Cotizaciones VIP..."
                    class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div class="space-y-1">
                  <span class="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    Color de identificación:
                  </span>
                  <div class="flex items-center gap-2">
                    <button
                      v-for="col in coloresCarpeta"
                      :key="col.valor"
                      type="button"
                      @click="formNuevoColorCarpeta = col.valor"
                      :class="[
                        'w-6 h-6 rounded-full transition-transform',
                        col.bg,
                        formNuevoColorCarpeta === col.valor ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'opacity-70 hover:opacity-100'
                      ]"
                      :title="col.etiqueta"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Opciones adicionales: Destacado, Leído, Vincular Cliente -->
            <div class="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <label class="flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="formMarcarDestacado"
                  class="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span class="flex items-center gap-1.5">
                  <Star class="w-3.5 h-3.5 text-amber-500" />
                  <span>Marcar automáticamente como correo destacado (estrella)</span>
                </span>
              </label>

              <label class="flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="formMarcarLeido"
                  class="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Marcar automáticamente como leído</span>
              </label>

              <div class="space-y-2 pt-1">
                <label class="flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="formVincularCliente"
                    class="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span class="flex items-center gap-1.5">
                    <Building2 class="w-3.5 h-3.5 text-indigo-500" />
                    <span>Asociar al cliente del CRM</span>
                  </span>
                </label>
                <div v-if="formVincularCliente" class="pl-6">
                  <input
                    type="text"
                    v-model="formNombreCliente"
                    placeholder="Nombre comercial o razón social en el CRM (ej. Verafeca SRL)"
                    class="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Botones de Guardar / Cancelar -->
          <div class="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              @click="vistaFormulario = false"
              class="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              @click="guardarRegla"
              class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-md"
            >
              {{ reglaEditandoId ? 'Guardar Cambios' : 'Crear Regla' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Pie del Modal -->
      <div class="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between text-xs text-zinc-500">
        <div class="flex items-center gap-1.5">
          <Sparkles class="w-3.5 h-3.5 text-indigo-500" />
          <span>Las reglas se sincronizan con el servidor y se aplican a los correos en tiempo real.</span>
        </div>

        <button
          type="button"
          @click="emit('close')"
          class="font-semibold text-zinc-700 dark:text-zinc-300 hover:underline"
        >
          Listo
        </button>
      </div>
    </div>
  </div>
</template>
