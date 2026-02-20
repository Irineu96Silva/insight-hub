import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    quasar({
      sassVariables: 'src/css/quasar.variables.scss'
    })
  ],
  resolve: {
    alias: {
      'src': resolve(__dirname, './src'),
      'boot': resolve(__dirname, './src/boot'),
      'stores': resolve(__dirname, './src/stores'),
      'layouts': resolve(__dirname, './src/layouts'),
      'pages': resolve(__dirname, './src/pages'),
      'components': resolve(__dirname, './src/components'),
      'services': resolve(__dirname, './src/services'),
      'composables': resolve(__dirname, './src/composables'),
      'assets': resolve(__dirname, './src/assets'),
    }
  },
  server: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }
});
