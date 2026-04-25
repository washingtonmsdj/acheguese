import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BadgeCheck, Car, FileCheck2, IdCard, ImagePlus } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { DriverOperationalSnapshotCard, DriverVehicleDetailsCard } from "@/modules/profile/components/cards";
import { useDriverProfileIdentity } from "@/modules/mobility/hooks/useDriverProfileIdentity";
import { getMobilityServiceStatus } from "@/modules/profile/utils/mobilityServiceStatus";
import { getProfileMobilityServicePath } from "@/modules/profile/utils/profileMobilityNavigation";

function formatValue(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "Nao informado";
}

export default function PerfilMobilidadeMotoristaCadastroPage() {
  const navigate = useNavigate();
  const { driverData, driverProfileId, isLoading } = useDriverProfileIdentity({
    queryScope: "perfil-mobilidade-motorista-cadastro",
  });

  const snapshot = driverData as any;
  const status = getMobilityServiceStatus({ driverProfileId, driverData: snapshot, service: "motorista" });

  const missingItems = useMemo(
    () => [
      !snapshot?.license_number ? "CNH ou documento principal" : null,
      !snapshot?.vehicle_plate ? "Placa do veiculo" : null,
      !snapshot?.vehicle_model ? "Modelo do veiculo" : null,
      snapshot?.avatar_url ? null : "Foto de perfil",
    ].filter(Boolean) as string[],
    [snapshot],
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
              Cadastro de Motorista
            </CardTitle>
            <CardDescription>
              Dados e documentos para corridas de passageiros.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1">
                <BadgeCheck className="h-3 w-3" />
                {status}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Car className="h-3 w-3" />
                {snapshot?.can_do_rides === false ? "Corridas desabilitadas" : "Corridas habilitadas"}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <FileCheck2 className="h-3 w-3" />
                {snapshot?.can_do_delivery ? "Entrega tambem habilitada" : "Somente corridas"}
              </Badge>
            </div>

            {driverProfileId && snapshot ? (
              <DriverOperationalSnapshotCard
                driverDisplayName={formatValue(snapshot?.display_name)}
                driverSnapshot={snapshot}
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
              Itens usados para liberar corridas.
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

      <div className="grid gap-4 xl:grid-cols-[1fr,1fr]">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Veiculo registrado</CardTitle>
            <CardDescription>Dados usados na operacao de corridas.</CardDescription>
          </CardHeader>
          <CardContent>
            {driverProfileId && snapshot ? (
              <DriverVehicleDetailsCard driverSnapshot={snapshot} />
            ) : (
              <p className="text-sm text-muted-foreground">O veiculo sera exibido apos a criacao do perfil.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Proximos passos</CardTitle>
            <CardDescription>Continue no fluxo de motorista sem misturar entregas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-between" onClick={() => navigate(getProfileMobilityServicePath("motorista", "disponibilidade"))}>
              Ir para disponibilidade
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => navigate(getProfileMobilityServicePath("motorista", "configuracoes"))}>
              Revisar configuracoes
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
