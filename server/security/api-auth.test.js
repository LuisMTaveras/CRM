import { describe, expect, it, vi } from 'vitest';
import {
  crearMiddlewareAuth,
  firmarToken,
  resolverConfiguracionAuth,
  verificarToken,
} from './api-auth.js';

const SECRETO = 'secreto-de-pruebas-con-longitud-suficiente';

function crearReq({ path = '/recurso', method = 'GET', headers = {}, query = {} } = {}) {
  return {
    path,
    method,
    query,
    get(nombre) {
      return headers[String(nombre).toLowerCase()];
    },
  };
}

function crearRes() {
  const res = {
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
  return res;
}

describe('api-auth', () => {
  it('firma y verifica tokens válidos', () => {
    const token = firmarToken({ sub: 'usr-1', rol: 'admin' }, { secreto: SECRETO, ahora: 1_000_000 });
    const payload = verificarToken(token, { secreto: SECRETO, ahora: 1_000_001 });

    expect(payload.sub).toBe('usr-1');
    expect(payload.rol).toBe('admin');
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });

  it('rechaza tokens expirados, alterados o firmados con otro secreto', () => {
    const token = firmarToken({ sub: 'usr-1' }, { secreto: SECRETO, ahora: 1_000_000, ttlMs: 1000 });

    expect(verificarToken(token, { secreto: SECRETO, ahora: 1_002_000 })).toBeNull();
    expect(verificarToken(`${token}x`, { secreto: SECRETO, ahora: 1_000_001 })).toBeNull();
    expect(verificarToken(token, { secreto: 'otro-secreto-suficientemente-largo', ahora: 1_000_001 })).toBeNull();
  });

  it('exige secreto o API key cuando la autenticación está requerida', () => {
    expect(() => resolverConfiguracionAuth({ NODE_ENV: 'production' })).toThrow();
    const config = resolverConfiguracionAuth({ NODE_ENV: 'production', CRM_SESSION_SECRET: SECRETO });
    expect(config.requerir).toBe(true);
    expect(config.secretoConfigurado).toBe(true);
  });

  it('permite rutas públicas y rechaza solicitudes sin credencial', () => {
    const middleware = crearMiddlewareAuth({
      requerir: true,
      apiKey: '',
      secreto: SECRETO,
      rutasPublicas: ['/auth/login'],
    });
    const next = vi.fn();
    const resPublica = crearRes();

    middleware(crearReq({ path: '/auth/login' }), resPublica, next);
    expect(next).toHaveBeenCalledOnce();

    const resPrivada = crearRes();
    middleware(crearReq({ path: '/email/estado' }), resPrivada, next);
    expect(resPrivada.statusCode).toBe(401);
  });

  it('acepta bearer válido y API key válida', () => {
    const token = firmarToken({ sub: 'usr-1' }, { secreto: SECRETO });
    const next = vi.fn();
    const middleware = crearMiddlewareAuth({
      requerir: true,
      apiKey: 'clave-api-segura',
      secreto: SECRETO,
      rutasPublicas: [],
    });

    const reqToken = crearReq({ headers: { authorization: `Bearer ${token}` } });
    middleware(reqToken, crearRes(), next);
    expect(next).toHaveBeenCalledOnce();
    expect(reqToken.auth.sub).toBe('usr-1');

    const reqApiKey = crearReq({ headers: { 'x-api-key': 'clave-api-segura' } });
    middleware(reqApiKey, crearRes(), next);
    expect(reqApiKey.auth.tipo).toBe('api-key');
  });

  it('solo admite token por query en SSE, media y adjuntos', () => {
    const token = firmarToken({ sub: 'usr-1' }, { secreto: SECRETO });
    const next = vi.fn();
    const middleware = crearMiddlewareAuth({
      requerir: true,
      apiKey: '',
      secreto: SECRETO,
      rutasPublicas: [],
    });

    const resSse = crearRes();
    middleware(crearReq({ path: '/email/eventos', query: { token } }), resSse, next);
    expect(next).toHaveBeenCalledOnce();

    const resMedia = crearRes();
    middleware(crearReq({ path: '/whatsapp/media/foto.jpg', query: { token } }), resMedia, next);
    expect(resMedia.statusCode).toBe(200);

    const resNormal = crearRes();
    middleware(crearReq({ path: '/email/estado', query: { token } }), resNormal, next);
    expect(resNormal.statusCode).toBe(401);
  });
});
