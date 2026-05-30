# Lista Detalhada de Arquivos Problemáticos

**Data:** 30 de Maio de 2026  
**Total de Arquivos Identificados:** 150+

---

## 🔴 Categoria 1: Arquivos Gigantes (>500 linhas)

### Top 20 Maiores Arquivos

| # | Arquivo | Linhas | Problema Principal | Prioridade |
|---|---------|--------|-------------------|------------|
| 1 | `src/integrations/supabase/types.generated.ts` | 20.003 | Tipos gerados - OK mas precisa otimização | 🟢 Baixa |
| 2 | `src/modules/business/education/services/education.queries.ts` | 969 | Queries não organizadas | 🔴 Alta |
| 3 | `src/config/security.config.ts` | 876 | Configuração monolítica | 🟡 Média |
| 4 | `src/core/residence/components/ResidenceManager.tsx` | 834 | Componente god object | 🔴 Crítica |
| 5 | `src/core/work-opportunities/services/WorkOpportunitiesService.ts` | 796 | Service god object | 🔴 Crítica |
| 6 | `src/core/mobility/delivery/services/OrderDeliverySSOTService.ts` | 793 | Lógica + queries misturados | 🔴 Crítica |
| 7 | `src/modules/business/education/pages/EducationSetupPage.tsx` | 785 | Página com lógica de negócio | 🔴 Crítica |
| 8 | `src/core/pricing/services/PricingService.ts` | 785 | Service monolítico | 🔴 Alta |
| 9 | `src/modules/business/gastronomy/services/menu.queries.ts` | 775 | Queries duplicadas | 🔴 Alta |
| 10 | `src/modules/classifieds/jobs/services/VagasService.ts` | 771 | Service god object | 🔴 Crítica |
| 11 | `src/features/events/pages/EventsOrganizerFormStepContent.tsx` | 766 | Formulário gigante | 🔴 Alta |
| 12 | `src/modules/professionals/services/pages/CadastrarServicoPage.tsx` | 754 | Página em lugar errado | 🔴 Crítica |
| 13 | `src/core/admin/types/adminDatabase.types.ts` | 753 | Tipos não organizados | 🟡 Média |
| 14 | `src/core/maps/components/v3/MapLibreAdapter.tsx` | 749 | Adapter complexo | 🟡 Média |
| 15 | `src/core/business/services/business.queries.ts` | 747 | Queries duplicadas | 🔴 Alta |
| 16 | `src/modules/central/pages/CentralProfissionalPageSections.tsx` | 746 | Múltiplas seções em 1 arquivo | 🔴 Alta |
| 17 | `src/core/professional/services/ProfessionalLeadService.ts` | 740 | Service monolítico | 🔴 Alta |
| 18 | `src/core/routing/components/TerritorialLandingPage.tsx` | 738 | Componente complexo | 🟡 Média |
| 19 | `src/modules/mobility/services/DriverAvailabilityService.ts` | 722 | Lógica complexa | 🔴 Alta |
| 20 | `src/shared/components/ui/sidebar.tsx` | 719 | Componente UI gigante | 🟡 Média |

---

## 🔴 Categoria 2: Acoplamento ao Supabase

### Módulos com Mais Violações

#### Mobility (30+ arquivos)
```
src/modules/mobility/services/
├── MobilityService.impl.ts ⚠️
├── DriverService.impl.ts ⚠️
├── ChatService.impl.ts ⚠️
├── DriverAvailabilityService.ts ⚠️
├── MobilityAuditService.ts ⚠️
├── MobilityOfferService.ts ⚠️
├── MobilityRuntimeService.ts ⚠️
├── MobilityServiceDriverQueries.ts ⚠️
├── MotoboyAuthorizationService.ts ⚠️
├── MotoboySourceResolverService.ts ⚠️
├── OperationalVerificationService.ts ⚠️
├── RideCanonicalAdapter.ts ⚠️
├── RideRatingService.ts ⚠️
├── RideReportsService.ts ⚠️
├── mobility.queries.ts ⚠️
├── mobility.mutations.ts ⚠️
├── mobility.ride-read-queries.ts ⚠️
├── chat.queries.ts ⚠️
└── chat.mutations.ts ⚠️
```

#### Admin (20+ arquivos)
```
src/core/admin/services/
├── AdminModerationService.ts ⚠️
├── AdminNotificationsService.ts ⚠️
├── AdminProfileGovernanceService.ts ⚠️
├── AdminProfileGovernanceLoaders.ts ⚠️
├── AdminMessagingService.ts ⚠️
├── AdminGastronomyService.ts ⚠️
└── ... 15+ arquivos
```

#### Profiles (12+ arquivos)
```
src/core/profiles/services/
├── ProfileService.ts ⚠️
├── profile.queries.ts ⚠️
├── profile.admin-user-queries.ts ⚠️
└── ... 10+ arquivos
```

#### Classifieds (10+ arquivos)
```
src/modules/classifieds/services/
├── ClassifiedCommentService.ts ⚠️
├── ClassifiedReportService.ts ⚠️
└── jobs/services/
    ├── VagasService.ts ⚠️
    ├── VagasPublishPermissionService.ts ⚠️
    └── ... 7+ arquivos
```

---

## 🔴 Categoria 3: Queries Duplicadas

### Padrões Mais Duplicados

#### 1. Count Query (30+ ocorrências)
```typescript
// Encontrado em:
- MobilityService.impl.ts
- MobilityServiceDriverQueries.ts
- AdminModerationService.ts
- AdminNotificationsService.ts
- AdminMessagingService.ts
- AdminGastronomyService.ts
- ProfileService.ts
- WorkOpportunitiesService.ts
- ... 22+ arquivos

// Padrão:
supabase.from("table").select("id", { count: "exact", head: true })
```

#### 2. Find By IDs (50+ ocorrências)
```typescript
// Encontrado em:
- Todos os services de todos os módulos

// Padrão:
supabase.from("table").select("*").in("id", ids)
```

#### 3. Find One (40+ ocorrências)
```typescript
// Encontrado em:
- Todos os services de todos os módulos

// Padrão:
supabase.from("table").select("*").eq("id", id).maybeSingle()
```

#### 4. Parallel Queries (25+ ocorrências)
```typescript
// Encontrado em:
- AdminModerationService.ts
- AdminMessagingService.ts
- AdminGastronomyService.ts
- AdminProfileGovernanceLoaders.ts
- WorkOpportunitiesService.ts
- ... 20+ arquivos

// Padrão:
const [result1, result2] = await Promise.all([
  supabase.from("table1").select("*"),
  supabase.from("table2").select("*")
]);
```

---

## 🟡 Categoria 4: Barrels Excessivos

### Barrels Problemáticos

#### UI Components (40+ exports)
```
src/shared/components/ui/index.ts
- 40+ exports de componentes
- Causa: Bundle inflado
- Solução: Remover barrel, usar imports diretos
```

#### Hooks (20+ exports)
```
src/shared/hooks/index.ts
- 20+ exports de hooks
- Causa: Imports circulares
- Solução: Reduzir para 5-10 hooks principais
```

#### Types (15+ exports)
```
src/shared/types/index.ts
- 15+ exports de tipos
- Causa: Namespace poluído
- Solução: Imports diretos por arquivo
```

#### Validation (10+ exports)
```
src/shared/validation/index.ts
- 10+ exports de schemas
- Causa: Carregamento desnecessário
- Solução: Imports diretos
```

---

## 🔴 Categoria 5: Estrutura Incorreta

### Arquivos em Lugares Errados

#### Páginas em /services/
```
❌ src/modules/professionals/services/pages/CadastrarServicoPage.tsx
✅ Deveria estar em: src/modules/professionals/pages/
```

#### Componentes em /pages/
```
❌ src/app/pages/CidadeLanding.sections.tsx
✅ Deveria estar em: src/app/components/landing/
```

#### Services em /components/
```
❌ src/core/qr/QrCodeService.ts (misturado com components)
✅ Deveria estar em: src/core/qr/services/
```

---

## 🟡 Categoria 6: Módulos Fragmentados

### Community (8 módulos separados)
```
src/modules/
├── community-alerts/          ⚠️ Deveria ser: community/alerts/
├── community-events/          ⚠️ Deveria ser: community/events/
├── community-feed/            ⚠️ Deveria ser: community/feed/
├── community-groups/          ⚠️ Deveria ser: community/groups/
├── community-issues/          ⚠️ Deveria ser: community/issues/
├── community-lost-found/      ⚠️ Deveria ser: community/lost-found/
└── community-recommendations/ ⚠️ Deveria ser: community/recommendations/
```

**Problema:** Fragmentação desnecessária  
**Solução:** Consolidar em 1 módulo com subpastas

---

## 🟢 Categoria 7: Diretórios Temporários

### Para Limpar
```
.tmp/                    ⚠️ Remover
tmp/                     ⚠️ Remover
temp/                    ⚠️ Remover
teste nao remova/        ⚠️ Remover
.archive/ (140+ arquivos) ⚠️ Mover para fora do projeto
```

---

## 📊 Resumo por Prioridade

### 🔴 CRÍTICA (Ação Imediata)
- 10 arquivos gigantes (>700 linhas)
- 200+ imports diretos do Supabase
- 150+ queries duplicadas
- 5 arquivos em lugares errados

### 🟡 ALTA (Próximas 2 Semanas)
- 10 arquivos grandes (500-700 linhas)
- 80 barrels excessivos
- 8 módulos community fragmentados
- Configurações espalhadas

### 🟢 MÉDIA (Próximo Mês)
- Diretórios temporários
- Documentação
- Otimizações de performance
- Melhorias de DX

---

## 🎯 Plano de Ação por Arquivo

### Sprint 1-2: Desacoplamento
```
✅ Criar camada Repository
✅ Refatorar ProfileService
✅ Refatorar MobilityService
✅ Refatorar BusinessService
✅ Refatorar ClassifiedsService
```

### Sprint 3-4: Quebrar Gigantes
```
✅ ResidenceManager.tsx → 5 arquivos
✅ WorkOpportunitiesService.ts → 4 arquivos
✅ OrderDeliverySSOTService.ts → 3 arquivos
✅ EducationSetupPage.tsx → 4 arquivos
✅ VagasService.ts → 4 arquivos
```

### Sprint 5: Query Builders
```
✅ Criar QueryBuilder genérico
✅ Implementar em BaseRepository
✅ Remover 150+ queries duplicadas
```

### Sprint 6-7: Consolidação
```
✅ Consolidar módulos community
✅ Mover arquivos para lugares corretos
✅ Organizar estrutura de pastas
```

### Sprint 8-9: Barrels e Limpeza
```
✅ Reduzir barrels de 80 para 20
✅ Limpar diretórios temporários
✅ Centralizar configurações
```

### Sprint 10: Finalização
```
✅ Documentação
✅ Testes
✅ Code review
✅ Deploy
```

---

**Próximo Passo:** Iniciar Sprint 1 - Criar camada Repository
