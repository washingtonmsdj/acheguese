# 🚨 ERRO: Colunas Faltando em business_data

## ❌ Problema

```
ERROR: column "address" of relation "business_data" does not exist
```

**Causa**: As migrations não foram executadas ou falharam parcialmente.

---

## ✅ SOLUÇÃO: Executar Migration de Correção

### Passo 1: Executar Migration de Correção

No **Supabase Dashboard** → **SQL Editor** → **New Query**:

```sql
-- Adicionar coluna address
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_data' AND column_name = 'address'
  ) THEN
    ALTER TABLE business_data ADD COLUMN address TEXT;
  END IF;
END $$;

-- Adicionar coluna latitude
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_data' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE business_data ADD COLUMN latitude DECIMAL(10,7);
  END IF;
END $$;

-- Adicionar coluna longitude
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_data' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE business_data ADD COLUMN longitude DECIMAL(10,7);
  END IF;
END $$;

-- Adicionar coluna location_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_data' AND column_name = 'location_id'
  ) THEN
    ALTER TABLE business_data ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_business_data_location_id 
  ON business_data(location_id) 
  WHERE location_id IS NOT NULL;
```

**Execute** (Ctrl+Enter)

### Passo 2: Verificar se Funcionou

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'business_data' 
  AND column_name IN ('address', 'latitude', 'longitude', 'location_id')
ORDER BY column_name;
```

**Resultado esperado:**
```
column_name  | data_type
-------------|----------
address      | text
latitude     | numeric
location_id  | uuid
longitude    | numeric
```

### Passo 3: Agora Execute o Seed

Volte para **New Query** e execute o seed:
1. Copie: `supabase/seed_gastronomy_mock.sql`
2. Cole no editor
3. Execute (Ctrl+Enter)

---

## 🔍 Por Que Isso Aconteceu?

Seu banco de dados está em um estado inconsistente:
- ✅ Tabela `business_data` existe
- ❌ Mas falta colunas que deveriam ter sido criadas

**Possíveis causas:**
1. Migration `20260418030000_create_business_domain.sql` não foi executada
2. Migration foi executada parcialmente e falhou
3. Alguém alterou a tabela manualmente

---

## 🎯 Solução Definitiva (Opcional)

Se você quiser garantir que TODAS as migrations estão corretas:

### Opção 1: Reset Completo (Local)
```bash
supabase db reset --local
```

### Opção 2: Executar Todas as Migrations (Cloud)
1. Dashboard → Database → Migrations
2. Execute todas as migrations pendentes
3. Ou execute manualmente cada migration em ordem

---

## ✅ Após Corrigir

1. Execute a migration de correção acima
2. Verifique se as colunas existem
3. Execute o seed normalmente
4. Teste no frontend

---

**Arquivo criado**: `supabase/migrations/20260423100000_fix_business_data_missing_columns.sql`

Você pode executar este arquivo também se preferir.
