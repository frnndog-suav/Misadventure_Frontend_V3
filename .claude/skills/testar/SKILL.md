---
name: testar
description: Roda só os testes afetados pelo que mudou - unitários ligados aos arquivos alterados e e2e nas áreas da UI que eles tocam - ou uma área específica, ou a suíte inteira com "tudo". Use no fim de cada tarefa (a /tarefa e a /checar chamam), quando o autor pedir para rodar os testes, ou para conferir que uma mudança não quebrou nada.
argument-hint: (vazio) | <área> | tudo
---

# /testar

Pedido: **$ARGUMENTS** (vazio = o que mudou; nome de área = só ela; `tudo` = suíte inteira).

Regra: **não rode todos os testes toda hora.** Rode os do contexto que a mudança impactou. Antes da T-01, os runners não existem: diga "testes ainda não configurados (T-01)" e pare.

## 1. O que mudou
```
git diff --name-only HEAD
git ls-files --others --exclude-standard
```
Junte as listas. **Não rodam nada:** `docs/**`, `*.md`, `.claude/**`, `public/**` (salvo imagens usadas pelos e2e). Se só sobrou isso, diga "nenhum teste afetado" e pare.

**Infraestrutura → suíte inteira:**
- unitários: `package.json`, `package-lock.json`, `vite.config.ts`, `vitest.config.*`, `tsconfig*.json`, `eslint.config.js`, setup global de testes;
- e2e: `playwright.config.*`, `tests/e2e/fixtures/**`, `src/main.tsx`, `index.html`, CSS global, `src/mocks/**` (fixtures e handlers compartilhados).

## 2. Unitários
`npx vitest related --run <arquivos>`
- Passe **sempre, junto, os testes alterados e os testes vizinhos de cada arquivo alterado** (`x.ts` → `x.test.ts`, `x.*.test.ts`): a busca por imports pode não pegar o teste ao lado.
- Fixtures do MSW importadas pelos testes entram na lista.
- Depois de mover ou apagar arquivos lidos por glob, rode sem cache.

## 3. E2E (`tests/e2e/<área>/`)
`npx playwright test tests/e2e/<área>` para cada área tocada que **existe**:

| Área | Arquivos que a afetam |
|---|---|
| *(nenhuma ainda; cada tarefa que cria uma área acrescenta a linha)* | |

- Um teste e2e alterado roda a si mesmo.
- Mudança nos tipos de `src/api/`, no cliente ou nos componentes de `src/ui/` afeta todas as áreas.
- **Arquivo fora da tabela:** rode todas as áreas e acrescente o arquivo à tabela.
- **Área sem pasta ainda:** diga "a área X ainda não tem e2e". Quem cria é a tarefa que mexer nela.
- E2E rodam com o MSW (fixtures do contrato), salvo na validação contra o backend real (`/retorno-backend`).

## 4. `tudo`
`npm test` e `npm run test:e2e`.

## Saída
| Suíte | O que rodou | Resultado |
|---|---|---|

Abaixo, a saída de cada falha. Não corrija nada: quem chamou decide.
