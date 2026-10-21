<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { whatsAppChatService } from '../services/whatsapp-chat.service';
import { whatsAppService } from '../services/whatsapp.service';
import { clienteService } from '@/modules/clientes/services/cliente.service';
import type { Cliente } from '@/modules/clientes/types/cliente.types';
import type {
  ChatWhatsApp,
  MensajeWhatsApp,
  MensajeCitado,
  RespuestaRapida,
  DefinicionEtiqueta,
} from '../types/whatsapp-chat.types';
import ModalConexionWhatsApp from '../components/ModalConexionWhatsApp.vue';
import ReproductorNotaVoz from '../components/ReproductorNotaVoz.vue';
import GrabadorNotaVoz from '../components/GrabadorNotaVoz.vue';
import ModalCrearTratoWhatsApp from '../components/ModalCrearTratoWhatsApp.vue';
import ModalAgendarSeguimientoWhatsApp from '../components/ModalAgendarSeguimientoWhatsApp.vue';
import { asistenteIaService, type IntencionComercial } from '../services/asistente-ia.service';
import { toastService } from '@/core/notifications/toast.service';
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
  CornerUpLeft,
  Copy,
  ChevronUp,
  ChevronDown,
  Bot,
  Mic,
  Tag,
  Lock,
  Calendar,
  Kanban,
} from 'lucide-vue-next';
import { formatRelativeTime } from '@/core/formatters/formatters';

const busqueda = ref('');
const filtroNoLeidos = ref(false);
const etiquetaFiltroActiva = ref<string>('todas');
const textoNuevoMensaje = ref('');
const modalConexionAbierto = ref(false);
const modalNuevoChatAbierto = ref(false);
const modalTratoAbierto = ref(false);
const modalSeguimientoAbierto = ref(false);
const menuEtiquetasAbierto = ref(false);
const clientes = ref<Cliente[]>([]);
const clienteSeleccionadoId = ref('');
const telefonoManual = ref('');
const nombreManual = ref('');
const contenedorMensajes = ref<HTMLDivElement | null>(null);
const inputBusquedaChat = ref<HTMLInputElement | null>(null);

// Grabación de voz en vivo
const grabadorAudioAbierto = ref(false);

// Modo Nota Interna privada vs Mensaje normal
const modoNotaInterna = ref(false);

// Búsqueda en conversación activa
const busquedaChatActivo = ref('');
const barraBusquedaAbierta = ref(false);
const indiceCoincidenciaActual = ref(0);

// Citas y respuestas a mensajes
const mensajeRespondido = ref<MensajeWhatsApp | null>(null);

// Asistente IA de respuestas
const menuIaAbierto = ref(false);

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

// Catálogo de etiquetas comerciales B2B
const CATALOGO_ETIQUETAS: DefinicionEtiqueta[] = [
  { id: 'vip', nombre: 'VIP', colorClase: 'text-amber-700 dark:text-amber-400', bgClase: 'bg-amber-500/10 border-amber-500/30' },
  { id: 'cotizado', nombre: 'Cotizado', colorClase: 'text-sky-700 dark:text-sky-400', bgClase: 'bg-sky-500/10 border-sky-500/30' },
  { id: 'negociacion', nombre: 'En Negociación', colorClase: 'text-indigo-700 dark:text-indigo-400', bgClase: 'bg-indigo-500/10 border-indigo-500/30' },
  { id: 'pago_pendiente', nombre: 'Pago Pendiente', colorClase: 'text-rose-700 dark:text-rose-400', bgClase: 'bg-rose-500/10 border-rose-500/30' },
  { id: 'cerrado', nombre: 'Cerrado Ganado', colorClase: 'text-emerald-700 dark:text-emerald-400', bgClase: 'bg-emerald-500/10 border-emerald-500/30' },
];

// Catálogo de respuestas rápidas con comando /
const CATALOGO_RESPUESTAS_RAPIDAS: RespuestaRapida[] = [
  {
    comando: '/banco',
    titulo: 'Datos Bancarios Oficiales',
    texto: 'Nuestros datos bancarios oficiales para transferencias son: Banco BHD, Cuenta Corriente: 0123-4567-89, RNC: 1-30-12345-6 a nombre de DEVFORGE SRL.',
    categoria: 'operativa',
  },
  {
    comando: '/horario',
    titulo: 'Horario de Atención Comercial',
    texto: 'Nuestro horario comercial es de Lunes a Viernes de 8:30 AM a 6:00 PM. Estamos a su completa disposición.',
    categoria: 'operativa',
  },
  {
    comando: '/cotizacion',
    titulo: 'Envío de Cotización Formal',
    texto: 'Estimado/a {{nombre}}, le comparto los términos comerciales de la cotización acordada. Quedo atento a su visto bueno para formalizar.',
    categoria: 'comercial',
  },
  {
    comando: '/gracias',
    titulo: 'Agradecimiento por su Confianza',
    texto: '¡Muchas gracias por su preferencia {{nombre}}! Ha sido un placer atenderle. Seguimos a sus órdenes para cualquier requerimiento.',
    categoria: 'cierre',
  },
  {
    comando: '/reunion',
    titulo: 'Coordinar Videollamada / Reunión',
    texto: 'Hola {{nombre}}, ¿le convendría una breve videollamada de 15 minutos hoy o mañana para revisar los detalles técnicos?',
    categoria: 'comercial',
  },
  {
    comando: '/factura',
    titulo: 'Solicitud de Datos Fiscales B01',
    texto: 'Para emitir su comprobante fiscal con valor (NCF B01), favor remitirnos su RNC o Cédula, Razón Social y dirección comercial.',
    categoria: 'operativa',
  },
];

const mostrarMenuComandos = computed(() => {
  return textoNuevoMensaje.value.startsWith('/');
});

const comandosFiltrados = computed(() => {
  if (!textoNuevoMensaje.value.startsWith('/')) return [];
  const q = textoNuevoMensaje.value.slice(1).toLowerCase().trim();
  if (!q) return CATALOGO_RESPUESTAS_RAPIDAS;
  return CATALOGO_RESPUESTAS_RAPIDAS.filter(
    (c) => c.comando.slice(1).includes(q) || c.titulo.toLowerCase().includes(q)
  );
});

const seleccionarComando = (item: RespuestaRapida) => {
  const nombreCliente = chatActivo.value?.contacto || chatActivo.value?.nombre || 'Estimado/a';
  const textoProcesado = item.texto.replace(/{{nombre}}/g, nombreCliente);
  textoNuevoMensaje.value = textoProcesado;
};

// Filtrar conversaciones por texto, estado no leído y etiquetas
const chatsFiltrados = computed(() => {
  let resultado = chats.value;
  if (filtroNoLeidos.value) {
    resultado = resultado.filter((c) => (c.noLeidos || 0) > 0);
  }
  if (etiquetaFiltroActiva.value !== 'todas') {
    resultado = resultado.filter((c) => c.etiquetas?.includes(etiquetaFiltroActiva.value));
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
  menuEtiquetasAbierto.value = false;
  grabadorAudioAbierto.value = false;
  modoNotaInterna.value = false;
  await whatsAppChatService.seleccionarChat(chat);
  hacerScrollAbajo();
};

const alternarEtiquetaChat = async (tagId: string) => {
  if (!chatActivo.value) return;
  const actuales = chatActivo.value.etiquetas || [];
  let nuevas: string[];
  if (actuales.includes(tagId)) {
    nuevas = actuales.filter((t) => t !== tagId);
  } else {
    nuevas = [...actuales, tagId];
  }
  await whatsAppChatService.actualizarEtiquetas(chatActivo.value.jid, nuevas);
};

const obtenerEtiquetaDefinicion = (tagId: string): DefinicionEtiqueta | undefined => {
  return CATALOGO_ETIQUETAS.find((t) => t.id === tagId);
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

const manejarAudioGrabado = async (archivo: File) => {
  grabadorAudioAbierto.value = false;
  const exito = await whatsAppChatService.enviarArchivo(archivo);
  if (exito) {
    hacerScrollAbajo();
  }
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

const formatearTextoWhatsApp = (texto?: string): string => {
  if (!texto) return '';
  let safe = texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // Enlaces web clicables
  safe = safe.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2 hover:opacity-80 break-all font-semibold">$1</a>'
  );

  // Formato WhatsApp
  safe = safe.replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>');
  safe = safe.replace(/_([^_\n]+)_/g, '<em>$1</em>');
  safe = safe.replace(/~([^~\n]+)~/g, '<del class="opacity-75">$1</del>');
  safe = safe.replace(/```([^`]+)```/g, '<code class="px-1.5 py-0.5 rounded bg-black/15 dark:bg-white/15 font-mono text-[11px]">$1</code>');

  return safe;
};

const esPrimerMensajeDelDia = (indice: number): boolean => {
  if (indice === 0) return true;
  const msgActual = mensajes.value[indice];
  const msgAnterior = mensajes.value[indice - 1];
  if (!msgActual?.timestamp || !msgAnterior?.timestamp) return false;

  const dActual = new Date(msgActual.timestamp).toDateString();
  const dAnterior = new Date(msgAnterior.timestamp).toDateString();
  return dActual !== dAnterior;
};

const formatearEtiquetaFecha = (iso: string): string => {
  try {
    const fecha = new Date(iso);
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);

    if (fecha.toDateString() === hoy.toDateString()) {
      return 'Hoy';
    }
    if (fecha.toDateString() === ayer.toDateString()) {
      return 'Ayer';
    }

    const opciones: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: fecha.getFullYear() !== hoy.getFullYear() ? 'numeric' : undefined,
    };
    const formateada = fecha.toLocaleDateString('es-DO', opciones);
    return formateada.charAt(0).toUpperCase() + formateada.slice(1);
  } catch {
    return 'Fecha anterior';
  }
};

const copiarTextoMensaje = async (texto?: string) => {
  if (!texto) return;
  try {
    await navigator.clipboard.writeText(texto);
    toastService.exito('Mensaje copiado al portapapeles');
  } catch {
    toastService.advertencia('No se pudo acceder al portapapeles');
  }
};

const iniciarRespuesta = (m: MensajeWhatsApp) => {
  mensajeRespondido.value = m;
};

const cancelarRespuesta = () => {
  mensajeRespondido.value = null;
};

const irAMensajePorId = (id?: string) => {
  if (!id) return;
  const el = document.getElementById(`msg-${id}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('ring-2', 'ring-emerald-400');
    setTimeout(() => {
      el.classList.remove('ring-2', 'ring-emerald-400');
    }, 2000);
  }
};

// Búsqueda dentro del chat activo
const coincidenciasBusqueda = computed(() => {
  if (!busquedaChatActivo.value.trim()) return [];
  const query = busquedaChatActivo.value.toLowerCase().trim();
  const indices: number[] = [];
  mensajes.value.forEach((m, idx) => {
    const texto = (m.texto || '').toLowerCase();
    const nombre = (m.archivoNombre || '').toLowerCase();
    if (texto.includes(query) || nombre.includes(query)) {
      indices.push(idx);
    }
  });
  return indices;
});

const alternarBarraBusqueda = () => {
  barraBusquedaAbierta.value = !barraBusquedaAbierta.value;
  if (barraBusquedaAbierta.value) {
    nextTick(() => {
      inputBusquedaChat.value?.focus();
    });
  } else {
    busquedaChatActivo.value = '';
  }
};

const siguienteCoincidencia = () => {
  if (coincidenciasBusqueda.value.length === 0) return;
  indiceCoincidenciaActual.value =
    (indiceCoincidenciaActual.value + 1) % coincidenciasBusqueda.value.length;
  irAMensajePorIndice(coincidenciasBusqueda.value[indiceCoincidenciaActual.value]);
};

const anteriorCoincidencia = () => {
  if (coincidenciasBusqueda.value.length === 0) return;
  indiceCoincidenciaActual.value =
    (indiceCoincidenciaActual.value - 1 + coincidenciasBusqueda.value.length) %
    coincidenciasBusqueda.value.length;
  irAMensajePorIndice(coincidenciasBusqueda.value[indiceCoincidenciaActual.value]);
};

const irAMensajePorIndice = (idx: number) => {
  const m = mensajes.value[idx];
  if (m) {
    irAMensajePorId(m.id);
  }
};

// Sugerencias con IA
const generarSugerenciaIa = (tipo: 'seguimiento' | 'confirmacion' | 'cierre' | 'recordatorio') => {
  const nombre = chatActivo.value?.contacto || chatActivo.value?.nombre || 'Estimado cliente';
  const clienteNombre = clienteDelChat.value?.razon_social || chatActivo.value?.nombre || 'su empresa';

  const mapaIntenciones: Record<string, IntencionComercial> = {
    seguimiento: 'seguimiento_cotizacion',
    confirmacion: 'confirmacion_reunion',
    cierre: 'bienvenida_cierre',
    recordatorio: 'recordatorio_pago',
  };

  const textoGenerado = asistenteIaService.generarMensajeWhatsApp({
    intencion: mapaIntenciones[tipo] || 'seguimiento_cotizacion',
    clienteNombre,
    contactoNombre: nombre,
  });

  textoNuevoMensaje.value = textoGenerado;
  menuIaAbierto.value = false;
  toastService.exito('Respuesta sugerida con IA cargada en el editor');
};

const enviarMensaje = async () => {
  if (enviando.value) return;

  // Si está en modo Nota Interna
  if (modoNotaInterna.value) {
    if (!textoNuevoMensaje.value.trim() || !chatActivo.value) return;
    const texto = textoNuevoMensaje.value.trim();
    textoNuevoMensaje.value = '';

    const exito = await whatsAppChatService.guardarNotaInterna(
      chatActivo.value.jid,
      texto,
      'Equipo Comercial'
    );
    if (exito) {
      hacerScrollAbajo();
    } else {
      textoNuevoMensaje.value = texto;
    }
    return;
  }

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

  // Envío tradicional de texto (con soporte para cita/respuesta)
  if (!textoNuevoMensaje.value.trim()) return;
  const texto = textoNuevoMensaje.value;
  textoNuevoMensaje.value = '';

  let mensajeCitadoPayload: MensajeCitado | undefined = undefined;
  if (mensajeRespondido.value) {
    mensajeCitadoPayload = {
      id: mensajeRespondido.value.id,
      emisor: mensajeRespondido.value.emisor,
      texto: mensajeRespondido.value.texto || mensajeRespondido.value.archivoNombre || 'Archivo multimedia',
    };
    cancelarRespuesta();
  }

  const exito = await whatsAppChatService.enviarMensaje(texto, mensajeCitadoPayload);
  if (exito) {
    hacerScrollAbajo();
  } else {
    textoNuevoMensaje.value = texto;
  }
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
              v-else-if="whatsAppService.estado.value === 'conectando'"
              class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
              Restaurando Sesión...
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

          <!-- Chips de Filtro por Etiqueta Comercial -->
          <div class="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] scrollbar-none">
            <button
              type="button"
              @click="etiquetaFiltroActiva = 'todas'"
              :class="[
                'px-2 py-0.5 rounded-full shrink-0 font-medium transition',
                etiquetaFiltroActiva === 'todas'
                  ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              ]"
            >
              Todas
            </button>
            <button
              v-for="tag in CATALOGO_ETIQUETAS"
              :key="tag.id"
              type="button"
              @click="etiquetaFiltroActiva = tag.id"
              :class="[
                'px-2 py-0.5 rounded-full shrink-0 font-medium transition border',
                etiquetaFiltroActiva === tag.id
                  ? tag.bgClase + ' ' + tag.colorClase + ' font-bold'
                  : 'border-transparent bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              ]"
            >
              {{ tag.nombre }}
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

              <!-- Etiquetas del chat en miniatura -->
              <div v-if="c.etiquetas && c.etiquetas.length > 0" class="flex flex-wrap gap-1 mb-1.5">
                <span
                  v-for="tid in c.etiquetas"
                  :key="tid"
                  class="px-1.5 py-0.2 rounded-full text-[9px] font-medium border"
                  :class="obtenerEtiquetaDefinicion(tid)?.bgClase + ' ' + obtenerEtiquetaDefinicion(tid)?.colorClase"
                >
                  {{ obtenerEtiquetaDefinicion(tid)?.nombre || tid }}
                </span>
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

            <!-- Botones de Acción Comercial y Búsqueda -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <!-- Selector / Dropdown de Etiquetas -->
              <div class="relative">
                <button
                  type="button"
                  @click="menuEtiquetasAbierto = !menuEtiquetasAbierto"
                  class="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 transition"
                  title="Gestionar etiquetas del cliente"
                >
                  <Tag class="w-3.5 h-3.5 text-zinc-500" />
                  <span class="hidden sm:inline">Etiquetas</span>
                  <span
                    v-if="chatActivo.etiquetas?.length"
                    class="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]"
                  >
                    {{ chatActivo.etiquetas.length }}
                  </span>
                </button>

                <!-- Menú desplegable de etiquetas -->
                <div
                  v-if="menuEtiquetasAbierto"
                  class="absolute right-0 mt-1.5 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1.5 z-40 text-xs space-y-0.5 animate-in fade-in zoom-in-95"
                >
                  <div class="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Etiquetar Chat
                  </div>
                  <button
                    v-for="tag in CATALOGO_ETIQUETAS"
                    :key="tag.id"
                    type="button"
                    @click="alternarEtiquetaChat(tag.id)"
                    class="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-left"
                  >
                    <span class="flex items-center gap-1.5">
                      <span
                        class="w-2 h-2 rounded-full"
                        :class="
                          tag.colorClase.includes('amber')
                            ? 'bg-amber-500'
                            : tag.colorClase.includes('sky')
                            ? 'bg-sky-500'
                            : tag.colorClase.includes('indigo')
                            ? 'bg-indigo-500'
                            : tag.colorClase.includes('rose')
                            ? 'bg-rose-500'
                            : 'bg-emerald-500'
                        "
                      ></span>
                      <span class="text-zinc-800 dark:text-zinc-200">{{ tag.nombre }}</span>
                    </span>
                    <Check
                      v-if="chatActivo.etiquetas?.includes(tag.id)"
                      class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                    />
                  </button>
                </div>
              </div>

              <!-- Crear Oportunidad / Trato en Pipeline -->
              <button
                type="button"
                @click="modalTratoAbierto = true"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition"
                title="Convertir conversación en Oportunidad en el Pipeline Comercial"
              >
                <Kanban class="w-3.5 h-3.5" />
                <span class="hidden md:inline">Crear Trato</span>
              </button>

              <!-- Agendar Seguimiento en Calendario -->
              <button
                type="button"
                @click="modalSeguimientoAbierto = true"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400 hover:bg-sky-500/20 text-xs font-medium transition"
                title="Agendar llamada, reunión o tarea de seguimiento en la agenda"
              >
                <Calendar class="w-3.5 h-3.5" />
                <span class="hidden md:inline">Agendar</span>
              </button>

              <!-- Búsqueda en Chat -->
              <button
                type="button"
                @click="alternarBarraBusqueda"
                class="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                :class="barraBusquedaAbierta ? 'bg-zinc-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400' : ''"
                title="Buscar en la conversación activa"
              >
                <Search class="w-3.5 h-3.5" />
              </button>

              <!-- Asistente IA -->
              <button
                type="button"
                @click="menuIaAbierto = !menuIaAbierto"
                class="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-medium transition"
                title="Asistente de respuestas sugeridas con IA"
              >
                <Sparkles class="w-3.5 h-3.5" />
                <span class="hidden lg:inline">IA</span>
              </button>

              <router-link
                v-if="clienteDelChat"
                :to="{ path: '/clientes', query: { buscar: clienteDelChat.identificacion_fiscal || clienteDelChat.codigo } }"
                class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
              >
                <Building2 class="w-3.5 h-3.5 text-zinc-400" />
                <span class="hidden xl:inline">Ver Cliente</span>
              </router-link>

              <router-link
                to="/catalogo"
                class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-medium transition shadow-xs"
              >
                <FileText class="w-3.5 h-3.5" />
                <span class="hidden sm:inline">Cotizar PDF</span>
              </router-link>
            </div>
          </div>

          <!-- Barra Desplegable de Búsqueda Dentro de la Conversación Activa -->
          <div
            v-if="barraBusquedaAbierta"
            class="px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top-1"
          >
            <div class="flex items-center gap-2 flex-1 max-w-md">
              <Search class="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <input
                v-model="busquedaChatActivo"
                ref="inputBusquedaChat"
                type="text"
                placeholder="Buscar texto en mensajes..."
                class="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                @keydown.enter.prevent="siguienteCoincidencia"
                @keydown.esc="barraBusquedaAbierta = false"
              />
            </div>
            <div class="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span v-if="busquedaChatActivo.trim()">
                {{ coincidenciasBusqueda.length > 0 ? `${indiceCoincidenciaActual + 1} de ${coincidenciasBusqueda.length}` : 'Sin coincidencias' }}
              </span>
              <div v-if="coincidenciasBusqueda.length > 0" class="flex items-center gap-0.5">
                <button
                  type="button"
                  @click="anteriorCoincidencia"
                  class="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition"
                  title="Coincidencia anterior"
                >
                  <ChevronUp class="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  @click="siguienteCoincidencia"
                  class="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition"
                  title="Siguiente coincidencia"
                >
                  <ChevronDown class="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                type="button"
                @click="barraBusquedaAbierta = false; busquedaChatActivo = ''"
                class="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
                title="Cerrar búsqueda"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Menú Flotante de Sugerencias con IA -->
          <div
            v-if="menuIaAbierto"
            class="px-4 py-2.5 bg-amber-50/90 dark:bg-amber-950/40 border-b border-amber-500/20 flex flex-wrap items-center gap-2 text-xs"
          >
            <span class="text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1.5 shrink-0">
              <Bot class="w-3.5 h-3.5 text-amber-500" />
              <span>Plantillas IA:</span>
            </span>
            <button
              type="button"
              @click="generarSugerenciaIa('seguimiento')"
              class="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-amber-300/60 dark:border-amber-700/60 text-zinc-800 dark:text-zinc-200 hover:border-amber-500 transition text-[11px]"
            >
              📈 Seguimiento Cotización
            </button>
            <button
              type="button"
              @click="generarSugerenciaIa('confirmacion')"
              class="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-amber-300/60 dark:border-amber-700/60 text-zinc-800 dark:text-zinc-200 hover:border-amber-500 transition text-[11px]"
            >
              📅 Confirmar Reunión
            </button>
            <button
              type="button"
              @click="generarSugerenciaIa('cierre')"
              class="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-amber-300/60 dark:border-amber-700/60 text-zinc-800 dark:text-zinc-200 hover:border-amber-500 transition text-[11px]"
            >
              🤝 Bienvenida y Cierre
            </button>
            <button
              type="button"
              @click="generarSugerenciaIa('recordatorio')"
              class="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-amber-300/60 dark:border-amber-700/60 text-zinc-800 dark:text-zinc-200 hover:border-amber-500 transition text-[11px]"
            >
              💳 Recordatorio de Pago
            </button>
            <button
              type="button"
              @click="menuIaAbierto = false"
              class="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 ml-auto"
            >
              <X class="w-3.5 h-3.5" />
            </button>
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

            <!-- Burbujas de Mensaje con Agrupación por Fecha -->
            <template v-for="(m, idx) in mensajes" :key="m.id">
              <!-- Separador Inteligente de Fecha -->
              <div v-if="esPrimerMensajeDelDia(idx)" class="flex justify-center my-3 select-none">
                <span class="px-3 py-0.5 rounded-full text-[10px] font-medium bg-zinc-200/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 shadow-sm border border-zinc-300/40 dark:border-zinc-700/40">
                  {{ formatearEtiquetaFecha(m.timestamp) }}
                </span>
              </div>

              <!-- NOTA INTERNA PRIVADA DEL EQUIPO (Visible solo en CRM) -->
              <div v-if="m.esNotaInterna" class="w-full flex justify-center my-2 select-text">
                <div class="max-w-[90%] sm:max-w-[75%] w-full bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 rounded-2xl p-3 text-xs text-zinc-900 dark:text-zinc-100 shadow-sm">
                  <div class="flex items-center justify-between gap-2 mb-1.5 pb-1.5 border-b border-amber-500/20 text-[10px] font-semibold tracking-wider text-amber-700 dark:text-amber-400">
                    <div class="flex items-center gap-1.5">
                      <Lock class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>NOTA INTERNA PRIVADA • {{ m.emisor }}</span>
                    </div>
                    <span class="font-mono text-[9px] text-zinc-500">{{ formatearHoraMensaje(m.timestamp) }}</span>
                  </div>
                  <div class="whitespace-pre-wrap leading-relaxed font-sans" v-html="formatearTextoWhatsApp(m.texto)"></div>
                </div>
              </div>

              <!-- Burbuja de Mensaje WhatsApp Normal -->
              <div
                v-else
                :id="'msg-' + m.id"
                :class="[
                  'flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-[65%] group relative transition',
                  m.deMi ? 'ml-auto items-end' : 'mr-auto items-start'
                ]"
              >
                <!-- Barra de Acciones al pasar el cursor (Hover) -->
                <div
                  class="absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10"
                  :class="m.deMi ? '-left-16' : '-right-16'"
                >
                  <button
                    type="button"
                    @click="iniciarRespuesta(m)"
                    class="p-1.5 rounded-full bg-white dark:bg-zinc-800 shadow-md border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                    title="Responder a este mensaje"
                  >
                    <CornerUpLeft class="w-3.5 h-3.5" />
                  </button>
                  <button
                    v-if="m.texto"
                    type="button"
                    @click="copiarTextoMensaje(m.texto)"
                    class="p-1.5 rounded-full bg-white dark:bg-zinc-800 shadow-md border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
                    title="Copiar texto"
                  >
                    <Copy class="w-3.5 h-3.5" />
                  </button>
                </div>

                <!-- Tarjeta Principal de la Burbuja -->
                <div
                  :class="[
                    'rounded-2xl px-4 py-2.5 text-xs shadow-sm transition relative',
                    m.deMi
                      ? 'bg-emerald-600 text-white dark:bg-emerald-700 rounded-br-none'
                      : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700/60 rounded-bl-none',
                    coincidenciasBusqueda.includes(idx) ? 'ring-2 ring-amber-400 dark:ring-amber-500' : ''
                  ]"
                >
                  <!-- Nombre del Emisor si es grupo o cliente -->
                  <div
                    v-if="!m.deMi"
                    class="font-semibold text-[10px] text-emerald-600 dark:text-emerald-400 mb-0.5"
                  >
                    {{ m.emisor }}
                  </div>

                  <!-- Mensaje Citado / Respondido -->
                  <div
                    v-if="m.mensajeCitado"
                    @click="irAMensajePorId(m.mensajeCitado.id)"
                    class="mb-2 p-2 rounded-lg text-[11px] border-l-4 transition flex flex-col gap-0.5 cursor-pointer"
                    :class="[
                      m.deMi
                        ? 'bg-black/20 border-white/90 text-white/90 hover:bg-black/30'
                        : 'bg-zinc-100 dark:bg-zinc-900 border-emerald-500 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-750'
                    ]"
                    title="Clic para ver mensaje original"
                  >
                    <div class="font-bold text-[10px] flex items-center gap-1 opacity-90">
                      <CornerUpLeft class="w-3 h-3 text-emerald-400" />
                      <span>{{ m.mensajeCitado.emisor }}</span>
                    </div>
                    <div class="truncate text-[10px] opacity-80">{{ m.mensajeCitado.texto }}</div>
                  </div>

                  <!-- Mensaje tipo audio / nota de voz -->
                  <div v-if="m.tipo === 'audio'" class="my-1">
                    <ReproductorNotaVoz
                      :src="obtenerUrlMedia(m.archivoUrl)"
                      :duracion-segundos="m.duracionSegundos || 0"
                      :es-nota-voz="m.esNotaVoz !== false"
                      :nombre-archivo="m.archivoNombre || 'nota_de_voz.ogg'"
                      :tamano="m.archivoTamano"
                      :de-mi="m.deMi"
                    />
                  </div>

                  <!-- Mensaje tipo imagen -->
                  <div v-else-if="m.tipo === 'imagen'" class="my-1 rounded-xl overflow-hidden">
                    <div
                      class="relative group cursor-pointer"
                      @click="m.archivoUrl && abrirImagenModal(obtenerUrlMedia(m.archivoUrl))"
                    >
                      <img
                        v-if="m.archivoUrl"
                        :src="obtenerUrlMedia(m.archivoUrl)"
                        :alt="m.archivoNombre || 'Imagen adjunta'"
                        class="rounded-xl max-h-60 max-w-full object-cover border border-black/10 transition group-hover:brightness-95 shadow-sm"
                        loading="lazy"
                      />
                      <div
                        v-else
                        class="p-6 bg-black/10 rounded-xl flex items-center justify-center text-zinc-400 gap-2"
                      >
                        <ImageIcon class="w-5 h-5" />
                        <span>Imagen no disponible</span>
                      </div>
                      <div
                        v-if="m.archivoUrl"
                        class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 rounded-xl text-white backdrop-blur-[1px]"
                      >
                        <span class="p-1.5 rounded-full bg-black/50 backdrop-blur-sm" title="Ampliar imagen">
                          <Eye class="w-4 h-4" />
                        </span>
                        <a
                          :href="obtenerUrlMedia(m.archivoUrl)"
                          :download="m.archivoNombre || 'imagen.jpg'"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="p-1.5 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition"
                          title="Descargar imagen"
                          @click.stop
                        >
                          <Download class="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <!-- Mensaje tipo documento -->
                  <div
                    v-else-if="m.tipo === 'documento'"
                    class="flex items-center gap-3 p-2.5 rounded-xl my-1 border transition"
                    :class="m.deMi ? 'bg-white/10 border-white/20 text-white' : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'"
                  >
                    <div class="p-2 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 shrink-0">
                      <FileText class="w-5 h-5" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="font-semibold text-xs truncate">{{ m.archivoNombre || 'Documento Comercial' }}</div>
                      <div class="text-[10px] opacity-75">
                        {{ m.archivoTamano || 'Documento adjunto' }}
                      </div>
                    </div>
                    <a
                      v-if="m.archivoUrl"
                      :href="obtenerUrlMedia(m.archivoUrl)"
                      :download="m.archivoNombre || 'documento.pdf'"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="p-2 rounded-lg transition shrink-0"
                      :class="m.deMi ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'"
                      title="Descargar documento"
                    >
                      <Download class="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <!-- Texto del mensaje formateado -->
                  <div
                    v-if="m.texto"
                    class="whitespace-pre-wrap leading-relaxed select-text mt-1 text-xs"
                    v-html="formatearTextoWhatsApp(m.texto)"
                  ></div>

                  <!-- Pie de la burbuja: hora y estado -->
                  <div
                    :class="[
                      'flex items-center justify-end gap-1 text-[9px] mt-1 font-mono select-none',
                      m.deMi ? 'text-emerald-100 dark:text-emerald-200' : 'text-zinc-400 dark:text-zinc-400'
                    ]"
                  >
                    <span>{{ formatearHoraMensaje(m.timestamp) }}</span>
                    <template v-if="m.deMi">
                      <CheckCheck v-if="m.estado === 'leido'" class="w-3 h-3 text-emerald-200 dark:text-emerald-300" />
                      <CheckCheck v-else-if="m.estado === 'entregado'" class="w-3 h-3 text-white/80" />
                      <Check v-else class="w-3 h-3 text-white/70" />
                    </template>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Pestaña de Selector de Modo: Mensaje WhatsApp vs Nota Interna -->
          <div class="px-4 py-1.5 bg-zinc-50 dark:bg-zinc-900/90 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 text-xs">
            <div class="flex items-center gap-1 bg-zinc-200/70 dark:bg-zinc-800/70 p-0.5 rounded-lg">
              <button
                type="button"
                @click="modoNotaInterna = false"
                class="flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition"
                :class="
                  !modoNotaInterna
                    ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                "
              >
                <MessageSquare class="w-3.5 h-3.5" />
                <span>Mensaje WhatsApp</span>
              </button>
              <button
                type="button"
                @click="modoNotaInterna = true"
                class="flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition"
                :class="
                  modoNotaInterna
                    ? 'bg-amber-500 text-white shadow-xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                "
              >
                <Lock class="w-3.5 h-3.5" />
                <span>Nota Interna Privada</span>
              </button>
            </div>

            <div v-if="modoNotaInterna" class="text-[11px] text-amber-700 dark:text-amber-400 font-medium hidden sm:flex items-center gap-1">
              <Lock class="w-3 h-3" />
              <span>Visible solo para el equipo comercial en el CRM</span>
            </div>
            <div v-else class="text-[11px] text-zinc-400 hidden sm:flex items-center gap-1">
              <span>Escribe <code class="px-1 py-0.2 bg-zinc-200 dark:bg-zinc-800 rounded font-mono text-[10px]">/</code> para respuestas rápidas</span>
            </div>
          </div>

          <!-- Popover Flotante de Atajos Rápidos con / -->
          <div
            v-if="mostrarMenuComandos && comandosFiltrados.length > 0"
            class="px-3 py-2 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-1 max-h-48 overflow-y-auto text-xs shadow-lg animate-in slide-in-from-bottom-2"
          >
            <div class="flex items-center justify-between text-[10px] text-zinc-400 font-semibold px-2 uppercase tracking-wider">
              <span>Respuestas Rápidas (Atajos con /)</span>
              <span>Clic o Enter para insertar</span>
            </div>
            <button
              v-for="item in comandosFiltrados"
              :key="item.comando"
              type="button"
              @click="seleccionarComando(item)"
              class="flex items-start gap-2 p-2 rounded-xl text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition group"
            >
              <span class="font-mono text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                {{ item.comando }}
              </span>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-emerald-600">
                  {{ item.titulo }}
                </div>
                <div class="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  {{ item.texto }}
                </div>
              </div>
            </button>
          </div>

          <!-- Selector de archivo oculto -->
          <input
            ref="inputArchivo"
            type="file"
            class="hidden"
            accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
            @change="manejarArchivoSeleccionado"
          />

          <!-- Banner de respuesta/cita a mensaje previo -->
          <div
            v-if="mensajeRespondido"
            class="px-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs animate-in slide-in-from-bottom-1"
          >
            <div class="flex items-center gap-2.5 border-l-4 border-emerald-500 pl-2.5 min-w-0">
              <CornerUpLeft class="w-4 h-4 text-emerald-500 shrink-0" />
              <div class="min-w-0">
                <div class="font-bold text-[11px] text-emerald-600 dark:text-emerald-400">
                  Respondiendo a {{ mensajeRespondido.emisor }}
                </div>
                <div class="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                  {{ mensajeRespondido.texto || mensajeRespondido.archivoNombre || (mensajeRespondido.tipo === 'audio' ? 'Nota de voz' : 'Archivo adjunto') }}
                </div>
              </div>
            </div>
            <button
              type="button"
              @click="cancelarRespuesta"
              class="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-black/5 transition shrink-0"
              title="Cancelar respuesta"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Banner de archivo adjunto pendiente de envío -->
          <div
            v-if="archivoAdjunto"
            class="px-4 py-2.5 bg-emerald-50/90 dark:bg-emerald-950/40 border-t border-emerald-500/20 flex items-center justify-between gap-3 text-xs"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <div v-if="archivoPreviewUrl" class="w-9 h-9 rounded-lg overflow-hidden border border-emerald-500/30 shrink-0 bg-black/10">
                <img :src="archivoPreviewUrl" alt="Vista previa" class="w-full h-full object-cover" />
              </div>
              <div v-else class="p-2 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">
                <FileText class="w-5 h-5" />
              </div>
              <div class="min-w-0">
                <div class="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {{ archivoAdjunto.name }}
                </div>
                <div class="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {{ formatearTamanoArchivo(archivoAdjunto.size) }} • Listo para enviar
                </div>
              </div>
            </div>
            <button
              type="button"
              @click="cancelarArchivoAdjunto"
              class="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-black/5 transition shrink-0"
              title="Descartar adjunto"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Barra de Redacción de Mensaje / Grabador de Voz en Vivo -->
          <div class="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
            <!-- Si el grabador de voz en vivo está activo -->
            <template v-if="grabadorAudioAbierto">
              <GrabadorNotaVoz
                @enviar="manejarAudioGrabado"
                @cancelar="grabadorAudioAbierto = false"
              />
            </template>

            <!-- Modo normal de redacción -->
            <template v-else>
              <!-- Botón para adjuntar documento, imagen o audio -->
              <button
                type="button"
                @click="activarSelectorArchivos"
                :disabled="enviando"
                class="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition shrink-0"
                title="Adjuntar imagen o documento"
              >
                <Paperclip class="w-4 h-4" />
              </button>

              <!-- Botón Grabar Nota de Voz con Micrófono -->
              <button
                type="button"
                @click="grabadorAudioAbierto = true"
                :disabled="enviando"
                class="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/10 text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition shrink-0"
                title="Grabar nota de voz con micrófono"
              >
                <Mic class="w-4 h-4" />
              </button>

              <!-- Input principal -->
              <input
                v-model="textoNuevoMensaje"
                @keydown.enter.prevent="enviarMensaje"
                type="text"
                :placeholder="
                  modoNotaInterna
                    ? 'Escribe una nota interna para el equipo... (Enter para registrar)'
                    : mensajeRespondido
                    ? `Respondiendo a ${mensajeRespondido.emisor}...`
                    : archivoAdjunto
                    ? 'Añade un comentario al archivo... (Enter para enviar)'
                    : 'Escribe un mensaje de WhatsApp o / para atajos... (*negrita*, _cursiva_)'
                "
                class="flex-1 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none transition"
                :class="
                  modoNotaInterna
                    ? 'border-amber-400/80 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                    : 'border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                "
              />

              <!-- Botón Enviar o Registrar Nota -->
              <button
                type="button"
                @click="enviarMensaje"
                :disabled="(!textoNuevoMensaje.trim() && !archivoAdjunto) || enviando"
                class="p-2.5 rounded-xl disabled:opacity-40 text-white shadow-sm transition shrink-0 flex items-center justify-center"
                :class="
                  modoNotaInterna
                    ? 'bg-amber-600 hover:bg-amber-500 disabled:hover:bg-amber-600'
                    : 'bg-emerald-600 hover:bg-emerald-500 disabled:hover:bg-emerald-600'
                "
                :title="modoNotaInterna ? 'Guardar nota interna' : 'Enviar mensaje de WhatsApp'"
              >
                <Lock v-if="modoNotaInterna" class="w-4 h-4" />
                <Send v-else class="w-4 h-4" />
              </button>
            </template>
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
            <button
              type="button"
              @click="modalTratoAbierto = true"
              class="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 transition font-medium text-xs"
            >
              <div class="flex items-center gap-2">
                <Kanban class="w-4 h-4" />
                <span>Crear Oportunidad Kanban</span>
              </div>
              <ChevronRight class="w-4 h-4 opacity-75" />
            </button>

            <button
              type="button"
              @click="modalSeguimientoAbierto = true"
              class="w-full flex items-center justify-between p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 hover:bg-sky-500/20 text-sky-700 dark:text-sky-400 transition font-medium text-xs"
            >
              <div class="flex items-center gap-2">
                <Calendar class="w-4 h-4" />
                <span>Agendar Reunión o Tarea</span>
              </div>
              <ChevronRight class="w-4 h-4 opacity-75" />
            </button>

            <router-link
              :to="{ path: '/pipeline' }"
              class="w-full flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition font-medium text-zinc-700 dark:text-zinc-300 text-xs"
            >
              <span>Ver Tablero Kanban</span>
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

    <!-- MODAL VISTA PREVIA DE IMAGEN EN ALTA RESOLUCIÓN -->
    <Teleport to="body">
      <div
        v-if="modalImagenVistaPrevia"
        class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        @click="cerrarImagenModal"
      >
        <div class="relative max-w-4xl max-h-[90vh] flex flex-col items-center" @click.stop>
          <button
            type="button"
            @click="cerrarImagenModal"
            class="absolute -top-10 right-0 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
            title="Cerrar vista previa"
          >
            <X class="w-5 h-5" />
          </button>
          <img
            :src="modalImagenVistaPrevia"
            alt="Vista previa ampliada"
            class="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-white/10"
          />
          <div class="mt-3 flex items-center gap-3">
            <a
              :href="modalImagenVistaPrevia"
              download="whatsapp_imagen.jpg"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow transition"
            >
              <Download class="w-4 h-4" />
              <span>Descargar Imagen</span>
            </a>
            <button
              type="button"
              @click="cerrarImagenModal"
              class="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- MODAL CREAR TRATO EN PIPELINE COMERCIAL -->
    <ModalCrearTratoWhatsApp
      v-model="modalTratoAbierto"
      :chat="chatActivo"
    />

    <!-- MODAL AGENDAR SEGUIMIENTO EN CALENDARIO -->
    <ModalAgendarSeguimientoWhatsApp
      v-model="modalSeguimientoAbierto"
      :chat="chatActivo"
    />
  </div>
</template>
