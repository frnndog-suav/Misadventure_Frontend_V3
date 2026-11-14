import { describe, expect, it } from 'vitest'
import { shouldEnableMocks } from './shouldEnableMocks'

describe('T-03: ligar o MSW só no dev (D-10)', () => {
  it('T-03: liga o MSW no dev com VITE_USE_MOCKS="true"', () => {
    expect(shouldEnableMocks({ DEV: true, VITE_USE_MOCKS: 'true' })).toBe(true)
  })

  it('T-03: não liga o MSW no dev sem a variável', () => {
    expect(shouldEnableMocks({ DEV: true })).toBe(false)
  })

  it('T-03: não liga o MSW no dev com VITE_USE_MOCKS="false"', () => {
    expect(shouldEnableMocks({ DEV: true, VITE_USE_MOCKS: 'false' })).toBe(
      false,
    )
  })

  it('T-03: nunca liga o MSW fora do dev, mesmo com VITE_USE_MOCKS="true"', () => {
    expect(shouldEnableMocks({ DEV: false, VITE_USE_MOCKS: 'true' })).toBe(
      false,
    )
  })
})
