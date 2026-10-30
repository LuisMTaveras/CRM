import { clienteService } from '@/modules/clientes/services/cliente.service';
import { API_BASE_URL } from '@/core/api/api-config';
import type { Cliente, Oportunidad } from '@/modules/clientes/types/cliente.types';
import type {
  MetricasComerciales,
  SectorMetrica,
  EtapaMetrica,
  ResponsableMetrica,
  MesTendencia,
} from '../types/metricas.types';

type Periodo = 'mes' | 'trimestre' | 'anual';

const USAR_BACKEND =
  import.meta.env.MODE === 'production' || import.meta.env.VITE_USE_MOCK === 'false';

const ETAPAS: Oportunidad['etapa'][] = [
  'calificacion',
  'propuesta',
  'negociacion',
  'ganada',
  'perdida',
];

const NOMBRES_ETAPAS: Record<string, string> = {
  calificacion: 'Calificación',
  propuesta: 'Propuesta Enviada',
  negociacion: 'En Negociación',
  ganada: 'Cerrada Ganada',
  perdida: 'Cerrada Perdida',
};

const PALETA_SECTORES = [
  { bg: 'bg-emerald-500', hex: '#10b981' },
  { bg: 'bg-sky-500', hex: '#0ea5e9' },
  { bg: 'bg-indigo-500', hex: '#6366f1' },
  { bg: 'bg-amber-500', hex: '#f59e0b' },
  { bg: 'bg-purple-500', hex: '#8b5cf6' },
  { bg: 'bg-rose-500', hex: '#f43f5e' },
  { bg: 'bg-zinc-400', hex: '#71717a' },
];

const esCerrada = (etapa: Oportunidad['etapa']): boolean =>
  etapa === 'ganada' || etapa === 'perdida';

const instante = (valor?: string): number | null => {
  if (!valor) return null;
  const fecha = Date.parse(valor);
  return Number.isFinite(fecha) ? fecha : null;
};

const inicioPeriodo = (periodo: Periodo, ahora: Date): number => {
  if (periodo === 'anual') return new Date(ahora.getFullYear(), 0, 1).getTime();
  if (periodo === 'trimestre') {
    return new Date(ahora.getFullYear(), ahora.getMonth() - 2, 1).getTime();
  }
  return new Date(ahora.getFullYear(), ahora.getMonth(), 1).getTime();
};

const capitalizar = (texto: string): string =>
  texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : '';

const etiquetaMes = (fecha: Date): { mes: string; mesCorto: string } => {
  const mes = capitalizar(new Intl.DateTimeFormat('es', { month: 'long' }).format(fecha));
  const corto = capitalizar(
    new Intl.DateTimeFormat('es', { month: 'short' }).format(fecha).replace('.', '')
  );
  return { mes: `${mes} ${fecha.getFullYear()}`, mesCorto: corto };
};

const sumar = (items: Array<{ monto?: number }>): number =>
  items.reduce((total, item) => total + (Number(item.monto) || 0), 0);

interface OportunidadConContexto extends Oportunidad {
  cliente_sector: string;
  responsable: string;
}

/**
 * Calcula las métricas comerciales a partir de las oportunidades reales.
 * Sin factores ni series simuladas: cada cifra se deriva de `creado_en` y
 * `fecha_cierre` de los tratos almacenados.
 */
export function calcularMetricasComerciales(
  clientes: Cliente[],
  periodo: Periodo = 'mes',
  ahora: Date = new Date()
): MetricasComerciales {
  const desde = inicioPeriodo(periodo, ahora);

  const oportunidades: OportunidadConContexto[] = [];
  clientes.forEach((cliente) => {
    (cliente.oportunidades || []).forEach((oportunidad) => {
      oportunidades.push({
        ...oportunidad,
        cliente_sector: cliente.sector || 'Otros',
        responsable: cliente.responsable || 'Sin Asignar',
      });
    });
  });

  const enPeriodo = (oportunidad: OportunidadConContexto): boolean => {
    const creado = instante(oportunidad.creado_en);
    const cerrado = instante(oportunidad.fecha_cierre);
    return (creado !== null && creado >= desde) || (cerrado !== null && cerrado >= desde);
  };

  const delPeriodo = oportunidades.filter(enPeriodo);
  const ganadas = delPeriodo.filter((oportunidad) => oportunidad.etapa === 'ganada');
  const enNegociacion = delPeriodo.filter((oportunidad) => oportunidad.etapa === 'negociacion');
  const activas = delPeriodo.filter((oportunidad) => !esCerrada(oportunidad.etapa));

  const totalGanado = sumar(ganadas);
  const totalEnNegociacion = sumar(enNegociacion);
  const totalPipelineActivo = sumar(activas);
  const totalOportunidades = delPeriodo.length;

  const tasaConversion =
    totalOportunidades > 0
      ? Math.round((ganadas.length / totalOportunidades) * 1000) / 10
      : 0;

  const ticketPromedio =
    ganadas.length > 0
      ? Math.round(totalGanado / ganadas.length)
      : totalOportunidades > 0
        ? Math.round(totalPipelineActivo / totalOportunidades)
        : 0;

  const ciclos = ganadas
    .map((oportunidad) => {
      const creado = instante(oportunidad.creado_en);
      const cerrado = instante(oportunidad.fecha_cierre);
      if (creado === null || cerrado === null || cerrado < creado) return null;
      return (cerrado - creado) / 86400000;
    })
    .filter((dias): dias is number => dias !== null);

  const tiempoPromedioCierreDias =
    ciclos.length > 0
      ? Math.round(ciclos.reduce((total, dias) => total + dias, 0) / ciclos.length)
      : 0;

  // --- Distribución real por sector ---
  const sectoresMap = new Map<string, { cantidad: number; montoTotal: number }>();
  delPeriodo.forEach((oportunidad) => {
    const sector = oportunidad.cliente_sector || 'Otros';
    const actual = sectoresMap.get(sector) || { cantidad: 0, montoTotal: 0 };
    sectoresMap.set(sector, {
      cantidad: actual.cantidad + 1,
      montoTotal: actual.montoTotal + (Number(oportunidad.monto) || 0),
    });
  });

  const totalValorSectores = Array.from(sectoresMap.values()).reduce(
    (total, sector) => total + sector.montoTotal,
    0
  );

  const distribucionSectores: SectorMetrica[] = Array.from(sectoresMap.entries())
    .map(([sector, datos], indice) => {
      const estilo = PALETA_SECTORES[indice % PALETA_SECTORES.length];
      return {
        sector,
        cantidad: datos.cantidad,
        montoTotal: datos.montoTotal,
        porcentaje:
          totalValorSectores > 0
            ? Math.round((datos.montoTotal / totalValorSectores) * 100)
            : Math.round((datos.cantidad / (totalOportunidades || 1)) * 100),
        colorClase: estilo.bg,
        colorHex: estilo.hex,
      };
    })
    .sort((a, b) => b.montoTotal - a.montoTotal || b.cantidad - a.cantidad);

  // --- Embudo por etapas ---
  let cantidadAnterior = totalOportunidades;
  const distribucionEtapas: EtapaMetrica[] = ETAPAS.map((etapa) => {
    const deals = delPeriodo.filter((oportunidad) => oportunidad.etapa === etapa);
    const monto = sumar(deals);
    const porcentaje =
      totalOportunidades > 0 ? Math.round((deals.length / totalOportunidades) * 100) : 0;
    const tasaConversionEtapa =
      cantidadAnterior > 0 ? Math.round((deals.length / cantidadAnterior) * 100) : 0;
    if (etapa !== 'perdida') cantidadAnterior = deals.length;

    return {
      etapa,
      nombre: NOMBRES_ETAPAS[etapa] || etapa,
      cantidad: deals.length,
      monto,
      porcentaje,
      tasaConversionEtapa,
    };
  });

  // --- Ranking real de responsables ---
  const responsablesMap = new Map<string, { deals: number; monto: number; ganadas: number }>();
  delPeriodo.forEach((oportunidad) => {
    const responsable = oportunidad.responsable || 'Sin Asignar';
    const actual = responsablesMap.get(responsable) || { deals: 0, monto: 0, ganadas: 0 };
    responsablesMap.set(responsable, {
      deals: actual.deals + 1,
      monto: actual.monto + (Number(oportunidad.monto) || 0),
      ganadas: actual.ganadas + (oportunidad.etapa === 'ganada' ? 1 : 0),
    });
  });

  const topResponsables: ResponsableMetrica[] = Array.from(responsablesMap.entries())
    .map(([responsable, datos]) => ({
      responsable,
      deals: datos.deals,
      monto: datos.monto,
      ganadas: datos.ganadas,
      tasaExito: datos.deals > 0 ? Math.round((datos.ganadas / datos.deals) * 100) : 0,
    }))
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 5);

  // --- Tendencia real de los últimos 6 meses ---
  const tendenciaMensual: MesTendencia[] = Array.from({ length: 6 }).map((_, indice) => {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - (5 - indice), 1);
    const desdeMes = fecha.getTime();
    const hastaMes = new Date(ahora.getFullYear(), ahora.getMonth() - (4 - indice), 1).getTime();

    const creadas = oportunidades.filter((oportunidad) => {
      const creado = instante(oportunidad.creado_en);
      return creado !== null && creado >= desdeMes && creado < hastaMes;
    });
    const ganadasMes = oportunidades.filter((oportunidad) => {
      const cerrado = instante(oportunidad.fecha_cierre);
      return (
        oportunidad.etapa === 'ganada' &&
        cerrado !== null &&
        cerrado >= desdeMes &&
        cerrado < hastaMes
      );
    });

    return {
      ...etiquetaMes(fecha),
      montoGanado: sumar(ganadasMes),
      montoPipeline: sumar(creadas.filter((oportunidad) => !esCerrada(oportunidad.etapa))),
      dealsGanados: ganadasMes.length,
      dealsTotales: creadas.length,
    };
  });

  return {
    tasaConversion,
    ticketPromedio,
    totalCuentas: clientes.length,
    totalOportunidades,
    totalGanado,
    totalEnNegociacion,
    totalPipelineActivo,
    tiempoPromedioCierreDias,
    distribucionSectores,
    distribucionEtapas,
    topResponsables,
    tendenciaMensual,
  };
}

class MetricasService {
  async obtenerMetricas(periodo: Periodo = 'mes'): Promise<MetricasComerciales> {
    if (USAR_BACKEND) {
      const respuesta = await fetch(`${API_BASE_URL}/metricas?periodo=${periodo}`);
      const data = await respuesta.json().catch(() => null);

      if (!respuesta.ok || !data?.metricas) {
        throw new Error(
          (data && typeof data.error === 'string' && data.error) ||
            `No se pudieron consultar las métricas (${respuesta.status}).`
        );
      }

      return data.metricas as MetricasComerciales;
    }

    await new Promise((resolve) => setTimeout(resolve, 120));
    // Fuente real única: oportunidades almacenadas en la cartera de clientes.
    const clientes = await clienteService.obtenerTodosLosClientes();
    return calcularMetricasComerciales(clientes, periodo);
  }
}

export const metricasService = new MetricasService();
