import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { spawn, type ChildProcess } from 'child_process';
import http from 'http';

function emailServerPlugin(): Plugin {
  let emailProcess: ChildProcess | null = null;

  return {
    name: 'email-server-launcher',
    apply: 'serve',
    configureServer(server) {
      // No lanzar el servidor de correo durante la ejecución de tests.
      if (process.env.VITEST) return;

      // Verificar si el servidor ya está activo en el puerto 3002
      const req = http.get('http://localhost:3002/api/email/estado', (res) => {
        if (res.statusCode === 200) {
          console.log('\x1b[32m✔ [Email Server] Ya se encuentra activo en http://localhost:3002\x1b[0m');
        }
      });

      req.on('error', () => {
        console.log('\x1b[36m🚀 [Email Server] Iniciando automáticamente servidor de correo en http://localhost:3002...\x1b[0m');
        emailProcess = spawn(process.execPath, [path.resolve(__dirname, 'server/email-server.js')], {
          cwd: __dirname,
          stdio: 'inherit',
          windowsHide: false,
        });

        emailProcess.on('spawn', () => {
          console.log('\x1b[32m✔ [Email Server] Proceso iniciado correctamente.\x1b[0m');
        });

        emailProcess.on('error', (err) => {
          console.error('\x1b[31m✖ [Email Server] Error al iniciar:\x1b[0m', err.message);
        });

        emailProcess.on('exit', (code, signal) => {
          if (code && code !== 0) {
            console.warn(`\x1b[33m⚠ [Email Server] Proceso finalizado con código ${code}${signal ? ` (${signal})` : ''}.\x1b[0m`);
          }
          emailProcess = null;
        });
      });

      const detenerServidorCorreo = () => {
        if (emailProcess && !emailProcess.killed) {
          console.log('\x1b[33m🛑 [Email Server] Deteniendo servidor de correo...\x1b[0m');
          try {
            emailProcess.kill();
          } catch {}
          emailProcess = null;
        }
      };

      server.httpServer?.on('close', detenerServidorCorreo);
      process.on('exit', detenerServidorCorreo);
      process.on('SIGINT', detenerServidorCorreo);
      process.on('SIGTERM', detenerServidorCorreo);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), emailServerPlugin()],
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
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3002',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('lucide-vue-next')) return 'iconos';
          if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('dompurify')) return 'pdf';
          if (id.includes('/vue/') || id.includes('@vue') || id.includes('vue-router') || id.includes('pinia')) {
            return 'vue';
          }
          return 'vendor';
        },
      },
    },
  },
});
