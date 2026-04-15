import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export interface DebugPanelProps {
  // State
  showDebug: boolean;
  debugRaw: string;
  debugSanitized: string;
  debugFixes: string;
  debugError: string;
  debugSummary: { entities: number; systems: number; gameType: string } | null;
  
  // Actions
  setShowDebug: (show: boolean) => void;
  retryLastPrompt: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  showDebug,
  debugRaw,
  debugSanitized,
  debugFixes,
  debugError,
  debugSummary,
  setShowDebug,
  retryLastPrompt,
}) => {
  return (
    <div className="border-b border-border/50 bg-muted/10 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-[11px]"
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? "Ocultar Debug" : "AI Debug"}
          </Button>
          {debugSummary && (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
              <span>type={debugSummary.gameType}</span>
              <span>entities={debugSummary.entities}</span>
              <span>systems={debugSummary.systems}</span>
            </div>
          )}
          {debugError && (
            <span className="text-[10px] text-destructive font-mono truncate max-w-[220px]">{debugError}</span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-[11px]"
          onClick={retryLastPrompt}
        >
          Retry
        </Button>
      </div>

      {showDebug && (
        <div className="mt-2 grid gap-2">
          <div className="rounded-md border border-border/50 bg-background/10">
            <div className="px-2 py-1 text-[10px] font-mono text-muted-foreground border-b border-border/50">RAW (modelo)</div>
            <ScrollArea className="h-28">
              <pre className="p-2 text-[10px] leading-relaxed whitespace-pre-wrap break-words">{debugRaw || "(vazio)"}</pre>
            </ScrollArea>
          </div>
          <div className="rounded-md border border-border/50 bg-background/10">
            <div className="px-2 py-1 text-[10px] font-mono text-muted-foreground border-b border-border/50">SANITIZED (OrdaxSpec aplicado)</div>
            <ScrollArea className="h-28">
              <pre className="p-2 text-[10px] leading-relaxed whitespace-pre-wrap break-words">{debugSanitized || "(ainda não gerado)"}</pre>
            </ScrollArea>
          </div>

          <div className="rounded-md border border-border/50 bg-background/10">
            <div className="px-2 py-1 text-[10px] font-mono text-muted-foreground border-b border-border/50">LINT/AUTO-FIX (issues + correções aplicadas)</div>
            <ScrollArea className="h-28">
              <pre className="p-2 text-[10px] leading-relaxed whitespace-pre-wrap break-words">{debugFixes || "(nenhuma correção necessária)"}</pre>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
};