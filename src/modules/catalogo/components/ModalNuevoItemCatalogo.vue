<script setup lang="ts">
import { ref, reactive } from 'vue';
import { catalogoService } from '@/modules/comunicaciones/services/catalogo.service';
import type { CategoriaServicio, MonedaCotizacion } from '@/modules/comunicaciones/types/catalogo.types';
import { X, Check, Package } from 'lucide-vue-next';
import { toastService } from '@/core/notifications/toast.service';
import { getCurrencySymbol } from '@/core/formatters/formatters';
import { empresaService } from '@/modules/configuracion/services/empresa.service';

defineProps<{
  abierto: boolean;
}>();

const emit = defineEmits<{
  (e: 'cerrar'): void;
  (e: 'guardado'): void;
}>();

const categorias: Array<{ valor: CategoriaServicio; etiqueta: string }> = [
  { valor: 'licenciamiento', etiqueta: 'Licenciamiento Software' },
  { valor: 'implementacion', etiqueta: 'Implementación & Despliegue' },
  { valor: 'soporte', etiqueta: 'Soporte Técnico & Mantenimiento' },
  { valor: 'desarrollo', etiqueta: 'Desarrollo a Medida' },
  { valor: 'consultoria', etiqueta: 'Consultoría & Auditoría' },
  { valor: 'capacitacion', etiqueta: 'Capacitación Comercial' },
];

const formulario = reactive({
  codigo: '',
  nombre: '',
  descripcion: '',
  categoria: 'licenciamiento' as CategoriaServicio,
  precioBase: 0,
  moneda: (empresaService.obtenerDatos().monedaPrincipal === 'USD' ? 'USD' : 'DOP') as MonedaCotizacion,
  aplicaItbis: true,
  tasaItbis: 0.18,
  unidadMedida: 'Mes',
});

const guardando = ref(false);

const guardar = () => {
  if (!formulario.codigo.trim()) {
    toastService.advertencia('El código o SKU es obligatorio.');
    return;
  }
  if (!formulario.nombre.trim()) {
    toastService.advertencia('El nombre del ítem es obligatorio.');
    return;
  }
  if (formulario.precioBase <= 0) {
    toastService.advertencia('El precio debe ser mayor a 0.');
    return;
  }

  guardando.value = true;
  try {
    catalogoService.agregarItem({
      codigo: formulario.codigo.trim().toUpperCase(),
      nombre: formulario.nombre.trim(),
      descripcion: formulario.descripcion.trim(),
      categoria: formulario.categoria,
      precioBase: Number(formulario.precioBase),
      moneda: formulario.moneda,
      aplicaItbis: formulario.aplicaItbis,
      tasaItbis: formulario.aplicaItbis ? 0.18 : 0,
      unidadMedida: formulario.unidadMedida.trim() || 'Unidad',
    });

    toastService.exito(`Ítem "${formulario.nombre}" agregado al catálogo.`);
    emit('guardado');
    emit('cerrar');
  } catch (err: unknown) {
    toastService.error(err instanceof Error ? err.message : 'Error al guardar ítem');
  } finally {
    guardando.value = false;
  }
};
</script>

<template>
  <div
    v-if="abierto"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-in fade-in"
  >
    <div class="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-xs">
      <!-- Cabecera -->
      <div class="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-950/60">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Package class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Nuevo Ítem de Catálogo
            </h3>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
              Definición de producto o servicio con parametrización de ITBIS
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="emit('cerrar')"
          class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Formulario -->
      <div class="p-5 space-y-3.5">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
              Código / SKU *
            </label>
            <input
              v-model="formulario.codigo"
              type="text"
              placeholder="Ej: SRV-CLOUD-01"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 font-mono uppercase"
            />
          </div>

          <div>
            <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
              Categoría *
            </label>
            <select
              v-model="formulario.categoria"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option v-for="c in categorias" :key="c.valor" :value="c.valor">
                {{ c.etiqueta }}
              </option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
            Nombre del Producto / Servicio *
          </label>
          <input
            v-model="formulario.nombre"
            type="text"
            placeholder="Ej: Licencia Anual ERP Enterprise"
            class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
            Descripción Detallada
          </label>
          <textarea
            v-model="formulario.descripcion"
            rows="2"
            placeholder="Alcance técnico, entregables y soporte incluido..."
            class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500"
          ></textarea>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
              Precio Unitario ({{ getCurrencySymbol(formulario.moneda) }}) *
            </label>
            <input
              v-model.number="formulario.precioBase"
              type="number"
              min="0"
              placeholder="0.00"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
              Moneda
            </label>
            <select
              v-model="formulario.moneda"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="DOP">DOP ({{ getCurrencySymbol('DOP') }})</option>
              <option value="USD">USD ({{ getCurrencySymbol('USD') }})</option>
            </select>
          </div>

          <div>
            <label class="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
              Unidad
            </label>
            <input
              v-model="formulario.unidadMedida"
              type="text"
              placeholder="Mes / Hora / Unidad"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <!-- Checkbox ITBIS -->
        <div class="flex items-center gap-2 pt-1">
          <input
            v-model="formulario.aplicaItbis"
            type="checkbox"
            id="chk-itbis"
            class="rounded bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-0 cursor-pointer"
          />
          <label for="chk-itbis" class="text-zinc-700 dark:text-zinc-300 cursor-pointer font-medium select-none">
            Aplica ITBIS fiscal dominicano (18%)
          </label>
        </div>
      </div>

      <!-- Pie con Botones -->
      <div class="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 flex justify-end gap-2">
        <button
          type="button"
          @click="emit('cerrar')"
          class="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition"
        >
          Cancelar
        </button>

        <button
          type="button"
          @click="guardar"
          :disabled="guardando"
          class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50"
        >
          <Check class="w-3.5 h-3.5" />
          <span>Guardar en Catálogo</span>
        </button>
      </div>
    </div>
  </div>
</template>
