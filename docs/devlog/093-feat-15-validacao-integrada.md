# 093 — Validação integrada da FEAT-15 (solo)

- Data — 2026-11-23
- Status — FEAT-15 `validado` no recorte solo
- Retomada — devlogs 091 e 092; backend T-60, devlog BE 072
- Contrato — v0.77 recebido do backend (`implementado (BE)`, sem mudança de formato) → v0.78 `validado`
- Roadmap — v0.67 recebido → v0.68 (FEAT-15 `validado` | `validado`)
- Spec — REQ-66 a REQ-70; nenhuma mudança na spec (não há tarefa de validação numerada para a FEAT-15)
- Horas — null

## Objetivo

Rodar os cenários da seção FEAT-15 do contrato contra o backend real com o MSW desligado e marcar a FEAT como validada (skill `/retorno-backend`, passo 4). Nenhum código de `src/` mudou.

## Ambiente

- API em `http://localhost:3333`, `GET /health` → `{"status":"ok","contractVersion":"0.77"}`. Coleção `fixture` do catálogo temporário da T-60: "Porto" = Porto Cinzento (`fixture.gray-harbor`), mapa com só Porto Cinzento ↔ Mina Antiga (`fixture.old-mine`, Florestal); Mago (1 essencial, Sabedoria) e Cavaleiro existem só nesse catálogo.
- Os IDs das campanhas não vieram com o aviso. Foram tirados de `GET /parties` pelo nome "T-60 — <campanha>". Há **dois lotes**: 13:50:04 (intactos, `savedAt ≈ createdAt`) e 13:50:32 (já percorridos pelo próprio backend). A validação usou o lote intacto.
- Chamadas HTTP: scripts Node com `fetch` no scratchpad da sessão (não versionados), um por bloco de campanhas, com cada resposta gravada.
- Telas: `npx vite --port 5173 --strictPort` com `.env.development.local` (`VITE_USE_MOCKS=false`, `VITE_API_URL=http://localhost:3333`), conferidas com Playwright no Google Chrome (`chromium.launch({ channel: 'chrome' })`, porque o headless shell do Playwright não está instalado).

## Resultados por campanha

| Campanha | ID | Resultado |
| --- | --- | --- |
| quadro | `0ee36f74-8cd0-4434-a12e-dad45029dc12` | `takeQuest` Entrega → 200, 2 PA, quadro `[clue, herbs, escort]` (Ervas veio do topo do deck), missão com destino `zoneTitle` Porto Cinzento. `finishQuest` na Mina → 409 `questWrongZone` com `questId`; GET igual, mesmo `savedAt`. Mover e finalizar → 200, 0 PA, missão removida, Pico 10→13 (padrão de zona), `pendingRewards[0].source = {type:'quest', questId, questCardId:'fixture.t60-delivery'}`. GET mantém. `leave` → 200, conclusão preservada. |
| abandono-cheio | `2dacfea1-f59f-478a-8319-07c10bcda9b4` | `abandonQuest` com 0 PA → 200, 0 PA, quadro cheio continua `[clue, herbs, escort]`. |
| abandono-vazio | `84ccbed0-f8ad-41ee-a4f4-6f5e5591cf6b` | `abandonQuest` com 0 PA → 200, Entrega volta para a vaga: `[clue, delivery, escort]`. Encerrar e reabrir a sessão preserva. Após `endTurn`, aceitar de novo → 200 com novo `questId`, etapa 0 `ready`. |
| limite | `b2a1c9d0-83a0-4ade-acf2-ff90fa4d5bca` | Três missões de zona abertas; `takeTrialQuest` → 409 `questLimitReached` com `classId` e `specializationId`; `savedAt` igual. |
| provacao | `362e5579-6c6f-4090-a2c3-202124526f28` | `takeTrialQuest` knight → 200, 1 PA gasto, contadores 0/3 e 0/3. Evento `fixture.t60-toll` pago → já no 200 do pagamento, com recompensa pendente, `randomEventSuccesses` 1 na provação **e** na missão de zona. GET e `resolveReward` preservam 1. `finishQuest` cedo → 409 `questObjectivesIncomplete`; segunda genérica → 409 `genericQuestAlreadyOpen`. |
| vitoria-reflexao | `c314c414-ddb2-4487-b99e-a7c3ea69837a` | `continueQuest` → combate; ataque com reflexão fatal → `victory`, `playerDown: true`, etapa `completed`, provação continua 1 vitória. Respawn na mesma resposta (rodada 8, 3 PA, `lastKnockout` ligado ao combate). |
| vitoria-de-pe | `47a682e2-fed2-42dc-9fae-705c48700c43` | Vitória de pé → etapa `completed`, provação 1→2, `finishQuest` passa a ser oferecida. |
| derrota | `1d4227f1-a6f1-4f6f-b4ee-6110120c02d0` | **Save intacto consumido por erro do roteiro:** o script atacou primeiro e o jogador (Celeridade 100) venceu de pé. Resultado coerente com a regra (etapa `completed`, provação 1→2), mas não exercita a derrota. |
| derrota (lote 13:50:32) | `0ed8c424-64b6-42cc-b8cc-987471158c72` | Já derrotado pelo backend, com a etapa de volta a `ready`. Mover à Mina, `continueQuest` (nova tentativa) e `endCombatTurn` → `defeat`/`playerDown`, etapa volta a `ready`, provação continua 1, respawn no Porto. Cobre derrota e nova tentativa. |
| sequencia | `61f05217-6110-4e7a-9090-2a21fa91292a` | Idêntica à tabela "Tentativa e entrega em sequência": PA 3→2 (encontro), pagamento → etapa 0 `completed` com `questChoices: []` e recompensa pendente; `leave` → continuar/abandonar; continuar → etapa 1 `ready` com 1 PA; continuar → combate; vitória → só abandonar (0 PA); `endTurn` → finalizar; finalizar → 2 PA, missão removida, ouro +5, Pico +3. |
| concessoes | `7c1ba5ca-af69-4a96-acd2-71606b509efe` | Finalizar provação → 200, Pico 30→35 (genérico 5), Cavaleiro `deckLockMet: false`. `adjustDeck` Resistência 14 / Força 40 / Sabedoria 6 → Guerreiro e Cavaleiro `true`, modificadores do Guerreiro. Reabrir preserva. |
| mentor-aceite | `a8f9e301-0cc2-4647-bd26-a939f12a95fd` | `trainWithMentor` mage com 2 PA e 200 ouro → 0 PA, 50 ouro, metas 5/5. Abandonar mantém 50. Na vez seguinte, de novo → 409 `notEnoughGold`. |
| mentor-concessao | `26883b2d-b898-4b3d-a98e-ae25928121bd` | Finalizar → Mago inativo, Pico +5, capacidade do inventário igual (1). Builds: ativa as duas → modificadores do Guerreiro; só Mago (Força 9) → os do Mago; nenhuma → padrões do laboratório. Reabrir preserva classes, ordem e travas. |
| legado | `e8e16818-0b30-4405-a007-809cf39686e3` | Quadro, missões, escolhas e especializações vazios; reabrir e mover funcionam. |
| laboratório | — | `questBoardSize` 3/3, limites 1–50. PATCH 0 → 400 `outOfRange`, nada muda. PATCH 4 → 200 (padrão 3). Reset → `values` = `defaults`. |
| editor | — | Rascunho `fixture.fe-validacao-porto` → 201. PUT com `eventCardId` de combate → 400 no path `stages.0.eventCardId`; com título inexistente → 400 em `stages.0.location.title`, com os textos do contrato; a carta gravada não muda. Rascunho apagado (204). Publicação e `validate-dimension` com título duplicado não rodaram, para não mexer no catálogo publicado. |

## Telas (MSW desligado)

- `/grupo/f30a2256-…` (vitoria-de-pe do lote 13:50:32): quadro com três ofertas e botões "Aceitar … · 1 PA"; aceitar Pista no Porto repõe o quadro com Ervas e a missão aparece com "Destino: Porto Cinzento"; "Finalizar Caça Simples · 1 PA" remove a missão. Contadores da provação ("Vitórias de pé: 2/3") visíveis.
- Provação (`14ff25e5-…`): os dois contadores em 1/3. Ficha do mentor-concessao: "Classe: Mago (trava não cumprida)" e "Especialização: Cavaleiro · Guerreiro".
- `/lab`: campo "Vagas no quadro de missões". `/lab/editor`: nova "Missão de zona" com `fixture.howling-wolves` → POST 400 e a mensagem no `aria-describedby` do campo "ID do evento da coleção"; trocar por `fixture.wounded-traveler` → 201, "Rascunho salvo.". O rascunho `fixture.fe-validacao-ui` foi apagado depois (204).
- 36 chamadas à API na rodada do grupo, todas 2xx.

## Arquivos

- `docs/CONTRATO.md` — v0.78: linha 0.77 do backend, seção FEAT-15 `validado`, histórico 0.78.
- `docs/ROADMAP.md` — v0.68: FEAT-15 `validado` | `validado`, linhas 0.67 e 0.68.
- `docs/devlog/093-…` (esta entrada), `docs/devlog/README.md` (índice), `docs/devlog/tempo.html` (sessão).

## Como verificar

```
curl http://localhost:3333/health
curl http://localhost:3333/parties/61f05217-6110-4e7a-9090-2a21fa91292a
```

O segundo deve mostrar a sequência concluída (sem missões abertas, ouro 41, Pico 15). Com `.env.development.local` desligando o MSW, `npm run dev` e abrir `/grupo/<id>` de uma campanha do lote 13:50:32 mostra quadro e missões vindos da API.

## Checks

Nenhum código mudou; testes, lint e tipos não foram rodados nesta etapa (última suíte: 885 testes, devlog 092).

## Backend

Nenhuma pendência para o backend: o resultado volta ao backend pela cópia do CONTRATO v0.78 e do ROADMAP v0.68 (`/retorno-frontend` na T-60). Observação para o backend: a campanha `derrota` intacta foi consumida com vitória; a derrota foi conferida no save do lote já usado.

## Commit sugerido

`docs/validate feat-15 solo against real backend`
