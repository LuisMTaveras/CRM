import crypto from 'node:crypto';
import { crearColeccionDesdeEntorno } from '../storage/json-store.js';

export const ESTADOS_CLIENTE = ['prospecto', 'en_negociacion', 'activo', 'inactivo', 'cerrado_perdido'];
export const PRIORIDADES_CLIENTE = ['alta', 'media', 'baja'];
export const ETAPAS_OPORTUNIDAD = ['calificacion', 'propuesta', 'negociacion', 'ganada', 'perdida'];
export const TIPOS_ACTIVIDAD = ['llamada', 'reunion', 'correo', 'nota'];

const CAMPOS_BUSQUEDA = [
  'razon_social',
  'nombre_comercial',
  'codigo',
  'identificacion_fiscal',
  'responsable',
  'ciudad',
  'email',
  'telefono',
];

function texto(valor, limite = 500) {
  return String(valor ?? '').trim().slice(0, limite);
}

function numero(valor) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

function booleano(valor) {
  return valor === true || valor === 'true' || valor === '1' || valor === 1;
}

function fechaIso(valor) {
  if (!valor) return new Date().toISOString();
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? new Date().toISOString() : fecha.toISOString();
}

function fechaCorta(valor) {
  const fecha = valor ? new Date(valor) : new Date();
  if (Number.isNaN(fecha.getTime())) return new Date().toISOString().slice(0, 10);
  return fecha.toISOString().slice(0, 10);
}

function fechaOpcional(valor) {
  if (!valor) return undefined;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? undefined : fecha.toISOString();
}

function limpiarId(valor) {
  return texto(valor, 80);
}

function normalizarContacto(datos, clienteId) {
  return {
    id: limpiarId(datos?.id) || `cnt-${crypto.randomUUID()}`,
    cliente_id: clienteId,
    nombre: texto(datos?.nombre, 160),
    cargo: texto(datos?.cargo, 160),
    email: texto(datos?.email, 200),
    telefono: texto(datos?.telefono, 60),
    es_principal: booleano(datos?.es_principal),
    creado_en: fechaIso(datos?.creado_en),
  };
}

function normalizarOportunidad(datos, clienteId) {
  const etapa = ETAPAS_OPORTUNIDAD.includes(datos?.etapa) ? datos.etapa : 'calificacion';
  const cerrada = etapa === 'ganada' || etapa === 'perdida';
  return {
    id: limpiarId(datos?.id) || `op-${crypto.randomUUID()}`,
    cliente_id: clienteId,
    titulo: texto(datos?.titulo, 240),
    monto: numero(datos?.monto),
    etapa,
    probabilidad: Math.min(100, Math.max(0, numero(datos?.probabilidad ?? 50))),
    fecha_cierre_estimada: fechaCorta(datos?.fecha_cierre_estimada),
    fecha_cierre: cerrada ? fechaOpcional(datos?.fecha_cierre) || new Date().toISOString() : undefined,
    creado_en: fechaIso(datos?.creado_en),
  };
}

function normalizarActividad(datos, clienteId) {
  const tipo = TIPOS_ACTIVIDAD.includes(datos?.tipo) ? datos.tipo : 'nota';
  return {
    id: limpiarId(datos?.id) || `act-${crypto.randomUUID()}`,
    cliente_id: clienteId,
    tipo,
    descripcion: texto(datos?.descripcion, 2000),
    realizado_por: texto(datos?.realizado_por, 160) || 'Equipo Comercial',
    fecha: fechaIso(datos?.fecha),
  };
}

function sumarValor(oportunidades) {
  return oportunidades.reduce((total, oportunidad) => total + numero(oportunidad.monto), 0);
}

function normalizarListaContactos(valor, clienteId) {
  const lista = Array.isArray(valor) ? valor : [];
  const contactos = lista.map((contacto) => normalizarContacto(contacto, clienteId));
  if (contactos.length > 0 && !contactos.some((contacto) => contacto.es_principal)) {
    contactos[0].es_principal = true;
  }
  // Garantizar un solo contacto principal
  let principalAsignado = false;
  contactos.forEach((contacto) => {
    if (contacto.es_principal && !principalAsignado) {
      principalAsignado = true;
      return;
    }
    contacto.es_principal = false;
  });
  return contactos;
}

function normalizarListaOportunidades(valor, clienteId) {
  const lista = Array.isArray(valor) ? valor : [];
  return lista.map((oportunidad) => normalizarOportunidad(oportunidad, clienteId));
}

function normalizarListaActividades(valor, clienteId) {
  const lista = Array.isArray(valor) ? valor : [];
  return lista
    .map((actividad) => normalizarActividad(actividad, clienteId))
    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
}

export function validarCliente(datos, { parcial = false } = {}) {
  const errores = [];
  const requerido = (campo, etiqueta) => {
    if (parcial && datos[campo] === undefined) return;
    if (!texto(datos[campo])) errores.push(`${etiqueta} es obligatorio.`);
  };

  requerido('razon_social', 'La razon social');
  requerido('identificacion_fiscal', 'La identificacion fiscal');
  requerido('sector', 'El sector');
  requerido('responsable', 'El responsable comercial');

  if (!parcial || datos.estado !== undefined) {
    if (!ESTADOS_CLIENTE.includes(datos.estado)) {
      errores.push(`El estado debe ser uno de: ${ESTADOS_CLIENTE.join(', ')}.`);
    }
  }
  if (!parcial || datos.prioridad !== undefined) {
    if (!PRIORIDADES_CLIENTE.includes(datos.prioridad)) {
      errores.push(`La prioridad debe ser una de: ${PRIORIDADES_CLIENTE.join(', ')}.`);
    }
  }
  if (datos.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(datos.email))) {
    errores.push('El correo corporativo no es valido.');
  }
  if (datos.valor_estimado !== undefined && numero(datos.valor_estimado) < 0) {
    errores.push('El valor estimado no puede ser negativo.');
  }

  return errores;
}

function normalizarCliente(datos, { id, codigo, contactos, oportunidades, actividades } = {}) {
  const clienteId = limpiarId(id || datos?.id) || `cli-${crypto.randomUUID()}`;
  const listaContactos = normalizarListaContactos(contactos ?? datos?.contactos, clienteId);
  const listaOportunidades = normalizarListaOportunidades(oportunidades ?? datos?.oportunidades, clienteId);
  const listaActividades = normalizarListaActividades(actividades ?? datos?.actividades, clienteId);
  const totalOportunidades = sumarValor(listaOportunidades);
  const valorEstimado = datos?.valor_estimado !== undefined
    ? numero(datos.valor_estimado)
    : totalOportunidades;

  return {
    id: clienteId,
    codigo: texto(codigo || datos?.codigo, 40),
    razon_social: texto(datos?.razon_social, 240),
    nombre_comercial: texto(datos?.nombre_comercial, 240),
    identificacion_fiscal: texto(datos?.identificacion_fiscal, 60),
    sector: texto(datos?.sector, 120),
    estado: ESTADOS_CLIENTE.includes(datos?.estado) ? datos.estado : 'prospecto',
    prioridad: PRIORIDADES_CLIENTE.includes(datos?.prioridad) ? datos.prioridad : 'media',
    sitio_web: texto(datos?.sitio_web, 300),
    telefono: texto(datos?.telefono, 60),
    email: texto(datos?.email, 200),
    direccion: texto(datos?.direccion, 300),
    ciudad: texto(datos?.ciudad, 120),
    pais: texto(datos?.pais, 120) || 'Republica Dominicana',
    valor_estimado: valorEstimado,
    responsable: texto(datos?.responsable, 160),
    ultimo_contacto: datos?.ultimo_contacto ? fechaIso(datos.ultimo_contacto) : (listaActividades[0]?.fecha || ''),
    creado_en: fechaIso(datos?.creado_en),
    actualizado_en: fechaIso(datos?.actualizado_en),
    contactos: listaContactos,
    oportunidades: listaOportunidades,
    actividades: listaActividades,
  };
}

function calcularEstadisticas(items) {
  return {
    totalClientes: items.length,
    prospectos: items.filter((cliente) => cliente.estado === 'prospecto').length,
    enNegociacion: items.filter((cliente) => cliente.estado === 'en_negociacion').length,
    activos: items.filter((cliente) => cliente.estado === 'activo').length,
    valorTotalPipeline: items.reduce((total, cliente) => total + numero(cliente.valor_estimado), 0),
  };
}

function comparar(a, b, campo, direccion) {
  const factor = direccion === 'asc' ? 1 : -1;
  const izquierda = a[campo];
  const derecha = b[campo];

  if (typeof izquierda === 'number' && typeof derecha === 'number') {
    return (izquierda - derecha) * factor;
  }
  return String(izquierda ?? '').localeCompare(String(derecha ?? ''), 'es') * factor;
}

export function crearAlmacenClientes(coleccion) {
  const leerTodos = () => {
    coleccion.recargar();
    return coleccion.todos();
  };

  const buscarCliente = (id) => {
    coleccion.recargar();
    return coleccion.obtener(id);
  };

  const guardarCliente = (id, cliente) => {
    const actualizado = coleccion.reemplazar(id, cliente);
    return actualizado;
  };

  const generarCodigo = () => {
    const items = leerTodos();
    const maximo = items.reduce((mayor, cliente) => {
      const coincidencia = /^CLI-(\d+)$/i.exec(String(cliente.codigo || ''));
      if (!coincidencia) return mayor;
      return Math.max(mayor, Number.parseInt(coincidencia[1], 10) || 0);
    }, 0);
    return `CLI-${String(maximo + 1).padStart(3, '0')}`;
  };

  const coincideBusqueda = (cliente, busqueda) => {
    if (!busqueda) return true;
    return CAMPOS_BUSQUEDA.some((campo) => String(cliente[campo] ?? '').toLowerCase().includes(busqueda));
  };

  const filtrar = ({ busqueda = '', estado = '', sector = '' } = {}) => {
    const q = texto(busqueda).toLowerCase();
    return leerTodos().filter((cliente) => {
      if (estado && cliente.estado !== estado) return false;
      if (sector && cliente.sector !== sector) return false;
      return coincideBusqueda(cliente, q);
    });
  };

  return {
    listar({
      pagina = 1,
      tamanoPagina = 15,
      busqueda = '',
      ordenCampo = 'creado_en',
      ordenDireccion = 'desc',
      estado = '',
      sector = '',
    } = {}) {
      const paginaNumero = Math.max(1, Number.parseInt(pagina, 10) || 1);
      const tamano = Math.min(200, Math.max(1, Number.parseInt(tamanoPagina, 10) || 15));
      const campo = texto(ordenCampo, 40) || 'creado_en';
      const direccion = ordenDireccion === 'asc' ? 'asc' : 'desc';

      const filtrados = filtrar({ busqueda, estado, sector });
      const ordenados = [...filtrados].sort((a, b) => comparar(a, b, campo, direccion));
      const total = ordenados.length;
      const inicio = (paginaNumero - 1) * tamano;

      return {
        datos: ordenados.slice(inicio, inicio + tamano).map((cliente) => ({ ...cliente })),
        total,
        pagina: paginaNumero,
        tamanoPagina: tamano,
        totalPaginas: Math.max(1, Math.ceil(total / tamano)),
        estadisticas: calcularEstadisticas(leerTodos()),
      };
    },

    estadisticas() {
      return calcularEstadisticas(leerTodos());
    },

    obtener(id) {
      return buscarCliente(id);
    },

    todos() {
      return leerTodos();
    },

    exportar(filtros = {}) {
      return filtrar(filtros);
    },

    crear(datos, actor = '') {
      const errores = validarCliente(datos || {});
      if (errores.length > 0) {
        const error = new Error(errores.join(' '));
        error.errores = errores;
        error.estado = 400;
        throw error;
      }

      const id = `cli-${crypto.randomUUID()}`;
      const cliente = normalizarCliente(datos, { id, codigo: generarCodigo() });
      cliente.ultimo_contacto = cliente.actividades[0]?.fecha || cliente.ultimo_contacto;
      if (cliente.actividades.length === 0) {
        cliente.actividades.push(
          normalizarActividad(
            {
              tipo: 'nota',
              descripcion: 'Registro inicial creado en la plataforma comercial.',
              realizado_por: actor || cliente.responsable,
            },
            id
          )
        );
      }

      coleccion.crear(cliente, { id });
      return coleccion.obtener(id);
    },

    actualizar(id, cambios) {
      const actual = buscarCliente(id);
      if (!actual) return null;

      const errores = validarCliente({ ...actual, ...cambios }, { parcial: true });
      if (errores.length > 0) {
        const error = new Error(errores.join(' '));
        error.errores = errores;
        error.estado = 400;
        throw error;
      }

      const fusionado = { ...actual, ...cambios, id: actual.id, codigo: actual.codigo };
      const normalizado = normalizarCliente(fusionado, {
        id: actual.id,
        codigo: actual.codigo,
        contactos: fusionado.contactos,
        oportunidades: fusionado.oportunidades,
        actividades: fusionado.actividades,
      });
      normalizado.creado_en = actual.creado_en;
      normalizado.actualizado_en = new Date().toISOString();
      return guardarCliente(actual.id, normalizado);
    },

    eliminar(id) {
      coleccion.recargar();
      return coleccion.eliminar(id);
    },

    agregarContacto(clienteId, datos) {
      const cliente = buscarCliente(clienteId);
      if (!cliente) return null;

      const contacto = normalizarContacto(datos, clienteId);
      const contactos = Array.isArray(cliente.contactos) ? [...cliente.contactos] : [];
      const esPrincipal = datos?.es_principal === undefined ? contactos.length === 0 : booleano(datos.es_principal);
      if (esPrincipal) contactos.forEach((item) => { item.es_principal = false; });
      contacto.es_principal = esPrincipal || contactos.length === 0;
      contactos.push(contacto);

      const actualizado = {
        ...cliente,
        contactos,
        actualizado_en: new Date().toISOString(),
      };
      guardarCliente(clienteId, actualizado);
      return contacto;
    },

    eliminarContacto(clienteId, contactoId) {
      const cliente = buscarCliente(clienteId);
      if (!cliente || !Array.isArray(cliente.contactos)) return false;

      const contactos = [...cliente.contactos];
      const indice = contactos.findIndex((contacto) => contacto.id === contactoId);
      if (indice === -1) return false;

      const eraPrincipal = contactos[indice].es_principal;
      contactos.splice(indice, 1);
      if (eraPrincipal && contactos.length > 0) contactos[0].es_principal = true;

      guardarCliente(clienteId, { ...cliente, contactos, actualizado_en: new Date().toISOString() });
      return true;
    },

    marcarContactoPrincipal(clienteId, contactoId) {
      const cliente = buscarCliente(clienteId);
      if (!cliente || !Array.isArray(cliente.contactos)) return false;
      if (!cliente.contactos.some((contacto) => contacto.id === contactoId)) return false;

      const contactos = cliente.contactos.map((contacto) => ({
        ...contacto,
        es_principal: contacto.id === contactoId,
      }));
      guardarCliente(clienteId, { ...cliente, contactos, actualizado_en: new Date().toISOString() });
      return true;
    },

    agregarOportunidad(clienteId, datos) {
      const cliente = buscarCliente(clienteId);
      if (!cliente) return null;

      const oportunidad = normalizarOportunidad(datos, clienteId);
      const oportunidades = [oportunidad, ...(Array.isArray(cliente.oportunidades) ? cliente.oportunidades : [])];
      guardarCliente(clienteId, {
        ...cliente,
        oportunidades,
        valor_estimado: sumarValor(oportunidades),
        actualizado_en: new Date().toISOString(),
      });
      return oportunidad;
    },

    actualizarOportunidad(clienteId, oportunidadId, datos) {
      const cliente = buscarCliente(clienteId);
      if (!cliente || !Array.isArray(cliente.oportunidades)) return null;

      const indice = cliente.oportunidades.findIndex((oportunidad) => oportunidad.id === oportunidadId);
      if (indice === -1) return null;

      const oportunidades = [...cliente.oportunidades];
      oportunidades[indice] = normalizarOportunidad(
        { ...oportunidades[indice], ...datos, cliente_id: clienteId },
        clienteId
      );
      guardarCliente(clienteId, {
        ...cliente,
        oportunidades,
        valor_estimado: sumarValor(oportunidades),
        actualizado_en: new Date().toISOString(),
      });
      return oportunidades[indice];
    },

    eliminarOportunidad(clienteId, oportunidadId) {
      const cliente = buscarCliente(clienteId);
      if (!cliente || !Array.isArray(cliente.oportunidades)) return false;

      const oportunidades = cliente.oportunidades.filter((oportunidad) => oportunidad.id !== oportunidadId);
      if (oportunidades.length === cliente.oportunidades.length) return false;

      guardarCliente(clienteId, {
        ...cliente,
        oportunidades,
        valor_estimado: sumarValor(oportunidades),
        actualizado_en: new Date().toISOString(),
      });
      return true;
    },

    moverEtapaOportunidad(oportunidadId, nuevaEtapa) {
      if (!ETAPAS_OPORTUNIDAD.includes(nuevaEtapa)) return false;
      const probabilidades = { calificacion: 40, propuesta: 65, negociacion: 80, ganada: 100, perdida: 0 };

      for (const cliente of leerTodos()) {
        const oportunidades = Array.isArray(cliente.oportunidades) ? cliente.oportunidades : [];
        const indice = oportunidades.findIndex((oportunidad) => oportunidad.id === oportunidadId);
        if (indice === -1) continue;

        const actualizadas = [...oportunidades];
        const cerrada = nuevaEtapa === 'ganada' || nuevaEtapa === 'perdida';
        actualizadas[indice] = {
          ...actualizadas[indice],
          etapa: nuevaEtapa,
          probabilidad: probabilidades[nuevaEtapa],
          fecha_cierre: cerrada
            ? actualizadas[indice].fecha_cierre || new Date().toISOString()
            : undefined,
        };

        const cambios = {
          ...cliente,
          oportunidades: actualizadas,
          actualizado_en: new Date().toISOString(),
        };
        if (nuevaEtapa === 'ganada') cambios.estado = 'activo';
        else if (nuevaEtapa === 'negociacion' && cliente.estado !== 'activo') cambios.estado = 'en_negociacion';

        guardarCliente(cliente.id, cambios);
        return true;
      }
      return false;
    },

    agregarActividad(clienteId, datos) {
      const cliente = buscarCliente(clienteId);
      if (!cliente) return null;

      const actividad = normalizarActividad(datos, clienteId);
      const actividades = [actividad, ...(Array.isArray(cliente.actividades) ? cliente.actividades : [])];
      guardarCliente(clienteId, {
        ...cliente,
        actividades,
        ultimo_contacto: actividad.fecha,
        actualizado_en: new Date().toISOString(),
      });
      return actividad;
    },

    eliminarActividad(clienteId, actividadId) {
      const cliente = buscarCliente(clienteId);
      if (!cliente || !Array.isArray(cliente.actividades)) return false;

      const actividades = cliente.actividades.filter((actividad) => actividad.id !== actividadId);
      if (actividades.length === cliente.actividades.length) return false;

      guardarCliente(clienteId, {
        ...cliente,
        actividades,
        actualizado_en: new Date().toISOString(),
      });
      return true;
    },

    todasLasOportunidades() {
      const resultado = [];
      for (const cliente of leerTodos()) {
        for (const oportunidad of Array.isArray(cliente.oportunidades) ? cliente.oportunidades : []) {
          resultado.push({
            ...oportunidad,
            cliente_nombre: cliente.nombre_comercial || cliente.razon_social,
            cliente_sector: cliente.sector,
            responsable: cliente.responsable,
          });
        }
      }
      return resultado;
    },

    importar(filas, { reemplazar = false } = {}) {
      if (!Array.isArray(filas)) {
        const error = new Error('El contenido a importar debe ser una lista de clientes.');
        error.estado = 400;
        throw error;
      }

      if (reemplazar) coleccion.reemplazarTodo([]);

      const existentes = leerTodos();
      const claves = new Set(
        existentes.flatMap((cliente) => [
          String(cliente.identificacion_fiscal || '').toLowerCase(),
          String(cliente.razon_social || '').toLowerCase(),
        ]).filter(Boolean)
      );

      const creados = [];
      const omitidos = [];
      const errores = [];

      filas.forEach((fila, indice) => {
        const datos = fila && typeof fila === 'object' ? fila : {};
        const claveFiscal = String(datos.identificacion_fiscal || '').toLowerCase();
        const claveNombre = String(datos.razon_social || '').toLowerCase();

        if ((claveFiscal && claves.has(claveFiscal)) || (claveNombre && claves.has(claveNombre))) {
          omitidos.push({ fila: indice + 2, motivo: 'Cliente duplicado por RNC o razon social.' });
          return;
        }

        const validacion = validarCliente(datos);
        if (validacion.length > 0) {
          errores.push({ fila: indice + 2, motivo: validacion.join(' ') });
          return;
        }

        const id = `cli-${crypto.randomUUID()}`;
        const cliente = normalizarCliente(datos, { id, codigo: generarCodigo() });
        if (cliente.actividades.length === 0) {
          cliente.actividades.push(
            normalizarActividad(
              { tipo: 'nota', descripcion: 'Cliente importado desde archivo CSV.', realizado_por: cliente.responsable },
              id
            )
          );
        }
        coleccion.crear(cliente, { id });
        if (claveFiscal) claves.add(claveFiscal);
        if (claveNombre) claves.add(claveNombre);
        creados.push(coleccion.obtener(id));
      });

      return { creados: creados.length, omitidos, errores, total: leerTodos().length };
    },
  };
}

export function crearAlmacenClientesDesdeEntorno(env = process.env) {
  const coleccion = crearColeccionDesdeEntorno('clientes', env);
  return crearAlmacenClientes(coleccion);
}
