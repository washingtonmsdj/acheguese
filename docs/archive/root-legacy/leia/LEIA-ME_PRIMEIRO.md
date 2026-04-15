# 🚀 LEIA-ME PRIMEIRO - Erro de Login

## ⚡ Solução em 3 Passos (5 minutos)

### Passo 1: Execute o diagnóstico
```powershell
.\diagnosticar-login.ps1
```

### Passo 2: Crie um usuário de teste
1. Acesse: https://app.supabase.com
2. Vá em **Authentication** → **Users** → **"Add user"**
3. Preencha:
   - Email: `teste@exemplo.com`
   - Password: `Teste123!`
   - ✅ **MARQUE "Auto Confirm User"**
4. Clique em **"Create user"**

### Passo 3: Teste o login
1. Abra uma aba anônima no navegador
2. Acesse: http://localhost:8080/login
3. Use as credenciais:
   - Email: `teste@exemplo.com`
   - Senha: `Teste123!`
4. ✅ Deve funcionar!

---

## 📚 Documentação Completa

Se os 3 passos acima não resolveram, consulte a documentação completa:

### 🎯 Início
- **INDICE_DOCUMENTACAO_AUTH.md** - Índice de toda a documentação

### 🚀 Solução Rápida
- **README_LOGIN.md** - Guia rápido (5 min)
- **SOLUCAO_LOGIN_SSOT.md** - Guia completo (15 min)

### 🔧 Ferramentas
- **diagnosticar-login.ps1** - Script de diagnóstico
- **diagnostico-auth.sql** - Queries SQL
- **criar-usuario-teste.sql** - Criar usuário

### 📖 Referência
- **SCHEMA_AUTH_SSOT.md** - Estrutura do banco
- **comandos-supabase-auth.md** - Comandos úteis
- **EXEMPLOS_PRATICOS_AUTH.md** - Casos de uso reais

---

## 🎓 Entenda o Problema

O erro **"Invalid login credentials"** pode ter 4 causas:

1. ❌ **Email não confirmado** (mais comum)
   - Solução: Confirme no painel do Supabase

2. ❌ **Usuário não existe**
   - Solução: Crie o usuário (veja Passo 2 acima)

3. ❌ **Senha incorreta**
   - Solução: Resete a senha no painel

4. ❌ **Usuário banido/deletado**
   - Solução: Remova o ban ou recrie o usuário

---

## 🔍 Diagnóstico Detalhado

Execute no SQL Editor do Supabase:

```sql
-- Verificar status do usuário
SELECT 
  email,
  email_confirmed_at,
  banned_until,
  deleted_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Email não confirmado'
    WHEN banned_until IS NOT NULL THEN '🚫 Usuário banido'
    WHEN deleted_at IS NOT NULL THEN '🗑️ Usuário deletado'
    ELSE '✅ Usuário OK'
  END as status
FROM auth.users
WHERE email = 'seu-email@exemplo.com';
```

---

## ✅ Checklist

- [ ] Executei `diagnosticar-login.ps1`
- [ ] Verifiquei se o usuário existe no Supabase
- [ ] Confirmei que o email está confirmado
- [ ] Testei com um usuário novo (teste@exemplo.com)
- [ ] Limpei o cache do navegador
- [ ] Testei em uma aba anônima
- [ ] Li a documentação completa (se necessário)

---

## 🆘 Ainda com Problemas?

1. Leia: **SOLUCAO_LOGIN_SSOT.md**
2. Execute: **diagnostico-auth.sql**
3. Consulte: **EXEMPLOS_PRATICOS_AUTH.md**
4. Verifique os logs: Supabase → Logs → Auth Logs

---

## 📞 Suporte

Se nenhuma solução funcionou:

1. ✅ Confirme que seguiu TODOS os passos acima
2. 📋 Colete os resultados do diagnóstico
3. 📊 Verifique os logs do Supabase
4. 📚 Consulte o índice completo: **INDICE_DOCUMENTACAO_AUTH.md**

---

## 🎯 Princípio SSOT

Toda a documentação segue o princípio **Single Source of Truth**:

- **Usuários:** `auth.users` (banco de dados)
- **Perfis:** `public.profiles` (banco de dados)
- **Configurações:** Painel do Supabase

Sempre consulte essas fontes antes de assumir qualquer comportamento.

---

**Última atualização:** 2026-04-08  
**Versão:** 1.0.0

---

## 🚀 Próximos Passos

Após resolver o problema de login:

1. Configure as variáveis de ambiente no `.env`
2. Teste outras funcionalidades da aplicação
3. Crie perfis adicionais se necessário
4. Configure permissões e RLS conforme necessário

Boa sorte! 🎉
