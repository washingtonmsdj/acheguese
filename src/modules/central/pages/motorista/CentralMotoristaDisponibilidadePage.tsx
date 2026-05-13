import { DriverAvailabilityLayout } from "@/modules/mobility/components/driver/DriverAvailabilityLayout";

/**
 * CentralMotoristaDisponibilidadePage
 * 
 * PÃ¡gina de disponibilidade de motorista na Central (/central/motorista/disponibilidade).
 * Renderiza o componente compartilhado DriverAvailabilityLayout com service="motorista".
 * 
 * Esta página renderiza o conteúdo real da rota canônica da Central.
 */
export default function CentralMotoristaDisponibilidadePage() {
  return <DriverAvailabilityLayout service="motorista" />;
}
