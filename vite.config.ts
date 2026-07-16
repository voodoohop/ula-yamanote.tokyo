import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const cesiumSource = 'node_modules/cesium/Build/Cesium';
const cesiumBaseUrl = 'cesium';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: ['Assets', 'ThirdParty', 'Widgets', 'Workers'].map((directory) => ({
        src: `${cesiumSource}/${directory}`,
        dest: cesiumBaseUrl,
      })),
    }),
  ],
  define: {
    CESIUM_BASE_URL: JSON.stringify(`/${cesiumBaseUrl}/`),
  },
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/cesium/')) return 'cesium';
          if (id.includes('/node_modules/@cesium/')) return 'cesium';
        },
      },
    },
  },
  assetsInclude: ['**/*.mp3'],
});
