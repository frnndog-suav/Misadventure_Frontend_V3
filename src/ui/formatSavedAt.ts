const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })
const timeFormat = new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' })

/** "14/11/2026 18:30" no fuso do jogador (D-32: só formatação; D-35). */
export function formatSavedAt(iso: string): string {
  const date = new Date(iso)
  return `${dateFormat.format(date)} ${timeFormat.format(date)}`
}
