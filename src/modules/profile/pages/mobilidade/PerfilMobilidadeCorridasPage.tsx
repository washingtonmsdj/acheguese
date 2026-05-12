import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Car, PlayCircle, RotateCcw, Route, ShieldAlert } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { DriverRidesList } from "@/modules/mobility/components/driver/DriverRidesList";
import { useMotoristaPageV2 } from "@/modules/mobility/hooks/useMotoristaPageV2";
import { getProfileMobilitySectionPath } from "@/modules/profile/utils/profileMobilityNavigation";
import type { MobilityRide } from "@/modules/mobility/components/driver/DriverRidesTab";

type RideLike = MobilityRide & { ride_mode?: string | null; type?: string | null };

function isDeliveryRide(ride: RideLike): boolean {
  return ride?.ride_mode === "motoboy" || ride?.type === "entrega";
}

export default function PerfilMobilidadeCorridasPage() {
  const navigate = useNavigate();
  const shell = useMotoristaPageV2();

  const availableRides = useMemo(
    () => (shell.availableRides || []).filter((ride: RideLike) => !isDeliveryRide(ride)),
    [shell.availableRides],
  );
  const acceptedRides = useMemo(
    () => (shell.activeRides || []).filter((ride: RideLike) => !isDeliveryRide(ride)),
    [shell.activeRides],
  );
  const historyRides = useMemo(
    () => (shell.completedByMe || []).filter((ride: RideLike) => !isDeliveryRide(ride)),
    [shell.completedByMe],
  );

  if (shell.loading && !shell.driverProfileId) {
    return <div className="h-72 animate-pulse rounded-3xl border border-border bg-card" />;
  }

  return (
    <div className="space-y-4">
      {shell.isSuspended ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          Sua conta operacional esta suspensa. Pedidos de corrida nao serao exibidos.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Disponiveis", value: availableRides.length, icon: Route },
          { label: "Ativas", value: acceptedRides.length, icon: PlayCircle },
          { label: "Historico", value: historyRides.length, icon: Car },
          { label: "Em operacao", value: shell.isDriverOnline ? "Online" : "Offline", icon: ShieldAlert },
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

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border-border xl:col-span-2">
          <CardHeader>
            <CardTitle>Corridas disponiveis e em andamento</CardTitle>
            <CardDescription>
              Marketplace aberto para corridas de passageiro, sem misturar com entregas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DriverRidesList
              rides={acceptedRides as MobilityRide[]}
              type="accepted"
              loading={shell.loading}
              onStart={(rideId) => shell.startRide(rideId)}
              onComplete={(rideId, ride) => {
                if (ride) {
                  shell.handleOpenCompleteDialog(ride as MobilityRide);
                }
              }}
              onCancel={(rideId, ride) => {
                if (ride) {
                  shell.handleOpenCancelDialog(ride as MobilityRide);
                }
              }}
            />
            <div className="mt-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Pedidos disponiveis</h3>
              <div className="space-y-3">
                {availableRides.length > 0 ? (
                  availableRides.map((ride: RideLike) => (
                    <div key={ride.id} className="rounded-2xl border border-border bg-background p-4 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {ride.origin} {"->"} {ride.destination}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {ride.passenger?.name || "Solicitacao de corrida"}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {typeof ride.suggested_price === "number" ? `R$ ${ride.suggested_price.toFixed(2)}` : "Sem valor"}
                        </Badge>
                      </div>
                      <Button
                        className="w-full"
                        disabled={!shell.isDriverOnline || shell.actionsLoading}
                        onClick={() => shell.acceptRide(ride.id)}
                      >
                        Aceitar corrida
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma corrida disponivel no momento.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Historico e acoes</CardTitle>
            <CardDescription>
              Acompanhamento rapido da operacao de corridas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-between" onClick={() => navigate(getProfileMobilitySectionPath("disponibilidade"))}>
              Ajustar disponibilidade
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => navigate(getProfileMobilitySectionPath("ganhos"))}>
              Ver ganhos
              <RotateCcw className="h-4 w-4" />
            </Button>
            <div className="rounded-2xl border border-border bg-background p-3 text-sm text-muted-foreground">
              Acoes como iniciar, finalizar e cancelar usam o fluxo operacional oficial da mobilidade.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Historico recente</CardTitle>
          <CardDescription>
            Corridas concluida que ajudaram a compor o painel de desempenho.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DriverRidesList
            rides={historyRides as MobilityRide[]}
            type="history"
            loading={shell.loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
