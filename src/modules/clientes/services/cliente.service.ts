import type { ParametrosTabla } from '@/core/url-sync/url-state';
import type { 
  Cliente, 
  Contacto, 
  EstadoCliente, 
  NuevoClienteInput, 
  NuevoContactoInput, 
  Oportunidad,
  Actividad,
  RespuestaClientesPaginada 
} from '../types/cliente.types';
import { CLIENTES_SEMILLA } from './cliente.mock-data';

const CLAVE_STORAGE_CLIENTES = 'crm_clientes_registrados';

class ClienteService {
  private memoriaClientes: Cliente[] = this.cargarClientesIniciales();

  private cargarClientesIniciales(): Cliente[] {
    try {
      const guardado = localStorage.getItem(CLAVE_STORAGE_CLIENTES);
      if (guardado) {
        const parsed: Cliente[] = JSON.parse(guardado);
        if (Array.isArray(parsed) && parsed.length >= 100) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    const iniciales = [...CLIENTES_SEMILLA];
    try {
      localStorage.setItem(CLAVE_STORAGE_CLIENTES, JSON.stringify(iniciales));
    } catch {
      // fallback
    }
    return iniciales;
  }

  private guardarEnStorage(): void {
    try {
      localStorage.setItem(CLAVE_STORAGE_CLIENTES, JSON.stringify(this.memoriaClientes));
    } catch {
      // fallback
    }
  }

  /**
   * Restablece la memoria y localStorage con el catálogo semilla de 100+ clientes y contactos
   */
  restablecerSemilla(): Cliente[] {
    this.memoriaClientes = [...CLIENTES_SEMILLA];
    this.guardarEnStorage();
    return this.memoriaClientes;
  }

  vaciarClientes(): void {
    this.memoriaClientes = [];
    this.guardarEnStorage();
  }

  /**
   * Simula la llamada a la base de datos PostgreSQL (función sp_obtener_clientes_paginados)
   * o conecta al endpoint real si VITE_USE_MOCK es falso.
   */
  async obtenerClientes(params: ParametrosTabla): Promise<RespuestaClientesPaginada> {
    const useMock = import.meta.env.VITE_USE_MOCK !== 'false';

    if (!useMock) {
      const queryParams = new URLSearchParams();
      if (params.pagina) queryParams.set('pagina', String(params.pagina));
      if (params.tamanoPagina) queryParams.set('tamanoPagina', String(params.tamanoPagina));
      if (params.busqueda) queryParams.set('busqueda', params.busqueda);
      if (params.ordenCampo) queryParams.set('ordenCampo', params.ordenCampo);
      if (params.ordenDireccion) queryParams.set('ordenDireccion', params.ordenDireccion);
      if (params.estado) queryParams.set('estado', params.estado);
      if (params.sector) queryParams.set('sector', params.sector);

      const resp = await fetch(`${import.meta.env.VITE_API_URL}/clientes?${queryParams.toString()}`);
      if (!resp.ok) {
        throw new Error(`Error en el servidor al consultar clientes: ${resp.statusText}`);
      }
      return await resp.json();
    }

    // --- Adaptador Asíncrono PostgreSQL (Simulación con latencia de red) ---
    await new Promise((resolve) => setTimeout(resolve, 320));
    return this.filtrarYPaginarMemoria(params);
  }

  /**
   * Obtiene la primera página o datos de memoria de forma sincrónica.
   * Permite hidratar la tabla al instante (0ms) sin skeleton ni pantalla de espera.
   */
  obtenerClientesSincrono(params: ParametrosTabla): RespuestaClientesPaginada {
    return this.filtrarYPaginarMemoria(params);
  }

  private filtrarYPaginarMemoria(params: ParametrosTabla): RespuestaClientesPaginada {
    let filtrados = [...this.memoriaClientes];

    // Filtro por búsqueda textual
    if (params.busqueda && params.busqueda.trim() !== '') {
      const q = params.busqueda.toLowerCase().trim();
      filtrados = filtrados.filter((c) =>
        c.razon_social.toLowerCase().includes(q) ||
        c.codigo.toLowerCase().includes(q) ||
        (c.nombre_comercial && c.nombre_comercial.toLowerCase().includes(q)) ||
        (c.identificacion_fiscal && c.identificacion_fiscal.toLowerCase().includes(q)) ||
        c.responsable.toLowerCase().includes(q) ||
        (c.ciudad && c.ciudad.toLowerCase().includes(q))
      );
    }

    // Filtro por Estado
    if (params.estado && params.estado !== '') {
      filtrados = filtrados.filter((c) => c.estado === params.estado);
    }

    // Filtro por Sector
    if (params.sector && params.sector !== '') {
      filtrados = filtrados.filter((c) => c.sector === params.sector);
    }

    // Ordenamiento
    const campo = (params.ordenCampo || 'creado_en') as keyof Cliente;
    const orden = params.ordenDireccion || 'desc';

    filtrados.sort((a, b) => {
      const valA = a[campo];
      const valB = b[campo];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return orden === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA || '');
      const strB = String(valB || '');
      return orden === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });

    // Paginación
    const total = filtrados.length;
    const pagina = params.pagina || 1;
    const tamanoPagina = params.tamanoPagina || 15;
    const inicio = (pagina - 1) * tamanoPagina;
    // Copias: la UI nunca debe compartir referencias con la memoria del servicio
    const datosPaginados: Cliente[] = JSON.parse(JSON.stringify(filtrados.slice(inicio, inicio + tamanoPagina)));
    const totalPaginas = Math.ceil(total / tamanoPagina) || 1;

    // Métricas en tiempo real del pipeline
    const totalClientes = this.memoriaClientes.length;
    const prospectos = this.memoriaClientes.filter((c) => c.estado === 'prospecto').length;
    const enNegociacion = this.memoriaClientes.filter((c) => c.estado === 'en_negociacion').length;
    const activos = this.memoriaClientes.filter((c) => c.estado === 'activo').length;
    const valorTotalPipeline = this.memoriaClientes.reduce((acc, c) => acc + (c.valor_estimado || 0), 0);

    return {
      datos: datosPaginados,
      total,
      pagina,
      tamanoPagina,
      totalPaginas,
      estadisticas: {
        totalClientes,
        prospectos,
        enNegociacion,
        activos,
        valorTotalPipeline,
      },
    };
  }

  async obtenerClientePorId(id: string): Promise<Cliente | null> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const encontrado = this.memoriaClientes.find((c) => c.id === id);
    return encontrado ? JSON.parse(JSON.stringify(encontrado)) : null;
  }

  async crearCliente(datos: NuevoClienteInput): Promise<Cliente> {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const nuevoCodigo = `CLI-00${this.memoriaClientes.length + 1}`;
    const nuevoId = crypto.randomUUID ? crypto.randomUUID() : `cli-${Date.now()}`;

    const contactosIniciales: Contacto[] = [];
    if (datos.contacto_nombre && datos.contacto_nombre.trim() !== '') {
      contactosIniciales.push({
        id: `cnt-${Date.now()}`,
        cliente_id: nuevoId,
        nombre: datos.contacto_nombre.trim(),
        cargo: datos.contacto_cargo?.trim() || 'Contacto Principal',
        email: datos.contacto_email?.trim() || datos.email,
        telefono: datos.contacto_telefono?.trim() || datos.telefono,
        es_principal: true,
        creado_en: new Date().toISOString(),
      });
    }

    const nuevoCliente: Cliente = {
      id: nuevoId,
      codigo: nuevoCodigo,
      ...datos,
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
      contactos: contactosIniciales,
      oportunidades: [],
      actividades: [
        {
          id: `act-${Date.now()}`,
          cliente_id: nuevoId,
          tipo: 'nota',
          descripcion: 'Registro inicial creado en la plataforma comercial.',
          realizado_por: datos.responsable,
          fecha: new Date().toISOString(),
        }
      ],
    };

    this.memoriaClientes.unshift(nuevoCliente);
    this.guardarEnStorage();
    return nuevoCliente;
  }

  async agregarContacto(clienteId: string, input: NuevoContactoInput): Promise<Contacto> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const cliente = this.memoriaClientes.find((c) => c.id === clienteId);
    if (!cliente) throw new Error('Cliente no encontrado');

    if (!cliente.contactos) {
      cliente.contactos = [];
    }

    const esPrincipal = input.es_principal ?? (cliente.contactos.length === 0);
    if (esPrincipal) {
      cliente.contactos.forEach((c) => (c.es_principal = false));
    }

    const nuevoContacto: Contacto = {
      id: `cnt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      cliente_id: clienteId,
      nombre: input.nombre.trim(),
      cargo: input.cargo.trim(),
      email: input.email.trim(),
      telefono: input.telefono.trim(),
      es_principal: esPrincipal,
      creado_en: new Date().toISOString(),
    };

    cliente.contactos.push(nuevoContacto);
    cliente.actualizado_en = new Date().toISOString();
    this.guardarEnStorage();
    return nuevoContacto;
  }

  async eliminarContacto(clienteId: string, contactoId: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const cliente = this.memoriaClientes.find((c) => c.id === clienteId);
    if (!cliente || !cliente.contactos) return false;

    const idx = cliente.contactos.findIndex((c) => c.id === contactoId);
    if (idx === -1) return false;

    const eraPrincipal = cliente.contactos[idx].es_principal;
    cliente.contactos.splice(idx, 1);

    // Si era el principal y quedan otros contactos, promover el primero
    if (eraPrincipal && cliente.contactos.length > 0) {
      cliente.contactos[0].es_principal = true;
    }

    cliente.actualizado_en = new Date().toISOString();
    this.guardarEnStorage();
    return true;
  }

  async marcarContactoPrincipal(clienteId: string, contactoId: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const cliente = this.memoriaClientes.find((c) => c.id === clienteId);
    if (!cliente || !cliente.contactos) return false;

    cliente.contactos.forEach((c) => {
      c.es_principal = c.id === contactoId;
    });

    cliente.actualizado_en = new Date().toISOString();
    this.guardarEnStorage();
    return true;
  }

  async actualizarEstado(id: string, nuevoEstado: EstadoCliente): Promise<Cliente> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const idx = this.memoriaClientes.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Cliente no encontrado');

    const actualizado = {
      ...this.memoriaClientes[idx],
      estado: nuevoEstado,
      actualizado_en: new Date().toISOString(),
    };
    this.memoriaClientes[idx] = actualizado;
    this.guardarEnStorage();
    return actualizado;
  }

  async actualizarCliente(id: string, datos: Partial<Cliente>): Promise<Cliente> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const idx = this.memoriaClientes.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Cliente no encontrado');

    const actualizado: Cliente = {
      ...this.memoriaClientes[idx],
      ...datos,
      actualizado_en: new Date().toISOString(),
    };
    this.memoriaClientes[idx] = actualizado;
    this.guardarEnStorage();
    return actualizado;
  }

  async agregarOportunidad(
    clienteId: string,
    input: Omit<Oportunidad, 'id' | 'cliente_id' | 'creado_en'>
  ): Promise<Oportunidad> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const cliente = this.memoriaClientes.find((c) => c.id === clienteId);
    if (!cliente) throw new Error('Cliente no encontrado');

    if (!cliente.oportunidades) {
      cliente.oportunidades = [];
    }

    const nuevaOportunidad: Oportunidad = {
      id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      cliente_id: clienteId,
      titulo: input.titulo.trim(),
      monto: Number(input.monto) || 0,
      etapa: input.etapa,
      probabilidad: Number(input.probabilidad) || 50,
      fecha_cierre_estimada: input.fecha_cierre_estimada || new Date().toISOString().slice(0, 10),
      creado_en: new Date().toISOString(),
    };

    cliente.oportunidades.unshift(nuevaOportunidad);
    // Recalcular valor estimado del cliente si aplica
    cliente.valor_estimado = cliente.oportunidades.reduce((acc, o) => acc + (o.monto || 0), 0);
    cliente.actualizado_en = new Date().toISOString();
    this.guardarEnStorage();
    return nuevaOportunidad;
  }

  async actualizarOportunidad(
    clienteId: string,
    oportunidadId: string,
    datos: Partial<Oportunidad>
  ): Promise<Oportunidad> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const cliente = this.memoriaClientes.find((c) => c.id === clienteId);
    if (!cliente || !cliente.oportunidades) throw new Error('Oportunidad o cliente no encontrado');

    const idx = cliente.oportunidades.findIndex((o) => o.id === oportunidadId);
    if (idx === -1) throw new Error('Oportunidad no encontrada');

    const actualizada: Oportunidad = {
      ...cliente.oportunidades[idx],
      ...datos,
    };
    cliente.oportunidades[idx] = actualizada;
    cliente.valor_estimado = cliente.oportunidades.reduce((acc, o) => acc + (o.monto || 0), 0);
    cliente.actualizado_en = new Date().toISOString();
    this.guardarEnStorage();
    return actualizada;
  }

  async eliminarOportunidad(clienteId: string, oportunidadId: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const cliente = this.memoriaClientes.find((c) => c.id === clienteId);
    if (!cliente || !cliente.oportunidades) return false;

    const idx = cliente.oportunidades.findIndex((o) => o.id === oportunidadId);
    if (idx === -1) return false;

    cliente.oportunidades.splice(idx, 1);
    cliente.valor_estimado = cliente.oportunidades.reduce((acc, o) => acc + (o.monto || 0), 0);
    cliente.actualizado_en = new Date().toISOString();
    this.guardarEnStorage();
    return true;
  }

  async agregarActividad(
    clienteId: string,
    input: Omit<Actividad, 'id' | 'cliente_id' | 'fecha'>
  ): Promise<Actividad> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const cliente = this.memoriaClientes.find((c) => c.id === clienteId);
    if (!cliente) throw new Error('Cliente no encontrado');

    if (!cliente.actividades) {
      cliente.actividades = [];
    }

    const nuevaActividad: Actividad = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      cliente_id: clienteId,
      tipo: input.tipo,
      descripcion: input.descripcion.trim(),
      realizado_por: input.realizado_por || cliente.responsable || 'Equipo Comercial',
      fecha: new Date().toISOString(),
    };

    cliente.actividades.unshift(nuevaActividad);
    cliente.ultimo_contacto = nuevaActividad.fecha;
    cliente.actualizado_en = new Date().toISOString();
    this.guardarEnStorage();
    return nuevaActividad;
  }

  async eliminarActividad(clienteId: string, actividadId: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const cliente = this.memoriaClientes.find((c) => c.id === clienteId);
    if (!cliente || !cliente.actividades) return false;

    const idx = cliente.actividades.findIndex((a) => a.id === actividadId);
    if (idx === -1) return false;

    cliente.actividades.splice(idx, 1);
    cliente.actualizado_en = new Date().toISOString();
    this.guardarEnStorage();
    return true;
  }

  async obtenerTodosParaExportar(filtros?: Partial<ParametrosTabla>): Promise<Cliente[]> {
    let resultado = [...this.memoriaClientes];
    if (filtros?.estado) {
      resultado = resultado.filter((c) => c.estado === filtros.estado);
    }
    if (filtros?.sector) {
      resultado = resultado.filter((c) => c.sector === filtros.sector);
    }
    if (filtros?.busqueda) {
      const q = filtros.busqueda.toLowerCase().trim();
      resultado = resultado.filter(
        (c) =>
          c.razon_social.toLowerCase().includes(q) ||
          c.codigo.toLowerCase().includes(q) ||
          (c.identificacion_fiscal && c.identificacion_fiscal.toLowerCase().includes(q))
      );
    }
    return resultado;
  }

  async obtenerTodasLasOportunidades(): Promise<
    Array<
      Oportunidad & {
        cliente_nombre: string;
        cliente_sector: string;
        responsable: string;
      }
    >
  > {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const oportunidadesPlanificadas: Array<
      Oportunidad & {
        cliente_nombre: string;
        cliente_sector: string;
        responsable: string;
      }
    > = [];

    for (const c of this.memoriaClientes) {
      if (c.oportunidades && c.oportunidades.length > 0) {
        for (const op of c.oportunidades) {
          oportunidadesPlanificadas.push({
            ...op,
            cliente_nombre: c.nombre_comercial || c.razon_social,
            cliente_sector: c.sector,
            responsable: c.responsable,
          });
        }
      }
    }

    return oportunidadesPlanificadas;
  }

  async moverEtapaOportunidad(oportunidadId: string, nuevaEtapa: Oportunidad['etapa']): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    for (const cliente of this.memoriaClientes) {
      if (cliente.oportunidades) {
        const deal = cliente.oportunidades.find((o) => o.id === oportunidadId);
        if (deal) {
          deal.etapa = nuevaEtapa;
          // Actualizar probabilidad según etapa
          if (nuevaEtapa === 'calificacion') deal.probabilidad = 40;
          else if (nuevaEtapa === 'propuesta') deal.probabilidad = 65;
          else if (nuevaEtapa === 'negociacion') deal.probabilidad = 80;
          else if (nuevaEtapa === 'ganada') deal.probabilidad = 100;
          else if (nuevaEtapa === 'perdida') deal.probabilidad = 0;

          // Si se gana o se negocia, sincronizar estado del cliente
          if (nuevaEtapa === 'ganada') {
            cliente.estado = 'activo';
          } else if (nuevaEtapa === 'negociacion' && cliente.estado !== 'activo') {
            cliente.estado = 'en_negociacion';
          }

          cliente.actualizado_en = new Date().toISOString();
          this.guardarEnStorage();
          return true;
        }
      }
    }
    return false;
  }

  async eliminarCliente(id: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const idx = this.memoriaClientes.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.memoriaClientes.splice(idx, 1);
    this.guardarEnStorage();
    return true;
  }
}

export const clienteService = new ClienteService();
