import React from "react";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Construction, Users, TrendingUp, Award, Lightbulb } from "lucide-react";
import { getRecordValue } from "@/shared/utils/recordLookup";
interface CivicEngagementCardProps {
  reportsCount: number;
  supportsCount: number;
  engagementScore: number;
  badges?: string[];
  rank?: number;
  neighborhoodRank?: number;
}

const BADGE_INFO: Record<
  string,
  { label: string; color: string }
> = {
  first_report: { label: "Primeiro Reporte", color: "bg-blue-500" },
  reporter_bronze: {
    label: "Reporter Bronze",
    color: "bg-amber-700",
  },
  reporter_silver: {
    label: "Reporter Prata",
    color: "bg-gray-400",
  },
  reporter_gold: { label: "Reporter Ouro", color: "bg-yellow-500" },
  supporter_bronze: {
    label: "Apoiador Bronze",
    color: "bg-amber-700",
  },
  supporter_silver: {
    label: "Apoiador Prata",
    color: "bg-gray-400",
  },
  supporter_gold: {
    label: "Apoiador Ouro",
    color: "bg-yellow-500",
  },
  critical_creator: {
    label: "Criador Crítico",
    color: "bg-orange-500",
  },
  civic_hero: { label: "Herói Cívico", color: "bg-purple-500" },
};

export function CivicEngagementCard({
  reportsCount,
  supportsCount,
  engagementScore,
  badges = [],
  rank,
  neighborhoodRank,
}: CivicEngagementCardProps) {
  return (
    <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/30">
      <div className="flex items-center gap-2 mb-4">
        <Construction className="w-5 h-5 text-orange-500" />
        <h3 className="font-bold text-lg">Engajamento Cívico</h3>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-500">
            {reportsCount}
          </div>
          <div className="text-xs text-muted-foreground">Reportes</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-500">
            {supportsCount}
          </div>
          <div className="text-xs text-muted-foreground">Apoios</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-500">
            {engagementScore}
          </div>
          <div className="text-xs text-muted-foreground">Pontos</div>
        </div>
      </div>

      {/* Rankings */}
      {(rank || neighborhoodRank) && (
        <div className="flex gap-2 mb-4">
          {rank && (
            <Badge variant="outline" className="gap-1">
              <TrendingUp className="w-3 h-3" />#{rank} Geral
            </Badge>
          )}
          {neighborhoodRank && (
            <Badge variant="outline" className="gap-1">
              <Award className="w-3 h-3" />#{neighborhoodRank} no Bairro
            </Badge>
          )}
        </div>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Conquistas</p>
          <div className="flex flex-wrap gap-2">
            {badges.map((badgeType) => {
              const info = getRecordValue(BADGE_INFO, badgeType);
              if (!info) return null;

              return (
                <Badge
                  key={badgeType}
                  className={`${info.color} text-white border-0 gap-1`}
                >
                  <Award className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="text-xs">{info.label}</span>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Mensagem motivacional */}
      {engagementScore === 0 && (
        <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
          <p className="flex items-start gap-2 text-sm text-blue-400">
            <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              Comece a reportar problemas e apoiar sua comunidade para ganhar
              pontos e badges.
            </span>
          </p>
        </div>
      )}
    </Card>
  );
}
