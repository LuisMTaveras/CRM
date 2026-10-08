import { clienteService } from '@/modules/clientes/services/cliente.service';
import type {
  Pipeline,
  ColumnaPipeline,
  TarjetaPipeline,
  CrearPipelineInput,
  EditarPipelineInput,
  CrearColumnaInput,
  EditarColumnaInput,
  CrearTarjetaInput,
  CrearMultiplesTarjetasInput,
  FiltrosPipeline,
  MetricasProgresoPipeline,
  ResumenPipelineItem,
  OportunidadConCliente,
  EtapaOportunidad,
  NuevaOportunidadInput,
} from '../types/pipeline.types';
import { LIMITE_MAXIMO_COLUMNAS } from '../types/pipeline.types';

const CLAVE_STORAGE_PIPELINES = 'crm_pipelines_catalogo';
const CLAVE_STORAGE_TARJETAS = 'crm_pipelines_tarjetas';

const PIPELINES_INICIALES: Pipeline[] = [
  {
    id: 'pipeline-comercial',
    nombre: 'Pipeline Comercial B2B',
    descripcion: 'Embudo de oportunidades comerciales, valores proyectados y cierre de tratos.',
    tipo: 'ventas',
    icono: 'Kanban',
    color: 'emerald',
    es_predeterminado: true,
    creado_en: '2026-01-15T08:00:00Z',
    columnas: [
      {
        id: 'calificacion',
        titulo: 'Calificación',
        color: 'border-sky-500/40 text-sky-400',
        bgBadge: 'bg-sky-500/10 border-sky-500/20',
        orden: 1,
        estado: 'pendiente',
        es_completado: false,
      },
      {
        id: 'propuesta',
        titulo: 'Propuesta Enviada',
        color: 'border-indigo-500/40 text-indigo-400',
        bgBadge: 'bg-indigo-500/10 border-indigo-500/20',
        orden: 2,
        estado: 'en_proceso',
        es_completado: false,
      },
      {
        id: 'negociacion',
        titulo: 'En Negociación',
        color: 'border-amber-500/40 text-amber-400',
        bgBadge: 'bg-amber-500/10 border-amber-500/20',
        orden: 3,
        estado: 'en_proceso',
        es_completado: false,
      },
      {
        id: 'trato_bloqueado',
        titulo: 'Trato En Pausa / Bloqueado',
        color: 'border-rose-500/40 text-rose-400',
        bgBadge: 'bg-rose-500/10 border-rose-500/20',
        orden: 4,
        estado: 'bloqueado',
        es_completado: false,
      },
      {
        id: 'ganada',
        titulo: 'Cerrada Ganada',
        color: 'border-emerald-500/40 text-emerald-400',
        bgBadge: 'bg-emerald-500/10 border-emerald-500/20',
        orden: 5,
        estado: 'completado',
        es_completado: true,
      },
    ],
  },
  {
    id: 'pipeline-visitas',
    nombre: 'Clientes A Visitar',
    descripcion: 'Planificación y control de visitas comerciales, demostraciones y auditorías en terreno.',
    tipo: 'visitas',
    icono: 'MapPin',
    color: 'sky',
    es_predeterminado: false,
    creado_en: '2026-02-01T10:00:00Z',
    columnas: [
      {
        id: 'por_agendar',
        titulo: 'Por Agendar',
        color: 'border-amber-500/40 text-amber-400',
        bgBadge: 'bg-amber-500/10 border-amber-500/20',
        orden: 1,
        estado: 'pendiente',
        es_completado: false,
      },
      {
        id: 'visita_programada',
        titulo: 'Visita Programada',
        color: 'border-sky-500/40 text-sky-400',
        bgBadge: 'bg-sky-500/10 border-sky-500/20',
        orden: 2,
        estado: 'en_proceso',
        es_completado: false,
      },
      {
        id: 'en_visita',
        titulo: 'En Visita / Ruta',
        color: 'border-indigo-500/40 text-indigo-400',
        bgBadge: 'bg-indigo-500/10 border-indigo-500/20',
        orden: 3,
        estado: 'en_proceso',
        es_completado: false,
      },
      {
        id: 'visita_bloqueada',
        titulo: 'Visita Pospuesta / Bloqueada',
        color: 'border-rose-500/40 text-rose-400',
        bgBadge: 'bg-rose-500/10 border-rose-500/20',
        orden: 4,
        estado: 'bloqueado',
        es_completado: false,
      },
      {
        id: 'visita_realizada',
        titulo: 'Visita Realizada',
        color: 'border-emerald-500/40 text-emerald-400',
        bgBadge: 'bg-emerald-500/10 border-emerald-500/20',
        orden: 5,
        estado: 'completado',
        es_completado: true,
      },
    ],
  },
];

class PipelineService {
  private memoriaPipelines: Pipeline[] = this.cargarPipelinesIniciales();
  private memoriaTarjetas: TarjetaPipeline[] = this.cargarTarjetasIniciales();

  private generarId(prefijo: string = 'id'): string {
    return `${prefijo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  private asegurarUnicoEstadoCompletado(columnas: ColumnaPipeline[]): void {
    if (columnas.length === 0) return;

    // 1. La última etapa es SIEMPRE la meta completada del tablero
    columnas.forEach((c, idx) => {
      if (idx === columnas.length - 1) {
        c.estado = 'completado';
        c.es_completado = true;
      } else {
        // Ninguna etapa previa puede ser completado
        if (!c.estado || c.estado === 'completado') {
          c.estado = idx === 0 ? 'pendiente' : 'en_proceso';
        }
        c.es_completado = false;
      }
    });
  }

  private cargarPipelinesIniciales(): Pipeline[] {
    try {
      const guardado = localStorage.getItem(CLAVE_STORAGE_PIPELINES);
      if (guardado) {
        const parsed: Pipeline[] = JSON.parse(guardado);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((pipe) => {
            this.asegurarUnicoEstadoCompletado(pipe.columnas);
            // Si el pipeline es el predeterminado de visitas y no tiene etapa bloqueada, incorporarla
            if (pipe.id === 'pipeline-visitas' && !pipe.columnas.some((c) => c.estado === 'bloqueado') && pipe.columnas.length < LIMITE_MAXIMO_COLUMNAS) {
              const compIdx = pipe.columnas.findIndex((c) => c.estado === 'completado');
              const insertIdx = compIdx !== -1 ? compIdx : pipe.columnas.length;
              pipe.columnas.splice(insertIdx, 0, {
                id: 'visita_bloqueada',
                titulo: 'Visita Pospuesta / Bloqueada',
                color: 'border-rose-500/40 text-rose-400',
                bgBadge: 'bg-rose-500/10 border-rose-500/20',
                orden: insertIdx + 1,
                estado: 'bloqueado',
                es_completado: false,
              });
              pipe.columnas.forEach((c, idx) => {
                c.orden = idx + 1;
              });
            }
          });
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    const iniciales: Pipeline[] = JSON.parse(JSON.stringify(PIPELINES_INICIALES));
    try {
      localStorage.setItem(CLAVE_STORAGE_PIPELINES, JSON.stringify(iniciales));
    } catch {
      // fallback
    }
    return iniciales;
  }

  private cargarTarjetasIniciales(): TarjetaPipeline[] {
    try {
      const guardado = localStorage.getItem(CLAVE_STORAGE_TARJETAS);
      if (guardado) {
        const parsed: TarjetaPipeline[] = JSON.parse(guardado);
        if (Array.isArray(parsed)) {
          parsed.forEach((t, idx) => {
            if (t.orden === undefined) t.orden = idx + 1;
          });
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return [];
  }

  private guardarPipelines(): void {
    try {
      localStorage.setItem(CLAVE_STORAGE_PIPELINES, JSON.stringify(this.memoriaPipelines));
    } catch {
      // fallback
    }
  }

  private guardarTarjetas(): void {
    try {
      localStorage.setItem(CLAVE_STORAGE_TARJETAS, JSON.stringify(this.memoriaTarjetas));
    } catch {
      // fallback
    }
  }

  // --- GESTIÓN DE PIPELINES / CANVASES ---

  async obtenerPipelines(): Promise<Pipeline[]> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    return JSON.parse(JSON.stringify(this.memoriaPipelines));
  }

  async obtenerPipelinePorId(id: string): Promise<Pipeline | null> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const p = this.memoriaPipelines.find((item) => item.id === id);
    return p ? JSON.parse(JSON.stringify(p)) : null;
  }

  async crearPipeline(input: CrearPipelineInput): Promise<Pipeline> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const nuevoId = `pipeline-${input.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || this.generarId('pipe')}`;

    if (input.columnas.length > LIMITE_MAXIMO_COLUMNAS) {
      throw new Error(`El número máximo de columnas permitido es de ${LIMITE_MAXIMO_COLUMNAS} etapas.`);
    }

    const columnas: ColumnaPipeline[] = input.columnas.map((col, idx) => {
      let est = col.estado;
      if (!est) {
        if (col.es_completado) est = 'completado';
        else if (idx === 0) est = 'pendiente';
        else if (idx === input.columnas.length - 1) est = 'completado';
        else est = 'en_proceso';
      }
      return {
        id: `${nuevoId}-col-${idx + 1}`,
        titulo: col.titulo.trim(),
        color: col.color || 'border-zinc-500/40 text-zinc-300',
        bgBadge: col.bgBadge || 'bg-zinc-500/10 border-zinc-500/20',
        orden: idx + 1,
        estado: est,
        es_completado: est === 'completado' || !!col.es_completado,
      };
    });

    this.asegurarUnicoEstadoCompletado(columnas);

    const nuevoPipeline: Pipeline = {
      id: nuevoId,
      nombre: input.nombre.trim(),
      descripcion: input.descripcion?.trim() || '',
      tipo: input.tipo || 'personalizado',
      icono: input.tipo === 'visitas' ? 'MapPin' : 'Kanban',
      color: 'emerald',
      es_predeterminado: false,
      columnas,
      creado_en: new Date().toISOString(),
    };

    this.memoriaPipelines.push(nuevoPipeline);
    this.guardarPipelines();
    return JSON.parse(JSON.stringify(nuevoPipeline));
  }

  async actualizarPipeline(id: string, input: EditarPipelineInput): Promise<Pipeline> {
    await new Promise((resolve) => setTimeout(resolve, 120));
    const idx = this.memoriaPipelines.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Pipeline no encontrado');

    if (input.nombre !== undefined) this.memoriaPipelines[idx].nombre = input.nombre.trim();
    if (input.descripcion !== undefined) this.memoriaPipelines[idx].descripcion = input.descripcion.trim();

    this.guardarPipelines();
    return JSON.parse(JSON.stringify(this.memoriaPipelines[idx]));
  }

  async eliminarPipeline(id: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const pipe = this.memoriaPipelines.find((p) => p.id === id);
    if (!pipe) return false;
    if (pipe.es_predeterminado) {
      throw new Error('No es posible eliminar el pipeline predeterminado del sistema.');
    }

    this.memoriaPipelines = this.memoriaPipelines.filter((p) => p.id !== id);
    this.memoriaTarjetas = this.memoriaTarjetas.filter((t) => t.pipeline_id !== id);

    this.guardarPipelines();
    this.guardarTarjetas();
    return true;
  }

  // --- GESTIÓN DE COLUMNAS / ETAPAS (MÁXIMO 6 Y ÚNICO ESTADO COMPLETADO) ---

  async agregarColumna(pipelineId: string, input: CrearColumnaInput): Promise<ColumnaPipeline> {
    await new Promise((resolve) => setTimeout(resolve, 120));
    const pipeline = this.memoriaPipelines.find((p) => p.id === pipelineId);
    if (!pipeline) throw new Error('Pipeline no encontrado');

    if (pipeline.columnas.length >= LIMITE_MAXIMO_COLUMNAS) {
      throw new Error(`Se ha alcanzado el límite máximo de ${LIMITE_MAXIMO_COLUMNAS} etapas por tablero para mantener métricas claras.`);
    }

    let est = input.estado;
    // Si intentaron asignarle completado a una nueva columna, se fija a en_proceso
    // porque completado es exclusivamente la última etapa
    if (!est || est === 'completado') {
      est = 'en_proceso';
    }

    const nuevaColumna: ColumnaPipeline = {
      id: `${pipelineId}-col-${this.generarId('stage')}`,
      titulo: input.titulo.trim(),
      color: input.color,
      bgBadge: input.bgBadge,
      orden: pipeline.columnas.length + 1,
      estado: est,
      es_completado: false,
    };

    // La nueva columna siempre se inserta ARRIBA de la última etapa (antes de completado)
    const posicionInsercion = Math.max(0, pipeline.columnas.length - 1);
    pipeline.columnas.splice(posicionInsercion, 0, nuevaColumna);

    this.asegurarUnicoEstadoCompletado(pipeline.columnas);
    pipeline.columnas.forEach((c, idx) => {
      c.orden = idx + 1;
    });

    this.guardarPipelines();
    return JSON.parse(JSON.stringify(nuevaColumna));
  }

  async actualizarColumna(
    pipelineId: string,
    columnaId: string,
    datos: EditarColumnaInput
  ): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const pipeline = this.memoriaPipelines.find((p) => p.id === pipelineId);
    if (!pipeline) return false;

    const idx = pipeline.columnas.findIndex((c) => c.id === columnaId);
    if (idx === -1) return false;
    const col = pipeline.columnas[idx];

    if (datos.titulo !== undefined) col.titulo = datos.titulo.trim();
    if (datos.color !== undefined) col.color = datos.color;
    if (datos.bgBadge !== undefined) col.bgBadge = datos.bgBadge;

    // Si es la última columna del tablero, su estado siempre es completado
    if (idx === pipeline.columnas.length - 1) {
      col.estado = 'completado';
      col.es_completado = true;
    } else if (datos.estado !== undefined) {
      // Las columnas intermedias no pueden ser completado
      col.estado = datos.estado === 'completado' ? 'en_proceso' : datos.estado;
      col.es_completado = false;
    }

    this.asegurarUnicoEstadoCompletado(pipeline.columnas);

    this.guardarPipelines();
    return true;
  }

  async eliminarColumna(pipelineId: string, columnaId: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 120));
    const pipeline = this.memoriaPipelines.find((p) => p.id === pipelineId);
    if (!pipeline) return false;

    if (pipeline.columnas.length <= 1) {
      throw new Error('Un pipeline debe tener al menos una columna activa.');
    }

    pipeline.columnas = pipeline.columnas
      .filter((c) => c.id !== columnaId)
      .map((c, idx) => ({ ...c, orden: idx + 1 }));

    this.asegurarUnicoEstadoCompletado(pipeline.columnas);

    // Mover tarjetas de la columna eliminada a la primera columna
    const primeraColumnaId = pipeline.columnas[0].id;
    this.memoriaTarjetas.forEach((t) => {
      if (t.pipeline_id === pipelineId && t.columna_id === columnaId) {
        t.columna_id = primeraColumnaId;
      }
    });

    this.guardarPipelines();
    this.guardarTarjetas();
    return true;
  }

  async moverColumnaPosicion(
    pipelineId: string,
    columnaId: string,
    direccion: 'izquierda' | 'derecha'
  ): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const pipeline = this.memoriaPipelines.find((p) => p.id === pipelineId);
    if (!pipeline) return false;

    const idx = pipeline.columnas.findIndex((c) => c.id === columnaId);
    if (idx === -1) return false;

    const nuevoIdx = direccion === 'izquierda' ? idx - 1 : idx + 1;
    if (nuevoIdx < 0 || nuevoIdx >= pipeline.columnas.length) return false;

    const ultimoIdx = pipeline.columnas.length - 1;
    // La última columna siempre es Completado: nunca se puede mover
    if (idx === ultimoIdx) return false;
    // Ninguna columna intermedia puede moverse a la derecha pasando a la última
    if (direccion === 'derecha' && nuevoIdx >= ultimoIdx) return false;

    const temp = pipeline.columnas[idx];
    pipeline.columnas[idx] = pipeline.columnas[nuevoIdx];
    pipeline.columnas[nuevoIdx] = temp;

    pipeline.columnas.forEach((c, i) => {
      c.orden = i + 1;
    });

    this.guardarPipelines();
    return true;
  }

  // --- MÉTRICAS DE PROGRESO DEL PIPELINE ---

  async obtenerMetricasProgreso(pipelineId: string): Promise<MetricasProgresoPipeline> {
    const pipeline = await this.obtenerPipelinePorId(pipelineId);
    const tarjetas = await this.obtenerTarjetas(pipelineId);

    const columnaCompletada = pipeline?.columnas.find((c) => c.estado === 'completado' || c.es_completado) || pipeline?.columnas[pipeline?.columnas.length - 1];
    const columnaCompletadaId = columnaCompletada?.id || '';
    const columnaCompletadaTitulo = columnaCompletada?.titulo || 'Completado';

    const colsPendientesIds = new Set(
      pipeline?.columnas.filter((c) => c.estado === 'pendiente').map((c) => c.id) || []
    );
    const colsEnProcesoIds = new Set(
      pipeline?.columnas.filter((c) => c.estado === 'en_proceso').map((c) => c.id) || []
    );
    const colsBloqueadasIds = new Set(
      pipeline?.columnas.filter((c) => c.estado === 'bloqueado').map((c) => c.id) || []
    );

    const total = tarjetas.length;
    const completadas = tarjetas.filter((t) => t.columna_id === columnaCompletadaId).length;
    const enProceso = tarjetas.filter((t) => colsEnProcesoIds.has(t.columna_id)).length;
    const bloqueadas = tarjetas.filter((t) => colsBloqueadasIds.has(t.columna_id)).length;
    const pendientes = tarjetas.filter(
      (t) =>
        colsPendientesIds.has(t.columna_id) ||
        (t.columna_id !== columnaCompletadaId &&
          !colsEnProcesoIds.has(t.columna_id) &&
          !colsBloqueadasIds.has(t.columna_id))
    ).length;
    const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;

    const montoCompletado = tarjetas
      .filter((t) => t.columna_id === columnaCompletadaId)
      .reduce((acc, t) => acc + (t.monto || 0), 0);

    const montoEnProceso = tarjetas
      .filter((t) => colsEnProcesoIds.has(t.columna_id))
      .reduce((acc, t) => acc + (t.monto || 0), 0);

    const montoBloqueado = tarjetas
      .filter((t) => colsBloqueadasIds.has(t.columna_id))
      .reduce((acc, t) => acc + (t.monto || 0), 0);

    const montoPendiente = tarjetas
      .filter(
        (t) =>
          colsPendientesIds.has(t.columna_id) ||
          (t.columna_id !== columnaCompletadaId &&
            !colsEnProcesoIds.has(t.columna_id) &&
            !colsBloqueadasIds.has(t.columna_id))
      )
      .reduce((acc, t) => acc + (t.monto || 0), 0);

    return {
      total,
      completadas,
      enProceso,
      bloqueadas,
      pendientes,
      porcentaje,
      columnaCompletadaId,
      columnaCompletadaTitulo,
      montoCompletado,
      montoEnProceso,
      montoBloqueado,
      montoPendiente,
    };
  }

  async obtenerResumenPipelines(): Promise<ResumenPipelineItem[]> {
    const pipelines = await this.obtenerPipelines();
    const resumen: ResumenPipelineItem[] = [];

    for (const pipe of pipelines) {
      const metricas = await this.obtenerMetricasProgreso(pipe.id);
      resumen.push({
        id: pipe.id,
        nombre: pipe.nombre,
        descripcion: pipe.descripcion,
        tipo: pipe.tipo,
        es_predeterminado: pipe.es_predeterminado,
        columnasCount: pipe.columnas.length,
        totalTarjetas: metricas.total,
        completadas: metricas.completadas,
        enProceso: metricas.enProceso,
        bloqueadas: metricas.bloqueadas,
        pendientes: metricas.pendientes,
        porcentaje: metricas.porcentaje,
        montoTotal: metricas.montoCompletado + metricas.montoEnProceso + metricas.montoPendiente,
      });
    }

    return resumen;
  }

  // --- GESTIÓN Y ORDENAMIENTO VERTICAL DE TARJETAS ---

  async obtenerTarjetas(pipelineId: string, filtros?: FiltrosPipeline): Promise<TarjetaPipeline[]> {
    await new Promise((resolve) => setTimeout(resolve, 80));

    let resultado: TarjetaPipeline[] = [];

    if (pipelineId === 'pipeline-comercial') {
      const oportunidadesOriginales = await clienteService.obtenerTodasLasOportunidades();
      // Aseguramos que todas las oportunidades se inicialicen en memoriaTarjetas si no existen
      for (let idx = 0; idx < oportunidadesOriginales.length; idx++) {
        const op = oportunidadesOriginales[idx];
        const existente = this.memoriaTarjetas.find((t) => t.id === op.id);
        if (!existente) {
          this.memoriaTarjetas.push({
            id: op.id,
            pipeline_id: 'pipeline-comercial',
            columna_id: op.etapa,
            cliente_id: op.cliente_id,
            cliente_nombre: op.cliente_nombre,
            cliente_sector: op.cliente_sector,
            responsable: op.responsable,
            titulo: op.titulo,
            monto: op.monto,
            fecha_objetivo: op.fecha_cierre_estimada,
            probabilidad: op.probabilidad,
            prioridad: op.probabilidad >= 70 ? 'alta' : op.probabilidad >= 40 ? 'media' : 'baja',
            orden: idx + 1,
            creado_en: op.creado_en,
          });
        }
      }
      this.guardarTarjetas();
      resultado = this.memoriaTarjetas.filter((t) => t.pipeline_id === 'pipeline-comercial');
    } else {
      if (
        pipelineId === 'pipeline-visitas' &&
        this.memoriaTarjetas.filter((t) => t.pipeline_id === 'pipeline-visitas').length === 0
      ) {
        await this.sembrarVisitasDemostracion();
      }

      resultado = this.memoriaTarjetas.filter((t) => t.pipeline_id === pipelineId);
    }

    // Filtros
    if (filtros?.responsable && filtros.responsable !== '') {
      resultado = resultado.filter((t) => t.responsable === filtros.responsable);
    }

    if (filtros?.sector && filtros.sector !== '') {
      resultado = resultado.filter((t) => t.cliente_sector === filtros.sector);
    }

    if (filtros?.prioridad && filtros.prioridad !== '') {
      resultado = resultado.filter((t) => t.prioridad === filtros.prioridad);
    }

    if (filtros?.busqueda && filtros.busqueda.trim() !== '') {
      const q = filtros.busqueda.toLowerCase().trim();
      resultado = resultado.filter(
        (t) =>
          t.titulo.toLowerCase().includes(q) ||
          t.cliente_nombre.toLowerCase().includes(q) ||
          (t.notas && t.notas.toLowerCase().includes(q))
      );
    }

    // Ordenar de manera vertical según la propiedad `orden`
    resultado.sort((a, b) => (a.orden || 0) - (b.orden || 0));

    return JSON.parse(JSON.stringify(resultado));
  }

  private async sembrarVisitasDemostracion(): Promise<void> {
    const clientes = await this.obtenerClientesParaSelector();
    if (clientes.length === 0) return;

    const fechaActual = new Date();
    const formatoFecha = (diasAdicionales: number) => {
      const d = new Date(fechaActual.getTime() + diasAdicionales * 24 * 60 * 60 * 1000);
      return d.toISOString().slice(0, 10);
    };

    const visitasSemilla: TarjetaPipeline[] = [
      {
        id: this.generarId('visita'),
        pipeline_id: 'pipeline-visitas',
        columna_id: 'por_agendar',
        cliente_id: clientes[0]?.id || '',
        cliente_nombre: clientes[0]?.nombre_comercial || clientes[0]?.razon_social || 'Cliente Principal',
        cliente_sector: 'Tecnología y Servicios',
        responsable: 'Carlos Mendoza',
        titulo: 'Contacto inicial para agendar visita a planta matriz',
        monto: 1250000,
        fecha_objetivo: formatoFecha(3),
        prioridad: 'alta',
        notas: 'Coordinar con Jefe de Operaciones para inspección de infraestructura.',
        orden: 1,
        creado_en: new Date().toISOString(),
      },
      {
        id: this.generarId('visita'),
        pipeline_id: 'pipeline-visitas',
        columna_id: 'visita_programada',
        cliente_id: clientes[1]?.id || clientes[0]?.id || '',
        cliente_nombre: clientes[1]?.nombre_comercial || clientes[1]?.razon_social || 'Cliente Secundario',
        cliente_sector: 'Manufactura e Industria',
        responsable: 'Ana Rodríguez',
        titulo: 'Demostración técnica de nuevos equipos en sede industrial',
        monto: 3400000,
        fecha_objetivo: formatoFecha(5),
        prioridad: 'alta',
        notas: 'Llevar catálogo técnico impreso y muestras para laboratorio de calidad.',
        orden: 1,
        creado_en: new Date().toISOString(),
      },
      {
        id: this.generarId('visita'),
        pipeline_id: 'pipeline-visitas',
        columna_id: 'en_visita',
        cliente_id: clientes[2]?.id || clientes[0]?.id || '',
        cliente_nombre: clientes[2]?.nombre_comercial || clientes[2]?.razon_social || 'Cliente Corporativo',
        cliente_sector: 'Distribución y Logística',
        responsable: 'Laura Martínez',
        titulo: 'Reunión ejecutiva presencial y validación de contrato',
        monto: 890000,
        fecha_objetivo: formatoFecha(0),
        prioridad: 'media',
        notas: 'En ruta comercial en la sede centro. Presentación con Gerencia General.',
        orden: 1,
        creado_en: new Date().toISOString(),
      },
      {
        id: this.generarId('visita'),
        pipeline_id: 'pipeline-visitas',
        columna_id: 'visita_bloqueada',
        cliente_id: clientes[3]?.id || clientes[0]?.id || '',
        cliente_nombre: clientes[3]?.nombre_comercial || clientes[3]?.razon_social || 'Cliente con Observaciones',
        cliente_sector: 'Construcción e Infraestructura',
        responsable: 'Carlos Mendoza',
        titulo: 'Acceso denegado temporalmente por mantenimiento de planta',
        monto: 1600000,
        fecha_objetivo: formatoFecha(1),
        prioridad: 'alta',
        notas: 'Visita suspendida temporalmente por protocolos de seguridad interna. Reagendar la próxima semana.',
        orden: 1,
        creado_en: new Date().toISOString(),
      },
      {
        id: this.generarId('visita'),
        pipeline_id: 'pipeline-visitas',
        columna_id: 'visita_realizada',
        cliente_id: clientes[2]?.id || clientes[0]?.id || '',
        cliente_nombre: clientes[2]?.nombre_comercial || clientes[2]?.razon_social || 'Cliente Industrial',
        cliente_sector: 'Agroindustria',
        responsable: 'Carlos Mendoza',
        titulo: 'Levantamiento de requerimientos concluido con éxito',
        monto: 2150000,
        fecha_objetivo: formatoFecha(-2),
        prioridad: 'baja',
        notas: 'Visita completada satisfactoriamente. Proceder con el envío de cotización formal.',
        orden: 1,
        creado_en: new Date().toISOString(),
      },
    ];

    this.memoriaTarjetas.push(...visitasSemilla);
    this.guardarTarjetas();
  }

  async crearTarjeta(input: CrearTarjetaInput): Promise<TarjetaPipeline> {
    await new Promise((resolve) => setTimeout(resolve, 120));
    const cliente = await clienteService.obtenerClientePorId(input.cliente_id);
    if (!cliente) throw new Error('Cliente seleccionado no encontrado.');

    // Calcular el orden dentro de su columna
    const tarjetasMismaColumna = this.memoriaTarjetas.filter(
      (t) => t.pipeline_id === input.pipeline_id && t.columna_id === input.columna_id
    );
    const maxOrden = tarjetasMismaColumna.reduce((max, t) => Math.max(max, t.orden || 0), 0);

    const nuevaTarjeta: TarjetaPipeline = {
      id: this.generarId('tarjeta'),
      pipeline_id: input.pipeline_id,
      columna_id: input.columna_id,
      cliente_id: input.cliente_id,
      cliente_nombre: cliente.nombre_comercial || cliente.razon_social,
      cliente_sector: cliente.sector,
      responsable: cliente.responsable || 'Equipo Comercial',
      titulo: input.titulo.trim(),
      monto: input.monto !== undefined ? Number(input.monto) : 0,
      fecha_objetivo: input.fecha_objetivo,
      probabilidad: input.probabilidad !== undefined ? Number(input.probabilidad) : 50,
      notas: input.notas?.trim() || '',
      prioridad: input.prioridad || 'media',
      orden: input.orden !== undefined ? input.orden : maxOrden + 1,
      creado_en: new Date().toISOString(),
    };

    if (
      input.pipeline_id === 'pipeline-comercial' &&
      ['calificacion', 'propuesta', 'negociacion', 'ganada', 'perdida'].includes(input.columna_id)
    ) {
      try {
        await clienteService.agregarOportunidad(input.cliente_id, {
          titulo: input.titulo,
          monto: input.monto || 0,
          etapa: input.columna_id as EtapaOportunidad,
          probabilidad: input.probabilidad || 50,
          fecha_cierre_estimada: input.fecha_objetivo,
        });
      } catch {
        // fallback
      }
    }

    this.memoriaTarjetas.push(nuevaTarjeta);
    this.guardarTarjetas();
    return JSON.parse(JSON.stringify(nuevaTarjeta));
  }

  async crearMultiplesTarjetas(input: CrearMultiplesTarjetasInput): Promise<TarjetaPipeline[]> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const creadas: TarjetaPipeline[] = [];

    for (const clienteId of input.cliente_ids) {
      const cliente = await clienteService.obtenerClientePorId(clienteId);
      if (!cliente) continue;

      const tituloPorDefecto = input.titulo?.trim() || `Visita a ${cliente.nombre_comercial || cliente.razon_social}`;

      const tarjeta = await this.crearTarjeta({
        pipeline_id: input.pipeline_id,
        columna_id: input.columna_id,
        cliente_id: clienteId,
        titulo: tituloPorDefecto,
        monto: input.monto,
        fecha_objetivo: input.fecha_objetivo,
        probabilidad: input.probabilidad,
        notas: input.notas,
        prioridad: input.prioridad,
      });

      creadas.push(tarjeta);
    }

    return creadas;
  }

  // Mover tarjeta a otra columna o reordenar posición vertical
  async moverTarjetaColumna(
    pipelineId: string,
    tarjetaId: string,
    nuevaColumnaId: string,
    nuevoIndice?: number
  ): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 30));

    // 1. Si no existe en memoria, aseguramos la carga inicial del pipeline
    let tarjeta = this.memoriaTarjetas.find((t) => t.id === tarjetaId);
    if (!tarjeta) {
      await this.obtenerTarjetas(pipelineId);
      tarjeta = this.memoriaTarjetas.find((t) => t.id === tarjetaId);
    }

    if (!tarjeta) {
      // Si aún no está en memoria, la creamos en memoria para no perder el cambio
      console.warn(`[PipelineService] Tarjeta ${tarjetaId} registrada dinámicamente en pipeline ${pipelineId}`);
      tarjeta = {
        id: tarjetaId,
        pipeline_id: pipelineId,
        columna_id: nuevaColumnaId,
        cliente_id: '',
        cliente_nombre: 'Elemento Reubicado',
        cliente_sector: 'General',
        responsable: 'Equipo Comercial',
        fecha_objetivo: new Date().toISOString().slice(0, 10),
        titulo: 'Elemento de Tablero',
        monto: 0,
        prioridad: 'media',
        orden: 1,
        creado_en: new Date().toISOString(),
      };
      this.memoriaTarjetas.push(tarjeta);
    } else {
      tarjeta.columna_id = nuevaColumnaId;
      tarjeta.pipeline_id = pipelineId;
    }

    // 2. Si el pipeline es comercial y la columna coincide con una etapa válida de oportunidad, sincronizar clienteService
    if (
      pipelineId === 'pipeline-comercial' &&
      ['calificacion', 'propuesta', 'negociacion', 'ganada', 'perdida'].includes(nuevaColumnaId)
    ) {
      try {
        await clienteService.moverEtapaOportunidad(tarjetaId, nuevaColumnaId as EtapaOportunidad);
      } catch {
        // continuar
      }
    }

    // 3. Reordenar dentro de la columna destino
    const tarjetasDestino = this.memoriaTarjetas
      .filter((t) => t.pipeline_id === pipelineId && t.columna_id === nuevaColumnaId && t.id !== tarjetaId)
      .sort((a, b) => (a.orden || 0) - (b.orden || 0));

    const tarjetaAMover: TarjetaPipeline = tarjeta;
    if (nuevoIndice !== undefined && nuevoIndice >= 0 && nuevoIndice <= tarjetasDestino.length) {
      tarjetasDestino.splice(nuevoIndice, 0, tarjetaAMover);
    } else {
      tarjetasDestino.push(tarjetaAMover);
    }

    // Reasignar órdenes secuenciales
    tarjetasDestino.forEach((t, idx) => {
      t.orden = idx + 1;
    });

    this.guardarTarjetas();
    return true;
  }

  // Reordenar arriba / abajo dentro de su columna
  async moverTarjetaPosicionVertical(
    pipelineId: string,
    tarjetaId: string,
    direccion: 'arriba' | 'abajo'
  ): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 30));

    let tarjeta = this.memoriaTarjetas.find((t) => t.id === tarjetaId);
    if (!tarjeta) {
      await this.obtenerTarjetas(pipelineId);
      tarjeta = this.memoriaTarjetas.find((t) => t.id === tarjetaId);
    }
    if (!tarjeta) return false;

    const columnaId = tarjeta.columna_id;
    const tarjetasColumna = this.memoriaTarjetas
      .filter((t) => t.pipeline_id === pipelineId && t.columna_id === columnaId)
      .sort((a, b) => a.orden - b.orden);

    const index = tarjetasColumna.findIndex((t) => t.id === tarjetaId);
    if (index === -1) return false;

    const targetIndex = direccion === 'arriba' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tarjetasColumna.length) return false;

    const itemActual = tarjetasColumna[index];
    const itemDestino = tarjetasColumna[targetIndex];
    if (!itemActual || !itemDestino) return false;

    tarjetasColumna[index] = itemDestino;
    tarjetasColumna[targetIndex] = itemActual;

    tarjetasColumna.forEach((t, idx) => {
      t.orden = idx + 1;
    });

    this.guardarTarjetas();
    return true;
  }

  async eliminarTarjeta(pipelineId: string, clienteId: string, tarjetaId: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (pipelineId === 'pipeline-comercial') {
      try {
        await clienteService.eliminarOportunidad(clienteId, tarjetaId);
      } catch {
        // continuar
      }
    }

    this.memoriaTarjetas = this.memoriaTarjetas.filter((t) => t.id !== tarjetaId);
    this.guardarTarjetas();
    return true;
  }

  // --- MÉTODOS DE COMPATIBILIDAD CON VISTAS PREVIAS ---

  async obtenerOportunidades(filtros?: FiltrosPipeline): Promise<OportunidadConCliente[]> {
    const todas = await clienteService.obtenerTodasLasOportunidades();
    let resultado = [...todas];

    if (filtros?.responsable && filtros.responsable !== '') {
      resultado = resultado.filter((o) => o.responsable === filtros.responsable);
    }

    if (filtros?.sector && filtros.sector !== '') {
      resultado = resultado.filter((o) => o.cliente_sector === filtros.sector);
    }

    if (filtros?.busqueda && filtros.busqueda.trim() !== '') {
      const q = filtros.busqueda.toLowerCase().trim();
      resultado = resultado.filter(
        (o) =>
          o.titulo.toLowerCase().includes(q) ||
          o.cliente_nombre.toLowerCase().includes(q)
      );
    }

    return resultado;
  }

  async moverEtapa(oportunidadId: string, nuevaEtapa: EtapaOportunidad): Promise<boolean> {
    return await clienteService.moverEtapaOportunidad(oportunidadId, nuevaEtapa);
  }

  async crearOportunidad(input: NuevaOportunidadInput): Promise<OportunidadConCliente> {
    const cliente = await clienteService.obtenerClientePorId(input.cliente_id);
    if (!cliente) throw new Error('Cliente seleccionado no encontrado.');

    const opCreada = await clienteService.agregarOportunidad(input.cliente_id, {
      titulo: input.titulo,
      monto: input.monto,
      etapa: input.etapa,
      probabilidad: input.probabilidad,
      fecha_cierre_estimada: input.fecha_cierre_estimada,
    });

    return {
      ...opCreada,
      cliente_nombre: cliente.nombre_comercial || cliente.razon_social,
      cliente_sector: cliente.sector,
      responsable: cliente.responsable,
    };
  }

  async eliminarOportunidad(clienteId: string, oportunidadId: string): Promise<boolean> {
    return await clienteService.eliminarOportunidad(clienteId, oportunidadId);
  }

  async obtenerResponsables(): Promise<string[]> {
    const resp = await clienteService.obtenerClientes({ pagina: 1, tamanoPagina: 500, busqueda: '' });
    const setResp = new Set<string>();
    resp.datos.forEach((c) => {
      if (c.responsable) setResp.add(c.responsable);
    });
    return Array.from(setResp).sort();
  }

  async obtenerClientesParaSelector(): Promise<Array<{ id: string; razon_social: string; nombre_comercial?: string }>> {
    const resp = await clienteService.obtenerClientes({ pagina: 1, tamanoPagina: 500, busqueda: '' });
    return resp.datos.map((c) => ({
      id: c.id,
      razon_social: c.razon_social,
      nombre_comercial: c.nombre_comercial,
    }));
  }
}

export const pipelineService = new PipelineService();
