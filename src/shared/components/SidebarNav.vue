<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { 
  Building2, 
  Kanban, 
  BarChart3, 
  Layers, 
  Settings, 
  ShieldCheck, 
  Users,
  Mail
} from 'lucide-vue-next';
import { empresaService } from '@/modules/configuracion/services/empresa.service';

const route = useRoute();
const perfilEmpresa = computed(() => empresaService.datos.value);

const enlaces = [
  { nombre: 'Cartera Clientes', ruta: '/', icono: Building2 },
  { nombre: 'Pipeline Kanban', ruta: '/pipeline', icono: Kanban },
  { nombre: 'Envíos & Documentos', ruta: '/comunicaciones', icono: Mail },
  { nombre: 'Métricas & KPIs', ruta: '/metricas', icono: BarChart3 },
  { nombre: 'Usuarios & Roles', ruta: '/usuarios', icono: Users },
  { nombre: 'Empresa & Ajustes', ruta: '/configuracion', icono: Settings },
];
</script>

<template>
  <aside class="w-60 bg-zinc-950 border-r border-zinc-800 flex flex-col shrink-0 select-none">
    <!-- Logotipo y Nombre del Sistema -->
    <div class="h-14 px-4 border-b border-zinc-800 flex items-center gap-2.5">
      <div class="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
        <Layers class="w-4 h-4" />
      </div>
      <div class="overflow-hidden">
        <div class="font-bold text-xs tracking-wide text-zinc-100 uppercase truncate" :title="perfilEmpresa.nombreComercial || perfilEmpresa.razonSocial">
          {{ perfilEmpresa.nombreComercial || perfilEmpresa.razonSocial }}
        </div>
        <div class="text-[10px] text-zinc-400 flex items-center gap-1 font-mono truncate">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
          RNC: {{ perfilEmpresa.identificacionFiscal || '1-32-45890-1' }}
        </div>
      </div>
    </div>

    <!-- Navegación Principal -->
    <div class="p-3 space-y-1 flex-1">
      <div class="px-2 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
        Módulos Comerciales
      </div>

      <router-link
        v-for="enlace in enlaces"
        :key="enlace.ruta"
        :to="enlace.ruta"
        :class="[
          'flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors',
          route.path === enlace.ruta
            ? 'bg-zinc-800/80 text-emerald-400 border border-zinc-700/60'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
        ]"
      >
        <component :is="enlace.icono" class="w-4 h-4" />
        <span>{{ enlace.nombre }}</span>
      </router-link>
    </div>

    <!-- Pie de Barra Lateral con Estado del Sistema -->
    <div class="p-3 border-t border-zinc-800 bg-zinc-950/60">
      <div class="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80 flex items-center justify-between text-[11px]">
        <div class="flex items-center gap-2 text-zinc-300">
          <ShieldCheck class="w-4 h-4 text-emerald-400" />
          <span>Conexión DB OK</span>
        </div>
        <span class="font-mono text-[10px] text-zinc-400">pg-v16</span>
      </div>
    </div>
  </aside>
</template>
