<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth.store';
import { authService } from '../services/auth.service';
import type { Usuario, RolUsuario } from '../types/auth.types';
import { 
  Users, 
  Shield, 
  Check, 
  X, 
  Sparkles, 
  RefreshCw, 
  Edit3, 
  Save, 
  Briefcase, 
  Phone, 
  Building,
  CheckCircle2
} from 'lucide-vue-next';
import { FlickerlessSurface } from '@flickerless/vue';

const authStore = useAuthStore();
const usuarios = ref<Usuario[]>([]);
const cargando = ref(true);

// Estado de edición de usuario
const modalEditarAbierto = ref(false);
const guardandoUsuario = ref(false);
const usuarioEnEdicion = reactive<Partial<Usuario>>({
  id: '',
  nombre: '',
  email: '',
  cargo: '',
  departamento: '',
  telefonoFlota: '',
  rol: 'ejecutivo',
  rolNombre: '',
  activo: true,
});
const feedbackGuardado = ref(false);

const matrizPermisos = [
  { entidad: 'Clientes / Cuentas B2B', admin: 'Total', gerente: 'Lectura / Crear / Editar', ejecutivo: 'Lectura / Crear / Editar', auditor: 'Solo Lectura' },
  { entidad: 'Eliminación de Clientes', admin: true, gerente: false, ejecutivo: false, auditor: false },
  { entidad: 'Oportunidades & Deals', admin: 'Total', gerente: 'Total', ejecutivo: 'Lectura / Crear / Editar', auditor: 'Solo Lectura' },
  { entidad: 'Bitácora & Actividades', admin: 'Total', gerente: 'Total', ejecutivo: 'Lectura / Crear / Editar', auditor: 'Solo Lectura' },
  { entidad: 'Métricas & Conversión', admin: 'Total', gerente: 'Total', ejecutivo: 'Lectura', auditor: 'Lectura' },
  { entidad: 'Gestión de Usuarios & Roles', admin: 'Total', gerente: 'Lectura', ejecutivo: 'Sin Acceso', auditor: 'Sin Acceso' },
  { entidad: 'Configuración Base de Datos', admin: 'Total', gerente: 'Sin Acceso', ejecutivo: 'Sin Acceso', auditor: 'Sin Acceso' },
];

const cambiarRolSimulado = async (rol: RolUsuario) => {
  cargando.value = true;
  authStore.cambiarRolRapido(rol);
  await new Promise((r) => setTimeout(r, 200));
  cargando.value = false;
};

const recargarUsuarios = async () => {
  cargando.value = true;
  usuarios.value = await authService.obtenerUsuarios();
  cargando.value = false;
};

const abrirEditarUsuario = (user: Usuario) => {
  Object.assign(usuarioEnEdicion, {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    cargo: user.cargo,
    departamento: user.departamento || '',
    telefonoFlota: user.telefonoFlota || '',
    rol: user.rol,
    rolNombre: user.rolNombre,
    activo: user.activo,
  });
  feedbackGuardado.value = false;
  modalEditarAbierto.value = true;
};

const guardarEdicionUsuario = async () => {
  if (!usuarioEnEdicion.id || !usuarioEnEdicion.nombre) return;
  guardandoUsuario.value = true;

  const rolesNombres: Record<RolUsuario, string> = {
    admin: 'Director / Administrador',
    gerente: 'Gerente de Cuentas',
    ejecutivo: 'Ejecutivo Comercial',
    auditor: 'Auditor & Analista',
  };

  const rolSeleccionado = usuarioEnEdicion.rol as RolUsuario;
  const cambios: Partial<Usuario> = {
    nombre: usuarioEnEdicion.nombre,
    cargo: usuarioEnEdicion.cargo,
    departamento: usuarioEnEdicion.departamento,
    telefonoFlota: usuarioEnEdicion.telefonoFlota,
    rol: rolSeleccionado,
    rolNombre: rolesNombres[rolSeleccionado] || 'Colaborador',
    activo: usuarioEnEdicion.activo,
  };

  try {
    await authService.actualizarUsuario(usuarioEnEdicion.id, cambios);
    
    // Si el usuario editado es el usuario en sesión actual, actualizar en caliente su store
    if (authStore.usuario?.id === usuarioEnEdicion.id) {
      authStore.actualizarPerfilActual(cambios);
    }

    feedbackGuardado.value = true;
    await recargarUsuarios();
    setTimeout(() => {
      feedbackGuardado.value = false;
      modalEditarAbierto.value = false;
    }, 700);
  } catch (err) {
    console.error('Error al actualizar usuario:', err);
  } finally {
    guardandoUsuario.value = false;
  }
};

const clasesBadgeRol = (rol: RolUsuario) => {
  switch (rol) {
    case 'admin':
      return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    case 'gerente':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    case 'ejecutivo':
      return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
    case 'auditor':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  }
};

onMounted(async () => {
  await recargarUsuarios();
});
</script>

<template>
  <!-- Teleport del Encabezado hacia la Barra Superior Principal (HeaderBar) -->
    <Teleport to="#header-portal-left">
      <div class="flex items-center gap-3 min-w-0">
        <div class="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
          <Users class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <h1 class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
              Directorio de Colaboradores, Flotas & Permisos (RBAC)
            </h1>
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
              Gobierno de Identidad
            </span>
          </div>
          <p class="text-[11px] text-zinc-500 dark:text-zinc-400 truncate hidden md:block">
            Administración centralizada de cargos oficiales, flotas corporativas y matriz de roles
          </p>
        </div>
      </div>
    </Teleport>

    <!-- Teleport de Simulador hacia la Barra Superior -->
    <Teleport to="#header-portal-right">
      <div class="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/[0.08] p-1.5 rounded-xl text-xs">
        <span class="text-zinc-500 dark:text-zinc-400 text-[11px] px-1 flex items-center gap-1 font-medium hidden sm:inline-flex">
          <Sparkles class="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
          Probar Rol:
        </span>
        <button
          @click="cambiarRolSimulado('admin')"
          :disabled="cargando"
          :class="['px-2 py-0.5 rounded-lg text-[10px] font-mono transition', authStore.rol === 'admin' ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-500/30' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200']"
        >
          Admin
        </button>
        <button
          @click="cambiarRolSimulado('ejecutivo')"
          :disabled="cargando"
          :class="['px-2 py-0.5 rounded-lg text-[10px] font-mono transition', authStore.rol === 'ejecutivo' ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300 font-semibold border border-sky-500/30' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200']"
        >
          Ejecutivo
        </button>
        <button
          @click="cambiarRolSimulado('auditor')"
          :disabled="cargando"
          :class="['px-2 py-0.5 rounded-lg text-[10px] font-mono transition', authStore.rol === 'auditor' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/30' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200']"
        >
          Auditor
        </button>
        <button
          @click="recargarUsuarios"
          :disabled="cargando"
          title="Actualizar lista de usuarios"
          class="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition ml-1"
        >
          <RefreshCw :class="['w-3.5 h-3.5', cargando ? 'animate-spin text-indigo-600 dark:text-indigo-400' : '']" />
        </button>
      </div>
    </Teleport>

  <!-- Contenido Protegido con Flickerless Surface -->
  <div class="w-full space-y-4 pb-8">
    <FlickerlessSurface
      :loading="cargando"
      :delay-ms="180"
      :preserve-height="true"
      stream-color="#4f46e5"
      announce-text="Actualizando directorio de colaboradores y permisos..."
      class="space-y-6 rounded-xl overflow-hidden"
    >
      <!-- Tabla de Usuarios Registrados -->
      <div class="saas-card rounded-xl overflow-hidden text-xs border border-zinc-200 dark:border-white/[0.08]">
        <div class="p-3.5 border-b border-zinc-200 dark:border-white/[0.07] bg-zinc-50 dark:bg-[#0c0c0e]/80 flex items-center justify-between">
          <span class="font-semibold text-zinc-800 dark:text-zinc-200">Equipo Corporativo & Perfiles de Identidad</span>
          <span class="font-mono text-zinc-500 dark:text-zinc-400 text-[11px]">{{ usuarios.length }} colaboradores registrados</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-zinc-200 dark:border-white/[0.07] bg-zinc-100/70 dark:bg-[#09090b]/60 text-zinc-500 dark:text-zinc-400 text-[11px] font-medium tracking-wider uppercase">
                <th class="py-3 px-3.5">Colaborador</th>
                <th class="py-3 px-3.5">Correo</th>
                <th class="py-3 px-3.5">Departamento</th>
                <th class="py-3 px-3.5">Cargo Oficial</th>
                <th class="py-3 px-3.5">Flota Asignada</th>
                <th class="py-3 px-3.5">Rol de Seguridad</th>
                <th class="py-3 px-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-200 dark:divide-white/[0.04]">
              <tr v-for="user in usuarios" :key="user.id" class="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition">
                <!-- Colaborador con Avatar -->
                <td class="py-2.5 px-3.5 flex items-center gap-2.5 font-medium text-zinc-800 dark:text-zinc-200">
                  <div class="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-white/[0.08] flex items-center justify-center font-bold text-[10px] text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0">
                    {{ user.avatar }}
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                      <span class="font-bold truncate">{{ user.nombre }}</span>
                      <span v-if="user.id === authStore.usuario?.id" class="text-[9px] text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1 py-0.2 rounded border border-indigo-500/20 font-bold shrink-0">
                        Tú
                      </span>
                    </div>
                  </div>
                </td>

                <!-- Correo -->
                <td class="py-2.5 px-3.5 text-zinc-600 dark:text-zinc-300 font-mono text-[11px]">
                  {{ user.email }}
                </td>

                <!-- Departamento -->
                <td class="py-2.5 px-3.5 text-zinc-600 dark:text-zinc-400 text-[11px]">
                  {{ user.departamento || 'General' }}
                </td>

                <!-- Cargo -->
                <td class="py-2.5 px-3.5 font-medium text-zinc-800 dark:text-zinc-200">
                  {{ user.cargo }}
                </td>

                <!-- Flota -->
                <td class="py-2.5 px-3.5 font-mono text-zinc-600 dark:text-zinc-300 text-[11px]">
                  {{ user.telefonoFlota || '—' }}
                </td>

                <!-- Rol -->
                <td class="py-2.5 px-3.5">
                  <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize', clasesBadgeRol(user.rol)]">
                    {{ user.rolNombre }}
                  </span>
                </td>

                <!-- Acción: Editar Ficha -->
                <td class="py-2.5 px-3.5 text-right">
                  <button
                    type="button"
                    @click="abrirEditarUsuario(user)"
                    class="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs font-medium transition"
                  >
                    <Edit3 class="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <span>Editar Ficha</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Matriz de Permisos Declarativa -->
      <div class="saas-card rounded-xl overflow-hidden text-xs border border-zinc-200 dark:border-white/[0.08]">
        <div class="p-3.5 border-b border-zinc-200 dark:border-white/[0.07] bg-zinc-50 dark:bg-[#0c0c0e]/80 flex items-center justify-between">
          <div class="flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200">
            <Shield class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Matriz de Permisos por Rol (RBAC Engine)</span>
          </div>
          <span class="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">Evaluador de capacidades activas</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-zinc-200 dark:border-white/[0.07] bg-zinc-100/70 dark:bg-[#09090b]/60 text-zinc-500 dark:text-zinc-400 text-[11px] font-medium tracking-wider uppercase">
                <th class="py-3 px-4 w-1/3">Módulo / Capacidad</th>
                <th class="py-3 px-4 text-indigo-600 dark:text-indigo-400">Director / Admin</th>
                <th class="py-3 px-4 text-purple-600 dark:text-purple-400">Gerente Cuentas</th>
                <th class="py-3 px-4 text-sky-600 dark:text-sky-400">Ejecutivo Ventas</th>
                <th class="py-3 px-4 text-amber-600 dark:text-amber-400">Auditor / BI</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-200 dark:divide-white/[0.04] font-mono text-[11px]">
              <tr v-for="(fila, idx) in matrizPermisos" :key="idx" class="hover:bg-zinc-50 dark:hover:bg-zinc-800/20">
                <td class="py-2.5 px-4 font-sans font-medium text-zinc-800 dark:text-zinc-300">
                  {{ fila.entidad }}
                </td>
                <td class="py-2.5 px-4 text-indigo-600 dark:text-indigo-400 font-medium">
                  <Check v-if="fila.admin === true" class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span v-else>{{ fila.admin }}</span>
                </td>
                <td class="py-2.5 px-4 text-zinc-700 dark:text-zinc-300">
                  <Check v-if="fila.gerente === true" class="w-4 h-4 text-emerald-500" />
                  <X v-else-if="fila.gerente === false" class="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
                  <span v-else>{{ fila.gerente }}</span>
                </td>
                <td class="py-2.5 px-4 text-zinc-700 dark:text-zinc-300">
                  <Check v-if="fila.ejecutivo === true" class="w-4 h-4 text-emerald-500" />
                  <X v-else-if="fila.ejecutivo === false" class="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
                  <span v-else>{{ fila.ejecutivo }}</span>
                </td>
                <td class="py-2.5 px-4 text-zinc-600 dark:text-zinc-400">
                  <Check v-if="fila.auditor === true" class="w-4 h-4 text-emerald-500" />
                  <X v-else-if="fila.auditor === false" class="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
                  <span v-else>{{ fila.auditor }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </FlickerlessSurface>

    <!-- Modal para Editar Ficha de Usuario -->
    <div v-if="modalEditarAbierto" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div @click="modalEditarAbierto = false" class="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"></div>

      <div class="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden text-xs">
        <div class="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Users class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">Editar Ficha del Colaborador</h3>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400">Actualiza el cargo, flota oficial y rol asignado</p>
            </div>
          </div>
          <button @click="modalEditarAbierto = false" class="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="block text-zinc-700 dark:text-zinc-300 mb-1 font-medium">Nombre Completo</label>
            <input
              type="text"
              v-model="usuarioEnEdicion.nombre"
              class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-200 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 mb-1 font-medium flex items-center gap-1.5">
                <Briefcase class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Cargo Oficial</span>
              </label>
              <input
                type="text"
                v-model="usuarioEnEdicion.cargo"
                placeholder="Ej: Team Leader TI Support"
                class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 mb-1 font-medium flex items-center gap-1.5">
                <Building class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Departamento / División</span>
              </label>
              <input
                type="text"
                v-model="usuarioEnEdicion.departamento"
                placeholder="Ej: Soporte TI"
                class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 mb-1 font-medium flex items-center gap-1.5">
                <Phone class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Flota Corporativa</span>
              </label>
              <input
                type="text"
                v-model="usuarioEnEdicion.telefonoFlota"
                placeholder="+1 (829) 708-4706"
                class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 mb-1 font-medium">Rol de Seguridad (RBAC)</label>
              <select
                v-model="usuarioEnEdicion.rol"
                class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-200 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="admin">Director / Administrador</option>
                <option value="gerente">Gerente de Cuentas</option>
                <option value="ejecutivo">Ejecutivo Comercial</option>
                <option value="auditor">Auditor & Analista</option>
              </select>
            </div>
          </div>

          <div class="pt-2 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800">
            <label class="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                v-model="usuarioEnEdicion.activo"
                class="rounded bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-0"
              />
              <span>Cuenta Activa en el CRM</span>
            </label>

            <span v-if="feedbackGuardado" class="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
              <CheckCircle2 class="w-3.5 h-3.5" />
              Ficha guardada
            </span>
          </div>
        </div>

        <div class="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 flex items-center justify-end gap-3">
          <button
            type="button"
            @click="modalEditarAbierto = false"
            class="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="guardarEdicionUsuario"
            :disabled="guardandoUsuario"
            class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm shadow-indigo-950/40"
          >
            <Save class="w-3.5 h-3.5" />
            <span>{{ guardandoUsuario ? 'Guardando...' : 'Guardar Ficha' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
