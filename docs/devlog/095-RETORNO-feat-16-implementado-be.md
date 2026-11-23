# 095 — RETORNO: FEAT-16 implementado no backend

- **ID:** RETORNO · **FEAT:** FEAT-16 · **Contrato:** §3 FEAT-16, v0.80 (`acordado`) → v0.81 (`implementado (BE)`) · **Roadmap:** v0.70 → v0.72 · **Data:** 2026-11-23

Só documentos. Nenhum código, teste nem spec mudou.

## Objetivo

Receber o aviso do backend de que a FEAT-16 (Mercado) está `implementado (BE)`, com 11 campanhas preparadas para a validação integrada.

## Passos

1. O autor trouxe o CONTRATO v0.81 e o ROADMAP v0.71 do backend. `GET http://localhost:3333/health` → `contractVersion: "0.81"`.
2. CONTRATO: cabeçalho 0.81, título da seção FEAT-16 → `implementado (BE)` e linha 0.81 do histórico. O backend declara "sem mudança de formato".
3. ROADMAP: a v0.71 do backend trazia a linha da FEAT-16 com as colunas trocadas (FE `pronto`, BE `a fazer`), em desacordo com o próprio histórico. Aplicada como FE `a fazer`, BE `pronto`, e registrada a correção na v0.72.
4. **Validação integrada não rodada:** o lado frontend da FEAT-16 ainda não existe (sem REQs, tarefas, schemas, fixtures nem telas). As campanhas não foram tocadas, para não gastar o estado preparado pelo backend.

## Pendências

- Planejar a FEAT-16 no frontend (`/mudar-spec planejar FEAT-16`), implementar com MSW e só então validar contra as campanhas.
- Levar o ROADMAP v0.72 ao backend.
