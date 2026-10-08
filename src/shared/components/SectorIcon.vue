<script setup lang="ts">
import { computed } from 'vue';
import { sectoresService } from '@/modules/clientes/services/sectores.service';

const props = withDefaults(
  defineProps<{
    sector: string;
    class?: string;
  }>(),
  {
    class: 'w-3.5 h-3.5',
  }
);

const iconoComponente = computed(() => sectoresService.obtenerIconoComponente(props.sector));
const sectorData = computed(() => sectoresService.obtenerSectorPorNombre(props.sector));
</script>

<template>
  <component
    :is="iconoComponente"
    :class="[props.class, 'shrink-0 inline-block']"
    :title="sectorData?.nombre || sector"
  />
</template>
