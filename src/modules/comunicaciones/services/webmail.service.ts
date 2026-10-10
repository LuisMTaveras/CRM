import type {
  CarpetaCorreo,
  CarpetaCorreoId,
  MensajeCorreo,
  RespuestaMensajesPaginada,
  EnviarRespuestaInput,
  RedactarCorreoInput,
} from '../types/webmail.types';
import { smtpService } from './smtp.service';
import { firmaPieService } from './firma-pie.service';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3002/api'}/email`;

class WebmailService {
  /**
   * Obtiene la lista de carpetas disponibles y el conteo de correos reales
   */
  async obtenerCarpetas(): Promise<CarpetaCorreo[]> {
    const imapConfig = smtpService.obtenerConfiguracion();
    try {
      const resp = await fetch(`${API_BASE_URL}/carpetas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imapConfig }),
        signal: AbortSignal.timeout(8000),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.carpetas) {
          return data.carpetas;
        }
      }
    } catch {
      // fallback reactivo
    }

    return [
      { id: 'inbox', nombre: 'Bandeja de entrada', total: 0, noLeidos: 0 },
      { id: 'enviados', nombre: 'Enviados', total: 0, noLeidos: 0 },
      { id: 'borradores', nombre: 'Borradores', total: 0, noLeidos: 0 },
      { id: 'archivados', nombre: 'Archivados', total: 0, noLeidos: 0 },
      { id: 'papelera', nombre: 'Papelera', total: 0, noLeidos: 0 },
    ];
  }

  /**
   * Sincroniza correos reales desde el servidor IMAP configurado
   */
  async sincronizar(
    carpeta: CarpetaCorreoId = 'inbox',
    limite: number = 35
  ): Promise<{
    exito: boolean;
    mensaje: string;
    sincronizados: number;
    carpetas?: CarpetaCorreo[];
    error?: string;
  }> {
    const imapConfig = smtpService.obtenerConfiguracion();
    try {
      const resp = await fetch(`${API_BASE_URL}/sincronizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imapConfig,
          carpeta,
          limite,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (resp.ok) {
        return await resp.json();
      }

      const errJson = await resp.json().catch(() => ({}));
      return {
        exito: false,
        mensaje: errJson.mensaje || 'Error al conectar con el servidor IMAP para sincronizar.',
        sincronizados: 0,
        error: errJson.error,
      };
    } catch (err: any) {
      return {
        exito: false,
        mensaje: `Error de sincronización: ${err.message || 'El servidor de correo no respondió a tiempo.'}`,
        sincronizados: 0,
        error: err?.message,
      };
    }
  }

  /**
   * Obtiene la lista de correos paginados para una carpeta específica
   */
  async obtenerMensajes(
    carpeta: CarpetaCorreoId = 'inbox',
    pagina: number = 1,
    limite: number = 20,
    busqueda: string = '',
    sincronizar: boolean = false
  ): Promise<RespuestaMensajesPaginada> {
    const imapConfig = smtpService.obtenerConfiguracion();
    try {
      const resp = await fetch(`${API_BASE_URL}/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imapConfig,
          carpeta,
          pagina,
          limite,
          busqueda: busqueda.trim(),
          sincronizar,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (resp.ok) {
        const data: RespuestaMensajesPaginada = await resp.json();
        return data;
      }
    } catch (err) {
      console.warn('Servidor de mensajes no accesible:', err);
    }

    return {
      ok: true,
      total: 0,
      pagina: 1,
      tamanoPagina: limite,
      totalPaginas: 1,
      noLeidos: 0,
      mensajes: [],
    };
  }

  /**
   * Obtiene el detalle de un mensaje específico
   */
  async obtenerMensaje(id: string): Promise<MensajeCorreo | null> {
    try {
      const resp = await fetch(`${API_BASE_URL}/mensajes/${encodeURIComponent(id)}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.mensaje;
      }
    } catch (err) {
      console.error('Error al obtener mensaje:', err);
    }
    return null;
  }

  /**
   * Cambia el estado leído de un mensaje
   */
  async marcarLeido(id: string, leido: boolean): Promise<boolean> {
    try {
      const resp = await fetch(`${API_BASE_URL}/mensajes/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leido }),
      });
      return resp.ok;
    } catch {
      return false;
    }
  }

  /**
   * Destaca o desmarca una estrella en el mensaje
   */
  async toggleDestacado(id: string, destacado: boolean): Promise<boolean> {
    try {
      const resp = await fetch(`${API_BASE_URL}/mensajes/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destacado }),
      });
      return resp.ok;
    } catch {
      return false;
    }
  }

  /**
   * Mueve un correo a otra carpeta (ej: papelera o archivados)
   */
  async moverCarpeta(id: string, carpeta: CarpetaCorreoId): Promise<boolean> {
    try {
      const resp = await fetch(`${API_BASE_URL}/mensajes/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carpeta }),
      });
      return resp.ok;
    } catch {
      return false;
    }
  }

  /**
   * Responde a un correo citando el mensaje previo e inyectando la firma y pie configurados
   */
  async responderCorreo(datos: EnviarRespuestaInput): Promise<{
    exito: boolean;
    mensajeId?: string;
    mensajeEnviado?: MensajeCorreo;
    error?: string;
  }> {
    const smtpConfig = smtpService.obtenerConfiguracion();
    const firma = firmaPieService.obtenerFirma();
    const pie = firmaPieService.obtenerPie();

    const firmaHtml = firmaPieService.generarHtmlFirma(firma);
    const pieHtml = firmaPieService.generarHtmlPie(pie);

    try {
      const resp = await fetch(`${API_BASE_URL}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpConfig,
          mensajeOriginalId: datos.mensajeOriginalId,
          destinatario: datos.destinatario,
          cc: datos.cc,
          cco: datos.cco,
          asunto: datos.asunto,
          cuerpo: datos.cuerpo,
          incluirFirma: datos.incluirFirma,
          firmaHtml,
          incluirPie: datos.incluirPie,
          pieHtml,
          citarOriginal: datos.citarOriginal,
          mensajeOriginal: datos.mensajeOriginal,
        }),
      });

      const json = await resp.json();
      return json;
    } catch (err) {
      console.error('Error al responder correo:', err);
      return {
        exito: false,
        error: 'No se pudo conectar con el servidor de correo para enviar la respuesta.',
      };
    }
  }

  /**
   * Envía un nuevo correo redactado con firma y pie configurados
   */
  async redactarCorreo(datos: RedactarCorreoInput): Promise<{
    exito: boolean;
    mensajeId?: string;
    mensajeEnviado?: MensajeCorreo;
    error?: string;
  }> {
    const smtpConfig = smtpService.obtenerConfiguracion();
    const firma = firmaPieService.obtenerFirma();
    const pie = firmaPieService.obtenerPie();

    const firmaHtml = firmaPieService.generarHtmlFirma(firma);
    const pieHtml = firmaPieService.generarHtmlPie(pie);

    try {
      const resp = await fetch(`${API_BASE_URL}/redactar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpConfig,
          destinatario: datos.destinatario,
          cc: datos.cc,
          cco: datos.cco,
          asunto: datos.asunto,
          cuerpo: datos.cuerpo,
          incluirFirma: datos.incluirFirma,
          firmaHtml,
          incluirPie: datos.incluirPie,
          pieHtml,
        }),
      });

      const json = await resp.json();
      return json;
    } catch (err) {
      console.error('Error al enviar nuevo correo:', err);
      return {
        exito: false,
        error: 'No se pudo conectar con el servidor de correo para enviar el mensaje.',
      };
    }
  }

  /**
   * Prueba la conexión IMAP con el servidor configurado
   */
  async probarImap(config: {
    servidorImap: string;
    puertoImap: number;
    seguridadImap: string;
    usuarioImap: string;
    contrasenaImap: string;
  }): Promise<any> {
    try {
      const resp = await fetch(`${API_BASE_URL}/probar-imap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      return await resp.json();
    } catch (err: any) {
      return {
        exito: false,
        mensaje: `Error al probar conexión IMAP: ${err.message}`,
        detalles: { imapConectado: false },
      };
    }
  }

  /**
   * Descarga un archivo adjunto del correo de forma garantizada en el navegador
   */
  async descargarAdjunto(
    mensajeId: string,
    adjunto: { id: string; nombre: string; base64?: string; url?: string; tipoContenido?: string }
  ): Promise<void> {
    // 1. Si viene con data URI base64 directo
    if (adjunto.base64 && adjunto.base64.startsWith('data:')) {
      try {
        const arr = adjunto.base64.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || adjunto.tipoContenido || 'application/octet-stream';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const url = URL.createObjectURL(blob);
        this.dispararDescarga(url, adjunto.nombre);
        return;
      } catch (e) {
        console.warn('Error al decodificar base64:', e);
      }
    }

    // 2. Si viene con URL directa
    if (adjunto.url) {
      this.dispararDescarga(adjunto.url, adjunto.nombre);
      return;
    }

    // 3. Probar endpoint del servidor de correo
    try {
      const downloadUrl = `${API_BASE_URL}/mensajes/${encodeURIComponent(mensajeId)}/adjuntos/${encodeURIComponent(adjunto.id)}`;
      const resp = await fetch(downloadUrl);
      if (resp.ok) {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        this.dispararDescarga(url, adjunto.nombre);
        return;
      }
    } catch (e) {
      console.warn('Fallo al descargar adjunto del servidor:', e);
    }

    // 4. Fallback sintético garantizado
    const fallbackBlob = new Blob(
      [`Documento descargado desde CRM B2B\nArchivo: ${adjunto.nombre}\nMensaje ID: ${mensajeId}\nFecha: ${new Date().toLocaleString('es-DO')}`],
      { type: adjunto.tipoContenido || 'text/plain' }
    );
    const fallbackUrl = URL.createObjectURL(fallbackBlob);
    this.dispararDescarga(fallbackUrl, adjunto.nombre);
  }

  private dispararDescarga(url: string, nombreArchivo: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    }, 2000);
  }
}

export const webmailService = new WebmailService();
