export type CampoCondicionRegla =
  | 'dominio_remitente'
  | 'correo_remitente'
  | 'nombre_remitente'
  | 'asunto_contiene'
  | 'cuerpo_contiene'
  | 'tiene_adjuntos';

export type OperadorCondicionRegla =
  | 'contiene'
  | 'termina_en'
  | 'es_igual_a'
  | 'no_contiene'
  | 'existe';

export interface CondicionRegla {
  id: string;
  campo: CampoCondicionRegla;
  operador: OperadorCondicionRegla;
  valor: string;
}

export interface AccionesRegla {
  moverACarpeta?: string;
  nombreCarpetaDestino?: string;
  marcarDestacado?: boolean;
  marcarLeido?: boolean;
  vincularClienteNombre?: string;
}

export interface ReglaCorreo {
  id: string;
  nombre: string;
  descripcion?: string;
  activa: boolean;
  operadorLogico: 'AND' | 'OR';
  condiciones: CondicionRegla[];
  acciones: AccionesRegla;
  totalAplicados: number;
  creadoEn: string;
  actualizadoEn: string;
}

export interface CarpetaPersonalizada {
  id: string;
  nombre: string;
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'sky' | 'teal';
  icono?: string;
  creadaEn: string;
}

export interface ResumenEjecucionReglas {
  totalEvaluados: number;
  totalModificados: number;
  detallesPorRegla: {
    reglaId: string;
    reglaNombre: string;
    mensajesAfectados: number;
    carpetaDestino?: string;
  }[];
}
