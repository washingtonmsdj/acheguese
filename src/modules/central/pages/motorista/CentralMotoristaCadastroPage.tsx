import { DriverProfileLayout } from "@/modules/mobility/components/driver/DriverProfileLayout";

/**
 * CentralMotoristaCadastroPage
 * 
 * Página de cadastro de motorista na Central (/central/motorista/cadastro).
 * Renderiza o componente compartilhado DriverProfileLayout com service="motorista".
 * 
 * Esta página não é mais um wrapper - ela renderiza o conteúdo real.
 * O componente compartilhado DriverProfileLayout também é usado pela página legada
 * /perfil/mobilidade/motorista/cadastro para evitar duplicação de regra.
 */
export default function CentralMotoristaCadastroPage() {
  return <DriverProfileLayout service="motorista" />;
}
