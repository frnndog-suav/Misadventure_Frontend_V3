# 091 — Interface de missões e progressão de classes da FEAT-15

- Data — 2026-11-22
- Status — interface solo aprovada com MSW. A validação integrada dos REQ-66 a REQ-70 aguarda a implementação da FEAT-15 no backend.
- Contrato — v0.73, recorte solo, segue acordado
- Spec — REQ-66 a REQ-70
- Horas — null

## Entrega

- `QuestPanel.tsx` e `PartySession.tsx` exibem quadro, missões abertas, destinos, etapas, contadores, provação, mentor e travas das especializações na ficha. Os botões usam as escolhas e custos confirmados pelo servidor e enviam somente a intenção. A sessão reaproveita os fluxos de encontro, combate e escolha de recompensa.
- `LabPage.tsx` inclui os dez ajustes no fluxo existente de valores, padrões, limites, salvamento e reset.
- `CardsSection.tsx`, `CardForm.tsx` e `cardFormValues.ts` passam a abrir, criar, editar e duplicar cartas de missão. O editor aceita os quatro tipos de etapa e o deck ordenado da zona. `ClassForm.tsx` e `classFormValues.ts` acrescentam a edição de especializações. Combate embutido, recompensas e efeitos de especialização usam campos JSON com mensagens de erro do servidor associadas ao campo.

## Verificação com MSW

- Os testes de interface falharam inicialmente pela ausência do quadro, dos ajustes e dos formulários. As fixtures da T-69 foram reutilizadas.
- A cobertura verifica aceitação e destino da missão, concessão inativa de Cavaleiro, custo do mentor, abandono a 0 PA sem reembolso, progresso simultâneo antes da entrega e após recarga, ajustes do laboratório e rascunho de missão. O caso de borda do editor usa uma carta de combate como referência de evento aleatório, espera a mensagem no campo e salva ao corrigir a referência.
- A suíte completa passou com 883 testes em 40 arquivos. Checagem de tipos, lint e `git diff --check` passaram.

## Roteiro para validação integrada

- Abrir a sessão de teste em Google Chrome com MSW desligado. Aceitar uma oferta com outra carta no topo do deck e conferir a reposição. Ir ao destino e entregar a missão. Se houver recompensa pendente, reabrir antes de resolver e conferir a conclusão persistida.
- Na campanha com provação e missão de zona, conferir o avanço simultâneo no primeiro desfecho, antes da entrega de recompensa. Conferir também fuga seguida de nova tentativa e vitória com dono caído, que conclui a etapa sem incrementar vitórias de pé.
- Finalizar a provação e conferir que o próximo salvamento da build ativa a especialização se cumprir a trava. Treinar com o mentor, conferir custos, abandonar sem reembolso e finalizar em campanha preparada para conferir classe, travas, modificadores e capacidade de inventário.
- No laboratório, testar alteração, recusa de lote inválido e reset. No editor, salvar e publicar a missão, verificar os erros de referência e associar o conteúdo a um quadro de zona.

Quando o ambiente estiver pronto, o backend enviará a URL da API, os IDs das campanhas e o ID da coleção de teste para a rodada com MSW desligado.
