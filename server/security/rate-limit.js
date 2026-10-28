export function crearLimitador({ maximo, ventanaMs, ahora = Date.now }) {
  if (!Number.isFinite(maximo) || maximo <= 0) throw new Error('maximo debe ser mayor que cero.');
  if (!Number.isFinite(ventanaMs) || ventanaMs <= 0) throw new Error('ventanaMs debe ser mayor que cero.');

  const registros = new Map();

  const limpiar = (instante) => {
    if (registros.size < 5000) return;
    for (const [clave, registro] of registros) {
      if (registro.reinicio <= instante) registros.delete(clave);
    }
  };

  return {
    consumir(clave, costo = 1) {
      const instante = ahora();
      const identificador = String(clave || 'anonimo');
      let registro = registros.get(identificador);

      if (!registro || registro.reinicio <= instante) {
        registro = { conteo: 0, reinicio: instante + ventanaMs };
        registros.set(identificador, registro);
      }

      registro.conteo += Math.max(1, costo);
      limpiar(instante);

      const permitido = registro.conteo <= maximo;
      return {
        permitido,
        limite: maximo,
        restante: Math.max(0, maximo - registro.conteo),
        reinicio: registro.reinicio,
        reintentarEnSegundos: Math.max(0, Math.ceil((registro.reinicio - instante) / 1000)),
      };
    },
    reiniciar(clave) {
      registros.delete(String(clave || 'anonimo'));
    },
    limpiar() {
      registros.clear();
    },
  };
}

export function ipDe(req) {
  return req.ip || req.socket?.remoteAddress || 'desconocido';
}

export function crearMiddlewareRateLimit({
  maximo,
  ventanaMs,
  obtenerClave = ipDe,
  mensaje = 'Demasiadas solicitudes. Intenta nuevamente más tarde.',
  ahora = Date.now,
}) {
  const limitador = crearLimitador({ maximo, ventanaMs, ahora });

  return (req, res, next) => {
    const resultado = limitador.consumir(obtenerClave(req));
    res.setHeader('RateLimit-Limit', String(resultado.limite));
    res.setHeader('RateLimit-Remaining', String(resultado.restante));
    res.setHeader('RateLimit-Reset', String(Math.ceil(resultado.reinicio / 1000)));

    if (!resultado.permitido) {
      res.setHeader('Retry-After', String(resultado.reintentarEnSegundos));
      return res.status(429).json({
        ok: false,
        error: mensaje,
        reintentarEnSegundos: resultado.reintentarEnSegundos,
      });
    }

    return next();
  };
}
