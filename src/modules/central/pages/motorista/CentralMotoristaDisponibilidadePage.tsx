import { DriverAvailabilityLayout } from "@/modules/mobility/components/driver/DriverAvailabilityLayout";

/**
 * CentralMotoristaDisponibilidadePage
 * 
 * Página de disponibilidade de motorista na Central (/central/motorista/disponibilidade).
 * Renderiza o componente compartilhado DriverAvailabilityLayout com service="motorista".
 * 
 * Esta página não é mais um wrapper - ela renderiza o conteúdo real.
 * O componente compartilhado DriverAvailabilityLayout também é usado pela página legada
 * /perfil/mobilidade/motorista/disponibilidade para evitar duplicação de regra.
 */
export default function CentralMotoristaDisponibilidadePage() {
  return <DriverAvailabilityLayout service="motorista" />;
}
