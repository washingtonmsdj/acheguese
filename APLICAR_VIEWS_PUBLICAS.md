# 🔒 APLICAR VIEWS PÚBLICAS SEGURAS - FASE 1 IA TRANSVERSAL

**Data:** 2026-05-03  
**Objetivo:** Expor dados de forma segura para `/buscar` sem comprometer segurança

---

## 🎯 SOLUÇÃO IMPLEMENTADA

**Opção escolhida:** Views públicas seguras

**Views criadas:**
1. `public_business_search` - Busca de empresas
2. `public_professional_search` - Busca de profissionais

**Motivo:** Views permitem controle granular sobre quais campos são expostos, sem dar acesso direto às tabelas brutas `business_data` e `professional_data`.

---

## 📋 PASSO 1: Diagnóstico (Opcional)

Se quiser verificar o estado atual antes de aplicar:

```bash
# Executar no Supabase SQL Editor
cat DIAGNOSTICO_COMPLETO.sql
```

---

## 📋 PASSO 2: Aplicar Migration

**Executar no Supabase Dashboard → SQL Editor:**

Copie TODO o conteúdo de:
```
supabase/migrations/20260503010000_create_public_search_views.sql
```

**O que a migration faz:**
1. ✅ Cria `public_business_search` view
   - Expõe: id, name, slug, category, description, image_url, location_id, lat/lng, status, is_premium
   - Flag: `has_active_gastronomy_profile` (para URLs)
   - Filtra: apenas `status = 'active'`
   
2. ✅ Cria `public_professional_search` view
   - Expõe: id, name, slug, category, description, image_url, location_id, lat/lng, is_accepting_clients
   - Filtra: apenas `is_accepting_clients = true`

3. ✅ Grants mínimos
   - `SELECT` para `anon` e `authenticated`
   - Nenhum `INSERT`, `UPDATE`, `DELETE`

4. ✅ Recarrega schema cache
   - `NOTIFY pgrst, 'reload schema';`

5. ✅ Queries de verificação
   - Testa ambas as views

**Campos NÃO expostos (segurança):**
- ❌ phone, whatsapp, email
- ❌ internal_notes, admin_notes
- ❌ financial_data, billing_info
- ❌ password_hash, tokens
- ❌ Qualquer campo sensível

---

## 📋 PASSO 3: Validar Programaticamente

```bash
node scripts/test-queries-final.mjs
```

**Resultado esperado:**
```
✅ 3 empresas encontradas
✅ 2 profissionais encontrados
✅ 1 perfil gastronômico encontrado
✅ Queries bem-sucedidas: 5-6/6
```

---

## 📋 PASSO 4: Atualizar Services (Se Necessário)

Os services já devem funcionar, mas se precisar ajustar:

**BusinessService:**
```typescript
// Usar view pública
const { data } = await supabase
  .from('public_business_search')
  .select('*')
  .eq('location_id', locationId);
```

**ProfessionalService:**
```typescript
// Usar view pública
const { data } = await supabase
  .from('public_professional_search')
  .select('*')
  .eq('location_id', locationId);
```

---

## 📋 PASSO 5: Testar em `/buscar`

1. Acessar `/buscar` no navegador
2. Testar 6 queries:
   - "pizzaria barata com delivery"
   - "restaurante aberto agora"
   - "eletricista perto de mim"
   - "encanador urgente"
   - "empresa no meu bairro"
   - "me conte uma piada"

3. Para cada query, registrar:
   - Intent gerada
   - Quantidade de resultados
   - URLs geradas
   - Se URLs abrem

---

## 📋 PASSO 6: Validar URLs

Confirmar regras:
- Premium: `/p/:slug`
- Gastronômica: `/gastronomia/ba/salvador/pituba/:slug`
- Comum: `/empresas/ba/salvador/pituba/:slug`
- Profissional: `/profissionais/:slug`

---

## 📋 PASSO 7: Gates Finais

```bash
npm run lint -- --max-warnings=0
npm run typecheck
npm run build
```

---

## 🔒 SEGURANÇA GARANTIDA

### ✅ O Que Foi Exposto

**Views públicas com campos mínimos:**
- Identificação: id, name, slug
- Categorização: category
- Localização: location_id, latitude, longitude
- Apresentação: description, image_url
- Status: status, is_premium, is_accepting_clients
- Flags: has_active_gastronomy_profile

### ❌ O Que NÃO Foi Exposto

**Tabelas brutas:**
- ❌ `business_data` - NÃO exposta diretamente
- ❌ `professional_data` - NÃO exposta diretamente

**Campos sensíveis:**
- ❌ Contatos privados (phone, whatsapp, email)
- ❌ Dados financeiros
- ❌ Notas internas
- ❌ Tokens e credenciais
- ❌ Qualquer PII não necessário

### ✅ Permissões Mínimas

- `SELECT` apenas (leitura)
- Apenas para `anon` e `authenticated`
- Nenhum `INSERT`, `UPDATE`, `DELETE`
- Views filtram automaticamente (status active, accepting clients)

---

## 📊 CRITÉRIO DE APROVAÇÃO

**APROVADA COMO PRODUTO se:**
- ✅ Views criadas com sucesso
- ✅ Validação programática passa
- ✅ 4/6 queries retornam resultados
- ✅ URLs corretas
- ✅ URLs abrem
- ✅ Gates passando
- ✅ Nenhum dado sensível exposto

---

**Próximo passo:** Aplicar migration no Supabase Dashboard
