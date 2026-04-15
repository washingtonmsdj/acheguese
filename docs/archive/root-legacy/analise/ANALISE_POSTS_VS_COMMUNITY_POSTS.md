# ANÁLISE: posts vs community_posts

**Data**: 2026-04-05  
**Status**: 🔴 BLOQUEANTE - Decisão Necessária  
**Impacto**: Sprint 2 completa

---

## PROBLEMA IDENTIFICADO

Existem DUAS tabelas para posts no sistema:
1. `posts` - Tabela principal (mais antiga?)
2. `community_posts` - Tabela secundária (mais nova?)

**Pergunta Crítica**: Qual é a fonte de verdade? Qual é a estratégia?

---

## ANÁLISE ESTRUTURAL

### Tabela: `posts`

**Localização**: `supabase/migrations/20260325000000_base_schema.sql` - Linha 175

**Estrutura**:
```sql
CREATE TABLE posts (
  id                UUID PRIMARY KEY,
  
  -- ❌ DUPLICAÇÃO: Dois campos de autor
  autor_id          UUID REFERENCES auth.users(id),      -- Legado
  author_profile_id UUID NOT NULL REFERENCES profiles(id), -- Canônico
  
  -- ❌ DUPLICAÇÃO: Dois campos de conteúdo
  texto             TEXT,   -- Legado
  content           TEXT,   -- Canônico
  
  -- ❌ NAMING INCONSISTENTE
  type              TEXT NOT NULL DEFAULT 'text',
  
  -- ❌ DUPLICAÇÃO: Localização legada + canônica
  city              TEXT,
  neighborhood      TEXT,
  street            TEXT,
  location_id       UUID,
  
  -- Metadados
  image_url         TEXT,
  video_url         TEXT,
  images            JSONB DEFAULT '[]',
  tags              JSONB DEFAULT '[]',
  
  -- Contadores
  likes_count       INTEGER NOT NULL DEFAULT 0,
  comments_count    INTEGER NOT NULL DEFAULT 0,
  confirmations_count INTEGER NOT NULL DEFAULT 0,
  
  -- Flags
  is_verified       BOOLEAN NOT NULL DEFAULT false,
  is_published      BOOLEAN NOT NULL DEFAULT true,
  
  -- Auditoria
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Campos Totais**: ~20 campos

---

### Tabela: `community_posts`

**Localização**: `supabase/migrations/20260325000000_base_schema.sql` - Linha 219

**Estrutura**:
```sql
CREATE TABLE community_posts (
  id                  UUID PRIMARY KEY,
  
  -- ✅ APENAS UM campo de autor
  author_profile_id   UUID NOT NULL REFERENCES profiles(id),
  
  -- ✅ APENAS UM campo de conteúdo
  content             TEXT,
  
  -- ✅ NAMING CONSISTENTE
  type                TEXT NOT NULL DEFAULT 'post',
  
  -- ⚠️ Localização (também tem problema)
  location_id         UUID,
  
  -- Metadados
  tags                JSONB DEFAULT '[]',
  
  -- Contadores
  confirmations_count INTEGER NOT NULL DEFAULT 0,
  
  -- Flags
  is_verified         BOOLEAN NOT NULL DEFAULT false,
  
  -- Auditoria
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Campos Totais**: ~10 campos

---

## COMPARAÇÃO LADO A LADO

| Aspecto | `posts` | `community_posts` | Vencedor |
|---------|---------|-------------------|----------|
| **Autor** | `autor_id` + `author_profile_id` (duplicado) | `author_profile_id` (único) | ✅ community_posts |
| **Conteúdo** | `texto` + `content` (duplicado) | `content` (único) | ✅ community_posts |
| **Tipo** | `type` | `type` | Empate |
| **Localização** | `city`, `neighborhood`, `street`, `location_id` (4 campos) | `location_id` (1 campo) | ✅ community_posts |
| **Mídia** | `image_url`, `video_url`, `images` (3 campos) | Nenhum | ⚠️ posts |
| **Tags** | `tags` | `tags` | Empate |
| **Contadores** | `likes_count`, `comments_count`, `confirmations_count` | `confirmations_count` | ⚠️ posts |
| **Flags** | `is_verified`, `is_published` | `is_verified` | ⚠️ posts |
| **Complexidade** | Alta (20 campos, duplicações) | Baixa (10 campos, limpo) | ✅ community_posts |
| **Consistência** | Baixa (naming inconsistente) | Alta (naming limpo) | ✅ community_posts |

---

## USO NO CÓDIGO

### PostService.ts

**Funções que usam `posts`**:
- `createPost()` - linha 48
- `getPostById()` - linha 138
- `updatePost()` - linha 168
- `deletePost()` - linha 230
- `getFeed()` - linha 260
- `getPostsByProfile()` - linha 380
- `getPostsByLocation()` - linha 420
- `getSavedPosts()` - linha 480
- `createSimplePost()` - linha 1896
- `createCommunityPostWithValidation()` - linha 2088

**Funções que usam `community_posts`**:
- `createCommunityPost()` - linha 1024 (não auditada)
- `getCommunityPostById()` - linha 1100 (não auditada)
- `getActiveAlerts()` - linha 1680
- `getPopularTags()` - linha 1740
- `getTopPosts()` - linha 1818

**Observação**: Há MISTURA de uso. Algumas funções usam `posts`, outras `community_posts`.

---

## TABELAS RELACIONADAS

### Relacionadas a `posts`:
- `post_likes_new` - curtidas
- `saved_posts_new` - posts salvos
- `post_comments` - comentários (presumido)

### Relacionadas a `community_posts`:
- `community_polls` - enquetes
- `community_poll_options` - opções de enquetes
- `community_poll_votes` - votos em enquetes

---

## CENÁRIOS POSSÍVEIS

### Cenário A: `posts` é a Fonte de Verdade

**Estratégia**: Migrar `community_posts` para `posts`

**Prós**:
- Tabela mais completa (mídia, contadores, flags)
- Mais funcionalidades

**Contras**:
- ❌ Estrutura confusa (duplicações)
- ❌ Naming inconsistente
- ❌ Precisa limpar campos legados
- ❌ Mais complexo de manter

**Ações**:
1. Limpar duplicações em `posts` (autor_id, texto)
2. Migrar dados de `community_posts` para `posts`
3. Deprecar `community_posts`
4. Atualizar todas as queries

---

### Cenário B: `community_posts` é a Fonte de Verdade

**Estratégia**: Migrar `posts` para `community_posts`

**Prós**:
- ✅ Estrutura limpa (sem duplicações)
- ✅ Naming consistente
- ✅ Mais simples de manter

**Contras**:
- ❌ Precisa adicionar campos (mídia, contadores)
- ❌ Precisa migrar relacionamentos (likes, saves)
- ❌ Mais trabalho de migração

**Ações**:
1. Adicionar campos faltantes em `community_posts` (mídia, contadores, flags)
2. Migrar dados de `posts` para `community_posts`
3. Migrar relacionamentos (likes, saves)
4. Deprecar `posts`
5. Atualizar todas as queries

---

### Cenário C: Convivência (Status Quo)

**Estratégia**: Manter ambas as tabelas

**Prós**:
- Sem migração imediata
- Menos risco

**Contras**:
- ❌ Confusão permanente
- ❌ Duplicação de lógica
- ❌ Difícil de manter
- ❌ Bugs inevitáveis
- ❌ Não resolve problemas estruturais

**Ações**:
1. Documentar claramente quando usar cada tabela
2. Corrigir SSOT territorial em ambas
3. Aceitar complexidade permanente

⚠️ **NÃO RECOMENDADO**

---

### Cenário D: Consolidação Híbrida (RECOMENDADO)

**Estratégia**: Consolidar em `posts` mas limpar estrutura primeiro

**Fase 1 - Limpeza de `posts`**:
```sql
-- Remover duplicações
ALTER TABLE posts DROP COLUMN autor_id;  -- Manter apenas author_profile_id
ALTER TABLE posts DROP COLUMN texto;     -- Manter apenas content

-- Renomear para consistência
-- (manter type como está, é aceitável)

-- Remover campos legados de localização
ALTER TABLE posts DROP COLUMN city;
ALTER TABLE posts DROP COLUMN neighborhood;
ALTER TABLE posts DROP COLUMN street;
-- Manter apenas location_id
```

**Fase 2 - Migração de `community_posts`**:
```sql
-- Migrar dados
INSERT INTO posts (
  id,
  author_profile_id,
  content,
  type,
  location_id,
  tags,
  confirmations_count,
  is_verified,
  created_at,
  updated_at
)
SELECT 
  id,
  author_profile_id,
  content,
  type,
  location_id,
  tags,
  confirmations_count,
  is_verified,
  created_at,
  updated_at
FROM community_posts;

-- Migrar relacionamentos (polls)
-- community_polls.post_id agora aponta para posts.id
```

**Fase 3 - Deprecação**:
```sql
-- Deprecar community_posts
DROP TABLE community_posts CASCADE;
```

**Prós**:
- ✅ Estrutura limpa final
- ✅ Naming consistente
- ✅ Fonte única de verdade
- ✅ Resolve todos os problemas

**Contras**:
- ⚠️ Requer migração cuidadosa
- ⚠️ Mais tempo de implementação

---

## PROBLEMAS ESTRUTURAIS ADICIONAIS

### 1. Duplicação de Campos

**Em `posts`**:
- `autor_id` vs `author_profile_id`
- `texto` vs `content`
- `city/neighborhood/street` vs `location_id`

**Impacto**: Confusão, bugs, manutenção difícil

---

### 2. Naming Inconsistente

**Exemplos**:
- `author_profile_id` (snake_case) ✅
- `tipo_post` (português) ❌
- `post_type` (inglês) ✅
- `imagem_url` (português) ❌
- `image_url` (inglês) ✅

**Impacto**: Confusão, erros de digitação

---

### 3. Campos Opcionais vs Obrigatórios

**Em `posts`**:
- `content` é opcional (pode ser NULL)
- `author_profile_id` é obrigatório (NOT NULL)
- `location_id` é opcional (pode ser NULL)

**Pergunta**: Um post sem conteúdo é válido?

---

### 4. Falta de Constraints

**Exemplos**:
- `type` tem CHECK constraint ✅
- `location_id` não tem FK constraint ❌
- `tags` não tem validação de formato ❌

---

## RECOMENDAÇÃO OFICIAL

### Opção Recomendada: Cenário D (Consolidação Híbrida)

**Justificativa**:
1. Resolve duplicação de tabelas
2. Limpa estrutura confusa
3. Remove campos legados
4. Estabelece fonte única de verdade
5. Naming consistente

**Fases**:
1. **Fase 1**: Limpar `posts` (remover duplicações)
2. **Fase 2**: Migrar `community_posts` → `posts`
3. **Fase 3**: Deprecar `community_posts`
4. **Fase 4**: Corrigir SSOT territorial em `posts` limpo

**Estimativa**: +15h ao Sprint 2 (total: 50h)

---

## IMPACTO NO SPRINT 2

### Se Cenário A ou D (Consolidar em `posts`):
- Sprint 2 precisa incluir limpeza estrutural
- Estimativa aumenta de 35h para 50h
- Mais complexo mas resolve tudo

### Se Cenário B (Consolidar em `community_posts`):
- Sprint 2 precisa migrar relacionamentos
- Estimativa aumenta de 35h para 55h
- Estrutura final mais limpa

### Se Cenário C (Convivência):
- Sprint 2 mantém 35h
- Problemas estruturais permanecem
- ⚠️ NÃO RECOMENDADO

---

## DECISÃO NECESSÁRIA

**Antes de aprovar Sprint 2, decidir**:

1. ✅ Qual tabela é a fonte de verdade?
   - [ ] `posts`
   - [ ] `community_posts`
   - [ ] Consolidação híbrida (recomendado)

2. ✅ Estratégia de migração?
   - [ ] Migrar community_posts → posts
   - [ ] Migrar posts → community_posts
   - [ ] Limpar posts + migrar community_posts

3. ✅ Timing?
   - [ ] Incluir no Sprint 2
   - [ ] Sprint separado depois

4. ✅ Limpeza estrutural?
   - [ ] Remover duplicações (autor_id, texto)
   - [ ] Manter duplicações temporariamente
   - [ ] Remover campos legados (city, neighborhood)

---

## PRÓXIMOS PASSOS

1. ⏳ Aguardar decisão sobre posts vs community_posts
2. ⏳ Atualizar Sprint 2 com estratégia escolhida
3. ⏳ Recalcular estimativa
4. ⏳ Documentar plano de migração detalhado

---

**Status**: 🔴 BLOQUEANTE - Aguardando Decisão  
**Impacto**: Sprint 2 não pode iniciar sem esta definição  
**Recomendação**: Cenário D (Consolidação Híbrida em `posts` limpo)
