import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/shared/utils/cn";

export interface TrendData {
  value: number; // Percentual de mudança
  direction: "up" | "down" | "neutral";
  period: string; // "vs semana passada", "vs mês passado"
}

interface TrendIndicatorProps {
  trend: TrendData;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function TrendIndicator({
  trend,
  className,
  size = "md",
}: TrendIndicatorProps) {
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const getColorClass = () => {
    switch (trend.direction) {
      case "up":
        return "text-green-600 dark:text-green-400";
      case "down":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-muted-foreground";
    }
  };

  const getIcon = () => {
    const iconClass = iconSizes[size];
    switch (trend.direction) {
      case "up":
        return <TrendingUp className={iconClass} />;
      case "down":
        return <TrendingDown className={iconClass} />;
      default:
        return <Minus className={iconClass} />;
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 font-medium",
        sizeClasses[size],
        getColorClass(),
        className,
      )}
    >
      {getIcon()}
      <span>{Math.abs(trend.value)}%</span>
      <span className="text-muted-foreground font-normal">{trend.period}</span>
    </div>
  );
}
