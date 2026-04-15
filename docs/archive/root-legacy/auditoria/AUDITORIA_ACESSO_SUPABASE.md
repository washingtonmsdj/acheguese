# AUDITORIA ESPECÍFICA DE ACESSO AO SUPABASE E OWNERSHIP DE PERSISTÊNCIA

**Data:** 30/03/2026  
**Versão:** 1.0.0  
**Objetivo:** Mapear exatamente quem acessa o Supabase, em quais arquivos, em quais camadas

---

## 1. LISTA EXATA DE TODOS OS ARQUIVOS QUE IMPORTAM O CLIENTE DO SUPABASE

### 1.1 Camada APP (1 arquivo)

| Arquivo | Camada | Client | Operações | Observação |
|---------|--------|--------|-----------|------------|
| `src/app/pages/SimpleLoginPage.tsx` | app | supabase | auth (signInWithPassword) | ⚠️ VIOLAÇÃO - Deveria usar AuthService |

### 1.2 Camada MODULES (18 arquivos)

#### modules/admin (4 arquivos)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/modules/admin/pages/BannersPage.tsx` | supabase (via @/core/supabase) | from("banners").insert, from("banners").delete, storage.from("banners") | ⚠️ VIOLAÇÃO - Deveria usar BannerService |
| `src/modules/admin/pages/AdminCityMetadata.tsx` | supabase | from("city_metadata") | ⚠️ VIOLAÇÃO - Deveria usar CityService |
| `src/modules/admin/pages/AdminReportsPassageiros.tsx` | supabase (via @/core/supabase) | Apenas import, não usa diretamente | ✅ OK - Usa MobilityService |
| `src/modules/admin/components/FraudDetectionPanel.tsx` | supabase | Apenas import, não usa diretamente | ✅ OK - Usa profileService |

#### modules/business (2 arquivos)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/modules/business/services/BusinessManagementService.ts` | supabase (via @/core/supabase) | from("business_sections").insert, storage.from("business-images") | ⚠️ VIOLAÇÃO - Service em module acessando banco |
| `src/modules/business/components/BusinessTabs.tsx` | supabase | Apenas import, não usa diretamente | ✅ OK - Usa BusinessService |

#### modules/mobility (4 arquivos)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/modules/mobility/services/MobilityService.ts` | supabase (via @/core/supabase) | Múltiplas operações de leitura/escrita | ⚠️ VIOLAÇÃO - Service em module acessando banco |
| `src/modules/mobility/services/DriverService.ts` | supabase (via @/core/supabase) | Múltiplas operações de leitura/escrita | ⚠️ VIOLAÇÃO - Service em module acessando banco |
| `src/modules/mobility/services/RideService.ts` | supabase | from("emergency_alerts").insert | ⚠️ VIOLAÇÃO - Service em module acessando banco |
| `src/modules/mobility/hooks/useRideChat.ts` | supabase (via @/core/supabase) | Realtime subscriptions | ⚠️ VIOLAÇÃO - Hook acessando banco |
| `src/modules/mobility/hooks/useMobilidadeChat.ts` | supabase (via @/core/supabase) | Realtime subscriptions | ⚠️ VIOLAÇÃO - Hook acessando banco |

#### modules/community-alerts (3 arquivos)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/modules/community-alerts/services/CommunityAlertService.ts` | supabase | from("community_alerts"), rpc("create_community_alert") | ✅ PERMITIDO - Service SSOT do módulo |
| `src/modules/community-alerts/services/AlertModerationService.ts` | supabase | from("community_alerts").update | ✅ PERMITIDO - Service SSOT do módulo |
| `src/modules/community-alerts/services/AlertNotificationService.ts` | supabase | from("community_alerts").select | ✅ PERMITIDO - Service SSOT do módulo |

#### modules/community-issues (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/modules/community-issues/services/CommunityIssueService.ts` | supabase | from("community_issues"), from("community_issue_supports") | ✅ PERMITIDO - Service SSOT do módulo |

#### modules/promotions (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/modules/promotions/repositories/AdRepositorySupabase.ts` | supabase | from("ad_campaigns"), from("ad_targets") | ✅ PERMITIDO - Repository do módulo |

#### modules/verification (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/modules/verification/services/VerificationService.ts` | supabase | from("verification") | ⚠️ DUPLICADO - Existe core/verification/services/VerificationService.ts |

#### modules/professionals (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/modules/professionals/hooks/useProfessionalBySlug.ts` | supabase | from("professional_data").select | ⚠️ VIOLAÇÃO - Hook acessando banco, deveria usar ProfessionalService |

#### modules/profile (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/modules/profile/components/ResidentVerificationCard.tsx` | supabase | storage.from("verification-documents") | ⚠️ VIOLAÇÃO - Componente acessando storage |



### 1.3 Camada CORE (40+ arquivos)

#### core/profiles (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/profiles/services/ProfileService.ts` | supabase | from("profiles"), from("profile_members"), from("profile_favorites"), from("user_subscriptions"), from("verification") | ✅ SSOT - Acesso legítimo |

#### core/session (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/session/services/SessionService.ts` | supabase (via @/core/supabase) | auth.onAuthStateChange, auth.getUser, auth.getSession, auth.signOut | ✅ SSOT - Único lugar autorizado para auth.getUser() |

#### core/auth (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/auth/services/AuthService.ts` | supabase | storage.from("avatars"), auth (delegado para SessionService) | ✅ SSOT - Acesso legítimo |

#### core/posts (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/posts/services/PostService.ts` | supabase | from("posts"), from("community_posts"), from("community_polls"), storage.from("posts") | ✅ SSOT - Acesso legítimo |

#### core/comments (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/comments/services/CommentService.ts` | supabase | from("comments") | ✅ SSOT - Acesso legítimo |

#### core/social (3 arquivos)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/social/services/SocialInteractionsService.ts` | supabase | from("post_likes_new"), from("saved_posts_new"), from("user_follows"), from("groups"), from("group_members_new") | ✅ SSOT - Acesso legítimo |
| `src/core/social/services/BlockService.ts` | supabase | from("user_blocks") | ✅ SSOT - Acesso legítimo |
| `src/core/social/services/GroupService.ts` | supabase | from("groups"), from("group_members_new"), from("group_messages_new") | ✅ SSOT - Acesso legítimo |

#### core/business (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/business/services/BusinessService.ts` | supabase | from("business_data"), from("business_stats"), from("business_products"), from("business_services"), from("business_views"), from("business_favorites") | ✅ SSOT - Acesso legítimo |

#### core/professional (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/professional/services/ProfessionalService.ts` | supabase | from("professional_data"), from("professional_stats"), from("professional_jobs"), from("professional_favorites") | ✅ SSOT - Acesso legítimo |

#### core/classifieds (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/classifieds/services/ClassifiedService.ts` | supabase | from("classifieds"), from("classified_likes") | ✅ SSOT - Acesso legítimo |

#### core/notifications (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/notifications/services/NotificationService.ts` | supabase | from("notifications"), from("user_notification_settings") | ✅ SSOT - Acesso legítimo |

#### core/moderation (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/moderation/ModerationService.ts` | supabase | from("banned_users"), from("moderation_queue"), from("moderation_actions") | ✅ SSOT - Acesso legítimo |

#### core/reviews (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/reviews/services/ReviewsService.ts` | supabase | from("reviews") | ✅ SSOT - Acesso legítimo |

#### core/favorites (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/favorites/services/FavoritesService.ts` | supabase | from("profile_favorites"), from("business_favorites"), from("professional_favorites") | ✅ SSOT - Acesso legítimo |

#### core/location (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/location/services/LocationService.ts` | supabase | from("locations"), rpc("rpc_get_location_descendants_ids") | ✅ SSOT - Acesso legítimo |

#### core/territorial (3 arquivos)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/territorial/services/TerritorialGroupService.ts` | supabase | from("territorial_groups") | ✅ SSOT - Acesso legítimo |
| `src/core/territorial/highlights/TerritorialHighlightRepositorySupabase.ts` | supabase | from("territorial_highlights") | ✅ SSOT - Acesso legítimo |
| `src/core/territorial/hooks/useTerritoryAIContent.ts` | supabase (via @/core/supabase) | functions.invoke("territory-ai-content") | ⚠️ VIOLAÇÃO - Hook acessando edge function |
| `src/core/territorial/hooks/useTerritoryStats.ts` | supabase | from("posts"), from("businesses"), from("professionals") | ⚠️ VIOLAÇÃO - Hook acessando banco |

#### core/city (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/city/hooks/useCityMetadata.ts` | supabase | from("city_metadata") | ⚠️ VIOLAÇÃO - Hook acessando banco, deveria ter CityService |

#### core/realtime (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/realtime/services/RealtimeService.ts` | supabase | channel() subscriptions | ✅ SSOT - Acesso legítimo |

#### core/verification (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/verification/services/VerificationService.ts` | supabase | from("verification"), storage.from("verification-documents") | ✅ SSOT - Acesso legítimo |

#### core/subscription (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/subscription/services/SubscriptionService.ts` | supabase | from("user_subscriptions") | ✅ SSOT - Acesso legítimo |

#### core/residence (2 arquivos)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/residence/services/ResidenceService.ts` | supabase | from("user_residences") | ✅ SSOT - Acesso legítimo |
| `src/core/residence/migrations/migrateUserResidencesToCanonical.ts` | supabase | from("user_residences"), from("addresses") | ✅ OK - Script de migração |

#### core/service-areas (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/service-areas/services/ServiceAreasService.ts` | supabase | from("service_areas") | ✅ SSOT - Acesso legítimo |

#### core/rollout (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/rollout/repositories/RolloutRepositorySupabase.ts` | supabase | from("module_rollouts") | ✅ SSOT - Acesso legítimo |

#### core/media (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/media/services/MediaService.ts` | supabase | storage.from("avatars"), storage.from("post-images") | ✅ SSOT - Acesso legítimo |

#### core/metrics (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/metrics/services/MetricsService.ts` | supabase | from("profiles"), from("user_sessions"), from("rides"), from("posts"), from("business_data") | ✅ SSOT - Acesso legítimo para métricas |

#### core/admin (2 arquivos)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/admin/services/AdminBusinessService.ts` | supabase | from("businesses").delete | ✅ SSOT - Acesso legítimo |
| `src/core/admin/utils/adminApi.ts` | supabase | from(table).delete | ✅ SSOT - Utilitário admin |

#### core/ride (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/ride/migrations/migrateRideRequestsToCanonical.ts` | supabase | from("ride_requests"), from("addresses") | ✅ OK - Script de migração |

#### core/address (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/address/services/AddressService.ts` | supabase | from("addresses") | ✅ SSOT - Acesso legítimo |

#### core/geospatial (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/geospatial/services/GeospatialService.ts` | supabase | rpc() para operações geoespaciais | ✅ SSOT - Acesso legítimo |

#### core/governance (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/governance/repositories/GovernanceRepositorySupabase.ts` | supabase | from("location_versions"), from("location_aliases"), from("slug_redirects") | ✅ SSOT - Acesso legítimo |

#### core/coverage (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/coverage/services/CoverageService.ts` | supabase | from("service_areas"), from("coverage") | ✅ SSOT - Acesso legítimo |

#### core/messaging (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/messaging/MessagingService.ts` | supabase | from("conversations"), from("messages") | ✅ SSOT - Acesso legítimo |

#### core/gamification (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/gamification/services/GamificationService.ts` | supabase | from("user_badges"), from("user_achievements"), from("leaderboard") | ✅ SSOT - Acesso legítimo |

#### core/events (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/events/services/EventsService.ts` | supabase | from("events"), from("event_participants") | ✅ SSOT - Acesso legítimo |

#### core/lostfound (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/lostfound/services/LostFoundService.ts` | supabase | from("lost_found_items") | ✅ SSOT - Acesso legítimo |

#### core/civic (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/civic/services/CivicReportService.ts` | supabase | from("civic_reports") | ✅ SSOT - Acesso legítimo |

#### core/community (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/community/services/CommunityService.ts` | supabase | from("posts"), from("comments") | ✅ SSOT - Acesso legítimo |

#### core/banners (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/banners/services/BannerService.ts` | supabase | from("banners") | ✅ SSOT - Acesso legítimo |

#### core/analytics (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/analytics/services/AnalyticsService.ts` | supabase | from("analytics_events") | ✅ SSOT - Acesso legítimo |

#### core/search (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/search/services/SearchService.ts` | supabase | from() múltiplas tabelas para busca | ✅ SSOT - Acesso legítimo |

#### core/maps (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/maps/services/MapsService.ts` | supabase | from("saved_locations"), from("map_visit_history") | ✅ SSOT - Acesso legítimo |

#### core/feed (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/feed/services/FeedService.ts` | supabase | from() múltiplas tabelas para agregação | ✅ SSOT - Acesso legítimo |

#### core/public-identity (1 arquivo)
| Arquivo | Client | Operações | Observação |
|---------|--------|-----------|------------|
| `src/core/public-identity/services/PublicIdentityService.ts` | supabase | from("business_slug_history"), from("profile_username_history"), from("classified_url_history") | ✅ SSOT - Acesso legítimo |



### 1.4 Camada SHARED (0 arquivos)

✅ NENHUM ARQUIVO EM SHARED ACESSA SUPABASE - Correto conforme arquitetura

### 1.5 Camada INTEGRATIONS (3 arquivos)

| Arquivo | Camada | Client | Operações | Observação |
|---------|--------|--------|-----------|------------|
| `src/integrations/supabase/client.ts` | integrations | createClient | Criação do cliente | ✅ OK - Configuração |
| `src/integrations/supabase/supabase.ts` | integrations | createClient | Criação do cliente | ✅ OK - Configuração |
| `src/integrations/supabase/untyped-client.ts` | integrations | supabase | Re-export como `db` | ✅ OK - Utilitário |

### 1.6 Camada SERVICES LEGADO (0 arquivos ativos)

✅ NENHUM ARQUIVO EM src/services/ ACESSA SUPABASE - Pasta legada vazia de código ativo

### 1.7 Scripts e Testes (20+ arquivos)

**Observação:** Scripts de migração, seed, validação e testes acessam Supabase diretamente. Isso é esperado e correto.

---

## 2. LISTA EXATA DE TODOS OS ARQUIVOS QUE CHAMAM OPERAÇÕES SUPABASE

### 2.1 supabase.from() - Acesso a Tabelas

#### VIOLAÇÕES ENCONTRADAS (11 arquivos):

**app/ (1 violação):**
- ❌ `src/app/pages/SimpleLoginPage.tsx` - Deveria usar AuthService

**modules/ (10 violações):**
- ❌ `src/modules/admin/pages/BannersPage.tsx` - from("banners")
- ❌ `src/modules/admin/pages/AdminCityMetadata.tsx` - from("city_metadata")
- ❌ `src/modules/business/services/BusinessManagementService.ts` - from("business_sections")
- ❌ `src/modules/mobility/services/MobilityService.ts` - Múltiplas tabelas
- ❌ `src/modules/mobility/services/DriverService.ts` - Múltiplas tabelas
- ❌ `src/modules/mobility/services/RideService.ts` - from("emergency_alerts")
- ❌ `src/modules/professionals/hooks/useProfessionalBySlug.ts` - from("professional_data")
- ⚠️ `src/modules/community-alerts/services/*` - from("community_alerts") - PERMITIDO (SSOT do módulo)
- ⚠️ `src/modules/community-issues/services/*` - from("community_issues") - PERMITIDO (SSOT do módulo)
- ⚠️ `src/modules/promotions/repositories/*` - from("ad_campaigns") - PERMITIDO (Repository do módulo)

**core/ (3 violações menores):**
- ⚠️ `src/core/city/hooks/useCityMetadata.ts` - from("city_metadata") - Deveria ter CityService
- ⚠️ `src/core/territorial/hooks/useTerritoryStats.ts` - from() múltiplas - Deveria usar services
- ✅ Todos os outros acessos em core/ são legítimos (40+ services SSOT)

### 2.2 supabase.auth.* - Autenticação

#### ACESSOS LEGÍTIMOS (1 arquivo):
- ✅ `src/core/session/services/SessionService.ts` - Único lugar autorizado para auth.getUser()

#### VIOLAÇÕES ENCONTRADAS (1 arquivo):
- ❌ `src/app/pages/SimpleLoginPage.tsx` - auth.signInWithPassword() direto

#### ACESSOS EM SCRIPTS (20+ arquivos):
- ✅ Scripts de seed, migração e testes - Esperado e correto

### 2.3 supabase.storage.* - Storage

#### ACESSOS LEGÍTIMOS (4 arquivos):
- ✅ `src/core/auth/services/AuthService.ts` - storage.from("avatars")
- ✅ `src/core/posts/services/PostService.ts` - storage.from("posts")
- ✅ `src/core/media/services/MediaService.ts` - storage.from("avatars"), storage.from("post-images")
- ✅ `src/core/verification/services/VerificationService.ts` - storage.from("verification-documents")

#### VIOLAÇÕES ENCONTRADAS (4 arquivos):
- ❌ `src/modules/admin/pages/BannersPage.tsx` - storage.from("banners")
- ❌ `src/modules/business/services/BusinessManagementService.ts` - storage.from("business-images")
- ❌ `src/modules/profile/components/ResidentVerificationCard.tsx` - storage.from("verification-documents")

### 2.4 supabase.channel() - Realtime

#### ACESSOS LEGÍTIMOS (1 arquivo):
- ✅ `src/core/realtime/services/RealtimeService.ts` - SSOT para realtime

#### VIOLAÇÕES ENCONTRADAS (2 arquivos):
- ❌ `src/modules/mobility/hooks/useRideChat.ts` - channel() direto
- ❌ `src/modules/mobility/hooks/useMobilidadeChat.ts` - channel() direto

### 2.5 .rpc() - Remote Procedure Calls

#### ACESSOS LEGÍTIMOS (10+ arquivos em core/):
- ✅ `src/core/location/services/LocationService.ts` - rpc("rpc_get_location_descendants_ids")
- ✅ `src/core/geospatial/services/GeospatialService.ts` - rpc() para operações geoespaciais
- ✅ `src/core/community-alerts/services/CommunityAlertService.ts` - rpc("create_community_alert")
- ✅ Outros services em core/ - RPCs específicos de domínio

#### ACESSOS EM SCRIPTS (30+ arquivos):
- ✅ Scripts de migração, seed e testes - Esperado e correto

### 2.6 supabase.functions.invoke() - Edge Functions

#### VIOLAÇÕES ENCONTRADAS (1 arquivo):
- ⚠️ `src/core/territorial/hooks/useTerritoryAIContent.ts` - functions.invoke("territory-ai-content")

---

## 3. MAPA DE OWNERSHIP DE PERSISTÊNCIA POR DOMÍNIO

### 3.1 Domínios com SSOT Limpo em CORE

| Domínio | Service SSOT | Localização | Acesso ao Banco | Concorrência | Status |
|---------|--------------|-------------|-----------------|--------------|--------|
| **profiles** | ProfileService | core/profiles | ✅ Apenas service | ❌ Nenhuma | ✅ LIMPO |
| **auth** | AuthService | core/auth | ✅ Apenas service (delega auth para SessionService) | ❌ Nenhuma | ✅ LIMPO |
| **session** | SessionService | core/session | ✅ Apenas service (único acesso a auth.getUser) | ❌ Nenhuma | ✅ LIMPO |
| **location** | LocationService | core/location | ✅ Apenas service | ❌ Nenhuma | ✅ LIMPO |
| **territorial** | TerritorialGroupService | core/territorial | ⚠️ Service + 2 hooks violadores | ⚠️ Hooks acessam banco | ⚠️ PARCIAL |
| **business** | BusinessService | core/business | ✅ Apenas service | ❌ Nenhuma | ✅ LIMPO |
| **professional** | ProfessionalService | core/professional | ⚠️ Service + 1 hook violador | ⚠️ Hook acessa banco | ⚠️ PARCIAL |
| **classifieds** | ClassifiedService | core/classifieds | ✅ Apenas service | ❌ Nenhuma | ✅ LIMPO |
| **posts** | PostService | core/posts | ✅ Apenas service | ❌ Nenhuma | ✅ LIMPO |
| **comments** | CommentService | core/comments | ✅ Apenas service | ❌ Nenhuma | ✅ LIMPO |
| **social** | SocialInteractionsService, BlockService, GroupService | core/social | ✅ Apenas services | ❌ Nenhuma | ✅ LIMPO |
| **community** | CommunityService | core/community | ✅ Apenas service | ❌ Nenhuma | ✅ LIMPO |
| **messaging** | MessagingService | core/messaging | ✅ Apenas service | ❌ Nenhuma | ✅ LIMPO |
| **notifications** | NotificationService | core/notifications | ✅ Apenas service | ❌ Nenhuma | ✅ LIMPO |
| **moderation** | ModerationService | core/moderation | ✅ Apenas service | ❌ Nenhuma | ✅ LIMPO |
| **reviews** | ReviewsService | core/reviews | ✅ Apenas service | ❌ Nenhuma | ✅ LIMPO |
| **favorites** | FavoritesService | core/favorites | ✅ Apenas service | ❌ Nenhuma | ✅ LIMPO |
| **rollout** | RolloutService | core/rollout | ✅ Apenas repository | ❌ Nenhuma | ✅ LIMPO |
| **realtime** | RealtimeService | core/realtime | ✅ Apenas service | ❌ Nenhuma | ✅ LIMPO |
| **verification** | VerificationService | core/verification | ✅ Service em core | ⚠️ Duplicado em modules | ⚠️ DUPLICADO |
| **admin** | AdminService, AdminBusinessService | core/admin | ✅ Apenas services | ❌ Nenhuma | ✅ LIMPO |

### 3.2 Domínios com SSOT em MODULES (Permitidos)

| Domínio | Service SSOT | Localização | Acesso ao Banco | Justificativa | Status |
|---------|--------------|-------------|-----------------|---------------|--------|
| **alerts** | CommunityAlertService | modules/community-alerts | ✅ Apenas services do módulo | Módulo isolado com SSOT próprio | ✅ PERMITIDO |
| **issues** | CommunityIssueService | modules/community-issues | ✅ Apenas services do módulo | Módulo isolado com SSOT próprio | ✅ PERMITIDO |
| **promotions** | AdRepositorySupabase | modules/promotions | ✅ Apenas repository do módulo | Módulo isolado com repository pattern | ✅ PERMITIDO |

### 3.3 Domínios com VIOLAÇÕES

| Domínio | Problema | Arquivos Violadores | Severidade | Ação Recomendada |
|---------|----------|---------------------|------------|------------------|
| **mobility** | Services em module acessando banco | MobilityService.ts, DriverService.ts, RideService.ts, 2 hooks | 🔴 ALTA | Mover services para core/mobility |
| **business** | Service em module acessando banco | BusinessManagementService.ts | 🟡 MÉDIA | Mover para core/business ou usar BusinessService |
| **city** | Hook acessando banco sem service | useCityMetadata.ts | 🟡 MÉDIA | Criar CityService em core/city |
| **territorial** | Hooks acessando banco | useTerritoryAIContent.ts, useTerritoryStats.ts | 🟡 MÉDIA | Criar services ou usar existentes |
| **professional** | Hook acessando banco | useProfessionalBySlug.ts | 🟡 MÉDIA | Usar ProfessionalService |
| **verification** | Duplicação core + modules | 2 VerificationService | 🟡 MÉDIA | Remover de modules, usar core |
| **banners** | Página admin acessando banco | BannersPage.tsx | 🟡 MÉDIA | Usar BannerService |
| **admin** | Página admin acessando banco | AdminCityMetadata.tsx | 🟡 MÉDIA | Criar CityService |



---

## 4. CONTRADIÇÕES COM A AUDITORIA ANTERIOR

### 4.1 Simplificações Excessivas Identificadas

**Auditoria Anterior Afirmou:**
> "✅ Nenhuma página acessa Supabase diretamente"

**Realidade Encontrada:**
- ❌ `src/app/pages/SimpleLoginPage.tsx` acessa Supabase diretamente
- ❌ `src/modules/admin/pages/BannersPage.tsx` acessa Supabase diretamente
- ❌ `src/modules/admin/pages/AdminCityMetadata.tsx` acessa Supabase diretamente

**Auditoria Anterior Afirmou:**
> "✅ Nenhum hook acessa Supabase diretamente (apenas chamam services)"

**Realidade Encontrada:**
- ❌ `src/core/city/hooks/useCityMetadata.ts` acessa Supabase diretamente
- ❌ `src/core/territorial/hooks/useTerritoryAIContent.ts` acessa edge function diretamente
- ❌ `src/core/territorial/hooks/useTerritoryStats.ts` acessa Supabase diretamente
- ❌ `src/modules/professionals/hooks/useProfessionalBySlug.ts` acessa Supabase diretamente
- ❌ `src/modules/mobility/hooks/useRideChat.ts` acessa Supabase diretamente
- ❌ `src/modules/mobility/hooks/useMobilidadeChat.ts` acessa Supabase diretamente

**Auditoria Anterior Afirmou:**
> "✅ Nenhum componente acessa Supabase diretamente"

**Realidade Encontrada:**
- ❌ `src/modules/profile/components/ResidentVerificationCard.tsx` acessa storage diretamente

### 4.2 Modules com Services Próprios Não Documentados

**Auditoria Anterior Não Mencionou:**
- modules/mobility tem 3 services próprios (MobilityService, DriverService, RideService) que acessam banco
- modules/business tem 1 service próprio (BusinessManagementService) que acessa banco
- modules/community-alerts tem 3 services próprios que acessam banco (PERMITIDO)
- modules/community-issues tem 1 service próprio que acessa banco (PERMITIDO)
- modules/promotions tem 1 repository próprio que acessa banco (PERMITIDO)

**Realidade:**
- Existem 8 services/repositories em modules/ que acessam Supabase
- 5 são permitidos (alerts, issues, promotions - módulos isolados com SSOT próprio)
- 3 são violações (mobility, business management)

### 4.3 Duplicações Não Identificadas

**Auditoria Anterior Não Identificou:**
- VerificationService existe em core/verification E modules/verification
- Ambos acessam a mesma tabela `verification`
- Potencial conflito de ownership

### 4.4 Import Alternativo Não Documentado

**Auditoria Anterior Não Mencionou:**
- Existe `@/core/supabase` como import alternativo
- Usado em: modules/mobility, modules/admin, core/session, core/territorial
- Não é o import canônico `@/integrations/supabase`

**Realidade:**
- `@/core/supabase` é um re-export de `@/integrations/supabase`
- Localizado em `src/core/supabase/index.ts`
- Usado por 10+ arquivos

---

## 5. VEREDITO FINAL

### 5.1 Existe uma pasta única de acesso ao Supabase?

**Resposta:** ❌ NÃO

**Detalhamento:**
- Cliente configurado em: `src/integrations/supabase/`
- Re-export alternativo em: `src/core/supabase/`
- Acessos distribuídos em: app/, modules/, core/

### 5.2 Só core acessa Supabase?

**Resposta:** ❌ NÃO

**Detalhamento:**
- core/ tem 40+ arquivos acessando (✅ LEGÍTIMO)
- modules/ tem 18 arquivos acessando (⚠️ 10 violações, 8 permitidos)
- app/ tem 1 arquivo acessando (❌ VIOLAÇÃO)

**Breakdown:**
- ✅ core/: 40+ services SSOT legítimos + 3 hooks violadores
- ⚠️ modules/: 5 services/repositories permitidos (alerts, issues, promotions) + 5 violações (mobility, business, admin)
- ❌ app/: 1 violação (SimpleLoginPage)

### 5.3 Há modules acessando Supabase?

**Resposta:** ✅ SIM

**Detalhamento:**
- **Acessos Permitidos (8 arquivos):**
  - modules/community-alerts/services/* (3 arquivos) - SSOT do módulo
  - modules/community-issues/services/* (1 arquivo) - SSOT do módulo
  - modules/promotions/repositories/* (1 arquivo) - Repository pattern
  - modules/verification/services/* (1 arquivo) - Duplicado, mas funcional
  - modules/admin/components/FraudDetectionPanel.tsx (1 arquivo) - Apenas import, usa profileService
  - modules/business/components/BusinessTabs.tsx (1 arquivo) - Apenas import, usa BusinessService

- **Violações (10 arquivos):**
  - modules/mobility/services/* (3 arquivos) - Deveriam estar em core
  - modules/mobility/hooks/* (2 arquivos) - Deveriam usar services
  - modules/business/services/BusinessManagementService.ts (1 arquivo) - Deveria estar em core
  - modules/admin/pages/* (2 arquivos) - Deveriam usar services
  - modules/professionals/hooks/* (1 arquivo) - Deveria usar ProfessionalService
  - modules/profile/components/* (1 arquivo) - Deveria usar VerificationService

### 5.4 Há arquivos fora do padrão?

**Resposta:** ✅ SIM

**Violações Encontradas (14 arquivos):**

**Severidade ALTA (3 arquivos):**
1. `src/modules/mobility/services/MobilityService.ts` - Service em module acessando banco
2. `src/modules/mobility/services/DriverService.ts` - Service em module acessando banco
3. `src/modules/mobility/services/RideService.ts` - Service em module acessando banco

**Severidade MÉDIA (8 arquivos):**
4. `src/modules/business/services/BusinessManagementService.ts` - Service em module acessando banco
5. `src/modules/admin/pages/BannersPage.tsx` - Página acessando banco
6. `src/modules/admin/pages/AdminCityMetadata.tsx` - Página acessando banco
7. `src/core/city/hooks/useCityMetadata.ts` - Hook acessando banco
8. `src/core/territorial/hooks/useTerritoryAIContent.ts` - Hook acessando edge function
9. `src/core/territorial/hooks/useTerritoryStats.ts` - Hook acessando banco
10. `src/modules/professionals/hooks/useProfessionalBySlug.ts` - Hook acessando banco
11. `src/modules/verification/services/VerificationService.ts` - Duplicado com core

**Severidade BAIXA (3 arquivos):**
12. `src/app/pages/SimpleLoginPage.tsx` - Página acessando auth
13. `src/modules/mobility/hooks/useRideChat.ts` - Hook acessando realtime
14. `src/modules/mobility/hooks/useMobilidadeChat.ts` - Hook acessando realtime
15. `src/modules/profile/components/ResidentVerificationCard.tsx` - Componente acessando storage

### 5.5 Qual deve ser a regra final recomendada para este projeto?

**REGRA RECOMENDADA:**

```
ACESSO AO SUPABASE - REGRA OFICIAL

1. CORE SERVICES (SSOT)
   ✅ PERMITIDO: Services em core/* podem acessar Supabase
   ✅ PERMITIDO: Repositories em core/* podem acessar Supabase
   ❌ PROIBIDO: Hooks em core/* NÃO podem acessar Supabase
   ❌ PROIBIDO: Components em core/* NÃO podem acessar Supabase

2. MODULES COM SSOT PRÓPRIO (EXCEÇÃO)
   ✅ PERMITIDO: Módulos isolados podem ter services/repositories próprios
   ✅ EXEMPLOS: community-alerts, community-issues, promotions
   ✅ CRITÉRIO: Módulo tem domínio completo e isolado
   ❌ PROIBIDO: Hooks em modules/* NÃO podem acessar Supabase
   ❌ PROIBIDO: Components em modules/* NÃO podem acessar Supabase
   ❌ PROIBIDO: Pages em modules/* NÃO podem acessar Supabase

3. MODULES SEM SSOT PRÓPRIO
   ❌ PROIBIDO: Services em modules/* NÃO podem acessar Supabase
   ✅ OBRIGATÓRIO: Devem usar services de core/*

4. APP
   ❌ PROIBIDO: Pages em app/* NÃO podem acessar Supabase
   ❌ PROIBIDO: Components em app/* NÃO podem acessar Supabase
   ✅ OBRIGATÓRIO: Devem usar services de core/*

5. SHARED
   ❌ PROIBIDO: Nenhum arquivo em shared/* pode acessar Supabase

6. INTEGRATIONS
   ✅ PERMITIDO: Apenas configuração do cliente
   ❌ PROIBIDO: Nenhuma lógica de negócio

7. SESSION/AUTH ESPECIAL
   ✅ ÚNICO: SessionService é o único lugar autorizado para auth.getUser()
   ✅ ÚNICO: RealtimeService é o único lugar autorizado para channel()
```

**AÇÕES CORRETIVAS PRIORITÁRIAS:**

1. **ALTA PRIORIDADE:**
   - Mover MobilityService, DriverService, RideService para core/mobility
   - Remover acessos diretos em modules/mobility/hooks

2. **MÉDIA PRIORIDADE:**
   - Criar CityService em core/city para substituir hook direto
   - Mover BusinessManagementService para core/business
   - Refatorar hooks em core/territorial para usar services
   - Refatorar páginas admin para usar services

3. **BAIXA PRIORIDADE:**
   - Refatorar SimpleLoginPage para usar AuthService
   - Consolidar VerificationService (remover de modules)
   - Refatorar componentes para usar services

**MÉTRICAS FINAIS:**

- Total de arquivos acessando Supabase: 60+
- Acessos legítimos em core/: 40+ (✅ 95% correto)
- Acessos permitidos em modules/: 8 (✅ SSOT próprio)
- Violações encontradas: 14 (❌ 23% dos acessos)
- Taxa de conformidade: 77%

**CONCLUSÃO:**

O projeto está **majoritariamente correto** (77% de conformidade), mas tem **violações significativas** em modules/mobility e alguns hooks/páginas. A regra arquitetural real é:

> **Core acessa Supabase + Modules com SSOT próprio podem acessar + 14 violações a corrigir**

A auditoria anterior simplificou demais ao afirmar "nenhuma violação encontrada". Na realidade, existem violações menores mas importantes que precisam ser corrigidas para atingir 100% de conformidade.

---

**FIM DA AUDITORIA DE ACESSO AO SUPABASE**

