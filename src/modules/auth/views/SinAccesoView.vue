<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ShieldX, LogOut, ArrowLeft } from 'lucide-vue-next';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import { obtenerRutaInicial } from '@/core/permissions/permisos-rutas';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const rutaInicial = computed(() => obtenerRutaInicial(authStore.tienePermiso));
const rutaSolicitada = computed(() => {
  const desde = route.query.desde;
  return typeof desde === 'string' ? desde : '';
});

const volverAlInicio = () => {
  if (rutaInicial.value) {
    router.push(rutaInicial.value.ruta);
  }
};

const cerrarSesion = () => {
  authStore.cerrarSesion();
  router.push('/login');
};
</script>

<template>
  <div class="flex min-h-dvh items-center justify-center bg-zinc-100 dark:bg-zinc-950 px-4">
    <div class="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-white/[0.08] dark:bg-zinc-900">
      <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
        <ShieldX class="h-6 w-6" />
      </div>

      <h1 class="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">Acceso restringido</h1>
      <p class="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        Tu rol no tiene el permiso necesario para abrir esta sección.
        <span v-if="rutaSolicitada" class="mt-1 block font-mono text-[11px] text-zinc-400">{{ rutaSolicitada }}</span>
      </p>

      <div class="mt-6 flex flex-col gap-2">
        <button
          v-if="rutaInicial"
          type="button"
          @click="volverAlInicio"
          class="inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-indigo-500"
        >
          <ArrowLeft class="h-3.5 w-3.5" />
          Ir a una sección permitida
        </button>
        <button
          type="button"
          @click="cerrarSesion"
          class="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-white/[0.08] dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <LogOut class="h-3.5 w-3.5" />
          Cerrar sesión
        </button>
      </div>
    </div>
  </div>
</template>
