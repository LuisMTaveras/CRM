import { clienteService } from '@/modules/clientes/services/cliente.service';
import { actividadesService } from '@/modules/agenda/services/actividades.service';
import { pipelineService } from '@/modules/pipeline/services/pipeline.service';
import { timelineService } from '@/modules/clientes/services/timeline.service';
import { centroNotificacionesService } from '@/core/notifications/centro-notificaciones.service';
import { toastService } from '@/core/notifications/toast.service';

const CLAVE_STORAGE_USUARIOS = 'crm_directorio_usuarios';

const CLAVE_REINICIO_CERO = 'crm_reinicio_cero_ejecutado_v2';
const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3002/api'}/email`;

export interface ResumenLimpieza {
  clientesEliminados: number;
  tarjetasPipelineEliminadas: number;
  actividadesEliminadas: number;
  eventosTimelineEliminados: number;
  notificacionesEliminadas: number;
  timestamp: string;
}

class LimpiezaDatosService {
  /**
   * Limpia y vacía absolutamente todos los clientes, tableros kanban (tarjetas),
   * actividades de agenda, bitácora y notificaciones para empezar desde cero.
   */
  limpiarTodoParaEmpezarDesdeCero(mostrarNotificacion: boolean = true): ResumenLimpieza {
    const clientesEliminados = clienteService.obtenerCantidadClientes();
    const tarjetasPipelineEliminadas = pipelineService.obtenerCantidadTarjetas();
    const actividadesEliminadas = actividadesService.actividades.value.length;
    const eventosTimelineEliminados = timelineService.eventos.value.length;
    const notificacionesEliminadas = centroNotificacionesService.notificaciones.value.length;

    // 1. Vaciar Clientes y Contactos
    clienteService.vaciarClientes();

    // 2. Vaciar Tarjetas de todos los tableros Kanban
    pipelineService.vaciarTarjetas();

    // 3. Vaciar Agenda y Actividades de seguimiento
    actividadesService.vaciarActividades();

    // 4. Vaciar Bitácora e Historial de Clientes
    timelineService.vaciarTimeline();

    // 5. Vaciar Centro de Notificaciones
    centroNotificacionesService.vaciarNotificaciones();

    // 6. Vaciar directorio de usuarios (al reiniciar solo quedará Luis Taveras)
    try {
      localStorage.removeItem(CLAVE_STORAGE_USUARIOS);
    } catch {
      // fallback silencioso
    }

    // 7. Notificar al servidor de correos para vaciar bandeja en memoria
    try {
      fetch(`${API_BASE_URL}/limpiar-memoria`, { method: 'POST' }).catch(() => {});
    } catch {
      // fallback silencioso
    }

    // Registrar bandera de que el sistema ya fue limpiado a cero
    try {
      localStorage.setItem(CLAVE_REINICIO_CERO, 'v2_cero');
    } catch {
      // fallback
    }

    if (mostrarNotificacion) {
      toastService.exito(
        'Todos los clientes, tableros Kanban, agenda, usuarios y datos fueron eliminados. Solo queda Luis Taveras (Admin).'
      );
    }

    return {
      clientesEliminados,
      tarjetasPipelineEliminadas,
      actividadesEliminadas,
      eventosTimelineEliminados,
      notificacionesEliminadas,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Restablece el catálogo semilla de demostración (100+ clientes, tableros y actividades de prueba)
   */
  restablecerDatosDemo(): void {
    clienteService.restablecerSemilla();
    actividadesService.restablecerSemillas();
    timelineService.restablecerSemillas();
    centroNotificacionesService.restablecerSemillas();

    // Restaurar también la semilla de usuarios (solo Luis Taveras)
    try {
      localStorage.removeItem(CLAVE_STORAGE_USUARIOS);
      localStorage.removeItem(CLAVE_REINICIO_CERO);
      localStorage.removeItem('crm_pipelines_tarjetas');
    } catch {
      // fallback
    }

    toastService.info('Se han cargado los datos de prueba y demostración (100+ clientes B2B).');
  }

  /**
   * Verifica automáticamente al iniciar la app si el usuario solicitó empezar desde 0.
   * Si no se ha aplicado aún en el navegador, ejecuta la limpieza inmediata.
   */
  verificarLimpiezaInicial(): void {
    try {
      const estado = localStorage.getItem(CLAVE_REINICIO_CERO);
      if (estado !== 'v2_cero') {
        this.limpiarTodoParaEmpezarDesdeCero(false);
      }
    } catch {
      // fallback
    }
  }
}

export const limpiezaDatosService = new LimpiezaDatosService();
