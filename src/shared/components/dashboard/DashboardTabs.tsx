/* eslint-disable react-refresh/only-export-components */
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/shared/components/ui/tabs";
import { Eye, BarChart3, CreditCard, Settings, GitBranch, UtensilsCrossed, QrCode } from "lucide-react";
import { DashboardTab } from "@/shared/types/dashboard";
import { ReactNode } from "react";

interface DashboardTabsProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  children: ReactNode;
  /** Tabs extras condicionais (ex: gastronomia para empresas elegíveis) */
  extraTabs?: { value: DashboardTab; label: string; icon: React.ElementType }[];
}

const BASE_TABS: { value: DashboardTab; label: string; icon: React.ElementType }[] = [
  { value: "visao-geral",     label: "Visão Geral",    icon: Eye },
  { value: "analytics",       label: "Analytics",      icon: BarChart3 },
  { value: "qr-code",         label: "QR Code",        icon: QrCode },
  { value: "plano",           label: "Plano",          icon: CreditCard },
  { value: "configuracoes",   label: "Configurações",  icon: Settings },
  { value: "rede",            label: "Rede",           icon: GitBranch },
  { value: "cupons",          label: "Cupons",         icon: CreditCard },
];

export const GASTRONOMY_TAB = { value: "gastronomia" as DashboardTab, label: "Gastronomia", icon: UtensilsCrossed };

export function DashboardTabs({
  activeTab,
  onTabChange,
  children,
  extraTabs = [],
}: DashboardTabsProps) {
  const allTabs = [...BASE_TABS, ...extraTabs];
  const cols = allTabs.length;

  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <Tabs
          value={activeTab}
          onValueChange={(value) => onTabChange(value as DashboardTab)}
        >
          <TabsList className={`grid w-full grid-cols-${cols} mb-6`}>
            {allTabs.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className="gap-2">
                <Icon className="h-4 w-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {children}
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface TabPanelProps {
  value: DashboardTab;
  children: ReactNode;
}

export function TabPanel({ value, children }: TabPanelProps) {
  return <TabsContent value={value}>{children}</TabsContent>;
}
