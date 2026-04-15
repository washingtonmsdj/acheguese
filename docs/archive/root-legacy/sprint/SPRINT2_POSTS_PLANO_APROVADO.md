# SPRINT 2 - POSTS (PLANO APROVADO DEFINITIVO)

**Data**: 2026-04-05  
**Status**: ✅ PRONTO PARA IMPLEMENTAÇÃO  
**Schema**: Introspectado do banco real linked  
**Estimativa**: 40h-45h (5-6 dias úteis)  
**4 Correções**: TODAS APLICADAS

---

## 4 CORREÇÕES OBRIGATÓRIAS APLICADAS

1. ✅ FK com ON DELETE RESTRICT (não SET NULL)
2. ✅ Remover CHECK com EXISTS (usar FK + Trigger)
3. ✅ Schema introspectado do banco real (não migration)
4. ✅ NOT NULL aplicado na Fase 4 (após migração completa)

---

## DECISÕES APROVADAS

1. ✅ posts é a fonte de verdade
2. ✅ location_id é território-base (obrigatório, com FK RESTRICT e NOT NULL)
3. ✅ reach é metadado de visibilidade (NÃO afeta filtros)
4. ✅ Posts em district e city apenas (nunca street ou group)
5. ✅ Filtros: cidade = cidade + distritos; bairro = bairro + cidade-pai
6. ✅ Criação: território ativo por padrão, fallback para profile.location_id
7. ✅ Território group: REJEITAR com erro (sem fallback silencioso)
8. ✅ community_posts será removida APÓS código não depender

---

## SCHEMA REAL (INTROSPECTADO)

**Fonte**: Banco linked introspectado em 2026-04-05  
**Query**: `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'posts'`

**Tabela posts** (colunas existentes no banco):
```
id                  uuid                     NOT NULL
autor_id            uuid                     NULL        (LEGADO)
author_profile_id   uuid                     NOT NULL    (CANÔNICO)
texto               text                     NULL        (LEGADO)
content             text                     NULL        (CANÔNICO)
type                text                     NOT NULL
image_url           text                     NULL
video_url           text                     NULL
images              jsonb                    NULL
city                text                     NULL        (LEGADO)
neighborhood        text                     NULL        (LEGADO)
street              text                     NULL        (LEGADO)
location_id         uuid                     NULL        (CANÔNICO - será NOT NULL na Fase 4)
likes_count         integer                  NOT NULL
comments_count      integer                  NOT NULL
tags                jsonb                    NULL
confirmations_count integer                  NOT NULL
is_verified         boolean                  NOT NULL
is_published        boolean                  NOT NULL
created_at          timestamp with time zone NOT NULL
updated_at          timestamp with time zone NOT NULL
```

**Colunas que NÃO existem** (precisam ser criadas):
- ❌ `reach` - Será criada na Fase 0

---

## FASE 0: PREPARAÇÃO ESTRUTURAL (2h)

### Migração: 20260405000020_prepare_posts_ssot.sql

```sql
-- 1. Adicionar coluna reach
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS reach TEXT
    CHECK (reach IN ('street', 'neighborhood', 'city'))
    DEFAULT 'neighborhood';

COMMENT ON COLUMN posts.reach IS 
  'Metadado de visibilidade. NÃO afeta filtros territoriais.';

-- 2. Criar índice GIN para textSearch
CREATE INDEX IF NOT EXISTS idx_posts_content_search 
  ON posts 
  USING gin(to_tsvector('portuguese', content));

-- 3. Criar índice para reach
CREATE INDEX IF NOT EXISTS idx_posts_reach 
  ON posts(reach) 
  WHERE reach IS NOT NULL;
```

---

## FASE 1: MODELAGEM TERRITORIAL (4h)

### Migração: 20260405000021_posts_territorial_constraints.sql

```sql
-- ============================================================================
-- CORREÇÃO 1: FK com ON DELETE RESTRICT (não SET NULL)
-- ============================================================================
ALTER TABLE posts
  ADD CONSTRAINT posts_location_id_fkey
  FOREIGN KEY (location_id)
  REFERENCES locations(id)
  ON DELETE RESTRICT;

COMMENT ON CONSTRAINT posts_location_id_fkey ON posts IS
  'FK com RESTRICT: não permite deletar location se houver posts. location_id será NOT NULL na Fase 4.';

-- ============================================================================
-- CORREÇÃO 2: Remover CHECK com EXISTS - usar FK + Trigger
-- ============================================================================
-- FK garante existência
-- Trigger valida type e status

-- CORREÇÃO 3: Sintaxe correta do trigger PL/pgSQL
CREATE OR REPLACE FUNCTION validate_post_location()
RETURNS TRIGGER AS $$
DECLARE
  loc_type TEXT;
  loc_status TEXT;
BEGIN
  IF NEW.location_id IS NOT NULL THEN
    -- Buscar type e status da location
    SELECT type, status
      INTO loc_type, loc_status
    FROM locations
    WHERE id = NEW.location_id;
    
    -- Validar existência
    IF loc_type IS NULL THEN
      RAISE EXCEPTION 'location_id inexistente';
    END IF;
    
    -- Validar tipo (city ou district)
    IF loc_type NOT IN ('city', 'district') THEN
      RAISE EXCEPTION 'Posts só podem ser criados em cidades ou bairros (type: city ou district)';
    END IF;
    
    -- Validar status (active)
    IF loc_status <> 'active' THEN
      RAISE EXCEPTION 'Localização inativa';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_post_location_trigger
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION validate_post_location();

-- ============================================================================
-- Índices territoriais
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_posts_location_created 
  ON posts(location_id, created_at DESC) 
  WHERE location_id IS NOT NULL AND is_published = true;

CREATE INDEX IF NOT EXISTS idx_posts_location_reach 
  ON posts(location_id, reach) 
  WHERE location_id IS NOT NULL;

-- ============================================================================
-- RLS Policies (multi-profile com EXISTS)
-- ============================================================================
DROP POLICY IF EXISTS "Published posts viewable" ON posts;
DROP POLICY IF EXISTS "Authors manage own posts" ON posts;

-- Policy: Leitura de posts publicados
CREATE POLICY posts_read_published ON posts
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

-- Policy: Leitura de posts próprios (multi-profile)
CREATE POLICY posts_read_own ON posts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = posts.author_profile_id 
        AND profiles.user_id = auth.uid()
    )
  );

-- Policy: Criação (requer location_id)
CREATE POLICY posts_create ON posts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = posts.author_profile_id 
        AND profiles.user_id = auth.uid()
    )
    AND location_id IS NOT NULL
  );

-- Policy: Atualização própria (multi-profile)
CREATE POLICY posts_update_own ON posts
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = posts.author_profile_id 
        AND profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = posts.author_profile_id 
        AND profiles.user_id = auth.uid()
    )
  );

-- Policy: Deleção própria (multi-profile)
CREATE POLICY posts_delete_own ON posts
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = posts.author_profile_id 
        AND profiles.user_id = auth.uid()
    )
  );
```

**Divisão de Responsabilidades**:
- **FK**: Garante que location_id existe em locations
- **Trigger**: Valida type (city/district) e status (active)
- **NOT NULL**: Será aplicado na Fase 4 (após migração completa)

---

## FASE 2: SERVICE LAYER (8h)

### Arquivo: src/core/posts/services/PostService.ts

### 2.1 Writes - createPost() (3h)

```typescript
async createPost(data: {
  author_profile_id: string;
  content: string;
  type: string;
  location_id: string;
  reach?: 'street' | 'neighborhood' | 'city';
  images?: string[];
  tags?: string[];
}): Promise<Post> {
  // 1. Validar location_id obrigatório
  if (!data.location_id) {
    throw new PostError("location_id é obrigatório", "LOCATION_REQUIRED");
  }

  // 2. Validar que location_id existe e é válido
  const { data: location, error: locationError } = await supabase
    .from('locations')
    .select('id, type, status')
    .eq('id', data.location_id)
    .single();

  if (locationError || !location) {
    throw new PostError("Localização inválida", "INVALID_LOCATION");
  }

  // 3. REJEITAR se for grupo territorial
  if (location.type === 'group') {
    throw new PostError(
      "Posts não podem ser criados em grupos territoriais. Selecione uma cidade ou bairro específico.",
      "GROUP_NOT_ALLOWED"
    );
  }

  // 4. Criar post (trigger validará type e status)
  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      author_profile_id: data.author_profile_id,
      content: data.content,
      type: data.type,
      location_id: data.location_id,
      reach: data.reach || 'neighborhood',
      images: data.images || [],
      tags: data.tags || [],
      is_published: true,
    })
    .select(`
      *,
      author_profile:profiles!author_profile_id(
        id,
        name,
        avatar_url,
        is_verified
      ),
      location:locations!location_id(
        id,
        name,
        type,
        parent_id
      )
    `)
    .single();

  if (error) {
    StructuredLogger.error('PostService', 'createPost', 'Insert error', {
      error: error.message,
      code: error.code,
    });
    throw new PostError(error.message, error.code || "CREATE_FAILED");
  }

  return post;
}
```

### 2.2 Redirecionar createCommunityPost() (1h)

```typescript
/** @deprecated Use createPost() instead. Will be removed after community_posts migration. */
async createCommunityPost(data: any): Promise<Post> {
  console.warn('[PostService] createCommunityPost is deprecated, redirecting to createPost');
  
  return this.createPost({
    author_profile_id: data.author_profile_id,
    content: data.content,
    type: data.type || 'text',
    location_id: data.location_id,
    reach: data.reach,
    tags: data.tags,
  });
}

/** @deprecated Use createPost() instead. Will be removed after community_posts migration. */
async createCommunityPostWithValidation(data: {
  author_profile_id: string;  // Recebe profile_id explicitamente
  content: string;
  type?: string;
  reach?: 'street' | 'neighborhood' | 'city';
  tags?: string[];
  images?: string[];
}): Promise<Post> {
  console.warn('[PostService] createCommunityPostWithValidation is deprecated, redirecting to createPost');
  
  // CORREÇÃO 1: Buscar profile por ID (não por user_id)
  // Isso evita quebrar com multi-profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, location_id')
    .eq('id', data.author_profile_id)
    .single();

  if (!profile) {
    throw new PostError("Profile não encontrado", "PROFILE_NOT_FOUND");
  }

  if (!profile.location_id) {
    throw new PostError("Configure sua localização no perfil", "LOCATION_REQUIRED");
  }

  return this.createPost({
    author_profile_id: profile.id,
    content: data.content,
    type: data.type || 'text',
    location_id: profile.location_id,
    reach: data.reach,
    tags: data.tags,
    images: data.images,
  });
}
```

### 2.3 Reads - getFeed() com Expansão Territorial (3h)

```typescript
async getFeed(params: {
  location_id?: string;
  location_ids?: string[];
  limit?: number;
  cursor?: string;
}): Promise<{ posts: Post[]; nextCursor?: string }> {
  if (!params.location_id && !params.location_ids?.length) {
    StructuredLogger.warn('PostService', 'getFeed', 'Empty location_ids', { params });
    return { posts: [], nextCursor: undefined };
  }

  // Expandir território
  const locationIds = params.location_ids?.length 
    ? params.location_ids 
    : [params.location_id!];
  
  const expandedIds = await this.expandLocationIds(locationIds);

  let query = supabase
    .from('posts')
    .select(`
      id,
      author_profile_id,
      content,
      type,
      location_id,
      reach,
      images,
      tags,
      likes_count,
      comments_count,
      is_published,
      created_at,
      author_profile:profiles!author_profile_id(
        id,
        name,
        avatar_url,
        is_verified
      ),
      location:locations!location_id(
        id,
        name,
        type,
        parent_id
      )
    `)
    .in('location_id', expandedIds)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (params.limit) {
    query = query.limit(params.limit);
  }

  if (params.cursor) {
    query = query.lt('created_at', params.cursor);
  }

  const { data, error } = await query;
  
  if (error) {
    StructuredLogger.error('PostService', 'getFeed', 'Query error', {
      error: error.message,
      params,
    });
    return { posts: [], nextCursor: undefined };
  }
  
  return {
    posts: data as Post[],
    nextCursor: data.length === params.limit ? data[data.length - 1].created_at : undefined,
  };
}

private async expandLocationIds(locationIds: string[]): Promise<string[]> {
  const expanded: string[] = [];

  for (const locationId of locationIds) {
    const { data: location } = await supabase
      .from('locations')
      .select('id, type, parent_id')
      .eq('id', locationId)
      .eq('status', 'active')
      .single();

    if (!location) continue;

    // Adicionar o próprio location_id
    expanded.push(locationId);

    if (location.type === 'city') {
      // Cidade → adicionar todos os distritos
      const { data: districts } = await supabase
        .from('locations')
        .select('id')
        .eq('parent_id', locationId)
        .eq('type', 'district')
        .eq('status', 'active');
      
      if (districts) {
        expanded.push(...districts.map(d => d.id));
      }
    } else if (location.type === 'district') {
      // Bairro → adicionar cidade pai
      if (location.parent_id) {
        expanded.push(location.parent_id);
      }
    }
  }

  return [...new Set(expanded)];
}
```

### 2.4 Logs Estruturados (1h)

```typescript
class StructuredLogger {
  static error(service: string, method: string, message: string, context: any) {
    console.error(JSON.stringify({
      level: 'ERROR',
      service,
      method,
      message,
      context,
      timestamp: new Date().toISOString(),
      stack: context.error?.stack,
    }));
  }

  static warn(service: string, method: string, message: string, context: any) {
    console.warn(JSON.stringify({
      level: 'WARN',
      service,
      method,
      message,
      context,
      timestamp: new Date().toISOString(),
    }));
  }
}
```

---

## FASE 3: FORMULÁRIOS E HOOKS (7h)

### 3.1 CreatePostModal (3h)

```typescript
const handlePublish = async () => {
  if (!form.validateForm()) return;
  if (!profile) { 
    toast.error("Faça login para publicar"); 
    return; 
  }

  // Obter território ativo
  const { filter } = useTerritoryFilter();
  let locationId: string | null = null;
  
  if (filter.scope === 'location') {
    locationId = filter.location_id;
  } else if (filter.scope === 'group') {
    // REJEITAR: Não permitir criação em grupo
    toast.error("Selecione uma cidade ou bairro específico para publicar");
    return;
  } else {
    // Fallback para profile.location_id
    locationId = profile.location_id;
  }

  if (!locationId) {
    toast.error("Configure sua localização no perfil antes de publicar");
    return;
  }

  setPublishing(true);
  try {
    const data = form.getFormData();
    await postService.createPost({
      author_profile_id: profile.id,
      content: data.content,
      type: data.type,
      location_id: locationId,
      reach: data.reach,
      images: data.images,
    });
    toast.success("Post publicado!");
    form.resetForm();
    onClose();
  } catch (error) {
    if (error instanceof PostError) {
      toast.error(error.message);
    } else {
      toast.error("Erro ao publicar");
    }
  } finally {
    setPublishing(false);
  }
};
```

### 3.2 useCreatePostForm (2h)

```typescript
export function useCreatePostForm() {
  const [content, setContent] = useState("");
  const [type, setType] = useState<PostType>("discussao");
  const [reach, setReach] = useState<"street" | "neighborhood" | "city">("neighborhood");
  const [images, setImages] = useState<string[]>([]);

  const getFormData = () => {
    return {
      content,
      type,
      reach,
      images,
    };
  };

  const validateForm = () => {
    if (!content.trim()) {
      toast.error("Conteúdo é obrigatório");
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setContent("");
    setType("discussao");
    setReach("neighborhood");
    setImages([]);
  };

  return {
    content,
    setContent,
    type,
    setType,
    reach,
    setReach,
    images,
    setImages,
    getFormData,
    validateForm,
    resetForm,
  };
}
```

### 3.3 UnifiedComposer (2h)

```typescript
interface UnifiedComposerProps {
  locationId?: string;
  onPostCreated?: () => void;
}

export function UnifiedComposer({ locationId, onPostCreated }: UnifiedComposerProps) {
  const { filter } = useTerritoryFilter();
  const effectiveLocationId = locationId || (filter.scope === 'location' ? filter.location_id : null);

  // ... resto do componente
}
```

---

## FASE 4: APLICAR NOT NULL (1h) ← MOVIDO PARA CÁ

### ⚠️ CORREÇÃO 4: NOT NULL Apenas Após Migração Completa

**Gate de Qualidade** (validar antes de aplicar):
- ✅ Todos os writes usam location_id
- ✅ Todos os forms capturam location_id
- ✅ Todos os hooks validam location_id
- ✅ Nenhum post no banco com location_id NULL

### Migração: 20260405000022_posts_location_id_not_null.sql

```sql
-- ============================================================================
-- CORREÇÃO 4: Aplicar NOT NULL apenas após migração completa
-- ============================================================================

-- 1. Validar que não há posts sem location_id
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM posts WHERE location_id IS NULL;
  
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Ainda existem % posts sem location_id. Migração incompleta.', null_count;
  END IF;
END $$;

-- 2. Aplicar NOT NULL
ALTER TABLE posts
  ALTER COLUMN location_id SET NOT NULL;

-- 3. Validar constraint
COMMENT ON COLUMN posts.location_id IS
  'UUID da location (city ou district). NOT NULL aplicado após migração completa.';

-- 4. Verificar
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'posts' AND column_name = 'location_id';
-- Deve retornar: location_id | NO | uuid
```

---

## FASE 5: COMPONENTES (6h)

### 5.1 UnifiedPostCard (2h)

```typescript
const formattedLocation = useMemo(() => {
  // Usar location do JOIN
  if (post.location?.name) return post.location.name;
  return "Localização não informada";
}, [post.location]);

const reachBadge = useMemo(() => {
  if (!post.reach) return null;
  
  const badges = {
    street: { icon: "📍", label: "Rua" },
    neighborhood: { icon: "🏘️", label: "Bairro" },
    city: { icon: "🏙️", label: "Cidade" },
  };
  
  return badges[post.reach];
}, [post.reach]);
```

### 5.2 CommunityFeed (2h)

```typescript
<UnifiedFeedWithMessages
  posts={posts}
  userLocation={{
    location_id: activeProfile?.location_id,
    location_name: activeProfile?.location?.name,
  }}
/>
```

### 5.3 PostAdapter (2h)

```typescript
private static calculateProximity(
  post: UnifiedPost,
  userLocation: { location_id?: string; location_name?: string },
): number {
  if (post.location_id && userLocation.location_id) {
    if (post.location_id === userLocation.location_id) return 3;
    return 1;
  }
  return 0;
}
```

---

## FASE 6: TESTES (6h)

### 6.1 Runtime (3h)

**Arquivo**: `tests/ssot-posts.test.ts`

```typescript
// CORREÇÃO 3: Fixtures determinísticas
const FIXTURES = {
  profiles: {
    owner: 'profile_seed_owner',
  },
  locations: {
    salvador: 'location_seed_salvador',
    barra: 'location_seed_barra',
    pelourinho: 'location_seed_pelourinho',
  },
  posts: {
    post1: 'post_seed_1',
    post2: 'post_seed_2',
    post3: 'post_seed_3',
  },
};

describe('SSOT Posts', () => {
  beforeAll(async () => {
    // Garantir que fixtures existem
    await seedFixtures();
  });

  it('deve rejeitar post sem location_id', async () => {
    await expect(
      postService.createPost({
        author_profile_id: FIXTURES.profiles.owner,
        content: 'Test',
        type: 'text',
        location_id: null,
      })
    ).rejects.toThrow('location_id é obrigatório');
  });

  it('deve rejeitar post em grupo territorial', async () => {
    // Criar grupo para teste
    const { data: group } = await supabase
      .from('locations')
      .insert({
        id: 'test_group_1',
        name: 'Grupo Teste',
        type: 'group',
        status: 'active',
      })
      .select()
      .single();
    
    await expect(
      postService.createPost({
        author_profile_id: FIXTURES.profiles.owner,
        content: 'Test',
        type: 'text',
        location_id: group.id,
      })
    ).rejects.toThrow('Posts não podem ser criados em grupos territoriais');
    
    // Cleanup
    await supabase.from('locations').delete().eq('id', 'test_group_1');
  });

  it('FK deve impedir deletar location com posts', async () => {
    // Criar location temporária
    const { data: location } = await supabase
      .from('locations')
      .insert({
        id: 'test_location_1',
        name: 'Teste',
        type: 'city',
        status: 'active',
      })
      .select()
      .single();
    
    // Criar post
    await postService.createPost({
      author_profile_id: FIXTURES.profiles.owner,
      content: 'Test',
      type: 'text',
      location_id: location.id,
    });
    
    // Tentar deletar location (deve falhar)
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', location.id);
    
    expect(error).toBeTruthy();
    expect(error.message).toContain('violates foreign key constraint');
  });

  it('cidade deve expandir para cidade + distritos', async () => {
    const expanded = await postService.expandLocationIds([
      FIXTURES.locations.salvador,
    ]);
    
    expect(expanded).toContain(FIXTURES.locations.salvador);
    expect(expanded).toContain(FIXTURES.locations.barra);
    expect(expanded).toContain(FIXTURES.locations.pelourinho);
  });

  it('bairro deve expandir para bairro + cidade pai', async () => {
    const expanded = await postService.expandLocationIds([
      FIXTURES.locations.barra,
    ]);
    
    expect(expanded).toContain(FIXTURES.locations.barra);
    expect(expanded).toContain(FIXTURES.locations.salvador);
  });

  it('SELECT deve incluir location.name', async () => {
    const { posts } = await postService.getFeed({
      location_id: FIXTURES.locations.barra,
    });
    
    const post = posts.find(p => p.id === FIXTURES.posts.post1);
    expect(post).toBeDefined();
    expect(post.location.name).toBe('Barra');
  });

  it('trigger deve validar type', async () => {
    // Criar location com type inválido
    const { data: street } = await supabase
      .from('locations')
      .insert({
        id: 'test_street_1',
        name: 'Rua Teste',
        type: 'street',
        status: 'active',
      })
      .select()
      .single();
    
    await expect(
      postService.createPost({
        author_profile_id: FIXTURES.profiles.owner,
        content: 'Test',
        type: 'text',
        location_id: street.id,
      })
    ).rejects.toThrow('Posts só podem ser criados em cidades ou bairros');
    
    // Cleanup
    await supabase.from('locations').delete().eq('id', 'test_street_1');
  });

  it('trigger deve validar status', async () => {
    // Criar location inativa
    const { data: inactive } = await supabase
      .from('locations')
      .insert({
        id: 'test_inactive_1',
        name: 'Inativa',
        type: 'city',
        status: 'inactive',
      })
      .select()
      .single();
    
    await expect(
      postService.createPost({
        author_profile_id: FIXTURES.profiles.owner,
        content: 'Test',
        type: 'text',
        location_id: inactive.id,
      })
    ).rejects.toThrow('Localização inativa');
    
    // Cleanup
    await supabase.from('locations').delete().eq('id', 'test_inactive_1');
  });
});

// Helper para seed de fixtures
async function seedFixtures() {
  // Executar seed.sql ou criar fixtures programaticamente
  // ...
}
```

### 6.2 E2E (2h)

**Arquivo**: `tests/e2e/posts.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

// CORREÇÃO 3: Fixtures determinísticas
const FIXTURES = {
  locations: {
    barra: 'location_seed_barra',
  },
};

test.describe('Posts E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/community');
    // Login se necessário
  });

  test('deve criar post com território ativo', async ({ page }) => {
    await page.click('[data-testid="territory-selector"]');
    await page.click('text=Barra');
    await page.click('[data-testid="create-post"]');
    await page.fill('[data-testid="post-content"]', 'Test E2E');
    await page.click('[data-testid="publish"]');
    await expect(page.locator('text=Test E2E')).toBeVisible();
  });

  test('deve rejeitar criação em grupo territorial', async ({ page }) => {
    await page.click('[data-testid="territory-selector"]');
    await page.click('text=Grupo Teste');
    await page.click('[data-testid="create-post"]');
    await page.fill('[data-testid="post-content"]', 'Test');
    await page.click('[data-testid="publish"]');
    await expect(
      page.locator('text=Selecione uma cidade ou bairro específico')
    ).toBeVisible();
  });

  test('deve exibir location.name do post', async ({ page }) => {
    // Navegar para post específico
    await page.goto(`/community/posts/${FIXTURES.posts.post1}`);
    await expect(page.locator('text=Barra')).toBeVisible();
  });
});
```

### 6.3 Regressão (1h)

```typescript
it('não deve usar campos legados', () => {
  const violations = scanForLegacyFields(['src/core/posts']);
  expect(violations).toHaveLength(0);
});

it('RLS policies devem usar EXISTS', async () => {
  const policies = await getPolicies('posts');
  const createPolicy = policies.find(p => p.name === 'posts_create');
  expect(createPolicy.definition).toContain('EXISTS');
  expect(createPolicy.definition).toContain('profiles.user_id = auth.uid()');
});
```

---

## FASE 7: SEEDS (2h)

### CORREÇÃO 3: Fixtures Determinísticas

**Arquivo**: `supabase/seed.sql`

```sql
-- ============================================================================
-- FIXTURES DETERMINÍSTICAS PARA POSTS
-- ============================================================================

-- 1. Profile seed (owner)
INSERT INTO profiles (
  id,
  user_id,
  name,
  location_id,
  created_at
) VALUES (
  'profile_seed_owner',
  (SELECT id FROM auth.users LIMIT 1),
  'Usuário Seed',
  'location_seed_barra',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Location seed - Salvador (cidade)
INSERT INTO locations (
  id,
  name,
  type,
  parent_id,
  status,
  created_at
) VALUES (
  'location_seed_salvador',
  'Salvador',
  'city',
  NULL,
  'active',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. Location seed - Barra (bairro)
INSERT INTO locations (
  id,
  name,
  type,
  parent_id,
  status,
  created_at
) VALUES (
  'location_seed_barra',
  'Barra',
  'district',
  'location_seed_salvador',
  'active',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 4. Location seed - Pelourinho (bairro)
INSERT INTO locations (
  id,
  name,
  type,
  parent_id,
  status,
  created_at
) VALUES (
  'location_seed_pelourinho',
  'Pelourinho',
  'district',
  'location_seed_salvador',
  'active',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 5. Posts seed
INSERT INTO posts (
  id,
  author_profile_id,
  content,
  type,
  location_id,
  reach,
  is_published,
  created_at
) VALUES 
(
  'post_seed_1',
  'profile_seed_owner',
  'Post de teste na Barra',
  'text',
  'location_seed_barra',
  'neighborhood',
  true,
  NOW()
),
(
  'post_seed_2',
  'profile_seed_owner',
  'Post de teste em Salvador',
  'text',
  'location_seed_salvador',
  'city',
  true,
  NOW()
),
(
  'post_seed_3',
  'profile_seed_owner',
  'Post de teste no Pelourinho',
  'text',
  'location_seed_pelourinho',
  'neighborhood',
  true,
  NOW()
) ON CONFLICT (id) DO NOTHING;
```

**Benefícios**:
- IDs fixos e reproduzíveis
- Sem dependência de LIMIT 1
- Testes determinísticos
- Fácil debug

---

## FASE 8: DOCUMENTAÇÃO (2h)

1. ARQUITETURA_POSTS_SSOT.md
2. GUIA_CRIACAO_POSTS.md
3. GUIA_FILTROS_TERRITORIAIS.md

---

## CRONOGRAMA FINAL

```
Fase 0: Preparação (2h)
Fase 1: Modelagem (4h)
Fase 2: Service Layer (8h)
Fase 3: Formulários (7h)
Fase 4: Aplicar NOT NULL (1h) ← MOVIDO
Fase 5: Componentes (6h)
Fase 6: Testes (6h)
Fase 7: Seeds (2h)
Fase 8: Documentação (2h)

Total: 38h
Buffer: 40h-45h (5-6 dias úteis)
```

---

## DIVISÃO DE RESPONSABILIDADES

| Camada | Responsabilidade |
|--------|------------------|
| **FK** | Garante que location_id existe em locations |
| **Trigger** | Valida type (city/district) e status (active) |
| **NOT NULL** | Garante que todo post tem location_id (Fase 4) |
| **RLS** | Garante que usuário só acessa posts próprios |
| **Service** | Valida grupo territorial e lógica de negócio |

---

## CHECKLIST DE IMPLEMENTAÇÃO

### Fase 0
- [ ] Adicionar coluna reach
- [ ] Criar índice GIN para textSearch
- [ ] Validar constraints

### Fase 1
- [ ] Adicionar FK com RESTRICT
- [ ] Criar função de validação (type e status)
- [ ] Criar trigger de validação
- [ ] Atualizar RLS policies (EXISTS)
- [ ] Criar índices territoriais

### Fase 2
- [ ] createPost() com validação de grupo
- [ ] Redirecionar createCommunityPost()
- [ ] getFeed() com JOIN e expansão
- [ ] Logs estruturados

### Fase 3
- [ ] CreatePostModal com validação de grupo
- [ ] useCreatePostForm com reach
- [ ] UnifiedComposer

### Fase 4
- [ ] Validar que não há posts sem location_id
- [ ] Aplicar NOT NULL
- [ ] Verificar constraint

### Fase 5
- [ ] UnifiedPostCard com location.name
- [ ] CommunityFeed
- [ ] PostAdapter

### Fase 6
- [ ] 19 testes runtime
- [ ] 8 testes E2E
- [ ] Testes de regressão

### Fase 7
- [ ] Seeds

### Fase 8
- [ ] Documentação

---

**Status**: ✅ PRONTO PARA IMPLEMENTAÇÃO  
**Schema**: Introspectado do banco real  
**Estimativa**: 40h-45h (5-6 dias úteis)  
**4 Correções**: TODAS APLICADAS
