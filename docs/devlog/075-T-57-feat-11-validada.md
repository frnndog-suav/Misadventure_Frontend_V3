# 075 — T-57, FEAT-11 validada contra o backend real

**2026-11-20 · concluída · Spec v0.72 · Contrato v0.52 → v0.53 · Roadmap v0.55 → v0.56**

## Ambiente

`GET /health` em `http://localhost:3333` respondeu `status: "ok"` e `contractVersion: "0.52"`. As cópias iniciais de contrato e roadmap tinham SHA-256 idêntico nos dois repositórios. O catálogo `fixture` tinha 24 cartas. Foram usados grupos e coleções temporários.

## Verificações HTTP

Os 16 grupos de cenários da seção FEAT-11 do contrato passaram com Node e `fetch`: catálogo e efeito da Poção de Cura, criação do grupo, duas poções e disponibilidade de Preparar, amuleto fora de uso, custo e saldos do amuleto, doação de vida e cura, pagamento com Força e recusas, tônico e expiração, passivo da armadura e moeda indisponível, ativação com 0 pontos, as quatro validações de formato, sessão inativa e recusa do editor com `effects.0.cost`.

Na transmissão do item ao editor, a primeira tentativa do roteiro enviou `id` no lugar de `slug` e recebeu erros desses campos. Com o `CardInput` do contrato, retornou `400 CONTENT_INVALID` com o campo e a mensagem previstos para o custo.

## Telas

Sete roteiros passaram no Chrome com Playwright e `VITE_USE_MOCKS=false`, em 58 requisições ao backend real encaminhadas pelo Vite. A origem direta de teste esbarrou no CORS configurado para a porta 5173 e nas restrições de loopback do Chrome. O proxy temporário do Vite encaminhou as chamadas HTTP, com os service workers bloqueados no navegador.

1. Em `/lab`, selecione Item e abra o Tônico de Força. A carta mostra o texto de Buff recebido.
2. Em `/lab/editor`, abra a poção temporária, mude a cura de 5 para 6 e salve. O GET do editor confirma a persistência. Troque o custo por `[]` e salve. A recusa aparece no campo Custo.
3. Na partida de teste, equipe o Amuleto do Foco e ative seu primeiro efeito. O Vigor cai para 5, o ouro sobe para 10 e os pontos seguem em 3. Ative a doação de vida e use a poção para voltar de 17 a 22 de Vida.
4. Caso de borda do pagamento. Selecione Resistência para o efeito que pede Força. A tela mostra a mensagem do backend e mantém a caixa marcada. Ao trocar por Força, o pedido envia o ID escolhido e o sucesso limpa a seleção.
5. Ative o tônico. A origem e a contagem 2 aparecem com Ataque 9. Encerre duas vezes a vez. A contagem passa por 1, desaparece e o Ataque volta a 6.
6. Equipe a Armadura do Guardião. A Defesa vai a 19. A armadura e a Moeda da Sorte não têm botão de ativação.
7. Com 0 pontos de ação, ative a poção restante. A tela confirma a ativação e os pontos permanecem em 0.

## Encerramento

Os grupos e coleções temporários foram removidos e `initialGold` e `initialHandSize` restaurados. O status da FEAT-11 foi atualizado no contrato, no roadmap e na spec. O índice e o registro de tempo receberam a etapa com horas `null`. Nenhuma divergência funcional ficou pendente.

O autor deve copiar o contrato v0.53 e o roadmap v0.56 ao backend. A próxima feature no roadmap é FEAT-12.

Commit sugerido `docs/t-57 validate feat-11 against real backend`.
