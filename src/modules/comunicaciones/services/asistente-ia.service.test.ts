import { describe, it, expect } from 'vitest';
import { asistenteIaService } from './asistente-ia.service';

describe('AsistenteIaService - Generación Inteligente de Mensajes Comerciales', () => {
  it('genera un mensaje de WhatsApp para seguimiento de cotización con enlaces y variables', () => {
    const msg = asistenteIaService.generarMensajeWhatsApp({
      intencion: 'seguimiento_cotizacion',
      clienteNombre: 'Grupo Ramos',
      contactoNombre: 'Lic. Laura Martínez',
      numeroCotizacion: 'COT-2026-0045',
      montoTotal: 'RD$ 850,000.00',
      enlacePropuesta: 'http://crm.local/propuesta/tok_test_123',
    });

    expect(msg).toContain('Laura Martínez');
    expect(msg).toContain('Grupo Ramos');
    expect(msg).toContain('COT-2026-0045');
    expect(msg).toContain('RD$ 850,000.00');
    expect(msg).toContain('http://crm.local/propuesta/tok_test_123');
  });

  it('genera un mensaje de confirmación de reunión cordial', () => {
    const msg = asistenteIaService.generarMensajeWhatsApp({
      intencion: 'confirmacion_reunion',
      clienteNombre: 'Claro Dominicana',
      fechaReunion: 'Jueves 23 de Octubre a las 10:00 AM',
    });

    expect(msg).toContain('Claro Dominicana');
    expect(msg).toContain('Jueves 23 de Octubre a las 10:00 AM');
    expect(msg).toContain('reunión');
  });

  it('genera plantilla de correo formal con asunto y cuerpo HTML', () => {
    const email = asistenteIaService.generarPlantillaEmail({
      intencion: 'bienvenida_cierre',
      clienteNombre: 'Banco Santa Cruz',
      contactoNombre: 'Ing. Marcos Soto',
    });

    expect(email.asunto).toContain('Banco Santa Cruz');
    expect(email.cuerpo).toContain('Marcos Soto');
    expect(email.cuerpo).toContain('alianza');
  });
});
