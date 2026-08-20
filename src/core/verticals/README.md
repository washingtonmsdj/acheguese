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

Pastas `events`, `guide` e `jobs` sob `src/core/verticals/` não ganham status de vertical empresarial por estarem neste diretório. Todas as três já tiveram a implementação real migrada para owners canônicos; os caminhos antigos permanecem somente como shims temporários para callers ainda não migrados.

### `events`

O core canônico de Eventos vive em:

- `src/core/events`

Ele concentra types, mappers, configuração de leitura, rotas e services de leitura/mutation/runtime. `src/core/verticals/events` agora contém somente reexports de compatibilidade e não pode receber lógica, testes ou novos callers.

A superfície de produto ainda está em transição: deve convergir de `src/features/events` para `src/modules/community-events`.

### `guide`

A implementação de rotas de pontos turísticos vive em:

- `src/core/guide/tourist-points/routes`

`src/core/verticals/guide/routes` contém somente shims de reexport temporários.

### `jobs`

A implementação de rotas de vagas e distribuição de publicação vive em:

- `src/core/work-opportunities/routes`
- `src/core/work-opportunities/services`

`src/core/verticals/jobs/routes` e `src/core/verticals/jobs/services` contêm somente shims de reexport temporários. Trabalho estruturado de classificados continua pertencendo a `src/modules/classifieds/jobs`; oportunidades rápidas pertencem ao bounded context `work-opportunities`.

Não adicionar novos domínios não empresariais em `src/core/verticals/`.

## Regra de interpretação

- Capacidade implementada em `modules/*`, `core/*` ou `features/*` não implica vertical oficial.
- Apenas a declaração em `config.ts` define a taxonomia empresarial oficial.
- Código novo deve respeitar a estrutura canônica descrita em `src/modules/README.md`; namespaces legados existem somente durante migração controlada.
- Compatibilidade deve encolher: shims não recebem nova lógica, novos testes nem novos callers.
