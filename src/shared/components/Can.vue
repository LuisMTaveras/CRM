<script setup lang="ts">
import { computed } from 'vue';
import { globalAbility, type Action, type Subject } from '@/core/permissions/ability';
import { useAuthStore } from '@/modules/auth/stores/auth.store';

const props = defineProps<{
  I: Action;
  an?: Subject;
  this?: Subject;
  data?: Record<string, unknown>;
}>();

const authStore = useAuthStore();

const allowed = computed(() => {
  // Dependencia reactiva: reevalúa inmediatamente si cambia de usuario o rol
  void authStore.rol;
  void authStore.usuario;
  const subject = props.an || props.this || 'all';
  return globalAbility.can(props.I, subject, props.data);
});
</script>

<template>
  <slot v-if="allowed" />
  <slot v-else name="fallback" />
</template>
