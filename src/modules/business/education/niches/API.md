# Education Niches - API Pública

## Visão Geral

Este documento descreve a API pública para trabalhar com nichos do módulo Education.

## Regra Canônica

```
capability final = nicho permite AND plano permite
```

Ou seja:
- O nicho precisa permitir o recurso (via `enabledCapabilities`)
- O plano/assinatura também precisa permitir (via tier do plano)
- Se qualquer um negar, a ação deve ser bloqueada

## Hooks

### useEducationNiche

Hook para acessar configuração de nicho.

```typescript
import { useEducationNiche } from '@/modules/business/education/niches';

function MyComponent({ nicheKey }: { nicheKey: string }) {
  const { 
    config,           // EducationNicheConfig | null
    hasCapability,    // (capability: EducationNicheCapability) => boolean
    adminSections,    // EducationAdminSection[]
    shouldShowSection, // (section: EducationAdminSection) => boolean
    isEnabled,        // boolean
    isBeta,           // boolean
    canUseNow,        // boolean
  } = useEducationNiche(nicheKey);
  
  // Verificar se tem uma capability
  const hasEvents = hasCapability('events_public');
  
  // Verificar se deve mostrar seção admin
  const showAnalytics = shouldShowSection('analytics');
}
```

### useEducationNicheBilling

Hook integrado para nicho + billing (recomendado para gating).

```typescript
import { useEducationNicheBilling } from '@/modules/business/education/niches';

function MyComponent({ nicheKey, businessId }: { nicheKey: string; businessId: string }) {
  const {
    // Estado
    isReady,              // boolean
    isLoading,            // boolean
    hasErrors,            // boolean
    
    // Helpers de capability
    can,                  // (capability: EducationNicheCapability) => CapabilityCheck
    
    // Verificações operacionais
    checkCanCreateProgram, // (currentCount: number) => { allowed: boolean; reason?: string }
    checkCanCreateEvent,   // (currentCount: number) => { allowed: boolean; reason?: string }
    checkCanReceiveLead,   // (currentCount: number) => { allowed: boolean; reason?: string }
    calculateLimits,       // (usage: { programCount, eventCount, leadsThisMonth }) => OperationalLimitsCheck | null
    
    // Validação
    validateAction,       // (action, payload?) => EducationNicheValidationResult
  } = useEducationNicheBilling({
    nicheKey,
    businessId,
  });
  
  // Verificar capability efetiva (nicho + plano)
  const eventsCheck = can('events_public');
  if (eventsCheck.allowed) {
    // Pode usar eventos
  } else {
    // Bloqueado - ver motivo
    console.log(eventsCheck.reason); // 'niche_denied' | 'plan_denied' | 'inactive'
    console.log(eventsCheck.upgradeMessage);
  }
}
```

## Services

### EducationNicheConfigService

Serviço para leitura e validação de configuração de nichos.

```typescript
import { EducationNicheConfigService } from '@/modules/business/education/niches';

// Obter configuração de nicho
const config = EducationNicheConfigService.getConfig('regular_school');

// Verificar se tem capability
const hasCapability = EducationNicheConfigService.hasCapability('regular_school', 'events_public');

// Verificar se seção admin deve ser exibida
const showSection = EducationNicheConfigService.shouldShowSection('regular_school', 'analytics');

// Listar nichos selecionáveis
const selectableNiches = EducationNicheConfigService.listNiches({ isSelectable: true });

// Validar payload para nicho
const validation = EducationNicheConfigService.validateForNiche('regular_school', payload);
```

### EducationNicheBillingIntegration

Serviço para integração entre nicho e billing.

```typescript
import { EducationNicheBillingIntegration } from '@/modules/business/education/niches';

const context = {
  nicheKey: 'regular_school',
  planTier: PlanTier.PRO,
  businessId: 'uuid',
};

// Resolver capability efetiva (nicho + plano)
const result = EducationNicheBillingIntegration.resolveEffectiveCapability(
  context,
  'events_public'
);
// result: { allowed, reason, nicheHas, planAllows }

// Verificar se pode criar programa/evento/lead
const canCreate = EducationNicheBillingIntegration.canCreateProgram(context, 5);

// Obter limites operacionais
const limits = EducationNicheBillingIntegration.getOperationalLimits(context, {
  programCount: 5,
  eventCount: 2,
  leadsThisMonth: 50,
});

// Validar ação específica
const validation = EducationNicheBillingIntegration.validateAction(context, 'view_analytics');
```

## Components

### EducationCapabilityGuard

Guard visual para capabilities.

```tsx
import { EducationCapabilityGuard } from '@/modules/business/education/niches';

<EducationCapabilityGuard
  nicheKey={profile.niche_key}
  businessId={businessId}
  capability="events_public"
  fallback={<div>Eventos não disponíveis para este nicho</div>}
>
  <EventsList />
</EducationCapabilityGuard>
```

### EducationUpgradeBanner

Banner de upgrade para bloqueios.

```tsx
import { EducationUpgradeBanner } from '@/modules/business/education/niches';

// Bloqueio por plano
<EducationUpgradeBanner
  nicheKey={profile.niche_key}
  businessId={businessId}
  reason="plan_denied"
  feature="events_public"
  variant="banner"
/>

// Bloqueio por nicho
<EducationUpgradeBanner
  nicheKey={profile.niche_key}
  businessId={businessId}
  reason="niche_denied"
  feature="events_public"
  variant="card"
/>

// Limite atingido
<EducationUpgradeBanner
  nicheKey={profile.niche_key}
  businessId={businessId}
  reason="limit_reached"
  feature="events_public"
  currentCount={10}
  maxCount={10}
  variant="banner"
/>
```

## Registry Helpers

```typescript
import { 
  getNicheByKey,
  getAllNiches,
  getSelectableNiches,
  hasCapability,
  shouldShowAdminSection,
  canCreateProgram,
  canCreateEvent,
  canReceiveLead,
  allowsAnalytics,
  allowsExport,
} from '@/modules/business/education/niches/registry';

// Obter nicho por key
const niche = getNicheByKey('regular_school');

// Verificar se nicho tem capability
const hasEvents = hasCapability('regular_school', 'events_public');

// Verificar se pode criar programa (por limite do nicho)
const canCreate = canCreateProgram('regular_school', 5);

// Verificar se permite analytics
const allows = allowsAnalytics('regular_school');
```

## Types

### EducationNicheCapability

```typescript
type EducationNicheCapability =
  | 'basic_programs_catalog'
  | 'lead_capture'
  | 'lead_pipeline'
  | 'events_public'
  | 'trial_class_booking'
  | 'whatsapp_cta'
  | 'document_upload_pre_enrollment'
  | 'guardian_portal_basic'
  | 'schedule_public'
  | 'attendance_tracking'
  | 'gradebook'
  | 'transport_tracking'
  | 'payment_installments'
  | 'analytics_basic'
  | 'analytics_advanced';
```

### EducationNicheStatus

```typescript
type EducationNicheStatus = 
  | 'full_enabled'    // Nicho completo e estável
  | 'basic_enabled'   // Nicho básico, funcional
  | 'beta'            // Em testes, pode ter limitações
  | 'planned';        // Planejado, não implementado
```

## Exemplos de Uso

### Verificar se pode criar evento

```typescript
function canCreateEvent(nicheKey: string, businessId: string, currentCount: number) {
  const { can, checkCanCreateEvent } = useEducationNicheBilling({ nicheKey, businessId });
  
  // 1. Verificar capability (nicho + plano)
  const capabilityCheck = can('events_public');
  if (!capabilityCheck.allowed) {
    return {
      allowed: false,
      reason: capabilityCheck.reason,
      message: capabilityCheck.upgradeMessage,
    };
  }
  
  // 2. Verificar limite operacional
  const limitCheck = checkCanCreateEvent(currentCount);
  if (!limitCheck.allowed) {
    return {
      allowed: false,
      reason: 'limit_reached',
      message: limitCheck.reason,
    };
  }
  
  return { allowed: true };
}
```

### Handler de criação com validação

```typescript
const handleCreate = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // 1. Validar capability
  const capabilityCheck = nicheBilling.can('events_public');
  if (!capabilityCheck.allowed) {
    toast({
      title: 'Recurso bloqueado',
      description: capabilityCheck.upgradeMessage,
      variant: 'destructive',
    });
    return;
  }
  
  // 2. Validar limite
  const limitCheck = nicheBilling.checkCanCreateEvent(events.length);
  if (!limitCheck.allowed) {
    toast({
      title: 'Limite atingido',
      description: limitCheck.reason,
      variant: 'destructive',
    });
    return;
  }
  
  // 3. Criar
  await create(payload);
};
```

## Anti-Patterns a Evitar

❌ **NÃO fazer:**

```typescript
// Hardcode de capability em componente
if (nicheKey === 'regular_school') {
  // ...
}

// Hardcode de limite
const MAX_PROGRAMS = 20; // Deve vir do registry

// Matriz paralela de entitlements
const ENTITLEMENTS = {
  regular_school: { maxPrograms: 20 }, // Use o registry!
};

// Regra apenas na UI sem validação no handler
<Button disabled={programs.length >= 20}>Criar</Button>
```

✅ **FAZER:**

```typescript
// Usar registry/service/hook
const { can, checkCanCreateProgram } = useEducationNicheBilling({ nicheKey, businessId });
const canCreate = can('basic_programs_catalog');

// Validar no handler
if (!canCreate.allowed) {
  toast({ description: canCreate.upgradeMessage });
  return;
}

// Usar guard visual
<EducationCapabilityGuard nicheKey={nicheKey} businessId={businessId} capability="events_public">
  <EventsList />
</EducationCapabilityGuard>
```

## Fluxo de Dados

```
1. Página/Componente
   ↓
2. useEducationNicheBilling (hook)
   ↓
3. EducationNicheBillingIntegration (service)
   ↓
4. Registry + Billing entitlement authority (SSOT)
   ↓
5. Capability final = nicho AND plano
```

## SSOT (Single Source of Truth)

A única fonte de verdade para:
- **Capabilities**: `registry.ts` - `enabledCapabilities` por nicho
- **Limites**: `registry.ts` - `entitlements` por nicho
- **Planos/entitlements**: `EducationSubscriptionService` + `core/billing`
- **Validação operacional**: `EducationNicheBillingIntegration.ts` consumindo o registry

Nunca duplique essas informações em componentes, páginas, hooks paralelos ou services de limite concorrentes.
