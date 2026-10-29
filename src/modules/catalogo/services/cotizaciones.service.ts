import { ref } from 'vue';
import type { Cotizacion, EstadoCotizacion } from '../types/catalogo.types';
import { timelineService } from '@/modules/clientes/services/timeline.service';
import { toastService } from '@/core/notifications/toast.service';
import { formatCurrency } from '@/core/formatters/formatters';
import { API_BASE_URL } from '@/core/api/api-config';

const CLAVE_STORAGE = 'crm_cotizaciones_v1';
const USAR_BACKEND =
  import.meta.env.MODE === 'production' || import.meta.env.VITE_USE_MOCK === 'false';

export const COTIZACIONES_USAN_BACKEND = USAR_BACKEND;

const COTIZACIONES_SEMILLA: Cotizacion[] = [
  {
    id: 'cot-001',
    numero_cotizacion: 'COT-2026-0041',
    cliente_id: 'c0010000-0000-4000-8000-000000000001',
    cliente_nombre: 'Banco BHD León',
    cliente_rnc: '101001234',
    cliente_telefono: '+1 (809) 243-3232',
    cliente_email: 'bgarcia@bhdleon.com.do',
    contacto_nombre: 'Lic. Beatriz García Báez',
    fecha_emision: '2026-10-15',
    fecha_vencimiento: '2026-11-15',
    estado: 'enviada',
    items: [
      {
        id: 'item-1',
        sku: 'CRM-CLOUD-ENT',
        descripcion: 'Suscripción CRM Cloud Enterprise (Plan Anual Dedicado)',
        cantidad: 12,
        precio_unitario: 45000,
        descuento_porcentaje: 5,
        itbis_aplica: true,
        monto_itbis: 92340,
        total_linea: 605340,
      },
      {
        id: 'item-2',
        sku: 'IMP-ONBOARD-PRO',
        descripcion: 'Implementación & Onboarding Personalizado con Migración',
        cantidad: 1,
        precio_unitario: 120000,
        descuento_porcentaje: 0,
        itbis_aplica: true,
        monto_itbis: 21600,
        total_linea: 141600,
      },
    ],
    subtotal: 660000,
    descuento_porcentaje: 4.09,
    descuento_monto: 27000,
    itbis_total: 113940,
    total: 746940,
    moneda: 'DOP',
    notas: 'Incluye soporte prioritario 24/7 y 4 sesiones de capacitación para el equipo de ventas.',
    terminos_condiciones: 'Validez de la oferta: 30 días calendario. Forma de pago: 50% al iniciar y 50% al entregar.',
    token_aprobacion: 'tok_bhd_2026_98a7f1',
    creado_en: '2026-10-15T14:30:00Z',
  },
  {
    id: 'cot-002',
    numero_cotizacion: 'COT-2026-0042',
    cliente_id: 'c0010000-0000-4000-8000-000000000002',
    cliente_nombre: 'Cervecería Nacional Dominicana',
    cliente_rnc: '101004567',
    cliente_telefono: '+1 (809) 487-2000',
    cliente_email: 'rh@cnd.com.do',
    contacto_nombre: 'Ing. Alejandro Peña',
    fecha_emision: '2026-10-18',
    fecha_vencimiento: '2026-11-18',
    estado: 'aprobada',
    items: [
      {
        id: 'item-3',
        sku: 'INT-ERP-DGII',
        descripcion: 'Módulo de Integración Fiscal DGII & Conector ERP SAP',
        cantidad: 1,
        precio_unitario: 85000,
        descuento_porcentaje: 0,
        itbis_aplica: true,
        monto_itbis: 15300,
        total_linea: 100300,
      },
    ],
    subtotal: 85000,
    descuento_porcentaje: 0,
    descuento_monto: 0,
    itbis_total: 15300,
    total: 100300,
    moneda: 'DOP',
    notas: 'Entrega en 3 sprints de 10 días laborables.',
    terminos_condiciones: 'Garantía técnica de 12 meses sobre el código implementado.',
    token_aprobacion: 'tok_cnd_2026_44b2c8',
    aprobado_en: '2026-10-20T11:22:00Z',
    aprobado_por_nombre: 'Alejandro Peña',
    aprobado_por_cargo: 'Director de TI',
    creado_en: '2026-10-18T09:15:00Z',
  },
];

class CotizacionesService {
  private memoria = ref<Cotizacion[]>(this.cargarInicial());
  private hidratacionEnCurso: Promise<void> | null = null;
  private hidratacionSolicitada = false;

  constructor() {
    if (USAR_BACKEND) void this.recargar();
  }

  private async solicitar<T>(ruta: string, init?: RequestInit): Promise<T> {
    const respuesta = await fetch(`${API_BASE_URL}/cotizaciones${ruta}`, init);
    const data = await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
      throw new Error(
        (data && typeof data.error === 'string' && data.error) ||
          `No se pudo sincronizar la cotizacion (${respuesta.status}).`
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

  private asegurarHidratacion(): void {
    if (!USAR_BACKEND || this.hidratacionSolicitada) return;
    this.hidratacionSolicitada = true;
    void this.recargar();
  }

  async recargar(): Promise<void> {
    if (!USAR_BACKEND) return;
    if (this.hidratacionEnCurso) return this.hidratacionEnCurso;

    this.hidratacionEnCurso = (async () => {
      try {
        const data = await this.solicitar<{ ok: boolean; datos: Cotizacion[] }>('');
        this.memoria.value = Array.isArray(data.datos) ? data.datos : [];
      } catch {
        // Sin conexion: conservamos la ultima copia disponible.
      } finally {
        this.hidratacionEnCurso = null;
        this.hidratacionSolicitada = true;
      }
    })();

    return this.hidratacionEnCurso;
  }

  private cargarInicial(): Cotizacion[] {
    if (USAR_BACKEND) return [];

    try {
      const guardado = localStorage.getItem(CLAVE_STORAGE);
      if (guardado) {
        const parsed = JSON.parse(guardado);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return [...COTIZACIONES_SEMILLA];
  }

  private persistir(): void {
    if (USAR_BACKEND) return;
    try {
      localStorage.setItem(CLAVE_STORAGE, JSON.stringify(this.memoria.value));
    } catch {
      // fallback
    }
  }

  obtenerTodas(): Cotizacion[] {
    this.asegurarHidratacion();
    return this.memoria.value;
  }

  obtenerPorId(id: string): Cotizacion | undefined {
    return this.memoria.value.find((c) => c.id === id);
  }

  obtenerPorToken(token: string): Cotizacion | undefined {
    return this.memoria.value.find((c) => c.token_aprobacion === token);
  }

  async obtenerPorTokenRemoto(token: string): Promise<Cotizacion | null> {
    if (!USAR_BACKEND) return this.obtenerPorToken(token) || null;

    try {
      const cotizacion = await this.solicitar<Cotizacion>(`/publicas/${encodeURIComponent(token)}`);
      const indice = this.memoria.value.findIndex((item) => item.id === cotizacion.id);
      if (indice !== -1) this.memoria.value[indice] = cotizacion;
      else this.memoria.value.push(cotizacion);
      return cotizacion;
    } catch {
      return null;
    }
  }

  obtenerPorCliente(clienteId: string): Cotizacion[] {
    return this.memoria.value.filter((c) => c.cliente_id === clienteId);
  }

  generarToken(): string {
    const uuid = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '')
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
    return `tok_${uuid.slice(0, 20)}`;
  }

  generarNumero(): string {
    const anio = new Date().getFullYear();
    const maximo = this.memoria.value.reduce((mayor, cotizacion) => {
      const coincidencia = new RegExp(`^COT-${anio}-(\\d+)$`, 'i').exec(cotizacion.numero_cotizacion || '');
      if (!coincidencia) return mayor;
      return Math.max(mayor, Number.parseInt(coincidencia[1], 10) || 0);
    }, 42);
    return `COT-${anio}-${String(maximo + 1).padStart(4, '0')}`;
  }

  private sincronizarGuardado(cotizacion: Cotizacion): void {
    if (!USAR_BACKEND) return;

    void this.solicitar<Cotizacion>('', this.opcionesJson('POST', cotizacion))
      .then((guardada) => {
        const indice = this.memoria.value.findIndex((item) => item.id === cotizacion.id);
        if (indice !== -1) this.memoria.value[indice] = guardada;
      })
      .catch((error: unknown) => {
        toastService.error(error instanceof Error ? error.message : 'No se pudo guardar la cotizacion.');
        void this.recargar();
      });
  }

  guardar(cotizacion: Omit<Cotizacion, 'id' | 'numero_cotizacion' | 'token_aprobacion' | 'creado_en'> & { id?: string }): Cotizacion {
    if (cotizacion.id) {
      const idx = this.memoria.value.findIndex((c) => c.id === cotizacion.id);
      if (idx !== -1) {
        this.memoria.value[idx] = {
          ...this.memoria.value[idx],
          ...cotizacion,
        } as Cotizacion;
        this.persistir();
        this.sincronizarGuardado(this.memoria.value[idx]);
        return this.memoria.value[idx];
      }
    }

    const nueva: Cotizacion = {
      ...cotizacion,
      id: `cot-${Date.now()}`,
      numero_cotizacion: this.generarNumero(),
      token_aprobacion: this.generarToken(),
      creado_en: new Date().toISOString(),
    };

    this.memoria.value.unshift(nueva);
    this.persistir();
    this.sincronizarGuardado(nueva);

    // Registrar en el timeline del cliente
    timelineService.registrarEvento({
      clienteId: nueva.cliente_id,
      tipo: 'propuesta',
      titulo: `Propuesta Comercial emitida (${nueva.numero_cotizacion})`,
      descripcion: `Monto cotizado: ${formatCurrency(nueva.total, { currency: nueva.moneda })} para ${nueva.cliente_nombre}. Token de portal: ${nueva.token_aprobacion}`,
      autor: 'Equipo Comercial',
    });

    return nueva;
  }

  actualizarEstado(id: string, nuevoEstado: EstadoCotizacion): boolean {
    const cot = this.obtenerPorId(id);
    if (!cot) return false;
    cot.estado = nuevoEstado;
    this.persistir();

    if (USAR_BACKEND) {
      void this.solicitar<Cotizacion>(
        `/${encodeURIComponent(id)}/estado`,
        this.opcionesJson('PATCH', { estado: nuevoEstado })
      )
        .then((actualizada) => {
          const indice = this.memoria.value.findIndex((item) => item.id === id);
          if (indice !== -1) this.memoria.value[indice] = actualizada;
        })
        .catch((error: unknown) => {
          toastService.error(error instanceof Error ? error.message : 'No se pudo actualizar la cotizacion.');
          void this.recargar();
        });
    }

    return true;
  }

  async aprobarPropuestaRemota(
    token: string,
    firmante: { nombre: string; cargo: string }
  ): Promise<Cotizacion> {
    if (!USAR_BACKEND) return this.aprobarPropuestaPorCliente(token, firmante);

    const actualizada = await this.solicitar<Cotizacion>(
      `/publicas/${encodeURIComponent(token)}/aprobar`,
      this.opcionesJson('POST', firmante)
    );
    const indice = this.memoria.value.findIndex((item) => item.id === actualizada.id);
    if (indice !== -1) this.memoria.value[indice] = actualizada;
    else this.memoria.value.unshift(actualizada);

    timelineService.registrarEvento({
      clienteId: actualizada.cliente_id,
      tipo: 'cambio_etapa',
      titulo: `Propuesta APROBADA por el Cliente (${actualizada.numero_cotizacion})`,
      descripcion: `Aprobada digitalmente por ${actualizada.aprobado_por_nombre} (${actualizada.aprobado_por_cargo}).`,
      autor: 'Portal de Aprobacion Web',
    });
    return actualizada;
  }

  aprobarPropuestaPorCliente(token: string, firmante: { nombre: string; cargo: string }): Cotizacion {
    const cot = this.obtenerPorToken(token);
    if (!cot) {
      throw new Error('La propuesta indicada no fue encontrada o el enlace ha caducado.');
    }

    if (cot.estado === 'aprobada') {
      return cot;
    }

    cot.estado = 'aprobada';
    cot.aprobado_en = new Date().toISOString();
    cot.aprobado_por_nombre = firmante.nombre.trim();
    cot.aprobado_por_cargo = firmante.cargo.trim();
    this.persistir();

    // Bitácora en el CRM
    timelineService.registrarEvento({
      clienteId: cot.cliente_id,
      tipo: 'cambio_etapa',
      titulo: `¡Propuesta APROBADA por el Cliente! (${cot.numero_cotizacion})`,
      descripcion: `Aprobada digitalmente por ${cot.aprobado_por_nombre} (${cot.aprobado_por_cargo}). Monto cerrado: ${formatCurrency(cot.total, { currency: cot.moneda })}.`,
      autor: 'Portal de Aprobación Web',
    });

    toastService.exito(`Propuesta ${cot.numero_cotizacion} aprobada formalmente.`);
    return cot;
  }
}

export const cotizacionesService = new CotizacionesService();
