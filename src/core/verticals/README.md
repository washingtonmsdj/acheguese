# Taxonomia Vertical (SSOT)

Este diretorio define a taxonomia oficial de verticais empresariais do projeto.

## Regras oficiais
- `business`/`empresas` e dominio base horizontal de entidades empresariais.
- `business` nao e vertical.
- Um vertical oficial existe somente quando estiver declarado em `VerticalKey` e `VERTICAL_CONFIGS`.
- Estado atual: `gastronomy` e o unico vertical oficialmente formalizado.
- Futuros verticais empresariais sao possiveis, mas nao devem ser tratados como oficiais antes de declaracao explicita no SSOT.

## Fonte de verdade
- Contrato canonico: [config.ts](/C:/Users/Casa/Documents/Novo github/acheguese/src/core/verticals/config.ts)
- Export publico: [index.ts](/C:/Users/Casa/Documents/Novo github/acheguese/src/core/verticals/index.ts)

## Regra de interpretacao
- Capacidade implementada em `modules/*` ou `core/*` nao implica vertical oficial.
- Apenas declaracao no contrato SSOT implica reconhecimento oficial da taxonomia vertical.
