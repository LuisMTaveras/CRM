import { describe, it, expect, beforeEach } from 'vitest';
import { sectoresService } from './sectores.service';

describe('SectoresService - Catálogo Maestro de Sectores Económicos', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('obtiene los sectores predeterminados del sistema', () => {
    const sectores = sectoresService.obtenerSectores();
    expect(sectores.length).toBeGreaterThanOrEqual(10);
    const nombres = sectores.map((s) => s.nombre);
    expect(nombres).toContain('Tecnología & Cloud');
    expect(nombres).toContain('Salud & Redes Médicas');
    expect(nombres).toContain('Finanzas & Inversiones');
  });

  it('resuelve un sector por nombre exacto o flexible', () => {
    const secExacto = sectoresService.obtenerSectorPorNombre('Salud & Redes Médicas');
    expect(secExacto).toBeDefined();
    expect(secExacto?.codigo).toBe('SAL');
    expect(secExacto?.icono).toBe('HeartPulse');

    // Búsqueda flexible (compatibilidad retroactiva)
    const secFlexible = sectoresService.obtenerSectorPorNombre('Tecnología');
    expect(secFlexible).toBeDefined();
    expect(secFlexible?.nombre).toBe('Tecnología & Cloud');
  });

  it('genera opciones para AppSelect con componentes de icono asignados', () => {
    const opciones = sectoresService.obtenerOpcionesSelect(true, 'Todos los Sectores');
    expect(opciones.length).toBeGreaterThan(1);
    expect(opciones[0].value).toBe('');
    expect(opciones[0].label).toBe('Todos los Sectores');

    const optSalud = opciones.find((o) => o.value === 'Salud & Redes Médicas');
    expect(optSalud).toBeDefined();
    expect(optSalud?.icon).toBeDefined();
    expect(optSalud?.dotColor).toBe('bg-rose-400');
  });

  it('permite crear, actualizar, alternar estado y eliminar un sector económico', () => {
    // 1. Crear
    const nuevo = sectoresService.crearSector({
      nombre: 'Aeronáutica & Espacio',
      codigo: 'AER',
      icono: 'Plane',
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      dotColor: 'bg-sky-400',
      descripcion: 'Líneas aéreas, hangares y logística de aviación',
    });

    expect(nuevo.id).toBeTruthy();
    expect(nuevo.codigo).toBe('AER');
    expect(nuevo.activo).toBe(true);

    // 2. Actualizar
    const actualizado = sectoresService.actualizarSector(nuevo.id, {
      descripcion: 'Actualizada descripción de aviación',
      activo: false,
    });
    expect(actualizado.descripcion).toBe('Actualizada descripción de aviación');
    expect(actualizado.activo).toBe(false);

    // 3. Eliminar
    const eliminado = sectoresService.eliminarSector(nuevo.id);
    expect(eliminado).toBe(true);
    expect(sectoresService.obtenerSectorPorId(nuevo.id)).toBeUndefined();
  });

  it('restablece los sectores a los valores iniciales predeterminados', () => {
    sectoresService.crearSector({
      nombre: 'Sector Temporal',
      codigo: 'TMP',
      icono: 'Cpu',
      color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
      dotColor: 'bg-zinc-400',
    });

    const restablecidos = sectoresService.restablecerSectores();
    const encontrado = restablecidos.find((s) => s.codigo === 'TMP');
    expect(encontrado).toBeUndefined();
    expect(restablecidos.length).toBe(10);
  });
});
