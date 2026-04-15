/**
 * StatusTransition - Animações de Transição de Status
 *
 * Componente para animar mudanças de status de corridas
 * com feedback visual profissional.
 *
 * @module components/mobilidade/StatusTransition
 * @version 1.0.0
 */

import React, { useEffect, useState } from "react";
import { CheckCircle2, Clock, Navigation, Car, Package } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { RideStatus } from "@/modules/mobility/types"; // TODO: Migrar para mobility.generated.ts;

interface StatusTransitionProps {
  status: RideStatus;
  previousStatus?: RideStatus;
  onTransitionComplete?: () => void;
}

const statusConfig: Record<
  RideStatus,
  {
    icon: React.ReactNode;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  pending: {
    icon: <Clock className="h-5 w-5" />,
    label: "Aguardando motorista",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  driver_assigned: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    label: "Motorista aceito",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  driver_on_the_way: {
    icon: <Navigation className="h-5 w-5" />,
    label: "Motorista a caminho",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  driver_arrived: {
    icon: <Car className="h-5 w-5" />,
    label: "Motorista chegou",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  passenger_on_board: {
    icon: <Package className="h-5 w-5" />,
    label: "Passageiro embarcou",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
  },
  in_progress: {
    icon: <Car className="h-5 w-5" />,
    label: "Em andamento",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  completed: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    label: "Concluída",
    color: "text-green-600",
    bgColor: "bg-green-600/10",
  },
  cancelled: {
    icon: <Clock className="h-5 w-5" />,
    label: "Cancelada",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
};

export function StatusTransition({
  status,
  previousStatus,
  onTransitionComplete,
}: StatusTransitionProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPrevious, setShowPrevious] = useState(false);

  useEffect(() => {
    if (previousStatus && previousStatus !== status) {
      setShowPrevious(true);
      setIsAnimating(true);

      // Fade out previous
      setTimeout(() => {
        setShowPrevious(false);
      }, 300);

      // Complete animation
      setTimeout(() => {
        setIsAnimating(false);
        onTransitionComplete?.();
      }, 600);
    }
  }, [status, previousStatus, onTransitionComplete]);

  const config = statusConfig[status];
  const prevConfig = previousStatus ? statusConfig[previousStatus] : null;

  return (
    <div className="relative h-16 overflow-hidden">
      {/* Previous status (fading out) */}
      {showPrevious && prevConfig && (
        <div
          className={cn(
            "absolute inset-0 flex items-center gap-3 px-4 rounded-xl transition-all duration-300",
            prevConfig.bgColor,
            "opacity-0 -translate-y-4",
          )}
        >
          <div className={cn("flex-shrink-0", prevConfig.color)}>
            {prevConfig.icon}
          </div>
          <div className="flex-1">
            <p className={cn("text-sm font-semibold", prevConfig.color)}>
              {prevConfig.label}
            </p>
          </div>
        </div>
      )}

      {/* Current status (fading in) */}
      <div
        className={cn(
          "absolute inset-0 flex items-center gap-3 px-4 rounded-xl transition-all duration-300",
          config.bgColor,
          isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0",
        )}
      >
        <div className={cn("flex-shrink-0 animate-pulse", config.color)}>
          {config.icon}
        </div>
        <div className="flex-1">
          <p className={cn("text-sm font-semibold", config.color)}>
            {config.label}
          </p>
        </div>
      </div>
    </div>
  );
}

