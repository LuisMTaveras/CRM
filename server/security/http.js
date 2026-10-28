const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function cabecerasSeguridad(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  next();
}

export function validarOrigen(origenesPermitidos) {
  const permitidos = new Set(origenesPermitidos);

  return (req, res, next) => {
    if (METODOS_SEGUROS.has(req.method)) return next();

    const origen = req.get('origin');
    if (!origen || permitidos.has(origen)) return next();

    return res.status(403).json({
      ok: false,
      error: 'Origen de solicitud no autorizado.',
    });
  };
}

export function sinCache(_req, res, next) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  next();
}

export function manejarErrores(err, _req, res, _next) {
  void _next;
  const esProduccion = process.env.NODE_ENV === 'production';
  console.error('[HTTP ERROR]', err?.stack || err?.message || err);

  if (res.headersSent) {
    return res.end();
  }

  return res.status(500).json({
    ok: false,
    error: esProduccion ? 'Error interno del servidor.' : err?.message || 'Error interno del servidor.',
  });
}
