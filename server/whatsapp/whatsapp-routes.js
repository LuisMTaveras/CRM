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

// 6. Historial de envíos de la sesión
router.get('/historial', (req, res) => {
  res.json({
    ok: true,
    historial: whatsAppService.historialEnvios,
  });
});

export default router;
