<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { whatsAppService } from '../services/whatsapp.service';
import { 
  X, 
  Smartphone, 
  QrCode, 
  RefreshCw, 
  LogOut, 
  Send, 
  ShieldCheck
} from 'lucide-vue-next';

defineProps<{
  abierto: boolean;
}>();

const emit = defineEmits<{
  (e: 'cerrar'): void;
}>();

const numeroPrueba = ref('');
const mensajePrueba = ref('¡Hola! Este es un mensaje de prueba desde DEVFORGE CRM.');
const enviandoPrueba = ref(false);

const conectar = async (forzar = false) => {
  await whatsAppService.iniciarConexion(forzar);
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

        <!-- Panel si está DESCONECTADO (Generar o mostrar QR) -->
        <div v-else class="space-y-4">
          <div class="flex flex-col items-center justify-center p-6 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center">
            <!-- Imagen del QR -->
            <div v-if="whatsAppService.qrCode.value" class="p-3 bg-white rounded-xl shadow-md border border-zinc-200 dark:border-zinc-700 mb-4">
              <img
                :src="whatsAppService.qrCode.value"
                alt="Código QR de WhatsApp"
                class="w-64 h-64 object-contain"
              />
            </div>
            
            <div v-else class="w-64 h-64 flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl mb-4 text-zinc-400">
              <QrCode class="w-12 h-12 mb-2 stroke-1" />
              <span class="text-xs">Presiona "Generar Código QR" para iniciar</span>
            </div>

            <!-- Instrucciones -->
            <div class="max-w-xs text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1 mb-4 text-left">
              <div class="font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Instrucciones de vinculación:</div>
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
                @click="conectar(true)"
                :disabled="whatsAppService.cargando.value"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50"
              >
                <RefreshCw :class="['w-3.5 h-3.5', whatsAppService.cargando.value ? 'animate-spin' : '']" />
                <span>{{ whatsAppService.qrCode.value ? 'Regenerar Código QR' : 'Generar Código QR' }}</span>
              </button>
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
