---
name: checar
description: Roda a definição de pronto do frontend - guarda de src/, tipos, lint, formatação, testes afetados (/testar) e build - e confere spec, contrato, rastreabilidade, laboratório fora do release e devlog. Use ao final de qualquer tarefa, antes de marcar [x], ou quando o autor perguntar se está tudo verde.
---

# /checar — definição de pronto

Rode nesta ordem e **não pare no primeiro erro** (colete tudo). Comando que ainda não existe (antes da T-01/T-02) entra na tabela como "não configurado (T-xx)".

1. `node .claude/hooks/client-guard.mjs --all`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run format:check`
5. **/testar** (só os afetados; a suíte inteira só quando o autor pedir ou for infraestrutura)
6. `npm run build` (apague `dist/` depois)

Confira manualmente:

- **Spec atualizada:** decisões no diff que não estão na spec.
- **Contrato:** todo tipo, rota ou código de erro usado em `src/api/` e `src/mocks/` existe em `docs/CONTRATO.md`, com a seção da FEAT em `acordado` ou adiante. Fixtures do MSW batem com os cenários da seção.
- **Sem regra do jogo no frontend:** nenhum cálculo, sorteio ou validação de regra em `src/` (inclusive nos handlers do MSW).
- **Rastreabilidade:** todo `REQ-xx` da tarefa aparece em pelo menos um nome de teste (Grep).
- **Laboratório:** o build de release não contém código de `src/lab/` nem de `src/mocks/` (procure no `dist/` um texto exclusivo deles antes de apagar a pasta).
- **Sem painel de desenvolvimento** fora do laboratório.
- **Devlog:** existe a entrada da tarefa e ela está no índice (pode ser criada depois deste check).

## Saída

| Check                 | Resultado                               |
| --------------------- | --------------------------------------- |
| guarda                | ✅ / ❌ (n violações) / não configurado |
| tipos                 | …                                       |
| lint                  | …                                       |
| formatação            | …                                       |
| testes (afetados)     | x passando, y falhando                  |
| e2e (áreas afetadas)  | … / "nenhuma área afetada"              |
| build                 | …                                       |
| release sem lab/mocks | …                                       |
| spec atualizada       | …                                       |
| contrato              | …                                       |
| sem regra do jogo     | …                                       |
| rastreabilidade       | …                                       |
| devlog                | …                                       |

Abaixo, a saída de cada falha (arquivo:linha e mensagem). **Não corrija nada automaticamente**; quem chamou decide (formatar é a exceção segura, se só a formatação falhou).
