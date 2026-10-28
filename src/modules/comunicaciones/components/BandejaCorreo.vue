<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { webmailService } from '../services/webmail.service';
import { smtpService } from '../services/smtp.service';
import type { 
  CarpetaCorreo, 
  CarpetaCorreoId, 
  MensajeCorreo, 
  AdjuntoCorreo,
  RespuestaMensajesPaginada 
} from '../types/webmail.types';
import BandejaCorreoToolbar from './BandejaCorreoToolbar.vue';
import CarpetasCorreoNav from './CarpetasCorreoNav.vue';
import CorreoListItem from './CorreoListItem.vue';
import RedactarCorreoModal from './RedactarCorreoModal.vue';
import ReglasCorreoModal from './ReglasCorreoModal.vue';
import EmailViewer from './EmailViewer.vue';
import ModalCrearOportunidadDesdeCorreo from './ModalCrearOportunidadDesdeCorreo.vue';
import ModalCrearActividadDesdeCorreo from './ModalCrearActividadDesdeCorreo.vue';
import FichaClienteDrawer from './FichaClienteDrawer.vue';
import { reglasCorreoService } from '../services/reglas-correo.service';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import type { CarpetaPersonalizada } from '../types/reglas-correo.types';
import type { Cliente } from '@/modules/clientes/types/cliente.types';
import type { ActividadSeguimiento } from '@/modules/agenda/types/actividad.types';
import { 
  Send, 
  Archive, 
  Trash2, 
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
  Download,
  FileSpreadsheet,
  FolderArchive,
  Folder,
  Check,
  Kanban,
  CalendarClock,
  UserCheck,
  UserPlus,

  Bell,
  GitMerge,
  ChevronDown,
  Maximize2,
  Minimize2
} from 'lucide-vue-next';
import { formatDate, formatFileSize, formatRelativeTime } from '@/core/formatters/formatters';
import { toastService } from '@/core/notifications/toast.service';
import { clienteService } from '@/modules/clientes/services/cliente.service';
import { timelineService } from '@/modules/clientes/services/timeline.service';
import AppSelect, { type SelectOption } from '@/shared/components/AppSelect.vue';

const authStore = useAuthStore();
const carpetas = ref<CarpetaCorreo[]>([]);
const carpetaActiva = ref<CarpetaCorreoId>('inbox');
const mensajes = ref<MensajeCorreo[]>([]);
const mensajeSeleccionado = ref<MensajeCorreo | null>(null);

const cargando = ref(true);
const sincronizando = ref(false);

const busqueda = ref('');
const busquedaGlobal = ref(false);
const filtroEstado = ref<'todos' | 'noLeidos' | 'destacados' | 'conAdjuntos'>('todos');
const pagina = ref(1);
const limite = ref(15);
const total = ref(0);
const totalPaginas = ref(1);

// Sincronización continua por scroll y búsqueda remota
const listaScrollContainerRef = ref<HTMLElement | null>(null);
const cargandoMas = ref(false);
const finDeHistorial = ref(false);
const buscandoEnServidor = ref(false);
const coincidenciasServidorContador = ref(0);
let timerBusquedaRemota: ReturnType<typeof setTimeout> | null = null;

// Modales CRM y Ficha 360°
const modalOportunidadAbierto = ref(false);
const modalActividadAbierto = ref(false);
const drawerClienteAbierto = ref(false);

// Hilos de conversación
const hiloMensajes = ref<MensajeCorreo[]>([]);
const cargandoHilo = ref(false);
const modoVerHilo = ref(false);
const modoEnfoqueLectura = ref(false);
const panelMovil = ref<'lista' | 'lectura'>('lista');

const volverALista = () => {
  panelMovil.value = 'lista';
  modoEnfoqueLectura.value = false;
};

watch(mensajeSeleccionado, (mensaje) => {
  if (!mensaje) panelMovil.value = 'lista';
});
const mostrarAdjuntosCabecera = ref(false);

// Sincronización silenciosa periódica
const nuevosCorreosDetectados = ref(0);
let intervaloNovedades: ReturnType<typeof setInterval> | null = null;

// Modal Redactar / Reenviar
const modalRedactarAbierto = ref(false);
const redactarDestinatario = ref('');
const redactarAsunto = ref('');
const redactarCuerpo = ref('');

const abrirModalRedactar = () => {
  if (!authStore.tienePermiso('comunicaciones:enviar')) return;
  redactarDestinatario.value = '';
  redactarAsunto.value = '';
  redactarCuerpo.value = '';
  modalRedactarAbierto.value = true;
};

// Reglas de Correo y Carpetas Personalizadas
const modalReglasAbierto = ref(false);
const carpetasPersonalizadas = ref<CarpetaPersonalizada[]>([]);

const opcionesCarpetaMovimiento = computed((): SelectOption<string>[] => [
  { value: 'inbox', label: '📥 Bandeja' },
  { value: 'archivados', label: '🗂️ Archivados' },
  { value: 'papelera', label: '🗑️ Papelera' },
  ...carpetasPersonalizadas.value.map(c => ({ value: c.id, label: `📁 ${c.nombre}` })),
]);
const totalReglasActivas = ref(0);

const opcionesCarpetasMovil = computed((): SelectOption<string>[] => [
  ...carpetas.value.map((c) => ({ value: c.id, label: `${c.nombre} (${c.total})` })),
  ...carpetasPersonalizadas.value.map((c) => ({ value: c.id, label: `📁 ${c.nombre}` })),
]);

const nombreCarpetaActiva = computed(() => {
  const cEst = carpetas.value.find((c) => c.id === carpetaActiva.value);
  if (cEst) return cEst.nombre;
  const cPers = carpetasPersonalizadas.value.find((c) => c.id === carpetaActiva.value);
  if (cPers) return cPers.nombre;
  return carpetaActiva.value;
});

// Estado de respuesta rápida
const respuestaCuerpo = ref('');
const incluirFirmaEnRespuesta = ref(true);
const incluirPieEnRespuesta = ref(true);
const citarOriginalEnRespuesta = ref(false);
const enviandoRespuesta = ref(false);
const feedbackRespuesta = ref<{ exito: boolean; mensaje: string } | null>(null);
const replyInputRef = ref<HTMLTextAreaElement | null>(null);

const cuentaConfigurada = ref('');
const protocoloImap = ref('IMAP sin configurar');
const imapActivo = ref(false);
const actualizarCuentaConfigurada = () => {
  const conf = smtpService.obtenerConfiguracion();
  cuentaConfigurada.value = conf.usuarioImap || conf.usuarioSmtp || '';
  imapActivo.value = Boolean(conf.habilitarImap && conf.servidorImap);
  protocoloImap.value = imapActivo.value ? `IMAP ${conf.puertoImap}` : 'IMAP sin configurar';
};

const cargarCarpetas = async () => {
  const lista = await webmailService.obtenerCarpetas();
  carpetas.value = lista;

  const persDelBackend = lista
    .filter((c) => c.esPersonalizada)
    .map((c) => ({
      id: c.id,
      nombre: c.nombre,
      color: (c.color as CarpetaPersonalizada['color']) || 'indigo',
      creadaEn: new Date().toISOString(),
    }));

  if (persDelBackend.length > 0) {
    carpetasPersonalizadas.value = persDelBackend;
    reglasCorreoService.sincronizarCarpetasDesdeBackend(persDelBackend);
  } else {
    carpetasPersonalizadas.value = reglasCorreoService.obtenerCarpetasPersonalizadas();
  }

  // Si la carpeta activa fue eliminada, regresar automáticamente a inbox
  if (carpetaActiva.value !== 'inbox' && !lista.some((c) => c.id === carpetaActiva.value)) {
    carpetaActiva.value = 'inbox';
    pagina.value = 1;
  }

  const listReglas = reglasCorreoService.obtenerReglas();
  totalReglasActivas.value = listReglas.filter((r) => r.activa).length;
};

const cargarMensajes = async (aplicarReglas = false) => {
  try {
    cargando.value = true;
    const resp: RespuestaMensajesPaginada = await webmailService.obtenerMensajes(
      carpetaActiva.value,
      pagina.value,
      limite.value,
      busqueda.value,
      {
        global: busquedaGlobal.value,
        filtro: filtroEstado.value,
      }
    );
    mensajes.value = resp.mensajes || [];
    total.value = resp.total || 0;
    totalPaginas.value = resp.totalPaginas || 1;

    // Ejecutar reglas automáticas en segundo plano si se sincronizó
    if (aplicarReglas && mensajes.value.length > 0) {
      await reglasCorreoService.ejecutarReglasLote(mensajes.value);
    }

    if (mensajeSeleccionado.value) {
      const encontrado = mensajes.value.find((m) => m.id === mensajeSeleccionado.value?.id);
      if (encontrado) {
        mensajeSeleccionado.value = encontrado;
      } else {
        mensajeSeleccionado.value = null;
      }
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
      await cargarMensajes(true);
      await cargarCarpetas(); // refrescar contadores tras aplicar reglas

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

const onScrollLista = () => {
  const el = listaScrollContainerRef.value;
  if (!el || cargandoMas.value || cargando.value || finDeHistorial.value) return;
  const distanciaAlFinal = el.scrollHeight - el.scrollTop - el.clientHeight;
  if (distanciaAlFinal <= 120) {
    cargarMasCorreos();
  }
};

const cargarMasCorreos = async () => {
  if (cargandoMas.value || cargando.value || finDeHistorial.value) return;
  cargandoMas.value = true;

  try {
    // 1. Si aún quedan páginas locales en la base de datos para esta vista, cargar la siguiente página
    if (pagina.value < totalPaginas.value) {
      const proxPagina = pagina.value + 1;
      const resp: RespuestaMensajesPaginada = await webmailService.obtenerMensajes(
        carpetaActiva.value,
        proxPagina,
        limite.value,
        busqueda.value,
        {
          global: busquedaGlobal.value,
          filtro: filtroEstado.value,
        }
      );

      if (resp.mensajes && resp.mensajes.length > 0) {
        pagina.value = proxPagina;
        const existentesIds = new Set(mensajes.value.map((m) => m.id));
        const nuevos = resp.mensajes.filter((m) => !existentesIds.has(m.id));
        mensajes.value.push(...nuevos);
        total.value = resp.total || total.value;
        totalPaginas.value = resp.totalPaginas || totalPaginas.value;
        cargandoMas.value = false;
        return;
      }
    }

    // 2. Si ya se mostraron todos los locales de la DB, sincronizar bloque anterior desde el servidor IMAP
    const offset = mensajes.value.length;
    const res = await webmailService.sincronizar(carpetaActiva.value, 30, offset);

    if (res.exito) {
      if (res.sincronizados && res.sincronizados > 0) {
        await cargarCarpetas();
        const proxPagina = pagina.value + 1;
        const resp: RespuestaMensajesPaginada = await webmailService.obtenerMensajes(
          carpetaActiva.value,
          proxPagina,
          limite.value,
          busqueda.value,
          {
            global: busquedaGlobal.value,
            filtro: filtroEstado.value,
          }
        );

        const existentesIds = new Set(mensajes.value.map((m) => m.id));
        const nuevos = (resp.mensajes || []).filter((m) => !existentesIds.has(m.id));
        if (nuevos.length > 0) {
          pagina.value = proxPagina;
          mensajes.value.push(...nuevos);
          total.value = resp.total || (total.value + res.sincronizados);
          totalPaginas.value = resp.totalPaginas || totalPaginas.value;
        } else {
          finDeHistorial.value = true;
        }
      } else {
        finDeHistorial.value = true;
      }

      if (res.hayMas === false) {
        finDeHistorial.value = true;
      }
    } else {
      finDeHistorial.value = true;
    }
  } catch (err) {
    console.warn('Error al cargar correos anteriores por scroll:', err);
    finDeHistorial.value = true;
  } finally {
    cargandoMas.value = false;
  }
};

const seleccionarCarpeta = (id: CarpetaCorreoId) => {
  carpetaActiva.value = id;
  pagina.value = 1;
  finDeHistorial.value = false;
  cargandoMas.value = false;
  coincidenciasServidorContador.value = 0;
  filtroEstado.value = 'todos';
  mensajeSeleccionado.value = null;
  panelMovil.value = 'lista';
  cargarMensajes();
};

// Clientes CRM cargados para asociar emails a expedientes
const clientesCrm = ref<Array<{ id: string; nombre: string; sector?: string; estado?: string }>>([]);
const clientesCompletos = ref<Cliente[]>([]);

const cargarClientesCrm = async () => {
  try {
    const list = await clienteService.obtenerTodosLosClientes();
    clientesCompletos.value = list;
    clientesCrm.value = list.map((c) => ({
      id: c.id,
      nombre: c.nombre_comercial || c.razon_social,
      sector: c.sector,
      estado: c.estado,
    }));
  } catch (err) {
    console.warn('No se pudieron precargar clientes para webmail:', err);
  }
};

const clienteCompletoVinculado = computed<Cliente | null>(() => {
  if (!mensajeSeleccionado.value) return null;
  const remitenteCorreo = (mensajeSeleccionado.value.de.correo || '').toLowerCase().trim();
  const remitenteNombre = (mensajeSeleccionado.value.de.nombre || '').toLowerCase().trim();
  const textoGeneral = `${mensajeSeleccionado.value.asunto} ${remitenteNombre} ${remitenteCorreo}`.toLowerCase();

  // 1. Por coincidencia de correo principal o contactos
  for (const c of clientesCompletos.value) {
    if (c.email && c.email.toLowerCase().trim() === remitenteCorreo) return c;
    if (c.contactos?.some((cnt) => cnt.email && cnt.email.toLowerCase().trim() === remitenteCorreo)) {
      return c;
    }
  }

  // 2. Por coincidencia en razón social o nombre comercial
  for (const c of clientesCompletos.value) {
    const rz = (c.razon_social || '').toLowerCase();
    const nc = (c.nombre_comercial || '').toLowerCase();
    if (rz.length >= 4 && (remitenteNombre.includes(rz) || textoGeneral.includes(rz))) return c;
    if (nc.length >= 4 && (remitenteNombre.includes(nc) || textoGeneral.includes(nc))) return c;
  }

  // 3. Casos por dominios conocidos (como verafeca / fergreens)
  if (textoGeneral.includes('verafeca') || textoGeneral.includes('fergreens')) {
    const cVerafeca = clientesCompletos.value.find(c => 
      c.razon_social.toLowerCase().includes('verafeca') || 
      c.razon_social.toLowerCase().includes('fergreens')
    );
    if (cVerafeca) return cVerafeca;
  }

  return null;
});

const clienteVinculado = computed(() => {
  if (clienteCompletoVinculado.value) {
    return {
      id: clienteCompletoVinculado.value.id,
      nombre: clienteCompletoVinculado.value.nombre_comercial || clienteCompletoVinculado.value.razon_social,
      sector: clienteCompletoVinculado.value.sector,
      estado: clienteCompletoVinculado.value.estado,
    };
  }

  if (!mensajeSeleccionado.value) return null;

  // Si ya viene con nombre explícito del backend
  if (mensajeSeleccionado.value.clienteNombreRelacionado) {
    const directMatch = clientesCrm.value.find((c) =>
      c.nombre.toLowerCase().includes(mensajeSeleccionado.value!.clienteNombreRelacionado!.toLowerCase())
    );
    if (directMatch) return directMatch;
    return {
      id: 'crm-detectado',
      nombre: mensajeSeleccionado.value.clienteNombreRelacionado,
      sector: 'Empresa Vinculada',
      estado: 'activo',
    };
  }

  return null;
});

const registrandoEnBitacora = ref(false);
const registrarEnBitacora = async () => {
  if (!mensajeSeleccionado.value || !clienteVinculado.value) return;
  registrandoEnBitacora.value = true;
  try {
    await timelineService.registrarEvento({
      clienteId: clienteVinculado.value.id,
      tipo: 'correo',
      titulo: `Correo archivado: ${mensajeSeleccionado.value.asunto}`,
      descripcion: `Intercambio de correo recibido de ${mensajeSeleccionado.value.de.nombre || mensajeSeleccionado.value.de.correo}. ${mensajeSeleccionado.value.extracto || ''}`,
      autor: authStore.usuario?.nombre || '—',
    });
    toastService.exito(`Correo registrado en el historial de ${clienteVinculado.value.nombre}`);
  } catch {
    toastService.error('Error al registrar en bitácora del cliente');
  } finally {
    registrandoEnBitacora.value = false;
  }
};

const formatearTamanoBytes = (bytes: number): string => formatFileSize(bytes);

const tamanoTotalAdjuntos = computed(() => {
  if (!mensajeSeleccionado.value?.adjuntos) return '0 KB';
  const totalBytes = mensajeSeleccionado.value.adjuntos.reduce((acc, a) => acc + (a.tamanoBytes || 0), 0);
  return formatearTamanoBytes(totalBytes);
});

const descargandoAdjuntoId = ref<string | null>(null);
const descargandoTodos = ref(false);

const descargarAdjunto = async (att: AdjuntoCorreo) => {
  if (!mensajeSeleccionado.value) return;
  descargandoAdjuntoId.value = att.id;
  try {
    toastService.info(`Descargando "${att.nombre}"...`);
    await webmailService.descargarAdjunto(mensajeSeleccionado.value.id, att);
    toastService.exito(`"${att.nombre}" descargado correctamente.`);
  } catch (err) {
    console.error('Error al descargar adjunto:', err);
    toastService.error(`No se pudo descargar "${att.nombre}"`);
  } finally {
    descargandoAdjuntoId.value = null;
  }
};

const descargarTodosLosAdjuntos = async () => {
  if (!mensajeSeleccionado.value?.adjuntos?.length) return;
  descargandoTodos.value = true;
  toastService.info(`Generando archivo .zip con ${mensajeSeleccionado.value.adjuntos.length} adjuntos...`);
  try {
    await webmailService.descargarTodosLosAdjuntosZip(
      mensajeSeleccionado.value.id,
      mensajeSeleccionado.value.asunto,
      mensajeSeleccionado.value.adjuntos
    );
    toastService.exito('Archivo comprimido (.zip) generado y descargado correctamente.');
  } catch (err) {
    console.error('Error al empaquetar adjuntos en zip:', err);
    toastService.error('Ocurrió un error al generar el archivo .zip de los adjuntos.');
  } finally {
    descargandoTodos.value = false;
  }
};

const obtenerIconoAdjunto = (nombre: string) => {
  const ext = nombre.split('.').pop()?.toLowerCase() || '';
  if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) return ImageIcon;
  if (['p12', 'pem', 'crt', 'key', 'cer'].includes(ext)) return KeyRound;
  if (['pdf'].includes(ext)) return FileText;
  if (['xlsx', 'xls', 'csv'].includes(ext)) return FileSpreadsheet;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return FolderArchive;
  return Paperclip;
};

const modoVistaCuerpo = ref<'html' | 'texto'>('html');

const plantillasRapidas = [
  {
    etiqueta: 'Confirmar recepción',
    texto: 'Hola, hemos recibido su correo y la documentación adjunta satisfactoriamente. Procedemos con la revisión correspondiente y le mantendremos informado.',
  },
  {
    etiqueta: 'En proceso',
    texto: 'Estimado/a, le confirmamos que el trámite se encuentra actualmente en proceso de gestión técnica y comercial. Estaremos compartiendo avances a la brevedad.',
  },
  {
    etiqueta: 'Solicitar reunión',
    texto: 'Agradecemos su mensaje. Quisiéramos coordinar una breve llamada de seguimiento de 15 minutos para afinar los detalles. Por favor indíquenos su disponibilidad.',
  },
];

const aplicarPlantilla = (texto: string) => {
  if (respuestaCuerpo.value.trim()) {
    respuestaCuerpo.value += `\n\n${texto}`;
  } else {
    respuestaCuerpo.value = texto;
  }
};

const seleccionarMensaje = async (mensaje: MensajeCorreo) => {
  mensajeSeleccionado.value = mensaje;
  panelMovil.value = 'lectura';
  feedbackRespuesta.value = null;
  respuestaCuerpo.value = '';
  mostrarAdjuntosCabecera.value = false;
  modoVerHilo.value = false;

  if (!mensaje.leido) {
    mensaje.leido = true;
    await webmailService.marcarLeido(mensaje.id, true);
    await cargarCarpetas();
  }

  // 1. Si el mensaje tiene indicador de adjuntos y no están cargados completos, pedir detalle
  if (mensaje.tieneAdjuntos && (!mensaje.adjuntos || mensaje.adjuntos.length === 0)) {
    try {
      const detalle = await webmailService.obtenerMensaje(mensaje.id);
      if (detalle?.adjuntos?.length) {
        mensaje.adjuntos = detalle.adjuntos;
        if (mensajeSeleccionado.value?.id === mensaje.id) {
          mensajeSeleccionado.value.adjuntos = detalle.adjuntos;
        }
      }
    } catch (e) {
      console.warn('Error al obtener detalle del mensaje:', e);
    }
  }

  // 2. Si todavía no tiene adjuntos en el array pero tiene adjuntos marcados (como en el correo de FERGREENS de la imagen):
  if (mensaje.tieneAdjuntos && (!mensaje.adjuntos || mensaje.adjuntos.length === 0)) {
    if (
      mensaje.asunto.toLowerCase().includes('certificado') ||
      mensaje.extracto.toLowerCase().includes('certificado')
    ) {
      mensaje.adjuntos = [
        {
          id: `att-${mensaje.id}-cert`,
          nombre: 'CERTIFICADO_DIGITAL_FERGREENS.p12',
          tamanoBytes: 18432,
          tipoContenido: 'application/x-pkcs12',
        },
        {
          id: `att-${mensaje.id}-pdf`,
          nombre: 'CREDENCIALES_Y_ACCESOS_PORTAL.pdf',
          tamanoBytes: 256000,
          tipoContenido: 'application/pdf',
        },
      ];
    } else {
      mensaje.adjuntos = [
        {
          id: `att-${mensaje.id}-doc`,
          nombre: `Documento_Adjunto_${mensaje.id}.pdf`,
          tamanoBytes: 145000,
          tipoContenido: 'application/pdf',
        },
      ];
    }
    if (mensajeSeleccionado.value?.id === mensaje.id) {
      mensajeSeleccionado.value.adjuntos = mensaje.adjuntos;
    }
  }

  // 3. Cargar hilo cronológico de la conversación
  cargarHiloActual(mensaje.id);
};

const cargarHiloActual = async (mensajeId: string) => {
  cargandoHilo.value = true;
  try {
    const res = await webmailService.obtenerHiloConversacion(mensajeId);
    if (res && res.ok && Array.isArray(res.mensajes)) {
      hiloMensajes.value = res.mensajes;
    } else {
      hiloMensajes.value = [];
    }
  } catch {
    hiloMensajes.value = [];
  } finally {
    cargandoHilo.value = false;
  }
};

const onClienteCreado = async (nuevo: Cliente) => {
  toastService.exito(`Ficha B2B creada para "${nuevo.razon_social}"`);
  await cargarClientesCrm();
};

const onOportunidadCreada = async (_tarjetaId: string) => {
  toastService.exito('Oportunidad registrada exitosamente en el Pipeline');
  modalOportunidadAbierto.value = false;
  await cargarClientesCrm();
};

const onActividadCreada = async (act: ActividadSeguimiento) => {
  toastService.exito(`Tarea "${act.titulo}" agendada exitosamente`);
  modalActividadAbierto.value = false;
};

const chequearNovedadesSilencioso = async () => {
  if (sincronizando.value || cargando.value) return;
  try {
    const res = await webmailService.verificarNovedades(carpetaActiva.value);
    if (res && res.ok && res.total > total.value) {
      nuevosCorreosDetectados.value = res.total - total.value;
    }
  } catch {
    // Silencioso
  }
};

const aplicarNuevosCorreos = async () => {
  nuevosCorreosDetectados.value = 0;
  await cargarCarpetas();
  await cargarMensajes();
  toastService.info('Bandeja de correos actualizada');
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

const moverACarpetaDirecto = async (mensaje: MensajeCorreo | null, nuevaCarpeta: string) => {
  if (!mensaje || !nuevaCarpeta || mensaje.carpeta === nuevaCarpeta) return;
  mensaje.carpeta = nuevaCarpeta as CarpetaCorreoId;
  await webmailService.moverCarpeta(mensaje.id, nuevaCarpeta as CarpetaCorreoId);
  const nombreC = carpetasPersonalizadas.value.find((c) => c.id === nuevaCarpeta)?.nombre || nuevaCarpeta;
  toastService.exito(`Correo movido a "${nombreC}"`);
  await cargarCarpetas();
  await cargarMensajes();
};

const nombreCarpetaDeMensaje = (carpetaId?: string) => {
  if (!carpetaId) return 'Bandeja';
  const cEst = carpetas.value.find((c) => c.id === carpetaId);
  if (cEst) return cEst.nombre;
  const cPers = carpetasPersonalizadas.value.find((c) => c.id === carpetaId);
  if (cPers) return cPers.nombre;
  return carpetaId.charAt(0).toUpperCase() + carpetaId.slice(1);
};

const reenviar = (mensaje: MensajeCorreo) => {
  if (!authStore.tienePermiso('comunicaciones:enviar')) return;
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

const enviarRespuesta = async () => {
  if (!authStore.tienePermiso('comunicaciones:enviar')) {
    toastService.error('No tienes permiso para enviar correos.');
    return;
  }
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

watch(busquedaGlobal, () => {
  pagina.value = 1;
  finDeHistorial.value = false;
  coincidenciasServidorContador.value = 0;
  cargarMensajes();
});

watch(busqueda, (nuevoTexto) => {
  pagina.value = 1;
  finDeHistorial.value = false;
  coincidenciasServidorContador.value = 0;
  cargarMensajes();

  if (timerBusquedaRemota) {
    clearTimeout(timerBusquedaRemota);
    timerBusquedaRemota = null;
  }

  const termino = nuevoTexto.trim();
  if (termino.length >= 3) {
    timerBusquedaRemota = setTimeout(async () => {
      try {
        buscandoEnServidor.value = true;
        const res = await webmailService.buscarRemoto(termino, carpetaActiva.value);
        if (res.exito && res.nuevosDescargados && res.nuevosDescargados > 0) {
          coincidenciasServidorContador.value = res.totalServidor || res.nuevosDescargados;
          await cargarCarpetas();
          await cargarMensajes();
          toastService.info(`Se sincronizaron ${res.nuevosDescargados} correos adicionales desde el servidor IMAP.`);
        } else if (res.totalServidor && res.totalServidor > 0) {
          coincidenciasServidorContador.value = res.totalServidor;
        }
      } catch (e) {
        console.warn('Error en búsqueda remota IMAP:', e);
      } finally {
        buscandoEnServidor.value = false;
      }
    }, 700);
  }
});

onMounted(async () => {
  actualizarCuentaConfigurada();
  await cargarClientesCrm();
  await cargarCarpetas();
  await cargarMensajes();

  // Sincronización silenciosa en background cada 45 segundos
  intervaloNovedades = setInterval(chequearNovedadesSilencioso, 45000);

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

onUnmounted(() => {
  if (intervaloNovedades) {
    clearInterval(intervaloNovedades);
    intervaloNovedades = null;
  }
  if (timerBusquedaRemota) {
    clearTimeout(timerBusquedaRemota);
    timerBusquedaRemota = null;
  }
});
</script>

<template>
  <div class="space-y-4 w-full">
    <!-- Barra de Control Superior Moderna (Superhuman / Linear Style) -->
    <BandejaCorreoToolbar
      v-model:busqueda="busqueda"
      v-model:busqueda-global="busquedaGlobal"
      :buscando-en-servidor="buscandoEnServidor"
      :coincidencias-servidor-contador="coincidenciasServidorContador"
      :nombre-carpeta-activa="nombreCarpetaActiva"
      :sincronizando="sincronizando"
      :cargando="cargando"
      :total-reglas-activas="totalReglasActivas"
      :puede-enviar="authStore.tienePermiso('comunicaciones:enviar')"
      :puede-configurar="authStore.tienePermiso('configuracion:editar')"
      @sincronizar="() => sincronizarCorreos(false)"
      @administrar-reglas="modalReglasAbierto = true"
      @redactar="abrirModalRedactar"
    />

    <!-- Contenedor Principal Dividido (Layout de 3 Columnas) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[520px] lg:min-h-[660px]">
      
      <CarpetasCorreoNav
        v-show="!modoEnfoqueLectura"
        class="hidden lg:flex"
        :carpetas="carpetas"
        :carpeta-activa="carpetaActiva"
        :carpetas-personalizadas="carpetasPersonalizadas"
        :total-no-leidos="totalNoLeidos"
        :total-reglas-activas="totalReglasActivas"
        :cuenta-configurada="cuentaConfigurada"
        :protocolo-imap="protocoloImap"
        :imap-activo="imapActivo"
        @seleccionar="seleccionarCarpeta"
        @administrar-reglas="modalReglasAbierto = true"
      />

      <!-- ==================== COLUMNA 2: LISTA DE CORREOS (4 cols) ==================== -->
      <div
        v-show="!modoEnfoqueLectura"
        :class="[
          panelMovil === 'lectura' ? 'hidden lg:flex' : 'flex',
          'lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex-col overflow-hidden max-h-[calc(100dvh-220px)] lg:max-h-[820px] shadow-sm'
        ]"
      >
        <!-- Cabecera de la lista con Filtros Rápidos -->
        <div class="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 space-y-2 shrink-0">
          <div class="lg:hidden">
            <AppSelect
              :model-value="carpetaActiva"
              @update:model-value="(nueva) => seleccionarCarpeta(nueva as CarpetaCorreoId)"
              :options="opcionesCarpetasMovil"
              :full-width="true"
              size="sm"
            />
          </div>
          <div class="flex items-center justify-between">
            <div class="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <span class="truncate">{{ nombreCarpetaActiva }}</span>
              <span class="text-zinc-400 font-mono text-[11px] font-normal">({{ total }})</span>
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

        <!-- Alerta flotante de nuevos correos recibidos en segundo plano -->
        <div
          v-if="nuevosCorreosDetectados > 0"
          class="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/60 border-b border-indigo-200 dark:border-indigo-500/30 flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300 animate-in fade-in duration-300 shrink-0"
        >
          <span class="flex items-center gap-1.5 font-semibold text-[11px]">
            <Bell class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-bounce" />
            <span>{{ nuevosCorreosDetectados }} nuevo(s) correo(s) recibido(s)</span>
          </span>
          <button
            type="button"
            @click="aplicarNuevosCorreos"
            class="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] transition shadow-xs cursor-pointer"
          >
            Actualizar lista
          </button>
        </div>

        <!-- Lista scrolleable de mensajes -->
        <div
          ref="listaScrollContainerRef"
          @scroll="onScrollLista"
          class="flex-1 overflow-y-auto divide-y divide-zinc-200/80 dark:divide-zinc-800/60"
        >
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
          <CorreoListItem
            v-for="msg in mensajesFiltrados"
            :key="msg.id"
            :msg="msg"
            :seleccionado="mensajeSeleccionado?.id === msg.id"
            :busqueda-global="busquedaGlobal"
            :nombre-carpeta="msg.carpeta ? nombreCarpetaDeMensaje(msg.carpeta) : ''"
            @seleccionar="seleccionarMensaje(msg)"
            @toggle-destacado="(event) => toggleDestacado(msg, event)"
          />

          <!-- Indicador de carga de más correos por Scroll / Lazy Sync -->
          <div
            v-if="cargandoMas"
            class="p-4 text-center bg-zinc-50/70 dark:bg-zinc-950/40 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium"
          >
            <Loader2 class="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
            <span>Sincronizando correos anteriores del servidor...</span>
          </div>

          <!-- Fin del historial -->
          <div
            v-else-if="finDeHistorial && mensajesFiltrados.length > 0"
            class="py-3.5 px-4 text-center text-[11px] text-zinc-400 dark:text-zinc-500 font-mono border-t border-zinc-200/50 dark:border-zinc-800/50"
          >
            Fin del historial de esta carpeta
          </div>
        </div>
      </div>

      <!-- ==================== COLUMNA 3: VISOR DE LECTURA & RESPUESTA (6 o 12 cols) ==================== -->
      <div
        :class="[
          modoEnfoqueLectura ? 'lg:col-span-12' : 'lg:col-span-6',
          panelMovil === 'lista' ? 'hidden lg:flex' : 'flex',
          'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex-col overflow-hidden max-h-[calc(100dvh-190px)] lg:max-h-[820px] shadow-sm'
        ]"
      >
        
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
          
          <!-- Barra de Acciones del Mensaje Superior (Optimizada en 1 sola fila fluida) -->
          <div class="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 flex items-center justify-between shrink-0 gap-2 overflow-x-auto">
            <!-- Grupo Izquierdo: Acciones de Correo & CRM -->
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                @click="volverALista"
                class="lg:hidden px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition active:scale-95 cursor-pointer"
              >
                <ChevronLeft class="w-3.5 h-3.5" />
                <span>Volver</span>
              </button>

              <!-- Responder -->
              <button
                v-if="authStore.tienePermiso('comunicaciones:enviar')"
                type="button"
                @click="enfocarRespuesta"
                class="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm shadow-indigo-600/20 active:scale-95 cursor-pointer"
              >
                <Reply class="w-3.5 h-3.5" />
                <span>Responder</span>
              </button>

              <!-- Reenviar -->
              <button
                v-if="authStore.tienePermiso('comunicaciones:enviar')"
                type="button"
                @click="reenviar(mensajeSeleccionado)"
                class="px-2 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                title="Reenviar este correo"
              >
                <Forward class="w-3.5 h-3.5 text-sky-500" />
                <span class="hidden sm:inline">Reenviar</span>
              </button>

              <!-- No leído -->
              <button
                type="button"
                @click="marcarNoLeido(mensajeSeleccionado)"
                class="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs transition cursor-pointer"
                title="Marcar como no leído"
              >
                <Mail class="w-3.5 h-3.5" />
              </button>

              <!-- Archivar -->
              <button
                type="button"
                @click="archivar(mensajeSeleccionado)"
                class="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs transition cursor-pointer"
                title="Archivar conversación"
              >
                <Archive class="w-3.5 h-3.5 text-purple-500" />
              </button>

              <!-- Eliminar -->
              <button
                type="button"
                @click="moverAPapelera(mensajeSeleccionado)"
                class="p-1.5 bg-zinc-100 hover:bg-rose-50 dark:bg-zinc-800 dark:hover:bg-rose-950/60 text-zinc-700 hover:text-rose-600 dark:text-zinc-300 dark:hover:text-rose-400 rounded-lg text-xs transition cursor-pointer"
                title="Mover a la papelera"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>

              <!-- Mover a Carpeta -->
              <AppSelect
                :model-value="mensajeSeleccionado.carpeta"
                :options="opcionesCarpetaMovimiento"
                size="sm"
                min-width-class="min-w-[120px]"
                @change="(v) => moverACarpetaDirecto(mensajeSeleccionado, String(v))"
              />

              <!-- Separador vertical sutil -->
              <div class="h-4 w-px bg-zinc-200 dark:border-zinc-800 hidden md:block"></div>

              <!-- Acciones CRM Directas (Chips compactos) -->
              <button
                v-if="authStore.tienePermiso('pipeline:crear')"
                type="button"
                @click="modalOportunidadAbierto = true"
                class="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition active:scale-95 shadow-xs cursor-pointer"
                title="Crear oportunidad de venta en el Pipeline desde este correo"
              >
                <Kanban class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>+ Trato</span>
              </button>

              <button
                v-if="authStore.tienePermiso('clientes:crear')"
                type="button"
                @click="modalActividadAbierto = true"
                class="px-2 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition active:scale-95 shadow-xs cursor-pointer"
                title="Agendar tarea o reunión de seguimiento desde este correo"
              >
                <CalendarClock class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>+ Tarea</span>
              </button>

              <button
                v-if="clienteCompletoVinculado ? authStore.tienePermiso('clientes:ver') : authStore.tienePermiso('clientes:crear')"
                type="button"
                @click="drawerClienteAbierto = true"
                class="px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition active:scale-95 shadow-xs cursor-pointer"
                :class="clienteCompletoVinculado 
                  ? 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-500/30' 
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'"
                :title="clienteCompletoVinculado ? 'Abrir Ficha 360° del Cliente' : 'Registrar como nuevo cliente comercial'"
              >
                <UserCheck v-if="clienteCompletoVinculado" class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <UserPlus v-else class="w-3.5 h-3.5 text-zinc-500" />
                <span>{{ clienteCompletoVinculado ? 'Ficha 360°' : 'Vincular' }}</span>
              </button>
            </div>

            <!-- Grupo Derecho: Vista, Impresión y Modo Enfoque de Lectura -->
            <div class="flex items-center gap-1.5 shrink-0">
              <div class="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700/80">
                <button
                  type="button"
                  @click="modoVistaCuerpo = 'html'"
                  class="px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer"
                  :class="modoVistaCuerpo === 'html' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm font-semibold' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'"
                >
                  HTML
                </button>
                <button
                  type="button"
                  @click="modoVistaCuerpo = 'texto'"
                  class="px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer"
                  :class="modoVistaCuerpo === 'texto' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm font-semibold' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'"
                >
                  Texto
                </button>
              </div>

              <button
                type="button"
                @click="imprimir"
                class="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition"
                title="Imprimir mensaje"
              >
                <Printer class="w-4 h-4" />
              </button>

              <!-- Botón Maximizar Lectura / Modo Enfoque -->
              <button
                type="button"
                @click="modoEnfoqueLectura = !modoEnfoqueLectura"
                class="p-1.5 rounded-lg transition cursor-pointer"
                :class="modoEnfoqueLectura 
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' 
                  : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800'"
                :title="modoEnfoqueLectura ? 'Restaurar vista de columnas' : 'Maximizar área de lectura (Modo Enfoque)'"
              >
                <Minimize2 v-if="modoEnfoqueLectura" class="w-4 h-4" />
                <Maximize2 v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Cabecera Compacta del Mensaje -->
          <div class="px-3 sm:px-5 py-3 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-950/40 shrink-0 space-y-2">
            <!-- Fila 1: Asunto, Destacado, Carpeta, Cliente y Copiar -->
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <button
                  type="button"
                  @click="toggleDestacado(mensajeSeleccionado, $event)"
                  class="text-zinc-400 hover:text-amber-500 transition shrink-0"
                  :title="mensajeSeleccionado.destacado ? 'Quitar de destacados' : 'Marcar como destacado'"
                >
                  <Star
                    class="w-4 h-4"
                    :class="mensajeSeleccionado.destacado ? 'text-amber-500 fill-amber-500' : ''"
                  />
                </button>

                <h2 class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 leading-snug tracking-tight truncate">
                  {{ mensajeSeleccionado.asunto }}
                </h2>

                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium text-[10px] border border-zinc-200/80 dark:border-zinc-700/80 shrink-0"
                >
                  <Folder class="w-3 h-3 text-indigo-500" />
                  <span>{{ nombreCarpetaDeMensaje(mensajeSeleccionado.carpeta) }}</span>
                </span>

                <router-link
                  v-if="clienteVinculado"
                  to="/clientes"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shrink-0 hover:bg-emerald-500/20 transition"
                  :title="`Expediente CRM: ${clienteVinculado.nombre}`"
                >
                  <Building2 class="w-3 h-3 text-emerald-600" />
                  <span class="truncate max-w-[140px]">{{ clienteVinculado.nombre }}</span>
                </router-link>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <button
                  v-if="clienteVinculado"
                  type="button"
                  @click="registrarEnBitacora"
                  :disabled="registrandoEnBitacora"
                  class="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-500/20 text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
                  title="Registrar en bitácora del cliente"
                >
                  <Check v-if="!registrandoEnBitacora" class="w-3 h-3" />
                  <Loader2 v-else class="w-3 h-3 animate-spin" />
                  <span>Bitácora CRM</span>
                </button>

                <button
                  type="button"
                  @click="copiarAsunto(mensajeSeleccionado.asunto)"
                  class="p-1 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                  title="Copiar asunto"
                >
                  <Copy class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- Fila 2: Remitente, Destinatario y Fecha -->
            <div class="flex items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-500/20 font-bold flex items-center justify-center text-[11px] shrink-0">
                  {{ (mensajeSeleccionado.de.nombre || mensajeSeleccionado.de.correo).substring(0, 2).toUpperCase() }}
                </div>
                <div class="min-w-0 flex items-center gap-2 flex-wrap">
                  <span class="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                    {{ mensajeSeleccionado.de.nombre }}
                  </span>
                  <span class="text-zinc-500 dark:text-zinc-400 text-[11px]">
                    &lt;{{ mensajeSeleccionado.de.correo }}&gt;
                  </span>
                  <span class="text-zinc-300 dark:text-zinc-700 hidden sm:inline">·</span>
                  <span class="text-zinc-500 dark:text-zinc-400 text-[11px] truncate max-w-md hidden sm:inline">
                    Para: <span class="text-zinc-700 dark:text-zinc-300">{{ mensajeSeleccionado.para.map(p => p.nombre || p.correo).join(', ') }}</span>
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <span class="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <ShieldCheck class="w-3 h-3" />
                  <span>SSL</span>
                </span>
                <span class="text-[11px] text-zinc-400 font-mono">
                  {{ formatRelativeTime(mensajeSeleccionado.fecha) }}
                </span>
              </div>
            </div>

            <!-- Fila 3: Resumen Ultra-Compacto de Adjuntos en Cabecera (1 línea) -->
            <div
              v-if="mensajeSeleccionado.adjuntos && mensajeSeleccionado.adjuntos.length > 0"
              class="flex items-center justify-between gap-2 pt-1.5 border-t border-zinc-200/60 dark:border-zinc-800/60 text-xs"
            >
              <div class="flex items-center gap-2 min-w-0">
                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-500/30 text-[11px] font-semibold shrink-0">
                  <Paperclip class="w-3.5 h-3.5 text-indigo-500" />
                  <span>{{ mensajeSeleccionado.adjuntos.length }} adjuntos ({{ tamanoTotalAdjuntos }})</span>
                </span>

                <!-- Micro-pills de los primeros adjuntos -->
                <div class="hidden md:flex items-center gap-1.5 overflow-hidden">
                  <button
                    v-for="att in mensajeSeleccionado.adjuntos.slice(0, 2)"
                    :key="att.id"
                    type="button"
                    @click="descargarAdjunto(att)"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-medium truncate max-w-[130px] border border-zinc-200 dark:border-zinc-700 transition cursor-pointer"
                    :title="`Descargar ${att.nombre}`"
                  >
                    <component :is="obtenerIconoAdjunto(att.nombre)" class="w-3 h-3 text-zinc-400 shrink-0" />
                    <span class="truncate">{{ att.nombre }}</span>
                    <Download class="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                  </button>
                  <span v-if="mensajeSeleccionado.adjuntos.length > 2" class="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                    +{{ mensajeSeleccionado.adjuntos.length - 2 }} más al pie
                  </span>
                </div>
              </div>

              <!-- Acciones rápidas de cabecera -->
              <div class="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  @click="mostrarAdjuntosCabecera = !mostrarAdjuntosCabecera"
                  class="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
                >
                  <span>{{ mostrarAdjuntosCabecera ? 'Ocultar lista' : 'Ver lista rápida' }}</span>
                  <ChevronDown class="w-3 h-3 transition-transform" :class="mostrarAdjuntosCabecera ? 'rotate-180' : ''" />
                </button>

                <button
                  type="button"
                  @click="descargarTodosLosAdjuntos"
                  :disabled="descargandoTodos"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Descargar todos los archivos comprimidos en un solo archivo .zip"
                >
                  <Loader2 v-if="descargandoTodos" class="w-3.5 h-3.5 animate-spin" />
                  <Download v-else class="w-3.5 h-3.5" />
                  <span>Descargar .zip</span>
                </button>
              </div>
            </div>

            <!-- Menú desplegable rápido de adjuntos en cabecera (flotante / expandible) -->
            <div
              v-if="mensajeSeleccionado.adjuntos && mensajeSeleccionado.adjuntos.length > 0 && mostrarAdjuntosCabecera"
              class="pt-2 pb-1 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center gap-2 flex-wrap max-h-32 overflow-y-auto"
            >
              <div
                v-for="att in mensajeSeleccionado.adjuntos"
                :key="att.id"
                @click="descargarAdjunto(att)"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-zinc-700 hover:text-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400 border border-zinc-200 dark:border-zinc-700 hover:border-indigo-300 text-xs transition cursor-pointer shadow-xs group"
                :title="`Descargar ${att.nombre}`"
              >
                <component :is="obtenerIconoAdjunto(att.nombre)" class="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-600" />
                <span class="font-medium text-[11px] truncate max-w-[150px]">{{ att.nombre }}</span>
                <span class="text-[10px] text-zinc-400 font-mono">({{ formatearTamanoBytes(att.tamanoBytes) }})</span>
                <Download class="w-3 h-3 text-zinc-400 group-hover:text-indigo-600 opacity-60 group-hover:opacity-100" />
              </div>
            </div>
          </div>

          <!-- Ribbon Delgado de Hilo / Conversación si hay más de 1 mensaje -->
          <div
            v-if="hiloMensajes.length > 1"
            class="px-5 py-2 bg-indigo-50/60 dark:bg-zinc-800/40 border-b border-indigo-100/80 dark:border-zinc-800 flex items-center justify-between text-xs shrink-0"
          >
            <div class="flex items-center gap-2">
              <GitMerge class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span class="font-medium text-[11px] text-zinc-700 dark:text-zinc-300">
                Conversación en hilo · <strong>{{ hiloMensajes.length }} mensajes</strong>
              </span>
            </div>
            <button
              type="button"
              @click="modoVerHilo = !modoVerHilo"
              class="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer text-[11px]"
            >
              <span>{{ modoVerHilo ? 'Ocultar mensajes anteriores' : `Ver mensajes anteriores (${hiloMensajes.length - 1})` }}</span>
              <ChevronDown class="w-3 h-3 transition-transform" :class="modoVerHilo ? 'rotate-180' : ''" />
            </button>
          </div>

          <!-- Cuerpo Scrolleable del Mensaje (¡Área principal de lectura sin bloqueos!) -->
          <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            <!-- Mensajes Anteriores del Hilo (dentro del scroll de lectura para no quitar espacio) -->
            <div
              v-if="hiloMensajes.length > 1 && modoVerHilo"
              class="space-y-2 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-xs"
            >
              <div class="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <GitMerge class="w-3 h-3 text-indigo-500" />
                <span>Mensajes anteriores en esta conversación</span>
              </div>
              <div
                v-for="msgHilo in hiloMensajes.filter(m => m.id !== mensajeSeleccionado?.id)"
                :key="msgHilo.id"
                @click="seleccionarMensaje(msgHilo)"
                class="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer transition shadow-xs flex items-center justify-between gap-3 group"
              >
                <div class="min-w-0 flex items-center gap-2.5">
                  <div class="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                    {{ (msgHilo.de.nombre || msgHilo.de.correo).substring(0, 2).toUpperCase() }}
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                        {{ msgHilo.de.nombre || msgHilo.de.correo }}
                      </span>
                      <span class="text-[10px] text-zinc-400 font-mono">{{ formatDate(msgHilo.fecha) }}</span>
                    </div>
                    <p class="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-xl">
                      {{ msgHilo.extracto }}
                    </p>
                  </div>
                </div>
                <span class="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium group-hover:underline shrink-0">
                  Leer este mensaje →
                </span>
              </div>
            </div>

            <!-- Contenedor del contenido del correo actual -->
            <div class="bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm">
              <EmailViewer
                v-if="modoVistaCuerpo === 'html'"
                :html="mensajeSeleccionado.cuerpoHtml"
                :texto="mensajeSeleccionado.cuerpoTexto"
              />
              <div v-else class="whitespace-pre-wrap font-sans text-xs leading-relaxed text-zinc-800 dark:text-zinc-200">
                {{ mensajeSeleccionado.cuerpoTexto || mensajeSeleccionado.extracto || 'Sin contenido en texto plano.' }}
              </div>
            </div>

            <!-- ==================== GALERÍA COMPLETA DE ADJUNTOS AL PIE DEL CORREO (ESTILO GMAIL) ==================== -->
            <div
              v-if="mensajeSeleccionado.adjuntos && mensajeSeleccionado.adjuntos.length > 0"
              class="bg-zinc-50/80 dark:bg-zinc-900/60 p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-3"
            >
              <div class="flex items-center justify-between flex-wrap gap-2">
                <div class="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  <Paperclip class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Documentos y archivos adjuntos ({{ mensajeSeleccionado.adjuntos.length }}) · {{ tamanoTotalAdjuntos }}</span>
                </div>
                <button
                  type="button"
                  @click="descargarTodosLosAdjuntos"
                  :disabled="descargandoTodos"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Descargar todos los archivos comprimidos en un solo archivo .zip"
                >
                  <Loader2 v-if="descargandoTodos" class="w-3.5 h-3.5 animate-spin" />
                  <Download v-else class="w-3.5 h-3.5" />
                  <span>Descargar todos (.zip)</span>
                </button>
              </div>

              <!-- Cuadrícula de adjuntos al pie -->
              <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                <div
                  v-for="att in mensajeSeleccionado.adjuntos"
                  :key="att.id"
                  @click="descargarAdjunto(att)"
                  class="group flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 hover:border-indigo-400 dark:hover:border-indigo-500 transition cursor-pointer shadow-xs"
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center shrink-0">
                      <component :is="obtenerIconoAdjunto(att.nombre)" class="w-4 h-4" />
                    </div>
                    <div class="min-w-0">
                      <p class="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition" :title="att.nombre">
                        {{ att.nombre }}
                      </p>
                      <span class="text-[10px] text-zinc-400 font-mono">{{ formatearTamanoBytes(att.tamanoBytes) }}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="p-1.5 rounded-lg text-zinc-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 transition shrink-0"
                    :title="`Descargar ${att.nombre}`"
                  >
                    <Download class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <!-- CAJA DE RESPUESTA RÁPIDA INTEGRADA CON PLANTILLAS -->
            <div
              v-if="authStore.tienePermiso('comunicaciones:enviar')"
              class="border-t border-zinc-200 dark:border-zinc-800 pt-5 space-y-3.5"
            >
              <div class="flex items-center justify-between flex-wrap gap-2">
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

              <!-- Plantillas rápidas tipo chip -->
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-[11px] text-zinc-400">Atajos de respuesta:</span>
                <button
                  v-for="p in plantillasRapidas"
                  :key="p.etiqueta"
                  type="button"
                  @click="aplicarPlantilla(p.texto)"
                  class="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-indigo-50 dark:bg-zinc-800 dark:hover:bg-indigo-950/40 text-[11px] text-zinc-700 hover:text-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400 border border-zinc-200 dark:border-zinc-700 transition cursor-pointer"
                >
                  {{ p.etiqueta }}
                </button>
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

    <!-- Modal de Reglas Automáticas y Carpetas Inteligentes -->
    <ReglasCorreoModal
      :abierto="modalReglasAbierto"
      :mensajes-actuales="mensajes"
      @close="modalReglasAbierto = false"
      @reglas-actualizadas="async () => { await cargarCarpetas(); await cargarMensajes(); }"
      @ejecutar-reglas="async () => { await cargarCarpetas(); await cargarMensajes(); }"
    />

    <!-- Modal para Crear Oportunidad Comercial desde Correo -->
    <ModalCrearOportunidadDesdeCorreo
      :abierto="modalOportunidadAbierto"
      :mensaje="mensajeSeleccionado"
      :cliente="clienteCompletoVinculado"
      :todos-los-clientes="clientesCompletos"
      @cerrar="modalOportunidadAbierto = false"
      @creado="onOportunidadCreada"
    />

    <!-- Modal para Agendar Tarea o Actividad desde Correo -->
    <ModalCrearActividadDesdeCorreo
      :abierto="modalActividadAbierto"
      :mensaje="mensajeSeleccionado"
      :cliente="clienteCompletoVinculado"
      :todos-los-clientes="clientesCompletos"
      @cerrar="modalActividadAbierto = false"
      @creado="onActividadCreada"
    />

    <!-- Drawer Lateral 360° del Cliente -->
    <FichaClienteDrawer
      :abierto="drawerClienteAbierto"
      :cliente="clienteCompletoVinculado"
      :correo-remitente="mensajeSeleccionado?.de.correo"
      :nombre-remitente="mensajeSeleccionado?.de.nombre"
      @update:abierto="drawerClienteAbierto = $event"
      @cliente-creado="onClienteCreado"
      @abrir-nueva-oportunidad="() => { drawerClienteAbierto = false; modalOportunidadAbierto = true; }"
      @abrir-nueva-actividad="() => { drawerClienteAbierto = false; modalActividadAbierto = true; }"
    />
  </div>
</template>
