<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { whatsAppChatService } from '../services/whatsapp-chat.service';
import { whatsAppService } from '../services/whatsapp.service';
import { clienteService } from '@/modules/clientes/services/cliente.service';
import type { Cliente } from '@/modules/clientes/types/cliente.types';
import type { ChatWhatsApp } from '../types/whatsapp-chat.types';
import ModalConexionWhatsApp from '../components/ModalConexionWhatsApp.vue';
import {
  MessageSquare,
  Search,
  Send,
  Plus,
  QrCode,
  Check,
  CheckCheck,
  Building2,
  FileText,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  X,
  Paperclip,
  Image as ImageIcon,
  Download,
  Eye,
} from 'lucide-vue-next';
import { formatRelativeTime } from '@/core/formatters/formatters';

const busqueda = ref('');
const filtroNoLeidos = ref(false);
const textoNuevoMensaje = ref('');
const modalConexionAbierto = ref(false);
const modalNuevoChatAbierto = ref(false);
const clientes = ref<Cliente[]>([]);
const clienteSeleccionadoId = ref('');
const telefonoManual = ref('');
const nombreManual = ref('');
const contenedorMensajes = ref<HTMLDivElement | null>(null);

// Adjuntos y Multimedia
const inputArchivo = ref<HTMLInputElement | null>(null);
const archivoAdjunto = ref<File | null>(null);
const archivoPreviewUrl = ref<string | null>(null);
const modalImagenVistaPrevia = ref<string | null>(null);

const chats = computed(() => whatsAppChatService.chats.value);
const chatActivo = computed(() => whatsAppChatService.chatActivo.value);
const mensajes = computed(() => whatsAppChatService.mensajes.value);
const cargandoChats = computed(() => whatsAppChatService.cargandoChats.value);
const enviando = computed(() => whatsAppChatService.enviando.value);
const conectado = computed(() => whatsAppService.conectado.value);

// Respuestas rápidas comerciales B2B
const respuestasRapidas = [
  '¡Hola! Un gusto saludarle. ¿En qué podemos apoyarle hoy?',
  'Le confirmo que recibimos su solicitud y la estamos procesando.',
  'Le acabo de remitir la cotización comercial formal con los precios acordados.',
  'Muchas gracias por la confirmación, procedemos con la orden.',
];

// Filtrar conversaciones
const chatsFiltrados = computed(() => {
  let resultado = chats.value;
  if (filtroNoLeidos.value) {
    resultado = resultado.filter((c) => (c.noLeidos || 0) > 0);
  }
  if (busqueda.value.trim()) {
    const q = busqueda.value.toLowerCase().trim();
    resultado = resultado.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.telefono.includes(q) ||
        (c.contacto && c.contacto.toLowerCase().includes(q)) ||
        (c.ultimoMensaje && c.ultimoMensaje.toLowerCase().includes(q))
    );
  }
  return resultado;
});

// Detectar si el chat activo corresponde a un cliente del CRM
const clienteDelChat = computed<Cliente | null>(() => {
  if (!chatActivo.value) return null;
  const telLimpio = chatActivo.value.telefono.replace(/\D/g, '');
  if (!telLimpio) return null;

  return (
    clientes.value.find((cl) => {
      const clTel = (cl.telefono || '').replace(/\D/g, '');
      return (
        (clTel && (clTel.endsWith(telLimpio) || telLimpio.endsWith(clTel))) ||
        (cl.nombre_comercial && cl.nombre_comercial.toLowerCase() === chatActivo.value?.nombre.toLowerCase()) ||
        cl.razon_social.toLowerCase() === chatActivo.value?.nombre.toLowerCase()
      );
    }) || null
  );
});

const seleccionarConversacion = async (chat: ChatWhatsApp) => {
  await whatsAppChatService.seleccionarChat(chat);
  hacerScrollAbajo();
};

const activarSelectorArchivos = () => {
  inputArchivo.value?.click();
};

const manejarArchivoSeleccionado = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  const file = target.files[0];
  archivoAdjunto.value = file;

  if (file.type.startsWith('image/')) {
    archivoPreviewUrl.value = URL.createObjectURL(file);
  } else {
    archivoPreviewUrl.value = null;
  }
  target.value = '';
};

const manejarSoltarArchivo = (e: DragEvent) => {
  if (!e.dataTransfer?.files || e.dataTransfer.files.length === 0) return;
  const file = e.dataTransfer.files[0];
  archivoAdjunto.value = file;

  if (file.type.startsWith('image/')) {
    archivoPreviewUrl.value = URL.createObjectURL(file);
  } else {
    archivoPreviewUrl.value = null;
  }
};

const cancelarArchivoAdjunto = () => {
  if (archivoPreviewUrl.value && archivoPreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(archivoPreviewUrl.value);
  }
  archivoAdjunto.value = null;
  archivoPreviewUrl.value = null;
};

const formatearTamanoArchivo = (bytes: number): string => {
  if (bytes > 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.round(bytes / 1024)} KB`;
};

const obtenerUrlMedia = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  const baseUrl = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
    : 'http://localhost:3002';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const abrirImagenModal = (url: string) => {
  modalImagenVistaPrevia.value = url;
};

const cerrarImagenModal = () => {
  modalImagenVistaPrevia.value = null;
};

const enviarMensaje = async () => {
  if (enviando.value) return;

  // Si hay un archivo adjunto pendiente de envío
  if (archivoAdjunto.value) {
    const file = archivoAdjunto.value;
    const caption = textoNuevoMensaje.value.trim();
    cancelarArchivoAdjunto();
    textoNuevoMensaje.value = '';

    const exito = await whatsAppChatService.enviarArchivo(file, caption);
    if (exito) {
      hacerScrollAbajo();
    }
    return;
  }

  // Envío tradicional de texto
  if (!textoNuevoMensaje.value.trim()) return;
  const texto = textoNuevoMensaje.value;
  textoNuevoMensaje.value = '';

  const exito = await whatsAppChatService.enviarMensaje(texto);
  if (exito) {
    hacerScrollAbajo();
  } else {
    textoNuevoMensaje.value = texto; // restaurar si falló
  }
};

const usarRespuestaRapida = (frase: string) => {
  textoNuevoMensaje.value = frase;
};

const hacerScrollAbajo = () => {
  nextTick(() => {
    if (contenedorMensajes.value) {
      contenedorMensajes.value.scrollTop = contenedorMensajes.value.scrollHeight;
    }
  });
};

watch(
  () => mensajes.value.length,
  () => {
    hacerScrollAbajo();
  }
);

const formatearHoraMensaje = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const iniciarChatConClienteSeleccionado = async () => {
  let tel = telefonoManual.value.trim();
  let nom = nombreManual.value.trim();
  let con = '';

  if (clienteSeleccionadoId.value) {
    const cl = clientes.value.find((c) => c.id === clienteSeleccionadoId.value);
    if (cl) {
      tel = cl.telefono || tel;
      nom = cl.nombre_comercial || cl.razon_social;
      con = cl.contactos?.[0]?.nombre || '';
    }
  }

  if (!tel) return;

  const chat = await whatsAppChatService.iniciarNuevoChat(tel, nom, con);
  if (chat) {
    modalNuevoChatAbierto.value = false;
    clienteSeleccionadoId.value = '';
    telefonoManual.value = '';
    nombreManual.value = '';
  }
};

onMounted(async () => {
  whatsAppService.consultarEstado();
  whatsAppChatService.conectarSSE();
  await whatsAppChatService.cargarChats();

  // Seleccionar primera conversación si existe
  if (chats.value.length > 0 && !chatActivo.value) {
    await whatsAppChatService.seleccionarChat(chats.value[0]);
    hacerScrollAbajo();
  }

  // Cargar cartera de clientes para vinculación automática
  try {
    const resp = await clienteService.obtenerClientes({ pagina: 1, tamanoPagina: 100, busqueda: '' });
    clientes.value = resp?.datos || [];
  } catch (err) {
    console.warn('Error cargando clientes:', err);
  }
});

onUnmounted(() => {
  whatsAppChatService.desconectarSSE();
});
</script>

<template>
  <div class="h-[calc(100vh-4rem)] flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden">
    <!-- BARRA SUPERIOR DE ESTADO Y ACCIONES -->
    <header class="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 px-4 flex items-center justify-between shrink-0 backdrop-blur-sm">
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <MessageSquare class="w-5 h-5" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              WhatsApp CRM & Mensajería B2B
            </h1>
            <span
              v-if="conectado"
              class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              WhatsApp Web Conectado
            </span>
            <span
              v-else
              class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Bridge en Espera de Vinculación
            </span>
          </div>
          <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
            Canal directo para cotizaciones, seguimiento a clientes y acuerdos comerciales
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="modalNuevoChatAbierto = true"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-medium shadow-sm transition"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Nuevo Chat</span>
        </button>

        <button
          type="button"
          @click="modalConexionAbierto = true"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm transition"
        >
          <QrCode class="w-3.5 h-3.5" />
          <span>{{ conectado ? 'Gestionar Conexión' : 'Vincular Teléfono' }}</span>
        </button>
      </div>
    </header>

    <!-- CUERPO PRINCIPAL: 3 COLUMNAS -->
    <div class="flex-1 flex overflow-hidden">
      <!-- COLUMNA 1: LISTA DE CHATS -->
      <aside class="w-80 md:w-88 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col shrink-0">
        <!-- Buscador y Filtros -->
        <div class="p-3 border-b border-zinc-200 dark:border-zinc-800 space-y-2">
          <div class="relative">
            <Search class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              v-model="busqueda"
              type="text"
              placeholder="Buscar por cliente o teléfono..."
              class="w-full pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div class="flex items-center gap-1.5 text-[11px]">
            <button
              type="button"
              @click="filtroNoLeidos = false"
              :class="[
                'px-2.5 py-1 rounded-md font-medium transition',
                !filtroNoLeidos
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              ]"
            >
              Todos ({{ chats.length }})
            </button>
            <button
              type="button"
              @click="filtroNoLeidos = true"
              :class="[
                'px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1',
                filtroNoLeidos
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              ]"
            >
              <span>No leídos</span>
              <span
                v-if="whatsAppChatService.totalNoLeidos.value > 0"
                class="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white font-bold"
              >
                {{ whatsAppChatService.totalNoLeidos.value }}
              </span>
            </button>
          </div>
        </div>

        <!-- Lista de Conversaciones -->
        <div class="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
          <div
            v-if="cargandoChats && chats.length === 0"
            class="p-8 text-center text-xs text-zinc-400"
          >
            <RefreshCw class="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
            Cargando conversaciones...
          </div>

          <div
            v-else-if="chatsFiltrados.length === 0"
            class="p-8 text-center text-xs text-zinc-500"
          >
            No se encontraron conversaciones.
          </div>

          <button
            v-for="c in chatsFiltrados"
            :key="c.jid"
            type="button"
            @click="seleccionarConversacion(c)"
            :class="[
              'w-full text-left p-3.5 flex items-start gap-3 transition relative border-l-2',
              chatActivo?.jid === c.jid
                ? 'bg-zinc-100 dark:bg-zinc-800/70 border-emerald-500'
                : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
            ]"
          >
            <!-- Avatar -->
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-xs text-emerald-700 dark:text-emerald-300 shrink-0">
              {{ c.avatar || 'WA' }}
            </div>

            <!-- Detalles del chat -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1 mb-0.5">
                <span class="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                  {{ c.nombre }}
                </span>
                <span class="text-[10px] text-zinc-400 font-mono shrink-0">
                  {{ formatRelativeTime(c.ultimoTimestamp) }}
                </span>
              </div>

              <div class="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mb-1">
                {{ c.ultimoMensaje }}
              </div>

              <div class="flex items-center justify-between text-[10px]">
                <span class="text-zinc-400 font-mono">
                  {{ c.telefono }}
                </span>
                <span
                  v-if="(c.noLeidos || 0) > 0"
                  class="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500 text-white font-bold shrink-0"
                >
                  {{ c.noLeidos }}
                </span>
              </div>
            </div>
          </button>
        </div>
      </aside>

      <!-- COLUMNA 2: ÁREA DE CHAT ACTIVO -->
      <main
        class="flex-1 flex flex-col bg-zinc-100/60 dark:bg-zinc-950/80 overflow-hidden"
        @dragover.prevent
        @drop.prevent="manejarSoltarArchivo"
      >
        <template v-if="chatActivo">
          <!-- Cabecera del Chat Activo -->
          <div class="h-14 px-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between shrink-0 shadow-sm">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-xs text-emerald-700 dark:text-emerald-300">
                {{ chatActivo.avatar || 'WA' }}
              </div>
              <div>
                <div class="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>{{ chatActivo.nombre }}</span>
                  <span
                    v-if="clienteDelChat"
                    class="inline-flex items-center gap-1 font-mono text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                  >
                    <Building2 class="w-3 h-3" />
                    Cliente Cartera
                  </span>
                </div>
                <div class="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2 font-mono">
                  <span>{{ chatActivo.telefono }}</span>
                  <span v-if="chatActivo.contacto">• {{ chatActivo.contacto }}</span>
                </div>
              </div>
            </div>

            <!-- Botones de Acción Comercial -->
            <div class="flex items-center gap-2">
              <router-link
                v-if="clienteDelChat"
                :to="{ path: '/clientes', query: { buscar: clienteDelChat.identificacion_fiscal || clienteDelChat.codigo } }"
                class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
              >
                <Building2 class="w-3.5 h-3.5 text-zinc-400" />
                <span>Ver Cliente</span>
              </router-link>

              <router-link
                to="/catalogo"
                class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition font-medium"
              >
                <FileText class="w-3.5 h-3.5" />
                <span>Generar Cotización PDF</span>
              </router-link>
            </div>
          </div>

          <!-- Historial de Mensajes -->
          <div
            ref="contenedorMensajes"
            class="flex-1 overflow-y-auto p-4 space-y-3"
          >
            <!-- Banner de Encriptación / Canal Oficial -->
            <div class="text-center my-2">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-200/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                <ShieldCheck class="w-3 h-3 text-emerald-500" />
                Mensajes sincronizados con WhatsApp Web & Protocolo Baileys
              </span>
            </div>

            <!-- Burbujas de Mensaje -->
            <div
              v-for="m in mensajes"
              :key="m.id"
              :class="[
                'flex flex-col max-w-[78%] md:max-w-[65%]',
                m.deMi ? 'ml-auto items-end' : 'mr-auto items-start'
              ]"
            >
              <div
                :class="[
                  'rounded-2xl px-4 py-2.5 text-xs shadow-sm transition',
                  m.deMi
                    ? 'bg-emerald-600 text-white dark:bg-emerald-700 rounded-br-none'
                    : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700/60 rounded-bl-none'
                ]"
              >
                <!-- Nombre del Emisor si es grupo o cliente -->
                <div
                  v-if="!m.deMi"
                  class="font-semibold text-[10px] text-emerald-600 dark:text-emerald-400 mb-0.5"
                >
                  {{ m.emisor }}
                </div>

                <!-- Mensaje tipo documento -->
                <div v-if="m.tipo === 'documento'" class="flex items-center gap-3 p-2 bg-black/10 rounded-lg my-1">
                  <FileText class="w-6 h-6 text-white shrink-0" />
                  <div class="min-w-0">
                    <div class="font-medium truncate">{{ m.archivoNombre || 'Documento Comercial.pdf' }}</div>
                    <div class="text-[10px] opacity-80">Documento Adjunto</div>
                  </div>
                </div>

                <!-- Texto del mensaje -->
                <p class="whitespace-pre-wrap leading-relaxed select-text">{{ m.texto }}</p>

                <!-- Pie de la burbuja: hora y estado -->
                <div
                  :class="[
                    'flex items-center justify-end gap-1 text-[9px] mt-1 font-mono',
                    m.deMi ? 'text-emerald-100 dark:text-emerald-200' : 'text-zinc-400 dark:text-zinc-400'
                  ]"
                >
                  <span>{{ formatearHoraMensaje(m.timestamp) }}</span>
                  <template v-if="m.deMi">
                    <CheckCheck v-if="m.estado === 'leido'" class="w-3 h-3 text-cyan-200" />
                    <CheckCheck v-else-if="m.estado === 'entregado'" class="w-3 h-3 text-white/80" />
                    <Check v-else class="w-3 h-3 text-white/70" />
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- Respuestas Rápidas Flotantes -->
          <div class="px-4 py-1.5 bg-white/70 dark:bg-zinc-900/70 border-t border-zinc-200/70 dark:border-zinc-800/70 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span class="text-zinc-400 text-[10px] font-mono shrink-0 flex items-center gap-1">
              <Sparkles class="w-3 h-3 text-amber-500" />
              Rápidas:
            </span>
            <button
              v-for="(frase, idx) in respuestasRapidas"
              :key="idx"
              type="button"
              @click="usarRespuestaRapida(frase)"
              class="px-2.5 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 shrink-0 transition text-[10px]"
            >
              {{ frase.slice(0, 32) }}...
            </button>
          </div>

          <!-- Barra de Redacción de Mensaje -->
          <div class="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
            <input
              v-model="textoNuevoMensaje"
              @keydown.enter.prevent="enviarMensaje"
              type="text"
              placeholder="Escribe un mensaje de WhatsApp... (Enter para enviar)"
              class="flex-1 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />

            <button
              type="button"
              @click="enviarMensaje"
              :disabled="!textoNuevoMensaje.trim() || enviando"
              class="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white shadow-sm transition shrink-0 flex items-center justify-center"
            >
              <Send class="w-4 h-4" />
            </button>
          </div>
        </template>

        <!-- Estado vacío si no hay chat seleccionado -->
        <div v-else class="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400">
          <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <MessageSquare class="w-8 h-8" />
          </div>
          <h3 class="font-bold text-sm text-zinc-800 dark:text-zinc-200 mb-1">
            Selecciona una conversación de WhatsApp
          </h3>
          <p class="text-xs text-zinc-500 max-w-sm">
            Elige un contacto del panel izquierdo o inicia un nuevo chat con cualquier cliente de la cartera.
          </p>
        </div>
      </main>

      <!-- COLUMNA 3: FICHA DE CLIENTE ASOCIADA (DRAWER LATERAL) -->
      <aside
        v-if="chatActivo && clienteDelChat"
        class="w-72 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col text-xs shrink-0 hidden lg:flex"
      >
        <div class="flex items-center gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-4">
          <Building2 class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span class="font-bold text-zinc-900 dark:text-zinc-100">Ficha del Cliente</span>
        </div>

        <div class="space-y-4 flex-1 overflow-y-auto">
          <div>
            <div class="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              {{ clienteDelChat.nombre_comercial || clienteDelChat.razon_social }}
            </div>
            <div class="text-[11px] text-zinc-500 font-mono">{{ clienteDelChat.razon_social }}</div>
          </div>

          <div class="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div>
              <span class="text-[10px] text-zinc-400 block">RNC / Identificación</span>
              <span class="font-mono font-medium">{{ clienteDelChat.identificacion_fiscal || '—' }}</span>
            </div>
            <div>
              <span class="text-[10px] text-zinc-400 block">Sector Económico</span>
              <span class="font-medium capitalize">{{ clienteDelChat.sector || 'Comercio B2B' }}</span>
            </div>
            <div>
              <span class="text-[10px] text-zinc-400 block">Contacto Registrado</span>
              <span class="font-medium">{{ clienteDelChat.contactos?.[0]?.nombre || 'No especificado' }}</span>
            </div>
            <div>
              <span class="text-[10px] text-zinc-400 block">Ejecutivo Asignado</span>
              <span class="font-medium">{{ clienteDelChat.responsable || 'Luis M. Taveras' }}</span>
            </div>
          </div>

          <!-- Acciones directas con el cliente -->
          <div class="space-y-2 pt-2">
            <router-link
              :to="{ path: '/pipeline' }"
              class="w-full flex items-center justify-between p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition font-medium text-zinc-700 dark:text-zinc-300"
            >
              <span>Crear Oportunidad Kanban</span>
              <ChevronRight class="w-4 h-4 text-zinc-400" />
            </router-link>

            <router-link
              :to="{ path: '/agenda' }"
              class="w-full flex items-center justify-between p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition font-medium text-zinc-700 dark:text-zinc-300"
            >
              <span>Agendar Reunión o Tarea</span>
              <ChevronRight class="w-4 h-4 text-zinc-400" />
            </router-link>
          </div>
        </div>
      </aside>
    </div>

    <!-- MODAL NUEVO CHAT -->
    <div
      v-if="modalNuevoChatAbierto"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm"
      @click.self="modalNuevoChatAbierto = false"
    >
      <div class="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xl text-xs space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div class="flex items-center gap-2">
            <div class="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <MessageSquare class="w-4 h-4" />
            </div>
            <h3 class="font-bold text-sm text-zinc-900 dark:text-zinc-100">Iniciar Nueva Conversación</h3>
          </div>
          <button
            type="button"
            @click="modalNuevoChatAbierto = false"
            class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Opción 1: Seleccionar Cliente de Cartera -->
        <div class="space-y-1.5">
          <label class="block font-medium text-zinc-700 dark:text-zinc-300">
            Seleccionar de la Cartera de Clientes
          </label>
          <select
            v-model="clienteSeleccionadoId"
            class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
          >
            <option value="">-- O seleccionar de la lista --</option>
            <option v-for="cl in clientes" :key="cl.id" :value="cl.id">
              {{ cl.nombre_comercial || cl.razon_social }} ({{ cl.telefono || 'Sin teléfono' }})
            </option>
          </select>
        </div>

        <div class="flex items-center gap-2 text-zinc-400 text-[10px]">
          <div class="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
          <span>O ingresar número manualmente</span>
          <div class="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
        </div>

        <!-- Opción 2: Ingresar Teléfono Manual -->
        <div class="space-y-3">
          <div>
            <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Número Telefónico (con código de país)
            </label>
            <input
              v-model="telefonoManual"
              type="tel"
              placeholder="+1 (809) 000-0000"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Nombre de la Empresa o Contacto (Opcional)
            </label>
            <input
              v-model="nombreManual"
              type="text"
              placeholder="Ej. Distribuidora del Caribe"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            @click="modalNuevoChatAbierto = false"
            class="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="iniciarChatConClienteSeleccionado"
            :disabled="!clienteSeleccionadoId && !telefonoManual.trim()"
            class="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-medium shadow-sm transition"
          >
            Iniciar Conversación
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL DE VINCULACIÓN WHATSAPP (QR / PAIRING CODE) -->
    <ModalConexionWhatsApp
      :abierto="modalConexionAbierto"
      @cerrar="modalConexionAbierto = false"
    />
  </div>
</template>
