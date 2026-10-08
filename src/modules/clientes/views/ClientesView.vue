<script setup lang="ts">
import { ref } from 'vue';
import { useClientes } from '../composables/useClientes';
import DashboardKpis from '@/modules/dashboard/components/DashboardKpis.vue';
import ClientesDataGrid from '../components/ClientesDataGrid.vue';
import ClienteDrawer from '../components/ClienteDrawer.vue';
import NuevoClienteModal from '../components/NuevoClienteModal.vue';
import EnvioMasivoModal from '@/modules/comunicaciones/components/EnvioMasivoModal.vue';
import { RefreshCw, AlertCircle, RotateCcw, Building2, Plus } from 'lucide-vue-next';
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
    <!-- Teleport del Encabezado hacia la Barra Superior Principal (HeaderBar) -->
    <Teleport to="#header-portal-left">
      <div class="flex items-center gap-3 min-w-0">
        <span class="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
          <Building2 class="w-5 h-5" />
        </span>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <h1 class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
              Directorio Comercial & Clientes B2B
            </h1>
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              PostgreSQL Conectado
            </span>
          </div>
          <p class="text-[11px] text-zinc-500 dark:text-zinc-400 truncate hidden md:block">
            Gestión centralizada de prospectos, cuentas estratégicas, contratos y trazabilidad de cartera
          </p>
        </div>
      </div>
    </Teleport>

    <!-- Teleport de Acciones a la Barra Superior -->
    <Teleport to="#header-portal-right">
      <div class="flex items-center gap-2">
        <button
          @click="modalNuevoClienteAbierto = true"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition active:scale-95 shadow-indigo-950/40"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>+ Nuevo Cliente</span>
        </button>

        <button
          @click="restablecerDatosIniciales"
          :disabled="cargando"
          title="Recargar catálogo inicial de 100+ clientes y contactos semilla"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition shadow-sm hover:border-zinc-300 dark:hover:border-white/[0.16] disabled:opacity-50"
        >
          <RotateCcw class="w-3.5 h-3.5 text-zinc-400" />
          <span class="hidden sm:inline">Restablecer 100+</span>
        </button>

        <button
          @click="consultarClientes"
          :disabled="cargando"
          title="Actualizar datos"
          class="p-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-medium transition shadow-sm hover:border-zinc-300 dark:hover:border-white/[0.16] disabled:opacity-50"
        >
          <RefreshCw :class="['w-3.5 h-3.5 text-zinc-400', cargando ? 'animate-spin text-indigo-600 dark:text-indigo-400' : '']" />
        </button>
      </div>
    </Teleport>

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
