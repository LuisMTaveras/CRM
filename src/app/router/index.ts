import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import { obtenerRutaInicial } from '@/core/permissions/permisos-rutas';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/modules/auth/views/LoginView.vue'),
      meta: { publica: true },
    },
    {
      path: '/propuesta/:token',
      name: 'propuesta-cliente',
      component: () => import('@/modules/catalogo/views/PropuestaClienteView.vue'),
      meta: { publica: true },
    },
    {
      path: '/sin-acceso',
      name: 'sin-acceso',
      component: () => import('@/modules/auth/views/SinAccesoView.vue'),
    },
    {
      path: '/',
      name: 'metricas',
      component: () => import('@/modules/metricas/views/MetricasView.vue'),
      alias: '/metricas',
      meta: { permiso: 'metricas:ver_kpis', permisoAlternativo: 'metricas:ver_ejecutivos' },
    },
    {
      path: '/clientes',
      name: 'clientes',
      component: () => import('@/modules/clientes').then((m) => m.ClientesView),
      meta: { permiso: 'clientes:ver' },
    },
    {
      path: '/pipeline',
      name: 'pipelines-catalogo',
      component: () => import('@/modules/pipeline/views/PipelinesCatalogView.vue'),
      meta: { permiso: 'pipeline:ver' },
    },
    {
      path: '/pipeline/:id',
      name: 'pipeline-detalle',
      component: () => import('@/modules/pipeline/views/PipelineView.vue'),
      meta: { permiso: 'pipeline:ver' },
    },
    {
      path: '/catalogo',
      name: 'catalogo',
      component: () => import('@/modules/catalogo/views/CatalogoView.vue'),
      alias: ['/cpq', '/cotizaciones'],
      meta: { permiso: 'comunicaciones:documentos' },
    },
    {
      path: '/agenda',
      name: 'agenda',
      component: () => import('@/modules/agenda').then((m) => m.AgendaView),
      meta: { permiso: 'clientes:ver' },
    },
    {
      path: '/whatsapp',
      name: 'whatsapp',
      component: () => import('@/modules/comunicaciones/views/WhatsAppView.vue'),
      alias: ['/whatsapp-web', '/chat-whatsapp'],
      meta: { permiso: 'comunicaciones:ver' },
    },
    {
      path: '/comunicaciones',
      name: 'comunicaciones',
      component: () => import('@/modules/comunicaciones/views/ComunicacionesView.vue'),
      alias: ['/correo', '/webmail'],
      meta: { permiso: 'comunicaciones:ver' },
    },
    {
      path: '/despacho',
      name: 'despacho',
      component: () => import('@/modules/comunicaciones/views/ComunicacionesView.vue'),
      alias: ['/despacho-masivo', '/comunicaciones/despacho'],
      meta: { permiso: 'comunicaciones:enviar' },
    },
    {
      path: '/usuarios',
      name: 'usuarios',
      component: () => import('@/modules/auth/views/UsuariosView.vue'),
      meta: { permiso: 'usuarios:ver' },
    },
    {
      path: '/auditoria',
      name: 'auditoria',
      component: () => import('@/modules/auditoria/views/AuditoriaView.vue'),
      meta: { permiso: 'usuarios:ver' },
    },
    {
      path: '/configuracion',
      name: 'configuracion',
      component: () => import('@/modules/configuracion/views/ConfiguracionView.vue'),
      meta: { permiso: 'configuracion:ver' },
    },
  ],
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  if (authStore.estaAutenticado && !authStore.sesionVerificada) {
    await authStore.verificarSesion();
  }

  if (!authStore.estaAutenticado && !to.meta.publica) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  if (authStore.estaAutenticado && to.name === 'login') {
    const rutaInicial = obtenerRutaInicial(authStore.tienePermiso);
    return rutaInicial ? { name: rutaInicial.nombre } : { name: 'sin-acceso' };
  }

  if (to.meta.permiso) {
    const permitido =
      authStore.tienePermiso(to.meta.permiso) ||
      (!!to.meta.permisoAlternativo && authStore.tienePermiso(to.meta.permisoAlternativo));

    if (!permitido) {
      return { name: 'sin-acceso', query: { desde: to.fullPath } };
    }
  }

  return true;
});

export default router;
