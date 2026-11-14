---
name: revisar-visual
description: Revisa (somente leitura) uma mudança de UX/design contra o guia visual e as regras de acessibilidade - tokens, tipografia, contraste WCAG AA, foco visível, resoluções de PC suportadas, reduced motion, animações que não bloqueiam entrada, ícones com rótulo, categoria de carta visível, estética proibida, nenhum comportamento ou texto testado alterado. Use no fim de toda mudança visual (a /visual chama) ou quando o autor pedir uma revisão do visual.
argument-hint: (opcional) arquivos ou descrição
---

# /revisar-visual

Escopo: **$ARGUMENTS** (vazio = o diff atual, incluindo arquivos novos). Não edite nada. Leia antes **/guia-visual** e **/assets**.

## Checklist

1. **Comportamento intacto:** nenhum texto visível, `aria-*`, `role`, ordem de controles, atalho ou fluxo da spec mudou; nenhum teste foi alterado; nenhuma regra do jogo entrou na UI.
2. **Tokens:** liste as cores soltas novas que deveriam ser token.
3. **Tipografia:** fonte via token; números tabulares em valores que mudam; nenhuma fonte nova sem autorização.
4. **Contraste:** calcule a razão (luminância relativa WCAG) de cada par novo ou alterado, em todos os temas; mostre a conta dos que ficarem perto do limite.
5. **Foco e clique:** `focus-visible` visível; área de clique dentro do guia.
6. **Resoluções:** nada quebra na faixa suportada (guia §6); texto longo quebra; sem rolagem horizontal.
7. **Movimento:** reduced motion respeitado; duração dentro do guia; só `transform`/`opacity` (exceções justificadas); não atrasa cliques, atalhos nem foco; sem aleatório; nenhum teste espera o fim de uma animação.
8. **Estética:** nada da lista proibida do guia (inclusive aparência moderna demais nas artes e renderização 3D).
9. **Cartas e termos:** categoria com ícone, imagem e label; termos do jogo com destaque e tooltip (README II.4).
10. **Ícones e imagens:** rótulo acessível ou decorativo marcado; nome e id na convenção de `/assets`; nenhum placeholder `test-` fora de testes.
11. **Rastreabilidade:** decisão durável na spec e no guia; entrada no devlog.

## Saída

```
Veredito: APROVADO | AJUSTES NECESSÁRIOS

Bloqueantes
- arquivo:linha — problema — regra do guia/D-xx — sugestão

Não bloqueantes
- …

Contraste
| par (texto / fundo) | razão | ok? |
```

Seja curto. Não elogie.
