import { useNavigate } from "react-router-dom";
import { Bell, MapPin, Settings2, ShieldCheck } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { DriverNotifications } from "@/core/mobility/components/driver/DriverNotifications";
import { DriverSettingsPanel } from "@/core/mobility/components/driver/DriverSettingsPanel";
import { ServiceAreasManager } from "@/core/service-areas";
import { useDriverProfileIdentity } from "@/core/mobility/hooks/useDriverProfileIdentity";
import { getMobilityServicePath } from "@/core/mobility/routes/mobilityNavigation";

export interface DriverSettingsLayoutProps {
  /**
   * Tipo de servico: "motorista" ou "motoboy"
   */
  service: "motorista" | "motoboy";
}

/**
 * DriverSettingsLayout
 *
 * Layout compartilhado para pagina de configuracoes de motorista/motoboy.
 * Reutiliza os componentes DriverSettingsPanel e DriverNotifications.
 *
 * Este componente renderiza o layout das rotas operacionais da Central.
 * /central/motorista/configuracoes e /central/motoboy/configuracoes.
 */
export function DriverSettingsLayout({ service }: DriverSettingsLayoutProps) {
  const navigate = useNavigate();
  const identity = useDriverProfileIdentity({
    queryScope: `driver-settings-layout-${service}`
  });

  const isMotorista = service === "motorista";
  const title = isMotorista ? "Configuracoes de Motorista" : "Configuracoes de Motoboy";
  const description = isMotorista
    ? "Preferencias, notificacoes e controles do fluxo de corridas."
    : "Preferencias, notificacoes e controles do fluxo de entregas.";
  const profileLabel = isMotorista ? "motorista" : "motoboy";
  const profileStatus = identity.driverProfileId
    ? `Perfil de ${profileLabel} vinculado`
    : `Perfil de ${profileLabel} ausente`;
  const quickActionLabel = isMotorista ? "corridas" : "entregas";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1fr,0.95fr]">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings2 className="h-4 w-4 text-primary" />
              {title}
            </CardTitle>
            <CardDescription>
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DriverSettingsPanel />
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-4 w-4 text-primary" />
              Informacoes rapidas
            </CardTitle>
            <CardDescription>
              Ajustes de seguranca e acesso do perfil de {profileLabel}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-border bg-background p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Perfil</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {profileStatus}
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() =>
                navigate(
                  service === "motorista"
                    ? getMobilityServicePath("motorista", "disponibilidade")
                    : getMobilityServicePath("motoboy", "disponibilidade"),
                )
              }
            >
              Ver disponibilidade
              <ShieldCheck className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-4 w-4 text-primary" />
            Areas de atuacao
          </CardTitle>
          <CardDescription>
            Territorios oficiais onde o perfil de {profileLabel} aceita atendimento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {identity.driverProfileId ? (
            <ServiceAreasManager profileId={identity.driverProfileId} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Crie e vincule o perfil operacional antes de configurar a cobertura.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">
            Notificacoes e alertas de {quickActionLabel}
          </CardTitle>
          <CardDescription>
            Alertas operacionais do perfil de {profileLabel}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DriverNotifications />
        </CardContent>
      </Card>
    </div>
  );
}
