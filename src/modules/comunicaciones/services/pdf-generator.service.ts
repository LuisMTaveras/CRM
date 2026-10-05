import { jsPDF } from 'jspdf';
import type { PlantillaDocumento, VariablesPlantilla } from '../types/comunicacion.types';
import { empresaService } from '@/modules/configuracion/services/empresa.service';

export class PdfGeneratorService {
  /**
   * Reemplaza las etiquetas {{variable}} con los datos reales del cliente y usuario autenticado
   */
  reemplazarVariables(texto: string, variables: VariablesPlantilla): string {
    let resultado = texto;
    for (const [clave, valor] of Object.entries(variables)) {
      const regex = new RegExp(`{{${clave}}}`, 'g');
      resultado = resultado.replace(regex, valor || '');
    }
    return resultado;
  }

  /**
   * Genera una instancia de jsPDF con formato profesional ejecutivo B2B
   */
  generarDocumentoPdf(plantilla: PlantillaDocumento, variables: VariablesPlantilla): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const datosEmpresa = empresaService.obtenerDatos();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 25;

    // --- ENCABEZADO CORPORATIVO ---
    // Barra decorativa superior verde esmeralda institucional
    doc.setFillColor(16, 185, 129); // #10b981
    doc.rect(0, 0, pageWidth, 4, 'F');

    // Membrete con datos dinámicos de la empresa que usa el CRM
    const razonSocial = datosEmpresa.razonSocial || 'EMPRESA EMISORA';
    const rncTexto = datosEmpresa.identificacionFiscal ? `• RNC: ${datosEmpresa.identificacionFiscal}` : '';
    const subtitulo = `${datosEmpresa.sloganActividad || 'Servicios y Consultoría B2B'} ${rncTexto}`.trim();
    const contacto = `${datosEmpresa.direccion}, ${datosEmpresa.ciudad} • Tel: ${datosEmpresa.telefono}`;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(24, 24, 27); // #18181b
    doc.text(razonSocial, margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(113, 113, 122); // #71717a
    doc.text(subtitulo, margin, y + 5);
    doc.text(contacto, margin, y + 9);

    // Fecha en la esquina derecha del encabezado
    const prefijo = datosEmpresa.prefijoDocumentos || 'DOC';
    doc.text(`Fecha: ${variables.fecha}`, pageWidth - margin, y, { align: 'right' });
    doc.text(`Doc: ${prefijo}-${Date.now().toString().slice(-6)}`, pageWidth - margin, y + 5, { align: 'right' });

    y += 18;

    // Línea divisoria
    doc.setDrawColor(228, 228, 231); // #e4e4e7
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);

    y += 10;

    // --- TÍTULO DEL DOCUMENTO ---
    const titulo = this.reemplazarVariables(plantilla.tituloDocumento, variables);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(9, 9, 11); // #09090b
    doc.text(titulo, margin, y);

    y += 8;

    // --- CUADRO DE DATOS DEL CLIENTE ---
    doc.setFillColor(244, 244, 245); // #f4f4f5
    doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');
    doc.setDrawColor(228, 228, 231);
    doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'S');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(39, 39, 42);
    doc.text('EMPRESA CLIENTE:', margin + 4, y + 6);
    doc.text('RNC:', margin + 4, y + 11);
    doc.text('ATENCIÓN A:', margin + 4, y + 16);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(24, 24, 27);
    doc.text(variables.empresa, margin + 35, y + 6);
    doc.text(variables.rnc || 'Sin RNC Registrado', margin + 35, y + 11);
    doc.text(`${variables.contacto_principal} (${variables.cargo_contacto || 'Contacto Principal'})`, margin + 35, y + 16);

    // Columna derecha del cuadro
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(39, 39, 42);
    doc.text('CIUDAD:', margin + 95, y + 6);
    doc.text('FECHA:', margin + 95, y + 11);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(24, 24, 27);
    doc.text(`${variables.ciudad}, Rep. Dom.`, margin + 115, y + 6);
    doc.text(variables.fecha, margin + 115, y + 11);

    y += 30;

    // --- CUERPO DEL DOCUMENTO ---
    const contenidoProcesado = this.reemplazarVariables(plantilla.contenidoDocumento, variables);
    const parrafos = contenidoProcesado.split('\n');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(39, 39, 42);

    for (const parrafo of parrafos) {
      if (parrafo.trim() === '') {
        y += 4;
        continue;
      }

      // Si es un subtítulo en mayúsculas o numerado (ej: 1. OBJETIVO)
      const esSubtitulo = /^[0-9]+\.\s+[A-ZÁÉÍÓÚ\s]+$/.test(parrafo.trim()) || /^[A-ZÁÉÍÓÚ\s]{4,}:?$/.test(parrafo.trim());

      if (esSubtitulo) {
        y += 3;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(16, 185, 129); // acento esmeralda
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(39, 39, 42);
      }

      const lineas = doc.splitTextToSize(parrafo, contentWidth);

      // Si nos pasamos de página
      if (y + lineas.length * 4.5 > doc.internal.pageSize.getHeight() - 25) {
        doc.addPage();
        y = 25;
      }

      doc.text(lineas, margin, y);
      y += lineas.length * 4.5 + 1.5;
    }

    // --- PIE DE PÁGINA ---
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(161, 161, 170);

      // Línea divisoria pie
      doc.setDrawColor(228, 228, 231);
      doc.setLineWidth(0.3);
      doc.line(margin, 282, pageWidth - margin, 282);

      const emisorNombre = datosEmpresa.nombreComercial || datosEmpresa.razonSocial || 'CRM';
      doc.text(
        `Documento generado electrónicamente por ${emisorNombre} • Para: ${variables.empresa}`,
        margin,
        286
      );
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, 286, { align: 'right' });
    }

    return doc;
  }

  /**
   * Genera la Data URL (base64) del PDF para previsualizar en tiempo real en un iframe o visor
   */
  obtenerDataUri(plantilla: PlantillaDocumento, variables: VariablesPlantilla): string {
    const doc = this.generarDocumentoPdf(plantilla, variables);
    return doc.output('datauristring');
  }

  /**
   * Descarga directamente el archivo PDF generado en el navegador del usuario
   */
  descargarPdf(plantilla: PlantillaDocumento, variables: VariablesPlantilla, nombreArchivo?: string): void {
    const doc = this.generarDocumentoPdf(plantilla, variables);
    const nombre = nombreArchivo || `${plantilla.id}_${variables.empresa.replace(/\s+/g, '_')}.pdf`;
    doc.save(nombre);
  }
}

export const pdfGeneratorService = new PdfGeneratorService();
