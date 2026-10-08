import { describe, it, expect, beforeEach } from 'vitest';
import { actividadesService } from './actividades.service';
import { centroNotificacionesService } from '@/core/notifications/centro-notificaciones.service';

describe('ActividadesService - Agenda, Next Steps & Detector de Clientes Estancados (EP-02)', () => {
  beforeEach(() => {
    actividadesService.restablecerSemillas();
    centroNotificacionesService.limpiarTodas();
  });

  it('inicializa con semillas realistas de actividades', () => {
    const listado = actividadesService.actividades.value;
    expect(listado.length).toBeGreaterThanOrEqual(4);
    expect(listado.some((a) => a.clienteNombre.includes('IQtek'))).toBe(true);
  });

  it('calcula métricas de la agenda con precisión', () => {
    const metricas = actividadesService.obtenerMetricas();
    expect(metricas.total).toBeGreaterThan(0);
    expect(typeof metricas.pendientesHoy).toBe('number');
    expect(typeof metricas.vencidas).toBe('number');
    expect(typeof metricas.completadas).toBe('number');
    expect(metricas.porcentajeCumplimiento).toBeGreaterThanOrEqual(0);
    expect(metricas.porcentajeCumplimiento).toBeLessThanOrEqual(100);
  });

  it('permite registrar una nueva actividad comercial', () => {
    const totalAntes = actividadesService.actividades.value.length;
    const manana = new Date(Date.now() + 86400000).toISOString();

    const nueva = actividadesService.crearActividad({
      clienteId: 'c-test-01',
      clienteNombre: 'Claro Dominicana',
      clienteSector: 'Telecomunicaciones',
      titulo: 'Reunión de presentación ejecutiva de ciberseguridad',
      descripcion: 'Presentar suite empresarial con Carlos Martínez.',
      tipo: 'reunion',
      prioridad: 'alta',
      fechaLimite: manana,
      responsable: 'Camila Morales',
    });

    expect(nueva.id).toBeDefined();
    expect(nueva.estado).toBe('pendiente');
    expect(actividadesService.actividades.value.length).toBe(totalAntes + 1);
    expect(actividadesService.obtenerActividadPorId(nueva.id)).toBeDefined();
  });

  it('permite actualizar y completar una actividad con notas de resultado', () => {
    const manana = new Date(Date.now() + 86400000).toISOString();
    const creada = actividadesService.crearActividad({
      clienteId: 'c-test-02',
      clienteNombre: 'Grupo Punta Cana',
      titulo: 'Llamada telefónica de confirmación',
      tipo: 'llamada',
      prioridad: 'media',
      fechaLimite: manana,
      responsable: 'Jean Carlos Peña',
    });

    // Actualizar datos
    actividadesService.actualizarActividad(creada.id, {
      titulo: 'Llamada telefónica modificada',
      prioridad: 'alta',
    });
    let encontrada = actividadesService.obtenerActividadPorId(creada.id);
    expect(encontrada?.titulo).toBe('Llamada telefónica modificada');
    expect(encontrada?.prioridad).toBe('alta');

    // Marcar como completada
    const completada = actividadesService.marcarCompletada(
      creada.id,
      'Se acordó enviar la propuesta definitiva este viernes.'
    );
    expect(completada.estado).toBe('completada');
    expect(completada.resultadoNotas).toBe('Se acordó enviar la propuesta definitiva este viernes.');
    expect(completada.completadoEn).toBeDefined();
  });

  it('permite eliminar una actividad', () => {
    const creada = actividadesService.crearActividad({
      clienteId: 'c-test-03',
      clienteNombre: 'Banco Central RD',
      titulo: 'Revisión preliminar de términos',
      tipo: 'tarea',
      prioridad: 'baja',
      fechaLimite: new Date().toISOString(),
      responsable: 'Camila Morales',
    });

    const exito = actividadesService.eliminarActividad(creada.id);
    expect(exito).toBe(true);
    expect(actividadesService.obtenerActividadPorId(creada.id)).toBeUndefined();
  });

  it('aplica filtros de rango, tipo, prioridad y búsqueda', () => {
    // Filtrar por completadas
    const completadas = actividadesService.obtenerActividades({ rango: 'completadas' });
    expect(completadas.every((a) => a.estado === 'completada')).toBe(true);

    // Filtrar por tipo
    const llamadas = actividadesService.obtenerActividades({ tipo: 'llamada' });
    expect(llamadas.every((a) => a.tipo === 'llamada')).toBe(true);

    // Búsqueda textual
    const resultados = actividadesService.obtenerActividades({ busqueda: 'BHD' });
    expect(resultados.every((a) => a.clienteNombre.includes('BHD') || a.titulo.includes('BHD'))).toBe(true);
  });

  it('detecta clientes estancados con más de 10 días sin interacción', () => {
    const fechaAntigua = new Date(Date.now() - 86400000 * 15).toISOString(); // 15 días atrás
    const tarjetaAntigua = { id: 'tar-antigua', creado_en: fechaAntigua };
    const clienteAntiguo = { id: 'cli-antiguo', ultimo_contacto: fechaAntigua, creado_en: fechaAntigua };

    const diag = actividadesService.esClienteEstancado(tarjetaAntigua, clienteAntiguo, 10);
    expect(diag.estancado).toBe(true);
    expect(diag.diasSinContacto).toBeGreaterThanOrEqual(14);
  });

  it('no marca como estancado a un cliente con interacción reciente (< 10 días)', () => {
    const fechaReciente = new Date(Date.now() - 86400000 * 3).toISOString(); // 3 días atrás
    const tarjetaReciente = { id: 'tar-reciente', creado_en: fechaReciente };
    const clienteReciente = { id: 'cli-reciente', ultimo_contacto: fechaReciente };

    const diag = actividadesService.esClienteEstancado(tarjetaReciente, clienteReciente, 10);
    expect(diag.estancado).toBe(false);
    expect(diag.diasSinContacto).toBeLessThanOrEqual(5);
  });

  it('sincroniza alertas de tareas vencidas y de hoy con el Centro de Notificaciones', () => {
    centroNotificacionesService.limpiarTodas();
    const resultado = actividadesService.sincronizarConCentroNotificaciones();

    const notificaciones = centroNotificacionesService.notificaciones.value;
    const notifsTareas = notificaciones.filter((n) => n.tipo === 'tarea');

    expect(notifsTareas.length).toBeGreaterThan(0);
    expect(resultado.vencidas + resultado.hoy).toBeGreaterThan(0);
  });
});
