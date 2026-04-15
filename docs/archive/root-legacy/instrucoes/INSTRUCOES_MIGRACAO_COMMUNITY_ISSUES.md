# Instruções para Aplicar Migração de Moderação - Community Issues

## Status
✅ Correção do Radix UI Select em AdminCommunityIssues.tsx - CONCLUÍDA
⏳ Migração SQL para community_issues - AGUARDANDO APLICAÇÃO MANUAL

## Arquivo de Migração
`supabase/migrations/20260405000002_add_community_issues_moderation.sql`

## Como Aplicar

1. Acesse o Supabase Dashboard
2. Vá em "SQL Editor"
3. Abra o arquivo `supabase/migrations/20260405000002_add_community_issues_moderation.sql`
4. Copie todo o conteúdo
5. Cole no SQL Editor
6. Execute (Run)

## O que a Migração Faz

### Colunas Adicionadas à `community_issues`:
- `report_count` - Contador de reports
- `under_review` - Flag de revisão administrativa
- `removal_reason` - Motivo da remoção
- `removed_at` - Data da remoção
- `resolved_at` - Data da resolução

### Tabelas Criadas:
- `community_issue_reports` - Reports de usuários
- `issue_blocked_terms` - Termos bloqueados para moderação
- `community_issue_audit` - Log de auditoria

### Funcionalidades:
- Trigger automático para atualizar `report_count`
- Quando um issue atinge 5 reports, `under_review` é marcado como TRUE
- Políticas RLS configuradas
- Índices para performance

## Após Aplicar

Execute no terminal para confirmar:
```bash
echo "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'community_issues' AND column_name IN ('report_count', 'under_review', 'removal_reason', 'removed_at', 'resolved_at');" | npx supabase db execute
```

## Correções Aplicadas

### AdminCommunityIssues.tsx
Substituído `value=""` por `value="all"` nos 3 componentes Select:
- Status Filter
- Category Filter  
- Priority Filter

Isso corrige o erro do Radix UI: "A <Select.Value /> with an empty string value is not supported"
