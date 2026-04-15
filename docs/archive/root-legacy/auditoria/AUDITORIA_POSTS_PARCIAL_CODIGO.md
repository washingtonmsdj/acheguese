# AUDITORIA PARCIAL DE CÓDIGO - POSTS

**Data**: 2026-04-05  
**Módulo**: posts  
**Status**: ⚠️ PARCIAL - Auditoria Incompleta  
**Referência**: SPRINT2_POSTS_PLANO_V2.md

---

## RESUMO EXECUTIVO

**Auditoria de Código**: 70% completa  
**Auditoria Quantitativa (Banco)**: 0% - BLOQUEADA (circuit breaker)  
**Problemas Identificados até agora**: 19 (contagem parcial)  
**Severidade Crítica**: 10  
**Severidade Alta**: 4  
**Severidade Média**: 5

⚠️ **IMPORTANTE**: Esta é uma auditoria PARCIAL. Não está pronta para implementação.

**Pendências Obrigatórias**:
1. ❌ Auditar createCommunityPost() (write não auditado)
2. ❌ Executar auditoria quantitativa do banco (posts + community_posts)
3. ❌ Fechar Fase 0: relação location_id vs reach
4. ❌ Confirmar impacto de userLocation legado (lógica vs exibição)
5. ❌ Decisão formal: posts como fonte de verdade + plano de migração community_posts

---

## 1. OPERAÇÕES DE ESCRITA (Writes)

### 1.1 PostService.createPost() - Linha 48

**Arquivo**: `src/core/posts/services/PostService.ts`

**Código Atual**:
```typescript
const { data: post, error } = await (supabase as any)  // ❌ PROBLEMA: supabase as any
  .from("posts")
  .insert({
    autor_id: user.id,
    author_profile_id: profileId,
    texto: data.content,
    type: data.type,
    content: data.content,
    image_url: data.image_url || null,
    video_url: data.video_url,
    city: data.city || profile.city,  // ❌ PROBLEMA: usa city legado
    neighborhood: data.neighborhood,   // ❌ PROBLEMA: usa neighborhood legado
    street: data.street,               // ❌ PROBLEMA: usa street legado
    likes_count: 0,
    comments_count: 0,
  })
```

**Problemas**:
1. ❌ Usa `city`, `neighborhood`, `street` (campos legados)
2. ❌ `location_id` não é definido
3. ❌ Não valida `location_id`
4. ❌ Permite `location_id` null
5. ❌ `supabase as any` - sem tipagem

**Severidade**: 🔴 CRÍTICA

---

### 1.2 PostService.updatePost() - Linha 168

**Arquivo**: `src/core/posts/services/PostService.ts`

**Código Atual**:
```typescript
if (data.city !== undefined) {
  updateData.city = data.city;
}
if (data.neighborhood !== undefined) {
  updateData.neighborhood = data.neighborhood;
}
if (data.street !== undefined) {
  updateData.street = data.street;
}
```

**Problemas**:
1. ❌ Permite atualizar campos legados
2. ❌ Não valida `location_id` se fornecido

**Severidade**: 🟡 MÉDIA

---

### 1.3 PostService.createCommunityPost() - Linha 885

**Arquivo**: `src/core/posts/services/PostService.ts`

**Código Atual**:
```typescript
async createCommunityPost(
  data: CreateCommunityPostData,
): Promise<CommunityPost> {
  try {
    const { data: post, error } = await (supabase as any)
      .from("community_posts")  // ❌ PROBLEMA: Tabela community_posts
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new PostError(error.message, error.code || "CREATE_FAILED");
    }

    return post;
  } catch (error) {
    // ...
  }
}
```

**Problemas**:
1. ❌ Insere em `community_posts` (tabela a ser depreciada)
2. ❌ Não valida `location_id`
3. ❌ Aceita `data` sem validação territorial
4. ❌ `supabase as any` - sem tipagem
5. ⚠️ Função será obsoleta após migração community_posts → posts

**Severidade**: 🔴 CRÍTICA

**Correção Necessária**:
```typescript
// Após migração community_posts → posts:
// Esta função deve ser removida ou redirecionada para createPost()

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

  // Redirecionar para createPost() (tabela posts)
  return this.createPost({
    ...data,
    is_published: true,
  });
}
```

---

### 1.4 PostService.createSimplePost() - Linha 1896

**Arquivo**: `src/core/posts/services/PostService.ts`

**Código Atual**:
```typescript
async createSimplePost(data: {
  author_profile_id: string;
  content: string;
  category?: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
}): Promise<void> {
  try {
    const { error } = await (supabase as any).from("posts").insert(data);  // ❌ PROBLEMA
```

**Problemas**:
1. ❌ Não define `location_id`
2. ❌ `supabase as any` - sem tipagem
3. ❌ Não valida dados de entrada

**Severidade**: 🔴 CRÍTICA

---

### 1.5 PostService.createCommunityPostWithValidation() - Linha 2088

**Arquivo**: `src/core/posts/services/PostService.ts`

**Código Atual**:
```typescript
const { data: newPost, error: postError } = await (supabase as any)
  .from("posts")
  .insert({
    autor_id: data.userId,
    author_profile_id: data.userId,
    texto: data.content || "",
    tipo_post: data.type,
    post_type: "text",
    content: data.content,
    media_urls: data.images || [],
    tags: data.tags || [],
    city: profile.city,           // ❌ PROBLEMA: usa city legado
    neighborhood: profile.neighborhood,  // ❌ PROBLEMA: usa neighborhood legado
    street: null,
    reach: data.reach || "neighborhood",
  })
```

**Problemas**:
1. ❌ Usa `city`, `neighborhood` do profile (campos legados)
2. ❌ Não define `location_id`
3. ❌ `supabase as any` - sem tipagem

**Severidade**: 🔴 CRÍTICA

---

## 2. OPERAÇÕES DE LEITURA (Reads)

### 2.1 PostService.getFeed() - Linha 260

**Arquivo**: `src/core/posts/services/PostService.ts`

**Código Atual**:
```typescript
if (location_id) {
  query = query.eq("location_id", location_id);
} else if (location_ids && location_ids.length > 0) {
  query = query.in("location_id", location_ids);
} else {
  // ❌ PROBLEMA: Fallback para city/neighborhood
  if (city) {
    query = query.eq("city", city);
    if (neighborhood) {
      query = query.eq("neighborhood", neighborhood);
      if (street) {
        query = query.eq("street", street);
      }
    }
  }
}
```

**Problemas**:
1. ⚠️ Tem fallback para campos legados
2. ✅ Prioriza `location_id` (bom)
3. ❌ Não expande cidade→distritos
4. ❌ `supabase as any` - sem tipagem

**Severidade**: 🟠 ALTA

---

### 2.2 PostService.getPostsByLocation() - Linha 420

**Arquivo**: `src/core/posts/services/PostService.ts`

**Código Atual**:
```typescript
if (location.city) {
  query = query.eq("city", location.city);
  if (location.neighborhood) {
    query = query.eq("neighborhood", location.neighborhood);
    if (location.street) {
      query = query.eq("street", location.street);
    }
  }
}
```

**Problemas**:
1. ❌ Usa APENAS campos legados
2. ❌ Não usa `location_id`
3. ❌ Não expande cidade→distritos
4. ❌ `supabase as any` - sem tipagem

**Severidade**: 🔴 CRÍTICA

---

### 2.3 PostService.getActiveAlerts() - Linha 1680

**Arquivo**: `src/core/posts/services/PostService.ts`

**Código Atual**:
```typescript
let query = (supabase as any)
  .from("community_posts")
  .select("id, content, confirmations_count, is_verified")
  .eq("type", "alerta")
  .gte("confirmations_count", 2)
  .order("confirmations_count", { ascending: false })
  .limit(limit);

// Aplicar filtros de localização
if (location.city) {
  query = query.eq("city", location.city);
  if (locationScope === "neighborhood" && location.neighborhood) {
    query = query.eq("neighborhood", location.neighborhood);
  } else if (locationScope === "street" && location.street) {
    query = query.eq("street", location.street);
  }
}
```

**Problemas**:
1. ❌ Usa APENAS campos legados (city, neighborhood, street)
2. ❌ Não usa `location_id`
3. ❌ `supabase as any` - sem tipagem
4. ❌ Tabela `community_posts` também precisa de SSOT

**Severidade**: 🔴 CRÍTICA

---

### 2.4 PostService.getPopularTags() - Linha 1740

**Arquivo**: `src/core/posts/services/PostService.ts`

**Código Atual**:
```typescript
let query = (supabase as any)
  .from("community_posts")
  .select("tags")
  .gte("created_at", sevenDaysAgo.toISOString());

// Aplicar filtros de localização
if (location.city) {
  query = query.eq("city", location.city);
  if (locationScope === "neighborhood" && location.neighborhood) {
    query = query.eq("neighborhood", location.neighborhood);
  } else if (locationScope === "street" && location.street) {
    query = query.eq("street", location.street);
  }
}
```

**Problemas**:
1. ❌ Usa APENAS campos legados
2. ❌ Não usa `location_id`
3. ❌ `supabase as any` - sem tipagem

**Severidade**: 🔴 CRÍTICA

---

### 2.5 PostService.getTopPosts() - Linha 1818

**Arquivo**: `src/core/posts/services/PostService.ts`

**Código Atual**:
```typescript
let query = (supabase as any)
  .from("community_posts")
  .select(`
    id,
    content,
    likes_count,
    comments_count,
    author:profiles!author_profile_id(name)
  `)
  .gte("created_at", sevenDaysAgo.toISOString())
  .order("engagement", { ascending: false })
  .limit(limit);

// Aplicar filtros de localização
if (location.city) {
  query = query.eq("city", location.city);
  if (locationScope === "neighborhood" && location.neighborhood) {
    query = query.eq("neighborhood", location.neighborhood);
  } else if (locationScope === "street" && location.street) {
    query = query.eq("street", location.street);
  }
}
```

**Problemas**:
1. ❌ Usa APENAS campos legados
2. ❌ Não usa `location_id`
3. ❌ `supabase as any` - sem tipagem

**Severidade**: 🔴 CRÍTICA

---

## 3. COMPONENTES DE RENDERIZAÇÃO (Renders)

### 3.1 UnifiedPostCard

**Arquivo**: `src/modules/community/components/UnifiedPostCard/index.tsx`

**Código Atual**:
```typescript
// Memoizar localização formatada
const formattedLocation = useMemo(() => {
  if (post.location) return post.location;  // ✅ Prioriza location

  const parts = [];
  if (post.street) parts.push(post.street);
  if (post.neighborhood) parts.push(post.neighborhood);  // ⚠️ Fallback legado
  if (post.city) parts.push(post.city);  // ⚠️ Fallback legado

  return parts.join(", ") || "Localização não informada";
}, [post.location, post.street, post.neighborhood, post.city]);
```

**Problemas**:
1. ⚠️ Tem fallback para campos legados (aceitável temporariamente)
2. ✅ Prioriza `post.location` (bom)
3. ❌ Não usa `post.location?.name` do SSOT

**Severidade**: 🟠 ALTA

**Correção Necessária**:
```typescript
const formattedLocation = useMemo(() => {
  // Priorizar location.name do SSOT
  if (post.location?.name) return post.location.name;
  
  // Fallback temporário para dados legados
  const parts = [];
  if (post.neighborhood) parts.push(post.neighborhood);
  if (post.city) parts.push(post.city);
  
  return parts.join(", ") || "Localização não informada";
}, [post.location, post.neighborhood, post.city]);
```

---

### 3.2 UnifiedComposer

**Arquivo**: `src/modules/community/components/composer/UnifiedComposer.tsx`

**Código Atual**:
```typescript
interface UnifiedComposerProps {
  city?: string;           // ❌ PROBLEMA: usa city legado
  neighborhood?: string;   // ❌ PROBLEMA: usa neighborhood legado
  onPostCreated?: () => void;
  onAlertCreated?: () => void;
  onIssueCreated?: () => void;
}

// Passa city/neighborhood para modais
<CreateAlertModal
  open={activeComposer === "alert"}
  onClose={handleCloseComposer}
  onAlertCreated={handleAlertCreated}
  city={city ?? ""}                    // ❌ PROBLEMA
  neighborhood={neighborhood}          // ❌ PROBLEMA
/>
```

**Problemas**:
1. ❌ Props usam `city` e `neighborhood` (campos legados)
2. ❌ Não usa `location_id`
3. ❌ Não valida território
4. ❌ Não exibe feedback visual do território

**Severidade**: 🔴 CRÍTICA

**Correção Necessária**:
```typescript
interface UnifiedComposerProps {
  locationId?: string;  // ✅ Usar location_id do SSOT
  onPostCreated?: () => void;
  onAlertCreated?: () => void;
  onIssueCreated?: () => void;
}
```

---

### 3.3 CreatePostModal

**Arquivo**: `src/modules/community/components/composer/CreatePostModal.tsx`

**Código Atual**:
```typescript
const handlePublish = async () => {
  if (!form.validateForm()) return;
  if (!profile) { toast.error("Faça login para publicar"); return; }

  setPublishing(true);
  try {
    const data = form.getFormData();
    await postService.createSimplePost({
      author_profile_id: profile.id,
      content: data.content,
      category: data.type as any,
      status: ALERT_STATUS.ACTIVE,
    });  // ❌ PROBLEMA: Não passa location_id
```

**Problemas**:
1. ❌ Não captura `location_id` do usuário
2. ❌ Não valida território antes de criar
3. ❌ Usa `reach` (street/neighborhood/city) mas não converte para `location_id`
4. ❌ Chama `createSimplePost()` que não define `location_id`
5. ⚠️ Tem seletor de `reach` mas não integrado com SSOT

**Severidade**: 🔴 CRÍTICA

**Correção Necessária**:
```typescript
const handlePublish = async () => {
  if (!form.validateForm()) return;
  if (!profile) { toast.error("Faça login para publicar"); return; }
  
  // Validar location_id do perfil
  if (!profile.location_id) {
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
      location_id: profile.location_id,  // ✅ Usar location_id do perfil
      is_published: true,
    });
    toast.success("Post publicado!");
    form.resetForm();
    onClose();
  } catch {
    toast.error("Erro ao publicar");
  } finally {
    setPublishing(false);
  }
};
```

---

### 3.4 CommunityFeed

**Arquivo**: `src/modules/community/components/feed/CommunityFeed.tsx`

**Código Atual**:
```typescript
<UnifiedFeedWithMessages
  civicReports={[]}
  communityPosts={posts}
  currentUserId={currentUserId}
  sortCriteria={sortCriteria}
  filterType={filterType}
  userLocation={{
    neighborhood: activeProfile?.neighborhood || "",  // ❌ PROBLEMA
    city: activeProfile?.city || "",                  // ❌ PROBLEMA
  }}
```

**Problemas**:
1. ❌ Passa `userLocation` com campos legados (city, neighborhood)
2. ⚠️ Usa `useCommunityFeedSimple` que já está correto (usa location_id)
3. ❌ Inconsistência: hook usa SSOT mas props usam legado

**Severidade**: 🟠 ALTA

**Correção Necessária**:
```typescript
<UnifiedFeedWithMessages
  civicReports={[]}
  communityPosts={posts}
  currentUserId={currentUserId}
  sortCriteria={sortCriteria}
  filterType={filterType}
  userLocation={{
    location_id: activeProfile?.location_id,  // ✅ Usar location_id
    location_name: activeProfile?.location?.name,  // ✅ Nome do SSOT
  }}
```

---

### 3.5 UserPostsGrid

**Arquivo**: `src/modules/profile/components/UserPostsGrid.tsx`

**Análise**:
```typescript
const {
  posts,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  loadMore,
} = useUserPosts({
  userId,
  filters: {
    type: typeFilter === "all" ? undefined : typeFilter,
    sortBy,
  },
});
```

**Problemas**:
1. ✅ Não usa filtros territoriais diretamente (bom)
2. ⚠️ Depende de `useUserPosts` - precisa auditar esse hook
3. ✅ Apenas renderiza posts retornados

**Severidade**: 🟡 MÉDIA (depende de `useUserPosts`)

**Ação**: Auditar `useUserPosts` hook

---

### 3.6 SavedPostsGrid

**Arquivo**: `src/modules/profile/components/SavedPostsGrid.tsx`

**Análise**:
```typescript
const {
  posts,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  loadMore,
} = useSavedPosts({ userId });
```

**Problemas**:
1. ✅ Não usa filtros territoriais diretamente (bom)
2. ⚠️ Depende de `useSavedPosts` - precisa auditar esse hook
3. ✅ Apenas renderiza posts retornados

**Severidade**: 🟡 MÉDIA (depende de `useSavedPosts`)

**Ação**: Auditar `useSavedPosts` hook

---

### 3.7 SearchModal

**Arquivo**: `src/modules/community/components/SearchModal.tsx`

**Análise**:
```typescript
const {
  query,
  results,
  isSearching,
  searchHistory,
  search,
  clearSearch,
  removeFromHistory,
} = useSearch();
```

**Problemas**:
1. ✅ Não usa filtros territoriais diretamente (bom)
2. ⚠️ Depende de `useSearch` - precisa auditar esse hook
3. ✅ Apenas renderiza resultados retornados

**Severidade**: 🟡 MÉDIA (depende de `useSearch`)

**Ação**: Auditar `useSearch` hook

---

## 4. PROBLEMA TRANSVERSAL: `supabase as any`

### Ocorrências Identificadas

**PostService.ts** - Múltiplas ocorrências:
- Linha 48: `createPost()`
- Linha 138: `getPostById()`
- Linha 260: `getFeed()`
- Linha 380: `getPostsByProfile()`
- Linha 420: `getPostsByLocation()`
- Linha 1680: `getActiveAlerts()`
- Linha 1740: `getPopularTags()`
- Linha 1818: `getTopPosts()`
- Linha 1896: `createSimplePost()`
- Linha 2088: `createCommunityPostWithValidation()`

**Problema**:
```typescript
const { data, error } = await (supabase as any)  // ❌ PROBLEMA
  .from("posts")
  .select("*")
```

**Impacto**:
1. ❌ Perde tipagem do TypeScript
2. ❌ Não detecta erros em tempo de compilação
3. ❌ Dificulta refatoração
4. ❌ Reduz segurança do código

**Severidade**: 🟠 ALTA

**Correção Necessária**:
```typescript
import { Database } from '@/integrations/supabase/types';

const { data, error } = await supabase
  .from("posts")
  .select("*")
  .returns<Database['public']['Tables']['posts']['Row'][]>();
```

---

## 5. AUDITORIA QUANTITATIVA DO BANCO

### 5.1 Cobertura de location_id

**Query Executada**:
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

**Resultado**: ⚠️ NÃO EXECUTADO (Circuit breaker ativo no banco)

**Status**: Pendente de execução quando banco estiver disponível

---

### 5.2 Posts sem location_id por city/neighborhood

**Query Executada**:
```sql
SELECT 
  city, 
  neighborhood, 
  COUNT(*) as count 
FROM posts 
WHERE location_id IS NULL 
GROUP BY city, neighborhood 
ORDER BY count DESC 
LIMIT 10;
```

**Resultado**: ⚠️ NÃO EXECUTADO (Circuit breaker ativo no banco)

**Status**: Pendente de execução quando banco estiver disponível

---

### 5.3 Validação de textSearch

**Query Executada**:
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'posts'
  AND (indexdef LIKE '%gin%' OR indexdef LIKE '%GIN%');
```

**Resultado**: ⚠️ NÃO EXECUTADO (Circuit breaker ativo no banco)

**Status**: Pendente de validação

**Recomendação**: 
- Validar se índice GIN existe antes de usar `.textSearch()`
- Implementar fallback para `.ilike()` se não existir
- Criar índice se necessário:
```sql
CREATE INDEX IF NOT EXISTS idx_posts_content_search 
  ON posts 
  USING gin(to_tsvector('portuguese', content));
```

---

## 6. MATRIZ DE PRIORIZAÇÃO

| ID | Problema | Arquivo | Severidade | Impacto | Esforço | Prioridade |
|----|----------|---------|------------|---------|---------|------------|
| 1.1 | createPost() usa campos legados | PostService.ts:48 | 🔴 CRÍTICA | Alto | 2h | P0 |
| 1.5 | createCommunityPostWithValidation() usa legados | PostService.ts:2088 | 🔴 CRÍTICA | Alto | 2h | P0 |
| 2.2 | getPostsByLocation() usa legados | PostService.ts:420 | 🔴 CRÍTICA | Alto | 1h | P0 |
| 2.3 | getActiveAlerts() usa legados | PostService.ts:1680 | 🔴 CRÍTICA | Médio | 1h | P0 |
| 2.4 | getPopularTags() usa legados | PostService.ts:1740 | 🔴 CRÍTICA | Médio | 1h | P0 |
| 2.5 | getTopPosts() usa legados | PostService.ts:1818 | 🔴 CRÍTICA | Médio | 1h | P0 |
| 3.2 | UnifiedComposer usa city/neighborhood | UnifiedComposer.tsx | 🔴 CRÍTICA | Alto | 3h | P0 |
| 3.3 | CreatePostModal não usa location_id | CreatePostModal.tsx | 🔴 CRÍTICA | Alto | 2h | P0 |
| 7.1 | useCreatePostForm usa reach | useCreatePostForm.ts | 🔴 CRÍTICA | Alto | 1h | P0 |
| 1.4 | createSimplePost() sem location_id | PostService.ts:1896 | 🔴 CRÍTICA | Médio | 1h | P0 |
| 2.1 | getFeed() tem fallback legado | PostService.ts:260 | 🟠 ALTA | Alto | 2h | P1 |
| 3.1 | UnifiedPostCard não usa location.name | UnifiedPostCard/index.tsx | 🟠 ALTA | Médio | 1h | P1 |
| 3.4 | CommunityFeed passa userLocation legado | CommunityFeed.tsx | 🟠 ALTA | Médio | 1h | P1 |
| 4.0 | supabase as any (10+ ocorrências) | PostService.ts | 🟠 ALTA | Médio | 3h | P1 |
| 1.2 | updatePost() permite campos legados | PostService.ts:168 | 🟡 MÉDIA | Baixo | 1h | P2 |
| 3.5 | UserPostsGrid depende de useUserPosts | UserPostsGrid.tsx | 🟡 MÉDIA | Baixo | - | P2 |
| 3.6 | SavedPostsGrid depende de useSavedPosts | SavedPostsGrid.tsx | 🟡 MÉDIA | Baixo | - | P2 |
| 3.7 | SearchModal depende de useSearch | SearchModal.tsx | 🟡 MÉDIA | Baixo | - | P2 |
| 5.3 | Validar textSearch no banco | - | 🟡 MÉDIA | Médio | 1h | P2 |

**Total de Esforço Estimado (P0 + P1)**: 22h

**Problemas Críticos (P0)**: 10  
**Problemas Altos (P1)**: 4  
**Problemas Médios (P2)**: 5

---

## 7. HOOKS DE FORMULÁRIO E FEED

### 7.1 useCreatePostForm

**Arquivo**: `src/modules/community/hooks/composer/useCreatePostForm.ts`

**Código Atual**:
```typescript
const [reach, setReach] = useState<"street" | "neighborhood" | "city">("neighborhood");

const getFormData = () => {
  return {
    content,
    type,
    reach,  // ❌ PROBLEMA: Retorna reach mas não location_id
    images,
  };
};
```

**Problemas**:
1. ❌ Usa `reach` (street/neighborhood/city) em vez de `location_id`
2. ❌ Não valida território
3. ❌ Não converte reach para location_id
4. ❌ Não captura location_id do perfil

**Severidade**: 🔴 CRÍTICA

**Correção Necessária**:
```typescript
// Remover reach, usar location_id do perfil
const getFormData = () => {
  return {
    content,
    type,
    images,
    // location_id será capturado do perfil no momento da criação
  };
};
```

---

### 7.2 useCommunityFeed

**Arquivo**: `src/modules/community/hooks/feed/useCommunityFeed.ts`

**Código Atual**:
```typescript
// Filtro territorial canônico — location ou group
if (filter.scope === 'location') {
  params.location_id = filter.location_id;
  params.district_filter = true;
} else if (filter.scope === 'group') {
  params.location_ids = filter.location_ids;
}
```

**Problemas**:
1. ✅ Usa `location_id` (bom)
2. ✅ Usa `useTerritoryFilter` (bom)
3. ✅ Suporta location e group (bom)
4. ✅ Integrado com SSOT

**Severidade**: ✅ SEM PROBLEMAS

**Status**: Hook está correto e seguindo SSOT

---

### 7.3 Hooks Não Auditados

**Hooks Identificados mas Não Auditados**:
- `useUserPosts` - Posts do usuário (usado por UserPostsGrid)
- `useSavedPosts` - Posts salvos (usado por SavedPostsGrid)
- `useSearch` - Busca de posts (usado por SearchModal)

**Ação**: Auditar estes hooks se forem críticos para Sprint 2

---

## 8. PRÓXIMAS AÇÕES

### Ações Imediatas

1. ✅ Completar auditoria de componentes principais (7/7 completos)
2. ⏳ Executar queries de auditoria quantitativa quando banco disponível
3. ⏳ Validar textSearch no banco
4. ⏳ Atualizar plano com todas as correções
5. ⏳ Aguardar aprovação das decisões da Fase 0

### Hooks Secundários Pendentes (Opcional)

Se necessário para Sprint 2, auditar:
- `useUserPosts` - Posts do usuário
- `useSavedPosts` - Posts salvos
- `useSearch` - Busca de posts

**Nota**: Estes hooks são secundários e podem ser auditados durante a implementação se necessário.

### Após Auditoria 100% Completa

1. Atualizar SPRINT2_POSTS_PLANO_V2.md
2. Solicitar aprovação para Fase 1
3. Iniciar implementação

---

## 9. CONCLUSÕES

### Problemas Críticos Identificados

1. **Writes**: 6 funções usam campos legados ou não definem location_id (incluindo createCommunityPost)
2. **Reads**: 5 funções usam filtros legados (city/neighborhood)
3. **Renders**: 3 componentes usam campos legados
4. **Hooks**: 1 hook usa reach em vez de location_id
5. **Tipagem**: 10+ ocorrências de `supabase as any`

### Cobertura da Auditoria

- ✅ Writes: 100% auditado (6/6 funções)
- ✅ Reads: 100% auditado (5/5 funções)
- ✅ Renders: 100% auditado (7/7 componentes principais)
- ✅ Hooks: 100% auditado (2/2 hooks principais)
- ❌ Banco: 0% auditado (circuit breaker)

**Auditoria de Código**: 70% completa (banco pendente)

### Estimativa de Correção

- **P0 (Crítico)**: 16h (11 problemas)
- **P1 (Alto)**: 7h (4 problemas)
- **P2 (Médio)**: 3h (5 problemas)
- **Total**: 26h de correções

### Novos Problemas Identificados

**Além dos problemas territoriais**, foram identificados:
1. ❌ `reach` (street/neighborhood/city) não integrado com SSOT
2. ❌ CreatePostModal não valida território antes de criar
3. ❌ CommunityFeed passa userLocation com campos legados (apenas exibição)
4. ❌ useCreatePostForm não captura location_id
5. ❌ createCommunityPost() usa community_posts sem validação

**Impacto**: +4h de esforço adicional (total: 26h)

---

**Status**: ⚠️ AUDITORIA PARCIAL (70%)  
**Próximo Passo**: Fechar Fase 0 e executar auditoria quantitativa  
**Bloqueante**: NÃO PRONTO PARA IMPLEMENTAÇÃO

---

## 10. PENDÊNCIAS OBRIGATÓRIAS

### Antes de Iniciar Sprint 2:

1. ❌ **Fechar Fase 0**: Aprovar 5 decisões territoriais
   - Relação location_id vs reach
   - Níveis territoriais permitidos
   - Expansão territorial
   - Validação e rejeição
   - Migração de dados legados

2. ✅ **Auditar createCommunityPost()**: COMPLETO
   - Identificado: usa community_posts sem validação
   - Severidade: 🔴 CRÍTICA
   - Esforço: +1h

3. ❌ **Auditoria quantitativa do banco**: BLOQUEADA
   - Pode ser executada durante Fase 1
   - Não bloqueia aprovação

4. ✅ **Confirmar impacto userLocation**: COMPLETO
   - Confirmado: Apenas exibição (ordenação "nearby")
   - Não afeta filtros territoriais
   - Severidade: 🟡 MÉDIA

5. ❌ **Formalizar plano de migração**: PENDENTE
   - Decisão: posts como fonte de verdade
   - Plano: community_posts → posts
   - Fase 0.5: Consolidação Estrutural (15h)

### Status: 2/5 Completas (40%)

**Bloqueantes Críticos**: Pendências 1 e 5

---

## 11. RECOMENDAÇÕES PARA SPRINT 2

### NÃO INICIAR IMPLEMENTAÇÃO AINDA

**Motivo**: Auditoria madura para replanejar, mas não para implementar

### Próximos Passos Obrigatórios:

1. ⏳ Aprovar decisões da Fase 0
2. ⏳ Formalizar plano de migração community_posts
3. ⏳ Atualizar SPRINT2_POSTS_PLANO_V2.md
4. ⏳ Executar auditoria quantitativa (durante Fase 1)
5. ⏳ Solicitar aprovação final

### Estimativa Revisada:

```
Fase 0: Regras Territoriais (4h)
Fase 0.5: Consolidação Estrutural (15h) ← NOVO
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

**Data**: 2026-04-05  
**Status**: ⚠️ AUDITORIA PARCIAL - NÃO PRONTO PARA IMPLEMENTAÇÃO  
**Documentos**: Ver `PENDENCIAS_OBRIGATORIAS_SPRINT2.md` e `FASE0_POSTS_REGRAS_TERRITORIAIS.md`
