# G163 — skeleton responsivo visível do mapa de entrada

Data: 2026-09-14

## Objetivo

Garantir que a área do mapa da entrada pública nunca pareça vazia ou reduzida a uma faixa de status durante o carregamento, em mobile e desktop.

## Mudanças

- `TerritoryEntryMapSkeleton` permanece único e compartilhado pelo wrapper e pelo runtime.
- skeleton ocupa toda a área reservada ao mapa com `absolute inset-0 z-20`.
- contraste de blocos e vias usa `territory-ink` com opacidade explícita, sem depender de diferenças sutis entre `surface` e `raised`.
- composição responsiva adiciona blocos extras no desktop, preservando versão compacta no mobile.
- nenhuma forma representa ou aproxima limite territorial real.
- container do mapa agora possui fallback de altura mínima por breakpoint:
  - mobile: `12rem`;
  - tablet: `18rem`;
  - desktop: `24rem`.
- runtime preserva as mesmas alturas para evitar colapso na transição skeleton → MapLibre.
- regressão protege contraste, altura mínima, composição mobile/desktop e proibição de geometria territorial inventada.

## Commits principais

- `022fd590` — skeleton com estrutura visual de mapa mais evidente.
- `528ff637` — altura mínima responsiva no wrapper.
- `67d87a34` — altura mínima responsiva no runtime.
- `97ec81e2` — regressão contra skeleton reduzido a faixa.
- `9595aaae` — contraste mínimo independente do tema.
- `3589073c` — regressão de contraste.

## Validação / provider

O Vercel continua retornando `build-rate-limit`. Portanto, este checkpoint registra a correção no source, mas não declara deploy/build verde. A versão publicada pode continuar exibindo a implementação anterior até que um deploy do novo HEAD seja executado com sucesso.
