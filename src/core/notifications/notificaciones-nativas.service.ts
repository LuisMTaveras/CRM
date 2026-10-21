import { ref } from 'vue';
import router from '@/app/router';

const CLAVE_SONIDO = 'crm_notificaciones_sonido_v1';
const CLAVE_ESCRITORIO = 'crm_notificaciones_escritorio_v1';

export type TipoSonidoNotificacion = 'whatsapp' | 'tarea' | 'urgente' | 'general';

export interface OpcionesNotificacionNativa {
  cuerpo?: string;
  ruta?: string;
  icono?: string;
  tag?: string;
  sonido?: boolean;
  tipoSonido?: TipoSonidoNotificacion;
}

class NotificacionesNativasService {
  permiso = ref<NotificationPermission | 'unsupported'>('default');
  sonidoHabilitado = ref<boolean>(this.leerBooleanoStorage(CLAVE_SONIDO, true));
  escritorioHabilitado = ref<boolean>(this.leerBooleanoStorage(CLAVE_ESCRITORIO, true));

  private audioCtx: AudioContext | null = null;

  constructor() {
    this.actualizarEstadoPermiso();
  }

  private leerBooleanoStorage(clave: string, porDefecto: boolean): boolean {
    try {
      if (typeof window === 'undefined') return porDefecto;
      const guardado = localStorage.getItem(clave);
      if (guardado === null) return porDefecto;
      return guardado === 'true';
    } catch {
      return porDefecto;
    }
  }

  private guardarBooleanoStorage(clave: string, valor: boolean): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(clave, String(valor));
      }
    } catch {}
  }

  actualizarEstadoPermiso(): void {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      this.permiso.value = 'unsupported';
      return;
    }
    this.permiso.value = Notification.permission;
  }

  /**
   * Solicita permiso al usuario para mostrar notificaciones nativas de escritorio
   */
  async solicitarPermiso(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      this.permiso.value = 'unsupported';
      return false;
    }

    try {
      const resultado = await Notification.requestPermission();
      this.permiso.value = resultado;
      if (resultado === 'granted') {
        this.escritorioHabilitado.value = true;
        this.guardarBooleanoStorage(CLAVE_ESCRITORIO, true);
        this.reproducirChime('general');
        return true;
      }
      return false;
    } catch (e) {
      console.warn('[Notificaciones] Error solicitando permiso:', e);
      return false;
    }
  }

  alternarSonido(): void {
    this.sonidoHabilitado.value = !this.sonidoHabilitado.value;
    this.guardarBooleanoStorage(CLAVE_SONIDO, this.sonidoHabilitado.value);
    if (this.sonidoHabilitado.value) {
      this.reproducirChime('general');
    }
  }

  alternarEscritorio(): void {
    this.escritorioHabilitado.value = !this.escritorioHabilitado.value;
    this.guardarBooleanoStorage(CLAVE_ESCRITORIO, this.escritorioHabilitado.value);
  }

  /**
   * Obtiene o inicializa de forma segura el contexto de Audio Web API
   */
  private obtenerAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return null;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      return this.audioCtx;
    } catch {
      return null;
    }
  }

  /**
   * Reproduce un chime sintetizado mediante Web Audio API (0 dependencias externas)
   */
  reproducirChime(tipo: TipoSonidoNotificacion = 'general'): void {
    if (!this.sonidoHabilitado.value) return;

    const ctx = this.obtenerAudioContext();
    if (!ctx) return;

    try {
      const ahora = ctx.currentTime;

      if (tipo === 'whatsapp') {
        // Tono moderno WhatsApp: E5 (659Hz) -> A5 (880Hz)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        gainNode.gain.setValueAtTime(0, ahora);
        gainNode.gain.linearRampToValueAtTime(0.12, ahora + 0.015);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ahora + 0.28);

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, ahora); // E5
        osc1.frequency.setValueAtTime(880.0, ahora + 0.09); // A5

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1318.5, ahora); // Armónico suave E6
        osc2.frequency.setValueAtTime(1760.0, ahora + 0.09);

        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.04, ahora);

        osc1.connect(gainNode);
        osc2.connect(subGain);
        subGain.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start(ahora);
        osc2.start(ahora);
        osc1.stop(ahora + 0.3);
        osc2.stop(ahora + 0.3);
      } else if (tipo === 'tarea') {
        // Acorde cálido de campana para recordatorios de agenda / tareas: C5 (523Hz) + G5 (784Hz)
        const oscC = ctx.createOscillator();
        const oscG = ctx.createOscillator();
        const gain = ctx.createGain();

        gain.gain.setValueAtTime(0, ahora);
        gain.gain.linearRampToValueAtTime(0.14, ahora + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ahora + 0.45);

        oscC.type = 'sine';
        oscC.frequency.setValueAtTime(523.25, ahora); // C5

        oscG.type = 'sine';
        oscG.frequency.setValueAtTime(783.99, ahora); // G5

        oscC.connect(gain);
        oscG.connect(gain);
        gain.connect(ctx.destination);

        oscC.start(ahora);
        oscG.start(ahora);
        oscC.stop(ahora + 0.5);
        oscG.stop(ahora + 0.5);
      } else if (tipo === 'urgente') {
        // Alerta de prioridad alta / vencimiento
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        gain.gain.setValueAtTime(0, ahora);
        gain.gain.linearRampToValueAtTime(0.18, ahora + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ahora + 0.18);
        gain.gain.linearRampToValueAtTime(0.18, ahora + 0.22);
        gain.gain.exponentialRampToValueAtTime(0.001, ahora + 0.4);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ahora);
        osc.frequency.setValueAtTime(1046.5, ahora + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ahora);
        osc.stop(ahora + 0.42);
      } else {
        // Ding sutil genérico
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        gain.gain.setValueAtTime(0, ahora);
        gain.gain.linearRampToValueAtTime(0.1, ahora + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ahora + 0.15);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, ahora);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ahora);
        osc.stop(ahora + 0.16);
      }
    } catch (e) {
      console.warn('[Audio] Error al reproducir chime:', e);
    }
  }

  /**
   * Emite una notificación nativa de escritorio y reproduce sonido si está configurado
   */
  notificar(titulo: string, opciones?: OpcionesNotificacionNativa): void {
    // 1. Reproducir sonido si está habilitado
    if (opciones?.sonido !== false) {
      this.reproducirChime(opciones?.tipoSonido || 'general');
    }

    // 2. Disparar notificación de escritorio si el navegador y el usuario lo permiten
    if (
      this.escritorioHabilitado.value &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        const notifNativa = new Notification(titulo, {
          body: opciones?.cuerpo || '',
          icon: opciones?.icono || '/favicon.ico',
          tag: opciones?.tag,
        });

        notifNativa.onclick = () => {
          window.focus();
          if (opciones?.ruta) {
            router.push(opciones.ruta).catch(() => {});
          }
          notifNativa.close();
        };
      } catch (err) {
        console.warn('[Notificaciones] Error al crear Notification de escritorio:', err);
      }
    }
  }
}

export const notificacionesNativasService = new NotificacionesNativasService();
