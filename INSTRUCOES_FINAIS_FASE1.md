# 🚀 INSTRUÇÕES FINAIS - FASE 1 IA TRANSVERSAL

**Data:** 2026-05-03  
**Status:** ✅ **CÓDIGO ATUALIZADO - PRONTO PARA APLICAR MIGRATION**

---

## ✅ O QUE FOI CORRIGIDO

### 1. Migration Atualizada

**Arquivo:** `APLICAR_MIGRATION_CORRIGIDA.sql`

**Mudanças:**
- ✅ `public_business_search` agora inclui TODOS os campos necessários:
  - `profile_id`, `business_name`, `slug`, `category`, `description`
  - `image_url`, `location_id`, `address_id`
  - `latitude`, `longitude`, `status`
  - `is_premium`, `is_verified`, `rating`, `recommendations_count`
  - `business_role`, `metadata`, `created_at`, `updated_at`
  - `has_active_gastronomy_profile` (flag para URLs)
  - `geographic_path` (para URLs)

- ✅ `public_professional_search` agora inclui TODOS os campos necessários:
  - `id`, `profile_id`, `professional_name`, `slug`
  - `service_category`, `bio`, `profile_image_url`
  - `location_id`, `address_id`
  - `is_accepting_clients`, `is_verified`, `rating`, `price_range`
  - `metadata`, `created_at`, `updated_at`
  - `latitude`, `longitude` (coordenadas)
  - `geographic_path` (para URLs)

### 2. Services Atualizados

**BusinessService (`src/core/business/services/business.queries.ts`):**
- ✅ `getBusinessesList()` agora usa `public_business_search`
- ✅ `getBusinessesByIds()` agora usa `public_business_search`

**ProfessionalService (`src/core/professional/services/professional.queries.ts`):**
- ✅ `getProfessionals()` agora usa `public_professional_search`
- ✅ `getProfessionalsList()` agora usa `public_professional_search`

### 3. Fluxo Completo

**`/buscar` agora usa:**
1. IntentParser → classifica query
2. AIOrchestrator → escolhe handler
3. SearchBusinessesActionHandler → chama `BusinessService.getBusinessesList()`
4. SearchServicesActionHandler → chama `ProfessionalService.getProfessionals()`
5. Services → consultam `public_business_search` e `public_professional_search`
6. Views públicas → retornam dados seguros

**✅ Nenhuma leitura direta de `business_data` ou `professional_data` via API**

---

## 🚀 PASSO 1: APLICAR MIGRATION CORRIGIDA (5 MINUTOS)

### 1.1 Abrir Supabase Dashboard

Acesse: **Supabase Dashboard → SQL Editor**

### 1.2 Executar Migration

Copie TODO o conteúdo de: `APLICAR_MIGRATION_CORRIGIDA.sql`

Cole no SQL Editor e clique em **"Run"**

### 1.3 Aguardar Confirmação

Você deve ver:
```
✅ Views dropadas (se existiam)
✅ Views criadas
✅ Grants configurados
✅ Schema cache recarregado
✅ Resultados das queries de verificação
```

### 1.4 Aguardar 10 Segundos

O schema cache precisa de tempo para propagar.

---

## 🧪 PASSO 2: VALIDAÇÃO PROGRAMÁTICA (2 MINUTOS)

Execute no terminal:

```bash
node scripts/test-queries-final.mjs
```

**Resultado esperado:**
```
🧪 TESTE FINAL DAS 6 QUERIES - FASE 1 IA TRANSVERSAL

📍 Location: Pituba (384add59-4e53-489d-a7b5-97dea2b3f442)

================================================================================
📦 VERIFICANDO DADOS DE SEED
================================================================================

🏢 Empresas na Pituba:
✅ 3 empresas encontradas:
   1. Mercadinho Pituba (mercadinho-pituba-ai-seed)
   2. Consultoria Premium (consultoria-premium-ai-seed)
   3. Pizzaria Bella (pizzaria-bella-ai-seed)

👷 Profissionais na Pituba:
✅ 2 profissionais encontrados:
   1. Eletricista João (eletricista-ai-seed)
   2. Encanador Pedro (encanador-ai-seed)

🍽️  Perfis Gastronômicos:
✅ 1 perfil gastronômico encontrado

================================================================================
🔍 SIMULAÇÃO DAS 6 QUERIES
================================================================================

✅ Query 1: "pizzaria barata com delivery" - PASSOU
✅ Query 2: "restaurante aberto agora" - PASSOU
✅ Query 3: "eletricista perto de mim" - PASSOU
✅ Query 4: "encanador urgente" - PASSOU
✅ Query 5: "empresa no meu bairro" - PASSOU
✅ Query 6: "me conte uma piada" - PASSOU (unknown, 0 resultados)

✅ Queries bem-sucedidas: 6/6

✅ APROVADA: Pelo menos 4/6 queries funcionaram
```

---

## 🌐 PASSO 3: TESTE MANUAL EM `/buscar` (10 MINUTOS)

### 3.1 Acessar `/buscar`

Abra o navegador: `http://localhost:5173/buscar` (ou sua URL)

### 3.2 Testar as 6 Queries

| # | Query | Intent Esperado | Resultados Esperados |
|---|-------|-----------------|----------------------|
| 1 | "pizzaria barata com delivery" | `business_search` | 1 (Pizzaria Bella) |
| 2 | "restaurante aberto agora" | `business_search` | 1 (Pizzaria Bella) |
| 3 | "eletricista perto de mim" | `service_search` | 1 (Eletricista João) |
| 4 | "encanador urgente" | `service_search` | 1 (Encanador Pedro) |
| 5 | "empresa no meu bairro" | `business_search` | 3 (todas) |
| 6 | "me conte uma piada" | `unknown` | 0 (sem cards) |

### 3.3 Para Cada Query, Registrar:

- [ ] Intent gerada
- [ ] Handler acionado
- [ ] Quantidade de resultados
- [ ] Títulos dos resultados
- [ ] URLs geradas
- [ ] Se as URLs abrem corretamente

### 3.4 Validar URLs

| Tipo | URL Esperada |
|------|--------------|
| Empresa Premium | `/p/consultoria-premium-ai-seed` |
| Empresa Gastronômica | `/gastronomia/ba/salvador/pituba/pizzaria-bella-ai-seed` |
| Empresa Comum | `/empresas/ba/salvador/pituba/mercadinho-pituba-ai-seed` |
| Profissional | `/profissionais/eletricista-ai-seed` |

---

## ✅ PASSO 4: GATES FINAIS (3 MINUTOS)

Execute:

```bash
npm run lint -- --max-warnings=0
npm run typecheck
npm run build
```

**Resultado esperado:**
```
✅ Lint: 0 warnings
✅ TypeCheck: 0 erros (já verificado)
✅ Build: sucesso
```

---

## 📊 PASSO 5: DECISÃO FINAL

### ✅ APROVADA COMO PRODUTO se:

- [x] Código atualizado (services usam views públicas)
- [x] TypeCheck passando (0 erros)
- [ ] Migration aplicada com sucesso
- [ ] 4/6 queries funcionando (validação programática)
- [ ] 4/6 queries funcionando (teste manual em `/buscar`)
- [ ] URLs corretas
- [ ] URLs abrem
- [ ] Lint passando (0 warnings)
- [ ] Build passando

### ❌ REPROVADA se:

- [ ] Menos de 4/6 queries funcionando
- [ ] URLs incorretas
- [ ] URLs não abrem
- [ ] Erros críticos nos gates

---

## 🔒 SEGURANÇA GARANTIDA

### ✅ Views Públicas Completas

**Campos expostos:**
- Todos os campos necessários para `/buscar` funcionar
- Nenhum campo sensível (phone, email, internal_notes, etc)

**Campos NÃO expostos:**
- ❌ phone, whatsapp, email
- ❌ internal_notes, admin_notes
- ❌ financial_data, billing_info
- ❌ Qualquer PII sensível

### ✅ Fluxo Seguro

1. `/buscar` → IntentParser → AIOrchestrator
2. Handlers → Services canônicos
3. Services → Views públicas (`public_business_search`, `public_professional_search`)
4. Views → Dados seguros (sem PII sensível)

**✅ Nenhuma leitura direta de `business_data` ou `professional_data` via API**

---

## 📁 ARQUIVOS IMPORTANTES

| Arquivo | Descrição |
|---------|-----------|
| **`APLICAR_MIGRATION_CORRIGIDA.sql`** | **APLICAR AGORA** no Supabase |
| `scripts/test-queries-final.mjs` | Validação programática |
| `src/core/business/services/business.queries.ts` | ✅ Atualizado |
| `src/core/professional/services/professional.queries.ts` | ✅ Atualizado |

---

## 🆘 TROUBLESHOOTING

### Erro: "Could not find the table 'public.public_business_search'"

**Solução:**
1. Confirme que executou `APLICAR_MIGRATION_CORRIGIDA.sql`
2. Aguarde 10 segundos
3. Execute manualmente: `NOTIFY pgrst, 'reload schema';`

### Queries retornam 0 resultados

**Solução:**
1. Verifique se o seed foi aplicado
2. Execute no SQL Editor:
```sql
SELECT * FROM public_business_search WHERE location_id = '384add59-4e53-489d-a7b5-97dea2b3f442';
SELECT * FROM public_professional_search WHERE location_id = '384add59-4e53-489d-a7b5-97dea2b3f442';
```

### URLs não abrem

**Solução:**
1. Verifique se `geographic_path` está preenchido
2. Verifique se as rotas existem no frontend

---

**Próximo passo:** Aplicar `APLICAR_MIGRATION_CORRIGIDA.sql` no Supabase Dashboard

**Tempo estimado:** 20 minutos para conclusão completa
