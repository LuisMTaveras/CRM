<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { Layers, Lock, Mail, Eye, EyeOff, Loader2, ShieldCheck, UserCheck, AlertCircle } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('camila@crm.do');
const contrasena = ref('admin123');
const mostrarContrasena = ref(false);
const recordarme = ref(true);
const cargando = ref(false);
const error = ref<string | null>(null);

const cuentasDemo = [
  {
    nombre: 'Camila Morales',
    rol: 'Directora / Admin',
    desc: 'Permisos totales (manage all)',
    email: 'camila@crm.do',
    pass: 'admin123',
    badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
  },
  {
    nombre: 'Ignacio Silva',
    rol: 'Ejecutivo Comercial',
    desc: 'Crear y editar (sin eliminar)',
    email: 'ignacio@crm.do',
    pass: 'ventas123',
    badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
  },
  {
    nombre: 'Felipe Guzmán',
    rol: 'Gerente Comercial',
    desc: 'Gestión total de cuentas y métricas',
    email: 'felipe@crm.do',
    pass: 'gerente123',
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
  },
  {
    nombre: 'Laura Peña',
    rol: 'Auditora / Solo Lectura',
    desc: 'Solo lectura (sin crear ni editar)',
    email: 'laura@crm.do',
    pass: 'auditor123',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  },
];

const seleccionarDemo = (cuenta: typeof cuentasDemo[0]) => {
  email.value = cuenta.email;
  contrasena.value = cuenta.pass;
  manejarLogin();
};

const manejarLogin = async () => {
  if (!email.value || !contrasena.value) {
    error.value = 'Por favor ingresa tu correo y contraseña.';
    return;
  }

  cargando.value = true;
  error.value = null;

  try {
    await authStore.iniciarSesion({
      email: email.value,
      contrasena: contrasena.value,
      recordarme: recordarme.value,
    });
    router.push('/');
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Error al autenticar sesión.';
  } finally {
    cargando.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center items-center p-4 selection:bg-indigo-500/20 selection:text-indigo-400">
    <!-- Contenedor Central -->
    <div class="w-full max-w-md space-y-6">
      <!-- Marca y Logotipo -->
      <div class="text-center space-y-2">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm mb-1">
          <Layers class="w-6 h-6" />
        </div>
        <h1 class="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          DEVFORGE CRM
        </h1>
        <p class="text-xs text-zinc-500 dark:text-zinc-400">
          Plataforma Comercial B2B • República Dominicana
        </p>
      </div>

      <!-- Tarjeta Principal de Login -->
      <div class="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xl backdrop-blur-sm text-xs">
        <div class="mb-5 pb-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span class="font-semibold text-zinc-800 dark:text-zinc-200">Inicio de Sesión Seguro</span>
          <span class="inline-flex items-center gap-1 font-mono text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
            <ShieldCheck class="w-3 h-3" />
            Validación de Clave Activa
          </span>
        </div>

        <!-- Mensaje de Error de Validación -->
        <div v-if="error" class="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 rounded-md text-[11px] leading-relaxed flex items-center gap-2">
          <AlertCircle class="w-4 h-4 text-rose-500 shrink-0" />
          <span>{{ error }}</span>
        </div>

        <form @submit.prevent="manejarLogin" class="space-y-4">
          <!-- Campo Correo -->
          <div>
            <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1.5">
              Correo Electrónico
            </label>
            <div class="relative">
              <Mail class="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                v-model="email"
                type="email"
                required
                placeholder="usuario@crm.do"
                class="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          <!-- Campo Contraseña -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-zinc-700 dark:text-zinc-300 font-medium">Contraseña</label>
              <span class="text-[10px] text-zinc-500 font-mono">Verificación estricta</span>
            </div>
            <div class="relative">
              <Lock class="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                v-model="contrasena"
                :type="mostrarContrasena ? 'text' : 'password'"
                required
                placeholder="••••••••"
                class="w-full pl-9 pr-9 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-mono"
              />
              <button
                type="button"
                @click="mostrarContrasena = !mostrarContrasena"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <EyeOff v-if="mostrarContrasena" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Opciones adicionales -->
          <div class="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input
                v-model="recordarme"
                type="checkbox"
                class="rounded bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-indigo-600 focus:ring-0 accent-indigo-600"
              />
              <span>Recordar este equipo</span>
            </label>
            <span class="text-zinc-400 dark:text-zinc-500">PostgreSQL Auth</span>
          </div>

          <!-- Botón de Entrar -->
          <button
            type="submit"
            :disabled="cargando"
            class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-md transition duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Loader2 v-if="cargando" class="w-4 h-4 animate-spin" />
            <span v-else>Acceder al Sistema</span>
          </button>
        </form>

        <!-- Acceso Rápido a Cuentas Demo de Prueba -->
        <div class="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-2.5 flex items-center gap-1.5">
            <UserCheck class="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
            <span>Credenciales Registradas de Prueba</span>
          </div>

          <div class="space-y-2">
            <button
              v-for="cuenta in cuentasDemo"
              :key="cuenta.email"
              type="button"
              @click="seleccionarDemo(cuenta)"
              class="w-full text-left p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 transition flex items-center justify-between group"
            >
              <div>
                <div class="font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {{ cuenta.nombre }}
                </div>
                <div class="text-[10px] text-zinc-500 flex items-center gap-2 mt-0.5">
                  <span>{{ cuenta.email }}</span>
                  <span>•</span>
                  <span class="font-mono text-zinc-600 dark:text-zinc-300">Clave: <code class="text-indigo-600 dark:text-indigo-400 font-semibold">{{ cuenta.pass }}</code></span>
                </div>
              </div>
              <span :class="['text-[10px] font-mono px-2 py-0.5 rounded border font-medium', cuenta.badge]">
                {{ cuenta.rol }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Pie informativo -->
      <div class="text-center text-[11px] text-zinc-400 dark:text-zinc-500">
        Control de Acceso Basado en Roles (RBAC) • Blueprint 04 DEVFORGE
      </div>
    </div>
  </div>
</template>
