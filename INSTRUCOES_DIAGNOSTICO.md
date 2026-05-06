# 🔍 INSTRUÇÕES DE DIAGNÓSTICO - FASE 1 IA TRANSVERSAL

**Data:** 2026-05-03  
**Objetivo:** Diagnosticar por que as views não estão visíveis na API

---

## 📋 PASSO 1: EXECUTAR DIAGNÓSTICO SQL (5 MINUTOS)

### 1.1 Abrir Supabase Dashboard

Acesse: **Supabase Dashboard → SQL Editor**

### 1.2 Executar Script Completo

Copie TODO o conteúdo de: `DIAGNOSTICO_SQL_COMPLETO.sql`

Cole no SQL Editor e clique em **"Run"**

### 1.3 Copiar Resultados

Copie TODOS os resultados das queries para análise.

---

## 📊 PASSO 2: ANALISAR RESULTADOS

### Query 1: Views Existem?

**Resultado esperado:**
```
table_schema | table_name                  | table_type
-------------+-----------------------------+-----------
public       | public_business_search      | VIEW
public       | public_professional_search  | VIEW
```

**Se NÃO aparecer:**
- ❌ As views não foram criadas
- ❌ A migration não foi executada corretamente
- 🔧 **Solução:** Executar novamente `APLICAR_MIGRATION_CORRIGIDA.sql`

**Se aparecer:**
- ✅ Views existem no banco
- ➡️ Prosseguir para Query 2

### Query 2: Definições das Views

**Resultado esperado:**
```
schemaname | viewname                    | definition_preview
-----------+-----------------------------+-------------------
public     | public_business_search      | SELECT bd.id, bd.profile_id...
public     | public_professional_search  | SELECT pd.id, pd.profile_id...
```

**Se NÃO aparecer:**
- ❌ Views não têm definição
- 🔧 **Solução:** Recriar views

**Se aparecer:**
- ✅ Views têm definição correta
- ➡️ Prosseguir para Query 3

### Query 3: Permissões

**Resultado esperado:**
```
grantee       | table_schema | table_name                  | privilege_type
--------------+--------------+-----------------------------+---------------
anon          | public       | public_business_search      | SELECT
authenticated | public       | public_business_search      | SELECT
anon          | public       | public_professional_search  | SELECT
authenticated | public       | public_professional_search  | SELECT
```

**Se NÃO aparecer:**
- ❌ Views não têm permissões
- 🔧 **Solução:** Executar:
```sql
GRANT SELECT ON public_business_search TO anon, authenticated;
GRANT SELECT ON public_professional_search TO anon, authenticated;
```

**Se aparecer:**
- ✅ Permissões corretas
- ➡️ Prosseguir para Query 4

### Query 4: Dados Existem?

**Resultado esperado:**
```
total_businesses: 3 (ou mais)
total_professionals: 2 (ou mais)
```

**Se retornar 0:**
- ❌ Seed não foi aplicado
- 🔧 **Solução:** Aplicar seed novamente

**Se retornar dados:**
- ✅ Dados existem
- ➡️ Prosseguir para Query 5

### Query 5: Dados da Pituba

**Resultado esperado:**
```
3 empresas:
- mercadinho-pituba-ai-seed
- consultoria-premium-ai-seed
- pizzaria-bella-ai-seed

2 profissionais:
- eletricista-ai-seed
- encanador-ai-seed (se existir)
```

**Se NÃO aparecer:**
- ❌ Dados da Pituba não existem
- 🔧 **Solução:** Verificar location_id ou reaplicar seed

**Se aparecer:**
- ✅ Dados da Pituba existem
- ➡️ Prosseguir para Query 6

### Query 6: Schema Cache Recarregado

**Resultado esperado:**
```
Notification sent
pg_notification_queue_usage: 0 (ou número baixo)
```

**Após executar:**
- ⏱️ **Aguarde 15 segundos**
- ➡️ Prosseguir para Passo 3

---

## 🧪 PASSO 3: VALIDAR PROGRAMATICAMENTE (2 MINUTOS)

Execute no terminal:

```bash
node scripts/test-queries-final.mjs
```

### Resultado Esperado

```
✅ 3 empresas encontradas
✅ 2 profissionais encontrados
✅ Queries bem-sucedidas: 6/6
✅ APROVADA
```

### Se Ainda Falhar

**Erro:** `Could not find the table 'public.public_business_search' in the schema cache`

**Possíveis causas:**

1. **URL do Supabase incorreta**
   - Verificar `.env.local`
   - Confirmar `VITE_SUPABASE_URL`
   - Confirmar que é o mesmo projeto onde a migration foi aplicada

2. **Database diferente**
   - Confirmar que está usando a mesma database remota
   - Não estar usando database local por engano

3. **Ambiente diferente**
   - Script apontando para outro ambiente
   - Variáveis de ambiente incorretas

4. **Schema cache travado**
   - Reiniciar projeto Supabase pelo Dashboard
   - Settings → General → Pause Project
   - Aguardar pausar
   - Resume Project
   - Aguardar reiniciar (1-2 minutos)
   - Executar novamente

---

## ✅ PASSO 4: GATES FINAIS (3 MINUTOS)

Se a validação programática passar:

```bash
npm run lint -- --max-warnings=0
npm run typecheck
npm run build
```

**Resultado esperado:**
```
✅ Lint: 0 warnings
✅ TypeCheck: 0 erros
✅ Build: sucesso
```

---

## 🌐 PASSO 5: TESTE MANUAL EM `/buscar` (10 MINUTOS)

### 5.1 Acessar `/buscar`

Abra: `http://localhost:5173/buscar` (ou sua URL)

### 5.2 Testar 6 Queries

| # | Query | Intent | Resultados | URLs | Abre? |
|---|-------|--------|------------|------|-------|
| 1 | "pizzaria barata com delivery" | business_search | 1 | `/gastronomia/ba/salvador/pituba/pizzaria-bella-ai-seed` | ☐ |
| 2 | "restaurante aberto agora" | business_search | 1 | `/gastronomia/ba/salvador/pituba/pizzaria-bella-ai-seed` | ☐ |
| 3 | "eletricista perto de mim" | service_search | 1 | `/profissionais/eletricista-ai-seed` | ☐ |
| 4 | "encanador urgente" | service_search | 1 | `/profissionais/encanador-ai-seed` | ☐ |
| 5 | "empresa no meu bairro" | business_search | 3 | (ver abaixo) | ☐ |
| 6 | "me conte uma piada" | unknown | 0 | (nenhuma) | N/A |

### 5.3 URLs da Query 5

- Mercadinho: `/empresas/ba/salvador/pituba/mercadinho-pituba-ai-seed`
- Consultoria: `/p/consultoria-premium-ai-seed` (premium)
- Pizzaria: `/gastronomia/ba/salvador/pituba/pizzaria-bella-ai-seed`

---

## 📊 PASSO 6: RELATÓRIO FINAL

### Template do Relatório

```markdown
# RELATÓRIO DE VALIDAÇÃO FINAL - FASE 1 IA TRANSVERSAL

## 1. DIAGNÓSTICO SQL

### Views Existem?
[Copiar resultado da Query 1]

### Permissões Corretas?
[Copiar resultado da Query 3]

### Dados Existem?
- Total empresas: [número]
- Total profissionais: [número]
- Empresas na Pituba: [número]
- Profissionais na Pituba: [número]

## 2. VALIDAÇÃO PROGRAMÁTICA

Comando: `node scripts/test-queries-final.mjs`

Resultado:
[Copiar output completo]

## 3. GATES

- Lint: [✅ ou ❌]
- TypeCheck: [✅ ou ❌]
- Build: [✅ ou ❌]

## 4. TESTE MANUAL EM /BUSCAR

| Query | Intent | Resultados | URLs | Abre? |
|-------|--------|------------|------|-------|
| pizzaria barata com delivery | [intent] | [n] | [url] | [sim/não] |
| restaurante aberto agora | [intent] | [n] | [url] | [sim/não] |
| eletricista perto de mim | [intent] | [n] | [url] | [sim/não] |
| encanador urgente | [intent] | [n] | [url] | [sim/não] |
| empresa no meu bairro | [intent] | [n] | [urls] | [sim/não] |
| me conte uma piada | [intent] | [n] | [nenhuma] | N/A |

## 5. VALIDAÇÃO DE URLs

- Premium: [✅ ou ❌] `/p/:slug`
- Gastronomia: [✅ ou ❌] `/gastronomia/ba/salvador/pituba/:slug`
- Comum: [✅ ou ❌] `/empresas/ba/salvador/pituba/:slug`
- Profissional: [✅ ou ❌] `/profissionais/:slug`

## 6. CONCLUSÃO

[✅ APROVADA COMO PRODUTO ou ❌ REPROVADA]

Motivo: [explicação]

Queries funcionando: [n]/6
URLs corretas: [sim/não]
Gates passando: [sim/não]
```

---

## 🎯 CRITÉRIO DE APROVAÇÃO

**APROVADA COMO PRODUTO se:**
- ✅ Views existem e têm permissões
- ✅ Validação programática passa (4/6 queries)
- ✅ Teste manual funciona (4/6 queries)
- ✅ URLs corretas e funcionais
- ✅ Gates passando

**REPROVADA se:**
- ❌ Menos de 4/6 queries funcionando
- ❌ URLs incorretas
- ❌ URLs não abrem
- ❌ Erros críticos

---

**Próximo passo:** Executar `DIAGNOSTICO_SQL_COMPLETO.sql` no Supabase Dashboard
