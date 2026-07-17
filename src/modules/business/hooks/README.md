# Business Hooks

## API Publica Recomendada

### `useBusinessList`
- Lista publica de empresas com paginacao infinita.
- Respeita filtro territorial e usa `BusinessService.getBusinessesList`.

### `useBusinessById`
- Carrega uma empresa por `profile_id`.
- Retorna `{ business, isLoading, isError, error, refetch }`.

### `useCanonicalBusinessFavorite`
- Alterna a UI de uma unica empresa usando `business_data.id`, mas persiste por
  comando `set` idempotente em `BusinessFavoriteService`.

### `useCanonicalBusinessFavorites`
- Consulta em lote apenas as empresas candidatas visiveis e alterna favoritos
  da conta autenticada.
- Compartilha cache com `useCanonicalBusinessFavorite`.

### `useBusinessRecommendation`
- Toggle de recomendacao para uma unica empresa usando `business_data.id`.
- Usa RPCs SSOT (`is_business_recommended` / `toggle_business_recommendation`).

### `useBusinessCreate`
- Criacao de empresa.

### `useBusinessEdit`
- Edicao de empresa.

### `useBusinessNavigation`
- Navegacao publica para URL canonica.
- Resolve `geographic_path` por ID/slug quando o chamador nao traz o contexto completo.

## Hooks Legados Removidos

- `useBusinessActions`
  Motivo: duplicava favoritos ja cobertos pelos hooks canonicos.

- `useBusinessFavorite`
  Motivo: usava o contrato antigo de `business_favorites` para o fluxo publico.

- `useBusinessFavorites`
  Motivo: foi substituido por `useCanonicalBusinessFavorites`.

- `useBusinessListSSO`
  Motivo: mantinha um segundo fluxo de listagem com store paralela e fora do SSOT do modulo.

- `useBusinessQueries`
  Motivo: repetia hooks publicos com contratos diferentes e criava drift de API.

## Regras

- Nao duplicar favoritos em componentes ou paginas.
- Nao passar `profiles.id` para favoritos/recomendacoes publicas; use `business_data.id`.
- Nao montar URL de empresa manualmente.
- Nao criar nova store para listagem publica de empresas.
