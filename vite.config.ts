import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      "/backend": {
        target: 'http://localhost:1880',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/backend/, '')
      },
    }
  }
})
