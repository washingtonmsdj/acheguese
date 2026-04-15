# 💡 Exemplos Práticos - Autenticação

## 🎯 Casos de Uso Reais

Este documento contém exemplos práticos de situações reais e suas soluções.

---

## Caso 1: "Não consigo fazer login com meu email"

### Sintoma
```
Erro: Invalid login credentials
Status: 400
```

### Diagnóstico
```powershell
# Execute no PowerShell
.\diagnosticar-login.ps1
```

```sql
-- Execute no SQL Editor do Supabase
SELECT 
  email,
  email_confirmed_at,
  banned_until,
  deleted_at
FROM auth.users
WHERE email = 'seu-email@exemplo.com';
```

### Resultado Esperado
```
email                    | email_confirmed_at | banned_until | deleted_at
-------------------------|-------------------|--------------|------------
seu-email@exemplo.com    | NULL              | NULL         | NULL
```

### Problema Identificado
`email_confirmed_at` está NULL = email não confirmado

### Solução
```sql
-- Confirmar email manualmente
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'seu-email@exemplo.com';
```

OU no painel:
1. Authentication → Users
2. Encontre o usuário
3. Clique nos 3 pontinhos → "Confirm email"

### Teste
```
1. Limpe o cache do navegador
2. Tente fazer login novamente
3. ✅ Deve funcionar
```

---

## Caso 2: "Criei um usuário mas não consigo logar"

### Sintoma
```
Erro: Invalid login credentials
Status: 400
```

### Diagnóstico
```sql
-- Verificar se o usuário existe
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'novo-usuario@exemplo.com';
```

### Resultado 1: Usuário não existe
```
(0 rows)
```

**Solução:** Criar o usuário corretamente

```
Painel Supabase:
1. Authentication → Users → "Add user"
2. Email: novo-usuario@exemplo.com
3. Password: SenhaSegura123!
4. ✅ MARQUE "Auto Confirm User"
5. Clique em "Create user"
```

### Resultado 2: Usuário existe mas não confirmado
```
id                                   | email                      | email_confirmed_at | created_at
-------------------------------------|----------------------------|-------------------|------------
123e4567-e89b-12d3-a456-426614174000 | novo-usuario@exemplo.com   | NULL              | 2026-04-08
```

**Solução:** Confirmar email (ver Caso 1)

---

## Caso 3: "Esqueci minha senha"

### Solução via Painel
```
1. Authentication → Users
2. Encontre o usuário
3. Clique nos 3 pontinhos → "Send password recovery"
4. Usuário receberá email com link de reset
```

### Solução via Aplicação
```typescript
// Na página de login, clique em "Esqueci minha senha"
// Ou use o AuthService:
await AuthService.resetPassword('usuario@exemplo.com');
```

### Verificar se o email foi enviado
```sql
SELECT 
  email,
  recovery_sent_at,
  recovery_token
FROM auth.users
WHERE email = 'usuario@exemplo.com';
```

---

## Caso 4: "Quero criar múltiplos usuários de teste"

### Script SQL
```sql
-- ATENÇÃO: Execute no painel do Supabase, não via CLI
-- O painel tem permissões especiais para criar usuários

-- Verificar usuários existentes primeiro
SELECT email FROM auth.users WHERE email LIKE 'teste%@exemplo.com';

-- Criar via painel (recomendado):
-- 1. teste1@exemplo.com / Teste123!
-- 2. teste2@exemplo.com / Teste123!
-- 3. teste3@exemplo.com / Teste123!
-- Sempre marque "Auto Confirm User"
```

### Verificar criação
```sql
SELECT 
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email LIKE 'teste%@exemplo.com'
ORDER BY created_at DESC;
```

---

## Caso 5: "Usuário está banido, como desbanir?"

### Diagnóstico
```sql
SELECT 
  email,
  banned_until,
  CASE 
    WHEN banned_until > NOW() THEN 'Banido até ' || banned_until::TEXT
    ELSE 'Não banido'
  END as status
FROM auth.users
WHERE email = 'usuario@exemplo.com';
```

### Solução
```sql
-- Remover ban
UPDATE auth.users
SET banned_until = NULL
WHERE email = 'usuario@exemplo.com';
```

### Verificar
```sql
SELECT 
  email,
  banned_until
FROM auth.users
WHERE email = 'usuario@exemplo.com';
-- banned_until deve ser NULL
```

---

## Caso 6: "Verificar todos os perfis de um usuário"

### Query
```sql
SELECT 
  u.email,
  p.id as profile_id,
  p.name,
  p.profile_type,
  p.is_active,
  p.verified
FROM auth.users u
JOIN public.profiles p ON p.user_id = u.id
WHERE u.email = 'usuario@exemplo.com'
ORDER BY p.created_at;
```

### Resultado Esperado
```
email                | profile_id | name          | profile_type | is_active | verified
---------------------|------------|---------------|--------------|-----------|----------
usuario@exemplo.com  | uuid-1     | João Silva    | user         | true      | false
usuario@exemplo.com  | uuid-2     | João Motorista| driver       | true      | true
```

---

## Caso 7: "Usuário não tem perfil"

### Diagnóstico
```sql
SELECT 
  u.id,
  u.email,
  p.id as profile_id
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE u.email = 'usuario@exemplo.com';
```

### Resultado
```
id                                   | email                | profile_id
-------------------------------------|----------------------|-----------
123e4567-e89b-12d3-a456-426614174000 | usuario@exemplo.com  | NULL
```

### Solução
```sql
-- Criar perfil padrão
INSERT INTO public.profiles (
  user_id,
  name,
  profile_type,
  is_active
) VALUES (
  '123e4567-e89b-12d3-a456-426614174000', -- user_id do resultado acima
  'Nome do Usuário',
  'user',
  true
);
```

### Verificar
```sql
SELECT 
  u.email,
  p.name,
  p.profile_type
FROM auth.users u
JOIN public.profiles p ON p.user_id = u.id
WHERE u.email = 'usuario@exemplo.com';
```

---

## Caso 8: "Limpar dados de teste"

### Deletar usuários de teste
```sql
-- CUIDADO: Isso deleta permanentemente
-- Verifique primeiro quais serão deletados:
SELECT 
  email,
  created_at
FROM auth.users
WHERE email LIKE 'teste%@exemplo.com';

-- Se estiver correto, delete:
DELETE FROM auth.users
WHERE email LIKE 'teste%@exemplo.com';

-- Os perfis serão deletados automaticamente (ON DELETE CASCADE)
```

### Verificar deleção
```sql
-- Não deve retornar nenhum resultado
SELECT email FROM auth.users WHERE email LIKE 'teste%@exemplo.com';
SELECT user_id FROM public.profiles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'teste%@exemplo.com'
);
```

---

## Caso 9: "Migrar usuário de um email para outro"

### ⚠️ ATENÇÃO
Não é possível alterar o email diretamente no `auth.users` por questões de segurança.

### Solução Correta
```
1. Usuário deve fazer login
2. Ir em Configurações → Alterar Email
3. Supabase enviará email de confirmação para o novo email
4. Usuário confirma o novo email
5. Email é atualizado automaticamente
```

### Via Painel (Admin)
```
1. Authentication → Users
2. Encontre o usuário
3. Clique nos 3 pontinhos → "Edit user"
4. Altere o email
5. Marque "Auto Confirm Email"
6. Salve
```

---

## Caso 10: "Verificar últimos logins"

### Query
```sql
SELECT 
  email,
  last_sign_in_at,
  AGE(NOW(), last_sign_in_at) as tempo_desde_ultimo_login,
  CASE 
    WHEN last_sign_in_at > NOW() - INTERVAL '1 day' THEN '🟢 Ativo'
    WHEN last_sign_in_at > NOW() - INTERVAL '7 days' THEN '🟡 Recente'
    WHEN last_sign_in_at > NOW() - INTERVAL '30 days' THEN '🟠 Inativo'
    ELSE '🔴 Muito inativo'
  END as status_atividade
FROM auth.users
WHERE last_sign_in_at IS NOT NULL
ORDER BY last_sign_in_at DESC
LIMIT 20;
```

---

## 🔧 Comandos Úteis Rápidos

### Confirmar email
```sql
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'email@exemplo.com';
```

### Remover ban
```sql
UPDATE auth.users SET banned_until = NULL WHERE email = 'email@exemplo.com';
```

### Verificar status
```sql
SELECT email, email_confirmed_at, banned_until, deleted_at FROM auth.users WHERE email = 'email@exemplo.com';
```

### Contar usuários
```sql
SELECT COUNT(*) FROM auth.users WHERE deleted_at IS NULL;
```

### Últimos cadastros
```sql
SELECT email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 10;
```

---

## 📚 Referências

- Mais comandos: `comandos-supabase-auth.md`
- Schema completo: `SCHEMA_AUTH_SSOT.md`
- Solução de problemas: `SOLUCAO_LOGIN_SSOT.md`
