import { Badge } from "@/shared/components/ui/badge";
import { MobilityMetricCard } from "./MobilityMetricCard";

interface DriverDataRecord {
  is_online: boolean | null;
  is_available: boolean | null;
  is_verified: boolean | null;
  rating: number | null;
  total_rides: number | null;
  total_rides_completed: number | null;
  total_rides_cancelled: number | null;
  acceptance_rate: number | null;
  cancellation_rate: number | null;
}

interface DriverOperationalSnapshotCardProps {
  readonly driverDisplayName: string;
  readonly driverSnapshot: DriverDataRecord;
}

function formatPercent(value?: number | null): string {
  if (typeof value !== "number") return "Nao informado";
  return `${Math.round(value)}%`;
}

function formatOptionalNumber(value?: number | null): string {
  if (typeof value !== "number") return "Nao informado";
  return String(value);
}

export function DriverOperationalSnapshotCard({
  driverDisplayName,
  driverSnapshot,
}: DriverOperationalSnapshotCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">{driverDisplayName}</h3>
        <Badge variant={driverSnapshot.is_online ? "default" : "secondary"} className="text-[10px]">
          {driverSnapshot.is_online ? "Online" : "Offline"}
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          {driverSnapshot.is_available ? "Disponivel" : "Indisponivel"}
        </Badge>
        {driverSnapshot.is_verified ? (
          <Badge variant="outline" className="text-[10px]">
            Verificado
          </Badge>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MobilityMetricCard
          label="Avaliacao"
          value={
            typeof driverSnapshot.rating === "number"
              ? driverSnapshot.rating.toFixed(1)
              : "Nao informado"
          }
        />
        <MobilityMetricCard
          label="Corridas totais"
          value={formatOptionalNumber(driverSnapshot.total_rides)}
        />
        <MobilityMetricCard
          label="Concluidas"
          value={formatOptionalNumber(driverSnapshot.total_rides_completed)}
        />
        <MobilityMetricCard
          label="Canceladas"
          value={formatOptionalNumber(driverSnapshot.total_rides_cancelled)}
        />
        <MobilityMetricCard
          label="Aceitacao"
          value={formatPercent(driverSnapshot.acceptance_rate)}
        />
        <MobilityMetricCard
          label="Cancelamento"
          value={formatPercent(driverSnapshot.cancellation_rate)}
        />
      </div>
    </div>
  );
}


