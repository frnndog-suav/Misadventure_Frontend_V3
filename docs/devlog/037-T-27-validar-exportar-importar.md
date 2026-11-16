# 037 — T-27: Validar como dimensão, exportar e importar coleção

- **ID:** T-27 · **FEAT:** FEAT-31 · **REQ:** REQ-25, REQ-26 · **Decisões:** D-47 · **Contrato:** §3 FEAT-31 (`POST …/validate-dimension`, `GET …/export`, `POST /lab/content/import`), v0.23 `implementado (BE)`, sem mudança · **Spec:** v0.36 → v0.37 · **Data:** 2026-11-16

## Objetivo

Ligar à seção "Coleções" do editor as três ações de coleção que faltavam, usando os hooks `useValidateDimension`, `useExportCollection` e `useImportCollection` da T-20. Fecha o lado frontend da FEAT-31.

## Decisões (D-47)

- **Onde ficam:** "Validar como dimensão" e "Exportar" no painel da coleção escolhida, depois de "Excluir coleção"; "Importar coleção" (campo de arquivo `.json`) e a caixa "Substituir se já existir" abaixo de "Nova coleção", sempre visíveis.
- **Lista "Problemas":** sob a área de status; some a cada nova validação, exportação, importação ou troca de coleção. Na importação com `CONTENT_INVALID`, cada item é `{campo}: {texto}` (só o texto se o caminho for vazio); com `CONTENT_ID_TAKEN`, só a `message` na área de status.
- **Arquivo exportado:** o JSON recebido e validado pelo schema do contrato, com recuo de 2 espaços, em `{collectionId}.json`.
- **Importar com alterações não salvas pergunta antes** (usa a mesma guarda do REQ-24), porque a importação troca a coleção escolhida e descartaria o formulário. O REQ-24 não lista "Importar"; é uma extensão registrada na D-47. Vantagem: não perde digitação em silêncio. Desvantagem: o diálogo aparece depois de o arquivo ser escolhido.
- Arquivo que não é JSON: nada é enviado (`JSON.parse` falha no navegador). O conteúdo válido vai como está; o backend valida.

## Passos e comandos

```
npx vitest run src/lab/editor/CollectionTools.test.tsx   # vermelho: 13 falhas (botões e campo ausentes)
# implementação (CollectionsSection.tsx, downloadJson.ts)
npx vitest run src/lab/editor
npx prettier --write src/lab/editor tests/e2e/editor/collections.spec.ts
npm run typecheck && npm run lint
npx playwright test tests/e2e/editor
```

## Arquivos

- Criados: `src/lab/editor/downloadJson.ts` (baixa um JSON pelo navegador), `src/lab/editor/CollectionTools.test.tsx` (14 testes).
- Alterados: `src/lab/editor/CollectionsSection.tsx` (botões, campo de arquivo, caixa, lista "Problemas", status "Validando…"), `tests/e2e/editor/collections.spec.ts` (+3), `docs/SPEC-FRONTEND.md` (D-47, v0.37), `docs/ROADMAP.md` (v0.27, FE da FEAT-31 `aguardando outro lado`).

## Como verificar

`npm run dev` com mocks, `/lab/editor`: escolha "Coleção de Teste". "Validar como dimensão" → "A coleção não forma uma dimensão válida." e a lista "Problemas" com "A coleção precisa de pelo menos 1 zona Urbana publicada.". "Exportar" → baixa `fixture.json` e mostra "Coleção exportada.". "Importar coleção" com um arquivo de texto qualquer → "O arquivo não é um JSON válido."; com `{}` → "Conteúdo inválido." e "formatVersion: Versão do arquivo não suportada."; com um JSON qualquer → "Coleção importada: 1 cartas." e o painel de "Bosque Antigo".

## Problemas

- Os testes renderizam o editor no `beforeEach`, então um `server.use` dentro do teste só vale para pedidos feitos depois (a lista inicial já foi buscada). Dois testes foram ajustados por isso (erro de preparação, não da implementação).
- O mock de import devolve sempre o resultado do `bosque`; os cenários do contrato são por corpo (`{}`) e por `replace`, e o teste de "nada fica escolhido" usa o 409 do próprio mock.

## Checks

Guarda de `src/` limpa; `typecheck`, `lint`, `format:check` limpos. Suíte inteira: 26 arquivos, 350/350 testes. Área `editor`: unitários 97/97 (3 arquivos); e2e `tests/e2e/editor` 15/15. `npm run test:build`: REQ-05 ok.

## Revisão

Revisão própria do diff contra a D-47 e os REQ-25 e REQ-26 (tarefa só de tela, sem mudar a camada de cliente): cada critério tem teste; nenhum teste existente foi alterado.

## Backend

Depende do backend real para fechar a FEAT-31: falta rodar os cenários contra ele (`/retorno-backend`). Aviso de backend dado ao fim da tarefa (FEAT-31, ROADMAP v0.27 e CONTRATO v0.23 já estão no backend).

## Commit sugerido

`feat/content editor validate export import`
