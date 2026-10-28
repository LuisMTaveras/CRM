import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  crearAlmacenUsuarios,
  hashPassword,
  normalizarTelefono,
  verificarPassword,
} from './user-store.js';

let directorioTemporal = null;

function crearArchivoTemporal() {
  directorioTemporal = fs.mkdtempSync(path.join(os.tmpdir(), 'crm-usuarios-'));
  return path.join(directorioTemporal, 'usuarios.json');
}

afterEach(() => {
  if (directorioTemporal) {
    fs.rmSync(directorioTemporal, { recursive: true, force: true });
    directorioTemporal = null;
  }
});

describe('user-store', () => {
  it('genera y verifica hashes scrypt', () => {
    const hash = hashPassword('ClaveSegura123');
    expect(hash.startsWith('scrypt$')).toBe(true);
    expect(verificarPassword('ClaveSegura123', hash)).toBe(true);
    expect(verificarPassword('OtraClave123', hash)).toBe(false);
    expect(verificarPassword('ClaveSegura123', 'texto-plano')).toBe(false);
  });

  it('crea el administrador inicial con contraseña hasheada', () => {
    const archivo = crearArchivoTemporal();
    const store = crearAlmacenUsuarios({
      archivo,
      admin: {
        email: 'Admin@CRM.DO',
        contrasena: 'ClaveSegura123',
        nombre: 'Administrador Principal',
        telefonoFlota: '+1 (829) 708-4706',
      },
    });

    expect(store.estaConfigurado()).toBe(true);
    const guardado = JSON.parse(fs.readFileSync(archivo, 'utf8'));
    expect(guardado).toHaveLength(1);
    expect(guardado[0].email).toBe('admin@crm.do');
    expect(guardado[0].passwordHash).not.toContain('ClaveSegura123');

    const publico = store.publico(guardado[0]);
    expect(publico.passwordHash).toBeUndefined();
    expect(publico.contrasena).toBeUndefined();
  });

  it('valida credenciales y busca por teléfono', () => {
    const store = crearAlmacenUsuarios({
      archivo: crearArchivoTemporal(),
      admin: {
        email: 'admin@crm.do',
        contrasena: 'ClaveSegura123',
        telefonoFlota: '+1 (829) 708-4706',
      },
    });

    expect(store.validarCredenciales('ADMIN@crm.do', 'ClaveSegura123')?.email).toBe('admin@crm.do');
    expect(store.validarCredenciales('admin@crm.do', 'incorrecta')).toBeNull();
    expect(store.buscarPorTelefono('8297084706')?.id).toBe('usr-admin');
    expect(store.buscarPorTelefono('18297084706')?.id).toBe('usr-admin');
    expect(store.buscarPorTelefono('0000000000')).toBeNull();
  });

  it('agrega usuarios, rechaza duplicados y actualiza último acceso', () => {
    const store = crearAlmacenUsuarios({
      archivo: crearArchivoTemporal(),
      admin: { email: 'admin@crm.do', contrasena: 'ClaveSegura123' },
    });

    const creado = store.agregar({
      nombre: 'María Ejecutiva',
      email: 'maria@crm.do',
      contrasena: 'OtraClave123',
      rol: 'ejecutivo',
      telefonoFlota: '8095551234',
    });

    expect(creado.rol).toBe('ejecutivo');
    expect(store.validarCredenciales('maria@crm.do', 'OtraClave123')?.nombre).toBe('María Ejecutiva');
    expect(() => store.agregar({
      nombre: 'Duplicada',
      email: 'maria@crm.do',
      contrasena: 'OtraClave123',
    })).toThrow('Ya existe un usuario');

    store.actualizarUltimoAcceso(creado.id);
    expect(store.publico(store.buscarPorId(creado.id)).ultimoAcceso).toBeTruthy();
  });

  it('normaliza teléfonos sin dígitos', () => {
    expect(normalizarTelefono('+1 (829) 708-4706')).toBe('18297084706');
    expect(normalizarTelefono('')).toBe('');
  });

  it('actualiza usuarios, conserva la contraseña y cambia el hash cuando se solicita', () => {
    const store = crearAlmacenUsuarios({
      archivo: crearArchivoTemporal(),
      admin: { email: 'admin@crm.do', contrasena: 'ClaveSegura123' },
    });

    const creado = store.agregar({
      nombre: 'Carlos Ventas',
      email: 'carlos@crm.do',
      contrasena: 'ClaveInicial123',
      rol: 'ejecutivo',
    });

    const actualizado = store.actualizar(creado.id, {
      nombre: 'Carlos Ventas Senior',
      cargo: 'Gerente de Cuentas',
      telefonoFlota: '+1 (809) 555-0199',
      permisosExtras: ['clientes:exportar', 'clientes:exportar'],
    });

    expect(actualizado.nombre).toBe('Carlos Ventas Senior');
    expect(actualizado.avatar).toBe('CV');
    expect(actualizado.telefonoFlota).toBe('18095550199');
    expect(actualizado.permisosExtras).toEqual(['clientes:exportar']);
    expect(store.validarCredenciales('carlos@crm.do', 'ClaveInicial123')).not.toBeNull();

    store.actualizar(creado.id, { contrasena: 'ClaveNueva123' });
    expect(store.validarCredenciales('carlos@crm.do', 'ClaveInicial123')).toBeNull();
    expect(store.validarCredenciales('carlos@crm.do', 'ClaveNueva123')).not.toBeNull();
  });

  it('rechaza correos duplicados y usuarios inactivos', () => {
    const store = crearAlmacenUsuarios({
      archivo: crearArchivoTemporal(),
      admin: { email: 'admin@crm.do', contrasena: 'ClaveSegura123' },
    });

    const creado = store.agregar({
      nombre: 'Ana Comercial',
      email: 'ana@crm.do',
      contrasena: 'ClaveInicial123',
    });

    expect(() => store.actualizar(creado.id, { email: 'admin@crm.do' }))
      .toThrow('Ya existe un usuario');
    expect(() => store.agregar({
      nombre: 'Correo Inválido',
      email: 'sin-arroba',
      contrasena: 'ClaveInicial123',
    })).toThrow('correo electrónico no es válido');

    store.actualizar(creado.id, { activo: false });
    expect(store.validarCredenciales('ana@crm.do', 'ClaveInicial123')).toBeNull();
  });

  it('protege al último administrador activo y permite eliminar otros usuarios', () => {
    const store = crearAlmacenUsuarios({
      archivo: crearArchivoTemporal(),
      admin: { email: 'admin@crm.do', contrasena: 'ClaveSegura123' },
    });

    expect(() => store.actualizar('usr-admin', { activo: false }))
      .toThrow('último administrador activo');
    expect(() => store.actualizar('usr-admin', { rol: 'ejecutivo' }))
      .toThrow('último administrador activo');
    expect(() => store.eliminar('usr-admin')).toThrow('último administrador activo');

    const creado = store.agregar({
      nombre: 'Temporal',
      email: 'temporal@crm.do',
      contrasena: 'ClaveInicial123',
      rol: 'ejecutivo',
    });
    expect(store.eliminar(creado.id).email).toBe('temporal@crm.do');
    expect(store.buscarPorId(creado.id)).toBeNull();
  });

  it('lista usuarios paginados y filtra por búsqueda', () => {
    const store = crearAlmacenUsuarios({
      archivo: crearArchivoTemporal(),
      admin: { email: 'admin@crm.do', contrasena: 'ClaveSegura123' },
    });
    store.agregar({
      nombre: 'Laura Comercial',
      email: 'laura@crm.do',
      contrasena: 'ClaveInicial123',
      cargo: 'Ejecutiva B2B',
      departamento: 'Ventas',
    });
    store.agregar({
      nombre: 'Pedro Soporte',
      email: 'pedro@crm.do',
      contrasena: 'ClaveInicial123',
      cargo: 'Soporte',
      departamento: 'Operaciones',
    });

    const pagina = store.listarPaginado({ page: 1, pageSize: 2 });
    expect(pagina.total).toBe(3);
    expect(pagina.usuarios).toHaveLength(2);
    expect(pagina.hasMore).toBe(true);

    const filtrados = store.listarPaginado({ q: 'soporte' });
    expect(filtrados.total).toBe(1);
    expect(filtrados.usuarios[0].email).toBe('pedro@crm.do');
  });
});
