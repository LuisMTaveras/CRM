import type { Action, Rule } from '@/core/permissions/ability';
import type { Usuario } from '../types/auth.types';
import { API_BASE_URL } from '@/core/api/api-config';
import { toastService } from '@/core/notifications/toast.service';
import { 
  type RolDefinicion, 
  CATALOGO_PERMISOS, 
  ROLES_SISTEMA_INICIALES 
} from '../types/permisos.types';

const CLAVE_STORAGE_ROLES = 'crm_roles_definiciones';
const IDS_PERMISOS_VALIDOS = new Set(CATALOGO_PERMISOS.map((permiso) => permiso.id));
const USAR_BACKEND =
  import.meta.env.MODE === 'production' || import.meta.env.VITE_USE_MOCK === 'false';

class RolesPermisosService {
  private cacheBackend: RolDefinicion[] | null = null;
  private hidratacionEnCurso: Promise<void> | null = null;

  private rolesSistema(): RolDefinicion[] {
    return ROLES_SISTEMA_INICIALES.map((rol) => this.normalizarRol(rol));
  }

  private async solicitar<T>(ruta: string, init?: RequestInit): Promise<T> {
    const respuesta = await fetch(`${API_BASE_URL}/roles${ruta}`, init);
    const data = await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
      throw new Error(
        (data && typeof data.error === 'string' && data.error) ||
          `No se pudo sincronizar los roles (${respuesta.status}).`
      );
    }

    return data as T;
  }

  private opcionesJson(method: string, body?: unknown): RequestInit {
    return {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    };
  }

  /**
   * Hidrata la cache de roles desde el backend para que los consumidores
   * sincronicos (motor CASL, guards de ruta, badges) dispongan del catalogo real.
   */
  async recargar(forzar = false): Promise<void> {
    if (!USAR_BACKEND) return;
    if (this.hidratacionEnCurso && !forzar) return this.hidratacionEnCurso;

    this.hidratacionEnCurso = (async () => {
      try {
        const data = await this.solicitar<{ ok: boolean; roles: RolDefinicion[] }>('');
        if (Array.isArray(data.roles) && data.roles.length > 0) {
          this.cacheBackend = data.roles.map((rol) => this.normalizarRol(rol));
        }
      } catch {
        if (!this.cacheBackend) this.cacheBackend = this.rolesSistema();
      } finally {
        this.hidratacionEnCurso = null;
      }
    })();

    return this.hidratacionEnCurso;
  }

  private sincronizarEscritura(
    crearPeticion: () => Promise<RolDefinicion | void>,
    alFallar?: () => void
  ): void {
    if (!USAR_BACKEND) return;

    void crearPeticion().catch((error: unknown) => {
      toastService.error(
        error instanceof Error ? error.message : 'No se pudo sincronizar los roles.'
      );
      alFallar?.();
      void this.recargar(true);
    });
  }

  private normalizarRol(rol: RolDefinicion): RolDefinicion {
    const permisosValidos = Array.isArray(rol.permisos)
      ? rol.permisos.filter((permiso) => IDS_PERMISOS_VALIDOS.has(permiso))
      : [];

    return {
      ...rol,
      esSistema: rol.id === 'admin' ? true : rol.esSistema,
      permisos: rol.id === 'admin'
        ? CATALOGO_PERMISOS.map((permiso) => permiso.id)
        : permisosValidos,
    };
  }

  private cargarRolesPersistidos(): RolDefinicion[] {
    if (USAR_BACKEND) {
      if (!this.cacheBackend) void this.recargar();
      return this.cacheBackend ?? this.rolesSistema();
    }

    try {
      const guardados = localStorage.getItem(CLAVE_STORAGE_ROLES);
      if (guardados) {
        const parsed: RolDefinicion[] = JSON.parse(guardados);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Asegurar que los roles base de sistema estÃ©n siempre presentes
          const idsExistentes = new Set(parsed.map((r) => r.id));
          const rolesCompletos = parsed
            .filter((rol) => rol && typeof rol.id === 'string')
            .map((rol) => this.normalizarRol(rol));
          for (const rolBase of ROLES_SISTEMA_INICIALES) {
            if (!idsExistentes.has(rolBase.id)) {
              rolesCompletos.push(this.normalizarRol(rolBase));
            }
          }
          return rolesCompletos;
        }
      }
    } catch {
      // fallback
    }
    return ROLES_SISTEMA_INICIALES.map((rol) => this.normalizarRol(rol));
  }

  private guardarRoles(roles: RolDefinicion[]): void {
    if (USAR_BACKEND) {
      this.cacheBackend = roles;
      return;
    }

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
      permisos: datos.permisos.filter((permiso) => IDS_PERMISOS_VALIDOS.has(permiso)),
    };

    roles.push(nuevoRol);
    this.guardarRoles(roles);
    this.sincronizarEscritura(() =>
      this.solicitar<RolDefinicion>('', this.opcionesJson('POST', nuevoRol))
    );
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
      permisos: rolExistente.id === 'admin'
        ? CATALOGO_PERMISOS.map((permiso) => permiso.id)
        : (cambios.permisos ?? rolExistente.permisos).filter((permiso) => IDS_PERMISOS_VALIDOS.has(permiso)),
    };

    roles[idx] = rolActualizado;
    this.guardarRoles(roles);
    this.sincronizarEscritura(() =>
      this.solicitar<RolDefinicion>(
        `/${encodeURIComponent(id)}`,
        this.opcionesJson('PATCH', rolActualizado)
      )
    );
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
    this.sincronizarEscritura(() =>
      this.solicitar(`/${encodeURIComponent(id)}`, { method: 'DELETE' })
    );
    return true;
  }

  /**
   * Calcula los permisos efectivos de un usuario en base a:
   * (Permisos del Rol + Permisos Extras Directos) - Permisos Revocados Directos
   */
  calcularPermisosEfectivos(usuario: Pick<Usuario, 'rol'> & { permisosExtras?: string[]; permisosRevocados?: string[] }): string[] {
    const roles = this.cargarRolesPersistidos();
    const rol = roles.find((r) => r.id === usuario.rol);

    const conjunto = new Set<string>(rol?.permisos || []);

    // Conceder extras directos otorgados a este usuario
    if (usuario.permisosExtras && Array.isArray(usuario.permisosExtras)) {
      for (const extra of usuario.permisosExtras) {
        if (IDS_PERMISOS_VALIDOS.has(extra)) conjunto.add(extra);
      }
    }

    // Quitar revocaciones directas aplicadas a este usuario
    if (usuario.permisosRevocados && Array.isArray(usuario.permisosRevocados)) {
      for (const revocado of usuario.permisosRevocados) {
        conjunto.delete(revocado);
      }
    }

    // El administrador conserva acceso total salvo revocaciones explÃ­citas
    if (usuario.rol === 'admin') {
      for (const permiso of CATALOGO_PERMISOS) {
        if (!usuario.permisosRevocados?.includes(permiso.id)) conjunto.add(permiso.id);
      }
    }

    return Array.from(conjunto);
  }

  /**
   * Determina el estado de un permiso especÃ­fico para un usuario:
   * - 'heredado': viene del rol asignado y no estÃ¡ revocado
   * - 'extra': fue aÃ±adido manualmente al usuario (su rol no lo tenÃ­a)
   * - 'revocado': su rol lo tenÃ­a, pero se le quitÃ³ especÃ­ficamente
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
    const permisosSet = new Set(permisos.filter((permiso) => IDS_PERMISOS_VALIDOS.has(permiso)));

    // Solo el catÃ¡logo completo concede control total
    if (CATALOGO_PERMISOS.every((permiso) => permisosSet.has(permiso.id))) {
      return [{ action: 'manage', subject: 'all' }];
    }

    const reglas: Rule[] = [];
    const agregarRegla = (subject: string, acciones: Rule['action']) => {
      reglas.push({ action: acciones, subject });
    };

    // Clientes
    const accionesClientes: Action[] = [];
    if (permisosSet.has('clientes:ver')) accionesClientes.push('read');
    if (permisosSet.has('clientes:crear')) accionesClientes.push('create');
    if (permisosSet.has('clientes:editar')) accionesClientes.push('update');
    if (permisosSet.has('clientes:eliminar')) accionesClientes.push('delete');
    if (permisosSet.has('clientes:exportar')) accionesClientes.push('export');
    if (accionesClientes.length > 0) agregarRegla('Cliente', accionesClientes);

    // Agenda (se apoya en el acceso a clientes)
    if (permisosSet.has('clientes:ver')) agregarRegla('Actividad', 'read');
    if (permisosSet.has('clientes:crear') || permisosSet.has('clientes:editar')) agregarRegla('Actividad', 'create');
    if (permisosSet.has('clientes:editar')) agregarRegla('Actividad', 'update');
    if (permisosSet.has('clientes:eliminar')) agregarRegla('Actividad', 'delete');

    // Oportunidades / Pipeline
    const accionesPipeline: Action[] = [];
    if (permisosSet.has('pipeline:ver')) accionesPipeline.push('read');
    if (permisosSet.has('pipeline:crear')) accionesPipeline.push('create');
    if (permisosSet.has('pipeline:mover')) accionesPipeline.push('update');
    if (permisosSet.has('pipeline:editar')) accionesPipeline.push('update');
    if (permisosSet.has('pipeline:eliminar')) accionesPipeline.push('delete');
    if (accionesPipeline.length > 0) agregarRegla('Oportunidad', accionesPipeline);

    if (permisosSet.has('pipeline:ver')) agregarRegla('Pipeline', 'read');
    if (permisosSet.has('pipeline:configurar')) agregarRegla('Pipeline', 'configure');
    if (permisosSet.has('pipeline:configurar')) agregarRegla('Columna', 'manage');

    // Comunicaciones
    if (permisosSet.has('comunicaciones:ver')) {
      agregarRegla('Comunicaciones', 'read');
      agregarRegla('Correo', 'read');
      agregarRegla('WhatsApp', 'read');
    }
    if (permisosSet.has('comunicaciones:enviar')) {
      agregarRegla('Correo', ['create', 'send']);
      agregarRegla('WhatsApp', ['create', 'send']);
      agregarRegla('Comunicaciones', 'send');
    }
    if (permisosSet.has('comunicaciones:documentos')) {
      agregarRegla('Documento', ['read', 'create', 'generate']);
      agregarRegla('Cotizacion', ['read', 'create', 'generate']);
    }
    if (permisosSet.has('comunicaciones:plantillas')) agregarRegla('Plantilla', ['read', 'create', 'update', 'delete']);

    // MÃ©tricas
    if (permisosSet.has('metricas:ver_kpis')) agregarRegla('Metricas', 'read');
    if (permisosSet.has('metricas:ver_ejecutivos')) agregarRegla('MetricasEjecutivos', 'read');
    if (permisosSet.has('metricas:exportar')) agregarRegla('Metricas', 'export');

    // Usuarios
    const accionesUsuarios: Action[] = [];
    if (permisosSet.has('usuarios:ver')) accionesUsuarios.push('read');
    if (permisosSet.has('usuarios:crear')) accionesUsuarios.push('create');
    if (permisosSet.has('usuarios:editar')) accionesUsuarios.push('update');
    if (accionesUsuarios.length > 0) agregarRegla('Usuario', accionesUsuarios);
    if (permisosSet.has('usuarios:permisos')) agregarRegla('Permiso', 'assign');
    if (permisosSet.has('roles:administrar')) agregarRegla('Rol', 'manage');

    // ConfiguraciÃ³n
    if (permisosSet.has('configuracion:ver')) agregarRegla('Configuracion', 'read');
    if (permisosSet.has('configuracion:editar')) {
      agregarRegla('Configuracion', 'update');
      agregarRegla('Sector', 'manage');
    }

    return reglas;
  }
}

export const rolesPermisosService = new RolesPermisosService();
