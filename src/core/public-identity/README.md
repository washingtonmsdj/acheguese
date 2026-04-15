# Public Identity - Core Module

Módulo transversal de identidade pública para todos os perfis do sistema.

## Arquitetura

### Princípios

- **Orquestrador Puro**: Service não acessa DB diretamente
- **Adapters por Entity**: Boundary específica por tipo de entidade
- **Histórico como SSOT**: Cooldown calculado do histórico
- **Reserved Names por Policy**: Escopo por entity type
- **Entity ID Canônico**: 
  - `business` → `business_data.id`
  - `profile` → `profiles.id`
  - `professional` → `professional_data.id`

### Estrutura

```
domain/
  ├── types.ts              # Types centralizados
  ├── IdentityPolicy.ts     # Interface de policy
  └── IdentityAdapter.ts    # Interface de adapter
policies/
  ├── BusinessIdentityPolicy.ts
  ├── ProfileIdentityPolicy.ts
  └── ProfessionalIdentityPolicy.ts
adapters/
  ├── BusinessIdentityAdapter.ts
  ├── ProfileIdentityAdapter.ts
  └── ProfessionalIdentityAdapter.ts (preparado)
services/
  └── PublicIdentityService.ts  # Orquestrador
utils/
  └── reserved-names.ts         # Contrato único
```

## Uso

### Inicialização

```typescript
import { 
  PublicIdentityService,
  BusinessIdentityAdapter,
  ProfileIdentityAdapter 
} from '@/core/public-identity';

// Registrar adapters
PublicIdentityService.registerAdapter(new BusinessIdentityAdapter());
PublicIdentityService.registerAdapter(new ProfileIdentityAdapter());
```

### Checagem de Disponibilidade

```typescript
const result = await PublicIdentityService.checkAvailability({
  identifier: 'tonecos-studios',
  entityType: 'business',
  excludeEntityId: 'current-business-id' // opcional
});

if (result.status === 'available') {
  // Pode usar
} else if (result.status === 'taken') {
  // Já existe, sugestão: result.suggestion
} else if (result.status === 'reserved') {
  // Nome reservado
}
```

### Validação de Formato

```typescript
const validation = PublicIdentityService.validateFormat(
  'tonecos-studios',
  'business'
);

if (!validation.valid) {
  console.error(validation.error);
}
```

### Cooldown

```typescript
const cooldown = await PublicIdentityService.canChangeIdentifier({
  entityType: 'business',
  entityId: 'business-id'
});

if (!cooldown.canChange) {
  console.log(`Aguarde ${cooldown.daysRemaining} dias`);
  console.log(`Próxima data: ${cooldown.nextAllowedDate}`);
}
```

## Policies

### Business
- **Formato**: kebab-case
- **Separador**: hífen `-`
- **Exemplo**: `tonecos-studios`
- **Histórico**: Público (redirect 308)

### Profile
- **Formato**: social-style
- **Separador**: underscore `_`
- **Exemplo**: `maria_silva`
- **Histórico**: Interno (auditoria)

### Professional
- **Formato**: kebab-case
- **Status**: Preparado (UI futura)

## Reserved Names

Cada policy tem seu escopo de reserved names:

```typescript
import { getReservedForEntityType } from '@/core/public-identity';

const businessReserved = getReservedForEntityType('business');
// ['admin', 'empresas', 'business', 'loja', ...]

const profileReserved = getReservedForEntityType('profile');
// ['admin', 'perfil', 'profile', 'conta', ...]
```

## Testes

```bash
# Testes unitários
npm test src/core/public-identity

# Testes de integração
npm test src/core/public-identity -- --integration
```

## Validação Arquitetural

- ✅ Service não acessa Supabase
- ✅ Sem switch/case de tabelas
- ✅ Erros propagados (não engolidos)
- ✅ Checagem exata vs busca frouxa separadas
- ✅ Entity ID canônico por tipo
