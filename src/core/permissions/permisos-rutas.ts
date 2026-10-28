export interface RutaProtegida {
  nombre: string;
  ruta: string;
  permiso: string;
  permisoAlternativo?: string;
}

export const RUTAS_PROTEGIDAS: RutaProtegida[] = [
  { nombre: 'metricas', ruta: '/', permiso: 'metricas:ver_kpis', permisoAlternativo: 'metricas:ver_ejecutivos' },
  { nombre: 'clientes', ruta: '/clientes', permiso: 'clientes:ver' },
  { nombre: 'pipelines-catalogo', ruta: '/pipeline', permiso: 'pipeline:ver' },
  { nombre: 'catalogo', ruta: '/catalogo', permiso: 'comunicaciones:documentos' },
  { nombre: 'agenda', ruta: '/agenda', permiso: 'clientes:ver' },
  { nombre: 'whatsapp', ruta: '/whatsapp', permiso: 'comunicaciones:ver' },
  { nombre: 'comunicaciones', ruta: '/comunicaciones', permiso: 'comunicaciones:ver' },
  { nombre: 'despacho', ruta: '/despacho', permiso: 'comunicaciones:enviar' },
  { nombre: 'usuarios', ruta: '/usuarios', permiso: 'usuarios:ver' },
  { nombre: 'auditoria', ruta: '/auditoria', permiso: 'usuarios:ver' },
  { nombre: 'configuracion', ruta: '/configuracion', permiso: 'configuracion:ver' },
];

export function obtenerRutaInicial(
  tienePermiso: (permisoId: string) => boolean
): RutaProtegida | null {
  return (
    RUTAS_PROTEGIDAS.find(
      (destino) =>
        tienePermiso(destino.permiso) ||
        (!!destino.permisoAlternativo && tienePermiso(destino.permisoAlternativo))
    ) || null
  );
}
