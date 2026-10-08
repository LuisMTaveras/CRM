<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import SidebarNav from '@/shared/components/SidebarNav.vue';
import HeaderBar from '@/shared/components/HeaderBar.vue';
import ToastContainer from '@/shared/components/ToastContainer.vue';
import AppConfirmModal from '@/shared/components/AppConfirmModal.vue';
import { themeService } from '@/core/theme/theme.service';

const route = useRoute();

onMounted(() => {
  themeService.inicializarTema();
});
</script>

<template>
  <!-- Vista Limpia para Login sin Barras de Navegación -->
  <div v-if="route.path === '/login'" class="min-h-screen w-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
    <router-view />
  </div>

  <!-- Layout Principal de la Aplicación -->
  <div v-else class="flex h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
    <!-- Navegación Lateral -->
    <SidebarNav />

    <!-- Área de Trabajo Principal -->
    <div class="flex-1 flex flex-col h-full overflow-hidden">
      <!-- Barra Superior -->
      <HeaderBar />

      <!-- Vista de Rutas con Scroll Interno -->
      <main class="flex-1 overflow-y-auto p-6 bg-zinc-50 dark:bg-zinc-950">
        <router-view />
      </main>
    </div>
  </div>

  <!-- Contenedores Globales del Sistema -->
  <ToastContainer />
  <AppConfirmModal />
</template>
