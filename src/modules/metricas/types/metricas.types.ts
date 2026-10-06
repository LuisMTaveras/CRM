export interface SectorMetrica {
  sector: string;
  cantidad: number;
  porcentaje: number;
  montoTotal: number;
  colorClase: string;
}

export interface EtapaMetrica {
  etapa: string;
  nombre: string;
  cantidad: number;
  monto: number;
  porcentaje: number;
}

export interface ResponsableMetrica {
  responsable: string;
  deals: number;
  monto: number;
  ganadas: number;
}

export interface MetricasComerciales {
  tasaConversion: number;
  ticketPromedio: number;
  totalCuentas: number;
  totalOportunidades: number;
  totalGanado: number;
  totalEnNegociacion: number;
  totalPipelineActivo: number;
  tiempoPromedioCierreDias: number;
  distribucionSectores: SectorMetrica[];
  distribucionEtapas: EtapaMetrica[];
  topResponsables: ResponsableMetrica[];
}
