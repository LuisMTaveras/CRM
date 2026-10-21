import { ref, computed } from 'vue';
import { toastService } from '@/core/notifications/toast.service';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3002/api'}/whatsapp`;

export type EstadoWhatsApp = 'desconectado' | 'escaneando_qr' | 'conectando' | 'conectado';

export interface UsuarioWhatsAppConectado {
  id: string;
  nombre: string;
}

export interface EstadoWhatsAppRespuesta {
  ok: boolean;
  estado: EstadoWhatsApp;
  conectado: boolean;
  qrCode: string | null;
  usuarioConectado: UsuarioWhatsAppConectado | null;
  ultimaConexion: string | null;
  totalEnviados?: number;
  error?: string;
}

export interface MensajeWhatsAppRegistro {
  id: string;
  destinatario: string;
  jid: string;
  tipo: 'texto' | 'documento_pdf';
  mensaje?: string;
  archivo?: string;
  pieTexto?: string;
  timestamp: string;
  estado: 'enviado' | 'fallido';
}

class WhatsAppService {
  readonly estado = ref<EstadoWhatsApp>('desconectado');
  readonly conectado = computed(() => this.estado.value === 'conectado');
  readonly qrCode = ref<string | null>(null);
  readonly usuarioConectado = ref<UsuarioWhatsAppConectado | null>(null);
  readonly ultimaConexion = ref<string | null>(null);
  readonly cargando = ref(false);
  private timerPoller: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.consultarEstadoSilencioso();
  }

  /**
   * Limpia y formatea un teléfono para generar enlaces wa.me directos
   */
  formatearTelefonoParaEnlace(telefono: string): string {
    if (!telefono) return '';
    let limpio = telefono.replace(/\D/g, '');
    if (limpio.length === 10 && (limpio.startsWith('809') || limpio.startsWith('829') || limpio.startsWith('849'))) {
      limpio = '1' + limpio;
    }
    return limpio;
  }

  /**
   * Genera enlace oficial wa.me para abrir en navegador o app de WhatsApp
   */
  generarEnlaceWhatsApp(telefono: string, mensaje: string = ''): string {
    const tel = this.formatearTelefonoParaEnlace(telefono);
    if (!tel) return '';
    const textoCodificado = encodeURIComponent(mensaje);
    return `https://wa.me/${tel}${textoCodificado ? `?text=${textoCodificado}` : ''}`;
  }

  /**
   * Abre directamente la conversación en WhatsApp Web / App nativa
   */
  abrirConversacionNativa(telefono: string, mensaje: string = ''): void {
    const enlace = this.generarEnlaceWhatsApp(telefono, mensaje);
    if (enlace) {
      window.open(enlace, '_blank');
    }
  }

  async consultarEstadoSilencioso(): Promise<void> {
    try {
      const resp = await fetch(`${API_BASE_URL}/estado`);
      if (!resp.ok) return;
      const data: EstadoWhatsAppRespuesta = await resp.json();
      if (data.ok) {
        this.estado.value = data.estado;
        this.qrCode.value = data.qrCode;
        this.usuarioConectado.value = data.usuarioConectado;
        this.ultimaConexion.value = data.ultimaConexion;
      }
    } catch {
      // Servidor backend offline temporalmente
    }
  }

  async consultarEstado(): Promise<EstadoWhatsAppRespuesta | null> {
    this.cargando.value = true;
    try {
      const resp = await fetch(`${API_BASE_URL}/estado`);
      const data: EstadoWhatsAppRespuesta = await resp.json();
      if (data.ok) {
        this.estado.value = data.estado;
        this.qrCode.value = data.qrCode;
        this.usuarioConectado.value = data.usuarioConectado;
        this.ultimaConexion.value = data.ultimaConexion;
        return data;
      }
      return null;
    } catch (err: unknown) {
      console.warn('[WhatsApp] No se pudo conectar con el servidor:', err);
      return null;
    } finally {
      this.cargando.value = false;
    }
  }

  async iniciarConexion(forzarNuevo = false): Promise<void> {
    this.cargando.value = true;
    try {
      const resp = await fetch(`${API_BASE_URL}/conectar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forzarNuevo }),
      });
      const data = await resp.json();
      if (data.ok) {
        this.estado.value = data.estado;
        this.qrCode.value = data.qrCode;
        this.usuarioConectado.value = data.usuarioConectado;
        this.ultimaConexion.value = data.ultimaConexion;

        this.iniciarMonitoreoQR();
        if (data.estado === 'conectado') {
          toastService.exito(`WhatsApp conectado como: ${data.usuarioConectado?.nombre || 'Empresa'}`);
        } else {
          toastService.info('Escanea el código QR desde tu aplicación de WhatsApp.');
        }
      } else {
        throw new Error(data.error || 'Error al iniciar conexión de WhatsApp.');
      }
    } catch (err: unknown) {
      toastService.error(err instanceof Error ? err.message : 'Error al conectar con WhatsApp.');
    } finally {
      this.cargando.value = false;
    }
  }

  async desconectar(): Promise<void> {
    this.cargando.value = true;
    try {
      const resp = await fetch(`${API_BASE_URL}/desconectar`, { method: 'POST' });
      const data = await resp.json();
      if (data.ok) {
        this.estado.value = 'desconectado';
        this.qrCode.value = null;
        this.usuarioConectado.value = null;
        this.detenerMonitoreoQR();
        toastService.info('Sesión de WhatsApp cerrada.');
      }
    } catch (err: unknown) {
      toastService.error(err instanceof Error ? err.message : 'Error al desconectar WhatsApp.');
    } finally {
      this.cargando.value = false;
    }
  }

  iniciarMonitoreoQR(): void {
    this.detenerMonitoreoQR();
    this.timerPoller = setInterval(async () => {
      await this.consultarEstadoSilencioso();
      if (this.conectado.value) {
        this.detenerMonitoreoQR();
        toastService.exito(`¡WhatsApp vinculado con éxito!`);
      }
    }, 2500);
  }

  detenerMonitoreoQR(): void {
    if (this.timerPoller) {
      clearInterval(this.timerPoller);
      this.timerPoller = null;
    }
  }

  async enviarMensaje(telefono: string, mensaje: string): Promise<boolean> {
    if (!telefono) {
      toastService.advertencia('El cliente no tiene un teléfono registrado.');
      return false;
    }

    // Si el servidor de Baileys está conectado, enviar por el backend
    if (this.conectado.value) {
      this.cargando.value = true;
      try {
        const resp = await fetch(`${API_BASE_URL}/enviar-mensaje`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telefono, mensaje }),
        });
        const data = await resp.json();
        if (data.ok) {
          toastService.exito(`Mensaje de WhatsApp enviado a ${telefono}`);
          return true;
        } else {
          throw new Error(data.error || 'No se pudo enviar el mensaje.');
        }
      } catch (err: unknown) {
        toastService.error(err instanceof Error ? err.message : 'Error al enviar WhatsApp.');
        // Fallback a enlace web
        this.abrirConversacionNativa(telefono, mensaje);
        return false;
      } finally {
        this.cargando.value = false;
      }
    } else {
      // Fallback nativo: abrir WhatsApp Web directamente
      this.abrirConversacionNativa(telefono, mensaje);
      toastService.info('Abriendo WhatsApp Web para enviar el mensaje.');
      return true;
    }
  }

  async enviarPdf(
    telefono: string,
    pdfBase64: string,
    nombreArchivo: string = 'Cotizacion_Comercial.pdf',
    pieTexto: string = ''
  ): Promise<boolean> {
    if (!telefono) {
      toastService.advertencia('El cliente no tiene un teléfono registrado.');
      return false;
    }

    if (this.conectado.value) {
      this.cargando.value = true;
      try {
        const resp = await fetch(`${API_BASE_URL}/enviar-documento`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telefono,
            documentoBase64: pdfBase64,
            nombreArchivo,
            pieTexto,
          }),
        });
        const data = await resp.json();
        if (data.ok) {
          toastService.exito(`Cotización PDF enviada por WhatsApp a ${telefono}`);
          return true;
        } else {
          throw new Error(data.error || 'No se pudo enviar el PDF por WhatsApp.');
        }
      } catch (err: unknown) {
        toastService.error(err instanceof Error ? err.message : 'Error enviando PDF por WhatsApp.');
        return false;
      } finally {
        this.cargando.value = false;
      }
    } else {
      toastService.advertencia(
        'Conecta tu WhatsApp escaneando el código QR en Ajustes para enviar archivos PDF automáticamente.'
      );
      this.abrirConversacionNativa(telefono, pieTexto);
      return false;
    }
  }
}

export const whatsAppService = new WhatsAppService();
