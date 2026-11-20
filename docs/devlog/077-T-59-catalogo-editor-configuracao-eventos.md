# 077 — T-59, catálogo, editor e configuração de eventos aleatórios

**2026-11-20 · concluída com MSW · REQ-56 · D-61 · CONTRATO v0.57**

Retomada da T-58 no registro 076.

## Entrega

- `src/ui/cards/RandomEventCard.tsx` apresenta os textos das duas formas da carta e o limiar explícito quando a fuga é permitida. Catálogo e editor usam a mesma apresentação da carta. A Carroça na Estrada da T-58 também está disponível no catálogo e no editor.
- `src/lab/editor/CardForm.tsx`, `cardFormValues.ts` e `formHelpers.tsx` preservam o formato legado e permitem editar requisitos executáveis e passos ordenados em listas JSON, com campos próprios para os textos dos desfechos, limiar e Sem fuga. A Carta de Dimensão usa o formulário de decks por zona para manter referências e cópias de eventos. Erros do backend apontam para os respectivos campos ou listas.
- `src/lab/LabPage.tsx` permite editar o percentual de Vigor da fuga e as entradas ponderadas do deck de reserva. Apresenta os limites fornecidos pelo backend e associa os erros indexados às entradas. Salvar e restaurar padrões usam a resposta da API.
- `src/mocks/catalogFixtures.ts`, `randomEventFixtures.ts`, `editorFixtures.ts`, `fixtures.ts` e `handlers.ts` fornecem cenários estáticos para a carta executável, o deck misto, a rejeição de uma referência legada na publicação e a alteração da configuração. Os testes de catálogo, API, editor e laboratório acompanham esses cenários.

## Como verificar

1. No laboratório com MSW, filtre por Evento aleatório. Abra Viajante Ferido e Carroça na Estrada. Cada carta deve mostrar seus requisitos e desfechos.
2. No editor, abra Carroça na Estrada e confira o requisito executável, os passos dos desfechos, o limiar e Sem fuga. Em Dimensão de Teste, confira o deck urbano com duas cópias da Carroça e uma de Lobos Uivantes.
3. Em Dimensão com evento legado, confirme Publicar. O erro deve aparecer junto a `fixture.wounded-traveler`, e a carta deve permanecer em rascunho.
4. Na configuração, informe 25 no percentual de fuga, peso 2 na entrada padrão de ouro e adicione `fixture.healing-potion` com peso 3. Salvar deve mostrar esses valores. Restaurar padrões deve voltar a 20% e uma entrada de ouro. Como caso de borda, envie peso 0 na primeira entrada. Espere a rejeição por `reserveDeck.0.weight` junto ao campo, que deve continuar mostrando 0.

## Verificações

- A primeira execução dos testes novos confirmou a perda das regras executáveis na preparação do corpo e a ausência dos novos campos de configuração.
- A execução direcionada passou com 183 testes em 7 arquivos.
- A suíte completa teve 798 testes aprovados e duas falhas já registradas no 076 e reproduzidas ali no HEAD anterior: importação do REQ-33 e busca com debounce do REQ-20.
- `npm.cmd run lint` e `npm.cmd run test:build` passaram. O build inclui a checagem de tipos e confirmou a ausência do laboratório no release (REQ-05). O Vite manteve o aviso de tamanho do bundle.

## Retomada

A T-60 implementa o encontro na tela do grupo com REQ-57, REQ-58 e D-61. A validação real da FEAT-12 segue na T-62. A conversão de `base.abandoned-cart` e `fixture.wounded-traveler` aguarda revisão do autor.

Commit sugerido `feat/t-59 feat-12 support event cards decks and lab settings`.
