# SSOT Registry — Single Source of Truth

> Mapa dos SSOTs ativos do projeto.
> Última atualização: 2026-09-12
> Status documental: CANÔNICO. Este registry descreve o contrato executável atual. Snapshots históricos em `docs/10-archive` preservam contexto, mas paths aposentados nesses documentos não reabrem autoridade.

---

## O que é um SSOT aqui?

Um SSOT é a autoridade canônica de tipos, estado ou acesso de um domínio. Outros arquivos devem consumir esse contrato, não recriá-lo.

Violações são detectadas automaticamente por:

```bash
npm run check:ssot
# ou
npx tsx tools/architecture/check-ssot-compliance.ts
```

---

## Índice

- [Core SSOTs](#core-ssots)
- [Feature SSOTs](#feature-ssots)
- [Shared / Infrastructure SSOTs](#shared--infrastructure-ssots)
- [Tabelas Protegidas](#tabelas-protegidas)
- [Regras de Uso](#regras-de-uso)

---

## Core SSOTs

### 1. Location (Territorial)

| | |
|---|---|
| **Arquivo** | `src/core/location/types/index.ts` |
| **Service** | `src/core/location/LocationService.ts` |
| **Grupos territoriais** | `src/core/territorial/contracts.ts` + `src/core/territorial/repositories/` + `src/core/territorial/services/` |
| **Responsabilidade** | `Location` mantém a hierarquia geográfica país → estado → cidade → bairro; grupos territoriais pertencem ao domínio `core/territorial` |
| **Tipos principais** | `Location`, `LocationTree`, `TerritoryFilter`, `ActiveTerritory` |
| **Tabela** | `locations` |

> ⚠️ Todos os módulos que filtram dados por território devem usar `TerritoryFilter`. Não construir filtro territorial ad-hoc em componente. `TerritorialGroup*` nunca deve ser reexportado por `core/location/types`; o owner é `core/territorial/contracts.ts`.

---

### 2. Business

| | |
|---|---|
| **Arquivo** | `src/core/business/types/index.ts` + `types/Business.ts` |
| **Service** | `src/core/business/services/BusinessService.ts` |
| **Responsabilidade** | Empresas, negócios, filiais e unidades |
| **Tipos principais** | `Business`, `BusinessInput`, `BusinessFilters`, `BusinessDataRecord`, `BusinessDataWithProfiles` |
| **Tabela** | `business_data` |
| **Read model público** | `public.public_business_search` |

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
| **Responsabilidade** | Owner canônico de Post: CRUD, leitura territorial, detalhe público fail-closed, paginação, polls e share events. A experiência Community Feed compõe esse owner com `TerritoryFilter`. |
| **Tipos principais** | `Post`, `Poll`, `PollOption`, `CreatePostData`, `FeedParams` |
| **Tabela** | `posts` |

---

### 4A. Community Feed composition

| | |
|---|---|
| **Contrato atual** | `docs/07-modules/POSTS_FEED_SSOT.md` |
| **UI/aplicação** | `src/core/community-feed` + `src/core/posts/views/CommunityPostView.ts` |
| **Post owner** | `src/core/posts` / `postService` |
| **Comment owner** | `src/core/comments` |
| **Engagement owner** | `src/core/engagement` + owners específicos |
| **Cache composition** | `src/core/feed/queryKeys.ts` |
| **Responsabilidade** | Compor a experiência territorial sem recriar CRUD/SSOT paralelo; timeline usa `postService.getFeed()`, detalhe público usa `postService.getPublicPostById(..., TerritoryFilter)`. |

> O antigo `FeedService`/`FeedRepository` foi removido após zero consumidores. `docs/feed/FEED-FREEZE.md` preserva invariantes históricas e não autoriza restaurar paths aposentados.

---

### 5. Authorization / Roles

| | |
|---|---|
| **Arquivo** | `src/core/authorization/types/roles.types.ts` |
| **Service** | `src/core/authorization/services/` |
| **Responsabilidade** | Sistema de roles e permissões |
| **Tipos principais** | `AppRole`, `UserRole`, `RoleHistory`, `GrantRoleRequest`, `RoleCheckResult` |
| **Tabela** | `user_roles`, `role_history` |
| **Alinhado com** | `supabase/migrations/20260418000000_create_roles_system.sql` |

---

### 6. Admin Database (Extensão)

| | |
|---|---|
| **Arquivo** | `src/core/admin/types/adminDatabase.types.ts` |
| **Responsabilidade** | Tipos administrativos complementares ao contrato Supabase gerado |
| **Tipos principais** | `FraudAlert`, `CommunityIssue`, `Notification`, `GastronomyProfile`, `AdminDatabase`, `AdminSupabaseClient` |

> Este contrato complementa `types.generated.ts`; não substitui nem duplica o arquivo gerado.

---

### 7. Geocoding

| | |
|---|---|
| **Arquivo** | `src/core/geocoding/types/index.ts` |
| **Provider/orquestrador** | `src/core/geocoding/services/GeocodingService.ts` |
| **Boundary territorial** | `src/core/location/services/LocationGeocodingService.ts` |
| **Responsabilidade** | Geocoding, reverse geocoding e busca por CEP; resultados usados por domínio territorial são reconciliados com `locations` |

---

### 8. Routing

| | |
|---|---|
| **Arquivo** | `src/core/routing/types/index.ts` |
| **Service** | `src/core/routing/services/` |
| **Responsabilidade** | Roteamento, ETA, distância e navegação |

---

### 9. Gastronomy (Core)

| | |
|---|---|
| **Arquivo** | `src/core/business/types/gastronomy.ts` |
| **Service** | `src/core/business/services/GastronomyProfileService.ts` |
| **Responsabilidade** | Tipos canônicos do vertical gastronomia |
| **Tipos principais** | `GastronomyProfile`, `PriceRange`, `GastronomyStatus` |
| **Tabela** | `gastronomy_profiles` (extensão 1:1 de `business_data`) |

---

### 10. Billing / Subscriptions

| | |
|---|---|
| **Tipos** | `src/core/billing/types.ts` |
| **Catálogo** | `src/core/billing/services/CatalogService.ts` |
| **Assinatura user** | `src/core/billing/services/SubscriptionService.ts` |
| **Assinatura Business** | `src/core/billing/BusinessSubscriptionService.ts` |
| **Entitlements** | `src/core/billing/services/EntitlementResolver.ts` + `entitlementBaselines.ts` |
| **Checkout / Portal** | `src/core/billing/services/BillingService.ts` |
| **Writer server-side** | `supabase/functions/billing-webhook/index.ts` |
| **Responsabilidade** | Catálogo comercial horizontal, leitura de contratos, gates e integração Stripe; browser não escreve estado comercial; elegibilidade é server-only e entitlements/pricing públicos são projeções explícitas apenas do catálogo publicado |
| **Tabelas canônicas** | `user_subscriptions`, `commercial_catalog_version`, `catalog_item`, `catalog_entitlement_policy`, `catalog_eligibility_rule`, `catalog_pricing_policy` |

> `billing_plans`, `subscription_plans`, `business_subscriptions` e `gastronomy_subscriptions` não são SSOT runtime; referências remanescentes só podem existir para provenance/migração explicitamente governada.

---

### 11. Tourist Points

| | |
|---|---|
| **Arquivo** | `src/core/guide/tourist-points/types/index.ts` |
| **Service** | `src/core/guide/tourist-points/services/TouristPointService.ts` |
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

---

## Feature SSOTs

SSOTs de features verticais e superfícies de aplicação. O owner pode estar em `src/core` ou `src/modules`; o path real do owner prevalece sobre snapshots históricos.

### 16. Vagas

| | |
|---|---|
| **Arquivo** | `src/modules/classifieds/jobs/types/vagas.types.ts` |
| **Service** | `src/modules/classifieds/jobs/services/VagasService.ts` |
| **Responsabilidade** | Sistema completo de vagas de emprego |
| **Tipos principais** | `Vaga`, `VagaRow`, `VagaStatus`, `VagaContrato`, `VagaApplicationChannel`, `VagaFilters`, `VagasPaginatedResult`, `Candidatura` |
| **Alinhado com** | `supabase/migrations/20260416170000_vagas_domain_aaa.sql` |

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
| **Responsabilidade** | Tipos de operação do serviço de classificados |

---

### 19. Mobility — Chat

| | |
|---|---|
| **Tipos canônicos** | `src/core/mobility/services/chat.types.ts` |
| **API pública / facade** | `src/core/mobility/services/ChatService.ts` |
| **Queries / mutations** | `src/core/mobility/services/chat.queries.ts`, `src/core/mobility/services/chat.mutations.ts` |
| **Responsabilidade** | Chat de corridas entre participantes autorizados |
| **Tipos principais** | `RideChat`, `ChatMessage`, `SendMessageInput`, `Conversation`, `CreateMessageData` |

> `ChatService.impl.ts` foi aposentado; não recriar split `.impl` para Driver/Ride/Chat.

---

### 20. Mobility — Dispatch

| | |
|---|---|
| **Tipos canônicos** | `src/core/mobility/types/dispatch.types.ts` |
| **Offer/dispatch owner** | `src/core/mobility/services/MobilityOfferService.ts` |
| **Config owner** | `src/core/mobility/services/MobilityDispatchConfigService.ts` |
| **Broker** | `src/core/mobility/services/MobilityRpcService.ts` |
| **Responsabilidade** | Despacho, elegibilidade, ofertas e matching de corridas |

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

> ⛔ Nunca editar manualmente nem criar snapshot paralelo. Regenerar pelo fluxo canônico a partir do projeto remoto.

---

### 25. Auth Branded Types

| | |
|---|---|
| **Arquivo** | `src/core/auth/types/branded.types.ts` |
| **Responsabilidade** | Tipos branded para autenticação (`UserId`, `SessionToken`, etc.) |

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
| **Responsabilidade** | Orquestração canônica do benchmark operacional de circulação econômica |
| **Escopo** | Feed econômico, oportunidades e vagas estruturadas |
| **Artefatos** | `.tmp/bench/economic-circulation-*.txt` + `.md` |

---

## Tabelas Protegidas

Tabelas que só podem ser acessadas através de services/owners autorizados. Acesso direto em hooks, componentes, páginas ou utilitários é violação.

| Tabela | Service / owner canônico |
|--------|--------------------------|
| `locations` | `LocationService` |
| `profiles` | `ProfileService` |
| `business_data` | `BusinessService` |
| `professional_data` | `ProfessionalService` |
| `driver_data` | `MobilityRuntimeService` / `DriverService` e queries especializadas de Mobilidade |
| `ride_requests` | `RideService` e read models especializados de Mobilidade |
| `posts` | `PostService` |
| `comments` | `CommentService` |
| `classifieds` | `ClassifiedService` |
| `events` | `EventService` |
| `reviews` | `ReviewsService` |
| `user_subscriptions` | `SubscriptionService` + `BusinessSubscriptionService` (read); `billing-webhook` (write) |
| `commercial_catalog_version`, `catalog_item` | `CatalogService` (published read); trusted server/service_role (write) |
| `catalog_entitlement_policy`, `catalog_pricing_policy` | projeções públicas explícitas somente de itens `published`; trusted server/service_role (write) |
| `catalog_eligibility_rule` | trusted server/service_role only |
| `conversations`, `messages` | `ClassifiedMessagingService`; mutations pelos RPCs server-owned |
| `community_direct_threads`, `community_direct_thread_participants`, `community_direct_messages`, `community_direct_message_reports` | `CommunityDirectMessagingService`; mutations pelos RPCs do agregado |
| `notifications` | `NotificationService` para inbox self-state; outbox/RPC server-owned para criação |
| `notification_preferences` | `NotificationPreferencesService` via RPCs canônicos |
| `gastronomy_profiles` | `GastronomyProfileService` |
| `menu_categories` | `MenuService` |
| `menu_items` | `MenuService` |
| `tourist_points` | `TouristPointService` |

---

## Regras de Uso

### ✅ Correto

```typescript
import type { Vaga, VagaFilters } from '@/modules/classifieds/jobs/types/vagas.types';
import { VagasService } from '@/modules/classifieds/jobs/services/VagasService';
import type { TerritoryFilter } from '@/core/location/types';

const vagas = await VagasService.list(params);
const filter: TerritoryFilter = { scope: 'location', location_id: id };
```

### ❌ Violação

```typescript
const { data } = await supabase.from('vagas').select('*');
interface MinhaVaga { titulo: string }
.eq('city', 'Salvador')
```

### Adicionando um novo SSOT

1. Definir owner e contrato no domínio correto.
2. Reutilizar tipos gerados/canônicos em vez de duplicá-los.
3. Adicionar tabela protegida em `tools/architecture/check-ssot-compliance.ts` quando aplicável.
4. Registrar somente paths existentes neste documento.
5. Se um owner for aposentado, migrar callers e atualizar guardrails/registry na mesma mudança.

---

## Contagem

| Camada | Quantidade |
|--------|------------|
| Core | 15 |
| Features | 8 |
| Shared / Infra | 3 |
| Operations SSOT | 1 |
| **Total** | **27** |
