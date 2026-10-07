
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Chemins relatifs : fonctionne à la racine d'un domaine comme sur GitHub Pages (/Space-InZader/)
  base: './',
  server: {
    port: 5173,
    open: true
  }
});
