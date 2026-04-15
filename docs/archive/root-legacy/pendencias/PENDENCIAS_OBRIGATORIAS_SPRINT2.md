# PENDÊNCIAS OBRIGATÓRIAS - SPRINT 2 POSTS

**Data**: 2026-04-05  
**Status**: 🔴 NÃO PRONTO PARA IMPLEMENTAÇÃO  
**Auditoria**: 70% completa

---

## RESUMO EXECUTIVO

A auditoria está **madura o suficiente para replanejar**, mas **NÃO para implementar**.

**5 Pendências Obrigatórias** antes de iniciar Sprint 2:

1. ❌ Fechar Fase 0: relação location_id vs reach
2. ❌ Auditar createCommunityPost()
3. ❌ Executar auditoria quantitativa do banco
4. ❌ Confirmar impacto de userLocation legado
5. ❌ Decisão formal: posts como fonte de verdade

---

## PENDÊNCIA 1: Fechar Fase 0 - Regras Territoriais

### Status: ⏳ AGUARDANDO DECISÕES

### Documento: `FASE0_POSTS_REGRAS_TERRITORIAIS.md`

### Decisões Necessárias:

**1.1 Relação location_id vs reach**
- ⏳ Opção A: Remover reach, usar apenas location_id
- ⏳ Opção B: reach como metadado, location_id como território (RECOMENDADO)
- ⏳ Opção C: reach define location_id (conversão)

**Recomendação**: Opção B
- location_id sempre vem do perfil (SSOT)
- reach é metadado de visibilidade/alcance
- Separação clara: território vs visibilidade

**1.2 Níveis territoriais permitidos**
- ⏳ Opção A: Apenas bairros (districts)
- ⏳ Opção B: Bairros e cidades (RECOMENDADO)

**Recomendação**: Opção B
- Suporta usuários sem bairro
- Permite posts de escopo mais amplo
- Consistente com tourist_points

**1.3 Expansão territorial**
- ⏳ Cidade → Cidade + Distritos
- ⏳ Bairro → Bairro + Cidade Pai

**Recomendação**: Implementar ambas

**1.4 Validação e rejeição**
- ⏳ Rejeitar location_id null com erro
- ⏳ Rejeitar location_id inválido com erro
- ⏳ Rejeitar tipo inválido (street) com erro

**Recomendação**: Validação rigorosa desde o início

**1.5 Migração de dados legados**
- ⏳ Match Exato → Automático
- ⏳ Match Ambíguo → Revisão Manual
- ⏳ Sem Match → Cidade (se 1.2 = B) ou Revisão Manual

**Recomendação**: Estratégia em 3 etapas

### Impacto:
- Bloqueia definição de validações
- Bloqueia estratégia de backfill
- Bloqueia correção de formulários

### Ação:
✅ Documento criado: `FASE0_POSTS_REGRAS_TERRITORIAIS.md`
⏳ Aguardando aprovação das 5 decisões

---

## PENDÊNCIA 2: Auditar createCommunityPost()

### Status: ✅ AUDITADO

### Arquivo: `src/core/posts/services/PostService.ts` - Linha 885

### Código Atual:
```typescript
async createCommunityPost(
  data: CreateCommunityPostData,
): Promise<CommunityPost> {
  try {
    const { data: post, error } = await (supabase as any)
      .from("community_posts")  // ❌ Tabela a ser depreciada
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new PostError(error.message, error.code || "CREATE_FAILED");
    }

    return post;
  }
}
```

### Problemas Identificados:
1. ❌ Insere em `community_posts` (tabela a ser depreciada)
2. ❌ Não valida `location_id`
3. ❌ Aceita `data` sem validação territorial
4. ❌ `supabase as any` - sem tipagem
5. ⚠️ Função será obsoleta após migração

### Severidade: 🔴 CRÍTICA

### Correção Necessária:
```typescript
// Após migração community_posts → posts:
// Redirecionar para createPost()

async createCommunityPost(
  data: CreateCommunityPostData,
): Promise<Post> {
  // Validar location_id
  if (!data.location_id) {
    throw new PostError(
      "location_id é obrigatório",
      "LOCATION_REQUIRED"
    );
  }

  // Validar tipo de location
  const location = await getLocationById(data.location_id);
  if (!location || !['city', 'district'].includes(location.type)) {
    throw new PostError(
      "Posts só podem ser criados em cidades ou bairros",
      "INVALID_LOCATION_TYPE"
    );
  }

  // Redirecionar para createPost()
  return this.createPost({
    ...data,
    is_published: true,
  });
}
```

### Impacto:
- Adiciona +1 problema crítico (total: 11)
- Adiciona +1h de esforço (total: 26h)
- Confirma necessidade de migração community_posts → posts

### Ação:
✅ Auditoria completa
✅ Documentado em `AUDITORIA_POSTS_PARCIAL_CODIGO.md`

---

## PENDÊNCIA 3: Auditoria Quantitativa do Banco

### Status: 🔴 BLOQUEADA (circuit breaker)

### Queries Pendentes:

**3.1 Cobertura de location_id em posts**:
```sql
SELECT 
  COUNT(*) as total,
  COUNT(location_id) as com_location_id,
  COUNT(*) - COUNT(location_id) as sem_location_id,
  ROUND(COUNT(location_id) * 100.0 / NULLIF(COUNT(*), 0), 2) as coverage_percent
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

**3.4 Cobertura de location_id em community_posts**:
```sql
SELECT 
  COUNT(*) as total,
  COUNT(location_id) as com_location_id,
  COUNT(*) - COUNT(location_id) as sem_location_id,
  ROUND(COUNT(location_id) * 100.0 / NULLIF(COUNT(*), 0), 2) as coverage_percent
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

### Impacto:
- Bloqueia cálculo preciso de esforço de backfill
- Bloqueia identificação de casos edge
- Bloqueia validação de índices

### Ação:
⏳ Executar quando banco disponível
⏳ Pode ser feito durante Fase 1 (não bloqueia aprovação)

---

## PENDÊNCIA 4: Confirmar Impacto de userLocation Legado

### Status: ✅ CONFIRMADO - Apenas Exibição

### Contexto:

**CommunityFeed passa userLocation legado**:
```typescript
<UnifiedFeedWithMessages
  userLocation={{
    neighborhood: activeProfile?.neighborhood || "",  // ❌ Legado
    city: activeProfile?.city || "",                  // ❌ Legado
  }}
/>
```

### Análise Completa:

**1. UnifiedFeedWithMessages**:
- Recebe `userLocation` como prop
- Passa para `useUnifiedFeed`
- Não usa diretamente

**2. useUnifiedFeed**:
- Recebe `userLocation`
- Passa para `PostAdapter.sortPosts()`
- Não usa para filtros

**3. PostAdapter.sortPosts()**:
- Usa `userLocation` APENAS para critério "nearby"
- Calcula proximidade baseado em city/neighborhood
- NÃO afeta lógica de filtros territoriais

**Código**:
```typescript
static sortPosts(
  posts: UnifiedPost[],
  criteria: string = "recent",
  userLocation?: { neighborhood?: string; city?: string },
): UnifiedPost[] {
  switch (criteria) {
    case "nearby":
      // ✅ Usa userLocation apenas para ordenação
      return sorted.sort((a, b) => {
        const scoreA = PostAdapter.calculateProximity(a, userLocation);
        const scoreB = PostAdapter.calculateProximity(b, userLocation);
        return scoreB - scoreA;
      });
    default:
      // ✅ Outros critérios não usam userLocation
      return sorted;
  }
}

private static calculateProximity(
  post: UnifiedPost,
  userLocation: { neighborhood?: string; city?: string },
): number {
  // ✅ Apenas para ordenação, não para filtros
  if (postBairro && userBairro && postBairro.includes(userBairro)) return 3;
  if (postCidade && userCidade && postCidade === userCidade) return 1;
  return 0;
}
```

### Conclusão:

**userLocation legado afeta APENAS exibição (ordenação "nearby")**:
- ✅ NÃO afeta filtros territoriais
- ✅ NÃO afeta queries ao banco
- ✅ Apenas calcula score de proximidade para ordenação
- ⚠️ Deve ser corrigido para usar location.name do SSOT

**Severidade**: 🟡 MÉDIA (não crítico, mas deve ser corrigido)

**Correção**:
```typescript
<UnifiedFeedWithMessages
  userLocation={{
    location_id: activeProfile?.location_id,
    location_name: activeProfile?.location?.name,  // ✅ SSOT
  }}
/>

// Atualizar PostAdapter.calculateProximity para usar location_id
```

### Impacto:
- Não bloqueia implementação
- Pode ser corrigido na Fase 3 (Componentes)
- Esforço: 1h

### Ação:
✅ Confirmado: Apenas exibição
✅ Documentado em `AUDITORIA_POSTS_PARCIAL_CODIGO.md`

---

## PENDÊNCIA 5: Decisão Formal - posts como Fonte de Verdade

### Status: ⏳ AGUARDANDO FORMALIZAÇÃO

### Contexto:

**Decisão Arquitetural Tomada** (Cenário D):
- posts será a fonte de verdade
- community_posts será migrada para posts
- Estratégia em 2 etapas: (1) Consolidação, (2) SSOT

**Documento**: `DECISAO_ARQUITETURAL_POSTS.md`

### Pendências:

**5.1 Plano de Migração community_posts → posts**
- ⏳ Definir estratégia de migração de dados
- ⏳ Definir período de convivência (se houver)
- ⏳ Definir plano de depreciação de community_posts

**5.2 Limpeza Estrutural de posts**
- ⏳ Remover autor_id (manter author_profile_id)
- ⏳ Remover texto (manter content)
- ⏳ Remover tipo_post (manter type)
- ⏳ Padronizar naming (inglês consistente)

**5.3 Cronograma de Consolidação**
- ⏳ Fase 0.5: Consolidação Estrutural (15h)
- ⏳ Migração de dados community_posts → posts
- ⏳ Testes de regressão pós-migração

### Impacto:
- Adiciona Fase 0.5 ao Sprint 2 (+15h)
- Estimativa revisada: 55h-65h (era 35h)
- Resolve problemas estruturais na raiz

### Ação:
✅ Decisão arquitetural documentada
⏳ Formalizar plano de migração detalhado
⏳ Atualizar SPRINT2_POSTS_PLANO_V2.md

---

## RESUMO DE IMPACTOS

### Problemas Identificados:

**Total**: 20 problemas (era 19)
- **Críticos (P0)**: 11 (era 10)
- **Altos (P1)**: 4
- **Médios (P2)**: 5

**Novo Problema**:
- createCommunityPost() usa community_posts sem validação (P0, +1h)

### Esforço de Correção:

**Total**: 26h (era 25h)
- **P0 (Crítico)**: 16h (era 15h)
- **P1 (Alto)**: 7h
- **P2 (Médio)**: 3h

### Estimativa Revisada:

```
Fase 0: Regras Territoriais (4h)
Fase 0.5: Consolidação Estrutural (15h)
Fase 1: Modelagem e Migração (12h)
Fase 2: Service Layer (8h)
Fase 3: Formulários e Hooks (7h)
Fase 4: Componentes (6h)
Fase 5: Testes (6h)
Fase 6: Seeds (2h)
Fase 7: Documentação (2h)

Total: 62h
Faixa: 55h-65h (considerando imprevistos)
```

---

## CHECKLIST DE PENDÊNCIAS

Antes de iniciar Sprint 2:

- [ ] Pendência 1: Aprovar 5 decisões da Fase 0
- [x] Pendência 2: Auditar createCommunityPost() ✅
- [ ] Pendência 3: Executar auditoria quantitativa (pode ser durante Fase 1)
- [x] Pendência 4: Confirmar impacto userLocation ✅
- [ ] Pendência 5: Formalizar plano de migração community_posts

**Status**: 2/5 Completas (40%)

**Bloqueantes Críticos**: Pendências 1 e 5

---

## PRÓXIMAS AÇÕES

### Ação Imediata:
1. ⏳ Aprovar decisões da Fase 0 (5 decisões)
2. ⏳ Formalizar plano de migração community_posts → posts
3. ⏳ Atualizar SPRINT2_POSTS_PLANO_V2.md com:
   - Fase 0.5: Consolidação Estrutural
   - Estimativa 55h-65h
   - 20 problemas identificados
   - Estratégia em 2 etapas

### Durante Fase 1:
4. ⏳ Executar auditoria quantitativa do banco (quando disponível)
5. ⏳ Ajustar estratégia de backfill com dados reais

### Após Atualização do Plano:
6. ⏳ Solicitar aprovação final para Sprint 2

---

## DOCUMENTOS CRIADOS/ATUALIZADOS

1. ✅ `FASE0_POSTS_REGRAS_TERRITORIAIS.md` - 5 decisões pendentes
2. ✅ `AUDITORIA_POSTS_PARCIAL_CODIGO.md` - 70% completa, 20 problemas
3. ✅ `PENDENCIAS_OBRIGATORIAS_SPRINT2.md` - Este documento
4. ⏳ `SPRINT2_POSTS_PLANO_V2.md` - Aguardando atualização

---

## CONCLUSÃO

**Auditoria**: Madura para replanejar, NÃO para implementar

**Bloqueantes Críticos**: 2
1. Decisões da Fase 0 (5 decisões)
2. Plano de migração community_posts

**Bloqueantes Não-Críticos**: 1
3. Auditoria quantitativa (pode ser durante Fase 1)

**Estimativa Realista**: 55h-65h (vs 35h anterior)

**Próximo Passo**: Aprovar Fase 0 e formalizar plano de migração

---

**Data**: 2026-04-05  
**Responsável**: Kiro AI  
**Status**: 🔴 NÃO PRONTO PARA IMPLEMENTAÇÃO
