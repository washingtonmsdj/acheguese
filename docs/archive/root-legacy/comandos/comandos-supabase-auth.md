# 🔧 Comandos Úteis - Supabase Auth (SSOT)

## 📋 Diagnóstico via CLI

### Verificar usuários existentes
```bash
npx supabase db query --linked "
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
"
```

### Verificar usuários não confirmados
```bash
npx supabase db query --linked "
SELECT 
  email,
  created_at
FROM auth.users
WHERE email_confirmed_at IS NULL
  AND deleted_at IS NULL;
"
```

### Verificar perfis associados
```bash
npx supabase db query --linked "
SELECT 
  u.email,
  p.name,
  p.profile_type,
  p.is_active
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE u.deleted_at IS NULL
ORDER BY u.created_at DESC
LIMIT 10;
"
```

## 🔧 Correções via CLI

### Confirmar email de um usuário
```bash
npx supabase db query --linked "
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'usuario@exemplo.com'
  AND email_confirmed_at IS NULL;
"
```

### Verificar se a confirmação funcionou
```bash
npx supabase db query --linked "
SELECT 
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Não confirmado'
    ELSE '✅ Confirmado'
  END as status
FROM auth.users
WHERE email = 'usuario@exemplo.com';
"
```

### Remover ban de um usuário
```bash
npx supabase db query --linked "
UPDATE auth.users
SET banned_until = NULL
WHERE email = 'usuario@exemplo.com';
"
```

## 📊 Estatísticas

### Contar usuários por status
```bash
npx supabase db query --linked "
SELECT 
  COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as confirmados,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NULL) as nao_confirmados,
  COUNT(*) FILTER (WHERE banned_until IS NOT NULL) as banidos,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deletados,
  COUNT(*) as total
FROM auth.users;
"
```

### Últimos logins
```bash
npx supabase db query --linked "
SELECT 
  email,
  last_sign_in_at,
  AGE(NOW(), last_sign_in_at) as tempo_desde_ultimo_login
FROM auth.users
WHERE last_sign_in_at IS NOT NULL
ORDER BY last_sign_in_at DESC
LIMIT 10;
"
```

## 🔍 Verificação de Configuração

### Verificar RLS (Row Level Security) em profiles
```bash
npx supabase db query --linked "
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';
"
```

### Verificar políticas RLS em profiles
```bash
npx supabase db query --linked "
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';
"
```

## 🚀 Comandos de Manutenção

### Limpar usuários não confirmados antigos (>30 dias)
```bash
npx supabase db query --linked "
-- CUIDADO: Isso deleta usuários permanentemente
-- Remova o comentário abaixo apenas se tiver certeza
-- DELETE FROM auth.users
-- WHERE email_confirmed_at IS NULL
--   AND created_at < NOW() - INTERVAL '30 days'
--   AND deleted_at IS NULL;

-- Para apenas visualizar quais seriam deletados:
SELECT 
  email,
  created_at,
  AGE(NOW(), created_at) as idade
FROM auth.users
WHERE email_confirmed_at IS NULL
  AND created_at < NOW() - INTERVAL '30 days'
  AND deleted_at IS NULL;
"
```

## 📝 Notas Importantes

1. **Sempre use `--linked`** para executar no banco remoto
2. **Teste queries com SELECT** antes de usar UPDATE/DELETE
3. **Faça backup** antes de operações destrutivas
4. **Verifique o resultado** após cada operação

## 🔗 Referências

- Documentação Supabase Auth: https://supabase.com/docs/guides/auth
- Schema auth.users: https://supabase.com/docs/guides/auth/managing-user-data
- Supabase CLI: https://supabase.com/docs/reference/cli/introduction
