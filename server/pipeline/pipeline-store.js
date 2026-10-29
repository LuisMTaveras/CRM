import crypto from 'node:crypto';
import { crearColeccionDesdeEntorno } from '../storage/json-store.js';

export const LIMITE_MAXIMO_COLUMNAS = 10;
const ESTADOS_ETAPA = ['pendiente', 'en_proceso', 'bloqueado', 'completado'];
const TIPOS_PIPELINE = ['ventas', 'visitas', 'operaciones', 'personalizado'];
const PRIORIDADES_TARJETA = ['alta', 'media', 'baja'];

const PIPELINES_INICIALES = [
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
      { id: 'calificacion', titulo: 'Calificacion', color: 'border-sky-500/40 text-sky-400', bgBadge: 'bg-sky-500/10 border-sky-500/20', estado: 'pendiente' },
      { id: 'propuesta', titulo: 'Propuesta Enviada', color: 'border-indigo-500/40 text-indigo-400', bgBadge: 'bg-indigo-500/10 border-indigo-500/20', estado: 'en_proceso' },
      { id: 'negociacion', titulo: 'En Negociacion', color: 'border-amber-500/40 text-amber-400', bgBadge: 'bg-amber-500/10 border-amber-500/20', estado: 'en_proceso' },
      { id: 'trato_bloqueado', titulo: 'Trato En Pausa / Bloqueado', color: 'border-rose-500/40 text-rose-400', bgBadge: 'bg-rose-500/10 border-rose-500/20', estado: 'bloqueado' },
      { id: 'ganada', titulo: 'Cerrada Ganada', color: 'border-emerald-500/40 text-emerald-400', bgBadge: 'bg-emerald-500/10 border-emerald-500/20', estado: 'completado' },
    ],
  },
  {
    id: 'pipeline-visitas',
    nombre: 'Clientes A Visitar',
    descripcion: 'Planificacion y control de visitas comerciales, demostraciones y auditorias en terreno.',
    tipo: 'visitas',
    icono: 'MapPin',
    color: 'sky',
    es_predeterminado: false,
    creado_en: '2026-02-01T10:00:00Z',
    columnas: [
      { id: 'por_agendar', titulo: 'Por Agendar', color: 'border-amber-500/40 text-amber-400', bgBadge: 'bg-amber-500/10 border-amber-500/20', estado: 'pendiente' },
      { id: 'visita_programada', titulo: 'Visita Programada', color: 'border-sky-500/40 text-sky-400', bgBadge: 'bg-sky-500/10 border-sky-500/20', estado: 'en_proceso' },
      { id: 'en_visita', titulo: 'En Visita / Ruta', color: 'border-indigo-500/40 text-indigo-400', bgBadge: 'bg-indigo-500/10 border-indigo-500/20', estado: 'en_proceso' },
      { id: 'visita_bloqueada', titulo: 'Visita Pospuesta / Bloqueada', color: 'border-rose-500/40 text-rose-400', bgBadge: 'bg-rose-500/10 border-rose-500/20', estado: 'bloqueado' },
      { id: 'visita_realizada', titulo: 'Visita Realizada', color: 'border-emerald-500/40 text-emerald-400', bgBadge: 'bg-emerald-500/10 border-emerald-500/20', estado: 'completado' },
    ],
  },
];

function texto(valor, limite = 500) {
  return String(valor ?? '').trim().slice(0, limite);
}

function numero(valor) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

function booleano(valor) {
  return valor === true || valor === 'true' || valor === 1 || valor === '1';
}

function fechaIso(valor) {
  if (!valor) return new Date().toISOString();
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? new Date().toISOString() : fecha.toISOString();
}

function fechaCorta(valor) {
  if (!valor) return new Date().toISOString().slice(0, 10);
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? new Date().toISOString().slice(0, 10) : fecha.toISOString().slice(0, 10);
}

function errorValidacion(mensaje, estado = 400) {
  const error = new Error(mensaje);
  error.estado = estado;
  return error;
}

function slug(valor, respaldo) {
  const limpio = texto(valor, 120)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return limpio || respaldo;
}

function normalizarColumnas(columnas) {
  const lista = (Array.isArray(columnas) ? columnas : []).map((columna, indice) => ({
    id: texto(columna?.id, 120) || `col-${crypto.randomUUID()}`,
    titulo: texto(columna?.titulo, 160) || `Etapa ${indice + 1}`,
    color: texto(columna?.color, 200) || 'border-zinc-500/40 text-zinc-300',
    bgBadge: texto(columna?.bgBadge, 200) || 'bg-zinc-500/10 border-zinc-500/20',
    orden: indice + 1,
    estado: ESTADOS_ETAPA.includes(columna?.estado) ? columna.estado : indice === 0 ? 'pendiente' : 'en_proceso',
    es_completado: false,
  }));

  return asegurarUnicoEstadoCompletado(lista);
}

function asegurarUnicoEstadoCompletado(columnas) {
  const total = columnas.length;
  columnas.forEach((columna, indice) => {
    columna.orden = indice + 1;
    if (indice === total - 1) {
      columna.estado = 'completado';
      columna.es_completado = true;
      return;
    }
    if (!ESTADOS_ETAPA.includes(columna.estado) || columna.estado === 'completado') {
      columna.estado = indice === 0 ? 'pendiente' : 'en_proceso';
    }
    columna.es_completado = false;
  });
  return columnas;
}

function normalizarPipeline(datos, { id, creado_en } = {}) {
  const columnas = normalizarColumnas(datos?.columnas);
  return {
    id: texto(id || datos?.id, 120),
    nombre: texto(datos?.nombre, 200),
    descripcion: texto(datos?.descripcion, 500),
    tipo: TIPOS_PIPELINE.includes(datos?.tipo) ? datos.tipo : 'personalizado',
    icono: texto(datos?.icono, 60) || 'Kanban',
    color: texto(datos?.color, 60) || 'emerald',
    es_predeterminado: booleano(datos?.es_predeterminado),
    columnas,
    creado_en: creado_en || fechaIso(datos?.creado_en),
  };
}

function normalizarTarjeta(datos, { id, pipeline_id, creado_en } = {}) {
  return {
    id: texto(id || datos?.id, 120) || `tarjeta-${crypto.randomUUID()}`,
    pipeline_id: texto(pipeline_id || datos?.pipeline_id, 120),
    columna_id: texto(datos?.columna_id, 120),
    cliente_id: texto(datos?.cliente_id, 120),
    cliente_nombre: texto(datos?.cliente_nombre, 240),
    cliente_sector: texto(datos?.cliente_sector, 160),
    responsable: texto(datos?.responsable, 160) || 'Equipo Comercial',
    titulo: texto(datos?.titulo, 240),
    monto: Math.max(0, numero(datos?.monto)),
    fecha_objetivo: fechaCorta(datos?.fecha_objetivo),
    probabilidad: Math.min(100, Math.max(0, numero(datos?.probabilidad ?? 50))),
    notas: texto(datos?.notas, 4000),
    prioridad: PRIORIDADES_TARJETA.includes(datos?.prioridad) ? datos.prioridad : 'media',
    orden: Math.max(1, Number.parseInt(datos?.orden, 10) || 1),
    creado_en: creado_en || fechaIso(datos?.creado_en),
    motivo_cierre: texto(datos?.motivo_cierre, 500) || undefined,
    notas_cierre: texto(datos?.notas_cierre, 2000) || undefined,
    fecha_cambio_etapa: datos?.fecha_cambio_etapa ? fechaIso(datos.fecha_cambio_etapa) : undefined,
  };
}

function compararTarjetas(a, b) {
  return (a.orden || 0) - (b.orden || 0) || String(a.creado_en).localeCompare(String(b.creado_en));
}

function reordenarColumna(tarjetas, pipelineId, columnaId) {
  tarjetas
    .filter((tarjeta) => tarjeta.pipeline_id === pipelineId && tarjeta.columna_id === columnaId)
    .sort(compararTarjetas)
    .forEach((tarjeta, indice) => {
      tarjeta.orden = indice + 1;
    });
}

export function crearAlmacenPipelines(coleccionPipelines, coleccionTarjetas) {
  const leerPipelines = () => {
    coleccionPipelines.recargar();
    return coleccionPipelines.todos();
  };

  const leerTarjetas = () => {
    coleccionTarjetas.recargar();
    return coleccionTarjetas.todos();
  };

  const obtenerPipeline = (id) => {
    const buscado = texto(id, 120);
    return leerPipelines().find((pipeline) => pipeline.id === buscado) || null;
  };

  const obtenerTarjeta = (id) => {
    const buscado = texto(id, 120);
    return leerTarjetas().find((tarjeta) => tarjeta.id === buscado) || null;
  };

  const guardarPipeline = (pipeline) => {
    const actualizado = coleccionPipelines.reemplazar(pipeline.id, pipeline);
    return actualizado;
  };

  const guardarTarjeta = (tarjeta) => coleccionTarjetas.reemplazar(tarjeta.id, tarjeta);

  const metricasPipeline = (pipeline, tarjetas) => {
    const columnaCompletada = pipeline.columnas.find((columna) => columna.es_completado)
      || pipeline.columnas[pipeline.columnas.length - 1];
    const columnaCompletadaId = columnaCompletada?.id || '';
    const sets = {
      pendiente: new Set(pipeline.columnas.filter((c) => c.estado === 'pendiente').map((c) => c.id)),
      en_proceso: new Set(pipeline.columnas.filter((c) => c.estado === 'en_proceso').map((c) => c.id)),
      bloqueado: new Set(pipeline.columnas.filter((c) => c.estado === 'bloqueado').map((c) => c.id)),
    };

    const delPipeline = tarjetas.filter((tarjeta) => tarjeta.pipeline_id === pipeline.id);
    const esPendiente = (tarjeta) =>
      sets.pendiente.has(tarjeta.columna_id)
      || (tarjeta.columna_id !== columnaCompletadaId
        && !sets.en_proceso.has(tarjeta.columna_id)
        && !sets.bloqueado.has(tarjeta.columna_id));

    const completadas = delPipeline.filter((t) => t.columna_id === columnaCompletadaId);
    const enProceso = delPipeline.filter((t) => sets.en_proceso.has(t.columna_id));
    const bloqueadas = delPipeline.filter((t) => sets.bloqueado.has(t.columna_id));
    const pendientes = delPipeline.filter(esPendiente);
    const suma = (items) => items.reduce((total, item) => total + numero(item.monto), 0);
    const total = delPipeline.length;
    const montoTotal = suma(delPipeline);

    return {
      total,
      completadas: completadas.length,
      enProceso: enProceso.length,
      bloqueadas: bloqueadas.length,
      pendientes: pendientes.length,
      porcentaje: total > 0 ? Math.round((completadas.length / total) * 100) : 0,
      columnaCompletadaId,
      columnaCompletadaTitulo: columnaCompletada?.titulo || 'Completado',
      montoCompletado: suma(completadas),
      montoEnProceso: suma(enProceso),
      montoBloqueado: suma(bloqueadas),
      montoPendiente: suma(pendientes),
      montoTotal,
      montoPonderadoTotal: delPipeline.reduce(
        (totalPonderado, tarjeta) => totalPonderado + numero(tarjeta.monto) * (numero(tarjeta.probabilidad ?? 50) / 100),
        0
      ),
      tasaConversion: total > 0 ? Math.round((completadas.length / total) * 100) : 0,
    };
  };

  return {
    listar({ pagina = 1, tamanoPagina = 20 } = {}) {
      const pipelines = leerPipelines().map((pipeline) => ({
        ...pipeline,
        columnas: [...pipeline.columnas].sort((a, b) => a.orden - b.orden),
      }));
      const total = pipelines.length;
      const paginaNumero = Math.max(1, Number.parseInt(pagina, 10) || 1);
      const tamano = Math.min(100, Math.max(1, Number.parseInt(tamanoPagina, 10) || 20));
      const inicio = (paginaNumero - 1) * tamano;

      return {
        pipelines: pipelines.slice(inicio, inicio + tamano),
        total,
        pagina: paginaNumero,
        tamanoPagina: tamano,
        totalPaginas: Math.max(1, Math.ceil(total / tamano)),
      };
    },

    todos() {
      return leerPipelines();
    },

    obtener: obtenerPipeline,

    resumen() {
      const tarjetas = leerTarjetas();
      return leerPipelines().map((pipeline) => {
        const metricas = metricasPipeline(pipeline, tarjetas);
        return {
          id: pipeline.id,
          nombre: pipeline.nombre,
          descripcion: pipeline.descripcion,
          tipo: pipeline.tipo,
          es_predeterminado: pipeline.es_predeterminado,
          columnasCount: pipeline.columnas.length,
          totalTarjetas: metricas.total,
          completadas: metricas.completadas,
          enProceso: metricas.enProceso,
          bloqueadas: metricas.bloqueadas,
          pendientes: metricas.pendientes,
          porcentaje: metricas.porcentaje,
          montoTotal: metricas.montoCompletado + metricas.montoEnProceso + metricas.montoPendiente,
        };
      });
    },

    metricas(pipelineId) {
      const pipeline = obtenerPipeline(pipelineId);
      if (!pipeline) return null;
      return metricasPipeline(pipeline, leerTarjetas());
    },

    crear(datos = {}) {
      const nombre = texto(datos.nombre, 200);
      if (!nombre) throw errorValidacion('El nombre del pipeline es obligatorio.');

      const columnasEntrada = Array.isArray(datos.columnas) ? datos.columnas : [];
      if (columnasEntrada.length === 0) {
        throw errorValidacion('El pipeline debe tener al menos una etapa.');
      }
      if (columnasEntrada.length > LIMITE_MAXIMO_COLUMNAS) {
        throw errorValidacion(`El numero maximo de columnas permitido es de ${LIMITE_MAXIMO_COLUMNAS} etapas.`);
      }

      const base = slug(nombre, crypto.randomUUID().slice(0, 8));
      let id = `pipeline-${base}`;
      if (obtenerPipeline(id)) id = `pipeline-${base}-${crypto.randomUUID().slice(0, 6)}`;

      const pipeline = normalizarPipeline(
        {
          ...datos,
          nombre,
          id,
          es_predeterminado: false,
          icono: datos.tipo === 'visitas' ? 'MapPin' : 'Kanban',
          columnas: columnasEntrada.map((columna, indice) => ({
            ...columna,
            id: `${id}-col-${indice + 1}`,
          })),
        },
        { id, creado_en: new Date().toISOString() }
      );

      coleccionPipelines.crear(pipeline, { id });
      return pipeline;
    },

    actualizar(id, cambios = {}) {
      const actual = obtenerPipeline(id);
      if (!actual) return null;

      if (cambios.nombre !== undefined) {
        const nombre = texto(cambios.nombre, 200);
        if (!nombre) throw errorValidacion('El nombre del pipeline es obligatorio.');
        actual.nombre = nombre;
      }
      if (cambios.descripcion !== undefined) {
        actual.descripcion = texto(cambios.descripcion, 500);
      }

      return guardarPipeline(actual);
    },

    eliminar(id) {
      const pipeline = obtenerPipeline(id);
      if (!pipeline) return null;
      if (pipeline.es_predeterminado) {
        throw errorValidacion('No es posible eliminar el pipeline predeterminado del sistema.');
      }

      coleccionTarjetas.recargar();
      const tarjetas = leerTarjetas().filter((tarjeta) => tarjeta.pipeline_id !== pipeline.id);
      coleccionTarjetas.reemplazarTodo(tarjetas);
      coleccionPipelines.eliminar(pipeline.id);
      return pipeline;
    },

    agregarColumna(pipelineId, datos = {}) {
      const pipeline = obtenerPipeline(pipelineId);
      if (!pipeline) return null;

      if (pipeline.columnas.length >= LIMITE_MAXIMO_COLUMNAS) {
        throw errorValidacion(
          `Se ha alcanzado el limite maximo de ${LIMITE_MAXIMO_COLUMNAS} etapas por tablero para mantener metricas claras.`
        );
      }

      const titulo = texto(datos.titulo, 160);
      if (!titulo) throw errorValidacion('El titulo de la etapa es obligatorio.');

      const nueva = {
        id: `${pipeline.id}-col-${crypto.randomUUID().slice(0, 8)}`,
        titulo,
        color: texto(datos.color, 200) || 'border-zinc-500/40 text-zinc-300',
        bgBadge: texto(datos.bgBadge, 200) || 'bg-zinc-500/10 border-zinc-500/20',
        orden: pipeline.columnas.length + 1,
        estado: ESTADOS_ETAPA.includes(datos.estado) && datos.estado !== 'completado'
          ? datos.estado
          : 'en_proceso',
        es_completado: false,
      };

      const posicion = Math.max(0, pipeline.columnas.length - 1);
      pipeline.columnas.splice(posicion, 0, nueva);
      asegurarUnicoEstadoCompletado(pipeline.columnas);
      guardarPipeline(pipeline);
      return nueva;
    },

    actualizarColumna(pipelineId, columnaId, datos = {}) {
      const pipeline = obtenerPipeline(pipelineId);
      if (!pipeline) return null;

      const indice = pipeline.columnas.findIndex((columna) => columna.id === columnaId);
      if (indice === -1) return null;

      const columna = pipeline.columnas[indice];
      if (datos.titulo !== undefined) {
        const titulo = texto(datos.titulo, 160);
        if (!titulo) throw errorValidacion('El titulo de la etapa es obligatorio.');
        columna.titulo = titulo;
      }
      if (datos.color !== undefined) columna.color = texto(datos.color, 200);
      if (datos.bgBadge !== undefined) columna.bgBadge = texto(datos.bgBadge, 200);
      if (datos.estado !== undefined && indice < pipeline.columnas.length - 1) {
        columna.estado = datos.estado === 'completado' ? 'en_proceso' : datos.estado;
        if (!ESTADOS_ETAPA.includes(columna.estado)) columna.estado = 'en_proceso';
      }

      asegurarUnicoEstadoCompletado(pipeline.columnas);
      guardarPipeline(pipeline);
      return columna;
    },

    eliminarColumna(pipelineId, columnaId) {
      const pipeline = obtenerPipeline(pipelineId);
      if (!pipeline) return null;

      if (!pipeline.columnas.some((columna) => columna.id === columnaId)) return null;
      if (pipeline.columnas.length <= 1) {
        throw errorValidacion('Un pipeline debe tener al menos una columna activa.');
      }

      pipeline.columnas = pipeline.columnas.filter((columna) => columna.id !== columnaId);
      asegurarUnicoEstadoCompletado(pipeline.columnas);
      guardarPipeline(pipeline);

      const primeraColumnaId = pipeline.columnas[0].id;
      const tarjetas = leerTarjetas();
      tarjetas.forEach((tarjeta) => {
        if (tarjeta.pipeline_id === pipeline.id && tarjeta.columna_id === columnaId) {
          tarjeta.columna_id = primeraColumnaId;
        }
      });
      reordenarColumna(tarjetas, pipeline.id, primeraColumnaId);
      coleccionTarjetas.reemplazarTodo(tarjetas);
      return { ok: true };
    },

    moverColumna(pipelineId, columnaId, direccion) {
      const pipeline = obtenerPipeline(pipelineId);
      if (!pipeline) return null;

      const indice = pipeline.columnas.findIndex((columna) => columna.id === columnaId);
      if (indice === -1) return null;

      const ultimo = pipeline.columnas.length - 1;
      if (indice === ultimo) return { ok: false };
      const destino = direccion === 'izquierda' ? indice - 1 : indice + 1;
      if (destino < 0 || destino > ultimo || destino === ultimo) return { ok: false };

      const [columna] = pipeline.columnas.splice(indice, 1);
      pipeline.columnas.splice(destino, 0, columna);
      asegurarUnicoEstadoCompletado(pipeline.columnas);
      guardarPipeline(pipeline);
      return { ok: true };
    },

    listarTarjetas(pipelineId, filtros = {}) {
      const pipeline = obtenerPipeline(pipelineId);
      if (!pipeline) return null;

      const busqueda = texto(filtros.busqueda, 200).toLowerCase();
      let tarjetas = leerTarjetas().filter((tarjeta) => tarjeta.pipeline_id === pipeline.id);

      if (filtros.responsable) {
        const responsable = texto(filtros.responsable, 160).toLowerCase();
        tarjetas = tarjetas.filter((t) => t.responsable.toLowerCase() === responsable);
      }
      if (filtros.sector) {
        tarjetas = tarjetas.filter((t) => t.cliente_sector === filtros.sector);
      }
      if (filtros.prioridad) {
        tarjetas = tarjetas.filter((t) => t.prioridad === filtros.prioridad);
      }
      if (busqueda) {
        tarjetas = tarjetas.filter((t) =>
          t.titulo.toLowerCase().includes(busqueda)
          || t.cliente_nombre.toLowerCase().includes(busqueda)
          || String(t.notas || '').toLowerCase().includes(busqueda)
        );
      }

      tarjetas.sort(compararTarjetas);
      const total = tarjetas.length;
      const paginar = filtros.paginar !== false && filtros.paginar !== 'false';
      if (!paginar) {
        return { datos: tarjetas, total, pagina: 1, tamanoPagina: total || 1, totalPaginas: 1 };
      }

      const pagina = Math.max(1, Number.parseInt(filtros.pagina, 10) || 1);
      const tamano = Math.min(200, Math.max(1, Number.parseInt(filtros.tamanoPagina, 10) || 50));
      const inicio = (pagina - 1) * tamano;

      return {
        datos: tarjetas.slice(inicio, inicio + tamano),
        total,
        pagina,
        tamanoPagina: tamano,
        totalPaginas: Math.max(1, Math.ceil(total / tamano)),
        hasMore: inicio + tamano < total,
      };
    },

    todasLasTarjetas() {
      return leerTarjetas();
    },

    obtenerTarjeta,

    crearTarjeta(pipelineId, datos = {}) {
      const pipeline = obtenerPipeline(pipelineId);
      if (!pipeline) return null;

      if (!texto(datos.titulo)) throw errorValidacion('El titulo de la tarjeta es obligatorio.');
      if (!texto(datos.cliente_id)) throw errorValidacion('El cliente de la tarjeta es obligatorio.');
      if (!pipeline.columnas.some((columna) => columna.id === datos.columna_id)) {
        throw errorValidacion('La etapa indicada no existe en el pipeline.');
      }

      const tarjetasDelPipeline = leerTarjetas().filter((tarjeta) => tarjeta.pipeline_id === pipeline.id);
      const tarjetasColumna = tarjetasDelPipeline.filter((tarjeta) => tarjeta.columna_id === datos.columna_id);
      const maxOrden = tarjetasColumna.reduce((mayor, tarjeta) => Math.max(mayor, tarjeta.orden || 0), 0);

      // El frontend puede enviar el id de la oportunidad para que la tarjeta del
      // pipeline comercial y la oportunidad del cliente compartan identificador.
      const idSolicitado = texto(datos.id, 120);
      if (idSolicitado && tarjetasDelPipeline.some((tarjeta) => tarjeta.id === idSolicitado)) {
        throw errorValidacion('Ya existe una tarjeta con ese identificador en el pipeline.', 409);
      }

      const tarjeta = normalizarTarjeta(
        {
          ...datos,
          pipeline_id: pipeline.id,
          orden: datos.orden !== undefined ? datos.orden : maxOrden + 1,
        },
        {
          id: idSolicitado || `tarjeta-${crypto.randomUUID()}`,
          pipeline_id: pipeline.id,
          creado_en: new Date().toISOString(),
        }
      );

      coleccionTarjetas.crear(tarjeta, { id: tarjeta.id });
      return tarjeta;
    },

    actualizarTarjeta(pipelineId, tarjetaId, cambios = {}) {
      const tarjeta = obtenerTarjeta(tarjetaId);
      if (!tarjeta || tarjeta.pipeline_id !== texto(pipelineId, 120)) return null;
      const pipeline = obtenerPipeline(pipelineId);
      if (!pipeline) return null;

      const columnaAnterior = tarjeta.columna_id;
      const actualizada = {
        ...tarjeta,
        ...cambios,
        id: tarjeta.id,
        pipeline_id: tarjeta.pipeline_id,
        columna_id: cambios.columna_id !== undefined ? texto(cambios.columna_id, 120) : tarjeta.columna_id,
        titulo: cambios.titulo !== undefined ? texto(cambios.titulo, 240) : tarjeta.titulo,
        monto: cambios.monto !== undefined ? Math.max(0, numero(cambios.monto)) : tarjeta.monto,
        fecha_objetivo: cambios.fecha_objetivo !== undefined ? fechaCorta(cambios.fecha_objetivo) : tarjeta.fecha_objetivo,
        probabilidad: cambios.probabilidad !== undefined
          ? Math.min(100, Math.max(0, numero(cambios.probabilidad)))
          : tarjeta.probabilidad,
        notas: cambios.notas !== undefined ? texto(cambios.notas, 4000) : tarjeta.notas,
        prioridad: PRIORIDADES_TARJETA.includes(cambios.prioridad) ? cambios.prioridad : tarjeta.prioridad,
        responsable: cambios.responsable !== undefined ? texto(cambios.responsable, 160) || tarjeta.responsable : tarjeta.responsable,
        motivo_cierre: cambios.motivo_cierre !== undefined ? texto(cambios.motivo_cierre, 500) : tarjeta.motivo_cierre,
        notas_cierre: cambios.notas_cierre !== undefined ? texto(cambios.notas_cierre, 2000) : tarjeta.notas_cierre,
        fecha_cambio_etapa: cambios.fecha_cambio_etapa ? fechaIso(cambios.fecha_cambio_etapa) : tarjeta.fecha_cambio_etapa,
      };

      if (!pipeline.columnas.some((columna) => columna.id === actualizada.columna_id)) {
        throw errorValidacion('La etapa indicada no existe en el pipeline.');
      }

      guardarTarjeta(actualizada);

      if (actualizada.columna_id !== columnaAnterior) {
        const tarjetas = leerTarjetas();
        reordenarColumna(tarjetas, pipeline.id, columnaAnterior);
        const destino = tarjetas
          .filter((t) => t.pipeline_id === pipeline.id && t.columna_id === actualizada.columna_id)
          .sort(compararTarjetas);
        destino.push(destino.splice(destino.findIndex((t) => t.id === actualizada.id), 1)[0]);
        destino.forEach((t, indice) => {
          t.orden = indice + 1;
        });
        coleccionTarjetas.reemplazarTodo(tarjetas);
        return coleccionTarjetas.obtener(actualizada.id);
      }

      return actualizada;
    },

    moverTarjeta(pipelineId, tarjetaId, columnaId, indice) {
      const tarjeta = obtenerTarjeta(tarjetaId);
      const pipeline = obtenerPipeline(pipelineId);
      if (!tarjeta || !pipeline || tarjeta.pipeline_id !== pipeline.id) return null;
      if (!pipeline.columnas.some((columna) => columna.id === columnaId)) return null;

      const columnaAnterior = tarjeta.columna_id;
      tarjeta.columna_id = texto(columnaId, 120);
      guardarTarjeta(tarjeta);

      const tarjetas = leerTarjetas();
      const destino = tarjetas
        .filter((t) => t.pipeline_id === pipeline.id && t.columna_id === tarjeta.columna_id && t.id !== tarjeta.id)
        .sort(compararTarjetas);

      const posicion = Number.parseInt(indice, 10);
      if (Number.isFinite(posicion) && posicion >= 0 && posicion <= destino.length) {
        destino.splice(posicion, 0, tarjeta);
      } else {
        destino.push(tarjeta);
      }
      destino.forEach((t, idx) => {
        t.orden = idx + 1;
      });
      reordenarColumna(tarjetas, pipeline.id, columnaAnterior);
      coleccionTarjetas.reemplazarTodo(tarjetas);
      return { ok: true };
    },

    moverTarjetaPosicion(pipelineId, tarjetaId, direccion) {
      const tarjeta = obtenerTarjeta(tarjetaId);
      const pipeline = obtenerPipeline(pipelineId);
      if (!tarjeta || !pipeline || tarjeta.pipeline_id !== pipeline.id) return null;

      const tarjetas = leerTarjetas();
      const columna = tarjetas
        .filter((t) => t.pipeline_id === pipeline.id && t.columna_id === tarjeta.columna_id)
        .sort(compararTarjetas);
      const indice = columna.findIndex((t) => t.id === tarjeta.id);
      if (indice === -1) return null;

      const destino = direccion === 'arriba' ? indice - 1 : indice + 1;
      if (destino < 0 || destino >= columna.length) return { ok: false };

      const [elemento] = columna.splice(indice, 1);
      columna.splice(destino, 0, elemento);
      columna.forEach((t, idx) => {
        t.orden = idx + 1;
      });
      coleccionTarjetas.reemplazarTodo(tarjetas);
      return { ok: true };
    },

    eliminarTarjeta(tarjetaId) {
      coleccionTarjetas.recargar();
      const tarjeta = coleccionTarjetas.obtener(tarjetaId);
      if (!tarjeta) return null;
      coleccionTarjetas.eliminar(tarjetaId);

      const tarjetas = leerTarjetas();
      reordenarColumna(tarjetas, tarjeta.pipeline_id, tarjeta.columna_id);
      coleccionTarjetas.reemplazarTodo(tarjetas);
      return tarjeta;
    },

    vaciarTarjetas() {
      const total = leerTarjetas().length;
      coleccionTarjetas.reemplazarTodo([]);
      return { eliminadas: total };
    },
  };
}

export function crearAlmacenPipelinesDesdeEntorno(env = process.env) {
  const coleccionPipelines = crearColeccionDesdeEntorno('pipelines', env);
  const coleccionTarjetas = crearColeccionDesdeEntorno('pipeline_tarjetas', env);

  if (coleccionPipelines.todos().length === 0) {
    const semilla = PIPELINES_INICIALES.map((pipeline) => normalizarPipeline(pipeline, { id: pipeline.id }));
    coleccionPipelines.reemplazarTodo(semilla);
  }

  return crearAlmacenPipelines(coleccionPipelines, coleccionTarjetas);
}
