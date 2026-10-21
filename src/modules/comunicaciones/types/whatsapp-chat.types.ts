export interface MensajeCitado {
  id: string;
  emisor: string;
  texto: string;
}

export interface MensajeWhatsApp {
  id: string;
  deMi: boolean;
  emisor: string;
  texto: string;
  timestamp: string;
  estado: 'pendiente' | 'enviado' | 'entregado' | 'leido' | 'recibido';
  tipo: 'texto' | 'documento' | 'imagen' | 'audio';
  esNotaVoz?: boolean;
  duracionSegundos?: number;
  archivoNombre?: string;
  archivoUrl?: string;
  archivoTamano?: string;
  archivoMime?: string;
  mensajeCitado?: MensajeCitado;
  esNotaInterna?: boolean;
  autor?: string;
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
  fotoUrl?: string;
  clienteId?: string;
  clienteEmpresa?: string;
  etiquetas?: string[];
}

export interface RespuestaNuevoMensaje {
  ok: boolean;
  mensaje: MensajeWhatsApp;
  enviadoPorSocket?: boolean;
  error?: string;
}

export interface RespuestaRapida {
  comando: string;
  titulo: string;
  texto: string;
  categoria: 'comercial' | 'operativa' | 'cierre' | 'soporte';
}

export interface DefinicionEtiqueta {
  id: string;
  nombre: string;
  colorClase: string;
  bgClase: string;
}
