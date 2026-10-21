export type TipoItemCatalogo = 'producto' | 'servicio';
export type EstadoCotizacion = 'borrador' | 'enviada' | 'aprobada' | 'rechazada' | 'vencida';
export type MonedaCotizacion = 'DOP' | 'USD';

export interface ProductoServicio {
  id: string;
  sku: string;
  nombre: string;
  descripcion: string;
  tipo: TipoItemCatalogo;
  categoria: string;
  precio_unitario: number;
  itbis_aplica: boolean;
  tasa_itbis: number; // Por defecto 0.18 (18%)
  unidad_medida: string; // 'Unidad', 'Hora', 'Mes', 'Licencia', 'Proyecto'
  activo: boolean;
  creado_en: string;
  actualizado_en?: string;
}

export interface ItemCotizacion {
  id: string;
  producto_id?: string;
  sku: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento_porcentaje: number;
  itbis_aplica: boolean;
  monto_itbis: number;
  total_linea: number;
}

export interface Cotizacion {
  id: string;
  numero_cotizacion: string;
  cliente_id: string;
  cliente_nombre: string;
  cliente_rnc?: string;
  cliente_telefono?: string;
  cliente_email?: string;
  contacto_nombre?: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  estado: EstadoCotizacion;
  items: ItemCotizacion[];
  subtotal: number;
  descuento_porcentaje: number;
  descuento_monto: number;
  itbis_total: number;
  total: number;
  moneda: MonedaCotizacion;
  notas?: string;
  terminos_condiciones?: string;
  token_aprobacion: string;
  aprobado_en?: string;
  aprobado_por_nombre?: string;
  aprobado_por_cargo?: string;
  creado_en: string;
}
