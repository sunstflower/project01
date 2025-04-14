import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
    proxy: {
      // 配置代理
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    },
    watch: {
      ignored: ['**/.venv/**', '**/backend/**', '**/node_modules/**']
    },
    cors: true // 启用CORS
  },
  resolve: {
    alias: {
      '@': path.resolve(new URL('./src', import.meta.url).pathname),
    },

    extensions: ['.js', '.ts', '.jsx', '.tsx']
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
})