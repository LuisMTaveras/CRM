import type { EtapaOportunidad } from '@/modules/pipeline/types/pipeline.types';
import type { PrioridadCliente } from '@/modules/clientes/types/cliente.types';

export type EventoAutomatizacion = 'etapa_cambiada' | 'oportunidad_creada' | 'cliente_creado';
export type AccionAutomatizacion = 'crear_tarea' | 'registrar_nota';

export interface CondicionesAutomatizacion {
  etapa?: EtapaOportunidad | '';
  etapa_origen?: EtapaOportunidad | '';
  sector?: string;
  prioridad?: PrioridadCliente | '';
}

export interface AccionDefinicion {
  tipo: AccionAutomatizacion;
  titulo: string;
  descripcion: string;
  prioridad: PrioridadCliente;
  dias_vencimiento: number;
}

export interface Automatizacion {
  id: string;
  nombre: string;
  descripcion: string;
  evento: EventoAutomatizacion;
  activa: boolean;
  condiciones: CondicionesAutomatizacion;
  accion: AccionDefinicion;
  creado_en: string;
  actualizado_en?: string;
}

export interface CrearAutomatizacionInput {
  nombre: string;
  descripcion?: string;
  evento: EventoAutomatizacion;
  activa?: boolean;
  condiciones?: CondicionesAutomatizacion;
  accion: AccionDefinicion;
}

export interface OpcionesListadoAutomatizaciones {
  pagina?: number;
  tamanoPagina?: number;
  busqueda?: string;
  evento?: EventoAutomatizacion | '';
  activa?: boolean | null;
}

export interface PaginaAutomatizaciones {
  datos: Automatizacion[];
  total: number;
  pagina: number;
  tamanoPagina: number;
  totalPaginas: number;
  hasMore: boolean;
}

export const ETIQUETAS_EVENTO: Record<EventoAutomatizacion, string> = {
  etapa_cambiada: 'Cambio de etapa en el pipeline',
  oportunidad_creada: 'Nueva oportunidad comercial',
  cliente_creado: 'Nuevo cliente registrado',
};

export const ETIQUETAS_ACCION: Record<AccionAutomatizacion, string> = {
  crear_tarea: 'Crear tarea en la agenda',
  registrar_nota: 'Registrar nota de seguimiento',
};

export const ETIQUETAS_ETAPA: Record<EtapaOportunidad, string> = {
  calificacion: 'Calificación',
  propuesta: 'Propuesta enviada',
  negociacion: 'En negociación',
  ganada: 'Cerrada ganada',
  perdida: 'Cerrada perdida',
};
