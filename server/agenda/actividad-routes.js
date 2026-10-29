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

function responderError(res, error) {
  return res.status(Number(error?.estado) || 400).json({
    ok: false,
    error: error?.message || 'No se pudo completar la operacion.',
  });
}

function contextoAuditoria(req, accion, entidadId, detalle) {
  req.auditoria = { accion, entidad: 'actividades', entidadId, detalle };
}

export function crearRutasActividades() {
  const router = Router();

  const almacen = (req) => req.app.locals.actividades;

  router.get('/', (req, res) => {
    if (!exigirRol(req, res, ROLES_LECTURA)) return;

    const actividades = almacen(req);
    if (!actividades) {
      return res.status(503).json({ ok: false, error: 'El almacen de actividades no esta disponible.' });
    }

    const resultado = actividades.listar({
      rango: req.query.rango,
      tipo: req.query.tipo,
      prioridad: req.query.prioridad,
      responsable: req.query.responsable,
      clienteId: req.query.clienteId,
      busqueda: req.query.busqueda ?? req.query.q,
      pagina: req.query.pagina ?? req.query.page,
      tamanoPagina: req.query.tamanoPagina ?? req.query.pageSize,
      paginar: req.query.paginar ?? req.query.paginated,
    });

    return res.json({ ok: true, ...resultado });
  });

  router.get('/metricas', (req, res) => {
    if (!exigirRol(req, res, ROLES_LECTURA)) return;

    const actividades = almacen(req);
    if (!actividades) {
      return res.status(503).json({ ok: false, error: 'El almacen de actividades no esta disponible.' });
    }

    return res.json({ ok: true, metricas: actividades.metricas() });
  });

  router.get('/:id', (req, res) => {
    if (!exigirRol(req, res, ROLES_LECTURA)) return;

    const actividades = almacen(req);
    if (!actividades) {
      return res.status(503).json({ ok: false, error: 'El almacen de actividades no esta disponible.' });
    }

    const actividad = actividades.obtener(req.params.id);
    if (!actividad) {
      return res.status(404).json({ ok: false, error: 'Actividad no encontrada.' });
    }
    return res.json(actividad);
  });

  router.delete('/', (req, res) => {
    if (!exigirRol(req, res, ROLES_GESTION)) return;

    const actividades = almacen(req);
    if (!actividades) {
      return res.status(503).json({ ok: false, error: 'El almacen de actividades no esta disponible.' });
    }

    const resultado = actividades.vaciar();
    contextoAuditoria(req, 'actividades.vaciar', '', `Eliminadas: ${resultado.eliminados}.`);
    return res.json({ ok: true, ...resultado });
  });

  router.post('/', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;

    const actividades = almacen(req);
    if (!actividades) {
      return res.status(503).json({ ok: false, error: 'El almacen de actividades no esta disponible.' });
    }

    try {
      const actividad = actividades.crear(req.body || {});
      contextoAuditoria(req, 'actividades.crear', actividad.id, `Actividad: ${actividad.titulo}`);
      return res.status(201).json(actividad);
    } catch (error) {
      return responderError(res, error);
    }
  });

  router.patch('/:id', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;

    const actividades = almacen(req);
    if (!actividades) {
      return res.status(503).json({ ok: false, error: 'El almacen de actividades no esta disponible.' });
    }

    const actualizada = actividades.actualizar(req.params.id, req.body || {});
    if (!actualizada) {
      return res.status(404).json({ ok: false, error: 'Actividad no encontrada.' });
    }

    contextoAuditoria(req, 'actividades.actualizar', actualizada.id, `Actividad: ${actualizada.titulo}`);
    return res.json(actualizada);
  });

  router.delete('/:id', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;

    const actividades = almacen(req);
    if (!actividades) {
      return res.status(503).json({ ok: false, error: 'El almacen de actividades no está disponible.' });
    }

    const eliminada = actividades.eliminar(req.params.id);
    if (!eliminada) {
      return res.status(404).json({ ok: false, error: 'Actividad no encontrada.' });
    }

    contextoAuditoria(req, 'actividades.eliminar', req.params.id, `Actividad: ${eliminada.titulo}`);
    return res.json({ ok: true });
  });

  return router;
}
