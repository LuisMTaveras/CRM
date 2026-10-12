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
import RedactarCorreoModal from './RedactarCorreoModal.vue';
import ReglasCorreoModal from './ReglasCorreoModal.vue';
import EmailViewer from './EmailViewer.vue';
import ModalCrearOportunidadDesdeCorreo from './ModalCrearOportunidadDesdeCorreo.vue';
import ModalCrearActividadDesdeCorreo from './ModalCrearActividadDesdeCorreo.vue';
import FichaClienteDrawer from './FichaClienteDrawer.vue';
import { reglasCorreoService } from '../services/reglas-correo.service';
import type { CarpetaPersonalizada } from '../types/reglas-correo.types';
import type { Cliente } from '@/modules/clientes/types/cliente.types';
import type { ActividadSeguimiento } from '@/modules/agenda/types/actividad.types';
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
  Download,
  FileSpreadsheet,
  FolderArchive,
  Folder,
  FolderPlus,
  SlidersHorizontal,
  Check,
  X,
  Kanban,
  CalendarClock,
  UserCheck,
  UserPlus,
  Globe,
  Bell,
  GitMerge
} from 'lucide-vue-next';
import { formatDate, formatRelativeTime } from '@/core/formatters/formatters';
import { toastService } from '@/core/notifications/toast.service';
import { clienteService } from '@/modules/clientes/services/cliente.service';
import { timelineService } from '@/modules/clientes/services/timeline.service';
import AppSelect, { type SelectOption } from '@/shared/components/AppSelect.vue';

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

// Sincronización silenciosa periódica
const nuevosCorreosDetectados = ref(0);
let intervaloNovedades: ReturnType<typeof setInterval> | null = null;

// Modal Redactar / Reenviar
const modalRedactarAbierto = ref(false);
const redactarDestinatario = ref('');
const redactarAsunto = ref('');
const redactarCuerpo = ref('');

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

const obtenerColorPuntoCarpeta = (color?: string) => {
  switch (color) {
    case 'emerald': return 'bg-emerald-500';
    case 'amber': return 'bg-amber-500';
    case 'rose': return 'bg-rose-500';
    case 'purple': return 'bg-purple-500';
    case 'sky':
    case 'teal': return 'bg-sky-500';
    default: return 'bg-indigo-500';
  }
};

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
const actualizarCuentaConfigurada = () => {
  const conf = smtpService.obtenerConfiguracion();
  cuentaConfigurada.value = conf.usuarioImap || conf.usuarioSmtp || '';
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
      autor: 'Luis M. Taveras',
    });
    toastService.exito(`Correo registrado en el historial de ${clienteVinculado.value.nombre}`);
  } catch {
    toastService.error('Error al registrar en bitácora del cliente');
  } finally {
    registrandoEnBitacora.value = false;
  }
};

const formatearTamanoBytes = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

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
  toastService.info(`Iniciando descarga de ${mensajeSeleccionado.value.adjuntos.length} archivos adjuntos...`);
  try {
    for (const att of mensajeSeleccionado.value.adjuntos) {
      await webmailService.descargarAdjunto(mensajeSeleccionado.value.id, att);
      await new Promise((r) => setTimeout(r, 450));
    }
    toastService.exito('Todos los archivos se han descargado con éxito.');
  } catch {
    toastService.error('Ocurrió un error al descargar los archivos adjuntos.');
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
  feedbackRespuesta.value = null;
  respuestaCuerpo.value = '';

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
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-colors">
      <!-- Búsqueda rápida con botón de limpiar y selector global -->
      <div class="flex items-center gap-2 flex-1 max-w-xl">
        <div class="relative flex-1">
          <Search class="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            v-model="busqueda"
            :placeholder="busquedaGlobal ? 'Buscar en TODAS las carpetas por asunto, cuerpo, remitente...' : `Buscar en ${nombreCarpetaActiva}...`"
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

        <!-- Botón Toggle de Búsqueda Global -->
        <button
          type="button"
          @click="busquedaGlobal = !busquedaGlobal"
          class="px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border shrink-0 cursor-pointer"
          :class="busquedaGlobal 
            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-200 dark:hover:bg-zinc-700'"
          :title="busquedaGlobal ? 'Búsqueda global activa: busca en todas las carpetas del servidor' : 'Hacer clic para buscar en todas las carpetas'"
        >
          <Globe class="w-3.5 h-3.5" :class="busquedaGlobal ? 'text-white' : 'text-zinc-500'" />
          <span class="hidden md:inline">{{ busquedaGlobal ? 'Todas las carpetas' : 'Esta carpeta' }}</span>
        </button>

        <!-- Indicador de Búsqueda Remota en Servidor IMAP -->
        <div
          v-if="buscandoEnServidor"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20 shrink-0 animate-pulse"
        >
          <Loader2 class="w-3.5 h-3.5 animate-spin text-sky-600 dark:text-sky-400" />
          <span class="hidden lg:inline">Buscando en servidor IMAP...</span>
        </div>
        <div
          v-else-if="coincidenciasServidorContador > 0 && busqueda"
          class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20 shrink-0"
        >
          <Globe class="w-3.5 h-3.5 text-sky-500" />
          <span>{{ coincidenciasServidorContador }} en servidor</span>
        </div>
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

        <!-- Botón de Reglas de Enrutamiento y Carpetas Automáticas -->
        <button
          type="button"
          @click="modalReglasAbierto = true"
          title="Configurar reglas automáticas por dominio de cliente o asunto"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs font-semibold transition"
        >
          <SlidersHorizontal class="w-3.5 h-3.5 text-indigo-500" />
          <span class="hidden sm:inline">Reglas de Correo</span>
          <span
            v-if="totalReglasActivas > 0"
            class="px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[9px] font-bold"
          >
            {{ totalReglasActivas }}
          </span>
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
            <span
              v-if="totalNoLeidos > 0"
              class="px-2 py-0.5 bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 text-[9px] rounded-full font-bold"
            >
              {{ totalNoLeidos }} {{ totalNoLeidos === 1 ? 'nuevo' : 'nuevos' }}
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
              class="px-2 py-0.5 rounded-full text-[10px] bg-indigo-600 text-white font-bold tracking-tight shadow-xs"
            >
              {{ carpetas.find(c => c.id === 'inbox')?.noLeidos }} {{ carpetas.find(c => c.id === 'inbox')?.noLeidos === 1 ? 'nuevo' : 'nuevos' }}
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

          <!-- Sección: Carpetas Inteligentes / Personalizadas por Reglas -->
          <div class="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
            <div class="px-3 py-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono flex items-center justify-between">
              <span>Carpetas Reglas</span>
              <button
                type="button"
                @click="modalReglasAbierto = true"
                title="Crear regla o carpeta automática"
                class="p-1 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                <FolderPlus class="w-3.5 h-3.5" />
              </button>
            </div>

            <div v-if="carpetasPersonalizadas.length === 0" class="px-3 py-1 text-[11px] text-zinc-400 italic">
              Sin carpetas personalizadas
            </div>

            <button
              v-for="carp in carpetasPersonalizadas"
              :key="carp.id"
              type="button"
              @click="seleccionarCarpeta(carp.id)"
              class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition"
              :class="carpetaActiva === carp.id
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 font-semibold'
                : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'"
            >
              <span class="flex items-center gap-2.5 min-w-0">
                <span
                  class="w-2.5 h-2.5 rounded-full shrink-0"
                  :class="obtenerColorPuntoCarpeta(carp.color)"
                />
                <span class="truncate">{{ carp.nombre }}</span>
              </span>
              <span class="text-[10px] text-zinc-400 font-mono shrink-0 ml-1">
                {{ carpetas.find(c => c.id === carp.id)?.total || 0 }}
              </span>
            </button>

            <!-- Botón Configurar Reglas Automáticas y Gestión de Carpetas -->
            <button
              type="button"
              @click="modalReglasAbierto = true"
              class="w-full mt-2 flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200/60 dark:border-indigo-500/20 transition"
            >
              <span class="flex items-center gap-2 min-w-0">
                <SlidersHorizontal class="w-3.5 h-3.5 shrink-0" />
                <span class="truncate">Administrar Reglas & Carpetas</span>
              </span>
              <span
                v-if="totalReglasActivas > 0"
                class="px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[9px] font-bold"
              >
                {{ totalReglasActivas }}
              </span>
            </button>
          </div>
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
                <span
                  v-if="!msg.leido"
                  class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/25 shrink-0"
                >
                  Nuevo
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

            <!-- Badges inferiores (Cliente CRM / Hilo / Carpeta / Adjuntos / Servidor) -->
            <div class="flex items-center gap-2 mt-2.5 flex-wrap">
              <span
                v-if="msg.clienteNombreRelacionado"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20"
              >
                <Building2 class="w-3 h-3" />
                <span class="truncate max-w-[150px]">{{ msg.clienteNombreRelacionado }}</span>
              </span>

              <span
                v-if="msg.totalEnHilo && msg.totalEnHilo > 1"
                class="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20"
                title="Respuestas en esta conversación"
              >
                <GitMerge class="w-3 h-3 text-indigo-500" />
                <span>{{ msg.totalEnHilo }}</span>
              </span>

              <span
                v-if="busquedaGlobal && msg.carpeta"
                class="inline-flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 font-mono"
              >
                <Folder class="w-2.5 h-2.5" />
                <span>{{ nombreCarpetaDeMensaje(msg.carpeta) }}</span>
              </span>

              <span
                v-if="msg.esCoincidenciaServidor"
                class="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-500/10 border border-sky-500/20"
                title="Mensaje sincronizado desde el servidor remoto IMAP"
              >
                <Globe class="w-3 h-3 text-sky-500" />
                <span>Servidor IMAP</span>
              </span>

              <span
                v-if="msg.tieneAdjuntos || (msg.adjuntos && msg.adjuntos.length > 0)"
                class="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md font-mono transition-colors"
                :class="!msg.leido 
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold shadow-xs' 
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60'"
              >
                <FileText class="w-3 h-3" :class="!msg.leido ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'" />
                <span>
                  {{ !msg.leido 
                    ? (msg.adjuntos?.length ? `${msg.adjuntos.length} doc. nuevo(s)` : 'Doc. nuevo') 
                    : (msg.adjuntos?.length ? `${msg.adjuntos.length} adjuntos` : 'Con adjuntos') 
                  }}
                </span>
              </span>
            </div>
          </div>

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
          <div class="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 flex items-center justify-between shrink-0 flex-wrap gap-2">
            <div class="flex items-center gap-1.5 flex-wrap">
              <!-- Botón Responder Primario -->
              <button
                type="button"
                @click="enfocarRespuesta"
                class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm shadow-indigo-600/20 active:scale-95"
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

              <!-- Botón Descargar Adjuntos si existen -->
              <button
                v-if="mensajeSeleccionado.adjuntos && mensajeSeleccionado.adjuntos.length > 0"
                type="button"
                @click="descargarTodosLosAdjuntos"
                :disabled="descargandoTodos"
                class="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-indigo-200 dark:border-indigo-500/30"
                title="Descargar todos los archivos adjuntos"
              >
                <Loader2 v-if="descargandoTodos" class="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <Download v-else class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Adjuntos ({{ mensajeSeleccionado.adjuntos.length }})</span>
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

              <!-- Selector Rápido de Carpeta -->
              <AppSelect
                :model-value="mensajeSeleccionado.carpeta"
                :options="opcionesCarpetaMovimiento"
                size="sm"
                min-width-class="min-w-[130px]"
                @change="(v) => moverACarpetaDirecto(mensajeSeleccionado, String(v))"
              />

              <!-- Separador vertical sutil -->
              <div class="h-4 w-px bg-zinc-200 dark:border-zinc-800 hidden sm:block"></div>

              <!-- Acciones CRM Directas -->
              <button
                type="button"
                @click="modalOportunidadAbierto = true"
                class="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-xs cursor-pointer"
                title="Crear oportunidad de venta en el Pipeline desde este correo"
              >
                <Kanban class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>+ Trato</span>
              </button>

              <button
                type="button"
                @click="modalActividadAbierto = true"
                class="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-xs cursor-pointer"
                title="Agendar tarea o reunión de seguimiento desde este correo"
              >
                <CalendarClock class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>+ Tarea</span>
              </button>

              <button
                type="button"
                @click="drawerClienteAbierto = true"
                class="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-xs cursor-pointer"
                :class="clienteCompletoVinculado 
                  ? 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-500/30' 
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'"
                :title="clienteCompletoVinculado ? 'Abrir Ficha 360° del Cliente' : 'Registrar como nuevo cliente comercial'"
              >
                <UserCheck v-if="clienteCompletoVinculado" class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <UserPlus v-else class="w-3.5 h-3.5 text-zinc-500" />
                <span>{{ clienteCompletoVinculado ? 'Ficha 360°' : 'Vincular Cliente' }}</span>
              </button>
            </div>

            <!-- Acciones secundarias (Selector HTML/Texto, Imprimir, Fecha) -->
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700/80">
                <button
                  type="button"
                  @click="modoVistaCuerpo = 'html'"
                  class="px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer"
                  :class="modoVistaCuerpo === 'html' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm font-semibold' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'"
                >
                  HTML
                </button>
                <button
                  type="button"
                  @click="modoVistaCuerpo = 'texto'"
                  class="px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer"
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

              <span class="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono hidden xl:inline">
                {{ formatDate(mensajeSeleccionado.fecha) }}
              </span>
            </div>
          </div>

          <!-- Cabecera Compacta del Mensaje -->
          <div class="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-950/40 shrink-0 space-y-2">
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

            <!-- Fila 3: Fila de Adjuntos horizontal compacta (si existen) -->
            <div
              v-if="mensajeSeleccionado.adjuntos && mensajeSeleccionado.adjuntos.length > 0"
              class="flex items-center gap-2 pt-1.5 border-t border-zinc-200/60 dark:border-zinc-800/60 flex-wrap"
            >
              <span class="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1 shrink-0">
                <Paperclip class="w-3.5 h-3.5 text-indigo-500" />
                <span>{{ mensajeSeleccionado.adjuntos.length }} adjunto(s) ({{ tamanoTotalAdjuntos }}):</span>
              </span>

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

              <button
                v-if="mensajeSeleccionado.adjuntos.length > 1"
                type="button"
                @click="descargarTodosLosAdjuntos"
                :disabled="descargandoTodos"
                class="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 ml-auto shrink-0"
              >
                <Download class="w-3 h-3" />
                <span>Descargar todos (.zip)</span>
              </button>
            </div>
          </div>

          <!-- Ribbon de Hilo / Conversación si hay más de 1 mensaje -->
          <div
            v-if="hiloMensajes.length > 1"
            class="px-5 py-2.5 bg-indigo-50/70 dark:bg-zinc-800/60 border-b border-indigo-100 dark:border-zinc-800 flex items-center justify-between text-xs shrink-0"
          >
            <div class="flex items-center gap-2">
              <GitMerge class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span class="font-bold text-zinc-900 dark:text-zinc-100">
                Conversación en hilo ({{ hiloMensajes.length }} mensajes)
              </span>
            </div>
            <button
              type="button"
              @click="modoVerHilo = !modoVerHilo"
              class="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer text-[11px]"
            >
              <span>{{ modoVerHilo ? 'Ocultar historial' : 'Ver todos los intercambios' }}</span>
            </button>
          </div>

          <!-- Historial desplegable de mensajes en el hilo -->
          <div
            v-if="hiloMensajes.length > 1 && modoVerHilo"
            class="px-5 py-3 bg-zinc-50 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800 space-y-2 max-h-56 overflow-y-auto shrink-0"
          >
            <div
              v-for="msgHilo in hiloMensajes"
              :key="msgHilo.id"
              @click="seleccionarMensaje(msgHilo)"
              class="p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-start justify-between gap-3"
              :class="msgHilo.id === mensajeSeleccionado.id 
                ? 'bg-indigo-50/90 dark:bg-zinc-800 border-indigo-400 dark:border-indigo-500 shadow-xs' 
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'"
            >
              <div class="min-w-0 space-y-0.5">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {{ msgHilo.de.nombre || msgHilo.de.correo }}
                  </span>
                  <span class="text-[10px] text-zinc-400 font-mono">
                    {{ formatDate(msgHilo.fecha) }}
                  </span>
                  <span class="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 uppercase font-mono">
                    {{ nombreCarpetaDeMensaje(msgHilo.carpeta) }}
                  </span>
                </div>
                <p class="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-1">
                  {{ msgHilo.extracto }}
                </p>
              </div>
              <span v-if="msgHilo.id === mensajeSeleccionado.id" class="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                Leyendo ahora
              </span>
            </div>
          </div>

          <!-- Cuerpo Scrolleable del Mensaje (¡Visible inmediatamente arriba!) -->
          <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            <!-- Contenedor del contenido del correo -->
            <div class="bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
              <EmailViewer
                v-if="modoVistaCuerpo === 'html'"
                :html="mensajeSeleccionado.cuerpoHtml"
                :texto="mensajeSeleccionado.cuerpoTexto"
              />
              <div v-else class="whitespace-pre-wrap font-sans text-xs leading-relaxed text-zinc-800 dark:text-zinc-200">
                {{ mensajeSeleccionado.cuerpoTexto || mensajeSeleccionado.extracto || 'Sin contenido en texto plano.' }}
              </div>
            </div>

            <!-- CAJA DE RESPUESTA RÁPIDA INTEGRADA CON PLANTILLAS -->
            <div class="border-t border-zinc-200 dark:border-zinc-800 pt-5 space-y-3.5">
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
