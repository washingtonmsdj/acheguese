import { MobilityDetailRow } from "./MobilityDetailRow";
import type { Tables } from "@/core/supabase";

type DriverDataRecord = Tables<"driver_data">;

interface DriverVehicleDetailsCardProps {
  readonly driverSnapshot: DriverDataRecord;
}

function formatOptionalNumber(value?: number | null): string {
  if (typeof value !== "number") return "Nao informado";
  return String(value);
}

export function DriverVehicleDetailsCard({
  driverSnapshot,
}: DriverVehicleDetailsCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        Veiculo registrado
      </p>
      <div className="mt-3 space-y-2">
        <MobilityDetailRow
          label="Modelo"
          value={driverSnapshot.vehicle_model || "Nao informado"}
        />
        <MobilityDetailRow
          label="Placa"
          value={driverSnapshot.vehicle_plate || "Nao informado"}
        />
        <MobilityDetailRow
          label="Ano"
          value={formatOptionalNumber(driverSnapshot.vehicle_year)}
        />
        <MobilityDetailRow
          label="Cor"
          value={driverSnapshot.vehicle_color || "Nao informado"}
        />
      </div>
    </div>
  );
}

