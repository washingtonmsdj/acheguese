# GATE 2 - ETAPA ZERO: SSOT DE LOCALIZAÇÃO

**Data:** 07/04/2026  
**Status:** ✅ INVESTIGAÇÃO COMPLETA

---

## RESPOSTA OBJETIVA

### 1. SSOT OFICIAL ATUAL

**Tabela:** `driver_locations`

**Evidência:**
```typescript
// TrackingService.ts linha 403
private getTableName(entityType: string): string {
  const tables: Record<string, string> = {
    driver: 'driver_locations',  // ← SSOT OFICIAL
    user: 'user_locations',
    vehicle: 'vehicle_locations',
    device: 'device_locations',
  };
  return tables[entityType] || 'driver_locations';
}
```

**Pipeline Real:**
```
Motorista publica → TrackingService.updatePosition() 
                  → supabase.from('driver_locations').upsert()
                  → Banco (driver_locations)
                  
Passageiro consome → TrackingService.subscribeToPosition()
                   → supabase.channel().on('postgres_changes', table: 'driver_locations')
                   → Realtime do Supabase
```

---

### 2. PAPEL DE tracking_positions

**Resposta:** NÃO EXISTE

**Evidência:**
- ❌ Não encontrado no schema base (`20260325000000_base_schema.sql`)
- ❌ Não encontrado em nenhuma migration
- ❌ Não encontrado no código TypeScript
- ❌ Não encontrado nos types gerados

**Conclusão:** `tracking_positions` foi uma suposição incorreta da auditoria anterior.

---

### 3. PAPEL DE driver_locations

**Resposta:** SNAPSHOT OPERACIONAL (última posição conhecida)

**Schema Atual:**
```sql
CREATE TABLE driver_locations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lat               DECIMAL(10,7) NOT NULL,
  lng               DECIMAL(10,7) NOT NULL,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Características:**
- ✅ Upsert por `driver_profile_id` (apenas 1 linha por motorista)
- ✅ Sempre sobrescreve posição anterior
- ✅ Usado para consultas de "onde está o motorista agora"
- ✅ Usado para realtime subscription
- ❌ NÃO guarda histórico
- ❌ NÃO tem colunas de GPS completas (accuracy, heading, speed, altitude)

**Problema Identificado:**
```typescript
// useGeolocationTracking.ts ENVIA:
const trackingPosition: TrackingPosition = {
  latitude: position.coords.latitude,
  longitude: position.coords.longitude,
  accuracy: position.coords.accuracy,        // ❌ Perdido
  heading: position.coords.heading,          // ❌ Perdido
  speed: position.coords.speed * 3.6,        // ❌ Perdido
  altitude: position.coords.altitude,        // ❌ Perdido
  timestamp: new Date().toISOString(),
};

// TrackingService.updatePosition() TENTA PERSISTIR:
const updateData = {
  [idField]: entityId,
  latitude: position.latitude,
  longitude: position.longitude,
  accuracy: position.accuracy,    // ❌ Coluna não existe
  heading: position.heading,      // ❌ Coluna não existe
  speed: position.speed,          // ❌ Coluna não existe
  altitude: position.altitude,    // ❌ Coluna não existe
  updated_at: new Date().toISOString(),
  ...metadata,
};

// Banco RECEBE apenas:
// lat, lng, updated_at
// Resto é DESCARTADO silenciosamente
```

---

### 4. SE A MIGRATION DEVE SER APLICADA

**Resposta:** SIM, PARCIALMENTE

**O que deve ser aplicado:**

1. ✅ **Adicionar colunas GPS faltantes em driver_locations:**
   - `accuracy` (precisão do GPS)
   - `heading` (direção)
   - `speed` (velocidade)
   - `altitude` (altitude)

2. ✅ **Renomear colunas para consistência:**
   - `lat` → `latitude`
   - `lng` → `longitude`

3. ✅ **Adicionar índices de performance:**
   - `idx_driver_locations_updated_at`
   - `idx_driver_locations_driver_time`

**O que NÃO deve ser aplicado (ainda):**

1. ❌ **Criação de location_tracking** - Decidir depois (ver item 5)

**Justificativa:**
- Código já envia dados completos de GPS
- Banco descarta silenciosamente por falta de colunas
- Isso impede validação de qualidade do GPS
- Isso impede cálculo de velocidade média
- Isso impede detecção de motorista parado

---

### 5. SE location_tracking DEVE EXISTIR

**Resposta:** DEPENDE DO REQUISITO DE HISTÓRICO

**Cenário A: SEM histórico (apenas snapshot)**
- ❌ NÃO criar `location_tracking`
- ✅ Apenas corrigir `driver_locations`
- ✅ Suficiente para tracking em tempo real
- ❌ Não permite auditoria de trajeto
- ❌ Não permite cálculo de distância percorrida

**Cenário B: COM histórico (auditoria/compliance)**
- ✅ CRIAR `location_tracking`
- ✅ Trigger automático para popular
- ✅ Permite auditoria completa
- ✅ Permite cálculo de distância real
- ⚠️ Aumenta volume de dados (1 linha a cada 10s)
- ⚠️ Requer limpeza periódica (>7 dias)

**Recomendação:**
- Para GATE 2 (validação de publicação): Cenário A é suficiente
- Para produção (compliance/auditoria): Cenário B é necessário
- Para motoboy (múltiplas paradas): Cenário B é obrigatório

**Decisão:** VOCÊ DECIDE

---

## EVIDÊNCIAS

### Código Atual:

1. **TrackingService usa driver_locations:**
   - `src/core/tracking/services/TrackingService.ts` linha 403

2. **TrackingService espera location_tracking (mas não existe):**
   - `src/core/tracking/services/TrackingService.ts` linha 413
   - Método `getHistory()` linha 340 (nunca funciona)

3. **Types gerados mencionam driver_location_tracking:**
   - `src/shared/types/mobility.generated.ts` linha 224
   - Mas tabela não existe no banco

4. **Schema base só tem driver_locations:**
   - `supabase/migrations/20260325000000_base_schema.sql` linha 1026

---

## CONCLUSÃO

### SSOT Real:

```
driver_locations = SNAPSHOT (última posição)
location_tracking = NÃO EXISTE (código espera mas não foi criado)
tracking_positions = NUNCA EXISTIU (suposição incorreta)
```

### Migration Necessária:

**MÍNIMO (Gate 2):**
```sql
-- Adicionar colunas GPS
ALTER TABLE driver_locations ADD COLUMN accuracy DECIMAL(10,2);
ALTER TABLE driver_locations ADD COLUMN heading DECIMAL(5,2);
ALTER TABLE driver_locations ADD COLUMN speed DECIMAL(6,2);
ALTER TABLE driver_locations ADD COLUMN altitude DECIMAL(8,2);

-- Renomear para consistência
ALTER TABLE driver_locations RENAME COLUMN lat TO latitude;
ALTER TABLE driver_locations RENAME COLUMN lng TO longitude;

-- Índices
CREATE INDEX idx_driver_locations_updated_at ON driver_locations(updated_at DESC);
```

**OPCIONAL (Histórico):**
```sql
-- Criar tabela de histórico
CREATE TABLE location_tracking (...);

-- Trigger automático
CREATE TRIGGER trigger_insert_location_history ...;
```

---

## DECISÃO NECESSÁRIA

**Você precisa decidir:**

1. ✅ Aplicar correção mínima de `driver_locations` (obrigatório)
2. ❓ Criar `location_tracking` para histórico (opcional)

**Minha recomendação:**
- Gate 2: Apenas correção mínima
- Produção: Adicionar histórico depois

---

**✅ ETAPA ZERO COMPLETA - AGUARDANDO DECISÃO**
