import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { crearRegistroAuditoria } from './audit-log.js';

let directorioTemporal = null;

function crearArchivoTemporal() {
  directorioTemporal = fs.mkdtempSync(path.join(os.tmpdir(), 'crm-auditoria-'));
  return path.join(directorioTemporal, 'auditoria.json');
}

afterEach(() => {
  if (directorioTemporal) {
    fs.rmSync(directorioTemporal, { recursive: true, force: true });
    directorioTemporal = null;
  }
});

describe('audit-log', () => {
  it('registra eventos persistentes con actor y resultado', () => {
    const archivo = crearArchivoTemporal();
    const registro = crearRegistroAuditoria({ archivo });

    registro.registrar({
      timestamp: '2026-10-05T15:50:00.000Z',
      actor: { id: 'usr-1', email: 'ADMIN@CRM.DO', nombre: 'Administrador', rol: 'admin' },
      accion: 'usuarios.crear',
      entidad: 'usuarios',
      entidadId: 'usr-2',
      exito: true,
      ip: '127.0.0.1',
      detalle: 'Se creó el usuario ana@crm.do.',
    });

    registro.registrar({
      timestamp: '2026-10-06T10:00:00.000Z',
      actor: { email: 'ana@crm.do', rol: 'ejecutivo' },
      accion: 'auth.login',
      entidad: 'sesion',
      exito: false,
      ip: '192.168.1.20',
      detalle: 'Credenciales inválidas.',
    });

    const pagina = registro.listar({ page: 1, pageSize: 1 });
    expect(pagina.total).toBe(2);
    expect(pagina.eventos).toHaveLength(1);
    expect(pagina.eventos[0].accion).toBe('auth.login');
    expect(pagina.hasMore).toBe(true);
    expect(pagina.acciones).toContain('usuarios.crear');

    const recargado = crearRegistroAuditoria({ archivo });
    expect(recargado.listar().total).toBe(2);
  });

  it('filtra por búsqueda, acción, resultado y rango de fechas', () => {
    const registro = crearRegistroAuditoria({ archivo: crearArchivoTemporal() });

    registro.registrar({
      timestamp: '2026-10-05T15:50:00.000Z',
      actor: { email: 'admin@crm.do', nombre: 'Administrador' },
      accion: 'usuarios.crear',
      entidad: 'usuarios',
      exito: true,
      detalle: 'Alta de Laura Comercial.',
    });
    registro.registrar({
      timestamp: '2026-10-06T10:00:00.000Z',
      actor: { email: 'ana@crm.do' },
      accion: 'auth.login',
      entidad: 'sesion',
      exito: false,
      detalle: 'Credenciales inválidas.',
    });
    registro.registrar({
      timestamp: '2026-10-07T09:00:00.000Z',
      actor: { email: 'admin@crm.do' },
      accion: 'usuarios.eliminar',
      entidad: 'usuarios',
      exito: true,
      detalle: 'Baja de usuario temporal.',
    });

    expect(registro.listar({ q: 'laura' }).total).toBe(1);
    expect(registro.listar({ accion: 'auth.login' }).total).toBe(1);
    expect(registro.listar({ exito: 'false' }).total).toBe(1);
    expect(registro.listar({ entidad: 'usuarios' }).total).toBe(2);
    expect(registro.listar({ desde: '2026-10-06', hasta: '2026-10-06' }).total).toBe(1);
    expect(registro.exportar({ exito: 'true' })).toHaveLength(2);
  });

  it('recorta el historial al máximo configurado', () => {
    const registro = crearRegistroAuditoria({
      archivo: crearArchivoTemporal(),
      maximo: 2,
    });

    registro.registrar({ accion: 'evento.1' });
    registro.registrar({ accion: 'evento.2' });
    registro.registrar({ accion: 'evento.3' });

    const pagina = registro.listar();
    expect(pagina.total).toBe(2);
    expect(pagina.eventos.map((evento) => evento.accion)).toEqual(['evento.3', 'evento.2']);
  });
});
