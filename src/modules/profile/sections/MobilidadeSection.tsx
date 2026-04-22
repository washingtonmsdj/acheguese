/**
 * MobilidadeSection - Secao de mobilidade do perfil
 * SSOT: componente isolado com props tipadas.
 */

import { ArrowRight, Car } from "lucide-react";
import { SectionFrame, HubLinkCard, EmptyPanel } from "@/modules/profile/components/hub";
import { ProfileActiveRideCard } from "@/modules/profile/components/ProfileActiveRideCard";
import {
  DriverOperationalSnapshotCard,
  DriverVehicleDetailsCard,
} from "@/modules/profile/components/cards";

import type { MobilidadeSectionProps } from "./types";
import type { Tables } from "@/core/supabase";

type DriverDataRecord = Tables<"driver_data">;

export function MobilidadeSection({
  hasDriverProfile,
  driverProfile,
  driverData,
  driverDataLoading,
  operations,
  hasActiveRide,
  activeRide,
  navigate,
  appUrls,
}: MobilidadeSectionProps) {
  const driverSnapshot = driverData as DriverDataRecord | null;
  const driverDisplayName = driverProfile?.display_name || "Perfil de motorista";

  return (
    <div className="space-y-6">
      <SectionFrame
        title="Motorista e mobilidade"
        description="Dados e acoes de mobilidade sem misturar conteudo de outros modulos."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <HubLinkCard
            icon={Car}
            title={hasDriverProfile ? "Perfil de motorista" : "Central de mobilidade"}
            description={
              hasDriverProfile
                ? "Acesse o perfil de motorista e configuracoes de operacao."
                : "Acesse mobilidade como passageiro."
            }
            onClick={() =>
              navigate(
                hasDriverProfile ? appUrls.mobility.driverProfile : appUrls.mobility.passenger,
              )
            }
          />
          <HubLinkCard
            icon={ArrowRight}
            title="Historico de corridas"
            description="Consulte corridas anteriores e estado operacional."
            badge={operations.ridesTotal > 0 ? `${operations.ridesTotal}` : undefined}
            onClick={() => navigate(appUrls.mobility.history)}
          />
          <HubLinkCard
            icon={ArrowRight}
            title="Abrir central de mobilidade"
            description="Acesse busca de corridas, acompanhamento e operacao em tempo real."
            onClick={() => navigate(appUrls.mobility.home)}
          />
        </div>
      </SectionFrame>

      {hasDriverProfile ? (
        driverDataLoading ? (
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Carregando dados do motorista...
            </div>
          </div>
        ) : driverSnapshot ? (
          <SectionFrame
            title="Dados do perfil de motorista"
            description="Snapshot operacional com status, veiculo e documentacao do motorista."
          >
            <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
              <DriverOperationalSnapshotCard
                driverDisplayName={driverDisplayName}
                driverSnapshot={driverSnapshot}
              />

              <div className="space-y-4">
                <DriverVehicleDetailsCard driverSnapshot={driverSnapshot} />
              </div>
            </div>
          </SectionFrame>
        ) : (
          <EmptyPanel
            title="Perfil de motorista incompleto"
            description="Existe perfil de motorista, mas os dados operacionais ainda nao estao completos."
            actionLabel="Completar perfil de motorista"
            onAction={() => navigate(appUrls.mobility.driverProfile)}
          />
        )
      ) : (
        <EmptyPanel
          title="Motorista nao ativado"
          description="Ainda nao existe perfil de motorista vinculado para mostrar dados de veiculo e operacao."
          actionLabel="Ativar perfil de motorista"
          onAction={() => navigate(appUrls.mobility.driver)}
        />
      )}

      {hasActiveRide && activeRide ? (
        <ProfileActiveRideCard ride={activeRide as any} />
      ) : (
        <EmptyPanel
          title="Nenhuma corrida ativa"
          description="Nao ha corrida em andamento para o perfil ativo no momento."
          actionLabel="Abrir mobilidade"
          onAction={() => navigate(appUrls.mobility.home)}
        />
      )}
    </div>
  );
}
