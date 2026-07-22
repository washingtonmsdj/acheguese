# Migrations do Banco de Dados

## 📋 Visão Geral

Este documento mantém o histórico completo de todas as migrations executadas no banco de dados.

## 🗂️ Localização

```
supabase/migrations/
└── YYYYMMDD_description.sql
```

## 📊 Histórico de Migrations

### 2026-03-19: Adicionar author_profile_id à tabela posts

**Arquivo**: `20260319_add_author_profile_id_to_posts.sql`

**Status**: ✅ Executada

**Descrição**: Adiciona coluna `author_profile_id` à tabela posts seguindo o padrão SSOT oficial (User vs Profile vs Author).

**Mudanças**:
```sql
-- 1. Adicionar coluna
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS author_profile_id UUID;

-- 2. Foreign key
ALTER TABLE posts
ADD CONSTRAINT fk_posts_author_profile
FOREIGN KEY (author_profile_id)
REFERENCES profiles(id)
ON DELETE SET NULL;

-- 3. Índice
CREATE INDEX IF NOT EXISTS idx_posts_author_profile_id 
ON posts(author_profile_id);

-- 4. Comentário
COMMENT ON COLUMN posts.author_profile_id IS 
'Profile ID do autor do post. Segue padrão SSOT.';
```

**Impacto**:
- ✅ Código TypeScript atualizado
- ✅ Services atualizados (PostService, FeedService)
- ✅ Types atualizados
- ✅ Queries atualizadas

**Rollback** (se necessário):
```sql
ALTER TABLE posts DROP COLUMN IF EXISTS author_profile_id;
DROP INDEX IF EXISTS idx_posts_author_profile_id;
```

---

### 2026-03-19: Adicionar políticas RLS para tabela posts

**Arquivo**: `20260319_fix_rls_policies.sql`

**Status**: ✅ Executada

**Descrição**: Habilita Row Level Security (RLS) e cria políticas de acesso para a tabela posts.

**Mudanças**:
```sql
-- 1. Habilitar RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 2. Política SELECT (público)
CREATE POLICY "Anyone can view posts"
ON posts FOR SELECT
USING (true);

-- 3. Política INSERT (autenticado com próprio profile)
CREATE POLICY "Authenticated users can create posts with own profile"
ON posts FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND author_profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- 4. Política UPDATE (apenas próprios posts)
CREATE POLICY "Users can update own posts"
ON posts FOR UPDATE
USING (
  author_profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  author_profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- 5. Política DELETE (apenas próprios posts)
CREATE POLICY "Users can delete own posts"
ON posts FOR DELETE
USING (
  author_profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);
```

**Impacto**:
- ✅ RLS habilitado na tabela posts
- ✅ 4 políticas criadas
- ✅ Frontend consegue acessar posts (erros 400 resolvidos)
- ✅ Segurança: Usuários só podem modificar seus próprios posts

**Rollback** (se necessário):
```sql
DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
DROP POLICY IF EXISTS "Authenticated users can create posts with own profile" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
```

---

## Como Executar Migrations

### Regra vigente: remoto versionado

O projeto usa Supabase remoto como banco de desenvolvimento e validacao. O ambiente local do Supabase CLI nao e requisito para validar ou aplicar migrations neste repositorio.

Regras:

- `supabase/migrations/` continua sendo a fonte versionada do schema.
- Nao executar `supabase db push` sem `--linked`.
- Nao executar `supabase db push --linked` automaticamente quando houver drift local/remoto; revisar `supabase migration list --linked` primeiro.
- Preferir pipeline/revisao de migration ou dry-run antes de aplicar no remoto.
- Nunca colar SQL manualmente no dashboard quando existir migration versionada, exceto incidente operacional documentado.

### Metodo 1: Supabase CLI remoto

```bash
# Login
supabase login

# Link ao projeto remoto, se necessario
supabase link --project-ref seu-projeto-id

# Conferir drift local/remoto antes de qualquer push
supabase migration list --linked
npm run validate:migrations:remote

# Validar impacto sem aplicar
supabase db push --linked --dry-run

# Aplicar somente apos revisao do plano e ausencia de drift inesperado
supabase db push --linked
```

### Metodo 2: Supabase Dashboard

Use o SQL Editor apenas para incidente operacional ou investigacao pontual. Depois, registre a mudanca como migration para manter o repositorio como SSOT.

### Metodo 3: Script Automatizado

```bash
# Executar via script Node.js
node scripts/execute-migration.mjs nome-da-migration.sql
```

## ✅ Checklist de Migration

Antes de executar:

- [ ] Backup do banco remoto criado ou estrategia de rollback definida
- [ ] `npm run validate:migrations` executado
- [ ] `npm run validate:migrations:remote` executado quando houver acesso ao projeto remoto linkado
- [ ] `npm run validate:security-authority` executado para validar regras da Security Authority
- [ ] `supabase migration list --linked` revisado
- [ ] `supabase db push --linked --dry-run` revisado quando aplicavel
- [ ] `npm run verify:deploy` executado antes de promover release
- [ ] Codigo atualizado para nova estrutura
- [ ] Types TypeScript atualizados
- [ ] Testes passando
- [ ] Documentacao atualizada
- [ ] Rollback plan definido

Após executar:

- [ ] Migration executada com sucesso
- [ ] Dados verificados
- [ ] Aplicação testada
- [ ] Performance verificada
- [ ] Histórico atualizado neste documento

## 🔄 Processo de Migration

### 1. Planejamento

```markdown
## Migration: [Nome]
**Data**: YYYY-MM-DD
**Autor**: Nome

### Objetivo
Descrição do que será feito

### Impacto
- Tabelas afetadas
- Downtime esperado
- Código que precisa atualização

### Riscos
- Risco 1
- Risco 2

### Rollback
Como reverter se necessário
```

### 2. Desenvolvimento

```sql
-- Migration: [Nome]
-- Data: YYYY-MM-DD
-- Descrição: [Descrição detalhada]

-- Validações
DO $$
BEGIN
  -- Verificar se já foi executada
  IF EXISTS (SELECT 1 FROM ...) THEN
    RAISE NOTICE 'Migration já executada';
    RETURN;
  END IF;
END $$;

-- Mudanças
ALTER TABLE ...;
CREATE INDEX ...;

-- Comentários
COMMENT ON ...;
```

### 3. Validacao Local Estatica

```bash
npm run validate:migrations
npm run typecheck:app
npm run validate:ssot
```

### 4. Execucao no Remoto

```bash
# Conferir estado remoto
supabase migration list --linked

# Simular aplicacao
supabase db push --linked --dry-run

# Aplicar apos revisao
supabase db push --linked
```
### 5. Validação

```bash
# Testar aplicação
npm run test

# Verificar performance
npm run test:performance

# Monitorar logs
supabase logs
```

## 📝 Template de Migration

```sql
-- Migration: [NOME_DESCRITIVO]
-- Data: YYYY-MM-DD
-- Autor: [SEU_NOME]
-- Descrição: [DESCRIÇÃO_DETALHADA]

-- ============================================================================
-- VALIDAÇÕES
-- ============================================================================

-- Verificar se migration já foi executada
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sua_tabela' 
    AND column_name = 'sua_coluna'
  ) THEN
    RAISE NOTICE 'Migration já executada anteriormente';
    RETURN;
  END IF;
END $$;

-- ============================================================================
-- MUDANÇAS
-- ============================================================================

-- 1. Adicionar coluna
ALTER TABLE sua_tabela 
ADD COLUMN IF NOT EXISTS sua_coluna TYPE;

-- 2. Criar foreign key
ALTER TABLE sua_tabela
ADD CONSTRAINT fk_nome
FOREIGN KEY (coluna)
REFERENCES outra_tabela(id)
ON DELETE CASCADE;

-- 3. Criar índice
CREATE INDEX IF NOT EXISTS idx_nome 
ON sua_tabela(coluna);

-- 4. Adicionar comentário
COMMENT ON COLUMN sua_tabela.sua_coluna IS 
'Descrição da coluna e seu propósito';

-- ============================================================================
-- DADOS (se necessário)
-- ============================================================================

-- Migrar dados existentes
UPDATE sua_tabela SET ...;

-- ============================================================================
-- VALIDAÇÕES FINAIS
-- ============================================================================

-- Verificar integridade
DO $$
BEGIN
  -- Suas validações
END $$;
```

## 🔧 Troubleshooting

### Erro: Column already exists

```sql
-- Usar IF NOT EXISTS
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS author_profile_id UUID;
```

### Erro: Foreign key violation

```sql
-- Verificar dados órfãos antes
SELECT * FROM posts 
WHERE author_profile_id NOT IN (SELECT id FROM profiles);

-- Limpar ou corrigir
UPDATE posts SET author_profile_id = NULL 
WHERE author_profile_id NOT IN (SELECT id FROM profiles);
```

### Erro: Index already exists

```sql
-- Usar IF NOT EXISTS
CREATE INDEX IF NOT EXISTS idx_nome ON tabela(coluna);
```

### Schema Cache Desatualizado

```bash
# Aguardar alguns segundos
sleep 5

# Ou forçar refresh
SELECT pg_reload_conf();
```

## 📊 Monitoramento

### Verificar Migrations Aplicadas

```sql
-- Listar todas as colunas de uma tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'posts'
ORDER BY ordinal_position;

-- Listar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'posts';

-- Listar foreign keys
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE contype = 'f' AND conrelid = 'posts'::regclass;
```

### Performance

```sql
-- Verificar uso de índices
EXPLAIN ANALYZE
SELECT * FROM posts WHERE author_profile_id = 'uuid';

-- Estatísticas de tabela
SELECT * FROM pg_stat_user_tables WHERE relname = 'posts';
```

## 🔐 Segurança

### Backup Antes de Migration

```bash
# Backup completo
supabase db dump > backup-$(date +%Y%m%d-%H%M%S).sql

# Backup de tabela específica
supabase db dump --table posts > backup-posts.sql
```

### Restore se Necessário

```bash
# Restore completo
supabase db restore backup-20260319.sql

# Restore de tabela
psql -h db.xxx.supabase.co -U postgres -d postgres < backup-posts.sql
```

## 📚 Referências

- [Supabase Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)

## 📋 Próximas Migrations Planejadas

Nenhuma migration planejada no momento.

Para propor nova migration, abra issue no repositório.

---

**Última atualização**: 2026-03-19  
**Versão**: 1.0.0  
**Mantido por**: Equipe de Backend

### 2026-03-19: Adicionar colunas faltantes à tabela posts

**Arquivo**: `20260319_add_missing_columns_to_posts.sql`

**Status**: ✅ Executada

**Descrição**: Adiciona todas as colunas necessárias que estavam faltando na tabela posts.

**Problema Identificado**: 
- Código tentava filtrar por `city` e `neighborhood`
- Tabela tinha apenas 5 colunas básicas
- Erro: "column posts.city does not exist"

**Colunas Adicionadas**:
- Localização: `city`, `neighborhood`, `street`, `latitude`, `longitude`
- Conteúdo: `content`, `type`, `video_url`
- Métricas: `likes_count`, `comments_count`, `shares_count`, `views_count`
- Status: `status`, `visibility`, `is_pinned`, `is_featured`
- Timestamps: `updated_at`, `deleted_at`, `published_at`

**Índices Criados**:
- `idx_posts_city`
- `idx_posts_neighborhood`
- `idx_posts_city_neighborhood`
- `idx_posts_type`
- `idx_posts_status`
- `idx_posts_published_at`

**Impacto**:
- ✅ 18 colunas adicionadas
- ✅ 6 índices criados
- ✅ Filtros de localização funcionando
- ✅ Erros 400 resolvidos definitivamente
- ✅ Sistema 100% funcional

---
