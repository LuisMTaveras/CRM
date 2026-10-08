<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  html?: string;
  texto?: string;
}>();

const containerRef = ref<HTMLElement | null>(null);
let shadowRoot: ShadowRoot | null = null;
let themeObserver: MutationObserver | null = null;

function renderEmail() {
  if (!containerRef.value) return;

  if (!shadowRoot) {
    shadowRoot = containerRef.value.attachShadow({ mode: 'open' });
  }

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  if (props.html) {
    // Sanitizar etiquetas <script> para proteger contra inyección de código
    const sanitizedHtml = props.html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Estilos encapsulados para el Shadow DOM adaptados al tema
    const resetStyles = `
      <style>
        :host {
          display: block;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-size: 0.8125rem;
          line-height: 1.6;
          color: ${isDark ? '#f4f4f5' : '#18181b'};
          word-break: break-word;
        }
        * {
          box-sizing: border-box;
        }
        img {
          max-width: 100%;
          height: auto;
        }
        table {
          max-width: 100% !important;
        }
        a {
          color: ${isDark ? '#818cf8' : '#4f46e5'};
          text-decoration: underline;
        }
        p {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        ${isDark ? `
          [style*="color: #09090b"], [style*="color: #000"], [style*="color: #27272a"], [style*="color:#09090b"], [style*="color:#000"], [style*="color:#27272a"] {
            color: #f4f4f5 !important;
          }
          [style*="color: #52525b"], [style*="color: #71717a"], [style*="color:#52525b"], [style*="color:#71717a"] {
            color: #a1a1aa !important;
          }
        ` : ''}
      </style>
    `;

    shadowRoot.innerHTML = resetStyles + sanitizedHtml;

    // Abrir todos los hipervínculos del correo en una pestaña externa segura
    shadowRoot.querySelectorAll('a').forEach((link) => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });
  } else {
    const escapedText = escapeHtml(props.texto || '');
    shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-size: 0.8125rem;
          line-height: 1.6;
          white-space: pre-wrap;
          color: ${isDark ? '#f4f4f5' : '#18181b'};
        }
      </style>
      <div>${escapedText}</div>
    `;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

onMounted(() => {
  renderEmail();

  // Observador de cambio de tema en <html> para re-renderizado instantáneo
  if (typeof document !== 'undefined') {
    themeObserver = new MutationObserver(() => {
      renderEmail();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }
});

onUnmounted(() => {
  if (themeObserver) {
    themeObserver.disconnect();
    themeObserver = null;
  }
});

watch(
  () => [props.html, props.texto],
  () => {
    renderEmail();
  }
);
</script>

<template>
  <div ref="containerRef" class="w-full text-zinc-800 dark:text-zinc-200"></div>
</template>
