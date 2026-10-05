export type ProveedorPreset = 'microsoft' | 'google' | 'cpanel' | 'personalizado';

export type TipoSeguridadSmtp = 'tls' | 'ssl' | 'ninguna';

export interface ConfiguracionSMTP {
  // Proveedor
  proveedor: ProveedorPreset;

  // Servidor Saliente SMTP
  servidorSmtp: string;
  puertoSmtp: number;
  seguridadSmtp: TipoSeguridadSmtp;
  requiereAutenticacion: boolean;
  usuarioSmtp: string;
  contrasenaSmtp: string;

  // Servidor Entrante IMAP (Recepción y trazabilidad)
  habilitarImap: boolean;
  servidorImap: string;
  puertoImap: number;
  seguridadImap: TipoSeguridadSmtp;
  usuarioImap: string;
  contrasenaImap: string;

  // Identidad del Remitente
  nombreRemitente: string;
  correoRemitente: string;
  correoRespuesta: string;
  firmaTexto: string;

  // Estado y Auditoría
  activo: boolean;
  ultimaVerificacion: string | null;
  latenciaMs?: number;
}

export interface ResultadoPruebaConexion {
  exito: boolean;
  mensaje: string;
  latenciaMs: number;
  detalles: {
    smtpConectado: boolean;
    autenticacionAceptada: boolean;
    tlsHabilitado: boolean;
    imapConectado?: boolean;
  };
}
