# Education Module

**Versão**: 1.0.0  
**Status**: ✅ Production Ready  
**Testes**: 234/234 passando

---

## Visão Geral

O módulo Education permite que instituições de ensino criem perfis públicos, gerenciem programas educacionais, capturem e convertam leads através de um pipeline estruturado.

### Funcionalidades Principais

- 🏫 **Perfis de Instituições**: Cadastro completo com informações, programas e eventos
- 📚 **Gestão de Programas**: Criação e gerenciamento de cursos/programas oferecidos
- 👥 **Pipeline de Leads**: Captura e conversão de interessados (new → contacted → enrolled)
- 📅 **Eventos**: Calendário de eventos da instituição (portas abertas, matrículas, etc)
- 📊 **Analytics**: Métricas de conversão e performance
- 🎯 **Nichos**: Sistema extensível para diferentes tipos de instituição

---

## Arquitetura

### Estrutura de Diretórios

```
src/modules/business/education/
├── components/          # Componentes React reutilizáveis
├── constants/          # Constantes e configurações
├── hooks/              # React hooks customizados
├── niches/             # Sistema de nichos por tipo de instituição
│   ├── services/       # Serviços de configuração de nichos
│   ├── hooks/          # Hooks para nichos
│   └── types.ts        # Tipos de nichos
├── pages/              # Páginas públicas e admin
│   ├── EducationExplorerPage.tsx      # Vitrine territorial
│   ├── EducationDetailPage.tsx        # Detalhes da instituição
│   ├── EducationDashboardPage.tsx     # Dashboard admin
│   ├── EducationSetupPage.tsx         # Cadastro/configuração
│   ├── EducationProgramsPage.tsx      # Gestão de programas
│   ├── EducationLeadsPage.tsx         # Gestão de leads
│   ├── EducationEventsPage.tsx        # Gestão de eventos
│   ├── EducationAnalyticsPage.tsx     # Analytics
│   └── EducationPlansPage.tsx         # Gestão de planos
├── services/           # Serviços de negócio
│   ├── EducationService.ts                    # Facade principal
│   ├── EducationUrlService.ts                 # Geração de URLs
│   ├── EducationSubscriptionService.ts        # Integração billing
│   ├── EducationLimitValidationService.ts     # Validação de limites
│   ├── EducationTrackingService.ts            # Tracking de analytics
│   ├── EducationObservabilityService.ts       # Observabilidade
│   ├── education.queries.ts                   # Queries tipadas
│   └── education.mutations.ts                 # Mutations tipadas
├── types/              # Tipos TypeScript
└── index.ts            # Exports públicos
```

### Database Schema

```sql
-- Perfil da instituição
education_profiles (
  id, business_id, institution_type, niche_key,
  summary, whatsapp_number, status, published_at
)

-- Programas/cursos oferecidos
education_programs (
  id, education_profile_id, name, description,
  age_group, shift, modality, available_slots, price_from
)

-- Leads capturados
education_leads (
  id, education_profile_id, full_name, email, phone,
  status, child_name, child_age, interest_note
)

-- Histórico de interações com leads
education_lead_events (
  id, lead_id, event_type, payload, actor_user_id
)

-- Eventos da instituição
education_events (
  id, education_profile_id, title, description,
  starts_at, ends_at, location, is_public
)

-- Analytics e tracking
education_analytics_events (
  id, education_profile_id, event_type, event_data
)
```

---

## Uso

### Importação

```typescript
import {
  // Services
  EducationService,
  EducationUrlService,
  EducationObservabilityService,
  
  // Hooks
  useEducationList,
  useEducationDetail,
  useEducationProfile,
  useEducationLeads,
  
  // Types
  EducationProfile,
  EducationProgram,
  EducationLead,
  
  // Niches
  getNicheByKey,
  useEducationNiche,
} from '@/modules/business/education';
```

### Exemplos

#### Criar Perfil de Instituição

```typescript
import { EducationService } from '@/modules/business/education';

const profile = await EducationService.saveSetupProfile({
  businessId: 'business-123',
  institutionType: 'Escola Regular',
  nicheKey: 'regular_school',
  summary: 'Escola de ensino fundamental e médio',
  whatsappNumber: '+5571999999999',
});
```

#### Capturar Lead

```typescript
import { EducationService } from '@/modules/business/education';

const lead = await EducationService.createLead({
  educationProfileId: 'profile-123',
  fullName: 'Maria Silva',
  email: 'maria@example.com',
  phone: '+5571988888888',
  childName: 'João Silva',
  childAge: 8,
  interestNote: 'Interessada em matrícula para 2025',
  sourceChannel: 'website',
});
```

#### Mover Lead no Pipeline

```typescript
import { EducationService } from '@/modules/business/education';

const updatedLead = await EducationService.moveLeadInPipeline({
  leadId: 'lead-123',
  toStatus: 'contacted',
  ownerUserId: 'user-123',
});
```

#### Usar Hook de Listagem

```typescript
import { useEducationList } from '@/modules/business/education';

function EducationExplorer() {
  const { data, isLoading } = useEducationList({
    filters: { nicheKey: 'regular_school' },
  });
  
  if (isLoading) return <Loading />;
  
  return (
    <div>
      {data?.pages.flatMap(p => p.profiles).map(profile => (
        <EducationCard key={profile.id} profile={profile} />
      ))}
    </div>
  );
}
```

---

## Nichos

O sistema de nichos permite configurações específicas por tipo de instituição.

### Nichos MVP (Prontos)

- **regular_school**: Escola Regular
- **daycare**: Creche/Berçário
- **language_school**: Escola de Idiomas
- **prep_course**: Curso Preparatório

### Nichos Beta (Parciais)

- **technical_school**: Escola Técnica
- **tutoring_center**: Centro de Reforço
- **music_school**: Escola de Música
- **sports_school**: Escola de Esportes

### Usar Nichos

```typescript
import { getNicheByKey, useEducationNiche } from '@/modules/business/education';

// Obter configuração de nicho
const niche = getNicheByKey('regular_school');
console.log(niche.displayName); // "Escola Regular"
console.log(niche.capabilities); // ['basic_enabled', 'programs_management', ...]

// Hook de nicho
function MyComponent({ nicheKey }) {
  const { config, hasCapability } = useEducationNiche(nicheKey);
  
  if (hasCapability('lead_pipeline')) {
    return <LeadPipeline />;
  }
  
  return <BasicView />;
}
```

---

## Rotas

### Públicas

- `/educacao/:state/:city` - Vitrine territorial de instituições
- `/educacao/:state/:city/:slug` - Detalhes da instituição

### Admin (Backoffice)

- `/central/empresas/:businessId/education` - Dashboard
- `/central/empresas/:businessId/education/setup` - Cadastro/configuração
- `/central/empresas/:businessId/education/programas` - Gestão de programas
- `/central/empresas/:businessId/education/leads` - Gestão de leads
- `/central/empresas/:businessId/education/eventos` - Gestão de eventos
- `/central/empresas/:businessId/education/analytics` - Analytics
- `/central/empresas/:businessId/education/planos` - Gestão de planos

---

## Feature Flags

O módulo é controlado por feature flags para rollout gradual:

```typescript
import { isFeatureEnabled } from '@/shared/utils/featureFlags';

// Verificar se módulo está habilitado
if (isFeatureEnabled('EDUCATION_MODULE')) {
  // Mostrar funcionalidades education
}

// Verificar funcionalidades premium
if (isFeatureEnabled('EDUCATION_PREMIUM')) {
  // Mostrar landing premium
}

// Verificar sistema de nichos
if (isFeatureEnabled('EDUCATION_NICHES')) {
  // Habilitar nichos específicos
}
```

---

## Observabilidade

O módulo inclui tracking completo de eventos:

### Eventos de Conversão

```typescript
import { trackLeadCreated, trackLeadConverted } from '@/modules/business/education';

// Automático no EducationService, mas pode ser usado manualmente:
await trackLeadCreated(profileId, leadId, nicheKey, { source: 'website' });
await trackLeadConverted(profileId, leadId, nicheKey, { previousStatus: 'contacted' });
```

### Métricas

```typescript
import { EducationObservabilityService } from '@/modules/business/education';

const metrics = await EducationObservabilityService.getMetrics(profileId);
console.log(metrics.leadsCreatedToday);    // 15
console.log(metrics.leadsConvertedToday);  // 3
console.log(metrics.conversionRate);       // 20%
```

---

## Segurança

### Row Level Security (RLS)

Todas as tabelas têm RLS habilitado:

- **Leitura pública**: Apenas dados publicados (`status = 'published'`)
- **Escrita**: Apenas owners/managers autorizados
- **Isolamento**: Dados isolados por instituição

### Validações

- Email: Validação de formato
- Telefone: Validação de formato brasileiro
- Inputs: Sanitização contra XSS
- Uploads: Validação de tipo e tamanho (quando habilitado)

---

## Testes

### Executar Testes

```bash
# Todos os testes do módulo
npm test src/modules/business/education

# Testes específicos
npm test src/modules/business/education/services
npm test src/modules/business/education/niches
npm test src/modules/business/education/hooks
```

### Cobertura

- **Total**: 234 testes em 19 arquivos
- **Services**: 96 testes
- **Niches**: 107 testes
- **Hooks**: 7 testes
- **Components**: 2 testes
- **Types**: 6 testes
- **Constants**: 7 testes
- **Pages**: 1 teste

---

## Integração com Billing

O módulo integra com o sistema de billing para controle de planos:

```typescript
import { EducationSubscriptionService } from '@/modules/business/education';

// Verificar entitlements
const canUsePremium = await EducationSubscriptionService.canUsePremiumPublicPage(businessId);
const canUseShortLink = await EducationSubscriptionService.canUseShortPremiumLink(businessId);

// Obter limites por plano
const limits = await EducationSubscriptionService.getLimitsForBusiness(businessId);
console.log(limits.maxPrograms);  // 20
console.log(limits.maxLeads);     // 500
```

---

## Performance

### Otimizações Implementadas

- ✅ Índices de banco otimizados
- ✅ React Query com cache inteligente
- ✅ Lazy loading de páginas
- ✅ Paginação infinita em listagens
- ✅ Debounce em filtros de busca

### Métricas Target

- Tempo de carregamento: < 2s (p95)
- Taxa de erro: < 1%
- Disponibilidade: > 99.9%

---

## Troubleshooting

### Problema: Perfil não aparece na listagem pública

**Causa**: Perfil não está publicado  
**Solução**: Verificar `status = 'published'` e `published_at` não nulo

### Problema: Lead não é criado

**Causa**: Validação de email/telefone falhando  
**Solução**: Verificar formato correto dos campos

### Problema: RLS bloqueando acesso

**Causa**: Usuário não tem permissão  
**Solução**: Verificar ownership via `BusinessOwnershipService`

---

## Contribuindo

### Adicionar Novo Nicho

1. Adicionar em `niches/registry.ts`:
```typescript
export const EDUCATION_NICHES: Record<string, EducationNicheConfig> = {
  // ... nichos existentes
  new_niche: {
    key: 'new_niche',
    displayName: 'Novo Tipo',
    description: 'Descrição do novo tipo',
    status: 'basic_enabled',
    capabilities: ['basic_enabled', 'programs_management'],
    // ...
  },
};
```

2. Adicionar testes em `niches/__tests__/`

3. Atualizar documentação

### Adicionar Nova Funcionalidade

1. Seguir padrão SSOT do projeto
2. Adicionar testes (cobertura > 80%)
3. Atualizar tipos TypeScript
4. Documentar no README
5. Validar com `npm run validate:ssot`

---

## Documentação Adicional

- **Validação Técnica**: `docs/EDUCATION_MODULE_VALIDATION_REPORT.md`
- **Guia de Deploy**: `docs/EDUCATION_MODULE_DEPLOYMENT_GUIDE.md`
- **Checklist SSOT**: `docs/EDUCATION_MODULE_IMPLEMENTATION_CHECKLIST_SSOT.md`
- **Task Plan**: `docs/EDUCATION_MODULE_TASKS.md`

---

## Suporte

**Issues**: Criar issue no repositório  
**Documentação**: Ver `/docs`  
**Testes**: `npm test src/modules/business/education`

---

**Última Atualização**: 2026-04-28  
**Versão**: 1.0.0  
**Status**: Production Ready
