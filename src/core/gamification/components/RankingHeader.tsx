import React from "react";
import { Info } from "lucide-react";

interface RankingHeaderProps {
  onShowRules: () => void;
}

export function RankingHeader({ onShowRules }: RankingHeaderProps) {
  return (
    <div className="px-4 pt-4 pb-3">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-bold font-display">Ranking do Complexo</h1>
        <button
          onClick={onShowRules}
          className="flex items-center gap-1 text-xs text-primary font-medium"
        >
          <Info className="h-3.5 w-3.5" />
          Como ganhar pontos
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Os moradores mais actives da comunidade
      </p>
    </div>
  );
}
