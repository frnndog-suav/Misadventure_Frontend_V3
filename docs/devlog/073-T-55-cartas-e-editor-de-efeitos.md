# 073 — T-55: cartas e editor de efeitos

- **ID** T-55 · **FEAT** FEAT-11 · **Data** 2026-11-20
- **Status** aguardando revisão · **Spec** v0.70 · **Contrato** v0.52

## Implementação

REQ-53, REQ-55 e D-60. Catálogo e pré-visualização usam a mesma lista de efeitos. Cada linha exibe o texto recebido com Buff/Debuff quando houver marca, ou Positivo/Negativo em zonas e dimensões. A lista vazia fica oculta.

O editor das cinco categorias mantém o texto de cada parte JSON durante a edição. O salvamento usa os schemas da T-54 para validar o formato e preservar parâmetros, ordem e nulos. Reordenar move o efeito inteiro. O backend decide regras entre campos. Uma recusa com caminho como `effects.1.activation.0.amount` aparece junto ao campo Ativação do segundo efeito.

## Arquivos

- `src/lab/editor/CardForm.tsx` e `cardFormValues.ts` implementam os campos, a validação e o vínculo dos erros. `CardForm.test.tsx` cobre valores iniciais, formato inválido, operações de lista e recusas.
- `src/ui/cards/parts.tsx`, `ZoneCard.tsx`, `DimensionCard.tsx` e `src/ui/labels.ts` compartilham a apresentação e os rótulos. Os testes de carta usam efeitos estruturados.
- `tests/e2e/lab/lab.spec.ts` e `tests/e2e/editor/card-form.spec.ts` cobrem catálogo, pré-visualização, bloqueio e envio do corpo estruturado.

## Verificações

- Antes da implementação, o teste do REQ-55 falhou pela ausência dos campos. O teste de ida e volta das fixtures também confirmou a perda dos parâmetros estruturados.
- `node node_modules/vitest/vitest.mjs run src/ui/cards src/lab src/api/catalog.test.tsx src/api/editor.test.tsx src/api/effects.test.ts --maxWorkers=1` → 351 passaram. As duas falhas restantes, REQ-20 (busca com debounce) e REQ-33 (importação de coleção), foram reproduzidas no HEAD limpo `ad5dab7`.
- `node node_modules/playwright/cli.js test tests/e2e/lab tests/e2e/editor --reporter=line --workers=2` → 33 passaram com `VITE_USE_MOCKS=true`. O Chromium do Playwright estava ausente. A execução usou o Chrome instalado (`channel: 'chrome'`) e Vite isolado na porta 5175 em uma configuração temporária. No cenário de salvamento, a asserção de envio lê o corpo do PUT porque o mock retorna a carta fixa.
- Guarda de cliente, ESLint e Prettier nos arquivos de código e testes alterados, e `git diff --check` passaram.
- `node node_modules/typescript/bin/tsc -b` → quatro diagnósticos em `EffectsPanel.test.tsx`, relativos à T-56. O fluxo de build de produção depende do typecheck.

## Roteiro de verificação

1. Em `/lab`, abra o **Tônico de Força** no catálogo. A lista deve exibir **Buff: +3 de Ataque durante 2 vezes suas.** Abra uma carta sem efeitos e confirme que a lista fica oculta.
2. Em `/lab/editor`, abra o tônico. Confira que o gatilho é `null`, o custo contém `consumeSelf`, a duração tem duas vezes e a marca é **Buff**. Adicione um efeito, preencha seu texto, mova-o acima do original e remova-o. Confira que as partes JSON e a marca do original o acompanham.
3. Altere o valor `amount` da ativação para a string `"4"`. A pré-visualização deve dar lugar a **Formato de efeito inválido.**, e **Salvar rascunho** deve ficar desabilitado. Troque pela forma numérica `4`, atualize o texto e confira que a pré-visualização volta. Salve e confira o corpo do PUT com o valor numérico. O MSW devolve a carta fixa, enquanto a persistência real será conferida na T-57.
4. Em uma zona ou dimensão, adicione um efeito e preencha o texto. A polaridade começa em **Positivo**. Selecione **Negativo** e confira o prefixo atualizado na pré-visualização.
5. No cenário de recusa com MSW do teste de formulário, salvar a **Poção de Cura** com custo `[]` envia o pedido e mostra **Consumível precisa ter o custo de usar a própria carta.** junto ao campo Custo.

## Pendências

T-56 implementa status e ativação na partida. T-57 valida a FEAT-11 com o backend real e MSW desligado. Nenhuma dependência nova do backend nesta tarefa.

Commit sugerido `feat/cartas e editor de efeitos`.
