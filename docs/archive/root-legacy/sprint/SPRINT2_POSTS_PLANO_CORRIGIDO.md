# SPRINT 2 - POSTS (PLANO CORRIGIDO)

**Data**: 2026-04-05
**Status**: ✅ PRONTO PARA APROVAÇÃO
**Schema**: Baseado em schema real do banco
**Estimativa**: 40h-45h (5-6 dias úteis)

---

## DECISÕES APROVADAS

1. ✅ posts é a fonte de verdade
2. ✅ location_id é território-base
3. ✅ reach é metadado de visibilidade
4. ✅ Posts em district e city apenas
5. ✅ community_posts será removida APÓS código não depender

---

## SCHEMA REAL (ATUAL)

Ver documento completo: `SCHEMA_FINAL_POSTS.md`

**Tabela posts** (colunas principais):
```
id, author_profile_id, content, type, location_id,
reach (NÃO EXISTE - precisa criar),
images, tags, likes_count, comments_count,
is_published, created_at, updated_at

LEGADOS (existem mas serão ignorados):
autor_id, texto, city, neighborhood, street
```

**Tabela community_posts** (existe, sem dados):
```
id, author_profile_id, type, content, tags,
location_id, confirmations_count, is_verified
```

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

-- 4. NÃO remover colunas legadas ainda (código pode depender)
-- 5. NÃO remover community_posts ainda (código depende)
```

---

## FASE 1: MODELAGEM TERRITORIAL (5h)

### Migração: 20260405000021_posts_territorial_constraints.sql

```sql
-- 1. Função de validação de location_id
CREATE OR REPLACE FUNCTION validate_post_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.location_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM locations 
      WHERE id = NEW.location_id 
        AND status = 'active'
        AND type IN ('city', 'district')
    ) THEN
      RAISE EXCEPTION 'location_id inválido ou tipo não permitido';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger de validação
CREATE TRIGGER validate_post_location_trigger
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION validate_post_location();

-- 3. Índices territoriais
CREATE INDEX IF NOT EXISTS idx_posts_location_created 
  ON posts(location_id, created_at DESC) 
  WHERE location_id IS NOT NULL AND is_published = true;

CREATE INDEX IF NOT EXISTS idx_posts_location_reach 
  ON posts(location_id, reach) 
  WHERE location_id IS NOT NULL;

-- 4. Atualizar RLS policies
DROP POLICY IF EXISTS "Published posts viewable" ON posts;
DROP POLICY IF EXISTS "Authors manage own posts" ON posts;

-- Policy: Leitura de posts publicados
CREATE POLICY posts_read_published ON posts
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

-- Policy: Leitura de posts próprios
CREATE POLICY posts_read_own ON posts
  FOR SELECT TO authenticated
  USING (author_profile_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
  ));

-- Policy: Criação (requer location_id)
CREATE POLICY posts_create ON posts
  FOR INSERT TO authenticated
  WITH CHECK (
    author_profile_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
    )
    AND location_id IS NOT NULL
  );

-- Policy: Atualização própria
CREATE POLICY posts_update_own ON posts
  FOR UPDATE TO authenticated
  USING (author_profile_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
  ))
  WITH CHECK (author_profile_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
  ));

-- Policy: Deleção própria
CREATE POLICY posts_delete_own ON posts
  FOR DELETE TO authenticated
  USING (author_profile_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
  ));
```

---

## FASE 2: SERVICE LAYER (8h)

### Arquivo: src/core/posts/services/PostService.ts

### 2.1 Writes - createPost() (2h)

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
  // Validar location_id
  if (!data.location_id) {
    throw new PostError("location_id é obrigatório", "LOCATION_REQUIRED");
  }

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
    .select()
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
async createCommunityPostWithValidation(data: any): Promise<Post> {
  console.warn('[PostService] createCommunityPostWithValidation is deprecated, redirecting to createPost');
  
  // Obter profile para location_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, location_id')
    .eq('user_id', data.userId)
    .single();

  if (!profile?.location_id) {
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

  static info(service: string, method: string, message: string, context: any) {
    console.info(JSON.stringify({
      level: 'INFO',
      service,
      method,
      message,
      context,
      timestamp: new Date().toISOString(),
    }));
  }
}
```

### 2.5 Remover Funções Legadas (1h)

```typescript
// Remover ou deprecar:
// - getPostsByLocation() (usa city/neighborhood)
// - getActiveAlerts() (usa city/neighborhood)
// - getPopularTags() (usa city/neighborhood)
// - getTopPosts() (usa city/neighborhood)
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

  // Obter território ativo ou usar profile.location_id
  const { filter } = useTerritoryFilter();
  const locationId = filter.scope === 'location' 
    ? filter.location_id 
    : profile.location_id;

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

  // ... resto do hook
}
```

### 3.3 UnifiedComposer (2h)

```typescript
interface UnifiedComposerProps {
  locationId?: string;
  onPostCreated?: () => void;
  onAlertCreated?: () => void;
  onIssueCreated?: () => void;
}
```

---

## FASE 4: COMPONENTES (6h)

### 4.1 UnifiedPostCard (2h)

```typescript
const formattedLocation = useMemo(() => {
  if (post.location?.name) return post.location.name;
  return "Localização não informada";
}, [post.location]);
```

### 4.2 CommunityFeed (2h)

```typescript
<UnifiedFeedWithMessages
  posts={posts}
  userLocation={{
    location_id: activeProfile?.location_id,
    location_name: activeProfile?.location?.name,
  }}
/>
```

### 4.3 PostAdapter (2h)

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

## FASE 5: TESTES (6h)

### 5.1 Runtime (3h)

```typescript
describe('SSOT Posts', () => {
  it('deve rejeitar post sem location_id', async () => {
    await expect(
      postService.createPost({
        author_profile_id: 'user-1',
        content: 'Test',
        type: 'text',
        location_id: null,
      })
    ).rejects.toThrow('location_id é obrigatório');
  });

  it('cidade deve expandir para cidade + distritos', async () => {
    const cityId = await createLocation({ type: 'city' });
    const district1 = await createLocation({ type: 'district', parent_id: cityId });
    
    const expanded = await postService.expandLocationIds([cityId]);
    
    expect(expanded).toContain(cityId);
    expect(expanded).toContain(district1);
  });
});
```

### 5.2 E2E (2h)

```typescript
test('deve criar post com território ativo', async ({ page }) => {
  await page.goto('/community');
  await page.click('[data-testid="territory-selector"]');
  await page.click('text=Barra');
  await page.click('[data-testid="create-post"]');
  await page.fill('[data-testid="post-content"]', 'Test');
  await page.click('[data-testid="publish"]');
  await expect(page.locator('text=Test')).toBeVisible();
});
```

### 5.3 Regressão (1h)

```typescript
it('não deve usar campos legados', () => {
  const violations = scanForLegacyFields(['src/core/posts']);
  expect(violations).toHaveLength(0);
});
```

---

## FASE 6: SEEDS (2h)

```sql
INSERT INTO posts (
  id,
  author_profile_id,
  content,
  type,
  location_id,
  reach,
  is_published
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM profiles LIMIT 1),
  'Post de teste',
  'text',
  (SELECT id FROM locations WHERE type = 'district' LIMIT 1),
  'neighborhood',
  true
);
```

---

## FASE 7: DOCUMENTAÇÃO (2h)

1. ARQUITETURA_POSTS_SSOT.md
2. GUIA_CRIACAO_POSTS.md
3. GUIA_FILTROS_TERRITORIAIS.md

---

## PÓS-SPRINT: LIMPEZA (SEPARADO)

### Após código não depender mais:

```sql
-- 1. Remover colunas legadas
ALTER TABLE posts
  DROP COLUMN IF EXISTS autor_id,
  DROP COLUMN IF EXISTS texto,
  DROP COLUMN IF EXISTS city,
  DROP COLUMN IF EXISTS neighborhood,
  DROP COLUMN IF EXISTS street;

-- 2. Remover community_posts
DROP TABLE IF EXISTS community_posts CASCADE;
```

---

## CRONOGRAMA

```
Fase 0: Preparação (2h)
Fase 1: Modelagem (5h)
Fase 2: Service Layer (8h)
Fase 3: Formulários (7h)
Fase 4: Componentes (6h)
Fase 5: Testes (6h)
Fase 6: Seeds (2h)
Fase 7: Documentação (2h)

Total: 38h
Buffer: 40h-45h
```

---

## CHECKLIST DE APROVAÇÃO

- [x] Schema real documentado
- [x] Colunas inexistentes identificadas
- [x] Migrations explícitas para criar colunas
- [x] RLS policies corrigidas (profiles.user_id = auth.uid())
- [x] community_posts removida APÓS código não depender
- [x] Semântica de reach formalizada
- [x] Services baseados em schema real
- [x] Seeds baseados em schema real
- [x] Testes baseados em schema real
- [ ] Aprovação final ⏳

---

**Status**: ✅ PRONTO PARA APROVAÇÃO
**Schema**: Baseado em schema real do banco
**Estimativa**: 40h-45h (5-6 dias úteis)
