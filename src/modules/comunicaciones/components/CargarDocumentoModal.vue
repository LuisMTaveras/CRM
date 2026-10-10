<script setup lang="ts">
import { ref, computed } from 'vue';
import { documentParserService, type DocumentoProcesado } from '../services/document-parser.service';
import { emailService } from '../services/email.service';
import { empresaService } from '@/modules/configuracion/services/empresa.service';
import { pdfGeneratorService } from '../services/pdf-generator.service';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import { formatDate, formatCurrency } from '@/core/formatters/formatters';
import type { PlantillaDocumento, CategoriaPlantilla, VariablesPlantilla } from '../types/comunicacion.types';
import AppSelect, { type SelectOption } from '@/shared/components/AppSelect.vue';
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
  AlertCircle,
  Mail,
  PenTool,
  ChevronRight,
  ChevronLeft,
  Search,
  Check,
  Building2,
  User,
  DollarSign,
  Layers,
  Heading,
  ListPlus,
  RotateCcw,
  Trash2,
  Calculator,
  Plus,
  Tag
} from 'lucide-vue-next';
import { catalogoService } from '../services/catalogo.service';
import type { LineaCotizacion, MonedaCotizacion } from '../types/catalogo.types';

defineProps<{
  abierto: boolean;
}>();

const emit = defineEmits<{
  (e: 'cerrar'): void;
  (e: 'plantillaCreada', plantilla: PlantillaDocumento, enviarInmediato: boolean): void;
}>();

const authStore = useAuthStore();

// Control de Pasos (Step Wizard)
const pasoActual = ref<1 | 2 | 3 | 4>(1);

const pasos = [
  { id: 1, numero: 1, titulo: 'Origen & Archivo', descripcion: 'Datos y documento base' },
  { id: 2, numero: 2, titulo: 'Mensaje de Correo', descripcion: 'Texto del correo saliente' },
  { id: 3, numero: 3, titulo: 'Redacción del PDF A4', descripcion: 'Cuerpo oficial & variables' },
  { id: 4, numero: 4, titulo: 'Vista Previa Final', descripcion: 'Compilación y verificación' },
];

// Estado de Carga de Archivo
const arrastrando = ref(false);
const procesandoArchivo = ref(false);
const documentoCargado = ref<DocumentoProcesado | null>(null);
const errorFormulario = ref<string | null>(null);
const inputArchivoRef = ref<HTMLInputElement | null>(null);

// Campos del Formulario de Plantilla
const nombrePlantilla = ref('');
const categoria = ref<CategoriaPlantilla>('propuesta');
const asuntoEmail = ref('');
const cuerpoEmail = ref('');
const tituloDocumento = ref('');
const contenidoDocumento = ref('');

// Referencias a los textareas para inserción en el cursor
const textareaPdfRef = ref<HTMLTextAreaElement | null>(null);
const textareaEmailRef = ref<HTMLTextAreaElement | null>(null);

// Opciones de Categoría con Selector Estándar
const opcionesCategoria: Array<SelectOption<CategoriaPlantilla>> = [
  { value: 'propuesta', label: 'Propuesta Comercial', dotColor: 'bg-indigo-400' },
  { value: 'legal', label: 'Legal / Contrato', dotColor: 'bg-amber-400' },
  { value: 'comercial', label: 'Cotización / Venta', dotColor: 'bg-emerald-400' },
  { value: 'cobranza', label: 'Aviso de Cobranza', dotColor: 'bg-rose-400' },
];

// Vista Previa de PDF
const pdfPreviewUri = ref('');
const generandoPreview = ref(false);

// --- ESTADO DEL COTIZADOR B2B CPQ ---
const incluirCotizador = ref(true);
const monedaCotizacion = ref<MonedaCotizacion>('DOP');
const catalogoDisponible = catalogoService.obtenerCatalogo();
const servicioSeleccionadoId = ref('');

const lineasCotizacion = ref<LineaCotizacion[]>([
  catalogoService.crearLineaDesdeItem(catalogoDisponible[0], 1, 0),
  catalogoService.crearLineaDesdeItem(catalogoDisponible[1], 1, 5),
]);

const resumenCotizacion = computed(() => {
  return catalogoService.calcularResumen(lineasCotizacion.value, monedaCotizacion.value);
});

const agregarLineaDesdeCatalogo = () => {
  if (!servicioSeleccionadoId.value) return;
  const item = catalogoService.obtenerItemPorId(servicioSeleccionadoId.value);
  if (item) {
    lineasCotizacion.value.push(catalogoService.crearLineaDesdeItem(item, 1, 0));
    servicioSeleccionadoId.value = '';
  }
};

const agregarLineaPersonalizada = () => {
  lineasCotizacion.value.push(
    catalogoService.crearLineaPersonalizada('Servicio Profesional Adicional', 25000, 1, 0, true)
  );
};

const eliminarLineaCotizacion = (id: string) => {
  lineasCotizacion.value = lineasCotizacion.value.filter((l) => l.id !== id);
};

// Biblioteca de Variables Dinámicas Clasificadas
interface VariableDef {
  clave: string;
  etiqueta: string;
  ejemplo: string;
  categoria: 'cliente' | 'contacto' | 'comercial' | 'remitente';
}

const listaVariables: VariableDef[] = [
  { clave: '{{empresa}}', etiqueta: 'Razón Social Cliente', ejemplo: 'Banco BHD León', categoria: 'cliente' },
  { clave: '{{rnc}}', etiqueta: 'RNC Dominicano', ejemplo: '1-01-02345-6', categoria: 'cliente' },
  { clave: '{{ciudad}}', etiqueta: 'Ciudad de Sede', ejemplo: 'Santo Domingo', categoria: 'cliente' },
  { clave: '{{contacto_principal}}', etiqueta: 'Nombre del Contacto', ejemplo: 'Mercedes Gómez', categoria: 'contacto' },
  { clave: '{{cargo_contacto}}', etiqueta: 'Cargo Institucional', ejemplo: 'Directora de Compras', categoria: 'contacto' },
  { clave: '{{monto}}', etiqueta: 'Monto Estimado', ejemplo: 'RD$ 4,500,000.00', categoria: 'comercial' },
  { clave: '{{fecha}}', etiqueta: 'Fecha Actual', ejemplo: '08 oct 2026', categoria: 'comercial' },
  { clave: '{{empresa_remitente}}', etiqueta: 'Nuestra Empresa', ejemplo: 'Alliance Software S.R.L.', categoria: 'remitente' },
  { clave: '{{correo_remitente}}', etiqueta: 'Correo Remitente', ejemplo: 'contacto@alliance.do', categoria: 'remitente' },
];

// Filtro y Búsqueda de Variables en el Paso 3
const busquedaVariable = ref('');
const filtroCategoriaVariable = ref<'todas' | 'cliente' | 'contacto' | 'comercial' | 'remitente'>('todas');

const variablesFiltradas = computed(() => {
  return listaVariables.filter((v) => {
    const coincideCategoria = filtroCategoriaVariable.value === 'todas' || v.categoria === filtroCategoriaVariable.value;
    const coincideBusqueda = 
      !busquedaVariable.value.trim() || 
      v.clave.toLowerCase().includes(busquedaVariable.value.toLowerCase()) || 
      v.etiqueta.toLowerCase().includes(busquedaVariable.value.toLowerCase());
    return coincideCategoria && coincideBusqueda;
  });
});

// Estadísticas del Editor de PDF
const estadisticasEditor = computed(() => {
  const texto = contenidoDocumento.value.trim();
  const palabras = texto ? texto.split(/\s+/).length : 0;
  const lineas = texto ? texto.split('\n').length : 0;
  
  // Variables detectadas
  const regex = /{{([a-zA-Z0-9_]+)}}/g;
  const encontradas = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(texto)) !== null) {
    if (match[1]) encontradas.add(match[1]);
  }

  return {
    palabras,
    lineas,
    totalVariables: encontradas.size,
  };
});

// Inserción en la Posición Exacta del Cursor
const insertarVariableEnPdf = (clave: string) => {
  if (!textareaPdfRef.value) {
    contenidoDocumento.value += ` ${clave} `;
    generarPrevisualizacion();
    return;
  }

  const el = textareaPdfRef.value;
  const inicio = el.selectionStart ?? contenidoDocumento.value.length;
  const fin = el.selectionEnd ?? contenidoDocumento.value.length;
  const anterior = contenidoDocumento.value;

  contenidoDocumento.value = anterior.substring(0, inicio) + ` ${clave} ` + anterior.substring(fin);

  setTimeout(() => {
    el.focus();
    const nuevaPos = inicio + clave.length + 2;
    el.setSelectionRange(nuevaPos, nuevaPos);
  }, 40);

  generarPrevisualizacion();
};

const insertarVariableEnEmail = (clave: string) => {
  if (!textareaEmailRef.value) {
    cuerpoEmail.value += ` ${clave} `;
    return;
  }

  const el = textareaEmailRef.value;
  const inicio = el.selectionStart ?? cuerpoEmail.value.length;
  const fin = el.selectionEnd ?? cuerpoEmail.value.length;
  const anterior = cuerpoEmail.value;

  cuerpoEmail.value = anterior.substring(0, inicio) + ` ${clave} ` + anterior.substring(fin);

  setTimeout(() => {
    el.focus();
    const nuevaPos = inicio + clave.length + 2;
    el.setSelectionRange(nuevaPos, nuevaPos);
  }, 40);
};

// Formato Rápido en el Editor de PDF
const insertarSubtitulo = () => {
  if (!textareaPdfRef.value) return;
  const el = textareaPdfRef.value;
  const inicio = el.selectionStart ?? contenidoDocumento.value.length;
  const bloque = `\n\nCLÁUSULA ESPECIAL: OBJETO DEL CONTRATO\n`;
  contenidoDocumento.value = contenidoDocumento.value.substring(0, inicio) + bloque + contenidoDocumento.value.substring(inicio);
  setTimeout(() => el.focus(), 30);
};

const insertarPuntoLista = () => {
  if (!textareaPdfRef.value) return;
  const el = textareaPdfRef.value;
  const inicio = el.selectionStart ?? contenidoDocumento.value.length;
  const punto = `\n• `;
  contenidoDocumento.value = contenidoDocumento.value.substring(0, inicio) + punto + contenidoDocumento.value.substring(inicio);
  setTimeout(() => el.focus(), 30);
};

// Carga y Procesamiento de Archivo
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
  errorFormulario.value = null;

  try {
    const doc = await documentParserService.procesarArchivo(archivo);
    documentoCargado.value = doc;

    const nombreBase = archivo.name.replace(/\.[^/.]+$/, '');
    nombrePlantilla.value = nombreBase.replace(/[_-]/g, ' ');
    tituloDocumento.value = nombreBase.toUpperCase().replace(/[_-]/g, ' ');
    asuntoEmail.value = `${nombrePlantilla.value} — {{empresa}}`;
    cuerpoEmail.value = `Estimado(a) {{contacto_principal}},\n\nLe hacemos entrega formal de la propuesta "${nombrePlantilla.value}" correspondiente a {{empresa}}, debidamente parametrizada y adjunta en formato PDF oficial.\n\nQuedamos a su entera disposición para cualquier aclaración o reunión de seguimiento.\n\nAtentamente,\n{{empresa_remitente}}\n{{correo_remitente}}`;
    contenidoDocumento.value = doc.contenidoTexto;

    generarPrevisualizacion();
  } catch (err) {
    errorFormulario.value = 'Ocurrió un error al procesar el archivo. Intenta con un formato Word .docx o texto .txt.';
    console.error(err);
  } finally {
    procesandoArchivo.value = false;
  }
};

const iniciarPlantillaVacia = () => {
  nombrePlantilla.value = 'Propuesta Comercial Corporativa';
  tituloDocumento.value = 'PROPUESTA DE SERVICIOS PROFESIONALES';
  asuntoEmail.value = 'Propuesta de Servicios — {{empresa}}';
  cuerpoEmail.value = `Estimado(a) {{contacto_principal}},\n\nEs un placer saludarle. Anexamos la propuesta comercial formal preparada especialmente para {{empresa}}.\n\nEl documento anexo detalla los alcances, condiciones económicas y cronograma estimado de ejecución.\n\nAtentamente,\n{{empresa_remitente}}\n{{correo_remitente}}`;
  contenidoDocumento.value = `PROPUESTA DE SERVICIOS PROFESIONALES

Para: {{empresa}}
Atención: {{contacto_principal}} ({{cargo_contacto}})
RNC: {{rnc}}
Ciudad: {{ciudad}}
Fecha: {{fecha}}

OBJETO DE LA PROPUESTA
El presente documento tiene por finalidad presentar la propuesta formal de servicios técnicos y comerciales, diseñada a la medida de los requerimientos operativos de {{empresa}}.

ALCANCE DE LOS SERVICIOS
• Diagnóstico inicial y levantamiento de requerimientos con el equipo clave.
• Implementación técnica, despliegue operativo y aseguramiento de calidad.
• Capacitación del personal y soporte prioritario pospuesta en marcha.

CONDICIONES COMERCIALES & INVERSIÓN
La inversión estimada para la ejecución de los servicios descritos asciende a un monto de {{monto}}, pagaderos según los hitos acordados en el cronograma de trabajo.

VIGENCIA & ACEPTACIÓN
Esta propuesta cuenta con una vigencia de 30 días calendario a partir de su emisión.`;

  generarPrevisualizacion();
  pasoActual.value = 2;
};

const reemplazarArchivo = () => {
  inputArchivoRef.value?.click();
};

const quitarArchivo = () => {
  documentoCargado.value = null;
};

// Generación de la Previsualización PDF
const generarPrevisualizacion = () => {
  if (!authStore.usuario) return;
  generandoPreview.value = true;

  const plantillaTemporal: PlantillaDocumento = {
    id: 'temp-preview',
    nombre: nombrePlantilla.value || 'Documento Personalizado',
    descripcion: 'Documento subido por el usuario',
    categoria: categoria.value,
    asuntoEmail: asuntoEmail.value,
    cuerpoEmail: cuerpoEmail.value,
    tituloDocumento: tituloDocumento.value || 'DOCUMENTO OFICIAL',
    contenidoDocumento: contenidoDocumento.value || 'Sin contenido especificado',
  };

  const datosEmpresa = empresaService.obtenerDatos();
  const usuarioActivo = authStore.usuario;
  const variablesMuestra: VariablesPlantilla = {
    empresa: 'BANCO BHD LEÓN S.A.',
    contacto_principal: 'Lic. Mercedes Gómez',
    cargo_contacto: 'Directora de Operaciones & TI',
    rnc: '1-01-02345-6',
    ciudad: 'Santo Domingo, D.N.',
    monto: 'RD$ 4,850,000.00',
    fecha: formatDate(new Date().toISOString()),
    empresa_remitente: datosEmpresa.razonSocial || datosEmpresa.nombreComercial || 'Ingeniería de Software Alliance S.R.L.',
    correo_remitente: datosEmpresa.correo || usuarioActivo?.email || 'contacto@alliance.do',
    telefono_remitente: datosEmpresa.telefono || '+1 (809) 555-0100',
    ejecutivo: usuarioActivo?.nombre || 'Luis M. Taveras',
    cargo_ejecutivo: usuarioActivo?.cargo || 'Key Account Executive B2B',
    correo_ejecutivo: usuarioActivo?.email || datosEmpresa.correo || 'luismiguel@alliance.do',
    telefono_ejecutivo: usuarioActivo?.telefonoFlota || datosEmpresa.telefono || '+1 (829) 708-4706',
    flota_ejecutivo: usuarioActivo?.telefonoFlota || datosEmpresa.telefono || '+1 (829) 708-4706',
    departamento_ejecutivo: usuarioActivo?.departamento || 'Consultoría & Cuentas Corporativas',
    empresa_emisora: datosEmpresa.razonSocial || datosEmpresa.nombreComercial || 'Ingeniería de Software Alliance S.R.L.',
    rnc_empresa_emisora: datosEmpresa.identificacionFiscal || '1-32-45890-1',
    web_empresa_emisora: datosEmpresa.sitioWeb || 'alliance.do',
    direccion_empresa_emisora: datosEmpresa.direccion || 'Av. Winston Churchill No. 1099, Torre Acrópolis Piso 14, Piantini',
  };

  const cotizacionActiva = incluirCotizador.value && lineasCotizacion.value.length > 0 ? resumenCotizacion.value : undefined;
  if (cotizacionActiva) {
    variablesMuestra.monto = formatCurrency(cotizacionActiva.totalPagar, monedaCotizacion.value);
  }

  try {
    pdfPreviewUri.value = pdfGeneratorService.obtenerDataUri(plantillaTemporal, variablesMuestra, cotizacionActiva);
  } catch (e) {
    console.error('Error al generar preview en CargarDocumentoModal:', e);
  } finally {
    generandoPreview.value = false;
  }
};

// Navegación entre Pasos
const irAlPaso = (nuevoPaso: 1 | 2 | 3 | 4) => {
  errorFormulario.value = null;

  // Validación básica al avanzar
  if (nuevoPaso > 1 && !nombrePlantilla.value.trim()) {
    errorFormulario.value = 'Por favor ingresa un nombre para la plantilla antes de continuar.';
    return;
  }

  if (nuevoPaso === 4) {
    generarPrevisualizacion();
  }

  pasoActual.value = nuevoPaso;
};

const avanzarPaso = () => {
  if (pasoActual.value < 4) {
    irAlPaso((pasoActual.value + 1) as 1 | 2 | 3 | 4);
  }
};

const retrocederPaso = () => {
  if (pasoActual.value > 1) {
    irAlPaso((pasoActual.value - 1) as 1 | 2 | 3 | 4);
  }
};

// Guardado de Plantilla
const guardarPlantilla = (enviarInmediato = false) => {
  if (!nombrePlantilla.value.trim() || !contenidoDocumento.value.trim()) {
    errorFormulario.value = 'Debes completar al menos el nombre y el contenido del documento oficial.';
    pasoActual.value = !nombrePlantilla.value.trim() ? 1 : 3;
    return;
  }

  const nuevaPlantilla: PlantillaDocumento = {
    id: `plt-custom-${Date.now()}`,
    nombre: nombrePlantilla.value.trim(),
    descripcion: `Plantilla corporativa clasificada en ${categoria.value}.`,
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
  <div v-if="abierto" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
    <!-- Backdrop oscuro con desenfoque -->
    <div @click="emit('cerrar')" class="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"></div>

    <!-- Modal Card Amplio (Studio Container) -->
    <div class="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-5xl lg:max-w-6xl h-[90vh] flex flex-col z-10 overflow-hidden text-xs transition-colors">
      
      <!-- ==================== ENCABEZADO SUPERIOR ==================== -->
      <div class="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
            <UploadCloud class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                Estudio de Documentos & Plantillas de Envío
              </h2>
              <span class="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-semibold">
                Word (.docx) • PDF A4 • Variables B2B
              </span>
            </div>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
              Parametriza propuestas comerciales, acuerdos y contratos masivos con sustitución dinámica
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="emit('cerrar')"
          class="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
          title="Cerrar ventana"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- ==================== STEPPER / BARRA DE PASOS SEGMENTADA ==================== -->
      <div class="px-6 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/50 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
        <div class="flex items-center gap-1 sm:gap-2 min-w-max">
          <button
            v-for="paso in pasos"
            :key="paso.id"
            type="button"
            @click="irAlPaso(paso.id as 1 | 2 | 3 | 4)"
            class="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
            :class="pasoActual === paso.id
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : pasoActual > paso.id
                ? 'bg-zinc-200/80 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'"
          >
            <span
              class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
              :class="pasoActual === paso.id
                ? 'bg-white text-indigo-700'
                : pasoActual > paso.id
                  ? 'bg-emerald-500 text-white'
                  : 'bg-zinc-300 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'"
            >
              <Check v-if="pasoActual > paso.id" class="w-3 h-3 stroke-[3]" />
              <span v-else>{{ paso.numero }}</span>
            </span>
            <span>{{ paso.titulo }}</span>
          </button>
        </div>

        <!-- Badge de archivo si está activo -->
        <div v-if="documentoCargado" class="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg shrink-0">
          <CheckCircle2 class="w-3.5 h-3.5" />
          <span class="truncate max-w-[160px]">{{ documentoCargado.nombreArchivo }}</span>
        </div>
      </div>

      <!-- Alerta de Error si ocurre -->
      <div v-if="errorFormulario" class="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 rounded-xl flex items-center gap-2 text-xs shrink-0">
        <AlertCircle class="w-4 h-4 text-rose-500 shrink-0" />
        <span class="flex-1">{{ errorFormulario }}</span>
        <button type="button" @click="errorFormulario = null" class="text-rose-400 hover:text-rose-600">
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- ==================== CONTENIDO DEL PASO (SCROLLEABLE) ==================== -->
      <div class="flex-1 overflow-y-auto p-6 bg-zinc-50/40 dark:bg-zinc-950/20">

        <!-- ==================== PASO 1: ORIGEN & ARCHIVO ==================== -->
        <div v-if="pasoActual === 1" class="space-y-6 max-w-4xl mx-auto">
          <!-- Tarjeta de Origen del Documento -->
          <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <FileText class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>1. Origen del Documento Base</span>
              </h3>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Puedes importar un archivo existente de Word (.docx) o redactar una plantilla desde cero
              </p>
            </div>

            <!-- Estado A: Archivo ya cargado -->
            <div
              v-if="documentoCargado"
              class="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div class="flex items-center gap-3.5">
                <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <FileText class="w-5 h-5" />
                </div>
                <div>
                  <div class="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span>{{ documentoCargado.nombreArchivo }}</span>
                    <span class="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold">
                      Texto extraído ✓
                    </span>
                  </div>
                  <div class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {{ (documentoCargado.tamanoBytes / 1024).toFixed(1) }} KB
                    <span v-if="documentoCargado.variablesDetectadas.length" class="text-indigo-600 dark:text-indigo-400 ml-1">
                      • {{ documentoCargado.variablesDetectadas.length }} variables dinámicas detectadas
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  @click="reemplazarArchivo"
                  class="px-3 py-1.5 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition shadow-sm"
                >
                  Cambiar archivo
                </button>
                <button
                  type="button"
                  @click="quitarArchivo"
                  class="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition"
                  title="Quitar archivo adjunto"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Estado B: Dropzone de Selección -->
            <div
              v-else
              @dragover.prevent="arrastrando = true"
              @dragleave.prevent="arrastrando = false"
              @drop.prevent="manejarDrop"
              :class="[
                'border-2 border-dashed rounded-2xl p-8 text-center transition-all flex flex-col items-center justify-center gap-3 cursor-pointer',
                arrastrando
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 scale-[1.01]'
                  : 'border-zinc-300 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 text-zinc-600 dark:text-zinc-400 hover:border-indigo-400 dark:hover:border-indigo-500/50'
              ]"
              @click="inputArchivoRef?.click()"
            >
              <input
                ref="inputArchivoRef"
                type="file"
                accept=".docx,.doc,.txt,.md,.pdf,.rtf"
                class="hidden"
                @change="manejarSeleccionArchivo"
              />

              <div class="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm">
                <Loader2 v-if="procesandoArchivo" class="w-7 h-7 animate-spin" />
                <UploadCloud v-else class="w-7 h-7" />
              </div>

              <div class="space-y-1">
                <div class="font-bold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">
                  {{ procesandoArchivo ? 'Extrayendo contenido y variables del documento...' : 'Haz clic para seleccionar o arrastra tu archivo Word (.docx) o PDF' }}
                </div>
                <p class="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                  El motor inteligente procesará el texto, identificará cláusulas y preparará los marcadores de sustitución.
                </p>
              </div>

              <div class="pt-2">
                <button
                  type="button"
                  @click.stop="iniciarPlantillaVacia"
                  class="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                >
                  <Sparkles class="w-3.5 h-3.5" />
                  <span>¿Prefieres empezar sin archivo? Usar modelo comercial base</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Tarjeta de Identificación & Categoría -->
          <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Layers class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>2. Identificación & Categorización de la Plantilla</span>
              </h3>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Define el nombre oficial con el que se registrará en el catálogo comercial del CRM
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="sm:col-span-2 space-y-1">
                <label class="block text-zinc-700 dark:text-zinc-300 font-semibold text-xs">
                  Nombre de la Plantilla / Documento *
                </label>
                <input
                  v-model="nombrePlantilla"
                  type="text"
                  placeholder="ej: Propuesta Técnica y Comercial de Infraestructura TI"
                  class="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition font-medium"
                />
              </div>

              <div class="space-y-1">
                <label class="block text-zinc-700 dark:text-zinc-300 font-semibold text-xs">
                  Categoría Operativa *
                </label>
                <AppSelect
                  :model-value="categoria"
                  @update:model-value="(nuevo) => categoria = nuevo as CategoriaPlantilla"
                  :options="opcionesCategoria"
                  :full-width="true"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== PASO 2: MENSAJE DE CORREO ==================== -->
        <div v-if="pasoActual === 2" class="space-y-6 max-w-4xl mx-auto">
          <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Mail class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Mensaje de Correo Electrónico (Cuerpo del Envío)</span>
              </h3>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Este es el correo que tu cliente recibirá en su bandeja. El documento oficial en PDF se adjuntará automáticamente.
              </p>
            </div>

            <!-- Asunto del Correo -->
            <div class="space-y-1.5">
              <label class="block text-zinc-700 dark:text-zinc-300 font-semibold text-xs">
                Asunto del Correo Electrónico *
              </label>
              <input
                v-model="asuntoEmail"
                type="text"
                placeholder="ej: Entrega de Propuesta Comercial — {{empresa}}"
                class="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition font-medium"
              />
            </div>

            <!-- Chips de Variables para el Correo -->
            <div class="p-3.5 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-zinc-800/80 space-y-2">
              <div class="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                <span class="flex items-center gap-1.5 font-medium">
                  <Sparkles class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Haz clic para insertar variable en el cursor del mensaje:
                </span>
                <span class="font-mono text-[10px]">Sustitución personalizada</span>
              </div>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="v in listaVariables"
                  :key="v.clave"
                  type="button"
                  @click="insertarVariableEnEmail(v.clave)"
                  class="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 text-indigo-600 dark:text-indigo-400 font-mono text-[10px] transition shadow-sm hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                >
                  + {{ v.clave }}
                </button>
              </div>
            </div>

            <!-- Cuerpo del Correo -->
            <div class="space-y-1.5">
              <label class="block text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center justify-between">
                <span>Cuerpo del Correo</span>
                <span class="text-zinc-400 font-normal text-[10px]">Soporta saltos de línea y firmas corporativas automáticas</span>
              </label>
              <textarea
                ref="textareaEmailRef"
                v-model="cuerpoEmail"
                rows="7"
                placeholder="Estimado(a) {{contacto_principal}},&#10;&#10;Nos dirigimos a usted para presentarle la propuesta formal..."
                class="w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 font-sans leading-relaxed transition"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- ==================== PASO 3: REDACCIÓN DEL DOCUMENTO OFICIAL (PDF A4) ==================== -->
        <div v-if="pasoActual === 3" class="space-y-4 max-w-6xl mx-auto">
          <!-- Título Oficial del PDF -->
          <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-2">
            <div class="flex items-center gap-2">
              <PenTool class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span class="font-bold text-xs text-zinc-900 dark:text-zinc-100">Membrete & Título Oficial en la Hoja A4</span>
            </div>
            <label class="block text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center justify-between">
              <span>Título Oficial en el Encabezado</span>
              <span class="text-zinc-400 text-[10px] font-mono">Aparece en letras destacadas</span>
            </label>
            <input
              v-model="tituloDocumento"
              type="text"
              placeholder="PROPUESTA TÉCNICA Y ECONÓMICA DE SERVICIOS"
              class="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 uppercase font-semibold transition tracking-wide"
            />
          </div>

          <!-- Layout Dividido: Editor Principal (8 cols) + Biblioteca de Variables (4 cols) -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            <!-- COLUMNA 1: EDITOR DE TEXTO DEL PDF (8 cols) -->
            <div class="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col space-y-3">
              <!-- Barra de Formato Rápido & Estadísticas -->
              <div class="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 flex-wrap gap-2">
                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    @click="insertarSubtitulo"
                    class="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-[11px] font-medium transition flex items-center gap-1"
                    title="Insertar línea en mayúsculas como subtítulo"
                  >
                    <Heading class="w-3.5 h-3.5 text-indigo-500" />
                    <span>+ Subtítulo</span>
                  </button>

                  <button
                    type="button"
                    @click="insertarPuntoLista"
                    class="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-[11px] font-medium transition flex items-center gap-1"
                    title="Insertar viñeta"
                  >
                    <ListPlus class="w-3.5 h-3.5 text-emerald-500" />
                    <span>• Viñeta</span>
                  </button>
                </div>

                <!-- Estadísticas del Documento -->
                <div class="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 flex items-center gap-3">
                  <span>{{ estadisticasEditor.palabras }} palabras</span>
                  <span>{{ estadisticasEditor.lineas }} líneas</span>
                  <span class="text-indigo-600 dark:text-indigo-400 font-semibold">{{ estadisticasEditor.totalVariables }} variables</span>
                </div>
              </div>

              <!-- Textarea Amplio y Cómodo para Digitar -->
              <div class="flex-1 min-h-[360px]">
                <textarea
                  ref="textareaPdfRef"
                  v-model="contenidoDocumento"
                  rows="16"
                  placeholder="Escribe o pega aquí el contenido de la propuesta oficial, cláusulas, alcances o presupuesto..."
                  class="w-full h-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 font-sans leading-relaxed resize-y transition shadow-inner"
                ></textarea>
              </div>

              <div class="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center justify-between pt-1">
                <span>Las líneas escritas completamente en MAYÚSCULAS se compilan como encabezados destacados en el PDF.</span>
              </div>
            </div>

            <!-- COLUMNA 2: BIBLIOTECA DE VARIABLES DINÁMICAS (4 cols) -->
            <div class="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col space-y-3.5">
              <div class="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <div class="flex items-center gap-2">
                  <Sparkles class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span class="font-bold text-xs text-zinc-900 dark:text-zinc-100">Variables Dinámicas</span>
                </div>
                <span class="text-[10px] font-mono text-zinc-400">Clic para insertar</span>
              </div>

              <!-- Búsqueda de Variables -->
              <div class="relative">
                <Search class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  v-model="busquedaVariable"
                  type="text"
                  placeholder="Buscar variable..."
                  class="w-full pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <!-- Filtro de Categoría de Variables -->
              <div class="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
                <button
                  type="button"
                  @click="filtroCategoriaVariable = 'todas'"
                  class="px-2 py-0.5 rounded-lg font-semibold transition shrink-0"
                  :class="filtroCategoriaVariable === 'todas' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
                >
                  Todas
                </button>
                <button
                  type="button"
                  @click="filtroCategoriaVariable = 'cliente'"
                  class="px-2 py-0.5 rounded-lg font-semibold transition shrink-0 flex items-center gap-1"
                  :class="filtroCategoriaVariable === 'cliente' ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
                >
                  <Building2 class="w-3 h-3" />
                  <span>Cliente</span>
                </button>
                <button
                  type="button"
                  @click="filtroCategoriaVariable = 'contacto'"
                  class="px-2 py-0.5 rounded-lg font-semibold transition shrink-0 flex items-center gap-1"
                  :class="filtroCategoriaVariable === 'contacto' ? 'bg-amber-600 text-white' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
                >
                  <User class="w-3 h-3" />
                  <span>Contacto</span>
                </button>
                <button
                  type="button"
                  @click="filtroCategoriaVariable = 'comercial'"
                  class="px-2 py-0.5 rounded-lg font-semibold transition shrink-0 flex items-center gap-1"
                  :class="filtroCategoriaVariable === 'comercial' ? 'bg-emerald-600 text-white' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
                >
                  <DollarSign class="w-3 h-3" />
                  <span>Comercial</span>
                </button>
              </div>

              <!-- Lista scrolleable de Variables con Tooltip de Ejemplo -->
              <div class="flex-1 overflow-y-auto space-y-2 max-h-[350px] pr-1">
                <div
                  v-for="v in variablesFiltradas"
                  :key="v.clave"
                  @click="insertarVariableEnPdf(v.clave)"
                  class="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/80 bg-zinc-50/60 dark:bg-zinc-950/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 cursor-pointer transition flex items-center justify-between group shadow-sm"
                  :title="`Haz clic para insertar ${v.clave} en la posición del cursor`"
                >
                  <div class="min-w-0">
                    <div class="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition">
                      {{ v.clave }}
                    </div>
                    <div class="text-[11px] text-zinc-600 dark:text-zinc-300 font-medium truncate">
                      {{ v.etiqueta }}
                    </div>
                    <div class="text-[10px] text-zinc-400 font-mono">
                      ej: {{ v.ejemplo }}
                    </div>
                  </div>

                  <span class="w-6 h-6 rounded-lg bg-zinc-200/80 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 group-hover:bg-indigo-600 group-hover:text-white transition font-bold text-xs shrink-0">
                    +
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- MÓDULO CPQ: COTIZADOR B2B & PARTIDAS PRESUPUESTARIAS -->
          <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <!-- Encabezado del Cotizador -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 gap-3">
              <div class="flex items-center gap-2.5">
                <div class="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <Calculator class="w-4 h-4" />
                </div>
                <div>
                  <h4 class="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span>Cotizador B2B & Desglose de Precios (CPQ)</span>
                    <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      ITBIS 18% Fiscal DGII
                    </span>
                  </h4>
                  <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Añade partidas del catálogo maestro o conceptos personalizados para incrustar la tabla formal en el PDF
                  </p>
                </div>
              </div>

              <!-- Selector de Divisa & Toggle de Inclusión -->
              <div class="flex items-center gap-3">
                <div class="flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[11px]">
                  <button
                    type="button"
                    @click="monedaCotizacion = 'DOP'"
                    :class="[
                      'px-2.5 py-1 rounded-lg font-semibold transition',
                      monedaCotizacion === 'DOP'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                    ]"
                  >
                    DOP (RD$)
                  </button>
                  <button
                    type="button"
                    @click="monedaCotizacion = 'USD'"
                    :class="[
                      'px-2.5 py-1 rounded-lg font-semibold transition',
                      monedaCotizacion === 'USD'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                    ]"
                  >
                    USD ($)
                  </button>
                </div>

                <label class="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  <input
                    v-model="incluirCotizador"
                    type="checkbox"
                    class="rounded text-indigo-600 focus:ring-0 bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700"
                  />
                  <span>Incluir en PDF</span>
                </label>
              </div>
            </div>

            <div v-if="incluirCotizador" class="space-y-4">
              <!-- Barra de Inserción de Líneas -->
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-zinc-50 dark:bg-zinc-950/70 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
                <div class="flex-1 flex items-center gap-2">
                  <Tag class="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <select
                    v-model="servicioSeleccionadoId"
                    class="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Seleccionar Servicio del Catálogo Maestro --</option>
                    <option v-for="item in catalogoDisponible" :key="item.id" :value="item.id">
                      [{{ item.codigo }}] {{ item.nombre }} ({{ formatCurrency(item.precioBase, item.moneda) }} / {{ item.unidadMedida }})
                    </option>
                  </select>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    @click="agregarLineaDesdeCatalogo"
                    :disabled="!servicioSeleccionadoId"
                    class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition flex items-center gap-1 shadow-sm"
                  >
                    <Plus class="w-3.5 h-3.5" />
                    <span>Agregar del Catálogo</span>
                  </button>
                  <button
                    type="button"
                    @click="agregarLineaPersonalizada"
                    class="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium transition flex items-center gap-1 border border-zinc-200 dark:border-zinc-700"
                  >
                    <Plus class="w-3.5 h-3.5" />
                    <span>Línea Libre</span>
                  </button>
                </div>
              </div>

              <!-- Tabla de Partidas Presupuestarias -->
              <div class="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-zinc-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 text-[11px] font-semibold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                      <th class="py-2.5 px-3">Concepto / Partida</th>
                      <th class="py-2.5 px-2 text-center w-20">Cant.</th>
                      <th class="py-2.5 px-3 text-right w-32">Precio Unit.</th>
                      <th class="py-2.5 px-2 text-center w-24">Descto %</th>
                      <th class="py-2.5 px-3 text-center w-20">ITBIS</th>
                      <th class="py-2.5 px-3 text-right w-36">Total Partida</th>
                      <th class="py-2.5 px-2 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800/80 text-xs">
                    <tr
                      v-for="linea in lineasCotizacion"
                      :key="linea.id"
                      class="hover:bg-zinc-50/70 dark:hover:bg-zinc-950/40 transition"
                    >
                      <!-- Concepto -->
                      <td class="py-2 px-3">
                        <input
                          v-model="linea.concepto"
                          type="text"
                          class="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </td>

                      <!-- Cantidad -->
                      <td class="py-2 px-2 text-center">
                        <input
                          v-model.number="linea.cantidad"
                          type="number"
                          min="1"
                          class="w-16 px-1.5 py-1 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-900 dark:text-zinc-100 text-xs font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </td>

                      <!-- Precio Unitario -->
                      <td class="py-2 px-3 text-right">
                        <input
                          v-model.number="linea.precioUnitario"
                          type="number"
                          min="0"
                          step="100"
                          class="w-28 px-2 py-1 text-right bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-900 dark:text-zinc-100 text-xs font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </td>

                      <!-- Descuento % -->
                      <td class="py-2 px-2 text-center">
                        <input
                          v-model.number="linea.descuentoPorcentaje"
                          type="number"
                          min="0"
                          max="100"
                          class="w-16 px-1.5 py-1 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-900 dark:text-zinc-100 text-xs font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </td>

                      <!-- Aplica ITBIS -->
                      <td class="py-2 px-3 text-center">
                        <span
                          v-if="linea.aplicaItbis"
                          class="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                        >
                          18%
                        </span>
                        <span
                          v-else
                          class="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                        >
                          Exento
                        </span>
                      </td>

                      <!-- Total Partida -->
                      <td class="py-2 px-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {{ formatCurrency(catalogoService.recalcularLinea(linea).total, monedaCotizacion) }}
                      </td>

                      <!-- Eliminar -->
                      <td class="py-2 px-2 text-center">
                        <button
                          type="button"
                          @click="eliminarLineaCotizacion(linea.id)"
                          class="p-1 text-zinc-400 hover:text-rose-500 rounded transition"
                          title="Eliminar partida"
                        >
                          <Trash2 class="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                    <tr v-if="lineasCotizacion.length === 0">
                      <td colspan="7" class="py-6 text-center text-zinc-400">
                        No hay partidas presupuestarias agregadas en esta propuesta.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Bloque Resumen de Totales -->
              <div class="flex justify-end pt-2">
                <div class="w-full sm:w-80 bg-zinc-50 dark:bg-zinc-950/80 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
                  <div class="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Subtotal Bruto:</span>
                    <span class="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                      {{ formatCurrency(resumenCotizacion.subtotalBruto, monedaCotizacion) }}
                    </span>
                  </div>

                  <div v-if="resumenCotizacion.descuentoTotal > 0" class="flex justify-between text-amber-600 dark:text-amber-400">
                    <span>Descuento Comercial:</span>
                    <span class="font-mono font-medium">
                      -{{ formatCurrency(resumenCotizacion.descuentoTotal, monedaCotizacion) }}
                    </span>
                  </div>

                  <div class="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Subtotal Neto:</span>
                    <span class="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                      {{ formatCurrency(resumenCotizacion.subtotalNeto, monedaCotizacion) }}
                    </span>
                  </div>

                  <div class="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>ITBIS (18% Fiscal DGII):</span>
                    <span class="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                      {{ formatCurrency(resumenCotizacion.itbisTotal, monedaCotizacion) }}
                    </span>
                  </div>

                  <div class="flex justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800 text-sm font-bold text-zinc-900 dark:text-white">
                    <span>TOTAL A PAGAR:</span>
                    <span class="font-mono text-indigo-600 dark:text-indigo-400">
                      {{ formatCurrency(resumenCotizacion.totalPagar, monedaCotizacion) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== PASO 4: VISTA PREVIA FINAL (PDF) ==================== -->
        <div v-if="pasoActual === 4" class="space-y-4 max-w-5xl mx-auto">
          <!-- Barra de Control de la Previsualización -->
          <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
                <Eye class="w-4 h-4" />
              </div>
              <div>
                <div class="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                  Simulación de Hoja A4 con Datos Reales de Cartera
                </div>
                <div class="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Visualiza cómo se compilará el documento oficial con membrete corporativo, firmas y sellos
                </div>
              </div>
            </div>

            <button
              type="button"
              @click="generarPrevisualizacion"
              :disabled="generandoPreview"
              class="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-semibold transition border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5 self-end sm:self-auto disabled:opacity-50"
            >
              <RotateCcw :class="['w-3.5 h-3.5', generandoPreview ? 'animate-spin text-indigo-500' : '']" />
              <span>Actualizar Previsualización</span>
            </button>
          </div>

          <!-- Visor del PDF A4 Compilado -->
          <div class="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 shadow-md">
            <iframe
              v-if="pdfPreviewUri"
              :src="pdfPreviewUri"
              class="w-full h-[520px] bg-white dark:bg-zinc-950"
              title="Previsualización en vivo del PDF A4"
            ></iframe>
            <div v-else class="h-[460px] flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 gap-2">
              <Loader2 class="w-6 h-6 animate-spin text-indigo-500" />
              <span>Compilando documento oficial en PDF...</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== PIE DEL MODAL CON ACCIONES ==================== -->
      <div class="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-3 shrink-0">
        <!-- Lado Izquierdo: Estado del Paso y Botón Anterior -->
        <div class="flex items-center gap-2">
          <button
            v-if="pasoActual > 1"
            type="button"
            @click="retrocederPaso"
            class="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
          >
            <ChevronLeft class="w-4 h-4" />
            <span>Anterior</span>
          </button>

          <span class="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:inline">
            Paso {{ pasoActual }} de 4: <strong class="text-zinc-800 dark:text-zinc-200">{{ pasos[pasoActual - 1].titulo }}</strong>
          </span>
        </div>

        <!-- Lado Derecho: Cancelar, Siguiente y Guardar -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="emit('cerrar')"
            class="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-medium transition"
          >
            Cancelar
          </button>

          <button
            v-if="pasoActual < 4"
            type="button"
            @click="avanzarPaso"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-indigo-950/20 active:scale-95"
          >
            <span>Siguiente</span>
            <ChevronRight class="w-4 h-4" />
          </button>

          <button
            type="button"
            @click="guardarPlantilla(false)"
            class="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
          >
            <Save class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span class="hidden sm:inline">Guardar en Catálogo</span>
            <span class="sm:hidden">Guardar</span>
          </button>

          <button
            type="button"
            @click="guardarPlantilla(true)"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition flex items-center gap-2 shadow-sm shadow-emerald-950/20 active:scale-95"
          >
            <Send class="w-3.5 h-3.5" />
            <span>Guardar & Enviar Ahora</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
