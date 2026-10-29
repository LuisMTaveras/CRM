import crypto from 'node:crypto';
import { crearColeccionDesdeEntorno } from '../storage/json-store.js';

export const TIPOS_ACTIVIDAD = ['llamada', 'reunion', 'videollamada', 'correo', 'tarea', 'propuesta', 'seguimiento'];
export const PRIORIDADES_ACTIVIDAD = ['alta', 'media', 'baja'];
export const ESTADOS_ACTIVIDAD = ['pendiente', 'en_curso', 'completada', 'cancelada'];
export const RANGOS_FECHA = ['todas', 'hoy', 'vencidas', 'esta_semana', 'completadas'];

function texto(valor, limite = 500) {
  return String(valor ?? '').trim().slice(0, limite);
}

function fechaIso(valor) {
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? new Date().toISOString() : fecha.toISOString();
}

function opcional(valor, limite = 2000) {
  const limpio = texto(valor, limite);
  return limpio || undefined;
}

function normalizar(datos, idExistente) {
  const tipo = TIPOS_ACTIVIDAD.includes(datos?.tipo) ? datos.tipo : 'tarea';
  const prioridad = PRIORIDADES_ACTIVIDAD.includes(datos?.prioridad) ? datos.prioridad : 'media';
  const estado = ESTADOS_ACTIVIDAD.includes(datos?.estado) ? datos.estado : 'pendiente';

  return {
    id: texto(idExistente || datos?.id, 80) || `act-${crypto.randomUUID()}`,
    clienteId: texto(datos?.clienteId, 120),
    clienteNombre: texto(datos?.clienteNombre, 240),
    clienteSector: opcional(datos?.clienteSector, 160),
    tarjetaId: opcional(datos?.tarjetaId, 120),
    pipelineId: opcional(datos?.pipelineId, 120),
    titulo: texto(datos?.titulo, 240),
    descripcion: opcional(datos?.descripcion),
    tipo,
    prioridad,
    estado,
    fechaLimite: fechaIso(datos?.fechaLimite),
    responsable: texto(datos?.responsable, 160),
    resultadoNotas: opcional(datos?.resultadoNotas),
    creadoEn: fechaIso(datos?.creadoEn),
    actualizadoEn: datos?.actualizadoEn ? fechaIso(datos.actualizadoEn) : undefined,
    completadoEn: datos?.completadoEn ? fechaIso(datos.completadoEn) : undefined,
  };
}

function limites(ahora = new Date()) {
  const hoyInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();
  const hoyFin = hoyInicio + 86400000;
  const inicioSemana = hoyInicio - (ahora.getDay() === 0 ? 6 : ahora.getDay() - 1) * 86400000;
  const finSemana = inicioSemana + 7 * 86400000;
  return { hoyInicio, hoyFin, inicioSemana, finSemana };
}

function coincideBusqueda(actividad, busqueda) {
  if (!busqueda) return true;
  return (
    String(actividad.titulo || '').toLowerCase().includes(busqueda) ||
    String(actividad.clienteNombre || '').toLowerCase().includes(busqueda) ||
    String(actividad.descripcion || '').toLowerCase().includes(busqueda)
  );
}

function esActiva(actividad) {
  return actividad.estado !== 'completada' && actividad.estado !== 'cancelada';
}

function filtrar(items, filtros = {}) {
  const { hoyInicio, hoyFin, finSemana } = limites();
  const busqueda = texto(filtros.busqueda).toLowerCase();
  const rango = RANGOS_FECHA.includes(filtros.rango) ? filtros.rango : 'todas';

  return items.filter((actividad) => {
    if (rango === 'hoy') {
      if (!esActiva(actividad)) return false;
      const momento = new Date(actividad.fechaLimite).getTime();
      if (momento < hoyInicio || momento >= hoyFin) return false;
    } else if (rango === 'vencidas') {
      if (!esActiva(actividad)) return false;
      if (new Date(actividad.fechaLimite).getTime() >= hoyInicio) return false;
    } else if (rango === 'esta_semana') {
      if (!esActiva(actividad)) return false;
      const momento = new Date(actividad.fechaLimite).getTime();
      if (momento < hoyInicio || momento >= finSemana) return false;
    } else if (rango === 'completadas') {
      if (actividad.estado !== 'completada') return false;
    }

    if (filtros.tipo && actividad.tipo !== filtros.tipo) return false;
    if (filtros.prioridad && actividad.prioridad !== filtros.prioridad) return false;
    if (filtros.responsable && actividad.responsable.toLowerCase() !== String(filtros.responsable).toLowerCase()) return false;
    if (filtros.clienteId && actividad.clienteId !== filtros.clienteId) return false;
    if (!coincideBusqueda(actividad, busqueda)) return false;
    return true;
  });
}

function ordenar(items) {
  return [...items].sort((a, b) => {
    if (a.estado === 'completada' && b.estado !== 'completada') return 1;
    if (a.estado !== 'completada' && b.estado === 'completada') return -1;
    return new Date(a.fechaLimite).getTime() - new Date(b.fechaLimite).getTime();
  });
}

export function calcularMetricas(items, ahora = new Date()) {
  const { hoyInicio, hoyFin, finSemana } = limites(ahora);
  let pendientesHoy = 0;
  let vencidas = 0;
  let estaSemana = 0;
  let completadas = 0;

  items.forEach((actividad) => {
    if (actividad.estado === 'completada') {
      completadas += 1;
      return;
    }
    if (actividad.estado === 'cancelada') return;

    const momento = new Date(actividad.fechaLimite).getTime();
    if (momento < hoyInicio) vencidas += 1;
    else if (momento < hoyFin) pendientesHoy += 1;
    else if (momento < finSemana) estaSemana += 1;
  });

  const base = pendientesHoy + vencidas + estaSemana + completadas;
  return {
    total: items.length,
    pendientesHoy,
    vencidas,
    estaSemana,
    completadas,
    porcentajeCumplimiento: base > 0 ? Math.round((completadas / base) * 100) : 100,
  };
}

export function crearAlmacenActividades(coleccion) {
  const leer = () => {
    coleccion.recargar();
    return coleccion.todos();
  };

  const obtener = (id) => {
    coleccion.recargar();
    return coleccion.obtener(id);
  };

  return {
    listar(filtros = {}) {
      const items = ordenar(filtrar(leer(), filtros));
      const total = items.length;
      const pagina = Math.max(1, Number.parseInt(filtros.pagina, 10) || 1);
      const tamano = Math.min(500, Math.max(1, Number.parseInt(filtros.tamanoPagina, 10) || 50));
      const inicio = (pagina - 1) * tamano;
      const paginar = filtros.paginar === true || filtros.paginar === 'true';

      return {
        datos: paginar ? items.slice(inicio, inicio + tamano) : items,
        total,
        pagina,
        tamanoPagina: paginar ? tamano : total || 1,
        hasMore: paginar ? inicio + tamano < total : false,
        metricas: calcularMetricas(leer()),
      };
    },

    obtener(id) {
      return obtener(id);
    },

    crear(datos) {
      if (!texto(datos?.titulo)) {
        const error = new Error('El titulo de la actividad es obligatorio.');
        error.estado = 400;
        throw error;
      }
      if (!texto(datos?.clienteNombre)) {
        const error = new Error('El cliente de la actividad es obligatorio.');
        error.estado = 400;
        throw error;
      }

      const actividad = normalizar(datos);
      coleccion.crear(actividad, { id: actividad.id });
      return actividad;
    },

    actualizar(id, cambios) {
      const actual = obtener(id);
      if (!actual) return null;

      const fusionado = normalizar({ ...actual, ...cambios, id: actual.id }, actual.id);
      fusionado.creadoEn = actual.creadoEn;
      fusionado.actualizadoEn = new Date().toISOString();
      if (fusionado.estado === 'completada' && !fusionado.completadoEn) {
        fusionado.completadoEn = new Date().toISOString();
      }
      if (fusionado.estado !== 'completada') {
        fusionado.completadoEn = undefined;
      }

      return coleccion.reemplazar(actual.id, fusionado);
    },

    eliminar(id) {
      coleccion.recargar();
      const eliminado = coleccion.eliminar(id);
      return eliminado;
    },

    vaciar() {
      const eliminados = leer().length;
      coleccion.reemplazarTodo([]);
      return { eliminados };
    },

    metricas() {
      return calcularMetricas(leer());
    },
  };
}

export function crearAlmacenActividadesDesdeEntorno(env = process.env) {
  return crearAlmacenActividades(crearColeccionDesdeEntorno('actividades', env));
}
