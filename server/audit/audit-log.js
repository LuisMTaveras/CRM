import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARCHIVO_PREDETERMINADO = path.join(__dirname, '..', 'data', 'auditoria.json');
const MAXIMO_PREDETERMINADO = 5000;

function texto(valor, limite = 240) {
  return String(valor ?? '').trim().slice(0, limite);
}

function fechaValida(valor) {
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function limiteSuperior(hasta) {
  const valor = texto(hasta, 40);
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return new Date(`${valor}T23:59:59.999Z`);
  }
  return fechaValida(valor);
}

export function crearRegistroAuditoria({ archivo = ARCHIVO_PREDETERMINADO, maximo = MAXIMO_PREDETERMINADO } = {}) {
  let eventos = [];

  const recargar = () => {
    try {
      if (!fs.existsSync(archivo)) {
        eventos = [];
        return;
      }
      const contenido = JSON.parse(fs.readFileSync(archivo, 'utf8'));
      eventos = Array.isArray(contenido) ? contenido : [];
    } catch {
      eventos = [];
    }
  };

  const guardar = () => {
    fs.mkdirSync(path.dirname(archivo), { recursive: true });
    fs.writeFileSync(archivo, JSON.stringify(eventos, null, 2), 'utf8');
  };

  const normalizarActor = (actor) => {
    if (!actor) return null;
    return {
      id: texto(actor.id, 80),
      email: texto(actor.email, 160).toLowerCase(),
      nombre: texto(actor.nombre, 120),
      rol: texto(actor.rol, 40),
    };
  };

  const registrar = (datos = {}) => {
    const evento = {
      id: crypto.randomUUID(),
      timestamp: fechaValida(datos.timestamp)?.toISOString() || new Date().toISOString(),
      actor: normalizarActor(datos.actor),
      accion: texto(datos.accion || 'evento', 160),
      entidad: texto(datos.entidad, 80),
      entidadId: texto(datos.entidadId, 160),
      exito: datos.exito !== false,
      ip: texto(datos.ip, 80),
      detalle: texto(datos.detalle, 500),
      metadata: datos.metadata && typeof datos.metadata === 'object' && !Array.isArray(datos.metadata)
        ? JSON.parse(JSON.stringify(datos.metadata))
        : null,
    };

    eventos.unshift(evento);
    if (eventos.length > maximo) eventos = eventos.slice(0, maximo);
    guardar();
    return evento;
  };

  const filtrar = ({ q = '', accion = '', entidad = '', desde = '', hasta = '', exito = '' } = {}) => {
    const busqueda = texto(q, 160).toLowerCase();
    const accionBuscada = texto(accion, 160).toLowerCase();
    const entidadBuscada = texto(entidad, 80).toLowerCase();
    const desdeFecha = fechaValida(desde);
    const hastaFecha = limiteSuperior(hasta);
    const exitoBuscado = exito === true || exito === 'true' || exito === '1'
      ? true
      : exito === false || exito === 'false' || exito === '0'
        ? false
        : null;

    return eventos.filter((evento) => {
      const momento = fechaValida(evento.timestamp);
      if (desdeFecha && (!momento || momento < desdeFecha)) return false;
      if (hastaFecha && (!momento || momento > hastaFecha)) return false;
      if (accionBuscada && !String(evento.accion || '').toLowerCase().includes(accionBuscada)) return false;
      if (entidadBuscada && String(evento.entidad || '').toLowerCase() !== entidadBuscada) return false;
      if (exitoBuscado !== null && Boolean(evento.exito) !== exitoBuscado) return false;
      if (!busqueda) return true;

      return [
        evento.accion,
        evento.entidad,
        evento.entidadId,
        evento.detalle,
        evento.ip,
        evento.actor?.email,
        evento.actor?.nombre,
        evento.actor?.rol,
      ]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(busqueda));
    });
  };

  recargar();

  return {
    archivo,
    recargar,
    guardar,
    registrar,
    listar({ page = 1, pageSize = 25, ...filtros } = {}) {
      const pagina = Math.max(1, Number.parseInt(page, 10) || 1);
      const tamano = Math.min(200, Math.max(1, Number.parseInt(pageSize, 10) || 25));
      const filtrados = filtrar(filtros);
      const total = filtrados.length;
      const inicio = (pagina - 1) * tamano;
      const acciones = [...new Set(eventos.map((evento) => evento.accion).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'es'));

      return {
        eventos: filtrados.slice(inicio, inicio + tamano),
        total,
        page: pagina,
        pageSize: tamano,
        hasMore: inicio + tamano < total,
        acciones,
      };
    },
    exportar(filtros = {}) {
      return filtrar(filtros);
    },
    limpiar({ antesDe = '' } = {}) {
      const corte = fechaValida(antesDe);
      const totalAnterior = eventos.length;
      if (corte) {
        eventos = eventos.filter((evento) => {
          const momento = fechaValida(evento.timestamp);
          return !momento || momento >= corte;
        });
      } else {
        eventos = [];
      }
      guardar();
      return { eliminados: totalAnterior - eventos.length, restantes: eventos.length };
    },
  };
}

export function crearRegistroAuditoriaDesdeEntorno(env = process.env) {
  const archivo = env.CRM_AUDIT_FILE || ARCHIVO_PREDETERMINADO;
  const maximo = Number.parseInt(env.CRM_AUDIT_MAX_EVENTS || '', 10);
  return crearRegistroAuditoria({
    archivo,
    maximo: Number.isFinite(maximo) && maximo > 0 ? maximo : MAXIMO_PREDETERMINADO,
  });
}
