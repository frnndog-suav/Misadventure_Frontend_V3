# 136 — T-104, validação integrada da FEAT-20

- **Data** — 2026-11-27
- **Situação** — bloqueada na leitura de saves com ajudantes
- **Horas da sessão** — `null`
- **Referências** — CONTRATO v1.09, SPEC-BACKEND v1.14 (entrega da T-91), devlog BE 110, REQ-102 a REQ-106

O módulo HTTP do frontend foi carregado via Vite com `VITE_API_URL=http://127.0.0.1:3391` e `VITE_USE_MOCKS=false`. Os 13 GETs responderam e passaram pelo schema real de `src/api/parties.ts`. Os três saves solo foram aceitos. Em todos os dez saves com ajudantes, esperava-se aceitar `members[].kind = "aiHelper"` conforme o contrato. O valor veio da API, mas o parser rejeitou cada ajudante em `members[i].kind` com `Invalid input: expected "human"`.

| Cenário | Evidência e pendência |
| --- | --- |
| 1. Opções, criação e legado | GET indicou 1–6. Omitido `28b0fa97-5e01-498d-ac24-e825e70c83ac` e zero `6372cb44-1c96-4c07-bf04-840637080b82` têm apenas Lia. O legado `7c9578c1-3352-49f3-9272-812ede34fdac` preserva o humano `b84e7ef6-7587-4e88-a396-76431317ed3e` e 37 de ouro no GET. O máximo `fa4d6736-6a83-42b4-a700-3ab6888b3e3b` tem cinco ajudantes rejeitados pelo parser. Criação, limites dinâmicos e abertura do legado pendentes. O teste com laboratório desligado consta no BE 110. |
| 2. Empate e IA em primeiro | `4ecf36fe-4ff5-4085-a75d-30262d75b9b8` em `idle`, com ordem esperada Ajudante 2, Ajudante 3, Ajudante 1, Lia. Parser rejeitou a composição. Sessão e confirmação das rolagens pendentes. |
| 3. Virada de rodada | `70e0a329-6a9a-49c0-b4b3-4d39d19ecc03` na vez de Lia, rodada 1, com 3 PA e ordem esperada. Parser rejeitou a composição. Avanço, checkpoints e retorno a Lia na rodada 2 pendentes. |
| 4. Interrupção e reenvio | Controle `e7a31810-ac77-4021-a478-a274dfc020c2`, corte humano `62cca321-7cd9-4352-996b-51a79b6e5d09` e corte IA `92cea73c-eb9d-46be-938f-23aa8d6cd0a6` nas condições iniciais do roteiro. Parser rejeitou os três. Interrupções, retomadas, comparação com controle e reenvios pendentes. O cliente atual também não fornece `Idempotency-Key`. |
| 5. Sucessora e congelamento | `a52a309c-0f1d-49c4-a07d-b3c1d2693299` e `a41a24d0-8231-4e6c-a29a-83ce286438d5` oferecem `completeDimension` à humana no GET. Parser rejeitou ambos. Transição, progressão e congelamento pendentes. |
| 6. Prioridades | GET de configuração confirmou valores e padrões na ordem `avoidKnockout`, `dimensionCompletion`, `quests`, `peak`, `gold`, sem entrada em `limits`. Parser rejeitou os saves `043ee90d-aaa1-4ab0-9089-6d5663934652` e `5562f4e5-3a75-4a5d-8b37-73a3c5779ba2`. PATCH, reset e confirmação dos snapshots pendentes. |

Somente GETs foram executados, preservando saves, checkpoints, chaves e configuração do laboratório. O `/health` confirmou `contractVersion: 1.04`, divergência já registrada pelo backend. A cópia do contrato no frontend está em v1.08. A referência v1.09 foi consultada no repositório do backend.

Retomada pela T-100 no frontend. Após T-100 a T-103, repetir a T-104 com o roteiro e os dados do BE 110. Caso de borda para a retomada: o save com cinco ajudantes deve passar pelo mesmo parser que aceitou o solo legado.
