import { describe, expect, it, vi } from 'vitest';
import { crearLimitador, crearMiddlewareRateLimit, ipDe } from './rate-limit.js';

function crearRes() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    status(codigo) {
      this.statusCode = codigo;
      return this;
    },
    json(cuerpo) {
      this.body = cuerpo;
      return this;
    },
    setHeader(nombre, valor) {
      this.headers[nombre] = valor;
      return this;
    },
  };
}

describe('rate-limit', () => {
  it('bloquea al superar el máximo y se reinicia al vencer la ventana', () => {
    let ahora = 1_000;
    const limitador = crearLimitador({ maximo: 2, ventanaMs: 1000, ahora: () => ahora });

    expect(limitador.consumir('ip-1').permitido).toBe(true);
    expect(limitador.consumir('ip-1').permitido).toBe(true);
    expect(limitador.consumir('ip-1').permitido).toBe(false);

    ahora += 1001;
    expect(limitador.consumir('ip-1').permitido).toBe(true);
    expect(limitador.consumir('otra-ip').permitido).toBe(true);
  });

  it('permite reiniciar el contador de una clave', () => {
    const limitador = crearLimitador({ maximo: 1, ventanaMs: 1000, ahora: () => 1_000 });
    expect(limitador.consumir('ip-1').permitido).toBe(true);
    expect(limitador.consumir('ip-1').permitido).toBe(false);
    limitador.reiniciar('ip-1');
    expect(limitador.consumir('ip-1').permitido).toBe(true);
  });

  it('responde 429 y agrega cabeceras cuando se excede el límite', () => {
    const middleware = crearMiddlewareRateLimit({
      maximo: 1,
      ventanaMs: 1000,
      ahora: () => 1_000,
      obtenerClave: () => 'ip-fija',
    });
    const next = vi.fn();
    const req = { ip: '127.0.0.1' };

    const primera = crearRes();
    middleware(req, primera, next);
    expect(next).toHaveBeenCalledOnce();

    const segunda = crearRes();
    middleware(req, segunda, next);
    expect(segunda.statusCode).toBe(429);
    expect(segunda.headers['RateLimit-Remaining']).toBe('0');
    expect(segunda.headers['Retry-After']).toBe('1');
  });

  it('obtiene la IP de la solicitud', () => {
    expect(ipDe({ ip: '10.0.0.1' })).toBe('10.0.0.1');
    expect(ipDe({ socket: { remoteAddress: '::1' } })).toBe('::1');
    expect(ipDe({})).toBe('desconocido');
  });
});
