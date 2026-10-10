import { jsPDF } from 'jspdf';
import { empresaService } from '@/modules/configuracion/services/empresa.service';
import { formatCurrency, formatDate } from '@/core/formatters/formatters';
import type { MetricasComerciales } from '../types/metricas.types';

const PALETTE = {
  primario: [79, 70, 229] as [number, number, number],       // Indigo 600
  primarioOscuro: [67, 56, 202] as [number, number, number], // Indigo 700
  slate950: [15, 23, 42] as [number, number, number],        // Slate 950
  slate900: [15, 23, 42] as [number, number, number],        // Slate 900
  slate800: [30, 41, 59] as [number, number, number],        // Slate 800
  slate700: [51, 65, 85] as [number, number, number],        // Slate 700
  slate600: [71, 85, 105] as [number, number, number],       // Slate 600
  slate500: [100, 116, 139] as [number, number, number],     // Slate 500
  slate400: [148, 163, 184] as [number, number, number],     // Slate 400
  bordeSuave: [226, 232, 240] as [number, number, number],   // Slate 200
  bordeMedio: [203, 213, 225] as [number, number, number],   // Slate 300
  fondoCard: [248, 250, 252] as [number, number, number],    // Slate 50
  fondoSubtle: [241, 245, 249] as [number, number, number],  // Slate 100
  emerald600: [5, 150, 105] as [number, number, number],     // Emerald 600
  amber600: [217, 119, 6] as [number, number, number],       // Amber 600
  blanco: [255, 255, 255] as [number, number, number],
};

export class ReporteEjecutivoService {
  generarInformePdf(metricas: MetricasComerciales, periodoTexto: string = 'Mes en Curso'): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
    });

    const datosEmpresa = empresaService.obtenerDatos();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;
    const maxYContenido = 265;
    let y = 10;

    const fechaHoy = formatDate(new Date().toISOString(), 'medium');
    const codigoDoc = `REP-COM-${Date.now().toString(16).slice(-6).toUpperCase()}`;

    // 1. Barra superior ejecutiva
    doc.setFillColor(...PALETTE.slate950);
    doc.rect(0, 0, pageWidth, 4.5, 'F');

    y = 12;

    // 2. Encabezado institucional
    const logoX = margin;
    const logoSize = 16;
    doc.setFillColor(...PALETTE.slate950);
    doc.roundedRect(logoX, y, logoSize, logoSize, 2.5, 2.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...PALETTE.blanco);
    doc.text('AS', logoX + logoSize / 2, y + 10.5, { align: 'center' });

    // Datos de empresa
    const metaX = logoX + logoSize + 4.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...PALETTE.slate950);
    doc.text(datosEmpresa.razonSocial || 'Alliance Software S.R.L.', metaX, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...PALETTE.slate500);
    doc.text(`RNC: ${datosEmpresa.identificacionFiscal || '1-32-45890-1'} • Dirección: ${datosEmpresa.direccion || 'Torre Acrópolis, Santo Domingo'}`, metaX, y + 8.5);
    doc.text(`División: Inteligencia Comercial B2B • Período Analizado: ${periodoTexto}`, metaX, y + 12.5);

    // Caja de referencia a la derecha
    const boxRefW = 44;
    const boxRefX = pageWidth - margin - boxRefW;
    doc.setFillColor(...PALETTE.fondoCard);
    doc.roundedRect(boxRefX, y, boxRefW, 16, 1.5, 1.5, 'F');
    doc.setDrawColor(...PALETTE.bordeSuave);
    doc.setLineWidth(0.25);
    doc.roundedRect(boxRefX, y, boxRefW, 16, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...PALETTE.slate800);
    doc.text('INFORME GERENCIAL B2B', boxRefX + boxRefW / 2, y + 4.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...PALETTE.slate500);
    doc.text(`Código: ${codigoDoc}`, boxRefX + 3, y + 8.5);
    doc.text(`Emisión: ${fechaHoy}`, boxRefX + 3, y + 12);
    doc.text('Confidencialidad: Nivel 3', boxRefX + 3, y + 15);

    y += 21;

    // Divisor
    doc.setDrawColor(...PALETTE.bordeSuave);
    doc.setLineWidth(0.35);
    doc.line(margin, y, pageWidth - margin, y);

    y += 4.5;

    // 3. Título del Informe
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...PALETTE.slate950);
    doc.text('REPORTE EJECUTIVO DE FACTURACIÓN Y EMBUDO DE VENTAS', margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...PALETTE.slate500);
    doc.text('Auditoría comercial consolidada de cartera de clientes, acuerdos ganados y velocidad de cierre de oportunidades.', margin, y + 4);

    y += 8.5;

    // 4. Tarjetas KPI Principales (4 columnas)
    const kpiCardW = (contentWidth - 6) / 4;
    const kpis = [
      { titulo: 'Facturación Ganada', valor: formatCurrency(metricas.totalGanado), sub: `${metricas.totalOportunidades} tratos registrados` },
      { titulo: 'Pipeline en Negociación', valor: formatCurrency(metricas.totalEnNegociacion), sub: 'En curso activo' },
      { titulo: 'Tasa de Conversión', valor: `${metricas.tasaConversion}%`, sub: 'Efectividad global' },
      { titulo: 'Ticket Promedio', valor: formatCurrency(metricas.ticketPromedio), sub: `Cierre en ${metricas.tiempoPromedioCierreDias} días` },
    ];

    for (let i = 0; i < kpis.length; i++) {
      const k = kpis[i];
      const kx = margin + i * (kpiCardW + 2);
      doc.setFillColor(...PALETTE.fondoCard);
      doc.roundedRect(kx, y, kpiCardW, 17, 1.5, 1.5, 'F');
      doc.setDrawColor(...PALETTE.bordeSuave);
      doc.setLineWidth(0.25);
      doc.roundedRect(kx, y, kpiCardW, 17, 1.5, 1.5, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(...PALETTE.slate500);
      doc.text(k.titulo.toUpperCase(), kx + 3, y + 4);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...PALETTE.slate950);
      doc.text(k.valor, kx + 3, y + 9.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5);
      doc.setTextColor(...PALETTE.slate400);
      doc.text(k.sub, kx + 3, y + 14);
    }

    y += 22;

    // 5. Tabla de Embudo de Ventas (Fases del Pipeline)
    doc.setFillColor(...PALETTE.primario);
    doc.roundedRect(margin, y - 2.5, 2, 3.8, 0.5, 0.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...PALETTE.slate950);
    doc.text('CONVERSIÓN Y RETENCIÓN POR ETAPA DEL EMBUDO COMERCIAL', margin + 4, y);

    y += 3.5;

    // Encabezado de tabla de embudo
    const hEmbudo = 5.2;
    doc.setFillColor(...PALETTE.slate950);
    doc.roundedRect(margin, y, contentWidth, hEmbudo, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(...PALETTE.blanco);
    doc.text('ETAPA DEL EMBUDO', margin + 3, y + 3.6);
    doc.text('DEALS', margin + 70, y + 3.6, { align: 'center' });
    doc.text('VOLUMEN EN JUEGO', margin + 115, y + 3.6, { align: 'right' });
    doc.text('% CARTERA', margin + 140, y + 3.6, { align: 'center' });
    doc.text('RETENCIÓN / ÉXITO', margin + contentWidth - 3, y + 3.6, { align: 'right' });

    y += hEmbudo;

    for (let idx = 0; idx < metricas.distribucionEtapas.length; idx++) {
      const etapa = metricas.distribucionEtapas[idx];
      const esPar = idx % 2 === 0;
      if (esPar) {
        doc.setFillColor(...PALETTE.fondoCard);
        doc.rect(margin, y, contentWidth, 6, 'F');
      }
      doc.setDrawColor(...PALETTE.bordeSuave);
      doc.setLineWidth(0.2);
      doc.line(margin, y + 6, margin + contentWidth, y + 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...PALETTE.slate900);
      doc.text(etapa.nombre, margin + 3, y + 4.2);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...PALETTE.slate800);
      doc.text(String(etapa.cantidad), margin + 70, y + 4.2, { align: 'center' });
      doc.text(formatCurrency(etapa.monto), margin + 115, y + 4.2, { align: 'right' });
      doc.text(`${etapa.porcentaje}%`, margin + 140, y + 4.2, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...PALETTE.primario);
      doc.text(`${etapa.tasaConversionEtapa}%`, margin + contentWidth - 3, y + 4.2, { align: 'right' });

      y += 6;
    }

    y += 5;

    // 6. Ranking de Rendimiento por Ejecutivo
    doc.setFillColor(...PALETTE.primario);
    doc.roundedRect(margin, y - 2.5, 2, 3.8, 0.5, 0.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...PALETTE.slate950);
    doc.text('RANKING DE RENDIMIENTO DE LA FUERZA DE VENTAS', margin + 4, y);

    y += 3.5;

    doc.setFillColor(...PALETTE.slate950);
    doc.roundedRect(margin, y, contentWidth, hEmbudo, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(...PALETTE.blanco);
    doc.text('EJECUTIVO COMERCIAL', margin + 3, y + 3.6);
    doc.text('TRATOS', margin + 70, y + 3.6, { align: 'center' });
    doc.text('VOLUMEN GESTIONADO', margin + 115, y + 3.6, { align: 'right' });
    doc.text('GANADAS', margin + 140, y + 3.6, { align: 'center' });
    doc.text('TASA DE ÉXITO', margin + contentWidth - 3, y + 3.6, { align: 'right' });

    y += hEmbudo;

    for (let idx = 0; idx < metricas.topResponsables.length; idx++) {
      const resp = metricas.topResponsables[idx];
      const esPar = idx % 2 === 0;
      if (esPar) {
        doc.setFillColor(...PALETTE.fondoCard);
        doc.rect(margin, y, contentWidth, 6, 'F');
      }
      doc.setDrawColor(...PALETTE.bordeSuave);
      doc.setLineWidth(0.2);
      doc.line(margin, y + 6, margin + contentWidth, y + 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...PALETTE.slate900);
      doc.text(resp.responsable, margin + 3, y + 4.2);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...PALETTE.slate800);
      doc.text(String(resp.deals), margin + 70, y + 4.2, { align: 'center' });
      doc.text(formatCurrency(resp.monto), margin + 115, y + 4.2, { align: 'right' });
      doc.text(String(resp.ganadas), margin + 140, y + 4.2, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...PALETTE.emerald600);
      doc.text(`${resp.tasaExito}%`, margin + contentWidth - 3, y + 4.2, { align: 'right' });

      y += 6;
    }

    y += 6;

    // 7. Firmas Ejecutivas de Validación Gerencial
    if (y > maxYContenido - 35) {
      doc.addPage();
      y = 25;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...PALETTE.slate950);
    doc.text('CONFORMIDAD Y RATIFICACIÓN GERENCIAL', margin, y);

    y += 4;

    const fBoxW = (contentWidth - 6) / 2;
    const fBoxH = 26;

    // Firma Director Comercial
    doc.setFillColor(...PALETTE.fondoCard);
    doc.roundedRect(margin, y, fBoxW, fBoxH, 1.5, 1.5, 'F');
    doc.setDrawColor(...PALETTE.bordeSuave);
    doc.roundedRect(margin, y, fBoxW, fBoxH, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(...PALETTE.slate500);
    doc.text('DIRECTOR COMERCIAL & ESTRATEGIA B2B', margin + 3.5, y + 4);

    doc.setDrawColor(...PALETTE.bordeMedio);
    doc.line(margin + 4, y + 16, margin + fBoxW - 4, y + 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...PALETTE.slate950);
    doc.text('Lic. Luis M. Taveras', margin + 4, y + 19.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(...PALETTE.slate500);
    doc.text('Alliance Software S.R.L. • Sello Digital Validado', margin + 4, y + 23);

    // Firma Gerencia General
    const f2X = margin + fBoxW + 6;
    doc.setFillColor(...PALETTE.fondoCard);
    doc.roundedRect(f2X, y, fBoxW, fBoxH, 1.5, 1.5, 'F');
    doc.setDrawColor(...PALETTE.bordeSuave);
    doc.roundedRect(f2X, y, fBoxW, fBoxH, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(...PALETTE.slate500);
    doc.text('GERENCIA GENERAL & OPERACIONES CORPORATIVAS', f2X + 3.5, y + 4);

    doc.setDrawColor(...PALETTE.bordeMedio);
    doc.line(f2X + 4, y + 16, f2X + fBoxW - 4, y + 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...PALETTE.slate950);
    doc.text('Dirección Ejecutiva Corporativa', f2X + 4, y + 19.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(...PALETTE.slate500);
    doc.text('Auditoría General de Cuentas B2B', f2X + 4, y + 23);

    // 8. Pie de página institucional
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setDrawColor(...PALETTE.bordeSuave);
      doc.setLineWidth(0.3);
      doc.line(margin, 285, pageWidth - margin, 285);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(...PALETTE.slate500);
      doc.text(`Informe Oficial B2B • ${datosEmpresa.razonSocial || 'Alliance Software S.R.L.'} • Generado con Devforge Architecture`, margin, 289);
      doc.text(`Página ${p} de ${totalPages} • Hash: ${codigoDoc}`, pageWidth - margin, 289, { align: 'right' });
    }

    return doc;
  }

  descargarInformeEjecutivo(metricas: MetricasComerciales, periodoTexto: string = 'Mes en Curso'): void {
    const doc = this.generarInformePdf(metricas, periodoTexto);
    doc.save(`informe_gerencial_b2b_${Date.now()}.pdf`);
  }
}

export const reporteEjecutivoService = new ReporteEjecutivoService();
