<script setup lang="ts" generic="T extends string | number">
import { ref, type Component } from 'vue';
import { ChevronDown, Check } from 'lucide-vue-next';
import { onClickOutside } from '@vueuse/core';

export interface SelectOption<T> {
  value: T;
  label: string;
  dotColor?: string;
  badge?: string;
  icon?: Component;
  colorClass?: string;
  description?: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: T;
    options: Array<SelectOption<T>>;
    labelPrefix?: string;
    placeholder?: string;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    align?: 'left' | 'right';
    minWidthClass?: string;
    triggerClass?: string;
  }>(),
  {
    labelPrefix: '',
    placeholder: 'Seleccionar...',
    disabled: false,
    size: 'md',
    align: 'left',
    minWidthClass: 'min-w-[170px]',
    triggerClass: '',
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: T): void;
  (e: 'change', value: T): void;
}>();

const abierto = ref(false);
const contenedorRef = ref<HTMLElement | null>(null);

onClickOutside(contenedorRef, () => {
  abierto.value = false;
});

const toggle = () => {
  if (props.disabled) return;
  abierto.value = !abierto.value;
};

const seleccionar = (opcion: SelectOption<T>) => {
  emit('update:modelValue', opcion.value);
  emit('change', opcion.value);
  abierto.value = false;
};

const opcionSeleccionada = () => {
  return props.options.find((o) => o.value === props.modelValue);
};
</script>

<template>
  <div ref="contenedorRef" class="relative inline-block text-left">
    <!-- Botón Disparador (Trigger) con diseño adaptativo -->
    <button
      type="button"
      @click="toggle"
      :disabled="disabled"
      :class="[
        'flex items-center justify-between gap-2.5 rounded-xl border bg-white dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-100 transition shadow-sm font-medium focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed',
        abierto
          ? 'border-indigo-500 ring-2 ring-indigo-500/20'
          : 'border-zinc-300 dark:border-zinc-700/80 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/80',
        size === 'sm' ? 'px-2.5 py-1 text-[11px]' : size === 'lg' ? 'px-4 py-2.5 text-sm' : 'px-3 py-1.5 text-xs',
        triggerClass
      ]"
      :aria-expanded="abierto"
    >
      <div class="flex items-center gap-2 truncate">
        <!-- Prefijo de Etiqueta (ej: Período: o Estado:) -->
        <span v-if="labelPrefix" class="text-zinc-500 dark:text-zinc-400 font-normal shrink-0">
          {{ labelPrefix }}
        </span>

        <!-- Dot de Color o Icono -->
        <span
          v-if="opcionSeleccionada()?.dotColor"
          :class="['w-2 h-2 rounded-full shrink-0', opcionSeleccionada()?.dotColor]"
        ></span>

        <component
          :is="opcionSeleccionada()?.icon"
          v-if="opcionSeleccionada()?.icon"
          class="w-3.5 h-3.5 shrink-0 opacity-80"
        />

        <!-- Texto Seleccionado -->
        <span :class="['truncate', opcionSeleccionada()?.colorClass]">
          {{ opcionSeleccionada()?.label || placeholder }}
        </span>
      </div>

      <!-- Icono Chevron con rotación fluida al abrir/cerrar -->
      <ChevronDown
        :class="[
          'w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 shrink-0 ml-1',
          abierto ? 'rotate-180 text-zinc-900 dark:text-white' : ''
        ]"
      />
    </button>

    <!-- Menú Desplegable Flotante (Popup) adaptativo -->
    <div
      v-if="abierto"
      :class="[
        'absolute z-50 mt-1.5 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-700/80 rounded-2xl p-1.5 shadow-2xl shadow-black/10 dark:shadow-black/90 space-y-0.5 text-xs focus:outline-none transition-all',
        align === 'right' ? 'right-0' : 'left-0',
        minWidthClass
      ]"
      role="listbox"
    >
      <button
        v-for="op in options"
        :key="String(op.value)"
        type="button"
        @click="seleccionar(op)"
        :class="[
          'w-full text-left px-3.5 py-2.5 rounded-xl transition flex items-center justify-between group',
          modelValue === op.value
            ? 'bg-indigo-50 dark:bg-zinc-800 text-indigo-900 dark:text-white font-semibold shadow-sm'
            : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60 font-normal'
        ]"
        role="option"
        :aria-selected="modelValue === op.value"
      >
        <div class="flex items-center gap-2.5 truncate">
          <!-- Punto indicador de estado -->
          <span
            v-if="op.dotColor"
            :class="['w-2 h-2 rounded-full shrink-0', op.dotColor]"
          ></span>

          <!-- Icono de opción -->
          <component
            :is="op.icon"
            v-if="op.icon"
            class="w-3.5 h-3.5 shrink-0 opacity-75 group-hover:opacity-100"
          />

          <!-- Etiqueta -->
          <span :class="op.colorClass">{{ op.label }}</span>
        </div>

        <!-- Checkmark indicador -->
        <Check
          v-if="modelValue === op.value"
          class="w-4 h-4 text-indigo-600 dark:text-white shrink-0 ml-3"
        />
      </button>
    </div>
  </div>
</template>
