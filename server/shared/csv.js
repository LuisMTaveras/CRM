/**
 * Utilidades CSV compartidas por los modulos del backend CRM.
 * Exportacion segura contra inyeccion de formulas y parser tolerante.
 */

export function celdaCsv(valor) {
  let texto = String(valor ?? '');
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return `"${texto.replace(/"/g, '""')}"`;
}

export function filaCsv(valores) {
  return valores.map(celdaCsv).join(',');
}

/**
 * Convierte un texto CSV en una matriz de filas.
 * Soporta comillas dobles, saltos de linea dentro de campos y BOM.
 */
export function parsearCsv(texto) {
  const contenido = String(texto ?? '').replace(/^\ufeff/, '');
  const filas = [];
  let fila = [];
  let campo = '';
  let entreComillas = false;

  for (let i = 0; i < contenido.length; i += 1) {
    const caracter = contenido[i];

    if (entreComillas) {
      if (caracter === '"') {
        if (contenido[i + 1] === '"') {
          campo += '"';
          i += 1;
        } else {
          entreComillas = false;
        }
      } else {
        campo += caracter;
      }
      continue;
    }

    if (caracter === '"') {
      entreComillas = true;
    } else if (caracter === ',') {
      fila.push(campo);
      campo = '';
    } else if (caracter === '\n') {
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = '';
    } else if (caracter === '\r') {
      // Ignorar CR; el LF cierra la fila.
    } else {
      campo += caracter;
    }
  }

  if (campo !== '' || fila.length > 0) {
    fila.push(campo);
    filas.push(fila);
  }

  return filas.filter((registro) => registro.some((valor) => String(valor).trim() !== ''));
}

/**
 * Convierte filas CSV (con encabezado) en objetos usando un mapa
 * encabezado -> campo. Tambien acepta encabezados con el nombre del campo.
 */
export function csvAObjetos(texto, mapa = {}) {
  const filas = parsearCsv(texto);
  if (filas.length === 0) return [];

  const encabezados = filas[0].map((valor) => String(valor).trim());
  const claves = encabezados.map((encabezado) => {
    if (mapa[encabezado]) return mapa[encabezado];
    const normalizado = encabezado
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return mapa[normalizado] || normalizado;
  });

  return filas.slice(1).map((fila) => {
    const registro = {};
    claves.forEach((clave, indice) => {
      registro[clave] = String(fila[indice] ?? '').trim();
    });
    return registro;
  });
}
