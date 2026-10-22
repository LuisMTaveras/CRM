import type { ConfiguracionSMTP, ProveedorPreset, ResultadoPruebaConexion } from '../types/smtp.types';
import { empresaService } from '@/modules/configuracion/services/empresa.service';

const CLAVE_STORAGE_SMTP = 'crm_config_smtp_servidor';

const CONFIGURACION_DEFAULT: ConfiguracionSMTP = {
  proveedor: 'personalizado',
  servidorSmtp: '',
  puertoSmtp: 587,
  seguridadSmtp: 'tls',
  requiereAutenticacion: true,
  usuarioSmtp: '',
  contrasenaSmtp: '',
  habilitarImap: true,
  servidorImap: '',
  puertoImap: 993,
  seguridadImap: 'ssl',
  usuarioImap: '',
  contrasenaImap: '',
  nombreRemitente: '',
  correoRemitente: '',
  correoRespuesta: '',
  firmaTexto: '',
  activo: false,
  ultimaVerificacion: null,
};

export const PRESETS_PROVEEDORES: Record<ProveedorPreset, Partial<ConfiguracionSMTP>> = {
  microsoft: {
    proveedor: 'microsoft',
    servidorSmtp: 'smtp.office365.com',
    puertoSmtp: 587,
    seguridadSmtp: 'tls',
    servidorImap: 'outlook.office365.com',
    puertoImap: 993,
    seguridadImap: 'ssl',
  },
  google: {
    proveedor: 'google',
    servidorSmtp: 'smtp.gmail.com',
    puertoSmtp: 587,
    seguridadSmtp: 'tls',
    servidorImap: 'imap.gmail.com',
    puertoImap: 993,
    seguridadImap: 'ssl',
  },
  cpanel: {
    proveedor: 'cpanel',
    servidorSmtp: 'mail.empresa.com.do',
    puertoSmtp: 465,
    seguridadSmtp: 'ssl',
    servidorImap: 'mail.empresa.com.do',
    puertoImap: 993,
    seguridadImap: 'ssl',
  },
  personalizado: {
    proveedor: 'personalizado',
    servidorSmtp: 'smtp.empresa.com.do',
    puertoSmtp: 587,
    seguridadSmtp: 'tls',
    servidorImap: 'imap.empresa.com.do',
    puertoImap: 993,
    seguridadImap: 'ssl',
  },
};

class SmtpService {
  private configMemoria: ConfiguracionSMTP = this.cargarConfiguracion();

  cargarConfiguracion(): ConfiguracionSMTP {
    try {
      const guardada = localStorage.getItem(CLAVE_STORAGE_SMTP);
      if (guardada) {
        const parsed = JSON.parse(guardada);
        return { ...CONFIGURACION_DEFAULT, ...parsed };
      }
    } catch {
      // Ignorar error de JSON parse en entornos sin storage
    }
    return { ...CONFIGURACION_DEFAULT };
  }

  obtenerConfiguracion(): ConfiguracionSMTP {
    return this.resolverIdentidadCorporativa(this.configMemoria);
  }

  /** Construye los campos institucionales a partir de la única fuente de verdad. */
  private resolverIdentidadCorporativa(configuracion: ConfiguracionSMTP): ConfiguracionSMTP {
    const empresa = empresaService.obtenerDatos();
    const nombreEmpresa = empresa.nombreComercial || empresa.razonSocial;
    const direccion = [empresa.direccion, empresa.ciudad, empresa.pais].filter(Boolean).join(', ');
    const lineaContacto = [empresa.telefono ? `Tel: ${empresa.telefono}` : '', empresa.sitioWeb].filter(Boolean).join(' | ');
    const firma = [
      'Atentamente,',
      'Departamento Comercial & Facturación B2B',
      [empresa.razonSocial || nombreEmpresa, empresa.identificacionFiscal ? `RNC: ${empresa.identificacionFiscal}` : ''].filter(Boolean).join(' • '),
      direccion,
      lineaContacto,
    ].filter(Boolean).join('\n');

    return {
      ...configuracion,
      nombreRemitente: nombreEmpresa ? `${nombreEmpresa} — Departamento Comercial` : configuracion.nombreRemitente,
      correoRemitente: configuracion.correoRemitente || configuracion.usuarioSmtp || empresa.correo,
      correoRespuesta: configuracion.correoRespuesta || configuracion.correoRemitente || configuracion.usuarioSmtp || empresa.correo,
      firmaTexto: firma || configuracion.firmaTexto,
    };
  }

  guardarConfiguracion(nuevaConfig: ConfiguracionSMTP): void {
    this.configMemoria = this.resolverIdentidadCorporativa(nuevaConfig);
    try {
      localStorage.setItem(CLAVE_STORAGE_SMTP, JSON.stringify(this.configMemoria));
    } catch {
      // Storage fallback
    }

    // Notificar al backend de correo para persistencia remota
    try {
      const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3002/api'}/email/configuracion`;
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.configMemoria),
      }).catch(() => {});
    } catch {
      // Silencioso si el servidor backend está en proceso de arranque
    }
  }

  aplicarPreset(proveedor: ProveedorPreset): ConfiguracionSMTP {
    const preset = PRESETS_PROVEEDORES[proveedor];
    this.configMemoria = {
      ...this.configMemoria,
      ...preset,
      proveedor,
    };
    return { ...this.configMemoria };
  }

  /**
   * Prueba la conexión SMTP real vía el servidor Nodemailer backend.
   * Si el servidor no está disponible, hace un test básico de validación de campos.
   */
  async probarConexion(config: ConfiguracionSMTP): Promise<ResultadoPruebaConexion> {
    if (!config.servidorSmtp || !config.usuarioSmtp || !config.correoRemitente) {
      return {
        exito: false,
        mensaje: 'Faltan parámetros obligatorios: Servidor SMTP, Usuario y Correo Remitente.',
        latenciaMs: 0,
        detalles: { smtpConectado: false, autenticacionAceptada: false, tlsHabilitado: false },
      };
    }

    const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3002/api'}/email/probar-conexion`;

    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servidorSmtp: config.servidorSmtp,
          puertoSmtp: config.puertoSmtp,
          seguridadSmtp: config.seguridadSmtp,
          usuarioSmtp: config.usuarioSmtp,
          contrasenaSmtp: config.contrasenaSmtp,
        }),
        signal: AbortSignal.timeout(15000),
      });

      const resultado: ResultadoPruebaConexion = await resp.json();

      // Si fue exitoso, guardar la latencia real y marcar como activo
      if (resultado.exito) {
        config.ultimaVerificacion = new Date().toISOString();
        config.latenciaMs = resultado.latenciaMs;
        config.activo = true;
        this.guardarConfiguracion(config);
      }

      return resultado;
    } catch (fetchErr) {
      // El servidor backend no está activo — notificar al usuario
      console.warn('[SMTP TEST] Servidor de email no disponible:', fetchErr);
      return {
        exito: false,
        mensaje: 'El servidor de correo (email-server.js) no está activo. Ejecuta: npm run email-server',
        latenciaMs: 0,
        detalles: { smtpConectado: false, autenticacionAceptada: false, tlsHabilitado: false },
      };
    }
  }
}

export const smtpService = new SmtpService();
