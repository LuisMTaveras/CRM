import mammoth from 'mammoth';

export interface DocumentoProcesado {
  nombreArchivo: string;
  tipoArchivo: string;
  tamanoBytes: number;
  contenidoTexto: string;
  variablesDetectadas: string[];
  esDocx: boolean;
  esPdf: boolean;
}

export class DocumentParserService {
  /**
   * Extrae el texto y detecta variables dinámicas {{variable}} de un archivo subido (Word docx, txt, md, pdf)
   */
  async procesarArchivo(archivo: File): Promise<DocumentoProcesado> {
    const extension = archivo.name.split('.').pop()?.toLowerCase() || '';
    let contenidoTexto = '';
    const esDocx = extension === 'docx' || extension === 'doc';
    const esPdf = extension === 'pdf';

    if (esDocx) {
      try {
        const arrayBuffer = await archivo.arrayBuffer();
        const resultado = await mammoth.extractRawText({ arrayBuffer });
        contenidoTexto = resultado.value;
      } catch (err) {
        console.warn('Error al extraer texto docx con mammoth:', err);
        contenidoTexto = `Documento cargado: ${archivo.name}\n\n(No se pudo extraer el texto binario de forma nativa. Puedes escribir o pegar la plantilla directamente).`;
      }
    } else if (extension === 'txt' || extension === 'md' || extension === 'html' || extension === 'rtf') {
      contenidoTexto = await archivo.text();
    } else if (esPdf) {
      // Para PDF adjunto
      contenidoTexto = `DOCUMENTO PDF ADJUNTO: ${archivo.name}\n\nEste documento será enviado directamente como archivo adjunto a cada destinatario. Si deseas sustituir datos dinámicos como {{empresa}} o {{contacto_principal}}, puedes redactar el encabezado y contenido en el editor.`;
    } else {
      // Archivo de texto plano fallback
      try {
        contenidoTexto = await archivo.text();
      } catch {
        contenidoTexto = `Archivo cargado: ${archivo.name}`;
      }
    }

    // Detectar variables del tipo {{variable}}
    const regexVariables = /{{([a-zA-Z0-9_]+)}}/g;
    const coincidencias = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = regexVariables.exec(contenidoTexto)) !== null) {
      if (match[1]) coincidencias.add(match[1]);
    }

    return {
      nombreArchivo: archivo.name,
      tipoArchivo: archivo.type || extension,
      tamanoBytes: archivo.size,
      contenidoTexto,
      variablesDetectadas: Array.from(coincidencias),
      esDocx,
      esPdf,
    };
  }
}

export const documentParserService = new DocumentParserService();
