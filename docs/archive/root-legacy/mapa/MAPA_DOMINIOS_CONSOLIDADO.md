# Mapa Consolidado de Domínios do Projeto

**Data**: 2026-04-06  
**Status**: Documento de Referência SSOT

---

## 1. ROUTING (Rotas, ETA, Distâncias)

### SSOT Oficial
- **Service**: `src/core/routing/services/RoutingService.ts`
- **Instance**: `src/core/routing/instance.ts` (singleton `routingService`)
- **Status**: ✅ COMPLETO (v1.0.0)

### Hooks Oficiais
- `useRouting()` - Hook React para routing
- `useAppUrls()` - Hooks de navegação

### Componentes Oficiais
- Nenhum componente visual (domínio transversal)

### Edge Functions
- Nenhuma (lógica client-side)

### Tabelas SQL
- Nenhuma (não persiste dados)

### Funções SQL
- Nenhuma

### Providers
- **Ativo**: `MockRoutingProvider` (temporário, linha reta Haversine)
- **Futuro**: OSRM, Valhalla, Google Directions

### Código Deprecated
- ❌ Cálculos de ETA duplicados em componentes
- ❌ Lógica de Haversine espalhada

### Pode Remover
- Cálculos de distância inline em componentes após migração para `routingService`

---

## 2. GEOCODING (Endereços, Coordenadas)

### SSOT Oficial
- **Service**: `src/core/geocoding/services/GeocodingService.ts`
- **Instance**: `src/core/geocoding/instance.ts` (singleton `geocodingService`)
- **Status**: ✅ ETAPA 2 IMPLEMENTADA (v1.0.0)

### Hooks Oficiais
- `useGeocoding()` - Hook genérico
- `usePostalCodeLookup()` - Busca por CEP

### Componentes Oficiais
- Nenhum componente visual (domínio transversal)

### Edge Functions
- `nominatim-proxy` - Proxy para Nominatim OSM

### Tabelas SQL
- Nenhuma (usa providers externos)

### Funções SQL
- Nenhuma

### Providers
- **ViaCEP**: Busca por CEP (primário)
- **Nominatim**: Geocoding direto e reverse (primário)

### Wrappers Transitórios
- `src/core/address/services/CepService.ts` - Será deprecated
- `src/core/maps/services/GeocodingService.ts` - Será refatorado

### Código Deprecated
- ⚠️ `CepService` - Migrar para `geocodingService.lookupPostalCode()`
- ⚠️ Chamadas diretas a ViaCEP em componentes

### Pode Remover
- Após migração completa: `CepService.ts`

---

## 3. TRACKING (Localização em Tempo Real)

### SSOT Oficial
- **Service**: `src/core/tracking/services/TrackingService.ts`
- **Instance**: `src/core/tracking/instance.ts` (singleton `trackingService`)
- **Status**: ✅ COMPLETO

### Hooks Oficiais
- `useTracking()` - Tracking de entidades
- `useGeolocationTracking()` - Rastreio GPS do dispositivo

### Componentes Oficiais
- Nenhum componente visual (domínio transversal)

### Edge Functions
- Nenhuma

### Tabelas SQL Ativas
- `driver_locations` - Posição de motoristas
- `location_tracking` - Histórico de tracking
- `user_locations` - Posição de usuários (futuro)
- `vehicle_locations` - Posição de veículos (futuro)

### Funções SQL
- Nenhuma

### Código Deprecated
- ❌ Acessos diretos ao Supabase para tracking fora do service

### Pode Remover
- Subscriptions manuais de tracking após migração para `trackingService`

---

## 4. SAFETY (Segurança, Alertas)

### SSOT Oficial
- **Service**: `src/core/safety/services/SafetyService.ts`
- **Instance**: `src/core/safety/instance.ts` (singleton `safetyService`)
- **Status**: ✅ COMPLETO

### Hooks Oficiais
- `useEmergencyAlert()` - Alertas de emergência
- `useRideShare()` - Compartilhamento de viagem
- `useSafetyIncident()` - Incidentes de segurança

### Componentes Oficiais
- `EmergencyButton` (em `modules/mobility`)
- `ShareRideButton` (em `modules/mobility`)

### Edge Functions Ativas
- `send-emergency-email` - Envio de emails de emergência

### Tabelas SQL Ativas
- `emergency_alerts` - Alertas de emergência
- `ride_shares` - Compartilhamentos de viagem
- `safety_incidents` - Incidentes de segurança
- `safety_evidence` - Evidências de segurança
- `safety_audit_log` - Auditoria de ações
- `emergency_contacts` - Contatos de emergência
- `emergency_delivery_log` - Log de entregas de notificações

### Funções SQL
- Nenhuma

### Providers
- `EmailNotificationProvider` - Envio de emails de emergência

### Código Deprecated
- Nenhum

### Pode Remover
- Nenhum

---

## 5. PRICING (Precificação de Corridas)

### SSOT Oficial
- **Service**: `src/core/pricing/services/PricingService.ts`
- **Instance**: `src/core/pricing/instance.ts` (singleton `pricingService`)
- **Status**: ✅ COMPLETO

### Hooks Oficiais
- `usePriceEstimate()` - Estimativa de preço
- `useQuickPriceEstimate()` - Estimativa rápida
- `usePricingRules()` - Gerenciamento de regras

### Componentes Oficiais
- Nenhum componente visual (domínio transversal)

### Edge Functions
- Nenhuma

### Tabelas SQL Ativas
- `pricing_rules` - Regras de precificação
- `pricing_peak_hour_multipliers` - Multiplicadores de horário de pico
- `pricing_additional_fees` - Taxas adicionais
- `pricing_audit_log` - Auditoria de pricing

### Funções SQL Ativas
- `activate_pricing_rule()` - Ativa regra e desativa outras
- `create_active_pricing_rule()` - Cria regra ativa
- Trigger: `validate_single_active_rule` - Valida regra única ativa

### Código Deprecated
- Nenhum

### Pode Remover
- Nenhum

---

## 6. RIDE MOTOR (Motor de Corridas, Dispatch)

### SSOT Oficial
- **Service**: `src/modules/mobility/services/RideService.ts`
- **Service**: `src/modules/mobility/services/DriverService.ts`
- **Service**: `src/modules/mobility/services/MobilityService.ts`
- **Status**: ✅ COMPLETO

### Hooks Oficiais
- `useRides()` - Gerenciamento de corridas
- `useActiveRide()` - Corrida ativa
- `useRideHistory()` - Histórico de corridas
- `useDriver()` - Perfil de motorista
- `useDriverProfile()` - Dados do motorista
- `useDriverLocation()` - Localização do motorista

### Componentes Oficiais
- `MobilidadeFeed` - Feed de corridas
- `CreateRideModal` - Modal de criação de corrida
- `RideRequestCard` - Card de solicitação
- `RideTrackingMap` - Mapa de rastreamento
- `ActiveRideWidget` - Widget de corrida ativa
- `DriverHeader`, `DriverStatsCard`, `DriverEarningsCard` - Componentes de motorista

### Edge Functions Ativas
- `auto-dispatch-ride` - Dispatch automático de corridas
- `process-timeouts` - Processamento de timeouts

### Tabelas SQL Ativas
- `ride_requests` - Solicitações de corrida
- `driver_data` - Dados de motoristas
- `driver_locations` - Localização de motoristas
- `driver_routes` - Rotas de motoristas
- `ride_assignments` - Atribuições de corridas
- `ride_status_history` - Histórico de status

### Funções SQL Ativas
- `find_eligible_drivers()` - Busca motoristas elegíveis
- `assign_ride_to_driver()` - Atribui corrida a motorista
- `update_ride_status()` - Atualiza status da corrida
- `calculate_driver_earnings()` - Calcula ganhos do motorista
- Triggers: validação de status, auditoria

### Código Deprecated
- Nenhum

### Pode Remover
- Nenhum

---

## 7. MAPS (Mapas, Tiles, Inicialização)

### SSOT Oficial
- **Services**:
  - `MapLayerRegistryService` - Configuração de camadas
  - `MapEntityProjectionService` - Transformação de entidades
  - `MapViewportService` - Cálculos de viewport
  - `MapUrlStateService` - Serialização de estado
  - `ProviderRegistryService` - Gerenciamento de providers
- **Status**: ✅ ARQUITETURA COMPLETA

### Hooks Oficiais
- `useMapLayers()` - Gerenciamento de camadas
- `useMapViewport()` - Controle de viewport
- `useMapState()` - Estado do mapa

### Componentes Oficiais
- Componentes de mapa (em desenvolvimento)

### Edge Functions
- `nominatim-proxy` - Proxy para geocoding

### Tabelas SQL
- Nenhuma (usa providers externos)

### Funções SQL
- Nenhuma

### Providers Ativos
- `OSMTileProvider` - Tiles OpenStreetMap
- `NominatimGeocodingProvider` - Geocoding Nominatim
- `MockRoutingProvider` - Routing mock (temporário)

### Código Deprecated
- ❌ Importações diretas de providers em módulos
- ❌ Lógica de projeção duplicada

### Pode Remover
- Código de projeção inline após migração para `mapEntityProjection`

---

## 8. COMMUNITY (Posts, Comentários)

### SSOT Oficial
- **Services**: `src/core/community/services/`
- **Status**: ✅ COMPLETO

### Hooks Oficiais
- `useCommunityFeed()` - Feed de posts
- `useCreatePost()` - Criação de posts
- `usePostInteractions()` - Interações (like, share)
- `useComments()` - Comentários
- `useCreatePoll()` - Criação de enquetes

### Componentes Oficiais
- `CommunityFeed` - Feed principal
- `PostCard`, `UnifiedPostCard` - Cards de post
- `CreatePostModal`, `UnifiedComposer` - Composer
- `PostDetailModal` - Modal de detalhes
- `CommentsModal` - Modal de comentários

### Edge Functions
- Nenhuma

### Tabelas SQL Ativas
- `posts` - Posts da comunidade
- `community_questions` - Perguntas Q&A
- `question_answers` - Respostas
- `comments` - Comentários
- `comment_likes` - Likes em comentários
- `question_answer_likes` - Likes em respostas
- `community_polls` - Enquetes
- `community_poll_votes` - Votos em enquetes

### Funções SQL
- Triggers de validação de location_id
- Funções de contagem de interações

### Código Deprecated
- ⚠️ `community_posts` - Renomeada para `community_questions`
- ⚠️ Campos legados: `city`, `neighborhood`, `street`, `autor_id`, `texto`
- ⚠️ Funções deprecated: `createCommunityPost()`, `createSimplePost()`

### Pode Remover
- Após migração: campos legados em `posts`
- Após migração: funções deprecated de criação

---

## 9. BUSINESS (Negócios, Estabelecimentos)

### SSOT Oficial
- **Service**: `src/modules/business/services/BusinessService.ts`
- **Service**: `src/core/business/services/BusinessManagementService.ts`
- **Status**: ✅ ETAPA 6 COMPLETA (Modelo Canônico)

### Hooks Oficiais
- `useBusiness()` - Gerenciamento de empresas
- `useBusinessById()` - Busca por ID
- `useBusinessList()` - Listagem
- `useBusinessCreate()` - Criação
- `useBusinessEdit()` - Edição
- `useBusinessFavorite()` - Favoritos

### Componentes Oficiais
- `BusinessCard` - Card de empresa
- `BusinessGrid` - Grid de empresas
- `BusinessFilters` - Filtros
- `BusinessHeader`, `BusinessAbout`, `BusinessGallery` - Detalhes

### Edge Functions
- Nenhuma

### Tabelas SQL Ativas
- `business_data` - Dados de empresas
- `business_slug_history` - Histórico de slugs
- `addresses` - Endereços físicos (canônico)
- `locations` - Territórios (canônico)

### Funções SQL
- Triggers de validação de `location_id` e `address_id`
- Funções de busca espacial

### Modelo Canônico (ETAPA 6)
```typescript
{
  location_id: UUID,   // FK para locations (território principal)
  address_id: UUID,    // FK para addresses (endereço físico, opcional)
}
```

### Código Deprecated
- ⚠️ Campos legados: `address`, `latitude`, `longitude`, `city`, `neighborhood`
- ⚠️ Uso de `service_areas` para substituir `location_id`

### Pode Remover
- Após migração completa: campos legados de endereço

---

## 10. GASTRONOMY (Gastronomia)

### SSOT Oficial
- **Service**: `src/modules/gastronomy/services/GastronomyService.ts`
- **Extensão de**: Business Module
- **Status**: ✅ COMPLETO

### Hooks Oficiais
- `useGastronomyProfile()` - Perfil gastronômico
- `useMenu()` - Gerenciamento de cardápio
- `useMenuItems()` - Itens do cardápio

### Componentes Oficiais
- `GastronomyHero` - Hero banner
- `GastronomyBusinessCardEnhanced` - Card de estabelecimento
- `MenuCategoryTabs` - Tabs de categorias
- `MenuItemCard` - Card de item
- `MenuItemDetailDrawer` - Drawer de detalhes
- `DeliveryInfoCard` - Info de delivery

### Edge Functions
- Nenhuma

### Tabelas SQL Ativas
- `gastronomy_profiles` - Perfis gastronômicos
- `menus` - Cardápios
- `menu_categories` - Categorias do cardápio
- `menu_items` - Itens do cardápio
- `menu_item_variants` - Variantes de itens
- `menu_item_addons` - Adicionais
- `menu_item_availability` - Disponibilidade
- `menu_promotions` - Promoções

### Funções SQL
- Triggers de validação de menu

### Código Deprecated
- Nenhum

### Pode Remover
- Nenhum

---

## 11. GUIDE (Pontos Turísticos)

### SSOT Oficial
- **Service**: `src/modules/guide/services/TouristPointService.ts`
- **Service**: `src/modules/guide/services/TouristPointQueryService.ts`
- **Status**: ✅ CONSOLIDADO (v2)

### Hooks Oficiais
- `useTouristPoints()` - Listagem de pontos
- `useTouristPoint()` - Ponto individual
- `useGuideUrls()` - URLs de navegação
- `useHasTouristPoints()` - Verificação de existência

### Componentes Oficiais
- Componentes de listagem e detalhes (em módulo guide)

### Edge Functions
- Nenhuma

### Tabelas SQL Ativas
- `tourist_points_v2` - Pontos turísticos (SSOT)
- `tourist_point_media` - Mídia dos pontos

### Funções SQL
- Triggers de validação de `location_id`

### Código Deprecated
- ⚠️ `tourist_points` (v1) - Migrado para `tourist_points_v2`
- ⚠️ Campo legado: `neighborhood` - Usar `location.name`

### Pode Remover
- Após migração: tabela `tourist_points` (v1)
- Após migração: uso direto de campo `neighborhood`

---

## 12. JOBS/VAGAS (Vagas de Emprego)

### SSOT Oficial
- **Service**: Não há service dedicado (usa queries diretas)
- **Status**: ⚠️ BÁSICO (sem SSOT formal)

### Hooks Oficiais
- `useVagas()` - Listagem de vagas
- `useVagasLocation()` - Localização de vagas

### Componentes Oficiais
- `VagaCard` - Card de vaga
- `VagasFilters` - Filtros

### Edge Functions
- Nenhuma

### Tabelas SQL Ativas
- `job_postings` - Vagas de emprego

### Funções SQL
- Nenhuma

### Código Deprecated
- Nenhum

### Pode Remover
- Nenhum

### Recomendações
- ⚠️ Criar `JobService` como SSOT
- ⚠️ Adicionar validação de `location_id`
- ⚠️ Implementar modelo canônico de endereço

---

## EDGE FUNCTIONS ATIVAS (Resumo)

1. **admin-suspend-profile** - Suspensão de perfil (admin)
2. **admin-verify-profile** - Verificação de perfil (admin)
3. **auto-dispatch-ride** - Dispatch automático de corridas
4. **nominatim-proxy** - Proxy para geocoding Nominatim
5. **process-timeouts** - Processamento de timeouts de corridas
6. **send-emergency-email** - Envio de emails de emergência
7. **territory-ai-content** - Geração de conteúdo territorial com IA

---

## TABELAS SQL PRINCIPAIS (Resumo)

### Territorial
- `locations` - Territórios (país, estado, cidade, bairro)
- `territorial_groups` - Grupos territoriais
- `addresses` - Endereços físicos (canônico)
- `neighborhood_boundaries` - Polígonos de bairros

### Mobilidade
- `ride_requests` - Solicitações de corrida
- `driver_data` - Dados de motoristas
- `driver_locations` - Localização de motoristas
- `driver_routes` - Rotas de motoristas

### Segurança
- `emergency_alerts` - Alertas de emergência
- `ride_shares` - Compartilhamentos de viagem
- `safety_incidents` - Incidentes de segurança
- `emergency_contacts` - Contatos de emergência

### Pricing
- `pricing_rules` - Regras de precificação
- `pricing_peak_hour_multipliers` - Multiplicadores de pico
- `pricing_additional_fees` - Taxas adicionais

### Community
- `posts` - Posts da comunidade
- `community_questions` - Perguntas Q&A
- `question_answers` - Respostas
- `comments` - Comentários
- `community_polls` - Enquetes

### Business
- `business_data` - Dados de empresas
- `business_slug_history` - Histórico de slugs

### Gastronomy
- `gastronomy_profiles` - Perfis gastronômicos
- `menus` - Cardápios
- `menu_items` - Itens do cardápio

### Guide
- `tourist_points_v2` - Pontos turísticos
- `tourist_point_media` - Mídia dos pontos

### Jobs
- `job_postings` - Vagas de emprego

---

## CÓDIGO DEPRECATED (Consolidado)

### Alto Impacto (Remover Prioritário)
1. **CepService** (`src/core/address/services/CepService.ts`)
   - Substituir por: `geocodingService.lookupPostalCode()`
   
2. **Campos legados em posts**
   - `city`, `neighborhood`, `street`, `autor_id`, `texto`
   - Substituir por: `location_id`, `author_profile_id`, `content`

3. **Funções deprecated de posts**
   - `createCommunityPost()`, `createSimplePost()`
   - Substituir por: `useCreatePost()` hook

4. **Campos legados em business_data**
   - `address`, `latitude`, `longitude`, `city`, `neighborhood`
   - Substituir por: `location_id`, `address_id`

### Médio Impacto
5. **tourist_points (v1)**
   - Migrado para: `tourist_points_v2`
   - Campo `neighborhood` → `location.name`

6. **Cálculos de ETA inline**
   - Substituir por: `routingService.calculateSimpleETA()`

7. **Subscriptions manuais de tracking**
   - Substituir por: `trackingService.subscribeToPosition()`

### Baixo Impacto
8. **Importações diretas de providers**
   - Substituir por: uso de services SSOT

---

## REGRAS DE IMPORTAÇÃO (Consolidado)

### ✅ PERMITIDO
```typescript
// Módulos importam de core
import { routingService, geocodingService } from '@/core/routing';
import { trackingService } from '@/core/tracking';
import { safetyService } from '@/core/safety';
import { pricingService } from '@/core/pricing';

// Core importa de core (apenas tipos)
import type { Coordinates } from '@/core/maps/types';
```

### ❌ PROIBIDO
```typescript
// NUNCA importar provider diretamente
import { mockRoutingProvider } from '@/integrations/maps'; // ❌

// NUNCA acessar Supabase diretamente em componente
import { supabase } from '@/integrations/supabase'; // ❌

// NUNCA duplicar lógica de domínio
function calculateMyOwnETA() { ... } // ❌
```

---

## PRÓXIMAS AÇÕES RECOMENDADAS

### Prioridade Alta
1. Migrar consumidores de `CepService` para `geocodingService`
2. Remover campos legados de `posts` após validação
3. Completar migração de `business_data` para modelo canônico

### Prioridade Média
4. Criar `JobService` como SSOT para vagas
5. Implementar provider real de routing (OSRM/Valhalla)
6. Adicionar testes de integração para services SSOT

### Prioridade Baixa
7. Remover tabela `tourist_points` (v1) após migração completa
8. Consolidar hooks de community
9. Documentar padrões de uso de cada domínio

---

**Documento gerado em**: 2026-04-06  
**Versão**: 1.0.0  
**Manutenção**: Atualizar após mudanças arquiteturais significativas
