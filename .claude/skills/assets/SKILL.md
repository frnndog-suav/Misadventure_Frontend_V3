---
name: assets
description: Convenção de imagens e ícones do Misadventures (referência) - artes do autor, placeholders SVG só para testes, nomes, catálogo de ids, ligação entre carta/categoria e imagem, acessibilidade e o passo a passo para acrescentar uma imagem. Use quando for acrescentar, trocar ou referenciar uma imagem ou ícone, quando o autor entregar artes novas, ou quando uma tela precisar mostrar a categoria de uma carta.
---

# /assets

> **Estado (2026-11-13):** convenção inicial. Onde ficam os originais, formatos finais e como gerar as versões do produto são definidos com o autor na **FEAT-02**. Até lá, pergunte em vez de decidir.

## 1. Origem

- **Imagens e ícones do jogo são fornecidos pelo autor** (README II.4), no estilo PSX de README II.5.
- **SVG próprio só para testes** (README II.4): placeholders com prefixo `test-` no nome, usados em testes e fixtures do MSW, nunca no build de release.
- _O que a tela mostra quando a arte do autor ainda não existe: a definir na FEAT-02._

## 2. Duas camadas, nunca misturadas

- **Originais:** os arquivos como o autor entregou. Nunca editados no lugar. _Pasta e se ficam no Git: a definir na FEAT-02._
- **Versões do produto:** as que o app importa, derivadas dos originais escolhidos. _Como são geradas (sem lib nova sem autorização): a definir na FEAT-02._

## 3. Nome e catálogo

- Nome em `kebab-case`, em inglês, igual ao **id do catálogo** (ex.: `category-relic`).
- O catálogo é uma lista **fechada** de ids no código, por categoria (categorias de carta, atributos, modificadores, ações de zona, tipos de zona…). Id fora da lista é erro de tipo.
- Os ids seguem o glossário do `docs/CONTRATO.md` §2 (ex.: o ícone do atributo Força é `attribute-strength`).
- Ao acrescentar um ícone, acrescente o id ao catálogo e a esta lista:

| Categoria        | Ids disponíveis | Planejados |
| ---------------- | --------------- | ---------- |
| _(nenhum ainda)_ |                 |            |

## 4. Ligar imagem a dado

- **Recursos fixos da interface** (categoria de carta, atributo, modificador, ação de zona): a UI escolhe o ícone pelo id do contrato.
- **Arte de uma carta específica:** o backend envia o identificador da arte; o frontend resolve pelo catálogo. _Formato do campo: definido no contrato da FEAT-04._
- Categoria de carta sempre com **ícone, imagem e label** juntos (README II.4).

## 5. Acessibilidade

- Ícone ao lado de texto → decorativo (`alt=""`, `aria-hidden="true"`).
- Ícone sem texto → rótulo acessível em pt-BR.
- Ícone nunca é a única informação.

## 6. Passo a passo para uma imagem nova _(completar na FEAT-02)_

1. Guardar o original do autor na pasta de originais.
2. Gerar a versão do produto.
3. Acrescentar o id ao catálogo no código e à tabela do §3.
4. Rodar o teste que confere que todo id do catálogo tem imagem (criado na FEAT-02).
