
# 📊 INVENTÁRIO DE OPERAÇÕES - SSOT TERRITORIAL

**Data:** 2026-04-05  
**Formato:** Módulo → Operação → Arquivo → Status

---

## 1. ESCRITA (CREATE/UPDATE)

### tourist_points
| Operação | Arquivo | Função | Status | Observação |
|----------|---------|--------|--------|------------|
| CREATE | `TouristPointService.ts` | create() | ✅ CORRETO | Valida location_id |
| UPDATE | `TouristPointService.ts` | update() | ✅ CORRETO | Valida location_id |
| FORM | `AdminPontosTuristicos.tsx` | TouristPointForm | ✅ CORRETO | Usa TerritorialSelector |

### profiles
| Operação | Arquivo | Função | Status | Observação |
|----------|---------|--------|--------|------------|
| CREATE | `ProfileService.ts` | createProfile() | ❌ QUEBRADO | Aceita neighborhood string |
| UPDATE | `ProfileService.ts` | updateProfile() | ❌ QUEBRADO | Aceita neighborhood string |
| FORM | `EditProfileForm.tsx` | - | ❌ QUEBRADO | Input livre |
| FORM | `OnboardingPage.tsx` | handleNeighborhoodSelect | ❌ QUEBRADO | Input livre |

### posts
| Operação | Arquivo | Função | Status | Observação |
|----------|---------|--------|--------|------------|
| CREATE | `PostService.ts` | createPost() | ❌ QUEBRADO | Aceita neighborhood string |
| UPDATE | `PostService.ts` | updatePost() | ❌ QUEBRADO | Aceita neighborhood string |
| FORM | `CreatePostForm.tsx` | - | ❌ QUEBRADO | Input livre |

### business_data
| Operação | Arquivo | Função | Status | Observação |
|----------|---------|--------|--------|------------|
| CREATE | `BusinessService.ts` | create() | ⚠️ PARCIAL | Aceita location_id mas não valida |
| UPDATE | `BusinessService.ts` | update() | ⚠️ PARCIAL | Aceita location_id mas não valida |
| FORM | `CreateBusinessForm.tsx` | - | ❌ QUEBRADO | Input livre |

### classifieds
| Operação | Arquivo | Função | Status | Observação |
|----------|---------|--------|--------|------------|
| CREATE | `ClassifiedService.ts` | create() | ⚠️ PARCIAL | Aceita location_id mas não valida |
| UPDATE | `ClassifiedService.ts` | update() | ⚠️ PARCIAL | Aceita location_id mas não valida |
| FORM | `CreateClassifiedForm.tsx` | - | ⚠️ PARCIAL | Verificar se usa TerritorialSelector |

### community_alerts
| Operação | Arquivo | Função | Status | Observação |
|----------|---------|--------|--------|------------|
| CREATE | `CommunityAlertService.ts` | createAlert() | ❌ QUEBRADO | Aceita neighborhood string |
| FORM | `CreateAlertForm.tsx` | - | ❌ QUEBRADO | Input livre |

### community_issues
| Operação | Arquivo | Função | Status | Observação |
|----------|---------|--------|--------|------------|
| CREATE | `CommunityIssuesService.ts` | create() | ❌ QUEBRADO | Aceita neighborhood string |
| FORM | `CreateIssueForm.tsx` | - | ❌ QUEBRADO | Input livre |

**Resumo Escrita:**
- ✅ CORRETO: 3 operações (tourist_points)
- ⚠️ PARCIAL: 4 operações (business_data, classifieds)
- ❌ QUEBRADO: 11 operações (profiles, posts, community_alerts, community_issues)

---

## 2. LEITURA (SELECT/GET)

### tourist_points
| Operação | Arquivo | Função | Status | Observação |
|----------|---------|--------|--------|------------|
| GET_BY_ID | `TouristPointService.ts` | getById() | ✅ CORRETO | Join com locations |
| GET_BY_SLUG | `TouristPointService.ts` | getBySlug() | ❌ QUEBRADO | Busca por state/city string |
| LIST | `TouristPointService.ts` | list() | ⚠️ PARCIAL | Join com locations mas filtro quebrado |

### profiles
| Operação | Arquivo | Função | Status | Observação |
|----------|---------|--------|--------|------------|
| GET_BY_ID | `ProfileService.ts` | getProfile() | ❌ QUEBRADO | Não faz join com locations |
| LIST | `ProfileService.ts` | listProfiles() | ❌ QUEBRADO | Não faz join com locations |

### posts
| Operação | Arquivo | Função | Status | Observação |
|----------|---------|--------|--------|------------|
| GET_BY_ID | `PostService.ts` | getPost() | ❌ QUEBRADO | Não faz join com locations |
| LIST | `PostService.ts` | listPosts() | ❌ QUEBRADO | Não faz join com locations |

### business_data
| Operação | Arquivo | Função | Status | Observação |
|----------|---------|--------|--------|------------|
| GET_BY_ID | `BusinessService.ts` | getById() | ⚠️ PARCIAL | Join com locations mas campos legados expostos |
| LIST | `BusinessService.ts` | list() | ⚠️ PARCIAL | Join com locations mas campos legados expostos |

### classifieds
| Operação | Arquivo | Função | Status | Observação |
|----------|---------|--------|--------|------------|
| GET_BY_ID | `ClassifiedService.ts` | getById() | ⚠️ PARCIAL | Join com locations mas campos legados expostos |
| LIST | `ClassifiedService.ts` | getAllClassifieds() | ⚠️ PARCIAL | Join com locations mas campos legados expostos |

**Resumo Leitura:**
- ✅ CORRETO: 1 operação
- ⚠️ PARCIAL: 5 operações
- ❌ QUEBRADO: 6 operações

---

## 3. FILTRO (WHERE/FILTER)

### tourist_points
| Operação | Arquivo | Função | Status | Observação |
|----------|---------|--------|--------|------------|
| FILTER_BY_LOCATION | `TouristPointService.ts:69-70` | list() | ❌ QUEBRADO | `.eq('state')`, `.eq('city')` |
| FILTER_BY_SLUG | `TouristPointService.ts:126-127` | getBySlug() | ❌ QUEBRADO | `.eq('state')`, `.eq('city')` |
| COUNT_BY_CITY | `TouristPointService.ts:267-268` | countByCity() | ❌ QUEBRADO | `.eq('state')`, `.eq('city')` |
| GET_CATEGORIES | `TouristPointService.ts:278-279` | getCategoriesByCity() | ❌ QUEBRADO | `.eq('state')`, `.eq('city')` |
| GET_PHOTOS | `TouristPointService.ts:379-381` | getCommunityPhotos() | ❌ QUEBRADO | `.eq('city')`, `.eq('neighborhood')` |

### posts
| Operação | Arquivo | Função | Status | Observação |
|----------|---------|--------|--------|------------|
| FILTER_BY_LOCATION | `PostService.ts:304-307` | getPostsByLocation() | ❌ QUEBRADO | `.eq('city')`, `.eq('neighborhood')` |
| LIST_POSTS | `PostService.ts:445-448` | listPosts() | ❌ QUEBRADO | `.eq('city')`, `.eq('neighborhood')` |
| GET_FEED | `PostService.ts:1686-1692` | getPostsForFeed() | ❌ QUEBRADO | `.eq('city')`, `.eq('neighborhood')` |
| GET_BY_NEIGHBORHOOD | `PostService.ts:1740-1746` | getPostsByNeighborhood() | ❌ QUEBRADO | `.eq('city')`, `.eq('neighborhood')` |
| SEARCH | `PostService.ts:1818-1824` | searchPosts() | ❌ QUEBRADO | `.eq('city')`, `.eq('neighborhood')` |

### community_alerts
| Operação | Arquivo | Função | Status | Observação |
|----------|---------|--------|--------|------------|
| GET_ALERTS | `CommunityAlertService.ts:38` | getAlerts() | ❌ QUEBRADO | `.eq('city')` |
| ADMIN_LIST | `AdminCommunityAlertsService.ts:195` | list() | ❌ QUEBRADO | `.eq('city')` |

### community_issues
| Operação | Arquivo | Função | Status | Observação |
|----------|---------|--------|--------|------------|
| ADMIN_LIST | `AdminCommunityIssuesService.ts:204` | list() | ❌ QUEBRADO | `.eq('city')` |

### classifieds
| Operação | Arquivo | Função | Status | Observação |
|----------|---------|--------|--------|------------|
| GET_ALL | `ClassifiedService.ts:378-381` | getAllClassifieds() | ⚠️ PARCIAL | Usa applyTerritoryFilter mas fallback para string |

### community
| Operação | Arquivo | Função | Status | Observação |
|----------|---------|--------|--------|------------|
| GET_POSTS | `CommunityService.ts:613` | getPosts() | ❌ QUEBRADO | `.eq('city')` |

### civic
| Operação | Arquivo | Função | Status | Observação |
|----------|---------|--------|--------|------------|
| LIST_REPORTS | `CivicReportService.ts:107` | list() | ❌ QUEBRADO | `.eq('city')` |

### alerts (legado)
| Operação | Arquivo | Função | Status | Observação |
|----------|---------|--------|--------|------------|
| GET_ALERTS | `AlertService.ts:68` | getAlerts() | ❌ QUEBRADO | `.eq('city')` |
| FILTER_NEIGHBORHOOD | `AlertService.ts:73` | getAlerts() | ❌ QUEBRADO | `.eq('neighborhood')` |

### city
| Operação | Arquivo | Função | Status | Observação |
|----------|---------|--------|--------|------------|
| GET_METADATA | `CityService.ts:127-128` | getCityMetadata() | ❌ QUEBRADO | `.eq('state')`, `.eq('city')` |

**Resumo Filtro:**
- ✅ CORRETO: 0 operações
- ⚠️ PARCIAL: 1 operação
- ❌ QUEBRADO: 18 operações

---

## 4. RENDERIZAÇÃO (UI/DISPLAY)

### tourist_points
| Operação | Arquivo | Componente | Status | Observação |
|----------|---------|------------|--------|------------|
| ADMIN_LIST | `AdminPontosTuristicos.tsx` | - | ⚠️ PARCIAL | Exibe city/state legados |
| DETAIL_PAGE | `TouristPointDetailPage.tsx` | - | ❓ NÃO VERIFICADO | Precisa verificar |
| MAP_MARKER | `MapaPage.tsx` | - | ❓ NÃO VERIFICADO | Precisa verificar |

### profiles
| Operação | Arquivo | Componente | Status | Observação |
|----------|---------|------------|--------|------------|
| PUBLIC_PROFILE | `PublicProfilePage.tsx` | - | ❌ QUEBRADO | Exibe neighborhood string |
| PROFILE_CARD | `ProfileCard.tsx` | - | ❌ QUEBRADO | Exibe neighborhood string |

### posts
| Operação | Arquivo | Componente | Status | Observação |
|----------|---------|------------|--------|------------|
| POST_CARD | `PostCard.tsx` | - | ❌ QUEBRADO | Exibe neighborhood string |
| FEED | `FeedPage.tsx` | - | ❌ QUEBRADO | Exibe neighborhood string |

### classifieds
| Operação | Arquivo | Componente | Status | Observação |
|----------|---------|------------|--------|------------|
| CLASSIFIED_CARD | `ClassifiedCard.tsx` | - | ⚠️ PARCIAL | Exibe neighborhood mas pode ter location |
| LANDING_PAGE | `ClassificadosLandingPage.tsx` | - | ⚠️ PARCIAL | Filtros precisam verificação |

**Resumo Renderização:**
- ✅ CORRETO: 0 componentes
- ⚠️ PARCIAL: 3 componentes
- ❌ QUEBRADO: 4 componentes
- ❓ NÃO VERIFICADO: 2 componentes

---

## 5. URL (CANONICAL/ROUTING)

### tourist_points
| Operação | Arquivo | Função | Status | Observação |
|----------|---------|--------|--------|------------|
| BUILD_URL | `TouristPointUrlService.ts` | buildUrl() | ❓ NÃO VERIFICADO | Precisa verificar se usa geographic_path |
| RESOLVE_URL | `TouristPointService.ts` | getBySlug() | ❌ QUEBRADO | Usa state/city string |

### business_data
| Operação | Arquivo | Função | Status | Observação |
|----------|---------|--------|--------|------------|
| BUILD_URL | `BusinessUrlService.ts` | buildUrl() | ❓ NÃO VERIFICADO | Precisa verificar |

### classifieds
| Operação | Arquivo | Função | Status | Observação |
|----------|---------|--------|--------|------------|
| BUILD_URL | `ClassifiedUrlService.ts` | buildUrl() | ⚠️ PARCIAL | Usa geographic_path mas precisa verificar |

### gastronomy
| Operação | Arquivo | Função | Status | Observação |
|----------|---------|--------|--------|------------|
| BUILD_URL | `GastronomyUrlService.ts:50-51` | buildUrl() | ❌ QUEBRADO | Usa uf/cidade/bairro string |

**Resumo URL:**
- ✅ CORRETO: 0 operações
- ⚠️ PARCIAL: 1 operação
- ❌ QUEBRADO: 2 operações
- ❓ NÃO VERIFICADO: 2 operações

---

## 6. MAPA (GEOSPATIAL)

### tourist_points
| Operação | Arquivo | Componente | Status | Observação |
|----------|---------|------------|--------|------------|
| SHOW_ON_MAP | `MapaPage.tsx` | - | ❓ NÃO VERIFICADO | Precisa verificar coordenadas |
| MARKER_POPUP | `MapMarker.tsx` | - | ❓ NÃO VERIFICADO | Precisa verificar exibição |

### posts
| Operação | Arquivo | Componente | Status | Observação |
|----------|---------|------------|--------|------------|
| SHOW_ON_MAP | `MapaPage.tsx` | - | ❌ QUEBRADO | Usa neighborhood string |

### community_alerts
| Operação | Arquivo | Componente | Status | Observação |
|----------|---------|------------|--------|------------|
| SHOW_ON_MAP | `MapaPage.tsx` | - | ⚠️ PARCIAL | Tem lat/lng mas sem location_id |

### classifieds
| Operação | Arquivo | Componente | Status | Observação |
|----------|---------|------------|--------|------------|
| SHOW_ON_MAP | `MapaPage.tsx` | - | ⚠️ PARCIAL | Tem location_id mas precisa verificar |

**Resumo Mapa:**
- ✅ CORRETO: 0 operações
- ⚠️ PARCIAL: 2 operações
- ❌ QUEBRADO: 1 operação
- ❓ NÃO VERIFICADO: 2 operações

---

## RESUMO GERAL POR TIPO DE OPERAÇÃO

| Tipo | ✅ Correto | ⚠️ Parcial | ❌ Quebrado | ❓ Não Verificado | Total |
|------|-----------|-----------|------------|------------------|-------|
| Escrita | 3 (17%) | 4 (22%) | 11 (61%) | 0 (0%) | 18 |
| Leitura | 1 (8%) | 5 (42%) | 6 (50%) | 0 (0%) | 12 |
| Filtro | 0 (0%) | 1 (5%) | 18 (95%) | 0 (0%) | 19 |
| Renderização | 0 (0%) | 3 (33%) | 4 (44%) | 2 (22%) | 9 |
| URL | 0 (0%) | 1 (20%) | 2 (40%) | 2 (40%) | 5 |
| Mapa | 0 (0%) | 2 (40%) | 1 (20%) | 2 (40%) | 5 |
| **TOTAL** | **4 (6%)** | **16 (24%)** | **42 (62%)** | **6 (9%)** | **68** |

---

## PRIORIZAÇÃO POR IMPACTO

### 🔴 CRÍTICO (Bloqueia Funcionalidade)
1. **Filtro:** 18 operações quebradas (95%)
2. **Escrita:** 11 operações quebradas (61%)
3. **Leitura:** 6 operações quebradas (50%)

### 🟡 ALTO (Degrada Experiência)
4. **Renderização:** 4 operações quebradas (44%)
5. **URL:** 2 operações quebradas (40%)
6. **Mapa:** 1 operação quebrada (20%)

### 🟢 MÉDIO (Precisa Verificação)
7. **Não Verificado:** 6 operações (9%)

---

**Próximo Passo:** Usar este inventário para priorizar correções no backlog executável
