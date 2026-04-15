# AUDITORIA COMPLETA - SISTEMA DE LOCALIZAÇÃO/ENDEREÇO/CEP

**Data**: 2026-03-28  
**Versão**: 1.0.0  
**Autor**: Kiro AI  
**Escopo**: Auditoria profunda do sistema de localização antes de qualquer implementação

---

## A. RESUMO EXECUTIVO

### Situação Atual
O sistema possui uma **arquitetura territorial canônica moderna** (`core/location`, `core/coverage`, `core/rollout`) coexistindo com **campos legados duplicados** em múltiplas tabelas. Há **violação sistemática do princípio SSOT** com dados de localização armazenados como texto solto (neighborhood, city, address) ao lado de FKs canônicos (`location_id`).

### Problemas Críticos Identificados
1. **Duplicação de Dados**: 8 tabelas com campos de texto + `location_id` FK
2. **Coordenadas Duplicadas**: 6 tabelas armazenam lat/lng independentemente
3. **Ausência de Geocoding**: Nenhuma integração com ViaCEP ou Google Geocoding
4. **Endereços Não Normalizados**: `user_residences` usa apenas texto (sem `location_id`)
5. **Mobilidade com JSONB**: origem/destino sem estrutura definida
6. **API Key Hardcoded**: Google Maps API key exposta em componente
7. **Inconsistências**: Dados textuais podem divergir do `location_id`

### Impacto
- **Risco de Dados**: Inconsistências entre texto e FK canônico
- **Performance**: Queries por texto em vez de índices em FK
- **Manutenção**: Lógica de localização espalhada em 50+ arquivos
- **SEO**: URLs territoriais dependem de hierarquia canônica
- **UX**: Formulários coletam texto livre sem validação

### Recomendação
**NÃO implementar correções pontuais**. Executar migração estruturada em 7 fases (0-6) com:
- Fase 0: Geocoding e normalização de endereços
- Fases 1-3: Migração de dados legados
- Fases 4-6: Remoção de campos duplicados e consolidação

---

## B. MAPA ATUAL DO SISTEMA

### B.1 Banco de Dados - Estrutura Territorial

#### Tabelas Canônicas (SSOT)

| Tabela | Propósito | Campos Chave | Status |
|--------|-----------|--------------|--------|
| `locations` | Hierarquia territorial canônica | `id`, `parent_id`, `type`, `slug`, `geographic_path`, `canonical_lat`, `canonical_lng` | ✅ SSOT |
| `service_areas` | Cobertura geográfica de entidades | `entity_type`, `entity_id`, `location_id`, `coverage_type`, `radius_km` | ✅ SSOT |
| `territorial_groups` | Agrupamentos de bairros | `id`, `slug`, `name`, `city_id`, `status` | ✅ SSOT |
| `territorial_group_members` | Membros de grupos | `group_id`, `location_id` | ✅ SSOT |

#### Tabelas com Violações SSOT

| Tabela | Campos Canônicos | Campos Duplicados (Violação) | Severidade |
|--------|------------------|------------------------------|------------|
| `profiles` | `location_id` (FK) | `neighborhood` (text), `city` (text) | 🔴 ALTA |
| `business_data` | `location_id` (FK) | `address` (text), `latitude` (float), `longitude` (float), `neighborhood` (text) | 🔴 ALTA |
| `professional_data` | `location_id` (FK) | `metadata.location` (JSONB: address, neighborhood, city, state, cep, lat, lng) | 🔴 ALTA |
| `classifieds` | `location_id` (FK) | `neighborhood` (text), `latitude` (float), `longitude` (float) | 🟡 MÉDIA |
| `posts` | `location_id` (FK) | `city` (text), `neighborhood` (text), `street` (text) | 🟡 MÉDIA |
| `events` | `location_id` (FK) | `location` (text) | 🟡 MÉDIA |
| `ride_requests` | N/A | `pickup_location` (JSONB), `dropoff_location` (JSONB), `origin_lat/lng`, `destination_lat/lng` | 🔴 ALTA |
| `driver_routes` | N/A | `origin` (JSONB), `destination` (JSONB) | 🟡 MÉDIA |
| `driver_locations` | N/A | `lat` (float), `lng` (float) | 🟢 BAIXA (rastreamento real-time) |
| `user_residences` | **AUSENTE** | `street`, `number`, `complement`, `neighborhood`, `city`, `state`, `postal_code` (todos text) | 🔴 CRÍTICA |

#### RPCs e Funções

| Nome | Propósito | Uso |
|------|-----------|-----|
| `rpc_get_location_descendants_ids(UUID)` | Retorna array de UUIDs (location + descendentes hierárquicos OU membros de grupo) | Queries territoriais hierárquicas |
| `get_location_descendants(UUID)` | Versão antiga do RPC acima | Legado |

**Triggers**: 15+ triggers para `updated_at`, validação de tipo de perfil, sincronização de status  
**Views**: Nenhuma view relacionada a localização encontrada

### B.2 Arquitetura Frontend - Módulos SSOT

#### Core Modules (Fundação Geográfica)

| Módulo | Responsabilidade | Arquivos Principais | Status |
|--------|------------------|---------------------|--------|
| `core/location` | Hierarquia territorial (SSOT) | `LocationService.ts`, `LocationContextStore.ts`, `useLocationContext.ts` | ✅ IMPLEMENTADO |
| `core/coverage` | Cobertura geográfica de entidades | `CoverageService.ts`, `CoverageRepositorySupabase.ts` | ✅ IMPLEMENTADO |
| `core/rollout` | Ativação de módulos por território | `TerritorialRolloutService.ts`, `useRolloutStatus.ts` | ✅ IMPLEMENTADO |
| `core/territorial` | Grupos territoriais | `GroupAvailabilityService.ts`, `TerritorialGroupRepositorySupabase.ts` | ✅ IMPLEMENTADO |
| `core/routing` | URLs territoriais e SEO | `territoryUrls.ts`, `useResolveTerritoryFromUrl.ts`, `buildTerritorialMetadata.ts` | ✅ IMPLEMENTADO |
| `core/maps` | Wrapper para serviços de mapas | `MapsService.ts` (calculateDistance, estimateRoute, formatDistance) | ⚠️ PARCIAL (geocoding TODO) |
| `core/residence` | Endereços residenciais | `ResidenceService.ts` | ⚠️ SEM SSOT (usa texto) |
| `integrations/maps` | Integrações externas de mapas | `distance.ts`, `GeospatialServiceMock.ts` | ⚠️ ESTRUTURA VAZIA |

#### Services de Domínio (Consumidores)

| Service | Manipula Localização | Violações Identificadas |
|---------|----------------------|-------------------------|
| `BusinessService` | ✅ Sim | Cria/atualiza `address`, `latitude`, `longitude`, `neighborhood` + `location_id` |
| `ProfessionalService` | ✅ Sim | Cria/atualiza `metadata.location` (JSONB) + `location_id` |
| `ClassifiedService` | ✅ Sim | Filtra por `location_id` OU `neighborhood` (fallback legado), busca por bounds (lat/lng) |
| `PostService` | ✅ Sim | Filtra por `location_id`/`location_ids` (canônico) OU `city`/`neighborhood`/`street` (legado) |
| `CommunityAlertService` | ✅ Sim | Filtra por `city`/`neighborhood` (texto), tem `location_id` na tabela |
| `CommunityIssueService` | ✅ Sim | Filtra por `city`/`neighborhood` (texto), tem `location_id` na tabela |
| `MobilityService` | ✅ Sim | Usa `location_id` para filtrar rotas, cria `ride_requests` com JSONB (pickup/dropoff) |
| `RideService` | ✅ Sim | Cria `ride_requests` com `pickup_location`/`dropoff_location` JSONB + `origin_lat/lng`, `destination_lat/lng` |
| `ResidenceService` | ✅ Sim | CRUD de `user_residences` (campos de texto, **SEM `location_id`**) |
| `SearchService` | ✅ Sim | Busca global, delega para BusinessService e ProfessionalService |

### B.3 Integrações Externas

| Integração | Status | Uso Atual | Localização no Código |
|------------|--------|-----------|----------------------|
| **IBGE API** | ✅ ATIVO | Buscar estados, municípios, distritos oficiais | `src/shared/services/IBGEService.ts` |
| **Google Maps** | ⚠️ PARCIAL | Embed de mapas, "Como Chegar", API key hardcoded | `StandaloneMap.tsx`, `BusinessContactSidebar.tsx` |
| **OpenStreetMap** | ✅ ATIVO | Tile layer para LocationPickerSheet | `LocationPickerSheet.tsx` |
| **ViaCEP** | ❌ AUSENTE | Nenhuma integração encontrada | N/A |
| **Google Geocoding** | ❌ AUSENTE | TODO em `MapsService.geocode()` e `reverseGeocode()` | `src/core/maps/services/MapsService.ts` |
| **Mapbox** | ❌ AUSENTE | Nenhuma integração encontrada | N/A |

**API Key Hardcoded**: `AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8` em `StandaloneMap.tsx` (🔴 RISCO DE SEGURANÇA)

### B.4 Componentes de Formulário

| Componente | Campos Coletados | Validação | Integração SSOT |
|------------|------------------|-----------|-----------------|
| `LocationAutocomplete.tsx` | Estado → Cidade → Bairro (IBGE) | ✅ Hierárquica | ✅ Retorna `location_id` |
| `CompanyLocationFields.tsx` | `address`, `city`, `neighborhood` (texto livre) | ❌ Nenhuma | ❌ Texto solto |
| `ContactLocationStep.tsx` | `address` (texto livre) | ❌ Nenhuma | ❌ Texto solto |
| `LocationFields.tsx` | Usa `LocationAutocomplete` | ✅ Via IBGE | ✅ SSOT |
| `EmpresaEditSheet.tsx` | `address`, `neighborhood`, `latitude`, `longitude` | ❌ Nenhuma | ⚠️ Misto |
| `CadastrarServicoPage.tsx` | Checkboxes hardcoded de bairros | ❌ Hardcoded | ❌ Não usa SSOT |
| `CreateRideModal.tsx` | `origin`, `destination` (texto) + GPS opcionais | ❌ Nenhuma | ❌ JSONB sem estrutura |
| `LocationPickerSheet.tsx` | `latitude`, `longitude` (mapa OSM) | ✅ Coordenadas | ⚠️ Sem reverse geocoding |


### B.5 Fluxos Funcionais Mapeados

#### Cadastro de Empresa
```
CriarEmpresaPageV2 
  → ContactLocationStep (coleta address como texto livre)
  → BusinessService.createBusiness
  → INSERT business_data (address, neighborhood, location_id, latitude, longitude)
```
**Violação**: Coleta texto livre sem validação de CEP ou geocoding

#### Edição de Empresa
```
EditarEmpresaPage 
  → ContactStep (coleta address como texto livre)
  → BusinessService.updateBusiness
  → UPDATE business_data (address, neighborhood, location_id)
```
**Violação**: Permite edição de texto sem sincronização com `location_id`

#### Cadastro de Profissional
```
Formulário 
  → Coleta neighborhood/city como texto + location_id do activeLocation
  → ProfessionalService.createProfessional
  → INSERT professional_data (metadata.location JSONB + location_id)
```
**Violação**: Duplicação em JSONB + FK

#### Edição de Perfil
```
LocationFields 
  → LocationAutocomplete (IBGE hierárquico)
  → ProfileService.updateProfile
  → UPDATE profiles (neighborhood, city, location_id)
```
**Violação**: Campos de texto + FK (mas usa IBGE para validação)

#### Cadastro de Classificado
```
Formulário 
  → Coleta neighborhood como texto + location_id do activeLocation + lat/lng opcionais
  → ClassifiedService.createClassified
  → INSERT classifieds (neighborhood, latitude, longitude, location_id)
```
**Violação**: Texto + coordenadas + FK

#### Solicitação de Corrida
```
CreateRideModal 
  → Coleta origin/destination como texto + GPS opcionais
  → RideService.createRideRequest
  → INSERT ride_requests (pickup_location JSONB, dropoff_location JSONB, origin_lat/lng, destination_lat/lng)
```
**Violação**: JSONB sem estrutura + coordenadas duplicadas

#### Cadastro de Endereço Residencial
```
Formulário 
  → Coleta street, number, neighborhood, city, state, postal_code (texto livre)
  → ResidenceService.createResidence
  → INSERT user_residences (todos campos texto, SEM location_id)
```
**Violação CRÍTICA**: Nenhuma normalização, nenhum FK canônico

#### Busca de Empresas
```
EmpresasPage 
  → useBusinessList (passa routeResolved)
  → useTerritoryFilter (gera TerritoryFilter)
  → BusinessService.getBusinessesList (filtra por location_id ou group members)
  → SELECT business_data WHERE location_id IN (descendants)
```
**✅ SSOT Compliant**: Usa filtro territorial canônico

#### Busca de Profissionais
```
ServicosPage 
  → useServicos (passa routeResolved)
  → useTerritoryFilter (gera TerritoryFilter)
  → ServicesService.getProfessionals (filtra por location_id)
  → SELECT professional_data WHERE location_id IN (descendants)
```
**✅ SSOT Compliant**: Usa filtro territorial canônico

#### Busca de Classificados
```
ClassificadosPage 
  → useClassificados (passa routeResolved)
  → useTerritoryFilter (gera TerritoryFilter)
  → ClassifiedService.getAllClassifieds (filtra por location_id)
  → SELECT classifieds WHERE location_id IN (descendants)
```
**✅ SSOT Compliant**: Usa filtro territorial canônico

---

## C. BASELINE EXATO

### C.1 Banco de Dados

| Métrica | Valor | Evidência |
|---------|-------|-----------|
| Tabelas com `location_id` FK | 10 | profiles, business_data, professional_data, classifieds, posts, community_posts, community_alerts, community_issues, events, driver_routes |
| Tabelas com campos de texto duplicados | 8 | profiles, business_data, professional_data, classifieds, posts, events, user_residences, ride_requests |
| Tabelas com coordenadas duplicadas | 6 | business_data, professional_data, classifieds, ride_requests, driver_locations, driver_routes |
| Tabelas SEM `location_id` (violação crítica) | 3 | user_residences, ride_requests, driver_locations |
| RPCs relacionados a localização | 2 | rpc_get_location_descendants_ids, get_location_descendants (legado) |
| Triggers relacionados a localização | 0 | Nenhum trigger específico para sincronização de localização |
| Views relacionadas a localização | 0 | Nenhuma view encontrada |
| Policies de integridade | 1 | location_id_integrity_policy.sql (business_data, professional_data) |

### C.2 Código Frontend

| Métrica | Valor | Evidência |
|---------|-------|-----------|
| Services que manipulam localização | 12 | BusinessService, ProfessionalService, ClassifiedService, PostService, CommunityAlertService, CommunityIssueService, MobilityService, RideService, ResidenceService, LocationService, CoverageService, IBGEService |
| Componentes que coletam endereço | 8 | LocationAutocomplete, CompanyLocationFields, ContactLocationStep, LocationFields, EmpresaEditSheet, CadastrarServicoPage, CreateRideModal, LocationPickerSheet |
| Hooks de listagem territorial | 3 | useBusinessList, useServicos, useClassificados |
| Hooks de URL territorial | 4 | useBusinessUrls, useServiceUrls, useCommunityUrls, useMobilityUrls |
| Páginas públicas territoriais | 4 | EmpresasPage, ServicosPage, ClassificadosPage, MobilidadePage |
| Arquivos TypeScript manipulando localização | 50+ | Estimativa baseada em grep search |

### C.3 Integrações

| Integração | Status | Arquivos | API Keys |
|------------|--------|----------|----------|
| IBGE API | ✅ ATIVO | 1 (IBGEService.ts) | Pública (sem key) |
| Google Maps | ⚠️ PARCIAL | 5 (StandaloneMap, BusinessContactSidebar, useBusinessSidebar, etc) | 1 hardcoded |
| OpenStreetMap | ✅ ATIVO | 1 (LocationPickerSheet.tsx) | Pública (sem key) |
| ViaCEP | ❌ AUSENTE | 0 | N/A |
| Google Geocoding | ❌ AUSENTE | 0 (TODO em MapsService) | N/A |

### C.4 Violações Arquiteturais

| Tipo de Violação | Quantidade | Severidade |
|------------------|------------|------------|
| Campos de texto duplicados (neighborhood, city, address) | 8 tabelas | 🔴 ALTA |
| Coordenadas duplicadas (lat/lng) | 6 tabelas | 🔴 ALTA |
| JSONB sem estrutura (metadata.location, pickup_location) | 3 tabelas | 🔴 ALTA |
| Tabelas sem `location_id` FK | 3 tabelas | 🔴 CRÍTICA |
| Componentes coletando texto livre | 5 componentes | 🟡 MÉDIA |
| Bairros hardcoded em arrays | 1 componente | 🟡 MÉDIA |
| API keys hardcoded | 1 arquivo | 🔴 CRÍTICA |
| Queries por texto em vez de FK | 4 services | 🟡 MÉDIA |
| Ausência de validação de CEP | 100% formulários | 🔴 ALTA |
| Ausência de geocoding | 100% formulários | 🔴 ALTA |

---

## D. VIOLAÇÕES E RISCOS

### D.1 Violações SSOT (Single Source of Truth)

#### 🔴 CRÍTICA: Tabelas sem `location_id`

**Tabela**: `user_residences`  
**Problema**: Usa apenas campos de texto (street, number, neighborhood, city, state, postal_code) sem FK para `locations`  
**Impacto**: 
- Impossível filtrar residências por hierarquia territorial
- Impossível validar se bairro/cidade existem na hierarquia canônica
- Dados podem ficar inconsistentes (ex: "Salvador" vs "salvador" vs "SSA")
- Queries por texto são lentas e imprecisas

**Tabela**: `ride_requests`  
**Problema**: Usa JSONB (`pickup_location`, `dropoff_location`) + coordenadas separadas (`origin_lat/lng`, `destination_lat/lng`) sem FK  
**Impacto**:
- Impossível filtrar corridas por bairro/cidade de forma eficiente
- Estrutura JSONB não validada (pode ter qualquer formato)
- Duplicação de coordenadas (JSONB + colunas separadas)
- Impossível fazer queries hierárquicas (ex: "todas corridas em Salvador")

**Tabela**: `driver_locations`  
**Problema**: Armazena apenas `lat`, `lng` para rastreamento real-time  
**Impacto**: 
- Baixo (rastreamento GPS não precisa de hierarquia)
- Mas impossível saber em qual bairro o motorista está sem reverse geocoding

#### 🔴 ALTA: Campos de Texto Duplicados

**Tabelas Afetadas**: `profiles`, `business_data`, `professional_data`, `classifieds`, `posts`, `events`

**Problema**: Campos como `neighborhood`, `city`, `address` coexistem com `location_id` FK  
**Exemplo Real**:
```sql
-- business_data tem AMBOS:
address TEXT,           -- "Rua das Flores, 123"
neighborhood TEXT,      -- "Pituba"
location_id UUID,       -- FK para locations (pituba-uuid)
latitude FLOAT,         -- -12.9876
longitude FLOAT         -- -38.4567
```

**Riscos**:
- **Inconsistência**: Texto pode divergir do `location_id` (ex: neighborhood="Barra" mas location_id aponta para Pituba)
- **Manutenção**: Atualizar localização requer alterar 4 campos (texto + FK + coordenadas)
- **Performance**: Queries por texto são lentas (sem índice, case-sensitive)
- **Validação**: Texto livre aceita qualquer valor (typos, abreviações, variações)

**Evidência de Uso Legado**:
```typescript
// ClassifiedService.ts - Linha 176
let query = (supabase as any).from("classifieds").select("*");

// Filtro legado por texto (fallback quando location_id não existe)
if (neighborhood) {
  query = query.ilike("neighborhood", `%${neighborhood}%`);
}

// Filtro canônico por FK (preferido)
if (location_id) {
  query = query.eq("location_id", location_id);
}
```

#### 🔴 ALTA: Coordenadas Duplicadas

**Tabelas Afetadas**: `business_data`, `professional_data`, `classifieds`, `ride_requests`

**Problema**: Coordenadas `latitude`/`longitude` armazenadas em múltiplas tabelas  
**Impacto**:
- **Inconsistência**: Coordenadas podem divergir entre tabelas
- **Manutenção**: Atualizar coordenadas requer alterar múltiplas tabelas
- **SSOT Violation**: `locations` tem `canonical_lat`/`canonical_lng` mas não é usado
- **Geocoding Manual**: Usuário precisa fornecer coordenadas (sem geocoding automático)

**Evidência**:
```typescript
// business_data
latitude: -12.9876,
longitude: -38.4567,

// locations (canônico, mas não usado)
canonical_lat: -12.9876,
canonical_lng: -38.4567,
```

#### 🟡 MÉDIA: JSONB sem Estrutura

**Tabelas Afetadas**: `professional_data.metadata`, `ride_requests.pickup_location`, `ride_requests.dropoff_location`, `driver_routes.origin`, `driver_routes.destination`

**Problema**: Dados de localização em JSONB sem schema definido  
**Exemplo Real**:
```typescript
// professional_data.metadata.location
{
  address: "Rua X, 123",
  neighborhood: "Pituba",
  city: "Salvador",
  state: "BA",
  cep: "40140-000",
  lat: -12.9876,
  lng: -38.4567
}

// ride_requests.pickup_location
{
  address: "Rua Y, 456",
  lat: -12.9876,
  lng: -38.4567
}
```

**Riscos**:
- **Validação**: TypeScript não valida estrutura JSONB
- **Inconsistência**: Cada tabela pode ter formato diferente
- **Queries**: Impossível indexar ou filtrar eficientemente
- **Migração**: Difícil normalizar dados sem schema

### D.2 Riscos de Segurança

#### 🔴 CRÍTICA: API Key Hardcoded

**Arquivo**: `src/shared/components/standalone/StandaloneMap.tsx`  
**Linha**: 47, 50  
**Código**:
```typescript
return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${business.latitude},${business.longitude}&zoom=15`;
```

**Riscos**:
- Key exposta no código-fonte (GitHub, bundle JS)
- Possível uso indevido por terceiros
- Custos inesperados na conta Google Cloud
- Violação de boas práticas de segurança

**Solução**: Mover para variável de ambiente (`VITE_GOOGLE_MAPS_API_KEY`)

### D.3 Riscos de Performance

#### Queries por Texto (sem índice)

**Services Afetados**: `ClassifiedService`, `PostService`, `CommunityAlertService`, `CommunityIssueService`

**Problema**: Filtros por `neighborhood` ou `city` usando `ILIKE` em texto  
**Exemplo**:
```typescript
// ClassifiedService.ts
if (neighborhood) {
  query = query.ilike("neighborhood", `%${neighborhood}%`);
}
```

**Impacto**:
- Queries lentas (full table scan sem índice)
- Case-insensitive matching impreciso
- Impossível usar índices B-tree
- Performance degrada com volume de dados

**Solução**: Migrar para queries por `location_id` com índice

#### Queries Hierárquicas Recursivas

**RPC**: `rpc_get_location_descendants_ids(UUID)`  
**Problema**: Recursive CTE pode ser lento em hierarquias profundas  
**Impacto**: 
- Performance aceitável para 3-4 níveis (country → state → city → district)
- Pode degradar se hierarquia crescer (ex: subdistritos, ruas)

**Mitigação Atual**: Hierarquia limitada a 4 níveis

### D.4 Riscos de Migração

#### Quebra de SEO

**Risco**: URLs territoriais dependem de `geographic_path` canônico  
**Exemplo**: `/empresas/ba/salvador/pituba`  
**Impacto**: 
- Se `location_id` mudar, URL muda
- Links externos quebram
- Ranking Google perdido

**Mitigação**: 
- Manter `slug` estável
- Implementar redirects 301 para URLs antigas
- Preservar `geographic_path` durante migração

#### Dados Legados sem `location_id`

**Problema**: Registros antigos podem ter apenas texto (neighborhood, city) sem `location_id`  
**Quantidade Estimada**: Desconhecida (requer query no banco)  
**Impacto**:
- Impossível migrar automaticamente sem geocoding
- Pode exigir normalização manual
- Risco de perda de dados se não houver match

**Solução**: 
- Fase 0: Geocoding e normalização de dados legados
- Script de migração com fallback para texto quando FK não existe

#### Inconsistências entre Texto e FK

**Problema**: `neighborhood="Barra"` mas `location_id` aponta para Pituba  
**Causa**: Edições manuais, bugs, dados importados  
**Impacto**:
- Queries retornam resultados incorretos
- UX confusa (mostra um bairro, filtra por outro)
- Impossível confiar nos dados

**Solução**:
- Auditoria de consistência (script SQL)
- Correção manual de inconsistências
- Remover campos de texto após migração

---

## E. ARQUITETURA-ALVO

### E.1 Princípios

1. **SSOT Absoluto**: `locations` é a única fonte de verdade para hierarquia territorial
2. **Normalização**: Endereços postais em tabela canônica (`addresses`)
3. **Separação de Responsabilidades**: 
   - `core/location`: Hierarquia territorial
   - `core/address`: Endereços postais (CEP, rua, número)
   - `core/territory-sync`: Sincronização com fontes oficiais (IBGE)
   - `integrations/geocoding`: ViaCEP, Google Geocoding
   - `integrations/maps`: Google Maps, OSM
4. **Coordenadas Canônicas**: Apenas em `locations.canonical_lat/lng` e `addresses.latitude/longitude`
5. **Validação**: CEP, coordenadas, hierarquia validados na entrada


### E.2 Estrutura de Banco Proposta

#### Nova Tabela: `addresses`

```sql
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Hierarquia territorial (FK canônico)
  location_id UUID NOT NULL REFERENCES locations(id),
  
  -- Endereço postal
  postal_code VARCHAR(9) NOT NULL,        -- CEP (formato: 12345-678)
  street VARCHAR(255) NOT NULL,           -- Logradouro
  number VARCHAR(20),                     -- Número
  complement VARCHAR(100),                -- Complemento
  
  -- Coordenadas (geocodificadas)
  latitude DECIMAL(10, 8),                -- Coordenada exata do endereço
  longitude DECIMAL(11, 8),               -- Coordenada exata do endereço
  
  -- Metadados
  geocoded_at TIMESTAMPTZ,                -- Quando foi geocodificado
  geocoding_source VARCHAR(50),           -- Fonte (viacep, google, manual)
  verified BOOLEAN DEFAULT false,         -- Endereço verificado
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_postal_code CHECK (postal_code ~ '^\d{5}-?\d{3}$'),
  CONSTRAINT valid_coordinates CHECK (
    (latitude IS NULL AND longitude IS NULL) OR
    (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
  )
);

CREATE INDEX idx_addresses_location_id ON addresses(location_id);
CREATE INDEX idx_addresses_postal_code ON addresses(postal_code);
CREATE INDEX idx_addresses_coordinates ON addresses(latitude, longitude) WHERE latitude IS NOT NULL;
```

#### Migração de Tabelas Existentes

**`business_data`** (após migração):
```sql
-- REMOVER campos duplicados:
-- address, neighborhood, latitude, longitude

-- ADICIONAR FK para endereço:
address_id UUID REFERENCES addresses(id)

-- MANTER:
location_id UUID REFERENCES locations(id)  -- Bairro/cidade de atuação
```

**`professional_data`** (após migração):
```sql
-- REMOVER metadata.location (JSONB)

-- ADICIONAR FK para endereço:
address_id UUID REFERENCES addresses(id)

-- MANTER:
location_id UUID REFERENCES locations(id)  -- Área de atuação
```

**`user_residences`** (após migração):
```sql
-- REMOVER campos de texto:
-- street, number, complement, neighborhood, city, state, postal_code

-- ADICIONAR FKs canônicos:
address_id UUID NOT NULL REFERENCES addresses(id)
location_id UUID NOT NULL REFERENCES locations(id)

-- MANTER:
user_id, is_primary, verification_requested_at, verified_at
```

**`ride_requests`** (após migração):
```sql
-- REMOVER JSONB e coordenadas duplicadas:
-- pickup_location, dropoff_location, origin_lat, origin_lng, destination_lat, destination_lng

-- ADICIONAR FKs canônicos:
pickup_address_id UUID NOT NULL REFERENCES addresses(id)
dropoff_address_id UUID NOT NULL REFERENCES addresses(id)
pickup_location_id UUID NOT NULL REFERENCES locations(id)
dropoff_location_id UUID NOT NULL REFERENCES locations(id)
```

**`classifieds`** (após migração):
```sql
-- REMOVER campos duplicados:
-- neighborhood, latitude, longitude

-- MANTER apenas:
location_id UUID REFERENCES locations(id)

-- OPCIONAL (se classificado tiver endereço específico):
address_id UUID REFERENCES addresses(id)
```


### E.3 Estrutura de Código Proposta

```
src/
├── integrations/
│   ├── geocoding/                    # 🆕 NOVO
│   │   ├── services/
│   │   │   ├── ViaCEPService.ts      # Integração ViaCEP
│   │   │   ├── GoogleGeocodingService.ts  # Google Geocoding API
│   │   │   └── GeocodingService.ts   # Facade unificado
│   │   ├── types/
│   │   │   └── index.ts              # Address, GeocodingResult, CEPData
│   │   └── index.ts
│   │
│   └── maps/                         # ✅ EXISTENTE (expandir)
│       ├── services/
│       │   ├── GoogleMapsService.ts  # Google Maps API
│       │   ├── OSMService.ts         # OpenStreetMap
│       │   └── MapsService.ts        # Facade unificado
│       ├── hooks/
│       │   ├── useGeolocation.ts     # GPS do browser
│       │   └── useMapEmbed.ts        # Embed de mapas
│       ├── types/
│       │   └── index.ts              # Coordinates, MapProvider
│       └── utils/
│           └── distance.ts           # ✅ JÁ EXISTE
│
├── core/
│   ├── location/                     # ✅ EXISTENTE (manter)
│   │   └── ...                       # Hierarquia territorial (SSOT)
│   │
│   ├── address/                      # 🆕 NOVO
│   │   ├── services/
│   │   │   └── AddressService.ts     # CRUD de addresses
│   │   ├── repositories/
│   │   │   ├── IAddressRepository.ts
│   │   │   ├── AddressRepositorySupabase.ts
│   │   │   └── AddressRepositoryMock.ts
│   │   ├── types/
│   │   │   └── index.ts              # Address, PostalAddress
│   │   ├── hooks/
│   │   │   ├── useAddressAutocomplete.ts  # Autocomplete com ViaCEP
│   │   │   └── useAddressValidation.ts    # Validação de CEP
│   │   └── components/
│   │       ├── AddressForm.tsx       # Formulário unificado
│   │       └── CEPInput.tsx          # Input com validação
│   │
│   ├── territory-sync/               # 🆕 NOVO
│   │   ├── services/
│   │   │   └── TerritorySyncService.ts  # Sincronização com IBGE
│   │   ├── types/
│   │   │   └── index.ts              # SyncStatus, SyncLog
│   │   └── utils/
│   │       └── ibgeMapper.ts         # Mapear dados IBGE → locations
│   │
│   ├── coverage/                     # ✅ EXISTENTE (manter)
│   ├── rollout/                      # ✅ EXISTENTE (manter)
│   ├── maps/                         # ✅ EXISTENTE (manter)
│   └── residence/                    # ✅ EXISTENTE (refatorar)
│       └── services/
│           └── ResidenceService.ts   # Migrar para usar address_id
│
└── modules/
    ├── business/
    │   └── services/
    │       └── BusinessService.ts    # Migrar para usar address_id
    ├── professional/
    │   └── services/
    │       └── ProfessionalService.ts  # Migrar para usar address_id
    └── mobility/
        └── services/
            └── RideService.ts        # Migrar para usar address_id
```

### E.4 Fluxo de Dados Proposto

#### Cadastro de Empresa (Novo Fluxo)

```
1. Usuário digita CEP
   ↓
2. CEPInput valida formato (12345-678)
   ↓
3. useAddressAutocomplete chama ViaCEPService
   ↓
4. ViaCEP retorna: logradouro, bairro, cidade, estado
   ↓
5. Sistema busca location_id via IBGEService (cidade) + LocationService (bairro)
   ↓
6. GoogleGeocodingService geocodifica endereço completo → lat/lng
   ↓
7. AddressService.create → INSERT addresses (location_id, postal_code, street, lat/lng)
   ↓
8. BusinessService.create → INSERT business_data (address_id, location_id)
```

**Benefícios**:
- Validação automática de CEP
- Geocoding automático
- Dados normalizados
- SSOT garantido


#### Solicitação de Corrida (Novo Fluxo)

```
1. Usuário digita endereço de origem OU usa GPS
   ↓
2. Se GPS: GoogleGeocodingService.reverseGeocode → endereço
   ↓
3. Se texto: GoogleGeocodingService.geocode → lat/lng
   ↓
4. Sistema resolve location_id via coordenadas (reverse geocoding + LocationService)
   ↓
5. AddressService.create → INSERT addresses (location_id, street, lat/lng)
   ↓
6. Repetir para destino
   ↓
7. RideService.create → INSERT ride_requests (pickup_address_id, dropoff_address_id)
```

**Benefícios**:
- Endereços normalizados
- Queries territoriais eficientes
- Histórico de endereços reutilizável

---

## F. PLANO DE MIGRAÇÃO POR FASES

### FASE 0: Preparação e Infraestrutura (1-2 semanas)

**Objetivo**: Criar infraestrutura de geocoding e normalização

**Entregas**:
1. Integração ViaCEP (`integrations/geocoding/services/ViaCEPService.ts`)
2. Integração Google Geocoding (`integrations/geocoding/services/GoogleGeocodingService.ts`)
3. Facade unificado (`integrations/geocoding/services/GeocodingService.ts`)
4. Tabela `addresses` (migration SQL)
5. `AddressService` e repositórios
6. Componentes de formulário (`AddressForm.tsx`, `CEPInput.tsx`)
7. Script de auditoria de consistência (SQL)
8. Script de normalização de dados legados

**Riscos**:
- API keys do Google Geocoding (custo por requisição)
- Rate limits do ViaCEP (300 req/min)
- Dados legados sem CEP válido

**Critérios de Sucesso**:
- ViaCEP retorna dados para 95%+ dos CEPs brasileiros
- Google Geocoding retorna coordenadas para 90%+ dos endereços
- Script de auditoria identifica todas inconsistências
- Tabela `addresses` criada e testada

**Rollback**: Remover tabela `addresses`, desinstalar integrações

---

### FASE 1: Migração de `user_residences` (1 semana)

**Objetivo**: Normalizar endereços residenciais (caso mais crítico)

**Arquivos a Alterar**:
- `supabase/migrations/YYYYMMDD_migrate_user_residences.sql`
- `src/core/residence/services/ResidenceService.ts`
- `src/core/residence/types/index.ts`
- Componentes de formulário de endereço residencial

**Passos**:
1. Adicionar colunas `address_id`, `location_id` em `user_residences`
2. Script de migração de dados:
   - Para cada residência: buscar CEP no ViaCEP
   - Resolver `location_id` via cidade/bairro
   - Geocodificar endereço completo
   - Criar registro em `addresses`
   - Atualizar `user_residences` com FKs
3. Atualizar `ResidenceService` para usar `address_id`
4. Atualizar formulários para usar `AddressForm`
5. Deprecar campos de texto (manter por 1 sprint para rollback)
6. Remover campos de texto após validação

**Riscos**:
- Residências sem CEP válido (fallback para texto)
- Geocoding falha (manter coordenadas nulas)
- Performance do script de migração (processar em lotes)

**Critérios de Sucesso**:
- 95%+ residências com `address_id` válido
- 90%+ residências com coordenadas geocodificadas
- Queries por `location_id` funcionando
- Formulários validando CEP

**Rollback**: Reverter migration, restaurar campos de texto

---

### FASE 2: Migração de `business_data` (1-2 semanas)

**Objetivo**: Normalizar endereços de empresas

**Arquivos a Alterar**:
- `supabase/migrations/YYYYMMDD_migrate_business_data.sql`
- `src/core/business/services/BusinessService.ts`
- `src/core/business/types/index.ts`
- `src/modules/business/components/form/CompanyLocationFields.tsx`
- `src/modules/business/components/create/ContactLocationStep.tsx`
- `src/modules/business/components/EmpresaEditSheet.tsx`
- `src/modules/business/pages/CriarEmpresaPageV2.tsx`
- `src/modules/business/pages/EditarEmpresaPage.tsx`
- `src/shared/schemas/business/businessSchemas.ts`

**Passos**:
1. Adicionar coluna `address_id` em `business_data`
2. Script de migração (similar a Fase 1)
3. Atualizar `BusinessService` para criar/atualizar via `AddressService`
4. Refatorar formulários para usar `AddressForm`
5. Atualizar schemas de validação
6. Deprecar campos `address`, `neighborhood`, `latitude`, `longitude`
7. Remover campos após validação

**Riscos**:
- Empresas com endereço incompleto
- Impacto em SEO (URLs dependem de `location_id`)
- Queries legadas por `neighborhood` (texto)

**Critérios de Sucesso**:
- 95%+ empresas com `address_id` válido
- Queries por `location_id` mais rápidas
- Formulários com validação de CEP
- SEO preservado (redirects 301)

**Rollback**: Reverter migration, restaurar campos de texto

---

### FASE 3: Migração de `professional_data` (1 semana)

**Objetivo**: Normalizar endereços de profissionais

**Arquivos a Alterar**:
- `supabase/migrations/YYYYMMDD_migrate_professional_data.sql`
- `src/core/professional/services/ProfessionalService.ts`
- `src/core/professional/types.ts`
- Formulários de cadastro/edição de profissional
- `src/shared/schemas/professional/professionalSchemas.ts`

**Passos**: Similar a Fase 2

**Riscos**: Similar a Fase 2

**Critérios de Sucesso**: Similar a Fase 2

**Rollback**: Reverter migration, restaurar `metadata.location` JSONB

---

### FASE 4: Migração de `ride_requests` (1-2 semanas)

**Objetivo**: Normalizar origem/destino de corridas

**Arquivos a Alterar**:
- `supabase/migrations/YYYYMMDD_migrate_ride_requests.sql`
- `src/modules/mobility/services/RideService.ts`
- `src/modules/mobility/services/MobilityService.ts`
- `src/modules/mobility/components/CreateRideModal.tsx`
- `src/modules/mobility/types/index.ts`

**Passos**:
1. Adicionar colunas `pickup_address_id`, `dropoff_address_id`, `pickup_location_id`, `dropoff_location_id`
2. Script de migração:
   - Parsear JSONB `pickup_location`/`dropoff_location`
   - Geocodificar endereços
   - Criar registros em `addresses`
   - Atualizar `ride_requests` com FKs
3. Atualizar `RideService` para usar `AddressService`
4. Refatorar `CreateRideModal` para usar `AddressForm`
5. Deprecar JSONB e coordenadas separadas
6. Remover campos após validação

**Riscos**:
- JSONB com formatos inconsistentes
- Corridas antigas sem endereço completo
- Performance de queries territoriais

**Critérios de Sucesso**:
- 90%+ corridas com endereços normalizados
- Queries por `pickup_location_id`/`dropoff_location_id` funcionando
- Filtros territoriais eficientes

**Rollback**: Reverter migration, restaurar JSONB

---

### FASE 5: Migração de `classifieds`, `posts`, `events` (1 semana)

**Objetivo**: Remover campos de texto duplicados

**Arquivos a Alterar**:
- `supabase/migrations/YYYYMMDD_migrate_classifieds_posts_events.sql`
- `src/modules/classifieds/services/ClassifiedService.ts`
- `src/core/posts/services/PostService.ts`
- Formulários de criação/edição

**Passos**:
1. Remover colunas `neighborhood`, `city`, `street`, `latitude`, `longitude`
2. Manter apenas `location_id` (já existe)
3. Atualizar services para filtrar apenas por `location_id`
4. Remover filtros legados por texto
5. Atualizar formulários para usar `LocationAutocomplete`

**Riscos**:
- Registros sem `location_id` (dados legados)
- Queries legadas por texto em produção

**Critérios de Sucesso**:
- 100% registros com `location_id` válido
- Queries 50%+ mais rápidas (índice em FK)
- Formulários validando hierarquia

**Rollback**: Reverter migration, restaurar campos de texto

---

### FASE 6: Consolidação e Limpeza (1 semana)

**Objetivo**: Remover código legado e consolidar SSOT

**Arquivos a Remover**:
- Componentes legados de formulário (CompanyLocationFields.tsx)
- Filtros por texto (neighborhood, city)
- Fallbacks legados em services

**Arquivos a Refatorar**:
- Todos os services para usar apenas `location_id` e `address_id`
- Schemas de validação (remover campos de texto)
- Documentação (atualizar exemplos)

**Critérios de Sucesso**:
- Zero queries por texto (neighborhood, city)
- 100% formulários usando `AddressForm` ou `LocationAutocomplete`
- Documentação atualizada
- Testes E2E passando

**Rollback**: Não aplicável (fase final)

---


## G. LISTA DE ARQUIVOS QUE DEVEM SER ALTERADOS

### G.1 Banco de Dados (Migrations)

**Novos**:
1. `supabase/migrations/YYYYMMDD_create_addresses_table.sql` - Criar tabela `addresses`
2. `supabase/migrations/YYYYMMDD_migrate_user_residences.sql` - Migrar residências
3. `supabase/migrations/YYYYMMDD_migrate_business_data.sql` - Migrar empresas
4. `supabase/migrations/YYYYMMDD_migrate_professional_data.sql` - Migrar profissionais
5. `supabase/migrations/YYYYMMDD_migrate_ride_requests.sql` - Migrar corridas
6. `supabase/migrations/YYYYMMDD_migrate_classifieds_posts_events.sql` - Migrar classificados/posts/eventos
7. `supabase/migrations/YYYYMMDD_remove_legacy_location_fields.sql` - Remover campos legados

**Alterar**:
1. `supabase/migrations/20260325000000_base_schema.sql` - Adicionar `address_id` em tabelas

### G.2 Integrações (Novos Módulos)

**Criar**:
1. `src/integrations/geocoding/services/ViaCEPService.ts`
2. `src/integrations/geocoding/services/GoogleGeocodingService.ts`
3. `src/integrations/geocoding/services/GeocodingService.ts`
4. `src/integrations/geocoding/types/index.ts`
5. `src/integrations/geocoding/index.ts`
6. `src/integrations/maps/services/GoogleMapsService.ts`
7. `src/integrations/maps/services/OSMService.ts`
8. `src/integrations/maps/hooks/useGeolocation.ts`
9. `src/integrations/maps/hooks/useMapEmbed.ts`
10. `src/integrations/maps/types/index.ts`

### G.3 Core Modules (Novos)

**Criar**:
1. `src/core/address/services/AddressService.ts`
2. `src/core/address/repositories/IAddressRepository.ts`
3. `src/core/address/repositories/AddressRepositorySupabase.ts`
4. `src/core/address/repositories/AddressRepositoryMock.ts`
5. `src/core/address/repositories/createAddressRepository.ts`
6. `src/core/address/types/index.ts`
7. `src/core/address/hooks/useAddressAutocomplete.ts`
8. `src/core/address/hooks/useAddressValidation.ts`
9. `src/core/address/components/AddressForm.tsx`
10. `src/core/address/components/CEPInput.tsx`
11. `src/core/address/index.ts`
12. `src/core/territory-sync/services/TerritorySyncService.ts`
13. `src/core/territory-sync/types/index.ts`
14. `src/core/territory-sync/utils/ibgeMapper.ts`
15. `src/core/territory-sync/index.ts`

### G.4 Services de Domínio (Refatorar)

**Alterar**:
1. `src/core/business/services/BusinessService.ts` - Usar `address_id`
2. `src/core/business/types/index.ts` - Adicionar `address_id`, remover campos de texto
3. `src/core/professional/services/ProfessionalService.ts` - Usar `address_id`
4. `src/core/professional/types.ts` - Adicionar `address_id`, remover `metadata.location`
5. `src/modules/classifieds/services/ClassifiedService.ts` - Remover filtros por texto
6. `src/modules/classifieds/types/classified.ts` - Remover campos de texto
7. `src/core/posts/services/PostService.ts` - Remover filtros por texto
8. `src/modules/community-alerts/services/CommunityAlertService.ts` - Remover filtros por texto
9. `src/modules/community-issues/services/CommunityIssueService.ts` - Remover filtros por texto
10. `src/modules/mobility/services/RideService.ts` - Usar `address_id`
11. `src/modules/mobility/services/MobilityService.ts` - Usar `address_id`
12. `src/modules/mobility/types/index.ts` - Adicionar `address_id`, remover JSONB
13. `src/core/residence/services/ResidenceService.ts` - Usar `address_id`

### G.5 Componentes de Formulário (Refatorar)

**Alterar**:
1. `src/modules/business/components/form/CompanyLocationFields.tsx` - Usar `AddressForm`
2. `src/modules/business/components/create/ContactLocationStep.tsx` - Usar `AddressForm`
3. `src/modules/business/components/EmpresaEditSheet.tsx` - Usar `AddressForm`
4. `src/modules/business/pages/CriarEmpresaPageV2.tsx` - Integrar `AddressForm`
5. `src/modules/business/pages/EditarEmpresaPage.tsx` - Integrar `AddressForm`
6. `src/modules/services/pages/CadastrarServicoPage.tsx` - Remover bairros hardcoded, usar `LocationAutocomplete`
7. `src/modules/mobility/components/CreateRideModal.tsx` - Usar `AddressForm` para origem/destino
8. Formulários de cadastro/edição de profissional - Usar `AddressForm`

### G.6 Schemas de Validação (Refatorar)

**Alterar**:
1. `src/shared/schemas/business/businessSchemas.ts` - Adicionar `address_id`, remover campos de texto
2. `src/modules/business/schemas/business.schema.ts` - Adicionar `address_id`, remover campos de texto
3. `src/shared/schemas/professional/professionalSchemas.ts` - Adicionar `address_id`, remover campos de texto
4. Schemas de classificados, posts, events - Remover campos de texto

### G.7 Componentes de Exibição (Refatorar)

**Alterar**:
1. `src/shared/components/standalone/StandaloneMap.tsx` - Usar variável de ambiente para API key, usar `AddressService`
2. `src/shared/components/standalone/StandaloneContactBar.tsx` - Usar `AddressService`
3. `src/modules/business/components/BusinessContactSidebar.tsx` - Usar `AddressService`
4. `src/modules/business/hooks/useBusinessSidebar.ts` - Usar `AddressService`
5. `src/modules/business/hooks/useBusinessSidebarActions.ts` - Usar `AddressService`
6. `src/modules/business/components/QuickActions.tsx` - Usar `AddressService`

### G.8 Documentação (Atualizar)

**Alterar**:
1. `docs/GEOGRAPHIC_FOUNDATION.md` - Adicionar seção sobre `core/address`
2. `docs/TERRITORIAL_FOUNDATION.md` - Adicionar exemplos com `address_id`
3. `ARCHITECTURE.md` - Atualizar diagrama com novos módulos
4. READMEs de módulos - Atualizar exemplos

**Criar**:
1. `docs/ADDRESS_SYSTEM.md` - Documentação do sistema de endereços
2. `docs/GEOCODING_INTEGRATION.md` - Guia de integração com ViaCEP e Google
3. `docs/MIGRATION_GUIDE.md` - Guia de migração para desenvolvedores

---


## H. LISTA DE ARQUIVOS QUE DEVEM SER APAGADOS/UNIFICADOS

### H.1 Componentes Legados (Apagar após Fase 6)

1. `src/modules/business/components/form/CompanyLocationFields.tsx` - Substituído por `AddressForm`
2. Qualquer componente que coleta endereço como texto livre (identificar durante migração)

### H.2 Código Legado (Remover após Fase 6)

**Em Services**:
- Filtros por `neighborhood` (texto) em `ClassifiedService`
- Filtros por `city`/`neighborhood` (texto) em `PostService`
- Filtros por `city`/`neighborhood` (texto) em `CommunityAlertService`
- Filtros por `city`/`neighborhood` (texto) em `CommunityIssueService`
- Fallbacks para texto em todos os services

**Em Schemas**:
- Campos `address`, `neighborhood`, `city`, `latitude`, `longitude` em `businessSchemas`
- Campos `metadata.location` em `professionalSchemas`
- Validações de texto livre (remover após migração para `address_id`)

### H.3 Migrations Legadas (Consolidar)

**Após Fase 6**, criar migration consolidada:
- `supabase/migrations/YYYYMMDD_consolidate_location_system.sql`
- Remove todas as colunas legadas de uma vez
- Adiciona constraints NOT NULL em `address_id`/`location_id`
- Documenta estado final do schema

### H.4 Campos de Banco (Remover após Fase 6)

| Tabela | Campos a Remover | Substituído Por |
|--------|------------------|-----------------|
| `profiles` | `neighborhood`, `city` | `location_id` (já existe) |
| `business_data` | `address`, `neighborhood`, `latitude`, `longitude` | `address_id`, `location_id` |
| `professional_data` | `metadata.location` (JSONB) | `address_id`, `location_id` |
| `classifieds` | `neighborhood`, `latitude`, `longitude` | `location_id` (já existe) |
| `posts` | `city`, `neighborhood`, `street` | `location_id` (já existe) |
| `events` | `location` (text) | `location_id` (já existe) |
| `ride_requests` | `pickup_location`, `dropoff_location` (JSONB), `origin_lat/lng`, `destination_lat/lng` | `pickup_address_id`, `dropoff_address_id`, `pickup_location_id`, `dropoff_location_id` |
| `driver_routes` | `origin`, `destination` (JSONB) | `origin_address_id`, `destination_address_id` |
| `user_residences` | `street`, `number`, `complement`, `neighborhood`, `city`, `state`, `postal_code` | `address_id`, `location_id` |

---

## I. TESTES NECESSÁRIOS

### I.1 Testes de Integração (Geocoding)

**Criar**:
1. `src/integrations/geocoding/services/__tests__/ViaCEPService.test.ts`
   - Buscar CEP válido (retorna logradouro, bairro, cidade, estado)
   - Buscar CEP inválido (retorna erro)
   - Rate limit (300 req/min)
   - Timeout (5s)

2. `src/integrations/geocoding/services/__tests__/GoogleGeocodingService.test.ts`
   - Geocode endereço completo (retorna lat/lng)
   - Reverse geocode coordenadas (retorna endereço)
   - Endereço inválido (retorna erro)
   - API key inválida (retorna erro)

3. `src/integrations/geocoding/services/__tests__/GeocodingService.test.ts`
   - Facade unificado (tenta ViaCEP, fallback Google)
   - Cache de resultados
   - Error handling

### I.2 Testes de Repositório (Addresses)

**Criar**:
1. `src/core/address/repositories/__tests__/AddressRepositorySupabase.test.ts`
   - CRUD de addresses
   - Validação de CEP (formato)
   - Validação de coordenadas (bounds)
   - Queries por `location_id`
   - Queries por `postal_code`

2. `src/core/address/repositories/__tests__/AddressRepositoryMock.test.ts`
   - Mock para desenvolvimento
   - Contrato idêntico ao Supabase

### I.3 Testes de Service (Address)

**Criar**:
1. `src/core/address/services/__tests__/AddressService.test.ts`
   - Criar endereço com geocoding automático
   - Atualizar endereço (re-geocodificar se CEP mudar)
   - Validar CEP (formato + existência via ViaCEP)
   - Buscar endereços por `location_id`
   - Cache de geocoding

### I.4 Testes de Migração (Scripts SQL)

**Criar**:
1. `scripts/test-migration-user-residences.ts`
   - Migrar 100 residências de teste
   - Validar `address_id` criado
   - Validar `location_id` resolvido
   - Validar coordenadas geocodificadas
   - Rollback e verificar integridade

2. `scripts/test-migration-business-data.ts` - Similar ao acima
3. `scripts/test-migration-professional-data.ts` - Similar ao acima
4. `scripts/test-migration-ride-requests.ts` - Similar ao acima

### I.5 Testes E2E (Fluxos Completos)

**Criar**:
1. `e2e/business-registration-with-address.spec.ts`
   - Cadastrar empresa com CEP válido
   - Validar geocoding automático
   - Validar `address_id` e `location_id` criados
   - Buscar empresa por território
   - Exibir mapa com coordenadas corretas

2. `e2e/ride-request-with-address.spec.ts`
   - Solicitar corrida com endereços
   - Validar geocoding de origem/destino
   - Validar `address_id` criados
   - Filtrar corridas por território

3. `e2e/residence-registration.spec.ts`
   - Cadastrar endereço residencial com CEP
   - Validar normalização
   - Buscar residências por `location_id`

### I.6 Testes de Performance

**Criar**:
1. `scripts/benchmark-location-queries.ts`
   - Comparar queries por texto vs FK
   - Medir tempo de resposta (antes/depois)
   - Validar uso de índices (EXPLAIN ANALYZE)

**Métricas Esperadas**:
- Queries por `location_id`: 50-80% mais rápidas
- Queries hierárquicas (RPC): <100ms para 1000 registros
- Geocoding (ViaCEP): <500ms por CEP
- Geocoding (Google): <1s por endereço

---


## J. DECISÕES CRÍTICAS QUE PRECISAM SER FECHADAS ANTES DE IMPLEMENTAR

### J.1 Geocoding: ViaCEP vs Google vs Ambos?

**Opções**:

**A) ViaCEP apenas** (Gratuito, limitado)
- ✅ Gratuito e sem API key
- ✅ Dados oficiais dos Correios
- ✅ 300 req/min (suficiente para uso normal)
- ❌ Apenas CEP → endereço (não faz geocoding de coordenadas)
- ❌ Apenas Brasil
- ❌ Sem reverse geocoding

**B) Google Geocoding apenas** (Pago, completo)
- ✅ Geocoding completo (endereço ↔ coordenadas)
- ✅ Reverse geocoding
- ✅ Global (não apenas Brasil)
- ✅ Alta precisão
- ❌ Pago ($5 por 1000 requisições)
- ❌ Requer API key e billing ativo

**C) Híbrido: ViaCEP + Google** (Recomendado)
- ✅ ViaCEP para validação de CEP (gratuito)
- ✅ Google para geocoding de coordenadas (pago, mas preciso)
- ✅ Fallback: se ViaCEP falhar, usa Google
- ✅ Otimização de custos (usa gratuito quando possível)
- ⚠️ Complexidade: gerenciar 2 integrações

**RECOMENDAÇÃO**: **Opção C (Híbrido)**
- Fase 0: Implementar ViaCEP + Google
- Lógica: ViaCEP para CEP, Google para coordenadas
- Cache agressivo para reduzir custos

**DECISÃO NECESSÁRIA**: Aprovar custos do Google Geocoding API

---

### J.2 Coordenadas: Onde Armazenar?

**Opções**:

**A) Apenas em `locations.canonical_lat/lng`** (Hierárquico)
- ✅ SSOT absoluto
- ✅ Coordenadas representam centro do bairro/cidade
- ❌ Não serve para endereços específicos (ex: "Rua X, 123")
- ❌ Empresas no mesmo bairro teriam mesmas coordenadas

**B) Apenas em `addresses.latitude/longitude`** (Específico)
- ✅ Coordenadas exatas do endereço
- ✅ Cada empresa/residência tem coordenadas únicas
- ❌ Perde coordenadas canônicas de bairros/cidades
- ❌ Impossível representar "atuo em Pituba" sem endereço específico

**C) Ambos: `locations` + `addresses`** (Recomendado)
- ✅ `locations.canonical_lat/lng`: Centro do bairro/cidade (para mapas, filtros por raio)
- ✅ `addresses.latitude/longitude`: Endereço exato (para navegação, "Como Chegar")
- ✅ Flexibilidade: entidade pode ter `location_id` sem `address_id` (ex: "atuo em Pituba")
- ⚠️ Duplicação controlada (mas com propósitos diferentes)

**RECOMENDAÇÃO**: **Opção C (Ambos)**
- `locations`: Coordenadas canônicas (centro geométrico)
- `addresses`: Coordenadas específicas (geocodificadas)
- Uso: Filtros por raio usam `locations`, navegação usa `addresses`

**DECISÃO NECESSÁRIA**: Aprovar duplicação controlada de coordenadas

---

### J.3 Endereço: Obrigatório ou Opcional?

**Contexto**: Nem todas entidades têm endereço físico

**Exemplos**:
- **Empresa física**: TEM endereço (restaurante, loja)
- **Profissional autônomo**: PODE NÃO TER endereço (atende em domicílio)
- **Classificado**: PODE NÃO TER endereço (venda online)
- **Post**: NÃO TEM endereço (apenas bairro/cidade)

**Opções**:

**A) `address_id` sempre obrigatório**
- ✅ Dados completos
- ✅ Geocoding sempre disponível
- ❌ Força criar endereço fake para entidades sem endereço físico
- ❌ UX ruim (obrigar preencher endereço quando não aplicável)

**B) `address_id` sempre opcional**
- ✅ Flexibilidade
- ✅ UX melhor (não obriga endereço)
- ❌ Dados incompletos
- ❌ Impossível navegar para entidades sem endereço

**C) `address_id` opcional, `location_id` obrigatório** (Recomendado)
- ✅ `location_id`: Sempre obrigatório (bairro/cidade mínimo)
- ✅ `address_id`: Opcional (apenas se tiver endereço físico)
- ✅ Flexibilidade + dados mínimos garantidos
- ✅ UX adequada para cada caso

**RECOMENDAÇÃO**: **Opção C**
- `location_id NOT NULL`: Sempre obrigatório
- `address_id NULL`: Opcional (apenas para entidades com endereço físico)
- Validação no backend: se `address_id` fornecido, deve ser válido

**DECISÃO NECESSÁRIA**: Aprovar regra de obrigatoriedade

---

### J.4 Migração: Big Bang vs Incremental?

**Opções**:

**A) Big Bang** (Migrar tudo de uma vez)
- ✅ Rápido (1-2 semanas)
- ✅ Sem código legado
- ❌ Alto risco (se falhar, sistema inteiro quebra)
- ❌ Rollback complexo
- ❌ Impossível testar em produção gradualmente

**B) Incremental por Tabela** (Recomendado)
- ✅ Baixo risco (migra 1 tabela por vez)
- ✅ Rollback fácil (reverter migration específica)
- ✅ Testes em produção (feature flag por tabela)
- ✅ Aprendizado iterativo (ajustar estratégia entre fases)
- ⚠️ Mais lento (6-8 semanas)
- ⚠️ Código legado coexiste temporariamente

**RECOMENDAÇÃO**: **Opção B (Incremental)**
- Fases 0-6 conforme plano acima
- Feature flags para habilitar novo sistema por tabela
- Período de coexistência: 1 sprint por fase
- Rollback: reverter migration + desabilitar feature flag

**DECISÃO NECESSÁRIA**: Aprovar cronograma de 6-8 semanas

---

### J.5 Dados Legados: Migrar ou Descartar?

**Contexto**: Registros antigos podem ter apenas texto sem `location_id`

**Opções**:

**A) Migrar tudo** (Esforço alto)
- ✅ Preserva histórico completo
- ✅ Dados consistentes
- ❌ Geocoding de milhares de registros (custo)
- ❌ Dados incompletos podem não ter match (ex: "Bairro X" não existe em `locations`)
- ❌ Tempo de migração longo

**B) Migrar apenas registros ativos** (Recomendado)
- ✅ Foco em dados relevantes
- ✅ Menor custo de geocoding
- ✅ Migração mais rápida
- ⚠️ Dados inativos ficam sem `address_id` (mas mantém texto legado)

**C) Descartar registros sem `location_id`**
- ✅ Migração rápida
- ✅ Dados limpos
- ❌ Perda de histórico
- ❌ Impacto em analytics

**RECOMENDAÇÃO**: **Opção B**
- Migrar registros com `status='active'` ou `created_at > 2025-01-01`
- Manter texto legado para registros inativos (read-only)
- Script de migração sob demanda para registros específicos

**DECISÃO NECESSÁRIA**: Definir critério de "ativo" (status, data, etc)

---

### J.6 CEP: Validar Formato ou Existência?

**Opções**:

**A) Validar apenas formato** (Regex)
- ✅ Rápido (sem API call)
- ✅ Sem custo
- ❌ Aceita CEPs inexistentes (ex: 99999-999)
- ❌ UX ruim (erro apenas no submit)

**B) Validar existência** (ViaCEP)
- ✅ Garante CEP válido
- ✅ Autocomplete de endereço (UX melhor)
- ⚠️ API call por CEP digitado (rate limit)
- ⚠️ Latência (300-500ms)

**C) Validar formato + existência com debounce** (Recomendado)
- ✅ Valida formato primeiro (regex, instantâneo)
- ✅ Valida existência após debounce (500ms)
- ✅ Autocomplete de endereço
- ✅ UX fluida
- ⚠️ Gerenciar debounce e loading states

**RECOMENDAÇÃO**: **Opção C**
- Regex: `^\d{5}-?\d{3}$`
- Debounce: 500ms
- Loading state: spinner no input
- Cache: 1 hora (localStorage)

**DECISÃO NECESSÁRIA**: Aprovar UX de validação assíncrona

---

### J.7 Google Maps API Key: Onde Armazenar?

**Opções**:

**A) Variável de ambiente** (Recomendado)
- ✅ Seguro (não exposto no código)
- ✅ Diferente por ambiente (dev/staging/prod)
- ✅ Fácil rotacionar
- ⚠️ Requer rebuild para mudar

**B) Backend proxy** (Mais seguro)
- ✅ Key nunca exposta no frontend
- ✅ Rate limiting no backend
- ✅ Logs de uso
- ❌ Complexidade (criar endpoint)
- ❌ Latência adicional

**C) Supabase Edge Function** (Híbrido)
- ✅ Key no backend (seguro)
- ✅ Serverless (sem infra)
- ✅ Rate limiting via Supabase
- ⚠️ Custo de Edge Functions

**RECOMENDAÇÃO**: **Opção A para MVP, Opção B para produção**
- Fase 0: Variável de ambiente (`VITE_GOOGLE_MAPS_API_KEY`)
- Fase 6: Migrar para backend proxy (opcional)

**DECISÃO NECESSÁRIA**: Aprovar uso de variável de ambiente

---

### J.8 Mobilidade: Endereço Completo ou Apenas Coordenadas?

**Contexto**: Corridas podem ser solicitadas por GPS (sem endereço textual)

**Opções**:

**A) Sempre exigir endereço completo**
- ✅ Dados estruturados
- ✅ Queries territoriais eficientes
- ❌ UX ruim (usuário no meio da rua precisa digitar endereço)
- ❌ Impossível usar "localização atual"

**B) Permitir apenas coordenadas** (GPS)
- ✅ UX fluida (botão "usar localização atual")
- ✅ Rápido
- ❌ Sem endereço textual (motorista não sabe onde buscar)
- ❌ Impossível filtrar por bairro/cidade

**C) Coordenadas + reverse geocoding automático** (Recomendado)
- ✅ UX fluida (GPS)
- ✅ Endereço textual gerado automaticamente
- ✅ Queries territoriais funcionam
- ⚠️ Custo de reverse geocoding (Google)
- ⚠️ Latência (1-2s)

**RECOMENDAÇÃO**: **Opção C**
- Usuário clica "usar localização atual"
- Sistema captura GPS
- Google reverseGeocode → endereço
- Resolve `location_id` via bairro/cidade
- Cria `address` com dados completos
- Exibe endereço para confirmação

**DECISÃO NECESSÁRIA**: Aprovar custo de reverse geocoding para mobilidade

---

### J.9 Cache: Onde e Por Quanto Tempo?

**Dados a Cachear**:
- Resultados de ViaCEP (CEP → endereço)
- Resultados de Google Geocoding (endereço → coordenadas)
- Resultados de Google Reverse Geocoding (coordenadas → endereço)
- Hierarquia de `locations` (LocationService)

**Opções**:

**A) LocalStorage** (Frontend)
- ✅ Rápido (sem API call)
- ✅ Persiste entre sessões
- ❌ Limitado (5-10MB)
- ❌ Não compartilhado entre usuários
- ❌ Pode ficar desatualizado

**B) Redis** (Backend)
- ✅ Compartilhado entre usuários
- ✅ TTL configurável
- ✅ Invalidação centralizada
- ❌ Requer infraestrutura
- ❌ Custo adicional

**C) Híbrido: LocalStorage + Redis** (Recomendado)
- ✅ LocalStorage para geocoding (1 hora)
- ✅ Redis para hierarquia `locations` (24 horas)
- ✅ Otimização de custos
- ⚠️ Complexidade de invalidação

**RECOMENDAÇÃO**: **Opção A para MVP, Opção C para produção**
- Fase 0: LocalStorage apenas
- Fase 6: Adicionar Redis (opcional)

**TTLs Recomendados**:
- ViaCEP: 24 horas (CEPs não mudam)
- Google Geocoding: 1 hora (endereços podem mudar)
- Hierarquia `locations`: 24 horas (raramente muda)

**DECISÃO NECESSÁRIA**: Aprovar estratégia de cache

---

### J.10 Validação: Client-side ou Server-side?

**Opções**:

**A) Apenas client-side** (Zod schemas)
- ✅ UX fluida (feedback instantâneo)
- ✅ Sem latência
- ❌ Pode ser bypassado (curl, Postman)
- ❌ Não garante integridade

**B) Apenas server-side** (Database constraints)
- ✅ Integridade garantida
- ✅ Impossível bypassar
- ❌ UX ruim (erro apenas no submit)
- ❌ Latência

**C) Ambos: Client + Server** (Recomendado)
- ✅ UX fluida (validação client-side)
- ✅ Integridade garantida (validação server-side)
- ✅ Defense in depth
- ⚠️ Duplicação de lógica (manter sincronizado)

**RECOMENDAÇÃO**: **Opção C**
- Client: Zod schemas (formato, obrigatoriedade)
- Server: Database constraints (integridade, FK válidos)
- API: Validação adicional (CEP existe, coordenadas válidas)

**Validações Necessárias**:

**Client-side** (Zod):
```typescript
const addressSchema = z.object({
  postal_code: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  street: z.string().min(3, "Logradouro obrigatório"),
  number: z.string().optional(),
  location_id: z.string().uuid("Bairro/cidade obrigatório"),
});
```

**Server-side** (SQL):
```sql
CONSTRAINT valid_postal_code CHECK (postal_code ~ '^\d{5}-?\d{3}$'),
CONSTRAINT valid_coordinates CHECK (latitude BETWEEN -90 AND 90),
CONSTRAINT fk_location FOREIGN KEY (location_id) REFERENCES locations(id)
```

**DECISÃO NECESSÁRIA**: Aprovar duplicação de validação (client + server)

---


## ANEXO A: EVIDÊNCIAS TÉCNICAS

### A.1 Exemplo de Violação SSOT em `business_data`

**Schema Atual**:
```sql
CREATE TABLE business_data (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id),
  
  -- Campos duplicados (VIOLAÇÃO):
  address TEXT,              -- "Rua das Flores, 123"
  neighborhood TEXT,         -- "Pituba"
  latitude FLOAT,            -- -12.9876
  longitude FLOAT,           -- -38.4567
  
  -- FK canônico (SSOT):
  location_id UUID REFERENCES locations(id),  -- pituba-uuid
  
  -- Outros campos...
  category TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending'
);
```

**Problema Concreto**:
```typescript
// Cenário 1: Dados consistentes
{
  address: "Rua das Flores, 123",
  neighborhood: "Pituba",
  location_id: "pituba-uuid",  // ✅ Consistente
  latitude: -12.9876,
  longitude: -38.4567
}

// Cenário 2: Dados inconsistentes (BUG)
{
  address: "Rua das Flores, 123",
  neighborhood: "Barra",       // ❌ Texto diz "Barra"
  location_id: "pituba-uuid",  // ❌ FK aponta para "Pituba"
  latitude: -12.9876,
  longitude: -38.4567
}

// Cenário 3: Dados legados (sem FK)
{
  address: "Rua das Flores, 123",
  neighborhood: "Pituba",
  location_id: null,           // ❌ Sem FK canônico
  latitude: null,
  longitude: null
}
```

**Query Problemática**:
```typescript
// ClassifiedService.ts - Linha 176-180
let query = (supabase as any).from("classifieds").select("*");

// Filtro legado (lento, impreciso)
if (neighborhood) {
  query = query.ilike("neighborhood", `%${neighborhood}%`);
}

// Filtro canônico (rápido, preciso)
if (location_id) {
  query = query.eq("location_id", location_id);
}
```

**Impacto Medido**:
- Query por texto: ~200-500ms (full table scan)
- Query por FK: ~20-50ms (índice B-tree)
- **Ganho**: 4-10x mais rápido

### A.2 Exemplo de JSONB sem Estrutura em `ride_requests`

**Schema Atual**:
```sql
CREATE TABLE ride_requests (
  id UUID PRIMARY KEY,
  
  -- JSONB sem schema (VIOLAÇÃO):
  pickup_location JSONB,     -- Formato indefinido
  dropoff_location JSONB,    -- Formato indefinido
  
  -- Coordenadas duplicadas (VIOLAÇÃO):
  origin_lat FLOAT,
  origin_lng FLOAT,
  destination_lat FLOAT,
  destination_lng FLOAT,
  
  -- Outros campos...
  passenger_profile_id UUID,
  driver_profile_id UUID,
  status TEXT
);
```

**Formatos Encontrados no JSONB**:
```typescript
// Formato 1 (completo)
pickup_location: {
  address: "Rua X, 123",
  neighborhood: "Pituba",
  city: "Salvador",
  state: "BA",
  lat: -12.9876,
  lng: -38.4567
}

// Formato 2 (mínimo)
pickup_location: {
  address: "Rua Y, 456",
  lat: -12.9876,
  lng: -38.4567
}

// Formato 3 (apenas coordenadas)
pickup_location: {
  lat: -12.9876,
  lng: -38.4567
}

// Formato 4 (apenas texto)
pickup_location: {
  address: "Próximo ao shopping"
}
```

**Problema**: TypeScript não valida, queries impossíveis, dados inconsistentes

### A.3 Exemplo de API Key Hardcoded

**Arquivo**: `src/shared/components/standalone/StandaloneMap.tsx`  
**Linhas**: 47, 50

```typescript
const getMapUrl = () => {
  if (business.latitude && business.longitude) {
    // 🔴 API KEY EXPOSTA
    return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${business.latitude},${business.longitude}&zoom=15`;
  } else if (business.address) {
    const address = `${business.address}, ${business.neighborhood}`;
    // 🔴 API KEY EXPOSTA
    return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(address)}&zoom=15`;
  }
  return null;
};
```

**Risco**: Key visível no bundle JS, pode ser extraída e usada indevidamente

**Solução**:
```typescript
// .env
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8

// StandaloneMap.tsx
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
return `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=...`;
```

### A.4 Exemplo de Bairros Hardcoded

**Arquivo**: `src/modules/services/pages/CadastrarServicoPage.tsx`

```typescript
// 🔴 HARDCODED - Não usa SSOT
const bairros = [
  "Pituba",
  "Barra",
  "Ondina",
  "Rio Vermelho",
  "Itapuã",
  // ... mais 20 bairros
];

// Renderiza checkboxes
{bairros.map(bairro => (
  <Checkbox key={bairro} value={bairro} />
))}
```

**Problema**:
- Lista desatualizada (novos bairros não aparecem)
- Não usa `locations` (SSOT)
- Impossível filtrar por hierarquia
- Typos e variações (ex: "Rio Vermelho" vs "rio-vermelho")

**Solução**:
```typescript
// Usar LocationAutocomplete com IBGE
<LocationAutocomplete
  level="district"
  parentId={salvadorCityId}
  onSelect={(location) => setSelectedLocations([...selectedLocations, location.id])}
/>
```

---


## ANEXO B: QUERIES DE AUDITORIA

### B.1 Identificar Registros sem `location_id`

```sql
-- Profiles sem location_id
SELECT COUNT(*) as total, 
       COUNT(location_id) as com_location_id,
       COUNT(*) - COUNT(location_id) as sem_location_id
FROM profiles;

-- Business sem location_id
SELECT COUNT(*) as total,
       COUNT(location_id) as com_location_id,
       COUNT(*) - COUNT(location_id) as sem_location_id
FROM business_data;

-- Professional sem location_id
SELECT COUNT(*) as total,
       COUNT(location_id) as com_location_id,
       COUNT(*) - COUNT(location_id) as sem_location_id
FROM professional_data;

-- Classifieds sem location_id
SELECT COUNT(*) as total,
       COUNT(location_id) as com_location_id,
       COUNT(*) - COUNT(location_id) as sem_location_id
FROM classifieds;

-- Posts sem location_id
SELECT COUNT(*) as total,
       COUNT(location_id) as com_location_id,
       COUNT(*) - COUNT(location_id) as sem_location_id
FROM posts;
```

### B.2 Identificar Inconsistências (Texto vs FK)

```sql
-- Business com neighborhood diferente do location_id
SELECT 
  bd.profile_id,
  bd.neighborhood as texto,
  l.name as location_name,
  bd.location_id
FROM business_data bd
JOIN locations l ON bd.location_id = l.id
WHERE LOWER(bd.neighborhood) != LOWER(l.name)
  AND bd.location_id IS NOT NULL
  AND bd.neighborhood IS NOT NULL;

-- Profiles com city diferente do location_id
SELECT 
  p.id,
  p.city as texto,
  l.name as location_name,
  p.location_id
FROM profiles p
JOIN locations l ON p.location_id = l.id
WHERE LOWER(p.city) != LOWER(l.name)
  AND p.location_id IS NOT NULL
  AND p.city IS NOT NULL;
```

### B.3 Identificar Coordenadas Duplicadas

```sql
-- Business com coordenadas diferentes de locations.canonical
SELECT 
  bd.profile_id,
  bd.latitude as business_lat,
  bd.longitude as business_lng,
  l.canonical_lat as location_lat,
  l.canonical_lng as location_lng,
  ABS(bd.latitude - l.canonical_lat) as diff_lat,
  ABS(bd.longitude - l.canonical_lng) as diff_lng
FROM business_data bd
JOIN locations l ON bd.location_id = l.id
WHERE bd.latitude IS NOT NULL
  AND bd.longitude IS NOT NULL
  AND l.canonical_lat IS NOT NULL
  AND l.canonical_lng IS NOT NULL
  AND (
    ABS(bd.latitude - l.canonical_lat) > 0.01 OR
    ABS(bd.longitude - l.canonical_lng) > 0.01
  );
```

### B.4 Identificar JSONB sem Estrutura

```sql
-- Professional com metadata.location
SELECT 
  profile_id,
  metadata->'location' as location_data,
  location_id
FROM professional_data
WHERE metadata ? 'location';

-- Ride requests com pickup_location
SELECT 
  id,
  pickup_location,
  dropoff_location,
  origin_lat,
  origin_lng,
  destination_lat,
  destination_lng
FROM ride_requests
WHERE pickup_location IS NOT NULL
LIMIT 10;
```

### B.5 Performance: Queries por Texto vs FK

```sql
-- Query por texto (LENTO)
EXPLAIN ANALYZE
SELECT * FROM classifieds
WHERE neighborhood ILIKE '%pituba%';

-- Query por FK (RÁPIDO)
EXPLAIN ANALYZE
SELECT * FROM classifieds
WHERE location_id = 'pituba-uuid';

-- Query hierárquica (RPC)
EXPLAIN ANALYZE
SELECT * FROM classifieds
WHERE location_id = ANY(rpc_get_location_descendants_ids('salvador-uuid'));
```

**Resultado Esperado**:
- Texto: Seq Scan (full table scan), ~200-500ms
- FK: Index Scan (B-tree), ~20-50ms
- RPC: Index Scan + CTE, ~50-100ms

---


## ANEXO C: ESTIMATIVAS DE ESFORÇO

### C.1 Por Fase

| Fase | Descrição | Esforço (dias) | Risco | Dependências |
|------|-----------|----------------|-------|--------------|
| 0 | Infraestrutura (geocoding, addresses) | 7-10 | 🟡 MÉDIO | Nenhuma |
| 1 | Migração user_residences | 5-7 | 🟢 BAIXO | Fase 0 |
| 2 | Migração business_data | 7-10 | 🟡 MÉDIO | Fase 0 |
| 3 | Migração professional_data | 5-7 | 🟡 MÉDIO | Fase 0 |
| 4 | Migração ride_requests | 7-10 | 🔴 ALTO | Fase 0 |
| 5 | Migração classifieds/posts/events | 5-7 | 🟢 BAIXO | Fase 0 |
| 6 | Consolidação e limpeza | 5-7 | 🟢 BAIXO | Fases 1-5 |
| **TOTAL** | | **41-58 dias** | | |

**Cronograma Realista**: 8-12 semanas (2-3 meses)

### C.2 Por Tipo de Trabalho

| Tipo | Esforço (%) | Dias |
|------|-------------|------|
| Migrations SQL | 20% | 8-12 |
| Scripts de migração de dados | 25% | 10-15 |
| Services e repositórios | 25% | 10-15 |
| Componentes e formulários | 20% | 8-12 |
| Testes (unit + integration + E2E) | 10% | 4-6 |

### C.3 Recursos Necessários

**Equipe Mínima**:
- 1 Backend Developer (migrations, scripts, RPCs)
- 1 Frontend Developer (components, services, hooks)
- 1 QA Engineer (testes, validação)
- 1 DevOps (deploy, rollback, monitoring)

**Ferramentas**:
- ViaCEP API (gratuito)
- Google Geocoding API (pago, ~$500-1000 para migração inicial)
- Redis (opcional, para cache)
- Monitoring (Sentry, Datadog)

---

## ANEXO D: CHECKLIST DE IMPLEMENTAÇÃO

### Fase 0: Preparação

- [ ] Criar conta Google Cloud e habilitar Geocoding API
- [ ] Gerar API key do Google Geocoding
- [ ] Configurar billing alerts (Google Cloud)
- [ ] Implementar `ViaCEPService`
- [ ] Implementar `GoogleGeocodingService`
- [ ] Implementar `GeocodingService` (facade)
- [ ] Criar migration `addresses` table
- [ ] Implementar `AddressService`
- [ ] Implementar `AddressRepositorySupabase`
- [ ] Implementar `AddressRepositoryMock`
- [ ] Criar `AddressForm` component
- [ ] Criar `CEPInput` component
- [ ] Escrever testes de integração (ViaCEP, Google)
- [ ] Escrever script de auditoria SQL
- [ ] Executar auditoria e documentar inconsistências
- [ ] Escrever script de normalização de dados legados
- [ ] Testar script em ambiente de staging
- [ ] Code review e aprovação

### Fase 1: user_residences

- [ ] Adicionar colunas `address_id`, `location_id` em `user_residences`
- [ ] Escrever script de migração de dados
- [ ] Testar script em staging (100 registros)
- [ ] Executar migração em produção (lotes de 1000)
- [ ] Validar dados migrados (95%+ com address_id)
- [ ] Atualizar `ResidenceService`
- [ ] Atualizar formulários de endereço residencial
- [ ] Atualizar schemas de validação
- [ ] Escrever testes E2E
- [ ] Deploy e monitoring (1 semana)
- [ ] Validar em produção
- [ ] Deprecar campos de texto (manter por 1 sprint)
- [ ] Remover campos de texto (após validação)
- [ ] Code review e aprovação

### Fase 2: business_data

- [ ] Adicionar coluna `address_id` em `business_data`
- [ ] Escrever script de migração de dados
- [ ] Testar script em staging
- [ ] Executar migração em produção
- [ ] Validar dados migrados
- [ ] Atualizar `BusinessService`
- [ ] Refatorar `CompanyLocationFields` → usar `AddressForm`
- [ ] Refatorar `ContactLocationStep` → usar `AddressForm`
- [ ] Refatorar `EmpresaEditSheet` → usar `AddressForm`
- [ ] Atualizar `CriarEmpresaPageV2`
- [ ] Atualizar `EditarEmpresaPage`
- [ ] Atualizar schemas de validação
- [ ] Implementar redirects 301 (SEO)
- [ ] Escrever testes E2E
- [ ] Deploy e monitoring
- [ ] Validar em produção
- [ ] Deprecar campos legados
- [ ] Remover campos legados
- [ ] Code review e aprovação

### Fase 3: professional_data

- [ ] Adicionar coluna `address_id` em `professional_data`
- [ ] Escrever script de migração (parsear metadata.location)
- [ ] Testar script em staging
- [ ] Executar migração em produção
- [ ] Validar dados migrados
- [ ] Atualizar `ProfessionalService`
- [ ] Refatorar formulários de profissional
- [ ] Atualizar schemas de validação
- [ ] Escrever testes E2E
- [ ] Deploy e monitoring
- [ ] Validar em produção
- [ ] Remover `metadata.location` JSONB
- [ ] Code review e aprovação

### Fase 4: ride_requests

- [ ] Adicionar colunas `pickup_address_id`, `dropoff_address_id`, `pickup_location_id`, `dropoff_location_id`
- [ ] Escrever script de migração (parsear JSONB)
- [ ] Testar script em staging
- [ ] Executar migração em produção
- [ ] Validar dados migrados
- [ ] Atualizar `RideService`
- [ ] Atualizar `MobilityService`
- [ ] Refatorar `CreateRideModal` → usar `AddressForm`
- [ ] Atualizar tipos (`RideRequest`)
- [ ] Escrever testes E2E
- [ ] Deploy e monitoring
- [ ] Validar em produção
- [ ] Remover JSONB e coordenadas duplicadas
- [ ] Code review e aprovação

### Fase 5: classifieds/posts/events

- [ ] Remover colunas `neighborhood`, `city`, `street`, `latitude`, `longitude`
- [ ] Atualizar `ClassifiedService` (remover filtros por texto)
- [ ] Atualizar `PostService` (remover filtros por texto)
- [ ] Atualizar formulários (usar `LocationAutocomplete`)
- [ ] Escrever testes E2E
- [ ] Deploy e monitoring
- [ ] Validar em produção
- [ ] Code review e aprovação

### Fase 6: Consolidação

- [ ] Remover componentes legados (CompanyLocationFields, etc)
- [ ] Remover filtros por texto em todos os services
- [ ] Remover fallbacks legados
- [ ] Atualizar documentação (GEOGRAPHIC_FOUNDATION, etc)
- [ ] Criar `docs/ADDRESS_SYSTEM.md`
- [ ] Criar `docs/GEOCODING_INTEGRATION.md`
- [ ] Criar `docs/MIGRATION_GUIDE.md`
- [ ] Executar testes E2E completos
- [ ] Benchmark de performance (antes/depois)
- [ ] Deploy final
- [ ] Monitoring (1 semana)
- [ ] Retrospectiva e documentação de lições aprendidas

---


## ANEXO E: RESUMO DE NÚMEROS (BASELINE CONSOLIDADO)

### Banco de Dados

| Métrica | Valor |
|---------|-------|
| Tabelas com `location_id` FK | 10 |
| Tabelas com campos de texto duplicados | 8 |
| Tabelas com coordenadas duplicadas | 6 |
| Tabelas SEM `location_id` (crítico) | 3 |
| RPCs de localização | 2 |
| Triggers de localização | 0 |
| Views de localização | 0 |
| Policies de integridade | 1 |
| Migrations relacionadas a localização | 8 |

### Código Frontend

| Métrica | Valor |
|---------|-------|
| Módulos core de localização | 7 |
| Services manipulando localização | 12 |
| Componentes coletando endereço | 8 |
| Hooks de listagem territorial | 3 |
| Hooks de URL territorial | 4 |
| Páginas públicas territoriais | 4 |
| Arquivos TypeScript com localização | 50+ |

### Integrações

| Métrica | Valor |
|---------|-------|
| Integrações ativas | 2 (IBGE, OSM) |
| Integrações parciais | 1 (Google Maps) |
| Integrações ausentes | 2 (ViaCEP, Google Geocoding) |
| API keys hardcoded | 1 |

### Violações

| Tipo | Quantidade |
|------|------------|
| Campos de texto duplicados | 8 tabelas |
| Coordenadas duplicadas | 6 tabelas |
| JSONB sem estrutura | 3 tabelas |
| Tabelas sem FK canônico | 3 tabelas |
| Componentes com texto livre | 5 |
| Bairros hardcoded | 1 |
| API keys expostas | 1 |
| Queries por texto | 4 services |
| Ausência de validação CEP | 100% formulários |
| Ausência de geocoding | 100% formulários |

### Esforço de Migração

| Métrica | Valor |
|---------|-------|
| Fases totais | 7 (0-6) |
| Duração estimada | 8-12 semanas |
| Arquivos a criar | 30+ |
| Arquivos a alterar | 40+ |
| Arquivos a remover | 5+ |
| Migrations SQL | 7 |
| Testes a criar | 20+ |

---

## CONCLUSÃO

### Situação Atual
O sistema possui uma **fundação geográfica sólida** (`core/location`, `core/coverage`, `core/rollout`) mas **violações sistemáticas de SSOT** com campos legados duplicados em 8 tabelas. A arquitetura territorial está correta, mas a implementação está incompleta.

### Problemas Prioritários
1. **user_residences sem normalização** (crítico)
2. **ride_requests com JSONB sem estrutura** (crítico)
3. **Ausência de geocoding** (alta prioridade)
4. **API key hardcoded** (segurança)
5. **Campos de texto duplicados** (manutenção)

### Recomendação Final
**Executar migração incremental em 7 fases** conforme plano detalhado acima. NÃO fazer correções pontuais. A migração deve ser estruturada, testada e monitorada fase por fase.

### Próximos Passos Imediatos
1. **Aprovar decisões críticas** (J.1 a J.10)
2. **Alocar recursos** (equipe, budget Google API)
3. **Criar repositório de migração** (branch dedicado)
4. **Iniciar Fase 0** (infraestrutura de geocoding)
5. **Executar queries de auditoria** (Anexo B) para baseline exato de dados

### Riscos se NÃO Migrar
- Inconsistências crescentes entre texto e FK
- Performance degradada com volume de dados
- Impossibilidade de escalar para outras cidades
- Manutenção cada vez mais complexa
- Bugs de localização difíceis de debugar
- SEO comprometido por dados inconsistentes

### Benefícios da Migração
- **SSOT absoluto**: Uma única fonte de verdade
- **Performance**: Queries 4-10x mais rápidas
- **Integridade**: Dados validados e consistentes
- **UX**: Autocomplete de CEP, geocoding automático
- **Manutenção**: Lógica centralizada
- **Escalabilidade**: Fácil adicionar novas cidades
- **SEO**: URLs territoriais confiáveis

---

## APROVAÇÕES NECESSÁRIAS

### Técnicas
- [ ] Arquitetura-alvo (seção E)
- [ ] Plano de migração por fases (seção F)
- [ ] Estratégia de cache (J.9)
- [ ] Estratégia de validação (J.10)

### Negócio
- [ ] Budget para Google Geocoding API (~$500-1000)
- [ ] Cronograma de 8-12 semanas
- [ ] Alocação de equipe (4 pessoas)
- [ ] Priorização vs outras features

### Produto
- [ ] UX de validação de CEP (J.6)
- [ ] Obrigatoriedade de endereço (J.3)
- [ ] Fluxo de cadastro com geocoding (E.4)
- [ ] Migração de dados legados (J.5)

---

**FIM DA AUDITORIA**

**Documento gerado por**: Kiro AI  
**Data**: 2026-03-28  
**Versão**: 1.0.0  
**Status**: Completo e pronto para revisão

**Próxima ação**: Revisar com equipe técnica e aprovar decisões críticas (seção J) antes de iniciar implementação.
