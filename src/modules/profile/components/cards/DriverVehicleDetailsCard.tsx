import { MobilityDetailRow } from "./MobilityDetailRow";

interface DriverDataRecord {
  vehicle_model: string | null;
  vehicle_plate: string | null;
  vehicle_year: number | null;
  vehicle_color: string | null;
}

interface DriverVehicleDetailsCardProps {
  readonly driverSnapshot: DriverDataRecord;
}

function formatOptionalNumber(value?: number | null): string {
  if (typeof value !== "number") return "Não informado";
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
          value={driverSnapshot.vehicle_model || "Não informado"}
        />
        <MobilityDetailRow
          label="Placa"
          value={driverSnapshot.vehicle_plate || "Não informado"}
        />
        <MobilityDetailRow
          label="Ano"
          value={formatOptionalNumber(driverSnapshot.vehicle_year)}
        />
        <MobilityDetailRow
          label="Cor"
          value={driverSnapshot.vehicle_color || "Não informado"}
        />
      </div>
    </div>
  );
}
