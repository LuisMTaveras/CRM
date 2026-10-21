import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { whatsAppService } from './whatsapp-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MEDIA_DIR = path.join(__dirname, '..', 'data', 'whatsapp_media');

if (!fs.existsSync(MEDIA_DIR)) {
  try {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
  } catch {}
}

const router = express.Router();

// Ruta para servir archivos multimedia (imágenes, documentos, audios)
router.get('/media/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const safeName = path.basename(filename);
    const filePath = path.join(MEDIA_DIR, safeName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ ok: false, error: 'Archivo multimedia no encontrado' });
    }

    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.sendFile(filePath);
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// 1. Obtener estado actual y código QR si está pendiente
router.get('/estado', (req, res) => {
  try {
    const estado = whatsAppService.obtenerEstado();
    res.json({ ok: true, ...estado });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 2. Iniciar conexión o generar nuevo código QR
router.post('/conectar', async (req, res) => {
  try {
    const { forzarNuevo } = req.body || {};
    const estado = await whatsAppService.iniciarConexion(Boolean(forzarNuevo));
    res.json({ ok: true, mensaje: 'Conexión iniciada.', ...estado });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 3. Desconectar sesión y cerrar sesión en WhatsApp
router.post('/desconectar', async (req, res) => {
  try {
    await whatsAppService.cerrarSesion();
    res.json({ ok: true, mensaje: 'Sesión de WhatsApp desconectada correctamente.' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 4. Enviar mensaje de texto individual
router.post('/enviar-mensaje', async (req, res) => {
  const { telefono, mensaje } = req.body || {};

  if (!telefono || !mensaje) {
    return res.status(400).json({
      ok: false,
      error: 'Parámetros requeridos: telefono y mensaje.',
    });
  }

  try {
    const resultado = await whatsAppService.enviarMensajeTexto(telefono, mensaje);
    res.json({
      ok: true,
      mensaje: 'Mensaje de WhatsApp enviado exitosamente.',
      resultado,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 5. Enviar documento PDF (Cotización comercial oficial) con pie opcional
router.post('/enviar-documento', async (req, res) => {
  const { telefono, documentoBase64, nombreArchivo, pieTexto } = req.body || {};

  if (!telefono || !documentoBase64) {
    return res.status(400).json({
      ok: false,
      error: 'Parámetros requeridos: telefono y documentoBase64.',
    });
  }

  try {
    const resultado = await whatsAppService.enviarDocumentoPdf(
      telefono,
      documentoBase64,
      nombreArchivo || 'Cotizacion_Comercial.pdf',
      pieTexto || ''
    );
    res.json({
      ok: true,
      mensaje: 'Documento PDF enviado exitosamente vía WhatsApp.',
      resultado,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 6. Solicitar código de emparejamiento de 8 dígitos (Pairing Code sin QR)
router.post('/pairing-code', async (req, res) => {
  const { telefono } = req.body || {};
  if (!telefono) {
    return res.status(400).json({ ok: false, error: 'Número de teléfono requerido.' });
  }

  try {
    const resCodigo = await whatsAppService.solicitarCodigoEmparejamiento(telefono);
    res.json({ ok: true, ...resCodigo });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 7. Solicitar código OTP para inicio de sesión en CRM
router.post('/auth/solicitar-otp', async (req, res) => {
  const { telefono } = req.body || {};
  if (!telefono) {
    return res.status(400).json({ ok: false, error: 'Número de teléfono requerido.' });
  }

  try {
    const resultado = await whatsAppService.solicitarOtpLogin(telefono);
    res.json({ ok: true, ...resultado });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 8. Verificar código OTP para inicio de sesión en CRM
router.post('/auth/verificar-otp', (req, res) => {
  const { telefono, codigo } = req.body || {};
  if (!telefono || !codigo) {
    return res.status(400).json({ ok: false, error: 'Teléfono y código son requeridos.' });
  }

  try {
    const resultado = whatsAppService.verificarOtpLogin(telefono, codigo);
    res.json({ ok: true, ...resultado });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 9. Historial de envíos de la sesión
router.get('/historial', (req, res) => {
  res.json({
    ok: true,
    historial: whatsAppService.historialEnvios,
  });
});

// 10. Listar todas las conversaciones activas (Chats WhatsApp)
router.get('/chats', (_req, res) => {
  try {
    whatsAppService.sincronizarFotosPerfil().catch(() => {});
    const chats = whatsAppService.obtenerChats();
    res.json({ ok: true, chats });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 11. Obtener mensajes (soporta jid en query o en path)
router.get('/chats/mensajes', (req, res) => {
  try {
    const jid = req.query.jid;
    if (!jid) {
      return res.status(400).json({ ok: false, error: 'Parámetro query jid requerido.' });
    }
    const mensajes = whatsAppService.obtenerMensajes(String(jid));
    res.json({ ok: true, mensajes });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/chats/mensajes', async (req, res) => {
  try {
    const { jid, texto, mensajeCitado } = req.body || {};
    if (!jid || !texto || !texto.trim()) {
      return res.status(400).json({ ok: false, error: 'JID y texto son requeridos.' });
    }
    const resultado = await whatsAppService.enviarMensajeChat(String(jid), texto, mensajeCitado);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/chats/:jid/mensajes', (req, res) => {
  try {
    const { jid } = req.params;
    const mensajes = whatsAppService.obtenerMensajes(decodeURIComponent(jid));
    res.json({ ok: true, mensajes });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 12. Enviar mensaje dentro de un chat
router.post('/chats/:jid/mensajes', async (req, res) => {
  try {
    const { jid } = req.params;
    const { texto, mensajeCitado } = req.body || {};
    if (!texto || !texto.trim()) {
      return res.status(400).json({ ok: false, error: 'El texto del mensaje es requerido.' });
    }

    const resultado = await whatsAppService.enviarMensajeChat(decodeURIComponent(jid), texto, mensajeCitado);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 12b. Enviar archivo (PDF, documento, imagen) dentro de un chat
router.post('/chats/archivo', async (req, res) => {
  try {
    const { jid, archivoBase64, nombreArchivo, mimeType, caption } = req.body || {};
    if (!jid || !archivoBase64) {
      return res.status(400).json({ ok: false, error: 'JID y archivoBase64 son requeridos.' });
    }

    const resultado = await whatsAppService.enviarArchivoChat(
      String(jid),
      archivoBase64,
      nombreArchivo || 'archivo.bin',
      mimeType || 'application/octet-stream',
      caption || ''
    );
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/chats/:jid/archivo', async (req, res) => {
  try {
    const { jid } = req.params;
    const { archivoBase64, nombreArchivo, mimeType, caption } = req.body || {};
    if (!archivoBase64) {
      return res.status(400).json({ ok: false, error: 'archivoBase64 es requerido.' });
    }

    const resultado = await whatsAppService.enviarArchivoChat(
      decodeURIComponent(jid),
      archivoBase64,
      nombreArchivo || 'archivo.bin',
      mimeType || 'application/octet-stream',
      caption || ''
    );
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 13. Marcar chat como leído
router.post('/chats/:jid/marcar-leido', (req, res) => {
  try {
    const { jid } = req.params;
    whatsAppService.marcarLeido(decodeURIComponent(jid));
    res.json({ ok: true, mensaje: 'Chat marcado como leído.' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 13b. Actualizar etiquetas de un chat
router.post('/chats/:jid/etiquetas', (req, res) => {
  try {
    const { jid } = req.params;
    const { etiquetas } = req.body || {};
    const resultado = whatsAppService.actualizarEtiquetas(decodeURIComponent(jid), etiquetas);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/chats/etiquetas', (req, res) => {
  try {
    const { jid, etiquetas } = req.body || {};
    if (!jid) return res.status(400).json({ ok: false, error: 'JID es requerido.' });
    const resultado = whatsAppService.actualizarEtiquetas(String(jid), etiquetas);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 13c. Registrar nota interna privada del equipo de ventas
router.post('/chats/:jid/notas-internas', (req, res) => {
  try {
    const { jid } = req.params;
    const { texto, autor } = req.body || {};
    if (!texto || !texto.trim()) {
      return res.status(400).json({ ok: false, error: 'El contenido de la nota interna es requerido.' });
    }
    const resultado = whatsAppService.guardarNotaInterna(decodeURIComponent(jid), texto, autor);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/chats/notas-internas', (req, res) => {
  try {
    const { jid, texto, autor } = req.body || {};
    if (!jid || !texto || !texto.trim()) {
      return res.status(400).json({ ok: false, error: 'JID y texto de nota interna son requeridos.' });
    }
    const resultado = whatsAppService.guardarNotaInterna(String(jid), texto, autor);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 14. Iniciar nueva conversación con número o cliente
router.post('/chats/nuevo', (req, res) => {
  try {
    const { telefono, nombre, contacto } = req.body || {};
    if (!telefono) {
      return res.status(400).json({ ok: false, error: 'Número de teléfono requerido.' });
    }

    const chat = whatsAppService.iniciarNuevoChat(telefono, nombre, contacto);
    res.json({ ok: true, chat });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 15. Consultar o refrescar foto de perfil de un contacto
router.get('/chats/foto', async (req, res) => {
  try {
    const { jid, refrescar } = req.query;
    if (!jid) {
      return res.status(400).json({ ok: false, error: 'JID de WhatsApp requerido.' });
    }
    const fotoUrl = await whatsAppService.obtenerYDescargarFotoPerfil(String(jid), refrescar === 'true');
    res.json({ ok: true, fotoUrl });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 16. Forzar sincronización masiva de fotos de perfil de todos los chats
router.post('/chats/fotos/sincronizar', async (_req, res) => {
  try {
    await whatsAppService.sincronizarFotosPerfil(true);
    res.json({ ok: true, chats: whatsAppService.obtenerChats() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 17. Server-Sent Events (SSE) para recepción de mensajes en tiempo real
router.get('/eventos', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  res.write(': conexion iniciada\n\n');
  whatsAppService.suscribirSSE(res);

  req.on('close', () => {
    whatsAppService.desuscribirSSE(res);
  });
});

export default router;
