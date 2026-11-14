// Formatação de números das cartas (D-30): o valor é o que o backend mandou,
// só escrito em pt-BR. Nenhuma conta.

const numberFormat = new Intl.NumberFormat('pt-BR')
const signedFormat = new Intl.NumberFormat('pt-BR', {
  signDisplay: 'exceptZero',
})

/** Vírgula decimal ("1,2"). */
export function formatNumber(n: number): string {
  return numberFormat.format(n)
}

/** Com sinal ("+12", "−2"); o sinal de menos é o tipográfico. */
export function formatSigned(n: number): string {
  return signedFormat.format(n).replace('-', '−')
}
