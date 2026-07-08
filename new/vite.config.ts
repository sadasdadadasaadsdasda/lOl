import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { builtinModules } from 'module';

export default defineConfig({
  plugins: [react()],
  
  build: {
    // Main process build
    lib: {
      entry: resolve(__dirname, 'src/main/index.ts'),
      name: 'main',
      fileName: () => 'index.js',
      formats: ['es'],
    },
    outDir: resolve(__dirname, 'dist/main'),
    rollupOptions: {
      external: [
        'electron',
        ...builtinModules,
      ],
    },
  },
  
  // For development
  server: {
    port: 5173,
    strictPort: true,
  },
  
  // For production build of renderer
  renderer: {
    build: {
      outDir: resolve(__dirname, 'dist/renderer'),
      rollupOptions: {
        input: resolve(__dirname, 'src/main/index.html'),
      },
    },
  },
});
