import { ref, readonly } from 'vue';
import type { DatosEmpresa } from '../types/empresa.types';

const CLAVE_STORAGE_EMPRESA = 'crm_perfil_empresa_emisora';

export const DATOS_EMPRESA_POR_DEFECTO: DatosEmpresa = {
  razonSocial: 'DEVFORGE DOMINICANA SRL',
  nombreComercial: 'DEVFORGE Tech Solutions',
  identificacionFiscal: '1-32-45890-1',
  sloganActividad: 'Soluciones de Software y Consultoría B2B',
  correo: 'contacto@devforge.com.do',
  telefono: '+1 (809) 555-0100',
  whatsapp: '+1 (809) 555-0101',
  sitioWeb: 'www.devforge.com.do',
  direccion: 'Av. Winston Churchill, Torre Empresarial, Suite 802',
  ciudad: 'Santo Domingo',
  pais: 'República Dominicana',
  monedaPrincipal: 'DOP',
  simboloMoneda: 'RD$',
  prefijoDocumentos: 'DF-PROP',
  piePaginaOficial: 'Documento oficial generado electrónicamente por la plataforma CRM institucional. Validez legal conforme a las leyes vigentes.',
  ultimaActualizacion: new Date().toISOString(),
};

class EmpresaService {
  private estadoInterno = ref<DatosEmpresa>(this.cargarDatos());

  // Estado reactivo accesible públicamente
  public datos = readonly(this.estadoInterno);

  get perfil(): DatosEmpresa {
    return this.estadoInterno.value;
  }

  private cargarDatos(): DatosEmpresa {
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
    try {
      localStorage.setItem(CLAVE_STORAGE_EMPRESA, JSON.stringify(actualizado));
      // Notificar a listeners si los hubiere
      window.dispatchEvent(new CustomEvent('crm:empresa-actualizada', { detail: actualizado }));
    } catch {
      // Manejar cuota de localStorage si fuese necesario
    }

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
    return { ...res };
  }
}

export const empresaService = new EmpresaService();
