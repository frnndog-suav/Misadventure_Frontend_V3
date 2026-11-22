# 088 — Interface de nocaute e respawn da FEAT-14

- Data — 2026-11-21
- Status — interface concluída com MSW
- Retomada — devlog 087, T-68
- Contrato — v0.69, FEAT-14 acordada
- Spec — REQ-63 a REQ-65
- Horas — null

## Entrega

- `src/features/party/PartySession.tsx` oferece **Salvar ponto de respawn** pela projeção da vez. O pedido leva apenas o tipo da ação. A tela mostra a mensagem de recusa da API e conserva o último estado confirmado.
- A ficha do membro exibe queda, espera por recompensa, perda da próxima vez quando projetada e resumo persistido do último nocaute. Vida, Pico, Vigor, bolsa, cofre e vez jogável continuam vindo do estado da API. A resolução de recompensas usa o fluxo existente.
- `src/lab/LabPage.tsx` exibe os cinco ajustes de nocaute com os valores, limites e padrões retornados pela API. Salvar e restaurar reutilizam o formulário e o tratamento de erros por campo.
- `src/features/party/PartySession.test.tsx` e `src/lab/LabPage.test.tsx` cobrem a interface com as fixtures da T-68. O cenário de recusa intercepta a resposta para simular uma projeção que ficou desatualizada entre a exibição do botão e o envio.

## Verificação

A primeira execução confirmou a ausência do botão, da indicação de queda, do resumo e dos campos do laboratório. Após a implementação, passaram os oito casos novos e os 331 testes dos sete arquivos afetados. Passaram também `npm run typecheck`, `npm run lint`, a checagem de formatação dos arquivos TS/TSX, `git diff --check` e `npm run test:build`. O Vite emitiu um aviso de tamanho do bundle.

| Requisito | Cenário reproduzido pelos testes | Resultado esperado |
| --- | --- | --- |
| REQ-63 | Sair de Porto Cinzento, mover para Vila do Retorno, salvar, receber uma recusa, repetir e reabrir. | A cidade inicial e o ponto original aparecem ao entrar. A primeira gravação deixa 1 PA. A recusa preserva o saldo e o ponto. Repetir deixa 0 PA, oculta a ação e o ponto permanece visível ao reabrir. |
| REQ-64 | Sofrer derrota, doação fatal no evento ou fora de combate e Reflexão fatal. | Mostrar retorno, PV recuperados, perdas e a vez projetada. No exemplo da doação no evento, a bolsa fica em 29, o cofre em 80 e a rodada avança para 8. A doação fora de combate expira o status e libera a habilidade projetada. |
| REQ-64 | Fechar e reabrir a sessão durante a escolha após Reflexão ou após queda seguida de cura comum. | O membro continua caído com 0 PV. Resolver a escolha mostra o respawn e libera a vez jogável. Recarregar após o respawn mantém o resumo e os saldos. |
| REQ-65 | Consultar, salvar e restaurar. Como caso de borda, salvar vida de respawn em 0% e espera de 1,5 rodada. | Cada erro aparece junto ao campo correspondente. Uma edição válida de espera para 0 é aceita e a restauração volta ao padrão 1. |

## Retomada

A interface está pronta com MSW. A validação integrada aguarda a URL do backend com dados compatíveis com os cenários de referência do CONTRATO v0.69. Validar em frontend com MSW desligado e registrar os resultados antes de marcar a FEAT-14 como validada. A validação real do nocaute em grupo depende das FEATs 20 e 22. A spec lista a T-68 como a última tarefa numerada da FEAT-14.

## Validação integrada da T-68 — 2026-11-21

- Horas — null
- Ambiente — Google Chrome, frontend em `http://localhost:5173`, API em `http://localhost:3334`, MSW desligado e workers bloqueados no contexto de automação. `/health` retornou 200, `ok`, v0.65. Referência da rodada de testes: CONTRATO v0.69, FEAT-14 e devlog backend 064.
- As intenções e verificações de envelopes foram executadas via fetch no Chrome. As telas foram conferidas após as transições. A campanha do laboratório foi criada na UI e a restauração foi confirmada na UI.
- Nas três derrotas legadas, as ações reservadas foram executadas antes da inspeção de UI. Nos saves com ponto válido e ausente, o primeiro GET retornou `idle`. Para o ponto inválido, o Chrome enviou POST de sessão primeiro, em uma tentativa inicial na porta 5194 cuja resposta ficou inacessível pelo CORS. Na porta 5173, POST 200 precedeu o primeiro GET da campanha e mostrou o respawn persistido. A resposta da primeira tentativa ficou sem captura.

| Campanha | ID | Resultado |
| --- | --- | --- |
| salvar | `cce44605-b006-4785-b8c6-bb8c24e74859` | Movimento manteve Porto e deixou 2 PA. Gravações deixaram 1 e 0 PA. Terceira tentativa 409 `noActionPoints`; campo extra 400 `unknownKey` em `zoneId`. GET preservou o ponto e a tela ocultou a ação sem PA. |
| recusa-floresta | `66c238fe-e4d0-47f1-8fe7-3aa09b95fd0d` | 409 `zoneActionUnavailable`, ação ausente na tela, GET integral idêntico, inclusive `savedAt`. |
| doacao-tempo | `322fbffe-7e09-49c6-b416-e235980d8515` | Rodada 8, 3 PA, 2/21 PV, Pico 9, Vigor 4, bolsa 34 e cofre 80. Status expirou e Socorro de Campo voltou. Combate nulo no resumo e lote vazio. |
| doacao-encontro | `f81aa2a9-6609-4498-9ad7-3020d93c9541` | Revés `gaveUp`, recibos `attrs` e `life`, reposição 1/1, Destreza na mão, descarte de atributos cresceu para 1, Pico 8 e bolsa 29. Destino da carta no descarte da floresta pendente de snapshot. |
| cura-com-escolha | `03ff7adb-e837-45af-b21e-76972da75481` | GET e reabertura mantiveram 0 PV, rodada 6, 2 PA e a mesma escolha em `setback`. Deixar a picareta enviou ao limbo e concluiu com 2 PV restaurados, Pico 8 e bolsa 34. O envelope expõe os PV resultantes e não discrimina cada passo de cura. |
| derrota | `47cb222c-50ee-4db7-b9b1-4692232aa486` | `defeat/playerDown`, combate nulo, bolsa 29 e resumo ligado ao combate. Lote em ordem de início da vez inimiga, golpe fatal e fim do combate. |
| reflexao-automatica | `f23b496e-f0bc-4345-89fc-5ae7cbb45000` | Ataque com alvo e atacante a 0 PV, vitória `enemiesDefeated` com `playerDown: true`, picareta entregue e respawn imediato. Pico 10, Vigor 5 e PV 2/22, com `peakDelta: 1` na vitória. O cenário automático exige vitória, entrega e respawn na mesma resposta. |
| reflexao-com-escolha | `e61f7c1f-a3e9-4a5c-9cf9-6c8c9273690b` | Ataque, GET e reabertura mantiveram vitória, PV 0 e a mesma escolha. `resolveReward/leave` enviou a picareta ao limbo e recuperou na rodada 8 com 3 PA e resumo vinculado ao combate. Esperado no POST final: Pico 9, Vigor 4 e 2/21 PV. Observado: Pico 10, Vigor 5 e 2/22 PV, com `peakDelta: 1` no resultado final. |
| legado-vitoria | `b7b81331-bc99-4dd7-9d55-6a1fe3433cf3` | Escolha gravada preservada com 0 PV e 0 PA. Deixar recompensa manteve a vitória e avançou para rodada 8, 3 PA. |
| legado-derrota-salvo | `d5e7abaf-011e-4a76-90d2-12fe2120bbce` | Primeiro GET e repetição, com `idle`: Vila, rodada 8, bolsa 29, cofre 80 e derrota preservada. Esperado `availableActions: []`; observado `[move, recover, adjustDeck, useVault, endTurn]`. Reabertura conservou resumo e saldos. |
| legado-derrota-ausente | `2d57381c-3ca9-47d3-a5fd-1880fc09aa41` | Mesmo desvio no primeiro GET e repetição com `idle`, com retorno ao Porto Cinzento. Esperado `availableActions: []`; observado `[move, recover, adjustDeck, useVault, endTurn]`. Reabertura conservou resumo e saldos. |
| legado-derrota-invalido | `d89c7f17-75b0-4a14-a8e1-8f4214b642d9` | Reabertura antes do primeiro GET. POST acessível retornou Porto Cinzento, rodada 8, 3 PA, bolsa 29 e cofre 80. GET preservou o resumo. |
| espera-zero | `07e26e25-b868-4121-9cf7-ac62b4212077` | Doação Fatal retornou rodada 7, 3 PA, mesmas penalidades e status com `remaining: 1`. Esperado que Socorro de Campo ainda estivesse em recarga por uma rodada; observado `fixture.t68-field-aid` em `usableAbilities` no POST, elegível com `canPay: true`. |
| Laboratório | `794e0de3-ab3b-4e52-9c23-857093b25f26` | Cinco padrões e limites conferidos. PATCH inválido retornou os dois motivos previstos e deixou todos os valores iguais. PATCH válido gravou espera 0, criação via UI retornou 201 e reset na UI retornou 200 com `values` iguais a `defaults`. Comparação dos snapshots após reset pendente. |

O ID de `lastKnockout` e os saldos permaneceram estáveis nos GETs posteriores e reaberturas verificadas. Os GETs omitiram `combatUpdates`. O modo de leitura `snapshot` do preparador não encontrou `DATABASE_URL` no ambiente desta sessão. Falta comprovar a configuração persistida da campanha criada no laboratório, compará-la com a referência de espera padrão e conferir o descarte de floresta. FEAT-14 segue pendente de validação por causa das divergências e das verificações internas pendentes. Apenas este devlog foi alterado.

### Nova rodada com os seis saves do devlog 064

- Horas — null
- Chrome em `http://localhost:5173`, MSW desligado e API real em `http://localhost:3334`. A API respondeu `500 INTERNAL_ERROR` com a mensagem “Erro inesperado no servidor. Tente novamente.” na primeira resposta de cada campanha. As capturas de POST e GET da Doação Fatal e a conferência da habilidade na tela ficaram bloqueadas na leitura inicial.
- As primeiras requisições abaixo respeitaram a ordem dos saves legados. A abertura pela interface em modo dev emitiu dois POSTs de sessão para o save inválido, ambos antes de qualquer GET desse ID. A primeira resposta do POST retornou 500. O estado persistido após as tentativas precisa ser confirmado no backend.

| Campanha | Novo ID | Primeira ação | Esperado |
| --- | --- | --- | --- |
| legado-derrota-invalido | `57ca49e9-f1a1-4561-ba6d-a33775dcdd86` | POST de sessão antes do primeiro GET | 200, Porto Cinzento, rodada 8, 3 PA, bolsa 29 e cofre 80 |
| legado-derrota-salvo | `873e49ac-fd5d-473d-8d32-6698d19e7398` | GET em sessão inativa | 200, `idle`, Vila do Retorno e respawn aplicado uma vez |
| legado-derrota-ausente | `a37e89a4-7322-404b-b773-afd0ecff59a6` | GET em sessão inativa | 200, `idle`, Porto Cinzento e respawn aplicado uma vez |
| legado-vitoria | `2f2a88c2-43d2-4fcf-8c21-ee159389f124` | GET inicial | 200, 0 PV, 0 PA e escolha gravada |
| reflexao-com-escolha | `6f4486a5-b67a-4b07-b2c1-02f5a9f46a2f` | GET inicial antes do ataque | 200 com combate ativo para verificar vitória, escolha e respawn com Pico 10, Vigor 5 e 2/22 PV |
| espera-zero | `c7354898-2483-4ac7-83d6-c6d3469790f7` | GET inicial antes da Doação Fatal | 200 na rodada 6 para comparar o POST e o GET subsequente na rodada 7 |

Checagem independente após as falhas: `/health` retornou 200 com v0.65, enquanto `/lab/config` e a leitura de uma campanha prévia retornaram 500. O autor confirmou os snapshots do laboratório e dos descartes. As expectativas atualizadas do roteiro para Reflexão e projeção em `idle` foram registradas no devlog backend 064. A revalidação integrada permanece bloqueada pelas respostas 500.

### Revalidação integrada concluída — 2026-11-22

- Horas — null
- Chrome com frontend em `http://localhost:5173`, MSW desligado e API real em `http://localhost:3334`. Cenários e IDs da seção “Retorno integrado e nova rodada” do devlog backend 064. Os seis cenários passaram entre 09:05:25 e 09:06 (America/Sao_Paulo), sem retorno 500 nas operações verificadas. O health segue v0.65.

| Campanha | ID | Resultado |
| --- | --- | --- |
| legado-derrota-invalido | `57ca49e9-f1a1-4561-ba6d-a33775dcdd86` | POST de sessão executado antes de qualquer GET desta retomada. Retornou 200, Porto Cinzento, rodada 8, 3 PA, bolsa 29 e cofre 80. GETs preservaram o ID do nocaute, os saldos e a derrota. |
| legado-derrota-salvo | `873e49ac-fd5d-473d-8d32-6698d19e7398` | Primeiro GET em `idle` aplicou o respawn na Vila do Retorno. GET seguinte manteve `idle`; tentativa de ação retornou 409 `PARTY_SESSION_NOT_ACTIVE`. Reabertura e GET mantiveram resumo, saldos e derrota. |
| legado-derrota-ausente | `a37e89a4-7322-404b-b773-afd0ecff59a6` | Primeiro GET em `idle` aplicou o respawn no Porto Cinzento. GET seguinte manteve `idle`; tentativa de ação retornou 409 `PARTY_SESSION_NOT_ACTIVE`. Reabertura e GET mantiveram resumo, saldos e derrota. |
| reflexao-com-escolha | `6f4486a5-b67a-4b07-b2c1-02f5a9f46a2f` | Ataque, GET e reabertura preservaram vitória, a mesma escolha, 0 PV e 2 PA. Deixar a picareta enviou-a ao limbo, abriu a rodada 8 com 3 PA, Pico 10, Vigor 5 e 2/22 PV, com o combate no resumo. |
| legado-vitoria | `2f2a88c2-43d2-4fcf-8c21-ee159389f124` | GETs e reabertura mantiveram a escolha gravada, 0 PV e 0 PA. Deixar a recompensa abriu a rodada 8 com 3 PA e vitória preservada. |
| espera-zero | `c7354898-2483-4ac7-83d6-c6d3469790f7` | POST de Doação Fatal e GET seguinte retornaram rodada 7, 3 PA, status com uma rodada restante e somente `fixture.t68-donate` em `usableAbilities`. A tela exibiu Rodada 7, o bônus temporário de defesa e “Preparar habilidade · Doação Fatal”. Socorro de Campo ficou ausente no POST, no GET e na tela. |

A validação integrada solo da FEAT-14 está concluída. Os seis resultados acima atendem ao roteiro atualizado e os snapshots de laboratório e descartes foram confirmados pelo autor no PostgreSQL. A validação de nocaute em grupo segue vinculada às FEATs 20 e 22. Alterado apenas este devlog.
