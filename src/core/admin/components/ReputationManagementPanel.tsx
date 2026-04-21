import { useState, useEffect } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Card } from "@/shared/components/ui/card";
import { Trophy, Ban, Users, Star } from "lucide-react";
import { ReputationRankings } from "./ReputationRankings";
import { ReputationBanishments } from "./ReputationBanishments";
import { ReputationStats } from "./ReputationStats";

export function ReputationManagementPanel() {
  const [activeTab, setActiveTab] = useState("rankings");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rankings" className="gap-2">
            <Trophy className="h-4 w-4" />
            Rankings
          </TabsTrigger>
          <TabsTrigger value="banishments" className="gap-2">
            <Ban className="h-4 w-4" />
            Banimentos
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <Star className="h-4 w-4" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rankings" className="space-y-6 mt-6">
          <ReputationRankings />
        </TabsContent>

        <TabsContent value="banishments" className="space-y-6 mt-6">
          <ReputationBanishments />
        </TabsContent>

        <TabsContent value="stats" className="space-y-6 mt-6">
          <ReputationStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}
