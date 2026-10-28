<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue';
import type { Component } from 'vue';
import { useRoute } from 'vue-router';
import { 
  Building2, 
  Kanban, 
  BarChart3, 
  Settings, 
  Users,
  Mail,
  Send,
  CalendarClock,
  Calculator,
  MessageSquare,
  History,
  X
} from 'lucide-vue-next';
import { useUiStore } from '@/core/ui/ui.store';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import { empresaService } from '@/modules/configuracion/services/empresa.service';
import { webmailService } from '@/modules/comunicaciones/services/webmail.service';
import { whatsAppChatService } from '@/modules/comunicaciones/services/whatsapp-chat.service';
import { actividadesService } from '@/modules/agenda/services/actividades.service';
import { pipelineService } from '@/modules/pipeline/services/pipeline.service';

const route = useRoute();
const uiStore = useUiStore();
const authStore = useAuthStore();
const perfilEmpresa = computed(() => empresaService.datos.value);

const esModoDemo = import.meta.env.VITE_USE_MOCK === 'true';
const etiquetaFuenteDatos = computed(() => (esModoDemo ? 'Modo demo' : 'Servidor API'));
const etiquetaConexion = computed(() => (esModoDemo ? 'Local' : 'Online'));

watch(
  () => route.path,
  () => uiStore.cerrarMenuMovil()
);

const totalCorreosNoLeidos = computed(() => webmailService.totalNoLeidos.value);
const totalWhatsAppNoLeidos = computed(() => whatsAppChatService.totalNoLeidos.value);

const metricasAgenda = computed(() => actividadesService.obtenerMetricas());
const totalTareasHoy = computed(() => metricasAgenda.value.pendientesHoy);
const totalTareasPendientes = computed(() => 
  actividadesService.actividades.value.filter((a) => a.estado === 'pendiente').length
);

const totalTarjetasPipelineHoy = computed(() => pipelineService.totalTarjetasHoy.value);

interface EnlaceMenu {
  nombre: string;
  ruta: string;
  icono: Component;
  permisos: string[];
  conteo?: number;
  etiquetaConteo?: string;
  tipoBadge?: 'indigo' | 'amber' | 'emerald';
}

const enlaces = computed(() => ([
  { nombre: 'Métricas & KPIs', ruta: '/', icono: BarChart3, permisos: ['metricas:ver_kpis', 'metricas:ver_ejecutivos'] },
  { nombre: 'Cartera Clientes', ruta: '/clientes', icono: Building2, permisos: ['clientes:ver'] },
  { 
    nombre: 'Pipeline Kanban', 
    ruta: '/pipeline', 
    icono: Kanban,
    permisos: ['pipeline:ver'],
    conteo: totalTarjetasPipelineHoy.value,
    etiquetaConteo: totalTarjetasPipelineHoy.value === 1 ? '1 para hoy' : `${totalTarjetasPipelineHoy.value} para hoy`,
    tipoBadge: 'indigo',
  },
  { nombre: 'Catálogo & CPQ', ruta: '/catalogo', icono: Calculator, permisos: ['comunicaciones:documentos'] },
  { 
    nombre: 'Agenda & Tareas', 
    ruta: '/agenda', 
    icono: CalendarClock,
    permisos: ['clientes:ver'],
    conteo: totalTareasHoy.value > 0 ? totalTareasHoy.value : totalTareasPendientes.value,
    etiquetaConteo: totalTareasHoy.value > 0
      ? (totalTareasHoy.value === 1 ? '1 para hoy' : `${totalTareasHoy.value} para hoy`)
      : (totalTareasPendientes.value === 1 ? '1 pendiente' : `${totalTareasPendientes.value} pendientes`),
    tipoBadge: 'amber',
  },
  { 
    nombre: 'WhatsApp CRM', 
    ruta: '/whatsapp', 
    icono: MessageSquare,
    permisos: ['comunicaciones:ver'],
    conteo: totalWhatsAppNoLeidos.value,
    etiquetaConteo: totalWhatsAppNoLeidos.value === 1 ? '1 nuevo' : `${totalWhatsAppNoLeidos.value} nuevos`,
    tipoBadge: 'emerald',
  },
  { 
    nombre: 'Bandeja de Correo', 
    ruta: '/comunicaciones', 
    icono: Mail,
    permisos: ['comunicaciones:ver'],
    conteo: totalCorreosNoLeidos.value,
    etiquetaConteo: totalCorreosNoLeidos.value === 1 ? '1 nuevo' : `${totalCorreosNoLeidos.value} nuevos`,
    tipoBadge: 'indigo',
  },
  { nombre: 'Despacho Masivo', ruta: '/despacho', icono: Send, permisos: ['comunicaciones:enviar'] },
  { nombre: 'Usuarios & Roles', ruta: '/usuarios', icono: Users, permisos: ['usuarios:ver'] },
  { nombre: 'Auditoría & Eventos', ruta: '/auditoria', icono: History, permisos: ['usuarios:ver'] },
  { nombre: 'Empresa & Ajustes', ruta: '/configuracion', icono: Settings, permisos: ['configuracion:ver'] },
] satisfies EnlaceMenu[]).filter((enlace) => authStore.tieneAlgunPermiso(enlace.permisos)));

let timerSidebarPoller: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  const puedeVerComunicaciones = authStore.tienePermiso('comunicaciones:ver');

  if (puedeVerComunicaciones) {
    webmailService.actualizarConteoNoLeidos();
    whatsAppChatService.cargarChats();
  }

  if (authStore.tienePermiso('pipeline:ver') && pipelineService.obtenerCantidadTarjetas() === 0) {
    await pipelineService.obtenerTarjetas('pipeline-visitas');
  }

  if (puedeVerComunicaciones) {
    timerSidebarPoller = setInterval(() => {
      webmailService.actualizarConteoNoLeidos();
      whatsAppChatService.cargarChats();
    }, 30000);
  }
});

onUnmounted(() => {
  if (timerSidebarPoller) {
    clearInterval(timerSidebarPoller);
    timerSidebarPoller = null;
  }
});

const esRutaActiva = (ruta: string) => {
  if (ruta === '/') {
    return route.path === '/' || route.path === '/metricas';
  }
  if (ruta === '/comunicaciones') {
    return (
      route.path === '/comunicaciones' ||
      route.path === '/correo' ||
      route.path === '/webmail'
    );
  }
  if (ruta === '/despacho') {
    return (
      route.path === '/despacho' ||
      route.path.startsWith('/despacho') ||
      route.path.startsWith('/comunicaciones/despacho')
    );
  }
  return route.path === ruta || route.path.startsWith(ruta);
};
</script>

<template>
  <aside
    :class="[
      'w-64 h-full bg-white dark:bg-[#0c0c0e] border-r border-zinc-200 dark:border-white/[0.06] flex flex-col shrink-0 select-none transition-transform duration-200 lg:static lg:translate-x-0',
      uiStore.menuMovilAbierto ? 'translate-x-0' : '-translate-x-full',
      'fixed inset-y-0 left-0 z-50'
    ]"
  >
    <!-- Logotipo y Nombre del Sistema -->
    <div class="h-14 px-4 border-b border-zinc-200 dark:border-white/[0.06] flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg overflow-hidden border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center shrink-0 bg-white dark:bg-zinc-900">
        <img
          v-if="perfilEmpresa.logoUrl"
          :src="perfilEmpresa.logoUrl"
          alt="Logotipo"
          class="w-full h-full object-contain p-0.5"
        />
        <img
          v-else
          src="/crm-logo.svg"
          alt="CRM"
          class="w-full h-full object-cover p-0.5"
        />
      </div>
      <div class="overflow-hidden min-w-0">
        <div class="font-semibold text-xs tracking-tight text-zinc-900 dark:text-zinc-100 truncate" :title="perfilEmpresa.nombreComercial || perfilEmpresa.razonSocial">
          {{ perfilEmpresa.nombreComercial || perfilEmpresa.razonSocial }}
        </div>
        <div class="text-[10px] text-zinc-500 flex items-center gap-1.5 font-mono truncate">
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 shadow-sm shadow-indigo-500/50"></span>
          <span>RNC {{ perfilEmpresa.identificacionFiscal || '—' }}</span>
        </div>
      </div>

      <button
        type="button"
        @click="uiStore.cerrarMenuMovil"
        class="lg:hidden ml-auto p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        title="Cerrar menú"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Navegación Principal -->
    <div class="p-3 space-y-1 flex-1">
      <div class="px-2.5 pt-2 pb-1.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-mono">
        Módulos
      </div>

      <div
        v-if="enlaces.length === 0"
        class="px-3 py-4 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 rounded-lg border border-dashed border-zinc-200 dark:border-white/[0.08]"
      >
        Tu rol no tiene módulos habilitados. Contacta a un administrador para que asigne permisos.
      </div>

      <router-link
        v-for="enlace in enlaces"
        :key="enlace.ruta"
        :to="enlace.ruta"
        :class="[
          'group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium no-underline hover:no-underline transition-all duration-150',
          esRutaActiva(enlace.ruta)
            ? 'bg-indigo-50/90 text-indigo-700 border border-indigo-200/80 shadow-sm dark:bg-zinc-800/80 dark:text-zinc-100 dark:border-white/[0.08]'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-zinc-900/60 border border-transparent'
        ]"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <component 
            :is="enlace.icono" 
            :class="[
              'w-4 h-4 shrink-0 transition-colors',
              esRutaActiva(enlace.ruta) 
                ? 'text-indigo-600 dark:text-indigo-400 stroke-[2]' 
                : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
            ]" 
          />
          <span class="no-underline truncate">{{ enlace.nombre }}</span>
        </div>

        <div class="flex items-center gap-1.5 shrink-0 ml-2">
          <!-- Badge con conteo si hay elementos nuevos o pendientes -->
          <span
            v-if="enlace.conteo && enlace.conteo > 0"
            class="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight transition-all duration-150 inline-flex items-center gap-1.5 shadow-xs"
            :class="[
              enlace.tipoBadge === 'emerald'
                ? (esRutaActiva(enlace.ruta)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25')
                : enlace.tipoBadge === 'indigo'
                ? (esRutaActiva(enlace.ruta)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/25')
                : (esRutaActiva(enlace.ruta)
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25')
            ]"
          >
            <!-- Punto indicador animado pulsante -->
            <span
              class="w-1.5 h-1.5 rounded-full shrink-0"
              :class="[
                enlace.tipoBadge === 'emerald'
                  ? (esRutaActiva(enlace.ruta) ? 'bg-white animate-pulse' : 'bg-emerald-600 dark:bg-emerald-400 animate-pulse')
                  : enlace.tipoBadge === 'indigo'
                  ? (esRutaActiva(enlace.ruta) ? 'bg-white animate-pulse' : 'bg-indigo-600 dark:bg-indigo-400 animate-pulse')
                  : (esRutaActiva(enlace.ruta) ? 'bg-white animate-pulse' : 'bg-amber-600 dark:bg-amber-400 animate-pulse')
              ]"
            ></span>
            <span>{{ enlace.etiquetaConteo }}</span>
          </span>

          <!-- Punto indicador de ruta activa si no tiene badge de conteo -->
          <span 
            v-else-if="esRutaActiva(enlace.ruta)" 
            class="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-sm shadow-indigo-500/80"
          ></span>
        </div>
      </router-link>
    </div>

    <!-- Pie de Barra Lateral con Estado del Sistema -->
    <div class="p-3 border-t border-zinc-200 dark:border-white/[0.06]">
      <div class="px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/[0.05] flex items-center justify-between text-[11px]">
        <div class="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
          <span class="relative flex h-2 w-2">
            <span
              class="absolute inline-flex h-full w-full rounded-full opacity-75"
              :class="esModoDemo ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-ping'"
            ></span>
            <span
              class="relative inline-flex rounded-full h-2 w-2"
              :class="esModoDemo ? 'bg-amber-500' : 'bg-emerald-600 dark:bg-emerald-500'"
            ></span>
          </span>
          <span class="text-xs font-medium text-zinc-800 dark:text-zinc-300">{{ etiquetaFuenteDatos }}</span>
        </div>
        <span class="font-mono text-[10px] text-zinc-500 bg-white dark:bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-white/[0.06]">{{ etiquetaConexion }}</span>
      </div>
    </div>
  </aside>
</template>

<style scoped>
a,
:deep(a) {
  text-decoration: none !important;
}
</style>
