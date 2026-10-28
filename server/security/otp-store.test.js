import { describe, expect, it } from 'vitest';
import { crearOtpStore } from './otp-store.js';

function capturar(fn) {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('Se esperaba una excepción.');
}

describe('otp-store', () => {
  it('genera códigos de seis dígitos y respeta el cooldown', () => {
    let ahora = 1_000;
    const store = crearOtpStore({
      secreto: 'secreto-otp-suficientemente-largo',
      ahora: () => ahora,
      generar: () => '123456',
      cooldownMs: 30_000,
      ttlMs: 60_000,
    });

    const solicitud = store.solicitar('18297084706');
    expect(solicitud.codigo).toBe('123456');
    expect(solicitud.expiraEnMs).toBe(61_000);

    const error = capturar(() => store.solicitar('18297084706'));
    expect(error.codigo).toBe('OTP_COOLDOWN');
    expect(error.reintentarEnSegundos).toBe(30);

    ahora += 30_001;
    expect(store.solicitar('18297084706').codigo).toBe('123456');
  });

  it('verifica el código correcto una sola vez', () => {
    const store = crearOtpStore({ secreto: 'secreto-otp-suficientemente-largo', generar: () => '654321' });
    store.solicitar('18297084706');

    expect(store.verificar('18297084706', '654321')).toEqual({ valido: true });
    expect(capturar(() => store.verificar('18297084706', '654321')).codigo).toBe('OTP_NO_SOLICITADO');
  });

  it('acepta el código con espacios y guiones', () => {
    const store = crearOtpStore({ secreto: 'secreto-otp-suficientemente-largo', generar: () => '112233' });
    store.solicitar('18297084706');
    expect(store.verificar('18297084706', '112-233').valido).toBe(true);
  });

  it('bloquea el código después de agotar los intentos', () => {
    const store = crearOtpStore({
      secreto: 'secreto-otp-suficientemente-largo',
      generar: () => '123456',
      maxIntentos: 2,
    });
    store.solicitar('18297084706');

    const primero = capturar(() => store.verificar('18297084706', '000000'));
    expect(primero.codigo).toBe('OTP_INCORRECTO');
    expect(primero.intentosRestantes).toBe(1);

    const segundo = capturar(() => store.verificar('18297084706', '000000'));
    expect(segundo.codigo).toBe('OTP_BLOQUEADO');
    expect(segundo.intentosRestantes).toBe(0);

    expect(capturar(() => store.verificar('18297084706', '123456')).codigo).toBe('OTP_NO_SOLICITADO');
  });

  it('rechaza códigos expirados y permete limpiar registros', () => {
    let ahora = 1_000;
    const store = crearOtpStore({
      secreto: 'secreto-otp-suficientemente-largo',
      ahora: () => ahora,
      ttlMs: 1_000,
      generar: () => '123456',
    });
    store.solicitar('18297084706');

    ahora += 1_001;
    expect(capturar(() => store.verificar('18297084706', '123456')).codigo).toBe('OTP_EXPIRADO');

    store.solicitar('18297084707');
    ahora += 1_001;
    store.limpiarExpirados();
    expect(capturar(() => store.verificar('18297084707', '123456')).codigo).toBe('OTP_NO_SOLICITADO');
  });
});
