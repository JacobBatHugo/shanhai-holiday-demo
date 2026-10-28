import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
export default defineConfig({
  base: '/shanhai-holiday-demo/',
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5175, strictPort: true },
  preview: { host: '127.0.0.1', port: 5176, strictPort: true },
  build: { outDir: 'docs', emptyOutDir: true },
  test: { pool: 'threads', include: ['src/*.test.{ts,tsx}'], css: { include: [/\.css\?raw$/] } },
})
