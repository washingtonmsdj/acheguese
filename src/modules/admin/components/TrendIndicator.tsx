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
  const getSizeClass = (): string => {
    switch (size) {
      case "sm":
        return "text-xs";
      case "md":
        return "text-sm";
      case "lg":
        return "text-base";
      default:
        return "text-sm";
    }
  };

  const getIconSizeClass = (): string => {
    switch (size) {
      case "sm":
        return "h-3 w-3";
      case "md":
        return "h-4 w-4";
      case "lg":
        return "h-5 w-5";
      default:
        return "h-4 w-4";
    }
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
    const iconClass = getIconSizeClass();
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
        getSizeClass(),
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
