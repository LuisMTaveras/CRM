import crypto from 'node:crypto';
import { crearColeccionDesdeEntorno } from '../storage/json-store.js';

export const ESTADOS_COTIZACION = ['borrador', 'enviada', 'aprobada', 'rechazada', 'vencida'];
export const MONEDAS_COTIZACION = ['DOP', 'USD'];
const TASA_ITBIS = 0.18;

function texto(valor, limite = 500) {
  return String(valor ?? '').trim().slice(0, limite);
}

function numero(valor) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

function redondear(valor) {
  return Math.round(numero(valor) * 100) / 100;
}

function fecha(valor) {
  if (!valor) return new Date().toISOString().slice(0, 10);
  const convertida = new Date(valor);
  return Number.isNaN(convertida.getTime()) ? new Date().toISOString().slice(0, 10) : convertida.toISOString().slice(0, 10);
}

function normalizarItem(datos) {
  const cantidad = Math.max(0, numero(datos?.cantidad));
  const precioUnitario = Math.max(0, numero(datos?.precio_unitario));
  const descuento = Math.min(100, Math.max(0, numero(datos?.descuento_porcentaje)));
  const bruto = cantidad * precioUnitario;
  const descuentoMonto = bruto * (descuento / 100);
  const neto = bruto - descuentoMonto;
  const itbisAplica = datos?.itbis_aplica !== false;
  const montoItbis = itbisAplica ? neto * TASA_ITBIS : 0;

  return {
    id: texto(datos?.id, 80) || `item-${crypto.randomUUID()}`,
    producto_id: texto(datos?.producto_id, 80) || undefined,
    sku: texto(datos?.sku, 80),
    descripcion: texto(datos?.descripcion, 500),
    cantidad,
    precio_unitario: redondear(precioUnitario),
    descuento_porcentaje: descuento,
    itbis_aplica: itbisAplica,
    monto_itbis: redondear(montoItbis),
    total_linea: redondear(neto + montoItbis),
  };
}

function calcularTotales(items) {
  const subtotal = items.reduce((total, item) => total + item.cantidad * item.precio_unitario, 0);
  const descuentoMonto = items.reduce(
    (total, item) => total + item.cantidad * item.precio_unitario * (item.descuento_porcentaje / 100),
    0
  );
  const itbisTotal = items.reduce((total, item) => total + item.monto_itbis, 0);
  const total = items.reduce((suma, item) => suma + item.total_linea, 0);

  return {
    subtotal: redondear(subtotal),
    descuento_monto: redondear(descuentoMonto),
    descuento_porcentaje: subtotal > 0 ? redondear((descuentoMonto / subtotal) * 100) : 0,
    itbis_total: redondear(itbisTotal),
    total: redondear(total),
  };
}

function normalizar(datos) {
  const items = (Array.isArray(datos?.items) ? datos.items : []).map(normalizarItem);
  const totales = calcularTotales(items);

  return {
    id: texto(datos?.id, 80) || `cot-${crypto.randomUUID()}`,
    numero_cotizacion: texto(datos?.numero_cotizacion, 60),
    cliente_id: texto(datos?.cliente_id, 120),
    cliente_nombre: texto(datos?.cliente_nombre, 240),
    cliente_rnc: texto(datos?.cliente_rnc, 60) || undefined,
    cliente_telefono: texto(datos?.cliente_telefono, 60) || undefined,
    cliente_email: texto(datos?.cliente_email, 200) || undefined,
    contacto_nombre: texto(datos?.contacto_nombre, 240) || undefined,
    fecha_emision: fecha(datos?.fecha_emision),
    fecha_vencimiento: fecha(datos?.fecha_vencimiento),
    estado: ESTADOS_COTIZACION.includes(datos?.estado) ? datos.estado : 'borrador',
    items,
    subtotal: totales.subtotal,
    descuento_porcentaje: totales.descuento_porcentaje,
    descuento_monto: totales.descuento_monto,
    itbis_total: totales.itbis_total,
    total: totales.total,
    moneda: MONEDAS_COTIZACION.includes(datos?.moneda) ? datos.moneda : 'DOP',
    notas: texto(datos?.notas, 2000) || undefined,
    terminos_condiciones: texto(datos?.terminos_condiciones, 4000) || undefined,
    token_aprobacion: texto(datos?.token_aprobacion, 120),
    aprobado_en: datos?.aprobado_en ? new Date(datos.aprobado_en).toISOString() : undefined,
    aprobado_por_nombre: texto(datos?.aprobado_por_nombre, 240) || undefined,
    aprobado_por_cargo: texto(datos?.aprobado_por_cargo, 240) || undefined,
    creado_en: datos?.creado_en ? new Date(datos.creado_en).toISOString() : new Date().toISOString(),
  };
}

export function crearAlmacenCotizaciones(coleccion) {
  const leer = () => {
    coleccion.recargar();
    return coleccion.todos();
  };

  const obtener = (id) => {
    coleccion.recargar();
    return coleccion.obtener(id);
  };

  const obtenerPorToken = (token) => {
    const buscado = texto(token);
    if (!buscado) return null;
    return leer().find((cotizacion) => cotizacion.token_aprobacion === buscado) || null;
  };

  const generarNumero = () => {
    const anio = new Date().getFullYear();
    const maximo = leer().reduce((mayor, cotizacion) => {
      const coincidencia = new RegExp(`^COT-${anio}-(\\d+)$`, 'i').exec(String(cotizacion.numero_cotizacion || ''));
      if (!coincidencia) return mayor;
      return Math.max(mayor, Number.parseInt(coincidencia[1], 10) || 0);
    }, 0);
    return `COT-${anio}-${String(maximo + 1).padStart(4, '0')}`;
  };

  const generarToken = () => `tok_${crypto.randomBytes(12).toString('base64url')}`;

  const publica = (cotizacion) => {
    if (!cotizacion) return null;
    // El portal publico no necesita datos internos adicionales; se devuelve la cotizacion completa.
    return cotizacion;
  };

  return {
    listar({ busqueda = '', estado = '', clienteId = '', pagina, tamanoPagina } = {}) {
      const q = texto(busqueda).toLowerCase();
      let items = leer().filter((cotizacion) => {
        if (estado && cotizacion.estado !== estado) return false;
        if (clienteId && cotizacion.cliente_id !== clienteId) return false;
        if (!q) return true;
        return (
          String(cotizacion.numero_cotizacion || '').toLowerCase().includes(q) ||
          String(cotizacion.cliente_nombre || '').toLowerCase().includes(q) ||
          String(cotizacion.cliente_rnc || '').toLowerCase().includes(q)
        );
      });

      items = [...items].sort((a, b) => String(b.creado_en).localeCompare(String(a.creado_en)));
      const total = items.length;
      const paginar = pagina !== undefined || tamanoPagina !== undefined;
      if (!paginar) return { datos: items, total };

      const paginaNumero = Math.max(1, Number.parseInt(pagina, 10) || 1);
      const tamano = Math.min(200, Math.max(1, Number.parseInt(tamanoPagina, 10) || 20));
      const inicio = (paginaNumero - 1) * tamano;
      return {
        datos: items.slice(inicio, inicio + tamano),
        total,
        pagina: paginaNumero,
        tamanoPagina: tamano,
        totalPaginas: Math.max(1, Math.ceil(total / tamano)),
        hasMore: inicio + tamano < total,
      };
    },

    obtener(id) {
      return obtener(id);
    },

    obtenerPorToken(token) {
      return obtenerPorToken(token);
    },

    obtenerPorCliente(clienteId) {
      return leer().filter((cotizacion) => cotizacion.cliente_id === clienteId);
    },

    guardar(datos) {
      if (!texto(datos?.cliente_nombre)) {
        const error = new Error('El nombre del cliente es obligatorio.');
        error.estado = 400;
        throw error;
      }

      const existente = datos?.id ? obtener(datos.id) : null;
      if (existente) {
        const actualizada = normalizar({ ...existente, ...datos, id: existente.id });
        actualizada.numero_cotizacion = existente.numero_cotizacion;
        actualizada.token_aprobacion = existente.token_aprobacion;
        actualizada.creado_en = existente.creado_en;
        return coleccion.reemplazar(existente.id, actualizada);
      }

      const nueva = normalizar({
        ...datos,
        id: `cot-${crypto.randomUUID()}`,
        numero_cotizacion: texto(datos?.numero_cotizacion) || generarNumero(),
        token_aprobacion: texto(datos?.token_aprobacion) || generarToken(),
      });
      coleccion.crear(nueva, { id: nueva.id });
      return nueva;
    },

    actualizarEstado(id, estado) {
      if (!ESTADOS_COTIZACION.includes(estado)) {
        const error = new Error('Estado de cotizacion invalido.');
        error.estado = 400;
        throw error;
      }
      const actual = obtener(id);
      if (!actual) return null;
      return coleccion.reemplazar(actual.id, { ...actual, estado });
    },

    aprobarPorToken(token, firmante) {
      const actual = obtenerPorToken(token);
      if (!actual) {
        const error = new Error('La propuesta indicada no fue encontrada o el enlace ha caducado.');
        error.estado = 404;
        throw error;
      }
      if (actual.estado === 'aprobada') return actual;

      const nombre = texto(firmante?.nombre, 240);
      const cargo = texto(firmante?.cargo, 240);
      if (!nombre || !cargo) {
        const error = new Error('El nombre y el cargo del firmante son obligatorios.');
        error.estado = 400;
        throw error;
      }

      return coleccion.reemplazar(actual.id, {
        ...actual,
        estado: 'aprobada',
        aprobado_en: new Date().toISOString(),
        aprobado_por_nombre: nombre,
        aprobado_por_cargo: cargo,
      });
    },

    eliminar(id) {
      coleccion.recargar();
      return coleccion.eliminar(id);
    },

    publica,
  };
}

export function crearAlmacenCotizacionesDesdeEntorno(env = process.env) {
  return crearAlmacenCotizaciones(crearColeccionDesdeEntorno('cotizaciones', env));
}
