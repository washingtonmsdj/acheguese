# EVIDÊNCIA - FASE 0: PREPARAÇÃO ESTRUTURAL

**Data**: 2026-04-05  
**Status**: ✅ CONCLUÍDA  
**Tempo**: 30min  

---

## ARQUIVOS ALTERADOS

### Criados
1. `supabase/migrations/20260405000020_prepare_posts_ssot.sql`

---

## DIFF REAL

### Migration Criada

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

## EVIDÊNCIA OBJETIVA DE EXECUÇÃO

### 1. Migration Aplicada

```bash
$ npx supabase db query --linked -f supabase/migrations/20260405000020_prepare_posts_ssot.sql
Initialising login role...
Exit Code: 0
```

### 2. Coluna reach Criada

```
┌─────────────┬───────────┬─────────────┬──────────────────────┐
│ column_name │ data_type │ is_nullable │   column_default     │
├─────────────┼───────────┼─────────────┼──────────────────────┤
│ reach       │ text      │ YES         │ 'neighborhood'::text │
└─────────────┴───────────┴─────────────┴──────────────────────┘
```

**Validações**:
- ✅ Coluna reach existe
- ✅ Tipo: text
- ✅ Nullable: YES (reach é metadado, permanece nullable)
- ✅ Default: 'neighborhood'
- ✅ CHECK constraint: IN ('street', 'neighborhood', 'city')

**Nota**: reach é metadado de visibilidade com default 'neighborhood'. Quem vira NOT NULL na Fase 4 é location_id, não reach.

### 3. Índices Criados

```
┌──────────────────────────┬────────────────────────────────────────────────────────────┐
│        indexname         │                         indexdef                           │
├──────────────────────────┼────────────────────────────────────────────────────────────┤
│ idx_posts_content_search │ CREATE INDEX idx_posts_content_search ON public.posts      │
│                          │ USING gin (to_tsvector('portuguese'::regconfig, content))  │
├──────────────────────────┼────────────────────────────────────────────────────────────┤
│ idx_posts_reach          │ CREATE INDEX idx_posts_reach ON public.posts               │
│                          │ USING btree (reach) WHERE (reach IS NOT NULL)              │
└──────────────────────────┴────────────────────────────────────────────────────────────┘
```

**Validações**:
- ✅ idx_posts_content_search criado (GIN, full-text search em português)
- ✅ idx_posts_reach criado (BTREE, WHERE reach IS NOT NULL)

---

## PROBLEMAS ENCONTRADOS

Nenhum. Migration aplicada com sucesso.

---

## STATUS DA FASE

✅ **FASE 0 CONCLUÍDA**

**Checklist**:
- [x] Coluna reach adicionada
- [x] Índice GIN para textSearch criado
- [x] Índice para reach criado
- [x] Migration aplicada no banco linked
- [x] Validações executadas

**Próxima Fase**: Fase 1 - Modelagem Territorial

---

**Responsável**: Kiro AI  
**Data**: 2026-04-05
