<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import { Database, LogOut, ChevronDown, Sparkles, User } from 'lucide-vue-next';
import type { RolUsuario } from '@/modules/auth/types/auth.types';

const router = useRouter();
const authStore = useAuthStore();
const menuUsuarioAbierto = ref(false);

const cambiarRol = (rol: RolUsuario) => {
  authStore.cambiarRolRapido(rol);
  menuUsuarioAbierto.value = false;
};

const cerrarSesion = () => {
  authStore.cerrarSesion();
  router.push('/login');
};
</script>

<template>
  <header class="h-14 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm px-6 flex items-center justify-between shrink-0 select-none z-30 relative">
    <!-- Migas de Pan / Estado Activo -->
    <div class="flex items-center gap-3 text-xs text-zinc-400">
      <span class="text-zinc-500">Espacio de Trabajo</span>
      <span class="text-zinc-600">/</span>
      <span class="font-medium text-zinc-200">Operaciones B2B</span>
      <span class="text-zinc-600">/</span>
      <span class="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
        <Database class="w-3 h-3" />
        PostgreSQL Activo
      </span>
    </div>

    <!-- Menú Derecho: Estado de Sesión y Perfil -->
    <div class="flex items-center gap-3">

      <!-- Selector Rápido de Rol Activo (DevTools Blueprint 05) -->
      <div class="hidden sm:flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 rounded-lg px-2 py-1 text-xs">
        <span class="text-[10px] text-zinc-400 flex items-center gap-1">
          <Sparkles class="w-3 h-3 text-emerald-400" />
          Rol:
        </span>
        <select
          :value="authStore.rol"
          @change="(e) => cambiarRol((e.target as HTMLSelectElement).value as RolUsuario)"
          class="bg-transparent text-emerald-400 font-mono text-[11px] font-semibold focus:outline-none cursor-pointer"
        >
          <option value="admin" class="bg-zinc-900 text-zinc-200">Admin / Directora</option>
          <option value="gerente" class="bg-zinc-900 text-zinc-200">Gerente de Cuentas</option>
          <option value="ejecutivo" class="bg-zinc-900 text-zinc-200">Ejecutivo Comercial</option>
          <option value="auditor" class="bg-zinc-900 text-zinc-200">Auditor (Solo Lectura)</option>
        </select>
      </div>

      <div class="h-4 w-px bg-zinc-800"></div>

      <!-- Menú Desplegable de Usuario y Cierre de Sesión -->
      <div class="relative">
        <button
          @click="menuUsuarioAbierto = !menuUsuarioAbierto"
          class="flex items-center gap-2 p-1 rounded-lg hover:bg-zinc-900 transition border border-transparent hover:border-zinc-800"
        >
          <div class="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-emerald-400">
            {{ authStore.usuario?.avatar || 'US' }}
          </div>
          <div class="hidden sm:block text-left">
            <div class="text-xs font-medium text-zinc-200 leading-tight">
              {{ authStore.usuario?.nombre || 'Usuario' }}
            </div>
            <div class="text-[10px] text-zinc-400 capitalize">
              {{ authStore.usuario?.rolNombre || 'Colaborador' }}
            </div>
          </div>
          <ChevronDown class="w-3.5 h-3.5 text-zinc-500" />
        </button>

        <!-- Dropdown Menú -->
        <div
          v-if="menuUsuarioAbierto"
          class="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl py-1 z-50 text-xs"
        >
          <div class="px-3 py-2 border-b border-zinc-800 text-[11px]">
            <div class="font-semibold text-zinc-200">{{ authStore.usuario?.nombre }}</div>
            <div class="text-zinc-500 font-mono">{{ authStore.usuario?.email }}</div>
            <div class="text-emerald-400 text-[10px] mt-0.5">{{ authStore.usuario?.cargo }}</div>
          </div>

          <router-link
            to="/usuarios"
            @click="menuUsuarioAbierto = false"
            class="flex items-center gap-2 px-3 py-2 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition"
          >
            <User class="w-3.5 h-3.5 text-zinc-400" />
            <span>Usuarios y Permisos</span>
          </router-link>

          <button
            @click="cerrarSesion"
            class="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-500/10 transition border-t border-zinc-800 mt-1"
          >
            <LogOut class="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
