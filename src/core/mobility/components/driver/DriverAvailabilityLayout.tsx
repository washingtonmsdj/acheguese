import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Clock3, MapPin, Navigation2, Radio, ToggleLeft, ToggleRight } from "lucide-react";

import { useMotoristaPage } from "@/core/mobility/hooks/useMotoristaPage";
import { getMobilityServicePath } from "@/core/mobility/routes/mobilityNavigation";
import { useServiceAreas } from "@/core/service-areas";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";

export interface DriverAvailabilityLayoutProps {
  /**
   * Tipo de servico: "motorista" ou "motoboy"
   */
  service: "motorista" | "motoboy";
}

function formatTimestamp(value: unknown): string {
  if (typeof value !== "string" || !value) return "Sem atualizacao registrada";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Sem atualizacao registrada";
  return parsed.toLocaleString("pt-BR");
}

/**
 * DriverAvailabilityLayout
 *
 * Layout compartilhado para pagina de disponibilidade de motorista/motoboy.
 * Reutiliza o hook useMotoristaPage e o layout operacional canonico.
 *
 * Este componente renderiza o layout das rotas operacionais da Central.
 * /central/motorista/disponibilidade e /central/motoboy/disponibilidade.
 */
export function DriverAvailabilityLayout({ service }: DriverAvailabilityLayoutProps) {
  const navigate = useNavigate();
  const shell = useMotoristaPage();

  const driverData = shell.driverData as Record<string, unknown> | null;
  const isMotorista = service === "motorista";
  const {
    data: serviceAreas = [],
    isLoading: serviceAreasLoading,
    error: serviceAreasError,
  } = useServiceAreas(shell.driverProfileId ?? "");

  const modeLabel = useMemo(
    () => isMotorista
      ? (driverData?.can_do_rides === false ? "Corridas desabilitadas" : "Corridas habilitadas")
      : (driverData?.can_do_delivery ? "Entregas habilitadas" : "Entregas desabilitadas"),
    [driverData, isMotorista],
  );

  const activeServiceAreas = serviceAreas.filter((area) => area.is_active);
  const primaryServiceArea =
    activeServiceAreas.find((area) => area.is_primary) ?? activeServiceAreas[0] ?? null;
  const coverageSummary = serviceAreasLoading
    ? "Carregando cobertura"
    : serviceAreasError
      ? "Cobertura indisponivel"
      : primaryServiceArea?.location_full_name ?? "Nenhuma area configurada";
  const coverageMode = primaryServiceArea?.radius_km != null
    ? `${primaryServiceArea.radius_km} km de raio`
    : primaryServiceArea
      ? "Cobertura territorial"
      : "Nao configurado";
  const activeAreasSummary = activeServiceAreas.length > 0
    ? `${activeServiceAreas.length} ${activeServiceAreas.length === 1 ? "area ativa" : "areas ativas"}`
    : "Nenhuma area ativa";
  const lastLocationUpdate = formatTimestamp(driverData?.last_location_update);

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
  const otherServiceLabel = isMotorista ? "entregas" : "corridas";
  const otherServiceMessage = isMotorista
    ? "Configure entregas apenas na area Motoboy."
    : "Configure corridas apenas na area Motorista.";
  const operationalMode = isMotorista ? "ride" : "motoboy";
  const serviceEnabled = isMotorista
    ? driverData?.can_do_rides !== false
    : driverData?.can_do_delivery === true;
  const serviceBlockMessage = isMotorista
    ? "Corridas estao desabilitadas para este perfil."
    : "Entregas estao desabilitadas para este perfil.";

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
                { label: "Cobertura principal", value: coverageSummary },
                { label: "Modelo de cobertura", value: coverageMode },
                { label: "Areas de atuacao", value: activeAreasSummary },
                { label: "Ultima atualizacao GPS", value: lastLocationUpdate },
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

            {!serviceEnabled ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {serviceBlockMessage}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => shell.toggleDriverOnline(operationalMode)}
                className="gap-2"
                disabled={shell.isUpdatingStatus || (!shell.isDriverOnline && !serviceEnabled)}
              >
                {shell.isDriverOnline ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                {shell.isDriverOnline ? "Ficar offline" : "Ficar online"}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    service === "motorista"
                      ? getMobilityServicePath("motorista", "corridas")
                      : getMobilityServicePath("motoboy", "entregas"),
                  )
                }
              >
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
