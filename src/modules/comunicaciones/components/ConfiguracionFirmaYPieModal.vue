<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { firmaPieService, FIRMA_POR_DEFECTO, PIE_POR_DEFECTO } from '../services/firma-pie.service';
import { smtpService, PRESETS_PROVEEDORES } from '../services/smtp.service';
import { webmailService } from '../services/webmail.service';
import type { ConfiguracionFirma, ConfiguracionPiePagina } from '../types/webmail.types';
import type { ConfiguracionSMTP, ProveedorPreset, ResultadoPruebaConexion } from '../types/smtp.types';
import { 
  X, 
  PenTool, 
  FileText, 
  Server, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Mail, 
  ShieldCheck, 
  Eye
} from 'lucide-vue-next';

const props = defineProps<{
  abierto: boolean;
}>();

const emit = defineEmits<{
  (e: 'cerrar'): void;
  (e: 'guardado'): void;
}>();

const tabActiva = ref<'firma' | 'pie' | 'servidores'>('firma');

// Estados reactivos de formularios
const formFirma = reactive<ConfiguracionFirma>({ ...FIRMA_POR_DEFECTO });
const formPie = reactive<ConfiguracionPiePagina>({ ...PIE_POR_DEFECTO });
const formSmtp = reactive<ConfiguracionSMTP>(smtpService.obtenerConfiguracion());

// Pruebas de conexión
const probandoSmtp = ref(false);
const probandoImap = ref(false);
const resultadoSmtp = ref<ResultadoPruebaConexion | null>(null);
const resultadoImap = ref<{ exito: boolean; mensaje: string; latenciaMs?: number } | null>(null);
const mensajeGuardado = ref(false);

watch(
  () => props.abierto,
  (val) => {
    if (val) {
      Object.assign(formFirma, firmaPieService.obtenerFirma());
      Object.assign(formPie, firmaPieService.obtenerPie());
      Object.assign(formSmtp, smtpService.obtenerConfiguracion());
      resultadoSmtp.value = null;
      resultadoImap.value = null;
      mensajeGuardado.value = false;
    }
  }
);

// Generación de previews HTML
const previewFirmaHtml = computed(() => firmaPieService.generarHtmlFirma(formFirma));
const previewPieHtml = computed(() => firmaPieService.generarHtmlPie(formPie));

const aplicarPresetProveedor = (preset: ProveedorPreset) => {
  const datosPreset = PRESETS_PROVEEDORES[preset];
  formSmtp.proveedor = preset;
  if (datosPreset.servidorSmtp) formSmtp.servidorSmtp = datosPreset.servidorSmtp;
  if (datosPreset.puertoSmtp) formSmtp.puertoSmtp = datosPreset.puertoSmtp;
  if (datosPreset.seguridadSmtp) formSmtp.seguridadSmtp = datosPreset.seguridadSmtp;
  if (datosPreset.servidorImap) formSmtp.servidorImap = datosPreset.servidorImap;
  if (datosPreset.puertoImap) formSmtp.puertoImap = datosPreset.puertoImap;
  if (datosPreset.seguridadImap) formSmtp.seguridadImap = datosPreset.seguridadImap;
  resultadoSmtp.value = null;
  resultadoImap.value = null;
};

const probarConexionSmtp = async () => {
  probandoSmtp.value = true;
  resultadoSmtp.value = null;
  try {
    resultadoSmtp.value = await smtpService.probarConexion({ ...formSmtp });
  } finally {
    probandoSmtp.value = false;
  }
};

const probarConexionImap = async () => {
  probandoImap.value = true;
  resultadoImap.value = null;
  try {
    const res = await webmailService.probarImap({
      servidorImap: formSmtp.servidorImap,
      puertoImap: formSmtp.puertoImap,
      seguridadImap: formSmtp.seguridadImap,
      usuarioImap: formSmtp.usuarioImap,
      contrasenaImap: formSmtp.contrasenaImap,
    });
    resultadoImap.value = res;
  } finally {
    probandoImap.value = false;
  }
};

const guardarTodo = () => {
  firmaPieService.guardarFirma({ ...formFirma });
  firmaPieService.guardarPie({ ...formPie });
  smtpService.guardarConfiguracion({ ...formSmtp });

  mensajeGuardado.value = true;
  emit('guardado');
  setTimeout(() => {
    mensajeGuardado.value = false;
    emit('cerrar');
  }, 850);
};
</script>

<template>
  <div v-if="abierto" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop oscuro -->
    <div @click="emit('cerrar')" class="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"></div>

    <!-- Modal Card -->
    <div class="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col z-10 overflow-hidden text-xs">
      <!-- Cabecera -->
      <div class="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Mail class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Configuración de Correo, Firma & Identidad</span>
              <span class="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                Personalizado
              </span>
            </h3>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
              Parametriza tus cuentas salientes/entrantes, firma profesional y pie legal institucional
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="emit('cerrar')"
          class="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Barra de Pestañas -->
      <div class="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 px-6 pt-2 gap-2">
        <button
          type="button"
          @click="tabActiva = 'firma'"
          class="flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 text-xs transition-colors"
          :class="tabActiva === 'firma' ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
        >
          <PenTool class="w-3.5 h-3.5" />
          <span>Firma de Correo</span>
        </button>

        <button
          type="button"
          @click="tabActiva = 'pie'"
          class="flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 text-xs transition-colors"
          :class="tabActiva === 'pie' ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
        >
          <FileText class="w-3.5 h-3.5" />
          <span>Pie de Página Legal</span>
        </button>

        <button
          type="button"
          @click="tabActiva = 'servidores'"
          class="flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 text-xs transition-colors"
          :class="tabActiva === 'servidores' ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
        >
          <Server class="w-3.5 h-3.5" />
          <span>Conexión de Servidor (SMTP / IMAP)</span>
        </button>
      </div>

      <!-- Cuerpo Scrolleable -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- PESTAÑA 1: FIRMA DE CORREO -->
        <div v-if="tabActiva === 'firma'" class="space-y-6">
          <div class="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <div class="space-y-0.5">
              <div class="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <span>Habilitar Firma Automática</span>
                <span v-if="formFirma.habilitada" class="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-medium">Activa</span>
              </div>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
                Se inyectará al final de cada respuesta o nuevo correo enviado desde el CRM
              </p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="formFirma.habilitada" class="sr-only peer" />
              <div class="w-9 h-5 bg-zinc-300 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Nombre Completo</label>
              <input
                type="text"
                v-model="formFirma.nombreRemitente"
                placeholder="Ej: Lic. Camila Morales"
                class="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 placeholder-zinc-400 dark:placeholder-zinc-600"
              />
            </div>

            <div>
              <label class="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Cargo o Posición</label>
              <input
                type="text"
                v-model="formFirma.cargo"
                placeholder="Ej: Directora Comercial B2B"
                class="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 placeholder-zinc-400 dark:placeholder-zinc-600"
              />
            </div>

            <div>
              <label class="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Empresa</label>
              <input
                type="text"
                v-model="formFirma.empresa"
                placeholder="Ej: DEVFORGE Dominicana SRL"
                class="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 placeholder-zinc-400 dark:placeholder-zinc-600"
              />
            </div>

            <div>
              <label class="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Departamento o División</label>
              <input
                type="text"
                v-model="formFirma.departamento"
                placeholder="Ej: División Comercial & Grandes Cuentas"
                class="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 placeholder-zinc-400 dark:placeholder-zinc-600"
              />
            </div>

            <div>
              <label class="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Teléfono Fijo / Central</label>
              <input
                type="text"
                v-model="formFirma.telefono"
                placeholder="+1 (809) 555-0100"
                class="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 placeholder-zinc-400 dark:placeholder-zinc-600"
              />
            </div>

            <div>
              <label class="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Celular / WhatsApp Corporativo</label>
              <input
                type="text"
                v-model="formFirma.celular"
                placeholder="+1 (829) 555-0199"
                class="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 placeholder-zinc-400 dark:placeholder-zinc-600"
              />
            </div>

            <div>
              <label class="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Sitio Web Corporativo</label>
              <input
                type="text"
                v-model="formFirma.sitioWeb"
                placeholder="www.devforge.com.do"
                class="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 placeholder-zinc-400 dark:placeholder-zinc-600"
              />
            </div>

            <div>
              <label class="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Color de Barra de Acento</label>
              <div class="flex items-center gap-3">
                <input
                  type="color"
                  v-model="formFirma.colorAcento"
                  class="w-10 h-9 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded cursor-pointer p-0.5"
                />
                <span class="font-mono text-zinc-700 dark:text-zinc-300 text-xs">{{ formFirma.colorAcento }}</span>
              </div>
            </div>

            <div class="md:col-span-2">
              <label class="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Lema o Frase Personalizada</label>
              <input
                type="text"
                v-model="formFirma.textoPersonalizado"
                placeholder="Comprometidos con la excelencia operativa y transformación digital de su empresa."
                class="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 placeholder-zinc-400 dark:placeholder-zinc-600"
              />
            </div>
          </div>

          <!-- Live Preview Firma -->
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-zinc-800 dark:text-zinc-300 font-semibold">
              <Eye class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Vista Previa en Vivo de la Firma</span>
            </div>
            <div class="p-5 bg-white text-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-inner overflow-x-auto">
              <div v-html="previewFirmaHtml || '<span class=\'text-zinc-400 italic\'>Firma deshabilitada</span>'"></div>
            </div>
          </div>
        </div>

        <!-- PESTAÑA 2: PIE DE PÁGINA INSTITUCIONAL -->
        <div v-if="tabActiva === 'pie'" class="space-y-6">
          <div class="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <div class="space-y-0.5">
              <div class="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <span>Habilitar Pie de Página Institucional</span>
                <span v-if="formPie.habilitado" class="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-medium">Activo</span>
              </div>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
                Agrega cláusula legal de confidencialidad y datos de domicilio al pie de cada despacho
              </p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="formPie.habilitado" class="sr-only peer" />
              <div class="w-9 h-5 bg-zinc-300 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div class="space-y-4">
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-zinc-700 dark:text-zinc-300 font-medium flex items-center gap-2">
                  <ShieldCheck class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Cláusula de Confidencialidad y Protección de Datos</span>
                </label>
                <label class="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 cursor-pointer text-[11px]">
                  <input type="checkbox" v-model="formPie.incluirAvisoConfidencialidad" class="rounded bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-indigo-600 focus:ring-0 cursor-pointer" />
                  <span>Incluir cláusula</span>
                </label>
              </div>
              <textarea
                v-model="formPie.textoLegal"
                rows="4"
                class="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg p-3 text-zinc-800 dark:text-zinc-300 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed font-sans placeholder-zinc-400 dark:placeholder-zinc-600"
              ></textarea>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Dirección Física Institucional</label>
                <input
                  type="text"
                  v-model="formPie.direccionFisica"
                  placeholder="Av. Winston Churchill No. 1099, Torre Acrópolis Piso 14, Piantini, Santo Domingo"
                  class="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 placeholder-zinc-400 dark:placeholder-zinc-600"
                />
              </div>

              <div>
                <label class="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">RNC / Identificación Fiscal</label>
                <input
                  type="text"
                  v-model="formPie.rncEmpresa"
                  placeholder="RNC: 1-32-45890-1"
                  class="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 placeholder-zinc-400 dark:placeholder-zinc-600"
                />
              </div>
            </div>
          </div>

          <!-- Live Preview Pie -->
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-zinc-800 dark:text-zinc-300 font-semibold">
              <Eye class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Vista Previa en Vivo del Pie Institucional</span>
            </div>
            <div class="p-5 bg-white text-zinc-700 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-inner">
              <div v-html="previewPieHtml || '<span class=\'text-zinc-400 italic\'>Pie de página deshabilitado</span>'"></div>
            </div>
          </div>
        </div>

        <!-- PESTAÑA 3: SERVIDORES (SMTP / IMAP) -->
        <div v-if="tabActiva === 'servidores'" class="space-y-6">
          <!-- Presets rápidos -->
          <div class="space-y-2">
            <label class="text-zinc-600 dark:text-zinc-400 font-medium">Seleccionar Proveedor Preconfigurado:</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                @click="aplicarPresetProveedor('google')"
                class="p-2.5 rounded-xl border text-left transition flex flex-col gap-1"
                :class="formSmtp.proveedor === 'google' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'"
              >
                <span class="font-bold">Google / Gmail</span>
                <span class="text-[10px] text-zinc-500">smtp.gmail.com</span>
              </button>

              <button
                type="button"
                @click="aplicarPresetProveedor('microsoft')"
                class="p-2.5 rounded-xl border text-left transition flex flex-col gap-1"
                :class="formSmtp.proveedor === 'microsoft' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'"
              >
                <span class="font-bold">Microsoft 365</span>
                <span class="text-[10px] text-zinc-500">smtp.office365.com</span>
              </button>

              <button
                type="button"
                @click="aplicarPresetProveedor('cpanel')"
                class="p-2.5 rounded-xl border text-left transition flex flex-col gap-1"
                :class="formSmtp.proveedor === 'cpanel' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'"
              >
                <span class="font-bold">cPanel / Webmail</span>
                <span class="text-[10px] text-zinc-500">mail.dominio.com</span>
              </button>

              <button
                type="button"
                @click="aplicarPresetProveedor('personalizado')"
                class="p-2.5 rounded-xl border text-left transition flex flex-col gap-1"
                :class="formSmtp.proveedor === 'personalizado' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'"
              >
                <span class="font-bold">Personalizado</span>
                <span class="text-[10px] text-zinc-500">Servidor propio</span>
              </button>
            </div>
          </div>

          <!-- Campos SMTP -->
          <div class="p-4 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-4">
            <div class="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 pb-2">
              <span class="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <Server class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Servidor Saliente (SMTP — Envío de Correos)</span>
              </span>
              <button
                type="button"
                @click="probarConexionSmtp"
                :disabled="probandoSmtp"
                class="px-2.5 py-1 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Loader2 v-if="probandoSmtp" class="w-3 h-3 animate-spin" />
                <RefreshCw v-else class="w-3 h-3" />
                <span>Probar Salida SMTP</span>
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-2">
                <label class="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Host SMTP</label>
                <input
                  type="text"
                  v-model="formSmtp.servidorSmtp"
                  placeholder="smtp.empresa.com.do"
                  class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 placeholder-zinc-400 dark:placeholder-zinc-600"
                />
              </div>

              <div>
                <label class="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Puerto SMTP</label>
                <input
                  type="number"
                  v-model.number="formSmtp.puertoSmtp"
                  placeholder="587"
                  class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 placeholder-zinc-400 dark:placeholder-zinc-600"
                />
              </div>

              <div>
                <label class="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Seguridad Saliente</label>
                <select
                  v-model="formSmtp.seguridadSmtp"
                  class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="tls">STARTTLS (587)</option>
                  <option value="ssl">SSL / TLS (465)</option>
                  <option value="ninguna">Sin cifrado (25)</option>
                </select>
              </div>

              <div>
                <label class="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Usuario SMTP (Correo)</label>
                <input
                  type="text"
                  v-model="formSmtp.usuarioSmtp"
                  placeholder="ventas@empresa.com.do"
                  class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 placeholder-zinc-400 dark:placeholder-zinc-600"
                />
              </div>

              <div>
                <label class="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Contraseña o Clave de App</label>
                <input
                  type="password"
                  v-model="formSmtp.contrasenaSmtp"
                  placeholder="••••••••••••"
                  class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 placeholder-zinc-400 dark:placeholder-zinc-600"
                />
              </div>
            </div>

            <!-- Feedback SMTP -->
            <div
              v-if="resultadoSmtp"
              class="p-3 rounded-lg border text-[11px] flex items-start gap-2"
              :class="resultadoSmtp.exito ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300' : 'bg-red-500/10 border-red-500/25 text-red-700 dark:text-red-300'"
            >
              <CheckCircle2 v-if="resultadoSmtp.exito" class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <AlertCircle v-else class="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div class="space-y-0.5">
                <div class="font-semibold">{{ resultadoSmtp.mensaje }}</div>
                <div v-if="resultadoSmtp.latenciaMs" class="text-zinc-500 dark:text-zinc-400 text-[10px]">Latencia: {{ resultadoSmtp.latenciaMs }} ms</div>
              </div>
            </div>
          </div>

          <!-- Campos IMAP -->
          <div class="p-4 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-4">
            <div class="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 pb-2">
              <span class="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <Mail class="w-4 h-4 text-sky-500 dark:text-sky-400" />
                <span>Servidor Entrante (IMAP — Recepción de Correos)</span>
              </span>
              <button
                type="button"
                @click="probarConexionImap"
                :disabled="probandoImap"
                class="px-2.5 py-1 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sky-600 dark:text-sky-400 border border-sky-500/20 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Loader2 v-if="probandoImap" class="w-3 h-3 animate-spin" />
                <RefreshCw v-else class="w-3 h-3" />
                <span>Probar Recepción IMAP</span>
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-2">
                <label class="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Host IMAP</label>
                <input
                  type="text"
                  v-model="formSmtp.servidorImap"
                  placeholder="imap.empresa.com.do"
                  class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-sky-500 placeholder-zinc-400 dark:placeholder-zinc-600"
                />
              </div>

              <div>
                <label class="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Puerto IMAP</label>
                <input
                  type="number"
                  v-model.number="formSmtp.puertoImap"
                  placeholder="993"
                  class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-sky-500 placeholder-zinc-400 dark:placeholder-zinc-600"
                />
              </div>

              <div>
                <label class="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Seguridad Entrante</label>
                <select
                  v-model="formSmtp.seguridadImap"
                  class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="ssl">SSL / TLS (993)</option>
                  <option value="tls">STARTTLS (143)</option>
                  <option value="ninguna">Sin cifrado (143)</option>
                </select>
              </div>

              <div>
                <label class="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Usuario IMAP</label>
                <input
                  type="text"
                  v-model="formSmtp.usuarioImap"
                  placeholder="ventas@empresa.com.do"
                  class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-sky-500 placeholder-zinc-400 dark:placeholder-zinc-600"
                />
              </div>

              <div>
                <label class="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Contraseña IMAP</label>
                <input
                  type="password"
                  v-model="formSmtp.contrasenaImap"
                  placeholder="••••••••••••"
                  class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-sky-500 placeholder-zinc-400 dark:placeholder-zinc-600"
                />
              </div>
            </div>

            <!-- Feedback IMAP -->
            <div
              v-if="resultadoImap"
              class="p-3 rounded-lg border text-[11px] flex items-start gap-2"
              :class="resultadoImap.exito ? 'bg-sky-500/10 border-sky-500/25 text-sky-700 dark:text-sky-300' : 'bg-red-500/10 border-red-500/25 text-red-700 dark:text-red-300'"
            >
              <CheckCircle2 v-if="resultadoImap.exito" class="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
              <AlertCircle v-else class="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div class="space-y-0.5">
                <div class="font-semibold">{{ resultadoImap.mensaje }}</div>
                <div v-if="resultadoImap.latenciaMs" class="text-zinc-500 dark:text-zinc-400 text-[10px]">Latencia: {{ resultadoImap.latenciaMs }} ms</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pie de Modal (Acciones) -->
      <div class="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/90 flex items-center justify-between">
        <div class="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
          <span v-if="mensajeGuardado" class="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 class="w-3.5 h-3.5" />
            Configuración guardada correctamente
          </span>
          <span v-else>Los cambios se aplicarán inmediatamente a todos los envíos y respuestas</span>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            @click="emit('cerrar')"
            class="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 font-medium transition"
          >
            Cerrar
          </button>

          <button
            type="button"
            @click="guardarTodo"
            class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition flex items-center gap-2 shadow-sm shadow-indigo-950/40"
          >
            <Save class="w-4 h-4" />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
