# Taxonomia Vertical (SSOT)

Este diretório contém a infraestrutura compartilhada da taxonomia de verticais empresariais e, temporariamente, namespaces de compatibilidade em retirada.

## Fonte de verdade

- Contrato canônico: [`config.ts`](./config.ts)
- Export público: [`index.ts`](./index.ts)
- Um vertical empresarial oficial existe somente quando estiver declarado em `VerticalKey`, `VERTICAL_KEYS` e `VERTICAL_CONFIGS`.

## Verticais empresariais oficiais

Estado atual definido por `config.ts`:

- `gastronomy`
- `education`

`business`/`empresas` é o domínio horizontal base e **não** é vertical.

## Compatibilidade em retirada

Pastas `events`, `guide` e `jobs` sob `src/core/verticals/` não ganham status de vertical empresarial por estarem neste diretório.

### `guide`

A implementação de rotas de pontos turísticos já foi migrada para o owner canônico:

- `src/core/guide/tourist-points/routes`

`src/core/verticals/guide/routes` contém somente shims de reexport temporários para callers antigos. Código novo não pode importar esse caminho legado.

### `jobs`

A implementação de rotas de vagas e distribuição de publicação já foi migrada para:

- `src/core/work-opportunities/routes`
- `src/core/work-opportunities/services`

`src/core/verticals/jobs/routes` e `src/core/verticals/jobs/services` contêm somente shims de reexport temporários. Trabalho estruturado de classificados continua pertencendo a `src/modules/classifieds/jobs`; oportunidades rápidas pertencem ao bounded context `work-opportunities`.

### `events`

Eventos ainda é a dívida substancial restante sob `core/verticals`: possui contratos, mappers, config, rotas e services reais. A superfície de produto deve convergir para `src/modules/community-events`; contratos reutilizáveis devem convergir para um owner `src/core` fora da taxonomia empresarial, preservando shims apenas durante a janela de compatibilidade.

Não adicionar novos domínios não empresariais em `src/core/verticals/`.

## Regra de interpretação

- Capacidade implementada em `modules/*`, `core/*` ou `features/*` não implica vertical oficial.
- Apenas a declaração em `config.ts` define a taxonomia empresarial oficial.
- Código novo deve respeitar a estrutura canônica descrita em `src/modules/README.md`; namespaces legados existem somente durante migração controlada.
- Compatibilidade deve encolher: shims não recebem nova lógica, novos testes nem novos callers.
