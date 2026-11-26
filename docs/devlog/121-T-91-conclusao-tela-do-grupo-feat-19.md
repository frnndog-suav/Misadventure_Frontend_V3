# 121 — T-91, itens de conclusão e requisito na tela do grupo (FEAT-19)

- Data — 2026-11-26
- Status — concluída com MSW
- Contrato — v0.96, FEAT-19 `acordado`
- Spec — REQ-92 e D-65
- Horas — `null`

## Entrega

- `src/features/party/PartySession.tsx` exibe a conclusão da Carta de Dimensão abaixo de “Cidade inicial” e resolve os nomes pelo catálogo. A seção de cada membro exibe `completionItems` na ordem recebida em uma lista própria, junto das missões do host quando presentes.
- `tests/e2e/party/party-session.spec.ts` cobre a conclusão sem chefe, o chefe sem fuga, a lista de itens e os estados vazios. O teste de sessão passou a selecionar “Continuar” na campanha “Os Teimosos”.
- `src/features/party/PartySession.test.tsx` aguarda a consulta do requisito antes de passar ao teste que conta requisições ao catálogo.

## Verificação

- Os dois cenários novos falharam no código anterior com MSW ativo pela ausência da seção e do texto do chefe. Os 41 E2E da área `party` passaram em Chromium com MSW em servidor isolado.
- Em `/grupo/party-conclusao`, a Mina Velha e o requisito de três Fragmentos aparecem logo abaixo da cidade inicial. Lia tem três Fragmentos na lista própria. Em `/grupo/party-chefe-final`, o Guardião da Mina aparece com “Sem fuga”.
- Caso de borda — em `/grupo/party-dimensao-concluida`, a Segunda Dimensão exibe “Nenhum item de conclusão.” na seção de Lia e omite o bloco de conclusão.
- Passaram 418 testes afetados em oito arquivos, além de tipos, lint e formatação do código alterado, e build de release. A validação com a API real segue na T-95.

## Retomada

T-92, ação “Concluir dimensão” e painel de conclusão (REQ-93, REQ-95 e D-65).

## Commit sugerido

`feat/t-91 feat-19 show dimension completion in party screen`
