<template>
  <div class="inline-flex shrink-0 items-center gap-2">
    <!-- Barra unificada y elegante sin doble borde ni clases inválidas -->
    <div class="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 shadow-sm text-xs transition">
      <!-- Icono de calendario -->
      <svg class="size-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>

      <span class="text-zinc-500 dark:text-zinc-400 font-medium select-none">Período:</span>

      <!-- Flechas solo con un día: mover «este mes» un día no significa nada. -->
      <button
        v-if="single"
        type="button"
        class="size-5.5 inline-flex items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition"
        title="Día anterior"
        aria-label="Día anterior"
        @click="step(-1)"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" class="size-3.5"><path fill-rule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd" /></svg>
      </button>

      <div class="w-36">
        <SelectField
          :model-value="modelValue.preset"
          :options="options"
          compact
          borderless
          aria-label="Período"
          @update:model-value="onPreset($event as RangePreset)"
        />
      </div>

      <button
        v-if="single"
        type="button"
        class="size-5.5 inline-flex items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition"
        title="Día siguiente"
        aria-label="Día siguiente"
        @click="step(1)"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" class="size-3.5"><path fill-rule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" /></svg>
      </button>

      <!-- Botón Hoy tipo pill elegante -->
      <button
        v-if="modelValue.preset !== 'today'"
        type="button"
        class="cursor-pointer rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase text-zinc-600 dark:text-zinc-300 transition"
        title="Volver a hoy"
        @click="onPreset('today')"
      >
        Hoy
      </button>
    </div>

    <!-- DatePicker si el rango es personalizado -->
    <div v-if="modelValue.preset === 'custom'" class="w-64 shrink-0">
      <DatePicker
        :model-value="pickerValue"
        range
        compact
        placeholder="Seleccionar rango"
        :clearable="false"
        @update:model-value="onRange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ⚡ DEVFORGE DateRangeFilter — el filtro de período de los listados.
 *
 *   const periodo = ref(defaultRange('month'))
 *   <DateRangeFilter v-model="periodo" @change="cargar" />
 *   // en el servicio: api.list({ page, pageSize, ...resolveRange(periodo.value) })
 *
 * Une los atajos (Hoy, Ayer, Este mes…), el paso de día con flechas y el rango
 * explícito desde/hasta. `change` solo se emite cuando el rango es utilizable: un
 * personalizado a medio elegir no dispara la consulta.
 */
import { computed } from 'vue';
import {
  RANGE_OPTIONS,
  isSingleDay,
  makeRange,
  normalizeRange,
  stepRangeDay,
  type DateRange,
  type RangePreset,
} from '@/core/dates/date-range';
import DatePicker from './DatePicker.vue';
import SelectField from './SelectField.vue';

const props = withDefaults(
  defineProps<{
    modelValue: DateRange;
    /** Ocultar "Historial completo" en listados que nunca deben traerlo todo. */
    allowAll?: boolean;
  }>(),
  { allowAll: true },
);

const emit = defineEmits<{
  'update:modelValue': [value: DateRange];
  change: [value: DateRange];
}>();

const options = computed(() =>
  RANGE_OPTIONS.filter(o => props.allowAll || o.id !== 'all').map(o => ({ value: o.id, label: o.name })),
);
const single = computed(() => isSingleDay(props.modelValue));

function apply(next: DateRange) {
  const value = normalizeRange(next);
  emit('update:modelValue', value);
  if (value.preset !== 'custom' || (value.from && value.to)) emit('change', value);
}

const onPreset = (preset: RangePreset) => apply(makeRange(preset, props.modelValue));
const step = (delta: number) => apply(stepRangeDay(props.modelValue, delta));

const pickerValue = computed(() => [props.modelValue.from, props.modelValue.to].filter(Boolean));

function onRange(value: string | string[]) {
  if (!Array.isArray(value)) return;
  apply({ preset: 'custom', from: value[0] ?? '', to: value[1] ?? '' });
}
</script>
