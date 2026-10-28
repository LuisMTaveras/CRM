import crypto from 'node:crypto';

export class OtpError extends Error {
  constructor(codigo, mensaje, detalles = {}) {
    super(mensaje);
    this.name = 'OtpError';
    this.codigo = codigo;
    Object.assign(this, detalles);
  }
}

function codigoAleatorio() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

function compararSeguro(a, b) {
  const izquierda = Buffer.from(String(a || ''));
  const derecha = Buffer.from(String(b || ''));
  if (izquierda.length !== derecha.length) return false;
  return crypto.timingSafeEqual(izquierda, derecha);
}

export function crearOtpStore({
  secreto = crypto.randomBytes(32).toString('hex'),
  ttlMs = 5 * 60 * 1000,
  cooldownMs = 30 * 1000,
  maxIntentos = 5,
  ahora = Date.now,
  generar = codigoAleatorio,
} = {}) {
  const registros = new Map();

  const calcularHash = (codigo, sal) => crypto
    .createHmac('sha256', secreto)
    .update(`${sal}:${codigo}`)
    .digest('hex');

  return {
    solicitar(clave) {
      const identificador = String(clave || '').trim();
      if (!identificador) throw new OtpError('OTP_CLAVE_INVALIDA', 'El número telefónico es requerido.');

      const instante = ahora();
      const existente = registros.get(identificador);
      if (existente && instante < existente.reenvioEn) {
        const segundos = Math.ceil((existente.reenvioEn - instante) / 1000);
        throw new OtpError('OTP_COOLDOWN', `Espera ${segundos} segundos antes de solicitar otro código.`, {
          reintentarEnSegundos: segundos,
        });
      }

      const codigo = String(generar()).padStart(6, '0');
      const sal = crypto.randomBytes(16).toString('hex');
      const expira = instante + ttlMs;
      const reenvioEn = instante + cooldownMs;

      registros.set(identificador, {
        hash: calcularHash(codigo, sal),
        sal,
        expira,
        reenvioEn,
        intentos: 0,
      });

      return {
        codigo,
        expiraEn: new Date(expira).toISOString(),
        reenvioEn: new Date(reenvioEn).toISOString(),
        expiraEnMs: expira,
        reenvioEnMs: reenvioEn,
      };
    },

    verificar(clave, codigoIngresado) {
      const identificador = String(clave || '').trim();
      const codigo = String(codigoIngresado || '').replace(/\D/g, '').trim();
      const registro = registros.get(identificador);

      if (!registro) {
        throw new OtpError('OTP_NO_SOLICITADO', 'No hay un código pendiente para este número. Solicita uno nuevo.');
      }

      const instante = ahora();
      if (instante > registro.expira) {
        registros.delete(identificador);
        throw new OtpError('OTP_EXPIRADO', 'El código de verificación ha expirado. Solicita uno nuevo.');
      }

      const esperado = calcularHash(codigo, registro.sal);
      if (!compararSeguro(esperado, registro.hash)) {
        registro.intentos += 1;
        const restantes = Math.max(0, maxIntentos - registro.intentos);

        if (restantes === 0) {
          registros.delete(identificador);
          throw new OtpError('OTP_BLOQUEADO', 'Se agotaron los intentos permitidos. Solicita un nuevo código.', {
            intentosRestantes: 0,
          });
        }

        throw new OtpError('OTP_INCORRECTO', 'El código ingresado es incorrecto.', {
          intentosRestantes: restantes,
        });
      }

      registros.delete(identificador);
      return { valido: true };
    },

    limpiarExpirados() {
      const instante = ahora();
      for (const [clave, registro] of registros) {
        if (instante > registro.expira) registros.delete(clave);
      }
    },

    reiniciar(clave) {
      registros.delete(String(clave || '').trim());
    },

    limpiar() {
      registros.clear();
    },
  };
}
