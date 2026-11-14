import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { msw } from 'msw/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// O plugin msw/vite serve o worker só no dev e o emite no build apenas se
// algum bundle importar 'virtual:msw' — o guard import.meta.env.DEV em
// src/main.tsx garante que o build de release não contém MSW (D-04, D-07).
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), msw()],
})
