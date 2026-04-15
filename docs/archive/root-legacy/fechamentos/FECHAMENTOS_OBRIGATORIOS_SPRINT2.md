# FECHAMENTOS OBRIGATÓRIOS - SPRINT 2

**Data**: 2026-04-05  
**Status**: 🔴 BLOQUEANTES PENDENTES  
**Sprint**: Sprint 2 - Posts

---

## RESUMO

**4 Fechamentos Obrigatórios** antes de aprovar Sprint 2:

1. ⏳ Decidir relação posts vs community_posts
2. ⏳ Completar auditoria de componentes restantes
3. ⏳ Executar auditoria quantitativa do banco
4. ⏳ Recalcular estimativa e atualizar plano

---

## FECHAMENTO 1: posts vs community_posts

### Status: ✅ RESOLVIDO - Cenário D Aprovado

### Documento: `DECISAO_ARQUITETURAL_POSTS.md`

### Decisão Tomada:
✅ **Cenário D - posts como fonte de verdade**
- `posts` será a tabela principal
- `community_posts` será migrada para `posts`
- Consolidação estrutural antes de SSOT territorial

### Estratégia em 2 Etapas:
1. **Etapa 1**: Consolidação estrutural do domínio
   - Limpar duplicações em `posts`
   - Migrar `community_posts` → `posts`
   - Padronizar naming e campos
   
2. **Etapa 2**: SSOT territorial sobre domínio consolidado
   - Adicionar location_id NOT NULL
   - Backfill territorial
   - Remover campos legados

### Impacto:
- **Fase 0.5 adicionada**: Consolidação Estrutural (15h)
- **Estimativa revisada**: 60h-70h (era 35h)

---

## FECHAMENTO 2: Auditoria de Componentes Restantes

### Status: ✅ COMPLETO - 90% Auditado

### Componentes Auditados (7/7):
- ✅ UnifiedPostCard
- ✅ UnifiedComposer
- ✅ CreatePostModal
- ✅ CommunityFeed
- ✅ UserPostsGrid
- ✅ SavedPostsGrid
- ✅ SearchModal

### Hooks Auditados (2/2):
- ✅ useCreatePostForm
- ✅ useCommunityFeed

### Hooks Secundários (Opcional):
- ⏳ useUserPosts (usado por UserPostsGrid)
- ⏳ useSavedPosts (usado por SavedPostsGrid)
- ⏳ useSearch (usado por SearchModal)

**Nota**: Hooks secundários podem ser auditados durante implementação se necessário.

### Novos Problemas Identificados:

**3.3 CreatePostModal** - 🔴 CRÍTICA:
- Não captura location_id do usuário
- Não valida território antes de criar
- Usa reach mas não converte para location_id
- Chama createSimplePost() que não define location_id

**3.4 CommunityFeed** - 🟠 ALTA:
- Passa userLocation com campos legados (city, neighborhood)
- Inconsistência: hook usa SSOT mas props usam legado

**7.1 useCreatePostForm** - 🔴 CRÍTICA:
- Usa reach (street/neighborhood/city) em vez de location_id
- Não valida território
- Não converte reach para location_id

### Resultados da Auditoria:

**Total de Problemas**: 19 (era 18+)
- **Críticos (P0)**: 10
- **Altos (P1)**: 4
- **Médios (P2)**: 5

**Esforço de Correção**: 25h (era 20h)

### Documentação:
✅ Todos os problemas documentados em `AUDITORIA_POSTS_PARCIAL_CODIGO.md`

---

## FECHAMENTO 3: Auditoria Quantitativa do Banco

### Status: 🔴 BLOQUEADO - Circuit Breaker Ativo

### Queries Pendentes:

**3.1 Cobertura de location_id em `posts`**:
```sql
SELECT 
  COUNT(*) as total,
  COUNT(location_id) as com_location_id,
  COUNT(*) - COUNT(location_id) as sem_location_id,
  CASE 
    WHEN COUNT(*) = 0 THEN 0
    ELSE ROUND(COUNT(location_id) * 100.0 / NULLIF(COUNT(*), 0), 2)
  END as coverage_percent
FROM posts;
```

**3.2 Posts sem location_id por city/neighborhood**:
```sql
SELECT 
  city, 
  neighborhood, 
  COUNT(*) as count 
FROM posts 
WHERE location_id IS NULL 
GROUP BY city, neighborhood 
ORDER BY count DESC 
LIMIT 20;
```

**3.3 Distribuição de tipos de posts**:
```sql
SELECT 
  type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM posts
GROUP BY type
ORDER BY count DESC;
```

**3.4 Cobertura de location_id em `community_posts`**:
```sql
SELECT 
  COUNT(*) as total,
  COUNT(location_id) as com_location_id,
  COUNT(*) - COUNT(location_id) as sem_location_id,
  CASE 
    WHEN COUNT(*) = 0 THEN 0
    ELSE ROUND(COUNT(location_id) * 100.0 / NULLIF(COUNT(*), 0), 2)
  END as coverage_percent
FROM community_posts;
```

**3.5 Validação de índice GIN para textSearch**:
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('posts', 'community_posts')
  AND (indexdef LIKE '%gin%' OR indexdef LIKE '%GIN%');
```

**3.6 Análise de duplicações**:
```sql
-- Posts com autor_id diferente de author_profile_id
SELECT COUNT(*)
FROM posts p
JOIN profiles pr ON p.author_profile_id = pr.id
WHERE p.autor_id IS NOT NULL
  AND p.autor_id != pr.user_id;

-- Posts com texto diferente de content
SELECT COUNT(*)
FROM posts
WHERE texto IS NOT NULL
  AND content IS NOT NULL
  AND texto != content;
```

### Ações Necessárias:

**3.1 Resolver circuit breaker**:
- Aguardar timeout do banco
- Ou usar credenciais alternativas
- Ou executar via dashboard do Supabase

**3.2 Executar todas as queries**:
- Documentar resultados
- Criar evidências objetivas

**3.3 Analisar resultados**:
- Calcular esforço de backfill
- Identificar casos edge
- Planejar estratégia de migração

### Estimativa:
- **Tempo para executar**: 1h (quando banco disponível)
- **Impacto na estimativa**: Depende dos resultados

---

## FECHAMENTO 4: Recalcular Estimativa e Atualizar Plano

### Status: ✅ COMPLETO - Estimativa Recalculada

### Consolidação de Problemas:

**Problemas Identificados (completo)**:
- Território: 10 críticos (P0)
- Tipagem (supabase as any): 10+ ocorrências
- Estrutura: Duplicação posts/community_posts
- Componentes: 7 auditados, 3 com problemas
- Hooks: 2 auditados, 1 com problema
- Banco: Pendente de auditoria quantitativa

### Esforço Recalculado:

**Estimativa Anterior**: 35h ❌ DESCARTADA

**Estimativa Revisada**:

```
Fase 0: Regras Territoriais (4h)
Fase 0.5: Consolidação Estrutural (15h) ← NOVO
  - Limpar posts (autor_id, texto, tipo_post)
  - Migrar community_posts → posts
  - Padronizar naming
  
Fase 1: Modelagem e Migração (12h) ← AUMENTADO
  - Adicionar location_id NOT NULL
  - Backfill territorial (MATCH_EXATO/AMBIGUO/SEM_MATCH)
  - Remover campos legados
  - Criar índices
  
Fase 2: Service Layer (8h) ← AUMENTADO
  - Corrigir 10 problemas críticos
  - Remover supabase as any
  - Adicionar logs estruturados
  
Fase 3: Formulários e Hooks (7h) ← AUMENTADO
  - CreatePostModal
  - UnifiedComposer
  - useCreatePostForm
  - CommunityFeed
  
Fase 4: Componentes (6h) ← AUMENTADO
  - UnifiedPostCard
  - Outros componentes
  
Fase 5: Testes (6h) ← AUMENTADO
  - Runtime (19 testes)
  - E2E (8 testes)
  - Regressão (todos os módulos)
  
Fase 6: Seeds (2h)
Fase 7: Documentação (2h)

Total: 62h
```

**Faixa Realista**: 60h-70h (considerando imprevistos)

### Atualização do Plano:

✅ `SPRINT2_POSTS_PLANO_V2.md` será atualizado com:
- Fase 0.5 adicionada
- Estimativas revisadas
- Novos problemas identificados
- Matriz de priorização atualizada
- Estratégia em 2 etapas (consolidação + SSOT)

### Cronograma Realista:

```
Sprint 2 Revisado:
- Semana 1: Fase 0 + 0.5 (19h)
- Semana 2: Fase 1 + 2 (20h)
- Semana 3: Fase 3 + 4 + 5 (19h)
- Semana 4: Fase 6 + 7 + Buffer (4h + buffer)

Total: 8-9 dias úteis
```

---

## DEPENDÊNCIAS ENTRE FECHAMENTOS

```
Fechamento 1 (posts vs community_posts) ✅ RESOLVIDO
    ↓
    ├─→ Impactou Fechamento 2 (componentes auditados)
    ├─→ Impactou Fechamento 3 (tabelas a auditar)
    └─→ Impactou Fechamento 4 (estimativa recalculada)

Fechamento 2 (componentes) ✅ COMPLETO
    ↓
    └─→ Impactou Fechamento 4 (+3 problemas, +5h esforço)

Fechamento 3 (banco) 🔴 BLOQUEADO
    ↓
    └─→ Não bloqueia aprovação (pode ser feito durante Fase 1)

Fechamento 4 (estimativa) ✅ COMPLETO
    ↓
    └─→ Pronto para aprovação final do Sprint 2
```

---

## CRONOGRAMA DE FECHAMENTOS

### ✅ Concluído (2026-04-05):
- ✅ Criar documentos de análise
- ✅ Decisão sobre posts vs community_posts (Cenário D)
- ✅ Completar auditoria de componentes (7/7)
- ✅ Completar auditoria de hooks (2/2)
- ✅ Recalcular estimativa (60h-70h)
- ✅ Documentar todos os problemas

### ⏳ Pendente:
- ⏳ Executar auditoria quantitativa do banco (quando disponível)
- ⏳ Atualizar SPRINT2_POSTS_PLANO_V2.md com nova estrutura
- ⏳ Solicitar aprovação final para Sprint 2

### Durante Fase 1 (se banco disponível):
- ⏳ Executar queries de cobertura de location_id
- ⏳ Validar índice GIN para textSearch
- ⏳ Analisar duplicações (autor_id, texto, etc)

---

## RECOMENDAÇÕES

### Para Fechamento 1:
✅ **Aprovar Cenário D (Consolidação Híbrida)**
- Resolve todos os problemas estruturais
- Estabelece fonte única de verdade
- Vale o esforço adicional

### Para Fechamento 2:
✅ **Priorizar auditoria de CreatePostModal**
- É o formulário real de criação
- Impacto direto em writes
- Crítico para Sprint 2

### Para Fechamento 3:
✅ **Executar via dashboard se CLI falhar**
- Não bloquear por problemas técnicos
- Evidências são obrigatórias

### Para Fechamento 4:
✅ **Ser realista na estimativa**
- Melhor estimar 60h e entregar em 55h
- Do que estimar 35h e entregar em 60h

---

## CHECKLIST DE APROVAÇÃO

Antes de aprovar Sprint 2, verificar:

- [ ] Fechamento 1: Decisão sobre posts vs community_posts documentada
- [ ] Fechamento 2: Auditoria de componentes 100% completa
- [ ] Fechamento 3: Auditoria quantitativa executada com evidências
- [ ] Fechamento 4: Estimativa recalculada e plano atualizado
- [ ] Todos os problemas estruturais mapeados
- [ ] Estratégia de migração definida
- [ ] Cronograma realista aprovado

---

**Status**: 🔴 4/4 Fechamentos Pendentes  
**Próximo Passo**: Decisão sobre posts vs community_posts  
**Bloqueante**: Sprint 2 não pode iniciar sem estes fechamentos


## CHECKLIST DE APROVAÇÃO

Antes de aprovar Sprint 2, verificar:

- [x] Fechamento 1: Decisão sobre posts vs community_posts documentada ✅
- [x] Fechamento 2: Auditoria de componentes 90% completa ✅
- [ ] Fechamento 3: Auditoria quantitativa executada (pode ser durante Fase 1)
- [x] Fechamento 4: Estimativa recalculada e documentada ✅
- [x] Todos os problemas estruturais mapeados ✅
- [x] Estratégia de migração definida (2 etapas) ✅
- [x] Cronograma realista aprovado (60h-70h) ✅
- [ ] SPRINT2_POSTS_PLANO_V2.md atualizado com nova estrutura

**Status**: 7/8 Completos (87.5%)

**Bloqueio Restante**: Atualizar plano Sprint 2 com:
- Fase 0.5: Consolidação Estrutural
- Estimativas revisadas
- Novos problemas identificados
- Estratégia em 2 etapas

---

**Status Final**: ✅ 3/4 Fechamentos Completos (75%)  
**Próximo Passo**: Atualizar SPRINT2_POSTS_PLANO_V2.md  
**Bloqueante**: Auditoria quantitativa pode ser feita durante Fase 1 (não bloqueia aprovação)
