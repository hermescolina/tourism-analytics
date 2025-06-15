import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/tourism-analytics/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',           // Exposes to WSL, LAN, Cloudflared
    port: 5173,
    allowedHosts: ['app.tourwise.shop']  // 👈 Add this line to fix the error
  }
})
