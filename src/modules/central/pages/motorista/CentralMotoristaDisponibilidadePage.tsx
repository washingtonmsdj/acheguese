import { DriverAvailabilityLayout } from "@/core/mobility/components/driver/DriverAvailabilityLayout";

/**
 * CentralMotoristaDisponibilidadePage
 * 
 * PÃ¡gina de disponibilidade de motorista na Central (/central/motorista/disponibilidade).
 * Renderiza o componente compartilhado DriverAvailabilityLayout com service="motorista".
 * 
 * Esta pÃ¡gina renderiza o conteÃºdo real da rota canÃ´nica da Central.
 */
export default function CentralMotoristaDisponibilidadePage() {
  return <DriverAvailabilityLayout service="motorista" />;
}
