# 136 — T-104, validação integrada da FEAT-20

- **Data** — 2026-11-27
- **Situação** — T-104 concluída e FEAT-20 validada
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

## Revalidação integrada após T-100 a T-103 — 2026-11-27

- **Situação** — seis cenários funcionais verificados. Divergência de versão no `/health` permanece aberta.
- **Horas da sessão** — `null`
- **Ambiente** — cliente HTTP e schemas reais do frontend carregados via Vite, `VITE_API_URL=http://127.0.0.1:3391` e `VITE_USE_MOCKS=false`. Referência FEAT-20 no CONTRATO v1.09 do backend. Consultas de evidência ao PostgreSQL dedicado em conexão somente de leitura. A sessão não incluiu navegação pela interface.
- **Evidências** — `C:/Users/meu-o/AppData/Local/Temp/misadventures-t104-n4jIVD`. Os arquivos numerados guardam requisições e respostas, e os arquivos de checkpoint guardam a linha do save e seus recibos. `conferencia-complementar.json` registra a comparação final. Em `resumo.json`, a contagem de 31 como tamanho total da lista e a comparação textual de um lote foram verificações inadequadas, corrigidas pela análise abaixo. Os status de sucesso nos arquivos numerados correspondem aos códigos presumidos por rota após sucesso de `requestJson`. Os status de erro foram capturados de `ApiError`.

| Cenário | Resultado e evidência |
| --- | --- |
| 1. Criação e legado | Opções 1–6. Omissão e zero criaram um humano; máximo criou um host humano e cinco ajudantes com mãos ocultas, aceitos pelo parser. Fracionário, nulo, negativo e acima do máximo devolveram `PARTY_INVALID` com os motivos esperados. Mudança do mínimo para 2 devolveu `belowMinPlayers`; a configuração foi restaurada. O solo legado abriu com o mesmo humano e 37 de ouro. A listagem inicial trouxe 41 saves T-91, incluindo controles adicionais; o roteiro pede a disponibilidade dos saves preparados e não fixa o total. A consulta com laboratório desligado usa a evidência do BE 110. |
| 2. Iniciativa | Semente 1. A evidência determinística do BE 110 registra D20 2/9/12/12 e rerrolagem de 18/17 só para os empatados. No frontend, o save em `idle` tinha Ajudante 2 → Ajudante 3 → Ajudante 1 → Lia. O POST de sessão preservou a ordem e o GET confirmou Lia na rodada 1 com 3 PA. |
| 3. Virada | Semente 3. Lia começou na rodada 1 com 3 PA, na ordem Ajudante 3 → Lia → Ajudante 1 → Ajudante 2. O `endTurn` devolveu 54 atualizações. O GET confirmou todo o estado público, com Lia na rodada 2 e 3 PA. Os controles em `3-controles-virada.json` confirmam a sequência após cada commit: Ajudante 1/R1, Ajudante 2/R1 e Ajudante 3/R2. |
| 4. Cortes e reenvios | Os três saves começaram sem recibos e usaram as chaves do BE 110. Os cortes devolveram 500 e gravaram checkpoints em Ajudante 1 e Ajudante 2, com 0 e 18 atualizações acumuladas. Chave nova e corpo diferente devolveram os 409 acordados, preservando os checkpoints. Retomadas pela chave original e pelo POST de sessão chegaram ao mesmo estado e RNG do controle. Os três lotes de 54 atualizações tiveram a mesma ordem e conteúdo após normalizar IDs gerados e horários. A ação seguinte levou Lia à rodada 3. Dois reenvios simultâneos por save devolveram os corpos completos originais e preservaram o GET atual, a linha gravada, o RNG e os recibos. A perda de resposta usa `4-controle-perda.json`; o reenvio pela API na sessão atual devolveu o mesmo recibo com 54 atualizações. |
| 5. Sucessora e congelamento | Na Costa da Aurora, a nova ordem foi Ajudante 3 → Lia → Ajudante 2 → Ajudante 1. A resposta já estava na vez de Lia, rodada 1, com 3 PA. IDs e classes foram preservados, todos foram para `t91-next.harbor` com respawn nessa cidade e receberam +25 Pico e +10 ouro. A última dimensão congelou o save, retornou lote vazio e rejeitou a reabertura com `409 PARTY_FROZEN`. |
| 6. Prioridades | GET confirmou o padrão e a ausência em `limits`. PATCH aceitou a permutação com ouro primeiro e recusou duplicata com `400 LAB_CONFIG_INVALID/invalidPriorities`. O reset restaurou a configuração inicial integralmente. Os snapshots no PostgreSQL confirmaram a ordem padrão na campanha antiga e a alternativa na nova. |

O preflight do navegador respondeu 204 e autorizou `content-type,idempotency-key` na origem local do Vite. O schema do frontend aceitou 702 entradas de combate coletadas, incluindo reenvios. PostgreSQL e API de preparação permaneceram ligados.

Divergência operacional no `GET /health`: o esperado para a entrega é `contractVersion: "1.09"`; a API respondeu 200 com `{ "status": "ok", "contractVersion": "1.04" }`. O BE 110 já registrava o valor antigo. A verificação funcional usou a seção v1.09, e a cópia compartilhada local permanece em v1.08.

## Confirmação da correção no `/health` — 2026-11-27

- **Horas da sessão** — `null`
- **Verificação** — `GET http://127.0.0.1:3391/health` consultado diretamente na API, sem interceptação do MSW. A resposta foi HTTP 200 com `{"status":"ok","contractVersion":"1.09"}`, conforme esperado.
- **Resultado** — divergência encerrada. Os seis cenários funcionais já aprovados na revalidação acima completam a validação da FEAT-20. O PostgreSQL e a API de preparação permaneceram ligados durante a confirmação.
