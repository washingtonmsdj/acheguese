import type { LucideIcon } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Route, Settings2, Wallet } from "lucide-react";
import { useDriverProfileIdentity } from "@/core/mobility/hooks/useDriverProfileIdentity";
import { useNavigate } from "react-router-dom";

type ActivationMode = "rides" | "delivery";

type HubAction = {
  label: string;
  icon: LucideIcon;
  to: string;
};

type CentralMobilityHubPageProps = {
  queryScope: string;
  title: string;
  profileNoun: string;
  emptyIcon: LucideIcon;
  registrationPath: string;
  primaryActionLabel: string;
  actions: HubAction[];
  activationMode: ActivationMode;
};

function buildCapabilitiesLabel(canDoRides: boolean, canDoDelivery: boolean) {
  if (canDoRides && canDoDelivery) return "Corridas e Entregas";
  if (canDoRides) return "Apenas Corridas";
  if (canDoDelivery) return "Apenas Entregas";
  return "Nenhuma";
}

export function CentralMobilityHubPage({
  queryScope,
  title,
  profileNoun,
  emptyIcon: EmptyIcon,
  registrationPath,
  primaryActionLabel,
  actions,
  activationMode,
}: CentralMobilityHubPageProps) {
  const driverIdentity = useDriverProfileIdentity({ queryScope });
  const navigate = useNavigate();

  const driverData = driverIdentity.driverData;
  const isRegistered = driverIdentity.isRegistered;
  const isLoading = driverIdentity.isLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando perfil de {profileNoun}...</p>
        </div>
      </div>
    );
  }

  if (!isRegistered || !driverData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="space-y-4 p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <EmptyIcon className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Perfil de {profileNoun} não encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Você ainda não ativou seu perfil de {profileNoun}. Cadastre-se para começar a receber solicitações.
              </p>
            </div>
            <Button onClick={() => navigate(registrationPath)} className="w-full gap-2 sm:w-auto">
              <EmptyIcon className="h-4 w-4" />
              {primaryActionLabel}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canDoRides = driverData.can_do_rides !== false;
  const canDoDelivery = driverData.can_do_delivery === true;
  const isActive = activationMode === "delivery" ? canDoDelivery : canDoRides;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">Gerencie seu perfil de {profileNoun} e acompanhe suas operações</p>
        </div>
        <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Ativo" : "Inativo"}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <EmptyIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Status do perfil</p>
                <p className="text-xs text-muted-foreground">
                  {driverData.background_check_status === "approved" ? "Aprovado" : "Em verificação"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Route className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Taxa de aceitação</p>
                <p className="text-xs text-muted-foreground">{driverData.acceptance_rate ? `${driverData.acceptance_rate}%` : "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Capacidades</p>
                <p className="text-xs text-muted-foreground">{buildCapabilitiesLabel(canDoRides, canDoDelivery)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Ações rápidas</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => {
            const ActionIcon = action.icon;

            return (
              <Button
                key={action.to}
                variant="outline"
                className="h-auto w-full flex-col gap-2 py-6"
                onClick={() => navigate(action.to)}
              >
                <ActionIcon className="h-5 w-5" />
                <span className="text-sm">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <Card className="border-dashed">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Settings2 className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Fluxo unificado na Central</p>
              <p className="text-xs text-muted-foreground">
                Todas as ações acima permanecem dentro da Central para evitar perda de contexto durante a operação.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
