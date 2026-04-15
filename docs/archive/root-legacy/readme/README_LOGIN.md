# 🔐 Guia de Autenticação - SSOT

## 🎯 Problema Atual

Erro ao fazer login:
```
AuthApiError: Invalid login credentials
Status: 400
```

## ⚡ Solução Rápida (5 minutos)

### Opção 1: Via Script PowerShell
```powershell
.\diagnosticar-login.ps1
```

### Opção 2: Via Painel Supabase
1. Acesse https://app.supabase.com
2. Vá em **Authentication** → **Users**
3. Clique em **"Add user"** → **"Create new user"**
4. Preencha:
   - Email: `teste@exemplo.com`
   - Password: `Teste123!`
   - ✅ **MARQUE "Auto Confirm User"**
5. Clique em **"Create user"**
6. Teste o login na aplicação

## 📋 Arquivos de Diagnóstico

| Arquivo | Descrição | Como Usar |
|---------|-----------|-----------|
| `SOLUCAO_LOGIN_SSOT.md` | Guia completo passo a passo | Leia para entender o problema |
| `diagnostico-auth.sql` | Queries de diagnóstico | Execute no SQL Editor do Supabase |
| `criar-usuario-teste.sql` | Script para criar usuário | Execute no SQL Editor do Supabase |
| `diagnosticar-login.ps1` | Script de diagnóstico | Execute no PowerShell |

## 🔍 Causas Comuns

1. **Email não confirmado** (mais comum)
   - Solução: Confirme o email no painel do Supabase

2. **Usuário não existe**
   - Solução: Crie o usuário no painel

3. **Senha incorreta**
   - Solução: Resete a senha no painel

4. **Configuração incorreta**
   - Solução: Verifique as variáveis de ambiente no `.env`

## ✅ Verificação Rápida

Execute no SQL Editor do Supabase:
```sql
SELECT 
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Email não confirmado'
    ELSE '✅ OK'
  END as status
FROM auth.users
WHERE email = 'seu-email@exemplo.com';
```

## 🆘 Suporte

Se o problema persistir após seguir os passos:
1. Execute `diagnosticar-login.ps1`
2. Execute `diagnostico-auth.sql` no Supabase
3. Leia `SOLUCAO_LOGIN_SSOT.md` completo
4. Verifique os logs em **Logs** → **Auth Logs** no Supabase

## 📚 Princípio SSOT

**Single Source of Truth para autenticação:**
- Usuários: `auth.users` (schema auth)
- Perfis: `public.profiles`
- Configurações: Painel do Supabase > Authentication > Settings

Sempre consulte essas fontes antes de assumir qualquer comportamento.
