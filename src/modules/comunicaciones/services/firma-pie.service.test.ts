import { describe, it, expect, beforeEach } from 'vitest';
import { firmaPieService, FIRMA_POR_DEFECTO, PIE_POR_DEFECTO } from './firma-pie.service';

describe('FirmaPieService - Firmas y Pie Legal Corporativo', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('obtiene la firma por defecto con los datos requeridos', () => {
    const firma = firmaPieService.obtenerFirma();
    expect(firma.habilitada).toBe(true);
    expect(firma.nombreRemitente).toBe(FIRMA_POR_DEFECTO.nombreRemitente);
    expect(firma.cargo).toBe(FIRMA_POR_DEFECTO.cargo);
    expect(firma.empresa).toBe(FIRMA_POR_DEFECTO.empresa);
    expect(firma.telefono).toBe(FIRMA_POR_DEFECTO.telefono);
  });

  it('guarda y recupera cambios en la firma personalizada', () => {
    const firmaEditada = {
      ...FIRMA_POR_DEFECTO,
      nombreRemitente: 'Ignacio Silva',
      cargo: 'Ejecutivo Comercial Senior',
      telefono: '+1 (809) 555-0102',
      colorAcento: '#3b82f6',
    };

    firmaPieService.guardarFirma(firmaEditada);
    const recuperada = firmaPieService.obtenerFirma();

    expect(recuperada.nombreRemitente).toBe('Ignacio Silva');
    expect(recuperada.cargo).toBe('Ejecutivo Comercial Senior');
    expect(recuperada.colorAcento).toBe('#3b82f6');
  });

  it('genera correctamente el HTML de la firma con jerarquía y colores', () => {
    const firma = firmaPieService.obtenerFirma();
    const html = firmaPieService.generarHtmlFirma(firma);

    expect(html).toContain('table');
    expect(html).toContain(firma.nombreRemitente);
    expect(html).toContain(firma.cargo);
    expect(html).toContain(firma.empresa);
    expect(html).toContain(firma.telefono);
  });

  it('devuelve cadena vacía si la firma está deshabilitada', () => {
    const html = firmaPieService.generarHtmlFirma({
      ...FIRMA_POR_DEFECTO,
      habilitada: false,
    });
    expect(html).toBe('');
  });

  it('obtiene y guarda la configuración de pie de página institucional', () => {
    const pie = firmaPieService.obtenerPie();
    expect(pie.habilitado).toBe(true);
    expect(pie.incluirAvisoConfidencialidad).toBe(true);
    expect(pie.rncEmpresa).toBe(PIE_POR_DEFECTO.rncEmpresa);

    const pieEditado = {
      ...pie,
      direccionFisica: 'Av. 27 de Febrero, Santo Domingo',
      rncEmpresa: 'RNC: 1-01-99999-1',
    };
    firmaPieService.guardarPie(pieEditado);
    const recuperado = firmaPieService.obtenerPie();

    expect(recuperado.direccionFisica).toBe('Av. 27 de Febrero, Santo Domingo');
    expect(recuperado.rncEmpresa).toBe('RNC: 1-01-99999-1');
  });

  it('genera correctamente el HTML del pie legal con aviso de confidencialidad', () => {
    const pie = firmaPieService.obtenerPie();
    const html = firmaPieService.generarHtmlPie(pie);

    expect(html).toContain('AVISO DE CONFIDENCIALIDAD');
    expect(html).toContain('Ley No. 172-13');
    expect(html).toContain(pie.rncEmpresa || '');
  });
});
