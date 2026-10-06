import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Lista completa de 8 usuarios del CRM
const USUARIOS = [
  {
    id: 'usr-1',
    uuid: '11111111-1111-4111-8111-111111111111',
    nombre: 'Camila Morales',
    email: 'camila@crm.do',
    contrasena: 'admin123',
    rol: 'admin',
    rolNombre: 'Directora Comercial & Admin',
    cargo: 'Head of Sales & CRM Admin',
    avatar: 'CM',
    telefono: '+1 (809) 555-0101',
    activo: true,
    ultimoAcceso: '2026-10-05T15:30:00Z',
  },
  {
    id: 'usr-2',
    uuid: '22222222-2222-4222-8222-222222222222',
    nombre: 'Ignacio Silva',
    email: 'ignacio@crm.do',
    contrasena: 'ventas123',
    rol: 'ejecutivo',
    rolNombre: 'Ejecutivo Comercial Senior',
    cargo: 'Account Executive B2B',
    avatar: 'IS',
    telefono: '+1 (809) 555-0102',
    activo: true,
    ultimoAcceso: '2026-10-05T14:15:00Z',
  },
  {
    id: 'usr-3',
    uuid: '33333333-3333-4333-8333-333333333333',
    nombre: 'Felipe Guzmán',
    email: 'felipe@crm.do',
    contrasena: 'gerente123',
    rol: 'gerente',
    rolNombre: 'Gerente de Cuentas Estratégicas',
    cargo: 'Key Account Manager',
    avatar: 'FG',
    telefono: '+1 (809) 555-0103',
    activo: true,
    ultimoAcceso: '2026-10-05T16:00:00Z',
  },
  {
    id: 'usr-4',
    uuid: '44444444-4444-4444-8444-444444444444',
    nombre: 'Laura Peña',
    email: 'laura@crm.do',
    contrasena: 'auditor123',
    rol: 'auditor',
    rolNombre: 'Auditora & Analista de Riesgo',
    cargo: 'Business Intelligence Analyst',
    avatar: 'LP',
    telefono: '+1 (809) 555-0104',
    activo: true,
    ultimoAcceso: '2026-10-05T09:45:00Z',
  },
  {
    id: 'usr-5',
    uuid: '55555555-5555-4555-8555-555555555555',
    nombre: 'Roberto Méndez',
    email: 'roberto@crm.do',
    contrasena: 'ventas123',
    rol: 'ejecutivo',
    rolNombre: 'Ejecutivo Comercial Corporativo',
    cargo: 'Corporate Account Executive',
    avatar: 'RM',
    telefono: '+1 (809) 555-0105',
    activo: true,
    ultimoAcceso: '2026-10-05T11:20:00Z',
  },
  {
    id: 'usr-6',
    uuid: '66666666-6666-4666-8666-666666666666',
    nombre: 'Valentina Castillo',
    email: 'valentina@crm.do',
    contrasena: 'ventas123',
    rol: 'ejecutivo',
    rolNombre: 'Ejecutiva de Desarrollo de Negocios',
    cargo: 'Business Development Specialist',
    avatar: 'VC',
    telefono: '+1 (809) 555-0106',
    activo: true,
    ultimoAcceso: '2026-10-05T13:40:00Z',
  },
  {
    id: 'usr-7',
    uuid: '77777777-7777-4777-8777-777777777777',
    nombre: 'Marcos Almonte',
    email: 'marcos@crm.do',
    contrasena: 'gerente123',
    rol: 'gerente',
    rolNombre: 'Gerente Regional de Ventas',
    cargo: 'Regional Sales Manager',
    avatar: 'MA',
    telefono: '+1 (809) 555-0107',
    activo: true,
    ultimoAcceso: '2026-10-04T17:10:00Z',
  },
  {
    id: 'usr-8',
    uuid: '88888888-8888-4888-8888-888888888888',
    nombre: 'Daniela Rosario',
    email: 'daniela@crm.do',
    contrasena: 'ventas123',
    rol: 'ejecutivo',
    rolNombre: 'Especialista en Soluciones B2B',
    cargo: 'B2B Solutions Representative',
    avatar: 'DR',
    telefono: '+1 (809) 555-0108',
    activo: true,
    ultimoAcceso: '2026-10-05T12:05:00Z',
  },
];

// 105 Empresas B2B de prestigio en República Dominicana y la región
const EMPRESAS_BASE = [
  // Tecnología (12)
  { razon: 'Soluciones Tecnológicas IQtek S.A.S.', nombre: 'IQtek Solutions', sector: 'Tecnología', ciudad: 'Santo Domingo', dominio: 'iqtek.com.do' },
  { razon: 'Softland Dominicana S.R.L.', nombre: 'Softland RD', sector: 'Tecnología', ciudad: 'Santo Domingo', dominio: 'softland.do' },
  { razon: 'DataVim Dominicana S.A.', nombre: 'DataVim Analytics', sector: 'Tecnología', ciudad: 'Santiago', dominio: 'datavim.com.do' },
  { razon: 'OneLink BPO Dominican Republic S.A.', nombre: 'OneLink Dominicana', sector: 'Tecnología', ciudad: 'Santo Domingo', dominio: 'onelinkbpo.do' },
  { razon: 'Teleperformance RD S.R.L.', nombre: 'Teleperformance Caribe', sector: 'Tecnología', ciudad: 'Santo Domingo', dominio: 'teleperformance.do' },
  { razon: 'Cloud Caribe Solutions S.R.L.', nombre: 'CloudCaribe RD', sector: 'Tecnología', ciudad: 'Santo Domingo', dominio: 'cloudcaribe.com.do' },
  { razon: 'CyberSec Antillana S.A.S.', nombre: 'CyberSec Antillas', sector: 'Tecnología', ciudad: 'Santiago', dominio: 'cybersecantillana.do' },
  { razon: 'OmniComm Dominicana S.R.L.', nombre: 'OmniComm Systems', sector: 'Tecnología', ciudad: 'Santo Domingo', dominio: 'omnicomm.com.do' },
  { razon: 'NexSys del Caribe S.R.L.', nombre: 'NexSys RD', sector: 'Tecnología', ciudad: 'Santo Domingo', dominio: 'nexsyscaribe.do' },
  { razon: 'Soporte e Infraestructura ITEX S.A.', nombre: 'ITEX Infraestructuras', sector: 'Tecnología', ciudad: 'La Romana', dominio: 'itex.com.do' },
  { razon: 'FinTech Caribe Innovaciones S.A.S.', nombre: 'FinTech Caribe', sector: 'Tecnología', ciudad: 'Santo Domingo', dominio: 'fintechcaribe.do' },
  { razon: 'SmartData Dominicana S.R.L.', nombre: 'SmartData RD', sector: 'Tecnología', ciudad: 'Santiago', dominio: 'smartdata.do' },

  // Finanzas (14)
  { razon: 'Banco Múltiple BHD S.A.', nombre: 'Banco BHD', sector: 'Finanzas', ciudad: 'Santo Domingo', dominio: 'bhd.com.do' },
  { razon: 'Banco Santa Cruz S.A.', nombre: 'Banco Santa Cruz', sector: 'Finanzas', ciudad: 'Santiago', dominio: 'bancosantacruz.com.do' },
  { razon: 'Asociación Popular de Ahorros y Préstamos', nombre: 'APAP', sector: 'Finanzas', ciudad: 'Santo Domingo', dominio: 'apap.com.do' },
  { razon: 'Seguros Universal S.A.', nombre: 'Seguros Universal', sector: 'Finanzas', ciudad: 'Santo Domingo', dominio: 'universal.com.do' },
  { razon: 'Humano Seguros S.A.', nombre: 'Humano Seguros', sector: 'Finanzas', ciudad: 'Santo Domingo', dominio: 'humano.com.do' },
  { razon: 'Banco Múltiple BDI S.A.', nombre: 'Banco BDI', sector: 'Finanzas', ciudad: 'Santo Domingo', dominio: 'bdi.com.do' },
  { razon: 'Asociación Cibao de Ahorros y Préstamos', nombre: 'ACAP', sector: 'Finanzas', ciudad: 'Santiago', dominio: 'acap.com.do' },
  { razon: 'Seguros Reservas S.A.', nombre: 'Seguros Reservas', sector: 'Finanzas', ciudad: 'Santo Domingo', dominio: 'segurosreservas.com' },
  { razon: 'Banco Promerica República Dominicana', nombre: 'Banco Promerica', sector: 'Finanzas', ciudad: 'Santo Domingo', dominio: 'promerica.com.do' },
  { razon: 'Banco Ademi S.A.', nombre: 'Banco Ademi', sector: 'Finanzas', ciudad: 'Santo Domingo', dominio: 'bancoademi.com.do' },
  { razon: 'Puesto de Bolsa United Capital S.A.', nombre: 'United Capital', sector: 'Finanzas', ciudad: 'Santo Domingo', dominio: 'unitedcapital.com.do' },
  { razon: 'Inversiones & Reservas Puesto de Bolsa', nombre: 'Inversiones Reservas', sector: 'Finanzas', ciudad: 'Santo Domingo', dominio: 'reservasbolsa.com.do' },
  { razon: 'Asociación La Nacional de Ahorros y Préstamos', nombre: 'La Nacional', sector: 'Finanzas', ciudad: 'Santo Domingo', dominio: 'alnap.com.do' },
  { razon: 'Fiduciaria BHD S.A.', nombre: 'Fiduciaria BHD', sector: 'Finanzas', ciudad: 'Santo Domingo', dominio: 'fiduciariabhd.com.do' },

  // Logística (13)
  { razon: 'DP World Caucedo S.A.', nombre: 'DP World Caucedo', sector: 'Logística', ciudad: 'Boca Chica', dominio: 'dpworldcaucedo.com.do' },
  { razon: 'Marítima Dominicana S.A.S.', nombre: 'MarDom Logística', sector: 'Logística', ciudad: 'Santo Domingo', dominio: 'mardom.com.do' },
  { razon: 'HIT Puerto Río Haina S.A.', nombre: 'Puerto Río Haina', sector: 'Logística', ciudad: 'Haina', dominio: 'puertorhi.com.do' },
  { razon: 'Caribex Dominicana Logística S.R.L.', nombre: 'Caribex Cargo', sector: 'Logística', ciudad: 'Santiago', dominio: 'caribex.com.do' },
  { razon: 'Aeropuertos Dominicanos Siglo XXI S.A.', nombre: 'AERODOM', sector: 'Logística', ciudad: 'Santo Domingo', dominio: 'aerodom.com.do' },
  { razon: 'Frederic Schad S.A.S.', nombre: 'Schad Logística', sector: 'Logística', ciudad: 'Santo Domingo', dominio: 'schadlogistica.com.do' },
  { razon: 'Antillean Marine Dominican Republic S.A.', nombre: 'Antillean Marine RD', sector: 'Logística', ciudad: 'Santo Domingo', dominio: 'antillean.do' },
  { razon: 'Trans-Caribe Express S.R.L.', nombre: 'Trans-Caribe', sector: 'Logística', ciudad: 'San Cristóbal', dominio: 'transcaribe.com.do' },
  { razon: 'Logística y Aduanas del Cibao S.A.', nombre: 'LogiCibao', sector: 'Logística', ciudad: 'Santiago', dominio: 'logicibao.com.do' },
  { razon: 'Hub Logístico Caucedo S.A.S.', nombre: 'Caucedo Logistics Hub', sector: 'Logística', ciudad: 'Boca Chica', dominio: 'caucedohub.com.do' },
  { razon: 'AeroCargas del Caribe S.R.L.', nombre: 'AeroCargas RD', sector: 'Logística', ciudad: 'Santo Domingo', dominio: 'aerocargas.com.do' },
  { razon: 'Flotas & Envíos Nacionales S.A.', nombre: 'Envíos Nacionales', sector: 'Logística', ciudad: 'La Vega', dominio: 'enviosnacionales.do' },
  { razon: 'Almacenes Fiscales Dominicanos S.A.', nombre: 'Almacenes Fiscales RD', sector: 'Logística', ciudad: 'Santo Domingo', dominio: 'almacenesfiscales.do' },

  // Turismo & Hotelería (12)
  { razon: 'Grupo Puntacana S.A.', nombre: 'Puntacana Resort & Club', sector: 'Turismo', ciudad: 'Punta Cana', dominio: 'puntacana.com.do' },
  { razon: 'Meliá Hotels International Caribe S.A.', nombre: 'Meliá Caribe Resorts', sector: 'Turismo', ciudad: 'Punta Cana', dominio: 'melia.com.do' },
  { razon: 'Viva Wyndham Resorts S.A.', nombre: 'Viva Wyndham Resorts', sector: 'Turismo', ciudad: 'La Romana', dominio: 'vivaresorts.com.do' },
  { razon: 'Central Romana Corporation Ltd. - División Hoteles', nombre: 'Casa de Campo Resort', sector: 'Turismo', ciudad: 'La Romana', dominio: 'casadecampo.com.do' },
  { razon: 'Iberostar Hoteles Dominicana S.A.', nombre: 'Iberostar Resorts RD', sector: 'Turismo', ciudad: 'Bávaro', dominio: 'iberostar.com.do' },
  { razon: 'Barceló Bávaro Grand Resort S.A.', nombre: 'Barceló Bávaro', sector: 'Turismo', ciudad: 'Punta Cana', dominio: 'barcelo.com.do' },
  { razon: 'Hard Rock Hotel & Casino Punta Cana S.A.', nombre: 'Hard Rock Punta Cana', sector: 'Turismo', ciudad: 'Punta Cana', dominio: 'hardrockhotelpuntacana.do' },
  { razon: 'Catalonia Hotels Caribe S.R.L.', nombre: 'Catalonia Resorts RD', sector: 'Turismo', ciudad: 'Santo Domingo', dominio: 'cataloniahotels.do' },
  { razon: 'Playa Grande Golf & Ocean Club S.A.', nombre: 'Playa Grande Club', sector: 'Turismo', ciudad: 'Río San Juan', dominio: 'playagrande.com.do' },
  { razon: 'Hodelpa Hotels & Resorts S.A.', nombre: 'Cadena Hodelpa', sector: 'Turismo', ciudad: 'Santiago', dominio: 'hodelpa.com.do' },
  { razon: 'Bahia Principe Hotels Dominican Republic', nombre: 'Bahia Principe RD', sector: 'Turismo', ciudad: 'Samaná', dominio: 'bahia-principe.do' },
  { razon: 'Eden Roc Cap Cana S.A.S.', nombre: 'Eden Roc Cap Cana', sector: 'Turismo', ciudad: 'Cap Cana', dominio: 'edenroccapcana.com.do' },

  // Salud (12)
  { razon: 'Hospital Metropolitano de Santiago (HOMS) S.A.', nombre: 'HOMS Santiago', sector: 'Salud', ciudad: 'Santiago', dominio: 'homs.com.do' },
  { razon: 'Centro Médico Real S.A.', nombre: 'Centro Médico Real', sector: 'Salud', ciudad: 'Santo Domingo', dominio: 'medicoreal.com.do' },
  { razon: 'Hospiten Santo Domingo S.A.', nombre: 'Hospiten RD', sector: 'Salud', ciudad: 'Santo Domingo', dominio: 'hospiten.com.do' },
  { razon: 'Laboratorios Feltrex S.A.', nombre: 'Laboratorios Feltrex', sector: 'Salud', ciudad: 'Santo Domingo', dominio: 'feltrex.com.do' },
  { razon: 'Laboratorios de Aplicaciones Médicas (LAM) S.A.', nombre: 'Laboratorios LAM', sector: 'Salud', ciudad: 'Santo Domingo', dominio: 'lam.com.do' },
  { razon: 'Referencia Laboratorio Clínico S.A.', nombre: 'Referencia Laboratorio', sector: 'Salud', ciudad: 'Santo Domingo', dominio: 'labreferencia.com.do' },
  { razon: 'Amadita Laboratorio Clínico S.A.S.', nombre: 'Amadita Laboratorio', sector: 'Salud', ciudad: 'Santo Domingo', dominio: 'amadita.com.do' },
  { razon: 'Clínica Abreu S.A. (Grupo CDD Global)', nombre: 'Clínica Abreu', sector: 'Salud', ciudad: 'Santo Domingo', dominio: 'clinicaabreu.com.do' },
  { razon: 'Centro de Diagnóstico y Telemedicina (CEDIMAT)', nombre: 'CEDIMAT', sector: 'Salud', ciudad: 'Santo Domingo', dominio: 'cedimat.com.do' },
  { razon: 'Farmacias Carol S.A.S. - División Institucional', nombre: 'Farmacias Carol B2B', sector: 'Salud', ciudad: 'Santo Domingo', dominio: 'farmaciascarol.com.do' },
  { razon: 'Unión Médica del Norte S.A.', nombre: 'Unión Médica Santiago', sector: 'Salud', ciudad: 'Santiago', dominio: 'unionmedica.com.do' },
  { razon: 'Farmacéutica Dominicana S.A. (FARMEDOM)', nombre: 'FARMEDOM', sector: 'Salud', ciudad: 'San Cristóbal', dominio: 'farmedom.com.do' },

  // Retail (12)
  { razon: 'Grupo Ramos S.A. (La Sirena & Pola)', nombre: 'Grupo Ramos Corporativo', sector: 'Retail', ciudad: 'Santo Domingo', dominio: 'gruporamos.com.do' },
  { razon: 'Centro Cuesta Nacional (CCN) S.A.S.', nombre: 'CCN Corporativo', sector: 'Retail', ciudad: 'Santo Domingo', dominio: 'ccn.net.do' },
  { razon: 'Plaza Lama S.A. - División Mayorista', nombre: 'Plaza Lama Mayorista', sector: 'Retail', ciudad: 'Santo Domingo', dominio: 'plazalama.com.do' },
  { razon: 'PriceSmart Dominicana S.R.L. - B2B', nombre: 'PriceSmart Negocios', sector: 'Retail', ciudad: 'Santo Domingo', dominio: 'pricesmart.com.do' },
  { razon: 'Almacenes Unidos S.A.S.', nombre: 'Unidos Corporativo', sector: 'Retail', ciudad: 'Santo Domingo', dominio: 'unidos.com.do' },
  { razon: 'Hipermercados Olé S.A.', nombre: 'Hipermercados Olé', sector: 'Retail', ciudad: 'Santo Domingo', dominio: 'hipermercadosole.com.do' },
  { razon: 'Distribuidora Corripio S.A.S.', nombre: 'Corripio Comercial', sector: 'Retail', ciudad: 'Santo Domingo', dominio: 'corripio.com.do' },
  { razon: 'Casa Cuesta Home & Contract S.A.', nombre: 'Casa Cuesta Proyectos', sector: 'Retail', ciudad: 'Santo Domingo', dominio: 'casacuesta.com.do' },
  { razon: 'IKEA Dominicana S.A. - División Business', nombre: 'IKEA Business RD', sector: 'Retail', ciudad: 'Santo Domingo', dominio: 'ikea.com.do' },
  { razon: 'Supermercados Bravo S.A.', nombre: 'Bravo Institucional', sector: 'Retail', ciudad: 'Santo Domingo', dominio: 'superbravo.com.do' },
  { razon: 'Tiendas La Sirena Santiago S.A.', nombre: 'Sirena Santiago', sector: 'Retail', ciudad: 'Santiago', dominio: 'sirena.com.do' },
  { razon: 'Ferretería Americana S.A.S. - B2B', nombre: 'Americana B2B', sector: 'Retail', ciudad: 'Santo Domingo', dominio: 'americana.com.do' },

  // Manufactura (14)
  { razon: 'Cervecería Nacional Dominicana S.A.', nombre: 'CND Corporativo', sector: 'Manufactura', ciudad: 'Santo Domingo', dominio: 'cnd.com.do' },
  { razon: 'Plastifar S.A.', nombre: 'Plastifar Industrial', sector: 'Manufactura', ciudad: 'Santo Domingo', dominio: 'plastifar.com.do' },
  { razon: 'Cementos Cibao S.A.', nombre: 'Cementos Cibao', sector: 'Manufactura', ciudad: 'Santiago', dominio: 'cementoscibao.com.do' },
  { razon: 'Domicem S.A.', nombre: 'Cemento Domicem', sector: 'Manufactura', ciudad: 'San Cristóbal', dominio: 'domicem.com.do' },
  { razon: 'Acero Estrella S.A.S.', nombre: 'Acero Estrella', sector: 'Manufactura', ciudad: 'Santiago', dominio: 'aceroestrella.com.do' },
  { razon: 'Pinturas Tropical Dominicana S.A.', nombre: 'Pinturas Tropical', sector: 'Manufactura', ciudad: 'Santo Domingo', dominio: 'pinturastropical.do' },
  { razon: 'Pinturas Popular S.A.', nombre: 'Pinturas Popular', sector: 'Manufactura', ciudad: 'Santo Domingo', dominio: 'pinturaspopular.do' },
  { razon: 'Eaton Dominicana S.R.L. - Zona Franca', nombre: 'Eaton Dominicana', sector: 'Manufactura', ciudad: 'San Cristóbal', dominio: 'eaton.com.do' },
  { razon: 'Medtronic Dominican Republic S.R.L.', nombre: 'Medtronic RD', sector: 'Manufactura', ciudad: 'San Cristóbal', dominio: 'medtronic.com.do' },
  { razon: 'Baxter Healthcare Caribe S.A.', nombre: 'Baxter San Cristóbal', sector: 'Manufactura', ciudad: 'San Cristóbal', dominio: 'baxter.com.do' },
  { razon: 'Edwards Lifesciences Dominican Republic S.A.', nombre: 'Edwards Lifesciences RD', sector: 'Manufactura', ciudad: 'Haina', dominio: 'edwards.com.do' },
  { razon: 'Smurfit Kappa Dominicana S.A.S.', nombre: 'Smurfit Kappa RD', sector: 'Manufactura', ciudad: 'Santo Domingo', dominio: 'smurfitkappa.com.do' },
  { razon: 'Envases Antillanos S.R.L.', nombre: 'Envases Antillanos', sector: 'Manufactura', ciudad: 'Santiago', dominio: 'envasesantillanos.do' },
  { razon: 'Termopac Industrial S.A.S.', nombre: 'Termopac', sector: 'Manufactura', ciudad: 'Santo Domingo', dominio: 'termopac.com.do' },

  // Alimentos (14)
  { razon: 'Pasteurizadora Rica S.A.', nombre: 'Grupo Rica', sector: 'Alimentos', ciudad: 'Santo Domingo', dominio: 'gruporica.com' },
  { razon: 'MercaSID S.A. (Grupo SID)', nombre: 'MercaSID B2B', sector: 'Alimentos', ciudad: 'Santo Domingo', dominio: 'mercasid.com.do' },
  { razon: 'Induveca S.A. (Grupo SID)', nombre: 'Induveca Cárnicos', sector: 'Alimentos', ciudad: 'La Vega', dominio: 'induveca.com.do' },
  { razon: 'Industrias Banilejas S.A.S. (INDUBAN)', nombre: 'Café Santo Domingo / Induban', sector: 'Alimentos', ciudad: 'Santo Domingo', dominio: 'induban.com.do' },
  { razon: 'Molinos del Ozama S.A.', nombre: 'Molinos del Ozama', sector: 'Alimentos', ciudad: 'Santo Domingo', dominio: 'molinosozama.com.do' },
  { razon: 'Casa Brugal S.A.', nombre: 'Brugal Corporativo', sector: 'Alimentos', ciudad: 'Puerto Plata', dominio: 'brugal.com.do' },
  { razon: 'Barceló Export Import S.A.S. (BEICA)', nombre: 'Ron Barceló', sector: 'Alimentos', ciudad: 'San Pedro de Macorís', dominio: 'ronbarcelo.com.do' },
  { razon: 'Font Gamundi & Cía. S.A.S.', nombre: 'Arroz La Garza / Font Gamundi', sector: 'Alimentos', ciudad: 'La Vega', dominio: 'fontgamundi.com.do' },
  { razon: 'J. Armando Bermúdez & Co. S.A.', nombre: 'Ron Bermúdez', sector: 'Alimentos', ciudad: 'Santiago', dominio: 'ronbermudez.com.do' },
  { razon: 'Cervecería Vegana S.A.', nombre: 'Cervecería Vegana', sector: 'Alimentos', ciudad: 'La Vega', dominio: 'cerveceriavegana.do' },
  { razon: 'Rizek Cacao S.A.S.', nombre: 'Chocolates Rizek', sector: 'Alimentos', ciudad: 'San Francisco de Macorís', dominio: 'rizekcacao.com.do' },
  { razon: 'Helados Bon S.A.S. - B2B Institucional', nombre: 'Helados Bon Institucional', sector: 'Alimentos', ciudad: 'Santo Domingo', dominio: 'heladosbon.com.do' },
  { razon: 'Panificadora Pepín S.A.S.', nombre: 'Pan Pepín Corporativo', sector: 'Alimentos', ciudad: 'Santo Domingo', dominio: 'panpepin.com.do' },
  { razon: 'Cárnicos del Norte S.R.L. (Checo)', nombre: 'Embutidos Checo', sector: 'Alimentos', ciudad: 'Santiago', dominio: 'embutidoscheco.do' },

  // Comercio Mayorista (14)
  { razon: 'Ferretería Bellón S.A.S.', nombre: 'Bellón Mayorista', sector: 'Comercio', ciudad: 'Santiago', dominio: 'bellon.com.do' },
  { razon: 'Ferretería Ochoa S.A.S.', nombre: 'Ochoa B2B', sector: 'Comercio', ciudad: 'Santiago', dominio: 'ochoa.com.do' },
  { razon: 'Santo Domingo Motors Company S.A.', nombre: 'Santo Domingo Motors Flotas', sector: 'Comercio', ciudad: 'Santo Domingo', dominio: 'sdm.com.do' },
  { razon: 'Grupo Viamar S.A. - División Flotillas', nombre: 'Grupo Viamar Flotas', sector: 'Comercio', ciudad: 'Santo Domingo', dominio: 'viamar.com.do' },
  { razon: 'Delta Comercial S.A.S. (Toyota RD)', nombre: 'Delta Comercial Corporativo', sector: 'Comercio', ciudad: 'Santo Domingo', dominio: 'deltacomercial.com.do' },
  { razon: 'Magna Motors S.A. (Hyundai B2B)', nombre: 'Magna Motors Flotillas', sector: 'Comercio', ciudad: 'Santo Domingo', dominio: 'magnamotors.com.do' },
  { razon: 'Autozama S.A.S. (Mercedes-Benz Flotas)', nombre: 'Autozama Corporativo', sector: 'Comercio', ciudad: 'Santo Domingo', dominio: 'autozama.com.do' },
  { razon: 'Reid & Pellerano S.A.S.', nombre: 'Reid Comercial Flotas', sector: 'Comercio', ciudad: 'Santo Domingo', dominio: 'reid.com.do' },
  { razon: 'Distribuidora Haché S.A.S.', nombre: 'Haché Comercial', sector: 'Comercio', ciudad: 'Santo Domingo', dominio: 'hache.com.do' },
  { razon: 'Equipos Pesados Antillanos S.A. (EPANSA)', nombre: 'EPANSA Maquinarias', sector: 'Comercio', ciudad: 'Santo Domingo', dominio: 'epansa.com.do' },
  { razon: 'Surtidora Médica del Caribe S.R.L.', nombre: 'Surtidora Médica B2B', sector: 'Comercio', ciudad: 'Santo Domingo', dominio: 'surmedicacaribe.do' },
  { razon: 'Suplidora Industrial Dominicana S.A. (SUINDSA)', nombre: 'SUINDSA Suministros', sector: 'Comercio', ciudad: 'Haina', dominio: 'suindsa.com.do' },
  { razon: 'Agrocomercial del Cibao S.R.L.', nombre: 'AgroCibao Insumos', sector: 'Comercio', ciudad: 'La Vega', dominio: 'agrocibao.com.do' },
  { razon: 'Papelera del Caribe S.A.S. - B2B', nombre: 'Papelera Caribe Corporativo', sector: 'Comercio', ciudad: 'Santo Domingo', dominio: 'papeleracaribe.do' },
];

// Nombres y Apellidos dominicanos / latinos para contactos y ejecutivos
const NOMBRES_MASCULINOS = [
  'Carlos', 'Manuel', 'Alejandro', 'Héctor', 'Guillermo', 'Rafael', 'José Luis',
  'Eduardo', 'Gabriel', 'Fernando', 'Ricardo', 'Andrés', 'Víctor', 'César',
  'Miguel Ángel', 'Javier', 'Ramón', 'Alberto', 'Pedro', 'Rubén', 'Mario'
];

const NOMBRES_FEMENINOS = [
  'Mariela', 'Claudia', 'Patricia', 'Andrea', 'Sofía', 'Beatriz', 'Carmen',
  'Elena', 'Lucía', 'Gabriela', 'Raquel', 'Verónica', 'Rosa María', 'Paola',
  'Natalia', 'Valeria', 'Silvia', 'Carolina', 'Daniela', 'Teresa', 'Marisol'
];

const APELLIDOS = [
  'Fernández', 'Santana', 'García', 'Pérez', 'Rodríguez', 'Hernández', 'Martínez',
  'Castillo', 'Báez', 'Mejía', 'Guzmán', 'Taveras', 'Valdez', 'Almonte', 'Reyes',
  'De la Cruz', 'Peña', 'Mendoza', 'Sánchez', 'Vargas', 'Jiménez', 'Cabrera',
  'Morales', 'Rosario', 'Estrella', 'Pichardo', 'Bisonó', 'Corominas', 'Troncoso'
];

const CARGOS_PRINCIPALES = [
  'Director General de Operaciones',
  'Vicepresidente de Finanzas & Tesorería',
  'Director de Tecnología & Transformación Digital',
  'Gerente General de Compras & Cadena de Suministro',
  'Vicepresidente Ejecutivo de Administración',
  'Director de Recursos Humanos & Talento',
  'Gerente de Infraestructura & Operaciones TI',
  'Director Comercial y Alianzas Corporativas'
];

const CARGOS_SECUNDARIOS = [
  'Gerente de Cuentas por Pagar & Contabilidad',
  'Jefe de Compras B2B y Licitaciones',
  'Líder de Proyectos de TI e Innovación',
  'Coordinador de Logística y Despacho',
  'Especialista Senior de Compras Estratégicas',
  'Analista Financiero Principal',
  'Asesor Legal Corporativo',
  'Gerente de Seguridad Industrial y Calidad'
];

// Estados y prioridades
const ESTADOS = ['activo', 'en_negociacion', 'prospecto', 'inactivo', 'cerrado_perdido'];
const PRIORIDADES = ['alta', 'media', 'baja'];

function getRandomItem(arr, idx) {
  return arr[idx % arr.length];
}

function generarTelefonoRD(idx, sub = 0) {
  const prefijos = ['809', '829', '849'];
  const prefijo = prefijos[(idx + sub) % prefijos.length];
  const central = String(200 + ((idx * 7 + sub * 13) % 700)).padStart(3, '0');
  const linea = String(1000 + ((idx * 43 + sub * 31) % 8999)).padStart(4, '0');
  return `+1 (${prefijo}) ${central}-${linea}`;
}

function generarRNC(idx) {
  const pref = (idx % 2 === 0) ? '1-01' : '1-31';
  const cuerpo = String(10000 + ((idx * 617) % 89999)).padStart(5, '0');
  const digito = ((idx * 3 + 7) % 9) + 1;
  return `${pref}-${cuerpo}-${digito}`;
}

function generarMonto(idx) {
  // Valores en DOP entre 1,500,000 y 45,000,000
  const base = 1500000 + ((idx * 415000) % 43500000);
  return Math.round(base / 10000) * 10000;
}

// Fechas determinísticas en 2026
function generarFechaISO(diasAtras) {
  const fecha = new Date('2026-10-05T18:00:00Z');
  fecha.setDate(fecha.getDate() - diasAtras);
  return fecha.toISOString();
}

console.log('Iniciando generación de datos CRM para 105 clientes y usuarios...');

const clientes = [];
const todosContactos = [];
const todasOportunidades = [];
const todasActividades = [];

EMPRESAS_BASE.forEach((emp, index) => {
  const num = index + 1;
  const codigo = `CLI-${String(num).padStart(3, '0')}`;
  const id = `c${String(num).padStart(3, '0')}0000-0000-4000-8000-${String(num).padStart(12, '0')}`;

  // Determinación de estado ponderada:
  // 45% activos, 25% en negociación, 20% prospectos, 7% inactivos, 3% cerrado perdido
  let estado = 'activo';
  if (num % 10 === 1 || num % 10 === 5) estado = 'en_negociacion';
  else if (num % 10 === 2 || num % 10 === 8) estado = 'prospecto';
  else if (num % 20 === 13) estado = 'inactivo';
  else if (num % 30 === 29) estado = 'cerrado_perdido';

  // Prioridad
  const prioridad = (num % 3 === 0) ? 'alta' : (num % 3 === 1 ? 'media' : 'baja');

  // Responsable asignado del equipo
  const responsableObj = USUARIOS[index % USUARIOS.length];
  const responsable = responsableObj.nombre;

  const rnc = generarRNC(num);
  const telefono = generarTelefonoRD(num, 0);
  const emailCorporativo = `info@${emp.dominio}`;
  const sitioWeb = `https://www.${emp.dominio}`;
  const valorEstimado = generarMonto(num);
  const diasAtras = (num * 3) % 180;
  const creadoEn = generarFechaISO(diasAtras + 20);
  const ultimoContacto = generarFechaISO((num * 2) % 25);
  const actualizadoEn = generarFechaISO((num * 2) % 15);

  const direccion = `Av. ${['Winston Churchill', 'Abraham Lincoln', '27 de Febrero', 'John F. Kennedy', 'Lope de Vega', 'Tiradentes', 'Sarasota', 'Estrella Sadhalá', 'Juan Pablo Duarte'][num % 9]} No. ${10 + (num * 3) % 300}, Sector ${['Piantini', 'Naco', 'Bella Vista', 'Evaristo Morales', 'La Julia', 'Los Jardines', 'Villa Olga', 'Cerros de Gurabo'][num % 8]}`;

  // Contactos (entre 1 y 3 contactos por cliente)
  const contactosCliente = [];
  const cantContactos = (num % 3 === 0) ? 3 : ((num % 2 === 0) ? 2 : 1);

  for (let c = 0; c < cantContactos; c++) {
    const contactoId = `cnt-${String(num).padStart(3, '0')}-${c + 1}`;
    const esPrincipal = (c === 0);
    const esMasculino = ((num + c) % 2 === 0);
    const nombrePila = esMasculino ? getRandomItem(NOMBRES_MASCULINOS, num * 3 + c * 7) : getRandomItem(NOMBRES_FEMENINOS, num * 5 + c * 11);
    const apellido1 = getRandomItem(APELLIDOS, num * 2 + c * 5);
    const apellido2 = getRandomItem(APELLIDOS, num * 7 + c * 3 + 1);
    const nombreCompleto = `${nombrePila} ${apellido1} ${apellido2}`;
    
    const cargo = esPrincipal ? getRandomItem(CARGOS_PRINCIPALES, num + c) : getRandomItem(CARGOS_SECUNDARIOS, num * 2 + c);
    const usuarioEmail = `${nombrePila.toLowerCase().replace(/\s+/g, '')}.${apellido1.toLowerCase()}@${emp.dominio}`;
    const telefonoContacto = generarTelefonoRD(num, c + 1);

    const contacto = {
      id: contactoId,
      cliente_id: id,
      nombre: nombreCompleto,
      cargo,
      email: usuarioEmail,
      telefono: telefonoContacto,
      es_principal: esPrincipal,
      creado_en: creadoEn,
    };

    contactosCliente.push(contacto);
    todosContactos.push(contacto);
  }

  // Oportunidades comerciales
  const oportunidadesCliente = [];
  if (estado !== 'inactivo') {
    const etapaMap = {
      activo: 'ganada',
      en_negociacion: 'negociacion',
      prospecto: (num % 2 === 0 ? 'calificacion' : 'propuesta'),
      cerrado_perdido: 'perdida',
    };
    const etapa = etapaMap[estado] || 'propuesta';
    const probMap = { ganada: 100, negociacion: 75, propuesta: 50, calificacion: 30, perdida: 0 };
    
    const titulosOp = [
      `Implementación y Licenciamiento Empresarial Cloud 2026`,
      `Contrato Marco de Suministro B2B Anual`,
      `Renovación de Infraestructura y Soporte Crítico 24/7`,
      `Proyecto de Optimización Operativa y Automatización`,
      `Consultoría Estratégica y Plataforma Integral`,
    ];

    oportunidadesCliente.push({
      id: `op-${String(num).padStart(3, '0')}-1`,
      cliente_id: id,
      titulo: titulosOp[num % titulosOp.length],
      monto: valorEstimado,
      etapa,
      probabilidad: probMap[etapa],
      fecha_cierre_estimada: '2026-11-30',
      creado_en: creadoEn,
    });
    todasOportunidades.push(oportunidadesCliente[0]);
  }

  // Actividades históricas
  const actividadesCliente = [
    {
      id: `act-${String(num).padStart(3, '0')}-1`,
      cliente_id: id,
      tipo: 'reunion',
      descripcion: `Sesión de presentación ejecutiva y revisión de requerimientos técnicos con ${contactosCliente[0].nombre}.`,
      realizado_por: responsable,
      fecha: ultimoContacto,
    },
    {
      id: `act-${String(num).padStart(3, '0')}-2`,
      cliente_id: id,
      tipo: 'correo',
      descripcion: `Envío formal de propuesta comercial y términos contractuales para revisión de compras.`,
      realizado_por: responsable,
      fecha: creadoEn,
    },
  ];
  todasActividades.push(...actividadesCliente);

  clientes.push({
    id,
    codigo,
    razon_social: emp.razon,
    nombre_comercial: emp.nombre,
    identificacion_fiscal: rnc,
    sector: emp.sector,
    estado,
    prioridad,
    sitio_web: sitioWeb,
    telefono,
    email: emailCorporativo,
    direccion,
    ciudad: emp.ciudad,
    pais: 'República Dominicana',
    valor_estimado: valorEstimado,
    responsable,
    ultimo_contacto: ultimoContacto,
    creado_en: creadoEn,
    actualizado_en: actualizadoEn,
    contactos: contactosCliente,
    oportunidades: oportunidadesCliente,
    actividades: actividadesCliente,
  });
});

console.log(`Total clientes generados: ${clientes.length}`);
console.log(`Total contactos generados: ${todosContactos.length}`);
console.log(`Total oportunidades generadas: ${todasOportunidades.length}`);
console.log(`Total actividades generadas: ${todasActividades.length}`);

// 1. Escribir src/modules/clientes/services/cliente.mock-data.ts
const mockDataContent = `import type { Cliente } from '../types/cliente.types';

/**
 * Catálogo Semilla de Clientes B2B Corporativos (República Dominicana y Región).
 * Incluye ${clientes.length} empresas corporativas con sus contactos clave,
 * oportunidades comerciales y bitácora de actividades vinculadas.
 */
export const CLIENTES_SEMILLA: Cliente[] = ${JSON.stringify(clientes, null, 2)};
`;

const mockDataPath = path.join(rootDir, 'src', 'modules', 'clientes', 'services', 'cliente.mock-data.ts');
fs.writeFileSync(mockDataPath, mockDataContent, 'utf-8');
console.log(`✓ Archivo escrito con éxito: ${mockDataPath}`);

// 2. Generar database/seed.sql con sintaxis PostgreSQL robusta
let sql = `-- ====================================================================
-- DEVFORGE PostgreSQL Seed: Datos Iniciales del CRM B2B
-- Contiene: 4 Roles RBAC, 8 Usuarios Comerciales, Permisos,
--           ${clientes.length} Clientes B2B y ${todosContactos.length} Contactos Clave.
-- ====================================================================

-- 1. ROLES DEL SISTEMA
INSERT INTO roles (id, nombre, descripcion) VALUES
  ('admin', 'Directora Comercial & Admin', 'Acceso total y administración de la plataforma CRM'),
  ('gerente', 'Gerente de Cuentas Estratégicas', 'Gestión de cuentas clave, deals, bitácora y métricas'),
  ('ejecutivo', 'Ejecutivo Comercial Senior', 'Gestión operativa de cartera, contactos y oportunidades'),
  ('auditor', 'Auditor & Analista de Riesgo', 'Acceso en modo solo lectura para auditoría y BI')
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion;

-- 2. USUARIOS DEL EQUIPO COMERCIAL
INSERT INTO usuarios (id, nombre, email, password_hash, rol_id, cargo, telefono, avatar, activo, ultimo_acceso) VALUES
${USUARIOS.map(u => `  ('${u.uuid}', '${u.nombre}', '${u.email}', '$2b$10$demoHashForCrmEnterpriseTokenMock123', '${u.rol}', '${u.cargo}', '${u.telefono}', '${u.avatar}', ${u.activo}, '${u.ultimoAcceso}')`).join(',\n')}
ON CONFLICT (email) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  rol_id = EXCLUDED.rol_id,
  cargo = EXCLUDED.cargo,
  telefono = EXCLUDED.telefono,
  avatar = EXCLUDED.avatar,
  activo = EXCLUDED.activo;

-- 3. PERMISOS POR ROL (RBAC CASL)
INSERT INTO permisos_rol (rol_id, accion, sujeto) VALUES
  ('admin', 'manage', 'all'),
  ('gerente', 'read', 'Cliente'),
  ('gerente', 'create', 'Cliente'),
  ('gerente', 'update', 'Cliente'),
  ('gerente', 'manage', 'Oportunidad'),
  ('gerente', 'manage', 'Actividad'),
  ('gerente', 'read', 'Metricas'),
  ('gerente', 'read', 'Usuario'),
  ('ejecutivo', 'read', 'Cliente'),
  ('ejecutivo', 'create', 'Cliente'),
  ('ejecutivo', 'update', 'Cliente'),
  ('ejecutivo', 'read', 'Oportunidad'),
  ('ejecutivo', 'create', 'Oportunidad'),
  ('ejecutivo', 'update', 'Oportunidad'),
  ('ejecutivo', 'manage', 'Actividad'),
  ('ejecutivo', 'read', 'Metricas'),
  ('auditor', 'read', 'Cliente'),
  ('auditor', 'read', 'Oportunidad'),
  ('auditor', 'read', 'Actividad'),
  ('auditor', 'read', 'Metricas')
ON CONFLICT DO NOTHING;

-- 4. CLIENTES B2B (${clientes.length} Empresas)
INSERT INTO clientes (id, codigo, razon_social, nombre_comercial, identificacion_fiscal, sector, estado, prioridad, sitio_web, telefono, email, direccion, ciudad, pais, valor_estimado, responsable, ultimo_contacto, creado_en, actualizado_en) VALUES
${clientes.map(c => `  ('${c.id}', '${c.codigo}', '${c.razon_social.replace(/'/g, "''")}', '${c.nombre_comercial.replace(/'/g, "''")}', '${c.identificacion_fiscal}', '${c.sector}', '${c.estado}', '${c.prioridad}', '${c.sitio_web}', '${c.telefono}', '${c.email}', '${c.direccion.replace(/'/g, "''")}', '${c.ciudad}', '${c.pais}', ${c.valor_estimado}, '${c.responsable}', '${c.ultimo_contacto}', '${c.creado_en}', '${c.actualizado_en}')`).join(',\n')}
ON CONFLICT (codigo) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  nombre_comercial = EXCLUDED.nombre_comercial,
  identificacion_fiscal = EXCLUDED.identificacion_fiscal,
  sector = EXCLUDED.sector,
  estado = EXCLUDED.estado,
  prioridad = EXCLUDED.prioridad,
  valor_estimado = EXCLUDED.valor_estimado,
  responsable = EXCLUDED.responsable;

-- 5. CONTACTOS CLAVE (${todosContactos.length} Contactos Directos)
INSERT INTO contactos (id, cliente_id, nombre, cargo, email, telefono, es_principal, creado_en) VALUES
${todosContactos.map((ct, idx) => {
  const uuid = `ct000000-0000-4000-8000-${String(idx + 1).padStart(12, '0')}`;
  return `  ('${uuid}', '${ct.cliente_id}', '${ct.nombre.replace(/'/g, "''")}', '${ct.cargo.replace(/'/g, "''")}', '${ct.email}', '${ct.telefono}', ${ct.es_principal}, '${ct.creado_en}')`;
}).join(',\n')}
ON CONFLICT DO NOTHING;

-- 6. OPORTUNIDADES (${todasOportunidades.length} Tratos Comerciales)
INSERT INTO oportunidades (id, cliente_id, titulo, monto, etapa, probabilidad, fecha_cierre_estimada, creado_en) VALUES
${todasOportunidades.map((op, idx) => {
  const uuid = `op000000-0000-4000-8000-${String(idx + 1).padStart(12, '0')}`;
  return `  ('${uuid}', '${op.cliente_id}', '${op.titulo.replace(/'/g, "''")}', ${op.monto}, '${op.etapa}', ${op.probabilidad}, '${op.fecha_cierre_estimada}', '${op.creado_en}')`;
}).join(',\n')}
ON CONFLICT DO NOTHING;

-- 7. ACTIVIDADES HISTÓRICAS (${todasActividades.length} Registros de Bitácora)
INSERT INTO actividades (id, cliente_id, tipo, descripcion, realizado_por, fecha) VALUES
${todasActividades.map((ac, idx) => {
  const uuid = `ac000000-0000-4000-8000-${String(idx + 1).padStart(12, '0')}`;
  return `  ('${uuid}', '${ac.cliente_id}', '${ac.tipo}', '${ac.descripcion.replace(/'/g, "''")}', '${ac.realizado_por}', '${ac.fecha}')`;
}).join(',\n')}
ON CONFLICT DO NOTHING;
`;

const seedSqlPath = path.join(rootDir, 'database', 'seed.sql');
fs.writeFileSync(seedSqlPath, sql, 'utf-8');
console.log(`✓ Archivo escrito con éxito: ${seedSqlPath}`);
