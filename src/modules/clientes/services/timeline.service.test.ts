import { describe, it, expect, beforeEach } from 'vitest';
import { timelineService } from './timeline.service';

describe('TimelineService - Bitácora Cronológica & Historial del Cliente (EP-01)', () => {
  beforeEach(() => {
    timelineService.restablecerSemillas();
  });

  it('inicializa con eventos semilla asociados a clientes', () => {
    const eventos = timelineService.eventos.value;
    expect(eventos.length).toBeGreaterThanOrEqual(4);
    const eventosIQtek = timelineService.obtenerTimelinePorCliente('c0010000-0000-4000-8000-000000000001');
    expect(eventosIQtek.length).toBeGreaterThanOrEqual(3);
  });

  it('permite registrar una nueva nota rápida de interacción', () => {
    const clienteId = 'c0010000-0000-4000-8000-000000000001';
    const antes = timelineService.obtenerTimelinePorCliente(clienteId).length;

    const creada = timelineService.registrarNotaRapida(
      clienteId,
      'llamada',
      'Llamada de seguimiento con el Gerente General',
      'Confirmó disponibilidad para firmar el contrato la próxima semana.',
      'Camila Morales'
    );

    expect(creada.id).toBeDefined();
    expect(creada.tipo).toBe('llamada');
    expect(creada.titulo).toContain('Llamada de seguimiento');
    const despues = timelineService.obtenerTimelinePorCliente(clienteId).length;
    expect(despues).toBe(antes + 1);
  });

  it('permite filtrar la bitácora por tipo de evento y búsqueda de texto', () => {
    const clienteId = 'c0010000-0000-4000-8000-000000000001';

    // Filtrar por propuesta
    const soloPropuestas = timelineService.obtenerTimelinePorCliente(clienteId, { tipo: 'propuesta' });
    expect(soloPropuestas.every((e) => e.tipo === 'propuesta')).toBe(true);

    // Búsqueda por texto
    const busqueda = timelineService.obtenerTimelinePorCliente(clienteId, { busqueda: 'servidores' });
    expect(busqueda.length).toBeGreaterThan(0);
    expect(busqueda[0].descripcion.toLowerCase()).toContain('servidores');
  });

  it('registra automáticamente cambios de etapa en el pipeline', () => {
    const clienteId = 'c0010000-0000-4000-8000-000000000002';
    const evento = timelineService.registrarCambioEtapa(
      clienteId,
      'Suministro de Servidores',
      'Calificación',
      'Propuesta Enviada',
      'Sistema'
    );

    expect(evento.tipo).toBe('cambio_etapa');
    expect(evento.metadatos?.etapaAnterior).toBe('Calificación');
    expect(evento.metadatos?.nuevaEtapa).toBe('Propuesta Enviada');
  });

  it('permite eliminar un evento del historial', () => {
    const clienteId = 'c0010000-0000-4000-8000-000000000001';
    const creada = timelineService.registrarNotaRapida(clienteId, 'nota', 'Nota a borrar', 'Texto');
    const exito = timelineService.eliminarEvento(creada.id);
    expect(exito).toBe(true);
    const eventos = timelineService.obtenerTimelinePorCliente(clienteId);
    expect(eventos.find((e) => e.id === creada.id)).toBeUndefined();
  });
});
