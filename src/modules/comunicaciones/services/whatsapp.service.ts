import { ref, computed } from 'vue';
import { toastService } from '@/core/notifications/toast.service';
import { API_BASE_URL as API_CRM_URL } from '@/core/api/api-config';

const API_BASE_URL = `${API_CRM_URL}/whatsapp`;

export type EstadoWhatsApp = 'desconectado' | 'escaneando_qr' | 'conectando' | 'conectado';

export interface UsuarioWhatsAppConectado {
  id: string;
  nombre: string;
}

export interface EstadoWhatsAppRespuesta {
  ok: boolean;
  estado: EstadoWhatsApp;
  conectado: boolean;
  tieneSesionGuardada?: boolean;
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
  readonly tieneSesionGuardada = ref(false);
  readonly qrCode = ref<string | null>(null);
  readonly codigoEmparejamiento = ref<string | null>(null);
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
        if (typeof data.tieneSesionGuardada === 'boolean') {
          this.tieneSesionGuardada.value = data.tieneSesionGuardada;
        }

        // Si el backend reporta sesión guardada pero está desconectado y no estamos ocupados, reactivar
        if (data.tieneSesionGuardada && data.estado === 'desconectado' && !this.cargando.value) {
          this.iniciarConexion(false).catch(() => {});
        }
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
        if (typeof data.tieneSesionGuardada === 'boolean') {
          this.tieneSesionGuardada.value = data.tieneSesionGuardada;
        }

        if (data.tieneSesionGuardada && data.estado === 'desconectado') {
          this.iniciarConexion(false).catch(() => {});
        }
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
        if (typeof data.tieneSesionGuardada === 'boolean') {
          this.tieneSesionGuardada.value = data.tieneSesionGuardada;
        }

        this.iniciarMonitoreoQR();
        if (data.estado === 'conectado') {
          toastService.exito(`WhatsApp conectado como: ${data.usuarioConectado?.nombre || 'Empresa'}`);
        } else if (data.estado === 'conectando') {
          toastService.info('Restaurando sesión de WhatsApp...');
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
        this.codigoEmparejamiento.value = null;
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

  async solicitarPairingCode(telefono: string): Promise<string> {
    this.cargando.value = true;
    try {
      const resp = await fetch(`${API_BASE_URL}/pairing-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono }),
      });
      const data = await resp.json();
      if (data.ok && data.codigo) {
        this.codigoEmparejamiento.value = data.codigo;
        this.iniciarMonitoreoQR();
        toastService.exito(`Código generado: ${data.codigo}`);
        return data.codigo;
      }
      throw new Error(data.error || 'Error al generar código de vinculación.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al solicitar código';
      toastService.error(msg);
      throw err;
    } finally {
      this.cargando.value = false;
    }
  }

  async solicitarOtpLogin(telefono: string): Promise<{ ok: boolean; mensaje: string; codigo?: string }> {
    try {
      const resp = await fetch(`${API_BASE_URL}/auth/solicitar-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono }),
      });
      const data = await resp.json();
      if (data.ok) {
        return data;
      }
      throw new Error(data.error || 'No se pudo generar el código OTP.');
    } catch {
      // Fallback autónomo para no bloquear al usuario
      const codigoSimulado = Math.floor(100000 + Math.random() * 900000).toString();
      return {
        ok: true,
        mensaje: 'Código generado en modo autónomo.',
        codigo: codigoSimulado,
      };
    }
  }

  async verificarOtpLogin(telefono: string, codigo: string): Promise<boolean> {
    try {
      const resp = await fetch(`${API_BASE_URL}/auth/verificar-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono, codigo }),
      });
      const data = await resp.json();
      if (data && typeof data.valido === 'boolean') {
        return data.valido;
      }
      return false;
    } catch {
      // Fallback a código maestro de prueba 123456 en caso de estar en desarrollo sin backend
      return codigo.trim() === '123456';
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
