<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { empresaService } from '@/modules/configuracion/services/empresa.service';
import {
  Layers,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
} from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();
const nombreEmpresa = computed(() => empresaService.datos.value.nombreComercial || empresaService.datos.value.razonSocial || 'CRM');
const paisEmpresa = computed(() => empresaService.datos.value.pais || '—');

// Modo de autenticación: 'password' | 'whatsapp'
const metodoAutenticacion = ref<'password' | 'whatsapp'>('password');

// Campos correo y contraseña
const email = ref('');
const contrasena = ref('');
const mostrarContrasena = ref(false);

// Campos WhatsApp OTP
const pasoWhatsApp = ref<'telefono' | 'otp'>('telefono');
const telefono = ref('');
const codigoOtp = ref('');
const codigoDevRecibido = ref<string | null>(null);
const mensajeExito = ref<string | null>(null);

const recordarme = ref(true);
const cargando = ref(false);
const error = ref<string | null>(null);

const cambiarMetodo = (metodo: 'password' | 'whatsapp') => {
  metodoAutenticacion.value = metodo;
  error.value = null;
  mensajeExito.value = null;
};

const manejarLoginPassword = async () => {
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

const solicitarCodigoWhatsApp = async () => {
  if (!telefono.value || telefono.value.trim().length < 8) {
    error.value = 'Ingresa un número de WhatsApp válido con código de país (ej. +1 829 708 4706).';
    return;
  }

  cargando.value = true;
  error.value = null;
  mensajeExito.value = null;

  try {
    const res = await authStore.solicitarOtpWhatsApp(telefono.value.trim());
    if (res.ok) {
      pasoWhatsApp.value = 'otp';
      mensajeExito.value = res.mensaje || 'Código de verificación enviado a tu WhatsApp.';
      if (res.codigo) {
        codigoDevRecibido.value = res.codigo;
        codigoOtp.value = res.codigo; // Pre-llenado en modo local/desarrollo
      }
    } else {
      error.value = res.mensaje || 'No se pudo generar el código de verificación.';
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Error al contactar con el servidor de WhatsApp.';
  } finally {
    cargando.value = false;
  }
};

const verificarCodigoWhatsApp = async () => {
  if (!codigoOtp.value || codigoOtp.value.trim().length < 6) {
    error.value = 'Ingresa el código de 6 dígitos recibido.';
    return;
  }

  cargando.value = true;
  error.value = null;

  try {
    await authStore.iniciarSesionConOtp(telefono.value.trim(), codigoOtp.value.trim(), recordarme.value);
    router.push('/');
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Código incorrecto o expirado.';
  } finally {
    cargando.value = false;
  }
};

const reiniciarPasoWhatsApp = () => {
  pasoWhatsApp.value = 'telefono';
  codigoOtp.value = '';
  codigoDevRecibido.value = null;
  error.value = null;
  mensajeExito.value = null;
};
</script>

<template>
  <div class="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center items-center p-4 selection:bg-indigo-500/20 selection:text-indigo-400">
    <!-- Contenedor Central -->
    <div class="w-full max-w-md space-y-5">
      <!-- Marca y Logotipo -->
      <div class="text-center space-y-1.5">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm mb-1">
          <Layers class="w-6 h-6" />
        </div>
        <h1 class="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {{ nombreEmpresa }} CRM
        </h1>
        <p class="text-xs text-zinc-500 dark:text-zinc-400">
          Plataforma Comercial B2B • {{ paisEmpresa }}
        </p>
      </div>

      <!-- Tarjeta Principal de Login -->
      <div class="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xl backdrop-blur-sm text-xs">
        <!-- Pestañas de Selección de Método -->
        <div class="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg mb-5 border border-zinc-200/80 dark:border-zinc-700/60">
          <button
            type="button"
            @click="cambiarMetodo('password')"
            :class="[
              'flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-medium transition duration-150',
              metodoAutenticacion === 'password'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200/60 dark:border-zinc-700/60'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            ]"
          >
            <Lock class="w-3.5 h-3.5" />
            <span>Contraseña</span>
          </button>
          <button
            type="button"
            @click="cambiarMetodo('whatsapp')"
            :class="[
              'flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-medium transition duration-150',
              metodoAutenticacion === 'whatsapp'
                ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-zinc-200/60 dark:border-zinc-700/60'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            ]"
          >
            <MessageSquare class="w-3.5 h-3.5 text-emerald-500" />
            <span>WhatsApp OTP</span>
          </button>
        </div>

        <!-- Encabezado de Estado de Seguridad -->
        <div class="mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span class="font-semibold text-zinc-800 dark:text-zinc-200">
            {{ metodoAutenticacion === 'password' ? 'Acceso con Credenciales' : 'Acceso Rápido por WhatsApp' }}
          </span>
          <span class="inline-flex items-center gap-1 font-mono text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
            <ShieldCheck class="w-3 h-3" />
            2FA / OTP
          </span>
        </div>

        <!-- Mensaje de Error de Validación -->
        <div v-if="error" class="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 rounded-md text-[11px] leading-relaxed flex items-center gap-2">
          <AlertCircle class="w-4 h-4 text-rose-500 shrink-0" />
          <span>{{ error }}</span>
        </div>

        <!-- Mensaje de Éxito / Notificación -->
        <div v-if="mensajeExito" class="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-md text-[11px] leading-relaxed flex items-center gap-2">
          <CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{{ mensajeExito }}</span>
        </div>

        <!-- FORMULARIO 1: CORREO Y CONTRASEÑA -->
        <form v-if="metodoAutenticacion === 'password'" @submit.prevent="manejarLoginPassword" class="space-y-4">
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

        <!-- FORMULARIO 2: LOGIN WHATSAPP OTP -->
        <div v-else class="space-y-4">
          <!-- Paso 1: Solicitar Código OTP -->
          <form v-if="pasoWhatsApp === 'telefono'" @submit.prevent="solicitarCodigoWhatsApp" class="space-y-4">
            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1.5">
                Número de Celular o Flota WhatsApp
              </label>
              <div class="relative">
                <Smartphone class="w-4 h-4 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  v-model="telefono"
                  type="tel"
                  required
                  placeholder="+1 (829) 708-4706"
                  class="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>
              <p class="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                Recibirás un código de 6 dígitos en tu chat de WhatsApp para validar tu identidad.
              </p>
            </div>

            <div class="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input
                  v-model="recordarme"
                  type="checkbox"
                  class="rounded bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-emerald-600 focus:ring-0 accent-emerald-600"
                />
                <span>Recordar este equipo</span>
              </label>
              <span class="text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">OTP Instantáneo</span>
            </div>

            <button
              type="submit"
              :disabled="cargando"
              class="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-md transition duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Loader2 v-if="cargando" class="w-4 h-4 animate-spin" />
              <span v-else>Enviar Código por WhatsApp</span>
            </button>
          </form>

          <!-- Paso 2: Verificar Código OTP -->
          <form v-else @submit.prevent="verificarCodigoWhatsApp" class="space-y-4">
            <div class="flex items-center justify-between">
              <button
                type="button"
                @click="reiniciarPasoWhatsApp"
                class="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
              >
                <ArrowLeft class="w-3.5 h-3.5" />
                <span>Cambiar número ({{ telefono }})</span>
              </button>
              <span class="text-[10px] text-zinc-400 font-mono">Expira en 5 min</span>
            </div>

            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1.5 text-center">
                Ingresa el Código de Verificación
              </label>
              <div class="relative">
                <KeyRound class="w-4 h-4 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  v-model="codigoOtp"
                  type="text"
                  maxlength="6"
                  required
                  placeholder="000000"
                  class="w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 text-center font-mono text-base tracking-widest focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>
              <div v-if="codigoDevRecibido" class="mt-2 text-center">
                <span class="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Código de prueba autocompletado: {{ codigoDevRecibido }}
                </span>
              </div>
            </div>

            <button
              type="submit"
              :disabled="cargando"
              class="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-md transition duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Loader2 v-if="cargando" class="w-4 h-4 animate-spin" />
              <span v-else>Verificar y Acceder</span>
            </button>

            <div class="text-center">
              <button
                type="button"
                @click="solicitarCodigoWhatsApp"
                :disabled="cargando"
                class="text-[11px] text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 underline transition"
              >
                ¿No recibiste el mensaje? Reenviar código
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Pie informativo -->
      <div class="text-center text-[11px] text-zinc-400 dark:text-zinc-500">
        Plataforma Comercial B2B • Acceso Protegido
      </div>
    </div>
  </div>
</template>
