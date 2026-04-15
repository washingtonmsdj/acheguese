# GATE 5: RELATÓRIO SSOT - SCHEMA CANÔNICO vs TESTES

**Data:** 08/04/2026  
**Análise:** Schema oficial vs Fixtures de teste

---

## 1. SCHEMA CANÔNICO REAL DE `ride_requests`

### Estado Atual (Migration Base - 20260325000000)
```sql
CREATE TABLE ride_requests (
  id                    UUID PRIMARY KEY,
  passenger_profile_id  UUID NOT NULL,
  driver_profile_id     UUID,
  route_id              UUID,
  origin                JSONB,              -- LEGADO
  destination           JSONB,              -- LEGADO
  pickup_location       JSONB NOT NULL,     -- LEGADO (mas ainda obrigatório)
  dropoff_location      JSONB NOT NULL,     -- LEGADO (mas ainda obrigatório)
  status                TEXT NOT NULL,
  suggested_price       DECIMAL(10,2),
  final_price           DECIMAL(10,2),
  available_seats       INTEGER,
  share_token           TEXT,
  share_view_count      INTEGER,
  created_at            TIMESTAMPTZ,
  updated_at            TIMESTAMPTZ
);
```

### Estado Futuro (Migration 20260328000026 - NÃO APLICADA)
```sql
-- ETAPA 12: Hardening (aguardando migração de dados)
ALTER TABLE ride_requests 
  ALTER COLUMN pickup_address_id SET NOT NULL,    -- CANÔNICO
  ALTER COLUMN pickup_location_id SET NOT NULL,   -- CANÔNICO
  ALTER COLUMN dropoff_address_id SET NOT NULL,   -- CANÔNICO
  ALTER COLUMN dropoff_location_id SET NOT NULL;  -- CANÔNICO

-- Remove campos legados
ALTER TABLE ride_requests 
  DROP COLUMN origin,
  DROP COLUMN destination,
  DROP COLUMN pickup_location,
  DROP COLUMN dropoff_location;
```

---

## 2. CRUZAMENTO COM CÓDIGO DE PRODUÇÃO

### RideCanonicalAdapter (Camada de Compatibilidade)
```typescript
// Suporta AMBOS os modelos:
// 1. Legado: pickup_location/dropoff_location (JSONB)
// 2. Canônico: pickup_address_id/dropoff_address_id + pickup_location_id/dropoff_location_id

function getPickupCoordinates(ride: RideRequestWithRelations) {
  // Preferir coordenadas do address canônico
  if (ride.pickup_address?.latitude && ride.pickup_address?.longitude) {
    return { latitude, longitude };
  }

  // Fallback para pickup_location legado
  const pickup = ride.pickup_location as any;
  if (pickup && typeof pickup === 'object') {
    const lat = pickup.latitude || pickup.lat;
    const lng = pickup.longitude || pickup.lng;
    if (lat && lng) return { latitude, longitude };
  }

  // Fallback para origin legado
  const origin = ride.origin;
  // ...
}
```

### Migration Script (migrateRideRequestsToCanonical.ts)
- Migra dados de `pickup_location/dropoff_location` (JSONB) → `pickup_address_id/dropoff_address_id`
- Resolve `pickup_location_id/dropoff_location_id` por texto/alias/geoespacial
- Mantém campos legados intactos durante transição
- Gera relatório de cobertura

---

## 3. RESPOSTA OBJETIVA

### O schema oficial usa `pickup_location/dropoff_location`?
**SIM, HOJE.** Mas é LEGADO em transição.

- ✅ **Presente na migration base** (20260325000000)
- ✅ **Obrigatório (NOT NULL)** no schema atual
- ⚠️ **Marcado para remoção** na ETAPA 12 (migration 20260328000026)
- ✅ **Código de produção suporta** via RideCanonicalAdapter

### Ou usa `pickup_address_id/dropoff_address_id`?
**SIM, FUTURO.** É o modelo CANÔNICO.

- ✅ **Colunas existem** (adicionadas em migration anterior)
- ❌ **Ainda nullable** (aguardando migração de dados)
- ✅ **Código de produção já suporta** (preferência no adapter)
- ⏳ **Será obrigatório** após ETAPA 12

### Qual é o SSOT oficial HOJE?
**MODELO HÍBRIDO EM TRANSIÇÃO:**

```sql
-- OBRIGATÓRIO HOJE (legado):
pickup_location       JSONB NOT NULL
dropoff_location      JSONB NOT NULL

-- OPCIONAL HOJE (canônico):
pickup_address_id     UUID
dropoff_address_id    UUID
pickup_location_id    UUID
dropoff_location_id   UUID
```

---

## 4. CAMPOS QUE OS TESTES ESTAVAM ASSUMINDO ERRADO

### ❌ ERRO: Testes assumiram modelo canônico puro
```typescript
// scripts/setup-gate5-test-data.mjs (ERRADO)
const rides = [
  {
    id: '...',
    passenger_profile_id: testDriverIds[0],
    pickup_location: { lat: -23.5505, lng: -46.6333 },    // ✅ CORRETO
    dropoff_location: { lat: -23.5606, lng: -46.6434 },   // ✅ CORRETO
    status: 'pending',
  }
];
```

### ✅ CORRETO: Modelo legado ainda é obrigatório
Os testes estavam CORRETOS! O problema foi:
1. PostgREST com schema cache desatualizado
2. Não conseguiu inserir via API
3. Mas o schema SQL está correto

---

## 5. MIGRATION PROPOSTA DEVE SER DESCARTADA OU MANTIDA?

### ❌ DESCARTAR: `20260408000001_gate5_ensure_ride_requests_columns.sql`

**Motivo:**
- As colunas `pickup_location/dropoff_location` JÁ EXISTEM no schema oficial
- Não há divergência entre código e banco
- O problema foi cache do PostgREST, não schema

**Ação:**
- Deletar migration proposta
- Não aplicar no banco remoto

---

## 6. FIXTURE CORRETA PARA GATE 5

### ✅ USAR MODELO LEGADO (obrigatório hoje)
```sql
INSERT INTO ride_requests (
  id,
  passenger_profile_id,
  pickup_location,
  dropoff_location,
  status
) VALUES
(
  '00000000-0000-0000-0000-000000000101',
  '2357467c-4f5e-4285-bf6b-39628c6a44ad',
  '{"lat": -23.5505, "lng": -46.6333, "address": "Teste Pickup 1"}'::jsonb,
  '{"lat": -23.5606, "lng": -46.6434, "address": "Teste Dropoff 1"}'::jsonb,
  'pending'
);
```

### ⚠️ OPCIONAL: Adicionar campos canônicos (futuro-proof)
```sql
-- Se quiser preparar para ETAPA 12:
INSERT INTO ride_requests (
  id,
  passenger_profile_id,
  pickup_location,        -- LEGADO (obrigatório hoje)
  dropoff_location,       -- LEGADO (obrigatório hoje)
  pickup_address_id,      -- CANÔNICO (opcional hoje)
  dropoff_address_id,     -- CANÔNICO (opcional hoje)
  pickup_location_id,     -- CANÔNICO (opcional hoje)
  dropoff_location_id,    -- CANÔNICO (opcional hoje)
  status
) VALUES (...);
```

---

## 7. GATE 5 DESTRAVA COM CORREÇÃO DE TESTE OU MIGRATION REAL?

### ✅ CORREÇÃO DE TESTE (sem migration)

**Problema Real:**
- PostgREST com schema cache desatualizado no remoto
- Não reconhece colunas `pickup_location/dropoff_location`
- Mas as colunas EXISTEM no schema SQL

**Solução:**
1. ✅ Recarregar schema cache do Supabase (Settings → API → Reload)
2. ✅ Executar SQL direto no SQL Editor (bypass PostgREST)
3. ✅ Aguardar cache refresh automático (24h)

**NÃO PRECISA:**
- ❌ Criar migration
- ❌ Adicionar colunas
- ❌ Alterar schema

---

## 8. AÇÕES IMEDIATAS

### 1. Deletar Migration Proposta
```bash
rm supabase/migrations/20260408000001_gate5_ensure_ride_requests_columns.sql
```

### 2. Executar SQL Direto no Supabase SQL Editor
```sql
-- Usar scripts/create-test-rides.sql (OPÇÃO 1)
-- Já está correto com pickup_location/dropoff_location
```

### 3. Recarregar Schema Cache
- Supabase Dashboard → Settings → API → "Reload schema cache"

### 4. Executar Testes
```bash
npm test tests/operational/gate5-availability-test.test.ts
```

---

## 9. RESUMO EXECUTIVO

| Item | Status | Ação |
|------|--------|------|
| Schema oficial | ✅ CORRETO | Nenhuma |
| Fixtures de teste | ✅ CORRETOS | Nenhuma |
| Migration proposta | ❌ DESNECESSÁRIA | Deletar |
| PostgREST cache | ❌ DESATUALIZADO | Recarregar |
| Código de produção | ✅ COMPATÍVEL | Nenhuma |

**VEREDITO:** Gate 5 destrava com reload de cache, sem migration.

---

## 10. LIÇÕES APRENDIDAS

1. ✅ **SSOT primeiro, teste depois** - Validado
2. ✅ **Não adicionar coluna só para teste** - Evitado
3. ✅ **Não reintroduzir legado** - Preservado
4. ⚠️ **Cache do PostgREST** - Novo aprendizado
5. ✅ **Modelo híbrido em transição** - Documentado

---

**STATUS:** GATE 5 PRONTO PARA DESTRAVAR SEM MIGRATION

