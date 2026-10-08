import { describe, it, expect } from 'vitest';
import { metricasService } from './metricas.service';

describe('MetricasService - Cálculos y Generación de Gráficos', () => {
  it('obtiene métricas comerciales con estructura completa', async () => {
    const metricas = await metricasService.obtenerMetricas('mes');

    expect(metricas).toBeDefined();
    expect(metricas.totalCuentas).toBeGreaterThan(0);
    expect(metricas.totalOportunidades).toBeGreaterThan(0);
    expect(metricas.tasaConversion).toBeGreaterThanOrEqual(0);
    expect(metricas.ticketPromedio).toBeGreaterThan(0);
    expect(metricas.totalPipelineActivo).toBeGreaterThan(0);
  });

  it('calcula la distribución por sector con colorHex y porcentajes válidos', async () => {
    const metricas = await metricasService.obtenerMetricas('mes');

    expect(metricas.distribucionSectores.length).toBeGreaterThan(0);
    metricas.distribucionSectores.forEach((sec) => {
      expect(sec.sector).toBeTruthy();
      expect(sec.colorHex).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(sec.porcentaje).toBeGreaterThanOrEqual(0);
      expect(sec.porcentaje).toBeLessThanOrEqual(100);
      expect(sec.montoTotal).toBeGreaterThanOrEqual(0);
    });
  });

  it('calcula las etapas del embudo con retención entre fases', async () => {
    const metricas = await metricasService.obtenerMetricas('mes');

    expect(metricas.distribucionEtapas.length).toBe(5);
    const etapasNombres = metricas.distribucionEtapas.map((e) => e.etapa);
    expect(etapasNombres).toContain('calificacion');
    expect(etapasNombres).toContain('propuesta');
    expect(etapasNombres).toContain('negociacion');
    expect(etapasNombres).toContain('ganada');
    expect(etapasNombres).toContain('perdida');

    metricas.distribucionEtapas.forEach((et) => {
      expect(et.tasaConversionEtapa).toBeGreaterThanOrEqual(0);
      expect(et.monto).toBeGreaterThanOrEqual(0);
    });
  });

  it('calcula la serie de tendencia mensual para gráficos de barras', async () => {
    const metricas = await metricasService.obtenerMetricas('mes');

    expect(metricas.tendenciaMensual.length).toBe(6);
    metricas.tendenciaMensual.forEach((mes) => {
      expect(mes.mes).toBeTruthy();
      expect(mes.mesCorto).toBeTruthy();
      expect(mes.montoGanado).toBeGreaterThanOrEqual(0);
      expect(mes.montoPipeline).toBeGreaterThanOrEqual(0);
      expect(mes.dealsTotales).toBeGreaterThanOrEqual(1);
    });
  });

  it('calcula ranking de ejecutivos comerciales con tasa de éxito', async () => {
    const metricas = await metricasService.obtenerMetricas('mes');

    expect(metricas.topResponsables.length).toBeGreaterThan(0);
    metricas.topResponsables.forEach((resp) => {
      expect(resp.responsable).toBeTruthy();
      expect(resp.deals).toBeGreaterThan(0);
      expect(resp.tasaExito).toBeGreaterThanOrEqual(0);
      expect(resp.tasaExito).toBeLessThanOrEqual(100);
    });
  });
});
