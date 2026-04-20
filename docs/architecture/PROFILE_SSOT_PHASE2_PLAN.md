# Profile SSOT — Plano da Fase 2 (Migração Gradual)

> **Data**: 2026-04-19  
> **Status**: 📋 PLANEJAMENTO  
> **Pré-requisito**: Fase 1 concluída ✅

---

## 📊 Análise de Impacto

### Arquivos Afetados

Identificados **~30 arquivos** que importam de `services/types.ts`:

#### Core (8 arquivos)
- `src/core/profiles/index.ts` ✅ (já atualizado)
- `src/core/profiles/mappers/ProfileMapper.ts`
- `src/core/profiles/hooks/useProfile.ts`
- `src/core/feed/types.ts`
- `src/core/posts/types.ts`
- `src/core/comments/types.ts`
- `src/core/favorites/hooks/useFavorites.ts`
- `src/core/auth/hooks/useProfileContextIntegration.ts`
- `src/core/admin/services/AdminProfileGovernanceService.ts`

#### Modules (22 arquivos)
- `src/modules/mobility/pages/TrackRidePage.tsx`
- `src/modules/profile/types/index.ts`
- `src/modules/profile/sections/types.ts`
- `src/modules/profile/pages/PerfilHubPage.backup.tsx`
- `src/modules/profile/hooks/usePerfilPageV3.ts`
- `src/modules/profile/hooks/useUserActivity.ts`
- `src/modules/profile/hooks/useProfileHub.ts`
- `src/modules/profile/components/BusinessList.tsx`
- `src/modules/profile/components/GamificationCard.tsx`
- `src/modules/profile/components/hub/AccountHealthPanel.tsx`
- `src/modules/profile/components/hub/ContentTabsSection.tsx`
- `src/modules/profile/components/hub/BusinessModulesSection.tsx`
- `src/modules/profile/components/FavoritesList.tsx`
- `src/modules/profile/components/hub/ProfileHeader.tsx`
- `src/modules/profile/components/hub/ProfileHeaderCompact.tsx`
- `src/modules/profile/components/DataManagementDialogs.tsx`
- `src/modules/profile/components/BusinessOwnerQuickAccess.tsx`
- `src/modules/classifieds/hooks/useClassificados.ts`
- `src/modules/admin-motoristas/sections/types.ts`
- `src/modules/admin/components/DriverCancellationMetrics.tsx`

### Tipos Mais Importados

| Tipo | Uso | Novo Caminho |
|------|-----|--------------|
| `Profile` | 15x | `src/core/profiles/domain/Profile.ts` |
| `ProfileContext` | 8x | `src/core/profiles/views/ProfileContext.ts` |
| `Business` | 7x | Manter em `services/types.ts` (não é Profile) |
| `ProfileBusinessModuleItem` | 5x | Manter em `services/types.ts` (agregado) |
| `ProfileAccountSnapshot` | 3x | Manter em `services/types.ts` (agregado) |
| `ProfileStats` | 2x | Manter em `services/types.ts` (agregado) |

---

## 🎯 Estratégia de Migração

### Princípios

1. **Migrar em lotes pequenos** (5-10 arquivos por vez)
2. **Validar após cada lote** (TypeScript + ESLint)
3. **Priorizar core antes de modules**
4. **Manter compatibilidade** até Fase 3
5. **Usar mappers** para conversão automática

### Lotes Propostos

#### Lote 1: Core Mappers e Hooks (Prioridade Alta)
- `src/core/profiles/mappers/ProfileMapper.ts`
- `src/core/profiles/hooks/useProfile.ts`
- `src/core/auth/hooks/useProfileContextIntegration.ts`

**Impacto**: Baixo (3 arquivos, core)  
**Risco**: Baixo (mappers são isolados)

#### Lote 2: Core Types (Prioridade Alta)
- `src/core/feed/types.ts`
- `src/core/posts/types.ts`
- `src/core/comments/types.ts`
- `src/core/favorites/hooks/useFavorites.ts`

**Impacto**: Médio (4 arquivos, core)  
**Risco**: Médio (tipos usados em muitos lugares)

#### Lote 3: Core Admin (Prioridade Média)
- `src/core/admin/services/AdminProfileGovernanceService.ts`

**Impacto**: Baixo (1 arquivo)  
**Risco**: Baixo (service isolado)

#### Lote 4: Module Profile Types (Prioridade Média)
- `src/modules/profile/types/index.ts`
- `src/modules/profile/sections/types.ts`

**Impacto**: Alto (2 arquivos, mas usados em muitos lugares)  
**Risco**: Médio (re-exports)

#### Lote 5: Module Profile Hooks (Prioridade Média)
- `src/modules/profile/hooks/usePerfilPageV3.ts`
- `src/modules/profile/hooks/useUserActivity.ts`
- `src/modules/profile/hooks/useProfileHub.ts`

**Impacto**: Médio (3 arquivos)  
**Risco**: Médio (hooks usados em páginas)

#### Lote 6: Module Profile Components (Prioridade Baixa)
- `src/modules/profile/components/BusinessList.tsx`
- `src/modules/profile/components/GamificationCard.tsx`
- `src/modules/profile/components/FavoritesList.tsx`
- `src/modules/profile/components/DataManagementDialogs.tsx`
- `src/modules/profile/components/BusinessOwnerQuickAccess.tsx`

**Impacto**: Baixo (5 arquivos, componentes isolados)  
**Risco**: Baixo (componentes leaf)

#### Lote 7: Module Profile Hub Components (Prioridade Baixa)
- `src/modules/profile/components/hub/AccountHealthPanel.tsx`
- `src/modules/profile/components/hub/ContentTabsSection.tsx`
- `src/modules/profile/components/hub/BusinessModulesSection.tsx`
- `src/modules/profile/components/hub/ProfileHeader.tsx`
- `src/modules/profile/components/hub/ProfileHeaderCompact.tsx`

**Impacto**: Baixo (5 arquivos, componentes isolados)  
**Risco**: Baixo (componentes leaf)

#### Lote 8: Module Profile Pages (Prioridade Baixa)
- `src/modules/profile/pages/PerfilHubPage.backup.tsx`

**Impacto**: Baixo (1 arquivo backup)  
**Risco**: Baixo (arquivo backup)

#### Lote 9: Other Modules (Prioridade Baixa)
- `src/modules/mobility/pages/TrackRidePage.tsx`
- `src/modules/classifieds/hooks/useClassificados.ts`
- `src/modules/admin-motoristas/sections/types.ts`
- `src/modules/admin/components/DriverCancellationMetrics.tsx`

**Impacto**: Baixo (4 arquivos, módulos isolados)  
**Risco**: Baixo (módulos independentes)

---

## 📝 Checklist por Lote

### Template de Migração

Para cada arquivo:

1. **Identificar imports de `services/types.ts`**
   ```typescript
   // Antes
   import type { Profile, ProfileContext } from '@/core/profiles/services/types';
   ```

2. **Substituir por imports canônicos**
   ```typescript
   // Depois
   import type { Profile } from '@/core/profiles/domain/Profile';
   import type { ProfileContext } from '@/core/profiles/views/ProfileContext';
   ```

3. **Ajustar código se necessário**
   - Campos renomeados: `user_id` → `userId`, `profile_type` → `profileType`
   - Usar mappers se necessário: `ProfileRowMapper.toDomain(row)`

4. **Validar**
   ```bash
   npx tsc --noEmit
   npx eslint <arquivo> --ext .ts,.tsx
   ```

5. **Testar funcionalidade afetada**

---

## 🔄 Mapeamento de Imports

### Tipos de Domínio

| Antigo | Novo |
|--------|------|
| `import type { Profile } from '@/core/profiles/services/types'` | `import type { Profile } from '@/core/profiles/domain/Profile'` |
| `import type { ProfileType } from '@/core/profiles/services/types'` | `import type { ProfileType } from '@/core/profiles/domain/ProfileType'` |
| `import type { ProfileStatus } from '@/core/profiles/services/types'` | `import type { ProfileStatus } from '@/core/profiles/domain/ProfileStatus'` |
| `import type { ProfilePermissions } from '@/core/profiles/services/types'` | `import type { ProfilePermissions } from '@/core/profiles/domain/ProfilePermissions'` |

### Read Models

| Antigo | Novo |
|--------|------|
| `import type { ProfileSummary } from '@/core/profiles/services/types'` | `import type { ProfileSummary } from '@/core/profiles/views/ProfileSummary'` |
| `import type { ProfileContext } from '@/core/profiles/services/types'` | `import type { ProfileContext } from '@/core/profiles/views/ProfileContext'` |
| `import type { ProfilePlan } from '@/core/profiles/services/types'` | `import type { ProfilePlan } from '@/core/profiles/views/ProfileContext'` |
| `import type { ProfileReputation } from '@/core/profiles/services/types'` | `import type { ProfileReputation } from '@/core/profiles/views/ProfileContext'` |

### Inputs

| Antigo | Novo |
|--------|------|
| `import type { CreateProfileData } from '@/core/profiles/services/types'` | `import type { CreateProfileInput } from '@/core/profiles/operations/CreateProfileInput'` |
| `import type { UpdateProfileData } from '@/core/profiles/services/types'` | `import type { UpdateProfileInput } from '@/core/profiles/operations/UpdateProfileInput'` |

### Tipos que PERMANECEM em services/types.ts

Estes tipos são agregados/operacionais do service, NÃO são entidades de domínio:

- `Business` (entidade de outro domínio)
- `ProfileBusinessModuleItem` (agregado)
- `ProfileAccountSnapshot` (agregado)
- `ProfileStats` (agregado)
- `ProfilePrivateWorkspace` (agregado)
- `ProfileOperationsCounts` (agregado)
- `ProfileNotificationsSnapshot` (agregado)
- `ProfileManagedAssetItem` (agregado)
- `ProfileNotificationItem` (agregado)
- `ProfileEffectivePermission` (agregado)
- `ProfileIdentitySnapshot` (agregado)
- `ProfileBusinessSubscriptionSnapshot` (agregado)
- `ProfileBusinessGastronomySnapshot` (agregado)
- `ProfileBusinessQrSnapshot` (agregado)
- `ProfileBusinessModuleItem` (agregado)
- `ProfileVerificationStatusValue` (enum operacional)
- `AdminProfileListItem` (read model admin)
- `AdminFilters` (filtros admin)
- `BasePermissions` (base de permissões)

---

## ⚠️ Riscos e Mitigações

### Risco 1: Quebra de Imports
**Probabilidade**: Alta  
**Impacto**: Médio  
**Mitigação**: Migrar em lotes pequenos, validar após cada lote

### Risco 2: Conflito de Nomes
**Probabilidade**: Média  
**Impacto**: Baixo  
**Mitigação**: Usar imports explícitos, evitar `import *`

### Risco 3: Campos Renomeados
**Probabilidade**: Baixa  
**Impacto**: Médio  
**Mitigação**: Usar mappers, validar com TypeScript

### Risco 4: Código Legado Dependente
**Probabilidade**: Média  
**Impacto**: Baixo  
**Mitigação**: Manter camada legacy até Fase 3

---

## 📊 Métricas de Sucesso

### Fase 2 Completa Quando:

- [ ] Todos os 30 arquivos migrados
- [ ] `npx tsc --noEmit` passa sem erros
- [ ] `npx eslint src/core/profiles` passa sem erros
- [ ] Testes manuais de funcionalidades críticas passam
- [ ] Nenhum import de `Profile` de `services/types.ts` (exceto agregados)
- [ ] Documentação atualizada

### KPIs

- **Arquivos migrados**: 0/30 (0%)
- **Imports canônicos**: 0/~50 (0%)
- **Erros TypeScript**: 0
- **Warnings ESLint**: 0

---

## 🚀 Próximos Passos

1. **Aprovar plano da Fase 2**
2. **Iniciar Lote 1** (Core Mappers e Hooks)
3. **Validar Lote 1**
4. **Continuar com Lote 2**
5. **Repetir até Lote 9**
6. **Validação final**
7. **Atualizar documentação**
8. **Iniciar Fase 3** (Limpeza)

---

**Status**: 📋 PLANEJAMENTO  
**Data**: 2026-04-19  
**Próximo**: Aprovação e início do Lote 1
