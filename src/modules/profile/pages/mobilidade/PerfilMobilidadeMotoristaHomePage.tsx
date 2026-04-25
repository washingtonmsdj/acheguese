import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Car, Clock3, MapPinned, ShieldAlert, Wallet } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { DriverSuspensionAlert } from "@/modules/mobility/components/driver/DriverSuspensionAlert";
import { useMotoristaPageV2 } from "@/modules/mobility/hooks/useMotoristaPageV2";
import { getMobilityServiceStatus } from "@/modules/profile/utils/mobilityServiceStatus";
import { getProfileMobilityServicePath } from "@/modules/profile/utils/profileMobilityNavigation";

function formatMoney(value?: number | null): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "R$ 0";
  return `R$ ${value.toFixed(0)}`;
}

function isDeliveryRide(ride: any): boolean {
  return ride?.ride_mode === "motoboy" || ride?.type === "entrega";
}

export default function PerfilMobilidadeMotoristaHomePage() {
  const navigate = useNavigate();
  const shell = useMotoristaPageV2();

  const availableRides = useMemo(
    () => (shell.availableRides || []).filter((ride: any) => !isDeliveryRide(ride)),
    [shell.availableRides],
  );
  const activeRides = useMemo(
    () => (shell.activeRides || []).filter((ride: any) => !isDeliveryRide(ride)),
    [shell.activeRides],
  );
  const historyRides = useMemo(
    () => (shell.completedByMe || []).filter((ride: any) => !isDeliveryRide(ride)),
    [shell.completedByMe],
  );

  const statusLabel = getMobilityServiceStatus({
    driverProfileId: shell.driverProfileId,
    driverData: shell.driverData,
    service: "motorista",
  });

  return (
    <div className="space-y-4">
      <DriverSuspensionAlert />

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Car className="h-4 w-4 text-primary" />
            Area Motorista
          </CardTitle>
          <CardDescription>
            Corridas de passageiros com origem/destino, disponibilidade e historico separados do fluxo de entregas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1">
              <ShieldAlert className="h-3 w-3" />
              {statusLabel}
            </Badge>
            <Badge variant={shell.isDriverOnline ? "default" : "secondary"} className="gap-1">
              <Clock3 className="h-3 w-3" />
              {shell.isDriverOnline ? "Online" : "Offline"}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Wallet className="h-3 w-3" />
              {formatMoney((shell.driverEarnings as any)?.month ?? 0)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Corridas disponiveis", value: availableRides.length },
          { label: "Corridas ativas", value: activeRides.length },
          { label: "Historico", value: historyRides.length },
          { label: "Avaliacao", value: typeof (shell.driverStats as any)?.avgRating === "number" ? (shell.driverStats as any).avgRating.toFixed(1) : "0.0" },
        ].map((item) => (
          <Card key={item.label} className="border-border">
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Button variant="outline" className="justify-between" onClick={() => navigate(getProfileMobilityServicePath("motorista", "cadastro"))}>
          Cadastro
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" className="justify-between" onClick={() => navigate(getProfileMobilityServicePath("motorista", "disponibilidade"))}>
          Disponibilidade
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button className="justify-between" onClick={() => navigate(getProfileMobilityServicePath("motorista", "corridas"))}>
          Corridas
          <MapPinned className="h-4 w-4" />
        </Button>
        <Button variant="outline" className="justify-between" onClick={() => navigate(getProfileMobilityServicePath("motorista", "ganhos"))}>
          Ganhos
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" className="justify-between" onClick={() => navigate(getProfileMobilityServicePath("motorista", "configuracoes"))}>
          Configuracoes
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
