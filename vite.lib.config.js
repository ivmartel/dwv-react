import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// peer dependencies and dwv: provided by the consuming application
const EXTERNALS = [
  /^react($|\/)/,
  /^react-dom($|\/)/,
  /^@mui\//,
  /^@emotion\//,
  /^dwv$/
];

// https://vite.dev/guide/build#library-mode
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/dwv-react-lib',
    emptyOutDir: true,
    copyPublicDir: false,
    sourcemap: true,
    lib: {
      entry: 'src/index.js',
      formats: ['es'],
      fileName: 'index',
      cssFileName: 'style'
    },
    rolldownOptions: {
      external: (id) => EXTERNALS.some((regex) => regex.test(id))
    }
  }
});
