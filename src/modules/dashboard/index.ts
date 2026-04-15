// Dashboard Module - Public API
// Only exports public components, hooks, and types

// Components
export { DashboardBreadcrumb } from "./components/DashboardBreadcrumb";
export { DashboardHeader } from "./components/DashboardHeader";
export { DashboardTabs, TabPanel } from "./components/DashboardTabs";
export { SettingsTab } from "./components/SettingsTab";

// Hooks
export { useDashboardTabs } from "./hooks/useDashboardTabs";
export { useDashboardAccess } from "./hooks/useDashboardAccess";

// Types
export type {
  BusinessData,
  AccessPermissions,
  DashboardTab,
  DashboardStats,
  MemberData,
} from "./types/dashboard";

// Pages
export { default as DashboardEmpresaPageV2 } from "./pages/DashboardEmpresaPageV2";
