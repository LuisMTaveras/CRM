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
        es_completado: false,
      },
      {
        id: 'propuesta',
        titulo: 'Propuesta Enviada',
        color: 'border-indigo-500/40 text-indigo-400',
        bgBadge: 'bg-indigo-500/10 border-indigo-500/20',
        orden: 2,
        es_completado: false,
      },
      {
        id: 'negociacion',
        titulo: 'En Negociación',
        color: 'border-amber-500/40 text-amber-400',
        bgBadge: 'bg-amber-500/10 border-amber-500/20',
        orden: 3,
        es_completado: false,
      },
      {
        id: 'ganada',
        titulo: 'Cerrada Ganada',
        color: 'border-emerald-500/40 text-emerald-400',
        bgBadge: 'bg-emerald-500/10 border-emerald-500/20',
        orden: 4,
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
        es_completado: false,
      },
      {
        id: 'visita_programada',
        titulo: 'Visita Programada',
        color: 'border-sky-500/40 text-sky-400',
        bgBadge: 'bg-sky-500/10 border-sky-500/20',
        orden: 2,
        es_completado: false,
      },
      {
        id: 'en_visita',
        titulo: 'En Visita / Ruta',
        color: 'border-indigo-500/40 text-indigo-400',
        bgBadge: 'bg-indigo-500/10 border-indigo-500/20',
        orden: 3,
        es_completado: false,
      },
      {
        id: 'visita_realizada',
        titulo: 'Visita Realizada',
        color: 'border-emerald-500/40 text-emerald-400',
        bgBadge: 'bg-emerald-500/10 border-emerald-500/20',
        orden: 4,
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
    const completados = columnas.filter((c) => c.es_completado);
    if (completados.length === 0 && columnas.length > 0) {
      columnas[columnas.length - 1].es_completado = true;
    } else if (completados.length > 1) {
      // Dejar solo el último marcado como completado
      let yaDejoUno = false;
      for (let i = columnas.length - 1; i >= 0; i--) {
        if (columnas[i].es_completado) {
          if (!yaDejoUno) {
            yaDejoUno = true;
          } else {
            columnas[i].es_completado = false;
          }
        }
      }
    }
  }

  private cargarPipelinesIniciales(): Pipeline[] {
    try {
      const guardado = localStorage.getItem(CLAVE_STORAGE_PIPELINES);
      if (guardado) {
        const parsed: Pipeline[] = JSON.parse(guardado);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((pipe) => {
            this.asegurarUnicoEstadoCompletado(pipe.columnas);
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

    const columnas: ColumnaPipeline[] = input.columnas.map((col, idx) => ({
      id: `${nuevoId}-col-${idx + 1}`,
      titulo: col.titulo.trim(),
      color: col.color || 'border-zinc-500/40 text-zinc-300',
      bgBadge: col.bgBadge || 'bg-zinc-500/10 border-zinc-500/20',
      orden: idx + 1,
      es_completado: !!col.es_completado,
    }));

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

    const nuevoOrden = pipeline.columnas.length + 1;
    const nuevaColumna: ColumnaPipeline = {
      id: `${pipelineId}-col-${this.generarId('stage')}`,
      titulo: input.titulo.trim(),
      color: input.color,
      bgBadge: input.bgBadge,
      orden: nuevoOrden,
      es_completado: !!input.es_completado,
    };

    if (nuevaColumna.es_completado) {
      pipeline.columnas.forEach((c) => {
        c.es_completado = false;
      });
    }

    pipeline.columnas.push(nuevaColumna);
    this.asegurarUnicoEstadoCompletado(pipeline.columnas);
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

    const col = pipeline.columnas.find((c) => c.id === columnaId);
    if (!col) return false;

    if (datos.titulo !== undefined) col.titulo = datos.titulo.trim();
    if (datos.color !== undefined) col.color = datos.color;
    if (datos.bgBadge !== undefined) col.bgBadge = datos.bgBadge;

    if (datos.es_completado !== undefined) {
      if (datos.es_completado) {
        // Desmarcar todas las otras columnas
        pipeline.columnas.forEach((c) => {
          c.es_completado = c.id === columnaId;
        });
      } else {
        col.es_completado = false;
        this.asegurarUnicoEstadoCompletado(pipeline.columnas);
      }
    }

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

    const columnaCompletada = pipeline?.columnas.find((c) => c.es_completado) || pipeline?.columnas[pipeline?.columnas.length - 1];
    const columnaCompletadaId = columnaCompletada?.id || '';
    const columnaCompletadaTitulo = columnaCompletada?.titulo || 'Completado';

    const total = tarjetas.length;
    const completadas = tarjetas.filter((t) => t.columna_id === columnaCompletadaId).length;
    const pendientes = total - completadas;
    const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;

    const montoCompletado = tarjetas
      .filter((t) => t.columna_id === columnaCompletadaId)
      .reduce((acc, t) => acc + (t.monto || 0), 0);

    const montoPendiente = tarjetas
      .filter((t) => t.columna_id !== columnaCompletadaId)
      .reduce((acc, t) => acc + (t.monto || 0), 0);

    return {
      total,
      completadas,
      pendientes,
      porcentaje,
      columnaCompletadaId,
      columnaCompletadaTitulo,
      montoCompletado,
      montoPendiente,
    };
  }

  // --- GESTIÓN Y ORDENAMIENTO VERTICAL DE TARJETAS ---

  async obtenerTarjetas(pipelineId: string, filtros?: FiltrosPipeline): Promise<TarjetaPipeline[]> {
    await new Promise((resolve) => setTimeout(resolve, 80));

    let resultado: TarjetaPipeline[] = [];

    if (pipelineId === 'pipeline-comercial') {
      const oportunidadesOriginales = await clienteService.obtenerTodasLasOportunidades();
      resultado = oportunidadesOriginales.map((op, idx) => ({
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
      }));

      const manuales = this.memoriaTarjetas.filter((t) => t.pipeline_id === 'pipeline-comercial');
      resultado = [...resultado, ...manuales];
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
        columna_id: 'visita_realizada',
        cliente_id: clientes[3]?.id || clientes[0]?.id || '',
        cliente_nombre: clientes[3]?.nombre_comercial || clientes[3]?.razon_social || 'Cliente Industrial',
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
    await new Promise((resolve) => setTimeout(resolve, 80));

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

    const tarjeta = this.memoriaTarjetas.find((t) => t.id === tarjetaId);
    if (!tarjeta) return true;

    tarjeta.columna_id = nuevaColumnaId;

    // Obtener tarjetas restantes en la columna destino
    const tarjetasDestino = this.memoriaTarjetas
      .filter((t) => t.pipeline_id === pipelineId && t.columna_id === nuevaColumnaId && t.id !== tarjetaId)
      .sort((a, b) => a.orden - b.orden);

    if (nuevoIndice !== undefined && nuevoIndice >= 0 && nuevoIndice <= tarjetasDestino.length) {
      tarjetasDestino.splice(nuevoIndice, 0, tarjeta);
    } else {
      tarjetasDestino.push(tarjeta);
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
    await new Promise((resolve) => setTimeout(resolve, 60));

    const tarjeta = this.memoriaTarjetas.find((t) => t.id === tarjetaId);
    if (!tarjeta) return false;

    const columnaId = tarjeta.columna_id;
    const tarjetasColumna = this.memoriaTarjetas
      .filter((t) => t.pipeline_id === pipelineId && t.columna_id === columnaId)
      .sort((a, b) => a.orden - b.orden);

    const index = tarjetasColumna.findIndex((t) => t.id === tarjetaId);
    if (index === -1) return false;

    const targetIndex = direccion === 'arriba' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tarjetasColumna.length) return false;

    // Intercambiar
    const temp = tarjetasColumna[index];
    tarjetasColumna[index] = tarjetasColumna[targetIndex];
    tarjetasColumna[targetIndex] = temp;

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
