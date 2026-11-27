# 145 — Validação integrada da FEAT-21

- Data — 2026-11-27
- Status — T-108 concluída
- Horas — null

Validação dos REQ-107 a REQ-109 em Chromium, com MSW desligado, contra `http://127.0.0.1:3391`. Foram usados os saves de entrega do devlog 113 do backend. O CONTRATO v1.14 registra a implementação da interface v1.13, confirmada por HTTP 200 em `GET /health`. O ROADMAP v1.00 vincula a entrega do backend à T-108.

A porta 5173 já servia uma instância apontada para outra API. A automação manteve a origem permitida pelo CORS e carregou os assets de uma instância separada na porta 5174, com `VITE_USE_MOCKS=false`. As requisições da aplicação foram à API real. A instância isolada do Chromium foi configurada para permitir o acesso ao loopback. As medições da interface usaram o tempo da requisição até `responseEnd`. As chamadas auxiliares de protocolo foram feitas por `fetch` no navegador e cronometradas até a leitura integral do corpo. Os tamanhos são em UTF-8, calculados sobre o corpo recebido e sobre `JSON.stringify(domainEvents)`. O traço indica campo ausente.

## Cenários

1. **Revisão e lote vazio.** O legado tinha 37 de ouro. Nos dois saves, a primeira abertura avançou de 1 para 2. A nova chave preservou 2 e ambos os POSTs devolveram lote vazio. O GET final preservou 2 e veio sem os dois lotes.
2. **Ordem e payloads.** A Carroça Abandonada apresentou antecipação, revelação, revés e encerramento. A Emboscada de Goblins apresentou as transições públicas contidas em `payload.update`. No nocaute de Lia, as quatro primeiras atualizações eram da ação humana e os índices automáticos de 4 a 43 apontaram para itens iguais em `combatUpdates`. O percurso entre a floresta e a cidade também foi renderizado no cenário 6.
3. **Virada de rodada.** A interface começou pelo Ajudante 1 na rodada 1. A ordem foi Ajudante 1 e 2 na rodada 1 e Ajudante 3 na rodada 2. O GET confirmou Lia e revisão 7, quatro acima da abertura. A ação da vez ficou indisponível durante a apresentação e voltou ao pular ou concluir a sequência.
4. **Checkpoint e perda.** Os três cortes devolveram 500 após o primeiro checkpoint. Uma nova ação recebeu `409 ACTION_ADVANCE_PENDING`. O reenvio com a chave original e a retomada por sessão recuperaram a ação. A sessão e o recibo da ação tinham o mesmo lote e revisão. Os reenvios paralelos devolveram os mesmos corpos, em ordem, com IDs únicos e estáveis. A perda do 200 foi simulada descartando a resposta. Em uma verificação adicional na interface, a resposta real de um recibo foi descartada antes de chegar à aplicação. O botão de retomada reutilizou a chave, confirmou a revisão 5 por GET e apresentou o lote recuperado.
5. **Recibo antigo.** A abertura e a ação originais continuaram nas revisões 3 e 7. A ação posterior e o GET chegaram a 11. Com as chaves originais registradas no armazenamento da sessão do navegador, o frontend consultou o GET e descartou o lote antigo. Uma nova abertura devolveu lote vazio. O recibo legado devolveu revisão 0 e lote vazio e a interface confirmou a revisão corrente 4.
6. **Dimensões.** O deslocamento foi de `base.misty-forest` a `base.harbor-town`. O fechamento `dimensionChanged` manteve a Costa Velha como origem. A sucessora abriu na ordem nova com o Ajudante 3 e devolveu a vez a Lia. Na última dimensão, o fechamento foi `frozen` e a ação da vez ficou indisponível. A chave original preservou o recibo, e uma nova recebeu `409 PARTY_FROZEN`.

As verificações previstas passaram. Os HTTP 500 e 409 acima correspondem aos resultados esperados. Na medição com o save `130b46f5-4f0f-4bcd-838e-623b08ac12de`, cada operação abriu cinco vezes de ajudantes distintos. O GET final confirmou Lia na rodada 2 com 3 pontos de ação e revisão 13. Os dois corpos e lotes tiveram os mesmos tamanhos e contagens do controle do backend. As durações foram coletadas em uma execução de cada operação.

## Evidência HTTP

| Operação | HTTP | Revisão | ms | Corpo (B) | Acontecimentos | Lote (B) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| M GET inicial | 200 | 1 | 26,9 | 14124 | — | — |
| M abertura Chromium | 200 | 7 | 488,4 | 72527 | 151 | 56951 |
| M endTurn Chromium | 200 | 13 | 559,8 | 61829 | 87 | 31297 |
| M GET final | 200 | 13 | 17,3 | 15459 | — | — |
| 1-legado GET inicial | 200 | 1 | 10,4 | 3535 | — | — |
| 1-legado abertura | 200 | 2 | 15,1 | 3577 | 0 | 2 |
| 1-legado nova chave | 200 | 2 | 41,4 | 3577 | 0 | 2 |
| 1-legado GET final | 200 | 2 | 9,1 | 3559 | — | — |
| 1-humano GET inicial | 200 | 1 | 10 | 7788 | — | — |
| 1-humano abertura | 200 | 2 | 15,9 | 7830 | 0 | 2 |
| 1-humano nova chave | 200 | 2 | 35,5 | 7830 | 0 | 2 |
| 1-humano GET final | 200 | 2 | 9,1 | 7812 | — | — |
| 2-evento abertura | 200 | 3 | 69,9 | 8187 | 10 | 2284 |
| 2-combate abertura | 200 | 3 | 35 | 17843 | 29 | 11904 |
| 2-combate-prefixo abertura | 200 | 2 | 16,8 | 5719 | 0 | 2 |
| 2-combate-prefixo startEvent | 200 | 3 | 43,9 | 5886 | 0 | 2 |
| 2-combate-prefixo revealEvent | 200 | 6 | 95,7 | 38728 | 49 | 19958 |
| 3-virada abertura | 200 | 3 | 58,5 | 10387 | 0 | 2 |
| 3-virada endTurn | 200 | 7 | 245,2 | 52815 | 75 | 27938 |
| 3-virada GET | 200 | 7 | 12,1 | 10777 | — | — |
| 4-acao abertura | 200 | 3 | 69,4 | 10385 | 0 | 2 |
| 4-acao primeira tentativa | 500 | — | 76,2 | 93 | — | — |
| 4-acao checkpoint | 200 | 5 | 12,4 | 10489 | — | — |
| 4-acao nova ação | 409 | — | 11,7 | 111 | — | — |
| 4-acao reenvio A | 200 | 7 | 223 | 52813 | 75 | 27938 |
| 4-acao reenvio B | 200 | 7 | 233,3 | 52813 | 75 | 27938 |
| 4-acao GET final | 200 | 7 | 10,2 | 10775 | — | — |
| 4-sessao-retoma-acao abertura | 200 | 3 | 15,5 | 10399 | 0 | 2 |
| 4-sessao-retoma-acao primeira tentativa | 500 | — | 82,8 | 93 | — | — |
| 4-sessao-retoma-acao checkpoint | 200 | 5 | 9,7 | 10503 | — | — |
| 4-sessao-retoma-acao nova ação | 409 | — | 10,6 | 111 | — | — |
| 4-sessao-retoma-acao retomada por sessão | 200 | 7 | 371,8 | 38743 | 75 | 27938 |
| 4-sessao-retoma-acao reenvio A | 200 | 7 | 12,3 | 52827 | 75 | 27938 |
| 4-sessao-retoma-acao reenvio B | 200 | 7 | 20,2 | 52827 | 75 | 27938 |
| 4-sessao-retoma-acao GET final | 200 | 7 | 10,3 | 10789 | — | — |
| 4-abertura-corte primeira tentativa | 500 | — | 79 | 93 | — | — |
| 4-abertura-corte checkpoint | 200 | 3 | 12,5 | 10294 | — | — |
| 4-abertura-corte nova ação | 409 | — | 10,5 | 111 | — | — |
| 4-abertura-corte reenvio B | 200 | 5 | 186,1 | 46860 | 94 | 35958 |
| 4-abertura-corte reenvio A | 200 | 5 | 194,4 | 46860 | 94 | 35958 |
| 4-abertura-corte GET final | 200 | 5 | 11,2 | 10886 | — | — |
| 4-abertura-resposta-perdida primeira tentativa | 200 | 5 | 255,3 | 46871 | 94 | 35958 |
| 4-abertura-resposta-perdida reenvio A | 200 | 5 | 14,9 | 46871 | 94 | 35958 |
| 4-abertura-resposta-perdida reenvio B | 200 | 5 | 23 | 46871 | 94 | 35958 |
| 4-abertura-resposta-perdida GET final | 200 | 5 | 10,8 | 10897 | — | — |
| 5-replay abertura | 200 | 3 | 57,8 | 10387 | 0 | 2 |
| 5-replay endTurn | 200 | 7 | 250 | 52815 | 75 | 27938 |
| 5-replay ação posterior | 200 | 11 | 344,9 | 51888 | 71 | 27010 |
| 5-replay GET | 200 | 11 | 10,4 | 10778 | — | — |
| 5-replay abertura antiga | 200 | 3 | 12 | 10387 | 0 | 2 |
| 5-replay ação antiga | 200 | 7 | 13,4 | 52815 | 75 | 27938 |
| 5-replay nova abertura | 200 | 11 | 54,8 | 10796 | 0 | 2 |
| 5-recibo-legado reenvio | 200 | 0 | 11,3 | 10848 | 0 | 2 |
| 6-sucessora-com-movimento GET inicial | 200 | 1 | 10,7 | 9909 | — | — |
| 6-sucessora-com-movimento abertura | 200 | 4 | 173,7 | 11296 | 5 | 887 |
| 6-ultima GET inicial | 200 | 5 | 9,2 | 10357 | — | — |
| 6-ultima abertura | 200 | 7 | 154,8 | 10609 | 2 | 337 |
| 6-ultima reenvio | 200 | 7 | 10,9 | 10609 | 2 | 337 |
| 6-ultima nova chave | 409 | — | 8,6 | 113 | — | — |

## Arquivos e verificações

Registro incluído no índice do devlog e T-108 marcada como concluída na SPEC-FRONTEND. A implementação do frontend e os documentos compartilhados não foram alterados nesta etapa. A evidência foi obtida com Chromium e API real, incluindo a apresentação até o fim com o relógio do navegador acelerado nos cenários 2, 3 e 6. Nenhuma pendência de validação encontrada.

