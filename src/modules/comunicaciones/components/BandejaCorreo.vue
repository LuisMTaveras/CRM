<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { webmailService } from '../services/webmail.service';
import { smtpService } from '../services/smtp.service';
import type { 
  CarpetaCorreo, 
  CarpetaCorreoId, 
  MensajeCorreo, 
  RespuestaMensajesPaginada 
} from '../types/webmail.types';
import RedactarCorreoModal from './RedactarCorreoModal.vue';
import ConfiguracionFirmaYPieModal from './ConfiguracionFirmaYPieModal.vue';
import { 
  Inbox, 
  Send, 
  FileEdit, 
  Archive, 
  Trash2, 
  Search, 
  RefreshCw, 
  Star, 
  Paperclip, 
  Reply, 
  Mail, 
  Sliders, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Building2, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-vue-next';
import { formatDate, formatRelativeTime } from '@/core/formatters/formatters';
import { toastService } from '@/core/notifications/toast.service';

const carpetas = ref<CarpetaCorreo[]>([]);
const carpetaActiva = ref<CarpetaCorreoId>('inbox');
const mensajes = ref<MensajeCorreo[]>([]);
const mensajeSeleccionado = ref<MensajeCorreo | null>(null);

const cargando = ref(true);
const sincronizando = ref(false);

const busqueda = ref('');
const pagina = ref(1);
const limite = ref(15);
const total = ref(0);
const totalPaginas = ref(1);

// Modales
const modalRedactarAbierto = ref(false);
const modalConfigAbierto = ref(false);

// Estado de respuesta rápida al pie del visor
const respuestaCuerpo = ref('');
const incluirFirmaEnRespuesta = ref(true);
const incluirPieEnRespuesta = ref(true);
const citarOriginalEnRespuesta = ref(false);
const enviandoRespuesta = ref(false);
const feedbackRespuesta = ref<{ exito: boolean; mensaje: string } | null>(null);

const cuentaConfigurada = ref('');
const actualizarCuentaConfigurada = () => {
  const conf = smtpService.obtenerConfiguracion();
  cuentaConfigurada.value = conf.usuarioImap || conf.usuarioSmtp || '';
};

const cargarCarpetas = async () => {
  carpetas.value = await webmailService.obtenerCarpetas();
};

const cargarMensajes = async () => {
  try {
    cargando.value = true;
    const resp: RespuestaMensajesPaginada = await webmailService.obtenerMensajes(
      carpetaActiva.value,
      pagina.value,
      limite.value,
      busqueda.value
    );
    mensajes.value = resp.mensajes || [];
    total.value = resp.total || 0;
    totalPaginas.value = resp.totalPaginas || 1;

    if (mensajeSeleccionado.value) {
      const encontrado = mensajes.value.find((m) => m.id === mensajeSeleccionado.value?.id);
      if (encontrado) {
        mensajeSeleccionado.value = encontrado;
      } else {
        mensajeSeleccionado.value = mensajes.value[0] || null;
      }
    } else if (mensajes.value.length > 0) {
      seleccionarMensaje(mensajes.value[0]);
    }
  } catch (err) {
    console.error('Error al cargar mensajes del webmail:', err);
  } finally {
    cargando.value = false;
  }
};

const sincronizarCorreos = async (forzarSilencioso = false) => {
  if (sincronizando.value) return;
  sincronizando.value = true;

  try {
    const res = await webmailService.sincronizar(carpetaActiva.value, 35);
    if (res.exito) {
      await cargarCarpetas();
      await cargarMensajes();

      if (!forzarSilencioso) {
        if (res.sincronizados && res.sincronizados > 0) {
          toastService.exito(res.mensaje || `Se sincronizaron ${res.sincronizados} correos.`);
        } else if (res.mensaje?.toLowerCase().includes('no se encontró')) {
          toastService.info(res.mensaje);
        } else {
          toastService.exito(res.mensaje || 'Bandeja sincronizada exitosamente.');
        }
      } else if (res.sincronizados && res.sincronizados > 0) {
        toastService.exito(`Se sincronizaron ${res.sincronizados} correos nuevos.`);
      }
    } else {
      toastService.advertencia(res.mensaje || res.error || 'Error al conectar con el servidor IMAP.');
    }
  } catch (err: any) {
    toastService.error(`Error de sincronización: ${err.message || 'Servidor no responde'}`);
  } finally {
    sincronizando.value = false;
  }
};

const seleccionarCarpeta = (id: CarpetaCorreoId) => {
  carpetaActiva.value = id;
  pagina.value = 1;
  mensajeSeleccionado.value = null;
  cargarMensajes();
};

const seleccionarMensaje = async (mensaje: MensajeCorreo) => {
  mensajeSeleccionado.value = mensaje;
  feedbackRespuesta.value = null;
  respuestaCuerpo.value = '';

  if (!mensaje.leido) {
    mensaje.leido = true;
    await webmailService.marcarLeido(mensaje.id, true);
    await cargarCarpetas();
  }
};

const toggleDestacado = async (mensaje: MensajeCorreo, event?: Event) => {
  if (event) event.stopPropagation();
  mensaje.destacado = !mensaje.destacado;
  await webmailService.toggleDestacado(mensaje.id, mensaje.destacado);
};

const marcarNoLeido = async (mensaje: MensajeCorreo) => {
  mensaje.leido = false;
  await webmailService.marcarLeido(mensaje.id, false);
  await cargarCarpetas();
};

const moverAPapelera = async (mensaje: MensajeCorreo) => {
  await webmailService.moverCarpeta(mensaje.id, 'papelera');
  await cargarCarpetas();
  await cargarMensajes();
  if (mensajeSeleccionado.value?.id === mensaje.id) {
    mensajeSeleccionado.value = null;
  }
};

const enviarRespuesta = async () => {
  if (!mensajeSeleccionado.value || !respuestaCuerpo.value.trim()) return;

  enviandoRespuesta.value = true;
  feedbackRespuesta.value = null;

  try {
    const res = await webmailService.responderCorreo({
      mensajeOriginalId: mensajeSeleccionado.value.id,
      destinatario: mensajeSeleccionado.value.de.correo,
      asunto: mensajeSeleccionado.value.asunto.startsWith('Re:') 
        ? mensajeSeleccionado.value.asunto 
        : `Re: ${mensajeSeleccionado.value.asunto}`,
      cuerpo: respuestaCuerpo.value.trim(),
      incluirFirma: incluirFirmaEnRespuesta.value,
      incluirPie: incluirPieEnRespuesta.value,
      citarOriginal: citarOriginalEnRespuesta.value,
      mensajeOriginal: {
        de: mensajeSeleccionado.value.de,
        fecha: mensajeSeleccionado.value.fecha,
        cuerpoHtml: mensajeSeleccionado.value.cuerpoHtml,
        cuerpoTexto: mensajeSeleccionado.value.cuerpoTexto,
        extracto: mensajeSeleccionado.value.extracto,
      },
    });

    if (res.exito) {
      feedbackRespuesta.value = {
        exito: true,
        mensaje: 'Respuesta enviada y registrada en Enviados con éxito.',
      };
      respuestaCuerpo.value = '';
      await cargarCarpetas();
    } else {
      feedbackRespuesta.value = {
        exito: false,
        mensaje: res.error || 'Error al despachar la respuesta.',
      };
    }
  } catch (err: any) {
    feedbackRespuesta.value = {
      exito: false,
      mensaje: err?.message || 'Error de comunicación con el servidor.',
    };
  } finally {
    enviandoRespuesta.value = false;
  }
};

const cambiarPagina = (delta: number) => {
  const nueva = pagina.value + delta;
  if (nueva >= 1 && nueva <= totalPaginas.value) {
    pagina.value = nueva;
    cargarMensajes();
  }
};

watch(busqueda, () => {
  pagina.value = 1;
  cargarMensajes();
});

onMounted(async () => {
  actualizarCuentaConfigurada();
  await cargarCarpetas();
  await cargarMensajes();

  // Si hay cuenta IMAP configurada, intentar sincronización inicial
  const config = smtpService.obtenerConfiguracion();
  const tieneCredencialesReales =
    config.servidorImap &&
    config.usuarioImap &&
    config.contrasenaImap &&
    config.contrasenaImap !== '••••••••••••' &&
    config.contrasenaImap.trim() !== '' &&
    !config.servidorImap.includes('empresa.com.do');

  if (tieneCredencialesReales) {
    sincronizarCorreos(true);
  }
});
</script>

<template>
  <div class="space-y-4 w-full">
    <!-- Barra de Control Superior -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-colors">
      <!-- Búsqueda rápida -->
      <div class="relative flex-1 max-w-md">
        <Search class="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          v-model="busqueda"
          placeholder="Buscar correos por asunto, remitente o extracto..."
          class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      <!-- Acciones de Cabecera -->
      <div class="flex items-center gap-2 shrink-0">
        <button
          type="button"
          @click="modalConfigAbierto = true"
          class="inline-flex items-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium transition"
        >
          <Sliders class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Firma & Servidores</span>
        </button>

        <button
          type="button"
          @click="() => sincronizarCorreos(false)"
          :disabled="sincronizando || cargando"
          title="Sincronizar correos desde el servidor IMAP configurado"
          class="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 rounded-xl text-xs font-semibold transition disabled:opacity-50"
        >
          <RefreshCw :class="['w-3.5 h-3.5', sincronizando ? 'animate-spin text-indigo-600 dark:text-indigo-400' : '']" />
          <span>{{ sincronizando ? 'Sincronizando...' : 'Sincronizar' }}</span>
        </button>

        <button
          type="button"
          @click="modalRedactarAbierto = true"
          class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition shadow-sm shadow-indigo-950/20 active:scale-95"
        >
          <Send class="w-3.5 h-3.5" />
          <span>+ Redactar</span>
        </button>
      </div>
    </div>

    <!-- Contenedor Principal Dividido (Layout de 3 Columnas) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[640px]">
      <!-- COLUMNA 1: Selector de Carpetas (2 columnas de 12) -->
      <div class="lg:col-span-2 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 flex flex-col gap-1.5 h-fit shadow-sm">
        <div class="px-3 py-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono flex items-center justify-between">
          <span>Carpetas</span>
        </div>

        <button
          type="button"
          @click="seleccionarCarpeta('inbox')"
          class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition"
          :class="carpetaActiva === 'inbox' 
            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20' 
            : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'"
        >
          <span class="flex items-center gap-2.5">
            <Inbox class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Bandeja</span>
          </span>
          <span
            v-if="(carpetas.find(c => c.id === 'inbox')?.noLeidos || 0) > 0"
            class="px-2 py-0.5 rounded-full text-[10px] bg-indigo-600 text-white font-bold"
          >
            {{ carpetas.find(c => c.id === 'inbox')?.noLeidos }}
          </span>
          <span v-else class="text-[10px] text-zinc-400 font-mono">
            {{ carpetas.find(c => c.id === 'inbox')?.total || 0 }}
          </span>
        </button>

        <button
          type="button"
          @click="seleccionarCarpeta('enviados')"
          class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition"
          :class="carpetaActiva === 'enviados' 
            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20' 
            : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'"
        >
          <span class="flex items-center gap-2.5">
            <Send class="w-4 h-4 text-sky-500" />
            <span>Enviados</span>
          </span>
          <span class="text-[10px] text-zinc-400 font-mono">
            {{ carpetas.find(c => c.id === 'enviados')?.total || 0 }}
          </span>
        </button>

        <button
          type="button"
          @click="seleccionarCarpeta('borradores')"
          class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition"
          :class="carpetaActiva === 'borradores' 
            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20' 
            : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'"
        >
          <span class="flex items-center gap-2.5">
            <FileEdit class="w-4 h-4 text-amber-500" />
            <span>Borradores</span>
          </span>
          <span class="text-[10px] text-zinc-400 font-mono">
            {{ carpetas.find(c => c.id === 'borradores')?.total || 0 }}
          </span>
        </button>

        <button
          type="button"
          @click="seleccionarCarpeta('archivados')"
          class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition"
          :class="carpetaActiva === 'archivados' 
            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20' 
            : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'"
        >
          <span class="flex items-center gap-2.5">
            <Archive class="w-4 h-4 text-purple-500" />
            <span>Archivados</span>
          </span>
          <span class="text-[10px] text-zinc-400 font-mono">
            {{ carpetas.find(c => c.id === 'archivados')?.total || 0 }}
          </span>
        </button>

        <button
          type="button"
          @click="seleccionarCarpeta('papelera')"
          class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition"
          :class="carpetaActiva === 'papelera' 
            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20' 
            : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'"
        >
          <span class="flex items-center gap-2.5">
            <Trash2 class="w-4 h-4 text-rose-500" />
            <span>Papelera</span>
          </span>
          <span class="text-[10px] text-zinc-400 font-mono">
            {{ carpetas.find(c => c.id === 'papelera')?.total || 0 }}
          </span>
        </button>

        <!-- Indicador de cuenta activa -->
        <div v-if="cuentaConfigurada" class="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-400 px-2 space-y-1">
          <div class="text-[9px] uppercase tracking-wider font-semibold text-zinc-500">Cuenta activa</div>
          <div class="font-mono truncate text-zinc-600 dark:text-zinc-300 font-medium" :title="cuentaConfigurada">
            {{ cuentaConfigurada }}
          </div>
        </div>
      </div>

      <!-- COLUMNA 2: Lista de Correos (4 columnas de 12) -->
      <div class="lg:col-span-4 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col overflow-hidden max-h-[820px] shadow-sm">
        <!-- Cabecera de la lista -->
        <div class="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 flex items-center justify-between shrink-0">
          <div class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            <span>{{ total }} correos</span>
            <span v-if="busqueda" class="text-[10px] text-zinc-400">(filtrados)</span>
          </div>

          <!-- Paginador simple -->
          <div class="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <span>{{ pagina }} / {{ totalPaginas }}</span>
            <button
              type="button"
              @click="cambiarPagina(-1)"
              :disabled="pagina <= 1"
              class="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded disabled:opacity-30"
            >
              <ChevronLeft class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              @click="cambiarPagina(1)"
              :disabled="pagina >= totalPaginas"
              class="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded disabled:opacity-30"
            >
              <ChevronRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Lista scrolleable de mensajes -->
        <div class="flex-1 overflow-y-auto divide-y divide-zinc-200/80 dark:divide-zinc-800/60">
          <div v-if="cargando && mensajes.length === 0" class="p-8 text-center text-zinc-500 text-xs">
            <Loader2 class="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600 dark:text-indigo-400" />
            <span>Consultando bandeja...</span>
          </div>

          <!-- Estado Vacío Elegante (Sin datos falsos) -->
          <div v-else-if="mensajes.length === 0" class="p-8 text-center text-zinc-400 dark:text-zinc-500 text-xs space-y-3">
            <div class="p-3 w-12 h-12 mx-auto rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center text-zinc-400">
              <Mail class="w-6 h-6" />
            </div>
            <div>
              <div class="font-semibold text-zinc-700 dark:text-zinc-200">No hay correos en esta carpeta</div>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Bandeja al día. Pulsa "Sincronizar" para descargar nuevos mensajes del servidor o revisa tus credenciales en Firma & Servidores.
              </p>
            </div>
            <div class="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                @click="() => sincronizarCorreos(false)"
                :disabled="sincronizando"
                class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5"
              >
                <RefreshCw :class="['w-3 h-3', sincronizando ? 'animate-spin' : '']" />
                <span>Sincronizar ahora</span>
              </button>
              <button
                type="button"
                @click="modalConfigAbierto = true"
                class="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium transition"
              >
                Configurar Servidor
              </button>
            </div>
          </div>

          <div
            v-for="msg in mensajes"
            :key="msg.id"
            @click="seleccionarMensaje(msg)"
            class="p-3.5 cursor-pointer transition-colors relative"
            :class="[
              mensajeSeleccionado?.id === msg.id 
                ? 'bg-indigo-50/60 dark:bg-zinc-800/80 border-l-2 border-indigo-600 dark:border-indigo-500' 
                : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40',
              !msg.leido ? 'bg-zinc-50/80 dark:bg-zinc-950/50' : ''
            ]"
          >
            <!-- Fila superior: Remitente y Fecha -->
            <div class="flex items-center justify-between gap-2 mb-1">
              <div class="flex items-center gap-2 min-w-0">
                <!-- Indicador de no leído -->
                <span
                  v-if="!msg.leido"
                  class="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0"
                  title="No leído"
                ></span>
                <span
                  class="text-xs truncate font-medium"
                  :class="!msg.leido ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-600 dark:text-zinc-300'"
                >
                  {{ msg.de.nombre || msg.de.correo }}
                </span>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <span class="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                  {{ formatRelativeTime(msg.fecha) }}
                </span>
                <button
                  type="button"
                  @click="toggleDestacado(msg, $event)"
                  class="p-0.5 text-zinc-400 hover:text-amber-500 transition"
                  :class="msg.destacado ? 'text-amber-500' : ''"
                >
                  <Star class="w-3.5 h-3.5" :class="msg.destacado ? 'fill-amber-500' : ''" />
                </button>
              </div>
            </div>

            <!-- Asunto -->
            <div
              class="text-xs truncate mb-1"
              :class="!msg.leido ? 'text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-600 dark:text-zinc-300'"
            >
              {{ msg.asunto }}
            </div>

            <!-- Extracto -->
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
              {{ msg.extracto }}
            </p>

            <!-- Badges inferiores (Cliente CRM / Adjuntos) -->
            <div class="flex items-center gap-2 mt-2">
              <span
                v-if="msg.clienteNombreRelacionado"
                class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20"
              >
                <Building2 class="w-3 h-3" />
                <span class="truncate max-w-[140px]">{{ msg.clienteNombreRelacionado }}</span>
              </span>

              <span
                v-if="msg.tieneAdjuntos"
                class="inline-flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500"
              >
                <Paperclip class="w-3 h-3" />
                <span>{{ msg.adjuntos?.length || 1 }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- COLUMNA 3: Visor de Mensaje & Respuesta Rápida (6 columnas de 12) -->
      <div class="lg:col-span-6 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col overflow-hidden max-h-[820px] shadow-sm">
        <!-- Si no hay mensaje seleccionado -->
        <div
          v-if="!mensajeSeleccionado"
          class="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400 dark:text-zinc-500 space-y-3"
        >
          <div class="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600">
            <Mail class="w-8 h-8" />
          </div>
          <div class="text-sm font-semibold text-zinc-800 dark:text-zinc-300">Selecciona un correo para leerlo</div>
          <p class="text-xs text-zinc-500 max-w-sm">
            Podrás ver el contenido completo, responder con firma corporativa, reenviar o gestionar la conversación.
          </p>
        </div>

        <!-- Visor Completo de Correo -->
        <div v-else class="flex-1 flex flex-col overflow-hidden">
          <!-- Barra de Acciones del Mensaje -->
          <div class="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="marcarNoLeido(mensajeSeleccionado)"
                class="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Mail class="w-3.5 h-3.5" />
                <span>Marcar no leído</span>
              </button>

              <button
                type="button"
                @click="moverAPapelera(mensajeSeleccionado)"
                class="px-2.5 py-1.5 bg-zinc-100 hover:bg-rose-50 dark:bg-zinc-800 dark:hover:bg-rose-950/60 text-zinc-700 hover:text-rose-600 dark:text-zinc-300 dark:hover:text-rose-400 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Trash2 class="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            </div>

            <div class="flex items-center gap-2">
              <span class="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                {{ formatDate(mensajeSeleccionado.fecha) }}
              </span>
            </div>
          </div>

          <!-- Cabecera del Mensaje -->
          <div class="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800/70 bg-zinc-50/60 dark:bg-zinc-950/30 shrink-0 space-y-3">
            <h2 class="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
              {{ mensajeSeleccionado.asunto }}
            </h2>

            <div class="flex items-start justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 font-bold flex items-center justify-center text-xs shrink-0">
                  {{ (mensajeSeleccionado.de.nombre || mensajeSeleccionado.de.correo).substring(0, 2).toUpperCase() }}
                </div>
                <div class="space-y-0.5">
                  <div class="text-xs font-bold text-zinc-900 dark:text-zinc-200">
                    {{ mensajeSeleccionado.de.nombre }}
                    <span class="font-normal text-zinc-500 dark:text-zinc-400 text-[11px]">&lt;{{ mensajeSeleccionado.de.correo }}&gt;</span>
                  </div>
                  <div class="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Para: <span class="text-zinc-700 dark:text-zinc-300">{{ mensajeSeleccionado.para.map(p => p.nombre || p.correo).join(', ') }}</span>
                  </div>
                </div>
              </div>

              <span
                v-if="mensajeSeleccionado.clienteNombreRelacionado"
                class="px-2 py-1 rounded-lg text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 flex items-center gap-1.5 shrink-0"
              >
                <Building2 class="w-3.5 h-3.5" />
                <span>{{ mensajeSeleccionado.clienteNombreRelacionado }}</span>
              </span>
            </div>

            <!-- Adjuntos si existen -->
            <div v-if="mensajeSeleccionado.adjuntos && mensajeSeleccionado.adjuntos.length > 0" class="flex flex-wrap gap-2 pt-1">
              <div
                v-for="att in mensajeSeleccionado.adjuntos"
                :key="att.id"
                class="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-800 dark:text-zinc-300 transition"
              >
                <Paperclip class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span class="font-medium truncate max-w-[200px]">{{ att.nombre }}</span>
                <span class="text-[10px] text-zinc-400 font-mono">({{ Math.round(att.tamanoBytes / 1024) }} KB)</span>
              </div>
            </div>
          </div>

          <!-- Cuerpo Scrolleable del Mensaje -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <div
              v-if="mensajeSeleccionado.cuerpoHtml"
              class="text-zinc-800 dark:text-zinc-200 text-xs leading-relaxed bg-zinc-50/70 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/60"
              v-html="mensajeSeleccionado.cuerpoHtml"
            ></div>
            <div
              v-else
              class="text-zinc-800 dark:text-zinc-200 text-xs leading-relaxed whitespace-pre-wrap font-sans bg-zinc-50/70 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/60"
            >
              {{ mensajeSeleccionado.cuerpoTexto }}
            </div>

            <!-- CAJA DE RESPUESTA RÁPIDA INTEGRADA -->
            <div class="border-t border-zinc-200 dark:border-zinc-800 pt-5 space-y-3">
              <div class="flex items-center justify-between">
                <div class="text-xs font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-2">
                  <Reply class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Responder a {{ mensajeSeleccionado.de.nombre || mensajeSeleccionado.de.correo }}</span>
                </div>

                <div class="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <label class="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" v-model="incluirFirmaEnRespuesta" class="rounded bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-0" />
                    <span>Incluir firma</span>
                  </label>
                  <label class="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" v-model="incluirPieEnRespuesta" class="rounded bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-0" />
                    <span>Incluir pie legal</span>
                  </label>
                  <label class="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" v-model="citarOriginalEnRespuesta" class="rounded bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-0" />
                    <span>Citar original</span>
                  </label>
                </div>
              </div>

              <!-- Alerta de feedback de respuesta -->
              <div
                v-if="feedbackRespuesta"
                class="p-3 rounded-xl border text-xs flex items-center gap-2"
                :class="feedbackRespuesta.exito ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-300' : 'bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-300'"
              >
                <CheckCircle2 v-if="feedbackRespuesta.exito" class="w-4 h-4 text-emerald-500 shrink-0" />
                <AlertCircle v-else class="w-4 h-4 text-red-500 shrink-0" />
                <span>{{ feedbackRespuesta.mensaje }}</span>
              </div>

              <!-- Textarea de respuesta -->
              <textarea
                v-model="respuestaCuerpo"
                rows="4"
                :placeholder="`Escribe tu respuesta para ${mensajeSeleccionado.de.nombre}...`"
                class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-zinc-900 dark:text-zinc-200 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
              ></textarea>

              <div class="flex items-center justify-end">
                <button
                  type="button"
                  @click="enviarRespuesta"
                  :disabled="enviandoRespuesta || !respuestaCuerpo.trim()"
                  class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition flex items-center gap-2 shadow-sm shadow-indigo-950/20 disabled:opacity-40"
                >
                  <Loader2 v-if="enviandoRespuesta" class="w-3.5 h-3.5 animate-spin" />
                  <Send v-else class="w-3.5 h-3.5" />
                  <span>{{ enviandoRespuesta ? 'Enviando...' : 'Enviar Respuesta' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modales -->
    <RedactarCorreoModal
      :abierto="modalRedactarAbierto"
      @cerrar="modalRedactarAbierto = false"
      @enviado="() => { cargarCarpetas(); cargarMensajes(); }"
    />

    <ConfiguracionFirmaYPieModal
      :abierto="modalConfigAbierto"
      @cerrar="modalConfigAbierto = false"
      @guardado="() => { actualizarCuentaConfigurada(); cargarCarpetas(); sincronizarCorreos(false); }"
    />
  </div>
</template>
