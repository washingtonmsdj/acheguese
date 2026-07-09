import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BadgeCheck, Bike, Car, FileCheck2, IdCard, ImagePlus } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  DriverOperationalSnapshotCard,
  DriverVehicleDetailsCard,
} from "@/core/profiles/components/cards";
import { useDriverProfileIdentity } from "@/core/mobility/hooks/useDriverProfileIdentity";
import { getMobilityServiceStatus } from "@/core/profile/utils/mobilityServiceStatus";
import { getMobilityServicePath } from "@/modules/mobility/routes/mobilityNavigation";

export interface DriverProfileLayoutProps {
  /**
   * Tipo de servico: "motorista" ou "motoboy"
   */
  service: "motorista" | "motoboy";
}

function formatValue(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "Nao informado";
}

/**
 * DriverProfileLayout
 * 
 * Layout compartilhado para pagina de cadastro de motorista/motoboy.
 * Reutiliza os componentes DriverOperationalSnapshotCard e DriverVehicleDetailsCard.
 * 
 * Este componente renderiza o layout das rotas operacionais da Central.
 * /central/motorista/cadastro e /central/motoboy/cadastro.
 */
export function DriverProfileLayout({ service }: DriverProfileLayoutProps) {
  const navigate = useNavigate();
  const { driverData, driverProfileId, isLoading } = useDriverProfileIdentity({
    queryScope: `driver-profile-layout-${service}`,
  });

  const snapshot = driverData as Record<string, unknown> | null;
  const status = getMobilityServiceStatus({ driverProfileId, driverData: snapshot, service });

  const isMotorista = service === "motorista";
  const title = isMotorista ? "Cadastro de Motorista" : "Cadastro de Motoboy";
  const description = isMotorista 
    ? "Dados e documentos para corridas de passageiros."
    : "Dados e documentos para operacao de entregas.";
  const dataDescription = isMotorista 
    ? "Itens usados para liberar corridas."
    : "Itens usados para liberar entregas.";
  const vehicleLabel = isMotorista ? "veiculo" : "moto";
  const vehiclePlateLabel = isMotorista ? "Placa do veiculo" : "Placa da moto";
  const vehicleModelLabel = isMotorista ? "Modelo do veiculo" : "Modelo da moto";
  const ServiceIcon = isMotorista ? Car : Bike;
  const serviceBadgeLabel = isMotorista 
    ? (snapshot?.can_do_rides === false ? "Corridas desabilitadas" : "Corridas habilitadas")
    : (snapshot?.can_do_delivery ? "Entregas habilitadas" : "Entregas desabilitadas");
  const otherServiceBadgeLabel = isMotorista 
    ? (snapshot?.can_do_delivery ? "Entrega tambem habilitada" : "Somente corridas")
    : (snapshot?.can_do_rides === false ? "Somente entregas" : "Corridas tambem habilitadas");
  const vehicleCardTitle = isMotorista ? "Veiculo registrado" : "Moto e configuracao atual";
  const vehicleCardDescription = isMotorista 
    ? "Dados usados na operacao de corridas."
    : "Dados usados nas entregas.";
  const nextStepsTitle = "Proximos passos";
  const nextStepsDescription = isMotorista 
    ? "Continue no fluxo de motorista sem misturar entregas."
    : "Continue no fluxo de motoboy.";
  const actionButtonLabel = isMotorista 
    ? "Ir para disponibilidade"
    : "Ir para disponibilidade de entregas";

  const missingItems = useMemo(
    () => [
      !snapshot?.license_number ? "CNH ou documento principal" : null,
      !snapshot?.vehicle_plate ? vehiclePlateLabel : null,
      !snapshot?.vehicle_model ? vehicleModelLabel : null,
      snapshot?.avatar_url ? null : "Foto de perfil",
    ].filter(Boolean) as string[],
    [snapshot, vehiclePlateLabel, vehicleModelLabel],
  );

  if (isLoading && !driverData) {
    return <div className="h-72 animate-pulse rounded-3xl border border-border bg-card" />;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <IdCard className="h-4 w-4 text-primary" />
              {title}
            </CardTitle>
            <CardDescription>
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1">
                <BadgeCheck className="h-3 w-3" />
                {status}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <ServiceIcon className="h-3 w-3" />
                {serviceBadgeLabel}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <FileCheck2 className="h-3 w-3" />
                {otherServiceBadgeLabel}
              </Badge>
            </div>

            {driverProfileId && snapshot ? (
              <DriverOperationalSnapshotCard
                driverDisplayName={formatValue(snapshot?.display_name)}
                driverSnapshot={snapshot as never}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
                Nenhum perfil operacional cadastrado ainda.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ImagePlus className="h-4 w-4 text-primary" />
              Conferencia de dados
            </CardTitle>
            <CardDescription>
              {dataDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "CNH", value: formatValue(snapshot?.license_number) },
              { label: "Validade da CNH", value: formatValue(snapshot?.license_expiry) },
              { label: "Placa", value: formatValue(snapshot?.vehicle_plate) },
              { label: "Modelo", value: formatValue(snapshot?.vehicle_model) },
              { label: "Ano", value: formatValue(snapshot?.vehicle_year) },
              { label: "Foto", value: snapshot?.avatar_url ? "Enviada" : "Pendente" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-3 py-2">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-medium text-foreground">{item.value}</span>
              </div>
            ))}

            <div className="rounded-2xl border border-border bg-background p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pendencias</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {missingItems.length > 0 ? missingItems.map((item) => (
                  <Badge key={item} variant="secondary">{item}</Badge>
                )) : <Badge variant="outline">Nenhuma pendencia critica</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isMotorista ? (
        <div className="grid gap-4 xl:grid-cols-[1fr,1fr]">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">{vehicleCardTitle}</CardTitle>
              <CardDescription>{vehicleCardDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              {driverProfileId && snapshot ? (
                <DriverVehicleDetailsCard driverSnapshot={snapshot as never} />
              ) : (
                <p className="text-sm text-muted-foreground">O {vehicleLabel} sera exibido apos a criacao do perfil.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">{nextStepsTitle}</CardTitle>
              <CardDescription>{nextStepsDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-between" onClick={() => navigate(getMobilityServicePath(service, "disponibilidade"))}>
                {actionButtonLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between" onClick={() => navigate(getMobilityServicePath(service, "configuracoes"))}>
                Revisar configuracoes
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">{vehicleCardTitle}</CardTitle>
              <CardDescription>{vehicleCardDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              {driverProfileId && snapshot ? (
                <DriverVehicleDetailsCard driverSnapshot={snapshot as never} />
              ) : (
                <p className="text-sm text-muted-foreground">A {vehicleLabel} sera exibida apos a criacao do perfil.</p>
              )}
            </CardContent>
          </Card>

          <Button className="w-full justify-between" onClick={() => navigate(getMobilityServicePath(service, "disponibilidade"))}>
            {actionButtonLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}
