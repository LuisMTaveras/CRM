<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import { emailService } from '../services/email.service';
import { smtpService } from '../services/smtp.service';
import { empresaService } from '@/modules/configuracion/services/empresa.service';
import { pdfGeneratorService } from '../services/pdf-generator.service';
import type { Cliente } from '@/modules/clientes/types/cliente.types';
import type { PlantillaDocumento, RegistroEnvio } from '../types/comunicacion.types';
import type { Usuario } from '@/modules/auth/types/auth.types';
import { 
  X, 
  Mail, 
  FileText, 
  Send, 
  Download, 
  Eye, 
  CheckCircle2, 
  Users, 
  Loader2, 
  UploadCloud
} from 'lucide-vue-next';
import { documentParserService } from '../services/document-parser.service';
import { toastService } from '@/core/notifications/toast.service';

const props = defineProps<{
  abierto: boolean;
  clientes: Cliente[];
  plantillaInicial?: PlantillaDocumento;
}>();

const emit = defineEmits<{
  (e: 'cerrar'): void;
  (e: 'completado'): void;
}>();

const authStore = useAuthStore();
const plantillas = ref<PlantillaDocumento[]>(emailService.obtenerPlantillas());
const plantillaSeleccionadaId = ref<string>(props.plantillaInicial?.id || plantillas.value[0]?.id || '');

const asuntoPersonalizado = ref(props.plantillaInicial?.asuntoEmail || '');
const cuerpoPersonalizado = ref(props.plantillaInicial?.cuerpoEmail || '');
const modoVista = ref<'editor' | 'previa'>('editor');
const clientePreviewIndex = ref(0);
const pdfDataUri = ref('');
const correoPruebaManual = ref('');

// Selección reactiva de clientes destinatarios
const clientesSeleccionadosIds = ref<string[]>(props.clientes.map((c) => c.id));

// Estado de Envío
const enviando = ref(false);
const progresoEnvio = ref({ actual: 0, total: 0, porcentaje: 0 });
const registrosCompletados = ref<RegistroEnvio[]>([]);
const envioFinalizado = ref(false);

// Carga directa de archivo Word / PDF dentro del modal
const procesandoDocxModal = ref(false);
const inputArchivoModal = ref<HTMLInputElement | null>(null);

// Cliente muestra de respaldo para la previsualización PDF cuando la cartera esté limpia
const clienteMuestraPreview: Cliente = {
  id: 'cli-ejemplo',
  codigo: 'CLI-001',
  razon_social: 'Empresa Destinataria S.A.',
  nombre_comercial: 'Cliente Corporativo',
  identificacion_fiscal: '1-01-00000-0',
  sector: 'Comercial',
  estado: 'prospecto',
  prioridad: 'alta',
  email: 'contacto@ejemplo.com.do',
  telefono: '+1 (809) 555-0100',
  ciudad: 'Santo Domingo',
  pais: 'República Dominicana',
  valor_estimado: 5000000,
  responsable: 'Departamento Comercial',
  creado_en: new Date().toISOString(),
  contactos: [
    {
      id: 'cnt-ejemplo',
      cliente_id: 'cli-ejemplo',
      nombre: 'Lic. Juan Pérez',
      cargo: 'Director General',
      email: 'jperez@ejemplo.com.do',
      telefono: '+1 (809) 555-0100',
      es_principal: true,
      creado_en: new Date().toISOString(),
    }
  ],
};

// Remitente seguro con fallback corporativo garantizado
const usuarioRemitente = computed<Omit<Usuario, 'contrasena'>>(() => {
  if (authStore.usuario) return authStore.usuario;
  const smtp = smtpService.obtenerConfiguracion();
  const emp = empresaService.obtenerDatos();
  return {
    id: 'usr-default',
    nombre: smtp.nombreRemitente || emp.razonSocial || 'Departamento Comercial',
    email: smtp.correoRemitente || 'ventas@empresa.com.do',
    rol: 'admin',
    rolNombre: 'Directora Comercial & Admin',
    cargo: 'Head of Sales & CRM Admin',
    avatar: 'CM',
    activo: true,
    ultimoAcceso: new Date().toISOString(),
  };
});

const plantillaActual = computed(() => {
  return plantillas.value.find((p) => p.id === plantillaSeleccionadaId.value) || plantillas.value[0];
});

const clientesParaEnvioEfectivo = computed(() => {
  return props.clientes.filter((c) => clientesSeleccionadosIds.value.includes(c.id));
});

const todosSeleccionados = computed(() => {
  return props.clientes.length > 0 && clientesSeleccionadosIds.value.length === props.clientes.length;
});

const clienteParaPrevia = computed(() => {
  if (clientesParaEnvioEfectivo.value.length === 0) {
    return props.clientes[0] || clienteMuestraPreview;
  }
  return clientesParaEnvioEfectivo.value[clientePreviewIndex.value] || clientesParaEnvioEfectivo.value[0] || clienteMuestraPreview;
});

// Función de generación PDF declarada antes de los watchers para evitar problemas de hoisting
function generarVistaPreviaPdf() {
  try {
    if (!plantillaActual.value) return;
    const clienteTarget = clienteParaPrevia.value || clienteMuestraPreview;
    const variables = emailService.construirVariables(clienteTarget, usuarioRemitente.value);
    pdfDataUri.value = pdfGeneratorService.obtenerDataUri(plantillaActual.value, variables);
  } catch (err) {
    console.error('Error al generar vista previa del PDF:', err);
  }
}

// Watchers
watch(
  () => props.clientes,
  (nuevos) => {
    clientesSeleccionadosIds.value = nuevos.map((c) => c.id);
  },
  { immediate: true }
);

watch(
  () => props.plantillaInicial,
  (nuevaPlt) => {
    if (nuevaPlt) {
      plantillaSeleccionadaId.value = nuevaPlt.id;
      asuntoPersonalizado.value = nuevaPlt.asuntoEmail;
      cuerpoPersonalizado.value = nuevaPlt.cuerpoEmail;
      generarVistaPreviaPdf();
    }
  },
  { immediate: true }
);

watch(
  plantillaActual,
  (nueva) => {
    if (nueva && !asuntoPersonalizado.value) {
      asuntoPersonalizado.value = nueva.asuntoEmail;
      cuerpoPersonalizado.value = nueva.cuerpoEmail;
    }
    generarVistaPreviaPdf();
  },
  { immediate: true }
);

watch(
  [clientePreviewIndex, modoVista],
  () => {
    if (modoVista.value === 'previa') {
      generarVistaPreviaPdf();
    }
  }
);

const alternarSeleccionarTodos = () => {
  if (todosSeleccionados.value) {
    clientesSeleccionadosIds.value = [];
  } else {
    clientesSeleccionadosIds.value = props.clientes.map((c) => c.id);
  }
};

const alternarCliente = (id: string) => {
  const idx = clientesSeleccionadosIds.value.indexOf(id);
  if (idx >= 0) {
    clientesSeleccionadosIds.value.splice(idx, 1);
  } else {
    clientesSeleccionadosIds.value.push(id);
  }
};

const manejarCargaArchivoModal = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  const archivo = target.files[0];
  procesandoDocxModal.value = true;
  try {
    const doc = await documentParserService.procesarArchivo(archivo);
    const nombreBase = archivo.name.replace(/\.[^/.]+$/, '');
    const nuevaPlantilla: PlantillaDocumento = {
      id: `plt-subida-${Date.now()}`,
      nombre: `${nombreBase.replace(/[_-]/g, ' ')} (Word)`,
      descripcion: `Documento cargado desde ${archivo.name}`,
      categoria: 'propuesta',
      asuntoEmail: `${nombreBase.replace(/[_-]/g, ' ')} — {{empresa}}`,
      cuerpoEmail: `Estimado(a) {{contacto_principal}},\n\nLe remitimos adjunto el documento "${nombreBase}" correspondiente a {{empresa}} en formato PDF oficial.\n\nAtentamente,\n{{empresa_remitente}}\n{{correo_remitente}}`,
      tituloDocumento: nombreBase.toUpperCase(),
      contenidoDocumento: doc.contenidoTexto,
    };
    emailService.agregarPlantilla(nuevaPlantilla);
    plantillas.value = emailService.obtenerPlantillas();
    plantillaSeleccionadaId.value = nuevaPlantilla.id;
    asuntoPersonalizado.value = nuevaPlantilla.asuntoEmail;
    cuerpoPersonalizado.value = nuevaPlantilla.cuerpoEmail;
    generarVistaPreviaPdf();
  } catch (err) {
    console.error('Error al procesar archivo en modal:', err);
  } finally {
    procesandoDocxModal.value = false;
  }
};

const descargarPdfMuestra = () => {
  if (!plantillaActual.value) return;
  const clienteTarget = clienteParaPrevia.value || clienteMuestraPreview;
  const variables = emailService.construirVariables(clienteTarget, usuarioRemitente.value);
  pdfGeneratorService.descargarPdf(
    plantillaActual.value,
    variables,
    `${plantillaActual.value.id}_${clienteTarget.codigo || 'muestra'}.pdf`
  );
};

const iniciarEnvio = async () => {
  if (!plantillaActual.value) {
    toastService.error('Por favor selecciona o carga una plantilla de documento.');
    return;
  }

  // Si no hay clientes en la cartera pero se ingresó un correo directo
  let listaDestinatarios = [...clientesParaEnvioEfectivo.value];
  if (listaDestinatarios.length === 0 && correoPruebaManual.value.trim()) {
    const correoTest = correoPruebaManual.value.trim();
    if (!correoTest.includes('@')) {
      toastService.error('Por favor ingresa un correo electrónico válido para el envío de prueba.');
      return;
    }
    const clienteDirecto: Cliente = {
      id: `cli-directo-${Date.now()}`,
      codigo: 'CLI-PRUEBA',
      razon_social: 'Destinatario de Prueba',
      email: correoTest,
      sector: 'General',
      estado: 'prospecto',
      prioridad: 'media',
      valor_estimado: 0,
      responsable: usuarioRemitente.value.nombre,
      ciudad: 'Santo Domingo',
      creado_en: new Date().toISOString(),
      contactos: [
        {
          id: `cnt-directo-${Date.now()}`,
          cliente_id: `cli-directo-${Date.now()}`,
          nombre: 'Destinatario Directo',
          cargo: 'Contacto Principal',
          email: correoTest,
          telefono: '',
          es_principal: true,
          creado_en: new Date().toISOString(),
        }
      ]
    };
    listaDestinatarios = [clienteDirecto];
  }

  if (listaDestinatarios.length === 0) {
    toastService.error('Por favor selecciona al menos un cliente de la lista o ingresa un correo de prueba directo.');
    return;
  }

  enviando.value = true;
  envioFinalizado.value = false;
  registrosCompletados.value = [];
  progresoEnvio.value = { actual: 0, total: listaDestinatarios.length, porcentaje: 0 };

  try {
    const resultados = await emailService.enviarCampanaMasiva(
      listaDestinatarios,
      plantillaActual.value,
      usuarioRemitente.value,
      asuntoPersonalizado.value,
      cuerpoPersonalizado.value,
      (prog) => {
        progresoEnvio.value = {
          actual: prog.actual,
          total: prog.total,
          porcentaje: Math.round((prog.actual / prog.total) * 100),
        };
        registrosCompletados.value.push(prog.registroActual);
      }
    );

    registrosCompletados.value = resultados;
    envioFinalizado.value = true;
    emit('completado');
  } catch (err: unknown) {
    console.error('Error durante el envío de correos:', err);
    toastService.error(err instanceof Error ? err.message : 'Error durante el envío de correos.');
  } finally {
    enviando.value = false;
  }
};

const cerrarModal = () => {
  envioFinalizado.value = false;
  progresoEnvio.value = { actual: 0, total: 0, porcentaje: 0 };
  emit('cerrar');
};
</script>

<template>
  <div v-if="abierto" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop oscuro -->
    <div @click="cerrarModal" class="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"></div>

    <!-- Modal Card -->
    <div class="relative bg-white dark:bg-[#0e0e12] border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col z-10 overflow-hidden text-xs">
      <!-- Cabecera -->
      <div class="px-5 py-3.5 border-b border-zinc-200 dark:border-white/[0.07] bg-zinc-50 dark:bg-[#0a0a0d] flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Mail class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Despacho Masivo de Correos & Documentos PDF</span>
              <span class="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                Lanzador Oficial
              </span>
            </h3>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
              Personaliza el mensaje, revisa los destinatarios y despacha los documentos en lote
            </p>
          </div>
        </div>

        <button
          @click="cerrarModal"
          class="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Barra de Remitente y Selector de Pestaña -->
      <div class="px-5 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-950/40 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
          <span class="text-zinc-500">Remitente:</span>
          <span class="font-medium text-zinc-800 dark:text-zinc-200">{{ usuarioRemitente.nombre }}</span>
          <span class="font-mono text-indigo-600 dark:text-indigo-400">&lt;{{ usuarioRemitente.email }}&gt;</span>
        </div>

        <div class="flex items-center gap-1 bg-zinc-200/80 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 p-0.5 rounded-lg">
          <button
            type="button"
            @click="modoVista = 'editor'"
            :class="[
              'px-3 py-1 rounded text-xs font-medium transition flex items-center gap-1.5',
              modoVista === 'editor' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            ]"
          >
            <FileText class="w-3.5 h-3.5" />
            <span>Mensaje & Destinatarios</span>
          </button>
          <button
            type="button"
            @click="modoVista = 'previa'"
            :class="[
              'px-3 py-1 rounded text-xs font-medium transition flex items-center gap-1.5',
              modoVista === 'previa' ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            ]"
          >
            <Eye class="w-3.5 h-3.5" />
            <span>Previsualizar PDF</span>
          </button>
        </div>
      </div>

      <!-- Contenido Principal con Scroll -->
      <div class="p-5 overflow-y-auto space-y-4 flex-1 bg-zinc-50/50 dark:bg-transparent">
        <!-- Pestaña 1: Editor de Mensaje y Selección de Plantilla -->
        <div v-if="modoVista === 'editor'" class="space-y-4">
          <!-- Selector de Plantilla de Documento -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium">
                Plantilla de Documento Adjunto (PDF)
              </label>
              <button
                type="button"
                @click="inputArchivoModal?.click()"
                :disabled="procesandoDocxModal"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-indigo-600 dark:text-indigo-400 border border-zinc-300 dark:border-zinc-700 text-[11px] font-medium transition active:scale-95"
              >
                <Loader2 v-if="procesandoDocxModal" class="w-3 h-3 animate-spin" />
                <UploadCloud v-else class="w-3 h-3" />
                <span>{{ procesandoDocxModal ? 'Extrayendo texto Word...' : '+ Cargar Documento Word (.docx) o PDF' }}</span>
              </button>
              <input
                ref="inputArchivoModal"
                type="file"
                accept=".docx,.doc,.txt,.md,.pdf"
                class="hidden"
                @change="manejarCargaArchivoModal"
              />
            </div>
            <div v-if="plantillas.length === 0" class="p-4 bg-white dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-lg text-center text-xs text-zinc-500 dark:text-zinc-400 shadow-sm">
              No hay plantillas de documentos cargadas en el catálogo. Usa el botón superior <strong class="text-indigo-600 dark:text-indigo-400">+ Cargar Documento Word (.docx)</strong> para adjuntar tu documento.
            </div>
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              <button
                v-for="plt in plantillas"
                :key="plt.id"
                type="button"
                @click="plantillaSeleccionadaId = plt.id; asuntoPersonalizado = plt.asuntoEmail; cuerpoPersonalizado = plt.cuerpoEmail"
                :class="[
                  'text-left p-3 rounded-lg border transition flex flex-col justify-between shadow-sm',
                  plantillaSeleccionadaId === plt.id
                    ? 'border-indigo-500 bg-indigo-500/10 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                ]"
              >
                <div>
                  <div class="font-semibold text-xs text-zinc-900 dark:text-zinc-200 mb-1 flex items-center gap-1.5">
                    <FileText class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span class="truncate">{{ plt.nombre }}</span>
                  </div>
                  <p class="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {{ plt.descripcion }}
                  </p>
                </div>

                <div class="text-[10px] font-mono text-zinc-500 mt-2 uppercase flex items-center justify-between">
                  <span>PDF A4</span>
                  <span v-if="plantillaSeleccionadaId === plt.id" class="text-indigo-600 dark:text-indigo-400 font-bold">Activo ✓</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Asunto del Correo -->
          <div>
            <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
              Asunto del Correo Electrónico
            </label>
            <input
              v-model="asuntoPersonalizado"
              type="text"
              class="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition font-medium"
            />
          </div>

          <!-- Cuerpo del Correo -->
          <div>
            <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
              Cuerpo del Mensaje
            </label>
            <textarea
              v-model="cuerpoPersonalizado"
              rows="4"
              class="w-full p-3 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition font-mono leading-relaxed"
            ></textarea>
          </div>

          <!-- Lista de Destinatarios Interactiva con Casillas de Selección -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium text-xs flex items-center gap-2">
                <span>Destinatarios de la Campaña</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {{ clientesParaEnvioEfectivo.length }} de {{ clientes.length }} seleccionados
                </span>
              </label>

              <button
                v-if="clientes.length > 0"
                type="button"
                @click="alternarSeleccionarTodos"
                class="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                {{ todosSeleccionados ? 'Deseleccionar todos' : 'Seleccionar todos' }}
              </button>
            </div>

            <!-- Listado con Casillas -->
            <div v-if="clientes.length === 0" class="p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-2.5 shadow-sm">
              <div class="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Users class="w-3.5 h-3.5 text-amber-500" />
                <span>Directorio de clientes sin registros</span>
              </div>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Aún no tienes empresas guardadas en el CRM. Puedes despachar este documento directamente a cualquier correo electrónico de prueba o registrar tus clientes en la sección de Clientes.
              </p>
              <div>
                <label class="block text-[11px] text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                  Enviar documento de prueba a este correo:
                </label>
                <div class="flex items-center gap-2">
                  <input
                    v-model="correoPruebaManual"
                    type="email"
                    placeholder="ej: tu_correo@gmail.com o cliente@empresa.com"
                    class="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>
            <div v-else class="max-h-48 overflow-y-auto bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 space-y-1.5 shadow-sm">
              <div
                v-for="cli in clientes"
                :key="cli.id"
                @click="alternarCliente(cli.id)"
                :class="[
                  'flex items-center justify-between p-2 rounded cursor-pointer transition text-xs border select-none',
                  clientesSeleccionadosIds.includes(cli.id)
                    ? 'bg-indigo-50/70 dark:bg-zinc-900 border-indigo-200 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-200'
                    : 'bg-white dark:bg-zinc-950/40 border-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900/40'
                ]"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <input
                    type="checkbox"
                    :checked="clientesSeleccionadosIds.includes(cli.id)"
                    @click.stop="alternarCliente(cli.id)"
                    class="rounded bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <div class="truncate">
                    <span class="font-semibold text-zinc-900 dark:text-zinc-200">{{ cli.razon_social }}</span>
                    <span class="text-zinc-500 ml-1.5 font-mono text-[10px]">{{ cli.codigo }}</span>
                    <span class="text-zinc-500 dark:text-zinc-400 block text-[11px] truncate">
                      Contacto: {{ cli.contactos?.[0]?.nombre || 'Representante' }}
                    </span>
                  </div>
                </div>

                <div class="text-right shrink-0">
                  <span
                    v-if="cli.contactos?.[0]?.email || cli.email"
                    class="font-mono text-[11px] text-zinc-600 dark:text-zinc-400"
                  >
                    {{ cli.contactos?.[0]?.email || cli.email }}
                  </span>
                  <span
                    v-else
                    class="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20"
                  >
                    Sin correo registrado
                  </span>
                </div>
              </div>

              <!-- Mensaje si no hay clientes cargados -->
              <div
                v-if="clientes.length === 0"
                class="p-4 text-center text-zinc-500 text-xs"
              >
                No se encontraron clientes registrados en la cartera.
              </div>
            </div>
          </div>
        </div>

        <!-- Pestaña 2: Previsualización del PDF en Tiempo Real -->
        <div v-else class="space-y-4">
          <div class="flex items-center justify-between bg-white dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div class="flex items-center gap-3">
              <span class="text-zinc-600 dark:text-zinc-400 font-medium">Ver documento de muestra para:</span>
              <select
                v-model="clientePreviewIndex"
                class="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200 text-xs rounded px-2.5 py-1 focus:outline-none focus:border-indigo-500"
              >
                <option
                  v-for="(cli, idx) in clientesParaEnvioEfectivo"
                  :key="cli.id"
                  :value="idx"
                >
                  {{ cli.razon_social }} ({{ cli.codigo }})
                </option>
              </select>
            </div>

            <button
              type="button"
              @click="descargarPdfMuestra"
              class="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded text-xs transition border border-zinc-300 dark:border-zinc-700"
            >
              <Download class="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>
          </div>

          <!-- Visor del PDF generado -->
          <div class="rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
            <iframe
              v-if="pdfDataUri"
              :src="pdfDataUri"
              class="w-full h-[480px] bg-zinc-100 dark:bg-zinc-900"
              title="Vista previa del PDF oficial"
            ></iframe>
            <div v-else class="h-[400px] flex items-center justify-center text-zinc-500">
              Generando vista previa del documento...
            </div>
          </div>
        </div>

        <!-- Barra de Progreso de Envío en Tiempo Real -->
        <div v-if="enviando || envioFinalizado" class="p-4 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm">
          <div class="flex items-center justify-between text-xs">
            <span class="font-semibold text-zinc-900 dark:text-zinc-200 flex items-center gap-2">
              <Loader2 v-if="enviando" class="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
              <CheckCircle2 v-else class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{{ enviando ? 'Despachando correos masivos con PDF adjunto...' : '¡Campaña de envío completada con éxito!' }}</span>
            </span>
            <span class="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
              {{ progresoEnvio.actual }} / {{ progresoEnvio.total }} ({{ progresoEnvio.porcentaje }}%)
            </span>
          </div>

          <!-- Barra de Progreso -->
          <div class="w-full bg-zinc-200 dark:bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-300 dark:border-zinc-800">
            <div
              class="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-200"
              :style="{ width: `${progresoEnvio.porcentaje}%` }"
            ></div>
          </div>

          <!-- Bitácora de Envíos en Tiempo Real -->
          <div class="max-h-28 overflow-y-auto space-y-1 font-mono text-[10px] text-zinc-500 dark:text-zinc-400 pt-1">
            <div
              v-for="reg in registrosCompletados"
              :key="reg.id"
              :class="['flex items-center justify-between py-0.5 border-b border-zinc-200 dark:border-zinc-900', reg.estado === 'fallido' ? 'text-rose-500' : '']"
            >
              <span :class="reg.estado === 'fallido' ? 'text-rose-600 dark:text-rose-300' : 'text-zinc-800 dark:text-zinc-300'">
                {{ reg.estado === 'enviado' ? '✔' : '✖' }} {{ reg.empresa }} &lt;{{ reg.emailDestino }}&gt;
              </span>
              <span v-if="reg.estado === 'enviado'" class="text-indigo-600 dark:text-indigo-400 font-medium">PDF Adjunto ({{ reg.tamanoAdjuntoKb }} KB)</span>
              <span v-else class="text-rose-500 truncate max-w-[160px]" :title="reg.error">Error: {{ reg.error?.substring(0, 30) }}...</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pie del Modal -->
      <div class="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 flex items-center justify-between gap-3">
        <div class="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
          <Users class="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
          <span v-if="clientesParaEnvioEfectivo.length > 0">
            {{ clientesParaEnvioEfectivo.length }} {{ clientesParaEnvioEfectivo.length === 1 ? 'destinatario seleccionado' : 'destinatarios seleccionados' }}
          </span>
          <span v-else-if="correoPruebaManual.trim()" class="text-indigo-600 dark:text-indigo-400 font-mono">
            Destinatario directo: {{ correoPruebaManual }}
          </span>
          <span v-else>Sin destinatarios seleccionados</span>
        </div>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            @click="cerrarModal"
            class="px-3.5 py-1.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition font-medium border border-zinc-300 dark:border-white/[0.08]"
          >
            {{ envioFinalizado ? 'Cerrar' : 'Cancelar' }}
          </button>

          <button
            v-if="!envioFinalizado"
            type="button"
            @click="iniciarEnvio"
            :disabled="enviando || (clientesParaEnvioEfectivo.length === 0 && !correoPruebaManual.trim())"
            class="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-950/30 border border-indigo-500/30 active:scale-95"
          >
            <Loader2 v-if="enviando" class="w-4 h-4 animate-spin" />
            <Send v-else class="w-4 h-4" />
            <span v-if="clientesParaEnvioEfectivo.length > 0">
              Lanzar Campaña a {{ clientesParaEnvioEfectivo.length }} {{ clientesParaEnvioEfectivo.length === 1 ? 'Cliente' : 'Clientes' }}
            </span>
            <span v-else>
              Enviar a Correo de Prueba
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
