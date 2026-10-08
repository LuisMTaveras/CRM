import type { Rule } from '@/core/permissions/ability';
import type { CredencialesLogin, RolUsuario, SesionAuth, Usuario } from '../types/auth.types';
import { rolesPermisosService } from './roles-permisos.service';

const CLAVE_STORAGE_USUARIOS = 'crm_directorio_usuarios';

export const USUARIOS_CRM: Usuario[] = [
  {
    id: 'usr-1',
    nombre: 'Luis M. Taveras',
    email: 'luismiguel@alliance.do',
    contrasena: 'admin123',
    rol: 'admin',
    rolNombre: 'Team Leader & Administrador',
    cargo: 'Team Leader TI Support',
    departamento: 'Ingeniería de Software & Soporte TI',
    telefonoFlota: '+1 (829) 708-4706',
    avatar: 'LT',
    activo: true,
    ultimoAcceso: new Date().toISOString(),
  },
  {
    id: 'usr-2',
    nombre: 'Ignacio Silva',
    email: 'ignacio@alliance.do',
    contrasena: 'ventas123',
    rol: 'ejecutivo',
    rolNombre: 'Ejecutivo Comercial Senior',
    cargo: 'Account Executive B2B',
    departamento: 'Ventas Corporativas',
    telefonoFlota: '+1 (809) 555-0102',
    avatar: 'IS',
    activo: true,
    ultimoAcceso: '2026-10-05T14:15:00Z',
    permisosExtras: ['clientes:exportar'], // Ejemplo de override directo
  },
  {
    id: 'usr-3',
    nombre: 'Felipe Guzmán',
    email: 'felipe@alliance.do',
    contrasena: 'gerente123',
    rol: 'gerente',
    rolNombre: 'Gerente de Cuentas Estratégicas',
    cargo: 'Key Account Manager',
    departamento: 'Grandes Cuentas & Expansión',
    telefonoFlota: '+1 (809) 555-0103',
    avatar: 'FG',
    activo: true,
    ultimoAcceso: '2026-10-04T18:00:00Z',
  },
  {
    id: 'usr-4',
    nombre: 'Laura Peña',
    email: 'laura@alliance.do',
    contrasena: 'auditor123',
    rol: 'auditor',
    rolNombre: 'Auditora & Analista de Riesgo',
    cargo: 'Business Intelligence Analyst',
    departamento: 'Auditoría & Cumplimiento',
    telefonoFlota: '+1 (809) 555-0104',
    avatar: 'LP',
    activo: true,
    ultimoAcceso: '2026-10-05T09:45:00Z',
  },
  {
    id: 'usr-5',
    nombre: 'Roberto Méndez',
    email: 'roberto@alliance.do',
    contrasena: 'ventas123',
    rol: 'ejecutivo',
    rolNombre: 'Ejecutivo Comercial Corporativo',
    cargo: 'Corporate Account Executive',
    departamento: 'Ventas Corporativas',
    telefonoFlota: '+1 (809) 555-0105',
    avatar: 'RM',
    activo: true,
    ultimoAcceso: '2026-10-05T11:20:00Z',
  },
  {
    id: 'usr-6',
    nombre: 'Valentina Castillo',
    email: 'valentina@alliance.do',
    contrasena: 'ventas123',
    rol: 'ejecutivo',
    rolNombre: 'Ejecutiva de Desarrollo de Negocios',
    cargo: 'Business Development Specialist',
    departamento: 'Nuevos Negocios',
    telefonoFlota: '+1 (809) 555-0106',
    avatar: 'VC',
    activo: true,
    ultimoAcceso: '2026-10-05T13:40:00Z',
  },
];

export function generarReglasPorRol(rol: RolUsuario): Rule[] {
  const usuarioTemp: Usuario = {
    id: 'temp',
    nombre: 'Temp',
    email: 'temp@crm.local',
    contrasena: '',
    rol,
    rolNombre: rol,
    cargo: '',
    avatar: '',
    activo: true,
    ultimoAcceso: '',
  };
  const permisos = rolesPermisosService.calcularPermisosEfectivos(usuarioTemp);
  return rolesPermisosService.convertirPermisosAReglasCASL(permisos);
}

export function generarReglasParaUsuario(usuario: Usuario): Rule[] {
  const permisos = rolesPermisosService.calcularPermisosEfectivos(usuario);
  return rolesPermisosService.convertirPermisosAReglasCASL(permisos);
}

class AuthService {
  private cargarUsuariosPersistidos(): Usuario[] {
    try {
      const guardados = localStorage.getItem(CLAVE_STORAGE_USUARIOS);
      if (guardados) {
        const parsed: Usuario[] = JSON.parse(guardados);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return [...USUARIOS_CRM];
  }

  private guardarUsuariosPersistidos(lista: Usuario[]): void {
    try {
      localStorage.setItem(CLAVE_STORAGE_USUARIOS, JSON.stringify(lista));
    } catch {
      // fallback
    }
  }

  async login(credenciales: CredencialesLogin): Promise<SesionAuth> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const emailLimpio = (credenciales.email || '').toLowerCase().trim();
    const directorio = this.cargarUsuariosPersistidos();
    const usuario = directorio.find((u) => u.email.toLowerCase() === emailLimpio);

    if (!usuario) {
      throw new Error('Credenciales inválidas: el correo o la contraseña no coinciden.');
    }

    if (!credenciales.contrasena || usuario.contrasena !== credenciales.contrasena) {
      throw new Error('Credenciales inválidas: el correo o la contraseña no coinciden.');
    }

    if (!usuario.activo) {
      throw new Error('Esta cuenta de usuario ha sido desactivada por el administrador.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contrasena, ...usuarioSinContrasena } = usuario;
    const permisosEfectivos = rolesPermisosService.calcularPermisosEfectivos(usuario);
    const reglas = rolesPermisosService.convertirPermisosAReglasCASL(permisosEfectivos);
    
    const sesion: SesionAuth = {
      usuario: { ...usuarioSinContrasena, ultimoAcceso: new Date().toISOString() },
      token: `crm_jwt_${usuario.id}_${Date.now()}`,
      reglas,
      permisosEfectivos,
    };

    return sesion;
  }

  async obtenerUsuarios(): Promise<Usuario[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return this.cargarUsuariosPersistidos();
  }

  async obtenerUsuarioPorId(id: string): Promise<Usuario | null> {
    const usuarios = this.cargarUsuariosPersistidos();
    return usuarios.find((u) => u.id === id) || null;
  }

  async crearUsuario(datos: Omit<Usuario, 'id' | 'avatar' | 'ultimoAcceso'>): Promise<Usuario> {
    const lista = this.cargarUsuariosPersistidos();
    const id = `usr-${Date.now().toString(36)}`;
    const avatar = datos.nombre
      .split(' ')
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('');

    const nuevoUsuario: Usuario = {
      ...datos,
      id,
      avatar: avatar || 'US',
      ultimoAcceso: new Date().toISOString(),
      permisosExtras: datos.permisosExtras || [],
      permisosRevocados: datos.permisosRevocados || [],
    };

    lista.push(nuevoUsuario);
    this.guardarUsuariosPersistidos(lista);
    return nuevoUsuario;
  }

  async actualizarUsuario(id: string, cambios: Partial<Usuario>): Promise<Usuario> {
    const lista = this.cargarUsuariosPersistidos();
    const idx = lista.findIndex((u) => u.id === id);
    if (idx === -1) {
      throw new Error('Usuario no encontrado.');
    }

    const usuarioActualizado: Usuario = {
      ...lista[idx],
      ...cambios,
      permisosExtras: cambios.permisosExtras !== undefined ? cambios.permisosExtras : lista[idx].permisosExtras,
      permisosRevocados: cambios.permisosRevocados !== undefined ? cambios.permisosRevocados : lista[idx].permisosRevocados,
    };

    lista[idx] = usuarioActualizado;
    this.guardarUsuariosPersistidos(lista);
    return usuarioActualizado;
  }

  async eliminarUsuario(id: string): Promise<boolean> {
    const lista = this.cargarUsuariosPersistidos();
    if (id === 'usr-1') {
      throw new Error('No es posible eliminar al Administrador principal del sistema.');
    }
    const filtrados = lista.filter((u) => u.id !== id);
    this.guardarUsuariosPersistidos(filtrados);
    return true;
  }
}

export const authService = new AuthService();
