import React from "react";
import { Car, Wallet, Bell, Settings } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Badge } from "@/shared/components/ui/badge";

interface DriverTabsProps {
  activeTab: string;
  availableCount: number;
  acceptedCount: number;
  onTabChange: (tab: string) => void;
}

export function DriverTabs({
  activeTab,
  availableCount,
  acceptedCount,
  onTabChange,
}: DriverTabsProps) {
  const totalRides = availableCount + acceptedCount;

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="w-full bg-card border border-border rounded-xl h-11 p-1 mb-5 gap-0.5">
        <TabsTrigger
          value="corridas"
          className="flex-1 rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary text-muted-foreground text-[0.65rem] font-semibold h-9 px-2"
        >
          <Car className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
          Corridas
          {totalRides > 0 && (
            <Badge className="ml-1 bg-primary/20 text-primary text-[0.55rem] px-1.5 h-4 rounded-full">
              {totalRides}
            </Badge>
          )}
        </TabsTrigger>

        <TabsTrigger
          value="ganhos"
          className="flex-1 rounded-lg data-[state=active]:bg-success/15 data-[state=active]:text-success text-muted-foreground text-[0.65rem] font-semibold h-9 px-2"
        >
          <Wallet className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
          Ganhos
        </TabsTrigger>

        <TabsTrigger
          value="alertas"
          className="flex-1 rounded-lg data-[state=active]:bg-warning/15 data-[state=active]:text-warning text-muted-foreground text-[0.65rem] font-semibold h-9 px-2"
        >
          <Bell className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
          Alertas
        </TabsTrigger>

        <TabsTrigger
          value="config"
          className="flex-1 rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-foreground text-muted-foreground text-[0.65rem] font-semibold h-9 px-2"
        >
          <Settings className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
          Config
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
