import { useNavigate } from "react-router-dom";
import { Bell, Settings2, ShieldCheck } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { DriverNotifications } from "@/modules/mobility/components/driver/DriverNotifications";
import { DriverSettingsPanel } from "@/modules/mobility/components/driver/DriverSettingsPanel";
import { useDriverProfileIdentity } from "@/modules/mobility/hooks/useDriverProfileIdentity";
import { getProfileMobilityServicePath } from "@/modules/profile/utils/profileMobilityNavigation";

export default function PerfilMobilidadeMotoristaConfiguracoesPage() {
  const navigate = useNavigate();
  const identity = useDriverProfileIdentity({ queryScope: "perfil-mobilidade-motorista-configuracoes" });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1fr,0.95fr]">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings2 className="h-4 w-4 text-primary" />
              Configuracoes de Motorista
            </CardTitle>
            <CardDescription>
              Preferencias, notificacoes e controles do fluxo de corridas.
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
            <CardDescription>Ajustes de seguranca e acesso do perfil de motorista.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-border bg-background p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Perfil</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {identity.driverProfileId ? "Perfil de motorista vinculado" : "Perfil de motorista ausente"}
              </p>
            </div>
            <Button variant="outline" className="w-full justify-between" onClick={() => navigate(getProfileMobilityServicePath("motorista", "disponibilidade"))}>
              Ver disponibilidade
              <ShieldCheck className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Notificacoes e alertas de corridas</CardTitle>
          <CardDescription>Alertas operacionais do perfil de motorista.</CardDescription>
        </CardHeader>
        <CardContent>
          <DriverNotifications />
        </CardContent>
      </Card>
    </div>
  );
}
