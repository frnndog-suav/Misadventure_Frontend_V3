# 005 — CONTRATO: FEAT-01, endpoint mínimo proposto

- **ID:** CONTRATO · **FEAT:** FEAT-01 (Esqueleto técnico) · **Data:** 2026-11-14
- **Status:** aguardando revisão
- **Spec:** v0.5 (não alterada) · **Contrato:** v0.2 → **v0.3** · **Roadmap:** v0.2 → **v0.3**

## Objetivo

Propor no contrato o fecho da FEAT-01: o endpoint mínimo que valida a ponte FE↔BE de ponta a ponta (ROADMAP §3) e informa qual versão do contrato o backend implementa (CONTRATO §1.5, que já previa esse endpoint "definido na seção da FEAT-01"). Fluxo `/contrato FEAT-01`, aprovado pelo autor em 2026-11-14.

## Decisões

- **`GET /health`** devolve `{ "status": "ok", "contractVersion": "<versão do contrato>" }` (tipo `HealthResponse`, CONTRATO §3 FEAT-01). Nome `health` escolhido porque o endpoint também serve de health check do Docker Compose no backend; alternativas `/version` e `/meta` descartadas por descreverem só metade do papel.
- **Cenário de erro = rota desconhecida:** qualquer rota inexistente responde `404` com o envelope de §1.4 e o código novo **`NOT_FOUND`** (§4, mensagem "Recurso não encontrado."). Um health check não tem erro próprio; assim a validação real também prova o formato de erro de ponta a ponta, não só o caminho feliz.
- Nenhum termo novo no glossário §2 (não há termo de jogo envolvido).
- Seção marcada **`proposto (FE)`**; quem confirma é o backend (`/retorno-backend`).
- ROADMAP: coluna FE da FEAT-01 → **`aguardando outro lado`** — a implementação FE do consumo do `/health` (tipos, Zod, fixture MSW, tarefa nova) só começa com o contrato `acordado`, para não retrabalhar se o backend pedir mudanças.

## Passos e comandos

1. `/contrato FEAT-01`: leitura de CONTRATO §0–§2, spec (3.5, tarefas da FEAT-01), ROADMAP §2 e README II.2/II.3.
2. Escrita da seção FEAT-01 em `docs/CONTRATO.md` §3 (endpoints, tipos, cenários), código `NOT_FOUND` em §4, versão 0.3 e linha no histórico §5.
3. Aprovação do autor → ROADMAP v0.3 (status FE e histórico) e esta entrada.

Nenhuma instalação; nenhum código em `src/` (o código vem na tarefa, depois do `acordado`).

## Arquivos

- **Alterados:** `docs/CONTRATO.md` (v0.3: seção FEAT-01 em §3, `NOT_FOUND` em §4, histórico §5), `docs/ROADMAP.md` (v0.3: FE da FEAT-01 `aguardando outro lado`, histórico §5).
- **Criados:** esta entrada.

## Como verificar

1. `docs/CONTRATO.md` §3 tem a seção "FEAT-01 — Esqueleto técnico (endpoint mínimo)" com situação `proposto (FE)`, dois cenários Dado/Quando/Então com valores exatos e §4 com `NOT_FOUND`.
2. `docs/ROADMAP.md` mostra FEAT-01 com FE `aguardando outro lado` e versão 0.3.
3. Nada mudou em `src/`: `git status` só acusa os dois documentos (e o devlog).

## Problemas

Nenhum.

## Checks

Etapa só de documentos: sem testes afetados, sem build. `git diff --stat`: 2 arquivos, +35/−5 linhas (antes desta entrada).

## Backend

**Depende do backend:** o contrato v0.3 precisa ser confirmado (`acordado`) e implementado lá. Aviso de backend dado nesta etapa (FEAT-01): levar `docs/CONTRATO.md` v0.3 e `docs/ROADMAP.md` v0.3; pedir a revisão da seção FEAT-01; trazer a resposta para o `/retorno-backend`. Enquanto isso o frontend não implementa o consumo do `/health`.

## Commit sugerido

`docs/proposing feat-01 contract with health endpoint`
