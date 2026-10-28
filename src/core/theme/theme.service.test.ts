import { beforeEach, describe, expect, it } from 'vitest';
import { themeService } from './theme.service';

describe('themeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    themeService.preferencia.value = 'system';
  });

  it('aplica y persiste el tema oscuro', () => {
    themeService.aplicarPreferencia('dark');

    expect(themeService.tema.value).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('crm_tema_preferencia')).toBe('dark');
  });

  it('aplica el tema claro y remueve la clase oscura', () => {
    themeService.aplicarPreferencia('dark');
    themeService.aplicarPreferencia('light');

    expect(themeService.tema.value).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('migra la preferencia heredada del almacenamiento previo', () => {
    localStorage.setItem('crm_tema_visual', 'light');

    themeService.inicializarTema();

    expect(themeService.preferencia.value).toBe('light');
    expect(themeService.tema.value).toBe('light');
  });

  it('usa la preferencia del sistema cuando no hay valor guardado', () => {
    themeService.inicializarTema();

    expect(themeService.preferencia.value).toBe('system');
    expect(['light', 'dark']).toContain(themeService.tema.value);
  });

  it('alterna entre claro y oscuro', () => {
    themeService.aplicarPreferencia('dark');
    themeService.alternarTema();

    expect(themeService.tema.value).toBe('light');
    expect(themeService.preferencia.value).toBe('light');
  });
});
