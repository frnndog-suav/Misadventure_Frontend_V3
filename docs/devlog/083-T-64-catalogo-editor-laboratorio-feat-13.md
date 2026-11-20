# 083 — T-64, catálogo, editor e laboratório da FEAT-13

**2026-11-20 · concluída com MSW · REQ-60 · CONTRATO v0.64 · SPEC v0.77**

Retomada do registro 082.

- `src/ui/cards/CombatEventCard.tsx`, `parts.tsx` e `cards.css` apresentam habilidades executáveis, limiar de fuga, regras dos inimigos e passos dos desfechos no catálogo e na pré-visualização. Os detalhes estruturados ficam em painéis expansíveis.
- `src/lab/editor/CardForm.tsx` e `cardFormValues.ts` preservam cartas legadas e executáveis. O editor usa campos JSON para os dados estruturados das habilidades, regras dos inimigos e passos. Um campo de passos vazio mantém o desfecho legado. `[]` mantém o desfecho executável sem passos. A pré-visualização confere o schema e a API decide se aceita o conteúdo. Os erros indexados de habilidade ficam junto ao campo correspondente.
- `src/lab/LabPage.tsx` apresenta os dez valores numéricos de combate com padrões e limites da API, além das prioridades por comportamento na ordem recebida. `src/mocks/handlers.ts` oferece o cenário de salvamento com limiar zero.

| Roteiro com MSW | Resultado observado |
| --- | --- |
| `CatalogSection.test.tsx` recebe a carta executável na lista e abre Lobo Cinzento. | Exibe Poder 2, limiar 0 e os dois desfechos executáveis sem passos. Os testes existentes cobrem a carta legada. |
| `CardForm.test.tsx` abre a carta executável, informa zero cargas em uma habilidade canalizada e salva. | O PUT conserva os desfechos e o limiar zero e envia a edição. A recusa indexada aparece na habilidade e preserva a digitação. `cardFormValues.test.ts` também verifica regras próprias, ordem dos passos e a diferença entre limiar ausente e nulo. |
| `LabPage.test.tsx` salva limiar 0, restaura os padrões e envia prioridade duplicada no perfil Defensivo. | Exibe o zero confirmado pelo PATCH e volta a 10 após o reset. A recusa da prioridade fica associada ao perfil e conserva a lista digitada em ordem. |

A primeira execução dos testes novos confirmou os campos ausentes no catálogo, no formulário e no payload. A execução final direcionada passou com 207 testes em 13 arquivos. A execução completa teve 826 testes aprovados e repetiu as duas falhas preexistentes do registro 082, importação de coleção (REQ-33) e busca com debounce (REQ-20). Lint, build com a guarda de release (REQ-05) e `git diff --check` passaram. O Vite manteve o aviso de tamanho do bundle.

Próxima etapa: T-65, tela, ações, pagamentos e desfechos de combate (REQ-61). A validação integrada com a API real está planejada para a T-67.

Commit sugerido `feat/t-64 feat-13 support combat cards and lab settings`.
