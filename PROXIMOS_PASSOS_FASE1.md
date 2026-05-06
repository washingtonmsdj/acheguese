# 🚀 Próximos Passos - Fase 1 IA Transversal

**Situação Atual:** Código pronto, migration não aplicada  
**Objetivo:** Validar e aprovar Fase 1 para produção

---

## ⏱️ Tempo Estimado Total: 20-30 minutos

---

## 📋 Checklist de Ações

### ✅ Passo 1: Aplicar Migration (5 min) - CRÍTICO

**Por que:** RPC geoespacial não funciona sem esta migration

**Como fazer:**

1. Abrir navegador
2. Acessar: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new
3. Abrir arquivo: `supabase/migrations/20260503000000_fix_spatial_search_hybrid_types.sql`
4. Copiar TODO o conteúdo (Ctrl+A, Ctrl+C)
5. Colar no SQL Editor do Supabase (Ctrl+V)
6. Clicar em "Run" (ou Ctrl+Enter)
7. Aguardar mensagem de sucesso

**Verificar sucesso:**

Executar no mesmo SQL Editor:

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

**Resultado esperado:**
- ✅ Query executa sem erro
- ✅ Retorna array (vazio ou com resultados)
- ❌ Se der erro de tipo → migration não foi aplicada corretamente

---

### ✅ Passo 2: Validar Backend (2 min)

**Por que:** Confirmar que todas as correções funcionam

**Como fazer:**

```bash
node scripts/validate-ai-phase1.mjs
```

**Resultado esperado:**

```
🚀 Validação da Fase 1 - IA Transversal

✅ RPC Geoespacial: PASSOU
✅ Busca de Profissionais: PASSOU
✅ Busca de Empresas: PASSOU
✅ Perfis Gastronômicos: PASSOU

✅ Todos os testes passaram!
```

**Se algum teste falhar:**
- RPC Geoespacial → Migration não foi aplicada corretamente
- Busca de Profissionais → Verificar FK no código
- Outros → Verificar logs de erro

---

### ✅ Passo 3: Iniciar Aplicação (1 min)

```bash
npm run dev
```

**Aguardar:**
```
  ➜  Local:   http://localhost:8080/
  ➜  ready in XXXms
```

---

### ✅ Passo 4: Testar Queries em /buscar (10 min)

**Acessar:** http://localhost:8080/buscar

**Testar cada query e registrar:**

#### Query 1: "pizzaria barata com delivery"

- [ ] Intent: `business_search`
- [ ] Handler: `SearchBusinessesActionHandler`
- [ ] Geoespacial: SIM/NÃO
- [ ] Resultados: X empresas
- [ ] Títulos: [listar]
- [ ] URLs: [verificar formato]
- [ ] Erro: SIM/NÃO

#### Query 2: "restaurante aberto agora"

- [ ] Intent: `business_search`
- [ ] Handler: `SearchBusinessesActionHandler`
- [ ] Geoespacial: SIM/NÃO
- [ ] Resultados: X empresas
- [ ] Títulos: [listar]
- [ ] URLs: [verificar formato]
- [ ] Erro: SIM/NÃO

#### Query 3: "eletricista perto de mim"

- [ ] Intent: `service_search`
- [ ] Handler: `SearchServicesActionHandler`
- [ ] Geoespacial: SIM/NÃO
- [ ] Resultados: X profissionais
- [ ] Títulos: [listar]
- [ ] URLs: [verificar formato]
- [ ] Erro: SIM/NÃO

#### Query 4: "encanador urgente"

- [ ] Intent: `service_search`
- [ ] Handler: `SearchServicesActionHandler`
- [ ] Geoespacial: SIM/NÃO
- [ ] Resultados: X profissionais
- [ ] Títulos: [listar]
- [ ] URLs: [verificar formato]
- [ ] Erro: SIM/NÃO

#### Query 5: "empresa no meu bairro"

- [ ] Intent: `business_search`
- [ ] Handler: `SearchBusinessesActionHandler`
- [ ] Geoespacial: SIM/NÃO
- [ ] Resultados: X empresas
- [ ] Títulos: [listar]
- [ ] URLs: [verificar formato]
- [ ] Erro: SIM/NÃO

#### Query 6: "me conte uma piada"

- [ ] Intent: `unknown`
- [ ] Handler: nenhum
- [ ] Mensagem: "Desculpe, não entendi..."
- [ ] Erro: SIM/NÃO

---

### ✅ Passo 5: Verificar URLs (5 min)

**Para cada resultado, verificar formato da URL:**

#### Empresa Premium
- [ ] URL: `/p/:slug`
- [ ] Exemplo: `/p/restaurante-premium`
- [ ] Link funciona: SIM/NÃO

#### Restaurante com Gastronomia
- [ ] URL: `/gastronomia/ba/salvador/pituba/:slug`
- [ ] Exemplo: `/gastronomia/ba/salvador/pituba/pizzaria-central`
- [ ] Link funciona: SIM/NÃO

#### Empresa Comum
- [ ] URL: `/empresas/ba/salvador/pituba/:slug`
- [ ] Exemplo: `/empresas/ba/salvador/pituba/loja-comum`
- [ ] Link funciona: SIM/NÃO

---

### ✅ Passo 6: Executar Build (2 min)

```bash
npm run build
```

**Resultado esperado:**
```
✓ built in XXXs
```

**Se falhar:**
- Verificar erros de TypeScript
- Verificar imports faltando
- Corrigir e tentar novamente

---

### ✅ Passo 7: Documentar Resultados (5 min)

**Criar arquivo:** `VALIDACAO_COMPLETA_FASE1.md`

**Conteúdo mínimo:**

```markdown
# Validação Completa - Fase 1 IA Transversal

Data: [data]
Executor: [nome]

## Migration Aplicada
- [x] Migration aplicada via Supabase Dashboard
- [x] RPC funciona sem erro

## Validação Backend
- [x] RPC Geoespacial: PASSOU
- [x] Busca de Profissionais: PASSOU
- [x] Busca de Empresas: PASSOU
- [x] Perfis Gastronômicos: PASSOU

## Queries Testadas

### 1. pizzaria barata com delivery
- Intent: business_search
- Resultados: X
- URLs: [formato correto]

[... repetir para todas as 6 queries]

## URLs Validadas
- [x] Premium: /p/:slug
- [x] Gastronomia: /gastronomia/...
- [x] Comum: /empresas/...

## Gates
- [x] Lint: PASSOU
- [x] Typecheck: PASSOU
- [x] Build: PASSOU

## Conclusão
✅ Fase 1 PRONTA PARA PRODUÇÃO
```

---

## 🎯 Critérios de Aprovação

Para aprovar Fase 1, TODOS devem estar ✅:

- [ ] Migration aplicada no banco
- [ ] RPC funciona sem erro
- [ ] Script de validação passa
- [ ] 6 queries testadas em /buscar
- [ ] URLs corretas validadas
- [ ] Lint, typecheck e build passam
- [ ] Resultados documentados

---

## ⚠️ Problemas Comuns

### Problema 1: RPC ainda dá erro de tipo

**Causa:** Migration não foi aplicada corretamente

**Solução:**
1. Verificar no Supabase Dashboard se a função existe
2. Executar: `DROP FUNCTION IF EXISTS search_entities_hybrid;`
3. Re-executar a migration completa

---

### Problema 2: Nenhum resultado em /buscar

**Causa:** Não há dados na Pituba

**Solução:**
1. Usar outra location_id com dados
2. OU criar dados de teste
3. OU aceitar empty state como válido

---

### Problema 3: URLs incorretas

**Causa:** Cache do navegador

**Solução:**
1. Abrir DevTools (F12)
2. Application → Clear storage
3. Recarregar página (Ctrl+Shift+R)

---

### Problema 4: Build falha

**Causa:** Erro de TypeScript

**Solução:**
1. Executar: `npm run typecheck`
2. Corrigir erros mostrados
3. Tentar build novamente

---

## 📊 Progresso Esperado

### Após Passo 1 (Migration)
- ✅ RPC funciona
- ⏳ Validação pendente

### Após Passo 2 (Validação Backend)
- ✅ RPC funciona
- ✅ Backend validado
- ⏳ /buscar pendente

### Após Passo 4 (Queries)
- ✅ RPC funciona
- ✅ Backend validado
- ✅ /buscar testado
- ⏳ Documentação pendente

### Após Passo 7 (Documentação)
- ✅ Tudo completo
- ✅ Pronto para produção

---

## 🎉 Ao Finalizar

**Se todos os passos passaram:**

1. Commit das mudanças
2. Push para repositório
3. Criar PR (se aplicável)
4. Deploy para staging
5. Testar em staging
6. Deploy para produção

**Comandos:**

```bash
git add .
git commit -m "feat: Fase 1 IA transversal validada e pronta"
git push origin main
```

---

## 📞 Suporte

**Se encontrar problemas:**

1. Consultar: `RELATORIO_VALIDACAO_FINAL_FASE1.md`
2. Consultar: `APLICAR_CORRECOES.md`
3. Verificar logs do Supabase
4. Verificar console do navegador

---

**Boa sorte! 🚀**

A Fase 1 está 95% pronta. Falta apenas aplicar a migration e validar!
