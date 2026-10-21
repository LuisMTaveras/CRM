export interface MensajeWhatsApp {
  id: string;
  deMi: boolean;
  emisor: string;
  texto: string;
  timestamp: string;
  estado: 'pendiente' | 'enviado' | 'entregado' | 'leido' | 'recibido';
  tipo: 'texto' | 'documento' | 'imagen';
  archivoNombre?: string;
  archivoUrl?: string;
}

export interface ChatWhatsApp {
  jid: string;
  telefono: string;
  nombre: string;
  contacto?: string;
  ultimoMensaje: string;
  ultimoTimestamp: string;
  noLeidos: number;
  avatar: string;
  clienteId?: string;
  clienteEmpresa?: string;
}

export interface RespuestaNuevoMensaje {
  ok: boolean;
  mensaje: MensajeWhatsApp;
  enviadoPorSocket?: boolean;
  error?: string;
}
