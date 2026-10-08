import type { Rule } from '@/core/permissions/ability';

export type RolUsuario = 'admin' | 'gerente' | 'ejecutivo' | 'auditor';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  rolNombre: string;
  cargo: string;
  departamento?: string;
  telefonoFlota?: string;
  avatar: string;
  activo: boolean;
  ultimoAcceso: string;
  contrasena: string;
}

export interface CredencialesLogin {
  email: string;
  contrasena: string;
  recordarme?: boolean;
}

export interface SesionAuth {
  usuario: Omit<Usuario, 'contrasena'>;
  token: string;
  reglas: Rule[];
}
