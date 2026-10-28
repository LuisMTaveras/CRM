<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { Download, History, RefreshCw, ShieldCheck, ShieldAlert, Trash2 } from 'lucide-vue-next';
import { FlickerlessSurface } from '@flickerless/vue';
import AppSelect, { type SelectOption } from '@/shared/components/AppSelect.vue';
import DateRangeFilter from '@/shared/components/DateRangeFilter.vue';
import ListPager from '@/shared/components/ListPager.vue';
import { formatDate, formatRelativeTime } from '@/core/formatters/formatters';
import { defaultRange, resolveRange, type DateRange } from '@/core/dates/date-range';
import { toastService } from '@/core/notifications/toast.service';
import { dialogService } from '@/core/dialog/dialog.service';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import { auditoriaService } from '../services/auditoria.service';
import type { EventoAuditoria, FiltrosAuditoria } from '../types/auditoria.types';

const authStore = useAuthStore();
const puedeLimpiar = computed(() => authStore.rol === 'admin');
const limpiando = ref(false);
const eventos = ref<EventoAuditoria[]>([]);
const acciones = ref<string[]>([]);
const cargando = ref(true);
const exportando = ref(false);
const total = ref<number | null>(null);
const hasMore = ref<boolean | undefined>(undefined);
const pagina = ref(1);
const tamanoPagina = 20;
const busqueda = ref('');
const accionSeleccionada = ref('');
const estadoSeleccionado = ref<'todos' | 'exitosos' | 'fallidos'>('todos');
const rango = ref<DateRange>(defaultRange('month'));
let timerBusqueda: ReturnType<typeof setTimeout> | null = null;

const ETIQUETAS_ACCION: Record<string, string> = {
  'auth.login': 'Inicio de sesión',
  'usuarios.crear': 'Crear usuario',
  'usuarios.actualizar': 'Actualizar usuario',
  'usuarios.contrasena': 'Restablecer contraseña',
  'usuarios.eliminar': 'Eliminar usuario',
  'POST /api/email/responder': 'Responder correo',
  'POST /api/email/redactar': 'Redactar correo',
  'POST /api/email/enviar': 'Enviar correo',
  'POST /api/email/enviar-masivo': 'Enviar correo masivo',
  'POST /api/email/configuracion': 'Guardar configuración de correo',
  'POST /api/email/sincronizar': 'Sincronizar correo',
  'POST /api/empresa': 'Actualizar empresa',
  'POST /api/email/empresa': 'Actualizar empresa',
  'auditoria.limpiar': 'Limpiar auditoria',
};

const ETIQUETAS_ENTIDAD: Record<string, string> = {
  auth: 'Autenticación',
  sesion: 'Sesión',
  usuarios: 'Usuarios',
  email: 'Correo',
  empresa: 'Empresa',
  whatsapp: 'WhatsApp',
  configuracion: 'Configuración',
};

const opcionesEstado: Array<SelectOption<'todos' | 'exitosos' | 'fallidos'>> = [
  { value: 'todos', label: 'Todos los resultados' },
  { value: 'exitosos', label: 'Solo exitosos' },
  { value: 'fallidos', label: 'Solo fallidos' },
];

const opcionesAccion = computed<Array<SelectOption<string>>>(() => [
  { value: '', label: 'Todas las acciones' },
  ...acciones.value.map((accion) => ({
    value: accion,
    label: etiquetaAccion(accion),
    description: accion,
  })),
]);

const filtros = computed<FiltrosAuditoria>(() => {
  const periodo = resolveRange(rango.value);
  return {
    q: busqueda.value,
    accion: accionSeleccionada.value,
    desde: periodo.from,
    hasta: periodo.to,
    exito: estadoSeleccionado.value === 'todos'
      ? null
      : estadoSeleccionado.value === 'exitosos',
  };
});

function etiquetaAccion(accion: string): string {
  return ETIQUETAS_ACCION[accion] || accion.replace(/^([A-Z]+)\s+\/api\//, '$1 /');
}

function etiquetaEntidad(entidad: string): string {
  return ETIQUETAS_ENTIDAD[entidad] || entidad || '—';
}

function nombreActor(evento: EventoAuditoria): string {
  return evento.actor?.nombre || evento.actor?.email || 'Sistema';
}

function detalleActor(evento: EventoAuditoria): string {
  const partes = [evento.actor?.email, evento.actor?.rol].filter(Boolean);
  return partes.length > 0 ? partes.join(' · ') : 'Proceso automático';
}

function cargarEventos() {
  return auditoriaService
    .listar({
      page: pagina.value,
      pageSize: tamanoPagina,
      ...filtros.value,
    })
    .then((respuesta) => {
      eventos.value = respuesta.eventos;
      total.value = respuesta.total;
      hasMore.value = respuesta.hasMore;
      if (respuesta.acciones.length > 0) acciones.value = respuesta.acciones;
    });
}

const cargarConAviso = async () => {
  cargando.value = true;
  try {
    await cargarEventos();
  } catch (error) {
    toastService.error(error instanceof Error ? error.message : 'No se pudo cargar la auditoría.');
  } finally {
    cargando.value = false;
  }
};

const recargar = (reiniciarPagina = true) => {
  if (reiniciarPagina && pagina.value !== 1) {
    pagina.value = 1;
    return;
  }
  cargarConAviso();
};

watch(busqueda, () => {
  if (timerBusqueda) clearTimeout(timerBusqueda);
  timerBusqueda = setTimeout(() => recargar(true), 300);
});

watch([accionSeleccionada, estadoSeleccionado], () => recargar(true));
watch(pagina, () => cargarConAviso());

const alCambiarPeriodo = () => recargar(true);

const exportar = async () => {
  exportando.value = true;
  try {
    await auditoriaService.descargarCsv(filtros.value);
    toastService.exito('Registro de auditoría exportado.');
  } catch (error) {
    toastService.error(error instanceof Error ? error.message : 'No se pudo exportar la auditoría.');
  } finally {
    exportando.value = false;
  }
};

const limpiarRegistro = async () => {
  if (!puedeLimpiar.value) return;

  const confirmado = await dialogService.confirmar({
    titulo: 'Limpiar registro de auditoria',
    mensaje: 'Se eliminaran todos los eventos de auditoria almacenados. Esta accion no se puede deshacer.',
    textoConfirmar: 'Si, limpiar registro',
    tipo: 'peligro',
  });
  if (!confirmado) return;

  limpiando.value = true;
  try {
    const resultado = await auditoriaService.limpiar();
    toastService.exito(`Registro limpiado. Eventos eliminados: ${resultado.eliminados}.`);
    pagina.value = 1;
    await cargarConAviso();
  } catch (error) {
    toastService.error(error instanceof Error ? error.message : 'No se pudo limpiar la auditoria.');
  } finally {
    limpiando.value = false;
  }
};

onMounted(() => {
  cargarConAviso();
});

onUnmounted(() => {
  if (timerBusqueda) clearTimeout(timerBusqueda);
});
</script>

<template>
  <Teleport to="#header-portal-left">
    <div class="flex items-center gap-3 min-w-0">
      <div class="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
        <History class="w-5 h-5" />
      </div>
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h1 class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
            Auditoría & Trazabilidad
          </h1>
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
            Seguridad
          </span>
        </div>
        <p class="text-[11px] text-zinc-500 dark:text-zinc-400 truncate hidden md:block">
          Historial de accesos, cambios administrativos y operaciones sensibles del CRM
        </p>
      </div>
    </div>
  </Teleport>

  <Teleport to="#header-portal-right">
    <div class="flex items-center gap-2">
      <button
        type="button"
        :disabled="exportando"
        title="Exportar filtro actual a CSV"
        class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white hover:bg-zinc-100 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition disabled:opacity-50"
        @click="exportar"
      >
        <Download class="w-3.5 h-3.5" />
        <span class="hidden sm:inline">{{ exportando ? 'Exportando…' : 'Exportar CSV' }}</span>
      </button>
      <button
        v-if="puedeLimpiar"
        type="button"
        :disabled="limpiando"
        title="Limpiar registro de auditoria"
        class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-400 text-xs font-medium transition disabled:opacity-50"
        @click="limpiarRegistro"
      >
        <Trash2 class="w-3.5 h-3.5" />
        <span class="hidden sm:inline">{{ limpiando ? 'Limpiando...' : 'Limpiar' }}</span>
      </button>
      <button
        type="button"
        :disabled="cargando"
        title="Actualizar auditoría"
        class="p-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white hover:bg-zinc-100 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition disabled:opacity-50"
        @click="cargarConAviso"
      >
        <RefreshCw :class="['w-3.5 h-3.5', cargando ? 'animate-spin text-indigo-600 dark:text-indigo-400' : '']" />
      </button>
    </div>
  </Teleport>

  <div class="w-full pb-8">
    <FlickerlessSurface
      :loading="cargando"
      :delay-ms="180"
      :preserve-height="true"
      stream-color="#4f46e5"
      announce-text="Actualizando el registro de auditoría..."
      class="w-full rounded-xl overflow-hidden"
    >
      <div class="space-y-4">
        <div class="saas-card rounded-xl border border-zinc-200 dark:border-white/[0.08] p-3.5">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                v-model="busqueda"
                type="search"
                placeholder="Buscar actor, acción, IP o detalle…"
                class="h-9 w-full sm:w-72 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900 px-3 text-xs text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none"
              />
              <div class="w-full sm:w-56">
                <AppSelect
                  :model-value="accionSeleccionada"
                  :options="opcionesAccion"
                  :full-width="true"
                  size="md"
                  @update:model-value="(valor) => accionSeleccionada = valor as string"
                />
              </div>
              <div class="w-full sm:w-44">
                <AppSelect
                  :model-value="estadoSeleccionado"
                  :options="opcionesEstado"
                  :full-width="true"
                  size="md"
                  @update:model-value="(valor) => estadoSeleccionado = valor as 'todos' | 'exitosos' | 'fallidos'"
                />
              </div>
            </div>

            <DateRangeFilter
              v-model="rango"
              allow-all
              @change="alCambiarPeriodo"
            />
          </div>
        </div>

        <div class="saas-card rounded-xl overflow-hidden text-xs border border-zinc-200 dark:border-white/[0.08]">
          <div class="p-3.5 border-b border-zinc-200 dark:border-white/[0.07] bg-zinc-50 dark:bg-[#0c0c0e]/80 flex items-center justify-between">
            <div class="flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200">
              <ShieldCheck class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Eventos registrados</span>
            </div>
            <span class="font-mono text-zinc-500 dark:text-zinc-400 text-[11px]">
              {{ total === null ? '—' : total }} eventos
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-zinc-200 dark:border-white/[0.07] bg-zinc-100/70 dark:bg-[#09090b]/60 text-zinc-500 dark:text-zinc-400 text-[11px] font-medium tracking-wider uppercase">
                  <th class="py-3 px-3.5">Fecha</th>
                  <th class="py-3 px-3.5">Actor</th>
                  <th class="py-3 px-3.5">Acción</th>
                  <th class="py-3 px-3.5">Entidad</th>
                  <th class="py-3 px-3.5">Resultado</th>
                  <th class="py-3 px-3.5">IP</th>
                  <th class="py-3 px-3.5">Detalle</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-200 dark:divide-white/[0.04]">
                <tr
                  v-for="evento in eventos"
                  :key="evento.id"
                  class="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition"
                >
                  <td class="py-2.5 px-3.5 whitespace-nowrap">
                    <div class="font-medium text-zinc-800 dark:text-zinc-200">
                      {{ formatDate(evento.timestamp, 'datetime') }}
                    </div>
                    <div class="text-[10px] text-zinc-500 dark:text-zinc-400">
                      {{ formatRelativeTime(evento.timestamp) }}
                    </div>
                  </td>
                  <td class="py-2.5 px-3.5">
                    <div class="font-semibold text-zinc-800 dark:text-zinc-200">{{ nombreActor(evento) }}</div>
                    <div class="text-[10px] text-zinc-500 dark:text-zinc-400">{{ detalleActor(evento) }}</div>
                  </td>
                  <td class="py-2.5 px-3.5">
                    <div class="font-medium text-zinc-800 dark:text-zinc-200">{{ etiquetaAccion(evento.accion) }}</div>
                    <div class="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">{{ evento.accion }}</div>
                  </td>
                  <td class="py-2.5 px-3.5">
                    <div class="text-zinc-700 dark:text-zinc-300">{{ etiquetaEntidad(evento.entidad) }}</div>
                    <div v-if="evento.entidadId" class="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                      {{ evento.entidadId }}
                    </div>
                  </td>
                  <td class="py-2.5 px-3.5">
                    <span
                      :class="[
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                        evento.exito
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
                      ]"
                    >
                      <ShieldCheck v-if="evento.exito" class="w-3 h-3" />
                      <ShieldAlert v-else class="w-3 h-3" />
                      {{ evento.exito ? 'Exitoso' : 'Fallido' }}
                    </span>
                  </td>
                  <td class="py-2.5 px-3.5 font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                    {{ evento.ip || '—' }}
                  </td>
                  <td class="py-2.5 px-3.5 max-w-[22rem] text-zinc-600 dark:text-zinc-400">
                    {{ evento.detalle || '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="total !== null && eventos.length === 0" class="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
            No hay eventos que coincidan con los filtros seleccionados.
          </div>

          <ListPager
            v-model:page="pagina"
            :page-size="tamanoPagina"
            :total="total"
            :has-more="hasMore"
            singular="evento"
            plural="eventos"
          />
        </div>
      </div>
    </FlickerlessSurface>
  </div>
</template>
