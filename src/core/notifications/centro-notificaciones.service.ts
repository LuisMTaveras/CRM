import { ref, computed } from 'vue';
import type { Notificacion, NuevaNotificacionInput } from './notificaciones.types';

const CLAVE_STORAGE = 'crm_centro_notificaciones_v1';

const NOTIFICACIONES_INICIALES: Notificacion[] = [
  {
    id: 'notif-1',
    tipo: 'correo',
    titulo: 'Nuevo correo de Banco BHD León',
    mensaje: 'La Lic. Mercedes Gómez respondió confirmando la recepción de la propuesta técnica.',
    prioridad: 'alta',
    fecha: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // hace 25 min
    leida: false,
    ruta: '/comunicaciones',
    etiquetaAccion: 'Abrir Bandeja',
  },
  {
    id: 'notif-2',
    tipo: 'propuesta',
    titulo: 'Vencimiento de Propuesta Comercial',
    mensaje: 'La propuesta Ref: AL-PROP-0EF4CF para Banco BHD León tiene 30 días de vigencia activa.',
    prioridad: 'media',
    fecha: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // hace 3 horas
    leida: false,
    ruta: '/comunicaciones',
    etiquetaAccion: 'Ver Documento',
  },
  {
    id: 'notif-3',
    tipo: 'pipeline',
    titulo: 'Oportunidad B2B en Etapa Calificada',
    mensaje: 'La oportunidad "Licenciamiento Cloud Enterprise" fue promovida con éxito a Negociación.',
    prioridad: 'media',
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // hace 1 día
    leida: true,
    ruta: '/pipeline',
    etiquetaAccion: 'Ir al Pipeline',
  },
  {
    id: 'notif-4',
    tipo: 'sistema',
    titulo: 'Identidad Corporativa Sincronizada',
    mensaje: 'El membrete institucional, logotipo y RNC emisor se han actualizado correctamente.',
    prioridad: 'baja',
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // hace 1.5 días
    leida: true,
    ruta: '/configuracion',
    etiquetaAccion: 'Ver Ajustes',
  },
];

class CentroNotificacionesService {
  private items = ref<Notificacion[]>(this.cargarDeStorage());

  constructor() {
    // Si no había nada guardado en storage, inicializar con las semillas
    if (this.items.value.length === 0) {
      this.items.value = [...NOTIFICACIONES_INICIALES];
      this.guardarEnStorage();
    }
  }

  private cargarDeStorage(): Notificacion[] {
    try {
      const guardado = localStorage.getItem(CLAVE_STORAGE);
      if (guardado) {
        const parsed = JSON.parse(guardado);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback silencioso
    }
    return [];
  }

  private guardarEnStorage(): void {
    try {
      localStorage.setItem(CLAVE_STORAGE, JSON.stringify(this.items.value));
    } catch {
      // cuota excedida
    }
  }

  public get notificaciones() {
    return computed(() => [...this.items.value].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
  }

  public get totalNoLeidas() {
    return computed(() => this.items.value.filter((n) => !n.leida).length);
  }

  agregarNotificacion(input: NuevaNotificacionInput): Notificacion {
    const nueva: Notificacion = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tipo: input.tipo,
      titulo: input.titulo,
      mensaje: input.mensaje,
      prioridad: input.prioridad || 'media',
      fecha: new Date().toISOString(),
      leida: false,
      ruta: input.ruta,
      etiquetaAccion: input.etiquetaAccion,
      metadatos: input.metadatos,
    };

    this.items.value = [nueva, ...this.items.value];
    this.guardarEnStorage();
    return nueva;
  }

  marcarComoLeida(id: string): void {
    const item = this.items.value.find((n) => n.id === id);
    if (item && !item.leida) {
      item.leida = true;
      this.guardarEnStorage();
    }
  }

  marcarTodasComoLeidas(): void {
    let huboCambio = false;
    for (const item of this.items.value) {
      if (!item.leida) {
        item.leida = true;
        huboCambio = true;
      }
    }
    if (huboCambio) {
      this.guardarEnStorage();
    }
  }

  eliminarNotificacion(id: string): void {
    this.items.value = this.items.value.filter((n) => n.id !== id);
    this.guardarEnStorage();
  }

  limpiarTodas(): void {
    this.items.value = [];
    this.guardarEnStorage();
  }

  restablecerSemillas(): void {
    this.items.value = [...NOTIFICACIONES_INICIALES];
    this.guardarEnStorage();
  }
}

export const centroNotificacionesService = new CentroNotificacionesService();
