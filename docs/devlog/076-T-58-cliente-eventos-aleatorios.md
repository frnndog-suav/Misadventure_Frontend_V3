# 076 — T-58, cliente e fixtures de eventos aleatórios

**2026-11-20 · em andamento · Spec v0.74 · Contrato v0.56**

Contrato v0.56 e roadmap v0.58 sincronizados por SHA-256. O autor aprovou os critérios REQ-56 a REQ-59 e a D-61.

## Entrega da sessão

- `src/api/randomEvents.ts`, `catalog.ts`, `labConfig.ts` e `parties.ts` recebem cartas executáveis, decks por zona, valores do laboratório, encontro, requisitos, recibos, ações e recompensas. O cliente conserva cartas legadas, aceita os dados de configuração acordados e preserva `checks` nas recusas.
- `src/mocks/randomEventFixtures.ts`, `handlers.ts`, `partyFixtures.ts` e `fixtures.ts` acrescentam respostas estáticas para antecipação, revelação, pagamento parcial, recusa, consumível, descarte aleatório e Vasculhar sem espaço. As fixtures usam uma carta de teste para evitar antecipar a conversão de conteúdo legado que exige revisão do autor.
- Os tratamentos existentes em `PartySession.tsx` aceitam os novos motivos usando a mensagem do backend. Os testes da API e da sessão foram atualizados para os campos do contrato.

## Verificação

O teste REQ-57/58 falhou antes da alteração porque o schema descartava `handCopies`, o saldo de dívida e os campos de encontro. Rode `node node_modules/vitest/vitest.mjs run src/api src/features/party/PartySession.test.tsx`. No caso de borda, enviar `h2` entre duas cópias de mesmo `cardId` deve preservar `h1` e registrar `h2` no recibo.

`typecheck` e `test:build` passaram. O REQ-05 confirmou a ausência do laboratório no release. O Vite emitiu um aviso de tamanho do bundle. A suíte da API e da sessão passou com 399 testes em 12 arquivos.

## Pendências

A T-58 ainda requer completar a matriz de fixtures e testes dos cenários acordados. As telas estão nas T-59 a T-61. O contrato especifica os valores e entradas de `escapeVigorPercent` e `reserveDeck`, mas ainda falta o formato de `LabConfig.limits` e das recusas para entradas inválidas da reserva. A migração de `base.abandoned-cart` e `fixture.wounded-traveler` requer revisão do autor, conforme o contrato. A validação real segue reservada à T-62.
