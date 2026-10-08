import { describe, it, expect } from 'vitest';
import { busquedaService } from './busqueda.service';

describe('BusquedaService - Buscador Universal Omnicanal (Ctrl + K)', () => {
  it('retorna sugerencias iniciales (módulos y acciones rápidas) cuando la búsqueda está vacía', () => {
    const resultados = busquedaService.buscar('');
    expect(resultados.length).toBeGreaterThanOrEqual(2);
    
    const categorias = resultados.map((g) => g.categoria);
    expect(categorias).toContain('acciones');
    expect(categorias).toContain('modulos');
  });

  it('encuentra módulos específicos por nombre o descripción', () => {
    const resultados = busquedaService.buscar('pipeline');
    expect(resultados.length).toBeGreaterThan(0);

    const todosItems = resultados.flatMap((g) => g.items);
    const encontrado = todosItems.some((i) => i.titulo.toLowerCase().includes('pipeline'));
    expect(encontrado).toBe(true);
  });

  it('encuentra clientes registrados por coincidencia en razón social o RNC', () => {
    const resultados = busquedaService.buscar('BHD');
    expect(resultados.length).toBeGreaterThan(0);

    const grupoClientes = resultados.find((g) => g.categoria === 'clientes');
    expect(grupoClientes).toBeDefined();
    expect(grupoClientes!.items.length).toBeGreaterThan(0);
    expect(grupoClientes!.items[0].titulo.toUpperCase()).toContain('BHD');
  });

  it('encuentra acciones de sistema como registrar cliente o cambiar tema', () => {
    const resultados = busquedaService.buscar('tema');
    const todosItems = resultados.flatMap((g) => g.items);
    const accionTema = todosItems.find((i) => i.id === 'acc-cambiar-tema');
    expect(accionTema).toBeDefined();
    expect(accionTema?.accion).toBeTypeOf('function');
  });
});
