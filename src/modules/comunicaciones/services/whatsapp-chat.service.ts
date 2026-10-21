import { ref, computed } from 'vue';
import type { ChatWhatsApp, MensajeWhatsApp, RespuestaNuevoMensaje } from '../types/whatsapp-chat.types';
import { toastService } from '@/core/notifications/toast.service';

const API_BASE_URL = '/api/whatsapp';

class WhatsAppChatService {
  chats = ref<ChatWhatsApp[]>([]);
  chatActivo = ref<ChatWhatsApp | null>(null);
  mensajes = ref<MensajeWhatsApp[]>([]);
  cargandoChats = ref(false);
  cargandoMensajes = ref(false);
  enviando = ref(false);

  private sseConnection: EventSource | null = null;
  private pollerTimer: ReturnType<typeof setInterval> | null = null;

  totalNoLeidos = computed(() => {
    return this.chats.value.reduce((acc, c) => acc + (c.noLeidos || 0), 0);
  });

  async cargarChats(): Promise<void> {
    this.cargandoChats.value = true;
    try {
      const resp = await fetch(`${API_BASE_URL}/chats`);
      const data = await resp.json();
      if (data.ok && Array.isArray(data.chats)) {
        this.chats.value = data.chats;

        // Si ya hay un chat activo, sincronizar sus datos
        if (this.chatActivo.value) {
          const actualizado = this.chats.value.find((c) => c.jid === this.chatActivo.value?.jid);
          if (actualizado) {
            this.chatActivo.value = actualizado;
          }
        }
      }
    } catch {
      // Si la API falla momentáneamente, mantener datos existentes
    } finally {
      this.cargandoChats.value = false;
    }
  }

  async seleccionarChat(chat: ChatWhatsApp): Promise<void> {
    this.chatActivo.value = chat;
    this.cargandoMensajes.value = true;
    try {
      const resp = await fetch(`${API_BASE_URL}/chats/${encodeURIComponent(chat.jid)}/mensajes`);
      const data = await resp.json();
      if (data.ok && Array.isArray(data.mensajes)) {
        this.mensajes.value = data.mensajes;
      }

      // Si tiene mensajes no leídos, marcarlos como leídos
      if (chat.noLeidos > 0) {
        await this.marcarComoLeido(chat.jid);
      }
    } catch (err: unknown) {
      console.warn('Error cargando mensajes:', err);
    } finally {
      this.cargandoMensajes.value = false;
    }
  }

  async enviarMensaje(texto: string): Promise<boolean> {
    if (!this.chatActivo.value || !texto.trim()) return false;
    this.enviando.value = true;

    const jid = this.chatActivo.value.jid;

    try {
      const resp = await fetch(`${API_BASE_URL}/chats/${encodeURIComponent(jid)}/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: texto.trim() }),
      });
      const data: RespuestaNuevoMensaje = await resp.json();

      if (data.ok && data.mensaje) {
        // Asegurar que el mensaje esté en la vista si no vino por SSE
        if (!this.mensajes.value.some((m) => m.id === data.mensaje.id)) {
          this.mensajes.value.push(data.mensaje);
        }

        // Actualizar último mensaje del chat activo
        if (this.chatActivo.value.jid === jid) {
          this.chatActivo.value.ultimoMensaje = data.mensaje.texto;
          this.chatActivo.value.ultimoTimestamp = data.mensaje.timestamp;
        }

        return true;
      }
      throw new Error(data.error || 'No se pudo enviar el mensaje.');
    } catch (err: unknown) {
      toastService.error(err instanceof Error ? err.message : 'Error al enviar mensaje');
      return false;
    } finally {
      this.enviando.value = false;
    }
  }

  async marcarComoLeido(jid: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/chats/${encodeURIComponent(jid)}/marcar-leido`, {
        method: 'POST',
      });
      const chat = this.chats.value.find((c) => c.jid === jid);
      if (chat) {
        chat.noLeidos = 0;
      }
    } catch {
      // Ignorar error de marcado
    }
  }

  async iniciarNuevoChat(telefono: string, nombre?: string, contacto?: string): Promise<ChatWhatsApp | null> {
    try {
      const resp = await fetch(`${API_BASE_URL}/chats/nuevo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono, nombre, contacto }),
      });
      const data = await resp.json();
      if (data.ok && data.chat) {
        const existente = this.chats.value.find((c) => c.jid === data.chat.jid);
        if (!existente) {
          this.chats.value.unshift(data.chat);
        }
        await this.seleccionarChat(data.chat);
        toastService.exito(`Conversación iniciada con ${data.chat.nombre}`);
        return data.chat;
      }
      throw new Error(data.error || 'No se pudo crear la conversación');
    } catch (err: unknown) {
      toastService.error(err instanceof Error ? err.message : 'Error al iniciar chat');
      return null;
    }
  }

  conectarSSE(): void {
    if (this.sseConnection) return;

    try {
      this.sseConnection = new EventSource(`${API_BASE_URL}/eventos`);

      this.sseConnection.addEventListener('mensaje', (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { jid, mensaje, chat } = payload;

          // Si el mensaje es del chat activo, añadir a la lista
          if (this.chatActivo.value && this.chatActivo.value.jid === jid) {
            if (!this.mensajes.value.some((m) => m.id === mensaje.id)) {
              this.mensajes.value.push(mensaje);
            }
          }

          // Actualizar lista de chats
          const index = this.chats.value.findIndex((c) => c.jid === jid);
          if (index !== -1) {
            this.chats.value[index].ultimoMensaje = mensaje.texto;
            this.chats.value[index].ultimoTimestamp = mensaje.timestamp;
            if (!mensaje.deMi && (!this.chatActivo.value || this.chatActivo.value.jid !== jid)) {
              this.chats.value[index].noLeidos = (this.chats.value[index].noLeidos || 0) + 1;
            }
            // Mover arriba
            const [item] = this.chats.value.splice(index, 1);
            this.chats.value.unshift(item);
          } else if (chat) {
            this.chats.value.unshift(chat);
          }
        } catch (e) {
          console.error('Error parseando evento SSE WhatsApp:', e);
        }
      });

      this.sseConnection.addEventListener('chat_actualizado', (event) => {
        try {
          const chatActualizado: ChatWhatsApp = JSON.parse(event.data);
          const index = this.chats.value.findIndex((c) => c.jid === chatActualizado.jid);
          if (index !== -1) {
            this.chats.value[index] = { ...this.chats.value[index], ...chatActualizado };
          }
        } catch {}
      });

      this.sseConnection.onerror = () => {
        // En caso de caída de SSE, el poller toma el relevo
      };
    } catch {
      // Fallback a polling
    }

    // Polling complementario cada 10 segundos
    if (!this.pollerTimer) {
      this.pollerTimer = setInterval(() => {
        this.cargarChats();
        if (this.chatActivo.value) {
          this.refrescarMensajesChatActivo();
        }
      }, 10000);
    }
  }

  private async refrescarMensajesChatActivo(): Promise<void> {
    if (!this.chatActivo.value) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/chats/${encodeURIComponent(this.chatActivo.value.jid)}/mensajes`);
      const data = await resp.json();
      if (data.ok && Array.isArray(data.mensajes)) {
        if (data.mensajes.length !== this.mensajes.value.length) {
          this.mensajes.value = data.mensajes;
        }
      }
    } catch {}
  }

  desconectarSSE(): void {
    if (this.sseConnection) {
      this.sseConnection.close();
      this.sseConnection = null;
    }
    if (this.pollerTimer) {
      clearInterval(this.pollerTimer);
      this.pollerTimer = null;
    }
  }
}

export const whatsAppChatService = new WhatsAppChatService();
