<script setup lang="ts">
import { ref } from 'vue';
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ChevronLeft, 
  ChevronRight, 
  Building2, 
  Plus, 
  Eye, 
  RotateCcw, 
  Sparkles,
  Mail,
  CheckCircle2
} from 'lucide-vue-next';
import { computed } from 'vue';
import { FlickerlessSurface } from '@flickerless/vue';
import Can from '@/shared/components/Can.vue';
import { formatearMoneda, formatearFecha } from '@/core/lib/utils';
import type { Cliente, EstadoCliente } from '../types/cliente.types';
import type { ParametrosTabla } from '@/core/url-sync/url-state';

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
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'en_negociacion':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'prospecto':
      return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    case 'inactivo':
      return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    case 'cerrado_perdido':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    default:
      return 'bg-zinc-800 text-zinc-300 border-zinc-700';
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
      return 'text-rose-400 font-semibold';
    case 'media':
      return 'text-amber-400';
    case 'baja':
      return 'text-zinc-400';
    default:
      return 'text-zinc-400';
  }
};
</script>

<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-lg shadow-sm overflow-hidden flex flex-col">
    <!-- Barra de Filtros y Búsqueda Superior -->
    <div class="p-3.5 border-b border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/60">
      <div class="flex items-center gap-2.5 flex-1 max-w-xl">
        <!-- Campo de Búsqueda -->
        <div class="relative flex-1">
          <Search class="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            :value="textoBusquedaLocal"
            @input="manejarBusqueda"
            placeholder="Buscar por razón social, RNC, código, contacto o ciudad..."
            class="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition"
          />
        </div>

        <!-- Filtro Estado -->
        <select
          :value="parametros.estado || ''"
          @change="cambiarFiltroEstado"
          class="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-zinc-600 transition"
        >
          <option value="">Todos los Estados</option>
          <option value="prospecto">Prospecto</option>
          <option value="en_negociacion">En Negociación</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
          <option value="cerrado_perdido">Cerrado Perdido</option>
        </select>

        <!-- Filtro Sector -->
        <select
          :value="parametros.sector || ''"
          @change="cambiarFiltroSector"
          class="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-zinc-600 transition hidden md:block"
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

        <!-- Limpiar Filtros -->
        <button
          v-if="parametros.busqueda || parametros.estado || parametros.sector"
          @click="limpiarFiltros"
          title="Restablecer filtros"
          class="p-1.5 text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700/80 rounded border border-zinc-700 transition"
        >
          <RotateCcw class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Acciones Principales -->
      <div class="flex items-center gap-2">
        <Can I="create" an="Cliente">
          <button
            @click="emit('nuevoCliente')"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-medium text-xs rounded-md transition shadow-sm active:scale-[0.98]"
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
      class="px-4 py-2 bg-emerald-950/80 border-b border-emerald-500/30 flex items-center justify-between text-xs animate-in fade-in"
    >
      <div class="flex items-center gap-2 text-emerald-300 font-medium">
        <CheckCircle2 class="w-4 h-4 text-emerald-400" />
        <span>{{ seleccionadosIds.size }} {{ seleccionadosIds.size === 1 ? 'cliente seleccionado' : 'clientes seleccionados' }}</span>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="deseleccionarTodos"
          class="px-2.5 py-1 text-zinc-400 hover:text-zinc-200 text-xs transition"
        >
          Deseleccionar
        </button>

        <button
          type="button"
          @click="emit('enviarMasivo', clientesSeleccionadosObjetos)"
          class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs rounded transition shadow-sm active:scale-[0.98]"
        >
          <Mail class="w-3.5 h-3.5" />
          <span>Enviar Correo & Documento PDF ({{ seleccionadosIds.size }})</span>
        </button>
      </div>
    </div>

    <!-- Tabla Data-Grid de Alta Densidad (38px row height) -->
    <div class="overflow-x-auto min-h-[360px]">
      <FlickerlessSurface 
        :loading="cargando" 
        :delay-ms="180" 
        :preserve-height="true"
        stream-color="#10b981"
        announce-text="Actualizando directorio de clientes..."
      >
        <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="border-b border-zinc-800 bg-zinc-950/70 text-zinc-400 font-medium select-none">
            <!-- Checkbox Seleccionar Todos -->
            <th class="py-2.5 px-3 w-10 text-center">
              <input
                type="checkbox"
                :checked="todosSeleccionados"
                @change="alternarSeleccionarTodos"
                class="rounded bg-zinc-950 border-zinc-700 text-emerald-500 focus:ring-0 cursor-pointer"
              />
            </th>
            <th class="py-2.5 px-3.5 w-24">Código</th>
            <th class="py-2.5 px-3.5 cursor-pointer hover:text-zinc-200" @click="alternarOrden('razon_social')">
              <div class="flex items-center gap-1">
                <span>Razón Social / Empresa</span>
                <ArrowUp v-if="parametros.ordenCampo === 'razon_social' && parametros.ordenDireccion === 'asc'" class="w-3.5 h-3.5 text-emerald-400" />
                <ArrowDown v-else-if="parametros.ordenCampo === 'razon_social' && parametros.ordenDireccion === 'desc'" class="w-3.5 h-3.5 text-emerald-400" />
                <ArrowUpDown v-else class="w-3 h-3 text-zinc-600" />
              </div>
            </th>
            <th class="py-2.5 px-3.5">Sector</th>
            <th class="py-2.5 px-3.5">Estado</th>
            <th class="py-2.5 px-3.5">Prioridad</th>
            <th class="py-2.5 px-3.5 text-right cursor-pointer hover:text-zinc-200" @click="alternarOrden('valor_estimado')">
              <div class="flex items-center justify-end gap-1">
                <span>Valor Estimado</span>
                <ArrowUp v-if="parametros.ordenCampo === 'valor_estimado' && parametros.ordenDireccion === 'asc'" class="w-3.5 h-3.5 text-emerald-400" />
                <ArrowDown v-else-if="parametros.ordenCampo === 'valor_estimado' && parametros.ordenDireccion === 'desc'" class="w-3.5 h-3.5 text-emerald-400" />
                <ArrowUpDown v-else class="w-3 h-3 text-zinc-600" />
              </div>
            </th>
            <th class="py-2.5 px-3.5">Responsable</th>
            <th class="py-2.5 px-3.5 cursor-pointer hover:text-zinc-200" @click="alternarOrden('creado_en')">
              <div class="flex items-center gap-1">
                <span>Último Contacto</span>
                <ArrowUp v-if="parametros.ordenCampo === 'creado_en' && parametros.ordenDireccion === 'asc'" class="w-3.5 h-3.5 text-emerald-400" />
                <ArrowDown v-else-if="parametros.ordenCampo === 'creado_en' && parametros.ordenDireccion === 'desc'" class="w-3.5 h-3.5 text-emerald-400" />
                <ArrowUpDown v-else class="w-3 h-3 text-zinc-600" />
              </div>
            </th>
            <th class="py-2.5 px-3.5 text-right w-16">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-800/60">
          <!-- 1. Estado vacío (cuando no hay resultados y terminó la carga) -->
          <template v-if="clientes.length === 0 && !cargando">
            <tr>
              <td colspan="10" class="py-12 text-center">
                <div class="flex flex-col items-center justify-center max-w-sm mx-auto">
                  <div class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3 border border-zinc-700">
                    <Building2 class="w-5 h-5 text-emerald-400" />
                  </div>
                  <h4 class="text-sm font-semibold text-zinc-200 mb-1">
                    {{ (parametros.busqueda || parametros.estado || parametros.sector) ? 'No se encontraron clientes' : 'Directorio de clientes vacío' }}
                  </h4>
                  <p class="text-xs text-zinc-400 mb-4 text-center leading-relaxed">
                    {{ (parametros.busqueda || parametros.estado || parametros.sector) 
                      ? 'No existen registros que coincidan con los criterios de búsqueda o filtros seleccionados.' 
                      : 'La base de datos de clientes se encuentra limpia. Registra tu primera empresa o prospecto B2B para comenzar.' }}
                  </p>
                  <div class="flex items-center gap-2">
                    <button
                      v-if="parametros.busqueda || parametros.estado || parametros.sector"
                      @click="limpiarFiltros"
                      class="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-md border border-zinc-700 transition"
                    >
                      Restablecer Filtros
                    </button>
                    <button
                      @click="emit('nuevoCliente')"
                      class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-md transition shadow-sm"
                    >
                      + Registrar Nuevo Cliente
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </template>

          <!-- 2. Filas reales de clientes (se mantienen visibles a 50% de opacidad durante recargas/filtros con Flickerless) -->
          <template v-else>
            <tr
              v-for="cliente in clientes"
              :key="cliente.id"
              @click="emit('seleccionar', cliente)"
              :class="[
                'group hover:bg-zinc-800/40 cursor-pointer transition-colors duration-100',
                seleccionadosIds.has(cliente.id) ? 'bg-emerald-950/20' : ''
              ]"
            >
              <!-- Checkbox Fila -->
              <td class="py-2 px-3 text-center" @click.stop>
                <input
                  type="checkbox"
                  :checked="seleccionadosIds.has(cliente.id)"
                  @change="alternarSeleccion(cliente.id)"
                  class="rounded bg-zinc-950 border-zinc-700 text-emerald-500 focus:ring-0 cursor-pointer"
                />
              </td>

              <!-- Código -->
              <td class="py-2 px-3.5 font-mono text-[11px] text-zinc-400 tabular-nums">
                {{ cliente.codigo }}
              </td>

              <!-- Razón Social & Nombre Comercial -->
              <td class="py-2 px-3.5">
                <div class="font-medium text-zinc-200 group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <span>{{ cliente.razon_social }}</span>
                  <span v-if="cliente.prioridad === 'alta'" title="Cuenta Estratégica" class="text-amber-400">
                    <Sparkles class="w-3 h-3 inline" />
                  </span>
                </div>
                <div class="text-[11px] text-zinc-500 flex items-center gap-2">
                  <span v-if="cliente.identificacion_fiscal">{{ cliente.identificacion_fiscal }}</span>
                  <span v-if="cliente.ciudad">• {{ cliente.ciudad }}</span>
                </div>
              </td>

              <!-- Sector -->
              <td class="py-2 px-3.5 text-zinc-300">
                {{ cliente.sector }}
              </td>

              <!-- Estado -->
              <td class="py-2 px-3.5">
                <span
                  :class="['inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border', clasesBadgeEstado(cliente.estado)]"
                >
                  {{ etiquetaEstado(cliente.estado) }}
                </span>
              </td>

              <!-- Prioridad -->
              <td class="py-2 px-3.5 uppercase text-[10px] tracking-wide">
                <span :class="clasesBadgePrioridad(cliente.prioridad)">
                  {{ cliente.prioridad }}
                </span>
              </td>

              <!-- Valor Estimado -->
              <td class="py-2 px-3.5 text-right font-mono font-medium text-zinc-100 tabular-nums">
                {{ formatearMoneda(cliente.valor_estimado) }}
              </td>

              <!-- Responsable -->
              <td class="py-2 px-3.5 text-zinc-300">
                {{ cliente.responsable }}
              </td>

              <!-- Último Contacto -->
              <td class="py-2 px-3.5 font-mono text-[11px] text-zinc-400 tabular-nums">
                {{ formatearFecha(cliente.ultimo_contacto || cliente.creado_en) }}
              </td>

              <!-- Acciones -->
              <td class="py-2 px-3.5 text-right" @click.stop>
                <button
                  @click="emit('seleccionar', cliente)"
                  title="Ver detalle de cliente"
                  class="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
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
    <div class="p-3 border-t border-zinc-800 bg-zinc-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
      <div class="flex items-center gap-3">
        <span>
          Mostrando <strong class="text-zinc-200 font-mono">{{ total === 0 ? 0 : (parametros.pagina - 1) * parametros.tamanoPagina + 1 }}</strong> a
          <strong class="text-zinc-200 font-mono">{{ Math.min(parametros.pagina * parametros.tamanoPagina, total) }}</strong> de
          <strong class="text-zinc-200 font-mono">{{ total }}</strong> registros
        </span>

        <div class="flex items-center gap-1.5">
          <span class="text-zinc-500">Filas:</span>
          <select
            :value="parametros.tamanoPagina"
            @change="cambiarTamanoPagina"
            class="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-1.5 py-0.5 text-xs focus:outline-none"
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
          class="p-1.5 rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
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
              'min-w-[28px] h-7 px-1.5 text-xs font-mono rounded border transition flex items-center justify-center font-medium',
              parametros.pagina === p
                ? 'bg-emerald-600 border-emerald-500 text-zinc-950 font-bold shadow-sm'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            ]"
          >
            {{ p }}
          </button>
        </div>

        <span class="sm:hidden px-2 font-mono text-zinc-300">
          Página {{ parametros.pagina }} de {{ totalPaginas }}
        </span>

        <button
          @click="irAPagina(parametros.pagina + 1)"
          :disabled="parametros.pagina >= totalPaginas || cargando"
          class="p-1.5 rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title="Página siguiente"
        >
          <ChevronRight class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>
