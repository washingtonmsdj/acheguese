# Profile SSOT — Plano de Correções da Fase 1

> **Data**: 2026-04-19  
> **Status**: 🟡 APROVADO COM CORREÇÕES  
> **Estimativa**: 2-3 horas

---

## 📋 5 CORREÇÕES OBRIGATÓRIAS

### ✅ Correção 1: Adicionar 8 Campos Canônicos Faltando

**Arquivo**: `src/core/profiles/domain/Profile.ts`

**Adicionar após `avatarUrl`**:
```typescript
/** URL da capa/banner */
coverUrl: string | null;
```

**Adicionar após `whatsapp`**:
```typescript
/** Email de contato (PII) */
contactEmail: string | null;

/** Website */
website: string | null;
```

**Adicionar nova seção antes de AUDITORIA**:
```typescript
// ══════════════════════════════════════════════════════════════════════════
// PRIVACIDADE
// ══════════════════════════════════════════════════════════════════════════

/** Se o perfil é público */
isPublic: boolean;

/** Mostrar email de contato */
showContactEmail: boolean;

/** Mostrar telefone */
showPhone: boolean;

/** Mostrar perfis linkados */
showLinkedProfiles: boolean;

/** Mostrar links de negócios */
showBusinessLinks: boolean;

/** Mostrar links profissionais */
showProfessionalLinks: boolean;

/** Compartilhar atividade por padrão */
shareActivityDefault: boolean;
```

**Atualizar `createDefaultProfile()`**:
```typescript
export function createDefaultProfile(
  userId: string,
  displayName: string,
  slug: string
): Omit<Profile, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    userId,
    profileType: 'personal',
    slug,
    username: null,
    displayName,
    bio: null,
    avatarUrl: null,
    coverUrl: null, // NOVO
    locationId: null,
    phone: null,
    whatsapp: null,
    contactEmail: null, // NOVO
    website: null, // NOVO
    isActive: true,
    isSuspended: false,
    suspendedAt: null,
    suspendedUntil: null,
    suspensionReason: null,
    verified: false,
    verifiedAt: null,
    reputation: 0,
    isPublic: true, // NOVO
    showContactEmail: false, // NOVO
    showPhone: false, // NOVO
    showLinkedProfiles: true, // NOVO
    showBusinessLinks: true, // NOVO
    showProfessionalLinks: true, // NOVO
    shareActivityDefault: true, // NOVO
    metadata: {},
  };
}
```

---

### ✅ Correção 2: Documentar ProfilePermissions e ProfileStatus

**Arquivo**: `src/core/profiles/domain/ProfilePermissions.ts`

**Substituir comentário inicial**:
```typescript
/**
 * ProfilePermissions — Value Object de Permissões
 * 
 * ⚠️ IMPORTANTE: Este é um CACHE de permissões para UI.
 * O SSOT de autorização é core/authorization.
 * ProfilePermissions e uma previa derivada para UI, nunca uma autorizacao.
 * 
 * NÃO use para decisões de autorização.
 * Use apenas para exibir/ocultar elementos de UI.
 * 
 * Define o que um perfil pode fazer no sistema.
 * Regras de domínio específicas ficam nos respectivos módulos.
 * 
 * @version 2.0.0
 */
```

**Arquivo**: `src/core/profiles/domain/ProfileStatus.ts`

**Substituir comentário inicial**:
```typescript
/**
 * ProfileStatus — Value Object de Status
 * 
 * Encapsula o estado de ativação/suspensão de um perfil.
 * 
 * ⚠️ NOTA: core/authorization tem um ProfileStatus com subset de campos (isActive, isSuspended, isBlocked).
 * Este ProfileStatus é o SUPERSET com dados de auditoria (suspendedAt, suspensionReason, suspendedUntil).
 * 
 * Authorization usa subset para decisões.
 * Profiles usa superset para dados completos.
 * 
 * @version 2.0.0
 */
```

---

### ✅ Correção 3: Adicionar Snapshots ao ProfileRowMapper

**Arquivo**: `src/core/profiles/persistence/ProfileRowMapper.ts`

**Adicionar comentário explicativo**:
```typescript
/**
 * ProfileRowMapper — Mapper entre ProfileRow (banco) e Profile (domínio)
 * 
 * SNAPSHOTS TERRITORIAIS:
 * - city, neighborhood, state, street, country, location são desnormalizados de location_id
 * - São mantidos no banco para performance (evitar JOINs)
 * - NÃO fazem parte do Profile canônico (SSOT é location_id)
 * - Devem ser populados ao salvar (toRow) a partir de Location
 * 
 * ALIASES LEGADOS:
 * - handle → username
 * - name → display_name
 * - telefone → phone
 * - suspended → is_suspended
 * - reputation_score, pontos → reputation
 * 
 * CAMPOS DE OUTROS DOMÍNIOS:
 * - active_ride_id (Mobility)
 * - requires_pin_for_* (Delivery/Mobility)
 * 
 * @version 2.0.0
 */
```

**Atualizar método `toDomain()`** para ignorar snapshots:
```typescript
static toDomain(row: ProfileRow): Profile {
  return {
    id: row.id,
    userId: row.user_id,
    profileType: row.profile_type as ProfileType,
    slug: row.slug ?? '',
    username: row.username ?? row.handle, // Fallback para alias
    displayName: row.display_name ?? row.name, // Fallback para alias
    bio: row.bio,
    avatarUrl: row.avatar_url,
    coverUrl: row.cover_url, // NOVO
    locationId: row.location_id,
    // NÃO mapear: city, neighborhood, state, street, country, location (snapshots)
    phone: row.phone ?? row.telefone, // Fallback para alias
    whatsapp: row.whatsapp,
    contactEmail: row.contact_email, // NOVO
    website: row.website, // NOVO
    isActive: row.is_active,
    isSuspended: row.is_suspended || row.suspended, // Fallback para alias
    suspendedAt: row.suspended_at,
    suspendedUntil: row.suspended_until,
    suspensionReason: row.suspension_reason,
    verified: row.verified,
    verifiedAt: row.verified_at,
    reputation: row.reputation,
    isPublic: row.is_public ?? true, // NOVO
    showContactEmail: row.show_contact_email ?? false, // NOVO
    showPhone: row.show_phone ?? false, // NOVO
    showLinkedProfiles: row.show_linked_profiles ?? true, // NOVO
    showBusinessLinks: row.show_business_links ?? true, // NOVO
    showProfessionalLinks: row.show_professional_links ?? true, // NOVO
    shareActivityDefault: row.share_activity_default ?? true, // NOVO
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  };
}
```

**Adicionar método `toRowWithSnapshots()`**:
```typescript
/**
 * Converte Profile para ProfileRow com snapshots territoriais
 * 
 * @param profile Profile canônico
 * @param location Location resolvido de location_id (para popular snapshots)
 */
static toRowWithSnapshots(
  profile: Profile,
  location?: { city?: string; neighborhood?: string; state?: string; street?: string; country?: string; fullName?: string }
): Partial<ProfileRow> {
  return {
    id: profile.id,
    user_id: profile.userId,
    profile_type: profile.profileType,
    slug: profile.slug,
    username: profile.username,
    handle: profile.username, // Alias
    display_name: profile.displayName,
    name: profile.displayName, // Alias
    bio: profile.bio,
    avatar_url: profile.avatarUrl,
    cover_url: profile.coverUrl,
    location_id: profile.locationId,
    // Snapshots territoriais (desnormalizados)
    city: location?.city ?? null,
    neighborhood: location?.neighborhood ?? null,
    state: location?.state ?? null,
    street: location?.street ?? null,
    country: location?.country ?? null,
    location: location?.fullName ?? null,
    phone: profile.phone,
    telefone: profile.phone, // Alias
    whatsapp: profile.whatsapp,
    contact_email: profile.contactEmail,
    website: profile.website,
    is_active: profile.isActive,
    is_suspended: profile.isSuspended,
    suspended: profile.isSuspended, // Alias
    suspended_at: profile.suspendedAt,
    suspended_until: profile.suspendedUntil,
    suspension_reason: profile.suspensionReason,
    verified: profile.verified,
    verified_at: profile.verifiedAt,
    reputation: profile.reputation,
    reputation_score: profile.reputation, // Alias
    pontos: profile.reputation, // Alias
    is_public: profile.isPublic,
    show_contact_email: profile.showContactEmail,
    show_phone: profile.showPhone,
    show_linked_profiles: profile.showLinkedProfiles,
    show_business_links: profile.showBusinessLinks,
    show_professional_links: profile.showProfessionalLinks,
    share_activity_default: profile.shareActivityDefault,
    created_at: profile.createdAt,
    updated_at: profile.updatedAt,
    metadata: profile.metadata as any,
    // Campos de outros domínios (não tocar)
    // active_ride_id, requires_pin_for_* mantidos como estão
  };
}
```

---

### ✅ Correção 4: Remover 6 Definições Duplicadas

**Deletar arquivos**:
```bash
rm src/core/profiles/types/Profile.ts
```

**Remover Profile de `src/shared/types/core.generated.ts`**:
```typescript
// REMOVER:
export interface Profile {
  id: string;
  email: string;
  // ...
}
```

**Substituir redefinições locais por import**:

1. `src/modules/community/hooks/useMessageModal.ts`:
```typescript
// ANTES:
interface Profile {
  id: string;
  name: string;
  avatar_url?: string;
}

// DEPOIS:
import type { ProfileSummary } from '@/core/profiles/views/ProfileSummary';
// Usar ProfileSummary ao invés de Profile local
```

2. `src/modules/community/components/DirectMessageModal.tsx`:
```typescript
// ANTES:
interface Profile {
  id: string;
  name: string;
  avatar_url?: string;
}

// DEPOIS:
import type { ProfileSummary } from '@/core/profiles/views/ProfileSummary';
```

3. `src/modules/community/components/MentionInput.tsx`:
```typescript
// ANTES:
interface Profile {
  id: string;
  name: string;
  avatar_url?: string;
}

// DEPOIS:
import type { ProfileSummary } from '@/core/profiles/views/ProfileSummary';
```

4. `src/core/session/types/index.ts`:
```typescript
// ANTES:
export interface Profile {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string;
}

// DEPOIS:
import type { ProfileSummary } from '@/core/profiles/views/ProfileSummary';
export type { ProfileSummary as Profile }; // Re-export com alias
```

---

### ✅ Correção 5: Migrar 3 Arquivos Reais

**Lote 1** (validação do SSOT):

1. **`src/core/profiles/mappers/ProfileMapper.ts`**:
```typescript
// ANTES:
import type { Profile } from "../services/types";

// DEPOIS:
import type { Profile } from "../domain/Profile";
```

2. **`src/core/profiles/hooks/useProfile.ts`**:
```typescript
// ANTES:
import { Profile } from "@/core/profiles/services/types";

// DEPOIS:
import type { Profile } from "@/core/profiles/domain/Profile";
```

3. **`src/core/auth/hooks/useProfileContextIntegration.ts`**:
```typescript
// ANTES:
import type { ProfileContext } from "@/core/profiles/services/types";

// DEPOIS:
import type { ProfileContext } from "@/core/profiles/views/ProfileContext";
```

**Validar**:
```bash
npx tsc --noEmit
npx eslint src/core/profiles --ext .ts,.tsx
```

---

## 📊 CHECKLIST DE EXECUÇÃO

- [ ] Correção 1: Adicionar 8 campos ao Profile domain
- [ ] Correção 2: Documentar ProfilePermissions e ProfileStatus
- [ ] Correção 3: Adicionar snapshots ao ProfileRowMapper
- [ ] Correção 4: Remover 6 definições duplicadas
- [ ] Correção 5: Migrar 3 arquivos reais
- [ ] Validar TypeScript (`npx tsc --noEmit`)
- [ ] Validar ESLint (`npx eslint src/core/profiles`)
- [ ] Atualizar documentação

---

## 🎯 RESULTADO ESPERADO

Após correções:
- ✅ Profile canônico com **32 campos** (completo)
- ✅ ProfileRow com **48 campos** (todos do banco)
- ✅ Snapshots documentados e mapeados
- ✅ Aliases documentados e mapeados
- ✅ **3 definições de Profile** (domain, services deprecated, multi-profile)
- ✅ **3 arquivos reais** usando domain/Profile.ts
- ✅ TypeScript passa sem erros
- ✅ Fase 1 **APROVADA** para Fase 2

---

**Status**: 🟡 AGUARDANDO CORREÇÕES  
**Estimativa**: 2-3 horas  
**Próximo**: Executar correções, depois iniciar Fase 2
