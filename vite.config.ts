import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { spawn } from 'child_process';

function expressApiPlugin() {
  return {
    name: 'express-api-plugin',
    configureServer(server) {
      if (process.env.NODE_ENV !== 'production') {
        const apiProcess = spawn('npx', ['tsx', 'server.ts'], {
          env: { ...process.env, PORT: '3001', NODE_ENV: 'development' },
          stdio: 'inherit',
          shell: true,
        });
        
        process.on('exit', () => apiProcess.kill());
        server.httpServer?.on('close', () => apiProcess.kill());
      }
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), expressApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
