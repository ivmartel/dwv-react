import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test:{
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html'],
      thresholds: {
        statements: 10,
        branches: 10,
        functions: 10,
        lines: 10
      }
    }
  }
})