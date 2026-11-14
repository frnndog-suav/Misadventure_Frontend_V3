import { describe, expect, it } from 'vitest'
import { healthResponseSchema } from './health'
import { healthFixture } from '../mocks/fixtures'

describe('REQ-01: schema de HealthResponse (CONTRATO §3 FEAT-01)', () => {
  it('REQ-01: aceita a fixture de sucesso { status: "ok", contractVersion: "0.4" }', () => {
    const r = healthResponseSchema.safeParse(healthFixture)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data).toEqual({ status: 'ok', contractVersion: '0.4' })
    }
  })

  it('REQ-01: rejeita objeto vazio', () => {
    expect(healthResponseSchema.safeParse({}).success).toBe(false)
  })

  it('REQ-01: rejeita status diferente de "ok"', () => {
    expect(
      healthResponseSchema.safeParse({ status: 'down', contractVersion: '0.4' })
        .success,
    ).toBe(false)
  })

  it('REQ-01: rejeita contractVersion ausente ou que não seja string', () => {
    expect(healthResponseSchema.safeParse({ status: 'ok' }).success).toBe(false)
    expect(
      healthResponseSchema.safeParse({ status: 'ok', contractVersion: 0.4 })
        .success,
    ).toBe(false)
  })

  it('REQ-01: rejeita valores que não são objeto', () => {
    expect(healthResponseSchema.safeParse(null).success).toBe(false)
    expect(healthResponseSchema.safeParse('ok').success).toBe(false)
  })
})
