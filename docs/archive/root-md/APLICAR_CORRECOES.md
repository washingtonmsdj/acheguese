# 🚀 Como Aplicar as Correções - Fase 1 IA

Guia rápido para aplicar todas as correções da Fase 1 da IA transversal.

---

## ⚡ Quick Start (5 minutos)

```bash
# 1. Aplicar migration no banco local
npx supabase db reset

# 2. Validar backend
node scripts/validate-ai-phase1.mjs

# 3. Iniciar aplicação
npm run dev

# 4. Testar em http://localhost:5173/buscar
```

---

## 📋 Passo a Passo Detalhado

### 1️⃣ Verificar Arquivos Criados/Modificados

**Arquivos que devem existir:**

```
✅ supabase/migrations/20260503000000_fix_spatial_search_hybrid_types.sql
✅ scripts/validate-ai-phase1.mjs
✅ src/core/ai/actions/__tests__/SearchBusinessesActionHandler.spec.ts
✅ RELATORIO_CORRECOES_FASE1_AI.md
✅ RESUMO_CORRECOES_FASE1.md
✅ CHECKLIST_VALIDACAO_FASE1.md
✅ APLICAR_CORRECOES.md (este arquivo)
```

**Arquivos modificados:**

```
✅ src/core/professional/services/professional.queries.ts
✅ src/core/ai/actions/SearchBusinessesActionHandler.ts
```

---

### 2️⃣ Aplicar Migration

#### Opção A: Desenvolvimento Local (Supabase CLI)

```bash
# Reset completo (recomendado)
npx supabase db reset

# OU aplicar apenas a nova migration
npx supabase migration up
```

**Verificar sucesso:**
```bash
npx supabase db diff
# Deve mostrar: "No schema changes detected"
```

#### Opção B: Supabase Remoto (Dashboard)

1. Acessar https://supabase.com/dashboard
2. Selecionar projeto
3. Ir em **SQL Editor**
4. Criar nova query
5. Copiar conteúdo de `supabase/migrations/20260503000000_fix_spatial_search_hybrid_types.sql`
6. Colar e executar
7. Verificar mensagem de sucesso

**Testar RPC:**
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

Deve retornar resultados sem erro.

---

### 3️⃣ Validar Backend

```bash
node scripts/validate-ai-phase1.mjs
```

**Saída esperada:**

```
🚀 Validação da Fase 1 - IA Transversal

📍 Location ID: 384add59-4e53-489d-a7b5-97dea2b3f442 (Pituba)
📍 Coordenadas: -12.9977, -38.4502

🔍 Testando RPC search_entities_hybrid...
✅ RPC funcionou!
   Resultados: X

🔍 Testando busca de profissionais...
✅ Busca de profissionais funcionou!
   Resultados: X

🔍 Testando busca de empresas...
✅ Busca de empresas funcionou!
   Resultados: X

🔍 Testando perfis gastronômicos...
✅ Busca de perfis gastronômicos funcionou!
   Perfis ativos: X de Y empresas

📊 Resumo dos Testes:
   RPC Geoespacial: ✅
   Busca de Profissionais: ✅
   Busca de Empresas: ✅
   Perfis Gastronômicos: ✅

✅ Todos os testes passaram!
```

**Se algum teste falhar:**
- Verificar se migration foi aplicada
- Verificar credenciais em `.env.local`
- Verificar se há dados de teste no banco

---

### 4️⃣ Executar Gates

```bash
# Lint
npm run lint -- --max-warnings=0

# Typecheck
npm run typecheck

# Build (opcional)
npm run build
```

Todos devem passar sem erros.

---

### 5️⃣ Testar na Aplicação

```bash
npm run dev
```

Acessar: http://localhost:5173/buscar

**Queries para testar:**

1. **"pizzaria barata com delivery"**
   - Deve retornar empresas de gastronomia
   - URLs devem ser `/gastronomia/...` se tiver perfil gastronômico

2. **"eletricista perto de mim"**
   - Deve retornar profissionais
   - Sem erro de ambiguidade de FK

3. **"me conte uma piada"**
   - Deve mostrar mensagem de "não entendi"
   - Não deve tentar buscar

---

### 6️⃣ Testar Busca Geoespacial

1. Permitir acesso à localização no navegador
2. Buscar "pizzaria"
3. Abrir DevTools → Console
4. Verificar:
   - `SpatialSearchService.searchHybrid` foi chamado
   - Resultados ordenados por distância
   - Badges mostram distância em km

---

## 🐛 Troubleshooting

### Erro: "RPC search_entities_hybrid does not exist"

**Causa:** Migration não foi aplicada

**Solução:**
```bash
npx supabase db reset
```

---

### Erro: "ambiguous column reference: profiles"

**Causa:** Código antigo ainda em cache

**Solução:**
```bash
# Limpar cache
rm -rf node_modules/.vite
npm run dev
```

---

### Erro: "type mismatch: numeric vs double precision"

**Causa:** Migration antiga ainda ativa

**Solução:**
```bash
# Verificar migrations aplicadas
npx supabase migration list

# Resetar banco
npx supabase db reset
```

---

### Nenhum resultado em /buscar

**Causa:** Não há dados de teste no banco

**Solução:**
```bash
# Criar dados de teste
node scripts/e2e-setup-education.mjs
# OU
# Criar manualmente via dashboard
```

---

### URLs incorretas nos resultados

**Causa:** Cache do navegador

**Solução:**
1. Abrir DevTools
2. Application → Clear storage
3. Recarregar página
4. Testar novamente

---

## 📊 Validação Completa

Use o checklist completo:

```bash
cat CHECKLIST_VALIDACAO_FASE1.md
```

---

## 🚀 Deploy para Produção

### Pré-requisitos

- [ ] Todas as validações locais passaram
- [ ] Código commitado e pushed
- [ ] Migration testada localmente

### Passos

1. **Deploy do código**
   ```bash
   git add .
   git commit -m "fix: corrige bloqueios Fase 1 IA transversal"
   git push origin main
   ```

2. **Aplicar migration em produção**
   - Via Supabase Dashboard
   - SQL Editor
   - Executar `20260503000000_fix_spatial_search_hybrid_types.sql`

3. **Validar em produção**
   ```bash
   # Atualizar .env.local com credenciais de produção
   node scripts/validate-ai-phase1.mjs
   ```

4. **Testar /buscar em produção**
   - Acessar URL de produção
   - Testar queries obrigatórias
   - Verificar URLs geradas

5. **Monitorar**
   - Logs de erro no Supabase
   - Performance das queries
   - Feedback de usuários

---

## 📚 Documentação Adicional

- **Detalhes técnicos:** `RELATORIO_CORRECOES_FASE1_AI.md`
- **Resumo executivo:** `RESUMO_CORRECOES_FASE1.md`
- **Checklist completo:** `CHECKLIST_VALIDACAO_FASE1.md`

---

## ✅ Conclusão

Se todos os passos acima foram executados com sucesso:

🎉 **FASE 1 APLICADA E FUNCIONANDO!**

Próximo passo: Testar com usuários reais e coletar feedback.
