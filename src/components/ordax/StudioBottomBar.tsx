import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Monitor,
  Zap,
  HardDrive,
  Wifi,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useCallback, useMemo } from "react";

// Constants
const LABELS = {
  RESOLUTION: "Resolução:",
  FPS: "FPS:",
  ENGINE: "Engine:",
  BUILD: "Build:",
  ERROR: "Erro",
  ERRORS: "Erros",
  WARNING: "Aviso",
  WARNINGS: "Avisos",
  ONLINE: "Online",
  OFFLINE: "Offline",
} as const;

const FPS_THRESHOLDS = {
  EXCELLENT: 60,
  GOOD: 30,
} as const;

const DEFAULT_VALUES = {
  RESOLUTION: "800x600",
  FPS: 60,
  ENGINE_VERSION: "Ordax 1.0",
  BUILD_VERSION: "Release 2.4.1",
  ERRORS: 0,
  WARNINGS: 0,
  IS_ONLINE: true,
} as const;

// Types
interface StudioBottomBarProps {
  resolution?: string;
  fps?: number;
  engineVersion?: string;
  buildVersion?: string;
  errors?: number;
  warnings?: number;
  isOnline?: boolean;
  onErrorsClick?: () => void;
  onWarningsClick?: () => void;
}

// Validation utilities
function validateFps(fps: number): number {
  if (!Number.isFinite(fps) || fps < 0) {
    return 0;
  }
  return Math.floor(fps);
}

function validateCount(count: number): number {
  if (!Number.isFinite(count) || count < 0) {
    return 0;
  }
  return Math.floor(count);
}

function validateResolution(resolution: string): string {
  const trimmed = resolution.trim();
  if (!trimmed || !/^\d+x\d+$/.test(trimmed)) {
    return DEFAULT_VALUES.RESOLUTION;
  }
  return trimmed;
}

export const StudioBottomBar = React.forwardRef<HTMLDivElement, StudioBottomBarProps>(function StudioBottomBar({
  resolution = DEFAULT_VALUES.RESOLUTION,
  fps = DEFAULT_VALUES.FPS,
  engineVersion = DEFAULT_VALUES.ENGINE_VERSION,
  buildVersion = DEFAULT_VALUES.BUILD_VERSION,
  errors = DEFAULT_VALUES.ERRORS,
  warnings = DEFAULT_VALUES.WARNINGS,
  isOnline = DEFAULT_VALUES.IS_ONLINE,
  onErrorsClick,
  onWarningsClick,
}, ref) {
  // Validate and normalize inputs
  const validatedResolution = useMemo(() => validateResolution(resolution), [resolution]);
  const validatedFps = useMemo(() => validateFps(fps), [fps]);
  const validatedErrors = useMemo(() => validateCount(errors), [errors]);
  const validatedWarnings = useMemo(() => validateCount(warnings), [warnings]);
  
  // Determine FPS color based on performance
  const fpsColor = useMemo(() => {
    if (validatedFps >= FPS_THRESHOLDS.EXCELLENT) return "text-neon-green";
    if (validatedFps >= FPS_THRESHOLDS.GOOD) return "text-yellow-500";
    return "text-destructive";
  }, [validatedFps]);
  
  // Handlers
  const handleErrorsClick = useCallback(() => {
    if (validatedErrors > 0 && onErrorsClick) {
      onErrorsClick();
    }
  }, [validatedErrors, onErrorsClick]);
  
  const handleWarningsClick = useCallback(() => {
    if (validatedWarnings > 0 && onWarningsClick) {
      onWarningsClick();
    }
  }, [validatedWarnings, onWarningsClick]);
  
  return (
    <div ref={ref} className="h-7 border-t border-border/50 bg-card/60 flex items-center justify-between px-4 text-[10px]">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Monitor className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">{LABELS.RESOLUTION}</span>
          <span className="text-primary font-mono">{validatedResolution}</span>
        </div>

        <div className="h-3 w-px bg-border/50"></div>

        <div className="flex items-center gap-1.5">
          <Zap className={cn("h-3 w-3", fpsColor)} />
          <span className="text-muted-foreground">{LABELS.FPS}</span>
          <span className={cn("font-mono", fpsColor)}>{validatedFps}</span>
        </div>

        <div className="h-3 w-px bg-border/50"></div>

        <div className="flex items-center gap-1.5">
          <HardDrive className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">{LABELS.ENGINE}</span>
          <span className="text-foreground font-mono">{engineVersion}</span>
        </div>

        <div className="h-3 w-px bg-border/50"></div>

        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">{LABELS.BUILD}</span>
          <span className="text-foreground font-mono">{buildVersion}</span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-2 text-[10px] gap-1.5"
          onClick={handleErrorsClick}
          disabled={validatedErrors === 0}
        >
          {validatedErrors === 0 ? (
            <CheckCircle2 className="h-3 w-3 text-neon-green" />
          ) : (
            <AlertCircle className="h-3 w-3 text-destructive" />
          )}
          <span className={validatedErrors === 0 ? "text-neon-green" : "text-destructive"}>
            {validatedErrors} {validatedErrors === 1 ? LABELS.ERROR : LABELS.ERRORS}
          </span>
        </Button>

        <div className="h-3 w-px bg-border/50"></div>

        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-2 text-[10px] gap-1.5"
          onClick={handleWarningsClick}
          disabled={validatedWarnings === 0}
        >
          <AlertCircle className={cn(
            "h-3 w-3",
            validatedWarnings === 0 ? "text-muted-foreground" : "text-yellow-500"
          )} />
          <span className={validatedWarnings === 0 ? "text-muted-foreground" : "text-yellow-500"}>
            {validatedWarnings} {validatedWarnings === 1 ? LABELS.WARNING : LABELS.WARNINGS}
          </span>
        </Button>

        <div className="h-3 w-px bg-border/50"></div>

        <div className="flex items-center gap-1.5">
          <Wifi className={cn(
            "h-3 w-3",
            isOnline ? "text-neon-green" : "text-destructive"
          )} />
          <Badge
            variant="outline"
            className={cn(
              "h-4 text-[9px] px-1.5",
              isOnline 
                ? "border-neon-green/30 bg-neon-green/10 text-neon-green"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            )}
          >
            {isOnline ? LABELS.ONLINE : LABELS.OFFLINE}
          </Badge>
        </div>
      </div>
    </div>
  );
});
