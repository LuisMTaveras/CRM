import type { Oportunidad } from '@/modules/clientes/types/cliente.types';

export type EtapaOportunidad = 'calificacion' | 'propuesta' | 'negociacion' | 'ganada' | 'perdida';

export type TipoPipeline = 'ventas' | 'visitas' | 'operaciones' | 'personalizado';

export type CategoriaEstadoEtapa = 'pendiente' | 'en_proceso' | 'bloqueado' | 'completado';

export const LIMITE_MAXIMO_COLUMNAS = 10;

export interface ColumnaPipeline {
  id: string;
  titulo: string;
  color: string;
  bgBadge: string;
  orden: number;
  estado: CategoriaEstadoEtapa;
  es_completado?: boolean;
}

export interface Pipeline {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoPipeline;
  icono?: string;
  color?: string;
  es_predeterminado: boolean;
  columnas: ColumnaPipeline[];
  creado_en: string;
}

export interface TarjetaPipeline {
  id: string;
  pipeline_id: string;
  columna_id: string;
  cliente_id: string;
  cliente_nombre: string;
  cliente_sector: string;
  responsable: string;
  titulo: string;
  monto?: number;
  fecha_objetivo: string;
  probabilidad?: number;
  notas?: string;
  prioridad?: 'alta' | 'media' | 'baja';
  orden: number;
  creado_en: string;
}

export interface FiltrosPipeline {
  responsable?: string;
  busqueda?: string;
  sector?: string;
  prioridad?: string;
}

export interface MetricasProgresoPipeline {
  total: number;
  completadas: number;
  enProceso: number;
  bloqueadas: number;
  pendientes: number;
  porcentaje: number;
  columnaCompletadaId: string;
  columnaCompletadaTitulo: string;
  montoCompletado: number;
  montoEnProceso: number;
  montoBloqueado: number;
  montoPendiente: number;
}

export interface ResumenPipelineItem {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoPipeline;
  es_predeterminado: boolean;
  columnasCount: number;
  totalTarjetas: number;
  completadas: number;
  enProceso: number;
  bloqueadas: number;
  pendientes: number;
  porcentaje: number;
  montoTotal: number;
}

export interface CrearPipelineInput {
  nombre: string;
  descripcion?: string;
  tipo: TipoPipeline;
  columnas: Array<{
    titulo: string;
    color: string;
    bgBadge: string;
    estado?: CategoriaEstadoEtapa;
    es_completado?: boolean;
  }>;
}

export interface EditarPipelineInput {
  nombre?: string;
  descripcion?: string;
}

export interface CrearColumnaInput {
  titulo: string;
  color: string;
  bgBadge: string;
  estado?: CategoriaEstadoEtapa;
  es_completado?: boolean;
}

export interface EditarColumnaInput {
  titulo?: string;
  color?: string;
  bgBadge?: string;
  estado?: CategoriaEstadoEtapa;
  es_completado?: boolean;
}

export interface CrearTarjetaInput {
  pipeline_id: string;
  columna_id: string;
  cliente_id: string;
  titulo: string;
  monto?: number;
  fecha_objetivo: string;
  probabilidad?: number;
  notas?: string;
  prioridad?: 'alta' | 'media' | 'baja';
  orden?: number;
}

export interface CrearMultiplesTarjetasInput {
  pipeline_id: string;
  columna_id: string;
  cliente_ids: string[];
  titulo?: string;
  monto?: number;
  fecha_objetivo: string;
  probabilidad?: number;
  notas?: string;
  prioridad?: 'alta' | 'media' | 'baja';
}

// Compatibilidad hacia atrás con el modelo previo de oportunidades
export interface OportunidadConCliente extends Oportunidad {
  cliente_nombre: string;
  cliente_sector: string;
  responsable: string;
}

export interface NuevaOportunidadInput {
  cliente_id: string;
  titulo: string;
  monto: number;
  etapa: EtapaOportunidad;
  probabilidad: number;
  fecha_cierre_estimada: string;
}
