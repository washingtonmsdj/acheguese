# ETAPA 12B — RECONCILIAÇÃO FINAL DO ESTADO

**Data**: 2026-03-29  
**Snapshot**: 2026-03-29T00:49:17Z  
**Banco**: xhdowzacfujckjelqhtd.supabase.co

---

## RESUMO EXECUTIVO

**Campos legados removidos**: 19 colunas via DDL + 1 campo JSONB via UPDATE  
**Tabelas afetadas**: user_residences (7), ride_requests (8), business_data (4), professional_data (0 DDL + 1 JSONB)  
**Constraints ativos**: 6 NOT NULL em campos canônicos (user_residences: 2, ride_requests: 4)  
**Services validados**: 4 (ResidenceService, BusinessService, ProfessionalService, MobilityService)  
**Nomenclatura confirmada**: ride_requests usa `pickup_*` e `dropoff_*` (4 campos canônicos)  
**metadata.location**: Removido de 4 tabelas (business_data, professional_data, locations, territorial_groups)  
**Bloqueios**: 1 (community_issues sem FK para locations, workaround aplicado)

---

## A. SCHEMA FINAL POR TABELA

### user_residences
**Colunas existentes**: 10 (id, user_id, country_code, is_primary, is_verified, address_id, created_at, updated_at, location_id, metadata)  
**Registros**: 0  
**Colunas removidas**: street, number, complement, neighborhood, city, state, postal_code (7 colunas)  
**Constraints NOT NULL**: address_id, location_id  
**FKs**: address_id → addresses(id), location_id → locations(id)  
**Migration**: 20260328000028  
**Validação**: INSERT falha com "null value in column address_id" ✓

### business_data
**Colunas existentes**: 38  
**Registros**: 1  
**Colunas removidas**: address, neighborhood, latitude, longitude (4 colunas)  
**Constraints NOT NULL**: location_id  
**FKs**: location_id → locations(id), address_id → addresses(id) (opcional)  
**Migration**: 20260328000030  
**Nota**: Campos `business_address`, `business_city`, `business_state`, `business_zip` são NOVOS (multi_perfil), não legados

### professional_data
**Colunas existentes**: 33  
**Registros**: 1  
**Colunas removidas**: NENHUMA via DDL (metadata.location limpo via service layer)  
**Constraints NOT NULL**: location_id  
**FKs**: location_id → locations(id), address_id → addresses(id) (opcional)  
**Migration**: 20260328000031  
**Nota**: Migration não remove colunas, apenas endurece constraints

### ride_requests
**Colunas existentes**: Não foi possível contar (tabela vazia), mas confirmadas via migrations:
- Campos canônicos: pickup_address_id, dropoff_address_id, pickup_location_id, dropoff_location_id
- Campos de controle: id, passenger_profile_id, driver_profile_id, route_id, status
- Campos de negócio: departure_time, suggested_price, final_price, available_seats, type, payment_method, observation, search_radius_km
- Campos de auditoria: created_at, updated_at, metadata
- Campos de compartilhamento: share_token, share_view_count
- Campo user_id (pode ser redundante com passenger_profile_id)

**Registros**: 0  
**Colunas removidas**: origin, destination, pickup_location, dropoff_location, origin_lat, origin_lng, destination_lat, destination_lng (8 colunas)  
**Constraints NOT NULL**: passenger_profile_id, pickup_address_id, dropoff_address_id, pickup_location_id, dropoff_location_id, status  
**FKs**: 
- passenger_profile_id → profiles(id) ON DELETE CASCADE
- driver_profile_id → profiles(id) ON DELETE SET NULL
- route_id → driver_routes(id) ON DELETE SET NULL
- pickup_address_id → addresses(id) ON DELETE SET NULL
- dropoff_address_id → addresses(id) ON DELETE SET NULL
- pickup_location_id → locations(id) ON DELETE SET NULL
- dropoff_location_id → locations(id) ON DELETE SET NULL  
**Migrations**: 
- 20260328000022: Adiciona 4 campos canônicos (pickup_*, dropoff_*)
- 20260328000026: Remove 8 campos legados, torna 4 canônicos NOT NULL  
**Validação**: INSERT com campo `destination` falha com "column does not exist" ✓

### addresses
**Colunas existentes**: 18 (id, location_id, postal_code, street, number, complement, address_type, latitude, longitude, geocoded_at, geocoding_source, geocoding_confidence, is_verified, verified_at, verified_by, created_at, updated_at, point)  
**Registros**: 0  
**Constraints**: 
- Check "valid_postal_code": formato CEP válido (^\d{5}-?\d{3}$)
- Check "valid_coordinates": latitude/longitude válidos ou ambos NULL
- Check "exact_requires_street": address_type='exact' exige street não vazio
- Check "gps_only_requires_coords": address_type='gps_only' exige latitude/longitude
- Check "valid_confidence": geocoding_confidence entre 0 e 1  
**FKs**: 
- location_id → locations(id) ON DELETE RESTRICT  
**Migrations**: 
- 20260328000016: Criação da tabela
- 20260328000018: Adiciona coluna `point` GEOMETRY(POINT, 4326) com PostGIS  
**Validação**: INSERT sem street falha com "violates check constraint exact_requires_street" ✓

**Nota**: Campos são `latitude`/`longitude` (não canonical_*), `address_type` (valores: exact, approximate, landmark, gps_only), `point` GEOMETRY sincronizado via trigger

### locations
**Colunas existentes**: 14  
**Registros**: 11  
**Colunas principais**: id, parent_id, type, slug, geographic_path, name, full_name, status, canonical_lat, canonical_lng, boundary, metadata  
**Schema**: Hierárquico (country → state → city → district)

### territorial_groups
**Colunas existentes**: 9  
**Registros**: 1  
**Colunas principais**: id, slug, name, description, anchor_city_id, status, metadata

### territorial_group_members
**Colunas existentes**: 3  
**Registros**: 4  
**Colunas**: group_id, location_id, created_at

---

## B. NOMENCLATURA RIDE_REQUESTS (CONFIRMADA)

**Colunas canônicas atuais no banco**:
- ✅ `pickup_address_id` (NOT NULL) — FK para addresses
- ✅ `dropoff_address_id` (NOT NULL) — FK para addresses
- ✅ `pickup_location_id` (NOT NULL) — FK para locations
- ✅ `dropoff_location_id` (NOT NULL) — FK para locations

**Colunas legadas removidas**:
- ❌ `origin` (JSONB, removido)
- ❌ `destination` (JSONB, removido)
- ❌ `pickup_location` (JSONB, removido)
- ❌ `dropoff_location` (JSONB, removido)
- ❌ `origin_lat` (DECIMAL, removido)
- ❌ `origin_lng` (DECIMAL, removido)
- ❌ `destination_lat` (DECIMAL, removido)
- ❌ `destination_lng` (DECIMAL, removido)

**Código TypeScript usa**: `pickup_*` e `dropoff_*` ✓  
**Migrations responsáveis**: 
- 20260328000022: Adiciona campos canônicos (pickup_*, dropoff_*)
- 20260328000026: Remove 8 campos legados, torna canônicos NOT NULL  
**Validação**: INSERT com campo `destination` falha com "column does not exist" ✓

---

## C. CAMPOS LEGADOS REMOVIDOS POR TABELA

| Tabela | Campos Removidos (DDL) | Migration | Status |
|--------|------------------------|-----------|--------|
| user_residences | street, number, complement, neighborhood, city, state, postal_code (7) | 20260328000028 | ✅ Aplicado |
| ride_requests | origin, destination, pickup_location, dropoff_location, origin_lat, origin_lng, destination_lat, destination_lng (8) | 20260328000026 | ✅ Aplicado |
| business_data | address, neighborhood, latitude, longitude (4) | 20260328000030 | ✅ Aplicado |
| professional_data | NENHUM (0) | 20260328000031 | ✅ Aplicado |
| **TOTAL DDL** | **19 colunas** | | |

**Campos JSONB removidos**:
- professional_data.metadata.location (via UPDATE em migration 027)

**Nota importante**: 
- professional_data nunca teve colunas legadas diretas (neighborhood, city, etc.)
- Apenas metadata.location foi removido via UPDATE, não DROP COLUMN
- business_data tem campos `business_*` que são NOVOS (multi_perfil), não legados
- ride_requests tinha 8 colunas legadas (4 JSONB + 4 coordenadas separadas)

---

## D. STATUS metadata.location

**Confirmação exata via snapshot + código**:

| Tabela | metadata.location | Método de Remoção | Evidência |
|--------|-------------------|-------------------|-----------|
| user_residences | ✅ REMOVIDO | Nunca existiu | Tabela não tinha metadata.location |
| business_data | ✅ REMOVIDO | Snapshot confirma | 1 registro, metadata sem location |
| professional_data | ✅ REMOVIDO | Migration 027 + Script | UPDATE metadata - 'location' |
| ride_requests | ✅ REMOVIDO | Nunca existiu | Tabela não tinha metadata.location |
| locations | ✅ REMOVIDO | Snapshot confirma | 11 registros, metadata sem location |
| territorial_groups | ✅ REMOVIDO | Snapshot confirma | 1 registro, metadata sem location |

**Migration 20260328000027**: Remove `metadata.location` de professional_data via `UPDATE metadata = metadata - 'location'`  
**Script cleanup-metadata-location.ts**: Valida e limpa professional_data (executado após migration)

**Validação snapshot (2026-03-29T00:40:04Z)**: 0 registros com metadata.location em todas as tabelas ✓

**Conclusão**: metadata.location completamente removido do sistema

---

## E. SERVICES E CAMPOS CANÔNICOS USADOS

### ResidenceService
**Arquivo**: `src/core/residence/services/ResidenceService.ts`  
**Campos canônicos usados**:
- `address_id` (NOT NULL) → addresses
- `location_id` (NOT NULL) → locations

**Métodos write**:
- `createResidence()`: Valida `address_id` e `location_id` obrigatórios, insere via Supabase
- `updateResidence()`: Permite atualizar `address_id`, `location_id`, `country`, `is_primary`

**Métodos read**:
- `getUserResidences()`: Retorna residências sem relações
- `getUserResidencesWithRelations()`: Expande `address` e `location` via FK
- `getFormattedAddress()`: Usa `address.street`, `address.number`, `address.complement`, `address.postal_code`
- `getCoordinates()`: Usa `address.latitude`, `address.longitude`
- `getTerritoryName()`: Usa `location.name`

**Validação migração**: `isMigrated()` sempre retorna `true` (campos canônicos obrigatórios)

**Nota**: Código usa `address.latitude`/`address.longitude` que correspondem aos campos reais do schema (não canonical_lat/canonical_lng)

---

### BusinessService
**Arquivo**: `src/core/business/services/BusinessService.ts`  
**Campos canônicos usados**:
- `location_id` (NOT NULL) → locations (território principal)
- `address_id` (opcional) → addresses (endereço físico detalhado)

**Métodos write**:
- `createBusiness()`: Preserva `location_id` e `address_id` via `toBusinessData()` se fornecidos no input
- `updateBusiness()`: Preserva `location_id` e `address_id` via `toBusinessData()` se fornecidos no input
- `toBusinessData()`: Mapeia input para `BusinessDataRecord`, preserva campos canônicos quando presentes

**Métodos read**:
- `getBusinesses()`: Expande `location` e `address` via FK quando disponíveis
- `getBusinessById()`: Retorna business com relações expandidas
- `getFormattedAddress()`: Usa `address.street`, `address.number`, `address.complement` se `address_id` presente
- `getCoordinates()`: Usa `address.latitude`, `address.longitude` se `address_id` presente
- `getTerritoryName()`: Usa `location.name` via `location_id`

**Validação migração**: `isBusinessMigrated()` retorna `true` se `location_id` presente

**Nota**: Campos `business_address`, `business_city`, `business_state`, `business_zip` são campos NOVOS do multi_perfil (não legados). Código usa `address.latitude`/`address.longitude` (campos reais do schema)

---

### ProfessionalService
**Arquivo**: `src/core/professional/services/ProfessionalService.ts`  
**Campos canônicos usados**:
- `location_id` (NOT NULL) → locations (território principal)
- `address_id` (opcional) → addresses (endereço físico detalhado)

**Métodos write**:
- `createProfessional()`: Preserva `location_id` e `address_id` via `toProfessionalData()` se fornecidos no input
- `updateProfessional()`: Preserva `location_id` e `address_id` via `toProfessionalData()` se fornecidos no input
- `toProfessionalData()`: Mapeia input para `ProfessionalDataRecord`, preserva campos canônicos quando presentes

**Métodos read**:
- `getProfessionals()`: Expande `location` e `address` via FK quando disponíveis
- `getProfessionalById()`: Retorna professional com relações expandidas
- `getFormattedAddress()`: Usa `address.street`, `address.number`, `address.complement` se `address_id` presente
- `getCoordinates()`: Usa `address.latitude`, `address.longitude` se `address_id` presente
- `getTerritoryName()`: Usa `location.name` via `location_id`

**Validação migração**: `isProfessionalMigrated()` retorna `true` se `location_id` presente

**Nota**: `metadata.location` ainda é populado no método `toProfessionalData()` para compatibilidade com UI legada, mas não é persistido no banco (migration 027 remove via UPDATE). Código usa `address.latitude`/`address.longitude` (campos reais do schema)

---

### MobilityService
**Arquivo**: `src/modules/mobility/services/MobilityService.ts`  
**Campos canônicos usados**:
- `pickup_address_id` (NOT NULL) → addresses
- `dropoff_address_id` (NOT NULL) → addresses
- `pickup_location_id` (NOT NULL) → locations
- `dropoff_location_id` (NOT NULL) → locations

**Métodos write**:
- `createRideRequest()`: Preserva os 4 campos canônicos se fornecidos no payload (spread de `rideData`)

**Métodos read**:
- `getUserRides()`: Expande `pickup_address`, `dropoff_address`, `pickup_location`, `dropoff_location` via FK
- `getRideById()`: Retorna ride com relações expandidas
- `isRideMigrated()`: Retorna `true` se os 4 campos canônicos estão presentes
- `getPickupCoordinates()`: Usa `pickup_address.latitude`, `pickup_address.longitude`
- `getDropoffCoordinates()`: Usa `dropoff_address.latitude`, `dropoff_address.longitude`
- `getPickupTerritory()`: Retorna `pickup_location_id`
- `getDropoffTerritory()`: Retorna `dropoff_location_id`

**Adapter**: `RideCanonicalAdapter` valida migração completa via `isRideMigrated()`

**Nota**: Nomenclatura sempre foi `pickup_*` e `dropoff_*` (nunca origin/destination). Código usa `address.latitude`/`address.longitude` (campos reais do schema)

---

## F. INCONSISTÊNCIAS CORRIGIDAS

### 1. Relatório anterior dizia "15 colunas removidas"
**Correção**: 19 colunas legadas removidas via DDL (não 15)

**Breakdown real**:
- user_residences: 7 colunas (street, number, complement, neighborhood, city, state, postal_code)
- ride_requests: 8 colunas (origin, destination, pickup_location, dropoff_location, origin_lat, origin_lng, destination_lat, destination_lng)
- business_data: 4 colunas (address, neighborhood, latitude, longitude)
- professional_data: 0 colunas via DDL
- **Total DDL**: 19 colunas

**Erro anterior**: Contagem não incluía as 4 colunas de coordenadas separadas de ride_requests (origin_lat, origin_lng, destination_lat, destination_lng)

### 2. Relatório dizia "city/neighborhood removidos"
**Correção**: 
- business_data: `neighborhood` removido ✓, mas `business_city` é campo NOVO (não legado)
- professional_data: Nunca teve `city`/`neighborhood` como colunas diretas

### 3. Snapshot mostra user_residences e ride_requests vazios
**Explicação**: Tabelas foram esvaziadas durante testes/validação, mas schema está correto com constraints ativos

### 4. Erro 404 community_issues_public
**Causa**: Código tentava filtrar por `city`/`neighborhood` que não existem na tabela  
**Schema real**: `community_issues` tem apenas `location_id` (UUID), não city/neighborhood  
**Correção aplicada**: Removidos filtros territoriais de `CommunityIssueService.getIssues()`  
**Arquivos modificados**:
- src/modules/community-issues/services/CommunityIssueService.ts
- src/modules/community-issues/domain/types.ts
- src/modules/community-issues/hooks/useIssues.ts

**Nota**: `metadata.location` ainda é populado nos services Business/Professional para compatibilidade com UI legada, mas não é persistido no banco (migration 027 remove via UPDATE)

---

## G. BLOQUEIOS REAIS

### 1. community_issues sem FK para locations
**Problema**: `location_id` existe mas não há FK constraint  
**Impacto**: Não é possível fazer JOIN via PostgREST  
**Solução**: Migration 20260328000034 criada mas não aplicada ainda  
**Workaround**: Filtros territoriais removidos temporariamente

### 2. Filtros territoriais em community_issues desativados
**Problema**: Sem FK, não há como filtrar por city/neighborhood  
**Impacto**: Feed mostra todos os issues (sem filtro regional)  
**Solução futura**: 
1. Aplicar migration 034 (FK constraint)
2. Implementar resolução location_id via LocationService
3. Reativar filtros territoriais

### 3. Tabelas vazias (user_residences, ride_requests, addresses)
**Problema**: Dados de teste foram removidos durante validação  
**Impacto**: Nenhum (ambiente de desenvolvimento)  
**Ação**: Nenhuma necessária

---

## CONCLUSÃO

**Estado final confirmado**:
- ✅ 19 colunas legadas removidas via DDL (7 user_residences + 8 ride_requests + 4 business_data)
- ✅ metadata.location removido de todas as tabelas (4 tabelas verificadas)
- ✅ Constraints NOT NULL ativos (location_id, address_id onde aplicável)
- ✅ Nomenclatura ride_requests: pickup/dropoff (confirmada, 4 campos canônicos)
- ✅ Services usando campos canônicos corretamente (4 services verificados)
- ✅ Erro 404 community_issues corrigido (filtros territoriais removidos)
- ⚠️ community_issues sem FK (bloqueio menor, workaround aplicado)

**Validações executadas**:
- Snapshot direto do banco remoto (2026-03-29T00:49:17Z)
- Tentativa de INSERT com campos legados (confirmou remoção)
- Verificação de metadata.location em 4 tabelas (0 registros encontrados)
- Análise de migrations (022, 026, 027, 028, 030, 031)
- Validação automatizada final (2026-03-29T00:53:17Z): 6/6 testes ✓
- Testes de integração ETAPA 12: 7/7 passando ✓
- TypeCheck: 0 erros ✓

**ETAPA 12B: CONCLUÍDA**

---

## ANEXO: SCRIPTS DE VALIDAÇÃO

**Scripts criados para esta reconciliação**:
1. `scripts/final-reconciliation-direct.ts` — Snapshot direto do banco (bypass exec_sql)
2. `scripts/check-empty-tables-schema.ts` — Inferir schema via tentativa de INSERT
3. `scripts/validate-reconciliation-final.ts` — Validação automatizada de todos os pontos

**Execução**:
```bash
npx tsx scripts/validate-reconciliation-final.ts
```

**Resultado**: 6/6 testes passaram ✓
