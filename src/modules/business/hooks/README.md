# Business Hooks

## API pública recomendada

### `useBusinessList`
- Lista pública de empresas com paginação infinita.
- Respeita filtro territorial e usa `BusinessService.getBusinessesList`.

### `useBusinessById`
- Carrega uma empresa por `profile_id`.
- Retorna `{ business, isLoading, isError, error, refetch }`.

### `useBusinessFavorite`
- Toggle de favorito para uma única empresa.
- Usa `FavoritesService` do core (compatibilidade atual em `business_favorites` para fluxo de perfil).

### `useBusinessFavorites`
- Lista IDs favoritos do perfil ativo.
- Atualiza cache de lista e status individual sem duplicar lógica em página.

### `useBusinessRecommendation`
- Toggle de recomendação para uma única empresa.
- Usa RPCs SSOT (`is_business_recommended` / `toggle_business_recommendation`).

### `useBusinessCreate`
- Criação de empresa.

### `useBusinessEdit`
- Edição de empresa.

### `useBusinessNavigation`
- Navegação pública para URL canônica.
- Resolve `geographic_path` por ID/slug quando o chamador não traz o contexto completo.

## Hooks legados removidos

- `useBusinessActions`
  Motivo: duplicava favoritos já cobertos por `useBusinessFavorite`.

- `useBusinessListSSO`
  Motivo: mantinha um segundo fluxo de listagem com store paralela e fora do SSOT do módulo.

- `useBusinessQueries`
  Motivo: repetia hooks públicos com contratos diferentes e criava drift de API.

## Regras

- Não duplicar favoritos em componentes ou páginas.
- Não misturar contratos de favoritos: `empresas` (perfil -> empresa) e `gastronomia` (usuário -> empresa) têm backends distintos até convergência total.
- Não montar URL de empresa manualmente.
- Não criar nova store para listagem pública de empresas.
