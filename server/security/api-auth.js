import crypto from 'node:crypto';

const PREFIJO_TOKEN = 'crm1';
const TTL_PREDETERMINADO_MINUTOS = 480;

export const RUTAS_PUBLICAS_PREDETERMINADAS = [
  '/health',
  '/auth/login',
  '/whatsapp/auth/solicitar-otp',
  '/whatsapp/auth/verificar-otp',
];

function normalizarRuta(ruta) {
  const valor = String(ruta || '/').split('?')[0].replace(/\/+$/, '');
  return valor || '/';
}

function compararSeguro(a, b) {
  const izquierda = Buffer.from(String(a ?? ''));
  const derecha = Buffer.from(String(b ?? ''));
  if (izquierda.length !== derecha.length) return false;
  return crypto.timingSafeEqual(izquierda, derecha);
}

export function resolverConfiguracionAuth(env = process.env) {
  const produccion = env.NODE_ENV === 'production';
  const requerir = env.CRM_REQUIRE_AUTH === 'false'
    ? false
    : env.CRM_REQUIRE_AUTH === 'true' || produccion;
  const apiKey = String(env.CRM_API_KEY || '').trim();
  const secretoConfigurado = String(env.CRM_SESSION_SECRET || '').trim();
  const secreto = secretoConfigurado || crypto.randomBytes(32).toString('hex');
  const minutos = Number.parseInt(env.CRM_SESSION_TTL_MINUTES || '', 10);
  const ttlMinutos = Number.isFinite(minutos) && minutos > 0 ? minutos : TTL_PREDETERMINADO_MINUTOS;

  if (requerir && !secretoConfigurado && !apiKey) {
    throw new Error('Configura CRM_SESSION_SECRET o CRM_API_KEY para habilitar la autenticación del API.');
  }

  return {
    requerir,
    produccion,
    apiKey,
    secreto,
    secretoConfigurado: Boolean(secretoConfigurado),
    ttlMs: ttlMinutos * 60 * 1000,
    ttlSegundos: ttlMinutos * 60,
  };
}

export function firmarToken(payload, { secreto, ttlMs = TTL_PREDETERMINADO_MINUTOS * 60 * 1000, ahora = Date.now() } = {}) {
  if (!secreto || String(secreto).length < 16) {
    throw new Error('El secreto de sesión no está configurado correctamente.');
  }

  const ahoraSegundos = Math.floor(ahora / 1000);
  const cuerpo = {
    ...payload,
    iss: 'crm',
    aud: 'crm-api',
    iat: ahoraSegundos,
    exp: Math.floor((ahora + ttlMs) / 1000),
  };
  const datos = Buffer.from(JSON.stringify(cuerpo)).toString('base64url');
  const firma = crypto.createHmac('sha256', secreto).update(`${PREFIJO_TOKEN}.${datos}`).digest('base64url');
  return `${PREFIJO_TOKEN}.${datos}.${firma}`;
}

export function verificarToken(token, { secreto, ahora = Date.now() } = {}) {
  if (!token || !secreto) return null;

  try {
    const partes = String(token).split('.');
    if (partes.length !== 3 || partes[0] !== PREFIJO_TOKEN) return null;

    const esperada = crypto
      .createHmac('sha256', secreto)
      .update(`${partes[0]}.${partes[1]}`)
      .digest('base64url');

    if (!compararSeguro(partes[2], esperada)) return null;

    const payload = JSON.parse(Buffer.from(partes[1], 'base64url').toString('utf8'));
    if (!payload || payload.iss !== 'crm' || payload.aud !== 'crm-api') return null;
    if (!payload.sub || !Number.isFinite(payload.exp)) return null;
    if (payload.exp * 1000 <= ahora) return null;

    return payload;
  } catch {
    return null;
  }
}

export function extraerCredencial(req) {
  const autorizacion = req.get('authorization') || '';
  const bearer = autorizacion.match(/^Bearer\s+(.+)$/i);
  const ruta = normalizarRuta(req.path);
  const queryPermitida = ruta.endsWith('/eventos') || ruta.includes('/media/') || ruta.includes('/adjuntos/');
  const tokenQuery = queryPermitida && typeof req.query?.token === 'string' ? req.query.token : '';

  return {
    token: bearer?.[1]?.trim() || req.get('x-crm-token') || tokenQuery || '',
    apiKey: req.get('x-api-key') || '',
  };
}

export function crearMiddlewareAuth({
  requerir,
  apiKey,
  secreto,
  rutasPublicas = RUTAS_PUBLICAS_PREDETERMINADAS,
} = {}) {
  const publicas = new Set(rutasPublicas.map(normalizarRuta));

  return (req, res, next) => {
    if (!requerir) return next();

    const ruta = normalizarRuta(req.path);
    if (publicas.has(ruta)) return next();

    const credencial = extraerCredencial(req);
    if (credencial.apiKey && apiKey && compararSeguro(credencial.apiKey, apiKey)) {
      req.auth = { tipo: 'api-key' };
      return next();
    }

    const payload = verificarToken(credencial.token, { secreto });
    if (payload) {
      req.auth = { tipo: 'sesion', ...payload };
      return next();
    }

    return res.status(401).json({
      ok: false,
      error: 'Autenticación requerida o credencial inválida.',
    });
  };
}
