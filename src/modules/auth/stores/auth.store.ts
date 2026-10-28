import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { globalAbility } from '@/core/permissions/ability';
import { authService } from '../services/auth.service';
import { rolesPermisosService } from '../services/roles-permisos.service';
import { establecerTokenApi } from '@/core/api/api-config';
import type { CredencialesLogin, Usuario } from '../types/auth.types';

export const useAuthStore = defineStore('auth', () => {
  const usuario = ref<Omit<Usuario, 'contrasena'> | null>(null);
  const token = ref<string | null>(null);

  const estaAutenticado = computed(() => !!token.value && !!usuario.value);
  const rol = computed(() => usuario.value?.rol || 'auditor');

  const permisosEfectivos = computed<string[]>(() => {
    if (!usuario.value) return [];
    return rolesPermisosService.calcularPermisosEfectivos(usuario.value as Usuario);
  });

  const tienePermiso = (permisoId: string): boolean => {
    if (!usuario.value) return false;
    return permisosEfectivos.value.includes(permisoId);
  };

  const tieneAlgunPermiso = (permisoIds: string[]): boolean => {
    return permisoIds.some((permisoId) => tienePermiso(permisoId));
  };

  // Inicializar sesión desde almacenamiento local si existe
  const inicializarSesion = () => {
    try {
      const guardada = localStorage.getItem('crm_sesion_auth');
      if (guardada) {
        const datos = JSON.parse(guardada);
        if (datos?.usuario && datos?.token) {
          usuario.value = datos.usuario;
          token.value = datos.token;
          establecerTokenApi(datos.token);
          
          // Reevaluar reglas con la configuración de roles actual
          const permisos = rolesPermisosService.calcularPermisosEfectivos(datos.usuario as Usuario);
          const reglas = rolesPermisosService.convertirPermisosAReglasCASL(permisos);

          globalAbility.setUser(datos.usuario);
          globalAbility.updateRules(reglas);
          return;
        }
      }
    } catch {
      // Ignorar error de parseo
    }

    // Por defecto: no autenticado
    usuario.value = null;
    token.value = null;
    globalAbility.setUser(null);
    globalAbility.updateRules([]);
  };

  const iniciarSesion = async (credenciales: CredencialesLogin) => {
    const sesion = await authService.login(credenciales);
    usuario.value = sesion.usuario;
    token.value = sesion.token;
    establecerTokenApi(sesion.token);
    
    // Cargar permisos en el motor CASL
    globalAbility.setUser(sesion.usuario);
    globalAbility.updateRules(sesion.reglas);

    if (credenciales.recordarme !== false) {
      localStorage.setItem('crm_sesion_auth', JSON.stringify(sesion));
    }
  };

  const cerrarSesion = () => {
    usuario.value = null;
    token.value = null;
    establecerTokenApi(null);
    globalAbility.setUser(null);
    globalAbility.updateRules([]);
    localStorage.removeItem('crm_sesion_auth');
  };

  const actualizarPerfilActual = (cambios: Partial<Usuario>) => {
    if (!usuario.value) return;
    usuario.value = { ...usuario.value, ...cambios };
    globalAbility.setUser(usuario.value);

    const permisos = rolesPermisosService.calcularPermisosEfectivos(usuario.value as Usuario);
    const reglas = rolesPermisosService.convertirPermisosAReglasCASL(permisos);
    globalAbility.updateRules(reglas);

    const sesion = {
      usuario: usuario.value,
      token: token.value,
      reglas,
      permisosEfectivos: permisos,
    };
    localStorage.setItem('crm_sesion_auth', JSON.stringify(sesion));
  };

  const solicitarOtpWhatsApp = async (telefono: string) => {
    return await authService.solicitarOtpWhatsApp(telefono);
  };

  const iniciarSesionConOtp = async (telefono: string, codigo: string, recordarme = true) => {
    const sesion = await authService.loginConOtp(telefono, codigo);
    usuario.value = sesion.usuario;
    token.value = sesion.token;
    establecerTokenApi(sesion.token);

    globalAbility.setUser(sesion.usuario);
    globalAbility.updateRules(sesion.reglas);

    if (recordarme) {
      localStorage.setItem('crm_sesion_auth', JSON.stringify(sesion));
    }
  };

  return {
    usuario,
    token,
    estaAutenticado,
    rol,
    permisosEfectivos,
    tienePermiso,
    tieneAlgunPermiso,
    inicializarSesion,
    iniciarSesion,
    solicitarOtpWhatsApp,
    iniciarSesionConOtp,
    cerrarSesion,
    actualizarPerfilActual,
  };
});
