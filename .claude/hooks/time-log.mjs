// Registro automático de tempo (docs/devlog/tempo.html).
// Hook (UserPromptSubmit/Stop): `node .claude/hooks/time-log.mjs <evento>` acrescenta
//   "<ISO local> <evento>" em docs/devlog/tempo-eventos.log.
// Resumo: `node .claude/hooks/time-log.mjs --resumo [AAAA-MM-DD]` soma o tempo ativo por dia:
//   intervalos entre eventos consecutivos contam só se forem menores que PAUSA_MIN (senão é pausa).
import { appendFileSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const PAUSA_MIN = 30
const LOG = join(process.cwd(), 'docs', 'devlog', 'tempo-eventos.log')

function isoLocal(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

const arg = process.argv[2] ?? 'evento'

if (arg !== '--resumo') {
  try {
    appendFileSync(LOG, `${isoLocal(new Date())} ${arg}\n`)
  } catch {
    // nunca atrapalhar a sessão
  }
  process.exit(0)
}

const filtro = process.argv[3]
if (!existsSync(LOG)) {
  console.log('Sem eventos registrados.')
  process.exit(0)
}
const tempos = readFileSync(LOG, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((l) => l.split(' ')[0])
  .filter((t) => !filtro || t.startsWith(filtro))
  .map((t) => new Date(t))
  .sort((a, b) => a - b)

const porDia = new Map()
for (let i = 1; i < tempos.length; i++) {
  const min = (tempos[i] - tempos[i - 1]) / 60000
  if (min <= 0 || min >= PAUSA_MIN) continue
  const dia = isoLocal(tempos[i - 1]).slice(0, 10)
  porDia.set(dia, (porDia.get(dia) ?? 0) + min)
}
for (const [dia, min] of porDia) {
  console.log(
    `${dia}  ${(Math.round((min / 60) * 4) / 4).toFixed(2)} h  (${Math.round(min)} min ativos)`,
  )
}
