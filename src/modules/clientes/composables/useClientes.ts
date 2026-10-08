import { ref, watch, onMounted } from 'vue';
import { useURLTableState } from '@/shared/composables/useURLTableState';
import { clienteService } from '../services/cliente.service';
import type { Cliente, EstadoCliente, RespuestaClientesPaginada } from '../types/cliente.types';
import { dialogService } from '@/core/dialog/dialog.service';
import { toastService } from '@/core/notifications/toast.service';

export function useClientes() {
  const { estado: parametrosURL, actualizarEstado } = useURLTableState();

  // Hidratación instantánea desde memoria/cache (0ms) para carga natural sin skeleton
  const datosIniciales = clienteService.obtenerClientesSincrono(parametrosURL.value);

  const clientes = ref<Cliente[]>(datosIniciales.datos);
  const cargando = ref(false);
  const error = ref<string | null>(null);
  const total = ref(datosIniciales.total);
  const totalPaginas = ref(datosIniciales.totalPaginas);

  const estadisticas = ref<RespuestaClientesPaginada['estadisticas']>(datosIniciales.estadisticas);

  const clienteSeleccionado = ref<Cliente | null>(null);
  const drawerAbierto = ref(false);
  const modalNuevoClienteAbierto = ref(false);

  const consultarClientes = async () => {
    cargando.value = true;
    error.value = null;
    try {
      const respuesta = await clienteService.obtenerClientes(parametrosURL.value);
      clientes.value = respuesta.datos;
      total.value = respuesta.total;
      totalPaginas.value = respuesta.totalPaginas;
      estadisticas.value = respuesta.estadisticas;

      // Si hay un cliente seleccionado en el drawer, refrescarlo
      if (clienteSeleccionado.value) {
        const actualizado = clientes.value.find((c) => c.id === clienteSeleccionado.value?.id);
        if (actualizado) {
          clienteSeleccionado.value = actualizado;
        }
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error desconocido al consultar clientes';
    } finally {
      cargando.value = false;
    }
  };

  const seleccionarCliente = async (cliente: Cliente) => {
    clienteSeleccionado.value = cliente;
    drawerAbierto.value = true;
    // Carga completa con detalles
    try {
      const detalle = await clienteService.obtenerClientePorId(cliente.id);
      if (detalle) {
        clienteSeleccionado.value = detalle;
      }
    } catch {
      // Usar datos locales si falla el detalle
    }
  };

  const cerrarDrawer = () => {
    drawerAbierto.value = false;
    clienteSeleccionado.value = null;
  };

  const cambiarEstadoCliente = async (id: string, nuevoEstado: EstadoCliente) => {
    try {
      await clienteService.actualizarEstado(id, nuevoEstado);
      toastService.exito('Estado de cliente actualizado exitosamente.');
      await consultarClientes();
    } catch (err: unknown) {
      toastService.error(err instanceof Error ? err.message : 'Error al actualizar estado');
    }
  };

  const eliminarCliente = async (id: string) => {
    const clienteABorrar = clientes.value.find((c) => c.id === id);
    const nombre = clienteABorrar ? clienteABorrar.razon_social : 'este registro';

    const confirmado = await dialogService.confirmar({
      titulo: 'ELIMINAR CLIENTE EMPRESARIAL',
      subtitulo: 'CONFIRMA LA ELIMINACIÓN DEL REGISTRO COMERCIAL',
      mensaje: `¿Confirma que desea eliminar a "${nombre}" del sistema?`,
      detalle: 'Se removerán los contactos, oportunidades y bitácoras asociadas a esta cuenta.',
      textoConfirmar: 'ELIMINAR CLIENTE',
      textoCancelar: 'CANCELAR',
      tipo: 'peligro',
    });

    if (!confirmado) return;

    try {
      await clienteService.eliminarCliente(id);
      if (clienteSeleccionado.value?.id === id) {
        cerrarDrawer();
      }
      toastService.exito('Cliente eliminado exitosamente.');
      await consultarClientes();
    } catch (err: unknown) {
      toastService.error(err instanceof Error ? err.message : 'Error al eliminar cliente');
    }
  };

  // Reaccionar a cambios en los parámetros de la URL
  watch(
    () => [
      parametrosURL.value.pagina,
      parametrosURL.value.tamanoPagina,
      parametrosURL.value.busqueda,
      parametrosURL.value.ordenCampo,
      parametrosURL.value.ordenDireccion,
      parametrosURL.value.estado,
      parametrosURL.value.sector,
    ],
    () => {
      consultarClientes();
    }
  );

  onMounted(() => {
    consultarClientes();
  });

  const restablecerDatosIniciales = async () => {
    clienteService.restablecerSemilla();
    await consultarClientes();
  };

  return {
    parametrosURL,
    actualizarEstado,
    clientes,
    cargando,
    error,
    total,
    totalPaginas,
    estadisticas,
    clienteSeleccionado,
    drawerAbierto,
    modalNuevoClienteAbierto,
    consultarClientes,
    restablecerDatosIniciales,
    seleccionarCliente,
    cerrarDrawer,
    cambiarEstadoCliente,
    eliminarCliente,
  };
}
