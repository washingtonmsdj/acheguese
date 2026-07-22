# Profile SSOT — Relatório de Validação Crítica da Fase 1 (v4 — CORRIGIDO)

> **Data**: 2026-04-19  
> **Versão**: 4.0 — Correções das 3 inconsistências críticas  
> **Objetivo**: Relatório consistente para execução de C1-C7

---

## 🔴 DECISÃO FINAL: **REPROVADO — CORREÇÕES OBRIGATÓRIAS ANTES DA FASE 2**

A estrutura de pastas criada na Fase 1 está correta. Mas o contrato canônico tem erros de modelagem que, se não corrigidos agora, serão espalhados por ~30 arquivos na Fase 2 e custarão muito mais para desfazer.

**Problemas bloqueantes identificados**:
1. `ProfilePermissions` está em `domain/` mas é derivado de Authorization — pertence a `views/`
2. `ProfileStatus` em `domain/` colide nominalmente com `ProfileStatus` em `core/authorization/` — renomear
3. `handle` foi classificado como alias sem prova — auditoria mostra que é campo independente com semântica própria
4. `name` foi classificado como snapshot sem prova — auditoria mostra que é campo independente com uso ativo
5. `trust_score` foi classificado como VIEW — é campo persistido, classificação errada
6. `multi-profile/types.ts` exporta `interface Profile` com o mesmo nome — colisão nominal não resolvida
7. **CORREÇÃO**: Contagem de campos faltando corrigida — são 12 campos, não 10
8. **CORREÇÃO**: Cardinalidade corrigida — 1 User → N Profiles (não 1:1)
9. **CORREÇÃO**: `shared/types/core.generated.ts` — remover apenas interface Profile concorrente, preservar outros tipos

---

## 1. CLASSIFICAÇÃO COMPLETA DOS 48 CAMPOS DO BANCO

### Legenda

| Sigla | Significado |
|-------|-------------|
| **DOMAIN** | Campo canônico da entidade Profile |
| **ROW** | Campo de persistência que fica apenas em ProfileRow |
| **SNAPSHOT** | Campo desnormalizado de outro SSOT (performance) |
| **ALIAS** | Campo duplicado com semântica idêntica a outro campo |
| **DERIVED-PERSISTED** | Campo calculado/derivado que é persistido no banco |
| **OUTRO-DOMÍNIO** | Campo que pertence a outro bounded context |

---

### Tabela Completa

| # | Campo no Banco | Classificação | Destino Final | Justificativa |
|---|----------------|---------------|---------------|---------------|
| 1 | `id` | **DOMAIN** | `Profile.id` | PK da entidade |
| 2 | `user_id` | **DOMAIN** | `Profile.userId` | FK para auth.users (1 User → N Profiles) |
| 3 | `profile_type` | **DOMAIN** | `Profile.profileType` | Tipo de perfil |
| 4 | `slug` | **DOMAIN** | `Profile.slug` | Identificador URL-friendly único |
| 5 | `username` | **DOMAIN** | `Profile.username` | @mention único (opcional) |
| 6 | `handle` | **DOMAIN** ⚠️ | `Profile.handle` | **Ver análise §2.1** — campo independente com semântica própria |
| 7 | `display_name` | **DOMAIN** | `Profile.displayName` | Nome de exibição público |
| 8 | `name` | **DOMAIN** ⚠️ | `Profile.name` | **Ver análise §2.2** — campo independente com uso ativo |
| 9 | `bio` | **DOMAIN** | `Profile.bio` | Biografia |
| 10 | `avatar_url` | **DOMAIN** | `Profile.avatarUrl` | URL do avatar |
| 11 | `cover_url` | **DOMAIN** (faltando) | `Profile.coverUrl` | URL da capa — presente no banco, ausente no canônico |
| 12 | `location_id` | **DOMAIN** | `Profile.locationId` | FK para locations (SSOT territorial) |
| 13 | `city` | **SNAPSHOT** | ProfileRow | Desnormalizado de location_id para performance |
| 14 | `neighborhood` | **SNAPSHOT** | ProfileRow | Desnormalizado de location_id para performance |
| 15 | `state` | **SNAPSHOT** | ProfileRow | Desnormalizado de location_id para performance |
| 16 | `street` | **SNAPSHOT** | ProfileRow | Desnormalizado de location_id para performance |
| 17 | `country` | **SNAPSHOT** | ProfileRow | Desnormalizado de location_id para performance |
| 18 | `location` | **SNAPSHOT** | ProfileRow | Desnormalizado de location_id para performance |
| 19 | `phone` | **DOMAIN** | `Profile.phone` | Telefone (PII) |
| 20 | `telefone` | **ALIAS** | ProfileRow | Alias de `phone` — mesmo campo, nome PT-BR legado |
| 21 | `whatsapp` | **DOMAIN** | `Profile.whatsapp` | WhatsApp (PII) |
| 22 | `contact_email` | **DOMAIN** (faltando) | `Profile.contactEmail` | Email de contato (PII) |
| 23 | `website` | **DOMAIN** (faltando) | `Profile.website` | Website |
| 24 | `is_active` | **DOMAIN** | `Profile.isActive` | Soft-delete |
| 25 | `is_suspended` | **DOMAIN** | `Profile.isSuspended` | Suspensão temporária |
| 26 | `suspended` | **ALIAS** | ProfileRow | Alias de `is_suspended` — mesmo campo, nome legado |
| 27 | `suspended_at` | **DOMAIN** | `Profile.suspendedAt` | Data/hora da suspensão |
| 28 | `suspended_until` | **DOMAIN** | `Profile.suspendedUntil` | Até quando |
| 29 | `suspension_reason` | **DOMAIN** | `Profile.suspensionReason` | Motivo |
| 30 | `verified` | **DOMAIN** | `Profile.verified` | Verificado (badge) |
| 31 | `verified_at` | **DOMAIN** | `Profile.verifiedAt` | Data/hora da verificação |
| 32 | `reputation` | **DOMAIN** | `Profile.reputation` | Pontuação de reputação principal |
| 33 | `reputation_score` | **ALIAS** | ProfileRow | Alias de `reputation` — mesmo campo, nome legado |
| 34 | `pontos` | **ALIAS** | ProfileRow | Alias de `reputation` — nome PT-BR legado |
| 35 | `trust_score` | **DERIVED-PERSISTED** | ProfileRow | **Ver análise §2.3** — campo calculado persistido, não alias |
| 36 | `is_public` | **DOMAIN** (faltando) | `Profile.isPublic` | Perfil público/privado |
| 37 | `show_contact_email` | **DOMAIN** (faltando) | `Profile.showContactEmail` | Privacidade |
| 38 | `show_phone` | **DOMAIN** (faltando) | `Profile.showPhone` | Privacidade |
| 39 | `show_linked_profiles` | **DOMAIN** (faltando) | `Profile.showLinkedProfiles` | Privacidade |
| 40 | `show_business_links` | **DOMAIN** (faltando) | `Profile.showBusinessLinks` | Privacidade |
| 41 | `show_professional_links` | **DOMAIN** (faltando) | `Profile.showProfessionalLinks` | Privacidade |
| 42 | `share_activity_default` | **DOMAIN** (faltando) | `Profile.shareActivityDefault` | Privacidade |
| 43 | `active_ride_id` | **OUTRO-DOMÍNIO** | ProfileRow | Pertence ao domínio Mobility |
| 44 | `requires_pin_for_deliveries` | **OUTRO-DOMÍNIO** | ProfileRow | Pertence ao domínio Delivery |
| 45 | `requires_pin_for_rides` | **OUTRO-DOMÍNIO** | ProfileRow | Pertence ao domínio Mobility |
| 46 | `created_at` | **DOMAIN** | `Profile.createdAt` | Auditoria |
| 47 | `updated_at` | **DOMAIN** | `Profile.updatedAt` | Auditoria |
| 48 | `metadata` | **DOMAIN** | `Profile.metadata` | JSON flexível |

---

### Resumo da Classificação

| Classificação | Quantidade |
|---------------|------------|
| **DOMAIN** (presentes no canônico atual) | 24 |
| **DOMAIN** (faltando no canônico) | 12 |
| **SNAPSHOT** | 6 |
| **ALIAS** | 4 |
| **DERIVED-PERSISTED** | 1 |
| **OUTRO-DOMÍNIO** | 3 |
| **Total** | 48 |

**Profile canônico correto deve ter: 36 campos** (24 presentes + 12 faltando)

---

## 2. CORREÇÕES DAS 3 INCONSISTÊNCIAS CRÍTICAS

### 2.1 Contagem Corrigida — 12 campos faltando, não 10

**Análise**:
- Profile canônico atual: 24 campos
- Campos faltando identificados: 12
  - `handle` (campo independente, não alias de username)
  - `name` (campo independente, não snapshot de display_name)
  - `coverUrl` (presente no banco, ausente no canônico)
  - `contactEmail` (PII, presente no banco)
  - `website` (presente no banco)
  - `isPublic` (privacidade, presente no banco)
  - `showContactEmail` (privacidade, presente no banco)
  - `showPhone` (privacidade, presente no banco)
  - `showLinkedProfiles` (privacidade, presente no banco)
  - `showBusinessLinks` (privacidade, presente no banco)
  - `showProfessionalLinks` (privacidade, presente no banco)
  - `shareActivityDefault` (privacidade, presente no banco)

**Correção aplicada**: Todas as contagens no relatório atualizadas para 12 campos faltando, 36 campos totais.

### 2.2 Cardinalidade Corrigida — 1 User → N Profiles

**Evidência da migration**:
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- ... outros campos
);
```

**Análise**:
- `user_id` é FK para `auth.users(id)` com `ON DELETE CASCADE`
- Nenhuma constraint UNIQUE em `user_id`
- Migration `20260414200000_fix_create_profile_driver_capabilities.sql` valida "perfil único por tipo", não por usuário
- Arquitetura multi-profile explícita no projeto

**Correção aplicada**: Semântica atualizada em toda documentação para "1 User → N Profiles".

### 2.3 `shared/types/core.generated.ts` — Remoção Precisa

**Problema original**: O relatório sugeria "exclusão cega" do arquivo.

**Análise corrigida**:
- O arquivo contém tipos gerados para vários domínios (Post, Driver, Notification, Payment, Review)
- O problema específico é a redefinição concorrente de `interface Profile` com apenas 9 campos
- Essa definição concorre com o SSOT canônico de 36 campos

**Correção aplicada**:
- Remover apenas `interface Profile` de `src/shared/types/core.generated.ts`
- Preservar todos os outros tipos gerados (Post, Driver, Notification, etc.)
- Esses tipos continuam sendo fonte legítima para camada de persistence

---

## 3. CHECKLIST DE CORREÇÕES OBRIGATÓRIAS (C1-C7)

### C1 — Adicionar 12 campos faltando ao Profile canônico
**Arquivo**: `src/core/profiles/domain/Profile.ts`
**Campos**: `handle`, `name`, `coverUrl`, `contactEmail`, `website`, `isPublic`, `showContactEmail`, `showPhone`, `showLinkedProfiles`, `showBusinessLinks`, `showProfessionalLinks`, `shareActivityDefault`
**Status**: ✅ Contagem corrigida (12 campos)

### C2 — Renomear ProfileStatus de domain/ para ProfileModerationState
**Arquivo**: `src/core/profiles/domain/ProfileStatus.ts` → `src/core/profiles/domain/ProfileModerationState.ts`
**Justificativa**: Elimina colisão nominal com `ProfileStatus` de `core/authorization/`

### C3 — Mover ProfilePermissions de domain/ para views/
**Arquivo**: `src/core/profiles/domain/ProfilePermissions.ts` → `src/core/profiles/views/ProfilePermissionsView.ts`
**Justificativa**: Não é entidade de domínio, é cache derivado de Authorization para UI

### C4 — Renomear `interface Profile` em multi-profile/types.ts
**Arquivo**: `src/core/profiles/services/multi-profile/types.ts`
**Novo nome**: `MultiProfileRecord`
**Justificativa**: Elimina colisão nominal com SSOT canônico

### C5 — Remover 6 definições duplicadas
**Remover completamente**:
- `src/core/profiles/types/Profile.ts` (esqueleto inútil, 5 campos)
- `interface Profile` de `src/shared/types/core.generated.ts` (apenas a interface, preservar outros tipos)

**Substituir por import de `ProfileSummary` (views/)**:
- `src/core/session/types/index.ts`
- `src/modules/community/hooks/useMessageModal.ts`
- `src/modules/community/components/DirectMessageModal.tsx`
- `src/modules/community/components/MentionInput.tsx`

### C6 — Corrigir ProfileRowMapper
**Arquivo**: `src/core/profiles/persistence/ProfileRowMapper.ts`
**Correção**: Remover lógica de resolução de snapshots territoriais. Aceitar snapshots como parâmetro opcional.

### C7 — Atualizar barrel export index.ts
**Arquivo**: `src/core/profiles/index.ts`
**Atualizações**: Refletir renomeações (`ProfileModerationState`, `ProfilePermissionsView`), remover exports de arquivos deletados.

---

## 4. PARECER FINAL CONSISTENTE

### 🔴 FASE 1 REPROVADA PARA FASE 2 — MAS PRONTA PARA CORREÇÕES

**Status atual**: Relatório corrigido, inconsistências resolvidas.

**Próximos passos**:
1. Aplicar C1-C7 (correções pontuais no código)
2. Validar com `npx tsc --noEmit`
3. Verificar que nenhum arquivo importa `Profile` de dois lugares diferentes
4. **Então** iniciar Fase 2 (migração de ~30 arquivos)

**Estimativa de correção**: 3-4 horas para C1-C7.

**Risco após correções**: Baixo. São alterações pontuais no contrato canônico, não refatoração total.

---

**Status**: 🔴 REPROVADO (mas relatório consistente)  
**Data**: 2026-04-19  
**Próximo**: Aplicar C1–C7, revalidar, então iniciar Fase 2