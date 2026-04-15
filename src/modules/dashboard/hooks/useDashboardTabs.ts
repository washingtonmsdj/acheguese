import { useState, useCallback } from "react";
import { DashboardTab } from "@/modules/dashboard/types/dashboard";
export function useDashboardTabs(initialTab: DashboardTab = "visao-geral") {
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);

  const changeTab = useCallback((tab: DashboardTab) => {
    setActiveTab(tab);
  }, []);

  const resetTab = useCallback(() => {
    setActiveTab("visao-geral");
  }, []);

  return {
    activeTab,
    setActiveTab: changeTab,
    resetTab,
  };
}
