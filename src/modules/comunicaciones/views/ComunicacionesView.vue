<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { emailService } from '../services/email.service';
import { smtpService } from '../services/smtp.service';
import { clienteService } from '@/modules/clientes/services/cliente.service';
import type { Cliente } from '@/modules/clientes/types/cliente.types';
import type { PlantillaDocumento, RegistroEnvio } from '../types/comunicacion.types';
import type { ConfiguracionSMTP } from '../types/smtp.types';
import EnvioMasivoModal from '../components/EnvioMasivoModal.vue';
import CargarDocumentoModal from '../components/CargarDocumentoModal.vue';
import BandejaCorreo from '../components/BandejaCorreo.vue';
import { 
  Mail, 
  FileText, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Clock, 
  Sparkles, 
  Paperclip, 
  Users, 
  Server, 
  UploadCloud, 
  Trash2, 
  RefreshCw,
  Sliders,
  Inbox
} from 'lucide-vue-next';
import { formatDate } from '@/core/formatters/formatters';
import { FlickerlessSurface } from '@flickerless/vue';

// Pestaña principal activa: por defecto la bandeja de entrada
const pestanaActiva = ref<'bandeja' | 'despacho'>('bandeja');

const plantillas = ref<PlantillaDocumento[]>(emailService.obtenerPlantillas());
const historial = ref<RegistroEnvio[]>([]);
const todosLosClientes = ref<Cliente[]>([]);
const clientesParaEnvio = ref<Cliente[]>([]);
const smtpConfig = ref<ConfiguracionSMTP>(smtpService.obtenerConfiguracion());
const servidorEmailActivo = ref<boolean | null>(null);

const modalEnvioAbierto = ref(false);
const modalCargarDocumentoAbierto = ref(false);
const cargando = ref(true);

const verificarServidorEmail = async () => {
  servidorEmailActivo.value = await emailService.verificarServidor();
};

const cargarDatos = async () => {
  try {
    cargando.value = true;
    plantillas.value = emailService.obtenerPlantillas();
    historial.value = emailService.obtenerHistorialEnvios();
    smtpConfig.value = smtpService.obtenerConfiguracion();
    const resp = await clienteService.obtenerClientes({ pagina: 1, tamanoPagina: 100, busqueda: '' });
    todosLosClientes.value = resp?.datos || [];
  } catch (err) {
    console.error('Error al cargar datos de comunicaciones:', err);
  } finally {
    cargando.value = false;
  }
};

const plantillaSeleccionadaModal = ref<PlantillaDocumento | undefined>(undefined);

const abrirEnvioConPlantilla = async (plantilla?: PlantillaDocumento) => {
  if (todosLosClientes.value.length === 0) {
    try {
      const resp = await clienteService.obtenerClientes({ pagina: 1, tamanoPagina: 100, busqueda: '' });
      todosLosClientes.value = resp?.datos || [];
    } catch (err) {
      console.error('Error al precargar clientes para el envío masivo:', err);
    }
  }
  plantillaSeleccionadaModal.value = plantilla || plantillas.value[0];
  clientesParaEnvio.value = [...todosLosClientes.value];
  modalEnvioAbierto.value = true;
};

const onPlantillaCreada = (nuevaPlantilla: PlantillaDocumento, enviarInmediato: boolean) => {
  plantillas.value = emailService.obtenerPlantillas();
  if (enviarInmediato) {
    abrirEnvioConPlantilla(nuevaPlantilla);
  }
};

const eliminarPlantillaPersonalizada = (id: string) => {
  emailService.eliminarPlantilla(id);
  plantillas.value = emailService.obtenerPlantillas();
};

onMounted(() => {
  cargarDatos();
  verificarServidorEmail();
});
</script>

<template>
  <!-- Teleport del Encabezado hacia la Barra Superior Principal (HeaderBar) -->
    <Teleport to="#header-portal-left">
      <div class="flex items-center gap-3 min-w-0">
        <div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
          <Mail class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <h1 class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
              Comunicaciones & Centro de Correo
            </h1>
            <span
              class="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0"
              :class="servidorEmailActivo ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'"
            >
              <span
                :class="[
                  'w-1.5 h-1.5 rounded-full',
                  servidorEmailActivo ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-amber-500 dark:bg-amber-400'
                ]"
              ></span>
              {{ servidorEmailActivo ? 'Servidor Activo (SMTP/IMAP)' : 'Servidor en Espera' }}
            </span>
          </div>
          <p class="text-[11px] text-zinc-500 dark:text-zinc-400 truncate hidden md:block">
            Bandeja de entrada empresarial, respuestas con firma configurada y despacho masivo
          </p>
        </div>
      </div>
    </Teleport>

    <!-- Teleport de Acciones hacia la Barra Superior -->
    <Teleport to="#header-portal-right">
      <div class="flex items-center gap-2">
        <router-link
          to="/configuracion?tab=correo"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700/80 rounded-xl text-xs font-semibold shadow-sm transition"
          title="Abrir Configuración General de Correo, Servidores y Firma"
        >
          <Sliders class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span class="hidden sm:inline">Ajustes de Correo</span>
        </router-link>

        <button
          v-if="pestanaActiva === 'despacho'"
          type="button"
          @click="modalCargarDocumentoAbierto = true"
          class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700/80 rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <UploadCloud class="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
          <span>+ Cargar Word</span>
        </button>

        <button
          v-if="pestanaActiva === 'despacho'"
          type="button"
          @click="abrirEnvioConPlantilla()"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition shadow-sm shadow-emerald-950/20 active:scale-95"
        >
          <Send class="w-3.5 h-3.5" />
          <span>Lanzar Campaña</span>
        </button>
      </div>
    </Teleport>

  <div class="w-full space-y-4">
    <!-- Barra de Pestañas Principales (Segmented Control adaptativo) -->
    <div class="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
      <div class="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          @click="pestanaActiva = 'bandeja'"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition"
          :class="pestanaActiva === 'bandeja' 
            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700' 
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
        >
          <Inbox class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Bandeja de Correo (Webmail)</span>
        </button>

        <button
          type="button"
          @click="pestanaActiva = 'despacho'"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition"
          :class="pestanaActiva === 'despacho' 
            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700' 
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
        >
          <Send class="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>Despacho Masivo & Cotizaciones PDF</span>
        </button>
      </div>
    </div>

    <!-- PESTAÑA 1: BANDEJA DE CORREO (WEBMAIL CLIENT) -->
    <div v-if="pestanaActiva === 'bandeja'" class="w-full">
      <BandejaCorreo />
    </div>

    <!-- PESTAÑA 2: DESPACHO MASIVO & COTIZACIONES -->
    <div v-else class="space-y-5 w-full">
      <!-- Contenido Protegido con Flickerless Surface -->
      <FlickerlessSurface
        :loading="cargando"
        :delay-ms="180"
        :preserve-height="true"
        stream-color="#10b981"
        announce-text="Actualizando módulo de comunicaciones y plantillas..."
        class="w-full rounded-xl overflow-hidden"
      >
        <div class="space-y-5">
          <!-- Banner de Advertencia si servidor local está inactivo -->
        <div
          v-if="servidorEmailActivo === false"
          class="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3.5 flex items-start gap-3 text-xs"
        >
          <AlertCircle class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div class="space-y-1">
            <div class="font-semibold text-amber-300">Servidor de correo local no está activo</div>
            <div class="text-zinc-400">
              Para enviar correos reales por SMTP, debes iniciar el servidor en otra terminal:
              <code class="ml-1 px-2 py-0.5 bg-zinc-900 border border-zinc-700 rounded font-mono text-emerald-400">npm run email-server</code>
            </div>
            <div class="text-zinc-500">En modo offline, los envíos se registran en el historial pero no llegan al destinatario.</div>
          </div>
        </div>

        <!-- Indicadores de Rendimiento de Comunicaciones -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <div class="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2 text-xs font-medium">
              <span>Plantillas & Documentos</span>
              <div class="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/40 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                <FileText class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div>
              <div class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white font-mono tabular-nums mb-1">{{ plantillas.length }}</div>
              <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-400">Oficiales & subidos</span>
            </div>
          </div>

          <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <div class="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2 text-xs font-medium">
              <span>Correos Enviados</span>
              <div class="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <Send class="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white font-mono tabular-nums mb-1">{{ historial.length }}</div>
              <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400">Con PDF adjunto</span>
            </div>
          </div>

          <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <div class="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2 text-xs font-medium">
              <span>Destinatarios Cartera</span>
              <div class="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Users class="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white font-mono tabular-nums mb-1">{{ todosLosClientes.length }}</div>
              <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">Empresas B2B</span>
            </div>
          </div>

          <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <div class="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2 text-xs font-medium">
              <span>Servidor SMTP</span>
              <div class="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Server class="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold font-mono text-zinc-900 dark:text-white truncate mb-1" :title="smtpConfig.servidorSmtp">
                {{ smtpConfig.servidorSmtp }}
              </div>
              <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                Puerto {{ smtpConfig.puertoSmtp }}
              </span>
            </div>
          </div>

          <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <div class="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2 text-xs font-medium">
              <span>Remitente Oficial</span>
              <div class="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/40 flex items-center justify-center text-zinc-500 dark:text-zinc-300">
                <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div>
              <div class="text-xs font-medium text-zinc-900 dark:text-white truncate mb-1" :title="smtpConfig.correoRemitente">
                {{ smtpConfig.correoRemitente }}
              </div>
              <span class="text-[10px] text-zinc-500 block truncate">{{ smtpConfig.nombreRemitente }}</span>
            </div>
          </div>
        </div>

        <!-- Banner Drag & Drop de Documentos Word / PDF -->
        <div
          @click="modalCargarDocumentoAbierto = true"
          class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl p-4 transition cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
        >
          <div class="flex items-center gap-3.5">
            <div class="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              <UploadCloud class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                ¿Tienes un documento en Word (.docx) o contrato listo para enviar?
              </h2>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Súbelo directamente. El sistema extraerá el texto, identificará las variables y generará el PDF oficial automáticamente.
              </p>
            </div>
          </div>

          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-medium shrink-0 transition"
          >
            <UploadCloud class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Subir Documento Ahora</span>
          </button>
        </div>

        <!-- Catálogo de Plantillas -->
        <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3.5 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div class="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-200">
              <Sparkles class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Catálogo de Documentos Oficiales & Plantillas B2B</span>
              <span class="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                {{ plantillas.length }} disponibles
              </span>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="modalCargarDocumentoAbierto = true"
                class="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                + Cargar Nuevo Documento
              </button>
            </div>
          </div>

          <!-- Cuadrícula de Plantillas -->
          <div class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
            <div
              v-for="plt in plantillas"
              :key="plt.id"
              class="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition flex flex-col justify-between group"
            >
              <div>
                <div class="flex items-center justify-between text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mb-1.5 uppercase tracking-wide">
                  <span>{{ plt.categoria }}</span>
                  <span class="font-mono text-[10px] text-zinc-500 bg-white dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                    PDF A4
                  </span>
                </div>

                <h2 class="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-1 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                  {{ plt.nombre }}
                </h2>

                <p class="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3 line-clamp-3">
                  {{ plt.descripcion }}
                </p>
              </div>

              <div class="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                <span class="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                  <Paperclip class="w-3 h-3 text-zinc-400" />
                  Adjunto PDF
                </span>

                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    @click="eliminarPlantillaPersonalizada(plt.id)"
                    title="Eliminar plantilla"
                    class="p-1 text-zinc-400 hover:text-rose-500 transition"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    @click="abrirEnvioConPlantilla(plt)"
                    class="px-2.5 py-1 bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium transition"
                  >
                    Usar & Enviar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Historial de Envíos Recientes -->
        <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden text-xs shadow-sm">
          <div class="p-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200">
              <Clock class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Historial de Despachos Recientes</span>
              <span class="font-mono text-zinc-500 text-[11px]">({{ historial.length }} registros)</span>
            </div>

            <button
              type="button"
              @click="cargarDatos"
              class="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
              title="Actualizar historial"
            >
              <RefreshCw class="w-3.5 h-3.5" />
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 text-zinc-500 dark:text-zinc-400 font-medium">
                  <th class="py-2.5 px-3.5">Destinatario</th>
                  <th class="py-2.5 px-3.5">Asunto del Correo</th>
                  <th class="py-2.5 px-3.5">Adjunto PDF</th>
                  <th class="py-2.5 px-3.5">Remitente</th>
                  <th class="py-2.5 px-3.5">Fecha y Hora</th>
                  <th class="py-2.5 px-3.5 text-right">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                <tr v-if="historial.length === 0">
                  <td colspan="6" class="py-8 text-center text-zinc-500">
                    Aún no se han despachado correos masivos en esta sesión.
                  </td>
                </tr>
                <tr v-for="envio in historial" :key="envio.id" class="hover:bg-zinc-50 dark:hover:bg-zinc-800/20">
                  <td class="py-2.5 px-3.5">
                    <div class="font-medium text-zinc-800 dark:text-zinc-200">{{ envio.empresa }}</div>
                    <div class="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">{{ envio.emailDestino }}</div>
                  </td>
                  <td class="py-2.5 px-3.5 text-zinc-800 dark:text-zinc-300 font-medium">
                    {{ envio.asunto }}
                  </td>
                  <td class="py-2.5 px-3.5 font-mono text-[11px] text-emerald-400">
                    <div class="inline-flex items-center gap-1.5">
                      <Paperclip class="w-3.5 h-3.5 text-zinc-500" />
                      <span>{{ envio.nombreAdjunto }}</span>
                      <span class="text-zinc-500 text-[10px]">({{ envio.tamanoAdjuntoKb }} KB)</span>
                    </div>
                  </td>
                  <td class="py-2.5 px-3.5 text-zinc-400">
                    {{ envio.remitente }}
                  </td>
                  <td class="py-2.5 px-3.5 text-zinc-500 font-mono text-[11px]">
                    {{ formatDate(envio.fechaEnvio) }}
                  </td>
                  <td class="py-2.5 px-3.5 text-right">
                    <span
                      v-if="envio.estado === 'enviado'"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    >
                      <CheckCircle2 class="w-3 h-3" />
                      Entregado
                    </span>
                    <span
                      v-else-if="envio.estado === 'fallido'"
                      :title="envio.error"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    >
                      <AlertCircle class="w-3 h-3" />
                      Fallido
                    </span>
                    <span v-else class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                      Pendiente
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </FlickerlessSurface>
    </div>

    <!-- Modales -->
    <EnvioMasivoModal
      v-if="modalEnvioAbierto"
      :abierto="modalEnvioAbierto"
      :clientes="clientesParaEnvio"
      :plantilla-inicial="plantillaSeleccionadaModal"
      @cerrar="modalEnvioAbierto = false"
      @completado="cargarDatos"
    />

    <CargarDocumentoModal
      v-if="modalCargarDocumentoAbierto"
      :abierto="modalCargarDocumentoAbierto"
      @cerrar="modalCargarDocumentoAbierto = false"
      @plantilla-creada="onPlantillaCreada"
    />
  </div>
</template>
