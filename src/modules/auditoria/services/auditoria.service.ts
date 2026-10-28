import { API_BASE_URL } from '@/core/api/api-config';
import type { FiltrosAuditoria, PaginaAuditoria } from '../types/auditoria.types';

function construirParametros(filtros: FiltrosAuditoria): URLSearchParams {
  const params = new URLSearchParams();
  if (filtros.page) params.set('page', String(filtros.page));
  if (filtros.pageSize) params.set('pageSize', String(filtros.pageSize));
  if (filtros.q?.trim()) params.set('q', filtros.q.trim());
  if (filtros.accion) params.set('accion', filtros.accion);
  if (filtros.entidad) params.set('entidad', filtros.entidad);
  if (filtros.desde) params.set('desde', filtros.desde);
  if (filtros.hasta) params.set('hasta', filtros.hasta);
  if (typeof filtros.exito === 'boolean') params.set('exito', String(filtros.exito));
  return params;
}

class AuditoriaService {
  async listar(filtros: FiltrosAuditoria = {}): Promise<PaginaAuditoria> {
    const params = construirParametros(filtros);
    const respuesta = await fetch(`${API_BASE_URL}/auditoria?${params.toString()}`);
    const data = await respuesta.json().catch(() => null);

    if (!respuesta.ok || data?.ok === false) {
      throw new Error(data?.error || 'No se pudo cargar el registro de auditoría.');
    }

    return {
      eventos: Array.isArray(data?.eventos) ? data.eventos : [],
      total: Number(data?.total) || 0,
      page: Number(data?.page) || filtros.page || 1,
      pageSize: Number(data?.pageSize) || filtros.pageSize || 25,
      hasMore: Boolean(data?.hasMore),
      acciones: Array.isArray(data?.acciones) ? data.acciones : [],
    };
  }

  async limpiar(antesDe = ''): Promise<{ eliminados: number; restantes: number }> {
    const params = new URLSearchParams();
    if (antesDe) params.set('antesDe', antesDe);
    const respuesta = await fetch(`${API_BASE_URL}/auditoria?${params.toString()}`, {
      method: 'DELETE',
    });
    const data = await respuesta.json().catch(() => null);

    if (!respuesta.ok || data?.ok === false) {
      throw new Error(data?.error || 'No se pudo limpiar el registro de auditoria.');
    }

    return {
      eliminados: Number(data?.eliminados) || 0,
      restantes: Number(data?.restantes) || 0,
    };
  }

  async descargarCsv(filtros: FiltrosAuditoria = {}): Promise<void> {
    const params = construirParametros(filtros);
    const respuesta = await fetch(`${API_BASE_URL}/auditoria/exportar.csv?${params.toString()}`);

    if (!respuesta.ok) {
      const data = await respuesta.json().catch(() => null);
      throw new Error(data?.error || 'No se pudo exportar el registro de auditoría.');
    }

    const blob = await respuesta.blob();
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'auditoria-crm.csv';
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  }
}

export const auditoriaService = new AuditoriaService();
