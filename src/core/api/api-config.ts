const envBase = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

export const API_BASE_URL = (envBase || 'http://127.0.0.1:3002/api').replace(/\/+$/, '');

export const API_ORIGIN = API_BASE_URL.replace(/\/api$/i, '');

const CLAVE_SESION = 'crm_sesion_auth';
let tokenEnMemoria = '';

export function establecerTokenApi(token: string | null | undefined): void {
  const valor = typeof token === 'string' ? token.trim() : '';
  tokenEnMemoria = valor.startsWith('crm1.') ? valor : '';
}

export function obtenerTokenApi(): string {
  if (tokenEnMemoria) return tokenEnMemoria;

  try {
    if (typeof localStorage === 'undefined') return '';
    const guardada = localStorage.getItem(CLAVE_SESION);
    if (!guardada) return '';
    const sesion = JSON.parse(guardada);
    const token = typeof sesion?.token === 'string' ? sesion.token.trim() : '';
    return token.startsWith('crm1.') ? token : '';
  } catch {
    return '';
  }
}

export function construirUrlEventosApi(ruta: string): string {
  const base = /^https?:/i.test(ruta)
    ? ruta
    : `${API_BASE_URL}${ruta.startsWith('/') ? '' : '/'}${ruta}`;
  const token = obtenerTokenApi();
  if (!token || typeof window === 'undefined') return base;

  const url = new URL(base, window.location.origin);
  url.searchParams.set('token', token);
  return url.toString();
}

export function resolverUrlServidor(ruta?: string | null): string {
  if (!ruta) return '';
  if (/^(https?:|blob:|data:)/i.test(ruta)) return ruta;

  const base = `${API_ORIGIN}${ruta.startsWith('/') ? '' : '/'}${ruta}`;
  const token = obtenerTokenApi();
  if (!token || typeof window === 'undefined') return base;

  const url = new URL(base, window.location.origin);
  url.searchParams.set('token', token);
  return url.toString();
}

let fetchAutenticadoInstalado = false;

export function instalarFetchAutenticado(): void {
  if (fetchAutenticadoInstalado || typeof window === 'undefined') return;

  const fetchOriginal = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;
    const token = obtenerTokenApi();

    if (!token || !url.startsWith(API_BASE_URL)) {
      return fetchOriginal(input, init);
    }

    const headers = new Headers(
      init?.headers || (input instanceof Request ? input.headers : undefined)
    );
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return fetchOriginal(input, { ...init, headers });
  };

  fetchAutenticadoInstalado = true;
}
