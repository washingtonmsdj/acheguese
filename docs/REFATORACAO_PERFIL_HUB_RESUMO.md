# Refatoração PerfilHub - Resumo e Próximos Passos

## ✅ O QUE FOI FEITO

### **1. Estrutura de Types (SSOT)** ✅
**Arquivo**: `src/modules/profile/sections/types.ts`

- ✅ Criadas todas as interfaces de props
- ✅ Props tipadas para cada section
- ✅ Sem `any` ou `unknown`
- ✅ Readonly para imutabilidade
- ✅ Type safety completo

**Benefícios**:
- Props explícitas e validadas
- Autocomplete no IDE
- Erros de tipo em tempo de desenvolvimento
- Documentação via tipos

---

### **2. Cards Extraídos** ✅
**Pasta**: `src/modules/profile/components/cards/`

Criados 7 componentes reutilizáveis:

1. ✅ `DashboardMetricCard.tsx` - Métricas do dashboard
2. ✅ `EngagementMetricCard.tsx` - Métricas de engajamento
3. ✅ `VisitBreakdownCard.tsx` - Breakdown de visitas
4. ✅ `NotificationStatCard.tsx` - Stats de notificações
5. ✅ `MobilityMetricCard.tsx` - Métricas de mobilidade
6. ✅ `MobilityDetailRow.tsx` - Detalhes de mobilidade
7. ✅ `SecurityActionCard.tsx` - Ações de segurança
8. ✅ `index.ts` - Barrel export

**Benefícios**:
- Componentes reutilizáveis
- Props tipadas
- Fácil testar isoladamente
- Sem duplicação de código

---

### **3. Primeira Section Criada** ✅
**Arquivo**: `src/modules/profile/sections/ResumoSection.tsx`

- ✅ Extraída do PerfilHubPage
- ✅ Props tipadas (`ResumoSectionProps`)
- ✅ Usa cards extraídos
- ✅ Lógica isolada
- ✅ ~250 linhas (vs 1579 do original)

**Benefícios**:
- Código organizado
- Fácil manutenção
- Testável isoladamente
- Sem dependências desnecessárias

---

## 🎯 PRÓXIMOS PASSOS

### **Etapa 3: Criar Sections Restantes**

#### **3.1. DadosPessoaisSection** (Prioridade ALTA)
```typescript
// src/modules/profile/sections/DadosPessoaisSection.tsx
export function DadosPessoaisSection(props: DadosPessoaisSectionProps) {
  // Conteúdo atual da aba "dados-pessoais"
  // - ProfileStats
  // - ResidentVerificationCard
  // - ReputationLevelCard
  // - GamificationCard
  // - CivicEngagementCard
  // - Ações principais
  // - ContentTabsSection
  // - ActivityTimeline
}
```

#### **3.2. EmpresasSection** (Prioridade ALTA)
```typescript
// src/modules/profile/sections/EmpresasSection.tsx
export function EmpresasSection(props: EmpresasSectionProps) {
  // Conteúdo atual da aba "empresas"
  // - BusinessOwnerQuickAccess
  // - BusinessModulesSection
  // - Ações empresariais
}
```

#### **3.3. MobilidadeSection** (Prioridade MÉDIA)
```typescript
// src/modules/profile/sections/MobilidadeSection.tsx
export function MobilidadeSection(props: MobilidadeSectionProps) {
  // Conteúdo atual da aba "mobilidade"
  // - Dados do motorista
  // - Corrida ativa
  // - Histórico
}
```

#### **3.4. DeliverySection** (Prioridade MÉDIA)
```typescript
// src/modules/profile/sections/DeliverySection.tsx
export function DeliverySection(props: DeliverySectionProps) {
  // Conteúdo atual da aba "delivery"
  // - Módulos de delivery
  // - Ações de delivery
}
```

#### **3.5. PlanosSection** (Prioridade BAIXA)
```typescript
// src/modules/profile/sections/PlanosSection.tsx
export function PlanosSection(props: PlanosSectionProps) {
  // Conteúdo atual da aba "planos"
  // - Plano da identidade ativa
  // - Planos por empresa
}
```

#### **3.6. NotificacoesSection** (Prioridade BAIXA)
```typescript
// src/modules/profile/sections/NotificacoesSection.tsx
export function NotificacoesSection(props: NotificacoesSectionProps) {
  // Conteúdo atual da aba "notificacoes"
  // - Resumo de notificações
  // - NotificationsPanel
}
```

#### **3.7. ConfiguracoesSection** (Prioridade BAIXA)
```typescript
// src/modules/profile/sections/ConfiguracoesSection.tsx
export function ConfiguracoesSection(props: ConfiguracoesSectionProps) {
  // Conteúdo atual da aba "configuracoes"
  // - Links de configurações
}
```

#### **3.8. SegurancaSection** (Prioridade MÉDIA)
```typescript
// src/modules/profile/sections/SegurancaSection.tsx
export function SegurancaSection(props: SegurancaSectionProps) {
  // Conteúdo atual da aba "seguranca"
  // - AccountHealthPanel
  // - Ações de segurança
  // - DataManagementDialogs
}
```

#### **3.9. Barrel Export**
```typescript
// src/modules/profile/sections/index.ts
export { ResumoSection } from './ResumoSection';
export { DadosPessoaisSection } from './DadosPessoaisSection';
export { EmpresasSection } from './EmpresasSection';
// ... todas as sections
```

---

### **Etapa 4: Criar PerfilHubLayout**

```typescript
// src/modules/profile/pages/PerfilHubLayout.tsx
export function PerfilHubLayout({
  activeSection,
  onSectionChange,
  sectionItems,
  personalProfile,
  // ... outras props do layout
  children,
}: PerfilHubLayoutProps) {
  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex lg:w-[240px] xl:w-[260px]">
        <ProfileSectionsNav
          items={sectionItems}
          activeId={activeSection}
          onChange={onSectionChange}
          variant="sidebar"
          profile={personalProfile}
          // ...
        />
      </aside>

      {/* Área de conteúdo */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl space-y-3 px-3 pb-20 pt-3 sm:space-y-4 sm:px-4 sm:pb-12 sm:pt-4 md:pt-6">
            {/* Header */}
            <ProfileHeaderCompact {...headerProps} />

            {/* Tabs mobile */}
            <div className="lg:hidden">
              <ProfileSectionsNav
                items={sectionItems}
                activeId={activeSection}
                onChange={onSectionChange}
                variant="tabs"
              />
            </div>

            {/* Conteúdo dinâmico */}
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
```

---

### **Etapa 5: Refatorar PerfilHubPage**

```typescript
// src/modules/profile/pages/PerfilHubPage.tsx
import {
  ResumoSection,
  DadosPessoaisSection,
  EmpresasSection,
  MobilidadeSection,
  DeliverySection,
  PlanosSection,
  NotificacoesSection,
  ConfiguracoesSection,
  SegurancaSection,
} from '../sections';

const SECTION_MAP = {
  resumo: ResumoSection,
  "dados-pessoais": DadosPessoaisSection,
  empresas: EmpresasSection,
  mobilidade: MobilidadeSection,
  delivery: DeliverySection,
  planos: PlanosSection,
  notificacoes: NotificacoesSection,
  configuracoes: ConfiguracoesSection,
  seguranca: SegurancaSection,
} satisfies Record<ProfileSectionId, React.ComponentType<any>>;

export default function PerfilHubPage() {
  const { /* ... */ } = useProfileHub();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const sectionParam = searchParams.get("sec");
  const activeSection: ProfileSectionId = isProfileSectionId(sectionParam)
    ? sectionParam
    : "resumo";

  // Guards
  if (loading) return <LoadingState />;
  if (error && !profile && !identity) return <ErrorState />;
  if (!activeProfile && !profile) return <NoProfileState />;

  // Selecionar section ativa
  const ActiveSection = SECTION_MAP[activeSection];
  
  // Construir props específicas para a section
  const sectionProps = buildSectionProps(activeSection, {
    user,
    personalProfile,
    personalProfileId,
    navigate,
    appUrls,
    moduleUrls,
    // ... outros dados do hook
  });

  return (
    <>
      <Helmet>
        <title>Perfil | Area organizada</title>
      </Helmet>

      <PerfilHubLayout
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        sectionItems={sectionItems}
        personalProfile={personalProfile}
        profile={profile}
        allProfiles={allProfiles}
        userEmail={user?.email || ""}
        accountSnapshot={account || defaultAccountSnapshot}
        identity={identity}
        context={context}
        notifications={notifications}
        isVerified={isVerified}
        canOpenPublicProfile={canOpenPublicProfile}
        handle={handle}
        territoryLabel={territoryLabel}
        reputation={identity?.reputation || context?.reputation}
        onAvatarChange={handleAvatarChange}
      >
        <ActiveSection {...sectionProps} />
      </PerfilHubLayout>

      <DataManagementDialogs {...dialogProps} />
    </>
  );
}

// Helper para construir props específicas
function buildSectionProps(
  section: ProfileSectionId,
  data: AllData
): SectionPropsMap[typeof section] {
  const baseProps = {
    user: data.user,
    personalProfile: data.personalProfile,
    personalProfileId: data.personalProfileId,
    navigate: data.navigate,
    appUrls: data.appUrls,
    moduleUrls: data.moduleUrls,
  };

  switch (section) {
    case "resumo":
      return {
        ...baseProps,
        operations: data.operations,
        notifications: data.notifications,
        stats: data.stats,
        nextActions: data.nextActions,
        hasActiveRide: data.hasActiveRide,
        activeRide: data.activeRide,
        setActiveSection: data.setActiveSection,
      };
    
    case "dados-pessoais":
      return {
        ...baseProps,
        profile: data.profile,
        identity: data.identity,
        context: data.context,
        stats: data.stats,
        operations: data.operations,
        isVerified: data.isVerified,
        verificationStatus: data.verificationStatus,
        verificationRejectionReason: data.verificationRejectionReason,
        favorites: data.favorites,
        handleBusinessClick: data.handleBusinessClick,
      };
    
    // ... outros cases
    
    default:
      return baseProps as any;
  }
}
```

---

## 📊 Resultado Final Esperado

### **Estrutura de Arquivos**
```
src/modules/profile/
├── pages/
│   ├── PerfilHubPage.tsx          (~200 linhas)
│   └── PerfilHubLayout.tsx        (~150 linhas)
│
├── sections/
│   ├── types.ts                   (✅ criado)
│   ├── ResumoSection.tsx          (✅ criado)
│   ├── DadosPessoaisSection.tsx   (⏳ próximo)
│   ├── EmpresasSection.tsx        (⏳ próximo)
│   ├── MobilidadeSection.tsx      (⏳ próximo)
│   ├── DeliverySection.tsx        (⏳ próximo)
│   ├── PlanosSection.tsx          (⏳ próximo)
│   ├── NotificacoesSection.tsx    (⏳ próximo)
│   ├── ConfiguracoesSection.tsx   (⏳ próximo)
│   ├── SegurancaSection.tsx       (⏳ próximo)
│   └── index.ts                   (⏳ próximo)
│
└── components/
    └── cards/
        ├── DashboardMetricCard.tsx      (✅ criado)
        ├── EngagementMetricCard.tsx     (✅ criado)
        ├── VisitBreakdownCard.tsx       (✅ criado)
        ├── NotificationStatCard.tsx     (✅ criado)
        ├── MobilityMetricCard.tsx       (✅ criado)
        ├── MobilityDetailRow.tsx        (✅ criado)
        ├── SecurityActionCard.tsx       (✅ criado)
        └── index.ts                     (✅ criado)
```

### **Métricas**
- ✅ 0 erros TypeScript
- ✅ SSOT mantido
- ✅ Sem gambiarras
- ✅ Props tipadas
- ✅ Componentes reutilizáveis
- ✅ Código organizado

---

## 🚀 Como Continuar

### **Opção 1: Criar Todas as Sections de Uma Vez**
- Criar os 8 arquivos restantes
- Criar barrel export
- Criar PerfilHubLayout
- Refatorar PerfilHubPage
- Testar tudo

**Tempo estimado**: 6-8 horas

### **Opção 2: Criar Incrementalmente**
- Criar DadosPessoaisSection (mais importante)
- Testar e validar
- Criar EmpresasSection
- Testar e validar
- Continuar com as outras
- Refatorar PerfilHubPage no final

**Tempo estimado**: 8-10 horas (mais seguro)

---

## ✅ Validação TypeScript

```bash
npx tsc --noEmit --skipLibCheck
# ✅ 0 erros
```

---

**Refatoração em andamento - Seguindo SSOT e sem gambiarras!** 🚀✨
