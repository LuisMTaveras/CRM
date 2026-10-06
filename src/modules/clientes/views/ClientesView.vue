<script setup lang="ts">
import { ref } from 'vue';
import { useClientes } from '../composables/useClientes';
import DashboardKpis from '@/modules/dashboard/components/DashboardKpis.vue';
import ClientesDataGrid from '../components/ClientesDataGrid.vue';
import ClienteDrawer from '../components/ClienteDrawer.vue';
import NuevoClienteModal from '../components/NuevoClienteModal.vue';
import EnvioMasivoModal from '@/modules/comunicaciones/components/EnvioMasivoModal.vue';
import { RefreshCw, AlertCircle, Database, RotateCcw } from 'lucide-vue-next';
import type { Cliente } from '../types/cliente.types';

const {
  parametrosURL,
  actualizarEstado,
  clientes,
  cargando,
  error,
  total,
  totalPaginas,
  estadisticas,
  clienteSeleccionado,
  drawerAbierto,
  modalNuevoClienteAbierto,
  consultarClientes,
  restablecerDatosIniciales,
  seleccionarCliente,
  cerrarDrawer,
  cambiarEstadoCliente,
  eliminarCliente,
} = useClientes();

const modalEnvioMasivoAbierto = ref(false);
const clientesParaEnvio = ref<Cliente[]>([]);

const abrirEnvioMasivo = (seleccionados: Cliente[]) => {
  clientesParaEnvio.value = [...seleccionados];
  modalEnvioMasivoAbierto.value = true;
};

const abrirEnvioIndividual = (cliente: Cliente) => {
  clientesParaEnvio.value = [cliente];
  modalEnvioMasivoAbierto.value = true;
};

const onEnvioCompletado = () => {
  consultarClientes();
};
</script>

<template>
  <div class="space-y-4">
    <!-- Barra de Título y Metadatos de la Sección -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-bold text-zinc-100 tracking-tight">Directorio Comercial & Clientes B2B</h1>
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-900 border border-zinc-700 text-zinc-300">
            <Database class="w-3 h-3 text-emerald-400" />
            PostgreSQL DB
          </span>
        </div>
        <p class="text-xs text-zinc-400 mt-0.5">
          Gestión de prospectos, clientes consolidados, oportunidades y trazabilidad de cartera
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="restablecerDatosIniciales"
          :disabled="cargando"
          title="Recargar catálogo inicial de 100+ clientes y contactos semilla"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition disabled:opacity-50"
        >
          <RotateCcw class="w-3.5 h-3.5 text-emerald-400" />
          <span class="hidden sm:inline">Recargar 100+ Clientes</span>
        </button>

        <button
          @click="consultarClientes"
          :disabled="cargando"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition disabled:opacity-50"
        >
          <RefreshCw :class="['w-3.5 h-3.5', cargando ? 'animate-spin text-emerald-400' : '']" />
          <span>Actualizar</span>
        </button>
      </div>
    </div>

    <!-- Alerta de Error si ocurre -->
    <div
      v-if="error"
      class="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-3 text-xs text-rose-300"
    >
      <AlertCircle class="w-4 h-4 text-rose-400 shrink-0" />
      <span>{{ error }}</span>
    </div>

    <!-- Indicadores Clave de Rendimiento (KPIs) -->
    <DashboardKpis
      :estadisticas="estadisticas"
      :cargando="cargando"
    />

    <!-- Data-Grid Principal con sincronización URL -->
    <ClientesDataGrid
      :clientes="clientes"
      :cargando="cargando"
      :total="total"
      :totalPaginas="totalPaginas"
      :parametros="parametrosURL"
      @actualizarParametros="actualizarEstado"
      @seleccionar="seleccionarCliente"
      @nuevoCliente="modalNuevoClienteAbierto = true"
      @enviarMasivo="abrirEnvioMasivo"
    />

    <!-- Panel Lateral de Detalle (Split-Pane / Drawer) -->
    <ClienteDrawer
      :abierto="drawerAbierto"
      :cliente="clienteSeleccionado"
      @cerrar="cerrarDrawer"
      @cambiarEstado="cambiarEstadoCliente"
      @eliminar="eliminarCliente"
      @enviarDocumento="abrirEnvioIndividual"
      @actualizar="consultarClientes"
    />

    <!-- Modal de Creación con Validación Zod -->
    <NuevoClienteModal
      :abierto="modalNuevoClienteAbierto"
      @cerrar="modalNuevoClienteAbierto = false"
      @creado="consultarClientes"
    />

    <!-- Modal de Envío Masivo & Generación de PDF -->
    <EnvioMasivoModal
      v-if="modalEnvioMasivoAbierto"
      :abierto="modalEnvioMasivoAbierto"
      :clientes="clientesParaEnvio"
      @cerrar="modalEnvioMasivoAbierto = false"
      @completado="onEnvioCompletado"
    />
  </div>
</template>
