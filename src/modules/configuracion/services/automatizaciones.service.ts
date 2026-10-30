import { API_BASE_URL } from '@/core/api/api-config';
import { AUTOMATIZACIONES_SEMILLA } from './automatizaciones.mock-data';
import type {
  Automatizacion,
  CrearAutomatizacionInput,
  OpcionesListadoAutomatizaciones,
  PaginaAutomatizaciones,
} from '../types/automatizacion.types';

const CLAVE_STORAGE = 'crm_automatizaciones';
const USAR_BACKEND =
  import.meta.env.MODE === 'production' || import.meta.env.VITE_USE_MOCK === 'false';
const LIMITE_PAGINA = 50;

class AutomatizacionesService {
  private memoria: Automatizacion[] = this.cargarIniciales();

  private cargarIniciales(): Automatizacion[] {
    if (USAR_BACKEND) return [];

    try {
      const guardadas = localStorage.getItem(CLAVE_STORAGE);
      if (guardadas) {
        const parsed = JSON.parse(guardadas);
        if (Array.isArray(parsed)) return parsed as Automatizacion[];
      }
    } catch {
      // Se usa la semilla
    }

    return JSON.parse(JSON.stringify(AUTOMATIZACIONES_SEMILLA));
  }

  private guardarLocal(): void {
    if (USAR_BACKEND) return;
    try {
      localStorage.setItem(CLAVE_STORAGE, JSON.stringify(this.memoria));
    } catch {
      // Sin almacenamiento disponible
    }
  }

  private async solicitar<T>(ruta: string, init?: RequestInit): Promise<T> {
    const respuesta = await fetch(`${API_BASE_URL}/automatizaciones${ruta}`, init);
    const data = await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
      throw new Error(
        (data && typeof data.error === 'string' && data.error) ||
          `No se pudieron sincronizar las automatizaciones (${respuesta.status}).`
      );
    }

    return data as T;
  }

  private opcionesJson(method: string, body?: unknown): RequestInit {
    return {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    };
  }

  async listar(
    opciones: OpcionesListadoAutomatizaciones = {}
  ): Promise<PaginaAutomatizaciones> {
    const pagina = Math.max(1, opciones.pagina || 1);
    const tamanoPagina = Math.min(LIMITE_PAGINA, Math.max(1, opciones.tamanoPagina || 10));

    if (USAR_BACKEND) {
      const parametros = new URLSearchParams({
        pagina: String(pagina),
        tamanoPagina: String(tamanoPagina),
      });
      if (opciones.busqueda) parametros.set('busqueda', opciones.busqueda);
      if (opciones.evento) parametros.set('evento', opciones.evento);
      if (opciones.activa !== undefined && opciones.activa !== null) {
        parametros.set('activa', String(opciones.activa));
      }

      return this.solicitar<PaginaAutomatizaciones>(`?${parametros.toString()}`);
    }

    const busqueda = (opciones.busqueda || '').trim().toLowerCase();
    const filtradas = this.memoria
      .filter((automatizacion) => {
        if (opciones.evento && automatizacion.evento !== opciones.evento) return false;
        if (opciones.activa !== undefined && opciones.activa !== null) {
          if (automatizacion.activa !== opciones.activa) return false;
        }
        if (!busqueda) return true;
        return (
          automatizacion.nombre.toLowerCase().includes(busqueda) ||
          automatizacion.descripcion.toLowerCase().includes(busqueda)
        );
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    const total = filtradas.length;
    const inicio = (pagina - 1) * tamanoPagina;

    return {
      datos: JSON.parse(JSON.stringify(filtradas.slice(inicio, inicio + tamanoPagina))),
      total,
      pagina,
      tamanoPagina,
      totalPaginas: Math.max(1, Math.ceil(total / tamanoPagina)),
      hasMore: inicio + tamanoPagina < total,
    };
  }

  async crear(input: CrearAutomatizacionInput): Promise<Automatizacion> {
    if (USAR_BACKEND) {
      const creada = await this.solicitar<Automatizacion>('', this.opcionesJson('POST', input));
      return creada;
    }

    const creada: Automatizacion = {
      id: `auto-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      nombre: input.nombre.trim(),
      descripcion: (input.descripcion || '').trim(),
      evento: input.evento,
      activa: input.activa ?? true,
      condiciones: {
        etapa: input.condiciones?.etapa || '',
        etapa_origen: input.condiciones?.etapa_origen || '',
        sector: input.condiciones?.sector || '',
        prioridad: input.condiciones?.prioridad || '',
      },
      accion: {
        ...input.accion,
        titulo: input.accion.titulo.trim(),
        descripcion: (input.accion.descripcion || '').trim(),
        dias_vencimiento: Math.max(0, Number(input.accion.dias_vencimiento) || 0),
      },
      creado_en: new Date().toISOString(),
    };

    this.memoria.push(creada);
    this.guardarLocal();
    return JSON.parse(JSON.stringify(creada));
  }

  async actualizar(
    id: string,
    cambios: Partial<CrearAutomatizacionInput>
  ): Promise<Automatizacion | null> {
    if (USAR_BACKEND) {
      try {
        return await this.solicitar<Automatizacion>(
          `/${encodeURIComponent(id)}`,
          this.opcionesJson('PATCH', cambios)
        );
      } catch {
        return null;
      }
    }

    const indice = this.memoria.findIndex((automatizacion) => automatizacion.id === id);
    if (indice === -1) return null;

    const actual = this.memoria[indice];
    const actualizada: Automatizacion = {
      ...actual,
      ...cambios,
      condiciones: { ...actual.condiciones, ...(cambios.condiciones || {}) },
      accion: { ...actual.accion, ...(cambios.accion || {}) },
      actualizado_en: new Date().toISOString(),
    };

    this.memoria[indice] = actualizada;
    this.guardarLocal();
    return JSON.parse(JSON.stringify(actualizada));
  }

  async cambiarEstado(id: string, activa: boolean): Promise<boolean> {
    const actualizada = await this.actualizar(id, { activa });
    return !!actualizada;
  }

  async eliminar(id: string): Promise<boolean> {
    if (USAR_BACKEND) {
      try {
        await this.solicitar(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
        return true;
      } catch {
        return false;
      }
    }

    const antes = this.memoria.length;
    this.memoria = this.memoria.filter((automatizacion) => automatizacion.id !== id);
    this.guardarLocal();
    return this.memoria.length < antes;
  }
}

export const automatizacionesService = new AutomatizacionesService();
