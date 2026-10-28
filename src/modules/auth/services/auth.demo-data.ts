import type { Usuario } from '../types/auth.types';

/**
 * Directorio semilla para el modo demostración (VITE_USE_MOCK=true).
 * No representa usuarios reales ni debe habilitarse en producción.
 */
export function crearUsuariosDemo(): Usuario[] {
  return [
    {
      id: 'usr-1',
      nombre: 'Luis M. Taveras',
      email: 'luismiguel@alliance.do',
      contrasena: 'admin123',
      rol: 'admin',
      rolNombre: 'Team Leader & Administrador',
      cargo: 'Team Leader TI Support',
      departamento: 'Ingeniería de Software & Soporte TI',
      telefonoFlota: '+1 (829) 708-4706',
      avatar: 'LT',
      activo: true,
      ultimoAcceso: new Date().toISOString(),
    },
  ];
}
