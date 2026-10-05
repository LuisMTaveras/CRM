export interface DatosEmpresa {
  razonSocial: string;
  nombreComercial: string;
  identificacionFiscal: string; // RNC Dominicano o CIF
  sloganActividad: string;
  correo: string;
  telefono: string;
  whatsapp?: string;
  sitioWeb: string;
  direccion: string;
  ciudad: string;
  pais: string;
  monedaPrincipal: 'DOP' | 'USD' | 'EUR';
  simboloMoneda: string;
  prefijoDocumentos: string;
  piePaginaOficial: string;
  ultimaActualizacion?: string;
}
