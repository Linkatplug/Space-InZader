
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pkg from './package.json';

declare const process: { env: Record<string, string | undefined> };

// Version affichée dans le menu : SI_BUILD / SI_BUILD_DATE (fournis par deploy/update.sh
// au build Docker), sinon version de package.json suivie de « -dev ».
const build = process.env.SI_BUILD && process.env.SI_BUILD !== 'dev' ? process.env.SI_BUILD : `${pkg.version}-dev`;
const buildDate = process.env.SI_BUILD_DATE ?? '';

export default defineConfig({
  plugins: [react()],
  // Chemins relatifs : fonctionne à la racine d'un domaine comme sur GitHub Pages (/Space-InZader/)
  base: './',
  define: {
    __BUILD__: JSON.stringify(build),
    __BUILD_DATE__: JSON.stringify(buildDate),
  },
  server: {
    port: 5173,
    open: true
  }
});
