# 🔧 RESOLVER SCHEMA CACHE E COMPLETAR SEED

**Data:** 2026-05-03  
**Objetivo:** Resolver schema cache do Supabase e completar seed mínimo

---

## 📋 PASSO 1: Recarregar Schema Cache do PostgREST

### Executar no Supabase SQL Editor

```sql
-- Recarregar schema cache
NOTIFY pgrst, 'reload schema';

-- Verificar uso da fila de notificações
SELECT pg_notification_queue_usage();
```

**Resultado esperado:**
- `NOTIFY` retorna sucesso
- `pg_notification_queue_usage()` retorna um número (uso da fila)

---

## 📋 PASSO 2: Completar Seed Mínimo

### Status Atual dos Dados

✅ **Já existem:**
- `mercadinho-pituba-ai-seed` (empresa comum)
- `consultoria-premium-ai-seed` (empresa premium)
- `pizzaria-bella-ai-seed` (empresa gastronômica)
- `eletricista-ai-seed` (profissional eletricista)

⏳ **Falta adicionar:**
- Profissional encanador

### SQL para Adicionar Encanador

Execute no Supabase SQL Editor:

```sql
-- Verificar se encanador já existe
SELECT professional_name, slug, service_category, location_id, is_accepting_clients
FROM professional_data
WHERE slug LIKE '%encanador%'
  AND location_id = '384add59-4e53-489d-a7b5-97dea2b3f442';

-- Se não existir, criar encanador
INSERT INTO professional_data (
  id,
  profile_id,
  professional_name,
  slug,
  service_category,
  location_id,
  is_accepting_clients,
  phone,
  metadata,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE username = 'encanador-carlos-test' LIMIT 1),
  'Carlos Santos - Encanador',
  'encanador-carlos-ai-seed',
  'Encanador',
  '384add59-4e53-489d-a7b5-97dea2b3f442',
  true,
  '(71) 9999-7777',
  jsonb_build_object(
    'latitude', -12.9978,
    'longitude', -38.4503
  ),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM professional_data 
  WHERE slug = 'encanador-carlos-ai-seed'
);

-- Verificar criação
SELECT professional_name, slug, service_category, location_id, is_accepting_clients
FROM professional_data
WHERE location_id = '384add59-4e53-489d-a7b5-97dea2b3f442'
ORDER BY professional_name;
```

**Resultado esperado:**
```
Carlos Santos - Encanador | encanador-carlos-ai-seed | Encanador | 384add59-... | true
João Silva - Eletricista | eletricista-ai-seed | Eletricista | 384add59-... | true
```

---

## 📋 PASSO 3: Validar Programaticamente

### Executar Validação

```bash
node scripts/validate-ai-phase1.mjs
```

**Resultado esperado:**
```
✅ RPC Geoespacial: ✅
✅ Busca de Profissionais: ✅
✅ Busca de Empresas: ✅
✅ Perfis Gastronômicos: ✅
```

**Confirmar:**
- ✅ Schema cache resolvido (sem erro "table not found")
- ✅ RPC sem erro de tipo
- ✅ `business_search` retorna dados reais (3 empresas)
- ✅ `service_search` retorna eletricista e encanador (2 profissionais)
- ✅ `unknown` não executa handler de busca

---

## 📋 PASSO 4: Testar Manualmente em `/buscar`

### Queries Obrigatórias

| # | Query | Intent Esperado | Resultados Esperados |
|---|-------|----------------|---------------------|
| 1 | "pizzaria barata com delivery" | business_search | Pizzaria Bella |
| 2 | "restaurante aberto agora" | business_search | 0-1 (pode não ter) |
| 3 | "eletricista perto de mim" | service_search | João Silva |
| 4 | "encanador urgente" | service_search | Carlos Santos |
| 5 | "empresa no meu bairro" | business_search | 3 empresas |
| 6 | "me conte uma piada" | unknown | Mensagem amigável |

### Template de Registro

Para cada query, registrar:

```
Query: [QUERY]
Intent: [business_search/service_search/unknown]
Handler: [SearchBusinessesActionHandler/SearchProfessionalsActionHandler/nenhum]
Quantidade: [NÚMERO]
Títulos: [LISTAR]
URLs: [LISTAR]
Abriu: [SIM/NÃO]
```

---

## 📋 PASSO 5: Validar URLs

### Regras de URL

| Tipo | Condição | URL Esperada |
|------|----------|--------------|
| Premium | `is_premium = true` | `/p/:slug` |
| Gastronômica | Perfil ativo e principal | `/gastronomia/:state/:city/:neighborhood/:slug` |
| Comum | Nenhuma das anteriores | `/empresas/:state/:city/:neighborhood/:slug` |
| Profissional | - | `/profissionais/:slug` |

### Validação Esperada

1. **Consultoria Premium**
   - URL: `/p/consultoria-premium-ai-seed`
   - Abre: ✅

2. **Pizzaria Bella**
   - URL: `/gastronomia/ba/salvador/pituba/pizzaria-bella-ai-seed`
   - Abre: ✅

3. **Mercadinho**
   - URL: `/empresas/ba/salvador/pituba/mercadinho-pituba-ai-seed`
   - Abre: ✅

4. **Eletricista**
   - URL: `/profissionais/eletricista-ai-seed`
   - Abre: ✅

5. **Encanador**
   - URL: `/profissionais/encanador-carlos-ai-seed`
   - Abre: ✅

---

## 📋 PASSO 6: Gates Finais

### Executar

```bash
npm run lint -- --max-warnings=0
npm run typecheck
npm run build
```

**Resultado esperado:**
```
✅ Lint: 0 warnings
✅ Typecheck: 0 erros
✅ Build: Compilação completa
```

---

## 🎯 Critérios de Aprovação

### ✅ APROVADA TECNICAMENTE

Se todos forem verdadeiros:
- [x] Schema cache resolvido
- [x] Validação programática passa
- [x] Gates passando (lint, typecheck, build)
- [x] RPC geoespacial funcionando
- [x] Código 100% implementado

### ✅ APROVADA COMO PRODUTO

Se todos forem verdadeiros:
- [ ] Pelo menos 4/6 queries retornam resultados úteis
- [ ] URLs seguem as regras corretas
- [ ] URLs abrem corretamente
- [ ] Sem erros SQL em produção
- [ ] Empty states são válidos (0 resultados não é erro)

---

## 📊 Checklist de Execução

### Passo 1: Schema Cache
- [ ] Executar `NOTIFY pgrst, 'reload schema';`
- [ ] Verificar `pg_notification_queue_usage()`
- [ ] Confirmar sem erros

### Passo 2: Seed Completo
- [ ] Verificar se encanador existe
- [ ] Criar encanador se não existir
- [ ] Confirmar 2 profissionais na Pituba

### Passo 3: Validação Programática
- [ ] Executar `node scripts/validate-ai-phase1.mjs`
- [ ] Confirmar todos os testes passam
- [ ] Confirmar dados reais retornados

### Passo 4: Teste Manual
- [ ] Testar 6 queries em `/buscar`
- [ ] Registrar resultados de cada query
- [ ] Confirmar pelo menos 4/6 funcionam

### Passo 5: URLs
- [ ] Validar 5 URLs
- [ ] Confirmar regras corretas
- [ ] Confirmar todas abrem

### Passo 6: Gates
- [ ] Lint passa
- [ ] Typecheck passa
- [ ] Build passa

---

## 📝 Relatório Final Esperado

Após completar todos os passos, criar relatório com:

```markdown
# RELATÓRIO FINAL - FASE 1 IA TRANSVERSAL

## Status: [APROVADA TECNICAMENTE / APROVADA COMO PRODUTO / REPROVADA]

## Schema Cache
- [x] Resolvido

## Seed Completo
- [x] 3 empresas
- [x] 2 profissionais

## Validação Programática
- [x] Todos os testes passam

## Queries Manuais
- Query 1: [RESULTADO]
- Query 2: [RESULTADO]
- Query 3: [RESULTADO]
- Query 4: [RESULTADO]
- Query 5: [RESULTADO]
- Query 6: [RESULTADO]

## URLs
- Premium: [✅/❌]
- Gastronômica: [✅/❌]
- Comum: [✅/❌]
- Profissional: [✅/❌]

## Gates
- Lint: [✅/❌]
- Typecheck: [✅/❌]
- Build: [✅/❌]

## Conclusão
[EXPLICAR]
```

---

**Próximo passo:** Executar Passo 1 (recarregar schema cache)
