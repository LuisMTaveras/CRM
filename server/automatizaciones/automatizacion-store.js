import crypto from 'node:crypto';
import { crearColeccionDesdeEntorno } from '../storage/json-store.js';

export const EVENTOS_AUTOMATIZACION = [
  'etapa_cambiada',
  'oportunidad_creada',
  'cliente_creado',
];
export const ACCIONES_AUTOMATIZACION = ['crear_tarea', 'registrar_nota'];
export const PRIORIDADES_AUTOMATIZACION = ['alta', 'media', 'baja'];
export const ETAPAS_OPORTUNIDAD = ['calificacion', 'propuesta', 'negociacion', 'ganada', 'perdida'];

const MAXIMO_AUTOMATIZACIONES = 100;
const DIAS_MAXIMOS = 365;

const AUTOMATIZACIONES_INICIALES = [
  {
    id: 'auto-seguimiento-propuesta',
    nombre: 'Seguimiento al enviar propuesta',
    descripcion: 'Genera una tarea de llamada dos días después de mover una oportunidad a Propuesta Enviada.',
    evento: 'etapa_cambiada',
    activa: true,
    condiciones: { etapa: 'propuesta' },
    accion: {
      tipo: 'crear_tarea',
      titulo: 'Seguimiento de propuesta: {{oportunidad}}',
      descripcion: 'Contactar a {{cliente}} para confirmar la recepción y revisión de la propuesta comercial.',
      prioridad: 'alta',
      dias_vencimiento: 2,
    },
    creado_en: '2026-01-20T09:00:00.000Z',
  },
  {
    id: 'auto-cierre-ganado',
    nombre: 'Bitácora de cierre ganado',
    descripcion: 'Registra una nota en la agenda cuando una oportunidad pasa a Cerrada Ganada.',
    evento: 'etapa_cambiada',
    activa: true,
    condiciones: { etapa: 'ganada' },
    accion: {
      tipo: 'registrar_nota',
      titulo: 'Trato ganado: {{oportunidad}}',
      descripcion: 'El cliente {{cliente}} cerró la oportunidad en la etapa Ganada. Verificar contrato y facturación.',
      prioridad: 'media',
      dias_vencimiento: 0,
    },
    creado_en: '2026-01-20T09:05:00.000Z',
  },
];

function texto(valor, limite = 500) {
  return String(valor ?? '').trim().slice(0, limite);
}

function booleano(valor) {
  return valor === true || valor === 'true' || valor === 1 || valor === '1';
}

function numeroDias(valor) {
  const convertido = Number.parseInt(valor, 10);
  if (!Number.isFinite(convertido) || convertido < 0) return 0;
  return Math.min(DIAS_MAXIMOS, convertido);
}

function errorValidacion(mensaje, estado = 400) {
  const error = new Error(mensaje);
  error.estado = estado;
  return error;
}

function normalizarCondiciones(valor) {
  const datos = valor && typeof valor === 'object' ? valor : {};
  return {
    etapa: ETAPAS_OPORTUNIDAD.includes(datos.etapa) ? datos.etapa : '',
    etapa_origen: ETAPAS_OPORTUNIDAD.includes(datos.etapa_origen) ? datos.etapa_origen : '',
    sector: texto(datos.sector, 120),
    prioridad: PRIORIDADES_AUTOMATIZACION.includes(datos.prioridad) ? datos.prioridad : '',
  };
}

function normalizarAccion(valor) {
  const datos = valor && typeof valor === 'object' ? valor : {};
  return {
    tipo: ACCIONES_AUTOMATIZACION.includes(datos.tipo) ? datos.tipo : 'crear_tarea',
    titulo: texto(datos.titulo, 240),
    descripcion: texto(datos.descripcion, 2000),
    prioridad: PRIORIDADES_AUTOMATIZACION.includes(datos.prioridad) ? datos.prioridad : 'media',
    dias_vencimiento: numeroDias(datos.dias_vencimiento),
  };
}

function normalizarAutomatizacion(datos, { id, creado_en } = {}) {
  const evento = EVENTOS_AUTOMATIZACION.includes(datos?.evento)
    ? datos.evento
    : 'etapa_cambiada';

  return {
    id: texto(id || datos?.id, 100) || `auto-${crypto.randomUUID()}`,
    nombre: texto(datos?.nombre, 200),
    descripcion: texto(datos?.descripcion, 600),
    evento,
    activa: datos?.activa === undefined ? true : booleano(datos.activa),
    condiciones: normalizarCondiciones(datos?.condiciones),
    accion: normalizarAccion(datos?.accion),
    creado_en: creado_en || datos?.creado_en || new Date().toISOString(),
    actualizado_en: datos?.actualizado_en,
  };
}

function validarAutomatizacion(datos, { parcial = false } = {}) {
  const errores = [];

  if (!parcial || datos.nombre !== undefined) {
    if (!texto(datos.nombre)) errores.push('El nombre de la automatización es obligatorio.');
  }
  if (!parcial || datos.evento !== undefined) {
    if (!EVENTOS_AUTOMATIZACION.includes(datos.evento)) {
      errores.push(`El evento debe ser uno de: ${EVENTOS_AUTOMATIZACION.join(', ')}.`);
    }
  }

  const accion = datos.accion && typeof datos.accion === 'object' ? datos.accion : {};
  if (!parcial || datos.accion !== undefined) {
    if (!ACCIONES_AUTOMATIZACION.includes(accion.tipo)) {
      errores.push(`La acción debe ser una de: ${ACCIONES_AUTOMATIZACION.join(', ')}.`);
    }
    if (!texto(accion.titulo)) errores.push('El título de la acción es obligatorio.');
  }

  return errores;
}

function coincideCondiciones(condiciones, contexto = {}) {
  if (condiciones.etapa && condiciones.etapa !== contexto.etapa) return false;
  if (condiciones.etapa_origen && condiciones.etapa_origen !== contexto.etapaAnterior) return false;
  if (condiciones.sector && condiciones.sector.toLowerCase() !== String(contexto.sector || '').toLowerCase()) {
    return false;
  }
  if (condiciones.prioridad && condiciones.prioridad !== contexto.prioridad) return false;
  return true;
}

function interpolar(plantilla, contexto = {}) {
  return String(plantilla || '')
    .replaceAll('{{cliente}}', contexto.clienteNombre || 'el cliente')
    .replaceAll('{{oportunidad}}', contexto.tituloOportunidad || 'la oportunidad')
    .replaceAll('{{etapa}}', contexto.etapa || '')
    .replaceAll('{{sector}}', contexto.sector || '');
}

export function crearAlmacenAutomatizaciones(coleccion) {
  const leer = () => {
    coleccion.recargar();
    return coleccion.todos();
  };

  const obtener = (id) => {
    const buscado = texto(id, 100);
    return leer().find((automatizacion) => automatizacion.id === buscado) || null;
  };

  return {
    listar({ pagina = 1, tamanoPagina = 10, busqueda = '', evento = '', activa = null } = {}) {
      const textoBusqueda = texto(busqueda, 200).toLowerCase();
      const filtradas = leer()
        .filter((automatizacion) => {
          if (evento && automatizacion.evento !== evento) return false;
          if (activa !== null && activa !== undefined && automatizacion.activa !== activa) return false;
          if (!textoBusqueda) return true;
          return (
            automatizacion.nombre.toLowerCase().includes(textoBusqueda) ||
            automatizacion.descripcion.toLowerCase().includes(textoBusqueda)
          );
        })
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

      const total = filtradas.length;
      const paginaNumero = Math.max(1, Number.parseInt(pagina, 10) || 1);
      const tamano = Math.min(50, Math.max(1, Number.parseInt(tamanoPagina, 10) || 10));
      const inicio = (paginaNumero - 1) * tamano;

      return {
        datos: filtradas.slice(inicio, inicio + tamano),
        total,
        pagina: paginaNumero,
        tamanoPagina: tamano,
        totalPaginas: Math.max(1, Math.ceil(total / tamano)),
        hasMore: inicio + tamano < total,
      };
    },

    obtener,

    activas(evento) {
      return leer().filter(
        (automatizacion) => automatizacion.activa && automatizacion.evento === evento
      );
    },

    crear(datos = {}) {
      const errores = validarAutomatizacion(datos);
      if (errores.length > 0) throw errorValidacion(errores.join(' '));

      const existentes = leer();
      if (existentes.length >= MAXIMO_AUTOMATIZACIONES) {
        throw errorValidacion(
          `Se alcanzó el límite de ${MAXIMO_AUTOMATIZACIONES} automatizaciones configuradas.`,
          409
        );
      }

      const automatizacion = normalizarAutomatizacion(
        { ...datos, activa: datos.activa ?? true },
        { creado_en: new Date().toISOString() }
      );
      coleccion.crear(automatizacion, { id: automatizacion.id });
      return automatizacion;
    },

    actualizar(id, cambios = {}) {
      const actual = obtener(id);
      if (!actual) return null;

      const fusionado = normalizarAutomatizacion(
        { ...actual, ...cambios, id: actual.id },
        { id: actual.id, creado_en: actual.creado_en }
      );
      fusionado.actualizado_en = new Date().toISOString();

      const errores = validarAutomatizacion(fusionado, { parcial: false });
      if (errores.length > 0) throw errorValidacion(errores.join(' '));

      coleccion.reemplazar(actual.id, fusionado);
      return fusionado;
    },

    eliminar(id) {
      const automatizacion = obtener(id);
      if (!automatizacion) return null;
      coleccion.eliminar(automatizacion.id);
      return automatizacion;
    },

    /**
     * Ejecuta las reglas activas del evento contra el contexto recibido.
     * `acciones` expone las funciones de escritura del dominio (agenda/notas).
     */
    ejecutar(evento, contexto = {}, acciones = {}) {
      const aplicadas = [];

      this.activas(evento).forEach((automatizacion) => {
        if (!coincideCondiciones(automatizacion.condiciones, contexto)) return;

        const titulo = interpolar(automatizacion.accion.titulo, contexto);
        const descripcion = interpolar(automatizacion.accion.descripcion, contexto);
        const dias = automatizacion.accion.dias_vencimiento;
        const fechaLimite = new Date(Date.now() + dias * 86400000).toISOString();

        try {
          if (automatizacion.accion.tipo === 'crear_tarea') {
            acciones.crearTarea?.({
              clienteId: contexto.clienteId,
              clienteNombre: contexto.clienteNombre,
              clienteSector: contexto.sector,
              tarjetaId: contexto.oportunidadId,
              pipelineId: contexto.pipelineId,
              titulo,
              descripcion,
              tipo: 'tarea',
              prioridad: automatizacion.accion.prioridad,
              fechaLimite,
              responsable: contexto.responsable || 'Equipo Comercial',
              estado: 'pendiente',
            });
          } else {
            acciones.registrarNota?.({
              clienteId: contexto.clienteId,
              clienteNombre: contexto.clienteNombre,
              clienteSector: contexto.sector,
              tarjetaId: contexto.oportunidadId,
              pipelineId: contexto.pipelineId,
              titulo,
              descripcion,
              tipo: 'seguimiento',
              prioridad: automatizacion.accion.prioridad,
              fechaLimite: new Date().toISOString(),
              responsable: contexto.responsable || 'Equipo Comercial',
              estado: 'completada',
            });
          }
          aplicadas.push(automatizacion.id);
        } catch {
          // Una regla defectuosa no debe bloquear el cambio de etapa.
        }
      });

      return aplicadas;
    },
  };
}

export function crearAlmacenAutomatizacionesDesdeEntorno(env = process.env) {
  const coleccion = crearColeccionDesdeEntorno('automatizaciones', env);
  coleccion.recargar();
  if (coleccion.todos().length === 0) {
    const semilla = AUTOMATIZACIONES_INICIALES.map((automatizacion) =>
      normalizarAutomatizacion(automatizacion, { id: automatizacion.id, creado_en: automatizacion.creado_en })
    );
    coleccion.reemplazarTodo(semilla);
  }
  return crearAlmacenAutomatizaciones(coleccion);
}
