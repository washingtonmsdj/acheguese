import { useNavigate } from "react-router-dom";
import { CalendarDays, RotateCcw, TrendingUp, Wallet } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { DriverEarningsCard } from "@/modules/mobility/components/driver/DriverEarningsCard";
import { WeeklyEarningsChart } from "@/modules/mobility/components/driver/WeeklyEarningsChart";
import { useMotoristaPageV2 } from "@/modules/mobility/hooks/useMotoristaPageV2";
import { getProfileMobilityServicePath } from "@/modules/profile/utils/profileMobilityNavigation";

function formatMoney(value?: number | null): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "R$ 0";
  return `R$ ${value.toFixed(0)}`;
}

export default function PerfilMobilidadeMotoboyGanhosPage() {
  const navigate = useNavigate();
  const shell = useMotoristaPageV2();
  const driverEarnings = shell.driverEarnings as any;

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
            <CardTitle>Resumo de ganhos por entrega</CardTitle>
            <CardDescription>Consolidado da operacao de motoboy.</CardDescription>
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
            <CardTitle>Resumo semanal</CardTitle>
            <CardDescription>Fluxo recente de ganhos em entregas.</CardDescription>
          </CardHeader>
          <CardContent>
            <WeeklyEarningsChart driverProfileId={shell.driverProfileId || ""} />
          </CardContent>
        </Card>
      </div>

      <Button variant="outline" className="w-full justify-between" onClick={() => navigate(getProfileMobilityServicePath("motoboy", "configuracoes"))}>
        Revisar configuracoes de entregas
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}
