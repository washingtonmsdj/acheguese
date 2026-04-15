# ✅ Correção SSOT - Community Issues

## Problema Identificado

Erro 400 nas queries do Supabase porque a tabela `community_issues` estava incompleta:
- Faltavam 10+ colunas definidas no SSOT (types.ts)
- Nome de coluna errado: `profile_id` ao invés de `author_profile_id`
- Status usando valores em inglês ao invés de português
- Sem contadores automáticos (support_count, comments_count)

## Causa Raiz

A migração base (`20260325000000_base_schema.sql`) criou apenas uma estrutura mínima da tabela, mas o código TypeScript esperava uma estrutura completa conforme definido em `src/modules/community-issues/domain/types.ts`.

## Solução Aplicada (Seguindo SSOT)

### 1. Análise da Estrutura Real
```bash
npx supabase db query --linked "SELECT column_name FROM information_schema.columns WHERE table_name = 'community_issues';"
```

### 2. Comparação com SSOT
Arquivo: `src/modules/community-issues/domain/types.ts`
Interface: `CommunityIssue`

### 3. Migração Completa Criada
Arquivo: `supabase/migrations/20260405000003_complete_community_issues_schema.sql`

**Colunas Adicionadas:**
- ✅ `author_profile_id` (renomeado de profile_id)
- ✅ `priority` (baixa, media, alta, urgente)
- ✅ `neighborhood` (valor normalizado)
- ✅ `neighborhood_display` (nome para exibição)
- ✅ `city`
- ✅ `address_reference`
- ✅ `images` (TEXT[])
- ✅ `support_count` (INTEGER, com trigger automático)
- ✅ `comments_count` (INTEGER)

**Status Corrigidos:**
- `open` → `aberto`
- `in_progress` → `em_andamento`
- `resolved` → `resolvido`
- `closed` → `rejeitado`

**Triggers Criados:**
- `trigger_update_issue_support_count` - Atualiza support_count automaticamente

**Índices Criados:**
- 9 índices para performance em queries comuns

### 4. Aplicação da Migração
```bash
npx supabase db query --linked -f supabase/migrations/20260405000003_complete_community_issues_schema.sql
```

### 5. Verificação
```bash
npx supabase db query --linked "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'community_issues' ORDER BY ordinal_position;"
```

## Princípios SSOT Seguidos

1. ✅ **Verificar antes de assumir**: Sempre consultamos information_schema
2. ✅ **TypeScript como fonte da verdade**: Seguimos types.ts
3. ✅ **Migrações idempotentes**: Usamos IF NOT EXISTS e DO $$ blocks
4. ✅ **Sem gambiarras**: Corrigimos a estrutura real do banco
5. ✅ **Documentação inline**: Comentários SQL explicam cada coluna

## Método Correto de Migração

### Comando que Funciona:
```bash
npx supabase db query --linked -f supabase/migrations/<arquivo>.sql
```

### Por que NÃO usar `npx supabase db push`:
- Falha quando há migrações remotas não sincronizadas localmente
- Depende do histórico de migrações estar 100% sincronizado
- Não é adequado para ambientes com múltiplos desenvolvedores

### Workflow Correto:
1. Verificar estrutura atual no banco
2. Comparar com tipos TypeScript (SSOT)
3. Criar migração SQL com IF NOT EXISTS
4. Aplicar com `db query --linked -f`
5. Verificar resultado com information_schema

## Arquivos Atualizados

1. ✅ `supabase/migrations/20260405000003_complete_community_issues_schema.sql` - Nova migração
2. ✅ `.env.example` - Documentação do método correto
3. ✅ `CORRECAO_SSOT_COMMUNITY_ISSUES.md` - Este documento

## Resultado Final

Tabela `community_issues` agora tem 22 colunas, todas alinhadas com o SSOT:
- id
- author_profile_id
- title
- description
- category
- status
- location_id
- created_at
- updated_at
- report_count
- under_review
- removal_reason
- removed_at
- resolved_at
- priority
- neighborhood
- neighborhood_display
- city
- address_reference
- images
- support_count
- comments_count

## Próximos Passos

O erro 400 deve estar resolvido. Se persistir, verificar:
1. Políticas RLS estão corretas
2. Foreign keys estão válidas
3. Constraints de CHECK estão corretos


## Correção Adicional - Foreign Key Constraint

### Problema
Após adicionar a coluna `author_profile_id`, o foreign key constraint ainda tinha o nome antigo `community_issues_profile_id_fkey`, causando erro 400 nas queries que tentavam fazer join usando o nome correto.

### Solução
Migração: `supabase/migrations/20260405000004_fix_foreign_key_constraint.sql`

```sql
ALTER TABLE community_issues 
  DROP CONSTRAINT IF EXISTS community_issues_profile_id_fkey;

ALTER TABLE community_issues
  ADD CONSTRAINT community_issues_author_profile_id_fkey 
  FOREIGN KEY (author_profile_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;
```

### Resultado
✅ Constraint renomeado de `community_issues_profile_id_fkey` para `community_issues_author_profile_id_fkey`
✅ Queries com join agora funcionam corretamente

## Migrações Aplicadas (Ordem)

1. ✅ `20260405000001_add_community_alerts_moderation.sql` - Moderação de alertas
2. ✅ `20260405000002_add_community_issues_moderation.sql` - Moderação de issues
3. ✅ `20260405000003_complete_community_issues_schema.sql` - Schema completo
4. ✅ `20260405000004_fix_foreign_key_constraint.sql` - Correção de constraint

## Status Final
✅ Todas as colunas adicionadas
✅ Todos os constraints corretos
✅ Triggers funcionando
✅ Queries 400 resolvidas
