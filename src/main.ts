import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from '@/app/router';
import App from '@/app/App.vue';
import { registerPermissions } from '@/shared/directives/v-can';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import '@/core/styles/main.css';
import '@flickerless/core/styles.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
registerPermissions(app);

// Inicializar sesión y permisos antes de montar el router
const authStore = useAuthStore();
authStore.inicializarSesion();

app.use(router);
app.mount('#app');
