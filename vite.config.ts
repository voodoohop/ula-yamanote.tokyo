import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  assetsInclude: ['**/*.mp3'], // Add MP3 files to asset handling
  server: {
    headers: {
      // Add cache control headers for audio files
      '*.mp3': {
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    }
  }
});
