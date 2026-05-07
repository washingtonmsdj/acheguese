# Territorial Foundation

Documentação da fundação territorial do projeto — Etapas 1–9.

---

## Visão Geral

O sistema territorial resolve qual conteúdo exibir com base na localização geográfica do usuário. Suporta dois modos:

- **Location** — bairro individual (ex: `/ba/salvador/nordeste-de-amaralina`)
- **Group** — agrupamento de bairros (ex: `/ba/salvador/area/complexo-do-nordeste-de-amaralina`)

---

## Arquitetura

```
URL params
    │
    ▼
useResolveTerritoryFromUrl()   ← resolve Location ou TerritorialGroup
    │
    ▼
useTerritoryFilter()           ← produz TerritoryFilter { scope, location_id(s) }
    │
    ▼
PostService / módulos          ← aplica .eq() ou .in() na query
```

---

## Tipos Centrais

### `TerritoryFilter` (`src/core/location/types/index.ts`)

```ts
type TerritoryFilter =
  | { scope: 'location'; location_id: string }
  | { scope: 'group';    location_ids: string[] }
  | { scope: 'none' }
```

### `ResolvedTerritory` (`src/core/routing/hooks/useResolveTerritoryFromUrl.ts`)

```ts
type ResolvedTerritory =
  | { kind: 'location'; location: Location }
  | { kind: 'group';    group: TerritorialGroupWithMembers }
  | null
```

### `ActiveTerritory` (`src/core/location/types/index.ts`)

```ts
type ActiveTerritory = { type: 'location'; location: Location } | null
```

---

## Hooks Públicos

### `useResolveTerritoryFromUrl()`

Lê `useParams()` e resolve o território via repositórios. Sem fallback — inexistente retorna `status: 'not_found'`.

```ts
const { status, resolved, error } = useResolveTerritoryFromUrl();
// status: 'idle' | 'loading' | 'resolved_location' | 'resolved_group' | 'not_found' | 'inactive' | 'error'
```

### `useTerritoryFilter(routeResolved?, activeMemberIds?)`

Produz o filtro territorial para uso em queries.

```ts
const filter = useTerritoryFilter(resolved, activeMemberIds);
// filter.scope === 'location' → .eq('location_id', filter.location_id)
// filter.scope === 'group'    → .in('location_id', filter.location_ids)
// filter.scope === 'none'     → não executar query
```

### `useGroupAvailability(groupId, moduleKey)`

Resolve disponibilidade de módulo por grupo via batch query.

```ts
const { availability, active_member_ids } = useGroupAvailability('tg-complexo-nordeste', ModuleKey.COMMUNITY);
// availability: 'full' | 'partial' | 'none'
```

### `useActiveTerritory()` / `useLocationContext()`

Acesso ao store de território ativo (fora de rota territorial).

---

## Rotas Canônicas

```
/                                          → HomePage (institucional)
/:state/:city                              → TerritorialLayout (city)
/:state/:city/:district                    → TerritorialLayout (location)
/:state/:city/area/:groupSlug              → TerritorialLayout (group)
```

Decisao de produto/SEO vigente: `docs/DECISAO_ROTEAMENTO_TERRITORIAL.md`.

Modelo publico atual:

```text
/:state/:city                              -> hub publico da cidade
/:state/:city/:district                    -> hub publico do bairro
/:state/:city/area/:groupSlug              -> hub publico do grupo territorial
/empresas/:state/:city                     -> vitrine publica do modulo na cidade
/empresas/:state/:city/:district           -> vitrine publica do modulo no bairro
/empresas/:state/:city/area/:groupSlug     -> vitrine publica do modulo no grupo
/comunidade/:state/:city/:district         -> experiencia social/local do bairro
/comunidade/:state/:city/area/:groupSlug   -> experiencia social/local do territorio
```

Exemplo real:
```
/ba/salvador/area/complexo-do-nordeste-de-amaralina     → Complexo do Nordeste
/ba/salvador/nordeste-de-amaralina                 → Nordeste de Amaralina
```

Rotas antigas com `/:country/...`, grupo sem `/area`, `/community` ou `/feed` nao devem ser usadas em implementacoes novas.

---

## Serviços Territoriais

### `GroupAvailabilityService`

Determina disponibilidade de módulo por grupo. Usa batch query (`findByModuleAndLocations`) para evitar N queries.

```ts
const result = await groupAvailabilityService.getGroupModuleAvailability(groupId, ModuleKey.COMMUNITY);
// result.availability: 'full' | 'partial' | 'none'
// result.active_member_ids: string[]
```

### `TerritorialRolloutService`

Operações administrativas de rollout por grupo.

```ts
// Ativar módulo para todos os membros ativos do grupo
await territorialRolloutService.activateRolloutForGroup({ group_id, module_key, status });

// Sincronizar novos membros sem rollout explícito
await territorialRolloutService.reconcileGroupRollout({ group_id, module_key, default_status });
```

---

## Dados Seed (Mock)

Localidades disponíveis no `LocationRepositoryMock`:

| ID                            | Slug                        | Tipo     |
|-------------------------------|-----------------------------|----------|
| `loc-salvador`                | `salvador`                  | city     |
| `loc-nordeste-de-amaralina`   | `nordeste-de-amaralina`     | district |
| `loc-santa-cruz`              | `santa-cruz`                | district |
| `loc-chapada-do-rio-vermelho` | `chapada-do-rio-vermelho`   | district |
| `loc-vale-das-pedrinhas`      | `vale-das-pedrinhas`        | district |
| `loc-pituba`                  | `pituba`                    | district |
| `loc-rio-vermelho`            | `rio-vermelho`              | district |
| `loc-barra`                   | `barra`                     | district |
| `loc-amaralina`               | `amaralina`                 | district |

Grupo seed no `TerritorialGroupRepositoryMock`:

| ID                      | Slug                          | Membros                                                                 |
|-------------------------|-------------------------------|-------------------------------------------------------------------------|
| `tg-complexo-nordeste`  | `complexo-nordeste-amaralina` | nordeste-de-amaralina, santa-cruz, chapada-do-rio-vermelho, vale-das-pedrinhas |

---

## Regras de Negócio

- **Sem fallback silencioso** — território inexistente = 404 explícito
- **Sem hardcode de localidade** fora de `territoryUrls.ts` (LAUNCH_TERRITORY) e `HomePage`
- **Membros inativos** não participam de availability nem de rollout
- **Drift policy** — novos membros de grupo NÃO herdam rollout automaticamente; chamar `reconcileGroupRollout` explicitamente
- **Ordem do router é crítica**: rotas fixas → group (`/area/:groupSlug`) → district (`/:district`) → catch-all

---

## Cobertura de Testes

| Arquivo de teste                                          | Testes | Status |
|-----------------------------------------------------------|--------|--------|
| `src/core/location/__tests__/useTerritoryFilter.test.ts`  | 13     | ✅     |
| `src/core/territorial/__tests__/GroupAvailabilityService.test.ts` | 6 | ✅  |
| `src/core/territorial/__tests__/TerritorialRolloutService.test.ts` | 5 | ✅ |
| `src/core/routing/__tests__/useResolveTerritoryFromUrl.test.ts` | 4  | ✅     |
| **Total**                                                 | **28** | **✅** |

---

## Migração para Supabase

O projeto usa mock em desenvolvimento. Para migrar:

1. Executar migrations em `supabase/migrations/`:
   - `20260324000008_create_territorial_groups.sql`
   - `20260324000009_seed_complexo_nordeste.sql`
2. Alterar `createLocationRepository()` para retornar `LocationRepositorySupabase`
3. Alterar `createTerritorialGroupRepository()` para retornar `TerritorialGroupRepositorySupabase`
4. Nenhuma alteração nos hooks, serviços ou testes é necessária
