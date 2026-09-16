import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2, TrendingUp } from "lucide-react";
import {
  DriverEarningsReadService,
  type DriverEarningReadRow,
} from "@/core/mobility/services/DriverEarningsReadService";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { formatBrlNoCents } from "@/shared/utils/currency";
import { logger } from "@/shared/utils/logger";

interface WeeklyEarningsChartProps {
  driverProfileId: string;
}

interface DailyEarning {
  day: string;
  amount: number;
}

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

function getEarningTimestamp(earning: DriverEarningReadRow): string {
  return earning.completed_at ?? earning.updated_at;
}

function getEarningAmount(earning: DriverEarningReadRow): number {
  return earning.final_price ?? earning.actual_fare ?? 0;
}

function getEmptyWeek(): DailyEarning[] {
  const today = new Date();
  const result: DailyEarning[] = [];

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    result.push({
      day: DAY_NAMES[date.getDay()],
      amount: 0,
    });
  }

  return result;
}

export function WeeklyEarningsChart({
  driverProfileId,
}: WeeklyEarningsChartProps) {
  const [weeklyData, setWeeklyData] = useState<DailyEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchWeeklyEarnings = useCallback(async () => {
    if (!driverProfileId) {
      setWeeklyData(getEmptyWeek());
      setError(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const today = new Date();
      const startOfWindow = new Date(today);
      startOfWindow.setHours(0, 0, 0, 0);
      startOfWindow.setDate(startOfWindow.getDate() - 6);

      const earnings = await DriverEarningsReadService.list(driverProfileId, {
        sinceIso: startOfWindow.toISOString(),
      });

      const result: DailyEarning[] = [];
      for (let i = 6; i >= 0; i -= 1) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);

        const amount = earnings
          .filter((earning) => {
            const earningDate = new Date(getEarningTimestamp(earning));
            return earningDate.toDateString() === date.toDateString();
          })
          .reduce((sum, earning) => sum + getEarningAmount(earning), 0);

        result.push({
          day: DAY_NAMES[date.getDay()],
          amount,
        });
      }

      setWeeklyData(result);
    } catch (fetchError) {
      logger.error("Error fetching weekly earnings:", fetchError);
      setWeeklyData([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [driverProfileId]);

  useEffect(() => {
    void fetchWeeklyEarnings();
  }, [fetchWeeklyEarnings]);

  if (loading) {
    return (
      <Card className="border p-5">
        <div className="mb-4 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
          <h3 className="text-sm font-bold text-foreground">Resumo semanal</h3>
        </div>
        <div className="space-y-3" aria-label="Carregando ganhos semanais">
          {[1, 2, 3, 4, 5, 6, 7].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="h-3 w-8 animate-pulse rounded bg-secondary/50" />
              <div className="h-3 flex-1 animate-pulse rounded bg-secondary/50" />
              <div className="h-3 w-14 animate-pulse rounded bg-secondary/50" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="space-y-3 border border-destructive/25 bg-destructive/5 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Ganhos semanais indisponíveis
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Não foi possível consultar os valores concluídos. Nenhum valor foi assumido como zero.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void fetchWeeklyEarnings()}
        >
          Tentar novamente
        </Button>
      </Card>
    );
  }

  const maxValue = Math.max(...weeklyData.map((item) => item.amount), 1);
  const totalWeek = weeklyData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card className="border p-3">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
        <h3 className="text-sm font-bold text-foreground">Resumo semanal</h3>
      </div>
      <div className="space-y-2">
        {weeklyData.map((data) => (
          <div key={data.day} className="flex items-center gap-2">
            <span className="w-7 text-[0.65rem] text-muted-foreground">
              {data.day}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary/50">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(data.amount / maxValue) * 100}%` }}
              />
            </div>
            <span className="w-14 text-right text-xs font-semibold text-primary">
              {formatBrlNoCents(data.amount)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t pt-2">
        <span className="text-xs text-muted-foreground">Total da semana</span>
        <span className="text-sm font-bold text-success">
          {formatBrlNoCents(totalWeek)}
        </span>
      </div>
    </Card>
  );
}
