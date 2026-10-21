import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from './auth.service';

describe('AuthService - Autenticación y WhatsApp OTP', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('autentica credenciales válidas y retorna sesión con token y reglas', async () => {
    const sesion = await authService.login({
      email: 'luismiguel@alliance.do',
      contrasena: 'admin123',
      recordarme: true,
    });

    expect(sesion).toBeDefined();
    expect(sesion.token).toBeTruthy();
    expect(sesion.usuario.email).toBe('luismiguel@alliance.do');
    expect(sesion.usuario.rol).toBe('admin');
    expect(sesion.reglas.length).toBeGreaterThan(0);
  });

  it('rechaza contraseñas inválidas', async () => {
    await expect(
      authService.login({
        email: 'admin@crm.do',
        contrasena: 'clave_incorrecta',
      })
    ).rejects.toThrow('Credenciales inválidas');
  });

  it('solicita OTP de WhatsApp llamando al endpoint o emite fallback en local', async () => {
    // Mock global fetch para simular respuesta del servidor de WhatsApp
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        mensaje: 'Código enviado por WhatsApp',
        codigo: '482910',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const respuesta = await authService.solicitarOtpWhatsApp('+1 (829) 708-4706');
    expect(respuesta.ok).toBe(true);
    expect(respuesta.mensaje).toContain('Código enviado');
  });

  it('inicia sesión mediante OTP de WhatsApp', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        valido: true,
        mensaje: 'Código verificado con éxito',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const sesion = await authService.loginConOtp('+1 (829) 708-4706', '123456');
    expect(sesion).toBeDefined();
    expect(sesion.usuario.telefonoFlota).toBe('+1 (829) 708-4706');
    expect(sesion.token).toBeTruthy();
    expect(sesion.reglas).toBeDefined();
  });

  it('rechaza inicio de sesión cuando el OTP es incorrecto', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        ok: false,
        valido: false,
        mensaje: 'Código de verificación inválido o expirado.',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      authService.loginConOtp('+1 (829) 708-4706', '000000')
    ).rejects.toThrow();
  });
});
