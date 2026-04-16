# ✅ Correção Aplicada: ride_offers Migration

## 🔧 Problema Corrigido

**Erro original:**
```
ERROR: 42703: column "passenger_id" does not exist
```

**Causa:** A policy usava `passenger_id` mas a coluna correta é `passenger_profile_id`.

## ✅ Correção Aplicada

### Antes (❌ Errado)
```sql
WHERE passenger_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
)
```

### Depois (✅ Correto)
```sql
WHERE passenger_profile_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
)
```

## 🚀 Aplicar Agora

A migration foi corrigida. Execute novamente:

### 1. Abrir SQL Editor
https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new

### 2. Copiar SQL Corrigido

Abra: `supabase/migrations/20260416000000_create_ride_offers.sql`

Ou copie do arquivo: `APLICAR_RIDE_OFFERS_MANUAL.md`

### 3. Executar

Cole no SQL Editor e clique em **Run**

## ✅ Resultado Esperado

```
Success. No rows returned
```

Ou mensagens indicando que:
- Tabela `ride_offers` criada
- 5 índices criados
- 4 policies criadas

## 📋 Validação

1. **Verificar tabela criada:**
   - Supabase Dashboard → Table Editor → `ride_offers`

2. **Testar cancelamento:**
   - Solicite uma corrida
   - Cancele a corrida
   - Verifique console: ✅ sem erro 404

## 🔍 Estrutura da Tabela ride_requests

Para referência, a estrutura correta é:

```sql
ride_requests (
  id UUID,
  passenger_profile_id UUID,  -- ✅ Nome correto
  driver_profile_id UUID,
  status TEXT,
  ...
)
```

**Não existe** coluna `passenger_id` - sempre use `passenger_profile_id`.

## 📚 Arquivos Atualizados

- ✅ `supabase/migrations/20260416000000_create_ride_offers.sql`
- ✅ `APLICAR_RIDE_OFFERS_MANUAL.md`

## 🎯 Próximo Passo

Execute o SQL corrigido no Supabase Dashboard conforme instruções em:
**`APLICAR_RIDE_OFFERS_MANUAL.md`**
