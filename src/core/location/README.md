# Location Core

**Status:** G4 HARDENING — GEOGRAPHIC OWNER ATIVO  
**Owner:** `src/core/location`  
**Escopo:** hierarquia geográfica canônica e contexto de localização da aplicação.

`core/location` não é o owner de grupos territoriais. A fronteira canônica é:

- `src/core/location` → `Location`, árvore geográfica, `location_id`, `geographic_path`, resolução, contexto e filtros geográficos;
- `src/core/territorial` → grupos territoriais, membership de grupos, disponibilidade/rollout de grupo e gestão territorial composta;
- `src/core/coverage` → cobertura de entidades;
- `src/core/rollout` → rollout individual por território.

## Responsabilidades

- entidade `Location` (`country → state → city → district/neighborhood`);
- hierarquia: `id`, `parent_id`, `type`, `slug`;
- caminho geográfico `geographic_path`;
- resolução por ID, path e slug;
- navegação de árvore: ancestors, descendants e children;
- contexto geográfico ativo da aplicação;
- geocoding/resolução de endereço pelos adapters canônicos;
- filtro territorial baseado em locations e IDs resolvidos;
- histórico/residência exposto separadamente pelo contrato público quando aplicável.

## O que não pertence a Location

- CRUD de `territorial_groups`;
- regras de membership de `territorial_group_members`;
- disponibilidade ou rollout de grupos;
- aliases de negócio/comunidade;
- cobertura de atendimento de entidades.

Essas responsabilidades devem delegar aos respectivos owners, principalmente `@/core/territorial` para grupos.

## Padrão `geographic_path`

```text
/{country_code}/{state_code}/{city_slug}/{district_slug}
```

Exemplos:

- `/br` — país;
- `/br/ba` — estado;
- `/br/ba/salvador` — cidade;
- `/br/ba/salvador/pituba` — bairro/localidade.

## Dívida G4 em redução

A implementação histórica colocou contracts/repository de `TerritorialGroup` dentro de `core/location`. Essa estrutura não representa a fronteira alvo e está sendo retirada em cortes pequenos.

Já aposentados nesta retomada:

- `src/core/location/hooks/useTerritorialGroups.ts`;
- `src/core/location/services/SelectorTerritoryService.ts`.

Callers novos não podem importar `createTerritorialGroupRepository` de `core/location`. O ratchet `tools/architecture/validate-territory-ssot.ts` congela as poucas exceções legadas restantes e falha para novas dependências ou allowlist stale.

## Critério G4

Location/Territory só fecha G4 quando:

1. `core/location` for a única autoridade de geografia/locations;
2. `core/territorial` for a única autoridade de grupos territoriais;
3. contracts/repositories de grupo não tiverem implementação concorrente em `core/location`;
4. consumidores externos usarem as facades canônicas;
5. ratchets impedirem recriação da dívida;
6. o estado remoto conhecido não contradizer essas autoridades.

Reconciliação exaustiva de schema, migrations, RLS/grants e dados continua pertencendo a G5.

## Referências

- `docs/02-domain/GEOGRAPHIC_FOUNDATION.md`
- `src/core/territorial/README.md`
- `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md`
