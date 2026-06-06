import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bike, Package, RotateCcw, ShieldAlert, Truck } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { MotoboyDeliveryActions } from "@/modules/mobility/components/driver/MotoboyDeliveryActions";
import { useMotoristaPage } from "@/modules/mobility/hooks/useMotoristaPage";
import { getMobilityServicePath } from "@/modules/mobility/routes/mobilityNavigation";
import { getRecordValue } from "@/shared/utils/recordLookup";
import { formatBrl } from "@/shared/utils/currency";

type DeliveryLike = {
  id: string;
  status: string;
  origin?: string | null;
  destination?: string | null;
  suggested_price?: number | null;
  package_description?: string | null;
  customer_trust_risk_level?: string | null;
  ride_mode?: string | null;
  type?: string | null;
};

function isDeliveryRide(ride: DeliveryLike): boolean {
  return ride?.ride_mode === "motoboy" || ride?.type === "entrega";
}

const TRUST_RISK_LABELS: Record<string, string> = {
  watchlist: "Cliente em observacao",
  restricted: "Prioridade reduzida",
  critical: "Revisao admin",
};

function getTrustRiskLabel(delivery: DeliveryLike): string | null {
  const risk = delivery?.customer_trust_risk_level;
  if (typeof risk !== "string" || risk === "trusted") return null;
  return getRecordValue(TRUST_RISK_LABELS, risk) ?? risk;
}

/**
 * DriverDeliveriesLayout
 * 
 * Layout compartilhado para pagina de entregas de motoboy.
 * Reutiliza o componente MotoboyDeliveryActions e o hook useMotoristaPage.
 * 
 * Este componente renderiza o layout operacional canonico
 * /central/motoboy/entregas.
 */
export function DriverDeliveriesLayout() {
  const navigate = useNavigate();
  const shell = useMotoristaPage();

  const activeDeliveries = useMemo(
    () => (shell.activeDeliveries || []).filter(isDeliveryRide),
    [shell.activeDeliveries],
  );
  const availableDeliveries = useMemo(
    () => (shell.availableRides || []).filter(isDeliveryRide),
    [shell.availableRides],
  );

  return (
    <div className="space-y-4">
      {!shell.canAcceptDeliveryOffers ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
          O perfil atual nao esta habilitado para entregas.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Disponiveis", value: availableDeliveries.length, icon: Package },
          { label: "Em andamento", value: activeDeliveries.length, icon: Truck },
          { label: "Modo", value: shell.isDriverOnline ? "Online" : "Offline", icon: Bike },
          { label: "Status", value: shell.isSuspended ? "Suspenso" : "Operando", icon: ShieldAlert },
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

      <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Entregas em andamento</CardTitle>
            <CardDescription>Fluxo de coleta, partida, entrega e comprovante.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeDeliveries.length > 0 ? activeDeliveries.map((delivery: DeliveryLike) => (
              <MotoboyDeliveryActions
                key={delivery.id}
                ride={delivery}
                driverProfileId={shell.currentDriverId || ""}
                onGoToPickup={shell.handleGoToPickup}
                onConfirmPickup={shell.handleConfirmPickup}
                onStartDelivery={shell.handleStartDelivery}
                onConfirmDelivery={shell.handleConfirmDelivery}
                onFailDelivery={shell.handleFailDelivery}
              />
            )) : <p className="text-sm text-muted-foreground">Nenhuma entrega em andamento.</p>}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Acoes rapidas</CardTitle>
            <CardDescription>Ajustes da operacao de motoboy.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-between" onClick={() => navigate(getMobilityServicePath("motoboy", "disponibilidade"))}>
              Ajustar disponibilidade
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => navigate(getMobilityServicePath("motoboy", "cadastro"))}>
              Revisar cadastro
              <RotateCcw className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Pedidos de entrega disponiveis</CardTitle>
          <CardDescription>Marketplace aberto de entregas para motoboy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {availableDeliveries.length > 0 ? availableDeliveries.map((delivery: DeliveryLike) => (
            <div key={delivery.id} className="rounded-2xl border border-border bg-background p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{delivery.origin} {"->"} {delivery.destination}</p>
                  <p className="text-xs text-muted-foreground">{delivery.package_description || "Pacote"}</p>
                  {getTrustRiskLabel(delivery) ? (
                    <Badge variant="outline" className="mt-2">
                      {getTrustRiskLabel(delivery)}
                    </Badge>
                  ) : null}
                </div>
                <Badge variant="outline">
                  {typeof delivery.suggested_price === "number" ? formatBrl(delivery.suggested_price) : "Sem valor"}
                </Badge>
              </div>
              <Button className="w-full" disabled={!shell.isDriverOnline || shell.actionsLoading} onClick={() => shell.acceptRide(delivery.id)}>
                Aceitar entrega
              </Button>
            </div>
          )) : <p className="text-sm text-muted-foreground">Nenhuma entrega disponivel no momento.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
