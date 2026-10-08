import { z } from 'zod';

export type EstadoCliente = 'prospecto' | 'en_negociacion' | 'activo' | 'inactivo' | 'cerrado_perdido';
export type PrioridadCliente = 'alta' | 'media' | 'baja';

export interface Contacto {
  id: string;
  cliente_id: string;
  nombre: string;
  cargo: string;
  email: string;
  telefono: string;
  es_principal: boolean;
  creado_en: string;
}

export interface Oportunidad {
  id: string;
  cliente_id: string;
  titulo: string;
  monto: number;
  etapa: 'calificacion' | 'propuesta' | 'negociacion' | 'ganada' | 'perdida';
  probabilidad: number;
  fecha_cierre_estimada: string;
  creado_en: string;
}

export interface Actividad {
  id: string;
  cliente_id: string;
  tipo: 'llamada' | 'reunion' | 'correo' | 'nota';
  descripcion: string;
  realizado_por: string;
  fecha: string;
}

export interface Cliente {
  id: string;
  codigo: string;
  razon_social: string;
  nombre_comercial?: string;
  identificacion_fiscal?: string;
  sector: string;
  estado: EstadoCliente;
  prioridad: PrioridadCliente;
  sitio_web?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  valor_estimado: number;
  responsable: string;
  ultimo_contacto?: string;
  creado_en: string;
  actualizado_en?: string;
  contactos?: Contacto[];
  oportunidades?: Oportunidad[];
  actividades?: Actividad[];
}

export interface RespuestaClientesPaginada {
  datos: Cliente[];
  total: number;
  pagina: number;
  tamanoPagina: number;
  totalPaginas: number;
  estadisticas: {
    totalClientes: number;
    prospectos: number;
    enNegociacion: number;
    activos: number;
    valorTotalPipeline: number;
  };
}

// Zod Schema para validación de Nuevo Cliente (Blueprint 02)
export const ClienteSchema = z.object({
  razon_social: z.string().min(3, { message: 'La razón social debe tener al menos 3 caracteres' }),
  nombre_comercial: z.string().optional(),
  identificacion_fiscal: z.string().min(4, { message: 'Identificación fiscal requerida' }),
  sector: z.string().min(1, { message: 'Debe seleccionar un sector empresarial' }),
  estado: z.enum(['prospecto', 'en_negociacion', 'activo', 'inactivo', 'cerrado_perdido']),
  prioridad: z.enum(['alta', 'media', 'baja']),
  email: z.string().email({ message: 'Correo electrónico corporativo inválido' }),
  telefono: z.string().min(6, { message: 'Número de teléfono inválido' }),
  sitio_web: z.string().url({ message: 'URL de sitio web inválida' }).optional().or(z.literal('')),
  ciudad: z.string().min(2, { message: 'La ciudad es requerida' }),
  direccion: z.string().optional(),
  valor_estimado: z.number().min(0, { message: 'El valor estimado no puede ser negativo' }),
  responsable: z.string().min(2, { message: 'Debe asignar un responsable comercial' }),
  // Datos opcionales del Contacto Principal inicial
  contacto_nombre: z.string().optional(),
  contacto_cargo: z.string().optional(),
  contacto_email: z.string().email({ message: 'Correo del contacto inválido' }).optional().or(z.literal('')),
  contacto_telefono: z.string().optional(),
});

export type NuevoClienteInput = z.infer<typeof ClienteSchema>;

export interface NuevoContactoInput {
  nombre: string;
  cargo: string;
  email: string;
  telefono: string;
  es_principal?: boolean;
}
