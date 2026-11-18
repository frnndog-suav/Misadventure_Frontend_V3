# AGENTS.md — mapa para agentes de IA

Este repositório foi montado para o **Claude Code** (`.claude/`, `CLAUDE.md`).
Eu (Kimi Code CLI) atuo aqui com o usuário como orquestrador entre as duas IAs.
Este arquivo existe para que eu saiba, a cada sessão, onde está o que.
**Nada aqui duplica regras: a fonte da verdade é `CLAUDE.md` e `docs/`.**

## O projeto

Misadventures — frontend web (depois executável Tauri) de um TCG/RPG cooperativo
jogado em vezes alternadas. O frontend **exibe o estado** que vem do backend
autoritativo e **envia as intenções** do jogador; não existe motor de regras aqui.
Stack: TypeScript 6, Vite 8, React 19 (+ React Compiler), TanStack Query,
React Router DOM, Zod, Vitest, Playwright, MSW, ESLint, Prettier.

## Mapa (onde está o que)

| Onde | O que guarda | Quando leio |
|---|---|---|
| `CLAUDE.md` | Constituição (14 princípios), fluxos de trabalho, comandos | Antes do primeiro trabalho de código da sessão |
| `docs/SPEC-FRONTEND.md` | Spec do frontend: REQ, decisões D, tarefas T, telas — **fonte do comportamento** | Em toda tarefa T-xx (só as partes citadas) |
| `docs/README.md` | Manual de regras do jogo. Citar por seção (README 19.2); o Apêndice B são decisões fechadas que não se reabrem | Quando a tarefa tocar regras |
| `docs/CONTRATO.md` | Contrato com o backend: §1 convenções, §2 glossário, §4 códigos de erro, seções por FEAT com situação | Ao mexer em `src/api/` |
| `docs/ROADMAP.md` | Momentos e features (FEAT-nn); §2 = protocolo da ponte entre os repositórios | Ao planejar |
| `docs/devlog/` | Registro de cada etapa (formato e índice no `README.md`); `tempo.html` + `tempo-eventos.log` = registro de tempo | Antes de alterar funcionalidade/visual |
| `docs/PROMPT-AGENTES-E-SKILLS.md` | Meta-prompt que montou este sistema de agentes/skills (referência para replicar em outro projeto; não é fluxo de trabalho) | Só se o autor pedir para replicar/adaptar o sistema |
| `.claude/skills/*/SKILL.md` | Workflows: `/tarefa`, `/mudar-spec`, `/checar`, `/testar`, `/registrar-etapa`, `/contrato`, `/retorno-backend`, `/visual`, `/revisar-visual`, `/guia-visual`, `/assets` | Quando o usuário pedir um fluxo pelo nome; `$ARGUMENTS` = o que vem depois |
| `.claude/agents/*.md` | Papéis: `client-dev`, `ui-dev`, `motion-dev`, `ux-designer`, `test-writer`, `spec-reviewer` | Como instrução ao implementar ou ao delegar a subagente |
| `.claude/hooks/client-guard.mjs` | Guarda das proibições em `src/` (D-08) | ESLint aplica as mesmas regras; manual: `node .claude/hooks/client-guard.mjs --all` |

## Invariantes (resumo — a fonte autoritativa é `CLAUDE.md`)

1. **O backend decide, o frontend mostra.** Nunca reimplementar regra do jogo na UI.
2. **Contrato primeiro:** toda comunicação passa por `src/api/`; sem `fetch`/socket fora dele; dado externo entra como `unknown` + validação. Sem `any`, sem `Math.random`.
3. **Spec-anchored + TDD:** mudança de comportamento começa em `docs/SPEC-FRONTEND.md`; testes (Dado/Quando/Então) antes da implementação; nome de teste cita o REQ.
4. **Escopo fechado:** só o que a tarefa pede; ambiguidade real vira pergunta com opção recomendada. Uma tarefa por vez; ao terminar, entregar roteiro de testes e parar.
5. **Idioma:** identificadores e contrato em inglês; textos do jogador em pt-BR.
6. **Histórico antes de mudar:** devlog da área + `git log --oneline -- <arquivos>`.
7. **Commits:** quem faz é o autor; eu só sugiro (`tipo/descrição curta em minúsculas`). Datas absolutas (AAAA-MM-DD) no que for registrado.

## Coordenação usuário ↔ Kimi ↔ Claude

- O usuário orquestra e leva informações de um lado para o outro; eu não falo
  com o backend nem com o Claude.

### Ponte frontend ↔ backend (outro repositório, NestJS)

- **Arquivos compartilhados** (cópias idênticas nos dois repositórios):
  `docs/README.md`, `docs/ROADMAP.md`, `docs/CONTRATO.md`. Ao alterar um:
  incremento a versão, registro no histórico e termino com Aviso de backend —
  **quem copia o arquivo inteiro para o outro lado é o autor**.
- **Seção do contrato tem ciclo de vida:** `proposto (FE/BE)` → `acordado` →
  `implementado (BE)` → `validado`. Antes de usar uma seção em código, confiro a
  situação dela. Se não estiver `acordado` ou adiante, **paro**: proponho via
  `/contrato` ou mostro o Aviso de backend. Formato de resposta nunca é inventado.
- **Só um lado altera o contrato por vez.** Se os dois mexerem na mesma seção,
  vale a versão maior e o autor junta (ROADMAP §2).
- **FEAT só fecha em `validado`.** O lado frontend pronto com MSW é metade; falta
  rodar os cenários contra o backend real. Quando o autor disser "backend no ar
  em <url>", quem recebe é a `/retorno-backend`.
- **Mudança de regra do jogo começa no README** (nova revisão do Apêndice B, com
  aprovação do autor) e também gera Aviso de backend, para a cópia chegar lá.
- Qualquer dependência do outro lado termina a resposta com o **Aviso de
  backend** (formato em `CLAUDE.md`).

### Fluxos e tempo

- Fluxos pedidos por nome ("faz a /tarefa T-xx", "roda a /checar"): ler o
  `SKILL.md` correspondente em `.claude/skills/` e segui-lo.
- Registro de tempo é automático só no Claude (hooks `time-log`). Se eu rodar a
  `/registrar-etapa`, as horas da sessão ficam `null` ("a preencher") — quem
  fecha o `tempo.html` continua sendo o autor.
