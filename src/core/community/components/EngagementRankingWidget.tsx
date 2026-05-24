 
import React from "react";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Lightbulb, Medal, Trophy, TrendingUp, Users, MapPin, type LucideIcon } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { USER_ROLE } from "@/shared/types/constants";
import { communityService } from "@/core/community/services/CommunityService";
import { logger } from "@/shared/utils/logger";

interface RankingEntry {
  entity_name: string;
  total_score: number;
  rua?: string;
  neighborhood?: string;
}

export function EngagementRankingWidget() {
  const [userRanking, setUserRanking] = useState<RankingEntry[]>([]);
  const [streetRanking, setStreetRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    try {
      const periodStart = new Date();
      periodStart.setDate(1); // Primeiro dia do mês

      const periodStartISO = periodStart.toISOString().split("T")[0];
      const [users, streets] = await Promise.all([
        communityService.getEngagementRanking(USER_ROLE.USER, {
          periodStart: periodStartISO,
          limit: 10,
        }),
        communityService.getEngagementRanking("rua", {
          periodStart: periodStartISO,
          limit: 10,
        }),
      ]);

      setUserRanking(users || []);
      setStreetRanking(streets || []);
    } catch (error) {
      logger.error("Error load rankings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (position: number): { label: string; icon?: LucideIcon } => {
    if (position === 0) return { label: "1", icon: Trophy };
    if (position === 1) return { label: "2", icon: Medal };
    if (position === 2) return { label: "3", icon: Medal };
    return { label: `${position + 1}º` };
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          Ranking de Engajamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="streets" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="streets" className="text-xs">
              <MapPin className="w-3 h-3 mr-1" />
              Ruas
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              Usuários
            </TabsTrigger>
          </TabsList>

          <TabsContent value="streets" className="mt-3">
            {loading ? (
              <div className="text-center text-sm text-gray-500 py-4">
                Loading...
              </div>
            ) : streetRanking.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-4">
                Nenhum dado ainda
              </div>
            ) : (
              <div className="space-y-2">
                {streetRanking.map((entry, index) => {
                  const rank = getRankBadge(index);
                  const RankIcon = rank.icon;
                  return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      index < 3
                        ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10"
                        : "bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg flex-shrink-0">
                        {RankIcon ? <RankIcon className="h-4 w-4 text-yellow-500" aria-hidden="true" /> : rank.label}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {entry.entity_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {entry.neighborhood}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <TrendingUp className="w-3 h-3 text-teal-400" />
                      <span className="text-sm font-bold text-teal-400">
                        {entry.total_score}
                      </span>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-3">
            {loading ? (
              <div className="text-center text-sm text-gray-500 py-4">
                Loading...
              </div>
            ) : userRanking.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-4">
                Nenhum dado ainda
              </div>
            ) : (
              <div className="space-y-2">
                {userRanking.map((entry, index) => {
                  const rank = getRankBadge(index);
                  const RankIcon = rank.icon;
                  return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      index < 3
                        ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10"
                        : "bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg flex-shrink-0">
                        {RankIcon ? <RankIcon className="h-4 w-4 text-yellow-500" aria-hidden="true" /> : rank.label}
                      </span>
                      <p className="text-sm font-medium truncate">
                        {entry.entity_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <TrendingUp className="w-3 h-3 text-teal-400" />
                      <span className="text-sm font-bold text-teal-400">
                        {entry.total_score}
                      </span>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-3 p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
          <p className="flex items-start gap-1.5 text-xs text-blue-400">
            <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
            <span>Ganhe pontos reportando problemas e votando em prioridades.</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
