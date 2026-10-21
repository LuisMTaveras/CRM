import { describe, it, expect, beforeEach, vi } from 'vitest';
import { whatsAppChatService } from './whatsapp-chat.service';

describe('WhatsAppChatService - Gestión de Conversaciones y Mensajes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    whatsAppChatService.chats.value = [];
    whatsAppChatService.chatActivo.value = null;
    whatsAppChatService.mensajes.value = [];
  });

  it('calcula correctamente el total de mensajes no leídos', () => {
    whatsAppChatService.chats.value = [
      {
        jid: '18095550101@s.whatsapp.net',
        telefono: '+1 (809) 555-0101',
        nombre: 'Banco BHD León',
        ultimoMensaje: 'Hola',
        ultimoTimestamp: new Date().toISOString(),
        noLeidos: 3,
        avatar: 'BH',
      },
      {
        jid: '18295550202@s.whatsapp.net',
        telefono: '+1 (829) 555-0202',
        nombre: 'Grupo Ramos',
        ultimoMensaje: 'Ok',
        ultimoTimestamp: new Date().toISOString(),
        noLeidos: 2,
        avatar: 'GR',
      },
    ];

    expect(whatsAppChatService.totalNoLeidos.value).toBe(5);
  });

  it('carga la lista de chats desde el backend', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        chats: [
          {
            jid: '18095550101@s.whatsapp.net',
            telefono: '+1 (809) 555-0101',
            nombre: 'Banco BHD León',
            ultimoMensaje: 'Cotización recibida',
            ultimoTimestamp: '2026-10-21T14:00:00.000Z',
            noLeidos: 1,
            avatar: 'BH',
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await whatsAppChatService.cargarChats();
    expect(whatsAppChatService.chats.value.length).toBe(1);
    expect(whatsAppChatService.chats.value[0].nombre).toBe('Banco BHD León');
  });

  it('selecciona un chat y carga su historial de mensajes', async () => {
    const chatMock = {
      jid: '18095550101@s.whatsapp.net',
      telefono: '+1 (809) 555-0101',
      nombre: 'Banco BHD León',
      ultimoMensaje: 'Hola',
      ultimoTimestamp: '2026-10-21T14:00:00.000Z',
      noLeidos: 1,
      avatar: 'BH',
    };

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/mensajes')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ok: true,
            mensajes: [
              {
                id: 'msg-1',
                deMi: false,
                emisor: 'Lic. Roberto Morales',
                texto: 'Hola, ¿pueden enviarme la cotización?',
                timestamp: '2026-10-21T13:00:00.000Z',
                estado: 'leido',
                tipo: 'texto',
              },
            ],
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ ok: true }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    await whatsAppChatService.seleccionarChat(chatMock);
    expect(whatsAppChatService.chatActivo.value?.jid).toBe(chatMock.jid);
    expect(whatsAppChatService.mensajes.value.length).toBe(1);
    expect(whatsAppChatService.mensajes.value[0].texto).toContain('cotización');
  });

  it('envía un nuevo mensaje dentro del chat activo', async () => {
    whatsAppChatService.chatActivo.value = {
      jid: '18095550101@s.whatsapp.net',
      telefono: '+1 (809) 555-0101',
      nombre: 'Banco BHD León',
      ultimoMensaje: 'Hola',
      ultimoTimestamp: '2026-10-21T14:00:00.000Z',
      noLeidos: 0,
      avatar: 'BH',
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        mensaje: {
          id: 'msg-saliente-1',
          deMi: true,
          emisor: 'Luis M. Taveras',
          texto: 'Con gusto le comparto los términos del acuerdo.',
          timestamp: '2026-10-21T14:05:00.000Z',
          estado: 'enviado',
          tipo: 'texto',
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const enviado = await whatsAppChatService.enviarMensaje('Con gusto le comparto los términos del acuerdo.');
    expect(enviado).toBe(true);
    expect(whatsAppChatService.mensajes.value.length).toBe(1);
    expect(whatsAppChatService.chatActivo.value.ultimoMensaje).toContain('términos del acuerdo');
  });

  it('adjunta y envía un documento PDF correctamente', async () => {
    whatsAppChatService.chatActivo.value = {
      jid: '18095550101@s.whatsapp.net',
      telefono: '+1 (809) 555-0101',
      nombre: 'Banco BHD León',
      ultimoMensaje: 'Hola',
      ultimoTimestamp: '2026-10-21T14:00:00.000Z',
      noLeidos: 0,
      avatar: 'BH',
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        mensaje: {
          id: 'msg-doc-1',
          deMi: true,
          emisor: 'Tú',
          texto: 'Cotización comercial adjunta',
          timestamp: '2026-10-21T14:10:00.000Z',
          estado: 'enviado',
          tipo: 'documento',
          archivoNombre: 'Cotizacion_Formal.pdf',
          archivoUrl: '/api/whatsapp/media/wa_123_cotizacion.pdf',
          archivoTamano: '1.2 MB',
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const archivoMock = new File(['fake pdf content'], 'Cotizacion_Formal.pdf', {
      type: 'application/pdf',
    });

    const enviado = await whatsAppChatService.enviarArchivo(archivoMock, 'Cotización comercial adjunta');
    expect(enviado).toBe(true);
    expect(whatsAppChatService.mensajes.value.length).toBe(1);
    expect(whatsAppChatService.mensajes.value[0].tipo).toBe('documento');
    expect(whatsAppChatService.mensajes.value[0].archivoNombre).toBe('Cotizacion_Formal.pdf');
  });

  it('adjunta y envía una imagen correctamente', async () => {
    whatsAppChatService.chatActivo.value = {
      jid: '18095550101@s.whatsapp.net',
      telefono: '+1 (809) 555-0101',
      nombre: 'Banco BHD León',
      ultimoMensaje: 'Hola',
      ultimoTimestamp: '2026-10-21T14:00:00.000Z',
      noLeidos: 0,
      avatar: 'BH',
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        mensaje: {
          id: 'msg-img-1',
          deMi: true,
          emisor: 'Tú',
          texto: 'Comprobante de entrega',
          timestamp: '2026-10-21T14:12:00.000Z',
          estado: 'enviado',
          tipo: 'imagen',
          archivoNombre: 'comprobante.png',
          archivoUrl: '/api/whatsapp/media/wa_456_comprobante.png',
          archivoTamano: '450 KB',
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const archivoMock = new File(['fake image content'], 'comprobante.png', {
      type: 'image/png',
    });

    const enviado = await whatsAppChatService.enviarArchivo(archivoMock, 'Comprobante de entrega');
    expect(enviado).toBe(true);
    expect(whatsAppChatService.mensajes.value.length).toBe(1);
    expect(whatsAppChatService.mensajes.value[0].tipo).toBe('imagen');
    expect(whatsAppChatService.mensajes.value[0].archivoNombre).toBe('comprobante.png');
  });

  it('envía un mensaje citando una respuesta previa (mensajeCitado)', async () => {
    whatsAppChatService.chatActivo.value = {
      jid: '18095550101@s.whatsapp.net',
      telefono: '+1 (809) 555-0101',
      nombre: 'Banco BHD León',
      ultimoMensaje: 'Hola',
      ultimoTimestamp: '2026-10-21T14:00:00.000Z',
      noLeidos: 0,
      avatar: 'BH',
    };

    const citaMock = {
      id: 'msg-previo-123',
      emisor: 'Lic. Roberto',
      texto: '¿Aceptan transferencia en dólares?',
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        mensaje: {
          id: 'msg-resp-1',
          deMi: true,
          emisor: 'Tú',
          texto: 'Sí, aceptamos transferencias en USD y DOP.',
          timestamp: '2026-10-21T14:15:00.000Z',
          estado: 'enviado',
          tipo: 'texto',
          mensajeCitado: citaMock,
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const enviado = await whatsAppChatService.enviarMensaje('Sí, aceptamos transferencias en USD y DOP.', citaMock);
    expect(enviado).toBe(true);
    expect(whatsAppChatService.mensajes.value.length).toBe(1);
    expect(whatsAppChatService.mensajes.value[0].mensajeCitado?.id).toBe('msg-previo-123');
  });

  it('adjunta y envía una nota de voz o archivo de audio correctamente', async () => {
    whatsAppChatService.chatActivo.value = {
      jid: '18095550101@s.whatsapp.net',
      telefono: '+1 (809) 555-0101',
      nombre: 'Banco BHD León',
      ultimoMensaje: 'Hola',
      ultimoTimestamp: '2026-10-21T14:00:00.000Z',
      noLeidos: 0,
      avatar: 'BH',
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        mensaje: {
          id: 'msg-audio-1',
          deMi: true,
          emisor: 'Tú',
          texto: '',
          timestamp: '2026-10-21T14:16:00.000Z',
          estado: 'enviado',
          tipo: 'audio',
          esNotaVoz: true,
          duracionSegundos: 12,
          archivoNombre: 'nota_voz.ogg',
          archivoUrl: '/api/whatsapp/media/nota_voz.ogg',
          archivoTamano: '84 KB',
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const archivoMock = new File(['fake ogg audio'], 'nota_voz.ogg', {
      type: 'audio/ogg',
    });

    const enviado = await whatsAppChatService.enviarArchivo(archivoMock);
    expect(enviado).toBe(true);
    expect(whatsAppChatService.mensajes.value.length).toBe(1);
    expect(whatsAppChatService.mensajes.value[0].tipo).toBe('audio');
    expect(whatsAppChatService.mensajes.value[0].esNotaVoz).toBe(true);
  });

  it('actualiza las etiquetas comerciales de un chat activo y en la lista', async () => {
    const chat = {
      jid: '18095550101@s.whatsapp.net',
      telefono: '+1 (809) 555-0101',
      nombre: 'Banco BHD León',
      ultimoMensaje: 'Hola',
      ultimoTimestamp: '2026-10-21T14:00:00.000Z',
      noLeidos: 0,
      avatar: 'BH',
      etiquetas: [],
    };
    whatsAppChatService.chats.value = [chat];
    whatsAppChatService.chatActivo.value = chat;

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const ok = await whatsAppChatService.actualizarEtiquetas(chat.jid, ['vip', 'negociacion']);
    expect(ok).toBe(true);
    expect(whatsAppChatService.chatActivo.value?.etiquetas).toEqual(['vip', 'negociacion']);
    expect(whatsAppChatService.chats.value[0].etiquetas).toEqual(['vip', 'negociacion']);
  });

  it('registra una nota interna privada del equipo sin enviarla al cliente', async () => {
    const chat = {
      jid: '18095550101@s.whatsapp.net',
      telefono: '+1 (809) 555-0101',
      nombre: 'Banco BHD León',
      ultimoMensaje: 'Hola',
      ultimoTimestamp: '2026-10-21T14:00:00.000Z',
      noLeidos: 0,
      avatar: 'BH',
    };
    whatsAppChatService.chatActivo.value = chat;

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        mensaje: {
          id: 'nota-123',
          deMi: true,
          emisor: 'Camila Morales',
          autor: 'Camila Morales',
          texto: 'Cliente solicita descuento del 10% adicional.',
          timestamp: '2026-10-21T14:20:00.000Z',
          estado: 'entregado',
          tipo: 'texto',
          esNotaInterna: true,
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const ok = await whatsAppChatService.guardarNotaInterna(
      chat.jid,
      'Cliente solicita descuento del 10% adicional.',
      'Camila Morales'
    );
    expect(ok).toBe(true);
    expect(whatsAppChatService.mensajes.value.length).toBe(1);
    expect(whatsAppChatService.mensajes.value[0].esNotaInterna).toBe(true);
    expect(whatsAppChatService.mensajes.value[0].autor).toBe('Camila Morales');
  });
});

