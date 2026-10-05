<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
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
  Eye
} from 'lucide-vue-next';
import { empresaService } from '../services/empresa.service';
import type { DatosEmpresa } from '../types/empresa.types';

const pestanaActiva = ref<'empresa' | 'sistema'>('empresa');
const formulario = reactive<DatosEmpresa>(empresaService.obtenerDatos());
const mensajeGuardado = ref(false);
const guardando = ref(false);

// Sincronizar si cambia externamente
watch(
  () => empresaService.datos,
  (nuevos) => {
    Object.assign(formulario, nuevos);
  },
  { deep: true }
);

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

const restablecer = () => {
  if (confirm('¿Desea restablecer los datos de la empresa a los valores iniciales predeterminados?')) {
    const defaultData = empresaService.restablecerPorDefecto();
    Object.assign(formulario, defaultData);
    mensajeGuardado.value = true;
    setTimeout(() => {
      mensajeGuardado.value = false;
    }, 2500);
  }
};
</script>

<template>
  <div class="space-y-6 max-w-5xl pb-10">
    <!-- Encabezado de la Sección -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
      <div>
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Building2 class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-xl font-bold text-zinc-100 tracking-tight">
              Ajustes de Empresa & Sistema
            </h1>
            <p class="text-xs text-zinc-400 mt-0.5">
              Personaliza la identidad corporativa que emite las propuestas, contratos, correos y reportes del CRM
            </p>
          </div>
        </div>
      </div>

      <!-- Selector de Pestañas -->
      <div class="flex items-center bg-zinc-900 p-1 rounded-lg border border-zinc-800 self-start sm:self-auto">
        <button
          type="button"
          @click="pestanaActiva = 'empresa'"
          :class="[
            'px-3.5 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5',
            pestanaActiva === 'empresa'
              ? 'bg-zinc-800 text-zinc-100 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          ]"
        >
          <Building2 class="w-3.5 h-3.5 text-emerald-400" />
          <span>Perfil de la Empresa</span>
        </button>
        <button
          type="button"
          @click="pestanaActiva = 'sistema'"
          :class="[
            'px-3.5 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5',
            pestanaActiva === 'sistema'
              ? 'bg-zinc-800 text-zinc-100 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          ]"
        >
          <Server class="w-3.5 h-3.5 text-sky-400" />
          <span>Servicios & Conexión</span>
        </button>
      </div>
    </div>

    <!-- PESTAÑA 1: PERFIL DE LA EMPRESA (PROPIETARIA DEL CRM) -->
    <div v-if="pestanaActiva === 'empresa'" class="space-y-6">
      <!-- Tarjeta de Vista Previa del Membrete Institucional en Tiempo Real -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3 relative overflow-hidden">
        <div class="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div class="flex items-center gap-2">
            <Eye class="w-4 h-4 text-emerald-400" />
            <span class="text-xs font-semibold text-zinc-200">
              Vista Previa del Membrete Oficial (Encabezado de Documentos y PDF)
            </span>
          </div>
          <span class="text-[10px] font-mono text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
            Formato A4 Dominicano
          </span>
        </div>

        <!-- Render visual simulado del membrete -->
        <div class="bg-white rounded-lg p-5 text-zinc-900 shadow-md border border-zinc-200 font-sans space-y-2">
          <div class="h-1.5 bg-emerald-500 rounded-full w-full mb-3"></div>
          <div class="flex items-start justify-between gap-4">
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
            <div class="text-right shrink-0">
              <span class="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 block">
                {{ formulario.prefijoDocumentos || 'DOC' }}-002841
              </span>
              <span class="text-[10px] text-zinc-500 block mt-1">
                Moneda: {{ formulario.monedaPrincipal }} ({{ formulario.simboloMoneda }})
              </span>
            </div>
          </div>
        </div>
        <p class="text-[11px] text-zinc-400 italic">
          💡 Esta cabecera se genera automáticamente en todas las cotizaciones, propuestas comerciales y contratos PDF despachados vía correo.
        </p>
      </div>

      <!-- Formulario de Configuración -->
      <form @submit.prevent="guardarCambios" class="space-y-6">
        <!-- Bloque 1: Identidad Legal y Razón Social -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b border-zinc-800 text-xs font-semibold text-zinc-200">
            <FileText class="w-4 h-4 text-emerald-400" />
            <span>Datos Legales e Identificación Fiscal</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label class="block text-zinc-400 font-medium mb-1">
                Razón Social Oficial (Nombre Jurídico) <span class="text-rose-400">*</span>
              </label>
              <input
                v-model="formulario.razonSocial"
                type="text"
                required
                placeholder="ej: MI EMPRESA DOMINICANA SRL"
                class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:border-zinc-600 transition"
              />
              <span class="text-[10px] text-zinc-500 mt-1 block">Aparece en contratos legales y pie de firma</span>
            </div>

            <div>
              <label class="block text-zinc-400 font-medium mb-1">
                Nombre Comercial / Marca <span class="text-rose-400">*</span>
              </label>
              <input
                v-model="formulario.nombreComercial"
                type="text"
                required
                placeholder="ej: MI MARCA B2B"
                class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:border-zinc-600 transition"
              />
              <span class="text-[10px] text-zinc-500 mt-1 block">Visible en la barra lateral del CRM y membrete</span>
            </div>

            <div>
              <label class="block text-zinc-400 font-medium mb-1">
                RNC Dominicano / Identificación Fiscal <span class="text-rose-400">*</span>
              </label>
              <input
                v-model="formulario.identificacionFiscal"
                type="text"
                required
                placeholder="ej: 1-32-45890-1"
                class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 font-mono focus:outline-none focus:border-zinc-600 transition"
              />
              <span class="text-[10px] text-zinc-500 mt-1 block">Registro Nacional de Contribuyentes oficial</span>
            </div>

            <div>
              <label class="block text-zinc-400 font-medium mb-1">
                Actividad Comercial / Slogan Institucional
              </label>
              <input
                v-model="formulario.sloganActividad"
                type="text"
                placeholder="ej: Soluciones de Software, Logística & Consultoría B2B"
                class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:border-zinc-600 transition"
              />
              <span class="text-[10px] text-zinc-500 mt-1 block">Subtítulo que acompaña al membrete</span>
            </div>
          </div>
        </div>

        <!-- Bloque 2: Contacto & Canales de Comunicación -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b border-zinc-800 text-xs font-semibold text-zinc-200">
            <Phone class="w-4 h-4 text-emerald-400" />
            <span>Canales de Contacto Corporativo</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label class="block text-zinc-400 font-medium mb-1">
                Teléfono Principal / Central <span class="text-rose-400">*</span>
              </label>
              <input
                v-model="formulario.telefono"
                type="text"
                required
                placeholder="+1 (809) 555-0100"
                class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 font-mono focus:outline-none focus:border-zinc-600 transition"
              />
            </div>

            <div>
              <label class="block text-zinc-400 font-medium mb-1">
                WhatsApp Comercial
              </label>
              <input
                v-model="formulario.whatsapp"
                type="text"
                placeholder="+1 (809) 555-0101"
                class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 font-mono focus:outline-none focus:border-zinc-600 transition"
              />
            </div>

            <div>
              <label class="block text-zinc-400 font-medium mb-1">
                Correo Institucional <span class="text-rose-400">*</span>
              </label>
              <input
                v-model="formulario.correo"
                type="email"
                required
                placeholder="contacto@miempresa.com.do"
                class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:border-zinc-600 transition"
              />
            </div>

            <div>
              <label class="block text-zinc-400 font-medium mb-1">
                Sitio Web Corporativo
              </label>
              <input
                v-model="formulario.sitioWeb"
                type="text"
                placeholder="www.miempresa.com.do"
                class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:border-zinc-600 transition"
              />
            </div>
          </div>
        </div>

        <!-- Bloque 3: Ubicación Física y Sede -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b border-zinc-800 text-xs font-semibold text-zinc-200">
            <MapPin class="w-4 h-4 text-emerald-400" />
            <span>Ubicación y Sede Principal</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div class="sm:col-span-2">
              <label class="block text-zinc-400 font-medium mb-1">
                Dirección Física <span class="text-rose-400">*</span>
              </label>
              <input
                v-model="formulario.direccion"
                type="text"
                required
                placeholder="Av. Winston Churchill, Torre Empresarial, Suite 802"
                class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:border-zinc-600 transition"
              />
            </div>

            <div>
              <label class="block text-zinc-400 font-medium mb-1">
                Ciudad / Distrito <span class="text-rose-400">*</span>
              </label>
              <input
                v-model="formulario.ciudad"
                type="text"
                required
                placeholder="Santo Domingo"
                class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:border-zinc-600 transition"
              />
            </div>
          </div>
        </div>

        <!-- Bloque 4: Preferencias Comerciales y Formatos -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b border-zinc-800 text-xs font-semibold text-zinc-200">
            <CreditCard class="w-4 h-4 text-emerald-400" />
            <span>Moneda & Parámetros Documentales</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label class="block text-zinc-400 font-medium mb-1">
                Moneda Principal de Cotización
              </label>
              <select
                v-model="formulario.monedaPrincipal"
                class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:border-zinc-600 transition"
              >
                <option value="DOP">DOP — Peso Dominicano (RD$)</option>
                <option value="USD">USD — Dólar Estadounidense ($)</option>
                <option value="EUR">EUR — Euro (€)</option>
              </select>
            </div>

            <div>
              <label class="block text-zinc-400 font-medium mb-1">
                Prefijo de Documentos / Propuestas
              </label>
              <input
                v-model="formulario.prefijoDocumentos"
                type="text"
                placeholder="DF-PROP o COT"
                class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 font-mono uppercase focus:outline-none focus:border-zinc-600 transition"
              />
            </div>

            <div class="sm:col-span-3">
              <label class="block text-zinc-400 font-medium mb-1">
                Pie de Página Institucional (Documentos PDF)
              </label>
              <textarea
                v-model="formulario.piePaginaOficial"
                rows="2"
                placeholder="Texto legal que se imprime al pie de cada página en los PDF despachados"
                class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 text-xs focus:outline-none focus:border-zinc-600 transition resize-none"
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
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold shadow-md transition disabled:opacity-50"
            >
              <Save class="w-4 h-4" />
              <span>Guardar Información de la Empresa</span>
            </button>

            <button
              type="button"
              @click="restablecer"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition"
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
              class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
            >
              <CheckCircle2 class="w-4 h-4 text-emerald-400" />
              <span>¡Información de la empresa guardada y sincronizada con el CRM!</span>
            </div>
          </transition>
        </div>
      </form>
    </div>

    <!-- PESTAÑA 2: SERVICIOS Y CONECTIVIDAD DEL SISTEMA -->
    <div v-else class="space-y-6">
      <!-- Tarjeta de Estado de Conexión PostgreSQL -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div class="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <Database class="w-4 h-4 text-emerald-400" />
            <span>Motor de Base de Datos PostgreSQL</span>
          </div>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 class="w-3 h-3" />
            Conectado
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div class="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80">
            <span class="text-zinc-500 text-[10px] block font-sans">HOST</span>
            <span class="text-zinc-200">localhost</span>
          </div>
          <div class="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80">
            <span class="text-zinc-500 text-[10px] block font-sans">PUERTO</span>
            <span class="text-zinc-200">5432</span>
          </div>
          <div class="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80">
            <span class="text-zinc-500 text-[10px] block font-sans">BASE DE DATOS</span>
            <span class="text-zinc-200">crm_db</span>
          </div>
          <div class="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80">
            <span class="text-zinc-500 text-[10px] block font-sans">MODO OPERACIÓN</span>
            <span class="text-emerald-400">PostgreSQL Mock / Live</span>
          </div>
        </div>
      </div>

      <!-- Tarjeta de Servidor de Correo Nodemailer -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div class="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <Mail class="w-4 h-4 text-emerald-400" />
            <span>Servidor de Correo Nodemailer (SMTP / IMAP)</span>
          </div>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Puerto 3002
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div class="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 space-y-1">
            <div class="font-medium text-zinc-200">Despacho Masivo & Generación de PDF</div>
            <p class="text-[11px] text-zinc-400 leading-relaxed">
              Servidor backend dedicado con soporte de cola para envíos masivos, verificación de credenciales con handshake TLS real y conversión de documentos Word a PDF.
            </p>
          </div>

          <div class="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 space-y-2 flex flex-col justify-between">
            <div>
              <div class="font-medium text-zinc-200">Protocolos Salientes y Entrantes</div>
              <p class="text-[11px] text-zinc-400 leading-relaxed">
                Puedes configurar el host SMTP, puerto, cifrado SSL/TLS, remitente corporativo y servidor IMAP directamente desde el módulo de Comunicaciones.
              </p>
            </div>
            <router-link
              to="/comunicaciones"
              class="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
            >
              <span>Ir a Comunicaciones & Servidor SMTP →</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
