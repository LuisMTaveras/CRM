export type CategoriaBusqueda = 'clientes' | 'pipeline' | 'comunicaciones' | 'modulos' | 'acciones';

export interface ItemBusqueda {
  id: string;
  categoria: CategoriaBusqueda;
  titulo: string;
  subtitulo?: string;
  badge?: string;
  badgeColor?: string;
  icono: string;
  ruta?: string;
  atajo?: string;
  metadatos?: Record<string, unknown>;
  accion?: () => void;
}

export interface GrupoResultadosBusqueda {
  categoria: CategoriaBusqueda;
  etiqueta: string;
  items: ItemBusqueda[];
}
