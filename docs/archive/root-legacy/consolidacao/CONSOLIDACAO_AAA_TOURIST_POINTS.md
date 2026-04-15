# ✅ CONSOLIDAÇÃO AAA - tourist_points

**Data:** 2026-04-05  
**Status:** 🔄 EM PROGRESSO  
**Objetivo:** Consolidar tourist_points e tourist_points_v2 em uma única tabela seguindo SSOT

---

## 1. PROBLEMA IDENTIFICADO

### 1.1 Situação Anterior
- Dados fragmentados entre `tourist_points` (legada) e `tourist_points_v2` (nova)
- Aplicação buscava de `tourist_points_v2`
- Alguns dados estavam apenas em `tourist_points`
- Duplicação de estrutura e lógica

### 1.2 Decisão AAA
**Seguir SSOT - Remover duplicatas**
- Priorizar nomenclatura original: `tourist_points`
- Mesclar estrutura SSOT de `tourist_points_v2` em `tourist_points`
- Remover `tourist_points_v2` após consolidação

---

## 2. CORREÇÕES APLICADAS

### 2.1 Migração: Consolidação da Tabela

**Arquivo:** `supabase/migrations/20260405000010_consolidate_tourist_points_ssot.sql`

**Ações:**
1. ✅ Backup da tabela original
2. ✅ Adicionar colunas SSOT faltantes em `tourist_points`
3. ✅ Migrar dados de colunas legadas para SSOT
4. ✅ Atualizar constraints para aceitar valores SSOT temporariamente
5. ✅ Migrar dados de `tourist_points_v2` para `tourist_points`
6. ✅ Normalizar valores (price_type, status) para SSOT
7. ✅ Atualizar constraints finais (apenas valores SSOT)
8. ✅ Criar índices SSOT
9. ✅ Remover `tourist_points_v2`

**Resultado:**
```sql
-- Antes
tourist_points: 3 registros (estrutura legada)
tourist_points_v2: 2 registros (estrutura SSOT)

-- Depois
tourist_points: 4 registros (estrutura SSOT completa)
tourist_points_v2: removida
```

### 2.2 Atualização: Referências no Código

**Arquivos Atualizados:**
1. ✅ `src/modules/guide/services/TouristPointQueryService.ts`
   - 6 referências de `tourist_points_v2` → `tourist_points`
2. ✅ `src/modules/guide/services/TouristPointService.ts`
   - 8 referências de `tourist_points_v2` → `tourist_points`

### 2.3 Correção: Foreign Key de tourist_point_media

**Arquivo:** `supabase/migrations/20260405000011_fix_tourist_point_media_fkey.sql`

**Problema:**
- `tourist_point_media` ainda referenciava `tourist_points_v2`
- Causava erro 400 na API: "Could not find a relationship"

**Solução:**
- Remover constraint antiga
- Adicionar nova constraint referenciando `tourist_points`

**Resultado:**
```
✅ Erro 400 resolvido
✅ API retorna 200
✅ Relacionamento funcionando
```

### 2.4 Regeneração de Tipos

**Comando:**
```bash
npx supabase gen types typescript --linked > src/integrations/supabase/types.generated.ts
```

**Resultado:**
- ✅ Tipos atualizados para refletir estrutura consolidada
- ✅ Referências a `tourist_points_v2` removidas dos tipos

---

## 3. VALIDAÇÃO

### 3.1 Dados no Banco ✅

**Query:**
```sql
SELECT t.title, t.slug, t.location_id, l.name as location_name, t.is_featured, t.status 
FROM tourist_points t 
LEFT JOIN locations l ON l.id = t.location_id 
WHERE t.slug IN ('farol-da-barra', 'pelourinho', 'shopping-da-bahia') 
ORDER BY t.title;
```

**Resultado:**
```
┌───────────────────┬───────────────────┬──────────────────────────────────────┬───────────────┬─────────────┬───────────┐
│       title       │       slug        │             location_id              │ location_name │ is_featured │  status   │
├───────────────────┼───────────────────┼──────────────────────────────────────┼───────────────┼─────────────┼───────────┤
│ Farol da Barra    │ farol-da-barra    │ 5c91b9e1-17bf-4707-9ba7-0dd82ada7eb3 │ Barra         │ true        │ published │
│ Pelourinho        │ pelourinho        │ 40000000-0000-0000-0000-000000000003 │ Pelourinho    │ true        │ published │
│ Shopping da Bahia │ shopping-da-bahia │ 384add59-4e53-489d-a7b5-97dea2b3f442 │ Pituba        │ false       │ published │
└───────────────────┴───────────────────┴──────────────────────────────────────┴───────────────┴─────────────┴───────────┘
```

✅ Todos os 3 pontos turísticos de teste estão na tabela consolidada  
✅ Todos com status `published`  
✅ Todos com location_id correto (distritos de Salvador)

### 3.2 Foreign Key ✅

**Query:**
```sql
SELECT 'tourist_point_media' as table_name,
       COUNT(*) as total_records,
       COUNT(DISTINCT tourist_point_id) as unique_tourist_points
FROM tourist_point_media;
```

**Resultado:**
```
┌─────────────────────┬───────────────┬───────────────────────┐
│     table_name      │ total_records │ unique_tourist_points │
├─────────────────────┼───────────────┼───────────────────────┤
│ tourist_point_media │ 4             │ 3                     │
└─────────────────────┴───────────────┴───────────────────────┘
```

✅ Foreign key funcionando  
✅ 4 registros de mídia para 3 pontos turísticos

### 3.3 API ✅

**Teste:** `tests/e2e/debug-api-error.spec.ts`

**Resultado:**
```
✅ Nenhum erro 400
✅ API retorna 200
✅ Relacionamento com locations funcionando
✅ Relacionamento com tourist_point_media funcionando
```

### 3.4 Query Completa no Banco ✅

**Query:**
```sql
SELECT t.title, t.slug 
FROM tourist_points t 
WHERE t.location_id IN (
  SELECT id FROM locations 
  WHERE parent_id = '63c41c29-adce-40f5-a552-e52d176123c3' 
  AND type = 'district' 
  AND status = 'active'
) 
AND t.status = 'published' 
ORDER BY t.is_featured DESC, t.published_at DESC;
```

**Resultado:**
```
┌─────────────────────────┬──────────────────────┐
│          title          │         slug         │
├─────────────────────────┼──────────────────────┤
│ Praia do Porto da Barra │ praia-porto-da-barra │
│ Farol da Barra          │ farol-da-barra       │
│ Pelourinho              │ pelourinho           │
│ Shopping da Bahia       │ shopping-da-bahia    │
└─────────────────────────┴──────────────────────┘
```

✅ Query retorna 4 pontos turísticos (incluindo os 3 de teste)  
✅ Ordenação correta (is_featured DESC, published_at DESC)

### 3.5 Testes E2E ⚠️

**Comando:**
```bash
npx playwright test tests/e2e/tourist-points.spec.ts --reporter=list
```

**Resultado:**
```
✅ 4/8 testes passando (50%)
❌ 4/8 testes falhando

Testes Passando:
✓ 4. Detail Page - Reload
✓ 5. Caso Negativo - Slug Inexistente
✓ 6. Caso Negativo - Contexto Territorial Errado
✓ 8. Console Limpo (Sem Erros Críticos)

Testes Falhando:
✗ 1. Listagem de Pontos Turísticos (Shopping da Bahia não aparece)
✗ 2. Detail Page - Farol da Barra (Navegação)
✗ 3. Detail Page - Pelourinho (URL Direta)
✗ 7. Navegação End-to-End
```

**Problema Identificado:**
- API retorna 0 registros na listagem
- Query no banco retorna 4 registros
- Problema está no código do hook ou service

---

## 4. PRÓXIMOS PASSOS

### 4.1 Investigar Hook useTouristPoints

**Hipótese:**
- Hook `useTouristPoints` não está expandindo corretamente o location_id de Salvador
- Ou está usando cache antigo
- Ou há algum problema na lógica de expansão

**Ação:**
1. Adicionar logs no hook para debug
2. Verificar se `expandLocationIds` está sendo chamado
3. Verificar se está retornando os 50 distritos de Salvador
4. Verificar se a query do service está usando os location_ids corretos

### 4.2 Verificar Cache

**Ação:**
1. Limpar cache do navegador
2. Reiniciar servidor de desenvolvimento
3. Re-executar testes

### 4.3 Validar Lógica de Expansão

**Código Atual:**
```typescript
async function expandLocationIds(locationId: string): Promise<string[]> {
  const { data: location } = await supabase
    .from('locations')
    .select('id, type')
    .eq('id', locationId)
    .single();

  if (!location) return [locationId];

  if (location.type === 'district') {
    return [locationId];
  }

  if (location.type === 'city') {
    const { data: districts } = await supabase
      .from('locations')
      .select('id')
      .eq('parent_id', locationId)
      .eq('type', 'district')
      .eq('status', 'active');

    if (districts && districts.length > 0) {
      return districts.map(d => d.id);
    }
  }

  return [locationId];
}
```

**Validação:**
- ✅ Lógica parece correta
- ✅ Query no banco funciona
- ⚠️ Precisa verificar se está sendo executada corretamente no runtime

---

## 5. ARQUIVOS MODIFICADOS

### 5.1 Migrações
- ✅ `supabase/migrations/20260405000010_consolidate_tourist_points_ssot.sql`
- ✅ `supabase/migrations/20260405000011_fix_tourist_point_media_fkey.sql`

### 5.2 Services
- ✅ `src/modules/guide/services/TouristPointQueryService.ts`
- ✅ `src/modules/guide/services/TouristPointService.ts`

### 5.3 Tipos
- ✅ `src/integrations/supabase/types.generated.ts`

### 5.4 Documentação
- ✅ `CONSOLIDACAO_AAA_TOURIST_POINTS.md` (este arquivo)

### 5.5 Testes de Debug
- ✅ `tests/e2e/debug-api-error.spec.ts`
- ✅ `tests/e2e/debug-api-response.spec.ts`

---

## 6. CONCLUSÃO PARCIAL

**Status:** 🔄 EM PROGRESSO

**Progresso:**
- ✅ Consolidação da tabela completa
- ✅ Referências no código atualizadas
- ✅ Foreign key corrigida
- ✅ Tipos regenerados
- ✅ Dados validados no banco
- ✅ API retornando 200 (sem erro 400)
- ⚠️ API retornando 0 registros (problema no código)

**Próxima Ação:**
- Investigar por que a API está retornando 0 registros
- Adicionar logs no hook para debug
- Verificar cache e reiniciar servidor

**Expectativa:**
- Resolver problema de listagem vazia
- 8/8 testes E2E passando
- Fase 5 completa

---

**Documento:** CONSOLIDACAO_AAA_TOURIST_POINTS.md  
**Versão:** 1.0  
**Data:** 2026-04-05  
**Status:** 🔄 EM PROGRESSO - INVESTIGANDO LISTAGEM VAZIA
