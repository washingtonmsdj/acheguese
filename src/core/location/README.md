# Location Core

**Status:** G4 HARDENED — GEOGRAPHIC AUTHORITY CLOSED  
**Owner:** `src/core/location`  
**Escopo:** hierarquia geográfica canônica e operações estruturais de `locations`.

A fronteira canônica é:

- `src/core/location` → identidade e estrutura de `Location`, árvore geográfica, `location_id`, `geographic_path`, resolução, contexto e CRUD estrutural;
- `src/core/territorial` → grupos territoriais, memberships, visibilidade territorial composta e orchestration administrativa;
- `src/core/geospatial` → enriquecimento espacial especializado de `locations.boundary`;
- `src/core/coverage` → cobertura de entidades;
- `src/core/rollout` → rollout individual por território.

## Responsabilidades

- entidade `Location` (`country → state → city → district/neighborhood`);
- hierarquia: `id`, `parent_id`, `type`, `slug`;
- caminho geográfico `geographic_path`;
- resolução por ID, path e slug;
- navegação de árvore: ancestors, descendants e children;
- contexto geográfico ativo da aplicação;
- geocoding e coordenadas centrais via services/adapters canônicos;
- CRUD administrativo estrutural por `LocationAdminService`;
- filtro territorial baseado em locations e IDs já resolvidos.

## Ownership de escrita em `locations`

A tabela possui owners por operação, não writers concorrentes indiferenciados:

1. **Estrutura / CRUD** — `src/core/location/services/LocationAdminService.ts`.
2. **Boundary PostGIS** — `src/core/geospatial/repositories/GeospatialRepositorySupabase.ts`, limitado a `boundary`.
3. **Flags territoriais de visibilidade** — `supabase/functions/territorial-update-location-visibility/index.ts`, chamada pela facade `core/territorial`.

`LocationAdminService` preserva `is_selector_active`, `is_landing_enabled` e `is_navigable` e usa predicado otimista sobre `metadata` para não sobrescrever uma mutação concorrente da Edge Function.

O ratchet `tools/architecture/validate-territory-ssot.ts` bloqueia novos writers de `locations` fora dessas responsabilidades explícitas.

## O que não pertence a Location

- implementação de CRUD de `territorial_groups`;
- regras de membership de `territorial_group_members`;
- flags de visibilidade territorial;
- disponibilidade ou rollout de grupos;
- aliases de negócio/comunidade;
- cobertura de atendimento de entidades.

Essas responsabilidades devem delegar aos respectivos owners, principalmente `@/core/territorial` para grupos e gestão territorial.

## Padrão `geographic_path`

```text
/{country_code}/{state_code}/{city_slug}/{district_slug}
```

Exemplos:

- `/br` — país;
- `/br/ba` — estado;
- `/br/ba/salvador` — cidade;
- `/br/ba/salvador/pituba` — bairro/localidade.

## Grupos territoriais

A implementação histórica de grupos dentro de `core/location` foi retirada. Contracts e persistência canônicos vivem em `core/territorial`.

Aposentados:

- `src/core/location/hooks/useTerritorialGroups.ts`;
- `src/core/location/services/SelectorTerritoryService.ts`;
- `src/core/location/services/TerritorialGroupsReadService.ts`.

Persistem somente três bridges de repository em `core/location`, todos one-way para `core/territorial`, sem Supabase ou implementação própria. Dois callers históricos ainda usam o path de factory legado:

- `src/core/business/services/BusinessUrlService.ts`;
- `src/core/routing/hooks/useResolveTerritoryFromUrl.ts`.

Essa dívida é explicitamente monotônica no validator: novos callers são proibidos e uma entrada stale falha quando o caller for migrado. Ela não representa segundo SSOT.

## Critério G4 — fechado

`Territory/location` fecha G4 porque:

1. `core/location` é a autoridade estrutural de geografia/`locations`;
2. `core/territorial` é a autoridade de grupos territoriais;
3. contracts/repositories de grupo não possuem implementação concorrente em `core/location`;
4. adapters legados restantes são one-way e ratcheados;
5. Landing, sitemap e admin territorial usam as facades/adapters canônicos;
6. acesso direto a tabelas de grupo no source é bloqueado fora do owner, e gateways backend são explicitamente autorizados por operação;
7. writers de `locations` são protegidos por operação/campo;
8. a validação read-only do estado remoto conhecido não encontrou schema/RLS/constraints contradizendo essa autoridade.

Reconciliação exaustiva de migrations ↔ schema remoto, RLS/grants, dados e legados continua pertencendo a G5.

## Referências

- `docs/02-domain/GEOGRAPHIC_FOUNDATION.md`
- `src/core/territorial/README.md`
- `tools/architecture/validate-territory-ssot.ts`
- `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md`
