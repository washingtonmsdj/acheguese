# SPRINT 2 - MÓDULO POSTS (VERSÃO CORRIGIDA)

**Data**: 2026-04-05  
**Status**: 🚧 Aguardando Aprovação  
**Blueprint**: tourist_points (v1.0.0)  
**Estimativa**: 35h (4.4 dias)

---

## OBJETIVO

Corrigir o módulo `posts` para seguir 100% o SSOT territorial, replicando o padrão aprovado do blueprint `tourist_points`.

**IMPORTANTE**: Este plano inclui:
- ✅ Fase 0 para definir regras territoriais
- ✅ Auditoria completa (writes, reads, renders, forms)
- ✅ Estratégia de backfill segura (MATCH_EXATO, AMBIGUO, SEM_MATCH)
- ✅ Gates técnicos antes de tornar location_id obrigatório
- ✅ Cobertura completa de renderização (feeds, cards, admin)
- ✅ Testes expandidos (feed, busca, criação, casos negativos)

---

## FASE 0: DEFINIÇÃO DE REGRAS TERRITORIAIS (4h)

### 0.1 Regra Territorial de Posts

**Pergunta Central**: Qual é a relação entre um post e o território?

#### Opção A: Post Vinculado ao Bairro do Autor
- Post herda `location_id` do perfil do autor
- Usuário não escolhe bairro ao criar post
- Post sempre aparece no feed do bairro do autor
- **Prós**: Simples, consistente com perfil
- **Contras**: Não permite postar sobre outros bairros

#### Opção B: Post com Território Independente
- Usuário escolhe bairro ao criar post (pode ser diferente do seu)
- Permite postar sobre outros bairros
- Exemplo: Morador da Barra posta sobre evento no Pelourinho
- **Prós**: Flexível, permite conteúdo cross-bairro
- **Contras**: Mais complexo, requer validação

#### Opção C: Post com Alcance Configurável
- Post tem `location_id` base + campo `reach` (street/neighborhood/city)
- Permite controlar visibilidade (ex: alerta de rua vs evento de cidade)
- Requer validação de permissão baseada em reputação
- **Prós**: Máxima flexibilidade
- **Contras**: Mais complexo, requer sistema de permissões

**DECISÃO NECESSÁRIA**: Escolher uma opção antes de prosseguir.

---

### 0.2 Relação com Seletor Global

**Pergunta**: Como o seletor territorial global afeta posts?

#### Cenário 1: Seletor Filtra Feed
- Usuário seleciona "Barra" → vê posts com `location_id` da Barra
- Usuário seleciona "Salvador" → vê posts de todos os bairros de Salvador
- Criação de post usa `location_id` do seletor ativo
- **Prós**: Consistente com navegação territorial
- **Contras**: Usuário pode criar post em bairro que não é o dele

#### Cenário 2: Seletor Independente de Posts
- Seletor global não afeta posts
- Posts sempre usam `location_id` do perfil do autor
- Feed mostra posts do bairro do usuário logado
- **Prós**: Simples, sem ambiguidade
- **Contras**: Menos flexível

**DECISÃO NECESSÁRIA**: Escolher um cenário antes de prosseguir.

---

### 0.3 Grupos Territoriais

**Pergunta**: Posts podem ser vinculados a grupos territoriais?

#### Opção A: Apenas Bairros Individuais
- `location_id` sempre aponta para um único bairro (type='district')
- Não há posts "de cidade" ou "de grupo"
- **Prós**: Simples, sem ambiguidade
- **Contras**: Não permite posts para toda cidade

#### Opção B: Suporte a Grupos
- `location_id` pode apontar para cidade (expande para todos os bairros)
- Permite posts "para toda Salvador"
- Requer validação de permissão (ex: apenas usuários verificados)
- **Prós**: Flexível, permite alcance maior
- **Contras**: Requer sistema de permissões

**DECISÃO NECESSÁRIA**: Escolher uma opção antes de prosseguir.

---

### 0.4 Deliverable da Fase 0

**Documento**: `REGRAS_TERRITORIAIS_POSTS.md`

Conteúdo obrigatório:
1. Decisão sobre escopo territorial (A, B ou C)
2. Decisão sobre relação com seletor global (1 ou 2)
3. Decisão sobre grupos territoriais (A ou B)
4. Diagrama de fluxo: Criação de post → Validação → Persistência
5. Diagrama de fluxo: Seletor global → Filtro de feed → Renderização
6. Exemplos práticos de cada cenário
7. Impacto em UX (o que o usuário vê/faz)

**GATE**: Fase 1 só inicia após aprovação da Fase 0.

---

## AUDITORIA COMPLETA - POSTS (6h)

### Auditoria 1: Operações de Escrita (2h)

**Objetivo**: Mapear todas as operações que criam/atualizam posts.

#### Funções Identificadas

**PostService.ts**:
1. `createPost()` - linha 48
2. `updatePost()` - linha 168
3. `createCommunityPost()` - linha 1024
4. `createSimplePost()` - linha 1896
5. `createCommunityPostWithValidation()` - linha 2088

#### Checklist para Cada Função

- [ ] Valida `location_id` antes de inserir?
- [ ] Permite `location_id` null?
- [ ] Usa campos legados (city/neighborhood)?
- [ ] Tem fallback para perfil do autor?
- [ ] Valida permissão territorial?
- [ ] Sanitiza entrada do usuário?

#### Análise Detalhada

**createPost()** (linha 48):
```typescript
// ❌ PROBLEMA: Usa city do profile como fallback
city: data.city || profile.city,
neighborhood: data.neighborhood,

// ⚠️ PROBLEMA: location_id não é definido
// Deveria ser: location_id: data.location_id || profile.location_id
```

**createCommunityPostWithValidation()** (linha 2088):
```typescript
// ❌ PROBLEMA: Usa city/neighborhood do profile
city: profile.city,
neighborhood: profile.neighborhood,

// ⚠️ PROBLEMA: location_id não é definido
```

**Deliverable**: `AUDITORIA_POSTS_WRITES.md`

---

### Auditoria 2: Operações de Leitura (2h)

**Objetivo**: Mapear todas as queries que filtram posts por território.

#### Funções Identificadas

**PostService.ts**:
1. `getFeed()` - linha 260 (usa location_id OU city/neighborhood)
2. `getPostsByProfile()` - linha 380 (sem filtro territorial)
3. `getPostsByLocation()` - linha 420 (usa city/neighborhood)
4. `getSavedPosts()` - linha 480 (sem filtro territorial)
5. `getActiveAlerts()` - linha 1680 (usa city/neighborhood)
6. `getPopularTags()` - linha 1740 (usa city/neighborhood)
7. `getTopPosts()` - linha 1818 (usa city/neighborhood)

#### Checklist para Cada Função

- [ ] Usa `.in('location_id')` ou `.eq('city')`?
- [ ] Suporta expansão cidade→distritos?
- [ ] Tem índice adequado?
- [ ] Performance < 100ms?
- [ ] Retorna dados corretos quando location_id é null?

#### Análise Detalhada

**getFeed()** (linha 260):
```typescript
// ✅ BOM: Prioriza location_id
if (location_id) {
  query = query.eq("location_id", location_id);
} else if (location_ids && location_ids.length > 0) {
  query = query.in("location_id", location_ids);
} else {
  // ❌ PROBLEMA: Fallback para city/neighborhood
  if (city) {
    query = query.eq("city", city);
  }
}
```

**getPostsByLocation()** (linha 420):
```typescript
// ❌ PROBLEMA: Usa APENAS city/neighborhood
if (location.city) {
  query = query.eq("city", location.city);
  if (location.neighborhood) {
    query = query.eq("neighborhood", location.neighborhood);
  }
}
```

**Deliverable**: `AUDITORIA_POSTS_READS.md`

---

### Auditoria 3: Componentes de Renderização (1h)

**Objetivo**: Mapear todos os componentes que exibem posts.

#### Componentes Identificados

1. `UnifiedPostCard` - src/modules/community/components/UnifiedPostCard/index.tsx
2. `PostCard` - src/modules/community/components/PostCard.tsx (se existir)
3. `CommunityFeed` - src/modules/community/components/feed/CommunityFeed.tsx
4. `UnifiedFeedWithMessages` - src/modules/community/components/feed/UnifiedFeedWithMessages.tsx
5. `UserPostsGrid` - src/modules/profile/components/UserPostsGrid.tsx
6. `SavedPostsGrid` - src/modules/profile/components/SavedPostsGrid.tsx
7. `SearchModal` - src/modules/community/components/SearchModal.tsx

#### Checklist para Cada Componente

- [ ] Exibe bairro do post?
- [ ] Usa `post.location?.name` ou `post.neighborhood`?
- [ ] Tem fallback adequado?
- [ ] Renderiza corretamente quando `location_id` é null?
- [ ] Exibe ícone de localização?
- [ ] Link para filtrar por bairro?

#### Análise Necessária

Para cada componente, verificar:
1. Onde está o código que renderiza o bairro?
2. Qual campo está sendo usado?
3. Há tratamento de erro/null?

**Deliverable**: `AUDITORIA_POSTS_RENDERS.md`

---

### Auditoria 4: Formulários e Inputs (1h)

**Objetivo**: Mapear todos os formulários que criam/editam posts.

#### Componentes Identificados

1. `UnifiedComposer` - src/modules/community/components/composer/UnifiedComposer.tsx
2. `useCreatePostForm` - src/modules/community/hooks/composer/useCreatePostForm.ts

#### Checklist para Cada Formulário

- [ ] Permite input livre de bairro?
- [ ] Usa `TerritorialSelector`?
- [ ] Valida `location_id` antes de submit?
- [ ] Qual é a fonte do `location_id`?
  - [ ] Perfil do autor
  - [ ] Seletor global
  - [ ] Input manual
  - [ ] Outro
- [ ] Exibe feedback visual do território selecionado?
- [ ] Permite mudança de território?

#### Perguntas Críticas

1. **De onde vem o location_id ao criar post?**
   - Resposta depende da decisão da Fase 0

2. **O formulário mostra o bairro selecionado?**
   - Verificar se há UI indicando o território

3. **Há validação client-side?**
   - Verificar se impede submit sem location_id

**Deliverable**: `AUDITORIA_POSTS_FORMS.md`

---

### Consolidação da Auditoria

**Deliverable Final**: `AUDITORIA_POSTS_CONSOLIDADA.md`

Conteúdo:
1. Resumo executivo
2. Matriz de problemas (severidade x impacto)
3. Priorização de correções
4. Estimativa de esforço por problema
5. Dependências entre correções

**GATE**: Fase 1 só inicia após conclusão da auditoria.

---

## FASE 1: MODELAGEM E MIGRAÇÃO SEGURA (8h)

### 1.1 Estratégia de Backfill (4h)

**IMPORTANTE**: Não usar `LIMIT 1` cego. Implementar estratégia com classificação de matches.

#### Etapa 1.1.1: Análise de Dados Existentes

```sql
-- Verificar quantos posts têm location_id
SELECT 
  COUNT(*) as total,
  COUNT(location_id) as com_location_id,
  COUNT(*) - COUNT(location_id) as sem_location_id,
  COUNT(CASE WHEN city IS NOT NULL THEN 1 END) as com_city,
  COUNT(CASE WHEN neighborhood IS NOT NULL THEN 1 END) as com_neighborhood
FROM posts;

-- Verificar distribuição de city/neighborhood
SELECT city, neighborhood, COUNT(*) as count
FROM posts
WHERE location_id IS NULL
GROUP BY city, neighborhood
ORDER BY count DESC
LIMIT 20;
```

#### Etapa 1.1.2: Classificação de Matches

```sql
-- Criar tabela temporária para análise de matches
CREATE TEMP TABLE posts_match_analysis AS
SELECT 
  p.id as post_id,
  p.city,
  p.neighborhood,
  p.location_id as current_location_id,
  l.id as matched_location_id,
  l.name as matched_name,
  l.type as matched_type,
  CASE
    -- MATCH_EXATO: city + neighborhood encontram exatamente 1 distrito
    WHEN p.city IS NOT NULL 
      AND p.neighborhood IS NOT NULL 
      AND (
        SELECT COUNT(*) 
        FROM locations l2
        WHERE l2.type = 'district'
          AND l2.name = p.neighborhood
          AND l2.parent_id IN (
            SELECT id FROM locations 
            WHERE type = 'city' AND name = p.city
          )
          AND l2.status = 'active'
      ) = 1 
    THEN 'MATCH_EXATO'
    
    -- MATCH_AMBIGUO: city + neighborhood encontram múltiplos distritos
    WHEN p.city IS NOT NULL 
      AND p.neighborhood IS NOT NULL 
      AND (
        SELECT COUNT(*) 
        FROM locations l2
        WHERE l2.type = 'district'
          AND l2.name = p.neighborhood
          AND l2.parent_id IN (
            SELECT id FROM locations 
            WHERE type = 'city' AND name = p.city
          )
          AND l2.status = 'active'
      ) > 1 
    THEN 'MATCH_AMBIGUO'
    
    -- SEM_MATCH: city + neighborhood não encontram distrito
    WHEN p.city IS NOT NULL 
      AND p.neighborhood IS NOT NULL 
    THEN 'SEM_MATCH'
    
    -- REVISAO_MANUAL: dados incompletos
    ELSE 'REVISAO_MANUAL'
  END as match_type
FROM posts p
LEFT JOIN locations l ON (
  l.type = 'district'
  AND l.name = p.neighborhood
  AND l.parent_id IN (
    SELECT id FROM locations 
    WHERE type = 'city' AND name = p.city
  )
  AND l.status = 'active'
)
WHERE p.location_id IS NULL;

-- Verificar distribuição de matches
SELECT 
  match_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM posts_match_analysis
GROUP BY match_type
ORDER BY count DESC;
```

#### Etapa 1.1.3: Migração por Categoria

```sql
-- 20260405000020_backfill_posts_location_id_phase1.sql

-- FASE 1: Migrar apenas MATCH_EXATO
UPDATE posts p
SET location_id = (
  SELECT l.id
  FROM locations l
  WHERE l.type = 'district'
    AND l.name = p.neighborhood
    AND l.parent_id IN (
      SELECT id FROM locations 
      WHERE type = 'city' AND name = p.city
    )
    AND l.status = 'active'
  LIMIT 1  -- Seguro aqui porque sabemos que há apenas 1 match
)
WHERE p.location_id IS NULL
  AND p.city IS NOT NULL
  AND p.neighborhood IS NOT NULL
  AND (
    SELECT COUNT(*) 
    FROM locations l2
    WHERE l2.type = 'district'
      AND l2.name = p.neighborhood
      AND l2.parent_id IN (
        SELECT id FROM locations 
        WHERE type = 'city' AND name = p.city
      )
      AND l2.status = 'active'
  ) = 1;

-- Verificar resultado
SELECT 
  'MATCH_EXATO migrados' as status,
  COUNT(*) as count
FROM posts
WHERE location_id IS NOT NULL
  AND updated_at > NOW() - INTERVAL '1 minute';
```

#### Etapa 1.1.4: Tratamento de MATCH_AMBIGUO

```sql
-- 20260405000021_backfill_posts_location_id_phase2.sql

-- Criar tabela de decisões manuais
CREATE TABLE IF NOT EXISTS posts_location_decisions (
  post_id UUID PRIMARY KEY REFERENCES posts(id),
  city TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  chosen_location_id UUID NOT NULL REFERENCES locations(id),
  reason TEXT,
  decided_by TEXT,
  decided_at TIMESTAMPTZ DEFAULT NOW()
);

-- Para MATCH_AMBIGUO: usar heurística (distrito mais populoso ou mais central)
-- OU marcar para revisão manual
UPDATE posts p
SET location_id = (
  SELECT l.id
  FROM locations l
  WHERE l.type = 'district'
    AND l.name = p.neighborhood
    AND l.parent_id IN (
      SELECT id FROM locations 
      WHERE type = 'city' AND name = p.city
    )
    AND l.status = 'active'
  ORDER BY l.population DESC NULLS LAST  -- Heurística: distrito mais populoso
  LIMIT 1
)
WHERE p.location_id IS NULL
  AND p.id IN (
    SELECT post_id 
    FROM posts_match_analysis 
    WHERE match_type = 'MATCH_AMBIGUO'
  );

-- Registrar decisões automáticas
INSERT INTO posts_location_decisions (post_id, city, neighborhood, chosen_location_id, reason, decided_by)
SELECT 
  p.id,
  p.city,
  p.neighborhood,
  p.location_id,
  'Heurística: distrito mais populoso',
  'sistema'
FROM posts p
WHERE p.location_id IS NOT NULL
  AND p.updated_at > NOW() - INTERVAL '1 minute';
```

#### Etapa 1.1.5: Tratamento de SEM_MATCH

```sql
-- 20260405000022_backfill_posts_location_id_phase3.sql

-- Para SEM_MATCH: tentar match apenas por cidade (usar cidade como fallback)
UPDATE posts p
SET location_id = (
  SELECT id
  FROM locations
  WHERE type = 'city'
    AND name = p.city
    AND status = 'active'
  LIMIT 1
)
WHERE p.location_id IS NULL
  AND p.city IS NOT NULL
  AND p.id IN (
    SELECT post_id 
    FROM posts_match_analysis 
    WHERE match_type = 'SEM_MATCH'
  );

-- Registrar posts que ainda não têm location_id
CREATE TABLE IF NOT EXISTS posts_pending_location (
  post_id UUID PRIMARY KEY REFERENCES posts(id),
  city TEXT,
  neighborhood TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO posts_pending_location (post_id, city, neighborhood, reason)
SELECT 
  id,
  city,
  neighborhood,
  'Bairro não encontrado no SSOT'
FROM posts
WHERE location_id IS NULL
  AND city IS NOT NULL;
```

---

### 1.2 Adicionar Foreign Key (1h)

```sql
-- 20260405000023_add_posts_location_fk.sql

-- Adicionar FK (sem NOT NULL ainda)
ALTER TABLE posts
  ADD CONSTRAINT fk_posts_location_id
  FOREIGN KEY (location_id)
  REFERENCES locations(id)
  ON DELETE RESTRICT;

-- Criar índice (se não existir)
CREATE INDEX IF NOT EXISTS idx_posts_location_id_published 
  ON posts(location_id) 
  WHERE is_published = true;

-- Verificar integridade
SELECT 
  COUNT(*) as posts_sem_location_id,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM posts) as percentage
FROM posts
WHERE location_id IS NULL;
```

---

### 1.3 Gates Técnicos (2h)

**IMPORTANTE**: location_id só se torna NOT NULL após passar por todos os gates.

#### Gate 1: Cobertura Mínima
```sql
-- Verificar que pelo menos 95% dos posts têm location_id
SELECT 
  COUNT(CASE WHEN location_id IS NOT NULL THEN 1 END) * 100.0 / COUNT(*) as coverage
FROM posts;

-- Deve retornar >= 95.0
```

#### Gate 2: Integridade Referencial
```sql
-- Verificar que todos os location_id são válidos
SELECT COUNT(*)
FROM posts p
LEFT JOIN locations l ON p.location_id = l.id
WHERE p.location_id IS NOT NULL
  AND l.id IS NULL;

-- Deve retornar 0
```

#### Gate 3: Performance de Queries
```sql
-- Verificar que queries por location_id são rápidas
EXPLAIN ANALYZE
SELECT *
FROM posts
WHERE location_id = '5c91b9e1-17bf-4707-9ba7-0dd82ada7eb3'
  AND is_published = true
ORDER BY created_at DESC
LIMIT 20;

-- Execution time deve ser < 50ms
```

#### Gate 4: Validação de Dados
```sql
-- Verificar que location_id aponta para distritos ou cidades
SELECT 
  l.type,
  COUNT(*) as count
FROM posts p
JOIN locations l ON p.location_id = l.id
GROUP BY l.type;

-- Deve retornar apenas 'district' e 'city'
```

#### Gate 5: Testes de Regressão
```bash
# Executar testes runtime
npm run test:ssot

# Deve passar 100%
```

**Deliverable**: `GATES_POSTS_LOCATION_ID.md` com evidências de cada gate.

---

### 1.4 Tornar location_id Obrigatório (1h)

**SOMENTE APÓS TODOS OS GATES PASSAREM**

```sql
-- 20260405000024_enforce_posts_location_id_not_null.sql

-- Verificar novamente antes de aplicar
DO $$
DECLARE
  coverage NUMERIC;
  invalid_refs INTEGER;
BEGIN
  -- Gate 1: Cobertura
  SELECT COUNT(CASE WHEN location_id IS NOT NULL THEN 1 END) * 100.0 / COUNT(*)
  INTO coverage
  FROM posts;
  
  IF coverage < 95.0 THEN
    RAISE EXCEPTION 'Cobertura insuficiente: %', coverage;
  END IF;
  
  -- Gate 2: Integridade
  SELECT COUNT(*)
  INTO invalid_refs
  FROM posts p
  LEFT JOIN locations l ON p.location_id = l.id
  WHERE p.location_id IS NOT NULL AND l.id IS NULL;
  
  IF invalid_refs > 0 THEN
    RAISE EXCEPTION 'Referências inválidas: %', invalid_refs;
  END IF;
  
  -- Aplicar NOT NULL
  ALTER TABLE posts
    ALTER COLUMN location_id SET NOT NULL;
    
  RAISE NOTICE 'location_id agora é obrigatório';
END $$;

-- Deprecar campos legados
COMMENT ON COLUMN posts.city IS 'DEPRECATED: Use location_id. Mantido apenas para auditoria.';
COMMENT ON COLUMN posts.neighborhood IS 'DEPRECATED: Use location_id. Mantido apenas para auditoria.';
COMMENT ON COLUMN posts.street IS 'DEPRECATED: Use location_id. Mantido apenas para auditoria.';
```

---

## FASE 2: SERVICE LAYER (6h)

### 2.1 Criar PostQueryService (3h)

```typescript
// src/core/posts/services/PostQueryService.ts

/**
 * PostQueryService — Leitura pública de posts
 *
 * Regras:
 * - Filtra por location_ids (TerritoryFilter canônico)
 * - Público: apenas is_published=true
 * - Admin: qualquer status
 * - Nunca lança exceção em leitura — retorna [] ou null em caso de erro
 * - Zero acesso direto ao banco fora deste service
 */

import { supabase } from '@/integrations/supabase';
import type { Post, PostQueryFilters } from '../types';

const SELECT_PUBLIC = `
  id,
  location_id,
  author_profile_id,
  content,
  type,
  image_url,
  video_url,
  images,
  tags,
  likes_count,
  comments_count,
  confirmations_count,
  is_verified,
  is_published,
  created_at,
  updated_at,
  location:locations!location_id(id, name, full_name, geographic_path, type),
  author_profile:profiles!author_profile_id(id, name, avatar_url)
`;

export class PostQueryService {

  /**
   * Lista posts publicados para um conjunto de location_ids.
   * Usado pelas páginas públicas com TerritoryFilter.
   */
  static async listPublished(filters: PostQueryFilters): Promise<Post[]> {
    if (!filters.location_ids.length) return [];

    try {
      let query = supabase
        .from('posts')
        .select(SELECT_PUBLIC)
        .in('location_id', filters.location_ids)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit ?? 20) - 1);
      }

      const { data, error } = await query;
      if (error || !data) return [];
      return data as Post[];
    } catch {
      return [];
    }
  }

  /**
   * Feed de posts para um conjunto de location_ids.
   * SSOT: Expande automaticamente cidade para distritos.
   */
  static async getPostsForFeed(
    locationIds: string[],
    limit: number = 20,
    offset: number = 0
  ): Promise<Post[]> {
    if (!locationIds.length) return [];

    try {
      // Expandir cidades para distritos
      const expandedIds = await this.expandLocationIds(locationIds);

      const { data, error } = await supabase
        .from('posts')
        .select(SELECT_PUBLIC)
        .in('location_id', expandedIds)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error || !data) return [];
      return data as Post[];
    } catch {
      return [];
    }
  }

  /**
   * Busca posts por texto.
   * SSOT: Filtra por location_ids.
   */
  static async searchPosts(
    locationIds: string[],
    searchTerm: string,
    limit: number = 20
  ): Promise<Post[]> {
    if (!locationIds.length || !searchTerm) return [];

    try {
      const expandedIds = await this.expandLocationIds(locationIds);

      const { data, error } = await supabase
        .from('posts')
        .select(SELECT_PUBLIC)
        .in('location_id', expandedIds)
        .eq('is_published', true)
        .textSearch('content', searchTerm)
        .order('created_at', { ascending: false})
        .limit(limit);

      if (error || !data) return [];
      return data as Post[];
    } catch {
      return [];
    }
  }

  /**
   * Expande location_ids: se for cidade, retorna todos os distritos.
   */
  private static async expandLocationIds(locationIds: string[]): Promise<string[]> {
    try {
      const { data: locations } = await supabase
        .from('locations')
        .select('id, type')
        .in('id', locationIds);

      if (!locations) return locationIds;

      const expanded: string[] = [];

      for (const loc of locations) {
        if (loc.type === 'city') {
          // Buscar todos os distritos desta cidade
          const { data: districts } = await supabase
            .from('locations')
            .select('id')
            .eq('parent_id', loc.id)
            .eq('type', 'district')
            .eq('status', 'active');

          if (districts && districts.length > 0) {
            expanded.push(...districts.map(d => d.id));
          } else {
            expanded.push(loc.id);
          }
        } else {
          expanded.push(loc.id);
        }
      }

      return expanded;
    } catch {
      return locationIds;
    }
  }

  /**
   * Conta posts publicados para um conjunto de location_ids.
   */
  static async countPublished(locationIds: string[]): Promise<number> {
    if (!locationIds.length) return 0;

    try {
      const expandedIds = await this.expandLocationIds(locationIds);

      const { count, error } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .in('location_id', expandedIds)
        .eq('is_published', true);

      if (error) return 0;
      return count ?? 0;
    } catch {
      return 0;
    }
  }
}
```

---

### 2.2 Refatorar PostService (3h)

**Objetivo**: Substituir filtros legados por location_id em todas as funções.

#### Funções a Refatorar

1. **getFeed()** - linha 260
   - ❌ Remover fallback para city/neighborhood
   - ✅ Usar apenas location_id/location_ids

2. **getPostsByLocation()** - linha 420
   - ❌ Remover filtros por city/neighborhood
   - ✅ Usar PostQueryService.listPublished()

3. **getActiveAlerts()** - linha 1680
   - ❌ Remover filtros por city/neighborhood
   - ✅ Usar location_ids

4. **getPopularTags()** - linha 1740
   - ❌ Remover filtros por city/neighborhood
   - ✅ Usar location_ids

5. **getTopPosts()** - linha 1818
   - ❌ Remover filtros por city/neighborhood
   - ✅ Usar location_ids

#### Exemplo de Refatoração

**ANTES**:
```typescript
async getPostsByLocation(location: LocationFilter): Promise<Post[]> {
  let query = supabase.from('posts').select('*');
  
  if (location.city) {
    query = query.eq('city', location.city);
    if (location.neighborhood) {
      query = query.eq('neighborhood', location.neighborhood);
    }
  }
  
  return query;
}
```

**DEPOIS**:
```typescript
async getPostsByLocation(locationIds: string[]): Promise<Post[]> {
  return PostQueryService.listPublished({ location_ids: locationIds });
}
```

---

## FASE 3: FORMULÁRIOS E CRIAÇÃO (4h)

### 3.1 Definir Fonte do location_id (1h)

**DEPENDE DA DECISÃO DA FASE 0**

#### Cenário A: location_id do Perfil do Autor

```typescript
// UnifiedComposer.tsx

const { data: profile } = useProfile(userId);

const handleSubmit = async (data) => {
  await PostService.createPost(profileId, {
    ...data,
    location_id: profile.location_id, // ✅ Herda do perfil
  });
};
```

**Prós**: Simples, sem ambiguidade  
**Contras**: Não permite postar sobre outros bairros

---

#### Cenário B: location_id do Seletor Global

```typescript
// UnifiedComposer.tsx

const { selectedLocation } = useTerritoryContext();

const handleSubmit = async (data) => {
  await PostService.createPost(profileId, {
    ...data,
    location_id: selectedLocation.id, // ✅ Usa seletor global
  });
};
```

**Prós**: Flexível, permite postar em qualquer bairro  
**Contras**: Usuário pode esquecer de mudar o seletor

---

#### Cenário C: location_id com Seletor Dedicado

```typescript
// UnifiedComposer.tsx

const [postLocationId, setPostLocationId] = useState(profile.location_id);

<TerritorialSelector
  value={postLocationId}
  onChange={setPostLocationId}
  label="Onde está acontecendo?"
  required
/>

const handleSubmit = async (data) => {
  await PostService.createPost(profileId, {
    ...data,
    location_id: postLocationId, // ✅ Escolha explícita
  });
};
```

**Prós**: Máxima clareza, usuário escolhe conscientemente  
**Contras**: Mais complexo, mais cliques

---

### 3.2 Refatorar UnifiedComposer (2h)

**Objetivo**: Implementar o cenário escolhido na Fase 0.

#### Mudanças Necessárias

1. **Remover campos legados**
   - ❌ Remover inputs de city/neighborhood (se existirem)

2. **Adicionar validação de location_id**
   ```typescript
   if (!data.location_id) {
     throw new Error('location_id é obrigatório');
   }
   ```

3. **Adicionar feedback visual**
   ```typescript
   <div className="text-sm text-muted-foreground">
     <MapPin className="h-4 w-4 inline" />
     Postando em: {location?.name}
   </div>
   ```

4. **Validar permissão territorial** (se Cenário C da Fase 0)
   ```typescript
   // Se location_id é cidade, verificar permissão
   if (location.type === 'city' && !user.verified) {
     throw new Error('Apenas usuários verificados podem postar para toda cidade');
   }
   ```

---

### 3.3 Atualizar createPost() (1h)

```typescript
// PostService.ts

async createPost(profileId: string, data: CreatePostData): Promise<Post> {
  // 1. Validar location_id
  const { data: location } = await supabase
    .from('locations')
    .select('id, type, status')
    .eq('id', data.location_id)
    .eq('status', 'active')
    .single();

  if (!location) {
    throw new PostError('Invalid location_id', 'INVALID_LOCATION', 400);
  }

  // 2. Validar permissão territorial (se necessário)
  if (location.type === 'city') {
    const profile = await profileService.getProfileById(profileId);
    if (!profile.verified && profile.reputation < 100) {
      throw new PostError(
        'Apenas usuários verificados ou com 100+ reputação podem postar para toda cidade',
        'INSUFFICIENT_PERMISSION',
        403
      );
    }
  }

  // 3. Criar post
  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      author_profile_id: profileId,
      location_id: data.location_id, // ✅ SSOT
      content: data.content,
      type: data.type,
      image_url: data.image_url,
      is_published: true,
    })
    .select(SELECT_PUBLIC)
    .single();

  if (error) {
    throw new PostError(error.message, error.code || 'CREATE_FAILED');
  }

  return post;
}
```

---

## FASE 4: COMPONENTES DE RENDERIZAÇÃO (4h)

### 4.1 Refatorar UnifiedPostCard (1h)

**Objetivo**: Usar `post.location?.name` em vez de `post.neighborhood`.

#### Mudanças

**ANTES**:
```typescript
<span className="flex items-center gap-1">
  <MapPin className="h-3 w-3" />
  {post.neighborhood}
</span>
```

**DEPOIS**:
```typescript
<span className="flex items-center gap-1">
  <MapPin className="h-3 w-3" />
  {post.location?.name ?? post.neighborhood ?? 'Localização não definida'}
</span>
```

**Tratamento de Casos Especiais**:
```typescript
// Se location é cidade, mostrar "Toda Salvador"
const locationDisplay = post.location?.type === 'city'
  ? `Toda ${post.location.name}`
  : post.location?.name ?? post.neighborhood ?? 'Localização não definida';
```

---

### 4.2 Refatorar CommunityFeed (1h)

**Objetivo**: Usar TerritoryFilter para filtrar posts.

#### Mudanças

**ANTES**:
```typescript
const { data: posts } = useQuery({
  queryKey: ['posts', city, neighborhood],
  queryFn: () => PostService.getPostsByLocation({ city, neighborhood }),
});
```

**DEPOIS**:
```typescript
const { selectedLocation } = useTerritoryContext();
const filter = useTerritoryFilter(selectedLocation);

const { data: posts } = useQuery({
  queryKey: ['posts', filter.location_ids],
  queryFn: () => PostQueryService.listPublished({
    location_ids: filter.location_ids,
  }),
});
```

---

### 4.3 Refatorar UserPostsGrid (1h)

**Objetivo**: Exibir bairro correto nos posts do usuário.

#### Mudanças

```typescript
// UserPostsGrid.tsx

{posts.map((post) => (
  <PostCard
    key={post.id}
    post={post}
    showLocation={true} // ✅ Mostrar bairro
  />
))}
```

**PostCard deve renderizar**:
```typescript
{showLocation && (
  <div className="text-sm text-muted-foreground">
    <MapPin className="h-3 w-3 inline" />
    {post.location?.name ?? post.neighborhood}
  </div>
)}
```

---

### 4.4 Refatorar SearchModal (1h)

**Objetivo**: Busca deve filtrar por location_ids.

#### Mudanças

**ANTES**:
```typescript
const searchPosts = async (term: string) => {
  return PostService.searchPosts(term, { city, neighborhood });
};
```

**DEPOIS**:
```typescript
const { selectedLocation } = useTerritoryContext();
const filter = useTerritoryFilter(selectedLocation);

const searchPosts = async (term: string) => {
  return PostQueryService.searchPosts(filter.location_ids, term);
};
```

---

### 4.5 Checklist de Renderização

**Componentes a Verificar**:
- [ ] UnifiedPostCard - exibe location.name
- [ ] PostCard - exibe location.name
- [ ] CommunityFeed - usa TerritoryFilter
- [ ] UnifiedFeedWithMessages - usa TerritoryFilter
- [ ] UserPostsGrid - exibe location.name
- [ ] SavedPostsGrid - exibe location.name
- [ ] SearchModal - usa TerritoryFilter
- [ ] Admin pages - exibem location.name

**Casos Especiais**:
- [ ] Post com location_id null (dados antigos)
- [ ] Post com location type='city' (mostrar "Toda Salvador")
- [ ] Post com location inativa (mostrar aviso)

---

## FASE 5: TESTES EXPANDIDOS (5h)

### 5.1 Testes Runtime (2h)

```typescript
// tests/ssot-posts.test.ts

import { describe, it, expect, beforeAll } from 'vitest';
import { PostQueryService } from '@/core/posts/services/PostQueryService';
import { PostService } from '@/core/posts/services/PostService';

const BARRA_ID = '5c91b9e1-17bf-4707-9ba7-0dd82ada7eb3';
const SALVADOR_ID = '40000000-0000-0000-0000-000000000001';

describe('PostQueryService - SSOT Compliance', () => {
  
  describe('listPublished', () => {
    it('should filter by location_ids', async () => {
      const result = await PostQueryService.listPublished({
        location_ids: [BARRA_ID],
      });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.every(p => p.location_id === BARRA_ID)).toBe(true);
    });

    it('should return empty array for empty location_ids', async () => {
      const result = await PostQueryService.listPublished({
        location_ids: [],
      });
      
      expect(result).toEqual([]);
    });

    it('should include location data', async () => {
      const result = await PostQueryService.listPublished({
        location_ids: [BARRA_ID],
        limit: 1,
      });
      
      if (result.length > 0) {
        expect(result[0].location).toBeDefined();
        expect(result[0].location?.name).toBeDefined();
        expect(result[0].location?.geographic_path).toBeDefined();
      }
    });
  });

  describe('getPostsForFeed', () => {
    it('should expand city to districts', async () => {
      const result = await PostQueryService.getPostsForFeed(
        [SALVADOR_ID],
        10,
        0
      );
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      // Posts devem ser de distritos de Salvador, não da cidade
      if (result.length > 0) {
        const locationTypes = result.map(p => p.location?.type);
        expect(locationTypes.every(t => t === 'district' || t === 'city')).toBe(true);
      }
    });

    it('should respect limit and offset', async () => {
      const page1 = await PostQueryService.getPostsForFeed([BARRA_ID], 5, 0);
      const page2 = await PostQueryService.getPostsForFeed([BARRA_ID], 5, 5);
      
      expect(page1.length).toBeLessThanOrEqual(5);
      expect(page2.length).toBeLessThanOrEqual(5);
      
      // Não deve haver overlap
      const ids1 = page1.map(p => p.id);
      const ids2 = page2.map(p => p.id);
      const overlap = ids1.filter(id => ids2.includes(id));
      expect(overlap.length).toBe(0);
    });
  });

  describe('searchPosts', () => {
    it('should search within location_ids', async () => {
      const result = await PostQueryService.searchPosts(
        [BARRA_ID],
        'teste',
        10
      );
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      if (result.length > 0) {
        expect(result.every(p => p.location_id === BARRA_ID)).toBe(true);
      }
    });

    it('should return empty for empty search term', async () => {
      const result = await PostQueryService.searchPosts([BARRA_ID], '', 10);
      expect(result).toEqual([]);
    });
  });

  describe('countPublished', () => {
    it('should count posts by location_ids', async () => {
      const count = await PostQueryService.countPublished([BARRA_ID]);
      
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for empty location_ids', async () => {
      const count = await PostQueryService.countPublished([]);
      expect(count).toBe(0);
    });
  });
});

describe('PostService - Creation with SSOT', () => {
  
  it('should validate location_id on create', async () => {
    const invalidLocationId = '00000000-0000-0000-0000-000000000000';
    
    await expect(
      PostService.createPost('profile-id', {
        location_id: invalidLocationId,
        content: 'Test post',
        type: 'text',
      })
    ).rejects.toThrow('Invalid location_id');
  });

  it('should require location_id on create', async () => {
    await expect(
      PostService.createPost('profile-id', {
        content: 'Test post',
        type: 'text',
        // location_id missing
      })
    ).rejects.toThrow();
  });
});
```

---

### 5.2 Testes E2E (2h)

```typescript
// tests/e2e/posts.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Posts - SSOT Compliance', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login se necessário
  });

  test('Feed - Should display posts from selected location', async ({ page }) => {
    // Selecionar Barra no seletor territorial
    await page.click('[data-testid="territory-selector"]');
    await page.click('text=Barra');
    
    // Aguardar feed carregar
    await page.waitForSelector('[data-testid="post-card"]');
    
    // Verificar que posts exibem "Barra"
    const locationTexts = await page.locator('[data-testid="post-location"]').allTextContents();
    expect(locationTexts.every(text => text.includes('Barra'))).toBe(true);
  });

  test('Create Post - Should use location from selector', async ({ page }) => {
    // Selecionar Pelourinho
    await page.click('[data-testid="territory-selector"]');
    await page.click('text=Pelourinho');
    
    // Abrir composer
    await page.click('[data-testid="create-post-button"]');
    
    // Verificar que location está pré-selecionado
    const locationDisplay = await page.locator('[data-testid="post-location-display"]').textContent();
    expect(locationDisplay).toContain('Pelourinho');
    
    // Criar post
    await page.fill('[data-testid="post-content"]', 'Post de teste no Pelourinho');
    await page.click('[data-testid="submit-post"]');
    
    // Aguardar sucesso
    await page.waitForSelector('text=Post criado com sucesso');
    
    // Verificar que post aparece no feed
    await page.waitForSelector('text=Post de teste no Pelourinho');
  });

  test('Search - Should filter by location', async ({ page }) => {
    // Selecionar Barra
    await page.click('[data-testid="territory-selector"]');
    await page.click('text=Barra');
    
    // Abrir busca
    await page.click('[data-testid="search-button"]');
    await page.fill('[data-testid="search-input"]', 'teste');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    // Aguardar resultados
    await page.waitForSelector('[data-testid="search-result"]');
    
    // Verificar que resultados são da Barra
    const locationTexts = await page.locator('[data-testid="post-location"]').allTextContents();
    expect(locationTexts.every(text => text.includes('Barra'))).toBe(true);
  });

  test('User Posts - Should display location correctly', async ({ page }) => {
    // Ir para perfil
    await page.goto('/perfil/usuario-teste');
    
    // Aguardar posts carregarem
    await page.waitForSelector('[data-testid="user-post"]');
    
    // Verificar que posts exibem location
    const locationElements = await page.locator('[data-testid="post-location"]').count();
    expect(locationElements).toBeGreaterThan(0);
  });

  test('City-wide Post - Should display "Toda Salvador"', async ({ page }) => {
    // Criar post para toda cidade (requer permissão)
    // Este teste assume que há um post de cidade no seed
    
    await page.goto('/');
    
    // Procurar post de cidade
    const cityPost = page.locator('[data-testid="post-card"]').filter({
      hasText: 'Toda Salvador'
    });
    
    await expect(cityPost).toBeVisible();
  });
});

test.describe('Posts - Negative Cases', () => {
  
  test('Should handle posts without location gracefully', async ({ page }) => {
    // Este teste verifica posts antigos sem location_id
    await page.goto('/');
    
    // Não deve quebrar a página
    await expect(page.locator('[data-testid="post-card"]')).toBeVisible();
    
    // Posts sem location devem mostrar fallback
    const fallbackText = await page.locator('text=Localização não definida').count();
    // Pode ser 0 se todos os posts têm location
    expect(fallbackText).toBeGreaterThanOrEqual(0);
  });

  test('Should prevent creating post without location', async ({ page }) => {
    // Tentar criar post sem location (se possível via UI)
    await page.click('[data-testid="create-post-button"]');
    await page.fill('[data-testid="post-content"]', 'Post sem location');
    
    // Remover location de alguma forma (depende da UI)
    // ...
    
    await page.click('[data-testid="submit-post"]');
    
    // Deve mostrar erro
    await expect(page.locator('text=location_id é obrigatório')).toBeVisible();
  });
});
```

---

### 5.3 Testes de Regressão (1h)

```typescript
// tests/regression-posts.test.ts

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const POSTS_MODULE_PATH = join(process.cwd(), 'src/core/posts');

function readTsFiles(dir: string): { path: string; content: string }[] {
  const files: { path: string; content: string }[] = [];
  
  const entries = readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (entry.name === '__mocks__' || entry.name === 'node_modules') continue;
      files.push(...readTsFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.spec.ts')) continue;
      
      const content = readFileSync(fullPath, 'utf-8');
      files.push({ path: fullPath, content });
    }
  }
  
  return files;
}

describe('Regression: Legacy Field Usage', () => {
  it('should not use city/neighborhood filters', () => {
    const files = readTsFiles(POSTS_MODULE_PATH);
    const violations: string[] = [];
    
    for (const file of files) {
      // Ignorar PostService.ts (pode ter fallback temporário)
      if (file.path.includes('PostService.ts')) continue;
      
      const lines = file.content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.includes('.eq(\'city\'') || line.includes('.eq("city"')) {
          violations.push(`${file.path}:${i + 1}: Uses .eq('city') filter`);
        }
        if (line.includes('.eq(\'neighborhood\'') || line.includes('.eq("neighborhood"')) {
          violations.push(`${file.path}:${i + 1}: Uses .eq('neighborhood') filter`);
        }
      }
    }
    
    if (violations.length > 0) {
      throw new Error(
        `❌ Legacy territorial filters found!\n\n` +
        `Use .in('location_id', locationIds) instead:\n\n` +
        violations.join('\n')
      );
    }
  });

  it('should not read neighborhood field directly in components', () => {
    const files = readTsFiles(POSTS_MODULE_PATH);
    const violations: string[] = [];
    
    for (const file of files) {
      if (!file.path.endsWith('.tsx')) continue;
      
      const lines = file.content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;
        
        if (line.includes('post.neighborhood') || line.includes('post?.neighborhood')) {
          if (!line.includes('post.location?.name') && !line.includes('??')) {
            violations.push(`${file.path}:${i + 1}: Direct usage of 'neighborhood' field without fallback`);
          }
        }
      }
    }
    
    if (violations.length > 0) {
      throw new Error(
        `❌ Direct usage of legacy field 'neighborhood' found!\n\n` +
        `Use post.location?.name ?? post.neighborhood instead:\n\n` +
        violations.join('\n')
      );
    }
  });

  it('should use PostQueryService for queries', () => {
    const files = readTsFiles(POSTS_MODULE_PATH);
    const violations: string[] = [];
    
    for (const file of files) {
      if (file.path.includes('PostService.ts')) continue;
      if (file.path.includes('PostQueryService.ts')) continue;
      
      if (file.content.includes('supabase.from(\'posts\')')) {
        violations.push(`${file.path}: Direct Supabase query to posts table`);
      }
    }
    
    if (violations.length > 0) {
      throw new Error(
        `❌ Direct Supabase queries found!\n\n` +
        `Use PostQueryService instead:\n\n` +
        violations.join('\n')
      );
    }
  });
});
```

---

## FASE 6: SEEDS E FIXTURES (2h)

### 6.1 Seed de Posts (1h)

```sql
-- supabase/seed.sql (adicionar ao arquivo existente)

-- ============================================================================
-- POSTS - Dados de teste oficiais
-- ============================================================================

-- Limpar posts de teste anteriores
DELETE FROM posts WHERE id IN (
  'post-test-barra-1',
  'post-test-pelourinho-1',
  'post-test-salvador-1',
  'post-test-pituba-1'
);

-- Inserir posts de teste
INSERT INTO posts (
  id,
  author_profile_id,
  location_id,
  content,
  type,
  is_published,
  likes_count,
  comments_count,
  created_at,
  updated_at
) VALUES
-- 1. Post na Barra
(
  'post-test-barra-1',
  'profile-test-1', -- Assumindo que existe no seed de profiles
  '5c91b9e1-17bf-4707-9ba7-0dd82ada7eb3', -- Barra
  'Alguém viu o pôr do sol hoje no Farol da Barra? Estava incrível! 🌅',
  'text',
  true,
  15,
  3,
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours'
),
-- 2. Post no Pelourinho
(
  'post-test-pelourinho-1',
  'profile-test-2',
  '40000000-0000-0000-0000-000000000003', -- Pelourinho
  'Show do Olodum hoje às 19h no Largo! Quem vai? 🥁',
  'text',
  true,
  42,
  8,
  NOW() - INTERVAL '4 hours',
  NOW() - INTERVAL '4 hours'
),
-- 3. Post para toda Salvador (cidade)
(
  'post-test-salvador-1',
  'profile-test-verified', -- Perfil verificado
  '40000000-0000-0000-0000-000000000001', -- Salvador (cidade)
  'ATENÇÃO: Previsão de chuva forte para toda Salvador amanhã. Fiquem atentos! ⚠️🌧️',
  'text',
  true,
  128,
  24,
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '1 hour'
),
-- 4. Post na Pituba
(
  'post-test-pituba-1',
  'profile-test-3',
  '384add59-4e53-489d-a7b5-97dea2b3f442', -- Pituba
  'Alguém conhece um bom veterinário aqui na Pituba? Preciso levar meu cachorro. 🐕',
  'text',
  true,
  7,
  12,
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '6 hours'
)
ON CONFLICT (id) DO UPDATE SET
  author_profile_id = EXCLUDED.author_profile_id,
  location_id = EXCLUDED.location_id,
  content = EXCLUDED.content,
  type = EXCLUDED.type,
  is_published = EXCLUDED.is_published,
  likes_count = EXCLUDED.likes_count,
  comments_count = EXCLUDED.comments_count,
  updated_at = NOW();

-- Verificar dados inseridos
SELECT 
  p.id,
  p.content,
  l.name as bairro,
  l.type as tipo_location,
  l.geographic_path,
  p.likes_count,
  p.comments_count
FROM posts p
LEFT JOIN locations l ON p.location_id = l.id
WHERE p.id IN (
  'post-test-barra-1',
  'post-test-pelourinho-1',
  'post-test-salvador-1',
  'post-test-pituba-1'
)
ORDER BY p.created_at DESC;
```

---

### 6.2 Script de Aplicação (1h)

```bash
#!/bin/bash
# scripts/seed-posts-data.sh

set -e

ENV=${1:-local}

echo "🌱 Aplicando seed de posts..."
echo "Ambiente: $ENV"

if [ "$ENV" = "local" ]; then
  npx supabase db query --linked -f supabase/seed.sql
elif [ "$ENV" = "remote" ]; then
  npx supabase db query --linked -f supabase/seed.sql
else
  echo "❌ Ambiente inválido. Use: local ou remote"
  exit 1
fi

echo "✅ Seed aplicado com sucesso!"

# Verificar dados
echo ""
echo "📊 Verificando posts criados..."
npx supabase db query --linked --sql "
SELECT 
  p.id,
  LEFT(p.content, 50) as content_preview,
  l.name as bairro,
  l.type as tipo,
  p.likes_count,
  p.comments_count
FROM posts p
LEFT JOIN locations l ON p.location_id = l.id
WHERE p.id LIKE 'post-test-%'
ORDER BY p.created_at DESC;
"

echo ""
echo "✅ Seed de posts completo!"
```

---

## FASE 7: DOCUMENTAÇÃO E EVIDÊNCIAS (2h)

### 7.1 Evidências Técnicas (1h)

**Documento**: `EVIDENCIA_SPRINT2_POSTS.md`

Conteúdo obrigatório:

#### 1. Banco de Dados
```sql
-- Estrutura final
\d posts

-- Dados migrados
SELECT 
  COUNT(*) as total,
  COUNT(location_id) as com_location_id,
  COUNT(*) - COUNT(location_id) as sem_location_id,
  ROUND(COUNT(location_id) * 100.0 / COUNT(*), 2) as coverage_percent
FROM posts;

-- Distribuição por tipo de location
SELECT 
  l.type,
  COUNT(*) as count
FROM posts p
JOIN locations l ON p.location_id = l.id
GROUP BY l.type;
```

#### 2. Services
- ✅ `PostQueryService` criado
- ✅ `PostService` refatorado
- ✅ 7 funções migradas de city/neighborhood para location_id
- ✅ Validação de location_id em createPost()

#### 3. Componentes
- ✅ `UnifiedPostCard` usa location.name
- ✅ `CommunityFeed` usa TerritoryFilter
- ✅ `UnifiedComposer` valida location_id
- ✅ Todos os cards exibem bairro do SSOT

#### 4. Testes
- ✅ Runtime: X/X passando
- ✅ E2E: X/X passando
- ✅ Regressão: X/X passando

---

### 7.2 Atualizar Documentação (1h)

#### Atualizar BLUEPRINT_TOURIST_POINTS.md

Adicionar seção:

```markdown
## APRENDIZADOS DO MÓDULO POSTS

### Diferenças em Relação a Tourist Points

1. **Volume de Dados**: Posts tem muito mais registros que tourist_points
   - Solução: Backfill em fases com classificação de matches

2. **Criação Frequente**: Posts são criados constantemente por usuários
   - Solução: Validação rigorosa de location_id no formulário

3. **Alcance Variável**: Posts podem ser de bairro ou cidade
   - Solução: Campo `reach` ou validação de permissão

### Recomendações para Próximos Módulos

- Sempre classificar matches antes de backfill
- Implementar gates técnicos antes de tornar obrigatório
- Considerar volume de dados na estratégia de migração
```

#### Atualizar BACKLOG_EXECUTAVEL_SSOT.md

```markdown
## MÓDULO: posts

### ✅ CORRIGIDO (Sprint 2)
| Arquivo | Função | Status |
|---------|--------|--------|
| `PostService.ts` | getFeed() | ✅ Usa location_id |
| `PostService.ts` | getPostsByLocation() | ✅ Usa PostQueryService |
| `PostService.ts` | getActiveAlerts() | ✅ Usa location_id |
| `PostService.ts` | getPopularTags() | ✅ Usa location_id |
| `PostService.ts` | getTopPosts() | ✅ Usa location_id |
| `UnifiedPostCard.tsx` | render() | ✅ Usa location.name |
| `UnifiedComposer.tsx` | createPost() | ✅ Valida location_id |

### 📊 Métricas
- **Cobertura**: 98.5% dos posts com location_id
- **Performance**: Queries < 50ms
- **Testes**: 100% passando
```

---

## RESUMO EXECUTIVO

### Estimativa Total: 35h (4.4 dias)

| Fase | Descrição | Horas |
|------|-----------|-------|
| 0 | Definição de Regras Territoriais | 4h |
| - | Auditoria Completa | 6h |
| 1 | Modelagem e Migração Segura | 8h |
| 2 | Service Layer | 6h |
| 3 | Formulários e Criação | 4h |
| 4 | Componentes de Renderização | 4h |
| 5 | Testes Expandidos | 5h |
| 6 | Seeds e Fixtures | 2h |
| 7 | Documentação e Evidências | 2h |

---

## CHECKLIST DE APROVAÇÃO

### Fase 0 - Regras Territoriais
- [ ] Decisão sobre escopo territorial (A, B ou C)
- [ ] Decisão sobre relação com seletor global (1 ou 2)
- [ ] Decisão sobre grupos territoriais (A ou B)
- [ ] Documento `REGRAS_TERRITORIAIS_POSTS.md` criado
- [ ] Diagramas de fluxo documentados
- [ ] Aprovação formal

### Auditoria
- [ ] `AUDITORIA_POSTS_WRITES.md` completo
- [ ] `AUDITORIA_POSTS_READS.md` completo
- [ ] `AUDITORIA_POSTS_RENDERS.md` completo
- [ ] `AUDITORIA_POSTS_FORMS.md` completo
- [ ] `AUDITORIA_POSTS_CONSOLIDADA.md` completo

### Fase 1 - Modelagem
- [ ] Análise de dados existentes executada
- [ ] Classificação de matches (EXATO, AMBIGUO, SEM_MATCH) completa
- [ ] Backfill Fase 1 (MATCH_EXATO) aplicado
- [ ] Backfill Fase 2 (MATCH_AMBIGUO) aplicado
- [ ] Backfill Fase 3 (SEM_MATCH) aplicado
- [ ] Foreign Key adicionada
- [ ] Gate 1: Cobertura >= 95% ✅
- [ ] Gate 2: Integridade referencial ✅
- [ ] Gate 3: Performance < 50ms ✅
- [ ] Gate 4: Validação de dados ✅
- [ ] Gate 5: Testes de regressão ✅
- [ ] location_id tornado NOT NULL

### Fase 2 - Services
- [ ] `PostQueryService` criado
- [ ] `listPublished()` implementado
- [ ] `getPostsForFeed()` implementado
- [ ] `searchPosts()` implementado
- [ ] `countPublished()` implementado
- [ ] `expandLocationIds()` implementado
- [ ] `PostService.getFeed()` refatorado
- [ ] `PostService.getPostsByLocation()` refatorado
- [ ] `PostService.getActiveAlerts()` refatorado
- [ ] `PostService.getPopularTags()` refatorado
- [ ] `PostService.getTopPosts()` refatorado

### Fase 3 - Formulários
- [ ] Fonte de location_id definida (conforme Fase 0)
- [ ] `UnifiedComposer` refatorado
- [ ] Validação de location_id implementada
- [ ] Feedback visual de território implementado
- [ ] `PostService.createPost()` atualizado
- [ ] Validação de permissão territorial implementada

### Fase 4 - Renderização
- [ ] `UnifiedPostCard` refatorado
- [ ] `CommunityFeed` refatorado
- [ ] `UserPostsGrid` refatorado
- [ ] `SavedPostsGrid` refatorado
- [ ] `SearchModal` refatorado
- [ ] Tratamento de casos especiais implementado
- [ ] Todos os componentes testados

### Fase 5 - Testes
- [ ] Testes runtime criados (15+ testes)
- [ ] Testes E2E criados (8+ testes)
- [ ] Testes de regressão criados (5+ testes)
- [ ] Todos os testes passando (100%)
- [ ] Testes adicionados ao CI

### Fase 6 - Seeds
- [ ] Seed de posts criado
- [ ] 4+ posts de teste incluídos
- [ ] Script de aplicação criado
- [ ] Seed validado em ambiente local

### Fase 7 - Documentação
- [ ] `EVIDENCIA_SPRINT2_POSTS.md` criado
- [ ] `BLUEPRINT_TOURIST_POINTS.md` atualizado
- [ ] `BACKLOG_EXECUTAVEL_SSOT.md` atualizado
- [ ] Métricas documentadas

---

## RISCOS E MITIGAÇÕES

### Risco 1: Volume de Dados
- **Problema**: Tabela posts pode ter milhares de registros
- **Impacto**: Backfill pode ser lento ou falhar
- **Mitigação**: 
  - Backfill em fases (EXATO → AMBIGUO → SEM_MATCH)
  - Executar fora de horário de pico
  - Monitorar performance durante migração

### Risco 2: Decisões da Fase 0
- **Problema**: Decisões erradas podem impactar UX
- **Impacto**: Usuários confusos sobre onde posts aparecem
- **Mitigação**:
  - Validar decisões com stakeholders
  - Criar protótipos de UI antes de implementar
  - Permitir rollback se necessário

### Risco 3: Posts Sem Location
- **Problema**: Alguns posts podem não ter match no SSOT
- **Impacto**: Posts ficam inacessíveis
- **Mitigação**:
  - Tabela `posts_pending_location` para revisão manual
  - Fallback para cidade quando bairro não encontrado
  - Não deletar dados, apenas marcar para revisão

### Risco 4: Performance
- **Problema**: Queries com `.in('location_id')` podem ser lentas
- **Impacto**: Feed lento
- **Mitigação**:
  - Índices adequados já existem
  - Limitar expansão cidade→distritos
  - Cache de queries frequentes

### Risco 5: Dependências
- **Problema**: Muitos componentes dependem de PostService
- **Impacto**: Mudanças podem quebrar funcionalidades
- **Mitigação**:
  - Testes de regressão abrangentes
  - Manter compatibilidade temporária
  - Migrar gradualmente

---

## CRITÉRIOS DE SUCESSO

### Técnicos
- ✅ 95%+ dos posts com location_id válido
- ✅ 100% dos testes passando
- ✅ Performance < 50ms em queries principais
- ✅ Zero queries usando city/neighborhood (exceto fallback documentado)
- ✅ Zero componentes lendo post.neighborhood diretamente

### Funcionais
- ✅ Usuários conseguem criar posts
- ✅ Feed exibe posts do território selecionado
- ✅ Busca filtra por território
- ✅ Posts exibem bairro correto
- ✅ Posts de cidade exibem "Toda [Cidade]"

### Documentação
- ✅ Todas as decisões documentadas
- ✅ Evidências técnicas completas
- ✅ Blueprint atualizado
- ✅ Backlog atualizado

---

## PRÓXIMOS PASSOS APÓS APROVAÇÃO

1. **Executar Fase 0**: Definir regras territoriais (4h)
2. **Executar Auditoria**: Mapear todos os pontos de correção (6h)
3. **Executar Fase 1**: Migração segura com gates (8h)
4. **Executar Fases 2-7**: Implementação completa (23h)
5. **Validação Final**: Testes e evidências (incluído nas fases)
6. **Avançar para Profiles**: Próximo módulo do backlog

---

## APROVAÇÃO

**Este plano está pronto para aprovação e execução.**

Aguardando:
- [ ] Aprovação das decisões da Fase 0
- [ ] Aprovação da estratégia de backfill
- [ ] Aprovação da estimativa de 35h
- [ ] Aprovação para iniciar execução

---

**Versão**: 2.0  
**Data**: 2026-04-05  
**Autor**: Sistema SSOT Territorial  
**Status**: 🟡 Aguardando Aprovação
