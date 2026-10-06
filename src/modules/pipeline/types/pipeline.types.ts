import type { Oportunidad } from '@/modules/clientes/types/cliente.types';

export type EtapaOportunidad = 'calificacion' | 'propuesta' | 'negociacion' | 'ganada' | 'perdida';

export interface OportunidadConCliente extends Oportunidad {
  cliente_nombre: string;
  cliente_sector: string;
  responsable: string;
}

export interface FiltrosPipeline {
  responsable?: string;
  busqueda?: string;
  sector?: string;
}

export interface NuevaOportunidadInput {
  cliente_id: string;
  titulo: string;
  monto: number;
  etapa: EtapaOportunidad;
  probabilidad: number;
  fecha_cierre_estimada: string;
}
