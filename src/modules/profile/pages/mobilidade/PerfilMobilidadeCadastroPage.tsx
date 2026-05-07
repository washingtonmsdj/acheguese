import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BadgeCheck, Car, FileCheck2, IdCard, ImagePlus, RotateCcw } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { DriverOperationalSnapshotCard } from "@/modules/profile/components/cards";
import { DriverVehicleDetailsCard } from "@/modules/profile/components/cards";
import { useDriverProfileIdentity } from "@/modules/mobility/hooks/useDriverProfileIdentity";
import { getProfileMobilitySectionPath } from "@/modules/profile/utils/profileMobilityNavigation";

function formatValue(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "Nao informado";
}

export default function PerfilMobilidadeCadastroPage() {
  const navigate = useNavigate();
  const { driverData, driverProfileId, isLoading } = useDriverProfileIdentity({
    queryScope: "perfil-mobilidade-cadastro",
  });

  const snapshot = driverData as any;
  const cadastroPath =
    snapshot?.can_do_delivery && snapshot?.can_do_rides === false
      ? "/central/motoboy/cadastro"
      : "/central/motorista/cadastro";

  const missingItems = useMemo(
    () => [
      !snapshot?.license_number ? "CNH ou documento principal" : null,
      !snapshot?.vehicle_plate ? "Placa do veiculo" : null,
      !snapshot?.vehicle_model ? "Modelo do veiculo" : null,
      snapshot?.avatar_url ? null : "Foto de perfil",
    ].filter(Boolean) as string[],
    [snapshot],
  );

  const approvalLabel = snapshot?.is_suspended
    ? "Suspenso"
    : snapshot?.is_verified === false
      ? "Aguardando aprovacao"
      : snapshot?.is_verified === true
        ? "Aprovado"
        : "Em analise";

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
              Cadastro operacional
            </CardTitle>
            <CardDescription>
              Dados pessoais, documentos, veiculo e status de aprovacao do perfil.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1">
                <BadgeCheck className="h-3 w-3" />
                {approvalLabel}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Car className="h-3 w-3" />
                {snapshot?.can_do_rides === false ? "Sem corridas" : "Corridas habilitadas"}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <FileCheck2 className="h-3 w-3" />
                {snapshot?.can_do_delivery ? "Entrega habilitada" : "Entrega nao habilitada"}
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
              Documentos e evidencias
            </CardTitle>
            <CardDescription>
              Informacoes obrigatorias para liberar o uso operacional.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "CNH", value: formatValue(snapshot?.license_number) },
              { label: "Validade da CNH", value: formatValue(snapshot?.license_expiry) },
              { label: "Placa", value: formatValue(snapshot?.vehicle_plate) },
              { label: "Modelo", value: formatValue(snapshot?.vehicle_model) },
              { label: "Ano", value: formatValue(snapshot?.vehicle_year) },
              { label: "Cor", value: formatValue(snapshot?.vehicle_color) },
              { label: "Foto", value: snapshot?.avatar_url ? "Enviada" : "Pendente" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-3 py-2">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-medium text-foreground">{item.value}</span>
              </div>
            ))}

            <div className="rounded-2xl border border-border bg-background p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pendencias
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {missingItems.length > 0 ? (
                  missingItems.map((item) => (
                    <Badge key={item} variant="secondary">
                      {item}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline">Nenhuma pendencia critica</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr,1fr]">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Veiculo registrado</CardTitle>
            <CardDescription>Conferir os dados que sustentam a operacao.</CardDescription>
          </CardHeader>
          <CardContent>
            {driverProfileId && snapshot ? (
              <DriverVehicleDetailsCard driverSnapshot={snapshot} />
            ) : (
              <p className="text-sm text-muted-foreground">
                O veiculo sera exibido apos a criacao do perfil operacional.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Acoes do cadastro</CardTitle>
            <CardDescription>Complete o que falta e reenvie documentos quando necessario.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-between" onClick={() => navigate(getProfileMobilitySectionPath("disponibilidade"))}>
              Ir para disponibilidade
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => navigate(cadastroPath)}>
              Reenviar documentos
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => navigate(getProfileMobilitySectionPath("configuracoes"))}>
              Revisar configuracoes
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
