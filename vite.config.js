import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Google OAuth validates the complete browser origin. Keep local
    // development on the JavaScript origin already authorized in Console.
    host: 'localhost',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api/google': {
        target: 'https://photoslibrary.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/google/, ''),
      },
    },
  },
})
