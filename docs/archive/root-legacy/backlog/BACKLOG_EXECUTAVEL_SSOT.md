
# 📋 BACKLOG EXECUTÁVEL - CORREÇÃO SSOT TERRITORIAL

**Data:** 2026-04-05  
**Formato:** Arquivo/Função → Problema → Severidade → Correção → Estimativa

---

## MÓDULO: tourist_points (CASO PILOTO PARCIAL)

### ✅ JÁ CORRIGIDO
| Arquivo | Função | Problema | Status |
|---------|--------|----------|--------|
| `AdminPontosTuristicos.tsx` | TouristPointForm | Input livre | ✅ Usa TerritorialSelector |
| `TouristPointService.ts` | create() | Sem validação | ✅ Valida location_id |
| `TouristPointService.ts` | update() | Sem validação | ✅ Valida location_id |
| `20260405000005_enforce_tourist_points_ssot.sql` | - | Sem FK | ✅ FK + índice criados |

### ❌ PENDENTE
| Arquivo | Função | Tipo | Severidade | Correção | Estimativa |
|---------|--------|------|------------|----------|------------|
| `TouristPointService.ts:69-70` | list() | Filtro por string | 🔴 ALTA | Substituir por `applyTerritoryFilter` | 2h |
| `TouristPointService.ts:126-127` | getBySlug() | Busca por string | 🔴 ALTA | Buscar por location.geographic_path | 3h |
| `TouristPointService.ts:267-268` | countByCity() | Contador por string | 🟡 MÉDIA | Contar por location_id | 1h |
| `TouristPointService.ts:278-279` | getCategoriesByCity() | Filtro por string | 🟡 MÉDIA | Filtrar por location_id | 1h |
| `TouristPointService.ts:379-381` | getCommunityPhotos() | Filtro por string | 🟡 MÉDIA | Filtrar por location_id | 2h |
| `TouristPointDetailPage.tsx` | - | Página pública | 🟡 MÉDIA | Verificar uso de location | 1h |
| `MapaPage.tsx` | - | Exibição no mapa | 🟡 MÉDIA | Verificar coordenadas | 1h |
| `TouristPointUrlService.ts` | buildUrl() | URL com texto | 🟡 MÉDIA | Usar geographic_path | 2h |

**Total Estimado:** 13h (1.6 dias)

---

## MÓDULO: profiles

### ❌ TODOS PENDENTES
| Arquivo | Função | Tipo | Severidade | Correção | Estimativa |
|---------|--------|------|------------|----------|------------|
| `supabase/migrations/` | - | Sem FK | 🔴 CRÍTICA | Criar migração com FK | 2h |
| `supabase/migrations/` | - | Backfill | 🔴 CRÍTICA | Migrar 11 registros | 4h |
| `EditProfileForm.tsx` | - | Input livre | 🔴 CRÍTICA | Usar TerritorialSelector | 3h |
| `OnboardingPage.tsx` | handleNeighborhoodSelect | Input livre | 🔴 CRÍTICA | Usar TerritorialSelector | 4h |
| `ProfileService.ts` | updateProfile() | Sem validação | 🔴 CRÍTICA | Validar location_id | 2h |
| `ProfileService.ts` | getProfile() | Leitura | 🟡 MÉDIA | Join com locations | 1h |
| `PublicProfilePage.tsx` | - | Exibição | 🟡 MÉDIA | Exibir location.name | 1h |

**Total Estimado:** 17h (2.1 dias)

---

## MÓDULO: posts

### ❌ TODOS PENDENTES
| Arquivo | Função | Tipo | Severidade | Correção | Estimativa |
|---------|--------|------|------------|----------|------------|
| `supabase/migrations/` | - | Sem FK | 🔴 CRÍTICA | Criar migração com FK | 2h |
| `PostService.ts:304-307` | getPostsByLocation() | Filtro por string | 🔴 CRÍTICA | Usar applyTerritoryFilter | 3h |
| `PostService.ts:445-448` | listPosts() | Filtro por string | 🔴 CRÍTICA | Usar applyTerritoryFilter | 3h |
| `PostService.ts:1686-1692` | getPostsForFeed() | Filtro por string | 🔴 CRÍTICA | Usar applyTerritoryFilter | 3h |
| `PostService.ts:1740-1746` | getPostsByNeighborhood() | Filtro por string | 🔴 CRÍTICA | Usar applyTerritoryFilter | 3h |
| `PostService.ts:1818-1824` | searchPosts() | Filtro por string | 🔴 CRÍTICA | Usar applyTerritoryFilter | 3h |
| `CreatePostForm.tsx` | - | Input livre | 🔴 CRÍTICA | Usar TerritorialSelector | 4h |
| `MapaPage.tsx` | - | Exibição no mapa | 🟡 MÉDIA | Usar location_id | 2h |

**Total Estimado:** 23h (2.9 dias)

---

## MÓDULO: business_data

### ❌ PENDENTE
| Arquivo | Função | Tipo | Severidade | Correção | Estimativa |
|---------|--------|------|------------|----------|------------|
| `supabase/migrations/` | - | Backfill | 🟡 MÉDIA | Migrar 1 registro | 1h |
| `BusinessService.ts` | create() | Sem validação | 🟡 MÉDIA | Validar location_id | 2h |
| `BusinessService.ts` | update() | Sem validação | 🟡 MÉDIA | Validar location_id | 1h |
| `CreateBusinessForm.tsx` | - | Input livre | 🟡 MÉDIA | Usar TerritorialSelector | 3h |
| `BusinessUrlService.ts` | buildUrl() | URL com texto | 🟡 MÉDIA | Usar geographic_path | 2h |

**Total Estimado:** 9h (1.1 dias)

---

## MÓDULO: classifieds

### ⚠️ PARCIALMENTE CORRIGIDO
| Arquivo | Função | Tipo | Severidade | Correção | Estimativa |
|---------|--------|------|------------|----------|------------|
| `ClassifiedService.ts:378-381` | getCommunityPhotos() | Filtro por string | 🟡 MÉDIA | Usar location_id | 2h |
| `ClassifiedUrlService.ts` | buildUrl() | URL | 🟡 MÉDIA | Verificar geographic_path | 1h |
| `ClassificadosLandingPage.tsx` | - | Filtros | 🟡 MÉDIA | Verificar uso de location_id | 2h |

**Total Estimado:** 5h (0.6 dias)

---

## MÓDULO: community_alerts

### ❌ TODOS PENDENTES
| Arquivo | Função | Tipo | Severidade | Correção | Estimativa |
|---------|--------|------|------------|----------|------------|
| `supabase/migrations/` | - | Sem location_id | 🔴 CRÍTICA | Adicionar coluna | 1h |
| `supabase/migrations/` | - | Backfill | 🔴 CRÍTICA | Migrar 1 registro | 1h |
| `CommunityAlertService.ts:38` | getAlerts() | Filtro por string | 🔴 CRÍTICA | Usar applyTerritoryFilter | 3h |
| `CreateAlertForm.tsx` | - | Input livre | 🔴 CRÍTICA | Usar TerritorialSelector | 4h |
| `AdminCommunityAlertsService.ts:195` | list() | Filtro por string | 🟡 MÉDIA | Usar applyTerritoryFilter | 2h |

**Total Estimado:** 11h (1.4 dias)

---

## MÓDULO: community_issues

### ❌ TODOS PENDENTES
| Arquivo | Função | Tipo | Severidade | Correção | Estimativa |
|---------|--------|------|------------|----------|------------|
| `supabase/migrations/` | - | Sem location_id | 🔴 CRÍTICA | Adicionar coluna | 1h |
| `CreateIssueForm.tsx` | - | Input livre | 🔴 CRÍTICA | Usar TerritorialSelector | 4h |
| `AdminCommunityIssuesService.ts:204` | list() | Filtro por string | 🟡 MÉDIA | Usar applyTerritoryFilter | 2h |

**Total Estimado:** 7h (0.9 dias)

---

## MÓDULO: community (CommunityService)

### ❌ PENDENTE
| Arquivo | Função | Tipo | Severidade | Correção | Estimativa |
|---------|--------|------|------------|----------|------------|
| `CommunityService.ts:613` | getPosts() | Filtro por string | 🟡 MÉDIA | Usar applyTerritoryFilter | 2h |

**Total Estimado:** 2h (0.25 dias)

---

## MÓDULO: civic (CivicReportService)

### ❌ PENDENTE
| Arquivo | Função | Tipo | Severidade | Correção | Estimativa |
|---------|--------|------|------------|----------|------------|
| `CivicReportService.ts:107` | list() | Filtro por string | 🟡 MÉDIA | Usar applyTerritoryFilter | 2h |

**Total Estimado:** 2h (0.25 dias)

---

## MÓDULO: alerts (AlertService - Legado)

### ❌ PENDENTE
| Arquivo | Função | Tipo | Severidade | Correção | Estimativa |
|---------|--------|------|------------|----------|------------|
| `AlertService.ts:68` | getAlerts() | Filtro por string | 🟡 MÉDIA | Usar applyTerritoryFilter | 2h |
| `AlertService.ts:73` | getAlerts() | Filtro por string | 🟡 MÉDIA | Usar applyTerritoryFilter | 1h |

**Total Estimado:** 3h (0.4 dias)

---

## MÓDULO: city (CityService)

### ❌ PENDENTE
| Arquivo | Função | Tipo | Severidade | Correção | Estimativa |
|---------|--------|------|------------|----------|------------|
| `CityService.ts:127-128` | getCityMetadata() | Busca por string | 🟡 MÉDIA | Deprecar tabela city_metadata | 4h |

**Total Estimado:** 4h (0.5 dias)

---

## RESUMO CONSOLIDADO

### Por Severidade
- 🔴 CRÍTICA: 15 itens (60h / 7.5 dias)
- 🟡 MÉDIA: 20 itens (35h / 4.4 dias)
- **TOTAL:** 35 itens (95h / 11.9 dias)

### Por Tipo de Problema
- Filtro por string: 15 ocorrências
- Input livre: 6 ocorrências
- Sem validação: 5 ocorrências
- Migração/Backfill: 5 ocorrências
- URL/Mapa: 4 ocorrências

### Por Módulo (Ordenado por Prioridade)
1. **posts:** 23h (2.9 dias) - 🔴 CRÍTICO
2. **profiles:** 17h (2.1 dias) - 🔴 CRÍTICO
3. **tourist_points:** 13h (1.6 dias) - 🟡 COMPLETAR PILOTO
4. **community_alerts:** 11h (1.4 dias) - 🔴 CRÍTICO
5. **business_data:** 9h (1.1 dias) - 🟡 MÉDIA
6. **community_issues:** 7h (0.9 dias) - 🔴 CRÍTICO
7. **classifieds:** 5h (0.6 dias) - 🟡 BAIXA
8. **city:** 4h (0.5 dias) - 🟡 BAIXA
9. **alerts:** 3h (0.4 dias) - 🟡 BAIXA
10. **community:** 2h (0.25 dias) - 🟡 BAIXA
11. **civic:** 2h (0.25 dias) - 🟡 BAIXA

### Cronograma Sugerido

**Sprint 1 (2 semanas):**
- tourist_points (completar piloto)
- profiles
- posts

**Sprint 2 (1 semana):**
- community_alerts
- community_issues

**Sprint 3 (1 semana):**
- business_data
- classifieds
- Demais módulos

**Total:** 4 semanas de desenvolvimento + 2 semanas de testes/validação = 6 semanas

---

**Próximo Passo:** Aprovar backlog e iniciar Sprint 1
