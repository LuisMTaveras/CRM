<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';

const props = defineProps<{
  html?: string;
  texto?: string;
}>();

const containerRef = ref<HTMLElement | null>(null);
let shadowRoot: ShadowRoot | null = null;

function renderEmail() {
  if (!containerRef.value) return;

  if (!shadowRoot) {
    shadowRoot = containerRef.value.attachShadow({ mode: 'open' });
  }

  if (props.html) {
    // Sanitizar etiquetas <script> para proteger contra inyección de código
    const sanitizedHtml = props.html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Estilos encapsulados para el Shadow DOM:
    // Todo lo que esté aquí dentro está 100% aislado del resto de la aplicación y jamás se filtrará al DOM global.
    const resetStyles = `
      <style>
        :host {
          display: block;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-size: 0.8125rem;
          line-height: 1.6;
          color: inherit;
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
          color: #4f46e5;
          text-decoration: underline;
        }
        p {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
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
          color: inherit;
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
