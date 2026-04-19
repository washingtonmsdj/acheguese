# 🔍 FASE 2.0 — Análise do Sistema Atual de Autenticação

> **Data**: 2026-04-18  
> **Status**: ✅ COMPLETO  
> **Próxima Etapa**: 2.1 - Configuração Base

---

## 📊 RESUMO EXECUTIVO

### Status Geral: 🟠 PARCIALMENTE SEGURO

O sistema de autenticação possui **boas práticas implementadas**, mas tem **problemas críticos** que bloqueiam produção:

| Aspecto | Status | Severidade |
|---------|:------:|:----------:|
| Cliente Supabase | ✅ | OK |
| Service Role no Frontend | 🔴 | CRÍTICA |
| Email Confirmation | 🔴 | CRÍTICA |
| MFA | 🔴 | CRÍTICA |
| OAuth Providers | 🟡 | MÉDIA |
| Páginas de Auth | 🟢 | OK |
| Session Management | 🟡 | MÉDIA |
| Rate Limiting | 🟢 | OK |

---

## ✅ PONTOS POSITIVOS

### 1. Cliente Supabase Bem Configurado

**Arquivo**: `src/integrations/supabase/supabase.ts`

✅ **Boas práticas identificadas**:
- Usa cookies seguros ao invés de localStorage
- PKCE flow habilitado
- Auto-refresh de tokens
- Validação de variáveis de ambiente
- Limpeza de tokens da URL após processamento
- Storage seguro com fallback

```typescript
auth: {
  storage: createSecureStorage(), // ✅ Cookies seguros
  storageKey: 'token',
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
  flowType: 'pkce', // ✅ PKCE para segurança
}
```

### 2. Proteções no supabaseAdmin

**Arquivo**: `src/integrations/supabase/supabaseAdmin.ts`

✅ **Proteções implementadas**:
- Bloqueia `VITE_SUPABASE_SERVICE_ROLE_KEY` (throw error)
- Retorna `null` no browser
- Função `getSupabaseAdmin()` com erro descritivo
- Logs de debug apropriados

```typescript
if (exposedServiceRole) {
  throw new Error(
    "SECURITY: VITE_SUPABASE_SERVICE_ROLE_KEY nao pode ser usado."
  );
}

export const supabaseAdmin = !IS_BROWSER && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(...)
  : null; // ✅ null no browser
```

### 3. Páginas de Auth Existentes

**Arquivos encontrados**:
- `src/app/pages/LoginPage.tsx` - Login principal
- `src/app/pages/LoginPageLegacy.tsx` - Login legado
- `src/modules/onboarding/pages/CadastroConfirmacaoPage.tsx` - Confirmação
- `src/modules/onboarding/hooks/useCadastro.ts` - Hook de cadastro

✅ **Funcionalidades**:
- Login com email/senha
- Login com Google OAuth
- Cadastro completo
- Página de confirmação de email
- Validação de senha com HIBP
- Mensagens de erro apropriadas

### 4. AuthService Completo

**Arquivo**: `src/core/auth/services/AuthService.ts`

✅ **Métodos implementados**:
- `signUp()` - Cadastro
- `signIn()` - Login
- `signInWithGoogle()` - OAuth Google
- `resetPassword()` - Reset de senha
- `resendConfirmationEmail()` - Reenvio de confirmação
- `updatePassword()` - Atualização de senha
- `signOut()` - Logout

---

## 🔴 PROBLEMAS CRÍTICOS

### C1. Service Role Usado no Frontend

**Severidade**: 🔴 CRÍTICA  
**Risco**: Comprometimento total do banco

**Arquivos problemáticos**:
1. `src/integrations/supabase/supabaseAdmin.ts` - **DEVE SER REMOVIDO**
2. `src/integrations/supabase/index.ts` - Exporta supabaseAdmin
3. `src/modules/admin/services/admin.mutations.ts` - Usa supabaseAdmin
4. `src/core/territorial/services/territorial.mutations.ts` - Usa supabaseAdmin
5. `src/core/territorial/services/territorial.queries.ts` - Usa supabaseAdmin
6. `src/core/admin/services/AdminProfileGovernanceService.ts` - Usa supabaseAdmin
7. `src/core/admin/services/AdminNotificationsService.ts` - Usa supabaseAdmin
8. `src/core/admin/services/AdminUserService.ts` - Usa supabaseAdmin

**Problema**:
Mesmo com as proteções, o arquivo `supabaseAdmin.ts` está no bundle do frontend. Se alguém adicionar `SUPABASE_SERVICE_ROLE_KEY` ao `.env`, a key será exposta.

**Solução**:
1. ❌ Deletar `src/integrations/supabase/supabaseAdmin.ts`
2. ✅ Criar edge functions para operações admin
3. ✅ Atualizar todos os services para usar edge functions

---

### C2. Email Confirmation Desabilitado

**Severidade**: 🔴 CRÍTICA  
**Risco**: Emails falsos podem criar contas

**Configuração atual** (`supabase/config.toml`):
```toml
[auth.email]
enable_signup = true
enable_confirmations = false  # ❌ DESABILITADO
```

**Problema**:
Qualquer email pode criar conta sem verificação. Permite:
- Spam accounts
- Emails falsos
- Abuso do sistema

**Solução**:
```toml
[auth.email]
enable_confirmations = true  # ✅ HABILITAR
```

---

### C3. MFA Desabilitado

**Severidade**: 🔴 CRÍTICA (para admins)  
**Risco**: Contas admin vulneráveis

**Configuração atual** (`supabase/config.toml`):
```toml
[auth.mfa.totp]
enroll_enabled = false  # ❌ DESABILITADO
verify_enabled = false  # ❌ DESABILITADO
```

**Problema**:
Admins não têm proteção de segundo fator. Vulnerável a:
- Credential stuffing
- Phishing
- Senhas vazadas

**Solução**:
1. Habilitar TOTP no config
2. Criar migration para forçar MFA em admins
3. Criar página de setup de MFA

---

### C4. Página de Reset Password Faltando

**Severidade**: 🔴 CRÍTICA  
**Risco**: Usuários não conseguem recuperar senha

**Problema**:
O Supabase **REQUER** uma página `/reset-password` para o fluxo de recuperação de senha funcionar. Não encontrei essa página no código.

**Arquivos que usam reset**:
- `AuthService.resetPassword()` - Envia email
- Mas não há página para receber o token e definir nova senha

**Solução**:
Criar `src/pages/auth/ResetPassword.tsx`

---

## 🟡 PROBLEMAS MÉDIOS

### M1. OAuth Providers Não Configurados

**Configuração atual**: Apenas Google está parcialmente configurado

**Faltam**:
- Apple OAuth (importante para iOS)
- Facebook OAuth (opcional)
- GitHub OAuth (opcional)

**Solução**:
Configurar providers no Supabase Dashboard e adicionar botões nas páginas de auth.

---

### M2. Session Management Básico

**Configuração atual** (`supabase/config.toml`):
```toml
[auth.sessions]
timebox = "168h"  # 7 dias
inactivity_timeout = "168h"  # 7 dias
```

**Problemas**:
- Sem detecção de sessão suspeita
- Sem logout em todos dispositivos
- Sem notificação de novo login

**Solução**:
1. Criar tabela `user_sessions`
2. Registrar metadados (IP, user-agent, localização)
3. Implementar logout em todos dispositivos
4. Notificar login em novo dispositivo

---

### M3. Senha Fraca Permitida

**Configuração atual**:
```toml
minimum_password_length = 6  # ❌ MUITO FRACO
password_requirements = ""   # ❌ SEM REQUISITOS
```

**Problema**:
Senhas de 6 caracteres são facilmente quebradas.

**Solução**:
```toml
minimum_password_length = 12
password_requirements = "letters,digits,symbols"
```

**Nota**: O código já tem validação melhor em `validateAuthPassword()`, mas o Supabase também deve validar.

---

## 🟢 PONTOS OK

### 1. Rate Limiting

O Supabase já tem rate limiting built-in para auth endpoints. Configuração atual é adequada.

### 2. PKCE Flow

PKCE está habilitado, protegendo contra ataques de interceptação de código.

### 3. Refresh Token Rotation

```toml
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10
```

Boa prática para prevenir roubo de tokens.

---

## 📋 CHECKLIST DE CORREÇÕES

### Prioridade CRÍTICA (Bloqueadores):

- [ ] **C1**: Remover supabaseAdmin do frontend
  - [ ] Deletar `supabaseAdmin.ts`
  - [ ] Criar edge functions admin
  - [ ] Atualizar 8 services

- [ ] **C2**: Habilitar email confirmation
  - [ ] Atualizar `config.toml`
  - [ ] Testar fluxo completo

- [ ] **C3**: Implementar MFA para admins
  - [ ] Habilitar TOTP no config
  - [ ] Criar migration de enforcement
  - [ ] Criar página de setup

- [ ] **C4**: Criar página de reset password
  - [ ] Criar `ResetPassword.tsx`
  - [ ] Testar fluxo completo

### Prioridade ALTA:

- [ ] **M1**: Configurar OAuth providers
  - [ ] Apple OAuth
  - [ ] Testar Google OAuth

- [ ] **M2**: Implementar session management
  - [ ] Criar tabela `user_sessions`
  - [ ] Logout em todos dispositivos
  - [ ] Detecção de sessão suspeita

- [ ] **M3**: Fortalecer requisitos de senha
  - [ ] Atualizar `config.toml`
  - [ ] Validar com HIBP (já implementado)

---

## 🎯 PRÓXIMOS PASSOS

### Etapa 2.1 - Configuração Base

1. Atualizar `supabase/config.toml`:
   - Habilitar email confirmation
   - Habilitar MFA TOTP
   - Fortalecer requisitos de senha

2. Aplicar configurações:
   ```bash
   supabase db push
   ```

3. Testar:
   - Signup com confirmação de email
   - Login com MFA
   - Reset de senha

### Etapa 2.2 - Remover Service Role

1. Criar edge functions:
   - `admin-list-users`
   - `admin-get-user`
   - `admin-update-user`
   - `admin-delete-user`
   - `admin-assign-role`
   - `territorial-update-visibility`
   - `territorial-update-group-visibility`

2. Atualizar services para usar edge functions

3. Deletar `supabaseAdmin.ts`

### Etapa 2.3 - Criar Página de Reset Password

1. Criar `src/pages/auth/ResetPassword.tsx`
2. Adicionar rota
3. Testar fluxo completo

---

## 📊 ESTATÍSTICAS

### Arquivos Analisados:
- ✅ 3 arquivos de integração Supabase
- ✅ 8 services usando supabaseAdmin
- ✅ 4 páginas/hooks de auth
- ✅ 1 arquivo de configuração

### Problemas Encontrados:
- 🔴 **4 críticos** (bloqueadores)
- 🟡 **3 médios** (importantes)
- 🟢 **3 OK** (funcionando bem)

### Tempo Estimado de Correção:
- **Etapa 2.1**: 2-3 horas
- **Etapa 2.2**: 1 dia (edge functions)
- **Etapa 2.3**: 2-3 horas
- **Total**: 2-3 dias

---

## 📚 REFERÊNCIAS

- [Supabase Auth Configuration](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui)
- [Supabase MFA](https://supabase.com/docs/guides/auth/auth-mfa)
- [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**Status**: ✅ ANÁLISE COMPLETA  
**Próxima Etapa**: 2.1 - Configuração Base de Auth  
**Bloqueadores Identificados**: 4 críticos

---

*Documentado por: Kiro AI*  
*Data: 2026-04-18*  
*Fase: Pré-Lançamento - Autenticação & Segurança*
