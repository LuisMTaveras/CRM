import { describe, it, expect } from 'vitest';
import { catalogoService } from './catalogo.service';

describe('CatalogoService & Motor CPQ', () => {
  it('obtiene el catálogo maestro con servicios precargados', () => {
    const catalogo = catalogoService.obtenerCatalogo();
    expect(catalogo.length).toBeGreaterThanOrEqual(5);

    const crm = catalogoService.obtenerItemPorCodigo('CRM-CLOUD-ENT');
    expect(crm).toBeDefined();
    expect(crm?.precioBase).toBe(45000);
    expect(crm?.aplicaItbis).toBe(true);
    expect(crm?.tasaItbis).toBe(0.18);
  });

  it('calcula correctamente una línea de cotización sin descuento', () => {
    const crm = catalogoService.obtenerItemPorCodigo('CRM-CLOUD-ENT')!;
    const linea = catalogoService.crearLineaDesdeItem(crm, 2, 0);

    // 2 * 45,000 = 90,000 bruto
    expect(linea.subtotal).toBe(90000);
    expect(linea.montoDescuento).toBe(0);
    // ITBIS 18% de 90,000 = 16,200
    expect(linea.montoItbis).toBe(16200);
    // Total = 90,000 + 16,200 = 106,200
    expect(linea.total).toBe(106200);
  });

  it('calcula correctamente una línea de cotización con 10% de descuento', () => {
    const item = catalogoService.obtenerItemPorCodigo('IMP-ONBOARD-PRO')!; // 120,000
    const linea = catalogoService.crearLineaDesdeItem(item, 1, 10);

    expect(linea.subtotal).toBe(120000);
    expect(linea.montoDescuento).toBe(12000); // 10%
    const neto = 108000;
    // ITBIS 18% de 108,000 = 19,440
    expect(linea.montoItbis).toBe(19440);
    expect(linea.total).toBe(neto + 19440); // 127,440
  });

  it('respeta ítems exentos de ITBIS como auditorías internacionales', () => {
    const item = catalogoService.obtenerItemPorCodigo('AUD-INFRA-SEC')!; // USD 1,500, exento
    const linea = catalogoService.crearLineaDesdeItem(item, 1, 0);

    expect(linea.subtotal).toBe(1500);
    expect(linea.montoItbis).toBe(0);
    expect(linea.total).toBe(1500);
  });

  it('calcula el resumen acumulado de una cotización con múltiples líneas', () => {
    const item1 = catalogoService.obtenerItemPorCodigo('CRM-CLOUD-ENT')!; // 45,000, 18%
    const item2 = catalogoService.obtenerItemPorCodigo('CAP-EQUIPO-COM')!; // 35,000, 18%

    const l1 = catalogoService.crearLineaDesdeItem(item1, 1, 0);
    const l2 = catalogoService.crearLineaDesdeItem(item2, 2, 10); // 70,000 bruto - 7,000 desc = 63,000 neto

    const resumen = catalogoService.calcularResumen([l1, l2], 'DOP');

    expect(resumen.subtotalBruto).toBe(45000 + 70000); // 115,000
    expect(resumen.descuentoTotal).toBe(7000);
    expect(resumen.subtotalNeto).toBe(108000);
    // ITBIS 18% de (45,000 + 63,000 = 108,000) = 19,440
    expect(resumen.itbisTotal).toBe(19440);
    expect(resumen.totalPagar).toBe(108000 + 19440); // 127,440
  });

  it('soporta líneas personalizadas y previene entradas inválidas', () => {
    const linea = catalogoService.crearLineaPersonalizada('Servicio Especial de Red', 10000, -5, 150);
    // Cantidad negativa debe normalizarse a 1, descuento > 100 normalizarse a 100
    expect(linea.cantidad).toBe(1);
    expect(linea.descuentoPorcentaje).toBe(100);
    expect(linea.subtotal).toBe(10000);
    expect(linea.montoDescuento).toBe(10000);
    expect(linea.total).toBe(0);
  });
});
