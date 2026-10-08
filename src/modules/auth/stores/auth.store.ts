import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { globalAbility } from '@/core/permissions/ability';
import { authService, generarReglasPorRol, USUARIOS_CRM } from '../services/auth.service';
import type { CredencialesLogin, RolUsuario, Usuario } from '../types/auth.types';

export const useAuthStore = defineStore('auth', () => {
  const usuario = ref<Omit<Usuario, 'contrasena'> | null>(null);
  const token = ref<string | null>(null);

  const estaAutenticado = computed(() => !!token.value && !!usuario.value);
  const rol = computed(() => usuario.value?.rol || 'auditor');

  // Inicializar sesión desde almacenamiento local si existe
  const inicializarSesion = () => {
    try {
      const guardada = localStorage.getItem('crm_sesion_auth');
      if (guardada) {
        const datos = JSON.parse(guardada);
        if (datos?.usuario && datos?.token) {
          usuario.value = datos.usuario;
          token.value = datos.token;
          globalAbility.setUser(datos.usuario);
          globalAbility.updateRules(datos.reglas || generarReglasPorRol(datos.usuario.rol));
          return;
        }
      }
    } catch {
      // Ignorar error de parseo
    }

    // Por defecto: no autenticado hasta que ingrese credenciales válidas
    usuario.value = null;
    token.value = null;
    globalAbility.setUser(null);
    globalAbility.updateRules([]);
  };

  const iniciarSesion = async (credenciales: CredencialesLogin) => {
    const sesion = await authService.login(credenciales);
    usuario.value = sesion.usuario;
    token.value = sesion.token;
    
    // Cargar permisos en el motor CASL (Blueprint 04)
    globalAbility.setUser(sesion.usuario);
    globalAbility.updateRules(sesion.reglas);

    if (credenciales.recordarme !== false) {
      localStorage.setItem('crm_sesion_auth', JSON.stringify(sesion));
    }
  };

  const cerrarSesion = () => {
    usuario.value = null;
    token.value = null;
    globalAbility.setUser(null);
    globalAbility.updateRules([]);
    localStorage.removeItem('crm_sesion_auth');
  };

  // Simulador de escenarios y cambio rápido de rol (Blueprint 05)
  const cambiarRolRapido = (nuevoRol: RolUsuario) => {
    const usuarioEjemplo = USUARIOS_CRM.find((u) => u.rol === nuevoRol) || USUARIOS_CRM[0];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contrasena, ...sinPass } = usuarioEjemplo;
    
    usuario.value = sinPass;
    token.value = `crm_jwt_${nuevoRol}_quick`;
    const reglas = generarReglasPorRol(nuevoRol);
    globalAbility.setUser(usuario.value);
    globalAbility.updateRules(reglas);

    localStorage.setItem(
      'crm_sesion_auth',
      JSON.stringify({
        usuario: usuario.value,
        token: token.value,
        reglas,
      })
    );
  };

  return {
    usuario,
    token,
    estaAutenticado,
    rol,
    inicializarSesion,
    iniciarSesion,
    cerrarSesion,
    cambiarRolRapido,
    actualizarPerfilActual: (cambios: Partial<Usuario>) => {
      if (!usuario.value) return;
      usuario.value = { ...usuario.value, ...cambios };
      globalAbility.setUser(usuario.value);
      const reglas = generarReglasPorRol(usuario.value.rol);
      globalAbility.updateRules(reglas);
      const sesion = {
        usuario: usuario.value,
        token: token.value,
        reglas,
      };
      localStorage.setItem('crm_sesion_auth', JSON.stringify(sesion));
    },
  };
});
