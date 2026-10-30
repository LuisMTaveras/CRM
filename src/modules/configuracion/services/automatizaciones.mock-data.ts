import type { Automatizacion } from '../types/automatizacion.types';

/**
 * Reglas iniciales para el modo demostración. El backend siembra exactamente
 * las mismas reglas al crear la colección por primera vez.
 */
export const AUTOMATIZACIONES_SEMILLA: Automatizacion[] = [
  {
    id: 'auto-seguimiento-propuesta',
    nombre: 'Seguimiento al enviar propuesta',
    descripcion:
      'Genera una tarea de llamada dos días después de mover una oportunidad a Propuesta Enviada.',
    evento: 'etapa_cambiada',
    activa: true,
    condiciones: { etapa: 'propuesta', etapa_origen: '', sector: '', prioridad: '' },
    accion: {
      tipo: 'crear_tarea',
      titulo: 'Seguimiento de propuesta: {{oportunidad}}',
      descripcion:
        'Contactar a {{cliente}} para confirmar la recepción y revisión de la propuesta comercial.',
      prioridad: 'alta',
      dias_vencimiento: 2,
    },
    creado_en: '2026-01-20T09:00:00.000Z',
  },
  {
    id: 'auto-cierre-ganado',
    nombre: 'Bitácora de cierre ganado',
    descripcion:
      'Registra una nota en la agenda cuando una oportunidad pasa a Cerrada Ganada.',
    evento: 'etapa_cambiada',
    activa: true,
    condiciones: { etapa: 'ganada', etapa_origen: '', sector: '', prioridad: '' },
    accion: {
      tipo: 'registrar_nota',
      titulo: 'Trato ganado: {{oportunidad}}',
      descripcion:
        'El cliente {{cliente}} cerró la oportunidad en la etapa Ganada. Verificar contrato y facturación.',
      prioridad: 'media',
      dias_vencimiento: 0,
    },
    creado_en: '2026-01-20T09:05:00.000Z',
  },
];
