import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// O proxy repassa as chamadas que começam com /api para a API em Go (porta 5000).
// Assim o navegador não bloqueia por CORS durante o desenvolvimento.
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
