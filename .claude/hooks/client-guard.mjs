#!/usr/bin/env node
/**
 * Guarda de src/ (spec D-08). Dois modos:
 *   - hook (padrão): lê o JSON do PostToolUse pelo stdin, checa o arquivo
 *     editado e sai com código 2 (mensagem no stderr) se houver violação;
 *   - --all: varre todo o src/ e sai com código 1 listando as violações.
 *
 * As mesmas regras existem no ESLint (eslint.config.js); o hook é a resposta
 * imediata após cada edição, o ESLint é a verificação precisa.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const CODE_FILE = /\.(ts|tsx|js|jsx|mts|mjs|cts|cjs)$/

const MESSAGES = {
  'math-random':
    'D-08/Princípio 1 (o backend decide, o frontend mostra): `Math.random` é proibido em src/ — sorteio vem do backend e animações são determinísticas.',
  'no-any':
    'D-08/Princípio 5 (tipagem estrita): `any` é proibido em src/ — use `unknown` + validação.',
  network:
    'D-08/Princípio 2 (contrato primeiro): `fetch`, `XMLHttpRequest`, `WebSocket` e `io(` só em src/api/ — toda comunicação com o backend passa pelo contrato.',
  'mocks-import':
    'D-08/Princípio 3 (o MSW só devolve fixtures): importar src/mocks/ só no ponto de entrada de dev (src/main.tsx) e nos testes.',
  'lab-import':
    'D-08/Princípio 4 (laboratório só no dev): importar src/lab/ só na rota de dev (src/main.tsx até a T-03).',
}

/** Troca comentários por espaços preservando as quebras de linha. */
function blankComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length))
}

/** Extrai os especificadores de import/export/require/import() de uma linha. */
function importSpecifiers(line) {
  const specs = []
  const re =
    /(?:\b(?:import|export)\b[^'"()]*?\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|^\s*import\s*)['"]([^'"]+)['"]/g
  for (let m; (m = re.exec(line));) specs.push(m[1])
  return specs
}

const refersTo = (spec, dir) => new RegExp(`(^|/)${dir}(/|$)`).test(spec)

/**
 * Checa um arquivo pelas regras da D-08.
 * @param {string} relPath caminho relativo à raiz do repositório (/ ou \)
 * @param {string} content conteúdo do arquivo
 * @returns {{ line: number, rule: string, message: string }[]}
 */
export function checkSource(relPath, content) {
  const path = relPath.replaceAll('\\', '/')
  if (!path.startsWith('src/') || !CODE_FILE.test(path)) return []

  const inApi = path.startsWith('src/api/')
  const inMocks = path.startsWith('src/mocks/')
  const inLab = path.startsWith('src/lab/')
  const isTest = /\.(test|spec)\.[^/]+$/.test(path)
  const isDevEntry = path === 'src/main.tsx'

  const violations = []
  const push = (line, rule) =>
    violations.push({ line, rule, message: MESSAGES[rule] })

  const lines = blankComments(content).split('\n')
  lines.forEach((text, i) => {
    const line = i + 1

    if (/\bMath\s*\.\s*random\b/.test(text)) push(line, 'math-random')

    for (const m of text.matchAll(
      /:\s*any\b|\bas\s+any\b|<\s*any\s*[,>]|\bany\s*\[\]/g,
    )) {
      void m
      push(line, 'no-any')
    }

    if (!inApi) {
      for (const m of text.matchAll(
        /\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bio\s*\(/g,
      )) {
        void m
        push(line, 'network')
      }
    }

    for (const spec of importSpecifiers(text)) {
      if (
        !inApi &&
        (spec === 'socket.io-client' || spec.startsWith('socket.io-client/'))
      ) {
        push(line, 'network')
      }
      if (
        refersTo(spec, 'mocks') &&
        !(isDevEntry || isTest || inMocks || inLab)
      ) {
        push(line, 'mocks-import')
      }
      if (refersTo(spec, 'lab') && !(isDevEntry || inLab || inMocks)) {
        push(line, 'lab-import')
      }
    }
  })

  return violations
}

function listCodeFiles(dir) {
  const files = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) files.push(...listCodeFiles(full))
    else if (CODE_FILE.test(name)) files.push(full)
  }
  return files
}

function formatViolations(relPath, violations) {
  return violations
    .map(
      (v) =>
        `${relPath.replaceAll('\\', '/')}:${v.line} [${v.rule}] ${v.message}`,
    )
    .join('\n')
}

function runAll() {
  const root = process.cwd()
  let output = ''
  for (const file of listCodeFiles(join(root, 'src'))) {
    const rel = relative(root, file)
    const violations = checkSource(rel, readFileSync(file, 'utf8'))
    if (violations.length > 0)
      output += formatViolations(rel, violations) + '\n'
  }
  if (output) {
    process.stdout.write(output)
    process.exit(1)
  }
  process.stdout.write('client-guard: src/ limpo (D-08)\n')
}

async function runHook() {
  let raw = ''
  for await (const chunk of process.stdin) raw += chunk
  let filePath
  try {
    filePath = JSON.parse(raw)?.tool_input?.file_path
  } catch {
    return // entrada que não é o JSON do hook: não bloqueia
  }
  if (typeof filePath !== 'string') return

  const rel = relative(process.cwd(), filePath)
  if (rel.startsWith('..')) return

  let content
  try {
    content = readFileSync(filePath, 'utf8')
  } catch {
    return // arquivo apagado/renomeado: nada a checar
  }

  const violations = checkSource(rel, content)
  if (violations.length > 0) {
    process.stderr.write(formatViolations(rel, violations) + '\n')
    process.exit(2)
  }
}

if (process.argv[1]?.endsWith('client-guard.mjs')) {
  if (process.argv.includes('--all')) runAll()
  else await runHook()
}
