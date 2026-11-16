# 038 — RETORNO: FEAT-31 validada contra o backend real

- **ID:** RETORNO · **FEAT:** FEAT-31 · **Contrato:** v0.23 → v0.24 (FEAT-31 `validado`, sem mudança de formato) · **Roadmap:** v0.27 → v0.28 · **Data:** 2026-11-16

## Objetivo

Rodar os cenários da FEAT-31 (CONTRATO §3) e as telas do editor de conteúdo contra o backend real, depois do Aviso de frontend do backend.

## Passos e comandos

1. Primeira tentativa: o backend em `http://localhost:3333` lia outro `CONTENT_DIR` (coleção `base`, 7 cartas). Parei e pedi que o backend subisse com a `fixture`.
2. Com a `fixture` (`GET /lab/content/collections` → só `fixture`, `publishedCount` 6), rodei os cenários com um script Node descartável no scratchpad (`fetch` em sequência; a coleção `bosque` foi criada e excluída no fim). Resultado: 29 conferências de 17 cenários, todas certas. Na primeira leitura, a 6a falhou só porque o script compara o JSON como texto (ordem das chaves); os valores são iguais aos do contrato. O cenário "laboratório desligado → `404`" não foi rodado (pede reiniciar o backend).
3. Telas com o MSW desligado: roteiro temporário do Playwright (`tests/e2e/_tmp/real.spec.ts` e `pw.tmp.config.ts`, removidos depois) no Vite do autor em `5173`. O backend só libera CORS para essa origem. Comando do autor (Git Bash): `VITE_USE_MOCKS=false VITE_API_URL=http://localhost:3333 npm run dev`. O roteiro conferiu:
   - "contrato v0.23" na tela inicial e nenhum `[MSW]` no console;
   - "Validar como dimensão" → a mensagem e o problema da zona Urbana;
   - "Exportar" → `fixture.json` e "Coleção exportada.";
   - criar coleção (erro por campo com "Bosque X"; depois `tmp-real`);
   - carta de atributo: salvar, publicar, duplicar (`forca-copia`) e excluir;
   - exportar `tmp-real` e importar de volta: sem substituir → "Este identificador já está em uso."; com "Substituir se já existir" → "Coleção importada: 1 cartas."; depois de excluir, importar sem substituir → importada;
   - `{}` → "Conteúdo inválido." com "formatVersion: Versão do arquivo não suportada."; arquivo que não é JSON → "O arquivo não é um JSON válido.";
   - exclusão de `tmp-real` no fim.

   Resultado: 1 passou (5,8 s). Backend no fim: só a `fixture`.

## Decisões

- Os e2e permanentes do `editor` continuam só com MSW. A validação contra o backend real foi um roteiro descartável, como nas FEAT-04 e 05.

## Problemas

- Duas tentativas das telas pegaram o Vite com `VITE_USE_MOCKS=true` (a tela mostrava "contrato v0.4", o da fixture do MSW). O `$env:` do PowerShell não chegou ao processo. A causa foi confirmada lendo o `import.meta.env` injetado em `/src/api/http.ts`. Resolvido com a variável na mesma linha do comando, no Git Bash.

## Checks

Cenários: 29/29 conferências (17 de 18 cenários). Roteiro das telas contra o backend real: verde. Nenhum código de `src/` mudou.

## Backend

Levar `docs/CONTRATO.md` v0.24 e `docs/ROADMAP.md` v0.28 para o backend.

## Commit sugerido

`docs/feat-31 validated against real backend`
