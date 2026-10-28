import { ref } from 'vue';
import type { Cotizacion, EstadoCotizacion } from '../types/catalogo.types';
import { timelineService } from '@/modules/clientes/services/timeline.service';
import { toastService } from '@/core/notifications/toast.service';
import { formatCurrency } from '@/core/formatters/formatters';

const CLAVE_STORAGE = 'crm_cotizaciones_v1';

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

  private cargarInicial(): Cotizacion[] {
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
    try {
      localStorage.setItem(CLAVE_STORAGE, JSON.stringify(this.memoria.value));
    } catch {
      // fallback
    }
  }

  obtenerTodas(): Cotizacion[] {
    return this.memoria.value;
  }

  obtenerPorId(id: string): Cotizacion | undefined {
    return this.memoria.value.find((c) => c.id === id);
  }

  obtenerPorToken(token: string): Cotizacion | undefined {
    return this.memoria.value.find((c) => c.token_aprobacion === token);
  }

  obtenerPorCliente(clienteId: string): Cotizacion[] {
    return this.memoria.value.filter((c) => c.cliente_id === clienteId);
  }

  generarToken(): string {
    return `tok_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  }

  generarNumero(): string {
    const año = new Date().getFullYear();
    const count = this.memoria.value.length + 43;
    return `COT-${año}-${count.toString().padStart(4, '0')}`;
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
    return true;
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
