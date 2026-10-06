<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { X, Building2, Plus, Loader2, Users } from 'lucide-vue-next';
import { ClienteSchema, type NuevoClienteInput } from '../types/cliente.types';
import { clienteService } from '../services/cliente.service';
import { formatearMoneda } from '@/core/lib/utils';

defineProps<{
  abierto: boolean;
}>();

const emit = defineEmits<{
  (e: 'cerrar'): void;
  (e: 'creado'): void;
}>();

const guardando = ref(false);
const errores = ref<Record<string, string>>({});

// Estado del formulario localizado para República Dominicana
const formulario = reactive<NuevoClienteInput>({
  razon_social: '',
  nombre_comercial: '',
  identificacion_fiscal: '',
  sector: 'Tecnología',
  estado: 'prospecto',
  prioridad: 'media',
  email: '',
  telefono: '+1 (809) ',
  sitio_web: '',
  ciudad: 'Santo Domingo',
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
  
  // Limpiar caracteres no numéricos
  const soloNumeros = val.replace(/\D/g, '');
  
  // Si comienza con 1 (código país RD / NANP)
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
  return formatearMoneda(formulario.valor_estimado || 0);
});

// Botones de incremento rápido de monto para agilidad comercial
const ajustarMonto = (delta: number) => {
  formulario.valor_estimado = Math.max(0, (formulario.valor_estimado || 0) + delta);
};

const reiniciarFormulario = () => {
  formulario.razon_social = '';
  formulario.nombre_comercial = '';
  formulario.identificacion_fiscal = '';
  formulario.sector = 'Tecnología';
  formulario.estado = 'prospecto';
  formulario.prioridad = 'media';
  formulario.email = '';
  formulario.telefono = '+1 (809) ';
  formulario.sitio_web = '';
  formulario.ciudad = 'Santo Domingo';
  formulario.valor_estimado = 10000000;
  formulario.responsable = 'Camila Morales';
  formulario.contacto_nombre = '';
  formulario.contacto_cargo = '';
  formulario.contacto_email = '';
  formulario.contacto_telefono = '';
  errores.value = {};
};

const guardar = async () => {
  errores.value = {};
  
  // Validación de esquema Zod (Blueprint 02)
  const resultado = ClienteSchema.safeParse(formulario);
  if (!resultado.success) {
    const formatted = resultado.error.format();
    for (const [key, value] of Object.entries(formatted)) {
      if (key !== '_errors' && value && '_errors' in value && Array.isArray((value as { _errors: string[] })._errors)) {
        errores.value[key] = (value as { _errors: string[] })._errors[0] || '';
      }
    }
    return;
  }

  guardando.value = true;
  try {
    await clienteService.crearCliente(resultado.data);
    reiniciarFormulario();
    emit('creado');
    emit('cerrar');
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : 'Error al guardar el nuevo cliente');
  } finally {
    guardando.value = false;
  }
};
</script>

<template>
  <div v-if="abierto" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div @click="emit('cerrar')" class="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"></div>

    <!-- Modal Card -->
    <div class="relative bg-[#0e0e12] border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col z-10 overflow-hidden text-xs">
      <!-- Cabecera -->
      <div class="px-5 py-4 border-b border-white/[0.07] bg-[#0a0a0d] flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Building2 class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-white tracking-tight">Registrar Nueva Cuenta Comercial</h3>
            <p class="text-[11px] text-zinc-400">Incorporación de cliente B2B a la base de datos PostgreSQL</p>
          </div>
        </div>
        <button
          @click="emit('cerrar')"
          class="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 rounded-lg transition"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Formulario con scroll -->
      <form @submit.prevent="guardar" class="p-5 overflow-y-auto space-y-4">
        <!-- Razón Social y Nombre Comercial -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label class="block text-zinc-300 font-medium mb-1">Razón Social *</label>
            <input
              v-model="formulario.razon_social"
              type="text"
              placeholder="Ej: Grupo Ramos S.A."
              class="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:border-zinc-600 transition"
            />
            <span v-if="errores.razon_social" class="text-rose-400 text-[10px] mt-0.5 block">{{ errores.razon_social }}</span>
          </div>

          <div>
            <label class="block text-zinc-300 font-medium mb-1">Nombre Comercial</label>
            <input
              v-model="formulario.nombre_comercial"
              type="text"
              placeholder="Ej: Sirena B2B"
              class="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:border-zinc-600 transition"
            />
          </div>
        </div>

        <!-- Identificación Fiscal RNC y Sector -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label class="block text-zinc-300 font-medium mb-1">Identificación Fiscal / RNC *</label>
            <input
              v-model="formulario.identificacion_fiscal"
              type="text"
              placeholder="Ej: 1-01-02845-6 o 131-09876-2"
              class="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:border-zinc-600 transition font-mono"
            />
            <span v-if="errores.identificacion_fiscal" class="text-rose-400 text-[10px] mt-0.5 block">{{ errores.identificacion_fiscal }}</span>
          </div>

          <div>
            <label class="block text-zinc-300 font-medium mb-1">Sector Empresarial *</label>
            <select
              v-model="formulario.sector"
              class="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:border-zinc-600 transition"
            >
              <option value="Tecnología">Tecnología</option>
              <option value="Finanzas">Finanzas</option>
              <option value="Logística">Logística</option>
              <option value="Turismo">Turismo & Hotelería</option>
              <option value="Salud">Salud</option>
              <option value="Retail">Retail</option>
              <option value="Manufactura">Manufactura</option>
              <option value="Alimentos">Alimentos</option>
              <option value="Comercio">Comercio Mayorista</option>
            </select>
          </div>
        </div>

        <!-- Estado Inicial, Prioridad y Responsable -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label class="block text-zinc-300 font-medium mb-1">Estado Inicial</label>
            <select
              v-model="formulario.estado"
              class="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:border-zinc-600 transition"
            >
              <option value="prospecto">Prospecto</option>
              <option value="en_negociacion">En Negociación</option>
              <option value="activo">Activo</option>
            </select>
          </div>

          <div>
            <label class="block text-zinc-300 font-medium mb-1">Prioridad</label>
            <select
              v-model="formulario.prioridad"
              class="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:border-zinc-600 transition"
            >
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>

          <div>
            <label class="block text-zinc-300 font-medium mb-1">Responsable Comercial *</label>
            <select
              v-model="formulario.responsable"
              class="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:border-zinc-600 transition"
            >
              <option value="Camila Morales">Camila Morales</option>
              <option value="Ignacio Silva">Ignacio Silva</option>
              <option value="Felipe Guzmán">Felipe Guzmán</option>
              <option value="Roberto Méndez">Roberto Méndez</option>
              <option value="Valentina Castillo">Valentina Castillo</option>
              <option value="Marcos Almonte">Marcos Almonte</option>
              <option value="Daniela Rosario">Daniela Rosario</option>
              <option value="Laura Peña">Laura Peña</option>
            </select>
          </div>
        </div>

        <!-- Comunicación: Email y Teléfono (Formato Rep. Dominicana) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label class="block text-zinc-300 font-medium mb-1">Correo Electrónico *</label>
            <input
              v-model="formulario.email"
              type="email"
              placeholder="contacto@empresa.com.do"
              class="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:border-zinc-600 transition"
            />
            <span v-if="errores.email" class="text-rose-400 text-[10px] mt-0.5 block">{{ errores.email }}</span>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-zinc-300 font-medium">Teléfono Corporativo (Rep. Dom.) *</label>
              <span class="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                809 / 829 / 849
              </span>
            </div>
            <input
              :value="formulario.telefono"
              @input="manejarInputTelefono"
              type="text"
              placeholder="+1 (809) 555-0123"
              class="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:border-zinc-600 transition font-mono"
            />
            <span v-if="errores.telefono" class="text-rose-400 text-[10px] mt-0.5 block">{{ errores.telefono }}</span>
          </div>
        </div>

        <!-- Ciudad y Valor Estimado con Formato RD$ en Tiempo Real -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label class="block text-zinc-300 font-medium mb-1">Ciudad (Rep. Dom.) *</label>
            <input
              v-model="formulario.ciudad"
              type="text"
              placeholder="Santo Domingo, Santiago, Punta Cana, La Romana..."
              class="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:border-zinc-600 transition"
            />
            <span v-if="errores.ciudad" class="text-rose-400 text-[10px] mt-0.5 block">{{ errores.ciudad }}</span>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-zinc-300 font-medium">Valor Estimado del Pipeline *</label>
              <span class="font-mono text-emerald-400 font-bold text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {{ montoFormateado }}
              </span>
            </div>

            <div class="relative">
              <div class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-xs font-semibold">
                RD$
              </div>
              <input
                v-model.number="formulario.valor_estimado"
                type="number"
                min="0"
                step="500000"
                class="w-full pl-12 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:border-zinc-600 transition font-mono text-xs"
              />
            </div>
            
            <!-- Botones de incremento rápido para agilizar la entrada de montos -->
            <div class="flex items-center gap-1.5 mt-2">
              <span class="text-[10px] text-zinc-500">Incrementar:</span>
              <button
                type="button"
                @click="ajustarMonto(500000)"
                class="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-mono border border-zinc-700 transition"
              >
                + 500K
              </button>
              <button
                type="button"
                @click="ajustarMonto(1000000)"
                class="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-mono border border-zinc-700 transition"
              >
                + 1M
              </button>
              <button
                type="button"
                @click="ajustarMonto(5000000)"
                class="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-mono border border-zinc-700 transition"
              >
                + 5M
              </button>
            </div>
            <span v-if="errores.valor_estimado" class="text-rose-400 text-[10px] mt-0.5 block">{{ errores.valor_estimado }}</span>
          </div>
        </div>

        <!-- Contacto Principal de la Empresa (Opcional) -->
        <div class="pt-3 border-t border-zinc-800/80 space-y-3">
          <div class="flex items-center gap-1.5 text-zinc-200 font-semibold text-xs">
            <Users class="w-3.5 h-3.5 text-emerald-400" />
            <span>Contacto Principal de la Empresa</span>
            <span class="text-[10px] text-zinc-500 font-normal">(Opcional, se asociará a esta empresa)</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label class="block text-zinc-400 text-[11px] mb-1">Nombre Completo del Contacto</label>
              <input
                v-model="formulario.contacto_nombre"
                type="text"
                placeholder="Ej: Lic. Roberto Méndez"
                class="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:border-zinc-600 transition"
              />
            </div>
            <div>
              <label class="block text-zinc-400 text-[11px] mb-1">Cargo / Posición</label>
              <input
                v-model="formulario.contacto_cargo"
                type="text"
                placeholder="Ej: Director de Compras / Gerente General"
                class="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:border-zinc-600 transition"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label class="block text-zinc-400 text-[11px] mb-1">Correo Electrónico Directo</label>
              <input
                v-model="formulario.contacto_email"
                type="email"
                placeholder="rmendez@empresa.com.do"
                class="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:border-zinc-600 transition"
              />
              <span v-if="errores.contacto_email" class="text-rose-400 text-[10px] mt-0.5 block">{{ errores.contacto_email }}</span>
            </div>
            <div>
              <label class="block text-zinc-400 text-[11px] mb-1">Teléfono Directo</label>
              <input
                v-model="formulario.contacto_telefono"
                type="text"
                placeholder="+1 (829) 555-0199"
                class="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:border-zinc-600 transition font-mono"
              />
            </div>
          </div>
        </div>
      </form>

      <!-- Pie del Modal -->
      <div class="px-5 py-3 border-t border-white/[0.07] bg-[#0a0a0d] flex items-center justify-end gap-2.5">
        <button
          type="button"
          @click="emit('cerrar')"
          class="px-3.5 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 rounded-lg transition font-medium border border-white/[0.08]"
        >
          Cancelar
        </button>
        <button
          type="button"
          @click="guardar"
          :disabled="guardando"
          class="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-emerald-950/40 border border-emerald-500/30 active:scale-[0.98]"
        >
          <Loader2 v-if="guardando" class="w-3.5 h-3.5 animate-spin" />
          <Plus v-else class="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{{ guardando ? 'Guardando en BD...' : 'Guardar Cliente' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
