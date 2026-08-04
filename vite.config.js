import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // GitHub Pages serves this project under /Glorisk/. The dev server keeps the
  // root so that local URLs stay short.
  base: mode === 'production' ? '/Glorisk/' : '/',
  plugins: [react()],
}))
