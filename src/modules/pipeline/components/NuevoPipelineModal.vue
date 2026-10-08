<script setup lang="ts">
import { ref, reactive, watch, type Component } from 'vue';
import { 
  X, 
  Kanban, 
  MapPin, 
  Layers, 
  Plus, 
  Trash2, 
  Sparkles,
  CheckCircle2,
  Loader2,
  Wrench,
  UserCheck,
  BadgeDollarSign,
  ChevronUp,
  ChevronDown,
  Check
} from 'lucide-vue-next';
import { FlickerlessSurface } from '@flickerless/vue';
import { pipelineService } from '../services/pipeline.service';
import type { TipoPipeline, CategoriaEstadoEtapa } from '../types/pipeline.types';
import { LIMITE_MAXIMO_COLUMNAS } from '../types/pipeline.types';
import { toastService } from '@/core/notifications/toast.service';
import AppSelect, { type SelectOption } from '@/shared/components/AppSelect.vue';

const props = defineProps<{
  abierto: boolean;
}>();

const emit = defineEmits<{
  (e: 'cerrar'): void;
  (e: 'creado', pipelineId: string): void;
}>();

const guardando = ref(false);
const errorMensaje = ref('');

const opcionesColor = [
  { nombre: 'Esmeralda', color: 'border-emerald-500/40 text-emerald-400', bgBadge: 'bg-emerald-500/10 border-emerald-500/20', dotClass: 'bg-emerald-400' },
  { nombre: 'Cielo', color: 'border-sky-500/40 text-sky-400', bgBadge: 'bg-sky-500/10 border-sky-500/20', dotClass: 'bg-sky-400' },
  { nombre: 'Índigo', color: 'border-indigo-500/40 text-indigo-400', bgBadge: 'bg-indigo-500/10 border-indigo-500/20', dotClass: 'bg-indigo-400' },
  { nombre: 'Ámbar', color: 'border-amber-500/40 text-amber-400', bgBadge: 'bg-amber-500/10 border-amber-500/20', dotClass: 'bg-amber-400' },
  { nombre: 'Púrpura', color: 'border-purple-500/40 text-purple-400', bgBadge: 'bg-purple-500/10 border-purple-500/20', dotClass: 'bg-purple-400' },
  { nombre: 'Rosa', color: 'border-rose-500/40 text-rose-400', bgBadge: 'bg-rose-500/10 border-rose-500/20', dotClass: 'bg-rose-400' },
  { nombre: 'Zinc', color: 'border-zinc-500/40 text-zinc-300', bgBadge: 'bg-zinc-500/10 border-zinc-500/20', dotClass: 'bg-zinc-400' },
];

const opcionesEstadoIntermedio: Array<SelectOption<CategoriaEstadoEtapa>> = [
  { value: 'pendiente', label: 'Pendiente', dotColor: 'bg-amber-400', colorClass: 'text-amber-300 font-medium' },
  { value: 'en_proceso', label: 'En Proceso', dotColor: 'bg-sky-400', colorClass: 'text-sky-300 font-medium' },
  { value: 'bloqueado', label: 'Bloqueado', dotColor: 'bg-rose-400', colorClass: 'text-rose-300 font-medium' },
];

interface ColumnaFormulario {
  titulo: string;
  color: string;
  bgBadge: string;
  estado: CategoriaEstadoEtapa;
}

type ClavePlantilla = 'visitas' | 'ventas' | 'servicios' | 'onboarding' | 'cobranzas' | 'en_blanco';

interface DefinicionPlantilla {
  id: ClavePlantilla;
  titulo: string;
  subtitulo: string;
  descripcion: string;
  etiqueta: string;
  icono: Component;
  colorIcono: string;
  bgIcono: string;
  tipo: TipoPipeline;
  nombreSugerido: string;
  descripcionSugerida: string;
  columnas: Array<{
    titulo: string;
    color: string;
    bgBadge: string;
    estado: CategoriaEstadoEtapa;
  }>;
}

const plantillasCatalogo: DefinicionPlantilla[] = [
  {
    id: 'visitas',
    titulo: 'Visitas en Terreno',
    subtitulo: 'Rutas comerciales y auditorías técnicas',
    descripcion: 'Control exhaustivo del ciclo de citas, inspecciones y demostraciones presenciales en clientes.',
    etiqueta: 'Terreno / Campo',
    icono: MapPin,
    colorIcono: 'text-sky-400',
    bgIcono: 'bg-sky-500/10 border-sky-500/20',
    tipo: 'visitas',
    nombreSugerido: 'Clientes A Visitar',
    descripcionSugerida: 'Planificación y control de visitas comerciales, auditorías y demostraciones en terreno.',
    columnas: [
      { titulo: 'Por Agendar', color: opcionesColor[3].color, bgBadge: opcionesColor[3].bgBadge, estado: 'pendiente' },
      { titulo: 'Visita Programada', color: opcionesColor[1].color, bgBadge: opcionesColor[1].bgBadge, estado: 'en_proceso' },
      { titulo: 'En Visita / Ruta', color: opcionesColor[2].color, bgBadge: opcionesColor[2].bgBadge, estado: 'en_proceso' },
      { titulo: 'Visita Pospuesta / Bloqueada', color: opcionesColor[5].color, bgBadge: opcionesColor[5].bgBadge, estado: 'bloqueado' },
      { titulo: 'Visita Realizada', color: opcionesColor[0].color, bgBadge: opcionesColor[0].bgBadge, estado: 'completado' },
    ],
  },
  {
    id: 'ventas',
    titulo: 'Ventas Consultivas B2B',
    subtitulo: 'Embudo de propuestas y tratos de alto valor',
    descripcion: 'Seguimiento desde la calificación de necesidades hasta la negociación y el cierre del contrato.',
    etiqueta: 'Ventas Comerciales',
    icono: Kanban,
    colorIcono: 'text-emerald-400',
    bgIcono: 'bg-emerald-500/10 border-emerald-500/20',
    tipo: 'ventas',
    nombreSugerido: 'Embudo de Oportunidades B2B',
    descripcionSugerida: 'Seguimiento de propuestas comerciales, márgenes y cierre de contratos empresariales.',
    columnas: [
      { titulo: 'Calificación de Prospecto', color: opcionesColor[3].color, bgBadge: opcionesColor[3].bgBadge, estado: 'pendiente' },
      { titulo: 'Propuesta Enviada', color: opcionesColor[1].color, bgBadge: opcionesColor[1].bgBadge, estado: 'en_proceso' },
      { titulo: 'En Negociación', color: opcionesColor[2].color, bgBadge: opcionesColor[2].bgBadge, estado: 'en_proceso' },
      { titulo: 'Trato Detenido / Standby', color: opcionesColor[5].color, bgBadge: opcionesColor[5].bgBadge, estado: 'bloqueado' },
      { titulo: 'Cerrada Ganada', color: opcionesColor[0].color, bgBadge: opcionesColor[0].bgBadge, estado: 'completado' },
    ],
  },
  {
    id: 'servicios',
    titulo: 'Servicios Técnicos e Instalaciones',
    subtitulo: 'Órdenes de trabajo y mantenimiento',
    descripcion: 'Gestión ágil para equipos de campo, diagnósticos, instalaciones y certificaciones técnicas.',
    etiqueta: 'Operaciones & Soporte',
    icono: Wrench,
    colorIcono: 'text-amber-400',
    bgIcono: 'bg-amber-500/10 border-amber-500/20',
    tipo: 'operaciones',
    nombreSugerido: 'Mantenimiento y Soporte Técnico',
    descripcionSugerida: 'Recepción, diagnóstico, reparación y certificación de servicios en instalaciones de clientes.',
    columnas: [
      { titulo: 'Solicitud Recibida', color: opcionesColor[3].color, bgBadge: opcionesColor[3].bgBadge, estado: 'pendiente' },
      { titulo: 'Diagnóstico Técnico', color: opcionesColor[1].color, bgBadge: opcionesColor[1].bgBadge, estado: 'en_proceso' },
      { titulo: 'En Reparación / Trabajo', color: opcionesColor[2].color, bgBadge: opcionesColor[2].bgBadge, estado: 'en_proceso' },
      { titulo: 'Espera de Repuestos / Bloqueado', color: opcionesColor[5].color, bgBadge: opcionesColor[5].bgBadge, estado: 'bloqueado' },
      { titulo: 'Servicio Concluido', color: opcionesColor[0].color, bgBadge: opcionesColor[0].bgBadge, estado: 'completado' },
    ],
  },
  {
    id: 'onboarding',
    titulo: 'Onboarding & Customer Success',
    subtitulo: 'Adopción y puesta en marcha de cuentas',
    descripcion: 'Acompañamiento estructurado de nuevos clientes desde la bienvenida hasta la adopción activa.',
    etiqueta: 'Customer Success',
    icono: UserCheck,
    colorIcono: 'text-purple-400',
    bgIcono: 'bg-purple-500/10 border-purple-500/20',
    tipo: 'operaciones',
    nombreSugerido: 'Onboarding Nuevas Cuentas',
    descripcionSugerida: 'Flujo de configuración, capacitación a usuarios y validación de satisfacción inicial.',
    columnas: [
      { titulo: 'Bienvenida & Setup', color: opcionesColor[3].color, bgBadge: opcionesColor[3].bgBadge, estado: 'pendiente' },
      { titulo: 'Carga de Datos & Configuración', color: opcionesColor[1].color, bgBadge: opcionesColor[1].bgBadge, estado: 'en_proceso' },
      { titulo: 'Espera Aprobación / Bloqueado', color: opcionesColor[5].color, bgBadge: opcionesColor[5].bgBadge, estado: 'bloqueado' },
      { titulo: 'Capacitación a Usuarios', color: opcionesColor[2].color, bgBadge: opcionesColor[2].bgBadge, estado: 'en_proceso' },
      { titulo: 'Go-Live y Activo', color: opcionesColor[0].color, bgBadge: opcionesColor[0].bgBadge, estado: 'completado' },
    ],
  },
  {
    id: 'cobranzas',
    titulo: 'Cobranzas y Recuperación',
    subtitulo: 'Cuentas por cobrar y acuerdos de pago',
    descripcion: 'Monitoreo preventivo y resolutivo de facturas pendientes con seguimiento escalonado.',
    etiqueta: 'Finanzas & Cobros',
    icono: BadgeDollarSign,
    colorIcono: 'text-indigo-400',
    bgIcono: 'bg-indigo-500/10 border-indigo-500/20',
    tipo: 'operaciones',
    nombreSugerido: 'Gestión de Cobranzas y Cartera',
    descripcionSugerida: 'Control de emisión, recordatorios amigables y conciliación bancaria de saldos.',
    columnas: [
      { titulo: 'Factura Emitida', color: opcionesColor[3].color, bgBadge: opcionesColor[3].bgBadge, estado: 'pendiente' },
      { titulo: 'Recordatorio Amigable', color: opcionesColor[1].color, bgBadge: opcionesColor[1].bgBadge, estado: 'en_proceso' },
      { titulo: 'En Compromiso de Pago', color: opcionesColor[2].color, bgBadge: opcionesColor[2].bgBadge, estado: 'en_proceso' },
      { titulo: 'En Disputa / Bloqueada', color: opcionesColor[5].color, bgBadge: opcionesColor[5].bgBadge, estado: 'bloqueado' },
      { titulo: 'Pago Conciliado', color: opcionesColor[0].color, bgBadge: opcionesColor[0].bgBadge, estado: 'completado' },
    ],
  },
  {
    id: 'en_blanco',
    titulo: 'Tablero Personalizado',
    subtitulo: 'Flujo limpio diseñado totalmente a medida',
    descripcion: 'Inicia con etapas esenciales y personaliza nombres, colores y categorías según tus necesidades.',
    etiqueta: 'A Medida',
    icono: Layers,
    colorIcono: 'text-zinc-300',
    bgIcono: 'bg-zinc-800 border-zinc-700',
    tipo: 'personalizado',
    nombreSugerido: 'Mi Flujo Personalizado',
    descripcionSugerida: 'Tablero operativo diseñado a medida para los procesos de nuestro equipo.',
    columnas: [
      { titulo: 'Por Iniciar', color: opcionesColor[3].color, bgBadge: opcionesColor[3].bgBadge, estado: 'pendiente' },
      { titulo: 'En Progreso', color: opcionesColor[1].color, bgBadge: opcionesColor[1].bgBadge, estado: 'en_proceso' },
      { titulo: 'Bloqueado', color: opcionesColor[5].color, bgBadge: opcionesColor[5].bgBadge, estado: 'bloqueado' },
      { titulo: 'Finalizado', color: opcionesColor[0].color, bgBadge: opcionesColor[0].bgBadge, estado: 'completado' },
    ],
  },
];

const formulario = reactive({
  nombre: '',
  descripcion: '',
  tipo: 'visitas' as TipoPipeline,
  plantillaSeleccionada: 'visitas' as ClavePlantilla,
  columnas: [] as ColumnaFormulario[],
});

const nuevaColumnaTitulo = ref('');
const nuevoColorIndex = ref(1);

const aplicarPlantilla = (idPlantilla: ClavePlantilla) => {
  const p = plantillasCatalogo.find((item) => item.id === idPlantilla) || plantillasCatalogo[0];
  formulario.plantillaSeleccionada = p.id;
  formulario.tipo = p.tipo;
  formulario.nombre = p.nombreSugerido;
  formulario.descripcion = p.descripcionSugerida;
  formulario.columnas = JSON.parse(JSON.stringify(p.columnas));
};

const onCambioEstado = (indice: number, nuevoEstado: CategoriaEstadoEtapa) => {
  // La última etapa siempre es Completado de forma inalterable
  if (indice === formulario.columnas.length - 1) return;
  formulario.columnas[indice].estado = nuevoEstado;
};

const moverColumnaArriba = (indice: number) => {
  // No puede subir si es la primera ni si es la última etapa (Completado permanece fija al fondo)
  if (indice <= 0 || indice >= formulario.columnas.length - 1) return;
  const temp = formulario.columnas[indice];
  formulario.columnas[indice] = formulario.columnas[indice - 1];
  formulario.columnas[indice - 1] = temp;
};

const moverColumnaAbajo = (indice: number) => {
  // No puede bajar si sobrepasaría la etapa completada final
  if (indice >= formulario.columnas.length - 2) return;
  const temp = formulario.columnas[indice];
  formulario.columnas[indice] = formulario.columnas[indice + 1];
  formulario.columnas[indice + 1] = temp;
};

const agregarColumna = () => {
  if (formulario.columnas.length >= LIMITE_MAXIMO_COLUMNAS) {
    errorMensaje.value = `Se permite un máximo de ${LIMITE_MAXIMO_COLUMNAS} etapas para garantizar métricas claras y controladas.`;
    return;
  }
  if (!nuevaColumnaTitulo.value.trim()) return;
  const colOpt = opcionesColor[nuevoColorIndex.value % opcionesColor.length];

  // Las nuevas columnas SIEMPRE se agregan ARRIBA de la última etapa (Completado)
  const posicionInsercion = Math.max(0, formulario.columnas.length - 1);
  formulario.columnas.splice(posicionInsercion, 0, {
    titulo: nuevaColumnaTitulo.value.trim(),
    color: colOpt.color,
    bgBadge: colOpt.bgBadge,
    estado: 'en_proceso',
  });

  // Garantizar que la última siempre sea Completado
  if (formulario.columnas.length > 0) {
    formulario.columnas[formulario.columnas.length - 1].estado = 'completado';
  }

  nuevaColumnaTitulo.value = '';
  nuevoColorIndex.value = (nuevoColorIndex.value + 1) % opcionesColor.length;
};

const eliminarColumna = (indice: number) => {
  // La última etapa (Completado) no se puede eliminar
  if (indice === formulario.columnas.length - 1) {
    errorMensaje.value = 'La última etapa representa la meta de completado del tablero y no se puede eliminar.';
    return;
  }
  if (formulario.columnas.length <= 1) {
    errorMensaje.value = 'Debe mantener al menos una columna para el tablero.';
    return;
  }
  formulario.columnas.splice(indice, 1);
  if (formulario.columnas.length > 0) {
    formulario.columnas[formulario.columnas.length - 1].estado = 'completado';
  }
};

const guardar = async () => {
  if (!formulario.nombre.trim()) {
    errorMensaje.value = 'Debe indicar un nombre para el nuevo pipeline o tablero.';
    return;
  }
  if (formulario.columnas.length === 0) {
    errorMensaje.value = 'Debe agregar al menos una columna o etapa.';
    return;
  }

  // Garantizar que haya exactamente un estado completado
  const tieneCompletado = formulario.columnas.some((c) => c.estado === 'completado');
  if (!tieneCompletado && formulario.columnas.length > 0) {
    formulario.columnas[formulario.columnas.length - 1].estado = 'completado';
  }

  errorMensaje.value = '';
  guardando.value = true;
  try {
    const nuevo = await pipelineService.crearPipeline({
      nombre: formulario.nombre.trim(),
      descripcion: formulario.descripcion.trim(),
      tipo: formulario.tipo,
      columnas: formulario.columnas.map((col) => ({
        titulo: col.titulo,
        color: col.color,
        bgBadge: col.bgBadge,
        estado: col.estado,
        es_completado: col.estado === 'completado',
      })),
    });

    toastService.exito(`Tablero "${nuevo.nombre}" creado exitosamente.`);
    emit('creado', nuevo.id);
    emit('cerrar');
  } catch (err: unknown) {
    errorMensaje.value = err instanceof Error ? err.message : 'Error inesperado al crear el pipeline.';
  } finally {
    guardando.value = false;
  }
};

watch(
  () => props.abierto,
  (val) => {
    if (val) {
      aplicarPlantilla('visitas');
      errorMensaje.value = '';
    }
  }
);
</script>

<template>
  <div v-if="abierto" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in">
    <!-- Diálogo Espacioso y Amplio (max-w-5xl) -->
    <div
      class="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/[0.09] rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[94vh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo-pipeline"
    >
      <!-- Cabecera Superior Amplia -->
      <div class="flex items-center justify-between px-6 py-4.5 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-zinc-900/60">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Layers class="w-5 h-5" />
          </div>
          <div>
            <h2 id="modal-titulo-pipeline" class="text-sm sm:text-base font-semibold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Crear Nuevo Pipeline / Tablero Kanban</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hidden sm:inline-flex">
                Configurador Avanzado
              </span>
            </h2>
            <p class="text-xs text-zinc-500 dark:text-zinc-400">
              Selecciona una plantilla optimizada o diseña tu flujo con estados macro precisos para métricas de avance
            </p>
          </div>
        </div>
        <button
          @click="emit('cerrar')"
          class="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          aria-label="Cerrar modal"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Contenido Principal con FlickerlessSurface -->
      <FlickerlessSurface
        :loading="false"
        :delay-ms="80"
        :preserve-height="true"
        stream-color="#4f46e5"
        class="p-6 overflow-y-auto space-y-6 text-xs flex-1 bg-white dark:bg-zinc-950"
      >
        <div v-if="errorMensaje" class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
          <span>{{ errorMensaje }}</span>
        </div>

        <!-- 1. Catálogo Completo de Plantillas Optimizadas -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <label class="font-semibold text-zinc-800 dark:text-zinc-200 text-xs flex items-center gap-2">
              <Sparkles class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Plantillas Estratégicas Sugeridas</span>
            </label>
            <span class="text-[11px] text-zinc-500 dark:text-zinc-400">
              Haz clic para cargar automáticamente etapas preconfiguradas
            </span>
          </div>

          <!-- Cuadrícula de 6 Plantillas Ricas y Visuales -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <button
              v-for="plantilla in plantillasCatalogo"
              :key="plantilla.id"
              type="button"
              @click="aplicarPlantilla(plantilla.id)"
              :class="[
                'p-3.5 rounded-xl border text-left transition relative flex flex-col justify-between gap-3 group',
                formulario.plantillaSeleccionada === plantilla.id
                  ? 'bg-indigo-50/70 dark:bg-indigo-500/[0.08] border-indigo-500/40 ring-1 ring-indigo-500/30'
                  : 'bg-zinc-50/60 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/[0.06] hover:bg-zinc-100/70 dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-white/[0.14]'
              ]"
            >
              <div>
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div class="flex items-center gap-2.5">
                    <div :class="['w-7 h-7 rounded-lg border flex items-center justify-center shrink-0', plantilla.bgIcono, plantilla.colorIcono]">
                      <component :is="plantilla.icono" class="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 class="font-semibold text-xs text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                        {{ plantilla.titulo }}
                      </h3>
                      <span class="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal block leading-tight">
                        {{ plantilla.etiqueta }}
                      </span>
                    </div>
                  </div>

                  <!-- Indicador de plantilla activa -->
                  <div
                    v-if="formulario.plantillaSeleccionada === plantilla.id"
                    class="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm"
                  >
                    <Check class="w-3 h-3 stroke-[3]" />
                  </div>
                </div>

                <p class="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed mb-2.5 line-clamp-2">
                  {{ plantilla.descripcion }}
                </p>
              </div>

              <!-- Vista previa secuencial de etapas -->
              <div class="pt-2 border-t border-zinc-200 dark:border-white/[0.04]">
                <div class="text-[10px] text-zinc-500 dark:text-zinc-400 mb-1 font-medium">Etapas incluidas:</div>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="(c, cIdx) in plantilla.columnas"
                    :key="cIdx"
                    :class="[
                      'px-1.5 py-0.5 rounded text-[9px] font-medium border flex items-center gap-1',
                      c.estado === 'completado' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                      c.estado === 'bloqueado' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' :
                      c.estado === 'en_proceso' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' :
                      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    ]"
                  >
                    <span
                      :class="[
                        'w-1 h-1 rounded-full',
                        c.estado === 'completado' ? 'bg-emerald-500' :
                        c.estado === 'bloqueado' ? 'bg-rose-500' :
                        c.estado === 'en_proceso' ? 'bg-sky-500' :
                        'bg-amber-500'
                      ]"
                    ></span>
                    <span>{{ c.titulo }}</span>
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- 2. Información General del Tablero (2 Columnas) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div>
            <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Nombre del Pipeline / Tablero <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="formulario.nombre"
              type="text"
              placeholder="Ejemplo: Clientes A Visitar, Embudo Consultivo..."
              class="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500/50 transition font-medium"
            />
          </div>

          <div>
            <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Descripción u Objetivo Operativo <span class="text-zinc-400 dark:text-zinc-500 font-normal">(Opcional)</span>
            </label>
            <input
              v-model="formulario.descripcion"
              type="text"
              placeholder="Propósito operativo y metas de este tablero"
              class="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500/50 transition"
            />
          </div>
        </div>

        <!-- 3. Configurador de Etapas del Tablero -->
        <div class="space-y-3 pt-2">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-white/[0.06] pb-2">
            <div class="flex items-center gap-2">
              <label class="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
                Etapas y Columnas del Tablero
              </label>
              <span class="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] border border-zinc-200 dark:border-white/[0.06]">
                {{ formulario.columnas.length }} de {{ LIMITE_MAXIMO_COLUMNAS }} máx.
              </span>
            </div>

            <!-- Guía de Estados Macro -->
            <div class="flex items-center gap-2 flex-wrap text-[11px] text-zinc-500 dark:text-zinc-400">
              <span class="flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Pendiente
              </span>
              <span class="flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-sky-500"></span> En Proceso
              </span>
              <span class="flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Bloqueado
              </span>
              <span class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Completado (Exactamente 1)
              </span>
            </div>
          </div>

          <!-- Lista de Etapas Configurables con Selector de Alta Fidelidad -->
          <div class="space-y-2.5">
            <div
              v-for="(col, idx) in formulario.columnas"
              :key="idx"
              :class="[
                'flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-xl border transition-all',
                col.estado === 'completado'
                  ? 'bg-emerald-500/[0.05] border-emerald-500/30'
                  : col.estado === 'bloqueado'
                  ? 'bg-rose-500/[0.04] border-rose-500/25'
                  : 'bg-zinc-50/70 dark:bg-zinc-900/70 border-zinc-200 dark:border-white/[0.07] hover:border-zinc-300 dark:hover:border-white/[0.14]'
              ]"
            >
              <!-- Número de orden e Input de Título -->
              <div class="flex items-center gap-2.5 flex-1 min-w-[240px]">
                <div class="flex flex-col gap-0.5 shrink-0">
                  <button
                    type="button"
                    :disabled="idx === 0 || idx === formulario.columnas.length - 1"
                    @click="moverColumnaArriba(idx)"
                    class="p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white disabled:opacity-20 transition"
                    title="Subir orden"
                  >
                    <ChevronUp class="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    :disabled="idx >= formulario.columnas.length - 2"
                    @click="moverColumnaAbajo(idx)"
                    class="p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white disabled:opacity-20 transition"
                    title="Bajar orden"
                  >
                    <ChevronDown class="w-3 h-3" />
                  </button>
                </div>

                <span class="w-6 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-mono text-[11px] font-semibold shrink-0 border border-zinc-300 dark:border-white/[0.06]">
                  {{ idx + 1 }}
                </span>

                <input
                  v-model="col.titulo"
                  type="text"
                  placeholder="Nombre de la etapa..."
                  class="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 font-medium text-xs focus:outline-none focus:border-indigo-500/50 transition"
                />
              </div>

              <!-- Selector de Estado Macro o Badge Fijo para la última etapa -->
              <div class="flex items-center gap-3 shrink-0 justify-between md:justify-start">
                <div class="flex items-center gap-1.5">
                  <span class="text-zinc-500 text-[11px] hidden lg:inline">Estado Macro:</span>

                  <!-- Última columna: Fija como Completado (Meta Final inalterable) -->
                  <div
                    v-if="idx === formulario.columnas.length - 1"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold text-xs shadow-sm cursor-not-allowed select-none min-w-[135px] justify-between"
                    title="La última etapa es siempre la Meta Final (100% Completado). No se le puede cambiar el estado y las nuevas etapas se agregan arriba de esta."
                  >
                    <div class="flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Completado</span>
                    </div>
                    <span class="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-normal">Meta</span>
                  </div>

                  <!-- Columnas intermedias y primera: Selector con estados (Pendiente, En Proceso, Bloqueado) -->
                  <AppSelect
                    v-else
                    :model-value="col.estado"
                    @update:model-value="(nuevo) => onCambioEstado(idx, nuevo as CategoriaEstadoEtapa)"
                    :options="opcionesEstadoIntermedio"
                    min-width-class="w-44"
                    trigger-class="min-w-[135px]"
                  />
                </div>

                <!-- Selector de Color para la Columna -->
                <div class="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80">
                  <button
                    v-for="(opt, optIdx) in opcionesColor"
                    :key="optIdx"
                    type="button"
                    @click="col.color = opt.color; col.bgBadge = opt.bgBadge"
                    :title="opt.nombre"
                    :class="[
                      'w-3.5 h-3.5 rounded-full transition-all',
                      opt.dotClass,
                      col.color === opt.color ? 'ring-2 ring-indigo-500 dark:ring-white scale-125 z-10' : 'opacity-40 hover:opacity-100'
                    ]"
                  ></button>
                </div>

                <!-- Botón Eliminar Columna (la última etapa completada está protegida) -->
                <button
                  type="button"
                  @click="eliminarColumna(idx)"
                  :disabled="formulario.columnas.length <= 1 || idx === formulario.columnas.length - 1"
                  :class="[
                    'p-1.5 rounded-lg transition',
                    idx === formulario.columnas.length - 1
                      ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                      : 'text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-20'
                  ]"
                  :title="idx === formulario.columnas.length - 1 ? 'La etapa meta de completado es obligatoria y no puede eliminarse' : 'Eliminar etapa'"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <!-- Añadir nueva etapa si no se ha alcanzado el límite (se agrega ARRIBA de la última) -->
          <div v-if="formulario.columnas.length < LIMITE_MAXIMO_COLUMNAS" class="flex items-center gap-2.5 pt-2">
            <input
              v-model="nuevaColumnaTitulo"
              @keydown.enter.prevent="agregarColumna"
              type="text"
              placeholder="+ Escribe el nombre de otra etapa (se agregará arriba de Completado)..."
              class="flex-1 px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500/50 transition"
            />
            <button
              type="button"
              @click="agregarColumna"
              class="px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white font-medium flex items-center gap-1.5 transition text-xs shrink-0"
              title="Añadir nueva etapa arriba de la meta de Completado"
            >
              <Plus class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Añadir Etapa</span>
            </button>
          </div>
          <div v-else class="text-[11px] text-zinc-500 italic p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.04]">
            ✓ Has configurado el máximo recomendado de {{ LIMITE_MAXIMO_COLUMNAS }} etapas para este tablero.
          </div>
        </div>
      </FlickerlessSurface>

      <!-- Pie del Modal Espacioso y Claro -->
      <div class="flex items-center justify-between gap-4 px-6 py-4 border-t border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-zinc-900/60">
        <div class="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:flex items-center gap-1.5">
          <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" />
          <span>
            Etapa de Meta Final:
            <strong class="text-zinc-800 dark:text-zinc-200">
              {{ formulario.columnas.find((c) => c.estado === 'completado')?.titulo || 'Ninguna' }}
            </strong>
          </span>
        </div>

        <div class="flex items-center gap-2.5 ml-auto">
          <button
            type="button"
            @click="emit('cerrar')"
            class="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            @click="guardar"
            :disabled="guardando"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-lg shadow-indigo-950/20 transition active:scale-95 disabled:opacity-50"
          >
            <Loader2 v-if="guardando" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ guardando ? 'Creando Tablero...' : 'Crear Tablero' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
