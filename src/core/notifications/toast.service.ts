import { ref } from 'vue';

export type TipoNotificacion = 'exito' | 'error' | 'info' | 'advertencia';

export interface NotificacionToast {
  id: string;
  tipo: TipoNotificacion;
  mensaje: string;
  duracionMs?: number;
}

const notificaciones = ref<NotificacionToast[]>([]);

export const toastService = {
  notificaciones,

  mostrar(mensaje: string, tipo: TipoNotificacion = 'exito', duracionMs: number = 3200) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nuevoToast: NotificacionToast = { id, tipo, mensaje, duracionMs };
    notificaciones.value.push(nuevoToast);

    setTimeout(() => {
      this.remover(id);
    }, duracionMs);
  },

  exito(mensaje: string) {
    this.mostrar(mensaje, 'exito');
  },

  error(mensaje: string) {
    this.mostrar(mensaje, 'error', 4500);
  },

  info(mensaje: string) {
    this.mostrar(mensaje, 'info');
  },

  advertencia(mensaje: string) {
    this.mostrar(mensaje, 'advertencia');
  },

  remover(id: string) {
    const idx = notificaciones.value.findIndex((n) => n.id === id);
    if (idx !== -1) {
      notificaciones.value.splice(idx, 1);
    }
  },
};
