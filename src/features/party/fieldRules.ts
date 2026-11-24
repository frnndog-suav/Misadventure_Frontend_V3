export const invalidQuantity = 'Use um número inteiro a partir de 1.'

/** Inteiro ≥ `min` digitado num campo (formato, não regra do jogo). */
export function isIntFrom(value: string, min: number): boolean {
  return /^\d+$/.test(value) && Number(value) >= min
}

export function byCardId(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}
