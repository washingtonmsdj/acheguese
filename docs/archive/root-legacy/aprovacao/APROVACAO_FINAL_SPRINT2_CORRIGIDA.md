# APROVAÇÃO FINAL - SPRINT 2 POSTS (CORRIGIDA)

**Data**: 2026-04-05  
**Status**: ✅ PRONTO PARA APROVAÇÃO  
**Estimativa**: 40h-45h (5-6 dias úteis)

---

## BLOQUEIO CRÍTICO RESOLVIDO

### Problema Identificado
❌ Plano estava assumindo colunas inexistentes no banco

### Correções Aplicadas
✅ Schema real documentado (`SCHEMA_FINAL_POSTS.md`)  
✅ Colunas inexistentes identificadas (reach, status)  
✅ Migrations explícitas para criar colunas  
✅ RLS policies corrigidas (profiles.user_id = auth.uid())  
✅ community_posts removida APÓS código não depender  
✅ Semântica de reach formalizada  
✅ Services reescritos baseados em schema real  
✅ Seeds reescritos baseados em schema real  
✅ Testes reescritos baseados em schema real  

---

## SCHEMA REAL (ATUAL)

### Tabela posts - Colunas Existentes

```sql
-- Identificação
id                UUID PRIMARY KEY

-- Autoria (DUPLICADO)
autor_id          UUID (LEGADO - será ignorado)
author_profile_id UUID NOT NULL (CANÔNICO)

-- Conteúdo (DUPLICADO)
texto             TEXT (LEGADO - será ignorado)
content           TEXT (CANÔNICO)
type              TEXT NOT NULL

-- Mídia
image_url         TEXT
video_url         TEXT
images            JSONB DEFAULT '[]'

-- Localização (DUPLICADO)
city              TEXT (LEGADO - será ignorado)
neighborhood      TEXT (LEGADO - será ignorado)
street            TEXT (LEGADO - será ignorado)
location_id       UUID (CANÔNICO - nullable)

-- Contadores
likes_count       INTEGER NOT NULL DEFAULT 0
comments_count    INTEGER NOT NULL DEFAULT 0

-- Extras
tags              JSONB DEFAULT '[]'
confirmations_count INTEGER NOT NULL DEFAULT 0
is_verified       BOOLEAN NOT NULL DEFAULT false
is_published      BOOLEAN NOT NULL DEFAULT true

-- Auditoria
created_at        TIMESTAMPTZ NOT NULL
updated_at        TIMESTAMPTZ NOT NULL
```

### Colunas que NÃO Existem (Precisam Ser Criadas)

❌ **reach** - Será criada na Fase 0  
❌ **status** - Não necessária (usar is_published)

---

## SEMÂNTICA DE reach

### Definição Formal

**reach** é um metadado de visibilidade/alcance do post.  
**NÃO afeta filtros territoriais** (que usam location_id).

### Valores Permitidos

- `street`: Escopo muito local (ex: "Buraco na minha rua")
- `neighborhood`: Escopo de bairro (padrão)
- `city`: Escopo de cidade (ex: "Evento para toda Salvador")

### Comportamento

**Filtros Territoriais** (usam location_id):
```
Usuário em Salvador (cidade):
  → vê posts com location_id = Salvador
  → vê posts com location_id = qualquer bairro de Salvador

Usuário em Barra (bairro):
  → vê posts com location_id = Barra
  → vê posts com location_id = Salvador (cidade-pai)
```

**reach NÃO afeta filtros**:
```
Post: location_id=Barra, reach=city
  → Aparece no feed da Barra (location_id)
  → reach=city é apenas informativo

Post: location_id=Salvador, reach=street
  → Aparece no feed de Salvador (location_id)
  → reach=street é apenas informativo
```

### Uso de reach

- UI: Badge visual ("📍 Rua", "🏘️ Bairro", "🏙️ Cidade")
- Ordenação: Posts de rua podem ter prioridade
- Notificações: Alertas de rua são mais urgentes
- Analytics: Métricas por tipo de alcance

---

## RLS POLICIES CORRIGIDAS

### Problema Original

❌ `auth.uid()` não pode ser comparado diretamente com `author_profile_id`
- `auth.uid()` retorna `user_id` (UUID do auth.users)
- `author_profile_id` referencia `profiles.id` (UUID do profiles)
- São UUIDs diferentes!

### Correção

✅ Fazer JOIN com profiles:
```sql
author_profile_id = (
  SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
)
```

### Policies Corrigidas

```sql
-- Leitura de posts publicados
CREATE POLICY posts_read_published ON posts
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

-- Leitura de posts próprios
CREATE POLICY posts_read_own ON posts
  FOR SELECT TO authenticated
  USING (author_profile_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
  ));

-- Criação (requer location_id)
CREATE POLICY posts_create ON posts
  FOR INSERT TO authenticated
  WITH CHECK (
    author_profile_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
    )
    AND location_id IS NOT NULL
  );

-- Atualização própria
CREATE POLICY posts_update_own ON posts
  FOR UPDATE TO authenticated
  USING (author_profile_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
  ))
  WITH CHECK (author_profile_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
  ));

-- Deleção própria
CREATE POLICY posts_delete_own ON posts
  FOR DELETE TO authenticated
  USING (author_profile_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
  ));
```

---

## DEPENDÊNCIAS DE community_posts

### Código que Depende

**Services**:
- `PostService.createCommunityPost()` - Linha 885
- `PostService.createCommunityPostWithValidation()` - Linha 2088

**Hooks**:
- `useCreatePost.ts` - Usa `createCommunityPostWithValidation()`

### Estratégia de Remoção

**Sprint 2 - Fase 2**: Redirecionar funções
```typescript
/** @deprecated Use createPost() instead */
async createCommunityPost(data) {
  console.warn('Deprecated, redirecting to createPost');
  return this.createPost(data);
}
```

**Pós-Sprint 2**: Remover tabela
```sql
-- Após código não depender mais
DROP TABLE IF EXISTS community_posts CASCADE;
```

---

## CRONOGRAMA CORRIGIDO

### Fase 0: Preparação (2h)
✅ Adicionar coluna reach  
✅ Criar índice GIN para textSearch  
❌ NÃO remover colunas legadas (código pode depender)  
❌ NÃO remover community_posts (código depende)

### Fase 1: Modelagem (5h)
✅ Função de validação de location_id  
✅ Trigger de validação  
✅ RLS policies corrigidas  
✅ Índices territoriais

### Fase 2: Service Layer (8h)
✅ createPost() com location_id obrigatório  
✅ Redirecionar createCommunityPost() → createPost()  
✅ getFeed() com expansão territorial  
✅ Logs estruturados  
✅ Remover funções legadas

### Fase 3: Formulários (7h)
✅ CreatePostModal com território ativo  
✅ useCreatePostForm com reach  
✅ UnifiedComposer com location_id

### Fase 4: Componentes (6h)
✅ UnifiedPostCard com location.name  
✅ CommunityFeed com SSOT  
✅ PostAdapter com location_id

### Fase 5: Testes (6h)
✅ 19 testes runtime  
✅ 8 testes E2E  
✅ Testes de regressão

### Fase 6: Seeds (2h)
✅ Seeds com schema real

### Fase 7: Documentação (2h)
✅ Arquitetura, guias

**Total**: 38h (buffer: 40h-45h)

---

## PÓS-SPRINT: LIMPEZA

### Após Sprint 2 (separado):

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

**Estimativa**: 2h (não incluído nos 40h-45h)

---

## VALIDAÇÃO FINAL

### Checklist de Correções

- [x] Schema real documentado (`SCHEMA_FINAL_POSTS.md`)
- [x] Colunas inexistentes identificadas
- [x] Migrations explícitas para criar reach
- [x] RLS policies corrigidas (JOIN com profiles)
- [x] community_posts removida APÓS código não depender
- [x] Semântica de reach formalizada
- [x] Services reescritos (schema real)
- [x] Seeds reescritos (schema real)
- [x] Testes reescritos (schema real)
- [x] Plano corrigido (`SPRINT2_POSTS_PLANO_CORRIGIDO.md`)

### Documentos Criados

1. ✅ `SCHEMA_FINAL_POSTS.md` - Schema real completo
2. ✅ `SPRINT2_POSTS_PLANO_CORRIGIDO.md` - Plano baseado em schema real
3. ✅ `APROVACAO_FINAL_SPRINT2_CORRIGIDA.md` - Este documento

---

## COMPARAÇÃO: ANTES vs DEPOIS

### Antes (Plano Incorreto)

❌ Assumia colunas inexistentes  
❌ RLS policies incorretas (auth.uid() direto)  
❌ Removia community_posts imediatamente  
❌ Semântica de reach não formalizada  
❌ Services baseados em schema presumido

### Depois (Plano Corrigido)

✅ Baseado em schema real do banco  
✅ RLS policies corretas (JOIN com profiles)  
✅ community_posts removida APÓS código não depender  
✅ Semântica de reach formalizada  
✅ Services baseados em schema real

---

## PRÓXIMOS PASSOS

### Após Aprovação:

1. ⏳ Criar branch `sprint2-posts-ssot`
2. ⏳ Iniciar Fase 0: Preparação Estrutural
3. ⏳ Seguir `SPRINT2_POSTS_PLANO_CORRIGIDO.md`
4. ⏳ Reportar progresso diário
5. ⏳ Executar gates de qualidade

---

## CONCLUSÃO

Sprint 2 está **pronto para aprovação** com todas as correções aplicadas:

✅ **Schema real**: Documentado e validado  
✅ **Migrations explícitas**: Para criar colunas faltantes  
✅ **RLS corrigidas**: JOIN com profiles  
✅ **Dependências mapeadas**: community_posts removida depois  
✅ **Semântica formalizada**: reach como metadado  
✅ **Plano realista**: Baseado em schema real  

**Aguardando aprovação final para iniciar implementação.**

---

**Data**: 2026-04-05  
**Responsável**: Kiro AI  
**Status**: ✅ PRONTO PARA APROVAÇÃO (CORRIGIDO)
