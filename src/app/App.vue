<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import SidebarNav from '@/shared/components/SidebarNav.vue';
import HeaderBar from '@/shared/components/HeaderBar.vue';
import ToastContainer from '@/shared/components/ToastContainer.vue';
import AppConfirmModal from '@/shared/components/AppConfirmModal.vue';
import { themeService } from '@/core/theme/theme.service';
import { whatsAppChatService } from '@/modules/comunicaciones/services/whatsapp-chat.service';
import { webmailService } from '@/modules/comunicaciones/services/webmail.service';
import { actividadesService } from '@/modules/agenda/services/actividades.service';
import { useUiStore } from '@/core/ui/ui.store';

const route = useRoute();
const uiStore = useUiStore();

onMounted(() => {
  themeService.inicializarTema();
  // Conectar escucha global en tiempo real de WhatsApp
  whatsAppChatService.conectarSSE();
  // Conectar escucha global en tiempo real de correos electrónicos
  webmailService.conectarSSE();
  // Iniciar vigilante periódico de tareas y compromisos de la agenda
  actividadesService.iniciarVigilanteAgenda();
});
</script>

<template>
  <!-- Vista Limpia para Login sin Barras de Navegación -->
  <div v-if="route.path === '/login'" class="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
    <router-view />
  </div>

  <!-- Layout Principal de la Aplicación -->
  <div v-else class="flex h-dvh w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
    <div
      v-if="uiStore.menuMovilAbierto"
      class="fixed inset-0 z-40 bg-zinc-950/50 backdrop-blur-sm lg:hidden"
      @click="uiStore.cerrarMenuMovil"
    ></div>

    <!-- Navegación Lateral -->
    <SidebarNav />

    <!-- Área de Trabajo Principal -->
    <div class="flex-1 flex flex-col h-full overflow-hidden min-w-0">
      <!-- Barra Superior -->
      <HeaderBar />

      <!-- Vista de Rutas con Scroll Interno -->
      <main class="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-6 pt-2.5 pb-6 bg-zinc-50 dark:bg-zinc-950">
        <router-view />
      </main>
    </div>
  </div>

  <!-- Contenedores Globales del Sistema -->
  <ToastContainer />
  <AppConfirmModal />
</template>