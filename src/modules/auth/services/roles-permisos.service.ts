import type { Rule } from '@/core/permissions/ability';
import type { Usuario } from '../types/auth.types';
import { 
  type RolDefinicion, 
  CATALOGO_PERMISOS, 
  ROLES_SISTEMA_INICIALES 
} from '../types/permisos.types';

const CLAVE_STORAGE_ROLES = 'crm_roles_definiciones';

class RolesPermisosService {
  private cargarRolesPersistidos(): RolDefinicion[] {
    try {
      const guardados = localStorage.getItem(CLAVE_STORAGE_ROLES);
      if (guardados) {
        const parsed: RolDefinicion[] = JSON.parse(guardados);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Asegurar que los roles base de sistema estén siempre presentes
          const idsExistentes = new Set(parsed.map((r) => r.id));
          const rolesCompletos = [...parsed];
          for (const rolBase of ROLES_SISTEMA_INICIALES) {
            if (!idsExistentes.has(rolBase.id)) {
              rolesCompletos.push(rolBase);
            }
          }
          return rolesCompletos;
        }
      }
    } catch {
      // fallback
    }
    return [...ROLES_SISTEMA_INICIALES];
  }

  private guardarRoles(roles: RolDefinicion[]): void {
    try {
      localStorage.setItem(CLAVE_STORAGE_ROLES, JSON.stringify(roles));
    } catch {
      // fallback
    }
  }

  obtenerRoles(): RolDefinicion[] {
    return this.cargarRolesPersistidos();
  }

  obtenerRolPorId(id: string): RolDefinicion | undefined {
    return this.cargarRolesPersistidos().find((r) => r.id === id);
  }

  crearRol(datos: {
    nombre: string;
    descripcion: string;
    colorBadge?: string;
    permisos: string[];
  }): RolDefinicion {
    const roles = this.cargarRolesPersistidos();
    const idSlug = `rol-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const nuevoRol: RolDefinicion = {
      id: idSlug,
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion.trim(),
      colorBadge: datos.colorBadge || 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
      esSistema: false,
      permisos: [...datos.permisos],
    };

    roles.push(nuevoRol);
    this.guardarRoles(roles);
    return nuevoRol;
  }

  actualizarRol(id: string, cambios: Partial<RolDefinicion>): RolDefinicion {
    const roles = this.cargarRolesPersistidos();
    const idx = roles.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw new Error('Rol no encontrado.');
    }

    const rolExistente = roles[idx];
    const rolActualizado: RolDefinicion = {
      ...rolExistente,
      ...cambios,
      id: rolExistente.id, // el ID es inmutable
      esSistema: rolExistente.esSistema, // no se puede alterar flag de sistema
    };

    roles[idx] = rolActualizado;
    this.guardarRoles(roles);
    return rolActualizado;
  }

  eliminarRol(id: string): boolean {
    const roles = this.cargarRolesPersistidos();
    const rol = roles.find((r) => r.id === id);
    if (!rol) return false;

    if (rol.esSistema) {
      throw new Error('No es posible eliminar roles protegidos del sistema.');
    }

    const filtrados = roles.filter((r) => r.id !== id);
    this.guardarRoles(filtrados);
    return true;
  }

  /**
   * Calcula los permisos efectivos de un usuario en base a:
   * (Permisos del Rol + Permisos Extras Directos) - Permisos Revocados Directos
   */
  calcularPermisosEfectivos(usuario: Pick<Usuario, 'rol'> & { permisosExtras?: string[]; permisosRevocados?: string[] }): string[] {
    const roles = this.cargarRolesPersistidos();
    const rol = roles.find((r) => r.id === usuario.rol) || roles.find((r) => r.id === 'ejecutivo');

    const conjunto = new Set<string>(rol?.permisos || []);

    // Conceder extras directos otorgados a este usuario
    if (usuario.permisosExtras && Array.isArray(usuario.permisosExtras)) {
      for (const extra of usuario.permisosExtras) {
        conjunto.add(extra);
      }
    }

    // Quitar revocaciones directas aplicadas a este usuario
    if (usuario.permisosRevocados && Array.isArray(usuario.permisosRevocados)) {
      for (const revocado of usuario.permisosRevocados) {
        conjunto.delete(revocado);
      }
    }

    return Array.from(conjunto);
  }

  /**
   * Determina el estado de un permiso específico para un usuario:
   * - 'heredado': viene del rol asignado y no está revocado
   * - 'extra': fue añadido manualmente al usuario (su rol no lo tenía)
   * - 'revocado': su rol lo tenía, pero se le quitó específicamente
   * - 'denegado': no lo tiene ni el rol ni el usuario
   */
  obtenerEstadoPermisoUsuario(
    usuario: Pick<Usuario, 'rol'> & { permisosExtras?: string[]; permisosRevocados?: string[] }, 
    permisoId: string
  ): 'heredado' | 'extra' | 'revocado' | 'denegado' {
    const roles = this.cargarRolesPersistidos();
    const rol = roles.find((r) => r.id === usuario.rol);
    const rolTiene = rol ? rol.permisos.includes(permisoId) : false;

    const esExtra = usuario.permisosExtras?.includes(permisoId) ?? false;
    const esRevocado = usuario.permisosRevocados?.includes(permisoId) ?? false;

    if (esRevocado) return 'revocado';
    if (esExtra) return 'extra';
    if (rolTiene) return 'heredado';
    return 'denegado';
  }

  /**
   * Convierte la lista de permisos efectivos en reglas CASL para globalAbility
   */
  convertirPermisosAReglasCASL(permisos: string[]): Rule[] {
    const permisosSet = new Set(permisos);

    // Si tiene todos los permisos o rol admin con manage all
    if (permisosSet.size >= CATALOGO_PERMISOS.length) {
      return [{ action: 'manage', subject: 'all' }];
    }

    const reglas: Rule[] = [];

    // Clientes
    const accionesClientes: Array<'read' | 'create' | 'update' | 'delete'> = [];
    if (permisosSet.has('clientes:ver')) accionesClientes.push('read');
    if (permisosSet.has('clientes:crear')) accionesClientes.push('create');
    if (permisosSet.has('clientes:editar')) accionesClientes.push('update');
    if (permisosSet.has('clientes:eliminar')) accionesClientes.push('delete');
    if (accionesClientes.length > 0) {
      reglas.push({ action: accionesClientes, subject: 'Cliente' });
    }

    // Oportunidades / Pipeline
    const accionesPipeline: Array<'read' | 'create' | 'update' | 'delete'> = [];
    if (permisosSet.has('pipeline:ver')) accionesPipeline.push('read');
    if (permisosSet.has('pipeline:crear')) accionesPipeline.push('create');
    if (permisosSet.has('pipeline:mover') || permisosSet.has('pipeline:editar')) accionesPipeline.push('update');
    if (permisosSet.has('pipeline:eliminar')) accionesPipeline.push('delete');
    if (accionesPipeline.length > 0) {
      reglas.push({ action: accionesPipeline, subject: 'Oportunidad' });
    }

    // Comunicaciones
    if (permisosSet.has('comunicaciones:ver')) {
      reglas.push({ action: ['read', 'create'], subject: 'Comunicaciones' });
    }

    // Métricas
    if (permisosSet.has('metricas:ver_kpis') || permisosSet.has('metricas:ver_ejecutivos')) {
      reglas.push({ action: 'read', subject: 'Metricas' });
    }

    // Usuarios
    const accionesUsuarios: Array<'read' | 'create' | 'update'> = [];
    if (permisosSet.has('usuarios:ver')) accionesUsuarios.push('read');
    if (permisosSet.has('usuarios:crear')) accionesUsuarios.push('create');
    if (permisosSet.has('usuarios:editar') || permisosSet.has('usuarios:permisos')) accionesUsuarios.push('update');
    if (accionesUsuarios.length > 0) {
      reglas.push({ action: accionesUsuarios, subject: 'Usuario' });
    }

    return reglas;
  }
}

export const rolesPermisosService = new RolesPermisosService();
