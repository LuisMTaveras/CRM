<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth.store';
import { authService } from '../services/auth.service';
import type { Usuario, RolUsuario } from '../types/auth.types';
import { Users, Shield, Check, X, Sparkles } from 'lucide-vue-next';
import { formatearFechaHora } from '@/core/lib/utils';

const authStore = useAuthStore();
const usuarios = ref<Usuario[]>([]);
const cargando = ref(true);

const matrizPermisos = [
  { entidad: 'Clientes / Cuentas B2B', admin: 'Total', gerente: 'Lectura / Crear / Editar', ejecutivo: 'Lectura / Crear / Editar', auditor: 'Solo Lectura' },
  { entidad: 'Eliminación de Clientes', admin: true, gerente: false, ejecutivo: false, auditor: false },
  { entidad: 'Oportunidades & Deals', admin: 'Total', gerente: 'Total', ejecutivo: 'Lectura / Crear / Editar', auditor: 'Solo Lectura' },
  { entidad: 'Bitácora & Actividades', admin: 'Total', gerente: 'Total', ejecutivo: 'Lectura / Crear / Editar', auditor: 'Solo Lectura' },
  { entidad: 'Métricas & Conversión', admin: 'Total', gerente: 'Total', ejecutivo: 'Lectura', auditor: 'Lectura' },
  { entidad: 'Gestión de Usuarios & Roles', admin: 'Total', gerente: 'Lectura', ejecutivo: 'Sin Acceso', auditor: 'Sin Acceso' },
  { entidad: 'Configuración Base de Datos', admin: 'Total', gerente: 'Sin Acceso', ejecutivo: 'Sin Acceso', auditor: 'Sin Acceso' },
];

const cambiarRolSimulado = (rol: RolUsuario) => {
  authStore.cambiarRolRapido(rol);
};

const clasesBadgeRol = (rol: RolUsuario) => {
  switch (rol) {
    case 'admin':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'gerente':
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    case 'ejecutivo':
      return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    case 'auditor':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  }
};

onMounted(async () => {
  cargando.value = true;
  usuarios.value = await authService.obtenerUsuarios();
  cargando.value = false;
});
</script>

<template>
  <div class="space-y-6 max-w-6xl">
    <!-- Encabezado -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
      <div>
        <h1 class="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
          <Users class="w-5 h-5 text-emerald-400" />
          Usuarios, Roles y Control de Acceso (RBAC)
        </h1>
        <p class="text-xs text-zinc-400 mt-0.5">
          Administración de colaboradores, asignación de roles y matriz declarativa de permisos
        </p>
      </div>

      <!-- Simulador de Escenarios Rápido -->
      <div class="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1.5 rounded-lg text-xs">
        <span class="text-zinc-400 text-[11px] px-1 flex items-center gap-1">
          <Sparkles class="w-3 h-3 text-emerald-400" />
          Probar Rol Activo:
        </span>
        <button
          @click="cambiarRolSimulado('admin')"
          :class="['px-2 py-0.5 rounded text-[11px] font-mono transition', authStore.rol === 'admin' ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30' : 'text-zinc-400 hover:text-zinc-200']"
        >
          Admin
        </button>
        <button
          @click="cambiarRolSimulado('ejecutivo')"
          :class="['px-2 py-0.5 rounded text-[11px] font-mono transition', authStore.rol === 'ejecutivo' ? 'bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30' : 'text-zinc-400 hover:text-zinc-200']"
        >
          Ejecutivo
        </button>
        <button
          @click="cambiarRolSimulado('auditor')"
          :class="['px-2 py-0.5 rounded text-[11px] font-mono transition', authStore.rol === 'auditor' ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30' : 'text-zinc-400 hover:text-zinc-200']"
        >
          Auditor
        </button>
      </div>
    </div>

    <!-- Tabla de Usuarios Registrados -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden text-xs">
      <div class="p-3.5 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
        <span class="font-semibold text-zinc-200">Equipo Comercial & Usuarios Activos</span>
        <span class="font-mono text-zinc-500 text-[11px]">{{ usuarios.length }} usuarios registrados</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-zinc-800 bg-zinc-950/80 text-zinc-400 font-medium">
              <th class="py-2.5 px-3.5">Colaborador</th>
              <th class="py-2.5 px-3.5">Correo Electrónico</th>
              <th class="py-2.5 px-3.5">Cargo Comercial</th>
              <th class="py-2.5 px-3.5">Rol de Seguridad</th>
              <th class="py-2.5 px-3.5">Estado</th>
              <th class="py-2.5 px-3.5">Último Acceso</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-800/60">
            <tr v-for="user in usuarios" :key="user.id" class="hover:bg-zinc-800/30 transition">
              <!-- Colaborador con Avatar -->
              <td class="py-2.5 px-3.5 flex items-center gap-2.5 font-medium text-zinc-200">
                <div class="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-[10px] text-emerald-400">
                  {{ user.avatar }}
                </div>
                <span>{{ user.nombre }}</span>
                <span v-if="user.id === authStore.usuario?.id" class="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                  Tú
                </span>
              </td>

              <!-- Correo -->
              <td class="py-2.5 px-3.5 text-zinc-300 font-mono">
                {{ user.email }}
              </td>

              <!-- Cargo -->
              <td class="py-2.5 px-3.5 text-zinc-400">
                {{ user.cargo }}
              </td>

              <!-- Rol -->
              <td class="py-2.5 px-3.5">
                <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize', clasesBadgeRol(user.rol)]">
                  {{ user.rolNombre }}
                </span>
              </td>

              <!-- Estado -->
              <td class="py-2.5 px-3.5">
                <span class="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-medium">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Activo
                </span>
              </td>

              <!-- Último Acceso -->
              <td class="py-2.5 px-3.5 text-zinc-500 font-mono text-[11px]">
                {{ formatearFechaHora(user.ultimoAcceso) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Matriz de Permisos Declarativa (Blueprint 04) -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden text-xs">
      <div class="p-3.5 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
        <div class="flex items-center gap-2 font-semibold text-zinc-200">
          <Shield class="w-4 h-4 text-emerald-400" />
          <span>Matriz de Permisos por Rol (RBAC Engine)</span>
        </div>
        <span class="text-[11px] text-zinc-500 font-mono">Evaluador CASL en tiempo real</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-zinc-800 bg-zinc-950/80 text-zinc-400 font-medium text-[11px]">
              <th class="py-2.5 px-4 w-1/3">Módulo / Capacidad</th>
              <th class="py-2.5 px-4 text-emerald-400">Director / Admin</th>
              <th class="py-2.5 px-4 text-indigo-400">Gerente Cuentas</th>
              <th class="py-2.5 px-4 text-sky-400">Ejecutivo Ventas</th>
              <th class="py-2.5 px-4 text-amber-400">Auditor / BI</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-800/60 font-mono text-[11px]">
            <tr v-for="(fila, idx) in matrizPermisos" :key="idx" class="hover:bg-zinc-800/20">
              <td class="py-2.5 px-4 font-sans font-medium text-zinc-300">
                {{ fila.entidad }}
              </td>
              <td class="py-2.5 px-4 text-emerald-400 font-medium">
                <Check v-if="fila.admin === true" class="w-4 h-4 text-emerald-400" />
                <span v-else>{{ fila.admin }}</span>
              </td>
              <td class="py-2.5 px-4 text-zinc-300">
                <Check v-if="fila.gerente === true" class="w-4 h-4 text-emerald-400" />
                <X v-else-if="fila.gerente === false" class="w-4 h-4 text-zinc-600" />
                <span v-else>{{ fila.gerente }}</span>
              </td>
              <td class="py-2.5 px-4 text-zinc-300">
                <Check v-if="fila.ejecutivo === true" class="w-4 h-4 text-emerald-400" />
                <X v-else-if="fila.ejecutivo === false" class="w-4 h-4 text-zinc-600" />
                <span v-else>{{ fila.ejecutivo }}</span>
              </td>
              <td class="py-2.5 px-4 text-zinc-400">
                <Check v-if="fila.auditor === true" class="w-4 h-4 text-emerald-400" />
                <X v-else-if="fila.auditor === false" class="w-4 h-4 text-zinc-600" />
                <span v-else>{{ fila.auditor }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
