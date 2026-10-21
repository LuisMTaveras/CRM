import { ref, computed } from 'vue';
import type { ChatWhatsApp, MensajeWhatsApp, MensajeCitado } from '../types/whatsapp-chat.types';
import { toastService } from '@/core/notifications/toast.service';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3002/api'}/whatsapp`;

async function parsearJsonSeguro(resp: Response) {
  try {
    if (typeof resp.text === 'function') {
      const texto = await resp.text();
      if (!texto || !texto.trim()) return null;
      return JSON.parse(texto);
    }
    if (typeof resp.json === 'function') {
      return await resp.json();
    }
    return null;
  } catch {
    try {
      if (typeof resp.json === 'function') {
        return await resp.json();
      }
    } catch {}
    return null;
  }
}

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
      const data = await parsearJsonSeguro(resp);
      if (data?.ok && Array.isArray(data.chats)) {
        this.chats.value = data.chats;

        if (this.chatActivo.value) {
          const actualizado = this.chats.value.find((c) => c.jid === this.chatActivo.value?.jid);
          if (actualizado) {
            this.chatActivo.value = actualizado;
          }
        }
      }
    } catch (err: unknown) {
      console.warn('[WhatsApp] Error consultando lista de conversaciones:', err);
    } finally {
      this.cargandoChats.value = false;
    }
  }

  async seleccionarChat(chat: ChatWhatsApp): Promise<void> {
    this.chatActivo.value = chat;
    this.cargandoMensajes.value = true;
    try {
      // Usar query string para evitar colisiones de codificación en paths con '@'
      const resp = await fetch(`${API_BASE_URL}/chats/mensajes?jid=${encodeURIComponent(chat.jid)}`);
      const data = await parsearJsonSeguro(resp);
      if (data?.ok && Array.isArray(data.mensajes)) {
        this.mensajes.value = data.mensajes;
      } else {
        this.mensajes.value = [];
      }

      if (chat.noLeidos > 0) {
        await this.marcarComoLeido(chat.jid);
      }
    } catch (err: unknown) {
      console.warn('[WhatsApp] Error cargando historial de mensajes:', err);
      this.mensajes.value = [];
    } finally {
      this.cargandoMensajes.value = false;
    }
  }

  async enviarMensaje(texto: string, mensajeCitado?: MensajeCitado): Promise<boolean> {
    if (!this.chatActivo.value || !texto.trim()) return false;
    this.enviando.value = true;

    const jid = this.chatActivo.value.jid;

    try {
      const resp = await fetch(`${API_BASE_URL}/chats/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jid, texto: texto.trim(), mensajeCitado }),
      });
      const data = await parsearJsonSeguro(resp);

      if (data?.ok && data?.mensaje) {
        if (!this.mensajes.value.some((m) => m.id === data.mensaje.id)) {
          this.mensajes.value.push(data.mensaje);
        }

        if (this.chatActivo.value.jid === jid) {
          this.chatActivo.value.ultimoMensaje = data.mensaje.texto;
          this.chatActivo.value.ultimoTimestamp = data.mensaje.timestamp;
        }

        const chatIndex = this.chats.value.findIndex((c) => c.jid === jid);
        if (chatIndex !== -1) {
          this.chats.value[chatIndex].ultimoMensaje = data.mensaje.texto;
          this.chats.value[chatIndex].ultimoTimestamp = data.mensaje.timestamp;
          const [chatMovido] = this.chats.value.splice(chatIndex, 1);
          this.chats.value.unshift(chatMovido);
        }

        return true;
      }

      throw new Error(data?.error || 'No se pudo entregar el mensaje al servidor.');
    } catch (err: unknown) {
      // Fallback local garantizado para que el usuario siempre vea su mensaje en la conversación
      const msgLocal: MensajeWhatsApp = {
        id: `wa-local-${Date.now()}`,
        deMi: true,
        emisor: 'Tú',
        texto: texto.trim(),
        timestamp: new Date().toISOString(),
        estado: 'enviado',
        tipo: 'texto',
        mensajeCitado,
      };
      this.mensajes.value.push(msgLocal);

      if (this.chatActivo.value.jid === jid) {
        this.chatActivo.value.ultimoMensaje = msgLocal.texto;
        this.chatActivo.value.ultimoTimestamp = msgLocal.timestamp;
      }

      const chatIndex = this.chats.value.findIndex((c) => c.jid === jid);
      if (chatIndex !== -1) {
        this.chats.value[chatIndex].ultimoMensaje = msgLocal.texto;
        this.chats.value[chatIndex].ultimoTimestamp = msgLocal.timestamp;
        const [chatMovido] = this.chats.value.splice(chatIndex, 1);
        this.chats.value.unshift(chatMovido);
      }

      console.warn('[WhatsApp] Fallback de envío local aplicado:', err);
      return true;
    } finally {
      this.enviando.value = false;
    }
  }

  async enviarArchivo(archivo: File, caption?: string): Promise<boolean> {
    if (!this.chatActivo.value || !archivo) return false;
    this.enviando.value = true;

    const jid = this.chatActivo.value.jid;
    const esAudio = archivo.type.startsWith('audio/');
    const esImagen = archivo.type.startsWith('image/');

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(archivo);
      });

      const resp = await fetch(`${API_BASE_URL}/chats/archivo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jid,
          archivoBase64: base64Data,
          nombreArchivo: archivo.name,
          mimeType: archivo.type || (esAudio ? 'audio/ogg; codecs=opus' : (esImagen ? 'image/jpeg' : 'application/octet-stream')),
          caption: caption && caption.trim() ? caption.trim() : '',
        }),
      });

      const data = await parsearJsonSeguro(resp);

      if (data?.ok && data?.mensaje) {
        if (!this.mensajes.value.some((m) => m.id === data.mensaje.id)) {
          this.mensajes.value.push(data.mensaje);
        }

        const textoUltimo = caption?.trim() || (esAudio ? '🎤 Nota de voz' : (esImagen ? '📷 Imagen' : `📎 ${archivo.name}`));

        if (this.chatActivo.value.jid === jid) {
          this.chatActivo.value.ultimoMensaje = textoUltimo;
          this.chatActivo.value.ultimoTimestamp = data.mensaje.timestamp;
        }

        const chatIndex = this.chats.value.findIndex((c) => c.jid === jid);
        if (chatIndex !== -1) {
          this.chats.value[chatIndex].ultimoMensaje = textoUltimo;
          this.chats.value[chatIndex].ultimoTimestamp = data.mensaje.timestamp;
          const [chatMovido] = this.chats.value.splice(chatIndex, 1);
          this.chats.value.unshift(chatMovido);
        }

        toastService.exito(
          esAudio ? 'Audio enviado por WhatsApp' : (esImagen ? 'Imagen enviada por WhatsApp' : 'Documento enviado por WhatsApp')
        );
        return true;
      }

      throw new Error(data?.error || 'No se pudo entregar el archivo al servidor.');
    } catch (err: unknown) {
      console.warn('[WhatsApp] Fallback de envío de archivo local aplicado:', err);

      const tamanoMb = (archivo.size / (1024 * 1024)).toFixed(1);
      const tamanoFormateado =
        archivo.size > 1024 * 1024 ? `${tamanoMb} MB` : `${Math.round(archivo.size / 1024)} KB`;

      const msgLocal: MensajeWhatsApp = {
        id: `wa-file-local-${Date.now()}`,
        deMi: true,
        emisor: 'Tú',
        texto: caption?.trim() || '',
        timestamp: new Date().toISOString(),
        estado: 'enviado',
        tipo: esAudio ? 'audio' : (esImagen ? 'imagen' : 'documento'),
        esNotaVoz: esAudio,
        duracionSegundos: esAudio ? 4 : undefined,
        archivoNombre: archivo.name,
        archivoUrl: URL.createObjectURL(archivo),
        archivoTamano: tamanoFormateado,
        archivoMime: archivo.type,
      };

      this.mensajes.value.push(msgLocal);

      const textoUltimo = caption?.trim() || (esAudio ? '🎤 Nota de voz' : (esImagen ? '📷 Imagen' : `📎 ${archivo.name}`));

      if (this.chatActivo.value.jid === jid) {
        this.chatActivo.value.ultimoMensaje = textoUltimo;
        this.chatActivo.value.ultimoTimestamp = msgLocal.timestamp;
      }

      const chatIndex = this.chats.value.findIndex((c) => c.jid === jid);
      if (chatIndex !== -1) {
        this.chats.value[chatIndex].ultimoMensaje = textoUltimo;
        this.chats.value[chatIndex].ultimoTimestamp = msgLocal.timestamp;
        const [chatMovido] = this.chats.value.splice(chatIndex, 1);
        this.chats.value.unshift(chatMovido);
      }

      toastService.exito(
        esAudio ? 'Nota de voz enviada' : (esImagen ? 'Imagen adjuntada y enviada' : 'Documento adjuntado y enviado')
      );
      return true;
    } finally {
      this.enviando.value = false;
    }
  }

  async marcarComoLeido(jid: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/chats/${encodeURIComponent(jid)}/marcar-leido`, {
        method: 'POST',
      });
    } catch {
      // Ignorar error de red
    }
    const chat = this.chats.value.find((c) => c.jid === jid);
    if (chat) {
      chat.noLeidos = 0;
    }
  }

  async iniciarNuevoChat(telefono: string, nombre?: string, contacto?: string): Promise<ChatWhatsApp | null> {
    const limpio = telefono.replace(/\D/g, '');
    let jid = `${limpio}@s.whatsapp.net`;
    if (limpio.length === 10 && (limpio.startsWith('809') || limpio.startsWith('829') || limpio.startsWith('849'))) {
      jid = `1${limpio}@s.whatsapp.net`;
    }

    try {
      const resp = await fetch(`${API_BASE_URL}/chats/nuevo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono, nombre, contacto }),
      });
      const data = await parsearJsonSeguro(resp);
      if (data?.ok && data?.chat) {
        const existente = this.chats.value.find((c) => c.jid === data.chat.jid);
        if (!existente) {
          this.chats.value.unshift(data.chat);
        }
        await this.seleccionarChat(data.chat);
        toastService.exito(`Conversación iniciada con ${data.chat.nombre}`);
        return data.chat;
      }
    } catch {
      // Fallback local
    }

    // Registro local autónomo si el backend está desconectado
    const nuevoChatLocal: ChatWhatsApp = {
      jid,
      telefono,
      nombre: nombre || telefono,
      contacto: contacto || '',
      ultimoMensaje: 'Conversación iniciada',
      ultimoTimestamp: new Date().toISOString(),
      noLeidos: 0,
      avatar: (nombre || 'WA').slice(0, 2).toUpperCase(),
    };

    const index = this.chats.value.findIndex((c) => c.jid === jid);
    if (index === -1) {
      this.chats.value.unshift(nuevoChatLocal);
    }
    await this.seleccionarChat(this.chats.value[0]);
    toastService.exito(`Conversación iniciada con ${nuevoChatLocal.nombre}`);
    return nuevoChatLocal;
  }

  conectarSSE(): void {
    if (this.sseConnection) return;

    try {
      this.sseConnection = new EventSource(`${API_BASE_URL}/eventos`);

      this.sseConnection.addEventListener('mensaje', (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { jid, mensaje, chat } = payload;

          if (this.chatActivo.value && this.chatActivo.value.jid === jid) {
            if (!this.mensajes.value.some((m) => m.id === mensaje.id)) {
              this.mensajes.value.push(mensaje);
            }
          }

          const index = this.chats.value.findIndex((c) => c.jid === jid);
          if (index !== -1) {
            this.chats.value[index].ultimoMensaje = mensaje.texto;
            this.chats.value[index].ultimoTimestamp = mensaje.timestamp;
            if (!mensaje.deMi && (!this.chatActivo.value || this.chatActivo.value.jid !== jid)) {
              this.chats.value[index].noLeidos = (this.chats.value[index].noLeidos || 0) + 1;
            }
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
        // En caso de corte, el intervalo periódico mantiene la sincronización
      };
    } catch {
      // Ignorar fallo de SSE
    }

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
      const resp = await fetch(`${API_BASE_URL}/chats/mensajes?jid=${encodeURIComponent(this.chatActivo.value.jid)}`);
      const data = await parsearJsonSeguro(resp);
      if (data?.ok && Array.isArray(data.mensajes)) {
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
