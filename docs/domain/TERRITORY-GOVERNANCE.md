# TERITORY-GOVERNANCE.md — Constituição Oficial do Domínio Territory

**Sprint**: TERRITORY.GOVERNANCE.1
**Data de congelamento**: 2026-07-23
**Versão**: 1.0.0
**Status**: 🟡 Em revisão para congelamento

**Documentos base**:
- `docs/02-domain/TERRITORY-DOMAIN.md` — modelo conceitual do domínio
- `docs/02-domain/DOMAIN-MAPPING.md` — mapeamento de nomes legados → canônicos
- `docs/domain/TERRITORY-ENTERPRISE-AUDIT.md` — auditoria arquitetural (29 findings)
- `docs/domain/TERRITORY-ROADMAP.md` — backlog priorizado P0-P3

---

## 1. MISSÃO DO DOMÍNIO TERRITORY

**Fornecer a fundação geográfica canônica sobre a qual toda navegação, conteúdo, busca e comunicação do Achegue-se são resolvidos — com integridade referencial, rastreabilidade de fontes e independência de hardcodes.**

---

## 2. RESPONSABILIDADES

### 2.1. O que PERTENCE ao Territory

| Responsabilidade | Descrição |
|---|---|
| **Hierarquia geográfica** | Country → State → City → District → Neighborhood. Estrutura de árvore via `parent_id` + `geographic_path`. |
| **Resolução de território a partir de URL** | Parse de `/:state/:city/:slug` → `ResolvedTerritory` (Location ou Group). |
| **Filtro territorial canônico** | `TerritoryFilter` com `scope: 'location' | 'group' | 'none'` — todos os módulos usam este contrato. |
| **Boundaries geográficos** | Polígonos GeoJSON com fonte rastreável — armazenados em `location_boundaries`, servidos via `BoundaryService`. |
| **Agrupamentos territoriais** | `TerritoryGroup` — coleção não-hierárquica de Territories para campanhas, coberturas, regiões operacionais. |
| **Modos de visualização** | `TerritoryMode` — `'bairro'` (filtrado) ou `'cidade'` (amplo). |
| **Visibilidade e navegabilidade** | Metadados `is_navigable`, `is_selector_active`, `is_landing_enabled` — controlam disponibilidade pública. |
| **Configuração de lançamento** | `TERRITORY_CONFIG` — 100% env-driven (`VITE_LAUNCH_COUNTRY`, `VITE_LAUNCH_STATE`, `VITE_LAUNCH_CITY`). |
| **Construção de URLs** | `territoryUrls.ts` — SSOT para toda geração de URL territorial. |

### 2.2. O que NÃO pertence ao Territory

| Responsabilidade | Domínio real |
|---|---|
| **Conteúdo social** (feed, posts, moderadores, eventos, alertas) | `Community` (subdomínio de Territory) |
| **Dados de negócios** (empresas, catálogo, avaliações) | `Business` |
| **Geolocalização do usuário** (GPS, IP) | `User` / `Geolocation` |
| **Renderização de mapa** (MapLibre, tiles, controles) | `Maps` |
| **Internacionalização de UI** (traduções, locale) | `i18n` (cross-cutting) |
| **Autenticação e permissões** | `Session` / `Auth` |

---

## 3. ENTIDADES OFICIAIS

### 3.1. Territory (entidade raiz)

```
Representa qualquer recorte geográfico oficial com identidade única, hierarquia e status.
É a fundação sobre a qual todo o produto opera.
```

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único |
| `parent_id` | UUID? | Territory pai na hierarquia |
| `type` | TerritoryType | Natureza geográfica |
| `slug` | string | Segmento estável de URL |
| `name` | string | Nome de exibição |
| `full_name` | string | Nome completo com contexto |
| `geographic_path` | string | Caminho canônico: `/br/ba/salvador/pituba` |
| `status` | `active` \| `inactive` | Soft-delete |
| `metadata` | JSONB | Dados auxiliares (código IBGE, timezone, população) |
| `created_at` | TIMESTAMPTZ | Data de criação |
| `updated_at` | TIMESTAMPTZ | Data da última atualização |

**Alias legado**: `Location` em `src/core/location/types/index.ts`. O nome canônico é `Territory`.

### 3.2. TerritoryType (enum canônico)

| Valor | Papel | Exemplo |
|---|---|---|
| `country` | Raiz territorial | Brasil |
| `state` | Unidade federativa | Bahia |
| `city` | Município | Salvador |
| `district` | Divisão IBGE (fallback) | Subúrbio Ferroviário |
| `neighborhood` | Bairro oficial (fonte municipal) | Pituba |

**Alias legado**: `LocationType` em `src/core/location/types/index.ts`. O nome canônico é `TerritoryType`.

**Regra**: Country, State, City, District e Neighborhood **não são domínios separados**. São valores de `TerritoryType`. Todos compartilham a mesma entidade `Territory`.

### 3.3. Boundary

```
Boundary é o polígono geográfico (GeoJSON) que define os limites de um Territory.
É uma entidade separada, vinculada 1:1 ao Territory via location_id.
```

| Campo | Tipo | Descrição |
|---|---|---|
| `location_id` | UUID PK/FK | Vinculado ao Territory |
| `boundary` | JSONB | GeoJSON Polygon ou MultiPolygon |
| `center_lat` | DOUBLE PRECISION | Latitude do centroide |
| `center_lng` | DOUBLE PRECISION | Longitude do centroide |
| `source` | TEXT | Nome da fonte (ex: "GeoSalvador") |
| `source_url` | TEXT | URL do FeatureServer |
| `source_object_id` | TEXT | ID do objeto na fonte |
| `metadata` | JSONB | Provider, source_level, geometry_format |

**Regra**: Boundary nunca é consultado diretamente por componentes UI. Toda consulta passa por `BoundaryService`.

### 3.4. TerritoryGroup

```
Group é um agrupamento operacional não-hierárquico de Territories.
Útil para tratar múltiplos bairros como uma única unidade de filtro/feed
sem alterar a hierarquia oficial.
```

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único |
| `slug` | string | Segmento de URL |
| `name` | string | Nome de exibição |
| `anchor_city_id` | UUID FK | Cidade âncora (facilitador, não hierarquia) |
| `status` | `active` \| `inactive` | Soft-delete |
| `metadata` | JSONB | Dados auxiliares |
| `members` | Territory[] | Coleção de Territories membros |

**Relação**: N:N com Territory via `territorial_group_members`.

### 3.5. Community

```
Community é a camada social/editorial que existe SOBRE um Territory.
É um subdomínio de Territory — não um tipo de Territory.
```

| Aspecto | Territory | Community |
|---|---|---|
| Natureza | Recorte geográfico oficial | Camada social sobre um Territory |
| Cardinalidade | 1 por recorte | 1 Community por Territory ativado |
| Fonte | IBGE + fontes municipais | Produto (rollout, moderação) |
| Existe sem o outro? | Sim | Não — Community sempre referencia um Territory |

**Regra**: Toda Community tem exatamente um Territory. Nem todo Territory tem Community ativa.

---

## 4. RELAÇÕES OFICIAIS

```
                    ┌──────────────────────────────────────┐
                    │           TerritoryGroup              │
                    │  (agrupamento não-hierárquico)        │
                    │         N:N com Territory             │
                    └──────────┬───────────────────────────┘
                               │ members[]
                               ▼
    ┌──────────────────────────────────────────────────────┐
    │                    Territory                          │
    │  id, type, slug, geographic_path, status, metadata   │
    │                                                      │
    │  Hierarquia: parent_id (árvore)                      │
    │    country ──► state ──► city ──► district           │
    │                               └──► neighborhood      │
    └──────┬────────────────────┬──────────────────────────┘
           │                    │
           │ 1:1                │ 1:0..1
           ▼                    ▼
    ┌──────────────┐    ┌──────────────────┐
    │   Boundary   │    │    Community     │
    │  (polígono   │    │  (camada social  │
    │   GeoJSON)   │    │   sobre o        │
    │              │    │   Territory)     │
    └──────────────┘    └──────────────────┘
```

| Relação | Cardinalidade | Tabela/Chave |
|---|---|---|
| Territory → Territory | 1:N (hierarquia) | `parent_id` |
| Territory → Boundary | 1:1 (opcional) | `location_boundaries.location_id` |
| Territory → Community | 1:0..1 (opcional) | `territory_communities.territory_id` |
| Territory ↔ TerritoryGroup | N:N | `territorial_group_members` |
| TerritoryGroup → City | N:1 (âncora) | `territorial_groups.anchor_city_id` |

---

## 5. RESPONSABILIDADES POR CAMADA

**Regra máxima**: Nenhuma camada pode pular a camada imediatamente inferior. A UI nunca consulta o banco diretamente. O banco nunca sabe de UI.

```
┌──────────────────────────────────────────────────────────────────┐
│                          UI LAYER                                │
│  Responsabilidade: Renderizar território.                        │
│  Pode usar: useActiveTerritory(), useResolveTerritoryFromUrl(),  │
│             TerritoryLiveMap, TerritorySelector.                 │
│  NUNCA: query direta ao banco, BoundaryService, parsePath manual.│
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                        ROUTING LAYER                             │
│  Responsabilidade: URL → ResolvedTerritory.                      │
│  SSOT: useResolveTerritoryFromUrl.ts.                            │
│  Ferramentas: parsePublicTerritoryPath, territoryUrls,           │
│               publicTerritoryFallbacks.                          │
│  NUNCA: boundary, conteúdo, UI.                                  │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                        HOOKS LAYER                               │
│  Responsabilidade: Estado reativo do território ativo.           │
│  SSOT: useActiveTerritory(), useUserTerritory(),                 │
│         useModuleTerritoryFilter(), useTerritoryPolygon().       │
│  NUNCA: UI rendering, routing, persistência direta.              │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                       SERVICE LAYER                              │
│  Responsabilidade: Lógica de negócio territorial.                │
│  SSOT: BoundaryService, LocationGeocodingService,                │
│         BaseLocationService, TerritoryModeManager,               │
│         TerritoryCommunityRouteService.                          │
│  NUNCA: UI, URLs, estado reativo.                                │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                     REPOSITORY LAYER                             │
│  Responsabilidade: Acesso a dados.                               │
│  Contrato: ILocationRepository, ITerritorialGroupRepository.     │
│  Implementação: LocationRepositorySupabase.                      │
│  NUNCA: lógica de negócio, regras de UI, formatação de dados.    │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                      DATABASE LAYER                              │
│  Responsabilidade: Persistência e integridade referencial.       │
│  Tabelas: locations, territorial_groups,                         │
│            territorial_group_members, location_boundaries,       │
│            territory_communities.                                │
│  Contratos: CHECK constraints, RLS, triggers, índices.           │
│  NUNCA: regras de negócio, UI, formatação.                       │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. REGRAS INVIOLÁVEIS

### 6.1. Regras de domínio

| # | Regra | Motivo |
|---|---|---|
| R1 | **Nenhum componente consulta boundaries diretamente.** | Violação da camada de serviço. Usar `BoundaryService`. |
| R2 | **Nenhuma tela resolve território sem passar por `useResolveTerritoryFromUrl` ou `useActiveTerritory`.** | SSOT de resolução. |
| R3 | **Nenhuma URL é montada com concatenação manual de paths.** | Usar `territoryUrls.ts` (builders canônicos). |
| R4 | **Nenhum hardcode de bairro, cidade ou estado em código fonte.** | Dados vêm do banco ou de config env-driven. |
| R5 | **Nenhuma imagem de bairro em código.** | `hero_image_url` deve vir de `locations.metadata`. |
| R6 | **Nenhuma feature consulta `Location` diretamente ignorando `Territory`.** | Usar `useActiveTerritory()` ou `TerritoryFilter`. |
| R7 | **Nenhum módulo cria seu próprio slugify/normalizeText.** | Usar `src/shared/utils/slugify.ts` (único). |
| R8 | **Nenhum serviço usa `findAll()` em produção.** | Substituir por queries filtradas. |
| R9 | **Nenhum código fora de `ILocationRepository` consulta tabelas territory diretamente.** | Abstração de repositório é inviolável. |
| R10 | **`TerritoryType` nunca é estendido sem atualizar este documento.** | Governança de schema. |

### 6.2. Regras de entidade

| # | Regra | Motivo |
|---|---|---|
| R11 | **Country, State, City, District, Neighborhood NÃO são domínios separados.** | São valores de `TerritoryType`. |
| R12 | **Community sempre referencia exatamente um Territory ativo.** | Não existe Community "solta". |
| R13 | **Group nunca é tratado como hierarquia oficial.** | É agrupamento operacional, não árvore geográfica. |
| R14 | **Boundary sempre tem `source`, `source_url` e `source_object_id` preenchidos.** | Rastreabilidade de fonte é obrigatória. |
| R15 | **Soft-delete é sempre via `status = 'inactive'`, nunca `DELETE`.** | Integridade referencial e auditoria. |

### 6.3. Regras de configuração

| # | Regra | Motivo |
|---|---|---|
| R16 | **Toda configuração de lançamento usa `VITE_LAUNCH_*`, nunca literais.** | Multi-ambiente, multi-cidade. |
| R17 | **`TERRITORY_CONFIG` é a única fonte de defaults territoriais.** | SSOT de configuração. |
| R18 | **Slugs de módulo são definidos exclusivamente em `src/config/moduleSlugs.ts`.** | Sem dispersão de strings. |

### 6.4. Regras de dados

| # | Regra | Motivo |
|---|---|---|
| R19 | **Toda migration de territory usa `ON CONFLICT DO UPDATE`.** | Idempotência obrigatória. |
| R20 | **Metadados de `locations` e `location_boundaries` seguem o schema canônico unificado.** | `source_name`, `source_level`, `source_url`, `source_object_id`, `official`. |
| R21 | **`geographic_path` é imutável após criação.** | É a chave canônica de identidade. Mudanças de nome vão em `name`/`full_name`. |

---

## 7. ANTIPADRÕES PROIBIDOS

| # | Antipadrão | Onde ocorre | Correção |
|---|---|---|---|
| A1 | **Duplicação de slugify** | 7 arquivos: `ClassifiedUrlService.ts`, `TouristPointService.ts`, `CidadeLandingPage.tsx`, `useUserTerritory.ts` (×2), `publicTerritoryFallbacks.ts`, `LocationGeocodingService.ts` | P0.3 — unificar em `src/shared/utils/slugify.ts` |
| A2 | **`findAll()` carregando todas as locations** | `LocationRepositorySupabase.ts:183`, chamado por `LocationGeocodingService` e `BoundaryService` | P1.4 — queries filtradas por país |
| A3 | **Fallback centrado em coordenadas de Salvador** | `BoundaryService.ts:155` — `[-12.975, -38.476]` | P1.1 — `resolveFallbackCenter()` |
| A4 | **Fallback restrito a `state === "ba" && city === "salvador"`** | `publicTerritoryFallbacks.ts:142` | P1.3 — fallback dinâmico |
| A5 | **Query direta a `territorial_group_members` fora do repositório** | `education.queries.ts`, `landing.queries.ts`, `LocationGeocodingService.ts:731`, `TerritorialGroupsReadService.ts:29` | P3.9 — usar `ITerritorialGroupRepository` |
| A6 | **Hardcode `COMMUNITY_HERO_IMAGES`** | `communityOverviewHelpers.ts:28-39` | P0.6 — `hero_image_url` em metadata |
| A7 | **Metadados inconsistentes** (`source` vs `provider`) | migrations `20260720100000` vs `20260609193000` | P0.4 — schema canônico unificado |
| A8 | **Código morto `public_navigation_enabled`** | migration `20260530120000:65` | P0.5 — remover |
| A9 | **Slug SQL inconsistente com JS** | `rpc_upsert_canonical_city_by_ibge` | P0.7 — NFD normalization |
| A10 | **`page_size: 5000` hardcoded** | `useUserTerritory.ts:115-116,145-146` | P3.3 — parâmetro configurável |
| A11 | **Hardcode `"/brasil"` como fallback de path** | `territory.ts:15` | P3.8 — derivado de config |
| A12 | **Dual resolution path para distritos** | `useResolveTerritoryFromUrl.ts:260-370` | P3.4 — unificar |

---

## 8. FLUXO OFICIAL

Toda página que exibe conteúdo territorial deve seguir este fluxo em 5 etapas. Nenhuma etapa pode ser pulada.

```
ETAPA 1: RESOLVER TERRITÓRIO
┌─────────────────────────────────────────────────────────────┐
│ useResolveTerritoryFromUrl()                                │
│                                                             │
│ URL → parsePublicTerritoryPath → city lookup →              │
│ group/district lookup → ResolvedTerritory                   │
│                                                             │
│ Output: { status, resolved, error }                         │
│ Status: idle | loading | resolved_location | resolved_group │
│         | not_found | inactive | restricted | error         │
│                                                             │
│ ⚠️  NUNCA pular esta etapa.                                 │
│ ⚠️  NUNCA usar URL diretamente para buscar conteúdo.        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
ETAPA 2: CARREGAR BOUNDARY (se aplicável)
┌─────────────────────────────────────────────────────────────┐
│ useTerritoryPolygon(resolved)                               │
│                                                             │
│ ResolvedTerritory → BoundaryService.getLocationBounds()     │
│                                                             │
│ Try 1: location_boundaries (custom)                         │
│ Try 2: locations.boundary (inline)                          │
│ Try 3: neighborhood_boundaries                              │
│ Try 4: ArcGIS FeatureServer (metadata source)               │
│ Fallback: resolveLocationCenter()                           │
│                                                             │
│ ⚠️  Se polygon = [], TerritoyLiveMap usa fallback visual    │
│     (círculo + label "demarcação em implantação").          │
│ ⚠️  NUNCA mostrar "Sem demarcação" como erro bloqueante.    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
ETAPA 3: RESOLVER CAPABILITIES
┌─────────────────────────────────────────────────────────────┐
│ Verificar metadados do território:                          │
│                                                             │
│ • is_navigable !== false → território acessível             │
│ • is_selector_active === true → aparece no seletor          │
│ • is_landing_enabled !== false → landing disponível         │
│                                                             │
│ ⚠️  Território inactive → TerritoryUnavailablePage          │
│ ⚠️  Território restricted → redirect ou mensagem            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
ETAPA 4: CARREGAR CONTEÚDO
┌─────────────────────────────────────────────────────────────┐
│ Com Territory resolvido:                                    │
│                                                             │
│ • useModuleTerritoryFilter() → TerritoryFilter              │
│ • Passar filter para serviços de conteúdo                   │
│ • Feed, businesses, events, alerts, etc.                    │
│                                                             │
│ ⚠️  NUNCA buscar conteúdo sem TerritoryFilter.              │
│ ⚠️  NUNCA usar string de URL como filtro.                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
ETAPA 5: RENDERIZAR TELA
┌─────────────────────────────────────────────────────────────┐
│ Com todos os dados:                                         │
│                                                             │
│ • TerritoryHomePage — layout completo                       │
│ • TerritoryLiveMap — mapa com demarcação                    │
│ • Nome do território via activeTerritory                    │
│ • URLs de navegação via territoryUrls.ts                    │
│                                                             │
│ ⚠️  NUNCA hardcodar nome de território na UI.               │
│ ⚠️  NUNCA montar URLs com template string.                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. CHECKLIST OBRIGATÓRIO PARA PULL REQUESTS

**Toda alteração em arquivos do domínio Territory** (`src/core/location/`, `src/core/geospatial/`, `src/core/routing/` relacionado a territory, `src/core/territorial/`, `src/core/maps/hooks/useTerritoryPolygon*`, `src/app/pages/Territory*`, `src/config/territory.ts`, migrations de locations/boundaries/groups) **deve responder obrigatoriamente a estas 8 perguntas no corpo do PR:**

| # | Pergunta | Se SIM, explicar |
|---|---|---|
| Q1 | **Quebra compatibilidade com dados existentes?** | Ex.: alterou `geographic_path` de um bairro existente? |
| Q2 | **Altera contrato de interface?** | Ex.: mudou `ILocationRepository`, `useActiveTerritory`, `TerritoryFilter`? |
| Q3 | **Adiciona hardcode de bairro, cidade ou estado?** | Ex.: novo literal `"salvador"`, `"pituba"`, `"/br/"` em código? |
| Q4 | **Cria duplicação de lógica existente?** | Ex.: novo slugify, novo normalizeText, novo parsePath? |
| Q5 | **Muda formato de URL territorial?** | Ex.: alterou `buildLocationBaseUrl`, `parsePublicTerritoryPath`? |
| Q6 | **Exige migration de banco?** | Se sim, a migration é idempotente (`ON CONFLICT DO UPDATE`)? |
| Q7 | **Exige atualização deste documento?** | Se sim, o PR inclui a atualização de `TERITORY-GOVERNANCE.md`? |
| Q8 | **Introduz consulta direta a tabela territory sem passar pelo repositório?** | Ex.: query direta a `locations`, `territorial_group_members`? |

**Regra de bloqueio**: Se Q1, Q4, Q5 ou Q8 = SIM sem justificativa aprovada, o PR é rejeitado automaticamente.

---

## 10. CRITÉRIOS PARA CONGELAMENTO DO DOMÍNIO

O domínio Territory será considerado **congelado** (modo de manutenção evolutiva) quando TODOS os critérios abaixo forem atendidos:

| # | Critério | Estado atual |
|---|---|---|
| C1 | `VITE_ENABLE_LOCATION_BOUNDARIES=true` em `.env.production` | 🔴 `false` → **P0.1** |
| C2 | `location_boundaries` populado com polígonos dos bairros de Salvador | 🔴 Vazia por ordem de migration errada → **P0.2** |
| C3 | Função `slugify` unificada em módulo shared único | 🔴 7 implementações duplicadas → **P0.3** |
| C4 | Schema de metadados unificado entre `locations` e `location_boundaries` | 🔴 Chaves inconsistentes → **P0.4** |
| C5 | Código morto `public_navigation_enabled` removido | 🔴 Presente → **P0.5** |
| C6 | `COMMUNITY_HERO_IMAGES` migrado para metadata (hardcode vira fallback) | 🔴 Hardcoded → **P0.6** |
| C7 | Algoritmo de slug consistente entre JS (NFD) e SQL (RPC) | 🔴 Inconsistente → **P0.7** |
| C8 | Nenhum `findAll()` em código de produção | 🟡 Presente mas não bloqueia Salvador (187 registros) → P1.4 |
| C9 | Fallback territorial funciona para qualquer cidade (não só Salvador) | 🟡 Restrito a Salvador → P1.3 |
| C10 | Coordenadas de fallback não são hardcoded | 🟡 `[-12.975, -38.476]` → P1.1 |
| C11 | `TerritoryType` suporta hierarquias não-brasileiras | 🟡 5 níveis fixos → P2.2 |
| C12 | `geographic_path` aceita caracteres não-ASCII | 🟡 Regex `[a-z0-9/-]` apenas → P2.1 |
| C13 | Mensagens de erro extraíveis para i18n | 🟡 Strings literais em português → P2.5 |
| C14 | Pipeline ETL automatizado para importação de boundaries | 🟡 100% manual → P2.4 |

---

## 11. ESTADO ATUAL E BLOQUEIOS PARA CONGELAMENTO

### Bloqueios críticos (impedem congelamento)

| # | Bloqueio | Roadmap | Impacto se não corrigido |
|---|---|---|---|
| B1 | `VITE_ENABLE_LOCATION_BOUNDARIES=false` | P0.1 | Nenhuma demarcação territorial funciona em produção |
| B2 | `location_boundaries` vazia | P0.2 | Mesmo com flag true, 4 bairros com polígonos não aparecem |
| B3 | 7 slugify duplicados | P0.3 | Risco de inconsistência entre módulos |
| B4 | `COMMUNITY_HERO_IMAGES` hardcoded | P0.6 | Cada bairro novo exige deploy de código |
| B5 | Metadados inconsistentes | P0.4 | Schema ambíguo, difícil para IA/ETL automatizar |
| B6 | Slug SQL vs JS inconsistente | P0.7 | Cidades criadas via RPC têm slug quebrado |
| B7 | Código morto em metadata | P0.5 | Poluição de schema, confusão para novos devs |

**Conclusão**: O domínio Territory **NÃO está maduro para entrar em modo de manutenção evolutiva**. Há 7 bloqueios concretos (todos P0) que precisam ser resolvidos antes do congelamento. Estes bloqueios não são hipotéticos — foram encontrados na auditoria e afetam diretamente a operação do produto para o lançamento de Salvador.

### O que NÃO é bloqueio para congelamento

- Expansão internacional (P2) — fora do escopo do MVP
- Cache distribuído (P3.1) — otimização, não correção
- i18n (P2.5) — MVP é pt-BR
- Pipeline ETL (P2.4) — bloqueia escala, não lançamento
- `findAll()` (F5) — seguro com 187 registros atuais
- Fallback Salvador-only (F4) — correto para o MVP mono-cidade
- Enum LocationType fixo (F6) — adequado para hierarquia brasileira

---

## 12. CICLO DE VIDA DO DOCUMENTO

| Evento | Ação |
|---|---|
| **Pull Request no domínio Territory** | Verificar Q7 do checklist. Se Q7=SIM, o PR DEVE incluir atualização deste documento. |
| **Nova cidade adicionada** | Atualizar `TERRITORY_CONFIG` no `.env`. NÃO alterar este documento. |
| **Novo TerritoryType adicionado** | Atualizar Seção 3.2 + Checklist. |
| **Nova regra inviolável descoberta** | Adicionar à Seção 6 + incrementar versão minor. |
| **Mudança de arquitetura (schema, contratos)** | Atualizar Seções 3-5 + incrementar versão major. |
| **Conclusão de todos os P0** | Atualizar Seção 11 + declarar domínio congelado. |

---

> **"O domínio Territory está maduro para entrar em modo de manutenção evolutiva?"**
>
> **NÃO.** Há 7 bloqueios concretos (todos P0 do roadmap) que precisam ser resolvidos:
>
> P0.1 — Ativar `VITE_ENABLE_LOCATION_BOUNDARIES=true`
> P0.2 — Corrigir ordem das migrations de boundary
> P0.3 — Unificar `normalizeText` em módulo shared
> P0.4 — Alinhar schema de metadados
> P0.5 — Remover código morto `public_navigation_enabled`
> P0.6 — Migrar `COMMUNITY_HERO_IMAGES` para metadata
> P0.7 — Corrigir slug SQL para ser consistente com JS
>
> Estes 7 itens **não são novos requisitos**. São correções de problemas concretos encontrados na auditoria arquitetural (TERRITORY.AUDIT.2). Nenhum deles requer re-arquitetura — são correções cirúrgicas de config, código morto, migrations idempotentes e centralização de funções duplicadas.
>
> Após a conclusão dos 7 P0, o domínio Territory estará maduro para modo de manutenção evolutiva. Os itens P1-P3 são melhorias progressivas que não bloqueiam o congelamento.
>
> **Estimativa**: ~4 dias de esforço para concluir todos os P0.
>
> **Próximo passo**: Iniciar Sprint TERRITORY.P0 — implementação dos 7 itens preparatórios para o lançamento de Salvador.
