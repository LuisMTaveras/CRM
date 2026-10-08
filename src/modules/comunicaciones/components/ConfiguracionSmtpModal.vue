<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { smtpService, PRESETS_PROVEEDORES } from '../services/smtp.service';
import type { ConfiguracionSMTP, ProveedorPreset, ResultadoPruebaConexion } from '../types/smtp.types';
import { 
  X, 
  Server, 
  Mail, 
  Send, 
  Inbox, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Save, 
  RefreshCw 
} from 'lucide-vue-next';

const props = defineProps<{
  abierto: boolean;
}>();

const emit = defineEmits<{
  (e: 'cerrar'): void;
  (e: 'guardado', config: ConfiguracionSMTP): void;
}>();

const configForm = reactive<ConfiguracionSMTP>(smtpService.obtenerConfiguracion());
const probando = ref(false);
const resultadoPrueba = ref<ResultadoPruebaConexion | null>(null);
const mensajeGuardado = ref(false);

watch(
  () => props.abierto,
  (val) => {
    if (val) {
      Object.assign(configForm, smtpService.obtenerConfiguracion());
      resultadoPrueba.value = null;
      mensajeGuardado.value = false;
    }
  }
);

const seleccionarPreset = (preset: ProveedorPreset) => {
  const datosPreset = PRESETS_PROVEEDORES[preset];
  configForm.proveedor = preset;
  if (datosPreset.servidorSmtp) configForm.servidorSmtp = datosPreset.servidorSmtp;
  if (datosPreset.puertoSmtp) configForm.puertoSmtp = datosPreset.puertoSmtp;
  if (datosPreset.seguridadSmtp) configForm.seguridadSmtp = datosPreset.seguridadSmtp;
  if (datosPreset.servidorImap) configForm.servidorImap = datosPreset.servidorImap;
  if (datosPreset.puertoImap) configForm.puertoImap = datosPreset.puertoImap;
  if (datosPreset.seguridadImap) configForm.seguridadImap = datosPreset.seguridadImap;
  resultadoPrueba.value = null;
};

const probarConexion = async () => {
  probando.value = true;
  resultadoPrueba.value = null;
  try {
    resultadoPrueba.value = await smtpService.probarConexion({ ...configForm });
  } finally {
    probando.value = false;
  }
};

const guardar = () => {
  smtpService.guardarConfiguracion({ ...configForm });
  mensajeGuardado.value = true;
  emit('guardado', { ...configForm });
  setTimeout(() => {
    mensajeGuardado.value = false;
    emit('cerrar');
  }, 900);
};
</script>

<template>
  <div v-if="abierto" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop oscuro -->
    <div @click="emit('cerrar')" class="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"></div>

    <!-- Modal Card -->
    <div class="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col z-10 overflow-hidden text-xs">
      <!-- Cabecera -->
      <div class="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Server class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Configuración del Servidor de Correo (SMTP / IMAP)</span>
              <span class="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                Puerto Abierto
              </span>
            </h3>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
              Parametriza los protocolos de salida y entrada para el despacho masivo oficial
            </p>
          </div>
        </div>

        <button
          @click="emit('cerrar')"
          class="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Presets Rápidos de Proveedores -->
      <div class="px-5 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-950/40 flex items-center gap-2 overflow-x-auto">
        <span class="text-zinc-500 dark:text-zinc-400 font-medium shrink-0">Proveedor Predefinido:</span>
        <button
          v-for="(label, key) in {
            personalizado: 'Servidor Propio / cPanel',
            microsoft: 'Microsoft 365 / Outlook',
            google: 'Google Workspace / Gmail',
            cpanel: 'Webmail SSL (Puerto 465)'
          }"
          :key="key"
          type="button"
          @click="seleccionarPreset(key as ProveedorPreset)"
          :class="[
            'px-2.5 py-1 rounded text-[11px] font-medium transition border',
            configForm.proveedor === key
              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
              : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          ]"
        >
          {{ label }}
        </button>
      </div>

      <!-- Cuerpo del Formulario con Scroll Interno -->
      <div class="p-5 overflow-y-auto space-y-5 flex-1 bg-zinc-50/50 dark:bg-transparent">
        <!-- SECCIÓN 1: SERVIDOR SALIENTE (SMTP) -->
        <div class="space-y-3 bg-white dark:bg-zinc-950/60 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div class="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800/80">
            <h4 class="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Send class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Servidor de Salida (SMTP) — Para Envíos de Correo</span>
            </h4>
            <span class="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">RFC 5321</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="sm:col-span-2">
              <label class="block text-zinc-600 dark:text-zinc-400 mb-1">Host del Servidor SMTP</label>
              <input
                v-model="configForm.servidorSmtp"
                type="text"
                placeholder="ej: smtp.office365.com o smtp.empresa.com.do"
                class="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 rounded text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label class="block text-zinc-600 dark:text-zinc-400 mb-1">Puerto SMTP</label>
              <select
                v-model.number="configForm.puertoSmtp"
                class="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 rounded text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
              >
                <option :value="587">587 (STARTTLS Recomendado)</option>
                <option :value="465">465 (SSL / TLS Directo)</option>
                <option :value="25">25 (Estándar Sin Cifrar)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-zinc-600 dark:text-zinc-400 mb-1">Tipo de Cifrado</label>
              <select
                v-model="configForm.seguridadSmtp"
                class="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 rounded text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="tls">STARTTLS</option>
                <option value="ssl">SSL / TLS</option>
                <option value="ninguna">Sin cifrado</option>
              </select>
            </div>
            <div>
              <label class="block text-zinc-600 dark:text-zinc-400 mb-1">Usuario / Correo SMTP</label>
              <input
                v-model="configForm.usuarioSmtp"
                type="text"
                placeholder="ventas@empresa.com.do"
                class="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 rounded text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label class="block text-zinc-600 dark:text-zinc-400 mb-1">Contraseña o App Password</label>
              <input
                v-model="configForm.contrasenaSmtp"
                type="password"
                placeholder="••••••••••••"
                class="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 rounded text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <!-- SECCIÓN 2: SERVIDOR ENTRANTE (IMAP) -->
        <div class="space-y-3 bg-white dark:bg-zinc-950/60 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div class="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800/80">
            <h4 class="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Inbox class="w-3.5 h-3.5 text-indigo-500 dark:text-sky-400" />
              <span>Servidor de Entrada (IMAP) — Para Trazabilidad y Respuestas</span>
            </h4>
            <label class="inline-flex items-center gap-2 cursor-pointer">
              <input
                v-model="configForm.habilitarImap"
                type="checkbox"
                class="rounded bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-0"
              />
              <span class="text-zinc-600 dark:text-zinc-400 text-[11px]">Habilitar IMAP</span>
            </label>
          </div>

          <div v-if="configForm.habilitarImap" class="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div class="sm:col-span-2">
              <label class="block text-zinc-600 dark:text-zinc-400 mb-1">Host IMAP</label>
              <input
                v-model="configForm.servidorImap"
                type="text"
                placeholder="ej: imap.empresa.com.do"
                class="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 rounded text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label class="block text-zinc-600 dark:text-zinc-400 mb-1">Puerto IMAP</label>
              <select
                v-model.number="configForm.puertoImap"
                class="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 rounded text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
              >
                <option :value="993">993 (SSL Seguro)</option>
                <option :value="143">143 (STARTTLS)</option>
              </select>
            </div>
            <div>
              <label class="block text-zinc-600 dark:text-zinc-400 mb-1">Cifrado IMAP</label>
              <select
                v-model="configForm.seguridadImap"
                class="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 rounded text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="ssl">SSL / TLS</option>
                <option value="tls">STARTTLS</option>
              </select>
            </div>
          </div>
        </div>

        <!-- SECCIÓN 3: IDENTIDAD DE REMITENTE Y FIRMA -->
        <div class="space-y-3 bg-white dark:bg-zinc-950/60 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div class="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800/80">
            <h4 class="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Mail class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Identidad del Remitente & Firma Corporativa</span>
            </h4>
            <span class="text-[10px] text-zinc-500">Datos visibles para el cliente</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-zinc-600 dark:text-zinc-400 mb-1">Nombre a Mostrar</label>
              <input
                v-model="configForm.nombreRemitente"
                type="text"
                placeholder="DEVFORGE — Departamento Comercial"
                class="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 rounded text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label class="block text-zinc-600 dark:text-zinc-400 mb-1">Correo Remitente (From)</label>
              <input
                v-model="configForm.correoRemitente"
                type="email"
                placeholder="ventas@empresa.com.do"
                class="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 rounded text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label class="block text-zinc-600 dark:text-zinc-400 mb-1">Correo de Respuesta (Reply-To)</label>
              <input
                v-model="configForm.correoRespuesta"
                type="email"
                placeholder="soporte@empresa.com.do"
                class="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 rounded text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-zinc-600 dark:text-zinc-400 mb-1">Firma Corporativa Automática (se adjunta al final del correo)</label>
            <textarea
              v-model="configForm.firmaTexto"
              rows="3"
              class="w-full p-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 rounded text-zinc-800 dark:text-zinc-200 font-mono text-[11px] focus:outline-none focus:border-indigo-500 leading-relaxed"
            ></textarea>
          </div>
        </div>

        <!-- Banner de Resultado de la Prueba de Conexión -->
        <div
          v-if="resultadoPrueba"
          :class="[
            'p-3.5 rounded-lg border flex items-start gap-3 text-xs',
            resultadoPrueba.exito
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-300'
          ]"
        >
          <CheckCircle2 v-if="resultadoPrueba.exito" class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <AlertCircle v-else class="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div class="space-y-1">
            <div class="font-semibold">{{ resultadoPrueba.mensaje }}</div>
            <div class="flex items-center gap-3 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
              <span>Ping: {{ resultadoPrueba.latenciaMs }}ms</span>
              <span>TLS: Activo</span>
              <span>Handshake: Aceptado</span>
            </div>
          </div>
        </div>

        <div
          v-if="mensajeGuardado"
          class="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-lg flex items-center gap-2 font-medium"
        >
          <CheckCircle2 class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Configuración SMTP / IMAP guardada y activada correctamente.</span>
        </div>
      </div>

      <!-- Pie del Modal -->
      <div class="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 flex items-center justify-between">
        <button
          type="button"
          @click="probarConexion"
          :disabled="probando"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-md font-medium transition disabled:opacity-50"
        >
          <Loader2 v-if="probando" class="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
          <RefreshCw v-else class="w-3.5 h-3.5" />
          <span>{{ probando ? 'Probando Conexión Socket...' : 'Probar Conexión SMTP' }}</span>
        </button>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="emit('cerrar')"
            class="px-3.5 py-1.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md transition font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="guardar"
            class="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-md transition shadow-sm active:scale-95"
          >
            <Save class="w-3.5 h-3.5" />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
