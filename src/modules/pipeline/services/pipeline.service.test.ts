import { describe, it, expect, beforeEach } from 'vitest';
import { pipelineService } from './pipeline.service';

describe('PipelineService - Tableros Dinámicos y Columnas', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('debe inicializar con los tableros predeterminados incluyendo Clientes A Visitar y un único estado completado', async () => {
    const pipelines = await pipelineService.obtenerPipelines();
    expect(pipelines.length).toBeGreaterThanOrEqual(2);
    
    const pipelineComercial = pipelines.find((p) => p.id === 'pipeline-comercial');
    expect(pipelineComercial).toBeDefined();
    expect(pipelineComercial?.columnas.length).toBe(5);
    const completadosComercial = pipelineComercial?.columnas.filter((c) => c.es_completado);
    expect(completadosComercial?.length).toBe(1);

    const pipelineVisitas = pipelines.find((p) => p.id === 'pipeline-visitas');
    expect(pipelineVisitas).toBeDefined();
    expect(pipelineVisitas?.nombre).toBe('Clientes A Visitar');
    expect(pipelineVisitas?.columnas.length).toBe(5);
    const completadosVisitas = pipelineVisitas?.columnas.filter((c) => c.es_completado);
    expect(completadosVisitas?.length).toBe(1);
  });

  it('permite crear un nuevo pipeline personalizado con columnas a medida', async () => {
    const nuevo = await pipelineService.crearPipeline({
      nombre: 'Visitas Técnicas de Mantenimiento',
      descripcion: 'Rutas técnicas y auditorías de post-venta',
      tipo: 'visitas',
      columnas: [
        { titulo: 'Por Programar', color: 'border-amber-500/40 text-amber-400', bgBadge: 'bg-amber-500/10' },
        { titulo: 'Técnico en Ruta', color: 'border-sky-500/40 text-sky-400', bgBadge: 'bg-sky-500/10' },
        { titulo: 'Mantenimiento Completado', color: 'border-emerald-500/40 text-emerald-400', bgBadge: 'bg-emerald-500/10', es_completado: true },
      ],
    });

    expect(nuevo.id).toBeDefined();
    expect(nuevo.nombre).toBe('Visitas Técnicas de Mantenimiento');
    expect(nuevo.columnas.length).toBe(3);

    const lista = await pipelineService.obtenerPipelines();
    expect(lista.some((p) => p.id === nuevo.id)).toBe(true);
  });

  it('permite crear múltiples tarjetas en lote para varios clientes', async () => {
    const clientes = await pipelineService.obtenerClientesParaSelector();
    expect(clientes.length).toBeGreaterThanOrEqual(2);

    const clienteIds = [clientes[0].id, clientes[1].id];
    const creadas = await pipelineService.crearMultiplesTarjetas({
      pipeline_id: 'pipeline-visitas',
      columna_id: 'por_agendar',
      cliente_ids: clienteIds,
      titulo: 'Ronda de visitas de mantenimiento',
      fecha_objetivo: '2026-10-20',
      prioridad: 'alta',
    });

    expect(creadas.length).toBe(2);
    expect(creadas[0].cliente_id).toBe(clienteIds[0]);
    expect(creadas[1].cliente_id).toBe(clienteIds[1]);
  });

  it('permite reordenar tarjetas verticalmente (arriba y abajo)', async () => {
    const tarjetas = await pipelineService.obtenerTarjetas('pipeline-visitas');
    const tarjetasPorAgendar = tarjetas.filter((t) => t.columna_id === 'por_agendar');

    if (tarjetasPorAgendar.length >= 2) {
      const primeraTarjetaId = tarjetasPorAgendar[0].id;
      const segundaTarjetaId = tarjetasPorAgendar[1].id;

      // Mover la primera hacia abajo
      await pipelineService.moverTarjetaPosicionVertical('pipeline-visitas', primeraTarjetaId, 'abajo');
      
      const tarjetasActualizadas = await pipelineService.obtenerTarjetas('pipeline-visitas');
      const porAgendarActualizadas = tarjetasActualizadas.filter((t) => t.columna_id === 'por_agendar');

      expect(porAgendarActualizadas[0].id).toBe(segundaTarjetaId);
      expect(porAgendarActualizadas[1].id).toBe(primeraTarjetaId);
    }
  });

  it('calcula correctamente las métricas de porcentaje completado del pipeline y desglosa bloqueadas', async () => {
    const clientes = await pipelineService.obtenerClientesParaSelector();
    await pipelineService.crearTarjeta({
      pipeline_id: 'pipeline-visitas',
      columna_id: 'visita_bloqueada',
      cliente_id: clientes[0].id,
      titulo: 'Visita técnica suspendida por mantenimiento de planta',
      monto: 750000,
      fecha_objetivo: '2026-10-25',
    });

    const metricas = await pipelineService.obtenerMetricasProgreso('pipeline-visitas');
    expect(metricas.total).toBeGreaterThan(0);
    expect(metricas.porcentaje).toBeGreaterThanOrEqual(0);
    expect(metricas.porcentaje).toBeLessThanOrEqual(100);
    expect(metricas.completadas + metricas.enProceso + metricas.bloqueadas + metricas.pendientes).toBe(metricas.total);
    expect(metricas.bloqueadas).toBeGreaterThan(0);
    expect(metricas.montoBloqueado).toBeGreaterThanOrEqual(750000);
  });

  it('respeta el límite máximo de 10 etapas por tablero', async () => {
    const pipeline = (await pipelineService.obtenerPipelines())[0];
    
    // Si tiene columnas previas, agregar hasta llegar al límite de 10
    while (pipeline.columnas.length < 10) {
      await pipelineService.agregarColumna(pipeline.id, {
        titulo: `Etapa Extra ${pipeline.columnas.length + 1}`,
        color: 'border-zinc-500/40 text-zinc-300',
        bgBadge: 'bg-zinc-500/10',
      });
      const actualizado = await pipelineService.obtenerPipelinePorId(pipeline.id);
      if (actualizado) pipeline.columnas = actualizado.columnas;
    }

    expect(pipeline.columnas.length).toBe(10);

    // Intentar agregar una columna número 11 debe fallar
    await expect(
      pipelineService.agregarColumna(pipeline.id, {
        titulo: 'Etapa 11 no permitida',
        color: 'border-zinc-500/40 text-zinc-300',
        bgBadge: 'bg-zinc-500/10',
      })
    ).rejects.toThrow(/límite máximo/i);
  });

  it('garantiza que las nuevas columnas siempre se inserten arriba de completado y que completado sea siempre la última', async () => {
    const pipeline = await pipelineService.crearPipeline({
      nombre: 'Pipeline Prueba Inserción Arriba',
      tipo: 'operaciones',
      columnas: [
        { titulo: 'Etapa 1', color: 'border-zinc-500', bgBadge: 'bg-zinc-500/10', estado: 'pendiente' },
        { titulo: 'Etapa Final Meta', color: 'border-emerald-500', bgBadge: 'bg-emerald-500/10', estado: 'completado' },
      ],
    });

    expect(pipeline.columnas[pipeline.columnas.length - 1].titulo).toBe('Etapa Final Meta');
    expect(pipeline.columnas[pipeline.columnas.length - 1].estado).toBe('completado');

    // Agregar nueva columna
    await pipelineService.agregarColumna(pipeline.id, {
      titulo: 'Etapa Intermedia Nueva',
      color: 'border-sky-500',
      bgBadge: 'bg-sky-500/10',
      estado: 'en_proceso',
    });

    const actualizado = await pipelineService.obtenerPipelinePorId(pipeline.id);
    expect(actualizado?.columnas.length).toBe(3);
    // La penúltima es la nueva columna agregada
    expect(actualizado?.columnas[1].titulo).toBe('Etapa Intermedia Nueva');
    expect(actualizado?.columnas[1].estado).toBe('en_proceso');
    // La última sigue siendo la completada
    expect(actualizado?.columnas[2].titulo).toBe('Etapa Final Meta');
    expect(actualizado?.columnas[2].estado).toBe('completado');
  });

  it('obtiene el resumen global de todos los pipelines con tarjetas, porcentajes y progreso', async () => {
    const resumen = await pipelineService.obtenerResumenPipelines();
    expect(resumen.length).toBeGreaterThanOrEqual(2);

    for (const item of resumen) {
      expect(item.id).toBeDefined();
      expect(item.nombre).toBeDefined();
      expect(item.porcentaje).toBeGreaterThanOrEqual(0);
      expect(item.porcentaje).toBeLessThanOrEqual(100);
      expect(typeof item.totalTarjetas).toBe('number');
      expect(typeof item.completadas).toBe('number');
    }
  });
});

