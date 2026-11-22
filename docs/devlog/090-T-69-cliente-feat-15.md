# 090 — T-69, cliente e fixtures MSW da FEAT-15

- Data — 2026-11-22
- Status — concluída com MSW
- Contrato — v0.73, FEAT-15 acordada no recorte solo
- Spec — REQ-66 a REQ-70
- Horas — null

## Entrega

- Sincronizado o `docs/CONTRATO.md` com o arquivo entregue pelo backend. A comparação SHA-256 confirmou a igualdade das cópias.
- `src/api/quests.ts`, `parties.ts`, `combat.ts` e `randomEvents.ts` leem o estado projetado, enviam as intenções pela rota existente e preservam recusas e a origem da recompensa. Snapshots anteriores recebem listas vazias para o estado de missões.
- `src/api/catalog.ts`, `editor.ts`, `vocabulary.ts` e `labConfig.ts` cobrem cartas, etapas, especializações, filtros, contagens e os dez ajustes de laboratório. Os consumidores existentes foram ajustados para os novos formatos. Formulários existentes preservam o deck de missões das zonas e as especializações recebidas ao salvar outras alterações.
- `src/mocks/questFixtures.ts` e `questEditorFixtures.ts` acrescentam cenários determinísticos aos handlers. As fixtures de catálogo, classes, grupos e laboratório fornecem os dados de apoio.
- `src/api/quests.test.ts` cobre os REQs. Expectativas existentes foram alinhadas aos formatos da v0.73. Os testes de busca e importação do editor também receberam ajustes de sincronização para as falhas já registradas na entrada 087.

## Verificação

Os quatro testes iniciais falharam antes da implementação. Os grupos de missão devolviam `PARTY_NOT_FOUND` e a resposta de laboratório ainda não continha os novos ajustes.

- REQ-66 e REQ-69 — Aceitar B repõe D no quadro. Finalizar na zona errada recusa e preserva integralmente o grupo. No destino, finalizar remove a missão e persiste a fonte da recompensa. Abandonar a 0 PA libera a vaga. Reaceitar começa na etapa 0 com outro ID.
- REQ-67 — Um êxito avança duas missões no primeiro POST e mantém os contadores ao resolver a recompensa e reabrir a sessão. O Cavaleiro é concedido com trava falsa e ativado pelo próximo ajuste de build.
- REQ-68 — Treinar consome os PA restantes e 150 de ouro. Abandonar mantém o gasto. Finalizar uma missão cumprida acrescenta a classe inativa e preserva a capacidade de inventário.
- REQ-69 — Fuga permite nova tentativa. A vitória com o dono caído conclui a etapa e preserva o contador de vitórias de pé durante a entrega e o respawn.
- REQ-70 — O laboratório aceita atualização e reset e recusa o lote inválido sem persistir alterações. O editor aceita o rascunho e a publicação. A referência de categoria errada ou o título inexistente retornam o caminho do campo e conservam a carta gravada.

A suíte completa passou com 876 testes em 40 arquivos, incluindo 13 testes da T-69. A checagem de tipos, o lint e git diff --check passaram.

As interfaces de jogo, laboratório e editor e a validação contra a API real ficam para as entregas seguintes.
