import type { ConfiguracionSMTP, ProveedorPreset, ResultadoPruebaConexion } from '../types/smtp.types';

const CLAVE_STORAGE_SMTP = 'crm_config_smtp_servidor';

const CONFIGURACION_DEFAULT: ConfiguracionSMTP = {
  proveedor: 'personalizado',
  servidorSmtp: 'smtp.empresa.com.do',
  puertoSmtp: 587,
  seguridadSmtp: 'tls',
  requiereAutenticacion: true,
  usuarioSmtp: 'ventas@empresa.com.do',
  contrasenaSmtp: '••••••••••••',
  habilitarImap: true,
  servidorImap: 'imap.empresa.com.do',
  puertoImap: 993,
  seguridadImap: 'ssl',
  usuarioImap: 'ventas@empresa.com.do',
  contrasenaImap: '••••••••••••',
  nombreRemitente: 'DEVFORGE Dominicana — Departamento Comercial',
  correoRemitente: 'ventas@empresa.com.do',
  correoRespuesta: 'soporte@empresa.com.do',
  firmaTexto: `Atentamente,
Departamento Comercial & Facturación B2B
DEVFORGE Dominicana SRL • RNC: 1-32-45890-1
Av. Winston Churchill, Torre Empresarial, Santo Domingo, Rep. Dom.
Tel: +1 (809) 555-0100 | www.devforge.com.do`,
  activo: true,
  ultimaVerificacion: new Date().toISOString(),
  latenciaMs: 42,
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
        return { ...CONFIGURACION_DEFAULT, ...JSON.parse(guardada) };
      }
    } catch {
      // Ignorar error de JSON parse en entornos sin storage
    }
    return { ...CONFIGURACION_DEFAULT };
  }

  obtenerConfiguracion(): ConfiguracionSMTP {
    return { ...this.configMemoria };
  }

  guardarConfiguracion(nuevaConfig: ConfiguracionSMTP): void {
    this.configMemoria = { ...nuevaConfig };
    try {
      localStorage.setItem(CLAVE_STORAGE_SMTP, JSON.stringify(this.configMemoria));
    } catch {
      // Storage fallback
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
