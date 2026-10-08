import pluginVue from 'eslint-plugin-vue';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import globals from 'globals';

export default defineConfigWithVueTs(
  {
    ignores: ['dist/**', 'node_modules/**', '**/*.d.ts', 'vite.config.js'],
  },
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  {
    files: ['src/**/*.{ts,vue}'],
    rules: {
      // Formato visual lo maneja el editor; aquí solo reglas de corrección
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
      'vue/html-indent': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/attributes-order': 'off',
      'vue/multi-word-component-names': 'off',
      // <Can I="..." an="..."> sigue la convención de CASL
      'vue/attribute-hyphenation': ['warn', 'always', { ignore: ['I'] }],
      'vue/prop-name-casing': ['warn', 'camelCase', { ignoreProps: ['I'] }],
      // Regla DEVFORGE: nunca mutar props, siempre emitir eventos
      'vue/no-mutating-props': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: ['server/**/*.js', 'scripts/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
);
