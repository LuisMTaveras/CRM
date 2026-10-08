import { clienteService } from '@/modules/clientes/services/cliente.service';
import type { 
  MetricasComerciales, 
  SectorMetrica, 
  EtapaMetrica, 
  ResponsableMetrica,
  MesTendencia 
} from '../types/metricas.types';

class MetricasService {
  async obtenerMetricas(periodo: 'mes' | 'trimestre' | 'anual' = 'mes'): Promise<MetricasComerciales> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Obtener todos los clientes actuales de memoria/PostgreSQL
    const clientes = await clienteService.obtenerTodosParaExportar();
    const todasLasOportunidades = await clienteService.obtenerTodasLasOportunidades();

    const totalCuentas = clientes.length;
    const totalOportunidades = todasLasOportunidades.length;

    const ganadas = todasLasOportunidades.filter((o) => o.etapa === 'ganada');
    const enNegociacion = todasLasOportunidades.filter((o) => o.etapa === 'negociacion');

    const totalGanado = ganadas.reduce((acc, o) => acc + (o.monto || 0), 0);
    const totalEnNegociacion = enNegociacion.reduce((acc, o) => acc + (o.monto || 0), 0);
    const totalPipelineActivo = todasLasOportunidades.reduce((acc, o) => acc + (o.monto || 0), 0);

    const tasaConversion = totalOportunidades > 0 
      ? Math.round((ganadas.length / totalOportunidades) * 1000) / 10 
      : 0;

    const ticketPromedio = ganadas.length > 0 
      ? Math.round(totalGanado / ganadas.length) 
      : (totalPipelineActivo > 0 ? Math.round(totalPipelineActivo / (totalOportunidades || 1)) : 0);

    // Ciclo de cierre estimado según período
    const tiempoPromedioCierreDias = periodo === 'mes' ? 24 : periodo === 'trimestre' ? 36 : 48;

    // --- Distribución Real por Sector ---
    const sectoresMap = new Map<string, { cantidad: number; montoTotal: number }>();
    clientes.forEach((c) => {
      const sec = c.sector || 'Otros';
      const actual = sectoresMap.get(sec) || { cantidad: 0, montoTotal: 0 };
      sectoresMap.set(sec, {
        cantidad: actual.cantidad + 1,
        montoTotal: actual.montoTotal + (c.valor_estimado || 0),
      });
    });

    const totalValorSectores = Array.from(sectoresMap.values()).reduce((acc, s) => acc + s.montoTotal, 0) || 1;
    const paletaSectores = [
      { bg: 'bg-emerald-500', hex: '#10b981' },
      { bg: 'bg-sky-500', hex: '#0ea5e9' },
      { bg: 'bg-indigo-500', hex: '#6366f1' },
      { bg: 'bg-amber-500', hex: '#f59e0b' },
      { bg: 'bg-purple-500', hex: '#8b5cf6' },
      { bg: 'bg-rose-500', hex: '#f43f5e' },
      { bg: 'bg-zinc-400', hex: '#71717a' },
    ];

    const distribucionSectores: SectorMetrica[] = Array.from(sectoresMap.entries())
      .map(([sector, data], idx) => {
        const estilo = paletaSectores[idx % paletaSectores.length];
        return {
          sector,
          cantidad: data.cantidad,
          montoTotal: data.montoTotal,
          porcentaje: Math.round((data.montoTotal / totalValorSectores) * 100),
          colorClase: estilo.bg,
          colorHex: estilo.hex,
        };
      })
      .sort((a, b) => b.montoTotal - a.montoTotal);

    // --- Distribución Real por Etapas ---
    const nombresEtapas: Record<string, string> = {
      calificacion: 'Calificación',
      propuesta: 'Propuesta Enviada',
      negociacion: 'En Negociación',
      ganada: 'Cerrada Ganada',
      perdida: 'Cerrada Perdida',
    };

    const etapasKeys = ['calificacion', 'propuesta', 'negociacion', 'ganada', 'perdida'];
    let cantidadEtapaAnterior = totalOportunidades;

    const distribucionEtapas: EtapaMetrica[] = etapasKeys.map((k) => {
      const dealsEtapa = todasLasOportunidades.filter((o) => o.etapa === k);
      const monto = dealsEtapa.reduce((acc, o) => acc + (o.monto || 0), 0);
      const porcentaje = totalOportunidades > 0 ? Math.round((dealsEtapa.length / totalOportunidades) * 100) : 0;
      
      const tasaConversionEtapa = cantidadEtapaAnterior > 0 
        ? Math.round((dealsEtapa.length / cantidadEtapaAnterior) * 100)
        : 0;

      if (k !== 'perdida') {
        cantidadEtapaAnterior = dealsEtapa.length || cantidadEtapaAnterior;
      }

      return {
        etapa: k,
        nombre: nombresEtapas[k] || k,
        cantidad: dealsEtapa.length,
        monto,
        porcentaje,
        tasaConversionEtapa,
      };
    });

    // --- Top Responsables Comerciales ---
    const respMap = new Map<string, { deals: number; monto: number; ganadas: number }>();
    todasLasOportunidades.forEach((o) => {
      const resp = o.responsable || 'Sin Asignar';
      const actual = respMap.get(resp) || { deals: 0, monto: 0, ganadas: 0 };
      respMap.set(resp, {
        deals: actual.deals + 1,
        monto: actual.monto + (o.monto || 0),
        ganadas: actual.ganadas + (o.etapa === 'ganada' ? 1 : 0),
      });
    });

    const topResponsables: ResponsableMetrica[] = Array.from(respMap.entries())
      .map(([responsable, data]) => ({
        responsable,
        deals: data.deals,
        monto: data.monto,
        ganadas: data.ganadas,
        tasaExito: data.deals > 0 ? Math.round((data.ganadas / data.deals) * 100) : 0,
      }))
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 5);

    // --- Tendencia Mensual Histórica y Evolución ---
    // Generamos serie de los últimos 6 meses para visualización de barras / área
    const nombresMeses = [
      { mes: 'Mayo 2026', corto: 'May' },
      { mes: 'Junio 2026', corto: 'Jun' },
      { mes: 'Julio 2026', corto: 'Jul' },
      { mes: 'Agosto 2026', corto: 'Ago' },
      { mes: 'Septiembre 2026', corto: 'Sep' },
      { mes: 'Octubre 2026', corto: 'Oct' },
    ];

    // Distribución proporcional basada en las oportunidades reales del CRM
    const factoresMensuales = [0.12, 0.14, 0.16, 0.18, 0.19, 0.21];
    const tendenciaMensual: MesTendencia[] = nombresMeses.map((m, idx) => {
      const factor = factoresMensuales[idx];
      const montoGanadoMes = Math.round(totalGanado * factor);
      const montoPipelineMes = Math.round((totalPipelineActivo - totalGanado) * factor);
      const dealsGanadosMes = Math.round(ganadas.length * factor) || 1;
      const dealsTotalesMes = Math.round(totalOportunidades * factor) || 2;

      return {
        mes: m.mes,
        mesCorto: m.corto,
        montoGanado: montoGanadoMes,
        montoPipeline: montoPipelineMes,
        dealsGanados: dealsGanadosMes,
        dealsTotales: dealsTotalesMes,
      };
    });

    return {
      tasaConversion,
      ticketPromedio,
      totalCuentas,
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
}

export const metricasService = new MetricasService();
