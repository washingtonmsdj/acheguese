# Profile SSOT — Relatório de Validação da Fase 1 (v4 — ESTADO REAL)

> **Data**: 2026-04-20
> **Versão**: 4.0 — Reflete o estado real do código após aplicação de C1–C8
> **Objetivo**: Documento único de referência — sem contradição entre seções

---

## ESTRUTURA DESTE DOCUMENTO

| Seção | Conteúdo |
|-------|----------|
| §1 | Estado atual do código (o que foi aplicado) |
| §2 | Decisões semânticas fechadas |
| §3 | Classificação dos 48 campos do banco |
| §4 | Inventário de definições de Profile |
| §5 | Arquivos alterados (diff resumido) |
| §6 | Validação: typecheck + prova de ausência de redefinições |
| §7 | Pendências para Fase 2 |
| §8 | Parecer final |

---

## §1 — ESTADO ATUAL DO CÓDIGO

### O que foi aplicado (C1–C8)

| Correção | Arquivo | Status |
|----------|---------|--------|
| C1 — 12 campos adicionados ao Profile canônico | `domain/Profile.ts` | ✅ Aplicado |
| C2 — ProfileStatus renomeado para ProfileModerationState | `domain/ProfileModerationState.ts` | ✅ Aplicado |
| C3 — ProfilePermissions movido para views/ | `views/ProfilePermissionsView.ts` | ✅ Aplicado |
| C4 — `interface Profile` em multi-profile/types.ts → `MultiProfileRecord` | `services/multi-profile/types.ts` | ✅ Aplicado |
| C5 — Redefinições locais removidas | session, community hooks/components | ✅ Aplicado |
| C5+ — 3 view models específicos criados | `views/SessionProfileView.ts` etc. | ✅ Aplicado |
| C5b — `types/Profile.ts` deletado | — | ✅ Aplicado |
| C5c — Bloco `interface Profile` removido de `core.generated.ts` | `shared/types/core.generated.ts` | ✅ Aplicado |
| C6 — ProfileRowMapper corrigido (invariantes + snapshots como parâmetro) | `persistence/ProfileRowMapper.ts` | ✅ Aplicado |
| C7 — Barrel `index.ts` atualizado | `core/profiles/index.ts` | ✅ Aplicado |
| C8 — Blindagem ESLint criada | `.eslintrc-profile-rules.json` | ✅ Aplicado |
| — — 13 arquivos de `modules/profile/` atualizados | `Profile` → `MultiProfileRecord` | ✅ Aplicado |
| — — Bug residual em MentionInput corrigido | `MentionInput.tsx` | ✅ Aplicado |

### Resultado de validação

```
npx tsc --noEmit → exit code 0 (sem erros)

grep "interface Profile {" src/**/*.{ts,tsx}:
  src/core/profiles/domain/Profile.ts       ← SSOT canônico ✅
  src/core/profiles/services/types.ts       ← @deprecated, mantido até Fase 3 ✅
  (nenhuma outra ocorrência)
```

---

## §2 — DECISÕES SEMÂNTICAS FECHADAS

### 2.1 Hierarquia de identificadores públicos

Evidências do código real:
- `buildPublicProfileUrl(username)` → `/u/:username` (produção)
- `update_profile_handle()` RPC dedicada para handle
- `@${confirmedUser!.handle}` em login (auth-business.spec.ts)
- `rota: /p/${handle}` apenas em scripts de homologação (não produção)

**Decisão final:**

| Campo | Papel | URL pública | @mention | Login | Obrigatório |
|-------|-------|-------------|----------|-------|-------------|
| `username` | identificador canônico para URL e @mention | `/u/:username` ✅ | preferido | — | não (nullable) |
| `handle` | identificador multi-profile | — | fallback | `@handle` ✅ | não (nullable) |
| `slug` | legado/compatibilidade interna | não usado em produção | — | — | não (normalizado pelo mapper) |

**Regras de uso em código novo:**
```typescript
// URL pública — usar username
const url = profile.username ? `/u/${profile.username}` : null;

// @mention — preferir username, cair em handle
const mention = profile.username ?? profile.handle ?? null;

// Login multi-profile — usar handle
const loginId = profile.handle ? `@${profile.handle}` : null;
```

**Por que username e não handle para URL?**
`buildPublicProfileUrl()` usa `username` com rota `/u/:username` — confirmado no código de produção. Scripts de homologação usam `/p/:handle` mas não há rota de produção correspondente. A URL canônica é `/u/:username`.

---

### 2.2 Hierarquia de nome de exibição

Evidências do banco:
```
Insert: name: string          ← NOT NULL, obrigatório
        display_name?: string | null  ← nullable, opcional
```

**Decisão final:**

| Campo | Papel | Obrigatório no banco | Usar em código novo |
|-------|-------|---------------------|---------------------|
| `displayName` | nome público preferido (campo que o usuário edita) | não (nullable) | ✅ sim |
| `name` | campo base obrigatório, garantia de fallback | sim (NOT NULL) | apenas como fallback |

**Regra de leitura permanente do domain:**
```typescript
// O mapper garante: displayName nunca é null no domain
displayName: row.display_name ?? row.name  // nunca null
name: row.name                              // sempre presente (NOT NULL)
```

---

### 2.3 Política de nullability e invariantes do domain

**Estratégia adotada: mapper normaliza invariantes.**

O banco permite null em campos que o domain trata como não-null. O `ProfileRowMapper.rowToDomain()` é o único ponto de normalização:

| Campo no domain | Tipo no domain | Normalização no mapper |
|-----------------|----------------|------------------------|
| `displayName` | `string` (nunca null) | `row.display_name ?? row.name` |
| `name` | `string` (nunca null) | `row.name` (NOT NULL no banco) |
| `slug` | `string` (nunca null) | `row.slug ?? row.username ?? row.id` |
| `handle` | `string \| null` | `row.handle ?? null` (null legítimo) |
| `username` | `string \| null` | `row.username ?? null` (null legítimo) |

**Não há backfill obrigatório.** Perfis legados sem `handle` ou `username` são válidos no domain — esses campos são nullable por design. O mapper garante que `displayName` e `slug` nunca chegam null ao domain.

---

### 2.4 View models — naming e shape

Todos os view models novos usam **camelCase** (shape de domínio, não shape do banco). Nenhum carrega alias legado (`telefone`, `pontos`, `suspended`, etc.).

A adaptação do shape legado (snake_case do banco) para camelCase acontece **no ponto de consumo do service**, não no componente:

```typescript
// useMessageModal.ts — adaptação no hook, não no componente
setRecipientProfile({
  id: profileData.id,
  displayName: profileData.display_name ?? profileData.name,  // normalizado aqui
  avatarUrl: profileData.avatar_url ?? null,
  verified: profileData.verified ?? false,
});

// MentionInput.tsx — adaptação no useEffect, não no JSX
const profiles: MentionableProfileView[] = rawProfiles.map((p: any) => ({
  id: p.id,
  displayName: p.display_name ?? p.name,  // normalizado aqui
  avatarUrl: p.avatar_url ?? null,
  neighborhood: p.neighborhood ?? null,
  profileType: p.profile_type ?? null,
}));
```

**`SessionProfileView` carrega `phone` (não `telefone`)** — campo canônico. O campo `name` está presente porque é necessário para compatibilidade com código legado que ainda lê `profile.name` diretamente da sessão. Não é alias — é o campo base obrigatório do banco.

---

## §3 — CLASSIFICAÇÃO DOS 48 CAMPOS DO BANCO

### Legenda

| Sigla | Significado |
|-------|-------------|
| **DOMAIN** | Campo canônico da entidade Profile |
| **SNAPSHOT** | Campo desnormalizado de outro SSOT (performance) |
| **ALIAS** | Campo duplicado com semântica idêntica a outro campo |
| **DERIVED-PERSISTED** | Campo calculado/derivado que é persistido no banco |
| **OUTRO-DOMÍNIO** | Campo que pertence a outro bounded context |

### Tabela Completa

| # | Campo no Banco | Classificação | Destino Final | Justificativa |
|---|----------------|---------------|---------------|---------------|
| 1 | `id` | **DOMAIN** | `Profile.id` | PK da entidade |
| 2 | `user_id` | **DOMAIN** | `Profile.userId` | FK para auth.users — 1 User → N Profiles |
| 3 | `profile_type` | **DOMAIN** | `Profile.profileType` | Tipo de perfil |
| 4 | `slug` | **DOMAIN** | `Profile.slug` | Legado/compatibilidade — normalizado pelo mapper |
| 5 | `username` | **DOMAIN** | `Profile.username` | Identificador canônico para URL `/u/:username` e @mention |
| 6 | `handle` | **DOMAIN** | `Profile.handle` | Identificador multi-profile — login, RPC dedicada |
| 7 | `display_name` | **DOMAIN** | `Profile.displayName` | Nome público preferido — normalizado pelo mapper |
| 8 | `name` | **DOMAIN** | `Profile.name` | Campo base NOT NULL — fallback de displayName |
| 9 | `bio` | **DOMAIN** | `Profile.bio` | Biografia |
| 10 | `avatar_url` | **DOMAIN** | `Profile.avatarUrl` | URL do avatar |
| 11 | `cover_url` | **DOMAIN** | `Profile.coverUrl` | URL da capa |
| 12 | `location_id` | **DOMAIN** | `Profile.locationId` | FK para locations (SSOT territorial) |
| 13 | `city` | **SNAPSHOT** | ProfileRow | Desnormalizado de location_id |
| 14 | `neighborhood` | **SNAPSHOT** | ProfileRow | Desnormalizado de location_id |
| 15 | `state` | **SNAPSHOT** | ProfileRow | Desnormalizado de location_id |
| 16 | `street` | **SNAPSHOT** | ProfileRow | Desnormalizado de location_id |
| 17 | `country` | **SNAPSHOT** | ProfileRow | Desnormalizado de location_id |
| 18 | `location` | **SNAPSHOT** | ProfileRow | Desnormalizado de location_id |
| 19 | `phone` | **DOMAIN** | `Profile.phone` | Telefone (PII) |
| 20 | `telefone` | **ALIAS** | ProfileRow | Alias de `phone` — legado PT-BR |
| 21 | `whatsapp` | **DOMAIN** | `Profile.whatsapp` | WhatsApp (PII) |
| 22 | `contact_email` | **DOMAIN** | `Profile.contactEmail` | Email de contato (PII) |
| 23 | `website` | **DOMAIN** | `Profile.website` | Website |
| 24 | `is_active` | **DOMAIN** | `Profile.isActive` | Soft-delete |
| 25 | `is_suspended` | **DOMAIN** | `Profile.isSuspended` | Suspensão temporária |
| 26 | `suspended` | **ALIAS** | ProfileRow | Alias de `is_suspended` — legado |
| 27 | `suspended_at` | **DOMAIN** | `Profile.suspendedAt` | Data/hora da suspensão |
| 28 | `suspended_until` | **DOMAIN** | `Profile.suspendedUntil` | Até quando |
| 29 | `suspension_reason` | **DOMAIN** | `Profile.suspensionReason` | Motivo |
| 30 | `verified` | **DOMAIN** | `Profile.verified` | Verificado (badge) |
| 31 | `verified_at` | **DOMAIN** | `Profile.verifiedAt` | Data/hora da verificação |
| 32 | `reputation` | **DOMAIN** | `Profile.reputation` | Pontuação de reputação |
| 33 | `reputation_score` | **ALIAS** | ProfileRow | Alias de `reputation` — legado |
| 34 | `pontos` | **ALIAS** | ProfileRow | Alias de `reputation` — legado PT-BR |
| 35 | `trust_score` | **DERIVED-PERSISTED** | ProfileRow | Calculado por trigger SQL — não gerenciado pelo domain |
| 36 | `is_public` | **DOMAIN** | `Profile.isPublic` | Perfil público/privado |
| 37 | `show_contact_email` | **DOMAIN** | `Profile.showContactEmail` | Privacidade |
| 38 | `show_phone` | **DOMAIN** | `Profile.showPhone` | Privacidade |
| 39 | `show_linked_profiles` | **DOMAIN** | `Profile.showLinkedProfiles` | Privacidade |
| 40 | `show_business_links` | **DOMAIN** | `Profile.showBusinessLinks` | Privacidade |
| 41 | `show_professional_links` | **DOMAIN** | `Profile.showProfessionalLinks` | Privacidade |
| 42 | `share_activity_default` | **DOMAIN** | `Profile.shareActivityDefault` | Privacidade |
| 43 | `active_ride_id` | **OUTRO-DOMÍNIO** | ProfileRow | Pertence ao domínio Mobility |
| 44 | `requires_pin_for_deliveries` | **OUTRO-DOMÍNIO** | ProfileRow | Pertence ao domínio Delivery |
| 45 | `requires_pin_for_rides` | **OUTRO-DOMÍNIO** | ProfileRow | Pertence ao domínio Mobility |
| 46 | `created_at` | **DOMAIN** | `Profile.createdAt` | Auditoria |
| 47 | `updated_at` | **DOMAIN** | `Profile.updatedAt` | Auditoria |
| 48 | `metadata` | **DOMAIN** | `Profile.metadata` | JSON flexível |

### Resumo

| Classificação | Quantidade |
|---------------|------------|
| **DOMAIN** (presentes no canônico) | 36 |
| **SNAPSHOT** | 6 |
| **ALIAS** | 4 |
| **DERIVED-PERSISTED** | 1 |
| **OUTRO-DOMÍNIO** | 3 |
| **Total** | 48 |

**Profile canônico: 36 campos** (aplicado em C1).

---

## §4 — INVENTÁRIO DE DEFINIÇÕES DE `interface Profile`

### Estado atual (após C1–C8)

| # | Arquivo | Status | Ação tomada |
|---|---------|--------|-------------|
| 1 | `src/core/profiles/domain/Profile.ts` | ✅ SSOT canônico | Mantido, corrigido (36 campos) |
| 2 | `src/core/profiles/services/types.ts` | ⚠️ `@deprecated` | Mantido até Fase 3 |
| 3 | `src/core/profiles/services/multi-profile/types.ts` | ✅ Renomeado | `interface Profile` → `MultiProfileRecord` |
| 4 | `src/core/profiles/types/Profile.ts` | ✅ Removido | Arquivo deletado |
| 5 | `src/shared/types/core.generated.ts` | ✅ Corrigido | Bloco `interface Profile` removido cirurgicamente |
| 6 | `src/core/session/types/index.ts` | ✅ Corrigido | Substituído por `SessionProfileView` |
| 7 | `src/modules/community/hooks/useMessageModal.ts` | ✅ Corrigido | Substituído por `DirectMessageRecipientView` |
| 8 | `src/modules/community/components/DirectMessageModal.tsx` | ✅ Corrigido | Substituído por `DirectMessageRecipientView` |
| 9 | `src/modules/community/components/MentionInput.tsx` | ✅ Corrigido | Substituído por `MentionableProfileView` |

**Resultado: 2 definições restantes** — SSOT canônico + legado `@deprecated`.

### View models criados (C5+)

| View model | Arquivo | Contexto de uso |
|------------|---------|-----------------|
| `SessionProfileView` | `views/SessionProfileView.ts` | Sessão ativa — `SessionData`, `SessionContext` |
| `MentionableProfileView` | `views/MentionableProfileView.ts` | Busca de @mentions em `MentionInput` |
| `DirectMessageRecipientView` | `views/DirectMessageRecipientView.ts` | Header de modal de mensagem direta |
| `ProfilePermissionsView` | `views/ProfilePermissionsView.ts` | Cache de permissões para UI (movido de domain/) |

### Guia de qual tipo usar em cada camada

| Camada | Tipo | Import |
|--------|------|--------|
| domain — lógica de negócio, services, mappers | `Profile` | `@/core/profiles/domain/Profile` |
| row — persistência, queries SQL | `ProfileRow`, `ProfileInsert`, `ProfileUpdate` | `@/core/profiles/persistence/ProfileRow` |
| view — feeds, listas genéricas | `ProfileSummary` | `@/core/profiles/views/ProfileSummary` |
| view — sessão ativa | `SessionProfileView` | `@/core/profiles/views/SessionProfileView` |
| view — @mention | `MentionableProfileView` | `@/core/profiles/views/MentionableProfileView` |
| view — mensagem direta | `DirectMessageRecipientView` | `@/core/profiles/views/DirectMessageRecipientView` |
| view — permissões UI | `ProfilePermissionsView` | `@/core/profiles/views/ProfilePermissionsView` |
| legacy — código não migrado | `LegacyProfile` | `@/core/profiles/legacy/LegacyProfile` |

---

## §5 — ARQUIVOS ALTERADOS

### Criados

| Arquivo | Conteúdo |
|---------|----------|
| `src/core/profiles/domain/ProfileModerationState.ts` | C2 — renomeado de ProfileStatus |
| `src/core/profiles/views/ProfilePermissionsView.ts` | C3 — movido de domain/ |
| `src/core/profiles/views/SessionProfileView.ts` | C5+ — view model de sessão |
| `src/core/profiles/views/MentionableProfileView.ts` | C5+ — view model de @mention |
| `src/core/profiles/views/DirectMessageRecipientView.ts` | C5+ — view model de mensagem direta |
| `.eslintrc-profile-rules.json` | C8 — blindagem ESLint |

### Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/core/profiles/domain/Profile.ts` | C1 — 36 campos, semântica documentada, v3.0 |
| `src/core/profiles/persistence/ProfileRowMapper.ts` | C6 — normalização de invariantes, snapshots como parâmetro |
| `src/core/profiles/services/multi-profile/types.ts` | C4 — `interface Profile` → `MultiProfileRecord` |
| `src/core/session/types/index.ts` | C5 — redefinição local → `SessionProfileView` |
| `src/modules/community/hooks/useMessageModal.ts` | C5 — redefinição local → `DirectMessageRecipientView` |
| `src/modules/community/components/DirectMessageModal.tsx` | C5 — redefinição local → `DirectMessageRecipientView` |
| `src/modules/community/components/MentionInput.tsx` | C5 — redefinição local → `MentionableProfileView` |
| `src/shared/types/core.generated.ts` | C5c — bloco `interface Profile` removido |
| `src/core/profiles/index.ts` | C7 — barrel atualizado |
| 13 arquivos em `src/modules/profile/` | C4 — imports `Profile` → `MultiProfileRecord` |

### Deletados

| Arquivo | Motivo |
|---------|--------|
| `src/core/profiles/types/Profile.ts` | C5b — esqueleto inútil (5 campos) |

---

## §6 — VALIDAÇÃO

### TypeScript

```
npx tsc --noEmit
Exit code: 0 — sem erros
```

### Redefinições de `interface Profile`

```
grep "interface Profile {" src/**/*.{ts,tsx}

src/core/profiles/domain/Profile.ts    ← SSOT canônico ✅
src/core/profiles/services/types.ts    ← @deprecated ✅
(nenhuma outra ocorrência)
```

### Blindagem ESLint

`.eslintrc-profile-rules.json` bloqueia:
- Import de `Profile` de `services/types*` em código novo
- Import de `Profile` de `shared/types/core.generated*`
- Redefinição de `interface Profile` ou `type Profile` fora dos arquivos autorizados

Arquivos autorizados a definir `interface Profile`:
- `src/core/profiles/domain/Profile.ts`
- `src/core/profiles/services/types.ts`
- `src/core/profiles/services/multi-profile/types.ts` (agora `MultiProfileRecord`)

---

## §7 — PENDÊNCIAS PARA FASE 2

A Fase 1 está concluída. A Fase 2 é a migração gradual dos ~30 arquivos que ainda importam `Profile` de `services/types.ts` (legado `@deprecated`).

**Escopo da Fase 2:**
- Migrar imports de `services/types.ts` para `domain/Profile.ts` arquivo por arquivo
- Validar que cada arquivo migrado continua compilando
- Ao final: remover `services/types.ts` (Fase 3)

**Não é bloqueante para uso do sistema.** O legado `@deprecated` em `services/types.ts` é compatível com o SSOT canônico — os ~30 arquivos funcionam corretamente, apenas não usam o tipo canônico ainda.

---

## §8 — PARECER FINAL

### ✅ FASE 1 APROVADA

**Estado do código**: todas as correções C1–C8 foram aplicadas e validadas.

**Evidências:**
- `npx tsc --noEmit` → exit code 0
- `interface Profile {` → 2 ocorrências (SSOT + deprecated)
- 36 campos no Profile canônico
- 3 view models específicos criados (camelCase, sem aliases legados)
- Mapper normaliza invariantes: `displayName` nunca null no domain
- Blindagem ESLint criada

**Decisões fechadas:**
- URL pública: `/u/:username` — `username` é o identificador canônico
- Login multi-profile: `@handle` — `handle` é o identificador de login
- `slug`: legado/compatibilidade, normalizado pelo mapper, não usar em código novo
- `displayName`: normalizado pelo mapper (`display_name ?? name`), nunca null no domain
- `handle` e `username`: nullable no domain por design (perfis legados legítimos)

**Próximo passo**: Fase 2 — migração gradual dos ~30 arquivos de `services/types.ts` para `domain/Profile.ts`.

---

**Status**: ✅ APROVADO
**Data**: 2026-04-20
**Versão do relatório**: 4.0
