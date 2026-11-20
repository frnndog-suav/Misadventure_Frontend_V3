# 076 — T-58, cliente e fixtures de eventos aleatórios

**2026-11-20 · concluída · Spec v0.74 · Contrato v0.57**

Contrato v0.56 e roadmap v0.58 sincronizados por SHA-256. O autor aprovou os critérios REQ-56 a REQ-59 e a D-61.

## Entrega da sessão

- `src/api/randomEvents.ts`, `catalog.ts`, `labConfig.ts` e `parties.ts` recebem cartas executáveis, decks por zona, valores do laboratório, encontro, requisitos, recibos, ações e recompensas. O cliente conserva cartas legadas, aceita os dados de configuração acordados e preserva `checks` nas recusas.
- `src/mocks/randomEventFixtures.ts`, `handlers.ts`, `partyFixtures.ts` e `fixtures.ts` acrescentam respostas estáticas para antecipação, revelação, pagamento parcial, recusa, consumível, descarte aleatório e Vasculhar sem espaço. As fixtures usam uma carta de teste para evitar antecipar a conversão de conteúdo legado que exige revisão do autor.
- Os tratamentos existentes em `PartySession.tsx` aceitam os novos motivos usando a mensagem do backend. Os testes da API e da sessão foram atualizados para os campos do contrato.

## Verificação

O teste REQ-57/58 falhou antes da alteração porque o schema descartava `handCopies`, o saldo de dívida e os campos de encontro. Rode `node node_modules/vitest/vitest.mjs run src/api src/features/party/PartySession.test.tsx`. No caso de borda, enviar `h2` entre duas cópias de mesmo `cardId` deve preservar `h1` e registrar `h2` no recibo.

`typecheck` e `test:build` passaram. O REQ-05 confirmou a ausência do laboratório no release. O Vite emitiu um aviso de tamanho do bundle. A suíte da API e da sessão passou com 399 testes em 12 arquivos.

## Fechamento da T-58

- `src/api/labConfig.ts`, `src/mocks/fixtures.ts` e `src/mocks/handlers.ts` preservam os limites do contrato v0.57 e retornam `LAB_CONFIG_INVALID` para o peso zero da primeira entrada (`reserveDeck.0.weight`). Os limites novos são opcionais na leitura para aceitar respostas anteriores à FEAT-12.
- `src/mocks/randomEventFixtures.ts` e `src/mocks/handlers.ts` completam os cenários de antecipação, recarga, consumível, pagamento por cópia e ouro, verificação de mínimo, desistência, fuga e dívida de PA, compra e entrega de recompensas e Vasculhar. Cada ID seleciona um estado fixo de partida (D-61). A recarga usa o ID do estado desejado, conforme a fixture.
- `src/api/catalog.test.tsx`, `src/api/labConfig.test.tsx` e `src/api/partyActions.test.tsx` verificam o conteúdo legado e executável, o deck misto por zona e as respostas da API com MSW. Os testes de cenários novos acusaram inicialmente limites ausentes, respostas inexistentes e ações aceitas indevidamente no mock.

### Como verificar

1. Rode `npm.cmd test -- --maxWorkers 2`. Os cenários da T-58 devem passar.
2. Caso de borda do REQ-58. No save `party-evento-descarte-parcial`, envie duas vezes o pagamento aleatório sem `payment`. Espere `eventMinimumNotMet` com Vigor efetivo 4. O GET preserva `h1` e `h3`, o recibo de `h2` e o `savedAt`.
3. Caso de borda do REQ-59. No save `party-evento-premio-urbano`, manter `r1` sem descarte é recusado. Liberar o slot elegível entrega a recompensa urbana e apresenta `r2` da reserva. O save `party-evento-premio-reserva` devolve `removed` ao deixar `r2`.

### Resultados das verificações

- API, sessão do grupo e laboratório: 456 testes em 13 arquivos. Após ajustar os dados dos desfechos de compra e busca, os 94 testes diretamente afetados passaram novamente.
- `npm.cmd run typecheck`, `npm.cmd run lint` e `npm.cmd run test:build` passaram. O release exclui o laboratório (REQ-05). O Vite continua avisando sobre o tamanho do bundle.
- Suíte completa: 792 testes passaram e dois falharam, nos cenários de importação REQ-33 (`CollectionTools.test.tsx`) e busca com debounce REQ-20 (`EditorPage.test.tsx`). Ambas as falhas foram reproduzidas em uma cópia isolada do `HEAD` anterior à etapa.

### Pendências de outras etapas

A migração de `base.abandoned-cart` e `fixture.wounded-traveler` depende de revisão do autor. As telas seguem nas T-59 a T-61. A T-62 cobre a integração real com MSW desligado. Estado interno do RNG, reciclagem de decks e limbo precisam de verificação no backend. Os cenários de relógio multiplayer seguem na integração FEAT-26.

Commit sugerido `feat/t-58 feat-12 complete random event fixtures and client tests`.
