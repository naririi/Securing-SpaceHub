import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig(({ command }) => {
  // 1. CONFIGURAZIONE PRODUZIONE (Docker / Nginx)
  if (command === 'build') {
    return {
      plugins: [react()],
      // In produzione, Nginx gestisce proxy e HTTPS. Vite non deve fare nulla.
    }
  }

  // 2. CONFIGURAZIONE SVILUPPO LOCALE (npm run dev)
  return {
    plugins: [react()],
    server: {
      https: {
        key: fs.readFileSync(path.resolve(__dirname, '../backend/certs/server.key')),
        cert: fs.readFileSync(path.resolve(__dirname, '../backend/certs/server.cert')),
      },
      proxy: {
        '/api': {
          target: 'https://localhost:3000',
          secure: false,  
          changeOrigin: true
        },
        '/auth': {
          target: 'https://localhost:3000',
          secure: false,
          changeOrigin: true
        }
      }
    }
  }
})