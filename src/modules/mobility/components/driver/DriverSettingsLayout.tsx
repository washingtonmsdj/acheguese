import { useNavigate } from "react-router-dom";
import { Bell, Settings2, ShieldCheck } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { DriverNotifications } from "@/modules/mobility/components/driver/DriverNotifications";
import { DriverSettingsPanel } from "@/modules/mobility/components/driver/DriverSettingsPanel";
import { useDriverProfileIdentity } from "@/modules/mobility/hooks/useDriverProfileIdentity";
import { getProfileMobilityServicePath } from "@/modules/profile/utils/profileMobilityNavigation";

export interface DriverSettingsLayoutProps {
  /**
   * Tipo de serviço: "motorista" ou "motoboy"
   */
  service: "motorista" | "motoboy";
}

/**
 * DriverSettingsLayout
 * 
 * Layout compartilhado para página de configurações de motorista/motoboy.
 * Reutiliza os componentes DriverSettingsPanel e DriverNotifications.
 * 
 * Este componente renderiza o mesmo layout que as páginas legadas
 * /perfil/mobilidade/motorista/configuracoes e /perfil/mobilidade/motoboy/configuracoes.
 */
export function DriverSettingsLayout({ service }: DriverSettingsLayoutProps) {
  const navigate = useNavigate();
  const identity = useDriverProfileIdentity({ 
    queryScope: `driver-settings-layout-${service}` 
  });

  const isMotorista = service === "motorista";
  const title = isMotorista ? "Configurações de Motorista" : "Configurações de Motoboy";
  const description = isMotorista 
    ? "Preferências, notificações e controles do fluxo de corridas."
    : "Preferências, notificações e controles do fluxo de entregas.";
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
              Informações rápidas
            </CardTitle>
            <CardDescription>
              Ajustes de segurança e acesso do perfil de {profileLabel}.
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
              onClick={() => navigate(getProfileMobilityServicePath(service, "disponibilidade"))}
            >
              Ver disponibilidade
              <ShieldCheck className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">
            Notificações e alertas de {quickActionLabel}
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
