import { Router } from 'express';

const ROLES_LECTURA = ['admin', 'gerente', 'ejecutivo', 'auditor'];
const ROLES_ESCRITURA = ['admin', 'gerente', 'ejecutivo'];
const ROLES_GESTION = ['admin', 'gerente'];

function exigirRol(req, res, roles) {
  const configuracion = req.app.locals.autenticacion;
  if (!configuracion?.requerir) return true;
  if (req.auth?.tipo === 'api-key') return true;
  if (roles.includes(String(req.auth?.rol || ''))) return true;

  res.status(403).json({ ok: false, error: 'No tienes permisos para realizar esta accion.' });
  return false;
}

function responderError(res, error, estado = 400) {
  return res.status(Number(error?.estado) || estado).json({
    ok: false,
    error: error?.message || 'No se pudo completar la operacion.',
  });
}

function contextoAuditoria(req, accion, entidadId, detalle) {
  req.auditoria = { accion, entidad: 'cotizaciones', entidadId, detalle };
}

export function crearRutasCatalogo() {
  const router = Router();
  const almacen = (req) => req.app.locals.catalogo;

  router.get('/', (req, res) => {
    if (!exigirRol(req, res, ROLES_LECTURA)) return;
    const catalogo = almacen(req);
    if (!catalogo) return res.status(503).json({ ok: false, error: 'El catalogo no esta disponible.' });

    const resultado = catalogo.listar({
      busqueda: req.query.busqueda ?? req.query.q,
      categoria: req.query.categoria,
      moneda: req.query.moneda,
    });
    return res.json({ ok: true, ...resultado });
  });

  router.get('/:id', (req, res) => {
    if (!exigirRol(req, res, ROLES_LECTURA)) return;
    const catalogo = almacen(req);
    if (!catalogo) return res.status(503).json({ ok: false, error: 'El catalogo no esta disponible.' });

    const item = catalogo.obtener(req.params.id);
    if (!item) return res.status(404).json({ ok: false, error: 'Item de catalogo no encontrado.' });
    return res.json(item);
  });

  router.post('/', (req, res) => {
    if (!exigirRol(req, res, ROLES_GESTION)) return;
    const catalogo = almacen(req);
    if (!catalogo) return res.status(503).json({ ok: false, error: 'El catalogo no esta disponible.' });

    try {
      const item = catalogo.crear(req.body || {});
      contextoAuditoria(req, 'catalogo.crear', item.id, `Item: ${item.nombre}`);
      return res.status(201).json(item);
    } catch (error) {
      return responderError(res, error);
    }
  });

  router.patch('/:id', (req, res) => {
    if (!exigirRol(req, res, ROLES_GESTION)) return;
    const catalogo = almacen(req);
    if (!catalogo) return res.status(503).json({ ok: false, error: 'El catalogo no esta disponible.' });

    try {
      const item = catalogo.actualizar(req.params.id, req.body || {});
      if (!item) return res.status(404).json({ ok: false, error: 'Item de catalogo no encontrado.' });
      contextoAuditoria(req, 'catalogo.actualizar', item.id, `Item: ${item.nombre}`);
      return res.json(item);
    } catch (error) {
      return responderError(res, error);
    }
  });

  router.delete('/:id', (req, res) => {
    if (!exigirRol(req, res, ROLES_GESTION)) return;
    const catalogo = almacen(req);
    if (!catalogo) return res.status(503).json({ ok: false, error: 'El catalogo no esta disponible.' });

    const eliminado = catalogo.eliminar(req.params.id);
    if (!eliminado) return res.status(404).json({ ok: false, error: 'Item de catalogo no encontrado.' });
    contextoAuditoria(req, 'catalogo.eliminar', req.params.id, `Item: ${eliminado.nombre}`);
    return res.json({ ok: true });
  });

  return router;
}

export function crearRutasCotizaciones() {
  const router = Router();
  const almacen = (req) => req.app.locals.cotizaciones;

  // Rutas publicas para el portal de aprobacion del cliente (sin sesion).
  router.get('/publicas/:token', (req, res) => {
    const cotizaciones = almacen(req);
    if (!cotizaciones) return res.status(503).json({ ok: false, error: 'El modulo de cotizaciones no esta disponible.' });

    const cotizacion = cotizaciones.obtenerPorToken(req.params.token);
    if (!cotizacion) {
      return res.status(404).json({ ok: false, error: 'La propuesta no existe o el enlace ha caducado.' });
    }
    return res.json(cotizacion);
  });

  router.post('/publicas/:token/aprobar', (req, res) => {
    const cotizaciones = almacen(req);
    if (!cotizaciones) return res.status(503).json({ ok: false, error: 'El modulo de cotizaciones no esta disponible.' });

    try {
      const cotizacion = cotizaciones.aprobarPorToken(req.params.token, {
        nombre: req.body?.nombre,
        cargo: req.body?.cargo,
      });
      req.auditoria = {
        accion: 'cotizaciones.aprobacion.publica',
        entidad: 'cotizaciones',
        entidadId: cotizacion.id,
        detalle: `Aprobada por ${cotizacion.aprobado_por_nombre} (${cotizacion.aprobado_por_cargo}).`,
      };
      return res.json(cotizacion);
    } catch (error) {
      return responderError(res, error, 404);
    }
  });

  router.get('/', (req, res) => {
    if (!exigirRol(req, res, ROLES_LECTURA)) return;
    const cotizaciones = almacen(req);
    if (!cotizaciones) return res.status(503).json({ ok: false, error: 'El modulo de cotizaciones no esta disponible.' });

    const resultado = cotizaciones.listar({
      busqueda: req.query.busqueda ?? req.query.q,
      estado: req.query.estado,
      clienteId: req.query.clienteId,
      pagina: req.query.pagina ?? req.query.page,
      tamanoPagina: req.query.tamanoPagina ?? req.query.pageSize,
    });
    return res.json({ ok: true, ...resultado });
  });

  router.get('/:id', (req, res) => {
    if (!exigirRol(req, res, ROLES_LECTURA)) return;
    const cotizaciones = almacen(req);
    if (!cotizaciones) return res.status(503).json({ ok: false, error: 'El modulo de cotizaciones no esta disponible.' });

    const cotizacion = cotizaciones.obtener(req.params.id);
    if (!cotizacion) return res.status(404).json({ ok: false, error: 'Cotizacion no encontrada.' });
    return res.json(cotizacion);
  });

  router.post('/', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;
    const cotizaciones = almacen(req);
    if (!cotizaciones) return res.status(503).json({ ok: false, error: 'El modulo de cotizaciones no esta disponible.' });

    try {
      const cotizacion = cotizaciones.guardar(req.body || {});
      contextoAuditoria(req, 'cotizaciones.guardar', cotizacion.id, `Cotizacion: ${cotizacion.numero_cotizacion}`);
      return res.status(201).json(cotizacion);
    } catch (error) {
      return responderError(res, error);
    }
  });

  router.patch('/:id/estado', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;
    const cotizaciones = almacen(req);
    if (!cotizaciones) return res.status(503).json({ ok: false, error: 'El modulo de cotizaciones no esta disponible.' });

    try {
      const cotizacion = cotizaciones.actualizarEstado(req.params.id, req.body?.estado);
      if (!cotizacion) return res.status(404).json({ ok: false, error: 'Cotizacion no encontrada.' });
      contextoAuditoria(req, 'cotizaciones.estado', cotizacion.id, `Estado: ${cotizacion.estado}`);
      return res.json(cotizacion);
    } catch (error) {
      return responderError(res, error);
    }
  });

  router.delete('/:id', (req, res) => {
    if (!exigirRol(req, res, ROLES_GESTION)) return;
    const cotizaciones = almacen(req);
    if (!cotizaciones) return res.status(503).json({ ok: false, error: 'El modulo de cotizaciones no esta disponible.' });

    const eliminada = cotizaciones.eliminar(req.params.id);
    if (!eliminada) return res.status(404).json({ ok: false, error: 'Cotizacion no encontrada.' });
    contextoAuditoria(req, 'cotizaciones.eliminar', req.params.id, `Cotizacion: ${eliminada.numero_cotizacion}`);
    return res.json({ ok: true });
  });

  return router;
}
