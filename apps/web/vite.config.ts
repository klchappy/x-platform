import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5200,
    host: true,
    proxy: {
      '/v1': {
        target: process.env.VITE_API_URL ?? 'http://localhost:4250',
        changeOrigin: true,
      },
      '/health': {
        target: process.env.VITE_API_URL ?? 'http://localhost:4250',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5200,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1024,
  },
});
