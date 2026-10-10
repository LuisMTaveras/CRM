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
}

export interface CarpetaCorreo {
  id: CarpetaCorreoId;
  nombre: string;
  total: number;
  noLeidos: number;
}

export interface RespuestaMensajesPaginada {
  ok: boolean;
  total: number;
  pagina: number;
  tamanoPagina: number;
  totalPaginas: number;
  noLeidos: number;
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
