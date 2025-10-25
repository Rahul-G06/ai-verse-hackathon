import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Proxy API requests to the backend during development.
  // FastAPI default port is often 8000 (uvicorn). Adjust if you run the backend on a different port.
  server: {
    proxy: {
      // Forward requests for these endpoints to the backend
      '/stt': 'http://localhost:8000',
      '/tts': 'http://localhost:8000',
    },
  },
})
