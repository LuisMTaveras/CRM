export interface ParametrosTabla {
  pagina: number;
  tamanoPagina: number;
  busqueda: string;
  ordenCampo?: string;
  ordenDireccion?: 'asc' | 'desc';
  estado?: string;
  sector?: string;
  [key: string]: unknown;
}

export function parsearParametrosURL(searchString: string): ParametrosTabla {
  const params = new URLSearchParams(searchString);
  return {
    pagina: Math.max(1, parseInt(params.get('pagina') || '1', 10)),
    tamanoPagina: Math.max(5, parseInt(params.get('tamanoPagina') || '15', 10)),
    busqueda: params.get('busqueda') || '',
    ordenCampo: params.get('ordenCampo') || 'creado_en',
    ordenDireccion: (params.get('ordenDireccion') as 'asc' | 'desc') || 'desc',
    estado: params.get('estado') || '',
    sector: params.get('sector') || '',
  };
}

export function serializarParametrosURL(params: ParametrosTabla): string {
  const searchParams = new URLSearchParams();
  if (params.pagina > 1) searchParams.set('pagina', params.pagina.toString());
  if (params.tamanoPagina !== 15) searchParams.set('tamanoPagina', params.tamanoPagina.toString());
  if (params.busqueda) searchParams.set('busqueda', params.busqueda);
  if (params.ordenCampo && params.ordenCampo !== 'creado_en') searchParams.set('ordenCampo', params.ordenCampo);
  if (params.ordenDireccion && params.ordenDireccion !== 'desc') searchParams.set('ordenDireccion', params.ordenDireccion);
  if (params.estado) searchParams.set('estado', params.estado);
  if (params.sector) searchParams.set('sector', params.sector);

  return searchParams.toString();
}
