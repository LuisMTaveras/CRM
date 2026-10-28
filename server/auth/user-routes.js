import { Router } from 'express';

const ROLES_LECTURA = ['admin', 'gerente', 'auditor'];
const ROLES_ESCRITURA = ['admin', 'gerente'];
const ROLES_ELIMINACION = ['admin'];

function exigirRol(req, res, roles) {
  const configuracion = req.app.locals.autenticacion;
  if (!configuracion?.requerir) return true;
  if (req.auth?.tipo === 'api-key') return true;

  if (roles.includes(String(req.auth?.rol || ''))) return true;

  res.status(403).json({ ok: false, error: 'No tienes permisos para administrar usuarios.' });
  return false;
}

function contextoAuditoria(req, accion, entidadId, detalle) {
  req.auditoria = {
    accion,
    entidad: 'usuarios',
    entidadId,
    detalle,
  };
}

function responderError(res, error, estado = 400) {
  return res.status(estado).json({ ok: false, error: error.message || 'No se pudo completar la operación.' });
}

export function crearRutasUsuarios() {
  const router = Router();

  router.get('/', (req, res) => {
    if (!exigirRol(req, res, ROLES_LECTURA)) return;

    const usuarios = req.app.locals.usuarios;
    if (!usuarios) {
      return res.status(503).json({ ok: false, error: 'El directorio de usuarios no está disponible.' });
    }

    return res.json({
      ok: true,
      ...usuarios.listarPaginado({
        page: req.query.page,
        pageSize: req.query.pageSize,
        q: req.query.q,
      }),
    });
  });

  router.post('/', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;

    const usuarios = req.app.locals.usuarios;
    if (!usuarios) {
      return res.status(503).json({ ok: false, error: 'El directorio de usuarios no está disponible.' });
    }

    try {
      const creado = usuarios.agregar(req.body || {});
      contextoAuditoria(req, 'usuarios.crear', creado.id, `Se creó el usuario ${creado.email}.`);
      return res.status(201).json({ ok: true, usuario: creado });
    } catch (error) {
      contextoAuditoria(req, 'usuarios.crear', '', `No se pudo crear el usuario: ${error.message}`);
      return responderError(res, error);
    }
  });

  router.patch('/:id', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;

    const usuarios = req.app.locals.usuarios;
    if (!usuarios) {
      return res.status(503).json({ ok: false, error: 'El directorio de usuarios no está disponible.' });
    }

    try {
      const actualizado = usuarios.actualizar(req.params.id, req.body || {});
      contextoAuditoria(req, 'usuarios.actualizar', actualizado.id, `Se actualizó el usuario ${actualizado.email}.`);
      return res.json({ ok: true, usuario: actualizado });
    } catch (error) {
      const estado = error.message === 'Usuario no encontrado.' ? 404 : 400;
      contextoAuditoria(req, 'usuarios.actualizar', req.params.id, `No se pudo actualizar el usuario: ${error.message}`);
      return responderError(res, error, estado);
    }
  });

  router.post('/:id/contrasena', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;

    const usuarios = req.app.locals.usuarios;
    if (!usuarios) {
      return res.status(503).json({ ok: false, error: 'El directorio de usuarios no está disponible.' });
    }

    try {
      const actualizado = usuarios.actualizar(req.params.id, { contrasena: req.body?.contrasena });
      contextoAuditoria(req, 'usuarios.contrasena', actualizado.id, `Se restableció la contraseña de ${actualizado.email}.`);
      return res.json({ ok: true, usuario: actualizado });
    } catch (error) {
      const estado = error.message === 'Usuario no encontrado.' ? 404 : 400;
      contextoAuditoria(req, 'usuarios.contrasena', req.params.id, `No se pudo restablecer la contraseña: ${error.message}`);
      return responderError(res, error, estado);
    }
  });

  router.delete('/:id', (req, res) => {
    if (!exigirRol(req, res, ROLES_ELIMINACION)) return;

    if (req.auth?.sub && req.auth.sub === req.params.id) {
      return res.status(400).json({ ok: false, error: 'No puedes eliminar tu propio usuario.' });
    }

    const usuarios = req.app.locals.usuarios;
    if (!usuarios) {
      return res.status(503).json({ ok: false, error: 'El directorio de usuarios no está disponible.' });
    }

    try {
      const eliminado = usuarios.eliminar(req.params.id);
      contextoAuditoria(req, 'usuarios.eliminar', eliminado.id, `Se eliminó el usuario ${eliminado.email}.`);
      return res.json({ ok: true, usuario: eliminado });
    } catch (error) {
      const estado = error.message === 'Usuario no encontrado.' ? 404 : 400;
      contextoAuditoria(req, 'usuarios.eliminar', req.params.id, `No se pudo eliminar el usuario: ${error.message}`);
      return responderError(res, error, estado);
    }
  });

  return router;
}
