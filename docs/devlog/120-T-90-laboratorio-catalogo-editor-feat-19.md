# 120 — T-90, laboratório, catálogo e editor da conclusão (FEAT-19)

- Data — 2026-11-26
- Status — concluída com MSW
- Contrato — v0.96, FEAT-19 `acordado`
- Spec — REQ-90, REQ-91 e D-65
- Horas — `null`

## Entrega

- `src/lab/GrantSection.tsx` identifica os itens de conclusão no seletor de doação e mostra a área devolvida para o membro. Os campos de Pico e as mensagens de validação já vinham da T-89 e usam o fluxo existente do laboratório.
- `src/ui/cards/DimensionCard.tsx` exibe zona, requisito e prêmio máximo. O chefe final usa o bloco de inimigo de `CombatEventCard.tsx`. `ItemCard.tsx` mostra a marca abaixo da raridade.
- `src/lab/editor/CardForm.tsx` e `cardFormValues.ts` editam e serializam a conclusão opcional, os requisitos, o prêmio, o chefe e a marca de item de conclusão. Os caminhos do contrato ligam as mensagens fornecidas pelo backend aos campos. A lista de “Validar como dimensão” também apresenta os problemas da conclusão recebidos no resultado.
- `src/mocks/handlers.ts` devolve os dados editados no cenário de salvamento e simula a recusa da zona “Nenhuma”. O texto do MSW é provisório até o backend publicar as mensagens da FEAT-19.

## Verificação

- 348 testes afetados passaram em 19 arquivos. A reexecução de `CollectionTools.test.tsx` passou com 15 testes. Os 44 E2E de laboratório e editor passaram em Chromium com MSW. Tipos, lint, formatação dos arquivos alterados e build de release passaram.

- Os dois cenários E2E novos falharam inicialmente pela ausência da conclusão no catálogo e no formulário.
- Com MSW no Chromium, o laboratório mostrou os padrões 15 e 25, o catálogo resolveu os nomes do requisito e do prêmio, e a doação de três Fragmentos apareceu na área do membro.
- O editor abriu a conclusão existente, exibiu os campos de inimigo ao marcar “Tem chefe final”, ligou a mensagem de zona inválida ao campo correto e enviou o prêmio máximo corrigido. “Validar como dimensão” apresentou as mensagens na ordem recebida.
- Caso de borda: carta legada sem conclusão omite o bloco. Uma conclusão sem chefe omite apenas o chefe.
- Um teste E2E anterior do editor de combate tinha seletores ambíguos para “Coisa boa” e “Coisa ruim”. Os seletores agora usam o rótulo exato.

## Retomada

T-91, itens de conclusão e requisito na tela do grupo (REQ-92). A verificação contra a API real da FEAT-19 segue na T-95.

## Commit sugerido

`feat/t-90 feat-19 dimension completion lab catalog and editor`

