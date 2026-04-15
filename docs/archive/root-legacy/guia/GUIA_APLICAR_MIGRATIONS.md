# 📚 Guia de Aplicação das Migrations

## 🎯 Objetivo

Aplicar as migrations necessárias para as funcionalidades de:
- Configurações de notificação
- Bloqueios de usuários
- Configurações de privacidade

---

## 📋 Migrations Criadas

### 1. `20260327000012_create_user_notification_settings.sql`
**Cria**: Tabela `user_notification_settings`

**Campos**:
- `user_id` (PK) - Referência ao usuário
- `email_notifications` - Notificações por email
- `push_notifications` - Notificações push
- `new_messages` - Notificar mensagens
- `new_comments` - Notificar comentários
- `new_likes` - Notificar curtidas
- `new_followers` - Notificar seguidores
- `business_updates` - Atualizações de empresas
- `community_updates` - Atualizações da comunidade
- `weekly_digest` - Resumo semanal

**RLS**: Usuários podem ver/editar apenas suas configurações

---

### 2. `20260327000013_create_user_blocks.sql`
**Cria**: Tabela `user_blocks`

**Campos**:
- `id` (PK) - UUID
- `blocker_user_id` - Quem bloqueou
- `blocked_user_id` - Quem foi bloqueado
- `reason` - Motivo (opcional)
- `created_at` - Data do bloqueio

**Constraints**:
- Unique(blocker_user_id, blocked_user_id)
- Check: Não pode bloquear a si mesmo

**Functions**:
- `is_user_blocked(user_id_1, user_id_2)` - Verifica bloqueio
- `is_mutually_blocked(user_id_1, user_id_2)` - Verifica bloqueio mútuo

**RLS**: Usuários podem ver/gerenciar apenas seus bloqueios

---

### 3. `20260327000014_add_privacy_fields_to_profiles.sql`
**Adiciona**: Campos de privacidade na tabela `profiles`

**Campos Adicionados**:
- `is_public` - Perfil público (default: true)
- `show_email` - Mostrar email (default: false)
- `show_phone` - Mostrar telefone (default: false)
- `show_location` - Mostrar localização (default: true)
- `allow_messages` - Permitir mensagens (default: true)
- `show_activity` - Mostrar atividade (default: true)
- `show_businesses` - Mostrar empresas (default: true)

**Índices**: Criados para otimizar queries de privacidade

---

## 🚀 OPÇÃO 1: Aplicar via Supabase CLI (Recomendado)

### Pré-requisitos
```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Fazer login
supabase login
```

### Aplicar Migrations
```bash
# Navegar para o diretório do projeto
cd /caminho/do/projeto

# Aplicar todas as migrations pendentes
supabase db push

# Ou aplicar migrations específicas
supabase db push --file supabase/migrations/20260327000012_create_user_notification_settings.sql
supabase db push --file supabase/migrations/20260327000013_create_user_blocks.sql
supabase db push --file supabase/migrations/20260327000014_add_privacy_fields_to_profiles.sql
```

---

## 🚀 OPÇÃO 2: Aplicar via Supabase Dashboard

### Passo a Passo

1. **Acessar o Dashboard**
   - Ir para: https://supabase.com/dashboard
   - Selecionar seu projeto
   - Ir para: SQL Editor

2. **Aplicar Migration 1**
   - Abrir arquivo: `supabase/migrations/20260327000012_create_user_notification_settings.sql`
   - Copiar todo o conteúdo
   - Colar no SQL Editor
   - Clicar em "Run"
   - Aguardar confirmação de sucesso

3. **Aplicar Migration 2**
   - Abrir arquivo: `supabase/migrations/20260327000013_create_user_blocks.sql`
   - Copiar todo o conteúdo
   - Colar no SQL Editor
   - Clicar em "Run"
   - Aguardar confirmação de sucesso

4. **Aplicar Migration 3**
   - Abrir arquivo: `supabase/migrations/20260327000014_add_privacy_fields_to_profiles.sql`
   - Copiar todo o conteúdo
   - Colar no SQL Editor
   - Clicar em "Run"
   - Aguardar confirmação de sucesso

---

## 🚀 OPÇÃO 3: Aplicar via Script (Experimental)

### Configurar Variáveis de Ambiente

Criar arquivo `.env.local` (se não existir):
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

### Executar Script
```bash
# Instalar dependências (se necessário)
npm install

# Executar script
npx tsx scripts/apply-privacy-migrations.ts
```

**Nota**: Esta opção pode não funcionar dependendo das permissões do Supabase.

---

## ✅ Verificar Aplicação

### 1. Verificar Tabelas Criadas

No Supabase Dashboard → Table Editor:
- ✅ `user_notification_settings` deve existir
- ✅ `user_blocks` deve existir

### 2. Verificar Campos Adicionados

No Supabase Dashboard → Table Editor → `profiles`:
- ✅ `is_public` deve existir
- ✅ `show_email` deve existir
- ✅ `show_phone` deve existir
- ✅ `show_location` deve existir
- ✅ `allow_messages` deve existir
- ✅ `show_activity` deve existir
- ✅ `show_businesses` deve existir

### 3. Verificar RLS

No Supabase Dashboard → Authentication → Policies:
- ✅ `user_notification_settings` deve ter 4 políticas
- ✅ `user_blocks` deve ter 4 políticas

### 4. Verificar Functions

No Supabase Dashboard → Database → Functions:
- ✅ `is_user_blocked` deve existir
- ✅ `is_mutually_blocked` deve existir

---

## 🧪 Testar Funcionalidades

### 1. Testar Configurações de Notificação

```typescript
// No app, ir para /perfil → Privacidade
// Alterar configurações de notificação
// Salvar
// Verificar se salvou no banco
```

### 2. Testar Bloqueios

```typescript
// No app, ir para /perfil → Privacidade
// Ver lista de usuários bloqueados
// Bloquear um usuário (se tiver função)
// Desbloquear um usuário
// Verificar se salvou no banco
```

### 3. Testar Privacidade

```typescript
// No app, ir para /perfil → Privacidade
// Alterar configurações de visibilidade
// Salvar
// Verificar se salvou no banco
```

---

## 🐛 Troubleshooting

### Erro: "relation already exists"
**Solução**: A tabela já existe. Pode ignorar ou deletar e recriar.

### Erro: "column already exists"
**Solução**: O campo já existe. Pode ignorar.

### Erro: "permission denied"
**Solução**: Usar SERVICE_ROLE_KEY ou aplicar via Dashboard.

### Erro: "syntax error"
**Solução**: Verificar se copiou o SQL completo, incluindo comentários.

---

## 📊 Dados de Teste (Opcional)

### Inserir Configurações de Teste

```sql
-- Inserir configurações padrão para um usuário
INSERT INTO public.user_notification_settings (
  user_id,
  email_notifications,
  push_notifications,
  new_messages,
  new_comments,
  new_likes,
  new_followers,
  business_updates,
  community_updates,
  weekly_digest
) VALUES (
  'seu-user-id-aqui',
  true,
  true,
  true,
  true,
  false,
  true,
  true,
  true,
  true
);
```

### Inserir Bloqueio de Teste

```sql
-- Inserir bloqueio de teste
INSERT INTO public.user_blocks (
  blocker_user_id,
  blocked_user_id,
  reason
) VALUES (
  'user-id-1',
  'user-id-2',
  'Teste de bloqueio'
);
```

---

## 📝 Checklist Final

- [ ] Migration 1 aplicada (user_notification_settings)
- [ ] Migration 2 aplicada (user_blocks)
- [ ] Migration 3 aplicada (privacy fields)
- [ ] Tabelas verificadas no Dashboard
- [ ] RLS verificado
- [ ] Functions verificadas
- [ ] App testado
- [ ] Configurações salvando corretamente
- [ ] Bloqueios funcionando
- [ ] Privacidade funcionando

---

## 🎉 Conclusão

Após aplicar todas as migrations e verificar que tudo está funcionando:

1. ✅ Configurações de notificação funcionais
2. ✅ Sistema de bloqueios funcional
3. ✅ Configurações de privacidade funcionais
4. ✅ Banco de dados pronto para produção

**O sistema está completo e pronto para uso!** 🚀

---

## 📞 Suporte

Se encontrar problemas:
1. Verificar logs do Supabase
2. Verificar console do navegador
3. Verificar network tab (requisições)
4. Consultar documentação do Supabase

---

**Criado em**: 27/03/2026  
**Versão**: 1.0.0  
**Status**: ✅ Pronto para uso

