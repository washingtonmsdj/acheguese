# TERRITORY-FREEZE-AUDIT.md — Auditoria de Congelamento

**Sprint**: TERRITORY.FREEZE.AUDIT
**Data**: 2026-07-23
**Objetivo**: Validar se a execução completa do plano P0 permite congelar o domínio Territory.
**Método**: 6 varreduras independentes do código fonte (hardcodes, duplicação, dependências, violações de governance, módulos consumidores, estado pós-P0).

---

## RESPOSTAS OBRIGATÓRIAS

### 1. Existe algum bloqueio P0 que ficou fora do roadmap?

**SIM. 4 novos bloqueios P0 encontrados.**

| # | Bloqueio | Origem | Arquivos | Severidade |
|---|---|---|---|---|
| **P0.8** | Páginas de detalhe bypassam `useResolveTerritoryFromUrl` (violação R2) | Sweep 4 | `EducationDetailPage.tsx:87-97`, `GastronomyPremiumDetailPage.tsx:44-65`, `GastronomyDetailPage.tsx:84-96`, `ProfissionalPublicPage.tsx:26-34`, `CommunicationCityPage.tsx:16-17`, `CommunicationChannelPage.tsx:46-47` | **P0** — 6 módulos ignoram a resolução canônica de território |
| **P0.9** | `education.queries.ts` consulta `locations` e `territorial_group_members` diretamente (violação R9) | Sweep 4 | `src/modules/business/education/services/education.queries.ts:148,161,203,866,189` | **P0** — 5 queries diretas, bypass total do repositório |
| **P0.10** | P0.3 subestima escopo: 15 implementações de `normalize('NFD')` encontradas, não 7 (violação R7) | Sweep 2, Sweep 6 | 13 arquivos adicionais além dos 7 do plano | **P0** — o plano cobre apenas 47% das duplicações |
| **P0.11** | `CidadeLandingPage.tsx` tem slugify duplicado + hardcodes de coordenadas de Salvador (violações R4, R7) | Sweep 6 | `CidadeLandingPage.tsx:199,201-224,257-268` | **P0** — centro (`-12.94, -38.45`) e polígono fallback de 22 pontos hardcoded + slugify próprio |

**Por que não apareceram antes**: A auditoria anterior (TERRITORY.AUDIT.2) focou no domínio central (`core/location`, `core/geospatial`, `core/routing`). Os módulos consumidores (`business/education`, `gastronomy`, `professionals`, `communication`) não foram varridos em profundidade. P0.8-P0.11 são violações em código de módulo — periferia do domínio.

---

### 2. Existe alguma dependência escondida entre as sprints?

**SIM. 2 dependências não documentadas.**

| # | Dependência | Sprint afetada | Detalhe |
|---|---|---|---|
| **D1** | P0.6 (`COMMUNITY_HERO_IMAGES`) altera o mesmo seed que P0.4 (metadados) — ambos editam `20260720100000_seed_salvador_neighborhoods`. | P0.A + P0.D | Se P0.A mergear antes de P0.D, P0.D precisa rebasear. Se fizerem em branches separadas, conflito de merge no `jsonb_build_object` de cada bairro. Recomendação: fundir P0.4 e P0.6 em uma única alteração no seed, ou sequenciar P0.A → P0.D com merge explícito. |
| **D2** | P0.3 (slugify) altera `BoundaryService.ts` e `LocationGeocodingService.ts`. P0.1 (flag boundaries) ativa código que chama esses mesmos arquivos. Se P0.3 for mergeado DEPOIS de P0.1, a flag já ativa pode pegar código de slugify não unificado por um breve período. | P0.B + P0.C | O plano atual diz que P0.B deve ser mergeado ANTES de P0.C. Isso está correto, mas o plano não documenta explicitamente esta restrição de ordenação como dependência hard. É soft (funciona em qualquer ordem), mas ideal seguir P0.B → P0.C. |

**Conclusão**: As dependências documentadas no plano (P0.A → P0.B → P0.C → P0.D) estão corretas. Apenas D1 e D2 precisam ser explicitadas como restrições de sequenciamento.

---

### 3. Existe alguma alteração que pode quebrar compatibilidade?

**SIM. 2 riscos de breaking change.**

| # | Risco | Item P0 | Detalhe |
|---|---|---|---|
| **B1** | P0.3: Se `slugifyTerritory` e `normalizeTerritoryText` tiverem comportamento ligeiramente diferente das implementações locais, URLs ou comparações de texto podem mudar | P0.3 | As 15 implementações têm variações sutis: `useUserTerritory.ts` inclui `.replace(/\s+/g, ' ')` extra; `TouristPointService.ts` faz lowercase ANTES do NFD; `AdCampaignAdminService.ts` tem parâmetro `maxLength`. A função unificada precisa ser o superconjunto de todos os comportamentos OU cada consumer precisa ser testado individualmente. |
| **B2** | P0.7: Se `unaccent()` não estiver disponível no Supabase, o `CREATE EXTENSION` falha silenciosamente e a RPC continua gerando slugs quebrados | P0.7 | O plano diz "CREATE EXTENSION IF NOT EXISTS" — isso NÃO lança erro se falhar, apenas não cria. A RPC usaria `unaccent()` que não existe, causando erro em runtime na RPC. É necessário verificar a disponibilidade da extensão ANTES de deploy. |

**Mitigação**:
- B1: Criar testes de regressão para cada consumer antes do merge. Validar que `slugifyTerritory("São Paulo")` produz o mesmo resultado em todos os contexts.
- B2: Verificar `SELECT * FROM pg_available_extensions WHERE name = 'unaccent'` no banco de staging antes do deploy.

---

### 4. Existe alguma violação da GOVERNANCE?

**SIM. 3 categorias de violações ATIVAS no código atual.**

| # | Regra | Violações ativas | Cobertas por P0? |
|---|---|---|---|
| **R2** | "Nenhuma tela resolve território sem passar por useResolveTerritoryFromUrl ou useActiveTerritory" | 6 páginas de detalhe (Education, Gastronomy, Professionals, Communication) | **NÃO** → P0.8 |
| **R4** | "Nenhum hardcode de bairro, cidade ou estado em código fonte" | `CidadeLandingPage.tsx:199` (Salvador center), `:201-224` (22-point fallback polygon), `TerritoryHomePage.tsx:255-256` (Salvador/BA fallback), `BoundaryService.ts:155` (FALLBACK_CENTER) | **PARCIAL** — BoundaryService está em P1.1, os demais NÃO estão em nenhum P0 |
| **R7** | "Nenhum módulo cria seu próprio slugify/normalizeText" | 15 implementações em 13 arquivos. P0.3 cobre apenas 7. | **NÃO** — P0.10 |
| **R9** | "Nenhum código fora de ILocationRepository consulta tabelas territory diretamente" | 5 queries em `education.queries.ts` + ~15 outros arquivos com queries diretas a `locations`/`territorial_group_members` | **NÃO** — P0.9 + P3.9 |

**Conclusão**: A GOVERNANCE descreve o estado DESEJADO. O código atual está substancialmente abaixo desse padrão. O plano P0 reduz a distância mas não a elimina. Após P0, R2, R4, R7 e R9 continuarão violadas — embora em menor grau.

---

### 5. Existe algum hardcode territorial restante?

**SIM. Catálogo de hardcodes ativos pós-P0 (após executar os 7 P0 originais):**

| # | Arquivo | Linha | Hardcode | P0 cobre? |
|---|---|---|---|---|
| H1 | `BoundaryService.ts` | 155 | `[-12.975, -38.476]` (Salvador) | P1.1 |
| H2 | `publicTerritoryFallbacks.ts` | 142 | `state !== "ba" \|\| city !== "salvador"` | P1.3 |
| H3 | `CidadeLandingPage.tsx` | 199 | `{ latitude: -12.94, longitude: -38.45 }` (Salvador center) | **NÃO** |
| H4 | `CidadeLandingPage.tsx` | 201-224 | 22-point GeoJSON polygon (Salvador outline fallback) | **NÃO** |
| H5 | `TerritoryHomePage.tsx` | 255 | `"Salvador"` (city name fallback) | **NÃO** |
| H6 | `TerritoryHomePage.tsx` | 256 | `"ba"` (state code fallback) | **NÃO** |
| H7 | `CidadeLandingPage.tsx` | 726 | `'/ba/salvador/nordeste-de-amaralina'` (hardcoded path in slugify business logic) | **NÃO** |
| H8 | `src/core/community/components/page/communityOverviewHelpers.ts` | 62 | `return heroSalvador` (Salvador hero image fallback) | **PARCIAL** — P0.6 mitiga o mapa de bairros, mas o fallback de cidade `heroSalvador` permanece hardcoded |

**Dos 8 hardcodes, apenas 2 têm cobertura no plano P0 (H1, H2 via P1). Os outros 6 NÃO estão em nenhum item P0 ou P1 do roadmap atual.**

---

### 6. Existe alguma duplicação de slug, path ou metadata?

**SIM. Duplicações não cobertas pelo P0.3:**

| # | Tipo | Arquivos | Status |
|---|---|---|---|
| **Dup1** | `normalize('NFD')` + strip diacritics | 48 arquivos no total. 15 são duplicações de lógica de slug/normalize. P0.3 cobre 7. | **NÃO coberto**: `CidadeLandingPage.tsx:257-268`, `TerritorialSelector.tsx:19`, `PublicCitySelector.tsx:60`, `AdminProfileGovernanceUtils.ts:12`, `AdminPickupPointsService.ts:112`, `failedDelivery.ts:14`, `AdCampaignAdminService.ts:181`, `pizzaVisualRules.ts:5` |
| **Dup2** | Metadados inconsistentes | `locations.metadata` usa `source`; `location_boundaries.metadata` usa `provider`. Ambos significam a mesma coisa. | **PARCIAL** — P0.4 adiciona chave canônica `source_name` mas mantém as antigas |
| **Dup3** | `slugify` com variações de algoritmo | `ClassifiedUrlService.ts` (trim→lower→NFD→strip→replace), `TouristPointService.ts` (lower→NFD→strip), `CidadeLandingPage.tsx:264` (NFD→strip→lower), `useUserTerritory.ts:96` (NFD→strip→trim). | **NÃO coberto** — variações sutis podem gerar slugs diferentes |

**Conclusão**: P0.3 cobre apenas 7 das 15 duplicações relevantes. As 8 restantes precisam ser adicionadas ao escopo (P0.10).

---

### 7. Existe alguma decisão da GOVERNANCE impossível de cumprir hoje?

**SIM. 1 regra atualmente impossível.**

| Regra | Por que é impossível |
|---|---|
| **R9**: "Nenhum código fora de ILocationRepository consulta tabelas territory diretamente" | O código atual tem **~20 arquivos** com queries diretas a `locations`, `territorial_groups` ou `territorial_group_members`. Para cumprir R9, seria necessário refatorar TODOS esses arquivos para usar os repositórios. Nem o plano P0 nem o roadmap P1-P3 cobrem a totalidade dessas violações. O `ILocationRepository` atual não tem métodos para todas as queries que esses módulos precisam (ex: `findByGeographicPath`, `findChildren`, joins com outras tabelas). **R9 é aspiracional — não é alcançável com a interface atual do repositório.** |

**Recomendação**: R9 deve ser reclassificada de "regra inviolável" para "diretriz de design" até que `ILocationRepository` seja expandido com os métodos necessários para substituir todas as queries diretas.

---

### 8. Após executar TODOS os P0, o domínio realmente poderá ser considerado congelado?

**NÃO.** O plano P0 original (7 itens) é necessário mas insuficiente.

**Com os 7 P0 originais**, 7 dos 14 critérios de congelamento (C1-C7) seriam atendidos. Os outros 7 critérios (C8-C14) são explicitamente delegados a P1/P2/P3 — o que é aceitável perante a própria GOVERNANCE.

**Porém**, 4 novos bloqueios P0 foram descobertos nesta auditoria:

| Bloqueio | Impacto se não corrigido |
|---|---|
| P0.8 — 6 páginas bypassam `useResolveTerritoryFromUrl` | Módulos de educação, gastronomia, profissionais e comunicação operam fora do fluxo canônico. Se um território for renomeado ou desativado, essas páginas não refletem a mudança. |
| P0.9 — `education.queries.ts` com 5 queries diretas | Viola R9. Se o schema de `locations` mudar, o módulo de educação quebra silenciosamente. |
| P0.10 — P0.3 subestima escopo em 53% | Após P0.3, ainda existirão 8 slugify/normalizeText duplicados. R7 continua violada. |
| P0.11 — `CidadeLandingPage.tsx` com hardcodes + slugify próprio | Viola R4 e R7. Coordenadas de Salvador hardcoded em 2 lugares. |

---

## CATÁLOGO COMPLETO DE VIOLAÇÕES ATIVAS (PRÉ-P0)

### Violações R2 — Resolução de território bypassada

| Arquivo | Linha | Severidade |
|---|---|---|
| `EducationDetailPage.tsx` | 87-97 | P0 |
| `GastronomyPremiumDetailPage.tsx` | 44-65 | P0 |
| `GastronomyDetailPage.tsx` | 84-96 | P0 |
| `ProfissionalPublicPage.tsx` | 26-34 | P0 |
| `CommunicationCityPage.tsx` | 16-17 | P0 |
| `CommunicationChannelPage.tsx` | 46-47 | P0 |

### Violações R7 — Slugify duplicado (além dos 7 do P0.3)

| Arquivo | Linha | Função |
|---|---|---|
| `CidadeLandingPage.tsx` | 257-268 | `normalizeText()`, `slugify()` |
| `TerritorialSelector.tsx` | 19 | `.normalize("NFD")` inline |
| `PublicCitySelector.tsx` | 60 | `.normalize("NFD")` inline |
| `AdminProfileGovernanceUtils.ts` | 12 | `normalizeText(unknown)` |
| `AdminPickupPointsService.ts` | 112 | `normalizeText(string?)` |
| `failedDelivery.ts` | 14 | `normalizeText(value)` |
| `AdCampaignAdminService.ts` | 181 | `normalizeText(value, maxLength)` |
| `pizzaVisualRules.ts` | 5 | `normalizeText(value)` |

### Violações R9 — Queries diretas a tabelas territory

| Arquivo | Tabela | Severidade |
|---|---|---|
| `education.queries.ts` (4×) | `locations` | P0 |
| `education.queries.ts` (1×) | `territorial_group_members` | P0 |
| `VagasService.ts` | `locations` | P1 |
| `landing.queries.ts` | `locations`, `territorial_group_members` | P1 |
| `TouristPointService.ts` | `locations` | P2 |
| `TouristPointQueryService.ts` | `locations` | P2 |
| `posts.feed.queries.ts` | `locations` | P2 |
| `profile.workspace.aggregate.ts` | `locations` | P3 |
| `MotoboySourceResolverService.ts` | `locations` | P3 |
| `DriverAvailabilityService.ts` | `locations` | P3 |
| `FamilyService.ts` | `locations` | P3 |
| `LocationsReadService.ts` | `locations` | P2 |
| `TerritorialGroupsReadService.ts` | `territorial_group_members` | P2 |
| `GeospatialRepositorySupabase.ts` | `locations` | P2 |

---

## PLANO P0 EXPANDIDO (REVISADO)

### P0 original (7 itens) — MANTIDO

| Item | Arquivos | Esforço |
|---|---|---|
| P0.1 | `.env.production`, `.env.example` | 15 min |
| P0.2 | nova migration `20260724000000` | 45 min |
| P0.3 | `slugify.ts` + 7 edits (ATUALIZADO: + 8 edits) | 6h (era 4h) |
| P0.4 | 2 seeds + doc | 1h |
| P0.5 | migration `20260530120000` | 30 min |
| P0.6 | seed + `communityOverviewHelpers.ts` | 1h |
| P0.7 | nova migration RPC fix | 30 min |

### P0 expandido (+4 itens) — ADICIONADO

| Item | Descrição | Arquivos | Esforço |
|---|---|---|---|
| **P0.8** | Refatorar 6 páginas para usar `useResolveTerritoryFromUrl` | 6 arquivos de detail page | 6h (1h por página) |
| **P0.9** | Substituir queries diretas em `education.queries.ts` por métodos do repositório | `education.queries.ts` + possível expansão do `ILocationRepository` | 3h |
| **P0.10** | Expandir P0.3 para cobrir 15 implementações (não apenas 7) | `slugify.ts` + 15 edits | +2h ao P0.3 |
| **P0.11** | Migrar hardcodes de Salvador em `CidadeLandingPage.tsx` para config/metadata | `CidadeLandingPage.tsx` | 2h |

### Esforço total revisado

| Categoria | Original | Expandido |
|---|---|---|
| P0 itens | 7 | 11 |
| Esforço total | ~4 dias | ~7 dias |
| Arquivos alterados | ~14 | ~35 |

---

## VEREDITO FINAL

**"O domínio pode ser congelado?"**

**NÃO.**

**Motivo**: O plano P0 original de 7 itens é necessário mas insuficiente. Esta auditoria descobriu 4 novos bloqueios P0 que precisam ser resolvidos antes do congelamento:

1. **P0.8**: 6 páginas de módulo (educação, gastronomia, profissionais, comunicação) operam fora do fluxo canônico de resolução de território — violam a regra inviolável R2 da GOVERNANCE.

2. **P0.9**: `education.queries.ts` consulta `locations` e `territorial_group_members` diretamente com 5 queries — viola a regra inviolável R9.

3. **P0.10**: O plano P0.3 cobre apenas 7 das 15 duplicações de slugify/normalizeText. Após P0.3, a regra R7 continuaria violada por 8 arquivos.

4. **P0.11**: `CidadeLandingPage.tsx` contém hardcodes de coordenadas de Salvador e um polígono fallback de 22 pontos — viola as regras R4 e R7.

**Estes 4 itens não são novos requisitos.** São violações concretas das regras que a própria GOVERNANCE estabeleceu como invioláveis. Foram descobertos porque as auditorias anteriores focaram no domínio central (`core/location`, `core/geospatial`, `core/routing`) e não varreram os módulos consumidores em profundidade.

**Próximo passo**: Atualizar `TERRITORY-P0-EXECUTION-PLAN.md` para incluir P0.8-P0.11, ou criar um documento `TERRITORY-P0-EXPANDED.md` com o plano revisado de 11 itens. Após execução completa dos 11 P0, o domínio poderá ser congelado.
