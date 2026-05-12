# Refatoração PerfilHub - GUIA PRÁTICO

## 🎯 Como Usar a Nova Estrutura

Este guia mostra como trabalhar com a estrutura refatorada do PerfilHub.

---

## 📁 ESTRUTURA DE ARQUIVOS

```
src/modules/profile/
├── pages/
│   ├── PerfilHubPage.tsx          ← Orquestração principal
│   └── PerfilHubLayout.tsx        ← Layout reutilizável
│
├── sections/
│   ├── types.ts                   ← Types compartilhados (SSOT)
│   ├── ResumoSection.tsx          ← Section "Resumo"
│   ├── DadosPessoaisSection.tsx   ← Section "Dados Pessoais"
│   ├── EmpresasSection.tsx        ← Section "Empresas"
│   ├── MobilidadeSection.tsx      ← Section "Mobilidade"
│   ├── DeliverySection.tsx        ← Section "Delivery"
│   ├── PlanosSection.tsx          ← Section "Planos"
│   ├── NotificacoesSection.tsx    ← Section "Notificações"
│   ├── ConfiguracoesSection.tsx   ← Section "Configurações"
│   ├── SegurancaSection.tsx       ← Section "Segurança"
│   └── index.ts                   ← Barrel export
│
└── components/cards/
    ├── DashboardMetricCard.tsx    ← Card reutilizável
    ├── EngagementMetricCard.tsx   ← Card reutilizável
    ├── VisitBreakdownCard.tsx     ← Card reutilizável
    ├── NotificationStatCard.tsx   ← Card reutilizável
    ├── MobilityMetricCard.tsx     ← Card reutilizável
    ├── MobilityDetailRow.tsx      ← Card reutilizável
    ├── SecurityActionCard.tsx     ← Card reutilizável
    └── index.ts                   ← Barrel export
```

---

## 🔧 CASOS DE USO COMUNS

### **1. Adicionar uma Nova Section**

**Exemplo**: Adicionar section "Histórico"

#### **Passo 1: Criar o tipo em `types.ts`**
```typescript
// src/modules/profile/sections/types.ts

export interface HistoricoSectionProps extends BaseSectionProps {
  readonly history: readonly HistoryItem[];
  readonly filters: HistoryFilters;
  readonly onFilterChange: (filters: HistoryFilters) => void;
}

export type ProfileSectionId =
  | "resumo"
  | "dados-pessoais"
  | "empresas"
  | "mobilidade"
  | "delivery"
  | "planos"
  | "notificacoes"
  | "configuracoes"
  | "seguranca"
  | "historico"; // ← Adicionar aqui

export type SectionPropsMap = {
  readonly resumo: ResumoSectionProps;
  readonly "dados-pessoais": DadosPessoaisSectionProps;
  readonly empresas: EmpresasSectionProps;
  readonly mobilidade: MobilidadeSectionProps;
  readonly delivery: DeliverySectionProps;
  readonly planos: PlanosSectionProps;
  readonly notificacoes: NotificacoesSectionProps;
  readonly configuracoes: ConfiguracoesSectionProps;
  readonly seguranca: SegurancaSectionProps;
  readonly historico: HistoricoSectionProps; // ← Adicionar aqui
};
```

#### **Passo 2: Criar o componente**
```typescript
// src/modules/profile/sections/HistoricoSection.tsx

import type { HistoricoSectionProps } from "./types";

export function HistoricoSection({
  user,
  personalProfile,
  navigate,
  appUrls,
  moduleUrls,
  history,
  filters,
  onFilterChange,
}: HistoricoSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Histórico</h2>
      {/* Seu código aqui */}
    </div>
  );
}
```

#### **Passo 3: Exportar no barrel**
```typescript
// src/modules/profile/sections/index.ts

export { HistoricoSection } from "./HistoricoSection";

export type {
  // ... outros types
  HistoricoSectionProps,
} from "./types";
```

#### **Passo 4: Adicionar no mapa de sections**
```typescript
// src/modules/profile/pages/PerfilHubPage.tsx

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
  historico: HistoricoSection, // ← Adicionar aqui
} as const satisfies Record<ProfileSectionId, React.ComponentType<any>>;
```

#### **Passo 5: Adicionar props no helper**
```typescript
// src/modules/profile/pages/PerfilHubPage.tsx

function buildSectionProps(section: ProfileSectionId, data: ...): any {
  const baseProps = { ... };
  
  switch (section) {
    // ... outros cases
    
    case "historico":
      return {
        ...baseProps,
        history: data.history,
        filters: data.filters,
        onFilterChange: data.handleFilterChange,
      };
    
    default:
      return baseProps;
  }
}
```

#### **Passo 6: Adicionar na configuração de navegação**
```typescript
// src/modules/profile/config/profile-sections.config.ts

export const PROFILE_SECTIONS = [
  // ... outras sections
  {
    id: "historico",
    label: "Histórico",
    description: "Histórico de atividades",
    icon: History,
  },
] as const;
```

---

### **2. Modificar uma Section Existente**

**Exemplo**: Adicionar novo card na section "Resumo"

#### **Passo 1: Editar apenas o arquivo da section**
```typescript
// src/modules/profile/sections/ResumoSection.tsx

export function ResumoSection({ ... }: ResumoSectionProps) {
  return (
    <div className="space-y-4">
      {/* Cards existentes */}
      <DashboardMetricCard ... />
      
      {/* Novo card */}
      <NewMetricCard
        title="Nova Métrica"
        value={stats.newMetric}
      />
    </div>
  );
}
```

**Benefício**: Mudança isolada, não afeta outras sections.

---

### **3. Criar um Novo Card Reutilizável**

**Exemplo**: Card de estatística de engajamento

#### **Passo 1: Criar o componente**
```typescript
// src/modules/profile/components/cards/EngagementStatCard.tsx

interface EngagementStatCardProps {
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly label: string;
  readonly value: number;
  readonly trend?: "up" | "down" | "neutral";
}

export function EngagementStatCard({
  icon: Icon,
  label,
  value,
  trend = "neutral",
}: EngagementStatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold">{value}</span>
        {trend !== "neutral" && (
          <span className={trend === "up" ? "text-green-600" : "text-red-600"}>
            {trend === "up" ? "↑" : "↓"}
          </span>
        )}
      </div>
    </div>
  );
}
```

#### **Passo 2: Exportar no barrel**
```typescript
// src/modules/profile/components/cards/index.ts

export { EngagementStatCard } from "./EngagementStatCard";
```

#### **Passo 3: Usar em qualquer section**
```typescript
// src/modules/profile/sections/ResumoSection.tsx

import { EngagementStatCard } from "@/modules/profile/components/cards";

export function ResumoSection({ ... }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <EngagementStatCard
        icon={Heart}
        label="Curtidas"
        value={stats.likes}
        trend="up"
      />
    </div>
  );
}
```

**Benefício**: Card reutilizável em múltiplas sections.

---

### **4. Adicionar Props a uma Section**

**Exemplo**: Adicionar `onRefresh` à section "Resumo"

#### **Passo 1: Atualizar o tipo**
```typescript
// src/modules/profile/sections/types.ts

export interface ResumoSectionProps extends BaseSectionProps {
  readonly operations: Operations;
  readonly notifications: Notifications;
  readonly stats: Stats;
  readonly nextActions: readonly NextAction[];
  readonly hasActiveRide: boolean;
  readonly activeRide?: Ride;
  readonly setActiveSection: (section: string) => void;
  readonly onRefresh: () => void; // ← Adicionar aqui
}
```

#### **Passo 2: Passar a prop no helper**
```typescript
// src/modules/profile/pages/PerfilHubPage.tsx

function buildSectionProps(section: ProfileSectionId, data: ...): any {
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
        onRefresh: data.refreshWorkspace, // ← Adicionar aqui
      };
    // ... outros cases
  }
}
```

#### **Passo 3: Usar na section**
```typescript
// src/modules/profile/sections/ResumoSection.tsx

export function ResumoSection({
  onRefresh, // ← Receber aqui
  ...rest
}: ResumoSectionProps) {
  return (
    <div>
      <Button onClick={onRefresh}>Atualizar</Button>
      {/* Resto do conteúdo */}
    </div>
  );
}
```

---

### **5. Testar uma Section Isoladamente**

**Exemplo**: Testar "ResumoSection"

```typescript
// src/modules/profile/sections/__tests__/ResumoSection.test.tsx

import { render, screen } from "@testing-library/react";
import { ResumoSection } from "../ResumoSection";
import type { ResumoSectionProps } from "../types";

describe("ResumoSection", () => {
  const mockProps: ResumoSectionProps = {
    user: { id: "user-1", email: "test@example.com" },
    personalProfile: null,
    personalProfileId: null,
    navigate: jest.fn(),
    appUrls: {} as any,
    moduleUrls: {} as any,
    operations: {
      posts: 10,
      businesses: 2,
      services: 5,
      classifieds: 3,
      ridesTotal: 15,
      activeRides: 1,
      favoritesGiven: 8,
    },
    notifications: {
      unread: 5,
      highPriority: 2,
      urgentPriority: 1,
      total: 20,
    },
    stats: {},
    nextActions: [],
    hasActiveRide: true,
    setActiveSection: jest.fn(),
  };

  it("should render dashboard metrics", () => {
    render(<ResumoSection {...mockProps} />);
    
    expect(screen.getByText("Posts")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("should show active ride when hasActiveRide is true", () => {
    render(<ResumoSection {...mockProps} />);
    
    expect(screen.getByText(/corrida ativa/i)).toBeInTheDocument();
  });
});
```

**Benefício**: Testes isolados, rápidos e confiáveis.

---

## 🎯 BOAS PRÁTICAS

### **1. Sempre Use Types**
```typescript
// ❌ Evite
function MySection(props: any) { ... }

// ✅ Prefira
function MySection(props: MySectionProps) { ... }
```

### **2. Mantenha Sections Focadas**
```typescript
// ❌ Evite sections gigantes
function ResumoSection() {
  // 500 linhas de código
}

// ✅ Prefira sections focadas + cards reutilizáveis
function ResumoSection() {
  return (
    <>
      <DashboardMetrics />
      <NextActions />
      <ActiveRide />
    </>
  );
}
```

### **3. Use Barrel Exports**
```typescript
// ❌ Evite imports diretos
import { ResumoSection } from "@/modules/profile/sections/ResumoSection";
import { DadosPessoaisSection } from "@/modules/profile/sections/DadosPessoaisSection";

// ✅ Prefira barrel exports
import { ResumoSection, DadosPessoaisSection } from "@/modules/profile/sections";
```

### **4. Mantenha Props Readonly**
```typescript
// ❌ Evite props mutáveis
interface MySectionProps {
  data: MyData[];
}

// ✅ Prefira props readonly
interface MySectionProps {
  readonly data: readonly MyData[];
}
```

### **5. Use Helper Functions**
```typescript
// ❌ Evite lógica complexa inline
<div>
  {data.filter(x => x.active).map(x => x.value).reduce((a, b) => a + b, 0)}
</div>

// ✅ Prefira helper functions
const totalActiveValue = calculateTotalActiveValue(data);
<div>{totalActiveValue}</div>
```

---

## 🚀 COMANDOS ÚTEIS

### **Validar TypeScript**
```bash
npx tsc --noEmit --skipLibCheck
```

### **Rodar Testes**
```bash
npm run test
```

### **Rodar Dev Server**
```bash
npm run dev
```

### **Build para Produção**
```bash
npm run build
```

---

## 📚 REFERÊNCIAS

- `types.ts` - Todos os tipos compartilhados
- `index.ts` - Barrel exports
- `PerfilHubPage.tsx` - Orquestração principal
- `PerfilHubLayout.tsx` - Layout reutilizável

---

## 🎉 CONCLUSÃO

A estrutura refatorada facilita:
- ✅ Adicionar novas sections
- ✅ Modificar sections existentes
- ✅ Criar cards reutilizáveis
- ✅ Testar isoladamente
- ✅ Manter código limpo

**Siga as boas práticas e aproveite a nova estrutura!** 🚀
