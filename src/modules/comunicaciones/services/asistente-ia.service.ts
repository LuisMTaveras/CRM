export type IntencionComercial =
  | 'seguimiento_cotizacion'
  | 'confirmacion_reunion'
  | 'bienvenida_cierre'
  | 'recordatorio_pago';

export interface ParametrosGeneracionIA {
  intencion: IntencionComercial;
  clienteNombre: string;
  contactoNombre?: string;
  numeroCotizacion?: string;
  montoTotal?: string;
  enlacePropuesta?: string;
  fechaReunion?: string;
}

class AsistenteIaService {
  generarMensajeWhatsApp(params: ParametrosGeneracionIA): string {
    const saludo = params.contactoNombre
      ? `Estimado(a) ${params.contactoNombre}`
      : `Saludos equipo de ${params.clienteNombre}`;

    switch (params.intencion) {
      case 'seguimiento_cotizacion':
        return (
          `¡Hola, ${saludo}! Esperamos que se encuentren muy bien.\n\n` +
          `Le escribimos desde DEVFORGE para dar seguimiento a la propuesta comercial formal *${params.numeroCotizacion || 'reciente'}*` +
          (params.montoTotal ? ` por valor de *${params.montoTotal}*` : '') +
          ` enviada para ${params.clienteNombre}.\n\n` +
          (params.enlacePropuesta
            ? `Pueden consultar todos los términos y aprobar la propuesta en línea aquí:\n${params.enlacePropuesta}\n\n`
            : '') +
          `¿Tendrían unos 10 minutos esta semana para revisar cualquier inquietud técnica o comercial? Quedamos a su entera disposición.`
        );

      case 'confirmacion_reunion':
        return (
          `¡Hola, ${saludo}! Un placer saludarle.\n\n` +
          `Confirmamos nuestra reunión y sesión de trabajo técnico-comercial` +
          (params.fechaReunion ? ` pautada para el *${params.fechaReunion}*` : '') +
          `.\n\n` +
          `En el encuentro repasaremos los alcances del proyecto y resolveremos dudas operativas. ¡Nos vemos pronto!`
        );

      case 'bienvenida_cierre':
        return (
          `¡Excelente día, ${saludo}!\n\n` +
          `Es un honor formalizar el inicio de esta alianza estratégica con ${params.clienteNombre}.\n\n` +
          `Hemos activado su orden de servicio y nuestro equipo de operaciones iniciará la fase de despliegue de inmediato. ¡Bienvenidos a bordo!`
        );

      case 'recordatorio_pago':
        return (
          `¡Hola, ${saludo}! Esperamos que todo marche excelente.\n\n` +
          `Nos comunicamos cordialmente desde administración para recordar el vencimiento del comprobante fiscal correspondiente a ${params.clienteNombre}` +
          (params.montoTotal ? ` por *${params.montoTotal}*` : '') +
          `.\n\n` +
          `Agradecemos remitir el comprobante de transferencia bancaria para conciliar su cuenta. ¡Muchas gracias!`
        );
    }
  }

  generarPlantillaEmail(params: ParametrosGeneracionIA): { asunto: string; cuerpo: string } {
    const saludo = params.contactoNombre
      ? `Estimado(a) ${params.contactoNombre}:`
      : `Estimado equipo de ${params.clienteNombre}:`;

    switch (params.intencion) {
      case 'seguimiento_cotizacion':
        return {
          asunto: `Seguimiento de Propuesta Comercial ${params.numeroCotizacion || ''} - ${params.clienteNombre}`,
          cuerpo:
            `<p>${saludo}</p>` +
            `<p>Esperamos que este mensaje le encuentre muy bien. Nos comunicamos para dar seguimiento a la propuesta comercial presentada para ${params.clienteNombre}.</p>` +
            (params.enlacePropuesta
              ? `<p>Puede acceder al portal de revisión y confirmación digital a través del siguiente enlace:<br><a href="${params.enlacePropuesta}"><strong>Ver Propuesta Comercial en Línea</strong></a></p>`
              : '') +
            `<p>Estaremos complacidos de coordinar una breve llamada para afinar detalles técnicos o presupuestarios.</p>` +
            `<p>Atentamente,<br><strong>Equipo de Consultoría Comercial</strong></p>`,
        };

      case 'confirmacion_reunion':
        return {
          asunto: `Confirmación de Reunión de Trabajo - ${params.clienteNombre}`,
          cuerpo:
            `<p>${saludo}</p>` +
            `<p>Confirmamos la reunión agendada para repasar los requerimientos técnicos y de integración.</p>` +
            `<p>Quedamos a su entera disposición.</p>`,
        };

      case 'bienvenida_cierre':
        return {
          asunto: `¡Bienvenidos a DEVFORGE! - Inicio de Operaciones ${params.clienteNombre}`,
          cuerpo:
            `<p>${saludo}</p>` +
            `<p>Agradecemos la confianza depositada en nuestro equipo para formalizar esta alianza estratégica y dar inicio al proyecto.</p>` +
            `<p>Su ejecutivo asignado le contactará para el cronograma de entregables.</p>`,
        };

      case 'recordatorio_pago':
        return {
          asunto: `Aviso Administrativo de Facturación - ${params.clienteNombre}`,
          cuerpo:
            `<p>${saludo}</p>` +
            `<p>Le saludamos cordialmente para recordar el estado administrativo de sus servicios.</p>`,
        };
    }
  }
}

export const asistenteIaService = new AsistenteIaService();
