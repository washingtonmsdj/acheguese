import { DriverAvailabilityLayout } from "@/core/mobility/components/driver/DriverAvailabilityLayout";

/**
 * CentralMotoristaDisponibilidadePage
 *
 * Pagina de disponibilidade de motorista na Central (/central/motorista/disponibilidade).
 * Renderiza o componente compartilhado DriverAvailabilityLayout com service="motorista".
 *
 * Esta pagina renderiza o conteudo real da rota canonica da Central.
 */
export default function CentralMotoristaDisponibilidadePage() {
  return <DriverAvailabilityLayout service="motorista" />;
}
