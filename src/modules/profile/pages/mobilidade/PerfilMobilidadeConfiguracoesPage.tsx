import { useNavigate } from "react-router-dom";
import { Bell, Lock, Settings2, ShieldCheck } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { DriverNotifications } from "@/modules/mobility/components/driver/DriverNotifications";
import { DriverSettingsPanel } from "@/modules/mobility/components/driver/DriverSettingsPanel";
import { useDriverProfileIdentity } from "@/modules/mobility/hooks/useDriverProfileIdentity";
import { getProfileMobilitySectionPath } from "@/modules/profile/utils/profileMobilityNavigation";

export default function PerfilMobilidadeConfiguracoesPage() {
  const navigate = useNavigate();
  const identity = useDriverProfileIdentity({ queryScope: "perfil-mobilidade-configuracoes" });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1fr,0.95fr]">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings2 className="h-4 w-4 text-primary" />
              Configuracoes operacionais
            </CardTitle>
            <CardDescription>
              Preferencias, notificacoes, seguranca e controles do perfil de mobilidade.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
              Ajustes de seguranca e acesso ao perfil operacional.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-border bg-background p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Perfil</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {identity.driverProfileId ? "Perfil operacional vinculado" : "Perfil operacional ausente"}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Seguranca</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                Regras de compartilhamento de rota e privacidade ficam centralizadas aqui.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Operacao</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                Desativacao temporaria e bloqueios futuros serao controlados por este painel.
              </p>
            </div>
            <Button variant="outline" className="w-full justify-between" onClick={() => navigate(getProfileMobilitySectionPath("disponibilidade"))}>
              Ver disponibilidade
              <ShieldCheck className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-4 w-4 text-primary" />
            Notificacoes e alertas
          </CardTitle>
          <CardDescription>
            Os alertas do perfil operacional aparecem abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DriverNotifications />
        </CardContent>
      </Card>
    </div>
  );
}
