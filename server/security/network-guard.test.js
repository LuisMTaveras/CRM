import { describe, expect, it, vi } from 'vitest';
import {
  esHostBloqueado,
  esIpPrivada,
  extraerHostsCorreo,
  validarHostDestino,
} from './network-guard.js';

describe('network-guard', () => {
  it('detecta redes privadas IPv4 e IPv6', () => {
    expect(esIpPrivada('127.0.0.1')).toBe(true);
    expect(esIpPrivada('10.1.2.3')).toBe(true);
    expect(esIpPrivada('172.20.0.1')).toBe(true);
    expect(esIpPrivada('192.168.1.20')).toBe(true);
    expect(esIpPrivada('169.254.169.254')).toBe(true);
    expect(esIpPrivada('::1')).toBe(true);
    expect(esIpPrivada('fe80::1')).toBe(true);
    expect(esIpPrivada('::ffff:127.0.0.1')).toBe(true);
    expect(esIpPrivada('8.8.8.8')).toBe(false);
    expect(esIpPrivada('2606:4700:4700::1111')).toBe(false);
  });

  it('bloquea hosts locales y nombres internos', () => {
    expect(esHostBloqueado('localhost')).toBe(true);
    expect(esHostBloqueado('servidor.local')).toBe(true);
    expect(esHostBloqueado('metadata.google.internal')).toBe(true);
    expect(esHostBloqueado('smtp.gmail.com')).toBe(false);
  });

  it('rechaza IPs privadas, localhost y hosts no resueltos', async () => {
    await expect(validarHostDestino('127.0.0.1')).rejects.toMatchObject({ code: 'HOST_PRIVADO' });
    await expect(validarHostDestino('localhost')).rejects.toMatchObject({ code: 'HOST_BLOQUEADO' });
    await expect(validarHostDestino('http://smtp.example.com')).rejects.toMatchObject({ code: 'HOST_INVALIDO' });

    const resolverFallido = vi.fn().mockRejectedValue(new Error('sin DNS'));
    await expect(validarHostDestino('smtp.example.com', { resolver: resolverFallido }))
      .rejects.toMatchObject({ code: 'HOST_NO_RESUELTO' });
  });

  it('rechaza dominios que resuelven a una IP privada', async () => {
    const resolver = vi.fn().mockResolvedValue([{ address: '10.0.0.15', family: 4 }]);
    await expect(validarHostDestino('smtp.example.com', { resolver }))
      .rejects.toMatchObject({ code: 'HOST_PRIVADO' });
  });

  it('acepta dominios que resuelven solo a IPs públicas', async () => {
    const resolver = vi.fn().mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    const resultado = await validarHostDestino('smtp.example.com', { resolver });
    expect(resultado.host).toBe('smtp.example.com');
    expect(resultado.direcciones).toEqual(['93.184.216.34']);
  });

  it('permite hosts privados solo con la opción explícita', async () => {
    const resultado = await validarHostDestino('127.0.0.1', { permitirPrivadas: true });
    expect(resultado.host).toBe('127.0.0.1');
  });

  it('extrae servidores SMTP e IMAP del cuerpo', () => {
    const hosts = extraerHostsCorreo({
      servidorSmtp: 'smtp.principal.com',
      smtpConfig: { servidorSmtp: 'smtp.secundario.com' },
      imapConfig: { servidorImap: 'imap.principal.com' },
      correos: [{ servidorImap: 'imap.masivo.com' }],
    });

    expect(hosts).toEqual([
      'smtp.principal.com',
      'smtp.secundario.com',
      'imap.principal.com',
      'imap.masivo.com',
    ]);
  });
});
