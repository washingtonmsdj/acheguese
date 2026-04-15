# Dashboard Components

Componentes React para o dashboard de empresas.

## 📦 Componentes Disponíveis

### DashboardBreadcrumb

Breadcrumb de navegação simples.

**Uso:**

```tsx
<DashboardBreadcrumb />
```

---

### DashboardHeader

Header com logo, nome da empresa e botões de ação.

**Props:**

```typescript
interface DashboardHeaderProps {
  business: BusinessData;
  onBack: () => void;
  onViewPublic: () => void;
}
```

**Uso:**

```tsx
<DashboardHeader
  business={business}
  onBack={() => navigate("/perfil")}
  onViewPublic={() => navigate(`/empresas/${business.slug}`)}
/>
```

---

### DashboardTabs

Sistema de tabs para navegação no dashboard.

**Props:**

```typescript
interface DashboardTabsProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  children: ReactNode;
}
```

**Uso:**

```tsx
<DashboardTabs activeTab={activeTab} onTabChange={setActiveTab}>
  <TabPanel value="visao-geral">
    <EmpresaDashboardTab businessId={business.id} />
  </TabPanel>
  {/* Mais tabs... */}
</DashboardTabs>
```

---

### TabPanel

Wrapper para conteúdo de cada tab.

**Props:**

```typescript
interface TabPanelProps {
  value: DashboardTab;
  children: ReactNode;
}
```

**Uso:**

```tsx
<TabPanel value="analytics">
  <AnalyticsDashboard businessId={business.id} />
</TabPanel>
```

---

### SettingsTab

Tab de configurações da empresa.

**Props:**

```typescript
interface SettingsTabProps {
  businessId: string;
  onEditBusiness: () => void;
}
```

**Uso:**

```tsx
<SettingsTab
  businessId={business.id}
  onEditBusiness={() => navigate(`/editar-empresa/${business.id}`)}
/>
```

---

## 🎨 Padrões de Design

### Composition

Componentes compostos para máxima flexibilidade.

### Controlled Components

Tabs controladas pelo componente pai.

### Separation of Concerns

- Componentes focam apenas em UI
- Lógica de negócio nos hooks
- Types definidos em `@/types/dashboard`

---

## 📚 Documentação Adicional

- [Hooks](../../hooks/README.md)
- [Types](../../types/dashboard.ts)
- [Página Principal](../../pages/DashboardEmpresaPageV2.tsx)
