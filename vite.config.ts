import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://english-trainer-fa5tuocd1-gub72s-projects.vercel.app',
        changeOrigin: true,
      },
    },
  },
})
