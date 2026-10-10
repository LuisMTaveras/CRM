<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from 'vue';
import { 
  Building2, 
  CheckCircle2, 
  Server, 
  Database, 
  Save, 
  RotateCcw, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  CreditCard,
  Eye,
  Layers,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  UploadCloud,
  Image as ImageIcon,
  DatabaseBackup,
  AlertTriangle,
  Sparkles
} from 'lucide-vue-next';
import { empresaService } from '../services/empresa.service';
import type { DatosEmpresa } from '../types/empresa.types';
import { LOGO_ALLIANCE_DEFAULT } from '../constants/logo-default';
import { FlickerlessSurface } from '@flickerless/vue';
import { dialogService } from '@/core/dialog/dialog.service';
import { toastService } from '@/core/notifications/toast.service';
import AppSelect, { type SelectOption } from '@/shared/components/AppSelect.vue';
import SectorBadge from '@/shared/components/SectorBadge.vue';
import { sectoresService } from '@/modules/clientes/services/sectores.service';
import { 
  LISTA_ICONOS_DISPONIBLES, 
  PALETA_COLORES_SECTOR, 
  type SectorEconomico 
} from '@/modules/clientes/types/sector.types';
import { useRoute } from 'vue-router';
import ConfiguracionCorreoSection from '../components/ConfiguracionCorreoSection.vue';

const route = useRoute();
const pestanaActiva = ref<'empresa' | 'correo' | 'sectores' | 'sistema'>('empresa');
const formulario = reactive<DatosEmpresa>(empresaService.obtenerDatos());
const mensajeGuardado = ref(false);
const guardando = ref(false);

// Estado de gestión de sectores económicos
const listaSectores = ref<SectorEconomico[]>(sectoresService.obtenerSectores());
const modalSectorAbierto = ref(false);
const sectorEditando = ref<SectorEconomico | null>(null);
const busquedaIcono = ref('');

const formSector = reactive({
  nombre: '',
  codigo: '',
  icono: 'Cpu',
  colorId: 'indigo',
  descripcion: '',
});

const refrescarSectores = () => {
  listaSectores.value = sectoresService.obtenerSectores();
};

const iconosFiltrados = computed(() => {
  if (!busquedaIcono.value.trim()) return LISTA_ICONOS_DISPONIBLES;
  const q = busquedaIcono.value.toLowerCase().trim();
  return LISTA_ICONOS_DISPONIBLES.filter(
    (i) => i.id.toLowerCase().includes(q) || i.label.toLowerCase().includes(q)
  );
});

const abrirNuevoSector = () => {
  sectorEditando.value = null;
  formSector.nombre = '';
  formSector.codigo = '';
  formSector.icono = 'Cpu';
  formSector.colorId = 'indigo';
  formSector.descripcion = '';
  busquedaIcono.value = '';
  modalSectorAbierto.value = true;
};

const abrirEditarSector = (sec: SectorEconomico) => {
  sectorEditando.value = sec;
  formSector.nombre = sec.nombre;
  formSector.codigo = sec.codigo;
  formSector.icono = sec.icono;
  
  // Encontrar el colorId correspondiente
  const paleta = PALETA_COLORES_SECTOR.find((p) => p.color === sec.color);
  formSector.colorId = paleta?.id || 'indigo';
  formSector.descripcion = sec.descripcion || '';
  busquedaIcono.value = '';
  modalSectorAbierto.value = true;
};

const guardarSectorModal = () => {
  if (!formSector.nombre.trim()) {
    toastService.error('El nombre del sector es obligatorio.');
    return;
  }
  if (!formSector.codigo.trim()) {
    toastService.error('El código del sector es obligatorio.');
    return;
  }

  const paletaSeleccionada = PALETA_COLORES_SECTOR.find((p) => p.id === formSector.colorId) || PALETA_COLORES_SECTOR[0];

  if (sectorEditando.value) {
    sectoresService.actualizarSector(sectorEditando.value.id, {
      nombre: formSector.nombre.trim(),
      codigo: formSector.codigo.toUpperCase().trim(),
      icono: formSector.icono,
      color: paletaSeleccionada.color,
      dotColor: paletaSeleccionada.dotColor,
      descripcion: formSector.descripcion.trim(),
    });
    toastService.exito(`Sector "${formSector.nombre}" actualizado correctamente.`);
  } else {
    sectoresService.crearSector({
      nombre: formSector.nombre.trim(),
      codigo: formSector.codigo.toUpperCase().trim(),
      icono: formSector.icono,
      color: paletaSeleccionada.color,
      dotColor: paletaSeleccionada.dotColor,
      descripcion: formSector.descripcion.trim(),
    });
    toastService.exito(`Sector "${formSector.nombre}" creado exitosamente.`);
  }

  refrescarSectores();
  modalSectorAbierto.value = false;
};

const alternarEstadoSector = (sec: SectorEconomico) => {
  sectoresService.actualizarSector(sec.id, { activo: !sec.activo });
  refrescarSectores();
  toastService.info(`Sector "${sec.nombre}" ${!sec.activo ? 'activado' : 'desactivado'}.`);
};

const eliminarSector = async (sec: SectorEconomico) => {
  const confirmado = await dialogService.confirmar({
    titulo: 'ELIMINAR SECTOR ECONÓMICO',
    subtitulo: `SECTOR: ${sec.nombre.toUpperCase()}`,
    mensaje: `¿Está seguro de que desea eliminar el sector económico "${sec.nombre}"?`,
    detalle: 'Los clientes existentes mantendrán su asignación, pero este sector ya no aparecerá como opción para nuevos registros.',
    textoConfirmar: 'ELIMINAR SECTOR',
    textoCancelar: 'CANCELAR',
    tipo: 'peligro',
  });

  if (!confirmado) return;

  sectoresService.eliminarSector(sec.id);
  refrescarSectores();
  toastService.exito(`Sector "${sec.nombre}" eliminado.`);
};

const restablecerSectores = async () => {
  const confirmado = await dialogService.confirmar({
    titulo: 'RESTABLECER CATÁLOGO DE SECTORES',
    subtitulo: 'RESTAURAR SECTORES PREDETERMINADOS',
    mensaje: '¿Desea restaurar el catálogo de sectores a la configuración inicial del sistema?',
    detalle: 'Se reestablecerán los 10 sectores oficiales con sus iconos y paletas originales.',
    textoConfirmar: 'RESTAURAR CATÁLOGO',
    textoCancelar: 'CANCELAR',
    tipo: 'advertencia',
  });

  if (!confirmado) return;

  sectoresService.restablecerSectores();
  refrescarSectores();
  toastService.exito('Catálogo de sectores restablecido por defecto.');
};

const opcionesMoneda: Array<SelectOption<'DOP' | 'USD' | 'EUR'>> = [
  { value: 'DOP', label: 'DOP — Peso Dominicano (RD$)', badge: 'RD$' },
  { value: 'USD', label: 'USD — Dólar Estadounidense ($)', badge: '$' },
  { value: 'EUR', label: 'EUR — Euro (€)', badge: '€' },
];

// Sincronizar si cambia externamente
watch(
  () => empresaService.datos,
  (nuevos) => {
    Object.assign(formulario, nuevos);
  },
  { deep: true }
);

// Gestión y Subida de Logotipo Oficial
const inputLogoRef = ref<HTMLInputElement | null>(null);

const seleccionarLogo = () => {
  inputLogoRef.value?.click();
};

const alCambiarLogo = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const archivo = input.files?.[0];
  if (!archivo) return;

  if (archivo.size > 3 * 1024 * 1024) {
    toastService.error('El logotipo no debe superar los 3 MB de tamaño.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUri = e.target?.result as string;
    if (dataUri) {
      formulario.logoUrl = dataUri;
      toastService.exito('Logotipo institucional cargado con éxito. Guarda los cambios para sincronizarlo.');
    }
  };
  reader.onerror = () => {
    toastService.error('No se pudo procesar la imagen del logotipo.');
  };
  reader.readAsDataURL(archivo);
  input.value = '';
};

const restablecerLogoPorDefecto = () => {
  formulario.logoUrl = LOGO_ALLIANCE_DEFAULT;
  toastService.info('Logotipo oficial de Alliance restablecido.');
};

const quitarLogo = () => {
  formulario.logoUrl = '';
  toastService.info('Logotipo eliminado. Se utilizará el monograma geométrico institucional.');
};

const guardarCambios = () => {
  guardando.value = true;
  try {
    empresaService.guardarDatos(formulario);
    mensajeGuardado.value = true;
    setTimeout(() => {
      mensajeGuardado.value = false;
    }, 3000);
  } finally {
    guardando.value = false;
  }
};

const restablecer = async () => {
  const confirmado = await dialogService.confirmar({
    titulo: 'RESTABLECER CONFIGURACIÓN',
    subtitulo: 'RESTAURAR VALORES PREDETERMINADOS DE LA EMPRESA',
    mensaje: '¿Desea restablecer los datos de la empresa a los valores iniciales predeterminados?',
    detalle: 'Los campos actuales del formulario se reemplazarán por la información predeterminada del sistema.',
    textoConfirmar: 'RESTABLECER VALORES',
    textoCancelar: 'CANCELAR',
    tipo: 'advertencia',
  });

  if (!confirmado) return;

  const defaultData = empresaService.restablecerPorDefecto();
  Object.assign(formulario, defaultData);
  mensajeGuardado.value = true;
  setTimeout(() => {
    mensajeGuardado.value = false;
  }, 2500);
};

const ejecutarLimpiezaCero = async () => {
  const confirmado = await dialogService.confirmar({
    titulo: '¿Limpiar todos los datos para empezar desde 0?',
    mensaje: 'Esta acción eliminará todos los clientes registrados, contactos, tableros Kanban, actividades de la agenda, historial y bitácoras para dejar el CRM completamente limpio.',
    textoConfirmar: 'Sí, limpiar todo a 0',
    textoCancelar: 'Cancelar',
    tipo: 'peligro',
  });

  if (!confirmado) return;

  const { limpiezaDatosService } = await import('@/core/mantenimiento/limpieza-datos.service');
  limpiezaDatosService.limpiarTodoParaEmpezarDesdeCero(true);
};

const ejecutarCargaDemo = async () => {
  const confirmado = await dialogService.confirmar({
    titulo: '¿Cargar catálogo de demostración?',
    mensaje: 'Se cargarán 100+ clientes B2B de prueba, actividades en la agenda y datos de demostración para presentaciones comerciales.',
    textoConfirmar: 'Cargar datos demo',
    textoCancelar: 'Cancelar',
    tipo: 'info',
  });

  if (!confirmado) return;

  const { limpiezaDatosService } = await import('@/core/mantenimiento/limpieza-datos.service');
  limpiezaDatosService.restablecerDatosDemo();
};

onMounted(() => {
  if (route.query.tab === 'correo') {
    pestanaActiva.value = 'correo';
  } else if (route.query.tab === 'sectores') {
    pestanaActiva.value = 'sectores';
  } else if (route.query.tab === 'sistema') {
    pestanaActiva.value = 'sistema';
  }
});
</script>

<template>
  <!-- Teleport del Encabezado hacia la Barra Superior Principal (HeaderBar) -->
    <Teleport to="#header-portal-left">
      <div class="flex items-center gap-3 min-w-0">
        <div class="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
          <Building2 class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <h1 class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
            Ajustes de Empresa & Sistema
          </h1>
          <p class="text-[11px] text-zinc-500 dark:text-zinc-400 truncate hidden md:block">
            Personaliza la identidad corporativa que emite las propuestas, contratos y reportes
          </p>
        </div>
      </div>
    </Teleport>

    <!-- Teleport de Pestañas hacia la Barra Superior -->
    <Teleport to="#header-portal-right">
      <div class="flex items-center bg-zinc-100 dark:bg-zinc-900/80 p-1 rounded-xl border border-zinc-200 dark:border-white/[0.08]">
        <button
          type="button"
          @click="pestanaActiva = 'empresa'"
          :class="[
            'px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5',
            pestanaActiva === 'empresa'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-white/[0.08]'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          ]"
        >
          <Building2 class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Perfil Empresa</span>
        </button>
        <button
          type="button"
          @click="pestanaActiva = 'correo'"
          :class="[
            'px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5',
            pestanaActiva === 'correo'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-white/[0.08]'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          ]"
        >
          <Mail class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Servidores & Correo</span>
        </button>
        <button
          type="button"
          @click="pestanaActiva = 'sistema'"
          :class="[
            'px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5',
            pestanaActiva === 'sistema'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-white/[0.08]'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          ]"
        >
          <Server class="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
          <span>Servicios</span>
        </button>
        <button
          type="button"
          @click="pestanaActiva = 'sectores'"
          :class="[
            'px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5',
            pestanaActiva === 'sectores'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-white/[0.08]'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          ]"
        >
          <Layers class="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span>Sectores Económicos</span>
        </button>
      </div>
    </Teleport>

  <!-- Contenedor Protegido con Flickerless Surface -->
  <div class="w-full space-y-4 pb-8">
    <FlickerlessSurface
      :loading="guardando"
      :delay-ms="180"
      :preserve-height="true"
      stream-color="#4f46e5"
      announce-text="Guardando y sincronizando perfil corporativo..."
      class="rounded-xl overflow-hidden"
    >
      <!-- PESTAÑA 1: PERFIL DE LA EMPRESA (PROPIETARIA DEL CRM) -->
      <div v-if="pestanaActiva === 'empresa'" class="space-y-6">
      <!-- Tarjeta de Vista Previa del Membrete Institucional en Tiempo Real -->
      <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3 relative overflow-hidden">
        <div class="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800/80">
          <div class="flex items-center gap-2">
            <Eye class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span class="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Vista Previa del Membrete Oficial (Encabezado de Documentos y PDF)
            </span>
          </div>
          <span class="text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-950 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
            Formato A4 Dominicano
          </span>
        </div>

        <!-- Render visual simulado del membrete -->
        <div class="bg-white rounded-lg p-5 text-zinc-900 shadow-sm border border-zinc-200 font-sans space-y-2">
          <div class="h-1.5 bg-indigo-600 rounded-full w-full mb-3"></div>
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-start gap-4">
              <!-- Logotipo en la vista previa -->
              <div class="w-14 h-14 rounded-xl border border-zinc-200/80 bg-zinc-50 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                <img
                  v-if="formulario.logoUrl"
                  :src="formulario.logoUrl"
                  alt="Logotipo Empresa"
                  class="w-full h-full object-contain p-1"
                />
                <div v-else class="text-xs font-bold text-zinc-500 font-mono">
                  {{ formulario.razonSocial ? formulario.razonSocial.slice(0, 2).toUpperCase() : 'CRM' }}
                </div>
              </div>

              <div>
                <h2 class="text-base font-bold tracking-tight text-zinc-900 uppercase">
                  {{ formulario.razonSocial || 'NOMBRE DE TU EMPRESA' }}
                </h2>
                <p class="text-xs text-zinc-600 font-medium">
                  {{ formulario.sloganActividad || 'Actividad Comercial' }} 
                  <span v-if="formulario.identificacionFiscal">• RNC: {{ formulario.identificacionFiscal }}</span>
                </p>
                <p class="text-[11px] text-zinc-500 mt-0.5">
                  {{ formulario.direccion || 'Dirección de la empresa' }}, {{ formulario.ciudad || 'Ciudad' }} • Tel: {{ formulario.telefono || '+1 (809) 000-0000' }}
                </p>
              </div>
            </div>

            <div class="text-right shrink-0">
              <span class="text-[11px] font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200 block">
                {{ formulario.prefijoDocumentos || 'DOC' }}-002841
              </span>
              <span class="text-[10px] text-zinc-500 block mt-1">
                Moneda: {{ formulario.monedaPrincipal }} ({{ formulario.simboloMoneda }})
              </span>
            </div>
          </div>
        </div>
        <p class="text-[11px] text-zinc-500 dark:text-zinc-400 italic">
          💡 Esta cabecera se genera automáticamente en todas las cotizaciones, propuestas comerciales y contratos PDF despachados vía correo.
        </p>
      </div>

      <!-- Formulario de Configuración -->
      <form @submit.prevent="guardarCambios" class="space-y-6">
        <!-- Bloque: Logotipo Oficial de la Empresa -->
        <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <div class="flex items-center gap-2">
              <ImageIcon class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Logotipo Oficial de la Empresa (Membrete & PDF A4)</span>
            </div>
            <span class="text-[10px] text-zinc-500 font-normal">PNG, JPG, SVG o WebP (Máx. 3MB)</span>
          </div>

          <div class="flex flex-col sm:flex-row items-center gap-5">
            <!-- Contenedor del Logo Actual -->
            <div class="relative w-28 h-28 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center overflow-hidden shrink-0 group">
              <img
                v-if="formulario.logoUrl"
                :src="formulario.logoUrl"
                alt="Logotipo"
                class="w-full h-full object-contain p-2"
              />
              <div v-else class="text-center p-2 text-zinc-400">
                <ImageIcon class="w-8 h-8 mx-auto stroke-1" />
                <span class="text-[10px] block mt-1 font-medium">Sin Logotipo</span>
              </div>
            </div>

            <!-- Botones de Acción para Logo -->
            <div class="space-y-2.5 flex-1 text-xs">
              <input
                ref="inputLogoRef"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                class="hidden"
                @change="alCambiarLogo"
              />
              <div class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  @click="seleccionarLogo"
                  class="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-1.5 shadow-sm transition"
                >
                  <UploadCloud class="w-3.5 h-3.5" />
                  <span>Subir Logotipo</span>
                </button>

                <button
                  type="button"
                  @click="restablecerLogoPorDefecto"
                  class="px-3 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium flex items-center gap-1.5 transition"
                >
                  <RotateCcw class="w-3.5 h-3.5" />
                  <span>Restablecer Original</span>
                </button>

                <button
                  v-if="formulario.logoUrl"
                  type="button"
                  @click="quitarLogo"
                  class="px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1.5 transition"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                  <span>Quitar</span>
                </button>
              </div>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Este logotipo se incrustará de forma nítida en el membrete y encabezado de todas las propuestas, cartas y contratos generados en PDF, así como en la barra lateral del sistema.
              </p>
            </div>
          </div>
        </div>

        <!-- Bloque 1: Identidad Legal y Razón Social -->
        <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <FileText class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Datos Legales e Identificación Fiscal</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label class="block text-zinc-700 dark:text-zinc-400 font-medium mb-1">
                Razón Social Oficial (Nombre Jurídico) <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="formulario.razonSocial"
                type="text"
                required
                placeholder="ej: MI EMPRESA DOMINICANA SRL"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 transition"
              />
              <span class="text-[10px] text-zinc-500 mt-1 block">Aparece en contratos legales y pie de firma</span>
            </div>

            <div>
              <label class="block text-zinc-700 dark:text-zinc-400 font-medium mb-1">
                Nombre Comercial / Marca <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="formulario.nombreComercial"
                type="text"
                required
                placeholder="ej: MI MARCA B2B"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 transition"
              />
              <span class="text-[10px] text-zinc-500 mt-1 block">Visible en la barra lateral del CRM y membrete</span>
            </div>

            <div>
              <label class="block text-zinc-700 dark:text-zinc-400 font-medium mb-1">
                RNC Dominicano / Identificación Fiscal <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="formulario.identificacionFiscal"
                type="text"
                required
                placeholder="ej: 1-32-45890-1"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-indigo-500 transition"
              />
              <span class="text-[10px] text-zinc-500 mt-1 block">Registro Nacional de Contribuyentes oficial</span>
            </div>

            <div>
              <label class="block text-zinc-700 dark:text-zinc-400 font-medium mb-1">
                Actividad Comercial / Slogan Institucional
              </label>
              <input
                v-model="formulario.sloganActividad"
                type="text"
                placeholder="ej: Soluciones de Software, Logística & Consultoría B2B"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 transition"
              />
              <span class="text-[10px] text-zinc-500 mt-1 block">Subtítulo que acompaña al membrete</span>
            </div>
          </div>
        </div>

        <!-- Bloque 2: Contacto & Canales de Comunicación -->
        <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <Phone class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Canales de Contacto Corporativo</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label class="block text-zinc-700 dark:text-zinc-400 font-medium mb-1">
                Teléfono Principal / Central <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="formulario.telefono"
                type="text"
                required
                placeholder="+1 (809) 555-0100"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label class="block text-zinc-700 dark:text-zinc-400 font-medium mb-1">
                WhatsApp Comercial
              </label>
              <input
                v-model="formulario.whatsapp"
                type="text"
                placeholder="+1 (809) 555-0101"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label class="block text-zinc-700 dark:text-zinc-400 font-medium mb-1">
                Correo Institucional <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="formulario.correo"
                type="email"
                required
                placeholder="contacto@miempresa.com.do"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label class="block text-zinc-700 dark:text-zinc-400 font-medium mb-1">
                Sitio Web Corporativo
              </label>
              <input
                v-model="formulario.sitioWeb"
                type="text"
                placeholder="www.miempresa.com.do"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>
        </div>

        <!-- Bloque 3: Ubicación Física y Sede -->
        <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <MapPin class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Ubicación y Sede Principal</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div class="sm:col-span-2">
              <label class="block text-zinc-700 dark:text-zinc-400 font-medium mb-1">
                Dirección Física <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="formulario.direccion"
                type="text"
                required
                placeholder="Av. Winston Churchill, Torre Empresarial, Suite 802"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label class="block text-zinc-700 dark:text-zinc-400 font-medium mb-1">
                Ciudad / Distrito <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="formulario.ciudad"
                type="text"
                required
                placeholder="Santo Domingo"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>
        </div>

        <!-- Bloque 4: Preferencias Comerciales y Formatos -->
        <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <CreditCard class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Moneda & Parámetros Documentales</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label class="block text-zinc-700 dark:text-zinc-400 font-medium mb-1">
                Moneda Principal de Cotización
              </label>
              <AppSelect
                :model-value="formulario.monedaPrincipal"
                @update:model-value="(nuevo) => formulario.monedaPrincipal = nuevo as 'DOP' | 'USD' | 'EUR'"
                :options="opcionesMoneda"
                :full-width="true"
              />
            </div>

            <div>
              <label class="block text-zinc-700 dark:text-zinc-400 font-medium mb-1">
                Prefijo de Documentos / Propuestas
              </label>
              <input
                v-model="formulario.prefijoDocumentos"
                type="text"
                placeholder="DF-PROP o COT"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 font-mono uppercase focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div class="sm:col-span-3">
              <label class="block text-zinc-700 dark:text-zinc-400 font-medium mb-1">
                Pie de Página Institucional (Documentos PDF)
              </label>
              <textarea
                v-model="formulario.piePaginaOficial"
                rows="2"
                placeholder="Texto legal que se imprime al pie de cada página en los PDF despachados"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Barra de Acciones y Notificación -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div class="flex items-center gap-2">
            <button
              type="submit"
              :disabled="guardando"
              v-flickerless-saving="guardando"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition disabled:opacity-50 active:scale-[0.98]"
            >
              <Save class="w-4 h-4" />
              <span>{{ guardando ? 'Guardando en Base de Datos...' : 'Guardar Información de la Empresa' }}</span>
            </button>

            <button
              type="button"
              @click="restablecer"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 text-xs font-medium transition"
            >
              <RotateCcw class="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>
          </div>

          <!-- Mensaje de éxito al guardar -->
          <transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-1"
          >
            <div
              v-if="mensajeGuardado"
              class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
            >
              <CheckCircle2 class="w-4 h-4 text-emerald-500" />
              <span>¡Información de la empresa guardada y sincronizada con el CRM!</span>
            </div>
          </transition>
        </div>
      </form>
    </div>

    <!-- PESTAÑA: SERVIDORES & CORREO -->
    <div v-else-if="pestanaActiva === 'correo'">
      <ConfiguracionCorreoSection />
    </div>

    <!-- PESTAÑA 2: SERVICIOS Y CONECTIVIDAD DEL SISTEMA -->
    <div v-else-if="pestanaActiva === 'sistema'" class="space-y-6">
      <!-- Tarjeta de Estado de Conexión PostgreSQL -->
      <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div class="flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <Database class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Motor de Base de Datos PostgreSQL</span>
          </div>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 class="w-3 h-3" />
            Conectado
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div class="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800/80">
            <span class="text-zinc-500 text-[10px] block font-sans">HOST</span>
            <span class="text-zinc-800 dark:text-zinc-200">localhost</span>
          </div>
          <div class="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800/80">
            <span class="text-zinc-500 text-[10px] block font-sans">PUERTO</span>
            <span class="text-zinc-800 dark:text-zinc-200">5432</span>
          </div>
          <div class="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800/80">
            <span class="text-zinc-500 text-[10px] block font-sans">BASE DE DATOS</span>
            <span class="text-zinc-800 dark:text-zinc-200">crm_db</span>
          </div>
          <div class="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800/80">
            <span class="text-zinc-500 text-[10px] block font-sans">MODO OPERACIÓN</span>
            <span class="text-emerald-600 dark:text-emerald-400">PostgreSQL Mock / Live</span>
          </div>
        </div>
      </div>

      <!-- Tarjeta de Servidor de Correo Nodemailer -->
      <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div class="flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <Mail class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Servidor de Correo Nodemailer (SMTP / IMAP)</span>
          </div>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            Puerto 3002
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div class="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1">
            <div class="font-medium text-zinc-800 dark:text-zinc-200">Despacho Masivo & Generación de PDF</div>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Servidor backend dedicado con soporte de cola para envíos masivos, verificación de credenciales con handshake TLS real y conversión de documentos Word a PDF.
            </p>
          </div>

          <div class="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2 flex flex-col justify-between">
            <div>
              <div class="font-medium text-zinc-800 dark:text-zinc-200">Protocolos Salientes y Entrantes</div>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Puedes configurar el host SMTP, puerto, cifrado SSL/TLS, remitente corporativo y servidor IMAP directamente desde la pestaña de Servidores & Correo.
              </p>
            </div>
            <button
              type="button"
              @click="pestanaActiva = 'correo'"
              class="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-semibold"
            >
              <span>Configurar Servidor SMTP & IMAP →</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Tarjeta de Gestión de Datos del Sistema -->
      <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div class="flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <DatabaseBackup class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Gestión de Datos del CRM</span>
          </div>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle class="w-3 h-3" />
            Zona de Mantenimiento
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <!-- Vaciar a 0 -->
          <div class="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4 space-y-3">
            <div>
              <div class="font-semibold text-red-800 dark:text-red-300 flex items-center gap-1.5">
                <Trash2 class="w-3.5 h-3.5" />
                Limpiar Todos los Datos
              </div>
              <p class="text-[11px] text-red-600 dark:text-red-400/80 leading-relaxed mt-1">
                Elimina todos los clientes, contactos, tableros Kanban, actividades, historial y bitácoras. El CRM quedará completamente vacío para empezar desde cero.
              </p>
            </div>
            <button
              type="button"
              @click="ejecutarLimpiezaCero"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition shadow-sm shadow-red-500/20"
            >
              <Trash2 class="w-3.5 h-3.5" />
              Vaciar todo a 0
            </button>
          </div>

          <!-- Cargar Demo -->
          <div class="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/50 rounded-lg p-4 space-y-3">
            <div>
              <div class="font-semibold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                <Sparkles class="w-3.5 h-3.5" />
                Cargar Datos de Demostración
              </div>
              <p class="text-[11px] text-indigo-600 dark:text-indigo-400/80 leading-relaxed mt-1">
                Carga 100+ clientes B2B de prueba, actividades en la agenda y datos de demostración para presentaciones comerciales. Ideal para evaluar el CRM con datos realistas.
              </p>
            </div>
            <button
              type="button"
              @click="ejecutarCargaDemo"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-sm shadow-indigo-500/20"
            >
              <Sparkles class="w-3.5 h-3.5" />
              Cargar Demo 100+
            </button>
          </div>
        </div>
      </div>
    </div>


      <div v-else-if="pestanaActiva === 'sectores'" class="space-y-6">
        <!-- Tarjeta de Encabezado y Acciones -->
        <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div class="space-y-1">
            <div class="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              <Layers class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Catálogo Maestro de Sectores Económicos & Simbología</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {{ listaSectores.length }} Sectores Registrados
              </span>
            </div>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-2xl">
              Configura las clasificaciones comerciales oficiales, asocia los iconos vectoriales de representación y estandariza los colores que distinguirán a las cuentas en el CRM, filtros y tableros.
            </p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button
              type="button"
              @click="restablecerSectores"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium transition"
              title="Restaurar a los 10 sectores oficiales predeterminados"
            >
              <RotateCcw class="w-3.5 h-3.5" />
              <span class="hidden sm:inline">Restablecer</span>
            </button>
            <button
              type="button"
              @click="abrirNuevoSector"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-sm shadow-indigo-500/20"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Nuevo Sector Económico</span>
            </button>
          </div>
        </div>

        <!-- Cuadrícula de Sectores Económicos -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <div
            v-for="sec in listaSectores"
            :key="sec.id"
            class="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col justify-between space-y-3.5 hover:border-zinc-300 dark:hover:border-zinc-700 transition shadow-sm"
          >
            <!-- Cabecera de la Tarjeta del Sector -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <!-- Icono oficial renderizado dinámicamente -->
                <div :class="['p-2.5 rounded-xl border flex items-center justify-center shrink-0', sec.color]">
                  <component :is="sectoresService.obtenerIconoComponente(sec.icono)" class="w-5 h-5" />
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <h3 class="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate" :title="sec.nombre">
                      {{ sec.nombre }}
                    </h3>
                  </div>
                  <span class="font-mono text-[10px] text-zinc-400 uppercase tracking-wider block">
                    CÓDIGO: {{ sec.codigo }}
                  </span>
                </div>
              </div>

              <!-- Estado Activo / Inactivo -->
              <button
                type="button"
                @click="alternarEstadoSector(sec)"
                :class="[
                  'px-2 py-0.5 rounded text-[10px] font-medium border shrink-0 transition',
                  sec.activo
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                    : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                ]"
                :title="sec.activo ? 'Clic para desactivar sector' : 'Clic para activar sector'"
              >
                {{ sec.activo ? 'Activo' : 'Inactivo' }}
              </button>
            </div>

            <!-- Descripción -->
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
              {{ sec.descripcion || 'Sin descripción registrada para este sector económico.' }}
            </p>

            <!-- Vista Previa de la Insignia y Acciones -->
            <div class="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
              <!-- Insignia como se verá en clientes -->
              <SectorBadge :sector="sec.nombre" tamano="xs" />

              <!-- Botones de Acción -->
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  @click="abrirEditarSector(sec)"
                  class="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                  title="Editar sector e icono"
                >
                  <Edit2 class="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  @click="eliminarSector(sec)"
                  class="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                  title="Eliminar sector"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FlickerlessSurface>

    <!-- MODAL DE CREACIÓN / EDICIÓN DE SECTOR ECONÓMICO -->
    <div v-if="modalSectorAbierto" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div @click="modalSectorAbierto = false" class="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"></div>

      <div class="relative bg-white dark:bg-[#0e0e12] border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col z-10 overflow-hidden text-xs">
        <!-- Cabecera del Modal -->
        <div class="px-5 py-4 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#0a0a0d] flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Layers class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {{ sectorEditando ? 'Editar Sector Económico' : 'Nuevo Sector Económico' }}
              </h3>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
                Define el nombre, icono representativo y paleta cromática oficial
              </p>
            </div>
          </div>
          <button
            @click="modalSectorAbierto = false"
            class="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Contenido con Scroll -->
        <div class="p-5 overflow-y-auto space-y-4">
          <!-- Nombre y Código -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="sm:col-span-2">
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Nombre del Sector *</label>
              <input
                v-model="formSector.nombre"
                type="text"
                placeholder="Ej: Salud & Redes Médicas"
                class="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Código / Siglas *</label>
              <input
                v-model="formSector.codigo"
                type="text"
                maxlength="5"
                placeholder="SAL"
                class="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 font-mono uppercase focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <!-- Selector Visual de Iconos Vectoriales -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium">
                Icono Oficial de Representación
              </label>
              <span class="text-[10px] text-zinc-400 font-mono">
                Seleccionado: {{ formSector.icono }}
              </span>
            </div>

            <div class="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2.5">
              <!-- Filtro rápido de icono -->
              <input
                v-model="busquedaIcono"
                type="text"
                placeholder="Buscar icono por temática (médico, industria, finanzas...)"
                class="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-[11px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
              />

              <!-- Cuadrícula de iconos -->
              <div class="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto p-1">
                <button
                  v-for="ico in iconosFiltrados"
                  :key="ico.id"
                  type="button"
                  @click="formSector.icono = ico.id"
                  :class="[
                    'flex flex-col items-center justify-center p-2 rounded-lg border text-center transition group',
                    formSector.icono === ico.id
                      ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100'
                  ]"
                  :title="ico.label"
                >
                  <component :is="ico.componente" class="w-4 h-4 mb-1" />
                  <span class="text-[9px] truncate w-full block font-mono">{{ ico.id }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Selector de Paleta Cromática -->
          <div>
            <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1.5">
              Paleta de Color y Distintivo
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                v-for="pal in PALETA_COLORES_SECTOR"
                :key="pal.id"
                type="button"
                @click="formSector.colorId = pal.id"
                :class="[
                  'flex items-center gap-2 p-2 rounded-lg border text-left transition',
                  formSector.colorId === pal.id
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-500/5'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-400 dark:hover:border-zinc-600'
                ]"
              >
                <span :class="['w-3 h-3 rounded-full shrink-0', pal.dotColor]"></span>
                <span class="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate">{{ pal.label }}</span>
                <Check v-if="formSector.colorId === pal.id" class="w-3 h-3 text-indigo-500 ml-auto shrink-0" />
              </button>
            </div>
          </div>

          <!-- Vista Previa en Vivo -->
          <div class="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <span class="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
              VISTA PREVIA EN VIVO
            </span>
            <div class="flex items-center gap-3">
              <span
                :class="[
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-medium',
                  PALETA_COLORES_SECTOR.find((p) => p.id === formSector.colorId)?.color || 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
                ]"
              >
                <component :is="sectoresService.obtenerIconoComponente(formSector.icono)" class="w-3.5 h-3.5 shrink-0" />
                <span>{{ formSector.nombre || 'Nombre del Sector' }}</span>
              </span>
              <span class="text-[10px] text-zinc-400">
                Así se visualizará en la tabla de clientes, tableros y selectores.
              </span>
            </div>
          </div>

          <!-- Descripción -->
          <div>
            <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Descripción / Alcance Comercial</label>
            <textarea
              v-model="formSector.descripcion"
              rows="2"
              placeholder="Detalla qué tipos de empresas o giros de negocio pertenecen a este sector..."
              class="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 transition resize-none"
            ></textarea>
          </div>
        </div>

        <!-- Pie del Modal -->
        <div class="px-5 py-3 border-t border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#0a0a0d] flex items-center justify-end gap-2.5">
          <button
            type="button"
            @click="modalSectorAbierto = false"
            class="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="guardarSectorModal"
            class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition flex items-center gap-1.5 shadow-sm shadow-indigo-500/20"
          >
            <Save class="w-3.5 h-3.5" />
            <span>{{ sectorEditando ? 'Guardar Cambios' : 'Crear Sector' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
