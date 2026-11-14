import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Guarda de src/ (spec D-08) — as mesmas regras do hook
// .claude/hooks/client-guard.mjs, sem plugin novo. O `any` já é coberto por
// @typescript-eslint/no-explicit-any (tseslint.configs.recommended).
const mocksPattern = {
  group: ['**/mocks', '**/mocks/**'],
  message:
    'D-08/Princípio 3 (o MSW só devolve fixtures): importar src/mocks/ só no ponto de entrada de dev (src/main.tsx) e nos testes.',
}
const labPattern = {
  group: ['**/lab', '**/lab/**'],
  message:
    'D-08/Princípio 4 (laboratório só no dev): importar src/lab/ só no ponto de entrada de dev (src/main.tsx).',
}
const socketPattern = {
  group: ['socket.io-client', 'socket.io-client/**'],
  message:
    'D-08/Princípio 2 (contrato primeiro): socket.io-client só em src/api/ — toda comunicação com o backend passa pelo contrato.',
}
const networkMessage =
  'D-08/Princípio 2 (contrato primeiro): `fetch`, `XMLHttpRequest`, `WebSocket` e `io(` só em src/api/ — toda comunicação com o backend passa pelo contrato.'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // D-08 em todo o src/
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message:
            'D-08/Princípio 1 (o backend decide, o frontend mostra): `Math.random` é proibido em src/ — sorteio vem do backend e animações são determinísticas.',
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: networkMessage },
        { name: 'XMLHttpRequest', message: networkMessage },
        { name: 'WebSocket', message: networkMessage },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='io']",
          message: networkMessage,
        },
      ],
      'no-restricted-imports': [
        'error',
        { patterns: [mocksPattern, labPattern, socketPattern] },
      ],
    },
  },
  {
    // src/api/ pode falar com a rede (é a única camada que pode)
    files: ['src/api/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': 'off',
      'no-restricted-syntax': 'off',
      'no-restricted-imports': [
        'error',
        { patterns: [mocksPattern, labPattern] },
      ],
    },
  },
  {
    // ponto de entrada de dev: pode importar mocks e lab
    files: ['src/main.tsx'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [socketPattern] }],
    },
  },
  {
    // testes: podem importar mocks (não lab)
    files: ['src/**/*.{test,spec}.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [labPattern, socketPattern] },
      ],
    },
  },
  {
    // dentro de mocks/ e lab/ (ambos só existem no dev) os imports entre si são livres
    files: ['src/mocks/**/*.{ts,tsx}', 'src/lab/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [socketPattern] }],
    },
  },
])
