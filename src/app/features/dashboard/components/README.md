# Dashboard Components

Componentes React para o dashboard de empresas.

## ðŸ“¦ Componentes DisponÃ­veis

### DashboardBreadcrumb

Breadcrumb de navegaÃ§Ã£o simples.

**Uso:**

```tsx
<DashboardBreadcrumb />
```

---

### DashboardHeader

Header com logo, nome da empresa e botÃµes de aÃ§Ã£o.

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
  onBack={() => navigate("/conta")}
  onViewPublic={() => navigate(`/empresas/${business.slug}`)}
/>
```

---

### DashboardTabs

Sistema de tabs para navegaÃ§Ã£o no dashboard.

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

Wrapper para conteÃºdo de cada tab.

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

Tab de configuraÃ§Ãµes da empresa.

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

## ðŸŽ¨ PadrÃµes de Design

### Composition

Componentes compostos para mÃ¡xima flexibilidade.

### Controlled Components

Tabs controladas pelo componente pai.

### Separation of Concerns

- Componentes focam apenas em UI
- LÃ³gica de negÃ³cio nos hooks
- Types definidos em `@/types/dashboard`

---

## ðŸ“š DocumentaÃ§Ã£o Adicional

- [Hooks](../../hooks/README.md)
- [Types](../../types/dashboard.ts)
- [PÃ¡gina Principal](../../pages/DashboardEmpresaPage.tsx)
