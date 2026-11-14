# Misadventures — Frontend

Cliente web (depois executável Tauri) do Misadventures, um TCG/RPG cooperativo jogado em vezes alternadas. O frontend **exibe o estado** que vem do backend autoritativo e **envia as intenções** do jogador. Não existe motor de regras aqui.

## Fontes da verdade

| Documento                                        | O que guarda                                                                                       | Onde vive                                 |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| [`docs/README.md`](docs/README.md)               | **Regras do jogo** e requisitos técnicos. Decisões do autor no Apêndice B.                         | Compartilhado (cópia idêntica no backend) |
| [`docs/SPEC-FRONTEND.md`](docs/SPEC-FRONTEND.md) | **Comportamento do frontend**: REQ, decisões D, tarefas T, telas. Spec-anchored.                   | Só no frontend                            |
| [`docs/CONTRATO.md`](docs/CONTRATO.md)           | **Contrato com o backend**: glossário termo → identificador, convenções, endpoints, eventos, DTOs. | Compartilhado                             |
| [`docs/ROADMAP.md`](docs/ROADMAP.md)             | **Fases e features** (FEAT-nn) dos dois lados e o protocolo entre os repositórios.                 | Compartilhado                             |
| [`docs/devlog/`](docs/devlog/README.md)          | Registro de cada etapa.                                                                            | Só no frontend                            |

Toda mudança de comportamento começa na spec. Mudança de **regra do jogo** começa no README (Apêndice B). Mudança no que se troca com o backend começa no contrato.

## Constituição (princípios inegociáveis)

1. **O backend decide, o frontend mostra.** Sorteios, cálculos (dano, acerto, preços, custos), validação de ações, ações disponíveis, relógio da vez e estado da partida vêm prontos do backend (README II.1). Se a tela precisa de um valor que depende de regra, o backend manda o valor pronto. O frontend nunca reimplementa uma regra do README.
2. **Contrato primeiro.** Toda comunicação com o backend passa por `src/api/`, com os tipos de `docs/CONTRATO.md`. Componentes e telas não chamam `fetch`, socket nem `XMLHttpRequest`. Todo dado recebido entra como `unknown` e é validado antes de virar tipo.
3. **O MSW só devolve fixtures.** Os handlers de `src/mocks/` respondem com estados de exemplo prontos do contrato; não decidem nada nem simulam regras. Uma feature só fecha quando o **backend real** passa no mesmo cenário (README III.2).
4. **O laboratório só existe no build de dev.** O código de `src/lab/` e suas rotas ficam fora do bundle de release (o build confere isso). O controle de admin entra junto com a autenticação (FEAT-25).
5. **Tipagem estrita.** Sem `any` (use `unknown` + validação). Uniões discriminadas para mensagens, eventos e variantes do servidor, com `switch` exaustivo (`const _exhaustive: never = x`).
6. **TDD.** Todo REQ tem testes escritos a partir dos critérios Dado/Quando/Então antes da implementação. Uma tarefa que mexe numa área da UI também cobre essa área com e2e. Ao fim de uma tarefa, rodam só os testes afetados.
7. **Escopo fechado.** Só o que a tarefa pede. Ambiguidade real vira pergunta com uma opção recomendada, nunca invenção.
8. **Regras do jogo: o README é a fonte.** Cite por seção (`README 19.2`), nunca copie. Antes de apontar contradição ou lacuna, leia o Apêndice B (as decisões ali não se reabrem). Só sinalize o que **impede a implementação**. Exemplos do autor são ilustrativos, não regras literais.
9. **Idioma.** Identificadores e contrato em **inglês**; textos para o jogador em **pt-BR**. O glossário de `docs/CONTRATO.md` §2 faz a ponte e é a base dos termos com destaque e tooltip (README II.4).
10. **Jogo 2D.** O estilo PSX vale para imagens, ícones, animações e transições (README II.5). Imagens e ícones são fornecidos pelo autor; SVG próprio só para testes.
11. **PC primeiro.** Distâncias, tamanhos e margens se ajustam ao monitor do jogador (README II.1).
12. **Dependências mínimas.** Autorizadas: as da stack abaixo. Qualquer outra lib, pergunte antes de instalar (README II.2).
13. **Avanço autorizado.** Uma tarefa por vez. Ao terminar, pare, entregue o **roteiro de testes** e espere autorização explícita para a próxima.
14. **Rastreabilidade.** Cada etapa gera uma entrada no devlog.

## Instruções obrigatórias (README III.1)

Valem para o agente principal e para todos os agentes de desenvolvimento:

- "Não disfarce suas dúvidas. Explicite as vantagens e desvantagens de cada escolha."
- "Implemente apenas o necessário para resolver o problema. Não acrescente nada baseado em suposições."
- "Modifique apenas o que for indispensável. Corrija ou limpe tudo aquilo que suas próprias alterações deixarem para trás."
- "Estabeleça critérios claros para considerar a tarefa concluída. Continue iterando até confirmar que eles foram atendidos."

## Aviso de backend (quando o autor precisa agir no outro repositório)

O backend fica em outro repositório e **o autor leva as informações de um lado para o outro** (README III.2). Sempre que o trabalho depender do backend, **pare e mostre um Aviso de backend**, neste formato, no fim da resposta:

```
AVISO DE BACKEND — FEAT-nn
Por quê: <o que depende do backend>
Leve para o backend: <arquivos e versões, ex.: docs/CONTRATO.md v0.3 (seção FEAT-05)>
Rode lá: <o que pedir na sessão do backend, ex.: "/contrato FEAT-05" ou "docker compose up">
Traga de volta: <o que colar aqui depois, ex.: a resposta do backend ou "backend no ar em http://localhost:3000">
Enquanto isso, aqui: <o que segue com MSW / o que fica bloqueado>
```

Mostre o aviso quando:

1. o contrato for criado ou alterado (`/contrato`);
2. o lado frontend de uma FEAT estiver pronto com MSW e faltar validar contra o backend real (`/retorno-backend`);
3. o README (regras) ou o ROADMAP mudar (o backend precisa da cópia nova);
4. uma tarefa precisar de algo que o contrato ainda não oferece (não contorne: pare e avise).

## Fluxo de trabalho

| Quero…                                                                    | Use                                                                                       |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Implementar uma tarefa                                                    | `/tarefa T-xx`                                                                            |
| Mudar um comportamento, ou planejar uma FEAT do roadmap em REQs e tarefas | `/mudar-spec <descrição>`                                                                 |
| Criar ou mudar o que se troca com o backend                               | `/contrato <FEAT-nn ou descrição>`                                                        |
| Aplicar o que o backend respondeu ou validar contra o backend real        | `/retorno-backend <resposta colada>`                                                      |
| Conferir a definição de pronto                                            | `/checar`                                                                                 |
| Rodar os testes afetados (ou `tudo`)                                      | `/testar`                                                                                 |
| Registrar uma etapa no devlog                                             | `/registrar-etapa` (a `/tarefa` já chama)                                                 |
| Mudar visual, animação, ícone                                             | `/visual <descrição>` (referência: `/guia-visual`, `/assets`; revisão: `/revisar-visual`) |

**Antes de alterar qualquer funcionalidade ou visual**, consulte o índice do devlog e as entradas da área, e rode `git log --oneline -- <arquivos>`, para entender por que o código está como está.

Agentes (`.claude/agents/`):

- `test-writer`: escreve os testes (unitários e e2e) a partir dos critérios, antes da implementação.
- `client-dev`: camada de cliente (`src/api/`, `src/mocks/`, consultas e cache), até os testes passarem.
- `ui-dev`: estrutura e comportamento das telas.
- `spec-reviewer`: revisão somente leitura contra a spec, o contrato e esta constituição.
- `ux-designer`: aparência (tokens, tipografia, superfícies, ícones, layout).
- `motion-dev`: animações e transições.

## Stack (autorizada)

TypeScript 6 (spec D-11), Vite 8, React 19 (com React Compiler), TanStack Query, React Router DOM, Vitest (+ jsdom e Testing Library, D-12), Playwright, MSW, Prettier, ESLint; Tauri na FEAT-29. Ainda não instaladas: TanStack Query, React Router DOM e MSW (T-03), Tauri (veja a spec 3.2). Qualquer outra lib: pergunte.

## Convenções

- **Pastas** (criadas na T-03): `src/api/` (contrato em código, cliente, validação), `src/mocks/` (MSW e fixtures), `src/features/<área>/` (telas por área), `src/ui/` (componentes compartilhados), `src/lab/` (laboratório, só dev).
- **Testes:** ao lado do código (`x.ts` → `x.test.ts`). O nome de cada teste cita o requisito: `it('REQ-12: …')`. E2E em `tests/e2e/<área>/`, localizando por papel e nome acessível.
- **Erros do backend:** chegam no formato de `docs/CONTRATO.md` §1.4; a UI mostra a mensagem em pt-BR e nunca lança exceção por erro esperado.
- **Estilo:** Prettier (a partir da T-01). Rode `npm run format` antes de terminar.
- **Verificação:** cada tarefa é verificada pelos testes, pelo próprio produto e pelo roteiro de testes. Nenhuma tarefa cria painel de desenvolvimento fora do laboratório.
- **Commits:** o autor faz. O agente só sugere a mensagem, no formato `tipo/descrição curta em minúsculas` (ex.: `chore/updating rules and doc`).
- **Datas** absolutas (AAAA-MM-DD) em tudo o que é registrado.

## Guardas automáticas (a partir da T-02)

- Hook `.claude/hooks/client-guard.mjs` (após cada edição em `src/`) e as mesmas regras no ESLint. Proíbem em `src/`: `Math.random`; `any`; `fetch`, `XMLHttpRequest`, `WebSocket` e `io(` fora de `src/api/`; importar `src/mocks/` ou `src/lab/` fora dos pontos de entrada de dev (spec D-08).

## Comandos

```
npm run dev
npm run build
npm run lint
npm run typecheck          # a partir da T-01
npm test                   # a partir da T-01
npx vitest related --run <arquivos>
npm run test:e2e           # a partir da T-01
npm run format             # a partir da T-01
npm run format:check       # a partir da T-01
node .claude/hooks/client-guard.mjs --all   # a partir da T-02
```
