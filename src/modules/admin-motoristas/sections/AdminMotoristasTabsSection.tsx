/**
 * AdminMotoristasTabsSection
 * 
 * Tabs com diferentes visualizações
 */

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  Users,
  BarChart3,
  AlertTriangle,
  Award,
  Settings,
} from "lucide-react";
import { DriverEarningsMetrics } from "@/modules/admin/components/DriverEarningsMetrics";
import { DriverCancellationMetrics } from "@/modules/admin/components/DriverCancellationMetrics";
import { ReputationManagementPanel } from "@/modules/admin/components/ReputationManagementPanel";
import { MobilitySettingsPanel } from "@/modules/admin/components/MobilitySettingsPanel";
import type { AdminMotoristasTabsSectionProps } from "./types";

export function AdminMotoristasTabsSection({
  activeTab,
  onTabChange,
  drivers,
  children,
}: AdminMotoristasTabsSectionProps & { children?: React.ReactNode }) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="grid w-full grid-cols-5 lg:w-auto">
        <TabsTrigger value="gestao" className="gap-2">
          <Users className="h-4 w-4" />
          Gestão
        </TabsTrigger>
        <TabsTrigger value="metricas" className="gap-2">
          <BarChart3 className="h-4 w-4" />
          Métricas
        </TabsTrigger>
        <TabsTrigger value="cancelamento" className="gap-2">
          <AlertTriangle className="h-4 w-4" />
          Cancelamentos
        </TabsTrigger>
        <TabsTrigger value="reputacao" className="gap-2">
          <Award className="h-4 w-4" />
          Reputação
        </TabsTrigger>
        <TabsTrigger value="configuracoes" className="gap-2">
          <Settings className="h-4 w-4" />
          Configurações
        </TabsTrigger>
      </TabsList>

      <TabsContent value="gestao" className="space-y-6 mt-6">
        {children}
      </TabsContent>

      <TabsContent value="metricas" className="space-y-6 mt-6">
        <DriverEarningsMetrics
          drivers={drivers.map((d) => ({
            ...d,
            avg_rating: d.rating,
            earnings_today: d.total_earnings * 0.1,
            earnings_week: d.total_earnings * 0.3,
            earnings_month: d.total_earnings,
          }))}
        />
      </TabsContent>

      <TabsContent value="cancelamento" className="space-y-6 mt-6">
        <DriverCancellationMetrics />
      </TabsContent>

      <TabsContent value="reputacao" className="space-y-6 mt-6">
        <ReputationManagementPanel />
      </TabsContent>

      <TabsContent value="configuracoes" className="space-y-6 mt-6">
        <MobilitySettingsPanel />
      </TabsContent>
    </Tabs>
  );
}
