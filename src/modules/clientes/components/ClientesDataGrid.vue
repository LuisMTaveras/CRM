<script setup lang="ts">
import { ref } from 'vue';
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Building2, 
  Plus, 
  Eye, 
  RotateCcw, 
  Sparkles,
  Mail,
  CheckCircle2,
  Download,
  Loader2
} from 'lucide-vue-next';
import { computed } from 'vue';
import { FlickerlessSurface } from '@flickerless/vue';
import Can from '@/shared/components/Can.vue';
import { obtenerIniciales, obtenerEstiloAvatar } from '@/core/lib/utils';
import { formatCurrency, formatDate, formatPhoneNumber } from '@/core/formatters/formatters';
import type { Cliente, EstadoCliente } from '../types/cliente.types';
import type { ParametrosTabla } from '@/core/url-sync/url-state';
import { exportarACSV } from '@/core/export/csv-export';
import { clienteService } from '../services/cliente.service';
import { toastService } from '@/core/notifications/toast.service';

const props = defineProps<{
  clientes: Cliente[];
  cargando: boolean;
  total: number;
  totalPaginas: number;
  parametros: ParametrosTabla;
}>();

const emit = defineEmits<{
  (e: 'actualizarParametros', params: Partial<ParametrosTabla>): void;
  (e: 'seleccionar', cliente: Cliente): void;
  (e: 'nuevoCliente'): void;
  (e: 'enviarMasivo', clientes: Cliente[]): void;
}>();

const seleccionadosIds = ref<Set<string>>(new Set());

const alternarSeleccion = (id: string) => {
  if (seleccionadosIds.value.has(id)) {
    seleccionadosIds.value.delete(id);
  } else {
    seleccionadosIds.value.add(id);
  }
};

const alternarSeleccionarTodos = () => {
  if (seleccionadosIds.value.size === props.clientes.length && props.clientes.length > 0) {
    seleccionadosIds.value.clear();
  } else {
    seleccionadosIds.value = new Set(props.clientes.map((c) => c.id));
  }
};

const deseleccionarTodos = () => {
  seleccionadosIds.value.clear();
};

const clientesSeleccionadosObjetos = computed(() => {
  return props.clientes.filter((c) => seleccionadosIds.value.has(c.id));
});

const todosSeleccionados = computed(() => {
  return props.clientes.length > 0 && seleccionadosIds.value.size === props.clientes.length;
});

const textoBusquedaLocal = ref(props.parametros.busqueda || '');
let temporizadorDebounce: ReturnType<typeof setTimeout> | null = null;

const manejarBusqueda = (evento: Event) => {
  const valor = (evento.target as HTMLInputElement).value;
  textoBusquedaLocal.value = valor;
  if (temporizadorDebounce) clearTimeout(temporizadorDebounce);
  temporizadorDebounce = setTimeout(() => {
    emit('actualizarParametros', { busqueda: valor, pagina: 1 });
  }, 300);
};

const alternarOrden = (campo: string) => {
  if (props.parametros.ordenCampo === campo) {
    const nuevaDireccion = props.parametros.ordenDireccion === 'asc' ? 'desc' : 'asc';
    emit('actualizarParametros', { ordenDireccion: nuevaDireccion });
  } else {
    emit('actualizarParametros', { ordenCampo: campo, ordenDireccion: 'desc' });
  }
};

const cambiarFiltroEstado = (evento: Event) => {
  const valor = (evento.target as HTMLSelectElement).value;
  emit('actualizarParametros', { estado: valor, pagina: 1 });
};

const cambiarFiltroSector = (evento: Event) => {
  const valor = (evento.target as HTMLSelectElement).value;
  emit('actualizarParametros', { sector: valor, pagina: 1 });
};

const cambiarTamanoPagina = (evento: Event) => {
  const nuevoTamano = parseInt((evento.target as HTMLSelectElement).value, 10);
  emit('actualizarParametros', { tamanoPagina: nuevoTamano, pagina: 1 });
};

const irAPagina = (pagina: number) => {
  if (pagina < 1 || pagina > props.totalPaginas) return;
  emit('actualizarParametros', { pagina });
};

const paginasVisibles = computed(() => {
  const total = props.totalPaginas;
  const actual = props.parametros.pagina;
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const paginas = new Set<number>([1, total]);
  for (let i = Math.max(1, actual - 2); i <= Math.min(total, actual + 2); i++) {
    paginas.add(i);
  }
  return Array.from(paginas).sort((a, b) => a - b);
});

const limpiarFiltros = () => {
  textoBusquedaLocal.value = '';
  emit('actualizarParametros', {
    busqueda: '',
    estado: '',
    sector: '',
    pagina: 1,
  });
};

const clasesBadgeEstado = (estado: EstadoCliente) => {
  switch (estado) {
    case 'activo':
      return {
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        dot: 'bg-emerald-400',
      };
    case 'en_negociacion':
      return {
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        dot: 'bg-amber-400',
      };
    case 'prospecto':
      return {
        badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        dot: 'bg-sky-400',
      };
    case 'inactivo':
      return {
        badge: 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60',
        dot: 'bg-zinc-500',
      };
    case 'cerrado_perdido':
      return {
        badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        dot: 'bg-rose-400',
      };
    default:
      return {
        badge: 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60',
        dot: 'bg-zinc-400',
      };
  }
};

const etiquetaEstado = (estado: EstadoCliente) => {
  switch (estado) {
    case 'activo':
      return 'Activo';
    case 'en_negociacion':
      return 'En Negociación';
    case 'prospecto':
      return 'Prospecto';
    case 'inactivo':
      return 'Inactivo';
    case 'cerrado_perdido':
      return 'Perdido';
    default:
      return estado;
  }
};

const clasesBadgePrioridad = (prioridad: string) => {
  switch (prioridad) {
    case 'alta':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    case 'media':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'baja':
      return 'bg-zinc-800/80 text-zinc-400 border-zinc-700/50';
    default:
      return 'bg-zinc-800/80 text-zinc-400 border-zinc-700/50';
  }
};

const exportando = ref(false);

const exportarClientes = async () => {
  exportando.value = true;
  try {
    let listaParaExportar: Cliente[] = [];
    if (seleccionadosIds.value.size > 0) {
      listaParaExportar = props.clientes.filter((c) => seleccionadosIds.value.has(c.id));
    } else {
      listaParaExportar = await clienteService.obtenerTodosParaExportar(props.parametros);
    }

    exportarACSV<Cliente>(
      listaParaExportar,
      [
        { clave: 'codigo', titulo: 'Código' },
        { clave: 'razon_social', titulo: 'Razón Social' },
        { clave: 'nombre_comercial', titulo: 'Nombre Comercial', formateador: (_v, c) => c.nombre_comercial || '—' },
        { clave: 'identificacion_fiscal', titulo: 'RNC / Identificación', formateador: (_v, c) => c.identificacion_fiscal || '—' },
        { clave: 'sector', titulo: 'Sector Económico' },
        { clave: 'estado', titulo: 'Estado', formateador: (_v, c) => etiquetaEstado(c.estado) },
        { clave: 'prioridad', titulo: 'Prioridad', formateador: (_v, c) => (c.prioridad ? c.prioridad.toUpperCase() : '—') },
        { clave: 'email', titulo: 'Correo Corporativo', formateador: (_v, c) => c.email || '—' },
        { clave: 'telefono', titulo: 'Teléfono', formateador: (_v, c) => formatPhoneNumber(c.telefono) },
        { clave: 'ciudad', titulo: 'Ciudad', formateador: (_v, c) => c.ciudad || '—' },
        { clave: 'responsable', titulo: 'Responsable Comercial' },
        { clave: 'valor_estimado', titulo: 'Valor Estimado (RD$)', formateador: (_v, c) => String(c.valor_estimado ?? 0) },
        { clave: 'creado_en', titulo: 'Fecha de Registro', formateador: (_v, c) => formatDate(c.creado_en) },
      ],
      'cartera_clientes_crm'
    );
    toastService.exito(`Se exportaron ${listaParaExportar.length} clientes a formato CSV exitosamente.`);
  } catch (err) {
    console.error('Error exportando clientes a CSV:', err);
    toastService.error('Ocurrió un error al exportar clientes.');
  } finally {
    exportando.value = false;
  }
};
</script>

<template>
  <div class="saas-card rounded-xl overflow-hidden flex flex-col shadow-sm border border-zinc-200 dark:border-white/[0.08]">
    <!-- Barra de Filtros y Búsqueda Superior -->
    <div class="p-3.5 border-b border-zinc-200 dark:border-white/[0.07] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-50/80 dark:bg-zinc-900/40">
      <div class="flex items-center gap-2.5 flex-1 max-w-2xl">
        <!-- Campo de Búsqueda -->
        <div class="relative flex-1">
          <Search class="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            :value="textoBusquedaLocal"
            @input="manejarBusqueda"
            placeholder="Buscar por razón social, RNC, código, contacto o ciudad..."
            class="w-full pl-9 pr-9 py-1.5 text-xs bg-white dark:bg-zinc-950/80 border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all shadow-inner"
          />
          <div class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <kbd class="px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50 rounded shadow-xs">/</kbd>
          </div>
        </div>

        <!-- Filtro Estado con Chevron personalizado -->
        <div class="relative">
          <select
            :value="parametros.estado || ''"
            @change="cambiarFiltroEstado"
            class="appearance-none bg-white dark:bg-zinc-950/80 border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-300 text-xs rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition cursor-pointer"
          >
            <option value="">Todos los Estados</option>
            <option value="prospecto">Prospecto</option>
            <option value="en_negociacion">En Negociación</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="cerrado_perdido">Cerrado Perdido</option>
          </select>
          <ChevronDown class="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <!-- Filtro Sector con Chevron personalizado -->
        <div class="relative hidden md:block">
          <select
            :value="parametros.sector || ''"
            @change="cambiarFiltroSector"
            class="appearance-none bg-white dark:bg-zinc-950/80 border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-300 text-xs rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition cursor-pointer"
          >
            <option value="">Todos los Sectores</option>
            <option value="Tecnología">Tecnología</option>
            <option value="Finanzas">Finanzas</option>
            <option value="Logística">Logística</option>
            <option value="Turismo">Turismo & Hotelería</option>
            <option value="Salud">Salud</option>
            <option value="Retail">Retail</option>
            <option value="Manufactura">Manufactura</option>
            <option value="Alimentos">Alimentos</option>
            <option value="Comercio">Comercio Mayorista</option>
          </select>
          <ChevronDown class="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <!-- Limpiar Filtros -->
        <button
          v-if="parametros.busqueda || parametros.estado || parametros.sector"
          @click="limpiarFiltros"
          title="Restablecer filtros"
          class="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 bg-white dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg border border-zinc-200 dark:border-white/[0.08] transition"
        >
          <RotateCcw class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Acciones Principales -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="exportarClientes"
          :disabled="exportando || cargando"
          title="Exportar clientes filtrados a archivo CSV / Excel"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900/90 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-xs rounded-lg transition border border-zinc-200 dark:border-white/[0.08] shadow-sm disabled:opacity-50"
        >
          <Loader2 v-if="exportando" class="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
          <Download v-else class="w-3.5 h-3.5 text-zinc-400" />
          <span class="hidden sm:inline">Exportar CSV</span>
        </button>

        <Can I="create" an="Cliente">
          <button
            @click="emit('nuevoCliente')"
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition shadow-sm shadow-indigo-950/50 border border-indigo-500/30 active:scale-[0.98]"
          >
            <Plus class="w-3.5 h-3.5 stroke-[2.5]" />
            Nuevo Cliente
          </button>
        </Can>
      </div>
    </div>

    <!-- Banner de Acciones Masivas (Aparece cuando hay clientes seleccionados) -->
    <div
      v-if="seleccionadosIds.size > 0"
      class="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 backdrop-blur border-b border-indigo-200 dark:border-indigo-500/20 flex items-center justify-between text-xs animate-in fade-in"
    >
      <div class="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-medium">
        <CheckCircle2 class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <span>{{ seleccionadosIds.size }} {{ seleccionadosIds.size === 1 ? 'cliente seleccionado' : 'clientes seleccionados' }}</span>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="deseleccionarTodos"
          class="px-2.5 py-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs transition"
        >
          Deseleccionar
        </button>

        <button
          type="button"
          @click="exportarClientes"
          class="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium text-xs rounded-lg transition border border-zinc-200 dark:border-zinc-700 shadow-sm"
        >
          <Download class="w-3.5 h-3.5 text-zinc-400" />
          <span>Exportar ({{ seleccionadosIds.size }})</span>
        </button>

        <button
          type="button"
          @click="emit('enviarMasivo', clientesSeleccionadosObjetos)"
          class="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition shadow-sm active:scale-[0.98]"
        >
          <Mail class="w-3.5 h-3.5" />
          <span>Enviar Correo & Documento PDF ({{ seleccionadosIds.size }})</span>
        </button>
      </div>
    </div>

    <!-- Tabla Data-Grid de Alta Densidad -->
    <div class="overflow-x-auto min-h-[360px]">
      <FlickerlessSurface 
        :loading="cargando" 
        :delay-ms="180" 
        :preserve-height="true"
        stream-color="#4f46e5"
        announce-text="Actualizando directorio de clientes..."
      >
        <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="border-b border-zinc-200 dark:border-white/[0.07] bg-zinc-100/90 dark:bg-[#0c0c0e]/90 text-zinc-600 dark:text-zinc-400 text-[11px] font-medium tracking-wider uppercase select-none sticky top-0 z-10 backdrop-blur-md">
            <!-- Checkbox Seleccionar Todos -->
            <th class="py-3 px-3 w-10 text-center">
              <input
                type="checkbox"
                :checked="todosSeleccionados"
                @change="alternarSeleccionarTodos"
                class="rounded bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-0 cursor-pointer"
              />
            </th>
            <th class="py-3 px-3.5 w-24">Código</th>
            <th class="py-3 px-3.5 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors" @click="alternarOrden('razon_social')">
              <div class="flex items-center gap-1.5">
                <span>Razón Social / Empresa</span>
                <ArrowUp v-if="parametros.ordenCampo === 'razon_social' && parametros.ordenDireccion === 'asc'" class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <ArrowDown v-else-if="parametros.ordenCampo === 'razon_social' && parametros.ordenDireccion === 'desc'" class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <ArrowUpDown v-else class="w-3 h-3 text-zinc-400 dark:text-zinc-600" />
              </div>
            </th>
            <th class="py-3 px-3.5">Sector</th>
            <th class="py-3 px-3.5">Estado</th>
            <th class="py-3 px-3.5">Prioridad</th>
            <th class="py-3 px-3.5 text-right cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors" @click="alternarOrden('valor_estimado')">
              <div class="flex items-center justify-end gap-1.5">
                <span>Valor Estimado</span>
                <ArrowUp v-if="parametros.ordenCampo === 'valor_estimado' && parametros.ordenDireccion === 'asc'" class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <ArrowDown v-else-if="parametros.ordenCampo === 'valor_estimado' && parametros.ordenDireccion === 'desc'" class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <ArrowUpDown v-else class="w-3 h-3 text-zinc-400 dark:text-zinc-600" />
              </div>
            </th>
            <th class="py-3 px-3.5">Responsable</th>
            <th class="py-3 px-3.5 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors" @click="alternarOrden('creado_en')">
              <div class="flex items-center gap-1.5">
                <span>Último Contacto</span>
                <ArrowUp v-if="parametros.ordenCampo === 'creado_en' && parametros.ordenDireccion === 'asc'" class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <ArrowDown v-else-if="parametros.ordenCampo === 'creado_en' && parametros.ordenDireccion === 'desc'" class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <ArrowUpDown v-else class="w-3 h-3 text-zinc-400 dark:text-zinc-600" />
              </div>
            </th>
            <th class="py-3 px-3.5 text-right w-16">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-200 dark:divide-white/[0.04]">
          <!-- 1. Estado vacío (cuando no hay resultados y terminó la carga) -->
          <template v-if="clientes.length === 0 && !cargando">
            <tr>
              <td colspan="10" class="py-16 text-center">
                <div class="flex flex-col items-center justify-center max-w-sm mx-auto">
                  <div class="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 flex items-center justify-center text-zinc-400 mb-3 border border-zinc-200 dark:border-white/[0.08]">
                    <Building2 class="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h4 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                    {{ (parametros.busqueda || parametros.estado || parametros.sector) ? 'No se encontraron clientes' : 'Directorio de clientes vacío' }}
                  </h4>
                  <p class="text-xs text-zinc-500 dark:text-zinc-400 mb-4 text-center leading-relaxed">
                    {{ (parametros.busqueda || parametros.estado || parametros.sector) 
                      ? 'No existen registros que coincidan con los criterios de búsqueda o filtros seleccionados.' 
                      : 'La base de datos de clientes se encuentra limpia. Registra tu primera empresa o prospecto B2B para comenzar.' }}
                  </p>
                  <div class="flex items-center gap-2">
                    <button
                      v-if="parametros.busqueda || parametros.estado || parametros.sector"
                      @click="limpiarFiltros"
                      class="px-3.5 py-1.5 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-medium rounded-lg border border-zinc-200 dark:border-white/[0.08] transition"
                    >
                      Restablecer Filtros
                    </button>
                    <button
                      @click="emit('nuevoCliente')"
                      class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition shadow-sm"
                    >
                      + Registrar Nuevo Cliente
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </template>

          <!-- 2. Filas reales de clientes -->
          <template v-else>
            <tr
              v-for="cliente in clientes"
              :key="cliente.id"
              @click="emit('seleccionar', cliente)"
              :class="[
                'group hover:bg-zinc-50 dark:hover:bg-zinc-800/35 cursor-pointer transition-colors duration-150',
                seleccionadosIds.has(cliente.id) ? 'bg-indigo-50/60 dark:bg-indigo-950/20' : ''
              ]"
            >
              <!-- Checkbox Fila -->
              <td class="py-2.5 px-3 text-center" @click.stop>
                <input
                  type="checkbox"
                  :checked="seleccionadosIds.has(cliente.id)"
                  @change="alternarSeleccion(cliente.id)"
                  class="rounded bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </td>

              <!-- Código -->
              <td class="py-2.5 px-3.5">
                <span class="inline-block px-1.5 py-0.5 rounded font-mono text-[11px] bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200 dark:border-white/[0.06] text-zinc-700 dark:text-zinc-300 font-medium tabular-nums">
                  {{ cliente.codigo }}
                </span>
              </td>

              <!-- Razón Social & Nombre Comercial con Avatar Monograma -->
              <td class="py-2.5 px-3.5">
                <div class="flex items-center gap-2.5">
                  <div
                    :class="[
                      'w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold border shrink-0 uppercase tracking-tighter select-none',
                      obtenerEstiloAvatar(cliente.razon_social).bg,
                      obtenerEstiloAvatar(cliente.razon_social).text,
                      obtenerEstiloAvatar(cliente.razon_social).border
                    ]"
                  >
                    {{ obtenerIniciales(cliente.razon_social) }}
                  </div>
                  <div>
                    <div class="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                      <span>{{ cliente.razon_social }}</span>
                      <span v-if="cliente.prioridad === 'alta'" title="Cuenta Estratégica" class="text-amber-500 dark:text-amber-400">
                        <Sparkles class="w-3 h-3 inline" />
                      </span>
                    </div>
                    <div class="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
                      <span v-if="cliente.identificacion_fiscal" class="font-mono">{{ cliente.identificacion_fiscal }}</span>
                      <span v-if="cliente.ciudad" class="text-zinc-400 dark:text-zinc-500">• {{ cliente.ciudad }}</span>
                    </div>
                  </div>
                </div>
              </td>

              <!-- Sector -->
              <td class="py-2.5 px-3.5 text-zinc-700 dark:text-zinc-300">
                {{ cliente.sector }}
              </td>

              <!-- Estado -->
              <td class="py-2.5 px-3.5">
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border',
                    clasesBadgeEstado(cliente.estado).badge
                  ]"
                >
                  <span :class="['w-1.5 h-1.5 rounded-full', clasesBadgeEstado(cliente.estado).dot]"></span>
                  {{ etiquetaEstado(cliente.estado) }}
                </span>
              </td>

              <!-- Prioridad -->
              <td class="py-2.5 px-3.5">
                <span
                  :class="[
                    'inline-block px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border',
                    clasesBadgePrioridad(cliente.prioridad)
                  ]"
                >
                  {{ cliente.prioridad }}
                </span>
              </td>

              <!-- Valor Estimado -->
              <td class="py-2.5 px-3.5 text-right font-mono font-medium text-xs text-zinc-900 dark:text-zinc-100 tabular-nums">
                {{ formatCurrency(cliente.valor_estimado) }}
              </td>

              <!-- Responsable -->
              <td class="py-2.5 px-3.5 text-zinc-700 dark:text-zinc-300">
                {{ cliente.responsable }}
              </td>

              <!-- Último Contacto -->
              <td class="py-2.5 px-3.5 font-mono text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
                {{ formatDate(cliente.ultimo_contacto || cliente.creado_en) }}
              </td>

              <!-- Acciones -->
              <td class="py-2.5 px-3.5 text-right" @click.stop>
                <button
                  @click="emit('seleccionar', cliente)"
                  title="Ver detalle de cliente"
                  class="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition"
                >
                  <Eye class="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          </template>
        </tbody>
        </table>
      </FlickerlessSurface>
    </div>

    <!-- Barra de Paginación Inferior Sincronizada -->
    <div class="p-3.5 border-t border-zinc-200 dark:border-white/[0.07] bg-zinc-50/95 dark:bg-[#0c0c0e]/95 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
      <div class="flex items-center gap-3">
        <span>
          Mostrando <strong class="text-zinc-800 dark:text-zinc-200 font-mono">{{ total === 0 ? 0 : (parametros.pagina - 1) * parametros.tamanoPagina + 1 }}</strong> a
          <strong class="text-zinc-800 dark:text-zinc-200 font-mono">{{ Math.min(parametros.pagina * parametros.tamanoPagina, total) }}</strong> de
          <strong class="text-zinc-800 dark:text-zinc-200 font-mono">{{ total }}</strong> registros
        </span>

        <div class="flex items-center gap-1.5">
          <span class="text-zinc-400 dark:text-zinc-500">Filas:</span>
          <select
            :value="parametros.tamanoPagina"
            @change="cambiarTamanoPagina"
            class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-300 rounded-md px-2 py-0.5 text-xs focus:outline-none cursor-pointer"
          >
            <option :value="10">10</option>
            <option :value="15">15</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
        </div>
      </div>

      <!-- Controles de Navegación de Página -->
      <div class="flex items-center gap-1">
        <button
          @click="irAPagina(parametros.pagina - 1)"
          :disabled="parametros.pagina <= 1 || cargando"
          class="p-1.5 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title="Página anterior"
        >
          <ChevronLeft class="w-3.5 h-3.5" />
        </button>

        <!-- Botones directos de número de página -->
        <div class="hidden sm:flex items-center gap-1 mx-1">
          <button
            v-for="p in paginasVisibles"
            :key="p"
            @click="irAPagina(p)"
            :disabled="cargando"
            :class="[
              'min-w-[28px] h-7 px-2 text-xs font-mono rounded-md border transition flex items-center justify-center font-medium',
              parametros.pagina === p
                ? 'bg-indigo-600 border-indigo-500 text-white font-semibold shadow-sm shadow-indigo-950/40'
                : 'bg-white dark:bg-zinc-900/80 border-zinc-200 dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            ]"
          >
            {{ p }}
          </button>
        </div>

        <span class="sm:hidden px-2 font-mono text-zinc-700 dark:text-zinc-300">
          Página {{ parametros.pagina }} de {{ totalPaginas }}
        </span>

        <button
          @click="irAPagina(parametros.pagina + 1)"
          :disabled="parametros.pagina >= totalPaginas || cargando"
          class="p-1.5 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title="Página siguiente"
        >
          <ChevronRight class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>
