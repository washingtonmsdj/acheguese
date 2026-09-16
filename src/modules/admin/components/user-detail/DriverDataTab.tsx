import { Car, Clock, FileText, MapPin, Shield, TrendingUp } from "lucide-react";
import type { DriverDetail } from "@/modules/admin/hooks/useAdminUserDetail";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { ptBR } from "@/shared/utils/dateLocale";
import { cn } from "@/shared/utils/cn";
import { formatDistanceToNow } from "date-fns";

interface DriverDataTabProps {
  driverData: DriverDetail | null;
}

function formatRelativeDate(value: string | null): string {
  if (!value) return "Sem registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";
  return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
}

export function DriverDataTab({ driverData }: DriverDataTabProps) {
  if (!driverData) {
    return (
      <Card className="border-border bg-card text-card-foreground">
        <CardContent className="py-12 text-center">
          <Car className="mx-auto mb-3 h-12 w-12 text-muted-foreground" aria-hidden="true" />
          <p className="text-muted-foreground">
            Este perfil não possui cadastro de motorista.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Car className="h-4 w-4" aria-hidden="true" />
            Veículo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Detail label="Tipo" value={driverData.vehicle_type || "N/A"} />
            <Detail label="Modelo" value={driverData.vehicle_model || "N/A"} />
            <Detail label="Ano" value={String(driverData.vehicle_year || "N/A")} />
            <Detail label="Placa" value={driverData.vehicle_plate || "N/A"} mono />
            <Detail label="Cor" value={driverData.vehicle_color || "N/A"} />
            <Detail
              label="Modalidade"
              value={
                driverData.can_do_delivery
                  ? "Entregas"
                  : driverData.can_do_rides
                    ? "Corridas"
                    : "Não habilitada"
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" aria-hidden="true" />
            CNH e verificação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Detail label="Número" value={driverData.license_number || "N/A"} mono />
            <Detail label="Categoria" value={driverData.license_category || "N/A"} />
            <Detail label="UF" value={driverData.license_state || "N/A"} />
            <Detail
              label="Validade"
              value={
                driverData.license_expiry
                  ? new Date(`${driverData.license_expiry}T00:00:00`).toLocaleDateString(
                      "pt-BR",
                    )
                  : "N/A"
              }
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Badge
              className={cn(
                "border",
                driverData.documents_verified
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-warning/30 bg-warning/10 text-warning",
              )}
            >
              <Shield className="mr-1 h-3 w-3" aria-hidden="true" />
              {driverData.documents_verified
                ? "Documentos verificados"
                : "Documentos pendentes"}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground">
              Antecedentes: {driverData.background_check_status || "não informado"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            Histórico operacional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Corridas registradas" value={driverData.total_rides ?? 0} />
            <Metric
              label="Concluídas"
              value={driverData.total_rides_completed ?? 0}
              tone="success"
            />
            <Metric
              label="Canceladas"
              value={driverData.total_rides_cancelled ?? 0}
              tone="destructive"
            />
            <Metric
              label="Taxa de aceitação"
              value={`${driverData.acceptance_rate ?? 0}%`}
              tone="info"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" aria-hidden="true" />
            Presença operacional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <BooleanStatus label="Online" value={Boolean(driverData.is_online)} />
          <BooleanStatus label="Disponível" value={Boolean(driverData.is_available)} />

          {driverData.active_ride_id ? (
            <Detail
              label="Operação ativa"
              value={driverData.active_ride_mode === "motoboy" ? "Entrega" : "Corrida"}
            />
          ) : null}

          <Detail label="Último sinal" value={formatRelativeDate(driverData.last_seen_at)} />

          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Detail
              label="Última atualização de localização"
              value={formatRelativeDate(driverData.last_location_update)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-sm text-foreground", mono && "font-mono")}>{value}</p>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "success" | "destructive" | "info";
}) {
  const toneClass = {
    default: "text-foreground",
    success: "text-success",
    destructive: "text-destructive",
    info: "text-info",
  }[tone];

  return (
    <div className="rounded-lg bg-muted/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-bold", toneClass)}>{value}</p>
    </div>
  );
}

function BooleanStatus({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge
        className={
          value
            ? "border border-success/30 bg-success/10 text-success"
            : "border border-border bg-muted text-muted-foreground"
        }
      >
        {value ? "Sim" : "Não"}
      </Badge>
    </div>
  );
}
