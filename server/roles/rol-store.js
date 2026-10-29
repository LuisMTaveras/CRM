import crypto from 'node:crypto';
import { crearColeccionDesdeEntorno } from '../storage/json-store.js';

/**
 * Catalogo canonico de permisos del CRM. Debe mantenerse en sincronia con
 * `src/modules/auth/types/permisos.types.ts`; el backend valida contra esta lista
 * para no persistir identificadores desconocidos.
 */
export const PERMISOS_VALIDOS = [
  'clientes:ver',
  'clientes:crear',
  'clientes:editar',
  'clientes:eliminar',
  'clientes:exportar',
  'pipeline:ver',
  'pipeline:crear',
  'pipeline:mover',
  'pipeline:editar',
  'pipeline:eliminar',
  'pipeline:configurar',
  'comunicaciones:ver',
  'comunicaciones:enviar',
  'comunicaciones:documentos',
  'comunicaciones:plantillas',
  'metricas:ver_kpis',
  'metricas:ver_ejecutivos',
  'metricas:exportar',
  'usuarios:ver',
  'usuarios:crear',
  'usuarios:editar',
  'usuarios:permisos',
  'roles:administrar',
  'configuracion:ver',
  'configuracion:editar',
];

const CONJUNTO_PERMISOS = new Set(PERMISOS_VALIDOS);

const COLOR_PREDETERMINADO =
  'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20';

export const ROLES_SISTEMA = [
  {
    id: 'admin',
    nombre: 'Administrador / Direccion',
    descripcion: 'Acceso irrestricto y control total de la plataforma y seguridad.',
    colorBadge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
    esSistema: true,
    permisos: [...PERMISOS_VALIDOS],
  },
  {
    id: 'gerente',
    nombre: 'Gerente Comercial',
    descripcion: 'Gestion completa de clientes, pipeline, aprobaciones y auditoria comercial.',
    colorBadge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    esSistema: true,
    permisos: [
      'clientes:ver', 'clientes:crear', 'clientes:editar', 'clientes:exportar',
      'pipeline:ver', 'pipeline:crear', 'pipeline:mover', 'pipeline:editar', 'pipeline:configurar',
      'comunicaciones:ver', 'comunicaciones:enviar', 'comunicaciones:documentos', 'comunicaciones:plantillas',
      'metricas:ver_kpis', 'metricas:ver_ejecutivos', 'metricas:exportar',
      'usuarios:ver',
      'configuracion:ver',
    ],
  },
  {
    id: 'ejecutivo',
    nombre: 'Ejecutivo de Cuentas B2B',
    descripcion: 'Operacion diaria con clientes, oportunidades de venta y envios de cotizaciones.',
    colorBadge: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
    esSistema: true,
    permisos: [
      'clientes:ver', 'clientes:crear', 'clientes:editar',
      'pipeline:ver', 'pipeline:crear', 'pipeline:mover', 'pipeline:editar',
      'comunicaciones:ver', 'comunicaciones:enviar', 'comunicaciones:documentos',
      'metricas:ver_kpis',
    ],
  },
  {
    id: 'auditor',
    nombre: 'Auditor & Cumplimiento',
    descripcion: 'Acceso de solo lectura para supervision, trazabilidad y reportes.',
    colorBadge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    esSistema: true,
    permisos: [
      'clientes:ver', 'clientes:exportar',
      'pipeline:ver',
      'comunicaciones:ver',
      'metricas:ver_kpis', 'metricas:ver_ejecutivos', 'metricas:exportar',
      'usuarios:ver',
      'configuracion:ver',
    ],
  },
];

function texto(valor, limite = 500) {
  return String(valor ?? '').trim().slice(0, limite);
}

function limpiarPermisos(valor) {
  const lista = Array.isArray(valor) ? valor : [];
  return Array.from(new Set(lista.filter((permiso) => CONJUNTO_PERMISOS.has(permiso))));
}

function normalizarRol(datos, { id, esSistema } = {}) {
  const rolId = texto(id || datos?.id, 80);
  const sistema = esSistema ?? datos?.esSistema === true;

  return {
    id: rolId,
    nombre: texto(datos?.nombre, 160),
    descripcion: texto(datos?.descripcion, 400),
    colorBadge: texto(datos?.colorBadge, 200) || COLOR_PREDETERMINADO,
    esSistema: sistema,
    permisos: rolId === 'admin' ? [...PERMISOS_VALIDOS] : limpiarPermisos(datos?.permisos),
  };
}

function errorValidacion(mensaje, estado = 400) {
  const error = new Error(mensaje);
  error.estado = estado;
  return error;
}

function asegurarRolesSistema(roles) {
  const existentes = new Map(roles.map((rol) => [rol.id, rol]));
  return ROLES_SISTEMA.map((base) => {
    const actual = existentes.get(base.id);
    if (!actual) return normalizarRol(base, { id: base.id, esSistema: true });
    return normalizarRol({ ...base, ...actual }, { id: base.id, esSistema: true });
  }).concat(
    roles
      .filter((rol) => rol && typeof rol.id === 'string' && !ROLES_SISTEMA.some((base) => base.id === rol.id))
      .map((rol) => normalizarRol(rol, { id: rol.id, esSistema: false }))
  );
}

export function crearAlmacenRoles(coleccion) {
  const leer = () => {
    coleccion.recargar();
    return asegurarRolesSistema(coleccion.todos());
  };

  const obtener = (id) => {
    const buscado = texto(id, 80);
    return leer().find((rol) => rol.id === buscado) || null;
  };

  const persistir = (roles) => {
    const normalizados = asegurarRolesSistema(roles);
    coleccion.reemplazarTodo(normalizados);
    return normalizados;
  };

  return {
    listar() {
      const roles = leer();
      return { roles, total: roles.length };
    },

    obtener,

    crear(datos = {}) {
      const nombre = texto(datos.nombre, 160);
      if (!nombre) throw errorValidacion('El nombre del rol es obligatorio.');

      const id = texto(datos.id, 80) || `rol-${crypto.randomUUID()}`;
      if (!/^[a-z0-9-]{3,80}$/i.test(id)) {
        throw errorValidacion('El identificador del rol no es valido.');
      }
      if (ROLES_SISTEMA.some((rol) => rol.id === id) || obtener(id)) {
        throw errorValidacion('Ya existe un rol con ese identificador.', 409);
      }

      const rol = normalizarRol({ ...datos, nombre }, { id, esSistema: false });
      const roles = leer();
      roles.push(rol);
      persistir(roles);
      return rol;
    },

    actualizar(id, cambios = {}) {
      const actual = obtener(id);
      if (!actual) return null;

      const fusionado = normalizarRol(
        { ...actual, ...cambios },
        { id: actual.id, esSistema: actual.esSistema }
      );
      if (!fusionado.nombre) throw errorValidacion('El nombre del rol es obligatorio.');

      const roles = leer().map((rol) => (rol.id === actual.id ? fusionado : rol));
      persistir(roles);
      return fusionado;
    },

    eliminar(id) {
      const rol = obtener(id);
      if (!rol) return null;
      if (rol.esSistema) {
        throw errorValidacion('No es posible eliminar roles protegidos del sistema.');
      }

      persistir(leer().filter((item) => item.id !== rol.id));
      return rol;
    },
  };
}

export function crearAlmacenRolesDesdeEntorno(env = process.env) {
  const coleccion = crearColeccionDesdeEntorno('roles', env);
  const guardados = coleccion.todos();
  const roles = asegurarRolesSistema(guardados);
  if (JSON.stringify(guardados) !== JSON.stringify(roles)) {
    coleccion.reemplazarTodo(roles);
  }
  return crearAlmacenRoles(coleccion);
}
