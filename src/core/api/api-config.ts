const envBase = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

export const API_BASE_URL = (envBase || 'http://127.0.0.1:3002/api').replace(/\/+$/, '');

export const API_ORIGIN = API_BASE_URL.replace(/\/api$/i, '');

/**
 * Resuelve rutas de archivos servidas por el backend unificado (adjuntos, media de WhatsApp).
 * Las URLs absolutas y los blobs/datos se devuelven sin modificar.
 */
export function resolverUrlServidor(ruta?: string | null): string {
  if (!ruta) return '';
  if (/^(https?:|blob:|data:)/i.test(ruta)) return ruta;
  return `${API_ORIGIN}${ruta.startsWith('/') ? '' : '/'}${ruta}`;
}
