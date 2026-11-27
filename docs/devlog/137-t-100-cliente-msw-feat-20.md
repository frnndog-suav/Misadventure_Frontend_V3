# 137 — Cliente e fixtures MSW da FEAT-20

- Data — 2026-11-27
- Status — T-100 concluída
- Horas — null
- Referências — SPEC-FRONTEND REQ-102 a REQ-106 e seção FEAT-20 do CONTRATO v1.09, consultada no repositório backend

## Alterações

- `src/api/parties.ts` lê membros humanos e ajudantes, consulta os limites de criação, envia a quantidade opcional e interpreta suas recusas. `src/api/http.ts` permite enviar a chave de idempotência fornecida pelo chamador. O schema exige `combatUpdates` nas respostas de ação com ajudantes e preserva a leitura das respostas solo legadas.
- `src/api/labConfig.ts` reconhece a permutação das cinco prioridades em valores e padrões. `src/lab/LabPage.tsx` mantém a lista fora dos campos numéricos existentes.
- `src/mocks/handlers.ts`, `src/mocks/partyFixtures.ts` e `src/mocks/fixtures.ts` cobrem criação solo, limites e recusas, IA em primeiro lugar, passagem por ajudantes consecutivos e configuração das prioridades.

## Verificação

- O teste de regressão falhou inicialmente nos cinco campos `members[i].kind` com a mesma rejeição registrada na T-104. O caso de borda usa o mesmo parser para o solo legado e o grupo com cinco ajudantes.
- Os testes em `src/api/parties.test.tsx` verificam os limites 1–6, a criação omitida, zero e máxima, as recusas de quantidade e a alteração do mínimo após a consulta. A abertura entrega a vez ao humano com a ordem original. O fim da vez com a chave entrega a rodada 2, na vez humana, com `combatUpdates: []`.
- `src/api/labConfig.test.tsx` verifica a ordem inicial, a substituição da lista, a recusa de duplicatas e a restauração após reset.
- Os 39 testes dos módulos diretamente afetados e os 1.208 testes da suíte do frontend passaram. Typecheck, lint, verificação do build de release e `git diff --check` passaram. O Vite reportou um bundle acima de 500 kB.

## Retomada

A T-101 usa as opções de criação e os erros de campo em Novo jogo. A T-102 integra à tela o avanço e a conservação da chave e do corpo por intenção. A T-103 integra as prioridades ao laboratório. A validação da T-104 continua reservada para depois da T-103, com os dados do devlog BE 110. Esta etapa usou o MSW e preservou os saves, os checkpoints e a configuração do ambiente integrado.
