import { FileText, MapPin, Package, Wallet } from "lucide-react";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { CentralMobilityHubPage } from "@/modules/central/components/CentralMobilityHubPage";

export default function CentralMotoboyPage() {
  const appUrls = useAppUrls();

  return (
    <CentralMobilityHubPage
      queryScope="central-motoboy"
      title="Motoboy"
      profileNoun="motoboy"
      emptyIcon={Package}
      registrationPath={appUrls.profile.mobilidade.motoboy.cadastro}
      primaryActionLabel="Cadastrar como motoboy"
      activationMode="delivery"
      actions={[
        { label: "Cadastro", icon: FileText, to: appUrls.profile.mobilidade.motoboy.cadastro },
        { label: "Disponibilidade", icon: MapPin, to: appUrls.profile.mobilidade.motoboy.disponibilidade },
        { label: "Entregas", icon: Package, to: appUrls.profile.mobilidade.motoboy.entregas },
        { label: "Ganhos", icon: Wallet, to: appUrls.profile.mobilidade.motoboy.ganhos },
      ]}
    />
  );
}
