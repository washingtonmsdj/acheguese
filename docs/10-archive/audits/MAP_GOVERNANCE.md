# Governanca do Mapa

Data-base: 2026-04-09

## Fonte SSOT atual
- Runtime do mapa: `src/core/maps/config/runtimeConfig.ts`
- Projecao de entidades: `src/core/maps/services/MapEntityProjectionService.ts`
- Tiles e camera padrao: `src/core/maps/providers/MapProvider.ts`
- Geocoding real: `src/core/location/services/LocationGeocodingService.ts`
- Adapter de compatibilidade para maps: `src/core/maps/services/MapGeocodingAdapter.ts`
- Visibilidade territorial: `src/core/territorial/services/TerritorialManagementService.impl.ts`
- CRUD e leitura administrativa de locations: `src/core/location/services/LocationAdminService.ts`
- Agregado administrativo do dominio: `src/core/admin/services/AdminMapGovernanceService.ts`

## Cobertura administrativa atual
- `/admin/mapa`: leitura operacional unica do produto mapa
- `/admin/locations`: CRUD de hierarquia geografica e coordenadas base
- `/admin/territory-management`: visibilidade de selector, landing e navegabilidade
- `/admin/city-metadata`: metadados territoriais complementares
- `/admin/guia/pontos-turisticos`: catalogo editorial de pontos turisticos

## O que `/admin/mapa` cobre
- providers efetivos e sua cadeia de ownership
- camadas runtime oficiais do mapa
- cobertura territorial por escopo
- hotspots de qualidade geografica e visibilidade
- categorias de pontos turisticos que entram no runtime
- superficies publicas do produto, incluindo atencao explicita para `/perto-de-mim`

## Gaps remanescentes
- write-side para boundaries e reconciliacao de geometrias
- convergencia de `src/pages/NearbyPage.tsx` para ownership direto em `core/maps`
- formalizacao do provider registry real versus documentacao historica de maps
- retirada do acoplamento de `MapaPageV4` com `modules/community-alerts`

## Classificacao
- Manter:
  - `core/maps`
  - `core/location`
  - `core/territorial`
  - `MapEntityProjectionService`
  - `LocationGeocodingService`
- Consolidar:
  - surfaces publicas do mapa
  - coverage administrativa do produto mapa
  - runtime layers em SSOT unico
- Migrar:
  - `NearbyPage` para ownership coerente com `core/maps`
  - composicao de alertas para contrato central do dominio
- Remover:
  - logs de debug residuais em runtime publico do mapa
  - wrappers ou referencias documentais a services nao implementados
- Documentar:
  - ownership de boundaries
  - provider chain real
  - relacao entre mapa, location e territorial
