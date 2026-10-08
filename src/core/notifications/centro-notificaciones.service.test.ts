import { describe, it, expect, beforeEach } from 'vitest';
import { centroNotificacionesService } from './centro-notificaciones.service';

describe('CentroNotificacionesService - Centro de Alertas B2B', () => {
  beforeEach(() => {
    centroNotificacionesService.restablecerSemillas();
  });

  it('inicializa con notificaciones iniciales y calcula correctamente el total de no leídas', () => {
    const listado = centroNotificacionesService.notificaciones.value;
    expect(listado.length).toBeGreaterThan(0);
    const noLeidas = centroNotificacionesService.totalNoLeidas.value;
    expect(noLeidas).toBeGreaterThanOrEqual(1);
  });

  it('permite agregar una nueva notificación en tiempo real y aumenta el contador de no leídas', () => {
    const antes = centroNotificacionesService.totalNoLeidas.value;
    const creada = centroNotificacionesService.agregarNotificacion({
      tipo: 'correo',
      titulo: 'Mensaje urgente de prueba',
      mensaje: 'Revisión de contrato requerida',
      prioridad: 'alta',
      ruta: '/comunicaciones',
    });

    expect(creada.id).toBeDefined();
    expect(creada.leida).toBe(false);
    expect(centroNotificacionesService.totalNoLeidas.value).toBe(antes + 1);
  });

  it('permite marcar una notificación individual como leída', () => {
    const creada = centroNotificacionesService.agregarNotificacion({
      tipo: 'cliente',
      titulo: 'Seguimiento programado',
      mensaje: 'Llamar a contacto clave',
    });

    expect(creada.leida).toBe(false);
    centroNotificacionesService.marcarComoLeida(creada.id);

    const encontrada = centroNotificacionesService.notificaciones.value.find((n) => n.id === creada.id);
    expect(encontrada?.leida).toBe(true);
  });

  it('permite marcar todas las notificaciones como leídas simultáneamente', () => {
    centroNotificacionesService.marcarTodasComoLeidas();
    expect(centroNotificacionesService.totalNoLeidas.value).toBe(0);
  });

  it('permite eliminar una notificación y vaciar el historial', () => {
    const creada = centroNotificacionesService.agregarNotificacion({
      tipo: 'sistema',
      titulo: 'Respaldo automático',
      mensaje: 'Base de datos sincronizada',
    });

    centroNotificacionesService.eliminarNotificacion(creada.id);
    expect(centroNotificacionesService.notificaciones.value.find((n) => n.id === creada.id)).toBeUndefined();

    centroNotificacionesService.limpiarTodas();
    expect(centroNotificacionesService.notificaciones.value.length).toBe(0);
    expect(centroNotificacionesService.totalNoLeidas.value).toBe(0);
  });
});
