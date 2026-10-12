<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  DollarSign, 
  TrendingUp
} from 'lucide-vue-next';
import { formatCurrency } from '@/core/formatters/formatters';
import type { TarjetaPipeline, ColumnaPipeline, TipoPipeline } from '../types/pipeline.types';

const props = defineProps<{
  tarjetas: TarjetaPipeline[];
  columnas: ColumnaPipeline[];
  pipelineTipo: TipoPipeline;
  cargando?: boolean;
}>();

const emit = defineEmits<{
  (e: 'seleccionar-tarjeta', tarjeta: TarjetaPipeline): void;
  (e: 'crear-tarjeta', fecha: string): void;
  (e: 'mover-fecha', payload: { tarjetaId: string; nuevaFecha: string }): void;
}>();

// Fecha de referencia para navegación mensual (por defecto hoy)
const fechaReferencia = ref(new Date());

const mesesNombres = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// Navegación
const irMesAnterior = () => {
  const d = new Date(fechaReferencia.value);
  d.setMonth(d.getMonth() - 1);
  fechaReferencia.value = d;
};

const irMesSiguiente = () => {
  const d = new Date(fechaReferencia.value);
  d.setMonth(d.getMonth() + 1);
  fechaReferencia.value = d;
};

const irHoy = () => {
  fechaReferencia.value = new Date();
};

const añoActual = computed(() => fechaReferencia.value.getFullYear());
const mesActual = computed(() => fechaReferencia.value.getMonth());
const tituloMesActual = computed(() => `${mesesNombres[mesActual.value]} ${añoActual.value}`);

// Mapeo rápido de columnas por ID
const columnasMap = computed(() => {
  const map = new Map<string, ColumnaPipeline>();
  for (const col of props.columnas) {
    map.set(col.id, col);
  }
  return map;
});

const obtenerColumna = (colId: string) => {
  return columnasMap.value.get(colId);
};

// Formato seguro YYYY-MM-DD local
const formatearFechaStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const hoyStr = formatearFechaStr(new Date());

const totalTarjetasHoy = computed(() => {
  return props.tarjetas.filter((t) => t.fecha_objetivo && t.fecha_objetivo.slice(0, 10) === hoyStr).length;
});

// Tarjetas indexadas por fecha YYYY-MM-DD
const tarjetasPorFecha = computed(() => {
  const map = new Map<string, TarjetaPipeline[]>();
  for (const t of props.tarjetas) {
    if (!t.fecha_objetivo) continue;
    const fStr = t.fecha_objetivo.slice(0, 10);
    if (!map.has(fStr)) {
      map.set(fStr, []);
    }
    map.get(fStr)!.push(t);
  }
  return map;
});

// Métricas del mes visualizado
const tarjetasDelMes = computed(() => {
  const prefix = `${añoActual.value}-${String(mesActual.value + 1).padStart(2, '0')}`;
  return props.tarjetas.filter((t) => t.fecha_objetivo && t.fecha_objetivo.startsWith(prefix));
});

const volumenTotalDelMes = computed(() => {
  return tarjetasDelMes.value.reduce((acc, t) => acc + (t.monto || 0), 0);
});

const volumenPonderadoDelMes = computed(() => {
  return tarjetasDelMes.value.reduce((acc, t) => {
    const prob = t.probabilidad !== undefined ? t.probabilidad : 50;
    return acc + (t.monto || 0) * (prob / 100);
  }, 0);
});

// Estructura de celda de calendario
interface DiaCalendario {
  fechaStr: string;
  numeroDia: number;
  esMesActual: boolean;
  esHoy: boolean;
  tarjetas: TarjetaPipeline[];
  montoTotal: number;
}

// Generación de la grilla de días del mes
const diasGrilla = computed<DiaCalendario[]>(() => {
  const año = añoActual.value;
  const mes = mesActual.value;

  // Primer día del mes
  const primerDiaMes = new Date(año, mes, 1);
  // Día de la semana (0=Dom, 1=Lun, ..., 6=Sáb). Convertir a Lun=0, Dom=6
  const diaSemanaInicio = (primerDiaMes.getDay() + 6) % 7;

  // Total de días en este mes
  const totalDiasMes = new Date(año, mes + 1, 0).getDate();

  // Total de días en el mes anterior
  const totalDiasMesAnterior = new Date(año, mes, 0).getDate();

  const celdas: DiaCalendario[] = [];

  // Días del mes anterior (padding)
  for (let i = diaSemanaInicio - 1; i >= 0; i--) {
    const numDia = totalDiasMesAnterior - i;
    const fecha = new Date(año, mes - 1, numDia);
    const fStr = formatearFechaStr(fecha);
    const tarjs = tarjetasPorFecha.value.get(fStr) || [];
    const monto = tarjs.reduce((acc, t) => acc + (t.monto || 0), 0);
    celdas.push({
      fechaStr: fStr,
      numeroDia: numDia,
      esMesActual: false,
      esHoy: fStr === hoyStr,
      tarjetas: tarjs,
      montoTotal: monto,
    });
  }

  // Días del mes actual
  for (let dia = 1; dia <= totalDiasMes; dia++) {
    const fecha = new Date(año, mes, dia);
    const fStr = formatearFechaStr(fecha);
    const tarjs = tarjetasPorFecha.value.get(fStr) || [];
    const monto = tarjs.reduce((acc, t) => acc + (t.monto || 0), 0);
    celdas.push({
      fechaStr: fStr,
      numeroDia: dia,
      esMesActual: true,
      esHoy: fStr === hoyStr,
      tarjetas: tarjs,
      montoTotal: monto,
    });
  }

  // Días del mes siguiente para completar múltiplos de 7 (35 o 42 celdas)
  const celdasRestantes = (7 - (celdas.length % 7)) % 7;
  for (let dia = 1; dia <= celdasRestantes; dia++) {
    const fecha = new Date(año, mes + 1, dia);
    const fStr = formatearFechaStr(fecha);
    const tarjs = tarjetasPorFecha.value.get(fStr) || [];
    const monto = tarjs.reduce((acc, t) => acc + (t.monto || 0), 0);
    celdas.push({
      fechaStr: fStr,
      numeroDia: dia,
      esMesActual: false,
      esHoy: fStr === hoyStr,
      tarjetas: tarjs,
      montoTotal: monto,
    });
  }

  return celdas;
});

// Drag & Drop entre días del calendario
const tarjetaArrastrada = ref<TarjetaPipeline | null>(null);
const diaDestinoHover = ref<string | null>(null);

const onDragStartTarjeta = (tarjeta: TarjetaPipeline, event: DragEvent) => {
  tarjetaArrastrada.value = tarjeta;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', tarjeta.id);
  }
};

const onDragOverDia = (fechaStr: string, event: DragEvent) => {
  event.preventDefault();
  diaDestinoHover.value = fechaStr;
};

const onDragLeaveDia = (fechaStr: string) => {
  if (diaDestinoHover.value === fechaStr) {
    diaDestinoHover.value = null;
  }
};

const onDropDia = (fechaStr: string, event: DragEvent) => {
  event.preventDefault();
  diaDestinoHover.value = null;
  if (!tarjetaArrastrada.value) return;

  if (tarjetaArrastrada.value.fecha_objetivo?.slice(0, 10) !== fechaStr) {
    emit('mover-fecha', {
      tarjetaId: tarjetaArrastrada.value.id,
      nuevaFecha: fechaStr,
    });
  }
  tarjetaArrastrada.value = null;
};

const resolverBordeColorColumna = (col?: ColumnaPipeline) => {
  if (!col) return 'border-l-zinc-400';
  if (col.estado === 'completado' || col.es_completado) return 'border-l-emerald-500';
  if (col.estado === 'bloqueado') return 'border-l-rose-500';
  if (col.estado === 'en_proceso') return 'border-l-sky-500';
  return 'border-l-amber-500';
};

const badgePrioridad = (prioridad?: string) => {
  switch (prioridad) {
    case 'alta':
      return 'bg-rose-500 text-rose-500';
    case 'media':
      return 'bg-amber-500 text-amber-500';
    case 'baja':
      return 'bg-sky-500 text-sky-500';
    default:
      return 'bg-zinc-400 text-zinc-400';
  }
};

// Control de expansión de tarjetas en días con muchos elementos
const diaExpandido = ref<string | null>(null);

const alternarExpansionDia = (fechaStr: string) => {
  diaExpandido.value = diaExpandido.value === fechaStr ? null : fechaStr;
};
</script>

<template>
  <div class="space-y-4">
    <!-- Barra Superior de Navegación del Calendario y Métricas del Mes -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 bg-white dark:bg-zinc-900/80 rounded-xl border border-zinc-200 dark:border-white/[0.08] shadow-sm">
      <!-- Navegación de Mes y Año -->
      <div class="flex items-center gap-2">
        <div class="inline-flex items-center rounded-xl border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-zinc-950 p-0.5 shadow-xs">
          <button
            type="button"
            @click="irMesAnterior"
            class="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition"
            title="Mes anterior"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          
          <button
            type="button"
            @click="irHoy"
            class="px-2.5 py-1 text-xs font-semibold rounded-lg text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 transition inline-flex items-center gap-1.5"
          >
            <span v-if="totalTarjetasHoy > 0" class="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse"></span>
            <span>Hoy</span>
          </button>

          <button
            type="button"
            @click="irMesSiguiente"
            class="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition"
            title="Mes siguiente"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>

        <h2 class="text-base font-bold text-zinc-900 dark:text-zinc-100 capitalize tracking-tight ml-1">
          {{ tituloMesActual }}
        </h2>
      </div>

      <!-- Métricas del Mes Activo -->
      <div class="flex flex-wrap items-center gap-2.5 text-xs">
        <!-- Conteo de Visitas o Tratos -->
        <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-white/[0.06] text-zinc-700 dark:text-zinc-300">
          <CalendarIcon class="w-3.5 h-3.5 text-indigo-500" />
          <span class="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{{ tarjetasDelMes.length }}</span>
          <span>{{ pipelineTipo === 'visitas' ? 'visitas este mes' : 'tratos en el mes' }}</span>
        </div>

        <!-- Volumen Bruto Estimado -->
        <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
          <DollarSign class="w-3.5 h-3.5" />
          <span class="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">Volumen:</span>
          <span class="font-bold font-mono tabular-nums">{{ formatCurrency(volumenTotalDelMes) }}</span>
        </div>

        <!-- Forecast Ponderado -->
        <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400">
          <TrendingUp class="w-3.5 h-3.5" />
          <span class="text-[11px] font-medium text-indigo-800 dark:text-indigo-300">Forecast:</span>
          <span class="font-bold font-mono tabular-nums">{{ formatCurrency(volumenPonderadoDelMes) }}</span>
        </div>
      </div>
    </div>

    <!-- Rejilla del Calendario Mensual -->
    <div class="rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
      <!-- Encabezado de Días de la Semana -->
      <div class="grid grid-cols-7 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-zinc-900/90 text-center">
        <div
          v-for="dia in diasSemana"
          :key="dia"
          class="py-2.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 select-none"
        >
          <span class="hidden sm:inline">{{ dia }}</span>
          <span class="sm:hidden">{{ dia.slice(0, 3) }}</span>
        </div>
      </div>

      <!-- Celdas de los Días -->
      <div class="grid grid-cols-7 divide-x divide-y divide-zinc-200 dark:divide-white/[0.06] auto-rows-fr">
        <div
          v-for="dia in diasGrilla"
          :key="dia.fechaStr"
          class="min-h-[125px] sm:min-h-[145px] p-1.5 sm:p-2 flex flex-col transition-colors relative group"
          :class="[
            dia.esMesActual ? 'bg-white dark:bg-zinc-900/40' : 'bg-zinc-50/70 dark:bg-zinc-950/60 opacity-60',
            dia.esHoy ? 'ring-2 ring-indigo-500/50 bg-indigo-50/20 dark:bg-indigo-950/20' : '',
            diaDestinoHover === dia.fechaStr ? 'ring-2 ring-indigo-500 bg-indigo-500/10' : ''
          ]"
          @dragover="onDragOverDia(dia.fechaStr, $event)"
          @dragleave="onDragLeaveDia(dia.fechaStr)"
          @drop="onDropDia(dia.fechaStr, $event)"
        >
          <!-- Cabecera de la Celda del Día -->
          <div class="flex items-center justify-between mb-1.5 select-none">
            <div class="flex items-center gap-1">
              <span
                class="w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold tabular-nums"
                :class="[
                  dia.esHoy
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : dia.esMesActual
                    ? 'text-zinc-800 dark:text-zinc-200'
                    : 'text-zinc-400 dark:text-zinc-600'
                ]"
              >
                {{ dia.numeroDia }}
              </span>

              <span
                v-if="dia.esHoy"
                class="hidden md:inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-600/20 shadow-xs"
              >
                <span v-if="dia.tarjetas.length > 0" class="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse"></span>
                <span>Hoy</span>
              </span>
            </div>

            <div class="flex items-center gap-1">
              <!-- Subtotal económico del día si hay monto -->
              <span
                v-if="dia.montoTotal > 0"
                class="hidden sm:inline-block text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[80px]"
                :title="formatCurrency(dia.montoTotal)"
              >
                {{ formatCurrency(dia.montoTotal) }}
              </span>

              <!-- Botón rápido para programar en este día -->
              <button
                type="button"
                @click="emit('crear-tarjeta', dia.fechaStr)"
                title="Programar visita o trato en este día"
                class="opacity-0 group-hover:opacity-100 p-1 rounded-md text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <Plus class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Lista de Tarjetas del Día -->
          <div class="space-y-1.5 flex-1 overflow-y-auto max-h-[140px] pr-0.5 kanban-scroll">
            <template v-if="dia.tarjetas.length > 0">
              <div
                v-for="tarjeta in (diaExpandido === dia.fechaStr ? dia.tarjetas : dia.tarjetas.slice(0, 3))"
                :key="tarjeta.id"
                draggable="true"
                @dragstart="onDragStartTarjeta(tarjeta, $event)"
                @click="emit('seleccionar-tarjeta', tarjeta)"
                class="p-1.5 rounded-lg border border-zinc-200/90 dark:border-white/[0.08] bg-white dark:bg-zinc-900 hover:border-indigo-500/50 dark:hover:border-indigo-400/50 shadow-xs hover:shadow-sm transition-all cursor-pointer text-left border-l-[3px] select-none"
                :class="[resolverBordeColorColumna(obtenerColumna(tarjeta.columna_id))]"
              >
                <!-- Nombre del Cliente y Prioridad -->
                <div class="flex items-center justify-between gap-1 mb-0.5">
                  <span class="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate" :title="tarjeta.cliente_nombre">
                    {{ tarjeta.cliente_nombre }}
                  </span>

                  <!-- Dot de Prioridad -->
                  <span
                    class="w-1.5 h-1.5 rounded-full shrink-0"
                    :class="badgePrioridad(tarjeta.prioridad)"
                    :title="'Prioridad ' + (tarjeta.prioridad || 'media')"
                  ></span>
                </div>

                <!-- Título / Detalle del Trato o Visita -->
                <p class="text-[10px] text-zinc-500 dark:text-zinc-400 truncate leading-tight">
                  {{ tarjeta.titulo }}
                </p>

                <!-- Pie: Monto y Etapa -->
                <div class="flex items-center justify-between gap-1 mt-1 text-[10px]">
                  <span
                    v-if="tarjeta.monto"
                    class="font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums"
                  >
                    {{ formatCurrency(tarjeta.monto) }}
                  </span>
                  <span v-else class="text-zinc-400 font-sans italic">
                    Sin monto
                  </span>

                  <span
                    class="px-1 py-0.2 rounded text-[9px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 truncate max-w-[70px]"
                    :title="obtenerColumna(tarjeta.columna_id)?.titulo"
                  >
                    {{ obtenerColumna(tarjeta.columna_id)?.titulo || 'Etapa' }}
                  </span>
                </div>
              </div>

              <!-- Indicador de más tarjetas en este día -->
              <button
                v-if="dia.tarjetas.length > 3"
                type="button"
                @click.stop="alternarExpansionDia(dia.fechaStr)"
                class="w-full text-center py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline transition"
              >
                {{ diaExpandido === dia.fechaStr ? 'Ver menos ▲' : `+${dia.tarjetas.length - 3} más ▼` }}
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
