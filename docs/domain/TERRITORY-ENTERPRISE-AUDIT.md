# TERRITORY DOMAIN — Enterprise Architectural Audit

**Sprint**: TERRITORY.AUDIT.2
**Date**: 2026-07-23
**Scope**: Avaliar se o domínio Territory do Achegue-se suportaria todos os países do mundo durante os próximos 20 anos.
**Método**: Análise estática completa de 50+ arquivos, cobrindo data model, repositories, services, routing, boundaries, migrations, configs e hardcodes.

---

## EXECUTIVE SUMMARY

O domínio Territory está **bem desenhado para um produto brasileiro mono-cidade**, com fundamentos arquiteturais sólidos (SSOT de URLs, interfaces tipadas, centralização de slugs em config, soft-delete via status, idempotência de seeds). Entretanto, **sete falhas estruturais bloqueiam a escala global**, e outras quinze fragilidades de severidade alta/média precisam ser resolvidas antes de qualquer expansão internacional.

**A resposta curta**: Este modelo, no estado atual, NÃO suportaria milhões de usuários e décadas de evolução territorial global. Mas com correções cirúrgicas nos 7 bloqueios críticos, a arquitetura subjacente é recuperável.

---

## CRITICAL FINDINGS (BLOQUEIOS DE ESCALA GLOBAL)

### F1. 🔴 `geographic_path` CHECK constraint aceita apenas ASCII
**Arquivo**: migrations `20260418020000_create_locations_system.sql:66`
**Regra**: `CHECK (geographic_path ~ '^/[a-z0-9/-]+$')`
**Impacto**: Nenhum território com nome não-ASCII pode ser armazenado. `São Paulo` vira `sao-paulo`; `München` vira `mnchen`; `北京` vira string vazia.
**Contraexemplo**: Japão, China, Rússia, Tailândia, Coreia, Índia, países árabes — todos impossíveis.

### F2. 🔴 Todas as 7 funções de slug/normalize destroem caracteres não-ASCII
**Arquivos**: `ClassifiedUrlService.ts:105`, `TouristPointService.ts:79`, `CidadeLandingPage.tsx:264`, `useUserTerritory.ts:96`, `publicTerritoryFallbacks.ts:20`, `LocationGeocodingService.ts:153`, `useUserTerritory.ts:87`
**Mecanismo**: `.normalize('NFD').replace(/[\u0300-\u036f]/g, '')` + `/[^a-z0-9\s-]/g`
**Impacto**: Toda geração de slug no frontend assume alfabeto latino. Apenas `cleanAlias` em `CommunityPublicAliasService.ts:83` preserva Unicode, e mesmo assim apenas valida, não gera slug.
**Inconsistência adicional**: O SQL-level slug no `rpc_upsert_canonical_city_by_ibge` NÃO faz NFD normalization, gerando slugs diferentes para o mesmo nome.

### F3. 🔴 Coordenadas de Salvador como fallback universal
**Arquivo**: `src/core/geospatial/services/BoundaryService.ts:155`
**Valor**: `FALLBACK_CENTER: [number, number] = [-12.975, -38.476]`
**Impacto**: Qualquer território no mundo sem centro definido terá seu mapa centrado em Salvador, BA — a 17.000 km de distância para usuários em Tóquio ou Londres.
**Ocorrências**: 8 referências em `BoundaryService.ts`, 1 em `useNeighborhoodBounds.ts:41`.

### F4. 🔴 Sistema de fallback funciona APENAS para Salvador
**Arquivo**: `src/core/routing/utils/publicTerritoryFallbacks.ts:142`
**Guarda**: `if (state !== "ba" || city !== "salvador") return null`
**Impacto**: Qualquer outra cidade no Brasil (São Paulo, Rio, Belo Horizonte) ou no mundo recebe `null` como fallback. O usuário vê `"Território inválido na URL"`.

### F5. 🔴 `findAll()` carrega TODAS as locations do mundo em memória
**Arquivo**: `src/core/location/repositories/LocationRepositorySupabase.ts:183-204`
**Impacto**: Com 250M+ locations globais, isso transfere gigabytes pela rede e consome gigabytes de RAM no browser. O método é chamado por `LocationGeocodingService.buildTerritoryIndex()` e `BoundaryService.buildTerritoryIndex()` — que mantêm DUAS cópias completas do índice em memória, reconstruídas a cada 5 minutos.

### F6. 🔴 Enum `LocationType` com 5 níveis fixos
**Arquivo**: `src/core/location/types/index.ts:12-18`
**Valores**: `country → state → city → district → neighborhood`
**Impacto**: Não acomoda divisões administrativas de:
- Singapura (sem estados)
- Reino Unido (countries dentro do país)
- China (省→市→区/县→街道/镇 — semântica diferente)
- EUA (county não se encaixa em DISTRICT ou NEIGHBORHOOD)
- França (région → département → commune → arrondissement)

O enum é um tipo Postgres — adicionar níveis requer `ALTER TYPE ... ADD VALUE` com downtime.

### F7. 🔴 Inconsistência SQL vs JS na geração de slugs
**Arquivos**:
- JS: `.normalize('NFD').replace(/[\u0300-\u036f]/g, '')` → `sao-paulo`
- SQL: `regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')` → `s-o-paulo` (o `ã` se torna `-` extra)

Uma mesma cidade pode ter dois slugs diferentes dependendo de onde foi criada (frontend vs RPC), causando falhas silenciosas de resolução.

---

## HIGH SEVERITY FINDINGS

### H1. 🟠 Sem versionamento ou modelo temporal de locations
**Arquivo**: `src/core/location/types/index.ts:29-41`
**Ausências**:
- `valid_from` / `valid_to` — quando um território existiu?
- `replaced_by_id` — Bombay → Mumbai?
- `merged_from_ids` — fusão de bairros?
- `change_history` — quem alterou o quê e quando?
- Sem `updated_by`, sem trilha de auditoria.

### H2. 🟠 Sem trilha de auditoria para mudanças territoriais
Nenhuma tabela de auditoria (`location_audit_log`, `boundary_audit_log`). Se um bairro é renomeado ou tem seu boundary alterado, não há registro do valor anterior, de quem fez a mudança, nem de quando.

### H3. 🟠 Ausência de operações em lote no repositório
**Arquivo**: `src/core/location/repositories/ILocationRepository.ts`
**Faltam**: `findByIds()`, `bulkInsert()`, `bulkUpdate()`, `findByCountry()`, `findByBoundingBox()`.
**Impacto**: Importar 5.000 cidades requer 5.000 chamadas individuais ao banco, sem transação atômica.

### H4. 🟠 N+1 queries no chain de resolução territorial
**Arquivos**: `LocationRepositorySupabase.ts:84`, `useUserTerritory.ts`, `useResolveTerritoryFromUrl.ts:191-396`
**Padrão**: Cada nível da hierarquia é resolvido com uma query separada e sequencial. No pior caso, são 7+ queries sequenciais para resolver um território. A latência acumulada pode exceder o timeout de 6s.

### H5. 🟠 Sem i18n para nomes de territórios ou mensagens de erro
- `Location.name` e `Location.full_name` são strings monolíngues
- Sem suporte a `names: { pt: "Salvador", en: "Salvador", es: "Salvador de Bahía" }`
- Todas as mensagens de erro em `useResolveTerritoryFromUrl.ts` são strings literais em português
- Sem framework de i18n no domínio territory

### H6. 🟠 `COMMUNITY_HERO_IMAGES` — hardcode de 9 bairros
**Arquivo**: `src/core/community/components/page/communityOverviewHelpers.ts:28-39`
**Mapa**: `Record<string, string>` com 9 slugs fixos → imagens. Adicionar um novo bairro requer editar código.
**Deveria ser**: campo `hero_image_url` em `locations.metadata` ou `territory_communities`.

### H7. 🟠 Abstração de repositório violada em 4+ arquivos
**Arquivos**: `education.queries.ts`, `landing.queries.ts`, `LocationGeocodingService.ts:731`, `TerritorialGroupsReadService.ts:29`
Query direta à tabela `territorial_group_members` em vez de usar `ITerritorialGroupRepository`.

### H8. 🟠 Metadados inconsistentes entre `locations` e `location_boundaries`
- `locations.metadata`: `{source:'geosalvador_2022', official:true}`
- `location_boundaries.metadata`: `{provider:'GeoSalvador', source_level:'municipal_neighborhood', geometry_format:'GeoJSON', geographic_path}`

Chaves diferentes para o mesmo conceito (`source` vs `provider`). Sem schema documentation.

### H9. 🟠 Campo `public_navigation_enabled` é código morto
Definido em `20260530120000_ensure_complexo_nordeste_membership.sql:65` como metadata, mas NUNCA lido por código TypeScript. A navegabilidade real é controlada por `is_navigable` em `territoryVisibility.ts`.

### H10. 🟠 Sem suporte a `GeometryCollection`
**Arquivo**: `BoundaryService.ts:847-873`
Apenas `Polygon` e `MultiPolygon` são suportados. Territórios com ilhas ou exclaves (Havaí como parte dos EUA, Kaliningrado como parte da Rússia) retornam `rings: []`.

### H11. 🟠 Padrão de importação 100% manual
- 4 boundaries hardcoded como GeoJSON string em migration SQL
- `scripts/location/municipal-neighborhood-sources.ts` declara o ArcGIS endpoint mas NENHUM código o consome
- Sem ETL pipeline, sem script de importação automatizada
- Para 170 bairros, seria necessário copiar manualmente 170 polígonos

---

## MEDIUM SEVERITY FINDINGS

### M1. 🟡 Sem cache distribuído para boundaries
Cache é in-memory apenas (Map no browser), perdido a cada refresh. Sem CDN, sem Redis, sem Service Worker.

### M2. 🟡 Timeout de 6s sem indicador de progresso
`RESOLVE_TIMEOUT_MS = 6000` em `useResolveTerritoryFromUrl.ts:55`. Em conexões lentas, o waterfall de queries pode expirar sem feedback ao usuário.

### M3. 🟡 `page_size: 5000` hardcoded para children
`useUserTerritory.ts:115-116,145-146`. Tóquio tem 23 wards com sub-bairros; Shanghai tem 16 distritos com centenas de subáreas.

### M4. 🟡 Dual resolution path para distritos
`useResolveTerritoryFromUrl.ts:260-314` (community route) e `:317-370` (generic path) — duas queries independentes com lógica duplicada, cheiro arquitetural.

### M5. 🟡 Promoção silenciosa de district→group
`useResolveTerritoryFromUrl.ts:372-396` — quando um distrito pertence a exatamente 1 grupo, é promovido a grupo sem indicação visual. Se pertencer a 0 ou 2+, permanece como distrito. Comportamento muda entre deploys sem aviso.

### M6. 🟡 Hardcoded Portuguese community suffix segments
`territoryUrls.ts:36-44`: `['feed', 'grupos', 'alertas', 'problemas', 'achados-e-perdidos', 'interesse', 'comunicacao']` — não são extraídos de config.

### M7. 🟡 `isStateSegment` assume códigos de 2 letras
`publicTerritoryPath.ts:7-9`: regex `/^[a-z]{2}$/i`. Falha para países sem códigos de estado (UK counties) ou com códigos variáveis (India).

### M8. 🟡 Código IBGE em serviço supostamente genérico
`LocationGeocodingService.ts:228-243`: `extractIbgeCodeFromLocation()` é Brazil-specific mas está em um serviço com nome genérico.

### M9. 🟡 `VITE_ENABLE_LOCATION_BOUNDARIES=false` em produção
`.env.production:36`. Com essa flag, a tabela `location_boundaries` é completamente ignorada, mesmo que tenha dados.

### M10. 🟡 `parseGeoPath` assume 3 ou 4 segmentos
`useTerritoryPolygon.ts:40-55` — qualquer país com hierarquia diferente de 3-4 níveis retorna `null`.

### M11. 🟡 Hardcoded `"/brasil"` como fallback de path
`territory.ts:15`: `LAUNCH_CITY_PATH = ... || "/brasil"`. Literal string, não derivado de config.

---

## STRENGTHS (O QUE ESTÁ CERTO)

1. **SSOT de URLs**: `buildLocationBaseUrl`, `buildGroupBaseUrl`, `buildTerritoryBaseUrl` — centralizados em `territoryUrls.ts`, sem duplicação de lógica de construção de URL.
2. **Discriminated union no TerritoryFilter**: `scope: 'location' | 'group' | 'none'` força todos os consumidores a tratar todos os casos.
3. **Soft-delete via status**: `LocationStatus.ACTIVE/INACTIVE` — bairros que deixam de existir não são deletados, apenas marcados.
4. **Idempotência de seeds**: Todas as migrations usam `ON CONFLICT ... DO UPDATE`, permitindo re-execução segura.
5. **Configuração 100% env-driven**: `TERRITORY_CONFIG` lê de `VITE_LAUNCH_*`, sem hardcodes de cidade.
6. **RLS implementado**: Políticas de segurança em `locations`, `territorial_groups`, `territorial_group_members`, `location_boundaries`.
7. **Cancelamento de requests**: `cancelled` flag em `useResolveTerritoryFromUrl.ts:151,413` e `useTerritoryPolygon.ts:71,125`.
8. **Validação de hierarquia**: PL/pgSQL trigger `validate_location_hierarchy()` impede erros de parentesco.
9. **Metadados rastreáveis**: `source`, `source_url`, `source_object_id` em `location_boundaries`.
10. **Cache com TTL configurável**: `DEFAULT_LOCATION_CACHE_TTL_MS = 5 * 60 * 1000`.
11. **Centralização de slugs de módulo**: `src/config/moduleSlugs.ts` evita dispersão de strings.
12. **URL segment validation**: `cleanUrlSegment()` bloqueia injeção via `/`, `?`, `#`.
13. **Promoção inteligente district→group**: Lógica que detecta pertencimento único a grupo territorial — conceito correto, implementação frágil.

---

## MATRIZ DE RISCO

| Risco | Probabilidade | Impacto | Mitigação necessária |
|---|---|---|---|
| Slug não-ASCII rejeitado pelo banco | Certa (100%) ao adicionar país não-latino | Bloqueante | Migração do CHECK constraint + rewrite das 7 funções |
| Fallback centrado em Salvador para território estrangeiro | Média (30% dos acessos sem boundary) | Experiência quebrada | Substituir por centróide geométrico do país |
| `findAll()` causar OOM no browser | Alta (em escala com 10K+ locations) | Crash da aplicação | Substituir por queries filtradas server-side |
| Timeout de 6s excedido por latência de rede | Alta (conexões móveis, países distantes) | Território não resolve | Paralelizar queries, reduzir waterfall |
| Mudança de boundary sem versionamento corromper dados históricos | Média (1-2 vezes/ano por território) | Perda de rastreabilidade | Adicionar `valid_from`/`valid_to` + audit log |
| Slug inconsistente entre JS e SQL | Baixa (só afeta criações via RPC) | Território inacessível | Unificar algoritmo de slug generation |
| Hardcode `COMMUNITY_HERO_IMAGES` impedir novo bairro | Média (ao adicionar bairro fora dos 9) | Bairro sem imagem | Migrar para `metadata.hero_image_url` |

---

## RECOMMENDATIONS (NÃO IMPLEMENTAR NESTA SPRINT)

### Curto prazo (antes do lançamento de Salvador)
1. Ativar `VITE_ENABLE_LOCATION_BOUNDARIES=true`
2. Criar migration de correção de timestamp para popular `location_boundaries` com os 4 polígonos existentes
3. Unificar `normalizeText` em um único módulo shared
4. Subir `COMMUNITY_HERO_IMAGES` para `locations.metadata.hero_image_url`
5. Adicionar `findByIds()` ao `ILocationRepository`

### Médio prazo (antes da segunda cidade)
6. Migrar `geographic_path` CHECK constraint para aceitar UTF-8
7. Substituir `LocationType` enum por sistema de tipos extensível
8. Implementar `findAncestors` via recursive CTE no banco (RPC)
9. Substituir `findAll()` por queries filtradas com server-side pagination
10. Extrair mensagens de erro para sistema de i18n
11. Criar pipeline ETL automatizado para importação de boundaries

### Longo prazo (antes da expansão internacional)
12. Adicionar `valid_from`/`valid_to`/`replaced_by_id` ao schema de locations
13. Criar tabela `location_audit_log` para versionamento temporal
14. Implementar cache distribuído para boundaries (Redis/CDN)
15. Suportar `GeometryCollection` no `extractRingsFromGeoJSON`
16. Substituir fallback centrado em Salvador por centróide geométrico dinâmico
17. Implementar `names` JSONB multilíngue em `locations`
18. Generalizar `parsePublicTerritoryPath` para hierarquias de profundidade variável

---

## CONCLUSÃO

**"Eu confiaria neste modelo para suportar milhões de usuários e décadas de evolução territorial?"**

**Não no estado atual.** Há 7 falhas bloqueantes que tornam impossível a operação fora do Brasil, e 11 fragilidades de alta severidade que comprometeriam a integridade dos dados e a experiência do usuário em escala global.

**Entretanto, a arquitetura NÃO é descartável.** Os fundamentos — hierarquia relacional, SSOT de URLs, idempotência de seeds, RLS, configuração env-driven — estão corretos. As 7 falhas críticas são corrigíveis com migrações de schema e rewrites localizados, sem necessidade de re-arquitetura completa.

O domínio Territory foi projetado com as restrições corretas para um MVP brasileiro. As falhas identificadas são consequência natural desse escopo inicial, não de decisões arquiteturais erradas. Com as correções listadas acima — em especial F1, F2, F3, F4 e F5 — o modelo se tornaria adequado para suportar dezenas de países e décadas de evolução.

**Nota final**: 6.5/10 para o estado atual. 8.5/10 após correção dos 7 bloqueios críticos. 9.5/10 após correção de todas as fragilidades high severity.
