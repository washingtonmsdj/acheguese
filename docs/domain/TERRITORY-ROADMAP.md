# TERRITORY.ROADMAP.md — Plano de Execução do Domínio Territory

**Origem**: `docs/domain/TERRITORY-ENTERPRISE-AUDIT.md` (Sprint TERRITORY.AUDIT.2)
**Data**: 2026-07-23
**Estado**: Backlog priorizado de 29 itens, agrupados por fase de execução.

---

## Legenda

| Campo | Valores |
|---|---|
| **Prioridade** | P0 (bloqueia lançamento de Salvador) / P1 (bloqueia segunda cidade) / P2 (bloqueia expansão internacional) / P3 (melhoria contínua) |
| **Esforço** | S (≤2h) / M (1-2 dias) / L (3-5 dias) / XL (1-2 sprints) |
| **Risco** | 🟢 Baixo / 🟡 Médio / 🔴 Alto |
| **Breaking** | ✅ Compatível (sem quebra) / ⚠️ Precisa de migration / 🔴 Quebra contrato existente |
| **Origem** | F1-F7 (Critical), H1-H11 (High), M1-M11 (Medium) do audit |

---

## FASE 0 — P0: PRÉ-LANÇAMENTO DE SALVADOR (Sprint atual + próxima)

**Objetivo**: Remover bloqueios que impedem a demarcação territorial de funcionar em produção e eliminar inconsistências visíveis ao usuário.

Itens que NÃO envolvem mudança de schema nem re-arquitetura — apenas correções de config, código morto e pequenas migrações.

### P0.1 — Ativar `VITE_ENABLE_LOCATION_BOUNDARIES=true`
- **Origem**: M9
- **Arquivos**: `.env.production:36`, `.env.example:44`
- **Esforço**: S
- **Risco**: 🟢 Baixo — tabela já existe, RLS já configurado
- **Dependências**: Nenhuma
- **Breaking**: ✅ Compatível
- **Pré/pós Salvador**: Pré — sem isso, nenhuma boundary aparece em produção
- **Descrição**: Trocar `false` por `true` nos dois arquivos. A flag controla `BoundaryService.getCustomBoundary()`. Se a tabela `location_boundaries` estiver vazia (ver P0.2), a flag ativada não quebra nada — o serviço simplesmente retorna `null` e cai nos fallbacks seguintes.

### P0.2 — Corrigir ordem das migrations de boundary
- **Origem**: H11
- **Arquivos**: migrations `20260609193000` vs `20260720100000`
- **Esforço**: S
- **Risco**: 🟡 Médio — migration já rodou, precisa de nova com timestamp correto
- **Dependências**: P0.1 (a flag precisa estar ativa para a tabela ser consultada)
- **Breaking**: ✅ Compatível — migration usa `ON CONFLICT DO UPDATE`, idempotente
- **Pré/pós Salvador**: Pré — sem isso, `location_boundaries` fica vazia mesmo com a flag ativa
- **Descrição**: O seed de boundaries (`20260609193000`, Jun 9) roda ANTES do seed de bairros (`20260720100000`, Jul 20). O JOIN não encontra locations → tabela fica vazia. Criar nova migration com timestamp > `20260720100000` que re-executa o `INSERT INTO location_boundaries ... ON CONFLICT DO UPDATE` a partir dos mesmos 4 polígonos GeoJSON. A migration existente não precisa ser alterada — a nova migration apenas "re-apply" os dados.

### P0.3 — Unificar `normalizeText` em módulo shared
- **Origem**: F2 (parcial)
- **Arquivos**: 7 implementações duplicadas em `ClassifiedUrlService.ts`, `TouristPointService.ts`, `CidadeLandingPage.tsx`, `useUserTerritory.ts` (×2), `publicTerritoryFallbacks.ts`, `LocationGeocodingService.ts`
- **Esforço**: M
- **Risco**: 🟢 Baixo — extrair para shared, manter assinatura idêntica
- **Dependências**: Nenhuma
- **Breaking**: ✅ Compatível — mesmo comportamento, só elimina duplicação
- **Pré/pós Salvador**: Pré — reduz superfície de manutenção antes do lançamento
- **Descrição**: Criar `src/shared/utils/slugify.ts` com função única `slugifyTerritory(text: string): string`. Substituir as 7 implementações por imports. Não alterar o algoritmo NFD — apenas centralizar. A correção do algoritmo (para suportar Unicode) fica para P1.2.

### P0.4 — Alinhar schema de metadados entre `locations` e `location_boundaries`
- **Origem**: H8
- **Arquivos**: migrations `20260720100000` e `20260609193000`
- **Esforço**: S
- **Risco**: 🟢 Baixo — apenas documentar e alinhar
- **Dependências**: P0.2
- **Breaking**: ✅ Compatível — adicionar chaves, não remover
- **Pré/pós Salvador**: Pré — evita débito técnico desde o início
- **Descrição**: Padronizar chaves nos dois metadados JSONB. Proposta de schema canônico:
  ```json
  {
    "source_name": "GeoSalvador",
    "source_level": "municipal_neighborhood",
    "source_url": "https://...",
    "source_object_id": "112",
    "official": true,
    "last_imported_at": "2026-07-23T00:00:00Z"
  }
  ```
  Adicionar migration que atualiza os metadados existentes para o novo formato, mantendo compatibilidade com código que lê as chaves antigas via `COALESCE`.

### P0.5 — Remover código morto `public_navigation_enabled`
- **Origem**: H9
- **Arquivos**: migration `20260530120000:65`, código TypeScript (nenhum consumidor)
- **Esforço**: S
- **Risco**: 🟢 Baixo — campo nunca lido
- **Dependências**: Nenhuma
- **Breaking**: ✅ Compatível — remover campo não lido
- **Pré/pós Salvador**: Pré — limpeza
- **Descrição**: Remover a chave `public_navigation_enabled` do metadata seed na migration `20260530120000`. O campo real usado é `is_navigable` em `territoryVisibility.ts`. Não requer nova migration — apenas remover do seed existente (que já rodou, mas evita confusão futura).

### P0.6 — Migrar `COMMUNITY_HERO_IMAGES` para metadata
- **Origem**: H6
- **Arquivos**: `communityOverviewHelpers.ts:28-39`
- **Esforço**: S
- **Risco**: 🟢 Baixo — fallback mantido
- **Dependências**: Nenhuma
- **Breaking**: ✅ Compatível — adiciona campo, mantém fallback
- **Pré/pós Salvador**: Pré — adicionar bairro não deve exigir deploy de código
- **Descrição**: Adicionar campo `hero_image_url` ao metadata das locations dos 9 bairros atuais. No componente, tentar `location.metadata?.hero_image_url` primeiro; se ausente, cair no `COMMUNITY_HERO_IMAGES` existente como fallback. Assim o hardcode vira fallback legado, não bloqueio.

### P0.7 — Corrigir slug SQL para ser consistente com JS
- **Origem**: F7
- **Arquivos**: `rpc_upsert_canonical_city_by_ibge` (migration `20260514091500:173`)
- **Esforço**: S
- **Risco**: 🟢 Baixo — slugs existentes não são afetados
- **Dependências**: Nenhuma
- **Breaking**: ⚠️ Migration — alterar RPC
- **Pré/pós Salvador**: Pré — evita slugs inconsistentes desde o primeiro dia
- **Descrição**: Alterar a RPC para aplicar NFD normalization antes do `regexp_replace`:
  ```sql
  regexp_replace(
    lower(public.normalize_text(v_city_name)),
    '[^a-z0-9]+', '-', 'g'
  )
  ```
  Precisa criar função auxiliar `normalize_text` que faz NFD em PL/pgSQL, ou usar `unaccent()` se a extensão estiver disponível.

---

## FASE 1 — P1: ANTES DA SEGUNDA CIDADE (2-3 sprints)

**Objetivo**: Preparar a arquitetura para suportar qualquer cidade brasileira sem alterações de código. Resolver débitos estruturais que impedem escala dentro do Brasil.

### P1.1 — Corrigir fallback universal centrado em Salvador
- **Origem**: F3
- **Arquivos**: `BoundaryService.ts:155`, `useNeighborhoodBounds.ts:41`
- **Esforço**: M
- **Risco**: 🟡 Médio — muda comportamento de fallback
- **Dependências**: Nenhuma
- **Breaking**: ⚠️ Comportamento — fallback muda de coordenadas, mas sem quebra de contrato
- **Pré/pós Salvador**: Pós — Salvador é a única cidade atualmente, então o fallback atual é correto para o MVP
- **Descrição**: Substituir `FALLBACK_CENTER` hardcoded por `resolveFallbackCenter(countryCode?: string)`. A função lê `VITE_DEFAULT_MAP_LATITUDE`/`VITE_DEFAULT_MAP_LONGITUDE` do ambiente. Se não configurado, usa centróide do país via `DEFAULT_COUNTRY_CENTROIDS` map (pequeno, estático, com coordenadas dos ~20 países mais prováveis). Se país não estiver no mapa, usa `[0, 0]` com zoom muito baixo (mundo inteiro visível) em vez de Salvador.

### P1.2 — Corrigir algoritmo de slug para preservar Unicode
- **Origem**: F2 (completo)
- **Arquivos**: `src/shared/utils/slugify.ts` (criado em P0.3) + 7 consumers
- **Esforço**: L
- **Risco**: 🟡 Médio — slugs existentes podem mudar para cidades com acentos
- **Dependências**: F1 (CHECK constraint do banco precisa ser relaxado primeiro — ver P2.1)
- **Breaking**: ⚠️ Slugs de cidades com acento mudam. Precisa de migration de `geographic_path` para cidades brasileiras afetadas.
- **Pré/pós Salvador**: Pós — cidades brasileiras já têm slugs ASCII (os acentos foram stripados). A mudança afeta apenas novas cidades.
- **Descrição**: Alterar `slugifyTerritory` para:
  1. Preservar caracteres Unicode (não fazer `/[^a-z0-9]/g`)
  2. Apenas substituir espaços e caracteres especiais de URL (`/`, `?`, `#`, `&`) por hífen
  3. Manter NFD normalization para consistência de busca (mas não para o slug armazenado)

### P1.3 — Substituir fallback Salvador-only por fallback dinâmico
- **Origem**: F4
- **Arquivos**: `publicTerritoryFallbacks.ts:142`
- **Esforço**: M
- **Risco**: 🟡 Médio — fallback atual é rígido mas previsível
- **Dependências**: Nenhuma
- **Breaking**: ⚠️ Comportamento do fallback muda
- **Pré/pós Salvador**: Pós — Salvador é a única cidade com fallback atualmente
- **Descrição**: Remover a guarda `state !== "ba" || city !== "salvador"`. Criar fallback genérico que:
  1. Tenta resolver via `TERRITORY_CONFIG.launch` (env vars)
  2. Se launch != cidade atual, retorna redirect para launch
  3. Se launch == cidade atual (fallback local), retorna `ResolvedTerritory` com a cidade

### P1.4 — Substituir `findAll()` por queries filtradas
- **Origem**: F5
- **Arquivos**: `LocationRepositorySupabase.ts:183-204`, `LocationGeocodingService.ts:642-755`, `BoundaryService.ts:690-737`
- **Esforço**: L
- **Risco**: 🔴 Alto — muda padrão de cache inteiro
- **Dependências**: Nenhuma
- **Breaking**: ✅ Compatível — mudança interna, mesma interface
- **Pré/pós Salvador**: Pós — com apenas ~200 locations (Brasil + 170 bairros + 27 estados), `findAll()` funciona bem
- **Descrição**:
  1. Adicionar `findByCountry(countryCode: string)` ao `ILocationRepository`
  2. Alterar `buildTerritoryIndex()` para usar `findByCountry` em vez de `findAll()`
  3. Unificar os dois índices (`LocationGeocodingService` + `BoundaryService`) em um único `TerritoryIndexService` compartilhado, eliminando a duplicação de memória
  4. Manter `findAll()` como método legado com warning de depreciação

### P1.5 — Adicionar `valid_from`/`valid_to` e `replaced_by_id` ao schema
- **Origem**: H1
- **Arquivos**: migration nova + `types/index.ts:29-41`
- **Esforço**: M
- **Risco**: 🟡 Médio — nova coluna, sem quebra
- **Dependências**: Nenhuma
- **Breaking**: ⚠️ Migration — adiciona colunas
- **Pré/pós Salvador**: Pós — funcionalidade nova, não corretiva
- **Descrição**: Adicionar ao schema `locations`:
  - `valid_from TIMESTAMPTZ` (quando o território passou a existir com essa configuração)
  - `valid_to TIMESTAMPTZ` (quando deixou de existir ou foi substituído)
  - `replaced_by_id UUID REFERENCES locations(id)` (se fundido/substituído)
  - Manter `status` como campo de "soft-delete rápido". `valid_to` é a data planejada/futura de mudança.

### P1.6 — Criar tabela de auditoria
- **Origem**: H2
- **Arquivos**: migration nova
- **Esforço**: M
- **Risco**: 🟢 Baixo — tabela nova, sem impacto
- **Dependências**: Nenhuma
- **Breaking**: ✅ Compatível — tabela nova
- **Pré/pós Salvador**: Pós — não bloqueia operação
- **Descrição**: Criar `location_audit_log`:
  ```sql
  CREATE TABLE location_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(id),
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    field TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    reason TEXT
  );
  ```
  Trigger `AFTER UPDATE ON locations` que insere registro para cada campo alterado.

### P1.7 — Adicionar operações em lote ao repositório
- **Origem**: H3
- **Arquivos**: `ILocationRepository.ts`
- **Esforço**: M
- **Risco**: 🟢 Baixo — adiciona métodos, não altera existentes
- **Dependências**: Nenhuma
- **Breaking**: ✅ Compatível — novos métodos
- **Pré/pós Salvador**: Pós — para importação de cidades em lote
- **Descrição**: Adicionar ao `ILocationRepository`:
  - `findByIds(ids: string[]): Promise<Location[]>`
  - `bulkUpsert(locations: LocationInput[]): Promise<void>`
  - `findByCountryCode(code: string): Promise<Location[]>`

### P1.8 — Resolver N+1 queries no chain de resolução
- **Origem**: H4
- **Arquivos**: `LocationRepositorySupabase.ts:84`, `useResolveTerritoryFromUrl.ts:191-396`
- **Esforço**: L
- **Risco**: 🔴 Alto — mexe no fluxo crítico de resolução
- **Dependências**: P1.7 (`findByIds`)
- **Breaking**: ✅ Compatível — otimização interna
- **Pré/pós Salvador**: Pós — com poucas locations, N+1 não dói
- **Descrição**:
  1. `findAncestors`: substituir loop while por RPC com recursive CTE (já existe `get_location_ancestors` no banco — `20260418020000:175-223`)
  2. `useResolveTerritoryFromUrl`: agrupar lookups independentes (city + group + district) em `Promise.all` em vez de waterfall sequencial
  3. Criar RPC `resolve_territory_by_path(path TEXT)` que faz toda a resolução no banco em uma única chamada

---

## FASE 2 — P2: ANTES DA EXPANSÃO INTERNACIONAL (3-4 sprints)

**Objetivo**: Preparar a arquitetura para suportar qualquer país, qualquer alfabeto, qualquer hierarquia administrativa.

### P2.1 — Relaxar CHECK constraint do `geographic_path`
- **Origem**: F1
- **Arquivos**: migration `20260418020000:66`
- **Esforço**: S
- **Risco**: 🔴 Alto — mexe em constraint do banco
- **Dependências**: P1.2 (slug Unicode)
- **Breaking**: ⚠️ Migration — altera constraint, mas é relaxamento (mais permissivo)
- **Pré/pós Salvador**: Pós — apenas países não-latinos precisam disso
- **Descrição**: Substituir `CHECK (geographic_path ~ '^/[a-z0-9/-]+$')` por `CHECK (geographic_path ~ '^/[a-z0-9\p{L}/-]+$')` (aceita qualquer letra Unicode). Testar com `São Paulo`, `München`, `北京`, `Москва`.

### P2.2 — Substituir `LocationType` enum por sistema extensível
- **Origem**: F6
- **Arquivos**: `types/index.ts:12-18`, migration de schema
- **Esforço**: XL
- **Risco**: 🔴 Alto — mexe no contrato central do domínio
- **Dependências**: Nenhuma (ortogonal aos outros P2)
- **Breaking**: 🔴 Quebra contrato — todo código que referencia `LocationType.DISTRICT` precisa ser atualizado
- **Pré/pós Salvador**: Pós — é re-arquitetura, não correção
- **Descrição**: Duas opções:
  - **Opção A (conservadora)**: Adicionar mais valores ao enum existente (`county`, `province`, `prefecture`, `region`, `borough`). `ALTER TYPE ... ADD VALUE` não quebra queries existentes, mas requer lock breve.
  - **Opção B (ideal)**: Substituir `LocationType` enum por `type TEXT` + tabela `location_types` com colunas `depth` (nível na hierarquia) e `semantic_type` (country/state/city/etc como tags, não níveis fixos). Isso permite que Singapura tenha `[country, city]`, EUA tenha `[country, state, county, city]`, China tenha `[country, province, city, district, subdistrict]`.

### P2.3 — Implementar suporte a `GeometryCollection`
- **Origem**: H10
- **Arquivos**: `BoundaryService.ts:847-873`
- **Esforço**: S
- **Risco**: 🟢 Baixo — adiciona branch, não altera existente
- **Dependências**: Nenhuma
- **Breaking**: ✅ Compatível
- **Pré/pós Salvador**: Pós — Salvador não tem territórios com GeometryCollection
- **Descrição**: Adicionar `case 'GeometryCollection'` no `extractRingsFromGeoJSON()` que itera sobre `geometries[]` e extrai rings de cada `Polygon`/`MultiPolygon`.

### P2.4 — Criar pipeline ETL automatizado para boundaries
- **Origem**: H11
- **Arquivos**: `scripts/location/municipal-neighborhood-sources.ts` + novo script
- **Esforço**: L
- **Risco**: 🟡 Médio — script novo, testar em staging
- **Dependências**: Nenhuma
- **Breaking**: ✅ Compatível — ferramenta nova
- **Pré/pós Salvador**: Pós — expande cobertura para 170 bairros
- **Descrição**: Criar `scripts/location/import-boundaries.ts` que:
  1. Lê `municipal-neighborhood-sources.ts`
  2. Para cada source, faz fetch do ArcGIS FeatureServer
  3. Extrai geometrias (Polygon/MultiPolygon), simplifica via `simplify-js` ou ST_Simplify no PostGIS
  4. Gera migration SQL com `INSERT INTO location_boundaries ... ON CONFLICT DO UPDATE`
  5. Loga progresso e erros por bairro

### P2.5 — Extrair mensagens de erro para sistema de i18n
- **Origem**: H5
- **Arquivos**: `useResolveTerritoryFromUrl.ts:145,196,202,211,224,228,237,242,255,342,349,354,359,368`
- **Esforço**: L
- **Risco**: 🟢 Baixo — extrair strings, sem mudar lógica
- **Dependências**: Framework de i18n no projeto
- **Breaking**: ✅ Compatível — mesmo texto, só extraído
- **Pré/pós Salvador**: Pós — MVP é pt-BR apenas
- **Descrição**: Extrair todas as strings de erro para `src/core/location/i18n/territory-errors.ts` com chaves como `territory.errors.cityNotFound`. Cada chave mapeia para função `(params) => string`. O formato atual (português) vira o default. Preparar estrutura para traduções futuras.

### P2.6 — Adicionar `names` JSONB multilíngue
- **Origem**: H5 (parte de i18n)
- **Arquivos**: migration nova + `types/index.ts`
- **Esforço**: M
- **Risco**: 🟢 Baixo — campo novo
- **Dependências**: Nenhuma
- **Breaking**: ✅ Compatível — campo novo
- **Pré/pós Salvador**: Pós — MVP é pt-BR apenas
- **Descrição**: Adicionar `names JSONB NOT NULL DEFAULT '{}'` à tabela `locations`. Formato:
  ```json
  {"pt": "Salvador", "en": "Salvador", "es": "Salvador de Bahía"}
  ```
  Aplicação consulta `names->>'{locale}'` com fallback para `name` atual.

### P2.7 — Generalizar `parsePublicTerritoryPath` para profundidade variável
- **Origem**: M10
- **Arquivos**: `publicTerritoryPath.ts:7-18`, `useTerritoryPolygon.ts:40-55`
- **Esforço**: M
- **Risco**: 🟡 Médio — muda parsing de URL
- **Dependências**: P1.8 (RPC de resolução)
- **Breaking**: ⚠️ Comportamento — URLs com mais segmentos mudam
- **Pré/pós Salvador**: Pós — Brasil tem hierarquia fixa de 4 níveis
- **Descrição**: Substituir `isStateSegment` (regex de 2 letras) por resolução dinâmica: o primeiro segmento após o módulo é passado para `locationRepo.findByPath()` que determina se é estado, cidade ou grupo com base no `type` da location encontrada. Remove a necessidade de adivinhar o nível pelo formato do segmento.

### P2.8 — Generalizar `isStateSegment` para códigos variáveis
- **Origem**: M7
- **Arquivos**: `publicTerritoryPath.ts:7-9`
- **Esforço**: S
- **Risco**: 🟢 Baixo
- **Dependências**: P2.7 (absorvido por ele)
- **Breaking**: ✅ Compatível — absorvido por P2.7
- **Pré/pós Salvador**: Pós
- **Descrição**: Absorvido por P2.7 — em vez de regex, consultar o banco.

---

## FASE 3 — P3: MELHORIA CONTÍNUA (2-3 sprints, assíncrono)

**Objetivo**: Eliminar débito técnico residual e preparar para escala massiva. Pode ser feito em paralelo com outras iniciativas.

### P3.1 — Implementar cache distribuído para boundaries
- **Origem**: M1
- **Esforço**: L
- **Dependências**: Infra de Redis ou CDN
- **Pré/pós Salvador**: Pós
- **Descrição**: Adicionar camada de cache com TTL configurável entre o `BoundaryService` e o banco. Em staging/dev, usar `Map` em memória (atual). Em produção, usar Redis ou CDN com `stale-while-revalidate`.

### P3.2 — Melhorar UX de timeout com indicador de progresso
- **Origem**: M2
- **Esforço**: S
- **Dependências**: Nenhuma
- **Pré/pós Salvador**: Pós
- **Descrição**: Adicionar estado `"resolving"` no hook de resolução que permite à UI mostrar skeleton/spinner com etapa atual ("Buscando cidade...", "Carregando bairros...").

### P3.3 — Remover hardcode `page_size: 5000`
- **Origem**: M3
- **Esforço**: S
- **Dependências**: Nenhuma
- **Pré/pós Salvador**: Pós
- **Descrição**: Tornar `page_size` um parâmetro do hook com valor máximo configurável por env.

### P3.4 — Unificar dual resolution path
- **Origem**: M4
- **Esforço**: M
- **Dependências**: P1.8
- **Pré/pós Salvador**: Pós
- **Descrição**: Fundir os dois branches de resolução de distrito (`:260-314` e `:317-370`) em um único com parâmetro `isCommunityRoute: boolean`.

### P3.5 — Tornar explícita a promoção district→group
- **Origem**: M5
- **Esforço**: S
- **Dependências**: Nenhuma
- **Pré/pós Salvador**: Pós
- **Descrição**: Adicionar prop `promotedFromDistrict` ao `ResolvedLocation` para que a UI possa indicar visualmente que o território foi promovido a grupo.

### P3.6 — Extrair community suffix segments para config
- **Origem**: M6
- **Esforço**: S
- **Dependências**: Nenhuma
- **Pré/pós Salvador**: Pós
- **Descrição**: Mover `['feed', 'grupos', 'alertas', ...]` para `src/config/communitySuffixes.ts`.

### P3.7 — Remover código IBGE de serviço genérico
- **Origem**: M8
- **Esforço**: S
- **Dependências**: Nenhuma
- **Pré/pós Salvador**: Pós
- **Descrição**: Mover `extractIbgeCodeFromLocation()` para `src/core/location/utils/ibge.ts`. O `LocationGeocodingService` continua chamando a utilidade, mas o serviço em si não contém lógica IBGE.

### P3.8 — Substituir hardcode `"/brasil"` por derivado de config
- **Origem**: M11
- **Esforço**: S
- **Dependências**: Nenhuma
- **Pré/pós Salvador**: Pós
- **Descrição**: Trocar `"/brasil"` literal por `"/${TERRITORY_CONFIG.defaultCountry}"` ou fallback para `"/"` (raiz).

### P3.9 — Corrigir violações de abstração de repositório
- **Origem**: H7
- **Esforço**: M
- **Dependências**: Nenhuma
- **Pré/pós Salvador**: Pós
- **Descrição**: Substituir queries diretas a `territorial_group_members` em `education.queries.ts`, `landing.queries.ts`, `LocationGeocodingService.ts:731`, `TerritorialGroupsReadService.ts:29` por chamadas ao `ITerritorialGroupRepository`.

---

## TIMELINE VISUAL

```
Agora          Lançamento Salvador    2ª Cidade     Internacional
  │                │                    │               │
  ├─ P0 ──────────┤                    │               │
  │  (6 itens)     │                    │               │
  │                ├─ P1 ──────────────┤               │
  │                │  (8 itens)         │               │
  │                │                    ├─ P2 ──────────┤
  │                │                    │  (8 itens)     │
  │                │                    │               ├─ P3 ──▶
  │                │                    │               │ (9 itens)
```

| Fase | Itens | Esforço total estimado | Pré-requisito para |
|---|---|---|---|
| P0 | 7 | ~4 dias | Lançamento Salvador |
| P1 | 8 | ~18 dias | Segunda cidade brasileira |
| P2 | 8 | ~20 dias | Expansão internacional |
| P3 | 9 | ~15 dias | Escala massiva (milhões de usuários) |

---

## MÉTRICAS DE SUCESSO POR FASE

| Fase | Critério de conclusão |
|---|---|
| P0 | 4 bairros com demarcação visível no hero. Slugs consistentes entre JS e SQL. Configuração 100% env-driven sem strings literais de fallback. |
| P1 | Nova cidade (ex: São Paulo) adicionada via seed SQL + boundaries, funcional em staging, sem alteração de código no frontend. N+1 resolvido — tempo de resolução < 2s. |
| P2 | Cidade com nome não-ASCII (ex: São Paulo com `ã` preservado no slug) funcional. Pipeline ETL importa boundaries de 170 bairros em < 5 min. Mensagens de erro em pt-BR + estrutura pronta para en-US. |
| P3 | Cache distribuído reduz latência de boundaries em 80%. Código IBGE isolado. Repositório sem queries diretas a tabelas internas. |

---

## ITENS FORA DO ESCOPO (DECISÃO CONSCIENTE)

Estes itens NÃO foram incluídos no roadmap por serem prematuros ou inviáveis no momento:

- **Migração para PostGIS completo**: O projeto usa coordenadas e GeoJSON no application layer. PostGIS no banco seria ideal para queries espaciais (ST_Contains, ST_Distance), mas requer migração de infra e não bloqueia o MVP.
- **Substituição do Nominatim por serviço próprio de geocoding**: O Nominatim (OpenStreetMap) é adequado para o MVP. Um serviço próprio só se justifica com escala massiva.
- **Suporte a hierarquias não-geográficas**: Territórios administrativos, distritos eleitorais, regiões de saúde — fora do escopo do produto atual.
