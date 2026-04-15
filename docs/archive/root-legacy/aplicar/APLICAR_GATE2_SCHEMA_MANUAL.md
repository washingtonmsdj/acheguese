# APLICAR GATE 2 SCHEMA - INSTRUÇÕES MANUAIS

**Data:** 07/04/2026

---

## PASSO 1: Abrir SQL Editor no Supabase

1. Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Clique em "New query"

---

## PASSO 2: Copiar e Executar Migration

Copie o conteúdo do arquivo:
```
supabase/migrations/20260407000001_fix_driver_locations_schema.sql
```

E execute no SQL Editor.

---

## PASSO 3: Validar Execução

Execute as seguintes queries para validar:

### 3.1 Verificar colunas de driver_locations:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'driver_locations'
ORDER BY ordinal_position;
```

**Esperado:**
- id
- driver_profile_id
- latitude (antes era lat)
- longitude (antes era lng)
- accuracy (NOVO)
- heading (NOVO)
- speed (NOVO)
- altitude (NOVO)
- updated_at

### 3.2 Verificar tabela location_tracking:

```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'location_tracking';
```

**Esperado:** 1 linha retornada

### 3.3 Verificar trigger:

```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'driver_locations';
```

**Esperado:** trigger_insert_location_history

### 3.4 Testar inserção:

```sql
-- Inserir localização de teste
INSERT INTO driver_locations (
  driver_profile_id,
  latitude,
  longitude,
  accuracy,
  heading,
  speed,
  altitude
) VALUES (
  (SELECT id FROM profiles LIMIT 1),  -- Pega qualquer profile
  -12.975,
  -38.476,
  10.5,
  45.0,
  60.0,
  100.0
)
ON CONFLICT (driver_profile_id) 
DO UPDATE SET
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  accuracy = EXCLUDED.accuracy,
  heading = EXCLUDED.heading,
  speed = EXCLUDED.speed,
  altitude = EXCLUDED.altitude,
  updated_at = NOW();

-- Verificar se foi para o histórico
SELECT COUNT(*) as history_count 
FROM location_tracking;
```

**Esperado:** history_count > 0

---

## PASSO 4: Confirmar Sucesso

Se todas as validações passarem:

✅ Schema corrigido  
✅ Tabela de histórico criada  
✅ Trigger funcionando  
✅ Dados persistindo corretamente

---

## PRÓXIMOS PASSOS

Após aplicar a migration:

1. Atualizar código do TrackingService (se necessário)
2. Criar teste E2E
3. Validar pipeline completo
4. Medir latência

---

## ROLLBACK (SE NECESSÁRIO)

Se algo der errado, execute:

```sql
-- Remover trigger
DROP TRIGGER IF EXISTS trigger_insert_location_history ON driver_locations;
DROP FUNCTION IF EXISTS insert_location_history();

-- Remover tabela de histórico
DROP TABLE IF EXISTS location_tracking;

-- Reverter colunas (CUIDADO: perde dados)
ALTER TABLE driver_locations DROP COLUMN IF EXISTS accuracy;
ALTER TABLE driver_locations DROP COLUMN IF EXISTS heading;
ALTER TABLE driver_locations DROP COLUMN IF EXISTS speed;
ALTER TABLE driver_locations DROP COLUMN IF EXISTS altitude;
ALTER TABLE driver_locations RENAME COLUMN latitude TO lat;
ALTER TABLE driver_locations RENAME COLUMN longitude TO lng;
```

---

**⚠️ IMPORTANTE:** Faça backup antes de aplicar em produção!
