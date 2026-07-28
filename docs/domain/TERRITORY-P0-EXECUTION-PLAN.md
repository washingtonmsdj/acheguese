# TERRITORY-P0-EXECUTION-PLAN.md — Plano de Implementação dos P0

**Sprint**: TERRITORY.P0.PLAN
**Data**: 2026-07-23
**Estado**: Plano técnico (pré-implementação)
**Base**: `TERRITORY-GOVERNANCE.md` + `TERRITORY-ROADMAP.md`

---

## Sumário Executivo

7 correções cirúrgicas, organizadas em 4 sprints independentes e sequenciais. Cada sprint é revisável, testável e reversível isoladamente. Nenhuma sprint altera mais de 5 arquivos.

| Sprint | Itens | Arquivos alterados | Esforço | Depende de |
|---|---|---|---|---|
| P0.A | P0.5, P0.6 | 3 | 1.5h | Nada |
| P0.B | P0.3 | 9 | 4h | P0.A |
| P0.C | P0.1, P0.2, P0.7 | 4 | 2h | P0.B |
| P0.D | P0.4 | 2-3 | 1h | P0.C |

---

## SPRINT P0.A — LIMPEZA DE CÓDIGO MORTO E HARDCODES

**Objetivo**: Eliminar poluição de código sem alterar comportamento. Sprint mais segura, sem riscos. Pode ser mergeada imediatamente.

**Dependências**: Nenhuma. Independente de todas as outras sprints.

---

### P0.5 — Remover código morto `public_navigation_enabled`

| Campo | Valor |
|---|---|
| **Roadmap ID** | P0.5 |
| **Origem** | H9 (audit) |
| **Esforço** | S — 30 min |
| **Risco** | 🟢 Nenhum — campo nunca lido por código |
| **Breaking** | ✅ Compatível |

**Arquivo alterado (1)**:
- `supabase/migrations/20260530120000_ensure_complexo_nordeste_membership.sql:65`

**O que muda**: Remover a linha `'public_navigation_enabled', true,` do `jsonb_build_object()` no INSERT do `territorial_groups`.

**Por que é seguro**: O campo NUNCA é lido por nenhum arquivo TypeScript. A navegabilidade real é controlada por `is_navigable` em `territoryVisibility.ts`. Removê-lo do seed não afeta dados já inseridos (a migration já rodou), mas impede que novos deploys criem o campo.

**Rollback**: Reverter a remoção da linha. Nenhum impacto em dados.

**Testes**:
- `npm run typecheck` deve passar (sem código TypeScript referenciando o campo)
- `npm run lint` deve passar
- Verificar que `territoryVisibility.ts` continua funcionando (campo `is_navigable` não é afetado)

**Critério de aceite**: Campo `public_navigation_enabled` removido do `jsonb_build_object` na migration. Nenhum novo warning de campo não utilizado.

---

### P0.6 — Migrar `COMMUNITY_HERO_IMAGES` para metadata

| Campo | Valor |
|---|---|
| **Roadmap ID** | P0.6 |
| **Origem** | H6 (audit) |
| **Esforço** | S — 1h |
| **Risco** | 🟢 Baixo — fallback mantido |
| **Breaking** | ✅ Compatível |

**Arquivos alterados (3)**:
1. `supabase/migrations/20260720100000_seed_salvador_neighborhoods_and_top15_communities.sql` — adicionar `hero_image_url` ao metadata dos 9 bairros que têm imagem
2. `src/core/community/components/page/communityOverviewHelpers.ts:28-39` — alterar `getHeroImage()` para ler `metadata.hero_image_url` com fallback
3. Nenhum novo arquivo criado

**O que muda**:

**No seed**: Para os 9 bairros que estão no `COMMUNITY_HERO_IMAGES` atual, adicionar ao `jsonb_build_object`:
```sql
jsonb_build_object(
  'source', 'geosalvador_2022',
  'official', true,
  'hero_image_url', '/src/assets/bairro-nordeste.jpg'  -- valor específico por bairro
)
```

Os 9 bairros e suas imagens:
| Slug | Imagem |
|---|---|
| barra | bairroOndina |
| chapada | bairroChapada |
| complexo-do-nordeste-de-amaralina | bairroNordeste |
| nordeste | bairroNordeste |
| ondina | bairroOndina |
| pituba | bairroPituba |
| rio-vermelho | bairroRioVermelho |
| santa-cruz | bairroSantaCruz |
| stiep | bairroStiep |
| vale-das-pedrinhas | bairroValePedrinhas |

**No componente**: Alterar a função que resolve a imagem:
```typescript
export function getHeroImage(
  slug: string,
  location?: Location | null
): string {
  // 1. Tenta metadata (caminho futuro)
  const metaUrl = location?.metadata?.hero_image_url;
  if (metaUrl && typeof metaUrl === 'string') return metaUrl;

  // 2. Fallback para o mapa hardcoded (legado, será removido em P3)
  return getRecordValue(COMMUNITY_HERO_IMAGES, slug) ?? neighborhoodFeatured;
}
```

**Por que é seguro**: Se `metadata.hero_image_url` existir, usa. Se não, cai no hardcode existente. Comportamento idêntico para todos os bairros atuais. Novos bairros podem ser adicionados apenas com seed SQL.

**Rollback**: Reverter a função `getHeroImage` para usar apenas `COMMUNITY_HERO_IMAGES`. As imagens continuam funcionando (o hardcode ainda existe).

**Testes**:
- `npm run typecheck`
- `npm run lint`
- Verificar que os 9 bairros atuais mostram a mesma imagem de antes
- Simular um novo bairro sem entry no `COMMUNITY_HERO_IMAGES` mas com `hero_image_url` no metadata — deve mostrar a imagem do metadata

**Critério de aceite**: Adicionar um bairro com `hero_image_url` no metadata NÃO requer alterar `communityOverviewHelpers.ts`.

---

## SPRINT P0.B — UNIFICAÇÃO DE SLUGIFY

**Objetivo**: Centralizar a lógica de geração de slugs territoriais, eliminando 7 implementações duplicadas. Esta é a sprint de maior esforço, mas ainda puramente TypeScript — sem SQL.

**Dependências**: P0.A (limpeza prévia evita conflitos)

---

### P0.3 — Unificar `normalizeText`/`slugify` em módulo shared

| Campo | Valor |
|---|---|
| **Roadmap ID** | P0.3 |
| **Origem** | F2 parcial, A1 (audit) |
| **Esforço** | M — 4h |
| **Risco** | 🟢 Baixo — mesmo algoritmo, apenas centralizado |
| **Breaking** | ✅ Compatível |

**Arquivos alterados (9)**:
1. **NOVO** `src/shared/utils/slugify.ts` — função canônica única
2. `src/core/location/services/LocationGeocodingService.ts:158` — importar do shared
3. `src/core/geospatial/services/BoundaryService.ts:115` — importar do shared
4. `src/core/location/hooks/useUserTerritory.ts:89` — importar do shared (função `normalizeText`)
5. `src/core/location/hooks/useUserTerritory.ts:96` — importar do shared (função `slugifyText`)
6. `src/core/routing/utils/publicTerritoryFallbacks.ts:20` — importar do shared (função `normalizeSegment`)
7. `src/core/classifieds/services/ClassifiedUrlService.ts:107` — importar do shared
8. `src/core/guide/tourist-points/services/TouristPointService.ts:82` — importar do shared
9. `src/modules/business/education/pages/explorerFilters.ts:58` — importar do shared

**Arquivo NOVO — `src/shared/utils/slugify.ts`**:
```typescript
/**
 * Gera slug canônico para territórios.
 * Preserva apenas caracteres alfanuméricos e hífens.
 * Remove acentos via NFD normalization.
 *
 * ⚠️ Este algoritmo é temporário para o MVP brasileiro.
 * P1.2 implementará suporte a Unicode para escala internacional.
 *
 * Regra de governança: TODA geração de slug territorial DEVE usar esta função.
 * É proibido implementar slugify localmente em qualquer módulo.
 */
export function slugifyTerritory(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')    // remove diacritics
    .replace(/[^a-z0-9\s-]/g, ' ')      // replace non-alnum with space
    .replace(/[\s_-]+/g, '-')           // collapse separators to single hyphen
    .replace(/^-+|-+$/g, '');           // trim leading/trailing hyphens
}

/**
 * Normaliza texto para comparação (não gera slug).
 * Preserva espaços, útil para matching de nomes.
 */
export function normalizeTerritoryText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/[\s_-]+/g, ' ')
    .trim();
}
```

**Mapeamento de substituições**:

| Arquivo | Função atual | Substituir por |
|---|---|---|
| `LocationGeocodingService.ts` | `normalizeText()` interna | `normalizeTerritoryText()` |
| `BoundaryService.ts` | `normalizeText()` interna | `normalizeTerritoryText()` |
| `useUserTerritory.ts:89` | `normalizeText()` interna | `normalizeTerritoryText()` |
| `useUserTerritory.ts:96` | `slugifyText()` interna | `slugifyTerritory()` |
| `publicTerritoryFallbacks.ts` | `normalizeSegment()` interna | `slugifyTerritory()` |
| `ClassifiedUrlService.ts` | `slugify()` interna | `slugifyTerritory()` |
| `TouristPointService.ts` | `slugify()` interna | `slugifyTerritory()` |
| `explorerFilters.ts` | `.normalize('NFD')...` inline | `normalizeTerritoryText()` |

**Por que é seguro**: Algoritmo idêntico — apenas movido para local central. `slugifyTerritory()` combina a lógica de `normalizeSegment` (a mais completa) como canônica. Testes de regressão devem confirmar outputs idênticos.

**Rollback**: Reverter imports para as funções locais originais (todas ainda existem no histórico git).

**Testes**:
- `npm run typecheck`
- `npm run lint`
- Verificar que `slugifyTerritory("São Paulo") === "sao-paulo"`
- Verificar que `slugifyTerritory("Complexo do Nordeste de Amaralina") === "complexo-do-nordeste-de-amaralina"`
- Verificar que `slugifyTerritory("Vale das Pedrinhas") === "vale-das-pedrinhas"`
- Rodar testes existentes: slugs de URL não devem mudar

**Critério de aceite**: Nenhum arquivo fora de `src/shared/utils/slugify.ts` contém implementação própria de slugify/normalizeText para territórios.

---

## SPRINT P0.C — ATIVAÇÃO DE BOUNDARIES

**Objetivo**: Fazer as demarcações territoriais funcionarem em produção. Esta sprint depende de P0.B porque P0.3 pode alterar BoundaryService. É a sprint mais impactante — resolve o problema central do usuário.

**Dependências**: P0.B (BoundaryService é alterado em P0.3)

---

### P0.1 — Ativar `VITE_ENABLE_LOCATION_BOUNDARIES=true`

| Campo | Valor |
|---|---|
| **Roadmap ID** | P0.1 |
| **Origem** | M9 (audit) |
| **Esforço** | S — 15 min |
| **Risco** | 🟢 Baixo — idempotente |
| **Breaking** | ✅ Compatível |

**Arquivos alterados (2)**:
1. `.env.production:36` — `VITE_ENABLE_LOCATION_BOUNDARIES=false` → `true`
2. `.env.example:44` — `VITE_ENABLE_LOCATION_BOUNDARIES="false"` → `"true"`

**O que muda**: A flag controla `BoundaryService.getCustomBoundary()`. Com `true`, o serviço consulta a tabela `location_boundaries`. Se a tabela estiver vazia (ver P0.2), o serviço retorna `null` e cai nos fallbacks seguintes (`getInlineLocationBoundary` → `getNeighborhoodBoundary` → `getMetadataSourceBoundary` → `resolveLocationCenter`). Nenhum crash.

**Por que é seguro**: A flag só habilita uma consulta que já existe no código. A tabela `location_boundaries` já existe (criada em `20260609193000`). O RLS já permite leitura pública. O `ON CONFLICT DO UPDATE` no seed garante idempotência quando P0.2 popular a tabela.

**Rollback**: Trocar `true` de volta para `false`. Imediato, sem impacto.

**Testes**:
- Deploy em staging com flag `true`
- Verificar que `BoundaryService.getCustomBoundary()` tenta consultar `location_boundaries`
- Se tabela vazia, verificar que fallback funciona (retorna centro apenas)
- Sem crash, sem warning novo

**Critério de aceite**: Flag `true` em ambos os arquivos. `BoundaryService` compila e executa sem erros.

---

### P0.2 — Corrigir ordem das migrations de boundary

| Campo | Valor |
|---|---|
| **Roadmap ID** | P0.2 |
| **Origem** | H11 (audit) |
| **Esforço** | S — 45 min |
| **Risco** | 🟡 Médio — migration nova, mas idempotente |
| **Breaking** | ✅ Compatível — `ON CONFLICT DO UPDATE` |

**Arquivos alterados (1)**:
1. **NOVA** `supabase/migrations/20260724000000_repair_location_boundaries_complexo.sql`

**Conteúdo da nova migration**:
```sql
-- Repara location_boundaries após seed de bairros de Salvador.
-- A migration original (20260609193000) rodou antes do seed de bairros
-- (20260720100000), então o JOIN não encontrou as locations.
-- Esta migration re-aplica o INSERT com ON CONFLICT DO UPDATE.
-- É 100% idempotente: pode rodar múltiplas vezes sem duplicar dados.

BEGIN;

WITH boundary_seed(geographic_path, source_object_id, center_lat, center_lng, boundary) AS (
  VALUES
  ('/br/ba/salvador/chapada-do-rio-vermelho', '54', -13.00516291, -38.48064788,
   $geojson_54$...$geojson_54$),
  ('/br/ba/salvador/nordeste-de-amaralina', '112', -13.00912935, -38.47367582,
   $geojson_112$...$geojson_112$),
  ('/br/ba/salvador/santa-cruz', '142', -13.00369176, -38.47539865,
   $geojson_142$...$geojson_142$),
  ('/br/ba/salvador/vale-das-pedrinhas', '163', -13.00852241, -38.48035290,
   $geojson_163$...$geojson_163$)
),
matched_locations AS (
  SELECT
    locations.id AS location_id,
    boundary_seed.geographic_path,
    boundary_seed.source_object_id,
    boundary_seed.center_lat,
    boundary_seed.center_lng,
    boundary_seed.boundary
  FROM boundary_seed
  JOIN public.locations
    ON locations.geographic_path = boundary_seed.geographic_path
   AND locations.status = 'active'
)
INSERT INTO public.location_boundaries (
  location_id, boundary, center_lat, center_lng,
  source, source_url, source_object_id, metadata
)
SELECT
  matched_locations.location_id,
  matched_locations.boundary,
  matched_locations.center_lat,
  matched_locations.center_lng,
  'GeoSalvador bairros_app_dados_2010_e_2022',
  'https://services6.arcgis.com/GP5qdNaePRPh2SdT/arcgis/rest/services/bairros_app_dados_2010_e_2022/FeatureServer/0',
  matched_locations.source_object_id,
  jsonb_build_object(
    'source_name', 'GeoSalvador',
    'source_level', 'municipal_neighborhood',
    'source_url', 'https://services6.arcgis.com/GP5qdNaePRPh2SdT/arcgis/rest/services/bairros_app_dados_2010_e_2022/FeatureServer/0',
    'source_object_id', matched_locations.source_object_id,
    'official', true,
    'geometry_format', 'GeoJSON',
    'geographic_path', matched_locations.geographic_path
  )
FROM matched_locations
ON CONFLICT (location_id) DO UPDATE
SET
  boundary = EXCLUDED.boundary,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng,
  source = EXCLUDED.source,
  source_url = EXCLUDED.source_url,
  source_object_id = EXCLUDED.source_object_id,
  metadata = public.location_boundaries.metadata || EXCLUDED.metadata,
  updated_at = now();

COMMIT;
```

**Nota**: Os `$geojson_*$` placeholders devem ser substituídos pelos GeoJSON literais EXATOS da migration original `20260609193000`. A migration original NÃO deve ser alterada — apenas referenciada.

**Por que é seguro**: `ON CONFLICT (location_id) DO UPDATE` garante idempotência. Se a migration original já tiver populado os dados (improvável devido ao bug de ordem, mas possível em bancos que aplicaram migrations em ordem não-cronológica), o UPDATE é inócuo. O JOIN agora encontra as locations porque o timestamp é posterior ao seed de bairros.

**Rollback**: A migration não tem `DOWN`. Para reverter, executar:
```sql
DELETE FROM public.location_boundaries WHERE source_object_id IN ('54', '112', '142', '163');
```
Ou simplesmente não aplicar a migration (a tabela continua vazia, como está hoje).

**Testes**:
- Rodar migration em banco local com seed completo
- `SELECT COUNT(*) FROM location_boundaries` → deve retornar 4
- `SELECT location_id, source_object_id FROM location_boundaries` → verificar IDs corretos
- Rodar migration novamente → sem erros, sem duplicação (ON CONFLICT funciona)
- `npm run typecheck` (a migration é SQL puro, não afeta TypeScript)

**Critério de aceite**: 4 bairros (`chapada-do-rio-vermelho`, `nordeste-de-amaralina`, `santa-cruz`, `vale-das-pedrinhas`) com demarcação visível no hero do mapa em staging.

---

### P0.7 — Corrigir slug SQL para ser consistente com JS

| Campo | Valor |
|---|---|
| **Roadmap ID** | P0.7 |
| **Origem** | F7 (audit) |
| **Esforço** | S — 30 min |
| **Risco** | 🟢 Baixo — afeta apenas novas inserções |
| **Breaking** | ⚠️ Migration — altera RPC existente |

**Arquivos alterados (1)**:
1. `supabase/migrations/20260526100000_fix_city_slug_normalization.sql` — NOVA migration corrigindo o RPC

**O que muda**: A RPC `rpc_upsert_canonical_city_by_ibge` (definida em `20260514091500:112-221`) gera slugs com `regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')` sem NFD normalization. Para `São Paulo`, o SQL gera `s-o-paulo` (o `ã` vira hífen extra) enquanto o JS gera `sao-paulo`.

**Nova migration** (timestamp > P0.2):
```sql
-- Corrige geração de slug na RPC de upsert de cidades
-- para ser consistente com slugifyTerritory() do frontend.
-- Usa extensão unaccent() para normalização NFD no PostgreSQL.

CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION public.rpc_upsert_canonical_city_by_ibge(
  p_state_code TEXT,
  p_city_name TEXT,
  p_ibge_code TEXT
)
RETURNS TABLE (
  city_id UUID,
  state_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_state_code TEXT;
  v_city_name TEXT;
  v_ibge_code TEXT;
  v_state_id UUID;
  v_city_id UUID;
  v_city_slug TEXT;
BEGIN
  -- ... (mesmo corpo da RPC original, apenas alterando a linha do slug) ...

  -- ANTES: v_city_slug := regexp_replace(lower(v_city_name), '[^a-z0-9]+', '-', 'g');
  -- DEPOIS:
  v_city_slug := regexp_replace(
    lower(public.unaccent(v_city_name)),
    '[^a-z0-9]+', '-', 'g'
  );

  -- ... (resto do corpo idêntico) ...
END;
$$;
```

**Nota**: A migration deve conter o corpo COMPLETO da RPC (CREATE OR REPLACE), não apenas um diff. Isso garante que a função seja substituída atomicamente.

**Por que é seguro**: `unaccent('São Paulo')` → `'Sao Paulo'`. Após `lower()` e `regexp_replace`, resulta em `sao-paulo` — idêntico ao JS. A extensão `unaccent` é padrão no PostgreSQL e está disponível no Supabase. Se não estiver, o `CREATE EXTENSION IF NOT EXISTS` resolve.

**Rollback**: Reverter para a versão anterior da RPC (restaurar de `20260514091500`).

**Testes**:
- `SELECT unaccent('São Paulo')` → `'Sao Paulo'`
- `SELECT regexp_replace(lower(unaccent('São Paulo')), '[^a-z0-9]+', '-', 'g')` → `'sao-paulo'`
- `SELECT regexp_replace(lower(unaccent('Brasília')), '[^a-z0-9]+', '-', 'g')` → `'brasilia'`
- `SELECT regexp_replace(lower(unaccent('Belém')), '[^a-z0-9]+', '-', 'g')` → `'belem'`
- Rodar `npm run typecheck` (RPC é SQL, sem impacto TypeScript)
- Verificar que cidades existentes com acento no nome ainda funcionam (slug armazenado não muda)

**Critério de aceite**: `slugifyTerritory("São Paulo")` (JS) === slug gerado pela RPC (SQL). Ambos = `"sao-paulo"`.

---

## SPRINT P0.D — ALINHAMENTO DE METADADOS

**Objetivo**: Padronizar schema de metadados entre `locations` e `location_boundaries`. Sprint mais leve, puramente de padronização.

**Dependências**: P0.C (P0.2 criou a nova migration; os metadados já estão no formato novo)

---

### P0.4 — Alinhar schema de metadados

| Campo | Valor |
|---|---|
| **Roadmap ID** | P0.4 |
| **Origem** | H8 (audit) |
| **Esforço** | S — 1h |
| **Risco** | 🟢 Baixo — adiciona chaves, não remove |
| **Breaking** | ✅ Compatível |

**Arquivos alterados (2-3)**:
1. `supabase/migrations/20260720100000_seed_salvador_neighborhoods_and_top15_communities.sql` — atualizar `jsonb_build_object` dos 170 bairros
2. `supabase/migrations/20260609193000_create_location_boundaries_seed_complexo.sql` — atualizar `jsonb_build_object` do metadata (opcional, pois P0.2 já usa schema novo)
3. `docs/domain/TERRITORY-GOVERNANCE.md` — Seção 3.3 (Boundary), atualizar schema de metadata documentado

**Schema canônico unificado**:
```json
{
  "source_name": "GeoSalvador",
  "source_level": "municipal_neighborhood",
  "source_url": "https://services6.arcgis.com/...",
  "source_object_id": "112",
  "official": true,
  "last_imported_at": "2026-07-23T00:00:00Z"
}
```

**O que muda — `locations.metadata`**:
```sql
-- ANTES:
jsonb_build_object('source','geosalvador_2022','official',true)

-- DEPOIS:
jsonb_build_object(
  'source_name', 'geosalvador_2022',
  'source_level', 'municipal_neighborhood',
  'official', true
)
```

**O que muda — `location_boundaries.metadata`**:
Já está no formato novo (aplicado em P0.2). A migration original `20260609193000` pode ser atualizada para consistência documental, mas não é obrigatório — a nova migration P0.2 já escreve no formato correto.

**Mapeamento de chaves antigas → novas**:

| Chave antiga (`locations`) | Chave antiga (`boundaries`) | Chave canônica |
|---|---|---|
| `source` | `provider` | `source_name` |
| — | `source_level` | `source_level` |
| — | `source_url` (no metadata) | `source_url` |
| — | `source_object_id` (no metadata) | `source_object_id` |
| `official` | — | `official` |
| — | `geometry_format` | `geometry_format` |
| — | `geographic_path` (no metadata) | `geographic_path` |
| — | — | `last_imported_at` |

**Por que é seguro**: Apenas ADICIONA chaves ao `jsonb_build_object`. Nenhuma chave existente é removida. Código que lê `metadata->>'source'` continua funcionando (a chave antiga permanece). Código NOVO deve usar `metadata->>'source_name'`.

**Rollback**: Reverter o `jsonb_build_object` ao formato anterior. Dados já inseridos não são afetados (migration já rodou).

**Testes**:
- `npm run typecheck`
- `npm run lint`
- Verificar que `locations.metadata->>'source'` ainda funciona (chave antiga mantida para compatibilidade)
- Verificar que `locations.metadata->>'source_name'` retorna o mesmo valor

**Critério de aceite**: `locations.metadata` e `location_boundaries.metadata` usam as mesmas chaves para os mesmos conceitos. Documentação atualizada em `TERITORY-GOVERNANCE.md:3.3`.

---

## ORDEM DE EXECUÇÃO E DEPENDÊNCIAS

```
P0.A (P0.5 + P0.6)
  │  2 arquivos + 1 seed
  │  1.5h
  │  Zero dependências
  │
  ├──► P0.B (P0.3)
  │     1 novo + 8 edits
  │     4h
  │     Depende: P0.A (limpeza prévia)
  │
  ├──► P0.C (P0.1 + P0.2 + P0.7)
  │     2 env + 2 migrations
  │     2h
  │     Depende: P0.B (BoundaryService importa slugify)
  │
  └──► P0.D (P0.4)
        2 seeds + 1 doc
        1h
        Depende: P0.C (P0.2 já usa schema novo)
```

**P0.A e P0.B podem ser desenvolvidas em paralelo** (arquivos diferentes, sem conflito).
**P0.C e P0.D são sequenciais** (dependem de P0.A+P0.B mergeados).

---

## RESUMO DE ARQUIVOS POR SPRINT

| Sprint | Arquivos | Tipo |
|---|---|---|
| **P0.A** | `20260530120000` (edit), `20260720100000` (edit), `communityOverviewHelpers.ts` (edit) | 1 migration edit, 1 seed edit, 1 TS |
| **P0.B** | `slugify.ts` (novo), `LocationGeocodingService.ts`, `BoundaryService.ts`, `useUserTerritory.ts` (×2), `publicTerritoryFallbacks.ts`, `ClassifiedUrlService.ts`, `TouristPointService.ts`, `explorerFilters.ts` | 1 novo, 8 edits |
| **P0.C** | `.env.production`, `.env.example`, `20260724000000` (nova migration), `20260725000000` (nova migration) | 2 env, 2 novas migrations |
| **P0.D** | `20260720100000` (edit metadata), `20260609193000` (edit metadata — opcional), `TERRITORY-GOVERNANCE.md` (update) | 2 seed edits, 1 doc |
| **TOTAL** | **14-15 arquivos** | **2 novos, 10-11 edits, 2 novas migrations** |

---

## CRITÉRIOS DE SUCESSO GLOBAIS (PÓS P0.D)

1. ✅ `VITE_ENABLE_LOCATION_BOUNDARIES=true` em `.env.production`
2. ✅ `location_boundaries` contém 4 registros (bairros do complexo)
3. ✅ Mapa do hero mostra demarcação dos 4 bairros em staging
4. ✅ `slugifyTerritory("São Paulo") === "sao-paulo"` — JS e SQL consistentes
5. ✅ Nenhuma implementação duplicada de slugify fora de `src/shared/utils/slugify.ts`
6. ✅ `COMMUNITY_HERO_IMAGES` é fallback, não fonte primária
7. ✅ Metadados de `locations` e `location_boundaries` usam schema unificado
8. ✅ `npm run typecheck` passa
9. ✅ `npm run lint` passa
10. ✅ `TERRITORY-GOVERNANCE.md` atualizado com status "congelado"

---

## RISCOS AGREGADOS

| Risco | Probabilidade | Mitigação |
|---|---|---|
| `unaccent` não disponível no Supabase | Baixa (extensão padrão PostgreSQL) | `CREATE EXTENSION IF NOT EXISTS` — falha silenciosa se ausente, RPC mantém comportamento antigo |
| Migration P0.2 com GeoJSON quebrado | Baixa (cópia exata da original) | Validar GeoJSON com `ST_IsValid` antes do INSERT |
| `BoundaryService` quebrar com flag `true` | Muito baixa (código já existe, só não era chamado) | Testar em staging antes de production |
| `getHeroImage` causar regressão visual | Muito baixa (fallback preservado) | Teste visual nos 9 bairros |
| Arquivo `slugify.ts` importado com path errado | Baixa | Typecheck pega antes do merge |

---

## PRIMEIRA SPRINT

**Sprint P0.A — Limpeza de código morto e hardcodes.**

**Itens**: P0.5 (remover `public_navigation_enabled`) + P0.6 (migrar `COMMUNITY_HERO_IMAGES` para metadata)

**Justificativa**:
1. **Risco zero**: remove código morto e adiciona fallback — não altera comportamento visível
2. **Zero dependências**: não depende de nenhuma outra sprint
3. **1.5h de esforço**: a sprint mais rápida, entrega valor imediato
4. **Desbloqueia P0.B**: limpa o terreno para a sprint seguinte (unificação de slugify)
5. **Revisável em 15 minutos**: 3 arquivos, mudanças mínimas
6. **Testável em 5 minutos**: typecheck + lint + smoke test visual

**Após P0.A**, o domínio já está mais limpo e sem código morto. A sprint seguinte (P0.B) pode ser iniciada imediatamente.
