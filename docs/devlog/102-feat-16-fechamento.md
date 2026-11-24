# 102 — Fechamento da FEAT-16 (Mercado)

- Data — 2026-11-24
- Status — FEAT-16 concluída (`validado` nos dois lados)
- Retomada — devlog 101 (T-74)
- Contrato — v0.82 copiado do backend (sem mudança de formato)
- Roadmap — v0.74 copiado do backend
- Horas — null

## Objetivo

Alinhar as cópias locais de `docs/CONTRATO.md` e `docs/ROADMAP.md` às que vieram do backend e registrar o fechamento da FEAT-16.

## O que mudou

- `docs/CONTRATO.md`: a linha 0.82 do histórico passa a ser a do backend (lado `BE`). A versão local tinha registrado a mesma validação com o lado `FE` e outro texto. Cabeçalho, título da seção FEAT-16 (`validado`) e formato já eram iguais.
- `docs/ROADMAP.md`: a linha 0.74 do histórico passa a ser a do backend. A tabela já trazia FEAT-16 `validado` | `validado`.
- `GET /health` → `{"status":"ok","contractVersion":"0.82"}` (conferido em 2026-11-24).

Nenhum código de `src/` mudou.

## Checks

Nenhum código mudou; testes, lint e tipos não foram rodados.

## Backend

Nada pendente. As cópias dos dois lados estão iguais nas versões 0.82 (contrato) e 0.74 (roadmap).

## Commit sugerido

`docs/sync feat-16 validated from backend`
