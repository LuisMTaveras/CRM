import { describe, it, expect } from 'vitest';
import { obtenerRutaInicial, RUTAS_PROTEGIDAS } from './permisos-rutas';

describe('permisos-rutas - resolución de ruta inicial', () => {
  it('prioriza la primera ruta permitida del mapa', () => {
    const ruta = obtenerRutaInicial((permiso) => permiso === 'clientes:ver');
    expect(ruta?.nombre).toBe('clientes');
  });

  it('acepta el permiso alternativo de métricas', () => {
    const ruta = obtenerRutaInicial((permiso) => permiso === 'metricas:ver_ejecutivos');
    expect(ruta?.nombre).toBe('metricas');
  });

  it('devuelve null cuando el usuario no tiene ningún permiso', () => {
    expect(obtenerRutaInicial(() => false)).toBeNull();
  });

  it('no repite nombres de ruta y todas tienen permiso declarado', () => {
    const nombres = RUTAS_PROTEGIDAS.map((ruta) => ruta.nombre);
    expect(new Set(nombres).size).toBe(nombres.length);
    expect(RUTAS_PROTEGIDAS.every((ruta) => ruta.permiso.length > 0)).toBe(true);
  });
});
