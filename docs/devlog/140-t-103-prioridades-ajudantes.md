# 140 — Prioridades dos ajudantes no laboratório

- Data — 2026-11-27
- Status — T-103 concluída
- Horas — null
- Referências — FEAT-20, REQ-106, seção FEAT-20 do CONTRATO v1.09 (repositório backend), devlog 139

## Alterações

- `src/lab/LabPage.tsx` mostra a ordem em vigor e permite trocar prioridades vizinhas. Salvar envia a permutação completa em `aiPlayerPriorities` junto das demais alterações do formulário. A tela associa `invalidPriorities` à lista e usa o reset global existente para restaurar os padrões. A configuração salva se aplica a campanhas novas.
- `tests/e2e/lab/lab.spec.ts` cobre a ordem inicial, os limites de movimento, o corpo do PATCH, a confirmação do salvamento e a restauração dos padrões com uma edição pendente.
- `docs/SPEC-FRONTEND.md` marca a T-103 como concluída.

## Verificação

- 20 E2E de `lab` passaram em Chromium com MSW, em uma instância isolada do Vite. A execução na porta padrão encontrou erros de conexão e foi interrompida.
- 60 testes de `LabPage.test.tsx` e `labConfig.test.tsx` passaram. O teste do cliente confirma que o MSW recusa prioridades duplicadas com `400 LAB_CONFIG_INVALID` e preserva a ordem salva após a recusa.
- Typecheck, lint e `git diff --check` passaram.

## Retomada

A T-104 valida os seis cenários da FEAT-20 com MSW desligado. O devlog 110 do backend registra os dados preparados pela T-91 e o acesso direto usado na preparação. Os saves e checkpoints ficaram reservados para essa validação. A T-103 foi testada com MSW.
