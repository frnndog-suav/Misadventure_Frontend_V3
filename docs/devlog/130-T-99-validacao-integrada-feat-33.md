# 130 — T-99 — Validação integrada da FEAT-33

- Data — 2026-11-26
- Status — cenários HTTP e verificações dos saves aprovados
- Horas — null
- Referência — CONTRATO v1.03, ROADMAP v0.91, REQ-97 a REQ-101 e devlog backend 104 (T-87)

## Resultado por cenário

As ações foram enviadas diretamente à API local em `http://localhost:3333`, sem MSW e usando os grupos novos da tabela de entrega. A consulta ao Postgres usou uma sessão somente leitura.

| Cenário | Campanha | Esperado | Observado |
| --- | --- | --- | --- |
| Catálogo e editor | — | Listas vazias na carta legada e listas próprias na configurada. | Catálogo e editor retornaram `[]` e `[]` para `fixture.test-dimension`, e `[fixture]` e `[reprint]` para `current.dimension`. |
| Validação do editor | — | Import inválido com 400 e caminho indexado. | `CONTENT_INVALID` para inexistente, sem dimensão publicada, ordem igual, posterior e própria em `cards.2.card.extendedCollectionIds.0`, duplicada em `cards.2.card.extendedCollectionIds.1` e sobreposta em `cards.2.card.reprintCollectionIds.0`. |
| Proteções do editor | — | Exclusão e substituição que invalidem referência retornam 409. Conteúdo do save também é protegido. | DELETE da dimensão e da coleção, PUT que aumenta a ordem e import com substituição retornaram `409 CONTENT_REFERENCED` nas coleções descartáveis. Import tentando remover `reprint.single` retornou `409 CONTENT_IN_USE`. As três coleções descartáveis foram removidas com 204. |
| Oferta e compra | `76e0541d-1b43-4157-b839-1a151810af67` | Booster de cada coleção vigente, a 30 ouro. | `current.booster`, `fixture.booster` e `reprint.booster`, nessa ordem, entregues ao inventário, com saldo de 60 ouro e 2 PA. |
| Recusa atômica | `f41cdaaa-2c82-4ccc-b355-f1ce8be40f45` | Single seguido de booster fora da oferta retorna 409 no índice 1 e preserva o grupo. | `ACTION_NOT_ALLOWED`, `notMarketBooster`, `archive.booster`, índice 1. GET integral idêntico. Em nova tentativa, o JSON do save antes e depois também foi idêntico, incluindo os dois singles com zero saídas, uma cópia de cada em estoque e RNG `[0,0,0,10]`. |
| Singles | `3a75b2e2-6c2c-445a-98b3-27012db5fb83` | Duas compras no slot 0, reposição e renovação do pool. | `reprint.single` e `fixture.strength-basic` na pasta de TCG por 5 ouro cada. O pool renovado teve 20 IDs únicos, das origens `current`, `fixture` e `reprint`. |
| Preparar | `910eccfa-a520-4a1e-a380-e38c377b436b` | Abre booster reimpresso preservando IDs, raridades e destinos. | `reprint.single` comum nas posições 1–5 e 7 na pasta de TCG. `reprint.rare` rara nas posições 6 e 8 no inventário. |
| Usar cofre | `76a9f444-bbcb-40da-a412-338330e11bff` | Abre booster fora da oferta com todas as cartas no cofre. | `archive.single` comum nas posições 1–5 e 7, `archive.rare` rara nas posições 6 e 8, todas no cofre. |
| Save legado | `b70f0495-cc78-45aa-9e65-3ae02c5321f2` | Só booster próprio, vitrine preservada e nova vigência ao passar. | Inicialmente só `current.booster` e `reprint.single` no slot 0. Após a passagem, vigência gravada `[next, archive]` e a mesma vitrine do caso Passagem. |
| Passagem | `4343c014-d0f8-4aa5-be1b-d2a82fc45a35` | `next.dimension` e oferta e pool da nova vigência. | `next.city`, oferta `archive.booster` e `next.booster`. Vigência gravada `[next, archive]`. Vitrine com `archive.single`, `archive.rare`, `next.single` e `next.rare` nos slots 0–3. Os mesmos quatro IDs no pool. |
| Vigência após edição | `e35aee63-af48-4784-9c40-c045c47608a3` | Oferta e pool renovado usam vigência gravada após edição. | Editado para extensão vazia e reprint `[archive]`. Nova leitura manteve os três boosters originais. Duas compras renovaram o pool para 20 IDs únicos de `current`, `fixture` e `reprint`. PUT de restauração confirmado por GET do editor com `[fixture]` e `[reprint]`. |

O pool sorteado original do grupo de singles havia sido substituído pelo pool controlado na preparação entregue. A evidência para o sorteio inicial desta rodada vem dos dois pools formados na passagem para `next.dimension`. A API respondeu `status: ok` em `/health`, com `contractVersion: 0.93`. Os cenários foram avaliados pelos comportamentos da v1.03. API e Postgres permaneceram ativos.

## Arquivos

- `docs/CONTRATO.md` e `docs/ROADMAP.md` copiados integralmente do backend.
- Este registro e seu índice no devlog.

No Edge com MSW desligado e frontend em http://localhost:5173, a sessão real mostrou três ofertas de 30 ouro, as cartas entregues nos fluxos de Preparar e Usar cofre e Porto next após a passagem. As ações da rodada e os comprovantes de abertura foram verificados via HTTP.
