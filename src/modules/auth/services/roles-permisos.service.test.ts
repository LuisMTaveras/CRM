import { describe, it, expect, beforeEach } from 'vitest';
import { rolesPermisosService } from './roles-permisos.service';
import type { Usuario } from '../types/auth.types';

describe('RolesPermisosService - Gestión de Roles y Permisos Granulares', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('obtiene los roles predeterminados del sistema', () => {
    const roles = rolesPermisosService.obtenerRoles();
    expect(roles.length).toBeGreaterThanOrEqual(4);
    const ids = roles.map((r) => r.id);
    expect(ids).toContain('admin');
    expect(ids).toContain('gerente');
    expect(ids).toContain('ejecutivo');
    expect(ids).toContain('auditor');
  });

  it('permite crear un nuevo rol personalizado con permisos específicos', () => {
    const nuevoRol = rolesPermisosService.crearRol({
      nombre: 'Coordinador de Soporte',
      descripcion: 'Acceso a clientes y comunicaciones sin eliminación',
      permisos: ['clientes:ver', 'comunicaciones:ver', 'comunicaciones:enviar'],
    });

    expect(nuevoRol.id).toBeTruthy();
    expect(nuevoRol.nombre).toBe('Coordinador de Soporte');
    expect(nuevoRol.permisos).toEqual(['clientes:ver', 'comunicaciones:ver', 'comunicaciones:enviar']);
    expect(nuevoRol.esSistema).toBe(false);

    const rolesActualizados = rolesPermisosService.obtenerRoles();
    const encontrado = rolesActualizados.find((r) => r.id === nuevoRol.id);
    expect(encontrado).toBeDefined();
    expect(encontrado?.nombre).toBe('Coordinador de Soporte');
  });

  it('protege los roles del sistema contra eliminación', () => {
    expect(() => {
      rolesPermisosService.eliminarRol('admin');
    }).toThrowError('No es posible eliminar roles protegidos del sistema.');
  });

  it('calcula permisos efectivos: herencia de rol + extras concedidos - revocaciones', () => {
    // Ejecutivo por defecto tiene clientes:ver, clientes:crear, clientes:editar, pero NO clientes:eliminar
    const usuarioBase: Usuario = {
      id: 'usr-test-1',
      nombre: 'Test User',
      email: 'test@alliance.do',
      rol: 'ejecutivo',
      rolNombre: 'Ejecutivo Comercial',
      cargo: 'Ejecutivo',
      activo: true,
      avatar: 'TU',
      ultimoAcceso: new Date().toISOString(),
      contrasena: 'secreta123',
      // Concedemos 'clientes:eliminar' como extra
      permisosExtras: ['clientes:eliminar'],
      // Revocamos 'clientes:editar' que tenía su rol
      permisosRevocados: ['clientes:editar'],
    };

    const efectivos = rolesPermisosService.calcularPermisosEfectivos(usuarioBase);

    // Debe contener el permiso extra concedido
    expect(efectivos).toContain('clientes:eliminar');
    // NO debe contener el permiso revocado
    expect(efectivos).not.toContain('clientes:editar');
    // Debe mantener los demás permisos heredados del rol
    expect(efectivos).toContain('clientes:ver');
    expect(efectivos).toContain('clientes:crear');
  });

  it('determina el estado tri-estado de un permiso para un usuario', () => {
    const usuario: Usuario = {
      id: 'usr-test-2',
      nombre: 'Ana Gómez',
      email: 'ana@alliance.do',
      rol: 'ejecutivo',
      rolNombre: 'Ejecutivo Comercial',
      cargo: 'Ejecutiva',
      activo: true,
      avatar: 'AG',
      ultimoAcceso: new Date().toISOString(),
      contrasena: 'secreta123',
      permisosExtras: ['metricas:ver_kpis'],
      permisosRevocados: ['pipeline:crear'],
    };

    // 'metricas:ver_kpis' no está en el rol ejecutivo, pero está en permisosExtras => 'extra'
    expect(rolesPermisosService.obtenerEstadoPermisoUsuario(usuario, 'metricas:ver_kpis')).toBe('extra');

    // 'pipeline:crear' está en el rol ejecutivo, pero está en permisosRevocados => 'revocado'
    expect(rolesPermisosService.obtenerEstadoPermisoUsuario(usuario, 'pipeline:crear')).toBe('revocado');

    // 'clientes:ver' está en el rol ejecutivo y no está revocado => 'heredado'
    expect(rolesPermisosService.obtenerEstadoPermisoUsuario(usuario, 'clientes:ver')).toBe('heredado');

    // 'configuracion:seguridad' no está en el rol ejecutivo ni en extras => 'denegado'
    expect(rolesPermisosService.obtenerEstadoPermisoUsuario(usuario, 'configuracion:seguridad')).toBe('denegado');
  });

  it('convierte los permisos efectivos en reglas CASL utilizables', () => {
    const permisosLimitados = ['clientes:ver', 'clientes:crear', 'metricas:ver_kpis'];
    const reglas = rolesPermisosService.convertirPermisosAReglasCASL(permisosLimitados);

    expect(reglas.length).toBeGreaterThan(0);
    const reglaCliente = reglas.find((r) => r.subject === 'Cliente');
    expect(reglaCliente).toBeDefined();
    expect(reglaCliente?.action).toContain('read');
    expect(reglaCliente?.action).toContain('create');

    const reglaMetricas = reglas.find((r) => r.subject === 'Metricas');
    expect(reglaMetricas).toBeDefined();
    expect(reglaMetricas?.action).toBe('read');
  });

  it('filtra permisos inexistentes al crear un rol', () => {
    const rol = rolesPermisosService.crearRol({
      nombre: 'Rol con permisos inválidos',
      descripcion: 'Debe descartar los IDs desconocidos',
      permisos: ['clientes:ver', 'inventado:total', 'configuracion:seguridad'],
    });

    expect(rol.permisos).toEqual(['clientes:ver']);
  });

  it('concede al administrador todo el catálogo salvo revocaciones explícitas', () => {
    const admin: Usuario = {
      id: 'usr-admin',
      nombre: 'Admin',
      email: 'admin@alliance.do',
      rol: 'admin',
      rolNombre: 'Administrador',
      cargo: 'Dirección',
      activo: true,
      avatar: 'AD',
      ultimoAcceso: new Date().toISOString(),
      contrasena: 'admin12345',
      permisosRevocados: ['metricas:exportar'],
    };

    const efectivos = rolesPermisosService.calcularPermisosEfectivos(admin);

    expect(efectivos).toContain('roles:administrar');
    expect(efectivos).toContain('configuracion:editar');
    expect(efectivos).not.toContain('metricas:exportar');
  });

  it('no hereda permisos para roles inexistentes', () => {
    const permisos = rolesPermisosService.calcularPermisosEfectivos({ rol: 'rol-eliminado' });
    expect(permisos).toEqual([]);
  });

  it('solo concede manage/all cuando el catálogo completo está presente', () => {
    const reglasCompletas = rolesPermisosService.convertirPermisosAReglasCASL(
      rolesPermisosService.obtenerRoles().find((r) => r.id === 'admin')?.permisos || []
    );
    expect(reglasCompletas).toEqual([{ action: 'manage', subject: 'all' }]);

    const reglasGerente = rolesPermisosService.convertirPermisosAReglasCASL(
      rolesPermisosService.obtenerRoles().find((r) => r.id === 'gerente')?.permisos || []
    );
    expect(reglasGerente).not.toEqual([{ action: 'manage', subject: 'all' }]);
    expect(reglasGerente.some((r) => r.subject === 'Sector')).toBe(false);
    expect(reglasGerente.some((r) => r.subject === 'Rol')).toBe(false);
  });
});
