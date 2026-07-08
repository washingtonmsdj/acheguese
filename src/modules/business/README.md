# Business Module

Modulo de empresas responsavel por detalhe publico, gestao basica, navegacao canonica e integracao com verticais como Gastronomia.

## Diretrizes

- Dados de empresa vem de `@/core/business/services/BusinessService`.
- URLs publicas vem de `@/core/business/services/BusinessUrlService`.
- Favoritos publicos de Empresas e Gastronomia usam `user_favorite_businesses` via `BusinessFavoriteService`/`useCanonicalBusinessFavorite`.
- O core de favoritos tambem resolve favoritos de empresas por `user_favorite_businesses`; `business_favorites` deve permanecer restrito a migrations/types historicos ate limpeza de banco com backfill validado.
- Hooks do modulo nao devem manter stores paralelas para a mesma responsabilidade.

## API Publica Principal

- `useBusinessList`
- `useBusinessById`
- `useCanonicalBusinessFavorite`
- `useCanonicalBusinessFavorites`
- `useBusinessRecommendation`
- `useBusinessCreate`
- `useBusinessEdit`
- `useBusinessNavigation`

## Observacoes De Arquitetura

- A listagem publica real de Empresas vive em `src/app/pages/EmpresasLandingPage.tsx` e usa componentes de `src/app/features/business-landing`.
- Sempre preferir `business_data.id` para engajamento publico e `profiles.id` apenas para rotas/ownership que explicitamente exigem perfil.
- Sempre preferir `location` e `address` canonicos em vez de campos legados soltos.
- Novos verticais devem reaproveitar contratos centrais de `core/business` e nao criar variacoes de schema por vertical.
