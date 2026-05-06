import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Car, PlayCircle, RotateCcw, Route, ShieldAlert } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { DriverRidesList } from "@/modules/mobility/components/driver/DriverRidesList";
import { useMotoristaPageV2 } from "@/modules/mobility/hooks/useMotoristaPageV2";
import { getProfileMobilityServicePath } from "@/modules/profile/utils/profileMobilityNavigation";

function isDeliveryRide(ride: any): boolean {
  return ride?.ride_mode === "motoboy" || ride?.type === "entrega";
}

/**
 * DriverRidesLayout
 * 
 * Layout compartilhado para página de corridas de motorista.
 * Reutiliza o componente DriverRidesList e o hook useMotoristaPageV2.
 * 
 * Este componente renderiza o mesmo layout que a página legada
 * /perfil/mobilidade/motorista/corridas.
 */
export function DriverRidesLayout() {
  const navigate = useNavigate();
  const shell = useMotoristaPageV2();

  const availableRides = useMemo(
    () => (shell.availableRides || []).filter((ride: any) => !isDeliveryRide(ride)),
    [shell.availableRides],
  );
  const acceptedRides = useMemo(
    () => (shell.activeRides || []).filter((ride: any) => !isDeliveryRide(ride)),
    [shell.activeRides],
  );
  const historyRides = useMemo(
    () => (shell.completedByMe || []).filter((ride: any) => !isDeliveryRide(ride)),
    [shell.completedByMe],
  );

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
              Marketplace de corridas de passageiro, sem misturar com entregas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DriverRidesList
              rides={acceptedRides as any}
              type="accepted"
              loading={shell.loading}
              onStart={(rideId) => shell.startRide(rideId)}
              onComplete={(_, ride) => {
                if (ride) shell.handleOpenCompleteDialog(ride as any);
              }}
              onCancel={(_, ride) => {
                if (ride) shell.handleOpenCancelDialog(ride as any);
              }}
            />

            <div className="mt-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Pedidos disponiveis</h3>
              <div className="space-y-3">
                {availableRides.length > 0 ? (
                  availableRides.map((ride: any) => (
                    <div key={ride.id} className="rounded-2xl border border-border bg-background p-4 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {ride.origin} {"->"} {ride.destination}
                          </p>
                          <p className="text-xs text-muted-foreground">{ride.passenger?.name || "Solicitacao de corrida"}</p>
                        </div>
                        <Badge variant="outline">
                          {typeof ride.suggested_price === "number" ? `R$ ${ride.suggested_price.toFixed(2)}` : "Sem valor"}
                        </Badge>
                      </div>
                      <Button className="w-full" disabled={!shell.isDriverOnline || shell.actionsLoading} onClick={() => shell.acceptRide(ride.id)}>
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
            <CardDescription>Acompanhamento rapido da operacao de corridas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-between" onClick={() => navigate(getProfileMobilityServicePath("motorista", "disponibilidade"))}>
              Ajustar disponibilidade
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => navigate(getProfileMobilityServicePath("motorista", "ganhos"))}>
              Ver ganhos
              <RotateCcw className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Historico recente</CardTitle>
          <CardDescription>Corridas concluidas e desempenho recente.</CardDescription>
        </CardHeader>
        <CardContent>
          <DriverRidesList rides={historyRides as any} type="history" loading={shell.loading} />
        </CardContent>
      </Card>
    </div>
  );
}
