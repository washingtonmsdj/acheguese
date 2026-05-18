import { useNavigate } from "react-router-dom";
import { CalendarDays, RotateCcw, TrendingUp, Wallet } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { DriverEarningsCard } from "@/modules/mobility/components/driver/DriverEarningsCard";
import { WeeklyEarningsChart } from "@/modules/mobility/components/driver/WeeklyEarningsChart";
import { useMotoristaPageV2 } from "@/modules/mobility/hooks/useMotoristaPageV2";
import { getMobilityServicePath } from "@/modules/mobility/routes/mobilityNavigation";

export interface DriverEarningsLayoutProps {
  /**
   * Tipo de serviço: "motorista" ou "motoboy"
   */
  service: "motorista" | "motoboy";
}

function formatMoney(value?: number | null): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "R$ 0";
  return `R$ ${value.toFixed(0)}`;
}

/**
 * DriverEarningsLayout
 * 
 * Layout compartilhado para página de ganhos de motorista/motoboy.
 * Reutiliza os componentes DriverEarningsCard e WeeklyEarningsChart.
 * 
 * Este componente renderiza o layout das rotas operacionais da Central.
 * /central/motorista/ganhos e /central/motoboy/ganhos.
 */
export function DriverEarningsLayout({ service }: DriverEarningsLayoutProps) {
  const navigate = useNavigate();
  const shell = useMotoristaPageV2();
  const driverEarnings = shell.driverEarnings as {
    today?: number | null;
    week?: number | null;
    month?: number | null;
    total?: number | null;
  } | null;

  const isMotorista = service === "motorista";
  const earningsTitle = isMotorista 
    ? "Resumo de ganhos por corrida" 
    : "Resumo de ganhos por entrega";
  const earningsDescription = isMotorista 
    ? "Ganhos, taxas e consolidado da operação de motorista."
    : "Consolidado da operação de motoboy.";
  const weeklyTitle = "Resumo semanal";
  const weeklyDescription = isMotorista 
    ? "Fluxo recente de ganhos em corridas."
    : "Fluxo recente de ganhos em entregas.";
  const actionLabel = isMotorista 
    ? "Revisar configurações de corridas" 
    : "Revisar configurações de entregas";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Hoje", value: formatMoney(driverEarnings?.today ?? 0), icon: Wallet },
          { label: "Semana", value: formatMoney(driverEarnings?.week ?? 0), icon: CalendarDays },
          { label: "Mes", value: formatMoney(driverEarnings?.month ?? 0), icon: TrendingUp },
        ].map((item) => (
          <Card key={item.label} className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-primary" />
                <span className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>{earningsTitle}</CardTitle>
            <CardDescription>{earningsDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <DriverEarningsCard earnings={{
              today: driverEarnings?.today ?? 0,
              week: driverEarnings?.week ?? 0,
              month: driverEarnings?.month ?? 0,
              total: driverEarnings?.total ?? 0,
            }} />
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>{weeklyTitle}</CardTitle>
            <CardDescription>{weeklyDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <WeeklyEarningsChart driverProfileId={shell.driverProfileId || ""} />
          </CardContent>
        </Card>
      </div>

      <Button 
        variant="outline" 
        className="w-full justify-between" 
        onClick={() =>
          navigate(
            service === "motorista"
              ? getMobilityServicePath("motorista", "configuracoes")
              : getMobilityServicePath("motoboy", "configuracoes"),
          )
        }
      >
        {actionLabel}
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}
