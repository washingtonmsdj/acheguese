import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Clock3, MapPin, Navigation2, Radio, ToggleLeft, ToggleRight } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { useMotoristaPageV2 } from "@/modules/mobility/hooks/useMotoristaPageV2";
import { useDriverProfileIdentity } from "@/modules/mobility/hooks/useDriverProfileIdentity";
import { getProfileMobilitySectionPath } from "@/modules/profile/utils/profileMobilityNavigation";

function formatValue(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return `${value}`;
  return "Nao informado";
}

export default function PerfilMobilidadeDisponibilidadePage() {
  const navigate = useNavigate();
  const shell = useMotoristaPageV2();
  const identity = useDriverProfileIdentity({ queryScope: "perfil-mobilidade-disponibilidade" });

  const driverData = shell.driverData as Record<string, unknown> | null;
  const modeLabel = useMemo(() => {
    const ride = driverData?.can_do_rides !== false;
    const delivery = driverData?.can_do_delivery === true;
    if (ride && delivery) return "Ambos";
    if (delivery) return "Entregas";
    if (ride) return "Corridas";
    return "Sem modo ativo";
  }, [driverData]);

  const radius = formatValue(driverData?.search_radius_km ?? driverData?.max_search_radius_km);
  const neighborhoods = formatValue(driverData?.service_neighborhoods ?? driverData?.neighborhoods);
  const hours = formatValue(driverData?.working_hours ?? driverData?.availability_hours);
  const lastLocation = formatValue(driverData?.current_location ? JSON.stringify(driverData.current_location) : driverData?.last_location_update);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Radio className="h-4 w-4 text-primary" />
              Disponibilidade operacional
            </CardTitle>
            <CardDescription>
              Controle online/offline, modo ativo, area de atendimento e restricoes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={shell.isDriverOnline ? "default" : "secondary"} className="gap-1">
                {shell.isDriverOnline ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                {shell.isDriverOnline ? "Online" : "Offline"}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <MapPin className="h-3 w-3" />
                {shell.isTracking ? "Disponivel" : "Indisponivel"}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Navigation2 className="h-3 w-3" />
                {modeLabel}
              </Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {[
                { label: "Raio de atendimento", value: radius },
                { label: "Bairros atendidos", value: neighborhoods },
                { label: "Horarios", value: hours },
                { label: "Ultima localizacao", value: lastLocation },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-border bg-background p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            {shell.gpsError ? (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                {shell.gpsError}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button onClick={shell.toggleDriverOnline} className="gap-2" disabled={shell.isUpdatingStatus}>
                {shell.isDriverOnline ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                {shell.isDriverOnline ? "Ficar offline" : "Ficar online"}
              </Button>
              <Button variant="outline" onClick={() => navigate(getProfileMobilitySectionPath("cadastro"))}>
                Revisar cadastro
              </Button>
              <Button variant="outline" onClick={() => navigate(getProfileMobilitySectionPath("corridas"))}>
                Ver corridas
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock3 className="h-4 w-4 text-primary" />
              Estado atual
            </CardTitle>
            <CardDescription>
              Leitura rapida da disponibilidade atual.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-border bg-background p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Sessao</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {identity.driverProfileId ? "Perfil operacional encontrado" : "Perfil operacional ausente"}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Modo ativo</p>
              <p className="mt-1 text-sm font-medium text-foreground">{modeLabel}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Entrega</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {driverData?.can_do_delivery ? "Pode receber entregas" : "Nao habilitado para entregas"}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Corridas</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {driverData?.can_do_rides === false ? "Nao habilitado para corridas" : "Pode receber corridas"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm">Online / Offline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {shell.isDriverOnline ? "Perfil online e apto a receber solicitações" : "Perfil offline, sem novas solicitações"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm">Area de atendimento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure raio, bairros e horarios conforme sua operacao.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm">Modo ativo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {modeLabel}. Se houver corridas e entregas habilitadas, o marketplace pode ofertar ambos.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
