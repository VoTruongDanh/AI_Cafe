import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Kiểm tra certificates có tồn tại không
const certPath = path.resolve(__dirname, '../../Backend/certificates/localhost.pem')
const keyPath = path.resolve(__dirname, '../../Backend/certificates/localhost-key.pem')
const hasCertificates = fs.existsSync(certPath) && fs.existsSync(keyPath)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    // Cho phep tat ca hosts de truy cap tu LAN
    allowedHosts: 'all',
    // Enable HTTPS nếu có certificates
    ...(hasCertificates && {
      https: {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      },
    }),
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // Backend chạy HTTP (artisan serve không hỗ trợ HTTPS)
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxy
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('[Vite Proxy] Error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('[Vite Proxy] Forwarding:', req.method, req.url, '-> http://localhost:8000' + req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('[Vite Proxy] Response:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
})

