<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import { rolesPermisosService } from '@/modules/auth/services/roles-permisos.service';
import { themeService } from '@/core/theme/theme.service';
import AppSelect, { type SelectOption } from '@/shared/components/AppSelect.vue';
import CommandPaletteModal from '@/shared/components/CommandPaletteModal.vue';
import CentroNotificaciones from '@/shared/components/CentroNotificaciones.vue';
import { LogOut, ChevronDown, User, Sun, Moon, Search } from 'lucide-vue-next';
import type { RolUsuario } from '@/modules/auth/types/auth.types';

const router = useRouter();
const authStore = useAuthStore();
const menuUsuarioAbierto = ref(false);
const paletaAbierta = ref(false);

const manejarAtajoTeclado = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    paletaAbierta.value = !paletaAbierta.value;
  }
};

onMounted(() => {
  window.addEventListener('keydown', manejarAtajoTeclado);
});

onUnmounted(() => {
  window.removeEventListener('keydown', manejarAtajoTeclado);
});

const opcionesRoles = computed<Array<SelectOption<string>>>(() => {
  return rolesPermisosService.obtenerRoles().map((r) => ({
    value: r.id,
    label: r.nombre,
  }));
});

const cambiarRol = (rol: RolUsuario) => {
  authStore.cambiarRolRapido(rol);
  menuUsuarioAbierto.value = false;
};

const alternarTema = () => {
  themeService.alternarTema();
};

const cerrarSesion = () => {
  authStore.cerrarSesion();
  router.push('/login');
};
</script>

<template>
  <header class="h-14 border-b border-zinc-200 dark:border-white/[0.06] bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0 select-none z-30 relative transition-colors duration-200">
    <!-- Portal Izquierdo: Título, Icono, Badge y Contexto de la Pantalla Activa -->
    <div id="header-portal-left" class="flex items-center gap-3 min-w-0 flex-1 mr-4"></div>

    <!-- Menú Derecho: Acciones Dinámicas de la Pantalla + Sesión y Perfil -->
    <div class="flex items-center gap-2.5 shrink-0">
      <!-- Portal Derecho: Botones de Acción de la Pantalla Activa -->
      <div id="header-portal-right" class="flex items-center gap-2"></div>

      <!-- BUSCADOR UNIVERSAL (CTRL + K) -->
      <button
        type="button"
        @click="paletaAbierta = true"
        class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100/90 hover:bg-zinc-200/80 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/[0.08] transition text-xs shadow-2xs group"
        title="Abrir buscador universal (Ctrl + K)"
      >
        <Search class="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
        <span class="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Buscar en CRM...</span>
        <kbd class="ml-1 font-mono text-[9px] px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 font-semibold shadow-2xs">
          Ctrl K
        </kbd>
      </button>

      <!-- Botón buscador en pantallas pequeñas -->
      <button
        type="button"
        @click="paletaAbierta = true"
        class="md:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.08] transition shadow-2xs"
        title="Buscar en CRM (Ctrl + K)"
      >
        <Search class="w-4 h-4" />
      </button>

      <!-- CENTRO DE NOTIFICACIONES B2B -->
      <CentroNotificaciones />

      <div class="h-4 w-px bg-zinc-200 dark:bg-white/[0.08]"></div>

      <!-- BOTÓN SELECTOR DE TEMA (CLARO / OSCURO) -->
      <button
        type="button"
        @click="alternarTema"
        :title="themeService.tema.value === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
        class="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.08] transition shadow-sm"
      >
        <Sun v-if="themeService.tema.value === 'dark'" class="w-4 h-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
        <Moon v-else class="w-4 h-4 text-indigo-600 transition-transform -rotate-12 hover:rotate-0" />
      </button>

      <!-- Selector Rápido de Rol Activo con AppSelect -->
      <div class="hidden sm:flex items-center gap-1.5">
        <AppSelect
          :model-value="authStore.rol"
          @update:model-value="(nuevo) => cambiarRol(nuevo as RolUsuario)"
          :options="opcionesRoles"
          size="sm"
          label-prefix="Rol:"
          align="right"
          min-width-class="min-w-[210px]"
        />
      </div>

      <div class="h-4 w-px bg-zinc-200 dark:bg-white/[0.08]"></div>

      <!-- Menú Desplegable de Usuario y Cierre de Sesión -->
      <div class="relative">
        <button
          @click="menuUsuarioAbierto = !menuUsuarioAbierto"
          class="flex items-center gap-2.5 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900/80 transition-all border border-transparent hover:border-zinc-200 dark:hover:border-white/[0.08]"
        >
          <div class="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500/20 to-zinc-200 dark:to-zinc-800 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 shadow-sm">
            {{ authStore.usuario?.avatar || 'US' }}
          </div>
          <div class="hidden sm:block text-left">
            <div class="text-xs font-medium text-zinc-900 dark:text-zinc-200 leading-tight">
              {{ authStore.usuario?.nombre || 'Usuario' }}
            </div>
            <div class="text-[10px] text-zinc-500 dark:text-zinc-400 capitalize">
              {{ authStore.usuario?.rolNombre || 'Colaborador' }}
            </div>
          </div>
          <ChevronDown class="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
        </button>

        <!-- Dropdown Menú -->
        <div
          v-if="menuUsuarioAbierto"
          class="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl py-1 z-50 text-xs"
        >
          <div class="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 text-[11px]">
            <div class="font-semibold text-zinc-900 dark:text-zinc-200">{{ authStore.usuario?.nombre }}</div>
            <div class="text-zinc-500 font-mono">{{ authStore.usuario?.email }}</div>
            <div class="text-indigo-600 dark:text-indigo-400 text-[10px] mt-0.5">{{ authStore.usuario?.cargo }}</div>
          </div>

          <router-link
            to="/usuarios"
            @click="menuUsuarioAbierto = false"
            class="flex items-center gap-2 px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <User class="w-3.5 h-3.5 text-zinc-400" />
            <span>Usuarios y Permisos</span>
          </router-link>

          <button
            type="button"
            @click="alternarTema"
            class="w-full flex items-center justify-between px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-left"
          >
            <span class="flex items-center gap-2">
              <Sun v-if="themeService.tema.value === 'dark'" class="w-3.5 h-3.5 text-amber-400" />
              <Moon v-else class="w-3.5 h-3.5 text-indigo-600" />
              <span>Modo: {{ themeService.tema.value === 'dark' ? 'Oscuro' : 'Claro' }}</span>
            </span>
            <span class="text-[10px] text-zinc-400">Cambiar</span>
          </button>

          <button
            @click="cerrarSesion"
            class="w-full flex items-center gap-2 px-3 py-2 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition border-t border-zinc-100 dark:border-zinc-800 mt-1"
          >
            <LogOut class="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Paleta de Comandos Omnicanal (Ctrl + K) -->
  <CommandPaletteModal v-model:abierto="paletaAbierta" />
</template>
