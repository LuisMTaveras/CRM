<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { 
  X, 
  Building2, 
  Plus, 
  Loader2, 
  Users, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  DollarSign,
  Globe
} from 'lucide-vue-next';
import { ClienteSchema, type NuevoClienteInput } from '../types/cliente.types';
import { clienteService } from '../services/cliente.service';
import { formatCurrency } from '@/core/formatters/formatters';
import { toastService } from '@/core/notifications/toast.service';
import AppSelect, { type SelectOption } from '@/shared/components/AppSelect.vue';
import SectorBadge from '@/shared/components/SectorBadge.vue';
import { sectoresService } from '../services/sectores.service';

defineProps<{
  abierto: boolean;
}>();

const emit = defineEmits<{
  (e: 'cerrar'): void;
  (e: 'creado'): void;
}>();

const pasoActual = ref(1);
const guardando = ref(false);
const errores = ref<Record<string, string>>({});

// Opciones dinámicas de sectores desde el Maestro de Sectores Económicos
const opcionesSector = computed<Array<SelectOption<string>>>(() => {
  return sectoresService.obtenerOpcionesSelect(false);
});

const opcionesEstado: Array<SelectOption<string>> = [
  { value: 'prospecto', label: 'Prospecto', dotColor: 'bg-amber-400' },
  { value: 'en_negociacion', label: 'En Negociación', dotColor: 'bg-indigo-400' },
  { value: 'activo', label: 'Activo', dotColor: 'bg-emerald-400' },
];

const opcionesPrioridad: Array<SelectOption<string>> = [
  { value: 'alta', label: 'Alta (Estratégica)', dotColor: 'bg-rose-400' },
  { value: 'media', label: 'Media', dotColor: 'bg-amber-400' },
  { value: 'baja', label: 'Baja', dotColor: 'bg-sky-400' },
];

const opcionesResponsables: Array<SelectOption<string>> = [
  { value: 'Camila Morales', label: 'Camila Morales' },
  { value: 'Ignacio Silva', label: 'Ignacio Silva' },
  { value: 'Felipe Guzmán', label: 'Felipe Guzmán' },
  { value: 'Roberto Méndez', label: 'Roberto Méndez' },
  { value: 'Valentina Castillo', label: 'Valentina Castillo' },
  { value: 'Marcos Almonte', label: 'Marcos Almonte' },
  { value: 'Daniela Rosario', label: 'Daniela Rosario' },
  { value: 'Laura Peña', label: 'Laura Peña' },
];

// Estado del formulario localizado para República Dominicana
const formulario = reactive<NuevoClienteInput>({
  razon_social: '',
  nombre_comercial: '',
  identificacion_fiscal: '',
  sector: 'Tecnología & Cloud',
  estado: 'prospecto',
  prioridad: 'media',
  email: '',
  telefono: '+1 (809) ',
  sitio_web: '',
  ciudad: 'Santo Domingo',
  direccion: '',
  valor_estimado: 10000000,
  responsable: 'Camila Morales',
  contacto_nombre: '',
  contacto_cargo: '',
  contacto_email: '',
  contacto_telefono: '',
});

// Formateador de teléfono en tiempo real para República Dominicana (+1 809/829/849)
const manejarInputTelefono = (e: Event) => {
  const input = e.target as HTMLInputElement;
  let val = input.value;
  const soloNumeros = val.replace(/\D/g, '');
  
  if (soloNumeros.startsWith('1')) {
    const nums = soloNumeros.slice(1);
    if (nums.length <= 3) {
      val = `+1 (${nums}`;
    } else if (nums.length <= 6) {
      val = `+1 (${nums.slice(0, 3)}) ${nums.slice(3)}`;
    } else {
      val = `+1 (${nums.slice(0, 3)}) ${nums.slice(3, 6)}-${nums.slice(6, 10)}`;
    }
  } else if (soloNumeros.length > 0) {
    if (soloNumeros.length <= 3) {
      val = `+1 (${soloNumeros}`;
    } else if (soloNumeros.length <= 6) {
      val = `+1 (${soloNumeros.slice(0, 3)}) ${soloNumeros.slice(3)}`;
    } else {
      val = `+1 (${soloNumeros.slice(0, 3)}) ${soloNumeros.slice(3, 6)}-${soloNumeros.slice(6, 10)}`;
    }
  }
  
  formulario.telefono = val;
};

// Formateo visual del monto en pesos dominicanos (RD$)
const montoFormateado = computed(() => {
  return formatCurrency(formulario.valor_estimado || 0);
});

// Botones de incremento rápido de monto para agilidad comercial
const ajustarMonto = (delta: number) => {
  formulario.valor_estimado = Math.max(0, (formulario.valor_estimado || 0) + delta);
};

const reiniciarFormulario = () => {
  formulario.razon_social = '';
  formulario.nombre_comercial = '';
  formulario.identificacion_fiscal = '';
  formulario.sector = 'Tecnología & Cloud';
  formulario.estado = 'prospecto';
  formulario.prioridad = 'media';
  formulario.email = '';
  formulario.telefono = '+1 (809) ';
  formulario.sitio_web = '';
  formulario.ciudad = 'Santo Domingo';
  formulario.direccion = '';
  formulario.valor_estimado = 10000000;
  formulario.responsable = 'Camila Morales';
  formulario.contacto_nombre = '';
  formulario.contacto_cargo = '';
  formulario.contacto_email = '';
  formulario.contacto_telefono = '';
  errores.value = {};
  pasoActual.value = 1;
};

// Validación de cada paso del wizard
const validarPaso = (paso: number): boolean => {
  errores.value = {};
  if (paso === 1) {
    if (!formulario.razon_social || formulario.razon_social.trim().length < 3) {
      errores.value.razon_social = 'La razón social debe tener al menos 3 caracteres.';
    }
    if (!formulario.identificacion_fiscal || formulario.identificacion_fiscal.trim().length < 4) {
      errores.value.identificacion_fiscal = 'Identificación fiscal / RNC requerida.';
    }
    if (!formulario.sector) {
      errores.value.sector = 'Debe seleccionar un sector económico.';
    }
    return Object.keys(errores.value).length === 0;
  }

  if (paso === 2) {
    if (formulario.valor_estimado < 0) {
      errores.value.valor_estimado = 'El valor estimado no puede ser negativo.';
    }
    if (!formulario.responsable) {
      errores.value.responsable = 'Debe asignar un responsable comercial.';
    }
    return Object.keys(errores.value).length === 0;
  }

  return true;
};

const irAlPaso = (nuevoPaso: number) => {
  if (nuevoPaso > pasoActual.value) {
    for (let p = pasoActual.value; p < nuevoPaso; p++) {
      if (!validarPaso(p)) return;
    }
  }
  pasoActual.value = nuevoPaso;
};

const siguientePaso = () => {
  if (validarPaso(pasoActual.value)) {
    pasoActual.value = Math.min(3, pasoActual.value + 1);
  }
};

const anteriorPaso = () => {
  pasoActual.value = Math.max(1, pasoActual.value - 1);
};

const guardar = async () => {
  errores.value = {};
  
  // Validación de esquema Zod global
  const resultado = ClienteSchema.safeParse(formulario);
  if (!resultado.success) {
    const formatted = resultado.error.format();
    for (const [key, value] of Object.entries(formatted)) {
      if (key !== '_errors' && value && '_errors' in value && Array.isArray((value as { _errors: string[] })._errors)) {
        errores.value[key] = (value as { _errors: string[] })._errors[0] || '';
      }
    }

    // Regresar al paso que contiene el primer error
    if (errores.value.razon_social || errores.value.identificacion_fiscal || errores.value.sector) {
      pasoActual.value = 1;
    } else if (errores.value.valor_estimado || errores.value.responsable) {
      pasoActual.value = 2;
    } else {
      pasoActual.value = 3;
    }
    return;
  }

  guardando.value = true;
  try {
    await clienteService.crearCliente(resultado.data);
    toastService.exito(`Cliente "${formulario.razon_social}" registrado con éxito.`);
    reiniciarFormulario();
    emit('creado');
    emit('cerrar');
  } catch (err: unknown) {
    toastService.error(err instanceof Error ? err.message : 'Error al guardar el nuevo cliente');
  } finally {
    guardando.value = false;
  }
};
</script>

<template>
  <div v-if="abierto" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop oscuro -->
    <div @click="emit('cerrar')" class="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"></div>

    <!-- Modal Card Ampliado (max-w-4xl) con Pasos Numerados -->
    <div class="relative bg-white dark:bg-[#0e0e12] border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col z-10 overflow-hidden text-xs">
      
      <!-- Cabecera Principal del Modal -->
      <div class="px-6 py-4 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#0a0a0d] flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Building2 class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm sm:text-base font-semibold text-zinc-900 dark:text-white tracking-tight">
              Registrar Nueva Cuenta Comercial B2B
            </h3>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
              Proceso estructurado por etapas para la incorporación de clientes a la cartera comercial
            </p>
          </div>
        </div>
        <button
          @click="emit('cerrar')"
          class="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Barra de Pasos Numerados (Step Wizard Header) -->
      <div class="px-6 py-3.5 bg-zinc-100/60 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800/80">
        <div class="grid grid-cols-3 gap-2 sm:gap-4">
          <!-- Paso 1 -->
          <button
            type="button"
            @click="irAlPaso(1)"
            class="flex items-center gap-3 text-left group transition p-1.5 rounded-xl hover:bg-white/50 dark:hover:bg-zinc-900/50"
          >
            <div
              :class="[
                'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all',
                pasoActual === 1
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20 shadow-md shadow-indigo-600/30'
                  : pasoActual > 1
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
              ]"
            >
              <Check v-if="pasoActual > 1" class="w-4 h-4 stroke-[2.5]" />
              <span v-else>1</span>
            </div>
            <div class="min-w-0 hidden sm:block">
              <span
                :class="[
                  'block font-semibold text-xs truncate',
                  pasoActual === 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-800 dark:text-zinc-300'
                ]"
              >
                1. Empresa & RNC
              </span>
              <span class="block text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                Identificación y Sector
              </span>
            </div>
          </button>

          <!-- Paso 2 -->
          <button
            type="button"
            @click="irAlPaso(2)"
            class="flex items-center gap-3 text-left group transition p-1.5 rounded-xl hover:bg-white/50 dark:hover:bg-zinc-900/50"
          >
            <div
              :class="[
                'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all',
                pasoActual === 2
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20 shadow-md shadow-indigo-600/30'
                  : pasoActual > 2
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
              ]"
            >
              <Check v-if="pasoActual > 2" class="w-4 h-4 stroke-[2.5]" />
              <span v-else>2</span>
            </div>
            <div class="min-w-0 hidden sm:block">
              <span
                :class="[
                  'block font-semibold text-xs truncate',
                  pasoActual === 2 ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-800 dark:text-zinc-300'
                ]"
              >
                2. Clasificación
              </span>
              <span class="block text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                Cartera & Responsable
              </span>
            </div>
          </button>

          <!-- Paso 3 -->
          <button
            type="button"
            @click="irAlPaso(3)"
            class="flex items-center gap-3 text-left group transition p-1.5 rounded-xl hover:bg-white/50 dark:hover:bg-zinc-900/50"
          >
            <div
              :class="[
                'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all',
                pasoActual === 3
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20 shadow-md shadow-indigo-600/30'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
              ]"
            >
              <span>3</span>
            </div>
            <div class="min-w-0 hidden sm:block">
              <span
                :class="[
                  'block font-semibold text-xs truncate',
                  pasoActual === 3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-800 dark:text-zinc-300'
                ]"
              >
                3. Contacto & Ubicación
              </span>
              <span class="block text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                Teléfonos, Correo y Enlace
              </span>
            </div>
          </button>
        </div>
      </div>

      <!-- Contenido de los Pasos (Scrollable) -->
      <form @submit.prevent="guardar" class="p-6 overflow-y-auto flex-1 space-y-6">

        <!-- ==================== PASO 1: IDENTIFICACIÓN & EMPRESA ==================== -->
        <div v-show="pasoActual === 1" class="space-y-4">
          <div class="pb-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <h4 class="font-semibold text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <Building2 class="w-4 h-4 text-indigo-500" />
              <span>Identificación Fiscal y Registro Corporativo</span>
            </h4>
            <span class="text-[11px] text-zinc-400">Campos obligatorios marcados con *</span>
          </div>

          <!-- Razón Social y Nombre Comercial -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1.5">
                Razón Social Oficial <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="formulario.razon_social"
                type="text"
                placeholder="Ej: Banco BHD S.A. o Claro Dominicana"
                class="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition"
              />
              <span v-if="errores.razon_social" class="text-rose-500 text-[10px] mt-1 block font-medium">
                {{ errores.razon_social }}
              </span>
            </div>

            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1.5">
                Nombre Comercial / Marca Fantasía
              </label>
              <input
                v-model="formulario.nombre_comercial"
                type="text"
                placeholder="Ej: BHD B2B o Claro Empresas"
                class="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <!-- RNC Dominicano y Sector Económico con Maestro Oficial -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-zinc-700 dark:text-zinc-300 font-medium">
                  Identificación Fiscal / RNC Dominicano <span class="text-rose-500">*</span>
                </label>
                <span class="text-[10px] font-mono text-zinc-400">DGII RD</span>
              </div>
              <input
                v-model="formulario.identificacion_fiscal"
                type="text"
                placeholder="Ej: 1-01-02845-6 o 131-09876-2"
                class="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition font-mono"
              />
              <span v-if="errores.identificacion_fiscal" class="text-rose-500 text-[10px] mt-1 block font-medium">
                {{ errores.identificacion_fiscal }}
              </span>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-zinc-700 dark:text-zinc-300 font-medium">
                  Sector Económico & Simbología <span class="text-rose-500">*</span>
                </label>
                <!-- Insignia en vivo con el icono oficial asignado -->
                <SectorBadge :sector="formulario.sector" tamano="xs" />
              </div>
              <AppSelect
                v-model="formulario.sector"
                :options="opcionesSector"
                :full-width="true"
                placeholder="Seleccione el sector económico..."
              />
              <span v-if="errores.sector" class="text-rose-500 text-[10px] mt-1 block font-medium">
                {{ errores.sector }}
              </span>
            </div>
          </div>

          <!-- Sitio Web Oficial -->
          <div>
            <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1.5 flex items-center gap-1.5">
              <Globe class="w-3.5 h-3.5 text-zinc-400" />
              <span>Sitio Web Corporativo / Portal de la Empresa</span>
            </label>
            <input
              v-model="formulario.sitio_web"
              type="url"
              placeholder="https://www.empresa.com.do"
              class="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition font-mono"
            />
          </div>
        </div>

        <!-- ==================== PASO 2: CLASIFICACIÓN & ASIGNACIÓN ==================== -->
        <div v-show="pasoActual === 2" class="space-y-4">
          <div class="pb-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <h4 class="font-semibold text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <Briefcase class="w-4 h-4 text-indigo-500" />
              <span>Clasificación Comercial, Prioridad y Cartera</span>
            </h4>
            <span class="text-[11px] text-zinc-400">Etapa en el embudo comercial</span>
          </div>

          <!-- Estado y Prioridad -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1.5">
                Estado Comercial Inicial
              </label>
              <AppSelect
                v-model="formulario.estado"
                :options="opcionesEstado"
                :full-width="true"
              />
            </div>

            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1.5">
                Nivel de Prioridad Comercial
              </label>
              <AppSelect
                v-model="formulario.prioridad"
                :options="opcionesPrioridad"
                :full-width="true"
              />
            </div>
          </div>

          <!-- Responsable Comercial Asignado -->
          <div>
            <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1.5">
              Ejecutivo Comercial Responsable de Cuenta <span class="text-rose-500">*</span>
            </label>
            <AppSelect
              v-model="formulario.responsable"
              :options="opcionesResponsables"
              :full-width="true"
            />
            <span v-if="errores.responsable" class="text-rose-500 text-[10px] mt-1 block font-medium">
              {{ errores.responsable }}
            </span>
          </div>

          <!-- Valor Estimado del Pipeline con Formateador RD$ -->
          <div class="p-4 bg-zinc-50 dark:bg-zinc-950/80 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div class="flex items-center justify-between">
              <label class="text-zinc-800 dark:text-zinc-200 font-medium flex items-center gap-1.5">
                <DollarSign class="w-3.5 h-3.5 text-indigo-500" />
                <span>Valor Comercial Estimado / Cartera Proyectada</span>
              </label>
              <span class="font-mono text-indigo-600 dark:text-indigo-400 font-bold text-xs bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                {{ montoFormateado }}
              </span>
            </div>

            <div class="relative">
              <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-xs font-semibold">
                RD$
              </div>
              <input
                v-model.number="formulario.valor_estimado"
                type="number"
                min="0"
                step="500000"
                class="w-full pl-12 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <!-- Botones de Incremento Rápido -->
            <div class="flex items-center gap-2">
              <span class="text-[11px] text-zinc-500">Ajuste rápido:</span>
              <button
                type="button"
                @click="ajustarMonto(500000)"
                class="px-2 py-1 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-[11px] font-mono border border-zinc-200 dark:border-zinc-800 transition"
              >
                + 500K
              </button>
              <button
                type="button"
                @click="ajustarMonto(1000000)"
                class="px-2 py-1 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-[11px] font-mono border border-zinc-200 dark:border-zinc-800 transition"
              >
                + 1M
              </button>
              <button
                type="button"
                @click="ajustarMonto(5000000)"
                class="px-2 py-1 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-[11px] font-mono border border-zinc-200 dark:border-zinc-800 transition"
              >
                + 5M
              </button>
            </div>
          </div>
        </div>

        <!-- ==================== PASO 3: CONTACTO & UBICACIÓN ==================== -->
        <div v-show="pasoActual === 3" class="space-y-5">
          <div class="pb-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <h4 class="font-semibold text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <MapPin class="w-4 h-4 text-indigo-500" />
              <span>Canales de Contacto Corporativo y Geolocalización</span>
            </h4>
            <span class="text-[11px] text-zinc-400">Canales de comunicación directa</span>
          </div>

          <!-- Email Corporativo y Teléfono -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1.5 flex items-center gap-1.5">
                <Mail class="w-3.5 h-3.5 text-zinc-400" />
                <span>Correo Electrónico Corporativo <span class="text-rose-500">*</span></span>
              </label>
              <input
                v-model="formulario.email"
                type="email"
                placeholder="contacto@empresa.com.do"
                class="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition"
              />
              <span v-if="errores.email" class="text-rose-500 text-[10px] mt-1 block font-medium">
                {{ errores.email }}
              </span>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-zinc-700 dark:text-zinc-300 font-medium flex items-center gap-1.5">
                  <Phone class="w-3.5 h-3.5 text-zinc-400" />
                  <span>Teléfono Central / PBX <span class="text-rose-500">*</span></span>
                </label>
                <span class="text-[10px] font-mono text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Rep. Dominicana
                </span>
              </div>
              <input
                :value="formulario.telefono"
                @input="manejarInputTelefono"
                type="text"
                placeholder="+1 (809) 555-0123"
                class="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition font-mono"
              />
              <span v-if="errores.telefono" class="text-rose-500 text-[10px] mt-1 block font-medium">
                {{ errores.telefono }}
              </span>
            </div>
          </div>

          <!-- Ciudad y Dirección Física -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1.5">
                Ciudad / Jurisdicción <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="formulario.ciudad"
                type="text"
                placeholder="Santo Domingo, Santiago de los Caballeros, Punta Cana..."
                class="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition"
              />
              <span v-if="errores.ciudad" class="text-rose-500 text-[10px] mt-1 block font-medium">
                {{ errores.ciudad }}
              </span>
            </div>

            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1.5">
                Dirección Física o Corporativa
              </label>
              <input
                v-model="formulario.direccion"
                type="text"
                placeholder="Av. Winston Churchill #1099, Torre Empresarial"
                class="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <!-- Contacto Principal Directo (Representante Legal o Enlace) -->
          <div class="p-4 bg-zinc-50 dark:bg-zinc-950/70 rounded-xl border border-zinc-200 dark:border-zinc-800/90 space-y-3">
            <div class="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <div class="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-semibold text-xs">
                <Users class="w-3.5 h-3.5 text-indigo-500" />
                <span>Persona de Contacto Principal</span>
              </div>
              <span class="text-[11px] text-zinc-400">Interlocutor comercial asignado</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-zinc-600 dark:text-zinc-400 text-[11px] mb-1">Nombre Completo</label>
                <input
                  v-model="formulario.contacto_nombre"
                  type="text"
                  placeholder="Ej: Lic. Roberto Méndez"
                  class="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label class="block text-zinc-600 dark:text-zinc-400 text-[11px] mb-1">Cargo / Posición</label>
                <input
                  v-model="formulario.contacto_cargo"
                  type="text"
                  placeholder="Ej: Director de Compras / CFO"
                  class="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label class="block text-zinc-600 dark:text-zinc-400 text-[11px] mb-1">Correo Directo</label>
                <input
                  v-model="formulario.contacto_email"
                  type="email"
                  placeholder="rmendez@empresa.com.do"
                  class="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label class="block text-zinc-600 dark:text-zinc-400 text-[11px] mb-1">Teléfono Directo / Celular</label>
                <input
                  v-model="formulario.contacto_telefono"
                  type="text"
                  placeholder="+1 (829) 555-0199"
                  class="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      </form>

      <!-- Pie del Modal con Navegación por Pasos -->
      <div class="px-6 py-4 border-t border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#0a0a0d] flex items-center justify-between">
        <button
          type="button"
          @click="emit('cerrar')"
          class="px-4 py-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl transition font-medium border border-zinc-300 dark:border-zinc-700"
        >
          Cancelar
        </button>

        <div class="flex items-center gap-2.5">
          <!-- Botón Anterior -->
          <button
            v-if="pasoActual > 1"
            type="button"
            @click="anteriorPaso"
            class="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl transition font-medium border border-zinc-300 dark:border-zinc-700"
          >
            <ArrowLeft class="w-3.5 h-3.5" />
            <span>Anterior</span>
          </button>

          <!-- Botón Siguiente (Pasos 1 y 2) -->
          <button
            v-if="pasoActual < 3"
            type="button"
            @click="siguientePaso"
            class="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition font-medium shadow-sm shadow-indigo-600/30"
          >
            <span>Siguiente Paso</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>

          <!-- Botón Final Guardar (Paso 3) -->
          <button
            v-else
            type="button"
            @click="guardar"
            :disabled="guardando"
            class="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/30"
          >
            <Loader2 v-if="guardando" class="w-4 h-4 animate-spin" />
            <Plus v-else class="w-4 h-4 stroke-[2.5]" />
            <span>{{ guardando ? 'Registrando en Base de Datos...' : 'Registrar Cuenta Comercial' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
