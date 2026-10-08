export interface SectorMetrica {
  sector: string;
  cantidad: number;
  porcentaje: number;
  montoTotal: number;
  colorClase: string;
  colorHex: string;
}

export interface EtapaMetrica {
  etapa: string;
  nombre: string;
  cantidad: number;
  monto: number;
  porcentaje: number;
  tasaConversionEtapa: number;
}

export interface ResponsableMetrica {
  responsable: string;
  deals: number;
  monto: number;
  ganadas: number;
  tasaExito: number;
}

export interface MesTendencia {
  mes: string;
  mesCorto: string;
  montoGanado: number;
  montoPipeline: number;
  dealsGanados: number;
  dealsTotales: number;
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
  tendenciaMensual: MesTendencia[];
}
