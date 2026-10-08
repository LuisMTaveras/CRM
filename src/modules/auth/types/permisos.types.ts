export type ModuloPermiso = 
  | 'clientes' 
  | 'pipeline' 
  | 'comunicaciones' 
  | 'metricas' 
  | 'usuarios' 
  | 'configuracion';

export interface PermisoDefinicion {
  id: string;
  modulo: ModuloPermiso;
  moduloNombre: string;
  nombre: string;
  descripcion: string;
}

export interface RolDefinicion {
  id: string;
  nombre: string;
  descripcion: string;
  colorBadge: string;
  esSistema: boolean;
  permisos: string[];
}

export const MODULOS_SISTEMA: Array<{ id: ModuloPermiso; nombre: string; descripcion: string }> = [
  { id: 'clientes', nombre: 'Cartera & Clientes', descripcion: 'Gestión y directorio de cuentas B2B' },
  { id: 'pipeline', nombre: 'Pipeline Kanban', descripcion: 'Etapas de venta, tratos y oportunidades' },
  { id: 'comunicaciones', nombre: 'Comunicaciones & Documentos', descripcion: 'Envíos de correos, cotizaciones y firmas' },
  { id: 'metricas', nombre: 'Métricas & Analítica', descripcion: 'Indicadores comerciales, embudo y reportes' },
  { id: 'usuarios', nombre: 'Usuarios & Seguridad', descripcion: 'Control de accesos, roles y colaboradores' },
  { id: 'configuracion', nombre: 'Empresa & Ajustes', descripcion: 'Datos corporativos, SMTP y bases de datos' },
];

export const CATALOGO_PERMISOS: PermisoDefinicion[] = [
  // Clientes
  { id: 'clientes:ver', modulo: 'clientes', moduloNombre: 'Cartera & Clientes', nombre: 'Ver Directorio', descripcion: 'Consultar listados y fichas de clientes B2B' },
  { id: 'clientes:crear', modulo: 'clientes', moduloNombre: 'Cartera & Clientes', nombre: 'Crear Clientes', descripcion: 'Registrar nuevas cuentas y prospectos' },
  { id: 'clientes:editar', modulo: 'clientes', moduloNombre: 'Cartera & Clientes', nombre: 'Editar Clientes', descripcion: 'Modificar datos de contactos y empresas' },
  { id: 'clientes:eliminar', modulo: 'clientes', moduloNombre: 'Cartera & Clientes', nombre: 'Eliminar Clientes', descripcion: 'Dar de baja o remover registros de clientes' },
  { id: 'clientes:exportar', modulo: 'clientes', moduloNombre: 'Cartera & Clientes', nombre: 'Exportar Cartera', descripcion: 'Descargar datos de clientes en archivos CSV/Excel' },

  // Pipeline
  { id: 'pipeline:ver', modulo: 'pipeline', moduloNombre: 'Pipeline Kanban', nombre: 'Ver Tableros', descripcion: 'Acceder a columnas y oportunidades de venta' },
  { id: 'pipeline:crear', modulo: 'pipeline', moduloNombre: 'Pipeline Kanban', nombre: 'Crear Tratos', descripcion: 'Abrir nuevas oportunidades comerciales en el embudo' },
  { id: 'pipeline:mover', modulo: 'pipeline', moduloNombre: 'Pipeline Kanban', nombre: 'Mover Etapas', descripcion: 'Avanzar tarjetas entre fases de negociación' },
  { id: 'pipeline:editar', modulo: 'pipeline', moduloNombre: 'Pipeline Kanban', nombre: 'Editar Tratos', descripcion: 'Actualizar montos, probabilidades y prioridades' },
  { id: 'pipeline:eliminar', modulo: 'pipeline', moduloNombre: 'Pipeline Kanban', nombre: 'Eliminar Tratos', descripcion: 'Descartar o borrar tarjetas de venta del tablero' },
  { id: 'pipeline:configurar', modulo: 'pipeline', moduloNombre: 'Pipeline Kanban', nombre: 'Configurar Etapas', descripcion: 'Crear o modificar columnas y tableros Kanban' },

  // Comunicaciones
  { id: 'comunicaciones:ver', modulo: 'comunicaciones', moduloNombre: 'Comunicaciones', nombre: 'Ver Webmail', descripcion: 'Consultar bandeja de entrada y registro de envíos' },
  { id: 'comunicaciones:enviar', modulo: 'comunicaciones', moduloNombre: 'Comunicaciones', nombre: 'Enviar Correos', descripcion: 'Redactar mensajes individuales y masivos' },
  { id: 'comunicaciones:documentos', modulo: 'comunicaciones', moduloNombre: 'Comunicaciones', nombre: 'Generar PDF', descripcion: 'Emitir cotizaciones y propuestas comerciales' },
  { id: 'comunicaciones:plantillas', modulo: 'comunicaciones', moduloNombre: 'Comunicaciones', nombre: 'Editar Firmas', descripcion: 'Personalizar firmas de correo y membretes' },

  // Métricas
  { id: 'metricas:ver_kpis', modulo: 'metricas', moduloNombre: 'Métricas & KPIs', nombre: 'Ver Métricas Generales', descripcion: 'Consultar KPIs, embudo y evolución mensual' },
  { id: 'metricas:ver_ejecutivos', modulo: 'metricas', moduloNombre: 'Métricas & KPIs', nombre: 'Ver Ranking Ejecutivos', descripcion: 'Visualizar comparativa de ventas del equipo' },
  { id: 'metricas:exportar', modulo: 'metricas', moduloNombre: 'Métricas & KPIs', nombre: 'Exportar Analítica', descripcion: 'Descargar informes comerciales consolidados' },

  // Usuarios & Roles
  { id: 'usuarios:ver', modulo: 'usuarios', moduloNombre: 'Usuarios & Seguridad', nombre: 'Ver Colaboradores', descripcion: 'Consultar el equipo de trabajo registrado' },
  { id: 'usuarios:crear', modulo: 'usuarios', moduloNombre: 'Usuarios & Seguridad', nombre: 'Crear Usuarios', descripcion: 'Registrar nuevos accesos y credenciales' },
  { id: 'usuarios:editar', modulo: 'usuarios', moduloNombre: 'Usuarios & Seguridad', nombre: 'Editar Usuarios', descripcion: 'Modificar perfiles, cargos y activación' },
  { id: 'usuarios:permisos', modulo: 'usuarios', moduloNombre: 'Usuarios & Seguridad', nombre: 'Personalizar Permisos', descripcion: 'Asignar permisos específicos y excepciones por usuario' },
  { id: 'roles:administrar', modulo: 'usuarios', moduloNombre: 'Usuarios & Seguridad', nombre: 'Administrar Roles', descripcion: 'Crear, editar o eliminar roles y matrices' },

  // Configuración
  { id: 'configuracion:ver', modulo: 'configuracion', moduloNombre: 'Empresa & Ajustes', nombre: 'Ver Ajustes', descripcion: 'Consultar datos institucionales y estado de servidor' },
  { id: 'configuracion:editar', modulo: 'configuracion', moduloNombre: 'Empresa & Ajustes', nombre: 'Editar Configuración', descripcion: 'Modificar RNC, servidor SMTP y copias de seguridad' },
];

export const ROLES_SISTEMA_INICIALES: RolDefinicion[] = [
  {
    id: 'admin',
    nombre: 'Administrador / Dirección',
    descripcion: 'Acceso irrestricto y control total de la plataforma y seguridad.',
    colorBadge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
    esSistema: true,
    permisos: CATALOGO_PERMISOS.map((p) => p.id),
  },
  {
    id: 'gerente',
    nombre: 'Gerente Comercial',
    descripcion: 'Gestión completa de clientes, pipeline, aprobaciones y auditoría comercial.',
    colorBadge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    esSistema: true,
    permisos: [
      'clientes:ver', 'clientes:crear', 'clientes:editar', 'clientes:exportar',
      'pipeline:ver', 'pipeline:crear', 'pipeline:mover', 'pipeline:editar', 'pipeline:configurar',
      'comunicaciones:ver', 'comunicaciones:enviar', 'comunicaciones:documentos', 'comunicaciones:plantillas',
      'metricas:ver_kpis', 'metricas:ver_ejecutivos', 'metricas:exportar',
      'usuarios:ver',
      'configuracion:ver',
    ],
  },
  {
    id: 'ejecutivo',
    nombre: 'Ejecutivo de Cuentas B2B',
    descripcion: 'Operación diaria con clientes, oportunidades de venta y envíos de cotizaciones.',
    colorBadge: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
    esSistema: true,
    permisos: [
      'clientes:ver', 'clientes:crear', 'clientes:editar',
      'pipeline:ver', 'pipeline:crear', 'pipeline:mover', 'pipeline:editar',
      'comunicaciones:ver', 'comunicaciones:enviar', 'comunicaciones:documentos',
      'metricas:ver_kpis',
    ],
  },
  {
    id: 'auditor',
    nombre: 'Auditor & Cumplimiento',
    descripcion: 'Acceso de solo lectura para supervisión, trazabilidad y reportes.',
    colorBadge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    esSistema: true,
    permisos: [
      'clientes:ver', 'clientes:exportar',
      'pipeline:ver',
      'comunicaciones:ver',
      'metricas:ver_kpis', 'metricas:ver_ejecutivos', 'metricas:exportar',
      'usuarios:ver',
      'configuracion:ver',
    ],
  },
];
