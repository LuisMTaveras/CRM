import { ref, computed } from 'vue';
import { centroNotificacionesService } from '@/core/notifications/centro-notificaciones.service';
import { notificacionesNativasService } from '@/core/notifications/notificaciones-nativas.service';
import { toastService } from '@/core/notifications/toast.service';
import { formatDate } from '@/core/formatters/formatters';
import { API_BASE_URL } from '@/core/api/api-config';
import type {
  ActividadSeguimiento,
  NuevaActividadInput,
  ActualizarActividadInput,
  FiltrosActividades,
  MetricasAgenda,
  DiagnosticoEstancamiento,
} from '../types/actividad.types';

const CLAVE_STORAGE = 'crm_agenda_actividades_v1';
const USAR_BACKEND =
  import.meta.env.MODE === 'production' || import.meta.env.VITE_USE_MOCK === 'false';

// Semillas realistas adaptadas al tejido empresarial B2B dominicano
const ACTIVIDADES_SEMILLA: ActividadSeguimiento[] = [
  {
    id: 'act-001',
    clienteId: 'c0010000-0000-4000-8000-000000000001',
    clienteNombre: 'IQtek Solutions',
    clienteSector: 'Tecnología',
    tarjetaId: 'op-001-1',
    pipelineId: 'pipeline-comercial',
    titulo: 'Llamada de seguimiento a propuesta de infraestructura híbrida',
    descripcion: 'Verificar con Beatriz García Báez la revisión técnica del dimensionamiento de servidores.',
    tipo: 'llamada',
    prioridad: 'alta',
    estado: 'pendiente',
    // Programada para hoy a las 15:30
    fechaLimite: new Date(new Date().setHours(15, 30, 0, 0)).toISOString(),
    responsable: 'Camila Morales',
    creadoEn: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'act-002',
    clienteId: 'c0010000-0000-4000-8000-000000000002',
    clienteNombre: 'Banco BHD León',
    clienteSector: 'Banca y Finanzas',
    titulo: 'Reunión de alineación con equipo de compras y seguridad de datos',
    descripcion: 'Presentar certificación SOC-2 y validar términos de SLA en sala ejecutiva de Torre BHD.',
    tipo: 'reunion',
    prioridad: 'alta',
    estado: 'pendiente',
    // Vencida: programada para hace 2 días
    fechaLimite: new Date(Date.now() - 86400000 * 2).toISOString(),
    responsable: 'Jean Carlos Peña',
    creadoEn: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'act-003',
    clienteId: 'c0010000-0000-4000-8000-000000000003',
    clienteNombre: 'Cervecería Nacional Dominicana',
    clienteSector: 'Consumo Masivo',
    titulo: 'Videollamada de demostración CPQ y cotizador multimoneda',
    descripcion: 'Sesión por Google Meet con gerencia de adquisiciones para walkthrough de cotizaciones en tiempo real.',
    tipo: 'videollamada',
    prioridad: 'media',
    estado: 'pendiente',
    // Para mañana
    fechaLimite: new Date(Date.now() + 86400000 * 1).toISOString(),
    responsable: 'Camila Morales',
    creadoEn: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'act-004',
    clienteId: 'c0010000-0000-4000-8000-000000000004',
    clienteNombre: 'Grupo Ramos',
    clienteSector: 'Retail',
    titulo: 'Despacho formal de propuesta económica sellada y RNC',
    descripcion: 'Enviar correo con propuesta PDF Ref AL-PROP-2026 y validar acuse de recibo de tesorería.',
    tipo: 'propuesta',
    prioridad: 'media',
    estado: 'pendiente',
    // Para dentro de 3 días
    fechaLimite: new Date(Date.now() + 86400000 * 3).toISOString(),
    responsable: 'Jean Carlos Peña',
    creadoEn: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'act-005',
    clienteId: 'c0010000-0000-4000-8000-000000000005',
    clienteNombre: 'Grupo SID',
    clienteSector: 'Industria',
    titulo: 'Visita de relevamiento técnico en planta industrial Haina',
    descripcion: 'Inspección de puntos de red y terminales de inventario.',
    tipo: 'reunion',
    prioridad: 'baja',
    estado: 'completada',
    fechaLimite: new Date(Date.now() - 86400000 * 3).toISOString(),
    responsable: 'Camila Morales',
    creadoEn: new Date(Date.now() - 86400000 * 6).toISOString(),
    completadoEn: new Date(Date.now() - 86400000 * 3).toISOString(),
    resultadoNotas: 'Inspección completada con éxito. Se validaron 14 puntos de red con el Ing. Almonte.',
  },
];

export class ActividadesService {
  private items = ref<ActividadSeguimiento[]>(this.cargarDeStorage());
  private vigilanteTimer: ReturnType<typeof setInterval> | null = null;
  private alertasDisparadas = new Set<string>();

  constructor() {
    if (USAR_BACKEND) {
      void this.recargar();
    } else {
      if (this.items.value.length === 0 && localStorage.getItem(CLAVE_STORAGE) === null) {
        this.items.value = [...ACTIVIDADES_SEMILLA];
        this.guardarEnStorage();
      }
      // Sincronizar alertas iniciales
      this.sincronizarConCentroNotificaciones();
    }
  }

  private async solicitar<T>(ruta: string, init?: RequestInit): Promise<T> {
    const respuesta = await fetch(`${API_BASE_URL}/actividades${ruta}`, init);
    const data = await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
      throw new Error(
        (data && typeof data.error === 'string' && data.error) ||
          `No se pudo sincronizar la agenda (${respuesta.status}).`
      );
    }

    return data as T;
  }

  private opcionesJson(method: string, body?: unknown): RequestInit {
    return {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    };
  }

  /**
   * Recarga las actividades desde el backend y refresca las alertas.
   */
  async recargar(): Promise<void> {
    if (!USAR_BACKEND) return;

    try {
      const data = await this.solicitar<{ ok: boolean; datos: ActividadSeguimiento[] }>('?paginar=false');
      this.items.value = Array.isArray(data.datos) ? data.datos : [];
      this.guardarEnStorage();
      this.sincronizarConCentroNotificaciones();
    } catch {
      // Sin conexion: se conserva la ultima copia en memoria.
    }
  }

  private sincronizarEscritura(crearPeticion: () => Promise<unknown>, alFallar?: () => void): void {
    if (!USAR_BACKEND) return;

    void crearPeticion().catch((error: unknown) => {
      toastService.error(error instanceof Error ? error.message : 'No se pudo sincronizar la agenda.');
      alFallar?.();
      void this.recargar();
    });
  }

  private cargarDeStorage(): ActividadSeguimiento[] {
    if (USAR_BACKEND) return [];

    try {
      const guardado = localStorage.getItem(CLAVE_STORAGE);
      if (guardado !== null) {
        const parsed = JSON.parse(guardado);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Fallback si falla almacenamiento local
    }
    return [];
  }

  vaciarActividades(): void {
    this.items.value = [];
    this.guardarEnStorage();
    this.sincronizarEscritura(() => this.solicitar('', { method: 'DELETE' }));
    this.sincronizarConCentroNotificaciones();
  }

  private guardarEnStorage(): void {
    try {
      localStorage.setItem(CLAVE_STORAGE, JSON.stringify(this.items.value));
    } catch {
      // Fallback
    }
  }

  get actividades() {
    return computed(() => this.items.value);
  }

  /**
   * Obtiene la lista filtrada de actividades
   */
  obtenerActividades(filtros?: FiltrosActividades): ActividadSeguimiento[] {
    let lista = [...this.items.value];
    const ahora = new Date();
    const hoyInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();
    const hoyFin = hoyInicio + 86400000;
    const inicioSemana = hoyInicio - (ahora.getDay() === 0 ? 6 : ahora.getDay() - 1) * 86400000;
    const finSemana = inicioSemana + 7 * 86400000;

    if (filtros?.rango) {
      switch (filtros.rango) {
        case 'hoy':
          lista = lista.filter((a) => {
            if (a.estado === 'completada' || a.estado === 'cancelada') return false;
            const t = new Date(a.fechaLimite).getTime();
            return t >= hoyInicio && t < hoyFin;
          });
          break;
        case 'vencidas':
          lista = lista.filter((a) => {
            if (a.estado === 'completada' || a.estado === 'cancelada') return false;
            const t = new Date(a.fechaLimite).getTime();
            return t < hoyInicio; // o menor que ahora
          });
          break;
        case 'esta_semana':
          lista = lista.filter((a) => {
            if (a.estado === 'completada' || a.estado === 'cancelada') return false;
            const t = new Date(a.fechaLimite).getTime();
            return t >= hoyInicio && t < finSemana;
          });
          break;
        case 'completadas':
          lista = lista.filter((a) => a.estado === 'completada');
          break;
      }
    }

    if (filtros?.tipo) {
      lista = lista.filter((a) => a.tipo === filtros.tipo);
    }

    if (filtros?.prioridad) {
      lista = lista.filter((a) => a.prioridad === filtros.prioridad);
    }

    if (filtros?.responsable && filtros.responsable !== '') {
      lista = lista.filter((a) => a.responsable.toLowerCase() === filtros.responsable?.toLowerCase());
    }

    if (filtros?.clienteId && filtros.clienteId !== '') {
      lista = lista.filter((a) => a.clienteId === filtros.clienteId);
    }

    if (filtros?.busqueda && filtros.busqueda.trim() !== '') {
      const q = filtros.busqueda.toLowerCase().trim();
      lista = lista.filter(
        (a) =>
          a.titulo.toLowerCase().includes(q) ||
          a.clienteNombre.toLowerCase().includes(q) ||
          (a.descripcion && a.descripcion.toLowerCase().includes(q))
      );
    }

    // Ordenar: primero pendientes por fecha límite ascendente, completadas al final
    return lista.sort((a, b) => {
      if (a.estado === 'completada' && b.estado !== 'completada') return 1;
      if (a.estado !== 'completada' && b.estado === 'completada') return -1;
      return new Date(a.fechaLimite).getTime() - new Date(b.fechaLimite).getTime();
    });
  }

  obtenerActividadPorId(id: string): ActividadSeguimiento | undefined {
    return this.items.value.find((a) => a.id === id);
  }

  /**
   * Registra una nueva actividad comercial o tarea de seguimiento
   */
  crearActividad(input: NuevaActividadInput): ActividadSeguimiento {
    const nueva: ActividadSeguimiento = {
      id: `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      clienteId: input.clienteId,
      clienteNombre: input.clienteNombre.trim(),
      clienteSector: input.clienteSector,
      tarjetaId: input.tarjetaId,
      pipelineId: input.pipelineId,
      titulo: input.titulo.trim(),
      descripcion: input.descripcion?.trim(),
      tipo: input.tipo,
      prioridad: input.prioridad,
      estado: 'pendiente',
      fechaLimite: input.fechaLimite,
      responsable: input.responsable.trim(),
      creadoEn: new Date().toISOString(),
    };

    this.items.value.unshift(nueva);
    this.guardarEnStorage();

    this.sincronizarEscritura(
      () => this.solicitar('', this.opcionesJson('POST', nueva)),
      () => {
        this.items.value = this.items.value.filter((actividad) => actividad.id !== nueva.id);
      }
    );

    // Sincronizar inmediatamente alerta si corresponde
    this.sincronizarConCentroNotificaciones();

    return nueva;
  }

  /**
   * Actualiza los datos de una actividad existente
   */
  actualizarActividad(id: string, input: ActualizarActividadInput): ActividadSeguimiento {
    const idx = this.items.value.findIndex((a) => a.id === id);
    if (idx === -1) {
      throw new Error(`Actividad con identificador ${id} no encontrada`);
    }

    const actual = this.items.value[idx];
    const actualizada: ActividadSeguimiento = {
      ...actual,
      ...input,
      actualizadoEn: new Date().toISOString(),
    };

    this.items.value[idx] = actualizada;
    this.guardarEnStorage();
    this.sincronizarEscritura(() =>
      this.solicitar(`/${encodeURIComponent(id)}`, this.opcionesJson('PATCH', input))
    );
    this.sincronizarConCentroNotificaciones();
    return actualizada;
  }

  /**
   * Marca una actividad como completada con resultado opcional
   */
  marcarCompletada(id: string, resultadoNotas?: string): ActividadSeguimiento {
    const idx = this.items.value.findIndex((a) => a.id === id);
    if (idx === -1) {
      throw new Error(`Actividad con identificador ${id} no encontrada`);
    }

    const actual = this.items.value[idx];
    const completada: ActividadSeguimiento = {
      ...actual,
      estado: 'completada',
      resultadoNotas: resultadoNotas !== undefined ? resultadoNotas.trim() : actual.resultadoNotas,
      completadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
    };

    this.items.value[idx] = completada;
    this.guardarEnStorage();
    this.sincronizarEscritura(() =>
      this.solicitar(
        `/${encodeURIComponent(id)}`,
        this.opcionesJson('PATCH', {
          estado: 'completada',
          resultadoNotas: completada.resultadoNotas,
          completadoEn: completada.completadoEn,
        })
      )
    );

    // Emitir confirmación en centro de notificaciones
    centroNotificacionesService.agregarNotificacion({
      tipo: 'seguimiento',
      titulo: 'Actividad Completada',
      mensaje: `"${completada.titulo}" con ${completada.clienteNombre} fue marcada como realizada.`,
      prioridad: 'baja',
      ruta: '/agenda',
      etiquetaAccion: 'Ver Agenda',
    });

    return completada;
  }

  /**
   * Elimina una actividad del registro
   */
  eliminarActividad(id: string): boolean {
    const longitudPrevia = this.items.value.length;
    this.items.value = this.items.value.filter((a) => a.id !== id);
    const eliminada = this.items.value.length < longitudPrevia;
    if (eliminada) {
      this.guardarEnStorage();
      this.sincronizarEscritura(() =>
        this.solicitar(`/${encodeURIComponent(id)}`, { method: 'DELETE' })
      );
    }
    return eliminada;
  }

  /**
   * Métricas y KPIs de la agenda
   */
  obtenerMetricas(): MetricasAgenda {
    const todas = this.items.value;
    const ahora = new Date();
    const hoyInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();
    const hoyFin = hoyInicio + 86400000;
    const inicioSemana = hoyInicio - (ahora.getDay() === 0 ? 6 : ahora.getDay() - 1) * 86400000;
    const finSemana = inicioSemana + 7 * 86400000;

    let pendientesHoy = 0;
    let vencidas = 0;
    let estaSemana = 0;
    let completadas = 0;

    todas.forEach((act) => {
      if (act.estado === 'completada') {
        completadas++;
        return;
      }
      if (act.estado === 'cancelada') return;

      const tiempoLimite = new Date(act.fechaLimite).getTime();
      if (tiempoLimite < hoyInicio) {
        vencidas++;
      } else if (tiempoLimite >= hoyInicio && tiempoLimite < hoyFin) {
        pendientesHoy++;
      } else if (tiempoLimite >= hoyFin && tiempoLimite < finSemana) {
        estaSemana++;
      }
    });

    const totalPendientesYCompletadas = pendientesHoy + vencidas + estaSemana + completadas;
    const porcentajeCumplimiento =
      totalPendientesYCompletadas > 0
        ? Math.round((completadas / totalPendientesYCompletadas) * 100)
        : 100;

    return {
      total: todas.length,
      pendientesHoy,
      vencidas,
      estaSemana,
      completadas,
      porcentajeCumplimiento,
    };
  }

  /**
   * Sincroniza actividades con el Centro de Notificaciones y emite avisos proactivos:
   * Genera alertas automáticas para actividades vencidas, tareas inminentes (< 30 min) y de hoy.
   */
  sincronizarConCentroNotificaciones(dispararAvisosNativos: boolean = false): { vencidas: number; hoy: number } {
    const ahora = new Date();
    const ahoraMs = ahora.getTime();
    const hoyInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();
    const hoyFin = hoyInicio + 86400000;
    const notificacionesActuales = centroNotificacionesService.notificaciones.value;

    let vencidasDisparadas = 0;
    let hoyDisparadas = 0;

    this.items.value.forEach((act) => {
      if (act.estado === 'completada' || act.estado === 'cancelada') return;

      const tiempoLimite = new Date(act.fechaLimite).getTime();
      const yaExisteNotif = notificacionesActuales.some(
        (n) => n.metadatos?.actividadId === act.id
      );

      // Alerta para actividades vencidas
      if (tiempoLimite < hoyInicio) {
        if (!yaExisteNotif) {
          centroNotificacionesService.agregarNotificacion({
            tipo: 'tarea',
            titulo: `Tarea Vencida: ${act.titulo}`,
            mensaje: `Compromiso pendiente con ${act.clienteNombre}. Fecha límite: ${formatDate(act.fechaLimite, 'datetime')}.`,
            prioridad: 'alta',
            ruta: '/agenda',
            etiquetaAccion: 'Abrir Agenda',
            metadatos: { actividadId: act.id, estado: 'vencida' },
          });
          vencidasDisparadas++;
        }

        // Si se solicitó disparo de avisos nativos y aún no se ha alertado en esta sesión
        if (dispararAvisosNativos && !this.alertasDisparadas.has(`vencida-${act.id}`)) {
          this.alertasDisparadas.add(`vencida-${act.id}`);
          toastService.advertencia(`⚠️ Tarea Vencida: ${act.titulo}`);
          notificacionesNativasService.notificar(`Tarea Vencida: ${act.titulo}`, {
            cuerpo: `Compromiso pendiente con ${act.clienteNombre}.`,
            ruta: '/agenda',
            tipoSonido: 'urgente',
            tag: `tarea-vencida-${act.id}`,
          });
        }
      }
      // Alerta para actividades inminentes (dentro de los próximos 30 minutos)
      else if (tiempoLimite >= ahoraMs && tiempoLimite <= ahoraMs + 30 * 60 * 1000) {
        const minutosFaltantes = Math.max(1, Math.round((tiempoLimite - ahoraMs) / 60000));

        if (!yaExisteNotif) {
          centroNotificacionesService.agregarNotificacion({
            tipo: 'tarea',
            titulo: `Tarea Próxima (${minutosFaltantes} min): ${act.titulo}`,
            mensaje: `Programada con ${act.clienteNombre} a las ${new Date(act.fechaLimite).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}.`,
            prioridad: 'alta',
            ruta: '/agenda',
            etiquetaAccion: 'Abrir Agenda',
            metadatos: { actividadId: act.id, estado: 'inminente' },
          });
          hoyDisparadas++;
        }

        if (dispararAvisosNativos && !this.alertasDisparadas.has(`inminente-${act.id}`)) {
          this.alertasDisparadas.add(`inminente-${act.id}`);
          toastService.info(`⏰ Tarea en ${minutosFaltantes} min: ${act.titulo}`);
          notificacionesNativasService.notificar(`Tarea en ${minutosFaltantes} min: ${act.titulo}`, {
            cuerpo: `Compromiso con ${act.clienteNombre} a las ${new Date(act.fechaLimite).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}`,
            ruta: '/agenda',
            tipoSonido: 'tarea',
            tag: `tarea-inminente-${act.id}`,
          });
        }
      }
      // Alerta para actividades del día de hoy
      else if (tiempoLimite >= hoyInicio && tiempoLimite < hoyFin) {
        if (!yaExisteNotif) {
          centroNotificacionesService.agregarNotificacion({
            tipo: 'tarea',
            titulo: `Tarea para Hoy: ${act.titulo}`,
            mensaje: `Programada con ${act.clienteNombre} a las ${new Date(act.fechaLimite).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}.`,
            prioridad: 'media',
            ruta: '/agenda',
            etiquetaAccion: 'Abrir Agenda',
            metadatos: { actividadId: act.id, estado: 'hoy' },
          });
          hoyDisparadas++;
        }
      }
    });

    return { vencidas: vencidasDisparadas, hoy: hoyDisparadas };
  }

  /**
   * Inicia el vigilante periódico de la agenda para comprobar compromisos en segundo plano
   */
  iniciarVigilanteAgenda(intervaloMs: number = 60000): void {
    if (this.vigilanteTimer) return;
    this.sincronizarConCentroNotificaciones(false);
    this.vigilanteTimer = setInterval(() => {
      this.sincronizarConCentroNotificaciones(true);
    }, intervaloMs);
  }

  /**
   * Detiene el vigilante periódico de la agenda
   */
  detenerVigilanteAgenda(): void {
    if (this.vigilanteTimer) {
      clearInterval(this.vigilanteTimer);
      this.vigilanteTimer = null;
    }
  }

  /**
   * Detector de Clientes Estancados en el Kanban / Pipeline:
   * Evalúa si una oportunidad o cliente supera los 10 días sin interacción comercial
   */
  esClienteEstancado(
    tarjeta?: { id?: string; creado_en?: string; fecha_objetivo?: string },
    cliente?: { id?: string; ultimo_contacto?: string; creado_en?: string },
    diasUmbral: number = 10
  ): DiagnosticoEstancamiento {
    const ahoraMs = Date.now();

    // Buscar si hay actividades recientes registradas para este cliente o tarjeta
    const actividadesVinculadas = this.items.value.filter(
      (a) =>
        (cliente?.id && a.clienteId === cliente.id) ||
        (tarjeta?.id && a.tarjetaId === tarjeta.id)
    );

    let fechaReferenciaIso = cliente?.ultimo_contacto || tarjeta?.creado_en || cliente?.creado_en || '';

    // Si hay actividades completadas o actualizadas, buscar la más reciente
    actividadesVinculadas.forEach((a) => {
      const fechaAct = a.completadoEn || a.actualizadoEn || a.creadoEn;
      if (!fechaReferenciaIso || new Date(fechaAct).getTime() > new Date(fechaReferenciaIso).getTime()) {
        fechaReferenciaIso = fechaAct;
      }
    });

    if (!fechaReferenciaIso) {
      return {
        estancado: false,
        diasSinContacto: 0,
        fechaReferencia: new Date().toISOString(),
        motivo: 'Sin registro previo',
      };
    }

    const fechaRefMs = new Date(fechaReferenciaIso).getTime();
    if (isNaN(fechaRefMs)) {
      return {
        estancado: false,
        diasSinContacto: 0,
        fechaReferencia: new Date().toISOString(),
        motivo: 'Fecha inválida',
      };
    }

    const diffDias = Math.floor((ahoraMs - fechaRefMs) / 86400000);

    if (diffDias >= diasUmbral) {
      return {
        estancado: true,
        diasSinContacto: diffDias,
        fechaReferencia: fechaReferenciaIso,
        motivo: `Lleva ${diffDias} días sin interacción registrada (umbral > ${diasUmbral} días).`,
      };
    }

    return {
      estancado: false,
      diasSinContacto: Math.max(0, diffDias),
      fechaReferencia: fechaReferenciaIso,
      motivo: `Último contacto hace ${diffDias} días.`,
    };
  }

  /**
   * Restablece las actividades a las semillas originales de demostración
   */
  restablecerSemillas(): void {
    if (USAR_BACKEND) {
      void this.recargar();
      return;
    }
    this.items.value = [...ACTIVIDADES_SEMILLA];
    this.guardarEnStorage();
    this.sincronizarConCentroNotificaciones();
  }
}

export const actividadesService = new ActividadesService();
