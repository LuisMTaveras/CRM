import type { MensajeCorreo } from '../types/webmail.types';
import type {
  ReglaCorreo,
  CondicionRegla,
  CarpetaPersonalizada,
  ResumenEjecucionReglas,
} from '../types/reglas-correo.types';

const STORAGE_KEY_REGLAS = 'crm_reglas_correo_v2';
const STORAGE_KEY_CARPETAS = 'crm_carpetas_personalizadas_v2';
const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3002/api'}/email`;

// Carpetas personalizadas predeterminadas
const CARPETAS_DEFAULT: CarpetaPersonalizada[] = [
  { id: 'facturacion', nombre: 'Facturación y Pagos', color: 'emerald', creadaEn: new Date().toISOString() },
  { id: 'verafeca', nombre: 'Verafeca SRL', color: 'indigo', creadaEn: new Date().toISOString() },
  { id: 'licitaciones', nombre: 'Licitaciones Públicas', color: 'amber', creadaEn: new Date().toISOString() },
  { id: 'proveedores', nombre: 'Proveedores', color: 'sky', creadaEn: new Date().toISOString() },
];

// Reglas predeterminadas de ejemplo para el usuario
const REGLAS_DEFAULT: ReglaCorreo[] = [
  {
    id: 'regla-verafeca-auto',
    nombre: 'Organizar correos de Verafeca SRL',
    descripcion: 'Mueve automáticamente los correos del dominio @verafeca.com a la carpeta Verafeca SRL y los destaca.',
    activa: true,
    operadorLogico: 'OR',
    condiciones: [
      {
        id: 'c-1',
        campo: 'dominio_remitente',
        operador: 'contiene',
        valor: 'verafeca.com',
      },
      {
        id: 'c-2',
        campo: 'asunto_contiene',
        operador: 'contiene',
        valor: 'Verafeca',
      },
    ],
    acciones: {
      moverACarpeta: 'verafeca',
      nombreCarpetaDestino: 'Verafeca SRL',
      marcarDestacado: true,
      vincularClienteNombre: 'Verafeca SRL',
    },
    totalAplicados: 0,
    creadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString(),
  },
  {
    id: 'regla-facturas-auto',
    nombre: 'Clasificar Facturas y Comprobantes Fiscales',
    descripcion: 'Agrupa correos cuyo asunto o remitente hable de factura, cotización o pago en la carpeta Facturación.',
    activa: true,
    operadorLogico: 'OR',
    condiciones: [
      {
        id: 'c-3',
        campo: 'asunto_contiene',
        operador: 'contiene',
        valor: 'factura',
      },
      {
        id: 'c-4',
        campo: 'asunto_contiene',
        operador: 'contiene',
        valor: 'comprobante',
      },
      {
        id: 'c-5',
        campo: 'asunto_contiene',
        operador: 'contiene',
        valor: 'ncfe',
      },
    ],
    acciones: {
      moverACarpeta: 'facturacion',
      nombreCarpetaDestino: 'Facturación y Pagos',
      marcarDestacado: false,
    },
    totalAplicados: 0,
    creadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString(),
  },
];

class ReglasCorreoService {
  /**
   * Obtiene todas las reglas de filtrado guardadas
   */
  obtenerReglas(): ReglaCorreo[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_REGLAS);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // fallback
    }
    // Inicializar con reglas por defecto
    this.guardarReglasEnStorage(REGLAS_DEFAULT);
    return REGLAS_DEFAULT;
  }

  private guardarReglasEnStorage(reglas: ReglaCorreo[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_REGLAS, JSON.stringify(reglas));
    } catch (e) {
      console.warn('Error al guardar reglas en almacenamiento local:', e);
    }
  }

  /**
   * Guarda o actualiza una regla de correo
   */
  guardarRegla(
    regla: Omit<ReglaCorreo, 'id' | 'creadoEn' | 'actualizadoEn' | 'totalAplicados'> & { id?: string }
  ): ReglaCorreo {
    const reglas = this.obtenerReglas();
    const ahora = new Date().toISOString();

    if (regla.id) {
      const index = reglas.findIndex((r) => r.id === regla.id);
      if (index !== -1) {
        const existente = reglas[index];
        const actualizada: ReglaCorreo = {
          ...existente,
          ...regla,
          id: existente.id,
          actualizadoEn: ahora,
          totalAplicados: existente.totalAplicados || 0,
        };
        reglas[index] = actualizada;
        this.guardarReglasEnStorage(reglas);
        return actualizada;
      }
    }

    const nuevaRegla: ReglaCorreo = {
      ...regla,
      id: `regla-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      totalAplicados: 0,
      creadoEn: ahora,
      actualizadoEn: ahora,
    };

    reglas.unshift(nuevaRegla);
    this.guardarReglasEnStorage(reglas);
    return nuevaRegla;
  }

  /**
   * Activa o desactiva una regla
   */
  toggleRegla(id: string, activa: boolean): boolean {
    const reglas = this.obtenerReglas();
    const r = reglas.find((item) => item.id === id);
    if (r) {
      r.activa = activa;
      r.actualizadoEn = new Date().toISOString();
      this.guardarReglasEnStorage(reglas);
      return true;
    }
    return false;
  }

  /**
   * Elimina una regla por su identificador
   */
  eliminarRegla(id: string): boolean {
    const reglas = this.obtenerReglas();
    const filtradas = reglas.filter((r) => r.id !== id);
    if (filtradas.length !== reglas.length) {
      this.guardarReglasEnStorage(filtradas);
      return true;
    }
    return false;
  }

  /**
   * Obtiene la lista de carpetas personalizadas
   */
  obtenerCarpetasPersonalizadas(): CarpetaPersonalizada[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CARPETAS);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // fallback
    }
    this.guardarCarpetasEnStorage(CARPETAS_DEFAULT);
    return CARPETAS_DEFAULT;
  }

  private guardarCarpetasEnStorage(carpetas: CarpetaPersonalizada[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_CARPETAS, JSON.stringify(carpetas));
    } catch (e) {
      console.warn('Error al guardar carpetas personalizadas:', e);
    }
  }

  /**
   * Crea una nueva carpeta personalizada
   */
  crearCarpetaPersonalizada(
    nombre: string,
    color: CarpetaPersonalizada['color'] = 'indigo'
  ): CarpetaPersonalizada {
    const carpetas = this.obtenerCarpetasPersonalizadas();
    const nombreLimpio = nombre.trim();
    const id = nombreLimpio
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `carpeta-${Date.now()}`;

    // Si ya existe con ese id, retornarla
    const existente = carpetas.find((c) => c.id === id);
    if (existente) {
      return existente;
    }

    const nuevaCarpeta: CarpetaPersonalizada = {
      id,
      nombre: nombreLimpio,
      color,
      creadaEn: new Date().toISOString(),
    };

    carpetas.push(nuevaCarpeta);
    this.guardarCarpetasEnStorage(carpetas);
    return nuevaCarpeta;
  }

  /**
   * Elimina una carpeta personalizada
   */
  eliminarCarpetaPersonalizada(id: string): boolean {
    const carpetas = this.obtenerCarpetasPersonalizadas();
    const filtradas = carpetas.filter((c) => c.id !== id);
    if (filtradas.length !== carpetas.length) {
      this.guardarCarpetasEnStorage(filtradas);
      return true;
    }
    return false;
  }

  /**
   * Extrae el dominio de una dirección de correo (ej: "contacto@verafeca.com" -> "verafeca.com")
   */
  extraerDominio(correo: string): string {
    if (!correo) return '';
    const partes = correo.trim().toLowerCase().split('@');
    return partes.length > 1 ? partes[partes.length - 1] : '';
  }

  /**
   * Evalúa una condición individual sobre un mensaje
   */
  evaluarCondicion(mensaje: MensajeCorreo, condicion: CondicionRegla): boolean {
    const valorEsperado = (condicion.valor || '').trim().toLowerCase();
    const deCorreo = (mensaje.de?.correo || '').trim().toLowerCase();
    const deNombre = (mensaje.de?.nombre || '').trim().toLowerCase();
    const asunto = (mensaje.asunto || '').trim().toLowerCase();
    const dominioRemitente = this.extraerDominio(deCorreo);

    switch (condicion.campo) {
      case 'dominio_remitente': {
        const valorDominioLimpio = valorEsperado.replace(/^@/, '');
        if (!valorDominioLimpio) return false;

        if (condicion.operador === 'es_igual_a') {
          return dominioRemitente === valorDominioLimpio;
        }
        if (condicion.operador === 'termina_en') {
          return dominioRemitente.endsWith(valorDominioLimpio);
        }
        if (condicion.operador === 'no_contiene') {
          return !dominioRemitente.includes(valorDominioLimpio);
        }
        // contiene por defecto
        return dominioRemitente.includes(valorDominioLimpio) || deCorreo.includes(`@${valorDominioLimpio}`);
      }

      case 'correo_remitente': {
        if (condicion.operador === 'es_igual_a') return deCorreo === valorEsperado;
        if (condicion.operador === 'no_contiene') return !deCorreo.includes(valorEsperado);
        return deCorreo.includes(valorEsperado);
      }

      case 'nombre_remitente': {
        if (condicion.operador === 'es_igual_a') return deNombre === valorEsperado;
        if (condicion.operador === 'no_contiene') return !deNombre.includes(valorEsperado);
        return deNombre.includes(valorEsperado);
      }

      case 'asunto_contiene': {
        if (condicion.operador === 'es_igual_a') return asunto === valorEsperado;
        if (condicion.operador === 'no_contiene') return !asunto.includes(valorEsperado);
        return asunto.includes(valorEsperado);
      }

      case 'cuerpo_contiene': {
        const textoCompleto = `${mensaje.extracto || ''} ${mensaje.cuerpoTexto || ''} ${mensaje.cuerpoHtml || ''}`.toLowerCase();
        if (condicion.operador === 'no_contiene') return !textoCompleto.includes(valorEsperado);
        return textoCompleto.includes(valorEsperado);
      }

      case 'tiene_adjuntos': {
        const tiene = Boolean(mensaje.tieneAdjuntos || (mensaje.adjuntos && mensaje.adjuntos.length > 0));
        return condicion.operador === 'no_contiene' ? !tiene : tiene;
      }

      default:
        return false;
    }
  }

  /**
   * Evalúa si una regla aplica en su totalidad sobre un correo
   */
  evaluarMensaje(mensaje: MensajeCorreo, regla: ReglaCorreo): boolean {
    if (!regla.activa || !regla.condiciones || regla.condiciones.length === 0) {
      return false;
    }

    if (regla.operadorLogico === 'AND') {
      return regla.condiciones.every((c) => this.evaluarCondicion(mensaje, c));
    } else {
      // OR
      return regla.condiciones.some((c) => this.evaluarCondicion(mensaje, c));
    }
  }

  /**
   * Aplica las reglas sobre un correo individual (en memoria)
   */
  aplicarReglasAMensaje(
    mensaje: MensajeCorreo,
    reglas: ReglaCorreo[]
  ): { modificado: boolean; reglaId?: string; carpetaDestino?: string } {
    const reglasActivas = reglas.filter((r) => r.activa);

    for (const regla of reglasActivas) {
      if (this.evaluarMensaje(mensaje, regla)) {
        let modificado = false;

        // Acción: Mover a carpeta
        if (regla.acciones.moverACarpeta && mensaje.carpeta !== regla.acciones.moverACarpeta) {
          mensaje.carpeta = regla.acciones.moverACarpeta;
          modificado = true;
        }

        // Acción: Marcar destacado
        if (regla.acciones.marcarDestacado !== undefined && mensaje.destacado !== regla.acciones.marcarDestacado) {
          mensaje.destacado = regla.acciones.marcarDestacado;
          modificado = true;
        }

        // Acción: Marcar leído
        if (regla.acciones.marcarLeido !== undefined && mensaje.leido !== regla.acciones.marcarLeido) {
          mensaje.leido = regla.acciones.marcarLeido;
          modificado = true;
        }

        // Acción: Vincular cliente CRM
        if (regla.acciones.vincularClienteNombre && !mensaje.clienteNombreRelacionado) {
          mensaje.clienteNombreRelacionado = regla.acciones.vincularClienteNombre;
          modificado = true;
        }

        if (modificado) {
          regla.totalAplicados = (regla.totalAplicados || 0) + 1;
          return {
            modificado: true,
            reglaId: regla.id,
            carpetaDestino: regla.acciones.moverACarpeta,
          };
        }
      }
    }

    return { modificado: false };
  }

  /**
   * Ejecuta en lote las reglas activas sobre una lista de mensajes y sincroniza con el servidor
   */
  async ejecutarReglasLote(mensajes: MensajeCorreo[]): Promise<ResumenEjecucionReglas> {
    const reglas = this.obtenerReglas();
    const resumen: ResumenEjecucionReglas = {
      totalEvaluados: mensajes.length,
      totalModificados: 0,
      detallesPorRegla: [],
    };

    // Diccionario de mensajes movidos agrupados por carpeta destino
    const movimientosPorCarpeta: Record<string, string[]> = {};
    const conteoPorRegla: Record<string, { regla: ReglaCorreo; count: number }> = {};

    for (const msg of mensajes) {
      const carpetaOriginal = msg.carpeta;
      const res = this.aplicarReglasAMensaje(msg, reglas);

      if (res.modificado && res.reglaId) {
        resumen.totalModificados++;

        if (!conteoPorRegla[res.reglaId]) {
          const r = reglas.find((item) => item.id === res.reglaId);
          if (r) {
            conteoPorRegla[res.reglaId] = { regla: r, count: 0 };
          }
        }
        if (conteoPorRegla[res.reglaId]) {
          conteoPorRegla[res.reglaId].count++;
        }

        if (res.carpetaDestino && res.carpetaDestino !== carpetaOriginal) {
          if (!movimientosPorCarpeta[res.carpetaDestino]) {
            movimientosPorCarpeta[res.carpetaDestino] = [];
          }
          movimientosPorCarpeta[res.carpetaDestino].push(msg.id);
        }
      }
    }

    // Persistir conteos actualizados de reglas
    this.guardarReglasEnStorage(reglas);

    // Enviar sincronización en lote al servidor backend para cada carpeta afectada
    for (const [carpeta, ids] of Object.entries(movimientosPorCarpeta)) {
      if (ids.length > 0) {
        try {
          await fetch(`${API_BASE_URL}/mensajes/lote/mover`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids, carpeta }),
          });
        } catch (e) {
          console.warn(`No se pudo sincronizar lote para carpeta ${carpeta}:`, e);
        }
      }
    }

    // Construir detalles finales
    resumen.detallesPorRegla = Object.values(conteoPorRegla).map(({ regla, count }) => ({
      reglaId: regla.id,
      reglaNombre: regla.nombre,
      mensajesAfectados: count,
      carpetaDestino: regla.acciones.nombreCarpetaDestino || regla.acciones.moverACarpeta,
    }));

    return resumen;
  }
}

export const reglasCorreoService = new ReglasCorreoService();
