/**
 * RouteEstimateCard - Card de Estimativa de Rota
 *
 * Exibe distância, tempo estimado e preço calculado para uma rota.
 *
 * @module components/mobilidade/RouteEstimateCard
 * @version 1.0.0
 */

import React from "react";
import { Navigation, Clock, DollarSign, TrendingUp, Info } from "lucide-react";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import type { RouteEstimate } from '@/core/maps';

interface RouteEstimateCardProps {
  estimate: RouteEstimate;
  showBreakdown?: boolean;
  className?: string;
  variant?: "default" | "compact";
}

export function RouteEstimateCard({
  estimate,
  showBreakdown = false,
  className,
  variant = "default",
}: RouteEstimateCardProps) {
  const { distance, eta, fare } = estimate;

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-3 text-sm", className)}>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Navigation className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">
            {distance.distanceFormatted}
          </span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">
            {eta.durationFormatted}
          </span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <DollarSign className="h-4 w-4 text-success" />
          <span className="font-bold text-success">
            R$ {(fare?.finalFare ?? 0).toFixed(2)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("bg-card border-border p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Navigation className="h-4 w-4 text-primary" />
          Estimativa da Viagem
        </h3>
        {fare?.finalFare && fare?.totalFare && fare.finalFare > fare.totalFare && (
          <Badge className="bg-warning/10 text-warning text-[0.6rem] px-2 rounded-full">
            <TrendingUp className="h-3 w-3 mr-1" />
            Horário de Pico
          </Badge>
        )}
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Distance */}
        <div className="text-center p-3 rounded-xl bg-primary/5 border border-primary/10">
          <Navigation className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">
            {distance.distanceFormatted}
          </p>
          <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">
            Distância
          </p>
        </div>

        {/* ETA */}
        <div className="text-center p-3 rounded-xl bg-primary/5 border border-primary/10">
          <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">
            {eta.durationFormatted}
          </p>
          <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">
            Tempo
          </p>
        </div>

        {/* Price */}
        <div className="text-center p-3 rounded-xl bg-success/5 border border-success/10">
          <DollarSign className="h-5 w-5 text-success mx-auto mb-1" />
          <p className="text-lg font-bold text-success">
            R$ {(fare?.finalFare ?? 0).toFixed(2)}
          </p>
          <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">
            Preço
          </p>
        </div>
      </div>

      {/* Breakdown */}
      {showBreakdown && fare?.breakdown && (
        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Info className="h-3 w-3" />
            <span className="font-semibold">Detalhamento do Preço</span>
          </div>
          {fare.breakdown.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-semibold text-foreground">
                R$ {(item?.value ?? 0).toFixed(2)}
              </span>
            </div>
          ))}
          {fare?.finalFare && fare?.totalFare && fare.finalFare !== fare.totalFare && (
            <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
              <span className="text-muted-foreground">
                Tarifa mínima aplicada
              </span>
              <span className="font-semibold text-foreground">
                R$ {(fare?.minimumFare ?? 0).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Arrival Time */}
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Chegada prevista</span>
        <span className="font-semibold text-foreground">
          {eta.arrivalTime.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </Card>
  );
}

/**
 * Skeleton loading state
 */
export function RouteEstimateCardSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <Card className={cn("bg-card border-border p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-32 bg-secondary/50 rounded animate-pulse" />
        <div className="h-5 w-20 bg-secondary/50 rounded-full animate-pulse" />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center p-3 rounded-xl bg-secondary/30">
            <div className="h-5 w-5 bg-secondary/50 rounded mx-auto mb-1 animate-pulse" />
            <div className="h-6 w-16 bg-secondary/50 rounded mx-auto mb-1 animate-pulse" />
            <div className="h-3 w-12 bg-secondary/50 rounded mx-auto animate-pulse" />
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
        <div className="h-3 w-24 bg-secondary/50 rounded animate-pulse" />
        <div className="h-3 w-16 bg-secondary/50 rounded animate-pulse" />
      </div>
    </Card>
  );
}
