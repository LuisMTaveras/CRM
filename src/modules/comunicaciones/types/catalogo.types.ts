export type MonedaCotizacion = 'DOP' | 'USD';

export type CategoriaServicio =
  | 'licenciamiento'
  | 'implementacion'
  | 'soporte'
  | 'desarrollo'
  | 'consultoria'
  | 'capacitacion';

export interface ItemCatalogo {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaServicio;
  precioBase: number;
  moneda: MonedaCotizacion;
  aplicaItbis: boolean;
  tasaItbis: number; // Por defecto 0.18
  unidadMedida: string;
}

export interface LineaCotizacion {
  id: string;
  servicioId?: string;
  codigo?: string;
  concepto: string;
  descripcion?: string;
  cantidad: number;
  precioUnitario: number;
  descuentoPorcentaje: number;
  aplicaItbis: boolean;
  subtotal: number;
  montoDescuento: number;
  montoItbis: number;
  total: number;
}

export interface ResumenCotizacion {
  moneda: MonedaCotizacion;
  subtotalBruto: number;
  descuentoTotal: number;
  subtotalNeto: number;
  itbisTotal: number;
  totalPagar: number;
  lineas: LineaCotizacion[];
}
