import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const ADMIN_EMAIL = 'admin@crm.test';
const ADMIN_PASSWORD = 'Admin12345!';
const USUARIO_PASSWORD = 'Usuario12345!';

let app;
let server;
let baseUrl;
let directorioTemporal;
let tokenAdmin;

function crearUrl(ruta) {
  return `${baseUrl}${ruta}`;
}

async function solicitar(ruta, { token, method = 'GET', body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const respuesta = await fetch(crearUrl(ruta), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const texto = await respuesta.text();
  let datos = texto;
  try {
    datos = texto ? JSON.parse(texto) : null;
  } catch {
    // respuesta CSV o texto plano
  }

  return { respuesta, datos, texto };
}

async function iniciarSesion(email, contrasena) {
  const { respuesta, datos } = await solicitar('/api/auth/login', {
    method: 'POST',
    body: { email, contrasena },
  });
  expect(respuesta.status).toBe(200);
  expect(datos?.token).toBeTruthy();
  return datos.token;
}

beforeAll(async () => {
  directorioTemporal = fs.mkdtempSync(path.join(os.tmpdir(), 'crm-api-'));
  process.env.CRM_USERS_FILE = path.join(directorioTemporal, 'usuarios.json');
  process.env.CRM_AUDIT_FILE = path.join(directorioTemporal, 'auditoria.json');
  process.env.CRM_AUDIT_MAX_EVENTS = '100';
  process.env.CRM_ADMIN_EMAIL = ADMIN_EMAIL;
  process.env.CRM_ADMIN_PASSWORD = ADMIN_PASSWORD;
  process.env.CRM_ADMIN_NOMBRE = 'Administrador de Pruebas';
  process.env.CRM_SESSION_SECRET = 'secreto-de-pruebas-con-longitud-suficiente-1234567890';
  process.env.CRM_REQUIRE_AUTH = 'true';

  const modulo = await import('./email-server.js');
  app = modulo.app;
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const direccion = server.address();
  baseUrl = `http://127.0.0.1:${direccion.port}`;

  tokenAdmin = await iniciarSesion(ADMIN_EMAIL, ADMIN_PASSWORD);
});

afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (directorioTemporal) {
    fs.rmSync(directorioTemporal, { recursive: true, force: true });
  }
});

describe('API de autenticacion y administracion', () => {
  it('expone salud publica sin credenciales', async () => {
    const { respuesta, datos } = await solicitar('/api/health');
    expect(respuesta.status).toBe(200);
    expect(datos.ok).toBe(true);
    expect(datos.autenticacionRequerida).toBe(true);
  });

  it('rechaza rutas protegidas sin token', async () => {
    const { respuesta, datos } = await solicitar('/api/usuarios');
    expect(respuesta.status).toBe(401);
    expect(datos.ok).toBe(false);
  });

  it('rechaza credenciales invalidas', async () => {
    const { respuesta } = await solicitar('/api/auth/login', {
      method: 'POST',
      body: { email: ADMIN_EMAIL, contrasena: 'incorrecta' },
    });
    expect(respuesta.status).toBe(401);
  });

  it('devuelve el usuario autenticado', async () => {
    const { respuesta, datos } = await solicitar('/api/auth/me', { token: tokenAdmin });
    expect(respuesta.status).toBe(200);
    expect(datos.usuario.email).toBe(ADMIN_EMAIL);
    expect(datos.usuario.contrasena).toBeUndefined();
    expect(datos.usuario.passwordHash).toBeUndefined();
  });

  it('lista usuarios paginados', async () => {
    const { respuesta, datos } = await solicitar('/api/usuarios?page=1&pageSize=10', { token: tokenAdmin });
    expect(respuesta.status).toBe(200);
    expect(datos.total).toBe(1);
    expect(datos.usuarios).toHaveLength(1);
    expect(datos.hasMore).toBe(false);
  });

  it('crea, consulta, actualiza y elimina usuarios con permisos', async () => {
    const { respuesta: creada, datos: creado } = await solicitar('/api/usuarios', {
      token: tokenAdmin,
      method: 'POST',
      body: {
        nombre: '=Auditor de Pruebas',
        email: 'auditor@crm.test',
        contrasena: USUARIO_PASSWORD,
        rol: 'auditor',
        rolNombre: 'Auditor',
        cargo: 'Cumplimiento',
        departamento: 'Auditoria',
        telefonoFlota: '8095550101',
      },
    });
    expect(creada.status).toBe(201);
    const id = creado.usuario.id;
    expect(id).toBeTruthy();

    const { respuesta: detalle, datos: consultado } = await solicitar(`/api/usuarios/${id}`, { token: tokenAdmin });
    expect(detalle.status).toBe(200);
    expect(consultado.usuario.email).toBe('auditor@crm.test');

    const { respuesta: actualizada } = await solicitar(`/api/usuarios/${id}`, {
      token: tokenAdmin,
      method: 'PATCH',
      body: { cargo: 'Auditoria Interna' },
    });
    expect(actualizada.status).toBe(200);

    const { respuesta: contrasena } = await solicitar(`/api/usuarios/${id}/contrasena`, {
      token: tokenAdmin,
      method: 'POST',
      body: { contrasena: 'NuevaClave12345!' },
    });
    expect(contrasena.status).toBe(200);

    const { respuesta: duplicado } = await solicitar('/api/usuarios', {
      token: tokenAdmin,
      method: 'POST',
      body: {
        nombre: 'Duplicado',
        email: 'auditor@crm.test',
        contrasena: USUARIO_PASSWORD,
        rol: 'auditor',
      },
    });
    expect(duplicado.status).toBe(400);

    const tokenAuditor = await iniciarSesion('auditor@crm.test', 'NuevaClave12345!');
    const { respuesta: lecturaAuditor } = await solicitar('/api/usuarios', { token: tokenAuditor });
    expect(lecturaAuditor.status).toBe(200);

    const { respuesta: sinPermiso } = await solicitar('/api/usuarios', {
      token: tokenAuditor,
      method: 'POST',
      body: {
        nombre: 'Sin Permiso',
        email: 'sin-permiso@crm.test',
        contrasena: USUARIO_PASSWORD,
        rol: 'ejecutivo',
      },
    });
    expect(sinPermiso.status).toBe(403);

    const { respuesta: eliminada } = await solicitar(`/api/usuarios/${id}`, {
      token: tokenAdmin,
      method: 'DELETE',
    });
    expect(eliminada.status).toBe(200);
  });

  it('impide eliminar al propio administrador', async () => {
    const { respuesta } = await solicitar('/api/usuarios/usr-admin', {
      token: tokenAdmin,
      method: 'DELETE',
    });
    expect(respuesta.status).toBe(400);
  });

  it('invalida la sesion de un usuario desactivado', async () => {
    const { datos: creado } = await solicitar('/api/usuarios', {
      token: tokenAdmin,
      method: 'POST',
      body: {
        nombre: 'Usuario Desactivado',
        email: 'desactivado@crm.test',
        contrasena: USUARIO_PASSWORD,
        rol: 'auditor',
      },
    });
    const id = creado.usuario.id;
    const token = await iniciarSesion('desactivado@crm.test', USUARIO_PASSWORD);

    const { respuesta: activo } = await solicitar('/api/usuarios', { token });
    expect(activo.status).toBe(200);

    const { respuesta: desactivado } = await solicitar(`/api/usuarios/${id}`, {
      token: tokenAdmin,
      method: 'PATCH',
      body: { activo: false },
    });
    expect(desactivado.status).toBe(200);

    const { respuesta: revocado } = await solicitar('/api/usuarios', { token });
    expect(revocado.status).toBe(401);
  });

  it('registra auditoria y protege la exportacion CSV contra formulas', async () => {
    const { respuesta, datos } = await solicitar('/api/auditoria?page=1&pageSize=50', { token: tokenAdmin });
    expect(respuesta.status).toBe(200);
    expect(Array.isArray(datos.eventos)).toBe(true);
    expect(datos.eventos.some((evento) => evento.accion === 'auth.login')).toBe(true);
    expect(datos.eventos.some((evento) => evento.accion === 'usuarios.crear')).toBe(true);

    const { respuesta: csv, texto } = await solicitar('/api/auditoria/exportar.csv', { token: tokenAdmin });
    expect(csv.status).toBe(200);
    expect(csv.headers.get('content-type')).toContain('text/csv');
    expect(texto).toContain('"\'=Auditor de Pruebas"');
  });

  it('solo un administrador puede limpiar la auditoria', async () => {
    const { datos: creado } = await solicitar('/api/usuarios', {
      token: tokenAdmin,
      method: 'POST',
      body: {
        nombre: 'Gerente de Pruebas',
        email: 'gerente@crm.test',
        contrasena: USUARIO_PASSWORD,
        rol: 'gerente',
      },
    });
    expect(creado.usuario.id).toBeTruthy();
    const tokenGerente = await iniciarSesion('gerente@crm.test', USUARIO_PASSWORD);

    const { respuesta: denegado } = await solicitar('/api/auditoria', {
      token: tokenGerente,
      method: 'DELETE',
    });
    expect(denegado.status).toBe(403);

    const { respuesta: limpiado, datos } = await solicitar('/api/auditoria', {
      token: tokenAdmin,
      method: 'DELETE',
    });
    expect(limpiado.status).toBe(200);
    expect(datos.ok).toBe(true);

    const { datos: posterior } = await solicitar('/api/auditoria?page=1&pageSize=50', { token: tokenAdmin });
    expect(posterior.eventos.some((evento) => evento.accion === 'auditoria.limpiar')).toBe(true);
  });
});
