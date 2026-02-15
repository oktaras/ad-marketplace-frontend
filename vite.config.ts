import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      '.ngrok-free.dev',
      '.ngrok-free.app',
      '.ngrok.io',
    ],
    hmr: {
      clientPort: 443,
    },
    proxy: {
      '/api': {
        target: 'https://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/media': {
        target: 'https://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }

          if (id.includes('@tonconnect')) {
            return 'tonconnect';
          }

          if (id.includes('@telegram-tools/ui-kit')) {
            return 'ui-kit';
          }

          if (id.includes('@tanstack/react-query')) {
            return 'query';
          }

          if (id.includes('react-i18next') || id.includes('i18next')) {
            return 'i18n';
          }

          if (id.includes('dayjs') || id.includes('date-fns')) {
            return 'dates';
          }

          if (id.includes('@radix-ui')) {
            return 'radix';
          }

          if (id.includes('recharts')) {
            return 'charts';
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
