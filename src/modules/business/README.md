# Business Module

Módulo de empresas responsável por listagem pública, detalhe, gestão básica e navegação canônica.

## Diretrizes

- Dados de empresa vêm de `@/core/business/services/BusinessService`.
- URLs públicas vêm de `@/core/business/services/BusinessUrlService`.
- Favoritos do módulo `empresas` usam `@/core/favorites/services/FavoritesService` (compatibilidade via `business_favorites`).
- Favoritos do braço `gastronomia` usam `user_favorite_businesses` (SSOT atual de user -> business_data).
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
- Novos verticais (ex.: saúde, educação) devem reaproveitar contratos centrais de `core/business` e não criar variações de schema por vertical.
