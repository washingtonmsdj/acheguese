# Core Territorial

**Status:** G4 HARDENED — TERRITORIAL GROUP AUTHORITY CLOSED  
**Owner:** `src/core/territorial`  
**Escopo:** grupos territoriais, memberships, disponibilidade/rollout de grupo e gestão territorial composta.

## Fronteira canônica

- `core/location` → geografia oficial e estrutura de `locations`;
- `core/territorial` → `territorial_groups`, `territorial_group_members`, resolução de grupos, memberships e visibilidade territorial;
- `core/coverage` → cobertura de entidades;
- `core/rollout` → rollout individual por localização;
- `core/geospatial` → boundary/espacialidade especializada da geografia.

Grupos territoriais **não são locations fake**. Eles agregam locations reais sem alterar a árvore geográfica.

## Contracts e persistência

Contracts canônicos vivem em:

- `src/core/territorial/contracts/index.ts`;
- `src/core/territorial/repositories/ITerritorialGroupRepository.ts`;
- `src/core/territorial/repositories/TerritorialGroupRepositorySupabase.ts`;
- `src/core/territorial/repositories/createTerritorialGroupRepository.ts`.

A facade pública é `@/core/territorial`.

`TerritorialGroupService` é a autoridade de regras de negócio para CRUD e membership. Consumers novos não devem importar persistência interna nem paths históricos de `core/location`.

## Backend gateways

As Edge Functions territoriais são gateways backend explícitos, não segundos SSOTs:

- `territorial-get-tree` → read model administrativo;
- `territorial-update-group-visibility` → atualização protegida de flags de visibilidade em metadata;
- `territorial-update-location-visibility` → atualização protegida de flags de visibilidade de locations.

A orchestration de source passa por `TerritorialManagementService` / `territorial.mutations.ts`, que invocam essas funções e não fazem write paralelo direto.

## Regras principais

- slug de grupo é único por cidade âncora;
- cidade âncora precisa ser `city`;
- membros precisam ser locality selecionável (`district`/`neighborhood` conforme contrato atual) e pertencer à cidade âncora;
- membros inativos não entram em resolução ativa;
- grupo ativo não pode ficar vazio;
- visibilidade territorial é controlada pelos flags canônicos `is_selector_active`, `is_landing_enabled` e `is_navigable`;
- `territorial_groups` e `territorial_group_members` não podem ganhar implementação paralela em `core/location`.

## Compatibilidade histórica

Os antigos artefatos funcionais de grupos em `core/location` foram aposentados. Permanecem apenas bridges mínimos de repository, one-way para este owner, enquanto dois callers históricos são migrados gradualmente.

O validator `tools/architecture/validate-territory-ssot.ts` garante:

- nenhum novo caller do repository legado;
- nenhuma implementação de grupo recriada em `core/location`;
- nenhum acesso direto às tabelas de grupo em `src` fora do owner;
- gateways backend explícitos e limitados por operação;
- stale allowlists falham;
- ownership de escrita de `locations` também permanece separado por operação.

## Integração de Landing e routing

Landing, sitemap e gestão administrativa territorial consomem facades/adapters canônicos. O adapter `src/core/landing/services/territorialLanding.queries.ts` compõe dados territoriais sem recriar persistência de grupos em Landing.

## G4 fechado

A autoridade de source está fechada porque:

1. contracts, repository e service de grupos possuem owner único;
2. `core/location` não contém implementação concorrente de grupos;
3. writes especializados de visibilidade passam pelos gateways backend autorizados;
4. os bridges restantes são one-way, explícitos e monotônicos;
5. o ratchet impede regressão estrutural;
6. a validação read-only do banco remoto conhecido confirmou schema, constraints e RLS compatíveis com a separação `locations` vs grupos.

A auditoria exaustiva de migrations, grants, RLS e dados permanece em G5.

## Referências

- `src/core/location/README.md`
- `src/core/territorial/TERRITORIAL_GROUPS_SEMANTICS.md`
- `docs/02-domain/GEOGRAPHIC_FOUNDATION.md`
- `tools/architecture/validate-territory-ssot.ts`
- `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md`
