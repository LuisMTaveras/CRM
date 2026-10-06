import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { parsearParametrosURL, serializarParametrosURL, type ParametrosTabla } from '@/core/url-sync/url-state';

export function useURLTableState() {
  const route = useRoute();
  const router = useRouter();

  const extraerParametros = (): ParametrosTabla => {
    const params = new URLSearchParams();
    if (route && route.query) {
      for (const [key, val] of Object.entries(route.query)) {
        if (val !== null && val !== undefined) {
          params.set(key, Array.isArray(val) ? String(val[0]) : String(val));
        }
      }
    }
    const search = params.toString() || (typeof window !== 'undefined' ? window.location.search : '');
    return parsearParametrosURL(search);
  };

  const estado = ref<ParametrosTabla>(extraerParametros());

  // Sincronizar reactivamente si cambia la URL o la navegación atrás/adelante del navegador
  if (route) {
    watch(
      () => route.query,
      () => {
        estado.value = extraerParametros();
      },
      { deep: true }
    );
  }

  const actualizarEstado = (nuevosParametros: Partial<ParametrosTabla>) => {
    const combinados: ParametrosTabla = {
      ...estado.value,
      ...nuevosParametros,
    };

    // Asegurar tipos numéricos correctos
    if (combinados.pagina !== undefined) {
      combinados.pagina = Math.max(1, Number(combinados.pagina) || 1);
    }
    if (combinados.tamanoPagina !== undefined) {
      combinados.tamanoPagina = Math.max(5, Number(combinados.tamanoPagina) || 15);
    }

    // Si cambia la búsqueda o filtros, reiniciamos a la página 1
    if (nuevosParametros.busqueda !== undefined && nuevosParametros.busqueda !== estado.value.busqueda) {
      combinados.pagina = 1;
    }
    if (nuevosParametros.estado !== undefined && nuevosParametros.estado !== estado.value.estado) {
      combinados.pagina = 1;
    }
    if (nuevosParametros.sector !== undefined && nuevosParametros.sector !== estado.value.sector) {
      combinados.pagina = 1;
    }

    // Actualización inmediata del estado reactivo para respuesta instantánea de la UI
    estado.value = combinados;

    const queryStr = serializarParametrosURL(combinados);
    const paramsObj = Object.fromEntries(new URLSearchParams(queryStr));

    if (router && route) {
      router.replace({
        path: route.path,
        query: paramsObj,
      }).catch(() => {});
    }
  };

  return {
    estado,
    actualizarEstado,
  };
}
