import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Clock3, MapPin, Navigation2, Radio, ToggleLeft, ToggleRight } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { useMotoristaPageV2 } from "@/modules/mobility/hooks/useMotoristaPageV2";
import { getProfileMobilityServicePath } from "@/modules/profile/utils/profileMobilityNavigation";

export interface DriverAvailabilityLayoutProps {
  /**
   * Tipo de serviço: "motorista" ou "motoboy"
   */
  service: "motorista" | "motoboy";
}

function formatValue(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return `${value}`;
  return "Nao informado";
}

/**
 * DriverAvailabilityLayout
 * 
 * Layout compartilhado para página de disponibilidade de motorista/motoboy.
 * Reutiliza o hook useMotoristaPageV2 e o layout da página legada.
 * 
 * Este componente renderiza o mesmo layout que as páginas legadas
 * /perfil/mobilidade/motorista/disponibilidade e /perfil/mobilidade/motoboy/disponibilidade.
 */
export function DriverAvailabilityLayout({ service }: DriverAvailabilityLayoutProps) {
  const navigate = useNavigate();
  const shell = useMotoristaPageV2();

  const driverData = shell.driverData as any;
  const isMotorista = service === "motorista";
  
  const modeLabel = useMemo(
    () => isMotorista 
      ? (driverData?.can_do_rides === false ? "Corridas desabilitadas" : "Corridas habilitadas")
      : (driverData?.can_do_delivery ? "Entregas habilitadas" : "Entregas desabilitadas"),
    [driverData, isMotorista],
  );

  const radius = formatValue(driverData?.search_radius_km ?? driverData?.max_search_radius_km);
  const neighborhoods = formatValue(driverData?.service_neighborhoods ?? driverData?.neighborhoods);
  const hours = formatValue(driverData?.working_hours ?? driverData?.availability_hours);
  const lastLocation = formatValue(driverData?.current_location ? JSON.stringify(driverData.current_location) : driverData?.last_location_update);

  const title = isMotorista ? "Disponibilidade de Motorista" : "Disponibilidade de Motoboy";
  const description = isMotorista 
    ? "Controle online/offline para corridas de passageiros."
    : "Controle online/offline para entregas de pedidos e produtos.";
  const stateDescription = isMotorista 
    ? "Leitura rapida da disponibilidade para corridas."
    : "Leitura rapida da disponibilidade para entregas.";
  const profileLabel = isMotorista ? "motorista" : "motoboy";
  const profileStatus = shell.driverProfileId 
    ? `Perfil de ${profileLabel} encontrado` 
    : `Perfil de ${profileLabel} ausente`;
  const actionLabel = isMotorista ? "Ver corridas" : "Ver entregas";
  const actionSection = isMotorista ? "corridas" : "entregas";
  const otherServiceLabel = isMotorista ? "entregas" : "corridas";
  const otherServiceMessage = isMotorista 
    ? "Configure entregas apenas na area Motoboy."
    : "Configure corridas apenas na area Motorista.";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Radio className="h-4 w-4 text-primary" />
              {title}
            </CardTitle>
            <CardDescription>
              {description}
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
              <Button variant="outline" onClick={() => navigate(getProfileMobilityServicePath(service, actionSection))}>
                {actionLabel}
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
            <CardDescription>{stateDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-border bg-background p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Perfil</p>
              <p className="mt-1 text-sm font-medium text-foreground">{profileStatus}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{isMotorista ? "Corridas" : "Entregas"}</p>
              <p className="mt-1 text-sm font-medium text-foreground">{modeLabel}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{otherServiceLabel}</p>
              <p className="mt-1 text-sm font-medium text-foreground">{otherServiceMessage}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
