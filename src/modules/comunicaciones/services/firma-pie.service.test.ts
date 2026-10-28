import { describe, it, expect, beforeEach, vi } from 'vitest';

const { EMPRESA_PRUEBA } = vi.hoisted(() => ({
  EMPRESA_PRUEBA: {
    razonSocial: 'Empresa de Prueba S.R.L.',
    nombreComercial: 'Empresa de Prueba',
    identificacionFiscal: '1-01-99999-1',
    sitioWeb: 'empresa.test',
    telefono: '+1 (809) 555-0100',
    direccion: 'Calle Falsa 123',
    ciudad: 'Santo Domingo',
  },
}));

vi.mock('@/modules/configuracion/services/empresa.service', () => ({
  empresaService: {
    obtenerDatos: () => ({ ...EMPRESA_PRUEBA }),
  },
}));

import { firmaPieService, FIRMA_POR_DEFECTO } from './firma-pie.service';

describe('FirmaPieService - Firmas y Pie Legal Corporativo', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('obtiene la firma con los datos institucionales de la empresa', () => {
    const firma = firmaPieService.obtenerFirma();
    expect(firma.habilitada).toBe(true);
    expect(firma.nombreRemitente).toBe(FIRMA_POR_DEFECTO.nombreRemitente);
    expect(firma.cargo).toBe(FIRMA_POR_DEFECTO.cargo);
    expect(firma.empresa).toBe(EMPRESA_PRUEBA.razonSocial);
    expect(firma.telefono).toBe(EMPRESA_PRUEBA.telefono);
    expect(firma.sitioWeb).toBe(EMPRESA_PRUEBA.sitioWeb);
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
    expect(recuperada.telefono).toBe(EMPRESA_PRUEBA.telefono);
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
    expect(pie.direccionFisica).toBe('Calle Falsa 123, Santo Domingo');
    expect(pie.rncEmpresa).toBe(`RNC: ${EMPRESA_PRUEBA.identificacionFiscal}`);

    const pieEditado = {
      ...pie,
      textoLegal: 'Texto legal personalizado para pruebas.',
      incluirDireccionEmpresa: false,
    };
    firmaPieService.guardarPie(pieEditado);
    const recuperado = firmaPieService.obtenerPie();

    expect(recuperado.textoLegal).toBe('Texto legal personalizado para pruebas.');
    expect(recuperado.incluirDireccionEmpresa).toBe(false);
    expect(recuperado.direccionFisica).toBe('Calle Falsa 123, Santo Domingo');
    expect(recuperado.rncEmpresa).toBe(`RNC: ${EMPRESA_PRUEBA.identificacionFiscal}`);
  });

  it('genera correctamente el HTML del pie legal con aviso de confidencialidad', () => {
    const pie = firmaPieService.obtenerPie();
    const html = firmaPieService.generarHtmlPie(pie);

    expect(html).toContain('AVISO DE CONFIDENCIALIDAD');
    expect(html).toContain('Ley No. 172-13');
    expect(html).toContain(pie.rncEmpresa);
  });
});
