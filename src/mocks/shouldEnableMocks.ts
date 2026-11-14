/**
 * Liga o MSW só no dev e só com VITE_USE_MOCKS='true' (spec D-04, D-10).
 * Fora do dev nunca liga: o build de release não contém o MSW.
 */
export function shouldEnableMocks(env: {
  DEV: boolean
  VITE_USE_MOCKS?: string
}): boolean {
  return env.DEV && env.VITE_USE_MOCKS === 'true'
}
