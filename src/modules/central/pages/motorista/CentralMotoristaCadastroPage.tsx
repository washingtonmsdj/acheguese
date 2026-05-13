import { DriverProfileLayout } from "@/modules/mobility/components/driver/DriverProfileLayout";

/**
 * CentralMotoristaCadastroPage
 * 
 * PÃ¡gina de cadastro de motorista na Central (/central/motorista/cadastro).
 * Renderiza o componente compartilhado DriverProfileLayout com service="motorista".
 * 
 * Esta página renderiza o conteúdo real da rota canônica da Central.
 */
export default function CentralMotoristaCadastroPage() {
  return <DriverProfileLayout service="motorista" />;
}
