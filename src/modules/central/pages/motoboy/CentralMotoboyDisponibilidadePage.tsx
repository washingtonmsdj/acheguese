import { DriverAvailabilityLayout } from "@/core/mobility/components/driver";

/**
 * CentralMotoboyDisponibilidadePage
 *
 * Pagina de disponibilidade de motoboy na Central (/central/motoboy/disponibilidade).
 * Renderiza o componente compartilhado DriverAvailabilityLayout com service="motoboy".
 *
 * Esta pagina renderiza o conteudo real da rota canonica da Central.
 */
export default function CentralMotoboyDisponibilidadePage() {
  return <DriverAvailabilityLayout service="motoboy" />;
}
