# Auditoria Completa de Hardcodes - Conformidade SSOT

**Data**: 2026-04-16  
**Status**: Auditoria Inicial Completa  
**Escopo**: Frontend (src/), Módulos, Core, Shared  
**Objetivo**: Identificar e eliminar hardcodes indevidos conforme princípios SSOT

---

## 📋 Sumário Executivo

### Classificação de Hardcodes

#### ✅ **Hardcodes Aceitáveis** (Mantidos)
- Design tokens e constantes de UI (cores, tamanhos, animações)
- Labels puramente visuais sem significado de negócio
- Enums técnicos (tipos TypeScript, configurações de build)
- Constantes de infraestrutura (timeouts, retries, limites de paginação)
- Mensagens de erro e validação (i18n)

#### ⚠️ **Hardcodes Críticos** (Requerem Migração)
- Valores de negócio (preços, comissões, taxas)
- Dados territoriais (IDs de localizações, nomes de cidades)
- Categorias e taxonomias de negócio
- Status e estados operacionais
- Planos e entitlements
- Dados mock em runtime de produção
- Regras de negócio embutidas em componentes

---

## 🔴 Hardcodes Críticos Identificados

### 1. **Planos e Preços de Assinatura**

**Arquivo**: `src/shared/types/subscription.ts`

```typescript
// ❌ CRÍTICO: Preços hardcoded
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "basico",
    name: "Básico",
    price: 29,  // ← Hardcode de preço
    // ...
  },
  {
    id: "profissional",
    name: "Profissional",
    price: 79,  // ← Hardcode de preço
    // ...
  },
  {
    id: "premium_20",
    name: "Premium",
    price: 149,  // ← Hardcode de preço
    // ...
  }
];
```

**Impacto**: Alto  
**Risco**: Mudanças de preço requerem deploy de frontend  
**Solução**: Migrar para `subscription_plans` no banco de dados

---

### 2. **Planos de Billing (Core)**

**Arquivo**: `src/core/billing/plans.ts`

```typescript
// ❌ CRÍTICO: Entitlements e preços hardcoded
export const PLANS: Record<PlanTier, PlanDefinition> = {
  [PlanTier.FREE]: {
    tier: PlanTier.FREE,
    name: 'Free',
    price: 'Grátis',
    priceValue: 0,  // ← Hardcode
    entitlements: {
      canUsePremiumPublicPage: false,
      maxMenuItems: 20,  // ← Hardcode de limite
      maxPromotions: 0,
      // ... dezenas de regras hardcoded
    },
  },
  [PlanTier.PRO]: {
    priceValue: 4990,  // ← Hardcode (R$ 49,90)
    maxMenuItems: null,  // ilimitado
    maxPromotions: 10,  // ← Hardcode de limite
    // ...
  },
  [PlanTier.DELIVERY]: {
    priceValue: 9990,  // ← Hardcode (R$ 99,90)
    // ...
  }
};
```

**Impacto**: Crítico  
**Risco**: Impossível A/B test de preços, mudanças de plano requerem deploy  
**Solução**: Migrar para tabela `billing_plans` com entitlements em JSONB

---

### 3. **Preços e Taxas de Mobilidade**

**Arquivo**: `src/modules/mobility/services/mobility.helpers.ts`

```typescript
// ❌ CRÍTICO: Preços de corrida hardcoded
export function calculateEstimatedFare(
  distanceKm: number,
  baseFare = 5.0,      // ← Hardcode de tarifa base
  perKmRate = 2.5,     // ← Hardcode de tarifa por km
): number {
  return baseFare + distanceKm * perKmRate;
}
```

**Impacto**: Alto  
**Risco**: Preços fixos, sem flexibilidade por região ou horário  
**Solução**: Migrar para `pricing_rules` com suporte a:
- Tarifa base por território
- Tarifa por km variável
- Multiplicadores por horário (pico, noturno)
- Tarifa mínima

---

### 4. **IDs de Localização Hardcoded (Vagas Mock)**

**Arquivo**: `src/modules/vagas/data/mock-vagas.ts`

```typescript
// ❌ CRÍTICO: IDs de localização hardcoded
const LOCATION_PITUBA = '384add59-4e53-489d-a7b5-97dea2b3f442';
const LOCATION_CAMINHO_ARVORES = '384add59-4e53-489d-a7b5-97dea2b3f442';
const LOCATION_COMERCIO = '384add59-4e53-489d-a7b5-97dea2b3f442';
// ... todos apontam para o mesmo ID

export const MOCK_VAGAS: Vaga[] = [
  {
    id: "v1",
    titulo: "Desenvolvedor Full Stack React + Node",
    salario_min: 6000,  // ← Hardcode de salário
    salario_max: 9000,  // ← Hardcode de salário
    location_id: LOCATION_CAMINHO_ARVORES,
    // ...
  },
  // ... 8 vagas com dados hardcoded
];
```

**Impacto**: Alto  
**Risco**: Dados mock contaminando runtime de produção  
**Solução**: 
1. Remover mock de runtime
2. Mover para fixtures de teste/Storybook
3. Criar seed script para ambiente de desenvolvimento
4. Implementar `VagasService` real

---

### 5. **Categorias e Status Hardcoded em Admin**

**Arquivos**: 
- `src/modules/admin/pages/AdminEventos.tsx`
- `src/modules/admin/pages/AdminCupons.tsx`
- `src/modules/admin/pages/AdminMensagens.tsx`

```typescript
// ❌ CRÍTICO: Categorias hardcoded
const CATEGORY_OPTIONS = ["show", "feira", "festa", "esportivo", "educação", "promoção"];
const STATUS_OPTIONS = ["upcoming", "ongoing", "completed", "cancelled"];
const TYPE_OPTIONS = ["porcentagem", "valor", "brinde"];
```

**Impacto**: Médio  
**Risco**: Impossível adicionar categorias sem deploy  
**Solução**: Migrar para tabelas de configuração:
- `event_categories`
- `coupon_types`
- `status_definitions`

---

### 6. **Áreas Atendidas Hardcoded**

**Arquivo**: `src/app/pages/EmpresaDetailLandingPage.tsx`

```typescript
// ❌ CRÍTICO: Lista de bairros hardcoded
const AREAS_ATENDIDAS = [
  "Pituba", 
  "Itaigara", 
  "Caminho das Árvores", 
  "Iguatemi", 
  "Nordeste de Amaralina", 
  "Santa Cruz", 
  "Vale das Pedrinhas"
];
```

**Impacto**: Alto  
**Risco**: Dados territoriais desatualizados, sem vínculo com SSOT  
**Solução**: Buscar de `service_areas` ou `delivery_areas` do negócio

---

### 7. **Tipos de Entidade Hardcoded**

**Arquivo**: `src/pages/NearbyPage.tsx`

```typescript
// ⚠️ MÉDIO: Tipos de entidade hardcoded
const ALL_ENTITY_TYPES = ['business', 'event', 'alert', 'tourist_point'] as const;

const CATEGORY_TO_TYPES: Record<QuickCategoryKey, typeof ALL_ENTITY_TYPES[number][]> = {
  all: [...ALL_ENTITY_TYPES],
  food: ['business'],
  // ...
};
```

**Impacto**: Médio  
**Risco**: Adicionar novo tipo de entidade requer mudança em múltiplos lugares  
**Solução**: Centralizar em `src/config/entityTypes.ts` ou buscar de configuração

---

### 8. **Roles e Profile Types Hardcoded**

**Arquivos**: Múltiplos (validação, schemas, componentes)

```typescript
// ⚠️ MÉDIO: Profile types hardcoded
profile_type: z.enum(["personal", "driver", "business", "professional"])

// Em componentes:
if (profileType === 'driver') { /* ... */ }
if (profile.profile_type === 'business') { /* ... */ }
```

**Impacto**: Médio  
**Risco**: Adicionar novo tipo de perfil requer mudanças em dezenas de arquivos  
**Solução**: 
1. Criar enum centralizado em `src/shared/types/enums.ts`
2. Usar type guards centralizados
3. Considerar migrar para tabela `profile_types` se precisar ser dinâmico

---

### 9. **Status de Corrida Hardcoded**

**Arquivo**: `src/modules/mobility/constants/index.ts` (presumido)

```typescript
// ✅ BOM: Centralizado em constants
export const RIDE_STATUS = {
  PENDING: 'pending',
  REQUESTED: 'requested',
  SEARCHING_DRIVER: 'searching_driver',
  // ...
} as const;
```

**Status**: ✅ Aceitável (centralizado)  
**Observação**: Está correto, mas verificar se há duplicação em outros arquivos

---

### 10. **Limites e Configurações Operacionais**

**Arquivo**: `src/shared/constants/pagination.ts`

```typescript
// ✅ ACEITÁVEL: Limites técnicos de UI
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  SMALL_LIMIT: 10,
  MEDIUM_LIMIT: 50,
  LARGE_LIMIT: 100,
  // ...
} as const;
```

**Status**: ✅ Aceitável (constantes técnicas de UI)

---

### 11. **Timeouts e Retries**

**Arquivo**: `src/shared/constants/retries.ts`

```typescript
// ✅ ACEITÁVEL: Configurações técnicas
export const RETRIES = {
  DEFAULT_MAX: 3,
  GPS_MAX: 3,
  API_MAX: 5,
  // ...
} as const;
```

**Status**: ✅ Aceitável (configurações de infraestrutura)

---

### 12. **Módulos Territoriais Hardcoded**

**Arquivo**: `src/core/rollout/services/RolloutService.ts`

```typescript
// ⚠️ MÉDIO: Lista de módulos hardcoded
const moduleKeys = [
  'community', 
  'business', 
  'services', 
  'mobility', 
  'classifieds', 
  'promotions'
] as const;
```

**Impacto**: Médio  
**Risco**: Adicionar novo módulo requer mudança em código  
**Solução**: Buscar de `rollout_modules` ou configuração centralizada

---

### 13. **Categorias de Negócio Hardcoded**

**Arquivo**: `src/core/tourist-points/hooks/useNearbyBusinesses.ts`

```typescript
// ⚠️ MÉDIO: Categorias hardcoded
const BUSINESS_CATEGORIES = ['restaurante', 'lazer', 'servicos'] as const;
```

**Impacto**: Médio  
**Risco**: Categorias desatualizadas, sem vínculo com taxonomia oficial  
**Solução**: Buscar de `business_categories` via service

---

### 14. **Dias da Semana Hardcoded**

**Arquivos**: Múltiplos

```typescript
// ✅ ACEITÁVEL: Constante universal
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
```

**Status**: ✅ Aceitável (constante universal, mas considerar i18n)

---

### 15. **Tipos de Arquivo Permitidos**

**Arquivos**: Múltiplos (upload de imagens)

```typescript
// ✅ ACEITÁVEL: Validação técnica
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
```

**Status**: ✅ Aceitável (validação de segurança)

---

## 📊 Estatísticas da Auditoria

### Por Severidade

| Severidade | Quantidade | % |
|------------|------------|---|
| 🔴 Crítico | 6 | 40% |
| ⚠️ Médio | 5 | 33% |
| ✅ Aceitável | 4 | 27% |
| **Total** | **15** | **100%** |

### Por Categoria

| Categoria | Críticos | Médios | Total |
|-----------|----------|--------|-------|
| Preços e Billing | 3 | 0 | 3 |
| Dados Territoriais | 2 | 1 | 3 |
| Categorias e Taxonomias | 0 | 3 | 3 |
| Tipos e Enums | 0 | 1 | 1 |
| Dados Mock | 1 | 0 | 1 |
| Constantes Técnicas | 0 | 0 | 4 |

---

## 🎯 Plano de Ação Priorizado

### Fase 1: Críticos de Billing (Semana 1)

#### 1.1 Migrar Planos de Assinatura para Banco
- [ ] Criar migration `subscription_plans`
- [ ] Criar migration `plan_entitlements`
- [ ] Implementar `SubscriptionPlanService`
- [ ] Migrar `src/shared/types/subscription.ts` para usar service
- [ ] Migrar `src/core/billing/plans.ts` para usar service
- [ ] Seed com planos atuais
- [ ] Testes de integração

**Arquivos Afetados**:
- `src/shared/types/subscription.ts`
- `src/core/billing/plans.ts`
- `src/core/billing/hooks/*`

---

#### 1.2 Migrar Preços de Mobilidade para Banco
- [ ] Criar migration `pricing_rules`
- [ ] Implementar `PricingService`
- [ ] Migrar `mobility.helpers.ts` para usar service
- [ ] Suporte a tarifas por território
- [ ] Suporte a multiplicadores por horário
- [ ] Seed com tarifas atuais
- [ ] Testes de cálculo

**Arquivos Afetados**:
- `src/modules/mobility/services/mobility.helpers.ts`
- `src/modules/mobility/services/MobilityService.impl.ts`

---

### Fase 2: Dados Mock e Territoriais (Semana 2)

#### 2.1 Eliminar Mock de Vagas do Runtime
- [ ] Mover `mock-vagas.ts` para `tests/fixtures/`
- [ ] Criar `VagasService` real
- [ ] Implementar seed script para dev
- [ ] Configurar Storybook com fixtures
- [ ] Remover imports de mock em produção

**Arquivos Afetados**:
- `src/modules/vagas/data/mock-vagas.ts`
- `src/modules/vagas/hooks/useVagas.ts`

---

#### 2.2 Migrar Áreas Atendidas para Service
- [ ] Buscar de `service_areas` ou `delivery_areas`
- [ ] Remover hardcode de `EmpresaDetailLandingPage.tsx`
- [ ] Implementar hook `useServiceAreas(businessId)`

**Arquivos Afetados**:
- `src/app/pages/EmpresaDetailLandingPage.tsx`

---

### Fase 3: Categorias e Taxonomias (Semana 3)

#### 3.1 Centralizar Categorias de Admin
- [ ] Criar `admin_config` table ou usar JSONB em settings
- [ ] Migrar categorias de eventos
- [ ] Migrar tipos de cupons
- [ ] Migrar status definitions
- [ ] Implementar `AdminConfigService`

**Arquivos Afetados**:
- `src/modules/admin/pages/AdminEventos.tsx`
- `src/modules/admin/pages/AdminCupons.tsx`
- `src/modules/admin/pages/AdminMensagens.tsx`

---

#### 3.2 Centralizar Categorias de Negócio
- [ ] Verificar se `business_categories` existe
- [ ] Implementar `BusinessCategoryService`
- [ ] Migrar hardcodes para usar service
- [ ] Cache de categorias no frontend

**Arquivos Afetados**:
- `src/core/tourist-points/hooks/useNearbyBusinesses.ts`
- `src/shared/schemas/business/businessSchemas.ts`

---

### Fase 4: Enums e Tipos (Semana 4)

#### 4.1 Centralizar Profile Types
- [ ] Criar `src/shared/types/enums.ts`
- [ ] Exportar `PROFILE_TYPES` enum
- [ ] Criar type guards centralizados
- [ ] Migrar todos os usos para enum centralizado
- [ ] Lint rule para prevenir hardcode

**Arquivos Afetados**: ~30 arquivos

---

#### 4.2 Centralizar Módulos de Rollout
- [ ] Verificar se `rollout_modules` existe
- [ ] Implementar `RolloutModuleService`
- [ ] Migrar hardcode em `RolloutService.ts`

**Arquivos Afetados**:
- `src/core/rollout/services/RolloutService.ts`

---

## 🛡️ Prevenção de Regressão

### 1. ESLint Rules

Criar regras customizadas:

```javascript
// eslint-plugin-ssot.cjs
module.exports = {
  rules: {
    'no-hardcoded-prices': {
      // Detectar números que parecem preços
    },
    'no-hardcoded-location-ids': {
      // Detectar UUIDs hardcoded
    },
    'no-mock-in-production': {
      // Detectar imports de mock fora de test/fixtures
    }
  }
};
```

---

### 2. Testes de Conformidade

```typescript
// tests/ssot/hardcode-detection.test.ts
describe('SSOT Hardcode Detection', () => {
  it('should not have hardcoded prices in components', () => {
    // Scan source files for price patterns
  });
  
  it('should not have mock data in production code', () => {
    // Verify no imports from /data/mock-*
  });
});
```

---

### 3. Pre-commit Hook

```bash
# .husky/pre-commit
npm run lint:ssot
npm run test:ssot-compliance
```

---

### 4. Documentação de Padrões

Criar `docs/SSOT_PATTERNS.md`:

```markdown
## ✅ Padrão Correto

// Buscar de service
const plans = await SubscriptionPlanService.getPlans();

## ❌ Padrão Incorreto

// Hardcode
const plans = [
  { id: 'basic', price: 29 },
  // ...
];
```

---

## 📝 Checklist de Migração

Para cada hardcode crítico:

- [ ] Identificar fonte de verdade (tabela, config, service)
- [ ] Criar migration se necessário
- [ ] Implementar service/repository
- [ ] Criar hook de acesso
- [ ] Migrar componentes para usar hook
- [ ] Adicionar testes
- [ ] Seed com dados atuais
- [ ] Documentar padrão
- [ ] Code review
- [ ] Deploy e validação

---

## 🔍 Áreas Não Auditadas (Próximas Iterações)

1. **Supabase Functions** (`supabase/functions/`)
2. **Scripts** (`scripts/`)
3. **Migrations** (`supabase/migrations/`)
4. **E2E Tests** (`e2e/`, `tests/`)
5. **Configurações** (`.env`, `config.toml`)

---

## 📚 Referências

- [CURRENT_RULES.md](./CURRENT_RULES.md) - Regras vigentes do sistema
- [ADDRESS_SSOT.md](../src/core/address/docs/ADDRESS_SSOT.md) - Exemplo de SSOT bem implementado
- [INDEX_CANONICO.md](../INDEX_CANONICO.md) - Índice mestre

---

## 🎓 Lições Aprendidas

### O que funcionou bem:
1. ✅ Constantes técnicas centralizadas (`pagination.ts`, `retries.ts`)
2. ✅ Enums de status centralizados (`RIDE_STATUS`)
3. ✅ Separação clara entre mock e produção em alguns módulos

### O que precisa melhorar:
1. ❌ Dados de negócio (preços, planos) hardcoded
2. ❌ Mock contaminando runtime de produção
3. ❌ Categorias e taxonomias sem fonte única
4. ❌ Falta de lint rules para prevenir hardcodes

---

**Próxima Revisão**: Após conclusão da Fase 1  
**Responsável**: Time de Arquitetura  
**Status**: 🟡 Em Progresso

