import { describe, it, expect, beforeEach } from 'vitest';
import { cotizacionesService } from './cotizaciones.service';

describe('CotizacionesService - CPQ y Portal de Clientes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('inicializa con cotizaciones semilla empresariales', () => {
    const lista = cotizacionesService.obtenerTodas();
    expect(lista.length).toBeGreaterThan(0);
    expect(lista[0].numero_cotizacion).toContain('COT-');
    expect(lista[0].token_aprobacion).toBeDefined();
  });

  it('permite guardar una nueva cotización calculando folios y tokens únicos', () => {
    const nueva = cotizacionesService.guardar({
      cliente_id: 'cli-test-01',
      cliente_nombre: 'Acme Dominicana SRL',
      fecha_emision: '2026-10-21',
      fecha_vencimiento: '2026-11-21',
      estado: 'enviada',
      items: [
        {
          id: 'item-1',
          sku: 'SRV-01',
          descripcion: 'Consultoría Especializada',
          cantidad: 10,
          precio_unitario: 5000,
          descuento_porcentaje: 0,
          itbis_aplica: true,
          monto_itbis: 9000,
          total_linea: 59000,
        },
      ],
      subtotal: 50000,
      descuento_porcentaje: 0,
      descuento_monto: 0,
      itbis_total: 9000,
      total: 59000,
      moneda: 'DOP',
    });

    expect(nueva.id).toBeDefined();
    expect(nueva.numero_cotizacion).toContain('COT-2026-');
    expect(nueva.token_aprobacion.startsWith('tok_')).toBe(true);

    const recuperada = cotizacionesService.obtenerPorToken(nueva.token_aprobacion);
    expect(recuperada).toBeDefined();
    expect(recuperada?.cliente_nombre).toBe('Acme Dominicana SRL');
  });

  it('permite al cliente aprobar la propuesta formalmente a través de su token público', () => {
    const cot = cotizacionesService.obtenerTodas()[0];
    const token = cot.token_aprobacion;

    const aprobada = cotizacionesService.aprobarPropuestaPorCliente(token, {
      nombre: 'Lic. Roberto Morales',
      cargo: 'Director Ejecutivo',
    });

    expect(aprobada.estado).toBe('aprobada');
    expect(aprobada.aprobado_por_nombre).toBe('Lic. Roberto Morales');
    expect(aprobada.aprobado_por_cargo).toBe('Director Ejecutivo');
    expect(aprobada.aprobado_en).toBeDefined();
  });
});
