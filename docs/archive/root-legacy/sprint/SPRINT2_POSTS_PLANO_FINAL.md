# SPRINT 2 - MÓDULO POSTS (PLANO FINAL)

**Data**: 2026-04-05  
**Status**: ✅ PRONTO PARA APROVAÇÃO  
**Blueprint**: tourist_points (v1.0.0)  
**Estimativa**: 40h-45h (5-6 dias úteis)

---

## DECISÕES APROVADAS

### Arquitetura Final

1. ✅ **posts** é a fonte de verdade final
2. ✅ **community_posts** será removida (sem dados para migrar)
3. ✅ **location_id** é o território-base do post
4. ✅ **reach** é metadado de alcance/visibilidade
5. ✅ Posts podem existir em **district** e **city**, nunca em street ou grupo

### Regras Territoriais

**Filtro Territorial**:
- Cidade = cidade + distritos
- Bairro = bairro + cidade-pai
- Grupo = distritos do grupo + cidade-pai (quando aplicável)

**Criação de Post**:
- Usa território ativo por padrão
- Fallback para profile.location_id
- Nunca input textual

### Auditoria Quantitativa

**Resultado**: ✅ Banco está limpo
- Sem dados legados para migrar
- Schema já preparado para SSOT
- Redução de 26h no esforço (45%)

---

## OBJETIVO

Implementar SSOT territorial no módulo `posts` seguindo o blueprint `tourist_points`.

**Escopo**:
- ✅ Modelagem territorial (location_id + reach)
- ✅ Service layer (writes + reads)
- ✅ Formulários e hooks
- ✅ Componentes de renderização
- ✅ Testes (runtime + E2E + regressão)
- ✅ Seeds e documentação

---

## FASE 0: PREPARAÇÃO ESTRUTURAL (2h)

### Objetivo
Preparar tabela posts para SSOT territorial

### Etapa 1: Adicionar Coluna reach (1h)

**Migração**:
```sql
-- Adicionar coluna reach como metadado
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS reach TEXT
    CHECK (reach IN ('street', 'neighborhood', 'city'))
    DEFAULT 'neighborhood';

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_posts_reach 
  ON posts(reach) 
  WHERE reach IS NOT NULL;

-- Comentário
COMMENT ON COLUMN posts.reach IS 
  'Metadado de alcance/visibilidade. Não afeta filtros territoriais (location_id).';
```

### Etapa 2: Criar Índice GIN para textSearch (0.5h)

**Migração**:
```sql
-- Índice GIN para busca full-text
CREATE INDEX IF NOT EXISTS idx_posts_content_search 
  ON posts 
  USING gin(to_tsvector('portuguese', content));

COMMENT ON INDEX idx_posts_content_search IS 
  'Índice GIN para busca full-text em português';
```

### Etapa 3: Remover community_posts (0.5h)

**Migração**:
```sql
-- Remover tabela community_posts (sem dados)
DROP TABLE IF EXISTS community_posts CASCADE;

-- Remover tabelas relacionadas se existirem
DROP TABLE IF EXISTS community_post_likes CASCADE;
DROP TABLE IF EXISTS community_post_comments CASCADE;
DROP TABLE IF EXISTS community_post_saves CASCADE;
```

**Deliverable**: Migração `20260405000020_prepare_posts_ssot.sql`

---

## FASE 1: MODELAGEM TERRITORIAL (5h)

### Objetivo
Implementar validações e constraints territoriais

### Etapa 1: Validações de location_id (2h)

**Migração**:
```sql
-- Função de validação
CREATE OR REPLACE FUNCTION validate_post_location()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar que location_id existe
  IF NEW.location_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM locations 
      WHERE id = NEW.location_id 
        AND status = 'active'
        AND type IN ('city', 'district')
    ) THEN
      RAISE EXCEPTION 'location_id inválido ou tipo não permitido (apenas city/district)';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER validate_post_location_trigger
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION validate_post_location();
```

### Etapa 2: Índices Territoriais (1h)

**Migração**:
```sql
-- Índice para location_id
CREATE INDEX IF NOT EXISTS idx_posts_location_id 
  ON posts(location_id) 
  WHERE location_id IS NOT NULL;

-- Índice composto para filtros comuns
CREATE INDEX IF NOT EXISTS idx_posts_location_created 
  ON posts(location_id, created_at DESC) 
  WHERE location_id IS NOT NULL AND is_published = true;

-- Índice para reach
CREATE INDEX IF NOT EXISTS idx_posts_location_reach 
  ON posts(location_id, reach) 
  WHERE location_id IS NOT NULL;
```

### Etapa 3: RLS Policies (2h)

**Migração**:
```sql
-- Habilitar RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy: Leitura pública de posts publicados
CREATE POLICY posts_read_published ON posts
  FOR SELECT
  USING (is_published = true);

-- Policy: Autor pode ler seus próprios posts
CREATE POLICY posts_read_own ON posts
  FOR SELECT
  USING (auth.uid() = author_profile_id);

-- Policy: Criar post (requer location_id válido)
CREATE POLICY posts_create ON posts
  FOR INSERT
  WITH CHECK (
    auth.uid() = author_profile_id
    AND location_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM locations 
      WHERE id = location_id 
        AND status = 'active'
        AND type IN ('city', 'district')
    )
  );

-- Policy: Atualizar próprio post
CREATE POLICY posts_update_own ON posts
  FOR UPDATE
  USING (auth.uid() = author_profile_id)
  WITH CHECK (auth.uid() = author_profile_id);

-- Policy: Deletar próprio post
CREATE POLICY posts_delete_own ON posts
  FOR DELETE
  USING (auth.uid() = author_profile_id);
```

**Deliverable**: Migração `20260405000021_posts_territorial_constraints.sql`

---

## FASE 2: SERVICE LAYER (8h)

### Objetivo
Corrigir PostService para usar location_id

### Etapa 1: Writes - Criar Posts (3h)

**Arquivos**:
- `src/core/posts/services/PostService.ts`

**Correções**:

**1.1 createPost()**:
```typescript
async createPost(data: CreatePostData): Promise<Post> {
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

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      author_profile_id: data.author_profile_id,
      content: data.content,
      type: data.type,
      location_id: data.location_id,
      reach: data.reach || 'neighborhood',
      is_published: data.is_published ?? true,
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

**1.2 createSimplePost()** - Redirecionar para createPost()

**1.3 createCommunityPost()** - Remover (tabela não existe mais)

**1.4 createCommunityPostWithValidation()** - Redirecionar para createPost()

### Etapa 2: Reads - Filtros Territoriais (3h)

**2.1 getFeed()**:
```typescript
async getFeed(params: FeedParams): Promise<FeedResponse> {
  if (!params.location_id && !params.location_ids?.length) {
    StructuredLogger.warn('PostService', 'getFeed', 'Empty location_ids', { params });
    return { posts: [], nextCursor: undefined };
  }

  // Expandir território
  const expandedIds = params.location_ids?.length 
    ? await this.expandLocationIds(params.location_ids)
    : await this.expandLocationIds([params.location_id!]);

  let query = supabase
    .from('posts')
    .select(SELECT_PUBLIC)
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
```

**2.2 expandLocationIds()** - Implementar expansão territorial:
```typescript
private async expandLocationIds(locationIds: string[]): Promise<string[]> {
  const expanded: string[] = [];

  for (const locationId of locationIds) {
    const location = await getLocationById(locationId);
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

  return [...new Set(expanded)]; // Remover duplicatas
}
```

**2.3 Remover Funções Legadas**:
- `getPostsByLocation()` - Remover (usa city/neighborhood)
- `getActiveAlerts()` - Remover ou migrar para usar location_id
- `getPopularTags()` - Remover ou migrar para usar location_id
- `getTopPosts()` - Remover ou migrar para usar location_id

### Etapa 3: Tipagem e Logs (2h)

**3.1 Remover `supabase as any`**:
```typescript
import { Database } from '@/integrations/supabase/types';

const { data, error } = await supabase
  .from("posts")
  .select("*")
  .returns<Database['public']['Tables']['posts']['Row'][]>();
```

**3.2 Adicionar Logs Estruturados**:
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
    }));
  }
  // ... warn, info
}
```

**Deliverable**: `src/core/posts/services/PostService.ts` corrigido

---

## FASE 3: FORMULÁRIOS E HOOKS (7h)

### Objetivo
Corrigir formulários para usar território ativo

### Etapa 1: useCreatePostForm (2h)

**Arquivo**: `src/modules/community/hooks/composer/useCreatePostForm.ts`

**Correção**:
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
      reach, // Metadado de visibilidade
      images,
      // location_id será capturado do território ativo ou profile
    };
  };

  // ... resto do hook
}
```

### Etapa 2: CreatePostModal (3h)

**Arquivo**: `src/modules/community/components/composer/CreatePostModal.tsx`

**Correção**:
```typescript
const handlePublish = async () => {
  if (!form.validateForm()) return;
  if (!profile) { 
    toast.error("Faça login para publicar"); 
    return; 
  }

  // Obter território ativo
  const { filter } = useTerritoryFilter();
  const locationId = filter.scope === 'location' 
    ? filter.location_id 
    : profile.location_id;

  // Validar location_id
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
      is_published: true,
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

### Etapa 3: UnifiedComposer (2h)

**Arquivo**: `src/modules/community/components/composer/UnifiedComposer.tsx`

**Correção**:
```typescript
interface UnifiedComposerProps {
  locationId?: string;  // ✅ Usar location_id do SSOT
  onPostCreated?: () => void;
  onAlertCreated?: () => void;
  onIssueCreated?: () => void;
}

// Passar locationId para modais
<CreateAlertModal
  open={activeComposer === "alert"}
  onClose={handleCloseComposer}
  onAlertCreated={handleAlertCreated}
  locationId={locationId}  // ✅ SSOT
/>
```

**Deliverable**: Formulários corrigidos

---

## FASE 4: COMPONENTES DE RENDERIZAÇÃO (6h)

### Objetivo
Corrigir componentes para renderizar location.name do SSOT

### Etapa 1: UnifiedPostCard (2h)

**Arquivo**: `src/modules/community/components/UnifiedPostCard/index.tsx`

**Correção**:
```typescript
const formattedLocation = useMemo(() => {
  // Priorizar location.name do SSOT
  if (post.location?.name) return post.location.name;
  
  // Fallback temporário para dados legados (se existirem)
  const parts = [];
  if (post.neighborhood) parts.push(post.neighborhood);
  if (post.city) parts.push(post.city);
  
  return parts.join(", ") || "Localização não informada";
}, [post.location, post.neighborhood, post.city]);
```

### Etapa 2: CommunityFeed (2h)

**Arquivo**: `src/modules/community/components/feed/CommunityFeed.tsx`

**Correção**:
```typescript
<UnifiedFeedWithMessages
  civicReports={[]}
  communityPosts={posts}
  currentUserId={currentUserId}
  sortCriteria={sortCriteria}
  filterType={filterType}
  userLocation={{
    location_id: activeProfile?.location_id,
    location_name: activeProfile?.location?.name,  // ✅ SSOT
  }}
/>
```

### Etapa 3: PostAdapter (2h)

**Arquivo**: `src/core/posts/adapters/PostAdapter.ts`

**Correção**:
```typescript
private static calculateProximity(
  post: UnifiedPost,
  userLocation: { location_id?: string; location_name?: string },
): number {
  // Usar location_id para comparação
  if (post.location_id && userLocation.location_id) {
    if (post.location_id === userLocation.location_id) return 3;
    
    // Verificar se são da mesma cidade
    // (implementar lógica de hierarquia)
    return 1;
  }
  
  return 0;
}
```

**Deliverable**: Componentes corrigidos

---

## FASE 5: TESTES (6h)

### Objetivo
Garantir cobertura completa de testes

### Etapa 1: Testes Runtime (3h)

**Arquivo**: `tests/ssot-posts.test.ts`

**Cobertura**:
```typescript
describe('SSOT Posts - Runtime Tests', () => {
  describe('1. Validação de location_id', () => {
    it('deve rejeitar post sem location_id', async () => {
      await expect(
        postService.createPost({
          author_profile_id: 'user-1',
          content: 'Test',
          type: 'discussao',
          location_id: null,
        })
      ).rejects.toThrow('location_id é obrigatório');
    });

    it('deve rejeitar location_id inválido', async () => {
      await expect(
        postService.createPost({
          author_profile_id: 'user-1',
          content: 'Test',
          type: 'discussao',
          location_id: 'invalid-id',
        })
      ).rejects.toThrow();
    });

    it('deve rejeitar tipo de location inválido (street)', async () => {
      const streetId = await createLocation({ type: 'street' });
      
      await expect(
        postService.createPost({
          author_profile_id: 'user-1',
          content: 'Test',
          type: 'discussao',
          location_id: streetId,
        })
      ).rejects.toThrow('apenas city/district');
    });
  });

  describe('2. Expansão Territorial', () => {
    it('cidade deve expandir para cidade + distritos', async () => {
      const cityId = await createLocation({ type: 'city', name: 'Salvador' });
      const district1 = await createLocation({ type: 'district', parent_id: cityId });
      const district2 = await createLocation({ type: 'district', parent_id: cityId });

      const expanded = await postService.expandLocationIds([cityId]);
      
      expect(expanded).toContain(cityId);
      expect(expanded).toContain(district1);
      expect(expanded).toContain(district2);
    });

    it('bairro deve expandir para bairro + cidade-pai', async () => {
      const cityId = await createLocation({ type: 'city', name: 'Salvador' });
      const districtId = await createLocation({ type: 'district', parent_id: cityId });

      const expanded = await postService.expandLocationIds([districtId]);
      
      expect(expanded).toContain(districtId);
      expect(expanded).toContain(cityId);
    });
  });

  describe('3. Filtros Territoriais', () => {
    it('feed de cidade deve incluir posts de bairros', async () => {
      const cityId = await createLocation({ type: 'city' });
      const districtId = await createLocation({ type: 'district', parent_id: cityId });
      
      await createPost({ location_id: districtId });
      
      const feed = await postService.getFeed({ location_id: cityId });
      
      expect(feed.posts).toHaveLength(1);
    });

    it('feed de bairro deve incluir posts da cidade', async () => {
      const cityId = await createLocation({ type: 'city' });
      const districtId = await createLocation({ type: 'district', parent_id: cityId });
      
      await createPost({ location_id: cityId });
      
      const feed = await postService.getFeed({ location_id: districtId });
      
      expect(feed.posts).toHaveLength(1);
    });
  });

  describe('4. Reach como Metadado', () => {
    it('reach não deve afetar filtros territoriais', async () => {
      const districtId = await createLocation({ type: 'district' });
      
      await createPost({ location_id: districtId, reach: 'street' });
      await createPost({ location_id: districtId, reach: 'city' });
      
      const feed = await postService.getFeed({ location_id: districtId });
      
      expect(feed.posts).toHaveLength(2); // Ambos aparecem
    });
  });
});
```

### Etapa 2: Testes E2E (2h)

**Arquivo**: `tests/e2e/posts.spec.ts`

**Cobertura**:
```typescript
test.describe('Posts - E2E', () => {
  test('deve criar post com território ativo', async ({ page }) => {
    await page.goto('/community');
    
    // Selecionar território
    await page.click('[data-testid="territory-selector"]');
    await page.click('text=Barra');
    
    // Criar post
    await page.click('[data-testid="create-post"]');
    await page.fill('[data-testid="post-content"]', 'Test post');
    await page.click('[data-testid="publish"]');
    
    // Verificar post criado
    await expect(page.locator('text=Test post')).toBeVisible();
    await expect(page.locator('text=Barra')).toBeVisible();
  });

  test('deve filtrar feed por território', async ({ page }) => {
    await page.goto('/community');
    
    // Selecionar Salvador (cidade)
    await page.click('[data-testid="territory-selector"]');
    await page.click('text=Salvador');
    
    // Verificar posts de todos os bairros
    await expect(page.locator('[data-testid="post-card"]')).toHaveCount(10);
    
    // Selecionar Barra (bairro)
    await page.click('[data-testid="territory-selector"]');
    await page.click('text=Barra');
    
    // Verificar posts apenas da Barra
    await expect(page.locator('[data-testid="post-card"]')).toHaveCount(3);
  });
});
```

### Etapa 3: Testes de Regressão (1h)

**Arquivo**: `tests/regression-posts.test.ts`

**Cobertura**:
```typescript
describe('Regression: Posts SSOT', () => {
  it('não deve usar campos legados (city, neighborhood)', () => {
    const violations = scanForLegacyFields([
      'src/core/posts',
      'src/modules/community',
      'src/modules/profile',
    ]);
    
    expect(violations).toHaveLength(0);
  });

  it('não deve usar supabase as any', () => {
    const violations = scanForSupabaseAsAny([
      'src/core/posts',
    ]);
    
    expect(violations).toHaveLength(0);
  });
});
```

**Deliverable**: Testes completos

---

## FASE 6: SEEDS (2h)

### Objetivo
Criar dados de teste com location_id

**Arquivo**: `supabase/seed.sql`

**Seed**:
```sql
-- Criar posts de teste
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
  -- Posts da Barra
  (
    gen_random_uuid(),
    (SELECT id FROM profiles LIMIT 1),
    'Evento na Barra este fim de semana!',
    'evento',
    (SELECT id FROM locations WHERE name = 'Barra' AND type = 'district' LIMIT 1),
    'neighborhood',
    true,
    NOW() - INTERVAL '1 day'
  ),
  -- Posts de Salvador (cidade)
  (
    gen_random_uuid(),
    (SELECT id FROM profiles LIMIT 1),
    'Notícia importante para toda Salvador',
    'noticia',
    (SELECT id FROM locations WHERE name = 'Salvador' AND type = 'city' LIMIT 1),
    'city',
    true,
    NOW() - INTERVAL '2 days'
  );
```

**Deliverable**: Seeds atualizados

---

## FASE 7: DOCUMENTAÇÃO (2h)

### Objetivo
Documentar arquitetura e decisões

**Documentos**:
1. `ARQUITETURA_POSTS_SSOT.md` - Arquitetura final
2. `GUIA_CRIACAO_POSTS.md` - Como criar posts
3. `GUIA_FILTROS_TERRITORIAIS.md` - Como funcionam os filtros

**Deliverable**: Documentação completa

---

## CRONOGRAMA

```
Fase 0: Preparação Estrutural (2h)
Fase 1: Modelagem Territorial (5h)
Fase 2: Service Layer (8h)
Fase 3: Formulários e Hooks (7h)
Fase 4: Componentes (6h)
Fase 5: Testes (6h)
Fase 6: Seeds (2h)
Fase 7: Documentação (2h)

Total: 38h
Faixa com buffer: 40h-45h
```

**Duração**: 5-6 dias úteis

---

## GATES DE QUALIDADE

### Gate 1: Modelagem
- [ ] Migração aplicada sem erros
- [ ] Validações funcionando
- [ ] RLS policies ativas

### Gate 2: Service Layer
- [ ] Todos os writes usam location_id
- [ ] Todos os reads usam expansão territorial
- [ ] Sem `supabase as any`
- [ ] Logs estruturados implementados

### Gate 3: Formulários
- [ ] CreatePostModal valida location_id
- [ ] Território ativo é usado
- [ ] Fallback para profile.location_id funciona

### Gate 4: Testes
- [ ] 19 testes runtime passando
- [ ] 8 testes E2E passando
- [ ] Testes de regressão passando

---

## RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Território ativo não disponível | Baixa | Alto | Fallback para profile.location_id |
| Performance de expansão territorial | Média | Médio | Cache de expansões, índices otimizados |
| Usuário sem location_id | Baixa | Alto | Validação no formulário, mensagem clara |

---

## CHECKLIST DE APROVAÇÃO

- [x] Decisões territoriais aprovadas ✅
- [x] Auditoria quantitativa completa ✅
- [x] Plano de migração formalizado ✅
- [x] Estimativa recalculada (40h-45h) ✅
- [x] Arquitetura final documentada ✅
- [ ] Aprovação final para implementação ⏳

---

**Status**: ✅ PRONTO PARA APROVAÇÃO  
**Próximo Passo**: Solicitar aprovação final para iniciar implementação  
**Estimativa**: 40h-45h (5-6 dias úteis)
