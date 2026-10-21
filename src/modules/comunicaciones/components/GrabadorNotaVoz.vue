<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Trash2, Send, AlertCircle } from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'enviar', archivo: File): void;
  (e: 'cancelar'): void;
}>();

const grabando = ref(false);
const errorMicrofono = ref<string | null>(null);
const segundosTranscurridos = ref(0);
const barrasAmplitud = ref<number[]>([25, 45, 60, 30, 80, 50, 70, 90, 40, 65, 30, 75, 55, 35]);

let mediaRecorder: MediaRecorder | null = null;
let mediaStream: MediaStream | null = null;
let audioChunks: Blob[] = [];
let intervaloSegundos: ReturnType<typeof setInterval> | null = null;
let animacionFrameId: number | null = null;
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;

function formatearTiempo(totalSegundos: number): string {
  const min = Math.floor(totalSegundos / 60);
  const sec = totalSegundos % 60;
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

async function iniciarGrabacion() {
  errorMicrofono.value = null;
  audioChunks = [];
  segundosTranscurridos.value = 0;

  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Tu navegador no soporta grabación directa de audio.');
    }

    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Detectar mejor mimeType soportado
    let mimeType = 'audio/webm;codecs=opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else {
        mimeType = '';
      }
    }

    mediaRecorder = mimeType ? new MediaRecorder(mediaStream, { mimeType }) : new MediaRecorder(mediaStream);

    mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    // Analizador de frecuencia de audio en tiempo real para las barras
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioContext = new AudioCtx();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        const source = audioContext.createMediaStreamSource(mediaStream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const actualizarVisualizador = () => {
          if (!grabando.value || !analyser) return;
          analyser.getByteFrequencyData(dataArray);

          const nuevas: number[] = [];
          const paso = Math.max(1, Math.floor(dataArray.length / 14));
          for (let i = 0; i < 14; i++) {
            const val = dataArray[i * paso] || 0;
            // Escalar entre 15% y 100% de altura
            const altura = Math.min(100, Math.max(15, Math.round((val / 255) * 100)));
            nuevas.push(altura);
          }
          barrasAmplitud.value = nuevas;
          animacionFrameId = requestAnimationFrame(actualizarVisualizador);
        };
        animacionFrameId = requestAnimationFrame(actualizarVisualizador);
      }
    } catch {
      // Si AudioContext falla, el temporizador mantendrá el feedback visual
    }

    mediaRecorder.start(250);
    grabando.value = true;

    intervaloSegundos = setInterval(() => {
      segundosTranscurridos.value++;
    }, 1000);
  } catch (err: unknown) {
    console.error('Error accediendo al micrófono:', err);
    errorMicrofono.value =
      err instanceof Error && err.name === 'NotAllowedError'
        ? 'Permiso de micrófono denegado. Permite el acceso para grabar notas de voz.'
        : 'No se detectó un micrófono disponible en este equipo.';
    grabando.value = false;
  }
}

function detenerStreams() {
  if (intervaloSegundos) {
    clearInterval(intervaloSegundos);
    intervaloSegundos = null;
  }
  if (animacionFrameId) {
    cancelAnimationFrame(animacionFrameId);
    animacionFrameId = null;
  }
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close().catch(() => {});
    audioContext = null;
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }
}

function cancelarGrabacion() {
  grabando.value = false;
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  detenerStreams();
  audioChunks = [];
  emit('cancelar');
}

function enviarNotaVoz() {
  if (!mediaRecorder || mediaRecorder.state === 'inactive') {
    cancelarGrabacion();
    return;
  }

  mediaRecorder.onstop = () => {
    detenerStreams();
    const mimeReal = mediaRecorder?.mimeType || 'audio/ogg; codecs=opus';
    const ext = mimeReal.includes('webm') ? 'webm' : (mimeReal.includes('mp4') ? 'mp4' : 'ogg');
    const audioBlob = new Blob(audioChunks, { type: mimeReal });
    const archivo = new File([audioBlob], `nota_voz_${Date.now()}.${ext}`, {
      type: mimeReal,
    });

    grabando.value = false;
    emit('enviar', archivo);
  };

  mediaRecorder.stop();
}

onMounted(() => {
  iniciarGrabacion();
});

onUnmounted(() => {
  cancelarGrabacion();
});
</script>

<template>
  <div
    class="flex items-center gap-3 w-full px-3 py-2 bg-surface border border-emerald-500/30 dark:border-emerald-500/20 rounded-xl shadow-sm transition-all"
  >
    <!-- Alerta de permiso o error -->
    <template v-if="errorMicrofono">
      <div class="flex items-center gap-2 flex-1 text-xs text-rose-600 dark:text-rose-400">
        <AlertCircle class="w-4 h-4 shrink-0" />
        <span class="truncate">{{ errorMicrofono }}</span>
      </div>
      <button
        type="button"
        class="px-3 py-1.5 text-xs font-medium rounded-lg text-muted-foreground hover:bg-surface-elevated transition-colors"
        @click="cancelarGrabacion"
      >
        Cerrar
      </button>
    </template>

    <!-- Barra de grabación activa -->
    <template v-else>
      <!-- Indicador rojo pulsante -->
      <div class="flex items-center gap-2 shrink-0">
        <span class="relative flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
        </span>
        <span class="text-xs font-mono font-medium text-foreground tracking-wider">
          {{ formatearTiempo(segundosTranscurridos) }}
        </span>
      </div>

      <!-- Ondas animadas de frecuencia en vivo -->
      <div class="flex-1 flex items-center justify-center gap-1 h-6 px-2 overflow-hidden">
        <span
          v-for="(altura, idx) in barrasAmplitud"
          :key="idx"
          class="w-1 bg-emerald-500/70 dark:bg-emerald-400 rounded-full transition-all duration-75"
          :style="{ height: `${altura}%` }"
        ></span>
      </div>

      <!-- Acciones: Descartar / Cancelar -->
      <div class="flex items-center gap-1 shrink-0">
        <button
          type="button"
          class="p-2 rounded-lg text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Descartar nota de voz"
          @click="cancelarGrabacion"
        >
          <Trash2 class="w-4 h-4" />
        </button>

        <!-- Botón Enviar Audio -->
        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-sm transition-colors"
          title="Enviar nota de voz ahora"
          @click="enviarNotaVoz"
        >
          <Send class="w-3.5 h-3.5" />
          <span>Enviar audio</span>
        </button>
      </div>
    </template>
  </div>
</template>
