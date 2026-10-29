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
  process.env.CRM_DB_DIR = path.join(directorioTemporal, 'db');

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

describe('API de clientes', () => {
  let clienteId;

  it('rechaza el acceso sin token', async () => {
    const { respuesta } = await solicitar('/api/clientes');
    expect(respuesta.status).toBe(401);
  });

  it('crea y consulta un cliente con contactos y oportunidades', async () => {
    const { respuesta, datos } = await solicitar('/api/clientes', {
      token: tokenAdmin,
      method: 'POST',
      body: {
        razon_social: 'Comercializadora Caribe SRL',
        nombre_comercial: 'Caribe Foods',
        identificacion_fiscal: '1-01-12345-6',
        sector: 'Alimentos',
        estado: 'prospecto',
        prioridad: 'alta',
        email: 'contacto@caribefoods.test',
        telefono: '8095550101',
        ciudad: 'Santiago',
        valor_estimado: 250000,
        responsable: 'Camila Morales',
        contactos: [
          { nombre: 'Ana Perez', cargo: 'Gerente', email: 'ana@caribefoods.test', telefono: '8095550102', es_principal: true },
        ],
      },
    });

    expect(respuesta.status).toBe(201);
    expect(datos.id).toBeTruthy();
    expect(datos.codigo).toBe('CLI-001');
    expect(datos.contactos).toHaveLength(1);
    expect(datos.contactos[0].es_principal).toBe(true);
    clienteId = datos.id;

    const creadaOportunidad = await solicitar(`/api/clientes/${clienteId}/oportunidades`, {
      token: tokenAdmin,
      method: 'POST',
      body: { titulo: 'Suministro anual', monto: 500000, etapa: 'negociacion', probabilidad: 70 },
    });
    expect(creadaOportunidad.respuesta.status).toBe(201);

    const detalle = await solicitar(`/api/clientes/${clienteId}`, { token: tokenAdmin });
    expect(detalle.respuesta.status).toBe(200);
    expect(detalle.datos.oportunidades).toHaveLength(1);
    expect(detalle.datos.valor_estimado).toBe(500000);
  });

  it('lista con paginacion, busqueda y estadisticas reales', async () => {
    const { respuesta, datos } = await solicitar(
      '/api/clientes?pagina=1&tamanoPagina=5&busqueda=Caribe&estado=prospecto',
      { token: tokenAdmin }
    );
    expect(respuesta.status).toBe(200);
    expect(datos.total).toBe(1);
    expect(datos.datos[0].nombre_comercial).toBe('Caribe Foods');
    expect(datos.estadisticas.prospectos).toBe(1);
    expect(datos.estadisticas.valorTotalPipeline).toBe(500000);
  });

  it('actualiza contacto principal y etapa de oportunidad', async () => {
    const detalle = await solicitar(`/api/clientes/${clienteId}`, { token: tokenAdmin });
    const contacto = detalle.datos.contactos[0];
    const oportunidad = detalle.datos.oportunidades[0];

    const segundo = await solicitar(`/api/clientes/${clienteId}/contactos`, {
      token: tokenAdmin,
      method: 'POST',
      body: { nombre: 'Luis Gomez', cargo: 'Compras', email: 'luis@caribefoods.test', telefono: '8095550103' },
    });
    expect(segundo.respuesta.status).toBe(201);

    const principal = await solicitar(`/api/clientes/${clienteId}/contactos/${segundo.datos.id}/principal`, {
      token: tokenAdmin,
      method: 'POST',
    });
    expect(principal.respuesta.status).toBe(200);

    const trasPrincipal = await solicitar(`/api/clientes/${clienteId}`, { token: tokenAdmin });
    expect(trasPrincipal.datos.contactos.filter((item) => item.es_principal)).toHaveLength(1);
    expect(trasPrincipal.datos.contactos.find((item) => item.es_principal).id).toBe(segundo.datos.id);

    const etapa = await solicitar(`/api/clientes/oportunidades/${oportunidad.id}/etapa`, {
      token: tokenAdmin,
      method: 'PATCH',
      body: { etapa: 'ganada' },
    });
    expect(etapa.respuesta.status).toBe(200);

    const trasEtapa = await solicitar(`/api/clientes/${clienteId}`, { token: tokenAdmin });
    expect(trasEtapa.datos.estado).toBe('activo');
    expect(trasEtapa.datos.oportunidades[0].probabilidad).toBe(100);

    expect(contacto.id).toBeTruthy();
  });

  it('registra actividades y exporta CSV seguro', async () => {
    const actividad = await solicitar(`/api/clientes/${clienteId}/actividades`, {
      token: tokenAdmin,
      method: 'POST',
      body: { tipo: 'llamada', descripcion: '=Seguimiento telefonico', realizado_por: 'Camila Morales' },
    });
    expect(actividad.respuesta.status).toBe(201);

    const { respuesta, texto } = await solicitar('/api/clientes/exportar.csv', { token: tokenAdmin });
    expect(respuesta.status).toBe(200);
    expect(respuesta.headers.get('content-type')).toContain('text/csv');
    expect(texto).toContain('Comercializadora Caribe SRL');
  });

  it('importa clientes y omite duplicados por RNC', async () => {
    const { respuesta, datos } = await solicitar('/api/clientes/importar', {
      token: tokenAdmin,
      method: 'POST',
      body: {
        clientes: [
          {
            razon_social: 'Grupo del Norte SRL',
            identificacion_fiscal: '1-31-99887-1',
            sector: 'Servicios',
            estado: 'activo',
            prioridad: 'media',
            responsable: 'Ignacio Silva',
            valor_estimado: 100000,
          },
          {
            razon_social: 'Comercializadora Caribe SRL',
            identificacion_fiscal: '1-01-12345-6',
            sector: 'Alimentos',
            estado: 'activo',
            prioridad: 'alta',
            responsable: 'Camila Morales',
          },
        ],
      },
    });

    expect(respuesta.status).toBe(201);
    expect(datos.creados).toBe(1);
    expect(datos.omitidos).toHaveLength(1);
    expect(datos.total).toBe(2);
  });

  it('permite lectura a auditores pero bloquea escritura', async () => {
    const { datos: creado } = await solicitar('/api/usuarios', {
      token: tokenAdmin,
      method: 'POST',
      body: {
        nombre: 'Auditor de Clientes',
        email: 'auditor.clientes@crm.test',
        contrasena: USUARIO_PASSWORD,
        rol: 'auditor',
      },
    });
    expect(creado.usuario.id).toBeTruthy();
    const tokenAuditor = await iniciarSesion('auditor.clientes@crm.test', USUARIO_PASSWORD);

    const lectura = await solicitar('/api/clientes', { token: tokenAuditor });
    expect(lectura.respuesta.status).toBe(200);
    expect(lectura.datos.total).toBe(2);

    const escritura = await solicitar('/api/clientes', {
      token: tokenAuditor,
      method: 'POST',
      body: {
        razon_social: 'No Autorizado SRL',
        identificacion_fiscal: '1-01-00000-0',
        sector: 'Servicios',
        estado: 'prospecto',
        prioridad: 'baja',
        responsable: 'Nadie',
      },
    });
    expect(escritura.respuesta.status).toBe(403);
  });

  it('elimina clientes y devuelve 404 en el detalle', async () => {
    const { respuesta } = await solicitar(`/api/clientes/${clienteId}`, {
      token: tokenAdmin,
      method: 'DELETE',
    });
    expect(respuesta.status).toBe(200);

    const detalle = await solicitar(`/api/clientes/${clienteId}`, { token: tokenAdmin });
    expect(detalle.respuesta.status).toBe(404);
  });
});

describe('API de agenda y actividades', () => {
  let actividadId;

  it('crea una actividad y la lista con metricas', async () => {
    const { respuesta, datos } = await solicitar('/api/actividades', {
      token: tokenAdmin,
      method: 'POST',
      body: {
        id: 'act-prueba-001',
        clienteId: 'cli-demo',
        clienteNombre: 'Comercializadora Caribe SRL',
        titulo: 'Llamada de seguimiento',
        descripcion: 'Validar propuesta enviada.',
        tipo: 'llamada',
        prioridad: 'alta',
        fechaLimite: new Date().toISOString(),
        responsable: 'Camila Morales',
      },
    });

    expect(respuesta.status).toBe(201);
    expect(datos.id).toBe('act-prueba-001');
    actividadId = datos.id;

    const listado = await solicitar('/api/actividades?paginar=false', { token: tokenAdmin });
    expect(listado.respuesta.status).toBe(200);
    expect(listado.datos.total).toBe(1);
    expect(listado.datos.datos[0].titulo).toBe('Llamada de seguimiento');
    expect(listado.datos.metricas.pendientesHoy).toBe(1);
  });

  it('filtra por busqueda y actualiza el estado', async () => {
    const filtrado = await solicitar('/api/actividades?busqueda=seguimiento', { token: tokenAdmin });
    expect(filtrado.datos.total).toBe(1);

    const sinResultados = await solicitar('/api/actividades?busqueda=inexistente', { token: tokenAdmin });
    expect(sinResultados.datos.total).toBe(0);

    const actualizada = await solicitar(`/api/actividades/${actividadId}`, {
      token: tokenAdmin,
      method: 'PATCH',
      body: { estado: 'completada', resultadoNotas: 'Cliente confirmo la reunion.' },
    });
    expect(actualizada.respuesta.status).toBe(200);
    expect(actualizada.datos.estado).toBe('completada');
    expect(actualizada.datos.completadoEn).toBeTruthy();
  });

  it('bloquea la escritura a auditores', async () => {
    const { datos: creado } = await solicitar('/api/usuarios', {
      token: tokenAdmin,
      method: 'POST',
      body: {
        nombre: 'Auditor de Agenda',
        email: 'auditor.agenda@crm.test',
        contrasena: USUARIO_PASSWORD,
        rol: 'auditor',
      },
    });
    expect(creado.usuario.id).toBeTruthy();
    const tokenAuditor = await iniciarSesion('auditor.agenda@crm.test', USUARIO_PASSWORD);

    const lectura = await solicitar('/api/actividades', { token: tokenAuditor });
    expect(lectura.respuesta.status).toBe(200);

    const escritura = await solicitar('/api/actividades', {
      token: tokenAuditor,
      method: 'POST',
      body: {
        clienteNombre: 'Cliente',
        titulo: 'No autorizada',
        tipo: 'tarea',
        prioridad: 'baja',
        fechaLimite: new Date().toISOString(),
        responsable: 'Auditor',
      },
    });
    expect(escritura.respuesta.status).toBe(403);
  });

  it('elimina la actividad', async () => {
    const eliminada = await solicitar(`/api/actividades/${actividadId}`, {
      token: tokenAdmin,
      method: 'DELETE',
    });
    expect(eliminada.respuesta.status).toBe(200);

    const listado = await solicitar('/api/actividades', { token: tokenAdmin });
    expect(listado.datos.total).toBe(0);
  });
});

describe('API de catalogo y cotizaciones', () => {
  let cotizacionCreada;
  let itemCatalogoId;

  it('expone el catalogo inicial y permite crear items', async () => {
    const listado = await solicitar('/api/catalogo', { token: tokenAdmin });
    expect(listado.respuesta.status).toBe(200);
    expect(listado.datos.total).toBeGreaterThanOrEqual(7);

    const creado = await solicitar('/api/catalogo', {
      token: tokenAdmin,
      method: 'POST',
      body: {
        codigo: 'TEST-CAT-01',
        nombre: 'Servicio de prueba',
        descripcion: 'Item creado por la suite de integracion.',
        categoria: 'consultoria',
        precioBase: 1000,
        moneda: 'DOP',
        aplicaItbis: true,
        tasaItbis: 0.18,
        unidadMedida: 'Hora',
      },
    });
    expect(creado.respuesta.status).toBe(201);
    expect(creado.datos.codigo).toBe('TEST-CAT-01');
    itemCatalogoId = creado.datos.id;

    const duplicado = await solicitar('/api/catalogo', {
      token: tokenAdmin,
      method: 'POST',
      body: {
        codigo: 'TEST-CAT-01',
        nombre: 'Duplicado',
        categoria: 'consultoria',
        precioBase: 10,
        moneda: 'DOP',
      },
    });
    expect(duplicado.respuesta.status).toBe(409);

    const actualizado = await solicitar(`/api/catalogo/${itemCatalogoId}`, {
      token: tokenAdmin,
      method: 'PATCH',
      body: { precioBase: 1500 },
    });
    expect(actualizado.respuesta.status).toBe(200);
    expect(actualizado.datos.precioBase).toBe(1500);
  });

  it('guarda una cotizacion con totales calculados en el servidor', async () => {
    const { respuesta, datos } = await solicitar('/api/cotizaciones', {
      token: tokenAdmin,
      method: 'POST',
      body: {
        cliente_id: 'cli-demo',
        cliente_nombre: 'Comercializadora Caribe SRL',
        cliente_rnc: '1-01-12345-6',
        fecha_emision: '2026-10-29',
        fecha_vencimiento: '2026-11-29',
        estado: 'enviada',
        moneda: 'DOP',
        items: [
          {
            sku: 'TEST-CAT-01',
            descripcion: 'Servicio de prueba',
            cantidad: 2,
            precio_unitario: 1000,
            descuento_porcentaje: 10,
            itbis_aplica: true,
          },
        ],
      },
    });

    expect(respuesta.status).toBe(201);
    expect(datos.numero_cotizacion).toMatch(/^COT-\d{4}-\d{4}$/);
    expect(datos.items[0].total_linea).toBe(2124);
    expect(datos.subtotal).toBe(2000);
    expect(datos.descuento_monto).toBe(200);
    expect(datos.itbis_total).toBe(324);
    expect(datos.total).toBe(2124);
    expect(datos.token_aprobacion).toMatch(/^tok_/);
    cotizacionCreada = datos;
  });

  it('permite consultar y aprobar una propuesta publica sin sesion', async () => {
    const publica = await solicitar(`/api/cotizaciones/publicas/${cotizacionCreada.token_aprobacion}`);
    expect(publica.respuesta.status).toBe(200);
    expect(publica.datos.cliente_nombre).toBe('Comercializadora Caribe SRL');

    const aprobada = await solicitar(`/api/cotizaciones/publicas/${cotizacionCreada.token_aprobacion}/aprobar`, {
      method: 'POST',
      body: { nombre: 'Ana Perez', cargo: 'Gerente General' },
    });
    expect(aprobada.respuesta.status).toBe(200);
    expect(aprobada.datos.estado).toBe('aprobada');
    expect(aprobada.datos.aprobado_por_nombre).toBe('Ana Perez');
    expect(aprobada.datos.aprobado_en).toBeTruthy();
  });

  it('solo permite escritura a roles autorizados', async () => {
    const { datos: creado } = await solicitar('/api/usuarios', {
      token: tokenAdmin,
      method: 'POST',
      body: {
        nombre: 'Auditor de Cotizaciones',
        email: 'auditor.cotizaciones@crm.test',
        contrasena: USUARIO_PASSWORD,
        rol: 'auditor',
      },
    });
    expect(creado.usuario.id).toBeTruthy();
    const tokenAuditor = await iniciarSesion('auditor.cotizaciones@crm.test', USUARIO_PASSWORD);

    const lectura = await solicitar('/api/cotizaciones', { token: tokenAuditor });
    expect(lectura.respuesta.status).toBe(200);
    expect(lectura.datos.total).toBe(1);

    const escritura = await solicitar('/api/cotizaciones', {
      token: tokenAuditor,
      method: 'POST',
      body: { cliente_nombre: 'Sin permiso', items: [] },
    });
    expect(escritura.respuesta.status).toBe(403);
  });

  it('elimina cotizacion e item de catalogo', async () => {
    const cotizacion = await solicitar(`/api/cotizaciones/${cotizacionCreada.id}`, {
      token: tokenAdmin,
      method: 'DELETE',
    });
    expect(cotizacion.respuesta.status).toBe(200);

    const item = await solicitar(`/api/catalogo/${itemCatalogoId}`, {
      token: tokenAdmin,
      method: 'DELETE',
    });
    expect(item.respuesta.status).toBe(200);
  });
});
