# Core Territorial

**Status:** G42 — SOURCE TRANSACIONAL PREPARADO; CUTOVER REMOTO PENDENTE  
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
- `territorial-update-location-visibility` → gateway autenticado de visibilidade de locations; o source G42 chama a RPC transacional `territorial_update_location_visibility`.

A orchestration de source passa por `TerritorialManagementService` / `territorial.mutations.ts`, que invocam essas funções e não fazem write paralelo direto.

### Cascata de Location

A semântica canônica é deliberadamente assimétrica:

- qualquer flag canônica atualiza o nó solicitado;
- `is_selector_active=false` também desativa **todos os descendentes**, em uma única transação;
- `is_selector_active=true` reativa somente o nó solicitado e não força descendentes a `true`;
- `is_landing_enabled` e `is_navigable` não fazem cascata.

O SQL preparado está em
`docs/09-reference/migrations-pending/20260910214500_transactional_location_visibility_cascade_g42.sql`.
Ele cria uma RPC `service_role`-only e reutiliza o contrato de escala comprovado no G5: descendentes são alcançados pelo prefixo indexado de `geographic_path` (`raiz/%`), apoiado por `idx_locations_geographic_path_pattern`, em uma única operação SQL. A RPC também serializa writes estruturais durante a mutação e devolve ACK correlacionado (`location`, `affectedCount`, `cascaded`). Não existe loop Edge nem uma segunda estratégia recursiva concorrente.

**Não implantar a versão G42 de `territorial-update-location-visibility` antes de promover e provar essa migration no mesmo ambiente.** O banco remoto conhecido ainda estava indisponível por timeout no último preflight; portanto o source está pronto, mas o cutover não está certificado.

A inspeção do catálogo de Edge Functions remoto em 2026-09-10 também mostrou que `territorial-get-tree`, `territorial-update-group-visibility` e `territorial-update-location-visibility` não estavam implantadas naquele snapshot, apesar de existirem no Git/config. Isso deve ser reconciliado por deploy controlado; ausência remota não autoriza fallback ou writer paralelo no browser.

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

O validator `tools/architecture/validate-territory-ssot.ts` e os ratchets de segurança garantem:

- nenhum novo caller do repository legado;
- nenhuma implementação de grupo recriada em `core/location`;
- nenhum acesso direto às tabelas de grupo em `src` fora do owner;
- gateways backend explícitos e limitados por operação;
- stale allowlists falham;
- ownership de escrita de `locations` permanece separado por operação;
- o gateway G42 de Location não pode voltar a executar loop de writes em descendentes e precisa usar a RPC transacional com o prefixo indexado canônico.

## Integração de Landing e routing

Landing, sitemap e gestão administrativa territorial consomem facades/adapters canônicos. O adapter `src/core/landing/services/territorialLanding.queries.ts` compõe dados territoriais sem recriar persistência de grupos em Landing.

## Estado do fechamento

A autoridade de source está consolidada porque:

1. contracts, repository e service de grupos possuem owner único;
2. `core/location` não contém implementação concorrente de grupos;
3. writes especializados de visibilidade passam pelos gateways backend autorizados;
4. a cascata de Location está desenhada como uma única operação SQL sobre o prefixo `geographic_path` já otimizado no G5, não como loop Edge ou CTE recursiva paralela;
5. os bridges restantes são one-way, explícitos e monotônicos;
6. o ratchet impede regressão estrutural.

O **cutover runtime** da cascata de Location permanece aberto até: Postgres remoto responder, preflight real passar, migration ser promovida, Edge ser implantada com `verify_jwt=true` e smoke admin AAL2 confirmar raiz + descendentes + não-cascata ao reativar.

## Referências

- `src/core/location/README.md`
- `src/core/territorial/TERRITORIAL_GROUPS_SEMANTICS.md`
- `docs/02-domain/GEOGRAPHIC_FOUNDATION.md`
- `docs/03-architecture/G5_LOCATION_DESCENDANTS_RPC_PERFORMANCE_2026-08-31.md`
- `tools/architecture/validate-territory-ssot.ts`
- `tests/security/territorial-visibility-client-contract-g42.test.ts`
- `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md`
