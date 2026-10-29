import type { Rule } from '@/core/permissions/ability';
import type {
  CredencialesLogin,
  OpcionesListadoUsuarios,
  PaginaUsuarios,
  RolUsuario,
  SesionAuth,
  Usuario,
} from '../types/auth.types';
import { rolesPermisosService } from './roles-permisos.service';
import { whatsAppService } from '@/modules/comunicaciones/services/whatsapp.service';
import { crearUsuariosDemo } from './auth.demo-data';
import { API_BASE_URL } from '@/core/api/api-config';

const CLAVE_STORAGE_USUARIOS = 'crm_directorio_usuarios';
const USAR_BACKEND = import.meta.env.MODE === 'production' || import.meta.env.VITE_USE_MOCK === 'false';


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
    return crearUsuariosDemo();
  }

  private guardarUsuariosPersistidos(lista: Usuario[]): void {
    try {
      localStorage.setItem(CLAVE_STORAGE_USUARIOS, JSON.stringify(lista));
    } catch {
      // fallback
    }
  }

  private usuarioDesdeBackend(datos: Partial<Usuario>): Usuario {
    return {
      id: String(datos.id || ''),
      nombre: String(datos.nombre || ''),
      email: String(datos.email || ''),
      contrasena: '',
      rol: String(datos.rol || 'auditor'),
      rolNombre: String(datos.rolNombre || datos.rol || 'Auditor'),
      cargo: String(datos.cargo || ''),
      departamento: datos.departamento ? String(datos.departamento) : undefined,
      telefonoFlota: datos.telefonoFlota ? String(datos.telefonoFlota) : undefined,
      avatar: String(datos.avatar || 'US'),
      activo: datos.activo !== false,
      ultimoAcceso: String(datos.ultimoAcceso || new Date().toISOString()),
      permisosExtras: Array.isArray(datos.permisosExtras) ? datos.permisosExtras : [],
      permisosRevocados: Array.isArray(datos.permisosRevocados) ? datos.permisosRevocados : [],
    };
  }

  private construirSesion(usuario: Usuario, token: string): SesionAuth {
    const permisosEfectivos = rolesPermisosService.calcularPermisosEfectivos(usuario);
    const reglas = rolesPermisosService.convertirPermisosAReglasCASL(permisosEfectivos);
    const { contrasena: _contrasena, ...usuarioSinContrasena } = usuario;

    return {
      usuario: { ...usuarioSinContrasena, ultimoAcceso: new Date().toISOString() },
      token,
      reglas,
      permisosEfectivos,
    };
  }

  async login(credenciales: CredencialesLogin): Promise<SesionAuth> {
    if (USAR_BACKEND) {
      await rolesPermisosService.recargar(true);
      const resp = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credenciales.email,
          contrasena: credenciales.contrasena,
        }),
      });
      const data = await resp.json().catch(() => null);

      if (!resp.ok || !data?.ok || !data?.token || !data?.usuario) {
        throw new Error(data?.error || 'Credenciales inválidas: el correo o la contraseña no coinciden.');
      }

      return this.construirSesion(this.usuarioDesdeBackend(data.usuario), data.token);
    }

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

    return this.construirSesion(usuario, `crm_jwt_${usuario.id}_${Date.now()}`);
  }

  async verificarSesionActual(): Promise<Usuario | null | undefined> {
    if (!USAR_BACKEND) return undefined;

    try {
      await rolesPermisosService.recargar(true);
      const respuesta = await fetch(`${API_BASE_URL}/auth/me`);
      if (respuesta.status === 401) return null;
      if (!respuesta.ok) return undefined;
      const data = await respuesta.json().catch(() => null);
      if (!data?.ok || !data?.usuario) return null;
      return this.usuarioDesdeBackend(data.usuario);
    } catch {
      return undefined;
    }
  }

  async solicitarOtpWhatsApp(telefono: string): Promise<{ ok: boolean; mensaje: string; codigo?: string }> {
    const telLimpio = telefono.replace(/\D/g, '');
    if (!telLimpio || telLimpio.length < 8) {
      throw new Error('Ingresa un número telefónico válido (ej: 829-708-4706).');
    }

    if (USAR_BACKEND) {
      const resp = await fetch(`${API_BASE_URL}/whatsapp/auth/solicitar-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono }),
      });
      const data = await resp.json().catch(() => null);

      if (!resp.ok || !data?.ok) {
        throw new Error(data?.error || 'No se pudo generar el código OTP.');
      }

      return {
        ok: true,
        mensaje: data.mensaje || 'Código de acceso enviado.',
        codigo: data.codigo,
      };
    }

    const usuarios = this.cargarUsuariosPersistidos();
    const usuario = usuarios.find((u) => {
      const uTel = (u.telefonoFlota || '').replace(/\D/g, '');
      if (!uTel || !u.activo) return false;
      return uTel.endsWith(telLimpio) || telLimpio.endsWith(uTel);
    });

    if (!usuario) {
      throw new Error('No se encontró un usuario comercial registrado con este número telefónico.');
    }

    return await whatsAppService.solicitarOtpLogin(telefono);
  }

  async loginConOtp(telefono: string, codigo: string): Promise<SesionAuth> {
    if (USAR_BACKEND) {
      await rolesPermisosService.recargar(true);
      const resp = await fetch(`${API_BASE_URL}/whatsapp/auth/verificar-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono, codigo }),
      });
      const data = await resp.json().catch(() => null);

      if (!resp.ok || !data?.ok || !data?.token || !data?.usuario) {
        throw new Error(data?.error || 'El código OTP ingresado es inválido o ha expirado.');
      }

      return this.construirSesion(this.usuarioDesdeBackend(data.usuario), data.token);
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
    const valido = await whatsAppService.verificarOtpLogin(telefono, codigo);
    if (!valido) {
      throw new Error('El código OTP ingresado es inválido o ha expirado.');
    }

    const telLimpio = telefono.replace(/\D/g, '');
    const usuarios = this.cargarUsuariosPersistidos();
    const usuario = usuarios.find((u) => {
      const uTel = (u.telefonoFlota || '').replace(/\D/g, '');
      if (!uTel) return false;
      return uTel.endsWith(telLimpio) || telLimpio.endsWith(uTel);
    });

    if (!usuario || !usuario.activo) {
      throw new Error('Esta cuenta de usuario no está activa en el sistema.');
    }

    return this.construirSesion(usuario, `crm_jwt_wa_${usuario.id}_${Date.now()}`);
  }

  private async solicitarApi<T>(ruta: string, init: RequestInit = {}): Promise<T> {
    const respuesta = await fetch(`${API_BASE_URL}${ruta}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
    const data = await respuesta.json().catch(() => null);

    if (!respuesta.ok || data?.ok === false) {
      throw new Error(data?.error || 'No se pudo completar la operación con el servidor.');
    }

    return data as T;
  }

  async obtenerUsuariosPaginados(opciones: OpcionesListadoUsuarios = {}): Promise<PaginaUsuarios> {
    const page = Math.max(1, opciones.page || 1);
    const pageSize = Math.min(200, Math.max(1, opciones.pageSize || 25));

    if (USAR_BACKEND) {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (opciones.q) params.set('q', opciones.q);

      const data = await this.solicitarApi<{
        usuarios: Partial<Usuario>[];
        total: number;
        page: number;
        pageSize: number;
        hasMore: boolean;
      }>(`/usuarios?${params.toString()}`);

      return {
        usuarios: (data.usuarios || []).map((usuario) => this.usuarioDesdeBackend(usuario)),
        total: Number(data.total) || 0,
        page: Number(data.page) || page,
        pageSize: Number(data.pageSize) || pageSize,
        hasMore: Boolean(data.hasMore),
      };
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
    const busqueda = (opciones.q || '').trim().toLowerCase();
    const filtrados = this.cargarUsuariosPersistidos().filter((usuario) => {
      if (!busqueda) return true;
      return [usuario.nombre, usuario.email, usuario.cargo, usuario.departamento, usuario.rol, usuario.rolNombre]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(busqueda));
    });
    const inicio = (page - 1) * pageSize;

    return {
      usuarios: filtrados.slice(inicio, inicio + pageSize),
      total: filtrados.length,
      page,
      pageSize,
      hasMore: inicio + pageSize < filtrados.length,
    };
  }

  async obtenerUsuarios(): Promise<Usuario[]> {
    const pagina = await this.obtenerUsuariosPaginados({ page: 1, pageSize: 200 });
    return pagina.usuarios;
  }

  async obtenerUsuarioPorId(id: string): Promise<Usuario | null> {
    if (USAR_BACKEND) {
      try {
        const data = await this.solicitarApi<{ usuario: Partial<Usuario> }>(`/usuarios/${encodeURIComponent(id)}`);
        return data.usuario ? this.usuarioDesdeBackend(data.usuario) : null;
      } catch {
        return null;
      }
    }

    const pagina = await this.obtenerUsuariosPaginados({ page: 1, pageSize: 200 });
    return pagina.usuarios.find((usuario) => usuario.id === id) || null;
  }

  async crearUsuario(datos: Omit<Usuario, 'id' | 'avatar' | 'ultimoAcceso'>): Promise<Usuario> {
    if (USAR_BACKEND) {
      const data = await this.solicitarApi<{ usuario: Partial<Usuario> }>('/usuarios', {
        method: 'POST',
        body: JSON.stringify({
          nombre: datos.nombre,
          email: datos.email,
          contrasena: datos.contrasena,
          rol: datos.rol,
          rolNombre: datos.rolNombre,
          cargo: datos.cargo,
          departamento: datos.departamento,
          telefonoFlota: datos.telefonoFlota,
          activo: datos.activo,
          permisosExtras: datos.permisosExtras,
          permisosRevocados: datos.permisosRevocados,
        }),
      });
      return this.usuarioDesdeBackend(data.usuario);
    }

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
    if (USAR_BACKEND) {
      const data = await this.solicitarApi<{ usuario: Partial<Usuario> }>(`/usuarios/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          nombre: cambios.nombre,
          email: cambios.email,
          rol: cambios.rol,
          rolNombre: cambios.rolNombre,
          cargo: cambios.cargo,
          departamento: cambios.departamento,
          telefonoFlota: cambios.telefonoFlota,
          activo: cambios.activo,
          permisosExtras: cambios.permisosExtras,
          permisosRevocados: cambios.permisosRevocados,
          ...(cambios.contrasena ? { contrasena: cambios.contrasena } : {}),
        }),
      });
      return this.usuarioDesdeBackend(data.usuario);
    }

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
    if (USAR_BACKEND) {
      await this.solicitarApi<{ ok: boolean }>(`/usuarios/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return true;
    }

    const lista = this.cargarUsuariosPersistidos();
    const objetivo = lista.find((usuario) => usuario.id === id);
    if (!objetivo) {
      throw new Error('Usuario no encontrado.');
    }
    const adminsActivos = lista.filter((usuario) => usuario.rol === 'admin' && usuario.activo);
    if (objetivo.rol === 'admin' && objetivo.activo && adminsActivos.length <= 1) {
      throw new Error('No es posible eliminar al ultimo administrador activo.');
    }
    const filtrados = lista.filter((u) => u.id !== id);
    this.guardarUsuariosPersistidos(filtrados);
    return true;
  }
}

export const authService = new AuthService();
