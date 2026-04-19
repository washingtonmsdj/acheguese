# 🔐 FASE 2 — Autenticação & Segurança

> **Status**: 🚧 EM PROGRESSO  
> **Dependências**: Fase 1 ✅ COMPLETA  
> **Tempo Estimado**: 3-5 dias  
> **Prioridade**: 🔴 CRÍTICA (Bloqueador para produção)

---

## 📋 OBJETIVO

Garantir que o sistema de autenticação esteja **pronto para produção**, com:
- ✅ Fluxos de auth completos e seguros
- ✅ MFA para usuários privilegiados
- ✅ Proteção contra ataques comuns
- ✅ Session management robusto
- ✅ OAuth providers configurados

---

## 🎯 ETAPAS

### ✅ Etapa 2.0 — Análise do Sistema Atual (PREPARAÇÃO)

**Objetivo**: Entender o estado atual da autenticação

**Tarefas**:
- [ ] Analisar configuração do Supabase Auth
- [ ] Mapear fluxos de autenticação existentes
- [ ] Identificar páginas de auth no código
- [ ] Verificar providers OAuth configurados
- [ ] Listar problemas críticos encontrados

**Arquivos a analisar**:
- `src/lib/supabase.ts` - Cliente Supabase
- `src/integrations/supabase/` - Integrações
- `src/pages/auth/` ou similar - Páginas de autenticação
- `supabase/config.toml` - Configuração do projeto
- `.env*` - Variáveis de ambiente

---

### 🔴 Etapa 2.1 — Configuração Base de Auth (CRÍTICO)

**Objetivo**: Configurar auth de forma segura

**Tarefas**:
1. [ ] **Email Confirmation**
   - Habilitar `auth.email.enable_confirmations = true`
   - Desabilitar auto-confirm
   - Configurar templates de email

2. [ ] **HIBP (Have I Been Pwned)**
   - Habilitar proteção contra senhas vazadas
   - Configurar política de senhas fortes

3. [ ] **OAuth Providers**
   - Configurar Google OAuth
   - Configurar Apple (se iOS)
   - Configurar Facebook (opcional)
   - Configurar GitHub (opcional)

4. [ ] **Redirect URLs**
   - Configurar `emailRedirectTo` correto
   - Configurar `redirectTo` para reset password
   - Adicionar URLs permitidas no Supabase Dashboard

**Arquivos a criar/modificar**:
- `supabase/config.toml` - Configurações de auth
- Documentação de setup de OAuth

---

### 🔴 Etapa 2.2 — Páginas de Autenticação (CRÍTICO)

**Objetivo**: Garantir que todos os fluxos de auth funcionem

**Tarefas**:
1. [ ] **Página `/auth` ou `/login`**
   - Login com email/senha
   - Login com OAuth (Google, etc.)
   - Link para "Esqueci minha senha"
   - Link para "Criar conta"
   - Validação de formulário (Zod)
   - Mensagens de erro apropriadas

2. [ ] **Página `/signup` ou `/register`**
   - Cadastro com email/senha
   - Cadastro com OAuth
   - Validação de senha forte
   - Termos de uso e privacidade
   - Confirmação de email

3. [ ] **Página `/reset-password`** (OBRIGATÓRIA)
   - Formulário de nova senha
   - Validação de token
   - Confirmação de alteração
   - Redirect após sucesso

4. [ ] **Página `/forgot-password`**
   - Formulário de email
   - Envio de email de reset
   - Feedback ao usuário

**Arquivos a criar/modificar**:
- `src/pages/auth/Login.tsx` (ou similar)
- `src/pages/auth/Signup.tsx`
- `src/pages/auth/ResetPassword.tsx`
- `src/pages/auth/ForgotPassword.tsx`
- `src/hooks/useAuth.ts` - Hook de autenticação
- `src/services/AuthService.ts` - Service de auth

---

### 🟠 Etapa 2.3 — MFA para Admins (ALTA PRIORIDADE)

**Objetivo**: Proteger contas privilegiadas com autenticação de dois fatores

**Tarefas**:
1. [ ] **Habilitar TOTP no Supabase**
   - Configurar MFA no dashboard
   - Testar fluxo de enrollment

2. [ ] **Forçar MFA para Admins**
   - Função SQL que verifica se admin tem MFA
   - Redirect para setup de MFA se não tiver
   - Bloqueio de acesso admin sem MFA

3. [ ] **Página de Configuração de MFA**
   - QR Code para TOTP
   - Códigos de backup
   - Teste de verificação
   - Desabilitar MFA (com confirmação)

4. [ ] **Fluxo de Login com MFA**
   - Prompt para código TOTP após senha
   - Validação de código
   - Opção "Confiar neste dispositivo"

**Arquivos a criar**:
- `src/pages/settings/MFASetup.tsx`
- `src/components/auth/MFAPrompt.tsx`
- `supabase/migrations/20260418100000_enforce_mfa_for_admins.sql`
- `src/services/MFAService.ts`

---

### 🟠 Etapa 2.4 — Session Hardening (ALTA PRIORIDADE)

**Objetivo**: Tornar sessões mais seguras e gerenciáveis

**Tarefas**:
1. [ ] **Logout em Todos os Dispositivos**
   - Endpoint para invalidar todas as sessões
   - Botão na página de configurações
   - Confirmação antes de executar

2. [ ] **Detecção de Sessão Suspeita**
   - Tabela `user_sessions` com metadados
   - Registro de IP, user-agent, localização
   - Notificação de login em novo dispositivo
   - Opção de revogar sessão suspeita

3. [ ] **Rate Limiting em Login**
   - Validar configuração do Supabase
   - Implementar rate limit adicional se necessário
   - Mensagem apropriada ao usuário

4. [ ] **Session Timeout**
   - Configurar tempo de expiração
   - Refresh token automático
   - Prompt de re-autenticação

**Arquivos a criar**:
- `supabase/migrations/20260418110000_create_user_sessions.sql`
- `src/pages/settings/Sessions.tsx`
- `src/services/SessionService.ts`
- `src/hooks/useSessionMonitor.ts`

---

### 🟡 Etapa 2.5 — Remover Service Role do Frontend (CRÍTICO)

**Objetivo**: Eliminar vazamento de credenciais admin

**Tarefas**:
1. [ ] **Remover `supabaseAdmin.ts`**
   - Deletar `src/integrations/supabase/supabaseAdmin.ts`
   - Remover todas as importações
   - Substituir por edge functions

2. [ ] **Criar Edge Functions Admin**
   - `admin-get-users` - Listar usuários
   - `admin-update-user` - Atualizar usuário
   - `admin-delete-user` - Deletar usuário
   - `admin-assign-role` - Atribuir role
   - Todas com verificação de role admin

3. [ ] **Atualizar Páginas Admin**
   - Substituir chamadas diretas por edge functions
   - Adicionar tratamento de erro
   - Adicionar loading states

4. [ ] **Remover Variáveis de Ambiente**
   - Remover `VITE_SUPABASE_SERVICE_ROLE_KEY`
   - Remover `SUPABASE_SERVICE_ROLE_KEY` do .env
   - Documentar que service_role só deve estar em edge functions

**Arquivos a modificar/deletar**:
- ❌ `src/integrations/supabase/supabaseAdmin.ts` (DELETAR)
- `src/modules/admin/pages/AdminUsuarios.tsx`
- `supabase/functions/admin-*/*.ts` (CRIAR)

---

### 🟢 Etapa 2.6 — Documentação & Testes (IMPORTANTE)

**Objetivo**: Garantir que tudo está documentado e testado

**Tarefas**:
1. [ ] **Documentação**
   - Fluxos de autenticação
   - Como configurar OAuth
   - Como testar MFA
   - Troubleshooting comum

2. [ ] **Testes**
   - Teste de signup completo
   - Teste de login (email + OAuth)
   - Teste de reset password
   - Teste de MFA
   - Teste de logout em todos dispositivos
   - Teste de rate limiting

3. [ ] **Checklist de Segurança**
   - [ ] Email confirmation habilitado
   - [ ] HIBP habilitado
   - [ ] MFA funcionando para admins
   - [ ] Service role removido do frontend
   - [ ] Rate limiting configurado
   - [ ] Session timeout configurado
   - [ ] OAuth providers testados

**Arquivos a criar**:
- `docs/pre-launch/FASE_2_APLICADA.md`
- `docs/auth/FLUXOS_AUTENTICACAO.md`
- `docs/auth/CONFIGURACAO_OAUTH.md`
- `docs/auth/TROUBLESHOOTING.md`

---

## 🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS

### P1. Service Role Exposto no Frontend
**Severidade**: 🔴 CRÍTICA  
**Status**: ⏳ Pendente  
**Impacto**: Comprometimento total do banco se a key for adicionada

### P2. Auth Flow Incompleto
**Severidade**: 🔴 CRÍTICA  
**Status**: ⏳ Pendente  
**Impacto**: Usuários não conseguem recuperar senha, emails não são confirmados

### P3. Sem MFA para Admins
**Severidade**: 🟠 ALTA  
**Status**: ⏳ Pendente  
**Impacto**: Contas admin vulneráveis a credential stuffing

### P4. Auto-Confirm Pode Estar Ligado
**Severidade**: 🟠 ALTA  
**Status**: ⏳ Pendente  
**Impacto**: Emails falsos podem criar contas

---

## 📊 PROGRESSO

| Etapa | Status | Progresso |
|-------|:------:|:---------:|
| 2.0 - Análise do Sistema | ✅ | 100% |
| 2.1 - Configuração Base | ✅ | 100% |
| 2.2 - Páginas de Auth | ✅ | 100% |
| 2.3 - MFA para Admins | ⏳ | 0% |
| 2.4 - Session Hardening | ⏳ | 0% |
| 2.5 - Remover Service Role | 🚧 | 70% |
| 2.6 - Documentação & Testes | ⏳ | 0% |

**Progresso Geral**: 53%

---

## 🎯 CRITÉRIOS DE CONCLUSÃO

A Fase 2 estará completa quando:

- ✅ Email confirmation habilitado e funcionando
- ✅ HIBP habilitado
- ✅ OAuth providers configurados e testados
- ✅ Todas as páginas de auth funcionando
- ✅ MFA obrigatório para admins
- ✅ Service role removido do frontend
- ✅ Session management implementado
- ✅ Rate limiting validado
- ✅ Documentação completa
- ✅ Todos os testes passando

---

## 📚 REFERÊNCIAS

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase MFA Documentation](https://supabase.com/docs/guides/auth/auth-mfa)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [PRE_LAUNCH_AUDIT.md](./PRE_LAUNCH_AUDIT.md) - Seção C7

---

**Status**: 🚧 EM PROGRESSO  
**Próxima Etapa**: 2.0 - Análise do Sistema Atual  
**Bloqueadores**: Nenhum

---

*Criado por: Kiro AI*  
*Data: 2026-04-18*  
*Fase: Pré-Lançamento - Autenticação & Segurança*
