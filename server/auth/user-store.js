import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARCHIVO_PREDETERMINADO = path.join(__dirname, '..', 'data', 'usuarios.json');

export function normalizarEmail(valor) {
  return String(valor || '').trim().toLowerCase();
}

export function normalizarTelefono(valor) {
  return String(valor || '').replace(/\D/g, '');
}

export function hashPassword(contrasena, sal = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(contrasena), sal, 64).toString('hex');
  return `scrypt$${sal}$${hash}`;
}

export function verificarPassword(contrasena, almacenado) {
  try {
    const partes = String(almacenado || '').split('$');
    if (partes.length !== 3 || partes[0] !== 'scrypt') return false;
    const [, sal, hashGuardado] = partes;
    const esperado = crypto.scryptSync(String(contrasena), sal, 64);
    const recibido = Buffer.from(hashGuardado, 'hex');
    if (esperado.length !== recibido.length) return false;
    return crypto.timingSafeEqual(esperado, recibido);
  } catch {
    return false;
  }
}

function iniciales(nombre) {
  return String(nombre || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('') || 'US';
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizarEmail(email));
}

function validarContrasena(contrasena) {
  if (String(contrasena || '').trim().length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.');
  }
}

function normalizarLista(valor) {
  return Array.isArray(valor)
    ? [...new Set(valor.map((item) => String(item || '').trim()).filter(Boolean))]
    : [];
}

export function crearAlmacenUsuarios({ archivo = ARCHIVO_PREDETERMINADO, admin = null } = {}) {
  let usuarios = [];

  const guardar = () => {
    fs.mkdirSync(path.dirname(archivo), { recursive: true });
    fs.writeFileSync(archivo, JSON.stringify(usuarios, null, 2), 'utf8');
  };

  const recargar = () => {
    try {
      if (!fs.existsSync(archivo)) {
        usuarios = [];
        return;
      }
      const contenido = JSON.parse(fs.readFileSync(archivo, 'utf8'));
      usuarios = Array.isArray(contenido) ? contenido : [];
    } catch {
      usuarios = [];
    }
  };

  const sembrarAdmin = () => {
    if (!admin || usuarios.length > 0) return;
    if (!admin.email || !admin.contrasena) return;
    if (String(admin.contrasena).length < 8) {
      throw new Error('CRM_ADMIN_PASSWORD debe tener al menos 8 caracteres.');
    }

    const nombre = admin.nombre || 'Administrador';
    usuarios = [{
      id: 'usr-admin',
      nombre,
      email: normalizarEmail(admin.email),
      rol: admin.rol || 'admin',
      rolNombre: admin.rolNombre || 'Administrador',
      cargo: admin.cargo || 'Administración',
      departamento: admin.departamento || 'Dirección',
      telefonoFlota: normalizarTelefono(admin.telefonoFlota),
      avatar: iniciales(nombre),
      activo: true,
      ultimoAcceso: new Date().toISOString(),
      passwordHash: hashPassword(admin.contrasena),
      permisosExtras: [],
      permisosRevocados: [],
    }];
    guardar();
  };

  recargar();
  sembrarAdmin();

  const publico = (usuario) => ({
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    rolNombre: usuario.rolNombre,
    cargo: usuario.cargo,
    departamento: usuario.departamento,
    telefonoFlota: usuario.telefonoFlota,
    avatar: usuario.avatar,
    activo: usuario.activo,
    ultimoAcceso: usuario.ultimoAcceso,
    permisosExtras: usuario.permisosExtras || [],
    permisosRevocados: usuario.permisosRevocados || [],
  });

  const correoDuplicado = (email, exceptoId = null) => {
    const correo = normalizarEmail(email);
    return usuarios.some((usuario) => usuario.id !== exceptoId && normalizarEmail(usuario.email) === correo);
  };

  const contarAdminsActivos = () => usuarios.filter((usuario) => usuario.rol === 'admin' && usuario.activo).length;

  return {
    archivo,
    recargar,
    guardar,
    publico,
    estaConfigurado() {
      return usuarios.length > 0;
    },
    listar() {
      return usuarios.map(publico);
    },
    listarPaginado({ page = 1, pageSize = 25, q = '' } = {}) {
      const pagina = Math.max(1, Number.parseInt(page, 10) || 1);
      const tamano = Math.min(200, Math.max(1, Number.parseInt(pageSize, 10) || 25));
      const busqueda = String(q || '').trim().toLowerCase();
      const filtrados = usuarios
        .filter((usuario) => {
          if (!busqueda) return true;
          return [usuario.nombre, usuario.email, usuario.cargo, usuario.departamento, usuario.rol, usuario.rolNombre]
            .filter(Boolean)
            .some((valor) => String(valor).toLowerCase().includes(busqueda));
        })
        .sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es'));
      const total = filtrados.length;
      const inicio = (pagina - 1) * tamano;

      return {
        usuarios: filtrados.slice(inicio, inicio + tamano).map(publico),
        total,
        page: pagina,
        pageSize: tamano,
        hasMore: inicio + tamano < total,
      };
    },
    validarCredenciales(email, contrasena) {
      const correo = normalizarEmail(email);
      const usuario = usuarios.find((item) => normalizarEmail(item.email) === correo);
      if (!usuario || !usuario.passwordHash) return null;
      if (!usuario.activo) return null;
      if (!verificarPassword(contrasena, usuario.passwordHash)) return null;
      return usuario;
    },
    buscarPorId(id) {
      return usuarios.find((usuario) => usuario.id === id) || null;
    },
    buscarPorEmail(email) {
      const correo = normalizarEmail(email);
      return usuarios.find((usuario) => normalizarEmail(usuario.email) === correo) || null;
    },
    buscarPorTelefono(telefono) {
      const buscado = normalizarTelefono(telefono);
      if (!buscado) return null;
      return usuarios.find((usuario) => {
        const registrado = normalizarTelefono(usuario.telefonoFlota);
        if (!registrado) return false;
        return registrado === buscado || registrado.endsWith(buscado) || buscado.endsWith(registrado);
      }) || null;
    },
    actualizarUltimoAcceso(id) {
      const usuario = usuarios.find((item) => item.id === id);
      if (!usuario) return;
      usuario.ultimoAcceso = new Date().toISOString();
      guardar();
    },
    agregar(datos) {
      if (!datos?.nombre || !datos?.email || !datos?.contrasena) {
        throw new Error('Nombre, correo y contraseña son requeridos.');
      }
      if (!validarEmail(datos.email)) {
        throw new Error('El correo electrónico no es válido.');
      }
      if (correoDuplicado(datos.email)) {
        throw new Error('Ya existe un usuario con ese correo.');
      }
      validarContrasena(datos.contrasena);

      const nombre = String(datos.nombre).trim();
      const usuario = {
        id: datos.id || `usr-${Date.now().toString(36)}`,
        nombre,
        email: normalizarEmail(datos.email),
        rol: String(datos.rol || 'ejecutivo').trim(),
        rolNombre: datos.rolNombre || 'Ejecutivo',
        cargo: datos.cargo || '',
        departamento: datos.departamento || '',
        telefonoFlota: normalizarTelefono(datos.telefonoFlota),
        avatar: iniciales(nombre),
        activo: datos.activo !== false,
        ultimoAcceso: datos.ultimoAcceso || new Date().toISOString(),
        passwordHash: hashPassword(datos.contrasena),
        permisosExtras: normalizarLista(datos.permisosExtras),
        permisosRevocados: normalizarLista(datos.permisosRevocados),
      };

      usuarios.push(usuario);
      guardar();
      return publico(usuario);
    },
    actualizar(id, datos = {}) {
      const usuario = usuarios.find((item) => item.id === id);
      if (!usuario) {
        throw new Error('Usuario no encontrado.');
      }
      if (datos.email !== undefined) {
        if (!validarEmail(datos.email)) {
          throw new Error('El correo electrónico no es válido.');
        }
        if (correoDuplicado(datos.email, id)) {
          throw new Error('Ya existe un usuario con ese correo.');
        }
      }

      const rolSiguiente = datos.rol !== undefined ? String(datos.rol).trim() : usuario.rol;
      const activoSiguiente = datos.activo !== undefined ? datos.activo !== false : usuario.activo;
      const dejaDeSerAdminActivo = usuario.rol === 'admin' && usuario.activo
        && (!activoSiguiente || rolSiguiente !== 'admin');

      if (dejaDeSerAdminActivo && contarAdminsActivos() <= 1) {
        throw new Error('No es posible desactivar o cambiar el rol del último administrador activo.');
      }

      if (datos.contrasena !== undefined && String(datos.contrasena).trim()) {
        validarContrasena(datos.contrasena);
        usuario.passwordHash = hashPassword(datos.contrasena);
      }

      if (datos.nombre !== undefined && String(datos.nombre).trim()) {
        usuario.nombre = String(datos.nombre).trim();
        usuario.avatar = iniciales(usuario.nombre);
      }
      if (datos.email !== undefined) usuario.email = normalizarEmail(datos.email);
      if (datos.rol !== undefined) usuario.rol = rolSiguiente || usuario.rol;
      if (datos.rolNombre !== undefined) usuario.rolNombre = datos.rolNombre;
      if (datos.cargo !== undefined) usuario.cargo = datos.cargo;
      if (datos.departamento !== undefined) usuario.departamento = datos.departamento;
      if (datos.telefonoFlota !== undefined) usuario.telefonoFlota = normalizarTelefono(datos.telefonoFlota);
      if (datos.activo !== undefined) usuario.activo = activoSiguiente;
      if (datos.permisosExtras !== undefined) usuario.permisosExtras = normalizarLista(datos.permisosExtras);
      if (datos.permisosRevocados !== undefined) usuario.permisosRevocados = normalizarLista(datos.permisosRevocados);

      guardar();
      return publico(usuario);
    },
    eliminar(id) {
      const indice = usuarios.findIndex((usuario) => usuario.id === id);
      if (indice === -1) {
        throw new Error('Usuario no encontrado.');
      }
      const usuario = usuarios[indice];
      if (usuario.rol === 'admin' && usuario.activo && contarAdminsActivos() <= 1) {
        throw new Error('No es posible eliminar al último administrador activo.');
      }

      usuarios.splice(indice, 1);
      guardar();
      return publico(usuario);
    },
  };
}

export function crearAlmacenUsuariosDesdeEntorno(env = process.env) {
  const archivo = env.CRM_USERS_FILE || ARCHIVO_PREDETERMINADO;
  const admin = env.CRM_ADMIN_EMAIL && env.CRM_ADMIN_PASSWORD
    ? {
        email: env.CRM_ADMIN_EMAIL,
        contrasena: env.CRM_ADMIN_PASSWORD,
        nombre: env.CRM_ADMIN_NOMBRE || 'Administrador',
        rol: env.CRM_ADMIN_ROL || 'admin',
        rolNombre: env.CRM_ADMIN_ROL_NOMBRE || 'Administrador',
        cargo: env.CRM_ADMIN_CARGO || 'Administración',
        departamento: env.CRM_ADMIN_DEPARTAMENTO || 'Dirección',
        telefonoFlota: env.CRM_ADMIN_TELEFONO || '',
      }
    : null;

  return crearAlmacenUsuarios({ archivo, admin });
}
