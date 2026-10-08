<script setup lang="ts">
import { ref } from 'vue';
import { useClientes } from '../composables/useClientes';
import DashboardKpis from '@/modules/dashboard/components/DashboardKpis.vue';
import ClientesDataGrid from '../components/ClientesDataGrid.vue';
import ClienteDrawer from '../components/ClienteDrawer.vue';
import NuevoClienteModal from '../components/NuevoClienteModal.vue';
import EnvioMasivoModal from '@/modules/comunicaciones/components/EnvioMasivoModal.vue';
import { RefreshCw, AlertCircle, RotateCcw } from 'lucide-vue-next';
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
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
      <div>
        <div class="flex items-center gap-2.5 flex-wrap">
          <h1 class="text-xl font-semibold text-white tracking-tight">Directorio Comercial & Clientes B2B</h1>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            PostgreSQL Conectado
          </span>
        </div>
        <p class="text-xs text-zinc-400 mt-1">
          Gestión centralizada de prospectos, cuentas estratégicas, contratos y trazabilidad de cartera
        </p>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button
          @click="restablecerDatosIniciales"
          :disabled="cargando"
          title="Recargar catálogo inicial de 100+ clientes y contactos semilla"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition shadow-sm hover:border-white/[0.16] disabled:opacity-50"
        >
          <RotateCcw class="w-3.5 h-3.5 text-zinc-400" />
          <span class="hidden sm:inline">Restablecer 100+ Clientes</span>
        </button>

        <button
          @click="consultarClientes"
          :disabled="cargando"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 text-xs font-medium transition shadow-sm hover:border-white/[0.16] disabled:opacity-50"
        >
          <RefreshCw :class="['w-3.5 h-3.5 text-zinc-400', cargando ? 'animate-spin text-emerald-400' : '']" />
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
      :total-paginas="totalPaginas"
      :parametros="parametrosURL"
      @actualizar-parametros="actualizarEstado"
      @seleccionar="seleccionarCliente"
      @nuevo-cliente="modalNuevoClienteAbierto = true"
      @enviar-masivo="abrirEnvioMasivo"
    />

    <!-- Panel Lateral de Detalle (Split-Pane / Drawer) -->
    <ClienteDrawer
      :abierto="drawerAbierto"
      v-model:cliente="clienteSeleccionado"
      @cerrar="cerrarDrawer"
      @cambiar-estado="cambiarEstadoCliente"
      @eliminar="eliminarCliente"
      @enviar-documento="abrirEnvioIndividual"
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
