# Correção Community Q&A - Estrutura de Tabelas

## ❌ Problema Identificado

O erro `404 (Not Found)` ocorria porque o código estava tentando acessar tabelas que não existem:

```
GET https://xhdowzacfujckjelqhtd.supabase.co/rest/v1/community_questions 404 (Not Found)
```

**Erro:** `Could not find the table 'public.community_questions' in the schema cache`  
**Sugestão do Supabase:** `Perhaps you meant the table 'public.community_posts'`

### Tabelas Inexistentes
- ❌ `community_questions` → não existe
- ❌ `community_answers` → não existe  
- ❌ `answer_likes` → não existe

### Tabelas Corretas
- ✅ `community_posts` (com campo `type` para diferenciar posts de perguntas)
- ✅ `comments` (para respostas vinculadas via `post_id`)

## ✅ Solução Implementada

### 1. Migration Criada

**Arquivo:** `supabase/migrations/20240103000000_fix_community_qa_structure.sql`

A migration adiciona os campos necessários às tabelas existentes:

**Em `community_posts`:**
- `title` - Título da pergunta
- `description` - Descrição detalhada
- `category` - Categoria da pergunta
- `resolved` - Se foi resolvida
- `answers_count` - Contador de respostas

**Em `comments`:**
- `is_best_answer` - Marca a melhor resposta
- `professional_id` - ID do profissional mencionado
- `business_id` - ID do negócio mencionado

**Funções e Triggers:**
- `update_answers_count()` - Trigger para atualizar contador automaticamente
- `mark_best_answer()` - Função RPC para marcar melhor resposta
- Índices para melhor performance

### 2. Serviço Corrigido

**Arquivo:** `src/core/community/services/CommunityQAService.ts`

Todas as queries foram atualizadas para usar as tabelas corretas:

**Antes:**
```typescript
.from("community_questions")
.from("community_answers")
.from("answer_likes")
```

**Depois:**
```typescript
.from("community_posts").eq("type", "question")
.from("comments")
// likes_count já existe em comments
```

### 3. Mapeamento de Campos

| Campo Antigo | Campo Novo | Tabela | Observação |
|-------------|-----------|---------|------------|
| `autor_id` | `author_profile_id` | community_posts | Nome padronizado |
| `title` | `title` | community_posts | Mantido |
| `respostas_count` | `answers_count` | community_posts | Nome mais claro |
| `question_id` | `post_id` | comments | Vincula à pergunta |
| `texto` | `content` | comments | Nome padronizado |
| `curtidas` | `likes_count` | comments | Nome padronizado |
| `melhor_resposta` | `is_best_answer` | comments | Nome mais claro |
| `autor_id` | `author_profile_id` | comments | Nome padronizado |

## 🚀 Como Aplicar a Correção

### Passo 1: Aplicar a Migration

#### Opção A: Supabase Dashboard (Recomendado)

1. Acesse: https://xhdowzacfujckjelqhtd.supabase.co
2. Vá em: **SQL Editor** > **New Query**
3. Cole o conteúdo completo de: `supabase/migrations/20240103000000_fix_community_qa_structure.sql`
4. Clique em **Run**
5. Verifique se não há erros no console

#### Opção B: Supabase CLI

```bash
supabase db push
```

### Passo 2: Verificar a Aplicação

Após aplicar a migration, verifique se as colunas foram criadas:

```sql
-- Verificar community_posts
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'community_posts' 
  AND column_name IN ('title', 'description', 'category', 'resolved', 'answers_count');

-- Verificar comments
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'comments' 
  AND column_name IN ('is_best_answer', 'professional_id', 'business_id');
```

### Passo 3: Testar a Aplicação

1. Recarregue a aplicação no navegador
2. Acesse a página de Recomendações/Q&A
3. Verifique se o erro 404 foi resolvido
4. Teste criar uma pergunta
5. Teste responder uma pergunta

## ✨ Funcionalidades Implementadas

✅ Perguntas armazenadas em `community_posts` com `type = 'question'`  
✅ Respostas armazenadas em `comments` vinculadas via `post_id`  
✅ Contador automático de respostas via trigger  
✅ Função RPC `mark_best_answer()` para marcar melhor resposta  
✅ Suporte a menções de profissionais e negócios  
✅ Sistema de likes usando `likes_count` em comments  
✅ Filtros por categoria  
✅ Paginação infinita  
✅ Busca por título e descrição  

## 📝 Arquivos Modificados

### Criados
- ✅ `supabase/migrations/20240103000000_fix_community_qa_structure.sql`
- ✅ `CORRECAO_COMMUNITY_QA_APLICADA.md` (este arquivo)

### Modificados
- ✅ `src/core/community/services/CommunityQAService.ts` - Todas as queries corrigidas
- ✅ `scripts/apply-migration.mjs` - Suporte a argumentos e variável VITE_SUPABASE_SERVICE_ROLE_KEY

### Não Modificados (já estavam corretos)
- ✅ `src/modules/community/hooks/useRecomendacoes.ts` - Já usa CommunityQAService
- ✅ `src/core/community/qa-types.ts` - Tipos permanecem compatíveis

## 🔍 Detalhes Técnicos

### Estrutura de Perguntas

```typescript
// Pergunta em community_posts
{
  id: UUID,
  type: 'question',
  author_profile_id: UUID,
  title: string,
  description: string,
  category: string,
  resolved: boolean,
  answers_count: number,
  created_at: timestamp
}
```

### Estrutura de Respostas

```typescript
// Resposta em comments
{
  id: UUID,
  post_id: UUID, // ID da pergunta
  author_profile_id: UUID,
  content: string,
  is_best_answer: boolean,
  likes_count: number,
  professional_id: UUID | null,
  business_id: UUID | null,
  created_at: timestamp
}
```

## 🎯 Próximos Passos (Opcional)

1. **Sistema de Likes Individual:** Criar tabela `comment_likes` para rastrear quem curtiu cada resposta
2. **Notificações:** Implementar notificações quando alguém responde uma pergunta
3. **Gamificação:** Adicionar pontos para quem tem respostas marcadas como melhores
4. **Moderação:** Sistema para reportar perguntas/respostas inadequadas

## 🐛 Troubleshooting

### Erro: "Column already exists"
Se você já aplicou parte da migration antes, pode ignorar erros de colunas duplicadas. O `IF NOT EXISTS` protege contra isso.

### Erro: "Function mark_best_answer already exists"
Use `CREATE OR REPLACE FUNCTION` (já está na migration).

### Erro: "Trigger already exists"
Use `DROP TRIGGER IF EXISTS` antes de criar (já está na migration).

### Ainda vejo erro 404
1. Verifique se a migration foi aplicada com sucesso
2. Limpe o cache do navegador (Ctrl+Shift+R)
3. Verifique se as colunas existem no Supabase Dashboard
4. Verifique os logs do console para outros erros

## 📊 Status da Correção

- ✅ Problema identificado
- ✅ Migration criada
- ✅ Serviço corrigido
- ✅ Scripts atualizados
- ⏳ **Aguardando aplicação da migration no Supabase**
- ⏳ Teste em produção

---

**Data:** 2026-03-31  
**Versão:** 1.0.0  
**Autor:** Kiro AI

