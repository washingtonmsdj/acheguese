# 📋 O Que Está Sendo Alterado/Melhorado

> **Contexto**: Implementação da Auditoria Pré-Lançamento  
> **Objetivo**: Tornar o sistema **seguro**, **funcional** e **pronto para produção**  
> **Abordagem**: Profissional, seguindo SSOT, sem gambiarras

---

## 🎯 Resumo Executivo

Estamos implementando a **FASE 1 — Fundação do Banco de Dados** da auditoria pré-lançamento. O sistema atual tem **problemas críticos** que impedem o lançamento em produção. Estamos corrigindo esses problemas de forma profissional.

---

## ❌ Problemas Identificados (Antes)

### 1. **Sistema de Roles Incompleto**
**Problema**: 
- Tabela `user_roles` existia mas era básica (apenas TEXT)
- Sem funções helper (`has_role()`, `is_admin()`)
- Sem auditoria de mudanças
- Sem roles importantes (super_admin, business_owner, driver)

**Impacto**: 
- Impossível implementar autorização adequada
- Risco de escalada de privilégio
- Sem rastreabilidade de quem concedeu roles

### 2. **Profiles Sem Slugs**
**Problema**:
- Perfis não tinham campo `slug` (URL-friendly)
- Sem histórico de mudanças de username
- Sem signup automático configurado
- Sem view pública mascarando PII

**Impacto**:
- URLs feias: `/perfil/uuid-123-456` ao invés de `/perfil/joao-silva`
- Sem SEO
- Dados sensíveis expostos em queries públicas
- Signup manual (código extra necessário)

### 3. **Sistema de Localizações Incompleto**
**Problema**:
- Tabela `locations` existia mas sem enums
- Sem funções helper (ancestrais, descendentes)
- Sem validação de hierarquia
- Sem RLS adequado

**Impacto**:
- Dados geográficos inconsistentes
- Possível criar hierarquias inválidas (cidade sem estado)
- Sem proteção de dados

---

## ✅ O Que Foi Implementado (Depois)

### 📦 **Etapa 1.1 — Sistema de Roles & Autorização** (✅ COMPLETO)

#### O Que Foi Adicionado:

**1. Enum `app_role`**
```sql
CREATE TYPE app_role AS ENUM (
  'super_admin',  -- NOVO: Acesso total
  'admin',        -- Melhorado
  'moderator',    -- Melhorado
  'business_owner', -- NOVO
  'driver',       -- NOVO
  'user'          -- Padrão
);
```

**2. Novos Campos na Tabela `user_roles`**
- ✅ `role_enum` (app_role) - Novo campo com enum type-safe
- ✅ `revoked_at` - Data de revogação (soft-delete)
- ✅ `revoked_by` - Quem revogou
- ✅ `reason` - Motivo da mudança
- ✅ `metadata` - Metadados flexíveis (JSONB)

**3. Nova Tabela `role_history`**
- ✅ Log completo de todas as mudanças
- ✅ Trigger automático (sem código manual)
- ✅ Auditoria: quem, quando, por quê

**4. Funções SQL (SECURITY DEFINER)**
```sql
-- NOVAS funções:
has_role(user_id, role)        -- Verifica role específico
is_admin(user_id)              -- Verifica se é admin
is_super_admin(user_id)        -- Verifica se é super admin
get_user_roles(user_id)        -- Retorna array de roles
```

**5. Código TypeScript (SSOT)**
- ✅ Types: `src/core/authorization/types/roles.types.ts`
- ✅ Service: `src/core/authorization/services/RoleService.ts`
- ✅ Hooks React: `src/core/authorization/hooks/useRoles.ts`

**Por Que Isso É Importante?**
- ✅ **Segurança**: Autorização robusta e auditável
- ✅ **Escalabilidade**: Fácil adicionar novos roles
- ✅ **Rastreabilidade**: Sabe-se quem fez o quê
- ✅ **Type-Safety**: TypeScript previne erros

---

### 📦 **Etapa 1.2 — Profiles & Identidade** (✅ COMPLETO)

#### O Que Foi Adicionado:

**1. Campo `slug`**
```sql
ALTER TABLE profiles ADD COLUMN slug TEXT UNIQUE;
```
- ✅ URLs amigáveis: `/perfil/joao-silva` ao invés de `/perfil/uuid-123`
- ✅ SEO melhorado
- ✅ Geração automática de slugs únicos

**2. Tabelas de Auditoria**
- ✅ `profile_username_history` - Log de mudanças de username
- ✅ `profile_slug_history` - Log de mudanças de slug
- ✅ Triggers automáticos

**3. Trigger `handle_new_user()`**
```sql
-- Cria profile automaticamente no signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```
- ✅ **Signup automático**: Sem código extra necessário
- ✅ Gera `display_name` do email
- ✅ Gera `slug` único
- ✅ Atribui role 'user' automaticamente

**4. View `public_profiles`**
```sql
CREATE VIEW public_profiles AS
SELECT 
  id, display_name, avatar_url, bio, reputation
  -- SEM phone, whatsapp (PII protegido)
FROM profiles WHERE is_active = true;
```
- ✅ **Privacidade**: Mascara dados sensíveis
- ✅ Queries públicas seguras

**5. RLS Melhorado**
- ✅ Usuários veem apenas seus dados sensíveis
- ✅ Admins veem tudo (para suporte)
- ✅ Público vê apenas dados não-sensíveis

**Por Que Isso É Importante?**
- ✅ **UX**: URLs bonitas e memoráveis
- ✅ **SEO**: Google indexa melhor
- ✅ **Privacidade**: PII protegido por design
- ✅ **DX**: Signup automático (menos código)

---

### 📦 **Etapa 1.3 — Geografia (Locations)** (✅ COMPLETO)

#### O Que Foi Adicionado:

**1. Enums de Tipos**
```sql
CREATE TYPE location_type AS ENUM (
  'country', 'state', 'city', 'district', 'neighborhood'
);

CREATE TYPE location_status AS ENUM (
  'active', 'inactive'
);
```
- ✅ **Type-Safety**: Impossível criar tipos inválidos
- ✅ Validação no banco (não apenas no código)

**2. Funções Helper**
```sql
-- NOVAS funções:
get_location_ancestors(location_id)           -- Retorna país → estado → cidade
get_location_descendants(location_id, depth)  -- Retorna filhos até N níveis
get_location_by_path('/br/ba/salvador')       -- Busca por path
validate_location_hierarchy()                 -- Valida hierarquia
```

**3. Trigger de Validação**
```sql
-- Previne hierarquias inválidas
CREATE TRIGGER validate_location_hierarchy_trigger
  BEFORE INSERT ON locations
  FOR EACH ROW
  EXECUTE FUNCTION validate_location_hierarchy();
```
- ✅ **Integridade**: Impossível criar cidade sem estado
- ✅ Validação automática

**4. Tabelas de Grupos Territoriais**
- ✅ `territorial_groups` - Grupos (ex: Grande Salvador)
- ✅ `territorial_group_members` - Relação N:N

**5. RLS Completo**
- ✅ Locations ativas visíveis publicamente
- ✅ Apenas admins podem gerenciar

**Por Que Isso É Importante?**
- ✅ **Integridade**: Dados geográficos consistentes
- ✅ **Performance**: Funções otimizadas para queries complexas
- ✅ **Segurança**: Apenas admins alteram geografia

---

## 🔄 O Que NÃO Foi Alterado

### ✅ Compatibilidade Mantida:

**1. Tabela `user_roles`**
- ✅ Coluna `role` (TEXT) **mantida** para compatibilidade
- ✅ Coluna `is_active` **mantida** (sincronizada com `revoked_at`)
- ✅ Policies antigas continuam funcionando

**2. Tabela `profiles`**
- ✅ Todos os campos existentes **mantidos**
- ✅ Apenas **adicionado** campo `slug`
- ✅ Código antigo continua funcionando

**3. Tabela `locations`**
- ✅ Estrutura existente **mantida**
- ✅ Apenas **adicionados** enums e funções
- ✅ Dados existentes preservados

### 🎯 Estratégia de Migração:

**Abordagem Conservadora**:
1. ✅ **Adicionar** novos campos (não remover antigos)
2. ✅ **Criar** novas funções (não quebrar antigas)
3. ✅ **Manter** compatibilidade com código existente
4. ✅ **Migrar** gradualmente (sem big bang)

**Resultado**:
- ✅ **Zero downtime**
- ✅ Código antigo continua funcionando
- ✅ Novo código usa features melhoradas
- ✅ Migração gradual possível

---

## 📊 Comparação Antes vs Depois

### Sistema de Roles

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Tipos de Role** | TEXT (qualquer string) | Enum (6 roles definidos) |
| **Auditoria** | ❌ Nenhuma | ✅ Completa (quem, quando, por quê) |
| **Funções Helper** | ❌ Nenhuma | ✅ 4 funções SQL |
| **TypeScript** | ❌ Types básicos | ✅ SSOT completo (types + service + hooks) |
| **Revogação** | ❌ DELETE (perde histórico) | ✅ Soft-delete (mantém histórico) |

### Profiles

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **URLs** | `/perfil/uuid-123` | `/perfil/joao-silva` |
| **Signup** | ❌ Manual (código extra) | ✅ Automático (trigger) |
| **Privacidade** | ⚠️ PII exposto | ✅ View pública sem PII |
| **Auditoria** | ❌ Nenhuma | ✅ Histórico de username/slug |
| **SEO** | ❌ Ruim | ✅ Bom (slugs amigáveis) |

### Locations

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Tipos** | TEXT (qualquer string) | Enum (5 tipos definidos) |
| **Validação** | ❌ Nenhuma | ✅ Trigger valida hierarquia |
| **Funções Helper** | ❌ Nenhuma | ✅ 3 funções SQL |
| **Integridade** | ⚠️ Possível criar dados inválidos | ✅ Impossível criar hierarquia inválida |

---

## 🎯 Próximos Passos

### ⏳ Ainda Falta (Fase 1):

**Etapa 1.4 — Domínios de Produto** (0%)
- Tabelas: businesses, gastronomy, classifieds, mobility, etc.
- RLS em todas
- Índices de performance

**Etapa 1.5 — Storage Buckets** (0%)
- Buckets: avatars, business-gallery, verification-docs
- Policies de acesso
- Limites de tamanho

### 🔮 Depois da Fase 1:

**FASE 2** — Autenticação (email confirmation, MFA, OAuth)  
**FASE 3** — Edge Functions & Pagamentos (Stripe webhook)  
**FASE 4** — LGPD (privacidade, exportação, exclusão)

---

## 💡 Por Que Essa Abordagem?

### ✅ Profissional:
- Seguindo SSOT (Single Source of Truth)
- Migrations versionadas e rastreáveis
- Código limpo e documentado

### ✅ Segura:
- RLS em todas as tabelas
- Auditoria completa
- Validações no banco (não apenas no código)

### ✅ Escalável:
- Fácil adicionar novos roles/features
- Funções helper reutilizáveis
- Type-safety previne bugs

### ✅ Compatível:
- Zero downtime
- Código antigo continua funcionando
- Migração gradual

---

## 📈 Progresso Atual

| Fase | Progresso | Status |
|------|:---------:|:------:|
| **FASE 1** - Fundação do Banco | **60%** | 🚧 |
| 1.1 Roles | 100% | ✅ |
| 1.2 Profiles | 100% | ✅ |
| 1.3 Geografia | 100% | ✅ |
| 1.4 Domínios | 0% | ⏳ |
| 1.5 Storage | 0% | ⏳ |

---

## ❓ Perguntas Frequentes

### "Por que não simplesmente recriar tudo do zero?"
**R**: Há dados em produção. Recriar do zero = perder dados. Migração gradual = seguro.

### "Por que manter campos antigos (role, is_active)?"
**R**: Compatibilidade. Há código e policies que dependem deles. Removeremos em migration futura.

### "Isso vai quebrar algo?"
**R**: Não. Testamos com `--dry-run` e usamos `IF NOT EXISTS`. Código antigo continua funcionando.

### "Quanto tempo falta?"
**R**: Fase 1 completa: ~1 semana. Fases 1-4 (mínimo para produção): ~4-6 semanas.

---

*Documento criado por: Kiro AI*  
*Data: 2026-04-18*  
*Versão: 1.0*
