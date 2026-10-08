<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth.store';
import { authService } from '../services/auth.service';
import { rolesPermisosService } from '../services/roles-permisos.service';
import type { Usuario, RolUsuario } from '../types/auth.types';
import { 
  CATALOGO_PERMISOS, 
  MODULOS_SISTEMA, 
  type RolDefinicion,
  type ModuloPermiso 
} from '../types/permisos.types';
import AppSelect, { type SelectOption } from '@/shared/components/AppSelect.vue';
import { 
  Users, 
  Shield, 
  Check, 
  X, 
  Sparkles, 
  RefreshCw, 
  Edit3, 
  Save, 
  CheckCircle2,
  Plus,
  Trash2,
  Sliders
} from 'lucide-vue-next';
import { FlickerlessSurface } from '@flickerless/vue';

const authStore = useAuthStore();
const usuarios = ref<Usuario[]>([]);
const roles = ref<RolDefinicion[]>([]);
const cargando = ref(true);

const pestanaActiva = ref<'usuarios' | 'roles'>('usuarios');

// Estado del Modal de Usuario (Crear / Editar)
const modalUsuarioAbierto = ref(false);
const modoEdicionUsuario = ref<'crear' | 'editar'>('editar');
const guardandoUsuario = ref(false);
const feedbackGuardado = ref(false);

const usuarioForm = reactive<{
  id: string;
  nombre: string;
  email: string;
  cargo: string;
  departamento: string;
  telefonoFlota: string;
  rol: string;
  activo: boolean;
  permisosExtras: string[];
  permisosRevocados: string[];
}>({
  id: '',
  nombre: '',
  email: '',
  cargo: '',
  departamento: '',
  telefonoFlota: '',
  rol: 'ejecutivo',
  activo: true,
  permisosExtras: [],
  permisosRevocados: [],
});

// Estado del Modal de Roles (Crear / Editar)
const modalRolAbierto = ref(false);
const modoEdicionRol = ref<'crear' | 'editar'>('crear');
const guardandoRol = ref(false);
const feedbackRolGuardado = ref(false);

const rolForm = reactive<{
  id: string;
  nombre: string;
  descripcion: string;
  colorBadge: string;
  permisos: string[];
}>({
  id: '',
  nombre: '',
  descripcion: '',
  colorBadge: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  permisos: [],
});

// Opciones de Roles para AppSelect
const opcionesRolesSelect = computed<Array<SelectOption<string>>>(() => {
  return roles.value.map((r) => ({
    value: r.id,
    label: r.nombre,
    description: r.descripcion,
    badge: r.esSistema ? 'Sistema' : 'Personalizado',
  }));
});

// Opciones de Simulador de Rol en Cabecera
const opcionesSimuladorRol = computed<Array<SelectOption<string>>>(() => {
  return roles.value.map((r) => ({
    value: r.id,
    label: r.nombre,
  }));
});

const recargarDatos = async () => {
  cargando.value = true;
  roles.value = rolesPermisosService.obtenerRoles();
  usuarios.value = await authService.obtenerUsuarios();
  cargando.value = false;
};

// --- GESTIÓN DE USUARIOS ---
const abrirCrearUsuario = () => {
  modoEdicionUsuario.value = 'crear';
  Object.assign(usuarioForm, {
    id: '',
    nombre: '',
    email: '',
    cargo: '',
    departamento: 'Ventas Corporativas',
    telefonoFlota: '',
    rol: 'ejecutivo',
    activo: true,
    permisosExtras: [],
    permisosRevocados: [],
  });
  feedbackGuardado.value = false;
  modalUsuarioAbierto.value = true;
};

const abrirEditarUsuario = (user: Usuario) => {
  modoEdicionUsuario.value = 'editar';
  Object.assign(usuarioForm, {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    cargo: user.cargo,
    departamento: user.departamento || '',
    telefonoFlota: user.telefonoFlota || '',
    rol: user.rol,
    activo: user.activo,
    permisosExtras: [...(user.permisosExtras || [])],
    permisosRevocados: [...(user.permisosRevocados || [])],
  });
  feedbackGuardado.value = false;
  modalUsuarioAbierto.value = true;
};

// Determinar estado de un permiso en el formulario de edición de usuario
const estadoPermisoEnForm = (permisoId: string): 'heredado' | 'extra' | 'revocado' | 'denegado' => {
  const rolDef = roles.value.find((r) => r.id === usuarioForm.rol);
  const rolTiene = rolDef?.permisos.includes(permisoId) ?? false;

  if (usuarioForm.permisosRevocados.includes(permisoId)) return 'revocado';
  if (usuarioForm.permisosExtras.includes(permisoId)) return 'extra';
  if (rolTiene) return 'heredado';
  return 'denegado';
};

// Conmutar permiso en formulario de usuario
const setEstadoPermisoUsuario = (permisoId: string, modo: 'heredar' | 'conceder' | 'revocar') => {
  // Limpiar estados previos
  usuarioForm.permisosExtras = usuarioForm.permisosExtras.filter((p) => p !== permisoId);
  usuarioForm.permisosRevocados = usuarioForm.permisosRevocados.filter((p) => p !== permisoId);

  const rolDef = roles.value.find((r) => r.id === usuarioForm.rol);
  const rolTiene = rolDef?.permisos.includes(permisoId) ?? false;

  if (modo === 'conceder') {
    if (!rolTiene) {
      usuarioForm.permisosExtras.push(permisoId);
    }
  } else if (modo === 'revocar') {
    if (rolTiene) {
      usuarioForm.permisosRevocados.push(permisoId);
    }
  }
};

const guardarUsuario = async () => {
  if (!usuarioForm.nombre || !usuarioForm.email) return;
  guardandoUsuario.value = true;

  const rolSeleccionado = roles.value.find((r) => r.id === usuarioForm.rol);
  const rolNombre = rolSeleccionado?.nombre || 'Colaborador';

  try {
    if (modoEdicionUsuario.value === 'crear') {
      await authService.crearUsuario({
        nombre: usuarioForm.nombre,
        email: usuarioForm.email,
        cargo: usuarioForm.cargo,
        departamento: usuarioForm.departamento,
        telefonoFlota: usuarioForm.telefonoFlota,
        rol: usuarioForm.rol,
        rolNombre,
        activo: usuarioForm.activo,
        contrasena: 'crm123456',
        permisosExtras: usuarioForm.permisosExtras,
        permisosRevocados: usuarioForm.permisosRevocados,
      });
    } else {
      await authService.actualizarUsuario(usuarioForm.id, {
        nombre: usuarioForm.nombre,
        cargo: usuarioForm.cargo,
        departamento: usuarioForm.departamento,
        telefonoFlota: usuarioForm.telefonoFlota,
        rol: usuarioForm.rol,
        rolNombre,
        activo: usuarioForm.activo,
        permisosExtras: usuarioForm.permisosExtras,
        permisosRevocados: usuarioForm.permisosRevocados,
      });

      if (authStore.usuario?.id === usuarioForm.id) {
        authStore.actualizarPerfilActual({
          nombre: usuarioForm.nombre,
          cargo: usuarioForm.cargo,
          departamento: usuarioForm.departamento,
          telefonoFlota: usuarioForm.telefonoFlota,
          rol: usuarioForm.rol,
          rolNombre,
          permisosExtras: usuarioForm.permisosExtras,
          permisosRevocados: usuarioForm.permisosRevocados,
        });
      }
    }

    feedbackGuardado.value = true;
    await recargarDatos();
    setTimeout(() => {
      feedbackGuardado.value = false;
      modalUsuarioAbierto.value = false;
    }, 600);
  } catch (err) {
    console.error('Error al guardar usuario:', err);
  } finally {
    guardandoUsuario.value = false;
  }
};

// --- GESTIÓN DE ROLES ---
const abrirCrearRol = () => {
  modoEdicionRol.value = 'crear';
  Object.assign(rolForm, {
    id: '',
    nombre: '',
    descripcion: '',
    colorBadge: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    permisos: [
      'clientes:ver',
      'pipeline:ver',
      'comunicaciones:ver',
      'metricas:ver_kpis',
    ],
  });
  feedbackRolGuardado.value = false;
  modalRolAbierto.value = true;
};

const abrirEditarRol = (rol: RolDefinicion) => {
  modoEdicionRol.value = 'editar';
  Object.assign(rolForm, {
    id: rol.id,
    nombre: rol.nombre,
    descripcion: rol.descripcion,
    colorBadge: rol.colorBadge,
    permisos: [...rol.permisos],
  });
  feedbackRolGuardado.value = false;
  modalRolAbierto.value = true;
};

const togglePermisoRol = (permisoId: string) => {
  if (rolForm.permisos.includes(permisoId)) {
    rolForm.permisos = rolForm.permisos.filter((p) => p !== permisoId);
  } else {
    rolForm.permisos.push(permisoId);
  }
};

const marcarTodosModuloRol = (modulo: ModuloPermiso, marcar: boolean) => {
  const permisosModulo = CATALOGO_PERMISOS.filter((p) => p.modulo === modulo).map((p) => p.id);
  if (marcar) {
    const nuevoSet = new Set([...rolForm.permisos, ...permisosModulo]);
    rolForm.permisos = Array.from(nuevoSet);
  } else {
    rolForm.permisos = rolForm.permisos.filter((p) => !permisosModulo.includes(p));
  }
};

const guardarRol = async () => {
  if (!rolForm.nombre.trim()) return;
  guardandoRol.value = true;

  try {
    if (modoEdicionRol.value === 'crear') {
      rolesPermisosService.crearRol({
        nombre: rolForm.nombre,
        descripcion: rolForm.descripcion,
        colorBadge: rolForm.colorBadge,
        permisos: rolForm.permisos,
      });
    } else {
      rolesPermisosService.actualizarRol(rolForm.id, {
        nombre: rolForm.nombre,
        descripcion: rolForm.descripcion,
        colorBadge: rolForm.colorBadge,
        permisos: rolForm.permisos,
      });
    }

    feedbackRolGuardado.value = true;
    await recargarDatos();
    setTimeout(() => {
      feedbackRolGuardado.value = false;
      modalRolAbierto.value = false;
    }, 600);
  } catch (err) {
    console.error('Error guardando rol:', err);
  } finally {
    guardandoRol.value = false;
  }
};

const eliminarRol = async (id: string) => {
  try {
    const ok = rolesPermisosService.eliminarRol(id);
    if (ok) {
      await recargarDatos();
    }
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Error al eliminar rol');
  }
};

const clasesBadgeRol = (rolId: string) => {
  const rol = roles.value.find((r) => r.id === rolId);
  return rol?.colorBadge || 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200';
};

const obtenerNombreRol = (rolId: string) => {
  const rol = roles.value.find((r) => r.id === rolId);
  return rol?.nombre || rolId;
};

// Resumen de overrides de un usuario
const resumenOverrides = (user: Usuario) => {
  const extras = user.permisosExtras?.length || 0;
  const revocados = user.permisosRevocados?.length || 0;
  if (extras === 0 && revocados === 0) {
    return { tiene: false, texto: 'Heredados del Rol' };
  }
  return {
    tiene: true,
    texto: `⚙️ ${extras > 0 ? `+${extras}` : ''}${extras > 0 && revocados > 0 ? ' / ' : ''}${revocados > 0 ? `-${revocados}` : ''} excepciones`,
  };
};

onMounted(async () => {
  await recargarDatos();
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
            Usuarios, Roles & Matriz de Permisos
          </h1>
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
            Control Granular
          </span>
        </div>
        <p class="text-[11px] text-zinc-500 dark:text-zinc-400 truncate hidden md:block">
          Crea roles personalizados y ajusta excepciones individuales de permisos por usuario
        </p>
      </div>
    </div>
  </Teleport>

  <!-- Teleport de Simulador hacia la Barra Superior -->
  <Teleport to="#header-portal-right">
    <div class="flex items-center gap-2">
      <!-- Selector de simulación con AppSelect -->
      <div class="hidden sm:flex items-center gap-2">
        <span class="text-zinc-500 dark:text-zinc-400 text-[11px] flex items-center gap-1 font-medium">
          <Sparkles class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          Probar Rol:
        </span>
        <AppSelect
          :model-value="authStore.rol"
          @update:model-value="(nuevo) => authStore.cambiarRolRapido(nuevo as RolUsuario)"
          :options="opcionesSimuladorRol"
          size="sm"
          min-width-class="min-w-[190px]"
        />
      </div>

      <button
        @click="recargarDatos"
        :disabled="cargando"
        title="Actualizar datos"
        class="p-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white hover:bg-zinc-100 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition hover:text-zinc-900 dark:hover:text-white disabled:opacity-50"
      >
        <RefreshCw :class="['w-3.5 h-3.5', cargando ? 'animate-spin text-indigo-600 dark:text-indigo-400' : '']" />
      </button>
    </div>
  </Teleport>

  <!-- Contenido Protegido con Flickerless Surface -->
  <div class="w-full pb-8">
    <FlickerlessSurface
      :loading="cargando"
      :delay-ms="180"
      :preserve-height="true"
      stream-color="#4f46e5"
      announce-text="Actualizando directorio de colaboradores y permisos..."
      class="w-full rounded-xl overflow-hidden"
    >
      <div class="space-y-4">
        <!-- Pestañas Superiores de Navegación del Módulo -->
        <div class="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.08] pb-3">
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="pestanaActiva = 'usuarios'"
              :class="[
                'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition',
                pestanaActiva === 'usuarios'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950/20'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              ]"
            >
              <Users class="w-3.5 h-3.5" />
              <span>Colaboradores & Permisos Directos ({{ usuarios.length }})</span>
            </button>

            <button
              type="button"
              @click="pestanaActiva = 'roles'"
              :class="[
                'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition',
                pestanaActiva === 'roles'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950/20'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              ]"
            >
              <Shield class="w-3.5 h-3.5" />
              <span>Roles & Matriz de Seguridad ({{ roles.length }})</span>
            </button>
          </div>

          <!-- Botón de Acción según Pestaña -->
          <div>
            <button
              v-if="pestanaActiva === 'usuarios'"
              type="button"
              @click="abrirCrearUsuario"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition active:scale-95"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>+ Nuevo Colaborador</span>
            </button>

            <button
              v-else
              type="button"
              @click="abrirCrearRol"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition active:scale-95"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>+ Crear Rol Personalizado</span>
            </button>
          </div>
        </div>

        <!-- VISTA 1: TABLA DE USUARIOS Y SUS PERMISOS DIRECTOS -->
        <div v-if="pestanaActiva === 'usuarios'" class="saas-card rounded-xl overflow-hidden text-xs border border-zinc-200 dark:border-white/[0.08]">
          <div class="p-3.5 border-b border-zinc-200 dark:border-white/[0.07] bg-zinc-50 dark:bg-[#0c0c0e]/80 flex items-center justify-between">
            <span class="font-semibold text-zinc-800 dark:text-zinc-200">Directorio de Colaboradores y Permisos Individuales</span>
            <span class="font-mono text-zinc-500 dark:text-zinc-400 text-[11px]">{{ usuarios.length }} usuarios registrados</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-zinc-200 dark:border-white/[0.07] bg-zinc-100/70 dark:bg-[#09090b]/60 text-zinc-500 dark:text-zinc-400 text-[11px] font-medium tracking-wider uppercase">
                  <th class="py-3 px-3.5">Colaborador</th>
                  <th class="py-3 px-3.5">Correo</th>
                  <th class="py-3 px-3.5">Departamento</th>
                  <th class="py-3 px-3.5">Cargo Oficial</th>
                  <th class="py-3 px-3.5">Flota</th>
                  <th class="py-3 px-3.5">Rol de Seguridad</th>
                  <th class="py-3 px-3.5">Excepciones</th>
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
                        <span v-if="!user.activo" class="text-[9px] text-rose-500 bg-rose-500/10 px-1 py-0.2 rounded border border-rose-500/20 font-bold shrink-0">
                          Inactivo
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
                      {{ obtenerNombreRol(user.rol) }}
                    </span>
                  </td>

                  <!-- Excepciones / Overrides -->
                  <td class="py-2.5 px-3.5">
                    <span
                      :class="[
                        'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono border',
                        resumenOverrides(user).tiene
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 font-semibold'
                          : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-white/[0.06]'
                      ]"
                    >
                      {{ resumenOverrides(user).texto }}
                    </span>
                  </td>

                  <!-- Acción: Editar Ficha & Permisos -->
                  <td class="py-2.5 px-3.5 text-right">
                    <button
                      type="button"
                      @click="abrirEditarUsuario(user)"
                      class="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs font-medium transition"
                    >
                      <Sliders class="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      <span>Editar & Permisos</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- VISTA 2: ROLES DEL SISTEMA & MATRIZ DINÁMICA -->
        <div v-else class="space-y-6">
          <!-- Tarjetas de Roles Creados -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              v-for="rol in roles"
              :key="rol.id"
              class="saas-card rounded-xl p-4 flex flex-col justify-between border border-zinc-200 dark:border-white/[0.08]"
            >
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span :class="['px-2 py-0.5 rounded-full text-[10px] font-medium border', rol.colorBadge]">
                    {{ rol.esSistema ? 'Rol de Sistema' : 'Rol Personalizado' }}
                  </span>

                  <div class="flex items-center gap-1">
                    <button
                      type="button"
                      @click="abrirEditarRol(rol)"
                      title="Editar rol y permisos"
                      class="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
                    >
                      <Edit3 class="w-3.5 h-3.5" />
                    </button>

                    <button
                      v-if="!rol.esSistema"
                      type="button"
                      @click="eliminarRol(rol.id)"
                      title="Eliminar rol personalizado"
                      class="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded text-rose-400 hover:text-rose-600 transition"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 class="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">
                  {{ rol.nombre }}
                </h3>
                <p class="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">
                  {{ rol.descripcion }}
                </p>
              </div>

              <div class="pt-3 border-t border-zinc-200 dark:border-white/[0.06] flex items-center justify-between text-xs">
                <span class="text-zinc-500 dark:text-zinc-400 font-medium">Capacidades asignadas:</span>
                <span class="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {{ rol.permisos.length }} / {{ CATALOGO_PERMISOS.length }}
                </span>
              </div>
            </div>
          </div>

          <!-- Matriz de Permisos Global Comparativa -->
          <div class="saas-card rounded-xl overflow-hidden text-xs border border-zinc-200 dark:border-white/[0.08]">
            <div class="p-3.5 border-b border-zinc-200 dark:border-white/[0.07] bg-zinc-50 dark:bg-[#0c0c0e]/80 flex items-center justify-between">
              <div class="flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200">
                <Shield class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Matriz Comparativa de Roles y Permisos (RBAC)</span>
              </div>
              <span class="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                {{ CATALOGO_PERMISOS.length }} permisos atómicos evaluados
              </span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-zinc-200 dark:border-white/[0.07] bg-zinc-100/70 dark:bg-[#09090b]/60 text-zinc-500 dark:text-zinc-400 text-[11px] font-medium tracking-wider uppercase">
                    <th class="py-3 px-4 w-72">Módulo y Permiso</th>
                    <th
                      v-for="rol in roles"
                      :key="rol.id"
                      class="py-3 px-3 text-center min-w-[120px]"
                    >
                      <span class="font-bold truncate">{{ rol.nombre }}</span>
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-200 dark:divide-white/[0.04]">
                  <template v-for="modulo in MODULOS_SISTEMA" :key="modulo.id">
                    <!-- Cabecera de Módulo -->
                    <tr class="bg-zinc-100/50 dark:bg-zinc-900/60 font-semibold text-zinc-700 dark:text-zinc-300">
                      <td :colspan="roles.length + 1" class="py-2 px-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wide">
                        {{ modulo.nombre }} ({{ modulo.descripcion }})
                      </td>
                    </tr>

                    <!-- Filas de permisos del módulo -->
                    <tr
                      v-for="permiso in CATALOGO_PERMISOS.filter((p) => p.modulo === modulo.id)"
                      :key="permiso.id"
                      class="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition"
                    >
                      <td class="py-2.5 px-4 font-sans">
                        <div class="font-medium text-zinc-900 dark:text-zinc-200">{{ permiso.nombre }}</div>
                        <div class="text-[10px] text-zinc-500 dark:text-zinc-400">{{ permiso.descripcion }}</div>
                      </td>

                      <td
                        v-for="rol in roles"
                        :key="rol.id"
                        class="py-2.5 px-3 text-center"
                      >
                        <span
                          v-if="rol.permisos.includes(permiso.id)"
                          class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        >
                          <Check class="w-3.5 h-3.5 stroke-[2.5]" />
                        </span>
                        <span
                          v-else
                          class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600"
                        >
                          <X class="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </FlickerlessSurface>

    <!-- MODAL 1: EDITAR FICHA & EXCEPCIONES DE PERMISOS POR USUARIO -->
    <div v-if="modalUsuarioAbierto" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div @click="modalUsuarioAbierto = false" class="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"></div>

      <div class="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden text-xs flex flex-col max-h-[90vh]">
        <!-- Cabecera del Modal -->
        <div class="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Users class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {{ modoEdicionUsuario === 'crear' ? 'Registrar Nuevo Colaborador' : `Ficha & Permisos: ${usuarioForm.nombre}` }}
              </h3>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
                Ajusta los datos del usuario y gestiona excepciones específicas de permisos
              </p>
            </div>
          </div>
          <button @click="modalUsuarioAbierto = false" class="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Contenido Scrolleable -->
        <div class="p-6 space-y-6 overflow-y-auto flex-1">
          <!-- DATOS GENERALES -->
          <div class="space-y-4">
            <div class="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono">
              1. Datos del Colaborador
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-zinc-700 dark:text-zinc-300 mb-1 font-medium">Nombre Completo</label>
                <input
                  type="text"
                  v-model="usuarioForm.nombre"
                  class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label class="block text-zinc-700 dark:text-zinc-300 mb-1 font-medium">Correo Electrónico</label>
                <input
                  type="email"
                  v-model="usuarioForm.email"
                  class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label class="block text-zinc-700 dark:text-zinc-300 mb-1 font-medium">Cargo Oficial</label>
                <input
                  type="text"
                  v-model="usuarioForm.cargo"
                  placeholder="Ej: Account Executive B2B"
                  class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label class="block text-zinc-700 dark:text-zinc-300 mb-1 font-medium">Departamento</label>
                <input
                  type="text"
                  v-model="usuarioForm.departamento"
                  placeholder="Ej: Ventas Corporativas"
                  class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label class="block text-zinc-700 dark:text-zinc-300 mb-1 font-medium">Flota Oficial</label>
                <input
                  type="text"
                  v-model="usuarioForm.telefonoFlota"
                  placeholder="+1 (809) 555-0102"
                  class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <!-- SELECTOR DE ROL USANDO APPSELECT -->
              <div>
                <label class="block text-zinc-700 dark:text-zinc-300 mb-1 font-medium">Rol Asignado (Base)</label>
                <AppSelect
                  :model-value="usuarioForm.rol"
                  @update:model-value="(nuevo) => usuarioForm.rol = nuevo as string"
                  :options="opcionesRolesSelect"
                  :full-width="true"
                  size="md"
                />
              </div>
            </div>

            <div class="pt-2">
              <label class="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  v-model="usuarioForm.activo"
                  class="rounded bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-0"
                />
                <span>Usuario Activo (Permite iniciar sesión en el CRM)</span>
              </label>
            </div>
          </div>

          <!-- SECCIÓN 2: PERSONALIZACIÓN GRANULAR DE PERMISOS -->
          <div class="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div class="flex items-start justify-between">
              <div>
                <div class="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Shield class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>2. Ajuste Individual de Permisos (Overrides)</span>
                </div>
                <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Quita permisos que vienen en su rol o concédele capacidades adicionales sin cambiar su rol base.
                </p>
              </div>

              <!-- Badges de resumen -->
              <div class="flex items-center gap-2">
                <span v-if="usuarioForm.permisosExtras.length > 0" class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  +{{ usuarioForm.permisosExtras.length }} Concedidos
                </span>
                <span v-if="usuarioForm.permisosRevocados.length > 0" class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  -{{ usuarioForm.permisosRevocados.length }} Revocados
                </span>
              </div>
            </div>

            <!-- Lista de Permisos por Módulo con Controles de Excepción -->
            <div class="space-y-4 pt-2">
              <div
                v-for="modulo in MODULOS_SISTEMA"
                :key="modulo.id"
                class="rounded-xl border border-zinc-200 dark:border-white/[0.08] overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/40"
              >
                <div class="px-3.5 py-2 bg-zinc-100/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-white/[0.06] font-semibold text-xs text-zinc-800 dark:text-zinc-200">
                  {{ modulo.nombre }}
                </div>

                <div class="p-2 space-y-1">
                  <div
                    v-for="permiso in CATALOGO_PERMISOS.filter((p) => p.modulo === modulo.id)"
                    :key="permiso.id"
                    class="px-2.5 py-2 rounded-lg flex items-center justify-between hover:bg-white dark:hover:bg-zinc-900/60 transition"
                  >
                    <div class="pr-3 min-w-0">
                      <div class="font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <span>{{ permiso.nombre }}</span>
                        <!-- Indicador visual del estado resultante -->
                        <span
                          v-if="estadoPermisoEnForm(permiso.id) === 'extra'"
                          class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        >
                          + Concedido (Extra)
                        </span>
                        <span
                          v-else-if="estadoPermisoEnForm(permiso.id) === 'revocado'"
                          class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                        >
                          - Revocado (Quitado)
                        </span>
                        <span
                          v-else-if="estadoPermisoEnForm(permiso.id) === 'heredado'"
                          class="px-1.5 py-0.2 rounded text-[9px] text-zinc-500 dark:text-zinc-400 bg-zinc-200/60 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700"
                        >
                          Heredado del Rol
                        </span>
                      </div>
                      <div class="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{{ permiso.descripcion }}</div>
                    </div>

                    <!-- Botones de Acción Tri-Estado -->
                    <div class="flex items-center gap-1 shrink-0 font-mono text-[10px]">
                      <button
                        type="button"
                        @click="setEstadoPermisoUsuario(permiso.id, 'heredar')"
                        title="Usar comportamiento por defecto del rol"
                        :class="[
                          'px-2 py-1 rounded transition font-medium',
                          !usuarioForm.permisosExtras.includes(permiso.id) && !usuarioForm.permisosRevocados.includes(permiso.id)
                            ? 'bg-zinc-300 dark:bg-zinc-700 text-zinc-900 dark:text-white font-bold shadow-sm'
                            : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                        ]"
                      >
                        Rol
                      </button>

                      <button
                        type="button"
                        @click="setEstadoPermisoUsuario(permiso.id, 'conceder')"
                        title="Conceder este permiso a este usuario"
                        :class="[
                          'px-2 py-1 rounded transition font-medium',
                          usuarioForm.permisosExtras.includes(permiso.id)
                            ? 'bg-emerald-600 text-white font-bold shadow-sm'
                            : 'text-emerald-600 hover:bg-emerald-500/10'
                        ]"
                      >
                        + Conceder
                      </button>

                      <button
                        type="button"
                        @click="setEstadoPermisoUsuario(permiso.id, 'revocar')"
                        title="Quitar este permiso a este usuario"
                        :class="[
                          'px-2 py-1 rounded transition font-medium',
                          usuarioForm.permisosRevocados.includes(permiso.id)
                            ? 'bg-rose-600 text-white font-bold shadow-sm'
                            : 'text-rose-600 hover:bg-rose-500/10'
                        ]"
                      >
                        - Revocar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pie del Modal -->
        <div class="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 flex items-center justify-between shrink-0">
          <span v-if="feedbackGuardado" class="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
            <CheckCircle2 class="w-3.5 h-3.5" />
            Cambios guardados exitosamente
          </span>
          <span v-else></span>

          <div class="flex items-center gap-3">
            <button
              type="button"
              @click="modalUsuarioAbierto = false"
              class="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              @click="guardarUsuario"
              :disabled="guardandoUsuario"
              class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm shadow-indigo-950/40"
            >
              <Save class="w-3.5 h-3.5" />
              <span>{{ guardandoUsuario ? 'Guardando...' : 'Guardar Cambios' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL 2: CREAR / EDITAR ROL PERSONALIZADO -->
    <div v-if="modalRolAbierto" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div @click="modalRolAbierto = false" class="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"></div>

      <div class="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden text-xs flex flex-col max-h-[90vh]">
        <!-- Cabecera del Modal -->
        <div class="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Shield class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {{ modoEdicionRol === 'crear' ? 'Crear Nuevo Rol Personalizado' : `Editar Rol: ${rolForm.nombre}` }}
              </h3>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
                Define el nombre del rol y selecciona qué permisos otorgará por defecto
              </p>
            </div>
          </div>
          <button @click="modalRolAbierto = false" class="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Contenido Scrolleable -->
        <div class="p-6 space-y-5 overflow-y-auto flex-1">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 mb-1 font-medium">Nombre del Rol</label>
              <input
                type="text"
                v-model="rolForm.nombre"
                placeholder="Ej: Soporte Comercial Nivel 2"
                class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label class="block text-zinc-700 dark:text-zinc-300 mb-1 font-medium">Color de Etiqueta</label>
              <div class="flex items-center gap-2 pt-1">
                <button
                  v-for="color in [
                    { key: 'purple', class: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20' },
                    { key: 'emerald', class: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
                    { key: 'sky', class: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20' },
                    { key: 'amber', class: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' },
                    { key: 'indigo', class: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20' }
                  ]"
                  :key="color.key"
                  type="button"
                  @click="rolForm.colorBadge = color.class"
                  :class="[
                    'px-2.5 py-1 rounded-lg text-xs font-semibold border transition',
                    color.class,
                    rolForm.colorBadge === color.class ? 'ring-2 ring-indigo-500' : 'opacity-70 hover:opacity-100'
                  ]"
                >
                  Etiqueta
                </button>
              </div>
            </div>

            <div class="sm:col-span-2">
              <label class="block text-zinc-700 dark:text-zinc-300 mb-1 font-medium">Descripción del Rol</label>
              <input
                type="text"
                v-model="rolForm.descripcion"
                placeholder="Ej: Acceso para coordinadores de soporte con facultad de emitir propuestas"
                class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <!-- Selección de Permisos por Módulo -->
          <div class="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <div class="flex items-center justify-between">
              <span class="font-bold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono">
                Matriz de Permisos del Rol ({{ rolForm.permisos.length }} seleccionados)
              </span>
            </div>

            <div class="space-y-4">
              <div
                v-for="modulo in MODULOS_SISTEMA"
                :key="modulo.id"
                class="rounded-xl border border-zinc-200 dark:border-white/[0.08] overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/40"
              >
                <div class="px-3.5 py-2 bg-zinc-100/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-white/[0.06] flex items-center justify-between">
                  <span class="font-semibold text-xs text-zinc-800 dark:text-zinc-200">{{ modulo.nombre }}</span>
                  <div class="flex items-center gap-2 text-[10px] font-mono">
                    <button
                      type="button"
                      @click="marcarTodosModuloRol(modulo.id, true)"
                      class="text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Marcar todos
                    </button>
                    <span class="text-zinc-400">|</span>
                    <button
                      type="button"
                      @click="marcarTodosModuloRol(modulo.id, false)"
                      class="text-zinc-500 hover:underline"
                    >
                      Desmarcar
                    </button>
                  </div>
                </div>

                <div class="p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    v-for="permiso in CATALOGO_PERMISOS.filter((p) => p.modulo === modulo.id)"
                    :key="permiso.id"
                    class="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white dark:hover:bg-zinc-900/60 cursor-pointer transition select-none"
                  >
                    <input
                      type="checkbox"
                      :checked="rolForm.permisos.includes(permiso.id)"
                      @change="togglePermisoRol(permiso.id)"
                      class="rounded bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-0 mt-0.5"
                    />
                    <div class="min-w-0">
                      <div class="font-medium text-zinc-800 dark:text-zinc-200 leading-tight">{{ permiso.nombre }}</div>
                      <div class="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">{{ permiso.descripcion }}</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pie del Modal -->
        <div class="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 flex items-center justify-between shrink-0">
          <span v-if="feedbackRolGuardado" class="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
            <CheckCircle2 class="w-3.5 h-3.5" />
            Rol guardado exitosamente
          </span>
          <span v-else></span>

          <div class="flex items-center gap-3">
            <button
              type="button"
              @click="modalRolAbierto = false"
              class="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              @click="guardarRol"
              :disabled="guardandoRol"
              class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm shadow-indigo-950/40"
            >
              <Save class="w-3.5 h-3.5" />
              <span>{{ guardandoRol ? 'Guardando...' : 'Guardar Rol' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
