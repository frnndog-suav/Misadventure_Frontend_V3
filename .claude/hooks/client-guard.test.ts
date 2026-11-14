// Testes da guarda de src/ (spec D-08). O guard não é código de produto,
// então os nomes citam a decisão D-08 em vez de um REQ.
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { checkSource } from './client-guard.mjs'

// O Vitest roda com cwd na raiz do repositório (vitest.config.ts).
const repoRoot = process.cwd()
const hookPath = join(repoRoot, '.claude', 'hooks', 'client-guard.mjs')

const rules = (violations) => violations.map((v) => v.rule)

describe('D-08: Math.random proibido em src/', () => {
  it('D-08: sinaliza Math.random em qualquer arquivo de src/', () => {
    const v = checkSource(
      'src/features/combat/Combat.tsx',
      'const x = Math.random()\n',
    )
    expect(rules(v)).toContain('math-random')
    expect(v[0].message).toContain('backend')
  })

  it('D-08: ignora Math.random dentro de comentário', () => {
    const v = checkSource(
      'src/App.tsx',
      '// Math.random é proibido\n/* Math.random() */\n',
    )
    expect(v).toEqual([])
  })
})

describe('D-08: any proibido em src/', () => {
  it('D-08: sinaliza ": any", "as any" e "any[]"', () => {
    const v = checkSource(
      'src/api/client.ts',
      'const a: any = 1\nconst b = x as any\nconst c: any[] = []\n',
    )
    expect(rules(v)).toEqual(['no-any', 'no-any', 'no-any'])
  })

  it('D-08: não sinaliza palavras que contêm "any" (many, company)', () => {
    const v = checkSource(
      'src/App.tsx',
      'const many = 1\nconst company = "any name"\n',
    )
    expect(rules(v)).not.toContain('no-any')
  })
})

describe('D-08: rede (fetch, XMLHttpRequest, WebSocket, io() ) só em src/api/', () => {
  it('D-08: sinaliza fetch/XMLHttpRequest/WebSocket/io( fora de src/api/', () => {
    const v = checkSource(
      'src/features/shop/Shop.tsx',
      'fetch("/x")\nnew XMLHttpRequest()\nnew WebSocket("ws://x")\nconst s = io("/ws")\n',
    )
    expect(rules(v)).toEqual(['network', 'network', 'network', 'network'])
  })

  it('D-08: permite fetch e io( em src/api/', () => {
    const v = checkSource(
      'src/api/client.ts',
      'fetch("/x")\nconst s = io("/ws")\n',
    )
    expect(v).toEqual([])
  })

  it('D-08: não sinaliza nomes parecidos (ratio(), prefetchQuery)', () => {
    const v = checkSource(
      'src/App.tsx',
      'const r = ratio(2)\nqueryClient.prefetchQuery(k)\n',
    )
    expect(v).toEqual([])
  })

  it('D-08: sinaliza import de socket.io-client fora de src/api/', () => {
    const v = checkSource(
      'src/App.tsx',
      "import { io } from 'socket.io-client'\n",
    )
    expect(rules(v)).toContain('network')
  })
})

describe('D-08: importar src/mocks/ só no ponto de entrada de dev e nos testes', () => {
  it('D-08: sinaliza import de mocks em componente', () => {
    const v = checkSource(
      'src/features/shop/Shop.tsx',
      "import { handlers } from '../../mocks/handlers'\n",
    )
    expect(rules(v)).toEqual(['mocks-import'])
  })

  it('D-08: permite import de mocks em src/main.tsx, em testes e dentro de src/mocks/', () => {
    const imp = "import { handlers } from './mocks/handlers'\n"
    expect(checkSource('src/main.tsx', imp)).toEqual([])
    expect(checkSource('src/features/shop/Shop.test.tsx', imp)).toEqual([])
    expect(
      checkSource(
        'src/mocks/browser.ts',
        "import { handlers } from './handlers'\n",
      ),
    ).toEqual([])
  })
})

describe('D-08: importar src/lab/ só na rota de dev', () => {
  it('D-08: sinaliza import de lab em componente e em teste de outra área', () => {
    const imp = "import { Lab } from '../lab/Lab'\n"
    expect(rules(checkSource('src/features/shop/Shop.tsx', imp))).toEqual([
      'lab-import',
    ])
    expect(rules(checkSource('src/features/shop/Shop.test.tsx', imp))).toEqual([
      'lab-import',
    ])
  })

  it('D-08: permite import de lab no ponto de entrada de dev e dentro de src/lab/', () => {
    expect(
      checkSource('src/main.tsx', "import { Lab } from './lab/Lab'\n"),
    ).toEqual([])
    expect(
      checkSource('src/lab/routes.tsx', "import { Panel } from './Panel'\n"),
    ).toEqual([])
  })
})

describe('D-08: escopo da guarda', () => {
  it('D-08: ignora arquivos fora de src/ e arquivos que não são código', () => {
    expect(
      checkSource('tests/e2e/shop/shop.spec.ts', 'Math.random()\n'),
    ).toEqual([])
    expect(checkSource('vite.config.ts', 'Math.random()\n')).toEqual([])
    expect(checkSource('src/index.css', 'content: "any";\n')).toEqual([])
  })

  it('D-08: arquivo limpo não gera violações', () => {
    const v = checkSource(
      'src/App.tsx',
      "import { useState } from 'react'\nconst [a] = useState(0)\n",
    )
    expect(v).toEqual([])
  })
})

describe('D-08: modos de execução', () => {
  it('D-08: --all passa (exit 0) com o src/ atual limpo', () => {
    // lança se exit != 0
    execFileSync(process.execPath, [hookPath, '--all'], { cwd: repoRoot })
  })

  it('D-08: --all falha (exit 1) e cita o princípio quando um arquivo de src/ tem Math.random', () => {
    const tmpDir = join(repoRoot, 'src', '__guard_tmp__')
    const tmpFile = join(tmpDir, 'bad.ts')
    mkdirSync(tmpDir, { recursive: true })
    writeFileSync(tmpFile, 'export const x = Math.random()\n')
    try {
      let failed = false
      try {
        execFileSync(process.execPath, [hookPath, '--all'], { cwd: repoRoot })
      } catch (err) {
        failed = true
        expect(err.status).toBe(1)
        expect(String(err.stdout)).toContain('backend')
      }
      expect(failed).toBe(true)
    } finally {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it('D-08: modo hook (stdin) devolve exit 2 e mensagem no stderr para edição com violação', () => {
    const tmpDir = join(repoRoot, 'src', '__guard_tmp__')
    const tmpFile = join(tmpDir, 'bad.ts')
    mkdirSync(tmpDir, { recursive: true })
    writeFileSync(tmpFile, 'export const x = Math.random()\n')
    try {
      const input = JSON.stringify({
        tool_name: 'Write',
        tool_input: { file_path: tmpFile },
      })
      let failed = false
      try {
        execFileSync(process.execPath, [hookPath], { cwd: repoRoot, input })
      } catch (err) {
        failed = true
        expect(err.status).toBe(2)
        expect(String(err.stderr)).toContain('Math.random')
      }
      expect(failed).toBe(true)
    } finally {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it('D-08: modo hook ignora arquivo fora de src/ (exit 0)', () => {
    const input = JSON.stringify({
      tool_name: 'Edit',
      tool_input: { file_path: join(repoRoot, 'CLAUDE.md') },
    })
    execFileSync(process.execPath, [hookPath], { cwd: repoRoot, input })
  })
})
