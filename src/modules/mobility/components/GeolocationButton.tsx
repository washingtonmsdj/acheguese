import React from "react";
import { Button } from "@/shared/components/ui/button";
import { MapPin, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import {
  useGeolocation,
  type GeolocationCoordinates,
} from "@/modules/mobility/hooks/useGeolocation";

interface GeolocationButtonProps {
  onLocationCaptured: (coords: GeolocationCoordinates) => void;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  showCoordinates?: boolean;
}

/**
 * Botão profissional para captura de geolocalização
 *
 * Features:
 * - Captura GPS com alta precisão
 * - Estados visuais (loading, success, error)
 * - Feedback de erro amigável
 * - Exibição opcional de coordenadas
 * - Retry automático em caso de erro
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

  const handleCapture = async () => {
    clearError();
    setCaptured(false);

    const coords = await requestLocation();

    if (coords) {
      setCaptured(true);
      onLocationCaptured(coords);

      // Reset captured state após 3 segundos
      setTimeout(() => setCaptured(false), 3000);
    }
  };

  if (!supported) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
        <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
        <p className="text-xs text-red-300">
          Geolocalização não suportada pelo navegador
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
        onClick={handleCapture}
        disabled={loading}
        className={cn(
          "relative transition-all",
          captured && "border-emerald-400 bg-emerald-400/10 text-emerald-400",
          error && "border-red-400/40 bg-red-400/10 text-red-400",
          className,
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="ml-2">Obtendo localização...</span>
          </>
        ) : captured ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            <span className="ml-2">Localização capturada!</span>
          </>
        ) : error ? (
          <>
            <AlertCircle className="h-4 w-4" />
            <span className="ml-2">Tentar novamente</span>
          </>
        ) : (
          <>
            <MapPin className="h-4 w-4" />
            <span className="ml-2">Usar minha localização</span>
          </>
        )}
      </Button>

      {/* Exibir coordenadas capturadas */}
      {showCoordinates && coordinates && captured && (
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-[0.65rem] text-emerald-300 font-mono">
            {coordinates.latitude.toFixed(6)},{" "}
            {coordinates.longitude.toFixed(6)}
          </p>
          <p className="text-[0.6rem] text-emerald-400/60 mt-0.5">
            Precisão: ±{Math.round(coordinates.accuracy)}m
          </p>
        </div>
      )}

      {/* Exibir erro */}
      {error && (
        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-[0.65rem] text-red-300 leading-relaxed">
              {error.message}
            </p>
          </div>
        </div>
      )}

      {/* Info sobre o sistema de match */}
      {captured && !error && (
        <div className="p-2.5 rounded-lg bg-teal-500/10 border border-teal-500/20">
          <div className="flex items-start gap-2">
            <MapPin className="h-3.5 w-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
            <p className="text-[0.65rem] text-teal-300 leading-relaxed">
              Sistema de Match Inteligente ativado! Motoristas próximos (até
              5km) receberão sua solicitação com prioridade.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
