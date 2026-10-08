<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { firmaPieService, FIRMA_POR_DEFECTO, PIE_POR_DEFECTO } from '@/modules/comunicaciones/services/firma-pie.service';
import { smtpService, PRESETS_PROVEEDORES } from '@/modules/comunicaciones/services/smtp.service';
import { webmailService } from '@/modules/comunicaciones/services/webmail.service';
import type { ConfiguracionFirma, ConfiguracionPiePagina } from '@/modules/comunicaciones/types/webmail.types';
import type { ConfiguracionSMTP, ProveedorPreset, ResultadoPruebaConexion, TipoSeguridadSmtp } from '@/modules/comunicaciones/types/smtp.types';
import AppSelect, { type SelectOption } from '@/shared/components/AppSelect.vue';
import { 
  PenTool, 
  FileText, 
  Server, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Mail, 
  ShieldCheck, 
  RotateCcw,
  Sparkles
} from 'lucide-vue-next';
import { toastService } from '@/core/notifications/toast.service';
import { dialogService } from '@/core/dialog/dialog.service';

const subPestanaActiva = ref<'servidores' | 'firma' | 'pie'>('servidores');

// Formularios reactivos
const formSmtp = reactive<ConfiguracionSMTP>(smtpService.obtenerConfiguracion());
const formFirma = reactive<ConfiguracionFirma>({ ...FIRMA_POR_DEFECTO });
const formPie = reactive<ConfiguracionPiePagina>({ ...PIE_POR_DEFECTO });

// Pruebas de conectividad
const probandoSmtp = ref(false);
const probandoImap = ref(false);
const resultadoSmtp = ref<ResultadoPruebaConexion | null>(null);
const resultadoImap = ref<{ exito: boolean; mensaje: string; latenciaMs?: number } | null>(null);
const guardando = ref(false);
const mensajeGuardado = ref(false);

// Control de Tema para Vista Previa
const modoVistaPreviaFirma = ref<'auto' | 'claro' | 'oscuro'>('auto');
const modoVistaPreviaPie = ref<'auto' | 'claro' | 'oscuro'>('auto');
const esModoOscuroSistema = ref(false);

const actualizarDeteccionTema = () => {
  if (typeof document !== 'undefined') {
    esModoOscuroSistema.value = document.documentElement.classList.contains('dark');
  }
};

let observerTema: MutationObserver | null = null;

const opcionesSeguridadSmtp: Array<SelectOption<TipoSeguridadSmtp>> = [
  { value: 'tls', label: 'STARTTLS (Puerto 587)' },
  { value: 'ssl', label: 'SSL / TLS (Puerto 465)' },
  { value: 'ninguna', label: 'Sin cifrado estándar (25)' },
];

const opcionesSeguridadImap: Array<SelectOption<TipoSeguridadSmtp>> = [
  { value: 'ssl', label: 'SSL / TLS (Puerto 993)' },
  { value: 'tls', label: 'STARTTLS (Puerto 143)' },
  { value: 'ninguna', label: 'Sin cifrado (Puerto 143)' },
];

const paletaColoresFirma = [
  { id: 'indigo', hex: '#4f46e5', label: 'Índigo Corporativo' },
  { id: 'blue', hex: '#2563eb', label: 'Azul Real' },
  { id: 'emerald', hex: '#059669', label: 'Verde Esmeralda' },
  { id: 'sky', hex: '#0284c7', label: 'Cielo B2B' },
  { id: 'violet', hex: '#7c3aed', label: 'Púrpura Imperial' },
  { id: 'zinc', hex: '#3f3f46', label: 'Grafito Neutro' },
];

const cargarDatos = () => {
  Object.assign(formSmtp, smtpService.obtenerConfiguracion());
  Object.assign(formFirma, firmaPieService.obtenerFirma());
  Object.assign(formPie, firmaPieService.obtenerPie());
};

onMounted(() => {
  cargarDatos();
  actualizarDeteccionTema();
  if (typeof document !== 'undefined') {
    observerTema = new MutationObserver(actualizarDeteccionTema);
    observerTema.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }
});

onUnmounted(() => {
  if (observerTema) {
    observerTema.disconnect();
    observerTema = null;
  }
});

const previewFirmaEsOscuro = computed(() => {
  if (modoVistaPreviaFirma.value === 'claro') return false;
  if (modoVistaPreviaFirma.value === 'oscuro') return true;
  return esModoOscuroSistema.value;
});

const previewPieEsOscuro = computed(() => {
  if (modoVistaPreviaPie.value === 'claro') return false;
  if (modoVistaPreviaPie.value === 'oscuro') return true;
  return esModoOscuroSistema.value;
});

// HTML en vivo con adaptación fiel a modo claro y oscuro
const previewFirmaHtml = computed(() =>
  firmaPieService.generarHtmlFirma(formFirma, previewFirmaEsOscuro.value)
);
const previewPieHtml = computed(() =>
  firmaPieService.generarHtmlPie(formPie, previewPieEsOscuro.value)
);

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
    if (resultadoSmtp.value.exito) {
      toastService.exito(resultadoSmtp.value.mensaje);
    } else {
      toastService.error(resultadoSmtp.value.mensaje);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al probar conexión SMTP';
    resultadoSmtp.value = {
      exito: false,
      mensaje: msg,
      latenciaMs: 0,
      detalles: {
        smtpConectado: false,
        autenticacionAceptada: false,
        tlsHabilitado: false,
      },
    };
    toastService.error(msg);
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
    if (res.exito) {
      toastService.exito(res.mensaje);
    } else {
      toastService.error(res.mensaje);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al probar lectura IMAP';
    resultadoImap.value = { exito: false, mensaje: msg };
    toastService.error(msg);
  } finally {
    probandoImap.value = false;
  }
};

const guardarConfiguracionCompleta = async () => {
  guardando.value = true;
  try {
    firmaPieService.guardarFirma({ ...formFirma });
    firmaPieService.guardarPie({ ...formPie });
    smtpService.guardarConfiguracion({ ...formSmtp });

    mensajeGuardado.value = true;
    toastService.exito('Configuración de correo, servidores y firma guardada correctamente.');
    setTimeout(() => {
      mensajeGuardado.value = false;
    }, 2800);
  } finally {
    guardando.value = false;
  }
};

const restablecerValores = async () => {
  const confirmado = await dialogService.confirmar({
    titulo: 'Restablecer Configuración de Correo',
    subtitulo: 'Valores predeterminados del sistema',
    mensaje: '¿Deseas restablecer los parámetros de servidores, firma institucional y pie legal a los valores predeterminados?',
    detalle: 'Los ajustes personalizados actuales serán reemplazados.',
    textoConfirmar: 'Restablecer Valores',
    textoCancelar: 'Cancelar',
    tipo: 'advertencia',
  });

  if (!confirmado) return;

  Object.assign(formFirma, FIRMA_POR_DEFECTO);
  Object.assign(formPie, PIE_POR_DEFECTO);
  cargarDatos();
  toastService.info('Parámetros de correo restaurados a valores predeterminados.');
};
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado de Sección con Navegación Sub-Pestañas -->
    <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
            <Mail class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Configuración de Servidores & Firma de Correo</span>
              <span class="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-semibold">
                Gobierno Corporativo
              </span>
            </h2>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
              Parametriza tus cuentas salientes (SMTP), lectura de bandeja (IMAP), firma con datos institucionales y pie legal Ley 172-13
            </p>
          </div>
        </div>

        <!-- Botones de Acción Global -->
        <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            @click="restablecerValores"
            class="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-medium transition flex items-center gap-1.5"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Restablecer</span>
          </button>

          <button
            type="button"
            @click="guardarConfiguracionCompleta"
            :disabled="guardando"
            class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition shadow-md shadow-indigo-950/20 flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <Loader2 v-if="guardando" class="w-3.5 h-3.5 animate-spin" />
            <Save v-else class="w-3.5 h-3.5" />
            <span>{{ guardando ? 'Guardando...' : 'Guardar Configuración' }}</span>
          </button>
        </div>
      </div>

      <!-- Segmented Control de Sub-Pestañas -->
      <div class="flex items-center gap-2 pt-4">
        <button
          type="button"
          @click="subPestanaActiva = 'servidores'"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition"
          :class="subPestanaActiva === 'servidores'
            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
            : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'"
        >
          <Server class="w-4 h-4" />
          <span>Servidores SMTP & IMAP</span>
        </button>

        <button
          type="button"
          @click="subPestanaActiva = 'firma'"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition"
          :class="subPestanaActiva === 'firma'
            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
            : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'"
        >
          <PenTool class="w-4 h-4" />
          <span>Firma Corporativa</span>
        </button>

        <button
          type="button"
          @click="subPestanaActiva = 'pie'"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition"
          :class="subPestanaActiva === 'pie'
            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
            : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'"
        >
          <FileText class="w-4 h-4" />
          <span>Pie Legal (Ley 172-13)</span>
        </button>
      </div>
    </div>

    <!-- ==================== SUB-PESTAÑA 1: SERVIDORES SMTP / IMAP ==================== -->
    <div v-if="subPestanaActiva === 'servidores'" class="space-y-6">
      <!-- Selector de Presets de Proveedores Rápidos -->
      <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <label class="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1">
            Plantillas Rápidas de Configuración (Presets)
          </label>
          <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
            Selecciona tu proveedor de correo para rellenar los puertos y servidores recomendados
          </p>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            @click="aplicarPresetProveedor('microsoft')"
            class="p-3.5 rounded-xl border text-left transition flex flex-col justify-between gap-2"
            :class="formSmtp.proveedor === 'microsoft'
              ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-500/10 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
              : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/40 text-zinc-700 dark:text-zinc-300'"
          >
            <div class="font-bold text-xs">Microsoft 365</div>
            <div class="text-[10px] text-zinc-400">Office 365 / Outlook</div>
          </button>

          <button
            type="button"
            @click="aplicarPresetProveedor('google')"
            class="p-3.5 rounded-xl border text-left transition flex flex-col justify-between gap-2"
            :class="formSmtp.proveedor === 'google'
              ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-500/10 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
              : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/40 text-zinc-700 dark:text-zinc-300'"
          >
            <div class="font-bold text-xs">Google Workspace</div>
            <div class="text-[10px] text-zinc-400">Gmail Empresarial</div>
          </button>

          <button
            type="button"
            @click="aplicarPresetProveedor('cpanel')"
            class="p-3.5 rounded-xl border text-left transition flex flex-col justify-between gap-2"
            :class="formSmtp.proveedor === 'cpanel'
              ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-500/10 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
              : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/40 text-zinc-700 dark:text-zinc-300'"
          >
            <div class="font-bold text-xs">cPanel Empresarial</div>
            <div class="text-[10px] text-zinc-500 dark:text-zinc-400">Hosting Propio / Webmail</div>
          </button>

          <button
            type="button"
            @click="aplicarPresetProveedor('personalizado')"
            class="p-3.5 rounded-xl border text-left transition flex flex-col justify-between gap-2"
            :class="formSmtp.proveedor === 'personalizado'
              ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-500/10 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
              : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/40 text-zinc-700 dark:text-zinc-300'"
          >
            <div class="font-bold text-xs">Personalizado</div>
            <div class="text-[10px] text-zinc-500 dark:text-zinc-400">Servidor Dedicado</div>
          </button>
        </div>
      </div>

      <!-- Configuración SMTP & IMAP en Grid de 2 Columnas -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Tarjeta Servidor Saliente (SMTP) -->
        <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div class="flex items-center gap-2 font-bold text-xs text-zinc-900 dark:text-zinc-100">
              <Server class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Servidor Saliente (SMTP)</span>
            </div>
            <span class="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">Envío de Cotizaciones & Respuestas</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="sm:col-span-2">
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1 text-xs">
                Host / Servidor SMTP *
              </label>
              <input
                v-model="formSmtp.servidorSmtp"
                type="text"
                placeholder="smtp.office365.com"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 font-mono transition"
              />
            </div>
            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1 text-xs">
                Puerto *
              </label>
              <input
                v-model.number="formSmtp.puertoSmtp"
                type="number"
                placeholder="587"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 font-mono transition"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1 text-xs">
                Cifrado / Seguridad
              </label>
              <AppSelect
                v-model="formSmtp.seguridadSmtp"
                :options="opcionesSeguridadSmtp"
                :full-width="true"
              />
            </div>

            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1 text-xs">
                Usuario / Correo Saliente *
              </label>
              <input
                v-model="formSmtp.usuarioSmtp"
                type="text"
                placeholder="usuario@dominio.do"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1 text-xs flex items-center justify-between">
              <span>Contraseña de Aplicación / Clave SMTP *</span>
              <span class="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal">Cifrado local seguro</span>
            </label>
            <input
              v-model="formSmtp.contrasenaSmtp"
              type="password"
              placeholder="••••••••••••"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <!-- Botón de Prueba SMTP y Resultado -->
          <div class="pt-2 flex flex-col gap-2">
            <button
              type="button"
              @click="probarConexionSmtp"
              :disabled="probandoSmtp"
              class="w-full py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 border border-zinc-300 dark:border-zinc-700 disabled:opacity-50"
            >
              <Loader2 v-if="probandoSmtp" class="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
              <Sparkles v-else class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{{ probandoSmtp ? 'Verificando Servidor SMTP...' : 'Probar Envío SMTP en Vivo' }}</span>
            </button>

            <div
              v-if="resultadoSmtp"
              class="p-3 rounded-xl border text-xs flex items-center gap-2"
              :class="resultadoSmtp.exito ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300'"
            >
              <CheckCircle2 v-if="resultadoSmtp.exito" class="w-4 h-4 text-emerald-500 shrink-0" />
              <AlertCircle v-else class="w-4 h-4 text-rose-500 shrink-0" />
              <span class="truncate">{{ resultadoSmtp.mensaje }}</span>
            </div>
          </div>
        </div>

        <!-- Tarjeta Servidor Entrante (IMAP) -->
        <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div class="flex items-center gap-2 font-bold text-xs text-zinc-900 dark:text-zinc-100">
              <Mail class="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Servidor Entrante (IMAP)</span>
            </div>
            <span class="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">Lectura & Sincronización Webmail</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="sm:col-span-2">
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1 text-xs">
                Host / Servidor IMAP *
              </label>
              <input
                v-model="formSmtp.servidorImap"
                type="text"
                placeholder="outlook.office365.com"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 font-mono transition"
              />
            </div>
            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1 text-xs">
                Puerto *
              </label>
              <input
                v-model.number="formSmtp.puertoImap"
                type="number"
                placeholder="993"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 font-mono transition"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1 text-xs">
                Cifrado IMAP
              </label>
              <AppSelect
                v-model="formSmtp.seguridadImap"
                :options="opcionesSeguridadImap"
                :full-width="true"
              />
            </div>

            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1 text-xs">
                Usuario IMAP
              </label>
              <input
                v-model="formSmtp.usuarioImap"
                type="text"
                placeholder="usuario@dominio.do"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1 text-xs flex items-center justify-between">
              <span>Contraseña IMAP</span>
              <span class="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal">Igual o independiente a SMTP</span>
            </label>
            <input
              v-model="formSmtp.contrasenaImap"
              type="password"
              placeholder="••••••••••••"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <!-- Botón de Prueba IMAP y Resultado -->
          <div class="pt-2 flex flex-col gap-2">
            <button
              type="button"
              @click="probarConexionImap"
              :disabled="probandoImap"
              class="w-full py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 border border-zinc-300 dark:border-zinc-700 disabled:opacity-50"
            >
              <Loader2 v-if="probandoImap" class="w-3.5 h-3.5 animate-spin text-sky-600 dark:text-sky-400" />
              <Sparkles v-else class="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>{{ probandoImap ? 'Consultando Bandeja IMAP...' : 'Probar Conexión IMAP en Vivo' }}</span>
            </button>

            <div
              v-if="resultadoImap"
              class="p-3 rounded-xl border text-xs flex items-center gap-2"
              :class="resultadoImap.exito ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300'"
            >
              <CheckCircle2 v-if="resultadoImap.exito" class="w-4 h-4 text-emerald-500 shrink-0" />
              <AlertCircle v-else class="w-4 h-4 text-rose-500 shrink-0" />
              <span class="truncate">{{ resultadoImap.mensaje }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== SUB-PESTAÑA 2: FIRMA CORPORATIVA ==================== -->
    <div v-if="subPestanaActiva === 'firma'" class="space-y-6">
      <!-- Banner Informativo -->
      <div class="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-start gap-3 text-xs">
        <ShieldCheck class="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div class="space-y-1">
          <div class="font-bold text-indigo-900 dark:text-indigo-200">Gobierno de Identidad & Consistencia Institucional</div>
          <p class="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
            La firma se incluye automáticamente en todas las cotizaciones, respuestas y despachos masivos. Asegura que la marca de tu empresa se represente con estándares ejecutivos.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Formulario de Campos de Firma (7 cols) -->
        <div class="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
          <!-- Toggle Activar Firma -->
          <div class="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <div>
              <div class="font-bold text-xs text-zinc-900 dark:text-zinc-100">Activar Firma en Correos Salientes</div>
              <div class="text-[11px] text-zinc-500 dark:text-zinc-400">Inserta tu tarjeta institucional en respuestas y envíos</div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="formFirma.habilitada" class="sr-only peer" />
              <div class="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1 text-xs">
                Nombre del Remitente *
              </label>
              <input
                v-model="formFirma.nombreRemitente"
                type="text"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1 text-xs">
                Cargo Oficial *
              </label>
              <input
                v-model="formFirma.cargo"
                type="text"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1 text-xs">
                Departamento
              </label>
              <input
                v-model="formFirma.departamento"
                type="text"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1 text-xs">
                Empresa
              </label>
              <input
                v-model="formFirma.empresa"
                type="text"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1 text-xs">
                Teléfono PBX
              </label>
              <input
                v-model="formFirma.telefono"
                type="text"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 font-mono transition"
              />
            </div>

            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1 text-xs">
                Flota Móvil / Celular
              </label>
              <input
                v-model="formFirma.celular"
                type="text"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 font-mono transition"
              />
            </div>
          </div>

          <div>
            <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1.5 text-xs">
              Color de Acento de la Firma
            </label>
            <div class="flex items-center gap-2 flex-wrap">
              <button
                v-for="color in paletaColoresFirma"
                :key="color.id"
                type="button"
                @click="formFirma.colorAcento = color.hex"
                class="px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition"
                :class="formFirma.colorAcento === color.hex 
                  ? 'border-indigo-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold ring-2 ring-indigo-500/20' 
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'"
              >
                <span class="w-3.5 h-3.5 rounded-full" :style="{ backgroundColor: color.hex }"></span>
                <span>{{ color.label }}</span>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1 text-xs">
              Eslogan o Frase Institucional
            </label>
            <input
              v-model="formFirma.textoPersonalizado"
              type="text"
              placeholder="Comprometidos con la excelencia técnica y operativa."
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        <!-- Vista Previa de Firma en Vivo (5 cols) -->
        <div class="lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div class="space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <span class="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <PenTool class="w-3.5 h-3.5 text-indigo-500" />
                <span>Vista Previa en Vivo (HTML)</span>
              </span>

              <!-- Selector de modo para la vista previa -->
              <div class="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[10px]">
                <button
                  type="button"
                  @click="modoVistaPreviaFirma = 'claro'"
                  title="Simular visualización en cliente con fondo claro (ej. Gmail estándar)"
                  class="px-2 py-0.5 rounded transition"
                  :class="!previewFirmaEsOscuro ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm font-semibold' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'"
                >
                  ☀️ Claro
                </button>
                <button
                  type="button"
                  @click="modoVistaPreviaFirma = 'oscuro'"
                  title="Simular visualización en cliente con modo noche activo"
                  class="px-2 py-0.5 rounded transition"
                  :class="previewFirmaEsOscuro ? 'bg-zinc-900 text-white dark:bg-zinc-700 shadow-sm font-semibold' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'"
                >
                  🌙 Oscuro
                </button>
              </div>
            </div>

            <div
              class="p-5 rounded-xl min-h-[220px] transition-colors overflow-hidden"
              :class="previewFirmaEsOscuro
                ? 'bg-zinc-950 text-zinc-100 border border-zinc-800/90 shadow-inner'
                : 'bg-white text-zinc-900 border border-zinc-200 shadow-sm'"
            >
              <div v-html="previewFirmaHtml"></div>
            </div>
          </div>

          <div class="text-[11px] text-zinc-500 dark:text-zinc-400 pt-4 border-t border-zinc-200 dark:border-zinc-800/60 leading-relaxed">
            Esta tarjeta se inyectará al final de cada mensaje enviado por tu equipo comercial.
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== SUB-PESTAÑA 3: PIE LEGAL & CONFIDENCIALIDAD ==================== -->
    <div v-if="subPestanaActiva === 'pie'" class="space-y-6">
      <div class="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3 text-xs">
        <ShieldCheck class="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div class="space-y-1">
          <div class="font-bold text-emerald-900 dark:text-emerald-200">Cumplimiento Legal Dominicano (Ley No. 172-13)</div>
          <p class="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Garantiza la protección jurídica de las comunicaciones corporativas y notifica la confidencialidad de la información fiscal, cotizaciones y anexos transmitidos por correo electrónico.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Formulario Pie Legal (7 cols) -->
        <div class="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
          <!-- Toggle Activar Pie -->
          <div class="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <div>
              <div class="font-bold text-xs text-zinc-900 dark:text-zinc-100">Activar Pie Legal en Correos</div>
              <div class="text-[11px] text-zinc-500 dark:text-zinc-400">Anexa aviso legal y cláusula de protección de datos</div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="formPie.habilitado" class="sr-only peer" />
              <div class="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div>
            <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1 text-xs">
              Texto Legal de Confidencialidad *
            </label>
            <textarea
              v-model="formPie.textoLegal"
              rows="6"
              class="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed font-sans transition"
            ></textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1 text-xs">
                RNC Institucional
              </label>
              <input
                v-model="formPie.rncEmpresa"
                type="text"
                placeholder="RNC: 1-32-45890-1"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 font-mono transition"
              />
            </div>

            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1 text-xs">
                Dirección Física
              </label>
              <input
                v-model="formPie.direccionFisica"
                type="text"
                placeholder="Av. Winston Churchill #1099, Santo Domingo"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>
        </div>

        <!-- Vista Previa Pie Legal (5 cols) -->
        <div class="lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div class="space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <span class="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <FileText class="w-3.5 h-3.5 text-emerald-500" />
                <span>Vista Previa Legal (HTML)</span>
              </span>

              <!-- Selector de modo para la vista previa -->
              <div class="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[10px]">
                <button
                  type="button"
                  @click="modoVistaPreviaPie = 'claro'"
                  title="Simular visualización en fondo claro"
                  class="px-2 py-0.5 rounded transition"
                  :class="!previewPieEsOscuro ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm font-semibold' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'"
                >
                  ☀️ Claro
                </button>
                <button
                  type="button"
                  @click="modoVistaPreviaPie = 'oscuro'"
                  title="Simular visualización en modo oscuro"
                  class="px-2 py-0.5 rounded transition"
                  :class="previewPieEsOscuro ? 'bg-zinc-900 text-white dark:bg-zinc-700 shadow-sm font-semibold' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'"
                >
                  🌙 Oscuro
                </button>
              </div>
            </div>

            <div
              class="p-5 rounded-xl min-h-[220px] transition-colors overflow-hidden"
              :class="previewPieEsOscuro
                ? 'bg-zinc-950 text-zinc-100 border border-zinc-800/90 shadow-inner'
                : 'bg-white text-zinc-900 border border-zinc-200 shadow-sm'"
            >
              <div v-html="previewPieHtml"></div>
            </div>
          </div>

          <div class="text-[11px] text-zinc-500 dark:text-zinc-400 pt-4 border-t border-zinc-200 dark:border-zinc-800/60 leading-relaxed">
            Protege tus datos sensibles y asegura validez en auditorías tributarias y jurídicas.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
