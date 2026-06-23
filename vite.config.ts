import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/vfx-studio/',
  define: {
    'import.meta.env.VITE_PROXY_URL': JSON.stringify(
      'https://vfx-studio-proxy.unrealumanga.workers.dev'
    ),
  },
  optimizeDeps: {
    exclude: ['@xenova/transformers'],
  },
  worker: {
    format: 'es',
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'react';
          if (id.includes('node_modules/fabric')) return 'fabric';
          if (id.includes('node_modules/zustand')) return 'store';
        },
      },
    },
  },
});
