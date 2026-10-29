import crypto from 'node:crypto';
import { crearColeccionDesdeEntorno } from '../storage/json-store.js';
import { CATALOGO_INICIAL } from './catalogo-semilla.js';

export const CATEGORIAS_CATALOGO = [
  'licenciamiento',
  'implementacion',
  'soporte',
  'desarrollo',
  'consultoria',
  'capacitacion',
];
export const MONEDAS_CATALOGO = ['DOP', 'USD'];

function texto(valor, limite = 500) {
  return String(valor ?? '').trim().slice(0, limite);
}

function numero(valor) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

function normalizar(datos, idExistente) {
  return {
    id: texto(idExistente || datos?.id, 80) || `cat-${crypto.randomUUID()}`,
    codigo: texto(datos?.codigo, 60).toUpperCase(),
    nombre: texto(datos?.nombre, 240),
    descripcion: texto(datos?.descripcion, 2000),
    categoria: CATEGORIAS_CATALOGO.includes(datos?.categoria) ? datos.categoria : 'licenciamiento',
    precioBase: Math.max(0, numero(datos?.precioBase)),
    moneda: MONEDAS_CATALOGO.includes(datos?.moneda) ? datos.moneda : 'DOP',
    aplicaItbis: datos?.aplicaItbis !== false,
    tasaItbis: Math.max(0, numero(datos?.tasaItbis ?? 0.18)),
    unidadMedida: texto(datos?.unidadMedida, 80) || 'Unidad',
  };
}

export function crearAlmacenCatalogo(coleccion) {
  const leer = () => {
    coleccion.recargar();
    return coleccion.todos();
  };

  const obtener = (id) => {
    coleccion.recargar();
    return coleccion.obtener(id);
  };

  const obtenerPorCodigo = (codigo) => {
    const buscado = texto(codigo).toLowerCase();
    return leer().find((item) => item.codigo.toLowerCase() === buscado) || null;
  };

  return {
    listar({ busqueda = '', categoria = '', moneda = '' } = {}) {
      const q = texto(busqueda).toLowerCase();
      const items = leer().filter((item) => {
        if (categoria && item.categoria !== categoria) return false;
        if (moneda && item.moneda !== moneda) return false;
        if (!q) return true;
        return (
          String(item.nombre || '').toLowerCase().includes(q) ||
          String(item.codigo || '').toLowerCase().includes(q) ||
          String(item.descripcion || '').toLowerCase().includes(q)
        );
      });
      return { items, total: items.length };
    },

    obtener(id) {
      return obtener(id);
    },

    obtenerPorCodigo(codigo) {
      return obtenerPorCodigo(codigo);
    },

    crear(datos) {
      if (!texto(datos?.nombre)) {
        const error = new Error('El nombre del item es obligatorio.');
        error.estado = 400;
        throw error;
      }
      if (!texto(datos?.codigo)) {
        const error = new Error('El codigo del item es obligatorio.');
        error.estado = 400;
        throw error;
      }
      if (obtenerPorCodigo(datos.codigo)) {
        const error = new Error('Ya existe un item con ese codigo.');
        error.estado = 409;
        throw error;
      }

      const item = normalizar(datos);
      coleccion.crear(item, { id: item.id });
      return item;
    },

    actualizar(id, cambios) {
      const actual = obtener(id);
      if (!actual) return null;
      if (cambios?.codigo) {
        const existente = obtenerPorCodigo(cambios.codigo);
        if (existente && existente.id !== id) {
          const error = new Error('Ya existe un item con ese codigo.');
          error.estado = 409;
          throw error;
        }
      }
      const actualizado = normalizar({ ...actual, ...cambios }, actual.id);
      return coleccion.reemplazar(actual.id, actualizado);
    },

    eliminar(id) {
      coleccion.recargar();
      return coleccion.eliminar(id);
    },
  };
}

export function crearAlmacenCatalogoDesdeEntorno(env = process.env) {
  const coleccion = crearColeccionDesdeEntorno('catalogo', env);
  if (coleccion.todos().length === 0) {
    coleccion.reemplazarTodo(CATALOGO_INICIAL);
  }
  return crearAlmacenCatalogo(coleccion);
}
