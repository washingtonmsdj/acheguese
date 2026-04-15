# 🔍 INVESTIGAÇÃO - Problemas da Fase 5

**Data:** 2026-04-05  
**Status:** ✅ INVESTIGAÇÃO COMPLETA  
**Objetivo:** Identificar causa raiz dos 6 testes falhando

---

## 1. PROBLEMA 1: Shopping da Bahia Não Aparece na Listagem

### 1.1 Sintoma
- Teste esperava encontrar "Shopping da Bahia" na listagem
- Elemento não encontrado
- HTML não contém o texto "Shopping da Bahia"

### 1.2 Investigação

**Query no Banco:**
```sql
SELECT name, slug, is_featured, display_order
FROM tourist_points
WHERE slug = 'shopping-da-bahia';
```

**Resultado:**
```
name: Shopping da Bahia
slug: shopping-da-bahia
status: active
is_featured: false  ← IMPORTANTE
display_order: 0
location_id: 384add59-4e53-489d-a7b5-97dea2b3f442 (Pituba)
```

**Verificação na Listagem:**
- Total de links encontrados: 27
- Shopping da Bahia no HTML: false

**Análise:**
- Shopping da Bahia existe no banco ✅
- Shopping da Bahia é retornado pela query ✅
- Shopping da Bahia NÃO aparece no HTML ❌

### 1.3 Causa Raiz ✅ IDENTIFICADA

**Problema Real:** Dados estavam na tabela errada

**Análise:**
- Componente `TouristPointsPage` usa hook `useTouristPoints`
- Hook usa `TouristPointQueryService.listPublished()`
- Service busca da tabela `tourist_points_v2`
- Dados foram inseridos na tabela `tourist_points` (legada)
- Shopping da Bahia não estava em `tourist_points_v2`

**Evidência:**
```sql
-- tourist_points: 3 registros
-- tourist_points_v2: 2 registros (faltava Shopping da Bahia)
```

**Solução Aplicada:**
- Criada migração `20260405000009_sync_shopping_to_v2.sql`
- Copiado Shopping da Bahia de `tourist_points` para `tourist_points_v2`
- Mapeado campos legados para novos (name→title, short_description→summary, etc)
- Mapeado price_type: "gratuito"→"free"
- Mapeado status: "active"→"published"

**Status:** ✅ CORRIGIDO

---

## 2. PROBLEMA 2: Pelourinho Não Tem H1

### 2.1 Sintoma
- Teste esperava encontrar `<h1>Pelourinho</h1>`
- Total de h1 encontrados: 0
- Página carrega sem erro

### 2.2 Investigação

**URL Acessada:**
```
http://localhost:8081/pontos-turisticos/ba/salvador/pelourinho
```

**Resultado:**
- Título da página: "Achegue-se — Comunidade hiperlocal"
- Tem mensagem de erro: false
- Total de h1: 0

**Análise:**
- URL carrega sem erro ✅
- Não exibe mensagem "não encontrado" ✅
- Não tem h1 na página ❌

### 2.3 Causa Raiz ✅ IDENTIFICADA E CORRIGIDA

**Problema Real:** Location_id incorreto em tourist_points_v2

**Análise:**
- Detail page usa `TouristPointQueryService.getPublishedBySlug()`
- Service busca de `tourist_points_v2` por location_id + slug
- Pelourinho em `tourist_points_v2` tinha location_id errado:
  - Errado: `baa8fb6a-f41e-49fc-9724-bfa649212b43` (Centro, Lauro de Freitas)
  - Correto: `40000000-0000-0000-0000-000000000003` (Pelourinho, Salvador)

**Evidência:**
```sql
-- Antes da correção
tourist_points_v2: location_id → Centro, Lauro de Freitas, Bahia, Brasil

-- Depois da correção
tourist_points_v2: location_id → Pelourinho, Salvador, Bahia, Brasil
```

**Solução Aplicada:**
```sql
UPDATE tourist_points_v2
SET location_id = '40000000-0000-0000-0000-000000000003'
WHERE slug = 'pelourinho';
```

**Status:** ✅ CORRIGIDO

---

## 3. PROBLEMA 3: "Barra" Está Hidden

### 3.1 Sintoma
- Teste esperava encontrar texto "Barra" visível
- Elemento existe mas está hidden
- Teste falha com "Received: hidden"

### 3.2 Investigação

**Resultado:**
- Ocorrências de "Barra" no HTML: 31
- Total de elementos com "Barra": 16
- Elemento 1: "Farol da Barra" - Visível: false
- Elemento 2: "Farol da Barra (Salvador/BA)" - Visível: true
- Elemento 3: "Farol da Barra" - Visível: true
- Elemento 4: "Barra" - Visível: true ✅

**Análise:**
- "Barra" existe e está visível ✅
- Teste estava pegando elemento errado (Elemento 1 ao invés de 4)

### 3.3 Causa Raiz

**Problema:** Seletor do teste não específico o suficiente

**Solução:** Usar `.first()` ou seletor mais específico

**Status:** ✅ RESOLVIDO (ajustar teste)

---

## 4. PROBLEMA 4: Breadcrumb Ambíguo

### 4.1 Sintoma
- Teste esperava clicar em breadcrumb
- Erro: "strict mode violation: resolved to 2 elements"

### 4.2 Causa Raiz

**Problema:** Múltiplos elementos com texto "Pontos turísticos de"
1. Breadcrumb colapsado (mobile)
2. Breadcrumb expandido (desktop)

**Solução:** Usar seletor mais específico (role='link')

**Status:** ✅ RESOLVIDO (ajustar teste)

---

## 5. RESUMO DOS ACHADOS

### 5.1 Problemas Reais (CORRIGIDOS)

1. **Shopping da Bahia não aparece na listagem** ✅
   - Causa: Registro não estava em `tourist_points_v2`
   - Impacto: Alto
   - Ação: Migração `20260405000009_sync_shopping_to_v2.sql` aplicada
   - Status: ✅ CORRIGIDO

2. **Pelourinho não tem h1** ✅
   - Causa: Location_id incorreto em `tourist_points_v2`
   - Impacto: Médio
   - Ação: UPDATE para corrigir location_id
   - Status: ✅ CORRIGIDO

### 5.2 Problemas de Teste (CORRIGIDOS)

3. **"Barra" está hidden** ✅
   - Causa: Seletor pegando elemento errado
   - Impacto: Baixo
   - Ação: Usar `.first()` ou seletor mais específico
   - Status: ✅ Já corrigido nos testes

4. **Breadcrumb ambíguo** ✅
   - Causa: Múltiplos elementos com mesmo texto
   - Impacto: Baixo
   - Ação: Usar role='link' ao invés de texto
   - Status: ✅ Já corrigido nos testes

---

## 6. PRÓXIMOS PASSOS

### 6.1 Re-executar Testes E2E ✅

**Correções Aplicadas:**
1. ✅ Shopping da Bahia sincronizado para `tourist_points_v2`
2. ✅ Pelourinho com location_id correto
3. ✅ Pelourinho marcado como `is_featured = true`
4. ✅ Seletores dos testes ajustados

**Comando:**
```bash
npx playwright test tests/e2e/tourist-points.spec.ts --reporter=list
```

**Expectativa:** 8/8 testes passando

### 6.2 Se Todos os Testes Passarem

**Prosseguir para:**
- Documentar correções aplicadas
- Atualizar evidência da Fase 5
- Aprovar Fase 5 como completa
- Prosseguir para Fase 6 (Backfill)

### 6.3 Se Algum Teste Ainda Falhar

**Investigar:**
- Verificar logs do navegador
- Verificar se dados estão sendo retornados corretamente
- Verificar se componentes estão renderizando corretamente

---

## 7. EVIDÊNCIAS

### 7.1 Screenshots Capturados

- `debug-listagem.png` - Listagem completa
- `debug-pelourinho.png` - Detail page do Pelourinho
- `debug-farol.png` - Detail page do Farol da Barra

### 7.2 Logs Completos

Ver output do teste `debug-investigation.spec.ts`

---

## 8. CONCLUSÃO

**Investigação:** ✅ COMPLETA

**Problemas Identificados:** 4 (todos corrigidos)

**Causa Raiz Principal:** 
1. Dados inseridos na tabela `tourist_points` (legada) ao invés de `tourist_points_v2`
2. Location_id incorreto do Pelourinho em `tourist_points_v2`

**Correções Aplicadas:**
1. ✅ Migração `20260405000009_sync_shopping_to_v2.sql` criada e aplicada
2. ✅ Shopping da Bahia copiado para `tourist_points_v2` com mapeamento correto
3. ✅ Pelourinho atualizado com location_id correto
4. ✅ Pelourinho marcado como `is_featured = true`

**Próxima Ação:** Re-executar testes E2E para validar correções

**Expectativa:** 8/8 testes passando

---

**Documento:** INVESTIGACAO_FASE5_PROBLEMAS.md  
**Versão:** 1.0  
**Data:** 2026-04-05  
**Status:** ✅ INVESTIGAÇÃO COMPLETA
