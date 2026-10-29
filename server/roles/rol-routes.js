import { Router } from 'express';

const ROLES_ESCRITURA = ['admin'];

function exigirRol(req, res, roles) {
  const configuracion = req.app.locals.autenticacion;
  if (!configuracion?.requerir) return true;
  if (req.auth?.tipo === 'api-key') return true;
  if (roles.includes(String(req.auth?.rol || ''))) return true;

  res.status(403).json({ ok: false, error: 'No tienes permisos para administrar roles.' });
  return false;
}

function responderError(res, error) {
  return res.status(Number(error?.estado) || 400).json({
    ok: false,
    error: error?.message || 'No se pudo completar la operacion.',
  });
}

function contextoAuditoria(req, accion, entidadId, detalle) {
  req.auditoria = { accion, entidad: 'roles', entidadId, detalle };
}

export function crearRutasRoles() {
  const router = Router();
  const almacen = (req) => req.app.locals.roles;

  router.get('/', (req, res) => {
    const roles = almacen(req);
    if (!roles) {
      return res.status(503).json({ ok: false, error: 'El almacen de roles no esta disponible.' });
    }

    const resultado = roles.listar();
    return res.json({ ok: true, ...resultado });
  });

  router.get('/:id', (req, res) => {
    const roles = almacen(req);
    if (!roles) {
      return res.status(503).json({ ok: false, error: 'El almacen de roles no esta disponible.' });
    }

    const rol = roles.obtener(req.params.id);
    if (!rol) return res.status(404).json({ ok: false, error: 'Rol no encontrado.' });
    return res.json(rol);
  });

  router.post('/', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;
    const roles = almacen(req);
    if (!roles) {
      return res.status(503).json({ ok: false, error: 'El almacen de roles no esta disponible.' });
    }

    try {
      const rol = roles.crear(req.body || {});
      contextoAuditoria(req, 'roles.crear', rol.id, `Rol: ${rol.nombre}`);
      return res.status(201).json(rol);
    } catch (error) {
      return responderError(res, error);
    }
  });

  router.patch('/:id', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;
    const roles = almacen(req);
    if (!roles) {
      return res.status(503).json({ ok: false, error: 'El almacen de roles no esta disponible.' });
    }

    try {
      const rol = roles.actualizar(req.params.id, req.body || {});
      if (!rol) return res.status(404).json({ ok: false, error: 'Rol no encontrado.' });
      contextoAuditoria(req, 'roles.actualizar', rol.id, `Rol: ${rol.nombre}`);
      return res.json(rol);
    } catch (error) {
      return responderError(res, error);
    }
  });

  router.delete('/:id', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;
    const roles = almacen(req);
    if (!roles) {
      return res.status(503).json({ ok: false, error: 'El almacen de roles no esta disponible.' });
    }

    try {
      const rol = roles.eliminar(req.params.id);
      if (!rol) return res.status(404).json({ ok: false, error: 'Rol no encontrado.' });
      contextoAuditoria(req, 'roles.eliminar', rol.id, `Rol: ${rol.nombre}`);
      return res.json({ ok: true, id: rol.id });
    } catch (error) {
      return responderError(res, error);
    }
  });

  return router;
}
