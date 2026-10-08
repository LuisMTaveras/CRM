<script setup lang="ts">
import { ref } from 'vue';
import { documentParserService, type DocumentoProcesado } from '../services/document-parser.service';
import { emailService } from '../services/email.service';
import { empresaService } from '@/modules/configuracion/services/empresa.service';
import { pdfGeneratorService } from '../services/pdf-generator.service';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import type { PlantillaDocumento, CategoriaPlantilla } from '../types/comunicacion.types';
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  Eye, 
  Save, 
  Send, 
  Loader2, 
  AlertCircle
} from 'lucide-vue-next';

defineProps<{
  abierto: boolean;
}>();

const emit = defineEmits<{
  (e: 'cerrar'): void;
  (e: 'plantillaCreada', plantilla: PlantillaDocumento, enviarInmediato: boolean): void;
}>();

const authStore = useAuthStore();
const arrastrando = ref(false);
const procesandoArchivo = ref(false);
const documentoCargado = ref<DocumentoProcesado | null>(null);
const errorCarga = ref<string | null>(null);

// Campos del formulario de plantilla
const nombrePlantilla = ref('');
const categoria = ref<CategoriaPlantilla>('propuesta');
const asuntoEmail = ref('');
const cuerpoEmail = ref('');
const tituloDocumento = ref('');
const contenidoDocumento = ref('');

// Vista previa
const pestanaActiva = ref<'editor' | 'previa'>('editor');
const pdfPreviewUri = ref('');

const variablesDisponibles = [
  { clave: '{{empresa}}', etiqueta: 'Nombre Empresa' },
  { clave: '{{contacto_principal}}', etiqueta: 'Contacto Clave' },
  { clave: '{{cargo_contacto}}', etiqueta: 'Cargo Contacto' },
  { clave: '{{rnc}}', etiqueta: 'RNC Dominicano' },
  { clave: '{{ciudad}}', etiqueta: 'Ciudad (Rep. Dom.)' },
  { clave: '{{monto}}', etiqueta: 'Monto Estimado (RD$)' },
  { clave: '{{fecha}}', etiqueta: 'Fecha Actual' },
  { clave: '{{empresa_remitente}}', etiqueta: 'Empresa Remitente' },
  { clave: '{{correo_remitente}}', etiqueta: 'Correo Remitente' },
];

const manejarSeleccionArchivo = async (evento: Event) => {
  const target = evento.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  await procesarArchivo(target.files[0]);
};

const manejarDrop = async (evento: DragEvent) => {
  arrastrando.value = false;
  if (!evento.dataTransfer?.files || evento.dataTransfer.files.length === 0) return;
  await procesarArchivo(evento.dataTransfer.files[0]);
};

const procesarArchivo = async (archivo: File) => {
  procesandoArchivo.value = true;
  errorCarga.value = null;

  try {
    const doc = await documentParserService.procesarArchivo(archivo);
    documentoCargado.value = doc;

    const nombreBase = archivo.name.replace(/\.[^/.]+$/, '');
    nombrePlantilla.value = nombreBase.replace(/[_-]/g, ' ');
    tituloDocumento.value = nombreBase.toUpperCase().replace(/[_-]/g, ' ');
    asuntoEmail.value = `${nombrePlantilla.value} — {{empresa}}`;
    cuerpoEmail.value = `Estimado(a) {{contacto_principal}},\n\nLe hacemos entrega del documento oficial "${nombrePlantilla.value}" correspondiente a {{empresa}}, debidamente preparado y adjunto en formato PDF.\n\nQuedamos a su disposición para cualquier consulta.\n\nAtentamente,\n{{empresa_remitente}}\n{{correo_remitente}}`;
    contenidoDocumento.value = doc.contenidoTexto;

    generarPrevisualizacion();
  } catch (err) {
    errorCarga.value = 'Ocurrió un error al procesar el archivo. Intenta con un formato .docx o .txt.';
    console.error(err);
  } finally {
    procesandoArchivo.value = false;
  }
};

const insertarVariable = (clave: string) => {
  contenidoDocumento.value += ` ${clave}`;
  generarPrevisualizacion();
};

const generarPrevisualizacion = () => {
  if (!authStore.usuario) return;
  const plantillaTemporal: PlantillaDocumento = {
    id: 'temp-preview',
    nombre: nombrePlantilla.value || 'Documento Personalizado',
    descripcion: 'Documento subido por el usuario',
    categoria: categoria.value,
    asuntoEmail: asuntoEmail.value,
    cuerpoEmail: cuerpoEmail.value,
    tituloDocumento: tituloDocumento.value || 'DOCUMENTO OFICIAL',
    contenidoDocumento: contenidoDocumento.value,
  };

  const datosEmpresa = empresaService.obtenerDatos();
  const variablesMuestra = {
    empresa: 'EMPRESA CLIENTE S.A.',
    contacto_principal: 'Mercedes Gómez',
    cargo_contacto: 'Directora de Compras',
    rnc: '1-01-02345-6',
    ciudad: 'Santo Domingo',
    monto: 'RD$ 45,000,000',
    fecha: '05 oct 2026',
    empresa_remitente: datosEmpresa.razonSocial || 'Nuestra Empresa',
    correo_remitente: authStore.usuario.email,
    telefono_remitente: datosEmpresa.telefono || '+1 (809) 555-0100',
    ejecutivo: datosEmpresa.razonSocial || 'Nuestra Empresa',
    correo_ejecutivo: authStore.usuario.email,
    telefono_ejecutivo: datosEmpresa.telefono || '+1 (809) 555-0100',
  };

  try {
    pdfPreviewUri.value = pdfGeneratorService.obtenerDataUri(plantillaTemporal, variablesMuestra);
  } catch (e) {
    console.error('Error al generar preview en CargarDocumentoModal:', e);
  }
};

const guardarPlantilla = (enviarInmediato = false) => {
  if (!nombrePlantilla.value.trim() || !contenidoDocumento.value.trim()) {
    errorCarga.value = 'Debes ingresar un nombre y el contenido del documento.';
    return;
  }

  const nuevaPlantilla: PlantillaDocumento = {
    id: `plt-custom-${Date.now()}`,
    nombre: nombrePlantilla.value.trim(),
    descripcion: `Documento personalizado basado en ${documentoCargado.value?.nombreArchivo || 'plantilla propia'}.`,
    categoria: categoria.value,
    asuntoEmail: asuntoEmail.value.trim() || `${nombrePlantilla.value} — {{empresa}}`,
    cuerpoEmail: cuerpoEmail.value.trim(),
    tituloDocumento: tituloDocumento.value.trim() || nombrePlantilla.value.toUpperCase(),
    contenidoDocumento: contenidoDocumento.value,
  };

  emailService.agregarPlantilla(nuevaPlantilla);
  emit('plantillaCreada', nuevaPlantilla, enviarInmediato);
  emit('cerrar');
};
</script>

<template>
  <div v-if="abierto" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop oscuro -->
    <div @click="emit('cerrar')" class="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"></div>

    <!-- Modal Card -->
    <div class="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col z-10 overflow-hidden text-xs">
      <!-- Cabecera -->
      <div class="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <UploadCloud class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Cargar Documento Word / Plantilla para Envíos</span>
              <span class="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                .docx, .pdf, .txt
              </span>
            </h3>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
              Sube tus propuestas, contratos o cotizaciones para autocompletar variables y despachar en PDF
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

      <!-- Barra de Pestañas -->
      <div class="px-5 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-950/40 flex items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="pestanaActiva = 'editor'"
            :class="[
              'px-3 py-1 rounded text-xs font-medium transition flex items-center gap-1.5',
              pestanaActiva === 'editor' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-transparent' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            ]"
          >
            <FileText class="w-3.5 h-3.5" />
            <span>Editor & Variables</span>
          </button>
          <button
            type="button"
            @click="pestanaActiva = 'previa'; generarPrevisualizacion();"
            :class="[
              'px-3 py-1 rounded text-xs font-medium transition flex items-center gap-1.5',
              pestanaActiva === 'previa' ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200 dark:border-transparent' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            ]"
          >
            <Eye class="w-3.5 h-3.5" />
            <span>Previsualizar PDF Final</span>
          </button>
        </div>

        <span v-if="documentoCargado" class="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
          <CheckCircle2 class="w-3 h-3" />
          {{ documentoCargado.nombreArchivo }}
        </span>
      </div>

      <!-- Cuerpo del Modal con Scroll -->
      <div class="p-5 overflow-y-auto space-y-4 flex-1 bg-zinc-50/50 dark:bg-transparent">
        <!-- ZONA DE CARGA DRAG & DROP (Si aún no se ha cargado o para cambiarlo) -->
        <div
          @dragover.prevent="arrastrando = true"
          @dragleave.prevent="arrastrando = false"
          @drop.prevent="manejarDrop"
          :class="[
            'border-2 border-dashed rounded-xl p-5 text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer',
            arrastrando
              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300'
              : 'border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-700'
          ]"
          @click="($refs.inputArchivo as HTMLInputElement)?.click()"
        >
          <input
            ref="inputArchivo"
            type="file"
            accept=".docx,.doc,.txt,.md,.pdf,.rtf"
            class="hidden"
            @change="manejarSeleccionArchivo"
          />

          <div class="p-3 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-indigo-600 dark:text-indigo-400">
            <Loader2 v-if="procesandoArchivo" class="w-6 h-6 animate-spin" />
            <UploadCloud v-else class="w-6 h-6" />
          </div>

          <div>
            <span class="font-semibold text-zinc-800 dark:text-zinc-200 block text-xs">
              {{ procesandoArchivo ? 'Extrayendo texto y variables del documento...' : 'Haz clic para seleccionar o arrastra aquí tu documento Word (.docx), PDF o texto' }}
            </span>
            <span class="text-[11px] text-zinc-500">
              Soporta documentos de Word, acuerdos de confidencialidad, propuestas comerciales o cotizaciones
            </span>
          </div>
        </div>

        <!-- Alerta de Error si ocurre -->
        <div v-if="errorCarga" class="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 rounded-lg flex items-center gap-2 text-xs">
          <AlertCircle class="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{{ errorCarga }}</span>
        </div>

        <!-- Pestaña 1: Editor y Parametrización -->
        <div v-if="pestanaActiva === 'editor'" class="space-y-4">
          <!-- Datos Generales del Documento -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="sm:col-span-2">
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Nombre de la Plantilla / Documento</label>
              <input
                v-model="nombrePlantilla"
                type="text"
                placeholder="ej: Contrato de Prestación de Servicios B2B"
                class="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Categoría</label>
              <select
                v-model="categoria"
                class="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="propuesta">Propuesta</option>
                <option value="legal">Legal / Contrato</option>
                <option value="comercial">Comercial</option>
                <option value="cobranza">Cobranza</option>
              </select>
            </div>
          </div>

          <!-- Variables Disponibles para Inserción Rápida -->
          <div class="bg-white dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2 shadow-sm">
            <div class="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
              <span class="flex items-center gap-1.5 font-medium">
                <Sparkles class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Haz clic en una variable para insertarla en el texto del documento:
              </span>
              <span class="text-zinc-400 dark:text-zinc-500 font-mono">Sustitución dinámica</span>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="v in variablesDisponibles"
                :key="v.clave"
                type="button"
                @click="insertarVariable(v.clave)"
                class="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/30 font-mono text-[10px] transition"
              >
                + {{ v.clave }} ({{ v.etiqueta }})
              </button>
            </div>
          </div>

          <!-- Asunto y Cuerpo del Correo Electrónico -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Asunto del Correo Electrónico</label>
              <input
                v-model="asuntoEmail"
                type="text"
                placeholder="Propuesta para {{empresa}}"
                class="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Título Oficial en el Encabezado del PDF</label>
              <input
                v-model="tituloDocumento"
                type="text"
                placeholder="PROPUESTA COMERCIAL CORPORATIVA"
                class="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 font-medium uppercase"
              />
            </div>
          </div>

          <!-- Cuerpo del Correo -->
          <div>
            <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Mensaje del Correo Electrónico</label>
            <textarea
              v-model="cuerpoEmail"
              rows="3"
              class="w-full p-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded text-zinc-900 dark:text-zinc-200 text-xs focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
            ></textarea>
          </div>

          <!-- Contenido del Documento Oficial (PDF) -->
          <div>
            <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1 flex items-center justify-between">
              <span>Contenido del Documento Oficial (Se compila a PDF A4)</span>
              <span class="text-zinc-400 dark:text-zinc-500 text-[10px] font-mono">Líneas en mayúsculas se convierten en subtítulos</span>
            </label>
            <textarea
              v-model="contenidoDocumento"
              rows="9"
              placeholder="Escribe o pega aquí el contenido de tu documento o plantilla..."
              class="w-full p-3 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
            ></textarea>
          </div>
        </div>

        <!-- Pestaña 2: Previsualización en Vivo del PDF -->
        <div v-else class="space-y-3">
          <div class="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
            <span>Vista previa del documento compilado con datos de muestra:</span>
            <button
              type="button"
              @click="generarPrevisualizacion"
              class="px-2.5 py-1 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded text-xs transition"
            >
              Actualizar Vista Previa
            </button>
          </div>

          <div class="rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
            <iframe
              v-if="pdfPreviewUri"
              :src="pdfPreviewUri"
              class="w-full h-[500px] bg-zinc-100 dark:bg-zinc-900"
              title="Vista previa PDF"
            ></iframe>
            <div v-else class="h-[450px] flex items-center justify-center text-zinc-400 dark:text-zinc-500">
              Generando vista previa del documento...
            </div>
          </div>
        </div>
      </div>

      <!-- Pie del Modal -->
      <div class="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 flex items-center justify-between gap-3">
        <div class="text-[11px] text-zinc-500 dark:text-zinc-400">
          Documento listo para personalización masiva por cartera de clientes
        </div>

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
            @click="guardarPlantilla(false)"
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 rounded-md font-medium transition"
          >
            <Save class="w-3.5 h-3.5" />
            <span>Guardar en Catálogo</span>
          </button>

          <button
            type="button"
            @click="guardarPlantilla(true)"
            class="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-md transition shadow-sm active:scale-95"
          >
            <Send class="w-3.5 h-3.5" />
            <span>Guardar & Enviar Ahora</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
