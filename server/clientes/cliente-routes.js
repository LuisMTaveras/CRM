import { Router } from 'express';
import { csvAObjetos, filaCsv } from '../shared/csv.js';

const ROLES_LECTURA = ['admin', 'gerente', 'ejecutivo', 'auditor'];
const ROLES_ESCRITURA = ['admin', 'gerente', 'ejecutivo'];
const ROLES_GESTION = ['admin', 'gerente'];
const ROLES_EXPORTACION = ['admin', 'gerente', 'auditor'];

function exigirRol(req, res, roles) {
  const configuracion = req.app.locals.autenticacion;
  if (!configuracion?.requerir) return true;
  if (req.auth?.tipo === 'api-key') return true;

  if (roles.includes(String(req.auth?.rol || ''))) return true;

  res.status(403).json({ ok: false, error: 'No tienes permisos para realizar esta accion.' });
  return false;
}

function responderError(res, error, estadoPredeterminado = 400) {
  const estado = Number(error?.estado) || estadoPredeterminado;
  return res.status(estado).json({
    ok: false,
    error: error?.message || 'No se pudo completar la operacion.',
    errores: Array.isArray(error?.errores) ? error.errores : undefined,
  });
}

function contextoAuditoria(req, accion, entidadId, detalle) {
  req.auditoria = { accion, entidad: 'clientes', entidadId, detalle };
}

function construirContextoCliente(cliente) {
  return {
    clienteId: cliente.id,
    clienteNombre: cliente.nombre_comercial || cliente.razon_social,
    sector: cliente.sector || '',
    prioridad: cliente.prioridad || '',
    responsable: cliente.responsable || '',
  };
}

function buscarOportunidad(clientes, oportunidadId) {
  for (const cliente of clientes.todos()) {
    const oportunidad = (cliente.oportunidades || []).find(
      (item) => item.id === oportunidadId
    );
    if (oportunidad) {
      return {
        ...construirContextoCliente(cliente),
        oportunidadId: oportunidad.id,
        tituloOportunidad: oportunidad.titulo,
        etapa: oportunidad.etapa,
        pipelineId: 'pipeline-comercial',
      };
    }
  }
  return null;
}

/**
 * Dispara las reglas de automatización activas. Cualquier fallo de la regla se
 * absorbe dentro del motor para no romper la operación comercial principal.
 */
function ejecutarAutomatizaciones(req, evento, contexto) {
  const automatizaciones = req.app.locals.automatizaciones;
  const actividades = req.app.locals.actividades;
  if (!automatizaciones || !actividades || !contexto) return;

  automatizaciones.ejecutar(evento, contexto, {
    crearTarea: (datos) => actividades.crear(datos),
    registrarNota: (datos) => actividades.crear(datos),
  });
}

const MAPA_CSV = {
  Codigo: 'codigo',
  'Razon Social': 'razon_social',
  'Razón Social': 'razon_social',
  'Nombre Comercial': 'nombre_comercial',
  'RNC / Identificacion': 'identificacion_fiscal',
  'RNC / Identificación': 'identificacion_fiscal',
  'RNC': 'identificacion_fiscal',
  'Identificacion Fiscal': 'identificacion_fiscal',
  'Identificación Fiscal': 'identificacion_fiscal',
  'Sector Economico': 'sector',
  'Sector Económico': 'sector',
  Sector: 'sector',
  Estado: 'estado',
  Prioridad: 'prioridad',
  'Correo Corporativo': 'email',
  Correo: 'email',
  Email: 'email',
  'Telefono': 'telefono',
  'Teléfono': 'telefono',
  Ciudad: 'ciudad',
  Direccion: 'direccion',
  'Dirección': 'direccion',
  Pais: 'pais',
  'País': 'pais',
  'Sitio Web': 'sitio_web',
  'Responsable Comercial': 'responsable',
  Responsable: 'responsable',
  'Valor Estimado': 'valor_estimado',
  'Fecha de Registro': 'creado_en',
};

export function crearRutasClientes() {
  const router = Router();

  const almacen = (req) => req.app.locals.clientes;

  router.get('/', (req, res) => {
    if (!exigirRol(req, res, ROLES_LECTURA)) return;

    const clientes = almacen(req);
    if (!clientes) {
      return res.status(503).json({ ok: false, error: 'El almacen de clientes no esta disponible.' });
    }

    const resultado = clientes.listar({
      pagina: req.query.pagina ?? req.query.page,
      tamanoPagina: req.query.tamanoPagina ?? req.query.pageSize,
      busqueda: req.query.busqueda ?? req.query.q,
      ordenCampo: req.query.ordenCampo ?? req.query.sort,
      ordenDireccion: req.query.ordenDireccion ?? req.query.dir,
      estado: req.query.estado,
      sector: req.query.sector,
    });

    return res.json(resultado);
  });

  router.get('/exportar.csv', (req, res) => {
    if (!exigirRol(req, res, ROLES_EXPORTACION)) return;

    const clientes = almacen(req);
    if (!clientes) {
      return res.status(503).json({ ok: false, error: 'El almacen de clientes no esta disponible.' });
    }

    const registros = clientes.exportar({
      busqueda: req.query.busqueda ?? req.query.q,
      estado: req.query.estado,
      sector: req.query.sector,
    });

    const encabezado = [
      'Codigo',
      'Razon Social',
      'Nombre Comercial',
      'RNC / Identificacion',
      'Sector Economico',
      'Estado',
      'Prioridad',
      'Correo Corporativo',
      'Telefono',
      'Ciudad',
      'Responsable Comercial',
      'Valor Estimado',
      'Fecha de Registro',
    ];

    const lineas = registros.map((cliente) => filaCsv([
      cliente.codigo,
      cliente.razon_social,
      cliente.nombre_comercial,
      cliente.identificacion_fiscal,
      cliente.sector,
      cliente.estado,
      cliente.prioridad,
      cliente.email,
      cliente.telefono,
      cliente.ciudad,
      cliente.responsable,
      cliente.valor_estimado,
      cliente.creado_en,
    ]));

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="cartera_clientes_crm.csv"');
    return res.send(`\ufeff${[filaCsv(encabezado), ...lineas].join('\r\n')}`);
  });

  router.post('/importar', (req, res) => {
    if (!exigirRol(req, res, ROLES_GESTION)) return;

    const clientes = almacen(req);
    if (!clientes) {
      return res.status(503).json({ ok: false, error: 'El almacen de clientes no esta disponible.' });
    }

    const cuerpo = req.body || {};
    let filas = Array.isArray(cuerpo.clientes) ? cuerpo.clientes : null;

    if (!filas && typeof cuerpo.csv === 'string') {
      filas = csvAObjetos(cuerpo.csv, MAPA_CSV);
    }

    if (!filas) {
      return res.status(400).json({ ok: false, error: 'Envia un arreglo "clientes" o el texto "csv".' });
    }

    try {
      const resultado = clientes.importar(filas, { reemplazar: cuerpo.reemplazar === true });
      contextoAuditoria(
        req,
        'clientes.importar',
        '',
        `Importados: ${resultado.creados}. Omitidos: ${resultado.omitidos.length}. Errores: ${resultado.errores.length}.`
      );
      return res.status(201).json({ ok: true, ...resultado });
    } catch (error) {
      return responderError(res, error);
    }
  });

  router.get('/todos', (req, res) => {
    if (!exigirRol(req, res, ROLES_LECTURA)) return;

    const clientes = almacen(req);
    if (!clientes) {
      return res.status(503).json({ ok: false, error: 'El almacen de clientes no esta disponible.' });
    }

    return res.json({ ok: true, clientes: clientes.todos() });
  });

  router.get('/oportunidades/todas', (req, res) => {
    if (!exigirRol(req, res, ROLES_LECTURA)) return;

    const clientes = almacen(req);
    if (!clientes) {
      return res.status(503).json({ ok: false, error: 'El almacen de clientes no esta disponible.' });
    }

    return res.json({ ok: true, oportunidades: clientes.todasLasOportunidades() });
  });

  router.patch('/oportunidades/:oportunidadId/etapa', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;

    const clientes = almacen(req);
    if (!clientes) {
      return res.status(503).json({ ok: false, error: 'El almacen de clientes no esta disponible.' });
    }

    const contextoPrevio = buscarOportunidad(clientes, req.params.oportunidadId);
    const actualizado = clientes.moverEtapaOportunidad(
      req.params.oportunidadId,
      String(req.body?.etapa || '')
    );
    if (!actualizado) {
      return res.status(404).json({ ok: false, error: 'Oportunidad no encontrada o etapa invalida.' });
    }

    const contexto = buscarOportunidad(clientes, req.params.oportunidadId);
    if (contexto) {
      contexto.etapaAnterior = contextoPrevio?.etapa || '';
      ejecutarAutomatizaciones(req, 'etapa_cambiada', contexto);
    }

    contextoAuditoria(req, 'clientes.oportunidad.mover', req.params.oportunidadId, `Etapa: ${req.body?.etapa}`);
    return res.json({ ok: true });
  });

  router.get('/:id', (req, res) => {
    if (!exigirRol(req, res, ROLES_LECTURA)) return;

    const clientes = almacen(req);
    if (!clientes) {
      return res.status(503).json({ ok: false, error: 'El almacen de clientes no esta disponible.' });
    }

    const cliente = clientes.obtener(req.params.id);
    if (!cliente) {
      return res.status(404).json({ ok: false, error: 'Cliente no encontrado.' });
    }

    return res.json(cliente);
  });

  router.post('/', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;

    const clientes = almacen(req);
    if (!clientes) {
      return res.status(503).json({ ok: false, error: 'El almacen de clientes no esta disponible.' });
    }

    try {
      const cliente = clientes.crear(req.body || {}, req.auth?.nombre || '');
      contextoAuditoria(req, 'clientes.crear', cliente.id, `Cliente: ${cliente.razon_social}`);
      ejecutarAutomatizaciones(req, 'cliente_creado', construirContextoCliente(cliente));
      return res.status(201).json(cliente);
    } catch (error) {
      return responderError(res, error);
    }
  });

  router.patch('/:id', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;

    const clientes = almacen(req);
    if (!clientes) {
      return res.status(503).json({ ok: false, error: 'El almacen de clientes no esta disponible.' });
    }

    try {
      const cliente = clientes.actualizar(req.params.id, req.body || {});
      if (!cliente) {
        return res.status(404).json({ ok: false, error: 'Cliente no encontrado.' });
      }
      contextoAuditoria(req, 'clientes.actualizar', cliente.id, `Cliente: ${cliente.razon_social}`);
      return res.json(cliente);
    } catch (error) {
      return responderError(res, error);
    }
  });

  router.delete('/:id', (req, res) => {
    if (!exigirRol(req, res, ROLES_GESTION)) return;

    const clientes = almacen(req);
    if (!clientes) {
      return res.status(503).json({ ok: false, error: 'El almacen de clientes no esta disponible.' });
    }

    const eliminado = clientes.eliminar(req.params.id);
    if (!eliminado) {
      return res.status(404).json({ ok: false, error: 'Cliente no encontrado.' });
    }

    contextoAuditoria(req, 'clientes.eliminar', req.params.id, `Cliente: ${eliminado.razon_social}`);
    return res.json({ ok: true, id: req.params.id });
  });

  router.post('/:id/contactos', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;

    const clientes = almacen(req);
    if (!clientes) {
      return res.status(503).json({ ok: false, error: 'El almacen de clientes no esta disponible.' });
    }

    const contacto = clientes.agregarContacto(req.params.id, req.body || {});
    if (!contacto) {
      return res.status(404).json({ ok: false, error: 'Cliente no encontrado.' });
    }

    contextoAuditoria(req, 'clientes.contacto.crear', req.params.id, `Contacto: ${contacto.nombre}`);
    return res.status(201).json(contacto);
  });

  router.delete('/:id/contactos/:contactoId', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;

    const clientes = almacen(req);
    if (!clientes) {
      return res.status(503).json({ ok: false, error: 'El almacen de clientes no esta disponible.' });
    }

    const eliminado = clientes.eliminarContacto(req.params.id, req.params.contactoId);
    if (!eliminado) {
      return res.status(404).json({ ok: false, error: 'Contacto no encontrado.' });
    }

    contextoAuditoria(req, 'clientes.contacto.eliminar', req.params.id, `Contacto: ${req.params.contactoId}`);
    return res.json({ ok: true });
  });

  router.post('/:id/contactos/:contactoId/principal', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;

    const clientes = almacen(req);
    if (!clientes) {
      return res.status(503).json({ ok: false, error: 'El almacen de clientes no esta disponible.' });
    }

    const actualizado = clientes.marcarContactoPrincipal(req.params.id, req.params.contactoId);
    if (!actualizado) {
      return res.status(404).json({ ok: false, error: 'Contacto no encontrado.' });
    }

    contextoAuditoria(req, 'clientes.contacto.principal', req.params.id, `Contacto: ${req.params.contactoId}`);
    return res.json({ ok: true });
  });

  router.post('/:id/oportunidades', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;

    const clientes = almacen(req);
    if (!clientes) {
      return res.status(503).json({ ok: false, error: 'El almacen de clientes no esta disponible.' });
    }

    const oportunidad = clientes.agregarOportunidad(req.params.id, req.body || {});
    if (!oportunidad) {
      return res.status(404).json({ ok: false, error: 'Cliente no encontrado.' });
    }

    const cliente = clientes.obtener(req.params.id);
    if (cliente) {
      ejecutarAutomatizaciones(req, 'oportunidad_creada', {
        ...construirContextoCliente(cliente),
        oportunidadId: oportunidad.id,
        tituloOportunidad: oportunidad.titulo,
        etapa: oportunidad.etapa,
        etapaAnterior: '',
        pipelineId: 'pipeline-comercial',
      });
    }

    contextoAuditoria(req, 'clientes.oportunidad.crear', req.params.id, `Oportunidad: ${oportunidad.titulo}`);
    return res.status(201).json(oportunidad);
  });

  router.patch('/:id/oportunidades/:oportunidadId', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;

    const clientes = almacen(req);
    if (!clientes) {
      return res.status(503).json({ ok: false, error: 'El almacen de clientes no esta disponible.' });
    }

    const oportunidad = clientes.actualizarOportunidad(req.params.id, req.params.oportunidadId, req.body || {});
    if (!oportunidad) {
      return res.status(404).json({ ok: false, error: 'Oportunidad no encontrada.' });
    }

    contextoAuditoria(req, 'clientes.oportunidad.actualizar', req.params.id, `Oportunidad: ${oportunidad.id}`);
    return res.json(oportunidad);
  });

  router.delete('/:id/oportunidades/:oportunidadId', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;

    const clientes = almacen(req);
    if (!clientes) {
      return res.status(503).json({ ok: false, error: 'El almacen de clientes no esta disponible.' });
    }

    const eliminado = clientes.eliminarOportunidad(req.params.id, req.params.oportunidadId);
    if (!eliminado) {
      return res.status(404).json({ ok: false, error: 'Oportunidad no encontrada.' });
    }

    contextoAuditoria(req, 'clientes.oportunidad.eliminar', req.params.id, `Oportunidad: ${req.params.oportunidadId}`);
    return res.json({ ok: true });
  });

  router.post('/:id/actividades', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;

    const clientes = almacen(req);
    if (!clientes) {
      return res.status(503).json({ ok: false, error: 'El almacen de clientes no esta disponible.' });
    }

    const actividad = clientes.agregarActividad(req.params.id, req.body || {});
    if (!actividad) {
      return res.status(404).json({ ok: false, error: 'Cliente no encontrado.' });
    }

    contextoAuditoria(req, 'clientes.actividad.crear', req.params.id, `Actividad: ${actividad.tipo}`);
    return res.status(201).json(actividad);
  });

  router.delete('/:id/actividades/:actividadId', (req, res) => {
    if (!exigirRol(req, res, ROLES_ESCRITURA)) return;

    const clientes = almacen(req);
    if (!clientes) {
      return res.status(503).json({ ok: false, error: 'El almacen de clientes no esta disponible.' });
    }

    const eliminado = clientes.eliminarActividad(req.params.id, req.params.actividadId);
    if (!eliminado) {
      return res.status(404).json({ ok: false, error: 'Actividad no encontrada.' });
    }

    contextoAuditoria(req, 'clientes.actividad.eliminar', req.params.id, `Actividad: ${req.params.actividadId}`);
    return res.json({ ok: true });
  });

  return router;
}
