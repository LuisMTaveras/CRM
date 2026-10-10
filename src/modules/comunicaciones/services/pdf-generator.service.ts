import { jsPDF } from 'jspdf';
import type { PlantillaDocumento, VariablesPlantilla } from '../types/comunicacion.types';
import type { ResumenCotizacion } from '../types/catalogo.types';
import { formatCurrency } from '@/core/formatters/formatters';
import { empresaService } from '@/modules/configuracion/services/empresa.service';

/**
 * Paleta corporativa ejecutiva B2B (Tokens de color estrictos, sin neones)
 */
const PALETTE = {
  primario: [79, 70, 229] as [number, number, number],       // Indigo 600 (#4f46e5)
  primarioOscuro: [67, 56, 202] as [number, number, number], // Indigo 700 (#4338ca)
  primarioClaro: [238, 242, 255] as [number, number, number],// Indigo 50 (#eef2ff)
  primarioBorde: [199, 210, 254] as [number, number, number],// Indigo 200 (#c7d2fe)
  slate950: [15, 23, 42] as [number, number, number],        // Slate 950 / 900 (#0f172a)
  slate900: [15, 23, 42] as [number, number, number],        // Slate 900 (#0f172a)
  slate800: [30, 41, 59] as [number, number, number],        // Slate 800 (#1e293b)
  slate700: [51, 65, 85] as [number, number, number],        // Slate 700 (#334155)
  slate600: [71, 85, 105] as [number, number, number],       // Slate 600 (#475569)
  slate500: [100, 116, 139] as [number, number, number],     // Slate 500 (#64748b)
  slate400: [148, 163, 184] as [number, number, number],     // Slate 400 (#94a3b8)
  bordeSuave: [226, 232, 240] as [number, number, number],   // Slate 200 (#e2e8f0)
  bordeMedio: [203, 213, 225] as [number, number, number],   // Slate 300 (#cbd5e1)
  fondoCard: [248, 250, 252] as [number, number, number],    // Slate 50 (#f8fafc)
  fondoSubtle: [241, 245, 249] as [number, number, number],  // Slate 100 (#f1f5f9)
  amber600: [217, 119, 6] as [number, number, number],       // Amber 600 (#d97706)
  amber50: [254, 243, 199] as [number, number, number],      // Amber 50 (#fef3c7)
  blanco: [255, 255, 255] as [number, number, number],
};

export class PdfGeneratorService {
  /**
   * Reemplaza las etiquetas {{variable}} con los datos reales del cliente y usuario autenticado
   */
  reemplazarVariables(texto: string, variables: VariablesPlantilla): string {
    if (!texto) return '';
    let resultado = texto;
    for (const [clave, valor] of Object.entries(variables)) {
      const regex = new RegExp(`{{${clave}}}`, 'g');
      const valStr = (valor !== undefined && valor !== null && String(valor).trim() !== '') ? String(valor) : '—';
      resultado = resultado.replace(regex, valStr);
    }
    // Si queda alguna etiqueta residual no mapeada, aplicar fallback '—' en cumplimiento con estándares
    resultado = resultado.replace(/{{[a-zA-Z0-9_]+}}/g, '—');
    return resultado;
  }

  /**
   * Extrae las iniciales de una entidad o razón social para el monograma institucional
   */
  private obtenerInicialesMonograma(nombre: string): string {
    if (!nombre) return 'CRM';
    const palabras = nombre
      .replace(/s\.r\.l\.|s\.a\.|inc\.|ltd\.|de\s+/gi, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (palabras.length === 1) {
      return palabras[0].substring(0, 2).toUpperCase();
    }
    if (palabras.length >= 2) {
      return (palabras[0][0] + palabras[1][0]).toUpperCase();
    }
    return 'AL';
  }

  /**
   * Genera un hash alfanumérico determinista para verificación de integridad documental
   */
  private generarCodigoVerificacion(variables: VariablesPlantilla): string {
    const semilla = `${variables.empresa}-${variables.fecha}-${variables.rnc || '0'}`;
    let hash = 0;
    for (let i = 0; i < semilla.length; i++) {
      hash = (hash << 5) - hash + semilla.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  }

  /**
   * Genera una instancia de jsPDF con formato profesional ejecutivo B2B de nivel corporativo
   */
  generarDocumentoPdf(
    plantilla: PlantillaDocumento,
    variables: VariablesPlantilla,
    resumenCotizacion?: ResumenCotizacion
  ): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
    });

    const datosEmpresa = empresaService.obtenerDatos();
    const pageWidth = doc.internal.pageSize.getWidth();   // 210 mm
    const margin = 18;                                    // 18 mm margen lateral
    const contentWidth = pageWidth - margin * 2;          // 174 mm
    const maxYContenido = 252;                            // límite inferior seguro antes del pie
    let y = 11;

    const hashVerificacion = this.generarCodigoVerificacion(variables);
    const prefijo = datosEmpresa.prefijoDocumentos || 'DOC';
    const codigoDocumento = `${prefijo}-${hashVerificacion.slice(0, 6)}`;

    // ─── 1. BARRA DECORATIVA SUPERIOR (ACENTO EJECUTIVO UNIFICADO SLATE) ──────
    doc.setFillColor(...PALETTE.slate950);
    doc.rect(0, 0, pageWidth, 1.8, 'F');

    // ─── 2. ENCABEZADO Y MEMBRETE INSTITUCIONAL CON LOGOTIPO ───────────────────
    const razonSocial = datosEmpresa.razonSocial || datosEmpresa.nombreComercial || '—';
    const logoW = 16;
    const logoH = 16;
    let logoRenderizado = false;

    // Caja de Registro y Seguimiento Documental (Esquina superior derecha)
    const boxRefW = 54;
    const boxRefX = pageWidth - margin - boxRefW;

    // Si la empresa tiene logotipo en base64 (data:image/...), renderizarlo nítido
    if (datosEmpresa.logoUrl && datosEmpresa.logoUrl.startsWith('data:image/')) {
      try {
        const esJpeg = datosEmpresa.logoUrl.includes('image/jpeg') || datosEmpresa.logoUrl.includes('image/jpg');
        doc.addImage(datosEmpresa.logoUrl, esJpeg ? 'JPEG' : 'PNG', margin, y, logoW, logoH, undefined, 'FAST');
        
        // Marco de protección sutil alrededor del logotipo
        doc.setDrawColor(...PALETTE.bordeSuave);
        doc.setLineWidth(0.25);
        doc.roundedRect(margin, y, logoW, logoH, 2, 2, 'S');
        logoRenderizado = true;
      } catch (err) {
        console.warn('[PDF] No se pudo renderizar la imagen del logotipo, aplicando emblema alternativo:', err);
      }
    }

    if (!logoRenderizado) {
      // Emblema corporativo geométrico de respaldo
      const monograma = this.obtenerInicialesMonograma(razonSocial);
      doc.setFillColor(...PALETTE.slate950);
      doc.roundedRect(margin, y, logoW, logoH, 2.5, 2.5, 'F');
      doc.setDrawColor(...PALETTE.primario);
      doc.setLineWidth(0.35);
      doc.roundedRect(margin, y, logoW, logoH, 2.5, 2.5, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...PALETTE.blanco);
      doc.text(monograma, margin + logoW / 2, y + 10.5, { align: 'center' });
    }

    // Datos institucionales de la empresa emisora desde DB
    const slogan = datosEmpresa.sloganActividad || '';
    const rncEmisor = datosEmpresa.identificacionFiscal ? `RNC: ${datosEmpresa.identificacionFiscal}` : '';
    
    // Limpieza de dirección para asegurar que nunca queden comas huérfanas
    let direccionEmisor = (datosEmpresa.direccion || '').replace(/,\s*$/, '').trim();
    if (datosEmpresa.ciudad && !direccionEmisor.toLowerCase().includes(datosEmpresa.ciudad.toLowerCase())) {
      direccionEmisor = direccionEmisor ? `${direccionEmisor}, ${datosEmpresa.ciudad}` : datosEmpresa.ciudad;
    }
    const webEmisor = datosEmpresa.sitioWeb ? `Portal: ${datosEmpresa.sitioWeb}` : '';
    const telEmisor = datosEmpresa.telefono ? `Tel: ${datosEmpresa.telefono}` : '';

    const textoX = margin + logoW + 3.5;
    const maxTextoW = boxRefX - textoX - 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...PALETTE.slate950);
    doc.text(razonSocial, textoX, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...PALETTE.slate500);
    if (slogan) doc.text(slogan, textoX, y + 8);
    
    // Dirección recortada elegantemente si excede el ancho disponible sin comas residuales
    const dirTexto = direccionEmisor.length > 50 ? direccionEmisor.substring(0, 48).replace(/,\s*$/, '') + '...' : direccionEmisor;
    const infoFila2 = [rncEmisor, dirTexto].filter(Boolean).join(' • ');
    if (infoFila2) {
      const fila2Cortada = doc.splitTextToSize(infoFila2, maxTextoW)[0] || infoFila2;
      doc.text(fila2Cortada, textoX, y + 11.8);
    }

    const infoFila3 = [telEmisor, webEmisor].filter(Boolean).join(' • ');
    if (infoFila3) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...PALETTE.slate700);
      doc.text(infoFila3, textoX, y + 15.2);
    }

    // Caja de Registro y Seguimiento Documental (Esquina superior derecha)
    doc.setFillColor(...PALETTE.fondoCard);
    doc.roundedRect(boxRefX, y, boxRefW, 17, 2, 2, 'F');
    doc.setDrawColor(...PALETTE.bordeSuave);
    doc.setLineWidth(0.3);
    doc.roundedRect(boxRefX, y, boxRefW, 17, 2, 2, 'S');

    // Pill de Tipo de Documento unificado y discreto
    doc.setFillColor(...PALETTE.fondoSubtle);
    doc.roundedRect(boxRefX + 3, y + 2.5, 34, 3.8, 1, 1, 'F');
    doc.setDrawColor(...PALETTE.bordeMedio);
    doc.setLineWidth(0.25);
    doc.roundedRect(boxRefX + 3, y + 2.5, 34, 3.8, 1, 1, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(...PALETTE.slate800);
    doc.text('DOCUMENTO OFICIAL B2B', boxRefX + 20, y + 5.2, { align: 'center' });

    // Referencia y Fecha
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...PALETTE.slate950);
    doc.text(`Ref: ${codigoDocumento}`, boxRefX + 3, y + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...PALETTE.slate700);
    doc.text(`Fecha: ${variables.fecha}`, boxRefX + 3, y + 13.5);

    doc.setTextColor(...PALETTE.slate500);
    doc.text('Vigencia: 30 Días Calendario', boxRefX + 3, y + 16.5);

    y += 20;

    // Línea divisoria elegante
    doc.setDrawColor(...PALETTE.bordeSuave);
    doc.setLineWidth(0.35);
    doc.line(margin, y, pageWidth - margin, y);

    y += 4;

    // ─── 3. DOSIER COMPARATIVO: EMISOR VS. CLIENTE (SIDE-BY-SIDE ARMONIZADO) ───
    const cardW = (contentWidth - 6) / 2; // 84 mm
    const cardH = 33;

    // Tarjeta Izquierda: Emisor Autorizado
    const emisorX = margin;
    doc.setFillColor(...PALETTE.blanco);
    doc.roundedRect(emisorX, y, cardW, cardH, 2, 2, 'F');
    doc.setDrawColor(...PALETTE.bordeSuave);
    doc.setLineWidth(0.35);
    doc.roundedRect(emisorX, y, cardW, cardH, 2, 2, 'S');

    // Header Armonizado: Slate 950 con línea de acento sutil
    doc.setFillColor(...PALETTE.slate950);
    doc.roundedRect(emisorX, y, cardW, 5.5, 2, 2, 'F');
    doc.rect(emisorX, y + 3, cardW, 2.5, 'F'); // empalme inferior
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(...PALETTE.blanco);
    doc.text('EXPEDIDOR / EMISOR AUTORIZADO', emisorX + 4, y + 3.8);

    doc.setFillColor(...PALETTE.slate700);
    doc.rect(emisorX, y + 5.3, cardW, 0.4, 'F');

    const emisorContacto = [variables.flota_ejecutivo || variables.telefono_ejecutivo || telEmisor, variables.correo_ejecutivo || datosEmpresa.correo]
      .filter((x) => x && x !== '—')
      .join(' • ');

    // Limpieza de dirección para el dosier
    let dirEmisorDosier = direccionEmisor.replace(/,\s*$/, '').trim();
    if (dirEmisorDosier.length > 40) {
      dirEmisorDosier = dirEmisorDosier.substring(0, 38).replace(/,\s*$/, '') + '...';
    }

    // Asegurar que Atendido por sea el nombre del ejecutivo y no de la empresa
    const nombreEjecutivoVal = variables.ejecutivo && variables.ejecutivo !== razonSocial
      ? variables.ejecutivo
      : 'Luis M. Taveras';

    const cargoEjecutivoVal = variables.cargo_ejecutivo && variables.cargo_ejecutivo !== '—'
      ? variables.cargo_ejecutivo
      : 'Consultor Ejecutivo B2B';

    const emisorRows = [
      { label: 'Entidad:', val: razonSocial, bold: true },
      { label: 'RNC Emisor:', val: datosEmpresa.identificacionFiscal || '—' },
      { label: 'Dirección:', val: dirEmisorDosier || '—' },
      { label: 'Atendido por:', val: nombreEjecutivoVal, bold: true },
      { label: 'Cargo:', val: cargoEjecutivoVal },
      { label: 'Contacto:', val: emisorContacto || '—', color: PALETTE.slate800 },
    ];

    let rowY = y + 9.2;
    for (const r of emisorRows) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(...PALETTE.slate500);
      doc.text(r.label, emisorX + 3.5, rowY);

      doc.setFont('helvetica', r.bold ? 'bold' : 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...(r.color || (r.bold ? PALETTE.slate950 : PALETTE.slate700)));
      const valCorto = (doc.splitTextToSize(r.val, cardW - 25)[0] || r.val).replace(/,\s*$/, '');
      doc.text(valCorto, emisorX + 22, rowY);
      rowY += 3.7;
    }

    // Tarjeta Derecha: Destinatario / Cliente Receptor (Misma paleta armónica Slate 950)
    const clienteX = margin + cardW + 6;
    doc.setFillColor(...PALETTE.blanco);
    doc.roundedRect(clienteX, y, cardW, cardH, 2, 2, 'F');
    doc.setDrawColor(...PALETTE.bordeSuave);
    doc.setLineWidth(0.35);
    doc.roundedRect(clienteX, y, cardW, cardH, 2, 2, 'S');

    doc.setFillColor(...PALETTE.slate950);
    doc.roundedRect(clienteX, y, cardW, 5.5, 2, 2, 'F');
    doc.rect(clienteX, y + 3, cardW, 2.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(...PALETTE.blanco);
    doc.text('DESTINATARIO / EMPRESA CLIENTE', clienteX + 4, y + 3.8);

    doc.setFillColor(...PALETTE.primario);
    doc.rect(clienteX, y + 5.3, cardW, 0.4, 'F');

    const clienteRows = [
      { label: 'Razón Social:', val: variables.empresa || '—', bold: true },
      { label: 'RNC / Registro:', val: variables.rnc || '—' },
      { label: 'Atención a:', val: variables.contacto_principal || '—', bold: true },
      { label: 'Cargo:', val: variables.cargo_contacto || '—' },
      { label: 'Localidad:', val: variables.ciudad || '—' },
      { label: 'Valor Ref.:', val: variables.monto || '—' },
    ];

    rowY = y + 9.2;
    for (const r of clienteRows) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(...PALETTE.slate500);
      doc.text(r.label, clienteX + 3.5, rowY);

      doc.setFont('helvetica', r.bold ? 'bold' : 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...(r.bold ? PALETTE.slate950 : PALETTE.slate700));
      const valCorto = (doc.splitTextToSize(r.val, cardW - 27)[0] || r.val).replace(/,\s*$/, '');
      doc.text(valCorto, clienteX + 24, rowY);
      rowY += 3.7;
    }

    y += cardH + 4;

    // ─── 4. ASUNTO Y TÍTULO DEL DOCUMENTO ─────────────────────────────────────
    const titulo = this.reemplazarVariables(plantilla.tituloDocumento, variables).toUpperCase();
    
    // Indicador vertical esbelto de acento Slate 900
    doc.setFillColor(...PALETTE.slate900);
    doc.roundedRect(margin, y, 2.2, 8.5, 0.6, 0.6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...PALETTE.slate950);
    doc.text(titulo, margin + 5.5, y + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...PALETTE.slate500);
    doc.text('DOCUMENTO OFICIAL DE GESTIÓN COMERCIAL Y TÉCNICA • CARÁCTER VINCULANTE', margin + 5.5, y + 7.8);

    y += 11;

    doc.setDrawColor(...PALETTE.bordeSuave);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);

    y += 4;

    // ─── 5. CUERPO INTELIGENTE DEL DOCUMENTO ──────────────────────────────────
    const contenidoProcesado = this.reemplazarVariables(plantilla.contenidoDocumento, variables);
    const lineasRaw = contenidoProcesado.split('\n');

    for (let idx = 0; idx < lineasRaw.length; idx++) {
      const linea = lineasRaw[idx].trim();

      // Línea en blanco
      if (linea === '') {
        y += 3;
        continue;
      }

      // 5.1 Subtítulo o Sección Numerada (Ej: "1. OBJETIVO GENERAL", "ALCANCE:", etc.)
      const esSubtitulo =
        /^(?:[0-9]+(?:\.[0-9]+)*\s*[-.]?\s+|[I|V|X]+\.\s+|[A-ZÁÉÍÓÚÑ\s]{4,}:?$)/.test(linea) &&
        linea.length < 90;

      if (esSubtitulo) {
        // Prevenir encabezados huérfanos cerca del final
        if (y > maxYContenido - 16) {
          doc.addPage();
          y = 26;
        }

        y += 2.5;
        // Mini indicador de sección
        doc.setFillColor(...PALETTE.primario);
        doc.roundedRect(margin, y - 2.8, 2.2, 4, 0.6, 0.6, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(...PALETTE.slate950);
        doc.text(linea, margin + 4.5, y);

        // Guía inferior suave para la sección
        doc.setDrawColor(...PALETTE.fondoSubtle);
        doc.setLineWidth(0.25);
        doc.line(margin + 4.5, y + 1.2, pageWidth - margin, y + 1.2);

        y += 4.5;
        continue;
      }

      // 5.2 Viñeta o Elemento de Lista (Ej: "- Soporte 24/7", "• Entrega")
      const matchVineta = linea.match(/^(\s*[-•*]\s+|\s*\d+\)\s+|\s*[a-zA-Z]\)\s+)(.*)$/);
      if (matchVineta) {
        const textoVineta = matchVineta[2];
        const lineasWrap = doc.splitTextToSize(textoVineta, contentWidth - 8);

        if (y + lineasWrap.length * 3.8 > maxYContenido) {
          doc.addPage();
          y = 26;
        }

        // Punto o icono de viñeta
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...PALETTE.primario);
        doc.text('•', margin + 2.5, y);

        // Texto indentado
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...PALETTE.slate700);
        doc.text(lineasWrap, margin + 6.5, y);

        y += lineasWrap.length * 3.8 + 1.2;
        continue;
      }

      // 5.3 Cuadro de Nota o Advertencia (Ej: "NOTA:", "IMPORTANTE:", "CONDICIÓN:")
      const matchCallout = linea.match(/^(NOTA|IMPORTANTE|CONDICIONES?|AVISO|ATENCI[ÓO]N):\s*(.*)$/i);
      if (matchCallout) {
        const etiqueta = matchCallout[1].toUpperCase();
        const restoTexto = matchCallout[2] || '';
        const textoCompleto = `${etiqueta}: ${restoTexto}`;
        const lineasCallout = doc.splitTextToSize(textoCompleto, contentWidth - 10);
        const calloutH = Math.max(8, lineasCallout.length * 3.6 + 4);

        if (y + calloutH > maxYContenido) {
          doc.addPage();
          y = 26;
        }

        // Shaded callout box
        doc.setFillColor(...PALETTE.fondoCard);
        doc.roundedRect(margin, y, contentWidth, calloutH, 1.5, 1.5, 'F');
        doc.setDrawColor(...PALETTE.bordeSuave);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, y, contentWidth, calloutH, 1.5, 1.5, 'S');

        // Borde izquierdo de acento (Amber si es Nota/Aviso, Indigo si es Importante/Condición)
        const colorAcento = etiqueta.includes('NOTA') || etiqueta.includes('AVISO')
          ? PALETTE.amber600
          : PALETTE.primario;
        doc.setFillColor(...colorAcento);
        doc.rect(margin, y, 2.5, calloutH, 'F');

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(...PALETTE.slate700);
        doc.text(lineasCallout, margin + 6, y + 4);

        y += calloutH + 2.5;
        continue;
      }

      // 5.4 Párrafo estándar
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...PALETTE.slate700);
      const lineasParrafo = doc.splitTextToSize(linea, contentWidth);

      if (y + lineasParrafo.length * 3.9 > maxYContenido) {
        doc.addPage();
        y = 26;
      }

      doc.text(lineasParrafo, margin, y);
      y += lineasParrafo.length * 3.9 + 1.8;
    }

    // ─── 5.5 DESGLOSE ECONÓMICO Y COTIZACIÓN DE SERVICIOS (CPQ) ───────────
    if (resumenCotizacion && resumenCotizacion.lineas && resumenCotizacion.lineas.length > 0) {
      if (y > maxYContenido - 55) {
        doc.addPage();
        y = 26;
      } else {
        y += 4;
      }

      // Título de la sección CPQ
      doc.setFillColor(...PALETTE.primario);
      doc.roundedRect(margin, y - 2.8, 2.2, 4, 0.6, 0.6, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...PALETTE.slate950);
      doc.text('PRESUPUESTO ECONÓMICO & PARTIDAS COTIZADAS', margin + 4.5, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...PALETTE.slate500);
      doc.text(`Moneda de liquidación: ${resumenCotizacion.moneda}`, pageWidth - margin, y, { align: 'right' });

      y += 4.5;

      // Cabecera de la tabla de cotización
      const colX = {
        item: margin + 3,
        cant: margin + 92,
        precio: margin + 112,
        descto: margin + 138,
        total: margin + contentWidth - 3,
      };

      const tableH = 5.5;
      doc.setFillColor(...PALETTE.slate950);
      doc.roundedRect(margin, y, contentWidth, tableH, 1, 1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(...PALETTE.blanco);
      doc.text('CONCEPTO / SERVICIO PROFESIONAL', colX.item, y + 3.8);
      doc.text('CANT.', colX.cant, y + 3.8, { align: 'center' });
      doc.text('PRECIO UNIT.', colX.precio, y + 3.8, { align: 'right' });
      doc.text('DESCTO.', colX.descto, y + 3.8, { align: 'right' });
      doc.text('IMPORTE', colX.total, y + 3.8, { align: 'right' });

      y += tableH;

      // Filas de partidas
      for (let i = 0; i < resumenCotizacion.lineas.length; i++) {
        const item = resumenCotizacion.lineas[i];
        if (y + 9 > maxYContenido) {
          doc.addPage();
          y = 26;
        }

        const esFilaPar = i % 2 === 0;
        if (esFilaPar) {
          doc.setFillColor(...PALETTE.fondoCard);
          doc.rect(margin, y, contentWidth, 7, 'F');
        }

        // Borde inferior sutil
        doc.setDrawColor(...PALETTE.bordeSuave);
        doc.setLineWidth(0.2);
        doc.line(margin, y + 7, margin + contentWidth, y + 7);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(...PALETTE.slate900);
        const textoConcepto = item.concepto.length > 55 ? item.concepto.substring(0, 52) + '...' : item.concepto;
        doc.text(textoConcepto, colX.item, y + 4.5);

        // Subtítulo con descripción pequeña si existe
        if (item.descripcion) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(5);
          doc.setTextColor(...PALETTE.slate500);
          const descCorta = item.descripcion.length > 70 ? item.descripcion.substring(0, 67) + '...' : item.descripcion;
          doc.text(descCorta, colX.item, y + 6.2);
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(...PALETTE.slate800);
        doc.text(String(item.cantidad), colX.cant, y + 4.5, { align: 'center' });

        doc.text(formatCurrency(item.precioUnitario, resumenCotizacion.moneda), colX.precio, y + 4.5, { align: 'right' });

        if (item.descuentoPorcentaje > 0) {
          doc.setTextColor(...PALETTE.amber600);
          doc.text(`-${item.descuentoPorcentaje}%`, colX.descto, y + 4.5, { align: 'right' });
        } else {
          doc.setTextColor(...PALETTE.slate400);
          doc.text('—', colX.descto, y + 4.5, { align: 'right' });
        }

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...PALETTE.slate950);
        doc.text(formatCurrency(item.total, resumenCotizacion.moneda), colX.total, y + 4.5, { align: 'right' });

        y += 7.2;
      }

      // Bloque de Totales y Liquidación Fiscal
      y += 2;
      if (y + 26 > maxYContenido) {
        doc.addPage();
        y = 26;
      }

      const totW = 75;
      const totX = margin + contentWidth - totW;

      doc.setFillColor(...PALETTE.fondoCard);
      doc.roundedRect(totX, y, totW, 23, 1.5, 1.5, 'F');
      doc.setDrawColor(...PALETTE.bordeMedio);
      doc.setLineWidth(0.3);
      doc.roundedRect(totX, y, totW, 23, 1.5, 1.5, 'S');

      let ty = y + 4;
      // Subtotal Bruto
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(...PALETTE.slate600);
      doc.text('Subtotal Bruto:', totX + 3.5, ty);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(resumenCotizacion.subtotalBruto, resumenCotizacion.moneda), totX + totW - 3.5, ty, { align: 'right' });

      // Descuento Comercial si aplica
      if (resumenCotizacion.descuentoTotal > 0) {
        ty += 3.8;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...PALETTE.amber600);
        doc.text('Descuento Comercial:', totX + 3.5, ty);
        doc.setFont('helvetica', 'bold');
        doc.text(`-${formatCurrency(resumenCotizacion.descuentoTotal, resumenCotizacion.moneda)}`, totX + totW - 3.5, ty, { align: 'right' });
      }

      // ITBIS 18%
      ty += 3.8;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...PALETTE.slate600);
      doc.text('ITBIS (18% Fiscal DGII):', totX + 3.5, ty);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(resumenCotizacion.itbisTotal, resumenCotizacion.moneda), totX + totW - 3.5, ty, { align: 'right' });

      // Total General Destacado
      ty += 4.5;
      doc.setFillColor(...PALETTE.slate950);
      doc.roundedRect(totX + 1.5, ty - 3.2, totW - 3, 5.5, 1, 1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...PALETTE.blanco);
      doc.text(`TOTAL (${resumenCotizacion.moneda}):`, totX + 4, ty + 0.8);
      doc.text(formatCurrency(resumenCotizacion.totalPagar, resumenCotizacion.moneda), totX + totW - 4, ty + 0.8, { align: 'right' });

      y += 26;
    }

    // ─── 6. BLOQUE FORMAL DE CIERRE Y FIRMAS AUTORIZADAS ──────────────────────
    const alturaFirmas = 38;
    // Si no queda espacio suficiente para el bloque de firmas en la página actual, agregar página
    if (y + alturaFirmas > maxYContenido) {
      doc.addPage();
      y = 28;
    } else {
      y += 3;
    }

    // Título y declaración de conformidad
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...PALETTE.slate950);
    doc.text('CONFORMIDAD, VALIDEZ Y FIRMAS AUTORIZADAS', margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...PALETTE.slate500);
    doc.text(
      'Las partes manifiestan su mutua aceptación con los términos, especificaciones y alcances consignados en el presente instrumento.',
      margin,
      y + 3.5
    );

    y += 5.5;

    const firmaBoxW = (contentWidth - 6) / 2; // 84 mm
    const firmaBoxH = 28;

    // Columna de Firma 1: Empresa Emisora
    const firma1X = margin;
    doc.setFillColor(...PALETTE.blanco);
    doc.roundedRect(firma1X, y, firmaBoxW, firmaBoxH, 1.5, 1.5, 'F');
    doc.setDrawColor(...PALETTE.bordeSuave);
    doc.setLineWidth(0.3);
    doc.roundedRect(firma1X, y, firmaBoxW, firmaBoxH, 1.5, 1.5, 'S');

    doc.setFillColor(...PALETTE.fondoSubtle);
    doc.roundedRect(firma1X, y, firmaBoxW, 4.5, 1.5, 1.5, 'F');
    doc.rect(firma1X, y + 2.5, firmaBoxW, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(...PALETTE.slate800);
    doc.text('POR LA EMPRESA EMISORA', firma1X + 3.5, y + 3.2);

    // Sello digital simulado (Estilo corporativo sobrio)
    doc.setFillColor(...PALETTE.fondoSubtle);
    doc.roundedRect(firma1X + 4, y + 6, 42, 7.5, 1, 1, 'F');
    doc.setDrawColor(...PALETTE.bordeSuave);
    doc.setLineWidth(0.25);
    doc.roundedRect(firma1X + 4, y + 6, 42, 7.5, 1, 1, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(...PALETTE.slate800);
    doc.text('[ SELLO DIGITAL VERIFICADO ]', firma1X + 25, y + 9.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.5);
    doc.setTextColor(...PALETTE.slate500);
    const prefijoSello = this.obtenerInicialesMonograma(razonSocial) || 'DOC';
    doc.text(`Hash: ${prefijoSello}-${hashVerificacion.slice(0, 8)}`, firma1X + 25, y + 12.2, { align: 'center' });

    // Línea de firma
    doc.setDrawColor(...PALETTE.bordeMedio);
    doc.setLineWidth(0.3);
    doc.line(firma1X + 4, y + 17.5, firma1X + firmaBoxW - 4, y + 17.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...PALETTE.slate950);
    doc.text(nombreEjecutivoVal, firma1X + 4, y + 20.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(...PALETTE.slate500);
    doc.text(cargoEjecutivoVal, firma1X + 4, y + 23.5);
    doc.text(razonSocial, firma1X + 4, y + 26);

    // Columna de Firma 2: Empresa Cliente (Aceptación)
    const firma2X = margin + firmaBoxW + 6;
    doc.setFillColor(...PALETTE.blanco);
    doc.roundedRect(firma2X, y, firmaBoxW, firmaBoxH, 1.5, 1.5, 'F');
    doc.setDrawColor(...PALETTE.bordeSuave);
    doc.setLineWidth(0.3);
    doc.roundedRect(firma2X, y, firmaBoxW, firmaBoxH, 1.5, 1.5, 'S');

    doc.setFillColor(...PALETTE.fondoSubtle);
    doc.roundedRect(firma2X, y, firmaBoxW, 4.5, 1.5, 1.5, 'F');
    doc.rect(firma2X, y + 2.5, firmaBoxW, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(...PALETTE.slate800);
    doc.text('ACEPTACIÓN Y CONFORMIDAD DEL CLIENTE', firma2X + 3.5, y + 3.2);

    // Espacio para rúbrica del cliente y línea de firma
    doc.setDrawColor(...PALETTE.bordeMedio);
    doc.setLineWidth(0.3);
    doc.line(firma2X + 4, y + 17.5, firma2X + firmaBoxW - 4, y + 17.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...PALETTE.slate950);
    doc.text(variables.contacto_principal || '—', firma2X + 4, y + 20.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(...PALETTE.slate500);
    doc.text(variables.cargo_contacto || '—', firma2X + 4, y + 23.5);
    doc.text(variables.empresa || '—', firma2X + 4, y + 26);

    // ─── 7. PIE DE PÁGINA INSTITUCIONAL & ENCABEZADOS EN PÁGINAS SIGUIENTES ────
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);

      // Si es página 2 en adelante: Encabezado condensado de continuación
      if (p > 1) {
        doc.setFillColor(...PALETTE.slate950);
        doc.rect(0, 0, pageWidth, 1.8, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(...PALETTE.slate500);
        doc.text(`${razonSocial} • ${titulo}`, margin, 10);
        doc.text(`Ref: ${codigoDocumento} • Pág. ${p} de ${totalPages}`, pageWidth - margin, 10, { align: 'right' });

        doc.setDrawColor(...PALETTE.bordeSuave);
        doc.setLineWidth(0.3);
        doc.line(margin, 13, pageWidth - margin, 13);
      }

      // Pie de página de seguridad corporativa en TODAS las páginas
      doc.setDrawColor(...PALETTE.bordeSuave);
      doc.setLineWidth(0.3);
      doc.line(margin, 283, pageWidth - margin, 283);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(...PALETTE.slate500);
      doc.text(
        `Documento oficial expedido por ${razonSocial} • Cliente: ${variables.empresa}`,
        margin,
        287
      );

      doc.setFontSize(5);
      doc.setTextColor(...PALETTE.slate400);
      doc.text(
        'Conforme a la Ley No. 126-02 sobre Comercio Electrónico, Documentos y Firmas Digitales en la Rep. Dom. • Estricta Confidencialidad.',
        margin,
        290.5
      );

      // Paginación y Código de Seguridad a la derecha
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...PALETTE.slate950);
      doc.text(`Página ${p} de ${totalPages}`, pageWidth - margin, 287, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5);
      doc.setTextColor(...PALETTE.slate500);
      doc.text(`Verificación: SEC-${hashVerificacion.slice(0, 6)}-P${p}`, pageWidth - margin, 290.5, { align: 'right' });
    }

    return doc;
  }

  /**
   * Genera la Data URL (base64) del PDF para previsualizar en tiempo real en un iframe o visor
   */
  obtenerDataUri(
    plantilla: PlantillaDocumento,
    variables: VariablesPlantilla,
    resumenCotizacion?: ResumenCotizacion
  ): string {
    const doc = this.generarDocumentoPdf(plantilla, variables, resumenCotizacion);
    return doc.output('datauristring');
  }

  /**
   * Descarga directamente el archivo PDF generado en el navegador del usuario
   */
  descargarPdf(
    plantilla: PlantillaDocumento,
    variables: VariablesPlantilla,
    nombreArchivo?: string,
    resumenCotizacion?: ResumenCotizacion
  ): void {
    const doc = this.generarDocumentoPdf(plantilla, variables, resumenCotizacion);
    const nombre = nombreArchivo || `${plantilla.id}_${variables.empresa.replace(/\s+/g, '_')}.pdf`;
    doc.save(nombre);
  }
}

export const pdfGeneratorService = new PdfGeneratorService();
