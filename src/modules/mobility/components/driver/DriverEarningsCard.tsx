import React from "react";
import { DollarSign, TrendingUp, Calendar, Wallet } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { DriverEarnings } from "@/core/mobility/types";

interface DriverEarningsCardProps {
  earnings: DriverEarnings;
  onCardClick?: (period: "today" | "week" | "month" | "total") => void;
}

export function DriverEarningsCard({
  earnings,
  onCardClick,
}: DriverEarningsCardProps) {
  return (
    <div className="w-full">
      <div className="rounded-2xl border border-white/10 bg-[#1E2529] p-3">
        <div className="grid grid-cols-4 gap-2">
          {[
            {
              label: "Hoje",
              value: earnings.today,
              icon: Wallet,
              color: "text-emerald-400",
              bg: "bg-emerald-500/10",
              period: "today" as const,
            },
            {
              label: "Semana",
              value: earnings.week,
              icon: TrendingUp,
              color: "text-teal-400",
              bg: "bg-teal-500/10",
              period: "week" as const,
            },
            {
              label: "Mês",
              value: earnings.month,
              icon: Calendar,
              color: "text-cyan-400",
              bg: "bg-cyan-500/10",
              period: "month" as const,
            },
            {
              label: "Total",
              value: earnings.total,
              icon: DollarSign,
              color: "text-amber-400",
              bg: "bg-amber-500/10",
              period: "total" as const,
            },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => onCardClick?.(item.period)}
              className={cn(
                "p-2 rounded-xl transition-all hover:scale-105 hover:shadow-lg cursor-pointer",
                item.bg,
              )}
            >
              <div className="flex items-center gap-1 mb-0.5">
                <item.icon className={cn("h-3 w-3", item.color)} />
                <span className="text-[0.6rem] text-gray-400">
                  {item.label}
                </span>
              </div>
              <p className={cn("text-base font-bold", item.color)}>
                R$ {item.value.toFixed(0)}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
