import { Router } from 'express';

const ROLES_LECTURA = ['admin', 'gerente', 'auditor'];
const ROLES_ESCRITURA = ['admin', 'gerente'];
const EVENTOS = ['etapa_cambiada', 'oportunidad_creada', 'cliente_creado'];

function exigirRol(req, res, roles) {
  const configuracion = req.app.locals.autenticacion;
  if (!configuracion?.requerir) return true;
  if (req.auth?.tipo === 'api-key') return true;
  if (roles.includes(String(req.auth?.rol || ''))) return true;

  res.status(403).json({ ok: false, error: 'No tienes permisos para administrar automatizaciones.' });
  return false;
}

function responderError(res, error) {
  return res.status(Number(error?.estado) || 400).json({
    ok: false,
    error: error?.message || 'No se pudo completar la operación.',
  });
}

function contextoAuditoria(req, accion, entidadId, detalle) {
  req.auditoria = { accion, entidad: 'automatizaciones', entidadId, detalle };
}

export function crearRutasAutomatizaciones() {
  const router = Router();
  const almacen = (req) => req.app.locals.automatizaciones;

  const noDisponible = (res) =>
    res.status(503).json({ ok: false, error: 'El módulo de automatizaciones no está disponible.' });

  router.get('/', (req, res) => {
    if (!exigirRol(req, res, ROLES_LECTURA)) return;
    const automatizaciones = almacen(req);
    if (!automatizaciones) return noDisponible(res);

    const evento = EVENTOS.includes(req.query.evento) ? req.query.evento : '';
    const activaSolicitada = req.query.activa;
    const activa = activaSolicitada === undefined
      ? null
      : activaSolicitada === 'true' || activaSolicitada === '1';

    const resultado = automatizaciones.listar({
      pagina: req.query.pagina ?? req.query.page,
      tamanoPagina: req.query.tamanoPagina ?? req.query.pageSize,
      busqueda: req.query.busqueda ?? req.query.q,
      evento,
      activa,
    });

    return res.json({ ok: true, ...resultado });
  });

  router.get('/:id', (req, res) => {
    if (!exigirRol(req, res, ROLES_LECTURA)) return;
    const automatizaciones = almacen(req);
    if (!automatizaciones) return noDisponible(res);

    const automatizacion = automatizaciones.obtener(req.params.id);
    if (!automatizacion) {
      return res.status(404).json({ ok: false, error: 'Automatización no encontrada.' });
    }
    return res.json(automatizacion);
  });

  router.post('/', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;
    const automatizaciones = almacen(req);
    if (!automatizaciones) return noDisponible(res);

    try {
      const automatizacion = automatizaciones.crear(req.body || {});
      contextoAuditoria(req, 'automatizaciones.crear', automatizacion.id, `Regla: ${automatizacion.nombre}`);
      return res.status(201).json(automatizacion);
    } catch (error) {
      return responderError(res, error);
    }
  });

  router.patch('/:id', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;
    const automatizaciones = almacen(req);
    if (!automatizaciones) return noDisponible(res);

    try {
      const automatizacion = automatizaciones.actualizar(req.params.id, req.body || {});
      if (!automatizacion) {
        return res.status(404).json({ ok: false, error: 'Automatización no encontrada.' });
      }
      contextoAuditoria(req, 'automatizaciones.actualizar', automatizacion.id, `Regla: ${automatizacion.nombre}`);
      return res.json(automatizacion);
    } catch (error) {
      return responderError(res, error);
    }
  });

  router.delete('/:id', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;
    const automatizaciones = almacen(req);
    if (!automatizaciones) return noDisponible(res);

    const automatizacion = automatizaciones.eliminar(req.params.id);
    if (!automatizacion) {
      return res.status(404).json({ ok: false, error: 'Automatización no encontrada.' });
    }
    contextoAuditoria(req, 'automatizaciones.eliminar', automatizacion.id, `Regla: ${automatizacion.nombre}`);
    return res.json({ ok: true, id: automatizacion.id });
  });

  return router;
}
