import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatFallback,
  formatPhoneNumber,
  formatRelativeTime,
} from './formatters';

describe('formatCurrency', () => {
  it('formatea pesos dominicanos con 2 decimales', () => {
    expect(formatCurrency(17870000)).toBe('RD$17,870,000.00');
    expect(formatCurrency('1500.5')).toBe('RD$1,500.50');
  });

  it('respeta otra moneda cuando se indica', () => {
    expect(formatCurrency(1500, { currency: 'USD' })).toBe('US$1,500.00');
  });

  it('formatea cero como monto válido, no como vacío', () => {
    expect(formatCurrency(0)).toBe('RD$0.00');
  });

  it('devuelve — para null, undefined, vacío o NaN', () => {
    expect(formatCurrency(null)).toBe('—');
    expect(formatCurrency(undefined)).toBe('—');
    expect(formatCurrency('')).toBe('—');
    expect(formatCurrency('abc')).toBe('—');
  });
});

describe('formatDate', () => {
  const iso = '2026-09-11T11:51:00Z'; // 07:51 en Santo Domingo

  it('formatea fecha media en es-DO', () => {
    expect(formatDate(iso)).toBe('11 sept de 2026');
  });

  it('formatea fecha con hora', () => {
    expect(formatDate(iso, 'datetime')).toMatch(/^11 sept de 2026, 07:51/);
  });

  it('devuelve — para vacío o fecha inválida', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('no-es-fecha')).toBe('—');
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-05T15:50:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('expresa minutos y días en español', () => {
    expect(formatRelativeTime('2026-10-05T15:45:00Z')).toBe('hace 5 minutos');
    expect(formatRelativeTime('2026-10-03T15:50:00Z')).toBe('anteayer');
  });

  it('devuelve — para vacío', () => {
    expect(formatRelativeTime(undefined)).toBe('—');
  });
});

describe('formatPhoneNumber', () => {
  it('formatea números dominicanos 809/829/849 por defecto', () => {
    expect(formatPhoneNumber('8095551234')).toBe('+1 (809) 555-1234');
    expect(formatPhoneNumber('829-555-1234')).toBe('+1 (829) 555-1234');
    expect(formatPhoneNumber('+1 849 555 1234')).toBe('+1 (849) 555-1234');
  });

  it('mantiene soporte de otros países', () => {
    expect(formatPhoneNumber('3001234567', 'CO')).toBe('+57 (300) 123-4567');
  });

  it('devuelve — para vacío', () => {
    expect(formatPhoneNumber(null)).toBe('—');
    expect(formatPhoneNumber('---')).toBe('—');
  });
});

describe('formatFallback', () => {
  it('devuelve el valor o —', () => {
    expect(formatFallback('Santo Domingo')).toBe('Santo Domingo');
    expect(formatFallback(0)).toBe(0);
    expect(formatFallback(null)).toBe('—');
    expect(formatFallback('')).toBe('—');
  });
});
