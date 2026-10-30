import { Router } from 'express';
import { calcularMetricas } from './metricas-store.js';

const ROLES_LECTURA = ['admin', 'gerente', 'ejecutivo', 'auditor'];
const PERIODOS = ['mes', 'trimestre', 'anual'];

function exigirRol(req, res, roles) {
  const configuracion = req.app.locals.autenticacion;
  if (!configuracion?.requerir) return true;
  if (req.auth?.tipo === 'api-key') return true;
  if (roles.includes(String(req.auth?.rol || ''))) return true;

  res.status(403).json({ ok: false, error: 'No tienes permisos para consultar metricas.' });
  return false;
}

export function crearRutasMetricas() {
  const router = Router();

  router.get('/', (req, res) => {
    if (!exigirRol(req, res, ROLES_LECTURA)) return;

    const clientes = req.app.locals.clientes;
    if (!clientes) {
      return res.status(503).json({ ok: false, error: 'El modulo de clientes no esta disponible.' });
    }

    const solicitado = String(req.query.periodo || 'mes').toLowerCase();
    const periodo = PERIODOS.includes(solicitado) ? solicitado : 'mes';
    const metricas = calcularMetricas(clientes.todos(), periodo);

    return res.json({ ok: true, periodo, metricas });
  });

  return router;
}
