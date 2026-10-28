import { ref } from 'vue';

export type TemaVisual = 'dark' | 'light';
export type TemaPreferencia = TemaVisual | 'system';

const CLAVE_STORAGE_TEMA = 'crm_tema_preferencia';
const CLAVE_STORAGE_LEGACY = 'crm_tema_visual';

class ThemeService {
  readonly tema = ref<TemaVisual>('dark');
  readonly preferencia = ref<TemaPreferencia>('system');
  private mediaQuery: MediaQueryList | null = null;
  private escuchaSistema: ((evento: MediaQueryListEvent) => void) | null = null;

  inicializarTema(): void {
    let guardada: TemaPreferencia = 'system';

    try {
      const valor = localStorage.getItem(CLAVE_STORAGE_TEMA);
      if (valor === 'light' || valor === 'dark' || valor === 'system') {
        guardada = valor;
      } else {
        const legado = localStorage.getItem(CLAVE_STORAGE_LEGACY);
        guardada = legado === 'light' || legado === 'dark' ? legado : 'system';
      }
    } catch {
      guardada = 'system';
    }

    this.configurarEscuchaSistema();
    this.aplicarPreferencia(guardada);
  }

  private configurarEscuchaSistema(): void {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    if (this.mediaQuery && this.escuchaSistema) {
      this.mediaQuery.removeEventListener('change', this.escuchaSistema);
    }

    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.escuchaSistema = () => {
      if (this.preferencia.value === 'system') {
        this.aplicarVisual(this.resolverTemaSistema());
      }
    };
    this.mediaQuery.addEventListener('change', this.escuchaSistema);
  }

  private resolverTemaSistema(): TemaVisual {
    if (this.preferencia.value === 'system') {
      return this.mediaQuery?.matches ? 'dark' : 'light';
    }
    return this.preferencia.value;
  }

  aplicarPreferencia(preferencia: TemaPreferencia): void {
    this.preferencia.value = preferencia;
    this.aplicarVisual(this.resolverTemaSistema());

    try {
      localStorage.setItem(CLAVE_STORAGE_TEMA, preferencia);
    } catch {
      // fallback
    }
  }

  aplicarTema(nuevoTema: TemaVisual): void {
    this.aplicarPreferencia(nuevoTema);
  }

  alternarTema(): void {
    this.aplicarPreferencia(this.tema.value === 'dark' ? 'light' : 'dark');
  }

  private aplicarVisual(nuevoTema: TemaVisual): void {
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
  }
}

export const themeService = new ThemeService();
