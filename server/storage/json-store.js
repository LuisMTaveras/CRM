import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function escribirAtomico(archivo, contenido) {
  fs.mkdirSync(path.dirname(archivo), { recursive: true });
  const temporal = `${archivo}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporal, contenido, 'utf8');
  fs.renameSync(temporal, archivo);
}

export function crearColeccionJson({ archivo, idPrefijo = 'reg' }) {
  let items = [];

  const recargar = () => {
    try {
      if (!fs.existsSync(archivo)) {
        items = [];
        return items;
      }
      const contenido = JSON.parse(fs.readFileSync(archivo, 'utf8'));
      items = Array.isArray(contenido) ? contenido : [];
    } catch {
      items = [];
    }
    return items;
  };

  const guardar = () => {
    escribirAtomico(archivo, JSON.stringify(items, null, 2));
    return items;
  };

  const clonar = (valor) => JSON.parse(JSON.stringify(valor));

  const listar = ({
    page = 1,
    pageSize = 25,
    q = '',
    camposBusqueda = [],
    filtros = {},
    orden = null,
    direccion = 'desc',
  } = {}) => {
    const pagina = Math.max(1, Number.parseInt(page, 10) || 1);
    const tamano = Math.min(200, Math.max(1, Number.parseInt(pageSize, 10) || 25));
    const busqueda = String(q || '').trim().toLowerCase();

    let resultado = items.filter((item) => {
      for (const [campo, valor] of Object.entries(filtros)) {
        if (valor === undefined || valor === null || valor === '') continue;
        if (String(item[campo] ?? '') !== String(valor)) return false;
      }
      if (!busqueda) return true;
      return camposBusqueda
        .map((campo) => item[campo])
        .filter((valor) => valor !== undefined && valor !== null)
        .some((valor) => String(valor).toLowerCase().includes(busqueda));
    });

    if (orden) {
      const factor = direccion === 'asc' ? 1 : -1;
      resultado = [...resultado].sort((a, b) => {
        const izquierda = a[orden];
        const derecha = b[orden];
        if (typeof izquierda === 'number' && typeof derecha === 'number') {
          return (izquierda - derecha) * factor;
        }
        return String(izquierda ?? '').localeCompare(String(derecha ?? ''), 'es') * factor;
      });
    }

    const total = resultado.length;
    const inicio = (pagina - 1) * tamano;
    return {
      items: clonar(resultado.slice(inicio, inicio + tamano)),
      total,
      page: pagina,
      pageSize: tamano,
      hasMore: inicio + tamano < total,
      totalPaginas: Math.max(1, Math.ceil(total / tamano)),
    };
  };

  return {
    archivo,
    recargar,
    guardar,
    todos() {
      return clonar(items);
    },
    listar,
    obtener(id) {
      const item = items.find((registro) => String(registro.id) === String(id));
      return item ? clonar(item) : null;
    },
    buscar(predicado) {
      const item = items.find(predicado);
      return item ? clonar(item) : null;
    },
    crear(datos, { id } = {}) {
      const registro = {
        ...clonar(datos),
        id: id || datos?.id || `${idPrefijo}-${crypto.randomUUID()}`,
      };
      items.unshift(registro);
      guardar();
      return clonar(registro);
    },
    actualizar(id, cambios) {
      const indice = items.findIndex((registro) => String(registro.id) === String(id));
      if (indice === -1) return null;
      items[indice] = { ...items[indice], ...clonar(cambios), id: items[indice].id };
      guardar();
      return clonar(items[indice]);
    },
    reemplazar(id, datos) {
      const indice = items.findIndex((registro) => String(registro.id) === String(id));
      if (indice === -1) return null;
      items[indice] = { ...clonar(datos), id: items[indice].id };
      guardar();
      return clonar(items[indice]);
    },
    eliminar(id) {
      const indice = items.findIndex((registro) => String(registro.id) === String(id));
      if (indice === -1) return null;
      const [eliminado] = items.splice(indice, 1);
      guardar();
      return clonar(eliminado);
    },
    reemplazarTodo(datos) {
      items = Array.isArray(datos) ? clonar(datos) : [];
      guardar();
      return clonar(items);
    },
  };
}

export function crearColeccionDesdeEntorno(nombre, env = process.env) {
  const base = env.CRM_DB_DIR || path.join(process.cwd(), 'server', 'data');
  return crearColeccionJson({
    archivo: path.join(base, `${nombre}.json`),
    idPrefijo: nombre.slice(0, 3),
  });
}
