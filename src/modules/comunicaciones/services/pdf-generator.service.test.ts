import { describe, it, expect, beforeEach } from 'vitest';
import { pdfGeneratorService } from './pdf-generator.service';
import type { PlantillaDocumento, VariablesPlantilla } from '../types/comunicacion.types';

describe('PdfGeneratorService - Generación de Documentos Ejecutivos B2B', () => {
  let variablesMuestra: VariablesPlantilla;
  let plantillaMuestra: PlantillaDocumento;

  beforeEach(() => {
    variablesMuestra = {
      empresa: 'Corporación Caribeña S.A.',
      contacto_principal: 'Lic. Roberto Gómez',
      cargo_contacto: 'Director de Operaciones',
      rnc: '1-31-98765-4',
      ciudad: 'Santiago de los Caballeros',
      monto: 'RD$ 450,000.00',
      fecha: '08 de Octubre de 2026',
      ejecutivo: 'Luis M. Taveras',
      cargo_ejecutivo: 'Team Leader TI Support',
      correo_ejecutivo: 'luismiguel@alliance.do',
      flota_ejecutivo: '+1 (829) 708-4706',
      departamento_ejecutivo: 'Soporte TI & Infraestructura',
      empresa_remitente: 'Ingeniería de Software Alliance S.R.L.',
      correo_remitente: 'luismiguel@alliance.do',
      telefono_remitente: '+1 (809) 555-0100',
    };

    plantillaMuestra = {
      id: 'plt-test-propuesta',
      nombre: 'Propuesta de Consultoría Tecnológica',
      descripcion: 'Documento oficial de alcance y términos',
      categoria: 'propuesta',
      asuntoEmail: 'Propuesta de Servicios — {{empresa}}',
      cuerpoEmail: 'Estimado(a) {{contacto_principal}},\n\nAdjuntamos la propuesta.',
      tituloDocumento: 'PROPUESTA DE SERVICIOS Y CONSULTORÍA B2B',
      contenidoDocumento: `Estimado(a) {{contacto_principal}}:

Por medio de la presente, extendemos formalmente la propuesta técnica y económica para {{empresa}}.

1. OBJETIVO DEL SERVICIO
Implementar soluciones de automatización CRM y sincronización segura con arquitectura B2B de alto rendimiento.

2. ALCANCE Y ESPECIFICACIONES
- Despliegue de infraestructura de alta disponibilidad.
- Sincronización bidireccional de correos e historial de bitácora.
- Soporte continuo y mesa de ayuda con SLA garantizado.

NOTA: Todos los servicios incluyen garantía de satisfacción y soporte técnico especializado.

3. CONDICIONES ECONÓMICAS
El monto de inversión acordado para este proyecto es de {{monto}} pagadero contra hitos de entrega.

Sin otro particular, quedamos a su entera disposición.`,
    };
  });

  it('reemplaza correctamente todas las variables en plantillas de texto', () => {
    const texto = 'Hola {{contacto_principal}} de {{empresa}}, el total es {{monto}}.';
    const procesado = pdfGeneratorService.reemplazarVariables(texto, variablesMuestra);

    expect(procesado).toContain('Lic. Roberto Gómez');
    expect(procesado).toContain('Corporación Caribeña S.A.');
    expect(procesado).toContain('RD$ 450,000.00');
    expect(procesado).not.toContain('{{');
    expect(procesado).not.toContain('}}');
  });

  it('asigna un fallback elegante si alguna variable es nula o indefinida', () => {
    const texto = 'Cargo: {{cargo_contacto}} • Depto: {{departamento_inexistente}}';
    const procesado = pdfGeneratorService.reemplazarVariables(texto, {
      ...variablesMuestra,
      cargo_contacto: '',
    });

    expect(procesado).toContain('—');
  });

  it('genera una instancia válida de jsPDF con formato A4 vertical', () => {
    const doc = pdfGeneratorService.generarDocumentoPdf(plantillaMuestra, variablesMuestra);

    expect(doc).toBeDefined();
    expect(Math.round(doc.internal.pageSize.getWidth())).toBe(210);
    expect(Math.round(doc.internal.pageSize.getHeight())).toBe(297);
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('genera un Data URI en base64 listo para adjuntar en correos electrónicos o iframe', () => {
    const dataUri = pdfGeneratorService.obtenerDataUri(plantillaMuestra, variablesMuestra);

    expect(dataUri).toBeDefined();
    expect(typeof dataUri).toBe('string');
    expect(dataUri.startsWith('data:application/pdf;')).toBe(true);
    expect(dataUri.length).toBeGreaterThan(1000);
  });

  it('gestiona documentos extensos con múltiples páginas y encabezados de continuidad', () => {
    // Crear contenido largo para forzar paginación
    const contenidoLargo = Array.from({ length: 45 }, (_, i) => `Sección ${i + 1}: Detalle operativo y cláusula extendida de cumplimiento normativo aplicable al contrato número ${i + 100} para la empresa receptora.`).join('\n\n');

    const plantillaExtensa: PlantillaDocumento = {
      ...plantillaMuestra,
      contenidoDocumento: contenidoLargo,
    };

    const doc = pdfGeneratorService.generarDocumentoPdf(plantillaExtensa, variablesMuestra);
    const paginas = doc.getNumberOfPages();

    expect(paginas).toBeGreaterThan(1);
  });
});
