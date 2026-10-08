<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { webmailService } from '../services/webmail.service';
import { smtpService } from '../services/smtp.service';
import type { 
  CarpetaCorreo, 
  CarpetaCorreoId, 
  MensajeCorreo, 
  RespuestaMensajesPaginada 
} from '../types/webmail.types';
import RedactarCorreoModal from './RedactarCorreoModal.vue';
import EmailViewer from './EmailViewer.vue';
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
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  Forward,
  Printer,
  Copy,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  KeyRound,
  X
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
const filtroEstado = ref<'todos' | 'noLeidos' | 'destacados' | 'conAdjuntos'>('todos');
const pagina = ref(1);
const limite = ref(15);
const total = ref(0);
const totalPaginas = ref(1);

// Modal Redactar / Reenviar
const modalRedactarAbierto = ref(false);
const redactarDestinatario = ref('');
const redactarAsunto = ref('');
const redactarCuerpo = ref('');

// Estado de respuesta rápida
const respuestaCuerpo = ref('');
const incluirFirmaEnRespuesta = ref(true);
const incluirPieEnRespuesta = ref(true);
const citarOriginalEnRespuesta = ref(false);
const enviandoRespuesta = ref(false);
const feedbackRespuesta = ref<{ exito: boolean; mensaje: string } | null>(null);
const replyInputRef = ref<HTMLTextAreaElement | null>(null);

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
        mensajeSeleccionado.value = mensajesFiltrados.value[0] || null;
      }
    } else if (mensajesFiltrados.value.length > 0) {
      seleccionarMensaje(mensajesFiltrados.value[0]);
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
          toastService.exito(res.mensaje || `Se sincronizaron ${res.sincronizados} correos nuevos.`);
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Servidor no responde';
    toastService.error(`Error de sincronización: ${msg}`);
  } finally {
    sincronizando.value = false;
  }
};

const seleccionarCarpeta = (id: CarpetaCorreoId) => {
  carpetaActiva.value = id;
  pagina.value = 1;
  filtroEstado.value = 'todos';
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
  toastService.info('Mensaje marcado como no leído');
};

const moverAPapelera = async (mensaje: MensajeCorreo) => {
  await webmailService.moverCarpeta(mensaje.id, 'papelera');
  toastService.info('Mensaje movido a la papelera');
  await cargarCarpetas();
  await cargarMensajes();
  if (mensajeSeleccionado.value?.id === mensaje.id) {
    mensajeSeleccionado.value = null;
  }
};

const archivar = async (mensaje: MensajeCorreo) => {
  await webmailService.moverCarpeta(mensaje.id, 'archivados');
  toastService.exito('Mensaje archivado');
  await cargarCarpetas();
  await cargarMensajes();
  if (mensajeSeleccionado.value?.id === mensaje.id) {
    mensajeSeleccionado.value = null;
  }
};

const reenviar = (mensaje: MensajeCorreo) => {
  redactarDestinatario.value = '';
  redactarAsunto.value = mensaje.asunto.startsWith('Fwd:') 
    ? mensaje.asunto 
    : `Fwd: ${mensaje.asunto}`;
  redactarCuerpo.value = `\n\n---------- Mensaje reenviado ----------\nDe: ${mensaje.de.nombre || mensaje.de.correo} <${mensaje.de.correo}>\nFecha: ${formatDate(mensaje.fecha)}\nAsunto: ${mensaje.asunto}\nPara: ${mensaje.para.map(p => p.nombre || p.correo).join(', ')}\n\n${mensaje.cuerpoTexto || mensaje.extracto || ''}`;
  modalRedactarAbierto.value = true;
};

const enfocarRespuesta = () => {
  if (replyInputRef.value) {
    replyInputRef.value.focus();
    replyInputRef.value.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

const copiarAsunto = (asunto: string) => {
  navigator.clipboard.writeText(asunto);
  toastService.info('Asunto copiado al portapapeles');
};

const imprimir = () => {
  window.print();
};

const descargarAdjunto = (att: { nombre: string }) => {
  toastService.info(`Descargando archivo: "${att.nombre}"`);
};

const obtenerIconoAdjunto = (nombre: string) => {
  const ext = nombre.split('.').pop()?.toLowerCase() || '';
  if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) return ImageIcon;
  if (['p12', 'pem', 'crt', 'key'].includes(ext)) return KeyRound;
  if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return FileText;
  return Paperclip;
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
      toastService.exito('Respuesta enviada con éxito');
      respuestaCuerpo.value = '';
      await cargarCarpetas();
    } else {
      feedbackRespuesta.value = {
        exito: false,
        mensaje: res.error || 'Error al despachar la respuesta.',
      };
      toastService.error(res.error || 'Error al enviar respuesta');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error de comunicación con el servidor.';
    feedbackRespuesta.value = {
      exito: false,
      mensaje: msg,
    };
    toastService.error(msg);
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

// Filtro en cliente adicional (no leídos, destacados, adjuntos)
const mensajesFiltrados = computed(() => {
  let list = mensajes.value;
  if (filtroEstado.value === 'noLeidos') {
    list = list.filter((m) => !m.leido);
  } else if (filtroEstado.value === 'destacados') {
    list = list.filter((m) => m.destacado);
  } else if (filtroEstado.value === 'conAdjuntos') {
    list = list.filter((m) => m.tieneAdjuntos || (m.adjuntos && m.adjuntos.length > 0));
  }
  return list;
});

const totalNoLeidos = computed(() => {
  return carpetas.value.find((c) => c.id === 'inbox')?.noLeidos || 0;
});

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
    <!-- Barra de Control Superior Moderna (Superhuman / Linear Style) -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-colors">
      <!-- Búsqueda rápida con botón de limpiar -->
      <div class="relative flex-1 max-w-lg">
        <Search class="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          v-model="busqueda"
          placeholder="Buscar correos por asunto, remitente o extracto..."
          class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-9 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
        />
        <button
          v-if="busqueda"
          type="button"
          @click="busqueda = ''"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Acciones de Cabecera (Sincronizar y Redactar) -->
      <div class="flex items-center gap-2.5 shrink-0 justify-end">
        <!-- Botón de Sincronización IMAP en Vivo -->
        <button
          type="button"
          @click="() => sincronizarCorreos(false)"
          :disabled="sincronizando || cargando"
          title="Sincronizar correos desde el servidor IMAP configurado"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 rounded-xl text-xs font-semibold transition disabled:opacity-50"
        >
          <RefreshCw :class="['w-3.5 h-3.5', sincronizando ? 'animate-spin text-indigo-600 dark:text-indigo-400' : '']" />
          <span>{{ sincronizando ? 'Sincronizando...' : 'Sincronizar' }}</span>
        </button>

        <!-- Botón Redactar Nuevo Correo -->
        <button
          type="button"
          @click="() => { redactarDestinatario = ''; redactarAsunto = ''; redactarCuerpo = ''; modalRedactarAbierto = true; }"
          class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition shadow-md shadow-indigo-950/20 active:scale-95"
        >
          <Send class="w-3.5 h-3.5" />
          <span>+ Redactar</span>
        </button>
      </div>
    </div>

    <!-- Contenedor Principal Dividido (Layout de 3 Columnas) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[660px]">
      
      <!-- ==================== COLUMNA 1: SELECTOR DE CARPETAS (2 cols) ==================== -->
      <div class="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 flex flex-col justify-between shadow-sm">
        <div class="space-y-1">
          <div class="px-3 py-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono flex items-center justify-between">
            <span>Carpetas</span>
            <span v-if="totalNoLeidos > 0" class="px-1.5 py-0.2 bg-indigo-600 text-white text-[9px] rounded-full font-bold">
              {{ totalNoLeidos }}
            </span>
          </div>

          <!-- Bandeja de Entrada -->
          <button
            type="button"
            @click="seleccionarCarpeta('inbox')"
            class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition"
            :class="carpetaActiva === 'inbox' 
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 font-semibold' 
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

          <!-- Enviados -->
          <button
            type="button"
            @click="seleccionarCarpeta('enviados')"
            class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition"
            :class="carpetaActiva === 'enviados' 
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 font-semibold' 
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

          <!-- Borradores -->
          <button
            type="button"
            @click="seleccionarCarpeta('borradores')"
            class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition"
            :class="carpetaActiva === 'borradores' 
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 font-semibold' 
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

          <!-- Archivados -->
          <button
            type="button"
            @click="seleccionarCarpeta('archivados')"
            class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition"
            :class="carpetaActiva === 'archivados' 
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 font-semibold' 
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

          <!-- Papelera -->
          <button
            type="button"
            @click="seleccionarCarpeta('papelera')"
            class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition"
            :class="carpetaActiva === 'papelera' 
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 font-semibold' 
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
        </div>

        <!-- Tarjeta de Cuenta Activa & Protocolo IMAP -->
        <div class="mt-6 pt-3.5 border-t border-zinc-200 dark:border-zinc-800 p-2 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[9px] uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-500 font-mono">
              Cuenta Vinculada
            </span>
            <span class="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>IMAP 993</span>
            </span>
          </div>

          <div class="flex items-center gap-2 min-w-0">
            <div class="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-indigo-500/20">
              {{ (cuentaConfigurada || 'CRM').substring(0, 2).toUpperCase() }}
            </div>
            <div class="min-w-0">
              <div class="font-mono truncate text-[11px] text-zinc-800 dark:text-zinc-200 font-medium" :title="cuentaConfigurada || 'Sin cuenta configurada'">
                {{ cuentaConfigurada || 'Sin configurar' }}
              </div>
              <router-link
                to="/configuracion?tab=correo"
                class="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline block"
              >
                Cambiar en Ajustes
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== COLUMNA 2: LISTA DE CORREOS (4 cols) ==================== -->
      <div class="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col overflow-hidden max-h-[820px] shadow-sm">
        <!-- Cabecera de la lista con Filtros Rápidos -->
        <div class="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 space-y-2 shrink-0">
          <div class="flex items-center justify-between">
            <div class="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <span>{{ total }} correos</span>
              <span v-if="busqueda" class="text-[10px] font-normal text-indigo-500">(filtrados)</span>
            </div>

            <!-- Paginador simple -->
            <div class="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <span class="font-mono text-[11px]">{{ pagina }} / {{ totalPaginas }}</span>
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

          <!-- Filtros de Estado en Píldoras -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              @click="filtroEstado = 'todos'"
              class="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition shrink-0"
              :class="filtroEstado === 'todos' 
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' 
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'"
            >
              Todos
            </button>
            <button
              type="button"
              @click="filtroEstado = 'noLeidos'"
              class="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition shrink-0 flex items-center gap-1"
              :class="filtroEstado === 'noLeidos' 
                ? 'bg-indigo-600 text-white' 
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'"
            >
              <span>No leídos</span>
            </button>
            <button
              type="button"
              @click="filtroEstado = 'destacados'"
              class="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition shrink-0 flex items-center gap-1"
              :class="filtroEstado === 'destacados' 
                ? 'bg-amber-600 text-white' 
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'"
            >
              <Star class="w-3 h-3" />
              <span>Destacados</span>
            </button>
            <button
              type="button"
              @click="filtroEstado = 'conAdjuntos'"
              class="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition shrink-0 flex items-center gap-1"
              :class="filtroEstado === 'conAdjuntos' 
                ? 'bg-sky-600 text-white' 
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'"
            >
              <Paperclip class="w-3 h-3" />
              <span>Con adjuntos</span>
            </button>
          </div>
        </div>

        <!-- Lista scrolleable de mensajes -->
        <div class="flex-1 overflow-y-auto divide-y divide-zinc-200/80 dark:divide-zinc-800/60">
          <div v-if="cargando && mensajes.length === 0" class="p-10 text-center text-zinc-500 text-xs">
            <Loader2 class="w-6 h-6 animate-spin mx-auto mb-2.5 text-indigo-600 dark:text-indigo-400" />
            <span>Consultando servidor IMAP...</span>
          </div>

          <!-- Estado Vacío -->
          <div v-else-if="mensajesFiltrados.length === 0" class="p-8 text-center text-zinc-400 dark:text-zinc-500 text-xs space-y-3">
            <div class="p-3.5 w-12 h-12 mx-auto rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center text-zinc-400">
              <Mail class="w-6 h-6" />
            </div>
            <div>
              <div class="font-semibold text-zinc-800 dark:text-zinc-200">No hay mensajes disponibles</div>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
                {{ busqueda ? 'No se encontraron coincidencias para la búsqueda.' : 'La carpeta se encuentra al día. Pulsa "Sincronizar" para verificar mensajes recientes.' }}
              </p>
            </div>
            <div class="pt-1">
              <button
                type="button"
                @click="() => sincronizarCorreos(false)"
                :disabled="sincronizando"
                class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition inline-flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw :class="['w-3.5 h-3.5', sincronizando ? 'animate-spin' : '']" />
                <span>Sincronizar ahora</span>
              </button>
            </div>
          </div>

          <!-- Cards de Correos Rediseñadas -->
          <div
            v-for="msg in mensajesFiltrados"
            :key="msg.id"
            @click="seleccionarMensaje(msg)"
            class="p-4 cursor-pointer transition-all relative border-l-4"
            :class="[
              mensajeSeleccionado?.id === msg.id 
                ? 'bg-indigo-50/70 dark:bg-zinc-800/90 border-indigo-600 dark:border-indigo-500 shadow-sm' 
                : 'border-transparent hover:bg-zinc-50/90 dark:hover:bg-zinc-800/40',
              !msg.leido ? 'bg-zinc-50/60 dark:bg-zinc-950/40' : ''
            ]"
          >
            <!-- Fila superior: Remitente y Fecha -->
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <div class="flex items-center gap-2 min-w-0">
                <!-- Indicador visual de no leído -->
                <span
                  v-if="!msg.leido"
                  class="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 ring-2 ring-indigo-500/20"
                  title="Mensaje no leído"
                ></span>
                <span
                  class="text-xs truncate"
                  :class="!msg.leido ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-700 dark:text-zinc-300 font-medium'"
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
                  class="p-1 text-zinc-400 hover:text-amber-500 transition rounded"
                  :class="msg.destacado ? 'text-amber-500' : ''"
                >
                  <Star class="w-3.5 h-3.5" :class="msg.destacado ? 'fill-amber-500' : ''" />
                </button>
              </div>
            </div>

            <!-- Asunto -->
            <div
              class="text-xs truncate mb-1"
              :class="!msg.leido ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-800 dark:text-zinc-200 font-medium'"
            >
              {{ msg.asunto }}
            </div>

            <!-- Extracto -->
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
              {{ msg.extracto }}
            </p>

            <!-- Badges inferiores (Cliente CRM / Adjuntos) -->
            <div class="flex items-center gap-2 mt-2.5">
              <span
                v-if="msg.clienteNombreRelacionado"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20"
              >
                <Building2 class="w-3 h-3" />
                <span class="truncate max-w-[150px]">{{ msg.clienteNombreRelacionado }}</span>
              </span>

              <span
                v-if="msg.tieneAdjuntos || (msg.adjuntos && msg.adjuntos.length > 0)"
                class="inline-flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 font-mono"
              >
                <Paperclip class="w-3 h-3 text-indigo-500" />
                <span>{{ msg.adjuntos?.length || 1 }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== COLUMNA 3: VISOR DE LECTURA & RESPUESTA (6 cols) ==================== -->
      <div class="lg:col-span-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col overflow-hidden max-h-[820px] shadow-sm">
        
        <!-- Si no hay mensaje seleccionado -->
        <div
          v-if="!mensajeSeleccionado"
          class="flex-1 flex flex-col items-center justify-center p-12 text-center text-zinc-400 dark:text-zinc-500 space-y-4"
        >
          <div class="p-5 rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600">
            <Mail class="w-10 h-10" />
          </div>
          <div class="space-y-1">
            <h3 class="text-sm font-bold text-zinc-800 dark:text-zinc-200">Selecciona un correo para leerlo</h3>
            <p class="text-xs text-zinc-500 max-w-sm leading-relaxed">
              Podrás ver el contenido completo, anexos interactivos, responder con firma institucional, reenviar y vincular al expediente del cliente.
            </p>
          </div>
        </div>

        <!-- Visor Completo de Correo -->
        <div v-else class="flex-1 flex flex-col overflow-hidden">
          
          <!-- Barra de Acciones del Mensaje Superior -->
          <div class="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <!-- Botón Responder -->
              <button
                type="button"
                @click="enfocarRespuesta"
                class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm shadow-indigo-600/20"
              >
                <Reply class="w-3.5 h-3.5" />
                <span>Responder</span>
              </button>

              <!-- Botón Reenviar -->
              <button
                type="button"
                @click="reenviar(mensajeSeleccionado)"
                class="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Forward class="w-3.5 h-3.5 text-sky-500" />
                <span>Reenviar</span>
              </button>

              <!-- Botón Marcar no leído -->
              <button
                type="button"
                @click="marcarNoLeido(mensajeSeleccionado)"
                class="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                title="Marcar como no leído"
              >
                <Mail class="w-3.5 h-3.5" />
                <span class="hidden sm:inline">No leído</span>
              </button>

              <!-- Botón Archivar -->
              <button
                type="button"
                @click="archivar(mensajeSeleccionado)"
                class="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                title="Archivar conversación"
              >
                <Archive class="w-3.5 h-3.5 text-purple-500" />
                <span class="hidden sm:inline">Archivar</span>
              </button>

              <!-- Botón Eliminar -->
              <button
                type="button"
                @click="moverAPapelera(mensajeSeleccionado)"
                class="px-2.5 py-1.5 bg-zinc-100 hover:bg-rose-50 dark:bg-zinc-800 dark:hover:bg-rose-950/60 text-zinc-700 hover:text-rose-600 dark:text-zinc-300 dark:hover:text-rose-400 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                title="Mover a la papelera"
              >
                <Trash2 class="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            </div>

            <!-- Acciones secundarias (Imprimir / Copiar) -->
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="imprimir"
                class="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition"
                title="Imprimir mensaje"
              >
                <Printer class="w-4 h-4" />
              </button>
              <span class="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                {{ formatDate(mensajeSeleccionado.fecha) }}
              </span>
            </div>
          </div>

          <!-- Cabecera del Mensaje -->
          <div class="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800/70 bg-zinc-50/60 dark:bg-zinc-950/40 shrink-0 space-y-3.5">
            <div class="flex items-start justify-between gap-4">
              <h2 class="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-snug tracking-tight">
                {{ mensajeSeleccionado.asunto }}
              </h2>
              <button
                type="button"
                @click="copiarAsunto(mensajeSeleccionado.asunto)"
                class="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition shrink-0"
                title="Copiar asunto"
              >
                <Copy class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Fila del Remitente con Avatar y Destinatarios -->
            <div class="flex items-start justify-between gap-4 flex-wrap">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                  {{ (mensajeSeleccionado.de.nombre || mensajeSeleccionado.de.correo).substring(0, 2).toUpperCase() }}
                </div>
                <div class="space-y-0.5 min-w-0">
                  <div class="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {{ mensajeSeleccionado.de.nombre }}
                    <span class="font-normal text-zinc-500 dark:text-zinc-400 text-[11px] ml-1">&lt;{{ mensajeSeleccionado.de.correo }}&gt;</span>
                  </div>
                  <div class="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    Para: <span class="text-zinc-700 dark:text-zinc-300 font-medium">{{ mensajeSeleccionado.para.map(p => p.nombre || p.correo).join(', ') }}</span>
                  </div>
                </div>
              </div>

              <!-- Badges de Seguridad & Cliente CRM -->
              <div class="flex items-center gap-2 shrink-0">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck class="w-3 h-3" />
                  <span>Cifrado SSL</span>
                </span>

                <span
                  v-if="mensajeSeleccionado.clienteNombreRelacionado"
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 flex items-center gap-1.5"
                >
                  <Building2 class="w-3 h-3" />
                  <span>{{ mensajeSeleccionado.clienteNombreRelacionado }}</span>
                </span>
              </div>
            </div>

            <!-- Adjuntos Interactivos -->
            <div v-if="mensajeSeleccionado.adjuntos && mensajeSeleccionado.adjuntos.length > 0" class="pt-2">
              <div class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1">
                <Paperclip class="w-3 h-3" />
                <span>{{ mensajeSeleccionado.adjuntos.length }} Archivos Adjuntos:</span>
              </div>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="att in mensajeSeleccionado.adjuntos"
                  :key="att.id"
                  @click="descargarAdjunto(att)"
                  class="inline-flex items-center gap-2.5 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-500/60 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 transition cursor-pointer shadow-sm group"
                >
                  <component :is="obtenerIconoAdjunto(att.nombre)" class="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition" />
                  <div class="min-w-0">
                    <span class="font-medium truncate max-w-[180px] block">{{ att.nombre }}</span>
                    <span class="text-[10px] text-zinc-400 font-mono block">({{ Math.round(att.tamanoBytes / 1024) }} KB)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Cuerpo Scrolleable del Mensaje -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <div class="bg-zinc-50/70 dark:bg-zinc-950/60 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-inner overflow-hidden text-zinc-900 dark:text-zinc-100">
              <EmailViewer
                :html="mensajeSeleccionado.cuerpoHtml"
                :texto="mensajeSeleccionado.cuerpoTexto"
              />
            </div>

            <!-- CAJA DE RESPUESTA RÁPIDA INTEGRADA -->
            <div class="border-t border-zinc-200 dark:border-zinc-800 pt-5 space-y-3.5">
              <div class="flex items-center justify-between">
                <div class="text-xs font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-2">
                  <Reply class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Respuesta rápida para {{ mensajeSeleccionado.de.nombre || mensajeSeleccionado.de.correo }}</span>
                </div>

                <div class="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <label class="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" v-model="incluirFirmaEnRespuesta" class="rounded bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-0" />
                    <span>Firma oficial</span>
                  </label>
                  <label class="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" v-model="incluirPieEnRespuesta" class="rounded bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-0" />
                    <span>Pie legal</span>
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
                class="p-3.5 rounded-xl border text-xs flex items-center gap-2"
                :class="feedbackRespuesta.exito ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300'"
              >
                <CheckCircle2 v-if="feedbackRespuesta.exito" class="w-4 h-4 text-emerald-500 shrink-0" />
                <AlertCircle v-else class="w-4 h-4 text-rose-500 shrink-0" />
                <span>{{ feedbackRespuesta.mensaje }}</span>
              </div>

              <!-- Textarea de respuesta -->
              <textarea
                ref="replyInputRef"
                v-model="respuestaCuerpo"
                rows="4"
                :placeholder="`Escribe tu respuesta ejecutiva para ${mensajeSeleccionado.de.nombre}...`"
                class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed font-sans transition"
              ></textarea>

              <div class="flex items-center justify-between">
                <span class="text-[11px] text-zinc-400">
                  La respuesta se enviará vía SMTP certificado y se registrará automáticamente en la carpeta de Enviados.
                </span>

                <button
                  type="button"
                  @click="enviarRespuesta"
                  :disabled="enviandoRespuesta || !respuestaCuerpo.trim()"
                  class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition flex items-center gap-2 shadow-sm shadow-indigo-950/20 disabled:opacity-40"
                >
                  <Loader2 v-if="enviandoRespuesta" class="w-3.5 h-3.5 animate-spin" />
                  <Send v-else class="w-3.5 h-3.5" />
                  <span>{{ enviandoRespuesta ? 'Despachando...' : 'Enviar Respuesta' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Redactar Correo -->
    <RedactarCorreoModal
      :abierto="modalRedactarAbierto"
      :destinatario-inicial="redactarDestinatario"
      :asunto-inicial="redactarAsunto"
      :cuerpo-inicial="redactarCuerpo"
      @cerrar="modalRedactarAbierto = false"
      @enviado="() => { cargarCarpetas(); cargarMensajes(); }"
    />
  </div>
</template>
