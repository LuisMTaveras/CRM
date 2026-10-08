import { ref } from 'vue';

export type TemaVisual = 'dark' | 'light';

const CLAVE_STORAGE_TEMA = 'crm_tema_visual';

class ThemeService {
  readonly tema = ref<TemaVisual>('dark');

  inicializarTema(): void {
    try {
      const guardado = localStorage.getItem(CLAVE_STORAGE_TEMA) as TemaVisual | null;
      if (guardado === 'light' || guardado === 'dark') {
        this.aplicarTema(guardado);
        return;
      }
    } catch {
      // fallback
    }

    // Por defecto, tema oscuro
    this.aplicarTema('dark');
  }

  aplicarTema(nuevoTema: TemaVisual): void {
    this.tema.value = nuevoTema;
    const raiz = document.documentElement;

    if (nuevoTema === 'dark') {
      raiz.classList.add('dark');
      raiz.classList.remove('light');
      raiz.style.colorScheme = 'dark';
    } else {
      raiz.classList.remove('dark');
      raiz.classList.add('light');
      raiz.style.colorScheme = 'light';
    }

    try {
      localStorage.setItem(CLAVE_STORAGE_TEMA, nuevoTema);
    } catch {
      // fallback
    }
  }

  alternarTema(): void {
    const siguiente: TemaVisual = this.tema.value === 'dark' ? 'light' : 'dark';
    this.aplicarTema(siguiente);
  }
}

export const themeService = new ThemeService();
