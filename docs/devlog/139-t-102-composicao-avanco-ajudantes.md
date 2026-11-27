# 139 — Composição e avanço automático dos ajudantes

- Data — 2026-11-27
- Status — T-102 concluída
- Horas — null
- Referências — FEAT-20, REQ-103 a REQ-105, seção FEAT-20 do CONTRATO v1.09 (repositório backend), devlog 138

## Alterações

- `src/features/party/PartySession.tsx` identifica host e ajudantes, destaca quem está na vez na ordem recebida e usa o estado devolvido pela abertura, pela retomada e pelas ações. Bloqueia as ações durante o avanço, enquanto a intenção estiver sem confirmação, fora da vez do host em grupos com ajudantes e no congelamento. Mantém o relógio de recompensa desligado no grupo com um humano e ajudantes e preserva o fluxo de escolha e retomada do solo legado.
- Cada ação em grupo com ajudantes recebe um UUID. A tela guarda uma cópia do pedido na sessão do navegador para permitir o reenvio com a mesma chave e corpo, inclusive ao reabrir a rota. `src/api/http.ts` conserva o status HTTP dos erros para distinguir recusas de respostas inconclusivas. Quando o servidor recusa uma ação nova por já existir um avanço pendente, a tela oferece a retomada da sessão.
- `src/mocks/handlers.ts` oferece um cenário de perda de resposta com três ajudantes e virada de rodada. `src/features/party/PartySession.test.tsx` e `tests/e2e/party/party-session.spec.ts` cobrem os fluxos da T-102 com MSW.

## Verificação

- O teste de regressão falhou inicialmente pela ausência de `Idempotency-Key`. Com a implementação, confirma a mesma chave e corpo após HTTP 500 e reabertura da tela, a nova ordem na segunda dimensão e uma nova chave para a ação seguinte.
- Caso de borda — após `409 ACTION_ADVANCE_PENDING`, a ação recusada fica bloqueada e a retomada pelo POST de sessão aplica o congelamento devolvido. O estado congelado mantém as ações bloqueadas.
- Os 53 E2E de `party` passaram em Chromium com MSW, em uma instância isolada do Vite. Na primeira execução, os cenários legados de efeitos e mercado falharam por timeout. Ambos passaram na repetição completa com três workers.
- A suíte completa passou com 1.211 testes. Após o ajuste final do destaque visual e do teste de transição, os 318 testes dos quatro arquivos afetados passaram. Typecheck, lint e `git diff --check` passaram.

## Retomada

A T-103 integra as prioridades dos ajudantes ao laboratório. Os saves e checkpoints da T-104 foram preservados para a validação integrada após essa etapa.
