# 151 — Validação integrada parcial da FEAT-22

- Data — 2026-11-27
- Status — T-112 em andamento
- Horas — null

Validação do pacote parcial da T-117 (devlog 124 do backend), com o CONTRATO v1.19 e a API real em `http://localhost:3333`. O HEAD do repositório do backend era `6dedd02`. O endpoint `GET /health` respondeu 200 e informou `contractVersion: "1.13"`. A confirmação da revisão do processo em execução veio da entrega do autor. O Chrome usou o frontend em `http://localhost:5173`, com `VITE_USE_MOCKS=false`. Antes das ações, os 17 GETs de save retornaram 200 nas revisões documentadas. Os percursos avançaram os saves de validação fornecidos.

| Cenário | Evidência observada |
| --- | --- |
| 1 | Elenco misto, lista vazia, recusa total e legado. A abertura, o evento, a confirmação quando aplicável e o combate retornaram 200. No misto (rev. 6), Lia e A1 subiram a 11 Pico e A2 e A3 ficaram a 10. Nos outros três, só Lia ganhou +1 Pico (rev. 6, 6 e 5, respectivamente). |
| 2 | A sessão e a resposta ao convite retornaram 200. Na aceitação, A1 manteve a vez de exploração, Lia atacou e ambos ficaram com 11 Pico (rev. 6). Na recusa, A1 terminou com 11 e Lia com 10 (rev. 5). |
| 3 | A confirmação retornou 200 nas duas ordens. A padrão terminou com vitória automática (rev. 6). Na alternativa, Lia atacou (rev. 7). Ambas exibiram +1 Pico para cada membro. |
| 4 | A fuga individual retornou 200 (rev. 7) e exibiu Lia com −2 Pico e −2 Vigor, e A1 com +1 Pico. O limite em Sem fuga retornou 200 (rev. 7), com ambos em 8 Pico e 8 Vigor. |
| 5 | Na vitória com Lia de pé (rev. 7), ela recebeu três cartas e ambos ganharam +1 Pico. Com Lia fugida (rev. 7), ela perdeu 2 Pico e recebeu zero cartas. A1 e A2 ganharam +1 Pico e receberam duas e uma cartas, respectivamente. As ações retornaram 200. |
| 6 | Os dois percursos da última dimensão congelaram na rev. 6. A interface exibiu +15 Pico para cada sobrevivente no chefe, −2 para Lia quando fugida e 15 de ouro final para cada membro. No save com saque, a opção Deixar enviou `resolveReward`, retornou 200 e congelou na rev. 7. |
| 7 | No controle, a abertura voltou com convite na rev. 3. O aceite na interface retornou 200, exibiu as ações de combate de Lia e manteve a exploração com A1. No save de reenvio, duas chaves simultâneas deram 200 e 409; os dois reenvios da vencedora deram 200; a chave nova deu 409 com `combatDecisionExpired`. O GET na rev. 4 confirmou A1 na exploração, Lia como atriz do combate e um novo ID de turno. A comparação textual dos reenvios com o 200 original encontrou diferenças. A igualdade dos valores do JSON ficou pendente. |

## Repetição do cenário 7

A API em `http://localhost:3333` respondeu `200` em `GET /health` com `contractVersion: "1.13"`. A revisão informada do processo é `6dedd02`, também confirmada como HEAD no checkout local do backend. O cenário usa o CONTRATO v1.19 e o catálogo `fixture.test-dimension` do devlog 124.

| Save | ID | Lia | A1 |
| --- | --- | --- | --- |
| Repetição HTTP executada | `89f6a96d-9843-4bd5-81ef-4d72b684d8d3` | `6e298820-c048-420f-afdc-0ecdc4e92b29` | `dac6e335-713b-4509-b5bc-46a0064aa451` |
| Novo checkpoint para repetir | `894015b3-f185-4e76-a547-932774d838e2` | `a530cc3e-c8ab-4ef1-801f-2588e730eb2d` | `7baecefb-f338-4101-8015-d757ccbf64fb` |

Os dois saves partiram da revisão 1 com rodada 1, A1 na exploração com 1 PA, ordem A1 → Lia, RNG `[0,0,0,10]` e ambos no Porto Cinzento (`fixture.gray-harbor`), com 10 Pico, 10 Vigor e 10 ouro cada. Lia tinha 21 PV, modificador de Celeridade +100 e uma poção de cura. A1 tinha 22 PV, modificador +10 e inventário vazio. A entrada é a abertura da sessão.

No save exercitado, duas chaves simultâneas para o aceite deram `200` e `409`. Os dois reenvios paralelos da vencedora e o reenvio após o ataque levar o save à revisão 6 deram `200`. Comparados recursivamente após análise do JSON, os três recibos foram iguais ao original da revisão 4, com a ordem das listas preservada e zero valores divergentes. Os três corpos diferiram como texto. Outra chave para o convite consumido recebeu `409`.

Depois do aceite, GET e sessão exibiram a mesma decisão de turno na revisão 4. A1 manteve a exploração e Lia recebeu a vez de combate com novo ID de decisão. O ataque de Lia encerrou o combate na revisão 6 com ambos de pé e +1 Pico por participante, sem Vigor, ouro ou cartas adicionais. Esse é o resultado esperado para o checkpoint novo ao repetir o mesmo percurso.

## Apresentação e controle do cenário 7

O backend confirmou no devlog 124 que controle e reenvio chegaram à revisão 6 com RNG `[0,0,10,11]` e atributos e inventários iguais. O cliente simulou a perda do 200 no serviço ao desconsiderá-lo no fluxo e guardar uma cópia para comparação. Os dois E2E de recuperação com falha injetada passaram conforme a entrega do backend.

No Chrome, usando `http://localhost:5173` com `VITE_USE_MOCKS=false` e a API `http://localhost:3333` (revisão informada `6dedd02`), o save `894015b3-f185-4e76-a547-932774d838e2` abriu na revisão 1. O aceite pela interface devolveu a revisão 4 com A1 na exploração e Lia no novo turno de combate. O ataque de Lia devolveu a revisão 6 com vitória. Para exercitar a recuperação no navegador, a ação de aceite foi recolocada no armazenamento da sessão com a chave original. Após recarregar, o botão Reenviar ação enviou a chave original à API e recebeu o recibo da revisão 4 com HTTP 200.

O convite e os controles de combate não reapareceram durante o reenvio. O relatório continuou mostrando vitória, ambos de pé e +1 Pico para cada um. A tela manteve a vez de exploração de Lia após o combate, ambos com 11 Pico, 10 Vigor e 10 ouro, a poção de Lia e o inventário vazio de A1. O GET após o reenvio confirmou a revisão 6, a mesma vez e os mesmos dados dos membros. Na primeira comparação textual, o rótulo do requisito da dimensão apareceu momentaneamente como reticências. Na repetição com o catálogo já carregado, o rótulo permaneceu visível antes e depois. O save exercitado está na revisão 6.

Continuam abertas as variações de serviço dos cenários 1 a 6 e a recuperação com falha injetada no serviço usado pelo frontend. A FEAT-22 segue acordada e a T-112 em andamento. Nenhum código foi alterado.

## Retomada com CONTRATO v1.20 e ROADMAP v1.09

- Data — 2026-11-27. Horas — null. T-112 em andamento, FEAT-22 implementado (BE), validação integrada parcial.
- Arquivos — cópias integrais de `docs/CONTRATO.md` e `docs/ROADMAP.md` vindas do backend, e este registro.
- Base — checkpoints reservados no devlog 124 do backend. API real em `http://localhost:3333`, com `http://localhost:3335` para sucessora e prêmio pendente. Ambos os GETs de saúde retornaram 200 com `contractVersion: "1.13"`. Vite em 5173 serviu o frontend com `VITE_USE_MOCKS=false`. As ações foram enviadas diretamente à API e os estados finais conferidos por GET. Os saves exercitados avançaram.
- Evidência de interface com MSW desligado — Chrome exibiu o relatório de ressurreição, a derrota por limite com nocaute e a etapa de missão concluída, com sessões HTTP 200 e os mesmos atributos individuais da API.

| Cenário | Checkpoint | Revisão final e evidência |
| --- | --- | --- |
| 1 | `cf59e07d-594d-47be-ac07-458cdbbc04f4` elenco | r6. A1 aceitou, A2 recusou e A3 ficou fora. Lia e A1 ganharam +1 Pico. Duplicata recebeu 409 `combatCandidateIneligible`, decisão reapresentada recebeu 409 `combatDecisionExpired` e tentativa tardia com ID distinto recebeu 409 `combatRecruitmentClosed`. |
| 1 | `120b36ba-20a8-4ec5-982a-486837a8b5d2` lista vazia, `4ea13fd8-b381-4699-8908-0c4bf5b976f5` recusa total e `4f9b1ec5-20eb-4a4b-b414-e98c250aee35` legado | r6, r6 e r5. Lia venceu solo com +1 Pico. |
| 2 | `eb1d8795-8735-476c-a7db-2f01010eafca` aceite | r7. GET e sessão concordaram sobre convite e novo turno de Lia, com A1 mantendo a exploração na pausa. Poção consumida na r5 sem mudar o ID do turno. Ambos 11 Pico. Corpo incompleto deu 400 `ACTION_INVALID`, ação comum deu 409 `combatDecisionPending` e ID vencido deu 409 `combatDecisionExpired`, mantendo r3 até o aceite. A variação com responsável incorreto depende de fixture própria. |
| 2 | `f9c004dc-4360-4e57-8924-b60949936717` recusa | r5. A1 venceu solo com 11 Pico. Lia manteve 10 Pico e a poção. |
| 3 | `71047283-7511-4168-a10e-1cd85944f824` padrão e `074707cd-48c5-49a5-940b-d61e6043c146` humano primeiro | r6 e r7. A1 iniciou no padrão e Lia na alternativa. Ambos ganharam +1 Pico nos dois. |
| 3 | `acdd643a-4ede-4300-ad83-e3e492a3b60e` recálculo padrão e `35c15b85-a721-49f6-89a0-83f3fd7b1b09` recálculo humano | r8 em ambos, todos com 11 Pico. Padrão projetou A1/inimigo/A2/Lia e depois inimigo/A1/A2/Lia. Alternativa projetou A1/inimigo/Lia/A2 e depois inimigo/Lia/A1/A2. |
| 3 | `3146a92d-9eee-40d6-a386-3120a02a5bf8` apenas IAs | r4. A1 abriu os dois encontros. A1 e A2 ficaram com 12 Pico e Lia, na Mina, com 10. |
| 3 | `88fd8f37-c727-41ce-8571-fd876ba8c831` ressurreição e `6b739de1-ca62-4238-aa85-a09c64fd6f23` respawn | r8 e r7. Ataque aliado recebeu 409 `combatTargetUnavailable`. A1 caiu e perdeu o turno de combate. Revivido, voltou com 11 PV, 11 Pico e vez de exploração mantida. Sem ressurreição, voltou à Mina com 2 PV, 9 Pico, 4 Vigor e perda da próxima vez. Lia com 11 Pico nos dois. |
| 4 | `8311cfca-c422-4a0e-aa1a-0eb7f5c15af0` fuga falha | r6. Lia gastou 2 Vigor, recebeu ataque livre e ficou com 8 Vigor. A1 venceu, ambos com 11 Pico. |
| 4 | `ff0d50ce-30b3-40c5-8d12-4467bd705cbe` fuga total | r6. Ambos fugiram com 8 Pico e 8 Vigor. |
| 4 | `e3e946e6-d7cc-49e7-9d46-0f88d1f762f7` fuga e derrota | r6. Lia fugiu com 8 Pico e 10 ouro. A1 caiu e voltou com 9 Pico, 4 Vigor e 5 ouro. |
| 4 | `99c8d9de-b323-4d26-acd7-a8f639cfb4a8` limite e `bebf9f8d-4a21-482c-b295-f7f1486437c0` limite com nocaute | r7 e r6. No primeiro, ambos fugiram com 8 Pico e 8 Vigor. No segundo, fuga manual recebeu 409 `escapeForbidden`. Lia terminou com 8 Pico, 3 Vigor e 10 ouro e A1 renasceu na Mina com 9 Pico, 4 Vigor e 5 ouro. |
| 5 | `5608127f-490e-4bc2-8e80-cf1156999eb6` iniciador de pé e `906fea40-0ead-4d77-8465-2a8d09eaeece` iniciador caído | r6 em ambos. De pé, Lia recebeu três cartas. Caída, ficou com 9 Pico e zero cartas. A1 e A2 receberam +1 Pico e 3 ouro cada. A1 recebeu poção e peixe, A2 recebeu minério. |
| 5 | `4cdddf46-89b6-498c-9353-8906001408d6` rodízio humano | r10. A1 fugiu. Lia e A2 ficaram com 11 Pico e 13 ouro. Lia terminou com 8 Vigor. A poção abriu pausa na r6, A2 recebeu minério depois da primeira escolha, e o peixe abriu segunda pausa para Lia na r7. Lia deixou as duas cartas. A contagem interna do baralho ficou sem evidência direta. |
| 5 | `b8113ab3-85e0-4529-90e1-0b981685dcc2` missão vitória, `43ec92fd-4a9e-4d1e-8fb8-8774aa184972` missão fuga e `24e336fb-ce4d-4489-ba2c-5a0e215f9e24` missão derrota | r5 nos três. Vitória de A1 após fuga de Lia marcou a etapa `completed` (Pico 8/11). Fuga coletiva (8/8) e derrota (9/9 Pico e 5/5 ouro) devolveram a etapa a `ready`. |
| 5 | `0a7fb1d7-6aa6-4c8e-9273-d612f794bd62` reflexão solo e `60d07c03-35a8-4ca7-9c6d-73f1cd66a9a8` reflexão em grupo | r7 e r5. Lia venceu e voltou com 2 PV. Solo terminou com 17 ouro e três cartas. Grupo terminou com A1 fugido, ambos com 10 ouro, sem entrega de saque, e etapa `completed`. A contagem interna do baralho ficou sem evidência direta. |
| 6 | `03db4c5a-be53-46ad-bbed-2618b58b076a` iniciador de pé e `6a4b1857-bbfc-4595-94ad-7d0f1e05f46f` saque pendente | r5 e r6. Ambos os saves congelaram com Lia e A1 em 50 Pico e 15 ouro. No segundo, deixar a poção preservou o minério de Lia. |
| 6 | `69c2c27e-398a-455c-96bc-6a44cc65117a` reflexão | r5 congelado. Lia caiu por Reflexão e A1 fugiu. Ambos ganharam 25 Pico de conclusão e 5 ouro, terminando com Pico 34/33 e ouro 15/15. |
| 6 | `7736a43c-4b27-4186-b2a2-012c27818863` sem vitória | r5. Fuga manual recebeu 409 `escapeForbidden`. Lia caiu, A1 fugiu no limite, dimensão aberta e fragmento preservado. |
| 6 | `a2b23835-5615-4b70-8432-81e663ad5901` saque com respawn | r7 congelado. A1 permaneceu no Porto com 0 PV na r6 durante a escolha. Deixar a carta moveu A1 à Mina. Pico/ouro final de Lia 50/22 e de A1 34/15. |
| 6 | `aa36bad9-21a9-4491-b93e-5e43fd90fbff` sucessora | r5 em 3335. Lia fugiu, A1 derrotou os dois chefes. Pico 33/65, ambos com ouro 15 e uma poção na Segunda Dimensão. |
| 6 | `2f88c12b-65c9-4576-a99d-77af2869fd9b` prêmio pendente | r5 em 3335 com a Segunda Dimensão já aberta e poção pendente para Lia, `source.type: grandPrize` e `origin.type: fixed`, conforme o schema. Deixar passou à r6, preservou o minério de Lia, a poção de A1 e a conclusão registrada. Ambos com Pico 50 e ouro 15. |

### Percursos a repetir

Nos três saves abaixo, a execução selecionou a ordem padrão e A1 encerrou o combate antes de Lia poder fugir. A confirmação de ordem recebeu 200. O desvio é do roteiro de execução e exige novos checkpoints para repetir estas variações.

| Save | Ação prevista | Esperado | Observado |
| --- | --- | --- | --- |
| `c948ef08-d2b6-4849-8b70-9276544abfe0` 4-fuga-do-iniciador | Priorizar Lia e fugir | Lia perde 2 Pico e 2 Vigor, A1 ganha 1 Pico | r6, A1 venceu antes da fuga, ambos com 11 Pico e 10 Vigor |
| `8367b394-ff99-4b2f-ad8f-4eb72ed157ce` 5-iniciador-fugido | Priorizar Lia e fugir | Lia fica com 8 Pico e zero cartas, A1 recebe poção e peixe e A2 recebe minério | r6, A1 venceu antes da fuga, Lia ganhou 1 Pico e recebeu as três cartas |
| `e658690a-3f36-4e78-94c7-9ace356ccb1e` 6-iniciador-fugido | Priorizar Lia e fugir | Lia perde 2 Pico, A1 ganha 15 Pico de combate e ambos recebem prêmio de conclusão | r5 congelada, A1 venceu antes da fuga e ambos terminaram com 50 Pico e 15 ouro |

O cenário 7 tem evidência anterior de recuperação pela interface e reenvio HTTP com o mesmo recibo JSON. A injeção real de falha no frontend permanece pendente. A porta 3334 recusou conexão e o checkpoint injetado `de42b77e-f09e-41ba-876e-eb9c1a7457f9` consta consumido na r5 no devlog 124. A expectativa é HTTP 500 com avanço persistido antes do convite e após a gravação da recusa, seguido de recuperação com a chave original. A T-112 continua aberta.

No Chrome, a sessão dos dois saves com sucessora respondeu 200 na porta 3335 e exibiu a Segunda Dimensão, os valores finais de Pico e ouro e, no save do prêmio pendente resolvido, o minério preservado. Para esta conferência, o navegador apontou temporariamente o módulo HTTP para 3335. A reabertura de 6-saque-com-respawn pela porta 3333 recebeu 409 e exibiu a mensagem de save congelado. A verificação da interface ocorreu após as ações HTTP, sem repetir as escolhas já consumidas.

## Repetição dos cinco checkpoints do complemento do devlog 124

- Data — 2026-11-27. Horas — null. T-112 aberta e FEAT-22 implementado (BE).
- Base — seção «T-112 — retorno parcial e checkpoints para repetição» do devlog 124, CONTRATO v1.20, ROADMAP v1.09. APIs reais, MSW desligado. As três fugas tiveram Lia no primeiro turno após confirmar o recrutamento.
- Arquivo atualizado — este devlog. Verificações por POST e GET, com captura das requisições reais no Chrome para a injeção. O navegador recebeu temporariamente a URL de 3334 nos módulos servidos pelo Vite, sem alteração do frontend.

| Percurso | Save | Ações, HTTP e resultado |
| --- | --- | --- |
| 2-responsavel-incorreto | `03f78616-09ce-4301-9485-0abe996adb6a` | GET 200 r3, convite corrente e exploração de A1. `respondCombatInvite` como Lia com `accept: true` e IDs correntes devolveu 409 `ACTION_NOT_ALLOWED`, `details.reason: combatDecisionNotOwned`. GET 200 confirmou r3 e igualdade integral do JSON com o snapshot inicial, incluindo convite e poção. |
| 4-fuga-do-iniciador | `056e8fd9-a396-4132-b865-b329cde48d65` | GET r1, sessão r2, iniciar evento r3, revelar r4, confirmar A1 r5, fuga de Lia e GET final r6, todos HTTP 200. A1 venceu com 11 Pico e 10 Vigor. Lia ficou com 8 Pico e 8 Vigor. |
| 5-iniciador-fugido | `01379d45-6907-476a-b735-166b513dbc58` | GET r4, confirmar A1 e A2 r5, fuga de Lia e GET final r6, todos HTTP 200. Lia ficou com 8 Pico, 8 Vigor e inventário vazio. A1 e A2 ficaram com 11 Pico. A1 recebeu poção e peixe, A2 recebeu minério. |
| 6-iniciador-fugido | `da4a494d-d39b-454f-b48b-d0412126c1fd` | GET r1, sessão r2, iniciar conclusão r3, confirmar A1 r4, fuga de Lia e GET final r5, todos HTTP 200. A1 ganhou 15 Pico de combate. Ambos receberam 25 Pico de conclusão e 5 ouro. Save congelado, Pico 33/50, Vigor 8/10 e ouro 15/15. |
| 7-injecao-browser | `43d2854a-c99a-4c3b-a9f2-381603896cce` | GET inicial r1. Em 3334, POST de sessão recebeu 500 `INTERNAL_ERROR`. Retomar sessão reenviou sem corpo e com a chave original `b186e75b-4744-41c4-930e-fb3819abb672`, recebendo 200 r3 com convite. Recusar convite recebeu 500 `INTERNAL_ERROR`. Reenviar ação preservou o JSON com `accept: false`, os IDs correntes e a chave original `7d89ba7a-a563-48a5-b6cc-9cbae849ad3c`, recebendo 200 r5 com vitória solo de A1. |

Os dois HTTP 500 devolveram somente o envelope de erro, sem revisão no corpo. O GET final retornou 200 r5 com A1 em 22 PV, 11 Pico, 10 Vigor e 10 ouro, inventário vazio. Lia manteve 21 PV, 10 Pico, 10 Vigor, 10 ouro e uma poção. O convite estava encerrado. O recibo de recuperação foi capturado no clique de reenvio. A primeira checagem de texto exato na tela expirou porque o relatório inclui o sufixo «Pico +1». A conferência da apresentação foi feita na reabertura do mesmo save e exibiu «Vitória · inimigos derrotados · Pico +1». Nenhuma divergência funcional nos cinco percursos.


## Resultado final da T-112

- Data — 2026-11-27. Horas — null. T-112 concluída. FEAT-22 permanece `implementado (BE)` até a confirmação final.
- Base — CONTRATO v1.20, seção FEAT-22, e ROADMAP v1.09. Conferência cruzada com o devlog 124 do backend e o commit `027b7aa`.
- Alterações — conclusão da T-112 na SPEC-FRONTEND e no índice do devlog. A validação não exigiu mudanças no código.

| Cenário | Evidência de fechamento |
| --- | --- |
| 1 | Elenco misto no limiar de PV, custo do iniciador, solo legado, lista vazia, recusa total e recusas HTTP de recrutamento. |
| 2 | Aceite e recusa, recuperação da decisão por GET e sessão, ativação no mesmo turno e recusas sem mutação. A última rodada confirmou responsável incorreto com 409 e snapshot intacto. |
| 3 | Ordens padrão e alternativa, recálculo entre ciclos, combate só de IAs, ressurreição e respawn. |
| 4 | Fuga falha, individual, coletiva e seguida de derrota, além de limite em Sem fuga com e sem nocaute. |
| 5 | Saque com iniciador de pé, caído ou fugido, rodízio com inventário cheio, missões e Reflexão fatal. O devlog 124 fornece a evidência do baralho no PostgreSQL durante as pausas e na Reflexão em grupo. |
| 6 | Bônus por chefe, conclusão e congelamento, sucessora, prêmio pendente, Reflexão, desfecho sem vitória e saque resolvido antes do respawn. |
| 7 | Concorrência, igualdade integral dos recibos JSON, comparação de estado e RNG com controle e recuperação em Chrome com MSW desligado após os dois HTTP 500. Os registros do serviço complementam o navegador com recuperação por sessão e 409 durante o avanço. |

Nesta retomada, a API real em 3333 respondeu 200 em saúde (versão anunciada 1.13) e nos sete GETs de conferência. Os cinco checkpoints ficaram nas revisões esperadas: r3 com convite, r6, r6, r5 congelado e r5 com convite encerrado. Rodízio e Reflexão em grupo permaneceram nas revisões r10 e r5. Os POSTs dos percursos já estavam registrados e os checkpoints de execução que avançam estado já haviam sido usados. Nenhum percurso ficou pendente após a conferência das evidências de HTTP, interface e persistência.
