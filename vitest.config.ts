import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// Atenção (Windows): rode o vitest com a letra do drive maiúscula no cwd
// ("D:\...", no git bash "/D/..."). Com "d:" minúsculo os módulos ESM do
// vitest duplicam e nenhum teste roda ("Cannot read properties of undefined
// (reading 'config')"). Detalhes no devlog 003.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}', '.claude/hooks/**/*.test.ts'],
      setupFiles: ['./vitest.setup.ts'],
      passWithNoTests: true,
      // O Vitest esvazia CSS por padrão; o teste de contraste lê tokens.css?raw.
      css: { include: [/src[\\/]ui[\\/]tokens\.css/] },
    },
  }),
)
