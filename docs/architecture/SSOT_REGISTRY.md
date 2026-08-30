# SSOT Registry — Single Source of Truth

> Mapa completo de todos os SSOTs do projeto.
> Última atualização: 2026-08-30
> Status documental: CANONICO. Este registry permanece como mapa tecnico de SSOTs; o boundary publico do Feed esta congelado em `docs/feed/FEED-FREEZE.md`.

---

## O que é um SSOT aqui?

Um SSOT é o arquivo de tipos/interfaces que define **canonicamente** um domínio.
Nenhum outro arquivo deve redefinir esses tipos — apenas importar daqui.

Violações são detectadas automaticamente por:
```bash
npm run check:ssot
# ou
npx tsx tools/architecture/check-ssot-compliance.ts
```

---

## Índice

- [Core SSOTs](#core-ssots)
- [Module SSOTs](#module-ssots)
- [Shared / Infrastructure SSOTs](#shared--infrastructure-ssots)
- [Tabelas Protegidas](#tabelas-protegidas)
- [Regras de Uso](#regras-de-uso)

---

## Core SSOTs

SSOTs da camada `src/core/` — domínios fundamentais do sistema.

### 1. Location (Territorial)

| | |
|---|---|
| **Arquivo** | `src/core/location/types/index.ts` |
| **Service** | `src/core/location/LocationService.ts` |
| **Responsabilidade** | Sistema territorial completo: país → estado → cidade → bairro |
| **Tipos principais** | `Location`, `LocationTree`, `TerritoryFilter`, `TerritorialGroup`, `ActiveTerritory` |
| **Tabela** | `locations` |

> ⚠️ **Crítico.** Todos os módulos que filtram dados por território devem usar `TerritoryFilter` deste SSOT. Nunca construir filtros ad-hoc em componentes.

---

### 2. Business

| | |
|---|---|
| **Arquivo** | `src/core/business/types/index.ts` + `types/Business.ts` |
| **Service** | `src/core/business/services/BusinessService.ts` |
| **Responsabilidade** | Empresas, negócios, filiais e unidades |
| **Tipos principais** | `Business`, `BusinessInput`, `BusinessFilters`, `BusinessDataRecord`, `BusinessDataWithProfiles` |
| **Tabela** | `business_data` |

---

### 3. Professional

| | |
|---|---|
| **Arquivo** | `src/core/professional/types.ts` |
| **Service** | `src/core/professional/services/ProfessionalService.ts` |
| **Responsabilidade** | Profissionais autônomos e prestadores de serviço |
| **Tipos principais** | `Professional`, `ProfessionalDataRecord`, `ProfessionalFilters`, `ProfessionalJob` |
| **Tabela** | `professional_data` |

---

### 3A. Entity Private Data

| | |
|---|---|
| **Arquivo** | `src/core/contact/services/EntityContactService.ts` |
| **Credenciais** | `src/core/professional/services/ProfessionalCredentialsService.ts` |
| **Contrato** | `docs/07-modules/ENTITY_PRIVATE_DATA_SSOT.md` |
| **Responsabilidade** | Contatos de Business/Professional e registros profissionais privados |
| **Tabelas** | `private.entity_contact_channels`, `private.professional_credentials` |

---

### 4. Posts

| | |
|---|---|
| **Arquivo** | `src/core/posts/types.ts` |
| **Service** | `src/core/posts/services/PostService.ts` |
| **Responsabilidade** | Registro atomico de posts e enquetes. Para experiencia publica de Feed, usar o boundary congelado em `FeedService`. |
| **Tipos principais** | `Post`, `CommunityPost`, `Poll`, `PollOption`, `CreatePostData`, `FeedParams` |
| **Tabela** | `posts` |

---

### 4A. Feed Public Boundary (FROZEN)

| | |
|---|---|
| **Governanca** | `docs/feed/FEED-GOVERNANCE.md` |
| **Freeze** | `docs/feed/FEED-FREEZE.md` |
| **Service** | `src/core/feed/services/FeedService.ts` |
| **Repository** | `src/core/feed/repositories/FeedRepository.ts` |
| **Contratos principais** | `FeedContext`, `FeedTarget`, `FeedQueryKeys`, `CanonicalFeedUrl` |
| **Responsabilidade** | Porta publica congelada para timeline, detalhe, criacao, edicao, exclusao, comentarios, reacoes, saves, share, reports, poll vote, URL canonica, Search de posts e leitura social de `ride_share`. |

> Feed STATUS: FROZEN. UI, hooks publicos e modulos satelites nao devem usar `PostService`, `CommentService` ou `PostEngagementService` como porta publica de Feed. Esses servicos permanecem colaboradores internos quando consumidos pelo `FeedRepository`.

---

### 5. Authorization / Roles

| | |
|---|---|
| **Arquivo** | `src/core/authorization/types/roles.types.ts` |
| **Service** | `src/core/authorization/services/` |
| **Responsabilidade** | Sistema de roles e permissões baseado em roles |
| **Tipos principais** | `AppRole`, `UserRole`, `RoleHistory`, `GrantRoleRequest`, `RoleCheckResult` |
| **Tabela** | `user_roles`, `role_history` |
| **Alinhado com** | `supabase/migrations/20260418000000_create_roles_system.sql` |

Hierarquia de roles (maior → menor privilégio):
```
super_admin → admin → moderator → business_owner → driver → user
```

---

### 6. Admin Database (Extensão)

| | |
|---|---|
| **Arquivo** | `src/core/admin/types/adminDatabase.types.ts` |
| **Responsabilidade** | Tipos para tabelas admin não presentes no `types.generated.ts` |
| **Tipos principais** | `FraudAlert`, `CommunityIssue`, `Notification`, `GastronomyProfile`, `AdminDatabase`, `AdminSupabaseClient` |

> Estende `types.generated.ts` sem modificá-lo. Padrão correto para tabelas admin.

---

### 7. Geocoding

| | |
|---|---|
| **Arquivo** | `src/core/geocoding/types/index.ts` |
| **Service** | `src/core/geocoding/services/` |
| **Responsabilidade** | Geocoding, reverse geocoding, busca por CEP |

---

### 8. Routing

| | |
|---|---|
| **Arquivo** | `src/core/routing/types/index.ts` |
| **Service** | `src/core/routing/services/` |
| **Responsabilidade** | Roteamento, ETA, distância, navegação |

---

### 9. Gastronomy (Core)

| | |
|---|---|
| **Arquivo** | `src/core/gastronomy/types.ts` |
| **Service** | `src/core/gastronomy/GastronomyProfileService.ts` |
| **Responsabilidade** | Tipos canônicos do vertical gastronomia |
| **Tipos principais** | `GastronomyProfile`, `PriceRange`, `GastronomyStatus` |
| **Tabela** | `gastronomy_establishments` |

---

### 10. Billing / Subscriptions

| | |
|---|---|
| **Tipos** | `src/core/billing/types.ts` |
| **Catálogo** | `src/core/billing/services/CatalogService.ts` + `BillingPlanService.ts` |
| **Assinatura user** | `src/core/billing/services/SubscriptionService.ts` |
| **Assinatura Business** | `src/core/billing/BusinessSubscriptionService.ts` |
| **Entitlements** | `src/core/billing/services/EntitlementResolver.ts` + `entitlementBaselines.ts` |
| **Checkout / Portal** | `src/core/billing/services/BillingService.ts` |
| **Writer server-side** | `supabase/functions/billing-webhook/index.ts` |
| **Responsabilidade** | Catálogo comercial horizontal, leitura de contratos, gates e integração Stripe; browser não escreve estado comercial |
| **Tabelas canônicas** | `user_subscriptions`, `commercial_catalog_version`, `catalog_item`, `catalog_entitlement_policy`, `catalog_eligibility_rule`, `catalog_pricing_policy` |

> `src/core/gastronomy/billing` foi aposentado. `billing_plans`, `subscription_plans`, `business_subscriptions` e `gastronomy_subscriptions` não são SSOT runtime e permanecem como legado para provenance/reconciliação em G5.

---

### 11. Tourist Points

| | |
|---|---|
| **Arquivo** | `src/core/tourist-points/types/index.ts` |
| **Service** | `src/core/tourist-points/services/TouristPointService.ts` |
| **Responsabilidade** | Pontos turísticos |
| **Tabela** | `tourist_points` |

---

### 12. Reviews

| | |
|---|---|
| **Arquivo** | `src/core/reviews/types.ts` |
| **Service** | `src/core/reviews/services/ReviewsService.ts` |
| **Responsabilidade** | Sistema de avaliações |
| **Tabela** | `reviews` |

---

### 13. Favorites

| | |
|---|---|
| **Arquivo** | `src/core/favorites/types.ts` |
| **Service** | `src/core/favorites/services/FavoritesService.ts` |
| **Responsabilidade** | Sistema de favoritos |

---

### 14. Comments

| | |
|---|---|
| **Arquivo** | `src/core/comments/types.ts` |
| **Service** | `src/core/comments/services/CommentService.ts` |
| **Responsabilidade** | Sistema de comentários |
| **Tabela** | `comments` |

---

### 15. Messaging

| | |
|---|---|
| **Contratos** | `src/core/messaging/contracts.ts` |
| **Classified owner** | `src/core/messaging/services/ClassifiedMessagingService.ts` |
| **Community Direct owner** | `src/core/messaging/services/CommunityDirectMessagingService.ts` |
| **Realtime transport** | `src/core/realtime/services/RealtimeService.ts` |
| **Responsabilidade** | Boundary horizontal de mensagens com agregados explicitamente separados; não existe `MessagingService` genérico |
| **Tabelas Classified** | `conversations`, `messages` |
| **Tabelas Community Direct** | `community_direct_threads`, `community_direct_thread_participants`, `community_direct_messages`, `community_direct_message_reports` |

> A UI de Mensagens/Chat permanece launch-paused e não pertence a `src/core/messaging`. Quando retomada, deve viver em `src/modules/messaging` consumindo as facades de core.

---

## Module SSOTs

SSOTs da camada `src/modules/` — features verticais.

### 16. Vagas

| | |
|---|---|
| **Arquivo** | `src/modules/classifieds/jobs/types/vagas.types.ts` |
| **Service** | `src/modules/classifieds/jobs/services/VagasService.ts` |
| **Responsabilidade** | Sistema completo de vagas de emprego |
| **Tipos principais** | `Vaga`, `VagaRow`, `VagaStatus`, `VagaContrato`, `VagaApplicationChannel`, `VagaFilters`, `VagasPaginatedResult`, `Candidatura` |
| **Alinhado com** | `supabase/migrations/20260416170000_vagas_domain_aaa.sql` |

> ⭐ Exemplo de SSOT nível AAA: 400+ linhas, 8 enums, domínio completo com helpers e constantes.

---

### 17. Classifieds

| | |
|---|---|
| **Arquivo** | `src/modules/classifieds/types/classified.ts` |
| **Service** | `src/core/classifieds/services/ClassifiedService.ts` |
| **Responsabilidade** | Anúncios classificados |
| **Tipos principais** | `Classified`, `ClassifiedWithSeller`, `ClassifiedFilters`, `CreateClassifiedInput` |
| **Tabela** | `classifieds` |

---

### 18. Classifieds Service Types

| | |
|---|---|
| **Arquivo** | `src/modules/classifieds/services/types.ts` |
| **Responsabilidade** | Tipos de operação do serviço de classificados (complementa o SSOT 17) |

---

### 19. Mobility — Chat

| | |
|---|---|
| **Arquivo** | `src/modules/mobility/services/chat.types.ts` |
| **Responsabilidade** | Chat de corridas entre motorista e passageiro |
| **Tipos principais** | `RideChat`, `ChatMessage`, `SendMessageInput`, `Conversation` |

---

### 20. Mobility — Dispatch

| | |
|---|---|
| **Arquivo** | `src/modules/mobility/types/dispatch.types.ts` |
| **Responsabilidade** | Despacho e matching de corridas |

---

### 21. Landing

| | |
|---|---|
| **Arquivo** | `src/app/features/landing/services/types.ts` |
| **Responsabilidade** | Landing pages nacionais e estaduais |

---

### 22. Admin Identidade

| | |
|---|---|
| **Arquivo** | `src/modules/admin/identity/sections/types.ts` |
| **Responsabilidade** | Gestão de identidades públicas no painel admin |

---

### 23. Admin Service Types

| | |
|---|---|
| **Arquivo** | `src/modules/admin/services/types.ts` |
| **Responsabilidade** | Tipos compartilhados para operações administrativas |

---

## Shared / Infrastructure SSOTs

### 24. Supabase Generated Database Types

| | |
|---|---|
| **Arquivo canônico** | `src/integrations/supabase/types.generated.ts` |
| **Gerador canônico** | `tools/supabase/generate-supabase-types.ts` |
| **Comando** | `npm run generate:types` |
| **Responsabilidade** | Única autoridade gerada para o contrato TypeScript do schema Supabase |

> ⛔ **Nunca editar manualmente nem criar snapshot paralelo.** `src/shared/types/database.types.ts` e `src/integrations/supabase/types.ts` foram aposentados no G5. Regenerar somente pelo fluxo canônico apontado acima.

---

### 25. Auth Branded Types

| | |
|---|---|
| **Arquivo** | `src/core/auth/types/branded.types.ts` |
| **Responsabilidade** | Tipos branded para autenticação (UserId, SessionToken, etc.) |

---

### 26. Notifications

| | |
|---|---|
| **Tipos** | `src/core/notifications/types.ts` |
| **Inbox** | `src/core/notifications/services/NotificationService.ts` |
| **Preferências** | `src/core/notifications/services/NotificationPreferencesService.ts` |
| **Delivery server-side** | `private.notification_outbox` + `private.enqueue_notification` + dispatcher |
| **Realtime** | `src/core/realtime/services/RealtimeService.ts` |
| **Responsabilidade** | Inbox self-service, preferências e entrega server-owned de notificações |

---

### 27. Economic Benchmark Operations (Core Econ)

| | |
|---|---|
| **Arquivo** | `tools/release/economic-benchmark-ssot.mjs` |
| **Responsabilidade** | Orquestracao canônica do benchmark operacional de circulacao economica (before/after/compare/report/finalize) |
| **Escopo** | Feed economico, oportunidades e vagas estruturadas |
| **Artefatos** | `.tmp/bench/economic-circulation-*.txt` + `.md` |

> Use apenas os comandos `bench:economic:*` do `package.json`. Evitar orquestracao paralela por scripts soltos.

---

## Tabelas Protegidas

Tabelas que **só podem ser acessadas via service SSOT**. Acesso direto em hooks/components/pages é violação.

| Tabela | Service SSOT |
|--------|-------------|
| `locations` | `LocationService` |
| `profiles` | `ProfileService` |
| `business_data` | `BusinessService` |
| `professional_data` | `ProfessionalService` |
| `driver_data` | `MobilityService` |
| `posts` | `PostService` |
| `comments` | `CommentService` |
| `classifieds` | `ClassifiedService` |
| `events` | `EventService` |
| `reviews` | `ReviewsService` |
| `user_subscriptions` | `services/SubscriptionService` + `BusinessSubscriptionService` (read); `billing-webhook` (write) |
| `commercial_catalog_version`, `catalog_item`, `catalog_*_policy` | `CatalogService` / `BillingPlanService` (read); trusted server/service_role (write) |
| `conversations`, `messages` | `ClassifiedMessagingService`; mutations pelos RPCs server-owned |
| `community_direct_threads`, `community_direct_thread_participants`, `community_direct_messages`, `community_direct_message_reports` | `CommunityDirectMessagingService`; mutations pelos RPCs do agregado |
| `notifications` | `NotificationService` para inbox self-state; `create_notification`/outbox para criação; sem INSERT/hard DELETE browser |
| `notification_preferences` | `NotificationPreferencesService` via RPCs canônicos |
| `gastronomy_establishments` | `GastronomyService` |
| `menu_categories` | `MenuService` |
| `menu_items` | `MenuService` |
| `tourist_points` | `TouristPointService` |

---

## Regras de Uso

### ✅ Correto

```typescript
// Importar tipos do SSOT
import type { Vaga, VagaFilters } from '@/modules/classifieds/jobs/types/vagas.types';

// Acessar dados via service
import { VagasService } from '@/modules/classifieds/jobs/services/VagasService';
const vagas = await VagasService.list(params);

// Filtro territorial via TerritoryFilter
import type { TerritoryFilter } from '@/core/location/types';
const filter: TerritoryFilter = { scope: 'location', location_id: id };
```

### ❌ Violação

```typescript
// Acesso direto ao Supabase em hook/component
const { data } = await supabase.from('vagas').select('*'); // ❌

// Redefinir tipos que já existem no SSOT
interface MinhaVaga { titulo: string; ... } // ❌ usar Vaga de vagas.types.ts

// Filtro territorial ad-hoc
.eq('city', 'Salvador') // ❌ usar TerritoryFilter
```

### Adicionando um novo SSOT

1. Criar `src/core/{dominio}/types/index.ts` ou `src/modules/{feature}/types/{feature}.types.ts`
2. Documentar com cabeçalho identificando como SSOT
3. Adicionar tabela protegida em `tools/architecture/check-ssot-compliance.ts`
4. Registrar neste documento

---

## Contagem

| Camada | Quantidade |
|--------|------------|
| Core | 15 |
| Modules | 8 |
| Shared / Infra | 3 |
| Operations SSOT | 1 |
| **Total** | **27** |