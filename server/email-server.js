/**
 * CRM Email API Server — Nodemailer & ImapFlow Bridge
 * Puerto: 3002 (o PORT / EMAIL_PORT de entorno)
 * 
 * Rutas:
 *   GET    /api/email/estado              → Health check
 *   POST   /api/email/configuracion       → Guardar configuración persistente
 *   GET    /api/email/configuracion       → Obtener configuración activa
 *   POST   /api/email/probar-conexion     → Test SMTP handshake
 *   POST   /api/email/probar-imap         → Test IMAP handshake
 *   POST   /api/email/sincronizar         → Sincronizar correos reales vía IMAP
 *   GET/POST /api/email/carpetas          → Lista de carpetas con contadores reales
 *   GET/POST /api/email/mensajes          → Lista de correos paginados por carpeta
 *   GET    /api/email/mensajes/:id        → Detalle completo de un correo
 *   PATCH  /api/email/mensajes/:id        → Actualizar leido/destacado/mover carpeta
 *   POST   /api/email/responder           → Responder correo citando original y firma
 *   POST   /api/email/redactar            → Redactar nuevo correo con firma y pie
 *   POST   /api/email/enviar              → Enviar correo individual con adjunto PDF
 *   POST   /api/email/enviar-masivo       → Envío masivo a lista de clientes
 */

import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.join(__dirname, 'email-config.json');
const EMPRESA_FILE = path.join(__dirname, 'empresa-config.json');

const app = express();
const PORT = process.env.EMAIL_PORT || process.env.PORT || 3002;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── PERSISTENCIA DE CONFIGURACIÓN ──────────────────────────────────────────
let configuracionActiva = null;

function cargarConfiguracionServidor() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      configuracionActiva = JSON.parse(data);
      console.log(`[CONFIG] Configuración cargada desde email-config.json para: ${configuracionActiva.usuarioSmtp || configuracionActiva.usuarioImap}`);
    }
  } catch (err) {
    console.warn('[CONFIG] No se pudo leer email-config.json:', err.message);
  }
}
cargarConfiguracionServidor();

function guardarConfiguracionServidor(config) {
  try {
    configuracionActiva = { ...(configuracionActiva || {}), ...config };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(configuracionActiva, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[CONFIG] Error al guardar email-config.json:', err.message);
    return false;
  }
}

// ─── PERSISTENCIA DE EMPRESA (BASE DE DATOS SERVIDOR) ──────────────────────
let datosEmpresaActiva = null;

function cargarEmpresaServidor() {
  try {
    if (fs.existsSync(EMPRESA_FILE)) {
      const data = fs.readFileSync(EMPRESA_FILE, 'utf8');
      datosEmpresaActiva = JSON.parse(data);
      console.log(`[EMPRESA DB] Datos de empresa cargados: ${datosEmpresaActiva.razonSocial || datosEmpresaActiva.nombreComercial} (RNC: ${datosEmpresaActiva.identificacionFiscal})`);
    }
  } catch (err) {
    console.warn('[EMPRESA DB] No se pudo leer empresa-config.json:', err.message);
  }
}
cargarEmpresaServidor();

function guardarEmpresaServidor(datos) {
  try {
    datosEmpresaActiva = { ...(datosEmpresaActiva || {}), ...datos, ultimaActualizacion: new Date().toISOString() };
    fs.writeFileSync(EMPRESA_FILE, JSON.stringify(datosEmpresaActiva, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[EMPRESA DB] Error al guardar empresa-config.json:', err.message);
    return false;
  }
}

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
app.get('/api/email/estado', (_req, res) => {
  res.json({
    ok: true,
    mensaje: 'Servidor de correo CRM activo (SMTP + IMAP)',
    cuentaConfigurada: configuracionActiva?.usuarioImap || configuracionActiva?.usuarioSmtp || null,
    totalCorreosEnMemoria: correosEnMemoria.length,
    timestamp: new Date().toISOString(),
  });
});

// ─── GUARDAR / OBTENER CONFIGURACIÓN CORREO ──────────────────────────────────
app.post('/api/email/configuracion', (req, res) => {
  const config = req.body;
  if (!config) {
    return res.status(400).json({ ok: false, error: 'Configuración vacía.' });
  }
  guardarConfiguracionServidor(config);
  res.json({
    ok: true,
    mensaje: 'Configuración de correo guardada en el servidor exitosamente.',
  });
});

app.get('/api/email/configuracion', (_req, res) => {
  res.json({
    ok: true,
    configuracion: configuracionActiva
      ? {
          ...configuracionActiva,
          contrasenaSmtp: configuracionActiva.contrasenaSmtp ? '••••••••••••' : '',
          contrasenaImap: configuracionActiva.contrasenaImap ? '••••••••••••' : '',
        }
      : null,
  });
});

// ─── OBTENER / ACTUALIZAR PERFIL DE EMPRESA (DB) ──────────────────────────────
app.get(['/api/empresa', '/api/email/empresa'], (_req, res) => {
  if (!datosEmpresaActiva) cargarEmpresaServidor();
  res.json({
    ok: true,
    empresa: datosEmpresaActiva,
  });
});

app.post(['/api/empresa', '/api/email/empresa'], (req, res) => {
  const datos = req.body;
  if (!datos || typeof datos !== 'object') {
    return res.status(400).json({ ok: false, error: 'Datos de empresa inválidos.' });
  }
  const exito = guardarEmpresaServidor(datos);
  res.json({
    ok: exito,
    empresa: datosEmpresaActiva,
    mensaje: 'Perfil de empresa guardado exitosamente en base de datos.',
  });
});

// ─── COMPROBACIÓN DE CONFIGURACIÓN DEMO / VACÍA ──────────────────────────────
function esConfiguracionDemo(config) {
  if (!config) return true;
  const s = (config.servidorSmtp || config.servidorImap || '').toLowerCase();
  const c = (config.contrasenaSmtp || config.contrasenaImap || '').trim();
  return (
    s === 'simulacion' ||
    s.includes('empresa.com.do') ||
    c === '' ||
    c.includes('••') ||
    c.includes('\u2022') ||
    /^[\*\•\?\s]+$/.test(c)
  );
}

function resolverConfigImap(req) {
  const reqConfig = req.body?.imapConfig || req.body?.smtpConfig || req.body?.config;
  if (reqConfig && reqConfig.servidorImap && reqConfig.usuarioImap) {
    return reqConfig;
  }
  if (configuracionActiva && configuracionActiva.servidorImap && configuracionActiva.usuarioImap) {
    return configuracionActiva;
  }
  if (process.env.IMAP_HOST && process.env.IMAP_USER) {
    return {
      servidorImap: process.env.IMAP_HOST,
      puertoImap: parseInt(process.env.IMAP_PORT || '993'),
      seguridadImap: process.env.IMAP_SECURE || 'ssl',
      usuarioImap: process.env.IMAP_USER,
      contrasenaImap: process.env.IMAP_PASS || '',
    };
  }
  return null;
}

function resolverConfigSmtp(req) {
  const reqConfig = req.body?.smtpConfig || req.body?.config;
  if (reqConfig && reqConfig.servidorSmtp && reqConfig.usuarioSmtp) {
    return reqConfig;
  }
  if (configuracionActiva && configuracionActiva.servidorSmtp && configuracionActiva.usuarioSmtp) {
    return configuracionActiva;
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return {
      servidorSmtp: process.env.SMTP_HOST,
      puertoSmtp: parseInt(process.env.SMTP_PORT || '587'),
      seguridadSmtp: process.env.SMTP_SECURE || 'tls',
      usuarioSmtp: process.env.SMTP_USER,
      contrasenaSmtp: process.env.SMTP_PASS || '',
      correoRemitente: process.env.SMTP_USER,
    };
  }
  return null;
}

// ─── ALMACÉN EN MEMORIA DE CORREOS REALES (Sin correos hardcodeados) ─────────
let correosEnMemoria = [];

// ─── BÚSQUEDA DE MAILBOX SEGÚN CARPETA ───────────────────────────────────────
function mapearMailbox(list, carpetaId) {
  if (carpetaId === 'inbox') {
    const b = list.find((m) => m.path.toUpperCase() === 'INBOX' || m.name.toUpperCase() === 'INBOX');
    return b ? b.path : 'INBOX';
  }
  if (carpetaId === 'enviados') {
    const b = list.find(
      (m) =>
        m.specialUse === '\\Sent' ||
        /sent|enviad/i.test(m.path) ||
        /sent|enviad/i.test(m.name)
    );
    return b ? b.path : null;
  }
  if (carpetaId === 'borradores') {
    const b = list.find(
      (m) =>
        m.specialUse === '\\Drafts' ||
        /draft|borrador/i.test(m.path) ||
        /draft|borrador/i.test(m.name)
    );
    return b ? b.path : null;
  }
  if (carpetaId === 'archivados') {
    const b = list.find(
      (m) =>
        m.specialUse === '\\Archive' ||
        /archiv/i.test(m.path) ||
        /archiv/i.test(m.name)
    );
    return b ? b.path : null;
  }
  if (carpetaId === 'papelera') {
    const b = list.find(
      (m) =>
        m.specialUse === '\\Trash' ||
        /trash|papeler|eliminad|junk/i.test(m.path) ||
        /trash|papeler|eliminad|junk/i.test(m.name)
    );
    return b ? b.path : null;
  }
  return 'INBOX';
}

// ─── LÓGICA DE SINCRONIZACIÓN IMAP REAL ──────────────────────────────────────
async function sincronizarCorreosImap(config, carpetaId = 'inbox', limite = 35) {
  if (!config || esConfiguracionDemo(config)) {
    return {
      exito: false,
      mensaje: 'La cuenta no tiene credenciales IMAP válidas o está en modo simulación.',
      sincronizados: 0,
      modo: 'demo',
    };
  }

  const client = new ImapFlow({
    host: config.servidorImap,
    port: parseInt(config.puertoImap || '993'),
    secure: config.seguridadImap === 'ssl' || parseInt(config.puertoImap) === 993,
    auth: {
      user: config.usuarioImap,
      pass: config.contrasenaImap,
    },
    logger: false,
    tls: { rejectUnauthorized: false },
  });

  const mensajesSincronizados = [];

  try {
    await client.connect();

    const mailboxes = await client.list();
    const mailboxTarget = mapearMailbox(mailboxes, carpetaId);

    if (!mailboxTarget) {
      await client.logout();
      return {
        exito: true,
        mensaje: `No se encontró carpeta remota para "${carpetaId}" en el servidor.`,
        sincronizados: 0,
      };
    }

    const lock = await client.getMailboxLock(mailboxTarget);
    try {
      const totalExistentes = client.mailbox.exists || 0;
      if (totalExistentes > 0) {
        const startSeq = Math.max(1, totalExistentes - limite + 1);
        const range = `${startSeq}:${totalExistentes}`;

        for await (let msg of client.fetch(range, {
          uid: true,
          flags: true,
          envelope: true,
          source: true,
        })) {
          let parsed = null;
          if (msg.source) {
            try {
              parsed = await simpleParser(msg.source);
            } catch (pErr) {
              console.warn('[MAILPARSER WARN]', pErr.message);
            }
          }

          const deNombre = parsed?.from?.value?.[0]?.name || msg.envelope?.from?.[0]?.name || '';
          const deCorreo = parsed?.from?.value?.[0]?.address || msg.envelope?.from?.[0]?.address || config.usuarioImap;

          const paraList = (parsed?.to?.value || msg.envelope?.to || []).map((p) => ({
            nombre: p.name || p.address || '',
            correo: p.address || '',
          }));

          const ccList = (parsed?.cc?.value || msg.envelope?.cc || []).map((p) => ({
            nombre: p.name || p.address || '',
            correo: p.address || '',
          }));

          const asunto = parsed?.subject || msg.envelope?.subject || '(Sin asunto)';
          const fecha = parsed?.date
            ? parsed.date.toISOString()
            : msg.envelope?.date
            ? new Date(msg.envelope.date).toISOString()
            : new Date().toISOString();

          const cuerpoTexto = parsed?.text || '';
          const cuerpoHtml =
            parsed?.html ||
            (cuerpoTexto ? `<div style="font-family: Arial, sans-serif; font-size: 13px; color: #27272a; line-height: 1.6;">${cuerpoTexto.replace(/\n/g, '<br>')}</div>` : '');
          const extracto = (cuerpoTexto || '').replace(/\s+/g, ' ').trim().slice(0, 160) || asunto;

          const leido = msg.flags ? msg.flags.has('\\Seen') : false;
          const destacado = msg.flags ? msg.flags.has('\\Flagged') : false;

          const adjuntos = (parsed?.attachments || []).map((att, idx) => ({
            id: `att-${msg.uid}-${idx}`,
            nombre: att.filename || `adjunto-${idx + 1}`,
            tamanoBytes: att.size || att.content?.length || 0,
            tipoContenido: att.contentType || 'application/octet-stream',
            base64:
              att.content && att.content.length < 2500000
                ? `data:${att.contentType};base64,${att.content.toString('base64')}`
                : undefined,
          }));

          const mensajeMapeado = {
            id: `msg-imap-${msg.uid}`,
            uid: msg.uid,
            carpeta: carpetaId,
            de: { nombre: deNombre || deCorreo, correo: deCorreo },
            para: paraList.length > 0 ? paraList : [{ nombre: config.usuarioImap, correo: config.usuarioImap }],
            cc: ccList.length > 0 ? ccList : undefined,
            asunto,
            extracto,
            cuerpoTexto,
            cuerpoHtml,
            fecha,
            leido,
            destacado,
            tieneAdjuntos: adjuntos.length > 0,
            adjuntos: adjuntos.length > 0 ? adjuntos : undefined,
          };

          mensajesSincronizados.push(mensajeMapeado);
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();

    // Actualizar almacén en memoria
    for (const msg of mensajesSincronizados) {
      const idx = correosEnMemoria.findIndex((c) => c.id === msg.id || c.uid === msg.uid);
      if (idx >= 0) {
        correosEnMemoria[idx] = { ...correosEnMemoria[idx], ...msg };
      } else {
        correosEnMemoria.unshift(msg);
      }
    }

    correosEnMemoria.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    console.log(`[IMAP SYNC OK] ${mensajesSincronizados.length} correos sincronizados desde ${config.usuarioImap} (Carpeta: ${carpetaId})`);

    return {
      exito: true,
      mensaje: `Sincronización completada exitosamente: ${mensajesSincronizados.length} correos obtenidos de ${config.usuarioImap}.`,
      sincronizados: mensajesSincronizados.length,
      carpeta: carpetaId,
      modo: 'real',
    };
  } catch (err) {
    try { await client.logout(); } catch {}
    console.error('[IMAP SYNC ERROR]', err.message);
    return {
      exito: false,
      mensaje: `Error al sincronizar vía IMAP: ${err.message}`,
      error: err.message,
      sincronizados: 0,
      modo: 'error',
    };
  }
}

// ─── ENDPOINT SINCRONIZAR ────────────────────────────────────────────────────
app.post('/api/email/sincronizar', async (req, res) => {
  const config = resolverConfigImap(req);
  const carpeta = (req.body?.carpeta || 'inbox').toLowerCase();
  const limite = parseInt(req.body?.limite || '40');

  if (!config) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Faltan parámetros de configuración IMAP (servidorImap, usuarioImap, contrasenaImap).',
      sincronizados: 0,
    });
  }

  if (!esConfiguracionDemo(config)) {
    guardarConfiguracionServidor(config);
  }

  const resultado = await sincronizarCorreosImap(config, carpeta, limite);

  const carpetas = [
    {
      id: 'inbox',
      nombre: 'Bandeja de entrada',
      total: correosEnMemoria.filter((c) => c.carpeta === 'inbox').length,
      noLeidos: correosEnMemoria.filter((c) => c.carpeta === 'inbox' && !c.leido).length,
    },
    {
      id: 'enviados',
      nombre: 'Enviados',
      total: correosEnMemoria.filter((c) => c.carpeta === 'enviados').length,
      noLeidos: 0,
    },
    {
      id: 'borradores',
      nombre: 'Borradores',
      total: correosEnMemoria.filter((c) => c.carpeta === 'borradores').length,
      noLeidos: 0,
    },
    {
      id: 'archivados',
      nombre: 'Archivados',
      total: correosEnMemoria.filter((c) => c.carpeta === 'archivados').length,
      noLeidos: 0,
    },
    {
      id: 'papelera',
      nombre: 'Papelera',
      total: correosEnMemoria.filter((c) => c.carpeta === 'papelera').length,
      noLeidos: 0,
    },
  ];

  res.json({
    ...resultado,
    carpetas,
    totalEnMemoria: correosEnMemoria.length,
  });
});

// ─── PROBAR CONEXIÓN SMTP ────────────────────────────────────────────────────
app.post('/api/email/probar-conexion', async (req, res) => {
  const { servidorSmtp, puertoSmtp, seguridadSmtp, usuarioSmtp, contrasenaSmtp } = req.body;

  if (!servidorSmtp || !usuarioSmtp) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Faltan parámetros obligatorios: servidorSmtp y usuarioSmtp.',
    });
  }

  if (esConfiguracionDemo({ servidorSmtp, contrasenaSmtp })) {
    return res.json({
      exito: true,
      mensaje: `Conexión SMTP simulada exitosa en puerto ${PORT}. Servidor listo en modo simulación.`,
      latenciaMs: 15,
      detalles: {
        smtpConectado: true,
        autenticacionAceptada: true,
        tlsHabilitado: seguridadSmtp !== 'ninguna',
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

    guardarConfiguracionServidor({ servidorSmtp, puertoSmtp, seguridadSmtp, usuarioSmtp, contrasenaSmtp });

    return res.json({
      exito: true,
      mensaje: `Conexión SMTP exitosa con ${servidorSmtp}:${puertoSmtp} en ${latencia}ms. Autenticación aceptada para ${usuarioSmtp}.`,
      latenciaMs: latencia,
      detalles: {
        smtpConectado: true,
        autenticacionAceptada: true,
        tlsHabilitado: seguridadSmtp !== 'ninguna',
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

// ─── PROBAR CONEXIÓN IMAP ────────────────────────────────────────────────────
app.post('/api/email/probar-imap', async (req, res) => {
  const { servidorImap, puertoImap, seguridadImap, usuarioImap, contrasenaImap } = req.body;

  if (!servidorImap || !usuarioImap) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Faltan parámetros obligatorios: servidorImap y usuarioImap.',
    });
  }

  if (esConfiguracionDemo({ servidorImap, contrasenaImap })) {
    return res.json({
      exito: true,
      mensaje: `Conexión IMAP simulada exitosa. Bandeja activa en modo simulación.`,
      latenciaMs: 18,
      detalles: {
        imapConectado: true,
        autenticacionAceptada: true,
        modoSandbox: true,
      },
    });
  }

  const inicio = Date.now();
  const client = new ImapFlow({
    host: servidorImap,
    port: parseInt(puertoImap || '993'),
    secure: seguridadImap === 'ssl' || parseInt(puertoImap) === 993,
    auth: { user: usuarioImap, pass: contrasenaImap || '' },
    logger: false,
    tls: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const mailboxes = await client.list();
    await client.logout();
    const latencia = Date.now() - inicio;

    guardarConfiguracionServidor({ servidorImap, puertoImap, seguridadImap, usuarioImap, contrasenaImap });

    return res.json({
      exito: true,
      mensaje: `Conexión IMAP exitosa con ${servidorImap}:${puertoImap} en ${latencia}ms. ${mailboxes.length} carpetas detectadas en la cuenta ${usuarioImap}.`,
      latenciaMs: latencia,
      detalles: {
        imapConectado: true,
        autenticacionAceptada: true,
        totalCarpetas: mailboxes.length,
        modoSandbox: false,
      },
    });
  } catch (err) {
    const latencia = Date.now() - inicio;
    console.error('[IMAP TEST ERROR]', err.message);
    try { await client.logout(); } catch {}
    return res.json({
      exito: false,
      mensaje: `Error de conexión IMAP: ${err.message || 'Verifique servidor, puerto y contraseña de aplicación.'}`,
      latenciaMs: latencia,
      detalles: { imapConectado: false, autenticacionAceptada: false },
    });
  }
});

// ─── CARPETAS Y CONTADORES ───────────────────────────────────────────────────
app.all(['/api/email/carpetas'], async (req, res) => {
  const carpetas = [
    {
      id: 'inbox',
      nombre: 'Bandeja de entrada',
      total: correosEnMemoria.filter((c) => c.carpeta === 'inbox').length,
      noLeidos: correosEnMemoria.filter((c) => c.carpeta === 'inbox' && !c.leido).length,
    },
    {
      id: 'enviados',
      nombre: 'Enviados',
      total: correosEnMemoria.filter((c) => c.carpeta === 'enviados').length,
      noLeidos: 0,
    },
    {
      id: 'borradores',
      nombre: 'Borradores',
      total: correosEnMemoria.filter((c) => c.carpeta === 'borradores').length,
      noLeidos: 0,
    },
    {
      id: 'archivados',
      nombre: 'Archivados',
      total: correosEnMemoria.filter((c) => c.carpeta === 'archivados').length,
      noLeidos: 0,
    },
    {
      id: 'papelera',
      nombre: 'Papelera',
      total: correosEnMemoria.filter((c) => c.carpeta === 'papelera').length,
      noLeidos: 0,
    },
  ];

  res.json({
    ok: true,
    carpetas,
    totalNoLeidos: carpetas.find((c) => c.id === 'inbox')?.noLeidos || 0,
    totalCorreos: correosEnMemoria.length,
    cuentaConfigurada: configuracionActiva?.usuarioImap || configuracionActiva?.usuarioSmtp || null,
  });
});

// ─── LISTAR MENSAJES PAGINADOS (Bandeja / Carpetas) ──────────────────────────
app.all(['/api/email/mensajes'], async (req, res) => {
  const params = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
  const carpeta = (params.carpeta || 'inbox').toLowerCase();
  const pagina = parseInt(params.pagina || '1');
  const limite = parseInt(params.limite || '20');
  const busqueda = (params.busqueda || '').toLowerCase().trim();

  // Si se solicita sincronización explícita o la memoria está vacía y hay credenciales válidas
  const config = resolverConfigImap(req);
  if (params.sincronizar === 'true' && config && !esConfiguracionDemo(config)) {
    try {
      await sincronizarCorreosImap(config, carpeta, Math.max(limite * 2, 40));
    } catch (e) {
      console.warn('[AUTO SYNC WARN]', e.message);
    }
  }

  let filtrados = correosEnMemoria.filter((c) => c.carpeta === carpeta);

  if (busqueda) {
    filtrados = filtrados.filter(
      (c) =>
        c.asunto.toLowerCase().includes(busqueda) ||
        (c.de?.nombre || '').toLowerCase().includes(busqueda) ||
        (c.de?.correo || '').toLowerCase().includes(busqueda) ||
        (c.extracto || '').toLowerCase().includes(busqueda)
    );
  }

  filtrados.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const total = filtrados.length;
  const totalPaginas = Math.ceil(total / limite) || 1;
  const inicio = (pagina - 1) * limite;
  const paginados = filtrados.slice(inicio, inicio + limite);
  const noLeidos = correosEnMemoria.filter((c) => c.carpeta === carpeta && !c.leido).length;

  res.json({
    ok: true,
    total,
    pagina,
    tamanoPagina: limite,
    totalPaginas,
    noLeidos,
    mensajes: paginados,
  });
});

// ─── OBTENER DETALLE DE MENSAJE ──────────────────────────────────────────────
app.get('/api/email/mensajes/:id', (req, res) => {
  const { id } = req.params;
  const mensaje = correosEnMemoria.find((c) => c.id === id || String(c.uid) === id);

  if (!mensaje) {
    return res.status(404).json({ ok: false, error: 'Mensaje de correo no encontrado.' });
  }

  mensaje.leido = true;

  res.json({
    ok: true,
    mensaje,
  });
});

// ─── ACTUALIZAR ESTADO DE MENSAJE (Leído, Destacado, Mover carpeta) ──────────
app.patch('/api/email/mensajes/:id', async (req, res) => {
  const { id } = req.params;
  const { leido, destacado, carpeta } = req.body;
  const mensaje = correosEnMemoria.find((c) => c.id === id || String(c.uid) === id);

  if (!mensaje) {
    return res.status(404).json({ ok: false, error: 'Mensaje no encontrado.' });
  }

  if (typeof leido === 'boolean') mensaje.leido = leido;
  if (typeof destacado === 'boolean') mensaje.destacado = destacado;
  if (carpeta && ['inbox', 'enviados', 'borradores', 'archivados', 'papelera'].includes(carpeta.toLowerCase())) {
    mensaje.carpeta = carpeta.toLowerCase();
  }

  // Si tiene UID y configuración IMAP real, sincronizar flag al servidor remoto
  if (mensaje.uid && configuracionActiva && !esConfiguracionDemo(configuracionActiva)) {
    try {
      const client = new ImapFlow({
        host: configuracionActiva.servidorImap,
        port: parseInt(configuracionActiva.puertoImap || '993'),
        secure: configuracionActiva.seguridadImap === 'ssl' || parseInt(configuracionActiva.puertoImap) === 993,
        auth: { user: configuracionActiva.usuarioImap, pass: configuracionActiva.contrasenaImap },
        logger: false,
        tls: { rejectUnauthorized: false },
      });
      await client.connect();
      const lock = await client.getMailboxLock('INBOX');
      try {
        if (typeof leido === 'boolean') {
          if (leido) await client.messageFlagsAdd(mensaje.uid, ['\\Seen'], { uid: true });
          else await client.messageFlagsRemove(mensaje.uid, ['\\Seen'], { uid: true });
        }
        if (typeof destacado === 'boolean') {
          if (destacado) await client.messageFlagsAdd(mensaje.uid, ['\\Flagged'], { uid: true });
          else await client.messageFlagsRemove(mensaje.uid, ['\\Flagged'], { uid: true });
        }
      } finally {
        lock.release();
      }
      await client.logout();
    } catch (flagErr) {
      console.warn('[IMAP FLAG SYNC WARN]', flagErr.message);
    }
  }

  res.json({
    ok: true,
    mensaje,
  });
});

// ─── RESPONDER CORREO CON FIRMA, PIE INSTITUCIONAL Y CITA ────────────────────
app.post('/api/email/responder', async (req, res) => {
  const {
    smtpConfig,
    mensajeOriginalId,
    destinatario,
    cc,
    cco,
    asunto,
    cuerpo,
    incluirFirma,
    firmaHtml,
    incluirPie,
    pieHtml,
    citarOriginal,
    mensajeOriginal,
  } = req.body;

  if (!destinatario || !cuerpo) {
    return res.status(400).json({
      exito: false,
      error: 'Destinatario y cuerpo del mensaje son requeridos.',
    });
  }

  const configSmtpUsar = smtpConfig || resolverConfigSmtp(req);

  let htmlFinal = `<div style="font-family: Arial, sans-serif; font-size: 13px; color: #27272a; line-height: 1.6;">`;
  const parrafos = cuerpo.split('\n').map((l) => (l.trim() ? `<p>${l}</p>` : '<br>')).join('\n');
  htmlFinal += `${parrafos}`;

  if (incluirFirma && firmaHtml) {
    htmlFinal += `<div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #e4e4e7;">${firmaHtml}</div>`;
  }

  if (citarOriginal && mensajeOriginal) {
    const fechaTexto = mensajeOriginal.fecha ? new Date(mensajeOriginal.fecha).toLocaleString('es-DO') : 'anteriormente';
    const remitenteTexto = mensajeOriginal.de?.nombre || mensajeOriginal.de?.correo || 'el remitente';
    htmlFinal += `<br><div style="margin-top: 24px; padding-left: 12px; border-left: 3px solid #cbd5e1; color: #64748b; font-size: 12px;">
      <p style="margin: 0 0 8px 0; color: #475569; font-weight: bold;">El ${fechaTexto}, ${remitenteTexto} escribió:</p>
      <div>${mensajeOriginal.cuerpoHtml || mensajeOriginal.cuerpoTexto || mensajeOriginal.extracto || ''}</div>
    </div>`;
  }

  if (incluirPie && pieHtml) {
    htmlFinal += `<div style="margin-top: 30px; padding-top: 12px; border-top: 1px dashed #d4d4d8; font-size: 11px; color: #71717a;">${pieHtml}</div>`;
  }

  htmlFinal += `</div>`;

  const nuevoId = `msg-reply-${Date.now()}`;
  const remitenteCorreo = configSmtpUsar?.correoRemitente || configSmtpUsar?.usuarioSmtp || 'ventas@empresa.com.do';
  const remitenteNombre = configSmtpUsar?.nombreRemitente || 'Departamento Comercial CRM';

  if (configSmtpUsar && !esConfiguracionDemo(configSmtpUsar)) {
    try {
      const transporter = crearTransporter(configSmtpUsar);
      const info = await transporter.sendMail({
        from: `"${remitenteNombre}" <${remitenteCorreo}>`,
        to: destinatario,
        cc: cc || undefined,
        bcc: cco || undefined,
        subject: asunto || 'Re: Comunicación',
        text: cuerpo,
        html: htmlFinal,
      });

      console.log(`[SMTP RESPUESTA REAL] Enviada a ${destinatario}:`, info.messageId);
    } catch (err) {
      console.error('[SMTP RESPUESTA ERROR]', err.message);
      return res.status(500).json({ exito: false, error: traducirErrorSmtp(err.code, err.message) });
    }
  } else {
    console.log(`[SIMULACIÓN RESPUESTA] Enviada a ${destinatario} | Asunto: "${asunto}"`);
  }

  const mensajeEnviado = {
    id: nuevoId,
    uid: Math.floor(Math.random() * 9000) + 1000,
    mensajeOriginalId: mensajeOriginalId || undefined,
    carpeta: 'enviados',
    de: { nombre: remitenteNombre, correo: remitenteCorreo },
    para: [{ nombre: destinatario, correo: destinatario }],
    cc: cc ? [{ nombre: cc, correo: cc }] : undefined,
    asunto: asunto || 'Re: Comunicación',
    extracto: cuerpo.substring(0, 120) + '...',
    cuerpoTexto: cuerpo,
    cuerpoHtml: htmlFinal,
    fecha: new Date().toISOString(),
    leido: true,
    destacado: false,
    tieneAdjuntos: false,
  };

  correosEnMemoria.unshift(mensajeEnviado);

  res.json({
    exito: true,
    mensajeId: nuevoId,
    mensajeEnviado,
    mensaje: 'Respuesta enviada y guardada en Enviados exitosamente.',
  });
});

// ─── REDACTAR NUEVO CORREO ───────────────────────────────────────────────────
app.post('/api/email/redactar', async (req, res) => {
  const {
    smtpConfig,
    destinatario,
    cc,
    cco,
    asunto,
    cuerpo,
    incluirFirma,
    firmaHtml,
    incluirPie,
    pieHtml,
  } = req.body;

  if (!destinatario || !asunto || !cuerpo) {
    return res.status(400).json({
      exito: false,
      error: 'Destinatario, asunto y cuerpo del mensaje son requeridos.',
    });
  }

  const configSmtpUsar = smtpConfig || resolverConfigSmtp(req);

  let htmlFinal = `<div style="font-family: Arial, sans-serif; font-size: 13px; color: #27272a; line-height: 1.6;">`;
  const parrafos = cuerpo.split('\n').map((l) => (l.trim() ? `<p>${l}</p>` : '<br>')).join('\n');
  htmlFinal += `${parrafos}`;

  if (incluirFirma && firmaHtml) {
    htmlFinal += `<div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #e4e4e7;">${firmaHtml}</div>`;
  }

  if (incluirPie && pieHtml) {
    htmlFinal += `<div style="margin-top: 30px; padding-top: 12px; border-top: 1px dashed #d4d4d8; font-size: 11px; color: #71717a;">${pieHtml}</div>`;
  }
  htmlFinal += `</div>`;

  const nuevoId = `msg-new-${Date.now()}`;
  const remitenteCorreo = configSmtpUsar?.correoRemitente || configSmtpUsar?.usuarioSmtp || 'ventas@empresa.com.do';
  const remitenteNombre = configSmtpUsar?.nombreRemitente || 'Departamento Comercial CRM';

  if (configSmtpUsar && !esConfiguracionDemo(configSmtpUsar)) {
    try {
      const transporter = crearTransporter(configSmtpUsar);
      await transporter.sendMail({
        from: `"${remitenteNombre}" <${remitenteCorreo}>`,
        to: destinatario,
        cc: cc || undefined,
        bcc: cco || undefined,
        subject: asunto,
        text: cuerpo,
        html: htmlFinal,
      });
    } catch (err) {
      return res.status(500).json({ exito: false, error: traducirErrorSmtp(err.code, err.message) });
    }
  }

  const mensajeEnviado = {
    id: nuevoId,
    uid: Math.floor(Math.random() * 9000) + 1000,
    carpeta: 'enviados',
    de: { nombre: remitenteNombre, correo: remitenteCorreo },
    para: [{ nombre: destinatario, correo: destinatario }],
    cc: cc ? [{ nombre: cc, correo: cc }] : undefined,
    asunto,
    extracto: cuerpo.substring(0, 120) + '...',
    cuerpoTexto: cuerpo,
    cuerpoHtml: htmlFinal,
    fecha: new Date().toISOString(),
    leido: true,
    destacado: false,
    tieneAdjuntos: false,
  };

  correosEnMemoria.unshift(mensajeEnviado);

  res.json({
    exito: true,
    mensajeId: nuevoId,
    mensajeEnviado,
    mensaje: 'Correo enviado y registrado en Enviados con éxito.',
  });
});

// ─── ENVIAR CORREO INDIVIDUAL CON ADJUNTO PDF ────────────────────────────────
app.post('/api/email/enviar', async (req, res) => {
  const { smtpConfig, destinatario, asunto, cuerpo, adjuntoNombre, adjuntoBase64 } = req.body;
  const config = smtpConfig || resolverConfigSmtp(req);

  if (!config?.servidorSmtp || !destinatario || !asunto) {
    return res.status(400).json({ exito: false, error: 'Faltan campos obligatorios: servidorSmtp, destinatario, asunto.' });
  }

  if (esConfiguracionDemo(config)) {
    console.log(`[SMTP SIMULACIÓN] Despacho a: ${destinatario} | Asunto: "${asunto}" | Adjunto: "${adjuntoNombre}"`);
    return res.json({
      exito: true,
      messageId: `<sim-${Date.now()}@crm-local>`,
      modo: 'demo',
      mensaje: 'Envío registrado exitosamente en modo simulación.',
    });
  }

  try {
    const transporter = crearTransporter(config);
    const attachments = [];
    if (adjuntoBase64 && adjuntoNombre) {
      const base64Data = adjuntoBase64.includes(',') ? adjuntoBase64.split(',')[1] : adjuntoBase64;
      attachments.push({ filename: adjuntoNombre, content: base64Data, encoding: 'base64', contentType: 'application/pdf' });
    }

    const info = await transporter.sendMail({
      from: `"${config.nombreRemitente || 'CRM'}" <${config.correoRemitente || config.usuarioSmtp}>`,
      to: destinatario,
      replyTo: config.correoRespuesta || undefined,
      subject: asunto,
      text: cuerpo,
      html: convertirTextoAHtml(cuerpo, adjuntoNombre),
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
  const config = smtpConfig || resolverConfigSmtp(req);

  if (!config?.servidorSmtp || !Array.isArray(correos) || correos.length === 0) {
    return res.status(400).json({ exito: false, error: 'Faltan campos: smtpConfig y array de correos.' });
  }

  if (esConfiguracionDemo(config)) {
    console.log(`[SMTP MASIVO SIMULACIÓN] Despacho de ${correos.length} correos en modo simulación`);
    const resultados = correos.map((c) => ({
      destinatario: c.destinatario,
      exito: true,
      messageId: `<sim-${Date.now()}-${Math.random().toString(36).substring(2, 6)}@crm-local>`,
      modo: 'demo',
    }));
    return res.json({
      exito: true,
      total: correos.length,
      exitosos: correos.length,
      fallidos: 0,
      resultados,
      modo: 'demo',
    });
  }

  const transporter = crearTransporter(config);
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
        from: `"${config.nombreRemitente || 'CRM'}" <${config.correoRemitente || config.usuarioSmtp}>`,
        to: destinatario,
        replyTo: config.correoRespuesta || undefined,
        subject: asunto,
        text: cuerpo,
        html: convertirTextoAHtml(cuerpo, adjuntoNombre),
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

function convertirTextoAHtml(texto, nombreAdjunto = null) {
  if (!texto) return '';

  const lineas = texto.split('\n');
  let contenidoHtml = '';
  let firmaHtml = '';
  let enFirma = false;

  for (const line of lineas) {
    if (line.trim().startsWith('--')) {
      enFirma = true;
      const contenidoFirma = line.replace(/^--\s*/, '').trim();
      if (contenidoFirma) {
        firmaHtml += `<p style="margin: 3px 0;">${contenidoFirma}</p>`;
      }
      continue;
    }

    if (enFirma) {
      if (line.trim()) {
        firmaHtml += `<p style="margin: 3px 0;">${line}</p>`;
      }
    } else {
      if (line.trim()) {
        contenidoHtml += `<p style="margin: 0 0 12px 0; line-height: 1.65;">${line}</p>`;
      } else {
        contenidoHtml += `<div style="height: 8px;"></div>`;
      }
    }
  }

  const badgeAdjunto = nombreAdjunto ? `
    <div style="margin-bottom: 20px; padding: 10px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
      <table cellpadding="0" cellspacing="0" border="0" style="font-size: 12px; color: #334155;">
        <tr>
          <td style="padding-right: 8px; font-size: 14px;">📎</td>
          <td style="font-weight: 600; color: #0f172a; padding-right: 6px;">Documento Adjunto:</td>
          <td style="color: #4f46e5; font-weight: 600;">${nombreAdjunto}</td>
          <td style="padding-left: 8px; font-size: 11px; color: #64748b;">(PDF Oficial B2B Verificado)</td>
        </tr>
      </table>
    </div>
  ` : '';

  const bloqueFirma = firmaHtml ? `
    <div style="margin-top: 26px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #475569; font-size: 11.5px; line-height: 1.5;">
      ${firmaHtml}
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comunicación Oficial</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="height: 4px; background-color: #0f172a; border-bottom: 2px solid #4f46e5;"></div>
    <div style="padding: 28px 26px; font-size: 13.5px; line-height: 1.6; color: #334155;">
      ${badgeAdjunto}
      ${contenidoHtml}
      ${bloqueFirma}
    </div>
    <div style="padding: 14px 26px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 10.5px; color: #94a3b8; text-align: center; line-height: 1.4;">
      Este mensaje y sus documentos adjuntos son de carácter confidencial y para uso exclusivo del destinatario.<br>
      Conforme a la Ley No. 126-02 y Ley No. 172-13 sobre Protección de Datos de la República Dominicana.
    </div>
  </div>
</body>
</html>`;
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
  console.log(`   GET   /api/email/estado          → Health check`);
  console.log(`   POST  /api/email/configuracion   → Guardar configuración`);
  console.log(`   POST  /api/email/sincronizar     → Sincronizar IMAP real`);
  console.log(`   GET   /api/email/carpetas        → Listar carpetas y contadores`);
  console.log(`   GET   /api/email/mensajes        → Bandeja y paginación`);
  console.log(`   POST  /api/email/responder       → Responder correo con firma y cita`);
  console.log(`   POST  /api/email/redactar        → Redactar nuevo correo`);
  console.log(`   POST  /api/email/probar-conexion → Test SMTP handshake`);
  console.log(`   POST  /api/email/probar-imap     → Test IMAP handshake\n`);
});
