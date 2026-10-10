import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from '@/app/router';
import App from '@/app/App.vue';
import { registerPermissions } from '@/shared/directives/v-can';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import { vFlickerlessSaving } from '@flickerless/vue';
import '@/core/styles/main.css';
import '@flickerless/core/styles.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
registerPermissions(app);
app.directive('flickerless-saving', vFlickerlessSaving);

// Inicializar sesión y permisos antes de montar el router
const authStore = useAuthStore();
authStore.inicializarSesion();

// Verificar estado de inicio limpio desde cero
import('@/core/mantenimiento/limpieza-datos.service').then(({ limpiezaDatosService }) => {
  limpiezaDatosService.verificarLimpiezaInicial();
});

app.use(router);
app.mount('#app');
