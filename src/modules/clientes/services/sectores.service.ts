import type { Component } from 'vue';
import { 
  type SectorEconomico, 
  SECTORES_INICIALES, 
  MAPA_ICONOS_SECTOR 
} from '../types/sector.types';
import type { SelectOption } from '@/shared/components/AppSelect.vue';
import { Building2 } from 'lucide-vue-next';

const CLAVE_STORAGE_SECTORES = 'crm_sectores_economicos_master';

class SectoresService {
  private cargarSectores(): SectorEconomico[] {
    try {
      const datos = localStorage.getItem(CLAVE_STORAGE_SECTORES);
      if (datos) {
        const parsed: SectorEconomico[] = JSON.parse(datos);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback a iniciales
    }
    return [...SECTORES_INICIALES];
  }

  private guardarSectores(sectores: SectorEconomico[]): void {
    try {
      localStorage.setItem(CLAVE_STORAGE_SECTORES, JSON.stringify(sectores));
    } catch {
      // fallback
    }
  }

  obtenerSectores(soloActivos = false): SectorEconomico[] {
    const todos = this.cargarSectores();
    return soloActivos ? todos.filter((s) => s.activo) : todos;
  }

  obtenerSectorPorId(id: string): SectorEconomico | undefined {
    return this.cargarSectores().find((s) => s.id === id);
  }

  obtenerSectorPorNombre(nombreOId: string): SectorEconomico | undefined {
    if (!nombreOId) return undefined;
    const sectores = this.cargarSectores();
    const normalizado = nombreOId.toLowerCase().trim();

    // Búsqueda exacta por id o nombre
    let encontrado = sectores.find(
      (s) => s.id.toLowerCase() === normalizado || s.nombre.toLowerCase() === normalizado
    );

    if (encontrado) return encontrado;

    // Búsqueda flexible / compatibilidad hacia atrás (ej: 'Tecnología' coincide con 'Tecnología & Cloud')
    encontrado = sectores.find(
      (s) => s.nombre.toLowerCase().includes(normalizado) || normalizado.includes(s.nombre.toLowerCase())
    );

    return encontrado;
  }

  /**
   * Resuelve el componente de icono Vue correspondiente para un sector
   */
  obtenerIconoComponente(iconoNombreOIdentificadorSector: string): Component {
    // Si se pasa el nombre del icono directamente (ej: 'Cpu')
    if (MAPA_ICONOS_SECTOR[iconoNombreOIdentificadorSector]) {
      return MAPA_ICONOS_SECTOR[iconoNombreOIdentificadorSector];
    }

    // Si se pasa el nombre del sector (ej: 'Salud & Redes Médicas')
    const sector = this.obtenerSectorPorNombre(iconoNombreOIdentificadorSector);
    if (sector && MAPA_ICONOS_SECTOR[sector.icono]) {
      return MAPA_ICONOS_SECTOR[sector.icono];
    }

    return Building2;
  }

  /**
   * Obtiene la clase de color y badge para un sector
   */
  obtenerColorSector(nombreSector: string): string {
    const sec = this.obtenerSectorPorNombre(nombreSector);
    return sec?.color || 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
  }

  obtenerDotColor(nombreSector: string): string {
    const sec = this.obtenerSectorPorNombre(nombreSector);
    return sec?.dotColor || 'bg-zinc-400';
  }

  /**
   * Convierte los sectores en opciones tipadas para AppSelect
   */
  obtenerOpcionesSelect(incluirOpcionTodos = false, labelTodos = 'Todos los Sectores'): Array<SelectOption<string>> {
    const sectores = this.obtenerSectores(true);
    const opciones: Array<SelectOption<string>> = [];

    if (incluirOpcionTodos) {
      opciones.push({
        value: '',
        label: labelTodos,
        icon: Building2,
      });
    }

    for (const sec of sectores) {
      opciones.push({
        value: sec.nombre,
        label: sec.nombre,
        icon: this.obtenerIconoComponente(sec.icono),
        dotColor: sec.dotColor,
        colorClass: 'font-medium',
      });
    }

    return opciones;
  }

  crearSector(datos: {
    nombre: string;
    codigo: string;
    icono: string;
    color: string;
    dotColor: string;
    descripcion?: string;
  }): SectorEconomico {
    const sectores = this.cargarSectores();
    const idSlug = `sec-${datos.nombre.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20)}-${Date.now().toString(36)}`;

    const nuevo: SectorEconomico = {
      id: idSlug,
      codigo: datos.codigo.toUpperCase().trim(),
      nombre: datos.nombre.trim(),
      icono: datos.icono,
      color: datos.color,
      dotColor: datos.dotColor,
      descripcion: datos.descripcion?.trim() || '',
      activo: true,
    };

    sectores.push(nuevo);
    this.guardarSectores(sectores);
    return nuevo;
  }

  actualizarSector(id: string, cambios: Partial<SectorEconomico>): SectorEconomico {
    const sectores = this.cargarSectores();
    const idx = sectores.findIndex((s) => s.id === id);
    if (idx === -1) {
      throw new Error('Sector no encontrado.');
    }

    const actualizado: SectorEconomico = {
      ...sectores[idx],
      ...cambios,
      id: sectores[idx].id,
    };

    sectores[idx] = actualizado;
    this.guardarSectores(sectores);
    return actualizado;
  }

  eliminarSector(id: string): boolean {
    const sectores = this.cargarSectores();
    const filtrados = sectores.filter((s) => s.id !== id);
    if (filtrados.length === sectores.length) return false;
    this.guardarSectores(filtrados);
    return true;
  }

  restablecerSectores(): SectorEconomico[] {
    const copias = [...SECTORES_INICIALES];
    this.guardarSectores(copias);
    return copias;
  }
}

export const sectoresService = new SectoresService();
