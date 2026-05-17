import { DriverProfileLayout } from "@/core/mobility/components/driver/DriverProfileLayout";

/**
 * CentralMotoristaCadastroPage
 * 
 * PÃ¡gina de cadastro de motorista na Central (/central/motorista/cadastro).
 * Renderiza o componente compartilhado DriverProfileLayout com service="motorista".
 * 
 * Esta pÃ¡gina renderiza o conteÃºdo real da rota canÃ´nica da Central.
 */
export default function CentralMotoristaCadastroPage() {
  return <DriverProfileLayout service="motorista" />;
}
