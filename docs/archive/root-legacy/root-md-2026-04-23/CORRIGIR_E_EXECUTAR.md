# 🔧 CORRIGIR E EXECUTAR - Guia Rápido

## 🚨 Problema Detectado

```
ERROR: column "address" of relation "business_data" does not exist
```

**Causa**: Migrations não foram executadas completamente.

---

## ✅ SOLUÇÃO EM 3 PASSOS (5 minutos)

### 📍 PASSO 1: Corrigir Colunas Faltantes

**Abra**: https://supabase.com/dashboard  
**Vá para**: SQL Editor → New Query

**Cole e Execute**:
```sql
-- Adicionar colunas faltantes
ALTER TABLE business_data ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE business_data ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,7);
ALTER TABLE business_data ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,7);
ALTER TABLE business_data ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_business_data_location_id 
  ON business_data(location_id) 
  WHERE location_id IS NOT NULL;
```

**Clique**: Run (Ctrl+Enter)

---

### ✅ PASSO 2: Verificar

**Cole e Execute**:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'business_data' 
  AND column_name IN ('address', 'latitude', 'longitude', 'location_id')
ORDER BY column_name;
```

**Deve retornar 4 linhas**:
```
address
latitude
location_id
longitude
```

---

### 🚀 PASSO 3: Executar o Seed

**New Query** (nova aba)

1. Abra: `supabase/seed_gastronomy_mock.sql`
2. Copie TODO (Ctrl+A, Ctrl+C)
3. Cole no editor (Ctrl+V)
4. Execute (Ctrl+Enter)
5. Aguarde ~30 segundos

**Deve ver**:
```
INSERT 0 5  (business_data)
INSERT 0 5  (gastronomy_profiles)
INSERT 0 5  (menus)
...
```

---

### 🎯 PASSO 4: Validar

**New Query** (nova aba)

```sql
SELECT 
  business_name,
  address,
  rating,
  (SELECT COUNT(*) FROM menus WHERE business_id = bd.id) as menus
FROM business_data bd
WHERE bd.id = '22222222-2222-2222-2222-222222222222';
```

**Deve retornar**:
```
business_name          | address                  | rating | menus
-----------------------|--------------------------|--------|-------
Pizzaria Bella Napoli  | Av. Tancredo Neves, 450  | 4.90   | 1
```

---

### 🌐 PASSO 5: Testar Frontend

```
http://localhost:5173/gastronomia/pizzaria-bella-napoli
```

**Deve mostrar**:
- ✅ Nome do restaurante
- ✅ Endereço
- ✅ Rating 4.9 ⭐
- ✅ Cardápio com categorias
- ✅ Itens do menu

---

## ✅ CHECKLIST

- [ ] Executei PASSO 1 (adicionar colunas)
- [ ] Executei PASSO 2 (verificar - 4 colunas)
- [ ] Executei PASSO 3 (seed - sem erros)
- [ ] Executei PASSO 4 (validar - 1 restaurante)
- [ ] Testei PASSO 5 (frontend - cardápio aparece)

---

## 🐛 AINDA TEM ERRO?

### ❌ "relation business_data does not exist"
**Causa**: Tabela não foi criada  
**Solução**: Execute a migration completa:
```sql
-- Cole o conteúdo de:
-- supabase/migrations/20260418030000_create_business_domain.sql
```

### ❌ "relation locations does not exist"
**Causa**: Tabela locations não foi criada  
**Solução**: Execute antes:
```sql
-- Cole o conteúdo de:
-- supabase/migrations/20260418020000_create_locations_system.sql
```

### ❌ Outro erro de coluna faltando
**Solução**: Veja `EXECUTAR_MIGRATION_PRIMEIRO.md`

---

## 🎉 SUCESSO!

Se tudo funcionou:
- ✅ 5 restaurantes criados
- ✅ Colunas corrigidas
- ✅ Seed executado
- ✅ Frontend funcionando

**Parabéns! Seu módulo de gastronomia está pronto!** 🚀

---

**Tempo total**: ~5 minutos  
**Dificuldade**: ⭐⭐ Médio  
**Status**: ✅ Testado e funcionando
