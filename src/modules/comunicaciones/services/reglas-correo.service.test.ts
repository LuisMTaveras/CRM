import { describe, it, expect, beforeEach, vi } from 'vitest';
import { reglasCorreoService } from './reglas-correo.service';
import type { MensajeCorreo } from '../types/webmail.types';
import type { ReglaCorreo } from '../types/reglas-correo.types';

describe('ReglasCorreoService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const crearMensajeDemo = (parcial: Partial<MensajeCorreo> = {}): MensajeCorreo => ({
    id: 'msg-1',
    uid: 101,
    carpeta: 'inbox',
    de: { nombre: 'Ing. Carlos Vera', correo: 'carlos@verafeca.com' },
    para: [{ nombre: 'Ventas', correo: 'ventas@empresa.com' }],
    asunto: 'Factura correspondiente al servicio de Octubre',
    extracto: 'Estimados, adjunto la factura comercial...',
    cuerpoTexto: 'Estimados, adjunto la factura comercial...',
    cuerpoHtml: '<p>Estimados, adjunto la factura comercial...</p>',
    fecha: new Date().toISOString(),
    leido: false,
    destacado: false,
    tieneAdjuntos: true,
    adjuntos: [
      {
        id: 'att-1',
        nombre: 'Factura-B0100023.pdf',
        tamanoBytes: 154000,
        tipoContenido: 'application/pdf',
      },
    ],
    ...parcial,
  });

  it('extrae correctamente el dominio de un correo electrónico', () => {
    expect(reglasCorreoService.extraerDominio('usuario@verafeca.com')).toBe('verafeca.com');
    expect(reglasCorreoService.extraerDominio('JUAN@EMPRESA.COM.DO')).toBe('empresa.com.do');
    expect(reglasCorreoService.extraerDominio('invalido')).toBe('');
  });

  it('evalúa condición de dominio del remitente con o sin arroba', () => {
    const mensaje = crearMensajeDemo();

    // Con arroba @verafeca.com
    expect(
      reglasCorreoService.evaluarCondicion(mensaje, {
        id: 'c1',
        campo: 'dominio_remitente',
        operador: 'contiene',
        valor: '@verafeca.com',
      })
    ).toBe(true);

    // Sin arroba verafeca.com
    expect(
      reglasCorreoService.evaluarCondicion(mensaje, {
        id: 'c2',
        campo: 'dominio_remitente',
        operador: 'contiene',
        valor: 'verafeca.com',
      })
    ).toBe(true);

    // Dominio distinto
    expect(
      reglasCorreoService.evaluarCondicion(mensaje, {
        id: 'c3',
        campo: 'dominio_remitente',
        operador: 'es_igual_a',
        valor: 'otrodominio.com',
      })
    ).toBe(false);
  });

  it('evalúa condiciones por asunto y adjuntos', () => {
    const mensaje = crearMensajeDemo({ asunto: 'Cotización Urgente de Servidores' });

    expect(
      reglasCorreoService.evaluarCondicion(mensaje, {
        id: 'c4',
        campo: 'asunto_contiene',
        operador: 'contiene',
        valor: 'Cotización',
      })
    ).toBe(true);

    expect(
      reglasCorreoService.evaluarCondicion(mensaje, {
        id: 'c5',
        campo: 'tiene_adjuntos',
        operador: 'existe',
        valor: '',
      })
    ).toBe(true);
  });

  it('aplica reglas con operador AND y OR adecuadamente', () => {
    const mensaje = crearMensajeDemo();

    const reglaAND: ReglaCorreo = {
      id: 'regla-and',
      nombre: 'Prueba AND',
      activa: true,
      operadorLogico: 'AND',
      condiciones: [
        { id: '1', campo: 'dominio_remitente', operador: 'contiene', valor: 'verafeca.com' },
        { id: '2', campo: 'asunto_contiene', operador: 'contiene', valor: 'Factura' },
      ],
      acciones: { moverACarpeta: 'facturacion' },
      totalAplicados: 0,
      creadoEn: '',
      actualizadoEn: '',
    };

    expect(reglasCorreoService.evaluarMensaje(mensaje, reglaAND)).toBe(true);

    // Si una de las condiciones AND falla
    reglaAND.condiciones[1].valor = 'Texto Inexistente 123';
    expect(reglasCorreoService.evaluarMensaje(mensaje, reglaAND)).toBe(false);

    // Con OR pasa si al menos una coincide
    reglaAND.operadorLogico = 'OR';
    expect(reglasCorreoService.evaluarMensaje(mensaje, reglaAND)).toBe(true);
  });

  it('modifica el mensaje en memoria al aplicar la regla', () => {
    const mensaje = crearMensajeDemo({ carpeta: 'inbox', destacado: false });
    const regla: ReglaCorreo = {
      id: 'r-test',
      nombre: 'Mover Verafeca',
      activa: true,
      operadorLogico: 'OR',
      condiciones: [
        { id: '1', campo: 'dominio_remitente', operador: 'contiene', valor: 'verafeca.com' },
      ],
      acciones: {
        moverACarpeta: 'verafeca',
        marcarDestacado: true,
        vincularClienteNombre: 'Verafeca SRL',
      },
      totalAplicados: 0,
      creadoEn: '',
      actualizadoEn: '',
    };

    const resultado = reglasCorreoService.aplicarReglasAMensaje(mensaje, [regla]);
    expect(resultado.modificado).toBe(true);
    expect(mensaje.carpeta).toBe('verafeca');
    expect(mensaje.destacado).toBe(true);
    expect(mensaje.clienteNombreRelacionado).toBe('Verafeca SRL');
  });

  it('permite crear y gestionar carpetas personalizadas', () => {
    const carpeta = reglasCorreoService.crearCarpetaPersonalizada('Clientes VIP Especiales', 'purple');
    expect(carpeta.id).toBe('clientes-vip-especiales');
    expect(carpeta.nombre).toBe('Clientes VIP Especiales');
    expect(carpeta.color).toBe('purple');

    const lista = reglasCorreoService.obtenerCarpetasPersonalizadas();
    expect(lista.some((c) => c.id === 'clientes-vip-especiales')).toBe(true);
  });

  it('permite activar, desactivar y eliminar reglas', () => {
    const regla = reglasCorreoService.guardarRegla({
      nombre: 'Regla Temporal',
      activa: true,
      operadorLogico: 'OR',
      condiciones: [{ id: '1', campo: 'asunto_contiene', operador: 'contiene', valor: 'alerta' }],
      acciones: { moverACarpeta: 'archivados' },
    });

    expect(reglasCorreoService.toggleRegla(regla.id, false)).toBe(true);
    const reglas = reglasCorreoService.obtenerReglas();
    const guardada = reglas.find((r) => r.id === regla.id);
    expect(guardada?.activa).toBe(false);

    expect(reglasCorreoService.eliminarRegla(regla.id)).toBe(true);
    expect(reglasCorreoService.obtenerReglas().some((r) => r.id === regla.id)).toBe(false);
  });
});
