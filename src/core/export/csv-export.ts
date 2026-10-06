/**
 * Utilidad de exportación a CSV con codificación UTF-8 y BOM
 * Garantiza compatibilidad nativa con Microsoft Excel y hojas de cálculo.
 */

export interface ColumnaCSV<T> {
  clave: keyof T | string;
  titulo: string;
  formateador?: (valor: any, registro: T) => string;
}

export function exportarACSV<T extends Record<string, any>>(
  datos: T[],
  columnas: ColumnaCSV<T>[],
  nombreArchivo: string = 'exportacion'
): void {
  if (!datos || datos.length === 0) {
    alert('No hay registros disponibles para exportar.');
    return;
  }

  // Encabezados
  const encabezados = columnas.map((col) => `"${col.titulo.replace(/"/g, '""')}"`).join(',');

  // Filas
  const filas = datos.map((fila) => {
    return columnas
      .map((col) => {
        let val: any;
        if (typeof col.clave === 'string' && col.clave.includes('.')) {
          val = col.clave.split('.').reduce((acc, part) => acc?.[part], fila);
        } else {
          val = fila[col.clave as keyof T];
        }

        if (col.formateador) {
          val = col.formateador(val, fila);
        }

        if (val === null || val === undefined) {
          return '""';
        }

        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      })
      .join(',');
  });

  // BOM para soporte de tildes y caracteres especiales en Excel (UTF-8)
  const csvContent = '\uFEFF' + [encabezados, ...filas].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const enlace = document.createElement('a');
  enlace.setAttribute('href', url);
  enlace.setAttribute('download', `${nombreArchivo}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
