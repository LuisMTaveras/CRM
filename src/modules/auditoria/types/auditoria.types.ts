export interface ActorAuditoria {
  id?: string;
  email?: string;
  nombre?: string;
  rol?: string;
}

export interface EventoAuditoria {
  id: string;
  timestamp: string;
  actor: ActorAuditoria | null;
  accion: string;
  entidad: string;
  entidadId: string;
  exito: boolean;
  ip: string;
  detalle: string;
  metadata: Record<string, unknown> | null;
}

export interface PaginaAuditoria {
  eventos: EventoAuditoria[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  acciones: string[];
}

export interface FiltrosAuditoria {
  page?: number;
  pageSize?: number;
  q?: string;
  accion?: string;
  entidad?: string;
  desde?: string;
  hasta?: string;
  exito?: boolean | null;
}
