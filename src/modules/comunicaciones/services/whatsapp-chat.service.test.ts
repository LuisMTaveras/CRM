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
});
