<script setup lang="ts">
import { computed } from 'vue';
import { sanitizeHtml } from '@/core/security/html';

const props = defineProps<{ html: string }>();

const contenido = computed(() => sanitizeHtml(props.html));
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- el HTML se sanitiza con DOMPurify antes de insertarse -->
  <div class="contents" v-html="contenido"></div>
</template>
