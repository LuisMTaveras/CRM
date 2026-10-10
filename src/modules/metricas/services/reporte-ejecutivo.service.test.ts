import { describe, it, expect } from 'vitest';
import { reporteEjecutivoService } from './reporte-ejecutivo.service';
import type { MetricasComerciales } from '../types/metricas.types';

describe('ReporteEjecutivoService - Generación de Informe PDF Gerencial A4', () => {
  const metricasMuestra: MetricasComerciales = {
    tasaConversion: 38.5,
    ticketPromedio: 450000,
    totalCuentas: 125,
    totalOportunidades: 48,
    totalGanado: 8900000,
    totalEnNegociacion: 4200000,
    totalPipelineActivo: 13100000,
    tiempoPromedioCierreDias: 24,
    distribucionSectores: [
      { sector: 'Banca y Finanzas', cantidad: 35, porcentaje: 28, montoTotal: 3500000, colorClase: 'bg-indigo-500', colorHex: '#4f46e5' },
      { sector: 'Tecnología & Telecom', cantidad: 45, porcentaje: 36, montoTotal: 4500000, colorClase: 'bg-emerald-500', colorHex: '#10b981' },
      { sector: 'Salud & Farmacéutica', cantidad: 25, porcentaje: 20, montoTotal: 2500000, colorClase: 'bg-amber-500', colorHex: '#f59e0b' },
    ],
    distribucionEtapas: [
      { etapa: 'calificacion', nombre: 'Calificación Inicial', cantidad: 18, monto: 2500000, porcentaje: 19, tasaConversionEtapa: 85 },
      { etapa: 'propuesta', nombre: 'Propuesta Técnica', cantidad: 14, monto: 3800000, porcentaje: 29, tasaConversionEtapa: 72 },
      { etapa: 'negociacion', nombre: 'Negociación Final', cantidad: 10, monto: 4200000, porcentaje: 32, tasaConversionEtapa: 60 },
      { etapa: 'ganada', nombre: 'Cerrada Ganada', cantidad: 6, monto: 2600000, porcentaje: 20, tasaConversionEtapa: 100 },
    ],
    topResponsables: [
      { responsable: 'Lic. Luis M. Taveras', deals: 18, monto: 5400000, ganadas: 12, tasaExito: 66.7 },
      { responsable: 'Camila Morales', deals: 15, monto: 4200000, ganadas: 9, tasaExito: 60.0 },
      { responsable: 'Jean Carlos Peña', deals: 15, monto: 3500000, ganadas: 8, tasaExito: 53.3 },
    ],
    tendenciaMensual: [],
  };

  it('genera una instancia válida de jsPDF con formato A4 vertical', () => {
    const doc = reporteEjecutivoService.generarInformePdf(metricasMuestra, 'Mes en Curso');
    expect(doc).toBeDefined();
    expect(Math.round(doc.internal.pageSize.getWidth())).toBe(210);
    expect(Math.round(doc.internal.pageSize.getHeight())).toBe(297);
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('produce un Data URI válido que contiene el informe gerencial con sellos', () => {
    const doc = reporteEjecutivoService.generarInformePdf(metricasMuestra, 'Último Trimestre');
    const uri = doc.output('datauristring');
    expect(uri.startsWith('data:application/pdf;')).toBe(true);
    expect(uri.length).toBeGreaterThan(5000);
  });
});
