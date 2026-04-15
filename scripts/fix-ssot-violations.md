# Guia de Correção de Violações SSOT

## 📋 Checklist de Violações

### 1. AdminProfileGovernanceService.ts (9 violações)

#### Violação 1: Linha 792 - user_roles
```typescript
// ❌ ANTES
const { data, error } = await supabase
  .from('user_roles')
  .select('*')
  .eq('user_id', userId);

// ✅ DEPOIS
import { AdminService } from '@/core/admin/services/AdminService';
const roles = await AdminService.getUserRoles(userId);
```

#### Violação 2: Linha 844 - profiles
```typescript
// ❌ ANTES
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', profileId);

// ✅ DEPOIS
import { ProfileService } from '@/core/profiles/services/ProfileService';
const profile = await ProfileService.getProfile(profileId);
```

#### Violação 3: Linha 913 - driver_data
```typescript
// ❌ ANTES
const { data, error } = await supabase
  .from('driver_data')
  .select('*')
  .eq('profile_id', profileId);

// ✅ DEPOIS
import { MobilityService } from '@/core/mobility/services/MobilityService';
const driverData = await MobilityService.getDriverData(profileId);
```

#### Violações 4-9: Linhas 1279, 1463, 1547, 1576, 1594, 1605
Seguir o mesmo padrão acima, substituindo acesso direto por serviços canônicos.

---

### 2. AdminCommunityIssuesService.ts (4 violações + 4 Session)

#### Violações Session Context (Linhas 333, 374, 408, 443)
```typescript
// ❌ ANTES
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('Unauthorized');

// ✅ DEPOIS
import { SessionService } from '@/core/session/services/SessionService';
const session = await SessionService.getSession();
if (!session?.user) throw new Error('Unauthorized');
const user = session.user;
```

---

### 3. AdminNotificationsService.ts (1 violação)

#### Violação: Linha 87 - profiles
```typescript
// ❌ ANTES
const { data: profiles } = await supabase
  .from('profiles')
  .select('id, username')
  .in('id', profileIds);

// ✅ DEPOIS
import { ProfileService } from '@/core/profiles/services/ProfileService';
const profiles = await Promise.all(
  profileIds.map(id => ProfileService.getProfile(id))
);
```

---

### 4. EDGE_FUNCTION_ATUALIZADA_MOTOBOY.ts (6 violações)

#### Violações: Linhas 67, 205, 276, 312, 350, 372
```typescript
// ❌ ANTES
const { data: ride } = await supabase
  .from('ride_requests')
  .select('*')
  .eq('id', rideId)
  .single();

// ✅ DEPOIS
import { MobilityService } from '@/core/mobility/services/MobilityService';
const ride = await MobilityService.getRideRequest(rideId);
```

**NOTA**: Este arquivo é uma Edge Function. Considerar:
1. Mover lógica para serviço apropriado
2. Edge Function apenas como wrapper fino
3. Ou criar serviço específico para Edge Functions

---

## 🔧 Padrão de Refatoração

### Passo 1: Identificar a Tabela
```typescript
// Encontrar: .from('TABELA')
```

### Passo 2: Mapear para Serviço Canônico
| Tabela | Serviço Canônico |
|--------|------------------|
| `profiles` | `ProfileService` |
| `user_roles` | `AdminService` |
| `driver_data` | `MobilityService` |
| `ride_requests` | `MobilityService` |
| `posts` | `PostsService` |
| `comments` | `CommentsService` |
| `businesses` | `BusinessService` |

### Passo 3: Substituir Acesso Direto
```typescript
// 1. Adicionar import
import { ServiceName } from '@/core/domain/services/ServiceName';

// 2. Substituir query
const result = await ServiceName.methodName(params);

// 3. Remover código antigo
// DELETE: const { data, error } = await supabase.from('table')...
```

### Passo 4: Validar
```bash
# Executar lint
npm run lint

# Executar typecheck
npm run typecheck

# Executar testes
npm run test
```

---

## 📝 Template de Commit

```
fix(ssot): corrigir violações SSOT em [ARQUIVO]

- Substituir acesso direto a [TABELA] por [SERVIÇO]
- Remover [N] violações SSOT
- Seguir padrão CURRENT_RULES.md

Refs: #ISSUE
```

---

## ⚠️ Casos Especiais

### Edge Functions
Edge Functions podem precisar de tratamento especial:
1. Criar serviço wrapper se necessário
2. Manter Edge Function como camada fina
3. Documentar exceções no eslint.config.js

### Scripts de Migração
Scripts em `scripts/` podem ter exceções temporárias:
1. Adicionar comentário explicativo
2. Documentar no RELATORIO_AUDITORIA_COMPLETA.md
3. Planejar refatoração futura

### Testes
Testes podem acessar diretamente para validação:
1. Usar mocks quando possível
2. Documentar acesso direto necessário
3. Adicionar exceção no eslint.config.js

---

## 🎯 Ordem de Execução

1. ✅ AdminProfileGovernanceService.ts (9 violações) - PRIORIDADE MÁXIMA
2. ✅ AdminCommunityIssuesService.ts (8 violações) - PRIORIDADE ALTA
3. ✅ EDGE_FUNCTION_ATUALIZADA_MOTOBOY.ts (6 violações) - PRIORIDADE ALTA
4. ✅ AdminNotificationsService.ts (1 violação) - PRIORIDADE MÉDIA
5. ✅ Scripts na raiz (5+ violações) - PRIORIDADE BAIXA (mover para scripts/)

---

## 📊 Progresso

- [ ] AdminProfileGovernanceService.ts (0/9)
- [ ] AdminCommunityIssuesService.ts (0/8)
- [ ] EDGE_FUNCTION_ATUALIZADA_MOTOBOY.ts (0/6)
- [ ] AdminNotificationsService.ts (0/1)
- [ ] Scripts na raiz (0/5)

**Total**: 0/29 violações corrigidas

---

## 🔗 Referências

- [CURRENT_RULES.md](../docs/CURRENT_RULES.md)
- [DATA_MODELING.md](../docs/DATA_MODELING.md)
- [ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- [eslint-plugin-ssot.cjs](../eslint-plugin-ssot.cjs)
