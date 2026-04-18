# 🔴 FASE 1 — Fundação do Banco de Dados

> **Status**: 🚧 EM PROGRESSO  
> **Prioridade**: CRÍTICA (BLOQUEADOR)  
> **Tempo estimado**: 1-2 semanas  
> **Responsável**: Equipe de Engenharia

---

## 📋 Objetivo

Criar a fundação sólida do banco de dados com:
- ✅ Sistema de roles e autorização funcional
- ✅ Tabelas core com RLS adequado
- ✅ Estrutura territorial (locations, addresses)
- ✅ Perfis de usuário (profiles)
- ✅ Storage buckets com policies
- ✅ Todas as tabelas de domínio necessárias

**Critério de Pronto**: Build TypeScript passa sem `@ts-nocheck` nos services CRUD.

---

## 🎯 Etapas de Implementação

### ✅ Etapa 1.1 — Sistema de Roles & Autorização (1 dia)

**Objetivo**: Criar sistema de roles robusto e seguro.

#### Arquivos a criar:
- `supabase/migrations/20260418000000_create_roles_system.sql`

#### Checklist:
- [x] Enum `app_role` com valores: `super_admin`, `admin`, `moderator`, `business_owner`, `driver`, `user`
- [x] Tabela `user_roles` (id, user_id, role, granted_by, granted_at, revoked_at)
- [x] RLS em `user_roles`: SELECT próprio + admins veem tudo
- [x] Função `has_role(_user_id UUID, _role app_role)` SECURITY DEFINER
- [x] Função `is_admin(_user_id UUID)` helper
- [x] Função `is_super_admin(_user_id UUID)` helper
- [x] Função `get_user_roles(_user_id UUID)` helper
- [x] Tabela `role_history` para auditoria
- [x] Trigger automático para log de mudanças
- [x] Índices de performance
- [x] Comentários em todas as tabelas/funções
- [x] Seed: role 'user' padrão para usuários existentes
- [x] Types TypeScript (`roles.types.ts`)
- [x] Service TypeScript (`RoleService.ts`)
- [x] Hooks React (`useRoles.ts`)

#### Testes:
```sql
-- Testar has_role
SELECT has_role(auth.uid(), 'admin');

-- Testar RLS
SELECT * FROM user_roles; -- deve ver apenas próprios roles
```

---

### 🚧 Etapa 1.2 — Profiles & Identidade (2 dias)

**Objetivo**: Sistema de perfis unificado e seguro.

#### Arquivos a criar:
- `supabase/migrations/20260418010000_create_profiles_system.sql`
- `src/core/profiles/types/profile.types.ts` (atualizar)
- `src/core/profiles/services/profile.service.ts` (atualizar)

#### Checklist:
- [ ] Tabela `profiles` com campos:
  - `id` (PK)
  - `user_id` (FK auth.users, UNIQUE)
  - `profile_type` (personal, business, professional, driver)
  - `display_name`, `username` (UNIQUE), `slug` (UNIQUE)
  - `avatar_url`, `bio`
  - `phone`, `whatsapp` (criptografados)
  - `location_id` (FK locations)
  - `is_active`, `is_verified`, `is_suspended`
  - `reputation`, `points`
  - `created_at`, `updated_at`
- [ ] Trigger `handle_new_user()` cria profile automaticamente no signup
- [ ] Tabela `profile_username_history` (auditoria de mudanças)
- [ ] Tabela `profile_slug_history` (auditoria de mudanças)
- [ ] RLS:
  - SELECT: público vê `display_name`, `avatar_url`, `slug`, `bio`
  - SELECT: PII (phone, whatsapp) só dono + admin
  - UPDATE: só dono (exceto campos admin-only)
  - DELETE: nunca (soft-delete via `is_active`)
- [ ] View `public_profiles` mascarando PII
- [ ] Índices: `user_id`, `username`, `slug`, `profile_type`, `is_active`

#### Testes:
```sql
-- Criar usuário de teste
-- Verificar se profile foi criado automaticamente
-- Testar RLS: user A não vê phone de user B
```

---

### ⏳ Etapa 1.3 — Geografia (locations, addresses) (2 dias)

**Objetivo**: Sistema territorial hierárquico e seguro.

#### Arquivos a criar:
- `supabase/migrations/20260418020000_create_locations_system.sql`
- `supabase/migrations/20260418020001_create_addresses_system.sql`

#### Checklist:
- [ ] Tabela `locations` (hierarquia):
  - `id`, `parent_id` (self-reference)
  - `type` (country, state, city, district, neighborhood)
  - `name`, `slug`, `code`
  - `geometry` (PostGIS GEOMETRY)
  - `metadata` (JSONB)
  - `is_active`
- [ ] Tabela `addresses`:
  - `id`, `location_id` (FK locations)
  - `street`, `number`, `complement`
  - `postal_code`, `coordinates` (POINT)
  - `address_precision` (exact, approximate, neighborhood)
  - `verification_status` (unverified, pending, verified, rejected)
  - `verified_at`, `verified_by`
- [ ] Tabela `user_residences`:
  - `id`, `user_id`, `address_id`
  - `is_primary`, `verified_at`
  - `verification_method` (document, utility_bill, manual)
- [ ] View `addresses_public` (mascara rua/número)
- [ ] RLS:
  - `locations`: público read-only
  - `addresses`: só dono + admin
  - `user_residences`: só dono + admin
- [ ] Índices espaciais (PostGIS)

---

### ⏳ Etapa 1.4 — Domínios de Produto (5 dias)

**Objetivo**: Criar todas as tabelas de domínio necessárias.

#### Sub-etapa 1.4.1 — Business (1 dia)
- [ ] `businesses` (tabela principal)
- [ ] `business_data` (dados estendidos)
- [ ] `business_gallery` (imagens)
- [ ] `business_views` (analytics)
- [ ] `business_stats` (estatísticas agregadas)
- [ ] `business_claims` (reivindicações)
- [ ] `business_slug_history` (auditoria)
- [ ] `categories` (categorias de negócio)

#### Sub-etapa 1.4.2 — Gastronomia (1 dia)
- [ ] `gastronomy_profiles`
- [ ] `menus`
- [ ] `menu_categories`
- [ ] `menu_items`
- [ ] `gastronomy_subscriptions` (migrar para `business_subscriptions`)

#### Sub-etapa 1.4.3 — Classifieds & Professional (1 dia)
- [ ] `classifieds`
- [ ] `classified_reports`
- [ ] `professional_data`
- [ ] `professional_jobs`
- [ ] `professional_stats`

#### Sub-etapa 1.4.4 — Community (1 dia)
- [ ] `community_posts`
- [ ] `community_polls`
- [ ] `community_comments`
- [ ] `community_alerts`
- [ ] `community_issues`

#### Sub-etapa 1.4.5 — Mobility (1 dia)
- [ ] `ride_requests`
- [ ] `ride_offers`
- [ ] `driver_profiles`
- [ ] `driver_vehicles`
- [ ] `driver_documents`
- [ ] `mobility_messages`

#### Sub-etapa 1.4.6 — Outros domínios
- [ ] `events`, `coupons`, `promotions`, `banners`
- [ ] `notifications`, `messages`, `conversations`
- [ ] `analytics_events`, `audit_log`
- [ ] `user_achievements`, `point_transactions`, `user_levels`

**Para CADA tabela**:
- ✅ RLS habilitado
- ✅ Policies explícitas (SELECT, INSERT, UPDATE, DELETE)
- ✅ Índices em FKs e campos consultados
- ✅ Trigger `updated_at`
- ✅ Constraints (NOT NULL, UNIQUE, CHECK)
- ✅ Comentários descritivos

---

### ⏳ Etapa 1.5 — Storage Buckets (1 dia)

**Objetivo**: Criar buckets de storage com policies adequadas.

#### Arquivos a criar:
- `supabase/migrations/20260418030000_create_storage_buckets.sql`

#### Checklist:
- [ ] Bucket `avatars`:
  - Public read
  - Max 2MB
  - Tipos: image/jpeg, image/png, image/webp
  - Path: `{user_id}/avatar.{ext}`
- [ ] Bucket `business-gallery`:
  - Public read
  - Max 5MB
  - Path: `{business_id}/{image_id}.{ext}`
- [ ] Bucket `classified-images`:
  - Public read
  - Max 5MB
  - Path: `{classified_id}/{image_id}.{ext}`
- [ ] Bucket `verification-docs`:
  - Private (só dono + admin)
  - Max 10MB
  - Path: `{user_id}/docs/{doc_id}.{ext}`
- [ ] Bucket `chat-attachments`:
  - Private (só participantes)
  - Max 10MB
  - Path: `{conversation_id}/{message_id}/{file_id}.{ext}`

#### Policies por bucket:
```sql
-- Exemplo para avatars
CREATE POLICY "Avatar upload by owner"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Avatar read by all"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

---

## 🧪 Testes de Validação

### Testes de RLS:
```sql
-- Criar 2 usuários de teste
-- User A tenta acessar dados de User B
-- Verificar que RLS bloqueia corretamente
```

### Testes de Funções:
```sql
-- Testar has_role() com diferentes roles
-- Testar is_admin() com admin e não-admin
-- Testar trigger handle_new_user()
```

### Testes de Storage:
```bash
# Upload de avatar
# Verificar que só dono pode fazer upload
# Verificar que todos podem ler
```

---

## 📊 Progresso

| Etapa | Status | Progresso | Bloqueadores |
|-------|:------:|:---------:|--------------|
| 1.1 Roles | ✅ | 100% | - |
| 1.2 Profiles | ✅ | 100% | - |
| 1.3 Geografia | 🚧 | 0% | - |
| 1.4 Domínios | ⏳ | 0% | Aguardando 1.3 |
| 1.5 Storage | ⏳ | 0% | Aguardando 1.4 |

---

## 🚨 Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Migrations quebram banco existente | ALTO | BAIXO | Testar em staging primeiro |
| RLS muito restritivo | MÉDIO | MÉDIO | Testes extensivos |
| Performance de queries | MÉDIO | MÉDIO | Índices adequados |
| Dados legados incompatíveis | ALTO | MÉDIO | Migration de dados separada |

---

## 📝 Notas de Implementação

### Ordem de Criação (IMPORTANTE):
1. **Roles** (nada depende, tudo usa)
2. **Profiles** (depende de roles)
3. **Locations** (independente)
4. **Addresses** (depende de locations)
5. **Domínios** (dependem de profiles, locations, addresses)
6. **Storage** (independente, mas usa user_id)

### Padrões a Seguir:
- ✅ Sempre usar `gen_random_uuid()` para PKs
- ✅ Sempre usar `TIMESTAMPTZ` (não `TIMESTAMP`)
- ✅ Sempre criar índice em FKs
- ✅ Sempre habilitar RLS
- ✅ Sempre criar trigger `updated_at`
- ✅ Sempre adicionar comentários
- ✅ Sempre usar `ON DELETE CASCADE` ou `ON DELETE SET NULL` explicitamente

### Convenções de Nomenclatura:
- Tabelas: `snake_case` plural
- Colunas: `snake_case`
- Índices: `idx_{table}_{column}`
- Policies: Descrição em português
- Funções: `snake_case` com prefixo do domínio

---

## 🔄 Próximos Passos

Após conclusão da Fase 1:
1. ✅ Remover `@ts-nocheck` dos services
2. ✅ Atualizar types TypeScript
3. ✅ Atualizar services para usar novas tabelas
4. ✅ Testes E2E dos fluxos críticos
5. ➡️ Iniciar **FASE 2 — Autenticação**

---

*Documento mantido por: Equipe de Engenharia*  
*Última atualização: 2026-04-18*
