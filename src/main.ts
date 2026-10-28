import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from '@/app/router';
import App from '@/app/App.vue';
import { registerPermissions } from '@/shared/directives/v-can';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import { setFormatCountry, type CountryCode } from '@/core/formatters/formatters';
import { vFlickerlessSaving } from '@flickerless/vue';
import '@/core/styles/main.css';
import '@flickerless/core/styles.css';

setFormatCountry((import.meta.env.VITE_FORMAT_COUNTRY as CountryCode) || 'DO');

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
registerPermissions(app);
app.directive('flickerless-saving', vFlickerlessSaving);

// Inicializar sesión y permisos antes de montar el router
const authStore = useAuthStore();
authStore.inicializarSesion();

app.use(router);
app.mount('#app');
