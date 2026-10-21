<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { 
  Building2, 
  Kanban, 
  BarChart3, 
  Layers, 
  Settings, 
  Users,
  Mail,
  Send,
  CalendarClock,
  Calculator,
  MessageSquare
} from 'lucide-vue-next';
import { empresaService } from '@/modules/configuracion/services/empresa.service';
import { webmailService } from '@/modules/comunicaciones/services/webmail.service';
import { whatsAppChatService } from '@/modules/comunicaciones/services/whatsapp-chat.service';
import { actividadesService } from '@/modules/agenda/services/actividades.service';
import { pipelineService } from '@/modules/pipeline/services/pipeline.service';

const route = useRoute();
const perfilEmpresa = computed(() => empresaService.datos.value);

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
  icono: any;
  conteo?: number;
  etiquetaConteo?: string;
  tipoBadge?: 'indigo' | 'amber' | 'emerald';
}

const enlaces = computed((): EnlaceMenu[] => [
  { nombre: 'Métricas & KPIs', ruta: '/', icono: BarChart3 },
  { nombre: 'Cartera Clientes', ruta: '/clientes', icono: Building2 },
  { 
    nombre: 'Pipeline Kanban', 
    ruta: '/pipeline', 
    icono: Kanban,
    conteo: totalTarjetasPipelineHoy.value,
    etiquetaConteo: totalTarjetasPipelineHoy.value === 1 ? '1 para hoy' : `${totalTarjetasPipelineHoy.value} para hoy`,
    tipoBadge: 'indigo',
  },
  { nombre: 'Catálogo & CPQ', ruta: '/catalogo', icono: Calculator },
  { 
    nombre: 'Agenda & Tareas', 
    ruta: '/agenda', 
    icono: CalendarClock,
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
    conteo: totalWhatsAppNoLeidos.value,
    etiquetaConteo: totalWhatsAppNoLeidos.value === 1 ? '1 nuevo' : `${totalWhatsAppNoLeidos.value} nuevos`,
    tipoBadge: 'emerald',
  },
  { 
    nombre: 'Bandeja de Correo', 
    ruta: '/comunicaciones', 
    icono: Mail,
    conteo: totalCorreosNoLeidos.value,
    etiquetaConteo: totalCorreosNoLeidos.value === 1 ? '1 nuevo' : `${totalCorreosNoLeidos.value} nuevos`,
    tipoBadge: 'indigo',
  },
  { nombre: 'Despacho Masivo', ruta: '/despacho', icono: Send },
  { nombre: 'Usuarios & Roles', ruta: '/usuarios', icono: Users },
  { nombre: 'Empresa & Ajustes', ruta: '/configuracion', icono: Settings },
]);

let timerSidebarPoller: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  webmailService.actualizarConteoNoLeidos();
  whatsAppChatService.cargarChats();
  if (pipelineService.obtenerCantidadTarjetas() === 0) {
    await pipelineService.obtenerTarjetas('pipeline-visitas');
  }
  timerSidebarPoller = setInterval(() => {
    webmailService.actualizarConteoNoLeidos();
    whatsAppChatService.cargarChats();
  }, 30000);
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
  <aside class="w-64 bg-white dark:bg-[#0c0c0e] border-r border-zinc-200 dark:border-white/[0.06] flex flex-col shrink-0 select-none transition-colors duration-200">
    <!-- Logotipo y Nombre del Sistema -->
    <div class="h-14 px-4 border-b border-zinc-200 dark:border-white/[0.06] flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg overflow-hidden border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center shrink-0 bg-white dark:bg-zinc-900">
        <img
          v-if="perfilEmpresa.logoUrl"
          :src="perfilEmpresa.logoUrl"
          alt="Logotipo"
          class="w-full h-full object-contain p-0.5"
        />
        <div
          v-else
          class="w-full h-full bg-gradient-to-br from-indigo-500/20 via-indigo-600/10 to-transparent flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner"
        >
          <Layers class="w-4 h-4 stroke-[2.2]" />
        </div>
      </div>
      <div class="overflow-hidden min-w-0">
        <div class="font-semibold text-xs tracking-tight text-zinc-900 dark:text-zinc-100 truncate" :title="perfilEmpresa.nombreComercial || perfilEmpresa.razonSocial">
          {{ perfilEmpresa.nombreComercial || perfilEmpresa.razonSocial }}
        </div>
        <div class="text-[10px] text-zinc-500 flex items-center gap-1.5 font-mono truncate">
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 shadow-sm shadow-indigo-500/50"></span>
          <span>RNC {{ perfilEmpresa.identificacionFiscal || '1-32-45890-1' }}</span>
        </div>
      </div>
    </div>

    <!-- Navegación Principal -->
    <div class="p-3 space-y-1 flex-1">
      <div class="px-2.5 pt-2 pb-1.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-mono">
        Módulos
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
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-600 dark:bg-indigo-500"></span>
          </span>
          <span class="text-xs font-medium text-zinc-800 dark:text-zinc-300">PostgreSQL</span>
        </div>
        <span class="font-mono text-[10px] text-zinc-500 bg-white dark:bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-white/[0.06]">v16.2</span>
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
