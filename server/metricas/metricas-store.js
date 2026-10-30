const ETAPAS = ['calificacion', 'propuesta', 'negociacion', 'ganada', 'perdida'];
const NOMBRES_ETAPAS = {
  calificacion: 'Calificacion',
  propuesta: 'Propuesta Enviada',
  negociacion: 'En Negociacion',
  ganada: 'Cerrada Ganada',
  perdida: 'Cerrada Perdida',
};

const PALETA_SECTORES = [
  { bg: 'bg-emerald-500', hex: '#10b981' },
  { bg: 'bg-sky-500', hex: '#0ea5e9' },
  { bg: 'bg-indigo-500', hex: '#6366f1' },
  { bg: 'bg-amber-500', hex: '#f59e0b' },
  { bg: 'bg-purple-500', hex: '#8b5cf6' },
  { bg: 'bg-rose-500', hex: '#f43f5e' },
  { bg: 'bg-zinc-400', hex: '#71717a' },
];

const PERIODOS = ['mes', 'trimestre', 'anual'];

function numero(valor) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

function instante(valor) {
  const fecha = valor ? Date.parse(String(valor)) : NaN;
  return Number.isFinite(fecha) ? fecha : null;
}

function inicioPeriodo(periodo, ahora) {
  const fecha = new Date(ahora);
  if (periodo === 'anual') return new Date(fecha.getFullYear(), 0, 1).getTime();
  if (periodo === 'trimestre') return new Date(fecha.getFullYear(), fecha.getMonth() - 2, 1).getTime();
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1).getTime();
}

function inicioMes(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1).getTime();
}

function finMes(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth() + 1, 1).getTime();
}

function capitalizar(texto) {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function etiquetaMes(fecha) {
  const mes = capitalizar(new Intl.DateTimeFormat('es', { month: 'long' }).format(fecha));
  const corto = capitalizar(
    new Intl.DateTimeFormat('es', { month: 'short' }).format(fecha).replace('.', '')
  );
  return { mes: `${mes} ${fecha.getFullYear()}`, mesCorto: corto };
}

function esCerrada(etapa) {
  return etapa === 'ganada' || etapa === 'perdida';
}

function sumar(items, campo) {
  return items.reduce((total, item) => total + numero(item[campo]), 0);
}

function aplanarOportunidades(clientes) {
  const oportunidades = [];

  clientes.forEach((cliente) => {
    const lista = Array.isArray(cliente.oportunidades) ? cliente.oportunidades : [];
    lista.forEach((oportunidad) => {
      oportunidades.push({
        ...oportunidad,
        cliente_sector: cliente.sector || 'Otros',
        responsable: cliente.responsable || 'Sin Asignar',
      });
    });
  });

  return oportunidades;
}

function enPeriodo(oportunidad, desde) {
  const creado = instante(oportunidad.creado_en);
  const cerrado = instante(oportunidad.fecha_cierre);
  return (creado !== null && creado >= desde) || (cerrado !== null && cerrado >= desde);
}

export function calcularMetricas(clientes = [], periodo = 'mes', ahora = new Date()) {
  const periodoValido = PERIODOS.includes(periodo) ? periodo : 'mes';
  const desde = inicioPeriodo(periodoValido, ahora);
  const oportunidades = aplanarOportunidades(Array.isArray(clientes) ? clientes : []);
  const delPeriodo = oportunidades.filter((oportunidad) => enPeriodo(oportunidad, desde));

  const ganadas = delPeriodo.filter((oportunidad) => oportunidad.etapa === 'ganada');
  const enNegociacion = delPeriodo.filter((oportunidad) => oportunidad.etapa === 'negociacion');
  const activas = delPeriodo.filter((oportunidad) => !esCerrada(oportunidad.etapa));

  const totalGanado = sumar(ganadas, 'monto');
  const totalEnNegociacion = sumar(enNegociacion, 'monto');
  const totalPipelineActivo = sumar(activas, 'monto');
  const totalOportunidades = delPeriodo.length;

  const tasaConversion = totalOportunidades > 0
    ? Math.round((ganadas.length / totalOportunidades) * 1000) / 10
    : 0;

  const ticketPromedio = ganadas.length > 0
    ? Math.round(totalGanado / ganadas.length)
    : totalOportunidades > 0
      ? Math.round(totalPipelineActivo / totalOportunidades)
      : 0;

  const ciclos = ganadas
    .map((oportunidad) => {
      const creado = instante(oportunidad.creado_en);
      const cerrado = instante(oportunidad.fecha_cierre);
      if (creado === null || cerrado === null || cerrado < creado) return null;
      return (cerrado - creado) / 86400000;
    })
    .filter((dias) => dias !== null);

  const tiempoPromedioCierreDias = ciclos.length > 0
    ? Math.round(ciclos.reduce((total, dias) => total + dias, 0) / ciclos.length)
    : 0;

  // --- Distribucion por sector (oportunidades del periodo) ---
  const sectoresMap = new Map();
  delPeriodo.forEach((oportunidad) => {
    const sector = oportunidad.cliente_sector || 'Otros';
    const actual = sectoresMap.get(sector) || { cantidad: 0, montoTotal: 0 };
    sectoresMap.set(sector, {
      cantidad: actual.cantidad + 1,
      montoTotal: actual.montoTotal + numero(oportunidad.monto),
    });
  });
  const totalValorSectores = Array.from(sectoresMap.values())
    .reduce((total, sector) => total + sector.montoTotal, 0);

  const distribucionSectores = Array.from(sectoresMap.entries())
    .map(([sector, datos], indice) => {
      const estilo = PALETA_SECTORES[indice % PALETA_SECTORES.length];
      return {
        sector,
        cantidad: datos.cantidad,
        montoTotal: datos.montoTotal,
        porcentaje: totalValorSectores > 0
          ? Math.round((datos.montoTotal / totalValorSectores) * 100)
          : Math.round((datos.cantidad / (totalOportunidades || 1)) * 100),
        colorClase: estilo.bg,
        colorHex: estilo.hex,
      };
    })
    .sort((a, b) => b.montoTotal - a.montoTotal || b.cantidad - a.cantidad);

  // --- Embudo por etapas ---
  let cantidadAnterior = totalOportunidades;
  const distribucionEtapas = ETAPAS.map((etapa) => {
    const deals = delPeriodo.filter((oportunidad) => oportunidad.etapa === etapa);
    const monto = sumar(deals, 'monto');
    const porcentaje = totalOportunidades > 0
      ? Math.round((deals.length / totalOportunidades) * 100)
      : 0;
    const tasaConversionEtapa = cantidadAnterior > 0
      ? Math.round((deals.length / cantidadAnterior) * 100)
      : 0;
    if (etapa !== 'perdida') cantidadAnterior = deals.length;

    return {
      etapa,
      nombre: NOMBRES_ETAPAS[etapa],
      cantidad: deals.length,
      monto,
      porcentaje,
      tasaConversionEtapa,
    };
  });

  // --- Ranking de responsables ---
  const responsablesMap = new Map();
  delPeriodo.forEach((oportunidad) => {
    const responsable = oportunidad.responsable || 'Sin Asignar';
    const actual = responsablesMap.get(responsable) || { deals: 0, monto: 0, ganadas: 0 };
    responsablesMap.set(responsable, {
      deals: actual.deals + 1,
      monto: actual.monto + numero(oportunidad.monto),
      ganadas: actual.ganadas + (oportunidad.etapa === 'ganada' ? 1 : 0),
    });
  });

  const topResponsables = Array.from(responsablesMap.entries())
    .map(([responsable, datos]) => ({
      responsable,
      deals: datos.deals,
      monto: datos.monto,
      ganadas: datos.ganadas,
      tasaExito: datos.deals > 0 ? Math.round((datos.ganadas / datos.deals) * 100) : 0,
    }))
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 5);

  // --- Tendencia real de los ultimos 6 meses ---
  const base = new Date(ahora);
  const tendenciaMensual = Array.from({ length: 6 }).map((_, indice) => {
    const fecha = new Date(base.getFullYear(), base.getMonth() - (5 - indice), 1);
    const desdeMes = inicioMes(fecha);
    const hastaMes = finMes(fecha);

    const creadas = oportunidades.filter((oportunidad) => {
      const creado = instante(oportunidad.creado_en);
      return creado !== null && creado >= desdeMes && creado < hastaMes;
    });
    const ganadasMes = oportunidades.filter((oportunidad) => {
      const cerrado = instante(oportunidad.fecha_cierre);
      return (
        oportunidad.etapa === 'ganada'
        && cerrado !== null
        && cerrado >= desdeMes
        && cerrado < hastaMes
      );
    });

    return {
      ...etiquetaMes(fecha),
      montoGanado: sumar(ganadasMes, 'monto'),
      montoPipeline: sumar(creadas.filter((oportunidad) => !esCerrada(oportunidad.etapa)), 'monto'),
      dealsGanados: ganadasMes.length,
      dealsTotales: creadas.length,
    };
  });

  return {
    tasaConversion,
    ticketPromedio,
    totalCuentas: Array.isArray(clientes) ? clientes.length : 0,
    totalOportunidades,
    totalGanado,
    totalEnNegociacion,
    totalPipelineActivo,
    tiempoPromedioCierreDias,
    distribucionSectores,
    distribucionEtapas,
    topResponsables,
    tendenciaMensual,
  };
}
