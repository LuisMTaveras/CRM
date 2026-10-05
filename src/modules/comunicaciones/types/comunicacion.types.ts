export type CategoriaPlantilla = 'comercial' | 'propuesta' | 'legal' | 'cobranza';

export interface PlantillaDocumento {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaPlantilla;
  asuntoEmail: string;
  cuerpoEmail: string;
  tituloDocumento: string;
  contenidoDocumento: string;
}

export interface VariablesPlantilla {
  empresa: string;
  contacto_principal: string;
  cargo_contacto: string;
  rnc: string;
  ciudad: string;
  monto: string;
  fecha: string;
  empresa_remitente?: string;
  correo_remitente?: string;
  telefono_remitente?: string;
  ejecutivo?: string;
  correo_ejecutivo?: string;
  telefono_ejecutivo?: string;
  empresa_emisora?: string;
  rnc_empresa_emisora?: string;
  web_empresa_emisora?: string;
  direccion_empresa_emisora?: string;
}

export interface DestinatarioEnvio {
  clienteId: string;
  codigoCliente: string;
  empresa: string;
  contactoPrincipal: string;
  cargoContacto: string;
  email: string;
  rnc: string;
  ciudad: string;
  valorEstimado: number;
}

export interface RegistroEnvio {
  id: string;
  clienteId: string;
  empresa: string;
  contactoNombre: string;
  emailDestino: string;
  remitente: string;
  asunto: string;
  cuerpoEmail?: string;
  nombreAdjunto: string;
  tamanoAdjuntoKb: number;
  estado: 'pendiente' | 'enviando' | 'enviado' | 'fallido';
  fechaEnvio?: string;
  error?: string;
}
