import { clienteService } from '@/modules/clientes/services/cliente.service';
import type { 
  OportunidadConCliente, 
  EtapaOportunidad, 
  FiltrosPipeline, 
  NuevaOportunidadInput 
} from '../types/pipeline.types';

class PipelineService {
  async obtenerOportunidades(filtros?: FiltrosPipeline): Promise<OportunidadConCliente[]> {
    const todas = await clienteService.obtenerTodasLasOportunidades();
    let resultado = [...todas];

    if (filtros?.responsable && filtros.responsable !== '') {
      resultado = resultado.filter((o) => o.responsable === filtros.responsable);
    }

    if (filtros?.sector && filtros.sector !== '') {
      resultado = resultado.filter((o) => o.cliente_sector === filtros.sector);
    }

    if (filtros?.busqueda && filtros.busqueda.trim() !== '') {
      const q = filtros.busqueda.toLowerCase().trim();
      resultado = resultado.filter(
        (o) =>
          o.titulo.toLowerCase().includes(q) ||
          o.cliente_nombre.toLowerCase().includes(q)
      );
    }

    return resultado;
  }

  async moverEtapa(oportunidadId: string, nuevaEtapa: EtapaOportunidad): Promise<boolean> {
    return await clienteService.moverEtapaOportunidad(oportunidadId, nuevaEtapa);
  }

  async crearOportunidad(input: NuevaOportunidadInput): Promise<OportunidadConCliente> {
    const cliente = await clienteService.obtenerClientePorId(input.cliente_id);
    if (!cliente) throw new Error('Cliente seleccionado no encontrado.');

    const opCreada = await clienteService.agregarOportunidad(input.cliente_id, {
      titulo: input.titulo,
      monto: input.monto,
      etapa: input.etapa,
      probabilidad: input.probabilidad,
      fecha_cierre_estimada: input.fecha_cierre_estimada,
    });

    return {
      ...opCreada,
      cliente_nombre: cliente.nombre_comercial || cliente.razon_social,
      cliente_sector: cliente.sector,
      responsable: cliente.responsable,
    };
  }

  async eliminarOportunidad(clienteId: string, oportunidadId: string): Promise<boolean> {
    return await clienteService.eliminarOportunidad(clienteId, oportunidadId);
  }

  async obtenerResponsables(): Promise<string[]> {
    const resp = await clienteService.obtenerClientes({ pagina: 1, tamanoPagina: 500, busqueda: '' });
    const setResp = new Set<string>();
    resp.datos.forEach((c) => {
      if (c.responsable) setResp.add(c.responsable);
    });
    return Array.from(setResp).sort();
  }

  async obtenerClientesParaSelector(): Promise<Array<{ id: string; razon_social: string; nombre_comercial?: string }>> {
    const resp = await clienteService.obtenerClientes({ pagina: 1, tamanoPagina: 500, busqueda: '' });
    return resp.datos.map((c) => ({
      id: c.id,
      razon_social: c.razon_social,
      nombre_comercial: c.nombre_comercial,
    }));
  }
}

export const pipelineService = new PipelineService();
