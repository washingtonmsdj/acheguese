import { Car, FileText, MapPin, Route, Wallet } from "lucide-react";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { CentralMobilityHubPage } from "@/modules/central/components/CentralMobilityHubPage";

export default function CentralMotoristaPage() {
  const appUrls = useAppUrls();

  return (
    <CentralMobilityHubPage
      queryScope="central-motorista"
      title="Motorista"
      profileNoun="motorista"
      emptyIcon={Car}
      registrationPath={appUrls.profile.mobilidade.motorista.cadastro}
      primaryActionLabel="Cadastrar como motorista"
      activationMode="rides"
      actions={[
        { label: "Cadastro", icon: FileText, to: appUrls.profile.mobilidade.motorista.cadastro },
        { label: "Disponibilidade", icon: MapPin, to: appUrls.profile.mobilidade.motorista.disponibilidade },
        { label: "Corridas", icon: Route, to: appUrls.profile.mobilidade.motorista.corridas },
        { label: "Ganhos", icon: Wallet, to: appUrls.profile.mobilidade.motorista.ganhos },
      ]}
    />
  );
}
