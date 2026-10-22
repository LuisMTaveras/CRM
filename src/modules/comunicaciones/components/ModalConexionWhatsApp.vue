<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { whatsAppService } from '../services/whatsapp.service';
import { 
  X, 
  Smartphone, 
  QrCode, 
  RefreshCw, 
  LogOut, 
  Send, 
  ShieldCheck,
  Copy,
  Check,
  KeyRound
} from 'lucide-vue-next';
import { toastService } from '@/core/notifications/toast.service';

defineProps<{
  abierto: boolean;
}>();

const emit = defineEmits<{
  (e: 'cerrar'): void;
}>();

const metodoVinculacion = ref<'qr' | 'codigo'>('qr');
const telefonoPairing = ref('');
const codigoGenerado = ref('');
const solicitandoCodigo = ref(false);
const copiado = ref(false);

const numeroPrueba = ref('');
const mensajePrueba = ref('¡Hola! Este es un mensaje de prueba desde nuestro equipo comercial.');
const enviandoPrueba = ref(false);

const conectar = async (forzar = false) => {
  await whatsAppService.iniciarConexion(forzar);
};

const solicitarCodigo = async () => {
  if (!telefonoPairing.value.trim()) {
    toastService.advertencia('Ingresa el número de teléfono para generar el código.');
    return;
  }
  solicitandoCodigo.value = true;
  codigoGenerado.value = '';
  try {
    const cod = await whatsAppService.solicitarPairingCode(telefonoPairing.value);
    codigoGenerado.value = cod;
  } catch {
    // Error ya notificado en servicio
  } finally {
    solicitandoCodigo.value = false;
  }
};

const copiarCodigo = () => {
  if (!codigoGenerado.value) return;
  navigator.clipboard.writeText(codigoGenerado.value.replace('-', ''));
  copiado.value = true;
  toastService.exito('Código de vinculación copiado.');
  setTimeout(() => {
    copiado.value = false;
  }, 2500);
};

const desconectar = async () => {
  await whatsAppService.desconectar();
};

const enviarPrueba = async () => {
  if (!numeroPrueba.value) return;
  enviandoPrueba.value = true;
  try {
    await whatsAppService.enviarMensaje(numeroPrueba.value, mensajePrueba.value);
  } finally {
    enviandoPrueba.value = false;
  }
};

onMounted(() => {
  whatsAppService.consultarEstado();
});

onUnmounted(() => {
  whatsAppService.detenerMonitoreoQR();
});
</script>

<template>
  <div
    v-if="abierto"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-in fade-in"
    @click.self="emit('cerrar')"
  >
    <div class="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-xs">
      <!-- Cabecera -->
      <div class="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-950/60">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Smartphone class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Conexión WhatsApp Web (Bridge No Oficial)
            </h3>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
              Vincula tu teléfono para enviar cotizaciones PDF y mensajes automáticos
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="emit('cerrar')"
          class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Contenido Principal -->
      <div class="p-6 space-y-6">
        <!-- Estado de la Conexión -->
        <div
          class="p-4 rounded-xl border flex items-center justify-between"
          :class="whatsAppService.conectado.value 
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40' 
            : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'"
        >
          <div class="flex items-center gap-3">
            <span class="relative flex h-3 w-3">
              <span v-if="whatsAppService.conectado.value" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span
                class="relative inline-flex rounded-full h-3 w-3"
                :class="whatsAppService.conectado.value ? 'bg-emerald-500' : 'bg-zinc-400'"
              ></span>
            </span>
            <div>
              <div class="font-semibold text-zinc-900 dark:text-zinc-100">
                {{ whatsAppService.conectado.value ? 'WhatsApp Conectado' : 'Sin Conexión Activa' }}
              </div>
              <div class="text-[11px] text-zinc-500 dark:text-zinc-400">
                <span v-if="whatsAppService.conectado.value">
                  Vinculado a: <strong class="text-zinc-800 dark:text-zinc-200">{{ whatsAppService.usuarioConectado.value?.nombre }}</strong> ({{ whatsAppService.usuarioConectado.value?.id }})
                </span>
                <span v-else>
                  Inicia la sesión escaneando el código QR desde tu app móvil
                </span>
              </div>
            </div>
          </div>

          <button
            v-if="whatsAppService.conectado.value"
            type="button"
            @click="desconectar"
            :disabled="whatsAppService.cargando.value"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 text-[11px] font-semibold transition"
          >
            <LogOut class="w-3.5 h-3.5" />
            <span>Desvincular</span>
          </button>
        </div>

        <!-- Panel si está CONECTADO -->
        <div v-if="whatsAppService.conectado.value" class="space-y-4">
          <div class="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div class="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <ShieldCheck class="w-4 h-4 text-emerald-500" />
              <span>Prueba de Envío en Vivo</span>
            </div>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Prueba la conexión enviando un mensaje directo a tu propio número o al de un colaborador.
            </p>

            <div class="space-y-2">
              <input
                v-model="numeroPrueba"
                type="text"
                placeholder="Ejemplo: 809-555-1234 o +1 829 708 4706"
                class="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-emerald-500"
              />
              <textarea
                v-model="mensajePrueba"
                rows="2"
                class="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-emerald-500 resize-none"
              ></textarea>
            </div>

            <button
              type="button"
              @click="enviarPrueba"
              :disabled="enviandoPrueba || !numeroPrueba"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50"
            >
              <Send class="w-3.5 h-3.5" />
              <span>{{ enviandoPrueba ? 'Enviando...' : 'Enviar Mensaje de Prueba' }}</span>
            </button>
          </div>
        </div>

        <!-- Panel si está DESCONECTADO (Opciones de Vinculación) -->
        <div v-else class="space-y-4">
          <!-- Selector de Modo de Vinculación -->
          <div class="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            <button
              type="button"
              @click="metodoVinculacion = 'qr'"
              :class="[
                'flex-1 py-1.5 px-3 rounded-lg font-medium transition flex items-center justify-center gap-1.5 text-xs',
                metodoVinculacion === 'qr'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              ]"
            >
              <QrCode class="w-3.5 h-3.5" />
              <span>Escanear Código QR</span>
            </button>

            <button
              type="button"
              @click="metodoVinculacion = 'codigo'"
              :class="[
                'flex-1 py-1.5 px-3 rounded-lg font-medium transition flex items-center justify-center gap-1.5 text-xs',
                metodoVinculacion === 'codigo'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              ]"
            >
              <Smartphone class="w-3.5 h-3.5" />
              <span>Código de 8 Dígitos (Pairing)</span>
            </button>
          </div>

          <!-- MODO 1: Código QR -->
          <div
            v-if="metodoVinculacion === 'qr'"
            class="flex flex-col items-center justify-center p-6 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center animate-in fade-in"
          >
            <!-- Imagen del QR o Estado de Conexión -->
            <div v-if="whatsAppService.estado.value === 'conectando'" class="w-60 h-60 flex flex-col items-center justify-center border border-zinc-200 dark:border-zinc-800 rounded-xl mb-4 bg-white dark:bg-zinc-900 text-zinc-500">
              <RefreshCw class="w-8 h-8 mb-3 animate-spin text-emerald-500" />
              <span class="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Restaurando conexión...</span>
              <span class="text-[11px] text-zinc-400 mt-1">Sincronizando con WhatsApp Web</span>
            </div>

            <div v-else-if="whatsAppService.qrCode.value" class="p-3 bg-white rounded-xl shadow-md border border-zinc-200 dark:border-zinc-700 mb-4">
              <img
                :src="whatsAppService.qrCode.value"
                alt="Código QR de WhatsApp"
                class="w-60 h-60 object-contain"
              />
            </div>
            
            <div v-else class="w-60 h-60 flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl mb-4 text-zinc-400">
              <QrCode class="w-12 h-12 mb-2 stroke-1" />
              <span class="text-xs">
                {{ whatsAppService.tieneSesionGuardada.value ? 'Sesión guardada en el servidor' : 'Presiona "Generar Código QR" para iniciar' }}
              </span>
            </div>

            <!-- Instrucciones -->
            <div class="max-w-xs text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1 mb-4 text-left">
              <div class="font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Instrucciones de escaneo:</div>
              <ol class="list-decimal list-inside space-y-0.5">
                <li>Abre WhatsApp en tu teléfono móvil.</li>
                <li>Toca en <strong>Dispositivos vinculados</strong>.</li>
                <li>Selecciona <strong>Vincular un dispositivo</strong>.</li>
                <li>Apunta la cámara de tu teléfono a este código.</li>
              </ol>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="conectar(false)"
                :disabled="whatsAppService.cargando.value || whatsAppService.estado.value === 'conectando'"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50"
              >
                <RefreshCw :class="['w-3.5 h-3.5', whatsAppService.cargando.value || whatsAppService.estado.value === 'conectando' ? 'animate-spin' : '']" />
                <span v-if="whatsAppService.estado.value === 'conectando'">Conectando...</span>
                <span v-else-if="whatsAppService.qrCode.value">Regenerar Código QR</span>
                <span v-else-if="whatsAppService.tieneSesionGuardada.value">Restaurar Conexión</span>
                <span v-else>Generar Código QR</span>
              </button>
            </div>
          </div>

          <!-- MODO 2: Código de Emparejamiento por Teléfono (Pairing Code) -->
          <div
            v-else
            class="p-6 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4 animate-in fade-in"
          >
            <div>
              <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Número de Teléfono del Dispositivo WhatsApp *
              </label>
              <div class="flex gap-2">
                <input
                  v-model="telefonoPairing"
                  type="text"
                  placeholder="+1 (809) 000-0000"
                  class="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  @click="solicitarCodigo"
                  :disabled="solicitandoCodigo || !telefonoPairing"
                  class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50"
                >
                  <RefreshCw :class="['w-3.5 h-3.5', solicitandoCodigo ? 'animate-spin' : '']" />
                  <span>{{ solicitandoCodigo ? 'Generando...' : 'Obtener Código' }}</span>
                </button>
              </div>
            </div>

            <!-- Código Mostrado -->
            <div
              v-if="codigoGenerado || whatsAppService.codigoEmparejamiento.value"
              class="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-500/30 text-center space-y-2 shadow-sm"
            >
              <span class="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Tu Código de Vinculación de 8 Dígitos
              </span>
              <div class="text-3xl font-extrabold font-mono tracking-widest text-zinc-900 dark:text-white selection:bg-emerald-500/30">
                {{ codigoGenerado || whatsAppService.codigoEmparejamiento.value }}
              </div>
              <button
                type="button"
                @click="copiarCodigo"
                class="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs transition"
              >
                <Check v-if="copiado" class="w-3.5 h-3.5 text-emerald-500" />
                <Copy v-else class="w-3.5 h-3.5" />
                <span>{{ copiado ? 'Copiado al portapapeles' : 'Copiar Código' }}</span>
              </button>
            </div>

            <!-- Instrucciones de Uso -->
            <div class="p-3.5 rounded-lg bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1.5">
              <div class="font-semibold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
                <KeyRound class="w-3.5 h-3.5 text-emerald-500" />
                <span>Pasos en tu teléfono:</span>
              </div>
              <ol class="list-decimal list-inside space-y-1 text-zinc-500 dark:text-zinc-400 pl-1">
                <li>Abre WhatsApp en tu teléfono móvil.</li>
                <li>Ve a <strong>Ajustes / Menú</strong> > <strong>Dispositivos vinculados</strong>.</li>
                <li>Toca en <strong>Vincular un dispositivo</strong>.</li>
                <li>Toca la opción inferior <strong>"Vincular con el número de teléfono en su lugar"</strong>.</li>
                <li>Ingresa el código de 8 dígitos mostrado arriba.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <!-- Pie -->
      <div class="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between text-[11px] text-zinc-500">
        <span class="flex items-center gap-1">
          <ShieldCheck class="w-3.5 h-3.5 text-emerald-500" />
          Conexión segura local • Puerto 3002
        </span>
        <button
          type="button"
          @click="emit('cerrar')"
          class="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>
