<script setup lang="ts">
import { computed } from 'vue';
import { sectoresService } from '@/modules/clientes/services/sectores.service';

const props = withDefaults(
  defineProps<{
    sector: string;
    mostrarIcono?: boolean;
    tamano?: 'xs' | 'sm' | 'md';
    interactivo?: boolean;
  }>(),
  {
    mostrarIcono: true,
    tamano: 'xs',
    interactivo: false,
  }
);

const sectorData = computed(() => sectoresService.obtenerSectorPorNombre(props.sector));
const iconoComponente = computed(() => sectoresService.obtenerIconoComponente(props.sector));
const colorBadge = computed(() => sectoresService.obtenerColorSector(props.sector));
const etiqueta = computed(() => sectorData.value?.nombre || props.sector || 'General');
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 font-medium rounded-lg border transition-all select-none',
      colorBadge,
      tamano === 'xs' ? 'px-2 py-0.5 text-[11px]' : tamano === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
      interactivo ? 'hover:brightness-110 cursor-pointer' : ''
    ]"
    :title="`Sector Económico: ${etiqueta}`"
  >
    <component
      :is="iconoComponente"
      v-if="mostrarIcono"
      :class="[
        'shrink-0',
        tamano === 'xs' ? 'w-3 h-3' : tamano === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
      ]"
    />
    <span class="truncate">{{ etiqueta }}</span>
  </span>
</template>
