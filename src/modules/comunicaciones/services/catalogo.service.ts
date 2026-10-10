import { reactive } from 'vue';
import type {
  ItemCatalogo,
  LineaCotizacion,
  ResumenCotizacion,
  MonedaCotizacion,
} from '../types/catalogo.types';

const SERVICIOS_INICIALES: ItemCatalogo[] = [
  {
    id: 'cat-01',
    codigo: 'CRM-CLOUD-ENT',
    nombre: 'Suscripción CRM Cloud Enterprise',
    descripcion: 'Licenciamiento multi-usuario con base de datos dedicada, SLA 99.9% y soporte telefónico prioritario.',
    categoria: 'licenciamiento',
    precioBase: 45000,
    moneda: 'DOP',
    aplicaItbis: true,
    tasaItbis: 0.18,
    unidadMedida: 'Mes',
  },
  {
    id: 'cat-02',
    codigo: 'IMP-ONBOARD-PRO',
    nombre: 'Implementación & Onboarding Personalizado',
    descripcion: 'Configuración inicial, parametrización de flujos de trabajo, migración de base de datos e integración de correo.',
    categoria: 'implementacion',
    precioBase: 120000,
    moneda: 'DOP',
    aplicaItbis: true,
    tasaItbis: 0.18,
    unidadMedida: 'Proyecto',
  },
  {
    id: 'cat-03',
    codigo: 'INT-ERP-DGII',
    nombre: 'Módulo de Integración Fiscal DGII & ERP',
    descripcion: 'Conector automatizado con comprobantes fiscales electrónicos (e-CF), reportes 606/607 y conciliación.',
    categoria: 'desarrollo',
    precioBase: 85000,
    moneda: 'DOP',
    aplicaItbis: true,
    tasaItbis: 0.18,
    unidadMedida: 'Proyecto',
  },
  {
    id: 'cat-04',
    codigo: 'SUP-SLA-247',
    nombre: 'Póliza de Soporte Técnico Especializado SLA 24/7',
    descripcion: 'Mesa de ayuda directa, resolución de incidentes críticos en menos de 2 horas y monitoreo proactivo.',
    categoria: 'soporte',
    precioBase: 28000,
    moneda: 'DOP',
    aplicaItbis: true,
    tasaItbis: 0.18,
    unidadMedida: 'Mes',
  },
  {
    id: 'cat-05',
    codigo: 'CAP-EQUIPO-COM',
    nombre: 'Capacitación y Adopción Comercial',
    descripcion: 'Talleres presenciales y remotos para la fuerza de ventas con simulaciones de prospección y gestión de cartera.',
    categoria: 'capacitacion',
    precioBase: 35000,
    moneda: 'DOP',
    aplicaItbis: true,
    tasaItbis: 0.18,
    unidadMedida: 'Sesión',
  },
  {
    id: 'cat-06',
    codigo: 'AUD-INFRA-SEC',
    nombre: 'Auditoría de Ciberseguridad & Cumplimiento Cloud',
    descripcion: 'Evaluación de vulnerabilidades perimetrales, controles de acceso por roles y protocolo de respaldo.',
    categoria: 'consultoria',
    precioBase: 1500,
    moneda: 'USD',
    aplicaItbis: false,
    tasaItbis: 0,
    unidadMedida: 'Auditoría',
  },
  {
    id: 'cat-07',
    codigo: 'DES-CUSTOM-HORA',
    nombre: 'Bolsa de Horas de Desarrollo a Medida',
    descripcion: 'Horas de ingeniería para reportes personalizados, automatizaciones y extensiones de módulos.',
    categoria: 'desarrollo',
    precioBase: 2800,
    moneda: 'DOP',
    aplicaItbis: true,
    tasaItbis: 0.18,
    unidadMedida: 'Hora',
  },
];

class CatalogoService {
  private catalogo = reactive<ItemCatalogo[]>([...SERVICIOS_INICIALES]);

  obtenerCatalogo(): ItemCatalogo[] {
    return this.catalogo;
  }

  obtenerItemPorId(id: string): ItemCatalogo | undefined {
    return this.catalogo.find((item) => item.id === id);
  }

  obtenerItemPorCodigo(codigo: string): ItemCatalogo | undefined {
    return this.catalogo.find((item) => item.codigo.toLowerCase() === codigo.toLowerCase());
  }

  agregarItem(nuevo: Omit<ItemCatalogo, 'id'>): ItemCatalogo {
    const item: ItemCatalogo = {
      ...nuevo,
      id: `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    this.catalogo.push(item);
    return item;
  }

  crearLineaDesdeItem(item: ItemCatalogo, cantidad: number = 1, descuentoPorcentaje: number = 0): LineaCotizacion {
    const cant = Math.max(1, isNaN(cantidad) ? 1 : cantidad);
    const desc = Math.min(100, Math.max(0, isNaN(descuentoPorcentaje) ? 0 : descuentoPorcentaje));
    const subtotalBruto = cant * item.precioBase;
    const montoDescuento = subtotalBruto * (desc / 100);
    const subtotalNeto = subtotalBruto - montoDescuento;
    const montoItbis = item.aplicaItbis ? subtotalNeto * item.tasaItbis : 0;
    const total = subtotalNeto + montoItbis;

    return {
      id: `linea-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      servicioId: item.id,
      codigo: item.codigo,
      concepto: item.nombre,
      descripcion: item.descripcion,
      cantidad: cant,
      precioUnitario: item.precioBase,
      descuentoPorcentaje: desc,
      aplicaItbis: item.aplicaItbis,
      subtotal: subtotalBruto,
      montoDescuento,
      montoItbis,
      total,
    };
  }

  crearLineaPersonalizada(
    concepto: string,
    precioUnitario: number,
    cantidad: number = 1,
    descuentoPorcentaje: number = 0,
    aplicaItbis: boolean = true
  ): LineaCotizacion {
    const cant = Math.max(1, isNaN(cantidad) ? 1 : cantidad);
    const precio = Math.max(0, isNaN(precioUnitario) ? 0 : precioUnitario);
    const desc = Math.min(100, Math.max(0, isNaN(descuentoPorcentaje) ? 0 : descuentoPorcentaje));

    const subtotalBruto = cant * precio;
    const montoDescuento = subtotalBruto * (desc / 100);
    const subtotalNeto = subtotalBruto - montoDescuento;
    const montoItbis = aplicaItbis ? subtotalNeto * 0.18 : 0;
    const total = subtotalNeto + montoItbis;

    return {
      id: `linea-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      concepto: concepto.trim() || 'Servicio Profesional',
      cantidad: cant,
      precioUnitario: precio,
      descuentoPorcentaje: desc,
      aplicaItbis,
      subtotal: subtotalBruto,
      montoDescuento,
      montoItbis,
      total,
    };
  }

  recalcularLinea(linea: LineaCotizacion): LineaCotizacion {
    const cant = Math.max(1, isNaN(linea.cantidad) ? 1 : Number(linea.cantidad));
    const precio = Math.max(0, isNaN(linea.precioUnitario) ? 0 : Number(linea.precioUnitario));
    const desc = Math.min(100, Math.max(0, isNaN(linea.descuentoPorcentaje) ? 0 : Number(linea.descuentoPorcentaje)));

    const subtotalBruto = cant * precio;
    const montoDescuento = subtotalBruto * (desc / 100);
    const subtotalNeto = subtotalBruto - montoDescuento;
    const montoItbis = linea.aplicaItbis ? subtotalNeto * 0.18 : 0;
    const total = subtotalNeto + montoItbis;

    return {
      ...linea,
      cantidad: cant,
      precioUnitario: precio,
      descuentoPorcentaje: desc,
      subtotal: Math.round(subtotalBruto * 100) / 100,
      montoDescuento: Math.round(montoDescuento * 100) / 100,
      montoItbis: Math.round(montoItbis * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  calcularResumen(lineas: LineaCotizacion[], moneda: MonedaCotizacion = 'DOP'): ResumenCotizacion {
    const lineasRecalculadas = lineas.map((l) => this.recalcularLinea(l));

    const subtotalBruto = lineasRecalculadas.reduce((acc, l) => acc + l.subtotal, 0);
    const descuentoTotal = lineasRecalculadas.reduce((acc, l) => acc + l.montoDescuento, 0);
    const subtotalNeto = subtotalBruto - descuentoTotal;
    const itbisTotal = lineasRecalculadas.reduce((acc, l) => acc + l.montoItbis, 0);
    const totalPagar = subtotalNeto + itbisTotal;

    return {
      moneda,
      subtotalBruto: Math.round(subtotalBruto * 100) / 100,
      descuentoTotal: Math.round(descuentoTotal * 100) / 100,
      subtotalNeto: Math.round(subtotalNeto * 100) / 100,
      itbisTotal: Math.round(itbisTotal * 100) / 100,
      totalPagar: Math.round(totalPagar * 100) / 100,
      lineas: lineasRecalculadas,
    };
  }
}

export const catalogoService = new CatalogoService();
