<template>
  <div class="space-y-4">
    <!-- Encabezado -->
    <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex items-start gap-2.5">
          <Zap class="w-4 h-4 mt-0.5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h2 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Automatizaciones comerciales
            </h2>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
              Define reglas que reaccionan a eventos del pipeline y de la cartera: crean tareas de
              seguimiento o registran notas en la agenda del responsable.
            </p>
          </div>
        </div>
        <button
          v-if="puedeEditar"
          type="button"
          class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
          :disabled="guardando"
          @click="abrirCrear"
        >
          <Plus class="w-3.5 h-3.5" />
          Nueva automatización
        </button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div class="lg:col-span-2">
        <label class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Buscar
        </label>
        <input
          v-model="busqueda"
          type="search"
          placeholder="Nombre o descripción de la regla"
          class="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          @input="programarBusqueda"
        />
      </div>
      <div>
        <label class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Evento
        </label>
        <SelectField
          :model-value="filtroEvento"
          :options="opcionesFiltroEvento"
          placeholder="Todos los eventos"
          compact
          @update:model-value="cambiarFiltroEvento"
        />
      </div>
      <div>
        <label class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Estado
        </label>
        <SelectField
          :model-value="filtroEstado"
          :options="opcionesFiltroEstado"
          placeholder="Todos los estados"
          compact
          @update:model-value="cambiarFiltroEstado"
        />
      </div>
    </div>

    <!-- Tabla -->
    <FlickerlessSurface
      :loading="cargando"
      :delay-ms="120"
      stream-color="#4f46e5"
      announce-text="Cargando automatizaciones..."
      class="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="border-b border-zinc-200 bg-zinc-50 text-[10px] uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th class="px-4 py-3 font-semibold">Automatización</th>
              <th class="px-4 py-3 font-semibold">Evento</th>
              <th class="px-4 py-3 font-semibold">Condiciones</th>
              <th class="px-4 py-3 font-semibold">Acción</th>
              <th class="px-4 py-3 font-semibold text-center">Estado</th>
              <th v-if="puedeEditar" class="px-4 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800">
            <tr
              v-for="regla in filas"
              :key="regla.id"
              class="transition hover:bg-zinc-50 dark:hover:bg-zinc-950/60"
            >
              <td class="px-4 py-3">
                <p class="font-semibold text-zinc-900 dark:text-zinc-100">{{ regla.nombre }}</p>
                <p class="mt-0.5 max-w-md text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {{ regla.descripcion || '—' }}
                </p>
              </td>
              <td class="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                {{ ETIQUETAS_EVENTO[regla.evento] }}
              </td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="(condicion, indice) in describirCondiciones(regla)"
                    :key="indice"
                    class="inline-flex rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {{ condicion }}
                  </span>
                  <span
                    v-if="describirCondiciones(regla).length === 0"
                    class="text-[11px] text-zinc-400 dark:text-zinc-500"
                  >
                    Todas
                  </span>
                </div>
              </td>
              <td class="px-4 py-3">
                <p class="font-medium text-zinc-700 dark:text-zinc-200">
                  {{ ETIQUETAS_ACCION[regla.accion.tipo] }}
                </p>
                <p class="mt-0.5 max-w-xs truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                  {{ regla.accion.titulo }}
                </p>
              </td>
              <td class="px-4 py-3 text-center">
                <span
                  class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
                  :class="regla.activa
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'"
                >
                  {{ regla.activa ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td v-if="puedeEditar" class="px-4 py-3">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    class="rounded-md border border-zinc-200 px-2 py-1 text-[10px] font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    :disabled="guardando"
                    @click="alternarEstado(regla)"
                  >
                    {{ regla.activa ? 'Desactivar' : 'Activar' }}
                  </button>
                  <button
                    type="button"
                    class="rounded-md border border-zinc-200 p-1.5 text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    aria-label="Editar automatización"
                    :disabled="guardando"
                    @click="abrirEditar(regla)"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    class="rounded-md border border-rose-500/20 p-1.5 text-rose-600 transition hover:bg-rose-500/10 dark:text-rose-400"
                    aria-label="Eliminar automatización"
                    :disabled="guardando"
                    @click="eliminarRegla(regla)"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="primeraRespuesta && filas.length === 0"
        class="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center"
      >
        <Zap class="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
        <p class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          No hay automatizaciones que coincidan con el filtro.
        </p>
        <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
          Crea una regla para que el CRM ejecute tareas y notas sin intervención manual.
        </p>
      </div>

      <ListPager
        v-model:page="pagina"
        :page-size="tamanoPagina"
        :total="total"
        :has-more="hasMore"
        singular="automatización"
        plural="automatizaciones"
      />
    </FlickerlessSurface>

    <!-- Modal de alta / edición -->
    <Teleport to="body">
      <div
        v-if="modalAbierto"
        class="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        @click.self="cerrarModal"
      >
        <form
          class="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-2xl"
          @submit.prevent="guardar"
        >
          <header class="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <div>
              <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {{ modoEdicion === 'crear' ? 'Nueva automatización' : 'Editar automatización' }}
              </h3>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
                La regla se ejecuta en el servidor al ocurrir el evento seleccionado.
              </p>
            </div>
            <button
              type="button"
              class="rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Cerrar"
              @click="cerrarModal"
            >
              <X class="w-4 h-4" />
            </button>
          </header>

          <div class="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div>
              <label class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Nombre de la regla *
              </label>
              <input
                v-model="form.nombre"
                required
                maxlength="200"
                placeholder="Ej. Seguimiento al enviar propuesta"
                class="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>

            <div>
              <label class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Descripción
              </label>
              <textarea
                v-model="form.descripcion"
                rows="2"
                maxlength="600"
                placeholder="Explica brevemente qué hace esta automatización."
                class="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Evento disparador *
                </label>
                <SelectField
                  :model-value="form.evento"
                  :options="opcionesEvento"
                  compact
                  @update:model-value="cambiarEventoFormulario"
                />
              </div>
              <div>
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Acción *
                </label>
                <SelectField
                  :model-value="form.tipo"
                  :options="opcionesAccion"
                  compact
                  @update:model-value="cambiarAccionFormulario"
                />
              </div>
            </div>

            <div v-if="form.evento === 'etapa_cambiada'" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Etapa destino
                </label>
                <SelectField
                  :model-value="form.etapa"
                  :options="opcionesEtapa"
                  placeholder="Cualquier etapa"
                  compact
                  @update:model-value="v => (form.etapa = String(v ?? '') as EtapaOportunidad | '')"
                />
              </div>
              <div>
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Etapa de origen
                </label>
                <SelectField
                  :model-value="form.etapaOrigen"
                  :options="opcionesEtapa"
                  placeholder="Cualquier etapa"
                  compact
                  @update:model-value="v => (form.etapaOrigen = String(v ?? '') as EtapaOportunidad | '')"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Sector del cliente
                </label>
                <SelectField
                  :model-value="form.sector"
                  :options="opcionesSector"
                  placeholder="Cualquier sector"
                  compact
                  @update:model-value="v => (form.sector = String(v ?? ''))"
                />
              </div>
              <div>
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Prioridad del cliente
                </label>
                <SelectField
                  :model-value="form.prioridad"
                  :options="opcionesPrioridad"
                  placeholder="Cualquier prioridad"
                  compact
                  @update:model-value="v => (form.prioridad = String(v ?? '') as PrioridadCliente | '')"
                />
              </div>
            </div>

            <div class="rounded-lg border border-zinc-200 bg-zinc-50 p-3.5 space-y-3 dark:border-zinc-800 dark:bg-zinc-950">
              <p class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Contenido de la acción
              </p>
              <div>
                <label class="mb-1 block text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                  Título *
                </label>
                <input
                  v-model="form.tituloAccion"
                  required
                  maxlength="240"
                  placeholder="Seguimiento de propuesta: {{oportunidad}}"
                  class="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label class="mb-1 block text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                  Detalle
                </label>
                <textarea
                  v-model="form.descripcionAccion"
                  rows="2"
                  maxlength="2000"
                  placeholder="Contactar a {{cliente}} para validar la propuesta."
                  class="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label class="mb-1 block text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                    Prioridad
                  </label>
                  <SelectField
                    :model-value="form.prioridadAccion"
                    :options="opcionesPrioridadAccion"
                    compact
                    @update:model-value="v => (form.prioridadAccion = String(v ?? 'media') as PrioridadCliente)"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                    Vence en (días)
                  </label>
                  <input
                    v-model.number="form.dias"
                    type="number"
                    min="0"
                    max="365"
                    class="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>
              <p class="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Variables disponibles: <code class="font-mono">&#123;&#123;cliente&#125;&#125;</code>,
                <code class="font-mono">&#123;&#123;oportunidad&#125;&#125;</code>,
                <code class="font-mono">&#123;&#123;etapa&#125;&#125;</code> y
                <code class="font-mono">&#123;&#123;sector&#125;&#125;</code>.
              </p>
            </div>

            <label class="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
              <input v-model="form.activa" type="checkbox" class="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
              Regla activa desde su creación
            </label>
          </div>

          <footer class="flex items-center justify-end gap-2 border-t border-zinc-200 px-5 py-3.5 dark:border-zinc-800">
            <button
              type="button"
              class="rounded-lg border border-zinc-200 px-3.5 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              @click="cerrarModal"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
              :disabled="guardando"
            >
              <Save class="w-3.5 h-3.5" />
              {{ guardando ? 'Guardando…' : 'Guardar automatización' }}
            </button>
          </footer>
        </form>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { Pencil, Plus, Save, Trash2, X, Zap } from 'lucide-vue-next';
import { FlickerlessSurface } from '@flickerless/vue';
import ListPager from '@/shared/components/ListPager.vue';
import SelectField, { type SelectValue } from '@/shared/components/SelectField.vue';
import { dialogService } from '@/core/dialog/dialog.service';
import { toastService } from '@/core/notifications/toast.service';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import { sectoresService } from '@/modules/clientes/services/sectores.service';
import type { PrioridadCliente } from '@/modules/clientes/types/cliente.types';
import type { EtapaOportunidad } from '@/modules/pipeline/types/pipeline.types';
import { automatizacionesService } from '../services/automatizaciones.service';
import {
  ETIQUETAS_ACCION,
  ETIQUETAS_ETAPA,
  ETIQUETAS_EVENTO,
  type AccionAutomatizacion,
  type Automatizacion,
  type EventoAutomatizacion,
} from '../types/automatizacion.types';

const authStore = useAuthStore();
const puedeEditar = computed(() => authStore.tienePermiso('configuracion:editar'));

const filas = ref<Automatizacion[]>([]);
const total = ref<number | null>(null);
const hasMore = ref(false);
const pagina = ref(1);
const tamanoPagina = 10;
const cargando = ref(true);
const primeraRespuesta = ref(false);
const guardando = ref(false);

const busqueda = ref('');
const filtroEvento = ref<EventoAutomatizacion | ''>('');
const filtroEstado = ref<'true' | 'false' | ''>('');
let temporizadorBusqueda: ReturnType<typeof setTimeout> | null = null;

const opcionesFiltroEvento = [
  { value: '', label: 'Todos los eventos' },
  ...Object.entries(ETIQUETAS_EVENTO).map(([value, label]) => ({ value, label })),
];
const opcionesFiltroEstado = [
  { value: '', label: 'Todos los estados' },
  { value: 'true', label: 'Activas' },
  { value: 'false', label: 'Inactivas' },
];

const opcionesEvento = Object.entries(ETIQUETAS_EVENTO).map(([value, label]) => ({ value, label }));
const opcionesAccion = Object.entries(ETIQUETAS_ACCION).map(([value, label]) => ({ value, label }));
const opcionesEtapa = [
  { value: '', label: 'Cualquier etapa' },
  ...Object.entries(ETIQUETAS_ETAPA).map(([value, label]) => ({ value, label })),
];
const opcionesPrioridad = [
  { value: '', label: 'Cualquier prioridad' },
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
];
const opcionesPrioridadAccion = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
];
const opcionesSector = computed(() => [
  { value: '', label: 'Cualquier sector' },
  ...sectoresService
    .obtenerSectores()
    .filter((sector) => sector.activo)
    .map((sector) => ({ value: sector.nombre, label: sector.nombre })),
]);

const cargar = async () => {
  cargando.value = true;
  try {
    const resultado = await automatizacionesService.listar({
      pagina: pagina.value,
      tamanoPagina,
      busqueda: busqueda.value,
      evento: filtroEvento.value,
      activa: filtroEstado.value === '' ? null : filtroEstado.value === 'true',
    });
    filas.value = resultado.datos;
    total.value = resultado.total;
    hasMore.value = resultado.hasMore;

    if (resultado.pagina !== pagina.value) pagina.value = resultado.pagina;
  } catch (error) {
    toastService.error(
      error instanceof Error ? error.message : 'No se pudieron cargar las automatizaciones.'
    );
  } finally {
    cargando.value = false;
    primeraRespuesta.value = true;
  }
};

const programarBusqueda = () => {
  if (temporizadorBusqueda) clearTimeout(temporizadorBusqueda);
  temporizadorBusqueda = setTimeout(() => {
    pagina.value = 1;
    void cargar();
  }, 320);
};

const cambiarFiltroEvento = (valor: SelectValue) => {
  filtroEvento.value = String(valor ?? '') as EventoAutomatizacion | '';
  pagina.value = 1;
  void cargar();
};

const cambiarFiltroEstado = (valor: SelectValue) => {
  filtroEstado.value = String(valor ?? '') as 'true' | 'false' | '';
  pagina.value = 1;
  void cargar();
};

const describirCondiciones = (regla: Automatizacion): string[] => {
  const condiciones = regla.condiciones;
  const descripciones: string[] = [];
  if (condiciones.etapa) descripciones.push(`Etapa: ${ETIQUETAS_ETAPA[condiciones.etapa]}`);
  if (condiciones.etapa_origen) {
    descripciones.push(`Desde: ${ETIQUETAS_ETAPA[condiciones.etapa_origen]}`);
  }
  if (condiciones.sector) descripciones.push(`Sector: ${condiciones.sector}`);
  if (condiciones.prioridad) descripciones.push(`Prioridad: ${condiciones.prioridad}`);
  return descripciones;
};

// --- Formulario ---
const modalAbierto = ref(false);
const modoEdicion = ref<'crear' | 'editar'>('crear');
const idEditando = ref('');

const form = reactive({
  nombre: '',
  descripcion: '',
  evento: 'etapa_cambiada' as EventoAutomatizacion,
  activa: true,
  etapa: '' as EtapaOportunidad | '',
  etapaOrigen: '' as EtapaOportunidad | '',
  sector: '',
  prioridad: '' as PrioridadCliente | '',
  tipo: 'crear_tarea' as AccionAutomatizacion,
  tituloAccion: '',
  descripcionAccion: '',
  prioridadAccion: 'media' as PrioridadCliente,
  dias: 2,
});

const reiniciarFormulario = () => {
  form.nombre = '';
  form.descripcion = '';
  form.evento = 'etapa_cambiada';
  form.activa = true;
  form.etapa = '';
  form.etapaOrigen = '';
  form.sector = '';
  form.prioridad = '';
  form.tipo = 'crear_tarea';
  form.tituloAccion = '';
  form.descripcionAccion = '';
  form.prioridadAccion = 'media';
  form.dias = 2;
};

const abrirCrear = () => {
  if (!puedeEditar.value) return;
  modoEdicion.value = 'crear';
  idEditando.value = '';
  reiniciarFormulario();
  modalAbierto.value = true;
};

const abrirEditar = (regla: Automatizacion) => {
  if (!puedeEditar.value) return;
  modoEdicion.value = 'editar';
  idEditando.value = regla.id;
  form.nombre = regla.nombre;
  form.descripcion = regla.descripcion;
  form.evento = regla.evento;
  form.activa = regla.activa;
  form.etapa = regla.condiciones.etapa || '';
  form.etapaOrigen = regla.condiciones.etapa_origen || '';
  form.sector = regla.condiciones.sector || '';
  form.prioridad = regla.condiciones.prioridad || '';
  form.tipo = regla.accion.tipo;
  form.tituloAccion = regla.accion.titulo;
  form.descripcionAccion = regla.accion.descripcion;
  form.prioridadAccion = regla.accion.prioridad;
  form.dias = regla.accion.dias_vencimiento;
  modalAbierto.value = true;
};

const cerrarModal = () => {
  if (guardando.value) return;
  modalAbierto.value = false;
};

const cambiarEventoFormulario = (valor: SelectValue) => {
  form.evento = String(valor ?? 'etapa_cambiada') as EventoAutomatizacion;
};

const cambiarAccionFormulario = (valor: SelectValue) => {
  form.tipo = String(valor ?? 'crear_tarea') as AccionAutomatizacion;
};

const guardar = async () => {
  if (!puedeEditar.value) {
    toastService.error('No tienes permiso para administrar automatizaciones.');
    return;
  }
  if (!form.nombre.trim()) {
    toastService.error('El nombre de la automatización es obligatorio.');
    return;
  }
  if (!form.tituloAccion.trim()) {
    toastService.error('El título de la acción es obligatorio.');
    return;
  }

  const esCambioEtapa = form.evento === 'etapa_cambiada';
  const payload = {
    nombre: form.nombre.trim(),
    descripcion: form.descripcion.trim(),
    evento: form.evento,
    activa: form.activa,
    condiciones: {
      etapa: esCambioEtapa ? form.etapa : '',
      etapa_origen: esCambioEtapa ? form.etapaOrigen : '',
      sector: form.sector,
      prioridad: form.prioridad,
    },
    accion: {
      tipo: form.tipo,
      titulo: form.tituloAccion.trim(),
      descripcion: form.descripcionAccion.trim(),
      prioridad: form.prioridadAccion,
      dias_vencimiento: Math.max(0, Number(form.dias) || 0),
    },
  };

  guardando.value = true;
  try {
    if (modoEdicion.value === 'crear') {
      const creada = await automatizacionesService.crear(payload);
      if (!creada) throw new Error('No se pudo crear la automatización.');
      toastService.exito(`Automatización "${creada.nombre}" creada.`);
    } else {
      const actualizada = await automatizacionesService.actualizar(idEditando.value, payload);
      if (!actualizada) throw new Error('No se pudo actualizar la automatización.');
      toastService.exito(`Automatización "${actualizada.nombre}" actualizada.`);
    }
    modalAbierto.value = false;
    await cargar();
  } catch (error) {
    toastService.error(
      error instanceof Error ? error.message : 'No se pudo guardar la automatización.'
    );
  } finally {
    guardando.value = false;
  }
};

const alternarEstado = async (regla: Automatizacion) => {
  if (!puedeEditar.value) return;
  guardando.value = true;
  try {
    const ok = await automatizacionesService.cambiarEstado(regla.id, !regla.activa);
    if (!ok) throw new Error('No se pudo cambiar el estado de la regla.');
    toastService.exito(
      `Automatización "${regla.nombre}" ${regla.activa ? 'desactivada' : 'activada'}.`
    );
    await cargar();
  } catch (error) {
    toastService.error(error instanceof Error ? error.message : 'No se pudo cambiar el estado.');
  } finally {
    guardando.value = false;
  }
};

const eliminarRegla = async (regla: Automatizacion) => {
  if (!puedeEditar.value) return;

  const confirmado = await dialogService.confirmar({
    titulo: 'ELIMINAR AUTOMATIZACIÓN',
    subtitulo: regla.nombre.toUpperCase(),
    mensaje: `¿Desea eliminar la automatización "${regla.nombre}"?`,
    detalle:
      'Las tareas y notas ya generadas se conservan; la regla dejará de ejecutarse de inmediato.',
    textoConfirmar: 'ELIMINAR AUTOMATIZACIÓN',
    textoCancelar: 'CANCELAR',
    tipo: 'peligro',
  });
  if (!confirmado) return;

  guardando.value = true;
  try {
    const ok = await automatizacionesService.eliminar(regla.id);
    if (!ok) throw new Error('No se pudo eliminar la automatización.');
    toastService.exito(`Automatización "${regla.nombre}" eliminada.`);
    if (filas.value.length === 1 && pagina.value > 1) pagina.value -= 1;
    await cargar();
  } catch (error) {
    toastService.error(error instanceof Error ? error.message : 'No se pudo eliminar la regla.');
  } finally {
    guardando.value = false;
  }
};

onMounted(() => {
  void cargar();
});

onBeforeUnmount(() => {
  if (temporizadorBusqueda) clearTimeout(temporizadorBusqueda);
});
</script>
