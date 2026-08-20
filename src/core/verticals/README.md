# Taxonomia Vertical (SSOT)

Este diretório contém a infraestrutura compartilhada da taxonomia de verticais empresariais e, temporariamente, alguns namespaces legados que ainda precisam ser realocados.

## Fonte de verdade

- Contrato canônico: [`config.ts`](./config.ts)
- Export público: [`index.ts`](./index.ts)
- Um vertical empresarial oficial existe somente quando estiver declarado em `VerticalKey`, `VERTICAL_KEYS` e `VERTICAL_CONFIGS`.

## Verticais empresariais oficiais

Estado atual definido por `config.ts`:

- `gastronomy`
- `education`

`business`/`empresas` é o domínio horizontal base e **não** é vertical.

## Dívida estrutural conhecida

Pastas como `events`, `guide` e `jobs` sob `src/core/verticals/` não ganham status de vertical empresarial por estarem neste diretório. Elas são namespaces históricos/compatibilidade e devem ser migradas para o bounded context canônico correspondente antes de qualquer remoção.

- Eventos: domínio de produto deve convergir para `src/modules/community-events`, com contratos reutilizáveis em `src/core` fora da taxonomia empresarial.
- Guide: domínio de produto pertence a `src/modules/guide`.
- Jobs: trabalho estruturado pertence a `src/modules/classifieds/jobs`; oportunidades rápidas pertencem a `src/modules/work-opportunities`.

Não adicionar novos domínios não empresariais em `src/core/verticals/`.

## Regra de interpretação

- Capacidade implementada em `modules/*`, `core/*` ou `features/*` não implica vertical oficial.
- Apenas a declaração em `config.ts` define a taxonomia empresarial oficial.
- Código novo deve respeitar a estrutura canônica descrita em `src/modules/README.md`; namespaces legados existem somente durante migração controlada.
