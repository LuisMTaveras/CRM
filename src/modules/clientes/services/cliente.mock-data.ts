import type { Cliente } from '../types/cliente.types';

/**
 * Catálogo Semilla de Clientes B2B Corporativos (República Dominicana y Región).
 * Incluye 117 empresas corporativas con sus contactos clave,
 * oportunidades comerciales y bitácora de actividades vinculadas.
 */
export const CLIENTES_SEMILLA: Cliente[] = [
  {
    "id": "c0010000-0000-4000-8000-000000000001",
    "codigo": "CLI-001",
    "razon_social": "Soluciones Tecnológicas IQtek S.A.S.",
    "nombre_comercial": "IQtek Solutions",
    "identificacion_fiscal": "1-31-10617-2",
    "sector": "Tecnología",
    "estado": "en_negociacion",
    "prioridad": "media",
    "sitio_web": "https://www.iqtek.com.do",
    "telefono": "+1 (829) 207-1043",
    "email": "info@iqtek.com.do",
    "direccion": "Av. Abraham Lincoln No. 13, Sector Naco",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 1920000,
    "responsable": "Camila Morales",
    "ultimo_contacto": "2026-10-03T18:00:00.000Z",
    "creado_en": "2026-09-12T18:00:00.000Z",
    "actualizado_en": "2026-10-03T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-001-1",
        "cliente_id": "c0010000-0000-4000-8000-000000000001",
        "nombre": "Beatriz García Báez",
        "cargo": "Vicepresidente de Finanzas & Tesorería",
        "email": "beatriz.garcía@iqtek.com.do",
        "telefono": "+1 (849) 220-1074",
        "es_principal": true,
        "creado_en": "2026-09-12T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-001-1",
        "cliente_id": "c0010000-0000-4000-8000-000000000001",
        "titulo": "Contrato Marco de Suministro B2B Anual",
        "monto": 1920000,
        "etapa": "negociacion",
        "probabilidad": 75,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-09-12T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-001-1",
        "cliente_id": "c0010000-0000-4000-8000-000000000001",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Beatriz García Báez.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-10-03T18:00:00.000Z"
      },
      {
        "id": "act-001-2",
        "cliente_id": "c0010000-0000-4000-8000-000000000001",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-09-12T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0020000-0000-4000-8000-000000000002",
    "codigo": "CLI-002",
    "razon_social": "Softland Dominicana S.R.L.",
    "nombre_comercial": "Softland RD",
    "identificacion_fiscal": "1-01-11234-5",
    "sector": "Tecnología",
    "estado": "prospecto",
    "prioridad": "baja",
    "sitio_web": "https://www.softland.do",
    "telefono": "+1 (849) 214-1086",
    "email": "info@softland.do",
    "direccion": "Av. 27 de Febrero No. 16, Sector Bella Vista",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 2330000,
    "responsable": "Ignacio Silva",
    "ultimo_contacto": "2026-10-01T18:00:00.000Z",
    "creado_en": "2026-09-09T18:00:00.000Z",
    "actualizado_en": "2026-10-01T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-002-1",
        "cliente_id": "c0020000-0000-4000-8000-000000000002",
        "nombre": "José Luis Rodríguez De la Cruz",
        "cargo": "Director de Tecnología & Transformación Digital",
        "email": "joséluis.rodríguez@softland.do",
        "telefono": "+1 (809) 227-1117",
        "es_principal": true,
        "creado_en": "2026-09-09T18:00:00.000Z"
      },
      {
        "id": "cnt-002-2",
        "cliente_id": "c0020000-0000-4000-8000-000000000002",
        "nombre": "Mariela Mejía Sánchez",
        "cargo": "Analista Financiero Principal",
        "email": "mariela.mejía@softland.do",
        "telefono": "+1 (829) 240-1148",
        "es_principal": false,
        "creado_en": "2026-09-09T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-002-1",
        "cliente_id": "c0020000-0000-4000-8000-000000000002",
        "titulo": "Renovación de Infraestructura y Soporte Crítico 24/7",
        "monto": 2330000,
        "etapa": "calificacion",
        "probabilidad": 30,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-09-09T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-002-1",
        "cliente_id": "c0020000-0000-4000-8000-000000000002",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con José Luis Rodríguez De la Cruz.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-10-01T18:00:00.000Z"
      },
      {
        "id": "act-002-2",
        "cliente_id": "c0020000-0000-4000-8000-000000000002",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-09-09T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0030000-0000-4000-8000-000000000003",
    "codigo": "CLI-003",
    "razon_social": "DataVim Dominicana S.A.",
    "nombre_comercial": "DataVim Analytics",
    "identificacion_fiscal": "1-31-11851-8",
    "sector": "Tecnología",
    "estado": "activo",
    "prioridad": "alta",
    "sitio_web": "https://www.datavim.com.do",
    "telefono": "+1 (809) 221-1129",
    "email": "info@datavim.com.do",
    "direccion": "Av. John F. Kennedy No. 19, Sector Evaristo Morales",
    "ciudad": "Santiago",
    "pais": "República Dominicana",
    "valor_estimado": 2750000,
    "responsable": "Felipe Guzmán",
    "ultimo_contacto": "2026-09-29T18:00:00.000Z",
    "creado_en": "2026-09-06T18:00:00.000Z",
    "actualizado_en": "2026-09-29T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-003-1",
        "cliente_id": "c0030000-0000-4000-8000-000000000003",
        "nombre": "Valeria Martínez Morales",
        "cargo": "Gerente General de Compras & Cadena de Suministro",
        "email": "valeria.martínez@datavim.com.do",
        "telefono": "+1 (829) 234-1160",
        "es_principal": true,
        "creado_en": "2026-09-06T18:00:00.000Z"
      },
      {
        "id": "cnt-003-2",
        "cliente_id": "c0030000-0000-4000-8000-000000000003",
        "nombre": "Ramón Taveras Pichardo",
        "cargo": "Gerente de Seguridad Industrial y Calidad",
        "email": "ramón.taveras@datavim.com.do",
        "telefono": "+1 (849) 247-1191",
        "es_principal": false,
        "creado_en": "2026-09-06T18:00:00.000Z"
      },
      {
        "id": "cnt-003-3",
        "cliente_id": "c0030000-0000-4000-8000-000000000003",
        "nombre": "Silvia Peña Troncoso",
        "cargo": "Gerente de Cuentas por Pagar & Contabilidad",
        "email": "silvia.peña@datavim.com.do",
        "telefono": "+1 (809) 260-1222",
        "es_principal": false,
        "creado_en": "2026-09-06T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-003-1",
        "cliente_id": "c0030000-0000-4000-8000-000000000003",
        "titulo": "Proyecto de Optimización Operativa y Automatización",
        "monto": 2750000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-09-06T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-003-1",
        "cliente_id": "c0030000-0000-4000-8000-000000000003",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Valeria Martínez Morales.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-09-29T18:00:00.000Z"
      },
      {
        "id": "act-003-2",
        "cliente_id": "c0030000-0000-4000-8000-000000000003",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-09-06T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0040000-0000-4000-8000-000000000004",
    "codigo": "CLI-004",
    "razon_social": "OneLink BPO Dominican Republic S.A.",
    "nombre_comercial": "OneLink Dominicana",
    "identificacion_fiscal": "1-01-12468-2",
    "sector": "Tecnología",
    "estado": "activo",
    "prioridad": "media",
    "sitio_web": "https://www.onelinkbpo.do",
    "telefono": "+1 (829) 228-1172",
    "email": "info@onelinkbpo.do",
    "direccion": "Av. Lope de Vega No. 22, Sector La Julia",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 3160000,
    "responsable": "Laura Peña",
    "ultimo_contacto": "2026-09-27T18:00:00.000Z",
    "creado_en": "2026-09-03T18:00:00.000Z",
    "actualizado_en": "2026-09-27T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-004-1",
        "cliente_id": "c0040000-0000-4000-8000-000000000004",
        "nombre": "Víctor Báez Fernández",
        "cargo": "Vicepresidente Ejecutivo de Administración",
        "email": "víctor.báez@onelinkbpo.do",
        "telefono": "+1 (849) 241-1203",
        "es_principal": true,
        "creado_en": "2026-09-03T18:00:00.000Z"
      },
      {
        "id": "cnt-004-2",
        "cliente_id": "c0040000-0000-4000-8000-000000000004",
        "nombre": "Raquel Almonte Pérez",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "raquel.almonte@onelinkbpo.do",
        "telefono": "+1 (809) 254-1234",
        "es_principal": false,
        "creado_en": "2026-09-03T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-004-1",
        "cliente_id": "c0040000-0000-4000-8000-000000000004",
        "titulo": "Consultoría Estratégica y Plataforma Integral",
        "monto": 3160000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-09-03T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-004-1",
        "cliente_id": "c0040000-0000-4000-8000-000000000004",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Víctor Báez Fernández.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-09-27T18:00:00.000Z"
      },
      {
        "id": "act-004-2",
        "cliente_id": "c0040000-0000-4000-8000-000000000004",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-09-03T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0050000-0000-4000-8000-000000000005",
    "codigo": "CLI-005",
    "razon_social": "Teleperformance RD S.R.L.",
    "nombre_comercial": "Teleperformance Caribe",
    "identificacion_fiscal": "1-31-13085-5",
    "sector": "Tecnología",
    "estado": "en_negociacion",
    "prioridad": "baja",
    "sitio_web": "https://www.teleperformance.do",
    "telefono": "+1 (849) 235-1215",
    "email": "info@teleperformance.do",
    "direccion": "Av. Tiradentes No. 25, Sector Los Jardines",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 3580000,
    "responsable": "Roberto Méndez",
    "ultimo_contacto": "2026-09-25T18:00:00.000Z",
    "creado_en": "2026-08-31T18:00:00.000Z",
    "actualizado_en": "2026-09-25T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-005-1",
        "cliente_id": "c0050000-0000-4000-8000-000000000005",
        "nombre": "Sofía Guzmán Castillo",
        "cargo": "Director de Recursos Humanos & Talento",
        "email": "sofía.guzmán@teleperformance.do",
        "telefono": "+1 (809) 248-1246",
        "es_principal": true,
        "creado_en": "2026-08-31T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-005-1",
        "cliente_id": "c0050000-0000-4000-8000-000000000005",
        "titulo": "Implementación y Licenciamiento Empresarial Cloud 2026",
        "monto": 3580000,
        "etapa": "negociacion",
        "probabilidad": 75,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-08-31T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-005-1",
        "cliente_id": "c0050000-0000-4000-8000-000000000005",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Sofía Guzmán Castillo.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-09-25T18:00:00.000Z"
      },
      {
        "id": "act-005-2",
        "cliente_id": "c0050000-0000-4000-8000-000000000005",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-08-31T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0060000-0000-4000-8000-000000000006",
    "codigo": "CLI-006",
    "razon_social": "Cloud Caribe Solutions S.R.L.",
    "nombre_comercial": "CloudCaribe RD",
    "identificacion_fiscal": "1-01-13702-8",
    "sector": "Tecnología",
    "estado": "activo",
    "prioridad": "alta",
    "sitio_web": "https://www.cloudcaribe.com.do",
    "telefono": "+1 (809) 242-1258",
    "email": "info@cloudcaribe.com.do",
    "direccion": "Av. Sarasota No. 28, Sector Villa Olga",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 3990000,
    "responsable": "Valentina Castillo",
    "ultimo_contacto": "2026-09-23T18:00:00.000Z",
    "creado_en": "2026-08-28T18:00:00.000Z",
    "actualizado_en": "2026-09-23T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-006-1",
        "cliente_id": "c0060000-0000-4000-8000-000000000006",
        "nombre": "Pedro Valdez Reyes",
        "cargo": "Gerente de Infraestructura & Operaciones TI",
        "email": "pedro.valdez@cloudcaribe.com.do",
        "telefono": "+1 (829) 255-1289",
        "es_principal": true,
        "creado_en": "2026-08-28T18:00:00.000Z"
      },
      {
        "id": "cnt-006-2",
        "cliente_id": "c0060000-0000-4000-8000-000000000006",
        "nombre": "Marisol Mendoza Mendoza",
        "cargo": "Analista Financiero Principal",
        "email": "marisol.mendoza@cloudcaribe.com.do",
        "telefono": "+1 (849) 268-1320",
        "es_principal": false,
        "creado_en": "2026-08-28T18:00:00.000Z"
      },
      {
        "id": "cnt-006-3",
        "cliente_id": "c0060000-0000-4000-8000-000000000006",
        "nombre": "Andrés Morales Jiménez",
        "cargo": "Asesor Legal Corporativo",
        "email": "andrés.morales@cloudcaribe.com.do",
        "telefono": "+1 (809) 281-1351",
        "es_principal": false,
        "creado_en": "2026-08-28T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-006-1",
        "cliente_id": "c0060000-0000-4000-8000-000000000006",
        "titulo": "Contrato Marco de Suministro B2B Anual",
        "monto": 3990000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-08-28T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-006-1",
        "cliente_id": "c0060000-0000-4000-8000-000000000006",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Pedro Valdez Reyes.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-09-23T18:00:00.000Z"
      },
      {
        "id": "act-006-2",
        "cliente_id": "c0060000-0000-4000-8000-000000000006",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-08-28T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0070000-0000-4000-8000-000000000007",
    "codigo": "CLI-007",
    "razon_social": "CyberSec Antillana S.A.S.",
    "nombre_comercial": "CyberSec Antillas",
    "identificacion_fiscal": "1-31-14319-2",
    "sector": "Tecnología",
    "estado": "activo",
    "prioridad": "media",
    "sitio_web": "https://www.cybersecantillana.do",
    "telefono": "+1 (829) 249-1301",
    "email": "info@cybersecantillana.do",
    "direccion": "Av. Estrella Sadhalá No. 31, Sector Cerros de Gurabo",
    "ciudad": "Santiago",
    "pais": "República Dominicana",
    "valor_estimado": 4410000,
    "responsable": "Marcos Almonte",
    "ultimo_contacto": "2026-09-21T18:00:00.000Z",
    "creado_en": "2026-08-25T18:00:00.000Z",
    "actualizado_en": "2026-09-21T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-007-1",
        "cliente_id": "c0070000-0000-4000-8000-000000000007",
        "nombre": "Natalia Reyes Cabrera",
        "cargo": "Director Comercial y Alianzas Corporativas",
        "email": "natalia.reyes@cybersecantillana.do",
        "telefono": "+1 (849) 262-1332",
        "es_principal": true,
        "creado_en": "2026-08-25T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-007-1",
        "cliente_id": "c0070000-0000-4000-8000-000000000007",
        "titulo": "Renovación de Infraestructura y Soporte Crítico 24/7",
        "monto": 4410000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-08-25T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-007-1",
        "cliente_id": "c0070000-0000-4000-8000-000000000007",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Natalia Reyes Cabrera.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-09-21T18:00:00.000Z"
      },
      {
        "id": "act-007-2",
        "cliente_id": "c0070000-0000-4000-8000-000000000007",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-08-25T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0080000-0000-4000-8000-000000000008",
    "codigo": "CLI-008",
    "razon_social": "OmniComm Dominicana S.R.L.",
    "nombre_comercial": "OmniComm Systems",
    "identificacion_fiscal": "1-01-14936-5",
    "sector": "Tecnología",
    "estado": "prospecto",
    "prioridad": "baja",
    "sitio_web": "https://www.omnicomm.com.do",
    "telefono": "+1 (849) 256-1344",
    "email": "info@omnicomm.com.do",
    "direccion": "Av. Juan Pablo Duarte No. 34, Sector Piantini",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 4820000,
    "responsable": "Daniela Rosario",
    "ultimo_contacto": "2026-09-19T18:00:00.000Z",
    "creado_en": "2026-08-22T18:00:00.000Z",
    "actualizado_en": "2026-10-04T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-008-1",
        "cliente_id": "c0080000-0000-4000-8000-000000000008",
        "nombre": "Héctor Peña Troncoso",
        "cargo": "Director General de Operaciones",
        "email": "héctor.peña@omnicomm.com.do",
        "telefono": "+1 (809) 269-1375",
        "es_principal": true,
        "creado_en": "2026-08-22T18:00:00.000Z"
      },
      {
        "id": "cnt-008-2",
        "cliente_id": "c0080000-0000-4000-8000-000000000008",
        "nombre": "Gabriela Cabrera García",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "gabriela.cabrera@omnicomm.com.do",
        "telefono": "+1 (829) 282-1406",
        "es_principal": false,
        "creado_en": "2026-08-22T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-008-1",
        "cliente_id": "c0080000-0000-4000-8000-000000000008",
        "titulo": "Proyecto de Optimización Operativa y Automatización",
        "monto": 4820000,
        "etapa": "calificacion",
        "probabilidad": 30,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-08-22T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-008-1",
        "cliente_id": "c0080000-0000-4000-8000-000000000008",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Héctor Peña Troncoso.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-09-19T18:00:00.000Z"
      },
      {
        "id": "act-008-2",
        "cliente_id": "c0080000-0000-4000-8000-000000000008",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-08-22T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0090000-0000-4000-8000-000000000009",
    "codigo": "CLI-009",
    "razon_social": "NexSys del Caribe S.R.L.",
    "nombre_comercial": "NexSys RD",
    "identificacion_fiscal": "1-31-15553-8",
    "sector": "Tecnología",
    "estado": "activo",
    "prioridad": "alta",
    "sitio_web": "https://www.nexsyscaribe.do",
    "telefono": "+1 (809) 263-1387",
    "email": "info@nexsyscaribe.do",
    "direccion": "Av. Winston Churchill No. 37, Sector Naco",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 5240000,
    "responsable": "Camila Morales",
    "ultimo_contacto": "2026-09-17T18:00:00.000Z",
    "creado_en": "2026-08-19T18:00:00.000Z",
    "actualizado_en": "2026-10-02T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-009-1",
        "cliente_id": "c0090000-0000-4000-8000-000000000009",
        "nombre": "Andrea Sánchez Martínez",
        "cargo": "Vicepresidente de Finanzas & Tesorería",
        "email": "andrea.sánchez@nexsyscaribe.do",
        "telefono": "+1 (829) 276-1418",
        "es_principal": true,
        "creado_en": "2026-08-19T18:00:00.000Z"
      },
      {
        "id": "cnt-009-2",
        "cliente_id": "c0090000-0000-4000-8000-000000000009",
        "nombre": "César Rosario Mejía",
        "cargo": "Coordinador de Logística y Despacho",
        "email": "césar.rosario@nexsyscaribe.do",
        "telefono": "+1 (849) 289-1449",
        "es_principal": false,
        "creado_en": "2026-08-19T18:00:00.000Z"
      },
      {
        "id": "cnt-009-3",
        "cliente_id": "c0090000-0000-4000-8000-000000000009",
        "nombre": "Sofía Troncoso Valdez",
        "cargo": "Especialista Senior de Compras Estratégicas",
        "email": "sofía.troncoso@nexsyscaribe.do",
        "telefono": "+1 (809) 302-1480",
        "es_principal": false,
        "creado_en": "2026-08-19T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-009-1",
        "cliente_id": "c0090000-0000-4000-8000-000000000009",
        "titulo": "Consultoría Estratégica y Plataforma Integral",
        "monto": 5240000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-08-19T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-009-1",
        "cliente_id": "c0090000-0000-4000-8000-000000000009",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Andrea Sánchez Martínez.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-09-17T18:00:00.000Z"
      },
      {
        "id": "act-009-2",
        "cliente_id": "c0090000-0000-4000-8000-000000000009",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-08-19T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0100000-0000-4000-8000-000000000010",
    "codigo": "CLI-010",
    "razon_social": "Soporte e Infraestructura ITEX S.A.",
    "nombre_comercial": "ITEX Infraestructuras",
    "identificacion_fiscal": "1-01-16170-2",
    "sector": "Tecnología",
    "estado": "activo",
    "prioridad": "media",
    "sitio_web": "https://www.itex.com.do",
    "telefono": "+1 (829) 270-1430",
    "email": "info@itex.com.do",
    "direccion": "Av. Abraham Lincoln No. 40, Sector Bella Vista",
    "ciudad": "La Romana",
    "pais": "República Dominicana",
    "valor_estimado": 5650000,
    "responsable": "Ignacio Silva",
    "ultimo_contacto": "2026-09-15T18:00:00.000Z",
    "creado_en": "2026-08-16T18:00:00.000Z",
    "actualizado_en": "2026-09-30T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-010-1",
        "cliente_id": "c0100000-0000-4000-8000-000000000010",
        "nombre": "Fernando Jiménez Almonte",
        "cargo": "Director de Tecnología & Transformación Digital",
        "email": "fernando.jiménez@itex.com.do",
        "telefono": "+1 (849) 283-1461",
        "es_principal": true,
        "creado_en": "2026-08-16T18:00:00.000Z"
      },
      {
        "id": "cnt-010-2",
        "cliente_id": "c0100000-0000-4000-8000-000000000010",
        "nombre": "Teresa Pichardo Peña",
        "cargo": "Analista Financiero Principal",
        "email": "teresa.pichardo@itex.com.do",
        "telefono": "+1 (809) 296-1492",
        "es_principal": false,
        "creado_en": "2026-08-16T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-010-1",
        "cliente_id": "c0100000-0000-4000-8000-000000000010",
        "titulo": "Implementación y Licenciamiento Empresarial Cloud 2026",
        "monto": 5650000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-08-16T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-010-1",
        "cliente_id": "c0100000-0000-4000-8000-000000000010",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Fernando Jiménez Almonte.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-09-15T18:00:00.000Z"
      },
      {
        "id": "act-010-2",
        "cliente_id": "c0100000-0000-4000-8000-000000000010",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-08-16T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0110000-0000-4000-8000-000000000011",
    "codigo": "CLI-011",
    "razon_social": "FinTech Caribe Innovaciones S.A.S.",
    "nombre_comercial": "FinTech Caribe",
    "identificacion_fiscal": "1-31-16787-5",
    "sector": "Tecnología",
    "estado": "en_negociacion",
    "prioridad": "baja",
    "sitio_web": "https://www.fintechcaribe.do",
    "telefono": "+1 (849) 277-1473",
    "email": "info@fintechcaribe.do",
    "direccion": "Av. 27 de Febrero No. 43, Sector Evaristo Morales",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 6070000,
    "responsable": "Felipe Guzmán",
    "ultimo_contacto": "2026-09-13T18:00:00.000Z",
    "creado_en": "2026-08-13T18:00:00.000Z",
    "actualizado_en": "2026-09-28T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-011-1",
        "cliente_id": "c0110000-0000-4000-8000-000000000011",
        "nombre": "Paola Morales Jiménez",
        "cargo": "Gerente General de Compras & Cadena de Suministro",
        "email": "paola.morales@fintechcaribe.do",
        "telefono": "+1 (809) 290-1504",
        "es_principal": true,
        "creado_en": "2026-08-13T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-011-1",
        "cliente_id": "c0110000-0000-4000-8000-000000000011",
        "titulo": "Contrato Marco de Suministro B2B Anual",
        "monto": 6070000,
        "etapa": "negociacion",
        "probabilidad": 75,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-08-13T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-011-1",
        "cliente_id": "c0110000-0000-4000-8000-000000000011",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Paola Morales Jiménez.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-09-13T18:00:00.000Z"
      },
      {
        "id": "act-011-2",
        "cliente_id": "c0110000-0000-4000-8000-000000000011",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-08-13T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0120000-0000-4000-8000-000000000012",
    "codigo": "CLI-012",
    "razon_social": "SmartData Dominicana S.R.L.",
    "nombre_comercial": "SmartData RD",
    "identificacion_fiscal": "1-01-17404-8",
    "sector": "Tecnología",
    "estado": "prospecto",
    "prioridad": "alta",
    "sitio_web": "https://www.smartdata.do",
    "telefono": "+1 (809) 284-1516",
    "email": "info@smartdata.do",
    "direccion": "Av. John F. Kennedy No. 46, Sector La Julia",
    "ciudad": "Santiago",
    "pais": "República Dominicana",
    "valor_estimado": 6480000,
    "responsable": "Laura Peña",
    "ultimo_contacto": "2026-09-11T18:00:00.000Z",
    "creado_en": "2026-08-10T18:00:00.000Z",
    "actualizado_en": "2026-09-26T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-012-1",
        "cliente_id": "c0120000-0000-4000-8000-000000000012",
        "nombre": "Javier Estrella Corominas",
        "cargo": "Vicepresidente Ejecutivo de Administración",
        "email": "javier.estrella@smartdata.do",
        "telefono": "+1 (829) 297-1547",
        "es_principal": true,
        "creado_en": "2026-08-10T18:00:00.000Z"
      },
      {
        "id": "cnt-012-2",
        "cliente_id": "c0120000-0000-4000-8000-000000000012",
        "nombre": "Lucía Fernández Santana",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "lucía.fernández@smartdata.do",
        "telefono": "+1 (849) 310-1578",
        "es_principal": false,
        "creado_en": "2026-08-10T18:00:00.000Z"
      },
      {
        "id": "cnt-012-3",
        "cliente_id": "c0120000-0000-4000-8000-000000000012",
        "nombre": "Gabriel Hernández Rodríguez",
        "cargo": "Líder de Proyectos de TI e Innovación",
        "email": "gabriel.hernández@smartdata.do",
        "telefono": "+1 (809) 323-1609",
        "es_principal": false,
        "creado_en": "2026-08-10T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-012-1",
        "cliente_id": "c0120000-0000-4000-8000-000000000012",
        "titulo": "Renovación de Infraestructura y Soporte Crítico 24/7",
        "monto": 6480000,
        "etapa": "calificacion",
        "probabilidad": 30,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-08-10T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-012-1",
        "cliente_id": "c0120000-0000-4000-8000-000000000012",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Javier Estrella Corominas.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-09-11T18:00:00.000Z"
      },
      {
        "id": "act-012-2",
        "cliente_id": "c0120000-0000-4000-8000-000000000012",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-08-10T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0130000-0000-4000-8000-000000000013",
    "codigo": "CLI-013",
    "razon_social": "Banco Múltiple BHD S.A.",
    "nombre_comercial": "Banco BHD",
    "identificacion_fiscal": "1-31-18021-2",
    "sector": "Finanzas",
    "estado": "inactivo",
    "prioridad": "media",
    "sitio_web": "https://www.bhd.com.do",
    "telefono": "+1 (829) 291-1559",
    "email": "info@bhd.com.do",
    "direccion": "Av. Lope de Vega No. 49, Sector Los Jardines",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 6900000,
    "responsable": "Roberto Méndez",
    "ultimo_contacto": "2026-10-04T18:00:00.000Z",
    "creado_en": "2026-08-07T18:00:00.000Z",
    "actualizado_en": "2026-09-24T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-013-1",
        "cliente_id": "c0130000-0000-4000-8000-000000000013",
        "nombre": "Patricia Bisonó Hernández",
        "cargo": "Director de Recursos Humanos & Talento",
        "email": "patricia.bisonó@bhd.com.do",
        "telefono": "+1 (849) 304-1590",
        "es_principal": true,
        "creado_en": "2026-08-07T18:00:00.000Z"
      }
    ],
    "oportunidades": [],
    "actividades": [
      {
        "id": "act-013-1",
        "cliente_id": "c0130000-0000-4000-8000-000000000013",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Patricia Bisonó Hernández.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-10-04T18:00:00.000Z"
      },
      {
        "id": "act-013-2",
        "cliente_id": "c0130000-0000-4000-8000-000000000013",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-08-07T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0140000-0000-4000-8000-000000000014",
    "codigo": "CLI-014",
    "razon_social": "Banco Santa Cruz S.A.",
    "nombre_comercial": "Banco Santa Cruz",
    "identificacion_fiscal": "1-01-18638-5",
    "sector": "Finanzas",
    "estado": "activo",
    "prioridad": "baja",
    "sitio_web": "https://www.bancosantacruz.com.do",
    "telefono": "+1 (849) 298-1602",
    "email": "info@bancosantacruz.com.do",
    "direccion": "Av. Tiradentes No. 52, Sector Villa Olga",
    "ciudad": "Santiago",
    "pais": "República Dominicana",
    "valor_estimado": 7310000,
    "responsable": "Valentina Castillo",
    "ultimo_contacto": "2026-10-02T18:00:00.000Z",
    "creado_en": "2026-08-04T18:00:00.000Z",
    "actualizado_en": "2026-09-22T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-014-1",
        "cliente_id": "c0140000-0000-4000-8000-000000000014",
        "nombre": "Carlos Troncoso Valdez",
        "cargo": "Gerente de Infraestructura & Operaciones TI",
        "email": "carlos.troncoso@bancosantacruz.com.do",
        "telefono": "+1 (809) 311-1633",
        "es_principal": true,
        "creado_en": "2026-08-04T18:00:00.000Z"
      },
      {
        "id": "cnt-014-2",
        "cliente_id": "c0140000-0000-4000-8000-000000000014",
        "nombre": "Daniela Rodríguez De la Cruz",
        "cargo": "Analista Financiero Principal",
        "email": "daniela.rodríguez@bancosantacruz.com.do",
        "telefono": "+1 (829) 324-1664",
        "es_principal": false,
        "creado_en": "2026-08-04T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-014-1",
        "cliente_id": "c0140000-0000-4000-8000-000000000014",
        "titulo": "Consultoría Estratégica y Plataforma Integral",
        "monto": 7310000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-08-04T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-014-1",
        "cliente_id": "c0140000-0000-4000-8000-000000000014",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Carlos Troncoso Valdez.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-10-02T18:00:00.000Z"
      },
      {
        "id": "act-014-2",
        "cliente_id": "c0140000-0000-4000-8000-000000000014",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-08-04T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0150000-0000-4000-8000-000000000015",
    "codigo": "CLI-015",
    "razon_social": "Asociación Popular de Ahorros y Préstamos",
    "nombre_comercial": "APAP",
    "identificacion_fiscal": "1-31-19255-8",
    "sector": "Finanzas",
    "estado": "en_negociacion",
    "prioridad": "alta",
    "sitio_web": "https://www.apap.com.do",
    "telefono": "+1 (809) 305-1645",
    "email": "info@apap.com.do",
    "direccion": "Av. Sarasota No. 55, Sector Cerros de Gurabo",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 7730000,
    "responsable": "Marcos Almonte",
    "ultimo_contacto": "2026-09-30T18:00:00.000Z",
    "creado_en": "2026-08-01T18:00:00.000Z",
    "actualizado_en": "2026-10-05T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-015-1",
        "cliente_id": "c0150000-0000-4000-8000-000000000015",
        "nombre": "Rosa María Santana Vargas",
        "cargo": "Director Comercial y Alianzas Corporativas",
        "email": "rosamaría.santana@apap.com.do",
        "telefono": "+1 (829) 318-1676",
        "es_principal": true,
        "creado_en": "2026-08-01T18:00:00.000Z"
      },
      {
        "id": "cnt-015-2",
        "cliente_id": "c0150000-0000-4000-8000-000000000015",
        "nombre": "Ricardo Martínez Morales",
        "cargo": "Gerente de Seguridad Industrial y Calidad",
        "email": "ricardo.martínez@apap.com.do",
        "telefono": "+1 (849) 331-1707",
        "es_principal": false,
        "creado_en": "2026-08-01T18:00:00.000Z"
      },
      {
        "id": "cnt-015-3",
        "cliente_id": "c0150000-0000-4000-8000-000000000015",
        "nombre": "Paola Taveras Pichardo",
        "cargo": "Gerente de Cuentas por Pagar & Contabilidad",
        "email": "paola.taveras@apap.com.do",
        "telefono": "+1 (809) 344-1738",
        "es_principal": false,
        "creado_en": "2026-08-01T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-015-1",
        "cliente_id": "c0150000-0000-4000-8000-000000000015",
        "titulo": "Implementación y Licenciamiento Empresarial Cloud 2026",
        "monto": 7730000,
        "etapa": "negociacion",
        "probabilidad": 75,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-08-01T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-015-1",
        "cliente_id": "c0150000-0000-4000-8000-000000000015",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Rosa María Santana Vargas.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-09-30T18:00:00.000Z"
      },
      {
        "id": "act-015-2",
        "cliente_id": "c0150000-0000-4000-8000-000000000015",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-08-01T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0160000-0000-4000-8000-000000000016",
    "codigo": "CLI-016",
    "razon_social": "Seguros Universal S.A.",
    "nombre_comercial": "Seguros Universal",
    "identificacion_fiscal": "1-01-19872-2",
    "sector": "Finanzas",
    "estado": "activo",
    "prioridad": "media",
    "sitio_web": "https://www.universal.com.do",
    "telefono": "+1 (829) 312-1688",
    "email": "info@universal.com.do",
    "direccion": "Av. Estrella Sadhalá No. 58, Sector Piantini",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 8140000,
    "responsable": "Daniela Rosario",
    "ultimo_contacto": "2026-09-28T18:00:00.000Z",
    "creado_en": "2026-07-29T18:00:00.000Z",
    "actualizado_en": "2026-10-03T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-016-1",
        "cliente_id": "c0160000-0000-4000-8000-000000000016",
        "nombre": "José Luis Pérez Bisonó",
        "cargo": "Director General de Operaciones",
        "email": "joséluis.pérez@universal.com.do",
        "telefono": "+1 (849) 325-1719",
        "es_principal": true,
        "creado_en": "2026-07-29T18:00:00.000Z"
      },
      {
        "id": "cnt-016-2",
        "cliente_id": "c0160000-0000-4000-8000-000000000016",
        "nombre": "Elena Báez Fernández",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "elena.báez@universal.com.do",
        "telefono": "+1 (809) 338-1750",
        "es_principal": false,
        "creado_en": "2026-07-29T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-016-1",
        "cliente_id": "c0160000-0000-4000-8000-000000000016",
        "titulo": "Contrato Marco de Suministro B2B Anual",
        "monto": 8140000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-07-29T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-016-1",
        "cliente_id": "c0160000-0000-4000-8000-000000000016",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con José Luis Pérez Bisonó.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-09-28T18:00:00.000Z"
      },
      {
        "id": "act-016-2",
        "cliente_id": "c0160000-0000-4000-8000-000000000016",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-07-29T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0170000-0000-4000-8000-000000000017",
    "codigo": "CLI-017",
    "razon_social": "Humano Seguros S.A.",
    "nombre_comercial": "Humano Seguros",
    "identificacion_fiscal": "1-31-20489-5",
    "sector": "Finanzas",
    "estado": "activo",
    "prioridad": "baja",
    "sitio_web": "https://www.humano.com.do",
    "telefono": "+1 (849) 319-1731",
    "email": "info@humano.com.do",
    "direccion": "Av. Juan Pablo Duarte No. 61, Sector Naco",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 8560000,
    "responsable": "Camila Morales",
    "ultimo_contacto": "2026-09-26T18:00:00.000Z",
    "creado_en": "2026-07-26T18:00:00.000Z",
    "actualizado_en": "2026-10-01T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-017-1",
        "cliente_id": "c0170000-0000-4000-8000-000000000017",
        "nombre": "Claudia Hernández Rodríguez",
        "cargo": "Vicepresidente de Finanzas & Tesorería",
        "email": "claudia.hernández@humano.com.do",
        "telefono": "+1 (809) 332-1762",
        "es_principal": true,
        "creado_en": "2026-07-26T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-017-1",
        "cliente_id": "c0170000-0000-4000-8000-000000000017",
        "titulo": "Renovación de Infraestructura y Soporte Crítico 24/7",
        "monto": 8560000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-07-26T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-017-1",
        "cliente_id": "c0170000-0000-4000-8000-000000000017",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Claudia Hernández Rodríguez.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-09-26T18:00:00.000Z"
      },
      {
        "id": "act-017-2",
        "cliente_id": "c0170000-0000-4000-8000-000000000017",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-07-26T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0180000-0000-4000-8000-000000000018",
    "codigo": "CLI-018",
    "razon_social": "Banco Múltiple BDI S.A.",
    "nombre_comercial": "Banco BDI",
    "identificacion_fiscal": "1-01-21106-8",
    "sector": "Finanzas",
    "estado": "prospecto",
    "prioridad": "alta",
    "sitio_web": "https://www.bdi.com.do",
    "telefono": "+1 (809) 326-1774",
    "email": "info@bdi.com.do",
    "direccion": "Av. Winston Churchill No. 64, Sector Bella Vista",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 8970000,
    "responsable": "Ignacio Silva",
    "ultimo_contacto": "2026-09-24T18:00:00.000Z",
    "creado_en": "2026-07-23T18:00:00.000Z",
    "actualizado_en": "2026-09-29T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-018-1",
        "cliente_id": "c0180000-0000-4000-8000-000000000018",
        "nombre": "Víctor Castillo Taveras",
        "cargo": "Director de Tecnología & Transformación Digital",
        "email": "víctor.castillo@bdi.com.do",
        "telefono": "+1 (829) 339-1805",
        "es_principal": true,
        "creado_en": "2026-07-23T18:00:00.000Z"
      },
      {
        "id": "cnt-018-2",
        "cliente_id": "c0180000-0000-4000-8000-000000000018",
        "nombre": "Carolina Valdez Reyes",
        "cargo": "Analista Financiero Principal",
        "email": "carolina.valdez@bdi.com.do",
        "telefono": "+1 (849) 352-1836",
        "es_principal": false,
        "creado_en": "2026-07-23T18:00:00.000Z"
      },
      {
        "id": "cnt-018-3",
        "cliente_id": "c0180000-0000-4000-8000-000000000018",
        "nombre": "Rafael Mendoza Mendoza",
        "cargo": "Asesor Legal Corporativo",
        "email": "rafael.mendoza@bdi.com.do",
        "telefono": "+1 (809) 365-1867",
        "es_principal": false,
        "creado_en": "2026-07-23T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-018-1",
        "cliente_id": "c0180000-0000-4000-8000-000000000018",
        "titulo": "Proyecto de Optimización Operativa y Automatización",
        "monto": 8970000,
        "etapa": "calificacion",
        "probabilidad": 30,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-07-23T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-018-1",
        "cliente_id": "c0180000-0000-4000-8000-000000000018",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Víctor Castillo Taveras.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-09-24T18:00:00.000Z"
      },
      {
        "id": "act-018-2",
        "cliente_id": "c0180000-0000-4000-8000-000000000018",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-07-23T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0190000-0000-4000-8000-000000000019",
    "codigo": "CLI-019",
    "razon_social": "Asociación Cibao de Ahorros y Préstamos",
    "nombre_comercial": "ACAP",
    "identificacion_fiscal": "1-31-21723-2",
    "sector": "Finanzas",
    "estado": "activo",
    "prioridad": "media",
    "sitio_web": "https://www.acap.com.do",
    "telefono": "+1 (829) 333-1817",
    "email": "info@acap.com.do",
    "direccion": "Av. Abraham Lincoln No. 67, Sector Evaristo Morales",
    "ciudad": "Santiago",
    "pais": "República Dominicana",
    "valor_estimado": 9390000,
    "responsable": "Felipe Guzmán",
    "ultimo_contacto": "2026-09-22T18:00:00.000Z",
    "creado_en": "2026-07-20T18:00:00.000Z",
    "actualizado_en": "2026-09-27T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-019-1",
        "cliente_id": "c0190000-0000-4000-8000-000000000019",
        "nombre": "Verónica Mejía Sánchez",
        "cargo": "Gerente General de Compras & Cadena de Suministro",
        "email": "verónica.mejía@acap.com.do",
        "telefono": "+1 (849) 346-1848",
        "es_principal": true,
        "creado_en": "2026-07-20T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-019-1",
        "cliente_id": "c0190000-0000-4000-8000-000000000019",
        "titulo": "Consultoría Estratégica y Plataforma Integral",
        "monto": 9390000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-07-20T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-019-1",
        "cliente_id": "c0190000-0000-4000-8000-000000000019",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Verónica Mejía Sánchez.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-09-22T18:00:00.000Z"
      },
      {
        "id": "act-019-2",
        "cliente_id": "c0190000-0000-4000-8000-000000000019",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-07-20T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0200000-0000-4000-8000-000000000020",
    "codigo": "CLI-020",
    "razon_social": "Seguros Reservas S.A.",
    "nombre_comercial": "Seguros Reservas",
    "identificacion_fiscal": "1-01-22340-5",
    "sector": "Finanzas",
    "estado": "activo",
    "prioridad": "baja",
    "sitio_web": "https://www.segurosreservas.com",
    "telefono": "+1 (849) 340-1860",
    "email": "info@segurosreservas.com",
    "direccion": "Av. 27 de Febrero No. 70, Sector La Julia",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 9800000,
    "responsable": "Laura Peña",
    "ultimo_contacto": "2026-09-20T18:00:00.000Z",
    "creado_en": "2026-07-17T18:00:00.000Z",
    "actualizado_en": "2026-09-25T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-020-1",
        "cliente_id": "c0200000-0000-4000-8000-000000000020",
        "nombre": "Pedro Taveras Pichardo",
        "cargo": "Vicepresidente Ejecutivo de Administración",
        "email": "pedro.taveras@segurosreservas.com",
        "telefono": "+1 (809) 353-1891",
        "es_principal": true,
        "creado_en": "2026-07-17T18:00:00.000Z"
      },
      {
        "id": "cnt-020-2",
        "cliente_id": "c0200000-0000-4000-8000-000000000020",
        "nombre": "Carmen Peña Troncoso",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "carmen.peña@segurosreservas.com",
        "telefono": "+1 (829) 366-1922",
        "es_principal": false,
        "creado_en": "2026-07-17T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-020-1",
        "cliente_id": "c0200000-0000-4000-8000-000000000020",
        "titulo": "Implementación y Licenciamiento Empresarial Cloud 2026",
        "monto": 9800000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-07-17T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-020-1",
        "cliente_id": "c0200000-0000-4000-8000-000000000020",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Pedro Taveras Pichardo.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-09-20T18:00:00.000Z"
      },
      {
        "id": "act-020-2",
        "cliente_id": "c0200000-0000-4000-8000-000000000020",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-07-17T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0210000-0000-4000-8000-000000000021",
    "codigo": "CLI-021",
    "razon_social": "Banco Promerica República Dominicana",
    "nombre_comercial": "Banco Promerica",
    "identificacion_fiscal": "1-31-22957-8",
    "sector": "Finanzas",
    "estado": "en_negociacion",
    "prioridad": "alta",
    "sitio_web": "https://www.promerica.com.do",
    "telefono": "+1 (809) 347-1903",
    "email": "info@promerica.com.do",
    "direccion": "Av. John F. Kennedy No. 73, Sector Los Jardines",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 10220000,
    "responsable": "Roberto Méndez",
    "ultimo_contacto": "2026-09-18T18:00:00.000Z",
    "creado_en": "2026-07-14T18:00:00.000Z",
    "actualizado_en": "2026-09-23T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-021-1",
        "cliente_id": "c0210000-0000-4000-8000-000000000021",
        "nombre": "Mariela Almonte Pérez",
        "cargo": "Director de Recursos Humanos & Talento",
        "email": "mariela.almonte@promerica.com.do",
        "telefono": "+1 (829) 360-1934",
        "es_principal": true,
        "creado_en": "2026-07-14T18:00:00.000Z"
      },
      {
        "id": "cnt-021-2",
        "cliente_id": "c0210000-0000-4000-8000-000000000021",
        "nombre": "Eduardo Sánchez Martínez",
        "cargo": "Coordinador de Logística y Despacho",
        "email": "eduardo.sánchez@promerica.com.do",
        "telefono": "+1 (849) 373-1965",
        "es_principal": false,
        "creado_en": "2026-07-14T18:00:00.000Z"
      },
      {
        "id": "cnt-021-3",
        "cliente_id": "c0210000-0000-4000-8000-000000000021",
        "nombre": "Claudia Rosario Mejía",
        "cargo": "Especialista Senior de Compras Estratégicas",
        "email": "claudia.rosario@promerica.com.do",
        "telefono": "+1 (809) 386-1996",
        "es_principal": false,
        "creado_en": "2026-07-14T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-021-1",
        "cliente_id": "c0210000-0000-4000-8000-000000000021",
        "titulo": "Contrato Marco de Suministro B2B Anual",
        "monto": 10220000,
        "etapa": "negociacion",
        "probabilidad": 75,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-07-14T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-021-1",
        "cliente_id": "c0210000-0000-4000-8000-000000000021",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Mariela Almonte Pérez.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-09-18T18:00:00.000Z"
      },
      {
        "id": "act-021-2",
        "cliente_id": "c0210000-0000-4000-8000-000000000021",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-07-14T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0220000-0000-4000-8000-000000000022",
    "codigo": "CLI-022",
    "razon_social": "Banco Ademi S.A.",
    "nombre_comercial": "Banco Ademi",
    "identificacion_fiscal": "1-01-23574-2",
    "sector": "Finanzas",
    "estado": "prospecto",
    "prioridad": "media",
    "sitio_web": "https://www.bancoademi.com.do",
    "telefono": "+1 (829) 354-1946",
    "email": "info@bancoademi.com.do",
    "direccion": "Av. Lope de Vega No. 76, Sector Villa Olga",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 10630000,
    "responsable": "Valentina Castillo",
    "ultimo_contacto": "2026-09-16T18:00:00.000Z",
    "creado_en": "2026-07-11T18:00:00.000Z",
    "actualizado_en": "2026-09-21T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-022-1",
        "cliente_id": "c0220000-0000-4000-8000-000000000022",
        "nombre": "Héctor De la Cruz Guzmán",
        "cargo": "Gerente de Infraestructura & Operaciones TI",
        "email": "héctor.de la cruz@bancoademi.com.do",
        "telefono": "+1 (849) 367-1977",
        "es_principal": true,
        "creado_en": "2026-07-11T18:00:00.000Z"
      },
      {
        "id": "cnt-022-2",
        "cliente_id": "c0220000-0000-4000-8000-000000000022",
        "nombre": "Silvia Jiménez Almonte",
        "cargo": "Analista Financiero Principal",
        "email": "silvia.jiménez@bancoademi.com.do",
        "telefono": "+1 (809) 380-2008",
        "es_principal": false,
        "creado_en": "2026-07-11T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-022-1",
        "cliente_id": "c0220000-0000-4000-8000-000000000022",
        "titulo": "Renovación de Infraestructura y Soporte Crítico 24/7",
        "monto": 10630000,
        "etapa": "calificacion",
        "probabilidad": 30,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-07-11T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-022-1",
        "cliente_id": "c0220000-0000-4000-8000-000000000022",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Héctor De la Cruz Guzmán.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-09-16T18:00:00.000Z"
      },
      {
        "id": "act-022-2",
        "cliente_id": "c0220000-0000-4000-8000-000000000022",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-07-11T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0230000-0000-4000-8000-000000000023",
    "codigo": "CLI-023",
    "razon_social": "Puesto de Bolsa United Capital S.A.",
    "nombre_comercial": "United Capital",
    "identificacion_fiscal": "1-31-24191-5",
    "sector": "Finanzas",
    "estado": "activo",
    "prioridad": "baja",
    "sitio_web": "https://www.unitedcapital.com.do",
    "telefono": "+1 (849) 361-1989",
    "email": "info@unitedcapital.com.do",
    "direccion": "Av. Tiradentes No. 79, Sector Cerros de Gurabo",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 11050000,
    "responsable": "Marcos Almonte",
    "ultimo_contacto": "2026-09-14T18:00:00.000Z",
    "creado_en": "2026-07-08T18:00:00.000Z",
    "actualizado_en": "2026-10-04T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-023-1",
        "cliente_id": "c0230000-0000-4000-8000-000000000023",
        "nombre": "Raquel Mendoza Mendoza",
        "cargo": "Director Comercial y Alianzas Corporativas",
        "email": "raquel.mendoza@unitedcapital.com.do",
        "telefono": "+1 (809) 374-2020",
        "es_principal": true,
        "creado_en": "2026-07-08T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-023-1",
        "cliente_id": "c0230000-0000-4000-8000-000000000023",
        "titulo": "Proyecto de Optimización Operativa y Automatización",
        "monto": 11050000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-07-08T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-023-1",
        "cliente_id": "c0230000-0000-4000-8000-000000000023",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Raquel Mendoza Mendoza.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-09-14T18:00:00.000Z"
      },
      {
        "id": "act-023-2",
        "cliente_id": "c0230000-0000-4000-8000-000000000023",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-07-08T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0240000-0000-4000-8000-000000000024",
    "codigo": "CLI-024",
    "razon_social": "Inversiones & Reservas Puesto de Bolsa",
    "nombre_comercial": "Inversiones Reservas",
    "identificacion_fiscal": "1-01-24808-8",
    "sector": "Finanzas",
    "estado": "activo",
    "prioridad": "alta",
    "sitio_web": "https://www.reservasbolsa.com.do",
    "telefono": "+1 (809) 368-2032",
    "email": "info@reservasbolsa.com.do",
    "direccion": "Av. Sarasota No. 82, Sector Piantini",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 11460000,
    "responsable": "Daniela Rosario",
    "ultimo_contacto": "2026-09-12T18:00:00.000Z",
    "creado_en": "2026-07-05T18:00:00.000Z",
    "actualizado_en": "2026-10-02T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-024-1",
        "cliente_id": "c0240000-0000-4000-8000-000000000024",
        "nombre": "Fernando Vargas Estrella",
        "cargo": "Director General de Operaciones",
        "email": "fernando.vargas@reservasbolsa.com.do",
        "telefono": "+1 (829) 381-2063",
        "es_principal": true,
        "creado_en": "2026-07-05T18:00:00.000Z"
      },
      {
        "id": "cnt-024-2",
        "cliente_id": "c0240000-0000-4000-8000-000000000024",
        "nombre": "Beatriz Estrella Corominas",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "beatriz.estrella@reservasbolsa.com.do",
        "telefono": "+1 (849) 394-2094",
        "es_principal": false,
        "creado_en": "2026-07-05T18:00:00.000Z"
      },
      {
        "id": "cnt-024-3",
        "cliente_id": "c0240000-0000-4000-8000-000000000024",
        "nombre": "Alejandro Fernández Santana",
        "cargo": "Líder de Proyectos de TI e Innovación",
        "email": "alejandro.fernández@reservasbolsa.com.do",
        "telefono": "+1 (809) 407-2125",
        "es_principal": false,
        "creado_en": "2026-07-05T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-024-1",
        "cliente_id": "c0240000-0000-4000-8000-000000000024",
        "titulo": "Consultoría Estratégica y Plataforma Integral",
        "monto": 11460000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-07-05T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-024-1",
        "cliente_id": "c0240000-0000-4000-8000-000000000024",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Fernando Vargas Estrella.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-09-12T18:00:00.000Z"
      },
      {
        "id": "act-024-2",
        "cliente_id": "c0240000-0000-4000-8000-000000000024",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-07-05T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0250000-0000-4000-8000-000000000025",
    "codigo": "CLI-025",
    "razon_social": "Asociación La Nacional de Ahorros y Préstamos",
    "nombre_comercial": "La Nacional",
    "identificacion_fiscal": "1-31-25425-2",
    "sector": "Finanzas",
    "estado": "en_negociacion",
    "prioridad": "media",
    "sitio_web": "https://www.alnap.com.do",
    "telefono": "+1 (829) 375-2075",
    "email": "info@alnap.com.do",
    "direccion": "Av. Estrella Sadhalá No. 85, Sector Naco",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 11880000,
    "responsable": "Camila Morales",
    "ultimo_contacto": "2026-10-05T18:00:00.000Z",
    "creado_en": "2026-07-02T18:00:00.000Z",
    "actualizado_en": "2026-09-30T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-025-1",
        "cliente_id": "c0250000-0000-4000-8000-000000000025",
        "nombre": "Marisol Cabrera García",
        "cargo": "Vicepresidente de Finanzas & Tesorería",
        "email": "marisol.cabrera@alnap.com.do",
        "telefono": "+1 (849) 388-2106",
        "es_principal": true,
        "creado_en": "2026-07-02T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-025-1",
        "cliente_id": "c0250000-0000-4000-8000-000000000025",
        "titulo": "Implementación y Licenciamiento Empresarial Cloud 2026",
        "monto": 11880000,
        "etapa": "negociacion",
        "probabilidad": 75,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-07-02T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-025-1",
        "cliente_id": "c0250000-0000-4000-8000-000000000025",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Marisol Cabrera García.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-10-05T18:00:00.000Z"
      },
      {
        "id": "act-025-2",
        "cliente_id": "c0250000-0000-4000-8000-000000000025",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-07-02T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0260000-0000-4000-8000-000000000026",
    "codigo": "CLI-026",
    "razon_social": "Fiduciaria BHD S.A.",
    "nombre_comercial": "Fiduciaria BHD",
    "identificacion_fiscal": "1-01-26042-5",
    "sector": "Finanzas",
    "estado": "activo",
    "prioridad": "baja",
    "sitio_web": "https://www.fiduciariabhd.com.do",
    "telefono": "+1 (849) 382-2118",
    "email": "info@fiduciariabhd.com.do",
    "direccion": "Av. Juan Pablo Duarte No. 88, Sector Bella Vista",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 12290000,
    "responsable": "Ignacio Silva",
    "ultimo_contacto": "2026-10-03T18:00:00.000Z",
    "creado_en": "2026-06-29T18:00:00.000Z",
    "actualizado_en": "2026-09-28T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-026-1",
        "cliente_id": "c0260000-0000-4000-8000-000000000026",
        "nombre": "Javier Rosario Mejía",
        "cargo": "Director de Tecnología & Transformación Digital",
        "email": "javier.rosario@fiduciariabhd.com.do",
        "telefono": "+1 (809) 395-2149",
        "es_principal": true,
        "creado_en": "2026-06-29T18:00:00.000Z"
      },
      {
        "id": "cnt-026-2",
        "cliente_id": "c0260000-0000-4000-8000-000000000026",
        "nombre": "Valeria Troncoso Valdez",
        "cargo": "Analista Financiero Principal",
        "email": "valeria.troncoso@fiduciariabhd.com.do",
        "telefono": "+1 (829) 408-2180",
        "es_principal": false,
        "creado_en": "2026-06-29T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-026-1",
        "cliente_id": "c0260000-0000-4000-8000-000000000026",
        "titulo": "Contrato Marco de Suministro B2B Anual",
        "monto": 12290000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-06-29T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-026-1",
        "cliente_id": "c0260000-0000-4000-8000-000000000026",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Javier Rosario Mejía.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-10-03T18:00:00.000Z"
      },
      {
        "id": "act-026-2",
        "cliente_id": "c0260000-0000-4000-8000-000000000026",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-06-29T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0270000-0000-4000-8000-000000000027",
    "codigo": "CLI-027",
    "razon_social": "DP World Caucedo S.A.",
    "nombre_comercial": "DP World Caucedo",
    "identificacion_fiscal": "1-31-26659-8",
    "sector": "Logística",
    "estado": "activo",
    "prioridad": "alta",
    "sitio_web": "https://www.dpworldcaucedo.com.do",
    "telefono": "+1 (809) 389-2161",
    "email": "info@dpworldcaucedo.com.do",
    "direccion": "Av. Winston Churchill No. 91, Sector Evaristo Morales",
    "ciudad": "Boca Chica",
    "pais": "República Dominicana",
    "valor_estimado": 12710000,
    "responsable": "Felipe Guzmán",
    "ultimo_contacto": "2026-10-01T18:00:00.000Z",
    "creado_en": "2026-06-26T18:00:00.000Z",
    "actualizado_en": "2026-09-26T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-027-1",
        "cliente_id": "c0270000-0000-4000-8000-000000000027",
        "nombre": "Gabriela Pichardo Peña",
        "cargo": "Gerente General de Compras & Cadena de Suministro",
        "email": "gabriela.pichardo@dpworldcaucedo.com.do",
        "telefono": "+1 (829) 402-2192",
        "es_principal": true,
        "creado_en": "2026-06-26T18:00:00.000Z"
      },
      {
        "id": "cnt-027-2",
        "cliente_id": "c0270000-0000-4000-8000-000000000027",
        "nombre": "Guillermo Santana Vargas",
        "cargo": "Gerente de Seguridad Industrial y Calidad",
        "email": "guillermo.santana@dpworldcaucedo.com.do",
        "telefono": "+1 (849) 415-2223",
        "es_principal": false,
        "creado_en": "2026-06-26T18:00:00.000Z"
      },
      {
        "id": "cnt-027-3",
        "cliente_id": "c0270000-0000-4000-8000-000000000027",
        "nombre": "Raquel Martínez Morales",
        "cargo": "Gerente de Cuentas por Pagar & Contabilidad",
        "email": "raquel.martínez@dpworldcaucedo.com.do",
        "telefono": "+1 (809) 428-2254",
        "es_principal": false,
        "creado_en": "2026-06-26T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-027-1",
        "cliente_id": "c0270000-0000-4000-8000-000000000027",
        "titulo": "Renovación de Infraestructura y Soporte Crítico 24/7",
        "monto": 12710000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-06-26T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-027-1",
        "cliente_id": "c0270000-0000-4000-8000-000000000027",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Gabriela Pichardo Peña.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-10-01T18:00:00.000Z"
      },
      {
        "id": "act-027-2",
        "cliente_id": "c0270000-0000-4000-8000-000000000027",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-06-26T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0280000-0000-4000-8000-000000000028",
    "codigo": "CLI-028",
    "razon_social": "Marítima Dominicana S.A.S.",
    "nombre_comercial": "MarDom Logística",
    "identificacion_fiscal": "1-01-27276-2",
    "sector": "Logística",
    "estado": "prospecto",
    "prioridad": "media",
    "sitio_web": "https://www.mardom.com.do",
    "telefono": "+1 (829) 396-2204",
    "email": "info@mardom.com.do",
    "direccion": "Av. Abraham Lincoln No. 94, Sector La Julia",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 13120000,
    "responsable": "Laura Peña",
    "ultimo_contacto": "2026-09-29T18:00:00.000Z",
    "creado_en": "2026-06-23T18:00:00.000Z",
    "actualizado_en": "2026-09-24T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-028-1",
        "cliente_id": "c0280000-0000-4000-8000-000000000028",
        "nombre": "Carlos Corominas Rosario",
        "cargo": "Vicepresidente Ejecutivo de Administración",
        "email": "carlos.corominas@mardom.com.do",
        "telefono": "+1 (849) 409-2235",
        "es_principal": true,
        "creado_en": "2026-06-23T18:00:00.000Z"
      },
      {
        "id": "cnt-028-2",
        "cliente_id": "c0280000-0000-4000-8000-000000000028",
        "nombre": "Sofía Pérez Bisonó",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "sofía.pérez@mardom.com.do",
        "telefono": "+1 (809) 422-2266",
        "es_principal": false,
        "creado_en": "2026-06-23T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-028-1",
        "cliente_id": "c0280000-0000-4000-8000-000000000028",
        "titulo": "Proyecto de Optimización Operativa y Automatización",
        "monto": 13120000,
        "etapa": "calificacion",
        "probabilidad": 30,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-06-23T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-028-1",
        "cliente_id": "c0280000-0000-4000-8000-000000000028",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Carlos Corominas Rosario.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-09-29T18:00:00.000Z"
      },
      {
        "id": "act-028-2",
        "cliente_id": "c0280000-0000-4000-8000-000000000028",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-06-23T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0290000-0000-4000-8000-000000000029",
    "codigo": "CLI-029",
    "razon_social": "HIT Puerto Río Haina S.A.",
    "nombre_comercial": "Puerto Río Haina",
    "identificacion_fiscal": "1-31-27893-5",
    "sector": "Logística",
    "estado": "cerrado_perdido",
    "prioridad": "baja",
    "sitio_web": "https://www.puertorhi.com.do",
    "telefono": "+1 (849) 403-2247",
    "email": "info@puertorhi.com.do",
    "direccion": "Av. 27 de Febrero No. 97, Sector Los Jardines",
    "ciudad": "Haina",
    "pais": "República Dominicana",
    "valor_estimado": 13540000,
    "responsable": "Roberto Méndez",
    "ultimo_contacto": "2026-09-27T18:00:00.000Z",
    "creado_en": "2026-06-20T18:00:00.000Z",
    "actualizado_en": "2026-09-22T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-029-1",
        "cliente_id": "c0290000-0000-4000-8000-000000000029",
        "nombre": "Teresa Fernández Santana",
        "cargo": "Director de Recursos Humanos & Talento",
        "email": "teresa.fernández@puertorhi.com.do",
        "telefono": "+1 (809) 416-2278",
        "es_principal": true,
        "creado_en": "2026-06-20T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-029-1",
        "cliente_id": "c0290000-0000-4000-8000-000000000029",
        "titulo": "Consultoría Estratégica y Plataforma Integral",
        "monto": 13540000,
        "etapa": "perdida",
        "probabilidad": 0,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-06-20T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-029-1",
        "cliente_id": "c0290000-0000-4000-8000-000000000029",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Teresa Fernández Santana.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-09-27T18:00:00.000Z"
      },
      {
        "id": "act-029-2",
        "cliente_id": "c0290000-0000-4000-8000-000000000029",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-06-20T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0300000-0000-4000-8000-000000000030",
    "codigo": "CLI-030",
    "razon_social": "Caribex Dominicana Logística S.R.L.",
    "nombre_comercial": "Caribex Cargo",
    "identificacion_fiscal": "1-01-28510-8",
    "sector": "Logística",
    "estado": "activo",
    "prioridad": "alta",
    "sitio_web": "https://www.caribex.com.do",
    "telefono": "+1 (809) 410-2290",
    "email": "info@caribex.com.do",
    "direccion": "Av. John F. Kennedy No. 100, Sector Villa Olga",
    "ciudad": "Santiago",
    "pais": "República Dominicana",
    "valor_estimado": 13950000,
    "responsable": "Valentina Castillo",
    "ultimo_contacto": "2026-09-25T18:00:00.000Z",
    "creado_en": "2026-06-17T18:00:00.000Z",
    "actualizado_en": "2026-10-05T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-030-1",
        "cliente_id": "c0300000-0000-4000-8000-000000000030",
        "nombre": "José Luis García Báez",
        "cargo": "Gerente de Infraestructura & Operaciones TI",
        "email": "joséluis.garcía@caribex.com.do",
        "telefono": "+1 (829) 423-2321",
        "es_principal": true,
        "creado_en": "2026-06-17T18:00:00.000Z"
      },
      {
        "id": "cnt-030-2",
        "cliente_id": "c0300000-0000-4000-8000-000000000030",
        "nombre": "Natalia Castillo Taveras",
        "cargo": "Analista Financiero Principal",
        "email": "natalia.castillo@caribex.com.do",
        "telefono": "+1 (849) 436-2352",
        "es_principal": false,
        "creado_en": "2026-06-17T18:00:00.000Z"
      },
      {
        "id": "cnt-030-3",
        "cliente_id": "c0300000-0000-4000-8000-000000000030",
        "nombre": "Mario Valdez Reyes",
        "cargo": "Asesor Legal Corporativo",
        "email": "mario.valdez@caribex.com.do",
        "telefono": "+1 (809) 449-2383",
        "es_principal": false,
        "creado_en": "2026-06-17T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-030-1",
        "cliente_id": "c0300000-0000-4000-8000-000000000030",
        "titulo": "Implementación y Licenciamiento Empresarial Cloud 2026",
        "monto": 13950000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-06-17T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-030-1",
        "cliente_id": "c0300000-0000-4000-8000-000000000030",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con José Luis García Báez.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-09-25T18:00:00.000Z"
      },
      {
        "id": "act-030-2",
        "cliente_id": "c0300000-0000-4000-8000-000000000030",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-06-17T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0310000-0000-4000-8000-000000000031",
    "codigo": "CLI-031",
    "razon_social": "Aeropuertos Dominicanos Siglo XXI S.A.",
    "nombre_comercial": "AERODOM",
    "identificacion_fiscal": "1-31-29127-2",
    "sector": "Logística",
    "estado": "en_negociacion",
    "prioridad": "media",
    "sitio_web": "https://www.aerodom.com.do",
    "telefono": "+1 (829) 417-2333",
    "email": "info@aerodom.com.do",
    "direccion": "Av. Lope de Vega No. 103, Sector Cerros de Gurabo",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 14370000,
    "responsable": "Marcos Almonte",
    "ultimo_contacto": "2026-09-23T18:00:00.000Z",
    "creado_en": "2026-06-14T18:00:00.000Z",
    "actualizado_en": "2026-10-03T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-031-1",
        "cliente_id": "c0310000-0000-4000-8000-000000000031",
        "nombre": "Lucía Rodríguez De la Cruz",
        "cargo": "Director Comercial y Alianzas Corporativas",
        "email": "lucía.rodríguez@aerodom.com.do",
        "telefono": "+1 (849) 430-2364",
        "es_principal": true,
        "creado_en": "2026-06-14T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-031-1",
        "cliente_id": "c0310000-0000-4000-8000-000000000031",
        "titulo": "Contrato Marco de Suministro B2B Anual",
        "monto": 14370000,
        "etapa": "negociacion",
        "probabilidad": 75,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-06-14T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-031-1",
        "cliente_id": "c0310000-0000-4000-8000-000000000031",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Lucía Rodríguez De la Cruz.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-09-23T18:00:00.000Z"
      },
      {
        "id": "act-031-2",
        "cliente_id": "c0310000-0000-4000-8000-000000000031",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-06-14T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0320000-0000-4000-8000-000000000032",
    "codigo": "CLI-032",
    "razon_social": "Frederic Schad S.A.S.",
    "nombre_comercial": "Schad Logística",
    "identificacion_fiscal": "1-01-29744-5",
    "sector": "Logística",
    "estado": "prospecto",
    "prioridad": "baja",
    "sitio_web": "https://www.schadlogistica.com.do",
    "telefono": "+1 (849) 424-2376",
    "email": "info@schadlogistica.com.do",
    "direccion": "Av. Tiradentes No. 106, Sector Piantini",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 14780000,
    "responsable": "Daniela Rosario",
    "ultimo_contacto": "2026-09-21T18:00:00.000Z",
    "creado_en": "2026-06-11T18:00:00.000Z",
    "actualizado_en": "2026-10-01T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-032-1",
        "cliente_id": "c0320000-0000-4000-8000-000000000032",
        "nombre": "Víctor Martínez Morales",
        "cargo": "Director General de Operaciones",
        "email": "víctor.martínez@schadlogistica.com.do",
        "telefono": "+1 (809) 437-2407",
        "es_principal": true,
        "creado_en": "2026-06-11T18:00:00.000Z"
      },
      {
        "id": "cnt-032-2",
        "cliente_id": "c0320000-0000-4000-8000-000000000032",
        "nombre": "Andrea Taveras Pichardo",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "andrea.taveras@schadlogistica.com.do",
        "telefono": "+1 (829) 450-2438",
        "es_principal": false,
        "creado_en": "2026-06-11T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-032-1",
        "cliente_id": "c0320000-0000-4000-8000-000000000032",
        "titulo": "Renovación de Infraestructura y Soporte Crítico 24/7",
        "monto": 14780000,
        "etapa": "calificacion",
        "probabilidad": 30,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-06-11T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-032-1",
        "cliente_id": "c0320000-0000-4000-8000-000000000032",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Víctor Martínez Morales.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-09-21T18:00:00.000Z"
      },
      {
        "id": "act-032-2",
        "cliente_id": "c0320000-0000-4000-8000-000000000032",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-06-11T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0330000-0000-4000-8000-000000000033",
    "codigo": "CLI-033",
    "razon_social": "Antillean Marine Dominican Republic S.A.",
    "nombre_comercial": "Antillean Marine RD",
    "identificacion_fiscal": "1-31-30361-8",
    "sector": "Logística",
    "estado": "inactivo",
    "prioridad": "alta",
    "sitio_web": "https://www.antillean.do",
    "telefono": "+1 (809) 431-2419",
    "email": "info@antillean.do",
    "direccion": "Av. Sarasota No. 109, Sector Naco",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 15200000,
    "responsable": "Camila Morales",
    "ultimo_contacto": "2026-09-19T18:00:00.000Z",
    "creado_en": "2026-06-08T18:00:00.000Z",
    "actualizado_en": "2026-09-29T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-033-1",
        "cliente_id": "c0330000-0000-4000-8000-000000000033",
        "nombre": "Daniela Báez Fernández",
        "cargo": "Vicepresidente de Finanzas & Tesorería",
        "email": "daniela.báez@antillean.do",
        "telefono": "+1 (829) 444-2450",
        "es_principal": true,
        "creado_en": "2026-06-08T18:00:00.000Z"
      },
      {
        "id": "cnt-033-2",
        "cliente_id": "c0330000-0000-4000-8000-000000000033",
        "nombre": "Manuel Almonte Pérez",
        "cargo": "Coordinador de Logística y Despacho",
        "email": "manuel.almonte@antillean.do",
        "telefono": "+1 (849) 457-2481",
        "es_principal": false,
        "creado_en": "2026-06-08T18:00:00.000Z"
      },
      {
        "id": "cnt-033-3",
        "cliente_id": "c0330000-0000-4000-8000-000000000033",
        "nombre": "Teresa Sánchez Martínez",
        "cargo": "Especialista Senior de Compras Estratégicas",
        "email": "teresa.sánchez@antillean.do",
        "telefono": "+1 (809) 470-2512",
        "es_principal": false,
        "creado_en": "2026-06-08T18:00:00.000Z"
      }
    ],
    "oportunidades": [],
    "actividades": [
      {
        "id": "act-033-1",
        "cliente_id": "c0330000-0000-4000-8000-000000000033",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Daniela Báez Fernández.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-09-19T18:00:00.000Z"
      },
      {
        "id": "act-033-2",
        "cliente_id": "c0330000-0000-4000-8000-000000000033",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-06-08T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0340000-0000-4000-8000-000000000034",
    "codigo": "CLI-034",
    "razon_social": "Trans-Caribe Express S.R.L.",
    "nombre_comercial": "Trans-Caribe",
    "identificacion_fiscal": "1-01-30978-2",
    "sector": "Logística",
    "estado": "activo",
    "prioridad": "media",
    "sitio_web": "https://www.transcaribe.com.do",
    "telefono": "+1 (829) 438-2462",
    "email": "info@transcaribe.com.do",
    "direccion": "Av. Estrella Sadhalá No. 112, Sector Bella Vista",
    "ciudad": "San Cristóbal",
    "pais": "República Dominicana",
    "valor_estimado": 15610000,
    "responsable": "Ignacio Silva",
    "ultimo_contacto": "2026-09-17T18:00:00.000Z",
    "creado_en": "2026-06-05T18:00:00.000Z",
    "actualizado_en": "2026-09-27T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-034-1",
        "cliente_id": "c0340000-0000-4000-8000-000000000034",
        "nombre": "Pedro Guzmán Castillo",
        "cargo": "Director de Tecnología & Transformación Digital",
        "email": "pedro.guzmán@transcaribe.com.do",
        "telefono": "+1 (849) 451-2493",
        "es_principal": true,
        "creado_en": "2026-06-05T18:00:00.000Z"
      },
      {
        "id": "cnt-034-2",
        "cliente_id": "c0340000-0000-4000-8000-000000000034",
        "nombre": "Paola De la Cruz Guzmán",
        "cargo": "Analista Financiero Principal",
        "email": "paola.de la cruz@transcaribe.com.do",
        "telefono": "+1 (809) 464-2524",
        "es_principal": false,
        "creado_en": "2026-06-05T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-034-1",
        "cliente_id": "c0340000-0000-4000-8000-000000000034",
        "titulo": "Consultoría Estratégica y Plataforma Integral",
        "monto": 15610000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-06-05T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-034-1",
        "cliente_id": "c0340000-0000-4000-8000-000000000034",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Pedro Guzmán Castillo.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-09-17T18:00:00.000Z"
      },
      {
        "id": "act-034-2",
        "cliente_id": "c0340000-0000-4000-8000-000000000034",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-06-05T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0350000-0000-4000-8000-000000000035",
    "codigo": "CLI-035",
    "razon_social": "Logística y Aduanas del Cibao S.A.",
    "nombre_comercial": "LogiCibao",
    "identificacion_fiscal": "1-31-31595-5",
    "sector": "Logística",
    "estado": "en_negociacion",
    "prioridad": "baja",
    "sitio_web": "https://www.logicibao.com.do",
    "telefono": "+1 (849) 445-2505",
    "email": "info@logicibao.com.do",
    "direccion": "Av. Juan Pablo Duarte No. 115, Sector Evaristo Morales",
    "ciudad": "Santiago",
    "pais": "República Dominicana",
    "valor_estimado": 16030000,
    "responsable": "Felipe Guzmán",
    "ultimo_contacto": "2026-09-15T18:00:00.000Z",
    "creado_en": "2026-06-02T18:00:00.000Z",
    "actualizado_en": "2026-09-25T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-035-1",
        "cliente_id": "c0350000-0000-4000-8000-000000000035",
        "nombre": "Elena Valdez Reyes",
        "cargo": "Gerente General de Compras & Cadena de Suministro",
        "email": "elena.valdez@logicibao.com.do",
        "telefono": "+1 (809) 458-2536",
        "es_principal": true,
        "creado_en": "2026-06-02T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-035-1",
        "cliente_id": "c0350000-0000-4000-8000-000000000035",
        "titulo": "Implementación y Licenciamiento Empresarial Cloud 2026",
        "monto": 16030000,
        "etapa": "negociacion",
        "probabilidad": 75,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-06-02T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-035-1",
        "cliente_id": "c0350000-0000-4000-8000-000000000035",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Elena Valdez Reyes.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-09-15T18:00:00.000Z"
      },
      {
        "id": "act-035-2",
        "cliente_id": "c0350000-0000-4000-8000-000000000035",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-06-02T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0360000-0000-4000-8000-000000000036",
    "codigo": "CLI-036",
    "razon_social": "Hub Logístico Caucedo S.A.S.",
    "nombre_comercial": "Caucedo Logistics Hub",
    "identificacion_fiscal": "1-01-32212-8",
    "sector": "Logística",
    "estado": "activo",
    "prioridad": "alta",
    "sitio_web": "https://www.caucedohub.com.do",
    "telefono": "+1 (809) 452-2548",
    "email": "info@caucedohub.com.do",
    "direccion": "Av. Winston Churchill No. 118, Sector La Julia",
    "ciudad": "Boca Chica",
    "pais": "República Dominicana",
    "valor_estimado": 16440000,
    "responsable": "Laura Peña",
    "ultimo_contacto": "2026-09-13T18:00:00.000Z",
    "creado_en": "2026-05-30T18:00:00.000Z",
    "actualizado_en": "2026-09-23T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-036-1",
        "cliente_id": "c0360000-0000-4000-8000-000000000036",
        "nombre": "Héctor Reyes Cabrera",
        "cargo": "Vicepresidente Ejecutivo de Administración",
        "email": "héctor.reyes@caucedohub.com.do",
        "telefono": "+1 (829) 465-2579",
        "es_principal": true,
        "creado_en": "2026-05-30T18:00:00.000Z"
      },
      {
        "id": "cnt-036-2",
        "cliente_id": "c0360000-0000-4000-8000-000000000036",
        "nombre": "Patricia Vargas Estrella",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "patricia.vargas@caucedohub.com.do",
        "telefono": "+1 (849) 478-2610",
        "es_principal": false,
        "creado_en": "2026-05-30T18:00:00.000Z"
      },
      {
        "id": "cnt-036-3",
        "cliente_id": "c0360000-0000-4000-8000-000000000036",
        "nombre": "Alberto Estrella Corominas",
        "cargo": "Líder de Proyectos de TI e Innovación",
        "email": "alberto.estrella@caucedohub.com.do",
        "telefono": "+1 (809) 491-2641",
        "es_principal": false,
        "creado_en": "2026-05-30T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-036-1",
        "cliente_id": "c0360000-0000-4000-8000-000000000036",
        "titulo": "Contrato Marco de Suministro B2B Anual",
        "monto": 16440000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-05-30T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-036-1",
        "cliente_id": "c0360000-0000-4000-8000-000000000036",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Héctor Reyes Cabrera.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-09-13T18:00:00.000Z"
      },
      {
        "id": "act-036-2",
        "cliente_id": "c0360000-0000-4000-8000-000000000036",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-05-30T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0370000-0000-4000-8000-000000000037",
    "codigo": "CLI-037",
    "razon_social": "AeroCargas del Caribe S.R.L.",
    "nombre_comercial": "AeroCargas RD",
    "identificacion_fiscal": "1-31-32829-2",
    "sector": "Logística",
    "estado": "activo",
    "prioridad": "media",
    "sitio_web": "https://www.aerocargas.com.do",
    "telefono": "+1 (829) 459-2591",
    "email": "info@aerocargas.com.do",
    "direccion": "Av. Abraham Lincoln No. 121, Sector Los Jardines",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 16860000,
    "responsable": "Roberto Méndez",
    "ultimo_contacto": "2026-09-11T18:00:00.000Z",
    "creado_en": "2026-05-27T18:00:00.000Z",
    "actualizado_en": "2026-09-21T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-037-1",
        "cliente_id": "c0370000-0000-4000-8000-000000000037",
        "nombre": "Carolina Peña Troncoso",
        "cargo": "Director de Recursos Humanos & Talento",
        "email": "carolina.peña@aerocargas.com.do",
        "telefono": "+1 (849) 472-2622",
        "es_principal": true,
        "creado_en": "2026-05-27T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-037-1",
        "cliente_id": "c0370000-0000-4000-8000-000000000037",
        "titulo": "Renovación de Infraestructura y Soporte Crítico 24/7",
        "monto": 16860000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-05-27T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-037-1",
        "cliente_id": "c0370000-0000-4000-8000-000000000037",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Carolina Peña Troncoso.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-09-11T18:00:00.000Z"
      },
      {
        "id": "act-037-2",
        "cliente_id": "c0370000-0000-4000-8000-000000000037",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-05-27T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0380000-0000-4000-8000-000000000038",
    "codigo": "CLI-038",
    "razon_social": "Flotas & Envíos Nacionales S.A.",
    "nombre_comercial": "Envíos Nacionales",
    "identificacion_fiscal": "1-01-33446-5",
    "sector": "Logística",
    "estado": "prospecto",
    "prioridad": "baja",
    "sitio_web": "https://www.enviosnacionales.do",
    "telefono": "+1 (849) 466-2634",
    "email": "info@enviosnacionales.do",
    "direccion": "Av. 27 de Febrero No. 124, Sector Villa Olga",
    "ciudad": "La Vega",
    "pais": "República Dominicana",
    "valor_estimado": 17270000,
    "responsable": "Valentina Castillo",
    "ultimo_contacto": "2026-10-04T18:00:00.000Z",
    "creado_en": "2026-05-24T18:00:00.000Z",
    "actualizado_en": "2026-10-04T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-038-1",
        "cliente_id": "c0380000-0000-4000-8000-000000000038",
        "nombre": "Fernando Sánchez Martínez",
        "cargo": "Gerente de Infraestructura & Operaciones TI",
        "email": "fernando.sánchez@enviosnacionales.do",
        "telefono": "+1 (809) 479-2665",
        "es_principal": true,
        "creado_en": "2026-05-24T18:00:00.000Z"
      },
      {
        "id": "cnt-038-2",
        "cliente_id": "c0380000-0000-4000-8000-000000000038",
        "nombre": "Rosa María Rosario Mejía",
        "cargo": "Analista Financiero Principal",
        "email": "rosamaría.rosario@enviosnacionales.do",
        "telefono": "+1 (829) 492-2696",
        "es_principal": false,
        "creado_en": "2026-05-24T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-038-1",
        "cliente_id": "c0380000-0000-4000-8000-000000000038",
        "titulo": "Proyecto de Optimización Operativa y Automatización",
        "monto": 17270000,
        "etapa": "calificacion",
        "probabilidad": 30,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-05-24T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-038-1",
        "cliente_id": "c0380000-0000-4000-8000-000000000038",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Fernando Sánchez Martínez.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-10-04T18:00:00.000Z"
      },
      {
        "id": "act-038-2",
        "cliente_id": "c0380000-0000-4000-8000-000000000038",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-05-24T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0390000-0000-4000-8000-000000000039",
    "codigo": "CLI-039",
    "razon_social": "Almacenes Fiscales Dominicanos S.A.",
    "nombre_comercial": "Almacenes Fiscales RD",
    "identificacion_fiscal": "1-31-34063-8",
    "sector": "Logística",
    "estado": "activo",
    "prioridad": "alta",
    "sitio_web": "https://www.almacenesfiscales.do",
    "telefono": "+1 (809) 473-2677",
    "email": "info@almacenesfiscales.do",
    "direccion": "Av. John F. Kennedy No. 127, Sector Cerros de Gurabo",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 17690000,
    "responsable": "Marcos Almonte",
    "ultimo_contacto": "2026-10-02T18:00:00.000Z",
    "creado_en": "2026-05-21T18:00:00.000Z",
    "actualizado_en": "2026-10-02T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-039-1",
        "cliente_id": "c0390000-0000-4000-8000-000000000039",
        "nombre": "Carmen Jiménez Almonte",
        "cargo": "Director Comercial y Alianzas Corporativas",
        "email": "carmen.jiménez@almacenesfiscales.do",
        "telefono": "+1 (829) 486-2708",
        "es_principal": true,
        "creado_en": "2026-05-21T18:00:00.000Z"
      },
      {
        "id": "cnt-039-2",
        "cliente_id": "c0390000-0000-4000-8000-000000000039",
        "nombre": "Rubén Pichardo Peña",
        "cargo": "Gerente de Seguridad Industrial y Calidad",
        "email": "rubén.pichardo@almacenesfiscales.do",
        "telefono": "+1 (849) 499-2739",
        "es_principal": false,
        "creado_en": "2026-05-21T18:00:00.000Z"
      },
      {
        "id": "cnt-039-3",
        "cliente_id": "c0390000-0000-4000-8000-000000000039",
        "nombre": "Elena Santana Vargas",
        "cargo": "Gerente de Cuentas por Pagar & Contabilidad",
        "email": "elena.santana@almacenesfiscales.do",
        "telefono": "+1 (809) 512-2770",
        "es_principal": false,
        "creado_en": "2026-05-21T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-039-1",
        "cliente_id": "c0390000-0000-4000-8000-000000000039",
        "titulo": "Consultoría Estratégica y Plataforma Integral",
        "monto": 17690000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-05-21T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-039-1",
        "cliente_id": "c0390000-0000-4000-8000-000000000039",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Carmen Jiménez Almonte.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-10-02T18:00:00.000Z"
      },
      {
        "id": "act-039-2",
        "cliente_id": "c0390000-0000-4000-8000-000000000039",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-05-21T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0400000-0000-4000-8000-000000000040",
    "codigo": "CLI-040",
    "razon_social": "Grupo Puntacana S.A.",
    "nombre_comercial": "Puntacana Resort & Club",
    "identificacion_fiscal": "1-01-34680-2",
    "sector": "Turismo",
    "estado": "activo",
    "prioridad": "media",
    "sitio_web": "https://www.puntacana.com.do",
    "telefono": "+1 (829) 480-2720",
    "email": "info@puntacana.com.do",
    "direccion": "Av. Lope de Vega No. 130, Sector Piantini",
    "ciudad": "Punta Cana",
    "pais": "República Dominicana",
    "valor_estimado": 18100000,
    "responsable": "Daniela Rosario",
    "ultimo_contacto": "2026-09-30T18:00:00.000Z",
    "creado_en": "2026-05-18T18:00:00.000Z",
    "actualizado_en": "2026-09-30T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-040-1",
        "cliente_id": "c0400000-0000-4000-8000-000000000040",
        "nombre": "Javier Morales Jiménez",
        "cargo": "Director General de Operaciones",
        "email": "javier.morales@puntacana.com.do",
        "telefono": "+1 (849) 493-2751",
        "es_principal": true,
        "creado_en": "2026-05-18T18:00:00.000Z"
      },
      {
        "id": "cnt-040-2",
        "cliente_id": "c0400000-0000-4000-8000-000000000040",
        "nombre": "Claudia Corominas Rosario",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "claudia.corominas@puntacana.com.do",
        "telefono": "+1 (809) 506-2782",
        "es_principal": false,
        "creado_en": "2026-05-18T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-040-1",
        "cliente_id": "c0400000-0000-4000-8000-000000000040",
        "titulo": "Implementación y Licenciamiento Empresarial Cloud 2026",
        "monto": 18100000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-05-18T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-040-1",
        "cliente_id": "c0400000-0000-4000-8000-000000000040",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Javier Morales Jiménez.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-09-30T18:00:00.000Z"
      },
      {
        "id": "act-040-2",
        "cliente_id": "c0400000-0000-4000-8000-000000000040",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-05-18T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0410000-0000-4000-8000-000000000041",
    "codigo": "CLI-041",
    "razon_social": "Meliá Hotels International Caribe S.A.",
    "nombre_comercial": "Meliá Caribe Resorts",
    "identificacion_fiscal": "1-31-35297-5",
    "sector": "Turismo",
    "estado": "en_negociacion",
    "prioridad": "baja",
    "sitio_web": "https://www.melia.com.do",
    "telefono": "+1 (849) 487-2763",
    "email": "info@melia.com.do",
    "direccion": "Av. Tiradentes No. 133, Sector Naco",
    "ciudad": "Punta Cana",
    "pais": "República Dominicana",
    "valor_estimado": 18520000,
    "responsable": "Camila Morales",
    "ultimo_contacto": "2026-09-28T18:00:00.000Z",
    "creado_en": "2026-05-15T18:00:00.000Z",
    "actualizado_en": "2026-09-28T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-041-1",
        "cliente_id": "c0410000-0000-4000-8000-000000000041",
        "nombre": "Silvia Estrella Corominas",
        "cargo": "Vicepresidente de Finanzas & Tesorería",
        "email": "silvia.estrella@melia.com.do",
        "telefono": "+1 (809) 500-2794",
        "es_principal": true,
        "creado_en": "2026-05-15T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-041-1",
        "cliente_id": "c0410000-0000-4000-8000-000000000041",
        "titulo": "Contrato Marco de Suministro B2B Anual",
        "monto": 18520000,
        "etapa": "negociacion",
        "probabilidad": 75,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-05-15T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-041-1",
        "cliente_id": "c0410000-0000-4000-8000-000000000041",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Silvia Estrella Corominas.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-09-28T18:00:00.000Z"
      },
      {
        "id": "act-041-2",
        "cliente_id": "c0410000-0000-4000-8000-000000000041",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-05-15T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0420000-0000-4000-8000-000000000042",
    "codigo": "CLI-042",
    "razon_social": "Viva Wyndham Resorts S.A.",
    "nombre_comercial": "Viva Wyndham Resorts",
    "identificacion_fiscal": "1-01-35914-8",
    "sector": "Turismo",
    "estado": "prospecto",
    "prioridad": "alta",
    "sitio_web": "https://www.vivaresorts.com.do",
    "telefono": "+1 (809) 494-2806",
    "email": "info@vivaresorts.com.do",
    "direccion": "Av. Sarasota No. 136, Sector Bella Vista",
    "ciudad": "La Romana",
    "pais": "República Dominicana",
    "valor_estimado": 18930000,
    "responsable": "Ignacio Silva",
    "ultimo_contacto": "2026-09-26T18:00:00.000Z",
    "creado_en": "2026-05-12T18:00:00.000Z",
    "actualizado_en": "2026-09-26T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-042-1",
        "cliente_id": "c0420000-0000-4000-8000-000000000042",
        "nombre": "Carlos Bisonó Hernández",
        "cargo": "Director de Tecnología & Transformación Digital",
        "email": "carlos.bisonó@vivaresorts.com.do",
        "telefono": "+1 (829) 507-2837",
        "es_principal": true,
        "creado_en": "2026-05-12T18:00:00.000Z"
      },
      {
        "id": "cnt-042-2",
        "cliente_id": "c0420000-0000-4000-8000-000000000042",
        "nombre": "Verónica García Báez",
        "cargo": "Analista Financiero Principal",
        "email": "verónica.garcía@vivaresorts.com.do",
        "telefono": "+1 (849) 520-2868",
        "es_principal": false,
        "creado_en": "2026-05-12T18:00:00.000Z"
      },
      {
        "id": "cnt-042-3",
        "cliente_id": "c0420000-0000-4000-8000-000000000042",
        "nombre": "Miguel Ángel Castillo Taveras",
        "cargo": "Asesor Legal Corporativo",
        "email": "miguelángel.castillo@vivaresorts.com.do",
        "telefono": "+1 (809) 533-2899",
        "es_principal": false,
        "creado_en": "2026-05-12T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-042-1",
        "cliente_id": "c0420000-0000-4000-8000-000000000042",
        "titulo": "Renovación de Infraestructura y Soporte Crítico 24/7",
        "monto": 18930000,
        "etapa": "calificacion",
        "probabilidad": 30,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-05-12T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-042-1",
        "cliente_id": "c0420000-0000-4000-8000-000000000042",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Carlos Bisonó Hernández.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-09-26T18:00:00.000Z"
      },
      {
        "id": "act-042-2",
        "cliente_id": "c0420000-0000-4000-8000-000000000042",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-05-12T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0430000-0000-4000-8000-000000000043",
    "codigo": "CLI-043",
    "razon_social": "Central Romana Corporation Ltd. - División Hoteles",
    "nombre_comercial": "Casa de Campo Resort",
    "identificacion_fiscal": "1-31-36531-2",
    "sector": "Turismo",
    "estado": "activo",
    "prioridad": "media",
    "sitio_web": "https://www.casadecampo.com.do",
    "telefono": "+1 (829) 501-2849",
    "email": "info@casadecampo.com.do",
    "direccion": "Av. Estrella Sadhalá No. 139, Sector Evaristo Morales",
    "ciudad": "La Romana",
    "pais": "República Dominicana",
    "valor_estimado": 19350000,
    "responsable": "Felipe Guzmán",
    "ultimo_contacto": "2026-09-24T18:00:00.000Z",
    "creado_en": "2026-05-09T18:00:00.000Z",
    "actualizado_en": "2026-09-24T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-043-1",
        "cliente_id": "c0430000-0000-4000-8000-000000000043",
        "nombre": "Beatriz Troncoso Valdez",
        "cargo": "Gerente General de Compras & Cadena de Suministro",
        "email": "beatriz.troncoso@casadecampo.com.do",
        "telefono": "+1 (849) 514-2880",
        "es_principal": true,
        "creado_en": "2026-05-09T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-043-1",
        "cliente_id": "c0430000-0000-4000-8000-000000000043",
        "titulo": "Proyecto de Optimización Operativa y Automatización",
        "monto": 19350000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-05-09T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-043-1",
        "cliente_id": "c0430000-0000-4000-8000-000000000043",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Beatriz Troncoso Valdez.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-09-24T18:00:00.000Z"
      },
      {
        "id": "act-043-2",
        "cliente_id": "c0430000-0000-4000-8000-000000000043",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-05-09T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0440000-0000-4000-8000-000000000044",
    "codigo": "CLI-044",
    "razon_social": "Iberostar Hoteles Dominicana S.A.",
    "nombre_comercial": "Iberostar Resorts RD",
    "identificacion_fiscal": "1-01-37148-5",
    "sector": "Turismo",
    "estado": "activo",
    "prioridad": "baja",
    "sitio_web": "https://www.iberostar.com.do",
    "telefono": "+1 (849) 508-2892",
    "email": "info@iberostar.com.do",
    "direccion": "Av. Juan Pablo Duarte No. 142, Sector La Julia",
    "ciudad": "Bávaro",
    "pais": "República Dominicana",
    "valor_estimado": 19760000,
    "responsable": "Laura Peña",
    "ultimo_contacto": "2026-09-22T18:00:00.000Z",
    "creado_en": "2026-05-06T18:00:00.000Z",
    "actualizado_en": "2026-09-22T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-044-1",
        "cliente_id": "c0440000-0000-4000-8000-000000000044",
        "nombre": "José Luis Santana Vargas",
        "cargo": "Vicepresidente Ejecutivo de Administración",
        "email": "joséluis.santana@iberostar.com.do",
        "telefono": "+1 (809) 521-2923",
        "es_principal": true,
        "creado_en": "2026-05-06T18:00:00.000Z"
      },
      {
        "id": "cnt-044-2",
        "cliente_id": "c0440000-0000-4000-8000-000000000044",
        "nombre": "Mariela Martínez Morales",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "mariela.martínez@iberostar.com.do",
        "telefono": "+1 (829) 534-2954",
        "es_principal": false,
        "creado_en": "2026-05-06T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-044-1",
        "cliente_id": "c0440000-0000-4000-8000-000000000044",
        "titulo": "Consultoría Estratégica y Plataforma Integral",
        "monto": 19760000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-05-06T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-044-1",
        "cliente_id": "c0440000-0000-4000-8000-000000000044",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con José Luis Santana Vargas.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-09-22T18:00:00.000Z"
      },
      {
        "id": "act-044-2",
        "cliente_id": "c0440000-0000-4000-8000-000000000044",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-05-06T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0450000-0000-4000-8000-000000000045",
    "codigo": "CLI-045",
    "razon_social": "Barceló Bávaro Grand Resort S.A.",
    "nombre_comercial": "Barceló Bávaro",
    "identificacion_fiscal": "1-31-37765-8",
    "sector": "Turismo",
    "estado": "en_negociacion",
    "prioridad": "alta",
    "sitio_web": "https://www.barcelo.com.do",
    "telefono": "+1 (809) 515-2935",
    "email": "info@barcelo.com.do",
    "direccion": "Av. Winston Churchill No. 145, Sector Los Jardines",
    "ciudad": "Punta Cana",
    "pais": "República Dominicana",
    "valor_estimado": 20180000,
    "responsable": "Roberto Méndez",
    "ultimo_contacto": "2026-09-20T18:00:00.000Z",
    "creado_en": "2026-05-03T18:00:00.000Z",
    "actualizado_en": "2026-10-05T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-045-1",
        "cliente_id": "c0450000-0000-4000-8000-000000000045",
        "nombre": "Valeria Pérez Bisonó",
        "cargo": "Director de Recursos Humanos & Talento",
        "email": "valeria.pérez@barcelo.com.do",
        "telefono": "+1 (829) 528-2966",
        "es_principal": true,
        "creado_en": "2026-05-03T18:00:00.000Z"
      },
      {
        "id": "cnt-045-2",
        "cliente_id": "c0450000-0000-4000-8000-000000000045",
        "nombre": "Ramón Báez Fernández",
        "cargo": "Coordinador de Logística y Despacho",
        "email": "ramón.báez@barcelo.com.do",
        "telefono": "+1 (849) 541-2997",
        "es_principal": false,
        "creado_en": "2026-05-03T18:00:00.000Z"
      },
      {
        "id": "cnt-045-3",
        "cliente_id": "c0450000-0000-4000-8000-000000000045",
        "nombre": "Silvia Almonte Pérez",
        "cargo": "Especialista Senior de Compras Estratégicas",
        "email": "silvia.almonte@barcelo.com.do",
        "telefono": "+1 (809) 554-3028",
        "es_principal": false,
        "creado_en": "2026-05-03T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-045-1",
        "cliente_id": "c0450000-0000-4000-8000-000000000045",
        "titulo": "Implementación y Licenciamiento Empresarial Cloud 2026",
        "monto": 20180000,
        "etapa": "negociacion",
        "probabilidad": 75,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-05-03T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-045-1",
        "cliente_id": "c0450000-0000-4000-8000-000000000045",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Valeria Pérez Bisonó.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-09-20T18:00:00.000Z"
      },
      {
        "id": "act-045-2",
        "cliente_id": "c0450000-0000-4000-8000-000000000045",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-05-03T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0460000-0000-4000-8000-000000000046",
    "codigo": "CLI-046",
    "razon_social": "Hard Rock Hotel & Casino Punta Cana S.A.",
    "nombre_comercial": "Hard Rock Punta Cana",
    "identificacion_fiscal": "1-01-38382-2",
    "sector": "Turismo",
    "estado": "activo",
    "prioridad": "media",
    "sitio_web": "https://www.hardrockhotelpuntacana.do",
    "telefono": "+1 (829) 522-2978",
    "email": "info@hardrockhotelpuntacana.do",
    "direccion": "Av. Abraham Lincoln No. 148, Sector Villa Olga",
    "ciudad": "Punta Cana",
    "pais": "República Dominicana",
    "valor_estimado": 20590000,
    "responsable": "Valentina Castillo",
    "ultimo_contacto": "2026-09-18T18:00:00.000Z",
    "creado_en": "2026-04-30T18:00:00.000Z",
    "actualizado_en": "2026-10-03T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-046-1",
        "cliente_id": "c0460000-0000-4000-8000-000000000046",
        "nombre": "Víctor Hernández Rodríguez",
        "cargo": "Gerente de Infraestructura & Operaciones TI",
        "email": "víctor.hernández@hardrockhotelpuntacana.do",
        "telefono": "+1 (849) 535-3009",
        "es_principal": true,
        "creado_en": "2026-04-30T18:00:00.000Z"
      },
      {
        "id": "cnt-046-2",
        "cliente_id": "c0460000-0000-4000-8000-000000000046",
        "nombre": "Raquel Guzmán Castillo",
        "cargo": "Analista Financiero Principal",
        "email": "raquel.guzmán@hardrockhotelpuntacana.do",
        "telefono": "+1 (809) 548-3040",
        "es_principal": false,
        "creado_en": "2026-04-30T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-046-1",
        "cliente_id": "c0460000-0000-4000-8000-000000000046",
        "titulo": "Contrato Marco de Suministro B2B Anual",
        "monto": 20590000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-04-30T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-046-1",
        "cliente_id": "c0460000-0000-4000-8000-000000000046",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Víctor Hernández Rodríguez.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-09-18T18:00:00.000Z"
      },
      {
        "id": "act-046-2",
        "cliente_id": "c0460000-0000-4000-8000-000000000046",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-04-30T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0470000-0000-4000-8000-000000000047",
    "codigo": "CLI-047",
    "razon_social": "Catalonia Hotels Caribe S.R.L.",
    "nombre_comercial": "Catalonia Resorts RD",
    "identificacion_fiscal": "1-31-38999-5",
    "sector": "Turismo",
    "estado": "activo",
    "prioridad": "baja",
    "sitio_web": "https://www.cataloniahotels.do",
    "telefono": "+1 (849) 529-3021",
    "email": "info@cataloniahotels.do",
    "direccion": "Av. 27 de Febrero No. 151, Sector Cerros de Gurabo",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 21010000,
    "responsable": "Marcos Almonte",
    "ultimo_contacto": "2026-09-16T18:00:00.000Z",
    "creado_en": "2026-04-27T18:00:00.000Z",
    "actualizado_en": "2026-10-01T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-047-1",
        "cliente_id": "c0470000-0000-4000-8000-000000000047",
        "nombre": "Sofía Castillo Taveras",
        "cargo": "Director Comercial y Alianzas Corporativas",
        "email": "sofía.castillo@cataloniahotels.do",
        "telefono": "+1 (809) 542-3052",
        "es_principal": true,
        "creado_en": "2026-04-27T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-047-1",
        "cliente_id": "c0470000-0000-4000-8000-000000000047",
        "titulo": "Renovación de Infraestructura y Soporte Crítico 24/7",
        "monto": 21010000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-04-27T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-047-1",
        "cliente_id": "c0470000-0000-4000-8000-000000000047",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Sofía Castillo Taveras.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-09-16T18:00:00.000Z"
      },
      {
        "id": "act-047-2",
        "cliente_id": "c0470000-0000-4000-8000-000000000047",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-04-27T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0480000-0000-4000-8000-000000000048",
    "codigo": "CLI-048",
    "razon_social": "Playa Grande Golf & Ocean Club S.A.",
    "nombre_comercial": "Playa Grande Club",
    "identificacion_fiscal": "1-01-39616-8",
    "sector": "Turismo",
    "estado": "prospecto",
    "prioridad": "alta",
    "sitio_web": "https://www.playagrande.com.do",
    "telefono": "+1 (809) 536-3064",
    "email": "info@playagrande.com.do",
    "direccion": "Av. John F. Kennedy No. 154, Sector Piantini",
    "ciudad": "Río San Juan",
    "pais": "República Dominicana",
    "valor_estimado": 21420000,
    "responsable": "Daniela Rosario",
    "ultimo_contacto": "2026-09-14T18:00:00.000Z",
    "creado_en": "2026-04-24T18:00:00.000Z",
    "actualizado_en": "2026-09-29T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-048-1",
        "cliente_id": "c0480000-0000-4000-8000-000000000048",
        "nombre": "Pedro Mejía Sánchez",
        "cargo": "Director General de Operaciones",
        "email": "pedro.mejía@playagrande.com.do",
        "telefono": "+1 (829) 549-3095",
        "es_principal": true,
        "creado_en": "2026-04-24T18:00:00.000Z"
      },
      {
        "id": "cnt-048-2",
        "cliente_id": "c0480000-0000-4000-8000-000000000048",
        "nombre": "Marisol Reyes Cabrera",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "marisol.reyes@playagrande.com.do",
        "telefono": "+1 (849) 562-3126",
        "es_principal": false,
        "creado_en": "2026-04-24T18:00:00.000Z"
      },
      {
        "id": "cnt-048-3",
        "cliente_id": "c0480000-0000-4000-8000-000000000048",
        "nombre": "Andrés Vargas Estrella",
        "cargo": "Líder de Proyectos de TI e Innovación",
        "email": "andrés.vargas@playagrande.com.do",
        "telefono": "+1 (809) 575-3157",
        "es_principal": false,
        "creado_en": "2026-04-24T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-048-1",
        "cliente_id": "c0480000-0000-4000-8000-000000000048",
        "titulo": "Proyecto de Optimización Operativa y Automatización",
        "monto": 21420000,
        "etapa": "calificacion",
        "probabilidad": 30,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-04-24T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-048-1",
        "cliente_id": "c0480000-0000-4000-8000-000000000048",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Pedro Mejía Sánchez.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-09-14T18:00:00.000Z"
      },
      {
        "id": "act-048-2",
        "cliente_id": "c0480000-0000-4000-8000-000000000048",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-04-24T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0490000-0000-4000-8000-000000000049",
    "codigo": "CLI-049",
    "razon_social": "Hodelpa Hotels & Resorts S.A.",
    "nombre_comercial": "Cadena Hodelpa",
    "identificacion_fiscal": "1-31-40233-2",
    "sector": "Turismo",
    "estado": "activo",
    "prioridad": "media",
    "sitio_web": "https://www.hodelpa.com.do",
    "telefono": "+1 (829) 543-3107",
    "email": "info@hodelpa.com.do",
    "direccion": "Av. Lope de Vega No. 157, Sector Naco",
    "ciudad": "Santiago",
    "pais": "República Dominicana",
    "valor_estimado": 21840000,
    "responsable": "Camila Morales",
    "ultimo_contacto": "2026-09-12T18:00:00.000Z",
    "creado_en": "2026-04-21T18:00:00.000Z",
    "actualizado_en": "2026-09-27T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-049-1",
        "cliente_id": "c0490000-0000-4000-8000-000000000049",
        "nombre": "Natalia Taveras Pichardo",
        "cargo": "Vicepresidente de Finanzas & Tesorería",
        "email": "natalia.taveras@hodelpa.com.do",
        "telefono": "+1 (849) 556-3138",
        "es_principal": true,
        "creado_en": "2026-04-21T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-049-1",
        "cliente_id": "c0490000-0000-4000-8000-000000000049",
        "titulo": "Consultoría Estratégica y Plataforma Integral",
        "monto": 21840000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-04-21T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-049-1",
        "cliente_id": "c0490000-0000-4000-8000-000000000049",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Natalia Taveras Pichardo.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-09-12T18:00:00.000Z"
      },
      {
        "id": "act-049-2",
        "cliente_id": "c0490000-0000-4000-8000-000000000049",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-04-21T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0500000-0000-4000-8000-000000000050",
    "codigo": "CLI-050",
    "razon_social": "Bahia Principe Hotels Dominican Republic",
    "nombre_comercial": "Bahia Principe RD",
    "identificacion_fiscal": "1-01-40850-5",
    "sector": "Turismo",
    "estado": "activo",
    "prioridad": "baja",
    "sitio_web": "https://www.bahia-principe.do",
    "telefono": "+1 (849) 550-3150",
    "email": "info@bahia-principe.do",
    "direccion": "Av. Tiradentes No. 160, Sector Bella Vista",
    "ciudad": "Samaná",
    "pais": "República Dominicana",
    "valor_estimado": 22250000,
    "responsable": "Ignacio Silva",
    "ultimo_contacto": "2026-10-05T18:00:00.000Z",
    "creado_en": "2026-04-18T18:00:00.000Z",
    "actualizado_en": "2026-09-25T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-050-1",
        "cliente_id": "c0500000-0000-4000-8000-000000000050",
        "nombre": "Héctor Almonte Pérez",
        "cargo": "Director de Tecnología & Transformación Digital",
        "email": "héctor.almonte@bahia-principe.do",
        "telefono": "+1 (809) 563-3181",
        "es_principal": true,
        "creado_en": "2026-04-18T18:00:00.000Z"
      },
      {
        "id": "cnt-050-2",
        "cliente_id": "c0500000-0000-4000-8000-000000000050",
        "nombre": "Gabriela Sánchez Martínez",
        "cargo": "Analista Financiero Principal",
        "email": "gabriela.sánchez@bahia-principe.do",
        "telefono": "+1 (829) 576-3212",
        "es_principal": false,
        "creado_en": "2026-04-18T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-050-1",
        "cliente_id": "c0500000-0000-4000-8000-000000000050",
        "titulo": "Implementación y Licenciamiento Empresarial Cloud 2026",
        "monto": 22250000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-04-18T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-050-1",
        "cliente_id": "c0500000-0000-4000-8000-000000000050",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Héctor Almonte Pérez.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-10-05T18:00:00.000Z"
      },
      {
        "id": "act-050-2",
        "cliente_id": "c0500000-0000-4000-8000-000000000050",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-04-18T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0510000-0000-4000-8000-000000000051",
    "codigo": "CLI-051",
    "razon_social": "Eden Roc Cap Cana S.A.S.",
    "nombre_comercial": "Eden Roc Cap Cana",
    "identificacion_fiscal": "1-31-41467-8",
    "sector": "Turismo",
    "estado": "en_negociacion",
    "prioridad": "alta",
    "sitio_web": "https://www.edenroccapcana.com.do",
    "telefono": "+1 (809) 557-3193",
    "email": "info@edenroccapcana.com.do",
    "direccion": "Av. Sarasota No. 163, Sector Evaristo Morales",
    "ciudad": "Cap Cana",
    "pais": "República Dominicana",
    "valor_estimado": 22670000,
    "responsable": "Felipe Guzmán",
    "ultimo_contacto": "2026-10-03T18:00:00.000Z",
    "creado_en": "2026-04-15T18:00:00.000Z",
    "actualizado_en": "2026-09-23T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-051-1",
        "cliente_id": "c0510000-0000-4000-8000-000000000051",
        "nombre": "Andrea De la Cruz Guzmán",
        "cargo": "Gerente General de Compras & Cadena de Suministro",
        "email": "andrea.de la cruz@edenroccapcana.com.do",
        "telefono": "+1 (829) 570-3224",
        "es_principal": true,
        "creado_en": "2026-04-15T18:00:00.000Z"
      },
      {
        "id": "cnt-051-2",
        "cliente_id": "c0510000-0000-4000-8000-000000000051",
        "nombre": "César Jiménez Almonte",
        "cargo": "Gerente de Seguridad Industrial y Calidad",
        "email": "césar.jiménez@edenroccapcana.com.do",
        "telefono": "+1 (849) 583-3255",
        "es_principal": false,
        "creado_en": "2026-04-15T18:00:00.000Z"
      },
      {
        "id": "cnt-051-3",
        "cliente_id": "c0510000-0000-4000-8000-000000000051",
        "nombre": "Sofía Pichardo Peña",
        "cargo": "Gerente de Cuentas por Pagar & Contabilidad",
        "email": "sofía.pichardo@edenroccapcana.com.do",
        "telefono": "+1 (809) 596-3286",
        "es_principal": false,
        "creado_en": "2026-04-15T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-051-1",
        "cliente_id": "c0510000-0000-4000-8000-000000000051",
        "titulo": "Contrato Marco de Suministro B2B Anual",
        "monto": 22670000,
        "etapa": "negociacion",
        "probabilidad": 75,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-04-15T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-051-1",
        "cliente_id": "c0510000-0000-4000-8000-000000000051",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Andrea De la Cruz Guzmán.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-10-03T18:00:00.000Z"
      },
      {
        "id": "act-051-2",
        "cliente_id": "c0510000-0000-4000-8000-000000000051",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-04-15T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0520000-0000-4000-8000-000000000052",
    "codigo": "CLI-052",
    "razon_social": "Hospital Metropolitano de Santiago (HOMS) S.A.",
    "nombre_comercial": "HOMS Santiago",
    "identificacion_fiscal": "1-01-42084-2",
    "sector": "Salud",
    "estado": "prospecto",
    "prioridad": "media",
    "sitio_web": "https://www.homs.com.do",
    "telefono": "+1 (829) 564-3236",
    "email": "info@homs.com.do",
    "direccion": "Av. Estrella Sadhalá No. 166, Sector La Julia",
    "ciudad": "Santiago",
    "pais": "República Dominicana",
    "valor_estimado": 23080000,
    "responsable": "Laura Peña",
    "ultimo_contacto": "2026-10-01T18:00:00.000Z",
    "creado_en": "2026-04-12T18:00:00.000Z",
    "actualizado_en": "2026-09-21T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-052-1",
        "cliente_id": "c0520000-0000-4000-8000-000000000052",
        "nombre": "Fernando Mendoza Mendoza",
        "cargo": "Vicepresidente Ejecutivo de Administración",
        "email": "fernando.mendoza@homs.com.do",
        "telefono": "+1 (849) 577-3267",
        "es_principal": true,
        "creado_en": "2026-04-12T18:00:00.000Z"
      },
      {
        "id": "cnt-052-2",
        "cliente_id": "c0520000-0000-4000-8000-000000000052",
        "nombre": "Teresa Morales Jiménez",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "teresa.morales@homs.com.do",
        "telefono": "+1 (809) 590-3298",
        "es_principal": false,
        "creado_en": "2026-04-12T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-052-1",
        "cliente_id": "c0520000-0000-4000-8000-000000000052",
        "titulo": "Renovación de Infraestructura y Soporte Crítico 24/7",
        "monto": 23080000,
        "etapa": "calificacion",
        "probabilidad": 30,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-04-12T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-052-1",
        "cliente_id": "c0520000-0000-4000-8000-000000000052",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Fernando Mendoza Mendoza.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-10-01T18:00:00.000Z"
      },
      {
        "id": "act-052-2",
        "cliente_id": "c0520000-0000-4000-8000-000000000052",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-04-12T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0530000-0000-4000-8000-000000000053",
    "codigo": "CLI-053",
    "razon_social": "Centro Médico Real S.A.",
    "nombre_comercial": "Centro Médico Real",
    "identificacion_fiscal": "1-31-42701-5",
    "sector": "Salud",
    "estado": "inactivo",
    "prioridad": "baja",
    "sitio_web": "https://www.medicoreal.com.do",
    "telefono": "+1 (849) 571-3279",
    "email": "info@medicoreal.com.do",
    "direccion": "Av. Juan Pablo Duarte No. 169, Sector Los Jardines",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 23500000,
    "responsable": "Roberto Méndez",
    "ultimo_contacto": "2026-09-29T18:00:00.000Z",
    "creado_en": "2026-04-09T18:00:00.000Z",
    "actualizado_en": "2026-10-04T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-053-1",
        "cliente_id": "c0530000-0000-4000-8000-000000000053",
        "nombre": "Paola Vargas Estrella",
        "cargo": "Director de Recursos Humanos & Talento",
        "email": "paola.vargas@medicoreal.com.do",
        "telefono": "+1 (809) 584-3310",
        "es_principal": true,
        "creado_en": "2026-04-09T18:00:00.000Z"
      }
    ],
    "oportunidades": [],
    "actividades": [
      {
        "id": "act-053-1",
        "cliente_id": "c0530000-0000-4000-8000-000000000053",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Paola Vargas Estrella.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-09-29T18:00:00.000Z"
      },
      {
        "id": "act-053-2",
        "cliente_id": "c0530000-0000-4000-8000-000000000053",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-04-09T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0540000-0000-4000-8000-000000000054",
    "codigo": "CLI-054",
    "razon_social": "Hospiten Santo Domingo S.A.",
    "nombre_comercial": "Hospiten RD",
    "identificacion_fiscal": "1-01-43318-8",
    "sector": "Salud",
    "estado": "activo",
    "prioridad": "alta",
    "sitio_web": "https://www.hospiten.com.do",
    "telefono": "+1 (809) 578-3322",
    "email": "info@hospiten.com.do",
    "direccion": "Av. Winston Churchill No. 172, Sector Villa Olga",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 23910000,
    "responsable": "Valentina Castillo",
    "ultimo_contacto": "2026-09-27T18:00:00.000Z",
    "creado_en": "2026-04-06T18:00:00.000Z",
    "actualizado_en": "2026-10-02T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-054-1",
        "cliente_id": "c0540000-0000-4000-8000-000000000054",
        "nombre": "Javier Cabrera García",
        "cargo": "Gerente de Infraestructura & Operaciones TI",
        "email": "javier.cabrera@hospiten.com.do",
        "telefono": "+1 (829) 591-3353",
        "es_principal": true,
        "creado_en": "2026-04-06T18:00:00.000Z"
      },
      {
        "id": "cnt-054-2",
        "cliente_id": "c0540000-0000-4000-8000-000000000054",
        "nombre": "Lucía Bisonó Hernández",
        "cargo": "Analista Financiero Principal",
        "email": "lucía.bisonó@hospiten.com.do",
        "telefono": "+1 (849) 604-3384",
        "es_principal": false,
        "creado_en": "2026-04-06T18:00:00.000Z"
      },
      {
        "id": "cnt-054-3",
        "cliente_id": "c0540000-0000-4000-8000-000000000054",
        "nombre": "Gabriel García Báez",
        "cargo": "Asesor Legal Corporativo",
        "email": "gabriel.garcía@hospiten.com.do",
        "telefono": "+1 (809) 617-3415",
        "es_principal": false,
        "creado_en": "2026-04-06T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-054-1",
        "cliente_id": "c0540000-0000-4000-8000-000000000054",
        "titulo": "Consultoría Estratégica y Plataforma Integral",
        "monto": 23910000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-04-06T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-054-1",
        "cliente_id": "c0540000-0000-4000-8000-000000000054",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Javier Cabrera García.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-09-27T18:00:00.000Z"
      },
      {
        "id": "act-054-2",
        "cliente_id": "c0540000-0000-4000-8000-000000000054",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-04-06T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0550000-0000-4000-8000-000000000055",
    "codigo": "CLI-055",
    "razon_social": "Laboratorios Feltrex S.A.",
    "nombre_comercial": "Laboratorios Feltrex",
    "identificacion_fiscal": "1-31-43935-2",
    "sector": "Salud",
    "estado": "en_negociacion",
    "prioridad": "media",
    "sitio_web": "https://www.feltrex.com.do",
    "telefono": "+1 (829) 585-3365",
    "email": "info@feltrex.com.do",
    "direccion": "Av. Abraham Lincoln No. 175, Sector Cerros de Gurabo",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 24330000,
    "responsable": "Marcos Almonte",
    "ultimo_contacto": "2026-09-25T18:00:00.000Z",
    "creado_en": "2026-04-03T18:00:00.000Z",
    "actualizado_en": "2026-09-30T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-055-1",
        "cliente_id": "c0550000-0000-4000-8000-000000000055",
        "nombre": "Patricia Rosario Mejía",
        "cargo": "Director Comercial y Alianzas Corporativas",
        "email": "patricia.rosario@feltrex.com.do",
        "telefono": "+1 (849) 598-3396",
        "es_principal": true,
        "creado_en": "2026-04-03T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-055-1",
        "cliente_id": "c0550000-0000-4000-8000-000000000055",
        "titulo": "Implementación y Licenciamiento Empresarial Cloud 2026",
        "monto": 24330000,
        "etapa": "negociacion",
        "probabilidad": 75,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-04-03T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-055-1",
        "cliente_id": "c0550000-0000-4000-8000-000000000055",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Patricia Rosario Mejía.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-09-25T18:00:00.000Z"
      },
      {
        "id": "act-055-2",
        "cliente_id": "c0550000-0000-4000-8000-000000000055",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-04-03T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0560000-0000-4000-8000-000000000056",
    "codigo": "CLI-056",
    "razon_social": "Laboratorios de Aplicaciones Médicas (LAM) S.A.",
    "nombre_comercial": "Laboratorios LAM",
    "identificacion_fiscal": "1-01-44552-5",
    "sector": "Salud",
    "estado": "activo",
    "prioridad": "baja",
    "sitio_web": "https://www.lam.com.do",
    "telefono": "+1 (849) 592-3408",
    "email": "info@lam.com.do",
    "direccion": "Av. 27 de Febrero No. 178, Sector Piantini",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 24740000,
    "responsable": "Daniela Rosario",
    "ultimo_contacto": "2026-09-23T18:00:00.000Z",
    "creado_en": "2026-03-31T18:00:00.000Z",
    "actualizado_en": "2026-09-28T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-056-1",
        "cliente_id": "c0560000-0000-4000-8000-000000000056",
        "nombre": "Carlos Pichardo Peña",
        "cargo": "Director General de Operaciones",
        "email": "carlos.pichardo@lam.com.do",
        "telefono": "+1 (809) 605-3439",
        "es_principal": true,
        "creado_en": "2026-03-31T18:00:00.000Z"
      },
      {
        "id": "cnt-056-2",
        "cliente_id": "c0560000-0000-4000-8000-000000000056",
        "nombre": "Daniela Santana Vargas",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "daniela.santana@lam.com.do",
        "telefono": "+1 (829) 618-3470",
        "es_principal": false,
        "creado_en": "2026-03-31T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-056-1",
        "cliente_id": "c0560000-0000-4000-8000-000000000056",
        "titulo": "Contrato Marco de Suministro B2B Anual",
        "monto": 24740000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-03-31T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-056-1",
        "cliente_id": "c0560000-0000-4000-8000-000000000056",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Carlos Pichardo Peña.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-09-23T18:00:00.000Z"
      },
      {
        "id": "act-056-2",
        "cliente_id": "c0560000-0000-4000-8000-000000000056",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-03-31T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0570000-0000-4000-8000-000000000057",
    "codigo": "CLI-057",
    "razon_social": "Referencia Laboratorio Clínico S.A.",
    "nombre_comercial": "Referencia Laboratorio",
    "identificacion_fiscal": "1-31-45169-8",
    "sector": "Salud",
    "estado": "activo",
    "prioridad": "alta",
    "sitio_web": "https://www.labreferencia.com.do",
    "telefono": "+1 (809) 599-3451",
    "email": "info@labreferencia.com.do",
    "direccion": "Av. John F. Kennedy No. 181, Sector Naco",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 25160000,
    "responsable": "Camila Morales",
    "ultimo_contacto": "2026-09-21T18:00:00.000Z",
    "creado_en": "2026-03-28T18:00:00.000Z",
    "actualizado_en": "2026-09-26T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-057-1",
        "cliente_id": "c0570000-0000-4000-8000-000000000057",
        "nombre": "Rosa María Corominas Rosario",
        "cargo": "Vicepresidente de Finanzas & Tesorería",
        "email": "rosamaría.corominas@labreferencia.com.do",
        "telefono": "+1 (829) 612-3482",
        "es_principal": true,
        "creado_en": "2026-03-28T18:00:00.000Z"
      },
      {
        "id": "cnt-057-2",
        "cliente_id": "c0570000-0000-4000-8000-000000000057",
        "nombre": "Ricardo Pérez Bisonó",
        "cargo": "Coordinador de Logística y Despacho",
        "email": "ricardo.pérez@labreferencia.com.do",
        "telefono": "+1 (849) 625-3513",
        "es_principal": false,
        "creado_en": "2026-03-28T18:00:00.000Z"
      },
      {
        "id": "cnt-057-3",
        "cliente_id": "c0570000-0000-4000-8000-000000000057",
        "nombre": "Paola Báez Fernández",
        "cargo": "Especialista Senior de Compras Estratégicas",
        "email": "paola.báez@labreferencia.com.do",
        "telefono": "+1 (809) 638-3544",
        "es_principal": false,
        "creado_en": "2026-03-28T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-057-1",
        "cliente_id": "c0570000-0000-4000-8000-000000000057",
        "titulo": "Renovación de Infraestructura y Soporte Crítico 24/7",
        "monto": 25160000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-03-28T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-057-1",
        "cliente_id": "c0570000-0000-4000-8000-000000000057",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Rosa María Corominas Rosario.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-09-21T18:00:00.000Z"
      },
      {
        "id": "act-057-2",
        "cliente_id": "c0570000-0000-4000-8000-000000000057",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-03-28T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0580000-0000-4000-8000-000000000058",
    "codigo": "CLI-058",
    "razon_social": "Amadita Laboratorio Clínico S.A.S.",
    "nombre_comercial": "Amadita Laboratorio",
    "identificacion_fiscal": "1-01-45786-2",
    "sector": "Salud",
    "estado": "prospecto",
    "prioridad": "media",
    "sitio_web": "https://www.amadita.com.do",
    "telefono": "+1 (829) 606-3494",
    "email": "info@amadita.com.do",
    "direccion": "Av. Lope de Vega No. 184, Sector Bella Vista",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 25570000,
    "responsable": "Ignacio Silva",
    "ultimo_contacto": "2026-09-19T18:00:00.000Z",
    "creado_en": "2026-03-25T18:00:00.000Z",
    "actualizado_en": "2026-09-24T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-058-1",
        "cliente_id": "c0580000-0000-4000-8000-000000000058",
        "nombre": "José Luis Fernández Santana",
        "cargo": "Director de Tecnología & Transformación Digital",
        "email": "joséluis.fernández@amadita.com.do",
        "telefono": "+1 (849) 619-3525",
        "es_principal": true,
        "creado_en": "2026-03-25T18:00:00.000Z"
      },
      {
        "id": "cnt-058-2",
        "cliente_id": "c0580000-0000-4000-8000-000000000058",
        "nombre": "Elena Hernández Rodríguez",
        "cargo": "Analista Financiero Principal",
        "email": "elena.hernández@amadita.com.do",
        "telefono": "+1 (809) 632-3556",
        "es_principal": false,
        "creado_en": "2026-03-25T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-058-1",
        "cliente_id": "c0580000-0000-4000-8000-000000000058",
        "titulo": "Proyecto de Optimización Operativa y Automatización",
        "monto": 25570000,
        "etapa": "calificacion",
        "probabilidad": 30,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-03-25T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-058-1",
        "cliente_id": "c0580000-0000-4000-8000-000000000058",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con José Luis Fernández Santana.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-09-19T18:00:00.000Z"
      },
      {
        "id": "act-058-2",
        "cliente_id": "c0580000-0000-4000-8000-000000000058",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-03-25T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0590000-0000-4000-8000-000000000059",
    "codigo": "CLI-059",
    "razon_social": "Clínica Abreu S.A. (Grupo CDD Global)",
    "nombre_comercial": "Clínica Abreu",
    "identificacion_fiscal": "1-31-46403-5",
    "sector": "Salud",
    "estado": "cerrado_perdido",
    "prioridad": "baja",
    "sitio_web": "https://www.clinicaabreu.com.do",
    "telefono": "+1 (849) 613-3537",
    "email": "info@clinicaabreu.com.do",
    "direccion": "Av. Tiradentes No. 187, Sector Evaristo Morales",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 25990000,
    "responsable": "Felipe Guzmán",
    "ultimo_contacto": "2026-09-17T18:00:00.000Z",
    "creado_en": "2026-03-22T18:00:00.000Z",
    "actualizado_en": "2026-09-22T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-059-1",
        "cliente_id": "c0590000-0000-4000-8000-000000000059",
        "nombre": "Claudia García Báez",
        "cargo": "Gerente General de Compras & Cadena de Suministro",
        "email": "claudia.garcía@clinicaabreu.com.do",
        "telefono": "+1 (809) 626-3568",
        "es_principal": true,
        "creado_en": "2026-03-22T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-059-1",
        "cliente_id": "c0590000-0000-4000-8000-000000000059",
        "titulo": "Consultoría Estratégica y Plataforma Integral",
        "monto": 25990000,
        "etapa": "perdida",
        "probabilidad": 0,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-03-22T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-059-1",
        "cliente_id": "c0590000-0000-4000-8000-000000000059",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Claudia García Báez.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-09-17T18:00:00.000Z"
      },
      {
        "id": "act-059-2",
        "cliente_id": "c0590000-0000-4000-8000-000000000059",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-03-22T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0600000-0000-4000-8000-000000000060",
    "codigo": "CLI-060",
    "razon_social": "Centro de Diagnóstico y Telemedicina (CEDIMAT)",
    "nombre_comercial": "CEDIMAT",
    "identificacion_fiscal": "1-01-47020-8",
    "sector": "Salud",
    "estado": "activo",
    "prioridad": "alta",
    "sitio_web": "https://www.cedimat.com.do",
    "telefono": "+1 (809) 620-3580",
    "email": "info@cedimat.com.do",
    "direccion": "Av. Sarasota No. 190, Sector La Julia",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 26400000,
    "responsable": "Laura Peña",
    "ultimo_contacto": "2026-09-15T18:00:00.000Z",
    "creado_en": "2026-09-15T18:00:00.000Z",
    "actualizado_en": "2026-10-05T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-060-1",
        "cliente_id": "c0600000-0000-4000-8000-000000000060",
        "nombre": "Víctor Rodríguez De la Cruz",
        "cargo": "Vicepresidente Ejecutivo de Administración",
        "email": "víctor.rodríguez@cedimat.com.do",
        "telefono": "+1 (829) 633-3611",
        "es_principal": true,
        "creado_en": "2026-09-15T18:00:00.000Z"
      },
      {
        "id": "cnt-060-2",
        "cliente_id": "c0600000-0000-4000-8000-000000000060",
        "nombre": "Carolina Mejía Sánchez",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "carolina.mejía@cedimat.com.do",
        "telefono": "+1 (849) 646-3642",
        "es_principal": false,
        "creado_en": "2026-09-15T18:00:00.000Z"
      },
      {
        "id": "cnt-060-3",
        "cliente_id": "c0600000-0000-4000-8000-000000000060",
        "nombre": "Rafael Reyes Cabrera",
        "cargo": "Líder de Proyectos de TI e Innovación",
        "email": "rafael.reyes@cedimat.com.do",
        "telefono": "+1 (809) 659-3673",
        "es_principal": false,
        "creado_en": "2026-09-15T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-060-1",
        "cliente_id": "c0600000-0000-4000-8000-000000000060",
        "titulo": "Implementación y Licenciamiento Empresarial Cloud 2026",
        "monto": 26400000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-09-15T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-060-1",
        "cliente_id": "c0600000-0000-4000-8000-000000000060",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Víctor Rodríguez De la Cruz.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-09-15T18:00:00.000Z"
      },
      {
        "id": "act-060-2",
        "cliente_id": "c0600000-0000-4000-8000-000000000060",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-09-15T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0610000-0000-4000-8000-000000000061",
    "codigo": "CLI-061",
    "razon_social": "Farmacias Carol S.A.S. - División Institucional",
    "nombre_comercial": "Farmacias Carol B2B",
    "identificacion_fiscal": "1-31-47637-2",
    "sector": "Salud",
    "estado": "en_negociacion",
    "prioridad": "media",
    "sitio_web": "https://www.farmaciascarol.com.do",
    "telefono": "+1 (829) 627-3623",
    "email": "info@farmaciascarol.com.do",
    "direccion": "Av. Estrella Sadhalá No. 193, Sector Los Jardines",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 26820000,
    "responsable": "Roberto Méndez",
    "ultimo_contacto": "2026-09-13T18:00:00.000Z",
    "creado_en": "2026-09-12T18:00:00.000Z",
    "actualizado_en": "2026-10-03T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-061-1",
        "cliente_id": "c0610000-0000-4000-8000-000000000061",
        "nombre": "Verónica Martínez Morales",
        "cargo": "Director de Recursos Humanos & Talento",
        "email": "verónica.martínez@farmaciascarol.com.do",
        "telefono": "+1 (849) 640-3654",
        "es_principal": true,
        "creado_en": "2026-09-12T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-061-1",
        "cliente_id": "c0610000-0000-4000-8000-000000000061",
        "titulo": "Contrato Marco de Suministro B2B Anual",
        "monto": 26820000,
        "etapa": "negociacion",
        "probabilidad": 75,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-09-12T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-061-1",
        "cliente_id": "c0610000-0000-4000-8000-000000000061",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Verónica Martínez Morales.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-09-13T18:00:00.000Z"
      },
      {
        "id": "act-061-2",
        "cliente_id": "c0610000-0000-4000-8000-000000000061",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-09-12T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0620000-0000-4000-8000-000000000062",
    "codigo": "CLI-062",
    "razon_social": "Unión Médica del Norte S.A.",
    "nombre_comercial": "Unión Médica Santiago",
    "identificacion_fiscal": "1-01-48254-5",
    "sector": "Salud",
    "estado": "prospecto",
    "prioridad": "baja",
    "sitio_web": "https://www.unionmedica.com.do",
    "telefono": "+1 (849) 634-3666",
    "email": "info@unionmedica.com.do",
    "direccion": "Av. Juan Pablo Duarte No. 196, Sector Villa Olga",
    "ciudad": "Santiago",
    "pais": "República Dominicana",
    "valor_estimado": 27230000,
    "responsable": "Valentina Castillo",
    "ultimo_contacto": "2026-09-11T18:00:00.000Z",
    "creado_en": "2026-09-09T18:00:00.000Z",
    "actualizado_en": "2026-10-01T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-062-1",
        "cliente_id": "c0620000-0000-4000-8000-000000000062",
        "nombre": "Pedro Báez Fernández",
        "cargo": "Gerente de Infraestructura & Operaciones TI",
        "email": "pedro.báez@unionmedica.com.do",
        "telefono": "+1 (809) 647-3697",
        "es_principal": true,
        "creado_en": "2026-09-09T18:00:00.000Z"
      },
      {
        "id": "cnt-062-2",
        "cliente_id": "c0620000-0000-4000-8000-000000000062",
        "nombre": "Carmen Almonte Pérez",
        "cargo": "Analista Financiero Principal",
        "email": "carmen.almonte@unionmedica.com.do",
        "telefono": "+1 (829) 660-3728",
        "es_principal": false,
        "creado_en": "2026-09-09T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-062-1",
        "cliente_id": "c0620000-0000-4000-8000-000000000062",
        "titulo": "Renovación de Infraestructura y Soporte Crítico 24/7",
        "monto": 27230000,
        "etapa": "calificacion",
        "probabilidad": 30,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-09-09T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-062-1",
        "cliente_id": "c0620000-0000-4000-8000-000000000062",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Pedro Báez Fernández.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-09-11T18:00:00.000Z"
      },
      {
        "id": "act-062-2",
        "cliente_id": "c0620000-0000-4000-8000-000000000062",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-09-09T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0630000-0000-4000-8000-000000000063",
    "codigo": "CLI-063",
    "razon_social": "Farmacéutica Dominicana S.A. (FARMEDOM)",
    "nombre_comercial": "FARMEDOM",
    "identificacion_fiscal": "1-31-48871-8",
    "sector": "Salud",
    "estado": "activo",
    "prioridad": "alta",
    "sitio_web": "https://www.farmedom.com.do",
    "telefono": "+1 (809) 641-3709",
    "email": "info@farmedom.com.do",
    "direccion": "Av. Winston Churchill No. 199, Sector Cerros de Gurabo",
    "ciudad": "San Cristóbal",
    "pais": "República Dominicana",
    "valor_estimado": 27650000,
    "responsable": "Marcos Almonte",
    "ultimo_contacto": "2026-10-04T18:00:00.000Z",
    "creado_en": "2026-09-06T18:00:00.000Z",
    "actualizado_en": "2026-09-29T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-063-1",
        "cliente_id": "c0630000-0000-4000-8000-000000000063",
        "nombre": "Mariela Guzmán Castillo",
        "cargo": "Director Comercial y Alianzas Corporativas",
        "email": "mariela.guzmán@farmedom.com.do",
        "telefono": "+1 (829) 654-3740",
        "es_principal": true,
        "creado_en": "2026-09-06T18:00:00.000Z"
      },
      {
        "id": "cnt-063-2",
        "cliente_id": "c0630000-0000-4000-8000-000000000063",
        "nombre": "Eduardo De la Cruz Guzmán",
        "cargo": "Gerente de Seguridad Industrial y Calidad",
        "email": "eduardo.de la cruz@farmedom.com.do",
        "telefono": "+1 (849) 667-3771",
        "es_principal": false,
        "creado_en": "2026-09-06T18:00:00.000Z"
      },
      {
        "id": "cnt-063-3",
        "cliente_id": "c0630000-0000-4000-8000-000000000063",
        "nombre": "Claudia Jiménez Almonte",
        "cargo": "Gerente de Cuentas por Pagar & Contabilidad",
        "email": "claudia.jiménez@farmedom.com.do",
        "telefono": "+1 (809) 680-3802",
        "es_principal": false,
        "creado_en": "2026-09-06T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-063-1",
        "cliente_id": "c0630000-0000-4000-8000-000000000063",
        "titulo": "Proyecto de Optimización Operativa y Automatización",
        "monto": 27650000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-09-06T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-063-1",
        "cliente_id": "c0630000-0000-4000-8000-000000000063",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Mariela Guzmán Castillo.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-10-04T18:00:00.000Z"
      },
      {
        "id": "act-063-2",
        "cliente_id": "c0630000-0000-4000-8000-000000000063",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-09-06T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0640000-0000-4000-8000-000000000064",
    "codigo": "CLI-064",
    "razon_social": "Grupo Ramos S.A. (La Sirena & Pola)",
    "nombre_comercial": "Grupo Ramos Corporativo",
    "identificacion_fiscal": "1-01-49488-2",
    "sector": "Retail",
    "estado": "activo",
    "prioridad": "media",
    "sitio_web": "https://www.gruporamos.com.do",
    "telefono": "+1 (829) 648-3752",
    "email": "info@gruporamos.com.do",
    "direccion": "Av. Abraham Lincoln No. 202, Sector Piantini",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 28060000,
    "responsable": "Daniela Rosario",
    "ultimo_contacto": "2026-10-02T18:00:00.000Z",
    "creado_en": "2026-09-03T18:00:00.000Z",
    "actualizado_en": "2026-09-27T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-064-1",
        "cliente_id": "c0640000-0000-4000-8000-000000000064",
        "nombre": "Héctor Valdez Reyes",
        "cargo": "Director General de Operaciones",
        "email": "héctor.valdez@gruporamos.com.do",
        "telefono": "+1 (849) 661-3783",
        "es_principal": true,
        "creado_en": "2026-09-03T18:00:00.000Z"
      },
      {
        "id": "cnt-064-2",
        "cliente_id": "c0640000-0000-4000-8000-000000000064",
        "nombre": "Silvia Mendoza Mendoza",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "silvia.mendoza@gruporamos.com.do",
        "telefono": "+1 (809) 674-3814",
        "es_principal": false,
        "creado_en": "2026-09-03T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-064-1",
        "cliente_id": "c0640000-0000-4000-8000-000000000064",
        "titulo": "Consultoría Estratégica y Plataforma Integral",
        "monto": 28060000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-09-03T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-064-1",
        "cliente_id": "c0640000-0000-4000-8000-000000000064",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Héctor Valdez Reyes.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-10-02T18:00:00.000Z"
      },
      {
        "id": "act-064-2",
        "cliente_id": "c0640000-0000-4000-8000-000000000064",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-09-03T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0650000-0000-4000-8000-000000000065",
    "codigo": "CLI-065",
    "razon_social": "Centro Cuesta Nacional (CCN) S.A.S.",
    "nombre_comercial": "CCN Corporativo",
    "identificacion_fiscal": "1-31-50105-5",
    "sector": "Retail",
    "estado": "en_negociacion",
    "prioridad": "baja",
    "sitio_web": "https://www.ccn.net.do",
    "telefono": "+1 (849) 655-3795",
    "email": "info@ccn.net.do",
    "direccion": "Av. 27 de Febrero No. 205, Sector Naco",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 28480000,
    "responsable": "Camila Morales",
    "ultimo_contacto": "2026-09-30T18:00:00.000Z",
    "creado_en": "2026-08-31T18:00:00.000Z",
    "actualizado_en": "2026-09-25T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-065-1",
        "cliente_id": "c0650000-0000-4000-8000-000000000065",
        "nombre": "Raquel Reyes Cabrera",
        "cargo": "Vicepresidente de Finanzas & Tesorería",
        "email": "raquel.reyes@ccn.net.do",
        "telefono": "+1 (809) 668-3826",
        "es_principal": true,
        "creado_en": "2026-08-31T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-065-1",
        "cliente_id": "c0650000-0000-4000-8000-000000000065",
        "titulo": "Implementación y Licenciamiento Empresarial Cloud 2026",
        "monto": 28480000,
        "etapa": "negociacion",
        "probabilidad": 75,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-08-31T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-065-1",
        "cliente_id": "c0650000-0000-4000-8000-000000000065",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Raquel Reyes Cabrera.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-09-30T18:00:00.000Z"
      },
      {
        "id": "act-065-2",
        "cliente_id": "c0650000-0000-4000-8000-000000000065",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-08-31T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0660000-0000-4000-8000-000000000066",
    "codigo": "CLI-066",
    "razon_social": "Plaza Lama S.A. - División Mayorista",
    "nombre_comercial": "Plaza Lama Mayorista",
    "identificacion_fiscal": "1-01-50722-8",
    "sector": "Retail",
    "estado": "activo",
    "prioridad": "alta",
    "sitio_web": "https://www.plazalama.com.do",
    "telefono": "+1 (809) 662-3838",
    "email": "info@plazalama.com.do",
    "direccion": "Av. John F. Kennedy No. 208, Sector Bella Vista",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 28890000,
    "responsable": "Ignacio Silva",
    "ultimo_contacto": "2026-09-28T18:00:00.000Z",
    "creado_en": "2026-08-28T18:00:00.000Z",
    "actualizado_en": "2026-09-23T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-066-1",
        "cliente_id": "c0660000-0000-4000-8000-000000000066",
        "nombre": "Fernando Peña Troncoso",
        "cargo": "Director de Tecnología & Transformación Digital",
        "email": "fernando.peña@plazalama.com.do",
        "telefono": "+1 (829) 675-3869",
        "es_principal": true,
        "creado_en": "2026-08-28T18:00:00.000Z"
      },
      {
        "id": "cnt-066-2",
        "cliente_id": "c0660000-0000-4000-8000-000000000066",
        "nombre": "Beatriz Cabrera García",
        "cargo": "Analista Financiero Principal",
        "email": "beatriz.cabrera@plazalama.com.do",
        "telefono": "+1 (849) 688-3900",
        "es_principal": false,
        "creado_en": "2026-08-28T18:00:00.000Z"
      },
      {
        "id": "cnt-066-3",
        "cliente_id": "c0660000-0000-4000-8000-000000000066",
        "nombre": "Alejandro Bisonó Hernández",
        "cargo": "Asesor Legal Corporativo",
        "email": "alejandro.bisonó@plazalama.com.do",
        "telefono": "+1 (809) 701-3931",
        "es_principal": false,
        "creado_en": "2026-08-28T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-066-1",
        "cliente_id": "c0660000-0000-4000-8000-000000000066",
        "titulo": "Contrato Marco de Suministro B2B Anual",
        "monto": 28890000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-08-28T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-066-1",
        "cliente_id": "c0660000-0000-4000-8000-000000000066",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Fernando Peña Troncoso.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-09-28T18:00:00.000Z"
      },
      {
        "id": "act-066-2",
        "cliente_id": "c0660000-0000-4000-8000-000000000066",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-08-28T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0670000-0000-4000-8000-000000000067",
    "codigo": "CLI-067",
    "razon_social": "PriceSmart Dominicana S.R.L. - B2B",
    "nombre_comercial": "PriceSmart Negocios",
    "identificacion_fiscal": "1-31-51339-2",
    "sector": "Retail",
    "estado": "activo",
    "prioridad": "media",
    "sitio_web": "https://www.pricesmart.com.do",
    "telefono": "+1 (829) 669-3881",
    "email": "info@pricesmart.com.do",
    "direccion": "Av. Lope de Vega No. 211, Sector Evaristo Morales",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 29310000,
    "responsable": "Felipe Guzmán",
    "ultimo_contacto": "2026-09-26T18:00:00.000Z",
    "creado_en": "2026-08-25T18:00:00.000Z",
    "actualizado_en": "2026-09-21T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-067-1",
        "cliente_id": "c0670000-0000-4000-8000-000000000067",
        "nombre": "Marisol Sánchez Martínez",
        "cargo": "Gerente General de Compras & Cadena de Suministro",
        "email": "marisol.sánchez@pricesmart.com.do",
        "telefono": "+1 (849) 682-3912",
        "es_principal": true,
        "creado_en": "2026-08-25T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-067-1",
        "cliente_id": "c0670000-0000-4000-8000-000000000067",
        "titulo": "Renovación de Infraestructura y Soporte Crítico 24/7",
        "monto": 29310000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-08-25T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-067-1",
        "cliente_id": "c0670000-0000-4000-8000-000000000067",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Marisol Sánchez Martínez.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-09-26T18:00:00.000Z"
      },
      {
        "id": "act-067-2",
        "cliente_id": "c0670000-0000-4000-8000-000000000067",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-08-25T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0680000-0000-4000-8000-000000000068",
    "codigo": "CLI-068",
    "razon_social": "Almacenes Unidos S.A.S.",
    "nombre_comercial": "Unidos Corporativo",
    "identificacion_fiscal": "1-01-51956-5",
    "sector": "Retail",
    "estado": "prospecto",
    "prioridad": "baja",
    "sitio_web": "https://www.unidos.com.do",
    "telefono": "+1 (849) 676-3924",
    "email": "info@unidos.com.do",
    "direccion": "Av. Tiradentes No. 214, Sector La Julia",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 29720000,
    "responsable": "Laura Peña",
    "ultimo_contacto": "2026-09-24T18:00:00.000Z",
    "creado_en": "2026-08-22T18:00:00.000Z",
    "actualizado_en": "2026-10-04T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-068-1",
        "cliente_id": "c0680000-0000-4000-8000-000000000068",
        "nombre": "Javier Jiménez Almonte",
        "cargo": "Vicepresidente Ejecutivo de Administración",
        "email": "javier.jiménez@unidos.com.do",
        "telefono": "+1 (809) 689-3955",
        "es_principal": true,
        "creado_en": "2026-08-22T18:00:00.000Z"
      },
      {
        "id": "cnt-068-2",
        "cliente_id": "c0680000-0000-4000-8000-000000000068",
        "nombre": "Valeria Pichardo Peña",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "valeria.pichardo@unidos.com.do",
        "telefono": "+1 (829) 702-3986",
        "es_principal": false,
        "creado_en": "2026-08-22T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-068-1",
        "cliente_id": "c0680000-0000-4000-8000-000000000068",
        "titulo": "Proyecto de Optimización Operativa y Automatización",
        "monto": 29720000,
        "etapa": "calificacion",
        "probabilidad": 30,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-08-22T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-068-1",
        "cliente_id": "c0680000-0000-4000-8000-000000000068",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Javier Jiménez Almonte.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-09-24T18:00:00.000Z"
      },
      {
        "id": "act-068-2",
        "cliente_id": "c0680000-0000-4000-8000-000000000068",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-08-22T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0690000-0000-4000-8000-000000000069",
    "codigo": "CLI-069",
    "razon_social": "Hipermercados Olé S.A.",
    "nombre_comercial": "Hipermercados Olé",
    "identificacion_fiscal": "1-31-52573-8",
    "sector": "Retail",
    "estado": "activo",
    "prioridad": "alta",
    "sitio_web": "https://www.hipermercadosole.com.do",
    "telefono": "+1 (809) 683-3967",
    "email": "info@hipermercadosole.com.do",
    "direccion": "Av. Sarasota No. 217, Sector Los Jardines",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 30140000,
    "responsable": "Roberto Méndez",
    "ultimo_contacto": "2026-09-22T18:00:00.000Z",
    "creado_en": "2026-08-19T18:00:00.000Z",
    "actualizado_en": "2026-10-02T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-069-1",
        "cliente_id": "c0690000-0000-4000-8000-000000000069",
        "nombre": "Gabriela Morales Jiménez",
        "cargo": "Director de Recursos Humanos & Talento",
        "email": "gabriela.morales@hipermercadosole.com.do",
        "telefono": "+1 (829) 696-3998",
        "es_principal": true,
        "creado_en": "2026-08-19T18:00:00.000Z"
      },
      {
        "id": "cnt-069-2",
        "cliente_id": "c0690000-0000-4000-8000-000000000069",
        "nombre": "Guillermo Corominas Rosario",
        "cargo": "Coordinador de Logística y Despacho",
        "email": "guillermo.corominas@hipermercadosole.com.do",
        "telefono": "+1 (849) 709-4029",
        "es_principal": false,
        "creado_en": "2026-08-19T18:00:00.000Z"
      },
      {
        "id": "cnt-069-3",
        "cliente_id": "c0690000-0000-4000-8000-000000000069",
        "nombre": "Raquel Pérez Bisonó",
        "cargo": "Especialista Senior de Compras Estratégicas",
        "email": "raquel.pérez@hipermercadosole.com.do",
        "telefono": "+1 (809) 722-4060",
        "es_principal": false,
        "creado_en": "2026-08-19T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-069-1",
        "cliente_id": "c0690000-0000-4000-8000-000000000069",
        "titulo": "Consultoría Estratégica y Plataforma Integral",
        "monto": 30140000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-08-19T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-069-1",
        "cliente_id": "c0690000-0000-4000-8000-000000000069",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Gabriela Morales Jiménez.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-09-22T18:00:00.000Z"
      },
      {
        "id": "act-069-2",
        "cliente_id": "c0690000-0000-4000-8000-000000000069",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-08-19T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0700000-0000-4000-8000-000000000070",
    "codigo": "CLI-070",
    "razon_social": "Distribuidora Corripio S.A.S.",
    "nombre_comercial": "Corripio Comercial",
    "identificacion_fiscal": "1-01-53190-2",
    "sector": "Retail",
    "estado": "activo",
    "prioridad": "media",
    "sitio_web": "https://www.corripio.com.do",
    "telefono": "+1 (829) 690-4010",
    "email": "info@corripio.com.do",
    "direccion": "Av. Estrella Sadhalá No. 220, Sector Villa Olga",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 30550000,
    "responsable": "Valentina Castillo",
    "ultimo_contacto": "2026-09-20T18:00:00.000Z",
    "creado_en": "2026-08-16T18:00:00.000Z",
    "actualizado_en": "2026-09-30T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-070-1",
        "cliente_id": "c0700000-0000-4000-8000-000000000070",
        "nombre": "Carlos Estrella Corominas",
        "cargo": "Gerente de Infraestructura & Operaciones TI",
        "email": "carlos.estrella@corripio.com.do",
        "telefono": "+1 (849) 703-4041",
        "es_principal": true,
        "creado_en": "2026-08-16T18:00:00.000Z"
      },
      {
        "id": "cnt-070-2",
        "cliente_id": "c0700000-0000-4000-8000-000000000070",
        "nombre": "Sofía Fernández Santana",
        "cargo": "Analista Financiero Principal",
        "email": "sofía.fernández@corripio.com.do",
        "telefono": "+1 (809) 716-4072",
        "es_principal": false,
        "creado_en": "2026-08-16T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-070-1",
        "cliente_id": "c0700000-0000-4000-8000-000000000070",
        "titulo": "Implementación y Licenciamiento Empresarial Cloud 2026",
        "monto": 30550000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-08-16T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-070-1",
        "cliente_id": "c0700000-0000-4000-8000-000000000070",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Carlos Estrella Corominas.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-09-20T18:00:00.000Z"
      },
      {
        "id": "act-070-2",
        "cliente_id": "c0700000-0000-4000-8000-000000000070",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-08-16T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0710000-0000-4000-8000-000000000071",
    "codigo": "CLI-071",
    "razon_social": "Casa Cuesta Home & Contract S.A.",
    "nombre_comercial": "Casa Cuesta Proyectos",
    "identificacion_fiscal": "1-31-53807-5",
    "sector": "Retail",
    "estado": "en_negociacion",
    "prioridad": "baja",
    "sitio_web": "https://www.casacuesta.com.do",
    "telefono": "+1 (849) 697-4053",
    "email": "info@casacuesta.com.do",
    "direccion": "Av. Juan Pablo Duarte No. 223, Sector Cerros de Gurabo",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 30970000,
    "responsable": "Marcos Almonte",
    "ultimo_contacto": "2026-09-18T18:00:00.000Z",
    "creado_en": "2026-08-13T18:00:00.000Z",
    "actualizado_en": "2026-09-28T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-071-1",
        "cliente_id": "c0710000-0000-4000-8000-000000000071",
        "nombre": "Teresa Bisonó Hernández",
        "cargo": "Director Comercial y Alianzas Corporativas",
        "email": "teresa.bisonó@casacuesta.com.do",
        "telefono": "+1 (809) 710-4084",
        "es_principal": true,
        "creado_en": "2026-08-13T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-071-1",
        "cliente_id": "c0710000-0000-4000-8000-000000000071",
        "titulo": "Contrato Marco de Suministro B2B Anual",
        "monto": 30970000,
        "etapa": "negociacion",
        "probabilidad": 75,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-08-13T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-071-1",
        "cliente_id": "c0710000-0000-4000-8000-000000000071",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Teresa Bisonó Hernández.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-09-18T18:00:00.000Z"
      },
      {
        "id": "act-071-2",
        "cliente_id": "c0710000-0000-4000-8000-000000000071",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-08-13T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0720000-0000-4000-8000-000000000072",
    "codigo": "CLI-072",
    "razon_social": "IKEA Dominicana S.A. - División Business",
    "nombre_comercial": "IKEA Business RD",
    "identificacion_fiscal": "1-01-54424-8",
    "sector": "Retail",
    "estado": "prospecto",
    "prioridad": "alta",
    "sitio_web": "https://www.ikea.com.do",
    "telefono": "+1 (809) 704-4096",
    "email": "info@ikea.com.do",
    "direccion": "Av. Winston Churchill No. 226, Sector Piantini",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 31380000,
    "responsable": "Daniela Rosario",
    "ultimo_contacto": "2026-09-16T18:00:00.000Z",
    "creado_en": "2026-08-10T18:00:00.000Z",
    "actualizado_en": "2026-09-26T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-072-1",
        "cliente_id": "c0720000-0000-4000-8000-000000000072",
        "nombre": "José Luis Troncoso Valdez",
        "cargo": "Director General de Operaciones",
        "email": "joséluis.troncoso@ikea.com.do",
        "telefono": "+1 (829) 717-4127",
        "es_principal": true,
        "creado_en": "2026-08-10T18:00:00.000Z"
      },
      {
        "id": "cnt-072-2",
        "cliente_id": "c0720000-0000-4000-8000-000000000072",
        "nombre": "Natalia Rodríguez De la Cruz",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "natalia.rodríguez@ikea.com.do",
        "telefono": "+1 (849) 730-4158",
        "es_principal": false,
        "creado_en": "2026-08-10T18:00:00.000Z"
      },
      {
        "id": "cnt-072-3",
        "cliente_id": "c0720000-0000-4000-8000-000000000072",
        "nombre": "Mario Mejía Sánchez",
        "cargo": "Líder de Proyectos de TI e Innovación",
        "email": "mario.mejía@ikea.com.do",
        "telefono": "+1 (809) 743-4189",
        "es_principal": false,
        "creado_en": "2026-08-10T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-072-1",
        "cliente_id": "c0720000-0000-4000-8000-000000000072",
        "titulo": "Renovación de Infraestructura y Soporte Crítico 24/7",
        "monto": 31380000,
        "etapa": "calificacion",
        "probabilidad": 30,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-08-10T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-072-1",
        "cliente_id": "c0720000-0000-4000-8000-000000000072",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con José Luis Troncoso Valdez.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-09-16T18:00:00.000Z"
      },
      {
        "id": "act-072-2",
        "cliente_id": "c0720000-0000-4000-8000-000000000072",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-08-10T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0730000-0000-4000-8000-000000000073",
    "codigo": "CLI-073",
    "razon_social": "Supermercados Bravo S.A.",
    "nombre_comercial": "Bravo Institucional",
    "identificacion_fiscal": "1-31-55041-2",
    "sector": "Retail",
    "estado": "inactivo",
    "prioridad": "media",
    "sitio_web": "https://www.superbravo.com.do",
    "telefono": "+1 (829) 711-4139",
    "email": "info@superbravo.com.do",
    "direccion": "Av. Abraham Lincoln No. 229, Sector Naco",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 31800000,
    "responsable": "Camila Morales",
    "ultimo_contacto": "2026-09-14T18:00:00.000Z",
    "creado_en": "2026-08-07T18:00:00.000Z",
    "actualizado_en": "2026-09-24T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-073-1",
        "cliente_id": "c0730000-0000-4000-8000-000000000073",
        "nombre": "Lucía Santana Vargas",
        "cargo": "Vicepresidente de Finanzas & Tesorería",
        "email": "lucía.santana@superbravo.com.do",
        "telefono": "+1 (849) 724-4170",
        "es_principal": true,
        "creado_en": "2026-08-07T18:00:00.000Z"
      }
    ],
    "oportunidades": [],
    "actividades": [
      {
        "id": "act-073-1",
        "cliente_id": "c0730000-0000-4000-8000-000000000073",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Lucía Santana Vargas.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-09-14T18:00:00.000Z"
      },
      {
        "id": "act-073-2",
        "cliente_id": "c0730000-0000-4000-8000-000000000073",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-08-07T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0740000-0000-4000-8000-000000000074",
    "codigo": "CLI-074",
    "razon_social": "Tiendas La Sirena Santiago S.A.",
    "nombre_comercial": "Sirena Santiago",
    "identificacion_fiscal": "1-01-55658-5",
    "sector": "Retail",
    "estado": "activo",
    "prioridad": "baja",
    "sitio_web": "https://www.sirena.com.do",
    "telefono": "+1 (849) 718-4182",
    "email": "info@sirena.com.do",
    "direccion": "Av. 27 de Febrero No. 232, Sector Bella Vista",
    "ciudad": "Santiago",
    "pais": "República Dominicana",
    "valor_estimado": 32210000,
    "responsable": "Ignacio Silva",
    "ultimo_contacto": "2026-09-12T18:00:00.000Z",
    "creado_en": "2026-08-04T18:00:00.000Z",
    "actualizado_en": "2026-09-22T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-074-1",
        "cliente_id": "c0740000-0000-4000-8000-000000000074",
        "nombre": "Víctor Pérez Bisonó",
        "cargo": "Director de Tecnología & Transformación Digital",
        "email": "víctor.pérez@sirena.com.do",
        "telefono": "+1 (809) 731-4213",
        "es_principal": true,
        "creado_en": "2026-08-04T18:00:00.000Z"
      },
      {
        "id": "cnt-074-2",
        "cliente_id": "c0740000-0000-4000-8000-000000000074",
        "nombre": "Andrea Báez Fernández",
        "cargo": "Analista Financiero Principal",
        "email": "andrea.báez@sirena.com.do",
        "telefono": "+1 (829) 744-4244",
        "es_principal": false,
        "creado_en": "2026-08-04T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-074-1",
        "cliente_id": "c0740000-0000-4000-8000-000000000074",
        "titulo": "Consultoría Estratégica y Plataforma Integral",
        "monto": 32210000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-08-04T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-074-1",
        "cliente_id": "c0740000-0000-4000-8000-000000000074",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Víctor Pérez Bisonó.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-09-12T18:00:00.000Z"
      },
      {
        "id": "act-074-2",
        "cliente_id": "c0740000-0000-4000-8000-000000000074",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-08-04T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0750000-0000-4000-8000-000000000075",
    "codigo": "CLI-075",
    "razon_social": "Ferretería Americana S.A.S. - B2B",
    "nombre_comercial": "Americana B2B",
    "identificacion_fiscal": "1-31-56275-8",
    "sector": "Retail",
    "estado": "en_negociacion",
    "prioridad": "alta",
    "sitio_web": "https://www.americana.com.do",
    "telefono": "+1 (809) 725-4225",
    "email": "info@americana.com.do",
    "direccion": "Av. John F. Kennedy No. 235, Sector Evaristo Morales",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 32630000,
    "responsable": "Felipe Guzmán",
    "ultimo_contacto": "2026-10-05T18:00:00.000Z",
    "creado_en": "2026-08-01T18:00:00.000Z",
    "actualizado_en": "2026-10-05T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-075-1",
        "cliente_id": "c0750000-0000-4000-8000-000000000075",
        "nombre": "Daniela Hernández Rodríguez",
        "cargo": "Gerente General de Compras & Cadena de Suministro",
        "email": "daniela.hernández@americana.com.do",
        "telefono": "+1 (829) 738-4256",
        "es_principal": true,
        "creado_en": "2026-08-01T18:00:00.000Z"
      },
      {
        "id": "cnt-075-2",
        "cliente_id": "c0750000-0000-4000-8000-000000000075",
        "nombre": "Manuel Guzmán Castillo",
        "cargo": "Gerente de Seguridad Industrial y Calidad",
        "email": "manuel.guzmán@americana.com.do",
        "telefono": "+1 (849) 751-4287",
        "es_principal": false,
        "creado_en": "2026-08-01T18:00:00.000Z"
      },
      {
        "id": "cnt-075-3",
        "cliente_id": "c0750000-0000-4000-8000-000000000075",
        "nombre": "Teresa De la Cruz Guzmán",
        "cargo": "Gerente de Cuentas por Pagar & Contabilidad",
        "email": "teresa.de la cruz@americana.com.do",
        "telefono": "+1 (809) 764-4318",
        "es_principal": false,
        "creado_en": "2026-08-01T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-075-1",
        "cliente_id": "c0750000-0000-4000-8000-000000000075",
        "titulo": "Implementación y Licenciamiento Empresarial Cloud 2026",
        "monto": 32630000,
        "etapa": "negociacion",
        "probabilidad": 75,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-08-01T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-075-1",
        "cliente_id": "c0750000-0000-4000-8000-000000000075",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Daniela Hernández Rodríguez.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-10-05T18:00:00.000Z"
      },
      {
        "id": "act-075-2",
        "cliente_id": "c0750000-0000-4000-8000-000000000075",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-08-01T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0760000-0000-4000-8000-000000000076",
    "codigo": "CLI-076",
    "razon_social": "Cervecería Nacional Dominicana S.A.",
    "nombre_comercial": "CND Corporativo",
    "identificacion_fiscal": "1-01-56892-2",
    "sector": "Manufactura",
    "estado": "activo",
    "prioridad": "media",
    "sitio_web": "https://www.cnd.com.do",
    "telefono": "+1 (829) 732-4268",
    "email": "info@cnd.com.do",
    "direccion": "Av. Lope de Vega No. 238, Sector La Julia",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 33040000,
    "responsable": "Laura Peña",
    "ultimo_contacto": "2026-10-03T18:00:00.000Z",
    "creado_en": "2026-07-29T18:00:00.000Z",
    "actualizado_en": "2026-10-03T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-076-1",
        "cliente_id": "c0760000-0000-4000-8000-000000000076",
        "nombre": "Pedro Castillo Taveras",
        "cargo": "Vicepresidente Ejecutivo de Administración",
        "email": "pedro.castillo@cnd.com.do",
        "telefono": "+1 (849) 745-4299",
        "es_principal": true,
        "creado_en": "2026-07-29T18:00:00.000Z"
      },
      {
        "id": "cnt-076-2",
        "cliente_id": "c0760000-0000-4000-8000-000000000076",
        "nombre": "Paola Valdez Reyes",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "paola.valdez@cnd.com.do",
        "telefono": "+1 (809) 758-4330",
        "es_principal": false,
        "creado_en": "2026-07-29T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-076-1",
        "cliente_id": "c0760000-0000-4000-8000-000000000076",
        "titulo": "Contrato Marco de Suministro B2B Anual",
        "monto": 33040000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-07-29T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-076-1",
        "cliente_id": "c0760000-0000-4000-8000-000000000076",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Pedro Castillo Taveras.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-10-03T18:00:00.000Z"
      },
      {
        "id": "act-076-2",
        "cliente_id": "c0760000-0000-4000-8000-000000000076",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-07-29T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0770000-0000-4000-8000-000000000077",
    "codigo": "CLI-077",
    "razon_social": "Plastifar S.A.",
    "nombre_comercial": "Plastifar Industrial",
    "identificacion_fiscal": "1-31-57509-5",
    "sector": "Manufactura",
    "estado": "activo",
    "prioridad": "baja",
    "sitio_web": "https://www.plastifar.com.do",
    "telefono": "+1 (849) 739-4311",
    "email": "info@plastifar.com.do",
    "direccion": "Av. Tiradentes No. 241, Sector Los Jardines",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 33460000,
    "responsable": "Roberto Méndez",
    "ultimo_contacto": "2026-10-01T18:00:00.000Z",
    "creado_en": "2026-07-26T18:00:00.000Z",
    "actualizado_en": "2026-10-01T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-077-1",
        "cliente_id": "c0770000-0000-4000-8000-000000000077",
        "nombre": "Elena Mejía Sánchez",
        "cargo": "Director de Recursos Humanos & Talento",
        "email": "elena.mejía@plastifar.com.do",
        "telefono": "+1 (809) 752-4342",
        "es_principal": true,
        "creado_en": "2026-07-26T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-077-1",
        "cliente_id": "c0770000-0000-4000-8000-000000000077",
        "titulo": "Renovación de Infraestructura y Soporte Crítico 24/7",
        "monto": 33460000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-07-26T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-077-1",
        "cliente_id": "c0770000-0000-4000-8000-000000000077",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Elena Mejía Sánchez.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-10-01T18:00:00.000Z"
      },
      {
        "id": "act-077-2",
        "cliente_id": "c0770000-0000-4000-8000-000000000077",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-07-26T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0780000-0000-4000-8000-000000000078",
    "codigo": "CLI-078",
    "razon_social": "Cementos Cibao S.A.",
    "nombre_comercial": "Cementos Cibao",
    "identificacion_fiscal": "1-01-58126-8",
    "sector": "Manufactura",
    "estado": "prospecto",
    "prioridad": "alta",
    "sitio_web": "https://www.cementoscibao.com.do",
    "telefono": "+1 (809) 746-4354",
    "email": "info@cementoscibao.com.do",
    "direccion": "Av. Sarasota No. 244, Sector Villa Olga",
    "ciudad": "Santiago",
    "pais": "República Dominicana",
    "valor_estimado": 33870000,
    "responsable": "Valentina Castillo",
    "ultimo_contacto": "2026-09-29T18:00:00.000Z",
    "creado_en": "2026-07-23T18:00:00.000Z",
    "actualizado_en": "2026-09-29T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-078-1",
        "cliente_id": "c0780000-0000-4000-8000-000000000078",
        "nombre": "Héctor Taveras Pichardo",
        "cargo": "Gerente de Infraestructura & Operaciones TI",
        "email": "héctor.taveras@cementoscibao.com.do",
        "telefono": "+1 (829) 759-4385",
        "es_principal": true,
        "creado_en": "2026-07-23T18:00:00.000Z"
      },
      {
        "id": "cnt-078-2",
        "cliente_id": "c0780000-0000-4000-8000-000000000078",
        "nombre": "Patricia Peña Troncoso",
        "cargo": "Analista Financiero Principal",
        "email": "patricia.peña@cementoscibao.com.do",
        "telefono": "+1 (849) 772-4416",
        "es_principal": false,
        "creado_en": "2026-07-23T18:00:00.000Z"
      },
      {
        "id": "cnt-078-3",
        "cliente_id": "c0780000-0000-4000-8000-000000000078",
        "nombre": "Alberto Cabrera García",
        "cargo": "Asesor Legal Corporativo",
        "email": "alberto.cabrera@cementoscibao.com.do",
        "telefono": "+1 (809) 785-4447",
        "es_principal": false,
        "creado_en": "2026-07-23T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-078-1",
        "cliente_id": "c0780000-0000-4000-8000-000000000078",
        "titulo": "Proyecto de Optimización Operativa y Automatización",
        "monto": 33870000,
        "etapa": "calificacion",
        "probabilidad": 30,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-07-23T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-078-1",
        "cliente_id": "c0780000-0000-4000-8000-000000000078",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Héctor Taveras Pichardo.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-09-29T18:00:00.000Z"
      },
      {
        "id": "act-078-2",
        "cliente_id": "c0780000-0000-4000-8000-000000000078",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-07-23T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0790000-0000-4000-8000-000000000079",
    "codigo": "CLI-079",
    "razon_social": "Domicem S.A.",
    "nombre_comercial": "Cemento Domicem",
    "identificacion_fiscal": "1-31-58743-2",
    "sector": "Manufactura",
    "estado": "activo",
    "prioridad": "media",
    "sitio_web": "https://www.domicem.com.do",
    "telefono": "+1 (829) 753-4397",
    "email": "info@domicem.com.do",
    "direccion": "Av. Estrella Sadhalá No. 247, Sector Cerros de Gurabo",
    "ciudad": "San Cristóbal",
    "pais": "República Dominicana",
    "valor_estimado": 34290000,
    "responsable": "Marcos Almonte",
    "ultimo_contacto": "2026-09-27T18:00:00.000Z",
    "creado_en": "2026-07-20T18:00:00.000Z",
    "actualizado_en": "2026-09-27T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-079-1",
        "cliente_id": "c0790000-0000-4000-8000-000000000079",
        "nombre": "Carolina Almonte Pérez",
        "cargo": "Director Comercial y Alianzas Corporativas",
        "email": "carolina.almonte@domicem.com.do",
        "telefono": "+1 (849) 766-4428",
        "es_principal": true,
        "creado_en": "2026-07-20T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-079-1",
        "cliente_id": "c0790000-0000-4000-8000-000000000079",
        "titulo": "Consultoría Estratégica y Plataforma Integral",
        "monto": 34290000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-07-20T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-079-1",
        "cliente_id": "c0790000-0000-4000-8000-000000000079",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Carolina Almonte Pérez.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-09-27T18:00:00.000Z"
      },
      {
        "id": "act-079-2",
        "cliente_id": "c0790000-0000-4000-8000-000000000079",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-07-20T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0800000-0000-4000-8000-000000000080",
    "codigo": "CLI-080",
    "razon_social": "Acero Estrella S.A.S.",
    "nombre_comercial": "Acero Estrella",
    "identificacion_fiscal": "1-01-59360-5",
    "sector": "Manufactura",
    "estado": "activo",
    "prioridad": "baja",
    "sitio_web": "https://www.aceroestrella.com.do",
    "telefono": "+1 (849) 760-4440",
    "email": "info@aceroestrella.com.do",
    "direccion": "Av. Juan Pablo Duarte No. 250, Sector Piantini",
    "ciudad": "Santiago",
    "pais": "República Dominicana",
    "valor_estimado": 34700000,
    "responsable": "Daniela Rosario",
    "ultimo_contacto": "2026-09-25T18:00:00.000Z",
    "creado_en": "2026-07-17T18:00:00.000Z",
    "actualizado_en": "2026-09-25T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-080-1",
        "cliente_id": "c0800000-0000-4000-8000-000000000080",
        "nombre": "Fernando De la Cruz Guzmán",
        "cargo": "Director General de Operaciones",
        "email": "fernando.de la cruz@aceroestrella.com.do",
        "telefono": "+1 (809) 773-4471",
        "es_principal": true,
        "creado_en": "2026-07-17T18:00:00.000Z"
      },
      {
        "id": "cnt-080-2",
        "cliente_id": "c0800000-0000-4000-8000-000000000080",
        "nombre": "Rosa María Jiménez Almonte",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "rosamaría.jiménez@aceroestrella.com.do",
        "telefono": "+1 (829) 786-4502",
        "es_principal": false,
        "creado_en": "2026-07-17T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-080-1",
        "cliente_id": "c0800000-0000-4000-8000-000000000080",
        "titulo": "Implementación y Licenciamiento Empresarial Cloud 2026",
        "monto": 34700000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-07-17T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-080-1",
        "cliente_id": "c0800000-0000-4000-8000-000000000080",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Fernando De la Cruz Guzmán.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-09-25T18:00:00.000Z"
      },
      {
        "id": "act-080-2",
        "cliente_id": "c0800000-0000-4000-8000-000000000080",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-07-17T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0810000-0000-4000-8000-000000000081",
    "codigo": "CLI-081",
    "razon_social": "Pinturas Tropical Dominicana S.A.",
    "nombre_comercial": "Pinturas Tropical",
    "identificacion_fiscal": "1-31-59977-8",
    "sector": "Manufactura",
    "estado": "en_negociacion",
    "prioridad": "alta",
    "sitio_web": "https://www.pinturastropical.do",
    "telefono": "+1 (809) 767-4483",
    "email": "info@pinturastropical.do",
    "direccion": "Av. Winston Churchill No. 253, Sector Naco",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 35120000,
    "responsable": "Camila Morales",
    "ultimo_contacto": "2026-09-23T18:00:00.000Z",
    "creado_en": "2026-07-14T18:00:00.000Z",
    "actualizado_en": "2026-09-23T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-081-1",
        "cliente_id": "c0810000-0000-4000-8000-000000000081",
        "nombre": "Carmen Mendoza Mendoza",
        "cargo": "Vicepresidente de Finanzas & Tesorería",
        "email": "carmen.mendoza@pinturastropical.do",
        "telefono": "+1 (829) 780-4514",
        "es_principal": true,
        "creado_en": "2026-07-14T18:00:00.000Z"
      },
      {
        "id": "cnt-081-2",
        "cliente_id": "c0810000-0000-4000-8000-000000000081",
        "nombre": "Rubén Morales Jiménez",
        "cargo": "Coordinador de Logística y Despacho",
        "email": "rubén.morales@pinturastropical.do",
        "telefono": "+1 (849) 793-4545",
        "es_principal": false,
        "creado_en": "2026-07-14T18:00:00.000Z"
      },
      {
        "id": "cnt-081-3",
        "cliente_id": "c0810000-0000-4000-8000-000000000081",
        "nombre": "Elena Corominas Rosario",
        "cargo": "Especialista Senior de Compras Estratégicas",
        "email": "elena.corominas@pinturastropical.do",
        "telefono": "+1 (809) 806-4576",
        "es_principal": false,
        "creado_en": "2026-07-14T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-081-1",
        "cliente_id": "c0810000-0000-4000-8000-000000000081",
        "titulo": "Contrato Marco de Suministro B2B Anual",
        "monto": 35120000,
        "etapa": "negociacion",
        "probabilidad": 75,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-07-14T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-081-1",
        "cliente_id": "c0810000-0000-4000-8000-000000000081",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Carmen Mendoza Mendoza.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-09-23T18:00:00.000Z"
      },
      {
        "id": "act-081-2",
        "cliente_id": "c0810000-0000-4000-8000-000000000081",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-07-14T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0820000-0000-4000-8000-000000000082",
    "codigo": "CLI-082",
    "razon_social": "Pinturas Popular S.A.",
    "nombre_comercial": "Pinturas Popular",
    "identificacion_fiscal": "1-01-60594-2",
    "sector": "Manufactura",
    "estado": "prospecto",
    "prioridad": "media",
    "sitio_web": "https://www.pinturaspopular.do",
    "telefono": "+1 (829) 774-4526",
    "email": "info@pinturaspopular.do",
    "direccion": "Av. Abraham Lincoln No. 256, Sector Bella Vista",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 35530000,
    "responsable": "Ignacio Silva",
    "ultimo_contacto": "2026-09-21T18:00:00.000Z",
    "creado_en": "2026-07-11T18:00:00.000Z",
    "actualizado_en": "2026-09-21T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-082-1",
        "cliente_id": "c0820000-0000-4000-8000-000000000082",
        "nombre": "Javier Vargas Estrella",
        "cargo": "Director de Tecnología & Transformación Digital",
        "email": "javier.vargas@pinturaspopular.do",
        "telefono": "+1 (849) 787-4557",
        "es_principal": true,
        "creado_en": "2026-07-11T18:00:00.000Z"
      },
      {
        "id": "cnt-082-2",
        "cliente_id": "c0820000-0000-4000-8000-000000000082",
        "nombre": "Claudia Estrella Corominas",
        "cargo": "Analista Financiero Principal",
        "email": "claudia.estrella@pinturaspopular.do",
        "telefono": "+1 (809) 800-4588",
        "es_principal": false,
        "creado_en": "2026-07-11T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-082-1",
        "cliente_id": "c0820000-0000-4000-8000-000000000082",
        "titulo": "Renovación de Infraestructura y Soporte Crítico 24/7",
        "monto": 35530000,
        "etapa": "calificacion",
        "probabilidad": 30,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-07-11T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-082-1",
        "cliente_id": "c0820000-0000-4000-8000-000000000082",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Javier Vargas Estrella.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-09-21T18:00:00.000Z"
      },
      {
        "id": "act-082-2",
        "cliente_id": "c0820000-0000-4000-8000-000000000082",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-07-11T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0830000-0000-4000-8000-000000000083",
    "codigo": "CLI-083",
    "razon_social": "Eaton Dominicana S.R.L. - Zona Franca",
    "nombre_comercial": "Eaton Dominicana",
    "identificacion_fiscal": "1-31-61211-5",
    "sector": "Manufactura",
    "estado": "activo",
    "prioridad": "baja",
    "sitio_web": "https://www.eaton.com.do",
    "telefono": "+1 (849) 781-4569",
    "email": "info@eaton.com.do",
    "direccion": "Av. 27 de Febrero No. 259, Sector Evaristo Morales",
    "ciudad": "San Cristóbal",
    "pais": "República Dominicana",
    "valor_estimado": 35950000,
    "responsable": "Felipe Guzmán",
    "ultimo_contacto": "2026-09-19T18:00:00.000Z",
    "creado_en": "2026-07-08T18:00:00.000Z",
    "actualizado_en": "2026-10-04T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-083-1",
        "cliente_id": "c0830000-0000-4000-8000-000000000083",
        "nombre": "Silvia Cabrera García",
        "cargo": "Gerente General de Compras & Cadena de Suministro",
        "email": "silvia.cabrera@eaton.com.do",
        "telefono": "+1 (809) 794-4600",
        "es_principal": true,
        "creado_en": "2026-07-08T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-083-1",
        "cliente_id": "c0830000-0000-4000-8000-000000000083",
        "titulo": "Proyecto de Optimización Operativa y Automatización",
        "monto": 35950000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-07-08T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-083-1",
        "cliente_id": "c0830000-0000-4000-8000-000000000083",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Silvia Cabrera García.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-09-19T18:00:00.000Z"
      },
      {
        "id": "act-083-2",
        "cliente_id": "c0830000-0000-4000-8000-000000000083",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-07-08T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0840000-0000-4000-8000-000000000084",
    "codigo": "CLI-084",
    "razon_social": "Medtronic Dominican Republic S.R.L.",
    "nombre_comercial": "Medtronic RD",
    "identificacion_fiscal": "1-01-61828-8",
    "sector": "Manufactura",
    "estado": "activo",
    "prioridad": "alta",
    "sitio_web": "https://www.medtronic.com.do",
    "telefono": "+1 (809) 788-4612",
    "email": "info@medtronic.com.do",
    "direccion": "Av. John F. Kennedy No. 262, Sector La Julia",
    "ciudad": "San Cristóbal",
    "pais": "República Dominicana",
    "valor_estimado": 36360000,
    "responsable": "Laura Peña",
    "ultimo_contacto": "2026-09-17T18:00:00.000Z",
    "creado_en": "2026-07-05T18:00:00.000Z",
    "actualizado_en": "2026-10-02T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-084-1",
        "cliente_id": "c0840000-0000-4000-8000-000000000084",
        "nombre": "Carlos Rosario Mejía",
        "cargo": "Vicepresidente Ejecutivo de Administración",
        "email": "carlos.rosario@medtronic.com.do",
        "telefono": "+1 (829) 801-4643",
        "es_principal": true,
        "creado_en": "2026-07-05T18:00:00.000Z"
      },
      {
        "id": "cnt-084-2",
        "cliente_id": "c0840000-0000-4000-8000-000000000084",
        "nombre": "Verónica Troncoso Valdez",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "verónica.troncoso@medtronic.com.do",
        "telefono": "+1 (849) 814-4674",
        "es_principal": false,
        "creado_en": "2026-07-05T18:00:00.000Z"
      },
      {
        "id": "cnt-084-3",
        "cliente_id": "c0840000-0000-4000-8000-000000000084",
        "nombre": "Miguel Ángel Rodríguez De la Cruz",
        "cargo": "Líder de Proyectos de TI e Innovación",
        "email": "miguelángel.rodríguez@medtronic.com.do",
        "telefono": "+1 (809) 827-4705",
        "es_principal": false,
        "creado_en": "2026-07-05T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-084-1",
        "cliente_id": "c0840000-0000-4000-8000-000000000084",
        "titulo": "Consultoría Estratégica y Plataforma Integral",
        "monto": 36360000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-07-05T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-084-1",
        "cliente_id": "c0840000-0000-4000-8000-000000000084",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Carlos Rosario Mejía.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-09-17T18:00:00.000Z"
      },
      {
        "id": "act-084-2",
        "cliente_id": "c0840000-0000-4000-8000-000000000084",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-07-05T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0850000-0000-4000-8000-000000000085",
    "codigo": "CLI-085",
    "razon_social": "Baxter Healthcare Caribe S.A.",
    "nombre_comercial": "Baxter San Cristóbal",
    "identificacion_fiscal": "1-31-62445-2",
    "sector": "Manufactura",
    "estado": "en_negociacion",
    "prioridad": "media",
    "sitio_web": "https://www.baxter.com.do",
    "telefono": "+1 (829) 795-4655",
    "email": "info@baxter.com.do",
    "direccion": "Av. Lope de Vega No. 265, Sector Los Jardines",
    "ciudad": "San Cristóbal",
    "pais": "República Dominicana",
    "valor_estimado": 36780000,
    "responsable": "Roberto Méndez",
    "ultimo_contacto": "2026-09-15T18:00:00.000Z",
    "creado_en": "2026-07-02T18:00:00.000Z",
    "actualizado_en": "2026-09-30T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-085-1",
        "cliente_id": "c0850000-0000-4000-8000-000000000085",
        "nombre": "Beatriz Pichardo Peña",
        "cargo": "Director de Recursos Humanos & Talento",
        "email": "beatriz.pichardo@baxter.com.do",
        "telefono": "+1 (849) 808-4686",
        "es_principal": true,
        "creado_en": "2026-07-02T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-085-1",
        "cliente_id": "c0850000-0000-4000-8000-000000000085",
        "titulo": "Implementación y Licenciamiento Empresarial Cloud 2026",
        "monto": 36780000,
        "etapa": "negociacion",
        "probabilidad": 75,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-07-02T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-085-1",
        "cliente_id": "c0850000-0000-4000-8000-000000000085",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Beatriz Pichardo Peña.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-09-15T18:00:00.000Z"
      },
      {
        "id": "act-085-2",
        "cliente_id": "c0850000-0000-4000-8000-000000000085",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-07-02T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0860000-0000-4000-8000-000000000086",
    "codigo": "CLI-086",
    "razon_social": "Edwards Lifesciences Dominican Republic S.A.",
    "nombre_comercial": "Edwards Lifesciences RD",
    "identificacion_fiscal": "1-01-63062-5",
    "sector": "Manufactura",
    "estado": "activo",
    "prioridad": "baja",
    "sitio_web": "https://www.edwards.com.do",
    "telefono": "+1 (849) 802-4698",
    "email": "info@edwards.com.do",
    "direccion": "Av. Tiradentes No. 268, Sector Villa Olga",
    "ciudad": "Haina",
    "pais": "República Dominicana",
    "valor_estimado": 37190000,
    "responsable": "Valentina Castillo",
    "ultimo_contacto": "2026-09-13T18:00:00.000Z",
    "creado_en": "2026-06-29T18:00:00.000Z",
    "actualizado_en": "2026-09-28T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-086-1",
        "cliente_id": "c0860000-0000-4000-8000-000000000086",
        "nombre": "José Luis Corominas Rosario",
        "cargo": "Gerente de Infraestructura & Operaciones TI",
        "email": "joséluis.corominas@edwards.com.do",
        "telefono": "+1 (809) 815-4729",
        "es_principal": true,
        "creado_en": "2026-06-29T18:00:00.000Z"
      },
      {
        "id": "cnt-086-2",
        "cliente_id": "c0860000-0000-4000-8000-000000000086",
        "nombre": "Mariela Pérez Bisonó",
        "cargo": "Analista Financiero Principal",
        "email": "mariela.pérez@edwards.com.do",
        "telefono": "+1 (829) 828-4760",
        "es_principal": false,
        "creado_en": "2026-06-29T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-086-1",
        "cliente_id": "c0860000-0000-4000-8000-000000000086",
        "titulo": "Contrato Marco de Suministro B2B Anual",
        "monto": 37190000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-06-29T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-086-1",
        "cliente_id": "c0860000-0000-4000-8000-000000000086",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con José Luis Corominas Rosario.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-09-13T18:00:00.000Z"
      },
      {
        "id": "act-086-2",
        "cliente_id": "c0860000-0000-4000-8000-000000000086",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-06-29T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0870000-0000-4000-8000-000000000087",
    "codigo": "CLI-087",
    "razon_social": "Smurfit Kappa Dominicana S.A.S.",
    "nombre_comercial": "Smurfit Kappa RD",
    "identificacion_fiscal": "1-31-63679-8",
    "sector": "Manufactura",
    "estado": "activo",
    "prioridad": "alta",
    "sitio_web": "https://www.smurfitkappa.com.do",
    "telefono": "+1 (809) 809-4741",
    "email": "info@smurfitkappa.com.do",
    "direccion": "Av. Sarasota No. 271, Sector Cerros de Gurabo",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 37610000,
    "responsable": "Marcos Almonte",
    "ultimo_contacto": "2026-09-11T18:00:00.000Z",
    "creado_en": "2026-06-26T18:00:00.000Z",
    "actualizado_en": "2026-09-26T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-087-1",
        "cliente_id": "c0870000-0000-4000-8000-000000000087",
        "nombre": "Valeria Fernández Santana",
        "cargo": "Director Comercial y Alianzas Corporativas",
        "email": "valeria.fernández@smurfitkappa.com.do",
        "telefono": "+1 (829) 822-4772",
        "es_principal": true,
        "creado_en": "2026-06-26T18:00:00.000Z"
      },
      {
        "id": "cnt-087-2",
        "cliente_id": "c0870000-0000-4000-8000-000000000087",
        "nombre": "Ramón Hernández Rodríguez",
        "cargo": "Gerente de Seguridad Industrial y Calidad",
        "email": "ramón.hernández@smurfitkappa.com.do",
        "telefono": "+1 (849) 835-4803",
        "es_principal": false,
        "creado_en": "2026-06-26T18:00:00.000Z"
      },
      {
        "id": "cnt-087-3",
        "cliente_id": "c0870000-0000-4000-8000-000000000087",
        "nombre": "Silvia Guzmán Castillo",
        "cargo": "Gerente de Cuentas por Pagar & Contabilidad",
        "email": "silvia.guzmán@smurfitkappa.com.do",
        "telefono": "+1 (809) 848-4834",
        "es_principal": false,
        "creado_en": "2026-06-26T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-087-1",
        "cliente_id": "c0870000-0000-4000-8000-000000000087",
        "titulo": "Renovación de Infraestructura y Soporte Crítico 24/7",
        "monto": 37610000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-06-26T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-087-1",
        "cliente_id": "c0870000-0000-4000-8000-000000000087",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Valeria Fernández Santana.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-09-11T18:00:00.000Z"
      },
      {
        "id": "act-087-2",
        "cliente_id": "c0870000-0000-4000-8000-000000000087",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-06-26T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0880000-0000-4000-8000-000000000088",
    "codigo": "CLI-088",
    "razon_social": "Envases Antillanos S.R.L.",
    "nombre_comercial": "Envases Antillanos",
    "identificacion_fiscal": "1-01-64296-2",
    "sector": "Manufactura",
    "estado": "prospecto",
    "prioridad": "media",
    "sitio_web": "https://www.envasesantillanos.do",
    "telefono": "+1 (829) 816-4784",
    "email": "info@envasesantillanos.do",
    "direccion": "Av. Estrella Sadhalá No. 274, Sector Piantini",
    "ciudad": "Santiago",
    "pais": "República Dominicana",
    "valor_estimado": 38020000,
    "responsable": "Daniela Rosario",
    "ultimo_contacto": "2026-10-04T18:00:00.000Z",
    "creado_en": "2026-06-23T18:00:00.000Z",
    "actualizado_en": "2026-09-24T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-088-1",
        "cliente_id": "c0880000-0000-4000-8000-000000000088",
        "nombre": "Víctor García Báez",
        "cargo": "Director General de Operaciones",
        "email": "víctor.garcía@envasesantillanos.do",
        "telefono": "+1 (849) 829-4815",
        "es_principal": true,
        "creado_en": "2026-06-23T18:00:00.000Z"
      },
      {
        "id": "cnt-088-2",
        "cliente_id": "c0880000-0000-4000-8000-000000000088",
        "nombre": "Raquel Castillo Taveras",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "raquel.castillo@envasesantillanos.do",
        "telefono": "+1 (809) 842-4846",
        "es_principal": false,
        "creado_en": "2026-06-23T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-088-1",
        "cliente_id": "c0880000-0000-4000-8000-000000000088",
        "titulo": "Proyecto de Optimización Operativa y Automatización",
        "monto": 38020000,
        "etapa": "calificacion",
        "probabilidad": 30,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-06-23T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-088-1",
        "cliente_id": "c0880000-0000-4000-8000-000000000088",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Víctor García Báez.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-10-04T18:00:00.000Z"
      },
      {
        "id": "act-088-2",
        "cliente_id": "c0880000-0000-4000-8000-000000000088",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-06-23T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0890000-0000-4000-8000-000000000089",
    "codigo": "CLI-089",
    "razon_social": "Termopac Industrial S.A.S.",
    "nombre_comercial": "Termopac",
    "identificacion_fiscal": "1-31-64913-5",
    "sector": "Manufactura",
    "estado": "cerrado_perdido",
    "prioridad": "baja",
    "sitio_web": "https://www.termopac.com.do",
    "telefono": "+1 (849) 823-4827",
    "email": "info@termopac.com.do",
    "direccion": "Av. Juan Pablo Duarte No. 277, Sector Naco",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 38440000,
    "responsable": "Camila Morales",
    "ultimo_contacto": "2026-10-02T18:00:00.000Z",
    "creado_en": "2026-06-20T18:00:00.000Z",
    "actualizado_en": "2026-09-22T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-089-1",
        "cliente_id": "c0890000-0000-4000-8000-000000000089",
        "nombre": "Sofía Rodríguez De la Cruz",
        "cargo": "Vicepresidente de Finanzas & Tesorería",
        "email": "sofía.rodríguez@termopac.com.do",
        "telefono": "+1 (809) 836-4858",
        "es_principal": true,
        "creado_en": "2026-06-20T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-089-1",
        "cliente_id": "c0890000-0000-4000-8000-000000000089",
        "titulo": "Consultoría Estratégica y Plataforma Integral",
        "monto": 38440000,
        "etapa": "perdida",
        "probabilidad": 0,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-06-20T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-089-1",
        "cliente_id": "c0890000-0000-4000-8000-000000000089",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Sofía Rodríguez De la Cruz.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-10-02T18:00:00.000Z"
      },
      {
        "id": "act-089-2",
        "cliente_id": "c0890000-0000-4000-8000-000000000089",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-06-20T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0900000-0000-4000-8000-000000000090",
    "codigo": "CLI-090",
    "razon_social": "Pasteurizadora Rica S.A.",
    "nombre_comercial": "Grupo Rica",
    "identificacion_fiscal": "1-01-65530-8",
    "sector": "Alimentos",
    "estado": "activo",
    "prioridad": "alta",
    "sitio_web": "https://www.gruporica.com",
    "telefono": "+1 (809) 830-4870",
    "email": "info@gruporica.com",
    "direccion": "Av. Winston Churchill No. 280, Sector Bella Vista",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 38850000,
    "responsable": "Ignacio Silva",
    "ultimo_contacto": "2026-09-30T18:00:00.000Z",
    "creado_en": "2026-06-17T18:00:00.000Z",
    "actualizado_en": "2026-10-05T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-090-1",
        "cliente_id": "c0900000-0000-4000-8000-000000000090",
        "nombre": "Pedro Martínez Morales",
        "cargo": "Director de Tecnología & Transformación Digital",
        "email": "pedro.martínez@gruporica.com",
        "telefono": "+1 (829) 843-4901",
        "es_principal": true,
        "creado_en": "2026-06-17T18:00:00.000Z"
      },
      {
        "id": "cnt-090-2",
        "cliente_id": "c0900000-0000-4000-8000-000000000090",
        "nombre": "Marisol Taveras Pichardo",
        "cargo": "Analista Financiero Principal",
        "email": "marisol.taveras@gruporica.com",
        "telefono": "+1 (849) 856-4932",
        "es_principal": false,
        "creado_en": "2026-06-17T18:00:00.000Z"
      },
      {
        "id": "cnt-090-3",
        "cliente_id": "c0900000-0000-4000-8000-000000000090",
        "nombre": "Andrés Peña Troncoso",
        "cargo": "Asesor Legal Corporativo",
        "email": "andrés.peña@gruporica.com",
        "telefono": "+1 (809) 869-4963",
        "es_principal": false,
        "creado_en": "2026-06-17T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-090-1",
        "cliente_id": "c0900000-0000-4000-8000-000000000090",
        "titulo": "Implementación y Licenciamiento Empresarial Cloud 2026",
        "monto": 38850000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-06-17T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-090-1",
        "cliente_id": "c0900000-0000-4000-8000-000000000090",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Pedro Martínez Morales.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-09-30T18:00:00.000Z"
      },
      {
        "id": "act-090-2",
        "cliente_id": "c0900000-0000-4000-8000-000000000090",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-06-17T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0910000-0000-4000-8000-000000000091",
    "codigo": "CLI-091",
    "razon_social": "MercaSID S.A. (Grupo SID)",
    "nombre_comercial": "MercaSID B2B",
    "identificacion_fiscal": "1-31-66147-2",
    "sector": "Alimentos",
    "estado": "en_negociacion",
    "prioridad": "media",
    "sitio_web": "https://www.mercasid.com.do",
    "telefono": "+1 (829) 837-4913",
    "email": "info@mercasid.com.do",
    "direccion": "Av. Abraham Lincoln No. 283, Sector Evaristo Morales",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 39270000,
    "responsable": "Felipe Guzmán",
    "ultimo_contacto": "2026-09-28T18:00:00.000Z",
    "creado_en": "2026-06-14T18:00:00.000Z",
    "actualizado_en": "2026-10-03T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-091-1",
        "cliente_id": "c0910000-0000-4000-8000-000000000091",
        "nombre": "Natalia Báez Fernández",
        "cargo": "Gerente General de Compras & Cadena de Suministro",
        "email": "natalia.báez@mercasid.com.do",
        "telefono": "+1 (849) 850-4944",
        "es_principal": true,
        "creado_en": "2026-06-14T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-091-1",
        "cliente_id": "c0910000-0000-4000-8000-000000000091",
        "titulo": "Contrato Marco de Suministro B2B Anual",
        "monto": 39270000,
        "etapa": "negociacion",
        "probabilidad": 75,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-06-14T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-091-1",
        "cliente_id": "c0910000-0000-4000-8000-000000000091",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Natalia Báez Fernández.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-09-28T18:00:00.000Z"
      },
      {
        "id": "act-091-2",
        "cliente_id": "c0910000-0000-4000-8000-000000000091",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-06-14T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0920000-0000-4000-8000-000000000092",
    "codigo": "CLI-092",
    "razon_social": "Induveca S.A. (Grupo SID)",
    "nombre_comercial": "Induveca Cárnicos",
    "identificacion_fiscal": "1-01-66764-5",
    "sector": "Alimentos",
    "estado": "prospecto",
    "prioridad": "baja",
    "sitio_web": "https://www.induveca.com.do",
    "telefono": "+1 (849) 844-4956",
    "email": "info@induveca.com.do",
    "direccion": "Av. 27 de Febrero No. 286, Sector La Julia",
    "ciudad": "La Vega",
    "pais": "República Dominicana",
    "valor_estimado": 39680000,
    "responsable": "Laura Peña",
    "ultimo_contacto": "2026-09-26T18:00:00.000Z",
    "creado_en": "2026-06-11T18:00:00.000Z",
    "actualizado_en": "2026-10-01T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-092-1",
        "cliente_id": "c0920000-0000-4000-8000-000000000092",
        "nombre": "Héctor Guzmán Castillo",
        "cargo": "Vicepresidente Ejecutivo de Administración",
        "email": "héctor.guzmán@induveca.com.do",
        "telefono": "+1 (809) 857-4987",
        "es_principal": true,
        "creado_en": "2026-06-11T18:00:00.000Z"
      },
      {
        "id": "cnt-092-2",
        "cliente_id": "c0920000-0000-4000-8000-000000000092",
        "nombre": "Gabriela De la Cruz Guzmán",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "gabriela.de la cruz@induveca.com.do",
        "telefono": "+1 (829) 870-5018",
        "es_principal": false,
        "creado_en": "2026-06-11T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-092-1",
        "cliente_id": "c0920000-0000-4000-8000-000000000092",
        "titulo": "Renovación de Infraestructura y Soporte Crítico 24/7",
        "monto": 39680000,
        "etapa": "calificacion",
        "probabilidad": 30,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-06-11T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-092-1",
        "cliente_id": "c0920000-0000-4000-8000-000000000092",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Héctor Guzmán Castillo.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-09-26T18:00:00.000Z"
      },
      {
        "id": "act-092-2",
        "cliente_id": "c0920000-0000-4000-8000-000000000092",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-06-11T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0930000-0000-4000-8000-000000000093",
    "codigo": "CLI-093",
    "razon_social": "Industrias Banilejas S.A.S. (INDUBAN)",
    "nombre_comercial": "Café Santo Domingo / Induban",
    "identificacion_fiscal": "1-31-67381-8",
    "sector": "Alimentos",
    "estado": "inactivo",
    "prioridad": "alta",
    "sitio_web": "https://www.induban.com.do",
    "telefono": "+1 (809) 851-4999",
    "email": "info@induban.com.do",
    "direccion": "Av. John F. Kennedy No. 289, Sector Los Jardines",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 40100000,
    "responsable": "Roberto Méndez",
    "ultimo_contacto": "2026-09-24T18:00:00.000Z",
    "creado_en": "2026-06-08T18:00:00.000Z",
    "actualizado_en": "2026-09-29T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-093-1",
        "cliente_id": "c0930000-0000-4000-8000-000000000093",
        "nombre": "Andrea Valdez Reyes",
        "cargo": "Director de Recursos Humanos & Talento",
        "email": "andrea.valdez@induban.com.do",
        "telefono": "+1 (829) 864-5030",
        "es_principal": true,
        "creado_en": "2026-06-08T18:00:00.000Z"
      },
      {
        "id": "cnt-093-2",
        "cliente_id": "c0930000-0000-4000-8000-000000000093",
        "nombre": "César Mendoza Mendoza",
        "cargo": "Coordinador de Logística y Despacho",
        "email": "césar.mendoza@induban.com.do",
        "telefono": "+1 (849) 877-5061",
        "es_principal": false,
        "creado_en": "2026-06-08T18:00:00.000Z"
      },
      {
        "id": "cnt-093-3",
        "cliente_id": "c0930000-0000-4000-8000-000000000093",
        "nombre": "Sofía Morales Jiménez",
        "cargo": "Especialista Senior de Compras Estratégicas",
        "email": "sofía.morales@induban.com.do",
        "telefono": "+1 (809) 890-5092",
        "es_principal": false,
        "creado_en": "2026-06-08T18:00:00.000Z"
      }
    ],
    "oportunidades": [],
    "actividades": [
      {
        "id": "act-093-1",
        "cliente_id": "c0930000-0000-4000-8000-000000000093",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Andrea Valdez Reyes.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-09-24T18:00:00.000Z"
      },
      {
        "id": "act-093-2",
        "cliente_id": "c0930000-0000-4000-8000-000000000093",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-06-08T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0940000-0000-4000-8000-000000000094",
    "codigo": "CLI-094",
    "razon_social": "Molinos del Ozama S.A.",
    "nombre_comercial": "Molinos del Ozama",
    "identificacion_fiscal": "1-01-67998-2",
    "sector": "Alimentos",
    "estado": "activo",
    "prioridad": "media",
    "sitio_web": "https://www.molinosozama.com.do",
    "telefono": "+1 (829) 858-5042",
    "email": "info@molinosozama.com.do",
    "direccion": "Av. Lope de Vega No. 292, Sector Villa Olga",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 40510000,
    "responsable": "Valentina Castillo",
    "ultimo_contacto": "2026-09-22T18:00:00.000Z",
    "creado_en": "2026-06-05T18:00:00.000Z",
    "actualizado_en": "2026-09-27T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-094-1",
        "cliente_id": "c0940000-0000-4000-8000-000000000094",
        "nombre": "Fernando Reyes Cabrera",
        "cargo": "Gerente de Infraestructura & Operaciones TI",
        "email": "fernando.reyes@molinosozama.com.do",
        "telefono": "+1 (849) 871-5073",
        "es_principal": true,
        "creado_en": "2026-06-05T18:00:00.000Z"
      },
      {
        "id": "cnt-094-2",
        "cliente_id": "c0940000-0000-4000-8000-000000000094",
        "nombre": "Teresa Vargas Estrella",
        "cargo": "Analista Financiero Principal",
        "email": "teresa.vargas@molinosozama.com.do",
        "telefono": "+1 (809) 884-5104",
        "es_principal": false,
        "creado_en": "2026-06-05T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-094-1",
        "cliente_id": "c0940000-0000-4000-8000-000000000094",
        "titulo": "Consultoría Estratégica y Plataforma Integral",
        "monto": 40510000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-06-05T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-094-1",
        "cliente_id": "c0940000-0000-4000-8000-000000000094",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Fernando Reyes Cabrera.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-09-22T18:00:00.000Z"
      },
      {
        "id": "act-094-2",
        "cliente_id": "c0940000-0000-4000-8000-000000000094",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-06-05T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0950000-0000-4000-8000-000000000095",
    "codigo": "CLI-095",
    "razon_social": "Casa Brugal S.A.",
    "nombre_comercial": "Brugal Corporativo",
    "identificacion_fiscal": "1-31-68615-5",
    "sector": "Alimentos",
    "estado": "en_negociacion",
    "prioridad": "baja",
    "sitio_web": "https://www.brugal.com.do",
    "telefono": "+1 (849) 865-5085",
    "email": "info@brugal.com.do",
    "direccion": "Av. Tiradentes No. 295, Sector Cerros de Gurabo",
    "ciudad": "Puerto Plata",
    "pais": "República Dominicana",
    "valor_estimado": 40930000,
    "responsable": "Marcos Almonte",
    "ultimo_contacto": "2026-09-20T18:00:00.000Z",
    "creado_en": "2026-06-02T18:00:00.000Z",
    "actualizado_en": "2026-09-25T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-095-1",
        "cliente_id": "c0950000-0000-4000-8000-000000000095",
        "nombre": "Paola Peña Troncoso",
        "cargo": "Director Comercial y Alianzas Corporativas",
        "email": "paola.peña@brugal.com.do",
        "telefono": "+1 (809) 878-5116",
        "es_principal": true,
        "creado_en": "2026-06-02T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-095-1",
        "cliente_id": "c0950000-0000-4000-8000-000000000095",
        "titulo": "Implementación y Licenciamiento Empresarial Cloud 2026",
        "monto": 40930000,
        "etapa": "negociacion",
        "probabilidad": 75,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-06-02T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-095-1",
        "cliente_id": "c0950000-0000-4000-8000-000000000095",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Paola Peña Troncoso.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-09-20T18:00:00.000Z"
      },
      {
        "id": "act-095-2",
        "cliente_id": "c0950000-0000-4000-8000-000000000095",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-06-02T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0960000-0000-4000-8000-000000000096",
    "codigo": "CLI-096",
    "razon_social": "Barceló Export Import S.A.S. (BEICA)",
    "nombre_comercial": "Ron Barceló",
    "identificacion_fiscal": "1-01-69232-8",
    "sector": "Alimentos",
    "estado": "activo",
    "prioridad": "alta",
    "sitio_web": "https://www.ronbarcelo.com.do",
    "telefono": "+1 (809) 872-5128",
    "email": "info@ronbarcelo.com.do",
    "direccion": "Av. Sarasota No. 298, Sector Piantini",
    "ciudad": "San Pedro de Macorís",
    "pais": "República Dominicana",
    "valor_estimado": 41340000,
    "responsable": "Daniela Rosario",
    "ultimo_contacto": "2026-09-18T18:00:00.000Z",
    "creado_en": "2026-05-30T18:00:00.000Z",
    "actualizado_en": "2026-09-23T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-096-1",
        "cliente_id": "c0960000-0000-4000-8000-000000000096",
        "nombre": "Javier Sánchez Martínez",
        "cargo": "Director General de Operaciones",
        "email": "javier.sánchez@ronbarcelo.com.do",
        "telefono": "+1 (829) 885-5159",
        "es_principal": true,
        "creado_en": "2026-05-30T18:00:00.000Z"
      },
      {
        "id": "cnt-096-2",
        "cliente_id": "c0960000-0000-4000-8000-000000000096",
        "nombre": "Lucía Rosario Mejía",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "lucía.rosario@ronbarcelo.com.do",
        "telefono": "+1 (849) 898-5190",
        "es_principal": false,
        "creado_en": "2026-05-30T18:00:00.000Z"
      },
      {
        "id": "cnt-096-3",
        "cliente_id": "c0960000-0000-4000-8000-000000000096",
        "nombre": "Gabriel Troncoso Valdez",
        "cargo": "Líder de Proyectos de TI e Innovación",
        "email": "gabriel.troncoso@ronbarcelo.com.do",
        "telefono": "+1 (809) 211-5221",
        "es_principal": false,
        "creado_en": "2026-05-30T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-096-1",
        "cliente_id": "c0960000-0000-4000-8000-000000000096",
        "titulo": "Contrato Marco de Suministro B2B Anual",
        "monto": 41340000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-05-30T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-096-1",
        "cliente_id": "c0960000-0000-4000-8000-000000000096",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Javier Sánchez Martínez.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-09-18T18:00:00.000Z"
      },
      {
        "id": "act-096-2",
        "cliente_id": "c0960000-0000-4000-8000-000000000096",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-05-30T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0970000-0000-4000-8000-000000000097",
    "codigo": "CLI-097",
    "razon_social": "Font Gamundi & Cía. S.A.S.",
    "nombre_comercial": "Arroz La Garza / Font Gamundi",
    "identificacion_fiscal": "1-31-69849-2",
    "sector": "Alimentos",
    "estado": "activo",
    "prioridad": "media",
    "sitio_web": "https://www.fontgamundi.com.do",
    "telefono": "+1 (829) 879-5171",
    "email": "info@fontgamundi.com.do",
    "direccion": "Av. Estrella Sadhalá No. 301, Sector Naco",
    "ciudad": "La Vega",
    "pais": "República Dominicana",
    "valor_estimado": 41760000,
    "responsable": "Camila Morales",
    "ultimo_contacto": "2026-09-16T18:00:00.000Z",
    "creado_en": "2026-05-27T18:00:00.000Z",
    "actualizado_en": "2026-09-21T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-097-1",
        "cliente_id": "c0970000-0000-4000-8000-000000000097",
        "nombre": "Patricia Jiménez Almonte",
        "cargo": "Vicepresidente de Finanzas & Tesorería",
        "email": "patricia.jiménez@fontgamundi.com.do",
        "telefono": "+1 (849) 892-5202",
        "es_principal": true,
        "creado_en": "2026-05-27T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-097-1",
        "cliente_id": "c0970000-0000-4000-8000-000000000097",
        "titulo": "Renovación de Infraestructura y Soporte Crítico 24/7",
        "monto": 41760000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-05-27T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-097-1",
        "cliente_id": "c0970000-0000-4000-8000-000000000097",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Patricia Jiménez Almonte.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-09-16T18:00:00.000Z"
      },
      {
        "id": "act-097-2",
        "cliente_id": "c0970000-0000-4000-8000-000000000097",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-05-27T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0980000-0000-4000-8000-000000000098",
    "codigo": "CLI-098",
    "razon_social": "J. Armando Bermúdez & Co. S.A.",
    "nombre_comercial": "Ron Bermúdez",
    "identificacion_fiscal": "1-01-70466-5",
    "sector": "Alimentos",
    "estado": "prospecto",
    "prioridad": "baja",
    "sitio_web": "https://www.ronbermudez.com.do",
    "telefono": "+1 (849) 886-5214",
    "email": "info@ronbermudez.com.do",
    "direccion": "Av. Juan Pablo Duarte No. 304, Sector Bella Vista",
    "ciudad": "Santiago",
    "pais": "República Dominicana",
    "valor_estimado": 42170000,
    "responsable": "Ignacio Silva",
    "ultimo_contacto": "2026-09-14T18:00:00.000Z",
    "creado_en": "2026-05-24T18:00:00.000Z",
    "actualizado_en": "2026-10-04T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-098-1",
        "cliente_id": "c0980000-0000-4000-8000-000000000098",
        "nombre": "Carlos Morales Jiménez",
        "cargo": "Director de Tecnología & Transformación Digital",
        "email": "carlos.morales@ronbermudez.com.do",
        "telefono": "+1 (809) 899-5245",
        "es_principal": true,
        "creado_en": "2026-05-24T18:00:00.000Z"
      },
      {
        "id": "cnt-098-2",
        "cliente_id": "c0980000-0000-4000-8000-000000000098",
        "nombre": "Daniela Corominas Rosario",
        "cargo": "Analista Financiero Principal",
        "email": "daniela.corominas@ronbermudez.com.do",
        "telefono": "+1 (829) 212-5276",
        "es_principal": false,
        "creado_en": "2026-05-24T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-098-1",
        "cliente_id": "c0980000-0000-4000-8000-000000000098",
        "titulo": "Proyecto de Optimización Operativa y Automatización",
        "monto": 42170000,
        "etapa": "calificacion",
        "probabilidad": 30,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-05-24T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-098-1",
        "cliente_id": "c0980000-0000-4000-8000-000000000098",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Carlos Morales Jiménez.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-09-14T18:00:00.000Z"
      },
      {
        "id": "act-098-2",
        "cliente_id": "c0980000-0000-4000-8000-000000000098",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-05-24T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c0990000-0000-4000-8000-000000000099",
    "codigo": "CLI-099",
    "razon_social": "Cervecería Vegana S.A.",
    "nombre_comercial": "Cervecería Vegana",
    "identificacion_fiscal": "1-31-71083-8",
    "sector": "Alimentos",
    "estado": "activo",
    "prioridad": "alta",
    "sitio_web": "https://www.cerveceriavegana.do",
    "telefono": "+1 (809) 893-5257",
    "email": "info@cerveceriavegana.do",
    "direccion": "Av. Winston Churchill No. 307, Sector Evaristo Morales",
    "ciudad": "La Vega",
    "pais": "República Dominicana",
    "valor_estimado": 42590000,
    "responsable": "Felipe Guzmán",
    "ultimo_contacto": "2026-09-12T18:00:00.000Z",
    "creado_en": "2026-05-21T18:00:00.000Z",
    "actualizado_en": "2026-10-02T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-099-1",
        "cliente_id": "c0990000-0000-4000-8000-000000000099",
        "nombre": "Rosa María Estrella Corominas",
        "cargo": "Gerente General de Compras & Cadena de Suministro",
        "email": "rosamaría.estrella@cerveceriavegana.do",
        "telefono": "+1 (829) 206-5288",
        "es_principal": true,
        "creado_en": "2026-05-21T18:00:00.000Z"
      },
      {
        "id": "cnt-099-2",
        "cliente_id": "c0990000-0000-4000-8000-000000000099",
        "nombre": "Ricardo Fernández Santana",
        "cargo": "Gerente de Seguridad Industrial y Calidad",
        "email": "ricardo.fernández@cerveceriavegana.do",
        "telefono": "+1 (849) 219-5319",
        "es_principal": false,
        "creado_en": "2026-05-21T18:00:00.000Z"
      },
      {
        "id": "cnt-099-3",
        "cliente_id": "c0990000-0000-4000-8000-000000000099",
        "nombre": "Paola Hernández Rodríguez",
        "cargo": "Gerente de Cuentas por Pagar & Contabilidad",
        "email": "paola.hernández@cerveceriavegana.do",
        "telefono": "+1 (809) 232-5350",
        "es_principal": false,
        "creado_en": "2026-05-21T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-099-1",
        "cliente_id": "c0990000-0000-4000-8000-000000000099",
        "titulo": "Consultoría Estratégica y Plataforma Integral",
        "monto": 42590000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-05-21T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-099-1",
        "cliente_id": "c0990000-0000-4000-8000-000000000099",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Rosa María Estrella Corominas.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-09-12T18:00:00.000Z"
      },
      {
        "id": "act-099-2",
        "cliente_id": "c0990000-0000-4000-8000-000000000099",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-05-21T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c1000000-0000-4000-8000-000000000100",
    "codigo": "CLI-100",
    "razon_social": "Rizek Cacao S.A.S.",
    "nombre_comercial": "Chocolates Rizek",
    "identificacion_fiscal": "1-01-71700-2",
    "sector": "Alimentos",
    "estado": "activo",
    "prioridad": "media",
    "sitio_web": "https://www.rizekcacao.com.do",
    "telefono": "+1 (829) 200-5300",
    "email": "info@rizekcacao.com.do",
    "direccion": "Av. Abraham Lincoln No. 10, Sector La Julia",
    "ciudad": "San Francisco de Macorís",
    "pais": "República Dominicana",
    "valor_estimado": 43000000,
    "responsable": "Laura Peña",
    "ultimo_contacto": "2026-10-05T18:00:00.000Z",
    "creado_en": "2026-05-18T18:00:00.000Z",
    "actualizado_en": "2026-09-30T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-100-1",
        "cliente_id": "c1000000-0000-4000-8000-000000000100",
        "nombre": "José Luis Bisonó Hernández",
        "cargo": "Vicepresidente Ejecutivo de Administración",
        "email": "joséluis.bisonó@rizekcacao.com.do",
        "telefono": "+1 (849) 213-5331",
        "es_principal": true,
        "creado_en": "2026-05-18T18:00:00.000Z"
      },
      {
        "id": "cnt-100-2",
        "cliente_id": "c1000000-0000-4000-8000-000000000100",
        "nombre": "Elena García Báez",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "elena.garcía@rizekcacao.com.do",
        "telefono": "+1 (809) 226-5362",
        "es_principal": false,
        "creado_en": "2026-05-18T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-100-1",
        "cliente_id": "c1000000-0000-4000-8000-000000000100",
        "titulo": "Implementación y Licenciamiento Empresarial Cloud 2026",
        "monto": 43000000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-05-18T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-100-1",
        "cliente_id": "c1000000-0000-4000-8000-000000000100",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con José Luis Bisonó Hernández.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-10-05T18:00:00.000Z"
      },
      {
        "id": "act-100-2",
        "cliente_id": "c1000000-0000-4000-8000-000000000100",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-05-18T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c1010000-0000-4000-8000-000000000101",
    "codigo": "CLI-101",
    "razon_social": "Helados Bon S.A.S. - B2B Institucional",
    "nombre_comercial": "Helados Bon Institucional",
    "identificacion_fiscal": "1-31-72317-5",
    "sector": "Alimentos",
    "estado": "en_negociacion",
    "prioridad": "baja",
    "sitio_web": "https://www.heladosbon.com.do",
    "telefono": "+1 (849) 207-5343",
    "email": "info@heladosbon.com.do",
    "direccion": "Av. 27 de Febrero No. 13, Sector Los Jardines",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 43420000,
    "responsable": "Roberto Méndez",
    "ultimo_contacto": "2026-10-03T18:00:00.000Z",
    "creado_en": "2026-05-15T18:00:00.000Z",
    "actualizado_en": "2026-09-28T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-101-1",
        "cliente_id": "c1010000-0000-4000-8000-000000000101",
        "nombre": "Claudia Troncoso Valdez",
        "cargo": "Director de Recursos Humanos & Talento",
        "email": "claudia.troncoso@heladosbon.com.do",
        "telefono": "+1 (809) 220-5374",
        "es_principal": true,
        "creado_en": "2026-05-15T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-101-1",
        "cliente_id": "c1010000-0000-4000-8000-000000000101",
        "titulo": "Contrato Marco de Suministro B2B Anual",
        "monto": 43420000,
        "etapa": "negociacion",
        "probabilidad": 75,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-05-15T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-101-1",
        "cliente_id": "c1010000-0000-4000-8000-000000000101",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Claudia Troncoso Valdez.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-10-03T18:00:00.000Z"
      },
      {
        "id": "act-101-2",
        "cliente_id": "c1010000-0000-4000-8000-000000000101",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-05-15T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c1020000-0000-4000-8000-000000000102",
    "codigo": "CLI-102",
    "razon_social": "Panificadora Pepín S.A.S.",
    "nombre_comercial": "Pan Pepín Corporativo",
    "identificacion_fiscal": "1-01-72934-8",
    "sector": "Alimentos",
    "estado": "prospecto",
    "prioridad": "alta",
    "sitio_web": "https://www.panpepin.com.do",
    "telefono": "+1 (809) 214-5386",
    "email": "info@panpepin.com.do",
    "direccion": "Av. John F. Kennedy No. 16, Sector Villa Olga",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 43830000,
    "responsable": "Valentina Castillo",
    "ultimo_contacto": "2026-10-01T18:00:00.000Z",
    "creado_en": "2026-05-12T18:00:00.000Z",
    "actualizado_en": "2026-09-26T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-102-1",
        "cliente_id": "c1020000-0000-4000-8000-000000000102",
        "nombre": "Víctor Santana Vargas",
        "cargo": "Gerente de Infraestructura & Operaciones TI",
        "email": "víctor.santana@panpepin.com.do",
        "telefono": "+1 (829) 227-5417",
        "es_principal": true,
        "creado_en": "2026-05-12T18:00:00.000Z"
      },
      {
        "id": "cnt-102-2",
        "cliente_id": "c1020000-0000-4000-8000-000000000102",
        "nombre": "Carolina Martínez Morales",
        "cargo": "Analista Financiero Principal",
        "email": "carolina.martínez@panpepin.com.do",
        "telefono": "+1 (849) 240-5448",
        "es_principal": false,
        "creado_en": "2026-05-12T18:00:00.000Z"
      },
      {
        "id": "cnt-102-3",
        "cliente_id": "c1020000-0000-4000-8000-000000000102",
        "nombre": "Rafael Taveras Pichardo",
        "cargo": "Asesor Legal Corporativo",
        "email": "rafael.taveras@panpepin.com.do",
        "telefono": "+1 (809) 253-5479",
        "es_principal": false,
        "creado_en": "2026-05-12T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-102-1",
        "cliente_id": "c1020000-0000-4000-8000-000000000102",
        "titulo": "Renovación de Infraestructura y Soporte Crítico 24/7",
        "monto": 43830000,
        "etapa": "calificacion",
        "probabilidad": 30,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-05-12T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-102-1",
        "cliente_id": "c1020000-0000-4000-8000-000000000102",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Víctor Santana Vargas.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-10-01T18:00:00.000Z"
      },
      {
        "id": "act-102-2",
        "cliente_id": "c1020000-0000-4000-8000-000000000102",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-05-12T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c1030000-0000-4000-8000-000000000103",
    "codigo": "CLI-103",
    "razon_social": "Cárnicos del Norte S.R.L. (Checo)",
    "nombre_comercial": "Embutidos Checo",
    "identificacion_fiscal": "1-31-73551-2",
    "sector": "Alimentos",
    "estado": "activo",
    "prioridad": "media",
    "sitio_web": "https://www.embutidoscheco.do",
    "telefono": "+1 (829) 221-5429",
    "email": "info@embutidoscheco.do",
    "direccion": "Av. Lope de Vega No. 19, Sector Cerros de Gurabo",
    "ciudad": "Santiago",
    "pais": "República Dominicana",
    "valor_estimado": 44250000,
    "responsable": "Marcos Almonte",
    "ultimo_contacto": "2026-09-29T18:00:00.000Z",
    "creado_en": "2026-05-09T18:00:00.000Z",
    "actualizado_en": "2026-09-24T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-103-1",
        "cliente_id": "c1030000-0000-4000-8000-000000000103",
        "nombre": "Verónica Pérez Bisonó",
        "cargo": "Director Comercial y Alianzas Corporativas",
        "email": "verónica.pérez@embutidoscheco.do",
        "telefono": "+1 (849) 234-5460",
        "es_principal": true,
        "creado_en": "2026-05-09T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-103-1",
        "cliente_id": "c1030000-0000-4000-8000-000000000103",
        "titulo": "Proyecto de Optimización Operativa y Automatización",
        "monto": 44250000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-05-09T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-103-1",
        "cliente_id": "c1030000-0000-4000-8000-000000000103",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Verónica Pérez Bisonó.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-09-29T18:00:00.000Z"
      },
      {
        "id": "act-103-2",
        "cliente_id": "c1030000-0000-4000-8000-000000000103",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-05-09T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c1040000-0000-4000-8000-000000000104",
    "codigo": "CLI-104",
    "razon_social": "Ferretería Bellón S.A.S.",
    "nombre_comercial": "Bellón Mayorista",
    "identificacion_fiscal": "1-01-74168-5",
    "sector": "Comercio",
    "estado": "activo",
    "prioridad": "baja",
    "sitio_web": "https://www.bellon.com.do",
    "telefono": "+1 (849) 228-5472",
    "email": "info@bellon.com.do",
    "direccion": "Av. Tiradentes No. 22, Sector Piantini",
    "ciudad": "Santiago",
    "pais": "República Dominicana",
    "valor_estimado": 44660000,
    "responsable": "Daniela Rosario",
    "ultimo_contacto": "2026-09-27T18:00:00.000Z",
    "creado_en": "2026-05-06T18:00:00.000Z",
    "actualizado_en": "2026-09-22T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-104-1",
        "cliente_id": "c1040000-0000-4000-8000-000000000104",
        "nombre": "Pedro Hernández Rodríguez",
        "cargo": "Director General de Operaciones",
        "email": "pedro.hernández@bellon.com.do",
        "telefono": "+1 (809) 241-5503",
        "es_principal": true,
        "creado_en": "2026-05-06T18:00:00.000Z"
      },
      {
        "id": "cnt-104-2",
        "cliente_id": "c1040000-0000-4000-8000-000000000104",
        "nombre": "Carmen Guzmán Castillo",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "carmen.guzmán@bellon.com.do",
        "telefono": "+1 (829) 254-5534",
        "es_principal": false,
        "creado_en": "2026-05-06T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-104-1",
        "cliente_id": "c1040000-0000-4000-8000-000000000104",
        "titulo": "Consultoría Estratégica y Plataforma Integral",
        "monto": 44660000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-05-06T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-104-1",
        "cliente_id": "c1040000-0000-4000-8000-000000000104",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Pedro Hernández Rodríguez.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-09-27T18:00:00.000Z"
      },
      {
        "id": "act-104-2",
        "cliente_id": "c1040000-0000-4000-8000-000000000104",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-05-06T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c1050000-0000-4000-8000-000000000105",
    "codigo": "CLI-105",
    "razon_social": "Ferretería Ochoa S.A.S.",
    "nombre_comercial": "Ochoa B2B",
    "identificacion_fiscal": "1-31-74785-8",
    "sector": "Comercio",
    "estado": "en_negociacion",
    "prioridad": "alta",
    "sitio_web": "https://www.ochoa.com.do",
    "telefono": "+1 (809) 235-5515",
    "email": "info@ochoa.com.do",
    "direccion": "Av. Sarasota No. 25, Sector Naco",
    "ciudad": "Santiago",
    "pais": "República Dominicana",
    "valor_estimado": 1580000,
    "responsable": "Camila Morales",
    "ultimo_contacto": "2026-09-25T18:00:00.000Z",
    "creado_en": "2026-05-03T18:00:00.000Z",
    "actualizado_en": "2026-10-05T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-105-1",
        "cliente_id": "c1050000-0000-4000-8000-000000000105",
        "nombre": "Mariela Castillo Taveras",
        "cargo": "Vicepresidente de Finanzas & Tesorería",
        "email": "mariela.castillo@ochoa.com.do",
        "telefono": "+1 (829) 248-5546",
        "es_principal": true,
        "creado_en": "2026-05-03T18:00:00.000Z"
      },
      {
        "id": "cnt-105-2",
        "cliente_id": "c1050000-0000-4000-8000-000000000105",
        "nombre": "Eduardo Valdez Reyes",
        "cargo": "Coordinador de Logística y Despacho",
        "email": "eduardo.valdez@ochoa.com.do",
        "telefono": "+1 (849) 261-5577",
        "es_principal": false,
        "creado_en": "2026-05-03T18:00:00.000Z"
      },
      {
        "id": "cnt-105-3",
        "cliente_id": "c1050000-0000-4000-8000-000000000105",
        "nombre": "Claudia Mendoza Mendoza",
        "cargo": "Especialista Senior de Compras Estratégicas",
        "email": "claudia.mendoza@ochoa.com.do",
        "telefono": "+1 (809) 274-5608",
        "es_principal": false,
        "creado_en": "2026-05-03T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-105-1",
        "cliente_id": "c1050000-0000-4000-8000-000000000105",
        "titulo": "Implementación y Licenciamiento Empresarial Cloud 2026",
        "monto": 1580000,
        "etapa": "negociacion",
        "probabilidad": 75,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-05-03T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-105-1",
        "cliente_id": "c1050000-0000-4000-8000-000000000105",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Mariela Castillo Taveras.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-09-25T18:00:00.000Z"
      },
      {
        "id": "act-105-2",
        "cliente_id": "c1050000-0000-4000-8000-000000000105",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-05-03T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c1060000-0000-4000-8000-000000000106",
    "codigo": "CLI-106",
    "razon_social": "Santo Domingo Motors Company S.A.",
    "nombre_comercial": "Santo Domingo Motors Flotas",
    "identificacion_fiscal": "1-01-75402-2",
    "sector": "Comercio",
    "estado": "activo",
    "prioridad": "media",
    "sitio_web": "https://www.sdm.com.do",
    "telefono": "+1 (829) 242-5558",
    "email": "info@sdm.com.do",
    "direccion": "Av. Estrella Sadhalá No. 28, Sector Bella Vista",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 1990000,
    "responsable": "Ignacio Silva",
    "ultimo_contacto": "2026-09-23T18:00:00.000Z",
    "creado_en": "2026-04-30T18:00:00.000Z",
    "actualizado_en": "2026-10-03T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-106-1",
        "cliente_id": "c1060000-0000-4000-8000-000000000106",
        "nombre": "Héctor Mejía Sánchez",
        "cargo": "Director de Tecnología & Transformación Digital",
        "email": "héctor.mejía@sdm.com.do",
        "telefono": "+1 (849) 255-5589",
        "es_principal": true,
        "creado_en": "2026-04-30T18:00:00.000Z"
      },
      {
        "id": "cnt-106-2",
        "cliente_id": "c1060000-0000-4000-8000-000000000106",
        "nombre": "Silvia Reyes Cabrera",
        "cargo": "Analista Financiero Principal",
        "email": "silvia.reyes@sdm.com.do",
        "telefono": "+1 (809) 268-5620",
        "es_principal": false,
        "creado_en": "2026-04-30T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-106-1",
        "cliente_id": "c1060000-0000-4000-8000-000000000106",
        "titulo": "Contrato Marco de Suministro B2B Anual",
        "monto": 1990000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-04-30T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-106-1",
        "cliente_id": "c1060000-0000-4000-8000-000000000106",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Héctor Mejía Sánchez.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-09-23T18:00:00.000Z"
      },
      {
        "id": "act-106-2",
        "cliente_id": "c1060000-0000-4000-8000-000000000106",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-04-30T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c1070000-0000-4000-8000-000000000107",
    "codigo": "CLI-107",
    "razon_social": "Grupo Viamar S.A. - División Flotillas",
    "nombre_comercial": "Grupo Viamar Flotas",
    "identificacion_fiscal": "1-31-76019-5",
    "sector": "Comercio",
    "estado": "activo",
    "prioridad": "baja",
    "sitio_web": "https://www.viamar.com.do",
    "telefono": "+1 (849) 249-5601",
    "email": "info@viamar.com.do",
    "direccion": "Av. Juan Pablo Duarte No. 31, Sector Evaristo Morales",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 2410000,
    "responsable": "Felipe Guzmán",
    "ultimo_contacto": "2026-09-21T18:00:00.000Z",
    "creado_en": "2026-04-27T18:00:00.000Z",
    "actualizado_en": "2026-10-01T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-107-1",
        "cliente_id": "c1070000-0000-4000-8000-000000000107",
        "nombre": "Raquel Taveras Pichardo",
        "cargo": "Gerente General de Compras & Cadena de Suministro",
        "email": "raquel.taveras@viamar.com.do",
        "telefono": "+1 (809) 262-5632",
        "es_principal": true,
        "creado_en": "2026-04-27T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-107-1",
        "cliente_id": "c1070000-0000-4000-8000-000000000107",
        "titulo": "Renovación de Infraestructura y Soporte Crítico 24/7",
        "monto": 2410000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-04-27T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-107-1",
        "cliente_id": "c1070000-0000-4000-8000-000000000107",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Raquel Taveras Pichardo.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-09-21T18:00:00.000Z"
      },
      {
        "id": "act-107-2",
        "cliente_id": "c1070000-0000-4000-8000-000000000107",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-04-27T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c1080000-0000-4000-8000-000000000108",
    "codigo": "CLI-108",
    "razon_social": "Delta Comercial S.A.S. (Toyota RD)",
    "nombre_comercial": "Delta Comercial Corporativo",
    "identificacion_fiscal": "1-01-76636-8",
    "sector": "Comercio",
    "estado": "prospecto",
    "prioridad": "alta",
    "sitio_web": "https://www.deltacomercial.com.do",
    "telefono": "+1 (809) 256-5644",
    "email": "info@deltacomercial.com.do",
    "direccion": "Av. Winston Churchill No. 34, Sector La Julia",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 2820000,
    "responsable": "Laura Peña",
    "ultimo_contacto": "2026-09-19T18:00:00.000Z",
    "creado_en": "2026-04-24T18:00:00.000Z",
    "actualizado_en": "2026-09-29T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-108-1",
        "cliente_id": "c1080000-0000-4000-8000-000000000108",
        "nombre": "Fernando Almonte Pérez",
        "cargo": "Vicepresidente Ejecutivo de Administración",
        "email": "fernando.almonte@deltacomercial.com.do",
        "telefono": "+1 (829) 269-5675",
        "es_principal": true,
        "creado_en": "2026-04-24T18:00:00.000Z"
      },
      {
        "id": "cnt-108-2",
        "cliente_id": "c1080000-0000-4000-8000-000000000108",
        "nombre": "Beatriz Sánchez Martínez",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "beatriz.sánchez@deltacomercial.com.do",
        "telefono": "+1 (849) 282-5706",
        "es_principal": false,
        "creado_en": "2026-04-24T18:00:00.000Z"
      },
      {
        "id": "cnt-108-3",
        "cliente_id": "c1080000-0000-4000-8000-000000000108",
        "nombre": "Alejandro Rosario Mejía",
        "cargo": "Líder de Proyectos de TI e Innovación",
        "email": "alejandro.rosario@deltacomercial.com.do",
        "telefono": "+1 (809) 295-5737",
        "es_principal": false,
        "creado_en": "2026-04-24T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-108-1",
        "cliente_id": "c1080000-0000-4000-8000-000000000108",
        "titulo": "Proyecto de Optimización Operativa y Automatización",
        "monto": 2820000,
        "etapa": "calificacion",
        "probabilidad": 30,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-04-24T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-108-1",
        "cliente_id": "c1080000-0000-4000-8000-000000000108",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Fernando Almonte Pérez.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-09-19T18:00:00.000Z"
      },
      {
        "id": "act-108-2",
        "cliente_id": "c1080000-0000-4000-8000-000000000108",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-04-24T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c1090000-0000-4000-8000-000000000109",
    "codigo": "CLI-109",
    "razon_social": "Magna Motors S.A. (Hyundai B2B)",
    "nombre_comercial": "Magna Motors Flotillas",
    "identificacion_fiscal": "1-31-77253-2",
    "sector": "Comercio",
    "estado": "activo",
    "prioridad": "media",
    "sitio_web": "https://www.magnamotors.com.do",
    "telefono": "+1 (829) 263-5687",
    "email": "info@magnamotors.com.do",
    "direccion": "Av. Abraham Lincoln No. 37, Sector Los Jardines",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 3240000,
    "responsable": "Roberto Méndez",
    "ultimo_contacto": "2026-09-17T18:00:00.000Z",
    "creado_en": "2026-04-21T18:00:00.000Z",
    "actualizado_en": "2026-09-27T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-109-1",
        "cliente_id": "c1090000-0000-4000-8000-000000000109",
        "nombre": "Marisol De la Cruz Guzmán",
        "cargo": "Director de Recursos Humanos & Talento",
        "email": "marisol.de la cruz@magnamotors.com.do",
        "telefono": "+1 (849) 276-5718",
        "es_principal": true,
        "creado_en": "2026-04-21T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-109-1",
        "cliente_id": "c1090000-0000-4000-8000-000000000109",
        "titulo": "Consultoría Estratégica y Plataforma Integral",
        "monto": 3240000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-04-21T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-109-1",
        "cliente_id": "c1090000-0000-4000-8000-000000000109",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Marisol De la Cruz Guzmán.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-09-17T18:00:00.000Z"
      },
      {
        "id": "act-109-2",
        "cliente_id": "c1090000-0000-4000-8000-000000000109",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-04-21T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c1100000-0000-4000-8000-000000000110",
    "codigo": "CLI-110",
    "razon_social": "Autozama S.A.S. (Mercedes-Benz Flotas)",
    "nombre_comercial": "Autozama Corporativo",
    "identificacion_fiscal": "1-01-77870-5",
    "sector": "Comercio",
    "estado": "activo",
    "prioridad": "baja",
    "sitio_web": "https://www.autozama.com.do",
    "telefono": "+1 (849) 270-5730",
    "email": "info@autozama.com.do",
    "direccion": "Av. 27 de Febrero No. 40, Sector Villa Olga",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 3650000,
    "responsable": "Valentina Castillo",
    "ultimo_contacto": "2026-09-15T18:00:00.000Z",
    "creado_en": "2026-04-18T18:00:00.000Z",
    "actualizado_en": "2026-09-25T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-110-1",
        "cliente_id": "c1100000-0000-4000-8000-000000000110",
        "nombre": "Javier Mendoza Mendoza",
        "cargo": "Gerente de Infraestructura & Operaciones TI",
        "email": "javier.mendoza@autozama.com.do",
        "telefono": "+1 (809) 283-5761",
        "es_principal": true,
        "creado_en": "2026-04-18T18:00:00.000Z"
      },
      {
        "id": "cnt-110-2",
        "cliente_id": "c1100000-0000-4000-8000-000000000110",
        "nombre": "Valeria Morales Jiménez",
        "cargo": "Analista Financiero Principal",
        "email": "valeria.morales@autozama.com.do",
        "telefono": "+1 (829) 296-5792",
        "es_principal": false,
        "creado_en": "2026-04-18T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-110-1",
        "cliente_id": "c1100000-0000-4000-8000-000000000110",
        "titulo": "Implementación y Licenciamiento Empresarial Cloud 2026",
        "monto": 3650000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-04-18T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-110-1",
        "cliente_id": "c1100000-0000-4000-8000-000000000110",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Javier Mendoza Mendoza.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-09-15T18:00:00.000Z"
      },
      {
        "id": "act-110-2",
        "cliente_id": "c1100000-0000-4000-8000-000000000110",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Valentina Castillo",
        "fecha": "2026-04-18T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c1110000-0000-4000-8000-000000000111",
    "codigo": "CLI-111",
    "razon_social": "Reid & Pellerano S.A.S.",
    "nombre_comercial": "Reid Comercial Flotas",
    "identificacion_fiscal": "1-31-78487-8",
    "sector": "Comercio",
    "estado": "en_negociacion",
    "prioridad": "alta",
    "sitio_web": "https://www.reid.com.do",
    "telefono": "+1 (809) 277-5773",
    "email": "info@reid.com.do",
    "direccion": "Av. John F. Kennedy No. 43, Sector Cerros de Gurabo",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 4070000,
    "responsable": "Marcos Almonte",
    "ultimo_contacto": "2026-09-13T18:00:00.000Z",
    "creado_en": "2026-04-15T18:00:00.000Z",
    "actualizado_en": "2026-09-23T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-111-1",
        "cliente_id": "c1110000-0000-4000-8000-000000000111",
        "nombre": "Gabriela Vargas Estrella",
        "cargo": "Director Comercial y Alianzas Corporativas",
        "email": "gabriela.vargas@reid.com.do",
        "telefono": "+1 (829) 290-5804",
        "es_principal": true,
        "creado_en": "2026-04-15T18:00:00.000Z"
      },
      {
        "id": "cnt-111-2",
        "cliente_id": "c1110000-0000-4000-8000-000000000111",
        "nombre": "Guillermo Estrella Corominas",
        "cargo": "Gerente de Seguridad Industrial y Calidad",
        "email": "guillermo.estrella@reid.com.do",
        "telefono": "+1 (849) 303-5835",
        "es_principal": false,
        "creado_en": "2026-04-15T18:00:00.000Z"
      },
      {
        "id": "cnt-111-3",
        "cliente_id": "c1110000-0000-4000-8000-000000000111",
        "nombre": "Raquel Fernández Santana",
        "cargo": "Gerente de Cuentas por Pagar & Contabilidad",
        "email": "raquel.fernández@reid.com.do",
        "telefono": "+1 (809) 316-5866",
        "es_principal": false,
        "creado_en": "2026-04-15T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-111-1",
        "cliente_id": "c1110000-0000-4000-8000-000000000111",
        "titulo": "Contrato Marco de Suministro B2B Anual",
        "monto": 4070000,
        "etapa": "negociacion",
        "probabilidad": 75,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-04-15T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-111-1",
        "cliente_id": "c1110000-0000-4000-8000-000000000111",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Gabriela Vargas Estrella.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-09-13T18:00:00.000Z"
      },
      {
        "id": "act-111-2",
        "cliente_id": "c1110000-0000-4000-8000-000000000111",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Marcos Almonte",
        "fecha": "2026-04-15T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c1120000-0000-4000-8000-000000000112",
    "codigo": "CLI-112",
    "razon_social": "Distribuidora Haché S.A.S.",
    "nombre_comercial": "Haché Comercial",
    "identificacion_fiscal": "1-01-79104-2",
    "sector": "Comercio",
    "estado": "prospecto",
    "prioridad": "media",
    "sitio_web": "https://www.hache.com.do",
    "telefono": "+1 (829) 284-5816",
    "email": "info@hache.com.do",
    "direccion": "Av. Lope de Vega No. 46, Sector Piantini",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 4480000,
    "responsable": "Daniela Rosario",
    "ultimo_contacto": "2026-09-11T18:00:00.000Z",
    "creado_en": "2026-04-12T18:00:00.000Z",
    "actualizado_en": "2026-09-21T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-112-1",
        "cliente_id": "c1120000-0000-4000-8000-000000000112",
        "nombre": "Carlos Cabrera García",
        "cargo": "Director General de Operaciones",
        "email": "carlos.cabrera@hache.com.do",
        "telefono": "+1 (849) 297-5847",
        "es_principal": true,
        "creado_en": "2026-04-12T18:00:00.000Z"
      },
      {
        "id": "cnt-112-2",
        "cliente_id": "c1120000-0000-4000-8000-000000000112",
        "nombre": "Sofía Bisonó Hernández",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "sofía.bisonó@hache.com.do",
        "telefono": "+1 (809) 310-5878",
        "es_principal": false,
        "creado_en": "2026-04-12T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-112-1",
        "cliente_id": "c1120000-0000-4000-8000-000000000112",
        "titulo": "Renovación de Infraestructura y Soporte Crítico 24/7",
        "monto": 4480000,
        "etapa": "calificacion",
        "probabilidad": 30,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-04-12T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-112-1",
        "cliente_id": "c1120000-0000-4000-8000-000000000112",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Carlos Cabrera García.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-09-11T18:00:00.000Z"
      },
      {
        "id": "act-112-2",
        "cliente_id": "c1120000-0000-4000-8000-000000000112",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Daniela Rosario",
        "fecha": "2026-04-12T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c1130000-0000-4000-8000-000000000113",
    "codigo": "CLI-113",
    "razon_social": "Equipos Pesados Antillanos S.A. (EPANSA)",
    "nombre_comercial": "EPANSA Maquinarias",
    "identificacion_fiscal": "1-31-79721-5",
    "sector": "Comercio",
    "estado": "inactivo",
    "prioridad": "baja",
    "sitio_web": "https://www.epansa.com.do",
    "telefono": "+1 (849) 291-5859",
    "email": "info@epansa.com.do",
    "direccion": "Av. Tiradentes No. 49, Sector Naco",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 4900000,
    "responsable": "Camila Morales",
    "ultimo_contacto": "2026-10-04T18:00:00.000Z",
    "creado_en": "2026-04-09T18:00:00.000Z",
    "actualizado_en": "2026-10-04T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-113-1",
        "cliente_id": "c1130000-0000-4000-8000-000000000113",
        "nombre": "Teresa Rosario Mejía",
        "cargo": "Vicepresidente de Finanzas & Tesorería",
        "email": "teresa.rosario@epansa.com.do",
        "telefono": "+1 (809) 304-5890",
        "es_principal": true,
        "creado_en": "2026-04-09T18:00:00.000Z"
      }
    ],
    "oportunidades": [],
    "actividades": [
      {
        "id": "act-113-1",
        "cliente_id": "c1130000-0000-4000-8000-000000000113",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Teresa Rosario Mejía.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-10-04T18:00:00.000Z"
      },
      {
        "id": "act-113-2",
        "cliente_id": "c1130000-0000-4000-8000-000000000113",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Camila Morales",
        "fecha": "2026-04-09T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c1140000-0000-4000-8000-000000000114",
    "codigo": "CLI-114",
    "razon_social": "Surtidora Médica del Caribe S.R.L.",
    "nombre_comercial": "Surtidora Médica B2B",
    "identificacion_fiscal": "1-01-80338-8",
    "sector": "Comercio",
    "estado": "activo",
    "prioridad": "alta",
    "sitio_web": "https://www.surmedicacaribe.do",
    "telefono": "+1 (809) 298-5902",
    "email": "info@surmedicacaribe.do",
    "direccion": "Av. Sarasota No. 52, Sector Bella Vista",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 5310000,
    "responsable": "Ignacio Silva",
    "ultimo_contacto": "2026-10-02T18:00:00.000Z",
    "creado_en": "2026-04-06T18:00:00.000Z",
    "actualizado_en": "2026-10-02T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-114-1",
        "cliente_id": "c1140000-0000-4000-8000-000000000114",
        "nombre": "José Luis Pichardo Peña",
        "cargo": "Director de Tecnología & Transformación Digital",
        "email": "joséluis.pichardo@surmedicacaribe.do",
        "telefono": "+1 (829) 311-5933",
        "es_principal": true,
        "creado_en": "2026-04-06T18:00:00.000Z"
      },
      {
        "id": "cnt-114-2",
        "cliente_id": "c1140000-0000-4000-8000-000000000114",
        "nombre": "Natalia Santana Vargas",
        "cargo": "Analista Financiero Principal",
        "email": "natalia.santana@surmedicacaribe.do",
        "telefono": "+1 (849) 324-5964",
        "es_principal": false,
        "creado_en": "2026-04-06T18:00:00.000Z"
      },
      {
        "id": "cnt-114-3",
        "cliente_id": "c1140000-0000-4000-8000-000000000114",
        "nombre": "Mario Martínez Morales",
        "cargo": "Asesor Legal Corporativo",
        "email": "mario.martínez@surmedicacaribe.do",
        "telefono": "+1 (809) 337-5995",
        "es_principal": false,
        "creado_en": "2026-04-06T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-114-1",
        "cliente_id": "c1140000-0000-4000-8000-000000000114",
        "titulo": "Consultoría Estratégica y Plataforma Integral",
        "monto": 5310000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-04-06T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-114-1",
        "cliente_id": "c1140000-0000-4000-8000-000000000114",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con José Luis Pichardo Peña.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-10-02T18:00:00.000Z"
      },
      {
        "id": "act-114-2",
        "cliente_id": "c1140000-0000-4000-8000-000000000114",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Ignacio Silva",
        "fecha": "2026-04-06T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c1150000-0000-4000-8000-000000000115",
    "codigo": "CLI-115",
    "razon_social": "Suplidora Industrial Dominicana S.A. (SUINDSA)",
    "nombre_comercial": "SUINDSA Suministros",
    "identificacion_fiscal": "1-31-80955-2",
    "sector": "Comercio",
    "estado": "en_negociacion",
    "prioridad": "media",
    "sitio_web": "https://www.suindsa.com.do",
    "telefono": "+1 (829) 305-5945",
    "email": "info@suindsa.com.do",
    "direccion": "Av. Estrella Sadhalá No. 55, Sector Evaristo Morales",
    "ciudad": "Haina",
    "pais": "República Dominicana",
    "valor_estimado": 5730000,
    "responsable": "Felipe Guzmán",
    "ultimo_contacto": "2026-09-30T18:00:00.000Z",
    "creado_en": "2026-04-03T18:00:00.000Z",
    "actualizado_en": "2026-09-30T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-115-1",
        "cliente_id": "c1150000-0000-4000-8000-000000000115",
        "nombre": "Lucía Corominas Rosario",
        "cargo": "Gerente General de Compras & Cadena de Suministro",
        "email": "lucía.corominas@suindsa.com.do",
        "telefono": "+1 (849) 318-5976",
        "es_principal": true,
        "creado_en": "2026-04-03T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-115-1",
        "cliente_id": "c1150000-0000-4000-8000-000000000115",
        "titulo": "Implementación y Licenciamiento Empresarial Cloud 2026",
        "monto": 5730000,
        "etapa": "negociacion",
        "probabilidad": 75,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-04-03T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-115-1",
        "cliente_id": "c1150000-0000-4000-8000-000000000115",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Lucía Corominas Rosario.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-09-30T18:00:00.000Z"
      },
      {
        "id": "act-115-2",
        "cliente_id": "c1150000-0000-4000-8000-000000000115",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Felipe Guzmán",
        "fecha": "2026-04-03T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c1160000-0000-4000-8000-000000000116",
    "codigo": "CLI-116",
    "razon_social": "Agrocomercial del Cibao S.R.L.",
    "nombre_comercial": "AgroCibao Insumos",
    "identificacion_fiscal": "1-01-81572-5",
    "sector": "Comercio",
    "estado": "activo",
    "prioridad": "baja",
    "sitio_web": "https://www.agrocibao.com.do",
    "telefono": "+1 (849) 312-5988",
    "email": "info@agrocibao.com.do",
    "direccion": "Av. Juan Pablo Duarte No. 58, Sector La Julia",
    "ciudad": "La Vega",
    "pais": "República Dominicana",
    "valor_estimado": 6140000,
    "responsable": "Laura Peña",
    "ultimo_contacto": "2026-09-28T18:00:00.000Z",
    "creado_en": "2026-03-31T18:00:00.000Z",
    "actualizado_en": "2026-09-28T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-116-1",
        "cliente_id": "c1160000-0000-4000-8000-000000000116",
        "nombre": "Víctor Fernández Santana",
        "cargo": "Vicepresidente Ejecutivo de Administración",
        "email": "víctor.fernández@agrocibao.com.do",
        "telefono": "+1 (809) 325-6019",
        "es_principal": true,
        "creado_en": "2026-03-31T18:00:00.000Z"
      },
      {
        "id": "cnt-116-2",
        "cliente_id": "c1160000-0000-4000-8000-000000000116",
        "nombre": "Andrea Hernández Rodríguez",
        "cargo": "Jefe de Compras B2B y Licitaciones",
        "email": "andrea.hernández@agrocibao.com.do",
        "telefono": "+1 (829) 338-6050",
        "es_principal": false,
        "creado_en": "2026-03-31T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-116-1",
        "cliente_id": "c1160000-0000-4000-8000-000000000116",
        "titulo": "Contrato Marco de Suministro B2B Anual",
        "monto": 6140000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-03-31T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-116-1",
        "cliente_id": "c1160000-0000-4000-8000-000000000116",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Víctor Fernández Santana.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-09-28T18:00:00.000Z"
      },
      {
        "id": "act-116-2",
        "cliente_id": "c1160000-0000-4000-8000-000000000116",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Laura Peña",
        "fecha": "2026-03-31T18:00:00.000Z"
      }
    ]
  },
  {
    "id": "c1170000-0000-4000-8000-000000000117",
    "codigo": "CLI-117",
    "razon_social": "Papelera del Caribe S.A.S. - B2B",
    "nombre_comercial": "Papelera Caribe Corporativo",
    "identificacion_fiscal": "1-31-82189-8",
    "sector": "Comercio",
    "estado": "activo",
    "prioridad": "alta",
    "sitio_web": "https://www.papeleracaribe.do",
    "telefono": "+1 (809) 319-6031",
    "email": "info@papeleracaribe.do",
    "direccion": "Av. Winston Churchill No. 61, Sector Los Jardines",
    "ciudad": "Santo Domingo",
    "pais": "República Dominicana",
    "valor_estimado": 6560000,
    "responsable": "Roberto Méndez",
    "ultimo_contacto": "2026-09-26T18:00:00.000Z",
    "creado_en": "2026-03-28T18:00:00.000Z",
    "actualizado_en": "2026-09-26T18:00:00.000Z",
    "contactos": [
      {
        "id": "cnt-117-1",
        "cliente_id": "c1170000-0000-4000-8000-000000000117",
        "nombre": "Daniela García Báez",
        "cargo": "Director de Recursos Humanos & Talento",
        "email": "daniela.garcía@papeleracaribe.do",
        "telefono": "+1 (829) 332-6062",
        "es_principal": true,
        "creado_en": "2026-03-28T18:00:00.000Z"
      },
      {
        "id": "cnt-117-2",
        "cliente_id": "c1170000-0000-4000-8000-000000000117",
        "nombre": "Manuel Castillo Taveras",
        "cargo": "Coordinador de Logística y Despacho",
        "email": "manuel.castillo@papeleracaribe.do",
        "telefono": "+1 (849) 345-6093",
        "es_principal": false,
        "creado_en": "2026-03-28T18:00:00.000Z"
      },
      {
        "id": "cnt-117-3",
        "cliente_id": "c1170000-0000-4000-8000-000000000117",
        "nombre": "Teresa Valdez Reyes",
        "cargo": "Especialista Senior de Compras Estratégicas",
        "email": "teresa.valdez@papeleracaribe.do",
        "telefono": "+1 (809) 358-6124",
        "es_principal": false,
        "creado_en": "2026-03-28T18:00:00.000Z"
      }
    ],
    "oportunidades": [
      {
        "id": "op-117-1",
        "cliente_id": "c1170000-0000-4000-8000-000000000117",
        "titulo": "Renovación de Infraestructura y Soporte Crítico 24/7",
        "monto": 6560000,
        "etapa": "ganada",
        "probabilidad": 100,
        "fecha_cierre_estimada": "2026-11-30",
        "creado_en": "2026-03-28T18:00:00.000Z"
      }
    ],
    "actividades": [
      {
        "id": "act-117-1",
        "cliente_id": "c1170000-0000-4000-8000-000000000117",
        "tipo": "reunion",
        "descripcion": "Sesión de presentación ejecutiva y revisión de requerimientos técnicos con Daniela García Báez.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-09-26T18:00:00.000Z"
      },
      {
        "id": "act-117-2",
        "cliente_id": "c1170000-0000-4000-8000-000000000117",
        "tipo": "correo",
        "descripcion": "Envío formal de propuesta comercial y términos contractuales para revisión de compras.",
        "realizado_por": "Roberto Méndez",
        "fecha": "2026-03-28T18:00:00.000Z"
      }
    ]
  }
];
