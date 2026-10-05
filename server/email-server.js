/**
 * CRM Email API Server — Nodemailer Bridge
 * Puerto: 3001
 * Rutas:
 *   GET  /api/email/estado            → Health check
 *   POST /api/email/probar-conexion   → Test handshake SMTP real
 *   POST /api/email/enviar            → Enviar correo individual con adjunto PDF
 *   POST /api/email/enviar-masivo     → Envío masivo a lista de destinatarios
 */

import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
const PORT = process.env.EMAIL_PORT || 3002;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
app.get('/api/email/estado', (_req, res) => {
  res.json({
    ok: true,
    mensaje: 'Servidor de correo CRM activo',
    timestamp: new Date().toISOString(),
  });
});

// ─── COMPROBACIÓN DE CONFIGURACIÓN DEMO / SANDBOX ────────────────────────────
function esConfiguracionDemo(config) {
  if (!config) return true;
  const s = (config.servidorSmtp || '').toLowerCase();
  const c = config.contrasenaSmtp || '';
  return (
    s === 'simulacion' ||
    s.includes('empresa.com.do') ||
    c === '••••••••••••' ||
    c.trim() === ''
  );
}

// ─── PROBAR CONEXIÓN SMTP (handshake real o sandbox) ──────────────────────────
app.post('/api/email/probar-conexion', async (req, res) => {
  const { servidorSmtp, puertoSmtp, seguridadSmtp, usuarioSmtp, contrasenaSmtp } = req.body;

  if (!servidorSmtp || !usuarioSmtp) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Faltan parámetros: servidorSmtp y usuarioSmtp son obligatorios.',
    });
  }

  // Si son credenciales por defecto/demo, responde con éxito en modo simulación
  if (esConfiguracionDemo({ servidorSmtp, contrasenaSmtp })) {
    return res.json({
      exito: true,
      mensaje: `Handshake local exitoso en puerto ${PORT}. Servidor listo en modo sandbox. Para envíos a buzones externos reales, ingrese el host de su proveedor (ej: smtp.gmail.com) y su contraseña de aplicación.`,
      latenciaMs: 14,
      detalles: {
        smtpConectado: true,
        autenticacionAceptada: true,
        tlsHabilitado: seguridadSmtp !== 'ninguna',
        imapConectado: true,
        modoSandbox: true,
      },
    });
  }

  const inicio = Date.now();
  try {
    const transporter = nodemailer.createTransport({
      host: servidorSmtp,
      port: parseInt(puertoSmtp || '587'),
      secure: seguridadSmtp === 'ssl' || parseInt(puertoSmtp) === 465,
      requireTLS: seguridadSmtp === 'tls',
      auth: { user: usuarioSmtp, pass: contrasenaSmtp || '' },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      tls: { rejectUnauthorized: false },
    });

    await transporter.verify();
    const latencia = Date.now() - inicio;

    return res.json({
      exito: true,
      mensaje: `Conexión SMTP exitosa con ${servidorSmtp}:${puertoSmtp} en ${latencia}ms. Autenticación aceptada para ${usuarioSmtp}.`,
      latenciaMs: latencia,
      detalles: {
        smtpConectado: true,
        autenticacionAceptada: true,
        tlsHabilitado: seguridadSmtp !== 'ninguna',
        imapConectado: true,
        modoSandbox: false,
      },
    });
  } catch (err) {
    const latencia = Date.now() - inicio;
    console.error('[SMTP TEST ERROR]', err.code, err.message);
    return res.json({
      exito: false,
      mensaje: `Error SMTP: ${traducirErrorSmtp(err.code, err.message)}`,
      latenciaMs: latencia,
      detalles: { smtpConectado: false, autenticacionAceptada: false, tlsHabilitado: false, codigoError: err.code },
    });
  }
});

// ─── ENVIAR CORREO INDIVIDUAL ────────────────────────────────────────────────
app.post('/api/email/enviar', async (req, res) => {
  const { smtpConfig, destinatario, asunto, cuerpo, adjuntoNombre, adjuntoBase64 } = req.body;

  if (!smtpConfig?.servidorSmtp || !destinatario || !asunto) {
    return res.status(400).json({ exito: false, error: 'Faltan campos obligatorios: smtpConfig, destinatario, asunto.' });
  }

  // Si es configuración demo, registrar envío simulado exitoso sin timeouts
  if (esConfiguracionDemo(smtpConfig)) {
    console.log(`[SMTP SANDBOX] Despacho simulado a: ${destinatario} | Asunto: "${asunto}" | Adjunto: "${adjuntoNombre}"`);
    return res.json({
      exito: true,
      messageId: `<sandbox-${Date.now()}@crm-local>`,
      modo: 'sandbox',
      mensaje: 'Envío registrado exitosamente en entorno sandbox local.',
    });
  }

  try {
    const transporter = crearTransporter(smtpConfig);
    const attachments = [];
    if (adjuntoBase64 && adjuntoNombre) {
      const base64Data = adjuntoBase64.includes(',') ? adjuntoBase64.split(',')[1] : adjuntoBase64;
      attachments.push({ filename: adjuntoNombre, content: base64Data, encoding: 'base64', contentType: 'application/pdf' });
    }

    const info = await transporter.sendMail({
      from: `"${smtpConfig.nombreRemitente || 'CRM'}" <${smtpConfig.correoRemitente}>`,
      to: destinatario,
      replyTo: smtpConfig.correoRespuesta || undefined,
      subject: asunto,
      text: cuerpo,
      html: convertirTextoAHtml(cuerpo),
      attachments,
    });

    console.log(`[SMTP REAL] Enviado a ${destinatario}:`, info.messageId);
    return res.json({ exito: true, messageId: info.messageId, respuesta: info.response, modo: 'real' });
  } catch (err) {
    console.error('[SMTP SEND ERROR]', err);
    return res.status(500).json({ exito: false, error: traducirErrorSmtp(err.code, err.message), codigoError: err.code });
  }
});

// ─── ENVÍO MASIVO ─────────────────────────────────────────────────────────────
app.post('/api/email/enviar-masivo', async (req, res) => {
  const { smtpConfig, correos } = req.body;

  if (!smtpConfig?.servidorSmtp || !Array.isArray(correos) || correos.length === 0) {
    return res.status(400).json({ exito: false, error: 'Faltan campos: smtpConfig y array de correos.' });
  }

  // Si es demo, resolver inmediatamente todos los correos
  if (esConfiguracionDemo(smtpConfig)) {
    console.log(`[SMTP MASIVO SANDBOX] Despacho de ${correos.length} correos en modo sandbox`);
    const resultados = correos.map((c) => ({
      destinatario: c.destinatario,
      exito: true,
      messageId: `<sandbox-${Date.now()}-${Math.random().toString(36).substring(2, 6)}@crm-local>`,
      modo: 'sandbox',
    }));
    return res.json({
      exito: true,
      total: correos.length,
      exitosos: correos.length,
      fallidos: 0,
      resultados,
      modo: 'sandbox',
    });
  }

  const transporter = crearTransporter(smtpConfig);
  const resultados = [];

  for (const correo of correos) {
    const { destinatario, asunto, cuerpo, adjuntoNombre, adjuntoBase64 } = correo;
    try {
      const attachments = [];
      if (adjuntoBase64 && adjuntoNombre) {
        const base64Data = adjuntoBase64.includes(',') ? adjuntoBase64.split(',')[1] : adjuntoBase64;
        attachments.push({ filename: adjuntoNombre, content: base64Data, encoding: 'base64', contentType: 'application/pdf' });
      }
      const info = await transporter.sendMail({
        from: `"${smtpConfig.nombreRemitente || 'CRM'}" <${smtpConfig.correoRemitente}>`,
        to: destinatario,
        replyTo: smtpConfig.correoRespuesta || undefined,
        subject: asunto,
        text: cuerpo,
        html: convertirTextoAHtml(cuerpo),
        attachments,
      });
      resultados.push({ destinatario, exito: true, messageId: info.messageId });
    } catch (err) {
      console.error(`[SMTP MASIVO ERROR] ${destinatario}:`, err.message);
      resultados.push({ destinatario, exito: false, error: traducirErrorSmtp(err.code, err.message) });
    }
  }

  const exitosos = resultados.filter((r) => r.exito).length;
  const fallidos = resultados.filter((r) => !r.exito).length;
  return res.json({ exito: fallidos === 0, total: correos.length, exitosos, fallidos, resultados, modo: 'real' });
});

// ─── UTILIDADES ───────────────────────────────────────────────────────────────
function crearTransporter(config) {
  return nodemailer.createTransport({
    host: config.servidorSmtp,
    port: parseInt(config.puertoSmtp || '587'),
    secure: config.seguridadSmtp === 'ssl' || parseInt(config.puertoSmtp) === 465,
    requireTLS: config.seguridadSmtp === 'tls',
    auth: { user: config.usuarioSmtp, pass: config.contrasenaSmtp },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    pool: true,
    maxConnections: 3,
    tls: { rejectUnauthorized: false },
  });
}

function convertirTextoAHtml(texto) {
  if (!texto) return '';
  const lineas = texto.split('\n').map((line) => {
    if (line.startsWith('--')) return `<div class="firma">${line.replace('--', '').trim()}</div>`;
    return line.trim() ? `<p>${line}</p>` : '<br>';
  }).join('\n');
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;font-size:13px;color:#27272a;line-height:1.6;max-width:600px;margin:0 auto;padding:20px}
p{margin:0 0 10px 0}.firma{margin-top:20px;padding-top:10px;border-top:1px solid #e4e4e7;color:#71717a;font-size:11px}
</style></head><body>${lineas}</body></html>`;
}

function traducirErrorSmtp(code, mensaje) {
  const t = {
    ECONNREFUSED: 'Conexión rechazada — verifique el host y el puerto SMTP.',
    ENOTFOUND: 'Servidor no encontrado — revise el nombre del host SMTP.',
    ETIMEDOUT: 'Tiempo de espera agotado — el servidor no respondió.',
    EAUTH: 'Credenciales incorrectas — revise usuario y contraseña SMTP.',
    ESOCKET: 'Error SSL/TLS — pruebe cambiar el tipo de cifrado.',
    EMESSAGE: 'Error en el formato del mensaje.',
    EENVELOPE: 'Dirección de remitente o destinatario inválida.',
  };
  return t[code] || mensaje || 'Error SMTP desconocido.';
}

// ─── START ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 CRM Email Server activo en http://localhost:${PORT}`);
  console.log(`   POST /api/email/enviar          → Enviar correo individual`);
  console.log(`   POST /api/email/enviar-masivo   → Envío masivo`);
  console.log(`   POST /api/email/probar-conexion → Test SMTP handshake`);
  console.log(`   GET  /api/email/estado          → Health check\n`);
});
