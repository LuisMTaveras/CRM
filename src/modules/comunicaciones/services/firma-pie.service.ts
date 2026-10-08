import type { ConfiguracionFirma, ConfiguracionPiePagina } from '../types/webmail.types';
import { empresaService } from '@/modules/configuracion/services/empresa.service';
import type { Usuario } from '@/modules/auth/types/auth.types';

const CLAVE_STORAGE_FIRMA_BASE = 'crm_config_firma_correo';
const CLAVE_STORAGE_PIE = 'crm_config_pie_correo';

export const FIRMA_POR_DEFECTO: ConfiguracionFirma = {
  habilitada: true,
  nombreRemitente: 'Luis M. Taveras',
  cargo: 'Team Leader TI Support',
  departamento: 'Ingeniería de Software & Soporte TI',
  empresa: 'Ingenieria de Software Alliance S.R.L.',
  telefono: '+1 (809) 555-0100',
  celular: '+1 (829) 708-4706',
  sitioWeb: 'alliance.do',
  colorAcento: '#4f46e5', // indigo-600
  textoPersonalizado: 'Comprometidos con la excelencia técnica y operativa.',
  incluirLogo: false,
};

export const PIE_POR_DEFECTO: ConfiguracionPiePagina = {
  habilitado: true,
  textoLegal: `AVISO DE CONFIDENCIALIDAD: Este mensaje de correo electrónico y cualquier archivo adjunto contienen información confidencial y privilegiada para el uso exclusivo del destinatario designado. Si usted no es el destinatario intencional, se le notifica que cualquier divulgación, copia, distribución o toma de acción basada en el contenido de este correo está estrictamente prohibida de conformidad con la Ley No. 172-13 sobre Protección Integral de los Datos Personales de la República Dominicana. Si ha recibido este mensaje por error, por favor notifíquelo de inmediato al remitente y elimínelo permanentemente de su sistema.`,
  incluirAvisoConfidencialidad: true,
  incluirDireccionEmpresa: true,
  direccionFisica: 'Av. Winston Churchill No. 1099, Torre Acrópolis Piso 14, Piantini, Santo Domingo, D.N.',
  incluirRnc: true,
  rncEmpresa: 'RNC: 1-32-45890-1',
  colorTexto: '#71717a', // zinc-500
};

class FirmaPieService {
  /**
   * Obtiene la sesión del usuario activo desde localStorage si existe
   */
  private obtenerUsuarioSesion(): Omit<Usuario, 'contrasena'> | null {
    try {
      const guardada = localStorage.getItem('crm_sesion_auth');
      if (guardada) {
        const parsed = JSON.parse(guardada);
        if (parsed?.usuario) return parsed.usuario;
      }
    } catch {
      // fallback
    }
    return null;
  }

  /**
   * Obtiene la firma de correo garantizando gobierno corporativo:
   * Los datos institucionales (Empresa, Web, Teléfono PBX) provienen de empresaService.
   * Los datos del colaborador (Nombre, Cargo oficial, Flota) provienen de su perfil de usuario.
   */
  obtenerFirma(usuarioId?: string): ConfiguracionFirma {
    let preferenciasGuardadas: Partial<ConfiguracionFirma> = {};

    try {
      const clave = usuarioId ? `crm_config_firma_${usuarioId}` : CLAVE_STORAGE_FIRMA_BASE;
      const guardada = localStorage.getItem(clave) || localStorage.getItem(CLAVE_STORAGE_FIRMA_BASE);
      if (guardada) {
        preferenciasGuardadas = JSON.parse(guardada);
      }
    } catch {
      // fallback
    }

    // Datos institucionales oficiales (Fuente única de la verdad)
    const datosEmpresa = empresaService.obtenerDatos();
    const usuarioActual = this.obtenerUsuarioSesion();

    return {
      ...FIRMA_POR_DEFECTO,
      ...preferenciasGuardadas,
      // CAMPOS INMUTABLES POR EL USUARIO (Gobierno de Identidad de Marca desde la DB):
      empresa: datosEmpresa.razonSocial || datosEmpresa.nombreComercial || FIRMA_POR_DEFECTO.empresa,
      sitioWeb: datosEmpresa.sitioWeb || FIRMA_POR_DEFECTO.sitioWeb,
      telefono: datosEmpresa.telefono || FIRMA_POR_DEFECTO.telefono,
      // CAMPOS OFICIALES DEL COLABORADOR (Vienen de su ficha en el CRM):
      nombreRemitente: usuarioActual?.nombre || preferenciasGuardadas.nombreRemitente || FIRMA_POR_DEFECTO.nombreRemitente,
      cargo: usuarioActual?.cargo || preferenciasGuardadas.cargo || FIRMA_POR_DEFECTO.cargo,
      departamento: usuarioActual?.departamento || preferenciasGuardadas.departamento || FIRMA_POR_DEFECTO.departamento,
      celular: usuarioActual?.telefonoFlota || preferenciasGuardadas.celular || FIRMA_POR_DEFECTO.celular,
    };
  }

  /**
   * Guarda las preferencias personales del colaborador (activo/inactivo, color, lema)
   * asegurando que los campos corporativos permanezcan protegidos.
   */
  guardarFirma(firma: ConfiguracionFirma, usuarioId?: string): void {
    try {
      const clave = usuarioId ? `crm_config_firma_${usuarioId}` : CLAVE_STORAGE_FIRMA_BASE;
      localStorage.setItem(clave, JSON.stringify(firma));
      localStorage.setItem(CLAVE_STORAGE_FIRMA_BASE, JSON.stringify(firma));
    } catch {
      // fallback
    }
  }

  /**
   * Obtiene la configuración del pie institucional protegiendo dirección y RNC directamente desde la DB
   */
  obtenerPie(): ConfiguracionPiePagina {
    let pieGuardado: Partial<ConfiguracionPiePagina> = {};

    try {
      const guardado = localStorage.getItem(CLAVE_STORAGE_PIE);
      if (guardado) {
        pieGuardado = JSON.parse(guardado);
      }
    } catch {
      // fallback
    }

    const datosEmpresa = empresaService.obtenerDatos();
    let direccionCompleta = datosEmpresa.direccion || '';
    if (datosEmpresa.ciudad && !direccionCompleta.toLowerCase().includes(datosEmpresa.ciudad.toLowerCase())) {
      direccionCompleta = direccionCompleta ? `${direccionCompleta}, ${datosEmpresa.ciudad}` : datosEmpresa.ciudad;
    }

    return {
      ...PIE_POR_DEFECTO,
      ...pieGuardado,
      direccionFisica: pieGuardado.direccionFisica || direccionCompleta || PIE_POR_DEFECTO.direccionFisica,
      rncEmpresa: pieGuardado.rncEmpresa || (datosEmpresa.identificacionFiscal ? `RNC: ${datosEmpresa.identificacionFiscal}` : PIE_POR_DEFECTO.rncEmpresa),
    };
  }

  guardarPie(pie: ConfiguracionPiePagina): void {
    try {
      localStorage.setItem(CLAVE_STORAGE_PIE, JSON.stringify(pie));
    } catch {
      // fallback
    }
  }

  /**
   * Genera el HTML enriquecido de la firma profesional con soporte para modo claro y oscuro
   */
  generarHtmlFirma(firma: ConfiguracionFirma, modoOscuro: boolean = false): string {
    if (!firma.habilitada) return '';

    const colorTexto = modoOscuro ? '#e4e4e7' : '#27272a';
    const colorNombre = modoOscuro ? '#fafafa' : '#09090b';
    const colorSecundario = modoOscuro ? '#a1a1aa' : '#71717a';
    const colorDetalles = modoOscuro ? '#d4d4d8' : '#52525b';
    const colorEnlace = modoOscuro ? '#818cf8' : (firma.colorAcento || '#4f46e5');

    return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; font-size: 13px; color: ${colorTexto}; line-height: 1.4; border-collapse: collapse;">
  <tr>
    <td style="border-left: 3px solid ${firma.colorAcento || '#4f46e5'}; padding-left: 12px;">
      <div style="font-weight: bold; font-size: 14px; color: ${colorNombre};">${firma.nombreRemitente}</div>
      <div style="color: ${colorSecundario}; font-size: 12px; margin-top: 2px;">${firma.cargo} | <strong style="color: ${colorEnlace};">${firma.empresa}</strong></div>
      ${firma.departamento ? `<div style="color: ${colorSecundario}; font-size: 11px;">${firma.departamento}</div>` : ''}
      <div style="margin-top: 8px; font-size: 12px; color: ${colorDetalles};">
        <span>📞 ${firma.telefono}</span>
        ${firma.celular ? `<span style="margin-left: 10px;">📱 ${firma.celular}</span>` : ''}
        ${firma.sitioWeb ? `<span style="margin-left: 10px;">🌐 <a href="https://${firma.sitioWeb}" style="color: ${colorEnlace}; text-decoration: none; font-weight: 500;">${firma.sitioWeb}</a></span>` : ''}
      </div>
      ${firma.textoPersonalizado ? `<div style="margin-top: 6px; font-size: 11px; font-style: italic; color: ${colorSecundario};">"${firma.textoPersonalizado}"</div>` : ''}
    </td>
  </tr>
</table>`.trim();
  }

  /**
   * Genera el HTML del pie legal y aviso de confidencialidad institucional con soporte de modo claro y oscuro
   */
  generarHtmlPie(pie: ConfiguracionPiePagina, modoOscuro: boolean = false): string {
    if (!pie.habilitado) return '';

    const colorBorde = modoOscuro ? '#3f3f46' : '#e4e4e7';
    const colorTextoLegal = modoOscuro ? '#a1a1aa' : (pie.colorTexto || '#71717a');
    const colorMetadatos = modoOscuro ? '#71717a' : '#a1a1aa';

    return `
<div style="font-family: Arial, sans-serif; font-size: 10px; color: ${colorTextoLegal}; line-height: 1.5; border-top: 1px dashed ${colorBorde}; padding-top: 10px; margin-top: 18px;">
  ${pie.incluirAvisoConfidencialidad ? `<p style="margin: 0 0 6px 0; text-align: justify;">${pie.textoLegal}</p>` : ''}
  <div style="color: ${colorMetadatos}; font-size: 9px;">
    ${pie.incluirDireccionEmpresa && pie.direccionFisica ? `<span>🏢 ${pie.direccionFisica}</span>` : ''}
    ${pie.incluirRnc && pie.rncEmpresa ? `<span style="margin-left: 8px;">• ${pie.rncEmpresa}</span>` : ''}
  </div>
</div>`.trim();
  }
}

export const firmaPieService = new FirmaPieService();
