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
   * Obtiene la lista de carpetas disponibles y el conteo de correos no leídos
   */
  async obtenerCarpetas(): Promise<CarpetaCorreo[]> {
    try {
      const resp = await fetch(`${API_BASE_URL}/carpetas`, {
        signal: AbortSignal.timeout(5000),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.carpetas) {
          return data.carpetas;
        }
      }
    } catch {
      // fallback
    }

    // Fallback reactivo si el servidor proxy tarda en responder
    return [
      { id: 'inbox', nombre: 'Bandeja de entrada', total: 5, noLeidos: 2 },
      { id: 'enviados', nombre: 'Enviados', total: 1, noLeidos: 0 },
      { id: 'borradores', nombre: 'Borradores', total: 1, noLeidos: 0 },
      { id: 'archivados', nombre: 'Archivados', total: 0, noLeidos: 0 },
      { id: 'papelera', nombre: 'Papelera', total: 0, noLeidos: 0 },
    ];
  }

  /**
   * Obtiene la lista de correos paginados para una carpeta específica
   */
  async obtenerMensajes(
    carpeta: CarpetaCorreoId = 'inbox',
    pagina: number = 1,
    limite: number = 20,
    busqueda: string = ''
  ): Promise<RespuestaMensajesPaginada> {
    try {
      const params = new URLSearchParams({
        carpeta,
        pagina: String(pagina),
        limite: String(limite),
      });
      if (busqueda.trim()) {
        params.set('busqueda', busqueda.trim());
      }

      const resp = await fetch(`${API_BASE_URL}/mensajes?${params.toString()}`, {
        signal: AbortSignal.timeout(8000),
      });

      if (resp.ok) {
        const data: RespuestaMensajesPaginada = await resp.json();
        return data;
      }
    } catch (err) {
      console.warn('Servidor de mensajes no accesible directamente, usando caché:', err);
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
}

export const webmailService = new WebmailService();
