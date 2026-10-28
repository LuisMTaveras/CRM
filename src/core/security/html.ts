import DOMPurify from 'dompurify';

export interface SanitizeHtmlOptions {
  /** Permite etiquetas de bloque usadas en correos HTML (tablas, estilos en línea, etc.). */
  permitirEstilosEnLinea?: boolean;
}

/**
 * Sanitiza HTML de origen externo o generado dinámicamente antes de inyectarlo
 * con `v-html`. Elimina scripts, manejadores de eventos y URLs peligrosas.
 */
export function sanitizeHtml(html: string, options: SanitizeHtmlOptions = {}): string {
  if (!html) return '';

  // Si el entorno no expone un DOM compatible, se falla de forma segura
  // mostrando el contenido como texto en lugar de HTML sin filtrar.
  if (!DOMPurify.isSupported) {
    return html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['srcdoc', 'formaction'],
    ALLOW_DATA_ATTR: false,
    ...(options.permitirEstilosEnLinea === false ? { FORBID_ATTR: ['style', 'srcdoc', 'formaction'] } : {}),
  });
}
