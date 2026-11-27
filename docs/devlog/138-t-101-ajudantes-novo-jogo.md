# 138 — Ajudantes de IA em Novo jogo

- Data — 2026-11-27
- Status — T-101 concluída
- Horas — null
- Referências — FEAT-20, REQ-102, seção FEAT-20 do CONTRATO v1.09 (repositório backend), devlog 137

## Alterações

- `src/features/party/NewGame.tsx` consulta as opções de criação e oferece de `minPlayers - 1` a `maxPlayers - 1` ajudantes. Envia `aiHelperCount`, inclusive zero, e vincula as recusas da API ao seletor. Ao receber uma recusa por mínimo ou máximo, atualiza as opções e mantém a quantidade recusada e os demais dados do formulário para correção.
- `src/features/party/NewGame.test.tsx` cobre limites não padrão, redução do máximo entre consulta e envio, preservação dos dados e reenvio corrigido. O teste do REQ-102 falhou inicialmente pela ausência do seletor.
- `tests/e2e/party/new-game.spec.ts` cobre a faixa padrão de 0 a 5, o valor inicial zero e a navegação para o grupo criado com cinco ajudantes.

## Verificação

- Os 26 testes de Novo jogo passaram. Typecheck, lint e `git diff --check` passaram.
- Os 64 E2E em Chromium passaram com MSW, 12 em `app` e 52 em `party`. A execução usou uma instância isolada do Vite na porta 5181 com a URL da API apontada para um destino local sem backend. O processo temporário do Vite precisou ser encerrado após os testes para o Playwright concluir e retornar código 0.
- Caso de borda — o máximo cai de quatro para três participantes após a seleção de três ajudantes. A API recusa, o seletor mostra o erro e mantém o valor recusado visível, o envio fica bloqueado e a correção para dois ajudantes permite criar o grupo com os nomes e a classe já preenchidos.

## Retomada

A T-102 integra o avanço automático e a conservação da chave e do corpo por intenção. Os saves e checkpoints da T-104 foram preservados. A validação integrada permanece reservada para depois da T-103.
