# 📋 BACKLOG DE DESARROLLO — CRM B2B ENTERPRISE

> **Estado del Proyecto:** Fases Fundacionales, Document Studio PDF A4, Buscador Universal (`Ctrl + K`) y Centro de Notificaciones completados.  
> **Repositorio:** `Alliance Software S.R.L. — CRM B2B`  
> **Última Actualización:** 08 de Octubre de 2026

---

## 📌 Resumen de Prioridades

| ID | Épica / Iniciativa | Prioridad | Estado | Estimación | Módulo Afectado |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **EP-02** | **Agenda de Seguimiento, Tareas & Recordatorios (*Next Steps*)** | 🔴 Alta | ✅ **Completado** | 1.5 Sprints | `modules/agenda` / `modules/pipeline` |
| **EP-01** | **Bitácora Cronológica & Historial del Cliente (*Timeline / Activity Feed*)** | 🔴 Alta | ✅ **Completado** | 2 Sprints | `modules/clientes` |
| **EP-03** | **Catálogo de Servicios & Cotizador B2B (*CPQ / Líneas de Ítems en PDF*)** | 🔴 Alta | ✅ **Completado** | 2 Sprints | `modules/comunicaciones` |
| **EP-05** | **Generador de Reporte Gerencial Ejecutivo en PDF A4** | 🟡 Media | ✅ **Completado** | 1 Sprint | `modules/metricas` |
| **EP-04** | **Importador Masivo de Clientes desde Excel / CSV con Mapeo de Columnas** | 🟡 Media | ⏳ Pendiente | 1 Sprint | `modules/clientes` |
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

### ✅ EP-01: Bitácora Cronológica & Historial del Cliente (*Timeline*) — COMPLETADO
* **Estado:** Implementado & Probado (100% test coverage).
* **Entregables Concluidos:**
  * **Tipos & Contratos (`src/modules/clientes/types/timeline.types.ts`)**: Modelo de eventos (`llamada`, `reunion`, `videollamada`, `nota`, `correo`, `propuesta`, `cambio_etapa`, `tarea`).
  * **Servicio Reactivo (`src/modules/clientes/services/timeline.service.ts`)**: Registro de notas rápidas, filtros por tipo, buscador reactivo, actualización automática de `ultimo_contacto` del cliente y pruebas unitarias completas (5/5 pasadas).
  * **Componente `TimelineCliente.vue`**: Feed vertical elegante con conectores en línea de tiempo, insignias por tipo de interacción, fechas relativas localizadas (`formatRelativeTime`) y creación instantánea de apuntes.
  * **Integración en Ficha del Cliente ([ClienteDrawer.vue](file:///c:/DEV/CRM/CRM/src/modules/clientes/components/ClienteDrawer.vue))**: Pestaña dedicada *«Bitácora»* accesible en un clic desde cualquier cliente de la cartera.

---

### ✅ EP-03: Catálogo de Servicios & Cotizador B2B (*CPQ / Líneas de Ítems en PDF*) — COMPLETADO
* **Estado:** Implementado & Probado (100% test coverage).
* **Entregables Concluidos:**
  * **Catálogo Maestro B2B (`src/modules/comunicaciones/services/catalogo.service.ts`)**: Servicios corporativos precargados (Licenciamiento Cloud, Onboarding, Integración DGII, Soporte 24/7, Consultoría de Ciberseguridad, Horas de Ingeniería).
  * **Motor CPQ**: Cálculo de subtotales, descuentos comerciales por porcentaje, liquidación de ITBIS 18% (regla DGII RD) e ítems exentos con soporte multimoneda (DOP / USD). Pruebas unitarias completas (6/6 pasadas).
  * **Estudio de Documentos ([CargarDocumentoModal.vue](file:///c:/DEV/CRM/CRM/src/modules/comunicaciones/components/CargarDocumentoModal.vue))**: Constructor interactivo de cotizaciones en el Paso 3 con adición desde catálogo, partidas libres, inputs dinámicos de cantidad/descuento y cuadro resumen en vivo.
  * **Motor de PDF A4 ([pdf-generator.service.ts](file:///c:/DEV/CRM/CRM/src/modules/comunicaciones/services/pdf-generator.service.ts))**: Renderizado formal de la tabla presupuestaria con cabeceras sobrias en Slate 950, filas alternadas, desglose de Subtotal, Descuento, ITBIS 18% y Total General vinculado a la firma y sellos digitales. Pruebas unitarias de renderizado (9/9 pasadas).

---

### ✅ EP-05: Generador de Reporte Gerencial Ejecutivo en PDF A4 — COMPLETADO
* **Estado:** Implementado & Probado (100% test coverage).
* **Entregables Concluidos:**
  * **Servicio `reporte-ejecutivo.service.ts`**: Generación de informe A4 vertical con membrete oficial, monograma de Alliance Software S.R.L., hash criptográfico de seguridad y doble firma gerencial.
  * **Resumen de Facturación & Embudo**: Tarjetas de facturación ganada, volumen en negociación, tasa de conversión y ticket promedio; tabla completa de retención y conversión por etapa del pipeline.
  * **Ranking de Rendimiento**: Tabla de productividad por ejecutivo comercial con tratos gestionados, ganados y tasa de éxito porcentual.
  * **Integración en Métricas ([MetricasView.vue](file:///c:/DEV/CRM/CRM/src/modules/metricas/views/MetricasView.vue))**: Botón directo *«Informe PDF»* en la barra superior con descarga instantánea en el navegador y selector de período sincronizado.

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
