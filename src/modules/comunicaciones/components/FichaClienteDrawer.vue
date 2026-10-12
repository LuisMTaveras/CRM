<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  X,
  Building2,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Briefcase,
  FileText,
  UserPlus,
  Send,
  Clock,
  AlertCircle
} from 'lucide-vue-next';
import type { Cliente } from '@/modules/clientes/types/cliente.types';
import { clienteService } from '@/modules/clientes/services/cliente.service';
import { actividadesService } from '@/modules/agenda/services/actividades.service';
import { formatCurrency, formatDate, formatPhoneNumber } from '@/core/formatters/formatters';

const props = defineProps<{
  abierto: boolean;
  cliente: Cliente | null;
  correoRemitente?: string;
  nombreRemitente?: string;
}>();

const emit = defineEmits<{
  (e: 'update:abierto', valor: boolean): void;
  (e: 'cliente-creado', nuevoCliente: Cliente): void;
  (e: 'abrir-nueva-oportunidad'): void;
  (e: 'abrir-nueva-actividad'): void;
}>();

// Estado de nueva nota rápida
const nuevaNota = ref('');
const guardandoNota = ref(false);

// Estado de creación rápida de cliente
const creandoCliente = ref(false);
const formNuevo = ref({
  razon_social: '',
  rnc: '',
  sector: 'Tecnología',
  telefono: '',
});

// Inicializar form de nuevo cliente cuando cambian props
const inicializarFormNuevo = () => {
  formNuevo.value.razon_social = props.nombreRemitente || (props.correoRemitente ? props.correoRemitente.split('@')[0] : '');
  formNuevo.value.sector = 'Tecnología';
  formNuevo.value.telefono = '';
};

watch(
  () => props.abierto,
  (val) => {
    if (val && !props.cliente) {
      inicializarFormNuevo();
    }
  },
  { immediate: true }
);

// Actividades de este cliente en Agenda
const actividadesCliente = computed(() => {
  if (!props.cliente) return [];
  return actividadesService.actividades.value.filter(
    (a) => a.clienteId === props.cliente?.id
  );
});

// Tareas pendientes
const tareasPendientes = computed(() => {
  return actividadesCliente.value.filter((a) => a.estado === 'pendiente');
});

// Oportunidades
const oportunidades = computed(() => {
  return props.cliente?.oportunidades || [];
});

// Bitácora / Historial de actividades registradas en ficha
const historialActividades = computed(() => {
  return props.cliente?.actividades || [];
});

// Enlace de WhatsApp
const enlaceWhatsApp = computed(() => {
  if (!props.cliente?.telefono) return null;
  const soloDigitos = props.cliente.telefono.replace(/\D/g, '');
  if (!soloDigitos) return null;
  return `https://wa.me/${soloDigitos.startsWith('1') ? soloDigitos : '1' + soloDigitos}`;
});

const cerrar = () => {
  emit('update:abierto', false);
};

const guardarNota = async () => {
  if (!props.cliente || !nuevaNota.value.trim() || guardandoNota.value) return;

  guardandoNota.value = true;
  try {
    await clienteService.agregarActividad(props.cliente.id, {
      tipo: 'nota',
      descripcion: nuevaNota.value.trim(),
      realizado_por: 'Ejecutivo Comercial',
    });
    nuevaNota.value = '';
  } catch (error) {
    console.error('Error al guardar nota:', error);
  } finally {
    guardandoNota.value = false;
  }
};

const registrarClienteRapido = async () => {
  if (!formNuevo.value.razon_social.trim() || creandoCliente.value) return;

  creandoCliente.value = true;
  try {
    const nuevo = await clienteService.crearCliente({
      razon_social: formNuevo.value.razon_social.trim(),
      identificacion_fiscal: formNuevo.value.rnc.trim() || 'RNC-PENDIENTE',
      email: props.correoRemitente || 'contacto@empresa.com',
      telefono: formNuevo.value.telefono.trim() || '809-000-0000',
      ciudad: 'Santo Domingo',
      sector: formNuevo.value.sector,
      estado: 'prospecto',
      prioridad: 'media',
      responsable: 'Ejecutivo Comercial',
      valor_estimado: 0,
      contacto_nombre: props.nombreRemitente || formNuevo.value.razon_social.trim(),
      contacto_cargo: 'Contacto Principal',
      contacto_email: props.correoRemitente || '',
      contacto_telefono: formNuevo.value.telefono.trim() || '',
    });

    emit('cliente-creado', nuevo);
  } catch (error) {
    console.error('Error al registrar cliente:', error);
  } finally {
    creandoCliente.value = false;
  }
};
</script>

<template>
  <div v-if="abierto" class="fixed inset-0 z-50 overflow-hidden">
    <!-- Backdrop con opacidad sutil -->
    <div
      class="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
      @click="cerrar"
    ></div>

    <div class="fixed inset-y-0 right-0 max-w-full flex pl-10">
      <div
        class="w-screen max-w-md bg-card border-l border-border shadow-2xl flex flex-col text-foreground animate-in slide-in-from-right duration-200"
      >
        <!-- Header -->
        <div class="p-5 border-b border-border flex items-start justify-between bg-muted/20">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20 shrink-0"
            >
              <Building2 v-if="cliente" class="w-5 h-5" />
              <UserPlus v-else class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-base font-semibold leading-tight line-clamp-1">
                {{ cliente ? cliente.razon_social : 'Remitente No Registrado' }}
              </h2>
              <p class="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {{ cliente ? (cliente.sector || 'Cliente B2B') : props.correoRemitente }}
              </p>
            </div>
          </div>
          <button
            type="button"
            class="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            @click="cerrar"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Contenido cuando EL CLIENTE ESTÁ REGISTRADO -->
        <div v-if="cliente" class="flex-1 overflow-y-auto p-5 space-y-6">
          <!-- Tarjeta de Estado y Contacto Rápido -->
          <div class="p-4 rounded-xl border border-border bg-card/60 shadow-sm space-y-3">
            <div class="flex items-center justify-between text-xs">
              <span class="text-muted-foreground font-medium">Estado Comercial</span>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
              >
                {{ cliente.estado.replace('_', ' ') }}
              </span>
            </div>

            <div class="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
              <div>
                <span class="text-muted-foreground block text-[11px]">Valor Estimado</span>
                <span class="font-bold text-foreground text-sm">
                  {{ formatCurrency(cliente.valor_estimado || 0) }}
                </span>
              </div>
              <div>
                <span class="text-muted-foreground block text-[11px]">Responsable</span>
                <span class="font-medium text-foreground truncate block">
                  {{ cliente.responsable || 'Sin asignar' }}
                </span>
              </div>
            </div>

            <!-- Accesos directos de comunicación -->
            <div class="flex items-center gap-2 pt-2 border-t border-border/60">
              <a
                v-if="cliente.telefono"
                :href="`tel:${cliente.telefono}`"
                class="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium bg-muted/60 hover:bg-muted text-foreground border border-border transition-colors"
                title="Llamar por teléfono"
              >
                <Phone class="w-3.5 h-3.5 text-sky-500" />
                <span class="truncate">{{ formatPhoneNumber(cliente.telefono) }}</span>
              </a>

              <a
                v-if="enlaceWhatsApp"
                :href="enlaceWhatsApp"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center p-2 rounded-lg text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 transition-colors"
                title="Abrir chat de WhatsApp"
              >
                <MessageSquare class="w-4 h-4" />
              </a>

              <a
                v-if="cliente.email"
                :href="`mailto:${cliente.email}`"
                class="inline-flex items-center justify-center p-2 rounded-lg text-xs font-medium bg-muted/60 hover:bg-muted text-foreground border border-border transition-colors"
                title="Enviar correo"
              >
                <Mail class="w-4 h-4" />
              </a>
            </div>
          </div>

          <!-- Oportunidades en Pipeline -->
          <div class="space-y-2.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Briefcase class="w-4 h-4 text-primary" />
                <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Tratos en Pipeline ({{ oportunidades.length }})
                </h3>
              </div>
              <button
                type="button"
                class="text-xs text-primary hover:underline font-semibold"
                @click="emit('abrir-nueva-oportunidad')"
              >
                + Nuevo Trato
              </button>
            </div>

            <div v-if="oportunidades.length === 0" class="p-3 text-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
              No hay oportunidades activas registradas.
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="op in oportunidades"
                :key="op.id"
                class="p-3 rounded-lg border border-border bg-card hover:border-primary/40 transition-colors text-xs flex items-center justify-between"
              >
                <div class="space-y-0.5 max-w-[65%]">
                  <p class="font-semibold text-foreground line-clamp-1">{{ op.titulo }}</p>
                  <p class="text-[11px] text-muted-foreground capitalize">Etapa: {{ op.etapa }}</p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-foreground">{{ formatCurrency(op.monto) }}</p>
                  <p class="text-[10px] text-muted-foreground">{{ op.probabilidad }}% éxito</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Agenda y Tareas Pendientes -->
          <div class="space-y-2.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Calendar class="w-4 h-4 text-amber-500" />
                <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Agenda Pendiente ({{ tareasPendientes.length }})
                </h3>
              </div>
              <button
                type="button"
                class="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold"
                @click="emit('abrir-nueva-actividad')"
              >
                + Tarea
              </button>
            </div>

            <div v-if="tareasPendientes.length === 0" class="p-3 text-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
              Sin tareas pendientes con este cliente.
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="act in tareasPendientes"
                :key="act.id"
                class="p-2.5 rounded-lg border border-border bg-card text-xs space-y-1"
              >
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-foreground line-clamp-1">{{ act.titulo }}</span>
                  <span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {{ act.tipo }}
                  </span>
                </div>
                <div class="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span class="flex items-center gap-1">
                    <Clock class="w-3 h-3" />
                    {{ formatDate(act.fechaLimite) }}
                  </span>
                  <span>{{ act.responsable }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Nueva Nota Rápida en Bitácora -->
          <div class="space-y-2 pt-2 border-t border-border">
            <div class="flex items-center gap-2">
              <FileText class="w-4 h-4 text-sky-500" />
              <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Bitácora / Nota Rápida
              </h3>
            </div>

            <div class="space-y-2">
              <textarea
                v-model="nuevaNota"
                rows="2"
                placeholder="Escribe un apunte de seguimiento para este cliente..."
                class="w-full text-xs p-2.5 rounded-lg bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground"
              ></textarea>
              <div class="flex justify-end">
                <button
                  type="button"
                  :disabled="!nuevaNota.trim() || guardandoNota"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  @click="guardarNota"
                >
                  <Send class="w-3 h-3" />
                  <span>{{ guardandoNota ? 'Guardando...' : 'Guardar Nota' }}</span>
                </button>
              </div>
            </div>

            <!-- Últimas notas registradas -->
            <div v-if="historialActividades.length > 0" class="pt-2 space-y-1.5">
              <p class="text-[11px] font-medium text-muted-foreground">Notas Recientes:</p>
              <div
                v-for="h in historialActividades.slice(-3).reverse()"
                :key="h.id"
                class="p-2 rounded bg-muted/40 border border-border/50 text-[11px] space-y-0.5"
              >
                <div class="flex items-center justify-between text-muted-foreground text-[10px]">
                  <span>{{ h.realizado_por }}</span>
                  <span>{{ formatDate(h.fecha) }}</span>
                </div>
                <p class="text-foreground">{{ h.descripcion }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Contenido cuando el REMITENTE NO ESTÁ REGISTRADO -->
        <div v-else class="flex-1 overflow-y-auto p-5 space-y-5">
          <div class="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs space-y-2 text-amber-800 dark:text-amber-300">
            <div class="flex items-center gap-2 font-semibold">
              <AlertCircle class="w-4 h-4 text-amber-500 shrink-0" />
              <span>Remitente no registrado</span>
            </div>
            <p class="text-[11px] leading-relaxed text-muted-foreground">
              El remitente <strong class="text-foreground">{{ correoRemitente }}</strong> no está vinculado a ninguna cuenta empresarial en tu catálogo comercial.
            </p>
          </div>

          <div class="p-4 rounded-xl border border-border bg-card space-y-4">
            <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Registrar Cliente B2B con 1 Clic
            </h3>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block text-[11px] font-medium text-muted-foreground mb-1">
                  Razón Social / Empresa *
                </label>
                <input
                  v-model="formNuevo.razon_social"
                  type="text"
                  placeholder="Ej. Distribuidora Central SRL"
                  class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              <div>
                <label class="block text-[11px] font-medium text-muted-foreground mb-1">
                  Sector Comercial
                </label>
                <select
                  v-model="formNuevo.sector"
                  class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                >
                  <option value="Tecnología">Tecnología</option>
                  <option value="Banca y Finanzas">Banca y Finanzas</option>
                  <option value="Salud y Farmacia">Salud y Farmacia</option>
                  <option value="Construcción">Construcción</option>
                  <option value="Comercio y Retail">Comercio y Retail</option>
                  <option value="Consumo Masivo">Consumo Masivo</option>
                  <option value="Servicios Profesionales">Servicios Profesionales</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div>
                <label class="block text-[11px] font-medium text-muted-foreground mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  v-model="formNuevo.telefono"
                  type="text"
                  placeholder="Ej. 809-555-0199"
                  class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              <button
                type="button"
                :disabled="!formNuevo.razon_social.trim() || creandoCliente"
                class="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
                @click="registrarClienteRapido"
              >
                <UserPlus class="w-4 h-4" />
                <span>{{ creandoCliente ? 'Creando Cliente...' : 'Crear Ficha de Cliente' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-border bg-muted/20 flex justify-end">
          <button
            type="button"
            class="px-4 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-foreground transition-colors"
            @click="cerrar"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
