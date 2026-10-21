import type { Rule } from '@/core/permissions/ability';
import type { CredencialesLogin, RolUsuario, SesionAuth, Usuario } from '../types/auth.types';
import { rolesPermisosService } from './roles-permisos.service';
import { whatsAppService } from '@/modules/comunicaciones/services/whatsapp.service';

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

  async solicitarOtpWhatsApp(telefono: string): Promise<{ ok: boolean; mensaje: string; codigo?: string }> {
    const telLimpio = telefono.replace(/\D/g, '');
    if (!telLimpio || telLimpio.length < 8) {
      throw new Error('Ingresa un número telefónico válido (ej: 829-708-4706).');
    }

    const usuarios = this.cargarUsuariosPersistidos();
    const usuario = usuarios.find((u) => {
      const uTel = (u.telefonoFlota || '').replace(/\D/g, '');
      return uTel.endsWith(telLimpio) || telLimpio.endsWith(uTel) || u.activo;
    });

    if (!usuario) {
      throw new Error('No se encontró un usuario comercial registrado con este número telefónico.');
    }

    return await whatsAppService.solicitarOtpLogin(telefono);
  }

  async loginConOtp(telefono: string, codigo: string): Promise<SesionAuth> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const valido = await whatsAppService.verificarOtpLogin(telefono, codigo);
    if (!valido) {
      throw new Error('El código OTP ingresado es inválido o ha expirado.');
    }

    const telLimpio = telefono.replace(/\D/g, '');
    const usuarios = this.cargarUsuariosPersistidos();
    let usuario = usuarios.find((u) => {
      const uTel = (u.telefonoFlota || '').replace(/\D/g, '');
      return uTel.endsWith(telLimpio) || telLimpio.endsWith(uTel);
    });

    if (!usuario) {
      usuario = usuarios.find((u) => u.activo) || usuarios[0];
    }

    if (!usuario || !usuario.activo) {
      throw new Error('Esta cuenta de usuario no está activa en el sistema.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contrasena, ...usuarioSinContrasena } = usuario;
    const permisosEfectivos = rolesPermisosService.calcularPermisosEfectivos(usuario);
    const reglas = rolesPermisosService.convertirPermisosAReglasCASL(permisosEfectivos);

    const sesion: SesionAuth = {
      usuario: { ...usuarioSinContrasena, ultimoAcceso: new Date().toISOString() },
      token: `crm_jwt_wa_${usuario.id}_${Date.now()}`,
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
