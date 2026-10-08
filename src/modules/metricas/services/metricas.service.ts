import { clienteService } from '@/modules/clientes/services/cliente.service';
import type { MetricasComerciales, SectorMetrica, EtapaMetrica, ResponsableMetrica } from '../types/metricas.types';

class MetricasService {
  async obtenerMetricas(periodo: 'mes' | 'trimestre' | 'anual' = 'mes'): Promise<MetricasComerciales> {
    await new Promise((resolve) => setTimeout(resolve, 280));

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

    // Ajuste de ciclo de cierre estimado según período
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
    const coloresDisponibles = [
      'bg-emerald-500',
      'bg-sky-500',
      'bg-indigo-500',
      'bg-amber-500',
      'bg-purple-500',
      'bg-rose-500',
      'bg-zinc-400',
    ];

    const distribucionSectores: SectorMetrica[] = Array.from(sectoresMap.entries())
      .map(([sector, data], idx) => ({
        sector,
        cantidad: data.cantidad,
        montoTotal: data.montoTotal,
        porcentaje: Math.round((data.montoTotal / totalValorSectores) * 100),
        colorClase: coloresDisponibles[idx % coloresDisponibles.length],
      }))
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
    const distribucionEtapas: EtapaMetrica[] = etapasKeys.map((k) => {
      const dealsEtapa = todasLasOportunidades.filter((o) => o.etapa === k);
      const monto = dealsEtapa.reduce((acc, o) => acc + (o.monto || 0), 0);
      return {
        etapa: k,
        nombre: nombresEtapas[k] || k,
        cantidad: dealsEtapa.length,
        monto,
        porcentaje: totalOportunidades > 0 ? Math.round((dealsEtapa.length / totalOportunidades) * 100) : 0,
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
      }))
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 5);

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
    };
  }
}

export const metricasService = new MetricasService();
