import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'happy-dom',
      include: ['src/**/*.{test,spec}.ts', 'server/**/*.{test,spec}.{js,ts}'],
      // Fija zona horaria de RD para que los tests de fechas sean deterministas
      env: { TZ: 'America/Santo_Domingo' },
    },
  }),
);
