# 128 — Carta de Dimensão no catálogo e no editor

- Data — 2026-11-26
- Status — T-97 concluída com MSW
- Horas — null

## Alterações

- `src/lab/editor/CardForm.tsx` e `src/lab/editor/cardFormValues.ts` permitem adicionar, editar, remover e reordenar os IDs em “Coleções estendidas” e “Reprints”. O payload conserva a ordem de cada lista e o formulário associa os erros da API ao campo indexado.
- `src/ui/cards/DimensionCard.tsx` exibe os IDs publicados na ordem configurada e omite as seções sem entradas.
- `src/lab/editor/CardForm.test.tsx`, `src/lab/editor/CollectionTools.test.tsx` e `src/ui/cards/DimensionCard.test.tsx` reutilizam os schemas e fixtures da T-96 nas verificações do REQ-97. A spec registra a conclusão da T-97.

## Verificação

- Os testes novos do catálogo e do editor falharam inicialmente pela ausência dos controles e listas. Após a implementação, os 267 testes de editor, cartas e APIs de catálogo e vigência passaram em 17 arquivos. Typecheck, ESLint dos arquivos alterados e `git diff --check` passaram.
- Ao reordenar uma lista e salvar com sucesso, alternar para outra carta e voltar recupera os mesmos IDs na ordem enviada. A carta publicada apresenta as duas listas no catálogo.
- Na recusa de uma referência à própria coleção com `reprintCollectionIds.0`, a mensagem fica associada ao primeiro campo de Reprints. Após a correção, o salvamento é aceito.
- Como caso de borda, um JSON legado sem os dois campos é enviado integralmente ao import e aceito no cenário MSW. Ao abrir a Carta de Dimensão importada, ambas as listas ficam vazias e prontas para edição.

## Pendências

A T-98 cobre mercado e abertura com múltiplas coleções. A T-99 valida os cenários da FEAT-33 com a API real e MSW desligado, conforme o CONTRATO v1.02.
