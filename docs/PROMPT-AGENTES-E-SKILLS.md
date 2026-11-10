# Prompt: montar o sistema de agentes e skills spec-anchored em qualquer projeto

> **Como usar:** abra o Claude Code na raiz do projeto novo e cole este arquivo inteiro no chat (ou salve-o no projeto e diga "siga `PROMPT-AGENTES-E-SKILLS.md`"). O texto abaixo é dirigido ao Claude que vai fazer a montagem.

---

## 0. Sua missão

Você vai montar, **neste projeto**, um sistema de trabalho com agentes e skills do Claude Code (`.claude/agents/*.md`, `.claude/skills/<nome>/SKILL.md`, `.claude/hooks/`, `.claude/settings.json`), mais os documentos que ele usa (`CLAUDE.md`, a spec e o devlog).

O sistema já foi usado num projeto real e provou estas qualidades. Elas são o que precisa sobreviver à adaptação:

1. **Spec-anchored:** existe um documento que é a fonte da verdade (a *spec*). Toda mudança de comportamento começa nele, é aprovada pelo usuário e só depois vira teste e código.
2. **TDD:** os testes são escritos a partir de critérios **Dado / Quando / Então** antes da implementação ("red" → "green").
3. **Uma etapa por vez:** o agente faz uma tarefa, para, entrega um **roteiro de testes** que o usuário executa e espera autorização para a próxima. Nunca encadeia tarefas.
4. **Escopo fechado:** nada além do que a tarefa pede. Ambiguidade real vira pergunta (com uma opção recomendada), nunca invenção.
5. **Rastreabilidade:** cada requisito tem ID e aparece no nome de um teste; cada etapa gera uma entrada no *devlog*, escrita para que outra IA consiga replicar o projeto.
6. **Guardas automáticas:** um hook e o linter barram, a cada edição, as violações das regras de arquitetura.
7. **Papéis separados:** quem escreve teste não escreve produção; quem estiliza não muda comportamento; quem revisa só lê.
8. **Economia de tokens:** o agente principal faz o trabalho sozinho por padrão e só chama subagentes quando vale o custo; lê a spec por partes; recomenda `/clear` entre tarefas.
9. **Histórico antes de mudar:** antes de alterar algo, o agente lê o devlog da área e o `git log` dos arquivos, para entender por que o código está como está.

Você **não** copia o tema do projeto de origem (era um motor de jogo-livro). Você adapta a estrutura, os comportamentos e as regras ao tema, ao conteúdo e à stack **deste** projeto.

### Regras para você durante a montagem

- **Uma fase por vez.** Siga as fases da Seção 2 e pare onde elas mandam parar.
- **Não instale nenhuma dependência** sem autorização explícita.
- **Não sobrescreva** `CLAUDE.md`, `.claude/` ou docs existentes sem ler antes e mostrar o que muda. Se já houver algo, **mescle**.
- **Não faça commits.** O usuário commita; você só sugere a mensagem.
- Escreva os arquivos gerados no **idioma que o usuário usa** com você (identificadores e nomes de arquivos de código seguem a convenção do projeto).

---

## 1. Vocabulário e marcadores

Os modelos abaixo usam marcadores `{{…}}`. Na Fase 1 você descobre o valor de cada um; na Fase 3 você os substitui. **Nenhum `{{…}}` pode sobrar nos arquivos gerados.**

| Marcador | O que é | Exemplo |
|---|---|---|
| `{{PROJETO}}` | nome do projeto | "Loja Aurora" |
| `{{DOMINIO}}` | uma frase sobre o que o sistema faz | "PDV offline para pequenas lojas" |
| `{{SPEC}}` | caminho da spec | `docs/SPEC.md` |
| `{{DEVLOG}}` | pasta do devlog | `docs/devlog/` |
| `{{NUCLEO}}` | pasta da lógica de domínio pura (o "motor") | `src/core/`, `src/domain/`, `app/services/` |
| `{{NOME_NUCLEO}}` | como o projeto chama o núcleo | "motor", "domínio", "core" |
| `{{UI}}` | pasta da interface (se houver) | `src/ui/`, `app/views/` |
| `{{OUTRAS_CAMADAS}}` | persistência, store, API, adaptadores | `src/persistence/`, `src/store/` |
| `{{CONTEUDO}}` | pasta de conteúdo em dados (se houver) | `content/`, `data/`, `fixtures/` |
| `{{PRIVADO}}` | pasta de conteúdo privado, fora do Git (se houver) | `content/private/` |
| `{{FORMATO_CONTEUDO}}` | formato e schema do conteúdo | "JSON validado por Zod (SPEC §3.3)" |
| `{{UNIDADE}}` | a unidade do conteúdo que se transcreve em blocos | "seção", "produto", "questão", "capítulo", "registro" |
| `{{FONTE_EXTERNA}}` | de onde o conteúdo pode vir para ser convertido | "PDF", "planilha", "site", "CSV legado" |
| `{{IDIOMA_UI}}` / `{{IDIOMA_CODIGO}}` | idioma dos textos para o usuário / dos identificadores | "pt-BR" / "inglês" |
| `{{STACK}}` | linguagens, frameworks e libs autorizadas | "Vite + React + TS + Vitest + Playwright" |
| `{{CMD_TESTE}}` | suíte unitária inteira | `npm test`, `pytest`, `go test ./...` |
| `{{CMD_TESTE_AFETADOS}}` | testes ligados aos arquivos mudados | `npx vitest related --run <arqs>`, `pytest --testmon`, `jest --findRelatedTests` |
| `{{CMD_E2E}}` / `{{CMD_E2E_AREA}}` | e2e inteiro / de uma área | `npx playwright test` / `npx playwright test tests/e2e/<área>` |
| `{{CMD_TIPOS}}` | checagem de tipos | `npm run typecheck`, `mypy .`, `tsc -b` |
| `{{CMD_LINT}}` | linter | `npm run lint`, `ruff check` |
| `{{CMD_FORMAT}}` / `{{CMD_FORMAT_CHECK}}` | formatar / conferir formatação | `npm run format` / `npm run format:check` |
| `{{CMD_BUILD}}` | build | `npm run build` |
| `{{CMD_VALIDAR}}` | validador de conteúdo | `npm run validate -- <arquivo>` |
| `{{CMD_DEV}}` | rodar o app | `npm run dev` |
| `{{FORMATO_COMMIT}}` | formato das mensagens de commit do usuário | `tipo/descrição curta em minúsculas` (ex.: `feat/phase 12 completed`) |
| `{{PROIBIDOS_NUCLEO}}` | o que o núcleo não pode usar | `Math.random`, `Date.now`, DOM, `localStorage`, `fetch`, `any`, imports de UI |
| `{{AREAS_E2E}}` | áreas da UI com testes e2e e os arquivos que afetam cada uma | ver `/testar` |
| `{{GUIA_VISUAL}}` | direção de arte, fonte, paleta, tokens | "minimalista editorial, fonte Inter, tokens no @theme" |

IDs usados pelo sistema (mantenha estes, salvo se o usuário preferir outros):
- `REQ-nn`: requisito testável (Dado/Quando/Então).
- `D-nn`: decisão (arquitetura, regra, UX, códigos de erro…). Uma das primeiras é a lista de **códigos de erro**.
- `T-nn`: tarefa, numa lista ordenada de checkboxes (`- [ ]` / `- [x]`).
- `UX-nn`: etapa visual no devlog (se houver UI).
- **Versão da spec** no cabeçalho (`0.1`, `0.2`…) e uma tabela de **histórico** no fim.

---

## 2. Fases da montagem

### Fase 1 — Descobrir o projeto (só leitura) e perguntar

1. Leia o que existe: `README`, `CLAUDE.md`, `package.json`/`pyproject.toml`/equivalente, configs de teste, lint e formatação, a árvore de pastas (sem dependências), `.gitignore`, `.claude/` e `git log --oneline -20` (para o formato dos commits do usuário).
2. Preencha a tabela de marcadores com o que conseguir deduzir.
3. Pergunte ao usuário (AskUserQuestion, com a opção recomendada primeiro) **só** o que não deu para deduzir e que muda o que você vai gerar. Normalmente:
   - quais **camadas** existem (núcleo puro? UI? persistência? conteúdo em dados? conteúdo privado?);
   - quais **regras de arquitetura inegociáveis** o projeto quer (ex.: "somente frontend", "núcleo determinístico", "sem rede em tempo de execução");
   - se já existe uma spec ou se ela vai ser criada agora (nesse caso, você cria o esqueleto, não o conteúdo);
   - o idioma da interface e do código;
   - o formato de commit, se o `git log` não mostrar um padrão.
4. **Não escreva nada ainda.**

### Fase 2 — Propor o mapa e PARAR

Monte e mostre ao usuário:

1. **Tabela de módulos** (Seção 3): quais módulos entram (Núcleo, Visual, Conteúdo), com o nome adaptado de cada agente e skill. Exemplos de renome:
   - `checar-motor` → `checar` (ou `checar-<núcleo>`);
   - `validar-aventura` → `validar-<conteúdo>`;
   - `converter-pdf` → `converter-<fonte>`;
   - `padronizar-ptbr` → `padronizar-texto` (ou `padronizar-<idioma>`).
2. **Constituição proposta** (a lista de princípios da Seção 4, já adaptada).
3. **Valores dos marcadores.**
4. **Lista de arquivos** que serão criados ou alterados.

Peça aprovação. Ajuste o que o usuário pedir.

### Fase 3 — Gerar os arquivos

Na ordem:
1. `CLAUDE.md` (Seção 4).
2. Esqueleto da spec em `{{SPEC}}`, se ela não existir (Seção 5). Não invente requisitos: deixe a estrutura e, no máximo, a T-01.
3. `{{DEVLOG}}README.md` e a entrada `000-fundacao.md` (Seção 6).
4. Hook de guarda + `.claude/settings.json` (Seção 7), se houver núcleo com regras proibidas.
5. Skills (Seção 8) e agentes (Seção 9) dos módulos aprovados.
6. Scripts auxiliares (Seção 10), se o módulo Conteúdo entrou.
7. Regras de lint equivalentes ao hook, se o linter do projeto permitir (ex.: `no-restricted-imports`, `no-restricted-globals`, `no-restricted-properties` no ESLint), **sem instalar plugin novo** sem autorização.

### Fase 4 — Verificar e PARAR

1. Confira que nenhum `{{` sobrou: `grep -rn "{{" CLAUDE.md .claude {{SPEC}} {{DEVLOG}}`.
2. Confira o frontmatter de cada agente e skill (`name` igual ao nome do arquivo/pasta, `description` dizendo **o que faz e quando usar**).
3. Teste o hook nos dois modos: `node .claude/hooks/<guarda>.mjs --all` e um arquivo de teste com uma violação proposital (depois apague).
4. Registre a montagem com o formato do devlog (entrada `000`).
5. Entregue ao usuário:
   - o que foi criado (tabela arquivo → papel);
   - o **roteiro de testes** (ex.: "reinicie o Claude Code; digite `/` e confira que aparecem `/tarefa`, `/mudar-spec`…; peça `/checar` e confira a tabela de saída; edite um arquivo do núcleo com `Math.random()` e confira que o hook bloqueia com a mensagem X");
   - a mensagem de commit sugerida no `{{FORMATO_COMMIT}}`;
   - o aviso: **o Claude Code carrega agentes e skills no início da sessão. Reinicie a sessão para eles aparecerem.**

---

## 3. Módulos

| Módulo | Quando entra | Skills | Agentes | Outros |
|---|---|---|---|---|
| **Núcleo** (sempre) | todo projeto | `/tarefa`, `/mudar-spec`, `/checar`, `/testar`, `/registrar-etapa` | `test-writer`, `core-dev`, `spec-reviewer` | `CLAUDE.md`, spec, devlog, hook de guarda |
| **UI** | o projeto tem interface | — | `ui-dev` | áreas de e2e no `/testar` |
| **Visual** | o projeto tem interface e o usuário se importa com a aparência | `/guia-visual`, `/icones` (ou `/assets`), `/visual`, `/revisar-visual` | `ux-designer`, `motion-dev` | tokens de design |
| **Conteúdo** | o comportamento é dirigido por dados (JSON/YAML/planilhas/fixtures) | `/validar-<conteúdo>`, `/converter-<fonte>`, `/padronizar-texto` | `content-author`, `revisor-texto` | validador, scripts de dividir/juntar/checar |

Se um módulo não fizer sentido, não o crie, e tire dos outros arquivos as referências a ele.

---

## 4. `CLAUDE.md` (constituição)

Modelo. Mantenha os princípios universais; adapte ou remova os marcados como *adaptável*.

````markdown
# {{PROJETO}}

{{DOMINIO}}

A fonte da verdade é **`{{SPEC}}`** (spec-anchored). Toda mudança de comportamento começa na spec e só depois vai para o código.

## Constituição (princípios inegociáveis)

1. **{{RESTRICAO_DE_ARQUITETURA}}** *(adaptável: ex.: "Somente frontend. Nada de backend nem rede em tempo de execução.")*
2. **O {{NOME_NUCLEO}} é puro.** `{{NUCLEO}}` não importa UI, não faz I/O e não acessa persistência. As outras camadas só consomem o {{NOME_NUCLEO}}.
3. **O {{NOME_NUCLEO}} é determinístico.** *(adaptável)* Aleatoriedade e relógio entram injetados (RNG com semente, `now` como parâmetro). É proibido {{PROIBIDOS_NUCLEO}} em `{{NUCLEO}}`.
4. **Estado imutável.** *(adaptável)* As operações recebem o estado e devolvem um novo (`(state, action) → { state, events }`), sem mutar a entrada.
5. **Conteúdo é dado, não código.** *(módulo Conteúdo)* O conteúdo fica em {{FORMATO_CONTEUDO}}. O {{NOME_NUCLEO}} não conhece nenhum conteúdo específico.
6. **Conteúdo privado fica fora do Git.** *(se houver)* `{{PRIVADO}}` está no `.gitignore`. Nada dele vai para commits, devlog ou respostas longas.
7. **TDD no {{NOME_NUCLEO}}.** Todo requisito tem testes escritos a partir dos critérios Dado/Quando/Então antes da implementação. Uma tarefa que mexe numa área da UI também cobre essa área com e2e. Ao fim de uma tarefa, rodam os testes do contexto afetado, não a suíte inteira.
8. **Tipagem estrita.** *(adaptável à linguagem)* Sem `any` (use `unknown` + validação). Uniões discriminadas para ações, eventos e variantes, com `switch` exaustivo.
9. **Escopo fechado.** O agente implementa só o que a tarefa pede. Se algo estiver ambíguo, pergunta antes de inventar um comportamento.
10. **Idioma.** Identificadores em {{IDIOMA_CODIGO}}. Textos para o usuário em {{IDIOMA_UI}}. O glossário da spec faz a ponte.
11. **Dependências mínimas.** Toda biblioteca externa precisa de autorização do usuário. As autorizadas estão na spec; qualquer outra, pergunte antes de instalar.
12. **Avanço autorizado.** Uma tarefa por vez. Ao terminar, pare, entregue o **roteiro de testes** (passos que o usuário executa, com o resultado esperado de cada um) e espere autorização explícita para a próxima. Nunca encadeie tarefas. A suíte automatizada não precisa de aprovação, salvo quando realmente necessário.
13. **Rastreabilidade.** Cada etapa gera uma entrada em `{{DEVLOG}}`.

## Fluxo de trabalho

| Quero… | Use |
|---|---|
| Implementar uma tarefa | `/tarefa T-xx` |
| Mudar um comportamento / regra | `/mudar-spec <descrição>` |
| Conferir a definição de pronto | `/checar` |
| Rodar os testes afetados (ou `tudo`) | `/testar` |
| Registrar uma etapa no devlog | `/registrar-etapa` (a `/tarefa` já chama) |
| *(Conteúdo)* Validar um arquivo de conteúdo | `/validar-<conteúdo> <arquivo>` |
| *(Conteúdo)* Converter {{FONTE_EXTERNA}} em conteúdo | `/converter-<fonte> <arquivo>` |
| *(Conteúdo)* Padronizar o texto do conteúdo | `/padronizar-texto <arquivo>` |
| *(Visual)* Mudar visual, animação, ícone | `/visual <descrição>` (referência: `/guia-visual`, `/icones`; revisão: `/revisar-visual`) |

**Antes de alterar qualquer funcionalidade ou visual**, consulte `{{DEVLOG}}README.md` e as entradas da área, e rode `git log --oneline -- <arquivos>`, para entender por que o código está como está.

Agentes (`.claude/agents/`): *(liste só os criados, uma linha cada: nome e papel)*

## Stack (autorizada)

{{STACK}}. Qualquer outra lib: pergunte.

## Convenções

- **Imports / módulos:** *(regra de alias e caminhos do projeto)*
- **Testes:** ao lado do código (`x.ts` → `x.test.ts`) *(ou a convenção do projeto)*. O nome de cada teste cita o requisito: `it('REQ-12: …')`. Aleatoriedade sempre por um RNG fixo de teste (ex.: `fixedRng([...])`).
- **End-to-end:** em `tests/e2e/<área>/`, com ajudantes compartilhados num `fixtures`. Uma área ganha e2e só quando uma tarefa mexe nela. Nunca usam `{{PRIVADO}}`.
- **Rodar só o que foi afetado:** use `/testar`. A suíte inteira só roda com `/testar tudo`, quando o usuário pedir ou quando a mudança for de infraestrutura.
- **Erros do {{NOME_NUCLEO}}:** ações inválidas retornam `{ ok: false, error }` com um código da lista de códigos de erro da spec; nunca lançam exceção.
- **Estilo:** *(formatador e regras)*. Rode `{{CMD_FORMAT}}` antes de terminar.
- **Verificação:** cada tarefa é verificada pelos testes, pelo próprio produto e pelo roteiro de testes. Nenhuma tarefa cria painel ou tela de desenvolvimento.
- **Commits:** o usuário faz. O agente só sugere a mensagem, no formato `{{FORMATO_COMMIT}}`.

## Guardas automáticas

- Linter proíbe em `{{NUCLEO}}`: {{PROIBIDOS_NUCLEO}}.
- Hook `.claude/hooks/core-guard.mjs`: as mesmas regras, rodando após cada edição em `{{NUCLEO}}`. Também roda manualmente com `--all`.

## Comandos

```
{{CMD_DEV}}
{{CMD_TESTE}}
{{CMD_E2E}}
{{CMD_TIPOS}}
{{CMD_LINT}}
{{CMD_FORMAT}}
{{CMD_VALIDAR}}
{{CMD_BUILD}}
node .claude/hooks/core-guard.mjs --all
```
````

---

## 5. Esqueleto da spec (`{{SPEC}}`)

Crie só se não existir. Estrutura:

````markdown
# {{PROJETO}} — Especificação

> **Versão da spec:** 0.1 · **Data:** AAAA-MM-DD

## 1. Visão
O problema, o público, o que está fora do escopo.

## 2. Regras do domínio
As regras de negócio em linguagem natural, com números exatos.

## 3. Arquitetura
### 3.1 Glossário
| Termo na interface ({{IDIOMA_UI}}) | Identificador no código | Definição |
### 3.2 Stack, módulos e bibliotecas autorizadas
Pastas, módulos (um arquivo por responsabilidade) e a lista de libs autorizadas.
### 3.3 Modelo de dados
Os tipos, literalmente como vão para o código (uniões discriminadas).
### 3.4 API pública e eventos
Funções do {{NOME_NUCLEO}}, ações, eventos emitidos e a ordem deles.

## Requisitos
### REQ-01 — <nome>
- **Dado** <estado>, **quando** <ação>, **então** <resultado exato>.
- (um critério por linha; cada um vira pelo menos um teste)

## Decisões
- **D-01 — <título>:** decisão e motivo.
- **D-0x — Códigos de erro:** `CODIGO_X` (quando acontece), …

## 4. Tarefas
- [ ] **T-01 — <título>** (REQ-01, D-03). Onde aparece no produto / como verificar.

## 8. Histórico
| Versão | Data | Mudança |
|---|---|---|
| 0.1 | AAAA-MM-DD | Versão inicial. |

## Apêndice A — Exemplo de conteúdo *(módulo Conteúdo)*
Um conteúdo pequeno, original, que exercita todas as regras. Serve de fixture dos testes.
````

Regras da spec que as skills aplicam:
- Nunca renumerar `REQ`/`D`/`T` existentes; o novo recebe o próximo número livre.
- Toda mudança incrementa a versão e ganha uma linha no histórico.
- Uma mudança que afeta tarefas já feitas (`[x]`) gera uma **tarefa nova de alinhamento**; se afeta só tarefas `[ ]`, ajusta o texto delas.
- Se a mudança altera o formato de dados persistidos, incremente a versão do schema salvo e trate a migração.

---

## 6. Devlog (`{{DEVLOG}}`)

`README.md` do devlog:

````markdown
# Devlog

Registro de cada etapa, escrito para que **outra IA consiga replicar o projeto** lendo as entradas em ordem.

## Formato de uma entrada (`NNN-<ID>-<slug>.md`)
- **Cabeçalho:** ID, data (AAAA-MM-DD), status (`aguardando revisão` | `concluída`), versão da spec.
- **Objetivo**
- **Decisões** (e onde estão na spec: `D-xx`, `REQ-xx`)
- **Passos e comandos** (comandos completos, instalações com versão)
- **Arquivos** (criados / alterados)
- **Como verificar** (o que o usuário vê no produto e os comandos)
- **Problemas** (e como foram resolvidos)
- **Checks** (resultado real, com números)
- **Commit sugerido**

## Índice
| Nº | ID | Título | Status |
|---|---|---|---|
| 000 | FUND | Fundação: agentes, skills, guardas | aguardando revisão |

## Como replicar
O que um projeto novo precisa para ter o mesmo sistema (agentes, skills, guardas, convenções).
````

---

## 7. Hook de guarda

Gere `.claude/hooks/core-guard.mjs` com as regras do `{{PROIBIDOS_NUCLEO}}` (adapte as expressões regulares à linguagem do núcleo):

````js
#!/usr/bin/env node
// Guarda da Constituição para {{NUCLEO}}.
// Modo hook (PostToolUse): lê o JSON do stdin e checa só o arquivo editado (sai com 2 para bloquear).
// Modo CLI: `node .claude/hooks/core-guard.mjs --all` varre a pasta inteira.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const ROOT = resolve(process.env.CLAUDE_PROJECT_DIR ?? process.cwd())
const CORE_DIR = resolve(ROOT, '{{NUCLEO}}')
const EXT = /\.(ts|tsx)$/ // adapte: /\.py$/, /\.go$/…

// Uma regra por proibição. A mensagem cita o princípio da Constituição.
const RULES = [
  { re: /\bMath\.random\s*\(/, msg: 'Math.random() é proibido; use o RNG injetado (princípio 3).' },
  { re: /\bDate\.now\s*\(|\bnew Date\s*\(/, msg: 'Relógio do sistema quebra o determinismo (princípio 3).' },
  { re: /from\s+['"](react|react-dom)(\/[^'"]*)?['"]/, msg: 'O núcleo não importa UI (princípio 2).' },
  { re: /\b(localStorage|sessionStorage|document|window)\s*\./, msg: 'O núcleo não acessa DOM nem storage (princípio 2).' },
  { re: /(:\s*any\b|\bas\s+any\b|<any\b|\bany\[\])/, msg: 'Sem `any`; use `unknown` + validação (princípio 8).' },
]

const norm = (p) => (process.platform === 'win32' ? p.toLowerCase() : p)
const isCoreFile = (f) => {
  const abs = norm(resolve(ROOT, f))
  return abs.startsWith(norm(CORE_DIR)) && EXT.test(abs)
}

// Remove comentários preservando as quebras de linha (os números de linha batem).
const stripComments = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .split('\n')
    .map((l) => l.replace(/\/\/.*$/, ''))
    .join('\n')

function check(file) {
  const problems = []
  stripComments(readFileSync(file, 'utf8'))
    .split('\n')
    .forEach((line, i) => {
      for (const { re, msg } of RULES) if (re.test(line)) problems.push(`${relative(ROOT, file)}:${i + 1}  ${msg}`)
    })
  return problems
}

const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })

if (process.argv.includes('--all')) {
  if (!existsSync(CORE_DIR)) {
    console.log('{{NUCLEO}} ainda não existe; nada a checar.')
    process.exit(0)
  }
  const problems = walk(CORE_DIR).filter(isCoreFile).flatMap(check)
  if (problems.length) {
    console.error(`Violações da Constituição (${problems.length}):\n${problems.join('\n')}`)
    process.exit(1)
  }
  console.log('core-guard: OK.')
  process.exit(0)
}

let input = ''
process.stdin.on('data', (c) => (input += c))
process.stdin.on('end', () => {
  let file
  try {
    file = JSON.parse(input)?.tool_input?.file_path
  } catch {
    process.exit(0)
  }
  if (!file || !isCoreFile(file) || !existsSync(file)) process.exit(0)
  const problems = check(file)
  if (problems.length) {
    console.error(`core-guard: corrija antes de continuar.\n${problems.join('\n')}`)
    process.exit(2)
  }
})
````

E em `.claude/settings.json` (mescle se o arquivo existir):

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/core-guard.mjs\"" }]
      }
    ]
  }
}
```

Se o projeto não for Node, escreva a guarda na linguagem que o projeto já tem (ou em Node, se `node` estiver disponível), mantendo os dois modos (hook pelo stdin e `--all`).

---

## 8. Skills

Formato de cada `.claude/skills/<nome>/SKILL.md`:

```markdown
---
name: <nome>
description: <o que faz, em uma ou duas frases> Use quando <gatilhos concretos: o que o usuário diz ou o momento do fluxo>.
argument-hint: <o que vem depois do comando>
model: sonnet            # opcional: só na /tarefa (economia; o trabalho é guiado pela spec)
---

# /<nome> — <título>

Pedido: **$ARGUMENTS**
...
```

`$ARGUMENTS` recebe o que o usuário digitou depois do comando. A `description` decide quando a skill dispara: seja concreto nos gatilhos.

### 8.1 `/tarefa` (Núcleo)

````markdown
---
name: tarefa
description: Implementa UMA tarefa T-xx de {{SPEC}} no fluxo spec-anchored com TDD (testes primeiro a partir dos critérios Dado/Quando/Então, escopo fechado, definição de pronto, registro no devlog, revisão) e PARA aguardando autorização. Use quando o usuário pedir para implementar, fazer, começar ou continuar uma tarefa T-xx, ou "a próxima tarefa".
argument-hint: T-xx (ou "próxima")
model: sonnet
---

# /tarefa — implementar uma tarefa da spec

Tarefa pedida: **$ARGUMENTS**

Regra de ouro: **uma tarefa por invocação**. Ao terminar, pare. Nunca comece a próxima sem autorização explícita.

## 1. Localizar a tarefa
1. Leia da spec **só** as partes que a tarefa cita: a linha da tarefa, os `REQ-xx` e `D-xx` dela, as partes da arquitetura que ela toca e o fim do histórico (para a próxima versão). Use busca (Grep); **não leia o arquivo inteiro**. A spec é a fonte da verdade: não confie em memória de sessões anteriores. Do índice do devlog, leia só o fim (o próximo número).
2. Argumento "próxima" ou vazio → a primeira `- [ ]`.
3. As tarefas são feitas **em ordem**. Se uma anterior estiver `[ ]`, avise e pergunte se deve seguir.
4. Liste para você: REQs e Ds, arquivos que ela toca, tipos envolvidos e onde a tarefa aparece no produto (como verificar).

## 2. Resolver ambiguidades antes do código
Releia os critérios e procure lacunas: bordas não descritas, ordem de aplicação, códigos de erro, interação com outros REQs.
- Ambiguidade **real** (o comportamento muda conforme a resposta) → AskUserQuestion, com uma opção recomendada. Não invente.
- Lib nova → pergunte antes.
- Anote cada decisão para os passos 7 e 8.

## 3. Testes primeiro (red)
**Quem escreve:** você mesmo, por padrão. O agente **test-writer** só entra quando a tarefa muda o {{NOME_NUCLEO}} ou a persistência, ou tem testes em várias áreas ao mesmo tempo. (Cada subagente começa sem contexto e relê o projeto, o que custa caro.) Quando ele entra, o prompt traz o ID da tarefa, os REQs, as decisões do passo 2 e as seções da spec a ler.

Rode os testes novos e confirme que **falham pelo motivo certo** (implementação ausente), não por erro no teste.

**E2E:** se a tarefa mexe numa área da UI (tabela da `/testar`), escreva ou amplie os e2e dessa área. Áreas não tocadas não ganham e2e.

## 4. Implementar (green)
Implemente você mesmo; siga as regras de `.claude/agents/core-dev.md` (e `ui-dev.md`) nas partes que a tarefa tocar.
- O mínimo para os testes passarem.
- **Nunca altere um teste para fazê-lo passar.** Se o teste contradiz a spec, pare e pergunte.
- Nada fora do escopo.

## 5. Verificação
Não crie painéis de desenvolvimento. A tarefa é verificada pelo produto e pelos testes. Sem tela? Diga qual comando ou fluxo a verifica.

## 6. Definição de pronto
`{{CMD_FORMAT}}` e depois **/checar** (que roda só os testes afetados pela **/testar**). Tudo verde.

## 7. Revisão
- Tarefa que muda uma regra (REQ) ou o {{NOME_NUCLEO}} → agente **spec-reviewer** com o ID.
- Tarefa só de tela ou docs → revise você mesmo o `git diff` contra a decisão: o código faz o que ela diz? Cada critério tem teste?
Corrija os bloqueantes; rode `/checar` de novo se algo mudou.

## 8. Fechar e PARAR
1. Marque `[x]` na spec.
2. Decisões tomadas → spec (novo `D-xx` ou critério no REQ), versão incrementada, linha no histórico.
3. **/registrar-etapa**.
4. Responda com:
   - o que foi feito (curto);
   - **Roteiro de testes** (obrigatório): passos numerados que o usuário executa sozinho. Cada passo diz *o que fazer* (comando, tela, controle, valor a digitar, ou uma alteração proposital no código para ver o erro) e *o que deve acontecer*. Inclua pelo menos um caso de erro/borda. Diga os pré-requisitos (salvar, rodar na raiz, servidor ligado) e **onde** o resultado aparece (arquivo/linha, tela, texto exato). Para cada controle de UI, diga a **tela/card**, o **nome visível** e o **tipo** (botão, rádio, caixa, campo). **Execute você mesmo cada passo antes** e copie o resultado real;
   - tabela critério → teste;
   - decisões registradas;
   - resultado dos checks;
   - mensagem de commit sugerida (`{{FORMATO_COMMIT}}`).
5. Pergunte se pode seguir para a próxima (diga qual). **Não comece.** Recomende ao usuário rodar **`/clear`** antes da próxima: cada mensagem reenvia a conversa inteira, e tudo o que a próxima tarefa precisa já está na spec, no devlog e na memória. (O agente não consegue rodar `/clear`.)

A suíte automatizada não precisa de aprovação. Só peça quando for realmente necessário (ex.: um critério que admite duas leituras e o teste fixa uma).
````

### 8.2 `/mudar-spec` (Núcleo)

````markdown
---
name: mudar-spec
description: Altera um comportamento começando pela spec ({{SPEC}}) - edita ou cria REQ/D, incrementa a versão, confere a consistência dos tipos, códigos de erro, validador e conteúdo de exemplo, e só depois alinha código e testes. Use quando o usuário quiser mudar uma regra, adicionar uma funcionalidade ou mecânica, ou quando um conteúdo tiver um caso que não cabe no modelo atual.
argument-hint: descrição da mudança
---

# /mudar-spec

Mudança pedida: **$ARGUMENTS**

A ordem é sempre **spec → aprovação → testes → código**. Não toque no código antes da aprovação.

## 1. Entender e localizar
1. Leia a spec (as partes afetadas).
2. Identifique o que a mudança afeta: REQs, Ds, tipos, códigos de erro, regras do validador, conteúdo de exemplo, tarefas.
3. Se a mudança vier de um conteúdo específico ("esse caso não cabe"), **generalize**: descreva a regra de forma que o {{NOME_NUCLEO}} continue sem conhecer conteúdo específico.
4. Se faltar informação para escrever critérios testáveis, pergunte.

## 2. Editar a spec
- Requisitos novos ou alterados em **Dado / Quando / Então**, com números exatos.
- Próximo `REQ-xx` livre; nunca renumere.
- Atualize tipos e códigos de erro, se for o caso, e as regras de integridade do validador.
- Ajuste o conteúdo de exemplo se ele precisar exercitar a regra nova.
- Tarefas: afeta `[x]` → crie uma tarefa nova de alinhamento (`T-nn — Alinhar <regra> (REQ-xx)`); afeta só `[ ]` → ajuste o texto.
- Incremente a versão; linha no histórico.

## 3. Mostrar e aguardar aprovação
Mostre o diff da spec e um resumo de impacto: o que muda no {{NOME_NUCLEO}}, no validador, no conteúdo e nos dados salvos já existentes. Espere.

## 4. Alinhar o código
Depois de aprovado:
- tarefa nova → **/tarefa T-xx**;
- só ajustou tarefas não feitas → pare;
- mudou o formato salvo → incremente a versão do schema salvo.
````

### 8.3 `/checar` (Núcleo — "definição de pronto")

````markdown
---
name: checar
description: Roda a definição de pronto - guarda do {{NOME_NUCLEO}}, tipos, lint, formatação, testes afetados (/testar) e build - e confere spec, rastreabilidade e devlog. Use ao final de qualquer tarefa, antes de marcar [x], ou quando o usuário perguntar se está tudo verde.
---

# /checar — definição de pronto

Rode nesta ordem e **não pare no primeiro erro** (colete tudo):
1. `node .claude/hooks/core-guard.mjs --all`
2. `{{CMD_TIPOS}}`
3. `{{CMD_LINT}}`
4. `{{CMD_FORMAT_CHECK}}`
5. **/testar** (só os afetados; a suíte inteira só quando o usuário pedir ou for infraestrutura)
6. `{{CMD_BUILD}}` (apague a pasta de saída depois, se ela não for versionada)

Confira manualmente:
- **Spec atualizada:** decisões no diff que não estão na spec.
- **Rastreabilidade:** todo `REQ-xx` da tarefa aparece em pelo menos um nome de teste (Grep).
- **Sem painel de desenvolvimento** no diff.
- **Devlog:** existe a entrada da tarefa e ela está no índice (pode ser criada depois deste check).
- **Conteúdo privado:** `git status` não lista nada de `{{PRIVADO}}`.

## Saída
| Check | Resultado |
|---|---|
| guarda | ✅ / ❌ (n violações) |
| tipos | … |
| lint | … |
| formatação | … |
| testes (afetados) | x passando, y falhando |
| e2e (áreas afetadas) | … / "nenhuma área afetada" |
| build | … |
| spec atualizada | … |
| rastreabilidade | … |
| devlog | … |
| privado fora do Git | … |

Abaixo, a saída de cada falha (arquivo:linha e mensagem). **Não corrija nada automaticamente**; quem chamou decide (formatar é a exceção segura, se só a formatação falhou).
````

### 8.4 `/testar` (Núcleo)

````markdown
---
name: testar
description: Roda só os testes afetados pelo que mudou - unitários ligados aos arquivos alterados e e2e nas áreas da UI que eles tocam - ou uma área específica, ou a suíte inteira com "tudo". Use no fim de cada tarefa (a /tarefa e a /checar chamam), quando o usuário pedir para rodar os testes, ou para conferir que uma mudança não quebrou nada.
---

# /testar

Pedido: **$ARGUMENTS** (vazio = o que mudou; nome de área = só ela; `tudo` = suíte inteira).

Regra: **não rode todos os testes toda hora.** Rode os do contexto que a mudança impactou.

## 1. O que mudou
```
git diff --name-only HEAD
git ls-files --others --exclude-standard
```
Junte as listas. **Não rodam nada:** `docs/**`, `*.md`, `.claude/**` *(e outras pastas sem código)*. Se só sobrou isso, diga "nenhum teste afetado" e pare.

**Infraestrutura → suíte inteira:**
- unitários: *(manifesto de dependências, lockfile, configs do test runner, do compilador, do linter, setup global de testes)*;
- e2e: *(config do e2e, fixtures compartilhadas, ponto de entrada do app, CSS global, conteúdo usado pelos e2e)*.

## 2. Unitários
`{{CMD_TESTE_AFETADOS}}`
- Passe **sempre, junto, os testes alterados e os testes vizinhos de cada arquivo alterado** (`x.ts` → `x.test.ts`, `x.*.test.ts`): a busca por imports pode não pegar o teste ao lado.
- Arquivos de conteúdo importados pelos testes entram na lista.
- Depois de mover ou apagar arquivos lidos por glob, desligue o cache de módulos do runner (o cache pode guardar um glob antigo).

## 3. E2E (`tests/e2e/<área>/`)
`{{CMD_E2E_AREA}}` para cada área tocada que **existe**:

{{AREAS_E2E}}
*(tabela: Área | Arquivos que a afetam)*

- Um teste e2e alterado roda a si mesmo.
- Mudança nos tipos centrais, na API pública ou na store afeta todas as áreas.
- **Arquivo fora da tabela:** rode todas as áreas e acrescente o arquivo à tabela.
- **Área sem pasta ainda:** diga "a área X ainda não tem e2e". Quem cria é a tarefa que mexer nela.
- E2E nunca usam conteúdo privado; aleatoriedade fixada por semente.

## 4. `tudo`
`{{CMD_TESTE}}` e `{{CMD_E2E}}`.

## Saída
| Suíte | O que rodou | Resultado |
|---|---|---|

Abaixo, a saída de cada falha. Não corrija nada: quem chamou decide.
````

### 8.5 `/registrar-etapa` (Núcleo)

````markdown
---
name: registrar-etapa
description: Cria ou atualiza a entrada do devlog ({{DEVLOG}}NNN-<id>-<slug>.md) de uma etapa - objetivo, decisões, passos e comandos, arquivos, como verificar, problemas, checks e commit sugerido - e atualiza o índice. Use ao fim de cada tarefa (a /tarefa chama) e depois de qualquer trabalho fora das tarefas que mude configuração, dependências ou estrutura.
argument-hint: T-xx ou descrição da etapa
---

# /registrar-etapa

Etapa: **$ARGUMENTS**

O devlog existe para que **outra IA consiga replicar o projeto** lendo as entradas em ordem. Escreva para esse leitor: concreto, com comandos exatos e o porquê de cada decisão. Nada de "melhorias diversas".

## Passos
1. Leia o README do devlog (formato e índice) e a última entrada, para manter o estilo.
2. Junte os fatos, sem inventar: `git status` e `git diff --stat` (inclua não rastreados); comandos executados (instalações com versão); decisões e onde estão na spec; problemas e soluções; resultado real dos checks, com números.
3. Número: o próximo `NNN`. Se a etapa já tem entrada (re-trabalho), **atualize-a** com uma seção "Revisão AAAA-MM-DD".
4. Crie a entrada no formato do README. Em **Como verificar**, o que o usuário deve ver no produto e os comandos.
5. Atualize o índice (status `aguardando revisão`). O commit do usuário conta como confirmação: ao criar uma entrada nova, marque como `concluída` as anteriores que já estão em commit (`git log --oneline -- {{DEVLOG}}`).
6. Se a etapa mudou algo que um projeto novo também precisaria (agente, skill, guarda, convenção), atualize **Como replicar**.

## Regras
- Datas absolutas (AAAA-MM-DD).
- Não copie código longo; aponte o arquivo. Comandos, sim, por inteiro.
- Só **sugira** o commit (`{{FORMATO_COMMIT}}`).
- Nada de conteúdo privado no devlog.
````

### 8.6 `/guia-visual` (Visual — referência, não fluxo)

Gere um guia **com o conteúdo do projeto**, perguntando ao usuário o que não souber. Seções obrigatórias:

1. **Direção de arte:** a referência estética e a tabela "característica da referência → tradução na UI". Uma lista **proibida** (o que nunca usar).
2. **Tipografia:** família, origem dos arquivos (local, sem CDN se o projeto for offline), escala (corpo, interface, títulos, rótulos), números tabulares. Fonte nova só com autorização.
3. **Cor e tema:** paleta bruta + **tokens semânticos** (tabela token → uso). A UI usa só tokens, nunca cores soltas. Temas suportados e a regra "todo estilo novo funciona em todos os temas". **Contraste inegociável:** WCAG AA (4.5:1 texto; 3:1 texto grande, ícones informativos e contorno de foco).
4. **Superfícies e texturas:** painel, botão (normal, pressionado, desabilitado), altura mínima de toque (44 px), regras de textura (nunca sob texto corrido). "Opacidade não marca estado" (derruba o contraste; use um token de "desligado").
5. **Movimento:** durações (micro 80–150 ms; tela 200–350 ms; teto 500 ms), easing, como representar impacto/sucesso/erro, **nunca bloquear a entrada** (o estado já mudou quando a animação começa; o anúncio acessível não espera), só `transform`/`opacity`, determinismo (sem aleatório; keyframes fixos), `prefers-reduced-motion` (sem deslocamento; no máximo um fade curto). Os padrões já existentes no código, para manter a coerência.
6. **Layout e acessibilidade:** mobile primeiro (360 px sem rolagem horizontal), controles reais com `focus-visible`, tooltips que não cobrem o controle, rolagem interna focável, textos e papéis ARIA da spec **não mudam** numa tarefa visual.
7. **Antes de mudar qualquer coisa:** devlog da área + `git log`; spec das telas; decisão durável vira `D-xx` e atualiza este guia.

Coloque um **estado** no topo ("direção aprovada em AAAA-MM-DD; valores de verdade em `<arquivo de tokens>`").

### 8.7 `/icones` (Visual — ou `/assets`)

Convenção de ícones/assets do projeto:
- **Duas camadas nunca misturadas:** originais (fora do bundle, com manifesto e conferência de hash, nunca editados no lugar) e versões do produto (geradas por script a partir dos originais escolhidos; só estas são importadas).
- **Nome:** `kebab-case` em {{IDIOMA_CODIGO}}, igual ao id do catálogo.
- **Formato e estilo:** grade, escala, paleta do guia, contorno, iluminação, número de cores.
- **Acessibilidade:** ao lado de texto → decorativo (`alt=""`, `aria-hidden`); sem texto → rótulo acessível em {{IDIOMA_UI}}. Ícone nunca é a única informação.
- **Como ligar ícone a um dado:** recursos fixos (a UI escolhe) vs. ids no conteúdo (lista **fechada**; id fora dela é erro de schema; item sem ícone gera aviso; genérico explícito permitido). Escolha o id **pela imagem**, não pelo nome.
- **Catálogo:** lista de ids disponíveis, por categoria; planejados à parte. "Ao acrescentar um ícone, adicione o id aqui."
- Passo a passo para um ícone novo (entrada no manifesto → script → catálogo no código → lista da skill), com o teste que confere que todo id tem imagem.

### 8.8 `/visual` (Visual — fluxo)

````markdown
---
name: visual
description: Fluxo de UMA mudança de UX/design (estilo, tipografia, animação, transição, ícones, layout) - consulta o devlog e o git log, separa o que é visual do que é comportamento (spec), delega aos agentes ux-designer e motion-dev, roda os checks e a revisão visual, registra no devlog e PARA com um roteiro de testes. Use quando o usuário pedir para deixar algo mais bonito, mudar estilo, cor, fonte, animação, transição, ícone ou layout.
argument-hint: descrição da mudança visual
---

# /visual

Mudança pedida: **$ARGUMENTS**. **Uma mudança por invocação.**

## 1. Contexto (obrigatório)
1. Leia **/guia-visual**.
2. Histórico: índice do devlog e as entradas que tocaram os mesmos arquivos/telas; `git log --oneline -- <arquivos>` (e `git show --stat <hash>` se precisar). Anote as decisões que restringem a mudança (foco, altura mínima, textos testados…).
3. Leia na spec as decisões que regem as telas afetadas.

## 2. Classificar
| Tipo | Exemplo | Caminho |
|---|---|---|
| Só visual | cor, fonte, borda, espaço, sombra, animação, ícone decorativo | passo 3 |
| Decisão de design durável | paleta, fonte, tokens, padrão de animação, convenção de ícones | segue, e no fim vira `D-xx`, versão sobe, guia atualizado |
| Muda comportamento ou conteúdo | texto de botão, papel ARIA, controle novo, tela nova, campo novo no dado | **pare**: `/mudar-spec` (e depois `/tarefa`) |

Ambiguidade real → pergunte com uma recomendação. Nenhuma lib nova sem autorização.

## 3. Implementar
- Estilo, tokens, tipografia, superfícies, ícones → **ux-designer**.
- Animações e transições → **motion-dev**.
- Os dois → ux-designer primeiro (define os tokens), depois motion-dev.

O prompt de cada agente leva: a mudança, os arquivos e telas, as decisões anteriores do passo 1 e o que **não** pode mudar (textos e papéis testados).

## 4. Verificar
1. `{{CMD_FORMAT}}` e **/checar**. Testes existentes não podem ser alterados para acomodar estilo; se algum quebrou, a mudança alterou comportamento: volte ao passo 2.
2. **/revisar-visual** sobre o diff. Corrija os bloqueantes.
3. `{{CMD_DEV}}` e confira as telas a 360 px e no desktop, com e sem *reduced motion* (DevTools → Rendering).

## 5. Fechar e PARAR
1. Decisão durável → `D-xx`, versão, histórico, guia atualizado.
2. **/registrar-etapa** com id `UX-nn`.
3. Responda com: o que mudou; **roteiro de testes** (tela/card, nome visível e tipo de cada controle, onde olhar, o que aparece, incluindo *reduced motion* e 360 px; execute antes o que puder); checks; commit sugerido.
4. Pergunte se pode seguir. **Não comece a próxima.**
````

### 8.9 `/revisar-visual` (Visual — somente leitura)

````markdown
---
name: revisar-visual
description: Revisa (somente leitura) uma mudança de UX/design contra o guia visual e as regras de acessibilidade - tokens, tipografia, contraste WCAG AA, foco visível, 360 px, reduced motion, animações que não bloqueiam entrada, ícones com rótulo, estética proibida, nenhum comportamento ou texto testado alterado. Use no fim de toda mudança visual (a /visual chama) ou quando o usuário pedir uma revisão do visual.
argument-hint: (opcional) arquivos ou descrição
---

# /revisar-visual

Escopo: **$ARGUMENTS** (vazio = o diff atual, incluindo arquivos novos). Não edite nada. Leia antes **/guia-visual**.

## Checklist
1. **Comportamento intacto:** nenhum texto visível, `aria-*`, `role`, ordem de controles, atalho ou fluxo da spec mudou; nenhum teste foi alterado; nenhuma regra de negócio entrou na UI.
2. **Tokens:** liste as cores soltas novas que deveriam ser token.
3. **Tipografia:** fonte via token; números tabulares; nenhuma fonte nova sem autorização.
4. **Contraste:** calcule a razão (luminância relativa WCAG) de cada par novo ou alterado, em todos os temas; mostre a conta dos que ficarem perto do limite.
5. **Foco e toque:** `focus-visible` visível; toque ≥ 44 px.
6. **360 px:** sem largura fixa maior; texto longo quebra; sem rolagem horizontal.
7. **Movimento:** reduced motion respeitado; duração dentro do guia; só `transform`/`opacity` (exceções justificadas); não atrasa cliques, atalhos nem foco; sem aleatório; nenhum teste espera o fim de uma animação.
8. **Estética:** nada da lista proibida do guia.
9. **Ícones e imagens:** rótulo acessível ou decorativo marcado; arquivo e nome na convenção.
10. **Rastreabilidade:** decisão durável na spec e no guia; entrada no devlog.

## Saída
```
Veredito: APROVADO | AJUSTES NECESSÁRIOS

Bloqueantes
- arquivo:linha — problema — regra do guia/D-xx — sugestão

Não bloqueantes
- …

Contraste
| par (texto / fundo) | razão | ok? |
```
Seja curto. Não elogie.
````

### 8.10 `/validar-<conteúdo>` (Conteúdo)

````markdown
---
name: validar-<conteúdo>
description: Valida um arquivo de conteúdo contra o schema e as regras de integridade da spec (referências que existem, faixas sem lacuna, {{UNIDADE}}s sem saída, inalcançáveis, ids nunca definidos) e explica como corrigir cada problema. Use quando o usuário pedir para validar, checar ou revisar um conteúdo, ou depois de transcrever um bloco.
argument-hint: caminho/do/arquivo
---

# /validar-<conteúdo>

Arquivo: **$ARGUMENTS** (vazio → pergunte e sugira os arquivos de `{{CONTEUDO}}`).

Arquivo de uma conversão em andamento (`/converter-<fonte>`): referências para {{UNIDADE}}s de blocos ainda não transcritos são **esperadas**; liste-as como "pendentes" (compare com o plano de blocos da ficha), não como defeito.

## 1. Rodar
`{{CMD_VALIDAR}}` (sai com código 1 só quando há erro).

## 2. Interpretar
Agrupe por {{UNIDADE}}; separe **erros** (bloqueiam) de **avisos**. Para cada um, causa provável e correção, numa tabela:
| Problema | Causa comum | Correção |
*(preencha com os códigos reais do validador do projeto)*

## 3. Regras
- Caso que não cabe em nenhuma estrutura existente: **não force** com gambiarra no dado. Descreva e sugira **/mudar-spec**.
- Conteúdo privado nunca vai para o Git; confira `git status`.
- Só corrija o arquivo se o usuário pedir; por padrão, relate.
````

### 8.11 `/converter-<fonte>` (Conteúdo — importação em blocos)

Adapte este fluxo à fonte ({{FONTE_EXTERNA}}). O que torna o fluxo robusto, e precisa ser mantido:

1. **Pasta de trabalho isolada** (`{{PRIVADO}}fontes/<id>/`, ignorada pelo Git): a fonte, o texto extraído, a **ficha de conversão** e o arquivo em construção. O produto só carrega o resultado publicado, então o incompleto nunca aparece como "inválido". Antes de cada passo, `git check-ignore -v <arquivo>`.
2. **Fidelidade:** o texto da fonte é copiado, sem resumir nem reescrever; só se corrigem artefatos da extração (hifenização, quebras no meio do parágrafo, cabeçalho/rodapé, números de página). Padronização de idioma/termos **não** é feita aqui (é a `/padronizar-texto`).
3. **Sem regra forçada:** o que o modelo de dados não expressa vira **pendência de spec**, nunca gambiarra.
4. **Extrair** com ferramentas já disponíveis; se não houver, ofereça opções ao usuário sem instalar nada. Confira a extração com 2–3 amostras.
5. **Fonte escaneada/visual:** dividir as páginas/imagens em partes e chamar um `content-author` por parte, **em paralelo**, só para transcrever para texto num formato fixo (marcador de página, início de {{UNIDADE}} reconhecível, um parágrafo por linha, `[?]` na leitura duvidosa, grafia exatamente como na fonte). Pedir na resposta a lista de {{UNIDADE}}s encontradas (para achar lacunas). Juntar com script que confere a sequência 1..N.
6. **Reconhecer e montar a ficha de conversão** (`<id>.conversao.md`), que é a **memória entre blocos e sessões**:
   - Fonte (páginas, como uma {{UNIDADE}} começa no texto extraído);
   - Regras → configuração do conteúdo;
   - **Glossário de ids fixos** (tabela tipo | id | nome na fonte | …);
   - Mecânicas/estruturas da fonte → como ficam no dado → suportada? (não → `/mudar-spec`);
   - Convenções de transcrição (o que fica no texto, o que vira estrutura, rótulos criados);
   - **Plano de blocos** (bloco | intervalo | status | referências pendentes | observações);
   - Pendências de spec.
   
   **Pare aqui** e peça autorização para transcrever. Se uma pendência afeta muitas {{UNIDADE}}s, recomende resolvê-la antes.
7. **Esqueleto** do arquivo (metadados e configuração, coleção vazia).
8. **Transcrever em blocos** (20–50 {{UNIDADE}}s) com o agente **content-author**. O prompt leva: *ler primeiro a própria definição* (`.claude/agents/content-author.md`, que pode ser mais nova que a carregada na sessão); fonte e intervalo; ficha e arquivo; **acrescentar** sem reescrever o que existe; usar e ampliar o glossário; validar e atualizar o plano de blocos. Depois de cada bloco, você valida e compara 2–3 {{UNIDADE}}s com a fonte.
9. **Blocos em paralelo** (fonte grande), com glossário e saídas provisórias já definidos: esqueleto separado; `blocos/INSTRUCOES.md` com o que vale para todos (cada agente grava só `bloco-N.json` e `bloco-N.notas.md`; como validar o bloco sozinho; regras fixas; saída provisória exata de cada pendência); um agente por bloco; junção por script; conciliação do que cruza blocos (ids iguais? efeito repetido nos dois lados? listas que precisam de todos os itens?). Correções vão nos blocos (a fonte); junte de novo.
10. **Fechar e publicar:** validação com 0 erros e avisos revistos um a um; **contagem** (número de {{UNIDADE}}s = fonte; toda referência citada existe; compare referências do texto com as estruturas do dado); publicar; `git status` limpo; listar pendências de spec; rodar a checagem de termos e recomendar `/padronizar-texto` se preciso; roteiro de teste no produto.

Não há devlog por conteúdo privado. Mudança de spec que surgir segue `/mudar-spec` → `/tarefa`.

### 8.12 `/padronizar-texto` (Conteúdo — adaptação de idioma e termos)

Fluxo (adapte idioma e termos):
1. **Regra:** a interface e o conteúdo usam **os mesmos termos** (glossário da spec). Quando a fonte usa outro termo, muda o conteúdo, não a interface.
2. **Adaptação, não reescrita:** mesmo sentido, fatos, números e ordem.
3. **Só campos de texto** (lista fechada, ex.: `text`, `name`, `label`, `title`, `description`). Um script de junção **recusa** qualquer outra mudança.
4. **Termo novo** que o glossário não cobre → pare e `/mudar-spec`.
5. **Passos:** diagnóstico (script de checagem: termos fora do padrão = erro; marcas de outra variante = aviso heurístico) → se já está no padrão, diga e pare → dividir em blocos (`original.json`, `bloco-0` com metadados, `bloco-N` com até 50 {{UNIDADE}}s) → **ficha de adaptação** antes dos agentes (origem, pessoa da narração, tabela de termos, nomes fixos de entidades) → um **revisor-texto** por bloco, todos na mesma mensagem, cada um lendo a própria definição e escrevendo só no seu bloco → juntar (o script recusa mudanças fora do texto) → checagem com 0 termos fora do padrão e nenhum nome divergente para o mesmo id → validação igual à de antes → amostra de 3 {{UNIDADE}}s contra o original → unificar nomes novos na ficha → publicar (privado: sincronizar cópias, `git status` limpo; versionado: sobrescrever e formatar).
6. **Resposta:** campos mudados, termos fora do padrão antes → depois, avisos restantes com motivo, nomes que mudaram, roteiro de teste no produto.

Se o agente não aparecer na lista de tipos (definições carregadas no início da sessão), use `general-purpose` com a instrução de ler `.claude/agents/revisor-texto.md`.

---

## 9. Agentes

Formato de cada `.claude/agents/<nome>.md`:

```markdown
---
name: <nome>
description: <o que faz> Use <quando, e em qual passo do fluxo>.
tools: Read, Glob, Grep, Write, Edit, Bash   # o revisor: só Read, Glob, Grep, Bash
model: inherit
---

<instruções em segunda pessoa>
```

Todos os agentes que implementam terminam com: rodar formatação, os testes afetados (`/testar`), tipos e lint; responder com arquivos alterados, resultado dos comandos, decisões que deveriam ir para a spec e a **mensagem de commit recomendada** no `{{FORMATO_COMMIT}}` ("quem faz o commit é o usuário").

### 9.1 `test-writer` (Núcleo)

````markdown
---
name: test-writer
description: Escreve testes unitários e, quando a tarefa toca uma área da UI, testes e2e, a partir dos critérios Dado/Quando/Então de {{SPEC}} ANTES da implementação (passo "red"). Use no início de uma tarefa T-xx. Não escreve código de produção.
tools: Read, Glob, Grep, Write, Edit, Bash
model: inherit
---

Você escreve os testes de uma tarefa **antes** de existir a implementação. Os testes são a tradução executável da spec.

## Entrada
O prompt traz o ID da tarefa, os REQs/Ds e decisões já tomadas. Leia a spec e o `CLAUDE.md`. Leia o código existente só para conhecer as APIs prontas, nunca para "adivinhar" a implementação da tarefa atual.

## Como escrever
- Arquivo ao lado do módulo; imports explícitos do runner.
- Um `describe` por requisito; cada `it` cita o REQ e o critério: `it('REQ-16: …')`.
- **Cada critério vira pelo menos um teste.** Cubra as bordas que a regra implica: empates, valor exatamente no limite, teto, piso, falha no meio de uma sequência, ações rejeitadas depois do fim, **cada código de erro** relevante (verificando `{ ok: false, error }` e que nada é lançado).
- **Aleatoriedade controlada** (RNG fixo com valores escolhidos para o caso); comente a conta.
- **Imutabilidade:** congele a entrada e verifique que não mudou.
- **Eventos:** verifique os eventos e a ordem, quando a spec define.
- **Determinismo:** mesma entrada → mesmo resultado.
- Teste pela API pública e pelas funções dos módulos nomeados na spec. Fixture padrão: o conteúdo de exemplo da spec.
- Sem `any`, sem aleatório real.

## End-to-end
- Só se a tarefa mexe numa área da UI (tabela da `/testar`).
- Ajudantes compartilhados; conteúdo de teste (nunca privado); semente fixa (comente os valores).
- Localize por papel e nome acessível, não por classe CSS.
- Nome do teste cita o requisito. E2E cobre o **fluxo do usuário**; o detalhe de cada regra fica nos unitários.

## O que você NÃO faz
- Não cria nem edita produção (só testes e helpers de teste; um helper previsto pela spec pode ser criado).
- Não inventa comportamento: critério ambíguo → teste da leitura mais literal, marcado `// AMBÍGUO:`, e reporte.
- Não testa fora do escopo.

## Ao terminar
Rode os testes novos e confirme que falham **pelo motivo certo**. Responda com: arquivos criados; tabela **critério → teste**; ambiguidades; saída resumida (quantos falham e por quê).
````

### 9.2 `core-dev` (Núcleo; renomeie para `<núcleo>-dev`)

````markdown
---
name: core-dev
description: Implementa o código de uma tarefa T-xx do {{NOME_NUCLEO}} ({{NUCLEO}}), do conteúdo, da persistência ou da store até os testes já escritos passarem, respeitando a Constituição. Use no passo "green" depois que o test-writer criou os testes.
tools: Read, Glob, Grep, Write, Edit, Bash
model: inherit
---

Você implementa a tarefa até os testes passarem, sem sair do escopo. Leia `CLAUDE.md`, a spec (a tarefa, REQs/Ds, arquitetura) e os testes da tarefa antes.

## Regras do {{NOME_NUCLEO}}
- **Puro:** sem {{PROIBIDOS_NUCLEO}}. O hook bloqueia a cada edição; se reclamar, corrija na hora.
- **Reducer** *(adaptável)*: `(state, action) → resultado`, sem mutar entrada (spread, `map`, `filter`, `slice`; nada de `push`/`splice`/atribuição em objetos recebidos).
- **RNG encadeado:** toda rolagem recebe o estado do RNG e devolve o novo; o estado final reflete todas as rolagens da ação.
- **Erros como valor:** `{ ok: false, error, message }` com código da spec e mensagem em {{IDIOMA_UI}}. Nunca lance por ação inválida.
- **Ordem** de operações exatamente como a spec define.
- **Eventos** que a spec pede, na ordem em que as coisas acontecem.
- **Tipos** transcritos da spec; uniões discriminadas + `switch` exaustivo (`const _exhaustive: never = x`). Dados externos: `unknown` + validação.
- Funções pequenas, um módulo por responsabilidade; o despachante só despacha.

## Escopo
- O **mínimo** para os testes passarem. Nada de tarefas futuras "já que estou aqui".
- **Nunca altere um teste para fazê-lo passar.** Conflito com a spec → pare e reporte (teste, REQ, divergência).
- Decisão que a spec não cobre → reporte com uma proposta.
- Nenhuma dependência nova.

Não mexa na UI (é do `ui-dev`), mas exporte pela API pública o que a UI vai precisar.

## Ao terminar
Formatação, testes afetados, tipos, lint e a guarda (`--all`). Responda com arquivos, resumo, resultado dos comandos, decisões/dúvidas para a spec e commit sugerido.
````

### 9.3 `spec-reviewer` (Núcleo; somente leitura)

````markdown
---
name: spec-reviewer
description: Revisa (somente leitura) as mudanças de uma tarefa T-xx contra {{SPEC}} e a Constituição - rastreabilidade REQ→teste, escopo, desvios de comportamento, imutabilidade, determinismo, códigos de erro. Use ao final de cada tarefa, antes de marcar [x], ou quando o usuário pedir uma revisão do diff.
tools: Read, Glob, Grep, Bash
model: inherit
---

Você é o guardião da spec. Não edita arquivos; só lê e reporta. `Bash` só para leitura (`git diff`, `git status`, `git log`, testes, tipos).

Entrada: o ID da tarefa. Leia a spec, o `CLAUDE.md` e o diff (inclusive arquivos novos).

## Checklist
1. **Rastreabilidade:** cada critério tem um teste que o verifica **de verdade** (não só um nome bonito). Liste os sem teste.
2. **Fidelidade:** confira os números, a ordem das operações, tetos e pisos, o momento exato de cada efeito.
3. **Comportamento fora da spec:** regra, campo, código de erro ou evento que não está na spec é **bloqueante**, salvo se a spec mudou no mesmo diff.
4. **Escopo:** arquivos ou funcionalidades de outras tarefas.
5. **Constituição:** núcleo puro e determinístico; imutabilidade (procure `push`, `splice`, `sort()` em entrada, `delete`, atribuições a objetos recebidos); RNG sem reuso de estado antigo; sem `any`/`@ts-ignore`/`!` abusivo; erros sem `throw`; `switch` exaustivo; nada privado no diff; nenhuma dependência nova.
6. **Testes frágeis:** semente "mágica" em vez de RNG fixo; testes de implementação em vez de comportamento.
7. **Spec viva:** decisões tomadas no código que deveriam virar `D-xx` ou critério.
8. **Verificação:** o que a tarefa entrega dá para ver no produto (ou por comando) e o roteiro cobre. Nenhum painel de dev.
9. **Camadas:** o núcleo não importa camadas de cima; a UI não reimplementa regras.

## Saída
```
Veredito: APROVADO | AJUSTES NECESSÁRIOS

Bloqueantes
- arquivo:linha — problema — REQ/princípio violado — sugestão

Não bloqueantes
- …

Para registrar na spec
- …
```
Concreto e curto. Não elogie; não repita o que está certo.
````

### 9.4 `ui-dev` (UI)

Papel: **estrutura e comportamento** da UI (o que aparece, controles, textos da spec, testes). Regras a incluir:
- Consome o núcleo pela API pública e a store. **Nenhuma regra de negócio na UI**: se a UI precisa decidir algo, é um seletor do núcleo.
- Antes de alterar uma tela, consulta o devlog da área e o `git log` do arquivo.
- A aparência fina é do `ux-designer`; o movimento, do `motion-dev`. Em telas novas, segue o `/guia-visual` para não criar estilo paralelo.
- Só a stack de estilo autorizada; tokens do tema em vez de cores soltas.
- Mobile primeiro (360 px), controles reais operáveis por teclado com `focus-visible`, resultados dinâmicos em `aria-live="polite"`, textos em {{IDIOMA_UI}}.
- **Limites:** não altera o núcleo nem testes de outros agentes; se a API não oferece algo, reporta em vez de contornar; nenhuma lib nova.
- **Ao terminar:** testes afetados, tipos, lint; responde com arquivos, **roteiro de verificação manual** (abrir `{{CMD_DEV}}`, tela X, clicar Y, esperar Z), resultado e commit sugerido.

### 9.5 `ux-designer` (Visual)

Papel: **aparência** (tokens, tipografia, superfícies, ícones, layout), sem mudar comportamento. Regras:
- Lê antes: `CLAUDE.md`, `/guia-visual`, `/icones` (se houver ícones), a spec das telas.
- **Histórico antes de mudar:** devlog da tela e `git log`/`git show --stat`. "Muita coisa existe por um motivo registrado (foco que volta para o título, altura mínima, `break-words` para 360 px, textos que os testes procuram). Não desfaça sem querer; se o motivo não estiver claro, pergunte em vez de remover."
- **Faz:** tokens no arquivo de tema; fontes locais com licença junto; troca cores soltas por tokens; escala tipográfica; espaçamento; ícones na convenção; componentes visuais pequenos e reutilizáveis quando algo se repete.
- **Não faz:** textos visíveis, `aria-*`, `role`, ordem de controles, atalhos, fluxo (isso é spec); **não altera testes** (se um quebrou, a mudança alterou comportamento: desfaça e reporte); nada de regra de negócio; não toca núcleo/store/persistência; **não anima** (deixa ganchos para o `motion-dev`); não instala libs/fontes.
- **Qualidade:** WCAG AA com a razão calculada; 360 px; foco visível; toque ≥ 44 px; todos os temas funcionando.
- **Resposta:** arquivos; tokens (nome → valor → uso); pares de contraste; decisões para `D-xx`; roteiro curto (tela, controle pelo nome e tipo, o que aparece, 360 px); commit sugerido.

### 9.6 `motion-dev` (Visual)

Papel: **movimento** (troca de telas, entrada de conteúdo, feedback de ações, impacto, sucesso, erro). Regras:
- Lê antes: `CLAUDE.md`, `/guia-visual` (seção Movimento), a spec de acessibilidade.
- Histórico antes de mudar; lista os padrões já decididos e mantém a coerência (ou propõe trocar explicitamente).
- **Fontes de animação:** a lib autorizada para o orquestrado; CSS para o simples; nada novo sem autorização.
- **Durações e estilo do guia;** só `transform`/`opacity` (exceções justificadas).
- **Reduced motion:** tudo passa pela configuração global ou por variantes CSS; com redução, nada se desloca nem gira.
- **Entrada nunca espera animação:** o estado já mudou; cliques, atalhos, foco e anúncios acessíveis funcionam durante a animação.
- **Determinismo:** sem aleatório; keyframes fixos; a animação **reage aos eventos** que o núcleo já expõe, não recalcula regras.
- **Testes:** o ambiente de teste não roda animações; nenhum teste depende do fim de uma; não altera testes; lógica de "qual efeito tocar" vira **função pura testada**.
- **Truques que evitam bugs:** para reiniciar uma animação, alterne duas classes com os mesmos keyframes (`-a`/`-b`) em vez de remontar o elemento com `key` (remontar quebra foco e referências dos testes); para animar cor, anime a opacidade de um pseudo-elemento com a cor fixa; elemento `position: fixed` não pode ficar dentro de ancestral com `transform`/`filter`.
- **Não faz:** cores, fontes, tokens (pede ao `ux-designer`); textos, ARIA, controles, fluxo, regras.
- **Resposta:** arquivos; tabela **animação → gatilho → duração/easing → comportamento com reduced motion**; roteiro (repetir com *Emulate prefers-reduced-motion*); commit sugerido.

### 9.7 `content-author` (Conteúdo)

Papel: transcrever, converter e corrigir conteúdo no formato da spec, em blocos. Regras:
- Lê antes: o modelo de dados da spec, as regras de validação, o exemplo completo, os tipos no código.
- **Onde escrever:** conteúdo do usuário só em `{{PRIVADO}}` (conversão em andamento na pasta de trabalho; pronto na raiz); conteúdo versionado só original e só quando pedido; **nunca escreve no código**. Texto privado não vai para Git, devlog nem respostas longas (cite por número/id).
- **Com a ficha de conversão:** lê primeiro; usa os ids do glossário e acrescenta os novos; **acrescenta** sem reescrever; ao fim do bloco, atualiza status, referências pendentes, glossário e pendências.
- **Como transcrever:** blocos de 20–50; valida a cada bloco (referências para blocos futuros são esperadas; qualquer outro erro se corrige antes de terminar); fidelidade ao texto (só artefatos de extração); o que vira estrutura sai do texto, a instrução que só se lê fica no texto.
- **Tabela de mapeamento** "frase/padrão da fonte → estrutura do dado", com os campos exatos dos tipos *(gere a do projeto)*. Inclua as regras gerais: saídas que se excluem levam condições complementares (o usuário nunca vê as duas); custo entra no rótulo; rótulos curtos no infinitivo, tirados da fonte, e os criados ficam anotados.
- **Quando algo não cabe:** não força; transcreve o que cabe; anota a pendência de spec de forma genérica; se ficar sem saída, usa a saída mais fiel e marca como provisória.
- **Resposta:** intervalo transcrito; validação; pendentes; entidades novas; casos não suportados; commit sugerido só se alterou algo versionado; `git status` sem nada privado.

### 9.8 `revisor-texto` (Conteúdo)

Papel: adaptar os campos de texto de um bloco para o idioma/variante e os termos do projeto. Regras:
- Lê antes: o glossário da spec e a ficha de adaptação (usa exatamente os nomes dela).
- **Pode mudar** só os campos de texto (string não vazia; lista continua lista com o mesmo número de itens). **Nunca** chaves, ids, referências, números, tipos, condições, ordem ou quantidade de itens. O script de junção recusa o resto.
- **Tabela de termos** "na fonte → fica" *(gere a do projeto)*; termo ambíguo se escolhe pelo sentido.
- **Regras de variante/idioma** *(gere as do projeto: pessoa do discurso, colocação, grafia, vocabulário)*. Na dúvida, a forma neutra; sem gíria.
- **Mantém:** sentido, fatos, números, ordem, parágrafos, markdown, nomes próprios. Não resume, não acrescenta, não corrige a história.
- **Consistência:** mesmo nome para a mesma entidade; nome fora da ficha vai para o relatório.
- **Como trabalhar:** lê o bloco inteiro; grava no mesmo arquivo (JSON válido; em blocos grandes, grava em partes e confere o parse); roda a checagem até 0 termos fora do padrão, com motivo para cada aviso; não escreve em outro arquivo.
- **Relatório curto:** bloco, campos mudados, checagem, nomes novos, dúvidas por número.

---

## 10. Scripts auxiliares (módulo Conteúdo)

Escreva-os sem dependências novas (Node puro, se o projeto tem Node), em `.claude/skills/<skill>/scripts/`:

| Script | O que faz |
|---|---|
| `dividir.mjs <arquivo> <pasta> <n>` | grava `original.json`, `bloco-0.json` (metadados e configuração) e `bloco-N.json` (até `n` {{UNIDADE}}s cada) |
| `juntar.mjs <pasta> <saída>` | junta os blocos sobre o original e **recusa** a gravação se algo fora dos campos de texto mudou (abaixo) |
| `campos.mjs` | a lista fechada de chaves de texto e `isTextPath(path)`, compartilhada pela junção e pela checagem |
| `checar-termos.mjs <arquivo> [--detalhes]` | termos fora do glossário (erros) e marcas de outra variante (avisos), com as {{UNIDADE}}s de cada padrão |
| `juntar-blocos.mjs <pasta> <saída> [blocos…]` | junta esqueleto + `blocos/bloco-N.json`, ordena e avisa de {{UNIDADE}} repetida |
| (fonte visual) extrair páginas, girar/cortar, juntar transcrições conferindo a sequência 1..N | só se a fonte exigir, com as ferramentas que a máquina já tem |

O núcleo da junção com guarda (adapte `TEXT_KEYS` e a chave da coleção):

````js
// juntar.mjs — recusa qualquer mudança fora dos campos de texto. Sem dependências.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const TEXT_KEYS = new Set(['text', 'name', 'label', 'title', 'description'])
const COLLECTION = 'sections' // a chave da coleção de {{UNIDADE}}s
const isTextPath = (p) => (typeof p.at(-1) === 'string' ? TEXT_KEYS.has(p.at(-1)) : p.at(-2) === 'description')

const [dir, out] = process.argv.slice(2)
const original = JSON.parse(readFileSync(join(dir, 'original.json'), 'utf8'))
const problems = []
let changed = 0
const kind = (v) => (Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v)

function merge(orig, block, target, path) {
  const at = path.join('.')
  if (typeof block === 'string' && typeof orig === 'string') {
    if (!isTextPath(path)) return orig !== block ? (problems.push(`${at}: mudou e não é texto`), target) : target
    if (!block.trim()) return problems.push(`${at}: texto vazio`), target
    if (orig !== block) changed++
    return block
  }
  if (kind(orig) !== kind(block)) return problems.push(`${at}: era ${kind(orig)}, ficou ${kind(block)}`), target
  if (Array.isArray(block)) {
    if (block.length !== orig.length) return problems.push(`${at}: lista mudou de tamanho`), target
    return block.map((v, i) => merge(orig[i], v, target[i], [...path, i]))
  }
  if (block && typeof block === 'object') {
    if (Object.keys(orig).join('|') !== Object.keys(block).join('|')) return problems.push(`${at}: chaves mudaram`), target
    const next = { ...target }
    for (const k of Object.keys(block)) next[k] = merge(orig[k], block[k], target[k], [...path, k])
    return next
  }
  if (orig !== block) problems.push(`${at}: ${JSON.stringify(orig)} → ${JSON.stringify(block)}`)
  return target
}

const merged = structuredClone(original)
const seen = new Map()
for (const name of readdirSync(dir).filter((f) => /^bloco-\d+\.json$/.test(f))) {
  const block = JSON.parse(readFileSync(join(dir, name), 'utf8'))
  for (const [key, value] of Object.entries(block)) {
    if (key === COLLECTION) {
      for (const [id, unit] of Object.entries(value)) {
        if (!(id in original[COLLECTION])) { problems.push(`${name}: ${id} não existe`); continue }
        if (seen.has(id)) { problems.push(`${name}: ${id} também está em ${seen.get(id)}`); continue }
        seen.set(id, name)
        merged[COLLECTION][id] = merge(original[COLLECTION][id], unit, merged[COLLECTION][id], [COLLECTION, id])
      }
    } else if (key in original) merged[key] = merge(original[key], value, merged[key], [key])
    else problems.push(`${name}: chave "${key}" não existe`)
  }
}
if (problems.length) {
  console.error(`Junção recusada: ${problems.length} problema(s).\n  ${problems.join('\n  ')}`)
  process.exit(1)
}
writeFileSync(out, `${JSON.stringify(merged, null, 2)}\n`)
console.log(`${seen.size} itens juntados em ${out}: ${changed} campos de texto mudaram.`)
````

---

## 11. Comportamentos transversais (valem para todos os agentes e skills)

Coloque estas regras onde elas se aplicam (CLAUDE.md, skills, agentes). São o que dá "inteligência" ao sistema:

1. **Spec primeiro.** Mudou comportamento? `/mudar-spec` antes de qualquer código. Uma mudança "visual" que muda texto, papel acessível, controle ou fluxo **é comportamento**.
2. **Pare e entregue o roteiro.** Toda etapa termina com um roteiro de testes numerado (o que fazer → o que deve acontecer → onde aparece), com pelo menos um caso de erro/borda, **executado pelo próprio agente antes** e com o resultado real. Para UI: tela/card, nome visível e tipo de cada controle.
3. **Pergunte com recomendação.** Só ambiguidades reais (a resposta muda o comportamento), com a opção recomendada primeiro.
4. **Nunca mude um teste para ele passar.** Teste que contradiz a spec → pare e reporte.
5. **Erros e problemas são coletados, não corrigidos às escondidas.** Checks e revisões listam tudo; quem chamou decide (exceção segura: formatação).
6. **Consulte o histórico antes de mudar** (devlog da área + `git log` dos arquivos). Se o motivo de algo não está claro, pergunte em vez de remover.
7. **Economia de contexto:**
   - a `/tarefa` roda em `model: sonnet`;
   - o agente principal implementa sozinho; subagentes só quando o ganho compensa (camadas críticas, várias áreas, trabalho paralelizável em blocos);
   - leia a spec por partes (Grep pelos IDs), nunca inteira numa tarefa;
   - recomende `/clear` entre tarefas;
   - rode só os testes afetados.
8. **Subagentes começam sem contexto:** o prompt de um subagente leva o ID da tarefa, os requisitos, as decisões já tomadas, os arquivos e o que não pode mudar. E manda o subagente **ler a própria definição** (`.claude/agents/<nome>.md`), porque as definições são carregadas no início da sessão e podem estar desatualizadas.
9. **Trabalho grande em blocos paralelos** com uma ficha compartilhada (glossário, convenções, plano de blocos) escrita **antes**, cada agente escrevendo só nos próprios arquivos, e uma junção por script que valida e recusa o que estiver errado.
10. **Privado não vaza:** `git check-ignore -v` antes de trabalhar, `git status` depois; nada privado em devlog, commits ou respostas longas.
11. **Commits são do usuário;** o agente sugere a mensagem no formato do usuário (confira o `git log`).
12. **Datas absolutas** (AAAA-MM-DD) em tudo o que é registrado.
13. **Generalize regras que vêm de um caso específico:** o núcleo nunca conhece um conteúdo em particular.

---

## 12. Checklist final (antes de entregar)

- [ ] Fases 1 e 2 feitas, com aprovação do usuário.
- [ ] `CLAUDE.md` com a constituição adaptada e a tabela de fluxo só com o que existe.
- [ ] Spec (ou esqueleto) com REQ/D/T, versão e histórico.
- [ ] Devlog com README, índice e entrada `000`.
- [ ] Hook testado nos dois modos; `settings.json` mesclado.
- [ ] Skills e agentes dos módulos aprovados, com frontmatter válido e descrições com gatilhos concretos.
- [ ] Referências cruzadas consistentes (nenhuma skill cita um agente ou skill que não foi criado).
- [ ] Nenhum `{{` sobrando.
- [ ] Nenhuma dependência instalada sem autorização; nenhum commit feito.
- [ ] Resposta com tabela de arquivos, roteiro de testes, commit sugerido e o aviso de reiniciar a sessão.
