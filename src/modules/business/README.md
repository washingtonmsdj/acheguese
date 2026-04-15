# Business Module

Módulo de empresas responsável por listagem pública, detalhe, gestão básica e navegação canônica.

## Diretrizes

- Dados de empresa vêm de `@/core/business/services/BusinessService`.
- URLs públicas vêm de `@/core/business/services/BusinessUrlService`.
- Favoritos de empresa vêm de `@/core/favorites/services/FavoritesService` usando `business_favorites`.
- Hooks do módulo não mantêm stores paralelas para a mesma responsabilidade.

## API pública principal

- `useBusinessList`
- `useBusinessById`
- `useBusinessFavorite`
- `useBusinessFavorites`
- `useBusinessCreate`
- `useBusinessEdit`
- `useBusinessNavigation`

## Observações de arquitetura

- O módulo ainda contém componentes legados fora da API recomendada. Eles não devem ser usados como referência para novos fluxos.
- Sempre preferir `location` e `address` canônicos em vez de campos legados soltos.
