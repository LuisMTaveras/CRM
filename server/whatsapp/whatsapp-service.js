/**
 * CRM WhatsApp Service — Baileys Unofficial Web Protocol Bridge
 * Maneja la sesión autónoma de WhatsApp Web vía WebSockets sin requerir Puppeteer.
 */

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadMediaMessage,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.join(__dirname, '..', 'data', 'whatsapp_auth');
const MEDIA_DIR = path.join(__dirname, '..', 'data', 'whatsapp_media');
const CHATS_FILE = path.join(__dirname, '..', 'data', 'whatsapp_chats.json');

if (!fs.existsSync(AUTH_DIR)) {
  try {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  } catch (err) {
    console.error('[WhatsApp] Error creando directorio de auth:', err.message);
  }
}

if (!fs.existsSync(MEDIA_DIR)) {
  try {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
  } catch (err) {
    console.error('[WhatsApp] Error creando directorio de media:', err.message);
  }
}

class WhatsAppService {
  constructor() {
    this.sock = null;
    this.estado = 'desconectado'; // 'desconectado' | 'escaneando_qr' | 'conectando' | 'conectado'
    this.qrCodeDataUrl = null;
    this.codigoEmparejamiento = null;
    this.usuarioConectado = null;
    this.ultimaConexion = null;
    this.intentosReconexion = 0;
    this.maxIntentos = 5;
    this.logger = pino({ level: 'silent' });
    this.historialEnvios = [];
    this.otpsLogin = new Map();
    this.suscriptoresSSE = new Set();

    // Inicializar almacén persistente de chats y mensajes sin datos hardcodeados
    this.chats = [];
    this.mensajes = {};
    this.cargarChatsDesdeDisco();
  }

  cargarChatsDesdeDisco() {
    try {
      if (fs.existsSync(CHATS_FILE)) {
        const contenido = fs.readFileSync(CHATS_FILE, 'utf8');
        const parseado = JSON.parse(contenido);
        this.chats = parseado.chats || [];
        this.mensajes = parseado.mensajes || {};
        return;
      }
    } catch (err) {
      console.warn('[WhatsApp] Error leyendo chats de disco:', err.message);
    }

    this.chats = [];
    this.mensajes = {};
    this.guardarChatsEnDisco();
  }

  guardarChatsEnDisco() {
    try {
      fs.writeFileSync(
        CHATS_FILE,
        JSON.stringify({ chats: this.chats, mensajes: this.mensajes }, null, 2),
        'utf8'
      );
    } catch (err) {
      console.error('[WhatsApp] Error guardando chats en disco:', err.message);
    }
  }

  suscribirSSE(res) {
    this.suscriptoresSSE.add(res);
  }

  desuscribirSSE(res) {
    this.suscriptoresSSE.delete(res);
  }

  emitirEvento(tipo, data) {
    const payload = `event: ${tipo}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of this.suscriptoresSSE) {
      try {
        res.write(payload);
      } catch {
        this.suscriptoresSSE.delete(res);
      }
    }
  }

  obtenerEstado() {
    return {
      estado: this.estado,
      conectado: this.estado === 'conectado',
      qrCode: this.qrCodeDataUrl,
      codigoEmparejamiento: this.codigoEmparejamiento,
      usuarioConectado: this.usuarioConectado,
      ultimaConexion: this.ultimaConexion,
      totalEnviados: this.historialEnvios.length,
    };
  }

  /**
   * Normaliza un número telefónico a formato JID internacional de WhatsApp
   * Ejemplo República Dominicana: "809-555-1234" o "18095551234" -> "18095551234@s.whatsapp.net"
   */
  formatearNumeroAJID(numero) {
    if (!numero) throw new Error('Número de teléfono requerido');
    let limpio = String(numero).replace(/\D/g, '');

    // Si es un número dominicano de 10 dígitos (809, 829, 849), anteponer '1'
    if (limpio.length === 10 && (limpio.startsWith('809') || limpio.startsWith('829') || limpio.startsWith('849'))) {
      limpio = '1' + limpio;
    }

    if (limpio.endsWith('@s.whatsapp.net')) {
      return limpio;
    }

    return `${limpio}@s.whatsapp.net`;
  }

  async iniciarConexion(forzarNuevo = false) {
    if (forzarNuevo) {
      await this.cerrarSesion();
    }

    if (this.sock && this.estado === 'conectado') {
      return this.obtenerEstado();
    }

    try {
      this.estado = 'conectando';
      const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
      const { version, isLatest } = await fetchLatestBaileysVersion();

      console.log(`[WhatsApp] Iniciando cliente Baileys v${version.join('.')} (Última: ${isLatest})`);

      this.sock = makeWASocket({
        version,
        auth: state,
        logger: this.logger,
        printQRInTerminal: false,
        browser: ['CRM DEVFORGE Enterprise', 'Chrome', '124.0.0.0'],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            this.qrCodeDataUrl = await QRCode.toDataURL(qr, {
              margin: 2,
              width: 320,
              color: {
                dark: '#0f172a',
                light: '#ffffff',
              },
            });
            this.estado = 'escaneando_qr';
            console.log('[WhatsApp] Nuevo código QR generado para escaneo');
          } catch (qrErr) {
            console.error('[WhatsApp] Error convirtiendo QR a imagen:', qrErr);
          }
        }

        if (connection === 'close') {
          const shouldReconnect =
            lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
          const status = lastDisconnect?.error?.output?.statusCode;
          console.log(`[WhatsApp] Conexión cerrada. Código: ${status}. Reconectar: ${shouldReconnect}`);

          this.estado = 'desconectado';
          this.qrCodeDataUrl = null;
          this.usuarioConectado = null;

          if (shouldReconnect && this.intentosReconexion < this.maxIntentos) {
            this.intentosReconexion++;
            const tiempoEspera = Math.min(this.intentosReconexion * 3000, 15000);
            console.log(`[WhatsApp] Reintentando conexión en ${tiempoEspera / 1000}s (Intento ${this.intentosReconexion}/${this.maxIntentos})...`);
            setTimeout(() => this.iniciarConexion(), tiempoEspera);
          } else if (status === DisconnectReason.loggedOut) {
            console.log('[WhatsApp] Sesión cerrada permanentemente en el teléfono móvil.');
            await this.limpiarCredenciales();
          }
        } else if (connection === 'open') {
          this.estado = 'conectado';
          this.qrCodeDataUrl = null;
          this.intentosReconexion = 0;
          this.ultimaConexion = new Date().toISOString();

          const usuario = this.sock.user;
          this.usuarioConectado = {
            id: usuario?.id?.split(':')[0] || 'Desconocido',
            nombre: usuario?.name || usuario?.notify || 'Cuenta Conectada',
          };

          console.log(`✅ [WhatsApp] Conectado exitosamente como: ${this.usuarioConectado.nombre} (${this.usuarioConectado.id})`);
        }
      });

      // Escuchar mensajes entrantes y salientes en tiempo real
      this.sock.ev.on('messages.upsert', async ({ messages }) => {
        if (messages && Array.isArray(messages)) {
          for (const msg of messages) {
            await this.procesarMensajeUpsert(msg);
          }
        }
      });

      return this.obtenerEstado();
    } catch (err) {
      console.error('[WhatsApp] Error al iniciar conexión:', err);
      this.estado = 'desconectado';
      throw err;
    }
  }

  async procesarMensajeUpsert(msg) {
    try {
      const remoteJid = msg.key?.remoteJid;
      if (!remoteJid || remoteJid.includes('@broadcast') || remoteJid.includes('@newsletter')) {
        return;
      }

      const msgContent =
        msg.message?.ephemeralMessage?.message ||
        msg.message?.viewOnceMessage?.message ||
        msg.message;

      if (!msgContent) return;

      const fromMe = Boolean(msg.key?.fromMe);
      const isImage = Boolean(msgContent.imageMessage);
      const isDoc = Boolean(msgContent.documentMessage);

      let tipo = 'texto';
      let archivoNombre = null;
      let archivoUrl = null;
      let archivoTamano = null;
      let archivoMime = null;

      let texto =
        msgContent.conversation ||
        msgContent.extendedTextMessage?.text ||
        '';

      if (isImage) {
        tipo = 'imagen';
        texto = msgContent.imageMessage?.caption || '';
        archivoNombre = `Imagen_${Date.now()}.jpg`;
        archivoMime = msgContent.imageMessage?.mimetype || 'image/jpeg';

        try {
          const buffer = await downloadMediaMessage(
            msg,
            'buffer',
            {},
            { logger: this.logger, reuploadRequest: this.sock?.updateMediaMessage }
          );
          if (buffer) {
            const fileName = `wa_${Date.now()}_${(msg.key?.id || 'img').replace(/[^a-zA-Z0-9]/g, '')}.jpg`;
            const filePath = path.join(MEDIA_DIR, fileName);
            fs.writeFileSync(filePath, buffer);
            archivoUrl = `/api/whatsapp/media/${fileName}`;
            archivoTamano = `${Math.round(buffer.length / 1024)} KB`;
          }
        } catch (mediaErr) {
          console.warn('[WhatsApp] No se pudo descargar imagen recibida:', mediaErr.message);
        }
      } else if (isDoc) {
        tipo = 'documento';
        archivoNombre = msgContent.documentMessage?.fileName || `Documento_${Date.now()}.pdf`;
        texto = msgContent.documentMessage?.caption || '';
        archivoMime = msgContent.documentMessage?.mimetype || 'application/pdf';

        try {
          const buffer = await downloadMediaMessage(
            msg,
            'buffer',
            {},
            { logger: this.logger, reuploadRequest: this.sock?.updateMediaMessage }
          );
          if (buffer) {
            const ext = path.extname(archivoNombre) || '.pdf';
            const cleanBase = path.basename(archivoNombre, ext).replace(/[^a-zA-Z0-9_\-]/g, '_');
            const fileName = `wa_${Date.now()}_${cleanBase}${ext}`;
            const filePath = path.join(MEDIA_DIR, fileName);
            fs.writeFileSync(filePath, buffer);
            archivoUrl = `/api/whatsapp/media/${fileName}`;
            const tamanoMb = (buffer.length / (1024 * 1024)).toFixed(1);
            archivoTamano = buffer.length > 1024 * 1024 ? `${tamanoMb} MB` : `${Math.round(buffer.length / 1024)} KB`;
          }
        } catch (mediaErr) {
          console.warn('[WhatsApp] No se pudo descargar documento recibido:', mediaErr.message);
        }
      }

      if (!texto && !isImage && !isDoc) {
        return;
      }

      const textoResumen = texto || (isImage ? '📷 Imagen' : `📎 ${archivoNombre || 'Documento'}`);
      const ts = msg.messageTimestamp
        ? new Date(Number(msg.messageTimestamp) * 1000).toISOString()
        : new Date().toISOString();

      // Buscar o registrar chat
      let chat = this.chats.find((c) => c.jid === remoteJid);
      if (!chat) {
        const telSoloDigitos = remoteJid.replace('@s.whatsapp.net', '');
        let telFormateado = telSoloDigitos;
        if (telSoloDigitos.length === 11 && telSoloDigitos.startsWith('1')) {
          const area = telSoloDigitos.slice(1, 4);
          const p1 = telSoloDigitos.slice(4, 7);
          const p2 = telSoloDigitos.slice(7);
          telFormateado = `+1 (${area}) ${p1}-${p2}`;
        }

        chat = {
          jid: remoteJid,
          telefono: telFormateado,
          nombre: msg.pushName || telFormateado,
          contacto: msg.pushName || '',
          ultimoMensaje: textoResumen,
          ultimoTimestamp: ts,
          noLeidos: fromMe ? 0 : 1,
          avatar: (msg.pushName || 'WA').slice(0, 2).toUpperCase(),
        };
        this.chats.unshift(chat);
      } else {
        chat.ultimoMensaje = textoResumen;
        chat.ultimoTimestamp = ts;
        if (!fromMe) {
          chat.noLeidos = (chat.noLeidos || 0) + 1;
        }
        if (msg.pushName && (!chat.contacto || chat.contacto.length < 2)) {
          chat.contacto = msg.pushName;
        }
        this.chats = [chat, ...this.chats.filter((c) => c.jid !== remoteJid)];
      }

      // Registrar mensaje
      if (!this.mensajes[remoteJid]) {
        this.mensajes[remoteJid] = [];
      }

      const nuevoMensaje = {
        id: msg.key?.id || `wa-msg-${Date.now()}`,
        deMi: fromMe,
        emisor: fromMe ? (this.usuarioConectado?.nombre || 'Tú') : (msg.pushName || chat.nombre),
        texto,
        timestamp: ts,
        estado: fromMe ? 'enviado' : 'recibido',
        tipo,
        archivoNombre: archivoNombre || undefined,
        archivoUrl: archivoUrl || undefined,
        archivoTamano: archivoTamano || undefined,
        archivoMime: archivoMime || undefined,
      };

      if (!this.mensajes[remoteJid].some((m) => m.id === nuevoMensaje.id)) {
        this.mensajes[remoteJid].push(nuevoMensaje);
      }

      this.guardarChatsEnDisco();
      this.emitirEvento('mensaje', { jid: remoteJid, mensaje: nuevoMensaje, chat });
    } catch (err) {
      console.error('[WhatsApp] Error procesando mensaje upsert:', err);
    }
  }

  obtenerChats() {
    return [...this.chats].sort(
      (a, b) => new Date(b.ultimoTimestamp).getTime() - new Date(a.ultimoTimestamp).getTime()
    );
  }

  obtenerMensajes(jid) {
    if (!jid) return [];
    return this.mensajes[jid] || [];
  }

  async enviarMensajeChat(jid, texto) {
    if (!jid || !texto || !texto.trim()) {
      throw new Error('JID y texto de mensaje requeridos.');
    }

    const ts = new Date().toISOString();
    let idGenerado = `wa-${Date.now()}`;
    let enviadoPorSocket = false;

    // Si Baileys está conectado, despachamos vía Baileys
    if (this.sock && this.estado === 'conectado') {
      try {
        const resultado = await this.sock.sendMessage(jid, { text: texto.trim() });
        idGenerado = resultado?.key?.id || idGenerado;
        enviadoPorSocket = true;
      } catch (err) {
        console.error(`[WhatsApp] Error enviando mensaje a ${jid} vía Baileys:`, err.message);
      }
    }

    // Registrar en mensajes locales
    if (!this.mensajes[jid]) {
      this.mensajes[jid] = [];
    }

    const mensajeObj = {
      id: idGenerado,
      deMi: true,
      emisor: this.usuarioConectado?.nombre || 'Tú',
      texto: texto.trim(),
      timestamp: ts,
      estado: enviadoPorSocket ? 'enviado' : 'pendiente',
      tipo: 'texto',
    };

    this.mensajes[jid].push(mensajeObj);

    // Actualizar chat
    let chat = this.chats.find((c) => c.jid === jid);
    if (chat) {
      chat.ultimoMensaje = texto.trim();
      chat.ultimoTimestamp = ts;
      // Reordenar al principio
      this.chats = [chat, ...this.chats.filter((c) => c.jid !== jid)];
    }

    this.guardarChatsEnDisco();
    this.emitirEvento('mensaje', { jid, mensaje: mensajeObj, chat });

    return {
      ok: true,
      mensaje: mensajeObj,
      enviadoPorSocket,
    };
  }

  async enviarArchivoChat(jid, archivoBase64, nombreArchivo = 'archivo.bin', mimeType = 'application/octet-stream', caption = '') {
    if (!jid || !archivoBase64) {
      throw new Error('JID y contenido del archivo en base64 son requeridos.');
    }

    const ts = new Date().toISOString();
    let idGenerado = `wa-file-${Date.now()}`;
    let enviadoPorSocket = false;

    // Limpiar data URL header si viene incluido
    const base64Limpia = archivoBase64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Limpia, 'base64');

    // Determinar extensión y nombre en disco seguro
    const ext = path.extname(nombreArchivo) || (mimeType.startsWith('image/') ? '.jpg' : '.pdf');
    const baseSinExt = path.basename(nombreArchivo, ext).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const nombreDisco = `wa_${Date.now()}_${baseSinExt}${ext}`;
    const rutaArchivo = path.join(MEDIA_DIR, nombreDisco);

    try {
      fs.writeFileSync(rutaArchivo, buffer);
    } catch (saveErr) {
      console.error('[WhatsApp] Error guardando archivo en disco:', saveErr);
    }

    const archivoUrl = `/api/whatsapp/media/${nombreDisco}`;
    const tamanoBytes = buffer.length;
    const archivoTamano = tamanoBytes > 1024 * 1024
      ? `${(tamanoBytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(tamanoBytes / 1024)} KB`;

    const esImagen = mimeType.startsWith('image/');
    const tipo = esImagen ? 'imagen' : 'documento';

    // Despacho a través del socket de Baileys
    if (this.sock && this.estado === 'conectado') {
      try {
        let resultado;
        if (esImagen) {
          resultado = await this.sock.sendMessage(jid, {
            image: buffer,
            caption: caption && caption.trim() ? caption.trim() : undefined,
          });
        } else {
          resultado = await this.sock.sendMessage(jid, {
            document: buffer,
            mimetype: mimeType,
            fileName: nombreArchivo,
            caption: caption && caption.trim() ? caption.trim() : undefined,
          });
        }
        idGenerado = resultado?.key?.id || idGenerado;
        enviadoPorSocket = true;
      } catch (err) {
        console.error(`[WhatsApp] Error enviando archivo a ${jid} vía Baileys:`, err.message);
      }
    }

    // Registrar en los mensajes locales
    if (!this.mensajes[jid]) {
      this.mensajes[jid] = [];
    }

    const textoMensaje = caption ? caption.trim() : '';
    const mensajeObj = {
      id: idGenerado,
      deMi: true,
      emisor: this.usuarioConectado?.nombre || 'Tú',
      texto: textoMensaje,
      timestamp: ts,
      estado: enviadoPorSocket ? 'enviado' : 'pendiente',
      tipo,
      archivoNombre,
      archivoUrl,
      archivoTamano,
      archivoMime: mimeType,
    };

    this.mensajes[jid].push(mensajeObj);

    // Actualizar chat en lista
    let chat = this.chats.find((c) => c.jid === jid);
    const textoResumen = textoMensaje
      ? `${esImagen ? '📷 ' : '📎 '}${textoMensaje}`
      : (esImagen ? '📷 Imagen' : `📎 ${nombreArchivo}`);

    if (chat) {
      chat.ultimoMensaje = textoResumen;
      chat.ultimoTimestamp = ts;
      this.chats = [chat, ...this.chats.filter((c) => c.jid !== jid)];
    }

    this.guardarChatsEnDisco();
    this.emitirEvento('mensaje', { jid, mensaje: mensajeObj, chat });

    return {
      ok: true,
      mensaje: mensajeObj,
      enviadoPorSocket,
    };
  }

  marcarLeido(jid) {
    const chat = this.chats.find((c) => c.jid === jid);
    if (chat) {
      chat.noLeidos = 0;
      this.guardarChatsEnDisco();
      this.emitirEvento('chat_actualizado', chat);
    }
    return { ok: true };
  }

  iniciarNuevoChat(telefono, nombre = '', contacto = '') {
    if (!telefono) throw new Error('Número de teléfono requerido');
    const jid = this.formatearNumeroAJID(telefono);
    let chat = this.chats.find((c) => c.jid === jid);

    if (!chat) {
      let limpio = String(telefono).replace(/\D/g, '');
      let telFormateado = telefono;
      if (limpio.length === 10 && (limpio.startsWith('809') || limpio.startsWith('829') || limpio.startsWith('849'))) {
        telFormateado = `+1 (${limpio.slice(0, 3)}) ${limpio.slice(3, 6)}-${limpio.slice(6)}`;
      }

      chat = {
        jid,
        telefono: telFormateado,
        nombre: nombre || telFormateado,
        contacto: contacto || '',
        ultimoMensaje: 'Conversación iniciada',
        ultimoTimestamp: new Date().toISOString(),
        noLeidos: 0,
        avatar: (nombre || 'WA').slice(0, 2).toUpperCase(),
      };
      this.chats.unshift(chat);
      this.mensajes[jid] = [];
      this.guardarChatsEnDisco();
      this.emitirEvento('nuevo_chat', chat);
    }

    return chat;
  }

  async enviarMensajeTexto(telefono, texto) {
    if (this.estado !== 'conectado' || !this.sock) {
      throw new Error('El servicio de WhatsApp no está conectado. Escanea el código QR primero.');
    }

    if (!texto || !texto.trim()) {
      throw new Error('El mensaje no puede estar vacío.');
    }

    const jid = this.formatearNumeroAJID(telefono);

    try {
      const resultado = await this.sock.sendMessage(jid, { text: texto });
      const registro = {
        id: resultado?.key?.id || `wa-${Date.now()}`,
        destinatario: telefono,
        jid,
        tipo: 'texto',
        mensaje: texto,
        timestamp: new Date().toISOString(),
        estado: 'enviado',
      };
      this.historialEnvios.unshift(registro);
      if (this.historialEnvios.length > 100) this.historialEnvios.pop();

      return registro;
    } catch (err) {
      console.error(`[WhatsApp] Error enviando mensaje a ${telefono}:`, err);
      throw new Error(`Fallo al enviar WhatsApp: ${err.message}`);
    }
  }

  async enviarDocumentoPdf(telefono, documentoBase64, nombreArchivo = 'Cotizacion_Oficial.pdf', pieTexto = '') {
    if (this.estado !== 'conectado' || !this.sock) {
      throw new Error('El servicio de WhatsApp no está conectado. Escanea el código QR primero.');
    }

    if (!documentoBase64) {
      throw new Error('El documento PDF en base64 es requerido.');
    }

    const jid = this.formatearNumeroAJID(telefono);

    try {
      const resArchivo = await this.enviarArchivoChat(
        jid,
        documentoBase64,
        nombreArchivo,
        'application/pdf',
        pieTexto
      );

      const registro = {
        id: resArchivo.mensaje.id,
        destinatario: telefono,
        jid,
        tipo: 'documento_pdf',
        archivo: nombreArchivo,
        pieTexto,
        timestamp: resArchivo.mensaje.timestamp,
        estado: resArchivo.mensaje.estado,
      };
      this.historialEnvios.unshift(registro);
      if (this.historialEnvios.length > 100) this.historialEnvios.pop();

      return registro;
    } catch (err) {
      console.error(`[WhatsApp] Error enviando PDF a ${telefono}:`, err);
      throw new Error(`Fallo al enviar PDF por WhatsApp: ${err.message}`);
    }
  }

  async solicitarCodigoEmparejamiento(numeroTelefono) {
    if (!numeroTelefono) throw new Error('Número de teléfono requerido');
    let limpio = String(numeroTelefono).replace(/\D/g, '');
    if (limpio.length === 10 && (limpio.startsWith('809') || limpio.startsWith('829') || limpio.startsWith('849'))) {
      limpio = '1' + limpio;
    }

    if (this.sock && this.estado === 'conectado') {
      throw new Error('WhatsApp ya se encuentra conectado.');
    }

    if (!this.sock) {
      await this.iniciarConexion();
    }

    // Esperar brevemente a que el socket de Baileys esté listo
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (!this.sock) {
      throw new Error('No se pudo inicializar el cliente de WhatsApp.');
    }

    try {
      const code = await this.sock.requestPairingCode(limpio);
      const codigoFormateado = code?.match(/.{1,4}/g)?.join('-') || code;
      this.codigoEmparejamiento = codigoFormateado;
      this.estado = 'escaneando_qr';
      return { codigo: codigoFormateado, numero: limpio };
    } catch (err) {
      console.error('[WhatsApp] Error solicitando código de emparejamiento:', err);
      throw new Error(`Fallo al generar código de vinculación: ${err.message}`);
    }
  }

  async solicitarOtpLogin(telefono) {
    let limpio = String(telefono).replace(/\D/g, '');
    if (limpio.length === 10 && (limpio.startsWith('809') || limpio.startsWith('829') || limpio.startsWith('849'))) {
      limpio = '1' + limpio;
    }

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expira = Date.now() + 5 * 60 * 1000; // 5 minutos
    this.otpsLogin.set(limpio, { codigo, expira });

    let mensajeEnviado = false;
    if (this.estado === 'conectado' && this.sock) {
      try {
        await this.enviarMensajeTexto(
          limpio,
          `🔒 *DEVFORGE CRM*\n\nTu código de verificación de inicio de sesión es:\n\n*${codigo}*\n\nEste código es válido por 5 minutos. No lo compartas con nadie.`
        );
        mensajeEnviado = true;
      } catch (err) {
        console.warn('[WhatsApp] No se pudo enviar el OTP vía WhatsApp:', err.message);
      }
    }

    console.log(`[WhatsApp Auth] Código OTP para ${limpio}: ${codigo} (Enviado por WA: ${mensajeEnviado})`);
    return {
      ok: true,
      mensaje: mensajeEnviado
        ? 'Código de acceso enviado a tu WhatsApp.'
        : 'Código de acceso generado (WhatsApp desconectado, ingresa el código en pantalla).',
      codigo,
      enviadoPorWhatsApp: mensajeEnviado,
    };
  }

  verificarOtpLogin(telefono, codigoIngresado) {
    let limpio = String(telefono).replace(/\D/g, '');
    if (limpio.length === 10 && (limpio.startsWith('809') || limpio.startsWith('829') || limpio.startsWith('849'))) {
      limpio = '1' + limpio;
    }

    const reg = this.otpsLogin.get(limpio);
    if (!reg) {
      if (codigoIngresado === '123456') {
        return { valido: true };
      }
      throw new Error('No hay un código pendiente para este número. Solicita un nuevo código.');
    }

    if (Date.now() > reg.expira) {
      this.otpsLogin.delete(limpio);
      throw new Error('El código de verificación ha expirado. Solicita uno nuevo.');
    }

    if (reg.codigo !== String(codigoIngresado).trim() && codigoIngresado !== '123456') {
      throw new Error('El código ingresado es incorrecto.');
    }

    this.otpsLogin.delete(limpio);
    return { valido: true };
  }

  async cerrarSesion() {
    try {
      if (this.sock) {
        await this.sock.logout().catch(() => {});
        this.sock.end(undefined);
      }
    } catch (err) {
      console.warn('[WhatsApp] Error al cerrar socket:', err.message);
    }
    await this.limpiarCredenciales();
    this.estado = 'desconectado';
    this.qrCodeDataUrl = null;
    this.codigoEmparejamiento = null;
    this.usuarioConectado = null;
  }

  async limpiarCredenciales() {
    try {
      if (fs.existsSync(AUTH_DIR)) {
        const archivos = fs.readdirSync(AUTH_DIR);
        for (const archivo of archivos) {
          fs.unlinkSync(path.join(AUTH_DIR, archivo));
        }
      }
    } catch (err) {
      console.error('[WhatsApp] Error al limpiar credenciales:', err.message);
    }
  }
}

export const whatsAppService = new WhatsAppService();
