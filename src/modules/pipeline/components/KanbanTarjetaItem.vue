<script setup lang="ts">
import { computed } from 'vue';
import { 
  Building2, 
  Calendar, 
  ChevronRight, 
  ChevronLeft, 
  ChevronUp,
  ChevronDown,
  Trash2, 
  Edit3, 
  AlertOctagon,
  AlertTriangle,
  CalendarClock,
  GripVertical,
  Mail
} from 'lucide-vue-next';
import { formatCurrency, formatDate } from '@/core/formatters/formatters';
import { actividadesService } from '@/modules/agenda';
import SectorIcon from '@/shared/components/SectorIcon.vue';
import type { TarjetaPipeline, ColumnaPipeline } from '../types/pipeline.types';

const props = defineProps<{
  tarjeta: TarjetaPipeline;
  columna: ColumnaPipeline;
  colIndex: number;
  cardIndex: number;
  totalCardsInCol: number;
  totalColumnas?: number;
  tarjetaDestinoId?: string | null;
  posicionInsercion?: 'antes' | 'despues';
}>();

const emit = defineEmits<{
  (e: 'click'): void;
  (e: 'dragstart', event: DragEvent): void;
  (e: 'dragover', event: DragEvent): void;
  (e: 'drop', event: DragEvent): void;
  (e: 'mover-vertical', direccion: 'arriba' | 'abajo'): void;
  (e: 'avanzar'): void;
  (e: 'retroceder'): void;
  (e: 'abrir-detalle'): void;
  (e: 'programar-actividad'): void;
  (e: 'redactar-correo'): void;
  (e: 'motivo-cierre'): void;
  (e: 'eliminar'): void;
}>();

const esFechaDeHoy = (fechaStr?: string | null): boolean => {
  if (!fechaStr) return false;
  const hoyStr = new Date().toISOString().slice(0, 10);
  if (fechaStr.length >= 10 && fechaStr.slice(0, 10) === hoyStr) {
    return true;
  }
  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return false;
  const hoy = new Date();
  return (
    d.getFullYear() === hoy.getFullYear() &&
    d.getMonth() === hoy.getMonth() &&
    d.getDate() === hoy.getDate()
  );
};

const calcularDiasActivo = (tarjeta: TarjetaPipeline) => {
  if (!tarjeta.creado_en) return 0;
  const creado = new Date(tarjeta.creado_en).getTime();
  const diff = Date.now() - creado;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

const claseAntiguedad = (dias: number) => {
  if (dias > 10) return 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20';
  if (dias > 5) return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200 dark:border-white/[0.05]';
};

const badgePrioridad = (prioridad?: string) => {
  switch (prioridad) {
    case 'alta':
      return 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20';
    case 'media':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
    case 'baja':
      return 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border border-zinc-500/20';
    default:
      return 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border border-zinc-500/20';
  }
};

const diagnosticoEstancado = computed(() => {
  if (props.columna.es_completado || props.columna.estado === 'completado') {
    return { estancado: false, diasSinContacto: 0, fechaReferencia: '', motivo: 'Etapa completada' };
  }
  return actividadesService.esClienteEstancado(
    { id: props.tarjeta.id, creado_en: props.tarjeta.creado_en },
    { id: props.tarjeta.cliente_id }
  );
});
</script>

<template>
  <div
    draggable="true"
    @dragstart="emit('dragstart', $event)"
    @dragover="emit('dragover', $event)"
    @drop.stop="emit('drop', $event)"
    @click="emit('click')"
    class="bg-white dark:bg-zinc-900/70 p-3 rounded-xl border border-zinc-200 dark:border-white/[0.07] hover:border-indigo-500/40 dark:hover:border-indigo-500/40 hover:bg-zinc-50/70 dark:hover:bg-zinc-900/90 transition-all duration-150 shadow-sm group cursor-pointer active:cursor-grabbing relative"
    :class="[
      esFechaDeHoy(tarjeta.fecha_objetivo)
        ? 'border-indigo-400/50 dark:border-indigo-500/40 ring-1 ring-indigo-500/30 dark:ring-indigo-500/30 shadow-xs'
        : '',
      tarjetaDestinoId === tarjeta.id
        ? posicionInsercion === 'antes'
          ? 'border-t-2 border-t-indigo-500'
          : 'border-b-2 border-b-indigo-500'
        : ''
    ]"
  >
    <!-- Cabecera de la tarjeta con Grip y Controles Arriba/Abajo -->
    <div class="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1.5">
      <span class="font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 truncate max-w-[145px]" :title="tarjeta.cliente_nombre">
        <GripVertical class="w-3 h-3 text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 shrink-0 cursor-grab" />
        <Building2 class="w-3.5 h-3.5 shrink-0" />
        <span class="truncate">{{ tarjeta.cliente_nombre }}</span>
      </span>

      <!-- Controles para reordenar ARRIBA / ABAJO dentro de la columna -->
      <div class="flex items-center gap-1">
        <div class="flex items-center bg-zinc-100 dark:bg-zinc-950/80 rounded border border-zinc-200 dark:border-white/[0.05] p-0.5 opacity-60 group-hover:opacity-100 transition" @click.stop>
          <button
            :disabled="cardIndex === 0"
            @click.stop="emit('mover-vertical', 'arriba')"
            title="Subir elemento"
            class="p-0.5 hover:text-zinc-900 dark:hover:text-white disabled:opacity-20 transition"
          >
            <ChevronUp class="w-3 h-3" />
          </button>
          <button
            :disabled="cardIndex === totalCardsInCol - 1"
            @click.stop="emit('mover-vertical', 'abajo')"
            title="Bajar elemento"
            class="p-0.5 hover:text-zinc-900 dark:hover:text-white disabled:opacity-20 transition"
          >
            <ChevronDown class="w-3 h-3" />
          </button>
        </div>

        <!-- Indicador de Antigüedad / Días en Etapa -->
        <span
          :class="['px-1.5 py-0.5 rounded text-[10px] font-mono border font-medium flex items-center gap-0.5', claseAntiguedad(calcularDiasActivo(tarjeta))]"
          :title="'Días transcurridos en el proceso: ' + calcularDiasActivo(tarjeta) + ' días'"
        >
          <span>{{ calcularDiasActivo(tarjeta) }}d</span>
        </span>

        <!-- Badge "Para hoy" con punto pulsante -->
        <span
          v-if="esFechaDeHoy(tarjeta.fecha_objetivo)"
          class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30 flex items-center gap-1 shadow-xs shrink-0"
          title="Esta tarjeta o visita está programada para HOY"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse"></span>
          <span>Para hoy</span>
        </span>

        <!-- Badge de Etapa Bloqueada -->
        <span
          v-if="columna.estado === 'bloqueado'"
          class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-500/15 text-rose-500 dark:text-rose-300 border border-rose-500/25 flex items-center gap-1 shrink-0"
          title="Esta tarjeta o visita se encuentra detenida"
        >
          <AlertOctagon class="w-2.5 h-2.5" />
          <span>Bloqueada</span>
        </span>

        <!-- Badge de Motivo de Cierre / Pérdida / Pausa (si se registró) -->
        <span
          v-if="tarjeta.motivo_cierre"
          class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1 shrink-0 max-w-[110px]"
          :title="'Motivo: ' + tarjeta.motivo_cierre + (tarjeta.notas_cierre ? ' - ' + tarjeta.notas_cierre : '')"
        >
          <AlertOctagon class="w-2.5 h-2.5 shrink-0 text-rose-500" />
          <span class="truncate">{{ tarjeta.motivo_cierre }}</span>
        </span>

        <span :class="['px-1.5 py-0.5 rounded text-[10px] font-medium capitalize', badgePrioridad(tarjeta.prioridad)]">
          {{ tarjeta.prioridad || 'media' }}
        </span>
      </div>
    </div>

    <!-- Título de la Tarjeta / Visita -->
    <div class="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors mb-2 leading-snug">
      {{ tarjeta.titulo }}
    </div>

    <!-- Notas u Objetivo (si tiene) -->
    <p v-if="tarjeta.notas" class="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-2 bg-zinc-50 dark:bg-zinc-950/40 p-1.5 rounded border border-zinc-200 dark:border-white/[0.04]">
      {{ tarjeta.notas }}
    </p>

    <!-- Responsable y Sector -->
    <div class="flex items-center justify-between text-[10px] text-zinc-500 mb-2">
      <span class="truncate max-w-[110px]">{{ tarjeta.responsable }}</span>
      <span class="truncate max-w-[110px] inline-flex items-center gap-1">
        <SectorIcon :sector="tarjeta.cliente_sector" class="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
        <span>{{ tarjeta.cliente_sector }}</span>
      </span>
    </div>

    <!-- Monto y Fecha -->
    <div class="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-white/[0.05] text-xs">
      <span class="font-mono font-semibold text-zinc-900 dark:text-zinc-200 tabular-nums">
        {{ tarjeta.monto ? formatCurrency(tarjeta.monto) : '—' }}
      </span>
      <span
        class="text-[10px] flex items-center gap-1 font-mono transition-colors"
        :class="esFechaDeHoy(tarjeta.fecha_objetivo) 
          ? 'text-indigo-700 dark:text-indigo-300 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/25' 
          : 'text-zinc-500 dark:text-zinc-400'"
      >
        <span v-if="esFechaDeHoy(tarjeta.fecha_objetivo)" class="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse"></span>
        <Calendar v-else class="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
        <span>{{ esFechaDeHoy(tarjeta.fecha_objetivo) ? 'Hoy' : formatDate(tarjeta.fecha_objetivo) }}</span>
      </span>
    </div>

    <!-- Barra de Probabilidad Visual -->
    <div v-if="tarjeta.monto && tarjeta.monto > 0" class="mt-2 pt-1 border-t border-zinc-100 dark:border-white/[0.03]">
      <div class="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mb-1">
        <span>Probabilidad:</span>
        <span class="font-semibold text-indigo-600 dark:text-indigo-400">{{ tarjeta.probabilidad ?? 50 }}%</span>
      </div>
      <div class="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          class="h-full bg-indigo-500 rounded-full transition-all"
          :style="{ width: (tarjeta.probabilidad ?? 50) + '%' }"
        ></div>
      </div>
    </div>

    <!-- Detector de Estancamiento (> 10 días sin interacción) -->
    <div
      v-if="diagnosticoEstancado.estancado"
      class="mt-2 p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 flex items-center justify-between gap-1.5"
      :title="diagnosticoEstancado.motivo"
    >
      <div class="flex items-center gap-1 text-[10px] font-medium min-w-0">
        <AlertTriangle class="w-3 h-3 text-amber-500 shrink-0" />
        <span class="truncate">Estancado (+{{ diagnosticoEstancado.diasSinContacto }}d)</span>
      </div>
      <button
        type="button"
        @click.stop="emit('programar-actividad')"
        class="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-[10px] font-semibold text-amber-800 dark:text-amber-300 transition flex items-center gap-1 shrink-0"
        title="Programar llamada, reunión o recordatorio de seguimiento"
      >
        <CalendarClock class="w-2.5 h-2.5" />
        <span>Actuar</span>
      </button>
    </div>

    <!-- Botones de Transición Rápida y Barra de Acciones Rápidas Directas -->
    <div class="mt-2.5 pt-2 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between text-[10px]">
      <!-- Desplazamiento entre etapas -->
      <div class="flex items-center gap-1" @click.stop>
        <button
          v-if="colIndex > 0"
          @click.stop="emit('retroceder')"
          title="Mover a etapa previa"
          class="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <ChevronLeft class="w-3.5 h-3.5" />
        </button>

        <button
          v-if="totalColumnas && colIndex < totalColumnas - 1"
          @click.stop="emit('avanzar')"
          title="Avanzar a siguiente etapa"
          class="p-1 text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center gap-0.5 font-medium"
        >
          <span>Mover</span>
          <ChevronRight class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Barra de Acciones Rápidas -->
      <div class="flex items-center gap-0.5" @click.stop>
        <!-- Redactar Correo al Cliente -->
        <button
          @click.stop="emit('redactar-correo')"
          title="Redactar correo al cliente"
          class="p-1 text-zinc-400 hover:text-sky-500 dark:hover:text-sky-400 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <Mail class="w-3.5 h-3.5" />
        </button>

        <!-- Programar Actividad / Visita -->
        <button
          @click.stop="emit('programar-actividad')"
          title="Programar actividad / visita en Agenda"
          class="p-1 text-zinc-400 hover:text-amber-500 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <CalendarClock class="w-3.5 h-3.5" />
        </button>

        <!-- Registrar Motivo de Pérdida / Pausa -->
        <button
          @click.stop="emit('motivo-cierre')"
          title="Registrar motivo de cierre o descarte"
          class="p-1 text-zinc-400 hover:text-rose-500 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <AlertOctagon class="w-3.5 h-3.5" />
        </button>

        <!-- Inspeccionar y Editar -->
        <button
          @click.stop="emit('abrir-detalle')"
          title="Inspeccionar y editar trato"
          class="p-1 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <Edit3 class="w-3.5 h-3.5" />
        </button>

        <!-- Eliminar -->
        <button
          @click.stop="emit('eliminar')"
          title="Eliminar elemento del tablero"
          class="p-1 text-zinc-400 hover:text-rose-500 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>
