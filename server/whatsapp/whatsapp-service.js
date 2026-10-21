/**
 * CRM WhatsApp Service — Baileys Unofficial Web Protocol Bridge
 * Maneja la sesión autónoma de WhatsApp Web vía WebSockets sin requerir Puppeteer.
 */

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.join(__dirname, '..', 'data', 'whatsapp_auth');

if (!fs.existsSync(AUTH_DIR)) {
  try {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  } catch (err) {
    console.error('[WhatsApp] Error creando directorio de auth:', err.message);
  }
}

class WhatsAppService {
  constructor() {
    this.sock = null;
    this.estado = 'desconectado'; // 'desconectado' | 'escaneando_qr' | 'conectando' | 'conectado'
    this.qrCodeDataUrl = null;
    this.usuarioConectado = null;
    this.ultimaConexion = null;
    this.intentosReconexion = 0;
    this.maxIntentos = 5;
    this.logger = pino({ level: 'silent' });
    this.historialEnvios = [];
  }

  obtenerEstado() {
    return {
      estado: this.estado,
      conectado: this.estado === 'conectado',
      qrCode: this.qrCodeDataUrl,
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

      return this.obtenerEstado();
    } catch (err) {
      console.error('[WhatsApp] Error al iniciar conexión:', err);
      this.estado = 'desconectado';
      throw err;
    }
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
    const base64Limpia = documentoBase64.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(base64Limpia, 'base64');

    try {
      const resultado = await this.sock.sendMessage(jid, {
        document: buffer,
        fileName: nombreArchivo,
        mimetype: 'application/pdf',
        caption: pieTexto || undefined,
      });

      const registro = {
        id: resultado?.key?.id || `wa-${Date.now()}`,
        destinatario: telefono,
        jid,
        tipo: 'documento_pdf',
        archivo: nombreArchivo,
        pieTexto,
        timestamp: new Date().toISOString(),
        estado: 'enviado',
      };
      this.historialEnvios.unshift(registro);
      if (this.historialEnvios.length > 100) this.historialEnvios.pop();

      return registro;
    } catch (err) {
      console.error(`[WhatsApp] Error enviando PDF a ${telefono}:`, err);
      throw new Error(`Fallo al enviar PDF por WhatsApp: ${err.message}`);
    }
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
