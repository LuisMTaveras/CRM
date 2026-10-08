export type TipoNotificacion = 'correo' | 'propuesta' | 'cliente' | 'pipeline' | 'sistema';

export type PrioridadNotificacion = 'alta' | 'media' | 'baja';

export interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  prioridad: PrioridadNotificacion;
  fecha: string;
  leida: boolean;
  ruta?: string;
  icono?: string;
  etiquetaAccion?: string;
  metadatos?: Record<string, unknown>;
}

export interface NuevaNotificacionInput {
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  prioridad?: PrioridadNotificacion;
  ruta?: string;
  etiquetaAccion?: string;
  metadatos?: Record<string, unknown>;
}
