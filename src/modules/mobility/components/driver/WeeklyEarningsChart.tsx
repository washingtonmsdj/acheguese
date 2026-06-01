import React, { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";
import { Card } from "@/shared/components/ui/card";
import { MobilityService } from "@/core/mobility/services/MobilityService";
import { logger } from "@/shared/utils/logger";

interface WeeklyEarningsChartProps {
  driverProfileId: string;
}

interface DailyEarning {
  day: string;
  amount: number;
}

interface EarningRow {
  completed_at: string | null;
  final_price: number | null;
}

export function WeeklyEarningsChart({
  driverProfileId,
}: WeeklyEarningsChartProps) {
  const [weeklyData, setWeeklyData] = useState<DailyEarning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeeklyEarnings = async () => {
      if (!driverProfileId) return;

      try {
        // SSOT: Buscar ganhos semanais usando MobilityService
        const earnings = (await MobilityService.getDriverEarnings(driverProfileId)) as EarningRow[];

        // Processar dados para formato do gráfico
        const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        const today = new Date();
        const result: DailyEarning[] = [];

        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          const dayName = dayNames[date.getDay()];

          // Buscar ganhos deste dia específico
          const dayEarnings = earnings.filter((e) => {
            const earnDate = new Date(e.completed_at);
            return earnDate.toDateString() === date.toDateString();
          });

          const amount = dayEarnings.reduce(
            (sum: number, e) => sum + (e.final_price || 0),
            0,
          );

          result.push({
            day: dayName,
            amount,
          });
        }

        setWeeklyData(result);
      } catch (error) {
        logger.error("Error fetching weekly earnings:", error);
        setWeeklyData(getEmptyWeek());
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyEarnings();
  }, [driverProfileId]);

  const getEmptyWeek = (): DailyEarning[] => {
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const today = new Date();
    const result: DailyEarning[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      result.push({
        day: dayNames[date.getDay()],
        amount: 0,
      });
    }

    return result;
  };

  const maxValue = Math.max(...weeklyData.map((d) => d.amount), 1);
  const totalWeek = weeklyData.reduce((sum, d) => sum + d.amount, 0);

  if (loading) {
    return (
      <Card className="bg-card border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Resumo Semanal</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-3 bg-secondary/50 rounded animate-pulse" />
              <div className="flex-1 h-3 bg-secondary/50 rounded animate-pulse" />
              <div className="w-14 h-3 bg-secondary/50 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border p-3">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Resumo Semanal</h3>
      </div>
      <div className="space-y-2">
        {weeklyData.map((data) => (
          <div key={data.day} className="flex items-center gap-2">
            <span className="text-[0.6rem] text-muted-foreground w-7">
              {data.day}
            </span>
            <div className="flex-1 h-2.5 bg-secondary/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${maxValue > 0 ? (data.amount / maxValue) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-xs font-semibold text-primary w-12 text-right">
              R$ {data.amount.toFixed(0)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Total da semana</span>
        <span className="text-sm font-bold text-success">
          R$ {totalWeek.toFixed(0)}
        </span>
      </div>
    </Card>
  );
}
