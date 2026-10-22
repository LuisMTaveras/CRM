import { ref, readonly } from 'vue';
import type { DatosEmpresa } from '../types/empresa.types';

const CLAVE_STORAGE_EMPRESA = 'crm_perfil_empresa_emisora';
const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3002/api'}/empresa`;

/**
 * La identidad corporativa se obtiene del perfil persistido por el servidor.
 * Este objeto vacío únicamente evita renderizar información ficticia mientras
 * llega la respuesta inicial.
 */
export const DATOS_EMPRESA_POR_DEFECTO: DatosEmpresa = {
  razonSocial: '', nombreComercial: '', identificacionFiscal: '', sloganActividad: '',
  correo: '', telefono: '', whatsapp: '', sitioWeb: '', direccion: '', ciudad: '',
  pais: '', monedaPrincipal: 'DOP', simboloMoneda: 'RD$', prefijoDocumentos: '',
  piePaginaOficial: '', logoUrl: '', ultimaActualizacion: undefined,
};

class EmpresaService {
  private estadoInterno = ref<DatosEmpresa>(this.cargarDatosLocales());

  // Estado reactivo accesible públicamente
  public datos = readonly(this.estadoInterno);

  constructor() {
    this.sincronizarConBaseDeDatos();
  }

  get perfil(): DatosEmpresa {
    return this.estadoInterno.value;
  }

  private cargarDatosLocales(): DatosEmpresa {
    try {
      const guardado = localStorage.getItem(CLAVE_STORAGE_EMPRESA);
      if (guardado) {
        const parseado = JSON.parse(guardado);
        return {
          ...DATOS_EMPRESA_POR_DEFECTO,
          ...parseado,
        };
      }
    } catch {
      // Fallback silencioso
    }
    return { ...DATOS_EMPRESA_POR_DEFECTO };
  }

  /**
   * Sincroniza en segundo plano con la base de datos del backend
   */
  async sincronizarConBaseDeDatos(): Promise<DatosEmpresa> {
    try {
      const resp = await fetch(API_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(4000),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.ok && data.empresa) {
          const fusionado: DatosEmpresa = {
            ...DATOS_EMPRESA_POR_DEFECTO,
            ...data.empresa,
          };
          this.estadoInterno.value = fusionado;
          try {
            localStorage.setItem(CLAVE_STORAGE_EMPRESA, JSON.stringify(fusionado));
          } catch {
            // fallback
          }
          return fusionado;
        }
      }
    } catch {
      // Si el servidor backend no responde de inmediato, continúa con los datos cacheados
    }
    return this.estadoInterno.value;
  }

  obtenerDatos(): DatosEmpresa {
    return { ...this.estadoInterno.value };
  }

  guardarDatos(nuevosDatos: Partial<DatosEmpresa>): DatosEmpresa {
    const actualizado: DatosEmpresa = {
      ...this.estadoInterno.value,
      ...nuevosDatos,
      ultimaActualizacion: new Date().toISOString(),
    };

    // Ajustar símbolo según moneda
    if (nuevosDatos.monedaPrincipal) {
      if (nuevosDatos.monedaPrincipal === 'USD') actualizado.simboloMoneda = '$';
      else if (nuevosDatos.monedaPrincipal === 'EUR') actualizado.simboloMoneda = '€';
      else actualizado.simboloMoneda = 'RD$';
    }

    this.estadoInterno.value = actualizado;

    // 1. Guardar en almacenamiento local
    try {
      localStorage.setItem(CLAVE_STORAGE_EMPRESA, JSON.stringify(actualizado));
      window.dispatchEvent(new CustomEvent('crm:empresa-actualizada', { detail: actualizado }));
    } catch {
      // Manejar cuota
    }

    // 2. Persistir en la base de datos backend
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actualizado),
    }).catch((err) => {
      console.warn('[EMPRESA] No se pudo sincronizar inmediatamente con DB:', err);
    });

    return { ...actualizado };
  }

  restablecerPorDefecto(): DatosEmpresa {
    const res = {
      ...DATOS_EMPRESA_POR_DEFECTO,
      ultimaActualizacion: new Date().toISOString(),
    };
    this.estadoInterno.value = res;
    try {
      localStorage.setItem(CLAVE_STORAGE_EMPRESA, JSON.stringify(res));
      window.dispatchEvent(new CustomEvent('crm:empresa-actualizada', { detail: res }));
    } catch {
      // fallback
    }

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(res),
    }).catch(() => {});

    return { ...res };
  }
}

export const empresaService = new EmpresaService();
