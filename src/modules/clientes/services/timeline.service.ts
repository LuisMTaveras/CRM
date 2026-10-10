import { ref, computed } from 'vue';
import type { EventoTimeline, NuevoEventoInput, FiltrosTimeline, TipoEventoTimeline } from '../types/timeline.types';
import { clienteService } from './cliente.service';

const CLAVE_STORAGE = 'crm_cliente_timeline_v1';

const EVENTOS_SEMILLA: EventoTimeline[] = [
  {
    id: 'tl-001',
    clienteId: 'c0010000-0000-4000-8000-000000000001',
    tipo: 'reunion',
    titulo: 'Reunión ejecutiva de levantamiento técnico',
    descripcion: 'Sesión de trabajo con Beatriz García Báez para definir el dimensionamiento de servidores y redundancia.',
    autor: 'Camila Morales',
    fecha: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'tl-002',
    clienteId: 'c0010000-0000-4000-8000-000000000001',
    tipo: 'propuesta',
    titulo: 'Emisión de propuesta comercial formal',
    descripcion: 'Se generó y adjuntó la propuesta Ref AL-PROP-0EF4CF por un monto de RD$ 1,920,000.00 con términos de pago a 30 días.',
    autor: 'Camila Morales',
    fecha: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'tl-003',
    clienteId: 'c0010000-0000-4000-8000-000000000001',
    tipo: 'cambio_etapa',
    titulo: 'Oportunidad promovida a Negociación',
    descripcion: 'La oportunidad "Contrato Marco de Suministro B2B Anual" avanzó de Propuesta Enviada a Negociación.',
    autor: 'Camila Morales',
    fecha: new Date(Date.now() - 86400000 * 2).toISOString(),
    metadatos: { etapaAnterior: 'propuesta', nuevaEtapa: 'negociacion' },
  },
  {
    id: 'tl-004',
    clienteId: 'c0010000-0000-4000-8000-000000000001',
    tipo: 'llamada',
    titulo: 'Llamada telefónica de seguimiento a términos',
    descripcion: 'Beatriz confirmó que el comité técnico aprobó la propuesta y esperan la validación legal.',
    autor: 'Camila Morales',
    fecha: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'tl-005',
    clienteId: 'c0010000-0000-4000-8000-000000000002',
    tipo: 'correo',
    titulo: 'Envío de propuesta económica y especificaciones',
    descripcion: 'Despacho de correo formal con anexos técnicos y certificación de cumplimiento normativo.',
    autor: 'Jean Carlos Peña',
    fecha: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'tl-006',
    clienteId: 'c0010000-0000-4000-8000-000000000002',
    tipo: 'nota',
    titulo: 'Nota interna: Solicitud de descuento adicional',
    descripcion: 'El departamento de compras solicitó un 5% de descuento por pronto pago a 15 días.',
    autor: 'Jean Carlos Peña',
    fecha: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

export class TimelineService {
  private items = ref<EventoTimeline[]>(this.cargarDeStorage());

  constructor() {
    if (this.items.value.length === 0) {
      this.items.value = [...EVENTOS_SEMILLA];
      this.guardarEnStorage();
    }
  }

  private cargarDeStorage(): EventoTimeline[] {
    try {
      const guardado = localStorage.getItem(CLAVE_STORAGE);
      if (guardado) {
        const parsed = JSON.parse(guardado);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return [];
  }

  private guardarEnStorage(): void {
    try {
      localStorage.setItem(CLAVE_STORAGE, JSON.stringify(this.items.value));
    } catch {
      // fallback
    }
  }

  get eventos() {
    return computed(() => this.items.value);
  }

  /**
   * Obtiene la bitácora cronológica de un cliente específico, ordenada del más reciente al más antiguo
   */
  obtenerTimelinePorCliente(clienteId: string, filtros?: FiltrosTimeline): EventoTimeline[] {
    let list = this.items.value.filter((e) => e.clienteId === clienteId);

    if (filtros?.tipo && filtros.tipo !== 'todos') {
      list = list.filter((e) => e.tipo === filtros.tipo);
    }

    if (filtros?.busqueda && filtros.busqueda.trim() !== '') {
      const q = filtros.busqueda.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.titulo.toLowerCase().includes(q) ||
          e.descripcion.toLowerCase().includes(q) ||
          e.autor.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }

  /**
   * Registra un nuevo evento en el timeline del cliente y actualiza el último contacto
   */
  registrarEvento(input: NuevoEventoInput): EventoTimeline {
    const nuevo: EventoTimeline = {
      id: `tl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      clienteId: input.clienteId,
      tipo: input.tipo,
      titulo: input.titulo.trim(),
      descripcion: input.descripcion.trim(),
      autor: input.autor.trim() || 'Ejecutivo Comercial',
      fecha: input.fecha || new Date().toISOString(),
      metadatos: input.metadatos,
    };

    this.items.value.unshift(nuevo);
    this.guardarEnStorage();

    // Actualizar último contacto del cliente en el catálogo
    try {
      clienteService.actualizarCliente(input.clienteId, {
        ultimo_contacto: nuevo.fecha,
      });
    } catch {
      // ignorar si no se encuentra
    }

    return nuevo;
  }

  /**
   * Registra una nota rápida o registro de interacción con una empresa
   */
  registrarNotaRapida(
    clienteId: string,
    tipo: TipoEventoTimeline,
    titulo: string,
    descripcion: string,
    autor = 'Camila Morales'
  ): EventoTimeline {
    return this.registrarEvento({
      clienteId,
      tipo,
      titulo,
      descripcion,
      autor,
    });
  }

  /**
   * Registra automáticamente el cambio de etapa en el pipeline
   */
  registrarCambioEtapa(
    clienteId: string,
    oportunidadTitulo: string,
    etapaAnterior: string,
    nuevaEtapa: string,
    autor = 'Sistema'
  ): EventoTimeline {
    return this.registrarEvento({
      clienteId,
      tipo: 'cambio_etapa',
      titulo: `Oportunidad movida a "${nuevaEtapa}"`,
      descripcion: `La oportunidad "${oportunidadTitulo}" avanzó de ${etapaAnterior} a ${nuevaEtapa}.`,
      autor,
      metadatos: { etapaAnterior, nuevaEtapa },
    });
  }

  /**
   * Registra automáticamente el envío de correo o propuesta formal
   */
  registrarEnvioDocumento(
    clienteId: string,
    tipoDoc: string,
    referencia: string,
    destinatario: string,
    autor = 'Camila Morales'
  ): EventoTimeline {
    return this.registrarEvento({
      clienteId,
      tipo: 'propuesta',
      titulo: `${tipoDoc} enviada a ${destinatario}`,
      descripcion: `Se despachó el documento con referencia ${referencia} al cliente.`,
      autor,
      metadatos: { referencia, destinatario },
    });
  }

  /**
   * Elimina un evento de la bitácora
   */
  eliminarEvento(id: string): boolean {
    const antes = this.items.value.length;
    this.items.value = this.items.value.filter((e) => e.id !== id);
    const eliminado = this.items.value.length < antes;
    if (eliminado) {
      this.guardarEnStorage();
    }
    return eliminado;
  }

  /**
   * Restablece los eventos a las semillas iniciales
   */
  restablecerSemillas(): void {
    this.items.value = [...EVENTOS_SEMILLA];
    this.guardarEnStorage();
  }
}

export const timelineService = new TimelineService();
