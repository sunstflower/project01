import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true 
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