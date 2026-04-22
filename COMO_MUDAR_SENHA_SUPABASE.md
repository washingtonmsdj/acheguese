# Como Mudar Senha no Supabase

## Problema
Não é possível mudar a senha diretamente no painel do Supabase sem seguir o fluxo de autenticação adequado.

## Soluções

### 1. Via Aplicação (Recomendado)

#### A. Se você está logado:
1. Acesse: `/perfil/conta`
2. Use o formulário "Alterar senha"
3. Informe a senha atual e a nova senha

#### B. Se esqueceu a senha:
1. Acesse: `/perfil/conta` (se logado) ou página de login
2. Clique em "Redefinir por email" ou "Esqueci minha senha"
3. Verifique seu email
4. Clique no link recebido
5. Defina a nova senha na página `/reset-password`

### 2. Via Painel Supabase (Admin)

Se você tem acesso administrativo ao projeto Supabase:

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Authentication** > **Users**
4. Encontre o usuário
5. Clique nos 3 pontinhos (...) ao lado do usuário
6. Selecione **"Send Password Recovery Email"**
7. O usuário receberá um email para redefinir a senha

**OU** (método direto - requer cuidado):

1. No painel Supabase, vá em **SQL Editor**
2. Execute o seguinte comando SQL:

```sql
-- Resetar senha para um usuário específico
-- ATENÇÃO: Isso força uma nova senha sem validação
UPDATE auth.users 
SET encrypted_password = crypt('NOVA_SENHA_AQUI', gen_salt('bf'))
WHERE email = 'email@usuario.com';
```

⚠️ **CUIDADO**: Este método bypassa todas as validações e deve ser usado apenas em desenvolvimento ou emergências.

### 3. Via API (Programático)

Se você precisa fazer isso via código/script:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_SERVICE_ROLE_KEY' // Service role key, não anon key!
)

// Enviar email de recuperação
await supabase.auth.admin.generateLink({
  type: 'recovery',
  email: 'user@email.com'
})

// OU atualizar senha diretamente (requer service role)
await supabase.auth.admin.updateUserById(
  'user-id-here',
  { password: 'new-password' }
)
```

## Fluxo Técnico Atual

O sistema usa:
- `AuthService.updatePassword()` - para usuários logados
- `AuthService.resetPassword()` - para enviar email de recuperação
- `AuthService.resetPasswordByIdentifier()` - aceita email ou username

## Configuração de URLs

As URLs de redirecionamento estão configuradas em:
- Email de confirmação: `/login?confirmed=1`
- Reset de senha: `/reset-password?mode=recovery`

## Troubleshooting

### Email não chega
1. Verifique spam/lixeira
2. Confirme que o email está correto no banco
3. Verifique logs no Supabase Dashboard > Logs

### Link expirado
- Links de recuperação expiram em 1 hora (padrão Supabase)
- Solicite um novo link

### Erro "Link inválido"
- Certifique-se de que as URLs de redirecionamento estão configuradas no Supabase
- Vá em: Authentication > URL Configuration
- Adicione: `http://localhost:5173/reset-password` (dev)
- Adicione: `https://seu-dominio.com/reset-password` (prod)

## Variáveis de Ambiente

Certifique-se de que estas variáveis estão configuradas:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Para operações admin (backend):
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
