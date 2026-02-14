import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: 'index-phaser.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
