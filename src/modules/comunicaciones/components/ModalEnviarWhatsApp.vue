<script setup lang="ts">
import { ref } from 'vue';
import { whatsAppService } from '../services/whatsapp.service';
import { timelineService } from '@/modules/clientes/services/timeline.service';
import { toastService } from '@/core/notifications/toast.service';
import { asistenteIaService, type IntencionComercial } from '../services/asistente-ia.service';
import type { Cliente } from '@/modules/clientes/types/cliente.types';
import { 
  X, 
  Send, 
  MessageSquare, 
  FileText, 
  ExternalLink,
  Sparkles 
} from 'lucide-vue-next';

const props = defineProps<{
  abierto: boolean;
  cliente: Cliente | null;
  cotizacionPdfBase64?: string;
  nombreArchivoPdf?: string;
}>();

const emit = defineEmits<{
  (e: 'cerrar'): void;
  (e: 'enviado'): void;
}>();

const telefono = ref(props.cliente?.telefono || '');
const adjuntarPdf = ref(Boolean(props.cotizacionPdfBase64));

const mensaje = ref(
  props.cliente 
    ? `Estimado equipo de ${props.cliente.nombre_comercial || props.cliente.razon_social},\n\nUn gusto saludarles. Les escribimos de DEVFORGE para dar seguimiento a sus requerimientos y compartirles nuestra propuesta comercial adjunta.\n\nQuedamos a su completa disposición.`
    : ''
);

const enviando = ref(false);

const plantillas = [
  {
    titulo: 'Envío de Cotización',
    texto: (nombre: string) => `Hola ${nombre}, un gusto saludarte. Adjunto te comparto la propuesta comercial detallada que preparamos para tu empresa. Cualquier inquietud estamos a tu orden.`,
  },
  {
    titulo: 'Seguimiento de Propuesta',
    texto: (nombre: string) => `Hola ${nombre}, espero que estés muy bien. Quería consultarles si tuvieron oportunidad de revisar la cotización que les enviamos recientemente. ¿Tienen alguna duda que podamos revisar juntos?`,
  },
  {
    titulo: 'Recordatorio de Reunión',
    texto: (nombre: string) => `Hola ${nombre}, te recordamos nuestra reunión pautada para el día de hoy para revisar la propuesta técnica. ¿Sigue en pie el horario? ¡Saludos!`,
  },
];

const aplicarPlantilla = (texto: string) => {
  const nombre = props.cliente?.nombre_comercial || props.cliente?.razon_social || 'Cliente';
  mensaje.value = texto.replace(/\$\{nombre\}/g, nombre);
};

const generarConIA = (intencion: IntencionComercial) => {
  const nombre = props.cliente?.nombre_comercial || props.cliente?.razon_social || 'Cliente';
  const texto = asistenteIaService.generarMensajeWhatsApp({
    intencion,
    clienteNombre: nombre,
    contactoNombre: props.cliente?.contactos?.[0]?.nombre,
  });
  mensaje.value = texto;
  toastService.exito('Mensaje redactado con el Asistente Comercial.');
};

const enviar = async () => {
  if (!telefono.value || !mensaje.value.trim()) {
    toastService.advertencia('Por favor completa el teléfono y el mensaje.');
    return;
  }

  enviando.value = true;
  try {
    let exito = false;

    if (adjuntarPdf.value && props.cotizacionPdfBase64) {
      exito = await whatsAppService.enviarPdf(
        telefono.value,
        props.cotizacionPdfBase64,
        props.nombreArchivoPdf || 'Cotizacion_Comercial.pdf',
        mensaje.value
      );
    } else {
      exito = await whatsAppService.enviarMensaje(telefono.value, mensaje.value);
    }

    if (exito && props.cliente) {
      // Registrar evento en la bitácora del cliente
      timelineService.registrarEvento({
        clienteId: props.cliente.id,
        tipo: 'whatsapp',
        titulo: adjuntarPdf.value ? 'Cotización enviada por WhatsApp' : 'Mensaje comercial por WhatsApp',
        descripcion: mensaje.value.slice(0, 150) + (mensaje.value.length > 150 ? '...' : ''),
        autor: 'Ejecutivo Comercial',
      });
    }

    emit('enviado');
    emit('cerrar');
  } catch (err: unknown) {
    toastService.error(err instanceof Error ? err.message : 'Error al despachar WhatsApp');
  } finally {
    enviando.value = false;
  }
};

const abrirEnlaceWeb = () => {
  whatsAppService.abrirConversacionNativa(telefono.value, mensaje.value);
};
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
            <MessageSquare class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Enviar Mensaje por WhatsApp
            </h3>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
              {{ cliente ? (cliente.nombre_comercial || cliente.razon_social) : 'Destinatario Comercial' }}
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

      <!-- Contenido -->
      <div class="p-5 space-y-4">
        <!-- Campo Teléfono -->
        <div>
          <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
            Número de Teléfono (WhatsApp)
          </label>
          <input
            v-model="telefono"
            type="text"
            placeholder="809-555-1234 o +1 829 708 4706"
            class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        <!-- Asistente Comercial IA -->
        <div class="p-2.5 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 border border-indigo-500/20">
          <div class="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px] mb-1.5">
            <Sparkles class="w-3.5 h-3.5 text-indigo-500" />
            <span>Asistente Comercial IA (Redacción B2B)</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button
              type="button"
              @click="generarConIA('seguimiento_cotizacion')"
              class="px-2 py-1 rounded-md bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-medium transition border border-indigo-500/20 shadow-xs"
            >
              Seguimiento de Propuesta
            </button>
            <button
              type="button"
              @click="generarConIA('confirmacion_reunion')"
              class="px-2 py-1 rounded-md bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-medium transition border border-indigo-500/20 shadow-xs"
            >
              Confirmar Reunión
            </button>
            <button
              type="button"
              @click="generarConIA('bienvenida_cierre')"
              class="px-2 py-1 rounded-md bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-medium transition border border-indigo-500/20 shadow-xs"
            >
              Bienvenida por Cierre
            </button>
            <button
              type="button"
              @click="generarConIA('recordatorio_pago')"
              class="px-2 py-1 rounded-md bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-medium transition border border-indigo-500/20 shadow-xs"
            >
              Aviso Administrativo
            </button>
          </div>
        </div>

        <!-- Plantillas Rápidas -->
        <div>
          <span class="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1.5 block font-medium">
            Plantillas Directas:
          </span>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="p in plantillas"
              :key="p.titulo"
              type="button"
              @click="aplicarPlantilla(p.texto(cliente?.nombre_comercial || cliente?.razon_social || 'Cliente'))"
              class="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800/60 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] transition border border-zinc-200 dark:border-zinc-700/60"
            >
              {{ p.titulo }}
            </button>
          </div>
        </div>

        <!-- Mensaje -->
        <div>
          <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
            Contenido del Mensaje
          </label>
          <textarea
            v-model="mensaje"
            rows="5"
            placeholder="Escribe el mensaje de seguimiento comercial..."
            class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
          ></textarea>
        </div>

        <!-- Adjunto PDF si está disponible -->
        <div
          v-if="cotizacionPdfBase64"
          class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 flex items-center justify-between"
        >
          <div class="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
            <FileText class="w-4 h-4 text-rose-500 shrink-0" />
            <div class="truncate">
              <span class="font-medium block truncate">{{ nombreArchivoPdf || 'Cotizacion.pdf' }}</span>
              <span class="text-[10px] text-zinc-500 font-mono">Documento PDF oficial listo para enviar</span>
            </div>
          </div>

          <label class="flex items-center gap-2 cursor-pointer select-none shrink-0">
            <input
              v-model="adjuntarPdf"
              type="checkbox"
              class="rounded text-emerald-600 focus:ring-0 accent-emerald-600"
            />
            <span class="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">Adjuntar</span>
          </label>
        </div>
      </div>

      <!-- Pie -->
      <div class="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between">
        <button
          type="button"
          @click="abrirEnlaceWeb"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs transition"
          title="Abrir conversación directamente en WhatsApp Web"
        >
          <ExternalLink class="w-3.5 h-3.5 text-zinc-400" />
          <span>Abrir wa.me</span>
        </button>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="emit('cerrar')"
            class="px-3.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            @click="enviar"
            :disabled="enviando || !telefono || !mensaje.trim()"
            class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50"
          >
            <Send class="w-3.5 h-3.5" />
            <span>{{ enviando ? 'Despachando...' : 'Enviar por WhatsApp' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
