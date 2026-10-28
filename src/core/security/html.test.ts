// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from './html';

describe('sanitizeHtml', () => {
  it('elimina etiquetas script y manejadores de eventos', () => {
    const salida = sanitizeHtml('<p>Hola</p><script>alert(1)</script><img src="x" onerror="alert(1)">');
    expect(salida).toContain('<p>Hola</p>');
    expect(salida).not.toContain('<script');
    expect(salida).not.toContain('onerror');
  });

  it('elimina iframes y formularios', () => {
    const salida = sanitizeHtml('<iframe src="https://malicioso.test"></iframe><form><input /></form>');
    expect(salida).not.toContain('<iframe');
    expect(salida).not.toContain('<form');
  });

  it('conserva HTML de correo seguro con estilos en línea', () => {
    const salida = sanitizeHtml('<table><tr><td style="color:#333">Texto</td></tr></table>');
    expect(salida).toContain('<table>');
    expect(salida).toContain('style="color:#333"');
  });

  it('devuelve cadena vacía para entradas vacías', () => {
    expect(sanitizeHtml('')).toBe('');
  });
});
