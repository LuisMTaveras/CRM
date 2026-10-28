import { Router } from 'express';
import { ipDe } from '../security/rate-limit.js';

const ROLES_AUDITORIA = ['admin', 'gerente', 'auditor'];

function exigirRol(req, res, roles) {
  const configuracion = req.app.locals.autenticacion;
  if (!configuracion?.requerir) return true;
  if (req.auth?.tipo === 'api-key') return true;

  const rol = String(req.auth?.rol || '');
  if (roles.includes(rol)) return true;

  res.status(403).json({ ok: false, error: 'No tienes permisos para realizar esta acción.' });
  return false;
}

function celdaCsv(valor) {
  let texto = String(valor ?? '');
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return `"${texto.replace(/"/g, '""')}"`;
}

export function crearMiddlewareAuditoria(registro) {
  return (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

    res.on('finish', () => {
      try {
        const contexto = req.auditoria && typeof req.auditoria === 'object' ? req.auditoria : {};
        const ruta = `${req.baseUrl || ''}${req.path || ''}`.replace(/\?.*$/, '');
        const segmentos = ruta.split('/').filter(Boolean);
        const actor = req.auth
          ? {
              id: req.auth.sub || '',
              email: req.auth.email || '',
              nombre: req.auth.nombre || '',
              rol: req.auth.rol || '',
            }
          : contexto.actorEmail
            ? { email: contexto.actorEmail }
            : null;

        registro.registrar({
          actor,
          accion: contexto.accion || `${req.method} ${ruta}`,
          entidad: contexto.entidad || segmentos[1] || '',
          entidadId: contexto.entidadId || req.params?.id || '',
          exito: res.statusCode < 400,
          ip: ipDe(req),
          detalle: contexto.detalle || '',
          metadata: contexto.metadata || null,
        });
      } catch (error) {
        console.error('[AUDITORIA] No se pudo registrar el evento:', error.message);
      }
    });

    next();
  };
}

export function crearRutasAuditoria() {
  const router = Router();

  router.get('/', (req, res) => {
    if (!exigirRol(req, res, ROLES_AUDITORIA)) return;

    const registro = req.app.locals.auditoria;
    if (!registro) {
      return res.status(503).json({ ok: false, error: 'El registro de auditoría no está disponible.' });
    }

    const resultado = registro.listar({
      page: req.query.page,
      pageSize: req.query.pageSize,
      q: req.query.q,
      accion: req.query.accion,
      entidad: req.query.entidad,
      desde: req.query.desde,
      hasta: req.query.hasta,
      exito: req.query.exito,
    });

    return res.json({ ok: true, ...resultado });
  });

  router.get('/exportar.csv', (req, res) => {
    if (!exigirRol(req, res, ROLES_AUDITORIA)) return;

    const registro = req.app.locals.auditoria;
    if (!registro) {
      return res.status(503).json({ ok: false, error: 'El registro de auditoría no está disponible.' });
    }

    const eventos = registro.exportar({
      q: req.query.q,
      accion: req.query.accion,
      entidad: req.query.entidad,
      desde: req.query.desde,
      hasta: req.query.hasta,
      exito: req.query.exito,
    });

    const encabezado = [
      'Fecha',
      'Actor',
      'Correo',
      'Rol',
      'Acción',
      'Entidad',
      'Entidad ID',
      'Resultado',
      'IP',
      'Detalle',
    ];
    const lineas = eventos.map((evento) => [
      evento.timestamp,
      evento.actor?.nombre || '',
      evento.actor?.email || '',
      evento.actor?.rol || '',
      evento.accion,
      evento.entidad,
      evento.entidadId,
      evento.exito ? 'Exitoso' : 'Fallido',
      evento.ip,
      evento.detalle,
    ].map(celdaCsv).join(','));

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="auditoria-crm.csv"');
    return res.send(`\ufeff${[encabezado.map(celdaCsv).join(','), ...lineas].join('\r\n')}`);
  });

  return router;
}
