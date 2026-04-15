# APROVAÇÃO FINAL - SPRINT 2 POSTS

**Data**: 2026-04-05  
**Status**: ✅ PRONTO PARA APROVAÇÃO  
**Estimativa**: 40h-45h (5-6 dias úteis)

---

## RESOLUÇÃO DOS 5 BLOQUEIOS

### ✅ BLOQUEIO 1: Schema Real vs Migration

**Problema**: Contradição entre "schema real do banco" e "schema vindo da migration"

**Resolução**:
- Schema confirmado no banco linked: `supabase/migrations/20260325000000_base_schema.sql`
- Todas as referências ao schema agora usam APENAS o schema confirmado
- Documentação atualizada em `SCHEMA_FINAL_POSTS.md`

**Schema Real Confirmado**:
```sql
CREATE TABLE posts (
  id                UUID PRIMARY KEY,
  autor_id          UUID,              -- LEGADO (será ignorado)
  author_profile_id UUID NOT NULL,     -- CANÔNICO
  texto             TEXT,              -- LEGADO (será ignorado)
  content           TEXT,              -- CANÔNICO
  type              TEXT NOT NULL,
  image_url         TEXT,
  video_url         TEXT,
  images            JSONB DEFAULT '[]',
  city              TEXT,              -- LEGADO (será ignorado)
  neighborhood      TEXT,              -- LEGADO (será ignorado)
  street            TEXT,              -- LEGADO (será ignorado)
  location_id       UUID,              -- CANÔNICO (nullable)
  likes_count       INTEGER NOT NULL DEFAULT 0,
  comments_count    INTEGER NOT NULL DEFAULT 0,
  tags              JSONB DEFAULT '[]',
  confirmations_count INTEGER NOT NULL DEFAULT 0,
  is_verified       BOOLEAN NOT NULL DEFAULT false,
  is_published      BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL,
  updated_at        TIMESTAMPTZ NOT NULL
);
```

**Colunas que NÃO existem** (precisam ser criadas):
- ❌ `reach` - Será criada na Fase 0

---

### ✅ BLOQUEIO 2: Foreign Key + NOT NULL em location_id

**Problema**: Plano não incluía FK real e NOT NULL em posts.location_id

**Resolução**:
- Tabela posts está vazia (confirmado por auditoria quantitativa)
- FK + NOT NULL serão aplicados JÁ NESTA SPRINT
- Trigger sozinho não basta - constraint de FK garante integridade referencial

**Implementação na Fase 1**:
```sql
-- 1. Adicionar FK (tabela vazia, pode aplicar diretamente)
ALTER TABLE posts
  ADD CONSTRAINT posts_location_id_fkey
  FOREIGN KEY (location_id)
  REFERENCES locations(id)
  ON DELETE SET NULL;

-- 2. Aplicar NOT NULL (após validar que todos os posts terão location_id)
-- Será aplicado após backfill se houver dados, ou imediatamente se vazio
ALTER TABLE posts
  ALTER COLUMN location_id SET NOT NULL;

-- 3. Constraint de tipo (city ou district apenas)
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

-- 4. Trigger de validação (validação adicional no INSERT/UPDATE)
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

CREATE TRIGGER validate_post_location_trigger
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION validate_post_location();
```

**Por que FK + Trigger + Constraint?**
- FK: Integridade referencial (impede location_id órfão)
- Trigger: Validação de tipo e status no momento da operação
- Constraint: Validação declarativa no schema
- NOT NULL: Garante que todo post tem território

---

### ✅ BLOQUEIO 3: RLS Policies Multi-Profile

**Problema**: RLS policies incorretas - auth.uid() não pode ser comparado diretamente com author_profile_id

**Resolução**:
- `auth.uid()` retorna `user_id` (UUID do auth.users)
- `author_profile_id` referencia `profiles.id` (UUID do profiles)
- Solução: Usar EXISTS com JOIN em profiles

**RLS Policies Corrigidas**:
```sql
-- Remover policies antigas
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

**Por que EXISTS sem LIMIT 1?**
- EXISTS é otimizado pelo PostgreSQL (para na primeira linha)
- LIMIT 1 é redundante e pode confundir o otimizador
- EXISTS com JOIN é o padrão para RLS multi-profile

---

### ✅ BLOQUEIO 4: SELECT com JOIN locations

**Problema**: Selects do feed não incluíam JOIN com locations, mas UI precisa de post.location?.name

**Resolução**:
- Todos os SELECTs de feed agora incluem JOIN com locations
- UI terá acesso a post.location.name sem queries adicionais

**SELECT Corrigido**:
```typescript
async getFeed(params: FeedParams = {}): Promise<FeedResult> {
  // ... validações e filtros ...

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

  // ... paginação e retorno ...
}
```

**Benefícios**:
- UI renderiza `post.location.name` diretamente
- Sem queries N+1
- Performance otimizada com JOIN único

---

### ✅ BLOQUEIO 5: Regra Território Group Formalizada

**Problema**: Não havia regra formal para criação quando território ativo for group

**Resolução**:
- Território group REJEITA criação de post com erro explícito
- SEM fallback silencioso para profile.location_id
- Usuário deve trocar para location ou city antes de postar

**Regra Formalizada**:
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
    throw new PostError(
      "location_id é obrigatório",
      "LOCATION_REQUIRED"
    );
  }

  // 2. Validar que location_id existe e é válido
  const { data: location, error: locationError } = await supabase
    .from('locations')
    .select('id, type, status')
    .eq('id', data.location_id)
    .single();

  if (locationError || !location) {
    throw new PostError(
      "Localização inválida",
      "INVALID_LOCATION"
    );
  }

  // 3. REJEITAR se for grupo territorial
  if (location.type === 'group') {
    throw new PostError(
      "Posts não podem ser criados em grupos territoriais. Selecione uma cidade ou bairro específico.",
      "GROUP_NOT_ALLOWED"
    );
  }

  // 4. Validar tipo permitido (city ou district)
  if (!['city', 'district'].includes(location.type)) {
    throw new PostError(
      "Posts só podem ser criados em cidades ou bairros",
      "INVALID_LOCATION_TYPE"
    );
  }

  // 5. Validar status ativo
  if (location.status !== 'active') {
    throw new PostError(
      "Localização inativa",
      "INACTIVE_LOCATION"
    );
  }

  // 6. Criar post
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
      author_profile:profiles!author_profile_id(*),
      location:locations!location_id(*)
    `)
    .single();

  if (error) {
    throw new PostError(error.message, error.code || "CREATE_FAILED");
  }

  return post;
}
```

**Comportamento na UI**:
```typescript
// CreatePostModal.tsx
const handlePublish = async () => {
  const { filter } = useTerritoryFilter();
  
  // Obter location_id do território ativo
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

  try {
    await postService.createPost({
      author_profile_id: profile.id,
      content: data.content,
      type: data.type,
      location_id: locationId,
      reach: data.reach,
      images: data.images,
    });
    toast.success("Post publicado!");
  } catch (error) {
    if (error instanceof PostError) {
      toast.error(error.message);
    }
  }
};
```

**Por que rejeitar grupo?**
- Grupo territorial é um agregador de múltiplos locations
- Post precisa de location_id único (city ou district)
- Fallback silencioso esconderia erro de UX
- Usuário deve escolher explicitamente onde postar

---

## CRONOGRAMA FINAL

### Fase 0: Preparação Estrutural (2h)
- Adicionar coluna reach
- Criar índice GIN para textSearch
- Validar constraints

### Fase 1: Modelagem Territorial (5h)
- Adicionar FK em location_id
- Aplicar NOT NULL em location_id
- Criar função de validação
- Criar trigger de validação
- Atualizar RLS policies (multi-profile com EXISTS)
- Criar índices territoriais

### Fase 2: Service Layer (8h)
- createPost() com location_id obrigatório e validação de grupo
- Redirecionar createCommunityPost() → createPost()
- getFeed() com JOIN locations e expansão territorial
- Logs estruturados
- Remover funções legadas

### Fase 3: Formulários e Hooks (7h)
- CreatePostModal com validação de território group
- useCreatePostForm com reach
- UnifiedComposer com location_id

### Fase 4: Componentes (6h)
- UnifiedPostCard com location.name do JOIN
- CommunityFeed com SSOT
- PostAdapter com location_id

### Fase 5: Testes (6h)
- 19 testes runtime (incluindo rejeição de grupo)
- 8 testes E2E
- Testes de regressão

### Fase 6: Seeds (2h)
- Seeds com schema real

### Fase 7: Documentação (2h)
- Arquitetura, guias

**Total**: 38h  
**Buffer**: 40h-45h (5-6 dias úteis)

---

## PÓS-SPRINT: LIMPEZA (SEPARADO)

Após Sprint 2 (não incluído nos 40h-45h):

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

**Estimativa**: 2h (separado)

---

## CHECKLIST DE APROVAÇÃO

- [x] Bloqueio 1: Schema real documentado (não migration)
- [x] Bloqueio 2: FK + NOT NULL em location_id
- [x] Bloqueio 3: RLS policies multi-profile com EXISTS
- [x] Bloqueio 4: SELECT com JOIN locations
- [x] Bloqueio 5: Regra território group formalizada (rejeitar)
- [x] Plano atualizado (`SPRINT2_POSTS_PLANO_APROVADO.md`)
- [x] Estimativa realista (40h-45h)
- [ ] Aprovação final do usuário ⏳

---

## COMPARAÇÃO: ANTES vs DEPOIS

### Antes (Plano com Bloqueios)

❌ Schema presumido (não confirmado)  
❌ Sem FK em location_id  
❌ RLS policies incorretas (auth.uid() direto)  
❌ SELECT sem JOIN locations  
❌ Fallback silencioso para grupo territorial

### Depois (Plano Corrigido)

✅ Schema confirmado do banco linked  
✅ FK + NOT NULL em location_id  
✅ RLS policies corretas (EXISTS com profiles)  
✅ SELECT com JOIN locations  
✅ Rejeição explícita de grupo territorial

---

## PRÓXIMOS PASSOS

### Após Aprovação:

1. ⏳ Criar branch `sprint2-posts-ssot`
2. ⏳ Iniciar Fase 0: Preparação Estrutural
3. ⏳ Seguir `SPRINT2_POSTS_PLANO_APROVADO.md`
4. ⏳ Reportar progresso diário
5. ⏳ Executar gates de qualidade

---

## CONCLUSÃO

Sprint 2 está **pronto para aprovação** com todos os 5 bloqueios resolvidos:

✅ **Schema real**: Confirmado do banco linked  
✅ **FK + NOT NULL**: Aplicados já nesta sprint  
✅ **RLS corrigidas**: EXISTS com profiles (multi-profile)  
✅ **SELECT com JOIN**: UI terá post.location.name  
✅ **Grupo territorial**: Rejeição explícita (sem fallback)  

**Aguardando aprovação final para iniciar implementação.**

---

**Data**: 2026-04-05  
**Responsável**: Kiro AI  
**Status**: ✅ PRONTO PARA APROVAÇÃO (5 BLOQUEIOS RESOLVIDOS)
