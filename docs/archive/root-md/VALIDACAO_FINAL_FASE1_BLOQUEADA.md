# ⚠️ Validação Final Fase 1 - BLOQUEADA

**Data:** 2026-05-03  
**Status:** ❌ **NÃO PODE SER DECLARADA PRONTA PARA PRODUÇÃO**

---

## 🚫 Bloqueios Identificados

### 1. Migration NÃO Aplicada no Banco Remoto

**Evidência:**
```
❌ RPC falhou: structure of query does not match function result type
   Detalhes: Returned type numeric(10,7) does not match expected type 
   double precision in column 3.
```

**Causa:**
- Docker Desktop não está rodando (necessário para Supabase local)
- Migration `20260503000000_fix_spatial_search_hybrid_types.sql` NÃO foi aplicada no banco remoto
- RPC `search_entities_hybrid` ainda retorna tipos antigos (NUMERIC em vez de DOUBLE PRECISION)

**Impacto:**
- ❌ Busca geoespacial NÃO funciona
- ❌ `SearchBusinessesActionHandler` com coordenadas cai em fallback por erro SQL
- ❌ Fase 1 NÃO está pronta

---

### 2. Script de Validação com FK Ambígua

**Evidência:**
```
❌ Busca de profissionais falhou:
   Could not embed because more than one relationship was found 
   for 'professional_data' and 'locations'
```

**Causa:**
- Script `validate-ai-phase1.mjs` não especifica qual FK usar
- Há duas FKs: `fk_professional_data_location_id` e `professional_data_location_id_fkey`

**Solução:**
- Corrigir script para usar FK explícita: `locations!professional_data_location_id_fkey`

---

### 3. Sem Dados de Teste na Pituba

**Evidência:**
```
✅ Busca de empresas funcionou!
   Resultados: 0

⚠️  Nenhuma empresa encontrada para testar perfil gastronômico
```

**Causa:**
- Location ID `384add59-4e53-489d-a7b5-97dea2b3f442` (Pituba) não tem empresas cadastradas no banco remoto

**Impacto:**
- ⚠️  Não é possível validar resultados reais
- ⚠️  Não é possível testar URLs gastronômicas
- ⚠️  Não é possível testar busca geoespacial com dados reais

---

## 📋 Estado Atual dos Testes

| Teste | Status | Motivo |
|-------|--------|--------|
| RPC Geoespacial | ❌ | Migration não aplicada |
| Busca de Profissionais | ❌ | FK ambígua no script |
| Busca de Empresas | ✅ | Funciona mas sem dados |
| Perfis Gastronômicos | ⚠️  | Sem dados para testar |

---

## 🔧 Ações Necessárias

### Ação 1: Aplicar Migration no Banco Remoto (CRÍTICO)

**Opção A: Via Supabase Dashboard (RECOMENDADO)**

1. Acessar https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd
2. Ir em **SQL Editor**
3. Criar nova query
4. Copiar conteúdo de `supabase/migrations/20260503000000_fix_spatial_search_hybrid_types.sql`
5. Executar
6. Verificar sucesso

**Opção B: Via Docker Local**

1. Instalar/Iniciar Docker Desktop
2. Executar `npx supabase start`
3. Executar `npx supabase db reset`
4. Testar localmente

**Opção C: Via CLI Remoto**

```bash
npx supabase link --project-ref xhdowzacfujckjelqhtd
npx supabase db push
```

---

### Ação 2: Corrigir Script de Validação

**Arquivo:** `scripts/validate-ai-phase1.mjs`

**Mudança necessária:**

```javascript
// ❌ Antes (ambíguo)
.select(`
  *,
  profiles!professional_data_profile_id_fkey(id, name, avatar_url, verified),
  address:addresses!address_id(id, location_id, postal_code, street, number, latitude, longitude),
  location:locations!location_id(id, name, full_name, type, slug)
`)

// ✅ Depois (explícito)
.select(`
  *,
  profiles!professional_data_profile_id_fkey(id, name, avatar_url, verified),
  address:addresses!address_id(id, location_id, postal_code, street, number, latitude, longitude),
  location:locations!professional_data_location_id_fkey(id, name, full_name, type, slug)
`)
```

---

### Ação 3: Criar Dados de Teste (OPCIONAL mas RECOMENDADO)

**Opção A: Via Script**

Criar `scripts/seed-pituba-data.mjs` para popular:
- 3-5 empresas na Pituba
- 2-3 profissionais na Pituba
- 1-2 restaurantes com perfil gastronômico

**Opção B: Via Dashboard**

Criar manualmente via Supabase Dashboard:
- Tabela `businesses` → Insert
- Tabela `professional_data` → Insert
- Tabela `gastronomy_profiles` → Insert

**Dados mínimos necessários:**

```sql
-- Empresa comum
INSERT INTO businesses (
  id, profile_id, name, slug, category, status, 
  location_id, latitude, longitude, geographic_path
) VALUES (
  gen_random_uuid(),
  'profile-id-aqui',
  'Pizzaria Central',
  'pizzaria-central',
  'restaurante',
  'active',
  '384add59-4e53-489d-a7b5-97dea2b3f442',
  -12.9977,
  -38.4502,
  'ba/salvador/pituba'
);
```

---

## 📊 Validação Completa Pendente

Após aplicar migration e corrigir script, executar:

```bash
# 1. Validar backend
node scripts/validate-ai-phase1.mjs

# 2. Testar queries reais
npm run dev
# Acessar http://localhost:8080/buscar

# 3. Testar queries obrigatórias:
# - pizzaria barata com delivery
# - restaurante aberto agora
# - eletricista perto de mim
# - encanador urgente
# - empresa no meu bairro
# - me conte uma piada
```

---

## 🎯 Critérios de Aceitação

Para declarar Fase 1 como pronta:

- [ ] Migration aplicada no banco remoto
- [ ] RPC `search_entities_hybrid` funciona sem erro
- [ ] Script de validação passa todos os testes
- [ ] Busca de profissionais retorna dados reais (ou empty state válido)
- [ ] Busca de empresas retorna dados reais (ou empty state válido)
- [ ] URLs gastronômicas corretas quando aplicável
- [ ] 6 queries obrigatórias testadas em /buscar
- [ ] Gates finais passam: lint, typecheck, build

---

## ⚠️ Conclusão

**A Fase 1 NÃO pode ser declarada pronta para produção até que:**

1. ✅ Migration seja aplicada no banco remoto
2. ✅ RPC geoespacial funcione sem erro
3. ✅ Script de validação seja corrigido
4. ✅ Validação completa seja executada com sucesso

**Próximo passo imediato:**
👉 **Aplicar migration via Supabase Dashboard**

---

## 📞 Instruções para Aplicar Migration

### Via Supabase Dashboard (5 minutos)

1. Acessar: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new
2. Copiar todo o conteúdo de: `supabase/migrations/20260503000000_fix_spatial_search_hybrid_types.sql`
3. Colar no SQL Editor
4. Clicar em "Run"
5. Verificar mensagem de sucesso
6. Testar RPC:

```sql
SELECT * FROM search_entities_hybrid(
  -12.9977,
  -38.4502,
  8.0,
  'business',
  ARRAY['384add59-4e53-489d-a7b5-97dea2b3f442']::uuid[],
  10
);
```

7. Se retornar sem erro → Migration aplicada com sucesso! ✅
8. Executar novamente: `node scripts/validate-ai-phase1.mjs`

---

**Status Final:** ❌ **BLOQUEADA - AGUARDANDO APLICAÇÃO DE MIGRATION**
