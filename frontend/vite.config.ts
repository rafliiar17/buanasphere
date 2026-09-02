import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    tailwindcss(),
    svelte(),
  ],
  resolve: {
    alias: {
      $lib: path.resolve(__dirname, './src/lib'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'https://kurs-world-api.rafztesting.workers.dev',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('plotly.js-dist-min')) {
            return 'plotly-vendor';
          }
          if (id.includes('three') || id.includes('globe.gl') || id.includes('three-globe')) {
            return 'three-vendor';
          }
          if (id.includes('lucide-svelte') || id.includes('bits-ui')) {
            return 'ui-vendor';
          }
        },
      },
    },
  },
});
