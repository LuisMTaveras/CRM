import type { Rule } from '@/core/permissions/ability';
import type { CredencialesLogin, RolUsuario, SesionAuth, Usuario } from '../types/auth.types';

export const USUARIOS_CRM: Usuario[] = [
  {
    id: 'usr-1',
    nombre: 'Camila Morales',
    email: 'camila@crm.do',
    contrasena: 'admin123',
    rol: 'admin',
    rolNombre: 'Directora Comercial & Admin',
    cargo: 'Head of Sales & CRM Admin',
    avatar: 'CM',
    activo: true,
    ultimoAcceso: '2026-10-05T15:30:00Z',
  },
  {
    id: 'usr-2',
    nombre: 'Ignacio Silva',
    email: 'ignacio@crm.do',
    contrasena: 'ventas123',
    rol: 'ejecutivo',
    rolNombre: 'Ejecutivo Comercial Senior',
    cargo: 'Account Executive B2B',
    avatar: 'IS',
    activo: true,
    ultimoAcceso: '2026-10-05T14:15:00Z',
  },
  {
    id: 'usr-3',
    nombre: 'Felipe Guzmán',
    email: 'felipe@crm.do',
    contrasena: 'gerente123',
    rol: 'gerente',
    rolNombre: 'Gerente de Cuentas Estratégicas',
    cargo: 'Key Account Manager',
    avatar: 'FG',
    activo: true,
    ultimoAcceso: '2026-10-04T18:00:00Z',
  },
  {
    id: 'usr-4',
    nombre: 'Laura Peña',
    email: 'laura@crm.do',
    contrasena: 'auditor123',
    rol: 'auditor',
    rolNombre: 'Auditora & Analista de Riesgo',
    cargo: 'Business Intelligence Analyst',
    avatar: 'LP',
    activo: true,
    ultimoAcceso: '2026-10-05T09:45:00Z',
  },
];

export function generarReglasPorRol(rol: RolUsuario): Rule[] {
  switch (rol) {
    case 'admin':
      return [
        { action: 'manage', subject: 'all' },
      ];
    case 'gerente':
      return [
        { action: ['read', 'create', 'update'], subject: 'Cliente' },
        { action: ['read', 'create', 'update', 'delete'], subject: 'Oportunidad' },
        { action: ['read', 'create', 'update'], subject: 'Actividad' },
        { action: 'read', subject: 'Metricas' },
        { action: 'read', subject: 'Usuario' },
      ];
    case 'ejecutivo':
      return [
        { action: ['read', 'create', 'update'], subject: 'Cliente' },
        { action: ['read', 'create', 'update'], subject: 'Oportunidad' },
        { action: ['read', 'create', 'update'], subject: 'Actividad' },
        { action: 'read', subject: 'Metricas' },
      ];
    case 'auditor':
      return [
        { action: 'read', subject: 'Cliente' },
        { action: 'read', subject: 'Oportunidad' },
        { action: 'read', subject: 'Actividad' },
        { action: 'read', subject: 'Metricas' },
      ];
    default:
      return [];
  }
}

class AuthService {
  async login(credenciales: CredencialesLogin): Promise<SesionAuth> {
    // Simular verificación asíncrona de hash contra base de datos PostgreSQL
    await new Promise((resolve) => setTimeout(resolve, 350));

    const emailLimpio = (credenciales.email || '').toLowerCase().trim();
    const usuario = USUARIOS_CRM.find((u) => u.email.toLowerCase() === emailLimpio);

    // 1. Verificación de existencia de usuario
    if (!usuario) {
      throw new Error('Credenciales inválidas: el correo o la contraseña no coinciden.');
    }

    // 2. Verificación estricta de contraseña
    if (!credenciales.contrasena || usuario.contrasena !== credenciales.contrasena) {
      throw new Error('Credenciales inválidas: el correo o la contraseña no coinciden.');
    }

    // 3. Verificación de estado de cuenta
    if (!usuario.activo) {
      throw new Error('Esta cuenta de usuario ha sido desactivada por el administrador.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contrasena, ...usuarioSinContrasena } = usuario;
    const reglas = generarReglasPorRol(usuario.rol);
    
    const sesion: SesionAuth = {
      usuario: { ...usuarioSinContrasena, ultimoAcceso: new Date().toISOString() },
      token: `crm_jwt_${usuario.id}_${Date.now()}`,
      reglas,
    };

    return sesion;
  }

  async obtenerUsuarios(): Promise<Usuario[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return [...USUARIOS_CRM];
  }
}

export const authService = new AuthService();
