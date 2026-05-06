import { DriverEarningsLayout } from "@/modules/mobility/components/driver/DriverEarningsLayout";

/**
 * CentralMotoristaGanhosPage
 * 
 * Página de ganhos de motorista na Central (/central/motorista/ganhos).
 * Renderiza o componente compartilhado DriverEarningsLayout com service="motorista".
 * 
 * Esta página não é mais um wrapper - ela renderiza o conteúdo real.
 * O componente compartilhado DriverEarningsLayout também é usado pela página legada
 * /perfil/mobilidade/motorista/ganhos para evitar duplicação de regra.
 */
export default function CentralMotoristaGanhosPage() {
  return <DriverEarningsLayout service="motorista" />;
}
