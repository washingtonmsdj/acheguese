import { useNavigate } from "react-router-dom";
import { ArrowRight, Car, Clock, MapPin } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { useAppUrls } from "@/core/routing/hooks";
import { formatBrl } from "@/shared/utils/currency";

interface ProfileActiveRide {
  id: string;
  status?: string;
  ride_mode?: string | null;
  origin?: string | null;
  origin_details?: string | null;
  destination?: string | null;
  destination_details?: string | null;
  final_price?: number | null;
}

interface ProfileActiveRideCardProps {
  ride: ProfileActiveRide;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Aguardando",
  requested: "Solicitada",
  searching_driver: "Buscando motorista",
  driver_assigned: "Motorista atribuido",
  driver_accepted: "Aceita",
  accepted: "Aceita",
  driver_arriving: "Motorista a caminho",
  passenger_boarded: "Em andamento",
  in_progress: "Em andamento",
  completed: "Concluida",
  cancelled: "Cancelada",
};

export function ProfileActiveRideCard({ ride }: ProfileActiveRideCardProps) {
  const navigate = useNavigate();
  const appUrls = useAppUrls();

  const origin = ride.origin_details || ride.origin || "Origem não informada";
  const destination =
    ride.destination_details || ride.destination || "Destino não informado";
  const statusLabel = STATUS_LABELS[ride.status || "pending"] || "Em andamento";
  const mobilityPath =
    ride.ride_mode === "motoboy"
      ? appUrls.profile.mobilidade.motoboy.entregas
      : appUrls.profile.mobilidade.motorista.corridas;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/10">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Corrida ativa</p>
              <p className="text-xs text-muted-foreground">
                Resumo operacional da mobilidade
              </p>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0">
            <Clock className="h-3 w-3 mr-1" />
            {statusLabel}
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-background/70 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">
              Origem
            </p>
            <div className="flex items-start gap-2 text-sm text-foreground">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <span>{origin}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background/70 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">
              Destino
            </p>
            <div className="flex items-start gap-2 text-sm text-foreground">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <span>{destination}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {typeof ride.final_price === "number" ? (
              <span>
                Valor estimado: <strong className="text-foreground">{formatBrl(ride.final_price)}</strong>
              </span>
            ) : (
              <span>Abra a central de mobilidade para acompanhar os detalhes.</span>
            )}
          </div>

          <Button
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={() => navigate(mobilityPath)}
          >
            Abrir mobilidade
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
