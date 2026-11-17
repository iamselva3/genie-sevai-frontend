import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5273, strictPort: true },
  preview: { port: 5273, strictPort: true },
  build: {
    target: 'es2020',
    modulePreload: { polyfill: false },
  },
});
