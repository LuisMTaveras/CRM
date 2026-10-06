<script setup lang="ts">
import { ref } from 'vue';
import { Kanban, Building2, Calendar, RefreshCw } from 'lucide-vue-next';
import { formatearMoneda } from '@/core/lib/utils';
import { FlickerlessSurface } from '@flickerless/vue';

interface TarjetaTrato {
  id: string;
  cliente: string;
  titulo: string;
  monto: number;
  probabilidad: number;
  fecha: string;
  etapa: 'calificacion' | 'propuesta' | 'negociacion' | 'ganada';
}

const cargando = ref(false);

const recargarPipeline = async () => {
  cargando.value = true;
  await new Promise((r) => setTimeout(r, 450));
  cargando.value = false;
};

const tratos = ref<TarjetaTrato[]>([
  {
    id: '1',
    cliente: 'LogiGlobal',
    titulo: 'Sistema de Trazabilidad en Tiempo Real',
    monto: 28000000,
    probabilidad: 40,
    fecha: '05 Dic 2026',
    etapa: 'calificacion',
  },
  {
    id: '2',
    cliente: 'Biobío Alimentos',
    titulo: 'Portal B2B de Pedidos Mayorista',
    monto: 34000000,
    probabilidad: 50,
    fecha: '20 Dic 2026',
    etapa: 'calificacion',
  },
  {
    id: '3',
    cliente: 'Red Santa María',
    titulo: 'Ficha Clínica y Portal Pacientes',
    monto: 85000000,
    probabilidad: 70,
    fecha: '30 Nov 2026',
    etapa: 'propuesta',
  },
  {
    id: '4',
    cliente: 'Andina Tech',
    titulo: 'Renovación Cloud y Licenciamiento',
    monto: 45000000,
    probabilidad: 85,
    fecha: '15 Nov 2026',
    etapa: 'negociacion',
  },
  {
    id: '5',
    cliente: 'Inversur Capital',
    titulo: 'Dashboard de Inversiones & Portafolios',
    monto: 72000000,
    probabilidad: 80,
    fecha: '10 Nov 2026',
    etapa: 'negociacion',
  },
  {
    id: '6',
    cliente: 'Seguros del Sur',
    titulo: 'Automatización de Pólizas y Siniestros',
    monto: 120000000,
    probabilidad: 100,
    fecha: '30 Ago 2026',
    etapa: 'ganada',
  },
  {
    id: '7',
    cliente: 'Ripley Corporativo',
    titulo: 'Plataforma Omnicanal y Fidelización',
    monto: 195000000,
    probabilidad: 100,
    fecha: '15 Jul 2026',
    etapa: 'ganada',
  },
]);

const columnas = [
  { clave: 'calificacion', titulo: 'Calificación', color: 'border-sky-500/40 text-sky-400' },
  { clave: 'propuesta', titulo: 'Propuesta Enviada', color: 'border-indigo-500/40 text-indigo-400' },
  { clave: 'negociacion', titulo: 'En Negociación', color: 'border-amber-500/40 text-amber-400' },
  { clave: 'ganada', titulo: 'Cerrada Ganada', color: 'border-emerald-500/40 text-emerald-400' },
];

const totalPorColumna = (clave: string) => {
  return tratos.value
    .filter((t) => t.etapa === clave)
    .reduce((acc, t) => acc + t.monto, 0);
};
</script>

<template>
  <div class="space-y-4">
    <!-- Encabezado de la Sección -->
    <div class="flex items-center justify-between pb-4 border-b border-white/[0.07]">
      <div>
        <h1 class="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
          <Kanban class="w-5 h-5 text-emerald-400" />
          Pipeline Comercial de Oportunidades
        </h1>
        <p class="text-xs text-zinc-400 mt-1">
          Vista dinámica de deals clasificados por etapas de maduración comercial
        </p>
      </div>

      <button
        @click="recargarPipeline"
        :disabled="cargando"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 text-xs font-medium transition shadow-sm hover:border-white/[0.16] disabled:opacity-50"
      >
        <RefreshCw :class="['w-3.5 h-3.5 text-zinc-400', cargando ? 'animate-spin text-emerald-400' : '']" />
        <span>Actualizar Pipeline</span>
      </button>
    </div>

    <!-- Tablero Kanban de 4 Columnas protegido con Flickerless -->
    <FlickerlessSurface
      :loading="cargando"
      :delay-ms="180"
      :preserve-height="true"
      stream-color="#10b981"
      announce-text="Actualizando estado de oportunidades en el pipeline..."
      class="rounded-xl overflow-hidden"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
      <div
        v-for="col in columnas"
        :key="col.clave"
        class="saas-card rounded-xl overflow-hidden flex flex-col border border-white/[0.08]"
      >
        <!-- Cabecera de Columna -->
        <div class="p-3.5 border-b border-white/[0.07] bg-[#0c0c0e]/80 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span :class="['w-2 h-2 rounded-full border', col.color]"></span>
            <span class="text-xs font-semibold text-zinc-200">{{ col.titulo }}</span>
          </div>
          <span class="text-[11px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-md border border-white/[0.06]">
            {{ tratos.filter((t) => t.etapa === col.clave).length }}
          </span>
        </div>

        <!-- Total Acumulado por Etapa -->
        <div class="px-3.5 py-2 bg-[#09090b]/40 border-b border-white/[0.05] text-[11px] font-mono text-zinc-400 flex justify-between">
          <span>Subtotal:</span>
          <span class="text-zinc-200 font-semibold">{{ formatearMoneda(totalPorColumna(col.clave)) }}</span>
        </div>

        <!-- Lista de Tarjetas del Deal -->
        <div class="p-3 space-y-2.5 min-h-[300px]">
          <div
            v-for="trato in tratos.filter((t) => t.etapa === col.clave)"
            :key="trato.id"
            class="bg-zinc-900/60 p-3.5 rounded-xl border border-white/[0.07] hover:border-white/[0.16] hover:bg-zinc-900 transition-all duration-200 cursor-pointer shadow-sm group hover:-translate-y-0.5"
          >
            <div class="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5">
              <span class="font-medium text-emerald-400 flex items-center gap-1.5">
                <Building2 class="w-3.5 h-3.5" />
                {{ trato.cliente }}
              </span>
              <span class="font-mono text-zinc-500 bg-zinc-800/60 px-1.5 py-0.5 rounded text-[10px]">{{ trato.probabilidad }}%</span>
            </div>

            <div class="text-xs font-medium text-zinc-100 group-hover:text-emerald-300 transition-colors mb-2.5 leading-snug">
              {{ trato.titulo }}
            </div>

            <div class="flex items-center justify-between pt-2.5 border-t border-white/[0.05] text-xs">
              <span class="font-mono font-semibold text-zinc-100 tabular-nums">
                {{ formatearMoneda(trato.monto) }}
              </span>
              <span class="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                <Calendar class="w-3 h-3" />
                {{ trato.fecha }}
              </span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </FlickerlessSurface>
  </div>
</template>
