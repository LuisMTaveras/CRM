import type { ConfiguracionFirma, ConfiguracionPiePagina } from '../types/webmail.types';

const CLAVE_STORAGE_FIRMA = 'crm_config_firma_correo';
const CLAVE_STORAGE_PIE = 'crm_config_pie_correo';

export const FIRMA_POR_DEFECTO: ConfiguracionFirma = {
  habilitada: true,
  nombreRemitente: 'Camila Morales',
  cargo: 'Directora Comercial & Operaciones B2B',
  departamento: 'División Comercial & Grandes Cuentas',
  empresa: 'DEVFORGE Dominicana SRL',
  telefono: '+1 (809) 555-0100',
  celular: '+1 (829) 555-0199',
  sitioWeb: 'www.devforge.com.do',
  colorAcento: '#4f46e5', // indigo-600
  textoPersonalizado: 'Comprometidos con la excelencia operativa y transformación digital de su empresa.',
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
  obtenerFirma(): ConfiguracionFirma {
    try {
      const guardada = localStorage.getItem(CLAVE_STORAGE_FIRMA);
      if (guardada) {
        return { ...FIRMA_POR_DEFECTO, ...JSON.parse(guardada) };
      }
    } catch {
      // fallback
    }
    return { ...FIRMA_POR_DEFECTO };
  }

  guardarFirma(firma: ConfiguracionFirma): void {
    try {
      localStorage.setItem(CLAVE_STORAGE_FIRMA, JSON.stringify(firma));
    } catch {
      // fallback
    }
  }

  obtenerPie(): ConfiguracionPiePagina {
    try {
      const guardado = localStorage.getItem(CLAVE_STORAGE_PIE);
      if (guardado) {
        return { ...PIE_POR_DEFECTO, ...JSON.parse(guardado) };
      }
    } catch {
      // fallback
    }
    return { ...PIE_POR_DEFECTO };
  }

  guardarPie(pie: ConfiguracionPiePagina): void {
    try {
      localStorage.setItem(CLAVE_STORAGE_PIE, JSON.stringify(pie));
    } catch {
      // fallback
    }
  }

  generarHtmlFirma(firma: ConfiguracionFirma): string {
    if (!firma.habilitada) return '';

    return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; font-size: 13px; color: #27272a; line-height: 1.4; border-collapse: collapse;">
  <tr>
    <td style="border-left: 3px solid ${firma.colorAcento || '#4f46e5'}; padding-left: 12px;">
      <div style="font-weight: bold; font-size: 14px; color: #09090b;">${firma.nombreRemitente}</div>
      <div style="color: #71717a; font-size: 12px; margin-top: 2px;">${firma.cargo} | <span style="color: #4f46e5;">${firma.empresa}</span></div>
      ${firma.departamento ? `<div style="color: #a1a1aa; font-size: 11px;">${firma.departamento}</div>` : ''}
      <div style="margin-top: 8px; font-size: 12px; color: #52525b;">
        <span>📞 ${firma.telefono}</span>
        ${firma.celular ? `<span style="margin-left: 10px;">📱 ${firma.celular}</span>` : ''}
        ${firma.sitioWeb ? `<span style="margin-left: 10px;">🌐 <a href="https://${firma.sitioWeb}" style="color: #4f46e5; text-decoration: none;">${firma.sitioWeb}</a></span>` : ''}
      </div>
      ${firma.textoPersonalizado ? `<div style="margin-top: 6px; font-size: 11px; font-style: italic; color: #71717a;">"${firma.textoPersonalizado}"</div>` : ''}
    </td>
  </tr>
</table>`.trim();
  }

  generarHtmlPie(pie: ConfiguracionPiePagina): string {
    if (!pie.habilitado) return '';

    return `
<div style="font-family: Arial, sans-serif; font-size: 10px; color: ${pie.colorTexto || '#71717a'}; line-height: 1.5; border-top: 1px dashed #e4e4e7; padding-top: 10px; margin-top: 18px;">
  ${pie.incluirAvisoConfidencialidad ? `<p style="margin: 0 0 6px 0; text-align: justify;">${pie.textoLegal}</p>` : ''}
  <div style="color: #a1a1aa; font-size: 9px;">
    ${pie.incluirDireccionEmpresa && pie.direccionFisica ? `<span>🏢 ${pie.direccionFisica}</span>` : ''}
    ${pie.incluirRnc && pie.rncEmpresa ? `<span style="margin-left: 8px;">• ${pie.rncEmpresa}</span>` : ''}
  </div>
</div>`.trim();
  }
}

export const firmaPieService = new FirmaPieService();
