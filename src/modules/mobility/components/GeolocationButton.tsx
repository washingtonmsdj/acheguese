import React from "react";
import { AlertCircle, CheckCircle2, Loader2, MapPin } from "lucide-react";

import {
  useGeolocation,
  type GeolocationCoordinates,
} from "@/modules/mobility/hooks/useGeolocation";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";

interface GeolocationButtonProps {
  onLocationCaptured: (coords: GeolocationCoordinates) => void;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  showCoordinates?: boolean;
}

/**
 * Captura de geolocalização para fluxos de Mobilidade.
 * A política de match/dispatch permanece server-owned e não é inferida aqui.
 */
export function GeolocationButton({
  onLocationCaptured,
  className,
  variant = "outline",
  size = "default",
  showCoordinates = false,
}: GeolocationButtonProps) {
  const {
    coordinates,
    loading,
    error,
    supported,
    requestLocation,
    clearError,
  } = useGeolocation();
  const [captured, setCaptured] = React.useState(false);
  const resetTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    },
    [],
  );

  const handleCapture = async () => {
    clearError();
    setCaptured(false);

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    const coords = await requestLocation();

    if (coords) {
      setCaptured(true);
      onLocationCaptured(coords);
      resetTimerRef.current = setTimeout(() => {
        setCaptured(false);
        resetTimerRef.current = null;
      }, 3000);
    }
  };

  if (!supported) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3">
        <AlertCircle
          className="h-4 w-4 shrink-0 text-destructive"
          aria-hidden="true"
        />
        <p className="text-xs text-destructive">
          Geolocalização não suportada pelo navegador.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => void handleCapture()}
        disabled={loading}
        aria-busy={loading}
        className={cn(
          "relative transition-colors",
          captured && "border-success/40 bg-success/10 text-success",
          error && "border-destructive/40 bg-destructive/10 text-destructive",
          className,
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span className="ml-2">Obtendo localização...</span>
          </>
        ) : captured ? (
          <>
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span className="ml-2">Localização capturada</span>
          </>
        ) : error ? (
          <>
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <span className="ml-2">Tentar novamente</span>
          </>
        ) : (
          <>
            <MapPin className="h-4 w-4" aria-hidden="true" />
            <span className="ml-2">Usar minha localização</span>
          </>
        )}
      </Button>

      {showCoordinates && coordinates && captured ? (
        <div className="rounded-lg border border-success/20 bg-success/10 p-2">
          <p className="font-mono text-[0.65rem] text-success">
            {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
          </p>
          <p className="mt-0.5 text-[0.6rem] text-muted-foreground">
            Precisão: ±{Math.round(coordinates.accuracy)} m
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-2.5">
          <div className="flex items-start gap-2">
            <AlertCircle
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive"
              aria-hidden="true"
            />
            <p className="text-[0.65rem] leading-relaxed text-destructive">
              {error.message}
            </p>
          </div>
        </div>
      ) : null}

      {captured && !error ? (
        <div className="rounded-lg border border-category-mobility/20 bg-category-mobility/10 p-2.5">
          <div className="flex items-start gap-2">
            <MapPin
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-category-mobility"
              aria-hidden="true"
            />
            <p className="text-[0.65rem] leading-relaxed text-muted-foreground">
              Localização atualizada. O sistema de Mobilidade usará as regras
              operacionais vigentes para buscar ofertas e motoristas elegíveis.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
