import express from 'express';
import { whatsAppService } from './whatsapp-service.js';

const router = express.Router();

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
    const chats = whatsAppService.obtenerChats();
    res.json({ ok: true, chats });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 11. Obtener mensajes de un chat específico
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
    const { texto } = req.body || {};
    if (!texto || !texto.trim()) {
      return res.status(400).json({ ok: false, error: 'El texto del mensaje es requerido.' });
    }

    const resultado = await whatsAppService.enviarMensajeChat(decodeURIComponent(jid), texto);
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

// 15. Server-Sent Events (SSE) para recepción de mensajes en tiempo real
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
