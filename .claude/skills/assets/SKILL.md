---
name: assets
description: Convenção de imagens e ícones do Misadventures (referência) - artes do autor, placeholders SVG só para testes, nomes, catálogo de ids, ligação entre carta/categoria e imagem, acessibilidade e o passo a passo para acrescentar uma imagem. Use quando for acrescentar, trocar ou referenciar uma imagem ou ícone, quando o autor entregar artes novas, ou quando uma tela precisar mostrar a categoria de uma carta.
---

# /assets

> **Estado (2026-11-14):** definida com o autor na T-07 (spec D-22).

## 1. Origem

- **Imagens e ícones do jogo são fornecidos pelo autor** (README II.4), no estilo PSX de README II.5.
- **SVG próprio só para testes** (README II.4): placeholders com prefixo `test-` no nome, em `src/ui/test-assets/`, importados só por testes (e fixtures do MSW), nunca pelo código de produção — assim ficam fora do release.
- **Arte ainda não entregue:** a entrada do catálogo usa `art: 'pending'`; a tela mostra uma moldura neutra no lugar da imagem, sem ícone, com o rótulo visível.

## 2. Duas camadas, nunca misturadas

- **Originais:** os arquivos como o autor entregou. Nunca editados no lugar. Ficam em `assets-src/` (raiz), versionados no Git.
- **Versões do produto:** as que o app importa, derivadas dos originais escolhidos. **Exportadas à mão pelo autor** no tamanho e formato final para `src/assets/<categoria>/` (sem script nem lib de conversão).

## 3. Nome e catálogo

- Nome em `kebab-case`, em inglês, igual ao **id do catálogo** (ex.: `category-relic`).
- O catálogo é uma lista **fechada** de ids no código, por categoria (categorias de carta, atributos, modificadores, ações de zona, tipos de zona…). Id fora da lista é erro de tipo.
- Os ids seguem o glossário do `docs/CONTRATO.md` §2 (ex.: o ícone do atributo Força é `attribute-strength`).
- Ao acrescentar um ícone, acrescente o id ao catálogo e a esta lista:

| Categoria                                   | Ids disponíveis              | Planejados       |
| ------------------------------------------- | ---------------------------- | ---------------- |
| Categoria de carta (`src/ui/categories.ts`) | _(nenhum; catálogo vazio)_   | reais na FEAT-04 |
| Teste (`src/ui/test-assets/categories.ts`)  | `test-relic`, `test-pending` | —                |

## 4. Ligar imagem a dado

- **Recursos fixos da interface** (categoria de carta, atributo, modificador, ação de zona): a UI escolhe o ícone pelo id do contrato.
- **Arte de uma carta específica:** o backend envia o identificador da arte; o frontend resolve pelo catálogo. _Formato do campo: definido no contrato da FEAT-04._
- Categoria de carta sempre com **ícone, imagem e label** juntos (README II.4).

## 5. Acessibilidade

- Ícone ao lado de texto → decorativo (`alt=""`, `aria-hidden="true"`).
- Ícone sem texto → rótulo acessível em pt-BR.
- Ícone nunca é a única informação.

## 6. Passo a passo para uma imagem nova

1. Guardar o original do autor em `assets-src/`.
2. O autor exporta a versão do produto para `src/assets/<categoria>/<id>.<ext>` (ícone e imagem).
3. Importar os arquivos no catálogo (ex.: `src/ui/categories.ts`), trocando `art: 'pending'` por `{ icon, image }`, e atualizar a tabela do §3.
4. Rodar `npx vitest related --run src/ui/CardCategory.test.tsx` (confere que todo id tem ícone e imagem ou está pendente, e que não há `test-` no catálogo de produção).
