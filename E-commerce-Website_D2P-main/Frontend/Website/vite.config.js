import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Kiểm tra certificates có tồn tại không
const certPath = path.resolve(__dirname, '../Backend/certificates/localhost.pem')
const keyPath = path.resolve(__dirname, '../Backend/certificates/localhost-key.pem')
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
    allowedHosts: ['.trycloudflare.com', '.loca.lt', 'localhost'],
    // Enable HTTPS nếu có certificates
    ...(hasCertificates && {
      https: {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      },
    }),
    proxy: {
      '/api': {
        target: hasCertificates ? 'https://localhost:8000' : 'http://localhost:8000',
        changeOrigin: true,
        secure: false, // Cho phép self-signed certificates
      },
    },
  },
})

