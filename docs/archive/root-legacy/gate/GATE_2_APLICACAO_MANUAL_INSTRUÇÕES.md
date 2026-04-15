# GATE 2: INSTRUÇÕES DE APLICAÇÃO MANUAL

**Data:** 07/04/2026  
**Status:** ⏳ AGUARDANDO APLICAÇÃO MANUAL

---

## ❌ BLOQUEIO TÉCNICO

Não tenho acesso programático ao SQL Editor do Supabase.

**Motivo:** A função `exec_sql()` não existe no banco de dados e a API REST do Supabase não permite execução direta de DDL (ALTER TABLE, CREATE INDEX).

**Solução:** Aplicação manual via dashboard web do Supabase.

---

## 📋 PASSO A PASSO

### 1️⃣ Acesse o SQL Editor

URL: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql

### 2️⃣ Clique em "New query"

### 3️⃣ Cole o SQL abaixo

```sql
-- Migration: GATE 2 - Correção Mínima de driver_locations
-- Date: 2026-04-07
-- Purpose: Adicionar colunas GPS faltantes e índices de performance

-- ============================================
-- 1. ADICIONAR COLUNAS GPS FALTANTES
-- ============================================

-- Adicionar accuracy (precisão do GPS em metros)
ALTER TABLE driver_locations 
ADD COLUMN IF NOT EXISTS accuracy DECIMAL(10,2);

-- Adicionar heading (direção do movimento em graus, 0-360)
ALTER TABLE driver_locations 
ADD COLUMN IF NOT EXISTS heading DECIMAL(5,2);

-- Adicionar speed (velocidade em km/h)
ALTER TABLE driver_locations 
ADD COLUMN IF NOT EXISTS speed DECIMAL(6,2);

-- Adicionar altitude (altitude em metros)
ALTER TABLE driver_locations 
ADD COLUMN IF NOT EXISTS altitude DECIMAL(8,2);

-- Comentários
COMMENT ON COLUMN driver_locations.accuracy IS 'GPS accuracy in meters';
COMMENT ON COLUMN driver_locations.heading IS 'Direction of movement in degrees (0-360)';
COMMENT ON COLUMN driver_locations.speed IS 'Speed in km/h';
COMMENT ON COLUMN driver_locations.altitude IS 'Altitude in meters';

-- ============================================
-- 2. ADICIONAR ÍNDICES DE PERFORMANCE
-- ============================================

-- Índice para queries por updated_at (ordenação temporal)
CREATE INDEX IF NOT EXISTS idx_driver_locations_updated_at 
  ON driver_locations(updated_at DESC);

-- Índice composto para queries de motorista + tempo
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_time 
  ON driver_locations(driver_profile_id, updated_at DESC);

-- ============================================
-- 3. VALIDAÇÃO
-- ============================================

DO $$
BEGIN
  -- Verificar se colunas foram criadas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_locations' 
    AND column_name = 'accuracy'
  ) THEN
    RAISE EXCEPTION 'Column accuracy not created';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_locations' 
    AND column_name = 'heading'
  ) THEN
    RAISE EXCEPTION 'Column heading not created';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_locations' 
    AND column_name = 'speed'
  ) THEN
    RAISE EXCEPTION 'Column speed not created';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_locations' 
    AND column_name = 'altitude'
  ) THEN
    RAISE EXCEPTION 'Column altitude not created';
  END IF;
  
  RAISE NOTICE 'GATE 2 Migration: All columns created successfully';
END $$;
```

### 4️⃣ Clique em "Run" ou pressione Ctrl+Enter

### 5️⃣ Valide o resultado

Você deve ver a mensagem:
```
NOTICE: GATE 2 Migration: All columns created successfully
```

### 6️⃣ Confirme as colunas

Execute esta query para ver todas as colunas:

```sql
SELECT column_name, data_type, is_nullable
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
- accuracy ✨ NOVO
- heading ✨ NOVO
- speed ✨ NOVO
- altitude ✨ NOVO

### 7️⃣ Teste inserção

```sql
-- Inserir localização completa de teste
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
  updated_at = NOW();

-- Verificar dados
SELECT * FROM driver_locations LIMIT 1;
```

---

## ✅ APÓS APLICAR

Execute no terminal:

```bash
npm run apply:gate2
```

O script vai confirmar que as colunas foram criadas.

Depois execute o teste E2E:

```bash
npm run test tests/e2e/gate2-tracking-pipeline.test.ts
```

---

## 📄 ARQUIVO DA MIGRATION

Localização: `supabase/migrations/20260407000002_gate2_driver_locations_minimal.sql`

Você pode copiar diretamente deste arquivo se preferir.

---

## 🎯 O QUE ESTA MIGRATION FAZ

### Colunas Adicionadas:

1. **accuracy** (DECIMAL 10,2)
   - Precisão do GPS em metros
   - Exemplo: 10.5 = GPS com precisão de 10.5 metros

2. **heading** (DECIMAL 5,2)
   - Direção do movimento em graus (0-360)
   - Exemplo: 45.0 = Nordeste, 180.0 = Sul

3. **speed** (DECIMAL 6,2)
   - Velocidade em km/h
   - Exemplo: 60.0 = 60 km/h

4. **altitude** (DECIMAL 8,2)
   - Altitude em metros
   - Exemplo: 100.0 = 100 metros acima do nível do mar

### Índices Criados:

1. **idx_driver_locations_updated_at**
   - Otimiza queries por tempo (última atualização)

2. **idx_driver_locations_driver_time**
   - Otimiza queries de motorista + tempo
   - Usado para buscar histórico de um motorista específico

---

## ⚠️ IMPORTANTE

- Esta migration é **idempotente** (pode ser executada múltiplas vezes sem erro)
- Usa `IF NOT EXISTS` para evitar erros se colunas já existirem
- Não altera dados existentes
- Não renomeia `lat/lng` (decisão aprovada)
- Não cria tabela de histórico (será feito em fase futura)

---

## 🚀 PRÓXIMOS PASSOS APÓS APLICAR

1. ✅ Confirmar colunas criadas: `npm run apply:gate2`
2. ✅ Executar teste E2E: `npm run test tests/e2e/gate2-tracking-pipeline.test.ts`
3. ✅ Validar persistência de dados completos
4. ✅ Medir latência do pipeline (requisito: <5s)
5. ✅ Testar falha de GPS e reconexão
6. ✅ Fechar Gate 2 baseado em evidência operacional

---

**⏳ AGUARDANDO SUA APLICAÇÃO MANUAL**

