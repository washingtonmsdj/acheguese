# ⚠️ PROBLEMA: SCHEMA CACHE NÃO RECARREGADO

**Data:** 2026-05-03  
**Status:** Views criadas mas não visíveis na API

---

## 🔍 DIAGNÓSTICO

**Erro:** `Could not find the table 'public.public_business_search' in the schema cache`

**Causa:** O schema cache do PostgREST (API do Supabase) não foi recarregado após criar as views.

---

## ✅ SOLUÇÃO: RECARREGAR SCHEMA CACHE

### Opção 1: Via SQL Editor (RECOMENDADO)

Execute no **Supabase Dashboard → SQL Editor**:

```sql
-- Recarregar schema cache
NOTIFY pgrst, 'reload schema';

-- Verificar se funcionou
SELECT pg_notification_queue_usage();
```

Aguarde 5-10 segundos e tente novamente.

### Opção 2: Via Supabase Dashboard

1. Acesse: **Supabase Dashboard → Settings → API**
2. Clique em **"Reload Schema Cache"** (se disponível)
3. Aguarde a confirmação

### Opção 3: Reiniciar Projeto Supabase

1. Acesse: **Supabase Dashboard → Settings → General**
2. Clique em **"Pause Project"**
3. Aguarde pausar
4. Clique em **"Resume Project"**
5. Aguarde reiniciar (pode levar 1-2 minutos)

---

## 🧪 VERIFICAR SE AS VIEWS FORAM CRIADAS

Execute no **Supabase Dashboard → SQL Editor**:

```sql
-- Copie e cole o conteúdo de VERIFICAR_VIEWS.sql
```

Ou execute o arquivo: `VERIFICAR_VIEWS.sql`

**Resultado esperado:**

```
-- 1. Views existem
table_schema | table_name                  | table_type
-------------+-----------------------------+-----------
public       | public_business_search      | VIEW
public       | public_professional_search  | VIEW

-- 2. Grants configurados
grantee       | table_name                  | privilege_type
--------------+-----------------------------+---------------
anon          | public_business_search      | SELECT
authenticated | public_business_search      | SELECT
anon          | public_professional_search  | SELECT
authenticated | public_professional_search  | SELECT

-- 3. Contagem
total_empresas: 3
total_profissionais: 2

-- 4. Dados da Pituba
(ver empresas e profissionais)
```

---

## 🔄 APÓS RECARREGAR

Execute novamente:

```bash
node scripts/test-queries-final.mjs
```

**Resultado esperado:**
```
✅ 3 empresas encontradas
✅ 2 profissionais encontrados
✅ Queries bem-sucedidas: 6/6
✅ APROVADA
```

---

## ⚠️ SE O PROBLEMA PERSISTIR

### Verificar se as views foram realmente criadas

Execute `VERIFICAR_VIEWS.sql` no Supabase SQL Editor.

Se as views NÃO aparecerem:
1. A migration não foi executada corretamente
2. Execute novamente: `EXECUTAR_NO_SUPABASE_AGORA.sql`

Se as views aparecerem mas o erro persistir:
1. O schema cache não foi recarregado
2. Tente a Opção 3 (Reiniciar Projeto)

### Verificar configuração da API

1. Acesse: **Supabase Dashboard → Settings → API**
2. Verifique se o schema `public` está exposto
3. Verifique se há alguma configuração bloqueando views

---

## 📊 CHECKLIST

- [ ] Executei `NOTIFY pgrst, 'reload schema';` no SQL Editor
- [ ] Aguardei 5-10 segundos
- [ ] Executei `VERIFICAR_VIEWS.sql` e vi as views
- [ ] Executei `node scripts/test-queries-final.mjs`
- [ ] O erro persiste?
  - [ ] Sim → Tentar Opção 3 (Reiniciar Projeto)
  - [ ] Não → Prosseguir com validação

---

**Próximo passo:** Recarregar schema cache e executar validação novamente
