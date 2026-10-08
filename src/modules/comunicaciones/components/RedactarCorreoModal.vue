<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { webmailService } from '../services/webmail.service';
import { firmaPieService } from '../services/firma-pie.service';
import { 
  X, 
  Send, 
  Loader2, 
  AlertCircle,
  Eye,
  PenTool,
  ShieldCheck
} from 'lucide-vue-next';

const props = defineProps<{
  abierto: boolean;
  destinatarioInicial?: string;
  asuntoInicial?: string;
  cuerpoInicial?: string;
}>();

const emit = defineEmits<{
  (e: 'cerrar'): void;
  (e: 'enviado'): void;
}>();

const formulario = reactive({
  destinatario: '',
  cc: '',
  cco: '',
  asunto: '',
  cuerpo: '',
  incluirFirma: true,
  incluirPie: true,
});

const mostrarCc = ref(false);
const enviando = ref(false);
const errorEnvio = ref<string | null>(null);
const vistaPreviaActiva = ref(false);

const firmaActual = computed(() => firmaPieService.obtenerFirma());
const pieActual = computed(() => firmaPieService.obtenerPie());

const htmlVistaPrevia = computed(() => {
  let html = `<div style="font-family: Arial, sans-serif; font-size: 13px; color: #27272a; line-height: 1.6;">`;
  const parrafos = (formulario.cuerpo || 'Escriba el contenido del mensaje...')
    .split('\n')
    .map((l) => (l.trim() ? `<p>${l}</p>` : '<br>'))
    .join('\n');
  html += parrafos;

  if (formulario.incluirFirma && firmaActual.value.habilitada) {
    html += `<div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #e4e4e7;">${firmaPieService.generarHtmlFirma(firmaActual.value)}</div>`;
  }

  if (formulario.incluirPie && pieActual.value.habilitado) {
    html += `<div style="margin-top: 30px; padding-top: 12px; border-top: 1px dashed #d4d4d8; font-size: 11px; color: #71717a;">${firmaPieService.generarHtmlPie(pieActual.value)}</div>`;
  }
  html += `</div>`;
  return html;
});

watch(
  () => props.abierto,
  (val) => {
    if (val) {
      formulario.destinatario = props.destinatarioInicial || '';
      formulario.asunto = props.asuntoInicial || '';
      formulario.cuerpo = props.cuerpoInicial || '';
      formulario.cc = '';
      formulario.cco = '';
      mostrarCc.value = false;
      errorEnvio.value = null;
      vistaPreviaActiva.value = false;
    }
  }
);

const enviarCorreo = async () => {
  if (!formulario.destinatario.trim() || !formulario.asunto.trim() || !formulario.cuerpo.trim()) {
    errorEnvio.value = 'Por favor complete el destinatario, asunto y cuerpo del mensaje.';
    return;
  }

  enviando.value = true;
  errorEnvio.value = null;

  try {
    const res = await webmailService.redactarCorreo({
      destinatario: formulario.destinatario.trim(),
      cc: formulario.cc.trim() || undefined,
      cco: formulario.cco.trim() || undefined,
      asunto: formulario.asunto.trim(),
      cuerpo: formulario.cuerpo,
      incluirFirma: formulario.incluirFirma,
      incluirPie: formulario.incluirPie,
    });

    if (res.exito) {
      emit('enviado');
      emit('cerrar');
    } else {
      errorEnvio.value = res.error || 'No se pudo despachar el correo electrónico.';
    }
  } catch (err: any) {
    errorEnvio.value = err?.message || 'Error de comunicación con el servidor de correo.';
  } finally {
    enviando.value = false;
  }
};
</script>

<template>
  <div v-if="abierto" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop oscuro -->
    <div @click="emit('cerrar')" class="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"></div>

    <!-- Modal Card -->
    <div class="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col z-10 overflow-hidden text-xs">
      <!-- Cabecera -->
      <div class="px-6 py-4 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Send class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm sm:text-base font-bold text-zinc-100">
              Redactar Nuevo Correo
            </h3>
            <p class="text-[11px] text-zinc-400">
              Envío individual con firma profesional y pie de confidencialidad
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="emit('cerrar')"
          class="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Formulario Scrolleable -->
      <div class="flex-1 overflow-y-auto p-6 space-y-4">
        <!-- Error alert -->
        <div
          v-if="errorEnvio"
          class="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-300 text-xs flex items-center gap-2"
        >
          <AlertCircle class="w-4 h-4 text-red-400 shrink-0" />
          <span>{{ errorEnvio }}</span>
        </div>

        <!-- Destinatario y CC -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="w-20 text-zinc-400 font-medium shrink-0">Para:</span>
            <input
              type="email"
              v-model="formulario.destinatario"
              placeholder="cliente@empresa.com.do"
              class="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              @click="mostrarCc = !mostrarCc"
              class="px-2.5 py-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg text-[11px] font-medium transition"
            >
              {{ mostrarCc ? 'Ocultar CC' : 'CC / CCO' }}
            </button>
          </div>

          <div v-if="mostrarCc" class="space-y-2 pl-4 border-l-2 border-zinc-800">
            <div class="flex items-center gap-2">
              <span class="w-16 text-zinc-400 font-medium shrink-0">CC:</span>
              <input
                type="text"
                v-model="formulario.cc"
                placeholder="copia@empresa.com.do"
                class="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>
            <div class="flex items-center gap-2">
              <span class="w-16 text-zinc-400 font-medium shrink-0">CCO:</span>
              <input
                type="text"
                v-model="formulario.cco"
                placeholder="copiaoculta@empresa.com.do"
                class="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>
          </div>
        </div>

        <!-- Asunto -->
        <div class="flex items-center gap-2">
          <span class="w-20 text-zinc-400 font-medium shrink-0">Asunto:</span>
          <input
            type="text"
            v-model="formulario.asunto"
            placeholder="Propuesta Técnica y Seguimiento de Cotización"
            class="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <!-- Opciones de Inclusión -->
        <div class="flex flex-wrap items-center gap-4 py-2 px-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl text-[11px]">
          <label class="flex items-center gap-2 cursor-pointer text-zinc-300">
            <input
              type="checkbox"
              v-model="formulario.incluirFirma"
              class="rounded bg-zinc-900 border-zinc-700 text-emerald-600 focus:ring-0"
            />
            <span class="flex items-center gap-1.5">
              <PenTool class="w-3.5 h-3.5 text-emerald-400" />
              <span>Incluir firma corporativa</span>
            </span>
          </label>

          <label class="flex items-center gap-2 cursor-pointer text-zinc-300">
            <input
              type="checkbox"
              v-model="formulario.incluirPie"
              class="rounded bg-zinc-900 border-zinc-700 text-emerald-600 focus:ring-0"
            />
            <span class="flex items-center gap-1.5">
              <ShieldCheck class="w-3.5 h-3.5 text-emerald-400" />
              <span>Incluir pie institucional & aviso confidencialidad</span>
            </span>
          </label>

          <button
            type="button"
            @click="vistaPreviaActiva = !vistaPreviaActiva"
            class="ml-auto text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition"
          >
            <Eye class="w-3.5 h-3.5" />
            <span>{{ vistaPreviaActiva ? 'Ver Editor' : 'Vista Previa' }}</span>
          </button>
        </div>

        <!-- Editor o Vista Previa -->
        <div v-if="!vistaPreviaActiva">
          <textarea
            v-model="formulario.cuerpo"
            rows="10"
            placeholder="Estimado cliente:&#10;&#10;Por medio de la presente nos dirigimos a usted para dar seguimiento..."
            class="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
          ></textarea>
        </div>

        <div v-else class="p-5 bg-white text-zinc-900 rounded-xl border border-zinc-300 shadow-inner max-h-80 overflow-y-auto">
          <div v-html="htmlVistaPrevia"></div>
        </div>
      </div>

      <!-- Pie del modal -->
      <div class="px-6 py-3.5 border-t border-zinc-800 bg-zinc-950/90 flex items-center justify-between">
        <button
          type="button"
          @click="emit('cerrar')"
          class="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-medium transition"
        >
          Cancelar
        </button>

        <button
          type="button"
          @click="enviarCorreo"
          :disabled="enviando"
          class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition flex items-center gap-2 shadow-sm shadow-emerald-950/40 disabled:opacity-50"
        >
          <Loader2 v-if="enviando" class="w-4 h-4 animate-spin" />
          <Send v-else class="w-4 h-4" />
          <span>{{ enviando ? 'Enviando...' : 'Enviar Correo' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
