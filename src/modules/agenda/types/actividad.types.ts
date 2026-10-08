export type TipoActividad =
  | 'llamada'
  | 'reunion'
  | 'videollamada'
  | 'correo'
  | 'tarea'
  | 'propuesta'
  | 'seguimiento';

export type PrioridadActividad = 'alta' | 'media' | 'baja';

export type EstadoActividad = 'pendiente' | 'en_curso' | 'completada' | 'cancelada';

export interface ActividadSeguimiento {
  id: string;
  clienteId: string;
  clienteNombre: string;
  clienteSector?: string;
  tarjetaId?: string;
  pipelineId?: string;
  titulo: string;
  descripcion?: string;
  tipo: TipoActividad;
  prioridad: PrioridadActividad;
  estado: EstadoActividad;
  fechaLimite: string; // ISO 8601 string
  responsable: string;
  resultadoNotas?: string;
  creadoEn: string;
  actualizadoEn?: string;
  completadoEn?: string;
}

export interface NuevaActividadInput {
  clienteId: string;
  clienteNombre: string;
  clienteSector?: string;
  tarjetaId?: string;
  pipelineId?: string;
  titulo: string;
  descripcion?: string;
  tipo: TipoActividad;
  prioridad: PrioridadActividad;
  fechaLimite: string;
  responsable: string;
}

export interface ActualizarActividadInput {
  titulo?: string;
  descripcion?: string;
  tipo?: TipoActividad;
  prioridad?: PrioridadActividad;
  estado?: EstadoActividad;
  fechaLimite?: string;
  responsable?: string;
  resultadoNotas?: string;
  completadoEn?: string;
}

export type RangoFiltroFecha = 'todas' | 'hoy' | 'vencidas' | 'esta_semana' | 'completadas';

export interface FiltrosActividades {
  rango?: RangoFiltroFecha;
  tipo?: TipoActividad | '';
  prioridad?: PrioridadActividad | '';
  responsable?: string;
  clienteId?: string;
  busqueda?: string;
}

export interface MetricasAgenda {
  total: number;
  pendientesHoy: number;
  vencidas: number;
  estaSemana: number;
  completadas: number;
  porcentajeCumplimiento: number;
}

export interface DiagnosticoEstancamiento {
  estancado: boolean;
  diasSinContacto: number;
  fechaReferencia: string;
  motivo: string;
}
