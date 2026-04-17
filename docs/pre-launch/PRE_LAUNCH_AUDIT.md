# 🛡️ Auditoria Pré-Lançamento — Ordax SaaS

> **Versão**: 1.0  
> **Data**: 2026-04-17  
> **Status**: ⚠️ **NÃO ESTÁ PRONTO PARA PRODUÇÃO**  
> **Tipo**: SaaS multi-tenant com dados sensíveis (PII, geolocalização, pagamentos, mensagens privadas)

---

## 📊 Sumário Executivo

| Categoria | Status | Severidade | Bloqueador |
|-----------|:---:|:---:|:---:|
| 🔴 **Schema do banco vs código** | ❌ | CRÍTICO | SIM |
| 🔴 **TypeScript safety** | ❌ | CRÍTICO | SIM |
| 🔴 **RLS / Autorização** | ⚠️ | CRÍTICO | SIM |
| 🟠 **Service Role exposto no frontend** | ❌ | ALTO | SIM |
| 🟠 **Edge Functions / Stripe** | ⚠️ | ALTO | SIM |
| 🟠 **Auth flow (signup, reset, OAuth)** | ⚠️ | ALTO | SIM |
| 🟡 **Validação de input (Zod)** | ⚠️ | MÉDIO | NÃO |
| 🟡 **Rate limiting** | ⚠️ | MÉDIO | SIM (APIs públicas) |
| 🟡 **Logging / Observabilidade** | ⚠️ | MÉDIO | NÃO |
| 🟡 **LGPD / Privacidade** | ❌ | ALTO (legal) | SIM |
| 🟢 **CSP / Headers** | ⚠️ | MÉDIO | NÃO |
| 🟢 **Performance** | ⚠️ | BAIXO | NÃO |

### Métricas atuais
- **2.133** arquivos TS/TSX
- **136** arquivos com `@ts-nocheck` (bypass de tipos = bombas-relógio)
- **198** tabelas referenciadas no código → **apenas 5 existem no banco**
- **136** TODO/FIXME/HACK no código
- **320** `console.log/warn/error` (vazamento potencial em produção)
- **28** migrations + **12** edge functions
- **14** ocorrências de `auth.uid()` (pouquíssimo para um SaaS deste porte)

---

## 🚨 Achados Críticos (BLOQUEADORES)

### C1. Schema do banco está praticamente vazio
**Severidade**: 🔴 CRÍTICA

O código referencia ~198 tabelas (`profiles`, `businesses`, `ride_requests`, `gastronomy_subscriptions`, `user_roles`, `analytics_events`, etc.), mas o banco só tem **5 tabelas** (todas legadas de outro projeto: `chat_messages`, `game_specs`, `project_assets`, `project_files`, `projects`).

**Impacto**: A aplicação **não funciona em produção**. Qualquer chamada Supabase vai retornar erro ou dados vazios. Os `@ts-nocheck` existem justamente para esconder isso.

**Como corrigir**: Ver Fase 1 do plano.

---

### C2. 136 arquivos com `@ts-nocheck`
**Severidade**: 🔴 CRÍTICA

Concentrados em domínios sensíveis: `profiles/multi-profile`, `gastronomy/billing`, `mobility`, `community`, `admin`. Significa que erros de tipo (que protegem contra bugs em runtime) estão sendo **silenciados em massa**.

**Impacto**: Bugs silenciosos em pagamento, autenticação, autorização, mensageria — exatamente o que **NÃO PODE FALHAR** num SaaS.

---

### C3. Cliente Supabase Admin (service_role) está bundleado no frontend
**Severidade**: 🔴 CRÍTICA (vazamento de credenciais)

`src/integrations/supabase/supabaseAdmin.ts` lê `import.meta.env.SUPABASE_SERVICE_ROLE_KEY`. Se essa env existir no build, a **service_role key vaza para qualquer usuário** via JS bundle. Service role **bypassa RLS** → acesso total ao banco.

`src/modules/admin/pages/AdminUsuarios.tsx` ainda referencia `VITE_SUPABASE_SERVICE_ROLE_KEY` (prefixo `VITE_` = exposto no client).

**Impacto**: Comprometimento total do banco se a key for adicionada como env.

**Como corrigir**: Remover `supabaseAdmin.ts` do bundle do client. Toda operação admin **DEVE** ir para edge function.

---

### C4. Sistema de Roles não existe no banco
**Severidade**: 🔴 CRÍTICA (escalada de privilégio)

Código usa `user_roles` table e função `has_role()`, mas nem a tabela nem a função existem. Sem isso, **qualquer usuário pode se passar por admin** se as policies forem criadas erradas.

**Como corrigir**: Migration que cria `app_role` enum, tabela `user_roles` e função `has_role()` SECURITY DEFINER (ver Fase 1).

---

### C5. RLS ausente em todas as tabelas de domínio
**Severidade**: 🔴 CRÍTICA

Como as tabelas não existem, não há RLS. Quando criadas sem RLS, todos os dados ficam expostos.

---

### C6. Edge Functions com Stripe sem validação adequada
**Severidade**: 🔴 ALTA

`gastronomy-*` functions:
- Não há `stripe-webhook` listado no config (mas há referência no código) → assinaturas Stripe podem ficar desincronizadas.
- Falta verificação de assinatura do webhook (`stripe.webhooks.constructEvent`).
- `verify_jwt` não está configurado por função no `config.toml`.
- Sem rate limiting nas functions de pagamento.

---

### C7. Auth flow incompleto
**Severidade**: 🔴 ALTA

- Sem página `/reset-password` validada.
- HIBP (leaked password protection) não está configurado.
- Sem verificação de email forçada.
- Auto-confirm pode estar ligado.
- Sem MFA para admins.

---

### C8. LGPD / Privacidade
**Severidade**: 🔴 ALTA (risco legal Brasil)

Plataforma lida com:
- **Endereço residencial** (verificação de morador)
- **GPS em tempo real** (mobility)
- **Mensagens privadas** (chat motorista/passageiro)
- **Documentos** (verificação)
- **Pagamentos**

Faltam:
- Política de privacidade publicada
- Termos de uso
- Mecanismo de exportação de dados (Art. 18 LGPD)
- Mecanismo de exclusão de conta + dados
- Registro de consentimento (cookies, marketing, geolocalização)
- DPO designado e contato visível
- Logs de acesso a dados sensíveis (auditoria)
- Criptografia em repouso de campos PII (CPF, telefone)

---

## ⚠️ Achados Altos

### A1. 4 acessos diretos a `supabase.from()` em components/pages
Viola SSOT (regra: só `services/repositories`). Vaza implementação de banco para a UI.

### A2. 320 `console.log/warn/error`
Em produção, vazam dados sensíveis no DevTools. Precisa logger condicional (`logger` já existe em `shared/utils/logger`).

### A3. Sem rate limiting nas APIs públicas
Edge functions de gastronomia, dispatch e nominatim-proxy podem ser abusadas (DoS, scraping, custo Stripe/Nominatim).

### A4. `nominatim-proxy` sem cache
Cada geocoding bate na API pública do OSM (uso justo: 1 req/s). Em escala = ban de IP.

### A5. `dangerouslySetInnerHTML` (1 ocorrência)
Verificar se é conteúdo confiável. Sem DOMPurify = XSS.

### A6. Realtime sem RLS adequado
`mobility/messaging` usa realtime. Sem RLS = vazamento de mensagens privadas entre usuários.

### A7. Storage buckets não existem
Código upload de avatar, classified images, business gallery, documentos de verificação. Nenhum bucket criado → quebra em produção.

### A8. Sem CSP / Security Headers
Ausência de Content-Security-Policy, HSTS, X-Frame-Options no Vercel.

---

## 🟡 Achados Médios

### M1. 136 TODO/FIXME pendentes
### M2. Validação Zod inconsistente entre forms
### M3. Sem testes E2E para fluxos críticos (signup, checkout, dispatch)
### M4. Bundle não otimizado (sem code-splitting por rota declarado)
### M5. Sem monitoramento de erros (Sentry/equivalente)
### M6. Sem health-check de edge functions
### M7. SEO incompleto (faltam JSON-LD, sitemap dinâmico)
### M8. Acessibilidade não auditada (sem axe/lighthouse score)

---

## 🟢 Achados Baixos

### B1. Sem budget de performance (Lighthouse)
### B2. Imagens sem `loading="lazy"` em todas
### B3. Documentação dispersa (vários `STATUS.md`, `README.md` redundantes)
### B4. PowerBI URL hardcoded em `analytics/config/dashboards.config.ts`

---

## 📋 Plano de Execução por Fases

> Cada fase tem objetivo claro, critério de pronto e ordem **NÃO PODE SER ALTERADA**.  
> Fases 1-4 são **bloqueadoras de lançamento**. Fases 5-7 podem ser pós-MVP.

---

### 🔴 FASE 1 — Fundação do Banco (1-2 semanas)
**Objetivo**: Banco funcional + autorização correta antes de qualquer coisa.

#### Etapa 1.1 — Roles & Autorização (1 dia)
- [ ] Criar enum `app_role` (`super_admin`, `admin`, `moderator`, `business_owner`, `driver`, `user`)
- [ ] Criar tabela `user_roles` (id, user_id, role, granted_by, granted_at)
- [ ] RLS: SELECT próprio + admins veem tudo
- [ ] Função `has_role(_user_id, _role)` SECURITY DEFINER
- [ ] Função `is_admin(_user_id)` helper
- [ ] Tabela `role_history` (auditoria)
- [ ] **Critério pronto**: `has_role()` testada via `select`, RLS funciona.

#### Etapa 1.2 — Profiles & Identidade (2 dias)
- [ ] Tabela `profiles` (user_id FK auth.users, display_name, avatar_url, slug, type)
- [ ] Trigger `handle_new_user()` cria profile no signup
- [ ] Tabela `profile_username_history`
- [ ] RLS: leitura pública de `display_name/avatar/slug`; PII (telefone, doc) só dono + admin
- [ ] View `public_profiles` mascarando PII

#### Etapa 1.3 — Geografia (locations, addresses) (2 dias)
- [ ] Tabela `locations` (hierarquia: country → state → city → district → neighborhood)
- [ ] Tabela `addresses` com `address_precision`, `verification_status`
- [ ] View `addresses_public` mascarando rua/número
- [ ] RLS: addresses só dono e admin; locations público read-only
- [ ] Tabela `user_residences` (vínculo user ↔ address ↔ location)

#### Etapa 1.4 — Domínios de Produto (5 dias)
Por ordem de dependência:
- [ ] `businesses` + `business_data` + `business_gallery` + `business_views` + `business_stats`
- [ ] `categories` + `business_claims` + `business_slug_history`
- [ ] `gastronomy_profiles` + `menus` + `menu_categories` + `menu_items` + `gastronomy_subscriptions`
- [ ] `classifieds` + `classified_reports`
- [ ] `professional_data` + `professional_jobs` + `professional_stats`
- [ ] `events`, `coupons`, `promotions`, `banners`
- [ ] `community_*` (posts, polls, comments, alerts, issues)
- [ ] `mobility_*` (`ride_requests`, `ride_offers`, `driver_*`, `mobility_messages`)
- [ ] `notifications`, `messages`, `conversations`
- [ ] `analytics_events`, `audit_log`
- [ ] `user_achievements`, `point_transactions`, `user_levels`

**Para cada tabela**:
- ✅ RLS habilitado
- ✅ Policy SELECT/INSERT/UPDATE/DELETE explícita
- ✅ Index nos FKs e campos consultados
- ✅ Trigger `updated_at`
- ✅ Constraints (NOT NULL, UNIQUE, CHECK via trigger se time-based)

#### Etapa 1.5 — Storage Buckets (1 dia)
- [ ] `avatars` (public, max 2MB, image/*)
- [ ] `business-gallery` (public, max 5MB)
- [ ] `classified-images` (public, max 5MB)
- [ ] `verification-docs` (private, max 10MB) — só dono + admin
- [ ] `chat-attachments` (private)
- [ ] Policies por bucket usando `storage.foldername(name)[1] = auth.uid()::text`

**Critério de pronto da Fase 1**: Build passa **sem nenhum `@ts-nocheck`** nos services CRUD.

---

### 🔴 FASE 2 — Autenticação & Sessão (3-5 dias)
**Objetivo**: Auth pronto para produção.

#### Etapa 2.1
- [ ] Configurar `auth.email.enable_confirmations = true` (não auto-confirm)
- [ ] Habilitar HIBP (leaked password protection)
- [ ] Configurar Google OAuth (e Apple se iOS)
- [ ] Página `/auth` com signup/login/forgot-password
- [ ] Página `/reset-password` (REQUERIDA pelo Supabase)
- [ ] `emailRedirectTo: ${window.location.origin}/` no signUp
- [ ] `redirectTo: ${origin}/reset-password` no resetPasswordForEmail

#### Etapa 2.2 — MFA para admins
- [ ] Habilitar TOTP no Supabase Auth
- [ ] Forçar MFA para roles `super_admin` e `admin`
- [ ] Página de configuração de MFA

#### Etapa 2.3 — Session hardening
- [ ] Logout em todos dispositivos
- [ ] Detecção de sessão suspeita
- [ ] Rate limit em `/auth/sign-in` (já existe no Supabase, validar config)

---

### 🔴 FASE 3 — Edge Functions & Pagamentos (1 semana)

#### Etapa 3.1 — Stripe Webhook
- [ ] Criar `stripe-webhook` function (faltando no config)
- [ ] Verificar assinatura: `stripe.webhooks.constructEvent(body, sig, secret)`
- [ ] Processar eventos: `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`, `invoice.payment_failed`
- [ ] Idempotência (tabela `stripe_events_processed`)
- [ ] `verify_jwt = false` no `config.toml` (webhook não tem JWT)
- [ ] Secret `STRIPE_WEBHOOK_SECRET` configurado

#### Etapa 3.2 — Hardening de todas edge functions
Para cada função em `supabase/functions/`:
- [ ] Validar `Authorization: Bearer` quando aplicável
- [ ] Validar input com Zod (Deno-compatível)
- [ ] Rate limit (Map em memória OU tabela `rate_limits`)
- [ ] Audit log em tabela `function_audit`
- [ ] Sanitização de strings (XSS-safe)
- [ ] Tratamento de erro padronizado (não vazar stack)
- [ ] CORS restritivo (não `*` em produção)
- [ ] `verify_jwt` explícito por função no `config.toml`

#### Etapa 3.3 — `nominatim-proxy`
- [ ] Cache em tabela `geocoding_cache` (TTL 30 dias)
- [ ] Rate limit por IP (1 req/s conforme política Nominatim)
- [ ] User-Agent identificável (requerido pelo OSM)

#### Etapa 3.4 — `auto-dispatch-ride`
- [ ] Corrigir tipos (atualmente quebrado)
- [ ] Limite máximo de tentativas (anti-loop)
- [ ] Logs estruturados

---

### 🟠 FASE 4 — Privacidade & LGPD (1 semana)
**Objetivo**: Conformidade legal mínima.

#### Etapa 4.1 — Documentos legais
- [ ] Política de Privacidade (publicar em `/privacidade`)
- [ ] Termos de Uso (`/termos`)
- [ ] Política de Cookies (`/cookies`)
- [ ] Banner de consentimento (geolocalização, cookies, marketing)

#### Etapa 4.2 — Direitos do titular (Art. 18 LGPD)
- [ ] Edge function `user-export-data` → ZIP com todos dados do user
- [ ] Edge function `user-delete-account` → soft-delete + purge em 30 dias
- [ ] Página `/conta/privacidade` com botões: exportar, excluir, revogar consentimentos
- [ ] Tabela `user_consents` (tipo, granted_at, revoked_at, ip)

#### Etapa 4.3 — Auditoria de acesso a PII
- [ ] Tabela `pii_access_log`
- [ ] Triggers em `addresses`, `verification_documents`, `messages` registrando acesso admin
- [ ] Mascaramento padrão (CPF: `XXX.XXX.XXX-99`, telefone: `(XX) XXXXX-XX99`)

#### Etapa 4.4 — DPO & contato
- [ ] Página `/dpo` com nome e contato do encarregado
- [ ] Email `dpo@dominio.com`
- [ ] Canal de denúncia LGPD

---

### 🟡 FASE 5 — Qualidade & Robustez (1 semana)

#### Etapa 5.1 — Remover `@ts-nocheck`
Por ordem de risco (financeiro/PII primeiro):
1. `gastronomy/billing/` (3 arquivos)
2. `profiles/multi-profile/` (7 arquivos)
3. `mobility/` (várias)
4. `admin/services/` (várias)
5. Demais

#### Etapa 5.2 — Logger condicional
- [ ] Substituir 320 `console.*` por `logger.*` (já existe)
- [ ] `logger.info` só em DEV
- [ ] `logger.error` em todos ambientes (mas sem PII)
- [ ] Integrar Sentry (ou Lovable observability)

#### Etapa 5.3 — Validação Zod universal
- [ ] Schema Zod para cada form
- [ ] Schema Zod para cada input de edge function
- [ ] Limite de tamanho em todos campos `text`

#### Etapa 5.4 — Testes
- [ ] E2E (Playwright): signup, login, criar negócio, checkout, dispatch
- [ ] Unit: services críticos (Auth, Billing, Safety)
- [ ] RLS testing: simular user A acessando dados de user B

#### Etapa 5.5 — SSOT cleanup
- [ ] Remover 4 `supabase.from()` diretos em components/pages
- [ ] Consolidar duplicações detectadas em `audit:architecture`

---

### 🟡 FASE 6 — Performance & Observabilidade (3-5 dias)

- [ ] Code-splitting por rota (`React.lazy` em todas pages)
- [ ] Lighthouse score ≥ 90 em mobile
- [ ] Bundle analyzer + tree-shaking
- [ ] Imagens: WebP/AVIF + `loading="lazy"` + dimensões explícitas
- [ ] React Query: definir `staleTime`/`gcTime` por query type
- [ ] Indexes do banco baseados em `pg_stat_statements`
- [ ] Sentry / Lovable observability ligado
- [ ] Health-check endpoint
- [ ] Status page (`/status`)

---

### 🟢 FASE 7 — Pré-Produção (3 dias)

- [ ] CSP, HSTS, X-Frame-Options no `vercel.json`
- [ ] Robots.txt + sitemap.xml dinâmico
- [ ] JSON-LD em landing pages
- [ ] OG tags + Twitter cards
- [ ] Backup automático do banco (configurar no Supabase)
- [ ] Plano de disaster recovery documentado
- [ ] Runbook de incidentes
- [ ] Smoke test em staging idêntico a prod
- [ ] Lançamento gradual (rollout por território)

---

## ✅ Checklist de Go/No-Go

Antes de publicar:

**Bloqueadores (TODOS devem ser ✅)**:
- [ ] Banco com todas as tabelas + RLS testado por terceiros
- [ ] Zero `@ts-nocheck` em código de produção
- [ ] `supabaseAdmin` removido do bundle do client
- [ ] `user_roles` + `has_role()` funcionando
- [ ] Stripe webhook validando assinatura
- [ ] Política de privacidade + termos publicados
- [ ] Mecanismo de exclusão de conta funcionando
- [ ] HIBP ativado, email confirmation forçada
- [ ] MFA para admins
- [ ] Storage buckets criados com policies
- [ ] Backup automático ativo
- [ ] Monitoramento de erros ativo

**Recomendados**:
- [ ] Lighthouse ≥ 90
- [ ] E2E dos 5 fluxos críticos passando
- [ ] CSP configurado
- [ ] Status page

---

## 📚 Documentos relacionados

Cada fase terá documento próprio em `docs/pre-launch/`:
- `FASE_1_BANCO.md` — Migrations detalhadas
- `FASE_2_AUTH.md` — Configuração de auth
- `FASE_3_EDGE_FUNCTIONS.md` — Hardening de functions
- `FASE_4_LGPD.md` — Conformidade legal
- `FASE_5_QUALIDADE.md` — Refactor e testes
- `FASE_6_PERFORMANCE.md` — Otimização
- `FASE_7_PRE_PROD.md` — Lançamento

---

## ⚖️ Riscos legais (resumo)

Sem as fases 1-4 completas, **não publicar**. Riscos concretos:

| Risco | Multa potencial |
|-------|-----------------|
| Vazamento de PII (sem RLS) | LGPD: até 2% faturamento, R$ 50M |
| Dados de cartão expostos (PCI-DSS) | Multa Adquirente + perda de credenciamento |
| Falta de exclusão de conta | LGPD Art. 18 — sanção ANPD |
| Sem política de privacidade | Procon + ANPD |
| Service role exposto | Comprometimento total → notificação ANPD em 72h |

---

*Documento mantido por: equipe de segurança Ordax*  
*Próxima revisão: ao final de cada fase*
