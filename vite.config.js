import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
// https://vite.dev/config/
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@core': path.resolve(__dirname, './src/core'),
            '@modules': path.resolve(__dirname, './src/modules'),
            '@shared': path.resolve(__dirname, './src/shared'),
        },
    },
    server: {
        port: 3000,
        open: false,
    },
});
