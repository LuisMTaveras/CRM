import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Formateador de moneda en Pesos Dominicanos (RD$ DOP) */
export function formatearMoneda(monto: number): string {
  if (isNaN(monto) || monto === null || monto === undefined) return 'RD$ 0';
  const formateado = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(monto);
  return `RD$ ${formateado}`;
}

/** Formateador de teléfonos de República Dominicana (+1 809/829/849) */
export function formatearTelefonoRD(telefono?: string | null): string {
  if (!telefono) return 'Sin teléfono';
  const limpio = telefono.replace(/\D/g, '');
  if (limpio.length === 10) {
    return `+1 (${limpio.slice(0, 3)}) ${limpio.slice(3, 6)}-${limpio.slice(6)}`;
  }
  if (limpio.length === 11 && limpio.startsWith('1')) {
    return `+1 (${limpio.slice(1, 4)}) ${limpio.slice(4, 7)}-${limpio.slice(7)}`;
  }
  return telefono;
}

/** Formateador de fechas estándar en español */
export function formatearFecha(fechaStr?: string | null): string {
  if (!fechaStr) return 'Sin registro';
  const fecha = new Date(fechaStr);
  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(fecha);
}

/** Formateador de fecha y hora */
export function formatearFechaHora(fechaStr?: string | null): string {
  if (!fechaStr) return 'Sin registro';
  const fecha = new Date(fechaStr);
  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha);
}

/** Obtiene 2 iniciales limpias de un nombre o razón social */
export function obtenerIniciales(nombre?: string | null): string {
  if (!nombre) return 'EM';
  const palabras = nombre.trim().replace(/[^\w\s]/gi, '').split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return 'EM';
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
}

/** Asigna paleta sutil y elegante de avatar corporativo */
export function obtenerEstiloAvatar(nombre: string): { bg: string; text: string; border: string } {
  const estilos = [
    { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/25' },
    { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/25' },
    { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/25' },
    { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/25' },
    { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/25' },
    { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/25' },
  ];
  let hash = 0;
  for (let i = 0; i < (nombre || '').length; i++) {
    hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % estilos.length;
  return estilos[index];
}

