import { empresaService } from '@/modules/configuracion/services/empresa.service';
import type { DefinicionEtiqueta, RespuestaRapida } from '../types/whatsapp-chat.types';

export const CATALOGO_ETIQUETAS: DefinicionEtiqueta[] = [
  { id: 'vip', nombre: 'VIP', colorClase: 'text-amber-700 dark:text-amber-400', bgClase: 'bg-amber-500/10 border-amber-500/30' },
  { id: 'cotizado', nombre: 'Cotizado', colorClase: 'text-sky-700 dark:text-sky-400', bgClase: 'bg-sky-500/10 border-sky-500/30' },
  { id: 'negociacion', nombre: 'En Negociación', colorClase: 'text-indigo-700 dark:text-indigo-400', bgClase: 'bg-indigo-500/10 border-indigo-500/30' },
  { id: 'pago_pendiente', nombre: 'Pago Pendiente', colorClase: 'text-rose-700 dark:text-rose-400', bgClase: 'bg-rose-500/10 border-rose-500/30' },
  { id: 'cerrado', nombre: 'Cerrado Ganado', colorClase: 'text-emerald-700 dark:text-emerald-400', bgClase: 'bg-emerald-500/10 border-emerald-500/30' },
];

export const crearCatalogoRespuestasRapidas = (): RespuestaRapida[] => {
  const datosEmpresa = empresaService.obtenerDatos();
  const nombreEmpresa =
    datosEmpresa.razonSocial || datosEmpresa.nombreComercial || 'nuestra empresa';

  return [
    {
      comando: '/banco',
      titulo: 'Datos Bancarios Oficiales',
      texto: `Para recibir los datos bancarios oficiales de ${nombreEmpresa}, comuníquese con nuestro equipo de facturación. RNC: ${datosEmpresa.identificacionFiscal || '—'}.`,
      categoria: 'operativa',
    },
    {
      comando: '/horario',
      titulo: 'Horario de Atención Comercial',
      texto: 'Nuestro horario comercial es de Lunes a Viernes de 8:30 AM a 6:00 PM. Estamos a su completa disposición.',
      categoria: 'operativa',
    },
    {
      comando: '/cotizacion',
      titulo: 'Envío de Cotización Formal',
      texto: 'Estimado/a {{nombre}}, le comparto los términos comerciales de la cotización acordada. Quedo atento a su visto bueno para formalizar.',
      categoria: 'comercial',
    },
    {
      comando: '/gracias',
      titulo: 'Agradecimiento por su Confianza',
      texto: '¡Muchas gracias por su preferencia {{nombre}}! Ha sido un placer atenderle. Seguimos a sus órdenes para cualquier requerimiento.',
      categoria: 'cierre',
    },
    {
      comando: '/reunion',
      titulo: 'Coordinar Videollamada / Reunión',
      texto: 'Hola {{nombre}}, ¿le convendría una breve videollamada de 15 minutos hoy o mañana para revisar los detalles técnicos?',
      categoria: 'comercial',
    },
    {
      comando: '/factura',
      titulo: 'Solicitud de Datos Fiscales B01',
      texto: 'Para emitir su comprobante fiscal con valor (NCF B01), favor remitirnos su RNC o Cédula, Razón Social y dirección comercial.',
      categoria: 'operativa',
    },
  ];
};
