import { Router } from 'express';

const ROLES_LECTURA = ['admin', 'gerente', 'ejecutivo', 'auditor'];
const ROLES_ESCRITURA = ['admin', 'gerente', 'ejecutivo'];
const ROLES_CONFIGURACION = ['admin', 'gerente'];
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
  req.auditoria = { accion, entidad: 'pipeline', entidadId, detalle };
}

export function crearRutasPipelines() {
  const router = Router();
  const almacen = (req) => req.app.locals.pipelines;

  const noDisponible = (res) =>
    res.status(503).json({ ok: false, error: 'El modulo de pipeline no esta disponible.' });

  router.get('/', (req, res) => {
    if (!exigirRol(req, res, ROLES_LECTURA)) return;
    const pipelines = almacen(req);
    if (!pipelines) return noDisponible(res);

    const resultado = pipelines.listar({
      pagina: req.query.pagina ?? req.query.page,
      tamanoPagina: req.query.tamanoPagina ?? req.query.pageSize,
    });
    return res.json({ ok: true, ...resultado, resumen: pipelines.resumen() });
  });

  router.get('/tarjetas', (req, res) => {
    if (!exigirRol(req, res, ROLES_LECTURA)) return;
    const pipelines = almacen(req);
    if (!pipelines) return noDisponible(res);

    const tarjetas = pipelines.todasLasTarjetas();
    if (req.query.paginar === 'false') {
      return res.json({ ok: true, datos: tarjetas, total: tarjetas.length });
    }

    const pagina = Math.max(1, Number.parseInt(req.query.pagina ?? req.query.page, 10) || 1);
    const tamano = Math.min(200, Math.max(1, Number.parseInt(req.query.tamanoPagina ?? req.query.pageSize, 10) || 50));
    const inicio = (pagina - 1) * tamano;

    return res.json({
      ok: true,
      datos: tarjetas.slice(inicio, inicio + tamano),
      total: tarjetas.length,
      pagina,
      tamanoPagina: tamano,
      totalPaginas: Math.max(1, Math.ceil(tarjetas.length / tamano)),
      hasMore: inicio + tamano < tarjetas.length,
    });
  });

  router.delete('/tarjetas', (req, res) => {
    if (!exigirRol(req, res, ROLES_GESTION)) return;
    const pipelines = almacen(req);
    if (!pipelines) return noDisponible(res);

    const resultado = pipelines.vaciarTarjetas();
    contextoAuditoria(req, 'pipeline.tarjetas.vaciar', '', `Eliminadas: ${resultado.eliminadas}.`);
    return res.json({ ok: true, ...resultado });
  });

  router.get('/:id', (req, res) => {
    if (!exigirRol(req, res, ROLES_LECTURA)) return;
    const pipelines = almacen(req);
    if (!pipelines) return noDisponible(res);

    const pipeline = pipelines.obtener(req.params.id);
    if (!pipeline) return res.status(404).json({ ok: false, error: 'Pipeline no encontrado.' });
    return res.json(pipeline);
  });

  router.get('/:id/metricas', (req, res) => {
    if (!exigirRol(req, res, ROLES_LECTURA)) return;
    const pipelines = almacen(req);
    if (!pipelines) return noDisponible(res);

    const metricas = pipelines.metricas(req.params.id);
    if (!metricas) return res.status(404).json({ ok: false, error: 'Pipeline no encontrado.' });
    return res.json({ ok: true, metricas });
  });

  router.post('/', (req, res) => {
    if (!exigirRol(req, res, ROLES_CONFIGURACION)) return;
    const pipelines = almacen(req);
    if (!pipelines) return noDisponible(res);

    try {
      const pipeline = pipelines.crear(req.body || {});
      contextoAuditoria(req, 'pipeline.crear', pipeline.id, `Pipeline: ${pipeline.nombre}`);
      return res.status(201).json(pipeline);
    } catch (error) {
      return responderError(res, error);
    }
  });

  router.patch('/:id', (req, res) => {
    if (!exigirRol(req, res, ROLES_CONFIGURACION)) return;
    const pipelines = almacen(req);
    if (!pipelines) return noDisponible(res);

    try {
      const pipeline = pipelines.actualizar(req.params.id, req.body || {});
      if (!pipeline) return res.status(404).json({ ok: false, error: 'Pipeline no encontrado.' });
      contextoAuditoria(req, 'pipeline.actualizar', pipeline.id, `Pipeline: ${pipeline.nombre}`);
      return res.json(pipeline);
    } catch (error) {
      return responderError(res, error);
    }
  });

  router.delete('/:id', (req, res) => {
    if (!exigirRol(req, res, ROLES_CONFIGURACION)) return;
    const pipelines = almacen(req);
    if (!pipelines) return noDisponible(res);

    try {
      const pipeline = pipelines.eliminar(req.params.id);
      if (!pipeline) return res.status(404).json({ ok: false, error: 'Pipeline no encontrado.' });
      contextoAuditoria(req, 'pipeline.eliminar', pipeline.id, `Pipeline: ${pipeline.nombre}`);
      return res.json({ ok: true, id: pipeline.id });
    } catch (error) {
      return responderError(res, error);
    }
  });

  // --- Etapas / columnas ---

  router.post('/:id/columnas', (req, res) => {
    if (!exigirRol(req, res, ROLES_CONFIGURACION)) return;
    const pipelines = almacen(req);
    if (!pipelines) return noDisponible(res);

    try {
      const columna = pipelines.agregarColumna(req.params.id, req.body || {});
      if (!columna) return res.status(404).json({ ok: false, error: 'Pipeline no encontrado.' });
      contextoAuditoria(req, 'pipeline.columna.crear', req.params.id, `Etapa: ${columna.titulo}`);
      return res.status(201).json(columna);
    } catch (error) {
      return responderError(res, error);
    }
  });

  router.patch('/:id/columnas/:columnaId', (req, res) => {
    if (!exigirRol(req, res, ROLES_CONFIGURACION)) return;
    const pipelines = almacen(req);
    if (!pipelines) return noDisponible(res);

    try {
      const columna = pipelines.actualizarColumna(req.params.id, req.params.columnaId, req.body || {});
      if (!columna) return res.status(404).json({ ok: false, error: 'Etapa no encontrada.' });
      contextoAuditoria(req, 'pipeline.columna.actualizar', req.params.id, `Etapa: ${columna.titulo}`);
      return res.json(columna);
    } catch (error) {
      return responderError(res, error);
    }
  });

  router.delete('/:id/columnas/:columnaId', (req, res) => {
    if (!exigirRol(req, res, ROLES_CONFIGURACION)) return;
    const pipelines = almacen(req);
    if (!pipelines) return noDisponible(res);

    try {
      const resultado = pipelines.eliminarColumna(req.params.id, req.params.columnaId);
      if (!resultado) return res.status(404).json({ ok: false, error: 'Etapa no encontrada.' });
      contextoAuditoria(req, 'pipeline.columna.eliminar', req.params.id, `Etapa: ${req.params.columnaId}`);
      return res.json({ ok: true });
    } catch (error) {
      return responderError(res, error);
    }
  });

  router.post('/:id/columnas/:columnaId/mover', (req, res) => {
    if (!exigirRol(req, res, ROLES_CONFIGURACION)) return;
    const pipelines = almacen(req);
    if (!pipelines) return noDisponible(res);

    const resultado = pipelines.moverColumna(req.params.id, req.params.columnaId, req.body?.direccion);
    if (!resultado) return res.status(404).json({ ok: false, error: 'Etapa no encontrada.' });
    if (!resultado.ok) return res.status(400).json({ ok: false, error: 'La etapa no se puede mover en esa direccion.' });

    contextoAuditoria(req, 'pipeline.columna.mover', req.params.id, `Etapa: ${req.params.columnaId}`);
    return res.json({ ok: true });
  });

  // --- Tarjetas ---

  router.get('/:id/tarjetas', (req, res) => {
    if (!exigirRol(req, res, ROLES_LECTURA)) return;
    const pipelines = almacen(req);
    if (!pipelines) return noDisponible(res);

    const resultado = pipelines.listarTarjetas(req.params.id, {
      responsable: req.query.responsable,
      sector: req.query.sector,
      prioridad: req.query.prioridad,
      busqueda: req.query.busqueda ?? req.query.q,
      pagina: req.query.pagina ?? req.query.page,
      tamanoPagina: req.query.tamanoPagina ?? req.query.pageSize,
      paginar: req.query.paginar ?? req.query.paginated,
    });
    if (!resultado) return res.status(404).json({ ok: false, error: 'Pipeline no encontrado.' });

    return res.json({ ok: true, ...resultado });
  });

  router.post('/:id/tarjetas', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;
    const pipelines = almacen(req);
    if (!pipelines) return noDisponible(res);

    try {
      const tarjeta = pipelines.crearTarjeta(req.params.id, req.body || {});
      if (!tarjeta) return res.status(404).json({ ok: false, error: 'Pipeline no encontrado.' });
      contextoAuditoria(req, 'pipeline.tarjeta.crear', tarjeta.id, `Tarjeta: ${tarjeta.titulo}`);
      return res.status(201).json(tarjeta);
    } catch (error) {
      return responderError(res, error);
    }
  });

  router.patch('/:id/tarjetas/:tarjetaId', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;
    const pipelines = almacen(req);
    if (!pipelines) return noDisponible(res);

    try {
      const tarjeta = pipelines.actualizarTarjeta(req.params.id, req.params.tarjetaId, req.body || {});
      if (!tarjeta) return res.status(404).json({ ok: false, error: 'Tarjeta no encontrada.' });
      contextoAuditoria(req, 'pipeline.tarjeta.actualizar', tarjeta.id, `Tarjeta: ${tarjeta.titulo}`);
      return res.json(tarjeta);
    } catch (error) {
      return responderError(res, error);
    }
  });

  router.post('/:id/tarjetas/:tarjetaId/mover', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;
    const pipelines = almacen(req);
    if (!pipelines) return noDisponible(res);

    const resultado = pipelines.moverTarjeta(
      req.params.id,
      req.params.tarjetaId,
      String(req.body?.columna_id || ''),
      req.body?.indice
    );
    if (!resultado) return res.status(404).json({ ok: false, error: 'Tarjeta o etapa no encontrada.' });

    contextoAuditoria(req, 'pipeline.tarjeta.mover', req.params.tarjetaId, `Etapa: ${req.body?.columna_id}`);
    return res.json({ ok: true });
  });

  router.post('/:id/tarjetas/:tarjetaId/posicion', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;
    const pipelines = almacen(req);
    if (!pipelines) return noDisponible(res);

    const resultado = pipelines.moverTarjetaPosicion(
      req.params.id,
      req.params.tarjetaId,
      req.body?.direccion
    );
    if (!resultado) return res.status(404).json({ ok: false, error: 'Tarjeta no encontrada.' });
    if (!resultado.ok) return res.status(400).json({ ok: false, error: 'La tarjeta no se puede mover en esa direccion.' });

    contextoAuditoria(req, 'pipeline.tarjeta.posicion', req.params.tarjetaId, `Direccion: ${req.body?.direccion}`);
    return res.json({ ok: true });
  });

  router.delete('/:id/tarjetas/:tarjetaId', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;
    const pipelines = almacen(req);
    if (!pipelines) return noDisponible(res);

    const tarjeta = pipelines.eliminarTarjeta(req.params.tarjetaId);
    if (!tarjeta || tarjeta.pipeline_id !== req.params.id) {
      return res.status(404).json({ ok: false, error: 'Tarjeta no encontrada.' });
    }

    contextoAuditoria(req, 'pipeline.tarjeta.eliminar', tarjeta.id, `Tarjeta: ${tarjeta.titulo}`);
    return res.json({ ok: true });
  });

  return router;
}
