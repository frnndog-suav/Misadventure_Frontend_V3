# 072 — T-54: cliente e fixtures de efeitos

- **ID:** T-54 · **FEAT:** FEAT-11 · **Data:** 2026-11-19
- **Status:** concluída em 2026-11-20 · **Spec:** v0.70 → v0.73 · **Contrato:** v0.52

## Objetivo

Retomar a base local da T-54, conforme autorização do autor, sem implementar as telas das T-55/T-56.

## Decisões

REQ-53/54/55 e D-60: efeitos validam formato e preservam parâmetros; nenhuma execução de regras no cliente. Enumerações compartilhadas ficam em `vocabulary.ts`, reexportadas pelo catálogo. `PlayerState` exige status e efeitos ativáveis, sem defaults que escondam resposta incompatível. `activate` preserva ids repetidos e omite pagamento quando não fornecido. `ACTION_INVALID` continua no tratamento genérico existente, preservando seus detalhes; os novos motivos de `ACTION_NOT_ALLOWED` entram no schema específico.

O MSW devolve estados fixos de poção e tônico e uma recusa fixa; não calcula custos ou expiração. Metadados das quatro cartas novas que o contrato não fixa são exemplos, como nas fixtures anteriores.

## Arquivos

- `src/api/effects.ts`, `effects.test.ts`, `vocabulary.ts`, `catalog.ts`, `parties.ts`: schemas e tipos.
- `src/api/partyActions.test.tsx`, `catalog.test.tsx`, `preparation.test.tsx`, `inventory.test.tsx`, `vault.test.tsx`: transporte, recusas e regressões das fixtures.
- `src/mocks/catalogFixtures.ts`, `partyFixtures.ts`, `effectFixtures.ts`, `handlers.ts`: 24 cartas e estados estáticos.
- `src/features/party/PartySession.tsx`: switches exaustivos aceitam os motivos novos usando a mensagem do backend, sem texto suplementar.
- Índice do devlog e registro de tempo.

## Passos, checks e como verificar

1. Testes existentes de efeitos executados antes da implementação: 20 passaram e 14 falharam, identificando status, disponibilidade e motivos ausentes.
2. `node node_modules/vitest/vitest.mjs run src/api/effects.test.ts src/api/partyActions.test.tsx src/api/catalog.test.tsx src/api/editor.test.tsx src/api/inventory.test.tsx src/api/parties.test.tsx src/api/preparation.test.tsx src/api/deck.test.tsx src/api/vault.test.tsx`: **228 testes passaram em 9 arquivos**.
3. ESLint nos arquivos de código alterados: passou. Prettier aplicado somente aos arquivos envolvidos.
4. `node node_modules/typescript/bin/tsc -b --pretty false`: **não passou**, com 18 diagnósticos nos pontos listados abaixo. Não há diagnóstico na camada de API ou mocks.

Para repetir a validação da camada de cliente, execute o comando do item 2. Não há tela nova de efeitos para testar nesta etapa.

## Problemas e pendências

A migração do catálogo já iniciada localmente expõe dependências ainda não migradas: `cardFormValues.ts` produz o formato antigo (5 diagnósticos) e testes de apresentação de cartas usam efeitos antigos (9). São pontos da T-55. O teste local preexistente `EffectsPanel.test.tsx` tem 4 diagnósticos, incluindo componente inexistente, da T-56; foi preservado. Não suprimir erros, enfraquecer schemas nem implementar essas tarefas dentro da T-54. A T-54 permanece sem marca de conclusão na spec enquanto a integração não estiver revisada.

Preservados também o script local de transcrição e `.claude/settings.local.json`. O script não foi executado novamente.

## Backend

Nenhuma mudança de contrato nem arquivo compartilhado para copiar. FEAT-11 permanece `implementado (BE)`; validação integrada continua reservada à T-57 depois das telas.

## Commit sugerido

`feat/cliente e fixtures de efeitos`

## Revisão 2026-11-19

Retomada da T-54 pelo fluxo `/tarefa`. Revisão independente dos schemas, transporte e fixtures contra a FEAT-11: aprovada no escopo de implementação; fechamento global ainda pendente das migrações T-55/T-56. Nenhuma decisão nova nem alteração de contrato.

Complementada a cobertura em `src/api/editor.test.tsx` (envio e retorno de efeitos estruturados com ordem, parâmetros e nulos; `CONTENT_INVALID` com caminho aninhado) e `src/api/effects.test.ts` (rejeição de `PlayerState` sem `statuses` ou `activatableEffects`). A verificação ampliada encontrou expectativas antigas do catálogo; `src/lab/CatalogSection.test.tsx` e `tests/e2e/lab/lab.spec.ts` agora esperam as 24 cartas da fixture, incluindo 7 equipamentos e 7 itens.

Verificações desta retomada:

- Comando de cliente do item 2 acima, antes dos quatro casos novos: 228 testes passaram.
- `node node_modules/vitest/vitest.mjs related --run src/api/effects.ts src/api/vocabulary.ts src/api/catalog.ts src/api/parties.ts src/mocks/catalogFixtures.ts src/mocks/partyFixtures.ts src/mocks/effectFixtures.ts src/mocks/handlers.ts src/features/party/PartySession.tsx`: 686 passaram, 6 falharam e uma suíte não carregou. Cinco falhas eram expectativas antigas do catálogo, corrigidas nesta revisão. Restam a perda das partes estruturadas em `cardFormValues.test.ts` (T-55) e a importação de `EffectsPanel` inexistente (T-56).
- Após os ajustes: `node node_modules/vitest/vitest.mjs run src/api/effects.test.ts src/api/editor.test.tsx src/lab/CatalogSection.test.tsx`: **122 testes passaram**. Esse comando verifica também as recusas de campos obrigatórios ausentes e o erro aninhado do editor, sem backend.
- Guarda e ESLint passaram. Formatação dos testes editados passou; o check global aponta os arquivos locais preservados `AGENTS.md`, `scripts/generate-effects-schema.mjs` e `src/features/party/EffectsPanel.test.tsx`.
- `npm.cmd run typecheck` e `npm.cmd run test:build`: os mesmos 18 diagnósticos das T-55/T-56; o build não chegou à verificação de ausência do laboratório. No PowerShell, `npm.cmd` evita o bloqueio de execução de `npm.ps1`; o npm também precisou de execução aprovada fora do sandbox por `EPERM` ao acessar o perfil do usuário.

Rastreabilidade da cobertura acrescentada:

| Critério | Teste |
| --- | --- |
| REQ-53/55: preservar estrutura, parâmetros, ordem e nulos no editor | `editor.test.tsx`: salvar preserva efeitos estruturados |
| REQ-55: preservar recusa com caminho aninhado | `editor.test.tsx`: CONTENT_INVALID com caminho de parâmetro |
| REQ-54/D-14: rejeitar estado incompatível | `effects.test.ts`: ausência dos campos obrigatórios |
| Fixture FEAT-11: catálogo com 24 cartas | `CatalogSection.test.tsx` e e2e `lab.spec.ts` |

A T-54 permanece sem `[x]`: a aprovação da implementação não substitui os checks globais pendentes. Horas desta retomada não medidas; permanecem `null` para fechamento pelo autor.

E2E: **63 testes passaram (7,1 min)** em Chromium com MSW. A primeira tentativa na porta 5173 foi interrompida após três falhas de indisponibilidade de servidor; a instância reutilizada não atendia às fixtures. A execução válida usou uma instância isolada (`$env:VITE_USE_MOCKS='true'; node node_modules/vite/bin/vite.js --port 5174 --strictPort`) e configuração temporária herdando `playwright.config.ts`, com `use.baseURL: 'http://localhost:5174'` e `webServer: undefined`. Configuração temporária removida e instância isolada encerrada ao terminar. Para repetir pelo arquivo padrão, disponibilize a porta 5173, configure `VITE_USE_MOCKS=true` e rode `node node_modules/playwright/cli.js test --reporter=line`; os 63 cenários devem passar. A suíte existente não substitui a futura cobertura das telas de efeitos T-55/T-56.

## Encerramento em 2026-11-20

Com as T-55 e T-56 integradas, `npm.cmd run typecheck` e `npm.cmd run test:build` passaram. O REQ-05 confirmou a ausência do laboratório no build de release. O Vite emitiu um aviso sobre o tamanho do bundle JavaScript (535,05 kB minificado).

O roteiro de cliente do item 2 passou com 232 testes em 9 arquivos. Os 18 diagnósticos anteriores não se reproduziram. O encerramento atualizou a spec, o índice do devlog, esta entrada e o registro de tempo, com horas `null`.
