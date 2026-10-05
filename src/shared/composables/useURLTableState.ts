import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { parsearParametrosURL, serializarParametrosURL, type ParametrosTabla } from '@/core/url-sync/url-state';

export function useURLTableState() {
  const route = useRoute();
  const router = useRouter();

  const estado = computed<ParametrosTabla>(() => {
    // Tomamos la query de vue-router o window.location.search
    const search = window.location.search;
    return parsearParametrosURL(search);
  });

  const actualizarEstado = (nuevosParametros: Partial<ParametrosTabla>) => {
    const combinados = { ...estado.value, ...nuevosParametros };
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

    const queryStr = serializarParametrosURL(combinados);
    const paramsObj = Object.fromEntries(new URLSearchParams(queryStr));

    router.replace({
      path: route.path,
      query: paramsObj,
    });
  };

  return {
    estado,
    actualizarEstado,
  };
}
