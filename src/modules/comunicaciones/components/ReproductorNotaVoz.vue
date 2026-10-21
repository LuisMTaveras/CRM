<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { Play, Pause, Mic, Headphones, Download } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    src: string;
    duracionSegundos?: number;
    esNotaVoz?: boolean;
    nombreArchivo?: string;
    tamano?: string;
    deMi?: boolean;
  }>(),
  {
    duracionSegundos: 0,
    esNotaVoz: true,
    nombreArchivo: 'nota_de_voz.ogg',
    tamano: '',
    deMi: false,
  }
);

// Coordinador global para evitar que se reproduzcan múltiples audios simultáneamente
const audioGlobalActivo = (window as unknown as { __audioWhatsappActivo?: HTMLAudioElement | null });

const audioRef = ref<HTMLAudioElement | null>(null);
const reproduciendo = ref(false);
const tiempoActual = ref(0);
const duracion = ref(props.duracionSegundos || 0);
const velocidad = ref<number>(1);
const cargado = ref(false);

const velocidadesDisponibles = [1, 1.5, 2];

// Alturas pseudo-aleatorias pero consistentes para las barras de onda de audio
const barrasOnda = [
  35, 60, 45, 80, 55, 90, 70, 100, 85, 60,
  75, 95, 50, 85, 65, 40, 70, 85, 60, 90,
  75, 50, 80, 65, 45, 70, 55, 40
];

const progresoPorcentaje = computed(() => {
  if (!duracion.value || duracion.value <= 0) return 0;
  return Math.min(100, Math.max(0, (tiempoActual.value / duracion.value) * 100));
});

const formatearTiempo = (segundosTotales: number): string => {
  if (isNaN(segundosTotales) || segundosTotales < 0) return '0:00';
  const mins = Math.floor(segundosTotales / 60);
  const secs = Math.floor(segundosTotales % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const alternarReproduccion = async () => {
  if (!audioRef.value) return;

  if (reproduciendo.value) {
    audioRef.value.pause();
    reproduciendo.value = false;
  } else {
    // Pausar cualquier otro audio que esté sonando en el CRM
    if (audioGlobalActivo.__audioWhatsappActivo && audioGlobalActivo.__audioWhatsappActivo !== audioRef.value) {
      audioGlobalActivo.__audioWhatsappActivo.pause();
    }
    audioGlobalActivo.__audioWhatsappActivo = audioRef.value;

    try {
      await audioRef.value.play();
      reproduciendo.value = true;
    } catch (err) {
      console.warn('[ReproductorNotaVoz] Error al reproducir audio:', err);
      reproduciendo.value = false;
    }
  }
};

const cambiarVelocidad = () => {
  const indiceActual = velocidadesDisponibles.indexOf(velocidad.value);
  const siguienteIndice = (indiceActual + 1) % velocidadesDisponibles.length;
  velocidad.value = velocidadesDisponibles[siguienteIndice];
  if (audioRef.value) {
    audioRef.value.playbackRate = velocidad.value;
  }
};

const saltarAPosicion = (indiceBarra: number) => {
  if (!audioRef.value || !duracion.value) return;
  const porcentaje = indiceBarra / barrasOnda.length;
  const nuevoTiempo = porcentaje * duracion.value;
  audioRef.value.currentTime = nuevoTiempo;
  tiempoActual.value = nuevoTiempo;
};

const saltarPorBarraContenedor = (evento: MouseEvent) => {
  const contenedor = evento.currentTarget as HTMLElement;
  if (!contenedor || !audioRef.value || !duracion.value) return;
  const rect = contenedor.getBoundingClientRect();
  const clickX = evento.clientX - rect.left;
  const porcentaje = Math.max(0, Math.min(1, clickX / rect.width));
  const nuevoTiempo = porcentaje * duracion.value;
  audioRef.value.currentTime = nuevoTiempo;
  tiempoActual.value = nuevoTiempo;
};

const alCargarMetadata = () => {
  if (audioRef.value && audioRef.value.duration && !isNaN(audioRef.value.duration) && isFinite(audioRef.value.duration)) {
    duracion.value = Math.round(audioRef.value.duration);
  }
  cargado.value = true;
};

const alActualizarTiempo = () => {
  if (audioRef.value) {
    tiempoActual.value = audioRef.value.currentTime;
  }
};

const alFinalizar = () => {
  reproduciendo.value = false;
  tiempoActual.value = 0;
  if (audioRef.value) {
    audioRef.value.currentTime = 0;
  }
};

onMounted(() => {
  if (audioRef.value) {
    audioRef.value.playbackRate = velocidad.value;
  }
});

onUnmounted(() => {
  if (audioRef.value) {
    audioRef.value.pause();
    if (audioGlobalActivo.__audioWhatsappActivo === audioRef.value) {
      audioGlobalActivo.__audioWhatsappActivo = null;
    }
  }
});

watch(
  () => props.src,
  () => {
    reproduciendo.value = false;
    tiempoActual.value = 0;
    cargado.value = false;
  }
);
</script>

<template>
  <div
    class="w-full min-w-[240px] sm:min-w-[280px] p-2.5 rounded-xl flex flex-col gap-2 transition select-none"
    :class="[
      deMi
        ? 'bg-emerald-700/60 dark:bg-emerald-800/60 text-white'
        : 'bg-zinc-100 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-800'
    ]"
  >
    <!-- Elemento de audio HTML5 nativo oculto -->
    <audio
      ref="audioRef"
      :src="src"
      preload="metadata"
      @loadedmetadata="alCargarMetadata"
      @timeupdate="alActualizarTiempo"
      @ended="alFinalizar"
      @pause="reproduciendo = false"
      @play="reproduciendo = true"
    ></audio>

    <div class="flex items-center gap-3">
      <!-- Botón de Play / Pausa con avatar indicativo -->
      <div class="relative shrink-0">
        <button
          type="button"
          @click="alternarReproduccion"
          class="w-10 h-10 rounded-full flex items-center justify-center shadow-md transition transform active:scale-95 focus:outline-none"
          :class="[
            deMi
              ? 'bg-white text-emerald-800 hover:bg-emerald-50'
              : 'bg-emerald-600 text-white hover:bg-emerald-500'
          ]"
          :title="reproduciendo ? 'Pausar audio' : 'Reproducir nota de voz'"
        >
          <Pause v-if="reproduciendo" class="w-4 h-4 fill-current" />
          <Play v-else class="w-4 h-4 fill-current ml-0.5" />
        </button>

        <!-- Micro-indicador de nota de voz vs archivo -->
        <span
          class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] shadow"
          :class="[
            deMi
              ? 'bg-emerald-900 text-emerald-300 border border-emerald-600'
              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700'
          ]"
          :title="esNotaVoz ? 'Nota de voz grabada' : 'Archivo de audio'"
        >
          <Mic v-if="esNotaVoz" class="w-2.5 h-2.5" />
          <Headphones v-else class="w-2.5 h-2.5" />
        </span>
      </div>

      <!-- Área de Forma de Onda Visual e Interactiva -->
      <div class="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
        <!-- Visualizador de Barras de Frecuencia tipo WhatsApp -->
        <div
          class="h-7 flex items-center gap-[3px] cursor-pointer py-1 group"
          @click="saltarPorBarraContenedor"
          title="Toca para adelantar o retroceder"
        >
          <div
            v-for="(altura, idx) in barrasOnda"
            :key="idx"
            @click.stop="saltarAPosicion(idx)"
            class="flex-1 rounded-full transition-all duration-75 group-hover:opacity-90"
            :style="{ height: `${Math.max(15, altura)}%` }"
            :class="[
              (idx / barrasOnda.length) * 100 <= progresoPorcentaje
                ? (deMi ? 'bg-white' : 'bg-emerald-600 dark:bg-emerald-400')
                : (deMi ? 'bg-white/35' : 'bg-zinc-300 dark:bg-zinc-700')
            ]"
          ></div>
        </div>

        <!-- Tiempos y Controles de Reproducción -->
        <div
          class="flex items-center justify-between text-[10px] font-mono leading-none"
          :class="deMi ? 'text-white/80' : 'text-zinc-500 dark:text-zinc-400'"
        >
          <span>
            {{ reproduciendo || tiempoActual > 0 ? formatearTiempo(tiempoActual) : formatearTiempo(duracion) }}
          </span>

          <div class="flex items-center gap-2">
            <!-- Selector de velocidad 1x / 1.5x / 2x -->
            <button
              type="button"
              @click.stop="cambiarVelocidad"
              class="px-1.5 py-0.5 rounded font-bold transition hover:opacity-100"
              :class="[
                deMi
                  ? 'bg-white/20 hover:bg-white/30 text-white'
                  : 'bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
              ]"
              title="Cambiar velocidad de reproducción"
            >
              {{ velocidad }}x
            </button>

            <!-- Descargar audio -->
            <a
              :href="src"
              :download="nombreArchivo || 'nota_de_voz.ogg'"
              target="_blank"
              rel="noopener noreferrer"
              class="p-0.5 rounded transition hover:opacity-100"
              :class="deMi ? 'text-white/80 hover:text-white' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'"
              title="Descargar nota de voz"
              @click.stop
            >
              <Download class="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
