# 071 — RETORNO: FEAT-11 recebida, validação integrada pendente

- **ID:** RETORNO · **FEAT:** FEAT-11 · **Data:** 2026-11-19
- **Status:** aguardando revisão · **Spec:** v0.69 · **Contrato:** v0.52 · **Roadmap:** v0.54

## Objetivo

Receber a entrega do backend e verificar as condições para validar a FEAT-11 em `http://localhost:3333`, seguindo `/retorno-backend`.

## Decisões

Copiadas integralmente as versões recebidas do repositório do backend, conforme pedido do autor. O contrato muda FEAT-11 de `acordado` para `implementado (BE)`, sem novos tipos em relação à v0.51; esclarece `initialGold: 0` no cenário do amuleto da FEAT-32. O roadmap informa BE `pronto` e FE `a fazer`. Nenhuma versão adicional criada, pois são cópias dos documentos recebidos.

A validação integrada não pode ser concluída: a spec ainda não planeja a FEAT-11; `src/api/catalog.ts` usa `RuleText` nos efeitos; `src/api/parties.ts` não modela `statuses` nem `activatableEffects`, e `PrepareAction` só permite `equip` e `unequip`. Não existem cenários e2e de ativação/status. Não implementar a feature dentro deste retorno nem marcar `validado` com base apenas em HTTP.

## Passos e comandos

- Leitura de `CLAUDE.md`, skills `retorno-backend` e `registrar-etapa`, índice e última entrada do devlog.
- `git diff --no-index docs/CONTRATO.md D:/Github/misadventure_backend/docs/CONTRATO.md`
- `git diff --no-index docs/ROADMAP.md D:/Github/misadventure_backend/docs/ROADMAP.md`
- `git log -5 --oneline -- docs/CONTRATO.md docs/ROADMAP.md`
- `Copy-Item -LiteralPath D:/Github/misadventure_backend/docs/CONTRATO.md -Destination docs/CONTRATO.md`
- `Copy-Item -LiteralPath D:/Github/misadventure_backend/docs/ROADMAP.md -Destination docs/ROADMAP.md`
- `Invoke-RestMethod http://localhost:3333/health`
- `Invoke-RestMethod http://localhost:3333/catalog/collections`
- `Invoke-RestMethod http://localhost:3333/catalog/cards/fixture.healing-potion`

## Arquivos

Alterados `docs/CONTRATO.md`, `docs/ROADMAP.md`, índice do devlog e `tempo.html`; criada esta entrada. Código e configuração local preexistente não alterados.

## Checks e problemas

Três consultas HTTP concluídas: health `ok`, `contractVersion: "0.52"`; coleção `fixture` presente com 24 cartas (4 zonas, 3 atributos, 7 equipamentos, 7 itens, 1 evento aleatório, 1 combate, 1 dimensão); poção com efeito exatamente conforme o cenário (`consumeSelf`, `heal` 5, `immediate`, `trigger`/`mark` nulos).

Demais cenários da FEAT-11 não executados. App e e2e contra backend real não executados por ausência da implementação frontend da feature. Nenhuma divergência do backend observada nas três consultas; isso não valida os demais cenários.

## Como verificar

Repetir as três consultas acima. Próximo passo recomendado: `/mudar-spec FEAT-11`, implementar as tarefas resultantes uma por vez, então repetir `/retorno-backend FEAT-11` com MSW desligado e executar todos os cenários e telas. Até lá não há interface de ativação/status a conferir.

## Backend

Avisar que CONTRATO v0.52 e ROADMAP v0.54 foram recebidos; manter FEAT-11 `implementado (BE)`/BE `pronto`. Falta planejamento e implementação frontend antes da validação integrada. Nenhum arquivo novo para copiar ao backend.

## Commit sugerido

`chore/recebe feat-11 e registra validacao pendente`
