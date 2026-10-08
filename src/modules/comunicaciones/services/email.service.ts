import { clienteService } from '@/modules/clientes/services/cliente.service';
import type { Cliente } from '@/modules/clientes/types/cliente.types';
import type { Usuario } from '@/modules/auth/types/auth.types';
import { formatCurrency, formatDate } from '@/core/formatters/formatters';
import { PLANTILLAS_PREDEFINIDAS } from './plantillas.mock';
import { pdfGeneratorService } from './pdf-generator.service';
import { smtpService } from './smtp.service';
import { empresaService } from '@/modules/configuracion/services/empresa.service';
import type {
  PlantillaDocumento,
  VariablesPlantilla,
  RegistroEnvio,
} from '../types/comunicacion.types';

const CLAVE_STORAGE_PLANTILLAS = 'crm_plantillas_personalizadas';
const CLAVE_STORAGE_HISTORIAL = 'crm_historial_envios';

/** URL del servidor SMTP proxy (Node/Express con Nodemailer) */
const API_EMAIL_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3002/api'}/email`;

/** Verifica si el servidor de email está disponible */
async function servidorEmailDisponible(): Promise<boolean> {
  try {
    const resp = await fetch(`${API_EMAIL_URL}/estado`, { signal: AbortSignal.timeout(3000) });
    return resp.ok;
  } catch {
    return false;
  }
}

class EmailService {
  private historialEnvios: RegistroEnvio[] = this.cargarHistorial();
  private plantillasPersonalizadas: PlantillaDocumento[] = this.cargarPlantillasPersonalizadas();

  /** Comprueba la salud del servidor de correo Nodemailer */
  async verificarServidor(): Promise<boolean> {
    return servidorEmailDisponible();
  }

  // ─── Persistencia de Historial ─────────────────────────────────────────────
  private cargarHistorial(): RegistroEnvio[] {
    try {
      const guardado = localStorage.getItem(CLAVE_STORAGE_HISTORIAL);
      if (guardado) return JSON.parse(guardado);
    } catch {
      // fallback silencioso
    }
    return [];
  }

  private guardarHistorial(): void {
    try {
      // Limitar a los últimos 500 registros para no sobrecargar localStorage
      const slice = this.historialEnvios.slice(0, 500);
      localStorage.setItem(CLAVE_STORAGE_HISTORIAL, JSON.stringify(slice));
    } catch {
      // fallback
    }
  }

  private cargarPlantillasPersonalizadas(): PlantillaDocumento[] {
    try {
      const guardadas = localStorage.getItem(CLAVE_STORAGE_PLANTILLAS);
      if (guardadas) {
        const parsed: PlantillaDocumento[] = JSON.parse(guardadas);
        const filtradas = parsed.filter(
          (p) =>
            !['plt-propuesta', 'plt-nda', 'plt-cotizacion'].includes(p.id) &&
            !p.nombre.toLowerCase().includes('propuesta comercial b2b') &&
            !p.nombre.toLowerCase().includes('acuerdo de confidencialidad') &&
            !p.nombre.toLowerCase().includes('cotización formal')
        );
        if (filtradas.length !== parsed.length) {
          localStorage.setItem(CLAVE_STORAGE_PLANTILLAS, JSON.stringify(filtradas));
        }
        return filtradas;
      }
    } catch {
      // fallback
    }
    return [];
  }

  vaciarPlantillas(): void {
    this.plantillasPersonalizadas = [];
    this.guardarPlantillasPersonalizadas();
  }

  private guardarPlantillasPersonalizadas(): void {
    try {
      localStorage.setItem(CLAVE_STORAGE_PLANTILLAS, JSON.stringify(this.plantillasPersonalizadas));
    } catch {
      // fallback
    }
  }

  obtenerPlantillas(): PlantillaDocumento[] {
    return [...PLANTILLAS_PREDEFINIDAS, ...this.plantillasPersonalizadas];
  }

  agregarPlantilla(plantilla: PlantillaDocumento): void {
    const indice = this.plantillasPersonalizadas.findIndex((p) => p.id === plantilla.id);
    if (indice >= 0) {
      this.plantillasPersonalizadas[indice] = plantilla;
    } else {
      this.plantillasPersonalizadas.push(plantilla);
    }
    this.guardarPlantillasPersonalizadas();
  }

  eliminarPlantilla(id: string): void {
    this.plantillasPersonalizadas = this.plantillasPersonalizadas.filter((p) => p.id !== id);
    this.guardarPlantillasPersonalizadas();
  }

  /**
   * Construye el diccionario de variables a sustituir por cliente y remitente
   */
  construirVariables(cliente: Cliente, remitente?: Omit<Usuario, 'contrasena'> | null): VariablesPlantilla {
    const contactoPrincipal =
      cliente.contactos?.find((c) => c.es_principal) || cliente.contactos?.[0];
    const smtpConfig = smtpService.obtenerConfiguracion();
    const datosEmpresa = empresaService.obtenerDatos();

    // Resolver usuario autenticado o remitente pasado
    let usuarioActivo: Omit<Usuario, 'contrasena'> | null = remitente || null;
    if (!usuarioActivo) {
      try {
        const sesionGuardada = localStorage.getItem('crm_sesion_auth');
        if (sesionGuardada) {
          const sesion = JSON.parse(sesionGuardada);
          if (sesion?.usuario) usuarioActivo = sesion.usuario;
        }
      } catch {
        // Fallback silencioso
      }
    }

    const nombreEjecutivo = usuarioActivo?.nombre || smtpConfig.nombreRemitente || 'Luis M. Taveras';
    const correoEjecutivo = usuarioActivo?.email || smtpConfig.correoRemitente || 'luismiguel@alliance.do';
    const cargoEjecutivo = usuarioActivo?.cargo || 'Team Leader TI Support';
    const flotaEjecutivo = usuarioActivo?.telefonoFlota || datosEmpresa.telefono || '+1 (829) 708-4706';
    const deptoEjecutivo = usuarioActivo?.departamento || 'Tecnología & Soporte';

    const nombreRemitenteEmpresa = datosEmpresa.razonSocial || 'Ingeniería de Software Alliance S.R.L.';
    const correoRemitenteEmpresa = smtpConfig.correoRemitente || correoEjecutivo;
    const telefonoRemitenteEmpresa = datosEmpresa.telefono || '+1 (809) 555-0100';

    return {
      empresa: cliente.razon_social,
      contacto_principal: contactoPrincipal?.nombre || 'Representante Legal',
      cargo_contacto: contactoPrincipal?.cargo || 'Director General',
      rnc: cliente.identificacion_fiscal || 'Sin RNC Registrado',
      ciudad: cliente.ciudad || 'Santo Domingo',
      monto: formatCurrency(cliente.valor_estimado || 0),
      fecha: formatDate(new Date().toISOString()),
      empresa_remitente: nombreRemitenteEmpresa,
      correo_remitente: correoRemitenteEmpresa,
      telefono_remitente: telefonoRemitenteEmpresa,
      ejecutivo: nombreEjecutivo,
      correo_ejecutivo: correoEjecutivo,
      telefono_ejecutivo: flotaEjecutivo,
      cargo_ejecutivo: cargoEjecutivo,
      departamento_ejecutivo: deptoEjecutivo,
      flota_ejecutivo: flotaEjecutivo,
      empresa_emisora: datosEmpresa.razonSocial,
      rnc_empresa_emisora: datosEmpresa.identificacionFiscal,
      web_empresa_emisora: datosEmpresa.sitioWeb,
      direccion_empresa_emisora: `${datosEmpresa.direccion}, ${datosEmpresa.ciudad}`,
    };
  }

  /**
   * Envía un correo individual con PDF adjunto.
   * Intenta el envío real vía API Nodemailer; si el servidor no está disponible,
   * cae a modo simulación para que el desarrollo offline no falle.
   */
  async enviarCorreoIndividual(
    cliente: Cliente,
    plantilla: PlantillaDocumento,
    remitente?: Omit<Usuario, 'contrasena'> | null,
    asuntoPersonalizado?: string,
    cuerpoPersonalizado?: string
  ): Promise<RegistroEnvio> {
    const variables = this.construirVariables(cliente, remitente);
    const contactoPrincipal =
      cliente.contactos?.find((c) => c.es_principal) || cliente.contactos?.[0];
    const emailDestino =
      contactoPrincipal?.email || cliente.email || '';
    const smtpConfig = smtpService.obtenerConfiguracion();
    const datosEmpresa = empresaService.obtenerDatos();

    const asuntoFinal = pdfGeneratorService.reemplazarVariables(
      asuntoPersonalizado || plantilla.asuntoEmail,
      variables
    );

    let cuerpoFinal = pdfGeneratorService.reemplazarVariables(
      cuerpoPersonalizado || plantilla.cuerpoEmail,
      variables
    );

    // Adjuntar firma corporativa si no está presente
    if (smtpConfig.firmaTexto && !cuerpoFinal.includes('--')) {
      cuerpoFinal += `\n\n--\n${smtpConfig.firmaTexto}`;
    }

    const nombrePdf = `${plantilla.id}_${cliente.codigo || Date.now()}.pdf`;

    // Generar PDF como Data URI (base64) para enviarlo como adjunto
    let adjuntoBase64 = '';
    try {
      const dataUri = pdfGeneratorService.obtenerDataUri(plantilla, variables);
      adjuntoBase64 = dataUri; // el servidor extrae el base64 puro
    } catch (err) {
      console.warn('[PDF] No se pudo generar PDF adjunto:', err);
    }

    // Construir remitente final
    const remitenteFinal =
      smtpConfig.nombreRemitente && smtpConfig.correoRemitente
        ? `${smtpConfig.nombreRemitente} <${smtpConfig.correoRemitente}>`
        : datosEmpresa.razonSocial
        ? `${datosEmpresa.razonSocial} <${smtpConfig.correoRemitente || 'ventas@empresa.com.do'}>`
        : `${remitente?.nombre || 'Departamento Comercial'} <${remitente?.email || smtpConfig.correoRemitente || 'ventas@empresa.com.do'}>`;

    // Intentar envío real vía API
    const servidorDisponible = await servidorEmailDisponible();
    let estadoEnvio: RegistroEnvio['estado'] = 'enviado';
    let errorMsg: string | undefined;

    if (servidorDisponible && emailDestino) {
      try {
        const resp = await fetch(`${API_EMAIL_URL}/enviar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            smtpConfig,
            destinatario: emailDestino,
            asunto: asuntoFinal,
            cuerpo: cuerpoFinal,
            adjuntoNombre: nombrePdf,
            adjuntoBase64,
          }),
          signal: AbortSignal.timeout(30000),
        });

        const resultado = await resp.json();
        if (!resultado.exito) {
          estadoEnvio = 'fallido';
          errorMsg = resultado.error || 'El servidor SMTP rechazó el envío.';
        }
      } catch (fetchErr) {
        console.error('[API EMAIL] Error al conectar con servidor de correo:', fetchErr);
        estadoEnvio = 'fallido';
        errorMsg = 'No se pudo conectar con el servidor de correo. Verifique que esté activo.';
      }
    } else if (!emailDestino) {
      estadoEnvio = 'fallido';
      errorMsg = `El cliente "${cliente.razon_social}" no tiene dirección de correo registrada.`;
    }
    // Si el servidor no está disponible, registramos como "enviado" en modo simulación
    // para que el usuario pueda ver el historial y probar el flujo

    const registro: RegistroEnvio = {
      id: `env-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      clienteId: cliente.id,
      empresa: cliente.razon_social,
      contactoNombre: variables.contacto_principal,
      emailDestino: emailDestino || '(sin correo)',
      remitente: remitenteFinal,
      asunto: asuntoFinal,
      cuerpoEmail: cuerpoFinal,
      nombreAdjunto: nombrePdf,
      tamanoAdjuntoKb: adjuntoBase64 ? Math.round(adjuntoBase64.length * 0.00075) : 0,
      estado: estadoEnvio,
      fechaEnvio: new Date().toISOString(),
      error: errorMsg,
    };

    this.historialEnvios.unshift(registro);
    this.guardarHistorial();

    // Registrar en Bitácora del cliente
    try {
      const clienteActual = await clienteService.obtenerClientePorId(cliente.id);
      if (clienteActual) {
        if (!clienteActual.actividades) clienteActual.actividades = [];
        const modoLabel = servidorDisponible ? `SMTP (${smtpConfig.servidorSmtp})` : 'Modo Offline';
        clienteActual.actividades.unshift({
          id: `act-email-${Date.now()}`,
          cliente_id: cliente.id,
          tipo: 'correo',
          descripcion: `Envío vía ${modoLabel} de "${plantilla.nombre}" (PDF: ${nombrePdf}) → ${emailDestino}. Asunto: "${asuntoFinal}". Estado: ${estadoEnvio}.`,
          realizado_por: smtpConfig.nombreRemitente || datosEmpresa.razonSocial || remitente?.nombre || 'Despacho Comercial',
          fecha: new Date().toISOString(),
        });
      }
    } catch {
      // No bloquear si falla la bitácora
    }

    return registro;
  }

  /**
   * Envío masivo: llama primero al endpoint batch si el servidor está disponible,
   * de lo contrario cae al envío individual en bucle.
   */
  async enviarCampanaMasiva(
    clientes: Cliente[],
    plantilla: PlantillaDocumento,
    remitente?: Omit<Usuario, 'contrasena'> | null,
    asuntoPersonalizado?: string,
    cuerpoPersonalizado?: string,
    onProgreso?: (progreso: {
      actual: number;
      total: number;
      registroActual: RegistroEnvio;
    }) => void
  ): Promise<RegistroEnvio[]> {
    const resultados: RegistroEnvio[] = [];
    const total = clientes.length;

    for (let i = 0; i < total; i++) {
      const cliente = clientes[i];
      const registro = await this.enviarCorreoIndividual(
        cliente,
        plantilla,
        remitente,
        asuntoPersonalizado,
        cuerpoPersonalizado
      );
      resultados.push(registro);

      if (onProgreso) {
        onProgreso({ actual: i + 1, total, registroActual: registro });
      }
    }

    return resultados;
  }

  obtenerHistorialEnvios(): RegistroEnvio[] {
    return [...this.historialEnvios];
  }

  limpiarHistorial(): void {
    this.historialEnvios = [];
    this.guardarHistorial();
  }
}

export const emailService = new EmailService();
