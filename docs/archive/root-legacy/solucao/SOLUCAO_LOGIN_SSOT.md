# 🔧 Solução para Erro de Login - Seguindo SSOT

## ❌ Problema Identificado
```
AuthApiError: Invalid login credentials
Status: 400
Code: invalid_credentials
```

Isso significa que **as credenciais estão incorretas** ou **o usuário não existe/não está confirmado**.

## ✅ Solução - Seguindo SSOT (Single Source of Truth)

O SSOT para autenticação é o banco de dados Supabase (`auth.users`). Vamos verificar e corrigir diretamente na fonte.

---

## Passo 1: Diagnosticar o Problema Real

1. Acesse o painel do Supabase: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Execute o script `diagnostico-auth.sql` que criei

Isso mostrará:
- ✅ Quais usuários existem
- ❌ Quais emails não estão confirmados
- 🚫 Quais usuários estão banidos
- ⚠️ Quais usuários não têm perfil

---

## Passo 2: Identificar a Causa Raiz

Baseado no resultado do diagnóstico:

### Causa A: Email não confirmado
```sql
-- Se você viu: "❌ Email não confirmado"
-- O Supabase está bloqueando login de emails não confirmados
```

**Solução:**
1. Vá em **Authentication** → **Users**
2. Encontre o usuário
3. Clique nos 3 pontinhos → **Confirm email**

OU desabilite a confirmação obrigatória:
1. Vá em **Authentication** → **Settings** → **Email Auth**
2. Desmarque **"Enable email confirmations"**
3. Salve

### Causa B: Usuário não existe
```sql
-- Se a query não retornou nenhum resultado
-- O usuário não foi criado
```

**Solução:**
1. Vá em **Authentication** → **Users**
2. Clique em **"Add user"** → **"Create new user"**
3. Preencha:
   - Email: `teste@exemplo.com`
   - Password: `Teste123!`
   - ✅ **MARQUE "Auto Confirm User"** (importante!)
4. Clique em **"Create user"**

### Causa C: Senha incorreta
```sql
-- Se o usuário existe e está confirmado
-- A senha digitada está errada
```

**Solução:**
1. Vá em **Authentication** → **Users**
2. Encontre o usuário
3. Clique nos 3 pontinhos → **"Send password recovery"**
4. OU clique em **"Reset password"** e defina uma nova senha

### Causa D: Usuário banido ou deletado
```sql
-- Se você viu: "🚫 Usuário banido" ou "🗑️ Usuário deletado"
```

**Solução:**
1. Se banido: remova o ban no painel
2. Se deletado: crie um novo usuário

---

## Passo 3: Criar Usuário de Teste (Método Correto)

Siga este processo para criar um usuário funcional:

### Via Painel (Recomendado)
1. **Authentication** → **Users** → **"Add user"**
2. Preencha:
   ```
   Email: teste@exemplo.com
   Password: Teste123!
   ✅ Auto Confirm User (IMPORTANTE!)
   ```
3. Clique em **"Create user"**

### Via SQL (Avançado)
Execute o script `criar-usuario-teste.sql` no SQL Editor.

---

## Passo 4: Verificar Configurações do Supabase

Verifique se as configurações de autenticação estão corretas:

1. **Authentication** → **Settings** → **Email Auth**
   - ✅ Enable email provider
   - ⚠️ Enable email confirmations (desabilite se quiser login imediato)
   - ✅ Enable email change confirmations

2. **Authentication** → **URL Configuration**
   - Site URL: `http://localhost:8080` (para dev)
   - Redirect URLs: adicione `http://localhost:8080/**`

---

## Passo 5: Testar o Login

1. Limpe o cache do navegador (Ctrl + Shift + Delete)
2. Abra uma aba anônima
3. Acesse `http://localhost:8080/login`
4. Use as credenciais:
   ```
   Email: teste@exemplo.com
   Senha: Teste123!
   ```

---

## 🔍 Verificação Pós-Login

Após o login bem-sucedido, execute no SQL Editor:

```sql
-- Verificar sessão ativa
SELECT 
  u.email,
  u.last_sign_in_at,
  p.name,
  p.profile_type
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE u.email = 'teste@exemplo.com';
```

Você deve ver:
- ✅ `last_sign_in_at` atualizado
- ✅ Perfil criado automaticamente (se configurado)

---

## 📋 Checklist de Verificação

- [ ] Usuário existe no `auth.users`
- [ ] Email está confirmado (`email_confirmed_at` não é NULL)
- [ ] Usuário não está banido (`banned_until` é NULL)
- [ ] Usuário não está deletado (`deleted_at` é NULL)
- [ ] Senha está correta
- [ ] Configurações de email auth estão corretas
- [ ] Site URL está configurada corretamente
- [ ] Cache do navegador foi limpo

---

## 🆘 Ainda com Problemas?

Se seguiu todos os passos e ainda não funciona:

1. **Verifique os logs do Supabase:**
   - Vá em **Logs** → **Auth Logs**
   - Procure por tentativas de login recentes
   - Veja o motivo exato da falha

2. **Teste com outro usuário:**
   - Crie um segundo usuário de teste
   - Se funcionar, o problema é específico do primeiro usuário

3. **Verifique as variáveis de ambiente:**
   ```bash
   # No arquivo .env, confirme:
   VITE_SUPABASE_URL=https://xhdowzacfujckjelqhtd.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_aqui
   ```

4. **Reinicie o servidor de desenvolvimento:**
   ```bash
   # Pare o servidor (Ctrl + C)
   # Inicie novamente
   npm run dev
   ```

---

## 📚 Referências SSOT

- **Fonte de verdade para usuários:** `auth.users` (schema auth)
- **Fonte de verdade para perfis:** `public.profiles`
- **Fonte de verdade para configurações:** Painel do Supabase > Authentication > Settings

Sempre consulte essas fontes antes de assumir qualquer comportamento do sistema.
