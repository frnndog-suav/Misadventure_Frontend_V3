// REQ-05 / D-07: o build de release não contém código de src/lab/ nem a rota /lab.
// Uso: npm run test:build (gera o build e roda esta busca no dist/).
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'
// Marcas de src/lab/: o título da tela e o caminho da rota.
const MARKS = [
  'Laboratório',
  'Laborat\u00f3rio',
  '"/lab"',
  "'/lab'",
  'src/lab/',
]

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? files(p) : [p]
  })
}

const found = []
for (const file of files(DIST).filter((f) => /\.(js|html|css)$/.test(f))) {
  const text = readFileSync(file, 'utf8')
  for (const mark of MARKS)
    if (text.includes(mark)) found.push(`${file}: ${mark}`)
}

if (found.length > 0) {
  console.error('REQ-05 falhou: o build de release contém o laboratório:')
  for (const f of found) console.error(`  ${f}`)
  process.exit(1)
}
console.log('REQ-05 ok: o build de release não contém o laboratório.')
