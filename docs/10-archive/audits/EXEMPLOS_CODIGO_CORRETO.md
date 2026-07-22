# Exemplos de Código - Correto vs Incorreto

**Data:** 2026-04-16  
**Objetivo:** Guia prático com exemplos de código para evitar hardcodes

---

## 📚 Índice

1. [Preços e Valores Monetários](#1-preços-e-valores-monetários)
2. [Coordenadas Geográficas](#2-coordenadas-geográficas)
3. [Status e Categorias](#3-status-e-categorias)
4. [Limites e Contadores](#4-limites-e-contadores)
5. [Mocks e Fixtures](#5-mocks-e-fixtures)
6. [Feature Flags](#6-feature-flags)
7. [Validações](#7-validações)
8. [Configurações](#8-configurações)

---

## 1. Preços e Valores Monetários

### ❌ INCORRETO - Hardcode

```typescript
// ❌ Preço hardcoded no componente
function PricingCard() {
  const price = 49.90;
  const minPrice = 5.00;
  
  return (
    <div>
      <h3>Plano Pro</h3>
      <p>R$ {price.toFixed(2)}</p>
      <small>Mínimo: R$ {minPrice.toFixed(2)}</small>
    </div>
  );
}

// ❌ Cálculo de tarifa hardcoded
function calculateFare(distanceKm: number): number {
  const baseFare = 5.00;
  const perKmRate = 2.50;
  return baseFare + (distanceKm * perKmRate);
}

// ❌ Validação com valor hardcoded
const schema = z.object({
  price: z.number()
    .min(5, "Preço mínimo é R$ 5,00")
    .max(10000, "Preço máximo é R$ 10.000,00"),
});
```

### ✅ CORRETO - SSOT

```typescript
// ✅ Busca preço do banco via service
import { useBillingPlan } from '@/core/billing/hooks/useBillingPlans';

function PricingCard() {
  const { data: plan, isLoading } = useBillingPlan('pro');
  
  if (isLoading) return <Skeleton />;
  if (!plan) return null;
  
  return (
    <div>
      <h3>{plan.name}</h3>
      <p>{plan.price}</p>
    </div>
  );
}

// ✅ Cálculo de tarifa via service
import { PricingService } from '@/modules/mobility/services/PricingService';

async function calculateFare(
  distanceKm: number,
  locationId?: string
): Promise<number> {
  return PricingService.calculateRideFare({
    distanceKm,
    locationId,
  });
}

// ✅ Validação dinâmica no backend
import { MobilityPricingService } from '@/modules/mobility/services/MobilityPricingService';

async function validatePrice(
  price: number,
  locationId?: string
): Promise<{ valid: boolean; error?: string }> {
  const rules = await MobilityPricingService.getPricingRules(locationId);
  
  if (price < rules.minPrice) {
    return {
      valid: false,
      error: `Preço mínimo é R$ ${rules.minPrice.toFixed(2)}`,
    };
  }
  
  return { valid: true };
}
```

---

## 2. Coordenadas Geográficas

### ❌ INCORRETO - Hardcode

```typescript
// ❌ Coordenadas hardcoded
const touristPoints = [
  {
    name: 'Pelourinho',
    latitude: -12.9714,
    longitude: -38.5103,
  },
  {
    name: 'Farol da Barra',
    latitude: -13.0103,
    longitude: -38.5324,
  },
];

// ❌ Centro do mapa hardcoded
function MapView() {
  const center = {
    lat: -12.9714,
    lng: -38.5103,
  };
  
  return <Map center={center} />;
}

// ❌ Ponto de embarque hardcoded
const defaultBoardingPoint = {
  name: "Nordeste de Amaralina",
  latitude: -12.9833,
  longitude: -38.4667,
};
```

### ✅ CORRETO - SSOT

```typescript
// ✅ Busca pontos turísticos do banco
import { useTouristPoints } from '@/modules/guide/hooks/useTouristPoints';

function TouristPointsList() {
  const { data: points, isLoading } = useTouristPoints({
    locationId: currentLocationId,
  });
  
  if (isLoading) return <Loading />;
  
  return (
    <div>
      {points?.map(point => (
        <PointCard
          key={point.id}
          name={point.name}
          coordinates={{
            lat: point.address.latitude,
            lng: point.address.longitude,
          }}
        />
      ))}
    </div>
  );
}

// ✅ Centro do mapa via location service
import { useLocationCenter } from '@/core/location/hooks/useLocationCenter';

function MapView({ locationId }: { locationId: string }) {
  const { data: center } = useLocationCenter(locationId);
  
  if (!center) return null;
  
  return <Map center={center} />;
}

// ✅ Pontos de embarque do banco
import { useBoardingPoints } from '@/modules/mobility/hooks/useBoardingPoints';

function BoardingPointSelector() {
  const { data: points } = useBoardingPoints({
    locationId: currentLocationId,
  });
  
  return (
    <Select>
      {points?.map(point => (
        <option key={point.id} value={point.id}>
          {point.name}
        </option>
      ))}
    </Select>
  );
}
```

---

## 3. Status e Categorias

### ❌ INCORRETO - Hardcode

```typescript
// ❌ Status hardcoded
type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered';

const statusLabels = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Pronto',
  delivered: 'Entregue',
};

// ❌ Categorias hardcoded
const jobCategories = [
  { id: 'tech', name: 'Tecnologia' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'sales', name: 'Vendas' },
];

// ❌ Tipos de perfil hardcoded
const profileTypes = [
  { type: 'personal', label: 'Pessoal' },
  { type: 'business', label: 'Empresa' },
  { type: 'driver', label: 'Motorista' },
];
```

### ✅ CORRETO - SSOT

```typescript
// ✅ Status do banco
import { useOrderStatuses } from '@/modules/orders/hooks/useOrderStatuses';

function OrderStatusBadge({ status }: { status: string }) {
  const { data: statuses } = useOrderStatuses();
  const statusInfo = statuses?.find(s => s.code === status);
  
  return (
    <Badge color={statusInfo?.color}>
      {statusInfo?.label}
    </Badge>
  );
}

// ✅ Categorias do banco
import { useJobCategories } from '@/modules/jobs/hooks/useJobCategories';

function CategoryFilter() {
  const { data: categories } = useJobCategories();
  
  return (
    <Select>
      {categories?.map(cat => (
        <option key={cat.id} value={cat.id}>
          {cat.name}
        </option>
      ))}
    </Select>
  );
}

// ✅ Tipos de perfil do banco
import { useProfileTypes } from '@/core/profiles/hooks/useProfileTypes';

function ProfileTypeSelector() {
  const { data: types } = useProfileTypes();
  
  return (
    <div>
      {types?.map(type => (
        <Card key={type.code}>
          <h3>{type.label}</h3>
          <p>{type.description}</p>
        </Card>
      ))}
    </div>
  );
}
```

---

## 4. Limites e Contadores

### ❌ INCORRETO - Hardcode

```typescript
// ❌ Limites operacionais hardcoded
const MAX_MENU_ITEMS = 20;
const MAX_IMAGES = 5;
const MAX_PROMOTIONS = 3;

function validateMenuItems(items: MenuItem[]): boolean {
  if (items.length > MAX_MENU_ITEMS) {
    throw new Error(`Máximo de ${MAX_MENU_ITEMS} itens permitidos`);
  }
  return true;
}

// ❌ Timeout hardcoded
const OFFER_TIMEOUT = 30; // segundos

function createOffer() {
  setTimeout(() => {
    expireOffer();
  }, OFFER_TIMEOUT * 1000);
}

// ❌ Page size hardcoded
function fetchPosts() {
  return api.get('/posts?limit=20');
}
```

### ✅ CORRETO - SSOT

```typescript
// ✅ Limites do plano do usuário
import { usePlanEntitlements } from '@/core/billing/hooks/useBillingPlans';

function validateMenuItems(
  items: MenuItem[],
  planTier: string
): Promise<boolean> {
  const { data: entitlements } = usePlanEntitlements(planTier);
  
  const maxItems = entitlements?.maxMenuItems;
  
  if (maxItems && items.length > maxItems) {
    throw new Error(`Máximo de ${maxItems} itens no plano ${planTier}`);
  }
  
  return true;
}

// ✅ Timeout da configuração
import { MobilityPricingService } from '@/modules/mobility/services/MobilityPricingService';

async function createOffer(locationId?: string) {
  const rules = await MobilityPricingService.getDispatchRules(locationId);
  
  setTimeout(() => {
    expireOffer();
  }, rules.offerTimeoutSeconds * 1000);
}

// ✅ Page size da configuração (ou constante de UI se for técnico)
import { PAGINATION } from '@/shared/constants/pagination';

function fetchPosts() {
  // ✅ OK se for constante técnica de UI
  return api.get(`/posts?limit=${PAGINATION.DEFAULT_LIMIT}`);
}

// ✅ Melhor ainda: page size do backend
function fetchPosts() {
  // Backend decide o page size baseado em regras
  return api.get('/posts'); // Backend retorna com paginação
}
```

---

## 5. Mocks e Fixtures

### ❌ INCORRETO - Mock em Runtime

```typescript
// ❌ Mock importado em código de produção
import { MOCK_VAGAS } from '../data/mock-vagas';

export function useVagas() {
  const [vagas, setVagas] = useState(MOCK_VAGAS);
  
  return { vagas };
}

// ❌ Fallback para mock em produção
export function useTouristPoints() {
  const { data: realPoints } = useQuery(/* ... */);
  
  // ❌ Se não houver dados reais, usa mock
  const useMocks = realPoints.length === 0;
  const points = useMocks ? MOCK_TOURIST_POINTS : realPoints;
  
  return { points };
}

// ❌ Mock inline no componente
function JobsList() {
  const mockJobs = [
    { id: '1', title: 'Desenvolvedor', salary: 5000 },
    { id: '2', title: 'Designer', salary: 4000 },
  ];
  
  return mockJobs.map(job => <JobCard job={job} />);
}
```

### ✅ CORRETO - Dados Reais + Fixtures Isoladas

```typescript
// ✅ Service real com dados do banco
import { VagasService } from '../services/VagasService';

export function useVagas() {
  return useQuery({
    queryKey: ['vagas'],
    queryFn: () => VagasService.getVagas(),
  });
}

// ✅ Empty state quando não houver dados
export function useTouristPoints() {
  const { data: points, isLoading } = useQuery({
    queryKey: ['tourist-points'],
    queryFn: () => TouristPointService.getPoints(),
  });
  
  return { points: points || [], isLoading };
}

// ✅ Componente busca dados reais
function JobsList() {
  const { data: jobs, isLoading } = useJobs();
  
  if (isLoading) return <Loading />;
  if (!jobs?.length) return <EmptyState />;
  
  return jobs.map(job => <JobCard key={job.id} job={job} />);
}

// ✅ Fixtures apenas para testes
// tests/fixtures/vagas.fixtures.ts
export const VAGA_FIXTURE: Vaga = {
  id: 'test-vaga-1',
  title: 'Desenvolvedor Frontend',
  // ... dados de teste
};

// ✅ Storybook com fixtures
// JobCard.stories.tsx
import { VAGA_FIXTURE } from '@/tests/fixtures/vagas.fixtures';

export const Default: Story = {
  args: {
    job: VAGA_FIXTURE,
  },
};
```

---

## 6. Feature Flags

### ❌ INCORRETO - Hardcode

```typescript
// ❌ Feature flag hardcoded
const FEATURE_ENABLED = true;

function NewFeature() {
  if (!FEATURE_ENABLED) return null;
  return <div>Nova funcionalidade</div>;
}

// ❌ Rollout hardcoded
const ROLLOUT_PERCENTAGE = 50;

function shouldShowFeature(userId: string): boolean {
  const hash = hashCode(userId);
  return (hash % 100) < ROLLOUT_PERCENTAGE;
}

// ❌ Território hardcoded
const ENABLED_CITIES = ['salvador', 'sao-paulo', 'rio-de-janeiro'];

function isFeatureEnabled(citySlug: string): boolean {
  return ENABLED_CITIES.includes(citySlug);
}
```

### ✅ CORRETO - SSOT

```typescript
// ✅ Feature flag do banco
import { useFeatureFlag } from '@/core/rollout/hooks/useFeatureFlag';

function NewFeature() {
  const { isEnabled } = useFeatureFlag('new-feature');
  
  if (!isEnabled) return null;
  return <div>Nova funcionalidade</div>;
}

// ✅ Rollout do banco
import { RolloutService } from '@/core/rollout/services/RolloutService';

async function shouldShowFeature(
  userId: string,
  featureKey: string
): Promise<boolean> {
  return RolloutService.isUserInRollout(userId, featureKey);
}

// ✅ Rollout territorial do banco
import { useModuleRollout } from '@/core/rollout/hooks/useModuleRollout';

function GastronomyFeature({ locationId }: { locationId: string }) {
  const { isActive } = useModuleRollout('gastronomy', locationId);
  
  if (!isActive) return <ComingSoon />;
  return <GastronomyModule />;
}
```

---

## 7. Validações

### ❌ INCORRETO - Hardcode

```typescript
// ❌ Validação com valores hardcoded
const schema = z.object({
  title: z.string()
    .min(10, "Mínimo 10 caracteres")
    .max(100, "Máximo 100 caracteres"),
  
  price: z.number()
    .min(5, "Preço mínimo R$ 5,00")
    .max(10000, "Preço máximo R$ 10.000,00"),
  
  vehicleYear: z.number()
    .min(2000, "Ano mínimo: 2000")
    .max(2026, "Ano máximo: 2026"),
});

// ❌ Validação inline
function validateRide(data: RideData): boolean {
  if (data.price < 5) {
    throw new Error("Preço mínimo é R$ 5,00");
  }
  
  if (data.distance > 100) {
    throw new Error("Distância máxima é 100km");
  }
  
  return true;
}
```

### ✅ CORRETO - Validação Dinâmica

```typescript
// ✅ Validação dinâmica no backend
import { MobilityPricingService } from '@/modules/mobility/services/MobilityPricingService';

async function createRideSchema(locationId?: string) {
  const rules = await MobilityPricingService.getPricingRules(locationId);
  
  return z.object({
    title: z.string()
      .min(10)
      .max(100),
    
    price: z.number()
      .min(rules.minPrice, `Preço mínimo R$ ${rules.minPrice.toFixed(2)}`)
      .max(rules.maxPrice, `Preço máximo R$ ${rules.maxPrice.toFixed(2)}`),
    
    vehicleYear: z.number()
      .min(rules.minVehicleYear)
      .max(rules.maxVehicleYear),
  });
}

// ✅ Validação via service
async function validateRide(
  data: RideData,
  locationId?: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  const priceValidation = await MobilityPricingService.validatePrice(
    data.price,
    locationId
  );
  
  if (!priceValidation.valid) {
    errors.push(priceValidation.error!);
  }
  
  const distanceValidation = await MobilityPricingService.validateDistance(
    data.distance,
    locationId
  );
  
  if (!distanceValidation.valid) {
    errors.push(distanceValidation.error!);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
```

---

## 8. Configurações

### ❌ INCORRETO - Hardcode

```typescript
// ❌ Configurações hardcoded
const CONFIG = {
  maxRetries: 3,
  timeout: 5000,
  searchRadius: 10,
  cacheTime: 300000,
};

// ❌ URLs hardcoded
const API_URLS = {
  production: 'https://api.prod.com',
  staging: 'https://api.staging.com',
  development: 'http://localhost:3000',
};

// ❌ Chaves de API hardcoded (NUNCA!)
const GOOGLE_MAPS_KEY = 'AIzaSyC...';
const STRIPE_KEY = 'pk_live_...';
```

### ✅ CORRETO - Configuração Adequada

```typescript
// ✅ Configurações do banco (operacionais)
import { ConfigService } from '@/core/config/ConfigService';

async function getAppConfig() {
  return {
    maxRetries: await ConfigService.get('max_retries'),
    timeout: await ConfigService.get('api_timeout'),
    searchRadius: await ConfigService.get('search_radius_km'),
  };
}

// ✅ URLs de ambiente
const API_URL = import.meta.env.VITE_API_URL;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// ✅ Chaves de API de variáveis de ambiente
const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// ✅ Constantes técnicas de UI (aceitável)
const UI_CONFIG = {
  animationDuration: 300,
  debounceDelay: 500,
  toastDuration: 3000,
} as const;
```

---

## 🎯 Regras de Ouro

### ✅ PODE Hardcodar

1. **Design Tokens**
   ```typescript
   const colors = { primary: '#007bff', secondary: '#6c757d' };
   const spacing = { sm: 8, md: 16, lg: 24 };
   ```

2. **Constantes Técnicas de UI**
   ```typescript
   const ANIMATION_DURATION = 300;
   const DEBOUNCE_DELAY = 500;
   const TOAST_AUTO_HIDE = 3000;
   ```

3. **Enums Técnicos**
   ```typescript
   enum HttpMethod { GET = 'GET', POST = 'POST' }
   enum LogLevel { DEBUG, INFO, WARN, ERROR }
   ```

4. **Labels Puramente Visuais**
   ```typescript
   const labels = {
     save: 'Salvar',
     cancel: 'Cancelar',
     loading: 'Carregando...',
   };
   ```

### ❌ NÃO PODE Hardcodar

1. **Preços e Valores Monetários**
2. **Coordenadas Geográficas**
3. **UUIDs de Entidades Específicas**
4. **Status e Categorias de Negócio**
5. **Limites Operacionais**
6. **Regras de Negócio**
7. **Feature Flags**
8. **Timeouts Operacionais**
9. **Dados de Mocks em Runtime**
10. **Chaves de API**

---

## 🔍 Como Identificar Hardcode Indevido

### Perguntas para Fazer

1. **Este valor pode mudar sem deploy?**
   - Se SIM → Deve estar no banco
   - Se NÃO → Pode ser hardcode (se for técnico)

2. **Este valor varia por território/usuário/horário?**
   - Se SIM → Deve estar no banco
   - Se NÃO → Avaliar caso a caso

3. **Este valor é uma regra de negócio?**
   - Se SIM → Deve estar no banco
   - Se NÃO → Pode ser hardcode (se for técnico)

4. **Este valor precisa de auditoria/histórico?**
   - Se SIM → Deve estar no banco
   - Se NÃO → Avaliar caso a caso

5. **Este valor é puramente visual/técnico?**
   - Se SIM → Pode ser hardcode
   - Se NÃO → Deve estar no banco

---

## 📚 Referências

- [SSOT Patterns](../SSOT_PATTERNS.md)
- [Quick Reference SSOT](../QUICK_REFERENCE_SSOT.md)
- [Relatório de Hardcodes](./RELATORIO_HARDCODES_ENCONTRADOS.md)
- [Plano de Migração](./PLANO_MIGRACAO_HARDCODES.md)

---

**Última Atualização:** 2026-04-16  
**Versão:** 1.0
