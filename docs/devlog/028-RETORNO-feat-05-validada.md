# 028 — RETORNO: FEAT-05 validada contra o backend real

- **ID:** RETORNO · **FEAT:** FEAT-05 · **REQ:** REQ-14 a REQ-17 · **Contrato:** §3 FEAT-05, v0.16 → v0.17 (`validado`) · **Roadmap:** v0.20 → v0.21 · **Data:** 2026-11-15

## Objetivo

Conferir os cenários e as telas da FEAT-05 contra o backend real (`http://localhost:3333`, `/health` com `contractVersion: "0.16"`) e fechar a FEAT.

## Passos e comandos

1. Cenários com `curl` (antes da T-19, mesma versão do backend): os 7 passaram. Detalhes na entrada 027.
2. Telas com o MSW desligado: um roteiro temporário do Playwright (`tests/e2e/_tmp/real.spec.ts` e `pw.tmp.config.ts`, ambos removidos depois), no Vite do autor em `5173` com `VITE_API_URL=http://localhost:3333`, fuso `America/Sao_Paulo`. O roteiro conferiu:
   - status "Servidor conectado · contrato v0.16", sem `[MSW]` no console, e "Nenhum jogo salvo.";
   - `/novo`: erros por campo ("Informe o nome do grupo.", "Use até 24 caracteres.") e, com `minPlayers = 2` (via `PATCH /lab/config`, devolvido a 1 no fim), o aviso de grupo de 1;
   - criar "Os Teimosos"/"Lia" → `/grupo/<uuid>` com "Lia (host)" e "Em sessão" → "Encerrar sessão" → `/` com "Sessão encerrada." e o save "Pausado";
   - "Continuar" e encerrar de novo;
   - "Abandonar" → "Grupo abandonado." e "Nenhum jogo salvo.";
   - a URL do grupo abandonado mostra "Grupo não encontrado." e "Voltar ao início".

   Resultado: 1 passou (2,4 s).
3. Limpeza: banco `[]`, `minPlayers` 1.

## Decisões

- Os e2e permanentes de `app`/`party` continuam só com MSW (dependem das fixtures). A validação contra o backend real foi um roteiro descartável, como na FEAT-04, e não entrou no repositório.

## Problemas

- Os e2e da T-19 (entrada 027) rodaram uma vez contra o Vite do autor em `5173`, que estava sem MSW e ligado ao backend real, e deixaram dois saves no banco ("Solo" e "Os Teimosos"). Foram apagados antes da validação.

## Checks

Cenários com `curl`: 7/7. Roteiro das telas contra o backend real: verde. Nenhum código de `src/` mudou.

## Backend

Levar `docs/CONTRATO.md` v0.17 e `docs/ROADMAP.md` v0.21 para o backend.

## Commit sugerido

`docs/feat-05 validated against real backend`
