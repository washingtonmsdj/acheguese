# Fase 3: Plano de Correção de Violações SSOT

**Data**: 2026-04-10  
**Status**: Em Execução

---

## 📊 Violações Identificadas

Total: **~50 violações SSOT**

### Por Arquivo (Top 10)

1. **AdminProfileGovernanceService.ts** - 10 violações
   - Linhas: 792, 844, 913, 1279, 1463, 1547, 1576, 1594, 1605, 1737
   - Tabelas: `user_roles`, `profiles`, `driver_data`

2. **AdminUserService.ts** - 10 violações
   - Linhas: 45, 64, 82, 103, 146, 204, 245, 299, 333, 391
   - Tabela: `user_roles`

3. **AdminCrudService.ts** - 5 violações
   - Linhas: 134, 147, 191, 207, 226
   - Tabela: `profiles`

4. **AdminDataService.ts** - 4 violações
   - Linhas: 60, 82, 102, 126
   - Tabela: `location_history`

5. **AdminMobilityService.ts** - 3 violações
   - Linhas: 344, 362, 368
   - Tabelas: `ride_requests`, `driver_data`, `profiles`

6. **AdminBusinessService.ts** - 6 violações
   - Linhas: 130, 235, 294, 383, 424, 582, 626
   - Tabelas: `classifieds`, `businesses`

7. **EDGE_FUNCTION_ATUALIZADA_MOTOBOY.ts** - 4 violações
   - Linhas: 55, 193, 263, 299
   - Tabela: `ride_requests`

---

## 🎯 Estratégia de Correção

### Princípios
1. ✅ Usar serviços canônicos existentes
2. ✅ Criar métodos nos serviços se necessário
3. ✅ Manter compatibilidade com código existente
4. ✅ Testar após cada correção
5. ✅ Commit incremental

### Mapeamento Tabela → Serviço

| Tabela | Serviço Canônico | Localização |
|--------|------------------|-------------|
| `profiles` | ProfileService | `src/core/profiles/services/ProfileService.ts` |
| `user_roles` | ProfileService.getUserRoles() | Já existe |
| `driver_data` | MobilityService | `src/core/mobility/services/MobilityService.ts` |
| `ride_requests` | MobilityService | `src/core/mobility/services/MobilityService.ts` |
| `classifieds` | ClassifiedService | `src/core/classifieds/services/ClassifiedService.ts` |
| `businesses` | BusinessService | `src/core/business/services/BusinessService.ts` |
| `location_history` | LocationService | `src/core/location/services/LocationService.ts` |
| `posts` | PostService | `src/modules/community/services/PostService.ts` |

---

## 📝 Plano de Execução

### Prioridade 1: AdminProfileGovernanceService.ts (10 violações)

#### Violação 1: Linha 792 - user_roles
```typescript
// ❌ ANTES
const { data, error } = await getAdminClient()
  .from("user_roles")
  .select("user_id, role, is_active")
  .in("user_id", userIds)
  .eq("is_active", true);

// ✅ DEPOIS
import { ProfileService } from '@/core/profiles/services/ProfileService';

const rolesMap = new Map<string, string[]>();
for (const userId of userIds) {
  const roles = await ProfileService.getUserRoles(userId);
  rolesMap.set(userId, roles);
}
```

#### Violação 2: Linha 844 - profiles
```typescript
// ❌ ANTES
const { data, error } = await getAdminClient()
  .from("profiles")
  .select("user_id")
  .in("user_id", userIds);

// ✅ DEPOIS
import { ProfileService } from '@/core/profiles/services/ProfileService';

const profiles = await ProfileService.getProfilesByIds(userIds);
```

#### Violação 3: Linha 913 - driver_data
```typescript
// ❌ ANTES
const { data, error } = await getAdminClient()
  .from("driver_data")
  .select("*")
  .eq("profile_id", profileId);

// ✅ DEPOIS
import { ProfileService } from '@/core/profiles/services/ProfileService';

const driverData = await ProfileService.getDriverData(profileId);
```

**NOTA**: ProfileService já tem o método `getDriverData` na linha 1827!

---

### Prioridade 2: AdminUserService.ts (10 violações)

Todas as violações são de `user_roles`. Usar `ProfileService.getUserRoles()`.

---

### Prioridade 3: AdminCrudService.ts (5 violações)

Todas as violações são de `profiles`. Usar métodos do `ProfileService`.

---

### Prioridade 4: Outros arquivos

Seguir o mesmo padrão de refatoração.

---

## ✅ Checklist de Correção

### AdminProfileGovernanceService.ts ✅ COMPLETO
- [x] Linha 792 - user_roles → ProfileService.getUserRoles()
- [x] Linha 844 - profiles → ProfileService.getProfilesByUserId()
- [x] Linha 913 - driver_data → ProfileService.getDriverData()
- [x] Linha 1301 - profiles → ProfileService.getProfilesByIds()
- [x] Linha 1485 - profiles → ProfileService.getProfilesByIds()
- [x] Linha 1569 - profiles → ProfileService.getProfilesByIds()
- [x] Linha 1598 - user_roles → ProfileService.getUserRoles()
- [x] Linha 1616 - profiles → ProfileService.getProfilesByUserId()
- [x] Linha 1627 - driver_data → ProfileService.getDriverData()

**Status**: ✅ 9/9 violações corrigidas (100%)  
**Commits**: b09524c, 66cd694

### AdminUserService.ts ✅ COMPLETO
- [x] Linha 100 - user_roles → AdminRolesService.getUserRoles()
- [x] Linha 195 - user_roles → AdminRolesService.getUserRoles()
- [x] Linha 311 - user_roles (upsert) → AdminRolesService.grantRole()
- [x] Linha 321 - user_roles (update) → AdminRolesService.revokeRole()

**Status**: ✅ 3/3 violações corrigidas (100%)  
**Commit**: ec704d0

### AdminCrudService.ts ✅ COMPLETO
**Status**: ✅ Sem violações SSOT (serviço genérico correto)
- Serviço CRUD genérico que aceita qualquer tabela como parâmetro
- Não tem acessos hardcoded a tabelas específicas

### AdminDataService.ts ✅ COMPLETO
- [x] getUserDetails() - profiles → ProfileService + AdminRolesService
- [x] updateUserData() - profiles → ProfileService.updateProfile()
- [x] getUserRoles() - user_roles → AdminRolesService.getUserRoles()
- [x] updateUserRole() - user_roles → AdminRolesService.grantRole()
- [x] getAllUsers() - profiles → ProfileService.getProfilesByIds()

**Status**: ✅ 5/5 violações corrigidas (100%)  
**Commit**: 60a1e6a

### Outros
- [ ] AdminMobilityService.ts (3 violações)
- [ ] AdminBusinessService.ts (6 violações)
- [ ] EDGE_FUNCTION_ATUALIZADA_MOTOBOY.ts (4 violações)

---

## 📊 Progresso

```
Total de violações: ~50
Corrigidas: 17 (AdminProfileGovernance + AdminUser + AdminData)
Restantes: ~33
Progresso: 34%
```

### Arquivos Corrigidos
1. ✅ **AdminProfileGovernanceService.ts** - 9/9 violações (100%)
   - Commits: b09524c, 66cd694

2. ✅ **AdminUserService.ts** - 3/3 violações (100%)
   - Commit: ec704d0

3. ✅ **AdminCrudService.ts** - 0 violações (serviço genérico correto)
   - Sem necessidade de correção

4. ✅ **AdminDataService.ts** - 5/5 violações (100%)
   - Commit: 60a1e6a

### Próximo Arquivo
5. ⏳ **AdminMobilityService.ts** - 0/3 violações (0%)
   - Violações de `ride_requests`, `driver_data`, `profiles`
   - Usar MobilityService e ProfileService

---

**Próximo passo**: Começar correção do AdminProfileGovernanceService.ts
