<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { busquedaService } from '@/core/busqueda/busqueda.service';
import type { ItemBusqueda } from '@/core/busqueda/busqueda.types';
import { 
  Search, 
  X, 
  Building2, 
  Kanban, 
  Mail, 
  Users, 
  Settings, 
  Server, 
  Layers, 
  Plus, 
  FileText, 
  Send, 
  Moon, 
  Image as ImageIcon, 
  BarChart3,
  CornerDownLeft,
  Sparkles
} from 'lucide-vue-next';

const props = defineProps<{
  abierto: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:abierto', valor: boolean): void;
  (e: 'cerrar'): void;
}>();

const router = useRouter();
const inputBusquedaRef = ref<HTMLInputElement | null>(null);
const consulta = ref('');
const indiceSeleccionado = ref(0);

// Mapeo dinámico de iconos de Lucide
const mapaIconos: Record<string, any> = {
  Building2,
  Kanban,
  Mail,
  Users,
  Settings,
  Server,
  Layers,
  Plus,
  FileText,
  Send,
  Moon,
  Image: ImageIcon,
  BarChart3,
};

const resolverIcono = (nombre: string) => {
  return mapaIconos[nombre] || Sparkles;
};

const grupos = computed(() => {
  return busquedaService.buscar(consulta.value);
});

// Aplanar todos los ítems para facilitar la navegación con flechas de teclado
const todosItemsAplanados = computed<ItemBusqueda[]>(() => {
  return grupos.value.flatMap((g) => g.items);
});

const cerrar = () => {
  emit('update:abierto', false);
  emit('cerrar');
  consulta.value = '';
  indiceSeleccionado.value = 0;
};

const ejecutarItem = (item: ItemBusqueda) => {
  cerrar();
  if (item.accion) {
    item.accion();
    return;
  }
  if (item.ruta) {
    router.push(item.ruta);
  }
};

const navegarTeclado = (e: KeyboardEvent) => {
  if (!props.abierto) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (todosItemsAplanados.value.length === 0) return;
    indiceSeleccionado.value = (indiceSeleccionado.value + 1) % todosItemsAplanados.value.length;
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (todosItemsAplanados.value.length === 0) return;
    indiceSeleccionado.value =
      (indiceSeleccionado.value - 1 + todosItemsAplanados.value.length) % todosItemsAplanados.value.length;
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const itemActual = todosItemsAplanados.value[indiceSeleccionado.value];
    if (itemActual) {
      ejecutarItem(itemActual);
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    cerrar();
  }
};

// Reiniciar índice cuando cambia la consulta
watch(consulta, () => {
  indiceSeleccionado.value = 0;
});

// Autofocus al abrir el modal
watch(
  () => props.abierto,
  (estaAbierto) => {
    if (estaAbierto) {
      indiceSeleccionado.value = 0;
      nextTick(() => {
        inputBusquedaRef.value?.focus();
      });
    }
  }
);

onMounted(() => {
  window.addEventListener('keydown', navegarTeclado);
});

onUnmounted(() => {
  window.removeEventListener('keydown', navegarTeclado);
});
</script>

<template>
  <div v-if="abierto" class="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
    <!-- Backdrop con desenfoque elegante -->
    <div @click="cerrar" class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"></div>

    <!-- Modal Box de la Paleta de Comandos -->
    <div class="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden z-10 flex flex-col text-xs transition-colors">
      
      <!-- Barra de Entrada y Búsqueda -->
      <div class="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3 bg-white dark:bg-zinc-900">
        <Search class="w-4 h-4 text-zinc-400 shrink-0" />
        
        <input
          ref="inputBusquedaRef"
          v-model="consulta"
          type="text"
          placeholder="Buscar clientes, tableros, documentos o acciones rápidas..."
          class="flex-1 bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-sm focus:outline-none"
        />

        <button
          v-if="consulta"
          type="button"
          @click="consulta = ''"
          class="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded transition"
          title="Borrar texto"
        >
          <X class="w-3.5 h-3.5" />
        </button>

        <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">
          ESC
        </span>
      </div>

      <!-- Listado de Resultados Agrupados -->
      <div class="max-h-[60vh] overflow-y-auto p-2 space-y-4">
        <!-- Estado Vacío -->
        <div v-if="grupos.length === 0" class="py-12 text-center text-zinc-400 space-y-2">
          <Search class="w-8 h-8 mx-auto stroke-1 text-zinc-300 dark:text-zinc-600" />
          <p class="font-medium text-xs text-zinc-600 dark:text-zinc-400">
            No se encontraron resultados para "{{ consulta }}"
          </p>
          <p class="text-[11px] text-zinc-400">
            Prueba buscando por razón social, RNC, nombre de módulo o tableros
          </p>
        </div>

        <!-- Grupos de Categorías -->
        <div v-for="grupo in grupos" :key="grupo.categoria" class="space-y-1">
          <div class="px-3 pt-1 pb-1 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
            {{ grupo.etiqueta }}
          </div>

          <div class="space-y-0.5">
            <button
              v-for="item in grupo.items"
              :key="item.id"
              type="button"
              @click="ejecutarItem(item)"
              @mouseenter="indiceSeleccionado = todosItemsAplanados.findIndex((i) => i.id === item.id)"
              :class="[
                'w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-left transition-colors',
                todosItemsAplanados[indiceSeleccionado]?.id === item.id
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-zinc-900 dark:text-zinc-100 border-l-2 border-indigo-600 dark:border-indigo-400 pl-2.5'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
              ]"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
                  <component :is="resolverIcono(item.icono)" class="w-4 h-4 stroke-[1.8]" />
                </div>
                <div class="min-w-0">
                  <div class="font-semibold text-xs truncate">
                    {{ item.titulo }}
                  </div>
                  <div v-if="item.subtitulo" class="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    {{ item.subtitulo }}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <span
                  v-if="item.badge"
                  :class="[
                    'text-[10px] font-mono px-2 py-0.5 rounded border font-medium',
                    item.badgeColor || 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                  ]"
                >
                  {{ item.badge }}
                </span>

                <CornerDownLeft
                  v-if="todosItemsAplanados[indiceSeleccionado]?.id === item.id"
                  class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 stroke-2"
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Pie de Ayuda / Accesos Rápidos con Teclado -->
      <div class="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
        <div class="flex items-center gap-4">
          <span class="flex items-center gap-1">
            <kbd class="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[10px]">↑</kbd>
            <kbd class="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[10px]">↓</kbd>
            <span>Navegar</span>
          </span>

          <span class="flex items-center gap-1">
            <kbd class="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[10px]">↵</kbd>
            <span>Seleccionar</span>
          </span>

          <span class="flex items-center gap-1">
            <kbd class="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[10px]">ESC</kbd>
            <span>Cerrar</span>
          </span>
        </div>

        <span class="text-[10px] font-mono text-zinc-400 hidden sm:inline">
          Buscador Universal CRM B2B
        </span>
      </div>

    </div>
  </div>
</template>
