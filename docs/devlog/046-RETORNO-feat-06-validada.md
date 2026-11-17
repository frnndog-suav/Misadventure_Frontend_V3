# 046 — RETORNO: FEAT-06 validada contra o backend real

- **ID:** RETORNO · **FEAT:** FEAT-06 · **Contrato:** v0.24 → v0.25 (`implementado (BE)`) → v0.26 (`validado`, sem mudança de formato) · **Roadmap:** v0.29 → v0.30 → v0.31 · **Data:** 2026-11-17

## Objetivo

Aplicar a entrega do backend (Aviso de frontend da FEAT-06: CONTRATO v0.25, ROADMAP v0.30, conteúdo de teste da `fixture`), alinhar as fixtures do MSW e rodar os cenários e as telas contra o backend real.

## Passos e comandos

1. Contrato e roadmap atualizados conforme os arquivos do backend (FEAT-06 `implementado (BE)`, textos de `problems`, mensagem do `starterDeck.N.cardId`, `CONTENT_REFERENCED` entre coleções).
2. Fixtures: comparado o conteúdo de teste do backend (copiado pelo autor em `tests/fixture/`, apagado depois) com `src/mocks/`. Classes, atributos, dimensão e as cartas da FEAT-04 já batiam. Três zonas provisórias mudaram: `gray-harbor` (`location` "Costa Cinzenta"), `stone-bend` e `old-mine` (`zoneType` `forest`, `location` "Terras Selvagens"). Comentários de "provisória" removidos (encerra a ressalva da D-49 sobre fixtures). `npx vitest related` das duas fixtures: 385 testes, verdes; `typecheck` verde.
3. Cenários: script Node descartável no scratchpad contra `http://localhost:3333` (`contractVersion` 0.25). 26 conferências, todas certas: classes, Carta de Dimensão, `arrowLayout`, criação do grupo (ids, 4 zonas em células diferentes, setas, travessias entre vizinhas ligando tudo, `turnOrder`, `player` completo, `GET` igual), trava não cumprida com `lockTwoEssentials = 31` (restaurado para 10), `required`, `unknownClass`, `CONTENT_IN_USE` nas 4 exclusões, `CONTENT_REFERENCED`, `validate-dimension` do `bosque` (textos exatos), classes no `bosque` (`409`, `201`, publicar → `400`, catálogo com 2), excluir `mage` → `204` e `CLASS_NOT_FOUND`; extras: export da `fixture` com 2 classes, contagens (12 publicadas) e `fixture` válida como dimensão. Grupos e `bosque` criados foram apagados no fim.
4. Telas com o MSW desligado (`VITE_USE_MOCKS=false VITE_API_URL=http://localhost:3333 npm run dev`, Git Bash) e roteiro Playwright temporário (`tests/e2e/_tmp/real.spec.ts`, removido): versão 0.25 na tela inicial; "Novo jogo" com as 2 classes e o detalhe do Ladino; criar com Guerreiro → tela do grupo com dimensão, cidade inicial, "Classe: Guerreiro (trava cumprida)", "Vida 22/22" e 7 cartas na mão; sem classe → "Escolha uma classe."; editor: criar Mago, publicar com erro da trava, excluir; "Validar como dimensão" → "A coleção forma uma dimensão válida.". 5 passaram.

## Problemas

- "Depois de `DELETE /parties/<id>`, `DELETE /lab/content/cards/fixture.stone-bend` → `204`" não foi rodado: havia um save anterior do autor usando o mapa da `fixture`, então o `409` seria o correto. O caso já está coberto pelo e2e do backend (`content-in-use.e2e-spec.ts`).
- O erro ao publicar a classe vem do backend com o texto "O deck pré-pronto precisa cumprir a trava da classe (padrão)."; o MSW usa outro texto de exemplo. Não é contrato (texto livre de `fields[].message`).

## Checks

Cenários: 26/26. Telas contra o backend real: 5/5. Testes afetados pelas fixtures: 385/385.

## Backend

Levar `docs/CONTRATO.md` v0.26 e `docs/ROADMAP.md` v0.31 para o backend.

## Commit sugerido

`chore/feat-06 validated against real backend`
