export type CarpetaCorreoId = 'inbox' | 'enviados' | 'borradores' | 'archivados' | 'papelera' | string;

export interface DireccionCorreo {
  nombre: string;
  correo: string;
}

export interface AdjuntoCorreo {
  id: string;
  nombre: string;
  tamanoBytes: number;
  tipoContenido: string;
  url?: string;
  base64?: string;
}

export interface MensajeCorreo {
  id: string;
  uid: number;
  carpeta: CarpetaCorreoId;
  de: DireccionCorreo;
  para: DireccionCorreo[];
  cc?: DireccionCorreo[];
  cco?: DireccionCorreo[];
  asunto: string;
  extracto: string;
  cuerpoTexto: string;
  cuerpoHtml: string;
  fecha: string;
  leido: boolean;
  destacado: boolean;
  tieneAdjuntos: boolean;
  adjuntos?: AdjuntoCorreo[];
  clienteNombreRelacionado?: string;
  asuntoRaiz?: string;
  totalEnHilo?: number;
  mensajesDelHilo?: MensajeCorreo[];
  esCoincidenciaServidor?: boolean;
}

export interface RespuestaSincronizacion {
  exito: boolean;
  mensaje: string;
  sincronizados: number;
  totalExistentes?: number;
  hayMas?: boolean;
  carpetas?: CarpetaCorreo[];
  error?: string;
}

export interface RespuestaBusquedaRemota {
  exito: boolean;
  mensaje: string;
  totalServidor?: number;
  nuevosDescargados?: number;
  mensajes?: MensajeCorreo[];
  error?: string;
}

export interface CarpetaCorreo {
  id: CarpetaCorreoId;
  nombre: string;
  total: number;
  noLeidos: number;
  color?: string;
  esPersonalizada?: boolean;
}

export interface RespuestaMensajesPaginada {
  ok: boolean;
  total: number;
  pagina: number;
  tamanoPagina: number;
  totalPaginas: number;
  noLeidos: number;
  esBusquedaGlobal?: boolean;
  mensajes: MensajeCorreo[];
}

export interface RespuestaNovedadesCorreo {
  ok: boolean;
  carpeta: string;
  total: number;
  noLeidos: number;
  ultimoMensajeId: string | null;
  ultimaFecha: string | null;
}

export interface RespuestaHiloCorreo {
  ok: boolean;
  asuntoRaiz: string;
  totalMensajes: number;
  mensajes: MensajeCorreo[];
}

export interface ConfiguracionFirma {
  habilitada: boolean;
  nombreRemitente: string;
  cargo: string;
  departamento: string;
  empresa: string;
  telefono: string;
  celular?: string;
  sitioWeb?: string;
  colorAcento: string;
  textoPersonalizado?: string;
  incluirLogo: boolean;
  logoUrl?: string;
}

export interface ConfiguracionPiePagina {
  habilitado: boolean;
  textoLegal: string;
  incluirAvisoConfidencialidad: boolean;
  incluirDireccionEmpresa: boolean;
  direccionFisica?: string;
  incluirRnc: boolean;
  rncEmpresa?: string;
  colorTexto: string;
}

export interface PreferenciasCorreoUsuario {
  usuarioId: string;
  firma: ConfiguracionFirma;
  piePagina: ConfiguracionPiePagina;
  autoAdjuntarFirmaEnRespuestas: boolean;
  autoAdjuntarPieEnRespuestas: boolean;
  citarMensajeOriginal: boolean;
}

export interface EnviarRespuestaInput {
  mensajeOriginalId: string;
  destinatario: string;
  cc?: string;
  cco?: string;
  asunto: string;
  cuerpo: string;
  incluirFirma: boolean;
  firmaHtml?: string;
  incluirPie: boolean;
  pieHtml?: string;
  citarOriginal: boolean;
  mensajeOriginal?: {
    de: DireccionCorreo;
    fecha: string;
    cuerpoHtml?: string;
    cuerpoTexto?: string;
    extracto?: string;
  };
}

export interface RedactarCorreoInput {
  destinatario: string;
  cc?: string;
  cco?: string;
  asunto: string;
  cuerpo: string;
  incluirFirma: boolean;
  firmaHtml?: string;
  incluirPie: boolean;
  pieHtml?: string;
}
