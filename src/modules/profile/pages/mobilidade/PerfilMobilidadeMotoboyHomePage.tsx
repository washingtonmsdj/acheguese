import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Bike, Clock3, Package, ShieldAlert, Wallet } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { useMotoristaPageV2 } from "@/modules/mobility/hooks/useMotoristaPageV2";
import { getMobilityServiceStatus } from "@/modules/profile/utils/mobilityServiceStatus";
import { getProfileMobilityServicePath } from "@/modules/profile/utils/profileMobilityNavigation";

function formatMoney(value?: number | null): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "R$ 0";
  return `R$ ${value.toFixed(0)}`;
}

type RideLike = { ride_mode?: string | null; type?: string | null };
type DriverEarningsLike = { month?: number | null };

function isDeliveryRide(ride: RideLike): boolean {
  return ride?.ride_mode === "motoboy" || ride?.type === "entrega";
}

export default function PerfilMobilidadeMotoboyHomePage() {
  const navigate = useNavigate();
  const shell = useMotoristaPageV2();

  const availableDeliveries = useMemo(
    () => (shell.availableRides || []).filter((ride: RideLike) => isDeliveryRide(ride)),
    [shell.availableRides],
  );
  const activeDeliveries = useMemo(
    () => (shell.activeDeliveries || []).filter((ride: RideLike) => isDeliveryRide(ride)),
    [shell.activeDeliveries],
  );

  const statusLabel = getMobilityServiceStatus({
    driverProfileId: shell.driverProfileId,
    driverData: shell.driverData,
    service: "motoboy",
  });

  return (
    <div className="space-y-4">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bike className="h-4 w-4 text-primary" />
            Area Motoboy
          </CardTitle>
          <CardDescription>
            Entregas de produtos e pedidos, separadas do fluxo de corridas de passageiros.
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
              {formatMoney((shell.driverEarnings as DriverEarningsLike | null)?.month ?? 0)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Entregas disponiveis", value: availableDeliveries.length },
          { label: "Entregas ativas", value: activeDeliveries.length },
          { label: "Modo", value: shell.canAcceptDeliveryOffers ? "Motoboy habilitado" : "Motoboy desabilitado" },
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
        <Button variant="outline" className="justify-between" onClick={() => navigate(getProfileMobilityServicePath("motoboy", "cadastro"))}>
          Cadastro
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" className="justify-between" onClick={() => navigate(getProfileMobilityServicePath("motoboy", "disponibilidade"))}>
          Disponibilidade
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button className="justify-between" onClick={() => navigate(getProfileMobilityServicePath("motoboy", "entregas"))}>
          Entregas
          <Package className="h-4 w-4" />
        </Button>
        <Button variant="outline" className="justify-between" onClick={() => navigate(getProfileMobilityServicePath("motoboy", "ganhos"))}>
          Ganhos
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" className="justify-between" onClick={() => navigate(getProfileMobilityServicePath("motoboy", "configuracoes"))}>
          Configuracoes
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
