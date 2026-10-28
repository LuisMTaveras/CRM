import dns from 'node:dns/promises';
import net from 'node:net';

const HOSTS_BLOQUEADOS = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'metadata',
  'metadata.google.internal',
  'instance-data',
]);

function ipv4EsPrivada(ip) {
  const [a, b] = ip.split('.').map(Number);
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a === 192 && b === 0) return true;
  if (a === 192 && b === 0 && ip.endsWith('.0')) return true;
  if (a === 198 && b === 51 && ip.startsWith('198.51.100.')) return true;
  if (a === 203 && b === 0 && ip.startsWith('203.0.113.')) return true;
  if (a >= 224) return true;
  return false;
}

function ipv6EsPrivada(ip) {
  const valor = ip.toLowerCase();

  if (valor.startsWith('::ffff:')) {
    const v4 = valor.slice(7);
    return net.isIP(v4) === 4 ? ipv4EsPrivada(v4) : true;
  }

  if (valor === '::' || valor === '::1') return true;
  if (valor === '0:0:0:0:0:0:0:0' || valor === '0:0:0:0:0:0:0:1') return true;
  if (valor.startsWith('fe8') || valor.startsWith('fe9') || valor.startsWith('fea') || valor.startsWith('feb')) return true;
  if (valor.startsWith('fc') || valor.startsWith('fd')) return true;
  if (valor.startsWith('ff')) return true;

  return false;
}

export function esIpPrivada(valor) {
  const ip = String(valor || '').trim().replace(/^\[|\]$/g, '');
  const version = net.isIP(ip);
  if (version === 4) return ipv4EsPrivada(ip);
  if (version === 6) return ipv6EsPrivada(ip);
  return false;
}

export function esHostBloqueado(host) {
  const valor = String(host || '').trim().toLowerCase().replace(/\.$/, '');
  if (!valor) return true;
  if (HOSTS_BLOQUEADOS.has(valor)) return true;
  if (valor.endsWith('.localhost') || valor.endsWith('.local') || valor.endsWith('.internal')) return true;
  return false;
}

export function extraerHostsCorreo(body) {
  const hosts = new Set();
  const configuraciones = [
    body,
    body?.config,
    body?.smtpConfig,
    body?.imapConfig,
    ...(Array.isArray(body?.correos) ? body.correos : []),
  ];

  for (const config of configuraciones) {
    if (!config || typeof config !== 'object') continue;
    for (const clave of ['servidorSmtp', 'servidorImap']) {
      const host = config[clave];
      if (typeof host === 'string' && host.trim()) hosts.add(host.trim());
    }
  }

  return [...hosts];
}

function errorHost(mensaje, codigo = 'HOST_INVALIDO') {
  const error = new Error(mensaje);
  error.code = codigo;
  return error;
}

export async function validarHostDestino(host, { permitirPrivadas = false, resolver = dns.lookup } = {}) {
  const valor = String(host || '').trim().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!valor) throw errorHost('El servidor de correo no es válido.');

  if (permitirPrivadas) return { host: valor, direcciones: [] };

  if (esHostBloqueado(valor)) {
    throw errorHost('El servidor de correo apunta a un host no permitido.', 'HOST_BLOQUEADO');
  }

  if (!net.isIP(valor) && (valor.includes('://') || /[\s/]/.test(valor) || (valor.includes(':') && !valor.includes('::')))) {
    throw errorHost('El servidor de correo debe ser un nombre de host o una dirección IP válida.');
  }

  const ipDirecta = net.isIP(valor);
  if (ipDirecta) {
    if (esIpPrivada(valor)) {
      throw errorHost('El servidor de correo apunta a una red privada no permitida.', 'HOST_PRIVADO');
    }
    return { host: valor, direcciones: [valor] };
  }

  let resultado;
  try {
    resultado = await resolver(valor, { all: true, verbatim: true });
  } catch {
    throw errorHost(`No se pudo resolver el servidor de correo "${valor}".`, 'HOST_NO_RESUELTO');
  }

  const direcciones = (Array.isArray(resultado) ? resultado : [resultado])
    .map((item) => (typeof item === 'string' ? item : item?.address))
    .filter(Boolean);

  if (direcciones.length === 0) {
    throw errorHost(`No se pudo resolver el servidor de correo "${valor}".`, 'HOST_NO_RESUELTO');
  }

  for (const direccion of direcciones) {
    if (esIpPrivada(direccion)) {
      throw errorHost('El servidor de correo resuelve a una red privada no permitida.', 'HOST_PRIVADO');
    }
  }

  return { host: valor, direcciones };
}
