import React from "react";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CompilerPhaseBadge, type CompilerPhase } from "@/components/ordax/CompilerPhaseRenderer";

export interface HeaderProps {
  // State
  isEditMode: boolean;
  sessionId: string | null;
  compilerPhase: CompilerPhase;
  isLoading: boolean;
  isStreaming: boolean;
  acceptingPlan: boolean;
  stage: string;
  stageLabel: string;
}

export const Header: React.FC<HeaderProps> = ({
  isEditMode,
  sessionId,
  compilerPhase,
  isLoading,
  isStreaming,
  acceptingPlan,
  stage,
  stageLabel,
}) => {
  return (
    <div className="h-12 border-b border-border/50 flex items-center justify-between px-4 bg-card/60">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">Ordax AI</span>
        <Badge variant="outline" className="border-neon-green/30 bg-neon-green/10 text-neon-green text-[10px] h-5">
          <span className="w-1 h-1 rounded-full bg-neon-green mr-1 animate-pulse"></span>
          Online
        </Badge>
        {!isEditMode && sessionId && (
          <CompilerPhaseBadge phase={compilerPhase} />
        )}
      </div>
      {(isLoading || isStreaming || acceptingPlan || stage !== "idle") && (
        <div className="text-xs text-primary font-mono animate-pulse">
          {stageLabel || "Processando…"}
        </div>
      )}
    </div>
  );
};