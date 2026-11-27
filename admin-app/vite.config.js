import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: { proxy: { '/api': { target: 'https://v2.showmine.ng', changeOrigin: true, secure: true } } },
});
