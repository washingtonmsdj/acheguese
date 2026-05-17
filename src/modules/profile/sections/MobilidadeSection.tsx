/**
 * MobilidadeSection - Secao de mobilidade do perfil
 * SSOT: componente isolado com props tipadas.
 */

import { ArrowRight, Bike, Car } from "lucide-react";
import { SectionFrame, HubLinkCard, EmptyPanel } from "@/modules/profile/components/hub";
import { ProfileActiveRideCard } from "@/modules/profile/components/ProfileActiveRideCard";
import {
  DriverOperationalSnapshotCard,
  DriverVehicleDetailsCard,
} from "@/core/profile/components/cards";

import type { MobilidadeSectionProps } from "./types";
import type { Tables } from "@/core/infrastructure/supabase";
import { getMobilityServiceStatus } from "@/core/profile/utils/mobilityServiceStatus";
import type { MobilityRide } from "@/core/mobility/components/driver/DriverRidesTab";

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
  const driverDisplayName = driverProfile?.display_name || "Perfil operacional";

  const motoristaStatus = getMobilityServiceStatus({
    driverProfileId: driverProfile?.id ?? null,
    driverData: driverSnapshot,
    service: "motorista",
  });

  const motoboyStatus = getMobilityServiceStatus({
    driverProfileId: driverProfile?.id ?? null,
    driverData: driverSnapshot,
    service: "motoboy",
  });

  return (
    <div className="space-y-6">
      <SectionFrame
        title="Mobilidade"
        description="Motorista e Motoboy sao servicos separados dentro da secao geral de mobilidade."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <HubLinkCard
            icon={Car}
            title="Motorista"
            description={`Corridas de passageiros. Status: ${motoristaStatus}.`}
            onClick={() => navigate(appUrls.profile.mobilidade.motorista.home)}
          />
          <HubLinkCard
            icon={Bike}
            title="Motoboy"
            description={`Entregas de produtos e pedidos. Status: ${motoboyStatus}.`}
            onClick={() => navigate(appUrls.profile.mobilidade.motoboy.home)}
          />
          <HubLinkCard
            icon={ArrowRight}
            title="Abrir hub de mobilidade"
            description="Acessar a visao geral da mobilidade com os dois servicos separados."
            badge={operations.ridesTotal > 0 ? `${operations.ridesTotal}` : undefined}
            onClick={() => navigate(appUrls.profile.mobilidade.home)}
          />
        </div>
      </SectionFrame>

      {hasDriverProfile ? (
        driverDataLoading ? (
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Carregando dados operacionais...
            </div>
          </div>
        ) : driverSnapshot ? (
          <SectionFrame
            title="Dados operacionais compartilhados"
            description="Base comum de mobilidade usada por motorista e motoboy sem duplicacao desnecessaria."
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
            title="Perfil operacional incompleto"
            description="Existe perfil de mobilidade, mas os dados comuns ainda nao estao completos."
            actionLabel="Completar cadastro"
            onAction={() => navigate(appUrls.profile.mobilidade.motorista.cadastro)}
          />
        )
      ) : (
        <EmptyPanel
          title="Mobilidade nao ativada"
          description="Ainda nao existe perfil operacional vinculado para motorista ou motoboy."
          actionLabel="Abrir cadastro de motorista"
          onAction={() => navigate(appUrls.profile.mobilidade.motorista.cadastro)}
        />
      )}

      {hasActiveRide && activeRide ? (
        <ProfileActiveRideCard ride={activeRide as MobilityRide} />
      ) : (
        <EmptyPanel
          title="Nenhuma operacao ativa"
          description="Nao ha corrida nem entrega em andamento para o perfil ativo no momento."
          actionLabel="Abrir mobilidade"
          onAction={() => navigate(appUrls.profile.mobilidade.home)}
        />
      )}
    </div>
  );
}

