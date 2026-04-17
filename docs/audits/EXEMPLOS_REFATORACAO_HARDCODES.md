# Exemplos Práticos de Refatoração de Hardcodes

**Data**: 2026-04-16  
**Objetivo**: Guia prático com exemplos reais de como refatorar hardcodes

---

## 📚 Índice

1. [Caso 1: Planos de Assinatura](#caso-1-planos-de-assinatura)
2. [Caso 2: Preços de Mobilidade](#caso-2-preços-de-mobilidade)
3. [Caso 3: Mock de Vagas](#caso-3-mock-de-vagas)
4. [Caso 4: Categorias de Admin](#caso-4-categorias-de-admin)
5. [Caso 5: Áreas Atendidas](#caso-5-áreas-atendidas)
6. [Caso 6: Profile Types](#caso-6-profile-types)
7. [Caso 7: Fallbacks Numéricos](#caso-7-fallbacks-numéricos)

---

## Caso 1: Planos de Assinatura

### ❌ Antes (Hardcode)

```typescript
// src/shared/types/subscription.ts
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "basico",
    name: "Básico",
    price: 29,  // ← Hardcode de preço
    description: "Ideal para começar sua presença digital",
    recursos: [
      "Página profissional",
      "Até 5 photos na galeria",
      "Informações de contato",
    ],
    limites: {
      photos: 5,  // ← Hardcode de limite
      products: 10,
      services: 10,
    },
  },
  {
    id: "profissional",
    name: "Profissional",
    price: 79,  // ← Hardcode de preço
    // ...
  },
];

// Uso em componente
function PricingPage() {
  return (
    <div>
      {SUBSCRIPTION_PLANS.map(plan => (
        <PlanCard key={plan.id} plan={plan} />
      ))}
    </div>
  );
}
```

### ✅ Depois (SSOT)

```typescript
// 1. Migration SQL
-- supabase/migrations/YYYYMMDDHHMMSS_create_subscription_plans.sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO subscription_plans (plan_code, name, price_cents, features, limits)
VALUES (
  'basico',
  'Básico',
  2900,  -- R$ 29,00 em centavos
  '["Página profissional", "Até 5 photos na galeria"]'::jsonb,
  '{"photos": 5, "products": 10, "services": 10}'::jsonb
);

-- 2. Service
// src/core/billing/services/SubscriptionPlanService.ts
export class SubscriptionPlanService {
  static async getActivePlans(): Promise<PlanDefinition[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw new Error('Falha ao buscar planos');
    
    return data.map(row => ({
      tier: row.plan_code,
      name: row.name,
      price: this.formatPrice(row.price_cents),
      priceValue: row.price_cents,
      features: row.features,
      limits: row.limits,
    }));
  }

  private static formatPrice(cents: number): string {
    if (cents === 0) return 'Grátis';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  }
}

// 3. Hook com cache
// src/core/billing/hooks/useSubscriptionPlans.ts
export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => SubscriptionPlanService.getActivePlans(),
    staleTime: 1000 * 60 * 60, // 1 hora
  });
}

// 4. Uso em componente
function PricingPage() {
  const { data: plans, isLoading, error } = useSubscriptionPlans();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      {plans?.map(plan => (
        <PlanCard key={plan.tier} plan={plan} />
      ))}
    </div>
  );
}
```

**Benefícios**:
- ✅ Preços podem ser alterados via admin sem deploy
- ✅ A/B testing de preços possível
- ✅ Cache automático com React Query
- ✅ Histórico de mudanças no banco

---

## Caso 2: Preços de Mobilidade

### ❌ Antes (Hardcode)

```typescript
// src/modules/mobility/services/mobility.helpers.ts
export function calculateEstimatedFare(
  distanceKm: number,
  baseFare = 5.0,      // ← Hardcode
  perKmRate = 2.5,     // ← Hardcode
): number {
  return baseFare + distanceKm * perKmRate;
}

// Uso
const fare = calculateEstimatedFare(10); // R$ 30,00
```

### ✅ Depois (SSOT)

```typescript
// 1. Migration SQL
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type TEXT NOT NULL,
  location_id UUID REFERENCES locations(id),
  base_fare_cents INTEGER NOT NULL DEFAULT 500,
  per_km_rate_cents INTEGER NOT NULL DEFAULT 250,
  minimum_fare_cents INTEGER,
  peak_hour_multiplier DECIMAL(3,2) DEFAULT 1.0,
  night_hour_multiplier DECIMAL(3,2) DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Regra global padrão
INSERT INTO pricing_rules (rule_type, base_fare_cents, per_km_rate_cents)
VALUES ('ride', 500, 250);

-- Regra específica para Salvador (horário de pico)
INSERT INTO pricing_rules (
  rule_type, 
  location_id, 
  base_fare_cents, 
  per_km_rate_cents,
  peak_hour_multiplier
)
VALUES (
  'ride',
  '384add59-4e53-489d-a7b5-97dea2b3f442',  -- Salvador
  600,
  300,
  1.5  -- +50% no horário de pico
);

-- 2. Service
export class PricingService {
  static async calculateRideFare(params: {
    distanceKm: number;
    locationId?: string;
    timestamp?: Date;
  }): Promise<number> {
    const { distanceKm, locationId, timestamp = new Date() } = params;

    // Buscar regra aplicável (prioriza específica)
    const rule = await this.getApplicableRule('ride', locationId);

    // Calcular tarifa base
    let fareInCents = rule.base_fare_cents + (distanceKm * rule.per_km_rate_cents);

    // Aplicar multiplicadores de horário
    const multiplier = this.getTimeMultiplier(rule, timestamp);
    fareInCents *= multiplier;

    // Aplicar tarifa mínima
    if (rule.minimum_fare_cents && fareInCents < rule.minimum_fare_cents) {
      fareInCents = rule.minimum_fare_cents;
    }

    return fareInCents / 100; // Retornar em reais
  }

  private static async getApplicableRule(
    ruleType: string,
    locationId?: string
  ): Promise<PricingRule> {
    const { data } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('rule_type', ruleType)
      .eq('is_active', true)
      .or(`location_id.eq.${locationId},location_id.is.null`)
      .order('priority', { ascending: false })
      .limit(1)
      .single();

    return data;
  }

  private static getTimeMultiplier(rule: PricingRule, timestamp: Date): number {
    const hour = timestamp.getHours();
    let multiplier = 1.0;

    // Horário de pico (7h-9h, 17h-19h)
    if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 19)) {
      multiplier *= rule.peak_hour_multiplier;
    }

    // Horário noturno (22h-6h)
    if (hour >= 22 || hour < 6) {
      multiplier *= rule.night_hour_multiplier;
    }

    return multiplier;
  }
}

// 3. Hook
export function useFareEstimate(distanceKm: number, locationId?: string) {
  return useQuery({
    queryKey: ['fare-estimate', distanceKm, locationId],
    queryFn: () => PricingService.calculateRideFare({ distanceKm, locationId }),
    enabled: distanceKm > 0,
  });
}

// 4. Uso
function FareEstimate({ distanceKm, locationId }: Props) {
  const { data: fare, isLoading } = useFareEstimate(distanceKm, locationId);
  
  if (isLoading) return <Skeleton />;
  
  return <div>Estimativa: {formatPrice(fare)}</div>;
}
```

**Benefícios**:
- ✅ Preços diferentes por região
- ✅ Multiplicadores por horário (pico, noturno)
- ✅ Tarifa mínima configurável
- ✅ Histórico de mudanças de preço

---

## Caso 3: Mock de Vagas

### ❌ Antes (Mock em Produção)

```typescript
// src/modules/vagas/data/mock-vagas.ts
const LOCATION_PITUBA = '384add59-4e53-489d-a7b5-97dea2b3f442';

export const MOCK_VAGAS: Vaga[] = [
  {
    id: "v1",
    titulo: "Desenvolvedor Full Stack",
    salario_min: 6000,  // ← Hardcode
    salario_max: 9000,  // ← Hardcode
    location_id: LOCATION_PITUBA,  // ← Hardcode
    // ...
  },
  // ... mais 7 vagas
];

// src/modules/vagas/hooks/useVagas.ts
import { MOCK_VAGAS } from '../data/mock-vagas';  // ← Import de mock!

export function useVagas() {
  const vagas = MOCK_VAGAS;  // ← Dados fake em produção!
  return { vagas, isLoading: false };
}
```

### ✅ Depois (Service Real + Fixtures Isoladas)

```typescript
// 1. Mover mock para fixtures (apenas testes)
// tests/fixtures/vagas.fixtures.ts
export const MOCK_VAGAS: Vaga[] = [
  {
    id: "v1",
    titulo: "Desenvolvedor Full Stack",
    salario_min: 6000,
    salario_max: 9000,
    location_id: '384add59-4e53-489d-a7b5-97dea2b3f442',
  },
];

// 2. Service real
// src/modules/vagas/services/VagasService.ts
export class VagasService {
  static async getVagasByTerritory(params: {
    locationId?: string;
    locationIds?: string[];
    limit?: number;
  }): Promise<Vaga[]> {
    let query = supabase
      .from('vagas')
      .select('*')
      .eq('status', 'ativa')
      .order('created_at', { ascending: false });

    if (params.locationId) {
      query = query.eq('location_id', params.locationId);
    } else if (params.locationIds?.length) {
      query = query.in('location_id', params.locationIds);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;
    if (error) throw new Error('Falha ao buscar vagas');
    
    return data;
  }
}

// 3. Hook real
export function useVagas(territoryFilter: TerritoryFilter) {
  return useQuery({
    queryKey: ['vagas', territoryFilter],
    queryFn: () => VagasService.getVagasByTerritory({
      locationId: territoryFilter.location_id,
      locationIds: territoryFilter.location_ids,
    }),
  });
}

// 4. Seed script para dev
// scripts/seeds/seed-vagas-dev.ts
import { MOCK_VAGAS } from '../../tests/fixtures/vagas.fixtures';

async function seedVagas() {
  const { error } = await supabase
    .from('vagas')
    .upsert(MOCK_VAGAS, { onConflict: 'id' });
  
  if (error) throw error;
  console.log('✅ Vagas seeded');
}

// Executar: npm run seed:vagas:dev

// 5. Uso em testes
import { MOCK_VAGAS } from '@/tests/fixtures/vagas.fixtures';

describe('VagasService', () => {
  it('should filter vagas by location', () => {
    const filtered = filterVagas(MOCK_VAGAS, locationId);
    expect(filtered).toHaveLength(2);
  });
});
```

**Benefícios**:
- ✅ Dados reais em produção
- ✅ Mock isolado em fixtures
- ✅ Seed script para dev
- ✅ Testes não afetam produção

---

## Caso 4: Categorias de Admin

### ❌ Antes (Hardcode)

```typescript
// src/modules/admin/pages/AdminEventos.tsx
const CATEGORY_OPTIONS = ["show", "feira", "festa", "esportivo", "educação"];
const STATUS_OPTIONS = ["upcoming", "ongoing", "completed", "cancelled"];

function AdminEventos() {
  return (
    <Select>
      {CATEGORY_OPTIONS.map(cat => (
        <option key={cat} value={cat}>{cat}</option>
      ))}
    </Select>
  );
}
```

### ✅ Depois (SSOT)

```typescript
// 1. Migration SQL
CREATE TABLE event_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO event_categories (code, label, icon, display_order)
VALUES
  ('show', 'Show', '🎤', 1),
  ('feira', 'Feira', '🎪', 2),
  ('festa', 'Festa', '🎉', 3),
  ('esportivo', 'Esportivo', '⚽', 4),
  ('educacao', 'Educação', '📚', 5);

-- 2. Service
export class EventCategoryService {
  static async getActiveCategories(): Promise<EventCategory[]> {
    const { data, error } = await supabase
      .from('event_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw new Error('Falha ao buscar categorias');
    return data;
  }
}

// 3. Hook
export function useEventCategories() {
  return useQuery({
    queryKey: ['event-categories'],
    queryFn: () => EventCategoryService.getActiveCategories(),
    staleTime: 1000 * 60 * 60, // 1 hora
  });
}

// 4. Uso
function AdminEventos() {
  const { data: categories } = useEventCategories();
  
  return (
    <Select>
      {categories?.map(cat => (
        <option key={cat.code} value={cat.code}>
          {cat.icon} {cat.label}
        </option>
      ))}
    </Select>
  );
}
```

**Benefícios**:
- ✅ Categorias gerenciáveis via admin
- ✅ Adicionar categoria sem deploy
- ✅ Ícones e ordem configuráveis
- ✅ Ativar/desativar categorias

---

## Caso 5: Áreas Atendidas

### ❌ Antes (Hardcode)

```typescript
// src/app/pages/EmpresaDetailLandingPage.tsx
const AREAS_ATENDIDAS = [
  "Pituba",
  "Itaigara",
  "Caminho das Árvores",
  "Iguatemi",
  "Nordeste de Amaralina",
];

function EmpresaDetail({ business }: Props) {
  return (
    <div>
      <h3>Áreas Atendidas</h3>
      <ul>
        {AREAS_ATENDIDAS.map(area => (
          <li key={area}>{area}</li>
        ))}
      </ul>
    </div>
  );
}
```

### ✅ Depois (SSOT)

```typescript
// 1. Usar tabela existente service_areas
-- Já existe no banco:
-- service_areas (business_id, location_id, delivery_fee, min_order)

// 2. Service
export class ServiceAreaService {
  static async getByBusinessId(businessId: string): Promise<ServiceArea[]> {
    const { data, error } = await supabase
      .from('service_areas')
      .select(`
        *,
        location:locations(
          id,
          name,
          type,
          slug
        )
      `)
      .eq('business_id', businessId)
      .eq('is_active', true);

    if (error) throw new Error('Falha ao buscar áreas de serviço');
    return data;
  }
}

// 3. Hook
export function useServiceAreas(businessId: string) {
  return useQuery({
    queryKey: ['service-areas', businessId],
    queryFn: () => ServiceAreaService.getByBusinessId(businessId),
    enabled: !!businessId,
  });
}

// 4. Uso
function EmpresaDetail({ business }: Props) {
  const { data: areas, isLoading } = useServiceAreas(business.id);
  
  if (isLoading) return <Skeleton />;
  
  return (
    <div>
      <h3>Áreas Atendidas</h3>
      {areas && areas.length > 0 ? (
        <ul>
          {areas.map(area => (
            <li key={area.location.id}>
              {area.location.name}
              {area.delivery_fee > 0 && (
                <span> - Taxa: {formatPrice(area.delivery_fee)}</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>Atende toda a cidade</p>
      )}
    </div>
  );
}
```

**Benefícios**:
- ✅ Áreas configuráveis por negócio
- ✅ Taxa de entrega por área
- ✅ Dados sempre atualizados
- ✅ Negócio gerencia suas próprias áreas

---

## Caso 6: Profile Types

### ❌ Antes (Duplicado)

```typescript
// Arquivo 1
profile_type: z.enum(["personal", "driver", "business", "professional"])

// Arquivo 2
if (profileType === 'driver') { /* ... */ }

// Arquivo 3
const types = ['personal', 'driver', 'business', 'professional'];

// Arquivo 4
type ProfileType = 'personal' | 'driver' | 'business' | 'professional';
```

### ✅ Depois (Centralizado)

```typescript
// 1. Enum centralizado
// src/shared/types/enums.ts
export const PROFILE_TYPES = {
  PERSONAL: 'personal',
  DRIVER: 'driver',
  BUSINESS: 'business',
  PROFESSIONAL: 'professional',
} as const;

export type ProfileType = typeof PROFILE_TYPES[keyof typeof PROFILE_TYPES];

// Type guard
export function isProfileType(value: string): value is ProfileType {
  return Object.values(PROFILE_TYPES).includes(value as ProfileType);
}

// Helper
export function isBusinessProfile(type: ProfileType): boolean {
  return type === PROFILE_TYPES.BUSINESS || type === PROFILE_TYPES.PROFESSIONAL;
}

// 2. Schema
// src/shared/validation/schemas/profile.schema.ts
import { PROFILE_TYPES } from '@/shared/types/enums';

export const ProfileSchema = z.object({
  profile_type: z.enum([
    PROFILE_TYPES.PERSONAL,
    PROFILE_TYPES.DRIVER,
    PROFILE_TYPES.BUSINESS,
    PROFILE_TYPES.PROFESSIONAL,
  ]),
  // ...
});

// 3. Uso em componentes
import { PROFILE_TYPES, isBusinessProfile } from '@/shared/types/enums';

function ProfileCard({ profile }: Props) {
  if (profile.profile_type === PROFILE_TYPES.DRIVER) {
    return <DriverCard profile={profile} />;
  }
  
  if (isBusinessProfile(profile.profile_type)) {
    return <BusinessCard profile={profile} />;
  }
  
  return <PersonalCard profile={profile} />;
}
```

**Benefícios**:
- ✅ Fonte única de verdade
- ✅ Type safety completo
- ✅ Helpers reutilizáveis
- ✅ Fácil adicionar novo tipo

---

## Caso 7: Fallbacks Numéricos

### ❌ Antes (Números Mágicos)

```typescript
// Espalhado pelo código
const reputation = profile.reputation || 0;
const score = identity?.reputation.score ?? 0;
const level = context?.reputation.level ?? 1;
const points = profile.pontos || 0;
```

### ✅ Depois (Constantes Centralizadas)

```typescript
// 1. Constantes
// src/shared/constants/defaults.ts
export const DEFAULT_VALUES = {
  REPUTATION: {
    SCORE: 0,
    LEVEL: 1,
    MIN_SCORE: 0,
    MAX_SCORE: 1000,
  },
  GAMIFICATION: {
    POINTS: 0,
    INITIAL_LEVEL: 1,
  },
  RATING: {
    DEFAULT: 0,
    MIN: 0,
    MAX: 5,
  },
} as const;

// 2. Helper functions
export function getReputationScore(profile: Profile): number {
  return profile.reputation?.score ?? DEFAULT_VALUES.REPUTATION.SCORE;
}

export function getReputationLevel(profile: Profile): number {
  return profile.reputation?.level ?? DEFAULT_VALUES.REPUTATION.LEVEL;
}

export function getGamificationPoints(profile: Profile): number {
  return profile.pontos ?? DEFAULT_VALUES.GAMIFICATION.POINTS;
}

// 3. Uso
import { getReputationScore, getReputationLevel } from '@/shared/constants/defaults';

function ReputationCard({ profile }: Props) {
  const score = getReputationScore(profile);
  const level = getReputationLevel(profile);
  
  return (
    <div>
      <p>Reputação: {score}</p>
      <p>Nível: {level}</p>
    </div>
  );
}
```

**Benefícios**:
- ✅ Valores default centralizados
- ✅ Fácil mudar defaults
- ✅ Código mais legível
- ✅ Type safety

---

## 🎯 Checklist de Refatoração

Para cada hardcode identificado:

- [ ] Identificar fonte de verdade (banco, config, enum)
- [ ] Criar migration se necessário
- [ ] Implementar service/repository
- [ ] Criar hook com cache
- [ ] Migrar código existente
- [ ] Adicionar testes
- [ ] Seed com dados atuais
- [ ] Documentar padrão
- [ ] Code review
- [ ] Deploy e validação

---

## 📚 Referências

- [AUDITORIA_HARDCODES_COMPLETA.md](./AUDITORIA_HARDCODES_COMPLETA.md)
- [PLANO_MIGRACAO_HARDCODES.md](./PLANO_MIGRACAO_HARDCODES.md)
- [SSOT_PATTERNS.md](../SSOT_PATTERNS.md)

---

**Última Atualização**: 2026-04-16  
**Próxima Revisão**: Após implementação dos casos
