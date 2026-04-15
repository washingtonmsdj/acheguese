# GATE 2: APLICAÇÃO MANUAL NECESSÁRIA

**Data:** 07/04/2026

---

## SITUAÇÃO

A migration do Gate 2 está pronta mas precisa ser aplicada manualmente via SQL Editor do Supabase, pois não temos função `exec_sql` disponível via API.

---

## INSTRUÇÕES DE APLICAÇÃO

### 1. Abrir SQL Editor

Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

### 2. Executar Migration

Copie e cole o conteúdo completo de:
```
supabase/migrations/20260407000002_gate2_driver_locations_minimal.sql
```

### 3. Validar Colunas

Execute:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'driver_locations'
ORDER BY ordinal_position;
```

**Esperado:**
- id
- driver_profile_id
- lat
- lng
- updated_at
- accuracy (NOVO)
- heading (NOVO)
- speed (NOVO)
- altitude (NOVO)

### 4. Testar Inserção

Execute:
```sql
INSERT INTO driver_locations (
  driver_profile_id,
  lat,
  lng,
  accuracy,
  heading,
  speed,
  altitude
) VALUES (
  (SELECT id FROM profiles LIMIT 1),
  -12.975,
  -38.476,
  10.5,
  45.0,
  60.0,
  100.0
)
ON CONFLICT (driver_profile_id) 
DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  accuracy = EXCLUDED.accuracy,
  heading = EXCLUDED.heading,
  speed = EXCLUDED.speed,
  altitude = EXCLUDED.altitude,
  updated_at = NOW()
RETURNING *;
```

**Esperado:** Linha retornada com todos os valores

---

## APÓS APLICAR

Confirme aqui que aplicou e posso prosseguir com o teste E2E.
