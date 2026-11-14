import { describe, expect, it } from 'vitest'
import css from './tokens.css?raw'

function token(name: string): string {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(css)
  if (!match)
    throw new Error(`token --${name} ausente ou fora do formato #rrggbb`)
  return match[1]
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// Todo token --color-* do arquivo entra no teste; só as exceções abaixo saem.
const colorTokens = [...css.matchAll(/--(color-[a-z-]+):/g)].map((m) => m[1])
const backgrounds = ['color-bg', 'color-surface']
const decorative = ['color-border'] // nunca informativo (D-21)
const nonTextTokens = ['color-focus'] // contorno de foco: 3:1
const textTokens = colorTokens.filter(
  (t) =>
    !backgrounds.includes(t) &&
    !decorative.includes(t) &&
    !nonTextTokens.includes(t),
)

it('REQ-02: o arquivo de tokens define cores para o teste conferir', () => {
  expect(textTokens.length).toBeGreaterThan(0)
})

describe('REQ-02: contraste dos tokens do tema escuro (WCAG AA)', () => {
  for (const bg of backgrounds) {
    for (const fg of textTokens) {
      it(`REQ-02: --${fg} sobre --${bg} tem contraste ≥ 4.5:1`, () => {
        expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5)
      })
    }
    for (const fg of nonTextTokens) {
      it(`REQ-02: --${fg} sobre --${bg} tem contraste ≥ 3:1`, () => {
        expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(3)
      })
    }
  }
})
