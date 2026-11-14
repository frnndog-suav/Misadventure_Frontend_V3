/// <reference types="vite/client" />
/// <reference types="msw/vite/client" />

// Variáveis de ambiente do frontend (spec D-10).
interface ImportMetaEnv {
  /** Endereço do backend (cliente HTTP de src/api/, a partir da FEAT-01). */
  readonly VITE_API_URL?: string
  /** 'true' liga o MSW no dev. */
  readonly VITE_USE_MOCKS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
