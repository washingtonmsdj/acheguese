import React from "react";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import { badges, pontosRegras } from "@/core/gamification/data/gamification";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/components/ui/drawer";
import type { RankingEntry } from "@/core/gamification/hooks/useRanking";

interface RankingDrawersProps {
  showRules: boolean;
  onShowRulesChange: (show: boolean) => void;
  selectedBadgeId: string | null;
  onSelectedBadgeChange: (badgeId: string | null) => void;
  currentUserRank: RankingEntry | null;
}

export function RankingDrawers({
  showRules,
  onShowRulesChange,
  selectedBadgeId,
  onSelectedBadgeChange,
  currentUserRank,
}: RankingDrawersProps) {
  const selectedBadge = badges.find((b) => b.id === selectedBadgeId);

  return (
    <>
      {/* Rules drawer */}
      <Drawer open={showRules} onOpenChange={onShowRulesChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-base font-display">
              Como ganhar pontos
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-3">
            {pontosRegras.map((rule) => {
              const RuleIcon = rule.icone;
              return (
                <div
                  key={rule.acao}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary"
                >
                  <RuleIcon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="text-sm flex-1">{rule.acao}</span>
                  <Badge variant="outline" className="text-xs font-bold">
                    +{rule.pontos} pts
                  </Badge>
                </div>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Badge detail drawer */}
      <Drawer
        open={!!selectedBadgeId}
        onOpenChange={(open) => {
          if (!open) onSelectedBadgeChange(null);
        }}
      >
        <DrawerContent>
          {selectedBadge && (() => {
            const SelectedBadgeIcon = selectedBadge.icone;
            return (
              <div className="px-4 py-6 text-center">
                <SelectedBadgeIcon className="mx-auto mb-3 h-12 w-12 text-primary" aria-hidden="true" />
              <h3 className="text-lg font-bold font-display">
                {selectedBadge.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedBadge.description}
              </p>
              <Badge
                variant="outline"
                className={cn("mt-3", selectedBadge.cor)}
              >
                {selectedBadge.criterio}
              </Badge>
              {currentUserRank?.badges?.includes(selectedBadge.id) ? (
                <p className="text-sm text-success font-medium mt-4">
                  Você já conquistou!
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-4">
                  Continue participando para desbloquear
                </p>
              )}
            </div>
            );
          })()}
        </DrawerContent>
      </Drawer>
    </>
  );
}
