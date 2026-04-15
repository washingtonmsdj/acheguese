import React from "react";
import { ArrowLeft, Car, Satellite } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Switch } from "@/shared/components/ui/switch";
import { cn } from "@/shared/utils/cn";

interface DriverHeaderProps {
  inProgressCount: number;
  isDriverOnline: boolean;
  isTracking: boolean;
  isLoadingDriverId?: boolean;
  onGoBack: () => void;
  onToggleOnline: () => void;
}

export function DriverHeader({
  inProgressCount,
  isDriverOnline,
  isTracking,
  isLoadingDriverId = false,
  onGoBack,
  onToggleOnline,
}: DriverHeaderProps) {
  return (
    <div className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-xl border-border">
      <div className="max-w-6xl mx-auto h-14 md:h-16 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onGoBack}
            className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <Car className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            <h1 className="text-sm md:text-base font-bold text-foreground">
              Motorista
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {inProgressCount > 0 && (
            <Badge className="bg-warning/15 text-warning text-[0.6rem] px-2 rounded-full animate-pulse">
              {inProgressCount} ativa{inProgressCount > 1 ? "s" : ""}
            </Badge>
          )}

          {isDriverOnline && (
            <div
              className={cn(
                "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.65rem] font-semibold",
                isLoadingDriverId
                  ? "bg-yellow-500/10 text-yellow-600"
                  : isTracking
                    ? "bg-accent/10 text-accent"
                    : "bg-destructive/10 text-destructive",
              )}
            >
              <Satellite
                className={cn(
                  "h-3 w-3",
                  isLoadingDriverId
                    ? "animate-spin"
                    : isTracking && "animate-pulse",
                )}
              />
              {isLoadingDriverId
                ? "Carregando..."
                : isTracking
                  ? "GPS"
                  : "Sem GPS"}
            </div>
          )}

          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all",
              isDriverOnline
                ? "bg-success/10 border border-success/20"
                : "bg-secondary/50 border border-border",
            )}
          >
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                isDriverOnline
                  ? "bg-success animate-pulse"
                  : "bg-muted-foreground/30",
              )}
            />
            <span
              className={cn(
                "text-xs font-semibold",
                isDriverOnline ? "text-success" : "text-muted-foreground",
              )}
            >
              {isDriverOnline ? "Online" : "Offline"}
            </span>
            <Switch
              checked={isDriverOnline}
              onCheckedChange={onToggleOnline}
              className="data-[state=checked]:bg-success"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
