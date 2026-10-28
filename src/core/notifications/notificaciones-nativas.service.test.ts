import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { notificacionesNativasService } from './notificaciones-nativas.service';

class AudioFalso {
  volume = 1;
  play(): Promise<void> {
    return Promise.resolve();
  }
}

describe('NotificacionesNativasService - Sonidos Chime Web Audio y Push de Escritorio', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('Audio', AudioFalso);
    notificacionesNativasService.sonidoHabilitado.value = true;
    notificacionesNativasService.escritorioHabilitado.value = true;
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('inicializa el estado de sonido y escritorio con valores predeterminados seguros', () => {
    expect(notificacionesNativasService.sonidoHabilitado.value).toBe(true);
    expect(notificacionesNativasService.escritorioHabilitado.value).toBe(true);
    expect(notificacionesNativasService.permiso.value).toBeDefined();
  });

  it('permite alternar el estado del sonido y persistir en localStorage', () => {
    notificacionesNativasService.alternarSonido();
    expect(notificacionesNativasService.sonidoHabilitado.value).toBe(false);
    expect(localStorage.getItem('crm_notificaciones_sonido_v1')).toBe('false');

    notificacionesNativasService.alternarSonido();
    expect(notificacionesNativasService.sonidoHabilitado.value).toBe(true);
    expect(localStorage.getItem('crm_notificaciones_sonido_v1')).toBe('true');
  });

  it('permite alternar el estado de avisos de escritorio y persistir en localStorage', () => {
    notificacionesNativasService.alternarEscritorio();
    expect(notificacionesNativasService.escritorioHabilitado.value).toBe(false);
    expect(localStorage.getItem('crm_notificaciones_escritorio_v1')).toBe('false');

    notificacionesNativasService.alternarEscritorio();
    expect(notificacionesNativasService.escritorioHabilitado.value).toBe(true);
    expect(localStorage.getItem('crm_notificaciones_escritorio_v1')).toBe('true');
  });

  it('reproduce chimes sintetizados sin lanzar excepciones para todos los tipos de aviso', () => {
    expect(() => notificacionesNativasService.reproducirChime('whatsapp')).not.toThrow();
    expect(() => notificacionesNativasService.reproducirChime('tarea')).not.toThrow();
    expect(() => notificacionesNativasService.reproducirChime('urgente')).not.toThrow();
    expect(() => notificacionesNativasService.reproducirChime('general')).not.toThrow();
  });

  it('ejecuta notificar() de forma tolerante a fallos sin arrojar excepciones', () => {
    expect(() =>
      notificacionesNativasService.notificar('Mensaje nuevo de WhatsApp', {
        cuerpo: 'Hola, confirmando la cotización',
        ruta: '/whatsapp',
        tipoSonido: 'whatsapp',
      })
    ).not.toThrow();

    expect(() =>
      notificacionesNativasService.notificar('Tarea Próxima: Reunión de cierre', {
        cuerpo: 'Programada con Banco BHD León',
        ruta: '/agenda',
        tipoSonido: 'tarea',
      })
    ).not.toThrow();
  });
});
