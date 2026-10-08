# 📋 BACKLOG DE DESARROLLO — CRM B2B ENTERPRISE

> **Estado del Proyecto:** Fases Fundacionales, Document Studio PDF A4, Buscador Universal (`Ctrl + K`) y Centro de Notificaciones completados.  
> **Repositorio:** `Alliance Software S.R.L. — CRM B2B`  
> **Última Actualización:** 08 de Octubre de 2026

---

## 📌 Resumen de Prioridades

| ID | Épica / Iniciativa | Prioridad | Estado | Estimación | Módulo Afectado |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **EP-02** | **Agenda de Seguimiento, Tareas & Recordatorios (*Next Steps*)** | 🔴 Alta | ✅ **Completado** | 1.5 Sprints | `modules/agenda` / `modules/pipeline` |
| **EP-01** | **Bitácora Cronológica & Historial del Cliente (*Timeline / Activity Feed*)** | 🔴 Alta | ⏳ Pendiente | 2 Sprints | `modules/clientes` |
| **EP-03** | **Catálogo de Servicios & Cotizador B2B (*Líneas de Propuesta en PDF*)** | 🔴 Alta | ⏳ Pendiente | 2 Sprints | `modules/comunicaciones` |
| **EP-04** | **Importador Masivo de Clientes desde Excel / CSV con Mapeo de Columnas** | 🟡 Media | ⏳ Pendiente | 1 Sprint | `modules/clientes` |
| **EP-05** | **Generador de Reporte Gerencial Ejecutivo en PDF A4** | 🟡 Media | ⏳ Pendiente | 1 Sprint | `modules/metricas` |
| **EP-06** | **Gestor de Comprobantes Fiscales Dominicanos (NCF - DGII B01/B02/B14/B15)** | 🟢 Estratégica | ⏳ Pendiente | 2 Sprints | `modules/configuracion` / `modules/pipeline` |

---

## 🚀 Detalle de Épicas & Criterios de Aceptación

### ✅ EP-02: Agenda de Seguimiento, Tareas & Recordatorios (*Next Steps*) — COMPLETADO
* **Estado:** Implementado & Probado (100% test coverage).
* **Entregables Concluidos:**
  * **Módulo Autónomo `src/modules/agenda/`**: Tipos de actividad (`TipoActividad`, `PrioridadActividad`), servicio reactivo con persistencia local (`ActividadesService`) y pruebas unitarias (9/9 pasadas).
  * **Vista de Agenda (`AgendaView.vue`) en `/agenda`**: KPIs de Hoy, Vencidas, Esta Semana y Completadas; filtros por rango, tipo y prioridad; buscador y marcado interactivo de cumplimiento con notas de resultado.
  * **Modal de Programación Reutilizable (`ModalActividadSeguimiento.vue`)**: Selector de empresas, plantillas de acción rápida, selector de fecha/hora límite y asignación de ejecutivo.
  * **Detector de Clientes Estancados (> 10 días sin interacción)** en el Kanban ([PipelineView.vue](file:///c:/DEV/CRM/CRM/src/modules/pipeline/views/PipelineView.vue)): Badges visuales de advertencia en tarjetas, botón de acción rápida *"Actuar"* para programar el próximo paso, y botón de filtrado en la barra superior para auditar únicamente oportunidades estancadas.
  * **Integración con Centro de Notificaciones ([CentroNotificaciones.vue](file:///c:/DEV/CRM/CRM/src/shared/components/CentroNotificaciones.vue))**: Alertas automáticas para tareas vencidas (alta prioridad) y tareas para hoy (media prioridad).
  * **Accesibilidad Global**: Acceso directo en el menú lateral ([SidebarNav.vue](file:///c:/DEV/CRM/CRM/src/shared/components/SidebarNav.vue)) y comandos en el Buscador Universal `Ctrl + K` ([busqueda.service.ts](file:///c:/DEV/CRM/CRM/src/core/busqueda/busqueda.service.ts)).

---

### 🔴 EP-01: Bitácora Cronológica & Historial del Cliente (*Timeline*)
* **Objetivo:** Permitir a cualquier ejecutivo o gerente comercial consultar la historia completa de interacciones con una empresa en un solo lugar.
* **Historias de Usuario:**
  * **HU-1.1:** Como ejecutivo comercial, quiero ver un hilo cronológico unificado (*Feed*) en el detalle del cliente que registre notas, llamadas, correos y propuestas.
  * **HU-1.2:** Como ejecutivo, quiero registrar una nota rápida con tipo de interacción: *«Llamada telefónica»*, *«Reunión presencial»*, *«Videollamada Zoom»* o *«Nota interna privada»*.
  * **HU-1.3:** El sistema debe registrar automáticamente en el timeline cuando se despacha un correo con propuesta adjunta o cuando el cliente cambia de etapa en el pipeline.
* **Criterios de Aceptación:**
  * Componente `TimelineCliente.vue` integrado en una pestaña dedicada dentro del modal/vista de detalle.
  * Filtros por tipo de evento (*Todos*, *Correos*, *Llamadas*, *Reuniones*, *Documentos*).
  * Formateo de fechas relativas localizadas (`formatRelativeTime`).
  * Persistencia en servicio reactivo y base de datos.

---

### 🔴 EP-03: Catálogo de Servicios & Cotizador B2B (*CPQ / Líneas de Ítems en PDF*)
* **Objetivo:** Profesionalizar la emisión de propuestas económicas permitiendo armar cotizaciones detalladas con líneas de productos y cálculo automático de ITBIS.
* **Historias de Usuario:**
  * **HU-3.1:** Como administrador, quiero gestionar un catálogo maestro de productos y servicios (Código, Nombre, Categoría, Precio Base en DOP/USD, Tasa de ITBIS 18% o Exento).
  * **HU-3.2:** En el Estudio de Documentos ([CargarDocumentoModal.vue](file:///c:/DEV/CRM/CRM/src/modules/comunicaciones/components/CargarDocumentoModal.vue)), permitir añadir una tabla de ítems con cantidad, precio unitario y descuento.
  * **HU-3.3:** El motor de PDF ([pdf-generator.service.ts](file:///c:/DEV/CRM/CRM/src/modules/comunicaciones/services/pdf-generator.service.ts)) debe renderizar una tabla corporativa estilizada con:
    * Encabezado de columnas: *Ítem / Descripción*, *Cant.*, *Precio Unit.*, *Total*.
    * Bloque de totales: Subtotal, Descuento, ITBIS (18%) y Monto Total Formal.
* **Criterios de Aceptación:**
  * Soporte de divisas DOP (`RD$`) y USD (`$`).
  * Validación contra valores NaN y formato automático `formatCurrency`.

---

### 🟡 EP-04: Importador Masivo de Clientes (Excel / CSV con Mapeo de Columnas)
* **Objetivo:** Facilitar la migración masiva de carteras comerciales desde hojas de cálculo de Excel o CRM legados.
* **Historias de Usuario:**
  * **HU-4.1:** Como usuario, quiero arrastrar un archivo `.xlsx` o `.csv` y ver un asistente en 3 pasos: *Carga*, *Mapeo de Columnas* y *Validación Previa*.
  * **HU-4.2:** El sistema debe detectar automáticamente columnas habituales (ej: *Razón Social*, *RNC*, *Teléfono*, *Email*, *Ciudad*, *Sector*).
  * **HU-4.3:** Validación previa que señale filas con RNC inválido o duplicados antes de confirmar la importación.
* **Criterios de Aceptación:**
  * Parsing client-side con preview de las primeras 5 filas.
  * Inserción en lote mediante `clienteService.importarClientesEnLote(clientes)`.

---

### 🟡 EP-05: Generador de Reporte Gerencial Ejecutivo en PDF A4
* **Objetivo:** Permitir a directores y gerentes comerciales exportar un informe mensual formal para juntas directivas o comités de ventas.
* **Historias de Usuario:**
  * **HU-5.1:** En el módulo de Métricas ([MetricasView.vue](file:///c:/DEV/CRM/CRM/src/modules/metricas/views/MetricasView.vue)), habilitar el botón *«Descargar Informe Ejecutivo PDF»*.
  * **HU-5.2:** El PDF generado debe incluir:
    * Membrete corporativo y logotipo oficial de Alliance Software S.R.L.
    * Resumen ejecutivo de facturación proyectada, ganada y en riesgo.
    * Gráficos tabulados de conversión por etapa del embudo.
    * Ranking de rendimiento por ejecutivo comercial.
    * Fecha de emisión, firma del director comercial y hash de seguridad digital.
* **Criterios de Aceptación:**
  * Diseño limpio A4 vertical con paginación ejecutiva continua.
  * Generación instantánea en cliente con `jsPDF`.

---

### 🟢 EP-06: Control de Secuencias de Comprobantes Fiscales Dominicanos (NCF - DGII)
* **Objetivo:** Cumplir con la normativa tributaria dominicana de la DGII para emisión de cotizaciones formales, proformas y facturación vinculada al cierre de negocios.
* **Historias de Usuario:**
  * **HU-6.1:** Configurar rangos de NCF autorizados por tipo:
    * `B01`: Factura de Crédito Fiscal.
    * `B02`: Factura de Consumo Final.
    * `B14`: Régimen Especial de Tributación.
    * `B15`: Comprobante Gubernamental.
  * **HU-6.2:** Control de fecha límite de vigencia de las secuencias emitidas por la DGII con alertas preventivas 30 días antes del vencimiento en el Centro de Notificaciones.
  * **HU-6.3:** Asignación automática o manual del siguiente NCF disponible al marcar una oportunidad como *«Ganada / Contratada»*.
* **Criterios de Aceptación:**
  * Validación estricta de estructura NCF (11 caracteres alfanuméricos).
  * Alerta visual cuando una secuencia restante sea menor a 15 números.

---

## 🛠️ Convenciones de Desarrollo
* **Arquitectura:** DEVFORGE Enterprise Protocol ([AGENTS.md](file:///c:/DEV/CRM/CRM/AGENTS.md)).
* **Idioma:** 100% Español en interfaces y mensajes de usuario.
* **Paleta:** Neutral Slate / Zinc con acentos suaves (Zero cyberpunk / Zero neón).
* **Calidad de Código:** Cero datos hardcodeados, tipado estricto TypeScript y cobertura de pruebas con Vitest.
