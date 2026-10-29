/**
 * CRM Email API Server Ã¢â‚¬â€ Nodemailer & ImapFlow Bridge
 * Puerto: 3002 (o PORT / EMAIL_PORT de entorno)
 * 
 * Rutas:
 *   GET    /api/email/estado              Ã¢â€ â€™ Health check
 *   POST   /api/email/configuracion       Ã¢â€ â€™ Guardar configuraciÃƒÂ³n persistente
 *   GET    /api/email/configuracion       Ã¢â€ â€™ Obtener configuraciÃƒÂ³n activa
 *   POST   /api/email/probar-conexion     Ã¢â€ â€™ Test SMTP handshake
 *   POST   /api/email/probar-imap         Ã¢â€ â€™ Test IMAP handshake
 *   POST   /api/email/sincronizar         Ã¢â€ â€™ Sincronizar correos reales vÃƒÂ­a IMAP
 *   GET/POST /api/email/carpetas          Ã¢â€ â€™ Lista de carpetas con contadores reales
 *   GET/POST /api/email/mensajes          Ã¢â€ â€™ Lista de correos paginados por carpeta
 *   GET    /api/email/mensajes/:id        Ã¢â€ â€™ Detalle completo de un correo
 *   PATCH  /api/email/mensajes/:id        Ã¢â€ â€™ Actualizar leido/destacado/mover carpeta
 *   POST   /api/email/responder           Ã¢â€ â€™ Responder correo citando original y firma
 *   POST   /api/email/redactar            Ã¢â€ â€™ Redactar nuevo correo con firma y pie
 *   POST   /api/email/enviar              Ã¢â€ â€™ Enviar correo individual con adjunto PDF
 *   POST   /api/email/enviar-masivo       Ã¢â€ â€™ EnvÃƒÂ­o masivo a lista de clientes
 */

import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.join(__dirname, 'email-config.json');
const EMPRESA_FILE = path.join(__dirname, 'empresa-config.json');
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}
}
const EMAILS_DB_FILE = path.join(DATA_DIR, 'emails-db.json');
const CARPETAS_DB_FILE = path.join(DATA_DIR, 'carpetas-db.json');

import whatsappRoutes from './whatsapp/whatsapp-routes.js';
import { whatsAppService } from './whatsapp/whatsapp-service.js';
import { servicioEscuchaEmail } from './email-listener.js';
import { opcionesTls } from './tls-options.js';
import { crearMiddlewareAuth, firmarToken, resolverConfiguracionAuth } from './security/api-auth.js';
import { crearMiddlewareRateLimit, ipDe } from './security/rate-limit.js';
import { cabecerasSeguridad, manejarErrores, sinCache, validarOrigen } from './security/http.js';
import { extraerHostsCorreo, validarHostDestino } from './security/network-guard.js';
import { crearAlmacenUsuariosDesdeEntorno } from './auth/user-store.js';
import { crearRutasUsuarios } from './auth/user-routes.js';
import { crearMiddlewareAuditoria, crearRutasAuditoria } from './audit/audit-routes.js';
import { crearRegistroAuditoriaDesdeEntorno } from './audit/audit-log.js';
import { crearRutasClientes } from './clientes/cliente-routes.js';
import { crearAlmacenClientesDesdeEntorno } from './clientes/cliente-store.js';
import { crearRutasActividades } from './agenda/actividad-routes.js';
import { crearAlmacenActividadesDesdeEntorno } from './agenda/actividad-store.js';
import { crearRutasCatalogo, crearRutasCotizaciones } from './catalogo/cotizacion-routes.js';
import { crearAlmacenCatalogoDesdeEntorno } from './catalogo/catalogo-store.js';
import { crearAlmacenCotizacionesDesdeEntorno } from './catalogo/cotizacion-store.js';
import { crearRutasRoles } from './roles/rol-routes.js';
import { crearAlmacenRolesDesdeEntorno } from './roles/rol-store.js';
import { crearRutasPipelines } from './pipeline/pipeline-routes.js';
import { crearAlmacenPipelinesDesdeEntorno } from './pipeline/pipeline-store.js';

const app = express();
const PORT = process.env.EMAIL_PORT || process.env.PORT || 3002;
const HOST = process.env.HOST || '127.0.0.1';
const ORIGENES_PERMITIDOS = (
  process.env.CRM_ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((origen) => origen.trim())
  .filter(Boolean);
const AUTENTICACION = resolverConfiguracionAuth(process.env);
const USUARIOS = crearAlmacenUsuariosDesdeEntorno(process.env);
const AUDITORIA = crearRegistroAuditoriaDesdeEntorno(process.env);
const CLIENTES = crearAlmacenClientesDesdeEntorno(process.env);
const ACTIVIDADES = crearAlmacenActividadesDesdeEntorno(process.env);
const CATALOGO = crearAlmacenCatalogoDesdeEntorno(process.env);
const COTIZACIONES = crearAlmacenCotizacionesDesdeEntorno(process.env);
const ROLES = crearAlmacenRolesDesdeEntorno(process.env);
const PIPELINES = crearAlmacenPipelinesDesdeEntorno(process.env);
const PERMITIR_HOSTS_PRIVADOS = process.env.EMAIL_ALLOW_PRIVATE_HOSTS === 'true';

app.locals.autenticacion = AUTENTICACION;
app.locals.usuarios = USUARIOS;
app.locals.auditoria = AUDITORIA;
app.locals.clientes = CLIENTES;
app.locals.actividades = ACTIVIDADES;
app.locals.catalogo = CATALOGO;
app.locals.cotizaciones = COTIZACIONES;
app.locals.roles = ROLES;
app.locals.pipelines = PIPELINES;

const limitarLogin = crearMiddlewareRateLimit({
  maximo: 10,
  ventanaMs: 15 * 60 * 1000,
  mensaje: 'Demasiados intentos de inicio de sesiÃ³n. Espera unos minutos.',
});
const limitarOtp = crearMiddlewareRateLimit({
  maximo: 20,
  ventanaMs: 15 * 60 * 1000,
  mensaje: 'Demasiadas solicitudes de cÃ³digo. Espera unos minutos.',
});
const limitarEnvioCorreo = crearMiddlewareRateLimit({
  maximo: 60,
  ventanaMs: 60 * 60 * 1000,
  mensaje: 'Se alcanzÃ³ el lÃ­mite de envÃ­os por hora.',
});

app.disable('x-powered-by');
app.use(cabecerasSeguridad);
app.use(
  cors({
    origin(origen, callback) {
      if (!origen || ORIGENES_PERMITIDOS.includes(origen)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    maxAge: 600,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(validarOrigen(ORIGENES_PERMITIDOS));
app.use('/api', sinCache);
app.use('/api', crearMiddlewareRateLimit({
  maximo: 600,
  ventanaMs: 5 * 60 * 1000,
  obtenerClave: ipDe,
}));
app.use('/api', crearMiddlewareAuth({
  requerir: AUTENTICACION.requerir,
  apiKey: AUTENTICACION.apiKey,
  secreto: AUTENTICACION.secreto,
  usuarios: USUARIOS,
  rutasPublicas: [
    '/health',
    '/auth/login',
    '/whatsapp/auth/solicitar-otp',
    '/whatsapp/auth/verificar-otp',
    '/cotizaciones/publicas/*',
  ],
}));
app.use('/api', crearMiddlewareAuditoria(AUDITORIA));
app.use('/api/whatsapp/auth', limitarOtp);
app.use(['/api/email/responder', '/api/email/redactar', '/api/email/enviar', '/api/email/enviar-masivo'], limitarEnvioCorreo);

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    autenticacionRequerida: AUTENTICACION.requerir,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/auth/login', limitarLogin, (req, res) => {
  const { email, contrasena } = req.body || {};
  const correoIntento = String(email || '').trim().toLowerCase();
  if (!email || !contrasena) {
    req.auditoria = {
      accion: 'auth.login',
      entidad: 'sesion',
      actorEmail: correoIntento,
      detalle: 'Solicitud de inicio de sesión incompleta.',
    };
    return res.status(400).json({ ok: false, error: 'Correo y contraseÃ±a son requeridos.' });
  }
  if (!USUARIOS.estaConfigurado()) {
    req.auditoria = {
      accion: 'auth.login',
      entidad: 'sesion',
      actorEmail: correoIntento,
      detalle: 'La autenticación del servidor no está configurada.',
    };
    return res.status(503).json({ ok: false, error: 'La autenticaciÃ³n del servidor aÃºn no estÃ¡ configurada.' });
  }

  const usuario = USUARIOS.validarCredenciales(email, contrasena);
  if (!usuario) {
    req.auditoria = {
      accion: 'auth.login',
      entidad: 'sesion',
      actorEmail: correoIntento,
      detalle: 'Credenciales inválidas.',
    };
    return res.status(401).json({ ok: false, error: 'Credenciales invÃ¡lidas.' });
  }
  if (!usuario.activo) {
    req.auditoria = {
      accion: 'auth.login',
      entidad: 'sesion',
      actorEmail: correoIntento,
      detalle: 'Cuenta de usuario desactivada.',
    };
    return res.status(403).json({ ok: false, error: 'Esta cuenta de usuario estÃ¡ desactivada.' });
  }
  if (!AUTENTICACION.secretoConfigurado) {
    req.auditoria = {
      accion: 'auth.login',
      entidad: 'sesion',
      entidadId: usuario.id,
      detalle: 'CRM_SESSION_SECRET no está configurado.',
    };
    return res.status(503).json({ ok: false, error: 'CRM_SESSION_SECRET no estÃ¡ configurado.' });
  }

  const token = firmarToken(
    { sub: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre },
    { secreto: AUTENTICACION.secreto, ttlMs: AUTENTICACION.ttlMs }
  );
  USUARIOS.actualizarUltimoAcceso(usuario.id);

  req.auth = {
    tipo: 'sesion',
    sub: usuario.id,
    email: usuario.email,
    rol: usuario.rol,
    nombre: usuario.nombre,
  };
  req.auditoria = {
    accion: 'auth.login',
    entidad: 'sesion',
    entidadId: usuario.id,
    detalle: 'Inicio de sesión con contraseña.',
  };

  return res.json({
    ok: true,
    token,
    expiraEn: new Date(Date.now() + AUTENTICACION.ttlMs).toISOString(),
    usuario: USUARIOS.publico(usuario),
  });
});

app.get('/api/auth/me', (req, res) => {
  if (req.auth?.tipo === 'api-key') {
    return res.json({ ok: true, tipo: 'api-key', usuario: null });
  }

  const usuario = USUARIOS.buscarPorId(req.auth?.sub);
  if (!usuario || !usuario.activo) {
    return res.status(401).json({ ok: false, error: 'SesiÃ³n no vÃ¡lida.' });
  }

  return res.json({ ok: true, tipo: 'sesion', usuario: USUARIOS.publico(usuario) });
});

app.use('/api/usuarios', crearRutasUsuarios());
app.use('/api/auditoria', crearRutasAuditoria());
app.use('/api/clientes', crearRutasClientes());
app.use('/api/actividades', crearRutasActividades());
app.use('/api/catalogo', crearRutasCatalogo());
app.use('/api/cotizaciones', crearRutasCotizaciones());
app.use('/api/roles', crearRutasRoles());
app.use('/api/pipelines', crearRutasPipelines());

async function validarDestinosCorreo(req, res, next) {
  const hosts = extraerHostsCorreo(req.body);
  if (hosts.length === 0) return next();

  for (const host of hosts) {
    if (esHostDemo(host)) continue;
    try {
      await validarHostDestino(host, { permitirPrivadas: PERMITIR_HOSTS_PRIVADOS });
    } catch (err) {
      return res.status(400).json({ ok: false, error: err.message });
    }
  }

  return next();
}

app.use('/api/email', validarDestinosCorreo);

// Montar Rutas de WhatsApp Bridge
app.use('/api/whatsapp', whatsappRoutes);

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ PERSISTENCIA DE EMPRESA (BASE DE DATOS SERVIDOR) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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

function sanitizarConfiguracionConEmpresa(config) {
  if (!config) return config;
  const emp = datosEmpresaActiva || {};
  const nombreEmp = emp.razonSocial || emp.nombreComercial || '';
  const rnc = emp.identificacionFiscal ? `RNC: ${emp.identificacionFiscal}` : '';
  const dir = [emp.direccion, emp.ciudad, emp.pais].filter(Boolean).join(', ');
  const tel = emp.telefono ? `Tel: ${emp.telefono}` : '';
  const web = emp.sitioWeb || '';

  // La firma institucional siempre se deriva del perfil de empresa persistido.
  if (nombreEmp) {
    config.firmaTexto = `Atentamente,\nDepartamento Comercial & FacturaciÃƒÂ³n B2B\n${nombreEmp}${rnc ? ' Ã¢â‚¬Â¢ ' + rnc : ''}\n${dir}\n${tel}${web ? ' | ' + web : ''}`.trim();
  }
  if (emp.nombreComercial || emp.razonSocial) {
    config.nombreRemitente = `${emp.nombreComercial || emp.razonSocial} Ã¢â‚¬â€ Departamento Comercial`;
  }
  config.correoRemitente = config.correoRemitente || config.usuarioSmtp || emp.correo || '';
  config.correoRespuesta = config.correoRespuesta || config.correoRemitente || emp.correo || '';
  return config;
}

function resolverIdentidadRemitente(config) {
  const empresa = datosEmpresaActiva || {};
  return {
    correo: config?.correoRemitente || config?.usuarioSmtp || empresa.correo || '',
    nombre: config?.nombreRemitente || empresa.nombreComercial || empresa.razonSocial || '',
    respuesta: config?.correoRespuesta || config?.correoRemitente || config?.usuarioSmtp || empresa.correo || '',
  };
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ PERSISTENCIA DE CONFIGURACIÃƒâ€œN Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
let configuracionActiva = null;

function cargarConfiguracionServidor() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      configuracionActiva = sanitizarConfiguracionConEmpresa(JSON.parse(data));
      console.log(`[CONFIG] ConfiguraciÃƒÂ³n cargada desde email-config.json para: ${configuracionActiva.usuarioSmtp || configuracionActiva.usuarioImap}`);
    }
  } catch (err) {
    console.warn('[CONFIG] No se pudo leer email-config.json:', err.message);
  }
}
cargarConfiguracionServidor();

function guardarConfiguracionServidor(config) {
  try {
    configuracionActiva = sanitizarConfiguracionConEmpresa({ ...(configuracionActiva || {}), ...config });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(configuracionActiva, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[CONFIG] Error al guardar email-config.json:', err.message);
    return false;
  }
}

function guardarEmpresaServidor(datos) {
  try {
    datosEmpresaActiva = { ...(datosEmpresaActiva || {}), ...datos, ultimaActualizacion: new Date().toISOString() };
    fs.writeFileSync(EMPRESA_FILE, JSON.stringify(datosEmpresaActiva, null, 2), 'utf8');
    // Si cambia la empresa, re-sanitizar firma de correo
    if (configuracionActiva) {
      sanitizarConfiguracionConEmpresa(configuracionActiva);
      try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(configuracionActiva, null, 2), 'utf8');
      } catch {}
    }
    return true;
  } catch (err) {
    console.error('[EMPRESA DB] Error al guardar empresa-config.json:', err.message);
    return false;
  }
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ HEALTH CHECK Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.get('/api/email/estado', (_req, res) => {
  res.json({
    ok: true,
    mensaje: 'Servidor de correo CRM activo (SMTP + IMAP)',
    cuentaConfigurada: configuracionActiva?.usuarioImap || configuracionActiva?.usuarioSmtp || null,
    totalCorreosEnMemoria: correosEnMemoria.length,
    servicioEscucha: servicioEscuchaEmail.obtenerEstado(),
    timestamp: new Date().toISOString(),
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ SSE: EVENTOS DE CORREO EN TIEMPO REAL Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.get('/api/email/eventos', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  res.write(': conexion iniciada\n\n');
  servicioEscuchaEmail.suscribirSSE(res);

  req.on('close', () => {
    servicioEscuchaEmail.desuscribirSSE(res);
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ ESTADO Y CONTROL DEL SERVICIO DE ESCUCHA EN SEGUNDO PLANO Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.get('/api/email/servicio-escucha/estado', (_req, res) => {
  res.json({
    ok: true,
    ...servicioEscuchaEmail.obtenerEstado(),
  });
});

app.post('/api/email/servicio-escucha/alternar', async (req, res) => {
  const { activo, intervaloSegundos } = req.body || {};
  if (activo && !servicioEscuchaEmail.activo) {
    await servicioEscuchaEmail.iniciar({
      configGetter: () => configuracionActiva,
      correosEnMemoriaRef: correosEnMemoria,
      guardarDbFn: () => guardarCorreosDb(true),
      parsearMensajeFn: parsearMensajeImap,
      intervaloSegundos: intervaloSegundos || 15,
    });
  } else if (!activo && servicioEscuchaEmail.activo) {
    await servicioEscuchaEmail.detener();
  }
  res.json({
    ok: true,
    ...servicioEscuchaEmail.obtenerEstado(),
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ GUARDAR / OBTENER CONFIGURACIÃƒâ€œN CORREO Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.post('/api/email/configuracion', (req, res) => {
  const config = req.body;
  if (!config) {
    return res.status(400).json({ ok: false, error: 'ConfiguraciÃƒÂ³n vacÃƒÂ­a.' });
  }
  guardarConfiguracionServidor(config);

  // Si tiene IMAP habilitado, reiniciar el escuchador con las nuevas credenciales
  if (configuracionActiva?.habilitarImap) {
    servicioEscuchaEmail.detener().then(() => {
      servicioEscuchaEmail.iniciar({
        configGetter: () => configuracionActiva,
        correosEnMemoriaRef: correosEnMemoria,
        guardarDbFn: () => guardarCorreosDb(true),
        parsearMensajeFn: parsearMensajeImap,
        intervaloSegundos: 15,
      }).catch(() => {});
    });
  }

  res.json({
    ok: true,
    mensaje: 'ConfiguraciÃƒÂ³n de correo guardada en el servidor exitosamente.',
  });
});

app.get('/api/email/configuracion', (_req, res) => {
  res.json({
    ok: true,
    configuracion: configuracionActiva
      ? {
          ...configuracionActiva,
          contrasenaSmtp: configuracionActiva.contrasenaSmtp ? 'Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢' : '',
          contrasenaImap: configuracionActiva.contrasenaImap ? 'Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢' : '',
        }
      : null,
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ OBTENER / ACTUALIZAR PERFIL DE EMPRESA (DB) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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
    return res.status(400).json({ ok: false, error: 'Datos de empresa invÃƒÂ¡lidos.' });
  }
  const exito = guardarEmpresaServidor(datos);
  res.json({
    ok: exito,
    empresa: datosEmpresaActiva,
    mensaje: 'Perfil de empresa guardado exitosamente en base de datos.',
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ COMPROBACIÃƒâ€œN DE CONFIGURACIÃƒâ€œN DEMO / VACÃƒÂA Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
function esHostDemo(host) {
  const valor = String(host || '').toLowerCase().trim();
  return valor === 'simulacion' || valor.includes('empresa.com.do');
}

function esConfiguracionDemo(config) {
  if (!config) return true;
  const s = (config.servidorSmtp || config.servidorImap || '').toLowerCase();
  const c = (config.contrasenaSmtp || config.contrasenaImap || '').trim();
  return (
    s === 'simulacion' ||
    s.includes('empresa.com.do') ||
    c === '' ||
    c.includes('Ã¢â‚¬Â¢Ã¢â‚¬Â¢') ||
    c.includes('\u2022') ||
    /^[\*\Ã¢â‚¬Â¢\?\s]+$/.test(c)
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

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ PERSISTENCIA DE BASE DE DATOS DE CORREOS Y CARPETAS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
let correosEnMemoria = [];
let carpetasPersonalizadasDb = [];

const CARPETAS_PREDETERMINADAS = [
  { id: 'facturacion', nombre: 'FacturaciÃƒÂ³n y Pagos', color: 'emerald', creadaEn: new Date().toISOString() },
  { id: 'verafeca', nombre: 'Verafeca SRL', color: 'indigo', creadaEn: new Date().toISOString() },
  { id: 'licitaciones', nombre: 'Licitaciones PÃƒÂºblicas', color: 'amber', creadaEn: new Date().toISOString() },
  { id: 'proveedores', nombre: 'Proveedores', color: 'sky', creadaEn: new Date().toISOString() },
];

function cargarCarpetasDb() {
  try {
    if (fs.existsSync(CARPETAS_DB_FILE)) {
      const data = fs.readFileSync(CARPETAS_DB_FILE, 'utf8');
      carpetasPersonalizadasDb = JSON.parse(data);
      console.log(`[CARPETAS DB] ${carpetasPersonalizadasDb.length} carpetas personalizadas cargadas de la base de datos.`);
    } else {
      carpetasPersonalizadasDb = [...CARPETAS_PREDETERMINADAS];
      fs.writeFileSync(CARPETAS_DB_FILE, JSON.stringify(carpetasPersonalizadasDb, null, 2), 'utf8');
    }
  } catch (err) {
    console.warn('[CARPETAS DB] Error al leer carpetas-db.json:', err.message);
    carpetasPersonalizadasDb = [...CARPETAS_PREDETERMINADAS];
  }
}
cargarCarpetasDb();

function guardarCarpetasDb() {
  try {
    fs.writeFileSync(CARPETAS_DB_FILE, JSON.stringify(carpetasPersonalizadasDb, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[CARPETAS DB] Error al guardar carpetas-db.json:', err.message);
    return false;
  }
}

function cargarCorreosDb() {
  try {
    if (fs.existsSync(EMAILS_DB_FILE)) {
      const data = fs.readFileSync(EMAILS_DB_FILE, 'utf8');
      correosEnMemoria = JSON.parse(data);
      console.log(`[EMAILS DB] ${correosEnMemoria.length} correos cargados exitosamente de la base de datos local.`);
    } else {
      correosEnMemoria = [];
      fs.writeFileSync(EMAILS_DB_FILE, JSON.stringify([], null, 2), 'utf8');
    }
  } catch (err) {
    console.warn('[EMAILS DB] Error al leer emails-db.json:', err.message);
    correosEnMemoria = [];
  }
}
cargarCorreosDb();

let timerGuardadoEmails = null;
function guardarCorreosDb(inmediato = false) {
  const ejecutar = () => {
    try {
      fs.writeFileSync(EMAILS_DB_FILE, JSON.stringify(correosEnMemoria, null, 2), 'utf8');
    } catch (err) {
      console.error('[EMAILS DB] Error al guardar emails-db.json:', err.message);
    }
  };
  if (inmediato) {
    if (timerGuardadoEmails) clearTimeout(timerGuardadoEmails);
    ejecutar();
  } else {
    if (timerGuardadoEmails) clearTimeout(timerGuardadoEmails);
    timerGuardadoEmails = setTimeout(ejecutar, 300);
  }
}

function obtenerListaCarpetas() {
  const carpetas = [
    {
      id: 'inbox',
      nombre: 'Bandeja de entrada',
      total: correosEnMemoria.filter((c) => c.carpeta === 'inbox').length,
      noLeidos: correosEnMemoria.filter((c) => c.carpeta === 'inbox' && !c.leido).length,
      esPersonalizada: false,
    },
    {
      id: 'enviados',
      nombre: 'Enviados',
      total: correosEnMemoria.filter((c) => c.carpeta === 'enviados').length,
      noLeidos: 0,
      esPersonalizada: false,
    },
    {
      id: 'borradores',
      nombre: 'Borradores',
      total: correosEnMemoria.filter((c) => c.carpeta === 'borradores').length,
      noLeidos: 0,
      esPersonalizada: false,
    },
    {
      id: 'archivados',
      nombre: 'Archivados',
      total: correosEnMemoria.filter((c) => c.carpeta === 'archivados').length,
      noLeidos: 0,
      esPersonalizada: false,
    },
    {
      id: 'papelera',
      nombre: 'Papelera',
      total: correosEnMemoria.filter((c) => c.carpeta === 'papelera').length,
      noLeidos: 0,
      esPersonalizada: false,
    },
  ];

  for (const c of carpetasPersonalizadasDb) {
    carpetas.push({
      id: c.id,
      nombre: c.nombre,
      color: c.color || 'indigo',
      creadaEn: c.creadaEn,
      total: correosEnMemoria.filter((m) => m.carpeta === c.id).length,
      noLeidos: correosEnMemoria.filter((m) => m.carpeta === c.id && !m.leido).length,
      esPersonalizada: true,
    });
  }

  return carpetas;
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ BÃƒÅ¡SQUEDA DE MAILBOX SEGÃƒÅ¡N CARPETA Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ PARSEO REUTILIZABLE DE MENSAJES IMAP Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
async function parsearMensajeImap(msg, config, carpetaEfectiva, esCoincidenciaServidor = false) {
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
      att.content && att.content.length < 5000000
        ? `data:${att.contentType};base64,${att.content.toString('base64')}`
        : undefined,
  }));

  return {
    id: `msg-imap-${msg.uid}`,
    uid: msg.uid,
    carpeta: carpetaEfectiva,
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
    esCoincidenciaServidor: !!esCoincidenciaServidor,
  };
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ LÃƒâ€œGICA DE SINCRONIZACIÃƒâ€œN IMAP INCREMENTAL (DELTA & SCROLL LAZY-LOAD SYNC) Ã¢â€â‚¬Ã¢â€â‚¬
async function sincronizarCorreosImap(config, carpetaSolicitada = 'inbox', limite = 35, offset = 0) {
  if (!config || esConfiguracionDemo(config)) {
    return {
      exito: false,
      mensaje: 'La cuenta no tiene credenciales IMAP vÃƒÂ¡lidas o estÃƒÂ¡ en modo simulaciÃƒÂ³n.',
      sincronizados: 0,
      hayMas: false,
      modo: 'demo',
    };
  }

  // Si la carpeta solicitada es personalizada, sincronizamos la Bandeja de entrada remota
  const esEstandar = ['inbox', 'enviados', 'borradores', 'archivados', 'papelera'].includes(carpetaSolicitada);
  const carpetaEfectiva = esEstandar ? carpetaSolicitada : 'inbox';

  const client = new ImapFlow({
    host: config.servidorImap,
    port: parseInt(config.puertoImap || '993'),
    secure: config.seguridadImap === 'ssl' || parseInt(config.puertoImap) === 993,
    auth: {
      user: config.usuarioImap,
      pass: config.contrasenaImap,
    },
    logger: false,
    tls: opcionesTls(),
    connectionTimeout: 12000,
    socketTimeout: 20000,
  });

  const mensajesNuevos = [];
  let flagsActualizados = 0;
  let totalExistentes = 0;
  let hayMas = false;

  try {
    await client.connect();

    const mailboxes = await client.list();
    const mailboxTarget = mapearMailbox(mailboxes, carpetaEfectiva);

    if (!mailboxTarget) {
      await client.logout();
      return {
        exito: true,
        mensaje: `No se encontrÃƒÂ³ carpeta remota para "${carpetaEfectiva}" en el servidor.`,
        sincronizados: 0,
        hayMas: false,
      };
    }

    const lock = await client.getMailboxLock(mailboxTarget);
    try {
      totalExistentes = client.mailbox.exists || 0;
      if (totalExistentes > 0) {
        const endSeq = Math.max(1, totalExistentes - offset);
        if (endSeq <= 1 && offset > 0) {
          hayMas = false;
        } else {
          const startSeq = Math.max(1, endSeq - limite + 1);
          hayMas = startSeq > 1;
          const range = `${startSeq}:${endSeq}`;

          for await (let msg of client.fetch(range, {
            uid: true,
            flags: true,
            envelope: true,
            source: true,
          })) {
            // Comprobar si ya existe en la base de datos local
            const yaGuardado = correosEnMemoria.find((c) => c.uid === msg.uid || c.id === `msg-imap-${msg.uid}`);
            if (yaGuardado) {
              // Actualizar solo banderas (leÃƒÂ­do, destacado) en milisegundos
              if (msg.flags) {
                const nuevoLeido = msg.flags.has('\\Seen');
                const nuevoDestacado = msg.flags.has('\\Flagged');
                if (yaGuardado.leido !== nuevoLeido || yaGuardado.destacado !== nuevoDestacado) {
                  yaGuardado.leido = nuevoLeido;
                  yaGuardado.destacado = nuevoDestacado;
                  flagsActualizados++;
                }
              }
              continue; // Saltar descarga pesada y parseo
            }

            const mensajeMapeado = await parsearMensajeImap(msg, config, carpetaEfectiva, false);
            mensajesNuevos.push(mensajeMapeado);
          }
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();

    // Guardar en la base de datos persistente
    if (mensajesNuevos.length > 0) {
      for (const msg of mensajesNuevos) {
        if (!correosEnMemoria.some((c) => c.id === msg.id || c.uid === msg.uid)) {
          correosEnMemoria.push(msg);
        }
        // Emitir evento SSE en tiempo real a clientes web conectados
        servicioEscuchaEmail.emitirEvento('correo_nuevo', msg);
      }
      correosEnMemoria.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      guardarCorreosDb(true);

      // Actualizar ÃƒÂºltimo UID conocido en el servicio de escucha
      const maxUid = Math.max(...mensajesNuevos.map((m) => m.uid || 0));
      if (maxUid > servicioEscuchaEmail.ultimoUidConocido) {
        servicioEscuchaEmail.ultimoUidConocido = maxUid;
      }
    } else if (flagsActualizados > 0) {
      guardarCorreosDb(true);
    }

    console.log(`[IMAP SYNC OK] ${mensajesNuevos.length} correos nuevos guardados en DB (${flagsActualizados} estados actualizados). Total en base de datos: ${correosEnMemoria.length} (hayMas: ${hayMas})`);

    return {
      exito: true,
      mensaje: mensajesNuevos.length > 0
        ? `Se guardaron ${mensajesNuevos.length} correos en la base de datos.`
        : 'Historial al dÃƒÂ­a: no hay mÃƒÂ¡s correos en este rango.',
      sincronizados: mensajesNuevos.length,
      totalExistentes,
      hayMas,
      carpeta: carpetaSolicitada,
      modo: 'real',
    };
  } catch (err) {
    try { await client.logout(); } catch {}
    console.error('[IMAP SYNC ERROR]', err.message);
    return {
      exito: false,
      mensaje: `Error al sincronizar vÃƒÂ­a IMAP: ${err.message}`,
      error: err.message,
      sincronizados: 0,
      hayMas: false,
      modo: 'error',
    };
  }
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ BÃƒÅ¡SQUEDA REMOTA EN SERVIDOR IMAP (ON-DEMAND REMOTE SEARCH) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
async function buscarCorreosRemotoImap(config, busqueda, carpetaSolicitada = 'inbox', limite = 25) {
  if (!config || esConfiguracionDemo(config)) {
    return {
      exito: true,
      mensaje: 'BÃƒÂºsqueda remota completada en simulaciÃƒÂ³n.',
      totalServidor: 0,
      nuevosDescargados: 0,
      mensajes: [],
      modo: 'demo',
    };
  }

  const esEstandar = ['inbox', 'enviados', 'borradores', 'archivados', 'papelera'].includes(carpetaSolicitada);
  const carpetaEfectiva = esEstandar ? carpetaSolicitada : 'inbox';

  const client = new ImapFlow({
    host: config.servidorImap,
    port: parseInt(config.puertoImap || '993'),
    secure: config.seguridadImap === 'ssl' || parseInt(config.puertoImap) === 993,
    auth: {
      user: config.usuarioImap,
      pass: config.contrasenaImap,
    },
    logger: false,
    tls: opcionesTls(),
    connectionTimeout: 12000,
    socketTimeout: 20000,
  });

  try {
    await client.connect();

    const mailboxes = await client.list();
    const mailboxTarget = mapearMailbox(mailboxes, carpetaEfectiva);

    if (!mailboxTarget) {
      await client.logout();
      return {
        exito: true,
        mensaje: `No se encontrÃƒÂ³ carpeta remota para "${carpetaEfectiva}".`,
        totalServidor: 0,
        nuevosDescargados: 0,
        mensajes: [],
      };
    }

    const lock = await client.getMailboxLock(mailboxTarget);
    const mensajesDescargados = [];
    let totalCoincidencias = 0;

    try {
      const termino = busqueda.trim();
      let uids = [];
      try {
        uids = await client.search(
          {
            or: [
              { subject: termino },
              { from: termino },
              { body: termino },
            ],
          },
          { uid: true }
        );
      } catch (errSearch1) {
        console.warn('[IMAP SEARCH CRITERIA FALLBACK]', errSearch1.message);
        try {
          uids = await client.search(
            {
              or: [
                { subject: termino },
                { from: termino },
              ],
            },
            { uid: true }
          );
        } catch (errSearch2) {
          console.error('[IMAP SEARCH ERROR]', errSearch2.message);
          uids = [];
        }
      }

      totalCoincidencias = (uids || []).length;

      // Filtrar los que no estÃƒÂ¡n en nuestra base de datos local
      const uidsExistentes = new Set(correosEnMemoria.filter((c) => c.uid).map((c) => c.uid));
      const uidsFaltantes = (uids || []).filter((uid) => !uidsExistentes.has(uid));

      if (uidsFaltantes.length > 0) {
        // Tomamos los mÃƒÂ¡s recientes (ÃƒÂºltimos N)
        const uidsATraer = uidsFaltantes.slice(-limite);
        for await (let msg of client.fetch(uidsATraer, {
          uid: true,
          flags: true,
          envelope: true,
          source: true,
        })) {
          const m = await parsearMensajeImap(msg, config, carpetaEfectiva, true);
          mensajesDescargados.push(m);
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();

    if (mensajesDescargados.length > 0) {
      for (const msg of mensajesDescargados) {
        if (!correosEnMemoria.some((c) => c.id === msg.id || c.uid === msg.uid)) {
          correosEnMemoria.push(msg);
        }
      }
      correosEnMemoria.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      guardarCorreosDb(true);
    }

    console.log(`[IMAP BUSQUEDA REMOTA] "${busqueda}": ${totalCoincidencias} en servidor, ${mensajesDescargados.length} descargados a DB.`);

    return {
      exito: true,
      mensaje: `BÃƒÂºsqueda remota completada. ${totalCoincidencias} coincidencia(s) en servidor (${mensajesDescargados.length} nuevos indexados).`,
      totalServidor: totalCoincidencias,
      nuevosDescargados: mensajesDescargados.length,
      mensajes: mensajesDescargados,
    };
  } catch (err) {
    try { await client.logout(); } catch {}
    console.error('[IMAP BUSQUEDA REMOTA ERROR]', err.message);
    return {
      exito: false,
      mensaje: `Error al buscar en el servidor IMAP: ${err.message}`,
      error: err.message,
      totalServidor: 0,
      nuevosDescargados: 0,
      mensajes: [],
    };
  }
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ ENDPOINT SINCRONIZAR (Con soporte de scroll/offset) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.post('/api/email/sincronizar', async (req, res) => {
  const config = resolverConfigImap(req);
  const carpeta = (req.body?.carpeta || 'inbox').toLowerCase();
  const limite = parseInt(req.body?.limite || '35');
  const offset = parseInt(req.body?.offset || '0');

  if (!config) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Faltan parÃƒÂ¡metros de configuraciÃƒÂ³n IMAP (servidorImap, usuarioImap, contrasenaImap).',
      sincronizados: 0,
      hayMas: false,
    });
  }

  if (!esConfiguracionDemo(config)) {
    guardarConfiguracionServidor(config);
  }

  const resultado = await sincronizarCorreosImap(config, carpeta, limite, offset);
  const carpetas = obtenerListaCarpetas();

  res.json({
    ...resultado,
    carpetas,
    totalEnMemoria: correosEnMemoria.length,
    totalEnDb: correosEnMemoria.length,
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ ENDPOINT BÃƒÅ¡SQUEDA REMOTA EN SERVIDOR IMAP Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.post('/api/email/buscar-remoto', async (req, res) => {
  const config = resolverConfigImap(req);
  const busqueda = (req.body?.busqueda || '').trim();
  const carpeta = (req.body?.carpeta || 'inbox').toLowerCase();
  const limite = parseInt(req.body?.limite || '25');

  if (!busqueda) {
    return res.status(400).json({
      exito: false,
      mensaje: 'El parÃƒÂ¡metro "busqueda" es obligatorio.',
      totalServidor: 0,
      nuevosDescargados: 0,
      mensajes: [],
    });
  }

  if (!config) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Faltan parÃƒÂ¡metros de configuraciÃƒÂ³n IMAP para realizar la bÃƒÂºsqueda remota.',
      totalServidor: 0,
      nuevosDescargados: 0,
      mensajes: [],
    });
  }

  const resultado = await buscarCorreosRemotoImap(config, busqueda, carpeta, limite);
  res.json({
    ...resultado,
    totalEnDb: correosEnMemoria.length,
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ PROBAR CONEXIÃƒâ€œN SMTP Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.post('/api/email/probar-conexion', async (req, res) => {
  const { servidorSmtp, puertoSmtp, seguridadSmtp, usuarioSmtp, contrasenaSmtp } = req.body;

  if (!servidorSmtp || !usuarioSmtp) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Faltan parÃƒÂ¡metros obligatorios: servidorSmtp y usuarioSmtp.',
    });
  }

  if (esConfiguracionDemo({ servidorSmtp, contrasenaSmtp })) {
    return res.json({
      exito: true,
      mensaje: `ConexiÃƒÂ³n SMTP simulada exitosa en puerto ${PORT}. Servidor listo en modo simulaciÃƒÂ³n.`,
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
      tls: opcionesTls(),
    });

    await transporter.verify();
    const latencia = Date.now() - inicio;

    guardarConfiguracionServidor({ servidorSmtp, puertoSmtp, seguridadSmtp, usuarioSmtp, contrasenaSmtp });

    return res.json({
      exito: true,
      mensaje: `ConexiÃƒÂ³n SMTP exitosa con ${servidorSmtp}:${puertoSmtp} en ${latencia}ms. AutenticaciÃƒÂ³n aceptada para ${usuarioSmtp}.`,
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

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ PROBAR CONEXIÃƒâ€œN IMAP Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.post('/api/email/probar-imap', async (req, res) => {
  const { servidorImap, puertoImap, seguridadImap, usuarioImap, contrasenaImap } = req.body;

  if (!servidorImap || !usuarioImap) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Faltan parÃƒÂ¡metros obligatorios: servidorImap y usuarioImap.',
    });
  }

  if (esConfiguracionDemo({ servidorImap, contrasenaImap })) {
    return res.json({
      exito: true,
      mensaje: `ConexiÃƒÂ³n IMAP simulada exitosa. Bandeja activa en modo simulaciÃƒÂ³n.`,
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
    tls: opcionesTls(),
  });

  try {
    await client.connect();
    const mailboxes = await client.list();
    await client.logout();
    const latencia = Date.now() - inicio;

    guardarConfiguracionServidor({ servidorImap, puertoImap, seguridadImap, usuarioImap, contrasenaImap });

    return res.json({
      exito: true,
      mensaje: `ConexiÃƒÂ³n IMAP exitosa con ${servidorImap}:${puertoImap} en ${latencia}ms. ${mailboxes.length} carpetas detectadas en la cuenta ${usuarioImap}.`,
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
      mensaje: `Error de conexiÃƒÂ³n IMAP: ${err.message || 'Verifique servidor, puerto y contraseÃƒÂ±a de aplicaciÃƒÂ³n.'}`,
      latenciaMs: latencia,
      detalles: { imapConectado: false, autenticacionAceptada: false },
    });
  }
});

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ CARPETAS Y CONTADORES Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ CARPETAS Y CONTADORES Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.all(['/api/email/carpetas'], async (req, res) => {
  // Si envÃƒÂ­an POST con { nombre }, crear carpeta personalizada
  if (req.method === 'POST' && req.body?.nombre && typeof req.body.nombre === 'string') {
    const { nombre, color } = req.body;
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      return res.status(400).json({ ok: false, error: 'Nombre de carpeta requerido.' });
    }
    const id = nombreLimpio
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `carpeta-${Date.now()}`;

    let existente = carpetasPersonalizadasDb.find((c) => c.id === id);
    if (!existente) {
      existente = {
        id,
        nombre: nombreLimpio,
        color: color || 'indigo',
        creadaEn: new Date().toISOString(),
      };
      carpetasPersonalizadasDb.push(existente);
      guardarCarpetasDb();
    }

    return res.json({
      ok: true,
      carpeta: existente,
      carpetas: obtenerListaCarpetas(),
      mensaje: `Carpeta "${existente.nombre}" creada y persistida exitosamente.`,
    });
  }

  const carpetas = obtenerListaCarpetas();
  res.json({
    ok: true,
    carpetas,
    totalNoLeidos: carpetas.find((c) => c.id === 'inbox')?.noLeidos || 0,
    totalCorreos: correosEnMemoria.length,
    cuentaConfigurada: configuracionActiva?.usuarioImap || configuracionActiva?.usuarioSmtp || null,
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ CREAR CARPETA PERSONALIZADA DIRECTAMENTE Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.post(['/api/email/carpetas/crear'], (req, res) => {
  const { nombre, color } = req.body || {};
  const nombreLimpio = (nombre || '').trim();
  if (!nombreLimpio) {
    return res.status(400).json({ ok: false, error: 'El nombre de la carpeta es requerido.' });
  }

  const id = nombreLimpio
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || `carpeta-${Date.now()}`;

  let existente = carpetasPersonalizadasDb.find((c) => c.id === id);
  if (!existente) {
    existente = {
      id,
      nombre: nombreLimpio,
      color: color || 'indigo',
      creadaEn: new Date().toISOString(),
    };
    carpetasPersonalizadasDb.push(existente);
    guardarCarpetasDb();
  }

  res.json({
    ok: true,
    carpeta: existente,
    carpetas: obtenerListaCarpetas(),
    mensaje: `Carpeta "${existente.nombre}" guardada exitosamente en la base de datos.`,
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ ELIMINAR CARPETA PERSONALIZADA (REUBICANDO CORREOS A BANDEJA) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.delete('/api/email/carpetas/:id', (req, res) => {
  const { id } = req.params;
  const standardIds = ['inbox', 'enviados', 'borradores', 'archivados', 'papelera'];

  if (standardIds.includes(id.toLowerCase())) {
    return res.status(400).json({
      ok: false,
      error: 'No se pueden eliminar las carpetas principales del sistema.',
    });
  }

  const idx = carpetasPersonalizadasDb.findIndex((c) => c.id === id);
  if (idx === -1) {
    // Si no estÃƒÂ¡ en la lista de carpetas pero hay correos con esa carpeta, aÃƒÂºn asÃƒÂ­ reubicar
    let reubicados = 0;
    for (const c of correosEnMemoria) {
      if (c.carpeta === id) {
        c.carpeta = 'inbox';
        reubicados++;
      }
    }
    if (reubicados > 0) guardarCorreosDb(true);
    return res.json({
      ok: true,
      mensaje: `Carpeta eliminada y ${reubicados} correo(s) reubicados en Bandeja.`,
      carpetas: obtenerListaCarpetas(),
      reubicados,
    });
  }

  const [eliminada] = carpetasPersonalizadasDb.splice(idx, 1);
  guardarCarpetasDb();

  // Reubicar todos los correos que pertenecÃƒÂ­an a esta carpeta a la Bandeja de entrada
  let reubicados = 0;
  for (const c of correosEnMemoria) {
    if (c.carpeta === id) {
      c.carpeta = 'inbox';
      reubicados++;
    }
  }

  if (reubicados > 0) {
    guardarCorreosDb(true);
  }

  console.log(`[CARPETAS DB] Carpeta "${eliminada.nombre}" (${id}) eliminada. ${reubicados} correos reubicados a inbox.`);

  res.json({
    ok: true,
    mensaje: `Carpeta "${eliminada.nombre}" eliminada exitosamente. ${reubicados} correo(s) se movieron a la Bandeja de entrada.`,
    reubicados,
    carpetaId: id,
    carpetas: obtenerListaCarpetas(),
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ ELIMINAR MENSAJE (O MOVER A PAPELERA) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.delete('/api/email/mensajes/:id', (req, res) => {
  const { id } = req.params;
  const idx = correosEnMemoria.findIndex((c) => c.id === id || String(c.uid) === id);

  if (idx === -1) {
    return res.status(404).json({ ok: false, error: 'Mensaje de correo no encontrado.' });
  }

  const msg = correosEnMemoria[idx];
  // Si ya estÃƒÂ¡ en la papelera, eliminaciÃƒÂ³n definitiva
  if (msg.carpeta === 'papelera') {
    correosEnMemoria.splice(idx, 1);
    guardarCorreosDb(true);
    return res.json({
      ok: true,
      mensaje: 'Mensaje eliminado definitivamente de la base de datos.',
      eliminadoDefinitivo: true,
      id,
    });
  }

  // Si no estÃƒÂ¡ en papelera, mover a papelera
  msg.carpeta = 'papelera';
  guardarCorreosDb(true);

  res.json({
    ok: true,
    mensaje: 'Mensaje movido a la papelera.',
    eliminadoDefinitivo: false,
    id,
    carpeta: 'papelera',
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ UTILIDAD: NORMALIZAR RAÃƒÂZ DE ASUNTO PARA HILOS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
function normalizarRaizAsunto(asunto) {
  if (!asunto) return '';
  return asunto
    .replace(/^(\s*(re|rv|fwd|fw)\s*:\s*)+/gi, '')
    .trim();
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ NOVEDADES RÃƒÂPIDAS (Polling Ligero en Segundo Plano) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.get('/api/email/novedades', (req, res) => {
  const carpeta = (req.query.carpeta || 'inbox').toLowerCase();
  const enCarpeta = correosEnMemoria.filter((c) => c.carpeta === carpeta);
  const noLeidos = enCarpeta.filter((c) => !c.leido).length;
  const masReciente = enCarpeta[0] || null;

  res.json({
    ok: true,
    carpeta,
    total: enCarpeta.length,
    noLeidos,
    ultimoMensajeId: masReciente?.id || null,
    ultimaFecha: masReciente?.fecha || null,
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ OBTENER HILO COMPLETO DE CONVERSACIÃƒâ€œN Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.get('/api/email/hilo/:id', (req, res) => {
  const { id } = req.params;
  const msgOriginal = correosEnMemoria.find((c) => c.id === id || String(c.uid) === id);

  if (!msgOriginal) {
    return res.status(404).json({ ok: false, error: 'Mensaje original no encontrado' });
  }

  const raiz = normalizarRaizAsunto(msgOriginal.asunto).toLowerCase();
  const participantes = [
    msgOriginal.de?.correo?.toLowerCase(),
    ...(msgOriginal.para || []).map((p) => p.correo?.toLowerCase()),
  ].filter(Boolean);

  // Encontrar todos los mensajes con la misma raÃƒÂ­z de asunto y al menos 1 participante en comÃƒÂºn
  const mensajesHilo = correosEnMemoria.filter((c) => {
    const raizC = normalizarRaizAsunto(c.asunto).toLowerCase();
    if (raizC !== raiz) return false;

    const partC = [
      c.de?.correo?.toLowerCase(),
      ...(c.para || []).map((p) => p.correo?.toLowerCase()),
    ].filter(Boolean);

    return participantes.some((p) => partC.includes(p));
  });

  // Orden cronolÃƒÂ³gico para lectura natural de conversaciÃƒÂ³n
  mensajesHilo.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  res.json({
    ok: true,
    asuntoRaiz: normalizarRaizAsunto(msgOriginal.asunto),
    totalMensajes: mensajesHilo.length,
    mensajes: mensajesHilo,
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ LISTAR MENSAJES PAGINADOS (Bandeja / Carpetas / BÃƒÂºsqueda Global) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.all(['/api/email/mensajes'], async (req, res) => {
  const params = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
  const carpeta = (params.carpeta || 'inbox').toLowerCase();
  const pagina = parseInt(params.pagina || '1');
  const limite = parseInt(params.limite || '20');
  const busqueda = (params.busqueda || '').toLowerCase().trim();
  const esBusquedaGlobal = params.global === 'true' || carpeta === 'todas';
  const filtro = params.filtro || 'todos'; // todos | noLeidos | destacados | conAdjuntos

  // Si se solicita sincronizaciÃƒÂ³n explÃƒÂ­cita
  const config = resolverConfigImap(req);
  if (params.sincronizar === 'true' && config && !esConfiguracionDemo(config)) {
    try {
      await sincronizarCorreosImap(config, carpeta === 'todas' ? 'inbox' : carpeta, Math.max(limite * 2, 40));
    } catch (e) {
      console.warn('[AUTO SYNC WARN]', e.message);
    }
  }

  // Filtrar por carpeta o global
  let filtrados = esBusquedaGlobal 
    ? [...correosEnMemoria] 
    : correosEnMemoria.filter((c) => c.carpeta === carpeta);

  // Filtro adicional de estado
  if (filtro === 'noLeidos') {
    filtrados = filtrados.filter((c) => !c.leido);
  } else if (filtro === 'destacados') {
    filtrados = filtrados.filter((c) => !!c.destacado);
  } else if (filtro === 'conAdjuntos') {
    filtrados = filtrados.filter((c) => c.tieneAdjuntos || (c.adjuntos && c.adjuntos.length > 0));
  }

  // BÃƒÂºsqueda profunda en asunto, remitente, destinatarios, extracto y cuerpo
  if (busqueda) {
    filtrados = filtrados.filter((c) => {
      const enAsunto = (c.asunto || '').toLowerCase().includes(busqueda);
      const enDeNombre = (c.de?.nombre || '').toLowerCase().includes(busqueda);
      const enDeCorreo = (c.de?.correo || '').toLowerCase().includes(busqueda);
      const enPara = (c.para || []).some(
        (p) => (p.nombre || '').toLowerCase().includes(busqueda) || (p.correo || '').toLowerCase().includes(busqueda)
      );
      const enExtracto = (c.extracto || '').toLowerCase().includes(busqueda);
      const enCuerpo = (c.cuerpoTexto || '').toLowerCase().includes(busqueda);

      return enAsunto || enDeNombre || enDeCorreo || enPara || enExtracto || enCuerpo;
    });
  }

  filtrados.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  // AÃƒÂ±adir metadatos de hilo calculados
  const enriquecidos = filtrados.map((c) => {
    const raiz = normalizarRaizAsunto(c.asunto);
    const totalEnHilo = correosEnMemoria.filter(
      (m) => normalizarRaizAsunto(m.asunto).toLowerCase() === raiz.toLowerCase()
    ).length;
    return {
      ...c,
      asuntoRaiz: raiz,
      totalEnHilo,
    };
  });

  const total = enriquecidos.length;
  const totalPaginas = Math.ceil(total / limite) || 1;
  const inicio = (pagina - 1) * limite;
  const paginados = enriquecidos.slice(inicio, inicio + limite);
  const noLeidos = (esBusquedaGlobal ? correosEnMemoria : correosEnMemoria.filter((c) => c.carpeta === carpeta))
    .filter((c) => !c.leido).length;

  res.json({
    ok: true,
    total,
    pagina,
    tamanoPagina: limite,
    totalPaginas,
    noLeidos,
    esBusquedaGlobal,
    mensajes: paginados,
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ OBTENER DETALLE DE MENSAJE Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.get('/api/email/mensajes/:id', (req, res) => {
  const { id } = req.params;
  const mensaje = correosEnMemoria.find((c) => c.id === id || String(c.uid) === id);

  if (!mensaje) {
    return res.status(404).json({ ok: false, error: 'Mensaje de correo no encontrado.' });
  }

  if (!mensaje.leido) {
    mensaje.leido = true;
    guardarCorreosDb();
  }

  res.json({
    ok: true,
    mensaje,
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ DESCARGAR ADJUNTO ESPECÃƒÂFICO Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.get('/api/email/mensajes/:id/adjuntos/:attId', (req, res) => {
  const { id, attId } = req.params;
  const mensaje = correosEnMemoria.find((c) => c.id === id || String(c.uid) === id);
  if (!mensaje) {
    return res.status(404).json({ ok: false, error: 'Mensaje no encontrado.' });
  }

  const adjuntos = mensaje.adjuntos || [];
  const att = adjuntos.find(
    (a) => a.id === attId || a.nombre === attId || encodeURIComponent(a.nombre) === attId
  );
  if (!att) {
    return res.status(404).json({ ok: false, error: 'Adjunto no encontrado.' });
  }

  if (att.base64 && att.base64.includes(';base64,')) {
    const parts = att.base64.split(';base64,');
    const mime = parts[0].replace('data:', '') || att.tipoContenido || 'application/octet-stream';
    const buffer = Buffer.from(parts[1], 'base64');
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(att.nombre)}"`);
    res.setHeader('Content-Length', buffer.length);
    return res.send(buffer);
  }

  // Fallback con datos formateados si no tiene base64
  const fallback = Buffer.from(
    `CRM B2B - Archivo Adjunto: ${att.nombre}\nMensaje: ${mensaje.asunto}\nDe: ${mensaje.de?.nombre || mensaje.de?.correo}\nFecha: ${mensaje.fecha}`,
    'utf-8'
  );
  res.setHeader('Content-Type', att.tipoContenido || 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(att.nombre)}"`);
  res.setHeader('Content-Length', fallback.length);
  return res.send(fallback);
});

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ ACTUALIZAR ESTADO DE MENSAJE (LeÃƒÂ­do, Destacado, Mover carpeta) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.patch('/api/email/mensajes/:id', async (req, res) => {
  const { id } = req.params;
  const { leido, destacado, carpeta } = req.body;
  const mensaje = correosEnMemoria.find((c) => c.id === id || String(c.uid) === id);

  if (!mensaje) {
    return res.status(404).json({ ok: false, error: 'Mensaje no encontrado.' });
  }

  if (typeof leido === 'boolean') mensaje.leido = leido;
  if (typeof destacado === 'boolean') mensaje.destacado = destacado;
  if (carpeta && typeof carpeta === 'string' && carpeta.trim().length > 0) {
    mensaje.carpeta = carpeta.toLowerCase().trim();
  }

  guardarCorreosDb(true);

  // Si tiene UID y configuraciÃƒÂ³n IMAP real, sincronizar flag al servidor remoto
  if (mensaje.uid && configuracionActiva && !esConfiguracionDemo(configuracionActiva)) {
    try {
      const client = new ImapFlow({
        host: configuracionActiva.servidorImap,
        port: parseInt(configuracionActiva.puertoImap || '993'),
        secure: configuracionActiva.seguridadImap === 'ssl' || parseInt(configuracionActiva.puertoImap) === 993,
        auth: { user: configuracionActiva.usuarioImap, pass: configuracionActiva.contrasenaImap },
        logger: false,
        tls: opcionesTls(),
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

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ MOVER MENSAJES EN LOTE (REGLAS AUTOMÃƒÂTICAS O SELECCIÃƒâ€œN) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.post('/api/email/mensajes/lote/mover', (req, res) => {
  const { ids, carpeta } = req.body;
  if (!Array.isArray(ids) || !carpeta) {
    return res.status(400).json({ ok: false, error: 'ParÃƒÂ¡metros requeridos: ids (array) y carpeta (string).' });
  }

  const carpetaNormalizada = carpeta.toLowerCase().trim();
  let actualizados = 0;

  for (const id of ids) {
    const msg = correosEnMemoria.find((c) => c.id === id || String(c.uid) === id);
    if (msg) {
      msg.carpeta = carpetaNormalizada;
      actualizados++;
    }
  }

  if (actualizados > 0) {
    guardarCorreosDb(true);
  }

  res.json({
    ok: true,
    actualizados,
    carpeta: carpetaNormalizada,
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ LIMPIAR MEMORIA DE CORREOS (REINICIO DESDE CERO) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.post(['/api/email/limpiar-memoria', '/api/email/vaciar'], (_req, res) => {
  correosEnMemoria = [];
  guardarCorreosDb(true);
  res.json({
    ok: true,
    mensaje: 'Bandeja y base de datos de correos vaciada exitosamente para empezar desde 0.',
    totalCorreos: 0,
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ RESPONDER CORREO CON FIRMA, PIE INSTITUCIONAL Y CITA Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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
  const parrafos = cuerpo.split('\n').map((l) => (l.trim() ? `<p>${escaparHtml(l)}</p>` : '<br>')).join('\n');
  htmlFinal += `${parrafos}`;

  if (incluirFirma && firmaHtml) {
    htmlFinal += `<div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #e4e4e7;">${firmaHtml}</div>`;
  }

  if (citarOriginal && mensajeOriginal) {
    const fechaTexto = mensajeOriginal.fecha ? new Date(mensajeOriginal.fecha).toLocaleString('es-DO') : 'anteriormente';
    const remitenteTexto = mensajeOriginal.de?.nombre || mensajeOriginal.de?.correo || 'el remitente';
    htmlFinal += `<br><div style="margin-top: 24px; padding-left: 12px; border-left: 3px solid #cbd5e1; color: #64748b; font-size: 12px;">
      <p style="margin: 0 0 8px 0; color: #475569; font-weight: bold;">El ${escaparHtml(fechaTexto)}, ${escaparHtml(remitenteTexto)} escribiÃƒÂ³:</p>
      <div>${escaparHtml(mensajeOriginal.cuerpoTexto || mensajeOriginal.extracto || '').replace(/\n/g, '<br>')}</div>
    </div>`;
  }

  if (incluirPie && pieHtml) {
    htmlFinal += `<div style="margin-top: 30px; padding-top: 12px; border-top: 1px dashed #d4d4d8; font-size: 11px; color: #71717a;">${pieHtml}</div>`;
  }

  htmlFinal += `</div>`;

  const nuevoId = `msg-reply-${Date.now()}`;
  const identidadRemitente = resolverIdentidadRemitente(configSmtpUsar);
  const remitenteCorreo = identidadRemitente.correo;
  const remitenteNombre = identidadRemitente.nombre || remitenteCorreo;

  if (configSmtpUsar && !esConfiguracionDemo(configSmtpUsar)) {
    try {
      const transporter = crearTransporter(configSmtpUsar);
      const info = await transporter.sendMail({
        from: `"${remitenteNombre}" <${remitenteCorreo}>`,
        to: destinatario,
        cc: cc || undefined,
        bcc: cco || undefined,
        subject: asunto || 'Re: ComunicaciÃƒÂ³n',
        text: cuerpo,
        html: htmlFinal,
      });

      console.log(`[SMTP RESPUESTA REAL] Enviada a ${destinatario}:`, info.messageId);
    } catch (err) {
      console.error('[SMTP RESPUESTA ERROR]', err.message);
      return res.status(500).json({ exito: false, error: traducirErrorSmtp(err.code, err.message) });
    }
  } else {
    console.log(`[SIMULACIÃƒâ€œN RESPUESTA] Enviada a ${destinatario} | Asunto: "${asunto}"`);
  }

  const mensajeEnviado = {
    id: nuevoId,
    uid: crypto.randomInt(1000, 10000),
    mensajeOriginalId: mensajeOriginalId || undefined,
    carpeta: 'enviados',
    de: { nombre: remitenteNombre, correo: remitenteCorreo },
    para: [{ nombre: destinatario, correo: destinatario }],
    cc: cc ? [{ nombre: cc, correo: cc }] : undefined,
    asunto: asunto || 'Re: ComunicaciÃƒÂ³n',
    extracto: cuerpo.substring(0, 120) + '...',
    cuerpoTexto: cuerpo,
    cuerpoHtml: htmlFinal,
    fecha: new Date().toISOString(),
    leido: true,
    destacado: false,
    tieneAdjuntos: false,
  };

  correosEnMemoria.unshift(mensajeEnviado);
  guardarCorreosDb(true);

  res.json({
    exito: true,
    mensajeId: nuevoId,
    mensajeEnviado,
    mensaje: 'Respuesta enviada y guardada en Enviados exitosamente.',
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ REDACTAR NUEVO CORREO Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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
  const parrafos = cuerpo.split('\n').map((l) => (l.trim() ? `<p>${escaparHtml(l)}</p>` : '<br>')).join('\n');
  htmlFinal += `${parrafos}`;

  if (incluirFirma && firmaHtml) {
    htmlFinal += `<div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #e4e4e7;">${firmaHtml}</div>`;
  }

  if (incluirPie && pieHtml) {
    htmlFinal += `<div style="margin-top: 30px; padding-top: 12px; border-top: 1px dashed #d4d4d8; font-size: 11px; color: #71717a;">${pieHtml}</div>`;
  }
  htmlFinal += `</div>`;

  const nuevoId = `msg-new-${Date.now()}`;
  const identidadRemitente = resolverIdentidadRemitente(configSmtpUsar);
  const remitenteCorreo = identidadRemitente.correo;
  const remitenteNombre = identidadRemitente.nombre || remitenteCorreo;

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
    uid: crypto.randomInt(1000, 10000),
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
  guardarCorreosDb(true);

  res.json({
    exito: true,
    mensajeId: nuevoId,
    mensajeEnviado,
    mensaje: 'Correo enviado y registrado en Enviados con ÃƒÂ©xito.',
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ ENVIAR CORREO INDIVIDUAL CON ADJUNTO PDF Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.post('/api/email/enviar', async (req, res) => {
  const { smtpConfig, destinatario, asunto, cuerpo, adjuntoNombre, adjuntoBase64 } = req.body;
  const config = smtpConfig || resolverConfigSmtp(req);

  if (!config?.servidorSmtp || !destinatario || !asunto) {
    return res.status(400).json({ exito: false, error: 'Faltan campos obligatorios: servidorSmtp, destinatario, asunto.' });
  }

  if (esConfiguracionDemo(config)) {
    console.log(`[SMTP SIMULACIÃƒâ€œN] Despacho a: ${destinatario} | Asunto: "${asunto}" | Adjunto: "${adjuntoNombre}"`);
    return res.json({
      exito: true,
      messageId: `<sim-${Date.now()}@crm-local>`,
      modo: 'demo',
      mensaje: 'EnvÃƒÂ­o registrado exitosamente en modo simulaciÃƒÂ³n.',
    });
  }

  try {
    const transporter = crearTransporter(config);
    const attachments = [];
    if (adjuntoBase64 && adjuntoNombre) {
      const base64Data = adjuntoBase64.includes(',') ? adjuntoBase64.split(',')[1] : adjuntoBase64;
      attachments.push({ filename: adjuntoNombre, content: base64Data, encoding: 'base64', contentType: 'application/pdf' });
    }

    const identidadRemitente = resolverIdentidadRemitente(config);
    const nombreFrom = identidadRemitente.nombre || identidadRemitente.correo;
    const correoFrom = identidadRemitente.correo;

    const info = await transporter.sendMail({
      from: `"${nombreFrom}" <${correoFrom}>`,
      to: destinatario,
      replyTo: identidadRemitente.respuesta || correoFrom,
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

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ ENVÃƒÂO MASIVO Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.post('/api/email/enviar-masivo', async (req, res) => {
  const { smtpConfig, correos } = req.body;
  const config = smtpConfig || resolverConfigSmtp(req);

  if (!config?.servidorSmtp || !Array.isArray(correos) || correos.length === 0) {
    return res.status(400).json({ exito: false, error: 'Faltan campos: smtpConfig y array de correos.' });
  }

  if (esConfiguracionDemo(config)) {
    console.log(`[SMTP MASIVO SIMULACIÃƒâ€œN] Despacho de ${correos.length} correos en modo simulaciÃƒÂ³n`);
    const resultados = correos.map((c) => ({
      destinatario: c.destinatario,
      exito: true,
      messageId: `<sim-${Date.now()}-${crypto.randomBytes(4).toString('hex')}@crm-local>`,
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
      const identidadRemitente = resolverIdentidadRemitente(config);
      const info = await transporter.sendMail({
        from: `"${identidadRemitente.nombre || identidadRemitente.correo}" <${identidadRemitente.correo}>`,
        to: destinatario,
        replyTo: identidadRemitente.respuesta || undefined,
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

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ UTILIDADES Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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
    tls: opcionesTls(),
  });
}

function escaparHtml(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
        firmaHtml += `<p style="margin: 3px 0;">${escaparHtml(contenidoFirma)}</p>`;
      }
      continue;
    }

    if (enFirma) {
      if (line.trim()) {
        firmaHtml += `<p style="margin: 3px 0;">${escaparHtml(line)}</p>`;
      }
    } else {
      if (line.trim()) {
        contenidoHtml += `<p style="margin: 0 0 12px 0; line-height: 1.65;">${escaparHtml(line)}</p>`;
      } else {
        contenidoHtml += `<div style="height: 8px;"></div>`;
      }
    }
  }

  const badgeAdjunto = nombreAdjunto ? `
    <div style="margin-bottom: 20px; padding: 10px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
      <table cellpadding="0" cellspacing="0" border="0" style="font-size: 12px; color: #334155;">
        <tr>
          <td style="padding-right: 8px; font-size: 14px;">Ã°Å¸â€œÅ½</td>
          <td style="font-weight: 600; color: #0f172a; padding-right: 6px;">Documento Adjunto:</td>
          <td style="color: #4f46e5; font-weight: 600;">${escaparHtml(nombreAdjunto)}</td>
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
  <title>ComunicaciÃƒÂ³n Oficial</title>
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
      Este mensaje y sus documentos adjuntos son de carÃƒÂ¡cter confidencial y para uso exclusivo del destinatario.<br>
      Conforme a la Ley No. 126-02 y Ley No. 172-13 sobre ProtecciÃƒÂ³n de Datos de la RepÃƒÂºblica Dominicana.
    </div>
  </div>
</body>
</html>`;
}

function traducirErrorSmtp(code, mensaje) {
  const t = {
    ECONNREFUSED: 'ConexiÃƒÂ³n rechazada Ã¢â‚¬â€ verifique el host y el puerto SMTP.',
    ENOTFOUND: 'Servidor no encontrado Ã¢â‚¬â€ revise el nombre del host SMTP.',
    ETIMEDOUT: 'Tiempo de espera agotado Ã¢â‚¬â€ el servidor no respondiÃƒÂ³.',
    EAUTH: 'Credenciales incorrectas Ã¢â‚¬â€ revise usuario y contraseÃƒÂ±a SMTP.',
    ESOCKET: 'Error SSL/TLS Ã¢â‚¬â€ pruebe cambiar el tipo de cifrado.',
    EMESSAGE: 'Error en el formato del mensaje.',
    EENVELOPE: 'DirecciÃƒÂ³n de remitente o destinatario invÃƒÂ¡lida.',
  };
  return t[code] || mensaje || 'Error SMTP desconocido.';
}

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'Recurso no encontrado.' });
});

app.use(manejarErrores);

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ START Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export { app };

const esEjecucionDirecta = Boolean(process.argv[1]) && path.resolve(process.argv[1]) === path.resolve(__filename);

if (esEjecucionDirecta) {
const server = app.listen(PORT, HOST, () => {
  console.log(`\nÃ°Å¸Å¡â‚¬ CRM Unified Server (Email & WhatsApp) activo en http://${HOST}:${PORT}`);
  console.log(`   GET   /api/email/estado          Ã¢â€ â€™ Health check Email`);
  console.log(`   GET   /api/whatsapp/estado       Ã¢â€ â€™ Health check & QR WhatsApp`);
  console.log(`   POST  /api/whatsapp/conectar     Ã¢â€ â€™ Iniciar conexiÃƒÂ³n WhatsApp Web`);
  console.log(`   POST  /api/whatsapp/enviar-mensaje Ã¢â€ â€™ Enviar WhatsApp texto`);
  console.log(`   POST  /api/whatsapp/enviar-documento Ã¢â€ â€™ Enviar PDF por WhatsApp\n`);

  // Auto-reconexiÃƒÂ³n persistente de WhatsApp Web si ya fue vinculado previamente
  if (typeof whatsAppService.tieneSesionGuardada === 'function' && whatsAppService.tieneSesionGuardada()) {
    console.log('Ã°Å¸â€â€ž [WhatsApp] SesiÃƒÂ³n previa detectada en disco. Restaurando conexiÃƒÂ³n de WhatsApp Web...');
    whatsAppService.iniciarConexion().catch((err) => {
      console.warn('[WhatsApp] Aviso al restaurar conexiÃƒÂ³n automÃƒÂ¡tica:', err.message);
    });
  }

  // Inicio automÃƒÂ¡tico del servicio de escucha de correos en segundo plano
  if (configuracionActiva && configuracionActiva.habilitarImap) {
    servicioEscuchaEmail.iniciar({
      configGetter: () => configuracionActiva,
      correosEnMemoriaRef: correosEnMemoria,
      guardarDbFn: () => guardarCorreosDb(true),
      parsearMensajeFn: parsearMensajeImap,
      intervaloSegundos: 15,
    }).catch((err) => {
      console.warn('[EMAIL LISTENER] Aviso al iniciar servicio de escucha:', err.message);
    });
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`Ã¢Å¡Â Ã¯Â¸Â  [EMAIL SERVER] El puerto ${PORT} ya estÃƒÂ¡ en uso. Otra instancia ya se encuentra activa.`);
  } else {
    console.error('Ã¢ÂÅ’ [EMAIL SERVER] Error inesperado en el servidor:', err);
  }
});

// Cierre ordenado para no corromper la sesiÃƒÂ³n de WhatsApp ni el socket
const cerrarGracefully = () => {
  console.log('\nÃ°Å¸â€ºâ€˜ Cerrando servidor unificado de forma limpia...');
  if (servicioEscuchaEmail) {
    try {
      servicioEscuchaEmail.detener();
    } catch {}
  }
  if (whatsAppService && whatsAppService.sock) {
    try {
      whatsAppService.sock.end(undefined);
    } catch {}
  }
  process.exit(0);
};

process.on('SIGINT', cerrarGracefully);
process.on('SIGTERM', cerrarGracefully);
}
