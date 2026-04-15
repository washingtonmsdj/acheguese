# APROVAÇÃO FINAL - SPRINT 2 POSTS (DEFINITIVA)

**Data**: 2026-04-05  
**Status**: ✅ PRONTO PARA APROVAÇÃO  
**Estimativa**: 40h-45h (5-6 dias úteis)

---

## RESOLUÇÃO DAS 4 CORREÇÕES OBRIGATÓRIAS

### ✅ CORREÇÃO 1: FK com ON DELETE RESTRICT

**Problema**: FK estava com ON DELETE SET NULL, mas location_id será NOT NULL

**Resolução**:
```sql
-- FK com RESTRICT (não permite deletar location se houver posts)
ALTER TABLE posts
  ADD CONSTRAINT posts_location_id_fkey
  FOREIGN KEY (location_id)
  REFERENCES locations(id)
  ON DELETE RESTRICT;
```

**Justificativa**:
- location_id será NOT NULL
- ON DELETE SET NULL não faz sentido com NOT NULL
- ON DELETE RESTRICT protege integridade: não permite deletar location com posts
- Se precisar deletar location, deve primeiro mover/deletar posts

---

### ✅ CORREÇÃO 2: Remover CHECK com EXISTS

**Problema**: CHECK constraint com EXISTS é redundante e pode causar problemas de performance

**Resolução**:
```sql
-- FK garante existência
ALTER TABLE posts
  ADD CONSTRAINT posts_location_id_fkey
  FOREIGN KEY (location_id)
  REFERENCES locations(id)
  ON DELETE RESTRICT;

-- Trigger valida type e status
CREATE OR REPLACE FUNCTION validate_post_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.location_id IS NOT NULL THEN
    -- Buscar location
    DECLARE
      loc_type TEXT;
      loc_status TEXT;
    BEGIN
      SELECT type, status INTO loc_type, loc_status
      FROM locations
      WHERE id = NEW.location_id;
      
      -- Validar tipo
      IF loc_type NOT IN ('city', 'district') THEN
        RAISE EXCEPTION 'Posts só podem ser criados em cidades ou bairros (type: city ou district)';
      END IF;
      
      -- Validar status
      IF loc_status != 'active' THEN
        RAISE EXCEPTION 'Localização inativa';
      END IF;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_post_location_trigger
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION validate_post_location();
```

**Divisão de Responsabilidades**:
- **FK**: Garante que location_id existe em locations
- **Trigger**: Valida type (city/district) e status (active)
- **NOT NULL**: Garante que todo post tem location_id (aplicado na Fase 4)

---

### ✅ CORREÇÃO 3: Schema Introspectado do Banco Real

**Problema**: Documentação referenciava migration histórica, não banco real

**Resolução**: Schema confirmado por introspecção do banco linked

**Query de Introspecção**:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'posts'
ORDER BY ordinal_position;
```

**Schema Real Introspectado** (2026-04-05):
```
┌─────────────────────┬──────────────────────────┬─────────────┬───────────────────┐
│     column_name     │        data_type         │ is_nullable │  column_default   │
├─────────────────────┼──────────────────────────┼─────────────┼───────────────────┤
│ id                  │ uuid                     │ NO          │ gen_random_uuid() │
│ autor_id            │ uuid                     │ YES         │ NULL              │
│ author_profile_id   │ uuid                     │ NO          │ NULL              │
│ texto               │ text                     │ YES         │ NULL              │
│ content             │ text                     │ YES         │ NULL              │
│ type                │ text                     │ NO          │ 'text'::text      │
│ image_url           │ text                     │ YES         │ NULL              │
│ video_url           │ text                     │ YES         │ NULL              │
│ images              │ jsonb                    │ YES         │ '[]'::jsonb       │
│ city                │ text                     │ YES         │ NULL              │
│ neighborhood        │ text                     │ YES         │ NULL              │
│ street              │ text                     │ YES         │ NULL              │
│ location_id         │ uuid                     │ YES         │ NULL              │
│ likes_count         │ integer                  │ NO          │ 0                 │
│ comments_count      │ integer                  │ NO          │ 0                 │
│ tags                │ jsonb                    │ YES         │ '[]'::jsonb       │
│ confirmations_count │ integer                  │ NO          │ 0                 │
│ is_verified         │ boolean                  │ NO          │ false             │
│ is_published        │ boolean                  │ NO          │ true              │
│ created_at          │ timestamp with time zone │ NO          │ now()             │
│ updated_at          │ timestamp with time zone │ NO          │ now()             │
└─────────────────────┴──────────────────────────┴─────────────┴───────────────────┘
```

**Colunas que NÃO existem** (precisam ser criadas):
- ❌ `reach` - Será criada na Fase 0

**Colunas LEGADAS** (existem mas serão ignoradas):
- `autor_id` (usar author_profile_id)
- `texto` (usar content)
- `city`, `neighborhood`, `street` (usar location_id)

---

### ✅ CORREÇÃO 4: NOT NULL Apenas Após Migração Completa

**Problema**: Aplicar NOT NULL antes de migrar writes/forms/hooks pode quebrar código existente

**Resolução**: Reordenar sprint para aplicar NOT NULL apenas na Fase 4 (após migração completa)

**Nova Ordem**:
1. **Fase 0**: Preparação (adicionar reach, índices)
2. **Fase 1**: Modelagem (FK com RESTRICT, trigger de validação)
3. **Fase 2**: Service Layer (migrar writes para location_id)
4. **Fase 3**: Formulários (migrar forms para location_id)
5. **Fase 4**: Aplicar NOT NULL (após código migrado) ← MOVIDO PARA CÁ
6. **Fase 5**: Componentes
7. **Fase 6**: Testes
8. **Fase 7**: Seeds
9. **Fase 8**: Documentação

**Justificativa**:
- Código existente pode ainda usar campos legados
- NOT NULL quebraria código não migrado
- Aplicar NOT NULL apenas quando todo código usar location_id
- Segurança: FK + Trigger já validam durante migração

---

## CRONOGRAMA CORRIGIDO

### Fase 0: Preparação Estrutural (2h)
```sql
-- 1. Adicionar coluna reach
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS reach TEXT
    CHECK (reach IN ('street', 'neighborhood', 'city'))
    DEFAULT 'neighborhood';

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

### Fase 1: Modelagem Territorial (4h)
```sql
-- 1. Adicionar FK com RESTRICT
ALTER TABLE posts
  ADD CONSTRAINT posts_location_id_fkey
  FOREIGN KEY (location_id)
  REFERENCES locations(id)
  ON DELETE RESTRICT;

-- 2. Função de validação (type e status)
CREATE OR REPLACE FUNCTION validate_post_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.location_id IS NOT NULL THEN
    DECLARE
      loc_type TEXT;
      loc_status TEXT;
    BEGIN
      SELECT type, status INTO loc_type, loc_status
      FROM locations
      WHERE id = NEW.location_id;
      
      IF loc_type NOT IN ('city', 'district') THEN
        RAISE EXCEPTION 'Posts só podem ser criados em cidades ou bairros';
      END IF;
      
      IF loc_status != 'active' THEN
        RAISE EXCEPTION 'Localização inativa';
      END IF;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger de validação
CREATE TRIGGER validate_post_location_trigger
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION validate_post_location();

-- 4. Índices territoriais
CREATE INDEX IF NOT EXISTS idx_posts_location_created 
  ON posts(location_id, created_at DESC) 
  WHERE location_id IS NOT NULL AND is_published = true;

CREATE INDEX IF NOT EXISTS idx_posts_location_reach 
  ON posts(location_id, reach) 
  WHERE location_id IS NOT NULL;

-- 5. Atualizar RLS policies (multi-profile com EXISTS)
DROP POLICY IF EXISTS "Published posts viewable" ON posts;
DROP POLICY IF EXISTS "Authors manage own posts" ON posts;

CREATE POLICY posts_read_published ON posts
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

CREATE POLICY posts_read_own ON posts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = posts.author_profile_id 
        AND profiles.user_id = auth.uid()
    )
  );

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

---

### Fase 2: Service Layer (8h)

**Migrar writes para location_id obrigatório**

```typescript
async createPost(data: {
  author_profile_id: string;
  content: string;
  type: string;
  location_id: string;  // OBRIGATÓRIO
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
      author_profile:profiles!author_profile_id(*),
      location:locations!location_id(*)
    `)
    .single();

  if (error) {
    throw new PostError(error.message, error.code || "CREATE_FAILED");
  }

  return post;
}

// Redirecionar funções legadas
/** @deprecated */
async createCommunityPost(data: any): Promise<Post> {
  return this.createPost({
    author_profile_id: data.author_profile_id,
    content: data.content,
    type: data.type || 'text',
    location_id: data.location_id,
    reach: data.reach,
    tags: data.tags,
  });
}

// getFeed com JOIN e expansão territorial
async getFeed(params: FeedParams): Promise<FeedResult> {
  const expandedIds = await this.expandLocationIds(params.location_ids);

  const { data } = await supabase
    .from('posts')
    .select(`
      *,
      author_profile:profiles!author_profile_id(*),
      location:locations!location_id(*)
    `)
    .in('location_id', expandedIds)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  return { posts: data };
}
```

---

### Fase 3: Formulários e Hooks (7h)

**Migrar forms para location_id**

```typescript
// CreatePostModal.tsx
const handlePublish = async () => {
  const { filter } = useTerritoryFilter();
  let locationId: string | null = null;
  
  if (filter.scope === 'location') {
    locationId = filter.location_id;
  } else if (filter.scope === 'group') {
    toast.error("Selecione uma cidade ou bairro específico para publicar");
    return;
  } else {
    locationId = profile.location_id;
  }

  if (!locationId) {
    toast.error("Configure sua localização no perfil");
    return;
  }

  await postService.createPost({
    author_profile_id: profile.id,
    content: data.content,
    type: data.type,
    location_id: locationId,
    reach: data.reach,
    images: data.images,
  });
};
```

---

### Fase 4: Aplicar NOT NULL (1h) ← MOVIDO PARA CÁ

**Após todo código migrado, aplicar NOT NULL**

```sql
-- Validar que não há posts sem location_id
SELECT COUNT(*) FROM posts WHERE location_id IS NULL;
-- Deve retornar 0

-- Aplicar NOT NULL
ALTER TABLE posts
  ALTER COLUMN location_id SET NOT NULL;

-- Validar constraint
\d posts
-- Deve mostrar location_id | uuid | not null
```

**Gate de Qualidade**:
- ✅ Todos os writes usam location_id
- ✅ Todos os forms capturam location_id
- ✅ Todos os hooks validam location_id
- ✅ Nenhum post no banco com location_id NULL
- ✅ Testes passando

---

### Fase 5: Componentes (6h)

**Renderizar location.name do JOIN**

```typescript
// UnifiedPostCard.tsx
const formattedLocation = useMemo(() => {
  if (post.location?.name) return post.location.name;
  return "Localização não informada";
}, [post.location]);
```

---

### Fase 6: Testes (6h)

**Testes runtime e E2E**

```typescript
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

it('FK deve impedir deletar location com posts', async () => {
  const locationId = await createLocation({ type: 'city' });
  await createPost({ location_id: locationId });
  
  await expect(
    deleteLocation(locationId)
  ).rejects.toThrow('violates foreign key constraint');
});
```

---

### Fase 7: Seeds (2h)

```sql
INSERT INTO posts (
  author_profile_id,
  content,
  type,
  location_id,
  reach,
  is_published
) VALUES (
  (SELECT id FROM profiles LIMIT 1),
  'Post de teste',
  'text',
  (SELECT id FROM locations WHERE type = 'district' LIMIT 1),
  'neighborhood',
  true
);
```

---

### Fase 8: Documentação (2h)

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

## CHECKLIST DE APROVAÇÃO

- [x] Correção 1: FK com ON DELETE RESTRICT
- [x] Correção 2: Remover CHECK com EXISTS (usar FK + Trigger)
- [x] Correção 3: Schema introspectado do banco real
- [x] Correção 4: NOT NULL apenas após migração completa (Fase 4)
- [x] Plano reordenado
- [x] Estimativa realista (40h-45h)
- [ ] Aprovação final do usuário ⏳

---

## COMPARAÇÃO: ANTES vs DEPOIS

### Antes (Com Problemas)

❌ FK com ON DELETE SET NULL (incompatível com NOT NULL)  
❌ CHECK constraint com EXISTS (redundante)  
❌ Schema da migration histórica (não introspectado)  
❌ NOT NULL aplicado antes de migrar código

### Depois (Corrigido)

✅ FK com ON DELETE RESTRICT (protege integridade)  
✅ FK para existência + Trigger para type/status  
✅ Schema introspectado do banco real  
✅ NOT NULL aplicado na Fase 4 (após migração completa)

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

## PRÓXIMOS PASSOS

### Após Aprovação:

1. ⏳ Criar branch `sprint2-posts-ssot`
2. ⏳ Iniciar Fase 0: Preparação Estrutural
3. ⏳ Seguir plano fase por fase
4. ⏳ Aplicar NOT NULL apenas na Fase 4
5. ⏳ Reportar progresso diário

---

## CONCLUSÃO

Sprint 2 está **pronta para aprovação** com todas as 4 correções aplicadas:

✅ **FK com RESTRICT**: Protege integridade referencial  
✅ **FK + Trigger**: Divisão clara de responsabilidades  
✅ **Schema introspectado**: Baseado no banco real  
✅ **NOT NULL na Fase 4**: Após migração completa do código  

**Aguardando aprovação final para iniciar implementação.**

---

**Data**: 2026-04-05  
**Responsável**: Kiro AI  
**Status**: ✅ PRONTO PARA APROVAÇÃO (4 CORREÇÕES APLICADAS)
