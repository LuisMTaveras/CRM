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
