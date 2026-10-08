import { clienteService } from '@/modules/clientes/services/cliente.service';
import { pipelineService } from '@/modules/pipeline/services/pipeline.service';
import { emailService } from '@/modules/comunicaciones/services/email.service';
import { themeService } from '@/core/theme/theme.service';
import type { ItemBusqueda, GrupoResultadosBusqueda, CategoriaBusqueda } from './busqueda.types';

export class BusquedaService {
  /**
   * Catálogo de módulos base para navegación rápida
   */
  private obtenerModulos(): ItemBusqueda[] {
    return [
      {
        id: 'mod-metricas',
        categoria: 'modulos',
        titulo: 'Métricas & KPIs Ejecutivos',
        subtitulo: 'Rendimiento comercial, conversión de embudo y facturación',
        badge: 'Dashboard',
        badgeColor: 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/20',
        icono: 'BarChart3',
        ruta: '/',
      },
      {
        id: 'mod-clientes',
        categoria: 'modulos',
        titulo: 'Cartera de Clientes B2B',
        subtitulo: 'Directorio institucional, RNC DGII, contactos y sectores',
        badge: 'Cartera',
        badgeColor: 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20',
        icono: 'Building2',
        ruta: '/clientes',
      },
      {
        id: 'mod-pipeline',
        categoria: 'modulos',
        titulo: 'Pipeline Comercial & Kanban',
        subtitulo: 'Tableros de ventas, etapas de negociación y oportunidades',
        badge: 'Ventas',
        badgeColor: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20',
        icono: 'Kanban',
        ruta: '/pipeline',
      },
      {
        id: 'mod-comunicaciones',
        categoria: 'modulos',
        titulo: 'Envíos, Documentos & Bandeja',
        subtitulo: 'Estudio de PDF A4, plantillas oficiales y servidor SMTP/IMAP',
        badge: 'Comunicaciones',
        badgeColor: 'bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/20',
        icono: 'Mail',
        ruta: '/comunicaciones',
      },
      {
        id: 'mod-usuarios',
        categoria: 'modulos',
        titulo: 'Usuarios, Roles & Permisos',
        subtitulo: 'Directorio de colaboradores y matriz de privilegios RBAC',
        badge: 'Seguridad',
        badgeColor: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20',
        icono: 'Users',
        ruta: '/usuarios',
      },
      {
        id: 'mod-config-empresa',
        categoria: 'modulos',
        titulo: 'Perfil de Empresa & Identidad',
        subtitulo: 'RNC, logotipo oficial, membrete y datos fiscales',
        badge: 'Ajustes',
        badgeColor: 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/20',
        icono: 'Settings',
        ruta: '/configuracion?tab=empresa',
      },
      {
        id: 'mod-config-correo',
        categoria: 'modulos',
        titulo: 'Servidores de Correo (SMTP / IMAP)',
        subtitulo: 'Conexión de servidor de correo y credenciales activas',
        badge: 'Servidores',
        badgeColor: 'bg-sky-500/10 text-sky-500 dark:text-sky-400 border-sky-500/20',
        icono: 'Server',
        ruta: '/configuracion?tab=correo',
      },
      {
        id: 'mod-config-sectores',
        categoria: 'modulos',
        titulo: 'Catálogo de Sectores Económicos',
        subtitulo: 'Gestión de sectores comerciales, paletas e iconos',
        badge: 'Catálogo',
        badgeColor: 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/20',
        icono: 'Layers',
        ruta: '/configuracion?tab=sectores',
      },
    ];
  }

  /**
   * Comandos y accesos de ejecución rápida
   */
  private obtenerAccionesRapidas(): ItemBusqueda[] {
    return [
      {
        id: 'acc-nuevo-cliente',
        categoria: 'acciones',
        titulo: 'Registrar Nuevo Cliente',
        subtitulo: 'Abre el asistente de creación en 3 pasos con validación RNC',
        badge: 'Crear',
        badgeColor: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20',
        icono: 'Plus',
        ruta: '/clientes?accion=nuevo',
      },
      {
        id: 'acc-nueva-plantilla',
        categoria: 'acciones',
        titulo: 'Crear Plantilla o Documento Oficial',
        subtitulo: 'Diseñar nueva propuesta comercial, acuerdo o contrato en PDF A4',
        badge: 'Documento',
        badgeColor: 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/20',
        icono: 'FileText',
        ruta: '/comunicaciones?accion=nuevo-doc',
      },
      {
        id: 'acc-envio-masivo',
        categoria: 'acciones',
        titulo: 'Despachar Correo Masivo a Clientes',
        subtitulo: 'Generar y enviar documentos personalizados con PDF adjunto',
        badge: 'Despacho',
        badgeColor: 'bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/20',
        icono: 'Send',
        ruta: '/comunicaciones?accion=masivo',
      },
      {
        id: 'acc-cambiar-tema',
        categoria: 'acciones',
        titulo: 'Cambiar Tema de Pantalla (Modo Claro / Oscuro)',
        subtitulo: `Alternar apariencia visual del sistema. Tema activo: ${themeService.tema.value === 'dark' ? 'Oscuro' : 'Claro'}`,
        badge: 'Tema',
        badgeColor: 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/20',
        icono: 'Moon',
        accion: () => {
          themeService.alternarTema();
        },
      },
      {
        id: 'acc-subir-logo',
        categoria: 'acciones',
        titulo: 'Actualizar Logotipo Oficial de la Empresa',
        subtitulo: 'Configurar imagen que aparece en el membrete y encabezado PDF',
        badge: 'Marca',
        badgeColor: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20',
        icono: 'Image',
        ruta: '/configuracion?tab=empresa',
      },
    ];
  }

  /**
   * Ejecuta la búsqueda omnicanal agrupada por categorías
   */
  buscar(termino: string): GrupoResultadosBusqueda[] {
    const q = termino.trim().toLowerCase();

    // 1. Si no hay término, devolver sugerencias clave (Módulos principales y Acciones frecuentes)
    if (!q) {
      return [
        {
          categoria: 'acciones',
          etiqueta: 'ACCIONES RÁPIDAS',
          items: this.obtenerAccionesRapidas().slice(0, 4),
        },
        {
          categoria: 'modulos',
          etiqueta: 'MÓDULOS DEL CRM',
          items: this.obtenerModulos(),
        },
      ];
    }

    const grupos: GrupoResultadosBusqueda[] = [];

    // 2. Búsqueda en Acciones Rápidas
    const accionesCoincidentes = this.obtenerAccionesRapidas().filter(
      (a) =>
        a.titulo.toLowerCase().includes(q) ||
        (a.subtitulo && a.subtitulo.toLowerCase().includes(q))
    );
    if (accionesCoincidentes.length > 0) {
      grupos.push({
        categoria: 'acciones',
        etiqueta: `ACCIONES RÁPIDAS (${accionesCoincidentes.length})`,
        items: accionesCoincidentes,
      });
    }

    // 3. Búsqueda en Clientes Registrados
    const clientesResp = clienteService.obtenerClientesSincrono({
      pagina: 1,
      tamanoPagina: 15,
      busqueda: q,
    });

    if (clientesResp.datos.length > 0) {
      const clientesItems: ItemBusqueda[] = clientesResp.datos.map((c) => ({
        id: `cli-${c.id}`,
        categoria: 'clientes',
        titulo: c.razon_social,
        subtitulo: `${c.identificacion_fiscal || 'Sin RNC'} • ${c.ciudad || 'Rep. Dominicana'} • Contacto: ${c.responsable}`,
        badge: c.codigo,
        badgeColor: 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20',
        icono: 'Building2',
        ruta: `/clientes?busqueda=${encodeURIComponent(c.codigo)}`,
      }));

      grupos.push({
        categoria: 'clientes',
        etiqueta: `CLIENTES ENCONTRADOS (${clientesResp.total})`,
        items: clientesItems,
      });
    }

    // 4. Búsqueda en Pipelines y Oportunidades
    try {
      const pipelines = pipelineService.obtenerPipelinesSincrono();
      const tarjetas = pipelineService.obtenerTarjetasSincrono();
      const pipelinesCoincidentes: ItemBusqueda[] = [];

      for (const p of pipelines) {
        if (p.nombre.toLowerCase().includes(q) || (p.descripcion && p.descripcion.toLowerCase().includes(q))) {
          pipelinesCoincidentes.push({
            id: `pipe-${p.id}`,
            categoria: 'pipeline',
            titulo: `Tablero: ${p.nombre}`,
            subtitulo: `${p.columnas.length} etapas • Tablero dinámico de gestión`,
            badge: 'Pipeline',
            badgeColor: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20',
            icono: 'Kanban',
            ruta: `/pipeline/${p.id}`,
          });
        }
      }

      for (const card of tarjetas) {
        if (
          card.titulo.toLowerCase().includes(q) ||
          card.cliente_nombre.toLowerCase().includes(q) ||
          (card.responsable && card.responsable.toLowerCase().includes(q))
        ) {
          pipelinesCoincidentes.push({
            id: `card-${card.id}`,
            categoria: 'pipeline',
            titulo: card.titulo,
            subtitulo: `${card.cliente_nombre} • Responsable: ${card.responsable}`,
            badge: card.monto ? `RD$ ${card.monto.toLocaleString()}` : 'Negocio',
            badgeColor: 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/20',
            icono: 'Kanban',
            ruta: `/pipeline/${card.pipeline_id}`,
          });
        }
      }

      if (pipelinesCoincidentes.length > 0) {
        grupos.push({
          categoria: 'pipeline',
          etiqueta: `PIPELINE & NEGOCIOS (${pipelinesCoincidentes.length})`,
          items: pipelinesCoincidentes.slice(0, 8),
        });
      }
    } catch {
      // fallback silencioso
    }

    // 5. Búsqueda en Plantillas y Comunicaciones
    try {
      const plantillas = emailService.obtenerPlantillas();
      const plantillasCoincidentes = plantillas
        .filter(
          (plt) =>
            plt.nombre.toLowerCase().includes(q) ||
            plt.descripcion.toLowerCase().includes(q) ||
            plt.tituloDocumento.toLowerCase().includes(q)
        )
        .map((plt) => ({
          id: `plt-${plt.id}`,
          categoria: 'comunicaciones' as CategoriaBusqueda,
          titulo: plt.nombre,
          subtitulo: plt.descripcion || 'Documento oficial con variables B2B',
          badge: plt.categoria.toUpperCase(),
          badgeColor: 'bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/20',
          icono: 'FileText',
          ruta: `/comunicaciones`,
        }));

      if (plantillasCoincidentes.length > 0) {
        grupos.push({
          categoria: 'comunicaciones',
          etiqueta: `DOCUMENTOS & PLANTILLAS (${plantillasCoincidentes.length})`,
          items: plantillasCoincidentes,
        });
      }
    } catch {
      // fallback
    }

    // 6. Búsqueda en Módulos del Sistema
    const modulosCoincidentes = this.obtenerModulos().filter(
      (m) =>
        m.titulo.toLowerCase().includes(q) ||
        (m.subtitulo && m.subtitulo.toLowerCase().includes(q))
    );
    if (modulosCoincidentes.length > 0) {
      grupos.push({
        categoria: 'modulos',
        etiqueta: `SECCIONES DEL SISTEMA (${modulosCoincidentes.length})`,
        items: modulosCoincidentes,
      });
    }

    return grupos;
  }
}

export const busquedaService = new BusquedaService();
