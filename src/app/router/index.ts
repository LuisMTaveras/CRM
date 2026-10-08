import { createRouter, createWebHistory } from 'vue-router';
import { ClientesView } from '@/modules/clientes';
import PipelineView from '@/modules/pipeline/views/PipelineView.vue';
import PipelinesCatalogView from '@/modules/pipeline/views/PipelinesCatalogView.vue';
import MetricasView from '@/modules/metricas/views/MetricasView.vue';
import ConfiguracionView from '@/modules/configuracion/views/ConfiguracionView.vue';
import LoginView from '@/modules/auth/views/LoginView.vue';
import UsuariosView from '@/modules/auth/views/UsuariosView.vue';
import ComunicacionesView from '@/modules/comunicaciones/views/ComunicacionesView.vue';
import { useAuthStore } from '@/modules/auth/stores/auth.store';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { publica: true },
    },
    {
      path: '/',
      name: 'clientes',
      component: ClientesView,
    },
    {
      path: '/pipeline',
      name: 'pipelines-catalogo',
      component: PipelinesCatalogView,
    },
    {
      path: '/pipeline/:id',
      name: 'pipeline-detalle',
      component: PipelineView,
    },
    {
      path: '/comunicaciones',
      name: 'comunicaciones',
      component: ComunicacionesView,
    },
    {
      path: '/metricas',
      name: 'metricas',
      component: MetricasView,
    },
    {
      path: '/usuarios',
      name: 'usuarios',
      component: UsuariosView,
    },
    {
      path: '/configuracion',
      name: 'configuracion',
      component: ConfiguracionView,
    },
  ],
});

// Guard de Navegación de Autenticación
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  if (!authStore.estaAutenticado && !to.meta.publica) {
    return next({ name: 'login' });
  }

  if (authStore.estaAutenticado && to.name === 'login') {
    return next({ name: 'clientes' });
  }

  next();
});

export default router;
