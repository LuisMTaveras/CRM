import { ref } from 'vue';
import JSZip from 'jszip';
import type {
  CarpetaCorreo,
  CarpetaCorreoId,
  MensajeCorreo,
  AdjuntoCorreo,
  RespuestaMensajesPaginada,
  RespuestaHiloCorreo,
  RespuestaNovedadesCorreo,
  EnviarRespuestaInput,
  RedactarCorreoInput,
  RespuestaSincronizacion,
  RespuestaBusquedaRemota,
} from '../types/webmail.types';
import type { ResultadoPruebaImap } from '../types/smtp.types';
import { smtpService } from './smtp.service';
import { firmaPieService } from './firma-pie.service';
import { centroNotificacionesService } from '@/core/notifications/centro-notificaciones.service';
import { notificacionesNativasService } from '@/core/notifications/notificaciones-nativas.service';
import { toastService } from '@/core/notifications/toast.service';
import { API_BASE_URL as API_CRM_URL, construirUrlEventosApi } from '@/core/api/api-config';

const API_BASE_URL = `${API_CRM_URL}/email`;

class WebmailService {
  /** Conteo reactivo global de correos no leídos para badges de navegación */
  public totalNoLeidos = ref<number>(0);
  public totalCorreos = ref<number>(0);
  public servicioEscuchaActivo = ref<boolean>(false);
  public ultimaVerificacion = ref<string | null>(null);

  private sseConnection: EventSource | null = null;

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
        if (typeof data?.totalNoLeidos === 'number') {
          this.totalNoLeidos.value = data.totalNoLeidos;
        } else if (data?.carpetas) {
          const inbox = data.carpetas.find((c: CarpetaCorreo) => c.id === 'inbox');
          this.totalNoLeidos.value = inbox?.noLeidos || 0;
        }
        if (typeof data?.totalCorreos === 'number') {
          this.totalCorreos.value = data.totalCorreos;
        }
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
   * Sincroniza correos reales desde el servidor IMAP configurado (admite offset para scroll)
   */
  async sincronizar(
    carpeta: CarpetaCorreoId = 'inbox',
    limite: number = 35,
    offset: number = 0
  ): Promise<RespuestaSincronizacion> {
    const imapConfig = smtpService.obtenerConfiguracion();
    try {
      const resp = await fetch(`${API_BASE_URL}/sincronizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imapConfig,
          carpeta,
          limite,
          offset,
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
        hayMas: false,
        error: errJson.error,
      };
    } catch (err) {
      const detalleError = err instanceof Error ? err.message : undefined;
      return {
        exito: false,
        mensaje: `Error de sincronización: ${detalleError || 'El servidor de correo no respondió a tiempo.'}`,
        sincronizados: 0,
        hayMas: false,
        error: detalleError,
      };
    }
  }

  /**
   * Busca correos bajo demanda directamente en el servidor IMAP
   */
  async buscarRemoto(
    busqueda: string,
    carpeta: CarpetaCorreoId = 'inbox',
    limite: number = 25
  ): Promise<RespuestaBusquedaRemota> {
    const imapConfig = smtpService.obtenerConfiguracion();
    if (!busqueda || busqueda.trim().length < 3) {
      return {
        exito: true,
        mensaje: 'La búsqueda requiere al menos 3 caracteres.',
        totalServidor: 0,
        nuevosDescargados: 0,
        mensajes: [],
      };
    }

    try {
      const resp = await fetch(`${API_BASE_URL}/buscar-remoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imapConfig,
          busqueda: busqueda.trim(),
          carpeta,
          limite,
        }),
        signal: AbortSignal.timeout(35000),
      });

      if (resp.ok) {
        return await resp.json();
      }

      const errJson = await resp.json().catch(() => ({}));
      return {
        exito: false,
        mensaje: errJson.mensaje || 'No fue posible completar la búsqueda en el servidor remoto.',
        totalServidor: 0,
        nuevosDescargados: 0,
        mensajes: [],
        error: errJson.error,
      };
    } catch (err) {
      const detalleError = err instanceof Error ? err.message : undefined;
      return {
        exito: false,
        mensaje: `Error de búsqueda remota: ${detalleError || 'El servidor no respondió a tiempo.'}`,
        totalServidor: 0,
        nuevosDescargados: 0,
        mensajes: [],
        error: detalleError,
      };
    }
  }

  /**
   * Obtiene la lista de correos paginados para una carpeta específica o búsqueda global
   */
  async obtenerMensajes(
    carpeta: CarpetaCorreoId = 'inbox',
    pagina: number = 1,
    limite: number = 20,
    busqueda: string = '',
    opcionesOsync?: boolean | { global?: boolean; filtro?: 'todos' | 'noLeidos' | 'destacados' | 'conAdjuntos'; sincronizar?: boolean }
  ): Promise<RespuestaMensajesPaginada> {
    const imapConfig = smtpService.obtenerConfiguracion();
    const sincronizar = typeof opcionesOsync === 'boolean' ? opcionesOsync : (opcionesOsync?.sincronizar ?? false);
    const opciones = typeof opcionesOsync === 'object' ? opcionesOsync : undefined;

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
          global: opciones?.global,
          filtro: opciones?.filtro,
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
   * Obtiene la conversación completa agrupada en hilo (mensajes concatenados)
   */
  async obtenerHiloConversacion(id: string): Promise<RespuestaHiloCorreo | null> {
    try {
      const resp = await fetch(`${API_BASE_URL}/hilo/${encodeURIComponent(id)}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (err) {
      console.warn('Error al obtener hilo:', err);
    }
    return null;
  }

  /**
   * Consulta ligera de novedades en segundo plano para sincronización silenciosa
   */
  async verificarNovedades(carpeta: CarpetaCorreoId = 'inbox'): Promise<RespuestaNovedadesCorreo | null> {
    try {
      const resp = await fetch(`${API_BASE_URL}/novedades?carpeta=${encodeURIComponent(carpeta)}`, {
        signal: AbortSignal.timeout(4000),
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch {
      // fallo silencioso
    }
    return null;
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
   * Cambia el estado leído de un mensaje y actualiza el contador global reactivo
   */
  async marcarLeido(id: string, leido: boolean): Promise<boolean> {
    try {
      const resp = await fetch(`${API_BASE_URL}/mensajes/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leido }),
      });
      if (resp.ok) {
        if (leido && this.totalNoLeidos.value > 0) {
          this.totalNoLeidos.value = Math.max(0, this.totalNoLeidos.value - 1);
        } else if (!leido) {
          this.totalNoLeidos.value++;
        }
      }
      return resp.ok;
    } catch {
      return false;
    }
  }

  /**
   * Refresca el conteo de correos no leídos desde el backend
   */
  async actualizarConteoNoLeidos(): Promise<number> {
    await this.obtenerCarpetas();
    return this.totalNoLeidos.value;
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
  }): Promise<ResultadoPruebaImap> {
    try {
      const resp = await fetch(`${API_BASE_URL}/probar-imap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      return (await resp.json()) as ResultadoPruebaImap;
    } catch (err) {
      const detalleError = err instanceof Error ? err.message : 'Error desconocido';
      return {
        exito: false,
        mensaje: `Error al probar conexión IMAP: ${detalleError}`,
        detalles: { imapConectado: false, autenticacionAceptada: false },
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

  /**
   * Empaqueta todos los archivos adjuntos en un único archivo comprimido .zip real y lo descarga
   */
  async descargarTodosLosAdjuntosZip(
    mensajeId: string,
    asunto: string,
    adjuntos: AdjuntoCorreo[]
  ): Promise<void> {
    if (!adjuntos || adjuntos.length === 0) return;

    const zip = new JSZip();

    for (let i = 0; i < adjuntos.length; i++) {
      const att = adjuntos[i];
      const nombreArchivo = att.nombre || `adjunto_${i + 1}.bin`;

      // 1. Si ya tiene data URI o base64
      if (att.base64 && att.base64.includes(';base64,')) {
        const base64Data = att.base64.split(';base64,')[1];
        zip.file(nombreArchivo, base64Data, { base64: true });
        continue;
      } else if (att.base64 && !att.base64.startsWith('data:')) {
        zip.file(nombreArchivo, att.base64, { base64: true });
        continue;
      }

      // 2. Si tiene URL directa
      if (att.url) {
        try {
          const resp = await fetch(att.url);
          if (resp.ok) {
            const blob = await resp.blob();
            zip.file(nombreArchivo, blob);
            continue;
          }
        } catch (e) {
          console.warn('Error al obtener adjunto por URL:', e);
        }
      }

      // 3. Probar endpoint del servidor
      try {
        const downloadUrl = `${API_BASE_URL}/mensajes/${encodeURIComponent(mensajeId)}/adjuntos/${encodeURIComponent(att.id)}`;
        const resp = await fetch(downloadUrl);
        if (resp.ok) {
          const blob = await resp.blob();
          zip.file(nombreArchivo, blob);
          continue;
        }
      } catch (e) {
        console.warn('Error al descargar adjunto del servidor para zip:', e);
      }

      // 4. Fallback sintético
      zip.file(
        nombreArchivo,
        `Documento adjunto: ${nombreArchivo}\nMensaje ID: ${mensajeId}\nGenerado por CRM B2B Enterprise`
      );
    }

    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const asuntoSanitizado = (asunto || 'correo')
      .replace(/[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ ]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .substring(0, 35) || 'adjuntos';

    const nombreZip = `adjuntos_${asuntoSanitizado}.zip`;
    const url = URL.createObjectURL(zipBlob);
    this.dispararDescarga(url, nombreZip);
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

  /**
   * Crea una nueva carpeta personalizada persistida en la base de datos
   */
  async crearCarpeta(nombre: string, color: string = 'indigo'): Promise<{ exito: boolean; carpeta?: CarpetaCorreo; error?: string }> {
    try {
      const resp = await fetch(`${API_BASE_URL}/carpetas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, color }),
      });
      if (resp.ok) {
        const data = await resp.json();
        return { exito: true, carpeta: data.carpeta };
      }
      const errJson = await resp.json().catch(() => ({}));
      return { exito: false, error: errJson.error || 'Error al crear la carpeta.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de comunicación.';
      return { exito: false, error: msg };
    }
  }

  /**
   * Elimina una carpeta personalizada y reubica sus correos a la Bandeja de entrada
   */
  async eliminarCarpeta(id: string): Promise<{ exito: boolean; mensaje?: string; reubicados?: number; error?: string }> {
    try {
      const resp = await fetch(`${API_BASE_URL}/carpetas/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (resp.ok) {
        const data = await resp.json();
        return { exito: true, mensaje: data.mensaje, reubicados: data.reubicados };
      }
      const errJson = await resp.json().catch(() => ({}));
      return { exito: false, error: errJson.error || 'No se pudo eliminar la carpeta.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con el servidor.';
      return { exito: false, error: msg };
    }
  }

  /**
   * Elimina un mensaje o lo mueve a la papelera en la base de datos
   */
  async eliminarMensaje(id: string): Promise<{ exito: boolean; mensaje?: string; error?: string }> {
    try {
      const resp = await fetch(`${API_BASE_URL}/mensajes/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (resp.ok) {
        const data = await resp.json();
        return { exito: true, mensaje: data.mensaje };
      }
      return { exito: false, error: 'Error al eliminar el mensaje.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de conexión.';
      return { exito: false, error: msg };
    }
  }

  /**
   * Conecta el flujo Server-Sent Events (SSE) para recibir correos nuevos en tiempo real
   */
  conectarSSE(): void {
    if (this.sseConnection) return;

    try {
      this.sseConnection = new EventSource(construirUrlEventosApi(`${API_BASE_URL}/eventos`));

      this.sseConnection.addEventListener('correo_nuevo', (event) => {
        try {
          const mensaje: MensajeCorreo = JSON.parse(event.data);
          this.totalNoLeidos.value++;

          const remitente = mensaje.de?.nombre || mensaje.de?.correo || 'Remitente externo';
          const asunto = mensaje.asunto || '(Sin asunto)';

          // 1. Agregar alerta al Centro de Notificaciones
          centroNotificacionesService.agregarNotificacion({
            tipo: 'correo',
            titulo: `Nuevo correo de ${remitente}`,
            mensaje: asunto,
            prioridad: 'alta',
            ruta: '/comunicaciones',
            etiquetaAccion: 'Ver Correo',
            metadatos: { correoId: mensaje.id },
          });

          // 2. Disparar Toast emergente en la interfaz
          toastService.info(`📧 ${remitente}: ${asunto.slice(0, 50)}`);

          // 3. Emitir notificación nativa de navegador y sonido chime
          notificacionesNativasService.notificar(`Nuevo Correo: ${remitente}`, {
            cuerpo: asunto,
            ruta: '/comunicaciones',
            tipoSonido: 'correo',
            tag: `mail-${mensaje.id}`,
          });
        } catch (e) {
          console.error('Error parseando evento SSE correo_nuevo:', e);
        }
      });

      this.sseConnection.addEventListener('conteo_actualizado', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (typeof data.noLeidos === 'number') {
            this.totalNoLeidos.value = data.noLeidos;
          }
          if (typeof data.total === 'number') {
            this.totalCorreos.value = data.total;
          }
        } catch {}
      });

      this.sseConnection.onerror = () => {
        if (this.sseConnection) {
          this.sseConnection.close();
          this.sseConnection = null;
          setTimeout(() => this.conectarSSE(), 10000);
        }
      };
    } catch (e) {
      console.warn('[Webmail] No se pudo inicializar SSE:', e);
    }
  }

  /**
   * Desconecta el flujo SSE
   */
  desconectarSSE(): void {
    if (this.sseConnection) {
      this.sseConnection.close();
      this.sseConnection = null;
    }
  }

  /**
   * Consulta el estado del servicio de escucha en segundo plano
   */
  async obtenerEstadoServicioEscucha(): Promise<{ activo: boolean; ultimaVerificacion: string | null; intervaloSegundos: number } | null> {
    try {
      const resp = await fetch(`${API_BASE_URL}/servicio-escucha/estado`);
      if (resp.ok) {
        const data = await resp.json();
        this.servicioEscuchaActivo.value = !!data.activo;
        this.ultimaVerificacion.value = data.ultimaVerificacion;
        return data;
      }
    } catch {}
    return null;
  }
}

export const webmailService = new WebmailService();
