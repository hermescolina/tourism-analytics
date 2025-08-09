// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   base: '/tourism-analytics/',
//   plugins: [react()],
//   server: {
//     host: '0.0.0.0',           // Exposes to WSL, LAN, Cloudflared
//     port: 5173,
//     allowedHosts: ['app.tourwise.shop']  // 👈 Add this line to fix the error
//   }
// })


// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   base: '/tourism-analytics/',
//   plugins: [react()],
//   server: {
//     host: '0.0.0.0',
//     port: 5173,
//     strictPort: true,
//     hmr: {
//       clientPort: 443,  // needed for HTTPS through Cloudflare Tunnel
//     },
//     allowedHosts: ['app.tourwise.shop']  // ✅ this solves the error
//   }
// })

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/tourism-analytics/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 443,  // needed for HTTPS through Cloudflare Tunnel
    },
    allowedHosts: ['app.tourwise.shop'],  // ✅ this solves the error
  },
  optimizeDeps: {
    include: ['sweetalert2'],  // ✅ Force SweetAlert2 to pre-bundle
  },
});
