export type TipoEventoTimeline =
  | 'nota'
  | 'llamada'
  | 'reunion'
  | 'videollamada'
  | 'correo'
  | 'propuesta'
  | 'cambio_etapa'
  | 'tarea';

export interface EventoTimeline {
  id: string;
  clienteId: string;
  tipo: TipoEventoTimeline;
  titulo: string;
  descripcion: string;
  autor: string;
  fecha: string; // ISO string
  metadatos?: Record<string, unknown>;
}

export interface NuevoEventoInput {
  clienteId: string;
  tipo: TipoEventoTimeline;
  titulo: string;
  descripcion: string;
  autor: string;
  fecha?: string;
  metadatos?: Record<string, unknown>;
}

export interface FiltrosTimeline {
  tipo?: TipoEventoTimeline | 'todos';
  busqueda?: string;
}
