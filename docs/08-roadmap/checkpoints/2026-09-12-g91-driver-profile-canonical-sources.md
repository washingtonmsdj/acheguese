# G91 — Driver profile canonical sources

Data: 2026-09-12

## Problema

A página `DriverProfilePage` tratava `driver_data` como se fosse um agregado universal. Ela tentava obter desse read model dados que pertencem a outras authorities:

- identidade pública (`display_name`, `name`, `avatar_url`, `bio`);
- plano fictício `subscription_plan=prioritario`;
- `total_earnings` e `total_ratings` sem contrato no runtime atual;
- `max_search_radius_km` sem authority canônica em `driver_data`.

Isso ficou ainda mais visível depois do G90, que tornou explícita a projeção runtime de `driver_data`.

## Correção

### Identidade

`useDriverProfile` agora preserva e expõe o `sessionDriverProfile` como `driverIdentity`.

`DriverProfilePage` usa:

- `driverIdentity.displayName`;
- `driverIdentity.avatarUrl`;
- `driverIdentity.bio`.

`driver_data` não volta a carregar identidade pública.

### Presença

O indicador online da página continua usando `driverProfile.is_online`, mas esse valor chega pelo `useDriverProfileIdentity`, que o deriva de `DriverAvailabilityService`/`driver_availability`.

Não houve reintrodução de `driver_data.is_online` como authority.

### Assinatura

O badge fictício `Prioritario/Padrao`, derivado de `subscription_plan`, foi removido.

A UI mostra somente o estado realmente disponível no contrato runtime:

- `subscription_active === true` → `Assinatura ativa`;
- caso contrário → `Sem assinatura ativa`.

### Ganhos e avaliações

Foi criada a query key centralizada:

`MOBILITY_QUERY_KEYS.driverProfileMetrics(profileId)`

A página consulta em paralelo:

- `mobilityService.getDriverEarnings(driverProfileId, 30)` — total canônico dos últimos 30 dias;
- `ReviewsService.getReviewCount(driverProfileId, "driver")` — contagem real de avaliações.

A UI deixou de chamar um valor inexistente de `total_earnings` de “Total ganho” e agora explicita `Ganhos nos ultimos 30 dias`.

### Área de atuação

A funcionalidade foi preservada, não removida.

O antigo `max_search_radius_km` foi substituído por `useServiceAreas(driverProfileId)`, que lê a authority territorial `ServiceAreasService`/Coverage.

A página passa a mostrar:

- área principal canônica;
- raio apenas quando o coverage realmente é por raio;
- quantidade de áreas ativas;
- até quatro localidades ativas no resumo.

## Ratchet

Criado:

`src/modules/mobility/__tests__/DriverProfileCanonicalSourcesG91.test.ts`

O teste impede regressão para:

- identidade pública em `driver_data`;
- `profileAny.total_earnings`/`total_ratings`;
- `subscription_plan`/`Prioritario`;
- `max_search_radius_km`/`Raio de busca`.

Também exige as authorities atuais de earnings, reviews, query key e service areas.

## Arquivos principais

- `src/modules/mobility/hooks/useDriverProfile.ts`
- `src/modules/mobility/pages/DriverProfilePage.tsx`
- `src/shared/types/mobility.constants.ts`
- `src/modules/mobility/__tests__/DriverProfileCanonicalSourcesG91.test.ts`

## Rollout

`PUBLIC_LAUNCH_SURFACES.mobility=false` permanece inalterado.

Nenhuma migration Supabase e nenhum deploy de Edge Function fazem parte deste checkpoint.

## Validação

Validação source/ratchet adicionada. O estado de CI deve ser tratado separadamente: ausência de execução de runner não pode ser classificada como regressão de código nem como PASS.
