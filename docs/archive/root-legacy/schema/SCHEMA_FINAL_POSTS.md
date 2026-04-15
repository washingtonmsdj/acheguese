# SCHEMA FINAL - POSTS

**Data**: 2026-04-05  
**Status**: ✅ DOCUMENTADO  
**Fonte**: `supabase/migrations/20260325000000_base_schema.sql`

---

## SCHEMA ATUAL (REAL)

### Tabela: posts

```sql
CREATE TABLE posts (
  -- Identificação
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Autoria (DUPLICADO - precisa limpeza)
  autor_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- LEGADO
  author_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,  -- CANÔNICO
  
  -- Conteúdo (DUPLICADO - precisa limpeza)
  texto             TEXT,    -- LEGADO
  content           TEXT,    -- CANÔNICO
  type              TEXT NOT NULL DEFAULT 'text'
    CHECK (type IN ('text','image','video','link','poll','alerta')),
  image_url         TEXT,
  video_url         TEXT,
  images            JSONB DEFAULT '[]',
  
  -- Localização (DUPLICADO - precisa limpeza)
  city              TEXT,    -- LEGADO
  neighborhood      TEXT,    -- LEGADO
  street            TEXT,    -- LEGADO
  location_id       UUID,    -- CANÔNICO (nullable)
  
  -- Contadores
  likes_count       INTEGER NOT NULL DEFAULT 0,
  comments_count    INTEGER NOT NULL DEFAULT 0,
  
  -- Community posts extras
  tags              JSONB DEFAULT '[]',
  confirmations_count INTEGER NOT NULL DEFAULT 0,
  is_verified       BOOLEAN NOT NULL DEFAULT false,
  is_published      BOOLEAN NOT NULL DEFAULT true,
  
  -- Auditoria
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Índices Existentes

```sql
CREATE INDEX idx_posts_author_profile_id ON posts(author_profile_id);
CREATE INDEX idx_posts_created_at        ON posts(created_at DESC);
CREATE INDEX idx_posts_location_id       ON posts(location_id) WHERE location_id IS NOT NULL;
CREATE INDEX idx_posts_type              ON posts(type);
```

### RLS Policies Existentes

```sql
-- Policy de leitura
CREATE POLICY "Published posts viewable" ON posts 
  FOR SELECT TO anon, authenticated 
  USING (is_published = true);

-- Policy de gerenciamento
CREATE POLICY "Authors manage own posts" ON posts 
  FOR ALL TO authenticated
  USING (author_profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));
```

---

## TABELA: community_posts

```sql
CREATE TABLE community_posts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_profile_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type                TEXT NOT NULL DEFAULT 'post',
  content             TEXT,
  tags                JSONB DEFAULT '[]',
  location_id         UUID,
  confirmations_count INTEGER NOT NULL DEFAULT 0,
  is_verified         BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Status**: ✅ Existe no banco, sem dados

---

## TABELA: profiles

```sql
-- Colunas relevantes
id       UUID PRIMARY KEY
user_id  UUID REFERENCES auth.users(id)  -- Relação com auth
```

**Importante**: `profiles.id` ≠ `auth.uid()`
- `auth.uid()` retorna `user_id`
- `author_profile_id` referencia `profiles.id`
- RLS precisa fazer JOIN: `profiles.user_id = auth.uid()`

---

## PROBLEMAS IDENTIFICADOS

### 1. Duplicação de Colunas

**Autoria**:
- ❌ `autor_id` (legado) → `auth.users.id`
- ✅ `author_profile_id` (canônico) → `profiles.id`

**Conteúdo**:
- ❌ `texto` (legado)
- ✅ `content` (canônico)

**Localização**:
- ❌ `city`, `neighborhood`, `street` (legados)
- ✅ `location_id` (canônico, nullable)

### 2. Colunas Faltantes

❌ **reach** - Não existe (precisa criar)
❌ **status** - Não existe (precisa criar se necessário)

### 3. RLS Policies Incorretas

❌ **Problema**: `author_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())`

Isso funciona, mas é ineficiente. Melhor:
```sql
USING (author_profile_id = (
  SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
))
```

---

## SCHEMA FINAL DESEJADO

### Limpeza de Duplicações

```sql
-- Remover colunas legadas
ALTER TABLE posts
  DROP COLUMN IF EXISTS autor_id,
  DROP COLUMN IF EXISTS texto,
  DROP COLUMN IF EXISTS city,
  DROP COLUMN IF EXISTS neighborhood,
  DROP COLUMN IF EXISTS street;
```

### Adicionar Colunas Necessárias

```sql
-- Adicionar reach
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS reach TEXT
    CHECK (reach IN ('street', 'neighborhood', 'city'))
    DEFAULT 'neighborhood';

-- Adicionar status se necessário
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS status TEXT
    CHECK (status IN ('active', 'archived', 'deleted'))
    DEFAULT 'active';
```

### Tornar location_id Obrigatório

```sql
-- Após backfill (se houver dados)
ALTER TABLE posts
  ALTER COLUMN location_id SET NOT NULL;

-- Adicionar constraint de tipo
ALTER TABLE posts
  ADD CONSTRAINT posts_location_type_check
  CHECK (
    location_id IS NULL OR
    EXISTS (
      SELECT 1 FROM locations 
      WHERE id = location_id 
        AND type IN ('city', 'district')
        AND status = 'active'
    )
  );
```

### RLS Policies Corrigidas

```sql
-- Remover policies antigas
DROP POLICY IF EXISTS "Published posts viewable" ON posts;
DROP POLICY IF EXISTS "Authors manage own posts" ON posts;

-- Policy de leitura
CREATE POLICY posts_read_published ON posts
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

-- Policy de leitura própria
CREATE POLICY posts_read_own ON posts
  FOR SELECT TO authenticated
  USING (author_profile_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
  ));

-- Policy de criação
CREATE POLICY posts_create ON posts
  FOR INSERT TO authenticated
  WITH CHECK (
    author_profile_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
    )
    AND location_id IS NOT NULL
  );

-- Policy de atualização
CREATE POLICY posts_update_own ON posts
  FOR UPDATE TO authenticated
  USING (author_profile_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
  ))
  WITH CHECK (author_profile_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
  ));

-- Policy de deleção
CREATE POLICY posts_delete_own ON posts
  FOR DELETE TO authenticated
  USING (author_profile_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
  ));
```

---

## SEMÂNTICA DE reach

### Definição

**reach** é um metadado de visibilidade/alcance do post, NÃO afeta filtros territoriais.

### Valores Permitidos

- `street`: Post de escopo muito local (ex: "Buraco na minha rua")
- `neighborhood`: Post de escopo de bairro (padrão)
- `city`: Post de escopo de cidade (ex: "Evento para toda Salvador")

### Comportamento

**Filtros Territoriais** (usam `location_id`):
- Usuário em Salvador (cidade) → vê posts de Salvador + todos os bairros
- Usuário em Barra (bairro) → vê posts da Barra + Salvador (cidade-pai)

**reach NÃO afeta filtros**:
- Post com `location_id=barra` e `reach=city` → aparece no feed da Barra
- Post com `location_id=salvador` e `reach=street` → aparece no feed de Salvador

**reach é apenas informativo**:
- UI pode exibir badge: "📍 Rua", "🏘️ Bairro", "🏙️ Cidade"
- Pode ser usado para ordenação (posts de rua primeiro)
- Pode ser usado para notificações (alertas de rua são mais urgentes)

### Validação

```typescript
// reach é opcional, default 'neighborhood'
interface CreatePostData {
  author_profile_id: string;
  content: string;
  type: PostType;
  location_id: string;  // obrigatório
  reach?: 'street' | 'neighborhood' | 'city';  // opcional
}
```

---

## DEPENDÊNCIAS DE community_posts

### Código que Usa community_posts

**Services**:
- `PostService.createCommunityPost()` - Linha 885
- `PostService.createCommunityPostWithValidation()` - Linha 2088

**Hooks**:
- `useCreatePost.ts` - Usa `createCommunityPostWithValidation()`

**Componentes**:
- Nenhum componente renderiza diretamente de `community_posts`
- Todos usam `posts` via `PostService.getFeed()`

### Estratégia de Remoção

**Fase 1**: Redirecionar funções
```typescript
// createCommunityPost() → createPost()
async createCommunityPost(data) {
  return this.createPost(data);
}
```

**Fase 2**: Deprecar funções
```typescript
/** @deprecated Use createPost() instead */
async createCommunityPost(data) {
  console.warn('createCommunityPost is deprecated, use createPost');
  return this.createPost(data);
}
```

**Fase 3**: Remover tabela (após código não depender)
```sql
DROP TABLE IF EXISTS community_posts CASCADE;
```

---

## CRONOGRAMA DE MUDANÇAS

### Sprint 2 - Fase 0: Preparação (2h)
1. ✅ Adicionar coluna `reach`
2. ✅ Adicionar coluna `status` (se necessário)
3. ✅ Criar índice GIN para textSearch
4. ❌ NÃO remover colunas legadas ainda (código pode depender)
5. ❌ NÃO remover community_posts ainda (código depende)

### Sprint 2 - Fase 1: Modelagem (5h)
1. ✅ Criar função de validação de location_id
2. ✅ Criar trigger de validação
3. ✅ Atualizar RLS policies
4. ✅ Criar índices territoriais

### Sprint 2 - Fase 2: Service Layer (8h)
1. ✅ Corrigir writes para usar location_id
2. ✅ Redirecionar createCommunityPost() → createPost()
3. ✅ Implementar expansão territorial
4. ✅ Remover `supabase as any`

### Sprint 2 - Fase 3+: Formulários, Componentes, Testes (17h)
1. ✅ Corrigir formulários
2. ✅ Corrigir componentes
3. ✅ Criar testes

### Pós-Sprint 2: Limpeza (separado)
1. ⏳ Remover colunas legadas de posts
2. ⏳ Remover tabela community_posts
3. ⏳ Atualizar documentação

---

## VALIDAÇÃO DO SCHEMA

### Checklist

- [x] Schema atual documentado
- [x] Duplicações identificadas
- [x] Colunas faltantes identificadas
- [x] RLS policies corrigidas
- [x] Semântica de reach definida
- [x] Dependências de community_posts mapeadas
- [x] Cronograma de mudanças definido

---

**Status**: ✅ SCHEMA FINAL DOCUMENTADO  
**Próximo Passo**: Reescrever plano Sprint 2 baseado neste schema real
