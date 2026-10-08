<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { 
  Building2, 
  Kanban, 
  BarChart3, 
  Layers, 
  Settings, 
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
  <aside class="w-64 bg-[#0c0c0e] border-r border-white/[0.06] flex flex-col shrink-0 select-none">
    <!-- Logotipo y Nombre del Sistema -->
    <div class="h-14 px-4 border-b border-white/[0.06] flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400/20 via-emerald-500/10 to-transparent border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
        <Layers class="w-4 h-4 stroke-[2.2]" />
      </div>
      <div class="overflow-hidden min-w-0">
        <div class="font-semibold text-xs tracking-tight text-zinc-100 truncate" :title="perfilEmpresa.nombreComercial || perfilEmpresa.razonSocial">
          {{ perfilEmpresa.nombreComercial || perfilEmpresa.razonSocial }}
        </div>
        <div class="text-[10px] text-zinc-500 flex items-center gap-1.5 font-mono truncate">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-sm shadow-emerald-500/50"></span>
          <span>RNC {{ perfilEmpresa.identificacionFiscal || '1-32-45890-1' }}</span>
        </div>
      </div>
    </div>

    <!-- Navegación Principal -->
    <div class="p-3 space-y-1 flex-1">
      <div class="px-2.5 pt-2 pb-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest font-mono">
        Módulos
      </div>

      <router-link
        v-for="enlace in enlaces"
        :key="enlace.ruta"
        :to="enlace.ruta"
        :class="[
          'group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
          route.path === enlace.ruta || (enlace.ruta !== '/' && route.path.startsWith(enlace.ruta))
            ? 'bg-zinc-800/80 text-zinc-100 border border-white/[0.08] shadow-sm'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
        ]"
      >
        <div class="flex items-center gap-2.5">
          <component 
            :is="enlace.icono" 
            :class="[
              'w-4 h-4 transition-colors',
              route.path === enlace.ruta ? 'text-emerald-400 stroke-[2]' : 'text-zinc-500 group-hover:text-zinc-300'
            ]" 
          />
          <span>{{ enlace.nombre }}</span>
        </div>
        <span 
          v-if="route.path === enlace.ruta" 
          class="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80"
        ></span>
      </router-link>
    </div>

    <!-- Pie de Barra Lateral con Estado del Sistema -->
    <div class="p-3 border-t border-white/[0.06]">
      <div class="px-3 py-2 rounded-lg bg-zinc-900/60 border border-white/[0.05] flex items-center justify-between text-[11px]">
        <div class="flex items-center gap-2 text-zinc-300">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span class="text-xs font-medium text-zinc-300">PostgreSQL</span>
        </div>
        <span class="font-mono text-[10px] text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-white/[0.06]">v16.2</span>
      </div>
    </div>
  </aside>
</template>
