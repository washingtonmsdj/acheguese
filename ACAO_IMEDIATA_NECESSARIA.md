# 🚨 AÇÃO IMEDIATA NECESSÁRIA

**Data:** 2026-05-03  
**Problema:** Schema cache não recarregado

---

## ⚠️ SITUAÇÃO

Você aplicou a migration das views públicas, mas o **schema cache do PostgREST não foi recarregado**.

**Erro atual:**
```
Could not find the table 'public.public_business_search' in the schema cache
```

---

## ✅ SOLUÇÃO (5 MINUTOS)

### Passo 1: Recarregar Schema Cache

Abra **Supabase Dashboard → SQL Editor** e execute:

```sql
NOTIFY pgrst, 'reload schema';
SELECT pg_notification_queue_usage();
```

**Aguarde 10 segundos.**

### Passo 2: Verificar se Funcionou

Execute no mesmo SQL Editor:

```sql
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name IN ('public_business_search', 'public_professional_search');
```

**Resultado esperado:**
```
table_name                  | table_type
----------------------------+-----------
public_business_search      | VIEW
public_professional_search  | VIEW
```

### Passo 3: Testar Novamente

Execute no terminal:

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

## 🆘 SE NÃO FUNCIONAR

### Opção A: Executar Verificação Completa

Execute no SQL Editor o conteúdo de: `VERIFICAR_VIEWS.sql`

### Opção B: Reiniciar Projeto Supabase

1. **Supabase Dashboard → Settings → General**
2. Clique em **"Pause Project"**
3. Aguarde pausar
4. Clique em **"Resume Project"**
5. Aguarde reiniciar (1-2 minutos)
6. Execute novamente: `node scripts/test-queries-final.mjs`

---

## 📋 CHECKLIST

- [ ] Executei `NOTIFY pgrst, 'reload schema';`
- [ ] Aguardei 10 segundos
- [ ] Verifiquei que as views existem
- [ ] Executei `node scripts/test-queries-final.mjs`
- [ ] Funcionou?
  - [ ] ✅ Sim → Prosseguir com validação manual
  - [ ] ❌ Não → Tentar Opção B (Reiniciar Projeto)

---

## 🎯 APÓS RESOLVER

Continue com a validação:

1. ✅ Validação programática (`node scripts/test-queries-final.mjs`)
2. ⏳ Teste manual em `/buscar` (6 queries)
3. ⏳ Validar URLs
4. ⏳ Gates finais (`lint`, `build`)
5. ⏳ Decisão final

---

**Tempo estimado:** 5 minutos para resolver + 15 minutos para validação completa

**Próximo passo:** Executar `NOTIFY pgrst, 'reload schema';` no Supabase SQL Editor
