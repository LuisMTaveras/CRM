import type { Usuario } from '../types/auth.types';

/**
 * Directorio semilla para el modo demostración (VITE_USE_MOCK=true).
 * Se construye exclusivamente desde variables VITE_DEMO_ADMIN_*; si no están
 * configuradas, no se crea ningún usuario y el modo local queda vacío.
 */
export function crearUsuariosDemo(): Usuario[] {
  const email = String(import.meta.env.VITE_DEMO_ADMIN_EMAIL || '').trim().toLowerCase();
  const contrasena = String(import.meta.env.VITE_DEMO_ADMIN_PASSWORD || '').trim();
  if (!email || !contrasena) return [];

  const nombre = String(import.meta.env.VITE_DEMO_ADMIN_NOMBRE || 'Administrador Demo').trim();
  const telefonoFlota = String(import.meta.env.VITE_DEMO_ADMIN_TELEFONO || '').trim();
  const rol = String(import.meta.env.VITE_DEMO_ADMIN_ROL || 'admin').trim();

  return [
    {
      id: 'usr-demo',
      nombre,
      email,
      contrasena,
      rol,
      rolNombre: String(import.meta.env.VITE_DEMO_ADMIN_ROL_NOMBRE || 'Administrador').trim(),
      cargo: String(import.meta.env.VITE_DEMO_ADMIN_CARGO || 'Administración').trim(),
      departamento: String(import.meta.env.VITE_DEMO_ADMIN_DEPARTAMENTO || 'Dirección').trim(),
      telefonoFlota,
      avatar: nombre
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte.charAt(0).toUpperCase())
        .join('') || 'US',
      activo: true,
      ultimoAcceso: new Date().toISOString(),
    },
  ];
}
