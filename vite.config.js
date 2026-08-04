import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves this project under /Glorisk/
  base: process.env.GITHUB_ACTIONS ? '/Glorisk/' : '/',
  plugins: [react()],
})
