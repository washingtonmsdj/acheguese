# EVIDÊNCIA - FASE 1: MODELAGEM TERRITORIAL

**Data**: 2026-04-05  
**Status**: ✅ CONCLUÍDA  
**Tempo**: 45min  

---

## STATUS DA FASE

✅ **FASE 1 CONCLUÍDA**

---

## ARQUIVOS ALTERADOS

### Criados
1. `supabase/migrations/20260405000021_posts_territorial_constraints.sql`

---

## DIFF REAL

### Migration Completa

```sql
-- 1. FK: posts.location_id -> locations.id (ON DELETE RESTRICT)
ALTER TABLE posts
  ADD CONSTRAINT posts_location_id_fkey
  FOREIGN KEY (location_id)
  REFERENCES locations(id)
  ON DELETE RESTRICT;

-- 2. Trigger: Validação territorial (type e status)
CREATE OR REPLACE FUNCTION validate_post_location()
RETURNS TRIGGER AS $$
DECLARE
  loc_type TEXT;
  loc_status TEXT;
BEGIN
  IF NEW.location_id IS NOT NULL THEN
    SELECT type, status
      INTO loc_type, loc_status
    FROM locations
    WHERE id = NEW.location_id;
    
    IF loc_type IS NULL THEN
      RAISE EXCEPTION 'location_id inexistente';
    END IF;
    
    IF loc_type NOT IN ('city', 'district') THEN
      RAISE EXCEPTION 'Posts só podem ser criados em cidades ou bairros';
    END IF;
    
    IF loc_status <> 'active' THEN
      RAISE EXCEPTION 'Localização inativa';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_post_location_trigger ON posts;

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

-- 4. RLS Policies (multi-profile com EXISTS)
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

## EVIDÊNCIA OBJETIVA DE EXECUÇÃO

### 1. Migration Aplicada

```bash
$ npx supabase db query --linked -f supabase/migrations/20260405000021_posts_territorial_constraints.sql
Initialising login role...
Exit Code: 0
```

✅ **Validação**: Migration aplicada com sucesso

---

### 2. FK Criada

**Query**:
```sql
SELECT 
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_catalog.pg_constraint con
INNER JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'posts'
  AND con.conname = 'posts_location_id_fkey';
```

**Resultado**:
```
┌────────────────────────┬─────────────────┬──────────────────────────────────────────────────────┐
│    constraint_name     │ constraint_type │              constraint_definition                   │
├────────────────────────┼─────────────────┼──────────────────────────────────────────────────────┤
│ posts_location_id_fkey │ f               │ FOREIGN KEY (location_id) REFERENCES locations(id)   │
│                        │                 │ ON DELETE RESTRICT                                   │
└────────────────────────┴─────────────────┴──────────────────────────────────────────────────────┘
```

**Validações**:
- ✅ FK existe: `posts_location_id_fkey`
- ✅ Tipo: FOREIGN KEY (contype = 'f')
- ✅ Referência: `locations(id)`
- ✅ ON DELETE: RESTRICT (não SET NULL)

---

### 3. Trigger Criado

**Query**:
```sql
SELECT 
  tgname AS trigger_name,
  pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgname = 'validate_post_location_trigger'
  AND tgrelid = 'posts'::regclass;
```

**Resultado**:
```
┌────────────────────────────────┬──────────────────────────────────────────────────────────┐
│          trigger_name          │                   trigger_definition                     │
├────────────────────────────────┼──────────────────────────────────────────────────────────┤
│ validate_post_location_trigger │ CREATE TRIGGER validate_post_location_trigger            │
│                                │ BEFORE INSERT OR UPDATE ON public.posts                  │
│                                │ FOR EACH ROW                                             │
│                                │ EXECUTE FUNCTION validate_post_location()                │
└────────────────────────────────┴──────────────────────────────────────────────────────────┘
```

**Validações**:
- ✅ Trigger existe: `validate_post_location_trigger`
- ✅ Timing: BEFORE INSERT OR UPDATE
- ✅ Level: FOR EACH ROW
- ✅ Function: `validate_post_location()`

**Função do Trigger**:
- Valida existência da location (loc_type IS NULL)
- Valida type IN ('city', 'district')
- Valida status = 'active'

---

### 4. RLS Policies Criadas

**Query**:
```sql
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'posts'
ORDER BY policyname;
```

**Resultado**:
```
┌──────────────────────┬────────┬──────────────────────┐
│     policyname       │  cmd   │        roles         │
├──────────────────────┼────────┼──────────────────────┤
│ posts_create         │ INSERT │ {authenticated}      │
│ posts_delete_own     │ DELETE │ {authenticated}      │
│ posts_read_own       │ SELECT │ {authenticated}      │
│ posts_read_published │ SELECT │ {anon,authenticated} │
│ posts_update_own     │ UPDATE │ {authenticated}      │
└──────────────────────┴────────┴──────────────────────┘
```

**Validações**:
- ✅ 5 policies criadas
- ✅ `posts_read_published`: SELECT para anon e authenticated
- ✅ `posts_read_own`: SELECT para authenticated (multi-profile)
- ✅ `posts_create`: INSERT para authenticated (requer location_id)
- ✅ `posts_update_own`: UPDATE para authenticated (multi-profile)
- ✅ `posts_delete_own`: DELETE para authenticated (multi-profile)

**Detalhes das Policies Multi-Profile**:

Todas as policies de ownership usam EXISTS com:
```sql
EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = posts.author_profile_id 
    AND profiles.user_id = auth.uid()
)
```

✅ **Validação**: Suporta multi-profile corretamente

---

### 5. Índices Territoriais Criados

**Query**:
```sql
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'posts'
  AND (indexname LIKE '%location%' OR indexname LIKE '%reach%')
ORDER BY indexname;
```

**Resultado**:
```
┌────────────────────────────┬──────────────────────────────────────────────────────────┐
│         indexname          │                        indexdef                          │
├────────────────────────────┼──────────────────────────────────────────────────────────┤
│ idx_posts_location_created │ CREATE INDEX idx_posts_location_created ON public.posts  │
│                            │ USING btree (location_id, created_at DESC)               │
│                            │ WHERE ((location_id IS NOT NULL)                         │
│                            │   AND (is_published = true))                             │
├────────────────────────────┼──────────────────────────────────────────────────────────┤
│ idx_posts_location_id      │ CREATE INDEX idx_posts_location_id ON public.posts       │
│                            │ USING btree (location_id)                                │
│                            │ WHERE (location_id IS NOT NULL)                          │
├────────────────────────────┼──────────────────────────────────────────────────────────┤
│ idx_posts_location_reach   │ CREATE INDEX idx_posts_location_reach ON public.posts    │
│                            │ USING btree (location_id, reach)                         │
│                            │ WHERE (location_id IS NOT NULL)                          │
├────────────────────────────┼──────────────────────────────────────────────────────────┤
│ idx_posts_reach            │ CREATE INDEX idx_posts_reach ON public.posts             │
│                            │ USING btree (reach)                                      │
│                            │ WHERE (reach IS NOT NULL)                                │
└────────────────────────────┴──────────────────────────────────────────────────────────┘
```

**Validações**:
- ✅ `idx_posts_location_created`: Para feed territorial ordenado (location_id + created_at DESC)
- ✅ `idx_posts_location_id`: Índice base de location_id (já existia)
- ✅ `idx_posts_location_reach`: Para filtros territoriais com reach
- ✅ `idx_posts_reach`: Para filtros por reach (Fase 0)

---

## PROBLEMAS ENCONTRADOS

Nenhum. Migration aplicada com sucesso sem erros.

---

## DIVISÃO DE RESPONSABILIDADES

| Camada | Responsabilidade |
|--------|------------------|
| **FK** | Garante que location_id existe em locations |
| **Trigger** | Valida type (city/district) e status (active) |
| **NOT NULL** | Será aplicado na Fase 4 (após migração do código) |
| **RLS** | Garante que usuário só acessa posts próprios (multi-profile) |

---

## CHECKLIST DA FASE 1

- [x] FK `posts_location_id_fkey` criada (ON DELETE RESTRICT)
- [x] Trigger `validate_post_location_trigger` criado
- [x] Função `validate_post_location()` criada (sintaxe PL/pgSQL correta)
- [x] Validação de existência (loc_type IS NULL)
- [x] Validação de type (city/district)
- [x] Validação de status (active)
- [x] Índice `idx_posts_location_created` criado
- [x] Índice `idx_posts_location_reach` criado
- [x] RLS policies antigas removidas
- [x] 5 RLS policies novas criadas (multi-profile com EXISTS)
- [x] Migration aplicada no banco linked
- [x] Evidências objetivas fornecidas
- [x] NOT NULL NÃO aplicado (será na Fase 4)
- [x] Colunas legadas NÃO removidas (será depois)
- [x] community_posts NÃO removida (será depois)

---

## PRÓXIMO PASSO

✅ **Fase 1 concluída**

**Próxima Fase**: Fase 2 - Service Layer
- Refatorar PostService.ts
- createPost() exigir location_id
- Rejeitar grupo territorial
- SELECT com JOIN em locations
- getFeed() com expansão territorial
- Redirecionar funções legadas
- Remover `supabase as any`

---

**Responsável**: Kiro AI  
**Data**: 2026-04-05
